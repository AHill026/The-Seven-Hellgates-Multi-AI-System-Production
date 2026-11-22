import * as THREE from 'three';
import { materialFactory } from '../../vfx/MaterialFactory';
import { OpenWorldRealmBase } from './openworld/OpenWorldRealmBase';
import { OPEN_WORLD_REALM_CONFIGS } from './openworld/OpenWorldRealmConfigs';
import { OpenWorldRealmConfig } from './openworld/OpenWorldRealmTypes';

interface ShimmerPlane {
  mesh: THREE.Mesh;
  baseY: number;
  phase: number;
}

export class GreedEnvironment extends OpenWorldRealmBase {
  public readonly realmId = 3;
  public readonly realmName = 'Greed — The Gilded Empire';

  private skyHaloGroup: THREE.Group | null = null;
  private shimmerPlanes: ShimmerPlane[] = [];
  private palaceLight: THREE.PointLight | null = null;

  public getOpenWorldConfig(): OpenWorldRealmConfig {
    return OPEN_WORLD_REALM_CONFIGS[3];
  }

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x160f05);
    scene.fog = new THREE.FogExp2(0x261a08, 0.01);

    const sunDir = new THREE.Vector3(0, 0.45, -0.89).normalize();
    this.createSkyDome({
      zenithColor: 0x1c1206,
      midColor: 0x452b09,
      horizonColor: 0x925e12,
      cloudColor: 0x5c380c,
      glowColor: 0xfbbf24,
      glowDirection: sunDir,
      glowSize: 0.25,
      cloudDensity: 0.54,
      cloudSpeed: 0.022,
      radius: 235,
    });
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. 280m x 280m Chunk-Streamed Imperial Gold & Obsidian Open World + Molten Gold Canal
    this.buildOpenWorldFoundation();

    const moltenGoldMat = this.createLiquidMaterial({
      colorDeep: 0x5c2d06,
      colorMid: 0xd97706,
      colorBright: 0xfef08a,
      flowSpeed: 0.9,
      emissiveBoost: 1.55,
      scaleX: 7,
      scaleY: 7,
    });

    const goldMetalMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xb8660a,
        metalness: 0.86,
        roughness: 0.34,
        emissive: 0x451a03,
        emissiveIntensity: 0.1,
      })
    );
    const bronzeMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x784414,
        metalness: 0.78,
        roughness: 0.36,
      })
    );
    const moltenWindowMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({ color: 0xe09f1f })
    );

    // 2. Massive Gold-Plated Gothic Palace Citadel & Blazing Sky Sun-Halo Ring behind the Northern Sanctum
    const mainPalace = this.buildCathedralSilhouette(36, 28, 18, 9, goldMetalMat, moltenWindowMat);
    mainPalace.position.set(0, 0, -138);
    this.group.add(mainPalace);

    const westVault = this.buildCathedralSilhouette(18, 17, 12, 5, bronzeMat, moltenWindowMat);
    westVault.position.set(-76, 1.5, -116);
    westVault.rotation.y = 0.45;
    this.group.add(westVault);
    this.registerDetailObject(westVault, 'medium');

    const eastVault = this.buildCathedralSilhouette(18, 18, 12, 5, bronzeMat, moltenWindowMat);
    eastVault.position.set(76, 1.5, -116);
    eastVault.rotation.y = -0.45;
    this.group.add(eastVault);
    this.registerDetailObject(eastVault, 'medium');

    // Towering Treasury Vault Keeps overlooking West & East Mini-Boss Arenas
    const westOutpostKeep = this.buildCathedralSilhouette(13, 14, 10, 3, bronzeMat, moltenWindowMat);
    westOutpostKeep.position.set(-96, 2.5, -24);
    westOutpostKeep.rotation.y = 0.75;
    this.group.add(westOutpostKeep);
    this.registerDetailObject(westOutpostKeep, 'medium');

    const eastOutpostKeep = this.buildCathedralSilhouette(13, 14, 10, 3, bronzeMat, moltenWindowMat);
    eastOutpostKeep.position.set(96, 2.5, -26);
    eastOutpostKeep.rotation.y = -0.75;
    this.group.add(eastOutpostKeep);
    this.registerDetailObject(eastOutpostKeep, 'medium');

    // Monumental Hovering Golden Sun-Halo Ring above the Northern Palace Spires
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 64, -142);
    haloGroup.rotation.x = Math.PI * 0.42;
    const outerRing = new THREE.Mesh(
      this.trackGeometry(new THREE.TorusGeometry(20, 0.85, 10, 48)),
      moltenWindowMat
    );
    const innerRing = new THREE.Mesh(
      this.trackGeometry(new THREE.TorusGeometry(13.2, 0.5, 8, 36)),
      goldMetalMat
    );
    haloGroup.add(outerRing, innerRing);
    this.group.add(haloGroup);
    this.skyHaloGroup = haloGroup;

    // 3. Molten Gold Waterfalls pouring from the Northern Palace & Chasm Banks
    const centerFall = new THREE.Mesh(
      this.trackGeometry(new THREE.PlaneGeometry(8.5, 22)),
      moltenGoldMat
    );
    centerFall.position.set(0, 10.5, -124);
    this.group.add(centerFall);

    for (const wx of [-30, 30, -82, 82]) {
      const sideFall = new THREE.Mesh(
        this.trackGeometry(new THREE.PlaneGeometry(5.2, 13)),
        moltenGoldMat
      );
      sideFall.position.set(wx, 2.6, 25);
      this.group.add(sideFall);
      this.registerDetailObject(sideFall, 'medium');
    }

    // 4. Two Monumental Robed Golden Sovereign Statues flanking the Gilded Palace Entrance
    for (const side of [-1, 1]) {
      const statue = this.buildColossalGoldenStatue(goldMetalMat, bronzeMat, moltenWindowMat);
      statue.position.set(side * 20.5, 0, -22.5);
      statue.rotation.y = side * -0.38;
      this.arenaAnchorGroup.add(statue);
      this.addArenaCollider(side * 20.5, -22.5, 2.2);
    }

    // 5. Glittering Mounds of Treasure, Gold Ingots & Coins across Vaults & Sanctum Rim
    this.buildTreasureMounds(goldMetalMat, bronzeMat);
  }

  public override createBossArena(): void {
    const obsidianMarbleMat = materialFactory.createBasaltStone(0x1b150c);
    this.trackMaterial(obsidianMarbleMat);
    const goldMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xc98a0c,
        metalness: 0.84,
        roughness: 0.34,
      })
    );
    const goldInlayMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.55,
      })
    );

    const plate = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(28.0, 29.0, 0.16, 36)),
      obsidianMarbleMat
    );
    plate.position.y = -0.06;
    plate.receiveShadow = true;
    this.arenaAnchorGroup.add(plate);

    const outerInlay = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(18.5, 18.9, 48)),
      goldInlayMat
    );
    outerInlay.rotation.x = -Math.PI / 2;
    outerInlay.position.y = 0.035;
    this.arenaAnchorGroup.add(outerInlay);

    const innerInlay = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(9.2, 9.45, 36)),
      goldInlayMat
    );
    innerInlay.rotation.x = -Math.PI / 2;
    innerInlay.position.y = 0.035;
    this.arenaAnchorGroup.add(innerInlay);

    const colGeom = this.trackGeometry(new THREE.CylinderGeometry(0.82, 1.05, 9.2, 10));
    const plinthGeom = this.trackGeometry(new THREE.BoxGeometry(2.5, 0.85, 2.5));
    const capGeom = this.trackGeometry(new THREE.BoxGeometry(2.4, 0.7, 2.4));

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      if (Math.abs(cos) < 0.38 && (sin < -0.72 || sin > 0.72)) continue;

      const px = cos * 24.4;
      const pz = sin * 24.4;

      const plinth = new THREE.Mesh(plinthGeom, obsidianMarbleMat);
      plinth.position.set(px, 0.42, pz);
      plinth.receiveShadow = true;
      plinth.castShadow = true;
      this.arenaAnchorGroup.add(plinth);

      const col = new THREE.Mesh(colGeom, goldMat);
      col.position.set(px, 5.0, pz);
      col.castShadow = true;
      col.receiveShadow = true;
      this.arenaAnchorGroup.add(col);

      const cap = new THREE.Mesh(capGeom, goldMat);
      cap.position.set(px, 9.8, pz);
      this.arenaAnchorGroup.add(cap);

      this.addArenaCollider(px, pz, 1.35);
    }

    // Imperial Golden Throne of the Gilded Tyrant (local z = -18.5)
    const throne = new THREE.Group();
    throne.position.set(0, 0, -18.5);

    const dais = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(7.8, 0.42, 3.8)),
      obsidianMarbleMat
    );
    dais.position.y = 0.21;
    dais.receiveShadow = true;
    throne.add(dais);

    const throneBody = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(2.3, 1.15, 1.5)),
      goldMat
    );
    throneBody.position.set(0, 0.95, -0.35);
    throneBody.castShadow = true;
    throne.add(throneBody);

    const sunBackrest = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(1.75, 1.4, 0.35, 16)),
      goldMat
    );
    sunBackrest.rotation.x = Math.PI * 0.5;
    sunBackrest.position.set(0, 2.55, -0.95);
    sunBackrest.castShadow = true;
    throne.add(sunBackrest);

    this.arenaAnchorGroup.add(throne);
    this.addArenaCollider(0, -18.5, 1.65);

    this.palaceLight = new THREE.PointLight(0xfbbf24, 2.1, 30);
    this.palaceLight.position.set(0, 5.5, -16);
    this.arenaAnchorGroup.add(this.palaceLight);
  }

  protected buildEnvironmentalEffects(): void {
    this.createParticleLayer({
      countUltra: 560,
      countBalanced: 320,
      countLow: 120,
      colorPrimary: 0xfde047,
      colorSecondary: 0xf59e0b,
      size: 0.22,
      radius: 34,
      minY: 0.2,
      maxY: 12.5,
      speedY: [0.22, 0.65],
      windX: 0.35,
      windZ: 0.2,
      swirl: 0.42,
      opacity: 0.82,
      additive: true,
    });

    const shimmerTex = this.createMistTexture(251, 191, 36);
    const shimmerGeom = this.trackGeometry(new THREE.PlaneGeometry(22, 8));
    for (let i = -3; i <= 3; i++) {
      const mat = this.trackMaterial(
        new THREE.MeshBasicMaterial({
          map: shimmerTex,
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      const m = new THREE.Mesh(shimmerGeom, mat);
      m.position.set(i * 32, 1.4, 36);
      this.group.add(m);
      if (Math.abs(i) >= 2) this.registerDetailObject(m, 'high');
      this.shimmerPlanes.push({ mesh: m, baseY: 1.4, phase: (i + 3) * 0.9 });
    }
  }

  protected override updateRealmAnimations(delta: number, playerPos?: THREE.Vector3): void {
    this.updateOpenWorldRuntime(delta, playerPos);

    if (this.skyHaloGroup) {
      this.skyHaloGroup.rotation.z += delta * 0.14;
    }

    for (let i = 0; i < this.shimmerPlanes.length; i++) {
      const sp = this.shimmerPlanes[i];
      sp.mesh.position.y = sp.baseY + Math.sin(this.elapsed * 2.2 + sp.phase) * 0.55;
      const mat = sp.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.16 + Math.sin(this.elapsed * 3.0 + sp.phase) * 0.06;
    }

    if (this.palaceLight) {
      this.palaceLight.intensity = 1.9 + Math.sin(this.elapsed * 2.8) * 0.35;
    }
  }

  private buildColossalGoldenStatue(
    goldMat: THREE.Material,
    bronzeMat: THREE.Material,
    glowMat: THREE.Material
  ): THREE.Group {
    const g = new THREE.Group();
    const pedestal = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(4.2, 3.6, 4.2)),
      bronzeMat
    );
    pedestal.position.y = 1.8;
    g.add(pedestal);

    const robe = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(1.1, 1.9, 8.8, 8)),
      goldMat
    );
    robe.position.y = 8.0;
    robe.castShadow = true;
    g.add(robe);

    const hood = new THREE.Mesh(
      this.trackGeometry(new THREE.ConeGeometry(1.15, 2.4, 7)),
      goldMat
    );
    hood.position.set(0, 13.4, 0.15);
    g.add(hood);

    const staff = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(0.14, 0.14, 12.5, 6)),
      bronzeMat
    );
    staff.position.set(1.65, 9.2, 0.85);
    g.add(staff);

    const orb = new THREE.Mesh(this.trackGeometry(new THREE.OctahedronGeometry(0.6, 0)), glowMat);
    orb.position.set(1.65, 15.6, 0.85);
    g.add(orb);

    return g;
  }

  private buildTreasureMounds(goldMat: THREE.Material, bronzeMat: THREE.Material): void {
    const chestGeom = this.trackGeometry(new THREE.BoxGeometry(1.1, 0.75, 0.75));
    const coinGeom = this.trackGeometry(new THREE.CylinderGeometry(0.32, 0.36, 0.16, 8));

    const moundCount = 48;
    const chestInst = new THREE.InstancedMesh(chestGeom, bronzeMat, moundCount);
    const coinInst = new THREE.InstancedMesh(coinGeom, goldMat, moundCount * 3);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < moundCount; i++) {
      let x: number;
      let z: number;
      if (i < 30) {
        const a = (i / 30) * Math.PI * 2;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const rad = Math.abs(cos) < 0.38 && (sin < -0.7 || sin > 0.7) ? 28.5 : 25.8 + (i % 3) * 0.9;
        x = cos * rad;
        z = -84 + sin * rad;
      } else {
        const side = i % 2 === 0 ? -1 : 1;
        const idx = i - 30;
        x = side * (66 + (idx % 5) * 3.5);
        z = -15 + ((idx % 4) - 1.5) * 4.2;
      }

      const y = this.getGroundHeightAt(x, z);
      dummy.position.set(x, y + 0.35, z);
      dummy.rotation.set((i % 3) * 0.08, i * 1.1, ((i % 2) - 0.5) * 0.12);
      dummy.scale.setScalar(0.85 + (i % 3) * 0.25);
      dummy.updateMatrix();
      chestInst.setMatrixAt(i, dummy.matrix);

      for (let c = 0; c < 3; c++) {
        dummy.position.set(x + (c - 1) * 0.65, y + 0.1 + (c % 2) * 0.18, z + (c === 1 ? 0.55 : -0.35));
        dummy.rotation.set(0.15 * c, i + c, 0.1);
        dummy.scale.setScalar(1.2 + (c % 2) * 0.5);
        dummy.updateMatrix();
        coinInst.setMatrixAt(i * 3 + c, dummy.matrix);
      }
    }

    chestInst.instanceMatrix.needsUpdate = true;
    coinInst.instanceMatrix.needsUpdate = true;
    chestInst.computeBoundingSphere();
    coinInst.computeBoundingSphere();
    this.group.add(chestInst, coinInst);
    this.registerDetailObject(chestInst, 'medium');
  }

  public override dispose(): void {
    this.skyHaloGroup = null;
    this.shimmerPlanes = [];
    this.palaceLight = null;
    super.dispose();
  }
}

