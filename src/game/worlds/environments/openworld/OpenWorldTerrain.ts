import * as THREE from 'three';
import { OpenWorldBridgeDef, OpenWorldRealmConfig, OpenWorldZoneInfo } from './OpenWorldRealmTypes';

export type OpenWorldSurfaceKind = 'arena' | 'bridge' | 'road' | 'chasm' | 'ridge' | 'ground';

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getChasmCenterZ(config: OpenWorldRealmConfig, x: number): number {
  return config.chasmZ + Math.sin(x * 0.036 + config.realmId) * 4.5;
}

export function getPilgrimageRoadCenterX(config: OpenWorldRealmConfig, z: number): number {
  return (
    Math.sin(z * 0.045 + config.realmId * 0.8) *
    4.0 *
    smoothstep(45, 78, z) *
    (1 - smoothstep(82, 98, z))
  );
}

export function getMatchingBridge(
  config: OpenWorldRealmConfig,
  x: number,
  z: number
): OpenWorldBridgeDef | null {
  for (let i = 0; i < config.bridges.length; i++) {
    const b = config.bridges[i];
    if (Math.abs(x - b.x) <= b.halfWidth && z >= b.zMin && z <= b.zMax) {
      return b;
    }
  }
  return null;
}

export function getBridgeSurfaceY(bridge: OpenWorldBridgeDef, z: number): number {
  const midZ = (bridge.zMin + bridge.zMax) * 0.5;
  const halfLen = Math.max(1, (bridge.zMax - bridge.zMin) * 0.5);
  const t = (z - midZ) / halfLen;
  return bridge.deckY + bridge.archHeight * Math.max(0, Math.cos(t * Math.PI * 0.5));
}

export function sampleOpenWorldHeight(config: OpenWorldRealmConfig, x: number, z: number): number {
  // 1. Walkable bridges across the central chasm/river
  const bridge = getMatchingBridge(config, x, z);
  if (bridge) {
    return getBridgeSurfaceY(bridge, z);
  }

  // 2. Flat Northern Sovereign Sanctum Boss Arena (y = 0.0 so all Sovereign Boss rigs align cleanly)
  const arenaDist = Math.hypot(x - config.arenaCenter.x, z - config.arenaCenter.z);
  if (arenaDist <= config.arenaRadius + 4.0) {
    return 0.0;
  }

  // 3. Base rolling dark-fantasy terrain hills
  const seed = config.realmId * 1.37;
  let h =
    (Math.sin(x * 0.042 + seed) * Math.cos(z * 0.038 - seed) * 1.85 +
      Math.sin(x * 0.095 - seed * 0.7) * Math.sin(z * 0.088 + seed) * 0.75 +
      Math.cos((x - z) * 0.028) * 0.85) *
      config.hillAmp +
    1.15;

  // Raise southern overlook toward spawn threshold
  h += smoothstep(66, 108, z) * 1.15;

  // Outer perimeter mountain/cliff walls outside playable bounds
  const edgeDist = Math.max(Math.abs(x), Math.abs(z));
  const rimStart = config.playableLimit - 14;
  if (edgeDist > rimStart) {
    const wallT = smoothstep(rimStart, config.worldHalfSize - 2, edgeDist);
    const noise = 0.7 + 0.3 * Math.sin(x * 0.14 + seed) * Math.cos(z * 0.14);
    h += wallT * 13.5 * noise;
  }

  // 4. Gentle Pilgrimage Road grade from Southern Spawn to Northern Sanctum Gate
  const roadX = getPilgrimageRoadCenterX(config, z);
  const roadDist = Math.abs(x - roadX);
  if (z >= -52 && z <= 104 && roadDist < 11) {
    const roadW = 1.0 - smoothstep(4.2, 11.0, roadDist);
    const targetRoadY = z > config.chasmZ ? 1.85 : lerp(0.0, 1.85, smoothstep(-50, 12, z));
    h = lerp(h, targetRoadY, roadW);
  }

  // 5. Landmark plateaus (Outposts, Shrines, Vaults)
  for (let i = 0; i < config.plateaus.length; i++) {
    const p = config.plateaus[i];
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < p.outerR) {
      const w = 1.0 - smoothstep(p.innerR, p.outerR, d);
      h = lerp(h, p.targetY, w);
    }
  }

  // 6. Smooth transition collar into the Northern Sovereign Sanctum (y = 0)
  if (arenaDist < config.arenaRadius + 16.0) {
    const collarW = 1.0 - smoothstep(config.arenaRadius + 4.0, config.arenaRadius + 16.0, arenaDist);
    h = lerp(h, 0.0, collarW);
  }

  // 7. Central Chasm / River Trench (bridges return earlier on step 1)
  const chasmCz = getChasmCenterZ(config, x);
  const chasmDist = Math.abs(z - chasmCz);
  if (chasmDist < config.chasmHalfWidth) {
    const t = 1.0 - smoothstep(config.chasmHalfWidth * 0.42, config.chasmHalfWidth, chasmDist);
    h = lerp(h, -config.chasmDepth, t);
  }

  return h;
}

export function isOpenWorldWalkable(config: OpenWorldRealmConfig, x: number, z: number): boolean {
  if (Math.abs(x) > config.playableLimit || Math.abs(z) > config.playableLimit) {
    return false;
  }

  // Bridges are always walkable over the chasm
  if (getMatchingBridge(config, x, z)) {
    return true;
  }

  // Chasm interior (without a bridge) blocks passage cleanly so Azrael never falls into river/void
  const chasmCz = getChasmCenterZ(config, x);
  if (Math.abs(z - chasmCz) < config.chasmHalfWidth * 0.62) {
    return false;
  }

  // Keep Northern Sanctum boundary wall open at the Southern Gate Approach, bounded around far north edge
  const arenaDist = Math.hypot(x - config.arenaCenter.x, z - config.arenaCenter.z);
  if (arenaDist > config.arenaRadius && arenaDist < config.arenaRadius + 2.2) {
    // Allow entry through Southern Sanctum Gate (x in [-8, 8], z > arenaCenter.z)
    const inSouthGate = Math.abs(x - config.arenaCenter.x) <= 8.5 && z > config.arenaCenter.z;
    if (!inSouthGate) {
      return false;
    }
  }

  return true;
}

export function getOpenWorldSurfaceKind(
  config: OpenWorldRealmConfig,
  x: number,
  z: number
): OpenWorldSurfaceKind {
  if (getMatchingBridge(config, x, z)) return 'bridge';
  const arenaDist = Math.hypot(x - config.arenaCenter.x, z - config.arenaCenter.z);
  if (arenaDist <= config.arenaRadius + 4.2) return 'arena';
  const chasmCz = getChasmCenterZ(config, x);
  if (Math.abs(z - chasmCz) < config.chasmHalfWidth * 0.72) return 'chasm';
  const roadX = getPilgrimageRoadCenterX(config, z);
  if (z >= -56 && z <= 102 && Math.abs(x - roadX) < 5.0) return 'road';
  if (Math.max(Math.abs(x), Math.abs(z)) > config.playableLimit - 12) return 'ridge';
  return 'ground';
}

export function resolveOpenWorldZoneAt(
  config: OpenWorldRealmConfig,
  x: number,
  z: number
): OpenWorldZoneInfo {
  for (let i = 0; i < config.zones.length; i++) {
    const zInfo = config.zones[i];
    const d = Math.hypot(x - zInfo.center.x, z - zInfo.center.z);
    if (d <= zInfo.radius) {
      return zInfo;
    }
  }

  if (z > config.chasmZ) {
    return {
      id: `realm_${config.realmId}_south_wilds`,
      name: config.zones[0]?.name || 'Outer Threshold',
      subtitle: 'Shadowed Approaches Beyond the Chasm',
      center: new THREE.Vector3(0, 1.5, 70),
      radius: 40,
    };
  }
  return {
    id: `realm_${config.realmId}_north_wilds`,
    name: config.sanctumName,
    subtitle: 'Approaching the Sovereign Sanctum',
    center: config.arenaCenter.clone(),
    radius: 40,
  };
}
