/**
 * The Seven Hellgates - Ecosystem Population & Simulation LOD Manager
 * Distance-based LOD simulation and pooling for high framerate Dark-Fantasy combat.
 */

import * as THREE from 'three';
import { EcosystemCreature, EcosystemLODState, CreatureTier } from './types';
import { EcosystemEventDispatcher } from './EcosystemEventDispatcher';

export class PopulationManager {
  private creatures: Map<string, EcosystemCreature> = new Map();
  private dispatcher: EcosystemEventDispatcher;
  private frameCount: number = 0;

  // LOD Distance thresholds
  public static readonly ACTIVE_DIST = 35.0;
  public static readonly REDUCED_DIST = 70.0;

  constructor(dispatcher: EcosystemEventDispatcher) {
    this.dispatcher = dispatcher;
  }

  public registerCreature(creature: EcosystemCreature) {
    this.creatures.set(creature.id, creature);
  }

  public unregisterCreature(id: string) {
    const c = this.creatures.get(id);
    if (c) {
      c.dispose();
      this.creatures.delete(id);
    }
  }

  public getCreature(id: string): EcosystemCreature | undefined {
    return this.creatures.get(id);
  }

  public getAllCreatures(): EcosystemCreature[] {
    return Array.from(this.creatures.values());
  }

  public getCreaturesByTier(tier: CreatureTier): EcosystemCreature[] {
    return Array.from(this.creatures.values()).filter(c => c.tier === tier && !c.isDead);
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.frameCount++;

    this.creatures.forEach(creature => {
      if (creature.isDead) return;

      const dist = creature.group.position.distanceTo(playerPos);
      let lod: EcosystemLODState = 'active';

      if (dist > PopulationManager.REDUCED_DIST) {
        lod = 'dormant';
      } else if (dist > PopulationManager.ACTIVE_DIST) {
        lod = 'reduced';
      }

      creature.lodState = lod;

      // Stagger updates for reduced LOD to save CPU cycles
      if (lod === 'reduced' && this.frameCount % 3 !== 0) {
        return;
      }
      if (lod === 'dormant' && this.frameCount % 10 !== 0) {
        return;
      }

      creature.update(delta, playerPos, lod);
    });
  }

  public clear() {
    this.creatures.forEach(c => c.dispose());
    this.creatures.clear();
  }
}
