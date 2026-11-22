/**
 * THE SEVEN HELLGATES — Cinematic Voice DSP & Spatial Audio Processor
 *
 * Implements:
 * - Clean dry path + parallel configurable reverb presets (subtle_room, dark_cavern, boss_arena, celestial_void)
 * - Dialogue chest warmth & consonant presence EQ + DynamicsCompressor loudness normalization
 * - Controlled saturation grit & low-frequency demonic sub-resonance layer
 * - 3D stereo spatial panning & distance attenuation
 * - Organic breath/mannerism synthesis for realistic fallback delivery
 */

import * as THREE from 'three';
import {
  PsychoticMannerism,
  VoiceActorProfile,
  VoiceDSPConfig,
  VoiceReverbPreset,
} from './VoiceRegistry';

export interface SpatialVoiceParams {
  sourcePos?: THREE.Vector3;
  listenerPos?: THREE.Vector3;
  listenerYaw?: number;
}

export interface PlaybackHandle {
  stop: () => void;
  durationSec: number;
}

const REVERB_PRESET_PARAMS: Record<
  VoiceReverbPreset,
  { durationSec: number; decay: number; dampHz: number }
> = {
  subtle_room: { durationSec: 0.65, decay: 3.4, dampHz: 4200 },
  dark_cavern: { durationSec: 1.85, decay: 2.3, dampHz: 2600 },
  boss_arena: { durationSec: 2.35, decay: 2.1, dampHz: 3200 },
  celestial_void: { durationSec: 3.1, decay: 1.7, dampHz: 4800 },
};

export class VoiceDSPProcessor {
  private impulseCache = new Map<VoiceReverbPreset, AudioBuffer>();
  private curveCache = new Map<number, Float32Array<ArrayBuffer>>();
  private activeStopHandles = new Set<() => void>();

  public computeSpatial(spatial?: SpatialVoiceParams): { gain: number; pan: number } {
    if (!spatial?.sourcePos || !spatial?.listenerPos) {
      return { gain: 1.0, pan: 0.0 };
    }
    const dx = spatial.sourcePos.x - spatial.listenerPos.x;
    const dz = spatial.sourcePos.z - spatial.listenerPos.z;
    const dist = Math.hypot(dx, dz);
    const gain = Math.max(0.22, Math.min(1.0, 1.0 - dist / 36.0));

    // Project onto listener right axis
    const yaw = spatial.listenerYaw ?? 0;
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);
    const horizLen = Math.max(0.001, dist);
    const pan = Math.max(-0.85, Math.min(0.85, (dx * rightX + dz * rightZ) / horizLen));

    return { gain, pan };
  }

  private getOrCreateImpulse(ctx: AudioContext, preset: VoiceReverbPreset): AudioBuffer {
    const existing = this.impulseCache.get(preset);
    if (existing && existing.sampleRate === ctx.sampleRate) {
      return existing;
    }

    const cfg = REVERB_PRESET_PARAMS[preset] || REVERB_PRESET_PARAMS.subtle_room;
    const length = Math.max(128, Math.floor(ctx.sampleRate * cfg.durationSec));
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, cfg.decay);
        // Subtle early reflections + smooth diffuse tail
        const early = i < ctx.sampleRate * 0.045 && i % 430 === 0 ? 0.55 : 0;
        data[i] = ((Math.random() * 2 - 1) * 0.72 + early) * env;
      }
    }

    this.impulseCache.set(preset, impulse);
    return impulse;
  }

  private getDistortionCurve(drive: number): Float32Array<ArrayBuffer> {
    const key = Math.round(drive * 100);
    const cached = this.curveCache.get(key);
    if (cached) return cached;

    const samples = 256;
    const buffer = new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT);
    const curve = new Float32Array(buffer);
    const k = drive * 32;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = k <= 0.01 ? x : ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    this.curveCache.set(key, curve);
    return curve;
  }

  /**
   * Plays a clean decoded AudioBuffer (e.g. ElevenLabs speech) through the full
   * cinematic dialogue DSP chain, preserving original diction while adding room/arena space.
   */
  public playProcessedAudioBuffer(
    ctx: AudioContext,
    destination: AudioNode,
    buffer: AudioBuffer,
    dsp: VoiceDSPConfig,
    options?: {
      volume?: number;
      gritBoost?: number;
      spatial?: SpatialVoiceParams;
      onEnded?: () => void;
    }
  ): PlaybackHandle {
    const now = ctx.currentTime;
    const dur = Math.max(0.1, buffer.duration);
    const { gain: spatialGain, pan } = this.computeSpatial(options?.spatial);
    const baseVolume = Math.max(0.01, Math.min(1.3, (options?.volume ?? 1.0) * spatialGain));

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // 1. Clean high-pass + chest warmth + consonant presence EQ
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(75, now);

    const chestEq = ctx.createBiquadFilter();
    chestEq.type = 'peaking';
    chestEq.frequency.setValueAtTime(145, now);
    chestEq.Q.setValueAtTime(1.1, now);
    chestEq.gain.setValueAtTime(dsp.chestWarmthDb, now);

    const presenceEq = ctx.createBiquadFilter();
    presenceEq.type = 'peaking';
    presenceEq.frequency.setValueAtTime(2950, now);
    presenceEq.Q.setValueAtTime(1.2, now);
    presenceEq.gain.setValueAtTime(dsp.presenceDb, now);

    // 2. Dialogue DynamicsCompressor for consistent loudness normalization
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, now);
    compressor.knee.setValueAtTime(12, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.004, now);
    compressor.release.setValueAtTime(0.16, now);

    const makeupGain = ctx.createGain();
    makeupGain.gain.setValueAtTime(1.18 * baseVolume, now);

    // 3. Dry + Controlled Saturation parallel mix (keeps clean recording intact)
    const dryGain = ctx.createGain();
    const drive = Math.min(0.45, dsp.distortionDrive + (options?.gritBoost ?? 0));
    dryGain.gain.setValueAtTime(drive > 0.08 ? 0.78 : 0.94, now);

    source.connect(hpf);
    hpf.connect(chestEq);
    chestEq.connect(presenceEq);
    presenceEq.connect(dryGain);
    dryGain.connect(compressor);

    const cleanupNodes: AudioNode[] = [source, hpf, chestEq, presenceEq, dryGain, compressor, makeupGain];

    if (drive > 0.03) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.getDistortionCurve(drive);
      shaper.oversample = '2x';
      const gritGain = ctx.createGain();
      gritGain.gain.setValueAtTime(Math.min(0.32, drive * 0.72), now);
      presenceEq.connect(shaper);
      shaper.connect(gritGain);
      gritGain.connect(compressor);
      cleanupNodes.push(shaper, gritGain);
    }

    // 4. Spatial panner
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);
    compressor.connect(makeupGain);
    makeupGain.connect(panner);
    cleanupNodes.push(panner);

    // 5. Parallel Cinematic Reverb
    const wetAmount = Math.max(0, Math.min(0.55, dsp.reverbWet));
    const directOut = ctx.createGain();
    directOut.gain.setValueAtTime(1.0, now);
    panner.connect(directOut);
    directOut.connect(destination);
    cleanupNodes.push(directOut);

    if (wetAmount > 0.02) {
      const convolver = ctx.createConvolver();
      convolver.buffer = this.getOrCreateImpulse(ctx, dsp.reverbPreset);
      const damp = ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.setValueAtTime(REVERB_PRESET_PARAMS[dsp.reverbPreset].dampHz, now);
      const wetGain = ctx.createGain();
      wetGain.gain.setValueAtTime(wetAmount, now);

      panner.connect(convolver);
      convolver.connect(damp);
      damp.connect(wetGain);
      wetGain.connect(destination);
      cleanupNodes.push(convolver, damp, wetGain);
    }

    // 6. Optional Low-Frequency Demonic Sub-Layer (synced to voice duration, never masks speech)
    let subOsc: OscillatorNode | null = null;
    if (dsp.demonicLayerGain > 0.02) {
      subOsc = ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(dsp.demonicLayerHz, now);
      subOsc.frequency.exponentialRampToValueAtTime(Math.max(30, dsp.demonicLayerHz * 0.84), now + dur);

      const subFilter = ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(130, now);

      const subGain = ctx.createGain();
      const peakSub = dsp.demonicLayerGain * baseVolume * 0.42;
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(peakSub, now + 0.14);
      subGain.gain.setValueAtTime(peakSub * 0.85, now + Math.max(0.2, dur - 0.25));
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(panner);
      subOsc.start(now);
      subOsc.stop(now + dur + 0.04);
      cleanupNodes.push(subOsc, subFilter, subGain);
    }

    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      this.activeStopHandles.delete(stop);
      try {
        const stopAt = ctx.currentTime + 0.06;
        directOut.gain.cancelScheduledValues(ctx.currentTime);
        directOut.gain.setValueAtTime(Math.max(0.0001, directOut.gain.value), ctx.currentTime);
        directOut.gain.exponentialRampToValueAtTime(0.0001, stopAt);
        source.stop(stopAt + 0.02);
        subOsc?.stop(stopAt + 0.02);
      } catch {
        // Already stopped
      }
    };

    source.onended = () => {
      this.activeStopHandles.delete(stop);
      options?.onEnded?.();
    };

    this.activeStopHandles.add(stop);
    source.start(now);

    return { stop, durationSec: dur };
  }

  /**
   * Plays subtle organic breath, mannerisms (chuckle, rasp, gasp, snarl), and
   * warm chest/demonic resonance underneath fallback Web Speech without buzzing over words.
   */
  public playOrganicFallbackAccompaniment(
    ctx: AudioContext,
    destination: AudioNode,
    profile: VoiceActorProfile,
    durationSec: number,
    options?: {
      breathBoost?: number;
      spatial?: SpatialVoiceParams;
    }
  ): () => void {
    const now = ctx.currentTime;
    const dur = Math.max(0.5, Math.min(4.5, durationSec));
    const { gain: spatialGain, pan } = this.computeSpatial(options?.spatial);
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    const masterAccGain = ctx.createGain();
    masterAccGain.gain.setValueAtTime(spatialGain, now);
    panner.connect(masterAccGain);
    masterAccGain.connect(destination);

    const stops: Array<() => void> = [];

    // 1. Subtle natural inhale / breath texture before/during utterance
    const breathLevel = Math.min(
      0.18,
      profile.fallback.breathNoiseLevel + (options?.breathBoost ?? 0)
    );
    if (breathLevel > 0.01) {
      const breathDur = Math.min(0.45, dur * 0.25);
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * breathDur), ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) {
        ch[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(profile.category === 'protagonist' ? 900 : 1250, now);
      bp.Q.setValueAtTime(1.8, now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, now);
      nGain.gain.linearRampToValueAtTime(breathLevel, now + 0.08);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + breathDur);

      noise.connect(bp);
      bp.connect(nGain);
      nGain.connect(panner);
      noise.start(now);
      noise.stop(now + breathDur + 0.02);
      stops.push(() => {
        try {
          noise.stop();
        } catch {}
      });
    }

    // 2. Restrained chest/sub resonance bed (sine/triangle only, soft lowpass so no robotic buzz)
    if (profile.fallback.chestToneGain > 0.005) {
      const osc = ctx.createOscillator();
      osc.type = profile.category === 'sovereign' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(profile.fallback.chestToneHz, now);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(30, profile.fallback.chestToneHz * 0.88),
        now + dur
      );

      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(180, now);

      const bedGain = ctx.createGain();
      bedGain.gain.setValueAtTime(0.0001, now);
      bedGain.gain.linearRampToValueAtTime(profile.fallback.chestToneGain, now + 0.12);
      bedGain.gain.setValueAtTime(profile.fallback.chestToneGain * 0.85, now + Math.max(0.2, dur - 0.25));
      bedGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(lpf);
      lpf.connect(bedGain);
      bedGain.connect(panner);
      osc.start(now);
      osc.stop(now + dur + 0.04);
      stops.push(() => {
        try {
          osc.stop();
        } catch {}
      });
    }

    // 3. Psychotic mini-boss mannerism bursts (unhinged laugh, metallic rasp, wet snarl, sudden scream)
    this.scheduleMannerismTexture(ctx, panner, profile.mannerism, dur, stops);

    const stopAll = () => {
      this.activeStopHandles.delete(stopAll);
      try {
        masterAccGain.gain.cancelScheduledValues(ctx.currentTime);
        masterAccGain.gain.setValueAtTime(Math.max(0.0001, masterAccGain.gain.value), ctx.currentTime);
        masterAccGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      } catch {}
      stops.forEach((fn) => fn());
    };

    this.activeStopHandles.add(stopAll);
    return stopAll;
  }

  private scheduleMannerismTexture(
    ctx: AudioContext,
    target: AudioNode,
    mannerism: PsychoticMannerism,
    dur: number,
    stops: Array<() => void>
  ) {
    if (mannerism === 'none' || mannerism === 'breath_gasp') return;
    const now = ctx.currentTime;

    if (mannerism === 'unhinged_laugh') {
      // Short erratic staccato cackle pulses
      [0.05, 0.19, 0.34, 0.51].forEach((offset, idx) => {
        if (offset >= dur) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        const base = 185 + (idx % 2 === 0 ? 45 : -25) + idx * 14;
        osc.frequency.setValueAtTime(base, now + offset);
        osc.frequency.exponentialRampToValueAtTime(base * 0.72, now + offset + 0.1);
        f.type = 'bandpass';
        f.frequency.setValueAtTime(880, now + offset);
        f.Q.setValueAtTime(3.2, now + offset);
        g.gain.setValueAtTime(0.0001, now + offset);
        g.gain.linearRampToValueAtTime(0.045, now + offset + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.11);
        osc.connect(f);
        f.connect(g);
        g.connect(target);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
        stops.push(() => {
          try {
            osc.stop();
          } catch {}
        });
      });
    } else if (mannerism === 'sudden_scream' || mannerism === 'wet_snarl') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      const startHz = mannerism === 'sudden_scream' ? 140 : 74;
      const peakHz = mannerism === 'sudden_scream' ? 310 : 108;
      osc.frequency.setValueAtTime(startHz, now);
      osc.frequency.exponentialRampToValueAtTime(peakHz, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(startHz * 0.8, now + 0.45);
      f.type = 'bandpass';
      f.frequency.setValueAtTime(mannerism === 'sudden_scream' ? 1300 : 480, now);
      f.Q.setValueAtTime(2.6, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
      osc.connect(f);
      f.connect(g);
      g.connect(target);
      osc.start(now);
      osc.stop(now + 0.48);
      stops.push(() => {
        try {
          osc.stop();
        } catch {}
      });
    } else if (mannerism === 'metallic_rasp' || mannerism === 'aggressive_whisper') {
      const nDur = Math.min(0.65, dur * 0.4);
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * nDur), ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(mannerism === 'metallic_rasp' ? 1950 : 2600, now);
      bp.Q.setValueAtTime(4.0, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.048, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + nDur);
      noise.connect(bp);
      bp.connect(g);
      g.connect(target);
      noise.start(now);
      noise.stop(now + nDur + 0.02);
      stops.push(() => {
        try {
          noise.stop();
        } catch {}
      });
    }
  }

  public stopAllActive() {
    Array.from(this.activeStopHandles).forEach((fn) => fn());
    this.activeStopHandles.clear();
  }

  public dispose() {
    this.stopAllActive();
    this.impulseCache.clear();
    this.curveCache.clear();
  }
}
