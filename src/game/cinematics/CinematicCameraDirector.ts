/**
 * The Seven Hellgates - Cinematic Camera Director
 * Central priority-based coordinator orchestrating BossEntranceDirector (P4),
 * Story/Finale sequences (P3/P5), CameraTransitionController, InteractiveMomentController (P1/P2),
 * CinematicInputController (STORY-ONLY skip), and pause-safe timed world cues.
 */

import * as THREE from 'three';
import { CameraController } from '../core/CameraController';
import { InputState } from '../core/InputManager';
import { BossEntranceDirector, BossEntranceState } from '../vfx/BossEntranceDirector';
import { UE5PostProcessingPipeline } from '../vfx/UE5PostProcessing';
import {
  EnvironmentBoxCollider,
  EnvironmentCylinderCollider,
} from '../worlds/environments/types';
import { CameraTransitionController } from './CameraTransitionController';
import { CinematicInputController } from './CinematicInputController';
import {
  InteractiveMomentController,
  InteractiveMomentOutput,
} from './InteractiveMomentController';
import { CinematicSequenceController } from './CinematicSequenceController';
import {
  CinematicDirectorState,
  CinematicPose,
  CinematicPriority,
  CinematicSequenceDefinition,
  CinematicUIState,
  WhiteEyedGodStage,
} from './types';

export interface DirectorFrameContext {
  playerPos: THREE.Vector3;
  rawInput: InputState;
  isPaused: boolean;
  isGameOver: boolean;
  isInMainMenu: boolean;
  getGroundHeightAt?: (x: number, z: number) => number;
  colliders?: readonly EnvironmentCylinderCollider[];
  boxColliders?: readonly EnvironmentBoxCollider[];
}

export interface DirectorFrameOutput {
  simDelta: number;
  timeScale: number;
  filteredInput: InputState;
  isLockingGameplay: boolean;
  isIgnoringHitstop: boolean;
  cinematicUI: CinematicUIState | null;
  bossEntranceUI: BossEntranceState | null;
}

export class CinematicCameraDirector {
  public state: CinematicDirectorState = 'IDLE';

  private readonly cameraCtrl: CameraController;
  private readonly bossDirector: BossEntranceDirector;
  private readonly seqCtrl = new CinematicSequenceController();
  private readonly transitionCtrl = new CameraTransitionController();
  private readonly inputCtrl = new CinematicInputController();
  private readonly momentCtrl = new InteractiveMomentController();

  private activePriority: CinematicPriority = CinematicPriority.GAMEPLAY_THIRD_PERSON;
  private finaleStage: WhiteEyedGodStage | undefined = undefined;
  private wasPaused: boolean = false;
  private stateBeforePause: CinematicDirectorState = 'IDLE';
  private pendingBossAbortedRestore: (() => void) | null = null;

  // Zero-allocation scratch vectors & pose holders
  private readonly tmpFromPos = new THREE.Vector3();
  private readonly tmpFromLook = new THREE.Vector3();
  private readonly tmpTargetPos = new THREE.Vector3();
  private readonly tmpTargetLook = new THREE.Vector3();
  private readonly tmpBlendedPos = new THREE.Vector3();
  private readonly tmpBlendedLook = new THREE.Vector3();
  private readonly tmpEvalPose: CinematicPose = {
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    fov: 60,
    rollRad: 0,
  };

  constructor(cameraCtrl: CameraController, bossDirector: BossEntranceDirector) {
    this.cameraCtrl = cameraCtrl;
    this.bossDirector = bossDirector;
  }

  public isSequenceActive(): boolean {
    return (
      this.bossDirector.isActive ||
      this.state === 'BLENDING_IN' ||
      this.state === 'ACTIVE_SEQUENCE' ||
      this.state === 'HOLD_FINALE' ||
      this.state === 'BLENDING_OUT'
    );
  }

  public isLockingGameplay(): boolean {
    if (this.bossDirector.isActive) return true;
    const seq = this.seqCtrl.activeSequence;
    if (
      seq &&
      seq.controlLevel === 'FULL_LOCK' &&
      (this.state === 'BLENDING_IN' ||
        this.state === 'ACTIVE_SEQUENCE' ||
        this.state === 'HOLD_FINALE')
    ) {
      return true;
    }
    return false;
  }

  public getMomentOutput(): InteractiveMomentOutput | null {
    return null;
  }

  public setFinaleStage(stage: WhiteEyedGodStage): void {
    this.finaleStage = stage;
  }

  public scheduleWorldCue(delaySeconds: number, fn: () => void): number {
    return this.seqCtrl.scheduleWorldCue(delaySeconds, fn);
  }

  public clearAllWorldCues(): void {
    this.seqCtrl.clearAllWorldCues();
  }

  /**
   * Requests playback of a P3 Story or P5 Finale sequence under strict priority arbitration.
   */
  public startSequence(
    seq: CinematicSequenceDefinition,
    ue5Pipeline?: UE5PostProcessingPipeline | null
  ): boolean {
    // Reject if higher-priority or non-preemptible boss intro / finale is running
    if (this.bossDirector.isActive && seq.priority < CinematicPriority.MANDATORY_BOSS_INTRO) {
      return false;
    }
    if (this.state !== 'IDLE' && seq.priority < this.activePriority) {
      return false;
    }

    // Preempt any lower active sequence cleanly
    if (this.seqCtrl.activeSequence) {
      this.seqCtrl.activeSequence.onAbort?.();
      this.seqCtrl.clearActive();
    }
    if (this.bossDirector.isActive && seq.priority > CinematicPriority.MANDATORY_BOSS_INTRO) {
      this.bossDirector.abort();
    }
    this.momentCtrl.abort();
    this.cameraCtrl.clearAdditiveBias();

    const snap = this.cameraCtrl.getCurrentPose(this.tmpFromPos, this.tmpFromLook);
    this.activePriority = seq.priority;
    this.finaleStage = seq.kind === 'finale' ? 'dissolve' : undefined;
    this.seqCtrl.start(seq);

    if (ue5Pipeline) {
      ue5Pipeline.setCinematicOffsets(seq.vignetteBoost ?? 0, seq.contrastBoost ?? 0);
    }

    if (seq.blendInDuration > 0.02) {
      this.transitionCtrl.startBlend(
        this.tmpFromPos,
        this.tmpFromLook,
        snap.fov,
        snap.rollRad,
        seq.blendInDuration
      );
      this.state = 'BLENDING_IN';
    } else {
      this.transitionCtrl.cancel();
      this.state = 'ACTIVE_SEQUENCE';
    }

    return true;
  }

  /**
   * Coordinates P4 Mandatory Boss Entrance (delegate to BossEntranceDirector).
   */
  public notifyBossEntranceStarted(onEmergencyAbort?: () => void): void {
    if (this.seqCtrl.activeSequence) {
      this.seqCtrl.activeSequence.onAbort?.();
      this.seqCtrl.clearActive();
    }
    this.transitionCtrl.cancel();
    this.momentCtrl.abort();
    this.cameraCtrl.clearAdditiveBias();
    this.activePriority = CinematicPriority.MANDATORY_BOSS_INTRO;
    this.state = 'ACTIVE_SEQUENCE';
    this.pendingBossAbortedRestore = onEmergencyAbort || null;
  }

  public notifyBossEntranceCompleted(): void {
    this.pendingBossAbortedRestore = null;
    if (this.activePriority === CinematicPriority.MANDATORY_BOSS_INTRO) {
      this.activePriority = CinematicPriority.GAMEPLAY_THIRD_PERSON;
      this.state = 'IDLE';
    }
  }

  // --- P1 / P2 Trigger Hooks ---
  public triggerWrathAwakening(): void {
    if (this.isLockingGameplay()) return;
    this.momentCtrl.triggerWrathAwakening();
  }

  public triggerConvergence(): void {
    if (this.isLockingGameplay()) return;
    this.momentCtrl.triggerConvergence();
  }

  public triggerStaggerMoment(): boolean {
    if (this.isLockingGameplay()) return false;
    return this.momentCtrl.triggerBossStaggerMoment();
  }

  /**
   * STORY-ONLY skip action (UI button or Space during P3 Story Sequence).
   * Explicitly rejects P4 Mandatory Boss Intros and P5 Finale.
   */
  public skipStorySequence(
    playerPos: THREE.Vector3,
    ue5Pipeline?: UE5PostProcessingPipeline | null,
    getGroundHeightAt?: (x: number, z: number) => number,
    colliders?: readonly EnvironmentCylinderCollider[],
    boxColliders?: readonly EnvironmentBoxCollider[]
  ): boolean {
    if (this.bossDirector.isActive) return false;
    const seq = this.seqCtrl.activeSequence;
    if (!seq || !seq.canSkip) return false;

    this.seqCtrl.fastForwardSkip();
    this.beginBlendOut(playerPos, true, ue5Pipeline, getGroundHeightAt, colliders, boxColliders);
    return true;
  }

  private beginBlendOut(
    playerPos: THREE.Vector3,
    wasSkipped: boolean,
    ue5Pipeline?: UE5PostProcessingPipeline | null,
    getGroundHeightAt?: (x: number, z: number) => number,
    colliders?: readonly EnvironmentCylinderCollider[],
    boxColliders?: readonly EnvironmentBoxCollider[]
  ): void {
    const seq = this.seqCtrl.activeSequence;
    if (!seq) {
      this.state = 'IDLE';
      this.activePriority = CinematicPriority.GAMEPLAY_THIRD_PERSON;
      return;
    }

    const cb = seq.onComplete;
    const blendOut = wasSkipped ? Math.min(0.35, Math.max(0.2, seq.blendOutDuration)) : seq.blendOutDuration;

    if (ue5Pipeline) {
      ue5Pipeline.setCinematicOffsets(0, 0);
    }

    if (blendOut > 0.02) {
      const snap = this.cameraCtrl.getCurrentPose(this.tmpFromPos, this.tmpFromLook);
      this.transitionCtrl.startBlend(
        this.tmpFromPos,
        this.tmpFromLook,
        snap.fov,
        snap.rollRad,
        blendOut
      );
      this.seqCtrl.clearActive();
      this.state = 'BLENDING_OUT';

      // Pre-compute gameplay target once for initial transition continuity
      this.cameraCtrl.computeGameplayPose(
        playerPos,
        this.tmpTargetPos,
        this.tmpTargetLook,
        getGroundHeightAt,
        colliders,
        boxColliders
      );
    } else {
      this.seqCtrl.clearActive();
      this.cameraCtrl.releaseCutscene();
      this.state = 'IDLE';
      this.activePriority = CinematicPriority.GAMEPLAY_THIRD_PERSON;
    }

    cb?.(wasSkipped);
  }

  /**
   * Emergency cleanup for player death, unstuck, realm switch, new game, or disposal.
   */
  public abortImmediate(ue5Pipeline?: UE5PostProcessingPipeline | null): void {
    if (this.bossDirector.isActive) {
      this.bossDirector.abort();
      this.pendingBossAbortedRestore?.();
      this.pendingBossAbortedRestore = null;
    }
    if (this.seqCtrl.activeSequence) {
      this.seqCtrl.activeSequence.onAbort?.();
      this.seqCtrl.clearActive();
    }
    this.seqCtrl.clearAllWorldCues();
    this.transitionCtrl.cancel();
    this.momentCtrl.abort();
    this.cameraCtrl.clearAdditiveBias();
    this.cameraCtrl.releaseCutscene();
    if (ue5Pipeline) {
      ue5Pipeline.setCinematicOffsets(0, 0);
    }
    this.finaleStage = undefined;
    this.state = 'IDLE';
    this.stateBeforePause = 'IDLE';
    this.wasPaused = false;
    this.activePriority = CinematicPriority.GAMEPLAY_THIRD_PERSON;
  }

  public update(
    rawDelta: number,
    ctx: DirectorFrameContext,
    ue5Pipeline?: UE5PostProcessingPipeline | null
  ): DirectorFrameOutput {
    // 1. Handle Pause Freeze cleanly
    if (ctx.isPaused && !ctx.isInMainMenu) {
      if (!this.wasPaused) {
        this.wasPaused = true;
        this.stateBeforePause = this.state;
        if (this.state !== 'IDLE') {
          this.state = 'PAUSED_FROZEN';
        }
      }
      const allowPauseToggle = this.activePriority !== CinematicPriority.FINALE_OVERRIDE;
      const filtered = this.inputCtrl.filter(ctx.rawInput, 'FULL_LOCK', false, allowPauseToggle);
      return {
        simDelta: 0,
        timeScale: 0,
        filteredInput: filtered.input,
        isLockingGameplay: true,
        isIgnoringHitstop: true,
        cinematicUI: this.getUIState(),
        bossEntranceUI: this.bossDirector.getUIState(),
      };
    } else if (this.wasPaused) {
      this.wasPaused = false;
      this.state = this.stateBeforePause;
    }

    // 2. Abort gameplay-level sequences on death
    if (ctx.isGameOver && (this.isSequenceActive() || this.momentCtrl)) {
      if (this.activePriority < CinematicPriority.FINALE_OVERRIDE) {
        this.abortImmediate(ue5Pipeline);
      }
    }

    // 3. Determine active control level & skip eligibility
    const activeSeq = this.seqCtrl.activeSequence;
    const isLockedByBoss = this.bossDirector.isActive;
    const isLockedBySeq =
      Boolean(activeSeq && activeSeq.controlLevel === 'FULL_LOCK') &&
      (this.state === 'BLENDING_IN' ||
        this.state === 'ACTIVE_SEQUENCE' ||
        this.state === 'HOLD_FINALE');

    const controlLevel = isLockedByBoss || isLockedBySeq ? 'FULL_LOCK' : 'FREE';
    const canSkipStory = Boolean(
      !isLockedByBoss &&
        activeSeq &&
        activeSeq.canSkip &&
        (this.state === 'BLENDING_IN' || this.state === 'ACTIVE_SEQUENCE')
    );
    const allowPause =
      !ctx.isInMainMenu &&
      !ctx.isGameOver &&
      this.activePriority !== CinematicPriority.FINALE_OVERRIDE;

    const { input: filteredInput, storySkipTriggered } = this.inputCtrl.filter(
      ctx.rawInput,
      controlLevel,
      canSkipStory,
      allowPause
    );

    if (storySkipTriggered && canSkipStory) {
      this.skipStorySequence(
        ctx.playerPos,
        ue5Pipeline,
        ctx.getGroundHeightAt,
        ctx.colliders,
        ctx.boxColliders
      );
    }

    // 4. Advance active BossEntranceDirector (P4) OR Sequence/Transition states (P3/P5)
    if (this.bossDirector.isActive) {
      this.bossDirector.update(rawDelta);
      if (!this.bossDirector.isActive) {
        this.notifyBossEntranceCompleted();
      }
    } else if (this.state === 'BLENDING_IN' || this.state === 'ACTIVE_SEQUENCE') {
      const done = this.seqCtrl.step(rawDelta);
      const pose = this.seqCtrl.evaluatePose(this.tmpEvalPose);

      if (this.state === 'BLENDING_IN') {
        const res = this.transitionCtrl.stepAndApply(
          rawDelta,
          pose.position,
          pose.lookAt,
          pose.fov,
          pose.rollRad,
          this.tmpBlendedPos,
          this.tmpBlendedLook
        );
        this.cameraCtrl.setCutsceneFrame(
          this.tmpBlendedPos,
          this.tmpBlendedLook,
          res.fov,
          res.rollRad
        );
        if (res.finished) {
          this.state = 'ACTIVE_SEQUENCE';
        }
      } else {
        this.cameraCtrl.setCutsceneFrame(pose.position, pose.lookAt, pose.fov, pose.rollRad);
      }

      if (done && this.seqCtrl.activeSequence) {
        if (this.seqCtrl.activeSequence.holdAtEnd) {
          this.state = 'HOLD_FINALE';
        } else {
          this.beginBlendOut(
            ctx.playerPos,
            false,
            ue5Pipeline,
            ctx.getGroundHeightAt,
            ctx.colliders,
            ctx.boxColliders
          );
        }
      }
    } else if (this.state === 'HOLD_FINALE') {
      const pose = this.seqCtrl.evaluatePose(this.tmpEvalPose);
      this.cameraCtrl.setCutsceneFrame(pose.position, pose.lookAt, pose.fov, pose.rollRad);
    } else if (this.state === 'BLENDING_OUT') {
      const targetFov = this.cameraCtrl.computeGameplayPose(
        ctx.playerPos,
        this.tmpTargetPos,
        this.tmpTargetLook,
        ctx.getGroundHeightAt,
        ctx.colliders,
        ctx.boxColliders
      );
      const res = this.transitionCtrl.stepAndApply(
        rawDelta,
        this.tmpTargetPos,
        this.tmpTargetLook,
        targetFov,
        0,
        this.tmpBlendedPos,
        this.tmpBlendedLook
      );
      this.cameraCtrl.setCutsceneFrame(
        this.tmpBlendedPos,
        this.tmpBlendedLook,
        res.fov,
        res.rollRad
      );
      if (res.finished) {
        this.cameraCtrl.releaseCutscene();
        this.state = 'IDLE';
        this.activePriority = CinematicPriority.GAMEPLAY_THIRD_PERSON;
      }
    }

    // 5. Evaluate P1/P2 Interactive Moment time dilation + additive camera bias
    const suppressMoments = this.isLockingGameplay() || ctx.isInMainMenu || ctx.isGameOver;
    const moment = this.momentCtrl.update(rawDelta, suppressMoments);

    if (moment.isActive) {
      this.cameraCtrl.setAdditiveBias(
        moment.distanceBias,
        moment.heightBias,
        moment.sideBias,
        moment.fovBias,
        moment.rollBias
      );
      ue5Pipeline?.setCinematicOffsets(moment.vignetteDelta, moment.contrastDelta);
    } else {
      this.cameraCtrl.clearAdditiveBias();
      if (!this.seqCtrl.activeSequence) {
        ue5Pipeline?.setCinematicOffsets(0, 0);
      }
    }

    const simDelta = rawDelta * moment.timeScale;

    // 6. Step pause-safe world cues
    if (!ctx.isInMainMenu && !ctx.isGameOver) {
      this.seqCtrl.updateWorldCues(simDelta);
    }

    const isIgnoringHitstop =
      this.bossDirector.isActive ||
      this.state === 'BLENDING_IN' ||
      this.state === 'ACTIVE_SEQUENCE' ||
      this.state === 'HOLD_FINALE' ||
      this.state === 'BLENDING_OUT' ||
      moment.isActive;

    return {
      simDelta,
      timeScale: moment.timeScale,
      filteredInput,
      isLockingGameplay: this.isLockingGameplay(),
      isIgnoringHitstop,
      cinematicUI: this.getUIState(),
      bossEntranceUI: this.bossDirector.getUIState(),
    };
  }

  public getUIState(): CinematicUIState | null {
    if (this.bossDirector.isActive) {
      const bossUI = this.bossDirector.getUIState();
      return {
        isActive: true,
        sequenceId: `boss_intro_${bossUI?.realmId ?? 1}`,
        kind: 'boss_intro',
        canSkip: false,
        locksControls: true,
        hideHud: true,
        showLetterbox: true,
        progress: bossUI?.progress ?? 0,
      };
    }

    const seq = this.seqCtrl.activeSequence;
    if (!seq) return null;

    const progress =
      this.seqCtrl.totalDuration > 0
        ? Math.min(1, this.seqCtrl.elapsed / this.seqCtrl.totalDuration)
        : 1;

    return {
      isActive: true,
      sequenceId: seq.id,
      kind: seq.kind,
      canSkip: seq.canSkip && (this.state === 'BLENDING_IN' || this.state === 'ACTIVE_SEQUENCE'),
      locksControls: seq.controlLevel === 'FULL_LOCK',
      hideHud: seq.hideHud,
      showLetterbox: seq.showLetterbox,
      title: seq.title,
      subtitleLabel: seq.subtitleLabel,
      accentHex: seq.accentHex,
      progress,
      finaleStage: this.finaleStage,
    };
  }

  public dispose(): void {
    this.abortImmediate(null);
  }
}
