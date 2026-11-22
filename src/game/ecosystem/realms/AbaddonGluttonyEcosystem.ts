/**
 * The Seven Hellgates - REALM II: ABADDON — GLUTTONY ECOSYSTEM
 *
 * Living interconnected dark-fantasy ecosystem representing Gluttony:
 * - 3 Dynamic Feeding Pits & Embedded Carcass Systems
 * - Blood-Reactive Vegetation writhes and agitates in response to combat
 * - 7 Autonomous World Events:
 *   1. Feeding Frenzy
 *   2. Territorial Conflict
 *   3. Carcass Dispute
 *   4. Buried Ambush
 *   5. Blood Bloom
 *   6. Predator Migration
 *   7. Matriarch's Call
 * - Sovereign Influence:
 *   - Pre-defeat: Hyper-aggressive, starving frenzy driven by The Maw of Endless Hunger
 *   - Post-defeat: Behavioral collapse, disoriented dispersion, reduced aggression
 */

import * as THREE from 'three';
import { RealmEcosystemModule, FeedingPit } from '../core/types';
import { EcosystemEventDispatcher } from '../core/EcosystemEventDispatcher';
import { TerritoryManager } from '../core/TerritoryManager';
import { PopulationManager } from '../core/PopulationManager';
import { EcosystemPersistence } from '../core/EcosystemPersistence';
import { FeedingPitSystem } from '../environment/FeedingPitSystem';
import { BloodReactiveVegetation } from '../environment/BloodReactiveVegetation';
import { AbaddonTentacleNetwork } from '../environment/AbaddonTentacleNetwork';
import { AbaddonAtmosphere } from '../environment/AbaddonAtmosphere';
import {
  CarrionLeech,
  BoneBeetle,
  Hungerborn,
  FleshCrawler,
  Mawling,
  GutReaver,
  FleshboundBrute,
  DevouringMatriarch,
} from '../entities/AbaddonCreatures';

export class AbaddonGluttonyEcosystem implements RealmEcosystemModule {
  public realmId = 2;
  public realmName = 'Abaddon: The Endless Maw';

  private scene: THREE.Scene | null = null;
  public dispatcher: EcosystemEventDispatcher;
  public territoryMgr: TerritoryManager;
  public populationMgr: PopulationManager;
  public feedingPitSystem: FeedingPitSystem;
  public bloodVegetation: BloodReactiveVegetation;
  public tentacleNetwork: AbaddonTentacleNetwork;
  public atmosphere: AbaddonAtmosphere;

  // Sovereign Influence State
  public sovereignDefeated: boolean = false;
  public aggressionModifier: number = 1.4;

  // Dynamic Event Timers
  private eventCheckTimer: number = 5.0;
  private activeEventName: string | null = null;
  private activeEventTimer: number = 0;

  constructor(dispatcher: EcosystemEventDispatcher) {
    this.dispatcher = dispatcher;
    this.territoryMgr = new TerritoryManager(2, dispatcher);
    this.populationMgr = new PopulationManager(dispatcher);
    this.feedingPitSystem = new FeedingPitSystem();
    this.bloodVegetation = new BloodReactiveVegetation();
    this.tentacleNetwork = new AbaddonTentacleNetwork();
    this.atmosphere = new AbaddonAtmosphere();

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.dispatcher.on('feeding_frenzy', (e) => {
      this.triggerFeedingFrenzy(e.position || new THREE.Vector3(0, 0, 0));
    });

    this.dispatcher.on('matriarch_call', (e) => {
      this.triggerMatriarchBroodSpawn(e.position || new THREE.Vector3(0, 0, 0));
    });

    this.dispatcher.on('predator_migration', (e) => {
      this.handlePredatorMigration(e);
    });

    this.dispatcher.on('pit_depleted', (e) => {
      this.handlePitDepleted(e);
    });
  }

  public init(scene: THREE.Scene, dispatcher: EcosystemEventDispatcher, persistence: EcosystemPersistence) {
    this.scene = scene;
    scene.add(this.feedingPitSystem.group);
    scene.add(this.bloodVegetation.group);
    scene.add(this.tentacleNetwork.group);
    scene.add(this.atmosphere.group);

    // Initialize full environmental tentacle network
    this.tentacleNetwork.initializeNetwork();

    // 1. Load persistent realm state
    const savedState = EcosystemPersistence.loadRealmState(2);
    this.sovereignDefeated = savedState.sovereignDefeated;
    this.aggressionModifier = this.sovereignDefeated ? 0.45 : 1.45;

    // 2. Build 3 Primary Feeding Pits across Abaddon terrain
    this.initializeFeedingPits();

    // 3. Populate Blood-Reactive Vegetation clusters around pits and cavern walls
    this.initializeBloodVegetation();

    // 4. Spawn Wildlife, Common, Elite, and Mini-Boss creatures
    this.initializeCreatures();
  }

  private initializeFeedingPits() {
    const pitsData: Omit<FeedingPit, 'activeCreatureIds' | 'isDepleted'>[] = [
      {
        id: 'pit_great_gullet',
        name: 'The Great Gullet',
        center: new THREE.Vector3(-12, 0, -6),
        radius: 4.8,
        meatCapacity: 250,
        currentMeat: 250,
        dominantTier: 'elite',
        disturbanceLevel: 20,
        carcasses: [
          { id: 'c1', position: new THREE.Vector3(-1.2, 0, 0.8), totalMeat: 100, currentMeat: 100 },
          { id: 'c2', position: new THREE.Vector3(1.4, 0, -0.6), totalMeat: 80, currentMeat: 80 },
        ],
      },
      {
        id: 'pit_ossuary_gorge',
        name: 'The Ossuary Gorge',
        center: new THREE.Vector3(14, 0, -8),
        radius: 4.2,
        meatCapacity: 180,
        currentMeat: 180,
        dominantTier: 'common',
        disturbanceLevel: 10,
        carcasses: [
          { id: 'c3', position: new THREE.Vector3(0, 0, 0), totalMeat: 120, currentMeat: 120 },
        ],
      },
      {
        id: 'pit_maw_trench',
        name: 'The Maw Trench',
        center: new THREE.Vector3(0, 0, 16),
        radius: 5.5,
        meatCapacity: 350,
        currentMeat: 350,
        dominantTier: 'miniboss',
        disturbanceLevel: 30,
        carcasses: [
          { id: 'c4', position: new THREE.Vector3(-1.5, 0, -1.0), totalMeat: 150, currentMeat: 150 },
          { id: 'c5', position: new THREE.Vector3(1.2, 0, 1.2), totalMeat: 120, currentMeat: 120 },
        ],
      },
    ];

    pitsData.forEach(p => {
      const fullPit: FeedingPit = {
        ...p,
        activeCreatureIds: new Set(),
        isDepleted: false,
      };
      this.territoryMgr.registerPit(fullPit);
      this.feedingPitSystem.createFeedingPitMesh(fullPit);
    });
  }

  private initializeBloodVegetation() {
    const clusterPositions = [
      new THREE.Vector3(-12, 0, -6),
      new THREE.Vector3(14, 0, -8),
      new THREE.Vector3(0, 0, 16),
      new THREE.Vector3(-8, 0, 6),
      new THREE.Vector3(8, 0, 4),
    ];

    clusterPositions.forEach(pos => {
      this.bloodVegetation.spawnVineCluster(pos, 5);
    });
  }

  private initializeCreatures() {
    if (!this.scene) return;

    // A. Wildlife (Leeches & Beetles scavenging around pits)
    for (let i = 0; i < 4; i++) {
      const leech = new CarrionLeech(`leech_${i}`, new THREE.Vector3(-11 + (Math.random() - 0.5) * 4, 0, -5 + (Math.random() - 0.5) * 4));
      this.populationMgr.registerCreature(leech);
      this.scene.add(leech.group);

      const beetle = new BoneBeetle(`beetle_${i}`, new THREE.Vector3(13 + (Math.random() - 0.5) * 4, 0, -7 + (Math.random() - 0.5) * 4));
      this.populationMgr.registerCreature(beetle);
      this.scene.add(beetle.group);
    }

    // B. Common Enemies (Hungerborn, Flesh Crawlers, Mawlings)
    for (let i = 0; i < 3; i++) {
      const hungerborn = new Hungerborn(`hungerborn_${i}`, new THREE.Vector3(-10 + i * 2, 0, -2));
      this.populationMgr.registerCreature(hungerborn);
      this.scene.add(hungerborn.group);

      const crawler = new FleshCrawler(`crawler_${i}`, new THREE.Vector3(10 + i * 2, 0, -4));
      this.populationMgr.registerCreature(crawler);
      this.scene.add(crawler.group);
    }

    const mawling1 = new Mawling('mawling_1', new THREE.Vector3(-4, 0, 12));
    const mawling2 = new Mawling('mawling_2', new THREE.Vector3(4, 0, 12));
    this.populationMgr.registerCreature(mawling1);
    this.populationMgr.registerCreature(mawling2);
    this.scene.add(mawling1.group);
    this.scene.add(mawling2.group);

    // C. Elite Enemies (Gut Reaver & Fleshbound Brute)
    const gutReaver = new GutReaver('gut_reaver_1', new THREE.Vector3(-14, 0, -8));
    const brute = new FleshboundBrute('fleshbound_brute_1', new THREE.Vector3(16, 0, -10));
    this.populationMgr.registerCreature(gutReaver);
    this.populationMgr.registerCreature(brute);
    this.scene.add(gutReaver.group);
    this.scene.add(brute.group);

    // D. Mini-Boss: Devouring Matriarch (Apex Broodmother guarding Maw Trench)
    const matriarch = new DevouringMatriarch('devouring_matriarch', new THREE.Vector3(0, 0, 18));
    this.populationMgr.registerCreature(matriarch);
    this.scene.add(matriarch.group);
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    // 1. Update sub-managers
    this.territoryMgr.update(delta);
    this.populationMgr.update(delta, playerPos);
    this.feedingPitSystem.update(delta);
    this.bloodVegetation.update(delta, playerPos);
    this.tentacleNetwork.update(delta, playerPos);
    this.atmosphere.update(delta);

    // 2. Dynamic Event System scheduler
    this.eventCheckTimer -= delta;
    if (this.eventCheckTimer <= 0) {
      this.eventCheckTimer = 14.0 + Math.random() * 8.0;
      this.evaluateDynamicWorldEvents(playerPos);
    }

    // 3. Active Event timer countdown
    if (this.activeEventTimer > 0) {
      this.activeEventTimer -= delta;
      if (this.activeEventTimer <= 0) {
        this.activeEventName = null;
      }
    }

    // 4. Check mini-boss matriarch call trigger
    const matriarch = this.populationMgr.getCreature('devouring_matriarch') as DevouringMatriarch;
    if (matriarch && matriarch.pendingBroodSummons) {
      matriarch.pendingBroodSummons = false;
      this.dispatcher.emit({
        type: 'matriarch_call',
        realmId: 2,
        timestamp: Date.now(),
        position: matriarch.group.position.clone(),
      });
    }
  }

  /**
   * Autonomous dynamic event scheduler testing conditions for 7 world events
   */
  private evaluateDynamicWorldEvents(playerPos: THREE.Vector3) {
    if (this.activeEventName) return;

    const eventRoll = Math.random();

    if (eventRoll < 0.20) {
      // 1. Blood Bloom: Vines surge and agitate nearby creatures
      this.activeEventName = 'Blood Bloom';
      this.activeEventTimer = 8.0;
      this.bloodVegetation.notifyCombatNoise(playerPos, 2.0);
      this.dispatcher.emit({
        type: 'blood_bloom',
        realmId: 2,
        timestamp: Date.now(),
        position: playerPos.clone(),
      });
    } else if (eventRoll < 0.40) {
      // 2. Carcass Dispute: Common enemies and scavengers fight over a feeding pit
      const pits = this.territoryMgr.getAllPits();
      if (pits.length > 0) {
        const pit = pits[Math.floor(Math.random() * pits.length)];
        this.activeEventName = 'Carcass Dispute';
        this.activeEventTimer = 10.0;
        this.territoryMgr.recordDisturbance(pit.id, 40);
        this.dispatcher.emit({
          type: 'carcass_dispute',
          realmId: 2,
          timestamp: Date.now(),
          position: pit.center.clone(),
          data: { pitId: pit.id },
        });
      }
    } else if (eventRoll < 0.60) {
      // 3. Territorial Conflict: Gut Reaver or Brute claims dominance
      this.activeEventName = 'Territorial Conflict';
      this.activeEventTimer = 12.0;
      this.dispatcher.emit({
        type: 'territorial_conflict',
        realmId: 2,
        timestamp: Date.now(),
        position: new THREE.Vector3(-12, 0, -6),
      });
    } else if (eventRoll < 0.80) {
      // 4. Buried Ambush: Flesh Crawlers emerge from beneath the bone pits
      this.activeEventName = 'Buried Ambush';
      this.activeEventTimer = 6.0;
      this.dispatcher.emit({
        type: 'buried_ambush',
        realmId: 2,
        timestamp: Date.now(),
        position: playerPos.clone(),
      });
    } else {
      // 5. Predator Migration: Pack moves between feeding grounds
      this.activeEventName = 'Predator Migration';
      this.activeEventTimer = 14.0;
      this.dispatcher.emit({
        type: 'predator_migration',
        realmId: 2,
        timestamp: Date.now(),
      });
    }
  }

  private triggerFeedingFrenzy(pos: THREE.Vector3) {
    this.bloodVegetation.notifyCombatNoise(pos, 2.5);
    // Draw nearby common enemies into frantic frenzy
    const commonCreatures = this.populationMgr.getCreaturesByTier('common');
    commonCreatures.forEach(c => {
      if (c.group.position.distanceTo(pos) < 22.0) {
        c.setState('hunting');
        c.stats.speed *= 1.35;
      }
    });
  }

  private triggerMatriarchBroodSpawn(pos: THREE.Vector3) {
    if (!this.scene) return;
    for (let i = 0; i < 2; i++) {
      const broodMawling = new Mawling(
        `brood_${Date.now()}_${i}`,
        pos.clone().add(new THREE.Vector3((i === 0 ? 2 : -2), 0, (Math.random() - 0.5) * 2))
      );
      this.populationMgr.registerCreature(broodMawling);
      this.scene.add(broodMawling.group);
      broodMawling.setState('hunting');
    }
  }

  private handlePredatorMigration(e: any) {
    const destPos = e.data?.destinationPos;
    const creatures = this.populationMgr.getAllCreatures();
    creatures.forEach(c => {
      if (e.position && c.group.position.distanceTo(e.position) < 20.0) {
        if (destPos) {
          // Re-route creatures toward the richer feeding pit
          const toDest = new THREE.Vector3().subVectors(destPos, c.group.position).normalize();
          c.group.position.addScaledVector(toDest, 1.2);
          c.setState('hunting');
          c.stats.speed *= 1.25;
        } else {
          // No alternative food: enter aggressive roaming state
          c.setState('hunting');
        }
      }
    });
  }

  private handlePitDepleted(e: any) {
    if (e.position) {
      // Disperse any remaining feeders into roaming hunt
      const nearby = this.populationMgr.getAllCreatures().filter(c => c.group.position.distanceTo(e.position) < 16.0);
      nearby.forEach(c => {
        c.setState('hunting');
        c.stats.speed *= 1.15;
      });
    }
  }

  /**
   * Sovereign Influence Transition: Upon defeating The Maw of Endless Hunger
   */
  public onSovereignDefeated() {
    this.sovereignDefeated = true;
    this.aggressionModifier = 0.45;

    // Real-time environmental decay: wilting tentacle network
    this.tentacleNetwork.onSovereignDefeated();

    // Behavioral collapse across all living creatures in Abaddon
    const creatures = this.populationMgr.getAllCreatures();
    creatures.forEach(c => {
      c.stats.speed *= 0.65;
      c.stats.hungerLevel = 20;
      if (c.tier !== 'miniboss') {
        c.setState('fleeing');
      }
    });

    // Save persistent state
    const state = EcosystemPersistence.loadRealmState(2);
    state.sovereignDefeated = true;
    state.ecosystemAggressionModifier = 0.45;
    EcosystemPersistence.saveRealmState(state);
  }

  public getActiveEventName(): string | null {
    return this.activeEventName;
  }

  public dispose() {
    this.populationMgr.clear();
    this.territoryMgr.clear();
    this.feedingPitSystem.dispose();
    this.bloodVegetation.dispose();
    this.tentacleNetwork.dispose();
    this.atmosphere.dispose();

    if (this.scene) {
      this.scene.remove(this.feedingPitSystem.group);
      this.scene.remove(this.bloodVegetation.group);
      this.scene.remove(this.tentacleNetwork.group);
      this.scene.remove(this.atmosphere.group);
      this.scene = null;
    }
  }
}
