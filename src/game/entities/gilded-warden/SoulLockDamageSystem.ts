/**
 * The Seven Hellgates - Greed: The Pit of Destruction
 * The Forgotten Souls — SoulLockDamageSystem
 *
 * Manages destructible soul-lock targets:
 * - Chest Lock (containment padlock sealing chest soul vortex)
 * - Left Wrist Chain (binding flail arm)
 * - Right Arm Lock (containment shackles on claw gauntlet)
 * - Leg Lantern (iron cage containing trapped glowing skeleton)
 *
 * Handles targeted damage, metallic break audio, spectral bursts,
 * visual fracture updates, and gameplay debuffs.
 */

import * as THREE from 'three';
import {
  SoulLockSpec,
  SOUL_LOCK_DEFINITIONS,
} from './ForgottenSoulsConfiguration';
import { SoulWhisperAudioController } from './SoulWhisperAudioController';

export interface ActiveSoulLock {
  spec: SoulLockSpec;
  currentHealth: number;
  isBroken: boolean;
  meshGroup: THREE.Group | null;
  glowMesh: THREE.Mesh | null;
}

export class SoulLockDamageSystem {
  public locks: Map<string, ActiveSoulLock> = new Map();
  private audioCtrl: SoulWhisperAudioController;

  // Active gameplay modifiers from broken locks
  public damageResistanceModifier: number = 1.0; // 0.75 when chest lock broken
  public chainSweepCooldownModifier: number = 1.0; // 1.5 when wrist chain broken
  public speedModifier: number = 1.0; // 0.8 when leg lantern broken

  constructor(audioCtrl: SoulWhisperAudioController) {
    this.audioCtrl = audioCtrl;
    this.initializeLocks();
  }

  private initializeLocks() {
    SOUL_LOCK_DEFINITIONS.forEach(spec => {
      this.locks.set(spec.id, {
        spec,
        currentHealth: spec.maxHealth,
        isBroken: false,
        meshGroup: null,
        glowMesh: null,
      });
    });
  }

  public registerLockMeshes(lockId: string, group: THREE.Group, glowMesh: THREE.Mesh | null) {
    const lock = this.locks.get(lockId);
    if (lock) {
      lock.meshGroup = group;
      lock.glowMesh = glowMesh;
    }
  }

  /**
   * Applies damage to a specific lock or distributes damage to closest lock
   */
  public applyDamageToLock(
    lockId: string,
    damage: number,
    wardenPos: THREE.Vector3,
    playerPos: THREE.Vector3
  ): {
    lockBroken: boolean;
    brokenLockSpec?: SoulLockSpec;
    staggerDuration?: number;
  } {
    const lock = this.locks.get(lockId);
    if (!lock || lock.isBroken) {
      return { lockBroken: false };
    }

    lock.currentHealth -= damage;

    // Flash glow on hit
    if (lock.glowMesh) {
      (lock.glowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.4;
    }

    if (lock.currentHealth <= 0) {
      lock.isBroken = true;
      lock.currentHealth = 0;
      return this.handleLockBroken(lock, wardenPos, playerPos);
    }

    return { lockBroken: false };
  }

  /**
   * When attack lands on Warden, checks if any soul-lock was struck by proximity
   */
  public checkLockHitByAttack(
    hitWorldPos: THREE.Vector3,
    damage: number,
    wardenGroup: THREE.Group,
    playerPos: THREE.Vector3
  ): {
    hitLock: boolean;
    lockBroken: boolean;
    brokenLockSpec?: SoulLockSpec;
    staggerDuration?: number;
  } {
    for (const [id, lock] of this.locks.entries()) {
      if (lock.isBroken || !lock.meshGroup) continue;

      const lockWorldPos = new THREE.Vector3();
      lock.meshGroup.getWorldPosition(lockWorldPos);

      const dist = hitWorldPos.distanceTo(lockWorldPos);
      if (dist <= lock.spec.hitRadius * wardenGroup.scale.x) {
        const res = this.applyDamageToLock(id, damage, wardenGroup.position, playerPos);
        return {
          hitLock: true,
          lockBroken: res.lockBroken,
          brokenLockSpec: res.brokenLockSpec,
          staggerDuration: res.staggerDuration,
        };
      }
    }

    return { hitLock: false, lockBroken: false };
  }

  private handleLockBroken(
    lock: ActiveSoulLock,
    wardenPos: THREE.Vector3,
    playerPos: THREE.Vector3
  ): {
    lockBroken: boolean;
    brokenLockSpec: SoulLockSpec;
    staggerDuration?: number;
  } {
    // 1. Play metallic break snap sound
    this.audioCtrl.playLockBreakSound();

    // 2. Play desperate distressed whisper
    this.audioCtrl.playRandomWhisper('distressed', wardenPos, playerPos);

    // 3. Visual destruction of lock mesh
    if (lock.meshGroup) {
      lock.meshGroup.scale.set(0.2, 0.2, 0.2);
      lock.meshGroup.visible = false;
    }
    if (lock.glowMesh) {
      (lock.glowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 4.0;
    }

    // 4. Apply gameplay effect
    let staggerDuration = 0;

    switch (lock.spec.id) {
      case 'chest_lock':
        this.damageResistanceModifier = 0.75; // Takes 25% more damage
        staggerDuration = 1.2;
        break;
      case 'wrist_chain':
        this.chainSweepCooldownModifier = 1.5; // Slower chain sweeps
        staggerDuration = 0.6;
        break;
      case 'right_arm_lock':
        staggerDuration = 1.8; // Critical posture break
        break;
      case 'leg_lantern':
        this.speedModifier = 0.8; // 20% slower movement
        staggerDuration = 0.8;
        break;
    }

    return {
      lockBroken: true,
      brokenLockSpec: lock.spec,
      staggerDuration,
    };
  }

  public getBrokenLocksCount(): number {
    let count = 0;
    for (const lock of this.locks.values()) {
      if (lock.isBroken) count++;
    }
    return count;
  }
}
