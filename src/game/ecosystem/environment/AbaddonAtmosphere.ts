/**
 * The Seven Hellgates - Realm II: Abaddon
 * Environmental Life & Atmosphere System
 *
 * Implements living dark-fantasy atmospheric depth:
 * - Subtle breathing organic structures & moving flesh mounds
 * - Dripping organic material / bile droplets with ground splash ripples
 * - Floating bioluminescent organic spores & embers drifting through the air
 * - Distant creature silhouettes pacing in the perimeter horizon fog
 * - Deep crimson atmospheric lighting pulses
 */

import * as THREE from 'three';

interface BileDrip {
  mesh: THREE.Mesh;
  startPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  speed: number;
  floorY: number;
  rippleMesh: THREE.Mesh;
  rippleScale: number;
  rippleMaxScale: number;
  isRippling: boolean;
}

interface DistantSilhouette {
  group: THREE.Group;
  basePos: THREE.Vector3;
  wanderAngle: number;
  speed: number;
  scale: number;
  legs: THREE.Mesh[];
  bobPhase: number;
}

export class AbaddonAtmosphere {
  public group: THREE.Group;

  // 1. Breathing Organic Structures
  private fleshMounds: THREE.Group[] = [];
  private fleshMoundMat: THREE.MeshStandardMaterial;
  private veinGlowMat: THREE.MeshStandardMaterial;

  // 2. Dripping Bile System
  private bileDrips: BileDrip[] = [];
  private dripMat: THREE.MeshBasicMaterial;
  private rippleMat: THREE.MeshBasicMaterial;

  // 3. Floating Organic Spores (Instanced for 60 FPS performance)
  private sporeInstancedMesh: THREE.InstancedMesh;
  private sporeCount = 180;
  private sporePositions: THREE.Vector3[] = [];
  private sporeVelocities: THREE.Vector3[] = [];
  private dummyMatrix = new THREE.Matrix4();
  private dummyColor = new THREE.Color();

  // 4. Distant Horizon Creature Silhouettes
  private silhouettes: DistantSilhouette[] = [];
  private silhouetteMat: THREE.MeshBasicMaterial;

  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // PBR Materials
    this.fleshMoundMat = new THREE.MeshStandardMaterial({
      color: 0x2e0c10,
      emissive: 0x4a0a10,
      emissiveIntensity: 0.35,
      roughness: 0.55,
      metalness: 0.20,
    });

    this.veinGlowMat = new THREE.MeshStandardMaterial({
      color: 0x1f300c,
      emissive: 0x84cc16,
      emissiveIntensity: 0.75,
      roughness: 0.35,
      metalness: 0.3,
    });

    this.dripMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.85,
    });

    this.rippleMat = new THREE.MeshBasicMaterial({
      color: 0x4d7c0f,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    this.silhouetteMat = new THREE.MeshBasicMaterial({
      color: 0x120608,
      transparent: true,
      opacity: 0.75,
    });

    // Initialize spore instanced mesh
    const sporeGeom = new THREE.DodecahedronGeometry(0.065, 0);
    const sporeMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.65,
    });
    this.sporeInstancedMesh = new THREE.InstancedMesh(sporeGeom, sporeMat, this.sporeCount);
    this.sporeInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.sporeInstancedMesh);

    this.buildBreathingMounds();
    this.buildBileDripPits();
    this.buildFloatingSpores();
    this.buildDistantSilhouettes();
  }

  /**
   * 1. Constructs breathing flesh mounds with pulsating veins along the arena perimeter
   */
  private buildBreathingMounds() {
    const moundPositions = [
      new THREE.Vector3(-15, 0, -10),
      new THREE.Vector3(15, 0, -10),
      new THREE.Vector3(-18, 0, 8),
      new THREE.Vector3(18, 0, 8),
      new THREE.Vector3(-7, 0, 18),
      new THREE.Vector3(7, 0, 18),
    ];

    moundPositions.forEach((pos, idx) => {
      const moundGroup = new THREE.Group();
      moundGroup.position.copy(pos);

      // Organic dome
      const domeGeom = new THREE.SphereGeometry(1.6 + (idx % 3) * 0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
      domeGeom.computeVertexNormals();
      const domeMesh = new THREE.Mesh(domeGeom, this.fleshMoundMat);
      domeMesh.castShadow = true;
      domeMesh.receiveShadow = true;
      moundGroup.add(domeMesh);

      // Pulsing vein ridges across dome
      for (let v = 0; v < 4; v++) {
        const ang = (v / 4) * Math.PI * 2;
        const veinGeom = new THREE.TorusGeometry(1.2, 0.08, 6, 16, Math.PI * 0.45);
        veinGeom.computeVertexNormals();
        const veinMesh = new THREE.Mesh(veinGeom, this.veinGlowMat);
        veinMesh.rotation.y = ang;
        veinMesh.rotation.x = Math.PI * 0.25;
        veinMesh.position.y = 0.4;
        moundGroup.add(veinMesh);
      }

      this.group.add(moundGroup);
      this.fleshMounds.push(moundGroup);
    });
  }

  /**
   * 2. Sets up dripping acidic bile streams falling from overhead bone arches into puddles
   */
  private buildBileDripPits() {
    const dripSources = [
      { start: new THREE.Vector3(-8, 5.5, -4), floor: 0.05 },
      { start: new THREE.Vector3(8, 5.5, -4), floor: 0.05 },
      { start: new THREE.Vector3(0, 6.2, -18), floor: 0.05 },
      { start: new THREE.Vector3(-12, 4.0, -6), floor: 0.05 },
      { start: new THREE.Vector3(14, 4.0, -8), floor: 0.05 },
      { start: new THREE.Vector3(0, 4.5, 16), floor: 0.05 },
    ];

    const dripGeom = new THREE.ConeGeometry(0.06, 0.24, 6);
    dripGeom.computeVertexNormals();
    const rippleGeom = new THREE.RingGeometry(0.05, 0.12, 16);
    rippleGeom.rotateX(-Math.PI / 2);

    dripSources.forEach(src => {
      const dropMesh = new THREE.Mesh(dripGeom, this.dripMat);
      dropMesh.position.copy(src.start);
      this.group.add(dropMesh);

      const ripMesh = new THREE.Mesh(rippleGeom, this.rippleMat);
      ripMesh.position.set(src.start.x, src.floor, src.start.z);
      ripMesh.visible = false;
      this.group.add(ripMesh);

      this.bileDrips.push({
        mesh: dropMesh,
        startPos: src.start.clone(),
        currentPos: src.start.clone(),
        speed: 5.5 + Math.random() * 3.0,
        floorY: src.floor,
        rippleMesh: ripMesh,
        rippleScale: 0.1,
        rippleMaxScale: 1.2 + Math.random() * 0.6,
        isRippling: false,
      });
    });
  }

  /**
   * 3. Initializes 180 floating atmospheric spores drifting throughout Abaddon
   */
  private buildFloatingSpores() {
    for (let i = 0; i < this.sporeCount; i++) {
      const px = (Math.random() - 0.5) * 55;
      const py = 0.5 + Math.random() * 6.5;
      const pz = (Math.random() - 0.5) * 55;
      this.sporePositions.push(new THREE.Vector3(px, py, pz));

      this.sporeVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.4
        )
      );

      this.dummyMatrix.setPosition(px, py, pz);
      this.sporeInstancedMesh.setMatrixAt(i, this.dummyMatrix);

      // Varying colors: crimson spores and glowing lime acid flecks
      if (i % 3 === 0) {
        this.dummyColor.setHex(0x84cc16);
      } else {
        this.dummyColor.setHex(0xef4444);
      }
      this.sporeInstancedMesh.setColorAt(i, this.dummyColor);
    }
    this.sporeInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.sporeInstancedMesh.instanceColor) {
      this.sporeInstancedMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * 4. Constructs distant creature silhouettes pacing beyond the perimeter fog
   */
  private buildDistantSilhouettes() {
    const silhouetteSpecs = [
      { dist: 38, angle: -Math.PI * 0.3, scale: 2.5 },
      { dist: 42, angle: Math.PI * 0.25, scale: 3.2 },
      { dist: 45, angle: Math.PI * 0.75, scale: 2.8 },
      { dist: 36, angle: -Math.PI * 0.7, scale: 3.5 },
    ];

    silhouetteSpecs.forEach((spec, idx) => {
      const silGroup = new THREE.Group();
      const px = Math.cos(spec.angle) * spec.dist;
      const pz = Math.sin(spec.angle) * spec.dist;
      silGroup.position.set(px, 0, pz);
      silGroup.scale.set(spec.scale, spec.scale, spec.scale);

      // Hunched grotesque quadruped silhouette
      const bodyGeom = new THREE.CylinderGeometry(0.6, 0.4, 2.2, 8);
      bodyGeom.rotateX(Math.PI / 2.3);
      const bodyMesh = new THREE.Mesh(bodyGeom, this.silhouetteMat);
      bodyMesh.position.y = 1.6;
      silGroup.add(bodyMesh);

      // Low prowling head
      const headGeom = new THREE.ConeGeometry(0.45, 1.1, 6);
      headGeom.rotateX(-Math.PI / 2.5);
      const headMesh = new THREE.Mesh(headGeom, this.silhouetteMat);
      headMesh.position.set(0, 1.2, 1.4);
      silGroup.add(headMesh);

      // 4 Prowling legs
      const legs: THREE.Mesh[] = [];
      const legGeom = new THREE.CylinderGeometry(0.12, 0.08, 1.6, 6);
      for (const [lx, lz] of [[0.45, 0.7], [-0.45, 0.7], [0.45, -0.7], [-0.45, -0.7]] as const) {
        const leg = new THREE.Mesh(legGeom, this.silhouetteMat);
        leg.position.set(lx, 0.8, lz);
        silGroup.add(leg);
        legs.push(leg);
      }

      this.group.add(silGroup);
      this.silhouettes.push({
        group: silGroup,
        basePos: new THREE.Vector3(px, 0, pz),
        wanderAngle: spec.angle,
        speed: 1.2 + Math.random() * 0.6,
        scale: spec.scale,
        legs,
        bobPhase: Math.random() * Math.PI * 2,
      });
    });
  }

  /**
   * Main Per-Frame Update
   */
  public update(delta: number) {
    this.time += delta;

    // 1. Update Breathing Mounds
    const breath = 1.0 + Math.sin(this.time * 1.5) * 0.07;
    const veinPulse = 0.5 + Math.sin(this.time * 2.5) * 0.35;
    this.veinGlowMat.emissiveIntensity = veinPulse;

    this.fleshMounds.forEach((mound, idx) => {
      const localBreath = 1.0 + Math.sin(this.time * 1.6 + idx * 0.8) * 0.06;
      mound.scale.set(localBreath, localBreath * 1.05, localBreath);
    });

    // 2. Update Dripping Bile System
    this.bileDrips.forEach(drip => {
      if (!drip.isRippling) {
        drip.currentPos.y -= drip.speed * delta;
        drip.mesh.position.copy(drip.currentPos);

        if (drip.currentPos.y <= drip.floorY) {
          // Hit floor: initiate splash ripple
          drip.isRippling = true;
          drip.mesh.visible = false;
          drip.rippleMesh.visible = true;
          drip.rippleScale = 0.1;
        }
      } else {
        drip.rippleScale += delta * 2.2;
        drip.rippleMesh.scale.set(drip.rippleScale, 1, drip.rippleScale);
        (drip.rippleMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.6 * (1 - drip.rippleScale / drip.rippleMaxScale));

        if (drip.rippleScale >= drip.rippleMaxScale) {
          // Reset drop
          drip.isRippling = false;
          drip.currentPos.copy(drip.startPos);
          drip.mesh.position.copy(drip.currentPos);
          drip.mesh.visible = true;
          drip.rippleMesh.visible = false;
        }
      }
    });

    // 3. Update Floating Atmospheric Spores
    for (let i = 0; i < this.sporeCount; i++) {
      const pos = this.sporePositions[i];
      const vel = this.sporeVelocities[i];

      // Gentle turbulent drift
      pos.x += vel.x * delta + Math.sin(this.time * 0.5 + i) * 0.02;
      pos.y += vel.y * delta + Math.cos(this.time * 0.7 + i) * 0.015;
      pos.z += vel.z * delta + Math.cos(this.time * 0.4 + i) * 0.02;

      // Arena boundary wrap-around
      if (pos.x > 28) pos.x = -28;
      if (pos.x < -28) pos.x = 28;
      if (pos.z > 28) pos.z = -28;
      if (pos.z < -28) pos.z = 28;
      if (pos.y > 7.0) pos.y = 0.5;
      if (pos.y < 0.3) pos.y = 6.8;

      this.dummyMatrix.setPosition(pos.x, pos.y, pos.z);
      this.sporeInstancedMesh.setMatrixAt(i, this.dummyMatrix);
    }
    this.sporeInstancedMesh.instanceMatrix.needsUpdate = true;

    // 4. Update Distant Horizon Silhouettes
    this.silhouettes.forEach((sil, idx) => {
      sil.wanderAngle += delta * 0.04 * (idx % 2 === 0 ? 1 : -1);
      const r = sil.basePos.length();
      sil.group.position.x = Math.cos(sil.wanderAngle) * r;
      sil.group.position.z = Math.sin(sil.wanderAngle) * r;
      sil.group.rotation.y = sil.wanderAngle + Math.PI / 2 * (idx % 2 === 0 ? 1 : -1);

      // Walk cycle
      const walk = Math.sin(this.time * 2.5 + sil.bobPhase);
      sil.legs[0].rotation.x = walk * 0.3;
      sil.legs[1].rotation.x = -walk * 0.3;
      sil.legs[2].rotation.x = -walk * 0.3;
      sil.legs[3].rotation.x = walk * 0.3;
      sil.group.position.y = Math.abs(Math.sin(this.time * 5.0 + sil.bobPhase)) * 0.15;
    });
  }

  public dispose() {
    this.fleshMoundMat.dispose();
    this.veinGlowMat.dispose();
    this.dripMat.dispose();
    this.rippleMat.dispose();
    this.silhouetteMat.dispose();

    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.fleshMounds = [];
    this.bileDrips = [];
    this.silhouettes = [];
  }
}
