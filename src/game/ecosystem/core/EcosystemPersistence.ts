/**
 * The Seven Hellgates - Ecosystem Persistence Manager
 * Persists living realm state: feeding pit depletion, territory dominance,
 * slain elites/mini-bosses, and sovereign defeat behavioral collapse.
 */

import { EcosystemPersistenceData } from './types';

const STORAGE_PREFIX = 'seven_hellgates_ecosystem_realm_';

export class EcosystemPersistence {
  public static loadRealmState(realmId: number): EcosystemPersistenceData {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${realmId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[EcosystemPersistence] Failed to read from localStorage:', e);
    }

    return {
      realmId,
      sovereignDefeated: false,
      clearedPitIds: [],
      depletedMeatByPit: {},
      killedEliteIds: [],
      ecosystemAggressionModifier: 1.0,
    };
  }

  public static saveRealmState(data: EcosystemPersistenceData) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${data.realmId}`, JSON.stringify(data));
    } catch (e) {
      console.warn('[EcosystemPersistence] Failed to save to localStorage:', e);
    }
  }

  public static clearRealmState(realmId: number) {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${realmId}`);
    } catch (e) {
      console.warn('[EcosystemPersistence] Failed to clear localStorage:', e);
    }
  }
}
