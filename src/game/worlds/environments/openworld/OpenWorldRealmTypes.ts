import * as THREE from 'three';
import { EnemyType } from '../../../types';
import { RealmEnvironment } from '../types';
import {
  InteractiveLoreNode,
  InteractiveRelicNode,
  InteractiveShrineNode,
} from '../limbo/LimboLocationsBuilder';

export interface OpenWorldZoneInfo {
  id: string;
  name: string;
  subtitle: string;
  center: THREE.Vector3;
  radius: number;
}

export interface OpenWorldBridgeDef {
  id: string;
  x: number;
  halfWidth: number;
  zMin: number;
  zMax: number;
  deckY: number;
  archHeight: number;
}

export interface OpenWorldPlateauDef {
  x: number;
  z: number;
  innerR: number;
  outerR: number;
  targetY: number;
}

export interface OpenWorldShrineSpec {
  id: string;
  name: string;
  buffName: string;
  buffDescription: string;
  x: number;
  z: number;
}

export interface OpenWorldRelicSpec {
  id: string;
  name: string;
  buffName: string;
  buffDescription: string;
  loreTitle: string;
  loreText: string;
  emberReward: number;
  x: number;
  z: number;
  requiresMiniBossId?: string;
}

export interface OpenWorldLoreSpec {
  id: string;
  title: string;
  text: string;
  emberReward: number;
  x: number;
  z: number;
}

export interface OpenWorldMemoryFragmentSpec {
  id: string;
  title: string;
  text: string;
  x: number;
  z: number;
}

export interface OpenWorldRoamingSpec {
  type: EnemyType;
  x: number;
  z: number;
  patrol: number;
  name?: string;
}

export interface OpenWorldMiniBossSpec {
  id: string;
  type: EnemyType;
  name: string;
  title: string;
  x: number;
  z: number;
  scale: number;
  hp: number;
  damage: number;
  emberReward: number;
  patrol: number;
  aggro: number;
  leash: number;
}

export interface OpenWorldBreachSpec {
  type: EnemyType;
  offsetX: number;
  offsetZ: number;
  name?: string;
  isGildedWarden?: boolean;
}

export interface OpenWorldPalette {
  groundBaseHex: number;
  groundRidgeHex: number;
  roadHex: number;
  arenaHex: number;
  chasmHex: number;
  stoneHex: number;
  trimHex: number;
  accentHex: number;
  shrineHex: number;
  relicHex: number;
  propPrimaryHex: number;
  propSecondaryHex: number;
  bannerColorCss: string;
  bridgeStyle: 'bone' | 'gold' | 'basalt' | 'marble' | 'iron' | 'astral';
  propStyle: 'flesh_bones' | 'gold_obelisks' | 'magma_spires' | 'gothic_ruins' | 'war_pikes' | 'astral_crystals';
  hasRiver: boolean;
  riverY: number;
  riverColors?: {
    colorDeep: number;
    colorMid: number;
    colorBright: number;
    flowSpeed: number;
    emissiveBoost: number;
  };
}

export interface OpenWorldRealmConfig {
  realmId: number;
  sanctumName: string;
  sanctumCompassName: string;
  exploreObjective: string;
  breachObjective: string;
  breachTitle: string;
  breachSubtitle: string;
  worldHalfSize: number;
  playableLimit: number;
  chunkSize: number;
  chunksPerSide: number;
  chasmZ: number;
  chasmHalfWidth: number;
  chasmDepth: number;
  hillAmp: number;
  arenaCenter: THREE.Vector3;
  arenaRadius: number;
  spawnPos: THREE.Vector3;
  bossSpawnPos: THREE.Vector3;
  hellgatePos: THREE.Vector3;
  bridges: OpenWorldBridgeDef[];
  plateaus: OpenWorldPlateauDef[];
  zones: OpenWorldZoneInfo[];
  shrines: OpenWorldShrineSpec[];
  relics: OpenWorldRelicSpec[];
  loreNodes: OpenWorldLoreSpec[];
  memoryFragments: OpenWorldMemoryFragmentSpec[];
  roamingSpawns: OpenWorldRoamingSpec[];
  miniBosses: OpenWorldMiniBossSpec[];
  breachWave: OpenWorldBreachSpec[];
  palette: OpenWorldPalette;
}

export interface OpenWorldExploreRuntime {
  getZoneAt(x: number, z: number): OpenWorldZoneInfo;
  getShrines(): InteractiveShrineNode[];
  getRelics(): InteractiveRelicNode[];
  getLoreNodes(): InteractiveLoreNode[];
  getOpenWorldConfig(): OpenWorldRealmConfig;
  getActiveChunkCount(): number;
  syncCollectedProgress(
    collectedRelics: string[],
    awakenedShrines: string[],
    discoveredLore: string[]
  ): void;
}

export function isOpenWorldExploreRuntime(
  env: RealmEnvironment | null | undefined
): env is RealmEnvironment & OpenWorldExploreRuntime {
  return Boolean(
    env &&
      typeof (env as unknown as OpenWorldExploreRuntime).getOpenWorldConfig === 'function' &&
      typeof (env as unknown as OpenWorldExploreRuntime).getZoneAt === 'function'
  );
}
