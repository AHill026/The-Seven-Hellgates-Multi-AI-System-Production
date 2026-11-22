/**
 * The Seven Hellgates - Game Types & State Definitions
 */

export type CombatStance = 'reaper' | 'executioner' | 'wrath_unbound';

export type WeaponId =
  | 'kings_remnant'
  | 'last_course'
  | 'imperial_decree'
  | 'worldrender'
  | 'false_scripture'
  | 'torturers_grace'
  | 'oathbreaker';

export type WeaponClass =
  | 'greatsword'
  | 'glaive'
  | 'mace'
  | 'axe'
  | 'spear'
  | 'poleaxe'
  | 'dual_swords';

export type WeaponUpgradeTrack =
  | 'damage'
  | 'speed'
  | 'stagger'
  | 'range'
  | 'manifestationPower'
  | 'cooldownReduction';

export interface WeaponUpgradeLevels {
  damage: number;
  speed: number;
  stagger: number;
  range: number;
  manifestationPower: number;
  cooldownReduction: number;
}

export interface ArsenalProgressData {
  unlockedWeapons: WeaponId[];
  equippedWeaponId: WeaponId;
  weaponUpgrades: Record<WeaponId, WeaponUpgradeLevels>;
}

export interface PlayerStats {
  vitality: number; // Increases Max HP & heals on upgrade
  vigor: number;    // Increases Max Stamina & Stamina Regen
  strength: number; // Increases Physical & Heavy Damage
  arcane: number;   // Increases Wrath buildup & Supernatural Damage
}

export interface PlayerData {
  level: number;
  embers: number; // Soul currency for upgrades
  unlockedRealms: number[]; // 1 to 7
  currentRealm: number;
  defeatedBosses: string[];
  stats: PlayerStats;
  loreDiscovered: string[];
  arsenal: ArsenalProgressData;
}

export type EnemyType = 
  | 'hellspawn' 
  | 'hellbrute' 
  | 'shade' 
  | 'stalker' 
  | 'devourer' 
  | 'sentinel' 
  | 'ravager' 
  | 'heretic' 
  | 'butcher' 
  | 'sovereign_knight'
  | 'gilded_warden'
  | 'boss';

export interface EnemyStats {
  name: string;
  type: EnemyType;
  maxHealth: number;
  health: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  staggerResistance: number;
  emberReward: number;
}

export interface RealmDefinition {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  bossName: string;
  bossTitle: string;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  groundColor: number;
  accentColor: number;
  loreFragment: string;
  loreTitle: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  scale: number;
}
