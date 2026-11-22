/**
 * The Seven Hellgates - Greed: The Pit of Destruction
 * The Forgotten Souls — ForgottenSoulsManager
 *
 * Central coordinator for the Forgotten Souls system:
 * - Monitors health threshold crossings (Normal -> 70% -> 40% -> 15% -> 0%)
 * - Coordinates audio whispers, spectral VFX, and soul-lock destruction
 * - Enforces story canon & memory fragments
 * - Manages enraged state transition (Treasury's Wrath)
 * - Orchestrates the cinematic death sequence
 */

import * as THREE from 'three';
import {
  GildedWardenConfig,
  DEFAULT_WARDEN_CONFIG,
  SoulLockSpec,
} from './ForgottenSoulsConfiguration';
import { SoulWhisperAudioController } from './SoulWhisperAudioController';
import { SoulLockDamageSystem } from './SoulLockDamageSystem';
import { WardenSpectralEffects } from './WardenSpectralEffects';
import { WardenDeathSequence } from './WardenDeathSequence';

export class ForgottenSoulsManager {
  public config: GildedWardenConfig;
  public audioCtrl: SoulWhisperAudioController;
  public lockSystem: SoulLockDamageSystem;
  public spectralEffects: WardenSpectralEffects;
  public deathSequence: WardenDeathSequence | null = null;

  // Threshold crossing flags (triggered once per threshold)
  private hasCrossed70Percent: boolean = false;
  private hasCrossed40Percent: boolean = false;
  private hasCrossed15Percent: boolean = false;
  public isEnraged: boolean = false;

  constructor(config: GildedWardenConfig = DEFAULT_WARDEN_CONFIG) {
    this.config = config;
    this.audioCtrl = new SoulWhisperAudioController(this.config);
    this.lockSystem = new SoulLockDamageSystem(this.audioCtrl);
    this.spectralEffects = new WardenSpectralEffects();
  }

  public initDeathSequence(wardenGroup: THREE.Group, weaponMesh: THREE.Group | null) {
    this.deathSequence = new WardenDeathSequence(
      wardenGroup,
      weaponMesh,
      this.audioCtrl,
      this.spectralEffects
    );
  }

  /**
   * Evaluates health threshold crossings and triggers appropriate narrative & visual cues
   */
  public onHealthChanged(
    currentHealth: number,
    maxHealth: number,
    wardenPos: THREE.Vector3,
    playerPos: THREE.Vector3
  ) {
    const ratio = currentHealth / maxHealth;

    // Check Enraged state (Treasury's Wrath)
    if (ratio <= this.config.thresholdEnrageHP && !this.isEnraged) {
      this.isEnraged = true;
      this.audioCtrl.playRandomWhisper('critical', wardenPos, playerPos);
      this.spectralEffects.spawnSoulWisp(wardenPos.clone().add(new THREE.Vector3(0, 1.8, 0)), 3);
    }

    // Threshold 1: 70% HP (Unstable spectral energy, golden cracks appear)
    if (ratio <= this.config.thresholdInstabilityHP && !this.hasCrossed70Percent) {
      this.hasCrossed70Percent = true;
      this.audioCtrl.playRandomWhisper('distressed', wardenPos, playerPos);
      this.spectralEffects.spawnLockBreakBurst(wardenPos.clone().add(new THREE.Vector3(0, 1.5, 0.2)));
    }

    // Threshold 2: 40% HP (Soul-locks visibly pulse, spectral energy escapes)
    if (ratio <= this.config.thresholdSpectralEscapeHP && !this.hasCrossed40Percent) {
      this.hasCrossed40Percent = true;
      this.audioCtrl.playRandomWhisper('distressed', wardenPos, playerPos);
      this.spectralEffects.spawnLockBreakBurst(wardenPos.clone().add(new THREE.Vector3(0, 1.5, 0.2)));
    }

    // Threshold 3: 15% HP (Armor failing, desperate voices)
    if (ratio <= this.config.thresholdArmorFailingHP && !this.hasCrossed15Percent) {
      this.hasCrossed15Percent = true;
      this.audioCtrl.playRandomWhisper('critical', wardenPos, playerPos);
      this.spectralEffects.spawnLockBreakBurst(wardenPos.clone().add(new THREE.Vector3(0, 1.5, 0.2)));
    }

    this.spectralEffects.setHealthState(ratio, this.isEnraged);
  }

  /**
   * Starts the cinematic death sequence when health hits 0
   */
  public triggerDeathSequence() {
    if (this.deathSequence && this.deathSequence.phase === 'idle') {
      this.deathSequence.start();
    }
  }

  /**
   * Main per-frame update loop
   */
  public update(
    delta: number,
    currentHealth: number,
    maxHealth: number,
    wardenPos: THREE.Vector3,
    playerPos: THREE.Vector3
  ) {
    const healthRatio = currentHealth / maxHealth;

    // 1. Update whisper audio controller
    if (!this.deathSequence || this.deathSequence.phase === 'idle') {
      this.audioCtrl.update(delta, healthRatio, wardenPos, playerPos);
    }

    // 2. Update spectral VFX
    this.spectralEffects.update(delta, wardenPos);

    // 3. Update death sequence if active
    if (this.deathSequence) {
      this.deathSequence.update(delta, playerPos);
    }
  }

  public getCurrentWhisper(): string | null {
    return this.audioCtrl.getCurrentWhisperText();
  }

  public dispose() {
    this.audioCtrl.dispose();
    this.spectralEffects.dispose();
    this.deathSequence?.dispose();
  }
}
