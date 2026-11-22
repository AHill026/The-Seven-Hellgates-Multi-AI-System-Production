/**
 * The Seven Hellgates - Master Realm Ecosystem Manager
 * The central coordinator orchestrating living realm ecosystems, dynamic events,
 * territory dominance, and Sovereign influence across all Hellgates.
 */

import * as THREE from 'three';
import { RealmEcosystemModule } from './types';
import { EcosystemEventDispatcher } from './EcosystemEventDispatcher';
import { EcosystemPersistence } from './EcosystemPersistence';
import { LimboEcosystem } from '../realms/LimboEcosystem';
import { AbaddonGluttonyEcosystem } from '../realms/AbaddonGluttonyEcosystem';

export class RealmEcosystemManager {
  private activeRealmId: number | null = null;
  private activeModule: RealmEcosystemModule | null = null;
  private scene: THREE.Scene | null = null;
  public dispatcher: EcosystemEventDispatcher;
  public persistence: EcosystemPersistence;

  constructor() {
    this.dispatcher = new EcosystemEventDispatcher();
    this.persistence = new EcosystemPersistence();
  }

  public loadRealmEcosystem(realmId: number, scene: THREE.Scene) {
    if (this.activeModule) {
      this.activeModule.dispose();
      this.activeModule = null;
    }

    this.activeRealmId = realmId;
    this.scene = scene;

    switch (realmId) {
      case 1:
        this.activeModule = new LimboEcosystem(this.dispatcher);
        break;
      case 2:
        this.activeModule = new AbaddonGluttonyEcosystem(this.dispatcher);
        break;
      default:
        this.activeModule = new LimboEcosystem(this.dispatcher);
        break;
    }

    this.activeModule.init(scene, this.dispatcher, this.persistence);
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    if (this.activeModule) {
      this.activeModule.update(delta, playerPos);
    }
  }

  public onSovereignDefeated(realmId: number) {
    if (this.activeModule && this.activeRealmId === realmId) {
      this.activeModule.onSovereignDefeated();
    }
  }

  public getActiveEventName(): string | null {
    if (this.activeModule instanceof AbaddonGluttonyEcosystem) {
      return this.activeModule.getActiveEventName();
    }
    return null;
  }

  public notifyCombatNoise(position: THREE.Vector3, intensity: number = 1.0) {
    if (this.activeModule instanceof AbaddonGluttonyEcosystem) {
      this.activeModule.bloodVegetation.notifyCombatNoise(position, intensity);
    }
  }

  public dispose() {
    if (this.activeModule) {
      this.activeModule.dispose();
      this.activeModule = null;
    }
    this.dispatcher.clear();
    this.scene = null;
    this.activeRealmId = null;
  }
}
