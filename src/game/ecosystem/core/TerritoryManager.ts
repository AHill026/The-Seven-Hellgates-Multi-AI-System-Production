/**
 * The Seven Hellgates - Territory & Feeding Pit Manager
 * Manages feeding pits, carcasses, predator dominance, meat depletion, and disturbances.
 */

import * as THREE from 'three';
import { FeedingPit, FeedingPitCarcass, CreatureTier } from './types';
import { EcosystemEventDispatcher } from './EcosystemEventDispatcher';

export class TerritoryManager {
  private pits: Map<string, FeedingPit> = new Map();
  private dispatcher: EcosystemEventDispatcher;
  private realmId: number;

  constructor(realmId: number, dispatcher: EcosystemEventDispatcher) {
    this.realmId = realmId;
    this.dispatcher = dispatcher;
  }

  public registerPit(pit: FeedingPit) {
    this.pits.set(pit.id, pit);
  }

  public getPit(id: string): FeedingPit | undefined {
    return this.pits.get(id);
  }

  public getAllPits(): FeedingPit[] {
    return Array.from(this.pits.values());
  }

  public findNearestPit(pos: THREE.Vector3): FeedingPit | null {
    let nearest: FeedingPit | null = null;
    let minDist = Infinity;

    this.pits.forEach(pit => {
      const dist = pit.center.distanceTo(pos);
      if (dist < minDist) {
        minDist = dist;
        nearest = pit;
      }
    });

    return nearest;
  }

  public recordDisturbance(pitId: string, amount: number) {
    const pit = this.pits.get(pitId);
    if (!pit) return;

    pit.disturbanceLevel = Math.min(100, pit.disturbanceLevel + amount);
    if (pit.disturbanceLevel >= 80) {
      this.dispatcher.emit({
        type: 'feeding_frenzy',
        realmId: this.realmId,
        timestamp: Date.now(),
        position: pit.center.clone(),
        data: { pitId, disturbance: pit.disturbanceLevel },
      });
    }
  }

  public getBestAlternativePit(currentPitId: string): FeedingPit | undefined {
    let bestPit: FeedingPit | undefined;
    let maxFood = 0;
    this.pits.forEach(p => {
      if (p.id !== currentPitId && !p.isDepleted && p.currentMeat > maxFood) {
        maxFood = p.currentMeat;
        bestPit = p;
      }
    });
    return bestPit;
  }

  public registerCreatureToPit(creatureId: string, pitId: string) {
    const pit = this.pits.get(pitId);
    if (pit) {
      pit.activeCreatureIds.add(creatureId);
    }
  }

  public unregisterCreatureFromPit(creatureId: string, pitId: string) {
    const pit = this.pits.get(pitId);
    if (pit) {
      pit.activeCreatureIds.delete(creatureId);
    }
  }

  public consumeMeat(pitId: string, amount: number, consumerTier: CreatureTier): number {
    const pit = this.pits.get(pitId);
    if (!pit || pit.isDepleted) return 0;

    const actualConsumed = Math.min(pit.currentMeat, amount);
    pit.currentMeat -= actualConsumed;

    // Check individual carcasses
    for (const carcass of pit.carcasses) {
      if (carcass.currentMeat > 0) {
        const cConsumed = Math.min(carcass.currentMeat, actualConsumed);
        carcass.currentMeat -= cConsumed;
        if (carcass.carcassMesh) {
          const ratio = Math.max(0.1, carcass.currentMeat / carcass.totalMeat);
          carcass.carcassMesh.scale.set(ratio, ratio, ratio);
        }
        break;
      }
    }

    const meatRatio = pit.currentMeat / Math.max(1, pit.meatCapacity);

    // Trigger migration when resources fall below configured threshold (30%)
    if (meatRatio <= 0.30 && !pit.migrationTriggered) {
      pit.migrationTriggered = true;
      const altPit = this.getBestAlternativePit(pitId);
      this.dispatcher.emit({
        type: 'predator_migration',
        realmId: this.realmId,
        timestamp: Date.now(),
        position: pit.center.clone(),
        data: {
          fromPitId: pitId,
          destinationPitId: altPit ? altPit.id : null,
          destinationPos: altPit ? altPit.center.clone() : undefined,
          meatRatio,
          affectedCreatures: Array.from(pit.activeCreatureIds),
        },
      });
    }

    if (pit.currentMeat <= 0) {
      pit.isDepleted = true;
      this.dispatcher.emit({
        type: 'pit_depleted',
        realmId: this.realmId,
        timestamp: Date.now(),
        position: pit.center.clone(),
        data: {
          pitId,
          affectedCreatures: Array.from(pit.activeCreatureIds),
        },
      });
    }

    return actualConsumed;
  }

  public update(delta: number) {
    this.pits.forEach(pit => {
      // Natural disturbance decay
      if (pit.disturbanceLevel > 0) {
        pit.disturbanceLevel = Math.max(0, pit.disturbanceLevel - delta * 4);
      }

      // Meat regeneration in living realm environment (flesh wall sloughing)
      if (pit.currentMeat < pit.meatCapacity && !pit.isDepleted) {
        pit.currentMeat = Math.min(pit.meatCapacity, pit.currentMeat + delta * 0.8);
        // Reset migration trigger when food availability recovers above 60%
        if (pit.migrationTriggered && (pit.currentMeat / pit.meatCapacity) >= 0.60) {
          pit.migrationTriggered = false;
        }
      }
    });
  }

  public clear() {
    this.pits.clear();
  }
}
