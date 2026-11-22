import * as THREE from 'three';
import { materialFactory } from '../../vfx/MaterialFactory';
import { OpenWorldRealmBase } from './openworld/OpenWorldRealmBase';
import { OPEN_WORLD_REALM_CONFIGS } from './openworld/OpenWorldRealmConfigs';
import { OpenWorldRealmConfig } from './openworld/OpenWorldRealmTypes';

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

export class GluttonyEnvironment extends OpenWorldRealmBase {
  public readonly realmId = 2;
  public readonly realmName = 'Gluttony — The Maw of Endless Hunger';

  private pulsingNodes: PulsingNode[] = [];
  private tendrils: SwayTendril[] = [];
  private coreHeartLight: THREE.PointLight | null = null;

  public getOpenWorldConfig(): OpenWorldRealmConfig {
    return OPEN_WORLD_REALM_CONFIGS[2];
  }

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x110407);
    scene.fog = new THREE.FogExp2(0x1f080e, 0.0115);

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
      radius: 235,
    });
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. 280m x 280m Chunk-Streamed Flesh & Bone Open World + Chasm Blood River + 3 Bridges + Shrines/Relics/Lore
    this.buildOpenWorldFoundation();

    const bloodRiverMat = this.createLiquidMaterial({
      colorDeep: 0x2b0408,
      colorMid: 0x7f111a,
      colorBright: 0xef4444,
      flowSpeed: 0.75,
      emissiveBoost: 1.25,
      scaleX: 8,
      scaleY: 8,
    });

    const fleshWallMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x521822,
        roughness: 0.55,
        metalness: 0.08,
        emissive: 0x24060a,
        emissiveIntensity: 0.18,
      })
    );
    const boneMat = materialFactory.createCalcifiedBone();
    this.trackMaterial(boneMat);

    // 2. Colossal Screaming Skull-Maw Fortress crowning the Northern Maw Citadel (z = -126)
    this.buildColossalMawFortress(fleshWallMat, boneMat, bloodRiverMat);

    // 3. Cascading Blood Waterfalls into the Central Blood Gorge (z = 26)
    const waterfallGeom = this.trackGeometry(new THREE.PlaneGeometry(7.0, 14, 1, 8));
    for (const wx of [-28, 28, -82, 82]) {
      const fall = new THREE.Mesh(waterfallGeom, bloodRiverMat);
      fall.position.set(wx, 2.8, 25);
      this.group.add(fall);
      this.registerDetailObject(fall, 'medium');
    }

    // 4. Giant Embedded Mouths framing the West/East Gorge & Mid-Valley Cliffs
    const mawSpots: Array<[number, number, number, number]> = [
      [-102, 5.2, -16, Math.PI * 0.42],
      [102, 5.2, -16, -Math.PI * 0.42],
      [-58, 4.4, -76, Math.PI * 0.32],
      [58, 4.4, -76, -Math.PI * 0.32],
    ];
    mawSpots.forEach(([mx, my, mz, ry]) => {
      const maw = this.buildEmbeddedCliffMouth(fleshWallMat, boneMat);
      maw.position.set(mx, my, mz);
      maw.rotation.y = ry;
      this.group.add(maw);
      this.registerDetailObject(maw, 'medium');
    });

    // 5. Giant Ribcage Tunnels arching over the Northern Pilgrimage Road
    const roadRibGeom = this.trackGeometry(new THREE.TorusGeometry(9.6, 0.58, 8, 20, Math.PI));
    for (const rz of [68, 10, -24, -44]) {
      const archRib = new THREE.Mesh(roadRibGeom, boneMat);
      archRib.position.set(0, 0.2, rz);
      archRib.castShadow = true;
      this.group.add(archRib);
      this.registerDetailObject(archRib, 'medium');
    }

    // 6. Mountains of Calcified Bones flanking Ossuary Gorge & Slaughterfield
    this.buildBoneMountains(boneMat);
  }

  public override createBossArena(): void {
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
        emissiveIntensity: 0.22,
      })
    );

    // Arena Floor Plate anchored cleanly at (0, 0, -84) with y = 0 surface
    const floorPlate = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(28.0, 29.0, 0.16, 36)),
      stomachStoneMat
    );
    floorPlate.position.y = -0.06;
    floorPlate.receiveShadow = true;
    this.arenaAnchorGroup.add(floorPlate);

    // Stomach Cathedral Arched Ribcage Perimeter (r = 24.4m, open south entry corridor)
    const ribGeom = this.trackGeometry(new THREE.TorusGeometry(9.2, 0.52, 8, 20, Math.PI * 0.48));
    const cystGeom = this.trackGeometry(new THREE.IcosahedronGeometry(1.45, 1));

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      // Leave Southern entrance open (sin > 0.72) AND Northern skull sightline clear (sin < -0.72)
      if (Math.abs(cos) < 0.38 && (sin < -0.72 || sin > 0.72)) continue;

      const rad = 24.4;
      const rx = cos * rad;
      const rz = sin * rad;

      const rib = new THREE.Mesh(ribGeom, boneMat);
      rib.position.set(rx, 0.5, rz);
      rib.rotation.y = Math.atan2(-rx, -rz) + Math.PI * 0.5;
      rib.rotation.z = 0.22;
      rib.castShadow = true;
      this.arenaAnchorGroup.add(rib);

      const cyst = new THREE.Mesh(cystGeom, pulsingFleshMat);
      const s = 0.85 + (i % 3) * 0.28;
      cyst.position.set(rx * 1.04, 1.1 * s, rz * 1.04);
      cyst.scale.set(s * 1.2, s * 0.9, s * 1.2);
      this.arenaAnchorGroup.add(cyst);
      this.pulsingNodes.push({
        mesh: cyst,
        baseScale: cyst.scale.clone(),
        amp: 0.14,
        speed: 2.2 + (i % 4) * 0.35,
        phase: i * 0.7,
      });

      this.addArenaCollider(rx, rz, 1.35);
    }

    // Central Throne of Bone & Flesh (local z = -18.5 -> world z = -102.5)
    const throne = new THREE.Group();
    throne.position.set(0, 0, -18.5);

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

    const throneFangGeom = this.trackGeometry(new THREE.ConeGeometry(0.28, 3.2, 6));
    for (let f = -3; f <= 3; f++) {
      const fang = new THREE.Mesh(throneFangGeom, boneMat);
      fang.position.set(f * 0.46, 2.2 - Math.abs(f) * 0.18, -1.05 + Math.abs(f) * 0.12);
      fang.rotation.x = 0.18;
      fang.rotation.z = -f * 0.12;
      fang.castShadow = true;
      throne.add(fang);
    }

    this.arenaAnchorGroup.add(throne);
    this.addArenaCollider(0, -18.5, 1.65);

    this.coreHeartLight = new THREE.PointLight(0xdc2626, 2.0, 28);
    this.coreHeartLight.position.set(0, 3.4, -16.5);
    this.arenaAnchorGroup.add(this.coreHeartLight);
  }

  protected buildEnvironmentalEffects(): void {
    // 1. Floating Toxic Necrotic Spores & Crimson Mist Motes (follows Azrael across open world)
    this.createParticleLayer({
      countUltra: 560,
      countBalanced: 320,
      countLow: 120,
      colorPrimary: 0x84cc16,
      colorSecondary: 0xef4444,
      size: 0.26,
      radius: 34,
      minY: 0.2,
      maxY: 11.5,
      speedY: [0.15, 0.55],
      windX: 0.2,
      windZ: -0.15,
      swirl: 0.45,
      opacity: 0.78,
      additive: true,
    });

    // 2. Red Atmospheric Haze Mist Planes hovering over the Blood River Gorge
    const hazeTex = this.createMistTexture(165, 28, 36);
    const hazeGeom = this.trackGeometry(new THREE.PlaneGeometry(24, 18));
    const hazeMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        map: hazeTex,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      })
    );
    for (let i = -3; i <= 3; i++) {
      const m = new THREE.Mesh(hazeGeom, hazeMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(i * 32, -0.8, 36);
      this.group.add(m);
      if (Math.abs(i) >= 2) this.registerDetailObject(m, 'medium');
    }

    // 3. Swaying Organic Tendrils along the Maw Citadel Rim
    const tendrilMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x6b1624,
        roughness: 0.42,
        emissive: 0x2a050a,
      })
    );
    const tendrilGeom = this.trackGeometry(new THREE.ConeGeometry(0.28, 4.8, 6));
    tendrilGeom.translate(0, 2.4, 0);

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.15;
      const rad = 26.8 + (i % 2) * 1.4;
      const tMesh = new THREE.Mesh(tendrilGeom, tendrilMat);
      tMesh.position.set(Math.cos(a) * rad, -0.2, Math.sin(a) * rad);
      const rx = ((i % 3) - 1) * 0.22;
      const rz = ((i % 2) * 2 - 1) * 0.25;
      tMesh.rotation.set(rx, a, rz);
      this.arenaAnchorGroup.add(tMesh);
      if (i >= 10) this.registerDetailObject(tMesh, 'high');
      this.tendrils.push({ mesh: tMesh, baseRotX: rx, baseRotZ: rz, phase: i * 0.65 });
    }
  }

  protected override updateRealmAnimations(delta: number, playerPos?: THREE.Vector3): void {
    this.updateOpenWorldRuntime(delta, playerPos);

    for (let i = 0; i < this.pulsingNodes.length; i++) {
      const n = this.pulsingNodes[i];
      const pulse = 1 + Math.sin(this.elapsed * n.speed + n.phase) * n.amp;
      n.mesh.scale.set(
        n.baseScale.x * pulse,
        n.baseScale.y * (1 + Math.cos(this.elapsed * n.speed + n.phase) * n.amp * 0.7),
        n.baseScale.z * pulse
      );
    }

    for (let i = 0; i < this.tendrils.length; i++) {
      const t = this.tendrils[i];
      t.mesh.rotation.x = t.baseRotX + Math.sin(this.elapsed * 1.9 + t.phase) * 0.22;
      t.mesh.rotation.z = t.baseRotZ + Math.cos(this.elapsed * 1.6 + t.phase) * 0.24;
    }

    if (this.coreHeartLight) {
      this.coreHeartLight.intensity = 1.8 + Math.sin(this.elapsed * 3.1) * 0.42;
    }
  }

  private buildColossalMawFortress(
    fleshMat: THREE.Material,
    boneMat: THREE.Material,
    bloodMat: THREE.Material
  ): void {
    const fortress = new THREE.Group();
    fortress.position.set(0, 1.5, -134);
    fortress.scale.setScalar(1.35);

    const ridge = new THREE.Mesh(this.trackGeometry(new THREE.ConeGeometry(28, 34, 9)), fleshMat);
    ridge.position.set(0, 14, -10);
    fortress.add(ridge);

    const cranium = new THREE.Mesh(this.trackGeometry(new THREE.DodecahedronGeometry(11.5, 1)), boneMat);
    cranium.position.set(0, 17, 2);
    cranium.scale.set(1.05, 1.18, 0.95);
    fortress.add(cranium);

    const socketMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9 })
    );
    const socketGeom = this.trackGeometry(new THREE.SphereGeometry(2.1, 10, 8));
    for (const sx of [-4.2, 4.2]) {
      const eye = new THREE.Mesh(socketGeom, socketMat);
      eye.position.set(sx, 18.8, 10.2);
      fortress.add(eye);
    }

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
    const boneGeom = this.trackGeometry(new THREE.CylinderGeometry(0.18, 0.3, 2.6, 5));
    const count = 120;
    const inst = new THREE.InstancedMesh(boneGeom, boneMat, count);
    const dummy = new THREE.Object3D();

    const clusters: Array<[number, number]> = [
      [-88, -10],
      [88, -12],
      [-42, -78],
      [42, -78],
      [-58, 74],
      [58, 74],
    ];

    for (let i = 0; i < count; i++) {
      const [cx, cz] = clusters[i % clusters.length];
      const spreadA = i * 1.7;
      const spreadR = 3.2 + (i % 6) * 0.9;
      const x = cx + Math.cos(spreadA) * spreadR;
      const z = cz + Math.sin(spreadA) * spreadR;
      const y = this.getGroundHeightAt(x, z) + 0.55 + (i % 4) * 0.35;
      dummy.position.set(x, y, z);
      dummy.rotation.set(i * 0.9, i * 1.3, i * 0.5);
      dummy.scale.setScalar(0.85 + (i % 3) * 0.35);
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

