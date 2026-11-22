/**
 * The Seven Hellgates - Greed: The Pit of Destruction
 * The Forgotten Souls — SoulWhisperAudioController
 *
 * Dynamic layered audio system:
 * - Synthesizes ghostly vocal formants (F1, F2, F3 bandpass vowel filters)
 * - Harmonically blends modulated detuned spectral oscillators and breath noise
 * - Integrates with browser SpeechSynthesis when available for sorrowful whispered speech
 * - Spatial audio attenuation based on 3D distance from player
 * - Controlled cooldowns, interval management, and overlap suppression
 * - Respects Master, SFX, and Dialogue volume settings from audioManager
 */

import * as THREE from 'three';
import { audioManager } from '../../audio/SoundEngine';
import {
  SoulWhisperDialogue,
  FORGOTTEN_SOULS_DIALOGUE_LIBRARY,
  GildedWardenConfig,
} from './ForgottenSoulsConfiguration';

export class SoulWhisperAudioController {
  private config: GildedWardenConfig;
  private whisperTimer: number = 5.0;
  private isSpeaking: boolean = false;
  private currentWhisper: SoulWhisperDialogue | null = null;
  private whisperDisplayTimer: number = 0;
  private recentDialogueIds: string[] = [];

  constructor(config: GildedWardenConfig) {
    this.config = config;
    this.whisperTimer = 4.0 + Math.random() * 4.0;
  }

  public getCurrentWhisperText(): string | null {
    if (this.whisperDisplayTimer > 0 && this.currentWhisper) {
      return this.currentWhisper.text;
    }
    return null;
  }

  public update(
    delta: number,
    healthRatio: number,
    wardenPos: THREE.Vector3,
    playerPos: THREE.Vector3
  ) {
    // 1. Decay whisper on-screen display timer
    if (this.whisperDisplayTimer > 0) {
      this.whisperDisplayTimer -= delta;
      if (this.whisperDisplayTimer <= 0) {
        this.currentWhisper = null;
        this.isSpeaking = false;
      }
    }

    // 2. Count down interval to next whisper
    this.whisperTimer -= delta;
    if (this.whisperTimer <= 0 && !this.isSpeaking) {
      // Determine category based on health state
      let category: 'faint' | 'distressed' | 'critical' = 'faint';
      let nextInterval = 8.0;

      if (healthRatio <= this.config.thresholdArmorFailingHP) {
        category = 'critical';
        nextInterval = this.config.criticalWhisperIntervalMin +
          Math.random() * (this.config.criticalWhisperIntervalMax - this.config.criticalWhisperIntervalMin);
      } else if (healthRatio <= this.config.thresholdInstabilityHP) {
        category = 'distressed';
        nextInterval = this.config.distressedWhisperIntervalMin +
          Math.random() * (this.config.distressedWhisperIntervalMax - this.config.distressedWhisperIntervalMin);
      } else {
        category = 'faint';
        nextInterval = this.config.faintWhisperIntervalMin +
          Math.random() * (this.config.faintWhisperIntervalMax - this.config.faintWhisperIntervalMin);
      }

      this.whisperTimer = nextInterval;
      this.playRandomWhisper(category, wardenPos, playerPos);
    }
  }

  /**
   * Plays a random whisper from a specific category
   */
  public playRandomWhisper(
    category: 'faint' | 'distressed' | 'critical',
    wardenPos: THREE.Vector3,
    playerPos: THREE.Vector3
  ) {
    const candidates = FORGOTTEN_SOULS_DIALOGUE_LIBRARY.filter(
      d => d.category === category && !this.recentDialogueIds.includes(d.id)
    );

    const pool = candidates.length > 0 ? candidates : FORGOTTEN_SOULS_DIALOGUE_LIBRARY.filter(d => d.category === category);
    if (pool.length === 0) return;

    const selected = pool[Math.floor(Math.random() * pool.length)];
    this.recentDialogueIds.push(selected.id);
    if (this.recentDialogueIds.length > 4) this.recentDialogueIds.shift();

    this.playSpecificWhisper(selected, wardenPos, playerPos);
  }

  /**
   * Plays a specific authored whisper (used during damage triggers and death sequence)
   */
  public playSpecificWhisper(
    dialogue: SoulWhisperDialogue,
    wardenPos: THREE.Vector3,
    playerPos: THREE.Vector3
  ) {
    this.currentWhisper = dialogue;
    this.whisperDisplayTimer = dialogue.duration;
    this.isSpeaking = true;

    // Calculate 3D distance attenuation
    const dist = wardenPos.distanceTo(playerPos);
    const maxAudibleDist = 28.0;
    const distanceFactor = Math.max(0.08, 1.0 - dist / maxAudibleDist);

    // 1. Synthesize Procedural Spectral Formant Choir via Web Audio
    this.synthesizeSpectralFormantVoice(dialogue, distanceFactor);

    // 2. Browser SpeechSynthesis for ghostly whisper
    this.speakWhisperedWords(dialogue, distanceFactor);
  }

  /**
   * Generates spectral human formant resonances using Web Audio bandpass filters
   */
  private synthesizeSpectralFormantVoice(dialogue: SoulWhisperDialogue, distFactor: number) {
    const ctx = (audioManager as any).ctx as AudioContext | null;
    const sfxGain = (audioManager as any).sfxGain as GainNode | null;
    const settings = audioManager.settings;

    if (!ctx || !sfxGain || settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const baseGain = (settings.sfx * settings.master * distFactor * 0.35);

      // Vowel Formant Frequencies [F1, F2, F3]
      const formantMap: Record<string, [number, number, number]> = {
        a: [800, 1200, 2500],
        e: [450, 1900, 2700],
        i: [280, 2300, 3100],
        o: [500, 950, 2400],
        u: [320, 850, 2200],
      };
      const [f1, f2, f3] = formantMap[dialogue.formantVowel] || [450, 1900, 2700];

      // Formant filters
      const filter1 = ctx.createBiquadFilter();
      filter1.type = 'bandpass';
      filter1.frequency.setValueAtTime(f1, now);
      filter1.Q.setValueAtTime(6.0, now);

      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.frequency.setValueAtTime(f2, now);
      filter2.Q.setValueAtTime(7.0, now);

      const filter3 = ctx.createBiquadFilter();
      filter3.type = 'bandpass';
      filter3.frequency.setValueAtTime(f3, now);
      filter3.Q.setValueAtTime(8.0, now);

      // Breath noise generator for whispering texture
      const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dialogue.duration), ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;

      // Harmonic ethereal oscillator
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(dialogue.pitch, now);
      osc.frequency.linearRampToValueAtTime(dialogue.pitch * 0.92, now + dialogue.duration);

      // Sub-harmonic oscillator for ghostly weight
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(dialogue.pitch * 0.5, now);

      // Envelope gain
      const voiceGain = ctx.createGain();
      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(baseGain, now + 0.35);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + dialogue.duration);

      // Route
      noiseSource.connect(filter1);
      noiseSource.connect(filter2);
      osc.connect(filter1);
      subOsc.connect(filter3);

      filter1.connect(voiceGain);
      filter2.connect(voiceGain);
      filter3.connect(voiceGain);
      voiceGain.connect(sfxGain);

      noiseSource.start(now);
      noiseSource.stop(now + dialogue.duration);
      osc.start(now);
      osc.stop(now + dialogue.duration);
      subOsc.start(now);
      subOsc.stop(now + dialogue.duration);
    } catch (e) {
      // Audio fallback silent guard
    }
  }

  /**
   * Speaks the dialogue using SpeechSynthesis for sorrowful whispered human voice
   */
  private speakWhisperedWords(dialogue: SoulWhisperDialogue, distFactor: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (audioManager.settings.isMuted) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(dialogue.text);
      utterance.pitch = dialogue.pitch > 240 ? 1.4 : 0.75;
      utterance.rate = dialogue.speed * 0.82;
      utterance.volume = Math.min(1.0, audioManager.settings.sfx * audioManager.settings.master * distFactor * 0.9);

      // Prefer English whisper-like or ethereal voice if available
      const voices = window.speechSynthesis.getVoices();
      const whisperVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Siri') || v.name.includes('Google') || v.name.includes('Daniel')));
      if (whisperVoice) {
        utterance.voice = whisperVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  public playLockBreakSound() {
    const ctx = (audioManager as any).ctx as AudioContext | null;
    const sfxGain = (audioManager as any).sfxGain as GainNode | null;
    if (!ctx || !sfxGain || audioManager.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      // Metallic break snap + resonant glass ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.42);

      // High crystalline chime
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1240, now);
      chime.frequency.exponentialRampToValueAtTime(1860, now + 0.5);

      chimeGain.gain.setValueAtTime(0.3, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      chime.connect(chimeGain);
      chimeGain.connect(sfxGain);
      chime.start(now);
      chime.stop(now + 0.6);
    } catch {}
  }

  public dispose() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }
}
