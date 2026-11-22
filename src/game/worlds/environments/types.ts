import * as THREE from 'three';

export type EnvironmentGraphicsPreset = 'ultra' | 'balanced' | 'low';

export interface EnvironmentCylinderCollider {
  x: number;
  z: number;
  radius: number;
  minY?: number;
  maxY?: number;
}

export interface EnvironmentBoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

export interface RealmLandmarkCoords {
  spawnPos: THREE.Vector3;
  spawnRotY: number;
  breachCenter: THREE.Vector3;
  bossArenaCenter: THREE.Vector3;
  bossSpawnPos: THREE.Vector3;
  hellgatePos: THREE.Vector3;
  arenaRadius: number;
  isOpenWorld: boolean;
}

export interface RealmEnvironment {
  readonly realmId: number;
  readonly realmName: string;
  readonly group: THREE.Group;
  createEnvironment(scene: THREE.Scene, preset: EnvironmentGraphicsPreset): void;
  createBossArena(): void;
  update(delta: number, playerPos?: THREE.Vector3): void;
  resolveCollision(position: THREE.Vector3, entityRadius?: number): void;
  getColliders?(): readonly EnvironmentCylinderCollider[];
  getBoxColliders?(): readonly EnvironmentBoxCollider[];
  getGroundHeightAt?(x: number, z: number): number;
  isWalkableAt?(x: number, z: number): boolean;
  constrainMovement?(prevPos: THREE.Vector3, nextPos: THREE.Vector3, entityRadius?: number): void;
  getLandmarks?(): RealmLandmarkCoords;
  setGraphicsPreset(preset: EnvironmentGraphicsPreset): void;
  dispose(): void;
}
