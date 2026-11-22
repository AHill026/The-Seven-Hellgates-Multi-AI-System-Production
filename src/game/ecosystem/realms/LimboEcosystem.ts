/**
 * The Seven Hellgates - Realm I: Limbo Ecosystem
 * Baseline shared ecosystem module representing the cold ashen realm of Limbo.
 */

import * as THREE from 'three';
import { RealmEcosystemModule } from '../core/types';
import { EcosystemEventDispatcher } from '../core/EcosystemEventDispatcher';
import { TerritoryManager } from '../core/TerritoryManager';
import { PopulationManager } from '../core/PopulationManager';
import { EcosystemPersistence } from '../core/EcosystemPersistence';

export class LimboEcosystem implements RealmEcosystemModule {
  public realmId = 1;
  public realmName = 'Limbo: The Forgotten Shore';
  private scene: THREE.Scene | null = null;
  private dispatcher: EcosystemEventDispatcher;
  private territoryMgr: TerritoryManager;
  private populationMgr: PopulationManager;
  private sovereignDefeated: boolean = false;

  constructor(dispatcher: EcosystemEventDispatcher) {
    this.dispatcher = dispatcher;
    this.territoryMgr = new TerritoryManager(1, dispatcher);
    this.populationMgr = new PopulationManager(dispatcher);
  }

  public init(scene: THREE.Scene, dispatcher: EcosystemEventDispatcher, persistence: EcosystemPersistence) {
    this.scene = scene;
    const data = EcosystemPersistence.loadRealmState(1);
    this.sovereignDefeated = data.sovereignDefeated;
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.territoryMgr.update(delta);
    this.populationMgr.update(delta, playerPos);
  }

  public onSovereignDefeated() {
    this.sovereignDefeated = true;
    const state = EcosystemPersistence.loadRealmState(1);
    state.sovereignDefeated = true;
    state.ecosystemAggressionModifier = 0.5;
    EcosystemPersistence.saveRealmState(state);
  }

  public dispose() {
    this.populationMgr.clear();
    this.territoryMgr.clear();
    this.scene = null;
  }
}
