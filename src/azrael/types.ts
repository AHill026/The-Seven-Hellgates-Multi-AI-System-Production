import * as THREE from 'three';

export type AzraelActionId =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'LIGHT_ATTACK'
  | 'HEAVY_ATTACK'
  | 'BLOCK'
  | 'PARRY'
  | 'DODGE'
  | 'HIT_REACTION'
  | 'DEATH'
  | 'AWAKEN'
  | 'FINISHER'
  | 'CINEMATIC_STANCE';

export type AzraelSocketName =
  | 'Weapon_R'
  | 'Weapon_Back'
  | 'Weapon_OffhandGrip'
  | 'VFX_Chest'
  | 'VFX_Aura';

export type AzraelWeaponAttachment = 'Weapon_R' | 'Weapon_Back';

export type AzraelTransformState =
  | 'DORMANT'
  | 'AWAKENED'
  | 'MAJOR_TRANSFORMATION';

export type AzraelLODLevel = 'LOD0' | 'LOD1' | 'LOD2';

export type AzraelHoodState = 'raised' | 'lowered';

export type AzraelMaterialInspectionMode =
  | 'standard'
  | 'emissive_only'
  | 'clay_roughness';

export type AzraelLightingMode = 'studio_pbr' | 'game_ue5';

export type AzraelCameraPreset = 'three_quarter' | 'front' | 'side' | 'rear';

export interface AzraelActionConfig {
  id: AzraelActionId;
  label: string;
  clipNames: string[];
  loop: boolean;
  crossfadeDuration: number;
  defaultOffhandIK: number;
  defaultTimeScale: number;
}

export interface AzraelPlaybackInfo {
  currentAction: AzraelActionId;
  clipName: string;
  currentTime: number;
  duration: number;
  normalizedTime: number;
  paused: boolean;
  timeScale: number;
  loop: boolean;
  availableClips: string[];
}

export interface AzraelPerformanceStats {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  textureMemoryMB: number;
  activeBones: number;
  animationMs: number;
  postFxMs: number;
  lodLevel: AzraelLODLevel;
  pixelRatio: number;
  isSoftwareGl: boolean;
  assetSource: string;
}

export type AzraelAnimationEventType =
  | 'ATTACK_IMPACT_WINDOW_START'
  | 'ATTACK_IMPACT_WINDOW_END'
  | 'WEAPON_SWING_VFX'
  | 'FOOTSTEP'
  | 'SWORD_IMPACT_SFX'
  | 'FINISHER_TRANSITION'
  | 'TRANSFORMATION_MILESTONE';

export interface AzraelAnimationEventMarker {
  normalizedTime: number;
  type: AzraelAnimationEventType;
  tag?: string;
}

export interface AzraelAnimationEvent {
  type: AzraelAnimationEventType;
  action: AzraelActionId;
  clipName: string;
  normalizedTime: number;
  clipTime: number;
  tag?: string;
}

export type AzraelAnimationEventListener = (
  event: Readonly<AzraelAnimationEvent>
) => void;

export interface AzraelActionAdapter {
  performAction(action: AzraelActionId, options?: { timeScale?: number; crossfade?: number }): void;
  setWeaponAttachment(attachment: AzraelWeaponAttachment): void;
  setTransformationState(state: AzraelTransformState): void;
  setLOD(lod: AzraelLODLevel): void;
  setHoodState(state: AzraelHoodState): void;
  setCloakMotionEnabled(enabled: boolean): void;
  setMaterialInspectionMode(mode: AzraelMaterialInspectionMode): void;
  update(delta: number, elapsed: number): void;
}

/**
 * Stable public contract for future gameplay adapters and sandbox callers.
 * Encapsulates internal animation, IK, socket, transformation, and disposal modules.
 */
export interface IAzraelCharacter extends AzraelActionAdapter {
  readonly root: THREE.Group;
  readonly isDisposed: boolean;

  getAssetSourceLabel(): string;
  getBoneNames(): string[];
  getSocketWorldPosition(socket: AzraelSocketName, out: THREE.Vector3): THREE.Vector3 | null;

  playAction(
    action: AzraelActionId,
    options?: { timeScale?: number; crossfade?: number; forceRestart?: boolean }
  ): void;
  playClipByName(clipName: string): void;
  setAnimationSpeed(scale: number): void;
  setAnimationPaused(paused: boolean): void;
  setAnimationLoopMode(loop: boolean | null): void;
  scrubAnimation(normalizedTime: number): void;
  getPlaybackInfo(): AzraelPlaybackInfo;

  attachWeapon(): void;
  sheatheWeapon(): void;
  getWeaponAttachment(): AzraelWeaponAttachment;

  setOffhandIKWeight(weight: number | null): void;
  getEffectiveOffhandIKWeight(): number;
  getOffhandGripErrorMeters(): number;
  getOffhandIKReachUtilization(): number;

  setTransformationState(state: AzraelTransformState): void;
  getTransformationState(): AzraelTransformState;
  getHoodState(): AzraelHoodState;
  isCloakMotionEnabled(): boolean;
  getLOD(): AzraelLODLevel;
  setMaterialInspectionMode(mode: AzraelMaterialInspectionMode): void;
  getMaterialInspectionMode(): AzraelMaterialInspectionMode;

  onAnimationEvent(listener: AzraelAnimationEventListener): () => void;

  attachSkeletonHelper(scene: THREE.Scene, visible: boolean): void;
  setSocketMarkersVisible(visible: boolean): void;
  getLastAnimationMs(): number;

  getPerformanceStats(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    isSoftwareGl: boolean,
    postFxMs?: number
  ): AzraelPerformanceStats;

  dispose(scene?: THREE.Scene): void;
}

export interface LoadedAzraelAsset {
  root: THREE.Group;
  clips: THREE.AnimationClip[];
  sockets: Partial<Record<AzraelSocketName, THREE.Object3D>>;
  weaponRoot: THREE.Object3D;
  weaponOffhandGrip: THREE.Object3D;
  skeletons: THREE.Skeleton[];
  bones: THREE.Bone[];
  lodGroups: Record<AzraelLODLevel, THREE.Object3D[]>;
  meshes: THREE.Mesh[];
  chestRuneMaterials: THREE.MeshStandardMaterial[];
  eyeMaterials: THREE.MeshStandardMaterial[];
  bladeEmissiveMaterials: THREE.MeshStandardMaterial[];
  armorAccentMaterials: THREE.MeshStandardMaterial[];
  hoodGroup: THREE.Object3D | null;
  hoodBones: { crown?: THREE.Bone; back?: THREE.Bone; sideL?: THREE.Bone; sideR?: THREE.Bone };
  cloakBones: THREE.Bone[];
  sourceLabel: string;
  sourceType: 'procedural_skinned' | 'glb';
  dispose: () => void;
}

export const AZRAEL_ACTION_CATALOG: Record<AzraelActionId, AzraelActionConfig> = {
  IDLE: {
    id: 'IDLE',
    label: 'Idle',
    clipNames: ['IDLE', 'Idle', 'idle'],
    loop: true,
    crossfadeDuration: 0.25,
    defaultOffhandIK: 1.0,
    defaultTimeScale: 1.0,
  },
  WALK: {
    id: 'WALK',
    label: 'Walk',
    clipNames: ['WALK', 'Walk', 'walk'],
    loop: true,
    crossfadeDuration: 0.22,
    defaultOffhandIK: 1.0,
    defaultTimeScale: 1.0,
  },
  RUN: {
    id: 'RUN',
    label: 'Run',
    clipNames: ['RUN', 'Run', 'run'],
    loop: true,
    crossfadeDuration: 0.18,
    defaultOffhandIK: 0.0,
    defaultTimeScale: 1.0,
  },
  LIGHT_ATTACK: {
    id: 'LIGHT_ATTACK',
    label: 'Light Attack',
    clipNames: ['LIGHT_ATTACK', 'LightAttack', 'Attack_Light'],
    loop: false,
    crossfadeDuration: 0.12,
    defaultOffhandIK: 1.0,
    defaultTimeScale: 1.0,
  },
  HEAVY_ATTACK: {
    id: 'HEAVY_ATTACK',
    label: 'Heavy Attack',
    clipNames: ['HEAVY_ATTACK', 'HeavyAttack', 'Attack_Heavy'],
    loop: false,
    crossfadeDuration: 0.15,
    defaultOffhandIK: 1.0,
    defaultTimeScale: 1.0,
  },
  BLOCK: {
    id: 'BLOCK',
    label: 'Block',
    clipNames: ['BLOCK', 'Block', 'Guard'],
    loop: true,
    crossfadeDuration: 0.14,
    defaultOffhandIK: 1.0,
    defaultTimeScale: 1.0,
  },
  PARRY: {
    id: 'PARRY',
    label: 'Parry',
    clipNames: ['PARRY', 'Parry'],
    loop: false,
    crossfadeDuration: 0.1,
    defaultOffhandIK: 1.0,
    defaultTimeScale: 1.0,
  },
  DODGE: {
    id: 'DODGE',
    label: 'Dodge',
    clipNames: ['DODGE', 'Dodge', 'Evade'],
    loop: false,
    crossfadeDuration: 0.1,
    defaultOffhandIK: 0.0,
    defaultTimeScale: 1.0,
  },
  HIT_REACTION: {
    id: 'HIT_REACTION',
    label: 'Hit Reaction',
    clipNames: ['HIT_REACTION', 'HitReaction', 'Hit'],
    loop: false,
    crossfadeDuration: 0.08,
    defaultOffhandIK: 0.0,
    defaultTimeScale: 1.0,
  },
  DEATH: {
    id: 'DEATH',
    label: 'Death',
    clipNames: ['DEATH', 'Death'],
    loop: false,
    crossfadeDuration: 0.18,
    defaultOffhandIK: 0.0,
    defaultTimeScale: 1.0,
  },
  AWAKEN: {
    id: 'AWAKEN',
    label: 'Awaken',
    clipNames: ['AWAKEN', 'Awaken'],
    loop: false,
    crossfadeDuration: 0.25,
    defaultOffhandIK: 0.0,
    defaultTimeScale: 1.0,
  },
  FINISHER: {
    id: 'FINISHER',
    label: 'Finisher',
    clipNames: ['FINISHER', 'Finisher'],
    loop: false,
    crossfadeDuration: 0.14,
    defaultOffhandIK: 1.0,
    defaultTimeScale: 1.0,
  },
  CINEMATIC_STANCE: {
    id: 'CINEMATIC_STANCE',
    label: 'Cinematic',
    clipNames: ['CINEMATIC_STANCE', 'Cinematic'],
    loop: true,
    crossfadeDuration: 0.35,
    defaultOffhandIK: 0.0,
    defaultTimeScale: 1.0,
  },
};
