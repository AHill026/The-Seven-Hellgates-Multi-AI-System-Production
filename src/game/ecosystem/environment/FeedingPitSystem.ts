/**
 * The Seven Hellgates - Feeding Pit 3D Environment System
 * Procedural grotesque organic caverns, ribcage pits, bubbling digestive bile pools,
 * and embedded carcasses that degrade as creatures feed.
 */

import * as THREE from 'three';
import { FeedingPit, FeedingPitCarcass } from '../core/types';

export class FeedingPitSystem {
  public group: THREE.Group;
  private bileMaterials: THREE.MeshStandardMaterial[] = [];
  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();
  }

  public createFeedingPitMesh(pit: FeedingPit): THREE.Group {
    const pitGroup = new THREE.Group();
    pitGroup.position.copy(pit.center);

    // 1. Organic Bile Pool Floor (Recessed circular depression)
    const bileMat = new THREE.MeshStandardMaterial({
      color: 0x4d0a0a,
      emissive: 0x84cc16,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.40,
    });
    this.bileMaterials.push(bileMat);

    const bileGeom = new THREE.CylinderGeometry(pit.radius, pit.radius * 0.9, 0.4, 32);
    bileGeom.computeVertexNormals();
    const bilePool = new THREE.Mesh(bileGeom, bileMat);
    bilePool.position.y = -0.15;
    bilePool.receiveShadow = true;
    pitGroup.add(bilePool);

    // 2. Surrounding Bone Teeth & Carcass Arch Formations
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0x3d352e,
      roughness: 0.70,
    });

    const ribCount = 8;
    for (let i = 0; i < ribCount; i++) {
      const ang = (i / ribCount) * Math.PI * 2;
      const ribGeom = new THREE.TorusGeometry(pit.radius * 0.45, 0.14, 8, 20, Math.PI * 0.65);
      ribGeom.computeVertexNormals();
      const rib = new THREE.Mesh(ribGeom, boneMat);
      rib.rotation.z = Math.PI * 0.5;
      rib.rotation.y = ang;
      rib.position.set(
        Math.cos(ang) * (pit.radius * 0.85),
        0.5,
        Math.sin(ang) * (pit.radius * 0.85)
      );
      rib.castShadow = true;
      pitGroup.add(rib);
    }

    // 3. Carcass Remains embedded in the pit
    const fleshMat = new THREE.MeshStandardMaterial({
      color: 0x3b0f0f,
      roughness: 0.60,
    });

    pit.carcasses.forEach((carcass, idx) => {
      const carcassMound = new THREE.Group();
      const moundGeom = new THREE.DodecahedronGeometry(0.75, 2);
      moundGeom.computeVertexNormals();
      const mound = new THREE.Mesh(moundGeom, fleshMat);
      mound.scale.set(1.4, 0.65, 1.1);
      mound.position.copy(carcass.position);
      mound.castShadow = true;
      carcassMound.add(mound);

      // Embedded bone splinters
      const splinterGeom = new THREE.ConeGeometry(0.08, 0.8, 6);
      splinterGeom.computeVertexNormals();
      const splinter = new THREE.Mesh(splinterGeom, boneMat);
      splinter.rotation.z = (idx % 2 === 0 ? 0.35 : -0.35);
      splinter.position.set(carcass.position.x, 0.4, carcass.position.z);
      carcassMound.add(splinter);

      carcass.carcassMesh = mound;
      pitGroup.add(carcassMound);
    });

    pit.pitGroup = pitGroup;
    this.group.add(pitGroup);
    return pitGroup;
  }

  public update(delta: number) {
    this.time += delta;
    // Viscous bubbling bile pulsation
    const bileGlow = 0.35 + Math.sin(this.time * 2.2) * 0.12;
    this.bileMaterials.forEach(m => {
      m.emissiveIntensity = bileGlow;
    });
  }

  public dispose() {
    this.bileMaterials.forEach(m => m.dispose());
    this.bileMaterials = [];
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
  }
}
