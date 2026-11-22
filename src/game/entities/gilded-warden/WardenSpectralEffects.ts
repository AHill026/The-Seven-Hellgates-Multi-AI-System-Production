/**
 * The Seven Hellgates - Greed: The Pit of Destruction
 * The Forgotten Souls — WardenSpectralEffects
 *
 * Implements authoritative visual VFX matching character reference:
 * - Swirling golden spectral vortex inside chest with trapped soul faces
 * - Spiked golden halo illumination, rotation & flicker
 * - Glowing leg-mounted soul lantern cage with trapped skeleton
 * - Golden spectral energy circulating around blackened bronze & gold armor
 * - Cracks along armor seams emitting golden light based on health thresholds
 * - Escaping golden spectral wisps, rising spirits with agonized silhouettes
 * - Lock break bursts, ground soulflares, and flail trail aura
 */

import * as THREE from 'three';

export interface SpectralSoulWisp {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  rotSpeed: number;
}

export class WardenSpectralEffects {
  public group: THREE.Group;

  // Nodes to animate
  private haloGroup: THREE.Group | null = null;
  private chestVortexMesh: THREE.Mesh | null = null;
  private lanternLight: THREE.PointLight | null = null;
  private lanternSkeleton: THREE.Mesh | null = null;
  private flailAuraMesh: THREE.Mesh | null = null;
  private flailLight: THREE.PointLight | null = null;
  private armorCracks: THREE.Mesh[] = [];

  // PBR Materials
  private goldenSpectralMat: THREE.MeshStandardMaterial;
  private goldCracksMat: THREE.MeshStandardMaterial;
  private haloGoldMat: THREE.MeshStandardMaterial;
  private soulFaceMat: THREE.MeshBasicMaterial;

  // Active wisps
  private soulWisps: SpectralSoulWisp[] = [];
  private time: number = 0;
  private instabilityLevel: number = 0; // 0 (normal) to 1 (turbulent)

  constructor() {
    this.group = new THREE.Group();

    // High-Fidelity Golden Spectral PBR Materials
    this.goldenSpectralMat = new THREE.MeshStandardMaterial({
      color: 0x996515,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.4,
      roughness: 0.22,
      metalness: 0.85,
      transparent: true,
      opacity: 0.92,
    });

    this.goldCracksMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.9,
    });

    this.haloGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.95,
    });

    this.soulFaceMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.75,
    });
  }

  public registerRigElements(elements: {
    haloGroup: THREE.Group;
    chestVortex: THREE.Mesh;
    lanternLight: THREE.PointLight;
    lanternSkeleton: THREE.Mesh;
    flailAura: THREE.Mesh;
    flailLight: THREE.PointLight;
    cracks: THREE.Mesh[];
  }) {
    this.haloGroup = elements.haloGroup;
    this.chestVortexMesh = elements.chestVortex;
    this.lanternLight = elements.lanternLight;
    this.lanternSkeleton = elements.lanternSkeleton;
    this.flailAuraMesh = elements.flailAura;
    this.flailLight = elements.flailLight;
    this.armorCracks = elements.cracks;
  }

  /**
   * Spawns an escaping spectral soul wisp with a weeping human face silhouette
   */
  public spawnSoulWisp(worldPosition: THREE.Vector3, count: number = 1) {
    for (let c = 0; c < count; c++) {
      const wispGroup = new THREE.Group();
      wispGroup.position.copy(worldPosition).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          Math.random() * 0.4,
          (Math.random() - 0.5) * 0.6
        )
      );

      // Trailing wisp flame body
      const flameGeom = new THREE.ConeGeometry(0.12, 0.6, 6);
      flameGeom.computeVertexNormals();
      const flame = new THREE.Mesh(flameGeom, this.goldenSpectralMat);
      flame.rotation.x = Math.PI;
      wispGroup.add(flame);

      // Weeping soul face mask
      const faceGeom = new THREE.SphereGeometry(0.1, 8, 8);
      faceGeom.scale(0.85, 1.2, 0.75);
      const face = new THREE.Mesh(faceGeom, this.soulFaceMat);
      face.position.set(0, 0.15, 0.05);
      wispGroup.add(face);

      // Eyeless hollows
      for (const side of [-1, 1] as const) {
        const eye = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0x451a03 })
        );
        eye.position.set(side * 0.035, 0.18, 0.12);
        wispGroup.add(eye);
      }

      this.group.add(wispGroup);

      this.soulWisps.push({
        mesh: wispGroup,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          1.2 + Math.random() * 1.4,
          (Math.random() - 0.5) * 0.8
        ),
        life: 0,
        maxLife: 2.2 + Math.random() * 1.2,
        rotSpeed: (Math.random() - 0.5) * 3.5,
      });
    }
  }

  /**
   * Spawns a golden burst when a soul-lock is broken or on heavy attack impact
   */
  public spawnLockBreakBurst(position: THREE.Vector3) {
    this.spawnSoulWisp(position, 4);

    // Flash cracks and halo
    this.goldCracksMat.emissiveIntensity = 4.0;
    this.haloGoldMat.emissiveIntensity = 4.5;
    if (this.lanternLight) {
      this.lanternLight.intensity = 8.0;
    }
  }

  /**
   * Updates spectral energy based on health threshold state
   */
  public setHealthState(healthRatio: number, isEnraged: boolean) {
    if (healthRatio <= 0.15) {
      // Critical failing state: violent turbulence
      this.instabilityLevel = 1.0;
      this.goldCracksMat.emissiveIntensity = 3.2;
      this.haloGoldMat.emissiveIntensity = 3.5;
      this.goldenSpectralMat.emissiveIntensity = 2.8;
      if (this.lanternLight) this.lanternLight.intensity = 6.5;
    } else if (healthRatio <= 0.40) {
      // Spectral escape: visible fractures
      this.instabilityLevel = 0.65;
      this.goldCracksMat.emissiveIntensity = 2.2;
      this.haloGoldMat.emissiveIntensity = 2.4;
      this.goldenSpectralMat.emissiveIntensity = 2.0;
      if (this.lanternLight) this.lanternLight.intensity = 4.5;
    } else if (healthRatio <= 0.70) {
      // Unstable energy
      this.instabilityLevel = 0.35;
      this.goldCracksMat.emissiveIntensity = 1.5;
      this.haloGoldMat.emissiveIntensity = 1.8;
      this.goldenSpectralMat.emissiveIntensity = 1.6;
      if (this.lanternLight) this.lanternLight.intensity = 3.2;
    } else {
      // Normal state
      this.instabilityLevel = 0.1;
      this.goldCracksMat.emissiveIntensity = 0.8;
      this.haloGoldMat.emissiveIntensity = 1.4;
      this.goldenSpectralMat.emissiveIntensity = 1.2;
      if (this.lanternLight) this.lanternLight.intensity = 2.4;
    }

    if (isEnraged) {
      this.instabilityLevel = Math.max(0.85, this.instabilityLevel);
      this.haloGoldMat.emissive.setHex(0xf59e0b);
    }
  }

  /**
   * Main per-frame update loop
   */
  public update(delta: number, wardenPosition: THREE.Vector3) {
    this.time += delta;

    // 1. Swirling Chest Vortex Animation
    if (this.chestVortexMesh) {
      const vortexSpeed = 2.5 + this.instabilityLevel * 4.5;
      this.chestVortexMesh.rotation.z += delta * vortexSpeed;

      const pulse = 1.0 + Math.sin(this.time * 5.0) * (0.08 + this.instabilityLevel * 0.14);
      this.chestVortexMesh.scale.set(pulse, pulse, pulse);
    }

    // 2. Spiked Golden Halo Illumination & Rotation
    if (this.haloGroup) {
      const haloSpeed = 0.5 + this.instabilityLevel * 2.2;
      this.haloGroup.rotation.z += delta * haloSpeed;

      // Occasional flicker when unstable
      if (this.instabilityLevel > 0.3 && Math.random() < 0.05) {
        this.haloGoldMat.emissiveIntensity = 0.4 + Math.random() * 3.5;
      }
    }

    // 3. Leg Soul Lantern Skeleton Floating & Glow
    if (this.lanternSkeleton) {
      this.lanternSkeleton.position.y = 0.05 + Math.sin(this.time * 3.2) * 0.04;
      this.lanternSkeleton.rotation.y += delta * 1.2;
    }
    if (this.lanternLight) {
      this.lanternLight.intensity = 2.4 + Math.sin(this.time * 4.0) * (0.6 + this.instabilityLevel * 1.5);
    }

    // 4. Flail Sphere Golden Aura
    if (this.flailAuraMesh) {
      this.flailAuraMesh.rotation.y += delta * 3.0;
      this.flailAuraMesh.rotation.x += delta * 2.0;
    }
    if (this.flailLight) {
      this.flailLight.intensity = 1.8 + Math.sin(this.time * 6.0) * 0.8;
    }

    // 5. Periodic passive soul wisp emission from chest or cracks
    if (Math.random() < (0.08 + this.instabilityLevel * 0.28)) {
      this.spawnSoulWisp(wardenPosition.clone().add(new THREE.Vector3(0, 1.8, 0.4)), 1);
    }

    // 6. Update Active Wisps
    for (let i = this.soulWisps.length - 1; i >= 0; i--) {
      const wisp = this.soulWisps[i];
      wisp.life += delta;

      // Float upward with sinusoidal drift
      wisp.mesh.position.addScaledVector(wisp.velocity, delta);
      wisp.mesh.position.x += Math.sin(this.time * 3 + i) * 0.02;
      wisp.mesh.rotation.y += wisp.rotSpeed * delta;

      const progress = wisp.life / wisp.maxLife;
      const alpha = Math.max(0, 1 - progress);
      wisp.mesh.scale.set(1 - progress * 0.5, 1 - progress * 0.5, 1 - progress * 0.5);

      if (progress >= 1.0) {
        this.group.remove(wisp.mesh);
        this.soulWisps.splice(i, 1);
      }
    }
  }

  public dispose() {
    this.goldenSpectralMat.dispose();
    this.goldCracksMat.dispose();
    this.haloGoldMat.dispose();
    this.soulFaceMat.dispose();

    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.soulWisps = [];
  }
}
