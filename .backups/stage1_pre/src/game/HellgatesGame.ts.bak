/**
 * The Seven Hellgates - Main 3D Game Engine Orchestrator
 */

import * as THREE from 'three';
import { PlayerData, CombatStance, RealmDefinition, EnemyType, WeaponId, WeaponUpgradeTrack, PassiveSealBuffSummary } from './types';
import { loadPlayerData, resetPlayerData, savePlayerData, createDefaultUpgradeLevels, computePassiveSealBuffs } from './storage';
import { AzraelModel } from './entities/AzraelModel';
import { EnemyInstance } from './entities/EnemyModels';
import { BossInstance, WhiteEyedGodEncounter } from './entities/BossModels';
import { HollowKingBoss } from './entities/HollowKingBoss';
import { GluttonySovereignBoss } from './entities/GluttonySovereignBoss';
import {
  SovereignBossController,
  PendingSovereignHazard,
  createSovereignBossForRealm,
} from './entities/SovereignBossFramework';
import { GildedWardenController } from './entities/gilded-warden/GildedWardenController';
import { RealmWorld, REALM_DEFINITIONS } from './worlds/RealmBuilder';
import { LimboEnvironment } from './worlds/environments/LimboEnvironment';
import { LimboZoneInfo } from './worlds/environments/limbo/LimboTerrain';
import {
  OpenWorldZoneInfo,
  isOpenWorldExploreRuntime,
} from './worlds/environments/openworld/OpenWorldRealmTypes';
import { RealmLandmarkCoords } from './worlds/environments/types';
import { ParticleSystem } from './vfx/ParticleSystem';
import {
  UE5PostProcessingPipeline,
  detectSoftwareWebGL,
  getUE5RealmProfile,
} from './vfx/UE5PostProcessing';
import {
  WeatherSystem,
  WeatherState,
  WEATHER_DESCRIPTORS,
} from './vfx/WeatherSystem';
import { BossEntranceDirector, BossEntranceState } from './vfx/BossEntranceDirector';
import { CameraController } from './core/CameraController';
import { InputManager } from './core/InputManager';
import { CombatSystem } from './combat/CombatSystem';
import { soundEngine } from './audio/SoundEngine';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MemoryFragment } from './entities/MemoryFragment';
import { HealthPickup } from './entities/HealthPickup';
import { FloorSpikeTrap, BurningBrazierHazard } from './entities/EnvironmentalHazards';
import { RealmEcosystemManager } from './ecosystem/core/RealmEcosystemManager';
import {
  AbaddonDialogueController,
  ABADDON_REALM_INTRO_DIALOGUE,
  MAW_INTRO_CONFRONTATION,
  MAW_DEFEAT_CINEMATIC,
} from './audio/AbaddonDialogueController';
import { voiceManager } from './audio/VoiceManager';
import {
  WeaponManifestationController,
  WeaponComboManager,
  SevenfoldConvergenceController,
  WeaponResonanceController,
} from './arsenal/ArsenalControllers';
import {
  SEVENFOLD_WEAPONS,
  WEAPON_BY_ID,
  REALM_TO_WEAPON_ID,
  getWeaponUpgradeCost,
} from './arsenal/WeaponRegistry';

export type GraphicsPreset = 'ultra' | 'balanced' | 'low';

export interface RealmBattleStats {
  enemiesDefeated: number;
  peakCombo: number;
  embersEarned: number;
  elapsedSeconds: number;
  bossName: string;
}

export interface GameUIState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  wrath: number;
  maxWrath: number;
  stance: CombatStance;
  level: number;
  embers: number;
  currentRealm: RealmDefinition;
  bossHealth: number | null;
  bossMaxHealth: number | null;
  bossName: string | null;
  bossPhase: number;
  bossPhaseSubtitle?: string;
  bossDialogue?: string | null;
  isBossProvisional?: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  weatherState: WeatherState;

  isVictory: boolean;
  unlockedRealms: number[];
  loreFragment: { title: string; text: string } | null;
  isWhiteEyedGodActive: boolean;
  whiteEyedGodProgress: number; // 0 to 1
  graphicsPreset: GraphicsPreset;
  currentMemoryLog: { title: string; text: string } | null;
  currentObjective: string;
  isHealing: boolean;
  isPassivelyRegenerating: boolean;
  comboCount: number;
  comboTimerPercent: number;
  comboMultiplier: number;
  isBossStaggered: boolean;
  bossStaggerFlashActive: boolean;
  isBossExecutionReady?: boolean;
  isBossFeeding?: boolean;
  isBossVortex?: boolean;
  wardenWhisper?: string | null;
  activeDialogueSubtitle?: {
    speaker: string;
    text: string;
    speakerTitle?: string;
    accentColor?: string;
  } | null;
  hasGluttonousMonstrance?: boolean;
  devourCooldown?: number;

  // Project Sevenfold Hybrid Arsenal HUD State
  unlockedWeapons: WeaponId[];
  equippedWeaponId: WeaponId;
  manifestCooldown: number;
  convergenceCooldown: number;
  convergenceUnlocked: boolean;
  isConvergenceActive: boolean;
  activeComboBanner: { name: string; description: string; color: string } | null;
  sealResonance: { tier: number; title: string; whisper: string | null; count: number };
  bossEntrance: BossEntranceState | null;

  // Open-World Exploration HUD State
  limboZone?: LimboZoneInfo | OpenWorldZoneInfo | null;
  playerYaw?: number;
  playerCoords?: { x: number; z: number } | null;
  compassTarget?: { name: string; id: string; x: number; z: number } | null;
  activeSealBuffs?: PassiveSealBuffSummary | null;
  activeDiscoveryBanner?: {
    kind: 'zone' | 'shrine' | 'relic' | 'miniboss' | 'warning';
    title: string;
    subtitle: string;
    color: string;
  } | null;
  miniBossHealth?: number | null;
  miniBossMaxHealth?: number | null;
  miniBossName?: string | null;
  miniBossTitle?: string | null;

  battleStats: RealmBattleStats;
}

export class HellgatesGame {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private cameraCtrl: CameraController;
  private inputMgr: InputManager;
  private clock: THREE.Clock;

  // Game Systems
  public azrael: AzraelModel;
  public realmWorld: RealmWorld;
  public particles: ParticleSystem;
  public combat: CombatSystem;
  public whiteEyedGod: WhiteEyedGodEncounter;
  public ecosystemMgr: RealmEcosystemManager;

  // Project Sevenfold Hybrid Arsenal Systems
  public weaponManifestCtrl: WeaponManifestationController;
  public weaponComboMgr: WeaponComboManager;
  public convergenceCtrl: SevenfoldConvergenceController;
  public resonanceCtrl: WeaponResonanceController;
  public onToggleArsenal?: () => void;

  // Entities & Pickups
  public enemies: EnemyInstance[] = [];
  public currentBoss: BossInstance | null = null;
  private activeArenaHazards: PendingSovereignHazard[] = [];
  public healthPickups: HealthPickup[] = [];
  public spikeTraps: FloorSpikeTrap[] = [];
  public burningBraziers: BurningBrazierHazard[] = [];
  public playerData: PlayerData;
  public graphicsPreset: GraphicsPreset = 'ultra';

  // Realm Battle Statistics
  public realmEnemiesDefeated: number = 0;
  public realmPeakCombo: number = 0;
  public realmEmbersEarned: number = 0;
  public realmElapsedSeconds: number = 0;

  // Storyline & Memory Fragments
  public memoryFragments: MemoryFragment[] = [];
  public storylinePhase: 'exploration' | 'breach' | 'boss' = 'exploration';
  public currentMemoryLog: { title: string; text: string } | null = null;
  public memoryLogTimer: number = 0;
  public currentObjective: string = 'Prologue: Explore the silent ruins of Limbo';
  public collectedFragmentsCount: number = 0;
  public bossStaggerFlashTimer: number = 0;
  public abaddonDialogueCtrl: AbaddonDialogueController;
  public hasPlayedMawIntroConfrontation: boolean = false;
  public bossDirector: BossEntranceDirector;
  public isInMainMenu: boolean = true;
  private pendingBossEntrance: boolean = false;
  private realmDialogueTimers: number[] = [];

  // Open-World Exploration State
  private currentLimboZone: LimboZoneInfo | null = null;
  private currentOpenWorldZone: OpenWorldZoneInfo | null = null;
  private activeDiscoveryBanner: GameUIState['activeDiscoveryBanner'] = null;
  private discoveryBannerTimer: number = 0;
  private relicGuardToastCooldown: number = 0;
  private getGroundYAt = (x: number, z: number): number => this.realmWorld.getGroundHeightAt(x, z);

  // Lighting & Rendering
  private isSoftwareGl: boolean = false;
  private dirLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private pmremGenerator!: THREE.PMREMGenerator;

  // UE5 Postprocessing & Weather Stack
  private ue5Pipeline!: UE5PostProcessingPipeline;
  public weatherSystem: WeatherSystem;
  private realmElapsedTime: number = 0;
  private onContextLostBound?: (e: Event) => void;
  private onContextRestoredBound?: () => void;

  // Runtime flags
  private isRunning: boolean = false;
  private animFrameId: number = 0;
  private onUIUpdate: (state: GameUIState) => void;
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;
  public activeLore: { title: string; text: string } | null = null;
  public isWhiteEyedGodActive: boolean = false;
  private whiteEyedGodTimer: number = 0;

  constructor(container: HTMLElement, onUIUpdate: (state: GameUIState) => void) {
    this.container = container;
    this.onUIUpdate = onUIUpdate;
    this.clock = new THREE.Clock();

    // 1. Check Software WebGL guard
    this.isSoftwareGl = detectSoftwareWebGL();
    const isSoftwareGl = this.isSoftwareGl;

    // 2. Initialize Three.js Renderer (UE5 Tone Mapping & Color Pipeline)
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.10;
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.onContextLostBound = (e: Event) => {
      e.preventDefault();
      this.stop();
    };
    this.onContextRestoredBound = () => {
      if (this.container && this.ue5Pipeline) {
        this.ue5Pipeline.resize(
          this.container.clientWidth,
          this.container.clientHeight,
          this.renderer.getPixelRatio()
        );
      }
      this.start();
    };
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLostBound);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestoredBound);

    // 3. Scene & Physical Environment Reflection (RoomEnvironment IBL)
    this.scene = new THREE.Scene();

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    const envTexture = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;
    this.scene.environmentIntensity = isSoftwareGl ? 0.45 : 0.72;

    // 4. UE5 Three-Point Cinematic Lighting Rig
    this.dirLight = new THREE.DirectionalLight(0xf7ebd9, 1.92);
    this.dirLight.position.set(16, 28, 16);
    this.dirLight.castShadow = !isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 95;
    this.dirLight.shadow.camera.left = -32;
    this.dirLight.shadow.camera.right = 32;
    this.dirLight.shadow.camera.top = 32;
    this.dirLight.shadow.camera.bottom = -32;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.02;
    this.dirLight.shadow.radius = 3.2;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Cool specular rim light to carve out armor silhouettes
    this.rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.32);
    this.rimLight.position.set(-20, 18, -20);
    this.scene.add(this.rimLight);

    this.hemiLight = new THREE.HemisphereLight(0x26354d, 0x0a0e18, 0.64);
    this.scene.add(this.hemiLight);

    // 4. Subsystems
    this.cameraCtrl = new CameraController(60, container.clientWidth / container.clientHeight);
    this.inputMgr = new InputManager(this.renderer.domElement);
    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);
    this.bossDirector = new BossEntranceDirector();

    this.realmWorld = new RealmWorld();
    this.scene.add(this.realmWorld.group);

    this.whiteEyedGod = new WhiteEyedGodEncounter();
    this.scene.add(this.whiteEyedGod.group);

    this.ecosystemMgr = new RealmEcosystemManager();

    // 4.5. UE5 Multi-Pass Postprocessing & Seven-Realm Weather System
    this.ue5Pipeline = new UE5PostProcessingPipeline(
      this.renderer,
      this.scene,
      this.cameraCtrl.camera,
      container.clientWidth,
      container.clientHeight,
      isSoftwareGl
    );
    this.weatherSystem = new WeatherSystem();

    // 5. Load Player Data & Build Azrael
    this.playerData = loadPlayerData();
    const initialSealBuffs = computePassiveSealBuffs(this.playerData.limboExploration);
    this.combat = new CombatSystem(this.playerData.stats, initialSealBuffs);
    if (this.playerData.arsenal.unlockedWeapons.includes('last_course')) {
      this.combat.hasGluttonousMonstrance = true;
    }

    this.azrael = new AzraelModel();
    this.azrael.group.position.set(0, 0, 5);
    this.scene.add(this.azrael.group);

    // 5.1. Initialize Project Sevenfold Hybrid Arsenal Controllers
    this.weaponManifestCtrl = new WeaponManifestationController(this.scene);
    this.weaponComboMgr = new WeaponComboManager();
    this.convergenceCtrl = new SevenfoldConvergenceController(this.scene);
    this.resonanceCtrl = new WeaponResonanceController();

    this.azrael.equipWeapon(this.playerData.arsenal.equippedWeaponId);
    const resInfo = this.resonanceCtrl.evaluateProgression(this.playerData.arsenal.unlockedWeapons.length);
    this.azrael.setResonanceIntensity(resInfo.chestIntensity);

    // Dynamic Realm Surface Footstep Acoustics:
    // Ash: Limbo (1), Heresy (5)
    // Blood: Gluttony (2), Violence (6)
    // Metallic: Greed (3), Wrath (4), Sovereign (7)
    this.azrael.onFootstep = (isSprinting: boolean) => {
      const realmId = this.playerData.currentRealm;
      let surface: 'ash' | 'blood' | 'metallic' = 'ash';
      if (realmId === 1 || realmId === 5) {
        surface = 'ash';
      } else if (realmId === 2 || realmId === 6) {
        surface = 'blood';
      } else {
        surface = 'metallic';
      }
      soundEngine.playFootstep(surface, isSprinting);
    };

    // 5.5. Initialize Abaddon & Global Voice Dialogue Controllers
    this.abaddonDialogueCtrl = new AbaddonDialogueController(() => {
      this.pushUIUpdate();
    });
    voiceManager.setSubtitleListener(() => {
      this.pushUIUpdate();
    });
    EnemyInstance.onPsychoticBark = (enemy, mode) => {
      if (this.isGameOver || this.isInMainMenu || this.bossDirector.isActive) return;
      const charKey = enemy instanceof GildedWardenController ? 'gilded_warden' : enemy.type;
      voiceManager.playMiniBossBark(
        charKey,
        mode,
        enemy.group.position,
        this.azrael.group.position,
        this.cameraCtrl.yaw
      );
    };

    // 6. Build Initial Realm
    this.loadRealm(this.playerData.currentRealm);

    // Window resize handler
    window.addEventListener('resize', this.handleResize);

    this.start();
  }

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.cameraCtrl.setAspect(w / h);
    this.renderer.setSize(w, h);
    if (this.ue5Pipeline) {
      this.ue5Pipeline.resize(w, h, this.renderer.getPixelRatio());
    }
  };

  public loadRealm(realmId: number) {
    this.bossDirector.skip();
    voiceManager.stopAll();
    voiceManager.clearRealmCache(realmId);
    voiceManager.preloadRealmVoices(realmId);
    this.clearRealmDialogueTimers();
    this.playerData.currentRealm = realmId;
    savePlayerData(this.playerData);
    this.hasPlayedMawIntroConfrontation = false;
    this.pendingBossEntrance = false;

    // Reset realm battle performance statistics
    this.realmEnemiesDefeated = 0;
    this.realmPeakCombo = 0;
    this.realmEmbersEarned = 0;
    this.realmElapsedSeconds = 0;

    // Clean previous enemies, boss, pickups, hazards, and memory fragments
    this.enemies.forEach(e => {
      this.scene.remove(e.group);
    });
    this.enemies = [];

    if (this.currentBoss) {
      this.scene.remove(this.currentBoss.group);
      this.currentBoss = null;
    }
    this.activeArenaHazards = [];

    this.healthPickups.forEach(p => {
      this.scene.remove(p.group);
      p.dispose();
    });
    this.healthPickups = [];

    this.spikeTraps.forEach(t => {
      this.scene.remove(t.group);
      t.dispose();
    });
    this.spikeTraps = [];

    this.burningBraziers.forEach(b => {
      this.scene.remove(b.group);
      b.dispose();
    });
    this.burningBraziers = [];

    this.memoryFragments.forEach(f => {
      this.scene.remove(f.group);
      f.dispose();
    });
    this.memoryFragments = [];
    this.currentMemoryLog = null;
    this.memoryLogTimer = 0;

    // Build World, Apply UE5 Realm Profile & Ambient Pad
    this.isPaused = false;
    this.currentOpenWorldZone = null;
    const def = this.realmWorld.buildRealm(realmId, this.scene, this.graphicsPreset);
    const landmarks = this.realmWorld.getLandmarks();
    const profile = this.ue5Pipeline.applyRealmProfile(realmId);
    const presetEnvScale = this.graphicsPreset === 'ultra' ? 1.0 : this.graphicsPreset === 'balanced' ? 0.90 : 0.84;
    const envInt = this.isSoftwareGl ? 0.45 : profile.envIntensity * presetEnvScale;
    this.dirLight.color.setHex(profile.keyColor);
    this.dirLight.intensity = profile.keyIntensity;
    this.rimLight.color.setHex(profile.rimColor);
    this.rimLight.intensity = profile.rimIntensity;
    this.hemiLight.color.setHex(profile.hemiSky);
    this.hemiLight.groundColor.setHex(profile.hemiGround);
    this.hemiLight.intensity = profile.hemiIntensity;
    this.renderer.toneMappingExposure =
      this.graphicsPreset === 'ultra'
        ? profile.exposure
        : this.graphicsPreset === 'balanced'
        ? profile.exposure * 0.98
        : profile.exposure * 1.02;
    this.scene.environmentIntensity = envInt;
    this.weatherSystem.captureRealmBaseline(this.scene, envInt);
    soundEngine.startDarkAmbientPad(realmId);

    // Spawn Realm Environmental Hazards (Tactical choke points around boss arena)
    const arenaCx = landmarks.bossArenaCenter.x;
    const arenaCz = landmarks.bossArenaCenter.z;
    const spikeOffsets: [number, number][] = [
      [6.5, -5],
      [-6.5, -5],
      [8.0, -14],
      [-8.0, -14],
    ];
    spikeOffsets.forEach(([ox, oz]) => {
      const wx = arenaCx + ox;
      const wz = arenaCz + oz;
      const wy = this.realmWorld.getGroundHeightAt(wx, wz);
      const trap = new FloorSpikeTrap(new THREE.Vector3(wx, wy, wz));
      this.scene.add(trap.group);
      this.spikeTraps.push(trap);
    });

    const brazierOffsets: [number, number][] = [
      [0, -11],
      [13, 3],
      [-13, 3],
    ];
    brazierOffsets.forEach(([ox, oz]) => {
      const wx = arenaCx + ox;
      const wz = arenaCz + oz;
      const wy = this.realmWorld.getGroundHeightAt(wx, wz);
      const brazier = new BurningBrazierHazard(new THREE.Vector3(wx, wy, wz));
      this.scene.add(brazier.group);
      this.burningBraziers.push(brazier);
    });

    // Reset Azrael position & animation rig at realm spawn landmark
    this.azrael.reset();
    this.azrael.group.position.copy(landmarks.spawnPos);
    this.azrael.group.rotation.set(0, landmarks.spawnRotY, 0);
    this.cameraCtrl.snapTo(this.azrael.group.position, landmarks.spawnRotY);
    this.updateShadowLightFollow(this.azrael.group.position);

    const refreshedBuffs = computePassiveSealBuffs(this.playerData.limboExploration);
    this.combat.applySealBuffs(this.playerData.stats, refreshedBuffs, false);
    this.combat.health = this.combat.maxHealth;
    this.combat.stamina = this.combat.maxStamina;
    this.isGameOver = false;
    this.isVictory = false;
    this.activeDiscoveryBanner = null;
    this.discoveryBannerTimer = 0;

    // Load Living Realm Ecosystem (Wildlife, Feeding Pits, Blood-Reactive Vegetation)
    this.ecosystemMgr.loadRealmEcosystem(realmId, this.scene);

    if (realmId === 1) {
      // --- REALM 1: 320m x 320m LIMBO OPEN-WORLD EXPANSION ---
      this.storylinePhase = 'exploration';
      this.collectedFragmentsCount = 0;
      this.currentObjective = 'Journey North to the Ancient Citadel — Explore Ruins, Shrines & Crypts';

      const limboEnv = this.realmWorld.environmentManager.getActiveEnvironment();
      if (limboEnv instanceof LimboEnvironment) {
        const exp = this.playerData.limboExploration;
        limboEnv.syncCollectedProgress(
          exp?.collectedRelics || [],
          exp?.awakenedShrines || [],
          this.playerData.loreDiscovered || []
        );
        this.currentLimboZone = limboEnv.getZoneAt(landmarks.spawnPos.x, landmarks.spawnPos.z);
        if (exp && !exp.discoveredLocations.includes(this.currentLimboZone.id)) {
          exp.discoveredLocations.push(this.currentLimboZone.id);
          savePlayerData(this.playerData);
        }
      }

      if (!this.isInMainMenu) {
        const tId = window.setTimeout(() => {
          if (this.playerData.currentRealm === 1 && !this.isInMainMenu && !this.bossDirector.isActive) {
            voiceManager.playAzraelRealmEnter(1);
          }
        }, 700);
        this.realmDialogueTimers.push(tId);
      }

      // 3 Scattered 3D Memory Fragment Crystals along the Northern Pilgrimage
      const fragmentCoords: Array<{ id: string; title: string; text: string; x: number; z: number }> = [
        {
          id: 'frag_crown',
          title: 'The Shattered Crown',
          text: 'A shattered crown lies buried in the cold ash. You remember kneeling before a high altar... but not whose name was praised.',
          x: 6.5,
          z: 102,
        },
        {
          id: 'frag_sword',
          title: 'The Celestial Cold',
          text: 'The greatsword in your grasp was forged in celestial ice. It hungers for demonic blood, yet it recoils from your own soul.',
          x: -55,
          z: 66,
        },
        {
          id: 'frag_seals',
          title: 'The Seven Seals',
          text: 'Seven gates were unsealed to contain a single sovereign. Was it the demonic lords they feared... or you?',
          x: 6.0,
          z: -45,
        },
      ];

      fragmentCoords.forEach((fd) => {
        const fy = this.realmWorld.getGroundHeightAt(fd.x, fd.z) + 1.2;
        const frag = new MemoryFragment({
          id: fd.id,
          title: fd.title,
          text: fd.text,
          position: new THREE.Vector3(fd.x, fy, fd.z),
        });
        this.memoryFragments.push(frag);
        this.scene.add(frag.group);
      });

      // Spawn Roaming Demons patrolling Outer Ruins, Settlement, Bridges & Wilds
      const roamingSpawns: Array<{ type: EnemyType; x: number; z: number; patrol: number; name?: string }> = [
        { type: 'hellspawn', x: -5, z: 82, patrol: 5 },
        { type: 'hellspawn', x: 7, z: 54, patrol: 6 },
        { type: 'shade', x: -60, z: 74, patrol: 6, name: 'Hollowstead Wraith' },
        { type: 'hellspawn', x: -69, z: 62, patrol: 5 },
        { type: 'hellbrute', x: 0, z: 10, patrol: 4, name: 'Gorge Gatekeeper' },
        { type: 'hellspawn', x: 10, z: 6, patrol: 5 },
        { type: 'shade', x: -78, z: 14, patrol: 6 },
        { type: 'shade', x: 80, z: -20, patrol: 6 },
        { type: 'hellspawn', x: -84, z: -44, patrol: 5 },
        { type: 'heretic', x: 84, z: -34, patrol: 4, name: 'Crypt Heretic' },
      ];
      roamingSpawns.forEach((rs, idx) => {
        const ry = this.realmWorld.getGroundHeightAt(rs.x, rs.z);
        const pos = new THREE.Vector3(rs.x, ry, rs.z);
        const enemy = new EnemyInstance(rs.type, pos, `limbo_roam_${idx}`);
        if (rs.name) enemy.stats.name = rs.name;
        enemy.homePos = pos.clone();
        enemy.patrolRadius = rs.patrol;
        enemy.aggroRadius = 15.5;
        enemy.leashRadius = 34;
        this.enemies.push(enemy);
        this.scene.add(enemy.group);
      });

      // Spawn 3 Optional Open-World Mini-Bosses guarding Battlefield, Crypt & Cave
      const miniBossSpecs: Array<{
        id: string;
        type: EnemyType;
        name: string;
        title: string;
        x: number;
        z: number;
        scale: number;
        hp: number;
        damage: number;
        emberReward: number;
        patrol: number;
        aggro: number;
        leash: number;
      }> = [
        {
          id: 'miniboss_battlefield',
          type: 'hellbrute',
          name: 'Garrak',
          title: 'Bonebound Executioner of Broken Oath',
          x: 68,
          z: 66,
          scale: 1.38,
          hp: 620,
          damage: 38,
          emberReward: 220,
          patrol: 4.5,
          aggro: 18,
          leash: 30,
        },
        {
          id: 'miniboss_crypt',
          type: 'sovereign_knight',
          name: 'Vaelen',
          title: 'Warden of the First Kings Vault',
          x: 84,
          z: -64,
          scale: 1.34,
          hp: 700,
          damage: 42,
          emberReward: 260,
          patrol: 3.5,
          aggro: 15,
          leash: 22,
        },
        {
          id: 'miniboss_cave',
          type: 'shade',
          name: 'Mireia',
          title: 'Pale Seer of the Hollowed Mist',
          x: -115,
          z: -4,
          scale: 1.42,
          hp: 540,
          damage: 34,
          emberReward: 240,
          patrol: 4.0,
          aggro: 16,
          leash: 24,
        },
      ];

      miniBossSpecs.forEach((mb) => {
        const my = this.realmWorld.getGroundHeightAt(mb.x, mb.z);
        const pos = new THREE.Vector3(mb.x, my, mb.z);
        const enemy = new EnemyInstance(mb.type, pos, mb.id);
        enemy.group.scale.setScalar(mb.scale);
        enemy.stats.name = mb.name;
        enemy.stats.maxHealth = mb.hp;
        enemy.currentHealth = mb.hp;
        enemy.stats.damage = mb.damage;
        enemy.stats.emberReward = mb.emberReward;
        enemy.stats.attackRange *= 1.18;
        enemy.isMiniBoss = true;
        enemy.miniBossId = mb.id;
        enemy.miniBossTitle = mb.title;
        enemy.homePos = pos.clone();
        enemy.patrolRadius = mb.patrol;
        enemy.aggroRadius = mb.aggro;
        enemy.leashRadius = mb.leash;
        this.enemies.push(enemy);
        this.scene.add(enemy.group);
      });
    } else {
      const activeEnv = this.realmWorld.environmentManager.getActiveEnvironment();
      if (isOpenWorldExploreRuntime(activeEnv)) {
        // --- REALMS 2-7: 280m x 280m OPEN-WORLD EXPLORATION TO SANCTUM ---
        this.currentLimboZone = null;
        this.storylinePhase = 'exploration';
        this.collectedFragmentsCount = 0;

        const owConfig = activeEnv.getOpenWorldConfig();
        this.currentObjective = owConfig.exploreObjective;

        const exp = (this.playerData.limboExploration ||= {
          discoveredLocations: [],
          collectedRelics: [],
          awakenedShrines: [],
          defeatedMiniBosses: [],
        });
        activeEnv.syncCollectedProgress(
          exp.collectedRelics || [],
          exp.awakenedShrines || [],
          this.playerData.loreDiscovered || []
        );
        this.currentOpenWorldZone = activeEnv.getZoneAt(landmarks.spawnPos.x, landmarks.spawnPos.z);
        if (!exp.discoveredLocations.includes(this.currentOpenWorldZone.id)) {
          exp.discoveredLocations.push(this.currentOpenWorldZone.id);
          savePlayerData(this.playerData);
        }

        if (!this.isInMainMenu) {
          const tId = window.setTimeout(() => {
            if (this.playerData.currentRealm === realmId && !this.isInMainMenu && !this.bossDirector.isActive) {
              voiceManager.playAzraelRealmEnter(realmId);
            }
          }, 700);
          this.realmDialogueTimers.push(tId);
        }

        // Open-World Memory Fragments
        owConfig.memoryFragments.forEach((fd) => {
          const fy = this.realmWorld.getGroundHeightAt(fd.x, fd.z) + 1.2;
          const frag = new MemoryFragment({
            id: fd.id,
            title: fd.title,
            text: fd.text,
            position: new THREE.Vector3(fd.x, fy, fd.z),
          });
          this.memoryFragments.push(frag);
          this.scene.add(frag.group);
        });

        // Open-World Roaming Demons
        owConfig.roamingSpawns.forEach((rs, idx) => {
          const ry = this.realmWorld.getGroundHeightAt(rs.x, rs.z);
          const pos = new THREE.Vector3(rs.x, ry, rs.z);
          const enemy = new EnemyInstance(rs.type, pos, `r${realmId}_roam_${idx}`);
          if (rs.name) enemy.stats.name = rs.name;
          enemy.homePos = pos.clone();
          enemy.patrolRadius = rs.patrol;
          enemy.aggroRadius = 15.5;
          enemy.leashRadius = 34;
          this.enemies.push(enemy);
          this.scene.add(enemy.group);
        });

        // Open-World Optional Mini-Bosses
        owConfig.miniBosses.forEach((mb) => {
          const my = this.realmWorld.getGroundHeightAt(mb.x, mb.z);
          const pos = new THREE.Vector3(mb.x, my, mb.z);
          const enemy = new EnemyInstance(mb.type, pos, mb.id);
          enemy.group.scale.setScalar(mb.scale);
          enemy.stats.name = mb.name;
          enemy.stats.maxHealth = mb.hp;
          enemy.currentHealth = mb.hp;
          enemy.stats.damage = mb.damage;
          enemy.stats.emberReward = mb.emberReward;
          enemy.stats.attackRange *= 1.18;
          enemy.isMiniBoss = true;
          enemy.miniBossId = mb.id;
          enemy.miniBossTitle = mb.title;
          enemy.homePos = pos.clone();
          enemy.patrolRadius = mb.patrol;
          enemy.aggroRadius = mb.aggro;
          enemy.leashRadius = mb.leash;
          this.enemies.push(enemy);
          this.scene.add(enemy.group);
        });
      } else {
        // Fallback Arena Mode
        this.currentLimboZone = null;
        this.storylinePhase = 'boss';
        this.currentObjective = `Defeat ${def.bossName} - ${def.subtitle}`;

        const enemyConfigs: { type: EnemyType; count: number }[] = [
          { type: 'hellspawn', count: 4 },
          { type: realmId > 2 ? 'hellbrute' : 'hellspawn', count: 2 },
          { type: realmId > 4 ? 'shade' : 'hellspawn', count: 2 },
        ];

        enemyConfigs.forEach(({ type, count }) => {
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 12;
            const pos = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            const enemy = new EnemyInstance(type, pos);
            this.enemies.push(enemy);
            this.scene.add(enemy.group);
          }
        });

        if (realmId === 3) {
          const warden = new GildedWardenController(new THREE.Vector3(0, 0, -6));
          this.enemies.push(warden);
          this.scene.add(warden.group);
        }

        this.currentBoss = realmId === 1
          ? new HollowKingBoss(1)
          : realmId === 2
          ? new GluttonySovereignBoss(2)
          : createSovereignBossForRealm(realmId);
        this.currentBoss.group.position.copy(landmarks.bossSpawnPos);
        this.scene.add(this.currentBoss.group);
        soundEngine.playBossMusic(realmId);

        if (this.isInMainMenu) {
          this.pendingBossEntrance = true;
        } else {
          this.triggerBossEntranceForCurrentBoss(realmId, def);
        }
      }
    }

    try {
      this.renderer.compile(this.scene, this.cameraCtrl.camera);
    } catch {
      // Ignore compile warnings on headless/software renderers
    }

    this.pushUIUpdate();
  }

  private updateShadowLightFollow(targetPos: THREE.Vector3) {
    if (!this.dirLight) return;
    this.dirLight.position.set(targetPos.x + 16, targetPos.y + 28, targetPos.z + 16);
    this.dirLight.target.position.copy(targetPos);
    this.dirLight.target.updateMatrixWorld();
  }

  private showDiscoveryBanner(
    kind: 'zone' | 'shrine' | 'relic' | 'miniboss' | 'warning',
    title: string,
    subtitle: string,
    color: string,
    duration: number = 4.6
  ) {
    this.activeDiscoveryBanner = { kind, title, subtitle, color };
    this.discoveryBannerTimer = duration;
  }

  private awardEmbers(rawEmbers: number): number {
    if (rawEmbers <= 0) return 0;
    const scaled = Math.max(1, Math.round(rawEmbers * this.combat.sealBuffs.emberYieldMult));
    this.realmEmbersEarned += scaled;
    this.playerData.embers += scaled;
    return scaled;
  }

  private handleDefeatedEnemies(defeated: EnemyInstance[], guaranteedPickupForMiniBoss: boolean = true) {
    if (!defeated || defeated.length === 0) return;
    this.realmEnemiesDefeated += defeated.length;
    let shouldSave = false;

    for (const defEnemy of defeated) {
      if (defEnemy.isMiniBoss && defEnemy.miniBossId) {
        if (!this.playerData.limboExploration) {
          this.playerData.limboExploration = {
            discoveredLocations: [],
            collectedRelics: [],
            awakenedShrines: [],
            defeatedMiniBosses: [],
          };
        }
        if (!this.playerData.limboExploration.defeatedMiniBosses.includes(defEnemy.miniBossId)) {
          this.playerData.limboExploration.defeatedMiniBosses.push(defEnemy.miniBossId);
          shouldSave = true;
        }
        this.showDiscoveryBanner(
          'miniboss',
          `${defEnemy.stats.name} Slain`,
          defEnemy.miniBossTitle || 'Optional Mini-Boss Vanquished',
          '#f59e0b',
          5.0
        );
        soundEngine.playVictoryChime();
      }

      if ((defEnemy.isMiniBoss && guaranteedPickupForMiniBoss) || Math.random() < 0.42) {
        const pickup = new HealthPickup(defEnemy.group.position);
        this.scene.add(pickup.group);
        this.healthPickups.push(pickup);
        this.particles.spawnSparks(defEnemy.group.position, 24, defEnemy.isMiniBoss ? 0xf59e0b : 0xef4444);
      }
    }

    if (shouldSave) {
      savePlayerData(this.playerData);
    }
  }

  public setPaused(paused: boolean) {
    if (this.isPaused === paused) return;
    this.isPaused = paused;
    if (paused) {
      this.inputMgr.setVirtualMove(0, 0);
    }
    this.pushUIUpdate();
  }

  public togglePause(): boolean {
    this.setPaused(!this.isPaused);
    return this.isPaused;
  }

  public setWeather(state: WeatherState) {
    this.weatherSystem.setState(state);
    const desc = WEATHER_DESCRIPTORS[state];
    if (!this.isInMainMenu) {
      this.showDiscoveryBanner('zone', desc.label, desc.description, desc.accentHex, 2.6);
    }
    this.pushUIUpdate();
  }

  public cycleWeather(): WeatherState {
    const next = this.weatherSystem.cycleState();
    this.setWeather(next);
    return next;
  }

  public onEnterGameplay() {
    this.isInMainMenu = false;
    this.isPaused = false;
    if (this.pendingBossEntrance && this.currentBoss) {
      this.pendingBossEntrance = false;
      const realmId = this.playerData.currentRealm;
      const def = REALM_DEFINITIONS.find(r => r.id === realmId) || REALM_DEFINITIONS[0];
      this.triggerBossEntranceForCurrentBoss(realmId, def);
      this.pushUIUpdate();
    } else if (!this.currentBoss) {
      const realmId = this.playerData.currentRealm;
      const tId = window.setTimeout(() => {
        if (this.playerData.currentRealm === realmId && !this.isInMainMenu && !this.bossDirector.isActive) {
          voiceManager.playAzraelRealmEnter(realmId);
        }
      }, 650);
      this.realmDialogueTimers.push(tId);
    }
  }

  public skipBossEntrance() {
    if (this.bossDirector.isActive) {
      this.bossDirector.skip();
      this.pushUIUpdate();
    }
  }

  private clearRealmDialogueTimers() {
    this.realmDialogueTimers.forEach((id) => window.clearTimeout(id));
    this.realmDialogueTimers = [];
  }

  private triggerBossEntranceForCurrentBoss(realmId: number, def: RealmDefinition) {
    if (!this.currentBoss) return;
    const landmarks = this.realmWorld.getLandmarks();
    const standPos = landmarks.isOpenWorld
      ? new THREE.Vector3(landmarks.bossArenaCenter.x, landmarks.bossArenaCenter.y, landmarks.bossSpawnPos.z + 22)
      : landmarks.spawnPos.clone();

    // Reset Azrael cleanly facing the arriving boss
    this.azrael.reset();
    this.azrael.group.position.copy(standPos);
    this.azrael.group.rotation.set(0, Math.PI, 0);
    this.updateShadowLightFollow(this.azrael.group.position);

    soundEngine.playBossSpawnHorn();
    this.ue5Pipeline?.pulseChromaticAberration(0.0028);
    this.bossDirector.startEntrance(
      this.currentBoss,
      def,
      this.azrael.group.position,
      this.cameraCtrl,
      this.particles,
      this.dirLight,
      this.rimLight,
      () => {
        this.cameraCtrl.snapTo(this.azrael.group.position, Math.PI);
        // Trigger Realm 2 Abaddon narration cleanly once the Maw entrance finishes or skips
        if (realmId === 2 && this.playerData.currentRealm === 2 && !this.isGameOver) {
          let introDelay = 0.5;
          ABADDON_REALM_INTRO_DIALOGUE.forEach((line) => {
            const tId = window.setTimeout(() => {
              if (this.playerData.currentRealm === 2 && !this.isGameOver && !this.bossDirector.isActive) {
                this.abaddonDialogueCtrl.playDialogue(line);
              }
            }, introDelay * 1000);
            this.realmDialogueTimers.push(tId);
            introDelay += line.duration + 0.6;
          });
        } else if (realmId >= 3 && this.playerData.currentRealm === realmId && !this.isGameOver) {
          const tId = window.setTimeout(() => {
            if (this.playerData.currentRealm === realmId && !this.isGameOver && !this.bossDirector.isActive) {
              voiceManager.playAzraelRealmEnter(realmId);
            }
          }, 800);
          this.realmDialogueTimers.push(tId);
        }
        this.pushUIUpdate();
      }
    );
  }

  public triggerDemonicBreach() {
    if (this.storylinePhase !== 'exploration') return;
    this.storylinePhase = 'breach';
    const landmarks = this.realmWorld.getLandmarks();
    const cx = landmarks.breachCenter.x;
    const cz = landmarks.breachCenter.z;
    const activeEnv = this.realmWorld.environmentManager.getActiveEnvironment();

    this.cameraCtrl.addScreenShake(0.85);
    this.ue5Pipeline?.pulseChromaticAberration(0.003);
    soundEngine.playBossSpawnHorn();

    if (isOpenWorldExploreRuntime(activeEnv)) {
      const owConfig = activeEnv.getOpenWorldConfig();
      this.currentObjective = owConfig.breachObjective;
      this.showDiscoveryBanner(
        'warning',
        owConfig.breachTitle,
        owConfig.breachSubtitle,
        owConfig.palette.bannerColorCss,
        4.5
      );
      owConfig.breachWave.forEach((b, idx) => {
        const wx = cx + b.offsetX;
        const wz = cz + b.offsetZ;
        const wy = this.realmWorld.getGroundHeightAt(wx, wz);
        const pos = new THREE.Vector3(wx, wy, wz);
        const enemy = b.isGildedWarden
          ? new GildedWardenController(pos)
          : new EnemyInstance(b.type, pos, `breach_${idx}`);
        if (b.name) enemy.stats.name = b.name;
        enemy.homePos = landmarks.breachCenter.clone();
        enemy.patrolRadius = 12;
        enemy.aggroRadius = 38;
        enemy.leashRadius = 46;
        this.enemies.push(enemy);
        this.scene.add(enemy.group);
        this.particles.spawnGroundShockwave(pos, 3.6, owConfig.palette.accentHex);
      });
    } else {
      this.currentObjective = landmarks.isOpenWorld
        ? 'Ancient Citadel Courtyard: Defeat the Demonic Breach Wave'
        : 'Defend against the Demonic Breach';

      if (landmarks.isOpenWorld) {
        this.showDiscoveryBanner(
          'warning',
          'Citadel Seal Shattered',
          'Defeat the Hollow Guard to summon the Sovereign',
          '#38bdf8',
          4.5
        );
      }

      // Spawn Citadel Breach wave centered in Courtyard
      const offsets: [number, number][] = [
        [8, 6],
        [-8, 6],
        [0, -10],
        [5, 14],
      ];

      offsets.forEach(([ox, oz], idx) => {
        const wx = cx + ox;
        const wz = cz + oz;
        const wy = this.realmWorld.getGroundHeightAt(wx, wz);
        const pos = new THREE.Vector3(wx, wy, wz);
        const type: EnemyType = idx === 2 ? 'hellbrute' : 'hellspawn';
        const enemy = new EnemyInstance(type, pos, `breach_${idx}`);
        enemy.homePos = landmarks.breachCenter.clone();
        enemy.patrolRadius = 12;
        enemy.aggroRadius = 38;
        enemy.leashRadius = 45;
        this.enemies.push(enemy);
        this.scene.add(enemy.group);
        this.particles.spawnGroundShockwave(pos, 3.5, 0x38bdf8);
      });
    }

    this.pushUIUpdate();
  }

  public triggerBossArrival() {
    if (this.currentBoss) return;
    const realmId = this.playerData.currentRealm;
    const def = REALM_DEFINITIONS.find(r => r.id === realmId) || REALM_DEFINITIONS[0];
    this.storylinePhase = 'boss';
    this.currentObjective = `Defeat ${def.bossName} — ${def.bossTitle}`;

    soundEngine.playBossMusic(realmId);

    const landmarks = this.realmWorld.getLandmarks();
    const boss =
      realmId === 1
        ? new HollowKingBoss(1)
        : realmId === 2
        ? new GluttonySovereignBoss(2)
        : createSovereignBossForRealm(realmId);
    if (boss instanceof HollowKingBoss) {
      boss.groundYResolver = this.getGroundYAt;
    } else if (boss instanceof SovereignBossController) {
      boss.arenaCenter.copy(landmarks.bossArenaCenter);
      boss.arenaRadius = landmarks.arenaRadius || 26;
      boss.groundYResolver = this.getGroundYAt;
    }
    boss.group.position.copy(landmarks.bossSpawnPos);
    this.currentBoss = boss;
    this.scene.add(this.currentBoss.group);

    this.triggerBossEntranceForCurrentBoss(realmId, def);
    this.pushUIUpdate();
  }

  public switchStance() {
    let next: CombatStance = 'reaper';
    if (this.azrael.currentStance === 'reaper') next = 'executioner';
    else if (this.azrael.currentStance === 'executioner') next = 'reaper';
    this.azrael.setStance(next);
    this.pushUIUpdate();
  }

  public activateWrath() {
    const res = this.combat.activateWrath(
      this.azrael,
      this.particles,
      this.enemies,
      this.currentBoss,
      this.playerData.stats
    );
    if (res.activated) {
      this.cameraCtrl.addScreenShake(0.95);
      this.ue5Pipeline?.pulseChromaticAberration(0.0045);
      voiceManager.playAzraelWrathBark();
      if (res.embersGained > 0) {
        this.awardEmbers(res.embersGained);
        savePlayerData(this.playerData);
      }
      if (res.bossStaggered) {
        this.bossStaggerFlashTimer = 0.85;
        this.cameraCtrl.addScreenShake(1.2);
        this.ue5Pipeline?.pulseChromaticAberration(0.005);
      }
    }
    this.pushUIUpdate();
  }

  public equipWeapon(weaponId: WeaponId): boolean {
    if (!this.playerData.arsenal.unlockedWeapons.includes(weaponId)) return false;
    this.playerData.arsenal.equippedWeaponId = weaponId;
    this.azrael.equipWeapon(weaponId);
    const def = WEAPON_BY_ID[weaponId];
    soundEngine.playWeaponEquip(def.slotIndex);
    this.particles.spawnSparks(this.azrael.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 14, def.primaryColorHex);
    this.resonanceCtrl.triggerEquipResonanceHint(this.playerData.arsenal.unlockedWeapons.length);
    savePlayerData(this.playerData);
    this.pushUIUpdate();
    return true;
  }

  public equipWeaponBySlot(slotIndex: number): boolean {
    const def = SEVENFOLD_WEAPONS.find((w) => w.slotIndex === slotIndex);
    if (!def) return false;
    return this.equipWeapon(def.id);
  }

  public upgradeWeapon(weaponId: WeaponId, track: WeaponUpgradeTrack): boolean {
    if (!this.playerData.arsenal.unlockedWeapons.includes(weaponId)) return false;
    const upgrades = this.playerData.arsenal.weaponUpgrades[weaponId] || createDefaultUpgradeLevels();
    const curLvl = upgrades[track] || 0;
    if (curLvl >= 5) return false;
    const cost = getWeaponUpgradeCost(curLvl);
    if (this.playerData.embers < cost) return false;

    this.playerData.embers -= cost;
    upgrades[track] = curLvl + 1;
    this.playerData.arsenal.weaponUpgrades[weaponId] = upgrades;
    savePlayerData(this.playerData);
    soundEngine.playVictoryChime();
    this.azrael.triggerChestRuneBurst(0.9);
    this.pushUIUpdate();
    return true;
  }

  public unlockWeapon(weaponId: WeaponId): void {
    if (!this.playerData.arsenal.unlockedWeapons.includes(weaponId)) {
      this.playerData.arsenal.unlockedWeapons.push(weaponId);
      if (weaponId === 'last_course') {
        this.combat.hasGluttonousMonstrance = true;
      }
      const resInfo = this.resonanceCtrl.evaluateProgression(this.playerData.arsenal.unlockedWeapons.length);
      this.azrael.setResonanceIntensity(resInfo.chestIntensity);
      this.azrael.triggerChestRuneBurst(1.6);
      savePlayerData(this.playerData);
      this.pushUIUpdate();
    }
  }

  public triggerManifestation(preferredWeaponId?: WeaponId): boolean {
    if (this.azrael.isDead) return false;
    const res = this.weaponManifestCtrl.triggerManifestation(
      this.playerData,
      this.azrael.group.position,
      this.azrael.getForwardVector(),
      this.enemies,
      this.currentBoss,
      this.combat,
      this.weaponComboMgr,
      this.particles,
      preferredWeaponId
    );
    if (!res.triggered) return false;
    this.cameraCtrl.addScreenShake(res.synergyTriggered ? 0.95 : 0.65);
    this.ue5Pipeline?.pulseChromaticAberration(res.synergyTriggered ? 0.004 : 0.0025);
    voiceManager.playAzraelSpecialAttackLine();
    if (res.embersGained > 0) {
      this.awardEmbers(res.embersGained);
      savePlayerData(this.playerData);
    }
    if (res.bossStaggered) {
      this.bossStaggerFlashTimer = 0.85;
      this.cameraCtrl.addScreenShake(1.2);
    }
    this.pushUIUpdate();
    return true;
  }

  public triggerConvergence(): boolean {
    if (this.azrael.isDead) return false;
    const started = this.convergenceCtrl.trigger(
      this.playerData,
      this.azrael.group.position,
      this.azrael.getForwardVector(),
      this.particles
    );
    if (started) {
      this.azrael.triggerChestRuneBurst(1.8);
      this.cameraCtrl.addScreenShake(1.1);
      this.ue5Pipeline?.pulseChromaticAberration(0.0055);
      voiceManager.playAzraelSpecialAttackLine();
      this.pushUIUpdate();
    }
    return started;
  }

  public upgradeStat(stat: keyof typeof this.playerData.stats) {
    const cost = 50 + this.playerData.level * 25;
    if (this.playerData.embers >= cost) {
      this.playerData.embers -= cost;
      this.playerData.level += 1;
      this.playerData.stats[stat] += 1;
      const isVitality = stat === 'vitality';
      this.combat.recalculateStats(this.playerData.stats, isVitality);
      if (isVitality) {
        this.particles.spawnSparks(this.azrael.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 32, 0x10b981);
        soundEngine.playHealthPickup();
      }
      savePlayerData(this.playerData);
      soundEngine.playVictoryChime();
      this.pushUIUpdate();
    }
  }

  public setGraphicsPreset(preset: GraphicsPreset) {
    this.graphicsPreset = preset;
    const profile = getUE5RealmProfile(this.playerData.currentRealm);
    const presetEnvScale = preset === 'ultra' ? 1.0 : preset === 'balanced' ? 0.90 : 0.84;
    const envInt = this.isSoftwareGl ? 0.45 : profile.envIntensity * presetEnvScale;

    if (preset === 'ultra') {
      this.renderer.setPixelRatio(this.isSoftwareGl ? 1.0 : Math.min(window.devicePixelRatio, 2.0));
      this.renderer.toneMappingExposure = profile.exposure;
      if (this.dirLight) {
        this.dirLight.castShadow = !this.isSoftwareGl;
        this.dirLight.shadow.mapSize.set(2048, 2048);
      }
    } else if (preset === 'balanced') {
      this.renderer.setPixelRatio(this.isSoftwareGl ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
      this.renderer.toneMappingExposure = profile.exposure * 0.98;
      if (this.dirLight) {
        this.dirLight.castShadow = !this.isSoftwareGl;
        this.dirLight.shadow.mapSize.set(1024, 1024);
      }
    } else {
      this.renderer.setPixelRatio(1.0);
      this.renderer.toneMappingExposure = profile.exposure * 1.02;
      if (this.dirLight) {
        this.dirLight.castShadow = false;
      }
    }
    this.ue5Pipeline?.applyPreset(preset);
    this.scene.environmentIntensity = envInt;
    this.weatherSystem?.setBaseEnvIntensity(envInt);
    this.realmWorld?.setGraphicsPreset(preset);
    this.pushUIUpdate();
  }

  public cycleGraphicsPreset(): GraphicsPreset {
    const order: GraphicsPreset[] = ['ultra', 'balanced', 'low'];
    const nextIdx = (order.indexOf(this.graphicsPreset) + 1) % order.length;
    this.setGraphicsPreset(order[nextIdx]);
    return this.graphicsPreset;
  }

  public triggerMobileAction(
    action: 'light' | 'heavy' | 'dodge' | 'stance' | 'ability' | 'wrath' | 'lock' | 'manifest' | 'convergence'
  ) {
    this.inputMgr.triggerAction(action);
  }

  public setVirtualMove(x: number, z: number) {
    this.inputMgr.setVirtualMove(x, z);
  }

  public setVirtualLook(dx: number, dy: number) {
    this.inputMgr.setVirtualLookDelta(dx, dy);
  }

  public restartRealm() {
    this.loadRealm(this.playerData.currentRealm);
  }

  public startNewGame() {
    const fresh = resetPlayerData();
    this.playerData = fresh;
    this.isWhiteEyedGodActive = false;
    this.whiteEyedGodTimer = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.activeLore = null;

    const freshBuffs = computePassiveSealBuffs(fresh.limboExploration);
    this.combat.resetForNewGame(fresh.stats, freshBuffs);

    this.azrael.setStance('reaper');
    this.azrael.equipWeapon(fresh.arsenal.equippedWeaponId);
    const resInfo = this.resonanceCtrl.evaluateProgression(fresh.arsenal.unlockedWeapons.length);
    this.azrael.setResonanceIntensity(resInfo.chestIntensity);

    this.loadRealm(1);
    this.pushUIUpdate();
  }

  public unstuckPlayer() {
    const landmarks = this.realmWorld.getLandmarks();
    let safePos = landmarks.spawnPos.clone();
    if (landmarks.isOpenWorld) {
      // If inside or past the Ancient Citadel gates, center safely in Courtyard
      if (this.azrael.group.position.z < -62 && Math.abs(this.azrael.group.position.x) <= 42) {
        safePos = new THREE.Vector3(0, this.realmWorld.getGroundHeightAt(0, -82), -82);
      }
    }
    this.azrael.reset();
    this.azrael.group.position.copy(safePos);
    this.azrael.group.rotation.set(0, Math.PI, 0);
    this.cameraCtrl.snapTo(this.azrael.group.position, Math.PI);
    this.combat.health = Math.max(this.combat.health, 50);
    this.isGameOver = false;
    soundEngine.playMemoryChime();
    this.particles.spawnSparks(safePos.clone().add(new THREE.Vector3(0, 1, 0)), 25, 0x38bdf8);
    this.pushUIUpdate();
  }

  public triggerDevourAction() {
    if (this.combat.hasGluttonousMonstrance) {
      const res = this.combat.executeDevourSkill(
        this.azrael.group.position,
        this.azrael.getForwardVector(),
        this.enemies,
        this.currentBoss,
        this.particles
      );
      if (res.hit) {
        this.cameraCtrl.addScreenShake(0.75);
        voiceManager.playAzraelSpecialAttackLine();
      }
      this.pushUIUpdate();
    }
  }

  private isAdvancingRealm: boolean = false;

  public advanceToNextRealm() {
    if (this.isAdvancingRealm) return;
    this.isAdvancingRealm = true;

    const nextRealm = this.playerData.currentRealm + 1;
    if (nextRealm <= 7) {
      if (!this.playerData.unlockedRealms.includes(nextRealm)) {
        this.playerData.unlockedRealms.push(nextRealm);
      }
      this.loadRealm(nextRealm);
    }

    setTimeout(() => {
      this.isAdvancingRealm = false;
    }, 800);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.tick();
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
  }

  private tick = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.tick);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 0. Escape Pause Menu freeze: allow resuming via Escape and weather preview via G without advancing world/combat
    if (this.isPaused && !this.isInMainMenu) {
      const pausedInput = this.inputMgr.update();
      if (pausedInput.pause) {
        this.setPaused(false);
      } else if (pausedInput.toggleWeather) {
        this.cycleWeather();
      }
      const pauseProfile = getUE5RealmProfile(this.playerData.currentRealm);
      const weatherFX = this.weatherSystem.update(
        delta,
        this.scene,
        pauseProfile,
        this.dirLight,
        this.hemiLight,
        this.rimLight,
        this.isWhiteEyedGodActive
      );
      if (!this.isWhiteEyedGodActive) {
        this.ue5Pipeline?.applyWeatherOffsets(
          weatherFX.bloomDelta,
          weatherFX.vignetteDelta,
          weatherFX.contrastDelta
        );
      }
      this.ue5Pipeline?.update(delta, this.realmElapsedTime, this.azrael.currentStance === 'wrath_unbound');

      if (this.ue5Pipeline?.shouldUseComposer()) {
        this.ue5Pipeline.composer.render();
      } else {
        this.renderer.render(this.scene, this.cameraCtrl.camera);
      }
      return;
    }

    this.realmElapsedTime += delta;

    // 1. Combat Hitstop check
    const isHitstopPaused = this.combat.update(delta);
    if (!isHitstopPaused) {
      this.updateGameLogic(delta);
    }

    // 2. Render Scene via UE5 Multi-Pass Composer (Ultra/Balanced) or Direct WebGL (Low / Software WebGL)
    if (this.ue5Pipeline?.shouldUseComposer()) {
      this.ue5Pipeline.composer.render();
    } else {
      this.renderer.render(this.scene, this.cameraCtrl.camera);
    }
  };

  private updateGameLogic(delta: number) {
    const input = this.inputMgr.update();

    if (input.toggleWeather && !this.isInMainMenu) {
      this.cycleWeather();
    }

    // Cinematic Boss Entrance Override: freeze hostile combat & lock player inputs while director frames boss
    if (this.bossDirector.isActive) {
      if (input.skipCutscene) {
        this.bossDirector.skip();
        this.pushUIUpdate();
        return;
      }
      this.bossDirector.update(delta);
      this.azrael.update(delta, false, false);
      this.realmWorld.update(delta, this.azrael.group.position);
      this.ecosystemMgr.update(delta, this.azrael.group.position);
      const bossWeatherFX = this.weatherSystem.update(
        delta,
        this.scene,
        getUE5RealmProfile(this.playerData.currentRealm),
        this.dirLight,
        this.hemiLight,
        this.rimLight,
        this.isWhiteEyedGodActive
      );
      this.ue5Pipeline?.applyWeatherOffsets(
        bossWeatherFX.bloomDelta,
        bossWeatherFX.vignetteDelta,
        bossWeatherFX.contrastDelta
      );
      this.ue5Pipeline?.update(delta, this.realmElapsedTime, false);
      this.particles.update(
        delta,
        this.azrael.group.position,
        this.realmWorld.currentRealmDef?.accentColor,
        this.getGroundYAt,
        this.weatherSystem.particleParams
      );
      this.abaddonDialogueCtrl.update(delta);
      voiceManager.update(delta);
      this.cameraCtrl.update(delta, this.azrael.group.position, 0, 0, 0, false, this.getGroundYAt);
      this.pushUIUpdate();
      return;
    }

    if (
      input.pause &&
      !this.isInMainMenu &&
      !this.isGameOver &&
      !this.isVictory &&
      !this.isWhiteEyedGodActive
    ) {
      this.setPaused(true);
      return;
    }

    // Track active battle stats while realm is in progress
    if (!this.isGameOver && !this.isVictory) {
      this.realmElapsedSeconds += delta;
      if (this.combat.comboCount > this.realmPeakCombo) {
        this.realmPeakCombo = this.combat.comboCount;
      }
    }

    // Stance switch key (Q)
    if (input.switchStance) {
      this.switchStance();
    }

    // Weapon equip hotkeys (1-7)
    if (input.equipWeaponSlot !== null) {
      this.equipWeaponBySlot(input.equipWeaponSlot);
    }

    // Arsenal UI Toggle (C)
    if (input.toggleArsenal) {
      this.onToggleArsenal?.();
    }

    // Supernatural Off-Hand Manifestation (V)
    if (input.manifestWeapon) {
      this.triggerManifestation();
    }

    // Sevenfold Convergence Ultimate (X)
    if (input.convergenceUltimate) {
      this.triggerConvergence();
    }

    // Wrath ultimate key (R) — Sovereign Wrath AoE
    if (input.wrathUltimate) {
      this.activateWrath();
    }

    // Update Dialogue & Voice Controllers
    this.abaddonDialogueCtrl.update(delta);
    voiceManager.update(delta);

    // Sovereign proximity confrontation trigger for The Maw of Endless Hunger (Realm II)
    if (this.playerData.currentRealm === 2 && this.currentBoss && !this.currentBoss.isDead && !this.hasPlayedMawIntroConfrontation) {
      const distToMaw = this.azrael.group.position.distanceTo(this.currentBoss.group.position);
      if (distToMaw < 16.0) {
        this.hasPlayedMawIntroConfrontation = true;
        let mawDelay = 0.5;
        MAW_INTRO_CONFRONTATION.forEach((line) => {
          const tId = window.setTimeout(() => {
            if (this.playerData.currentRealm === 2 && this.currentBoss && !this.currentBoss.isDead) {
              this.abaddonDialogueCtrl.playDialogue(line, this.currentBoss?.group.position, this.azrael.group.position);
            }
          }, mawDelay * 1000);
          this.realmDialogueTimers.push(tId);
          mawDelay += line.duration + 0.6;
        });
      }
    }

    // Sovereign Weapon Active Skill: Devour (Gluttonous Monstrance - F key)
    if (input.devourSkill && this.combat.hasGluttonousMonstrance) {
      const res = this.combat.executeDevourSkill(
        this.azrael.group.position,
        this.azrael.getForwardVector(),
        this.enemies,
        this.currentBoss,
        this.particles
      );
      if (res.hit) {
        this.cameraCtrl.addScreenShake(0.75);
        voiceManager.playAzraelSpecialAttackLine();
      }
    }

    // Special ability key (E) - Heavy Shockwave
    if (input.specialAbility) {
      const eqId = this.playerData.arsenal.equippedWeaponId;
      const res = this.combat.executeAttack(
        true,
        this.azrael,
        this.enemies,
        this.currentBoss,
        this.particles,
        this.playerData.stats,
        eqId,
        this.playerData.arsenal.weaponUpgrades[eqId]
      );
      this.weaponComboMgr.registerPhysicalAttack(eqId);
      voiceManager.playAzraelSpecialAttackLine();
      if (res.bossStaggered) {
        this.bossStaggerFlashTimer = 0.85;
        this.cameraCtrl.addScreenShake(1.2);
      }
    }

    if (this.bossStaggerFlashTimer > 0) {
      this.bossStaggerFlashTimer = Math.max(0, this.bossStaggerFlashTimer - delta);
    }

    // Instant Unstuck key (U)
    if (input.unstuck) {
      this.unstuckPlayer();
    }

    // Check Lock-On (Tab)
    if (input.toggleLockOn) {
      if (this.cameraCtrl.lockTarget) {
        this.cameraCtrl.lockTarget = null;
      } else if (this.currentBoss && !this.currentBoss.isDead) {
        this.cameraCtrl.lockTarget = this.currentBoss.group.position;
      } else {
        const nearest = this.enemies.find(e => !e.isDead);
        if (nearest) this.cameraCtrl.lockTarget = nearest.group.position;
      }
    }

    const landmarks = this.realmWorld.getLandmarks();
    const prevAzraelPos = this.azrael.group.position.clone();

    // 1. Azrael Movement & Orientation (derived directly from Camera forward/right so WASD always matches view)
    let isMoving = false;
    if (!this.azrael.isDead && !this.azrael.isAttacking && !this.azrael.isDodging) {
      const yaw = this.cameraCtrl.yaw;
      const forwardX = Math.sin(yaw);
      const forwardZ = Math.cos(yaw);
      const rightX = -Math.cos(yaw);
      const rightZ = Math.sin(yaw);
      const moveVec = new THREE.Vector3(
        forwardX * input.moveZ + rightX * input.moveX,
        0,
        forwardZ * input.moveZ + rightZ * input.moveX
      );
      if (moveVec.lengthSq() > 0.001) {
        if (moveVec.lengthSq() > 1) moveVec.normalize();
        isMoving = true;

        // Face movement direction
        const targetAngle = Math.atan2(moveVec.x, moveVec.z);
        this.azrael.group.rotation.y = THREE.MathUtils.damp(this.azrael.group.rotation.y, targetAngle, 14, delta);

        // Move player
        const speed = input.isSprinting ? 9.0 : 5.5;
        this.azrael.group.position.addScaledVector(moveVec, speed * delta);
      }
    }

    // Dynamic roll momentum when dodging
    if (this.azrael.isDodging && !this.azrael.isDead) {
      const rollDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.azrael.group.rotation.y);
      this.azrael.group.position.addScaledVector(rollDir, 8.0 * delta);
    }

    // Resolve open-world terrain/collider constraints (Limbo) or flat arena boundary (Realms 2–7)
    if (landmarks.isOpenWorld) {
      this.realmWorld.constrainMovement(prevAzraelPos, this.azrael.group.position, 0.75);
    } else {
      const dist2D = Math.hypot(this.azrael.group.position.x, this.azrael.group.position.z);
      const maxArenaRadius = landmarks.arenaRadius || 26.5;
      if (dist2D > maxArenaRadius) {
        const factor = maxArenaRadius / dist2D;
        this.azrael.group.position.x *= factor;
        this.azrael.group.position.z *= factor;
      }
      this.realmWorld.resolveCollision(this.azrael.group.position, 0.75);
      this.azrael.group.position.y = 0;
    }

    // Keep directional shadow frustum centered on Azrael across open-world traversal
    this.updateShadowLightFollow(this.azrael.group.position);

    // 2. Dodge Roll
    if (input.dodge) {
      const didDodge = this.combat.tryDodge(this.azrael);
      if (didDodge && this.currentBoss instanceof HollowKingBoss && !this.currentBoss.isDead) {
        const toBoss = new THREE.Vector3().subVectors(this.currentBoss.group.position, this.azrael.group.position);
        toBoss.y = 0;
        const playerForward = new THREE.Vector3(0, 0, 1).applyEuler(this.azrael.group.rotation);
        const dot = playerForward.dot(toBoss.normalize());
        const dodgeDir = dot < -0.3 ? 'back' : (dot > 0.3 ? 'forward' : 'left');
        this.currentBoss.registerPlayerDodge(dodgeDir);
      }
    }

    // 3. Attacks (Driven by Equipped Sevenfold Seal Weapon)
    const equippedWeaponId = this.playerData.arsenal.equippedWeaponId;
    const equippedUpgrades = this.playerData.arsenal.weaponUpgrades[equippedWeaponId];
    if (input.attackLight) {
      const res = this.combat.executeAttack(
        false,
        this.azrael,
        this.enemies,
        this.currentBoss,
        this.particles,
        this.playerData.stats,
        equippedWeaponId,
        equippedUpgrades
      );
      this.weaponComboMgr.registerPhysicalAttack(equippedWeaponId);
      if (res.embersGained > 0) {
        this.awardEmbers(res.embersGained);
        savePlayerData(this.playerData);
      }
      if (res.hitLanded) {
        if (this.combat.comboCount > this.realmPeakCombo) {
          this.realmPeakCombo = this.combat.comboCount;
        }
        this.cameraCtrl.addScreenShake(0.3 + Math.min(0.3, this.combat.comboCount * 0.02));
      }
      if (res.bossStaggered) {
        this.bossStaggerFlashTimer = 0.85;
        this.cameraCtrl.addScreenShake(1.2);
      }
      if (res.defeatedEnemies && res.defeatedEnemies.length > 0) {
        this.handleDefeatedEnemies(res.defeatedEnemies);
      }
    } else if (input.attackHeavy) {
      const res = this.combat.executeAttack(
        true,
        this.azrael,
        this.enemies,
        this.currentBoss,
        this.particles,
        this.playerData.stats,
        equippedWeaponId,
        equippedUpgrades
      );
      this.weaponComboMgr.registerPhysicalAttack(equippedWeaponId);
      if (res.embersGained > 0) {
        this.awardEmbers(res.embersGained);
        savePlayerData(this.playerData);
      }
      if (res.hitLanded) {
        if (this.combat.comboCount > this.realmPeakCombo) {
          this.realmPeakCombo = this.combat.comboCount;
        }
        this.cameraCtrl.addScreenShake(0.65 + Math.min(0.4, this.combat.comboCount * 0.03));
      }
      if (res.bossStaggered) {
        this.bossStaggerFlashTimer = 0.85;
        this.cameraCtrl.addScreenShake(1.3);
      }
      if (res.defeatedEnemies && res.defeatedEnemies.length > 0) {
        this.handleDefeatedEnemies(res.defeatedEnemies);
      }
    }

    // 4. Update Azrael Kinematics & Project Sevenfold Hybrid Arsenal Runtime
    this.azrael.update(delta, isMoving, input.isSprinting);
    this.weaponManifestCtrl.update(delta);
    this.weaponComboMgr.update(delta);
    this.resonanceCtrl.update(delta);
    const convRes = this.convergenceCtrl.update(
      delta,
      this.azrael.group.position,
      this.enemies,
      this.currentBoss,
      this.combat,
      this.particles,
      this.playerData
    );
    if (convRes.waveHit) {
      this.cameraCtrl.addScreenShake(0.95);
    }
    if (convRes.embersGained > 0) {
      this.awardEmbers(convRes.embersGained);
      savePlayerData(this.playerData);
    }

    // 4.5. Update 3D Memory Fragments & Proximity Detection (Non-blocking)
    const playerPos = this.azrael.group.position;
    for (let i = this.memoryFragments.length - 1; i >= 0; i--) {
      const frag = this.memoryFragments[i];
      const done = frag.update(delta);
      if (done) {
        this.scene.remove(frag.group);
        frag.dispose();
        this.memoryFragments.splice(i, 1);
        continue;
      }

      if (!frag.isCollected && frag.checkProximity(playerPos, 3.2)) {
        frag.collect();
        soundEngine.playMemoryChime();
        voiceManager.playAzraelMemoryReaction(frag.id);
        this.particles.spawnSparks(frag.group.position, 35, 0x38bdf8);
        this.currentMemoryLog = { title: frag.title, text: frag.text };
        this.memoryLogTimer = 7.5;
        this.collectedFragmentsCount += 1;

        if (!this.playerData.loreDiscovered.includes(frag.title)) {
          this.playerData.loreDiscovered.push(frag.title);
          savePlayerData(this.playerData);
        }

        this.currentObjective = this.collectedFragmentsCount >= 2
          ? 'Ancient Citadel Awaits North — Cross Moonstone Gorge to Confront the Hollow King'
          : `Explore Limbo & Uncover Azrael's Memories (${this.collectedFragmentsCount}/3)`;
      }
    }

    // Decay memory log & discovery banner timers
    if (this.memoryLogTimer > 0) {
      this.memoryLogTimer -= delta;
      if (this.memoryLogTimer <= 0) {
        this.currentMemoryLog = null;
      }
    }
    if (this.discoveryBannerTimer > 0) {
      this.discoveryBannerTimer -= delta;
      if (this.discoveryBannerTimer <= 0) {
        this.activeDiscoveryBanner = null;
      }
    }
    if (this.relicGuardToastCooldown > 0) {
      this.relicGuardToastCooldown = Math.max(0, this.relicGuardToastCooldown - delta);
    }

    // 4.6. Open-World Zone Discovery, Ancient Shrines, Hidden Relics, Lore Tablets & Sanctum Triggers (Realms 1–7)
    const activeEnv = this.realmWorld.environmentManager.getActiveEnvironment();
    if (this.playerData.currentRealm === 1 && activeEnv instanceof LimboEnvironment) {
      const limboEnv = activeEnv;
      const exp = (this.playerData.limboExploration ||= {
        discoveredLocations: [],
        collectedRelics: [],
        awakenedShrines: [],
        defeatedMiniBosses: [],
      });

      // A. Zone Transition & Discovery Reward
      const zone = limboEnv.getZoneAt(playerPos.x, playerPos.z);
      if (!this.currentLimboZone || this.currentLimboZone.id !== zone.id) {
        this.currentLimboZone = zone;
        const isNamedLandmark = zone.id !== 'southern_valley' && zone.id !== 'northern_wilds';
        if (isNamedLandmark && !exp.discoveredLocations.includes(zone.id)) {
          exp.discoveredLocations.push(zone.id);
          const gained = this.awardEmbers(50);
          savePlayerData(this.playerData);
          soundEngine.playMemoryChime();
          this.showDiscoveryBanner(
            'zone',
            `${zone.name} Discovered`,
            `${zone.subtitle} (+${gained} Embers)`,
            '#38bdf8',
            4.6
          );
        }
      }

      // B. Ancient Shrines (Full Health/Stamina Restore + Permanent Passive Seal Buff)
      for (const shrine of limboEnv.getShrines()) {
        if (shrine.cooldownTimer <= 0 && playerPos.distanceTo(shrine.position) < 3.4) {
          shrine.cooldownTimer = 20.0;
          this.combat.health = this.combat.maxHealth;
          this.combat.stamina = this.combat.maxStamina;
          this.combat.healIndicatorTimer = 1.4;
          soundEngine.playHealthPickup();
          this.particles.spawnSparks(shrine.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 34, 0x34d399);

          if (!exp.awakenedShrines.includes(shrine.id)) {
            exp.awakenedShrines.push(shrine.id);
            const nextBuffs = computePassiveSealBuffs(exp);
            this.combat.applySealBuffs(this.playerData.stats, nextBuffs, true);
            this.combat.health = this.combat.maxHealth;
            this.combat.stamina = this.combat.maxStamina;
            savePlayerData(this.playerData);
            soundEngine.playVictoryChime();
            this.showDiscoveryBanner(
              'shrine',
              `${shrine.buffName} Awakened`,
              `${shrine.buffDescription} · Full Vitality Restored`,
              '#34d399',
              5.2
            );
          } else {
            this.showDiscoveryBanner(
              'shrine',
              shrine.name,
              'Vitality & Stamina Restored by Ancient Light',
              '#34d399',
              3.4
            );
          }
          limboEnv.syncCollectedProgress(exp.collectedRelics, exp.awakenedShrines, this.playerData.loreDiscovered);
        }
      }

      // C. Hidden Relics (+Embers, Lore Fragment, Permanent Passive Seal Buff)
      for (const relic of limboEnv.getRelics()) {
        if (relic.collected) continue;
        if (playerPos.distanceTo(relic.position) < 2.8) {
          if (relic.requiresMiniBossId) {
            const guardianAlive = this.enemies.some(
              (e) => e.miniBossId === relic.requiresMiniBossId && !e.isDead
            );
            if (guardianAlive) {
              if (this.relicGuardToastCooldown <= 0) {
                this.relicGuardToastCooldown = 5.0;
                this.showDiscoveryBanner(
                  'warning',
                  `${relic.name} Sealed`,
                  'Defeat the Area Guardian nearby to break the lock',
                  '#f59e0b',
                  3.6
                );
              }
              continue;
            }
          }

          relic.collected = true;
          if (!exp.collectedRelics.includes(relic.id)) {
            exp.collectedRelics.push(relic.id);
          }
          if (!this.playerData.loreDiscovered.includes(relic.loreTitle)) {
            this.playerData.loreDiscovered.push(relic.loreTitle);
          }
          const gained = this.awardEmbers(relic.emberReward);
          const nextBuffs = computePassiveSealBuffs(exp);
          this.combat.applySealBuffs(this.playerData.stats, nextBuffs, true);
          savePlayerData(this.playerData);
          limboEnv.syncCollectedProgress(exp.collectedRelics, exp.awakenedShrines, this.playerData.loreDiscovered);

          soundEngine.playVictoryChime();
          this.particles.spawnSparks(relic.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 38, 0xfbbf24);
          this.currentMemoryLog = { title: relic.loreTitle, text: relic.loreText };
          this.memoryLogTimer = 7.5;
          this.showDiscoveryBanner(
            'relic',
            `Relic Acquired: ${relic.buffName}`,
            `${relic.buffDescription} (+${gained} Embers)`,
            '#fbbf24',
            5.4
          );
        }
      }

      // D. Lore Tablets (+Embers & Lore)
      for (const loreNode of limboEnv.getLoreNodes()) {
        if (loreNode.collected) continue;
        if (playerPos.distanceTo(loreNode.position) < 2.8) {
          loreNode.collected = true;
          if (!this.playerData.loreDiscovered.includes(loreNode.title)) {
            this.playerData.loreDiscovered.push(loreNode.title);
          }
          const gained = this.awardEmbers(loreNode.emberReward);
          savePlayerData(this.playerData);
          limboEnv.syncCollectedProgress(exp.collectedRelics, exp.awakenedShrines, this.playerData.loreDiscovered);
          soundEngine.playMemoryChime();
          this.particles.spawnSparks(loreNode.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 28, 0x38bdf8);
          this.currentMemoryLog = { title: loreNode.title, text: loreNode.text };
          this.memoryLogTimer = 7.0;
          this.showDiscoveryBanner(
            'zone',
            loreNode.title,
            `Ancient Inscription Deciphered (+${gained} Embers)`,
            '#67e8f9',
            4.2
          );
        }
      }

      // E. Citadel Courtyard Breach Progression Trigger
      if (this.storylinePhase === 'exploration' && playerPos.z <= -72 && Math.abs(playerPos.x) <= 36) {
        this.triggerDemonicBreach();
      }
    } else if (isOpenWorldExploreRuntime(activeEnv)) {
      const owConfig = activeEnv.getOpenWorldConfig();
      const exp = (this.playerData.limboExploration ||= {
        discoveredLocations: [],
        collectedRelics: [],
        awakenedShrines: [],
        defeatedMiniBosses: [],
      });

      // A. Zone Transition & Discovery Reward
      const zone = activeEnv.getZoneAt(playerPos.x, playerPos.z);
      if (!this.currentOpenWorldZone || this.currentOpenWorldZone.id !== zone.id) {
        this.currentOpenWorldZone = zone;
        const isGenericWilds = zone.id.endsWith('_wilds');
        if (!isGenericWilds && !exp.discoveredLocations.includes(zone.id)) {
          exp.discoveredLocations.push(zone.id);
          const gained = this.awardEmbers(55);
          savePlayerData(this.playerData);
          soundEngine.playMemoryChime();
          this.showDiscoveryBanner(
            'zone',
            `${zone.name} Discovered`,
            `${zone.subtitle} (+${gained} Embers)`,
            owConfig.palette.bannerColorCss,
            4.6
          );
        }
      }

      // B. Ancient Shrines
      for (const shrine of activeEnv.getShrines()) {
        if (shrine.cooldownTimer <= 0 && playerPos.distanceTo(shrine.position) < 3.4) {
          shrine.cooldownTimer = 20.0;
          this.combat.health = this.combat.maxHealth;
          this.combat.stamina = this.combat.maxStamina;
          this.combat.healIndicatorTimer = 1.4;
          soundEngine.playHealthPickup();
          this.particles.spawnSparks(shrine.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 34, 0x34d399);

          if (!exp.awakenedShrines.includes(shrine.id)) {
            exp.awakenedShrines.push(shrine.id);
            const nextBuffs = computePassiveSealBuffs(exp);
            this.combat.applySealBuffs(this.playerData.stats, nextBuffs, true);
            this.combat.health = this.combat.maxHealth;
            this.combat.stamina = this.combat.maxStamina;
            savePlayerData(this.playerData);
            soundEngine.playVictoryChime();
            this.showDiscoveryBanner(
              'shrine',
              `${shrine.buffName} Awakened`,
              `${shrine.buffDescription} · Full Vitality Restored`,
              '#34d399',
              5.2
            );
          } else {
            this.showDiscoveryBanner(
              'shrine',
              shrine.name,
              'Vitality & Stamina Restored by Ancient Light',
              '#34d399',
              3.4
            );
          }
          activeEnv.syncCollectedProgress(exp.collectedRelics, exp.awakenedShrines, this.playerData.loreDiscovered);
        }
      }

      // C. Hidden Relics
      for (const relic of activeEnv.getRelics()) {
        if (relic.collected) continue;
        if (playerPos.distanceTo(relic.position) < 2.8) {
          if (relic.requiresMiniBossId) {
            const guardianAlive = this.enemies.some(
              (e) => e.miniBossId === relic.requiresMiniBossId && !e.isDead
            );
            if (guardianAlive) {
              if (this.relicGuardToastCooldown <= 0) {
                this.relicGuardToastCooldown = 5.0;
                this.showDiscoveryBanner(
                  'warning',
                  `${relic.name} Sealed`,
                  'Defeat the Area Guardian nearby to break the lock',
                  '#f59e0b',
                  3.6
                );
              }
              continue;
            }
          }

          relic.collected = true;
          if (!exp.collectedRelics.includes(relic.id)) {
            exp.collectedRelics.push(relic.id);
          }
          if (!this.playerData.loreDiscovered.includes(relic.loreTitle)) {
            this.playerData.loreDiscovered.push(relic.loreTitle);
          }
          const gained = this.awardEmbers(relic.emberReward);
          const nextBuffs = computePassiveSealBuffs(exp);
          this.combat.applySealBuffs(this.playerData.stats, nextBuffs, true);
          savePlayerData(this.playerData);
          activeEnv.syncCollectedProgress(exp.collectedRelics, exp.awakenedShrines, this.playerData.loreDiscovered);

          soundEngine.playVictoryChime();
          this.particles.spawnSparks(relic.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 38, owConfig.palette.relicHex);
          this.currentMemoryLog = { title: relic.loreTitle, text: relic.loreText };
          this.memoryLogTimer = 7.5;
          this.showDiscoveryBanner(
            'relic',
            `Relic Acquired: ${relic.buffName}`,
            `${relic.buffDescription} (+${gained} Embers)`,
            '#fbbf24',
            5.4
          );
        }
      }

      // D. Lore Tablets
      for (const loreNode of activeEnv.getLoreNodes()) {
        if (loreNode.collected) continue;
        if (playerPos.distanceTo(loreNode.position) < 2.8) {
          loreNode.collected = true;
          if (!this.playerData.loreDiscovered.includes(loreNode.title)) {
            this.playerData.loreDiscovered.push(loreNode.title);
          }
          const gained = this.awardEmbers(loreNode.emberReward);
          savePlayerData(this.playerData);
          activeEnv.syncCollectedProgress(exp.collectedRelics, exp.awakenedShrines, this.playerData.loreDiscovered);
          soundEngine.playMemoryChime();
          this.particles.spawnSparks(loreNode.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 28, owConfig.palette.accentHex);
          this.currentMemoryLog = { title: loreNode.title, text: loreNode.text };
          this.memoryLogTimer = 7.0;
          this.showDiscoveryBanner(
            'zone',
            loreNode.title,
            `Ancient Inscription Deciphered (+${gained} Embers)`,
            owConfig.palette.bannerColorCss,
            4.2
          );
        }
      }

      // E. Northern Sanctum Breach Progression Trigger
      if (
        this.storylinePhase === 'exploration' &&
        playerPos.z <= landmarks.bossArenaCenter.z + 18 &&
        Math.abs(playerPos.x - landmarks.bossArenaCenter.x) <= 34
      ) {
        this.triggerDemonicBreach();
      }
    }

    // In breach phase, summon the Sovereign Boss when breach enemies inside Sanctum are defeated or player approaches Throne Dais
    if (this.storylinePhase === 'breach' && !this.currentBoss) {
      const remainingBreachEnemies = this.enemies.filter(
        (e) => !e.isDead && (e.id.startsWith('breach_') || e instanceof GildedWardenController)
      );
      const distToThrone = Math.hypot(playerPos.x - landmarks.bossSpawnPos.x, playerPos.z - landmarks.bossSpawnPos.z);
      if (remainingBreachEnemies.length === 0 || (distToThrone < 13 && playerPos.z <= landmarks.bossSpawnPos.z + 10)) {
        this.triggerBossArrival();
      }
    }

    // 5. Update Enemies & Dynamic Combat Music State
    let minEnemyDist = 999;
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        const dist = enemy.group.position.distanceTo(playerPos);
        if (dist < minEnemyDist) minEnemyDist = dist;
      }
      const prevEnemyPos = enemy.group.position.clone();
      const enemyGroundY = this.realmWorld.getGroundHeightAt(enemy.group.position.x, enemy.group.position.z);
      const result = enemy.update(delta, playerPos, enemyGroundY);

      if (landmarks.isOpenWorld && !enemy.isDead) {
        const enemyRadius = enemy.isMiniBoss ? 0.95 : enemy.type === 'hellbrute' || enemy.type === 'sovereign_knight' ? 0.9 : 0.65;
        this.realmWorld.constrainMovement(prevEnemyPos, enemy.group.position, enemyRadius);
      }

      if (result.damageDealt > 0) {
        this.applyPlayerDamage(result.damageDealt, 0.5);
      }
    }

    const hasActiveBoss = Boolean(this.currentBoss && !this.currentBoss.isDead);
    soundEngine.updateCombatState(delta, minEnemyDist, hasActiveBoss);

    // 6. Update Boss
    if (this.currentBoss) {
      const bossResult = this.currentBoss.update(delta, playerPos);
      if (bossResult.damage > 0) {
        this.applyPlayerDamage(bossResult.damage, 0.75);
      }
      if (bossResult.isShockwave && bossResult.shockwavePos) {
        const shockColor = (this.currentBoss instanceof HollowKingBoss) ? 0x38bdf8 : 0xef4444;
        this.particles.spawnGroundShockwave(bossResult.shockwavePos, 5.5, shockColor);
        this.cameraCtrl.addScreenShake(0.9);
      }

      // Hollow King Soulslike Encounter Mechanics
      if (this.currentBoss instanceof HollowKingBoss) {
        // A. Fallen Court Summons (centered on active Citadel Arena)
        if (this.currentBoss.pendingSummons) {
          this.currentBoss.pendingSummons = false;
          const summonAngles = [Math.PI * 0.4, -Math.PI * 0.4];
          const arenaCenter = landmarks.bossArenaCenter;
          summonAngles.forEach(ang => {
            const sx = arenaCenter.x + Math.sin(ang) * 9;
            const sz = arenaCenter.z + Math.cos(ang) * 9 - 4;
            const sy = this.realmWorld.getGroundHeightAt(sx, sz);
            const spawnPos = new THREE.Vector3(sx, sy, sz);
            const summon = new EnemyInstance('shade', spawnPos, 'hollow_guard');
            summon.stats.name = 'Spectral Knight of Limbo';
            summon.stats.maxHealth = 130;
            summon.currentHealth = 130;
            this.enemies.push(summon);
            this.scene.add(summon.group);
            this.particles.spawnGroundShockwave(spawnPos, 3.5, 0x38bdf8);
            this.particles.spawnSparks(spawnPos, 22, 0x67e8f9);
          });
          this.cameraCtrl.addScreenShake(0.65);
          soundEngine.playBossSpawnHorn();
        }

        // B. King's Ruin Delayed Spectral Explosions
        for (let i = this.currentBoss.pendingExplosions.length - 1; i >= 0; i--) {
          const exp = this.currentBoss.pendingExplosions[i];
          exp.timer -= delta;
          if (exp.timer <= 0 && !exp.detonated) {
            exp.detonated = true;
            this.particles.spawnGroundShockwave(exp.position, exp.radius * 1.5, 0x38bdf8);
            this.particles.spawnSparks(exp.position, 28, 0x67e8f9);
            this.cameraCtrl.addScreenShake(0.6);

            const pDist = new THREE.Vector3().subVectors(playerPos, exp.position);
            pDist.y = 0;
            if (pDist.length() <= exp.radius) {
              this.applyPlayerDamage(exp.damage, 0.6);
            }
            this.currentBoss.pendingExplosions.splice(i, 1);
          }
        }

        // C. Reactive Arena Lighting
        if (this.dirLight && this.currentBoss.arenaLightingFactor < 1.0) {
          const targetIntensity = 1.6 * this.currentBoss.arenaLightingFactor;
          this.dirLight.intensity = THREE.MathUtils.lerp(this.dirLight.intensity, targetIntensity, delta * 2.0);
        }
      }

      // Gluttony Sovereign (The Maw of Endless Hunger) Encounter Mechanics
      if (this.currentBoss instanceof GluttonySovereignBoss) {
        // A. Swarm Summons
        if (this.currentBoss.pendingSummonRequest) {
          const req = this.currentBoss.pendingSummonRequest;
          this.currentBoss.pendingSummonRequest = null;
          req.positions.forEach((spawnPos, sIdx) => {
            const enemy = new EnemyInstance('devourer', spawnPos, `mawling_${Date.now()}_${sIdx}`);
            enemy.stats.name = 'Abaddon Mawling';
            enemy.stats.maxHealth = 110;
            enemy.currentHealth = 110;
            enemy.stats.damage = 18;
            this.enemies.push(enemy);
            this.scene.add(enemy.group);
            this.particles.spawnGroundShockwave(spawnPos, 3.2, 0x84cc16);
            this.particles.spawnSparks(spawnPos, 22, 0xb91c1c);
          });
          this.cameraCtrl.addScreenShake(0.65);
          soundEngine.playBossSpawnHorn();
        }

        // B. Delayed Bile Bursts / Geysers
        for (let i = this.currentBoss.pendingBileBursts.length - 1; i >= 0; i--) {
          const bile = this.currentBoss.pendingBileBursts[i];
          bile.timer -= delta;
          if (bile.timer <= 0 && !bile.detonated) {
            bile.detonated = true;
            this.particles.spawnGroundShockwave(bile.position, bile.radius * 1.4, 0x84cc16);
            this.particles.spawnSparks(bile.position, 26, 0x22c55e);
            this.cameraCtrl.addScreenShake(0.6);

            const pDist = new THREE.Vector3().subVectors(playerPos, bile.position);
            pDist.y = 0;
            if (pDist.length() <= bile.radius) {
              this.applyPlayerDamage(bile.damage, 0.6);
            }
            this.currentBoss.pendingBileBursts.splice(i, 1);
          }
        }

        // C. Colossal Maw Vortex Suction
        if (this.currentBoss.isVortexActive && !this.azrael.isDead && !this.combat.iFramesActive) {
          const toVortex = new THREE.Vector3().subVectors(this.currentBoss.vortexCenter, this.azrael.group.position);
          toVortex.y = 0;
          const pullDist = toVortex.length();
          if (pullDist > 0.5 && pullDist < 16.0) {
            toVortex.normalize();
            this.azrael.group.position.addScaledVector(toVortex, this.currentBoss.vortexPullStrength * delta);
            this.particles.spawnGroundShockwave(this.currentBoss.vortexCenter, 2.8, 0xb91c1c);
          }
        }

        // D. Feeding Recovery Particles
        if (this.currentBoss.isFeedingRecoveryActive) {
          this.particles.spawnSparks(this.currentBoss.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 8, 0x84cc16);
        }

        // E. Reactive Arena Lighting
        if (this.dirLight && this.currentBoss.arenaLightingFactor < 1.0) {
          const targetIntensity = 1.6 * this.currentBoss.arenaLightingFactor;
          this.dirLight.intensity = THREE.MathUtils.lerp(this.dirLight.intensity, targetIntensity, delta * 2.0);
        }
      }

      // Phase II Sovereign Boss Framework Arena Hazards & Chain Pulls (Realms 3–7)
      if (this.currentBoss instanceof SovereignBossController) {
        if (this.currentBoss.pendingPullForce > 0 && !this.azrael.isDead && !this.combat.iFramesActive) {
          const pullVec = new THREE.Vector3().subVectors(this.currentBoss.group.position, playerPos).setY(0);
          if (pullVec.length() > 2.4) {
            playerPos.addScaledVector(pullVec.normalize(), this.currentBoss.pendingPullForce * delta);
          }
          this.currentBoss.pendingPullForce = Math.max(0, this.currentBoss.pendingPullForce - delta * 18);
        }
        while (this.currentBoss.pendingArenaHazards.length > 0) {
          const h = this.currentBoss.pendingArenaHazards.shift()!;
          this.particles.spawnGroundShockwave(h.position, h.radius, h.colorHex);
          this.activeArenaHazards.push(h);
        }
      }

      for (let i = this.activeArenaHazards.length - 1; i >= 0; i--) {
        const hz = this.activeArenaHazards[i];
        hz.timer -= delta;
        if (hz.timer <= 0) {
          this.particles.spawnGroundShockwave(hz.position, hz.radius * 1.45, hz.colorHex);
          this.particles.spawnSparks(hz.position, 22, hz.colorHex);
          this.cameraCtrl.addScreenShake(0.5);
          if (playerPos.distanceTo(hz.position) <= hz.radius) {
            this.applyPlayerDamage(hz.damage, 0.5);
          }
          this.activeArenaHazards.splice(i, 1);
        }
      }

      // Boss Defeated Check
      if (this.currentBoss.isDead && !this.isVictory) {
        this.handleBossDefeated();
      }
    }

    // 6.5. Update Health Pickups (Supernatural Crimson Orbs)
    for (let i = this.healthPickups.length - 1; i >= 0; i--) {
      const p = this.healthPickups[i];
      const expired = p.update(delta);
      if (expired) {
        this.scene.remove(p.group);
        p.dispose();
        this.healthPickups.splice(i, 1);
        continue;
      }

      if (p.checkProximity(playerPos, 1.8)) {
        const heal = p.collect();
        this.combat.restoreHealth(heal);
        if (this.currentBoss instanceof HollowKingBoss) {
          this.currentBoss.registerPlayerHealAttempt();
        }
        soundEngine.playHealthPickup();
        this.particles.spawnSparks(p.group.position, 28, 0xef4444);
        this.scene.remove(p.group);
        p.dispose();
        this.healthPickups.splice(i, 1);
      }
    }

    // 6.6. Update Environmental Hazards (Floor Spikes & Burning Braziers)
    for (const trap of this.spikeTraps) {
      trap.update(delta, this.azrael, this.combat, this.enemies, this.currentBoss, this.particles);
    }
    for (const brazier of this.burningBraziers) {
      brazier.update(delta, this.azrael, this.combat, this.enemies, this.currentBoss, this.particles);
    }

    // 6.7. Audio Zone System (Ruins vs Arena/Citadel Courtyard vs Hellgate Portal)
    let audioZone: 'ruins' | 'arena' | 'hellgate' = 'arena';
    const distToHellgate = playerPos.distanceTo(landmarks.hellgatePos);
    const distToArena = Math.hypot(playerPos.x - landmarks.bossArenaCenter.x, playerPos.z - landmarks.bossArenaCenter.z);
    if (distToHellgate < 14.0) {
      audioZone = 'hellgate';
    } else if (distToArena > 24.0) {
      audioZone = 'ruins';
    }
    soundEngine.updateAudioZone(audioZone, delta);

    // 7. Update Realm World, Weather, UE5 Postprocessing, Ecosystem, Particles & Combat System
    this.realmWorld.update(delta, this.azrael.group.position);
    this.ecosystemMgr.update(delta, this.azrael.group.position);
    const activeProfile = getUE5RealmProfile(this.playerData.currentRealm);
    const weatherFX = this.weatherSystem.update(
      delta,
      this.scene,
      activeProfile,
      this.dirLight,
      this.hemiLight,
      this.rimLight,
      this.isWhiteEyedGodActive
    );
    if (!this.isWhiteEyedGodActive) {
      this.ue5Pipeline?.applyWeatherOffsets(
        weatherFX.bloomDelta,
        weatherFX.vignetteDelta,
        weatherFX.contrastDelta
      );
    }
    this.ue5Pipeline?.update(
      delta,
      this.realmElapsedTime,
      this.azrael.currentStance === 'wrath_unbound'
    );
    this.particles.update(
      delta,
      this.azrael.group.position,
      this.realmWorld.currentRealmDef?.accentColor,
      this.getGroundYAt,
      this.weatherSystem.particleParams
    );
    this.combat.update(delta, minEnemyDist < 12.0 || hasActiveBoss);

    // 8. White-Eyed God Secret Sequence Update
    if (this.isWhiteEyedGodActive) {
      this.whiteEyedGodTimer += delta;
      this.whiteEyedGod.update(delta);
      // Turn camera to face the looming void eyes
      this.cameraCtrl.camera.position.set(0, 3, 5);
      this.cameraCtrl.camera.lookAt(0, 6, -18);
    } else {
      // Normal camera track with dynamic combat FOV, combo shake & terrain floor clearance
      this.cameraCtrl.update(
        delta,
        this.azrael.group.position,
        input.lookX,
        input.lookY,
        this.combat.comboCount,
        minEnemyDist < 14 || hasActiveBoss,
        landmarks.isOpenWorld ? this.getGroundYAt : undefined
      );
    }

    this.pushUIUpdate();
  }

  private handleBossDefeated() {
    this.isVictory = true;
    this.realmEnemiesDefeated += 1;
    this.realmEmbersEarned += 500 + this.playerData.currentRealm * 250;
    this.ecosystemMgr.onSovereignDefeated(this.playerData.currentRealm);
    soundEngine.playVictoryChime();
    soundEngine.playExplorationMusic(this.playerData.currentRealm);

    // Sovereign Defeat Reward: Unlock Realm Seal Weapon in Project Sevenfold Hybrid Arsenal
    const rewardWeaponId = REALM_TO_WEAPON_ID[this.playerData.currentRealm];
    if (rewardWeaponId) {
      this.unlockWeapon(rewardWeaponId);
    }

    // Sovereign Defeat Reward & Cinematic Dialogue
    const defeatedRealmId = this.playerData.currentRealm;
    if (defeatedRealmId === 2) {
      this.combat.hasGluttonousMonstrance = true;
      let defeatDelay = 2.6;
      MAW_DEFEAT_CINEMATIC.forEach((line) => {
        const tId = window.setTimeout(() => {
          if (this.playerData.currentRealm === 2) {
            this.abaddonDialogueCtrl.playDialogue(line);
          }
        }, defeatDelay * 1000);
        this.realmDialogueTimers.push(tId);
        defeatDelay += line.duration + 0.6;
      });
    } else {
      const tId = window.setTimeout(() => {
        if (this.playerData.currentRealm === defeatedRealmId) {
          voiceManager.playAzraelVictoryLine(defeatedRealmId);
        }
      }, 2800);
      this.realmDialogueTimers.push(tId);
    }

    const def = REALM_DEFINITIONS.find(r => r.id === this.playerData.currentRealm);
    if (def) {
      this.activeLore = {
        title: def.loreTitle,
        text: def.loreFragment,
      };
      if (!this.playerData.loreDiscovered.includes(def.loreTitle)) {
        this.playerData.loreDiscovered.push(def.loreTitle);
      }
    }

    // Unlock next realm & background-load its Sovereign voice lines
    const next = this.playerData.currentRealm + 1;
    if (next <= 7) {
      if (!this.playerData.unlockedRealms.includes(next)) {
        this.playerData.unlockedRealms.push(next);
      }
      voiceManager.preloadRealmVoices(next);
    }

    if (!this.playerData.defeatedBosses.includes(this.currentBoss?.name || '')) {
      this.playerData.defeatedBosses.push(this.currentBoss?.name || '');
    }
    savePlayerData(this.playerData);

    // If Realm 7 was defeated, trigger THE WHITE-EYED GOD reveal!
    if (this.playerData.currentRealm === 7) {
      setTimeout(() => {
        this.triggerWhiteEyedGodReveal();
      }, 3500);
    }
  }

  private applyPlayerDamage(amount: number, shake: number = 0.5) {
    const prevHp = this.combat.health;
    const killed = this.combat.takePlayerDamage(amount, this.particles, this.azrael.group.position);
    if (shake > 0) this.cameraCtrl.addScreenShake(shake);
    if (killed) {
      this.azrael.isDead = true;
      this.isGameOver = true;
      voiceManager.playAzraelDeathLine();
    } else if (this.combat.health < prevHp) {
      const lowHp = this.combat.health <= this.combat.maxHealth * 0.35;
      voiceManager.playAzraelPainLine(lowHp);
    }
  }

  public triggerWhiteEyedGodReveal() {
    this.isWhiteEyedGodActive = true;
    this.whiteEyedGodTimer = 0;
    this.whiteEyedGod.group.visible = true;

    // Plunge entire scene into absolute void blackness
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.05);

    // Hide arena props and enemies
    this.realmWorld.group.visible = false;
    this.azrael.group.visible = false;
    if (this.currentBoss) this.currentBoss.group.visible = false;
    this.enemies.forEach(e => e.group.visible = false);

    soundEngine.stopDarkAmbientPad();
    soundEngine.playWhiteEyedGodWhisper();
    voiceManager.playWhiteEyedGodWhisper();
  }

  public spawnGildedWarden(pos?: THREE.Vector3): GildedWardenController {
    const spawnPos = pos || new THREE.Vector3(0, 0, -8);
    const warden = new GildedWardenController(spawnPos);
    this.enemies.push(warden);
    this.scene.add(warden.group);
    this.particles.spawnGroundShockwave(spawnPos, 4.5, 0xd4af37);
    this.particles.spawnSparks(spawnPos, 30, 0xfacc15);
    this.cameraCtrl.addScreenShake(0.7);
    return warden;
  }

  private pushUIUpdate() {
    const curRealmDef = REALM_DEFINITIONS.find(r => r.id === this.playerData.currentRealm) || REALM_DEFINITIONS[0];
    const activeWarden = this.enemies.find(e => e instanceof GildedWardenController) as GildedWardenController | undefined;
    const wardenWhisper = activeWarden ? activeWarden.soulsManager.getCurrentWhisper() : null;
    const resInfo = this.resonanceCtrl.evaluateProgression(this.playerData.arsenal.unlockedWeapons.length);

    this.onUIUpdate({
      health: this.combat.health,
      maxHealth: this.combat.maxHealth,
      stamina: this.combat.stamina,
      maxStamina: this.combat.maxStamina,
      wrath: this.combat.wrath,
      maxWrath: this.combat.maxWrath,
      stance: this.azrael.currentStance,
      level: this.playerData.level,
      embers: this.playerData.embers,
      currentRealm: curRealmDef,
      bossHealth: this.currentBoss ? this.currentBoss.currentHealth : null,
      bossMaxHealth: this.currentBoss ? this.currentBoss.maxHealth : null,
      bossName: this.currentBoss ? this.currentBoss.name : null,
      bossPhase: this.currentBoss ? this.currentBoss.phase : 1,
      bossPhaseSubtitle: this.currentBoss ? this.currentBoss.phaseSubtitle : undefined,
      bossDialogue: (this.currentBoss instanceof HollowKingBoss)
        ? this.currentBoss.currentDialogueText
        : (this.currentBoss instanceof GluttonySovereignBoss)
        ? this.currentBoss.currentDialogueText
        : (this.currentBoss instanceof SovereignBossController)
        ? this.currentBoss.currentDialogueText
        : null,
      isBossProvisional: this.currentBoss instanceof SovereignBossController ? this.currentBoss.isProvisionalRig : false,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
      weatherState: this.weatherSystem.state,
      isVictory: this.isVictory,
      unlockedRealms: this.playerData.unlockedRealms,
      loreFragment: this.activeLore,
      isWhiteEyedGodActive: this.isWhiteEyedGodActive,
      whiteEyedGodProgress: Math.min(1, this.whiteEyedGodTimer / 7.0),
      graphicsPreset: this.graphicsPreset,
      currentMemoryLog: this.currentMemoryLog,
      currentObjective: this.currentObjective,
      isHealing: this.combat.healIndicatorTimer > 0,
      isPassivelyRegenerating: this.combat.isPassivelyRegenerating,
      comboCount: this.combat.comboCount,
      comboTimerPercent: Math.max(0, Math.min(100, (this.combat.comboMultiplierTimer / 3.2) * 100)),
      comboMultiplier: this.combat.getComboMultiplier(),
      isBossStaggered: Boolean(this.currentBoss && (this.currentBoss.isStaggered || (this.currentBoss instanceof GluttonySovereignBoss && this.currentBoss.isExecutionReady))),
      bossStaggerFlashActive: this.bossStaggerFlashTimer > 0,
      isBossExecutionReady: Boolean(this.currentBoss instanceof GluttonySovereignBoss && this.currentBoss.isExecutionReady),
      isBossFeeding: Boolean(this.currentBoss instanceof GluttonySovereignBoss && this.currentBoss.isFeedingRecoveryActive),
      isBossVortex: Boolean(this.currentBoss instanceof GluttonySovereignBoss && this.currentBoss.isVortexActive),
      wardenWhisper: wardenWhisper,
      activeDialogueSubtitle: voiceManager.getCurrentSubtitle() || this.abaddonDialogueCtrl.getCurrentSubtitle(),
      hasGluttonousMonstrance: this.combat.hasGluttonousMonstrance,
      devourCooldown: this.combat.devourCooldownTimer,
      unlockedWeapons: [...this.playerData.arsenal.unlockedWeapons],
      equippedWeaponId: this.playerData.arsenal.equippedWeaponId,
      manifestCooldown: this.weaponManifestCtrl.getAnyReadyCooldown(this.playerData),
      convergenceCooldown: this.convergenceCtrl.getCooldown(),
      convergenceUnlocked: this.playerData.arsenal.unlockedWeapons.length >= 7,
      isConvergenceActive: this.convergenceCtrl.isActive,
      activeComboBanner: this.weaponComboMgr.activeSynergyBanner
        ? {
            name: this.weaponComboMgr.activeSynergyBanner.name,
            description: this.weaponComboMgr.activeSynergyBanner.description,
            color: this.weaponComboMgr.activeSynergyBanner.color,
          }
        : null,
      sealResonance: {
        tier: resInfo.tier,
        title: resInfo.title,
        whisper: this.resonanceCtrl.activeWhisper,
        count: this.playerData.arsenal.unlockedWeapons.length,
      },
      bossEntrance: this.bossDirector.getUIState(),
      ...(() => {
        const activeEnv = this.realmWorld.environmentManager.getActiveEnvironment();
        const isOW = isOpenWorldExploreRuntime(activeEnv);
        const landmarks = this.realmWorld.getLandmarks();
        const activeZone =
          this.playerData.currentRealm === 1
            ? this.currentLimboZone
            : isOW
            ? this.currentOpenWorldZone
            : null;
        const compassTarget =
          this.playerData.currentRealm === 1
            ? { name: 'Citadel', id: 'ancient_citadel', x: landmarks.bossArenaCenter.x, z: landmarks.bossArenaCenter.z }
            : isOW
            ? {
                name: activeEnv.getOpenWorldConfig().sanctumCompassName,
                id: activeEnv.getOpenWorldConfig().zones[activeEnv.getOpenWorldConfig().zones.length - 1]?.id || 'sanctum',
                x: landmarks.bossArenaCenter.x,
                z: landmarks.bossArenaCenter.z,
              }
            : null;
        return {
          limboZone: activeZone,
          compassTarget,
          playerCoords:
            landmarks.isOpenWorld
              ? { x: Math.round(this.azrael.group.position.x), z: Math.round(this.azrael.group.position.z) }
              : null,
        };
      })(),
      playerYaw: this.cameraCtrl.yaw,
      activeSealBuffs: this.combat.sealBuffs,
      activeDiscoveryBanner: this.activeDiscoveryBanner,
      ...(() => {
        if (this.currentBoss && !this.currentBoss.isDead) {
          return { miniBossHealth: null, miniBossMaxHealth: null, miniBossName: null, miniBossTitle: null };
        }
        const playerPos = this.azrael.group.position;
        const activeMini = this.enemies.find(
          (e) => e.isMiniBoss && !e.isDead && e.group.position.distanceTo(playerPos) <= 24
        );
        return activeMini
          ? {
              miniBossHealth: activeMini.currentHealth,
              miniBossMaxHealth: activeMini.stats.maxHealth,
              miniBossName: activeMini.stats.name,
              miniBossTitle: activeMini.miniBossTitle || null,
            }
          : { miniBossHealth: null, miniBossMaxHealth: null, miniBossName: null, miniBossTitle: null };
      })(),
      battleStats: {
        enemiesDefeated: this.realmEnemiesDefeated,
        peakCombo: Math.max(this.realmPeakCombo, this.combat.comboCount),
        embersEarned: this.realmEmbersEarned,
        elapsedSeconds: Math.floor(this.realmElapsedSeconds),
        bossName: this.currentBoss ? this.currentBoss.name : curRealmDef.bossName,
      },
    });
  }

  public dispose() {
    this.stop();
    this.clearRealmDialogueTimers();
    EnemyInstance.onPsychoticBark = undefined;
    voiceManager.dispose();
    this.abaddonDialogueCtrl.dispose();
    window.removeEventListener('resize', this.handleResize);
    if (this.onContextLostBound) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLostBound);
    }
    if (this.onContextRestoredBound) {
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestoredBound);
    }
    this.healthPickups.forEach(p => p.dispose());
    this.spikeTraps.forEach(t => t.dispose());
    this.burningBraziers.forEach(b => b.dispose());
    this.weaponManifestCtrl.dispose();
    this.convergenceCtrl.dispose();
    this.ue5Pipeline?.dispose();
    this.pmremGenerator?.dispose();
    this.renderer.dispose();
    this.particles.dispose();
    this.realmWorld.dispose();
    this.ecosystemMgr.dispose();
  }
}
