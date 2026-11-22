/**
 * The Seven Hellgates - Shared Realm Ecosystem Architecture
 * Core Type Definitions & Interfaces
 */

import * as THREE from 'three';

export type CreatureTier = 'wildlife' | 'common' | 'elite' | 'miniboss' | 'sovereign';

export type CreatureAIState =
  | 'idle'
  | 'roaming'
  | 'hunting'
  | 'feeding'
  | 'defending'
  | 'fleeing'
  | 'dead';

export type EcosystemLODState = 'active' | 'reduced' | 'dormant';

export interface EcosystemCreatureStats {
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  aggroRadius: number;
  feedingRate: number; // Meat consumed per second
  hungerLevel: number; // 0 (satiated) to 100 (starving)
  fearLevel: number;   // 0 to 100
  emberReward: number;
}

export interface EcosystemCreature {
  id: string;
  name: string;
  tier: CreatureTier;
  state: CreatureAIState;
  stats: EcosystemCreatureStats;
  group: THREE.Group;
  lodState: EcosystemLODState;
  currentFeedingPitId: string | null;
  targetPosition: THREE.Vector3 | null;
  targetEntityId: string | null;
  lastStateChangeTime: number;
  isDead: boolean;

  update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState): void;
  takeDamage(amount: number): boolean;
  setState(newState: CreatureAIState): void;
  dispose(): void;
}

export interface FeedingPitCarcass {
  id: string;
  position: THREE.Vector3;
  totalMeat: number;
  currentMeat: number;
  carcassMesh?: THREE.Mesh;
}

export interface FeedingPit {
  id: string;
  name: string;
  center: THREE.Vector3;
  radius: number;
  meatCapacity: number;
  currentMeat: number;
  carcasses: FeedingPitCarcass[];
  dominantTier: CreatureTier;
  disturbanceLevel: number; // 0 (peaceful) to 100 (chaotic / combat)
  activeCreatureIds: Set<string>;
  isDepleted: boolean;
  migrationTriggered?: boolean;
  pitGroup?: THREE.Group;
}

export type EcosystemEventType =
  | 'feeding_frenzy'
  | 'territorial_conflict'
  | 'carcass_dispute'
  | 'buried_ambush'
  | 'blood_bloom'
  | 'predator_migration'
  | 'matriarch_call'
  | 'creature_killed'
  | 'pit_depleted'
  | 'sovereign_slain';

export interface EcosystemEvent {
  type: EcosystemEventType;
  realmId: number;
  timestamp: number;
  position?: THREE.Vector3;
  initiatorId?: string;
  targetId?: string;
  data?: Record<string, any>;
}

export interface EcosystemPersistenceData {
  realmId: number;
  sovereignDefeated: boolean;
  clearedPitIds: string[];
  depletedMeatByPit: Record<string, number>;
  killedEliteIds: string[];
  ecosystemAggressionModifier: number;
}

export interface RealmEcosystemModule {
  realmId: number;
  realmName: string;
  init(scene: THREE.Scene, dispatcher: any, persistence: any): void;
  update(delta: number, playerPos: THREE.Vector3): void;
  onSovereignDefeated(): void;
  dispose(): void;
}
