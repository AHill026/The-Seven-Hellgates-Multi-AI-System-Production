/**
 * The Seven Hellgates - Realm II: Abaddon
 * Official Sovereign: THE MAW OF ENDLESS HUNGER
 *
 * 3-Phase Soulslike Encounter built to authoritative visual canon:
 * - Distinctive horned headpiece with ceremonial mitre
 * - Enormous crimson circular halo with 12 radiant spikes
 * - Tarnished gold ceremonial regalia & hanging scale pendants
 * - Grotesque skeletal & organic anatomy with 5 embedded consumed faces
 * - Exposed 12-fang chest maw
 * - 6 prehensile writhing tentacles
 * - Massive living lower-body structure with Phase 3 colossal expanded ring maw
 * - Gluttonous Monstrance weapon
 *
 * Phases:
 * Phase I   - The Insatiable (100% - 61% HP)
 * Phase II  - The Unbound Hunger (60% - 31% HP)
 * Phase III - The Endless Maw (30% - 0% HP)
 */

import * as THREE from 'three';
import { BossInstance, BossAttackResult } from './BossModels';

export type GluttonyBossState =
  | 'Dormant'
  | 'Intro'
  | 'Idle'
  | 'Telegraph'
  | 'Attack'
  | 'Recovery'
  | 'Transition'
  | 'Summoning'
  | 'Feeding'
  | 'Vortex'
  | 'Stagger'
  | 'ExecutionReady'
  | 'Defeated';

export interface DelayedBileHazard {
  position: THREE.Vector3;
  timer: number;
  maxTimer: number;
  radius: number;
  damage: number;
  detonated: boolean;
}

export interface GluttonySummonRequest {
  type: 'mawling' | 'carrion_leech';
  positions: THREE.Vector3[];
}

export class GluttonySovereignBoss extends BossInstance {
  public currentState: GluttonyBossState = 'Idle';
  public stateTimer: number = 0;
  public override phaseSubtitle: string = 'The Insatiable';

  // Phase HP ratios
  public static readonly PHASE_2_HP_RATIO = 0.60;
  public static readonly PHASE_3_HP_RATIO = 0.30;

  // Transition flags
  private hasTriggeredPhase2Transition: boolean = false;
  private hasTriggeredPhase3Transition: boolean = false;

  // Attack tuning
  private currentTelegraphDuration: number = 0.75;
  private currentAttackDuration: number = 0.85;
  private currentRecoveryDuration: number = 0.95;
  private attackDamageDealtThisSwing: boolean = false;
  private shockwaveSpawnedThisSwing: boolean = false;
  private lockedAttackTargetPos: THREE.Vector3 | null = null;
  private lockedAttackDirection: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

  // Feeding recovery mechanic
  public isFeedingRecoveryActive: boolean = false;
  public feedingChannelTimer: number = 0;
  public feedingHealAmount: number = 75;

  // Phase 3 Vortex Suction
  public isVortexActive: boolean = false;
  public vortexPullStrength: number = 0;
  public vortexCenter: THREE.Vector3 = new THREE.Vector3();

  // Execution window
  public isExecutionReady: boolean = false;
  public executionPromptTimer: number = 0;

  // Pending Hazards & Summons for HellgatesGame loop
  public pendingBileBursts: DelayedBileHazard[] = [];
  public pendingSummonRequest: GluttonySummonRequest | null = null;
  public arenaLightingFactor: number = 1.0;
  public currentDialogueText: string | null = null;
  public dialogueTimer: number = 0;

  // Consumed minion frenzy buff
  public isFrenzyBuffed: boolean = false;
  public frenzyBuffTimer: number = 0;

  // Timers and attack selection
  private attackCycleCounter: number = 0;
  private feedingCooldown: number = 14.0;
  private summonCooldown: number = 18.0;

  constructor(realmId: number = 2) {
    super(realmId);
    this.name = 'The Maw of Endless Hunger';
    this.maxHealth = 1350;
    this.currentHealth = this.maxHealth;
    this.phaseSubtitle = 'The Insatiable';
    this.poise = 120;
    this.maxPoise = 120;

    // Initial greeting
    this.setDialogue(
      "We are the Great Gullet... all that was, and all that shall be, dissolved into our glory.",
      4.5
    );
  }

  public setDialogue(text: string, duration: number = 3.5) {
    this.currentDialogueText = text;
    this.dialogueTimer = duration;
  }

  /**
   * Override takeDamage to handle poise, feeding interruption, and phase transitions
   */
  public override takeDamage(amount: number, isHeavy: boolean = false): boolean {
    if (this.isDead) return false;

    // Interrupt feeding channel if hit
    if (this.isFeedingRecoveryActive) {
      this.isFeedingRecoveryActive = false;
      this.currentState = 'Recovery';
      this.stateTimer = 1.2;
      this.setDialogue("Our communion... severed!", 2.5);
      // Extra poise damage for interrupting
      this.poise = Math.max(0, this.poise - (isHeavy ? 60 : 35));
    }

    // Heavy attack during execution window executes boss
    if (this.isExecutionReady) {
      this.executeBossFinisher();
      return true;
    }

    const effectiveAmount = this.isFrenzyBuffed ? amount * 0.8 : amount;
    this.currentHealth = Math.max(0, this.currentHealth - effectiveAmount);

    let triggeredStagger = false;
    if (!this.isStaggered && !this.isExecutionReady) {
      const poiseDmg = isHeavy ? 50 : 15;
      this.poise = Math.max(0, this.poise - poiseDmg);

      if (this.poise <= 0 || (isHeavy && effectiveAmount >= 65)) {
        if (this.phase === 3 || this.currentHealth <= this.maxHealth * 0.12) {
          // Open execution opportunity
          this.triggerExecutionReady();
          triggeredStagger = true;
        } else {
          triggeredStagger = this.triggerStagger(2.6);
        }
      }
    }

    // Phase 2 check (60% HP)
    if (!this.hasTriggeredPhase2Transition && this.currentHealth <= this.maxHealth * GluttonySovereignBoss.PHASE_2_HP_RATIO) {
      this.triggerPhase2Transition();
      return triggeredStagger;
    }

    // Phase 3 check (30% HP)
    if (!this.hasTriggeredPhase3Transition && this.currentHealth <= this.maxHealth * GluttonySovereignBoss.PHASE_3_HP_RATIO) {
      this.triggerPhase3Transition();
      return triggeredStagger;
    }

    // Boss Defeated
    if (this.currentHealth <= 0 && !this.isDead) {
      this.triggerBossDefeated();
    }

    return triggeredStagger;
  }

  private triggerPhase2Transition() {
    this.hasTriggeredPhase2Transition = true;
    this.phase = 2;
    this.phaseSubtitle = 'The Unbound Hunger';
    this.currentState = 'Transition';
    this.stateTimer = 2.6;
    this.currentAttackName = 'phase_transition_2';

    if (this.visualRig && this.visualRig.onPhaseChange) {
      this.visualRig.onPhaseChange(2);
    }

    this.arenaLightingFactor = 0.65;
    this.auraLight.intensity = 5.5;
    this.auraLight.color.setHex(0xb91c1c);

    this.setDialogue(
      "The vestments rot! The true famine awakens from within!",
      4.0
    );
  }

  private triggerPhase3Transition() {
    this.hasTriggeredPhase3Transition = true;
    this.phase = 3;
    this.phaseSubtitle = 'The Endless Maw';
    this.currentState = 'Transition';
    this.stateTimer = 3.0;
    this.currentAttackName = 'phase_transition_3';

    if (this.visualRig && this.visualRig.onPhaseChange) {
      this.visualRig.onPhaseChange(3);
    }

    this.arenaLightingFactor = 0.40;
    this.auraLight.intensity = 8.5;
    this.auraLight.color.setHex(0xdc2626);

    this.setDialogue(
      "ENTER OUR GULLET! BECOME ETERNAL WITHIN OUR MAW!",
      4.5
    );
  }

  private triggerExecutionReady() {
    this.isExecutionReady = true;
    this.currentState = 'ExecutionReady';
    this.stateTimer = 4.0;
    this.executionPromptTimer = 4.0;
    this.poise = 0;

    // Bow down into vulnerable kneeling posture
    this.group.position.y = -0.5;
    this.head.rotation.x = 0.6;
    this.auraLight.color.setHex(0xf59e0b);
    this.auraLight.intensity = 6.0;

    this.setDialogue("The hunger... falters... STRIKE, AZRAEL!", 3.5);
  }

  public executeBossFinisher() {
    this.isExecutionReady = false;
    this.currentHealth = 0;
    this.triggerBossDefeated();
  }

  private triggerBossDefeated() {
    this.isDead = true;
    this.currentState = 'Defeated';
    this.stateTimer = 0;
    this.isVortexActive = false;
    this.isFeedingRecoveryActive = false;
    this.setDialogue(
      "Even our hunger... ceases... The White Eyes... feast upon our soul...",
      5.5
    );
  }

  /**
   * Main Boss Game Loop Update
   */
  public override update(delta: number, playerPos: THREE.Vector3): BossAttackResult {
    const attackResult: BossAttackResult = {
      damage: 0,
      isShockwave: false,
    };

    // 1. Dialogue Timer
    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0) {
        this.currentDialogueText = null;
      }
    }

    // 2. Cooldown decays
    if (this.feedingCooldown > 0) this.feedingCooldown -= delta;
    if (this.summonCooldown > 0) this.summonCooldown -= delta;
    if (this.frenzyBuffTimer > 0) {
      this.frenzyBuffTimer -= delta;
      if (this.frenzyBuffTimer <= 0) {
        this.isFrenzyBuffed = false;
      }
    }

    // 3. Update Visual Rig animations (halo rotation, tentacle writhing, chest maw)
    if (this.visualRig && this.visualRig.update) {
      const time = Date.now() * 0.001;
      this.visualRig.update(time, delta, this.phase);
    }

    // 4. Handle Defeated state
    if (this.currentState === 'Defeated' || this.isDead) {
      this.group.position.y = Math.max(-3.5, this.group.position.y - delta * 0.8);
      this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 1.2, delta * 2.0);
      this.auraLight.intensity = Math.max(0, this.auraLight.intensity - delta * 1.5);
      return attackResult;
    }

    // 5. Handle ExecutionReady state
    if (this.currentState === 'ExecutionReady') {
      this.stateTimer -= delta;
      this.executionPromptTimer = this.stateTimer;
      if (this.stateTimer <= 0) {
        // Recovery if player missed window
        this.isExecutionReady = false;
        this.poise = this.maxPoise * 0.5;
        this.group.position.y = 0;
        this.head.rotation.x = 0;
        this.currentState = 'Recovery';
        this.stateTimer = 1.0;
      }
      return attackResult;
    }

    // 6. Handle Stagger state
    if (this.isStaggered) {
      this.staggerTimer -= delta;
      this.head.rotation.x = 0.5;
      if (this.weapon) this.weapon.rotation.x = 0.2;
      if (this.staggerTimer <= 0) {
        this.isStaggered = false;
        this.poise = this.maxPoise;
        this.head.rotation.x = 0;
        this.currentState = 'Idle';
        this.stateTimer = 0.8;
      }
      return attackResult;
    }

    // Vector and distance to player
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const distanceToPlayer = toPlayer.length();

    // Subtle breathing displacement
    const t = Date.now() * 0.002;
    this.mainBody.position.y = 1.95 + Math.sin(t) * (this.phase === 3 ? 0.22 : 0.12);

    // Turn toward player when not in mid-swing
    if (this.currentState !== 'Attack' && this.currentState !== 'Transition') {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, delta * 3.5);
    }

    // 7. Boss State Machine
    switch (this.currentState) {
      case 'Transition': {
        this.stateTimer -= delta;
        // Dramatic shockwave burst mid-transition
        if (this.stateTimer <= 1.2 && !this.shockwaveSpawnedThisSwing) {
          this.shockwaveSpawnedThisSwing = true;
          attackResult.isShockwave = true;
          attackResult.shockwavePos = this.group.position.clone();
        }
        if (this.stateTimer <= 0) {
          this.shockwaveSpawnedThisSwing = false;
          this.currentState = 'Idle';
          this.stateTimer = 0.6;
        }
        break;
      }

      case 'Feeding': {
        this.stateTimer -= delta;
        // Channeling siphon from nearby biomass
        if (this.stateTimer <= 0) {
          this.isFeedingRecoveryActive = false;
          this.currentHealth = Math.min(this.maxHealth, this.currentHealth + this.feedingHealAmount);
          this.setDialogue("The flesh restores our divine throne!", 3.0);
          this.currentState = 'Recovery';
          this.stateTimer = 1.0;
        }
        break;
      }

      case 'Vortex': {
        this.stateTimer -= delta;
        this.isVortexActive = true;
        this.vortexCenter.copy(this.group.position);
        this.vortexPullStrength = (3.0 - this.stateTimer) * 2.8;

        // Animate arms raised inward
        this.leftArm.rotation.x = -1.2;
        this.rightArm.rotation.x = -1.2;

        if (distanceToPlayer < 3.2 && !this.attackDamageDealtThisSwing) {
          this.attackDamageDealtThisSwing = true;
          attackResult.damage = 44;
          attackResult.isShockwave = true;
          attackResult.shockwavePos = this.group.position.clone();
        }

        if (this.stateTimer <= 0) {
          this.isVortexActive = false;
          this.attackDamageDealtThisSwing = false;
          this.leftArm.rotation.x = 0;
          this.rightArm.rotation.x = 0;
          this.currentState = 'Recovery';
          this.stateTimer = 1.4;
        }
        break;
      }

      case 'Idle': {
        this.stateTimer -= delta;

        // Check for Feeding Opportunity in Phase 1 & 2
        if (
          this.currentHealth < this.maxHealth * 0.8 &&
          this.feedingCooldown <= 0 &&
          distanceToPlayer > 8.0 &&
          Math.random() < 0.4
        ) {
          this.currentState = 'Feeding';
          this.isFeedingRecoveryActive = true;
          this.stateTimer = 2.8;
          this.feedingCooldown = 22.0;
          this.setDialogue("Drink of the bile... replenish the vessel!", 2.5);
          break;
        }

        // Check for Summoning Swarm
        if (this.summonCooldown <= 0 && Math.random() < 0.45) {
          this.currentState = 'Summoning';
          this.stateTimer = 1.8;
          this.summonCooldown = 24.0;
          this.requestSwarmSummon();
          break;
        }

        // Check for Phase 3 Colossal Maw Vortex
        if (this.phase === 3 && Math.random() < 0.35 && this.stateTimer <= 0) {
          this.currentState = 'Vortex';
          this.stateTimer = 3.2;
          this.attackDamageDealtThisSwing = false;
          this.setDialogue("FEAST UPON THE LIGHT!", 3.0);
          break;
        }

        // Select Next Melee/Telegraphed Attack
        if (this.stateTimer <= 0) {
          this.selectNextAttack(distanceToPlayer);
        }
        break;
      }

      case 'Summoning': {
        this.stateTimer -= delta;
        // Raise Gluttonous Monstrance skyward
        if (this.weapon) this.weapon.rotation.x = -Math.PI * 0.4;
        if (this.stateTimer <= 0) {
          if (this.weapon) this.weapon.rotation.x = Math.PI / 2.3;
          this.currentState = 'Recovery';
          this.stateTimer = 1.0;
        }
        break;
      }

      case 'Telegraph': {
        this.stateTimer -= delta;
        const progress = 1 - (this.stateTimer / this.currentTelegraphDuration);

        // Wind-up animations per attack
        if (this.currentAttackName === 'monstrance_smash') {
          if (this.weapon) this.weapon.rotation.x = THREE.MathUtils.lerp(Math.PI / 2.3, -Math.PI * 0.4, progress);
          this.rightArm.rotation.x = THREE.MathUtils.lerp(0, -1.3, progress);
        } else if (this.currentAttackName === 'tentacle_sweep') {
          this.group.rotation.y += delta * 1.5;
        } else if (this.currentAttackName === 'cataclysmic_bile_burst') {
          if (this.weapon) this.weapon.rotation.x = THREE.MathUtils.lerp(Math.PI / 2.3, -1.8, progress);
        } else if (this.currentAttackName === 'destabilized_halo_flare') {
          this.auraLight.intensity = 4.0 + progress * 5.0;
        }

        if (this.stateTimer <= 0) {
          this.currentState = 'Attack';
          this.stateTimer = this.currentAttackDuration;
          this.attackDamageDealtThisSwing = false;
          this.shockwaveSpawnedThisSwing = false;
          this.lockedAttackTargetPos = playerPos.clone();
          this.lockedAttackDirection.copy(toPlayer).normalize();
        }
        break;
      }

      case 'Attack': {
        this.stateTimer -= delta;
        const swingProgress = 1 - (this.stateTimer / this.currentAttackDuration);

        // Execute Attack Swing & Hitbox Detection
        if (this.currentAttackName === 'monstrance_smash') {
          if (this.weapon) this.weapon.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.4, Math.PI * 0.6, swingProgress);
          this.rightArm.rotation.x = THREE.MathUtils.lerp(-1.3, 1.2, swingProgress);

          if (swingProgress >= 0.45 && !this.shockwaveSpawnedThisSwing) {
            this.shockwaveSpawnedThisSwing = true;
            attackResult.isShockwave = true;
            const smashPos = this.group.position.clone().addScaledVector(this.lockedAttackDirection, 3.2);
            attackResult.shockwavePos = smashPos;

            if (distanceToPlayer <= 5.8) {
              attackResult.damage = this.isFrenzyBuffed ? 38 : 30;
              this.attackDamageDealtThisSwing = true;
            }
          }
        } else if (this.currentAttackName === 'tentacle_sweep') {
          this.group.rotation.y += delta * 8.5;
          if (distanceToPlayer <= 6.5 && !this.attackDamageDealtThisSwing) {
            attackResult.damage = this.isFrenzyBuffed ? 28 : 22;
            this.attackDamageDealtThisSwing = true;
          }
        } else if (this.currentAttackName === 'unbound_flurry') {
          // Triple hit combo
          const hitIdx = Math.floor(swingProgress * 3);
          if (distanceToPlayer <= 5.2 && !this.attackDamageDealtThisSwing) {
            attackResult.damage = 18;
            this.attackDamageDealtThisSwing = true;
          }
          if (hitIdx === 2 && !this.shockwaveSpawnedThisSwing) {
            this.shockwaveSpawnedThisSwing = true;
            attackResult.isShockwave = true;
            attackResult.shockwavePos = this.group.position.clone();
          }
        } else if (this.currentAttackName === 'destabilized_halo_flare') {
          if (swingProgress >= 0.3 && !this.shockwaveSpawnedThisSwing) {
            this.shockwaveSpawnedThisSwing = true;
            attackResult.isShockwave = true;
            attackResult.shockwavePos = this.group.position.clone();
            if (distanceToPlayer <= 8.5) {
              attackResult.damage = 36;
            }
          }
        } else if (this.currentAttackName === 'cataclysmic_bile_burst') {
          if (swingProgress >= 0.4 && !this.shockwaveSpawnedThisSwing) {
            this.shockwaveSpawnedThisSwing = true;
            this.spawnBileGeysers();
            attackResult.isShockwave = true;
            attackResult.shockwavePos = this.group.position.clone();
          }
        }

        if (this.stateTimer <= 0) {
          this.currentState = 'Recovery';
          this.stateTimer = this.currentRecoveryDuration;
          if (this.weapon) this.weapon.rotation.x = Math.PI / 2.3;
          this.rightArm.rotation.x = 0;
        }
        break;
      }

      case 'Recovery': {
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
          this.currentState = 'Idle';
          this.stateTimer = this.phase === 3 ? 0.4 : (this.phase === 2 ? 0.6 : 0.9);
        }
        break;
      }
    }

    return attackResult;
  }

  private selectNextAttack(distToPlayer: number) {
    this.attackCycleCounter++;
    this.currentState = 'Telegraph';

    if (this.phase === 1) {
      if (distToPlayer <= 5.5) {
        if (this.attackCycleCounter % 2 === 0) {
          this.currentAttackName = 'monstrance_smash';
          this.currentTelegraphDuration = 0.8;
          this.currentAttackDuration = 0.7;
          this.currentRecoveryDuration = 1.0;
        } else {
          this.currentAttackName = 'tentacle_sweep';
          this.currentTelegraphDuration = 0.6;
          this.currentAttackDuration = 0.8;
          this.currentRecoveryDuration = 0.9;
        }
      } else {
        this.currentAttackName = 'monstrance_smash';
        this.currentTelegraphDuration = 0.9;
        this.currentAttackDuration = 0.8;
        this.currentRecoveryDuration = 1.1;
      }
    } else if (this.phase === 2) {
      const roll = Math.random();
      if (roll < 0.4) {
        this.currentAttackName = 'unbound_flurry';
        this.currentTelegraphDuration = 0.55;
        this.currentAttackDuration = 1.0;
        this.currentRecoveryDuration = 0.8;
      } else if (roll < 0.7) {
        this.currentAttackName = 'destabilized_halo_flare';
        this.currentTelegraphDuration = 0.85;
        this.currentAttackDuration = 0.75;
        this.currentRecoveryDuration = 1.0;
        this.setDialogue("Let the crimson halo cleanse thy flesh!", 2.8);
      } else {
        this.currentAttackName = 'tentacle_sweep';
        this.currentTelegraphDuration = 0.5;
        this.currentAttackDuration = 0.7;
        this.currentRecoveryDuration = 0.7;
      }
    } else {
      // Phase 3: Colossal attacks
      const roll = Math.random();
      if (roll < 0.5) {
        this.currentAttackName = 'cataclysmic_bile_burst';
        this.currentTelegraphDuration = 0.9;
        this.currentAttackDuration = 0.9;
        this.currentRecoveryDuration = 1.1;
        this.setDialogue("THE PIT SURGES WITH BILE!", 3.0);
      } else {
        this.currentAttackName = 'unbound_flurry';
        this.currentTelegraphDuration = 0.45;
        this.currentAttackDuration = 0.9;
        this.currentRecoveryDuration = 0.7;
      }
    }

    this.stateTimer = this.currentTelegraphDuration;
  }

  private requestSwarmSummon() {
    const p1 = this.group.position.clone().add(new THREE.Vector3(-4.5, 0, 3.5));
    const p2 = this.group.position.clone().add(new THREE.Vector3(4.5, 0, 3.5));
    this.pendingSummonRequest = {
      type: 'mawling',
      positions: [p1, p2],
    };
    this.setDialogue("Spill forth, children of the gorge! Feed!", 3.0);
  }

  private spawnBileGeysers() {
    const offsets = [
      new THREE.Vector3(-6, 0, -3),
      new THREE.Vector3(6, 0, -3),
      new THREE.Vector3(0, 0, 6),
      new THREE.Vector3(0, 0, -7),
    ];
    offsets.forEach(off => {
      const pos = this.group.position.clone().add(off);
      this.pendingBileBursts.push({
        position: pos,
        timer: 1.4,
        maxTimer: 1.4,
        radius: 3.5,
        damage: 26,
        detonated: false,
      });
    });
  }
}
