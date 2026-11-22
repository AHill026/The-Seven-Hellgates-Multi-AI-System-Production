/**
 * The Seven Hellgates - Zero-Allocation Camera Pose Transition Controller
 * Smoothly blends position, lookAt, FOV, and roll between gameplay and sequences.
 */

import * as THREE from 'three';

export class CameraTransitionController {
  public isBlending: boolean = false;
  public duration: number = 0;
  public elapsed: number = 0;

  private readonly startPos = new THREE.Vector3();
  private readonly startLookAt = new THREE.Vector3();
  private startFov: number = 60;
  private startRoll: number = 0;

  public startBlend(
    fromPos: THREE.Vector3,
    fromLookAt: THREE.Vector3,
    fromFov: number,
    fromRoll: number,
    duration: number
  ): void {
    this.startPos.copy(fromPos);
    this.startLookAt.copy(fromLookAt);
    this.startFov = fromFov;
    this.startRoll = fromRoll;
    this.elapsed = 0;
    this.duration = Math.max(0.001, duration);
    this.isBlending = duration > 0.01;
  }

  public cancel(): void {
    this.isBlending = false;
    this.elapsed = 0;
  }

  public stepAndApply(
    rawDelta: number,
    targetPos: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    targetFov: number,
    targetRoll: number,
    outPos: THREE.Vector3,
    outLookAt: THREE.Vector3
  ): { fov: number; rollRad: number; finished: boolean } {
    if (!this.isBlending) {
      outPos.copy(targetPos);
      outLookAt.copy(targetLookAt);
      return { fov: targetFov, rollRad: targetRoll, finished: true };
    }

    this.elapsed += rawDelta;
    const rawT = Math.min(1, this.elapsed / this.duration);
    const eased =
      rawT < 0.5
        ? 4 * rawT * rawT * rawT
        : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

    outPos.lerpVectors(this.startPos, targetPos, eased);
    outLookAt.lerpVectors(this.startLookAt, targetLookAt, eased);
    const fov = THREE.MathUtils.lerp(this.startFov, targetFov, eased);
    const rollRad = THREE.MathUtils.lerp(this.startRoll, targetRoll, eased);

    if (rawT >= 1) {
      this.isBlending = false;
      return { fov: targetFov, rollRad: targetRoll, finished: true };
    }

    return { fov, rollRad, finished: false };
  }
}
