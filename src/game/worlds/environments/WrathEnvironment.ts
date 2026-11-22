import * as THREE from 'three';
import { materialFactory } from '../../vfx/MaterialFactory';
import { OpenWorldRealmBase } from './openworld/OpenWorldRealmBase';
import { OPEN_WORLD_REALM_CONFIGS } from './openworld/OpenWorldRealmConfigs';
import { OpenWorldRealmConfig } from './openworld/OpenWorldRealmTypes';

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

export class WrathEnvironment extends OpenWorldRealmBase {
  public readonly realmId = 4;
  public readonly realmName = 'Wrath — The Burning Battlefield';

  private banners: BannerNode[] = [];
  private eruptions: EruptionNode[] = [];
  private lightningTimer: number = 4.2;
  private lightningIntensity: number = 0;

  public getOpenWorldConfig(): OpenWorldRealmConfig {
    return OPEN_WORLD_REALM_CONFIGS[4];
  }

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x160504);
    scene.fog = new THREE.FogExp2(0x290a07, 0.011);

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
      radius: 235,
    });
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. 280m x 280m Chunk-Streamed Volcanic Basalt Open World + Magma Gorge + 3 Basalt Bridges
    this.buildOpenWorldFoundation();

    const basaltMat = materialFactory.createBasaltStone(0x1e1616);
    this.trackMaterial(basaltMat);

    const lavaMat = this.createLiquidMaterial({
      colorDeep: 0x450a0a,
      colorMid: 0xdc2626,
      colorBright: 0xfde047,
      flowSpeed: 1.05,
      emissiveBoost: 1.7,
      scaleX: 7,
      scaleY: 7,
    });

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

    // 2. Massive Volcanic War Fortress crowning the Northern Caldera Bastion (z = -138)
    const fortress = this.buildCathedralSilhouette(36, 26, 18, 7, ironMat, magmaGlowMat);
    fortress.position.set(0, 0, -138);
    this.group.add(fortress);

    // Cascading Lava Falls into the Magma Chasm at z = 25
    const centerLavaFall = new THREE.Mesh(
      this.trackGeometry(new THREE.PlaneGeometry(8.5, 22)),
      lavaMat
    );
    centerLavaFall.position.set(0, 10.2, -122);
    this.group.add(centerLavaFall);

    for (const wx of [-30, 30, -82, 82]) {
      const sideFall = new THREE.Mesh(
        this.trackGeometry(new THREE.PlaneGeometry(5.2, 13)),
        lavaMat
      );
      sideFall.position.set(wx, 2.5, 25);
      this.group.add(sideFall);
      this.registerDetailObject(sideFall, 'medium');
    }

    // 3. Distant Smoking Volcano Peaks with Lava Eruption Plumes flanking the Northern Valley
    const volcanoSpecs: Array<[number, number, number]> = [
      [-86, -118, 1.35],
      [88, -114, 1.45],
      [-112, 6, 1.1],
      [112, 8, 1.15],
    ];
    for (const [vx, vz, scale] of volcanoSpecs) {
      const cone = new THREE.Mesh(
        this.trackGeometry(new THREE.ConeGeometry(18 * scale, 32 * scale, 8, 1, true)),
        basaltMat
      );
      cone.position.set(vx, 12 * scale, vz);
      this.group.add(cone);

      const plume = new THREE.Mesh(
        this.trackGeometry(new THREE.ConeGeometry(3.4 * scale, 18 * scale, 8)),
        lavaMat
      );
      plume.position.set(vx, 30 * scale, vz);
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

    // 4. Battlefield Weapon Graveyard across the War Plains & Siege Craters
    this.buildWeaponGraveyard(ironMat);

    // 5. Tattered Crimson War Banners & Burning Siege Wreckage in Siege Crater & Molten Bastion
    this.buildSiegeStructures(ironMat, magmaGlowMat);
  }

  public override createBossArena(): void {
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

    const plate = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(28.0, 29.0, 0.16, 36)),
      floorMat
    );
    plate.position.y = -0.06;
    plate.receiveShadow = true;
    this.arenaAnchorGroup.add(plate);

    const fissureRing = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(18.2, 18.6, 48)),
      fissureMat
    );
    fissureRing.rotation.x = -Math.PI / 2;
    fissureRing.position.y = 0.035;
    this.arenaAnchorGroup.add(fissureRing);

    const pillarGeom = this.trackGeometry(new THREE.BoxGeometry(2.0, 7.6, 2.0));
    const spikeGeom = this.trackGeometry(new THREE.ConeGeometry(0.45, 2.6, 4));
    const emberMat = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0xfb923c }));

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      if (Math.abs(cos) < 0.38 && (sin < -0.72 || sin > 0.72)) continue;

      const px = cos * 24.4;
      const pz = sin * 24.4;

      const bastion = new THREE.Mesh(pillarGeom, ironMat);
      bastion.position.set(px, 3.8, pz);
      bastion.rotation.y = -a;
      bastion.castShadow = true;
      bastion.receiveShadow = true;
      this.arenaAnchorGroup.add(bastion);

      const spike = new THREE.Mesh(spikeGeom, i % 2 === 0 ? emberMat : ironMat);
      spike.position.set(px, 8.8, pz);
      this.arenaAnchorGroup.add(spike);

      this.addArenaCollider(px, pz, 1.35);
    }

    // Iron War-Throne of The Red Calamity (local z = -18.5)
    const throne = new THREE.Group();
    throne.position.set(0, 0, -18.5);

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

    this.arenaAnchorGroup.add(throne);
    this.addArenaCollider(0, -18.5, 1.65);

    const magmaLight = new THREE.PointLight(0xf97316, 2.15, 28);
    magmaLight.position.set(0, 4.8, -16);
    this.arenaAnchorGroup.add(magmaLight);
  }

  protected buildEnvironmentalEffects(): void {
    this.createParticleLayer({
      countUltra: 520,
      countBalanced: 300,
      countLow: 120,
      colorPrimary: 0xf97316,
      colorSecondary: 0xfde047,
      size: 0.25,
      radius: 34,
      minY: 0.2,
      maxY: 13,
      speedY: [0.45, 1.15],
      windX: 1.1,
      windZ: 0.45,
      swirl: 0.55,
      opacity: 0.88,
      additive: true,
    });

    this.createParticleLayer({
      countUltra: 360,
      countBalanced: 200,
      countLow: 80,
      colorPrimary: 0x57534e,
      colorSecondary: 0x292524,
      size: 0.22,
      radius: 34,
      minY: 0.2,
      maxY: 12,
      speedY: [-0.9, -0.35],
      windX: 1.8,
      windZ: 0.7,
      swirl: 0.35,
      opacity: 0.6,
      additive: false,
    });
  }

  protected override updateRealmAnimations(delta: number, playerPos?: THREE.Vector3): void {
    this.updateOpenWorldRuntime(delta, playerPos);

    for (let i = 0; i < this.banners.length; i++) {
      const b = this.banners[i];
      b.mesh.rotation.x = Math.sin(this.elapsed * 4.5 + b.phase) * 0.22;
      b.mesh.rotation.z = Math.cos(this.elapsed * 3.8 + b.phase) * 0.16;
    }

    for (let i = 0; i < this.eruptions.length; i++) {
      const er = this.eruptions[i];
      er.timer -= delta;
      if (er.timer <= 0) {
        er.timer = 4.5 + Math.random() * 5.0;
        er.intensity = 1.45;
      }
      er.intensity = Math.max(0.35, er.intensity - delta * 0.65);
      er.mesh.scale.set(0.85 + er.intensity * 0.3, er.intensity, 0.85 + er.intensity * 0.3);
    }

    this.lightningTimer -= delta;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 4.8 + Math.random() * 6.0;
      this.lightningIntensity = 1.05;
    }
    if (this.lightningIntensity > 0) {
      this.lightningIntensity = Math.max(0, this.lightningIntensity - delta * 3.8);
    }
    if (this.skyUniforms) {
      this.skyUniforms.uLightning.value = this.lightningIntensity;
    }
  }

  private buildWeaponGraveyard(ironMat: THREE.Material): void {
    const bladeGeom = this.trackGeometry(new THREE.BoxGeometry(0.18, 3.4, 0.06));
    const count = 130;
    const inst = new THREE.InstancedMesh(bladeGeom, ironMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const zone = i % 3;
      let x: number;
      let z: number;
      if (zone === 0) {
        const a = (i / count) * Math.PI * 2;
        const rad = 25.5 + (i % 5) * 1.4;
        x = Math.cos(a) * rad;
        z = -84 + Math.sin(a) * rad;
      } else {
        const side = zone === 1 ? -1 : 1;
        x = side * (62 + ((i * 7) % 18) - 9);
        z = -15 + ((i * 11) % 24) - 12;
      }
      const y = this.getGroundHeightAt(x, z) + 1.05;
      dummy.position.set(x, y, z);
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
      [-20.5, -102],
      [20.5, -102],
      [-23.5, -76],
      [23.5, -76],
      [-60, -14],
      [60, -16],
      [-9, 54],
      [9, 54],
    ];
    bannerSpots.forEach(([bx, bz], idx) => {
      const by = this.getGroundHeightAt(bx, bz);
      const pole = new THREE.Mesh(poleGeom, ironMat);
      pole.position.set(bx, by + 5.75, bz);
      this.group.add(pole);

      const cloth = new THREE.Mesh(clothGeom, bannerMat);
      cloth.position.set(bx, by + 7.6, bz + 0.3);
      this.group.add(cloth);
      this.banners.push({ mesh: cloth, phase: idx * 1.3 });
    });

    // Burning Broken Siege Catapult Silhouettes near Siege Crater & Molten Bastion
    const beamGeom = this.trackGeometry(new THREE.BoxGeometry(3.8, 0.65, 5.4));
    const armGeom = this.trackGeometry(new THREE.BoxGeometry(0.45, 5.2, 0.45));
    const wheelGeom = this.trackGeometry(new THREE.CylinderGeometry(1.1, 1.1, 0.4, 10));
    const fireOrbGeom = this.trackGeometry(new THREE.OctahedronGeometry(0.85, 0));

    const siegeSpots: Array<[number, number, number]> = [
      [-86, -8, 0.55],
      [86, -10, -0.55],
      [-28, -94, 0.45],
      [28, -94, -0.45],
    ];
    for (const [sx, sz, rotY] of siegeSpots) {
      const siege = new THREE.Group();
      const sy = this.getGroundHeightAt(sx, sz) + 0.9;
      siege.position.set(sx, sy, sz);
      siege.rotation.y = rotY;

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

