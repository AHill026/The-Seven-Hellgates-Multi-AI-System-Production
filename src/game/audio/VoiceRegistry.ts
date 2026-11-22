/**
 * THE SEVEN HELLGATES — Expressive Voice Actor Registry, Emotions & Pronunciation Dictionary
 *
 * Defines independent voice configurations for:
 * - Azrael (9 emotional states, natural chest resonance & realistic breath pacing)
 * - 7 Sovereigns (including permanently locked ElevenLabs Victor ID for The Hollow King)
 * - 8 Psychotic & Demonic Mini-Boss / Enemy Identities
 * - Ancient Narrator
 * - Canon Pronunciation Dictionary & Dramatic Dialogue Scripts
 */

export type VoiceCharacterId =
  | 'azrael'
  | 'hollow_king'
  | 'abaddon'
  | 'gilded_tyrant'
  | 'red_calamity'
  | 'saint_of_ash'
  | 'butcher_of_ruin'
  | 'sovereign_desire'
  | 'gilded_warden'
  | 'hellbrute'
  | 'shade'
  | 'devourer'
  | 'heretic'
  | 'sovereign_knight'
  | 'hellspawn'
  | 'forgotten_souls'
  | 'narrator';

export type AzraelEmotion =
  | 'calm_exploration'
  | 'curiosity'
  | 'determination'
  | 'anger'
  | 'pain'
  | 'exhaustion'
  | 'fear'
  | 'grief'
  | 'confidence';

export type VoiceIntensity = 'whisper' | 'calm' | 'normal' | 'intense' | 'furious' | 'breaking';

export type VoiceReverbPreset =
  | 'subtle_room'
  | 'dark_cavern'
  | 'boss_arena'
  | 'celestial_void';

export type PsychoticMannerism =
  | 'none'
  | 'breath_gasp'
  | 'unhinged_laugh'
  | 'aggressive_whisper'
  | 'sudden_scream'
  | 'metallic_rasp'
  | 'wet_snarl';

export interface VoiceDSPConfig {
  reverbPreset: VoiceReverbPreset;
  reverbWet: number;         // 0.0 - 0.55 (kept balanced so speech stays intelligible)
  chestWarmthDb: number;     // Low-mid natural body warmth
  presenceDb: number;        // 2.5 - 3.5kHz consonant clarity boost
  distortionDrive: number;   // 0.0 - 0.45 controlled grit
  demonicLayerGain: number;  // 0.0 - 0.28 low-frequency sub resonance layer
  demonicLayerHz: number;    // 38 - 90Hz sub-resonance frequency
}

export interface ElevenLabsVoiceConfig {
  voiceId: string;
  locked?: boolean;
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  useSpeakerBoost: boolean;
}

export interface FallbackSpeechConfig {
  basePitch: number;
  pitchVariance: number;     // Natural sentence contour variation (prevents monotone)
  baseRate: number;
  rateVariance: number;      // Natural cadence variation across clauses
  clausePauseMs: number;     // Realistic breath pause between clauses
  breathNoiseLevel: number;  // Subtle organic inhale/exhale texture (never buzzing)
  chestToneHz: number;       // Subtle natural vocal warmth under fallback speech
  chestToneGain: number;     // Restrained so words remain 100% crisp
  preferredVoices: string[];
  fallbackSeed: number;
}

export interface VoiceActorProfile {
  id: VoiceCharacterId;
  category: 'protagonist' | 'sovereign' | 'miniboss' | 'narrator';
  speaker: string;
  speakerTitle: string;
  accentColor: string;
  mannerism: PsychoticMannerism;
  elevenLabs: ElevenLabsVoiceConfig;
  dsp: VoiceDSPConfig;
  fallback: FallbackSpeechConfig;
}

export interface EmotionModifier {
  stabilityDelta: number;
  styleDelta: number;
  speedMult: number;
  pitchMult: number;
  pauseMult: number;
  breathBoost: number;
  gritBoost: number;
  defaultIntensity: VoiceIntensity;
}

/**
 * Permanently locked ElevenLabs Voice ID for The Hollow King (Victor).
 */
export const HOLLOW_KING_ELEVENLABS_VOICE_ID = 'cPoqAvGWCPfCfyPMwe4z';

/**
 * Pronunciation dictionary applied to TTS input while preserving canon display text in subtitles.
 */
export const PRONUNCIATION_DICTIONARY: Array<{ pattern: RegExp; spoken: string }> = [
  { pattern: /\bAzrael\b/gi, spoken: 'Az-ray-el' },
  { pattern: /\bAbaddon\b/gi, spoken: 'Ah-bah-don' },
  { pattern: /\bLimbo\b/gi, spoken: 'Lim-boh' },
  { pattern: /\bMonstrance\b/gi, spoken: 'Mon-strance' },
  { pattern: /\bSovereign\b/gi, spoken: 'Sov-rin' },
  { pattern: /\bGilded\b/gi, spoken: 'Gill-ded' },
  { pattern: /\bHeresy\b/gi, spoken: 'Heh-reh-see' },
  { pattern: /\bSepulcher\b/gi, spoken: 'Seh-pul-ker' },
  { pattern: /\bArbiter\b/gi, spoken: 'Ar-bih-ter' },
  { pattern: /\bOathbreaker\b/gi, spoken: 'Oath-bray-ker' },
  { pattern: /\bElerian\b/gi, spoken: 'El-eh-ree-an' },
];

export function applyPronunciationDictionary(text: string): string {
  let out = text;
  for (const entry of PRONUNCIATION_DICTIONARY) {
    out = out.replace(entry.pattern, entry.spoken);
  }
  return out;
}

export const AZRAEL_EMOTION_MODIFIERS: Record<AzraelEmotion, EmotionModifier> = {
  calm_exploration: {
    stabilityDelta: 0.08,
    styleDelta: -0.05,
    speedMult: 0.94,
    pitchMult: 0.98,
    pauseMult: 1.2,
    breathBoost: 0.04,
    gritBoost: 0.0,
    defaultIntensity: 'calm',
  },
  curiosity: {
    stabilityDelta: -0.02,
    styleDelta: 0.08,
    speedMult: 0.97,
    pitchMult: 1.04,
    pauseMult: 1.15,
    breathBoost: 0.03,
    gritBoost: 0.0,
    defaultIntensity: 'normal',
  },
  determination: {
    stabilityDelta: 0.05,
    styleDelta: 0.14,
    speedMult: 1.0,
    pitchMult: 0.96,
    pauseMult: 0.92,
    breathBoost: 0.02,
    gritBoost: 0.04,
    defaultIntensity: 'intense',
  },
  anger: {
    stabilityDelta: -0.14,
    styleDelta: 0.24,
    speedMult: 1.07,
    pitchMult: 0.93,
    pauseMult: 0.78,
    breathBoost: 0.06,
    gritBoost: 0.12,
    defaultIntensity: 'furious',
  },
  pain: {
    stabilityDelta: -0.2,
    styleDelta: 0.22,
    speedMult: 0.9,
    pitchMult: 0.89,
    pauseMult: 1.35,
    breathBoost: 0.14,
    gritBoost: 0.14,
    defaultIntensity: 'breaking',
  },
  exhaustion: {
    stabilityDelta: -0.12,
    styleDelta: 0.08,
    speedMult: 0.84,
    pitchMult: 0.87,
    pauseMult: 1.5,
    breathBoost: 0.16,
    gritBoost: 0.06,
    defaultIntensity: 'whisper',
  },
  fear: {
    stabilityDelta: -0.16,
    styleDelta: 0.15,
    speedMult: 0.96,
    pitchMult: 1.05,
    pauseMult: 1.28,
    breathBoost: 0.12,
    gritBoost: 0.02,
    defaultIntensity: 'whisper',
  },
  grief: {
    stabilityDelta: -0.08,
    styleDelta: 0.16,
    speedMult: 0.86,
    pitchMult: 0.91,
    pauseMult: 1.45,
    breathBoost: 0.1,
    gritBoost: 0.03,
    defaultIntensity: 'calm',
  },
  confidence: {
    stabilityDelta: 0.1,
    styleDelta: 0.12,
    speedMult: 0.98,
    pitchMult: 0.95,
    pauseMult: 0.95,
    breathBoost: 0.02,
    gritBoost: 0.04,
    defaultIntensity: 'intense',
  },
};

export const VOICE_ACTOR_PROFILES: Record<VoiceCharacterId, VoiceActorProfile> = {
  // --- PROTAGONIST: AZRAEL ---
  azrael: {
    id: 'azrael',
    category: 'protagonist',
    speaker: 'AZRAEL',
    speakerTitle: 'The Pale Arbiter',
    accentColor: '#38bdf8',
    mannerism: 'breath_gasp',
    elevenLabs: {
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Deep natural masculine chest voice
      stability: 0.56,
      similarityBoost: 0.84,
      style: 0.42,
      speed: 0.96,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'subtle_room',
      reverbWet: 0.14,
      chestWarmthDb: 3.5,
      presenceDb: 3.0,
      distortionDrive: 0.04,
      demonicLayerGain: 0.0,
      demonicLayerHz: 95,
    },
    fallback: {
      basePitch: 0.86,
      pitchVariance: 0.07,
      baseRate: 0.94,
      rateVariance: 0.08,
      clausePauseMs: 240,
      breathNoiseLevel: 0.045,
      chestToneHz: 98,
      chestToneGain: 0.028,
      preferredVoices: [
        'Daniel',
        'Arthur',
        'Ryan',
        'Guy',
        'Microsoft Andrew',
        'Google UK English Male',
        'Alex',
      ],
      fallbackSeed: 0,
    },
  },

  // --- SEVEN SOVEREIGNS ---
  hollow_king: {
    id: 'hollow_king',
    category: 'sovereign',
    speaker: 'THE HOLLOW KING',
    speakerTitle: 'Ruler of Limbo',
    accentColor: '#38bdf8',
    mannerism: 'none',
    elevenLabs: {
      voiceId: HOLLOW_KING_ELEVENLABS_VOICE_ID, // Permanently selected Victor voice
      locked: true,
      stability: 0.44,
      similarityBoost: 0.88,
      style: 0.62,
      speed: 0.88,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'dark_cavern',
      reverbWet: 0.32,
      chestWarmthDb: 4.5,
      presenceDb: 3.5,
      distortionDrive: 0.08,
      demonicLayerGain: 0.12,
      demonicLayerHz: 54,
    },
    fallback: {
      basePitch: 0.68,
      pitchVariance: 0.08,
      baseRate: 0.84,
      rateVariance: 0.06,
      clausePauseMs: 320,
      breathNoiseLevel: 0.04,
      chestToneHz: 68,
      chestToneGain: 0.045,
      preferredVoices: ['George', 'Arthur', 'Microsoft George', 'Google UK English Male', 'Daniel'],
      fallbackSeed: 1,
    },
  },

  abaddon: {
    id: 'abaddon',
    category: 'sovereign',
    speaker: 'ABADDON',
    speakerTitle: 'The Maw of Endless Hunger',
    accentColor: '#84cc16',
    mannerism: 'wet_snarl',
    elevenLabs: {
      voiceId: 'VR6AewLTigWG4xSOukaG',
      stability: 0.34,
      similarityBoost: 0.82,
      style: 0.72,
      speed: 0.84,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'dark_cavern',
      reverbWet: 0.36,
      chestWarmthDb: 6.0,
      presenceDb: 3.2,
      distortionDrive: 0.24,
      demonicLayerGain: 0.22,
      demonicLayerHz: 42,
    },
    fallback: {
      basePitch: 0.52,
      pitchVariance: 0.11,
      baseRate: 0.8,
      rateVariance: 0.09,
      clausePauseMs: 300,
      breathNoiseLevel: 0.075,
      chestToneHz: 48,
      chestToneGain: 0.065,
      preferredVoices: ['Bruce', 'Ralph', 'Grandpa', 'Fred', 'Google US English'],
      fallbackSeed: 2,
    },
  },

  gilded_tyrant: {
    id: 'gilded_tyrant',
    category: 'sovereign',
    speaker: 'THE GILDED TYRANT',
    speakerTitle: 'Emperor of Greed',
    accentColor: '#f59e0b',
    mannerism: 'none',
    elevenLabs: {
      voiceId: 'onwK4e9ZLuTAKqWW03F9',
      stability: 0.72,
      similarityBoost: 0.86,
      style: 0.38,
      speed: 0.91,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'boss_arena',
      reverbWet: 0.24,
      chestWarmthDb: 2.5,
      presenceDb: 4.0,
      distortionDrive: 0.02,
      demonicLayerGain: 0.05,
      demonicLayerHz: 66,
    },
    fallback: {
      basePitch: 0.76,
      pitchVariance: 0.05,
      baseRate: 0.89,
      rateVariance: 0.05,
      clausePauseMs: 280,
      breathNoiseLevel: 0.02,
      chestToneHz: 78,
      chestToneGain: 0.03,
      preferredVoices: ['Arthur', 'Matthew', 'Christopher', 'Microsoft David', 'Daniel'],
      fallbackSeed: 3,
    },
  },

  red_calamity: {
    id: 'red_calamity',
    category: 'sovereign',
    speaker: 'THE RED CALAMITY',
    speakerTitle: 'Warlord of Wrath',
    accentColor: '#ef4444',
    mannerism: 'sudden_scream',
    elevenLabs: {
      voiceId: 'TxGEqnHWrfWFTfGW9XjX',
      stability: 0.28,
      similarityBoost: 0.78,
      style: 0.85,
      speed: 1.08,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'boss_arena',
      reverbWet: 0.26,
      chestWarmthDb: 4.5,
      presenceDb: 3.8,
      distortionDrive: 0.28,
      demonicLayerGain: 0.16,
      demonicLayerHz: 58,
    },
    fallback: {
      basePitch: 0.64,
      pitchVariance: 0.16,
      baseRate: 1.05,
      rateVariance: 0.12,
      clausePauseMs: 160,
      breathNoiseLevel: 0.065,
      chestToneHz: 62,
      chestToneGain: 0.055,
      preferredVoices: ['Aaron', 'Mark', 'Rocko', 'Google US English', 'Daniel'],
      fallbackSeed: 4,
    },
  },

  saint_of_ash: {
    id: 'saint_of_ash',
    category: 'sovereign',
    speaker: 'THE SAINT OF ASH',
    speakerTitle: 'Prelate of Heresy',
    accentColor: '#818cf8',
    mannerism: 'aggressive_whisper',
    elevenLabs: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      stability: 0.52,
      similarityBoost: 0.85,
      style: 0.54,
      speed: 0.86,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'boss_arena',
      reverbWet: 0.38,
      chestWarmthDb: 1.5,
      presenceDb: 4.2,
      distortionDrive: 0.05,
      demonicLayerGain: 0.09,
      demonicLayerHz: 74,
    },
    fallback: {
      basePitch: 0.94,
      pitchVariance: 0.09,
      baseRate: 0.84,
      rateVariance: 0.07,
      clausePauseMs: 340,
      breathNoiseLevel: 0.06,
      chestToneHz: 112,
      chestToneGain: 0.032,
      preferredVoices: ['Victoria', 'Hazel', 'Libby', 'Google UK English Female', 'Samantha'],
      fallbackSeed: 5,
    },
  },

  butcher_of_ruin: {
    id: 'butcher_of_ruin',
    category: 'sovereign',
    speaker: 'THE BUTCHER OF RUIN',
    speakerTitle: 'Executioner of Violence',
    accentColor: '#dc2626',
    mannerism: 'unhinged_laugh',
    elevenLabs: {
      voiceId: 'IKne3meq5aSn9XLyUdCD',
      stability: 0.3,
      similarityBoost: 0.8,
      style: 0.82,
      speed: 0.93,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'dark_cavern',
      reverbWet: 0.28,
      chestWarmthDb: 5.5,
      presenceDb: 3.4,
      distortionDrive: 0.32,
      demonicLayerGain: 0.2,
      demonicLayerHz: 48,
    },
    fallback: {
      basePitch: 0.56,
      pitchVariance: 0.18,
      baseRate: 0.9,
      rateVariance: 0.14,
      clausePauseMs: 210,
      breathNoiseLevel: 0.08,
      chestToneHz: 54,
      chestToneGain: 0.06,
      preferredVoices: ['Bruce', 'Eddy', 'David', 'Ralph', 'Mark'],
      fallbackSeed: 6,
    },
  },

  sovereign_desire: {
    id: 'sovereign_desire',
    category: 'sovereign',
    speaker: 'THE SOVEREIGN OF DESIRE',
    speakerTitle: 'The White-Eyed God',
    accentColor: '#e2e8f0',
    mannerism: 'none',
    elevenLabs: {
      voiceId: 'N2lVS1w4EtoT3dr4eOWO',
      stability: 0.82,
      similarityBoost: 0.9,
      style: 0.25,
      speed: 0.82,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'celestial_void',
      reverbWet: 0.42,
      chestWarmthDb: 2.0,
      presenceDb: 3.6,
      distortionDrive: 0.0,
      demonicLayerGain: 0.1,
      demonicLayerHz: 44,
    },
    fallback: {
      basePitch: 0.82,
      pitchVariance: 0.04,
      baseRate: 0.8,
      rateVariance: 0.04,
      clausePauseMs: 380,
      breathNoiseLevel: 0.025,
      chestToneHz: 86,
      chestToneGain: 0.035,
      preferredVoices: ['Serena', 'Tessa', 'Karen', 'Google UK English Female', 'Daniel'],
      fallbackSeed: 7,
    },
  },

  // --- MINI-BOSSES & PSYCHOTIC DEMONIC ENEMIES (Distinct Profiles) ---
  gilded_warden: {
    id: 'gilded_warden',
    category: 'miniboss',
    speaker: 'THE GILDED WARDEN',
    speakerTitle: 'Executioner of the Vault',
    accentColor: '#fbbf24',
    mannerism: 'metallic_rasp',
    elevenLabs: {
      voiceId: 'SOYHLrjzK2X1ezoPC6cr',
      stability: 0.26,
      similarityBoost: 0.78,
      style: 0.76,
      speed: 0.9,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'boss_arena',
      reverbWet: 0.3,
      chestWarmthDb: 4.0,
      presenceDb: 3.6,
      distortionDrive: 0.26,
      demonicLayerGain: 0.16,
      demonicLayerHz: 52,
    },
    fallback: {
      basePitch: 0.62,
      pitchVariance: 0.22,
      baseRate: 0.88,
      rateVariance: 0.16,
      clausePauseMs: 250,
      breathNoiseLevel: 0.085,
      chestToneHz: 58,
      chestToneGain: 0.05,
      preferredVoices: ['Zarvox', 'Ralph', 'Grandpa', 'Fred', 'George'],
      fallbackSeed: 2,
    },
  },

  hellbrute: {
    id: 'hellbrute',
    category: 'miniboss',
    speaker: 'HELLBRUTE MAULER',
    speakerTitle: 'Demonic Juggernaut',
    accentColor: '#f97316',
    mannerism: 'sudden_scream',
    elevenLabs: {
      voiceId: 'VR6AewLTigWG4xSOukaG',
      stability: 0.22,
      similarityBoost: 0.75,
      style: 0.88,
      speed: 0.94,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'dark_cavern',
      reverbWet: 0.28,
      chestWarmthDb: 6.0,
      presenceDb: 3.0,
      distortionDrive: 0.34,
      demonicLayerGain: 0.24,
      demonicLayerHz: 44,
    },
    fallback: {
      basePitch: 0.48,
      pitchVariance: 0.24,
      baseRate: 0.87,
      rateVariance: 0.18,
      clausePauseMs: 180,
      breathNoiseLevel: 0.095,
      chestToneHz: 45,
      chestToneGain: 0.065,
      preferredVoices: ['Bruce', 'Grandpa', 'Rocko', 'Mark'],
      fallbackSeed: 4,
    },
  },

  shade: {
    id: 'shade',
    category: 'miniboss',
    speaker: 'ABYSSAL SHADE',
    speakerTitle: 'Whispering Wraith',
    accentColor: '#c084fc',
    mannerism: 'aggressive_whisper',
    elevenLabs: {
      voiceId: 'AZnzlk1XvdvUeBnXmlld',
      stability: 0.25,
      similarityBoost: 0.76,
      style: 0.8,
      speed: 1.06,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'celestial_void',
      reverbWet: 0.4,
      chestWarmthDb: -1.0,
      presenceDb: 4.5,
      distortionDrive: 0.12,
      demonicLayerGain: 0.08,
      demonicLayerHz: 82,
    },
    fallback: {
      basePitch: 1.18,
      pitchVariance: 0.28,
      baseRate: 1.06,
      rateVariance: 0.18,
      clausePauseMs: 210,
      breathNoiseLevel: 0.09,
      chestToneHz: 142,
      chestToneGain: 0.025,
      preferredVoices: ['Whisper', 'Victoria', 'Tessa', 'Samantha'],
      fallbackSeed: 5,
    },
  },

  devourer: {
    id: 'devourer',
    category: 'miniboss',
    speaker: 'FLESH DEVOURER',
    speakerTitle: 'Starving Abomination',
    accentColor: '#84cc16',
    mannerism: 'wet_snarl',
    elevenLabs: {
      voiceId: 'IKne3meq5aSn9XLyUdCD',
      stability: 0.2,
      similarityBoost: 0.74,
      style: 0.9,
      speed: 0.98,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'dark_cavern',
      reverbWet: 0.3,
      chestWarmthDb: 4.5,
      presenceDb: 3.4,
      distortionDrive: 0.3,
      demonicLayerGain: 0.2,
      demonicLayerHz: 49,
    },
    fallback: {
      basePitch: 0.58,
      pitchVariance: 0.26,
      baseRate: 0.95,
      rateVariance: 0.2,
      clausePauseMs: 170,
      breathNoiseLevel: 0.1,
      chestToneHz: 52,
      chestToneGain: 0.055,
      preferredVoices: ['Fred', 'Eddy', 'Ralph', 'Junior'],
      fallbackSeed: 6,
    },
  },

  heretic: {
    id: 'heretic',
    category: 'miniboss',
    speaker: 'ASHEN HERETIC',
    speakerTitle: 'Unhinged Zealot',
    accentColor: '#a78bfa',
    mannerism: 'unhinged_laugh',
    elevenLabs: {
      voiceId: 'MF3mGyEYCl7XYWbV9V6O',
      stability: 0.22,
      similarityBoost: 0.76,
      style: 0.88,
      speed: 1.08,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'boss_arena',
      reverbWet: 0.34,
      chestWarmthDb: 0.5,
      presenceDb: 4.4,
      distortionDrive: 0.16,
      demonicLayerGain: 0.06,
      demonicLayerHz: 78,
    },
    fallback: {
      basePitch: 1.08,
      pitchVariance: 0.3,
      baseRate: 1.07,
      rateVariance: 0.22,
      clausePauseMs: 165,
      breathNoiseLevel: 0.075,
      chestToneHz: 118,
      chestToneGain: 0.028,
      preferredVoices: ['Junior', 'Hazel', 'Libby', 'Karen'],
      fallbackSeed: 7,
    },
  },

  sovereign_knight: {
    id: 'sovereign_knight',
    category: 'miniboss',
    speaker: 'SOVEREIGN VOID KNIGHT',
    speakerTitle: 'Oathbound Revenant',
    accentColor: '#94a3b8',
    mannerism: 'metallic_rasp',
    elevenLabs: {
      voiceId: 'Zlb1dXrM653N07WRdFW3',
      stability: 0.42,
      similarityBoost: 0.84,
      style: 0.62,
      speed: 0.9,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'boss_arena',
      reverbWet: 0.28,
      chestWarmthDb: 3.5,
      presenceDb: 3.5,
      distortionDrive: 0.14,
      demonicLayerGain: 0.14,
      demonicLayerHz: 56,
    },
    fallback: {
      basePitch: 0.72,
      pitchVariance: 0.14,
      baseRate: 0.88,
      rateVariance: 0.1,
      clausePauseMs: 260,
      breathNoiseLevel: 0.055,
      chestToneHz: 68,
      chestToneGain: 0.04,
      preferredVoices: ['George', 'Arthur', 'Daniel'],
      fallbackSeed: 1,
    },
  },

  hellspawn: {
    id: 'hellspawn',
    category: 'miniboss',
    speaker: 'HELLSPAWN FIEND',
    speakerTitle: 'Feral Tormentor',
    accentColor: '#f87171',
    mannerism: 'unhinged_laugh',
    elevenLabs: {
      voiceId: 'TxGEqnHWrfWFTfGW9XjX',
      stability: 0.2,
      similarityBoost: 0.72,
      style: 0.92,
      speed: 1.1,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'subtle_room',
      reverbWet: 0.2,
      chestWarmthDb: 2.0,
      presenceDb: 4.0,
      distortionDrive: 0.28,
      demonicLayerGain: 0.12,
      demonicLayerHz: 64,
    },
    fallback: {
      basePitch: 0.96,
      pitchVariance: 0.32,
      baseRate: 1.12,
      rateVariance: 0.22,
      clausePauseMs: 145,
      breathNoiseLevel: 0.085,
      chestToneHz: 84,
      chestToneGain: 0.04,
      preferredVoices: ['Rocko', 'Aaron', 'Eddy', 'Fred'],
      fallbackSeed: 3,
    },
  },

  forgotten_souls: {
    id: 'forgotten_souls',
    category: 'miniboss',
    speaker: 'THE FORGOTTEN SOULS',
    speakerTitle: 'Prisoners of Bronze',
    accentColor: '#fcd34d',
    mannerism: 'aggressive_whisper',
    elevenLabs: {
      voiceId: 'ThT5KcBeYPX3keUQqHPh',
      stability: 0.36,
      similarityBoost: 0.8,
      style: 0.65,
      speed: 0.86,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'celestial_void',
      reverbWet: 0.38,
      chestWarmthDb: 0.0,
      presenceDb: 4.0,
      distortionDrive: 0.04,
      demonicLayerGain: 0.05,
      demonicLayerHz: 88,
    },
    fallback: {
      basePitch: 1.05,
      pitchVariance: 0.18,
      baseRate: 0.85,
      rateVariance: 0.14,
      clausePauseMs: 290,
      breathNoiseLevel: 0.08,
      chestToneHz: 132,
      chestToneGain: 0.025,
      preferredVoices: ['Samantha', 'Victoria', 'Tessa', 'Google UK English Female'],
      fallbackSeed: 5,
    },
  },

  // --- NARRATOR / ANCIENT INSCRIPTION ---
  narrator: {
    id: 'narrator',
    category: 'narrator',
    speaker: 'CHRONICLE OF THE SEALS',
    speakerTitle: 'Ancient Inscription',
    accentColor: '#94a3b8',
    mannerism: 'none',
    elevenLabs: {
      voiceId: 'onwK4e9ZLuTAKqWW03F9',
      stability: 0.68,
      similarityBoost: 0.86,
      style: 0.4,
      speed: 0.9,
      useSpeakerBoost: true,
    },
    dsp: {
      reverbPreset: 'dark_cavern',
      reverbWet: 0.25,
      chestWarmthDb: 3.0,
      presenceDb: 3.2,
      distortionDrive: 0.0,
      demonicLayerGain: 0.04,
      demonicLayerHz: 70,
    },
    fallback: {
      basePitch: 0.82,
      pitchVariance: 0.06,
      baseRate: 0.89,
      rateVariance: 0.05,
      clausePauseMs: 280,
      breathNoiseLevel: 0.03,
      chestToneHz: 84,
      chestToneGain: 0.025,
      preferredVoices: ['George', 'Arthur', 'Daniel', 'Alex', 'Google UK English Male'],
      fallbackSeed: 0,
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

export interface BossIntroLineCue {
  delaySec: number;
  character: VoiceCharacterId;
  text: string;
  duration: number;
  emotion?: AzraelEmotion;
  intensity?: VoiceIntensity;
}

export const BOSS_INTRO_SCRIPTS: Record<number, BossIntroLineCue[]> = {
  1: [
    {
      delaySec: 0.65,
      character: 'hollow_king',
      text: 'Azrael... you wander once more into the shadow of the Seal. Draw steel, oathbreaker.',
      duration: 3.1,
      intensity: 'intense',
    },
    {
      delaySec: 3.9,
      character: 'azrael',
      text: 'Your vigil in the ash ends here, Hollow King.',
      duration: 2.2,
      emotion: 'determination',
      intensity: 'intense',
    },
  ],
  2: [
    {
      delaySec: 0.65,
      character: 'abaddon',
      text: 'We are the Great Gullet! Step into the feast and dissolve into our glory!',
      duration: 3.1,
      intensity: 'furious',
    },
    {
      delaySec: 3.9,
      character: 'azrael',
      text: 'Starve upon the blade, Abaddon.',
      duration: 2.1,
      emotion: 'anger',
      intensity: 'intense',
    },
  ],
  3: [
    {
      delaySec: 0.65,
      character: 'gilded_tyrant',
      text: 'Every soul in this vault carries a price. Pay your tribute in blood, Pale Arbiter.',
      duration: 3.1,
      intensity: 'calm',
    },
    {
      delaySec: 3.9,
      character: 'azrael',
      text: 'Keep your molten crown. I claim only the Seal.',
      duration: 2.2,
      emotion: 'confidence',
      intensity: 'intense',
    },
  ],
  4: [
    {
      delaySec: 0.6,
      character: 'red_calamity',
      text: 'Come, steel-born! Let the ash drink our fury until the world splits!',
      duration: 3.0,
      intensity: 'furious',
    },
    {
      delaySec: 3.8,
      character: 'azrael',
      text: 'Your flames burn blind. Steel holds colder truth.',
      duration: 2.2,
      emotion: 'determination',
      intensity: 'intense',
    },
  ],
  5: [
    {
      delaySec: 0.7,
      character: 'saint_of_ash',
      text: 'Kneel before the inverted choir, apostate. Salvation is forged only in cinders.',
      duration: 3.1,
      intensity: 'whisper',
    },
    {
      delaySec: 4.0,
      character: 'azrael',
      text: 'False prayers will not bar the Fifth Gate.',
      duration: 2.2,
      emotion: 'determination',
      intensity: 'intense',
    },
  ],
  6: [
    {
      delaySec: 0.65,
      character: 'butcher_of_ruin',
      text: 'No chains break faster than bone! Step onto the block and be unmade!',
      duration: 3.0,
      intensity: 'furious',
    },
    {
      delaySec: 3.85,
      character: 'azrael',
      text: 'Then swing your cleaver, Butcher. Let us test the iron.',
      duration: 2.2,
      emotion: 'confidence',
      intensity: 'intense',
    },
  ],
  7: [
    {
      delaySec: 0.7,
      character: 'sovereign_desire',
      text: 'Look into the White Eye, Azrael. Every seal you shattered was a reflection of your own throne.',
      duration: 3.3,
      intensity: 'calm',
    },
    {
      delaySec: 4.2,
      character: 'azrael',
      text: 'Then I shatter the mirror too. No god sits beyond the Seventh Gate.',
      duration: 2.4,
      emotion: 'anger',
      intensity: 'intense',
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

export const AZRAEL_REALM_ENTER_LINES: Record<
  number,
  { text: string; emotion: AzraelEmotion }
> = {
  1: {
    text: 'Cold ash and shattered vows... Something waits beyond this mist.',
    emotion: 'calm_exploration',
  },
  2: {
    text: 'The very stone breathes... Abaddon hungers behind these ribs.',
    emotion: 'fear',
  },
  3: {
    text: 'A mountain of gold built over rotting bones. The Third Gate lies ahead.',
    emotion: 'curiosity',
  },
  4: {
    text: 'The air tastes of iron and cinder. The Red Calamity waits.',
    emotion: 'determination',
  },
  5: {
    text: 'Cathedrals hung upside down in defiance of heaven... A hollow liturgy.',
    emotion: 'curiosity',
  },
  6: {
    text: 'Chains strung from an unseen sky. Only slaughter lingers here.',
    emotion: 'anger',
  },
  7: {
    text: 'Beyond the Seven Gates... the void remembers my name.',
    emotion: 'grief',
  },
};

export const AZRAEL_MEMORY_LINES: Record<
  string,
  { text: string; emotion: AzraelEmotion }
> = {
  frag_crown: {
    text: 'A crown cast into ash... Why does my hand remember its weight?',
    emotion: 'grief',
  },
  frag_sword: {
    text: 'Celestial steel, quenched in abyssal frost... I forged this oath.',
    emotion: 'curiosity',
  },
  frag_seals: {
    text: 'Seven gates to lock away a single throne... Were we guardians, or prisoners?',
    emotion: 'fear',
  },
};

export const AZRAEL_WRATH_LINES: string[] = [
  'Break!',
  'Unseal the wrath!',
  'Fall to ash!',
  'Steel remembers!',
];

export const AZRAEL_PAIN_LINES: string[] = [
  'Ugh—hold the line...',
  'Nngh—not yet!',
  'Steel bends... I will not.',
  'A shallow wound...',
];

export const AZRAEL_EXHAUSTION_LINES: string[] = [
  'The cold... takes me... back to the ash...',
  'Not even the seals... could hold this weight...',
  'I will rise... at the gate...',
];

export const AZRAEL_SPECIAL_ATTACK_LINES: string[] = [
  'Shatter!',
  'Feel the weight of the Seal!',
  'No chain holds me!',
  'By cold iron and ash!',
];

export const AZRAEL_VICTORY_LINES: Record<
  number,
  { text: string; emotion: AzraelEmotion }
> = {
  1: { text: 'Rest in silence, Hollow King. The first seal is mine.', emotion: 'grief' },
  2: { text: 'The feast is ended. Yet this relic feels strangely familiar.', emotion: 'curiosity' },
  3: { text: 'Neither gold nor empire endures the Pale Arbiter.', emotion: 'confidence' },
  4: { text: 'Your fury burns out. Onward to the Fifth Gate.', emotion: 'determination' },
  5: { text: 'Your choir is silenced, Saint of Ash.', emotion: 'confidence' },
  6: { text: 'The chains fall still. Six seals unmade.', emotion: 'exhaustion' },
  7: { text: 'The Seventh Gate breaks... What waits behind the White Eye?', emotion: 'fear' },
};

export const MINI_BOSS_BARKS: Record<
  string,
  { aggro: string[]; enraged: string[] }
> = {
  gilded_warden: {
    aggro: [
      'Trespasser... your marrow pays the toll! Ha-ha-hah!',
      'So quiet inside the bronze... come join the choir of locks!',
      'The chains... they sing for fresh meat...',
    ],
    enraged: [
      'BREAK THE BONES! SPILL THE GOLD! HAHAHAHA!',
      'WE CANNOT STOP! STRIKE! SHATTER! SCREAM!',
    ],
  },
  hellbrute: {
    aggro: [
      'CRACK YOUR SPINE! DRINK THE ASH!',
      'Fresh steel... hhhk—I will snap you in half!',
    ],
    enraged: [
      'MORE BLOOD! TEAR HIM OPEN!',
      'NO ESCAPE FROM THE MAULER!',
    ],
  },
  shade: {
    aggro: [
      'Shhh... do you hear your own heartbeat slowing...?',
      'Heh-heh... little ghost in black iron, come fade with us...',
    ],
    enraged: [
      'SHRIEK FOR THE VOID! WE CLAIM YOUR SHADOW!',
      'Cold fingers around your throat... closer... closer!',
    ],
  },
  devourer: {
    aggro: [
      'Ssshhk—so warm... peel the armor off the meat!',
      'Hungry... always chewing... feed the gullet!',
    ],
    enraged: [
      'FEAST! RIP! SWALLOW IT WHOLE!',
      'NEVER ENOUGH FLESH!',
    ],
  },
  heretic: {
    aggro: [
      'Hahah! Pray to the ash, little heretic—nobody hears!',
      'Burn the scripture! Bleed for the inverted hymn!',
    ],
    enraged: [
      'LET THE CINDERS BLIND YOU! HAHAHA!',
      'SACRIFICE! SACRIFICE AT THE ALTAR!',
    ],
  },
  sovereign_knight: {
    aggro: [
      'You carry a dead king’s stride... prove your steel, traitor.',
      'No knight passes the threshold breathing.',
    ],
    enraged: [
      'OATHBREAKER! FACE THE FINAL SENTENCE!',
      'CUT HIM DOWN TO CINDERS!',
    ],
  },
  hellspawn: {
    aggro: [
      'Heheheh! Bleed, prey! Bleed!',
      'Sss—taste his iron! Tear the cloak!',
    ],
    enraged: [
      'KILL! RIP THE HELM! HAHAHA!',
      'DIE IN THE ASH!',
    ],
  },
};

export const WHITE_EYED_GOD_WHISPER =
  'Azrael... At last, the final seal dissolves. Look upon your own crown beyond the void.';
