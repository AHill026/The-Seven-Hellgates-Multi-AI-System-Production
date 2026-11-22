/**
 * THE SEVEN HELLGATES — Express Full-Stack Server & Secure Voice Proxy
 *
 * - Keeps ELEVENLABS_API_KEY strictly server-side (never exposed to browser)
 * - Serves /api/voice/health and /api/voice/synthesize with SHA-256 memory + disk caching
 * - Gracefully signals fallback when provider credentials are unconfigured or unavailable
 * - Mounts Vite middlewares in development and serves dist/ in production on port 3000
 */

import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const CACHE_DIR = path.resolve(__dirname, '.cache', 'voice');
const MAX_MEMORY_CACHE_ENTRIES = 160;
const ALLOWED_MODEL_DEFAULT = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}

const memoryAudioCache = new Map<string, CacheEntry>();

function ensureCacheDir() {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch {
    // Non-fatal if filesystem is read-only; memory cache still works
  }
}

function getCacheKey(payload: {
  voiceId: string;
  modelId: string;
  text: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  useSpeakerBoost: boolean;
}): string {
  const normalized = JSON.stringify(payload);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function setMemoryCache(key: string, entry: CacheEntry) {
  if (memoryAudioCache.has(key)) {
    memoryAudioCache.delete(key);
  }
  memoryAudioCache.set(key, entry);
  if (memoryAudioCache.size > MAX_MEMORY_CACHE_ENTRIES) {
    const oldestKey = memoryAudioCache.keys().next().value;
    if (oldestKey) {
      memoryAudioCache.delete(oldestKey);
    }
  }
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  ensureCacheDir();

  app.get('/api/voice/health', (_req: Request, res: Response) => {
    const configured = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim().length > 0);
    res.json({
      provider: 'elevenlabs',
      configured,
      modelId: ALLOWED_MODEL_DEFAULT,
      cacheEntries: memoryAudioCache.size,
    });
  });

  app.post('/api/voice/synthesize', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const rawText = typeof body.text === 'string' ? body.text.trim() : '';
      const voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : '';
      const modelId =
        typeof body.modelId === 'string' && body.modelId.trim().length > 0
          ? body.modelId.trim()
          : ALLOWED_MODEL_DEFAULT;

      if (!rawText || !voiceId || !/^[A-Za-z0-9_-]{6,64}$/.test(voiceId)) {
        res.status(400).json({ fallback: true, reason: 'invalid_voice_request' });
        return;
      }

      if (rawText.length > 900) {
        res.status(400).json({ fallback: true, reason: 'text_too_long' });
        return;
      }

      const rawSettings = (body.voiceSettings || {}) as Record<string, unknown>;
      const clamp01 = (v: unknown, def: number) =>
        typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : def;
      const clampSpeed = (v: unknown, def: number) =>
        typeof v === 'number' && Number.isFinite(v) ? Math.max(0.7, Math.min(1.2, v)) : def;

      const stability = clamp01(rawSettings.stability, 0.5);
      const similarityBoost = clamp01(rawSettings.similarity_boost, 0.8);
      const style = clamp01(rawSettings.style, 0.45);
      const speed = clampSpeed(rawSettings.speed, 1.0);
      const useSpeakerBoost = rawSettings.use_speaker_boost !== false;

      const cacheKey = getCacheKey({
        voiceId,
        modelId,
        text: rawText,
        stability,
        similarityBoost,
        style,
        speed,
        useSpeakerBoost,
      });

      // 1. Check in-memory LRU cache
      const memHit = memoryAudioCache.get(cacheKey);
      if (memHit) {
        setMemoryCache(cacheKey, memHit);
        res.setHeader('Content-Type', memHit.contentType);
        res.setHeader('X-Voice-Cache', 'MEMORY-HIT');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(memHit.buffer);
        return;
      }

      // 2. Check disk cache
      const diskPath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
      if (fs.existsSync(diskPath)) {
        try {
          const diskBuffer = await fs.promises.readFile(diskPath);
          if (diskBuffer.length > 128) {
            setMemoryCache(cacheKey, {
              buffer: diskBuffer,
              contentType: 'audio/mpeg',
              createdAt: Date.now(),
            });
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('X-Voice-Cache', 'DISK-HIT');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.send(diskBuffer);
            return;
          }
        } catch {
          // Fall through to synthesis if disk read fails
        }
      }

      // 3. Check server-side ElevenLabs key
      const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
      if (!apiKey || apiKey === 'MY_ELEVENLABS_API_KEY') {
        res.status(200).json({ fallback: true, reason: 'provider_not_configured' });
        return;
      }

      // 4. Call ElevenLabs Text-to-Speech API securely on server side
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      try {
        const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
        const upstream = await fetch(elevenUrl, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: rawText,
            model_id: modelId,
            voice_settings: {
              stability,
              similarity_boost: similarityBoost,
              style,
              use_speaker_boost: useSpeakerBoost,
              speed,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!upstream.ok) {
          res.status(200).json({
            fallback: true,
            reason: `upstream_status_${upstream.status}`,
          });
          return;
        }

        const arrayBuf = await upstream.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuf);
        if (audioBuffer.length < 128) {
          res.status(200).json({ fallback: true, reason: 'empty_audio_payload' });
          return;
        }

        setMemoryCache(cacheKey, {
          buffer: audioBuffer,
          contentType: 'audio/mpeg',
          createdAt: Date.now(),
        });
        fs.promises.writeFile(diskPath, audioBuffer).catch(() => {});

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('X-Voice-Cache', 'MISS');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(audioBuffer);
      } catch {
        clearTimeout(timeout);
        res.status(200).json({ fallback: true, reason: 'upstream_network_error' });
      }
    } catch {
      res.status(200).json({ fallback: true, reason: 'proxy_internal_error' });
    }
  });

  const httpServer = http.createServer(app);
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: { server: httpServer },
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return httpServer;
}

createApp().then((httpServer) => {
  httpServer.listen(PORT, HOST, () => {
    console.log(`[Server] The Seven Hellgates listening on http://${HOST}:${PORT}`);
  });
});
