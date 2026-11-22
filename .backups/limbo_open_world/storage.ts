/**
 * The Seven Hellgates - Local Storage & Save System
 */

import { ArsenalProgressData, PlayerData, WeaponId, WeaponUpgradeLevels } from './types';

const SAVE_KEY = 'seven_hellgates_save_v1';

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

export function loadPlayerData(): PlayerData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return {
        ...INITIAL_PLAYER_DATA,
        stats: { ...INITIAL_PLAYER_DATA.stats },
        arsenal: createDefaultArsenalData(),
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
    };
  } catch (e) {
    console.error('Failed to load save data, resetting to defaults:', e);
    return {
      ...INITIAL_PLAYER_DATA,
      stats: { ...INITIAL_PLAYER_DATA.stats },
      arsenal: createDefaultArsenalData(),
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
  };
}
