/**
 * The Seven Hellgates - Local Storage & Save System
 */

import { ArsenalProgressData, LimboExplorationData, PassiveSealBuffSummary, PlayerData, WeaponId, WeaponUpgradeLevels } from './types';

const SAVE_KEY = 'seven_hellgates_save_v1';

export function createDefaultLimboExploration(): LimboExplorationData {
  return {
    discoveredLocations: [],
    collectedRelics: [],
    awakenedShrines: [],
    defeatedMiniBosses: [],
  };
}

export function computePassiveSealBuffs(exploration?: LimboExplorationData): PassiveSealBuffSummary {
  const relics = exploration?.collectedRelics || [];
  const shrines = exploration?.awakenedShrines || [];
  const activeBuffNames: string[] = [];

  let maxHealthBonus = 0;
  let maxStaminaBonus = 0;
  let staminaRegenMult = 1.0;
  let damageMult = 1.0;
  let wrathGainMult = 1.0;
  let emberYieldMult = 1.0;
  let healPotencyMult = 1.0;

  if (shrines.includes('shrine_west_overlook')) {
    maxStaminaBonus += 20;
    staminaRegenMult += 0.2;
    activeBuffNames.push('Seal of Iron Vigor');
  }
  if (shrines.includes('shrine_east_sanctum')) {
    maxHealthBonus += 30;
    healPotencyMult += 0.25;
    activeBuffNames.push('Seal of Frostblood');
  }
  if (relics.includes('relic_battlefield_oath')) {
    damageMult += 0.12;
    activeBuffNames.push('Oath of Fallen Steel');
  }
  if (relics.includes('relic_crypt_monarch')) {
    wrathGainMult += 0.25;
    activeBuffNames.push('Crownborn Wrath');
  }
  if (relics.includes('relic_cave_mist')) {
    emberYieldMult += 0.18;
    activeBuffNames.push('Pale Ember Resonance');
  }
  if (relics.includes('relic_secret_seal')) {
    maxHealthBonus += 25;
    damageMult += 0.08;
    activeBuffNames.push('First Seal Ward');
  }
  if (relics.includes('relic_watchtower_vigil')) {
    staminaRegenMult += 0.15;
    wrathGainMult += 0.15;
    activeBuffNames.push('Vigil of Moonwatch');
  }

  // Realm II — Gluttony
  if (shrines.includes('shrine_gluttony_marrow')) {
    maxHealthBonus += 30;
    healPotencyMult += 0.15;
    activeBuffNames.push('Marrow Fortitude');
  }
  if (shrines.includes('shrine_gluttony_blood')) {
    damageMult += 0.12;
    maxStaminaBonus += 20;
    activeBuffNames.push('Sanguine Surge');
  }
  if (relics.includes('relic_gluttony_fang')) {
    damageMult += 0.12;
    wrathGainMult += 0.2;
    activeBuffNames.push('Ravenous Edge');
  }
  if (relics.includes('relic_gluttony_heart')) {
    maxHealthBonus += 35;
    emberYieldMult += 0.18;
    activeBuffNames.push('Necrotic Resilience');
  }
  if (relics.includes('relic_gluttony_secret')) {
    staminaRegenMult += 0.15;
    damageMult += 0.1;
    activeBuffNames.push('Feast of Ash');
  }

  // Realm III — Greed
  if (shrines.includes('shrine_greed_bullion')) {
    maxStaminaBonus += 25;
    emberYieldMult += 0.2;
    activeBuffNames.push('Gilded Vigor');
  }
  if (shrines.includes('shrine_greed_aurelian')) {
    maxHealthBonus += 30;
    damageMult += 0.12;
    activeBuffNames.push('Sovereign Grace');
  }
  if (relics.includes('relic_greed_scales')) {
    damageMult += 0.14;
    emberYieldMult += 0.2;
    activeBuffNames.push('Imperial Edge');
  }
  if (relics.includes('relic_greed_signet')) {
    wrathGainMult += 0.25;
    staminaRegenMult += 0.15;
    activeBuffNames.push('Aurelian Wrath');
  }
  if (relics.includes('relic_greed_secret')) {
    maxHealthBonus += 35;
    healPotencyMult += 0.15;
    activeBuffNames.push('Solar Ward');
  }

  // Realm IV — Wrath
  if (shrines.includes('shrine_wrath_ember')) {
    damageMult += 0.15;
    maxStaminaBonus += 20;
    activeBuffNames.push('Fury Tempered');
  }
  if (shrines.includes('shrine_wrath_watch')) {
    maxHealthBonus += 35;
    wrathGainMult += 0.2;
    activeBuffNames.push('Unbroken Flame');
  }
  if (relics.includes('relic_wrath_standard')) {
    damageMult += 0.16;
    staminaRegenMult += 0.15;
    activeBuffNames.push('Calamity Might');
  }
  if (relics.includes('relic_wrath_core')) {
    wrathGainMult += 0.25;
    maxHealthBonus += 30;
    activeBuffNames.push('Volcanic Surge');
  }
  if (relics.includes('relic_wrath_secret')) {
    damageMult += 0.12;
    emberYieldMult += 0.18;
    activeBuffNames.push('Blazing Precision');
  }

  // Realm V — Heresy
  if (shrines.includes('shrine_heresy_confess')) {
    maxHealthBonus += 35;
    healPotencyMult += 0.2;
    activeBuffNames.push('Purged Spirit');
  }
  if (shrines.includes('shrine_heresy_baptistry')) {
    wrathGainMult += 0.25;
    maxStaminaBonus += 20;
    activeBuffNames.push('Oath Arcane');
  }
  if (relics.includes('relic_heresy_censor')) {
    damageMult += 0.15;
    wrathGainMult += 0.2;
    activeBuffNames.push('Sanctified Ash');
  }
  if (relics.includes('relic_heresy_codex')) {
    emberYieldMult += 0.18;
    maxHealthBonus += 35;
    activeBuffNames.push('True Testament');
  }
  if (relics.includes('relic_heresy_secret')) {
    damageMult += 0.14;
    staminaRegenMult += 0.15;
    activeBuffNames.push('Crimson Illumination');
  }

  // Realm VI — Violence
  if (shrines.includes('shrine_violence_chains')) {
    maxStaminaBonus += 25;
    damageMult += 0.15;
    activeBuffNames.push('Iron Sinew');
  }
  if (shrines.includes('shrine_violence_pyre')) {
    maxHealthBonus += 40;
    healPotencyMult += 0.2;
    activeBuffNames.push('Bloodbound Vitality');
  }
  if (relics.includes('relic_violence_cleaver')) {
    damageMult += 0.18;
    wrathGainMult += 0.2;
    activeBuffNames.push('Executioner Cleave');
  }
  if (relics.includes('relic_violence_helm')) {
    staminaRegenMult += 0.2;
    maxHealthBonus += 35;
    activeBuffNames.push('Titan Stamina');
  }
  if (relics.includes('relic_violence_secret')) {
    damageMult += 0.15;
    emberYieldMult += 0.2;
    activeBuffNames.push('Lightning Reflex');
  }

  // Realm VII — Sovereign
  if (shrines.includes('shrine_sovereign_star')) {
    maxHealthBonus += 40;
    wrathGainMult += 0.25;
    activeBuffNames.push('Astral Clarity');
  }
  if (shrines.includes('shrine_sovereign_void')) {
    damageMult += 0.16;
    maxStaminaBonus += 25;
    activeBuffNames.push('Threshold Mastery');
  }
  if (relics.includes('relic_sovereign_astrolabe')) {
    damageMult += 0.18;
    staminaRegenMult += 0.2;
    activeBuffNames.push('Architect Will');
  }
  if (relics.includes('relic_sovereign_crown')) {
    maxHealthBonus += 45;
    wrathGainMult += 0.25;
    activeBuffNames.push('Celestial Edge');
  }
  if (relics.includes('relic_sovereign_secret')) {
    damageMult += 0.15;
    healPotencyMult += 0.2;
    activeBuffNames.push('Beyond Creation');
  }

  return {
    maxHealthBonus,
    maxStaminaBonus,
    staminaRegenMult,
    damageMult,
    wrathGainMult,
    emberYieldMult,
    healPotencyMult,
    activeBuffNames,
  };
}

export function createDefaultUpgradeLevels(): WeaponUpgradeLevels {
  return {
    damage: 0,
    speed: 0,
    stagger: 0,
    range: 0,
    manifestationPower: 0,
    cooldownReduction: 0,
  };
}

export function createDefaultArsenalData(): ArsenalProgressData {
  return {
    unlockedWeapons: ['kings_remnant'],
    equippedWeaponId: 'kings_remnant',
    weaponUpgrades: {
      kings_remnant: createDefaultUpgradeLevels(),
      last_course: createDefaultUpgradeLevels(),
      imperial_decree: createDefaultUpgradeLevels(),
      worldrender: createDefaultUpgradeLevels(),
      false_scripture: createDefaultUpgradeLevels(),
      torturers_grace: createDefaultUpgradeLevels(),
      oathbreaker: createDefaultUpgradeLevels(),
    },
  };
}

export const INITIAL_PLAYER_DATA: PlayerData = {
  level: 1,
  embers: 0,
  unlockedRealms: [1, 2, 3], // Limbo, Abaddon, Greed (The Gilded Warden)
  currentRealm: 1,
  defeatedBosses: [],
  stats: {
    vitality: 10,
    vigor: 10,
    strength: 10,
    arcane: 10,
  },
  loreDiscovered: [],
  arsenal: createDefaultArsenalData(),
  limboExploration: createDefaultLimboExploration(),
};

function sanitizeArsenal(rawArsenal: Partial<ArsenalProgressData> | undefined, defeatedBosses: string[]): ArsenalProgressData {
  const defaults = createDefaultArsenalData();
  const validIds: WeaponId[] = [
    'kings_remnant',
    'last_course',
    'imperial_decree',
    'worldrender',
    'false_scripture',
    'torturers_grace',
    'oathbreaker',
  ];

  const unlockedSet = new Set<WeaponId>(['kings_remnant']);
  if (Array.isArray(rawArsenal?.unlockedWeapons)) {
    rawArsenal.unlockedWeapons.forEach((id) => {
      if (validIds.includes(id)) unlockedSet.add(id);
    });
  }

  // Retroactively unlock weapons if player already defeated corresponding Sovereigns in an earlier save
  const bossWeaponMap: Record<string, WeaponId> = {
    'The Hollow King': 'kings_remnant',
    'The Maw of Endless Hunger': 'last_course',
    'The Gilded Tyrant': 'imperial_decree',
    'The Red Calamity': 'worldrender',
    'The Saint of Ash': 'false_scripture',
    'The Butcher of Ruin': 'torturers_grace',
    'The Sovereign of Desire': 'oathbreaker',
  };
  defeatedBosses.forEach((bossName) => {
    const mapped = bossWeaponMap[bossName];
    if (mapped) unlockedSet.add(mapped);
  });

  const unlockedWeapons = validIds.filter((id) => unlockedSet.has(id));
  const equippedWeaponId: WeaponId =
    rawArsenal?.equippedWeaponId && unlockedSet.has(rawArsenal.equippedWeaponId)
      ? rawArsenal.equippedWeaponId
      : 'kings_remnant';

  const weaponUpgrades = { ...defaults.weaponUpgrades };
  validIds.forEach((id) => {
    const rawUp = rawArsenal?.weaponUpgrades?.[id];
    if (rawUp) {
      weaponUpgrades[id] = {
        ...createDefaultUpgradeLevels(),
        ...rawUp,
      };
    }
  });

  return {
    unlockedWeapons,
    equippedWeaponId,
    weaponUpgrades,
  };
}

function sanitizeLimboExploration(raw: Partial<LimboExplorationData> | undefined): LimboExplorationData {
  return {
    discoveredLocations: Array.isArray(raw?.discoveredLocations) ? [...new Set(raw.discoveredLocations)] : [],
    collectedRelics: Array.isArray(raw?.collectedRelics) ? [...new Set(raw.collectedRelics)] : [],
    awakenedShrines: Array.isArray(raw?.awakenedShrines) ? [...new Set(raw.awakenedShrines)] : [],
    defeatedMiniBosses: Array.isArray(raw?.defeatedMiniBosses) ? [...new Set(raw.defeatedMiniBosses)] : [],
  };
}

export function loadPlayerData(): PlayerData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return {
        ...INITIAL_PLAYER_DATA,
        stats: { ...INITIAL_PLAYER_DATA.stats },
        arsenal: createDefaultArsenalData(),
        limboExploration: createDefaultLimboExploration(),
      };
    }
    const parsed = JSON.parse(raw);
    const defeatedBosses: string[] = Array.isArray(parsed.defeatedBosses) ? parsed.defeatedBosses : [];
    return {
      ...INITIAL_PLAYER_DATA,
      ...parsed,
      stats: {
        ...INITIAL_PLAYER_DATA.stats,
        ...(parsed.stats || {}),
      },
      unlockedRealms: Array.isArray(parsed.unlockedRealms) && parsed.unlockedRealms.length > 0
        ? Array.from(new Set([...parsed.unlockedRealms, 1, 2, 3]))
        : [1, 2, 3],
      defeatedBosses,
      loreDiscovered: Array.isArray(parsed.loreDiscovered) ? parsed.loreDiscovered : [],
      arsenal: sanitizeArsenal(parsed.arsenal, defeatedBosses),
      limboExploration: sanitizeLimboExploration(parsed.limboExploration),
    };
  } catch (e) {
    console.error('Failed to load save data, resetting to defaults:', e);
    return {
      ...INITIAL_PLAYER_DATA,
      stats: { ...INITIAL_PLAYER_DATA.stats },
      arsenal: createDefaultArsenalData(),
      limboExploration: createDefaultLimboExploration(),
    };
  }
}

export function savePlayerData(data: PlayerData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save player data:', e);
  }
}

export function resetPlayerData(): PlayerData {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error('Failed to clear save data:', e);
  }
  return {
    ...INITIAL_PLAYER_DATA,
    stats: { ...INITIAL_PLAYER_DATA.stats },
    arsenal: createDefaultArsenalData(),
    limboExploration: createDefaultLimboExploration(),
  };
}

export function hasSavedProgress(data: PlayerData): boolean {
  if (data.level > 1 || data.embers > 0 || data.currentRealm > 1) return true;
  if (data.defeatedBosses.length > 0 || data.loreDiscovered.length > 0) return true;
  if (data.arsenal.unlockedWeapons.length > 1) return true;
  if (
    (data.limboExploration?.collectedRelics.length ?? 0) > 0 ||
    (data.limboExploration?.awakenedShrines.length ?? 0) > 0 ||
    (data.limboExploration?.defeatedMiniBosses.length ?? 0) > 0
  ) {
    return true;
  }
  return Object.values(data.arsenal.weaponUpgrades).some((levels) =>
    Object.values(levels).some((val) => val > 0)
  );
}
