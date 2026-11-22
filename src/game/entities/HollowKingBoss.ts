/**
 * The Seven Hellgates - The Hollow King Boss Upgrade
 * High-quality 3-phase Soulslike boss encounter with hybrid adaptive AI,
 * clear state machine, authored attack telegraphs, and canon lore integration.
 *
 * Phase I   - The Forgotten Monarch (100% - 61% HP)
 * Phase II  - The King Beneath (60% - 31% HP)
 * Phase III - The Last Crown (30% - 0% HP)
 */

import * as THREE from 'three';
import { BossInstance, BossAttackResult } from './BossModels';
import { materialFactory } from '../vfx/MaterialFactory';
import {
  createBeveledPrisonBlade,
  createSculptedImperialCrown,
} from './CharacterGeometry';
import { voiceManager } from '../audio/VoiceManager';

export type BossState =
  | 'Dormant'
  | 'Intro'
  | 'Idle'
  | 'Telegraph'
  | 'Attack'
  | 'Recovery'
  | 'Transition'
  | 'Summon'
  | 'Stagger'
  | 'Defeated'
  | 'Reset';

export interface SpectralExplosionHazard {
  position: THREE.Vector3;
  timer: number;
  maxTimer: number;
  radius: number;
  damage: number;
  detonated: boolean;
  mesh?: THREE.Mesh;
}

export interface PlayerCombatHabits {
  recentDodgeDirections: ('left' | 'right' | 'back' | 'forward')[];
  recentHealAttempts: number;
  isAggressiveMelee: boolean;
  averageDistance: number;
  lastDodgeTime: number;
}

export class HollowKingBoss extends BossInstance {
  // Extended state machine
  public currentState: BossState = 'Idle';
  public stateTimer: number = 0;
  public phaseSubtitle: string = 'The Forgotten Monarch';

  // 3-Phase thresholds
  public static readonly PHASE_2_HP_RATIO = 0.60;
  public static readonly PHASE_3_HP_RATIO = 0.30;

  // Visual rig components
  private greatswordGroup: THREE.Group;
  private greatswordBlade: THREE.Mesh;
  private greatswordRunes: THREE.Mesh;
  private armorCracks: THREE.Mesh[] = [];
  private spectralCrown: THREE.Group;
  private spectralAuraPointLight: THREE.PointLight;
  private bladeTrailMesh: THREE.Mesh | null = null;

  // Materials for phase transitions
  private ironArmorMat: THREE.MeshStandardMaterial;
  private ironTrimMat: THREE.MeshStandardMaterial;
  private crackedGlowMat: THREE.MeshStandardMaterial;
  private runeSealMat: THREE.MeshStandardMaterial;
  private spectralCrownMat: THREE.MeshStandardMaterial;

  // Hybrid Adaptive AI Tracking
  public playerHabits: PlayerCombatHabits = {
    recentDodgeDirections: [],
    recentHealAttempts: 0,
    isAggressiveMelee: false,
    averageDistance: 6.0,
    lastDodgeTime: 0,
  };

  private adaptiveCooldowns: Map<string, number> = new Map();
  private lockedAttackTargetPos: THREE.Vector3 | null = null;
  private lockedAttackDirection: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  private attackDamageDealtThisSwing: boolean = false;
  private shockwaveSpawnedThisSwing: boolean = false;
  private currentTelegraphDuration: number = 0.6;
  private currentAttackDuration: number = 0.8;
  private currentRecoveryDuration: number = 0.9;

  // Active hazards & events returned to engine
  public pendingSummons: boolean = false;
  public pendingExplosions: SpectralExplosionHazard[] = [];
  public arenaLightingFactor: number = 1.0;
  public currentDialogueText: string | null = null;
  public dialogueTimer: number = 0;

  // Transition flags
  private hasTriggeredPhase2Transition: boolean = false;
  private hasTriggeredPhase3Transition: boolean = false;
  private summonsRemainingInPhase2: number = 1;
  public groundYResolver?: (x: number, z: number) => number;

  constructor(realmId: number = 1) {
    super(realmId);
    this.name = 'The Hollow King';
    this.maxHealth = 1250;
    this.currentHealth = this.maxHealth;
    this.phase = 1;
    this.phaseSubtitle = 'The Forgotten Monarch';

    // Construct PBR materials (dark iron Damascus + restrained runic conduits)
    this.ironArmorMat = materialFactory.createHollowMonarchSteel();
    this.ironTrimMat = materialFactory.createHollowMonarchSteelTrim();

    this.crackedGlowMat = new THREE.MeshStandardMaterial({
      color: 0x071b2d,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.24,
      roughness: 0.30,
      metalness: 0.80,
    });

    this.runeSealMat = new THREE.MeshStandardMaterial({
      color: 0x0e283d,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.38,
      roughness: 0.26,
    });

    this.spectralCrownMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.35,
      transparent: true,
      opacity: 0.0, // hidden in phase 1 & 2
    });

    // Cleanly detach and dispose any base weapon before mounting the custom interactive Greatsword
    if (this.weapon) {
      this.rightArm.remove(this.weapon);
      this.disposeHierarchy(this.weapon);
      this.weapon = null;
    }

    // Mount the ancient Greatsword: "The Prison Seal Blade"
    this.greatswordGroup = new THREE.Group();
    const { blade, runes } = this.buildPrisonSealGreatsword();
    this.greatswordBlade = blade;
    this.greatswordRunes = runes;
    this.greatswordGroup.position.set(0, -0.4, 0.45);
    this.greatswordGroup.rotation.x = Math.PI / 2.3;
    this.rightArm.add(this.greatswordGroup);
    this.weapon = this.greatswordGroup;

    // Build inner sternum/thoracic runic seal fragments revealed strongly in Phase 2 & 3
    this.buildFracturedArmorMeshes();

    // Reuse the Spectral Crown mounted by buildHollowKingModel (if present) to avoid duplicate crowns
    const rigCrown = this.visualRig?.phase3Visuals?.[0] as THREE.Group | undefined;
    if (rigCrown) {
      this.spectralCrown = rigCrown;
      const rigCrownMat = this.visualRig?.emissiveMaterials?.[1];
      if (rigCrownMat) {
        this.spectralCrownMat = rigCrownMat;
      }
    } else {
      this.spectralCrown = this.buildSpectralCrown();
      this.head.add(this.spectralCrown);
    }

    // Dedicated aura light for high-contrast phase highlights
    this.spectralAuraPointLight = new THREE.PointLight(0x38bdf8, 1.35, 13);
    this.spectralAuraPointLight.position.set(0, 2.5, 0);
    this.group.add(this.spectralAuraPointLight);

    // Set initial dialogue hint
    this.setDialogue("Azrael... you wander once more into the shadow of the Seal.", 4.0);
  }

  /**
   * Constructs the massive Prison Seal Greatsword wielded by the Hollow King.
   * Canon: The sword is a forged fragment of the seal holding the cosmic entity.
   */
  private buildPrisonSealGreatsword(): { blade: THREE.Mesh; runes: THREE.Mesh } {
    const sword = this.greatswordGroup;
    while (sword.children.length > 0) {
      sword.remove(sword.children[0]);
    }

    const { swordGroup, bladeMesh, runeMesh } = createBeveledPrisonBlade(
      this.ironArmorMat,
      this.runeSealMat,
      this.ironTrimMat,
      materialFactory.createWeatheredLeather()
    );

    while (swordGroup.children.length > 0) {
      sword.add(swordGroup.children[0]);
    }

    return { blade: bladeMesh, runes: runeMesh };
  }

  /**
   * Builds recessed soul-hearth conduits deep inside the open skeletal thoracic cavity
   * behind the sternum & ribs, glowing brilliantly as the Seal cracks in Phase 2 and Phase 3.
   */
  private buildFracturedArmorMeshes() {
    const mainBody = this.mainBody;

    const coreGeom = new THREE.SphereGeometry(0.056, 18, 14);
    for (let i = 0; i < 2; i++) {
      const soulNode = new THREE.Mesh(coreGeom, this.crackedGlowMat);
      soulNode.scale.set(0.95, 1.25, 0.65);
      soulNode.position.set(0, 0.78 - i * 0.22, -0.01);
      mainBody.add(soulNode);
      this.armorCracks.push(soulNode);
    }
  }

  /**
   * Builds the Phase 3 Spectral Crown of Cerulean Flame (fallback if not attached by rig)
   */
  private buildSpectralCrown(): THREE.Group {
    const crownGroup = createSculptedImperialCrown(0.42, 0.36, 7, this.spectralCrownMat);
    crownGroup.position.set(0, 0.72, 0);
    crownGroup.scale.set(0.01, 0.01, 0.01); // starts invisible
    return crownGroup;
  }

  public setDialogue(text: string, duration: number = 3.5) {
    this.currentDialogueText = text;
    this.dialogueTimer = duration;
  }

  /**
   * Health & Phase transition handling
   */
  public override takeDamage(amount: number, isHeavy: boolean = false): boolean {
    if (this.isDead || this.currentState === 'Transition' || this.currentState === 'Defeated') {
      return false;
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount);

    let triggeredStagger = false;
    if (!this.isStaggered) {
      const poiseDmg = isHeavy ? 45 : 12;
      this.poise = Math.max(0, this.poise - poiseDmg);

      if (this.poise <= 0 || (isHeavy && amount >= 60)) {
        triggeredStagger = this.triggerStagger(2.4);
      }
    }

    // Phase 2 Trigger Check (60% HP)
    if (!this.hasTriggeredPhase2Transition && this.currentHealth <= this.maxHealth * HollowKingBoss.PHASE_2_HP_RATIO) {
      this.triggerPhase2Transition();
      return triggeredStagger;
    }

    // Phase 3 Trigger Check (30% HP)
    if (!this.hasTriggeredPhase3Transition && this.currentHealth <= this.maxHealth * HollowKingBoss.PHASE_3_HP_RATIO) {
      this.triggerPhase3Transition();
      return triggeredStagger;
    }

    // Boss Defeated
    if (this.currentHealth <= 0) {
      this.isDead = true;
      this.currentState = 'Defeated';
      this.stateTimer = 0;
      const defeatLine = "The seal... is broken. The White Eyes open... Azrael...";
      this.setDialogue(defeatLine, 5.0);
      voiceManager.playBossDefeatLine(this.realmId);
    }

    return triggeredStagger;
  }

  private triggerPhase2Transition() {
    this.hasTriggeredPhase2Transition = true;
    this.phase = 2;
    this.phaseSubtitle = 'The King Beneath';
    this.currentState = 'Transition';
    this.stateTimer = 2.4;
    this.currentAttackName = 'phase_transition_2';

    // Visual transformation: Armor cracks, eyes & thoracic seal glow with restrained cerulean power
    this.visualRig?.onPhaseChange(2);
    this.crackedGlowMat.emissiveIntensity = 1.15;
    this.crackedGlowMat.emissive.setHex(0x0284c7);
    this.runeSealMat.emissiveIntensity = 1.05;
    this.runeSealMat.emissive.setHex(0x38bdf8);
    this.ironArmorMat.emissiveIntensity = 0.24;
    this.ironTrimMat.emissiveIntensity = 0.20;
    this.spectralAuraPointLight.intensity = 3.8;
    this.spectralAuraPointLight.color.setHex(0x0284c7);

    // Arena light dimming signal
    this.arenaLightingFactor = 0.55;

    this.setDialogue("The seal splinters... You bear his scent, wanderer!", 3.8);
    voiceManager.playBossPhaseLine(this.realmId, 2);
  }

  private triggerPhase3Transition() {
    this.hasTriggeredPhase3Transition = true;
    this.phase = 3;
    this.phaseSubtitle = 'The Last Crown';
    this.currentState = 'Transition';
    this.stateTimer = 2.8;
    this.currentAttackName = 'phase_transition_3';

    // Reveal Spectral Crown & ignite skull eyes / thoracic core
    this.visualRig?.onPhaseChange(3);
    this.spectralCrown.scale.set(1.12, 1.12, 1.12);
    this.spectralCrownMat.opacity = 0.56;

    // Controlled Cerulean resonance (no excessive neon bloom)
    this.crackedGlowMat.emissiveIntensity = 1.38;
    this.crackedGlowMat.emissive.setHex(0x38bdf8);
    this.runeSealMat.emissiveIntensity = 1.42;
    this.runeSealMat.emissive.setHex(0x38bdf8);
    this.ironArmorMat.emissiveIntensity = 0.34;
    this.ironTrimMat.emissiveIntensity = 0.28;
    this.spectralAuraPointLight.intensity = 5.2;
    this.spectralAuraPointLight.color.setHex(0x38bdf8);

    // Dramatic arena gloom
    this.arenaLightingFactor = 0.35;

    this.setDialogue("The White Eyes... they stir within the stone! Do not let the gates fall!", 4.2);
    voiceManager.playBossPhaseLine(this.realmId, 3);
  }

  /**
   * Main Boss Game Loop Update
   */
  public override update(delta: number, playerPos: THREE.Vector3): BossAttackResult {
    // 1. Handle Dialogue Countdown
    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0) {
        this.currentDialogueText = null;
      }
    }

    // 2. Decrement adaptive counter cooldowns
    this.adaptiveCooldowns.forEach((cd, key) => {
      if (cd > 0) this.adaptiveCooldowns.set(key, Math.max(0, cd - delta));
    });

    const groundY = this.groundYResolver
      ? this.groundYResolver(this.group.position.x, this.group.position.z)
      : 0;

    // 3. Handle Death Animation
    if (this.currentState === 'Defeated' || this.isDead) {
      this.group.position.y = Math.max(groundY - 2.2, this.group.position.y - delta * 0.7);
      this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, -Math.PI / 2.2, delta * 2.5);
      this.spectralAuraPointLight.intensity = Math.max(0, this.spectralAuraPointLight.intensity - delta * 1.5);
      return { damage: 0, isShockwave: false };
    }

    // 4. Update Spectral Crown float animation in Phase 3
    if (this.phase === 3) {
      const time = Date.now() * 0.003;
      this.spectralCrown.rotation.y += delta * 1.2;
      this.spectralCrown.position.y = 0.72 + Math.sin(time) * 0.06;
    }

    // 5. Grounded posture breathing (slight upward rise only so skeletal feet never clip beneath ground plane)
    const t = Date.now() * 0.002;
    (this as any).mainBody.position.y = 1.8 + Math.max(0, Math.sin(t)) * (this.phase === 3 ? 0.16 : 0.02);

    // Vector to player
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const distanceToPlayer = toPlayer.length();

    // Track rolling player distance habit
    this.playerHabits.averageDistance = THREE.MathUtils.lerp(this.playerHabits.averageDistance, distanceToPlayer, delta * 0.5);

    // 6. BOSS STATE MACHINE
    let damageDealt = 0;
    let shockwaveTriggered = false;
    let shockwavePosition: THREE.Vector3 | undefined = undefined;

    switch (this.currentState) {
      case 'Transition': {
        this.stateTimer -= delta;
        // Float upward slightly during transformation
        this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, groundY + 0.6, delta * 3);
        (this as any).rightArm.rotation.set(-1.2, 0, 0.4);
        (this as any).leftArm.rotation.set(-1.2, 0, -0.4);

        if (this.stateTimer <= 0) {
          this.group.position.y = groundY;
          this.currentState = 'Idle';
          this.cooldownTimer = 0.5;
          // Spawn transitional shockwave
          shockwaveTriggered = true;
          shockwavePosition = this.group.position.clone();
        }
        break;
      }

      case 'Idle': {
        // Smoothly face player during Idle
        if (distanceToPlayer > 0.1) {
          const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
          this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetAngle, 4.0, delta);
        }

        // Reset arm poses to neutral two-handed stance
        this.resetArmPoses(delta);

        // Movement / Closing distance if far
        if (distanceToPlayer > 5.5 && this.cooldownTimer <= 0.8) {
          const moveSpeed = this.phase === 3 ? 3.8 : (this.phase === 2 ? 3.0 : 2.2);
          const step = toPlayer.clone().normalize().multiplyScalar(moveSpeed * delta);
          this.group.position.add(step);
        }
        this.group.position.y = this.groundYResolver
          ? this.groundYResolver(this.group.position.x, this.group.position.z)
          : groundY;

        // Attack selection once cooldown expires
        if (this.cooldownTimer <= 0) {
          this.selectNextAttack(distanceToPlayer);
        } else {
          this.cooldownTimer -= delta;
        }
        break;
      }

      case 'Telegraph': {
        this.stateTimer -= delta;
        const progress = 1.0 - (this.stateTimer / this.currentTelegraphDuration);

        // Turn towards player during early telegraph only (locks at 65% to guarantee fair dodging!)
        if (progress < 0.65 && distanceToPlayer > 0.1) {
          const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
          this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetAngle, 5.0, delta);
          this.lockedAttackDirection.copy(toPlayer).normalize();
          this.lockedAttackTargetPos = playerPos.clone();
        }

        this.animateTelegraphPose(this.currentAttackName, progress);

        if (this.stateTimer <= 0) {
          this.currentState = 'Attack';
          this.stateTimer = this.currentAttackDuration;
          this.attackDamageDealtThisSwing = false;
          this.shockwaveSpawnedThisSwing = false;
        }
        break;
      }

      case 'Attack': {
        this.stateTimer -= delta;
        const progress = 1.0 - (this.stateTimer / this.currentAttackDuration);

        const attackResult = this.executeActiveAttack(this.currentAttackName, progress, distanceToPlayer, delta);
        if (attackResult.damage > 0) damageDealt = attackResult.damage;
        if (attackResult.isShockwave) {
          shockwaveTriggered = true;
          shockwavePosition = attackResult.shockwavePos;
        }

        if (this.stateTimer <= 0) {
          this.currentState = 'Recovery';
          this.stateTimer = this.currentRecoveryDuration;
        }
        break;
      }

      case 'Recovery': {
        this.stateTimer -= delta;
        // Boss is vulnerable during recovery! Fair Soulslike opening.
        this.resetArmPoses(delta * 2.0);

        if (this.stateTimer <= 0) {
          this.currentState = 'Idle';
          // Cooldown between combo attempts
          const baseCd = this.phase === 3 ? 1.0 : (this.phase === 2 ? 1.4 : 1.9);
          this.cooldownTimer = baseCd + Math.random() * 0.4;
        }
        break;
      }

      case 'Summon': {
        this.stateTimer -= delta;
        // Raise sword to summon spectral guards
        (this as any).rightArm.rotation.set(-Math.PI * 0.8, 0, 0);
        if (this.stateTimer <= 0) {
          this.currentState = 'Recovery';
          this.stateTimer = 1.2;
        }
        break;
      }

      case 'Stagger': {
        this.stateTimer -= delta;
        this.isStaggered = true;
        this.staggerTimer = this.stateTimer;

        if (this.staggerFlashTimer > 0) {
          this.staggerFlashTimer -= delta;
          if (this.staggerFlashTimer <= 0) {
            this.spectralAuraPointLight.color.setHex(this.phase === 2 ? 0x0284c7 : 0x38bdf8);
            this.spectralAuraPointLight.intensity = this.phase === 3 ? 7.5 : (this.phase === 2 ? 5.0 : 2.0);
            this.visualRig?.emissiveMaterials.forEach(m => {
              m.emissive.setHex(this.phase === 3 ? 0x67e8f9 : 0x38bdf8);
              m.emissiveIntensity = this.phase === 3 ? 2.4 : (this.phase === 2 ? 1.5 : 0.45);
            });
          }
        }

        // Monarch slumped over his greatsword, posture completely broken
        const body = (this as any).mainBody as THREE.Group;
        const rArm = (this as any).rightArm as THREE.Group;
        const lArm = (this as any).leftArm as THREE.Group;
        const head = (this as any).head as THREE.Group;

        body.position.y = THREE.MathUtils.lerp(body.position.y, 1.15, delta * 5.0);
        body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, -0.36, delta * 4.5);
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.48, delta * 5.0);
        head.rotation.z = Math.sin(Date.now() * 0.008) * 0.08;

        // Limp drooping arms resting weapon on ground
        rArm.rotation.set(0.65, 0.15, -0.15);
        lArm.rotation.set(0.65, -0.15, 0.15);

        if (this.stateTimer <= 0) {
          this.isStaggered = false;
          this.poise = this.maxPoise;
          this.currentState = 'Recovery';
          this.stateTimer = 0.8;
          body.rotation.x = 0;
          head.rotation.x = 0;
          head.rotation.z = 0;
        }
        break;
      }
    }

    return {
      damage: damageDealt,
      isShockwave: shockwaveTriggered,
      shockwavePos: shockwavePosition,
    };
  }

  /**
   * Hybrid Adaptive AI: Selects next attack based on phase, player habits, distance, and cooldowns.
   */
  private selectNextAttack(dist: number) {
    let chosenAttack = '';

    // Phase-specific attack pools
    if (this.phase === 1) {
      // PHASE 1: The Forgotten Monarch
      // Options: kings_judgment, crownbreaker, royal_execution, ground_rupture
      if (dist <= 3.2) {
        // Close range: Sweeping Crownbreaker or Royal Execution
        chosenAttack = Math.random() < 0.55 ? 'crownbreaker' : 'royal_execution';
      } else if (dist <= 6.0) {
        // Mid range: King's Judgment overhead or Ground Rupture shockwave
        chosenAttack = Math.random() < 0.5 ? 'kings_judgment' : 'ground_rupture';
      } else {
        // Far range: Ground Rupture or advance
        chosenAttack = 'ground_rupture';
      }
    } else if (this.phase === 2) {
      // PHASE 2: The King Beneath
      // Options: fallen_court, kings_ruin, shattered_crown, sovereigns_reach

      // Check summon condition (Fallen Court) - Max once per phase
      if (this.summonsRemainingInPhase2 > 0 && !this.adaptiveCooldowns.get('fallen_court')) {
        this.summonsRemainingInPhase2--;
        this.adaptiveCooldowns.set('fallen_court', 25.0);
        this.pendingSummons = true;
        this.currentState = 'Summon';
        this.stateTimer = 2.0;
        this.currentAttackName = 'fallen_court';
        this.setDialogue("Rise, Knights of the First Gate! Defend the seal!", 3.5);
        return;
      }

      // Adaptive response: If player likes kiting/rolling backward
      const recentBackDodges = this.playerHabits.recentDodgeDirections.filter(d => d === 'back').length;
      if (recentBackDodges >= 2 && !this.adaptiveCooldowns.get('sovereigns_reach')) {
        this.adaptiveCooldowns.set('sovereigns_reach', 8.0);
        chosenAttack = 'sovereigns_reach';
      } else if (dist > 5.0 && !this.adaptiveCooldowns.get('kings_ruin')) {
        // Delayed spectral explosions to zone distant players
        this.adaptiveCooldowns.set('kings_ruin', 9.0);
        chosenAttack = 'kings_ruin';
      } else if (dist <= 3.5) {
        chosenAttack = Math.random() < 0.6 ? 'shattered_crown' : 'sovereigns_reach';
      } else {
        chosenAttack = Math.random() < 0.5 ? 'kings_ruin' : 'sovereigns_reach';
      }
    } else {
      // PHASE 3: The Last Crown
      // Options: final_decree, crownfall, last_judgment, kings_end

      // Signature ultimate attack: King's End (has high damage but huge 2.4s recovery punish window)
      if (!this.adaptiveCooldowns.get('kings_end') && Math.random() < 0.35) {
        this.adaptiveCooldowns.set('kings_end', 14.0);
        chosenAttack = 'kings_end';
      } else if (dist <= 4.0 && !this.adaptiveCooldowns.get('crownfall')) {
        // Area denial shockwave
        this.adaptiveCooldowns.set('crownfall', 8.0);
        chosenAttack = 'crownfall';
      } else if (dist <= 3.6) {
        chosenAttack = Math.random() < 0.6 ? 'last_judgment' : 'final_decree';
      } else {
        chosenAttack = Math.random() < 0.5 ? 'final_decree' : 'last_judgment';
      }
    }

    // Set attack timings based on the chosen signature attack
    this.currentAttackName = chosenAttack;
    this.configureAttackTimings(chosenAttack);
    this.currentState = 'Telegraph';
    this.stateTimer = this.currentTelegraphDuration;
  }

  private configureAttackTimings(attackName: string) {
    switch (attackName) {
      // Phase 1
      case 'kings_judgment':
        this.currentTelegraphDuration = 0.75;
        this.currentAttackDuration = 0.65;
        this.currentRecoveryDuration = 1.0;
        break;
      case 'crownbreaker':
        this.currentTelegraphDuration = 0.55;
        this.currentAttackDuration = 0.60;
        this.currentRecoveryDuration = 0.85;
        break;
      case 'royal_execution':
        this.currentTelegraphDuration = 0.65;
        this.currentAttackDuration = 1.1;
        this.currentRecoveryDuration = 0.95;
        break;
      case 'ground_rupture':
        this.currentTelegraphDuration = 0.85;
        this.currentAttackDuration = 0.70;
        this.currentRecoveryDuration = 1.1;
        break;

      // Phase 2
      case 'shattered_crown':
        this.currentTelegraphDuration = 0.45;
        this.currentAttackDuration = 0.95;
        this.currentRecoveryDuration = 0.80;
        break;
      case 'sovereigns_reach':
        this.currentTelegraphDuration = 0.55;
        this.currentAttackDuration = 0.70;
        this.currentRecoveryDuration = 0.85;
        break;
      case 'kings_ruin':
        this.currentTelegraphDuration = 0.70;
        this.currentAttackDuration = 0.60;
        this.currentRecoveryDuration = 0.90;
        break;

      // Phase 3
      case 'final_decree':
        this.currentTelegraphDuration = 0.70;
        this.currentAttackDuration = 0.85;
        this.currentRecoveryDuration = 1.0;
        break;
      case 'crownfall':
        this.currentTelegraphDuration = 0.85;
        this.currentAttackDuration = 0.75;
        this.currentRecoveryDuration = 1.1;
        break;
      case 'last_judgment':
        this.currentTelegraphDuration = 0.50;
        this.currentAttackDuration = 1.2;
        this.currentRecoveryDuration = 0.90;
        break;
      case 'kings_end':
        this.currentTelegraphDuration = 0.95; // very telegraphed!
        this.currentAttackDuration = 0.80;
        this.currentRecoveryDuration = 2.4;  // massive punishable window!
        break;

      default:
        this.currentTelegraphDuration = 0.6;
        this.currentAttackDuration = 0.7;
        this.currentRecoveryDuration = 0.9;
        break;
    }
  }

  /**
   * Animates readable windup poses during the Telegraph state
   */
  private animateTelegraphPose(attackName: string, progress: number) {
    const rArm = (this as any).rightArm as THREE.Group;
    const lArm = (this as any).leftArm as THREE.Group;
    const body = (this as any).mainBody as THREE.Group;

    switch (attackName) {
      case 'kings_judgment':
      case 'final_decree':
      case 'kings_end': {
        // High overhead two-handed raise
        rArm.rotation.set(-Math.PI * 0.9 * progress, -0.2 * progress, 0);
        lArm.rotation.set(-Math.PI * 0.9 * progress, 0.2 * progress, 0);
        this.greatswordGroup.rotation.x = Math.PI / 2.3 + (progress * 0.6);
        body.rotation.y = 0;
        break;
      }
      case 'crownbreaker':
      case 'shattered_crown': {
        // Windup far back to the right shoulder
        rArm.rotation.set(-0.4 * progress, -1.3 * progress, 0.2 * progress);
        lArm.rotation.set(-0.2 * progress, -0.8 * progress, 0);
        body.rotation.y = -0.6 * progress;
        break;
      }
      case 'ground_rupture':
      case 'crownfall':
      case 'kings_ruin': {
        // Sword point directed down, body crouching slightly
        rArm.rotation.set(-0.6 * progress, 0, 0);
        lArm.rotation.set(-0.6 * progress, 0, 0);
        body.position.y = 1.8 - 0.3 * progress;
        break;
      }
      default: {
        rArm.rotation.set(-0.5 * progress, -0.6 * progress, 0);
        body.rotation.y = -0.3 * progress;
        break;
      }
    }
  }

  /**
   * Executes the active attack swing and computes hit detection / effects
   */
  private executeActiveAttack(
    attackName: string,
    progress: number,
    dist: number,
    delta: number
  ): { damage: number; isShockwave: boolean; shockwavePos?: THREE.Vector3 } {
    const rArm = (this as any).rightArm as THREE.Group;
    const lArm = (this as any).leftArm as THREE.Group;
    const body = (this as any).mainBody as THREE.Group;

    let damageDealt = 0;
    let isShockwave = false;
    let shockwavePos: THREE.Vector3 | undefined = undefined;

    switch (attackName) {
      case 'kings_judgment': {
        // Overhead downward smash
        rArm.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.9, 0.8, progress);
        lArm.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.9, 0.8, progress);
        if (progress >= 0.55 && !this.attackDamageDealtThisSwing) {
          this.attackDamageDealtThisSwing = true;
          if (dist <= 4.2) damageDealt = 48;
          isShockwave = true;
          shockwavePos = this.group.position.clone().addScaledVector(this.lockedAttackDirection, 2.5);
        }
        break;
      }

      case 'crownbreaker': {
        // Broad 180 horizontal sweep
        const sweepAngle = THREE.MathUtils.lerp(-1.3, 1.4, progress);
        rArm.rotation.set(-0.3, sweepAngle, 0);
        body.rotation.y = THREE.MathUtils.lerp(-0.6, 0.7, progress);
        if (progress >= 0.45 && !this.attackDamageDealtThisSwing) {
          this.attackDamageDealtThisSwing = true;
          if (dist <= 4.6) damageDealt = 42;
        }
        break;
      }

      case 'royal_execution':
      case 'shattered_crown':
      case 'last_judgment': {
        // Multi-hit sword sequence
        const subPhase = Math.floor(progress * 3);
        const subProg = (progress * 3) % 1;
        if (subPhase === 0) {
          rArm.rotation.y = THREE.MathUtils.lerp(-1.0, 1.0, subProg);
        } else if (subPhase === 1) {
          rArm.rotation.y = THREE.MathUtils.lerp(1.0, -1.0, subProg);
        } else {
          rArm.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.7, 0.6, subProg);
        }
        if (progress >= 0.4 && !this.attackDamageDealtThisSwing) {
          this.attackDamageDealtThisSwing = true;
          const baseDmg = attackName === 'last_judgment' ? 58 : 45;
          if (dist <= 4.4) damageDealt = baseDmg;
        }
        break;
      }

      case 'ground_rupture': {
        // Sword plunged into the earth
        rArm.rotation.x = THREE.MathUtils.lerp(-0.6, 1.1, progress);
        lArm.rotation.x = THREE.MathUtils.lerp(-0.6, 1.1, progress);
        if (progress >= 0.6 && !this.shockwaveSpawnedThisSwing) {
          this.shockwaveSpawnedThisSwing = true;
          isShockwave = true;
          shockwavePos = this.group.position.clone().addScaledVector(this.lockedAttackDirection, 3.2);
          if (dist <= 5.8) damageDealt = 52;
        }
        break;
      }

      case 'sovereigns_reach': {
        // Extended spectral lunge
        rArm.rotation.set(-0.2, 0, 0);
        this.group.position.addScaledVector(this.lockedAttackDirection, 3.8 * delta);
        if (progress >= 0.45 && !this.attackDamageDealtThisSwing) {
          this.attackDamageDealtThisSwing = true;
          if (dist <= 5.2) damageDealt = 46;
        }
        break;
      }

      case 'kings_ruin': {
        // Mark delayed rune explosions
        rArm.rotation.x = 0.9;
        if (progress >= 0.5 && !this.shockwaveSpawnedThisSwing) {
          this.shockwaveSpawnedThisSwing = true;
          // Spawn 3 delayed explosion positions
          this.spawnSpectralRuinExplosions();
          isShockwave = true;
          shockwavePos = this.group.position.clone();
        }
        break;
      }

      case 'final_decree': {
        // Criss-crossing double floor cleave
        rArm.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.95, 0.9, progress);
        lArm.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.95, 0.9, progress);
        if (progress >= 0.55 && !this.attackDamageDealtThisSwing) {
          this.attackDamageDealtThisSwing = true;
          if (dist <= 5.0) damageDealt = 65;
          isShockwave = true;
          shockwavePos = this.group.position.clone().addScaledVector(this.lockedAttackDirection, 3.0);
        }
        break;
      }

      case 'crownfall': {
        // Concentric radial arena shockwave
        rArm.rotation.x = 1.0;
        lArm.rotation.x = 1.0;
        if (progress >= 0.6 && !this.shockwaveSpawnedThisSwing) {
          this.shockwaveSpawnedThisSwing = true;
          isShockwave = true;
          shockwavePos = this.group.position.clone();
          if (dist <= 6.5) damageDealt = 55;
        }
        break;
      }

      case 'kings_end': {
        // The Hollow King's Ultimate Strike
        // Leaps forward into the air and crashes down with cataclysmic force
        const baseY = this.groundYResolver
          ? this.groundYResolver(this.group.position.x, this.group.position.z)
          : 0;
        if (progress < 0.5) {
          this.group.position.y = baseY + Math.sin(progress * Math.PI) * 2.2;
          this.group.position.addScaledVector(this.lockedAttackDirection, 4.0 * delta);
          rArm.rotation.x = -Math.PI * 0.9;
        } else {
          this.group.position.y = Math.max(baseY, this.group.position.y - delta * 9);
          rArm.rotation.x = 1.1;
          lArm.rotation.x = 1.1;
          if (!this.attackDamageDealtThisSwing) {
            this.attackDamageDealtThisSwing = true;
            isShockwave = true;
            shockwavePos = this.group.position.clone();
            if (dist <= 6.0) damageDealt = 85;
          }
        }
        break;
      }
    }

    return { damage: damageDealt, isShockwave, shockwavePos };
  }

  /**
   * Spawns 3 telegraphed spectral explosion runes around the arena
   */
  private spawnSpectralRuinExplosions() {
    const center = this.lockedAttackTargetPos || this.group.position;
    const offsets = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(3.2, 0, 2.5),
      new THREE.Vector3(-3.2, 0, -2.5),
    ];

    offsets.forEach(off => {
      this.pendingExplosions.push({
        position: center.clone().add(off),
        timer: 1.2,
        maxTimer: 1.2,
        radius: 2.8,
        damage: 40,
        detonated: false,
      });
    });
  }

  private resetArmPoses(delta: number) {
    const rArm = (this as any).rightArm as THREE.Group;
    const lArm = (this as any).leftArm as THREE.Group;
    const body = (this as any).mainBody as THREE.Group;

    rArm.rotation.x = THREE.MathUtils.damp(rArm.rotation.x, 0, 4.0, delta);
    rArm.rotation.y = THREE.MathUtils.damp(rArm.rotation.y, 0, 4.0, delta);
    rArm.rotation.z = THREE.MathUtils.damp(rArm.rotation.z, 0, 4.0, delta);

    lArm.rotation.x = THREE.MathUtils.damp(lArm.rotation.x, 0, 4.0, delta);
    lArm.rotation.y = THREE.MathUtils.damp(lArm.rotation.y, 0, 4.0, delta);
    lArm.rotation.z = THREE.MathUtils.damp(lArm.rotation.z, 0, 4.0, delta);

    body.rotation.y = THREE.MathUtils.damp(body.rotation.y, 0, 4.0, delta);
  }

  /**
   * Records player combat habits from game events
   */
  public registerPlayerDodge(direction: 'left' | 'right' | 'back' | 'forward') {
    this.playerHabits.recentDodgeDirections.push(direction);
    if (this.playerHabits.recentDodgeDirections.length > 6) {
      this.playerHabits.recentDodgeDirections.shift();
    }
    this.playerHabits.lastDodgeTime = Date.now();
  }

  public registerPlayerHealAttempt() {
    this.playerHabits.recentHealAttempts++;
  }

  public override triggerStagger(duration: number = 2.4): boolean {
    const success = super.triggerStagger(duration);
    if (success) {
      this.currentState = 'Stagger';
      this.stateTimer = duration;
    }
    return success;
  }

  private disposeHierarchy(root: THREE.Object3D) {
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => m?.dispose());
      }
    });
  }

  public dispose() {
    this.disposeHierarchy(this.group);
    this.ironArmorMat.dispose();
    this.crackedGlowMat.dispose();
    this.runeSealMat.dispose();
    this.spectralCrownMat.dispose();
  }
}
