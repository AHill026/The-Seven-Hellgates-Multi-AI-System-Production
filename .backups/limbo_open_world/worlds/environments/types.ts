import * as THREE from 'three';

export type EnvironmentGraphicsPreset = 'ultra' | 'balanced' | 'low';

export interface EnvironmentCylinderCollider {
  x: number;
  z: number;
  radius: number;
}

export interface RealmEnvironment {
  readonly realmId: number;
  readonly realmName: string;
  readonly group: THREE.Group;
  createEnvironment(scene: THREE.Scene, preset: EnvironmentGraphicsPreset): void;
  createBossArena(): void;
  update(delta: number, playerPos?: THREE.Vector3): void;
  resolveCollision(position: THREE.Vector3, entityRadius?: number): void;
  setGraphicsPreset(preset: EnvironmentGraphicsPreset): void;
  dispose(): void;
}
