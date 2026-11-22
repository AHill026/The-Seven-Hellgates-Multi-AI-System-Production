/**
 * The Seven Hellgates - Interactive Moment Controller (P1/P2 Framing & Time Dilation)
 * Drives additive camera offsets and bounded simulation time dilation for Wrath Awakening,
 * Sevenfold Convergence, and Boss Stagger execution windows without QTE lockouts.
 */

import * as THREE from 'three';

export type InteractiveMomentKind =
  | 'wrath_awakening'
  | 'sevenfold_convergence'
  | 'boss_stagger';

export interface InteractiveMomentOutput {
  isActive: boolean;
  kind: InteractiveMomentKind | null;
  timeScale: number;
  distanceBias: number;
  heightBias: number;
  sideBias: number;
  fovBias: number;
  rollBias: number;
  vignetteDelta: number;
  contrastDelta: number;
}

export class InteractiveMomentController {
  private activeKind: InteractiveMomentKind | null = null;
  private elapsed: number = 0;
  private duration: number = 0;
  private staggerCooldown: number = 0;
  private reducedMotion: boolean = false;

  private readonly output: InteractiveMomentOutput = {
    isActive: false,
    kind: null,
    timeScale: 1.0,
    distanceBias: 0,
    heightBias: 0,
    sideBias: 0,
    fovBias: 0,
    rollBias: 0,
    vignetteDelta: 0,
    contrastDelta: 0,
  };

  private refreshReducedMotion(): void {
    this.reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  public triggerWrathAwakening(): void {
    this.refreshReducedMotion();
    // P1 Surge: can overwrite another P1 or start fresh
    if (this.activeKind === 'boss_stagger') return;
    this.activeKind = 'wrath_awakening';
    this.elapsed = 0;
    this.duration = 0.95;
  }

  public triggerConvergence(): void {
    this.refreshReducedMotion();
    this.activeKind = 'sevenfold_convergence';
    this.elapsed = 0;
    this.duration = 1.65;
  }

  public triggerBossStaggerMoment(): boolean {
    if (this.staggerCooldown > 0) return false;
    this.refreshReducedMotion();
    this.activeKind = 'boss_stagger';
    this.elapsed = 0;
    this.duration = 0.78;
    this.staggerCooldown = 2.5; // Anti-spam cooldown guard
    return true;
  }

  public abort(): void {
    this.activeKind = null;
    this.elapsed = 0;
    this.duration = 0;
    this.resetOutput();
  }

  private resetOutput(): void {
    this.output.isActive = false;
    this.output.kind = null;
    this.output.timeScale = 1.0;
    this.output.distanceBias = 0;
    this.output.heightBias = 0;
    this.output.sideBias = 0;
    this.output.fovBias = 0;
    this.output.rollBias = 0;
    this.output.vignetteDelta = 0;
    this.output.contrastDelta = 0;
  }

  public update(rawDelta: number, suppressForHigherCinematic: boolean): InteractiveMomentOutput {
    if (this.staggerCooldown > 0) {
      this.staggerCooldown = Math.max(0, this.staggerCooldown - rawDelta);
    }

    if (suppressForHigherCinematic || !this.activeKind) {
      if (suppressForHigherCinematic && this.activeKind) {
        this.abort();
      } else {
        this.resetOutput();
      }
      return this.output;
    }

    this.elapsed += rawDelta;
    if (this.elapsed >= this.duration) {
      this.abort();
      return this.output;
    }

    const t = Math.max(0, Math.min(1, this.elapsed / this.duration));
    const motionMult = this.reducedMotion ? 0.25 : 1.0;
    this.output.isActive = true;
    this.output.kind = this.activeKind;

    if (this.activeKind === 'wrath_awakening') {
      // Phase 1 (0..0.28): snap push-in + brief 0.36x dilation peak; then wide spring release
      const burstEnv = Math.sin(Math.min(1, t / 0.45) * Math.PI);
      const releaseEnv = t > 0.25 ? Math.sin(((t - 0.25) / 0.75) * Math.PI) : 0;
      const dilEnv = t >= 0.12 && t <= 0.42 ? Math.sin(((t - 0.12) / 0.30) * Math.PI) : 0;

      this.output.timeScale = 1.0 - dilEnv * 0.62;
      this.output.distanceBias = (-0.95 * burstEnv + 0.55 * releaseEnv) * motionMult;
      this.output.heightBias = (-0.22 * burstEnv + 0.18 * releaseEnv) * motionMult;
      this.output.sideBias = 0.35 * burstEnv * motionMult;
      this.output.fovBias = (-7.5 * burstEnv + 6.5 * releaseEnv) * motionMult;
      this.output.rollBias = (this.reducedMotion ? 0 : -0.045 * burstEnv);
      this.output.vignetteDelta = 0.16 * burstEnv;
      this.output.contrastDelta = 0.08 * burstEnv;
    } else if (this.activeKind === 'sevenfold_convergence') {
      // Mirrors SevenfoldConvergenceController's 1.65s 3-phase rhythm:
      // 0..0.35 high blade-ring pullout; 0.35..0.85 wave punches + final wave dilation; 0.85..1.0 settle
      const archEnv = Math.sin(t * Math.PI);
      const wavePeak = t >= 0.55 && t <= 0.86 ? Math.sin(((t - 0.55) / 0.31) * Math.PI) : 0;

      this.output.timeScale = 1.0 - wavePeak * 0.58; // dips to 0.42x on crescendo
      this.output.distanceBias = (1.55 * archEnv - 1.15 * wavePeak) * motionMult;
      this.output.heightBias = (0.75 * archEnv - 0.35 * wavePeak) * motionMult;
      this.output.sideBias = 0.3 * Math.sin(t * Math.PI * 2) * motionMult;
      this.output.fovBias = (8.5 * archEnv - 9.0 * wavePeak) * motionMult;
      this.output.rollBias = this.reducedMotion ? 0 : 0.038 * wavePeak;
      this.output.vignetteDelta = 0.14 * archEnv;
      this.output.contrastDelta = 0.07 * archEnv;
    } else {
      // boss_stagger (P2): tight over-shoulder execution focus + 0.30x time dilation
      const env = Math.sin(t * Math.PI);
      const rampIn = THREE.MathUtils.smoothstep(t, 0.0, 0.2);
      const rampOut = 1.0 - THREE.MathUtils.smoothstep(t, 0.65, 1.0);
      const plateau = Math.min(rampIn, rampOut);

      this.output.timeScale = 1.0 - plateau * 0.70; // 0.30x
      this.output.distanceBias = -1.25 * env * motionMult;
      this.output.heightBias = -0.18 * env * motionMult;
      this.output.sideBias = 0.68 * plateau * motionMult;
      this.output.fovBias = -8.5 * plateau * motionMult;
      this.output.rollBias = this.reducedMotion ? 0 : 0.032 * plateau;
      this.output.vignetteDelta = 0.18 * plateau;
      this.output.contrastDelta = 0.09 * plateau;
    }

    return this.output;
  }
}
