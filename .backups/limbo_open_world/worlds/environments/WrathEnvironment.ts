import * as THREE from 'three';
import { materialFactory } from '../../vfx/MaterialFactory';
import { BaseRealmEnvironment } from './BaseRealmEnvironment';

interface BannerNode {
  mesh: THREE.Mesh;
  phase: number;
}

interface EruptionNode {
  mesh: THREE.Mesh;
  light: THREE.PointLight | null;
  timer: number;
  intensity: number;
  baseScaleY: number;
}

export class WrathEnvironment extends BaseRealmEnvironment {
  public readonly realmId = 4;
  public readonly realmName = 'Wrath — The Burning Battlefield';

  private banners: BannerNode[] = [];
  private eruptions: EruptionNode[] = [];
  private lightningTimer: number = 4.2;
  private lightningIntensity: number = 0;

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x160504);
    scene.fog = new THREE.FogExp2(0x290a07, 0.017);

    this.createSkyDome({
      zenithColor: 0x160403,
      midColor: 0x52120a,
      horizonColor: 0xb9380c,
      cloudColor: 0x3b0b07,
      glowColor: 0xf97316,
      glowDirection: new THREE.Vector3(0.08, 0.35, -0.93).normalize(),
      glowSize: 0.28,
      cloudDensity: 0.66,
      cloudSpeed: 0.038,
    });
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. Scorched Volcanic Basalt Battlefield + Magma Chasm Trench
    const groundGeom = this.trackGeometry(new THREE.PlaneGeometry(180, 180, 56, 56));
    const pos = groundGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const r = Math.hypot(vx, vy);
      let h = 0;
      if (r > 27 && r <= 44) {
        const t = (r - 27) / 17;
        h = -Math.sin(t * Math.PI) * 5.8;
      } else if (r > 44) {
        h = (r - 44) * 0.66 + Math.sin(vx * 0.22) * Math.cos(vy * 0.19) * 2.8;
      }
      pos.setZ(i, h);
    }
    groundGeom.computeVertexNormals();

    const basaltMat = materialFactory.createBasaltStone(0x1e1616);
    this.trackMaterial(basaltMat);
    const ground = new THREE.Mesh(groundGeom, basaltMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // 2. Churning Lava Rivers surrounding the battlefield
    const lavaMat = this.createLiquidMaterial({
      colorDeep: 0x450a0a,
      colorMid: 0xdc2626,
      colorBright: 0xfde047,
      flowSpeed: 1.05,
      emissiveBoost: 1.7,
      scaleX: 7,
      scaleY: 7,
    });
    const lavaRiver = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(26.2, 54, 48)),
      lavaMat
    );
    lavaRiver.rotation.x = -Math.PI / 2;
    lavaRiver.position.y = -0.55;
    this.group.add(lavaRiver);

    const ironMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x292222,
        metalness: 0.72,
        roughness: 0.45,
      })
    );
    const magmaGlowMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );

    // 3. Massive Volcanic War Fortress across the Lava Viaduct
    const fortress = this.buildCathedralSilhouette(28, 22, 16, 7, ironMat, magmaGlowMat);
    fortress.position.set(0, 0, -64);
    this.group.add(fortress);

    // Ruined Viaduct Bridge crossing magma chasm
    const viaduct = this.buildBrokenViaduct(basaltMat);
    viaduct.position.set(0, -0.4, -36);
    this.group.add(viaduct);

    // Lava Waterfalls cascading down into the molten moat
    const centerLavaFall = new THREE.Mesh(
      this.trackGeometry(new THREE.PlaneGeometry(6.8, 18)),
      lavaMat
    );
    centerLavaFall.position.set(0, 8.2, -50);
    this.group.add(centerLavaFall);

    for (const side of [-1, 1]) {
      const sideFall = new THREE.Mesh(
        this.trackGeometry(new THREE.PlaneGeometry(4.2, 13)),
        lavaMat
      );
      sideFall.position.set(side * 28, 5.8, -42);
      sideFall.rotation.y = side * -0.42;
      this.group.add(sideFall);
      this.registerDetailObject(sideFall, 'medium');
    }

    // 4. Distant Smoking Volcano Peaks with Lava Eruption Plumes
    for (const [vx, vz, scale] of [[-48, -62, 1.1], [50, -58, 1.25]] as Array<[number, number, number]>) {
      const cone = new THREE.Mesh(
        this.trackGeometry(new THREE.ConeGeometry(16 * scale, 28 * scale, 8, 1, true)),
        basaltMat
      );
      cone.position.set(vx, 12 * scale, vz);
      this.group.add(cone);

      const plume = new THREE.Mesh(
        this.trackGeometry(new THREE.ConeGeometry(3.2 * scale, 16 * scale, 8)),
        lavaMat
      );
      plume.position.set(vx, 28 * scale, vz);
      this.group.add(plume);
      this.registerDetailObject(plume, 'medium');

      this.eruptions.push({
        mesh: plume,
        light: null,
        timer: 3 + Math.random() * 5,
        intensity: 0.4,
        baseScaleY: 1,
      });
    }

    // 5. Mountains of Planted Swords, Spears & Broken Armor (InstancedMesh)
    this.buildWeaponGraveyard(ironMat);

    // 6. Tattered Crimson War Banners & Burning Siege Wreckage
    this.buildSiegeStructures(ironMat, magmaGlowMat);
  }

  public createBossArena(): void {
    const floorMat = materialFactory.createBasaltStone(0x1b1212);
    this.trackMaterial(floorMat);
    const ironMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x332828,
        metalness: 0.74,
        roughness: 0.44,
      })
    );
    const fissureMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.65,
      })
    );

    // Scorched Battlefield Arena Plate
    const plate = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(26.8, 27.6, 0.14, 32)),
      floorMat
    );
    plate.position.y = -0.05;
    plate.receiveShadow = true;
    this.group.add(plate);

    // Glowing Volcanic Ring Fissure around combat zone
    const fissureRing = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(17.8, 18.2, 48)),
      fissureMat
    );
    fissureRing.rotation.x = -Math.PI / 2;
    fissureRing.position.y = 0.035;
    this.group.add(fissureRing);

    // Perimeter Siege Bastion Pillars & Burning Spikes (r = 23.2m with colliders)
    const pillarGeom = this.trackGeometry(new THREE.BoxGeometry(2.0, 7.6, 2.0));
    const spikeGeom = this.trackGeometry(new THREE.ConeGeometry(0.45, 2.6, 4));
    const emberMat = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0xfb923c }));

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      if (Math.abs(cos) < 0.36 && sin < -0.72) continue;

      const px = cos * 23.4;
      const pz = sin * 23.4;

      const bastion = new THREE.Mesh(pillarGeom, ironMat);
      bastion.position.set(px, 3.8, pz);
      bastion.rotation.y = -a;
      bastion.castShadow = true;
      bastion.receiveShadow = true;
      this.group.add(bastion);

      const spike = new THREE.Mesh(spikeGeom, i % 2 === 0 ? emberMat : ironMat);
      spike.position.set(px, 8.8, pz);
      this.group.add(spike);

      this.addCollider(px, pz, 1.35);
    }

    // Iron War-Throne of The Red Calamity (z = -17.8)
    const throne = new THREE.Group();
    throne.position.set(0, 0, -17.8);

    const dais = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(7.5, 0.4, 3.8)),
      floorMat
    );
    dais.position.y = 0.2;
    dais.receiveShadow = true;
    throne.add(dais);

    const seat = new THREE.Mesh(this.trackGeometry(new THREE.BoxGeometry(2.2, 1.1, 1.5)), ironMat);
    seat.position.set(0, 0.95, -0.35);
    throne.add(seat);

    const bladeGeom = this.trackGeometry(new THREE.BoxGeometry(0.22, 3.6, 0.14));
    for (let b = -3; b <= 3; b++) {
      const blade = new THREE.Mesh(bladeGeom, ironMat);
      blade.position.set(b * 0.34, 2.3 + (3 - Math.abs(b)) * 0.25, -0.95);
      blade.rotation.z = b * 0.14;
      throne.add(blade);
    }

    this.group.add(throne);
    this.addCollider(0, -18.0, 1.65);

    const magmaLight = new THREE.PointLight(0xf97316, 2.8, 26);
    magmaLight.position.set(0, 4.5, -16);
    this.group.add(magmaLight);
  }

  protected buildEnvironmentalEffects(): void {
    // 1. Falling Embers & Fierce Orange Sparks
    this.createParticleLayer({
      countUltra: 520,
      countBalanced: 300,
      countLow: 120,
      colorPrimary: 0xf97316,
      colorSecondary: 0xfde047,
      size: 0.25,
      radius: 26,
      minY: 0.2,
      maxY: 12,
      speedY: [0.45, 1.15],
      windX: 1.1,
      windZ: 0.45,
      swirl: 0.55,
      opacity: 0.88,
      additive: true,
    });

    // 2. Heavy Volcanic Ash Storm
    this.createParticleLayer({
      countUltra: 360,
      countBalanced: 200,
      countLow: 80,
      colorPrimary: 0x57534e,
      colorSecondary: 0x292524,
      size: 0.22,
      radius: 26,
      minY: 0.2,
      maxY: 11,
      speedY: [-0.9, -0.35],
      windX: 1.8,
      windZ: 0.7,
      swirl: 0.35,
      opacity: 0.6,
      additive: false,
    });
  }

  protected updateRealmAnimations(_delta: number): void {
    // 1. Tattered War Banners whipping in volcanic gale
    for (let i = 0; i < this.banners.length; i++) {
      const b = this.banners[i];
      b.mesh.rotation.x = Math.sin(this.elapsed * 4.5 + b.phase) * 0.22;
      b.mesh.rotation.z = Math.cos(this.elapsed * 3.8 + b.phase) * 0.16;
    }

    // 2. Pulsing Volcanic Eruption Plumes
    for (let i = 0; i < this.eruptions.length; i++) {
      const er = this.eruptions[i];
      er.timer -= _delta;
      if (er.timer <= 0) {
        er.timer = 4.5 + Math.random() * 5.0;
        er.intensity = 1.45;
      }
      er.intensity = Math.max(0.35, er.intensity - _delta * 0.65);
      er.mesh.scale.set(0.85 + er.intensity * 0.3, er.intensity, 0.85 + er.intensity * 0.3);
    }

    // 3. Red Storm Lightning Flashes
    this.lightningTimer -= _delta;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 4.8 + Math.random() * 6.0;
      this.lightningIntensity = 1.05;
    }
    if (this.lightningIntensity > 0) {
      this.lightningIntensity = Math.max(0, this.lightningIntensity - _delta * 3.8);
    }
    if (this.skyUniforms) {
      this.skyUniforms.uLightning.value = this.lightningIntensity;
    }
  }

  private buildBrokenViaduct(stoneMat: THREE.Material): THREE.Group {
    const g = new THREE.Group();
    const span = new THREE.Mesh(this.trackGeometry(new THREE.BoxGeometry(10, 1.2, 26)), stoneMat);
    g.add(span);

    const pierGeom = this.trackGeometry(new THREE.BoxGeometry(2.4, 14, 2.4));
    for (const pz of [-8, 0, 8]) {
      for (const px of [-3.6, 3.6]) {
        const pier = new THREE.Mesh(pierGeom, stoneMat);
        pier.position.set(px, -7, pz);
        g.add(pier);
      }
    }
    return g;
  }

  private buildWeaponGraveyard(ironMat: THREE.Material): void {
    const bladeGeom = this.trackGeometry(new THREE.BoxGeometry(0.18, 3.4, 0.06));
    const count = 110;
    const inst = new THREE.InstancedMesh(bladeGeom, ironMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (i % 5) * 0.04;
      const rad = 22.8 + (i % 7) * 1.4;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;

      dummy.position.set(x, 1.15, z);
      dummy.rotation.set(((i % 3) - 1) * 0.35, i * 1.2, ((i % 4) - 1.5) * 0.25);
      dummy.scale.setScalar(0.8 + (i % 4) * 0.35);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }

    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    this.group.add(inst);
    this.registerDetailObject(inst, 'medium');
  }

  private buildSiegeStructures(ironMat: THREE.Material, fireMat: THREE.Material): void {
    const poleGeom = this.trackGeometry(new THREE.CylinderGeometry(0.12, 0.16, 11.5, 6));
    const clothGeom = this.trackGeometry(new THREE.PlaneGeometry(2.1, 6.2));
    const bannerMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.85,
        side: THREE.DoubleSide,
      })
    );

    const bannerSpots: Array<[number, number]> = [
      [-19.5, -18],
      [19.5, -18],
      [-23.5, 6],
      [23.5, 6],
    ];
    bannerSpots.forEach(([bx, bz], idx) => {
      const pole = new THREE.Mesh(poleGeom, ironMat);
      pole.position.set(bx, 5.75, bz);
      this.group.add(pole);

      const cloth = new THREE.Mesh(clothGeom, bannerMat);
      cloth.position.set(bx, 7.6, bz + 0.3);
      this.group.add(cloth);
      this.banners.push({ mesh: cloth, phase: idx * 1.3 });
    });

    // Burning Broken Siege Catapult Silhouettes on the flanks
    const beamGeom = this.trackGeometry(new THREE.BoxGeometry(3.8, 0.65, 5.4));
    const armGeom = this.trackGeometry(new THREE.BoxGeometry(0.45, 5.2, 0.45));
    const wheelGeom = this.trackGeometry(new THREE.CylinderGeometry(1.1, 1.1, 0.4, 10));
    const fireOrbGeom = this.trackGeometry(new THREE.OctahedronGeometry(0.85, 0));

    for (const side of [-1, 1]) {
      const siege = new THREE.Group();
      siege.position.set(side * 25.5, 0.9, -11);
      siege.rotation.y = side * -0.55;

      const frame = new THREE.Mesh(beamGeom, ironMat);
      siege.add(frame);

      const arm = new THREE.Mesh(armGeom, ironMat);
      arm.position.set(0, 2.2, 0.6);
      arm.rotation.x = -0.45;
      siege.add(arm);

      for (const wx of [-2.1, 2.1]) {
        const w = new THREE.Mesh(wheelGeom, ironMat);
        w.rotation.z = Math.PI * 0.5;
        w.position.set(wx, -0.1, 0);
        siege.add(w);
      }

      const ember = new THREE.Mesh(fireOrbGeom, fireMat);
      ember.position.set(0, 4.4, 1.7);
      siege.add(ember);

      this.group.add(siege);
      this.registerDetailObject(siege, 'medium');
    }
  }

  public override dispose(): void {
    this.banners = [];
    this.eruptions = [];
    super.dispose();
  }
}
