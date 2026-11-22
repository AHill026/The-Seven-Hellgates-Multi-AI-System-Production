import * as THREE from 'three';
import { materialFactory } from '../../vfx/MaterialFactory';
import { BaseRealmEnvironment } from './BaseRealmEnvironment';

interface PulsingNode {
  mesh: THREE.Object3D;
  baseScale: THREE.Vector3;
  amp: number;
  speed: number;
  phase: number;
}

interface SwayTendril {
  mesh: THREE.Mesh;
  baseRotX: number;
  baseRotZ: number;
  phase: number;
}

export class GluttonyEnvironment extends BaseRealmEnvironment {
  public readonly realmId = 2;
  public readonly realmName = 'Gluttony — The Maw of Endless Hunger';

  private pulsingNodes: PulsingNode[] = [];
  private tendrils: SwayTendril[] = [];
  private coreHeartLight: THREE.PointLight | null = null;

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x110407);
    scene.fog = new THREE.FogExp2(0x1f080e, 0.019);

    this.createSkyDome({
      zenithColor: 0x0d0306,
      midColor: 0x2b0a12,
      horizonColor: 0x6b141c,
      cloudColor: 0x3b0c14,
      glowColor: 0xdc2626,
      glowDirection: new THREE.Vector3(0, 0.25, -1).normalize(),
      glowSize: 0.28,
      cloudDensity: 0.68,
      cloudSpeed: 0.032,
    });
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. Living Flesh Terrain: flat playable stomach-cathedral floor (r <= 27m),
    // sunken blood river trench (27..42m), rising organic cliff walls (r > 42m)
    const groundGeom = this.trackGeometry(new THREE.PlaneGeometry(180, 180, 56, 56));
    const pos = groundGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const r = Math.hypot(vx, vy);
      let h = 0;
      if (r > 27 && r <= 42) {
        const t = (r - 27) / 15;
        h = -Math.sin(t * Math.PI) * 5.2 + Math.sin(vx * 0.3) * Math.cos(vy * 0.3) * 0.6;
      } else if (r > 42) {
        h = (r - 42) * 0.55 + Math.sin(vx * 0.22 + vy * 0.14) * 2.4;
      }
      pos.setZ(i, h);
    }
    groundGeom.computeVertexNormals();

    const fleshTerrainMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x38131a,
        roughness: 0.72,
        metalness: 0.08,
      })
    );
    const ground = new THREE.Mesh(groundGeom, fleshTerrainMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // 2. River of Blood surrounding the arena island
    const bloodRiverMat = this.createLiquidMaterial({
      colorDeep: 0x2b0408,
      colorMid: 0x7f111a,
      colorBright: 0xef4444,
      flowSpeed: 0.75,
      emissiveBoost: 1.25,
      scaleX: 8,
      scaleY: 8,
    });
    const bloodRing = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(26.2, 54, 48)),
      bloodRiverMat
    );
    bloodRing.rotation.x = -Math.PI / 2;
    bloodRing.position.y = -0.55;
    this.group.add(bloodRing);

    const fleshWallMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x521822,
        roughness: 0.55,
        metalness: 0.08,
        emissive: 0x24060a,
        emissiveIntensity: 0.45,
      })
    );
    const boneMat = materialFactory.createCalcifiedBone();
    this.trackMaterial(boneMat);

    // 3. Colossal Screaming Skull-Maw Fortress on the northern cliff (z = -56)
    this.buildColossalMawFortress(fleshWallMat, boneMat, bloodRiverMat);

    // 4. Giant Ribcage Bridge & Tunnel Spans crossing the blood river
    const bridgeMat = materialFactory.createBasaltStone(0x2a1418);
    this.trackMaterial(bridgeMat);
    const northBridge = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(9.5, 1.1, 24)),
      bridgeMat
    );
    northBridge.position.set(0, -0.4, -34);
    this.group.add(northBridge);

    // Blood Waterfall pouring beneath the northern bone bridge & flanking cliffs
    const waterfallGeom = this.trackGeometry(new THREE.PlaneGeometry(5.5, 16, 1, 8));
    const waterfallN = new THREE.Mesh(waterfallGeom, bloodRiverMat);
    waterfallN.position.set(0, 6.8, -46);
    this.group.add(waterfallN);

    for (const side of [-1, 1]) {
      const sideFall = new THREE.Mesh(this.trackGeometry(new THREE.PlaneGeometry(4.2, 13)), bloodRiverMat);
      sideFall.position.set(side * 34, 5.5, -24);
      sideFall.rotation.y = side * -0.55;
      this.group.add(sideFall);
      this.registerDetailObject(sideFall, 'medium');
    }

    // 5. Giant Embedded Mouths on East & West Flesh Cliffs
    for (const side of [-1, 1]) {
      const maw = this.buildEmbeddedCliffMouth(fleshWallMat, boneMat);
      maw.position.set(side * 35, 3.8, -6);
      maw.rotation.y = side * -Math.PI * 0.5;
      this.group.add(maw);
      this.registerDetailObject(maw, 'medium');
    }

    // 6. Mountains of Calcified Bones (InstancedMesh)
    this.buildBoneMountains(boneMat);
  }

  public createBossArena(): void {
    const boneMat = materialFactory.createCalcifiedBone();
    this.trackMaterial(boneMat);
    const stomachStoneMat = materialFactory.createBasaltStone(0x2d1319);
    this.trackMaterial(stomachStoneMat);
    const pulsingFleshMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x631d28,
        roughness: 0.48,
        metalness: 0.06,
        emissive: 0x450a0a,
        emissiveIntensity: 0.55,
      })
    );

    // Arena Floor Plate (y = 0.02, clean boundary above blood moat)
    const floorPlate = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(26.8, 27.6, 0.14, 32)),
      stomachStoneMat
    );
    floorPlate.position.y = -0.05;
    floorPlate.receiveShadow = true;
    this.group.add(floorPlate);

    // Stomach Cathedral Arched Ribcage Perimeter (r = 22.5m, open center corridor for BossEntranceDirector)
    const ribGeom = this.trackGeometry(new THREE.TorusGeometry(9.2, 0.52, 8, 20, Math.PI * 0.48));
    const cystGeom = this.trackGeometry(new THREE.IcosahedronGeometry(1.45, 1));

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      // Keep north portal & south player sightline clear
      if (Math.abs(cos) < 0.36 && sin < -0.72) continue;

      const rad = 23.2;
      const rx = cos * rad;
      const rz = sin * rad;

      const rib = new THREE.Mesh(ribGeom, boneMat);
      rib.position.set(rx, 0.5, rz);
      rib.rotation.y = Math.atan2(-rx, -rz) + Math.PI * 0.5;
      rib.rotation.z = 0.22;
      rib.castShadow = true;
      this.group.add(rib);

      // Pulsating flesh cyst at rib base
      const cyst = new THREE.Mesh(cystGeom, pulsingFleshMat);
      const s = 0.85 + (i % 3) * 0.28;
      cyst.position.set(rx * 1.04, 1.1 * s, rz * 1.04);
      cyst.scale.set(s * 1.2, s * 0.9, s * 1.2);
      this.group.add(cyst);
      this.pulsingNodes.push({
        mesh: cyst,
        baseScale: cyst.scale.clone(),
        amp: 0.14,
        speed: 2.2 + (i % 4) * 0.35,
        phase: i * 0.7,
      });

      this.addCollider(rx, rz, 1.35);
    }

    // Central Throne of Bone & Flesh (z = -17.8, directly behind Abaddon spawn at -14)
    const throne = new THREE.Group();
    throne.position.set(0, 0, -17.8);

    const boneDais = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(3.8, 4.4, 0.45, 12)),
      stomachStoneMat
    );
    boneDais.position.y = 0.22;
    boneDais.receiveShadow = true;
    throne.add(boneDais);

    const fleshMound = new THREE.Mesh(
      this.trackGeometry(new THREE.SphereGeometry(2.1, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      pulsingFleshMat
    );
    fleshMound.position.set(0, 0.35, -0.35);
    throne.add(fleshMound);
    this.pulsingNodes.push({
      mesh: fleshMound,
      baseScale: fleshMound.scale.clone(),
      amp: 0.08,
      speed: 1.8,
      phase: 0,
    });

    // Crown of curved ribs forming the throne backrest
    const throneFangGeom = this.trackGeometry(new THREE.ConeGeometry(0.28, 3.2, 6));
    for (let f = -3; f <= 3; f++) {
      const fang = new THREE.Mesh(throneFangGeom, boneMat);
      fang.position.set(f * 0.46, 2.2 - Math.abs(f) * 0.18, -1.05 + Math.abs(f) * 0.12);
      fang.rotation.x = 0.18;
      fang.rotation.z = -f * 0.12;
      fang.castShadow = true;
      throne.add(fang);
    }

    this.group.add(throne);
    this.addCollider(0, -18.0, 1.65);

    this.coreHeartLight = new THREE.PointLight(0xdc2626, 2.4, 22);
    this.coreHeartLight.position.set(0, 3.2, -16.5);
    this.group.add(this.coreHeartLight);
  }

  protected buildEnvironmentalEffects(): void {
    // 1. Floating Toxic Necrotic Spores & Crimson Mist Motes
    this.createParticleLayer({
      countUltra: 520,
      countBalanced: 300,
      countLow: 120,
      colorPrimary: 0x84cc16,
      colorSecondary: 0xef4444,
      size: 0.26,
      radius: 26,
      minY: 0.2,
      maxY: 10.5,
      speedY: [0.15, 0.55],
      windX: 0.2,
      windZ: -0.15,
      swirl: 0.45,
      opacity: 0.78,
      additive: true,
    });

    // 2. Red Atmospheric Haze Mist Planes hovering over the Blood River
    const hazeTex = this.createMistTexture(165, 28, 36);
    const hazeGeom = this.trackGeometry(new THREE.PlaneGeometry(16, 16));
    const hazeMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        map: hazeTex,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      })
    );
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const m = new THREE.Mesh(hazeGeom, hazeMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(Math.cos(a) * 28, 0.35, Math.sin(a) * 28);
      this.group.add(m);
      if (i >= 4) this.registerDetailObject(m, 'medium');
    }

    // 3. Swaying Organic Tendrils along the Arena Rim
    const tendrilMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x6b1624,
        roughness: 0.42,
        emissive: 0x2a050a,
      })
    );
    const tendrilGeom = this.trackGeometry(new THREE.ConeGeometry(0.28, 4.6, 6));
    tendrilGeom.translate(0, 2.3, 0);

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.15;
      const rad = 25.4 + (i % 2) * 1.4;
      const tMesh = new THREE.Mesh(tendrilGeom, tendrilMat);
      tMesh.position.set(Math.cos(a) * rad, -0.2, Math.sin(a) * rad);
      const rx = ((i % 3) - 1) * 0.22;
      const rz = ((i % 2) * 2 - 1) * 0.25;
      tMesh.rotation.set(rx, a, rz);
      this.group.add(tMesh);
      if (i >= 10) this.registerDetailObject(tMesh, 'high');
      this.tendrils.push({ mesh: tMesh, baseRotX: rx, baseRotZ: rz, phase: i * 0.65 });
    }
  }

  protected updateRealmAnimations(_delta: number): void {
    // 1. Breathing Terrain Cysts & Pulsing Flesh Mounds
    for (let i = 0; i < this.pulsingNodes.length; i++) {
      const n = this.pulsingNodes[i];
      const pulse = 1 + Math.sin(this.elapsed * n.speed + n.phase) * n.amp;
      n.mesh.scale.set(
        n.baseScale.x * pulse,
        n.baseScale.y * (1 + Math.cos(this.elapsed * n.speed + n.phase) * n.amp * 0.7),
        n.baseScale.z * pulse
      );
    }

    // 2. Swaying Organic Tendrils
    for (let i = 0; i < this.tendrils.length; i++) {
      const t = this.tendrils[i];
      t.mesh.rotation.x = t.baseRotX + Math.sin(this.elapsed * 1.9 + t.phase) * 0.22;
      t.mesh.rotation.z = t.baseRotZ + Math.cos(this.elapsed * 1.6 + t.phase) * 0.24;
    }

    if (this.coreHeartLight) {
      this.coreHeartLight.intensity = 2.1 + Math.sin(this.elapsed * 3.1) * 0.65;
    }
  }

  private buildColossalMawFortress(
    fleshMat: THREE.Material,
    boneMat: THREE.Material,
    bloodMat: THREE.Material
  ): void {
    const fortress = new THREE.Group();
    fortress.position.set(0, 2, -58);

    // Mountain of diseased flesh behind skull
    const ridge = new THREE.Mesh(this.trackGeometry(new THREE.ConeGeometry(28, 34, 9)), fleshMat);
    ridge.position.set(0, 14, -10);
    fortress.add(ridge);

    // Giant Screaming Skull Cranium
    const cranium = new THREE.Mesh(this.trackGeometry(new THREE.DodecahedronGeometry(11.5, 1)), boneMat);
    cranium.position.set(0, 17, 2);
    cranium.scale.set(1.05, 1.18, 0.95);
    fortress.add(cranium);

    // Deep Glowing Eye Sockets
    const socketMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9 })
    );
    const socketGeom = this.trackGeometry(new THREE.SphereGeometry(2.1, 10, 8));
    for (const sx of [-4.2, 4.2]) {
      const eye = new THREE.Mesh(socketGeom, socketMat);
      eye.position.set(sx, 18.8, 10.2);
      fortress.add(eye);
    }

    // Gaping Roaring Jaw Cavern + Jagged Bone Fangs
    const throat = new THREE.Mesh(this.trackGeometry(new THREE.CircleGeometry(6.8, 16)), bloodMat);
    throat.position.set(0, 8.2, 9.2);
    fortress.add(throat);

    const fangGeom = this.trackGeometry(new THREE.ConeGeometry(0.65, 3.8, 5));
    for (let f = -3; f <= 3; f++) {
      const topFang = new THREE.Mesh(fangGeom, boneMat);
      topFang.position.set(f * 1.55, 12.2, 10.6 - Math.abs(f) * 0.35);
      topFang.rotation.x = Math.PI;
      fortress.add(topFang);

      const botFang = new THREE.Mesh(fangGeom, boneMat);
      botFang.position.set(f * 1.55, 4.2, 10.4 - Math.abs(f) * 0.35);
      fortress.add(botFang);
    }

    // Massive Ribcage Arches flanking the Skull Fortress
    const megaRibGeom = this.trackGeometry(new THREE.TorusGeometry(19, 0.95, 8, 22, Math.PI * 0.58));
    for (const side of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const rib = new THREE.Mesh(megaRibGeom, boneMat);
        rib.position.set(side * (16 + k * 4.5), 1.5, 4 + k * 5);
        rib.rotation.y = side * Math.PI * 0.42;
        rib.rotation.z = 0.35;
        fortress.add(rib);
      }
    }

    this.pulsingNodes.push({
      mesh: ridge,
      baseScale: ridge.scale.clone(),
      amp: 0.04,
      speed: 1.4,
      phase: 1.2,
    });

    this.group.add(fortress);
  }

  private buildEmbeddedCliffMouth(fleshMat: THREE.Material, boneMat: THREE.Material): THREE.Group {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(this.trackGeometry(new THREE.TorusGeometry(4.4, 1.15, 8, 16)), fleshMat);
    g.add(rim);

    const gulletMat = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0x3b0408 }));
    const gullet = new THREE.Mesh(this.trackGeometry(new THREE.CircleGeometry(3.8, 16)), gulletMat);
    gullet.position.z = -0.4;
    g.add(gullet);

    const toothGeom = this.trackGeometry(new THREE.ConeGeometry(0.32, 1.5, 4));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeom, boneMat);
      tooth.position.set(Math.cos(a) * 3.6, Math.sin(a) * 3.6, 0.25);
      tooth.rotation.z = a + Math.PI * 0.5;
      g.add(tooth);
    }

    this.pulsingNodes.push({
      mesh: rim,
      baseScale: rim.scale.clone(),
      amp: 0.08,
      speed: 2.0,
      phase: Math.random() * Math.PI,
    });
    return g;
  }

  private buildBoneMountains(boneMat: THREE.Material): void {
    const boneGeom = this.trackGeometry(new THREE.CylinderGeometry(0.18, 0.3, 2.4, 5));
    const count = 90;
    const inst = new THREE.InstancedMesh(boneGeom, boneMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const cluster = i % 6;
      const clusterAngle = (cluster / 6) * Math.PI * 2 + 0.3;
      const cx = Math.cos(clusterAngle) * 31;
      const cz = Math.sin(clusterAngle) * 31;
      const spreadA = i * 1.7;
      const spreadR = (i % 5) * 0.75;
      dummy.position.set(cx + Math.cos(spreadA) * spreadR, 0.4 + (i % 4) * 0.35, cz + Math.sin(spreadA) * spreadR);
      dummy.rotation.set(i * 0.9, i * 1.3, i * 0.5);
      dummy.scale.setScalar(0.75 + (i % 3) * 0.35);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }

    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    this.group.add(inst);
    this.registerDetailObject(inst, 'medium');
  }

  public override dispose(): void {
    this.pulsingNodes = [];
    this.tendrils = [];
    this.coreHeartLight = null;
    super.dispose();
  }
}
