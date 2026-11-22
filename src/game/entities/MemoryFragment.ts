/**
 * The Seven Hellgates - Interactive 3D Memory Fragment Entity
 * Floating ethereal soul crystal with pale-blue glow, orbiting motes,
 * and proximity-triggered absorption without pausing gameplay.
 */

import * as THREE from 'three';

export interface MemoryLogData {
  id: string;
  title: string;
  text: string;
  position: THREE.Vector3;
}

export class MemoryFragment {
  public id: string;
  public title: string;
  public text: string;
  public group: THREE.Group;
  public isCollected: boolean = false;
  public isDissolving: boolean = false;

  private crystalMesh: THREE.Mesh;
  private innerCore: THREE.Mesh;
  private orbitRing: THREE.Mesh;
  private pointLight: THREE.PointLight;
  private basePosition: THREE.Vector3;
  private time: number = Math.random() * 10;
  private dissolveProgress: number = 0;

  constructor(data: MemoryLogData) {
    this.id = data.id;
    this.title = data.title;
    this.text = data.text;
    this.basePosition = data.position.clone();

    this.group = new THREE.Group();
    this.group.position.copy(this.basePosition);

    // 1. Outer Ethereal Soul Crystal (Octahedron / Diamond)
    const crystalGeom = new THREE.OctahedronGeometry(0.55, 0);
    crystalGeom.scale(0.8, 1.4, 0.8);

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    this.crystalMesh = new THREE.Mesh(crystalGeom, crystalMat);
    this.crystalMesh.castShadow = true;
    this.group.add(this.crystalMesh);

    // 2. Bright Inner Energy Core
    const coreGeom = new THREE.OctahedronGeometry(0.28, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.innerCore = new THREE.Mesh(coreGeom, coreMat);
    this.group.add(this.innerCore);

    // 3. Orbiting Ethereal Rune Ring
    const ringGeom = new THREE.RingGeometry(0.75, 0.82, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.orbitRing = new THREE.Mesh(ringGeom, ringMat);
    this.orbitRing.rotation.x = Math.PI / 3;
    this.group.add(this.orbitRing);

    // 4. Point Light illumination
    this.pointLight = new THREE.PointLight(0x38bdf8, 2.2, 8);
    this.pointLight.position.set(0, 0, 0);
    this.group.add(this.pointLight);
  }

  public checkProximity(playerPos: THREE.Vector3, threshold: number = 3.2): boolean {
    if (this.isCollected) return false;
    const dist = this.group.position.distanceTo(playerPos);
    return dist <= threshold;
  }

  public collect() {
    this.isCollected = true;
    this.isDissolving = true;
  }

  public update(delta: number): boolean {
    this.time += delta;

    if (this.isDissolving) {
      this.dissolveProgress += delta * 2.5;
      const p = Math.min(1, this.dissolveProgress);

      // Ascend and flare outward before vanishing
      this.group.position.y += delta * 3.5;
      const s = 1.0 + p * 1.5;
      this.group.scale.set(s, s, s);

      (this.crystalMesh.material as THREE.MeshStandardMaterial).opacity = (1 - p) * 0.85;
      this.pointLight.intensity = (1 - p) * 4.0;

      if (p >= 1) {
        this.group.visible = false;
        return true; // Dissolve complete
      }
      return false;
    }

    if (!this.isCollected) {
      // Gentle floating bob & celestial rotation
      this.group.position.y = this.basePosition.y + Math.sin(this.time * 2.0) * 0.18;
      this.crystalMesh.rotation.y += delta * 1.2;
      this.crystalMesh.rotation.z = Math.sin(this.time * 1.5) * 0.15;

      this.innerCore.rotation.y -= delta * 2.2;
      this.innerCore.rotation.x += delta * 1.5;

      this.orbitRing.rotation.z += delta * 1.8;
      this.orbitRing.rotation.y = Math.sin(this.time * 2.2) * 0.4;

      // Subtle light pulse
      this.pointLight.intensity = 2.0 + Math.sin(this.time * 3.5) * 0.8;
    }

    return false;
  }

  public dispose() {
    this.crystalMesh.geometry.dispose();
    (this.crystalMesh.material as THREE.Material).dispose();
    this.innerCore.geometry.dispose();
    (this.innerCore.material as THREE.Material).dispose();
    this.orbitRing.geometry.dispose();
    (this.orbitRing.material as THREE.Material).dispose();
  }
}
