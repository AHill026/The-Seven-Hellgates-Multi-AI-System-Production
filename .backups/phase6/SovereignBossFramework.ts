/**
 * Phase II - The Seven Sovereigns Master Boss Framework
 *
 * Modular, reusable 3-phase Sovereign Boss architecture supporting:
 * - Intelligent anti-spam & distance-aware combat AI (no consecutive repeated moves)
 * - Readable telegraphs, execution windows, poise breaks & phase transformations
 * - Arena hazard projection & dialogue cues
 * - Preserved canon identity for Greed (The Gilded Tyrant) alongside Gilded Warden
 * - Unique combat AI profiles with clearly tagged [PROVISIONAL] visual/lore markers
 *   for Realms 4–7 (Wrath, Heresy, Violence, Treachery)
 */

import * as THREE from 'three';
import { BossInstance, BossAttackResult } from './BossModels';
import { WeaponId } from '../types';
import { REALM_TO_WEAPON_ID } from '../arsenal/WeaponRegistry';

export type SovereignAIState = 'Idle' | 'Approach' | 'Telegraph' | 'Attack' | 'Recovery' | 'Staggered' | 'Dead';

export interface SovereignAttackDef {
  id: string;
  label: string;
  minRange: number;
  maxRange: number;
  minPhase: 1 | 2 | 3;
  telegraphTime: number;
  attackTime: number;
  recoveryTime: number;
  damage: number;
  hitRadius: number;
  isShockwave: boolean;
  lungeSpeed: number;
  spawnsHazard?: 'fissure' | 'tribute_ring' | 'heresy_sigil' | 'chain_pull' | 'mirror_burst';
  antiSpamPunish?: boolean;
}

export interface PendingSovereignHazard {
  position: THREE.Vector3;
  radius: number;
  damage: number;
  timer: number;
  colorHex: number;
  type: 'fissure' | 'tribute_ring' | 'heresy_sigil' | 'chain_pull' | 'mirror_burst';
}

export class SovereignBossController extends BossInstance {
  public aiState: SovereignAIState = 'Idle';
  public stateTimer: number = 0;
  public currentMove: SovereignAttackDef | null = null;
  public lastMoveId: string = '';
  public isProvisionalRig: boolean = false;
  public rewardWeaponId: WeaponId;
  public currentDialogueText: string | null = null;
  public dialogueTimer: number = 0;

  // Anti-spam & adaptive habit tracking
  private playerCloseTime: number = 0;
  private consecutiveHitsTaken: number = 0;
  private hitResetTimer: number = 0;
  private moveDealtDamage: boolean = false;
  private moveSpawnedHazard: boolean = false;
  protected moveset: SovereignAttackDef[] = [];
  protected moveSpeedByPhase: [number, number, number] = [2.8, 3.6, 4.4];
  protected auraHex: number = 0xef4444;

  // Arena hazard queue consumed by HellgatesGame
  public pendingArenaHazards: PendingSovereignHazard[] = [];
  public pendingPullForce: number = 0;

  constructor(realmId: number) {
    super(realmId);
    this.rewardWeaponId = REALM_TO_WEAPON_ID[realmId] || 'kings_remnant';
  }

  public setDialogue(text: string, duration: number = 4.0) {
    this.currentDialogueText = text;
    this.dialogueTimer = duration;
  }

  public override takeDamage(amount: number, isHeavy: boolean = false): boolean {
    const prevPhase = this.phase;
    const triggeredStagger = super.takeDamage(amount, isHeavy);
    this.consecutiveHitsTaken += 1;
    this.hitResetTimer = 1.8;

    if (this.phase > prevPhase && !this.isDead) {
      this.onPhaseTransitioned(this.phase);
    }
    return triggeredStagger;
  }

  protected onPhaseTransitioned(newPhase: number) {
    this.cooldownTimer = 0.6;
    if (newPhase === 2) {
      this.setDialogue(`${this.name} unleashes Phase II!`, 3.5);
    } else if (newPhase === 3) {
      this.setDialogue(`${this.name} awakens full Sovereign fury!`, 3.5);
    }
  }

  protected selectNextMove(distance: number): SovereignAttackDef | null {
    const valid = this.moveset.filter(
      (m) =>
        m.minPhase <= this.phase &&
        distance >= m.minRange &&
        distance <= m.maxRange &&
        m.id !== this.lastMoveId
    );
    const pool = valid.length > 0
      ? valid
      : this.moveset.filter((m) => m.minPhase <= this.phase && m.id !== this.lastMoveId);
    if (pool.length === 0) return this.moveset[0] || null;

    // Adaptive punish: if player spams close-range melee hits, prefer antiSpamPunish move
    if (this.consecutiveHitsTaken >= 3 || this.playerCloseTime > 2.2) {
      const punish = pool.find((m) => m.antiSpamPunish);
      if (punish) {
        this.consecutiveHitsTaken = 0;
        this.playerCloseTime = 0;
        return punish;
      }
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  public override update(delta: number, playerPos: THREE.Vector3): BossAttackResult {
    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0) this.currentDialogueText = null;
    }

    if (this.hitResetTimer > 0) {
      this.hitResetTimer -= delta;
      if (this.hitResetTimer <= 0) this.consecutiveHitsTaken = 0;
    }

    if (this.isDead) {
      this.aiState = 'Dead';
      this.group.position.y = Math.max(-2, this.group.position.y - delta * 0.9);
      this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, -Math.PI / 2, delta * 3);
      return { damage: 0, isShockwave: false };
    }

    if (this.isStaggered) {
      this.aiState = 'Staggered';
      return super.update(delta, playerPos);
    }

    const time = Date.now() * 0.002;
    this.mainBody.position.y = (this.realmId === 5 || this.realmId === 7 ? 2.05 : 1.9) + Math.sin(time) * 0.12;
    this.visualRig?.update(time, delta, this.phase);

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance < 3.5) {
      this.playerCloseTime += delta;
    } else {
      this.playerCloseTime = Math.max(0, this.playerCloseTime - delta * 0.5);
    }

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
    }

    // Rotate smoothly toward player unless mid-swing
    if (distance > 0.05 && this.aiState !== 'Attack') {
      const ang = Math.atan2(toPlayer.x, toPlayer.z);
      this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, ang, 5.2, delta);
    }

    let damageDealt = 0;
    let isShockwave = false;
    let shockwavePos: THREE.Vector3 | undefined;

    if (this.aiState === 'Idle' || this.aiState === 'Approach') {
      const moveSpeed = this.moveSpeedByPhase[this.phase - 1] || 3.2;
      if (distance > 4.2) {
        this.aiState = 'Approach';
        const dir = toPlayer.clone().normalize();
        this.group.position.addScaledVector(dir, moveSpeed * delta);
      }
      if (this.cooldownTimer <= 0) {
        const chosen = this.selectNextMove(distance);
        if (chosen) {
          this.currentMove = chosen;
          this.lastMoveId = chosen.id;
          this.aiState = 'Telegraph';
          this.stateTimer = 0;
          this.moveDealtDamage = false;
          this.moveSpawnedHazard = false;
          this.isAttacking = true;
          this.currentAttackName = chosen.label;
        }
      }
    } else if (this.aiState === 'Telegraph' && this.currentMove) {
      this.stateTimer += delta;
      const t = Math.min(1, this.stateTimer / this.currentMove.telegraphTime);
      // Clear visual windup cue
      this.rightArm.rotation.set(-Math.PI * 0.78 * t, -0.4 * t, 0);
      this.leftArm.rotation.set(-Math.PI * 0.55 * t, 0.4 * t, 0);
      this.mainBody.rotation.x = -0.22 * t;
      this.auraLight.intensity = 4.5 + t * 4.5;

      if (this.stateTimer >= this.currentMove.telegraphTime) {
        this.aiState = 'Attack';
        this.stateTimer = 0;
      }
    } else if (this.aiState === 'Attack' && this.currentMove) {
      this.stateTimer += delta;
      const t = Math.min(1, this.stateTimer / this.currentMove.attackTime);
      const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.group.rotation);

      // Lunge forward during strike
      if (this.currentMove.lungeSpeed > 0 && t < 0.7) {
        this.group.position.addScaledVector(forward, this.currentMove.lungeSpeed * delta);
      }

      this.rightArm.rotation.set(THREE.MathUtils.lerp(-Math.PI * 0.78, 0.9, t), THREE.MathUtils.lerp(-0.4, 0.85, t), 0);
      this.leftArm.rotation.set(THREE.MathUtils.lerp(-Math.PI * 0.55, 0.75, t), 0, 0);
      this.mainBody.rotation.x = THREE.MathUtils.lerp(-0.22, 0.34, t);

      if (t >= 0.4 && !this.moveDealtDamage) {
        this.moveDealtDamage = true;
        if (this.currentMove.isShockwave) {
          isShockwave = true;
          shockwavePos = this.group.position.clone();
        }
        if (distance <= this.currentMove.hitRadius) {
          damageDealt = Math.round(this.currentMove.damage * (1 + (this.phase - 1) * 0.15));
        }
      }

      if (t >= 0.5 && !this.moveSpawnedHazard && this.currentMove.spawnsHazard) {
        this.moveSpawnedHazard = true;
        this.spawnMoveHazard(this.currentMove.spawnsHazard, playerPos);
      }

      if (this.stateTimer >= this.currentMove.attackTime) {
        this.aiState = 'Recovery';
        this.stateTimer = 0;
      }
    } else if (this.aiState === 'Recovery' && this.currentMove) {
      this.stateTimer += delta;
      const t = Math.min(1, this.stateTimer / this.currentMove.recoveryTime);
      this.rightArm.rotation.set(THREE.MathUtils.lerp(0.9, 0, t), THREE.MathUtils.lerp(0.85, 0, t), 0);
      this.leftArm.rotation.set(THREE.MathUtils.lerp(0.75, 0, t), 0, 0);
      this.mainBody.rotation.x = THREE.MathUtils.lerp(0.34, 0, t);

      if (this.stateTimer >= this.currentMove.recoveryTime) {
        this.aiState = 'Idle';
        this.isAttacking = false;
        this.cooldownTimer = this.phase === 3 ? 0.65 : this.phase === 2 ? 1.0 : 1.45;
        this.auraLight.intensity = this.phase === 3 ? 8.0 : this.phase === 2 ? 5.0 : 2.5;
      }
    }

    // Clamp boss inside battle arena
    const bossDist = Math.hypot(this.group.position.x, this.group.position.z);
    if (bossDist > 25.0) {
      const f = 25.0 / bossDist;
      this.group.position.x *= f;
      this.group.position.z *= f;
    }

    return { damage: damageDealt, isShockwave, shockwavePos };
  }

  protected spawnMoveHazard(
    type: NonNullable<SovereignAttackDef['spawnsHazard']>,
    playerPos: THREE.Vector3
  ) {
    if (type === 'chain_pull') {
      this.pendingPullForce = 9.5;
    }
    this.pendingArenaHazards.push({
      position: playerPos.clone().setY(0),
      radius: type === 'tribute_ring' || type === 'fissure' ? 3.4 : 2.8,
      damage: 24 + this.phase * 6,
      timer: 0.95,
      colorHex: this.auraHex,
      type,
    });
  }
}

/**
 * REALM 3 — GREED: THE GILDED TYRANT
 * Vault-gold shockwaves, Imperial Decree slams, and molten avarice bursts.
 */
export class GreedSovereignBoss extends SovereignBossController {
  constructor(realmId: number = 3) {
    super(realmId);
    this.auraHex = 0xf59e0b;
    this.maxHealth = 1650;
    this.currentHealth = this.maxHealth;
    this.moveSpeedByPhase = [2.6, 3.3, 4.1];
    this.setDialogue('Every soul in this vault carries a price, Azrael.', 4.0);

    this.moveset = [
      {
        id: 'gilded_sweep',
        label: 'Imperial Decree Sweep',
        minRange: 0,
        maxRange: 5.5,
        minPhase: 1,
        telegraphTime: 0.55,
        attackTime: 0.42,
        recoveryTime: 0.75,
        damage: 38,
        hitRadius: 4.5,
        isShockwave: false,
        lungeSpeed: 3.5,
      },
      {
        id: 'tribute_slam',
        label: 'Vault Tribute Slam',
        minRange: 0,
        maxRange: 10.0,
        minPhase: 1,
        telegraphTime: 0.72,
        attackTime: 0.45,
        recoveryTime: 0.9,
        damage: 48,
        hitRadius: 5.6,
        isShockwave: true,
        lungeSpeed: 2.0,
        spawnsHazard: 'tribute_ring',
        antiSpamPunish: true,
      },
      {
        id: 'molten_sentence',
        label: 'Molten Avarice Crush',
        minRange: 3.5,
        maxRange: 18.0,
        minPhase: 2,
        telegraphTime: 0.65,
        attackTime: 0.5,
        recoveryTime: 0.85,
        damage: 52,
        hitRadius: 5.2,
        isShockwave: true,
        lungeSpeed: 9.0,
        spawnsHazard: 'tribute_ring',
      },
    ];
  }
}

/**
 * REALM 4 — WRATH: [PROVISIONAL] THE RED CALAMITY
 * Relentless volcanic aggression, rage counters, and magma fissures.
 */
export class WrathSovereignBoss extends SovereignBossController {
  constructor(realmId: number = 4) {
    super(realmId);
    this.isProvisionalRig = true;
    this.auraHex = 0xef4444;
    this.maxHealth = 1900;
    this.currentHealth = this.maxHealth;
    this.moveSpeedByPhase = [3.4, 4.2, 5.1];
    this.setDialogue('[PROVISIONAL] The ash burns hotter when you strike back.', 4.0);

    this.moveset = [
      {
        id: 'worldrender_cleave',
        label: 'Worldrender Cleave',
        minRange: 0,
        maxRange: 5.8,
        minPhase: 1,
        telegraphTime: 0.48,
        attackTime: 0.36,
        recoveryTime: 0.62,
        damage: 44,
        hitRadius: 4.8,
        isShockwave: false,
        lungeSpeed: 5.5,
      },
      {
        id: 'rage_eruption',
        label: 'Volcanic Counter Slam',
        minRange: 0,
        maxRange: 7.5,
        minPhase: 1,
        telegraphTime: 0.55,
        attackTime: 0.42,
        recoveryTime: 0.72,
        damage: 54,
        hitRadius: 6.0,
        isShockwave: true,
        lungeSpeed: 1.5,
        spawnsHazard: 'fissure',
        antiSpamPunish: true,
      },
      {
        id: 'cataclysm_charge',
        label: 'Calamity Leap',
        minRange: 5.0,
        maxRange: 22.0,
        minPhase: 2,
        telegraphTime: 0.58,
        attackTime: 0.52,
        recoveryTime: 0.75,
        damage: 58,
        hitRadius: 5.6,
        isShockwave: true,
        lungeSpeed: 12.5,
        spawnsHazard: 'fissure',
      },
    ];
  }
}

/**
 * REALM 5 — HERESY: [PROVISIONAL] THE SAINT OF ASH
 * Arcane sigil zoning, inverted halo pulses, and punishing dashes.
 */
export class HeresySovereignBoss extends SovereignBossController {
  constructor(realmId: number = 5) {
    super(realmId);
    this.isProvisionalRig = true;
    this.auraHex = 0x818cf8;
    this.maxHealth = 2050;
    this.currentHealth = this.maxHealth;
    this.moveSpeedByPhase = [3.1, 3.9, 4.7];
    this.setDialogue('[PROVISIONAL] Kneel before the inverted choir.', 4.0);

    this.moveset = [
      {
        id: 'scythe_absolution',
        label: 'Reliquary Scythe Arc',
        minRange: 0,
        maxRange: 6.2,
        minPhase: 1,
        telegraphTime: 0.52,
        attackTime: 0.38,
        recoveryTime: 0.68,
        damage: 42,
        hitRadius: 5.0,
        isShockwave: false,
        lungeSpeed: 4.0,
      },
      {
        id: 'blasphemer_sigil',
        label: 'Forbidden Sigil Burst',
        minRange: 2.5,
        maxRange: 20.0,
        minPhase: 1,
        telegraphTime: 0.64,
        attackTime: 0.42,
        recoveryTime: 0.76,
        damage: 46,
        hitRadius: 4.5,
        isShockwave: true,
        lungeSpeed: 0,
        spawnsHazard: 'heresy_sigil',
      },
      {
        id: 'halo_judgment',
        label: 'Inverted Halo Pulse',
        minRange: 0,
        maxRange: 7.0,
        minPhase: 2,
        telegraphTime: 0.55,
        attackTime: 0.40,
        recoveryTime: 0.70,
        damage: 55,
        hitRadius: 6.2,
        isShockwave: true,
        lungeSpeed: 6.0,
        antiSpamPunish: true,
        spawnsHazard: 'heresy_sigil',
      },
    ];
  }
}

/**
 * REALM 6 — VIOLENCE: [PROVISIONAL] THE BUTCHER OF RUIN
 * Chain-hook pulls, brutal executioner cleaver combos, and blood-frenzy slams.
 */
export class ViolenceSovereignBoss extends SovereignBossController {
  constructor(realmId: number = 6) {
    super(realmId);
    this.isProvisionalRig = true;
    this.auraHex = 0xb91c1c;
    this.maxHealth = 2300;
    this.currentHealth = this.maxHealth;
    this.moveSpeedByPhase = [3.2, 4.0, 4.9];
    this.setDialogue('[PROVISIONAL] No chains break faster than bone.', 4.0);

    this.moveset = [
      {
        id: 'ruin_cleaver',
        label: 'Butcher Cleaver Flurry',
        minRange: 0,
        maxRange: 5.8,
        minPhase: 1,
        telegraphTime: 0.50,
        attackTime: 0.38,
        recoveryTime: 0.65,
        damage: 48,
        hitRadius: 4.9,
        isShockwave: false,
        lungeSpeed: 4.8,
      },
      {
        id: 'execution_hook',
        label: 'Chained Hook Sentence',
        minRange: 4.5,
        maxRange: 20.0,
        minPhase: 1,
        telegraphTime: 0.62,
        attackTime: 0.44,
        recoveryTime: 0.78,
        damage: 44,
        hitRadius: 5.2,
        isShockwave: false,
        lungeSpeed: 7.5,
        spawnsHazard: 'chain_pull',
      },
      {
        id: 'blood_verdict',
        label: 'Final Punishment Slam',
        minRange: 0,
        maxRange: 7.0,
        minPhase: 2,
        telegraphTime: 0.60,
        attackTime: 0.45,
        recoveryTime: 0.80,
        damage: 62,
        hitRadius: 6.0,
        isShockwave: true,
        lungeSpeed: 3.0,
        antiSpamPunish: true,
      },
    ];
  }
}

/**
 * REALM 7 — TREACHERY: [PROVISIONAL] THE SOVEREIGN OF DESIRE
 * Mirrored feints, astrolabe void pulses, and threshold lunges.
 */
export class TreacherySovereignBoss extends SovereignBossController {
  constructor(realmId: number = 7) {
    super(realmId);
    this.isProvisionalRig = true;
    this.auraHex = 0xc084fc;
    this.maxHealth = 2600;
    this.currentHealth = this.maxHealth;
    this.moveSpeedByPhase = [3.8, 4.6, 5.5];
    this.setDialogue('[PROVISIONAL] Even your own reflection stands against you.', 4.0);

    this.moveset = [
      {
        id: 'mirrored_lunge',
        label: 'Mirrored Needle Lunge',
        minRange: 3.0,
        maxRange: 19.0,
        minPhase: 1,
        telegraphTime: 0.46,
        attackTime: 0.36,
        recoveryTime: 0.60,
        damage: 46,
        hitRadius: 4.8,
        isShockwave: false,
        lungeSpeed: 13.5,
      },
      {
        id: 'oathbreaker_feint',
        label: 'Severed Truth Counter',
        minRange: 0,
        maxRange: 6.0,
        minPhase: 1,
        telegraphTime: 0.44,
        attackTime: 0.34,
        recoveryTime: 0.62,
        damage: 52,
        hitRadius: 5.4,
        isShockwave: true,
        lungeSpeed: 3.0,
        antiSpamPunish: true,
        spawnsHazard: 'mirror_burst',
      },
      {
        id: 'astrolabe_tempest',
        label: 'Threshold Astrolabe Burst',
        minRange: 0,
        maxRange: 14.0,
        minPhase: 2,
        telegraphTime: 0.62,
        attackTime: 0.48,
        recoveryTime: 0.78,
        damage: 64,
        hitRadius: 6.4,
        isShockwave: true,
        lungeSpeed: 2.0,
        spawnsHazard: 'mirror_burst',
      },
    ];
  }
}

export function createSovereignBossForRealm(realmId: number): SovereignBossController {
  switch (realmId) {
    case 3: return new GreedSovereignBoss(3);
    case 4: return new WrathSovereignBoss(4);
    case 5: return new HeresySovereignBoss(5);
    case 6: return new ViolenceSovereignBoss(6);
    case 7: return new TreacherySovereignBoss(7);
    default: return new GreedSovereignBoss(realmId);
  }
}
