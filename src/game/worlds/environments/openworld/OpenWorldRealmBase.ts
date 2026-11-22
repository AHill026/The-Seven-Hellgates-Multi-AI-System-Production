import * as THREE from 'three';
import { BaseRealmEnvironment } from '../BaseRealmEnvironment';
import { EnvironmentGraphicsPreset, RealmLandmarkCoords } from '../types';
import {
  InteractiveLoreNode,
  InteractiveRelicNode,
  InteractiveShrineNode,
} from '../limbo/LimboLocationsBuilder';
import { OpenWorldChunkStreamer } from './OpenWorldChunkStreamer';
import { buildOpenWorldLocations, OpenWorldLocationsResult } from './OpenWorldLocationsBuilder';
import { OpenWorldExploreRuntime, OpenWorldRealmConfig, OpenWorldZoneInfo } from './OpenWorldRealmTypes';
import {
  getChasmCenterZ,
  isOpenWorldWalkable,
  resolveOpenWorldZoneAt,
  sampleOpenWorldHeight,
} from './OpenWorldTerrain';

export abstract class OpenWorldRealmBase
  extends BaseRealmEnvironment
  implements OpenWorldExploreRuntime
{
  protected chunkStreamer: OpenWorldChunkStreamer | null = null;
  protected locationsResult: OpenWorldLocationsResult | null = null;
  protected arenaAnchorGroup: THREE.Group;
  private cachedLandmarks: RealmLandmarkCoords | null = null;

  constructor() {
    super();
    this.arenaAnchorGroup = new THREE.Group();
  }

  public abstract getOpenWorldConfig(): OpenWorldRealmConfig;

  public override getGroundHeightAt(x: number, z: number): number {
    return sampleOpenWorldHeight(this.getOpenWorldConfig(), x, z);
  }

  public override isWalkableAt(x: number, z: number): boolean {
    return isOpenWorldWalkable(this.getOpenWorldConfig(), x, z);
  }

  public override constrainMovement(
    prevPos: THREE.Vector3,
    nextPos: THREE.Vector3,
    entityRadius: number = 0.7
  ): void {
    const cfg = this.getOpenWorldConfig();
    nextPos.x = Math.max(-cfg.playableLimit, Math.min(cfg.playableLimit, nextPos.x));
    nextPos.z = Math.max(-cfg.playableLimit, Math.min(cfg.playableLimit, nextPos.z));

    const prevX = prevPos.x;
    const prevZ = prevPos.z;
    const prevY = sampleOpenWorldHeight(cfg, prevX, prevZ);

    const canStepTo = (tx: number, tz: number): boolean => {
      if (!isOpenWorldWalkable(cfg, tx, tz)) return false;
      const dist = Math.hypot(tx - prevX, tz - prevZ);
      if (dist < 0.001) return true;
      const ny = sampleOpenWorldHeight(cfg, tx, tz);
      const slope = Math.abs(ny - prevY) / Math.max(0.2, dist);
      if (slope > 1.85 && Math.abs(ny - prevY) > 1.1) {
        return false;
      }
      return true;
    };

    if (!canStepTo(nextPos.x, nextPos.z)) {
      if (canStepTo(nextPos.x, prevZ)) {
        nextPos.z = prevZ;
      } else if (canStepTo(prevX, nextPos.z)) {
        nextPos.x = prevX;
      } else {
        nextPos.x = prevX;
        nextPos.z = prevZ;
      }
    }

    this.resolveCollision(nextPos, entityRadius);
    this.resolveCollision(nextPos, entityRadius);

    if (!isOpenWorldWalkable(cfg, nextPos.x, nextPos.z)) {
      nextPos.x = prevX;
      nextPos.z = prevZ;
    }
    nextPos.y = sampleOpenWorldHeight(cfg, nextPos.x, nextPos.z);
  }

  public override getLandmarks(): RealmLandmarkCoords {
    if (!this.cachedLandmarks) {
      const cfg = this.getOpenWorldConfig();
      this.cachedLandmarks = {
        spawnPos: cfg.spawnPos.clone(),
        spawnRotY: Math.PI,
        breachCenter: cfg.arenaCenter.clone(),
        bossArenaCenter: cfg.arenaCenter.clone(),
        bossSpawnPos: cfg.bossSpawnPos.clone(),
        hellgatePos: cfg.hellgatePos.clone(),
        arenaRadius: cfg.arenaRadius,
        isOpenWorld: true,
      };
    }
    return this.cachedLandmarks;
  }

  public getZoneAt(x: number, z: number): OpenWorldZoneInfo {
    return resolveOpenWorldZoneAt(this.getOpenWorldConfig(), x, z);
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

  protected buildOpenWorldFoundation(): void {
    const cfg = this.getOpenWorldConfig();

    // 1. Chunk-streamed 280m x 280m open-world terrain + instanced realm props
    this.chunkStreamer = new OpenWorldChunkStreamer(cfg);
    this.group.add(this.chunkStreamer.group);
    this.chunkStreamer.update(cfg.spawnPos, this.preset);

    // 2. Central Chasm River (Blood / Molten Gold / Magma) if configured
    if (cfg.palette.hasRiver && cfg.palette.riverColors) {
      const riverMat = this.createLiquidMaterial({
        ...cfg.palette.riverColors,
        scaleX: 16,
        scaleY: 3,
      });
      const riverPlane = new THREE.Mesh(
        this.trackGeometry(new THREE.PlaneGeometry(cfg.worldHalfSize * 2, cfg.chasmHalfWidth * 2.2, 32, 4)),
        riverMat
      );
      riverPlane.rotation.x = -Math.PI / 2;
      riverPlane.position.set(0, cfg.palette.riverY, getChasmCenterZ(cfg, 0));
      this.group.add(riverPlane);
    }

    // 3. Walkable Bridges, Gates, Outposts, Shrines, Relics & Lore Tablets
    this.locationsResult = buildOpenWorldLocations(
      cfg,
      (g) => this.trackGeometry(g),
      (m) => this.trackMaterial(m),
      (obj, tier) => this.registerDetailObject(obj, tier)
    );
    this.group.add(this.locationsResult.group);

    // 4. Anchor Northern Sovereign Sanctum Group cleanly at arenaCenter (0, 0, -84)
    this.arenaAnchorGroup = new THREE.Group();
    this.arenaAnchorGroup.position.copy(cfg.arenaCenter);
    this.group.add(this.arenaAnchorGroup);
  }

  /**
   * Registers an arena collider in Sanctum-local coordinates (automatically offset to arenaCenter).
   */
  protected addArenaCollider(localX: number, localZ: number, radius: number): void {
    const cfg = this.getOpenWorldConfig();
    this.addCollider(cfg.arenaCenter.x + localX, cfg.arenaCenter.z + localZ, radius);
  }

  protected updateOpenWorldRuntime(delta: number, playerPos?: THREE.Vector3): void {
    if (this.chunkStreamer) {
      this.chunkStreamer.update(playerPos || this.getOpenWorldConfig().spawnPos, this.preset);
    }
    if (this.locationsResult) {
      for (const shrine of this.locationsResult.shrines) {
        if (shrine.cooldownTimer > 0) {
          shrine.cooldownTimer = Math.max(0, shrine.cooldownTimer - delta);
        }
      }
      for (const fl of this.locationsResult.flickerLights) {
        fl.light.intensity =
          fl.baseIntensity +
          Math.sin(this.elapsed * 5.2 + fl.phase) * 0.35 +
          Math.cos(this.elapsed * 8.4 + fl.phase) * 0.15;
      }
      for (const sp of this.locationsResult.spinners) {
        sp.rotation.y += delta * 1.4;
      }
    }
  }

  public override setGraphicsPreset(preset: EnvironmentGraphicsPreset): void {
    super.setGraphicsPreset(preset);
    if (this.chunkStreamer) {
      this.chunkStreamer.setPreset(preset);
    }
  }

  public override dispose(): void {
    if (this.chunkStreamer) {
      this.chunkStreamer.dispose();
      this.chunkStreamer = null;
    }
    this.locationsResult = null;
    this.cachedLandmarks = null;
    super.dispose();
  }
}
