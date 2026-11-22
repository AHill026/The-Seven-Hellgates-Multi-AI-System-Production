/**
 * Project Sevenfold - Hybrid Arsenal Runtime Controllers
 * - WeaponManifestationController (Object-pooled spectral manifestations)
 * - WeaponComboManager (Cross-weapon synergy combos)
 * - SevenfoldConvergenceController (7-weapon circular Seal Array ultimate)
 * - WeaponResonanceController (Subtle Seal Resonance story & rune cues)
 */

import * as THREE from 'three';
import { PlayerData, WeaponId } from '../types';
import {
  WEAPON_BY_ID,
  SEVENFOLD_WEAPONS,
  getWeaponEffectiveStats,
  findCrossWeaponSynergy,
  getSealResonanceInfo,
  CrossWeaponSynergy,
} from './WeaponRegistry';
import { buildSevenfoldWeapon, BuiltWeaponRig } from './SevenfoldWeaponFactory';
import { EnemyInstance } from '../entities/EnemyModels';
import { BossInstance } from '../entities/BossModels';
import { ParticleSystem } from '../vfx/ParticleSystem';
import { CombatSystem } from '../combat/CombatSystem';
import { soundEngine } from '../audio/SoundEngine';

interface ActiveManifestation {
  weaponId: WeaponId;
  group: THREE.Group;
  rig: BuiltWeaponRig;
  elapsed: number;
  duration: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  forward: THREE.Vector3;
  hasStruck: boolean;
}

export interface ManifestationStrikeResult {
  triggered: boolean;
  weaponId: WeaponId | null;
  damageDealt: number;
  healed: number;
  synergyTriggered: CrossWeaponSynergy | null;
  bossStaggered: boolean;
  bossDefeated: boolean;
  embersGained: number;
}

/**
 * 1. WEAPON MANIFESTATION CONTROLLER (Pooled spectral weapon projections)
 */
export class WeaponManifestationController {
  private pool: Map<WeaponId, BuiltWeaponRig> = new Map();
  private active: ActiveManifestation[] = [];
  private scene: THREE.Scene;
  private cooldowns: Map<WeaponId, number> = new Map();
  private lastOffhandIndex: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Pre-warm reusable spectral weapon pool to prevent runtime GC spikes
    SEVENFOLD_WEAPONS.forEach((w) => {
      const rig = buildSevenfoldWeapon(w.id, true);
      rig.mainGroup.visible = false;
      this.scene.add(rig.mainGroup);
      this.pool.set(w.id, rig);
    });
  }

  /**
   * Selects an off-hand unlocked weapon to manifest (or cycles cleanly through collected off-hand seals)
   */
  public pickManifestWeapon(playerData: PlayerData, preferredId?: WeaponId): WeaponId | null {
    const unlocked = playerData.arsenal.unlockedWeapons;
    const equipped = playerData.arsenal.equippedWeaponId;
    if (preferredId && unlocked.includes(preferredId)) {
      return preferredId;
    }

    const offhandCandidates = unlocked.filter((id) => id !== equipped);
    if (offhandCandidates.length === 0) {
      // If only 1 weapon collected so far, allow manifesting a spectral echo of the primary weapon
      return equipped || null;
    }

    // Prefer an off-hand weapon not currently on cooldown
    for (let i = 0; i < offhandCandidates.length; i++) {
      const idx = (this.lastOffhandIndex + i) % offhandCandidates.length;
      const cand = offhandCandidates[idx];
      if ((this.cooldowns.get(cand) || 0) <= 0) {
        this.lastOffhandIndex = (idx + 1) % offhandCandidates.length;
        return cand;
      }
    }

    return offhandCandidates[this.lastOffhandIndex % offhandCandidates.length];
  }

  public getCooldownRemaining(weaponId: WeaponId): number {
    return this.cooldowns.get(weaponId) || 0;
  }

  public getAnyReadyCooldown(playerData: PlayerData): number {
    const cand = this.pickManifestWeapon(playerData);
    if (!cand) return 0;
    return this.cooldowns.get(cand) || 0;
  }

  public triggerManifestation(
    playerData: PlayerData,
    playerPos: THREE.Vector3,
    playerForward: THREE.Vector3,
    enemies: EnemyInstance[],
    boss: BossInstance | null,
    combat: CombatSystem,
    comboMgr: WeaponComboManager,
    particles: ParticleSystem,
    preferredWeaponId?: WeaponId
  ): ManifestationStrikeResult {
    const weaponId = this.pickManifestWeapon(playerData, preferredWeaponId);
    if (!weaponId || (this.cooldowns.get(weaponId) || 0) > 0) {
      return {
        triggered: false,
        weaponId: null,
        damageDealt: 0,
        healed: 0,
        synergyTriggered: null,
        bossStaggered: false,
        bossDefeated: false,
        embersGained: 0,
      };
    }

    const def = WEAPON_BY_ID[weaponId];
    const eff = getWeaponEffectiveStats(weaponId, playerData.arsenal.weaponUpgrades[weaponId]);
    this.cooldowns.set(weaponId, eff.manifestCooldown);

    // Determine target position in front of Azrael (or nearest enemy/boss)
    const strikeCenter = playerPos.clone().addScaledVector(playerForward, 2.3);
    strikeCenter.y = 0;

    // Spawn spectral rig from pool
    const rig = this.pool.get(weaponId);
    if (rig) {
      rig.mainGroup.visible = true;
      const spawnOrigin = playerPos.clone().add(new THREE.Vector3(0, 2.2, 0)).addScaledVector(playerForward, 0.7);
      rig.mainGroup.position.copy(spawnOrigin);
      rig.mainGroup.rotation.set(Math.PI * 0.42, Math.atan2(playerForward.x, playerForward.z), 0);
      rig.mainGroup.scale.setScalar(1.35);

      this.active.push({
        weaponId,
        group: rig.mainGroup,
        rig,
        elapsed: 0,
        duration: 0.55,
        startPos: spawnOrigin,
        targetPos: strikeCenter.clone().add(new THREE.Vector3(0, 0.6, 0)),
        forward: playerForward.clone().normalize(),
        hasStruck: false,
      });
    }

    // Check cross-weapon synergy with recent physical hit
    const synergy = comboMgr.evaluateManifestation(weaponId, playerData.arsenal.equippedWeaponId);

    // VFX & Sound
    const colorHex = synergy ? synergy.colorHex : def.primaryColorHex;
    particles.spawnSlashArc(playerPos, new THREE.Euler(0, Math.atan2(playerForward.x, playerForward.z), 0), colorHex, true);
    particles.spawnGroundShockwave(strikeCenter, eff.range + 1.2, colorHex);
    particles.spawnSparks(strikeCenter, 26, colorHex);
    soundEngine.playWeaponManifest(def.slotIndex);
    if (synergy) {
      soundEngine.playComboSynergyChime();
    }

    // Apply damage + signature weapon manifestation effects
    let totalDamage = 0;
    let totalHeal = weaponId === 'last_course' ? 28 : 0;
    if (synergy) totalHeal += synergy.healAmount;

    const arcaneScale = 1 + (playerData.stats.arcane - 10) * 0.035;
    const baseManifestDmg = Math.round(
      (eff.manifestDamage + (synergy ? synergy.bonusDamage : 0)) * arcaneScale
    );
    const strikeRadius = eff.range + 1.5;

    let embersGained = 0;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = enemy.group.position.distanceTo(strikeCenter);
      if (dist <= strikeRadius) {
        enemy.takeDamage(baseManifestDmg);
        totalDamage += baseManifestDmg;
        particles.spawnSparks(enemy.group.position, 14, colorHex);

        // Signature Torturer's Grace / Last Course hook pull inward
        if (weaponId === 'torturers_grace' || weaponId === 'last_course') {
          const pull = new THREE.Vector3().subVectors(playerPos, enemy.group.position);
          pull.y = 0;
          if (pull.length() > 1.8) {
            pull.normalize();
            enemy.group.position.addScaledVector(pull, Math.min(2.2, dist - 1.6));
          }
        }
        if (enemy.isDead) {
          embersGained += enemy.stats.emberReward;
          combat.awardEnemyDefeatHealth(enemy);
        }
      }
    }

    let bossStaggered = false;
    let bossDefeated = false;
    if (boss && !boss.isDead) {
      const distBoss = boss.group.position.distanceTo(strikeCenter);
      if (distBoss <= strikeRadius + 1.6) {
        const isHeavyStagger = eff.staggerPower >= 1.2 || Boolean(synergy);
        const triggered = boss.takeDamage(baseManifestDmg, isHeavyStagger);
        totalDamage += baseManifestDmg;
        if (synergy && synergy.bonusStagger > 0 && !boss.isStaggered) {
          boss.poise = Math.max(0, boss.poise - synergy.bonusStagger);
          if (boss.poise <= 0) {
            boss.triggerStagger(2.4);
            bossStaggered = true;
          }
        }
        if (triggered) bossStaggered = true;
        if (bossStaggered) {
          particles.spawnStaggerBurst(boss.group.position, 0xfbbf24);
        } else {
          particles.spawnSparks(boss.group.position, 22, colorHex);
        }
        if (boss.isDead) {
          bossDefeated = true;
          embersGained += 500 + boss.realmId * 250;
          combat.awardBossDefeatHealth(boss.name);
        }
      }
    }

    if (totalHeal > 0 && totalDamage > 0) {
      combat.restoreHealth(totalHeal);
    }

    combat.registerHitLanded();
    combat.wrath = Math.min(combat.maxWrath, combat.wrath + 16);

    return {
      triggered: true,
      weaponId,
      damageDealt: totalDamage,
      healed: totalDamage > 0 ? totalHeal : 0,
      synergyTriggered: synergy,
      bossStaggered,
      bossDefeated,
      embersGained,
    };
  }

  public update(delta: number) {
    for (const [id, cd] of this.cooldowns.entries()) {
      if (cd > 0) {
        this.cooldowns.set(id, Math.max(0, cd - delta));
      }
    }

    for (let i = this.active.length - 1; i >= 0; i--) {
      const m = this.active[i];
      m.elapsed += delta;
      const t = Math.min(1, m.elapsed / m.duration);

      if (t < 0.45) {
        const slamT = t / 0.45;
        m.group.position.lerpVectors(m.startPos, m.targetPos, slamT);
        m.group.rotation.x = THREE.MathUtils.lerp(0.4, Math.PI * 0.85, slamT);
      } else {
        const fadeT = (t - 0.45) / 0.55;
        m.rig.emissiveMaterials.forEach((mat) => {
          mat.opacity = Math.max(0, 0.85 * (1 - fadeT));
        });
      }

      if (t >= 1) {
        m.group.visible = false;
        m.rig.emissiveMaterials.forEach((mat) => {
          mat.opacity = 0.82;
        });
        this.active.splice(i, 1);
      }
    }
  }

  public dispose() {
    this.pool.forEach((rig) => {
      this.scene.remove(rig.mainGroup);
    });
    this.pool.clear();
  }
}

/**
 * 2. WEAPON COMBO MANAGER (Cross-Weapon Synergy Tracker)
 */
export class WeaponComboManager {
  private lastPhysicalWeapon: WeaponId | null = null;
  private physicalWindowTimer: number = 0;
  public activeSynergyBanner: { name: string; description: string; color: string; timer: number } | null = null;

  public registerPhysicalAttack(weaponId: WeaponId) {
    this.lastPhysicalWeapon = weaponId;
    this.physicalWindowTimer = 2.6;
  }

  public evaluateManifestation(manifestWeapon: WeaponId, equippedWeapon: WeaponId): CrossWeaponSynergy | null {
    const physicalRef = this.physicalWindowTimer > 0 && this.lastPhysicalWeapon
      ? this.lastPhysicalWeapon
      : equippedWeapon;
    const synergy = findCrossWeaponSynergy(physicalRef, manifestWeapon);
    if (synergy) {
      this.activeSynergyBanner = {
        name: synergy.name,
        description: synergy.description,
        color: `#${synergy.colorHex.toString(16).padStart(6, '0')}`,
        timer: 2.6,
      };
      this.physicalWindowTimer = 0;
    }
    return synergy;
  }

  public update(delta: number) {
    if (this.physicalWindowTimer > 0) {
      this.physicalWindowTimer = Math.max(0, this.physicalWindowTimer - delta);
    }
    if (this.activeSynergyBanner) {
      this.activeSynergyBanner.timer -= delta;
      if (this.activeSynergyBanner.timer <= 0) {
        this.activeSynergyBanner = null;
      }
    }
  }
}

/**
 * 3. SEVENFOLD CONVERGENCE CONTROLLER (7-Weapon Circular Seal Ultimate)
 */
export class SevenfoldConvergenceController {
  private scene: THREE.Scene;
  private sealGroup: THREE.Group;
  private weaponNodes: { id: WeaponId; rig: BuiltWeaponRig; angle: number }[] = [];
  public isActive: boolean = false;
  private timer: number = 0;
  private duration: number = 1.65;
  private cooldownTimer: number = 0;
  private struckWaves: Set<number> = new Set();
  private originPos: THREE.Vector3 = new THREE.Vector3();
  private forwardDir: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sealGroup = new THREE.Group();
    this.sealGroup.visible = false;

    // Circular ground & halo sigil ring
    const ringGeom = new THREE.RingGeometry(2.15, 2.38, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sealRing = new THREE.Mesh(ringGeom, ringMat);
    sealRing.rotation.x = -Math.PI / 2;
    sealRing.position.y = 0.14;
    this.sealGroup.add(sealRing);

    // Pre-build all 7 spectral weapon nodes orbiting in a 7-fold seal circle
    SEVENFOLD_WEAPONS.forEach((def, idx) => {
      const angle = (idx / 7) * Math.PI * 2;
      const rig = buildSevenfoldWeapon(def.id, true);
      rig.mainGroup.scale.setScalar(1.25);
      rig.mainGroup.position.set(Math.cos(angle) * 2.25, 1.85, Math.sin(angle) * 2.25);
      rig.mainGroup.rotation.set(Math.PI * 0.25, -angle, 0);
      this.sealGroup.add(rig.mainGroup);
      this.weaponNodes.push({ id: def.id, rig, angle });
    });

    this.scene.add(this.sealGroup);
  }

  public canTrigger(playerData: PlayerData): boolean {
    return (
      playerData.arsenal.unlockedWeapons.length >= 7 &&
      !this.isActive &&
      this.cooldownTimer <= 0
    );
  }

  public getCooldown(): number {
    return this.cooldownTimer;
  }

  public trigger(
    playerData: PlayerData,
    playerPos: THREE.Vector3,
    playerForward: THREE.Vector3,
    particles: ParticleSystem
  ): boolean {
    if (!this.canTrigger(playerData)) return false;

    this.isActive = true;
    this.timer = 0;
    this.cooldownTimer = 22.0;
    this.struckWaves.clear();
    this.originPos.copy(playerPos);
    this.forwardDir.copy(playerForward).normalize();

    this.sealGroup.visible = true;
    this.sealGroup.position.copy(playerPos);

    // Reset orbiting positions
    this.weaponNodes.forEach((node) => {
      node.rig.mainGroup.position.set(
        Math.cos(node.angle) * 2.25,
        1.85,
        Math.sin(node.angle) * 2.25
      );
      node.rig.mainGroup.rotation.set(Math.PI * 0.25, -node.angle, 0);
    });

    soundEngine.playSevenfoldConvergence();
    particles.spawnGroundShockwave(playerPos, 7.5, 0x93c5fd);
    particles.spawnSparks(playerPos.clone().add(new THREE.Vector3(0, 1.4, 0)), 45, 0xe0f2fe);
    return true;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    enemies: EnemyInstance[],
    boss: BossInstance | null,
    combat: CombatSystem,
    particles: ParticleSystem,
    playerData: PlayerData
  ): { embersGained: number; bossDefeated: boolean; waveHit: boolean } {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - delta);
    }

    if (!this.isActive) {
      return { embersGained: 0, bossDefeated: false, waveHit: false };
    }

    this.timer += delta;
    const progress = Math.min(1, this.timer / this.duration);
    this.sealGroup.position.copy(playerPos);

    let embersGained = 0;
    let bossDefeated = false;
    let waveHit = false;

    if (progress < 0.35) {
      // Phase 1: Circular Seal Rotation & Harmonic Charge
      this.sealGroup.rotation.y += delta * 4.5;
      const radius = THREE.MathUtils.lerp(2.25, 2.8, progress / 0.35);
      this.weaponNodes.forEach((node) => {
        node.rig.mainGroup.position.set(
          Math.cos(node.angle) * radius,
          1.95 + Math.sin(progress * 10 + node.angle) * 0.2,
          Math.sin(node.angle) * radius
        );
      });
    } else if (progress < 0.85) {
      // Phase 2: Sequential & Crescendo Convergence Strikes
      this.sealGroup.rotation.y += delta * 7.5;
      const strikeT = (progress - 0.35) / 0.50;
      const waveIdx = Math.min(2, Math.floor(strikeT * 3));

      const strikePoint = playerPos.clone().addScaledVector(this.forwardDir, 3.2);
      this.weaponNodes.forEach((node, idx) => {
        const localT = Math.max(0, Math.min(1, strikeT * 1.6 - idx * 0.08));
        const r = THREE.MathUtils.lerp(2.8, 0.6, Math.sin(localT * Math.PI));
        node.rig.mainGroup.position.set(
          Math.cos(node.angle) * r,
          THREE.MathUtils.lerp(2.1, 0.9, localT),
          Math.sin(node.angle) * r
        );
        node.rig.mainGroup.rotation.x = THREE.MathUtils.lerp(0.3, Math.PI * 0.95, localT);
      });

      if (!this.struckWaves.has(waveIdx)) {
        this.struckWaves.add(waveIdx);
        waveHit = true;

        const waveColors = [0x38bdf8, 0xf59e0b, 0xe0f2fe];
        const col = waveColors[waveIdx] || 0x93c5fd;
        particles.spawnGroundShockwave(strikePoint, 8.5, col);
        particles.spawnSparks(strikePoint, 36, col);

        const arcaneFactor = 1 + (playerData.stats.arcane - 10) * 0.03;
        const enemyWaveDamage = Math.round((waveIdx === 2 ? 135 : 85) * arcaneFactor);

        for (const enemy of enemies) {
          if (enemy.isDead) continue;
          if (enemy.group.position.distanceTo(playerPos) <= 8.5) {
            enemy.takeDamage(enemyWaveDamage);
            particles.spawnSparks(enemy.group.position, 14, col);
            if (enemy.isDead) {
              embersGained += enemy.stats.emberReward;
              combat.awardEnemyDefeatHealth(enemy);
            }
          }
        }

        // Balanced Boss Damage Scaling (caps total Convergence burst to ~22% Boss Max HP total across 3 waves)
        if (boss && !boss.isDead && boss.group.position.distanceTo(playerPos) <= 9.8) {
          const cappedBossWave = Math.min(
            Math.round(boss.maxHealth * (waveIdx === 2 ? 0.095 : 0.06)),
            enemyWaveDamage
          );
          const staggered = boss.takeDamage(cappedBossWave, waveIdx === 2);
          if (staggered) {
            particles.spawnStaggerBurst(boss.group.position, 0xfbbf24);
          } else {
            particles.spawnSparks(boss.group.position, 24, col);
          }
          if (boss.isDead) {
            bossDefeated = true;
            embersGained += 500 + boss.realmId * 250;
            combat.awardBossDefeatHealth(boss.name);
          }
        }
        combat.registerHitLanded();
      }
    } else {
      // Phase 3: Recall cleanly back into Azrael's aura
      const recallT = (progress - 0.85) / 0.15;
      this.weaponNodes.forEach((node) => {
        node.rig.mainGroup.position.lerp(new THREE.Vector3(0, 1.3, 0), recallT * 0.35);
      });
    }

    if (progress >= 1) {
      this.isActive = false;
      this.sealGroup.visible = false;
      this.sealGroup.rotation.y = 0;
    }

    return { embersGained, bossDefeated, waveHit };
  }

  public dispose() {
    this.scene.remove(this.sealGroup);
  }
}

/**
 * 4. WEAPON RESONANCE CONTROLLER (Subtle Seal Narrative & Chest Rune Harmonics)
 */
export class WeaponResonanceController {
  private lastResonanceTier: number = -1;
  public activeWhisper: string | null = null;
  private whisperTimer: number = 0;

  public evaluateProgression(unlockedCount: number): {
    tier: number;
    chestIntensity: number;
    title: string;
    newWhisper: string | null;
  } {
    const info = getSealResonanceInfo(unlockedCount);
    let newWhisper: string | null = null;
    if (this.lastResonanceTier !== -1 && info.tier > this.lastResonanceTier) {
      this.activeWhisper = info.whisper;
      this.whisperTimer = 6.5;
      newWhisper = info.whisper;
    }
    this.lastResonanceTier = info.tier;
    return {
      tier: info.tier,
      chestIntensity: info.chestRuneIntensity,
      title: info.title,
      newWhisper,
    };
  }

  public triggerEquipResonanceHint(unlockedCount: number) {
    if (unlockedCount >= 3 && Math.random() < 0.35) {
      const info = getSealResonanceInfo(unlockedCount);
      this.activeWhisper = info.whisper;
      this.whisperTimer = 4.5;
    }
  }

  public update(delta: number) {
    if (this.whisperTimer > 0) {
      this.whisperTimer -= delta;
      if (this.whisperTimer <= 0) {
        this.activeWhisper = null;
      }
    }
  }
}
