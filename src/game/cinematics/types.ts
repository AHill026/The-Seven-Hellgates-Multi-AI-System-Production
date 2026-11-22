/**
 * The Seven Hellgates - Cinematic Camera Director Contracts & Types
 */

import * as THREE from 'three';

export enum CinematicPriority {
  GAMEPLAY_THIRD_PERSON = 0,
  COMBAT_MICRO_FRAMING = 1,
  INTERACTIVE_MOMENT = 2,
  STORY_SEQUENCE = 3,
  MANDATORY_BOSS_INTRO = 4,
  FINALE_OVERRIDE = 5,
}

export type CinematicControlLevel =
  | 'FREE'
  | 'ADDITIVE_BIAS'
  | 'SOFT_FOCUS'
  | 'FULL_LOCK';

export type CinematicDirectorState =
  | 'IDLE'
  | 'BLENDING_IN'
  | 'ACTIVE_SEQUENCE'
  | 'HOLD_FINALE'
  | 'BLENDING_OUT'
  | 'PAUSED_FROZEN';

export type WhiteEyedGodStage =
  | 'dissolve'
  | 'stare'
  | 'whisper'
  | 'cutToBlack'
  | 'titleReveal';

export interface CinematicPose {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
  rollRad: number;
}

export interface CinematicShot {
  duration: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startLookAt: THREE.Vector3;
  endLookAt: THREE.Vector3;
  startFov: number;
  endFov: number;
  rollRad: number;
  easing?: 'linear' | 'easeInOutCubic' | 'easeOutCubic';
}

export interface CinematicCue {
  id: string;
  time: number;
  fired: boolean;
  onTrigger: () => void;
}

export interface CinematicSequenceDefinition {
  id: string;
  kind: 'story' | 'boss_intro' | 'finale';
  priority: CinematicPriority;
  controlLevel: CinematicControlLevel;
  canSkip: boolean;
  showLetterbox: boolean;
  hideHud: boolean;
  blendInDuration: number;
  blendOutDuration: number;
  holdAtEnd?: boolean;
  vignetteBoost?: number;
  contrastBoost?: number;
  title?: string;
  subtitleLabel?: string;
  accentHex?: string;
  shots: CinematicShot[];
  cues: CinematicCue[];
  onComplete?: (wasSkipped: boolean) => void;
  onAbort?: () => void;
}

export interface CinematicUIState {
  isActive: boolean;
  sequenceId: string | null;
  kind: 'story' | 'boss_intro' | 'finale' | 'moment' | null;
  canSkip: boolean;
  locksControls: boolean;
  hideHud: boolean;
  showLetterbox: boolean;
  title?: string;
  subtitleLabel?: string;
  accentHex?: string;
  progress: number;
  finaleStage?: WhiteEyedGodStage;
}
