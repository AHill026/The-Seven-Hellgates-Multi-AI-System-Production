import * as THREE from 'three';
import { EnvironmentBoxCollider, EnvironmentCylinderCollider } from '../types';

export const LIMBO_WORLD_HALF_SIZE = 160;
export const LIMBO_WORLD_SIZE = 320;
export const LIMBO_PLAYABLE_LIMIT = 152;
export const LIMBO_CHUNK_SIZE = 40;
export const LIMBO_CHUNKS_PER_SIDE = 8; // 8 * 40 = 320m

export interface LimboZoneInfo {
  id: string;
  name: string;
  subtitle: string;
  center: THREE.Vector3;
  radius: number;
}

export interface LimboPOICoords {
  outerRuinsSpawn: THREE.Vector3;
  forgottenSettlement: THREE.Vector3;
  abandonedBattlefield: THREE.Vector3;
  westShrine: THREE.Vector3;
  eastShrine: THREE.Vector3;
  hiddenCave: THREE.Vector3;
  secretRelicChamber: THREE.Vector3;
  ruinedWatchtower: THREE.Vector3;
  watchtowerLookout: THREE.Vector3;
  undergroundCryptEntry: THREE.Vector3;
  undergroundCryptChamber: THREE.Vector3;
  citadelGate: THREE.Vector3;
  citadelCourtyard: THREE.Vector3;
  citadelThrone: THREE.Vector3;
  citadelHellgate: THREE.Vector3;
}

export const LIMBO_ZONES: LimboZoneInfo[] = [
  {
    id: 'outer_ruins',
    name: 'Outer Ruins',
    subtitle: 'Shattered Overlook of the First Gate',
    center: new THREE.Vector3(0, 2.6, 114),
    radius: 20,
  },
  {
    id: 'forgotten_settlement',
    name: 'Hollowstead Hamlet',
    subtitle: 'Forgotten Settlement Buried in Cold Ash',
    center: new THREE.Vector3(-64, 1.8, 72),
    radius: 20,
  },
  {
    id: 'abandoned_battlefield',
    name: 'Field of Broken Oath',
    subtitle: 'Frozen Banners of a Forgotten Vanguard',
    center: new THREE.Vector3(68, 1.2, 66),
    radius: 22,
  },
  {
    id: 'moonstone_bridge',
    name: 'Moonstone Gorge',
    subtitle: 'Ancient Stone Spans Above the Bottomless Mist',
    center: new THREE.Vector3(0, 2.6, 30),
    radius: 17,
  },
  {
    id: 'west_shrine',
    name: 'Shrine of Iron Vigor',
    subtitle: 'Moonlit Altar of the Outer Ridge',
    center: new THREE.Vector3(-88, 4.4, 18),
    radius: 13,
  },
  {
    id: 'east_shrine',
    name: 'Shrine of Frostblood',
    subtitle: 'Weeping Sanctuary of Pale Flames',
    center: new THREE.Vector3(94, 3.8, -18),
    radius: 13,
  },
  {
    id: 'hidden_cave',
    name: 'Hollowed Crystal Cavern',
    subtitle: 'Bioluminescent Rift Beneath the Western Crags',
    center: new THREE.Vector3(-114, 2.0, -4),
    radius: 17,
  },
  {
    id: 'secret_relic_chamber',
    name: 'Sanctum of the First Seal',
    subtitle: 'Hidden Runic Vault Carved in Obsidian Cliff',
    center: new THREE.Vector3(116, 2.4, 12),
    radius: 15,
  },
  {
    id: 'ruined_watchtower',
    name: 'Moonwatch Keep',
    subtitle: 'Crumbling Citadel Lookout Tower',
    center: new THREE.Vector3(-90, 6.8, -56),
    radius: 16,
  },
  {
    id: 'underground_crypt',
    name: 'Vault of First Kings',
    subtitle: 'Subterranean Catacomb Beneath the Ash',
    center: new THREE.Vector3(84, -5.5, -64),
    radius: 17,
  },
  {
    id: 'ancient_citadel',
    name: 'The Ancient Citadel',
    subtitle: 'Seat of the Hollow King',
    center: new THREE.Vector3(0, 6.0, -100),
    radius: 42,
  },
];

export type LimboSurfaceKind =
  | 'ash'
  | 'road'
  | 'stone_citadel'
  | 'bridge'
  | 'ravine'
  | 'battlefield'
  | 'crypt'
  | 'cave';

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getRavineCenterZ(x: number): number {
  return 30.0 + Math.sin(x * 0.032) * 5.2;
}

export function getKingsRoadCenterX(z: number): number {
  const wander = Math.sin(z * 0.042) * 4.5 * smoothstep(50, 95, z) * (1 - smoothstep(102, 118, z));
  return wander;
}

function isOnGrandBridge(x: number, z: number): boolean {
  return Math.abs(x) <= 4.75 && z >= 15.5 && z <= 45.5;
}

function isOnWestCauseway(x: number, z: number): boolean {
  return x >= -61.5 && x <= -54.5 && z >= 14.0 && z <= 44.0;
}

function isOnEastCrossing(x: number, z: number): boolean {
  return x >= 54.5 && x <= 61.5 && z >= 14.0 && z <= 44.0;
}

export function isOnAnyRavineBridge(x: number, z: number): boolean {
  return isOnGrandBridge(x, z) || isOnWestCauseway(x, z) || isOnEastCrossing(x, z);
}

export function getBridgeSurfaceHeight(x: number, z: number): number | null {
  if (isOnGrandBridge(x, z)) {
    const t = (z - 30.5) / 15.0;
    return 2.15 + 0.85 * Math.max(0, Math.cos(t * (Math.PI * 0.5)));
  }
  if (isOnWestCauseway(x, z)) {
    const t = (z - 29.0) / 15.0;
    return 2.05 + 0.5 * Math.max(0, Math.cos(t * (Math.PI * 0.5)));
  }
  if (isOnEastCrossing(x, z)) {
    const t = (z - 29.0) / 15.0;
    return 1.85 + 0.5 * Math.max(0, Math.cos(t * (Math.PI * 0.5)));
  }
  return null;
}

function flattenPlateau(
  currentH: number,
  x: number,
  z: number,
  cx: number,
  cz: number,
  innerR: number,
  outerR: number,
  targetH: number
): number {
  const dist = Math.hypot(x - cx, z - cz);
  if (dist >= outerR) return currentH;
  const w = 1.0 - smoothstep(innerR, outerR, dist);
  return lerp(currentH, targetH, w);
}

/**
 * Deterministic O(1) continuous terrain elevation sampler across the 320m x 320m Limbo kingdom.
 */
export function getLimboGroundHeightAt(x: number, z: number): number {
  // 1. Check walkable stone bridges spanning Moonstone Gorge first
  const bridgeY = getBridgeSurfaceHeight(x, z);
  if (bridgeY !== null) {
    return bridgeY;
  }

  // 2. Ancient Citadel Courtyard + Throne Chamber Dais + Grand Approach Staircase
  if (x >= -42 && x <= 42 && z >= -140 && z <= -68) {
    let h = 6.0;
    // Stepped Throne Dais at northern apse
    if (Math.abs(x) <= 13 && z <= -116 && z >= -137) {
      const daisT = smoothstep(-116, -120, z);
      h = lerp(6.0, 6.8, daisT);
    }
    return h;
  }

  // Grand Citadel Staircase (z = -48 -> -68, x in [-9, 9])
  if (Math.abs(x) <= 9.2 && z > -68 && z <= -46) {
    const stairBlend = smoothstep(-46, -68, z);
    // Crisp stone step profile blended slightly so motion stays fluid
    const rawStep = Math.floor(stairBlend * 14) / 14;
    const smoothStep = lerp(stairBlend, rawStep, 0.35);
    return lerp(1.5, 6.0, smoothStep);
  }

  // 3. Base rolling misty valley hills & ridges
  let h =
    Math.sin(x * 0.038) * Math.cos(z * 0.036) * 2.2 +
    Math.sin(x * 0.092 + 1.3) * Math.sin(z * 0.085 - 0.7) * 0.85 +
    Math.cos((x + z) * 0.025) * 1.1 +
    1.15;

  // Raise southern horizon overlook gently toward Outer Ruins
  h += smoothstep(75, 130, z) * 1.3;

  // Outer perimeter mountain ring (beyond playable limits)
  const edgeDist = Math.max(Math.abs(x), Math.abs(z));
  if (edgeDist > 134) {
    const wallT = smoothstep(134, 158, edgeDist);
    const ridgeNoise = 0.65 + 0.35 * Math.sin(x * 0.14) * Math.cos(z * 0.14);
    h += wallT * 14.5 * ridgeNoise;
  }

  // 4. Carve the Ruined King's Road gentle grade
  const roadX = getKingsRoadCenterX(z);
  const roadDist = Math.abs(x - roadX);
  if (z >= -48 && z <= 122 && roadDist < 12) {
    const roadW = 1.0 - smoothstep(4.2, 12.0, roadDist);
    const targetRoadY =
      z > 45
        ? lerp(1.4, 2.55, smoothstep(48, 112, z))
        : lerp(1.4, 1.85, smoothstep(-48, 16, z));
    h = lerp(h, targetRoadY, roadW);
  }

  // 5. Flatten POI plateaus cleanly
  h = flattenPlateau(h, x, z, 0, 114, 12, 22, 2.6); // Outer Ruins
  h = flattenPlateau(h, x, z, -64, 72, 13, 22, 1.8); // Forgotten Settlement
  h = flattenPlateau(h, x, z, 68, 66, 15, 24, 1.2); // Abandoned Battlefield
  h = flattenPlateau(h, x, z, -88, 18, 7, 14, 4.4); // West Overlook Shrine
  h = flattenPlateau(h, x, z, 94, -18, 7, 14, 3.8); // East Sanctum Shrine
  h = flattenPlateau(h, x, z, -114, -4, 11, 18, 2.0); // Hidden Cave
  h = flattenPlateau(h, x, z, 116, 12, 9, 16, 2.4); // Secret Relic Chamber
  h = flattenPlateau(h, x, z, 0, -34, 12, 22, 1.5); // Citadel Forecourt approach

  // 6. Ruined Watchtower hill & exterior spiral stone ramp (-90, -56)
  h = flattenPlateau(h, x, z, -90, -56, 11, 22, 6.8);
  const wdx = x + 90;
  const wdz = z + 56;
  const wDist = Math.hypot(wdx, wdz);
  if (wDist >= 3.9 && wDist <= 8.8) {
    // Clockwise spiral ramp starting at South (+PI/2, prog=0) rising up to West lookout landing
    const ang = Math.atan2(wdz, wdx);
    let cw = Math.PI * 0.5 - ang;
    if (cw < 0) cw += Math.PI * 2;
    const radialBlend = 1.0 - smoothstep(7.8, 8.8, wDist);
    if (cw <= Math.PI * 1.38) {
      const rampProg = clamp01(cw / (Math.PI * 1.38));
      const rampH = lerp(6.8, 11.2, rampProg);
      h = Math.max(h, lerp(6.8, rampH, radialBlend));
    } else if (cw <= Math.PI * 1.58) {
      // Top lookout platform covering cw = 1.5 * PI (-96.2, -56)
      h = Math.max(h, lerp(6.8, 11.2, radialBlend));
    }
  }

  // 7. Underground Crypt descent corridor & subterranean vault (+84, -40..-74)
  if (x >= 70 && x <= 98 && z >= -76 && z <= -34) {
    // Entry terrace at z = -34..-40 (y = 2.0)
    if (z >= -40) {
      const t = 1.0 - smoothstep(7, 13, Math.abs(x - 84));
      h = lerp(h, 2.0, t);
    } else if (z >= -54 && x >= 78 && x <= 90) {
      // Walkable downward stone staircase (-40 -> -54: y 2.0 -> -5.5)
      const descendT = smoothstep(-40, -54, z);
      const stepY = lerp(2.0, -5.5, descendT);
      h = stepY;
    } else if (z < -54 && x >= 72 && x <= 96 && z >= -74) {
      // Subterranean Vault Floor
      h = -5.5;
    }
  }

  // 8. Carve the deep Moonstone Gorge (Ravine) outside bridges
  const ravZ = getRavineCenterZ(x);
  const ravDist = Math.abs(z - ravZ);
  if (ravDist < 12.5) {
    const carve = 1.0 - smoothstep(4.8, 12.5, ravDist);
    h = lerp(h, -11.5, carve);
  }

  return h;
}

/**
 * Classifies ground surface material/vertex tint at world (x, z).
 */
export function getLimboSurfaceKind(x: number, z: number): LimboSurfaceKind {
  if (isOnAnyRavineBridge(x, z)) return 'bridge';
  if (x >= -42 && x <= 42 && z >= -140 && z <= -46 && (z <= -68 || Math.abs(x) <= 9.2)) {
    return 'stone_citadel';
  }
  if (x >= 72 && x <= 96 && z >= -74 && z <= -40) return 'crypt';
  if (Math.hypot(x + 114, z + 4) < 12) return 'cave';
  if (Math.hypot(x - 68, z - 66) < 17) return 'battlefield';

  const ravDist = Math.abs(z - getRavineCenterZ(x));
  if (ravDist < 9.5) return 'ravine';

  const roadDist = Math.abs(x - getKingsRoadCenterX(z));
  if (z >= -48 && z <= 118 && roadDist < 4.4) return 'road';
  if (Math.hypot(x, z - 114) < 13) return 'road';
  if (Math.hypot(x + 64, z - 72) < 13) return 'road';
  if (Math.hypot(x + 90, z + 56) < 9.0) return 'stone_citadel';

  return 'ash';
}

export function isLimboWalkableAt(x: number, z: number): boolean {
  if (Math.abs(x) > LIMBO_PLAYABLE_LIMIT || Math.abs(z) > LIMBO_PLAYABLE_LIMIT) {
    return false;
  }

  // Walkable bridges are always valid over the ravine
  if (isOnAnyRavineBridge(x, z)) return true;

  // Prevent dropping into the bottomless Moonstone Gorge outside bridges
  const ravDist = Math.abs(z - getRavineCenterZ(x));
  if (ravDist < 6.8) {
    return false;
  }

  // Prevent dropping off the elevated Citadel outside the Grand Staircase
  if (x >= -43 && x <= 43 && z >= -141 && z <= -66.5) {
    return true;
  }

  // Keep Crypt chamber inside vaulted walls cleanly
  if (x >= 70 && x <= 98 && z >= -76 && z <= -54) {
    return x >= 72.5 && x <= 95.5 && z >= -73.5;
  }

  return true;
}

export function getLimboPOICoords(): LimboPOICoords {
  return {
    outerRuinsSpawn: new THREE.Vector3(0, getLimboGroundHeightAt(0, 116), 116),
    forgottenSettlement: new THREE.Vector3(-64, getLimboGroundHeightAt(-64, 72), 72),
    abandonedBattlefield: new THREE.Vector3(68, getLimboGroundHeightAt(68, 66), 66),
    westShrine: new THREE.Vector3(-88, getLimboGroundHeightAt(-88, 18), 18),
    eastShrine: new THREE.Vector3(94, getLimboGroundHeightAt(94, -18), -18),
    hiddenCave: new THREE.Vector3(-114, getLimboGroundHeightAt(-114, -4), -4),
    secretRelicChamber: new THREE.Vector3(116, getLimboGroundHeightAt(116, 12), 12),
    ruinedWatchtower: new THREE.Vector3(-90, getLimboGroundHeightAt(-90, -56), -56),
    watchtowerLookout: new THREE.Vector3(-96.2, getLimboGroundHeightAt(-96.2, -56), -56),
    undergroundCryptEntry: new THREE.Vector3(84, getLimboGroundHeightAt(84, -36), -36),
    undergroundCryptChamber: new THREE.Vector3(84, -5.5, -64),
    citadelGate: new THREE.Vector3(0, 6.0, -68),
    citadelCourtyard: new THREE.Vector3(0, 6.0, -96),
    citadelThrone: new THREE.Vector3(0, 6.8, -124),
    citadelHellgate: new THREE.Vector3(0, 6.8, -133),
  };
}

export function getLimboZoneAt(x: number, z: number): LimboZoneInfo {
  for (let i = 0; i < LIMBO_ZONES.length; i++) {
    const zone = LIMBO_ZONES[i];
    if (zone.id === 'ancient_citadel') {
      if (x >= -42 && x <= 42 && z >= -140 && z <= -66) return zone;
      continue;
    }
    if (zone.id === 'underground_crypt') {
      if (x >= 70 && x <= 98 && z >= -76 && z <= -38) return zone;
      continue;
    }
    if (Math.hypot(x - zone.center.x, z - zone.center.z) <= zone.radius) {
      return zone;
    }
  }
  return {
    id: z > 30 ? 'southern_valley' : 'northern_wilds',
    name: z > 30 ? 'Ashen Valley' : 'Mistlands of Limbo',
    subtitle: z > 30 ? "The King's Shattered Causeway" : 'Approach to the Ancient Citadel',
    center: new THREE.Vector3(0, 1.5, z > 30 ? 60 : -20),
    radius: 60,
  };
}

export function collectStaticLimboColliders(): {
  cylinders: EnvironmentCylinderCollider[];
  boxes: EnvironmentBoxCollider[];
} {
  const cylinders: EnvironmentCylinderCollider[] = [];
  const boxes: EnvironmentBoxCollider[] = [];

  // 1. Ancient Citadel Curtain Walls (South Gate leaves [-7.4, +7.4] open!)
  boxes.push({ minX: -43, maxX: -7.6, minZ: -70.2, maxZ: -66.5 }); // South-West Curtain Wall
  boxes.push({ minX: 7.6, maxX: 43, minZ: -70.2, maxZ: -66.5 }); // South-East Curtain Wall
  boxes.push({ minX: -43, maxX: -39.2, minZ: -138, maxZ: -67 }); // West Curtain Wall
  boxes.push({ minX: 39.2, maxX: 43, minZ: -138, maxZ: -67 }); // East Curtain Wall
  boxes.push({ minX: -42, maxX: 42, minZ: -139.5, maxZ: -136.2 }); // North Apse Rear Wall

  // Grand Staircase Flanking Balustrades
  boxes.push({ minX: -10.8, maxX: -8.9, minZ: -68, maxZ: -46 });
  boxes.push({ minX: 8.9, maxX: 10.8, minZ: -68, maxZ: -46 });

  // Gatehouse Towers & Corner Keeps
  cylinders.push({ x: -8.8, z: -68, radius: 1.6 });
  cylinders.push({ x: 8.8, z: -68, radius: 1.6 });
  cylinders.push({ x: -39.5, z: -69, radius: 3.2 });
  cylinders.push({ x: 39.5, z: -69, radius: 3.2 });
  cylinders.push({ x: -39.5, z: -134, radius: 3.2 });
  cylinders.push({ x: 39.5, z: -134, radius: 3.2 });

  // Hollow King's Obsidian Throne monument base (far rear of dais)
  boxes.push({ minX: -3.2, maxX: 3.2, minZ: -129.0, maxZ: -125.6 });

  // Courtyard Broken Statues & Colonade Pillars (kept wide around combat ring)
  const courtyardPillars: [number, number][] = [
    [-25, -80],
    [25, -80],
    [-26, -98],
    [26, -98],
    [-25, -116],
    [25, -116],
  ];
  courtyardPillars.forEach(([px, pz]) => cylinders.push({ x: px, z: pz, radius: 1.35 }));

  // 2. Bridge Stone Parapets (Prevent rolling/falling off bridges into ravine!)
  // Grand Bridge
  boxes.push({ minX: -5.6, maxX: -4.65, minZ: 15.5, maxZ: 45.5 });
  boxes.push({ minX: 4.65, maxX: 5.6, minZ: 15.5, maxZ: 45.5 });
  // West Broken Causeway
  boxes.push({ minX: -62.4, maxX: -61.4, minZ: 14.0, maxZ: 44.0 });
  boxes.push({ minX: -54.6, maxX: -53.6, minZ: 14.0, maxZ: 44.0 });
  // East Pilgrim's Crossing
  boxes.push({ minX: 53.6, maxX: 54.6, minZ: 14.0, maxZ: 44.0 });
  boxes.push({ minX: 61.4, maxX: 62.4, minZ: 14.0, maxZ: 44.0 });

  // 3. Watchtower Core Tower Cylinder
  cylinders.push({ x: -90, z: -56, radius: 3.7 });

  // 4. Underground Crypt Stair & Chamber Retaining Walls
  boxes.push({ minX: 76.5, maxX: 78.4, minZ: -55.0, maxZ: -39.0 }); // West stair wall
  boxes.push({ minX: 89.6, maxX: 91.5, minZ: -55.0, maxZ: -39.0 }); // East stair wall
  boxes.push({ minX: 70.0, maxX: 72.4, minZ: -75.5, maxZ: -54.0 }); // West crypt wall
  boxes.push({ minX: 95.6, maxX: 98.0, minZ: -75.5, maxZ: -54.0 }); // East crypt wall
  boxes.push({ minX: 70.5, maxX: 97.5, minZ: -76.5, maxZ: -73.8 }); // North crypt rear wall

  // 5. Hidden Cave Flanking Rock Walls (West opening remains clear!)
  boxes.push({ minX: -127, maxX: -124, minZ: -17, maxZ: 9 }); // West rear cavern wall
  boxes.push({ minX: -125, maxX: -106, minZ: -17.5, maxZ: -14.2 }); // North cavern wall
  boxes.push({ minX: -125, maxX: -106, minZ: 6.2, maxZ: 9.5 }); // South cavern wall

  // 6. Shrine Altars (small central plinth)
  cylinders.push({ x: -88, z: 18, radius: 1.25 });
  cylinders.push({ x: 94, z: -18, radius: 1.25 });

  // 7. Forgotten Settlement Ruins Houses
  boxes.push({ minX: -76, maxX: -70, minZ: 66, maxZ: 72 });
  boxes.push({ minX: -58, maxX: -52, minZ: 76, maxZ: 82 });
  boxes.push({ minX: -74, maxX: -68, minZ: 80, maxZ: 85 });

  // 8. Secret Relic Chamber Rear Walls
  boxes.push({ minX: 124, maxX: 128, minZ: 3, maxZ: 21 });
  cylinders.push({ x: 112, z: 4, radius: 1.1 });
  cylinders.push({ x: 112, z: 20, radius: 1.1 });

  return { cylinders, boxes };
}
