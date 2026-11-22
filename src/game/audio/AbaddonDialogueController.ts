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

import { voiceManager, VoiceCharacterId, VoiceIntensity, AzraelEmotion } from './VoiceManager';

export class AbaddonDialogueController {
  private activeDialogue: DialogueLine | null = null;
  private dialogueTimer: number = 0;
  private onSubtitleUpdate: (line: DialogueLine | null) => void;

  constructor(onSubtitleUpdate: (line: DialogueLine | null) => void) {
    this.onSubtitleUpdate = onSubtitleUpdate;
  }

  private resolveCharacter(line: DialogueLine): VoiceCharacterId {
    const speakerUpper = (line.speaker || '').toUpperCase();
    if (speakerUpper.includes('AZRAEL') || line.tone === 'azrael') return 'azrael';
    if (speakerUpper.includes('MAW') || speakerUpper.includes('ABADDON')) return 'abaddon';
    if (speakerUpper.includes('DEVOURING') || speakerUpper.includes('MATRIARCH')) return 'devourer';
    if (speakerUpper.includes('FLESHBOUND') || speakerUpper.includes('BRUTE')) return 'hellbrute';
    if (speakerUpper.includes('GUT') || speakerUpper.includes('REAVER')) return 'hellspawn';
    if (speakerUpper.includes('HUNGERBORN')) return 'shade';
    if (line.tone === 'demonic' || line.tone === 'feral') return 'abaddon';
    return 'narrator';
  }

  private resolveDeliveryHints(line: DialogueLine, charId: VoiceCharacterId): {
    emotion?: AzraelEmotion;
    intensity: VoiceIntensity;
  } {
    if (charId === 'azrael') {
      const lower = line.text.toLowerCase();
      if (lower.includes('remember')) {
        return { emotion: 'curiosity', intensity: 'calm' };
      }
      return { emotion: 'determination', intensity: 'intense' };
    }
    if (line.tone === 'whisper') return { intensity: 'whisper' };
    if (line.tone === 'feral') return { intensity: 'furious' };
    if (line.tone === 'demonic') return { intensity: 'intense' };
    return { intensity: 'calm' };
  }

  public playDialogue(line: DialogueLine, position?: THREE.Vector3, listenerPos?: THREE.Vector3) {
    this.activeDialogue = line;
    this.dialogueTimer = line.duration;
    this.onSubtitleUpdate(line);

    const charId = this.resolveCharacter(line);
    const hints = this.resolveDeliveryHints(line, charId);
    voiceManager.playLine({
      character: charId,
      speaker: line.speaker,
      speakerTitle: line.speakerTitle,
      text: line.text,
      duration: line.duration,
      priority: line.tone === 'feral' || line.tone === 'whisper' ? 'combat' : 'story',
      emotion: hints.emotion,
      intensity: hints.intensity,
      position,
      listenerPos,
      realmTag: 2,
    });
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
    this.activeDialogue = null;
    this.dialogueTimer = 0;
  }
}
