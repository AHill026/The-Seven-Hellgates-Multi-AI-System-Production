import * as THREE from 'three';
import { LoadedAzraelAsset } from './types';

export class AzraelIKController {
  private clavicleL: THREE.Bone | undefined;
  private upperArmL: THREE.Bone | undefined;
  private foreArmL: THREE.Bone | undefined;
  private handL: THREE.Bone | undefined;
  private root: THREE.Object3D;

  private targetWeight = 1.0;
  private currentWeight = 1.0;
  private manualOverrideWeight: number | null = null;
  private lastDistanceError = 0;
  private lastReachUtilization = 0;
  private disposed = false;
  private clavicleModified = false;

  // Reusable scratch math objects (zero per-frame heap allocations)
  private readonly claviclePos = new THREE.Vector3();
  private readonly shoulderPos = new THREE.Vector3();
  private readonly elbowPos = new THREE.Vector3();
  private readonly wristPos = new THREE.Vector3();
  private readonly targetPos = new THREE.Vector3();
  private readonly toTarget = new THREE.Vector3();
  private readonly dir = new THREE.Vector3();
  private readonly poleWorld = new THREE.Vector3();
  private readonly perpInPlane = new THREE.Vector3();
  private readonly desiredElbowPos = new THREE.Vector3();
  private readonly upperDirFK = new THREE.Vector3();
  private readonly desiredUpperDir = new THREE.Vector3();
  private readonly foreDirCurrent = new THREE.Vector3();
  private readonly desiredForeDir = new THREE.Vector3();
  private readonly clavicleTargetDir = new THREE.Vector3();
  private readonly shoulderOffset = new THREE.Vector3();

  private readonly rootWorldQuat = new THREE.Quaternion();
  private readonly rootInvQuat = new THREE.Quaternion();
  private readonly parentWorldQuat = new THREE.Quaternion();
  private readonly upperWorldQuat = new THREE.Quaternion();
  private readonly foreWorldQuat = new THREE.Quaternion();
  private readonly deltaWorldQuat = new THREE.Quaternion();
  private readonly targetLocalQuat = new THREE.Quaternion();
  private readonly fkLocalQuat = new THREE.Quaternion();
  private readonly clavicleRestQuat = new THREE.Quaternion();
  private readonly clavicleLastQuat = new THREE.Quaternion();
  private readonly clavicleBaseQuat = new THREE.Quaternion();
  private readonly eulerScratch = new THREE.Euler();

  constructor(asset: LoadedAzraelAsset) {
    this.root = asset.root;
    const find = (pattern: RegExp) => asset.bones.find((b) => pattern.test(b.name));
    this.clavicleL = find(/^clavicle[_.]?l$/i) ?? find(/clavicle.*l|left.*clavicle/i);
    this.upperArmL = find(/^upperarm[_.]?l$/i) ?? find(/upperarm.*l|left.*arm/i);
    this.foreArmL = find(/^forearm[_.]?l$/i) ?? find(/forearm.*l|left.*forearm/i);
    this.handL = find(/^hand[_.]?l$/i) ?? find(/hand.*l|left.*hand/i);

    if (this.clavicleL) {
      this.clavicleRestQuat.copy(this.clavicleL.quaternion);
      this.clavicleLastQuat.copy(this.clavicleL.quaternion);
    }
  }

  public setAutoTargetWeight(weight: number, snap = false): void {
    this.targetWeight = THREE.MathUtils.clamp(weight, 0, 1);
    if (snap && this.manualOverrideWeight === null) {
      this.currentWeight = this.targetWeight;
    }
  }

  public setManualOverride(weight: number | null): void {
    this.manualOverrideWeight =
      weight === null ? null : THREE.MathUtils.clamp(weight, 0, 1);
  }

  public getManualOverride(): number | null {
    return this.manualOverrideWeight;
  }

  public getEffectiveWeight(): number {
    return this.currentWeight;
  }

  public getLastDistanceError(): number {
    return this.lastDistanceError;
  }

  public getLastReachUtilization(): number {
    return this.lastReachUtilization;
  }

  public solve(
    delta: number,
    weaponInHand: boolean,
    offhandGripWorldPos: THREE.Vector3
  ): void {
    if (this.disposed) return;

    const desiredGoal = weaponInHand
      ? this.manualOverrideWeight !== null
        ? this.manualOverrideWeight
        : this.targetWeight
      : 0;

    // Smoothly blend IK weight to prevent pops during weapon draws or rapid action changes
    const blendSpeed = Math.min(1, Math.max(0.01, delta) * 14);
    this.currentWeight = THREE.MathUtils.lerp(this.currentWeight, desiredGoal, blendSpeed);

    if (!this.upperArmL || !this.foreArmL || !this.handL || this.currentWeight < 0.005) {
      this.restoreClavicleTowardRest(Math.max(0.25, blendSpeed));
      this.lastDistanceError = 0;
      this.lastReachUtilization = 0;
      return;
    }

    this.root.updateMatrixWorld(true);
    this.root.getWorldQuaternion(this.rootWorldQuat);

    this.upperArmL.getWorldPosition(this.shoulderPos);
    this.foreArmL.getWorldPosition(this.elbowPos);
    this.handL.getWorldPosition(this.wristPos);

    const l1 = this.shoulderPos.distanceTo(this.elbowPos);
    const l2 = this.elbowPos.distanceTo(this.wristPos);
    if (l1 < 0.01 || l2 < 0.01) return;

    const armMaxLen = l1 + l2;
    this.targetPos.copy(offhandGripWorldPos);

    // 1. Subtle Clavicle Protraction Assist when reaching across the centerline or near full arm reach
    if (this.clavicleL && this.clavicleL.parent) {
      const mixerOverwroteClavicle =
        this.clavicleModified &&
        Math.abs(this.clavicleL.quaternion.dot(this.clavicleLastQuat)) <= 0.99999;

      const preDist = this.shoulderPos.distanceTo(this.targetPos);
      this.clavicleL.getWorldPosition(this.claviclePos);
      const assistAlpha =
        THREE.MathUtils.clamp((preDist - armMaxLen * 0.72) / (armMaxLen * 0.35), 0, 1) *
        this.currentWeight;

      if (assistAlpha > 0.01) {
        this.clavicleBaseQuat.copy(
          mixerOverwroteClavicle ? this.clavicleL.quaternion : this.clavicleRestQuat
        );
        this.rootInvQuat.copy(this.rootWorldQuat).invert();
        this.clavicleTargetDir
          .subVectors(this.targetPos, this.claviclePos)
          .applyQuaternion(this.rootInvQuat)
          .normalize();
        // Clamp clavicle rotation to natural anatomical bounds (~16 deg protraction/lift)
        // Negative Y rotation brings +X left shoulder forward toward +Z
        const yaw = -THREE.MathUtils.clamp(this.clavicleTargetDir.z * 0.36, -0.22, 0.30) * assistAlpha;
        const lift = THREE.MathUtils.clamp(this.clavicleTargetDir.y * 0.22, -0.14, 0.22) * assistAlpha;
        this.eulerScratch.set(0, yaw, lift, 'XYZ');
        this.targetLocalQuat.setFromEuler(this.eulerScratch).premultiply(this.clavicleBaseQuat);
        this.clavicleL.quaternion.slerp(this.targetLocalQuat, 0.9);
        this.clavicleModified = true;
        this.clavicleLastQuat.copy(this.clavicleL.quaternion);
        this.clavicleL.updateMatrixWorld(true);
        this.upperArmL.getWorldPosition(this.shoulderPos);
        this.foreArmL.getWorldPosition(this.elbowPos);
        this.handL.getWorldPosition(this.wristPos);
      } else {
        const restored = this.restoreClavicleTowardRest(Math.max(0.25, blendSpeed));
        if (restored) {
          this.upperArmL.getWorldPosition(this.shoulderPos);
          this.foreArmL.getWorldPosition(this.elbowPos);
          this.handL.getWorldPosition(this.wristPos);
        }
      }
    }

    this.toTarget.subVectors(this.targetPos, this.shoulderPos);
    const rawDist = this.toTarget.length();
    if (rawDist < 0.001) return;

    this.lastReachUtilization = rawDist / armMaxLen;

    // 2. Soft anatomical reach falloff: smoothly attenuate weight if target exceeds physical arm reach
    // (Prevents unnatural shoulder snapping on extreme wide one-handed windups or sheathing edge frames)
    let reachWeight = this.currentWeight;
    if (rawDist > armMaxLen * 1.12) {
      const overFactor = THREE.MathUtils.clamp(
        (rawDist - armMaxLen * 1.12) / (armMaxLen * 0.25),
        0,
        1
      );
      reachWeight *= 1 - overFactor * 0.85;
    }

    if (reachWeight < 0.005) {
      this.lastDistanceError = this.wristPos.distanceTo(this.targetPos);
      return;
    }

    const maxReach = armMaxLen * 0.992;
    const minReach = Math.max(0.05, Math.abs(l1 - l2) + 0.02);
    const clampedDist = THREE.MathUtils.clamp(rawDist, minReach, maxReach);
    this.dir.copy(this.toTarget).divideScalar(rawDist);

    // 3. Analytical Two-Bone Law of Cosines
    const cosAngle0 = THREE.MathUtils.clamp(
      (l1 * l1 + clampedDist * clampedDist - l2 * l2) / (2 * l1 * clampedDist),
      -1,
      1
    );
    const sinAngle0 = Math.sqrt(Math.max(0, 1 - cosAngle0 * cosAngle0));

    // Pole vector: outward-left (+X), downward (-Y), backward (-Z) relative to character
    this.poleWorld
      .set(0.58, -0.36, -0.73)
      .normalize()
      .applyQuaternion(this.rootWorldQuat);

    this.perpInPlane
      .copy(this.poleWorld)
      .addScaledVector(this.dir, -this.poleWorld.dot(this.dir));
    if (this.perpInPlane.lengthSq() < 1e-4) {
      this.shoulderOffset.set(1, -0.25, -0.25).normalize().applyQuaternion(this.rootWorldQuat);
      this.perpInPlane
        .copy(this.shoulderOffset)
        .addScaledVector(this.dir, -this.shoulderOffset.dot(this.dir));
    }
    this.perpInPlane.normalize();

    this.desiredElbowPos
      .copy(this.shoulderPos)
      .addScaledVector(this.dir, l1 * cosAngle0)
      .addScaledVector(this.perpInPlane, l1 * sinAngle0);

    // 4. Rotate UpperArm_L toward desiredElbowPos
    this.upperDirFK.subVectors(this.elbowPos, this.shoulderPos).normalize();
    this.desiredUpperDir.subVectors(this.desiredElbowPos, this.shoulderPos).normalize();

    if (this.upperArmL.parent) {
      this.fkLocalQuat.copy(this.upperArmL.quaternion);
      this.upperArmL.getWorldQuaternion(this.upperWorldQuat);
      this.deltaWorldQuat.setFromUnitVectors(this.upperDirFK, this.desiredUpperDir);
      this.upperWorldQuat.premultiply(this.deltaWorldQuat);

      this.upperArmL.parent.getWorldQuaternion(this.parentWorldQuat).invert();
      this.targetLocalQuat.copy(this.parentWorldQuat).multiply(this.upperWorldQuat);
      this.upperArmL.quaternion.copy(this.fkLocalQuat).slerp(this.targetLocalQuat, reachWeight);
      this.upperArmL.updateMatrixWorld(true);
    }

    // 5. Re-read ForeArm_L world direction and rotate toward targetPos
    this.foreArmL.getWorldPosition(this.elbowPos);
    this.handL.getWorldPosition(this.wristPos);
    this.foreDirCurrent.subVectors(this.wristPos, this.elbowPos).normalize();
    this.desiredForeDir.subVectors(this.targetPos, this.elbowPos).normalize();

    if (this.foreArmL.parent) {
      this.fkLocalQuat.copy(this.foreArmL.quaternion);
      this.foreArmL.getWorldQuaternion(this.foreWorldQuat);
      this.deltaWorldQuat.setFromUnitVectors(this.foreDirCurrent, this.desiredForeDir);
      this.foreWorldQuat.premultiply(this.deltaWorldQuat);

      this.foreArmL.parent.getWorldQuaternion(this.parentWorldQuat).invert();
      this.targetLocalQuat.copy(this.parentWorldQuat).multiply(this.foreWorldQuat);
      this.foreArmL.quaternion.copy(this.fkLocalQuat).slerp(this.targetLocalQuat, reachWeight);
      this.foreArmL.updateMatrixWorld(true);
    }

    this.handL.getWorldPosition(this.wristPos);
    this.lastDistanceError = this.wristPos.distanceTo(this.targetPos);
  }

  private restoreClavicleTowardRest(blend: number): boolean {
    if (!this.clavicleL || !this.clavicleModified) return false;

    // Skip reset if an external GLB clip actively overwrote Clavicle_L this frame
    if (Math.abs(this.clavicleL.quaternion.dot(this.clavicleLastQuat)) <= 0.99999) {
      this.clavicleModified = false;
      this.clavicleLastQuat.copy(this.clavicleL.quaternion);
      return false;
    }

    this.clavicleL.quaternion.slerp(this.clavicleRestQuat, THREE.MathUtils.clamp(blend, 0, 1));
    if (Math.abs(this.clavicleL.quaternion.dot(this.clavicleRestQuat)) > 0.999995) {
      this.clavicleL.quaternion.copy(this.clavicleRestQuat);
      this.clavicleModified = false;
    }
    this.clavicleLastQuat.copy(this.clavicleL.quaternion);
    this.clavicleL.updateMatrixWorld(true);
    return true;
  }

  public dispose(): void {
    this.disposed = true;
    this.clavicleL = undefined;
    this.upperArmL = undefined;
    this.foreArmL = undefined;
    this.handL = undefined;
    this.clavicleModified = false;
    this.currentWeight = 0;
    this.lastDistanceError = 0;
  }
}
