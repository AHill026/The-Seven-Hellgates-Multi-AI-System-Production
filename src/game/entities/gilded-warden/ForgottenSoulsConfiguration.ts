/**
 * The Seven Hellgates - Greed: The Pit of Destruction
 * The Forgotten Souls — Gilded Warden Configuration
 *
 * Configurable parameters for:
 * - Trapped soul dialogue and whisper voice categories
 * - Health thresholds (Normal -> 70% -> 40% -> 15% -> 0%)
 * - Destructible soul-locks (Chest lock, Wrist chain, Right arm, Leg lantern)
 * - Spectral VFX parameters & audio intervals
 * - Combat attacks & timings
 */

import * as THREE from 'three';

export interface SoulWhisperDialogue {
  id: string;
  category: 'faint' | 'distressed' | 'critical' | 'death_sequence';
  text: string;
  formantVowel: 'a' | 'e' | 'i' | 'o' | 'u';
  pitch: number; // Hz baseline
  speed: number;
  duration: number; // seconds
}

export interface SoulLockSpec {
  id: 'chest_lock' | 'wrist_chain' | 'right_arm_lock' | 'leg_lantern';
  name: string;
  relativePosition: THREE.Vector3;
  maxHealth: number;
  hitRadius: number;
  description: string;
  gameplayEffectOnBreak: string;
}

export interface GildedWardenConfig {
  maxHealth: number;
  baseDamage: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  poise: number;
  scale: number;

  // Thresholds
  thresholdInstabilityHP: number; // 0.70
  thresholdSpectralEscapeHP: number; // 0.40
  thresholdArmorFailingHP: number; // 0.15
  thresholdEnrageHP: number; // 0.25 (Treasury's Wrath)

  // Audio timings
  faintWhisperIntervalMin: number;
  faintWhisperIntervalMax: number;
  distressedWhisperIntervalMin: number;
  distressedWhisperIntervalMax: number;
  criticalWhisperIntervalMin: number;
  criticalWhisperIntervalMax: number;
}

export const DEFAULT_WARDEN_CONFIG: GildedWardenConfig = {
  maxHealth: 680,
  baseDamage: 45,
  speed: 2.8,
  attackRange: 3.5,
  attackCooldown: 2.5,
  poise: 160,
  scale: 1.55, // Enormous imperial executioner brute

  thresholdInstabilityHP: 0.70,
  thresholdSpectralEscapeHP: 0.40,
  thresholdArmorFailingHP: 0.15,
  thresholdEnrageHP: 0.25,

  faintWhisperIntervalMin: 7.0,
  faintWhisperIntervalMax: 12.0,
  distressedWhisperIntervalMin: 4.0,
  distressedWhisperIntervalMax: 7.0,
  criticalWhisperIntervalMin: 2.0,
  criticalWhisperIntervalMax: 4.5,
};

export const SOUL_LOCK_DEFINITIONS: SoulLockSpec[] = [
  {
    id: 'chest_lock',
    name: 'Chest Containment Padlock',
    relativePosition: new THREE.Vector3(0, 1.35, 0.55),
    maxHealth: 110,
    hitRadius: 0.65,
    description: 'Heavy bronze padlock sealing the chest soul vortex',
    gameplayEffectOnBreak: 'Breaks seal, weakening Warden damage resistance by 25% and staggering for 1.2s',
  },
  {
    id: 'wrist_chain',
    name: 'Left Wrist Binding Chains',
    relativePosition: new THREE.Vector3(-0.95, 0.95, 0.35),
    maxHealth: 85,
    hitRadius: 0.55,
    description: 'Barbed chains binding the flail cannon mechanism',
    gameplayEffectOnBreak: 'Damages flail mechanism, increasing Chain Sweep cooldown by 50%',
  },
  {
    id: 'right_arm_lock',
    name: 'Right Claw Containment Shackles',
    relativePosition: new THREE.Vector3(0.95, 1.15, 0.25),
    maxHealth: 95,
    hitRadius: 0.6,
    description: 'Containment shackle binding the heavy claw gauntlet',
    gameplayEffectOnBreak: 'Triggers painful feedback, causing a 1.8s posture break',
  },
  {
    id: 'leg_lantern',
    name: 'Leg-Mounted Soul Lantern Cage',
    relativePosition: new THREE.Vector3(-0.45, 0.35, 0.2),
    maxHealth: 75,
    hitRadius: 0.5,
    description: 'Iron cage containing a trapped glowing skeleton',
    gameplayEffectOnBreak: 'Releases the lantern soul, permanently slowing movement by 20%',
  },
];

export const FORGOTTEN_SOULS_DIALOGUE_LIBRARY: SoulWhisperDialogue[] = [
  // A. Faint Whispers (>70% HP)
  { id: 'faint_1', category: 'faint', text: 'El… erian…', formantVowel: 'e', pitch: 195, speed: 0.85, duration: 2.2 },
  { id: 'faint_2', category: 'faint', text: 'Please… remember my name…', formantVowel: 'e', pitch: 220, speed: 0.9, duration: 2.8 },
  { id: 'faint_3', category: 'faint', text: 'I remember…', formantVowel: 'i', pitch: 180, speed: 0.8, duration: 2.0 },
  { id: 'faint_4', category: 'faint', text: 'We were here…', formantVowel: 'e', pitch: 210, speed: 0.85, duration: 2.4 },
  { id: 'faint_5', category: 'faint', text: 'Let us go…', formantVowel: 'o', pitch: 175, speed: 0.9, duration: 2.1 },
  { id: 'faint_6', category: 'faint', text: 'Who… were we?', formantVowel: 'u', pitch: 230, speed: 0.8, duration: 2.5 },

  // B. Distressed Whispers (70% - 40% HP)
  { id: 'dist_1', category: 'distressed', text: 'The bronze burns… we cannot breathe…', formantVowel: 'a', pitch: 250, speed: 1.1, duration: 2.9 },
  { id: 'dist_2', category: 'distressed', text: 'Our kingdom… where did the sun go?', formantVowel: 'o', pitch: 210, speed: 1.0, duration: 3.1 },
  { id: 'dist_3', category: 'distressed', text: 'Strike again… shatter these locks!', formantVowel: 'a', pitch: 270, speed: 1.2, duration: 2.6 },
  { id: 'dist_4', category: 'distressed', text: 'I was a smith… my child… what was her face…', formantVowel: 'i', pitch: 240, speed: 1.05, duration: 3.4 },
  { id: 'dist_5', category: 'distressed', text: 'The Tyrant stole our tombstones…', formantVowel: 'o', pitch: 190, speed: 0.95, duration: 3.0 },

  // C. Critical-State Whispers (40% - 15% HP)
  { id: 'crit_1', category: 'critical', text: 'The prison is fracturing! We see the dark sky!', formantVowel: 'a', pitch: 290, speed: 1.25, duration: 3.0 },
  { id: 'crit_2', category: 'critical', text: 'Forgive us… we are forced to strike thee!', formantVowel: 'e', pitch: 280, speed: 1.2, duration: 2.8 },
  { id: 'crit_3', category: 'critical', text: 'Gold… so much gold… drowning our voices…', formantVowel: 'o', pitch: 235, speed: 1.1, duration: 3.2 },
  { id: 'crit_4', category: 'critical', text: 'Break the halo… let the light die…', formantVowel: 'i', pitch: 265, speed: 1.15, duration: 2.7 },

  // D. Death Sequence Whispers (Final Release)
  { id: 'death_1', category: 'death_sequence', text: 'I… remember…', formantVowel: 'i', pitch: 210, speed: 0.8, duration: 2.6 },
  { id: 'death_2', category: 'death_sequence', text: 'Tell them… we were here…', formantVowel: 'e', pitch: 240, speed: 0.85, duration: 3.0 },
  { id: 'death_3', category: 'death_sequence', text: 'We had names…', formantVowel: 'a', pitch: 220, speed: 0.8, duration: 2.8 },
  { id: 'death_4', category: 'death_sequence', text: 'Azrael…', formantVowel: 'a', pitch: 195, speed: 0.7, duration: 3.5 },
];
