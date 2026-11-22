/**
 * The Seven Hellgates - Supernatural Crimson Health Pickup Orb
 * Dropped by defeated demons; floats with a pulsing ruby/crimson aura and heals Azrael for 25 HP.
 */

import * as THREE from 'three';

export class HealthPickup {
  public group: THREE.Group;
  public isCollected: boolean = false;
  public healAmount: number = 25;
  private baseY: number = 0.8;
  private animTime: number = Math.random() * Math.PI * 2;
  private lifeTimer: number = 40.0; // Despawns after 40s to prevent infinite accumulation
  public isExpired: boolean = false;

  private orbMesh: THREE.Mesh;
  private glowRing: THREE.Mesh;
  private pointLight: THREE.PointLight;

  constructor(position: THREE.Vector3) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.baseY = Math.max(0.7, position.y + 0.6);
    this.group.position.y = this.baseY;

    // 1. Glowing Crimson Core Orb
    const orbGeom = new THREE.SphereGeometry(0.22, 16, 16);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0xef4444,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.5,
    });
    this.orbMesh = new THREE.Mesh(orbGeom, orbMat);
    this.orbMesh.castShadow = true;
    this.group.add(this.orbMesh);

    // 2. Concentric Ethereal Ruby Halo Ring
    const ringGeom = new THREE.RingGeometry(0.32, 0.42, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf87171,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glowRing = new THREE.Mesh(ringGeom, ringMat);
    this.glowRing.rotation.x = Math.PI / 2;
    this.group.add(this.glowRing);

    // 3. Supernatural Crimson Point Light
    this.pointLight = new THREE.PointLight(0xef4444, 1.2, 4.5);
    this.pointLight.position.set(0, 0, 0);
    this.group.add(this.pointLight);
  }

  public update(delta: number): boolean {
    if (this.isCollected) return true;

    this.animTime += delta;
    this.lifeTimer -= delta;

    if (this.lifeTimer <= 0) {
      this.isExpired = true;
      return true;
    }

    // Gentle floating bob & pulsation
    this.group.position.y = this.baseY + Math.sin(this.animTime * 3.2) * 0.14;
    this.glowRing.rotation.z += delta * 1.8;
    this.orbMesh.rotation.y += delta * 1.2;

    const pulse = 1.0 + Math.sin(this.animTime * 4.0) * 0.18;
    this.orbMesh.scale.set(pulse, pulse, pulse);
    this.pointLight.intensity = 1.0 + Math.sin(this.animTime * 4.0) * 0.35;

    // Fast blink warning in final 5 seconds before despawn
    if (this.lifeTimer < 5.0) {
      const blink = Math.sin(this.lifeTimer * 12) > 0;
      this.orbMesh.visible = blink;
      this.glowRing.visible = blink;
    }

    return false;
  }

  public checkProximity(playerPos: THREE.Vector3, collectionRadius: number = 1.8): boolean {
    if (this.isCollected || this.isExpired) return false;
    const dx = this.group.position.x - playerPos.x;
    const dz = this.group.position.z - playerPos.z;
    const distSq = dx * dx + dz * dz;
    return distSq <= collectionRadius * collectionRadius;
  }

  public collect(): number {
    this.isCollected = true;
    return this.healAmount;
  }

  public dispose() {
    this.orbMesh.geometry.dispose();
    (this.orbMesh.material as THREE.Material).dispose();
    this.glowRing.geometry.dispose();
    (this.glowRing.material as THREE.Material).dispose();
  }
}
