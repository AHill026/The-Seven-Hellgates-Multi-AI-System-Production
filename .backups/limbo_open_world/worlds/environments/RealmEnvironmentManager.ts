import * as THREE from 'three';
import { EnvironmentGraphicsPreset, RealmEnvironment } from './types';
import { LimboEnvironment } from './LimboEnvironment';
import { GluttonyEnvironment } from './GluttonyEnvironment';
import { GreedEnvironment } from './GreedEnvironment';
import { WrathEnvironment } from './WrathEnvironment';
import { HeresyEnvironment } from './HeresyEnvironment';
import { ViolenceEnvironment } from './ViolenceEnvironment';
import { SovereignEnvironment } from './SovereignEnvironment';

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
