/**
 * The Seven Hellgates - Authored Cinematic Sequence Builders
 * Concrete sequence specifications for Realm Opening Pans, Citadel Breach Reveal,
 * and the Full 3D White-Eyed God Finale.
 */

import * as THREE from 'three';
import {
  CinematicPriority,
  CinematicSequenceDefinition,
  WhiteEyedGodStage,
} from './types';

export function buildRealmOpeningSequence(params: {
  realmId: number;
  realmName: string;
  spawnPos: THREE.Vector3;
  spawnRotY: number;
  hellgatePos: THREE.Vector3;
  onVoiceCue: () => void;
  onComplete?: (wasSkipped: boolean) => void;
}): CinematicSequenceDefinition {
  const { realmId, realmName, spawnPos, spawnRotY, hellgatePos, onVoiceCue, onComplete } = params;

  const forwardX = Math.sin(spawnRotY);
  const forwardZ = Math.cos(spawnRotY);

  // Gameplay resting pose directly behind Azrael
  const pitch = 0.25;
  const dist = 4.8;
  const cx = Math.sin(spawnRotY) * Math.cos(pitch) * dist;
  const cy = Math.sin(pitch) * dist;
  const cz = Math.cos(spawnRotY) * Math.cos(pitch) * dist;

  const lookTarget = new THREE.Vector3(spawnPos.x, spawnPos.y + 1.45, spawnPos.z);
  const gameplayCamPos = new THREE.Vector3(lookTarget.x - cx, lookTarget.y + cy, lookTarget.z - cz);

  const horizonLook = new THREE.Vector3(
    spawnPos.x * 0.4 + hellgatePos.x * 0.6,
    spawnPos.y + 5.2,
    spawnPos.z * 0.4 + hellgatePos.z * 0.6
  );

  const craneHighPos = new THREE.Vector3(
    spawnPos.x - forwardX * 9.5 + 4.8,
    spawnPos.y + 7.4,
    spawnPos.z - forwardZ * 9.5
  );
  const orbitMidPos = new THREE.Vector3(
    spawnPos.x - forwardX * 6.2 - 3.2,
    spawnPos.y + 3.6,
    spawnPos.z - forwardZ * 6.2
  );
  const midLook = new THREE.Vector3(
    spawnPos.x + forwardX * 4.5,
    spawnPos.y + 2.1,
    spawnPos.z + forwardZ * 4.5
  );

  return {
    id: `realm_opening_${realmId}`,
    kind: 'story',
    priority: CinematicPriority.STORY_SEQUENCE,
    controlLevel: 'FULL_LOCK',
    canSkip: true,
    showLetterbox: true,
    hideHud: true,
    blendInDuration: 0.35,
    blendOutDuration: 0.45,
    vignetteBoost: 0.1,
    contrastBoost: 0.04,
    title: realmName,
    subtitleLabel: `Realm ${realmId}`,
    shots: [
      {
        duration: 1.85,
        startPos: craneHighPos,
        endPos: orbitMidPos,
        startLookAt: horizonLook,
        endLookAt: midLook,
        startFov: 66,
        endFov: 61,
        rollRad: 0.018,
        easing: 'easeInOutCubic',
      },
      {
        duration: 1.65,
        startPos: orbitMidPos,
        endPos: gameplayCamPos,
        startLookAt: midLook,
        endLookAt: lookTarget,
        startFov: 61,
        endFov: 60,
        rollRad: 0,
        easing: 'easeOutCubic',
      },
    ],
    cues: [
      {
        id: 'realm_voice_enter',
        time: 0.7,
        fired: false,
        onTrigger: onVoiceCue,
      },
    ],
    onComplete,
  };
}

export function buildCitadelBreachSequence(params: {
  playerPos: THREE.Vector3;
  breachCenter: THREE.Vector3;
  playerYaw: number;
  getGroundHeightAt: (x: number, z: number) => number;
  onComplete?: (wasSkipped: boolean) => void;
}): CinematicSequenceDefinition {
  const { playerPos, breachCenter, playerYaw, getGroundHeightAt, onComplete } = params;

  const breachY = getGroundHeightAt(breachCenter.x, breachCenter.z);
  const breachFocus = new THREE.Vector3(breachCenter.x, breachY + 1.8, breachCenter.z);

  const sweepStart = new THREE.Vector3(
    breachCenter.x - 10.5,
    breachY + 6.4,
    breachCenter.z + 12.0
  );
  const sweepEnd = new THREE.Vector3(
    breachCenter.x + 8.5,
    breachY + 4.8,
    breachCenter.z + 10.5
  );

  // End near player's third-person position facing the breach
  const cx = Math.sin(playerYaw) * Math.cos(0.25) * 4.8;
  const cy = Math.sin(0.25) * 4.8;
  const cz = Math.cos(playerYaw) * Math.cos(0.25) * 4.8;
  const returnLook = new THREE.Vector3(playerPos.x, playerPos.y + 1.45, playerPos.z);
  const returnCam = new THREE.Vector3(returnLook.x - cx, returnLook.y + cy, returnLook.z - cz);

  return {
    id: 'citadel_breach_reveal',
    kind: 'story',
    priority: CinematicPriority.STORY_SEQUENCE,
    controlLevel: 'FULL_LOCK',
    canSkip: true,
    showLetterbox: true,
    hideHud: true,
    blendInDuration: 0.35,
    blendOutDuration: 0.4,
    vignetteBoost: 0.14,
    contrastBoost: 0.06,
    shots: [
      {
        duration: 1.75,
        startPos: sweepStart,
        endPos: sweepEnd,
        startLookAt: breachFocus,
        endLookAt: breachFocus,
        startFov: 64,
        endFov: 56,
        rollRad: -0.025,
        easing: 'easeInOutCubic',
      },
      {
        duration: 0.9,
        startPos: sweepEnd,
        endPos: returnCam,
        startLookAt: breachFocus,
        endLookAt: returnLook,
        startFov: 56,
        endFov: 60,
        rollRad: 0,
        easing: 'easeOutCubic',
      },
    ],
    cues: [],
    onComplete,
  };
}

export function buildWhiteEyedGodFinaleSequence(params: {
  onStageChange: (stage: WhiteEyedGodStage) => void;
  onEnterVoid: () => void;
  onWhisperCue: () => void;
}): CinematicSequenceDefinition {
  const { onStageChange, onEnterVoid, onWhisperCue } = params;
  const eyeCenter = new THREE.Vector3(0, 6.0, -18);

  return {
    id: 'white_eyed_god_finale',
    kind: 'finale',
    priority: CinematicPriority.FINALE_OVERRIDE,
    controlLevel: 'FULL_LOCK',
    canSkip: false,
    showLetterbox: false,
    hideHud: true,
    blendInDuration: 0.8,
    blendOutDuration: 0.0,
    holdAtEnd: true,
    vignetteBoost: 0.25,
    contrastBoost: 0.12,
    shots: [
      {
        // Shot 0 (0..1.4s): Void dissolve — world drops away into pitch darkness, distant gaze awakens
        duration: 1.4,
        startPos: new THREE.Vector3(0, 2.2, 12.5),
        endPos: new THREE.Vector3(0, 2.6, 10.5),
        startLookAt: new THREE.Vector3(0, 4.4, -18),
        endLookAt: eyeCenter.clone(),
        startFov: 60,
        endFov: 56,
        rollRad: 0,
        easing: 'easeInOutCubic',
      },
      {
        // Shot 1 (1.4..4.0s): Slow hypnotic push-in framing the two enormous 3D glowing white eyes
        duration: 2.6,
        startPos: new THREE.Vector3(0, 2.6, 10.5),
        endPos: new THREE.Vector3(0, 4.6, 5.4),
        startLookAt: eyeCenter.clone(),
        endLookAt: eyeCenter.clone(),
        startFov: 56,
        endFov: 47,
        rollRad: 0.015,
        easing: 'easeInOutCubic',
      },
      {
        // Shot 2 (4.0..6.4s): Whispering climax — tight inescapable void stare ("Azrael…")
        duration: 2.4,
        startPos: new THREE.Vector3(0, 4.6, 5.4),
        endPos: new THREE.Vector3(0, 5.2, 3.8),
        startLookAt: eyeCenter.clone(),
        endLookAt: eyeCenter.clone(),
        startFov: 47,
        endFov: 41,
        rollRad: -0.015,
        easing: 'easeInOutCubic',
      },
      {
        // Shot 3 (6.4..7.8s): Hold stillness into cutToBlack -> titleReveal
        duration: 1.4,
        startPos: new THREE.Vector3(0, 5.2, 3.8),
        endPos: new THREE.Vector3(0, 5.3, 3.5),
        startLookAt: eyeCenter.clone(),
        endLookAt: eyeCenter.clone(),
        startFov: 41,
        endFov: 40,
        rollRad: 0,
        easing: 'linear',
      },
    ],
    cues: [
      {
        id: 'weg_void_enter',
        time: 0.0,
        fired: false,
        onTrigger: () => {
          onStageChange('dissolve');
          onEnterVoid();
        },
      },
      {
        id: 'weg_stare',
        time: 1.35,
        fired: false,
        onTrigger: () => {
          onStageChange('stare');
        },
      },
      {
        id: 'weg_whisper',
        time: 3.9,
        fired: false,
        onTrigger: () => {
          onStageChange('whisper');
          onWhisperCue();
        },
      },
      {
        id: 'weg_blackout',
        time: 6.3,
        fired: false,
        onTrigger: () => {
          onStageChange('cutToBlack');
        },
      },
      {
        id: 'weg_title_reveal',
        time: 7.75,
        fired: false,
        onTrigger: () => {
          onStageChange('titleReveal');
        },
      },
    ],
  };
}
