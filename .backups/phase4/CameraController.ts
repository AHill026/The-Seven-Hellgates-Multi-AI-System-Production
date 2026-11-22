/**
 * The Seven Hellgates - Third-Person Cinematic Camera Controller
 * Smooth orbital tracking, pitch/yaw limits, lock-on targeting, and screen shake.
 */

import * as THREE from 'three';

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

  public lockTarget: THREE.Vector3 | null = null;

  constructor(fov: number = 60, aspect: number = 16 / 9) {
    this.baseFov = fov;
    this.targetFov = fov;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 300);
    this.camera.position.set(0, 3, 6);
  }

  public addScreenShake(amount: number) {
    this.shakeIntensity = Math.min(1.2, this.shakeIntensity + amount);
  }

  public setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    lookDeltaX: number,
    lookDeltaY: number,
    comboCount: number = 0,
    isInCombat: boolean = false
  ) {
    // Dynamic combat FOV scaling: expands field of view during intense action and combos
    this.targetFov = this.baseFov + Math.min(10, comboCount * 0.75) + (isInCombat ? 3.5 : 0);
    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 4.5, delta);
      this.camera.updateProjectionMatrix();
    }

    // 1. Process mouse/touch look
    if (!this.lockTarget) {
      this.yaw -= lookDeltaX * 1.5;
      this.pitch = Math.max(-0.25, Math.min(1.1, this.pitch + lookDeltaY * 1.5));
    } else {
      // Lock-on mode: orient yaw directly towards target
      const toLock = new THREE.Vector3().subVectors(this.lockTarget, playerPos);
      const desiredYaw = Math.atan2(toLock.x, toLock.z);
      this.yaw = THREE.MathUtils.damp(this.yaw, desiredYaw, 6, delta);
      this.pitch = THREE.MathUtils.damp(this.pitch, 0.28, 4, delta);
    }

    // 2. Compute camera spherical position relative to player
    const targetY = playerPos.y + this.heightOffset;
    const desiredTarget = new THREE.Vector3(playerPos.x, targetY, playerPos.z);
    this.currentLookTarget.lerp(desiredTarget, Math.min(1, delta * 12));

    const cx = Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
    const cy = Math.sin(this.pitch) * this.distance;
    const cz = Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;

    const desiredCamPos = new THREE.Vector3(
      this.currentLookTarget.x - cx,
      this.currentLookTarget.y + cy,
      this.currentLookTarget.z - cz
    );

    // Keep camera above ground
    if (desiredCamPos.y < 0.6) {
      desiredCamPos.y = 0.6;
    }

    this.currentCamPos.lerp(desiredCamPos, Math.min(1, delta * 14));
    this.camera.position.copy(this.currentCamPos);

    // 3. Screen shake
    if (this.shakeIntensity > 0.001) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      const sz = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      this.camera.position.add(new THREE.Vector3(sx, sy, sz));
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta);
    }

    this.camera.lookAt(this.currentLookTarget);
  }
}
