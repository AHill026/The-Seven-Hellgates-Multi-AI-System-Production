/**
 * Project Sevenfold - Authoritative Hybrid Arsenal Registry
 * Centralized data-driven registry for Azrael's 7 Legendary Seal Weapons,
 * moveset modifiers, upgrade tracks, cross-weapon synergies, and Seal Resonance tiers.
 */

import { WeaponClass, WeaponId, WeaponUpgradeLevels, WeaponUpgradeTrack } from '../types';

export interface WeaponDefinition {
  id: WeaponId;
  slotIndex: number; // 1..7 (hotkeys 1-7)
  realmId: number;
  realmName: string;
  sovereignName: string;
  isProvisionalLore: boolean;
  name: string;
  weaponClass: WeaponClass;
  classLabel: string;
  dualWield: boolean;
  primaryColorHex: number;
  secondaryColorHex: number;
  accentCssColor: string;
  description: string;
  loreHint: string;
  abilities: string[]; // 4 canonical abilities
  signatureManifestName: string;
  signatureManifestDesc: string;
  baseStats: {
    damage: number;
    speedMultiplier: number; // 0.8 = heavy slow, 1.3 = swift
    staggerPower: number;
    range: number;
    manifestDamage: number;
    manifestCooldown: number; // seconds
    staminaCostLight: number;
    staminaCostHeavy: number;
  };
}

export interface EffectiveWeaponStats {
  damage: number;
  speedMultiplier: number;
  staggerPower: number;
  range: number;
  manifestDamage: number;
  manifestCooldown: number;
  staminaCostLight: number;
  staminaCostHeavy: number;
}

export interface CrossWeaponSynergy {
  id: string;
  name: string;
  physicalWeapon: WeaponId;
  manifestWeapon: WeaponId;
  effectType: 'stagger_surge' | 'siphon_burst' | 'molten_rupture' | 'arcane_shatter' | 'hook_execute' | 'mirrored_counter';
  bonusDamage: number;
  bonusStagger: number;
  healAmount: number;
  colorHex: number;
  description: string;
}

export const SEVENFOLD_WEAPONS: WeaponDefinition[] = [
  {
    id: 'kings_remnant',
    slotIndex: 1,
    realmId: 1,
    realmName: 'Limbo',
    sovereignName: 'The Hollow King',
    isProvisionalLore: false,
    name: "The King's Remnant",
    weaponClass: 'greatsword',
    classLabel: 'Two-Handed Greatsword',
    dualWield: false,
    primaryColorHex: 0x38bdf8,
    secondaryColorHex: 0xcbd5e1,
    accentCssColor: '#38bdf8',
    description: 'A towering greatsword etched with pale-blue seal runes that hum when near another Sovereign relic.',
    loreHint: 'The first fragment of a broken lock. It remembers a crown you no longer wear.',
    abilities: ["King's Judgment", 'Spectral Cleave', 'Forgotten Oath', 'Hollow Requiem'],
    signatureManifestName: "King's Judgment",
    signatureManifestDesc: 'Projects a colossal spectral guillotine cleave straight ahead, shattering posture.',
    baseStats: {
      damage: 42,
      speedMultiplier: 1.0,
      staggerPower: 1.15,
      range: 3.1,
      manifestDamage: 92,
      manifestCooldown: 4.5,
      staminaCostLight: 16,
      staminaCostHeavy: 30,
    },
  },
  {
    id: 'last_course',
    slotIndex: 2,
    realmId: 2,
    realmName: 'Gluttony — Abaddon',
    sovereignName: 'The Maw of Endless Hunger',
    isProvisionalLore: false,
    name: 'The Last Course',
    weaponClass: 'glaive',
    classLabel: 'Colossal Hooked Glaive',
    dualWield: false,
    primaryColorHex: 0xdc2626,
    secondaryColorHex: 0x84cc16,
    accentCssColor: '#ef4444',
    description: 'An organic, jagged hooked glaive pulsing with crimson marrow and bile-green veins from the Maw.',
    loreHint: 'Forged from bone and insatiable hunger; even steel drinks life when it hooks flesh.',
    abilities: ['Devour', "Hunger's Reach", 'Feast of Ruin', 'Endless Maw'],
    signatureManifestName: 'Feast of Ruin',
    signatureManifestDesc: 'Sweeps a wide hooked crescent that rips vitality from foes and heals Azrael.',
    baseStats: {
      damage: 39,
      speedMultiplier: 1.08,
      staggerPower: 1.0,
      range: 3.6,
      manifestDamage: 85,
      manifestCooldown: 5.0,
      staminaCostLight: 15,
      staminaCostHeavy: 28,
    },
  },
  {
    id: 'imperial_decree',
    slotIndex: 3,
    realmId: 3,
    realmName: 'Greed',
    sovereignName: 'The Gilded Tyrant',
    isProvisionalLore: false,
    name: 'The Imperial Decree',
    weaponClass: 'mace',
    classLabel: 'Chained War-Mace',
    dualWield: false,
    primaryColorHex: 0xf59e0b,
    secondaryColorHex: 0xfef08a,
    accentCssColor: '#f59e0b',
    description: 'A blackened-bronze imperial war-mace wrapped in spectral chains and vault locks of tarnished gold.',
    loreHint: 'A sentence cast in heavy bullion—designed to break armored vessels and extract penance.',
    abilities: ['Royal Collection', 'Imperial Sentence', 'Debt Reclaimed', 'Dominion Breaker'],
    signatureManifestName: 'Royal Collection',
    signatureManifestDesc: 'Manifests a chained gilded mace impact that crushes enemy poise and triggers a gold shockwave.',
    baseStats: {
      damage: 48,
      speedMultiplier: 0.88,
      staggerPower: 1.55,
      range: 2.9,
      manifestDamage: 108,
      manifestCooldown: 5.5,
      staminaCostLight: 18,
      staminaCostHeavy: 34,
    },
  },
  {
    id: 'worldrender',
    slotIndex: 4,
    realmId: 4,
    realmName: 'Wrath',
    sovereignName: '[PROVISIONAL] The Red Calamity',
    isProvisionalLore: true,
    name: 'The Worldrender',
    weaponClass: 'axe',
    classLabel: "Colossal Executioner's Axe",
    dualWield: false,
    primaryColorHex: 0xef4444,
    secondaryColorHex: 0xf97316,
    accentCssColor: '#f97316',
    description: 'A monstrous black-iron battleaxe seething with molten fault-lines that split basalt on impact.',
    loreHint: '[PROVISIONAL] Tempered in volcanic fury; its edge remembers the sundering of war-gates.',
    abilities: ['Ruinous Cleave', 'Blood Temper', 'Warbreaker', 'Cataclysm'],
    signatureManifestName: 'Ruinous Cleave',
    signatureManifestDesc: 'Splits the earth with a blazing magma shockwave fissure along Azrael’s strike line.',
    baseStats: {
      damage: 52,
      speedMultiplier: 0.84,
      staggerPower: 1.45,
      range: 3.3,
      manifestDamage: 118,
      manifestCooldown: 5.8,
      staminaCostLight: 19,
      staminaCostHeavy: 35,
    },
  },
  {
    id: 'false_scripture',
    slotIndex: 5,
    realmId: 5,
    realmName: 'Heresy',
    sovereignName: '[PROVISIONAL] The Saint of Ash',
    isProvisionalLore: true,
    name: 'The False Scripture',
    weaponClass: 'spear',
    classLabel: 'Ritual Spear & Reliquary',
    dualWield: false,
    primaryColorHex: 0xa855f7,
    secondaryColorHex: 0x818cf8,
    accentCssColor: '#a855f7',
    description: 'A long inverted-spire ritual spear hung with a smoking iron reliquary and arcane wards.',
    loreHint: '[PROVISIONAL] Every thrust inscribes a forbidden glyph meant to unmake sanctified armor.',
    abilities: ["Blasphemer's Mark", 'Forbidden Revelation', 'False Miracle', 'Unholy Verdict'],
    signatureManifestName: "Blasphemer's Mark",
    signatureManifestDesc: 'Impales through a long corridor with corrupted arcane glyphs that detonate after contact.',
    baseStats: {
      damage: 38,
      speedMultiplier: 1.18,
      staggerPower: 1.05,
      range: 4.0,
      manifestDamage: 96,
      manifestCooldown: 4.6,
      staminaCostLight: 14,
      staminaCostHeavy: 26,
    },
  },
  {
    id: 'torturers_grace',
    slotIndex: 6,
    realmId: 6,
    realmName: 'Violence',
    sovereignName: '[PROVISIONAL] The Butcher of Ruin',
    isProvisionalLore: true,
    name: "The Torturer's Grace",
    weaponClass: 'poleaxe',
    classLabel: 'Executioner Poleaxe & Hook',
    dualWield: false,
    primaryColorHex: 0xb91c1c,
    secondaryColorHex: 0x7f1d1d,
    accentCssColor: '#b91c1c',
    description: 'A brutal notched poleaxe fitted with an iron chain-hook designed to snare fleeing prey.',
    loreHint: '[PROVISIONAL] Built for the bloodfields—where mercy is measured in swiftness of iron.',
    abilities: ['Sentence of Iron', 'Break the Bound', "Executioner's March", 'Final Punishment'],
    signatureManifestName: 'Sentence of Iron',
    signatureManifestDesc: 'Lashes out a wide hooked arc that drags nearby enemies inward and rends armor.',
    baseStats: {
      damage: 45,
      speedMultiplier: 0.96,
      staggerPower: 1.35,
      range: 3.5,
      manifestDamage: 102,
      manifestCooldown: 5.0,
      staminaCostLight: 17,
      staminaCostHeavy: 31,
    },
  },
  {
    id: 'oathbreaker',
    slotIndex: 7,
    realmId: 7,
    realmName: 'Treachery',
    sovereignName: '[PROVISIONAL] The Sovereign of Desire',
    isProvisionalLore: true,
    name: 'The Oathbreaker',
    weaponClass: 'dual_swords',
    classLabel: 'Paired Mirrored Swords',
    dualWield: true,
    primaryColorHex: 0xc084fc,
    secondaryColorHex: 0xe2e8f0,
    accentCssColor: '#c084fc',
    description: 'Twin fractured-silver blades bound in violet resonance—each strike echoes a mirrored phantom cut.',
    loreHint: '[PROVISIONAL] The seventh key—split cleanly in two so no single hand could hold the whole truth.',
    abilities: ['False Image', "Betrayer's Kiss", 'Broken Promise', 'Severed Truth'],
    signatureManifestName: 'False Image',
    signatureManifestDesc: 'Projects twin crossed spectral blades for a blinding flurry and brief defensive ward.',
    baseStats: {
      damage: 36,
      speedMultiplier: 1.32,
      staggerPower: 0.95,
      range: 2.8,
      manifestDamage: 98,
      manifestCooldown: 4.0,
      staminaCostLight: 12,
      staminaCostHeavy: 24,
    },
  },
];

export const WEAPON_BY_ID: Record<WeaponId, WeaponDefinition> = SEVENFOLD_WEAPONS.reduce(
  (acc, def) => {
    acc[def.id] = def;
    return acc;
  },
  {} as Record<WeaponId, WeaponDefinition>
);

export const REALM_TO_WEAPON_ID: Record<number, WeaponId> = {
  1: 'kings_remnant',
  2: 'last_course',
  3: 'imperial_decree',
  4: 'worldrender',
  5: 'false_scripture',
  6: 'torturers_grace',
  7: 'oathbreaker',
};

export const WEAPON_UPGRADE_TRACKS: {
  key: WeaponUpgradeTrack;
  label: string;
  desc: string;
  maxLevel: number;
}[] = [
  { key: 'damage', label: 'Base Damage', desc: '+10% Physical strike potency per tier', maxLevel: 5 },
  { key: 'speed', label: 'Combo Speed', desc: '+6% Swing velocity & recovery cadence', maxLevel: 5 },
  { key: 'stagger', label: 'Stagger Power', desc: '+12% Boss posture & poise break damage', maxLevel: 5 },
  { key: 'range', label: 'Reach', desc: '+0.22m Weapon strike arc extension', maxLevel: 5 },
  { key: 'manifestationPower', label: 'Manifestation Power', desc: '+14% Supernatural manifestation damage', maxLevel: 5 },
  { key: 'cooldownReduction', label: 'Cooldown Reduction', desc: '-8% Supernatural manifestation cooldown', maxLevel: 5 },
];

export function getWeaponUpgradeCost(currentLevel: number): number {
  return 60 + currentLevel * 55;
}

export function getWeaponEffectiveStats(
  weaponId: WeaponId,
  upgrades?: Partial<WeaponUpgradeLevels>
): EffectiveWeaponStats {
  const def = WEAPON_BY_ID[weaponId] || WEAPON_BY_ID.kings_remnant;
  const u = {
    damage: upgrades?.damage || 0,
    speed: upgrades?.speed || 0,
    stagger: upgrades?.stagger || 0,
    range: upgrades?.range || 0,
    manifestationPower: upgrades?.manifestationPower || 0,
    cooldownReduction: upgrades?.cooldownReduction || 0,
  };

  return {
    damage: Math.round(def.baseStats.damage * (1 + u.damage * 0.10)),
    speedMultiplier: Number((def.baseStats.speedMultiplier * (1 + u.speed * 0.06)).toFixed(2)),
    staggerPower: Number((def.baseStats.staggerPower * (1 + u.stagger * 0.12)).toFixed(2)),
    range: Number((def.baseStats.range + u.range * 0.22).toFixed(2)),
    manifestDamage: Math.round(def.baseStats.manifestDamage * (1 + u.manifestationPower * 0.14)),
    manifestCooldown: Number(Math.max(1.8, def.baseStats.manifestCooldown * (1 - u.cooldownReduction * 0.08)).toFixed(2)),
    staminaCostLight: def.baseStats.staminaCostLight,
    staminaCostHeavy: def.baseStats.staminaCostHeavy,
  };
}

/**
 * Data-driven Cross-Weapon Resonance Combos
 * Triggered when Azrael follows a physical attack with a supernatural manifestation (V)
 * of a different weapon within the combo window.
 */
export const CROSS_WEAPON_SYNERGIES: CrossWeaponSynergy[] = [
  {
    id: 'judgment_collected',
    name: 'JUDGMENT COLLECTED',
    physicalWeapon: 'kings_remnant',
    manifestWeapon: 'imperial_decree',
    effectType: 'stagger_surge',
    bonusDamage: 65,
    bonusStagger: 40,
    healAmount: 0,
    colorHex: 0xfbbf24,
    description: "King's Remnant opens the guard; Imperial Decree shatters poise in gilded thunder.",
  },
  {
    id: 'unforgiven_feast',
    name: 'UNFORGIVEN FEAST',
    physicalWeapon: 'kings_remnant',
    manifestWeapon: 'last_course',
    effectType: 'siphon_burst',
    bonusDamage: 55,
    bonusStagger: 15,
    healAmount: 35,
    colorHex: 0xef4444,
    description: 'Spectral ice splits armor so The Last Course siphons crimson vitality.',
  },
  {
    id: 'gilded_cataclysm',
    name: 'GILDED CATACLYSM',
    physicalWeapon: 'imperial_decree',
    manifestWeapon: 'worldrender',
    effectType: 'molten_rupture',
    bonusDamage: 85,
    bonusStagger: 35,
    healAmount: 0,
    colorHex: 0xf97316,
    description: 'Chained gold locks target posture into place for a molten Worldrender fissure.',
  },
  {
    id: 'crimson_harvest',
    name: 'CRIMSON HARVEST',
    physicalWeapon: 'last_course',
    manifestWeapon: 'torturers_grace',
    effectType: 'hook_execute',
    bonusDamage: 72,
    bonusStagger: 25,
    healAmount: 22,
    colorHex: 0xb91c1c,
    description: 'Twin hooked blades yank and lacerate enemies in a vortex of blood-iron.',
  },
  {
    id: 'profane_eclipse',
    name: 'PROFANE ECLIPSE',
    physicalWeapon: 'false_scripture',
    manifestWeapon: 'oathbreaker',
    effectType: 'arcane_shatter',
    bonusDamage: 78,
    bonusStagger: 20,
    healAmount: 0,
    colorHex: 0xa855f7,
    description: 'Inscribed heresy runes detonate when struck by twin mirrored Oathbreaker cuts.',
  },
  {
    id: 'sovereign_fracture',
    name: 'SOVEREIGN FRACTURE',
    physicalWeapon: 'oathbreaker',
    manifestWeapon: 'kings_remnant',
    effectType: 'mirrored_counter',
    bonusDamage: 80,
    bonusStagger: 32,
    healAmount: 15,
    colorHex: 0x67e8f9,
    description: 'Mirrored twin strikes synchronize into a single King’s Remnant execution arc.',
  },
];

export function findCrossWeaponSynergy(
  physicalWeapon: WeaponId,
  manifestWeapon: WeaponId
): CrossWeaponSynergy | null {
  if (physicalWeapon === manifestWeapon) return null;
  const direct = CROSS_WEAPON_SYNERGIES.find(
    (s) => s.physicalWeapon === physicalWeapon && s.manifestWeapon === manifestWeapon
  );
  if (direct) return direct;

  // Generic cross-seal resonance when pairing any two distinct collected weapons
  const physDef = WEAPON_BY_ID[physicalWeapon];
  const manDef = WEAPON_BY_ID[manifestWeapon];
  return {
    id: `seal_harmonic_${physicalWeapon}_${manifestWeapon}`,
    name: `SEAL HARMONIC: ${manDef.name.toUpperCase()}`,
    physicalWeapon,
    manifestWeapon,
    effectType: 'stagger_surge',
    bonusDamage: 42,
    bonusStagger: 18,
    healAmount: manifestWeapon === 'last_course' ? 20 : 0,
    colorHex: manDef.primaryColorHex || physDef.primaryColorHex,
    description: `Cross-weapon resonance between ${physDef.name} and ${manDef.name}.`,
  };
}

export interface SealResonanceInfo {
  unlockedCount: number;
  tier: 0 | 1 | 2 | 3; // 0: dormant (1-2), 1: stirring (3-4), 2: fracturing (5-6), 3: sevenfold (7)
  title: string;
  whisper: string;
  chestRuneIntensity: number;
}

export function getSealResonanceInfo(unlockedCount: number): SealResonanceInfo {
  if (unlockedCount >= 7) {
    return {
      unlockedCount,
      tier: 3,
      title: 'Sevenfold Resonance',
      whisper: 'All seven keys hum in unison—the ancient prison seal remembers its true bearer.',
      chestRuneIntensity: 2.2,
    };
  }
  if (unlockedCount >= 5) {
    return {
      unlockedCount,
      tier: 2,
      title: 'Fracturing Seal',
      whisper: 'The relics inside your aura pull toward a forgotten vault deeper than the Abyss.',
      chestRuneIntensity: 1.5,
    };
  }
  if (unlockedCount >= 3) {
    return {
      unlockedCount,
      tier: 1,
      title: 'Harmonic Stirring',
      whisper: 'These blades were never trophies. Each is a ward torn from the same lock.',
      chestRuneIntensity: 1.05,
    };
  }
  return {
    unlockedCount,
    tier: 0,
    title: 'Dormant Fragment',
    whisper: 'A single cold seal answers the rune burned into your breastplate.',
    chestRuneIntensity: 0.65,
  };
}
