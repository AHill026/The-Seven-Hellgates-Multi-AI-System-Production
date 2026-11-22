/**
 * The Seven Hellgates - Third-Person Cinematic Camera Controller
 * Smooth orbital tracking, pitch/yaw limits, lock-on targeting, additive combat bias,
 * analytical collision solving, and zero-allocation cutscene pose handoff.
 */

import * as THREE from 'three';
import {
  EnvironmentBoxCollider,
  EnvironmentCylinderCollider,
} from '../worlds/environments/types';
import { CameraCollisionSolver } from './CameraCollisionSolver';

export interface CameraPoseSnapshot {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
  rollRad: number;
}

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public yaw: number = 0;
  public pitch: number = 0.25; // slight downward angle
  public distance: number = 4.8;
  public heightOffset: number = 1.45;

  public baseFov: number = 60;
  public targetFov: number = 60;

  private shakeIntensity: number = 0;
  private shakeDecay: number = 6.0;
  private currentLookTarget = new THREE.Vector3();
  private currentCamPos = new THREE.Vector3();
  private currentRollRad: number = 0;

  public lockTarget: THREE.Vector3 | null = null;
  public isCutsceneActive: boolean = false;

  // Additive micro-framing bias (used by P1/P2 combat moments without stealing control)
  private additiveDistanceBias: number = 0;
  private additiveHeightBias: number = 0;
  private additiveSideBias: number = 0;
  private additiveFovBias: number = 0;
  private additiveRollBias: number = 0;

  private readonly collisionSolver = new CameraCollisionSolver();

  // Pre-allocated scratch vectors for zero-GC updates
  private readonly tmpToLock = new THREE.Vector3();
  private readonly tmpDesiredTarget = new THREE.Vector3();
  private readonly tmpDesiredCamPos = new THREE.Vector3();
  private readonly tmpResolvedCamPos = new THREE.Vector3();
  private readonly tmpPivotPos = new THREE.Vector3();
  private readonly tmpToBoss = new THREE.Vector3();

  constructor(fov: number = 60, aspect: number = 16 / 9) {
    this.baseFov = fov;
    this.targetFov = fov;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 560);
    this.camera.position.set(0, 3, 6);
  }

  public snapTo(playerPos: THREE.Vector3, yaw?: number) {
    if (yaw !== undefined) {
      this.yaw = yaw;
    }
    this.lockTarget = null;
    this.currentRollRad = 0;
    this.clearAdditiveBias();
    this.collisionSolver.reset();

    this.currentLookTarget.set(playerPos.x, playerPos.y + this.heightOffset, playerPos.z);
    const cx = Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
    const cy = Math.sin(this.pitch) * this.distance;
    const cz = Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;
    this.currentCamPos.set(
      this.currentLookTarget.x - cx,
      this.currentLookTarget.y + cy,
      this.currentLookTarget.z - cz
    );
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.camera.up.set(0, 1, 0);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookTarget);
  }

  public addScreenShake(amount: number) {
    this.shakeIntensity = Math.min(1.2, this.shakeIntensity + amount);
  }

  public setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public setAdditiveBias(
    distanceBias: number,
    heightBias: number,
    sideBias: number,
    fovBias: number,
    rollBias: number
  ): void {
    this.additiveDistanceBias = distanceBias;
    this.additiveHeightBias = heightBias;
    this.additiveSideBias = sideBias;
    this.additiveFovBias = fovBias;
    this.additiveRollBias = rollBias;
  }

  public clearAdditiveBias(): void {
    this.additiveDistanceBias = 0;
    this.additiveHeightBias = 0;
    this.additiveSideBias = 0;
    this.additiveFovBias = 0;
    this.additiveRollBias = 0;
  }

  public getCurrentPose(outPos: THREE.Vector3, outLookAt: THREE.Vector3): { fov: number; rollRad: number } {
    outPos.copy(this.currentCamPos);
    outLookAt.copy(this.currentLookTarget);
    return { fov: this.camera.fov, rollRad: this.currentRollRad };
  }

  /**
   * Computes what the standard gameplay camera pose would be right now for
   * seamless transition blending (without mutating live camera state).
   */
  public computeGameplayPose(
    playerPos: THREE.Vector3,
    outPos: THREE.Vector3,
    outLookAt: THREE.Vector3,
    getGroundHeightAt?: (x: number, z: number) => number,
    cylinders?: readonly EnvironmentCylinderCollider[],
    boxes?: readonly EnvironmentBoxCollider[]
  ): number {
    outLookAt.set(playerPos.x, playerPos.y + this.heightOffset, playerPos.z);
    const cx = Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
    const cy = Math.sin(this.pitch) * this.distance;
    const cz = Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;
    this.tmpDesiredCamPos.set(outLookAt.x - cx, outLookAt.y + cy, outLookAt.z - cz);
    this.collisionSolver.solve(
      outLookAt,
      this.tmpDesiredCamPos,
      outPos,
      0.016,
      getGroundHeightAt,
      cylinders,
      boxes,
      false
    );
    return this.baseFov;
  }

  public decayShakeOnly(delta: number): void {
    if (this.shakeIntensity > 0.001) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta);
    }
  }

  public setCutsceneFrame(
    pos: THREE.Vector3,
    lookAt: THREE.Vector3,
    fov: number,
    rollRad: number = 0
  ) {
    this.isCutsceneActive = true;
    this.currentCamPos.copy(pos);
    this.currentLookTarget.copy(lookAt);
    this.currentRollRad = rollRad;

    if (Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    this.camera.position.copy(pos);
    if (this.shakeIntensity > 0.001) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 0.35;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 0.35;
      const sz = (Math.random() - 0.5) * this.shakeIntensity * 0.35;
      this.camera.position.x += sx;
      this.camera.position.y += sy;
      this.camera.position.z += sz;
    }

    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(lookAt);
    if (Math.abs(rollRad) > 0.0001) {
      this.camera.rotateZ(rollRad);
    }
  }

  public releaseCutscene(playerPos?: THREE.Vector3, bossPos?: THREE.Vector3) {
    this.isCutsceneActive = false;
    this.currentRollRad = 0;
    this.camera.up.set(0, 1, 0);
    this.targetFov = this.baseFov;
    if (playerPos && bossPos) {
      this.tmpToBoss.subVectors(bossPos, playerPos);
      this.yaw = Math.atan2(this.tmpToBoss.x, this.tmpToBoss.z);
      this.pitch = 0.25;
    }
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    lookDeltaX: number,
    lookDeltaY: number,
    comboCount: number = 0,
    isInCombat: boolean = false,
    getGroundHeightAt?: (x: number, z: number) => number,
    cylinders?: readonly EnvironmentCylinderCollider[],
    boxes?: readonly EnvironmentBoxCollider[]
  ) {
    this.decayShakeOnly(delta);

    if (this.isCutsceneActive) {
      return;
    }

    // Dynamic combat FOV scaling + P1/P2 additive bias
    this.targetFov =
      this.baseFov +
      Math.min(10, comboCount * 0.75) +
      (isInCombat ? 3.5 : 0) +
      this.additiveFovBias;
    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 6.0, delta);
      this.camera.updateProjectionMatrix();
    }

    // 1. Process mouse/touch look
    if (!this.lockTarget) {
      this.yaw -= lookDeltaX * 1.5;
      this.pitch = Math.max(-0.25, Math.min(1.1, this.pitch + lookDeltaY * 1.5));
    } else {
      // Lock-on mode: orient yaw directly towards target
      this.tmpToLock.subVectors(this.lockTarget, playerPos);
      const desiredYaw = Math.atan2(this.tmpToLock.x, this.tmpToLock.z);
      this.yaw = THREE.MathUtils.damp(this.yaw, desiredYaw, 6, delta);
      this.pitch = THREE.MathUtils.damp(this.pitch, 0.28, 4, delta);
    }

    // 2. Compute camera spherical position relative to player + additive combat framing
    const effectiveDistance = Math.max(2.6, this.distance + this.additiveDistanceBias);
    const targetY = playerPos.y + this.heightOffset + this.additiveHeightBias * 0.35;
    this.tmpDesiredTarget.set(playerPos.x, targetY, playerPos.z);
    this.currentLookTarget.lerp(this.tmpDesiredTarget, Math.min(1, delta * 12));

    const cx = Math.sin(this.yaw) * Math.cos(this.pitch) * effectiveDistance;
    const cy = Math.sin(this.pitch) * effectiveDistance + this.additiveHeightBias;
    const cz = Math.cos(this.yaw) * Math.cos(this.pitch) * effectiveDistance;

    // Right vector orthogonal to camera yaw for over-shoulder additive bias
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    this.tmpDesiredCamPos.set(
      this.currentLookTarget.x - cx + rightX * this.additiveSideBias,
      this.currentLookTarget.y + cy,
      this.currentLookTarget.z - cz + rightZ * this.additiveSideBias
    );

    // 3. Analytical obstacle collision + universal terrain floor clamp
    this.tmpPivotPos.set(playerPos.x, playerPos.y + this.heightOffset, playerPos.z);
    this.collisionSolver.solve(
      this.tmpPivotPos,
      this.tmpDesiredCamPos,
      this.tmpResolvedCamPos,
      delta,
      getGroundHeightAt,
      cylinders,
      boxes,
      false
    );

    this.currentCamPos.lerp(this.tmpResolvedCamPos, Math.min(1, delta * 14));
    this.camera.position.copy(this.currentCamPos);

    // 4. Screen shake
    if (this.shakeIntensity > 0.001) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      const sz = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      this.camera.position.x += sx;
      this.camera.position.y += sy;
      this.camera.position.z += sz;
    }

    this.currentRollRad = THREE.MathUtils.damp(
      this.currentRollRad,
      this.additiveRollBias,
      10,
      delta
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.currentLookTarget);
    if (Math.abs(this.currentRollRad) > 0.0001) {
      this.camera.rotateZ(this.currentRollRad);
    }
  }
}
