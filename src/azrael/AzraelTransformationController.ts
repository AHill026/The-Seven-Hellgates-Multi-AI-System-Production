import * as THREE from 'three';
import {
  AzraelMaterialInspectionMode,
  AzraelTransformState,
  LoadedAzraelAsset,
} from './types';
import { AzraelEffectsController } from './AzraelEffectsController';

interface TransformTargetValues {
  energy: number;
  chestEmissive: number;
  eyeEmissive: number;
  bladeEmissive: number;
  armorEmissive: number;
  tintHex: number;
}

const TRANSFORM_PROFILES: Record<AzraelTransformState, TransformTargetValues> = {
  DORMANT: {
    energy: 0.0,
    chestEmissive: 0.65,
    eyeEmissive: 1.25,
    bladeEmissive: 0.35,
    armorEmissive: 0.1,
    tintHex: 0x38bdf8,
  },
  AWAKENED: {
    energy: 0.55,
    chestEmissive: 2.2,
    eyeEmissive: 2.35,
    bladeEmissive: 1.6,
    armorEmissive: 0.45,
    tintHex: 0x67d4ff,
  },
  MAJOR_TRANSFORMATION: {
    energy: 1.0,
    chestEmissive: 4.1,
    eyeEmissive: 3.4,
    bladeEmissive: 3.1,
    armorEmissive: 0.95,
    tintHex: 0xbae6fd,
  },
};

export class AzraelTransformationController {
  private asset: LoadedAzraelAsset;
  private effects: AzraelEffectsController;
  private state: AzraelTransformState = 'DORMANT';
  private inspectionMode: AzraelMaterialInspectionMode = 'standard';

  private currentEnergy = 0;
  private currentTint = new THREE.Color(0x38bdf8);
  private targetTint = new THREE.Color(0x38bdf8);
  private readonly eyeTargetColor = new THREE.Color(0x67d4ff);

  private originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private clayMaterial: THREE.MeshStandardMaterial;
  private emissiveInspectMaterials = new Map<THREE.Material, THREE.MeshBasicMaterial>();

  constructor(asset: LoadedAzraelAsset, effects: AzraelEffectsController) {
    this.asset = asset;
    this.effects = effects;

    this.clayMaterial = new THREE.MeshStandardMaterial({
      name: 'Debug_ClayRoughness',
      color: 0x9aa0aa,
      metalness: 0.05,
      roughness: 0.58,
    });

    asset.meshes.forEach((mesh) => {
      this.originalMaterials.set(mesh, mesh.material);
    });
  }

  public setState(state: AzraelTransformState): void {
    this.state = state;
  }

  public getState(): AzraelTransformState {
    return this.state;
  }

  public setMaterialInspectionMode(mode: AzraelMaterialInspectionMode): void {
    if (this.inspectionMode === mode) return;
    this.inspectionMode = mode;

    this.asset.meshes.forEach((mesh) => {
      const orig = this.originalMaterials.get(mesh);
      if (!orig) return;

      if (mode === 'standard') {
        mesh.material = orig;
      } else if (mode === 'clay_roughness') {
        mesh.material = this.clayMaterial;
      } else {
        // emissive_only: isolate emissive channels against near-black matte
        if (Array.isArray(orig)) {
          mesh.material = orig.map((m) => this.getOrCreateEmissiveInspectMat(m));
        } else {
          mesh.material = this.getOrCreateEmissiveInspectMat(orig);
        }
      }
    });
  }

  private getOrCreateEmissiveInspectMat(src: THREE.Material): THREE.MeshBasicMaterial {
    const existing = this.emissiveInspectMaterials.get(src);
    if (existing) {
      this.syncEmissiveInspectMat(src, existing);
      return existing;
    }
    const mat = new THREE.MeshBasicMaterial({ color: 0x050508 });
    this.emissiveInspectMaterials.set(src, mat);
    this.syncEmissiveInspectMat(src, mat);
    return mat;
  }

  private syncEmissiveInspectMat(
    src: THREE.Material,
    dst: THREE.MeshBasicMaterial
  ): void {
    if (src instanceof THREE.MeshStandardMaterial && src.emissiveIntensity > 0.2) {
      dst.color
        .copy(src.emissive)
        .multiplyScalar(Math.min(2.2, src.emissiveIntensity * 0.65));
    } else {
      dst.color.setHex(0x06070a);
    }
  }

  public getMaterialInspectionMode(): AzraelMaterialInspectionMode {
    return this.inspectionMode;
  }

  public update(delta: number, elapsed: number): void {
    const profile = TRANSFORM_PROFILES[this.state];
    const t = Math.min(1, delta * 4.5);

    this.currentEnergy = THREE.MathUtils.lerp(this.currentEnergy, profile.energy, t);
    this.targetTint.setHex(profile.tintHex);
    this.currentTint.lerp(this.targetTint, t);

    const pulse = 1 + Math.sin(elapsed * (2.6 + this.currentEnergy * 3.0)) * (0.06 + this.currentEnergy * 0.14);

    for (const mat of this.asset.chestRuneMaterials) {
      mat.emissive.copy(this.currentTint);
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        profile.chestEmissive * pulse,
        t
      );
    }

    for (const mat of this.asset.eyeMaterials) {
      const eyeTarget = this.state === 'MAJOR_TRANSFORMATION' ? 0xe0f2fe : 0x67d4ff;
      this.eyeTargetColor.setHex(eyeTarget);
      mat.emissive.lerp(this.eyeTargetColor, t);
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        profile.eyeEmissive * pulse,
        t
      );
    }

    for (const mat of this.asset.bladeEmissiveMaterials) {
      mat.emissive.copy(this.currentTint);
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        profile.bladeEmissive * pulse,
        t
      );
    }

    for (const mat of this.asset.armorAccentMaterials) {
      mat.emissive.copy(this.currentTint).multiplyScalar(0.25);
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        profile.armorEmissive,
        t
      );
    }

    if (this.inspectionMode === 'emissive_only') {
      this.emissiveInspectMaterials.forEach((dst, src) => {
        this.syncEmissiveInspectMat(src, dst);
      });
    }

    this.effects.setEnergyLevel(this.currentEnergy, this.currentTint);
  }

  private disposed = false;

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.originalMaterials.forEach((origMat, mesh) => {
      mesh.material = origMat;
    });
    this.clayMaterial.dispose();
    this.emissiveInspectMaterials.forEach((m) => m.dispose());
    this.emissiveInspectMaterials.clear();
    this.originalMaterials.clear();
  }
}
