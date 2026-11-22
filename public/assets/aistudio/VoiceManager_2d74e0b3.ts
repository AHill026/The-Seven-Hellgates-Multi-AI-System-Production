/**
 * THE SEVEN HELLGATES — Complete Expressive Voice Acting & Dialogue Manager
 *
 * Orchestrates:
 * - Realistic server-proxied ElevenLabs expressive speech generation (with Hollow King permanently
 *   locked to Victor Voice ID cPoqAvGWCPfCfyPMwe4z)
 * - Natural multi-clause expressive Web Speech fallback with breath phrasing & pronunciation dictionary
 * - Full Web Audio DSP processing (parallel room/cavern/arena/void reverb, warmth & clarity EQ,
 *   loudness normalization compressor, controlled grit, demonic sub-layer, 3D stereo panning)
 * - Clean original AudioBuffer LRU caching, background realm preloading, and realm cleanup
 * - Priority preemption, anti-overlap async token guards, and cooldown throttling
 */

import * as THREE from 'three';
import { audioManager } from '../../audio/audio-manager';
import {
  AZRAEL_EMOTION_MODIFIERS,
  AZRAEL_EXHAUSTION_LINES,
  AZRAEL_MEMORY_LINES,
  AZRAEL_PAIN_LINES,
  AZRAEL_REALM_ENTER_LINES,
  AZRAEL_SPECIAL_ATTACK_LINES,
  AZRAEL_VICTORY_LINES,
  AZRAEL_WRATH_LINES,
  AzraelEmotion,
  BOSS_INTRO_SCRIPTS,
  BOSS_PHASE_SCRIPTS,
  BossIntroLineCue,
  ElevenLabsVoiceConfig,
  EmotionModifier,
  FallbackSpeechConfig,
  HOLLOW_KING_ELEVENLABS_VOICE_ID,
  MINI_BOSS_BARKS,
  PRONUNCIATION_DICTIONARY,
  PsychoticMannerism,
  REALM_TO_BOSS_VOICE,
  VOICE_ACTOR_PROFILES,
  VoiceActorProfile,
  VoiceCharacterId,
  VoiceDSPConfig,
  VoiceIntensity,
  VoiceReverbPreset,
  WHITE_EYED_GOD_WHISPER,
  applyPronunciationDictionary,
} from './VoiceRegistry';
import {
  PlaybackHandle,
  SpatialVoiceParams,
  VoiceDSPProcessor,
} from './VoiceProcessing';

export type {
  AzraelEmotion,
  BossIntroLineCue,
  ElevenLabsVoiceConfig,
  EmotionModifier,
  FallbackSpeechConfig,
  PsychoticMannerism,
  SpatialVoiceParams,
  VoiceActorProfile,
  VoiceCharacterId,
  VoiceDSPConfig,
  VoiceIntensity,
  VoiceReverbPreset,
};

export {
  AZRAEL_EMOTION_MODIFIERS,
  AZRAEL_EXHAUSTION_LINES,
  AZRAEL_MEMORY_LINES,
  AZRAEL_PAIN_LINES,
  AZRAEL_REALM_ENTER_LINES,
  AZRAEL_SPECIAL_ATTACK_LINES,
  AZRAEL_VICTORY_LINES,
  AZRAEL_WRATH_LINES,
  BOSS_INTRO_SCRIPTS,
  BOSS_PHASE_SCRIPTS,
  HOLLOW_KING_ELEVENLABS_VOICE_ID,
  MINI_BOSS_BARKS,
  PRONUNCIATION_DICTIONARY,
  REALM_TO_BOSS_VOICE,
  VOICE_ACTOR_PROFILES,
  WHITE_EYED_GOD_WHISPER,
  applyPronunciationDictionary,
};

export type VoicePriority = 'cutscene' | 'phase' | 'story' | 'combat';

const PRIORITY_WEIGHT: Record<VoicePriority, number> = {
  combat: 1,
  story: 2,
  phase: 3,
  cutscene: 4,
};

interface IntensityTuning {
  stabilityDelta: number;
  styleDelta: number;
  speedMult: number;
  pitchMult: number;
  pauseMult: number;
  gritBoost: number;
  breathBoost: number;
}

const INTENSITY_MODIFIERS: Record<VoiceIntensity, IntensityTuning> = {
  whisper: {
    stabilityDelta: -0.06,
    styleDelta: 0.06,
    speedMult: 0.88,
    pitchMult: 0.96,
    pauseMult: 1.35,
    gritBoost: 0.0,
    breathBoost: 0.1,
  },
  calm: {
    stabilityDelta: 0.08,
    styleDelta: -0.04,
    speedMult: 0.94,
    pitchMult: 0.99,
    pauseMult: 1.18,
    gritBoost: 0.0,
    breathBoost: 0.02,
  },
  normal: {
    stabilityDelta: 0.0,
    styleDelta: 0.0,
    speedMult: 1.0,
    pitchMult: 1.0,
    pauseMult: 1.0,
    gritBoost: 0.0,
    breathBoost: 0.0,
  },
  intense: {
    stabilityDelta: -0.05,
    styleDelta: 0.14,
    speedMult: 1.02,
    pitchMult: 0.98,
    pauseMult: 0.9,
    gritBoost: 0.05,
    breathBoost: 0.03,
  },
  furious: {
    stabilityDelta: -0.14,
    styleDelta: 0.24,
    speedMult: 1.08,
    pitchMult: 0.94,
    pauseMult: 0.78,
    gritBoost: 0.12,
    breathBoost: 0.06,
  },
  breaking: {
    stabilityDelta: -0.18,
    styleDelta: 0.2,
    speedMult: 0.88,
    pitchMult: 0.9,
    pauseMult: 1.38,
    gritBoost: 0.08,
    breathBoost: 0.12,
  },
};

export interface VoiceSubtitleState {
  character: VoiceCharacterId;
  speaker: string;
  speakerTitle?: string;
  text: string;
  accentColor: string;
  emotion?: AzraelEmotion;
  intensity?: VoiceIntensity;
}

export interface VoicePlayOptions {
  character: VoiceCharacterId;
  text: string;
  speaker?: string;
  speakerTitle?: string;
  duration?: number;
  priority?: VoicePriority;
  emotion?: AzraelEmotion;
  intensity?: VoiceIntensity;
  position?: THREE.Vector3;
  listenerPos?: THREE.Vector3;
  listenerYaw?: number;
  minGapSec?: number;
  realmTag?: number;
}

interface CachedAudioItem {
  buffer: AudioBuffer;
  realmTag: number;
  lastUsedAt: number;
}

const MAX_CLIENT_AUDIO_CACHE = 64;

/**
 * Splits dialogue into natural dramatic clauses so Web Speech fallback delivers
 * varied cadence and realistic pauses instead of a flat single-breath read.
 */
export function splitIntoExpressiveClauses(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  // Split after sentence/clause delimiters while preserving punctuation
  const rawParts = normalized
    .split(/(?<=[.!?…]|[—–]+|,\s+|;\s+|:\s+)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawParts.length <= 1) return rawParts;

  // Merge overly tiny fragments (<= 2 words) with neighbor so speech flows naturally
  const merged: string[] = [];
  for (const part of rawParts) {
    const wordCount = part.split(/\s+/).filter(Boolean).length;
    if (merged.length > 0 && wordCount <= 1 && !/[!?…]$/.test(merged[merged.length - 1])) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${part}`;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class VoiceManager {
  private activeSubtitle: VoiceSubtitleState | null = null;
  private subtitleTimer: number = 0;
  private currentPriority: VoicePriority = 'combat';
  private onSubtitleChange: ((sub: VoiceSubtitleState | null) => void) | null = null;

  private scheduledTimers: number[] = [];
  private clauseTimers: number[] = [];
  private playbackSeqId: number = 0;

  private lastPlayedByChar = new Map<VoiceCharacterId, number>();
  private lastLineByChar = new Map<VoiceCharacterId, string>();
  private lastEnemyBarkMs: number = 0;

  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voicesBound: boolean = false;

  private dsp = new VoiceDSPProcessor();
  private activePlaybackHandle: PlaybackHandle | null = null;
  private activeAccompanimentStop: (() => void) | null = null;

  // Client audio buffer LRU cache (stores clean original recordings)
  private audioCache = new Map<string, CachedAudioItem>();
  private inFlightSyntheses = new Map<string, Promise<AudioBuffer | null>>();

  // Runtime mutable character profile overrides (Hollow King voiceId remains immutable)
  private profileOverrides = new Map<VoiceCharacterId, VoiceActorProfile>();

  // Server provider health ('unknown' | 'elevenlabs' | 'fallback')
  private providerState: 'unknown' | 'elevenlabs' | 'fallback' = 'unknown';
  private healthCheckStarted: boolean = false;
  private preloadQueueChain: Promise<void> = Promise.resolve();

  constructor(onSubtitleChange?: (sub: VoiceSubtitleState | null) => void) {
    this.onSubtitleChange = onSubtitleChange || null;
    this.bindSpeechVoices();
  }

  public setSubtitleListener(listener: ((sub: VoiceSubtitleState | null) => void) | null) {
    this.onSubtitleChange = listener;
  }

  public getCurrentSubtitle(): VoiceSubtitleState | null {
    return this.activeSubtitle;
  }

  public isSpeakingPriority(...priorities: VoicePriority[]): boolean {
    if (!this.activeSubtitle || this.subtitleTimer <= 0) return false;
    return priorities.includes(this.currentPriority);
  }

  public getCharacterForRealm(realmId: number): VoiceCharacterId {
    return REALM_TO_BOSS_VOICE[realmId] || 'hollow_king';
  }

  public getProfile(characterId: VoiceCharacterId): VoiceActorProfile {
    return this.profileOverrides.get(characterId) || VOICE_ACTOR_PROFILES[characterId] || VOICE_ACTOR_PROFILES.narrator;
  }

  /**
   * Allows independent runtime configuration of any character/Sovereign voice profile.
   * Enforces permanent ElevenLabs Victor Voice ID lock on The Hollow King.
   */
  public configureCharacterProfile(
    characterId: VoiceCharacterId,
    patch: {
      elevenLabs?: Partial<ElevenLabsVoiceConfig>;
      dsp?: Partial<VoiceDSPConfig>;
      fallback?: Partial<FallbackSpeechConfig>;
    }
  ): VoiceActorProfile {
    const base = this.getProfile(characterId);
    const mergedElevenLabs: ElevenLabsVoiceConfig = {
      ...base.elevenLabs,
      ...(patch.elevenLabs || {}),
    };
    if (characterId === 'hollow_king') {
      mergedElevenLabs.voiceId = HOLLOW_KING_ELEVENLABS_VOICE_ID;
      mergedElevenLabs.locked = true;
    }

    const updated: VoiceActorProfile = {
      ...base,
      elevenLabs: mergedElevenLabs,
      dsp: { ...base.dsp, ...(patch.dsp || {}) },
      fallback: { ...base.fallback, ...(patch.fallback || {}) },
    };
    this.profileOverrides.set(characterId, updated);
    return updated;
  }

  public getProviderStatus(): {
    mode: 'unknown' | 'elevenlabs' | 'fallback';
    hollowKingVoiceId: string;
    cacheEntries: number;
  } {
    return {
      mode: this.providerState,
      hollowKingVoiceId: this.getProfile('hollow_king').elevenLabs.voiceId,
      cacheEntries: this.audioCache.size,
    };
  }

  public getCacheStats(): { entries: number; maxEntries: number } {
    return { entries: this.audioCache.size, maxEntries: MAX_CLIENT_AUDIO_CACHE };
  }

  public async refreshProviderHealth(): Promise<'elevenlabs' | 'fallback'> {
    if (typeof fetch !== 'function') {
      this.providerState = 'fallback';
      return 'fallback';
    }
    try {
      const resp = await fetch('/api/voice/health', { method: 'GET' });
      if (resp.ok) {
        const data = (await resp.json()) as { configured?: boolean };
        this.providerState = data.configured ? 'elevenlabs' : 'fallback';
        return this.providerState;
      }
    } catch {
      // Offline / no backend mounted -> graceful local expressive speech
    }
    this.providerState = 'fallback';
    return 'fallback';
  }

  private ensureHealthProbe() {
    if (this.healthCheckStarted || typeof window === 'undefined') return;
    this.healthCheckStarted = true;
    void this.refreshProviderHealth();
  }

  private bindSpeechVoices() {
    if (this.voicesBound || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    this.voicesBound = true;
    const refresh = () => {
      try {
        this.cachedVoices = window.speechSynthesis.getVoices() || [];
      } catch {
        this.cachedVoices = [];
      }
    };
    refresh();
    try {
      window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
    } catch {
      // Some environments do not implement addEventListener on speechSynthesis
    }
  }

  public update(delta: number) {
    if (this.activeSubtitle) {
      this.subtitleTimer -= delta;
      if (this.subtitleTimer <= 0) {
        this.activeSubtitle = null;
        this.currentPriority = 'combat';
        this.onSubtitleChange?.(null);
      }
    }
  }

  /**
   * Computes expressive TTS parameters and formatted speech text (applying pronunciation
   * dictionary while leaving displayed subtitle text canon-accurate).
   */
  public resolveExpressiveParameters(
    profile: VoiceActorProfile,
    text: string,
    emotion?: AzraelEmotion,
    intensity?: VoiceIntensity
  ): {
    ttsText: string;
    voiceId: string;
    stability: number;
    similarityBoost: number;
    style: number;
    speed: number;
    useSpeakerBoost: boolean;
    fallbackPitch: number;
    fallbackRate: number;
    pauseMult: number;
    breathBoost: number;
    gritBoost: number;
  } {
    const emotionMod =
      emotion && (profile.id === 'azrael' || emotion !== 'calm_exploration')
        ? AZRAEL_EMOTION_MODIFIERS[emotion]
        : undefined;
    const resolvedIntensity: VoiceIntensity =
      intensity || emotionMod?.defaultIntensity || 'normal';
    const intMod = INTENSITY_MODIFIERS[resolvedIntensity];

    const stability = clamp(
      profile.elevenLabs.stability + (emotionMod?.stabilityDelta ?? 0) + intMod.stabilityDelta,
      0.12,
      0.95
    );
    const style = clamp(
      profile.elevenLabs.style + (emotionMod?.styleDelta ?? 0) + intMod.styleDelta,
      0.05,
      0.98
    );
    const speed = clamp(
      profile.elevenLabs.speed * (emotionMod?.speedMult ?? 1.0) * intMod.speedMult,
      0.72,
      1.18
    );

    const fallbackPitch = clamp(
      profile.fallback.basePitch * (emotionMod?.pitchMult ?? 1.0) * intMod.pitchMult,
      0.42,
      1.55
    );
    const fallbackRate = clamp(
      profile.fallback.baseRate * (emotionMod?.speedMult ?? 1.0) * intMod.speedMult,
      0.65,
      1.32
    );

    const pauseMult = (emotionMod?.pauseMult ?? 1.0) * intMod.pauseMult;
    const breathBoost = (emotionMod?.breathBoost ?? 0) + intMod.breathBoost;
    const gritBoost = (emotionMod?.gritBoost ?? 0) + intMod.gritBoost;

    const voiceId =
      profile.id === 'hollow_king'
        ? HOLLOW_KING_ELEVENLABS_VOICE_ID
        : profile.elevenLabs.voiceId;

    const ttsText = applyPronunciationDictionary(text);

    return {
      ttsText,
      voiceId,
      stability,
      similarityBoost: profile.elevenLabs.similarityBoost,
      style,
      speed,
      useSpeakerBoost: profile.elevenLabs.useSpeakerBoost,
      fallbackPitch,
      fallbackRate,
      pauseMult,
      breathBoost,
      gritBoost,
    };
  }

  private buildCacheKey(
    profile: VoiceActorProfile,
    params: ReturnType<VoiceManager['resolveExpressiveParameters']>
  ): string {
    return [
      profile.id,
      params.voiceId,
      params.ttsText,
      params.stability.toFixed(2),
      params.style.toFixed(2),
      params.speed.toFixed(2),
    ].join('|');
  }

  private touchCacheEntry(key: string, item: CachedAudioItem) {
    if (this.audioCache.has(key)) {
      this.audioCache.delete(key);
    }
    this.audioCache.set(key, { ...item, lastUsedAt: Date.now() });
    if (this.audioCache.size > MAX_CLIENT_AUDIO_CACHE) {
      const oldestKey = this.audioCache.keys().next().value;
      if (oldestKey) {
        this.audioCache.delete(oldestKey);
      }
    }
  }

  /**
   * Plays an expressive character-voiced line with priority handling, anti-overlap preemption,
   * server-proxied ElevenLabs synthesis + DSP processing, and expressive Web Speech fallback.
   */
  public playLine(options: VoicePlayOptions): boolean {
    this.ensureHealthProbe();
    const profile = this.getProfile(options.character);
    const priority: VoicePriority = options.priority || 'story';
    const minGapSec = options.minGapSec ?? (priority === 'combat' ? 4.5 : 0.2);

    const cleanText = options.text.replace(/^\[PROVISIONAL\]\s*/i, '').trim();
    if (!cleanText) return false;

    // 1. Priority preemption check against currently playing line
    if (this.activeSubtitle && this.subtitleTimer > 0) {
      if (PRIORITY_WEIGHT[priority] < PRIORITY_WEIGHT[this.currentPriority]) {
        return false;
      }
    }

    // 2. Cooldown & anti-spam checks for combat lines
    const nowMs = Date.now();
    if (priority === 'combat') {
      const lastMs = this.lastPlayedByChar.get(profile.id) || 0;
      if (nowMs - lastMs < minGapSec * 1000) {
        return false;
      }
      if (profile.category === 'miniboss' && nowMs - this.lastEnemyBarkMs < 9000) {
        return false;
      }
      this.lastPlayedByChar.set(profile.id, nowMs);
      if (profile.category === 'miniboss') {
        this.lastEnemyBarkMs = nowMs;
      }
    }

    const duration =
      options.duration ?? clamp(cleanText.length * 0.064 + 1.25, 2.2, 7.5);

    // 3. Interrupt active speech/audio cleanly before claiming sequence token
    this.stopActivePlayback();
    const seq = ++this.playbackSeqId;

    this.activeSubtitle = {
      character: profile.id,
      speaker: options.speaker || profile.speaker,
      speakerTitle: options.speakerTitle ?? profile.speakerTitle,
      text: cleanText,
      accentColor: profile.accentColor,
      emotion: options.emotion,
      intensity: options.intensity,
    };
    this.subtitleTimer = duration;
    this.currentPriority = priority;
    this.onSubtitleChange?.(this.activeSubtitle);

    if (audioManager.settings.isMuted) {
      return true;
    }

    const params = this.resolveExpressiveParameters(
      profile,
      cleanText,
      options.emotion,
      options.intensity
    );
    const spatial: SpatialVoiceParams | undefined =
      options.position && options.listenerPos
        ? {
            sourcePos: options.position,
            listenerPos: options.listenerPos,
            listenerYaw: options.listenerYaw,
          }
        : undefined;

    const cacheKey = this.buildCacheKey(profile, params);
    const cached = this.audioCache.get(cacheKey);
    const output = audioManager.getVoiceOutput();

    // 4. Play immediately if clean AudioBuffer is cached
    if (cached && output && output.ctx.state === 'running') {
      this.touchCacheEntry(cacheKey, cached);
      this.playCachedBuffer(seq, output.ctx, output.destination, cached.buffer, profile, params.gritBoost, spatial);
      return true;
    }

    // 5. If provider is known unconfigured or no AudioContext, use expressive fallback immediately
    if (this.providerState === 'fallback' || !output || typeof fetch !== 'function') {
      this.playExpressiveFallback(seq, cleanText, profile, params, duration, spatial);
      return true;
    }

    // 6. Attempt ElevenLabs synthesis via secure server proxy; guard against stale resolution
    void this.fetchAndDecodeAudio(cacheKey, params, options.realmTag ?? -1).then((buffer) => {
      if (seq !== this.playbackSeqId || audioManager.settings.isMuted) {
        return;
      }
      const liveOutput = audioManager.getVoiceOutput();
      if (buffer && liveOutput) {
        if (liveOutput.ctx.state === 'suspended') {
          void liveOutput.ctx.resume().catch(() => {});
        }
        this.playCachedBuffer(
          seq,
          liveOutput.ctx,
          liveOutput.destination,
          buffer,
          profile,
          params.gritBoost,
          spatial
        );
      } else {
        this.playExpressiveFallback(seq, cleanText, profile, params, duration, spatial);
      }
    });

    return true;
  }

  private playCachedBuffer(
    seq: number,
    ctx: AudioContext,
    destination: GainNode,
    buffer: AudioBuffer,
    profile: VoiceActorProfile,
    gritBoost: number,
    spatial?: SpatialVoiceParams
  ) {
    if (seq !== this.playbackSeqId) return;
    // Sync subtitle timer with real voice duration so caption stays aligned
    this.subtitleTimer = Math.max(this.subtitleTimer, buffer.duration + 0.35);
    this.activePlaybackHandle = this.dsp.playProcessedAudioBuffer(
      ctx,
      destination,
      buffer,
      profile.dsp,
      {
        volume: 1.0,
        gritBoost,
        spatial,
        onEnded: () => {
          if (seq === this.playbackSeqId) {
            this.activePlaybackHandle = null;
          }
        },
      }
    );
  }

  private async fetchAndDecodeAudio(
    cacheKey: string,
    params: ReturnType<VoiceManager['resolveExpressiveParameters']>,
    realmTag: number
  ): Promise<AudioBuffer | null> {
    const existing = this.audioCache.get(cacheKey);
    if (existing) {
      this.touchCacheEntry(cacheKey, existing);
      return existing.buffer;
    }

    const inFlight = this.inFlightSyntheses.get(cacheKey);
    if (inFlight) return inFlight;

    const promise = (async (): Promise<AudioBuffer | null> => {
      try {
        const resp = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: params.ttsText,
            voiceId: params.voiceId,
            voiceSettings: {
              stability: params.stability,
              similarity_boost: params.similarityBoost,
              style: params.style,
              speed: params.speed,
              use_speaker_boost: params.useSpeakerBoost,
            },
          }),
        });

        if (!resp.ok) {
          return null;
        }

        const contentType = (resp.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('application/json')) {
          const info = (await resp.json()) as { fallback?: boolean; reason?: string };
          if (info.reason === 'provider_not_configured') {
            this.providerState = 'fallback';
          }
          return null;
        }

        const arrayBuf = await resp.arrayBuffer();
        const output = audioManager.getVoiceOutput();
        if (!output || arrayBuf.byteLength < 128) return null;

        this.providerState = 'elevenlabs';
        const audioBuf = await output.ctx.decodeAudioData(arrayBuf.slice(0));
        this.touchCacheEntry(cacheKey, {
          buffer: audioBuf,
          realmTag,
          lastUsedAt: Date.now(),
        });
        return audioBuf;
      } catch {
        return null;
      } finally {
        this.inFlightSyntheses.delete(cacheKey);
      }
    })();

    this.inFlightSyntheses.set(cacheKey, promise);
    return promise;
  }

  // --- EXPRESSIVE MULTI-CLAUSE FALLBACK SPEECH ---

  private selectSpeechVoice(profile: VoiceActorProfile): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    if (this.cachedVoices.length === 0) {
      try {
        this.cachedVoices = window.speechSynthesis.getVoices() || [];
      } catch {
        return null;
      }
    }
    const enVoices = this.cachedVoices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    const pool = enVoices.length > 0 ? enVoices : this.cachedVoices;
    if (pool.length === 0) return null;

    for (const hint of profile.fallback.preferredVoices) {
      const match = pool.find((v) => v.name.toLowerCase().includes(hint.toLowerCase()));
      if (match) return match;
    }
    return pool[profile.fallback.fallbackSeed % pool.length] || pool[0];
  }

  private playExpressiveFallback(
    seq: number,
    cleanText: string,
    profile: VoiceActorProfile,
    params: ReturnType<VoiceManager['resolveExpressiveParameters']>,
    duration: number,
    spatial?: SpatialVoiceParams
  ) {
    if (seq !== this.playbackSeqId || audioManager.settings.isMuted) return;

    // 1. Subtle organic breath + chest warmth + mini-boss mannerism (never robotic buzzing)
    const output = audioManager.getVoiceOutput();
    if (output && output.ctx.state === 'running') {
      this.activeAccompanimentStop = this.dsp.playOrganicFallbackAccompaniment(
        output.ctx,
        output.destination,
        profile,
        Math.min(4.2, duration * 0.85),
        {
          breathBoost: params.breathBoost,
          spatial,
        }
      );
    }

    // 2. Multi-clause Web Speech cadence with natural breath pauses & pitch contour
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const clauses = splitIntoExpressiveClauses(cleanText);
    if (clauses.length === 0) return;

    const voice = this.selectSpeechVoice(profile);
    const voiceVolSetting =
      typeof audioManager.settings.voice === 'number' ? audioManager.settings.voice : 0.9;
    const spatialGain = this.dsp.computeSpatial(spatial).gain;
    const baseVolume = clamp(
      audioManager.settings.master * voiceVolSetting * spatialGain,
      0.04,
      1.0
    );

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore unavailable cancel
    }

    const speakClauseAt = (idx: number) => {
      if (seq !== this.playbackSeqId || audioManager.settings.isMuted || idx >= clauses.length) {
        return;
      }

      const rawClause = clauses[idx];
      const spokenClause = applyPronunciationDictionary(rawClause)
        .replace(/[^a-zA-Z0-9 ,.?!'—…\-]/g, '')
        .trim();

      if (!spokenClause) {
        speakClauseAt(idx + 1);
        return;
      }

      // Dynamic expressive pitch & rate contour per clause
      const progress = clauses.length > 1 ? idx / (clauses.length - 1) : 0.5;
      let contourPitch = 0;
      let contourRate = 0;

      if (rawClause.endsWith('?')) {
        contourPitch += profile.fallback.pitchVariance * 0.55;
      } else if (rawClause.endsWith('!')) {
        contourPitch += profile.fallback.pitchVariance * 0.35;
        contourRate += profile.fallback.rateVariance * 0.45;
      } else if (idx === clauses.length - 1) {
        contourPitch -= profile.fallback.pitchVariance * 0.4;
        contourRate -= profile.fallback.rateVariance * 0.3;
      } else {
        const wave = Math.sin((idx + 1) * 1.7 + progress * Math.PI);
        contourPitch += wave * profile.fallback.pitchVariance * 0.65;
        contourRate += Math.cos((idx + 1) * 1.3) * profile.fallback.rateVariance * 0.5;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(spokenClause);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || 'en-US';
        utterance.pitch = clamp(params.fallbackPitch + contourPitch, 0.3, 1.85);
        utterance.rate = clamp(params.fallbackRate + contourRate, 0.6, 1.45);
        utterance.volume = baseVolume;

        if (idx + 1 < clauses.length) {
          const pauseMs = clamp(
            Math.round(
              profile.fallback.clausePauseMs *
                params.pauseMult *
                (rawClause.includes('...') || rawClause.includes('…') ? 1.35 : 1.0)
            ),
            70,
            680
          );
          utterance.onend = () => {
            if (seq !== this.playbackSeqId) return;
            const tId = window.setTimeout(() => speakClauseAt(idx + 1), pauseMs);
            this.clauseTimers.push(tId);
          };
          utterance.onerror = () => {
            if (seq !== this.playbackSeqId) return;
            const tId = window.setTimeout(() => speakClauseAt(idx + 1), 90);
            this.clauseTimers.push(tId);
          };
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // Silent guard if browser blocks speech synthesis
      }
    };

    speakClauseAt(0);
  }

  // --- PRELOADING & MEMORY MANAGEMENT ---

  /**
   * Background-preloads key Sovereign & Azrael lines for the upcoming realm
   * when server-side ElevenLabs synthesis is active.
   */
  public preloadRealmVoices(realmId: number) {
    this.ensureHealthProbe();
    if (this.providerState !== 'elevenlabs' || typeof fetch !== 'function') {
      return;
    }

    const cues: Array<{
      character: VoiceCharacterId;
      text: string;
      emotion?: AzraelEmotion;
      intensity?: VoiceIntensity;
    }> = [];

    const enterLine = AZRAEL_REALM_ENTER_LINES[realmId];
    if (enterLine) {
      cues.push({ character: 'azrael', text: enterLine.text, emotion: enterLine.emotion });
    }

    const introScript = BOSS_INTRO_SCRIPTS[realmId];
    if (introScript) {
      for (const cue of introScript) {
        cues.push({
          character: cue.character,
          text: cue.text,
          emotion: cue.emotion,
          intensity: cue.intensity,
        });
      }
    }

    const bossChar = this.getCharacterForRealm(realmId);
    const phaseScript = BOSS_PHASE_SCRIPTS[realmId];
    if (phaseScript) {
      cues.push({ character: bossChar, text: phaseScript.phase2, intensity: 'intense' });
      cues.push({ character: bossChar, text: phaseScript.phase3, intensity: 'furious' });
    }

    for (const cue of cues) {
      const profile = this.getProfile(cue.character);
      const params = this.resolveExpressiveParameters(
        profile,
        cue.text,
        cue.emotion,
        cue.intensity
      );
      const key = this.buildCacheKey(profile, params);
      if (this.audioCache.has(key)) continue;

      this.preloadQueueChain = this.preloadQueueChain
        .then(() => this.fetchAndDecodeAudio(key, params, realmId))
        .then(() => new Promise<void>((resolve) => setTimeout(resolve, 60)))
        .catch(() => {});
    }
  }

  /**
   * Frees cached AudioBuffers belonging to other realms to bound memory footprint.
   */
  public clearRealmCache(keepRealmId?: number) {
    for (const [key, item] of this.audioCache.entries()) {
      if (item.realmTag !== -1 && (keepRealmId === undefined || item.realmTag !== keepRealmId)) {
        this.audioCache.delete(key);
      }
    }
  }

  // --- GAMEPLAY EVENT TRIGGERS ---

  public playBossIntroDialogue(realmId: number) {
    this.stopAll();
    this.preloadRealmVoices(realmId);
    const cues = BOSS_INTRO_SCRIPTS[realmId] || BOSS_INTRO_SCRIPTS[1];
    cues.forEach((cue) => {
      const delayMs = Math.max(0, Math.round(cue.delaySec * 1000));
      if (typeof window !== 'undefined') {
        const timerId = window.setTimeout(() => {
          this.playLine({
            character: cue.character,
            text: cue.text,
            duration: cue.duration,
            priority: 'cutscene',
            emotion: cue.emotion,
            intensity: cue.intensity,
            realmTag: realmId,
          });
        }, delayMs);
        this.scheduledTimers.push(timerId);
      }
    });
  }

  public playBossPhaseLine(realmId: number, phase: 2 | 3) {
    const char = this.getCharacterForRealm(realmId);
    const scripts = BOSS_PHASE_SCRIPTS[realmId] || BOSS_PHASE_SCRIPTS[1];
    this.playLine({
      character: char,
      text: phase === 2 ? scripts.phase2 : scripts.phase3,
      duration: 4.2,
      priority: 'phase',
      intensity: phase === 3 ? 'furious' : 'intense',
      realmTag: realmId,
    });
  }

  public playBossDefeatLine(realmId: number) {
    const char = this.getCharacterForRealm(realmId);
    const scripts = BOSS_PHASE_SCRIPTS[realmId] || BOSS_PHASE_SCRIPTS[1];
    this.playLine({
      character: char,
      text: scripts.defeat,
      duration: 4.6,
      priority: 'cutscene',
      intensity: 'breaking',
      realmTag: realmId,
    });
  }

  public playAzraelRealmEnter(realmId: number) {
    const entry = AZRAEL_REALM_ENTER_LINES[realmId];
    if (!entry) return;
    this.playLine({
      character: 'azrael',
      text: entry.text,
      duration: 4.4,
      priority: 'story',
      emotion: entry.emotion,
      realmTag: realmId,
    });
  }

  public playAzraelMemoryReaction(fragmentId: string) {
    const entry = AZRAEL_MEMORY_LINES[fragmentId];
    if (!entry) return;
    this.playLine({
      character: 'azrael',
      text: entry.text,
      duration: 4.6,
      priority: 'story',
      emotion: entry.emotion,
      realmTag: 1,
    });
  }

  private pickNonRepeating(character: VoiceCharacterId, pool: string[]): string {
    if (pool.length === 0) return '';
    if (pool.length === 1) return pool[0];
    const last = this.lastLineByChar.get(character);
    const filtered = pool.filter((l) => l !== last);
    const source = filtered.length > 0 ? filtered : pool;
    const chosen = source[Math.floor(Math.random() * source.length)];
    this.lastLineByChar.set(character, chosen);
    return chosen;
  }

  public playAzraelWrathBark() {
    const line = this.pickNonRepeating('azrael', AZRAEL_WRATH_LINES);
    this.playLine({
      character: 'azrael',
      text: line,
      duration: 1.9,
      priority: 'combat',
      emotion: 'anger',
      intensity: 'furious',
      minGapSec: 5.5,
      realmTag: -1,
    });
  }

  public playAzraelSpecialAttackLine() {
    const line = this.pickNonRepeating('azrael', AZRAEL_SPECIAL_ATTACK_LINES);
    this.playLine({
      character: 'azrael',
      text: line,
      duration: 2.1,
      priority: 'combat',
      emotion: 'determination',
      intensity: 'intense',
      minGapSec: 6.5,
      realmTag: -1,
    });
  }

  public playAzraelPainLine(lowHp: boolean) {
    const pool = lowHp ? AZRAEL_EXHAUSTION_LINES : AZRAEL_PAIN_LINES;
    const line = this.pickNonRepeating('azrael', pool);
    this.playLine({
      character: 'azrael',
      text: line,
      duration: 2.4,
      priority: 'combat',
      emotion: lowHp ? 'exhaustion' : 'pain',
      intensity: lowHp ? 'breaking' : 'intense',
      minGapSec: lowHp ? 6.5 : 8.5,
      realmTag: -1,
    });
  }

  public playAzraelDeathLine() {
    const line = this.pickNonRepeating('azrael', AZRAEL_EXHAUSTION_LINES);
    this.playLine({
      character: 'azrael',
      text: line,
      duration: 4.0,
      priority: 'cutscene',
      emotion: 'exhaustion',
      intensity: 'breaking',
      realmTag: -1,
    });
  }

  public playAzraelVictoryLine(realmId: number) {
    const entry = AZRAEL_VICTORY_LINES[realmId];
    if (!entry) return;
    this.playLine({
      character: 'azrael',
      text: entry.text,
      duration: 4.4,
      priority: 'cutscene',
      emotion: entry.emotion,
      realmTag: realmId,
    });
  }

  public playMiniBossBark(
    enemyType: string,
    mode: 'aggro' | 'enraged',
    position?: THREE.Vector3,
    listenerPos?: THREE.Vector3,
    listenerYaw?: number
  ): boolean {
    const bank = MINI_BOSS_BARKS[enemyType];
    if (!bank) return false;
    const pool = mode === 'enraged' ? bank.enraged : bank.aggro;
    const charId = (VOICE_ACTOR_PROFILES[enemyType as VoiceCharacterId]
      ? enemyType
      : 'hellspawn') as VoiceCharacterId;
    const text = this.pickNonRepeating(charId, pool);

    return this.playLine({
      character: charId,
      text,
      duration: mode === 'enraged' ? 3.2 : 2.8,
      priority: 'combat',
      intensity: mode === 'enraged' ? 'furious' : 'intense',
      position,
      listenerPos,
      listenerYaw,
      minGapSec: mode === 'enraged' ? 10.0 : 14.0,
      realmTag: -1,
    });
  }

  public playWhiteEyedGodWhisper() {
    this.stopAll();
    this.playLine({
      character: 'sovereign_desire',
      speaker: 'THE WHITE-EYED GOD',
      speakerTitle: 'Throne Beyond Creation',
      text: WHITE_EYED_GOD_WHISPER,
      duration: 6.0,
      priority: 'cutscene',
      intensity: 'calm',
      realmTag: 7,
    });
  }

  // --- CANCELLATION & CLEANUP ---

  private stopActivePlayback() {
    if (typeof window !== 'undefined') {
      this.clauseTimers.forEach((id) => window.clearTimeout(id));
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore unavailable cancel
        }
      }
    }
    this.clauseTimers = [];

    if (this.activePlaybackHandle) {
      this.activePlaybackHandle.stop();
      this.activePlaybackHandle = null;
    }
    if (this.activeAccompanimentStop) {
      this.activeAccompanimentStop();
      this.activeAccompanimentStop = null;
    }
    this.dsp.stopAllActive();
  }

  /**
   * Cancels all scheduled voice cues, clears active Web Audio & speech synthesis playback, and clears subtitle.
   */
  public stopAll() {
    this.playbackSeqId++;
    if (typeof window !== 'undefined') {
      this.scheduledTimers.forEach((id) => window.clearTimeout(id));
    }
    this.scheduledTimers = [];
    this.stopActivePlayback();

    if (this.activeSubtitle) {
      this.activeSubtitle = null;
      this.subtitleTimer = 0;
      this.currentPriority = 'combat';
      this.onSubtitleChange?.(null);
    }
  }

  public dispose() {
    this.stopAll();
    this.dsp.dispose();
    this.audioCache.clear();
    this.inFlightSyntheses.clear();
    this.onSubtitleChange = null;
  }
}

export const voiceManager = new VoiceManager();
