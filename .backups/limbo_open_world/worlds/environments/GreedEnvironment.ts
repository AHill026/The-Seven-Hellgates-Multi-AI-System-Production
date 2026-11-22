import * as THREE from 'three';
import { materialFactory } from '../../vfx/MaterialFactory';
import { BaseRealmEnvironment } from './BaseRealmEnvironment';

interface ShimmerPlane {
  mesh: THREE.Mesh;
  baseY: number;
  phase: number;
}

export class GreedEnvironment extends BaseRealmEnvironment {
  public readonly realmId = 3;
  public readonly realmName = 'Greed — The Gilded Empire';

  private skyHaloGroup: THREE.Group | null = null;
  private shimmerPlanes: ShimmerPlane[] = [];
  private palaceLight: THREE.PointLight | null = null;

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x160f05);
    scene.fog = new THREE.FogExp2(0x261a08, 0.016);

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
    });
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. Imperial Obsidian-Bronze Basin with Molten Canal Moat
    const groundGeom = this.trackGeometry(new THREE.PlaneGeometry(180, 180, 56, 56));
    const pos = groundGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const r = Math.hypot(vx, vy);
      let h = 0;
      if (r > 27 && r <= 43) {
        const t = (r - 27) / 16;
        h = -Math.sin(t * Math.PI) * 5.0;
      } else if (r > 43) {
        h = (r - 43) * 0.58 + Math.sin(vx * 0.18) * Math.cos(vy * 0.18) * 2.0;
      }
      pos.setZ(i, h);
    }
    groundGeom.computeVertexNormals();

    const terrainMat = materialFactory.createBasaltStone(0x21190c);
    this.trackMaterial(terrainMat);
    const ground = new THREE.Mesh(groundGeom, terrainMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // 2. River of Molten Gold surrounding the Imperial Courtyard
    const moltenGoldMat = this.createLiquidMaterial({
      colorDeep: 0x5c2d06,
      colorMid: 0xd97706,
      colorBright: 0xfef08a,
      flowSpeed: 0.9,
      emissiveBoost: 1.55,
      scaleX: 7,
      scaleY: 7,
    });
    const goldRiver = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(26.2, 52, 48)),
      moltenGoldMat
    );
    goldRiver.rotation.x = -Math.PI / 2;
    goldRiver.position.y = -0.5;
    this.group.add(goldRiver);

    const goldMetalMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.88,
        roughness: 0.24,
        emissive: 0x451a03,
        emissiveIntensity: 0.35,
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
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );

    // 3. Massive Gold-Plated Gothic Palace Citadel & Blazing Sky Sun-Halo Ring
    const mainPalace = this.buildCathedralSilhouette(28, 22, 16, 9, goldMetalMat, moltenWindowMat);
    mainPalace.position.set(0, 0, -64);
    this.group.add(mainPalace);

    const westVault = this.buildCathedralSilhouette(16, 15, 11, 5, bronzeMat, moltenWindowMat);
    westVault.position.set(-44, 1, -46);
    westVault.rotation.y = 0.45;
    this.group.add(westVault);
    this.registerDetailObject(westVault, 'medium');

    const eastVault = this.buildCathedralSilhouette(16, 16, 11, 5, bronzeMat, moltenWindowMat);
    eastVault.position.set(44, 1, -46);
    eastVault.rotation.y = -0.45;
    this.group.add(eastVault);
    this.registerDetailObject(eastVault, 'medium');

    // Monumental Hovering Golden Sun-Halo Ring above the Palace Spires
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 56, -72);
    haloGroup.rotation.x = Math.PI * 0.42;
    const outerRing = new THREE.Mesh(
      this.trackGeometry(new THREE.TorusGeometry(16, 0.75, 10, 48)),
      moltenWindowMat
    );
    const innerRing = new THREE.Mesh(
      this.trackGeometry(new THREE.TorusGeometry(10.5, 0.45, 8, 36)),
      goldMetalMat
    );
    haloGroup.add(outerRing, innerRing);
    this.group.add(haloGroup);
    this.skyHaloGroup = haloGroup;

    // 4. Molten Metal Waterfalls pouring from the Palace Vaults into the Golden River
    const centerFall = new THREE.Mesh(
      this.trackGeometry(new THREE.PlaneGeometry(7.2, 20)),
      moltenGoldMat
    );
    centerFall.position.set(0, 9.2, -52);
    this.group.add(centerFall);

    for (const side of [-1, 1]) {
      const sideFall = new THREE.Mesh(
        this.trackGeometry(new THREE.PlaneGeometry(4.5, 14)),
        moltenGoldMat
      );
      sideFall.position.set(side * 24, 6.2, -46);
      sideFall.rotation.y = side * -0.35;
      this.group.add(sideFall);
      this.registerDetailObject(sideFall, 'medium');
    }

    // 5. Two Monumental Robed Golden Sovereign Statues flanking the Imperial Steps
    for (const side of [-1, 1]) {
      const statue = this.buildColossalGoldenStatue(goldMetalMat, bronzeMat, moltenWindowMat);
      statue.position.set(side * 19.5, 0, -21.5);
      statue.rotation.y = side * -0.38;
      this.group.add(statue);
      this.addCollider(side * 19.5, -21.5, 2.2);
    }

    // 6. Glittering Mounds of Treasure, Gold Ingots & Coins (InstancedMesh)
    this.buildTreasureMounds(goldMetalMat, bronzeMat);
  }

  public createBossArena(): void {
    const obsidianMarbleMat = materialFactory.createBasaltStone(0x1b150c);
    this.trackMaterial(obsidianMarbleMat);
    const goldMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xeab308,
        metalness: 0.86,
        roughness: 0.25,
      })
    );
    const goldInlayMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.55,
      })
    );

    // Gigantic Imperial Marble Courtyard Floor Plate
    const plate = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(26.8, 27.6, 0.14, 32)),
      obsidianMarbleMat
    );
    plate.position.y = -0.05;
    plate.receiveShadow = true;
    this.group.add(plate);

    // Golden Sunburst Ring Inlays on Arena Floor
    const outerInlay = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(17.5, 17.9, 48)),
      goldInlayMat
    );
    outerInlay.rotation.x = -Math.PI / 2;
    outerInlay.position.y = 0.035;
    this.group.add(outerInlay);

    const innerInlay = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(8.8, 9.05, 36)),
      goldInlayMat
    );
    innerInlay.rotation.x = -Math.PI / 2;
    innerInlay.position.y = 0.035;
    this.group.add(innerInlay);

    // Perimeter Golden Imperial Pillars (r = 23.2m with colliders)
    const colGeom = this.trackGeometry(new THREE.CylinderGeometry(0.82, 1.05, 9.2, 10));
    const plinthGeom = this.trackGeometry(new THREE.BoxGeometry(2.5, 0.85, 2.5));
    const capGeom = this.trackGeometry(new THREE.BoxGeometry(2.4, 0.7, 2.4));

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      if (Math.abs(cos) < 0.36 && sin < -0.72) continue;

      const px = cos * 23.4;
      const pz = sin * 23.4;

      const plinth = new THREE.Mesh(plinthGeom, obsidianMarbleMat);
      plinth.position.set(px, 0.42, pz);
      plinth.receiveShadow = true;
      plinth.castShadow = true;
      this.group.add(plinth);

      const col = new THREE.Mesh(colGeom, goldMat);
      col.position.set(px, 5.0, pz);
      col.castShadow = true;
      col.receiveShadow = true;
      this.group.add(col);

      const cap = new THREE.Mesh(capGeom, goldMat);
      cap.position.set(px, 9.8, pz);
      this.group.add(cap);

      this.addCollider(px, pz, 1.35);
    }

    // Imperial Golden Throne of the Gilded Tyrant (z = -17.8)
    const throne = new THREE.Group();
    throne.position.set(0, 0, -17.8);

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

    this.group.add(throne);
    this.addCollider(0, -18.0, 1.65);

    this.palaceLight = new THREE.PointLight(0xfbbf24, 2.8, 28);
    this.palaceLight.position.set(0, 5.2, -16);
    this.group.add(this.palaceLight);
  }

  protected buildEnvironmentalEffects(): void {
    // 1. Floating Gold Dust & Molten Embers
    this.createParticleLayer({
      countUltra: 560,
      countBalanced: 320,
      countLow: 120,
      colorPrimary: 0xfde047,
      colorSecondary: 0xf59e0b,
      size: 0.22,
      radius: 26,
      minY: 0.2,
      maxY: 11.5,
      speedY: [0.22, 0.65],
      windX: 0.35,
      windZ: 0.2,
      swirl: 0.42,
      opacity: 0.82,
      additive: true,
    });

    // 2. Heat Shimmer & Golden Dust Storm Planes hovering over Molten Moat
    const shimmerTex = this.createMistTexture(251, 191, 36);
    const shimmerGeom = this.trackGeometry(new THREE.PlaneGeometry(14, 7));
    for (let i = 0; i < 8; i++) {
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
      const a = (i / 8) * Math.PI * 2;
      const m = new THREE.Mesh(shimmerGeom, mat);
      m.position.set(Math.cos(a) * 28.5, 2.6, Math.sin(a) * 28.5);
      m.lookAt(0, 2.6, 0);
      this.group.add(m);
      if (i >= 4) this.registerDetailObject(m, 'high');
      this.shimmerPlanes.push({ mesh: m, baseY: 2.6, phase: i * 0.9 });
    }
  }

  protected updateRealmAnimations(delta: number): void {
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
      this.palaceLight.intensity = 2.6 + Math.sin(this.elapsed * 2.8) * 0.45;
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

    const moundCount = 42;
    const chestInst = new THREE.InstancedMesh(chestGeom, bronzeMat, moundCount);
    const coinInst = new THREE.InstancedMesh(coinGeom, goldMat, moundCount * 3);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < moundCount; i++) {
      const a = (i / moundCount) * Math.PI * 2;
      // Keep north & south corridor clear
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const rad = Math.abs(cos) < 0.35 && sin < -0.7 ? 29.5 : 24.8 + (i % 3) * 0.9;
      const x = cos * rad;
      const z = sin * rad;

      dummy.position.set(x, 0.35, z);
      dummy.rotation.set((i % 3) * 0.08, a * 1.9, ((i % 2) - 0.5) * 0.12);
      dummy.scale.setScalar(0.85 + (i % 3) * 0.25);
      dummy.updateMatrix();
      chestInst.setMatrixAt(i, dummy.matrix);

      for (let c = 0; c < 3; c++) {
        dummy.position.set(x + (c - 1) * 0.65, 0.1 + (c % 2) * 0.18, z + (c === 1 ? 0.55 : -0.35));
        dummy.rotation.set(0.15 * c, a + c, 0.1);
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
