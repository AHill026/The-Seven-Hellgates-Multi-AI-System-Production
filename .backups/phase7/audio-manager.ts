/**
 * THE SEVEN HELLGATES — Unified Cinematic Audio Manager
 * 
 * Modular audio engine supporting:
 * - Recorded soundtrack loading with graceful procedural cinematic fallback
 * - Main menu Awakening theme with smooth fade-in/out
 * - Realm I (Limbo) atmospheric exploration soundtrack (drones, choir, strings, bells)
 * - Dynamic combat music system (gradual intensity scaling, war drums, aggressive strings)
 * - 7 distinct cinematic Boss themes reflecting each demonic ruler's identity
 * - The White-Eyed God secret revelation sequence (tectonic rumble, whisper, sudden silence)
 * - Complete SFX suite (swords, impacts, footsteps, armor rattle, abilities, wrath)
 * - Full audio settings (Master, Music, SFX, Ambience, Mute) saved to localStorage
 * - iOS/Safari AudioContext unlock on first user interaction
 */

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  ambient: number;
  isMuted: boolean;
}

const STORAGE_KEY = 'seven_hellgates_audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
  master: 0.8,
  music: 0.7,
  sfx: 0.8,
  ambient: 0.6,
  isMuted: false,
};

export type MusicState = 'menu' | 'exploration' | 'combat' | 'boss' | 'cutscene' | 'silent';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  // Master buses
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Dual crossfader channels for music
  private musicChannelA: GainNode | null = null;
  private musicChannelB: GainNode | null = null;
  private activeMusicChannel: 'A' | 'B' = 'A';

  // Current playing music state
  public currentMusicState: MusicState = 'silent';
  private currentTrackName: string = '';
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentAudioSourceNode: MediaElementAudioSourceNode | null = null;

  // Procedural music nodes
  private proceduralMusicNodes: {
    oscs: OscillatorNode[];
    gains: GainNode[];
    filters: BiquadFilterNode[];
    intervals: number[];
  } = { oscs: [], gains: [], filters: [], intervals: [] };

  // Dynamic combat music state
  private combatIntensity: number = 0; // 0 (calm) to 1 (full combat)
  private combatDrumTimer: number | null = null;
  private combatStringsTimer: number | null = null;
  private inCombatMode: boolean = false;
  private combatDecayTimer: number = 0;

  // Current realm & boss
  private currentRealmId: number = 1;
  private currentBossId: number | null = null;
  private entranceSwellNodes: { oscs: OscillatorNode[]; gains: GainNode[] } = { oscs: [], gains: [] };

  // Settings
  public settings: AudioSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.loadSettings();
    this.setupUserUnlockListeners();
  }

  // --- SETTINGS & PERSISTENCE ---

  private loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('[AudioManager] Could not load audio settings from localStorage:', e);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  public saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('[AudioManager] Could not save audio settings to localStorage:', e);
    }
    this.applyVolumes();
  }

  public setMasterVolume(vol: number) {
    this.settings.master = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  public setMusicVolume(vol: number) {
    this.settings.music = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  public setSfxVolume(vol: number) {
    this.settings.sfx = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  public setAmbientVolume(vol: number) {
    this.settings.ambient = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  public toggleMute(): boolean {
    this.settings.isMuted = !this.settings.isMuted;
    if (this.settings.isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore unavailable speechSynthesis cancel
      }
    }
    this.saveSettings();
    return this.settings.isMuted;
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const muted = this.settings.isMuted;

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.settings.master, now);
    }
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(muted ? 0 : this.settings.music, now);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(muted ? 0 : this.settings.sfx, now);
    }
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(muted ? 0 : this.settings.ambient, now);
    }
  }

  // --- INITIALIZATION & SAFARI UNLOCK ---

  private setupUserUnlockListeners() {
    const unlockHandler = () => {
      this.init();
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
    };

    window.addEventListener('pointerdown', unlockHandler, { once: false });
    window.addEventListener('keydown', unlockHandler, { once: false });
    window.addEventListener('touchstart', unlockHandler, { once: false });
  }

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      // Music sub-bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);

      // Music Channel A (for crossfading)
      this.musicChannelA = this.ctx.createGain();
      this.musicChannelA.connect(this.musicGain);

      // Music Channel B (for crossfading)
      this.musicChannelB = this.ctx.createGain();
      this.musicChannelB.connect(this.musicGain);

      // SFX sub-bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);

      // Ambient sub-bus
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.connect(this.masterGain);

      this.applyVolumes();
      this.isUnlocked = true;
    } catch (e) {
      console.warn('[AudioManager] Web Audio initialization warning:', e);
    }
  }

  public isAudioMuted(): boolean {
    return this.settings.isMuted;
  }

  public getVoiceOutput(): { ctx: AudioContext; destination: GainNode } | null {
    if (
      typeof window !== 'undefined' &&
      !this.ctx &&
      (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
    ) {
      this.init();
    }
    if (!this.ctx || !this.sfxGain) return null;
    return { ctx: this.ctx, destination: this.sfxGain };
  }

  // --- MUSIC PLAYBACK & CROSSFADING ---

  /**
   * Plays a music track by path or procedural style with smooth crossfading
   */
  public async playMusic(trackType: MusicState, trackPath?: string, fadeDuration: number = 2.0) {
    this.init();
    if (!this.ctx) return;

    if (this.currentMusicState === trackType && this.currentTrackName === (trackPath || trackType)) {
      // Already playing this exact music track
      return;
    }

    this.currentMusicState = trackType;
    this.currentTrackName = trackPath || trackType;

    // Crossfade: determine incoming channel
    const nextChannelKey = this.activeMusicChannel === 'A' ? 'B' : 'A';
    const outgoingChannel = this.activeMusicChannel === 'A' ? this.musicChannelA : this.musicChannelB;
    const incomingChannel = nextChannelKey === 'A' ? this.musicChannelA : this.musicChannelB;

    if (!outgoingChannel || !incomingChannel) return;

    const now = this.ctx.currentTime;

    // 1. Fade out current music
    outgoingChannel.gain.cancelScheduledValues(now);
    outgoingChannel.gain.setValueAtTime(outgoingChannel.gain.value, now);
    outgoingChannel.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);

    // Stop previous procedural nodes after fade
    const oldProcedural = { ...this.proceduralMusicNodes };
    this.proceduralMusicNodes = { oscs: [], gains: [], filters: [], intervals: [] };
    setTimeout(() => {
      this.stopProceduralGroup(oldProcedural);
    }, fadeDuration * 1000);

    // Stop previous audio element after fade
    const oldAudio = this.currentAudioElement;
    if (oldAudio) {
      setTimeout(() => {
        try {
          oldAudio.pause();
          oldAudio.currentTime = 0;
        } catch {}
      }, fadeDuration * 1000);
      this.currentAudioElement = null;
    }

    // 2. Prepare incoming channel
    incomingChannel.gain.cancelScheduledValues(now);
    incomingChannel.gain.setValueAtTime(0.0001, now);
    incomingChannel.gain.linearRampToValueAtTime(1.0, now + fadeDuration);
    this.activeMusicChannel = nextChannelKey;

    // 3. Try loading actual audio file if specified
    if (trackPath) {
      const loaded = await this.tryPlayAudioFile(trackPath, incomingChannel);
      if (loaded) {
        return;
      }
    }

    // 4. Procedural Cinematic Soundtrack Fallback
    this.startProceduralTrack(trackType, incomingChannel);
  }

  /**
   * Gracefully loads an audio file, checking for existence without uncaught 404 errors
   */
  private async tryPlayAudioFile(url: string, destinationGain: GainNode): Promise<boolean> {
    if (!this.ctx) return false;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        console.log(`[AudioManager] Audio file '${url}' not present (HTTP ${response.status}). Using procedural soundtrack.`);
        return false;
      }

      const audio = new Audio(url);
      audio.crossOrigin = 'anonymous';
      audio.loop = true;
      audio.volume = 1.0;

      const source = this.ctx.createMediaElementSource(audio);
      source.connect(destinationGain);

      await audio.play();
      this.currentAudioElement = audio;
      this.currentAudioSourceNode = source;
      return true;
    } catch (e) {
      console.log(`[AudioManager] Could not play external audio file '${url}', falling back to procedural audio.`, e);
      return false;
    }
  }

  private stopProceduralGroup(group: { oscs: OscillatorNode[]; gains: GainNode[]; filters: BiquadFilterNode[]; intervals: number[] }) {
    group.intervals.forEach(id => clearInterval(id));
    group.oscs.forEach(o => {
      try { o.stop(); o.disconnect(); } catch {}
    });
    group.gains.forEach(g => {
      try { g.disconnect(); } catch {}
    });
    group.filters.forEach(f => {
      try { f.disconnect(); } catch {}
    });
  }

  // --- MAIN MENU MUSIC (Awakening Theme) ---

  public playMainMenuMusic() {
    // 1. Awakening Theme file in public/assets/audio/music/
    const trackUrl = '/assets/audio/music/seven_hellgates_awakening_theme.wav';
    this.playMusic('menu', trackUrl, 2.5);
  }

  public fadeOutMenuMusic(duration: number = 1.8) {
    if (this.currentMusicState === 'menu') {
      this.playMusic('silent', undefined, duration);
    }
  }

  // --- EXPLORATION SOUNDTRACKS (Realm I to VII) ---

  public playExplorationMusic(realmId: number) {
    this.currentRealmId = realmId;
    this.inCombatMode = false;
    this.stopCombatPercussion();

    const trackUrl = realmId === 1
      ? '/assets/audio/music/limbo_exploration_theme.wav'
      : `/assets/audio/music/realm_${realmId}_exploration_theme.wav`;

    this.playMusic('exploration', trackUrl, 3.0);
  }

  // --- DYNAMIC COMBAT MUSIC SYSTEM ---

  /**
   * Called each frame with the nearest enemy distance and combat status
   */
  public updateCombatState(delta: number, minEnemyDist: number, hasActiveBoss: boolean) {
    if (!this.ctx || this.currentMusicState === 'menu' || this.currentMusicState === 'cutscene') return;

    // Enemy is close or boss is alive
    const inDangerZone = (minEnemyDist < 14) || hasActiveBoss;

    if (inDangerZone) {
      this.combatDecayTimer = 3.5; // Stay in combat tension for 3.5s after last encounter
      if (!this.inCombatMode) {
        this.inCombatMode = true;
        this.startCombatPercussion();
      }
      this.combatIntensity = Math.min(1.0, this.combatIntensity + delta * 0.8);
    } else {
      if (this.combatDecayTimer > 0) {
        this.combatDecayTimer -= delta;
      } else if (this.inCombatMode) {
        this.combatIntensity = Math.max(0.0, this.combatIntensity - delta * 0.4);
        if (this.combatIntensity <= 0.05) {
          this.inCombatMode = false;
          this.stopCombatPercussion();
        }
      }
    }
  }

  private startCombatPercussion() {
    if (this.combatDrumTimer) return;
    if (this.currentMusicState === 'boss') return; // Boss theme has its own percussion

    // War drum pulse at 130 BPM (~460ms intervals)
    let beat = 0;
    this.combatDrumTimer = window.setInterval(() => {
      if (!this.inCombatMode || this.combatIntensity < 0.1) return;
      beat++;
      const isDownbeat = beat % 4 === 0;
      this.playWarDrum(isDownbeat ? 1.0 : 0.65, this.combatIntensity * 0.4);

      if (beat % 2 === 1 && this.combatIntensity > 0.4) {
        this.playTaikoRim(this.combatIntensity * 0.25);
      }
    }, 460);

    // Staccato aggressive strings rhythm every 920ms
    this.combatStringsTimer = window.setInterval(() => {
      if (!this.inCombatMode || this.combatIntensity < 0.3) return;
      this.playStaccatoStringStab(this.combatIntensity * 0.35);
    }, 920);
  }

  private stopCombatPercussion() {
    if (this.combatDrumTimer) {
      clearInterval(this.combatDrumTimer);
      this.combatDrumTimer = null;
    }
    if (this.combatStringsTimer) {
      clearInterval(this.combatStringsTimer);
      this.combatStringsTimer = null;
    }
  }

  // --- BOSS MUSIC SYSTEM (7 CINEMATIC BOSS SOUNDTRACKS) ---

  public playBossMusic(bossId: number) {
    this.currentBossId = bossId;
    this.stopCombatPercussion();
    const trackUrl = `/assets/audio/music/boss_${bossId}.wav`;
    this.playMusic('boss', trackUrl, 2.0);
  }

  // --- THE WHITE-EYED GOD REVELATION SEQUENCE ---

  public playWhiteEyedGodRevelation() {
    this.currentMusicState = 'cutscene';
    this.stopCombatPercussion();
    if (!this.ctx || !this.ambientGain || !this.sfxGain) return;

    // 1. Complete silence of all melodic music
    if (this.musicChannelA) this.musicChannelA.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);
    if (this.musicChannelB) this.musicChannelB.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);
    this.stopProceduralGroup(this.proceduralMusicNodes);

    const now = this.ctx.currentTime;

    // 2. Deep atmospheric rumbling: 24Hz sub-bass tremor
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    const subFilter = this.ctx.createBiquadFilter();

    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(26, now);
    subOsc.frequency.linearRampToValueAtTime(21, now + 4.5);

    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(65, now);

    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.85, now + 1.8);
    subGain.gain.setValueAtTime(0.85, now + 5.2);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5); // Sudden silence!

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.ambientGain);

    subOsc.start(now);
    subOsc.stop(now + 5.6);

    // 3. Faint, unsettling choral overtone (high spectral breath)
    const choirOsc = this.ctx.createOscillator();
    const choirGain = this.ctx.createGain();
    choirOsc.type = 'sine';
    choirOsc.frequency.setValueAtTime(440, now);
    choirOsc.frequency.linearRampToValueAtTime(436, now + 5.0);

    choirGain.gain.setValueAtTime(0.01, now);
    choirGain.gain.linearRampToValueAtTime(0.12, now + 2.0);
    choirGain.gain.setValueAtTime(0.12, now + 5.2);
    choirGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

    choirOsc.connect(choirGain);
    choirGain.connect(this.ambientGain);

    choirOsc.start(now);
    choirOsc.stop(now + 5.6);

    // 4. Massive cinematic sub-drop impact when eyes appear (at t = 2.5s)
    setTimeout(() => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(95, t);
      boom.frequency.exponentialRampToValueAtTime(22, t + 1.8);

      boomGain.gain.setValueAtTime(0.9, t);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

      boom.connect(boomGain);
      boomGain.connect(this.sfxGain);
      boom.start(t);
      boom.stop(t + 2.3);

      this.playNoiseBurst(1.2, 0.45, 300);
    }, 2500);

    // 5. Whispered voice: "Azrael..." (at t = 2.8s) with delayed stereophonic dissipation
    setTimeout(() => {
      this.playAncientWhisper();
    }, 2800);
  }

  private playAncientWhisper() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Dual formant filtered noise sweeps synthesizing the whispered sibilants of "Azrael..."
    const formants = [
      { f1: 750, f2: 1200, start: 0, dur: 0.35, vol: 0.4 }, // "Ah-"
      { f1: 1800, f2: 2600, start: 0.25, dur: 0.35, vol: 0.5 }, // "-z-"
      { f1: 1400, f2: 2100, start: 0.55, dur: 0.45, vol: 0.4 }, // "-ra-"
      { f1: 500, f2: 3200, start: 0.95, dur: 0.65, vol: 0.35 }, // "-el..."
    ];

    formants.forEach(({ f1, f2, start, dur, vol }) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + start;

      // Filtered noise formant
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bp1 = this.ctx.createBiquadFilter();
      bp1.type = 'bandpass';
      bp1.frequency.setValueAtTime(f1, t);
      bp1.Q.setValueAtTime(4.0, t);

      const bp2 = this.ctx.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.frequency.setValueAtTime(f2, t);
      bp2.Q.setValueAtTime(5.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(vol * 0.6, t + dur * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(bp1);
      noise.connect(bp2);
      bp1.connect(gain);
      bp2.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + dur + 0.1);
    });

    // Deep whispered pitch resonance
    const voiceOsc = this.ctx.createOscillator();
    const voiceGain = this.ctx.createGain();
    const voiceFilter = this.ctx.createBiquadFilter();

    voiceOsc.type = 'sawtooth';
    voiceOsc.frequency.setValueAtTime(65, now);
    voiceOsc.frequency.linearRampToValueAtTime(52, now + 1.8);

    voiceFilter.type = 'bandpass';
    voiceFilter.frequency.setValueAtTime(450, now);
    voiceFilter.Q.setValueAtTime(3.0, now);

    voiceGain.gain.setValueAtTime(0.01, now);
    voiceGain.gain.linearRampToValueAtTime(0.25, now + 0.4);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

    voiceOsc.connect(voiceFilter);
    voiceFilter.connect(voiceGain);
    voiceGain.connect(this.sfxGain);

    voiceOsc.start(now);
    voiceOsc.stop(now + 2.0);
  }

  // --- PROCEDURAL CINEMATIC COMPOSITION ENGINES ---

  private startProceduralTrack(trackType: MusicState, destinationGain: GainNode) {
    if (!this.ctx) return;

    if (trackType === 'menu') {
      this.buildProceduralMenuTheme(destinationGain);
    } else if (trackType === 'boss') {
      this.buildProceduralBossTheme(this.currentBossId || 1, destinationGain);
    } else if (trackType === 'exploration') {
      this.buildProceduralExplorationTheme(this.currentRealmId, destinationGain);
    }
  }

  /**
   * Main Menu Awakening Theme:
   * Low strings in D minor, brass horns, dark choir harmonics, slow tympani heartbeat.
   */
  private buildProceduralMenuTheme(dest: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // D minor chord progression: Dm -> Bb -> Gm -> A7
    const chords = [
      [36.71, 73.42, 110.0, 146.83, 220.0], // D1, D2, A2, D3, A3
      [29.14, 58.27, 87.31, 116.54, 174.61], // Bb0, Bb1, F2, Bb2, F3
      [48.99, 98.0, 146.83, 196.0, 293.66], // G1, G2, D3, G3, D4
      [55.0, 110.0, 164.81, 220.0, 329.63], // A1, A2, E3, A3, E4
    ];

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.Q.setValueAtTime(3.0, now);
    filter.connect(dest);
    this.proceduralMusicNodes.filters.push(filter);

    // Warm strings pad
    chords[0].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.4, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.09 / (idx + 1), now + 3.0);

      osc.connect(gain);
      gain.connect(filter);
      osc.start();

      this.proceduralMusicNodes.oscs.push(osc);
      this.proceduralMusicNodes.gains.push(gain);
    });

    // Slow cinematic heartbeat / war drum every 2.4s
    let chordIdx = 0;
    const interval = window.setInterval(() => {
      if (!this.ctx) return;
      chordIdx = (chordIdx + 1) % chords.length;
      const currentChord = chords[chordIdx];

      // Shift string frequencies gently
      this.proceduralMusicNodes.oscs.slice(0, currentChord.length).forEach((osc, idx) => {
        osc.frequency.setTargetAtTime(currentChord[idx], this.ctx!.currentTime, 1.2);
      });

      // Tympani strike
      this.playWarDrum(0.8, 0.45);
    }, 4800);

    this.proceduralMusicNodes.intervals.push(interval);
  }

  /**
   * Realm I: Limbo Exploration Soundtrack:
   * Deep ambient drones, distant choir textures, low orchestral strings, haunting bells, slow cinematic percussion.
   */
  private buildProceduralExplorationTheme(realmId: number, dest: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Realm specific base frequencies
    const realmConfigs: Record<number, { freqs: number[]; cutoff: number; bellNotes: number[] }> = {
      1: { freqs: [55.0, 82.4, 110.0, 164.8], cutoff: 380, bellNotes: [440, 554.37, 659.25, 880] }, // Limbo (A minor cold ash)
      2: { freqs: [48.99, 73.4, 98.0, 146.8], cutoff: 340, bellNotes: [392, 493.88, 587.33] }, // Gluttony (G minor viscous)
      3: { freqs: [65.4, 98.0, 130.8, 196.0], cutoff: 460, bellNotes: [523.25, 659.25, 783.99, 1046.5] }, // Greed (C minor gilded chimes)
      4: { freqs: [43.65, 65.4, 87.3, 130.8], cutoff: 310, bellNotes: [349.23, 440, 523.25] }, // Wrath (F minor subterranean)
      5: { freqs: [51.91, 77.78, 103.8, 155.5], cutoff: 420, bellNotes: [415.3, 519.1, 622.25] }, // Heresy (G# liturgical)
      6: { freqs: [41.2, 61.74, 82.4, 123.47], cutoff: 360, bellNotes: [329.63, 392, 493.88] }, // Violence (E minor war)
      7: { freqs: [36.71, 55.0, 73.42, 110.0], cutoff: 290, bellNotes: [587.33, 739.99, 880, 1174.66] }, // Sovereign (D celestial void)
    };

    const cfg = realmConfigs[realmId] || realmConfigs[1];

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cfg.cutoff, now);
    filter.Q.setValueAtTime(3.5, now);
    filter.connect(dest);
    this.proceduralMusicNodes.filters.push(filter);

    // Deep drone oscillators
    cfg.freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f + (Math.random() - 0.5) * 0.6, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.07 / (idx + 1), now + 3.0);

      osc.connect(gain);
      gain.connect(filter);
      osc.start();

      this.proceduralMusicNodes.oscs.push(osc);
      this.proceduralMusicNodes.gains.push(gain);
    });

    // Haunting Bells interval (every 8 to 14 seconds)
    const bellInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const note = cfg.bellNotes[Math.floor(Math.random() * cfg.bellNotes.length)];
      this.playHauntingBell(note, 0.35);
    }, 9000);
    this.proceduralMusicNodes.intervals.push(bellInterval);

    // Distant choir swell interval (every 12 seconds)
    const choirInterval = window.setInterval(() => {
      if (!this.ctx) return;
      this.playChoirSwell(cfg.freqs[1] * 2, 0.2);
    }, 12000);
    this.proceduralMusicNodes.intervals.push(choirInterval);
  }

  /**
   * 7 Distinct Cinematic Boss Soundtracks
   */
  private buildProceduralBossTheme(bossId: number, dest: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.connect(dest);
    this.proceduralMusicNodes.filters.push(filter);

    // Boss profiles
    const bossProfiles: Record<number, { baseFreq: number; tempoMs: number; choir: boolean; brass: boolean; heavyPound: boolean }> = {
      1: { baseFreq: 55.0, tempoMs: 520, choir: true, brass: false, heavyPound: true }, // The Hollow King: Dread choir + heavy war drums
      2: { baseFreq: 48.99, tempoMs: 640, choir: true, brass: false, heavyPound: false }, // Maw: Organic drone, distorted choir
      3: { baseFreq: 65.4, tempoMs: 480, choir: false, brass: true, heavyPound: true }, // Gilded Tyrant: Royal brass + metallic percussion
      4: { baseFreq: 43.65, tempoMs: 420, choir: false, brass: true, heavyPound: true }, // Red Calamity: Violent war drums + brass
      5: { baseFreq: 51.91, tempoMs: 580, choir: true, brass: false, heavyPound: false }, // Saint of Ash: Sacred choir + bells
      6: { baseFreq: 41.2, tempoMs: 440, choir: false, brass: false, heavyPound: true }, // Butcher of Ruin: Brutal industrial impacts
      7: { baseFreq: 36.71, tempoMs: 540, choir: true, brass: true, heavyPound: true }, // Sovereign of Desire: Supernatural celestial choir
    };

    const prof = bossProfiles[bossId] || bossProfiles[1];

    // Low dread chord
    [prof.baseFreq, prof.baseFreq * 1.5, prof.baseFreq * 2].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + 1.5);

      osc.connect(gain);
      gain.connect(filter);
      osc.start();

      this.proceduralMusicNodes.oscs.push(osc);
      this.proceduralMusicNodes.gains.push(gain);
    });

    // Boss Battle Rhythm loop
    let beat = 0;
    const loopInterval = window.setInterval(() => {
      if (!this.ctx) return;
      beat++;

      // Heavy war drum / industrial impact
      if (prof.heavyPound && (beat % 2 === 1 || beat % 4 === 0)) {
        this.playWarDrum(beat % 4 === 0 ? 1.2 : 0.8, 0.6);
      }

      // Aggressive staccato strings
      if (beat % 2 === 0) {
        this.playStaccatoStringStab(0.4);
      }

      // Heavy brass hit on 4th beat
      if (prof.brass && beat % 8 === 0) {
        this.playBrassStab(prof.baseFreq * 2, 0.45);
      }

      // Choir swell
      if (prof.choir && beat % 16 === 0) {
        this.playChoirSwell(prof.baseFreq * 4, 0.35);
      }
    }, prof.tempoMs);

    this.proceduralMusicNodes.intervals.push(loopInterval);
  }

  // --- INSTRUMENT SYNTHESIS HELPERS ---

  private playWarDrum(velocity: number = 1.0, volume: number = 0.5) {
    if (!this.ctx || !this.musicGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110 * velocity, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.28);

    gain.gain.setValueAtTime(volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.38);

    this.playNoiseBurst(0.12, volume * 0.4, 450);
  }

  private playTaikoRim(volume: number = 0.3) {
    if (!this.ctx || !this.musicGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  private playStaccatoStringStab(volume: number = 0.4) {
    if (!this.ctx || !this.musicGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const notes = [110.0, 130.8, 164.8]; // A minor triad
    notes.forEach((freq) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(2.0, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(volume * 0.35, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  private playBrassStab(freq: number, volume: number = 0.4) {
    if (!this.ctx || !this.musicGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.6);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  private playChoirSwell(freq: number, volume: number = 0.25) {
    if (!this.ctx || !this.musicGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const formants = [freq, freq * 1.5, freq * 2];
    formants.forEach((f, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f + (Math.random() - 0.5) * 1.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume / (idx + 1), now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 4.0);
    });
  }

  private playHauntingBell(freq: number, volume: number = 0.3) {
    if (!this.ctx || !this.ambientGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    // Bell inharmonics: 1.0, 2.0, 3.0, 4.2
    const harmonics = [1.0, 2.0, 3.0, 4.2];
    harmonics.forEach((h, idx) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * h, now);

      gain.gain.setValueAtTime(volume / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5 / (idx + 1));

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(now);
      osc.stop(now + 5.0);
    });
  }

  // --- COMPLETE COMBAT & ACTIONS SOUND EFFECTS SUITE ---

  public playSwordSwing(speedMultiplier: number = 1.0) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280 * speedMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18 / speedMultiplier);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1300, now);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 / speedMultiplier);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22 / speedMultiplier);

    this.playNoiseBurst(0.15 / speedMultiplier, 0.3, 950);
  }

  public playHeavySlash() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
    this.playNoiseBurst(0.28, 0.45, 650);
  }

  public playHitImpact(isHeavy: boolean = false) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(isHeavy ? 180 : 340, now);
    ping.frequency.exponentialRampToValueAtTime(60, now + (isHeavy ? 0.3 : 0.15));

    pingGain.gain.setValueAtTime(isHeavy ? 0.75 : 0.45, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.32 : 0.16));

    ping.connect(pingGain);
    pingGain.connect(this.sfxGain);
    ping.start(now);
    ping.stop(now + (isHeavy ? 0.35 : 0.18));

    this.playNoiseBurst(isHeavy ? 0.24 : 0.1, isHeavy ? 0.65 : 0.35, isHeavy ? 1600 : 2500);
  }

  public playStaggerBreak() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Heavy resonant sub-bass drop (posture fracture)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

    subGain.gain.setValueAtTime(0.85, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.60);

    // 2. High-pitched crystalline posture break ping
    const pingOsc = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    pingOsc.type = 'sine';
    pingOsc.frequency.setValueAtTime(1180, now);
    pingOsc.frequency.exponentialRampToValueAtTime(840, now + 0.35);

    pingGain.gain.setValueAtTime(0.65, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

    pingOsc.connect(pingGain);
    pingGain.connect(this.sfxGain);
    pingOsc.start(now);
    pingOsc.stop(now + 0.45);

    // 3. Shimmering metallic crunch burst
    this.playNoiseBurst(0.35, 0.70, 3200);
  }

  public playGauntletPunch() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
    this.playNoiseBurst(0.12, 0.45, 800);
  }

  public playDodgeRoll() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
    this.playNoiseBurst(0.2, 0.25, 600);
  }

  public playFootstep(surfaceType: 'ash' | 'blood' | 'metallic', isSprinting: boolean = false) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;
    const pitchMod = 0.92 + Math.random() * 0.16;
    const vol = isSprinting ? 0.4 : 0.25;

    if (surfaceType === 'ash') {
      const thump = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thump.type = 'triangle';
      thump.frequency.setValueAtTime(90 * pitchMod, now);
      thump.frequency.exponentialRampToValueAtTime(35, now + 0.1);

      thumpGain.gain.setValueAtTime(vol * 0.7, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      thump.connect(thumpGain);
      thumpGain.connect(this.sfxGain);
      thump.start(now);
      thump.stop(now + 0.13);

      this.playNoiseBurst(0.12, vol * 0.6, 520 * pitchMod);
    } else if (surfaceType === 'blood') {
      const squelch = this.ctx.createOscillator();
      const squelchGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      squelch.type = 'sine';
      squelch.frequency.setValueAtTime(260 * pitchMod, now);
      squelch.frequency.exponentialRampToValueAtTime(70, now + 0.11);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(680 * pitchMod, now);
      filter.Q.setValueAtTime(4.5, now);

      squelchGain.gain.setValueAtTime(vol * 0.85, now);
      squelchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      squelch.connect(filter);
      filter.connect(squelchGain);
      squelchGain.connect(this.sfxGain);
      squelch.start(now);
      squelch.stop(now + 0.14);

      this.playNoiseBurst(0.09, vol * 0.5, 950 * pitchMod);
    } else {
      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'triangle';
      metalOsc.frequency.setValueAtTime(520 * pitchMod, now);
      metalOsc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

      metalGain.gain.setValueAtTime(vol * 0.75, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      metalOsc.connect(metalGain);
      metalGain.connect(this.sfxGain);
      metalOsc.start(now);
      metalOsc.stop(now + 0.17);

      this.playNoiseBurst(0.08, vol * 0.7, 2400 * pitchMod);
    }

    // Gothic Armor Clink & Chainmail Rattle
    const rattleOsc = this.ctx.createOscillator();
    const rattleGain = this.ctx.createGain();
    const rattleFilter = this.ctx.createBiquadFilter();

    rattleOsc.type = 'square';
    rattleOsc.frequency.setValueAtTime(1400 * pitchMod, now);

    rattleFilter.type = 'highpass';
    rattleFilter.frequency.setValueAtTime(1800, now);

    rattleGain.gain.setValueAtTime(vol * 0.2, now);
    rattleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    rattleOsc.connect(rattleFilter);
    rattleFilter.connect(rattleGain);
    rattleGain.connect(this.sfxGain);
    rattleOsc.start(now);
    rattleOsc.stop(now + 0.09);
  }

  public playMemoryChime() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;
    const harmonicFreqs = [528, 792, 1056, 1584];

    harmonicFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.001, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.25 / (idx + 1), now + idx * 0.04 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 1.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 1.9);
    });
  }

  public playWrathActivation() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    [110, 164.8, 220, 330].forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 0.7, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.85);
    });

    this.playNoiseBurst(0.5, 0.55, 1200);
  }

  public playBossSpawnHorn() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    [65.4, 98, 130.8].forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(750, now + 0.8);
      filter.frequency.exponentialRampToValueAtTime(200, now + 2.2);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 2.5);
    });
  }

  public stopBossEntranceSwell() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.entranceSwellNodes.gains.forEach((g) => {
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(0.001, g.gain.value), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      } catch {
        // Ignore already disconnected gain nodes
      }
    });
    this.entranceSwellNodes.oscs.forEach((o) => {
      try {
        o.stop(now + 0.28);
      } catch {
        // Ignore already stopped oscillators
      }
    });
    this.entranceSwellNodes = { oscs: [], gains: [] };
  }

  /**
   * Plays a realm-calibrated multi-stage dark-fantasy entrance swell (5.5s arc):
   * - Sub-bass tectonic drop
   * - Sovereign harmonic brass/choir chord
   * - Accent strike (metallic anvil, cathedral bell, war drums, or crystal chime)
   */
  public playBossEntranceSwell(realmId: number) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    this.stopBossEntranceSwell();

    const now = this.ctx.currentTime;
    const realmConfigs: Record<number, { root: number; chord: number[]; oscType: OscillatorType; accentHz: number; noisePeak: number }> = {
      1: { root: 55.0, chord: [110, 164.81, 233.08], oscType: 'sawtooth', accentHz: 880, noisePeak: 900 },     // Hollow King (cold Phrygian brass)
      2: { root: 41.2, chord: [82.41, 116.54, 155.56], oscType: 'sawtooth', accentHz: 140, noisePeak: 550 },  // Maw of Hunger (dissonant sub-tritone)
      3: { root: 49.0, chord: [98.0, 146.83, 220.0], oscType: 'triangle', accentHz: 1174.66, noisePeak: 1400 },// Gilded Tyrant (molten fifth + anvil chime)
      4: { root: 46.25, chord: [92.5, 130.81, 185.0], oscType: 'sawtooth', accentHz: 220, noisePeak: 1600 },  // Red Calamity (war horn + tectonic roar)
      5: { root: 58.27, chord: [116.54, 174.61, 277.18], oscType: 'sine', accentHz: 698.46, noisePeak: 750 }, // Saint of Ash (inverted choir + bell)
      6: { root: 43.65, chord: [87.31, 123.47, 174.61], oscType: 'sawtooth', accentHz: 196, noisePeak: 1800 },// Butcher of Ruin (brutal iron + war drum)
      7: { root: 61.74, chord: [123.47, 185.0, 369.99], oscType: 'sine', accentHz: 1480, noisePeak: 2200 },   // Sovereign of Desire (celestial void shimmer)
    };
    const cfg = realmConfigs[realmId] || realmConfigs[1];

    // 1. Sub-bass tectonic swell & drop (peaks around Shot 2 close-up at 3.2s)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(cfg.root * 1.15, now);
    subOsc.frequency.exponentialRampToValueAtTime(cfg.root * 0.65, now + 4.8);
    subGain.gain.setValueAtTime(0.005, now);
    subGain.gain.linearRampToValueAtTime(0.42, now + 1.4);
    subGain.gain.linearRampToValueAtTime(0.55, now + 3.4);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 5.6);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 5.7);
    this.entranceSwellNodes.oscs.push(subOsc);
    this.entranceSwellNodes.gains.push(subGain);

    // 2. Sovereign Brass / Choir Crescendo Chord
    cfg.chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = cfg.oscType;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1) * 7, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(1150, now + 3.2);
      filter.frequency.exponentialRampToValueAtTime(280, now + 5.5);

      gain.gain.setValueAtTime(0.002, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 1.6);
      gain.gain.linearRampToValueAtTime(0.24, now + 3.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 5.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 5.6);
      this.entranceSwellNodes.oscs.push(osc);
      this.entranceSwellNodes.gains.push(gain);
    });

    // 3. Shot 2 Accent Strike (at t = 3.1s title & closeup reveal)
    const accentOsc = this.ctx.createOscillator();
    const accentGain = this.ctx.createGain();
    accentOsc.type = realmId === 3 || realmId === 5 || realmId === 7 ? 'sine' : 'triangle';
    accentOsc.frequency.setValueAtTime(cfg.accentHz, now + 3.1);
    accentOsc.frequency.exponentialRampToValueAtTime(cfg.accentHz * 0.72, now + 5.1);
    accentGain.gain.setValueAtTime(0.0001, now);
    accentGain.gain.setValueAtTime(0.001, now + 3.09);
    accentGain.gain.linearRampToValueAtTime(0.28, now + 3.15);
    accentGain.gain.exponentialRampToValueAtTime(0.001, now + 5.2);
    accentOsc.connect(accentGain);
    accentGain.connect(this.sfxGain);
    accentOsc.start(now + 3.08);
    accentOsc.stop(now + 5.3);
    this.entranceSwellNodes.oscs.push(accentOsc);
    this.entranceSwellNodes.gains.push(accentGain);

    this.playNoiseBurst(1.1, 0.32, cfg.noisePeak);
  }

  public playVictoryChime() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [220, 277.18, 329.63, 440, 554.37];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.3);
    });
  }

  public playEnemyDeath() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);

    this.playNoiseBurst(0.35, 0.4, 600);
  }

  public playPortalHum() {
    if (!this.ctx || !this.ambientGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(165, now + 1.0);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start(now);
    osc.stop(now + 1.6);
  }

  // Backwards compatibility for existing soundEngine calls
  public startDarkAmbientPad(realmId: number) {
    this.playExplorationMusic(realmId);
  }

  public stopDarkAmbientPad() {
    this.playMusic('silent', undefined, 1.0);
  }

  public playWhiteEyedGodWhisper() {
    this.playWhiteEyedGodRevelation();
  }

  private playNoiseBurst(duration: number, volume: number, cutoff: number) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      whiteNoise.start();
    } catch {}
  }

  // --- HEALTH & REGENERATION SOUND EFFECTS ---

  public playHealthPickup() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Arpeggiated celestial healing chord (C5, E5, G5, C6) with rising shimmer
      const chord = [523.25, 659.25, 783.99, 1046.50];
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.04 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.6);
      });
    } catch {}
  }

  // --- ENVIRONMENTAL HAZARD SOUNDS ---

  public playTrapWarning() {
    this.playNoiseBurst(0.08, 0.18, 2200);
  }

  public playTrapSnap() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy iron clamp snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);

      this.playNoiseBurst(0.12, 0.25, 800);
    } catch {}
  }

  public playBrazierHiss() {
    this.playNoiseBurst(0.25, 0.12, 1400);
  }

  // --- COMBO MULTIPLIER RANK-UP SFX ---

  public playComboRankUp(tier: number) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Synthesize an escalating harmonic chord matching the tier:
      // Tier 1 (Relentless): 2 notes rising
      // Tier 2 (Carnage): 3 notes blood-chime
      // Tier 3 (Executioner): occult 4-note resonant triad
      // Tier 4 (Sovereign Wrath): divine 5-note godslayer flourish
      let freqs: number[];
      let oscType: OscillatorType;
      let gainLevel: number;

      switch (tier) {
        case 4:
          freqs = [440, 554.37, 659.25, 880, 1108.73];
          oscType = 'triangle';
          gainLevel = 0.28;
          break;
        case 3:
          freqs = [329.63, 440, 493.88, 659.25];
          oscType = 'sawtooth';
          gainLevel = 0.24;
          break;
        case 2:
          freqs = [261.63, 329.63, 392.0];
          oscType = 'sawtooth';
          gainLevel = 0.22;
          break;
        case 1:
        default:
          freqs = [293.66, 440];
          oscType = 'sine';
          gainLevel = 0.2;
          break;
      }

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(gainLevel, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.6);
      });
    } catch {}
  }

  // --- REALM AUDIO ZONES (Ruins, Arena, Hellgate) ---

  private currentZone: 'ruins' | 'arena' | 'hellgate' = 'arena';
  private zoneTimer: number = 0;

  public updateAudioZone(zone: 'ruins' | 'arena' | 'hellgate', delta: number) {
    if (this.currentZone !== zone) {
      this.currentZone = zone;
    }
    this.zoneTimer += delta;

    // Trigger subtle spatial atmospheric cues every 7-10 seconds
    if (this.zoneTimer > 7.5 && this.ctx && this.ambientGain && !this.settings.isMuted) {
      this.zoneTimer = 0;
      try {
        const now = this.ctx.currentTime;
        if (zone === 'ruins') {
          // Desolate wind gust
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(220, now);
          filter.frequency.exponentialRampToValueAtTime(380, now + 2.5);

          const noise = this.ctx.createBufferSource();
          const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 3.5), this.ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
          noise.buffer = buf;

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.14, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.4);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ambientGain);
          noise.start(now);
          noise.stop(now + 3.5);
        } else if (zone === 'hellgate') {
          // Ethereal portal void resonance
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(75, now);
          osc.frequency.linearRampToValueAtTime(110, now + 2.0);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

          osc.connect(gain);
          gain.connect(this.ambientGain);
          osc.start(now);
          osc.stop(now + 3.3);
        }
      } catch {}
    }
  }

  // --- PROJECT SEVENFOLD ARSENAL & SOVEREIGN WRATH SFX ---

  public playWeaponEquip(slotIndex: number = 1) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 260 + slotIndex * 38;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, now + 0.14);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.28);
      this.playNoiseBurst(0.09, 0.15, 2400);
    } catch {}
  }

  public playWeaponManifest(slotIndex: number = 1) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const base = 190 + slotIndex * 28;
      [base, base * 1.5, base * 2.0].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = i === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq * 1.35, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + 0.36);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.22 / (i + 1), now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 0.45);
      });
      this.playNoiseBurst(0.22, 0.32, 1800);
    } catch {}
  }

  public playComboSynergyChime() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [392.0, 523.25, 659.25, 987.77].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.6);
      });
    } catch {}
  }

  public playSevenfoldConvergence() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // 7-note ascending Seal harmonic chord followed by colossal sub impact
      const sealFreqs = [146.83, 196.0, 220.0, 293.66, 392.0, 440.0, 587.33];
      sealFreqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        osc.frequency.linearRampToValueAtTime(freq * 1.03, now + idx * 0.065 + 0.9);

        gain.gain.setValueAtTime(0.001, now + idx * 0.065);
        gain.gain.linearRampToValueAtTime(0.20, now + idx * 0.065 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 1.45);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 1.5);
      });
      this.playNoiseBurst(0.65, 0.45, 1600);
    } catch {}
  }

  public playSovereignWrathStrike() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [110, 220, 329.63, 659.25].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * 1.4, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 0.55);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 0.76);
      });
      this.playNoiseBurst(0.45, 0.5, 1900);
    } catch {}
  }
}

export const audioManager = new AudioManager();
