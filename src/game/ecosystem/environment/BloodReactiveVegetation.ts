/**
 * The Seven Hellgates - Blood-Reactive Vegetation (Abaddon Biome)
 * Semi-sentient crimson tendrils and blood vines that writhe, swell, and pulse
 * in response to footstep vibrations, bleeding, and combat strikes.
 */

import * as THREE from 'three';

interface TendrilNode {
  mesh: THREE.Mesh;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  pulsePhase: number;
  sensitivityRadius: number;
}

export class BloodReactiveVegetation {
  public group: THREE.Group;
  private tendrils: TendrilNode[] = [];
  private vineMaterial: THREE.MeshStandardMaterial;
  private time: number = 0;
  private combatExcitement: number = 0;

  constructor() {
    this.group = new THREE.Group();

    this.vineMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f0a0a,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.35,
      roughness: 0.45,
      metalness: 0.25,
    });
  }

  public spawnVineCluster(position: THREE.Vector3, count: number = 6) {
    for (let i = 0; i < count; i++) {
      // Curved procedural tendril
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          0.6 + Math.random() * 0.4,
          (Math.random() - 0.5) * 0.4
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          1.4 + Math.random() * 0.8,
          (Math.random() - 0.5) * 0.8
        ),
      ]);

      const geom = new THREE.TubeGeometry(curve, 12, 0.065, 8, false);
      geom.computeVertexNormals();
      const mesh = new THREE.Mesh(geom, this.vineMaterial);
      mesh.castShadow = true;

      const offset = new THREE.Vector3(
        position.x + (Math.random() - 0.5) * 2.5,
        position.y,
        position.z + (Math.random() - 0.5) * 2.5
      );
      mesh.position.copy(offset);
      mesh.rotation.y = Math.random() * Math.PI * 2;

      this.group.add(mesh);
      this.tendrils.push({
        mesh,
        basePosition: offset.clone(),
        baseRotation: mesh.rotation.clone(),
        pulsePhase: Math.random() * Math.PI * 2,
        sensitivityRadius: 4.5,
      });
    }
  }

  public notifyCombatNoise(position: THREE.Vector3, intensity: number = 1.0) {
    this.combatExcitement = Math.min(2.5, this.combatExcitement + intensity);
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.time += delta;

    // Decay combat excitement
    if (this.combatExcitement > 0) {
      this.combatExcitement = Math.max(0, this.combatExcitement - delta * 0.6);
    }

    const globalPulse = 0.35 + (this.combatExcitement * 0.4) + Math.sin(this.time * (2.5 + this.combatExcitement * 3)) * 0.2;
    this.vineMaterial.emissiveIntensity = globalPulse;

    for (const tendril of this.tendrils) {
      const dist = tendril.basePosition.distanceTo(playerPos);
      const isNearby = dist <= tendril.sensitivityRadius;

      // Agitation frequency increases when player is close or in combat
      const agitation = isNearby ? 3.5 : (1.0 + this.combatExcitement);
      const sway = Math.sin(this.time * agitation + tendril.pulsePhase) * (isNearby ? 0.25 : 0.08);

      tendril.mesh.rotation.z = tendril.baseRotation.z + sway;
      tendril.mesh.rotation.x = tendril.baseRotation.x + sway * 0.7;

      // Writhing height stretch
      const stretch = 1.0 + Math.sin(this.time * (agitation * 0.8) + tendril.pulsePhase) * 0.12;
      tendril.mesh.scale.set(1.0, stretch, 1.0);
    }
  }

  public dispose() {
    this.vineMaterial.dispose();
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.tendrils = [];
  }
}
