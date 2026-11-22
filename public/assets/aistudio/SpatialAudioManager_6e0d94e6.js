
import * as THREE from "three";

export const SPATIAL_AUDIO_PROFILES = {
  hollowKing: {
    footsteps: {
      path: "/audio/bosses/hollow_king/footsteps.ogg",
      volume: 0.8,
      refDistance: 5,
      maxDistance: 45,
      rolloff: 1.4
    },
    sword: {
      path: "/audio/bosses/hollow_king/sword_swing.ogg",
      volume: 0.9,
      refDistance: 4,
      maxDistance: 35,
      rolloff: 1.2
    }
  },

  abaddon: {
    footsteps: {
      path: "/audio/bosses/abaddon/footsteps.ogg",
      volume: 1,
      refDistance: 7,
      maxDistance: 55,
      rolloff: 1.3
    },
    tentacles: {
      path: "/audio/bosses/abaddon/tentacle_movement.ogg",
      volume: 0.85,
      refDistance: 5,
      maxDistance: 35,
      rolloff: 1.5
    },
    roar: {
      path: "/audio/bosses/abaddon/roar.ogg",
      volume: 1,
      refDistance: 10,
      maxDistance: 70,
      rolloff: 1
    }
  },

  gildedTyrant: {
    footsteps: {
      path: "/audio/bosses/gilded_tyrant/armored_steps.ogg",
      volume: 0.95,
      refDistance: 6,
      maxDistance: 55,
      rolloff: 1.3
    },
    armor: {
      path: "/audio/bosses/gilded_tyrant/armor_movement.ogg",
      volume: 0.65,
      refDistance: 4,
      maxDistance: 30,
      rolloff: 1.5
    },
    hammer: {
      path: "/audio/bosses/gilded_tyrant/weapon_impact.ogg",
      volume: 1,
      refDistance: 7,
      maxDistance: 55,
      rolloff: 1.1
    }
  },

  redCalamity: {
    footsteps: {
      path: "/audio/bosses/red_calamity/footsteps.ogg",
      volume: 0.9,
      refDistance: 6,
      maxDistance: 50,
      rolloff: 1.3
    },
    fire: {
      path: "/audio/bosses/red_calamity/fire_burst.ogg",
      volume: 0.85,
      refDistance: 7,
      maxDistance: 50,
      rolloff: 1.2
    }
  },

  saintOfAsh: {
    footsteps: {
      path: "/audio/bosses/saint_of_ash/footsteps.ogg",
      volume: 0.8,
      refDistance: 5,
      maxDistance: 40,
      rolloff: 1.4
    },
    bells: {
      path: "/audio/bosses/saint_of_ash/ritual_bells.ogg",
      volume: 0.9,
      refDistance: 8,
      maxDistance: 65,
      rolloff: 1
    }
  },

  butcherOfRuin: {
    footsteps: {
      path: "/audio/bosses/butcher_of_ruin/footsteps.ogg",
      volume: 1,
      refDistance: 7,
      maxDistance: 55,
      rolloff: 1.3
    },
    weapon: {
      path: "/audio/bosses/butcher_of_ruin/harvester_swing.ogg",
      volume: 1,
      refDistance: 5,
      maxDistance: 45,
      rolloff: 1.2
    }
  },

  whiteEyedGod: {
    presence: {
      path: "/audio/bosses/white_eyed_god/presence.ogg",
      volume: 0.8,
      refDistance: 12,
      maxDistance: 100,
      rolloff: 0.8
    },
    distortion: {
      path: "/audio/bosses/white_eyed_god/reality_distortion.ogg",
      volume: 0.9,
      refDistance: 10,
      maxDistance: 85,
      rolloff: 0.9
    }
  }
};

export class SpatialAudioManager {
  constructor(listener, options = {}) {
    if (!listener) {
      throw new Error(
        "SpatialAudioManager requires the existing THREE.AudioListener."
      );
    }

    this.listener = listener;
    this.loader = new THREE.AudioLoader();

    this.maxVoices = options.maxVoices ?? 32;
    this.masterVolume = options.masterVolume ?? 1;

    this.buffers = new Map();
    this.activeSounds = new Map();
    this.soundPool = new Map();

    this.disposed = false;
  }

  async loadBuffer(path) {
    if (this.buffers.has(path)) {
      return this.buffers.get(path);
    }

    const promise = this.loader.loadAsync(path);
    this.buffers.set(path, promise);

    try {
      const buffer = await promise;
      this.buffers.set(path, buffer);
      return buffer;
    } catch (error) {
      this.buffers.delete(path);
      console.warn("[Spatial Audio] Failed to load:", path, error);
      return null;
    }
  }

  async playAt(object, profile, options = {}) {
    if (this.disposed || !object || !profile?.path) return null;

    if (this.listener.context.state !== "running") {
      return null;
    }

    const buffer = await this.loadBuffer(profile.path);

    if (!buffer || this.disposed || !object.parent) return null;

    const maxVoices = this.maxVoices;

    if (this.activeSounds.size >= maxVoices) {
      const oldestKey = this.activeSounds.keys().next().value;
      const oldest = this.activeSounds.get(oldestKey);

      if (oldest) {
        oldest.audio.stop();
        oldest.audio.disconnect();
        this.activeSounds.delete(oldestKey);
      }
    }

    const audio = new THREE.PositionalAudio(this.listener);

    audio.setBuffer(buffer);
    audio.setRefDistance(profile.refDistance ?? 5);
    audio.setMaxDistance(profile.maxDistance ?? 50);
    audio.setRolloffFactor(profile.rolloff ?? 1);
    audio.setDistanceModel("exponential");
    audio.setVolume(
      (profile.volume ?? 1) *
      this.masterVolume *
      (options.volumeMultiplier ?? 1)
    );

    if (options.loop) {
      audio.setLoop(true);
    }

    if (options.cone) {
      audio.setDirectionalCone(
        options.cone.innerAngle ?? 60,
        options.cone.outerAngle ?? 180,
        options.cone.outerGain ?? 0.2
      );
    }

    object.add(audio);

    const id = THREE.MathUtils.generateUUID();

    this.activeSounds.set(id, {
      id,
      audio,
      object,
      path: profile.path,
      loop: Boolean(options.loop)
    });

    try {
      audio.play();
    } catch (error) {
      object.remove(audio);
      audio.disconnect();
      this.activeSounds.delete(id);
      console.warn("[Spatial Audio] Playback failed:", error);
      return null;
    }

    if (!options.loop) {
      audio.source?.addEventListener("ended", () => {
        this.removeSound(id);
      });
    }

    return id;
  }

  removeSound(id) {
    const entry = this.activeSounds.get(id);
    if (!entry) return;

    if (entry.audio.isPlaying) {
      entry.audio.stop();
    }

    entry.object.remove(entry.audio);
    entry.audio.disconnect();

    this.activeSounds.delete(id);
  }

  stopSound(id) {
    const entry = this.activeSounds.get(id);
    if (!entry) return;

    this.removeSound(id);
  }

  stopAttachedTo(object) {
    for (const [id, entry] of this.activeSounds) {
      if (entry.object === object) {
        this.removeSound(id);
      }
    }
  }

  stopAll() {
    for (const id of [...this.activeSounds.keys()]) {
      this.removeSound(id);
    }
  }

  setMasterVolume(volume) {
    this.masterVolume = THREE.MathUtils.clamp(volume, 0, 1);

    for (const entry of this.activeSounds.values()) {
      entry.audio.setVolume(
        this.masterVolume *
        (entry.audio.userData.baseVolume ?? 1)
      );
    }
  }

  dispose() {
    if (this.disposed) return;

    this.stopAll();
    this.buffers.clear();
    this.soundPool.clear();
    this.disposed = true;

    // The shared listener belongs to the main audio system.
    // Never detach or dispose it here.
  }
}
