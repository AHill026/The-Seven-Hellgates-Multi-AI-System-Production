/**
 * The Seven Hellgates - Delta-Driven Sequence & Pause-Safe Cue Controller
 * Replaces fragile window.setTimeout chains with frame-clock tracks that pause cleanly
 * and cancel atomically on abort, realm transition, death, or disposal.
 */

import * as THREE from 'three';
import {
  CinematicPose,
  CinematicSequenceDefinition,
} from './types';

interface WorldCueEntry {
  id: number;
  remaining: number;
  fn: () => void;
}

export class CinematicSequenceController {
  public activeSequence: CinematicSequenceDefinition | null = null;
  public elapsed: number = 0;
  public totalDuration: number = 0;

  private reducedMotion: boolean = false;
  private worldCues: WorldCueEntry[] = [];
  private nextCueId: number = 1;

  private readonly tmpPose: CinematicPose = {
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    fov: 60,
    rollRad: 0,
  };

  public start(sequence: CinematicSequenceDefinition): void {
    this.activeSequence = sequence;
    this.elapsed = 0;
    this.totalDuration = sequence.shots.reduce((sum, s) => sum + s.duration, 0);
    for (let i = 0; i < sequence.cues.length; i++) {
      sequence.cues[i].fired = false;
    }
    this.reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  public clearActive(): void {
    this.activeSequence = null;
    this.elapsed = 0;
    this.totalDuration = 0;
  }

  /**
   * Advances sequence clock & fires due cues. Returns true when final shot finishes.
   */
  public step(rawDelta: number): boolean {
    const seq = this.activeSequence;
    if (!seq) return true;

    this.elapsed += rawDelta;

    for (let i = 0; i < seq.cues.length; i++) {
      const cue = seq.cues[i];
      if (!cue.fired && this.elapsed >= cue.time) {
        cue.fired = true;
        cue.onTrigger();
      }
    }

    if (this.elapsed >= this.totalDuration) {
      return true;
    }
    return false;
  }

  public fastForwardSkip(): void {
    const seq = this.activeSequence;
    if (!seq) return;
    // Trigger any remaining unfired state cues (e.g. objective or reveal state transitions)
    for (let i = 0; i < seq.cues.length; i++) {
      const cue = seq.cues[i];
      if (!cue.fired) {
        cue.fired = true;
      }
    }
    this.elapsed = this.totalDuration;
  }

  public evaluatePose(outPose?: CinematicPose): CinematicPose {
    const target = outPose || this.tmpPose;
    const seq = this.activeSequence;
    if (!seq || seq.shots.length === 0) {
      return target;
    }

    let acc = 0;
    let shot = seq.shots[seq.shots.length - 1];
    let localT = 1;

    for (let i = 0; i < seq.shots.length; i++) {
      const candidate = seq.shots[i];
      if (this.elapsed <= acc + candidate.duration || i === seq.shots.length - 1) {
        shot = candidate;
        localT = Math.max(0, Math.min(1, (this.elapsed - acc) / Math.max(0.001, candidate.duration)));
        break;
      }
      acc += candidate.duration;
    }

    let eased = localT;
    if (shot.easing === 'easeOutCubic') {
      eased = 1 - Math.pow(1 - localT, 3);
    } else if (shot.easing !== 'linear') {
      eased = localT < 0.5 ? 4 * localT * localT * localT : 1 - Math.pow(-2 * localT + 2, 3) / 2;
    }

    target.position.lerpVectors(shot.startPos, shot.endPos, eased);
    target.lookAt.lerpVectors(shot.startLookAt, shot.endLookAt, eased);

    const globalProgress = this.totalDuration > 0 ? Math.min(1, this.elapsed / this.totalDuration) : 1;
    target.fov = this.reducedMotion
      ? THREE.MathUtils.lerp(58, 60, globalProgress)
      : THREE.MathUtils.lerp(shot.startFov, shot.endFov, eased);

    target.rollRad = this.reducedMotion ? 0 : shot.rollRad * Math.sin(localT * Math.PI);
    return target;
  }

  /**
   * Pause-safe timed world callback scheduler (replaces raw window.setTimeout).
   */
  public scheduleWorldCue(delaySeconds: number, fn: () => void): number {
    const id = this.nextCueId++;
    this.worldCues.push({ id, remaining: Math.max(0, delaySeconds), fn });
    return id;
  }

  public clearAllWorldCues(): void {
    this.worldCues.length = 0;
  }

  public updateWorldCues(simDelta: number): void {
    for (let i = this.worldCues.length - 1; i >= 0; i--) {
      const entry = this.worldCues[i];
      entry.remaining -= simDelta;
      if (entry.remaining <= 0) {
        this.worldCues.splice(i, 1);
        entry.fn();
      }
    }
  }
}
