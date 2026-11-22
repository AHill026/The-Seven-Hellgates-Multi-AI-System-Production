/**
 * The Seven Hellgates - Realm II: Abaddon
 * Complete Corrupted Dialogue System & Web Audio Vocal Formant Synthesizer
 *
 * Implements:
 * A. Realm Introduction Cinematic
 * B. Environmental Inscriptions & Discoveries
 * C. Enemy Dialogue (Hungerborn, Gut Reavers, Fleshbound Brutes, Devouring Matriarch)
 * D. Sovereign Introduction (Azrael vs The Maw of Endless Hunger)
 * E. Three-Phase Combat Dialogue & Attack Warnings
 * F. Defeat Cinematic & Monstrance Weapon Claiming Sequence
 */

import * as THREE from 'three';

export interface DialogueLine {
  speaker: string;
  speakerTitle?: string;
  text: string;
  duration: number; // In seconds
  tone?: 'demonic' | 'whisper' | 'feral' | 'azrael' | 'ancient';
}

export const ABADDON_REALM_INTRO_DIALOGUE: DialogueLine[] = [
  {
    speaker: 'THE REALM OF ABADDON',
    speakerTitle: 'The Second Hellgate — Gluttony',
    text: 'You step into the belly of a dying god that refuses to starve.',
    duration: 4.5,
    tone: 'ancient',
  },
  {
    speaker: 'THE REALM OF ABADDON',
    speakerTitle: 'The Law of Flesh',
    text: 'Every archway is bone. Every vine draws blood. Everything here must consume, or be consumed.',
    duration: 5.0,
    tone: 'demonic',
  },
  {
    speaker: 'THE REALM OF ABADDON',
    speakerTitle: 'The Sovereign Below',
    text: 'Deep within the Basilica waits The Maw of Endless Hunger, seated upon a throne of devoured kingdoms.',
    duration: 5.2,
    tone: 'demonic',
  },
];

export const ABADDON_INSCRIPTIONS: DialogueLine[] = [
  {
    speaker: 'BONE CARVING',
    speakerTitle: 'Trench of the Unnamed',
    text: 'We offered our harvest. When the granaries emptied, we offered our elders. Still, it demanded more.',
    duration: 4.8,
    tone: 'ancient',
  },
  {
    speaker: 'CHALICE RELIEF',
    speakerTitle: 'The First Communion of Abaddon',
    text: 'Drink of the sacred bile. Cast aside thy mortal form and become nourishment for the Sovereign.',
    duration: 5.0,
    tone: 'demonic',
  },
  {
    speaker: 'LORE INSCRIPTION',
    speakerTitle: 'Monstrance of the False Deity',
    text: 'The golden relic does not honor the gods. It devours their light and stores their agony as holy oil.',
    duration: 5.2,
    tone: 'ancient',
  },
];

export const ABADDON_ENEMY_DIALOGUE: Record<string, string[]> = {
  hungerborn: [
    'Still… hungry…',
    'More… we need more…',
    'Feed… give us your flesh…',
    'It is never enough… never…',
    'Cold inside… only hunger warm…',
  ],
  gut_reaver: [
    'This territory is MINE!',
    'The Maw demands fresh meat!',
    'You will feed the depths!',
    'Tear the limbs! Offer the marrow!',
  ],
  fleshbound_brute: [
    'HUNGER!',
    'CONSUME!',
    'THE MAW… COMMANDS!',
    'CRUSH AND DEVOUR!',
  ],
  devouring_matriarch: [
    'Screeech! Protect the brood-pit!',
    'Flesh for the newborns! Swarm him!',
    'You trespass upon the feast of the Mother!',
  ],
};

export const MAW_INTRO_CONFRONTATION: DialogueLine[] = [
  {
    speaker: 'THE MAW OF ENDLESS HUNGER',
    speakerTitle: 'Sovereign of Gluttony',
    text: 'A mortal vessel… yet your spirit carries the chill of the Black Gate.',
    duration: 4.5,
    tone: 'demonic',
  },
  {
    speaker: 'AZRAEL',
    speakerTitle: 'The Pale Arbiter',
    text: 'Your banquet ends today, false deity. The seals of Limbo have fallen.',
    duration: 3.8,
    tone: 'azrael',
  },
  {
    speaker: 'THE MAW OF ENDLESS HUNGER',
    speakerTitle: 'Sovereign of Gluttony',
    text: 'Fallen? No, little soul. Consumption is the only truth in this universe. All stars will gutter, all empires starve. Enter my belly and find eternity.',
    duration: 6.5,
    tone: 'demonic',
  },
];

export const MAW_COMBAT_DIALOGUE = {
  phase1Start: 'Taste the holy nectar of our communion!',
  phase1BileEruption: 'Drown in the bile of ten thousand consumed kings!',
  phase1FeedingRecovery: 'Your strikes merely season the flesh! We feast to mend!',
  phase2Start: 'The ceremonial robes constrain our divinity! Behold the unbound hunger!',
  phase2TentacleFury: 'Writhing tendrils! Seize every drop of his essence!',
  phase3Start: 'THE ROOTS OF THE ARENA ARE MINE! ALL FLESH RETURNS TO THE MAW!',
  phase3Vortex: 'NOTHING ESCAPES! DRAW DOWN INTO THE BLACK DIGESTION!',
  phase3ExecutionOpportunity: 'The holy monstrance wavers! Strike now, Arbiter!',
};

export const MAW_DEFEAT_CINEMATIC: DialogueLine[] = [
  {
    speaker: 'THE MAW OF ENDLESS HUNGER',
    speakerTitle: 'Sovereign of Gluttony',
    text: 'Our… appetite… it was never sated… how can the empty… die…',
    duration: 5.0,
    tone: 'demonic',
  },
  {
    speaker: 'NARRATOR',
    speakerTitle: 'The Collapse of Abaddon',
    text: 'The colossal halo shatters. The parasitic heart of the realm groans as tentacles wither and turn to ash.',
    duration: 5.5,
    tone: 'ancient',
  },
  {
    speaker: 'NARRATOR',
    speakerTitle: 'The Gluttonous Monstrance',
    text: 'From the dissolved regalia, the golden Monstrance floats into Azrael’s grip. A faint pulse ripples through the metal—as though the weapon has waited millennia for its rightful master.',
    duration: 6.0,
    tone: 'ancient',
  },
  {
    speaker: 'AZRAEL',
    speakerTitle: 'The Pale Arbiter',
    text: 'I remember this weight… but from where?',
    duration: 4.0,
    tone: 'azrael',
  },
];

export class AbaddonDialogueController {
  private activeDialogue: DialogueLine | null = null;
  private dialogueTimer: number = 0;
  private onSubtitleUpdate: (line: DialogueLine | null) => void;

  // Web Audio Context & Synthesizer Nodes
  private audioCtx: AudioContext | null = null;
  private isAudioInitialized: boolean = false;
  private formantGain: GainNode | null = null;

  constructor(onSubtitleUpdate: (line: DialogueLine | null) => void) {
    this.onSubtitleUpdate = onSubtitleUpdate;
  }

  private initAudio() {
    if (this.isAudioInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();
      this.formantGain = this.audioCtx.createGain();
      this.formantGain.gain.value = 0.22;
      this.formantGain.connect(this.audioCtx.destination);
      this.isAudioInitialized = true;
    } catch {
      // AudioContext policy handled gracefully
    }
  }

  public playDialogue(line: DialogueLine, position?: THREE.Vector3, listenerPos?: THREE.Vector3) {
    this.initAudio();
    this.activeDialogue = line;
    this.dialogueTimer = line.duration;
    this.onSubtitleUpdate(line);

    // Spatial volume attenuation
    let spatialVol = 1.0;
    if (position && listenerPos) {
      const dist = position.distanceTo(listenerPos);
      spatialVol = Math.max(0.1, Math.min(1.0, 1.0 - (dist / 32.0)));
    }

    // Synthesize vocal formants based on tone
    if (this.audioCtx && this.formantGain && this.audioCtx.state === 'running') {
      this.synthesizeVocalFormant(line.tone || 'demonic', spatialVol);
    }

    // Layer with subtle speech synthesis whisper if available
    this.speakWhisper(line.text, line.tone);
  }

  private synthesizeVocalFormant(tone: string, volume: number) {
    if (!this.audioCtx || !this.formantGain) return;
    const now = this.audioCtx.currentTime;

    // Base pitch determination
    const baseFreq = tone === 'demonic' ? 55 : tone === 'feral' ? 140 : tone === 'azrael' ? 95 : 70;

    // Dual detuned oscillators
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 1.02, now);

    // Formant Bandpass Filters (F1 ~ 350Hz, F2 ~ 800Hz, F3 ~ 2400Hz for guttural demonic resonance)
    const f1 = this.audioCtx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(320, now);
    f1.Q.setValueAtTime(4.0, now);

    const f2 = this.audioCtx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(780, now);
    f2.Q.setValueAtTime(3.5, now);

    const voiceGain = this.audioCtx.createGain();
    voiceGain.gain.setValueAtTime(0.001, now);
    voiceGain.gain.exponentialRampToValueAtTime(0.28 * volume, now + 0.12);
    voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc1.connect(f1);
    osc2.connect(f2);
    f1.connect(voiceGain);
    f2.connect(voiceGain);
    voiceGain.connect(this.formantGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
  }

  private speakWhisper(text: string, tone?: string) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[^a-zA-Z0-9 ,.?!'—]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.volume = tone === 'demonic' ? 0.35 : tone === 'azrael' ? 0.45 : 0.25;
      utterance.pitch = tone === 'demonic' ? 0.45 : tone === 'feral' ? 1.4 : 0.75;
      utterance.rate = tone === 'demonic' ? 0.8 : tone === 'ancient' ? 0.85 : 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis silent fallback
    }
  }

  public playEnemyBark(type: string, position?: THREE.Vector3, listenerPos?: THREE.Vector3) {
    const lines = ABADDON_ENEMY_DIALOGUE[type.toLowerCase()];
    if (!lines || lines.length === 0) return;
    const randomText = lines[Math.floor(Math.random() * lines.length)];
    const speakerName = type.replace('_', ' ').toUpperCase();

    this.playDialogue(
      {
        speaker: speakerName,
        text: randomText,
        duration: 3.2,
        tone: type === 'hungerborn' ? 'whisper' : 'feral',
      },
      position,
      listenerPos
    );
  }

  public update(delta: number) {
    if (this.activeDialogue) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0) {
        this.activeDialogue = null;
        this.onSubtitleUpdate(null);
      }
    }
  }

  public getCurrentSubtitle(): DialogueLine | null {
    return this.activeDialogue;
  }

  public dispose() {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
