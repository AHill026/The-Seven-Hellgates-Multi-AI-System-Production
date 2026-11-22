/**
 * THE SEVEN HELLGATES — Character Voice Actor & Vocal Formant Manager
 *
 * Provides distinct voice characterization for Azrael, all 7 Realm Sovereigns,
 * and ancient realm narration using:
 * - Tuned Web Speech API voice selection & prosody per character
 * - Synchronized Web Audio procedural vocal formant synthesis beds routed through
 *   AudioManager's SFX/Master gain hierarchy (honors Mute & volume sliders)
 * - Priority preemption, anti-spam combat throttling, timer tracking, and live subtitles
 */

import * as THREE from 'three';
import { audioManager } from '../../audio/audio-manager';

export type VoiceCharacterId =
  | 'azrael'
  | 'hollow_king'
  | 'abaddon'
  | 'gilded_tyrant'
  | 'red_calamity'
  | 'saint_of_ash'
  | 'butcher_of_ruin'
  | 'sovereign_desire'
  | 'narrator';

export type VoicePriority = 'cutscene' | 'phase' | 'story' | 'combat';

export interface VoiceActorProfile {
  id: VoiceCharacterId;
  speaker: string;
  speakerTitle: string;
  accentColor: string;
  speech: {
    pitch: number;
    rate: number;
    volumeScale: number;
    preferredVoices: string[];
    fallbackSeed: number;
  };
  formant: {
    baseFreqHz: number;
    pitchDropRatio: number;
    oscType: OscillatorType;
    subOscType: OscillatorType;
    formants: [number, number, number];
    qFactor: number;
    vibratoHz: number;
    syllableRateHz: number;
    bed:
      | 'steel_resonance'
      | 'spectral_chime'
      | 'abyssal_growl'
      | 'gilded_brass'
      | 'volcanic_roar'
      | 'choir_drone'
      | 'iron_gravel'
      | 'celestial_chord';
  };
}

export interface VoiceSubtitleState {
  character: VoiceCharacterId;
  speaker: string;
  speakerTitle?: string;
  text: string;
  accentColor: string;
}

export interface VoicePlayOptions {
  character: VoiceCharacterId;
  text: string;
  speaker?: string;
  speakerTitle?: string;
  duration?: number;
  priority?: VoicePriority;
  position?: THREE.Vector3;
  listenerPos?: THREE.Vector3;
  minGapSec?: number;
}

export interface BossIntroLineCue {
  delaySec: number;
  character: VoiceCharacterId;
  text: string;
  duration: number;
}

export const VOICE_ACTOR_PROFILES: Record<VoiceCharacterId, VoiceActorProfile> = {
  azrael: {
    id: 'azrael',
    speaker: 'AZRAEL',
    speakerTitle: 'The Pale Arbiter',
    accentColor: '#38bdf8',
    speech: {
      pitch: 0.78,
      rate: 0.92,
      volumeScale: 0.92,
      preferredVoices: ['Daniel', 'Arthur', 'Ryan', 'Guy', 'Google UK English Male', 'Alex', 'Aaron'],
      fallbackSeed: 0,
    },
    formant: {
      baseFreqHz: 96,
      pitchDropRatio: 0.90,
      oscType: 'triangle',
      subOscType: 'sine',
      formants: [310, 840, 2150],
      qFactor: 3.4,
      vibratoHz: 4.0,
      syllableRateHz: 3.8,
      bed: 'steel_resonance',
    },
  },
  hollow_king: {
    id: 'hollow_king',
    speaker: 'THE HOLLOW KING',
    speakerTitle: 'Ruler of Limbo',
    accentColor: '#38bdf8',
    speech: {
      pitch: 0.56,
      rate: 0.80,
      volumeScale: 0.95,
      preferredVoices: ['George', 'Oliver', 'Reed', 'Ralph', 'Microsoft George', 'Google UK English Male'],
      fallbackSeed: 1,
    },
    formant: {
      baseFreqHz: 68,
      pitchDropRatio: 0.84,
      oscType: 'sawtooth',
      subOscType: 'sine',
      formants: [260, 660, 1920],
      qFactor: 5.0,
      vibratoHz: 2.6,
      syllableRateHz: 2.9,
      bed: 'spectral_chime',
    },
  },
  abaddon: {
    id: 'abaddon',
    speaker: 'ABADDON',
    speakerTitle: 'The Maw of Endless Hunger',
    accentColor: '#84cc16',
    speech: {
      pitch: 0.40,
      rate: 0.76,
      volumeScale: 1.0,
      preferredVoices: ['Zarvox', 'Fred', 'Grandpa', 'Bruce', 'Boris', 'Google US English'],
      fallbackSeed: 2,
    },
    formant: {
      baseFreqHz: 48,
      pitchDropRatio: 0.76,
      oscType: 'sawtooth',
      subOscType: 'sawtooth',
      formants: [240, 590, 1520],
      qFactor: 4.5,
      vibratoHz: 5.5,
      syllableRateHz: 2.6,
      bed: 'abyssal_growl',
    },
  },
  gilded_tyrant: {
    id: 'gilded_tyrant',
    speaker: 'THE GILDED TYRANT',
    speakerTitle: 'Emperor of Greed',
    accentColor: '#f59e0b',
    speech: {
      pitch: 0.54,
      rate: 0.86,
      volumeScale: 0.96,
      preferredVoices: ['Arthur', 'Matthew', 'Christopher', 'Richard', 'Microsoft David', 'Daniel'],
      fallbackSeed: 3,
    },
    formant: {
      baseFreqHz: 64,
      pitchDropRatio: 0.88,
      oscType: 'sawtooth',
      subOscType: 'triangle',
      formants: [340, 880, 2260],
      qFactor: 4.2,
      vibratoHz: 3.1,
      syllableRateHz: 3.4,
      bed: 'gilded_brass',
    },
  },
  red_calamity: {
    id: 'red_calamity',
    speaker: 'THE RED CALAMITY',
    speakerTitle: 'Warlord of Wrath',
    accentColor: '#ef4444',
    speech: {
      pitch: 0.46,
      rate: 1.02,
      volumeScale: 1.0,
      preferredVoices: ['Aaron', 'Fred', 'Junior', 'Rocko', 'Google US English', 'Mark'],
      fallbackSeed: 4,
    },
    formant: {
      baseFreqHz: 58,
      pitchDropRatio: 0.82,
      oscType: 'sawtooth',
      subOscType: 'square',
      formants: [420, 1020, 2480],
      qFactor: 3.8,
      vibratoHz: 7.0,
      syllableRateHz: 5.2,
      bed: 'volcanic_roar',
    },
  },
  saint_of_ash: {
    id: 'saint_of_ash',
    speaker: 'THE SAINT OF ASH',
    speakerTitle: 'Prelate of Heresy',
    accentColor: '#818cf8',
    speech: {
      pitch: 0.72,
      rate: 0.82,
      volumeScale: 0.92,
      preferredVoices: ['Victoria', 'Hazel', 'Libby', 'Google UK English Female', 'Samantha', 'Kate'],
      fallbackSeed: 5,
    },
    formant: {
      baseFreqHz: 124,
      pitchDropRatio: 0.92,
      oscType: 'triangle',
      subOscType: 'sine',
      formants: [390, 1140, 2650],
      qFactor: 5.6,
      vibratoHz: 4.8,
      syllableRateHz: 3.1,
      bed: 'choir_drone',
    },
  },
  butcher_of_ruin: {
    id: 'butcher_of_ruin',
    speaker: 'THE BUTCHER OF RUIN',
    speakerTitle: 'Executioner of Violence',
    accentColor: '#dc2626',
    speech: {
      pitch: 0.42,
      rate: 0.84,
      volumeScale: 1.0,
      preferredVoices: ['Bruce', 'Eddy', 'Mark', 'David', 'Ralph', 'Grandpa'],
      fallbackSeed: 6,
    },
    formant: {
      baseFreqHz: 50,
      pitchDropRatio: 0.78,
      oscType: 'sawtooth',
      subOscType: 'square',
      formants: [290, 720, 1840],
      qFactor: 4.8,
      vibratoHz: 6.2,
      syllableRateHz: 4.0,
      bed: 'iron_gravel',
    },
  },
  sovereign_desire: {
    id: 'sovereign_desire',
    speaker: 'THE SOVEREIGN OF DESIRE',
    speakerTitle: 'The White-Eyed God',
    accentColor: '#e2e8f0',
    speech: {
      pitch: 0.64,
      rate: 0.78,
      volumeScale: 0.96,
      preferredVoices: ['Serena', 'Tessa', 'Karen', 'Moira', 'Google UK English Female', 'Daniel'],
      fallbackSeed: 7,
    },
    formant: {
      baseFreqHz: 108,
      pitchDropRatio: 0.95,
      oscType: 'sine',
      subOscType: 'triangle',
      formants: [360, 1280, 2850],
      qFactor: 6.2,
      vibratoHz: 2.2,
      syllableRateHz: 2.8,
      bed: 'celestial_chord',
    },
  },
  narrator: {
    id: 'narrator',
    speaker: 'CHRONICLE OF THE SEALS',
    speakerTitle: 'Ancient Inscription',
    accentColor: '#94a3b8',
    speech: {
      pitch: 0.68,
      rate: 0.86,
      volumeScale: 0.86,
      preferredVoices: ['George', 'Arthur', 'Daniel', 'Alex', 'Google UK English Male'],
      fallbackSeed: 0,
    },
    formant: {
      baseFreqHz: 76,
      pitchDropRatio: 0.91,
      oscType: 'triangle',
      subOscType: 'sine',
      formants: [300, 780, 1980],
      qFactor: 3.8,
      vibratoHz: 2.5,
      syllableRateHz: 3.0,
      bed: 'spectral_chime',
    },
  },
};

export const REALM_TO_BOSS_VOICE: Record<number, VoiceCharacterId> = {
  1: 'hollow_king',
  2: 'abaddon',
  3: 'gilded_tyrant',
  4: 'red_calamity',
  5: 'saint_of_ash',
  6: 'butcher_of_ruin',
  7: 'sovereign_desire',
};

export const BOSS_INTRO_SCRIPTS: Record<number, BossIntroLineCue[]> = {
  1: [
    {
      delaySec: 0.65,
      character: 'hollow_king',
      text: 'Azrael... you wander once more into the shadow of the Seal. Draw steel, oathbreaker.',
      duration: 3.1,
    },
    {
      delaySec: 3.9,
      character: 'azrael',
      text: 'Your vigil in the ash ends here, Hollow King.',
      duration: 2.2,
    },
  ],
  2: [
    {
      delaySec: 0.65,
      character: 'abaddon',
      text: 'We are the Great Gullet! Step into the feast and dissolve into our glory!',
      duration: 3.1,
    },
    {
      delaySec: 3.9,
      character: 'azrael',
      text: 'Starve upon the blade, Abaddon.',
      duration: 2.1,
    },
  ],
  3: [
    {
      delaySec: 0.65,
      character: 'gilded_tyrant',
      text: 'Every soul in this vault carries a price. Pay your tribute in blood, Pale Arbiter.',
      duration: 3.1,
    },
    {
      delaySec: 3.9,
      character: 'azrael',
      text: 'Keep your molten crown. I claim only the Seal.',
      duration: 2.2,
    },
  ],
  4: [
    {
      delaySec: 0.6,
      character: 'red_calamity',
      text: 'Come, steel-born! Let the ash drink our fury until the world splits!',
      duration: 3.0,
    },
    {
      delaySec: 3.8,
      character: 'azrael',
      text: 'Your flames burn blind. Steel holds colder truth.',
      duration: 2.2,
    },
  ],
  5: [
    {
      delaySec: 0.7,
      character: 'saint_of_ash',
      text: 'Kneel before the inverted choir, apostate. Salvation is forged only in cinders.',
      duration: 3.1,
    },
    {
      delaySec: 4.0,
      character: 'azrael',
      text: 'False prayers will not bar the Fifth Gate.',
      duration: 2.2,
    },
  ],
  6: [
    {
      delaySec: 0.65,
      character: 'butcher_of_ruin',
      text: 'No chains break faster than bone! Step onto the block and be unmade!',
      duration: 3.0,
    },
    {
      delaySec: 3.85,
      character: 'azrael',
      text: 'Then swing your cleaver, Butcher. Let us test the iron.',
      duration: 2.2,
    },
  ],
  7: [
    {
      delaySec: 0.7,
      character: 'sovereign_desire',
      text: 'Look into the White Eye, Azrael. Every seal you shattered was a reflection of your own throne.',
      duration: 3.3,
    },
    {
      delaySec: 4.2,
      character: 'azrael',
      text: 'Then I shatter the mirror too. No god sits beyond the Seventh Gate.',
      duration: 2.4,
    },
  ],
};

export const BOSS_PHASE_SCRIPTS: Record<
  number,
  { phase2: string; phase3: string; defeat: string }
> = {
  1: {
    phase2: 'The seal splinters... You bear his scent, wanderer!',
    phase3: 'The White Eyes stir within the stone! Do not let the gates fall!',
    defeat: 'The seal... is broken. The White Eyes open... Azrael...',
  },
  2: {
    phase2: 'The vestments rot! The true famine awakens from within!',
    phase3: 'ENTER OUR GULLET! BECOME ETERNAL WITHIN OUR MAW!',
    defeat: 'Even our hunger... ceases... The White Eyes feast upon our soul...',
  },
  3: {
    phase2: 'The treasury cracks! Drown in molten gold!',
    phase3: 'ALL EMPIRES BOW TO THE WEIGHT OF AVARICE!',
    defeat: 'Gold cools... to gray dust... Who bought your soul, Arbiter?',
  },
  4: {
    phase2: 'THE VOLCANO WAKES! BURN WITH THE LEGION!',
    phase3: 'ASH AND EMBER—I WILL REDUCE THIS GATE TO SLAG!',
    defeat: 'A worthy duel... at last... the furnace grows cold...',
  },
  5: {
    phase2: 'Hear the dissonance! The choir condemns your blasphemy!',
    phase3: 'ASCEND INTO CINDERS! LET FALSE LIGHT CONSUME YOU!',
    defeat: 'Even our hymns... were lies written in the White Eye...',
  },
  6: {
    phase2: 'Bleed harder! Let the gallows chains sing!',
    phase3: 'NO MERCY! NO PARDON! ONLY THE CLEAVER REMAINS!',
    defeat: 'The iron snaps... Take the weapon... finish the slaughter...',
  },
  7: {
    phase2: 'Do you feel it? Your own blade remembers this throne!',
    phase3: 'BEHOLD THE EYE BEYOND CREATION! DESIRE IS ETERNAL!',
    defeat: 'At last... the Seventh Seal opens... Remember what you sealed away...',
  },
};

export const AZRAEL_REALM_ENTER_LINES: Record<number, string> = {
  1: 'Cold ash and shattered vows... Something waits beyond this mist.',
  2: 'The very stone breathes... Abaddon hungers behind these ribs.',
  3: 'A mountain of gold built over rotting bones. The Third Gate lies ahead.',
  4: 'The air tastes of iron and cinder. The Red Calamity waits.',
  5: 'Cathedrals hung upside down in defiance of heaven... A hollow liturgy.',
  6: 'Chains strung from an unseen sky. Only slaughter lingers here.',
  7: 'Beyond the Seven Gates... the void remembers my name.',
};

export const AZRAEL_MEMORY_LINES: Record<string, string> = {
  frag_crown: 'A crown cast into ash... Why does my hand remember its weight?',
  frag_sword: 'Celestial steel, quenched in abyssal frost... I forged this oath.',
  frag_seals: 'Seven gates to lock away a single throne... Were we guardians, or prisoners?',
};

export const AZRAEL_WRATH_LINES: string[] = [
  'Break!',
  'Unseal the wrath!',
  'Fall to ash!',
  'Steel remembers!',
];

export const AZRAEL_VICTORY_LINES: Record<number, string> = {
  1: 'Rest in silence, Hollow King. The first seal is mine.',
  2: 'The feast is ended. Yet this relic feels strangely familiar.',
  3: 'Neither gold nor empire endures the Pale Arbiter.',
  4: 'Your fury burns out. Onward to the Fifth Gate.',
  5: 'Your choir is silenced, Saint of Ash.',
  6: 'The chains fall still. Six seals unmade.',
  7: 'The Seventh Gate breaks... What waits behind the White Eye?',
};

export class VoiceManager {
  private activeSubtitle: VoiceSubtitleState | null = null;
  private subtitleTimer: number = 0;
  private currentPriority: VoicePriority = 'combat';
  private onSubtitleChange: ((sub: VoiceSubtitleState | null) => void) | null = null;

  private scheduledTimers: number[] = [];
  private lastPlayedByChar: Map<VoiceCharacterId, number> = new Map();
  private activeSynthNodes: { oscs: OscillatorNode[]; gains: GainNode[] } = { oscs: [], gains: [] };
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voicesBound: boolean = false;

  constructor(onSubtitleChange?: (sub: VoiceSubtitleState | null) => void) {
    this.onSubtitleChange = onSubtitleChange || null;
    this.bindSpeechVoices();
  }

  public setSubtitleListener(listener: ((sub: VoiceSubtitleState | null) => void) | null) {
    this.onSubtitleChange = listener;
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

  public getCurrentSubtitle(): VoiceSubtitleState | null {
    return this.activeSubtitle;
  }

  public getCharacterForRealm(realmId: number): VoiceCharacterId {
    return REALM_TO_BOSS_VOICE[realmId] || 'hollow_king';
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
   * Plays a character-voiced line with Web Speech API + procedural Web Audio formant bed.
   */
  public playLine(options: VoicePlayOptions): boolean {
    const profile = VOICE_ACTOR_PROFILES[options.character] || VOICE_ACTOR_PROFILES.narrator;
    const priority: VoicePriority = options.priority || 'story';
    const minGapSec = options.minGapSec ?? (priority === 'combat' ? 4.2 : 0.35);

    const nowMs = Date.now();
    if (priority === 'combat') {
      const lastMs = this.lastPlayedByChar.get(profile.id) || 0;
      if (nowMs - lastMs < minGapSec * 1000) {
        return false;
      }
      // Do not interrupt active cutscene speech with low-priority combat barks
      if (this.activeSubtitle && this.currentPriority === 'cutscene') {
        return false;
      }
      this.lastPlayedByChar.set(profile.id, nowMs);
    }

    const cleanText = options.text.replace(/^\[PROVISIONAL\]\s*/i, '').trim();
    const duration = options.duration ?? Math.max(2.4, Math.min(6.5, cleanText.length * 0.062 + 1.1));

    this.activeSubtitle = {
      character: profile.id,
      speaker: options.speaker || profile.speaker,
      speakerTitle: options.speakerTitle ?? profile.speakerTitle,
      text: cleanText,
      accentColor: profile.accentColor,
    };
    this.subtitleTimer = duration;
    this.currentPriority = priority;
    this.onSubtitleChange?.(this.activeSubtitle);

    if (audioManager.settings.isMuted) {
      return true;
    }

    // Spatial distance attenuation
    let spatialVol = 1.0;
    if (options.position && options.listenerPos) {
      const dist = options.position.distanceTo(options.listenerPos);
      spatialVol = Math.max(0.18, Math.min(1.0, 1.0 - dist / 34.0));
    }

    const masterScale = Math.max(0, Math.min(1, audioManager.settings.master));
    const sfxScale = Math.max(0, Math.min(1, audioManager.settings.sfx));
    const effectiveVol = spatialVol * profile.speech.volumeScale * masterScale * sfxScale;

    this.stopActiveSynthNodes();
    if (effectiveVol > 0.01) {
      this.playFormantBed(profile, Math.min(2.6, duration * 0.72), spatialVol);
      this.speakUtterance(cleanText, profile, effectiveVol);
    }

    return true;
  }

  /**
   * Schedules the multi-beat boss entrance confrontation (Boss taunt + Azrael retort)
   * synchronized with BossEntranceDirector's camera cuts.
   */
  public playBossIntroDialogue(realmId: number) {
    this.stopAll();
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
      duration: 4.0,
      priority: 'phase',
    });
  }

  public playBossDefeatLine(realmId: number) {
    const char = this.getCharacterForRealm(realmId);
    const scripts = BOSS_PHASE_SCRIPTS[realmId] || BOSS_PHASE_SCRIPTS[1];
    this.playLine({
      character: char,
      text: scripts.defeat,
      duration: 4.4,
      priority: 'cutscene',
    });
  }

  public playAzraelRealmEnter(realmId: number) {
    const line = AZRAEL_REALM_ENTER_LINES[realmId];
    if (!line) return;
    this.playLine({
      character: 'azrael',
      text: line,
      duration: 4.2,
      priority: 'story',
    });
  }

  public playAzraelMemoryReaction(fragmentId: string) {
    const line = AZRAEL_MEMORY_LINES[fragmentId];
    if (!line) return;
    this.playLine({
      character: 'azrael',
      text: line,
      duration: 4.4,
      priority: 'story',
    });
  }

  public playAzraelWrathBark() {
    const line = AZRAEL_WRATH_LINES[Math.floor(Math.random() * AZRAEL_WRATH_LINES.length)];
    this.playLine({
      character: 'azrael',
      text: line,
      duration: 1.8,
      priority: 'combat',
      minGapSec: 5.0,
    });
  }

  public playAzraelVictoryLine(realmId: number) {
    const line = AZRAEL_VICTORY_LINES[realmId];
    if (!line) return;
    this.playLine({
      character: 'azrael',
      text: line,
      duration: 4.2,
      priority: 'cutscene',
    });
  }

  /**
   * Cancels all scheduled voice cues, clears speechSynthesis queue, and fades synth nodes.
   */
  public stopAll() {
    if (typeof window !== 'undefined') {
      this.scheduledTimers.forEach((id) => window.clearTimeout(id));
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore unavailable speechSynthesis cancel
        }
      }
    }
    this.scheduledTimers = [];
    this.stopActiveSynthNodes();

    if (this.activeSubtitle) {
      this.activeSubtitle = null;
      this.subtitleTimer = 0;
      this.currentPriority = 'combat';
      this.onSubtitleChange?.(null);
    }
  }

  public dispose() {
    this.stopAll();
    this.onSubtitleChange = null;
  }

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

    for (const hint of profile.speech.preferredVoices) {
      const match = pool.find((v) => v.name.toLowerCase().includes(hint.toLowerCase()));
      if (match) return match;
    }
    return pool[profile.speech.fallbackSeed % pool.length] || pool[0];
  }

  private speakUtterance(text: string, profile: VoiceActorProfile, effectiveVol: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const spokenText = text.replace(/[^a-zA-Z0-9 ,.?!'—\-]/g, '');
      if (!spokenText) return;
      const utterance = new SpeechSynthesisUtterance(spokenText);
      const voice = this.selectSpeechVoice(profile);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || 'en-US';
      utterance.pitch = Math.max(0.2, Math.min(2.0, profile.speech.pitch));
      utterance.rate = Math.max(0.5, Math.min(2.0, profile.speech.rate));
      utterance.volume = Math.max(0.05, Math.min(1.0, effectiveVol));
      window.speechSynthesis.speak(utterance);
    } catch {
      // Browser blocked or unsupported speech synthesis — procedural formant bed still plays
    }
  }

  private stopActiveSynthNodes() {
    const output = audioManager.getVoiceOutput();
    if (!output) {
      this.activeSynthNodes = { oscs: [], gains: [] };
      return;
    }
    const now = output.ctx.currentTime;
    this.activeSynthNodes.gains.forEach((g) => {
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      } catch {
        // Already disconnected
      }
    });
    this.activeSynthNodes.oscs.forEach((o) => {
      try {
        o.stop(now + 0.1);
      } catch {
        // Already stopped
      }
    });
    this.activeSynthNodes = { oscs: [], gains: [] };
  }

  private playFormantBed(profile: VoiceActorProfile, duration: number, spatialVol: number) {
    const output = audioManager.getVoiceOutput();
    if (!output || output.ctx.state !== 'running') return;
    const { ctx, destination } = output;
    const now = ctx.currentTime;
    const fCfg = profile.formant;

    try {
      // Carrier vocal chord oscillators
      const oscMain = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      oscMain.type = fCfg.oscType;
      oscSub.type = fCfg.subOscType;

      oscMain.frequency.setValueAtTime(fCfg.baseFreqHz, now);
      oscMain.frequency.exponentialRampToValueAtTime(
        Math.max(28, fCfg.baseFreqHz * fCfg.pitchDropRatio),
        now + duration
      );

      oscSub.frequency.setValueAtTime(fCfg.baseFreqHz * 0.505, now);
      oscSub.frequency.exponentialRampToValueAtTime(
        Math.max(22, fCfg.baseFreqHz * 0.505 * fCfg.pitchDropRatio),
        now + duration
      );

      // Vibrato / vocal tremor LFO
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.type = 'sine';
      vibrato.frequency.setValueAtTime(fCfg.vibratoHz, now);
      vibratoGain.gain.setValueAtTime(fCfg.baseFreqHz * 0.035, now);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(oscMain.frequency);

      // Syllable-cadence amplitude tremolo
      const syllableLfo = ctx.createOscillator();
      const syllableDepth = ctx.createGain();
      syllableLfo.type = 'sine';
      syllableLfo.frequency.setValueAtTime(fCfg.syllableRateHz, now);
      syllableDepth.gain.setValueAtTime(0.06 * spatialVol, now);

      // Master vocal envelope
      const masterVoiceGain = ctx.createGain();
      masterVoiceGain.gain.setValueAtTime(0.001, now);
      masterVoiceGain.gain.linearRampToValueAtTime(0.18 * spatialVol, now + 0.14);
      masterVoiceGain.gain.setValueAtTime(0.16 * spatialVol, now + Math.max(0.25, duration - 0.35));
      masterVoiceGain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
      syllableLfo.connect(syllableDepth);
      syllableDepth.connect(masterVoiceGain.gain);

      // Triple bandpass vocal tract formants (F1, F2, F3)
      const [f1Hz, f2Hz, f3Hz] = fCfg.formants;
      [f1Hz, f2Hz, f3Hz].forEach((freq, idx) => {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(freq, now);
        // Subtle vowel shift across speech phrase
        bp.frequency.linearRampToValueAtTime(freq * (idx === 1 ? 0.85 : 1.08), now + duration * 0.65);
        bp.Q.setValueAtTime(fCfg.qFactor, now);

        const bandGain = ctx.createGain();
        bandGain.gain.value = idx === 0 ? 0.65 : idx === 1 ? 0.45 : 0.25;

        oscMain.connect(bp);
        oscSub.connect(bp);
        bp.connect(bandGain);
        bandGain.connect(masterVoiceGain);
      });

      // Signature character acoustic overtone layer
      const accentOsc = ctx.createOscillator();
      const accentGain = ctx.createGain();
      const accentFilter = ctx.createBiquadFilter();
      accentFilter.type = 'bandpass';
      accentFilter.Q.value = 3.0;

      if (fCfg.bed === 'spectral_chime' || fCfg.bed === 'celestial_chord') {
        accentOsc.type = 'sine';
        const harmonic = fCfg.bed === 'celestial_chord' ? fCfg.baseFreqHz * 4.5 : fCfg.baseFreqHz * 5.0;
        accentOsc.frequency.setValueAtTime(harmonic, now);
        accentFilter.frequency.setValueAtTime(harmonic, now);
        accentGain.gain.setValueAtTime(0.001, now);
        accentGain.gain.linearRampToValueAtTime(0.07 * spatialVol, now + 0.18);
        accentGain.gain.exponentialRampToValueAtTime(0.0005, now + duration);
      } else if (fCfg.bed === 'gilded_brass' || fCfg.bed === 'choir_drone') {
        accentOsc.type = 'triangle';
        const fifth = fCfg.baseFreqHz * 1.5;
        accentOsc.frequency.setValueAtTime(fifth, now);
        accentFilter.frequency.setValueAtTime(fifth * 2, now);
        accentGain.gain.setValueAtTime(0.001, now);
        accentGain.gain.linearRampToValueAtTime(0.09 * spatialVol, now + 0.12);
        accentGain.gain.exponentialRampToValueAtTime(0.0005, now + duration);
      } else {
        // abyssal_growl, volcanic_roar, iron_gravel, steel_resonance
        accentOsc.type = fCfg.bed === 'steel_resonance' ? 'triangle' : 'sawtooth';
        const subHz = Math.max(36, fCfg.baseFreqHz * 0.75);
        accentOsc.frequency.setValueAtTime(subHz, now);
        accentFilter.frequency.setValueAtTime(subHz * 3, now);
        accentGain.gain.setValueAtTime(0.001, now);
        accentGain.gain.linearRampToValueAtTime(0.08 * spatialVol, now + 0.10);
        accentGain.gain.exponentialRampToValueAtTime(0.0005, now + duration);
      }

      accentOsc.connect(accentFilter);
      accentFilter.connect(accentGain);
      accentGain.connect(masterVoiceGain);

      masterVoiceGain.connect(destination);

      oscMain.start(now);
      oscSub.start(now);
      vibrato.start(now);
      syllableLfo.start(now);
      accentOsc.start(now);

      const stopAt = now + duration + 0.05;
      oscMain.stop(stopAt);
      oscSub.stop(stopAt);
      vibrato.stop(stopAt);
      syllableLfo.stop(stopAt);
      accentOsc.stop(stopAt);

      this.activeSynthNodes.oscs.push(oscMain, oscSub, vibrato, syllableLfo, accentOsc);
      this.activeSynthNodes.gains.push(masterVoiceGain, accentGain);
    } catch {
      // Fail gracefully if AudioContext nodes cannot be scheduled
    }
  }
}

export const voiceManager = new VoiceManager();
