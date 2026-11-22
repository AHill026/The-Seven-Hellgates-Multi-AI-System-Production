/**
 * The Seven Hellgates - Cinematic Input Controller
 * Policy-enforced input masking & STORY-ONLY skip routing.
 */

import { InputState } from '../core/InputManager';
import { CinematicControlLevel } from './types';

export interface FilteredInputResult {
  input: InputState;
  storySkipTriggered: boolean;
}

export class CinematicInputController {
  // Pre-allocated masked output object to avoid per-frame spread churn
  private readonly maskedState: InputState = {
    moveX: 0,
    moveZ: 0,
    lookX: 0,
    lookY: 0,
    isSprinting: false,
    attackLight: false,
    attackHeavy: false,
    dodge: false,
    switchStance: false,
    specialAbility: false,
    devourSkill: false,
    wrathUltimate: false,
    manifestWeapon: false,
    convergenceUltimate: false,
    equipWeaponSlot: null,
    toggleArsenal: false,
    toggleLockOn: false,
    toggleWeather: false,
    pause: false,
    skipCutscene: false,
    unstuck: false,
  };

  public filter(
    rawInput: InputState,
    controlLevel: CinematicControlLevel,
    canSkipStory: boolean,
    allowPause: boolean
  ): FilteredInputResult {
    // Copy raw values into pre-allocated container
    const out = this.maskedState;
    out.moveX = rawInput.moveX;
    out.moveZ = rawInput.moveZ;
    out.lookX = rawInput.lookX;
    out.lookY = rawInput.lookY;
    out.isSprinting = rawInput.isSprinting;
    out.attackLight = rawInput.attackLight;
    out.attackHeavy = rawInput.attackHeavy;
    out.dodge = rawInput.dodge;
    out.switchStance = rawInput.switchStance;
    out.specialAbility = rawInput.specialAbility;
    out.devourSkill = rawInput.devourSkill;
    out.wrathUltimate = rawInput.wrathUltimate;
    out.manifestWeapon = rawInput.manifestWeapon;
    out.convergenceUltimate = rawInput.convergenceUltimate;
    out.equipWeaponSlot = rawInput.equipWeaponSlot;
    out.toggleArsenal = rawInput.toggleArsenal;
    out.toggleLockOn = rawInput.toggleLockOn;
    out.toggleWeather = rawInput.toggleWeather;
    out.pause = allowPause ? rawInput.pause : false;
    out.skipCutscene = false;
    out.unstuck = rawInput.unstuck;

    let storySkipTriggered = false;

    if (controlLevel === 'FULL_LOCK') {
      if (canSkipStory && rawInput.skipCutscene) {
        storySkipTriggered = true;
      }

      // Lock movement, combat actions, arsenal hotkeys, and look deltas
      out.moveX = 0;
      out.moveZ = 0;
      out.lookX = 0;
      out.lookY = 0;
      out.isSprinting = false;
      out.attackLight = false;
      out.attackHeavy = false;
      out.dodge = false;
      out.switchStance = false;
      out.specialAbility = false;
      out.devourSkill = false;
      out.wrathUltimate = false;
      out.manifestWeapon = false;
      out.convergenceUltimate = false;
      out.equipWeaponSlot = null;
      out.toggleArsenal = false;
      out.toggleLockOn = false;
      out.unstuck = false;
    }

    // FREE, ADDITIVE_BIAS, and SOFT_FOCUS pass gameplay inputs untouched
    // so player dodge, parry, heavy slam, and look remain 100% responsive.
    return { input: out, storySkipTriggered };
  }
}
