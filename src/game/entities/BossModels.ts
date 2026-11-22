/**
 * The Seven Hellgates - Seven Major Boss Entities & The White-Eyed God
 * Towering 3D models with multi-phase mechanics, telegraphed special attacks,
 * and the mysterious secret climax reveal.
 */

import * as THREE from 'three';
import {
  buildSovereignModel,
  SovereignVisualRig,
} from './SovereignModelBuilders';

export interface BossAttackResult {
  damage: number;
  isShockwave: boolean;
  shockwavePos?: THREE.Vector3;
}

export class BossInstance {
  public id: string;
  public name: string;
  public realmId: number;
  public group: THREE.Group;
  public maxHealth: number;
  public currentHealth: number;
  public phase: number = 1;
  public isDead: boolean = false;
  public isAttacking: boolean = false;
  public currentAttackName: string = '';
  public attackTimer: number = 0;
  public cooldownTimer: number = 2.0;

  // Boss Poise & Stagger System (Soulslike Vulnerability State)
  public isStaggered: boolean = false;
  public staggerTimer: number = 0;
  public staggerDuration: number = 2.4;
  public poise: number = 100;
  public maxPoise: number = 100;
  public staggerFlashTimer: number = 0;

  // Rig nodes
  public mainBody: THREE.Group;
  public head: THREE.Group;
  public weapon: THREE.Group | null = null;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public auraLight: THREE.PointLight;
  public visualRig: SovereignVisualRig | null = null;
  public phaseSubtitle: string = '';

  constructor(realmId: number) {
    this.realmId = realmId;
    this.group = new THREE.Group();
    this.mainBody = new THREE.Group();
    this.group.add(this.mainBody);

    this.head = new THREE.Group();
    this.mainBody.add(this.head);

    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.mainBody.add(this.leftArm);
    this.mainBody.add(this.rightArm);

    this.id = `boss_realm_${realmId}`;
    this.name = this.getBossName(realmId);
    this.phaseSubtitle = this.getPhaseSubtitle(1);
    this.maxHealth = 800 + realmId * 250;
    this.currentHealth = this.maxHealth;

    this.auraLight = new THREE.PointLight(this.getBossAuraColor(realmId), 2.5, 12);
    this.auraLight.position.set(0, 3, 0);
    this.group.add(this.auraLight);

    this.buildBossModel(realmId);
  }

  private getBossName(realmId: number): string {
    switch (realmId) {
      case 1: return 'The Hollow King';
      case 2: return 'The Maw of Endless Hunger';
      case 3: return 'The Gilded Tyrant';
      case 4: return 'The Red Calamity';
      case 5: return 'The Saint of Ash';
      case 6: return 'The Butcher of Ruin';
      case 7: return 'The Sovereign of Desire';
      default: return 'Demonic Sovereign';
    }
  }

  private getPhaseSubtitle(phase: number): string {
    switch (this.realmId) {
      case 1:
        return phase === 1 ? 'The Forgotten Monarch' : phase === 2 ? 'The King Beneath' : 'The Last Crown';
      case 2:
        return phase === 1 ? 'The Devouring Maw' : phase === 2 ? 'Gorging Frenzy' : 'Apex Gluttony';
      case 3:
        return phase === 1 ? 'The Gilded Tyrant' : phase === 2 ? 'Molten Avarice' : 'The Golden Sepulcher';
      case 4:
        return phase === 1 ? 'The Red Calamity' : phase === 2 ? 'Magma Awakening' : 'Hellfire Cataclysm';
      case 5:
        return phase === 1 ? 'The Saint of Ash' : phase === 2 ? 'Black Flame Ecstasy' : 'Inverted Seraph';
      case 6:
        return phase === 1 ? 'The Butcher of Ruin' : phase === 2 ? 'Carnage Unbound' : 'The Flayed Slaughterer';
      case 7:
        return phase === 1 ? 'The Sovereign of Desire' : phase === 2 ? 'Transcendent Void' : 'The Cosmic Threshold';
      default:
        return phase === 1 ? 'Sovereign' : phase === 2 ? 'Enraged' : 'Awakened';
    }
  }

  private getBossAuraColor(realmId: number): number {
    switch (realmId) {
      case 1: return 0x38bdf8; // Limbo ice-blue
      case 2: return 0x84cc16; // Gluttony bile-green
      case 3: return 0xf59e0b; // Greed gold
      case 4: return 0xef4444; // Wrath hellfire
      case 5: return 0x94a3b8; // Heresy ashen silver
      case 6: return 0xb91c1c; // Violence blood crimson
      case 7: return 0xffffff; // Sovereign celestial white
      default: return 0xef4444;
    }
  }

  private buildBossModel(realmId: number) {
    // Large intimidating scale (3.5m to 5m height in Three.js units)
    this.group.scale.set(1.5, 1.5, 1.5);

    this.visualRig = buildSovereignModel(realmId, {
      mainBody: this.mainBody,
      head: this.head,
      leftArm: this.leftArm,
      rightArm: this.rightArm,
      auraLight: this.auraLight,
    });
    this.weapon = this.visualRig.weapon;
  }

  public triggerStagger(duration: number = 2.4): boolean {
    if (this.isDead) return false;
    this.isStaggered = true;
    this.staggerTimer = duration;
    this.staggerDuration = duration;
    this.staggerFlashTimer = 0.55;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.auraLight.color.setHex(0xfbbf24);
    this.auraLight.intensity = 8.0;

    // Flash all emissive materials to brilliant golden posture break
    if (this.visualRig) {
      this.visualRig.emissiveMaterials.forEach(m => {
        m.emissive.setHex(0xfbbf24);
        m.emissiveIntensity = 3.5;
      });
    }
    return true;
  }

  public takeDamage(amount: number, isHeavy: boolean = false): boolean {
    if (this.isDead) return false;
    this.currentHealth = Math.max(0, this.currentHealth - amount);

    let triggeredStagger = false;
    // Poise system: Heavy attacks deal heavy poise damage; regular deals small poise damage
    if (!this.isStaggered) {
      const poiseDmg = isHeavy ? 45 : 12;
      this.poise = Math.max(0, this.poise - poiseDmg);

      // Trigger stagger if poise broken OR single heavy attack deals massive damage (>= 60)
      if (this.poise <= 0 || (isHeavy && amount >= 60)) {
        triggeredStagger = this.triggerStagger(2.4);
      }
    }

    // Phase 2 transition at 60% HP
    if (this.currentHealth <= this.maxHealth * 0.60 && this.phase === 1) {
      this.phase = 2;
      this.phaseSubtitle = this.getPhaseSubtitle(2);
      this.auraLight.intensity = 5.0; // Enrage glow!
      this.visualRig?.onPhaseChange(2);
    }

    // Phase 3 transition at 30% HP
    if (this.currentHealth <= this.maxHealth * 0.30 && this.phase === 2) {
      this.phase = 3;
      this.phaseSubtitle = this.getPhaseSubtitle(3);
      this.auraLight.intensity = 8.0; // Final form glow!
      this.visualRig?.onPhaseChange(3);
    }

    if (this.currentHealth <= 0) {
      this.isDead = true;
      this.isAttacking = false;
      this.isStaggered = false;
    }

    return triggeredStagger;
  }

  public update(delta: number, playerPos: THREE.Vector3): BossAttackResult {
    if (this.isDead) {
      this.group.position.y = Math.max(-2, this.group.position.y - delta * 0.9);
      this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, -Math.PI / 2, delta * 3);
      return { damage: 0, isShockwave: false };
    }

    // Boss Stagger Vulnerability Animation & State
    if (this.isStaggered) {
      this.staggerTimer -= delta;

      // Unique Stagger Animation: Boss posture broken, recoils backward, slumps down, head droops forward
      this.mainBody.position.y = THREE.MathUtils.lerp(this.mainBody.position.y, 1.15, delta * 5.0);
      this.mainBody.rotation.x = THREE.MathUtils.lerp(this.mainBody.rotation.x, -0.36, delta * 4.5);
      this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0.48, delta * 5.0);
      this.head.rotation.z = Math.sin(Date.now() * 0.008) * 0.08;

      // Limp drooping arms with weapon tip resting on the floor
      this.rightArm.rotation.set(0.65, 0.15, -0.15);
      this.leftArm.rotation.set(0.65, -0.15, 0.15);

      // Emissive gold flash decay back to realm aura
      if (this.staggerFlashTimer > 0) {
        this.staggerFlashTimer -= delta;
        if (this.staggerFlashTimer <= 0) {
          this.auraLight.color.setHex(this.getBossAuraColor(this.realmId));
          this.auraLight.intensity = this.phase === 3 ? 8.0 : (this.phase === 2 ? 5.0 : 2.5);
        }
      }

      // Exit stagger when timer expires
      if (this.staggerTimer <= 0) {
        this.isStaggered = false;
        this.poise = this.maxPoise;
        this.cooldownTimer = 1.0;
        this.mainBody.rotation.x = 0;
        this.head.rotation.x = 0;
        this.head.rotation.z = 0;
      }

      return { damage: 0, isShockwave: false };
    }

    // Boss breathing and floating idle motion
    const time = Date.now() * 0.002;
    this.mainBody.position.y = (this.realmId === 1 ? 1.8 : 1.9) + Math.sin(time) * 0.12;

    // Update Sovereign visual rig (horns, wings, floating crowns, gullet jaws, astrolabe rings)
    this.visualRig?.update(time, delta, this.phase);

    // Face player - LOCK rotation during active attack swing so player can roll/strafe past safely
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    const isSwinging = this.isAttacking && this.attackTimer >= 0.38;
    if (distance > 0.01 && !isSwinging) {
      const angle = Math.atan2(toPlayer.x, toPlayer.z);
      this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, angle, 4.5, delta);
    }

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
    }

    // Boss Attack State Machine
    if (this.isAttacking) {
      this.attackTimer += delta * (this.phase === 3 ? 1.9 : this.phase === 2 ? 1.6 : 1.3);
      const p = this.attackTimer;
      let damageDealt = 0;
      let shockwaveTriggered = false;

      if (this.currentAttackName === 'scythe_sweep') {
        // Broad sweeping weapon strike
        if (p < 0.4) {
          // Telegraphed windup
          this.rightArm.rotation.set(-0.5, -1.2 * (p / 0.4), 0);
          this.mainBody.rotation.y = -0.5 * (p / 0.4);
        } else if (p < 0.75) {
          // Swift cleaving strike
          const t = (p - 0.4) / 0.35;
          this.rightArm.rotation.set(-0.3, THREE.MathUtils.lerp(-1.2, 1.4, t), 0);
          this.mainBody.rotation.y = THREE.MathUtils.lerp(-0.5, 0.6, t);
          if (p >= 0.55 && p - delta * 1.5 < 0.55 && distance <= 4.2) {
            damageDealt = 45;
          }
        } else {
          // Recovery window
          this.rightArm.rotation.set(0, 0, 0);
          this.mainBody.rotation.y = 0;
        }
      } else {
        // Ground slam shockwave attack
        if (p < 0.5) {
          // Raise weapon high overhead
          const t = p / 0.5;
          this.rightArm.rotation.x = -Math.PI * 0.9 * t;
          this.leftArm.rotation.x = -Math.PI * 0.9 * t;
        } else if (p < 0.8) {
          // Slam to ground
          const t = (p - 0.5) / 0.3;
          this.rightArm.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.9, 0.8, t);
          this.leftArm.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.9, 0.8, t);
          if (p >= 0.65 && p - delta * 1.5 < 0.65) {
            shockwaveTriggered = true;
            if (distance <= 5.5) {
              damageDealt = 55;
            }
          }
        } else {
          // Recovery window
          this.rightArm.rotation.x = 0;
          this.leftArm.rotation.x = 0;
        }
      }

      if (p >= 1.0) {
        this.isAttacking = false;
        this.attackTimer = 0;
        this.cooldownTimer = this.phase === 3 ? 0.9 : this.phase === 2 ? 1.4 : 2.4;
      }

      return {
        damage: damageDealt,
        isShockwave: shockwaveTriggered,
        shockwavePos: shockwaveTriggered ? this.group.position.clone() : undefined,
      };
    }

    // Approach or trigger attack
    if (distance > 3.8) {
      toPlayer.normalize();
      this.group.position.addScaledVector(toPlayer, (this.phase === 3 ? 4.2 : this.phase === 2 ? 3.4 : 2.5) * delta);
    } else if (this.cooldownTimer <= 0) {
      this.isAttacking = true;
      this.attackTimer = 0;
      this.currentAttackName = Math.random() > 0.4 ? 'scythe_sweep' : 'ground_slam';
    }

    return { damage: 0, isShockwave: false };
  }
}

/**
 * THE WHITE-EYED GOD
 * The climactic entity: Pitch darkness, two enormous glowing white eyes staring
 * directly through reality, with no face, no body, no silhouette.
 */
export class WhiteEyedGodEncounter {
  public group: THREE.Group;
  public eyeLeft: THREE.Mesh;
  public eyeRight: THREE.Mesh;
  public eyeLight: THREE.PointLight;
  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    // Pure brilliant white emissive eyes
    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    // Two enormous oval glowing eyes
    const eyeGeom = new THREE.SphereGeometry(1.2, 32, 16);
    eyeGeom.scale(1.0, 0.55, 0.3); // Slit/oval divine gaze

    this.eyeLeft = new THREE.Mesh(eyeGeom, eyeMat);
    this.eyeLeft.position.set(2.8, 6.0, -18);
    this.group.add(this.eyeLeft);

    this.eyeRight = new THREE.Mesh(eyeGeom, eyeMat);
    this.eyeRight.position.set(-2.8, 6.0, -18);
    this.group.add(this.eyeRight);

    // Eye glow halo
    this.eyeLight = new THREE.PointLight(0xffffff, 4.0, 45);
    this.eyeLight.position.set(0, 6.0, -15);
    this.group.add(this.eyeLight);
  }

  public update(delta: number) {
    this.time += delta;
    // Slow ominous divine gaze pulsation
    const intensity = 3.5 + Math.sin(this.time * 1.8) * 0.8;
    this.eyeLight.intensity = intensity;

    const scaleMod = 1.0 + Math.sin(this.time * 1.2) * 0.05;
    this.eyeLeft.scale.set(scaleMod, scaleMod * 0.55, 0.3);
    this.eyeRight.scale.set(scaleMod, scaleMod * 0.55, 0.3);
  }
}

