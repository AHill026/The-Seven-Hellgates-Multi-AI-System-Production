import {
  AzraelActionId,
  AzraelAnimationEvent,
  AzraelAnimationEventListener,
  AzraelAnimationEventMarker,
} from './types';

export const DEFAULT_PLACEHOLDER_ANIMATION_EVENTS: Partial<
  Record<AzraelActionId, AzraelAnimationEventMarker[]>
> = {
  WALK: [
    { normalizedTime: 0.05, type: 'FOOTSTEP', tag: 'footstep_left_placeholder' },
    { normalizedTime: 0.55, type: 'FOOTSTEP', tag: 'footstep_right_placeholder' },
  ],
  RUN: [
    { normalizedTime: 0.08, type: 'FOOTSTEP', tag: 'sprint_footstep_left_placeholder' },
    { normalizedTime: 0.58, type: 'FOOTSTEP', tag: 'sprint_footstep_right_placeholder' },
  ],
  LIGHT_ATTACK: [
    { normalizedTime: 0.16, type: 'WEAPON_SWING_VFX', tag: 'light_slash_trail_placeholder' },
    { normalizedTime: 0.24, type: 'ATTACK_IMPACT_WINDOW_START', tag: 'light_window_open_placeholder' },
    { normalizedTime: 0.36, type: 'SWORD_IMPACT_SFX', tag: 'light_cleave_sfx_placeholder' },
    { normalizedTime: 0.52, type: 'ATTACK_IMPACT_WINDOW_END', tag: 'light_window_close_placeholder' },
  ],
  HEAVY_ATTACK: [
    { normalizedTime: 0.44, type: 'WEAPON_SWING_VFX', tag: 'heavy_overhead_vfx_placeholder' },
    { normalizedTime: 0.50, type: 'ATTACK_IMPACT_WINDOW_START', tag: 'heavy_window_open_placeholder' },
    { normalizedTime: 0.62, type: 'SWORD_IMPACT_SFX', tag: 'heavy_impact_sfx_placeholder' },
    { normalizedTime: 0.78, type: 'ATTACK_IMPACT_WINDOW_END', tag: 'heavy_window_close_placeholder' },
  ],
  PARRY: [
    { normalizedTime: 0.12, type: 'ATTACK_IMPACT_WINDOW_START', tag: 'parry_deflect_start_placeholder' },
    { normalizedTime: 0.28, type: 'SWORD_IMPACT_SFX', tag: 'parry_clang_sfx_placeholder' },
    { normalizedTime: 0.48, type: 'ATTACK_IMPACT_WINDOW_END', tag: 'parry_deflect_end_placeholder' },
  ],
  AWAKEN: [
    { normalizedTime: 0.40, type: 'TRANSFORMATION_MILESTONE', tag: 'chest_rune_surge_placeholder' },
    { normalizedTime: 0.78, type: 'TRANSFORMATION_MILESTONE', tag: 'aura_ignition_placeholder' },
  ],
  FINISHER: [
    { normalizedTime: 0.18, type: 'FINISHER_TRANSITION', tag: 'finisher_windup_placeholder' },
    { normalizedTime: 0.30, type: 'WEAPON_SWING_VFX', tag: 'finisher_lunge_vfx_placeholder' },
    { normalizedTime: 0.34, type: 'ATTACK_IMPACT_WINDOW_START', tag: 'finisher_window_open_placeholder' },
    { normalizedTime: 0.46, type: 'SWORD_IMPACT_SFX', tag: 'finisher_strike_sfx_placeholder' },
    { normalizedTime: 0.64, type: 'ATTACK_IMPACT_WINDOW_END', tag: 'finisher_window_close_placeholder' },
  ],
};

export class AzraelAnimationEventDispatcher {
  private markerRegistry = new Map<AzraelActionId, AzraelAnimationEventMarker[]>();
  private listeners = new Set<AzraelAnimationEventListener>();
  // Pre-allocated mutable dispatch object to eliminate per-frame heap churn
  private readonly eventScratch: AzraelAnimationEvent = {
    type: 'FOOTSTEP',
    action: 'IDLE',
    clipName: '',
    normalizedTime: 0,
    clipTime: 0,
    tag: undefined,
  };

  constructor(
    initialMarkers: Partial<Record<AzraelActionId, AzraelAnimationEventMarker[]>> = DEFAULT_PLACEHOLDER_ANIMATION_EVENTS
  ) {
    (Object.keys(initialMarkers) as AzraelActionId[]).forEach((action) => {
      const list = initialMarkers[action];
      if (list && list.length > 0) {
        this.registerMarkers(action, list);
      }
    });
  }

  public registerMarkers(
    action: AzraelActionId,
    markers: AzraelAnimationEventMarker[]
  ): void {
    const sorted = [...markers].sort((a, b) => a.normalizedTime - b.normalizedTime);
    this.markerRegistry.set(action, sorted);
  }

  public subscribe(listener: AzraelAnimationEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public evaluateTransition(
    action: AzraelActionId,
    clipName: string,
    prevNorm: number,
    currNorm: number,
    clipDuration: number,
    isLooping: boolean,
    justStarted: boolean
  ): void {
    if (this.listeners.size === 0) return;
    const markers = this.markerRegistry.get(action);
    if (!markers || markers.length === 0) return;

    const wrappedLoop = isLooping && !justStarted && currNorm < prevNorm - 0.0001;

    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      const t = m.normalizedTime;
      let fired = false;

      if (justStarted) {
        fired = t >= 0 && t <= currNorm;
      } else if (wrappedLoop) {
        fired = t > prevNorm || t <= currNorm;
      } else {
        fired = t > prevNorm && t <= currNorm;
      }

      if (fired) {
        this.eventScratch.type = m.type;
        this.eventScratch.action = action;
        this.eventScratch.clipName = clipName;
        this.eventScratch.normalizedTime = t;
        this.eventScratch.clipTime = t * clipDuration;
        this.eventScratch.tag = m.tag;

        this.listeners.forEach((listener) => {
          listener(this.eventScratch);
        });
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
