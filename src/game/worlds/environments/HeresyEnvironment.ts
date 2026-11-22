import * as THREE from 'three';
import { materialFactory } from '../../vfx/MaterialFactory';
import { OpenWorldRealmBase } from './openworld/OpenWorldRealmBase';
import { OPEN_WORLD_REALM_CONFIGS } from './openworld/OpenWorldRealmConfigs';
import { OpenWorldRealmConfig } from './openworld/OpenWorldRealmTypes';

interface FloatingStructure {
  obj: THREE.Object3D;
  baseY: number;
  amp: number;
  speed: number;
  rotSpeed: number;
  phase: number;
}

export class HeresyEnvironment extends OpenWorldRealmBase {
  public readonly realmId = 5;
  public readonly realmName = 'Heresy — The Cathedral of False Salvation';

  private floaters: FloatingStructure[] = [];
  private altarLight: THREE.PointLight | null = null;
  private stainedGlassMat: THREE.MeshBasicMaterial | null = null;

  public getOpenWorldConfig(): OpenWorldRealmConfig {
    return OPEN_WORLD_REALM_CONFIGS[5];
  }

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x0d0614);
    scene.fog = new THREE.FogExp2(0x1f0a1f, 0.011);

    this.createSkyDome({
      zenithColor: 0x0c0516,
      midColor: 0x361033,
      horizonColor: 0x831843,
      cloudColor: 0x260924,
      glowColor: 0xf43f5e,
      glowDirection: new THREE.Vector3(0, 0.35, -0.94).normalize(),
      glowSize: 0.25,
      cloudDensity: 0.62,
      cloudSpeed: 0.024,
      starIntensity: 0.35,
      radius: 235,
    });
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. 280m x 280m Chunk-Streamed Black-Marble Open World + Abyssal Nave + 3 Marble Bridges
    this.buildOpenWorldFoundation();

    const blackMarbleMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x13101c,
        roughness: 0.32,
        metalness: 0.28,
      })
    );
    const paleStoneMat = materialFactory.createBasaltStone(0x474a59);
    this.trackMaterial(paleStoneMat);

    // 2. Burning Crimson Stained Glass Material
    const stainedTex = this.createStainedGlassTexture();
    const stainedMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        map: stainedTex,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
      })
    );
    this.stainedGlassMat = stainedMat;

    // 3. Towering Main Black-Marble Cathedral crowning the Northern High Cathedral (z = -138)
    const mainCathedral = this.buildCathedralSilhouette(34, 28, 18, 9, blackMarbleMat, stainedMat);
    mainCathedral.position.set(0, -1, -138);
    this.group.add(mainCathedral);

    // 4. Upside-Down Hanging Cathedrals & Floating Churches suspended across the open valley
    const invertedSpecs: Array<[number, number, number, number, number]> = [
      [-38, 36, -124, 0.85, 0.3],
      [38, 38, -122, 0.88, -0.4],
      [-68, 32, -26, 0.68, 0.8],
      [68, 33, -24, 0.72, -0.7],
      [0, 44, -132, 0.95, 0.0],
      [-44, 30, 38, 0.62, 0.4],
      [44, 31, 40, 0.62, -0.5],
    ];
    invertedSpecs.forEach(([ix, iy, iz, sc, ry], idx) => {
      const inv = this.buildCathedralSilhouette(14, 16, 10, 5, blackMarbleMat, stainedMat);
      inv.rotation.x = Math.PI;
      inv.rotation.y = ry;
      inv.scale.setScalar(sc);
      inv.position.set(ix, iy, iz);
      this.group.add(inv);
      if (idx >= 4) this.registerDetailObject(inv, 'medium');
      this.floaters.push({
        obj: inv,
        baseY: iy,
        amp: 0.9,
        speed: 0.75 + idx * 0.12,
        rotSpeed: 0.04 * (idx % 2 === 0 ? 1 : -1),
        phase: idx * 1.4,
      });
    });

    // 5. Floating Staircases flanking the High Cathedral Approach
    const stepGeom = this.trackGeometry(new THREE.BoxGeometry(3.8, 0.45, 1.4));
    for (const side of [-1, 1]) {
      const stairGroup = new THREE.Group();
      for (let s = 0; s < 7; s++) {
        const step = new THREE.Mesh(stepGeom, paleStoneMat);
        step.position.set(0, s * 0.85, -s * 1.35);
        stairGroup.add(step);
      }
      stairGroup.position.set(side * 34, 3.5, -56);
      stairGroup.rotation.y = side * -0.45;
      this.group.add(stairGroup);
      this.registerDetailObject(stairGroup, 'medium');
      this.floaters.push({
        obj: stairGroup,
        baseY: 3.5,
        amp: 0.55,
        speed: 1.1,
        rotSpeed: 0,
        phase: side * 1.7,
      });
    }

    // 6. Enormous Corrupted Winged Angel Statues flanking the Sanctum + towering idol behind altar
    for (const side of [-1, 1]) {
      const angel = this.buildCorruptedAngelStatue(blackMarbleMat, paleStoneMat, stainedMat, 1.0);
      angel.position.set(side * 20.5, 0, -21);
      angel.rotation.y = side * -0.42;
      this.arenaAnchorGroup.add(angel);
      this.addArenaCollider(side * 20.5, -21, 2.1);
    }

    const giantAngel = this.buildCorruptedAngelStatue(blackMarbleMat, paleStoneMat, stainedMat, 1.65);
    giantAngel.position.set(0, 1.5, -31);
    this.arenaAnchorGroup.add(giantAngel);
  }

  public override createBossArena(): void {
    const blackMarbleMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x100d17,
        roughness: 0.28,
        metalness: 0.34,
      })
    );
    const ashStoneMat = materialFactory.createBasaltStone(0x2d2c3b);
    this.trackMaterial(ashStoneMat);
    const crimsonSealMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xe11d48,
        transparent: true,
        opacity: 0.52,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    const plate = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(28.0, 29.0, 0.14, 36)),
      blackMarbleMat
    );
    plate.position.y = -0.05;
    plate.receiveShadow = true;
    this.arenaAnchorGroup.add(plate);

    const haloRing = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(16.6, 17.0, 48)),
      crimsonSealMat
    );
    haloRing.rotation.x = -Math.PI / 2;
    haloRing.position.y = 0.035;
    this.arenaAnchorGroup.add(haloRing);

    const baseGeom = this.trackGeometry(new THREE.BoxGeometry(2.2, 1.8, 2.2));
    const floatShaftGeom = this.trackGeometry(new THREE.CylinderGeometry(0.72, 0.82, 6.2, 8));

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      if (Math.abs(cos) < 0.38 && (sin < -0.72 || sin > 0.72)) continue;

      const px = cos * 24.4;
      const pz = sin * 24.4;

      const base = new THREE.Mesh(baseGeom, ashStoneMat);
      base.position.set(px, 0.9, pz);
      base.receiveShadow = true;
      base.castShadow = true;
      this.arenaAnchorGroup.add(base);

      const shaft = new THREE.Mesh(floatShaftGeom, blackMarbleMat);
      shaft.position.set(px, 5.6, pz);
      shaft.castShadow = true;
      this.arenaAnchorGroup.add(shaft);

      this.floaters.push({
        obj: shaft,
        baseY: 5.6,
        amp: 0.35,
        speed: 1.4 + (i % 4) * 0.25,
        rotSpeed: 0.18 * (i % 2 === 0 ? 1 : -1),
        phase: i * 0.85,
      });

      this.addArenaCollider(px, pz, 1.3);
    }

    // Saint of Ash's Suspended High Altar (local z = -18.5)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, -18.5);

    const altarDais = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(7.2, 0.38, 3.6)),
      ashStoneMat
    );
    altarDais.position.y = 0.19;
    altarDais.receiveShadow = true;
    altarGroup.add(altarDais);

    const floatingAltarSlab = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(3.8, 0.65, 1.8)),
      blackMarbleMat
    );
    floatingAltarSlab.position.set(0, 1.55, -0.45);
    floatingAltarSlab.castShadow = true;
    altarGroup.add(floatingAltarSlab);
    this.floaters.push({
      obj: floatingAltarSlab,
      baseY: 1.55,
      amp: 0.18,
      speed: 1.6,
      rotSpeed: 0,
      phase: 0.5,
    });

    this.arenaAnchorGroup.add(altarGroup);
    this.addArenaCollider(0, -18.5, 1.65);

    this.altarLight = new THREE.PointLight(0xe11d48, 1.95, 26);
    this.altarLight.position.set(0, 4.8, -16);
    this.arenaAnchorGroup.add(this.altarLight);
  }

  protected buildEnvironmentalEffects(): void {
    this.createParticleLayer({
      countUltra: 460,
      countBalanced: 260,
      countLow: 100,
      colorPrimary: 0x334155,
      colorSecondary: 0x0f172a,
      size: 0.24,
      radius: 34,
      minY: 0.2,
      maxY: 12,
      speedY: [-0.85, -0.35],
      windX: 0.35,
      windZ: 0.15,
      swirl: 0.38,
      opacity: 0.72,
      additive: false,
    });

    this.createParticleLayer({
      countUltra: 280,
      countBalanced: 160,
      countLow: 70,
      colorPrimary: 0xf43f5e,
      colorSecondary: 0xc084fc,
      size: 0.22,
      radius: 34,
      minY: 0.3,
      maxY: 12.5,
      speedY: [0.35, 0.85],
      windX: -0.1,
      windZ: 0.1,
      swirl: 0.52,
      opacity: 0.82,
      additive: true,
    });

    const fragGeom = this.trackGeometry(new THREE.OctahedronGeometry(0.45, 0));
    const fragMat = materialFactory.createBasaltStone(0x475569);
    this.trackMaterial(fragMat);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const rad = 19 + (i % 3) * 3.5;
      const m = new THREE.Mesh(fragGeom, fragMat);
      const by = 2.8 + (i % 4) * 1.4;
      m.position.set(Math.cos(a) * rad, by, Math.sin(a) * rad);
      this.arenaAnchorGroup.add(m);
      if (i >= 8) this.registerDetailObject(m, 'high');
      this.floaters.push({
        obj: m,
        baseY: by,
        amp: 0.65,
        speed: 1.1 + (i % 3) * 0.35,
        rotSpeed: 0.7,
        phase: i * 0.9,
      });
    }
  }

  protected override updateRealmAnimations(delta: number, playerPos?: THREE.Vector3): void {
    this.updateOpenWorldRuntime(delta, playerPos);

    for (let i = 0; i < this.floaters.length; i++) {
      const f = this.floaters[i];
      f.obj.position.y = f.baseY + Math.sin(this.elapsed * f.speed + f.phase) * f.amp;
      if (f.rotSpeed !== 0) {
        f.obj.rotation.y += delta * f.rotSpeed;
      }
    }

    if (this.stainedGlassMat) {
      this.stainedGlassMat.opacity = 0.82 + Math.sin(this.elapsed * 3.4) * 0.14;
    }

    if (this.altarLight) {
      this.altarLight.intensity = 1.85 + Math.sin(this.elapsed * 2.5) * 0.4;
    }
  }

  private buildCorruptedAngelStatue(
    marbleMat: THREE.Material,
    stoneMat: THREE.Material,
    glowMat: THREE.Material,
    scale: number
  ): THREE.Group {
    const g = new THREE.Group();
    g.scale.setScalar(scale);

    const plinth = new THREE.Mesh(this.trackGeometry(new THREE.BoxGeometry(3.8, 3.8, 3.8)), stoneMat);
    plinth.position.y = 1.9;
    g.add(plinth);

    const torso = new THREE.Mesh(this.trackGeometry(new THREE.CylinderGeometry(0.95, 1.55, 7.6, 8)), marbleMat);
    torso.position.y = 7.6;
    torso.castShadow = true;
    g.add(torso);

    const head = new THREE.Mesh(this.trackGeometry(new THREE.SphereGeometry(0.75, 8, 8)), stoneMat);
    head.position.y = 12.1;
    g.add(head);

    const halo = new THREE.Mesh(this.trackGeometry(new THREE.TorusGeometry(1.35, 0.1, 6, 20)), glowMat);
    halo.position.set(0, 12.5, -0.4);
    g.add(halo);

    // Swept Corrupted Feathered Wings
    const wingGeom = this.trackGeometry(new THREE.BoxGeometry(4.8, 2.8, 0.35));
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(wingGeom, marbleMat);
      wing.position.set(side * 2.7, 9.8, -0.7);
      wing.rotation.z = side * 0.45;
      wing.rotation.y = side * -0.25;
      g.add(wing);
    }

    return g;
  }

  private createStainedGlassTexture(): THREE.CanvasTexture {
    const w = 128;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#fb7185');
      grad.addColorStop(0.5, '#e11d48');
      grad.addColorStop(1, '#6b21a8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 4;
      for (let y = 32; y < h; y += 44) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 0);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.trackTexture(tex);
    return tex;
  }

  public override dispose(): void {
    this.floaters = [];
    this.altarLight = null;
    this.stainedGlassMat = null;
    super.dispose();
  }
}
