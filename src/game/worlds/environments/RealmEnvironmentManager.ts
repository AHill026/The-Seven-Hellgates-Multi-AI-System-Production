import * as THREE from 'three';
import {
  EnvironmentBoxCollider,
  EnvironmentCylinderCollider,
  EnvironmentGraphicsPreset,
  RealmEnvironment,
  RealmLandmarkCoords,
} from './types';
import { LimboEnvironment } from './LimboEnvironment';
import { GluttonyEnvironment } from './GluttonyEnvironment';
import { GreedEnvironment } from './GreedEnvironment';
import { WrathEnvironment } from './WrathEnvironment';
import { HeresyEnvironment } from './HeresyEnvironment';
import { ViolenceEnvironment } from './ViolenceEnvironment';
import { SovereignEnvironment } from './SovereignEnvironment';

const EMPTY_CYLINDER_COLLIDERS: readonly EnvironmentCylinderCollider[] = [];
const EMPTY_BOX_COLLIDERS: readonly EnvironmentBoxCollider[] = [];

const DEFAULT_LANDMARKS: RealmLandmarkCoords = {
  spawnPos: new THREE.Vector3(0, 0, 8),
  spawnRotY: Math.PI,
  breachCenter: new THREE.Vector3(0, 0, 0),
  bossArenaCenter: new THREE.Vector3(0, 0, 0),
  bossSpawnPos: new THREE.Vector3(0, 0, -14),
  hellgatePos: new THREE.Vector3(0, 0, -22),
  arenaRadius: 26.5,
  isOpenWorld: false,
};

export class RealmEnvironmentManager {
  public readonly group: THREE.Group;
  private activeEnv: RealmEnvironment | null = null;
  private currentPreset: EnvironmentGraphicsPreset = 'ultra';

  constructor() {
    this.group = new THREE.Group();
  }

  public hasDedicatedEnvironment(realmId: number): boolean {
    return realmId >= 1 && realmId <= 7;
  }

  public loadEnvironment(
    realmId: number,
    scene: THREE.Scene,
    preset: EnvironmentGraphicsPreset = this.currentPreset
  ): RealmEnvironment | null {
    this.dispose();
    this.currentPreset = preset;

    let env: RealmEnvironment | null = null;
    switch (realmId) {
      case 1:
        env = new LimboEnvironment();
        break;
      case 2:
        env = new GluttonyEnvironment();
        break;
      case 3:
        env = new GreedEnvironment();
        break;
      case 4:
        env = new WrathEnvironment();
        break;
      case 5:
        env = new HeresyEnvironment();
        break;
      case 6:
        env = new ViolenceEnvironment();
        break;
      case 7:
        env = new SovereignEnvironment();
        break;
      default:
        env = null;
        break;
    }

    if (!env) return null;

    this.activeEnv = env;
    env.createEnvironment(scene, preset);
    this.group.add(env.group);
    return env;
  }

  public update(delta: number, playerPos?: THREE.Vector3): void {
    if (this.activeEnv) {
      this.activeEnv.update(delta, playerPos);
    }
  }

  public resolveCollision(position: THREE.Vector3, entityRadius: number = 0.7): void {
    if (this.activeEnv) {
      this.activeEnv.resolveCollision(position, entityRadius);
    }
  }

  public getColliders(): readonly EnvironmentCylinderCollider[] {
    if (this.activeEnv && this.activeEnv.getColliders) {
      return this.activeEnv.getColliders();
    }
    return EMPTY_CYLINDER_COLLIDERS;
  }

  public getBoxColliders(): readonly EnvironmentBoxCollider[] {
    if (this.activeEnv && this.activeEnv.getBoxColliders) {
      return this.activeEnv.getBoxColliders();
    }
    return EMPTY_BOX_COLLIDERS;
  }

  public getGroundHeightAt(x: number, z: number): number {
    if (this.activeEnv && this.activeEnv.getGroundHeightAt) {
      return this.activeEnv.getGroundHeightAt(x, z);
    }
    return 0;
  }

  public isWalkableAt(x: number, z: number): boolean {
    if (this.activeEnv && this.activeEnv.isWalkableAt) {
      return this.activeEnv.isWalkableAt(x, z);
    }
    return x * x + z * z <= 26.5 * 26.5;
  }

  public constrainMovement(prevPos: THREE.Vector3, nextPos: THREE.Vector3, entityRadius: number = 0.7): void {
    if (this.activeEnv && this.activeEnv.constrainMovement) {
      this.activeEnv.constrainMovement(prevPos, nextPos, entityRadius);
      return;
    }
    const dist2D = Math.hypot(nextPos.x, nextPos.z);
    if (dist2D > 26.5) {
      const factor = 26.5 / dist2D;
      nextPos.x *= factor;
      nextPos.z *= factor;
    }
    this.resolveCollision(nextPos, entityRadius);
    nextPos.y = this.getGroundHeightAt(nextPos.x, nextPos.z);
  }

  public getLandmarks(): RealmLandmarkCoords {
    if (this.activeEnv && this.activeEnv.getLandmarks) {
      return this.activeEnv.getLandmarks();
    }
    return DEFAULT_LANDMARKS;
  }

  public setGraphicsPreset(preset: EnvironmentGraphicsPreset): void {
    this.currentPreset = preset;
    if (this.activeEnv) {
      this.activeEnv.setGraphicsPreset(preset);
    }
  }

  public getActiveEnvironment(): RealmEnvironment | null {
    return this.activeEnv;
  }

  public dispose(): void {
    if (this.activeEnv) {
      this.group.remove(this.activeEnv.group);
      this.activeEnv.dispose();
      this.activeEnv = null;
    }
  }
}
