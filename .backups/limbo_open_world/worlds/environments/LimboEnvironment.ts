import * as THREE from 'three';
import { materialFactory } from '../../vfx/MaterialFactory';
import { BaseRealmEnvironment } from './BaseRealmEnvironment';

interface LanternNode {
  coreMesh: THREE.Mesh;
  light: THREE.PointLight | null;
  baseY: number;
  phase: number;
}

interface FogWispNode {
  mesh: THREE.Mesh;
  baseX: number;
  baseZ: number;
  speed: number;
  phase: number;
}

interface GhostSilhouetteNode {
  group: THREE.Group;
  startX: number;
  endX: number;
  z: number;
  y: number;
  speed: number;
  phase: number;
}

export class LimboEnvironment extends BaseRealmEnvironment {
  public readonly realmId = 1;
  public readonly realmName = 'Limbo — The Forgotten Kingdom';

  private lanterns: LanternNode[] = [];
  private fogWisps: FogWispNode[] = [];
  private ghosts: GhostSilhouetteNode[] = [];
  private lightningTimer: number = 6.5;
  private lightningIntensity: number = 0;

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x060912);
    scene.fog = new THREE.FogExp2(0x0b1220, 0.017);

    // Stormy night sky with pale silver-blue horizon & moon direction
    const moonDir = new THREE.Vector3(-0.18, 0.48, -0.86).normalize();
    this.createSkyDome({
      zenithColor: 0x04070f,
      midColor: 0x0e192d,
      horizonColor: 0x203552,
      cloudColor: 0x162238,
      glowColor: 0x93c5fd,
      glowDirection: moonDir,
      glowSize: 0.16,
      cloudDensity: 0.62,
      cloudSpeed: 0.025,
      starIntensity: 0.65,
    });

    // Giant Pale Full Moon billboard above the distant gothic citadel
    const moonTex = this.createMoonTexture();
    const moonMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        map: moonTex,
        transparent: true,
        opacity: 0.96,
        fog: false,
        depthWrite: false,
      })
    );
    const moonMesh = new THREE.Mesh(this.trackGeometry(new THREE.PlaneGeometry(34, 34)), moonMat);
    moonMesh.position.copy(moonDir).multiplyScalar(142);
    moonMesh.lookAt(0, 4, 0);
    this.group.add(moonMesh);

    const haloMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        map: this.createMistTexture(147, 197, 253),
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    const haloMesh = new THREE.Mesh(this.trackGeometry(new THREE.PlaneGeometry(72, 72)), haloMat);
    haloMesh.position.copy(moonDir).multiplyScalar(143);
    haloMesh.lookAt(0, 4, 0);
    this.group.add(haloMesh);
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. Shattered Stone Plateau & Chasm Rim Terrain (Flat inside r <= 28m, ravine drop beyond 28m, outer cliffs beyond 42m)
    const groundGeom = this.trackGeometry(new THREE.PlaneGeometry(180, 180, 56, 56));
    const pos = groundGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i); // maps to -Z after rotation.x = -PI/2
      const r = Math.hypot(vx, vy);
      let h = 0;
      if (r > 28 && r <= 44) {
        // Bottomless ravine trench around the floating courtyard island
        const t = (r - 28) / 16;
        h = -Math.sin(t * Math.PI) * 14.5 + Math.sin(vx * 0.25) * Math.cos(vy * 0.25) * 1.1;
      } else if (r > 44) {
        // Jagged outer chasm mountain walls & citadel ledges
        h = (r - 44) * 0.62 + Math.sin(vx * 0.16) * Math.cos(vy * 0.18) * 3.2;
      }
      pos.setZ(i, h);
    }
    groundGeom.computeVertexNormals();

    const slateMat = materialFactory.createBasaltStone(0x161c28);
    this.trackMaterial(slateMat);
    const ground = new THREE.Mesh(groundGeom, slateMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Abyssal dark mist floor at bottom of chasm
    const abyssMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({ color: 0x050a14, transparent: true, opacity: 0.92 })
    );
    const abyssPlane = new THREE.Mesh(this.trackGeometry(new THREE.RingGeometry(27, 92, 40)), abyssMat);
    abyssPlane.rotation.x = -Math.PI / 2;
    abyssPlane.position.y = -9.5;
    this.group.add(abyssPlane);

    const ruinStoneMat = materialFactory.createBasaltStone(0x283244);
    this.trackMaterial(ruinStoneMat);
    const darkTrimMat = materialFactory.createBasaltStone(0x1a2232);
    this.trackMaterial(darkTrimMat);
    const blueGlowMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      })
    );

    // 2. Ancient Stone Viaduct Bridges crossing the Ravine (North toward Citadel, West & East flanks)
    this.buildStoneBridge(new THREE.Vector3(0, 0, -29), 0, 22, 6.2, ruinStoneMat, blueGlowMat);
    this.buildStoneBridge(new THREE.Vector3(-31, 0, -4), Math.PI * 0.48, 16, 4.4, ruinStoneMat);
    this.buildStoneBridge(new THREE.Vector3(31, 0, -6), -Math.PI * 0.45, 16, 4.4, ruinStoneMat);

    // 3. Giant Abandoned Gothic Citadel & Ruined Cathedrals across the Chasm
    const mainCitadel = this.buildCathedralSilhouette(24, 20, 14, 7, darkTrimMat, blueGlowMat);
    mainCitadel.position.set(0, -1, -64);
    this.group.add(mainCitadel);

    const westCathedral = this.buildCathedralSilhouette(15, 15, 10, 5, ruinStoneMat, blueGlowMat);
    westCathedral.position.set(-40, 2, -48);
    westCathedral.rotation.y = 0.42;
    this.group.add(westCathedral);
    this.registerDetailObject(westCathedral, 'medium');

    const eastCathedral = this.buildCathedralSilhouette(16, 17, 10, 5, ruinStoneMat, blueGlowMat);
    eastCathedral.position.set(42, 1.5, -46);
    eastCathedral.rotation.y = -0.38;
    this.group.add(eastCathedral);
    this.registerDetailObject(eastCathedral, 'medium');

    // Distant jagged broken towers framing horizon
    const towerGeom = this.trackGeometry(new THREE.CylinderGeometry(1.6, 2.4, 22, 7));
    const towerPositions: Array<[number, number, number, number]> = [
      [-52, 4, -18, 0.9],
      [54, 5, -15, 1.05],
      [-46, 3, 28, 0.85],
      [48, 4, 26, 0.92],
      [-24, 6, -68, 1.25],
      [25, 5, -66, 1.18],
    ];
    for (const [tx, ty, tz, sc] of towerPositions) {
      const tower = new THREE.Mesh(towerGeom, darkTrimMat);
      tower.position.set(tx, ty + 8 * sc, tz);
      tower.scale.set(sc, sc, sc);
      tower.rotation.z = (tx > 0 ? -1 : 1) * 0.05;
      this.group.add(tower);
      this.registerDetailObject(tower, 'high');
    }

    // 4. Dead Forest with Twisted Branches (InstancedMesh around outer cliffs & chasm rim)
    this.buildTwistedDeadForest(darkTrimMat);
  }

  public createBossArena(): void {
    const floorMat = materialFactory.createBasaltStone(0x202736);
    this.trackMaterial(floorMat);
    const trimStoneMat = materialFactory.createBasaltStone(0x364154);
    this.trackMaterial(trimStoneMat);
    const runeMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.48,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    // Octagonal ruined courtyard paving ring (slightly elevated y=0.025 to prevent Z-fighting)
    const courtyardPlate = new THREE.Mesh(
      this.trackGeometry(new THREE.CylinderGeometry(26.8, 27.4, 0.06, 16)),
      floorMat
    );
    courtyardPlate.position.y = 0.0;
    courtyardPlate.receiveShadow = true;
    this.group.add(courtyardPlate);

    // Engraved Pale-Blue Runic Arena Ring around the combat courtyard
    const arenaRuneRing = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(16.2, 16.55, 48)),
      runeMat
    );
    arenaRuneRing.rotation.x = -Math.PI / 2;
    arenaRuneRing.position.y = 0.04;
    this.group.add(arenaRuneRing);

    // Perimeter Ruined Cathedral Arches & Pillars (at r = 22.5..25.5, with smooth colliders)
    const pillarGeom = this.trackGeometry(new THREE.CylinderGeometry(0.75, 1.0, 8.2, 8));
    const brokenPillarGeom = this.trackGeometry(new THREE.CylinderGeometry(0.75, 1.0, 4.4, 8));
    const baseGeom = this.trackGeometry(new THREE.BoxGeometry(2.3, 0.7, 2.3));

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      // Leave clear entry corridor in front of Hellgate (around -Z, angle ≈ -PI/2 or +3PI/2) & south view
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      if (Math.abs(cos) < 0.34 && sin < -0.75) continue;

      const radius = 23.2 + (i % 2) * 1.4;
      const px = cos * radius;
      const pz = sin * radius;
      const isBroken = i % 3 === 1;

      const base = new THREE.Mesh(baseGeom, trimStoneMat);
      base.position.set(px, 0.35, pz);
      base.rotation.y = -angle;
      base.receiveShadow = true;
      base.castShadow = true;
      this.group.add(base);

      const col = new THREE.Mesh(isBroken ? brokenPillarGeom : pillarGeom, trimStoneMat);
      col.position.set(px, isBroken ? 2.5 : 4.4, pz);
      col.rotation.z = isBroken ? (i % 2 === 0 ? 0.09 : -0.08) : 0;
      col.castShadow = true;
      col.receiveShadow = true;
      this.group.add(col);

      this.addCollider(px, pz, 1.25);

      // Flickering Blue Lanterns on alternating perimeter piers (cap PointLights to 4 total!)
      if (i % 2 === 0) {
        this.spawnBlueLantern(px, isBroken ? 4.85 : 8.65, pz, i < 8 && i % 4 === 0);
      }
    }

    // Flanking Gothic Ruin Archways at Arena Sides (West & East)
    for (const side of [-1, 1]) {
      const arch = this.buildGothicArchway(6.5, 9.5, 1.4, trimStoneMat, floorMat);
      arch.position.set(side * 24.5, 0, -4);
      arch.rotation.y = side * (Math.PI * 0.5);
      this.group.add(arch);
    }

    // Hollow King's Ruined Throne at northern court edge (z = -17.8, frames boss at z=-14 & leaves portal at z=-22 clear)
    const throneGroup = new THREE.Group();
    throneGroup.position.set(0, 0, -17.8);

    const daisStep1 = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(7.2, 0.32, 3.6)),
      trimStoneMat
    );
    daisStep1.position.y = 0.16;
    daisStep1.receiveShadow = true;
    throneGroup.add(daisStep1);

    const daisStep2 = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(4.6, 0.32, 2.2)),
      floorMat
    );
    daisStep2.position.set(0, 0.48, -0.2);
    daisStep2.receiveShadow = true;
    throneGroup.add(daisStep2);

    // Throne seat & jagged obsidian crown-backrest
    const seat = new THREE.Mesh(this.trackGeometry(new THREE.BoxGeometry(1.9, 0.9, 1.4)), trimStoneMat);
    seat.position.set(0, 1.05, -0.35);
    seat.castShadow = true;
    throneGroup.add(seat);

    const backrest = new THREE.Mesh(this.trackGeometry(new THREE.BoxGeometry(1.8, 3.2, 0.42)), trimStoneMat);
    backrest.position.set(0, 2.25, -0.9);
    backrest.castShadow = true;
    throneGroup.add(backrest);

    const crownSpireGeom = this.trackGeometry(new THREE.ConeGeometry(0.22, 1.6, 4));
    for (const sx of [-0.65, 0, 0.65]) {
      const spire = new THREE.Mesh(crownSpireGeom, trimStoneMat);
      spire.position.set(sx, sx === 0 ? 4.4 : 4.0, -0.9);
      spire.rotation.y = Math.PI * 0.25;
      throneGroup.add(spire);
    }

    // Flanking throne braziers
    for (const bx of [-3.1, 3.1]) {
      this.spawnBlueLantern(bx, 1.3, -17.2, false);
    }

    this.group.add(throneGroup);
    this.addCollider(0, -18.2, 1.6);
  }

  protected buildEnvironmentalEffects(): void {
    // 1. Wind-Driven Ash & Spectral Blue Embers
    this.createParticleLayer({
      countUltra: 520,
      countBalanced: 300,
      countLow: 120,
      colorPrimary: 0x94a3b8,
      colorSecondary: 0x38bdf8,
      size: 0.24,
      radius: 26,
      minY: 0.2,
      maxY: 11,
      speedY: [-0.45, -0.15],
      windX: 0.85,
      windZ: 0.35,
      swirl: 0.32,
      opacity: 0.72,
      additive: true,
    });

    // 2. Moving Ground Fog Wisps
    const fogTex = this.createMistTexture(56, 95, 148);
    const fogGeom = this.trackGeometry(new THREE.PlaneGeometry(14, 14));
    for (let i = 0; i < 10; i++) {
      const mat = this.trackMaterial(
        new THREE.MeshBasicMaterial({
          map: fogTex,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
          blending: THREE.NormalBlending,
        })
      );
      const wisp = new THREE.Mesh(fogGeom, mat);
      wisp.rotation.x = -Math.PI / 2;
      const angle = (i / 10) * Math.PI * 2;
      const dist = 10 + (i % 3) * 6;
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;
      wisp.position.set(bx, 0.22 + (i % 3) * 0.12, bz);
      this.group.add(wisp);
      if (i >= 6) this.registerDetailObject(wisp, 'medium');

      this.fogWisps.push({
        mesh: wisp,
        baseX: bx,
        baseZ: bz,
        speed: 0.3 + (i % 4) * 0.12,
        phase: i * 1.1,
      });
    }

    // 3. Distant Ghostly Silhouettes drifting silently across the stone viaduct & ledges
    const ghostMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.26,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const bodyGeom = this.trackGeometry(new THREE.ConeGeometry(0.45, 2.2, 6));
    const headGeom = this.trackGeometry(new THREE.SphereGeometry(0.24, 6, 6));
    const ghostRoutes: Array<[number, number, number, number, number]> = [
      [-14, 14, -34, 1.3, 0.8],
      [-28, -16, -24, 1.2, 0.55],
      [18, 30, -25, 1.2, 0.65],
    ];
    ghostRoutes.forEach(([sx, ex, gz, gy, sp], idx) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeom, ghostMat);
      body.position.y = 1.1;
      const head = new THREE.Mesh(headGeom, ghostMat);
      head.position.y = 2.35;
      g.add(body, head);
      g.position.set(sx, gy, gz);
      this.group.add(g);
      this.registerDetailObject(g, 'medium');
      this.ghosts.push({ group: g, startX: sx, endX: ex, z: gz, y: gy, speed: sp, phase: idx * 2.1 });
    });
  }

  protected updateRealmAnimations(delta: number): void {
    // 1. Flickering Blue Lanterns
    for (let i = 0; i < this.lanterns.length; i++) {
      const l = this.lanterns[i];
      const flicker = 0.85 + Math.sin(this.elapsed * 7.5 + l.phase) * 0.12 + Math.sin(this.elapsed * 13.0 + l.phase) * 0.08;
      l.coreMesh.scale.setScalar(flicker);
      l.coreMesh.position.y = l.baseY + Math.sin(this.elapsed * 3.0 + l.phase) * 0.04;
      if (l.light) {
        l.light.intensity = 1.8 * flicker;
      }
    }

    // 2. Drifting Ground Fog
    for (let i = 0; i < this.fogWisps.length; i++) {
      const f = this.fogWisps[i];
      f.mesh.position.x = f.baseX + Math.sin(this.elapsed * f.speed + f.phase) * 3.2;
      f.mesh.position.z = f.baseZ + Math.cos(this.elapsed * f.speed * 0.7 + f.phase) * 2.2;
      f.mesh.rotation.z += delta * 0.08;
    }

    // 3. Distant Ghostly Silhouettes
    for (let i = 0; i < this.ghosts.length; i++) {
      const gh = this.ghosts[i];
      const ping = Math.sin(this.elapsed * gh.speed * 0.28 + gh.phase) * 0.5 + 0.5;
      gh.group.position.x = THREE.MathUtils.lerp(gh.startX, gh.endX, ping);
      gh.group.position.y = gh.y + Math.sin(this.elapsed * 2.1 + gh.phase) * 0.16;
    }

    // 4. Occasional Storm Cloud Lightning
    this.lightningTimer -= delta;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 7.0 + Math.random() * 8.0;
      this.lightningIntensity = 0.95;
    }
    if (this.lightningIntensity > 0) {
      this.lightningIntensity = Math.max(0, this.lightningIntensity - delta * 3.6);
    }
    if (this.skyUniforms) {
      this.skyUniforms.uLightning.value = this.lightningIntensity;
    }
  }

  private buildStoneBridge(
    center: THREE.Vector3,
    rotY: number,
    length: number,
    width: number,
    stoneMat: THREE.Material,
    lanternGlowMat?: THREE.Material
  ): void {
    const bridge = new THREE.Group();
    bridge.position.copy(center);
    bridge.rotation.y = rotY;

    const deck = new THREE.Mesh(this.trackGeometry(new THREE.BoxGeometry(width, 0.7, length)), stoneMat);
    deck.position.y = -0.35;
    deck.receiveShadow = true;
    bridge.add(deck);

    // Side stone parapets
    const parapetGeom = this.trackGeometry(new THREE.BoxGeometry(0.45, 0.95, length));
    for (const sx of [-width * 0.5 + 0.22, width * 0.5 - 0.22]) {
      const p = new THREE.Mesh(parapetGeom, stoneMat);
      p.position.set(sx, 0.45, 0);
      bridge.add(p);
    }

    // Support piers plunging into chasm
    const pierGeom = this.trackGeometry(new THREE.BoxGeometry(width * 0.85, 16, 1.8));
    for (const pz of [-length * 0.3, length * 0.3]) {
      const pier = new THREE.Mesh(pierGeom, stoneMat);
      pier.position.set(0, -8.3, pz);
      bridge.add(pier);
    }

    if (lanternGlowMat) {
      const orbGeom = this.trackGeometry(new THREE.SphereGeometry(0.28, 8, 8));
      for (const sx of [-width * 0.5 + 0.22, width * 0.5 - 0.22]) {
        const orb = new THREE.Mesh(orbGeom, lanternGlowMat);
        orb.position.set(sx, 1.25, -length * 0.35);
        bridge.add(orb);
      }
    }

    this.group.add(bridge);
  }

  private buildTwistedDeadForest(treeMat: THREE.Material): void {
    const trunkGeom = this.trackGeometry(new THREE.CylinderGeometry(0.24, 0.62, 6.8, 6));
    const branchGeom = this.trackGeometry(new THREE.CylinderGeometry(0.08, 0.22, 3.6, 5));

    const treeCount = 34;
    const trunkInst = new THREE.InstancedMesh(trunkGeom, treeMat, treeCount);
    const branchInst = new THREE.InstancedMesh(branchGeom, treeMat, treeCount * 2);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + ((i % 3) - 1) * 0.08;
      // Place dead trees along outer cliff ridge (radius 30..48), avoiding North citadel sightline (-PI/2)
      const northDiff = Math.abs(Math.atan2(Math.sin(angle + Math.PI * 0.5), Math.cos(angle + Math.PI * 0.5)));
      const rad = northDiff < 0.38 ? 44 + (i % 4) * 3 : 30 + (i % 5) * 3.5;
      const x = Math.cos(angle) * rad;
      const z = Math.sin(angle) * rad;
      const scale = 0.85 + (i % 4) * 0.25;

      dummy.position.set(x, 2.2 * scale, z);
      dummy.rotation.set(((i % 3) - 1) * 0.14, angle * 2.1, ((i % 5) - 2) * 0.1);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      // Two crooked twisted branches per tree
      for (let b = 0; b < 2; b++) {
        dummy.position.set(
          x + (b === 0 ? -0.9 : 0.9) * scale,
          (4.6 + b * 0.7) * scale,
          z + (b === 0 ? 0.5 : -0.5) * scale
        );
        dummy.rotation.set(0.45 * (b === 0 ? 1 : -1), angle + b * 1.4, (b === 0 ? 0.82 : -0.78));
        dummy.scale.setScalar(scale * 0.95);
        dummy.updateMatrix();
        branchInst.setMatrixAt(i * 2 + b, dummy.matrix);
      }
    }

    trunkInst.instanceMatrix.needsUpdate = true;
    branchInst.instanceMatrix.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    branchInst.computeBoundingSphere();
    this.group.add(trunkInst, branchInst);
    this.registerDetailObject(branchInst, 'medium');
  }

  private spawnBlueLantern(x: number, y: number, z: number, withLight: boolean): void {
    const cageMat = materialFactory.createBasaltStone(0x111827);
    this.trackMaterial(cageMat);
    const cage = new THREE.Mesh(this.trackGeometry(new THREE.CylinderGeometry(0.28, 0.22, 0.55, 6)), cageMat);
    cage.position.set(x, y, z);
    this.group.add(cage);

    const flameMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
      })
    );
    const flame = new THREE.Mesh(this.trackGeometry(new THREE.OctahedronGeometry(0.22, 0)), flameMat);
    flame.position.set(x, y + 0.08, z);
    this.group.add(flame);

    let light: THREE.PointLight | null = null;
    if (withLight) {
      light = new THREE.PointLight(0x38bdf8, 1.8, 14);
      light.position.set(x, y + 0.25, z);
      this.group.add(light);
    }

    this.lanterns.push({
      coreMesh: flame,
      light,
      baseY: y + 0.08,
      phase: x * 0.37 + z * 0.53,
    });
  }

  private createMoonTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, size, size);
      const cx = size * 0.5;
      const cy = size * 0.5;
      const r = size * 0.42;

      const discGrad = ctx.createRadialGradient(cx - 14, cy - 14, r * 0.1, cx, cy, r);
      discGrad.addColorStop(0, '#f8fafc');
      discGrad.addColorStop(0.55, '#dbeafe');
      discGrad.addColorStop(0.88, '#93c5fd');
      discGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Subtle moon maria craters
      const craters: Array<[number, number, number, number]> = [
        [cx - 24, cy - 12, 26, 0.18],
        [cx + 28, cy + 16, 22, 0.16],
        [cx + 12, cy - 30, 16, 0.14],
        [cx - 16, cy + 28, 18, 0.15],
        [cx + 4, cy + 2, 12, 0.12],
      ];
      for (const [mx, my, mr, alpha] of craters) {
        ctx.fillStyle = `rgba(30, 58, 95, ${alpha})`;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.trackTexture(tex);
    return tex;
  }

  public override dispose(): void {
    this.lanterns = [];
    this.fogWisps = [];
    this.ghosts = [];
    super.dispose();
  }
}
