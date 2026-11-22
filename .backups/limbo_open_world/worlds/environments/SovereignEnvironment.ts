import * as THREE from 'three';
import { BaseRealmEnvironment } from './BaseRealmEnvironment';

interface CelestialOrbiter {
  obj: THREE.Object3D;
  baseY: number;
  bobAmp: number;
  bobSpeed: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  phase: number;
}

interface EnergyWave {
  mesh: THREE.Mesh;
  progress: number;
  speed: number;
}

export class SovereignEnvironment extends BaseRealmEnvironment {
  public readonly realmId = 7;
  public readonly realmName = 'Sovereign — The Throne Beyond Creation';

  private orbiters: CelestialOrbiter[] = [];
  private waves: EnergyWave[] = [];
  private horizonRings: THREE.Mesh[] = [];
  private eyePupilMesh: THREE.Mesh | null = null;
  private debrisInstanced: THREE.InstancedMesh | null = null;
  private debrisCount: number = 90;
  private debrisData: Array<{ angle: number; radius: number; y: number; speed: number; scale: number; phase: number }> = [];
  private dummy = new THREE.Object3D();
  private lightningTimer: number = 4.0;
  private lightningIntensity: number = 0;

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x05030e);
    scene.fog = new THREE.FogExp2(0x130c2b, 0.011);

    const eyeDir = new THREE.Vector3(0, 0.34, -0.94).normalize();
    this.createSkyDome({
      zenithColor: 0x04030d,
      midColor: 0x1b1240,
      horizonColor: 0x4c2d7a,
      cloudColor: 0x2c1b5e,
      glowColor: 0xe9d5ff,
      glowDirection: eyeDir,
      glowSize: 0.32,
      cloudDensity: 0.58,
      cloudSpeed: 0.02,
      starIntensity: 1.0,
      voidSwirl: 0.72,
    });

    // Colossal White-Eyed God Horizon Eye + Swirling Cosmic Halo beyond the arena
    this.buildColossalHorizonEye(eyeDir);
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. Sea of Astral Clouds far beneath the floating threshold island (NO hell-canyon terrain!)
    const cloudSeaTex = this.createMistTexture(148, 130, 215);
    const cloudSeaMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        map: cloudSeaTex,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    );
    const cloudGeom = this.trackGeometry(new THREE.PlaneGeometry(58, 58));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const dist = 36 + (i % 3) * 18;
      const c = new THREE.Mesh(cloudGeom, cloudSeaMat);
      c.rotation.x = -Math.PI / 2;
      c.position.set(Math.cos(a) * dist, -12 - (i % 3) * 3.5, Math.sin(a) * dist);
      this.group.add(c);
    }

    const whiteMarbleMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.26,
        metalness: 0.16,
      })
    );
    const obsidianMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x0b0c14,
        roughness: 0.2,
        metalness: 0.75,
      })
    );
    const silverTrimMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        roughness: 0.22,
        metalness: 0.85,
      })
    );
    const violetGlowMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.86,
      })
    );

    // 2. Broken Celestial White-Marble Bridge approaching from the North beyond the Hellgate
    const bridge = new THREE.Group();
    bridge.position.set(0, -0.4, -36);
    for (let s = 0; s < 5; s++) {
      const seg = new THREE.Mesh(
        this.trackGeometry(new THREE.BoxGeometry(8.5 - s * 0.4, 0.75, 4.2)),
        whiteMarbleMat
      );
      seg.position.set(0, s * 0.65, -s * 5.2);
      bridge.add(seg);
    }
    this.group.add(bridge);

    // 3. Floating Fragments of Ancient Civilizations, White Marble Temples & Black Obsidian Towers
    const floatingIslands: Array<{ x: number; y: number; z: number; scale: number; isObsidian: boolean }> = [
      { x: -38, y: 8, z: -34, scale: 1.15, isObsidian: false },
      { x: 38, y: 10, z: -32, scale: 1.2, isObsidian: false },
      { x: -46, y: 4, z: 6, scale: 0.95, isObsidian: true },
      { x: 46, y: 5, z: 8, scale: 1.0, isObsidian: true },
      { x: -24, y: 18, z: -56, scale: 1.35, isObsidian: true },
      { x: 24, y: 19, z: -55, scale: 1.35, isObsidian: false },
      { x: -34, y: 22, z: -12, scale: 0.85, isObsidian: false },
      { x: 34, y: 24, z: -10, scale: 0.85, isObsidian: true },
    ];

    floatingIslands.forEach((isl, idx) => {
      const island = new THREE.Group();
      island.position.set(isl.x, isl.y, isl.z);

      // Inverted conical floating rock root
      const root = new THREE.Mesh(
        this.trackGeometry(new THREE.ConeGeometry(6.2 * isl.scale, 11 * isl.scale, 7)),
        isl.isObsidian ? obsidianMat : whiteMarbleMat
      );
      root.rotation.x = Math.PI;
      root.position.y = -5.5 * isl.scale;
      island.add(root);

      const deck = new THREE.Mesh(
        this.trackGeometry(new THREE.CylinderGeometry(6.4 * isl.scale, 5.8 * isl.scale, 1.0, 8)),
        whiteMarbleMat
      );
      island.add(deck);

      if (isl.isObsidian) {
        // Soaring Black Obsidian Monolith Tower
        const spire = new THREE.Mesh(
          this.trackGeometry(new THREE.BoxGeometry(2.8 * isl.scale, 16 * isl.scale, 2.8 * isl.scale)),
          obsidianMat
        );
        spire.position.y = 8.2 * isl.scale;
        island.add(spire);
      } else {
        // White Marble Ruined Gothic Colonnade Arch
        const arch = this.buildGothicArchway(7.2 * isl.scale, 10.5 * isl.scale, 1.4, whiteMarbleMat, silverTrimMat);
        arch.position.y = 0.5;
        arch.rotation.y = idx * 0.6;
        island.add(arch);
      }

      this.group.add(island);
      if (idx >= 5) this.registerDetailObject(island, 'medium');

      this.orbiters.push({
        obj: island,
        baseY: isl.y,
        bobAmp: 0.85,
        bobSpeed: 0.65 + idx * 0.08,
        rotX: 0,
        rotY: (idx % 2 === 0 ? 1 : -1) * 0.04,
        rotZ: 0,
        phase: idx * 1.15,
      });
    });

    // 4. Slowly Rotating Celestial Rings framing the Distant Gateway
    const ringGeom = this.trackGeometry(new THREE.TorusGeometry(24, 0.35, 8, 48));
    const celestialRing = new THREE.Mesh(ringGeom, violetGlowMat);
    celestialRing.position.set(0, 14, -44);
    this.group.add(celestialRing);
    this.orbiters.push({
      obj: celestialRing,
      baseY: 14,
      bobAmp: 0.3,
      bobSpeed: 0.5,
      rotX: 0.06,
      rotY: 0.08,
      rotZ: 0.14,
      phase: 0,
    });
  }

  public createBossArena(): void {
    const whiteMarbleMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.24,
        metalness: 0.18,
      })
    );
    const obsidianMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x0d0f18,
        roughness: 0.2,
        metalness: 0.78,
      })
    );
    const violetSealMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const whiteSealMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    // Suspended White Marble Arena Island Disc + Obsidian Underside Crown
    const floorDisc = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(26.8, 25.4, 0.36, 36)),
      whiteMarbleMat
    );
    floorDisc.position.y = -0.18;
    floorDisc.receiveShadow = true;
    this.group.add(floorDisc);

    const underRoot = new THREE.Mesh(
      this.trackGeometry(new THREE.ConeGeometry(25.4, 18, 18)),
      obsidianMat
    );
    underRoot.rotation.x = Math.PI;
    underRoot.position.y = -9.3;
    this.group.add(underRoot);

    // Celestial Concentric Void Seals etched into the Marble Threshold
    const outerSeal = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(18.5, 18.85, 64)),
      violetSealMat
    );
    outerSeal.rotation.x = -Math.PI / 2;
    outerSeal.position.y = 0.025;
    this.group.add(outerSeal);

    const innerSeal = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(10.2, 10.45, 48)),
      whiteSealMat
    );
    innerSeal.rotation.x = -Math.PI / 2;
    innerSeal.position.y = 0.025;
    this.group.add(innerSeal);

    // Soaring Broken White Marble Colonnades & Alternating Black Obsidian Obelisks (r = 23.4m)
    const archBaseGeom = this.trackGeometry(new THREE.BoxGeometry(2.2, 0.8, 2.2));
    const obeliskGeom = this.trackGeometry(new THREE.CylinderGeometry(0.45, 1.05, 10.5, 4));

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      if (Math.abs(cos) < 0.36 && sin < -0.72) continue;

      const px = cos * 23.4;
      const pz = sin * 23.4;

      const base = new THREE.Mesh(archBaseGeom, obsidianMat);
      base.position.set(px, 0.4, pz);
      base.rotation.y = -a;
      this.group.add(base);

      if (i % 2 === 0) {
        const arch = this.buildGothicArchway(4.2, 8.6, 1.1, whiteMarbleMat, obsidianMat);
        arch.position.set(px, 0.8, pz);
        arch.rotation.y = Math.atan2(-px, -pz);
        this.group.add(arch);
      } else {
        const obelisk = new THREE.Mesh(obeliskGeom, obsidianMat);
        obelisk.position.set(px, 6.0, pz);
        obelisk.rotation.y = Math.PI * 0.25 - a;
        obelisk.castShadow = true;
        this.group.add(obelisk);
      }

      this.addCollider(px, pz, 1.35);
    }

    // Celestial Threshold Throne beyond Creation (z = -17.8)
    const throne = new THREE.Group();
    throne.position.set(0, 0, -17.8);

    const dais = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(4.5, 5.2, 0.42, 8)),
      whiteMarbleMat
    );
    dais.position.y = 0.21;
    dais.receiveShadow = true;
    throne.add(dais);

    const seat = new THREE.Mesh(this.trackGeometry(new THREE.BoxGeometry(2.2, 1.1, 1.5)), obsidianMat);
    seat.position.set(0, 0.96, -0.35);
    seat.castShadow = true;
    throne.add(seat);

    const haloFrame = new THREE.Mesh(
      this.trackGeometry(new THREE.TorusGeometry(2.2, 0.18, 8, 32)),
      whiteSealMat
    );
    haloFrame.position.set(0, 2.8, -0.95);
    throne.add(haloFrame);

    this.group.add(throne);
    this.addCollider(0, -18.0, 1.65);

    const celestialLight = new THREE.PointLight(0xe9d5ff, 3.0, 30);
    celestialLight.position.set(0, 5.8, -16);
    this.group.add(celestialLight);
  }

  protected buildEnvironmentalEffects(): void {
    // 1. Astral White & Cosmic Violet Gravity-Defying Star Motes
    this.createParticleLayer({
      countUltra: 520,
      countBalanced: 300,
      countLow: 120,
      colorPrimary: 0xffffff,
      colorSecondary: 0xc084fc,
      size: 0.24,
      radius: 26,
      minY: 0.2,
      maxY: 13,
      speedY: [0.12, 0.48],
      windX: 0.05,
      windZ: -0.05,
      swirl: 0.62,
      opacity: 0.85,
      additive: true,
    });

    // 2. Floating Debris Shards orbiting in Zero-G (InstancedMesh)
    const shardGeom = this.trackGeometry(new THREE.OctahedronGeometry(0.55, 0));
    const shardMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        roughness: 0.3,
        metalness: 0.65,
      })
    );
    this.debrisInstanced = new THREE.InstancedMesh(shardGeom, shardMat, this.debrisCount);
    for (let i = 0; i < this.debrisCount; i++) {
      this.debrisData.push({
        angle: (i / this.debrisCount) * Math.PI * 2,
        radius: 27 + (i % 9) * 3.8,
        y: -2 + (i % 11) * 2.1,
        speed: 0.04 + (i % 5) * 0.015,
        scale: 0.45 + (i % 4) * 0.35,
        phase: i * 0.7,
      });
    }
    this.group.add(this.debrisInstanced);
    this.registerDetailObject(this.debrisInstanced, 'medium');

    // 3. Expanding Celestial Energy Waves
    const waveGeom = this.trackGeometry(new THREE.RingGeometry(24, 24.7, 48));
    for (let w = 0; w < 3; w++) {
      const mat = this.trackMaterial(
        new THREE.MeshBasicMaterial({
          color: w === 1 ? 0xffffff : 0xa855f7,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      const mesh = new THREE.Mesh(waveGeom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.15;
      this.group.add(mesh);
      if (w > 0) this.registerDetailObject(mesh, 'high');
      this.waves.push({ mesh, progress: w / 3, speed: 0.18 });
    }

    // 4. Reality Fracture Crystal Planes hovering in outer space
    const fractureMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xe9d5ff,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const fractureGeom = this.trackGeometry(new THREE.PlaneGeometry(1.2, 11));
    for (let f = 0; f < 8; f++) {
      const a = (f / 8) * Math.PI * 2;
      const frac = new THREE.Mesh(fractureGeom, fractureMat);
      frac.position.set(Math.cos(a) * 38, 12 + (f % 3) * 4, Math.sin(a) * 38);
      frac.rotation.set((f % 3) * 0.3, a, (f % 2 === 0 ? 1 : -1) * 0.42);
      this.group.add(frac);
      this.registerDetailObject(frac, 'high');
    }
  }

  protected updateRealmAnimations(delta: number): void {
    // 1. Floating Civilizations & Celestial Ring Rotation
    for (let i = 0; i < this.orbiters.length; i++) {
      const o = this.orbiters[i];
      o.obj.position.y = o.baseY + Math.sin(this.elapsed * o.bobSpeed + o.phase) * o.bobAmp;
      o.obj.rotation.x += delta * o.rotX;
      o.obj.rotation.y += delta * o.rotY;
      o.obj.rotation.z += delta * o.rotZ;
    }

    // 2. Horizon Eye Rings & Gaze Pulse
    for (let i = 0; i < this.horizonRings.length; i++) {
      this.horizonRings[i].rotation.z += delta * (i % 2 === 0 ? 0.12 : -0.18);
    }
    if (this.eyePupilMesh) {
      const pulse = 1 + Math.sin(this.elapsed * 2.1) * 0.06;
      this.eyePupilMesh.scale.set(pulse, 1, 1);
    }

    // 3. Orbiting Zero-G Debris Shards
    if (this.debrisInstanced && this.debrisInstanced.visible) {
      for (let i = 0; i < this.debrisCount; i++) {
        const d = this.debrisData[i];
        d.angle += delta * d.speed;
        this.dummy.position.set(
          Math.cos(d.angle) * d.radius,
          d.y + Math.sin(this.elapsed * 1.4 + d.phase) * 0.9,
          Math.sin(d.angle) * d.radius
        );
        this.dummy.rotation.set(this.elapsed * 0.4 + d.phase, this.elapsed * 0.6, d.phase);
        this.dummy.scale.setScalar(d.scale);
        this.dummy.updateMatrix();
        this.debrisInstanced.setMatrixAt(i, this.dummy.matrix);
      }
      this.debrisInstanced.instanceMatrix.needsUpdate = true;
    }

    // 4. Expanding Celestial Energy Waves
    for (let i = 0; i < this.waves.length; i++) {
      const w = this.waves[i];
      w.progress = (w.progress + delta * w.speed) % 1.0;
      const sc = 0.7 + w.progress * 1.9;
      w.mesh.scale.set(sc, sc, 1);
      (w.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - w.progress) * 0.34;
    }

    // 5. White & Violet Cosmic Lightning Flashes
    this.lightningTimer -= delta;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 4.5 + Math.random() * 6.5;
      this.lightningIntensity = 1.1;
    }
    if (this.lightningIntensity > 0) {
      this.lightningIntensity = Math.max(0, this.lightningIntensity - delta * 3.5);
    }
    if (this.skyUniforms) {
      this.skyUniforms.uLightning.value = this.lightningIntensity;
    }
  }

  private buildColossalHorizonEye(dir: THREE.Vector3): void {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.copy(dir).multiplyScalar(130);
    eyeGroup.lookAt(0, 6, 0);

    const eyeGlowTex = this.createHorizonEyeTexture();
    const eyeBillboard = new THREE.Mesh(
      this.trackGeometry(new THREE.PlaneGeometry(54, 54)),
      this.trackMaterial(
        new THREE.MeshBasicMaterial({
          map: eyeGlowTex,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        })
      )
    );
    eyeGroup.add(eyeBillboard);

    // Glowing White Vertical Slit Pupil Core
    const pupil = new THREE.Mesh(
      this.trackGeometry(new THREE.SphereGeometry(4.5, 16, 16)),
      this.trackMaterial(
        new THREE.MeshBasicMaterial({
          color: 0x09051a,
          fog: false,
        })
      )
    );
    pupil.scale.set(0.32, 2.2, 0.2);
    pupil.position.z = 0.8;
    eyeGroup.add(pupil);
    this.eyePupilMesh = pupil;

    // Rotating Concentric Cosmic Halo Rings around the White Eye
    const ringColors = [0xffffff, 0xc084fc, 0xfde68a];
    ringColors.forEach((col, idx) => {
      const ring = new THREE.Mesh(
        this.trackGeometry(new THREE.TorusGeometry(15 + idx * 6.5, 0.32, 8, 48)),
        this.trackMaterial(
          new THREE.MeshBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.72 - idx * 0.14,
            blending: THREE.AdditiveBlending,
            fog: false,
          })
        )
      );
      ring.position.z = 0.5 + idx * 0.4;
      eyeGroup.add(ring);
      this.horizonRings.push(ring);
    });

    this.group.add(eyeGroup);
  }

  private createHorizonEyeTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, size, size);
      const cx = size * 0.5;
      const cy = size * 0.5;
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, size * 0.48);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.28, 'rgba(233, 213, 255, 0.85)');
      grad.addColorStop(0.55, 'rgba(168, 85, 247, 0.42)');
      grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.trackTexture(tex);
    return tex;
  }

  public override dispose(): void {
    this.orbiters = [];
    this.waves = [];
    this.horizonRings = [];
    this.eyePupilMesh = null;
    this.debrisInstanced = null;
    this.debrisData = [];
    super.dispose();
  }
}
