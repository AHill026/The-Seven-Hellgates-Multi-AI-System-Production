import * as THREE from 'three';
import { BaseRealmEnvironment } from './BaseRealmEnvironment';
import { EnvironmentGraphicsPreset, RealmLandmarkCoords } from './types';
import {
  collectStaticLimboColliders,
  getLimboGroundHeightAt,
  getLimboPOICoords,
  getLimboZoneAt,
  isLimboWalkableAt,
  LIMBO_PLAYABLE_LIMIT,
  LimboZoneInfo,
} from './limbo/LimboTerrain';
import { buildLimboAncientCitadel, CitadelBuildResult } from './limbo/LimboCitadelBuilder';
import {
  buildLimboLocationsAndBridges,
  InteractiveLoreNode,
  InteractiveRelicNode,
  InteractiveShrineNode,
  LocationsBuildResult,
} from './limbo/LimboLocationsBuilder';
import { LimboChunkStreamer } from './limbo/LimboChunkStreamer';

export class LimboEnvironment extends BaseRealmEnvironment {
  public readonly realmId = 1;
  public readonly realmName = 'Limbo';

  private chunkStreamer: LimboChunkStreamer | null = null;
  private citadelResult: CitadelBuildResult | null = null;
  private locationsResult: LocationsBuildResult | null = null;

  private moonLight: THREE.PointLight | null = null;
  private moonHalo: THREE.Mesh | null = null;
  private ghostSilhouettes: THREE.Mesh[] = [];
  private lightningCooldown = 9.0;
  private lightningFlash = 0;

  private landmarks: RealmLandmarkCoords;

  constructor() {
    super();
    const pois = getLimboPOICoords();
    this.landmarks = {
      spawnPos: pois.outerRuinsSpawn.clone(),
      spawnRotY: Math.PI,
      breachCenter: pois.citadelCourtyard.clone(),
      bossArenaCenter: pois.citadelCourtyard.clone(),
      bossSpawnPos: new THREE.Vector3(0, getLimboGroundHeightAt(0, -118), -118),
      hellgatePos: pois.citadelHellgate.clone(),
      arenaRadius: 34,
      isOpenWorld: true,
    };
  }

  public override getGroundHeightAt(x: number, z: number): number {
    return getLimboGroundHeightAt(x, z);
  }

  public override isWalkableAt(x: number, z: number): boolean {
    return isLimboWalkableAt(x, z);
  }

  public override constrainMovement(
    prevPos: THREE.Vector3,
    nextPos: THREE.Vector3,
    entityRadius: number = 0.7
  ): void {
    // 1. Clamp to playable outer ridges
    nextPos.x = Math.max(-LIMBO_PLAYABLE_LIMIT, Math.min(LIMBO_PLAYABLE_LIMIT, nextPos.x));
    nextPos.z = Math.max(-LIMBO_PLAYABLE_LIMIT, Math.min(LIMBO_PLAYABLE_LIMIT, nextPos.z));

    const prevX = prevPos.x;
    const prevZ = prevPos.z;
    const prevY = getLimboGroundHeightAt(prevX, prevZ);

    const canStepTo = (tx: number, tz: number): boolean => {
      if (!isLimboWalkableAt(tx, tz)) return false;
      const dist = Math.hypot(tx - prevX, tz - prevZ);
      if (dist < 0.001) return true;
      const ny = getLimboGroundHeightAt(tx, tz);
      // Allow stairs/ramps cleanly, block vertical cliff drops/ledges (>1.45 slope)
      const slope = Math.abs(ny - prevY) / Math.max(0.2, dist);
      if (slope > 1.85 && Math.abs(ny - prevY) > 1.1) {
        return false;
      }
      return true;
    };

    if (!canStepTo(nextPos.x, nextPos.z)) {
      // Smooth wall/cliff slide along X or Z independently
      if (canStepTo(nextPos.x, prevZ)) {
        nextPos.z = prevZ;
      } else if (canStepTo(prevX, nextPos.z)) {
        nextPos.x = prevX;
      } else {
        nextPos.x = prevX;
        nextPos.z = prevZ;
      }
    }

    // 2. Two-pass cylinder & box wall collision resolution (prevents corner tunneling)
    this.resolveCollision(nextPos, entityRadius);
    this.resolveCollision(nextPos, entityRadius);

    // 3. Re-verify walkability after pushout & snap ground Y
    if (!isLimboWalkableAt(nextPos.x, nextPos.z)) {
      nextPos.x = prevX;
      nextPos.z = prevZ;
    }
    nextPos.y = getLimboGroundHeightAt(nextPos.x, nextPos.z);
  }

  public override getLandmarks(): RealmLandmarkCoords {
    return this.landmarks;
  }

  public getZoneAt(x: number, z: number): LimboZoneInfo {
    return getLimboZoneAt(x, z);
  }

  public getShrines(): InteractiveShrineNode[] {
    return this.locationsResult?.shrines || [];
  }

  public getRelics(): InteractiveRelicNode[] {
    return this.locationsResult?.relics || [];
  }

  public getLoreNodes(): InteractiveLoreNode[] {
    return this.locationsResult?.loreNodes || [];
  }

  public getActiveChunkCount(): number {
    return this.chunkStreamer?.getActiveChunkCount() || 0;
  }

  public syncCollectedProgress(
    collectedRelics: string[],
    awakenedShrines: string[],
    discoveredLore: string[]
  ): void {
    this.getRelics().forEach((r) => {
      if (collectedRelics.includes(r.id) && !r.collected) {
        r.collected = true;
        // Hide floating crystal/ring while keeping stone pedestal
        while (r.group.children.length > 1) {
          r.group.remove(r.group.children[r.group.children.length - 1]);
        }
      }
    });
    this.getShrines().forEach((s) => {
      if (awakenedShrines.includes(s.id)) {
        (s.orbMesh.material as THREE.MeshStandardMaterial).color.setHex(0x34d399);
        (s.orbMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x10b981);
        (s.ringMesh.material as THREE.MeshBasicMaterial).color.setHex(0x34d399);
        s.light.color.setHex(0x34d399);
      }
    });
    this.getLoreNodes().forEach((l) => {
      if (discoveredLore.includes(l.title) && !l.collected) {
        l.collected = true;
        while (l.group.children.length > 1) {
          l.group.remove(l.group.children[l.group.children.length - 1]);
        }
      }
    });
  }

  protected buildBaseAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x04070f);
    // Tuned atmospheric fog density so the Ancient Citadel (~220m north) remains visible through moonlight mist
    scene.fog = new THREE.FogExp2(0x09111f, 0.0102);

    this.createSkyDome({
      zenithColor: 0x03050c,
      midColor: 0x0c172b,
      horizonColor: 0x16243d,
      cloudColor: 0x1d2b44,
      glowColor: 0x9ec5e8,
      glowDirection: new THREE.Vector3(0.0, 0.42, -1.0),
      glowSize: 0.24,
      cloudDensity: 0.56,
      cloudSpeed: 0.025,
      starIntensity: 0.75,
      radius: 390,
    });

    // Colossal Pale Moonlight Disc & Halo crowning the northern Citadel horizon
    const moonDisc = new THREE.Mesh(
      this.trackGeometry(new THREE.CircleGeometry(24, 36)),
      this.trackMaterial(
        new THREE.MeshBasicMaterial({
          color: 0xdbeafe,
          transparent: true,
          opacity: 0.7,
          fog: false,
        })
      )
    );
    moonDisc.position.set(0, 138, -245);
    this.group.add(moonDisc);

    this.moonHalo = new THREE.Mesh(
      this.trackGeometry(new THREE.RingGeometry(24, 46, 36)),
      this.trackMaterial(
        new THREE.MeshBasicMaterial({
          color: 0x60a5fa,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        })
      )
    );
    this.moonHalo.position.set(0, 138, -246);
    this.group.add(this.moonHalo);

    this.moonLight = new THREE.PointLight(0x93c5fd, 1.55, 260, 0.5);
    this.moonLight.position.set(0, 80, -100);
    this.group.add(this.moonLight);
  }

  protected buildTerrainAndArchitecture(): void {
    // 1. Register Static Cylinder & Wall Box Colliders for Citadel, Bridges, Crypt, Cave & POIs
    const staticCols = collectStaticLimboColliders();
    staticCols.cylinders.forEach((c) => this.addCollider(c.x, c.z, c.radius, c.minY, c.maxY));
    staticCols.boxes.forEach((b) => this.addBoxCollider(b.minX, b.maxX, b.minZ, b.maxZ, b.minY, b.maxY));

    // 2. Chunk-Based Terrain Streamer (8x8 grid of 40m x 40m chunks + horizon continuity)
    this.chunkStreamer = new LimboChunkStreamer();
    this.group.add(this.chunkStreamer.group);
    this.chunkStreamer.update(this.landmarks.spawnPos, this.preset);

    // 3. Three Ravine Bridges + Outer Ruins + All 7 Exploration Landmarks
    this.locationsResult = buildLimboLocationsAndBridges(
      (g) => this.trackGeometry(g),
      (m) => this.trackMaterial(m),
      (obj, tier) => this.registerDetailObject(obj, tier)
    );
    this.group.add(this.locationsResult.group);
  }

  public createBossArena(): void {
    // Monumental Ancient Citadel crowning the Northern Apex (Z: -46 .. -139)
    this.citadelResult = buildLimboAncientCitadel(
      (g) => this.trackGeometry(g),
      (m) => this.trackMaterial(m),
      (obj, tier) => this.registerDetailObject(obj, tier)
    );
    this.group.add(this.citadelResult.group);
  }

  protected buildEnvironmentalEffects(): void {
    // 1. Distant Ghostly Silhouettes wandering outer mist ridges
    const ghostMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const ghostGeom = this.trackGeometry(new THREE.ConeGeometry(0.9, 4.2, 7));

    const silhouetteSpots: [number, number][] = [
      [-32, 92],
      [34, 88],
      [-38, 12],
      [42, 4],
      [-54, -22],
      [48, -32],
      [-28, -42],
      [28, -44],
    ];
    silhouetteSpots.forEach(([gx, gz]) => {
      const gy = getLimboGroundHeightAt(gx, gz);
      const ghost = new THREE.Mesh(ghostGeom, ghostMat);
      ghost.position.set(gx, gy + 2.1, gz);
      ghost.userData = { baseY: gy + 2.1, baseX: gx, phase: gx * 0.21 + gz * 0.13 };
      this.group.add(ghost);
      this.ghostSilhouettes.push(ghost);
    });
    this.ghostSilhouettes.forEach((g) => this.registerDetailObject(g, 'medium'));

    // 2. Wind-Driven Floating Ash & Pale Blue Flame Wisps
    this.createParticleLayer({
      countUltra: 420,
      countBalanced: 250,
      countLow: 110,
      colorPrimary: 0x94a3b8,
      colorSecondary: 0x38bdf8,
      size: 0.26,
      radius: 42,
      minY: 0.2,
      maxY: 16,
      speedY: [-0.25, 0.7],
      windX: 1.5,
      windZ: 0.7,
      swirl: 0.85,
      opacity: 0.68,
      additive: false,
    });

    // 3. Moving Low Ground Mist
    this.createParticleLayer({
      countUltra: 150,
      countBalanced: 90,
      countLow: 36,
      colorPrimary: 0x38bdf8,
      colorSecondary: 0x475569,
      size: 1.65,
      radius: 36,
      minY: 0.1,
      maxY: 2.2,
      speedY: [-0.04, 0.1],
      windX: 0.85,
      windZ: -0.5,
      swirl: 0.35,
      opacity: 0.22,
      additive: true,
    });
  }

  public override setGraphicsPreset(preset: EnvironmentGraphicsPreset): void {
    super.setGraphicsPreset(preset);
    if (this.chunkStreamer) {
      this.chunkStreamer.setPreset(preset);
      this.chunkStreamer.update(this.landmarks.spawnPos, preset);
    }
  }

  protected updateRealmAnimations(delta: number, playerPos?: THREE.Vector3): void {
    const t = this.elapsed;

    // Stream high-detail 40m x 40m terrain chunks around Azrael
    if (this.chunkStreamer && playerPos) {
      this.chunkStreamer.update(playerPos, this.preset);
    }

    // Flickering blue lanterns & shrine/crypt lighting
    if (this.locationsResult) {
      const fl = this.locationsResult.flickerLights;
      for (let i = 0; i < fl.length; i++) {
        const item = fl[i];
        item.light.intensity =
          item.baseIntensity * (0.84 + Math.sin(t * 7.5 + item.phase) * 0.14 + Math.cos(t * 13 + item.phase) * 0.08);
      }

      const spinners = this.locationsResult.spinners;
      for (let i = 0; i < spinners.length; i++) {
        spinners[i].rotation.y += delta * 1.1;
      }

      // Tick Shrine heal cooldowns
      const shrines = this.locationsResult.shrines;
      for (let i = 0; i < shrines.length; i++) {
        if (shrines[i].cooldownTimer > 0) {
          shrines[i].cooldownTimer = Math.max(0, shrines[i].cooldownTimer - delta);
        }
      }
    }

    // Citadel spinning runic seals & flickering beacon
    if (this.citadelResult) {
      for (let i = 0; i < this.citadelResult.animatedSpinners.length; i++) {
        this.citadelResult.animatedSpinners[i].rotation.z += delta * (i % 2 === 0 ? 0.38 : -0.45);
      }
    }

    // Ghostly silhouettes swaying gently in valley mist
    for (let i = 0; i < this.ghostSilhouettes.length; i++) {
      const g = this.ghostSilhouettes[i];
      const d = g.userData;
      g.position.y = d.baseY + Math.sin(t * 1.1 + d.phase) * 0.35;
      g.position.x = d.baseX + Math.sin(t * 0.45 + d.phase) * 0.6;
    }

    if (this.moonHalo) {
      const s = 1.0 + Math.sin(t * 0.9) * 0.03;
      this.moonHalo.scale.set(s, s, 1);
    }

    // Occasional lightning in the clouds
    this.lightningCooldown -= delta;
    if (this.lightningCooldown <= 0) {
      this.lightningFlash = 1.0;
      this.lightningCooldown = 8.0 + Math.random() * 10.0;
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - delta * 4.5);
    }
    if (this.skyUniforms) {
      this.skyUniforms.uLightning.value = this.lightningFlash;
    }
  }

  public override dispose(): void {
    this.chunkStreamer?.dispose();
    this.chunkStreamer = null;
    this.citadelResult = null;
    this.locationsResult = null;
    this.ghostSilhouettes = [];
    super.dispose();
  }
}
