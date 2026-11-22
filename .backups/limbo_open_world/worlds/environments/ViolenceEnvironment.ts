import * as THREE from 'three';
import { materialFactory } from '../../vfx/MaterialFactory';
import { BaseRealmEnvironment } from './BaseRealmEnvironment';

interface SwingingCage {
  pivot: THREE.Group;
  speed: number;
  amp: number;
  phase: number;
}

interface TortureWheel {
  mesh: THREE.Object3D;
  speed: number;
}

export class ViolenceEnvironment extends BaseRealmEnvironment {
  public readonly realmId = 6;
  public readonly realmName = 'Violence — The Kingdom of Ruin';

  private cages: SwingingCage[] = [];
  private wheels: TortureWheel[] = [];
  private lightningTimer: number = 3.2;
  private lightningIntensity: number = 0;
  private furnaceLight: THREE.PointLight | null = null;

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x0a0d14);
    scene.fog = new THREE.FogExp2(0x161218, 0.017);

    this.createSkyDome({
      zenithColor: 0x070a12,
      midColor: 0x1b2436,
      horizonColor: 0x451218,
      cloudColor: 0x141b2b,
      glowColor: 0x93c5fd,
      glowDirection: new THREE.Vector3(-0.25, 0.45, -0.85).normalize(),
      glowSize: 0.18,
      cloudDensity: 0.72,
      cloudSpeed: 0.05,
    });
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. Iron Fortress Courtyard Island surrounded by Dark Blood-Water Sea
    const groundGeom = this.trackGeometry(new THREE.PlaneGeometry(180, 180, 52, 52));
    const pos = groundGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const r = Math.hypot(vx, vy);
      let h = 0;
      if (r > 27 && r <= 56) {
        const t = (r - 27) / 29;
        h = -Math.sin(t * Math.PI) * 3.8;
      } else if (r > 56) {
        h = (r - 56) * 0.52 + Math.sin(vx * 0.18) * Math.cos(vy * 0.18) * 2.2;
      }
      pos.setZ(i, h);
    }
    groundGeom.computeVertexNormals();

    const darkIronMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x1a1d24,
        metalness: 0.82,
        roughness: 0.44,
      })
    );
    const ground = new THREE.Mesh(groundGeom, darkIronMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Blood-Water Flooded Moat surrounding the iron courtyard
    const bloodWaterMat = this.createLiquidMaterial({
      colorDeep: 0x1a0407,
      colorMid: 0x6b0f16,
      colorBright: 0xdc2626,
      flowSpeed: 0.65,
      emissiveBoost: 1.2,
      scaleX: 9,
      scaleY: 9,
    });
    const bloodSea = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(26.2, 62, 48)),
      bloodWaterMat
    );
    bloodSea.rotation.x = -Math.PI / 2;
    bloodSea.position.y = -0.5;
    this.group.add(bloodSea);

    const rustedSteelMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x3b2622,
        metalness: 0.72,
        roughness: 0.58,
      })
    );
    const furnaceGlowMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );

    // 2. Colossal Blackened-Iron Execution Fortress across the Blood Sea
    const fortress = this.buildCathedralSilhouette(32, 26, 16, 7, darkIronMat, furnaceGlowMat);
    fortress.position.set(0, -1, -64);
    this.group.add(fortress);

    // Flanking Iron War Towers standing in the Blood Sea
    const towerGeom = this.trackGeometry(new THREE.BoxGeometry(6.5, 24, 6.5));
    const towerCapGeom = this.trackGeometry(new THREE.ConeGeometry(4.8, 7, 4));
    for (const [tx, tz] of [[-32, -38], [32, -38], [-38, -14], [38, -14]] as Array<[number, number]>) {
      const tower = new THREE.Mesh(towerGeom, darkIronMat);
      tower.position.set(tx, 11, tz);
      this.group.add(tower);

      const cap = new THREE.Mesh(towerCapGeom, rustedSteelMat);
      cap.position.set(tx, 26.5, tz);
      cap.rotation.y = Math.PI * 0.25;
      this.group.add(cap);
    }

    // Ruined Iron Bridges spanning across the Blood Sea
    const bridgeMat = rustedSteelMat;
    const northBridge = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(8.8, 0.9, 26)),
      bridgeMat
    );
    northBridge.position.set(0, -0.35, -36);
    this.group.add(northBridge);

    // 3. Giant Iron Chains Suspended Diagonally from the Sky (InstancedMesh link chains)
    this.buildSkyChains(darkIronMat);

    // 4. Hanging Iron Torture Cages swaying from Perimeter Cranes
    this.buildHangingCages(darkIronMat, rustedSteelMat);

    // 5. Industrial Torture Machinery (Rotating Spiked Wheels)
    this.buildTortureMachinery(darkIronMat, rustedSteelMat, furnaceGlowMat);

    // 6. Bone Mountains heaped near the Execution Walls (InstancedMesh)
    const boneMat = materialFactory.createCalcifiedBone();
    this.trackMaterial(boneMat);
    this.buildBoneMounds(boneMat);
  }

  public createBossArena(): void {
    const wetIronFloorMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x16181f,
        metalness: 0.78,
        roughness: 0.36,
      })
    );
    const rustedMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x3b2622,
        metalness: 0.75,
        roughness: 0.54,
      })
    );
    const ironMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x222630,
        metalness: 0.85,
        roughness: 0.42,
      })
    );
    const bloodSealMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xb91c1c,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
      })
    );

    // Execution Courtyard Iron Plate
    const plate = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(26.8, 27.6, 0.14, 32)),
      wetIronFloorMat
    );
    plate.position.y = -0.05;
    plate.receiveShadow = true;
    this.group.add(plate);

    // Blood-Stained Execution Arena Ring
    const ring = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(17.2, 17.6, 48)),
      bloodSealMat
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.035;
    this.group.add(ring);

    // Iron War Bastions & Weapon-Constructed Gates around Perimeter (r = 23.2m with colliders)
    const pillarGeom = this.trackGeometry(new THREE.BoxGeometry(1.9, 8.2, 1.9));
    const spikeGeom = this.trackGeometry(new THREE.ConeGeometry(0.32, 2.2, 4));

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      if (Math.abs(cos) < 0.36 && sin < -0.72) continue;

      const px = cos * 23.4;
      const pz = sin * 23.4;

      const pillar = new THREE.Mesh(pillarGeom, i % 2 === 0 ? ironMat : rustedMat);
      pillar.position.set(px, 4.1, pz);
      pillar.rotation.y = -a;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.group.add(pillar);

      const spike = new THREE.Mesh(spikeGeom, rustedMat);
      spike.position.set(px, 9.2, pz);
      this.group.add(spike);

      this.addCollider(px, pz, 1.35);
    }

    // Colossal Throne Made From Weapons (z = -17.8)
    const throne = new THREE.Group();
    throne.position.set(0, 0, -17.8);

    const dais = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(7.8, 0.44, 3.8)),
      rustedMat
    );
    dais.position.y = 0.22;
    dais.receiveShadow = true;
    throne.add(dais);

    const seat = new THREE.Mesh(this.trackGeometry(new THREE.BoxGeometry(2.4, 1.15, 1.5)), ironMat);
    seat.position.set(0, 0.98, -0.35);
    seat.castShadow = true;
    throne.add(seat);

    // Fan of giant cleavers, halberds & greatswords forming the throne backrest
    const cleaverGeom = this.trackGeometry(new THREE.BoxGeometry(0.28, 3.8, 0.12));
    for (let w = -4; w <= 4; w++) {
      const blade = new THREE.Mesh(cleaverGeom, w % 2 === 0 ? ironMat : rustedMat);
      blade.position.set(w * 0.32, 2.4 + (4 - Math.abs(w)) * 0.22, -0.95);
      blade.rotation.z = w * 0.14;
      blade.castShadow = true;
      throne.add(blade);
    }

    this.group.add(throne);
    this.addCollider(0, -18.0, 1.65);

    this.furnaceLight = new THREE.PointLight(0xdc2626, 2.8, 26);
    this.furnaceLight.position.set(0, 4.6, -16);
    this.group.add(this.furnaceLight);
  }

  protected buildEnvironmentalEffects(): void {
    // 1. Driving Blood Rain Streaks
    this.createParticleLayer({
      countUltra: 560,
      countBalanced: 320,
      countLow: 120,
      colorPrimary: 0xdc2626,
      colorSecondary: 0x7f1d1d,
      size: 0.34,
      radius: 26,
      minY: 0.1,
      maxY: 14,
      speedY: [-9.5, -6.5],
      windX: 1.35,
      windZ: 0.45,
      swirl: 0.08,
      opacity: 0.65,
      additive: false,
      streakAspect: 4.5,
    });

    // 2. Industrial Forge Sparks drifting from Machinery
    this.createParticleLayer({
      countUltra: 220,
      countBalanced: 130,
      countLow: 50,
      colorPrimary: 0xf97316,
      colorSecondary: 0xfef08a,
      size: 0.2,
      radius: 25,
      minY: 0.4,
      maxY: 8.5,
      speedY: [0.5, 1.4],
      windX: 0.9,
      windZ: 0.35,
      swirl: 0.65,
      opacity: 0.85,
      additive: true,
    });

    // 3. Ground-Level Smoke & Red Haze Wisps
    const smokeTex = this.createMistTexture(55, 22, 26);
    const smokeGeom = this.trackGeometry(new THREE.PlaneGeometry(14, 14));
    const smokeMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        map: smokeTex,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      })
    );
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const m = new THREE.Mesh(smokeGeom, smokeMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(Math.cos(a) * 24, 0.3, Math.sin(a) * 24);
      this.group.add(m);
      if (i >= 4) this.registerDetailObject(m, 'medium');
    }
  }

  protected updateRealmAnimations(delta: number): void {
    // 1. Swinging Execution Cages
    for (let i = 0; i < this.cages.length; i++) {
      const c = this.cages[i];
      c.pivot.rotation.z = Math.sin(this.elapsed * c.speed + c.phase) * c.amp;
      c.pivot.rotation.x = Math.cos(this.elapsed * c.speed * 0.7 + c.phase) * (c.amp * 0.5);
    }

    // 2. Rotating Industrial Torture Wheels
    for (let i = 0; i < this.wheels.length; i++) {
      this.wheels[i].mesh.rotation.z += delta * this.wheels[i].speed;
    }

    // 3. Violent Thunderstorm Lightning Flashes
    this.lightningTimer -= delta;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 3.2 + Math.random() * 4.5;
      this.lightningIntensity = 1.25;
    }
    if (this.lightningIntensity > 0) {
      this.lightningIntensity = Math.max(0, this.lightningIntensity - delta * 4.2);
    }
    if (this.skyUniforms) {
      this.skyUniforms.uLightning.value = this.lightningIntensity;
    }

    if (this.furnaceLight) {
      this.furnaceLight.intensity = 2.6 + Math.sin(this.elapsed * 3.8) * 0.5;
    }
  }

  private buildSkyChains(ironMat: THREE.Material): void {
    const linkGeom = this.trackGeometry(new THREE.TorusGeometry(0.65, 0.16, 6, 12));
    const linkCount = 120;
    const inst = new THREE.InstancedMesh(linkGeom, ironMat, linkCount);
    const dummy = new THREE.Object3D();

    const chains: Array<[THREE.Vector3, THREE.Vector3]> = [
      [new THREE.Vector3(-42, 46, -54), new THREE.Vector3(-14, 18, -58)],
      [new THREE.Vector3(42, 46, -54), new THREE.Vector3(14, 18, -58)],
      [new THREE.Vector3(-46, 44, -8), new THREE.Vector3(-30, 14, -36)],
      [new THREE.Vector3(46, 44, -8), new THREE.Vector3(30, 14, -36)],
    ];

    const perChain = linkCount / chains.length;
    let idx = 0;
    for (const [start, end] of chains) {
      for (let i = 0; i < perChain; i++) {
        const t = i / (perChain - 1);
        dummy.position.lerpVectors(start, end, t);
        // Subtle catenary sag
        dummy.position.y -= Math.sin(t * Math.PI) * 3.8;
        dummy.lookAt(end);
        dummy.rotateZ(i % 2 === 0 ? 0 : Math.PI * 0.5);
        dummy.scale.setScalar(1.0);
        dummy.updateMatrix();
        inst.setMatrixAt(idx++, dummy.matrix);
      }
    }

    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    this.group.add(inst);
  }

  private buildHangingCages(ironMat: THREE.Material, rustedMat: THREE.Material): void {
    const chainGeom = this.trackGeometry(new THREE.CylinderGeometry(0.08, 0.08, 6.5, 5));
    const cageGeom = this.trackGeometry(new THREE.CylinderGeometry(0.95, 0.95, 2.4, 8, 1, true));
    const capGeom = this.trackGeometry(new THREE.CylinderGeometry(0.95, 0.95, 0.18, 8));

    const spots: Array<[number, number, number]> = [
      [-26, 13.5, -18],
      [26, 13.5, -18],
      [-28, 13.0, 6],
      [28, 13.0, 6],
    ];
    spots.forEach(([cx, cy, cz], i) => {
      const pivot = new THREE.Group();
      pivot.position.set(cx, cy, cz);

      const rope = new THREE.Mesh(chainGeom, ironMat);
      rope.position.y = -3.25;
      pivot.add(rope);

      const cage = new THREE.Mesh(cageGeom, rustedMat);
      cage.position.y = -7.6;
      pivot.add(cage);

      const topCap = new THREE.Mesh(capGeom, ironMat);
      topCap.position.y = -6.4;
      pivot.add(topCap);

      const botCap = new THREE.Mesh(capGeom, ironMat);
      botCap.position.y = -8.8;
      pivot.add(botCap);

      this.group.add(pivot);
      if (i >= 2) this.registerDetailObject(pivot, 'medium');
      this.cages.push({ pivot, speed: 1.1 + i * 0.15, amp: 0.09, phase: i * 1.3 });
    });
  }

  private buildTortureMachinery(
    ironMat: THREE.Material,
    rustedMat: THREE.Material,
    glowMat: THREE.Material
  ): void {
    const wheelGeom = this.trackGeometry(new THREE.TorusGeometry(3.4, 0.35, 8, 20));
    const spokeGeom = this.trackGeometry(new THREE.BoxGeometry(6.8, 0.3, 0.3));
    const spikeGeom = this.trackGeometry(new THREE.ConeGeometry(0.24, 1.1, 4));

    for (const side of [-1, 1]) {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(side * 25.5, 4.2, -10);
      wheelGroup.rotation.y = side * -Math.PI * 0.5;

      const rim = new THREE.Mesh(wheelGeom, ironMat);
      wheelGroup.add(rim);

      for (let s = 0; s < 4; s++) {
        const spoke = new THREE.Mesh(spokeGeom, rustedMat);
        spoke.rotation.z = (s / 4) * Math.PI;
        wheelGroup.add(spoke);
      }

      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const sp = new THREE.Mesh(spikeGeom, k % 3 === 0 ? glowMat : rustedMat);
        sp.position.set(Math.cos(a) * 4.0, Math.sin(a) * 4.0, 0);
        sp.rotation.z = a - Math.PI * 0.5;
        wheelGroup.add(sp);
      }

      this.group.add(wheelGroup);
      this.registerDetailObject(wheelGroup, 'medium');
      this.wheels.push({ mesh: wheelGroup, speed: side * 0.65 });
    }
  }

  private buildBoneMounds(boneMat: THREE.Material): void {
    const boneGeom = this.trackGeometry(new THREE.CylinderGeometry(0.16, 0.28, 2.2, 5));
    const count = 80;
    const inst = new THREE.InstancedMesh(boneGeom, boneMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const a = ((i % 8) / 8) * Math.PI * 2 + 0.25;
      const cx = Math.cos(a) * 26.2;
      const cz = Math.sin(a) * 26.2;
      dummy.position.set(
        cx + ((i % 3) - 1) * 0.75,
        0.35 + (i % 4) * 0.22,
        cz + ((i % 5) - 2) * 0.45
      );
      dummy.rotation.set(i * 0.8, i * 1.4, i * 0.6);
      dummy.scale.setScalar(0.75 + (i % 3) * 0.3);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }

    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    this.group.add(inst);
    this.registerDetailObject(inst, 'medium');
  }

  public override dispose(): void {
    this.cages = [];
    this.wheels = [];
    this.furnaceLight = null;
    super.dispose();
  }
}
