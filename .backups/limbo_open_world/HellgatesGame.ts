/**
 * The Seven Hellgates - Main 3D Game Engine Orchestrator
 */

import * as THREE from 'three';
import { PlayerData, CombatStance, RealmDefinition, EnemyType, WeaponId, WeaponUpgradeTrack } from './types';
import { loadPlayerData, savePlayerData, createDefaultUpgradeLevels } from './storage';
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
import { ParticleSystem } from './vfx/ParticleSystem';
import { BossEntranceDirector, BossEntranceState } from './vfx/BossEntranceDirector';
import { CameraController } from './core/CameraController';
import { InputManager } from './core/InputManager';
import { CombatSystem } from './combat/CombatSystem';
import { soundEngine } from './audio/SoundEngine';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MemoryFragment } from './entities/MemoryFragment';
import { HealthPickup } from './entities/HealthPickup';
import { FloorSpikeTrap, BurningBrazierHazard } from './entities/EnvironmentalHazards';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
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

  // Lighting & Rendering
  private dirLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private pmremGenerator!: THREE.PMREMGenerator;

  // UE5 Postprocessing Stack
  private composer!: EffectComposer;
  private renderPass!: RenderPass;
  private bloomPass!: UnrealBloomPass;
  private outputPass!: OutputPass;

  // Runtime flags
  private isRunning: boolean = false;
  private animFrameId: number = 0;
  private onUIUpdate: (state: GameUIState) => void;
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
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js Renderer (UE5 Tone Mapping & Color Pipeline)
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Physical Environment Reflection (RoomEnvironment)
    this.scene = new THREE.Scene();

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    const envTexture = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;

    // 4. UE5 Three-Point Cinematic Lighting Rig
    this.dirLight = new THREE.DirectionalLight(0xfff4e6, 2.0);
    this.dirLight.position.set(16, 28, 16);
    this.dirLight.castShadow = !isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 70;
    this.dirLight.shadow.camera.left = -30;
    this.dirLight.shadow.camera.right = 30;
    this.dirLight.shadow.camera.top = 30;
    this.dirLight.shadow.camera.bottom = -30;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // Cool blue-white specular rim light to carve out armor silhouettes
    this.rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.2);
    this.rimLight.position.set(-20, 18, -20);
    this.scene.add(this.rimLight);

    const hemiLight = new THREE.HemisphereLight(0x334155, 0x0f172a, 1.0);
    this.scene.add(hemiLight);

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

    // 4.5. UE5 Cinematic Postprocessing (Unreal Bloom & Atmospheric Glow)
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.cameraCtrl.camera);
    this.composer.addPass(this.renderPass);

    const bloomStrength = 1.35;
    const bloomRadius = 0.72;
    const bloomThreshold = 0.7;
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      bloomStrength,
      bloomRadius,
      bloomThreshold
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    // 5. Load Player Data & Build Azrael
    this.playerData = loadPlayerData();
    this.combat = new CombatSystem(this.playerData.stats);
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
    if (this.composer) {
      this.composer.setSize(w, h);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(w, h);
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

    // Build World & Ambient Pad
    const def = this.realmWorld.buildRealm(realmId, this.scene, this.graphicsPreset);
    soundEngine.startDarkAmbientPad(realmId);

    // Spawn Realm Environmental Hazards (Tactical choke points for kiting demons)
    const spikePositions = [
      new THREE.Vector3(6.5, 0, -5),
      new THREE.Vector3(-6.5, 0, -5),
      new THREE.Vector3(8.0, 0, -14),
      new THREE.Vector3(-8.0, 0, -14),
    ];
    spikePositions.forEach(pos => {
      const trap = new FloorSpikeTrap(pos);
      this.scene.add(trap.group);
      this.spikeTraps.push(trap);
    });

    const brazierPositions = [
      new THREE.Vector3(0, 0, -11),
      new THREE.Vector3(13, 0, 3),
      new THREE.Vector3(-13, 0, 3),
    ];
    brazierPositions.forEach(pos => {
      const brazier = new BurningBrazierHazard(pos);
      this.scene.add(brazier.group);
      this.burningBraziers.push(brazier);
    });

    // Reset Azrael position & animation rig
    this.azrael.reset();
    this.azrael.group.position.set(0, 0, 8);
    this.azrael.group.rotation.set(0, Math.PI, 0);
    this.combat.health = this.combat.maxHealth;
    this.combat.stamina = this.combat.maxStamina;
    this.isGameOver = false;
    this.isVictory = false;

    // Load Living Realm Ecosystem (Wildlife, Feeding Pits, Blood-Reactive Vegetation)
    this.ecosystemMgr.loadRealmEcosystem(realmId, this.scene);

    if (realmId === 1) {
      // --- REALM 1: PROLOGUE STORYLINE EXPERIENCE ---
      // Do NOT spawn demons or boss immediately! Azrael awakens alone in the quiet ruins.
      this.storylinePhase = 'exploration';
      this.collectedFragmentsCount = 0;
      this.currentObjective = "Prologue: Explore the silent ruins and uncover Azrael's memories (0/3)";
      if (!this.isInMainMenu) {
        const tId = window.setTimeout(() => {
          if (this.playerData.currentRealm === 1 && !this.isInMainMenu && !this.bossDirector.isActive) {
            voiceManager.playAzraelRealmEnter(1);
          }
        }, 700);
        this.realmDialogueTimers.push(tId);
      }

      // 3 Scattered 3D Memory Fragment Crystals
      const fragmentDefs = [
        {
          id: 'frag_crown',
          title: 'The Shattered Crown',
          text: 'A shattered crown lies buried in the cold ash. You remember kneeling before a high altar... but not whose name was praised.',
          position: new THREE.Vector3(10, 1.2, 6),
        },
        {
          id: 'frag_sword',
          title: 'The Celestial Cold',
          text: 'The greatsword in your grasp was forged in celestial ice. It hungers for demonic blood, yet it recoils from your own soul.',
          position: new THREE.Vector3(-11, 1.2, 3),
        },
        {
          id: 'frag_seals',
          title: 'The Seven Seals',
          text: 'Seven gates were unsealed to contain a single sovereign. Was it the demonic lords they feared... or you?',
          position: new THREE.Vector3(0, 1.2, -6),
        },
      ];

      fragmentDefs.forEach(fd => {
        const frag = new MemoryFragment(fd);
        this.memoryFragments.push(frag);
        this.scene.add(frag.group);
      });
    } else {
      // Realms 2 to 7: Standard Realm Incursions
      this.storylinePhase = 'boss';
      this.currentObjective = `Defeat ${def.bossName} - ${def.subtitle}`;

      // Spawn Guardian Demons
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
        // Spawn The Gilded Warden - Enormous Imperial Executioner Brute of Greed
        const warden = new GildedWardenController(new THREE.Vector3(0, 0, -6));
        this.enemies.push(warden);
        this.scene.add(warden.group);
      }

      // Spawn Major Realm Boss (Preserving Hollow King & Maw of Endless Hunger, using Phase II Sovereign Framework for Realms 3–7)
      this.currentBoss = realmId === 1
        ? new HollowKingBoss(1)
        : realmId === 2
        ? new GluttonySovereignBoss(2)
        : createSovereignBossForRealm(realmId);
      this.currentBoss.group.position.set(0, 0, -14);
      this.scene.add(this.currentBoss.group);
      soundEngine.playBossMusic(realmId);

      if (this.isInMainMenu) {
        this.pendingBossEntrance = true;
      } else {
        this.triggerBossEntranceForCurrentBoss(realmId, def);
      }
    }

    this.pushUIUpdate();
  }

  public onEnterGameplay() {
    this.isInMainMenu = false;
    if (this.pendingBossEntrance && this.currentBoss) {
      this.pendingBossEntrance = false;
      const realmId = this.playerData.currentRealm;
      const def = REALM_DEFINITIONS.find(r => r.id === realmId) || REALM_DEFINITIONS[0];
      this.triggerBossEntranceForCurrentBoss(realmId, def);
      this.pushUIUpdate();
    } else if (this.playerData.currentRealm === 1) {
      const tId = window.setTimeout(() => {
        if (this.playerData.currentRealm === 1 && !this.isInMainMenu && !this.bossDirector.isActive) {
          voiceManager.playAzraelRealmEnter(1);
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
    // Reset Azrael cleanly facing the arriving boss
    this.azrael.reset();
    this.azrael.group.position.set(0, 0, 8);
    this.azrael.group.rotation.set(0, Math.PI, 0);

    soundEngine.playBossSpawnHorn();
    this.bossDirector.startEntrance(
      this.currentBoss,
      def,
      this.azrael.group.position,
      this.cameraCtrl,
      this.particles,
      this.dirLight,
      this.rimLight,
      () => {
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
    this.currentObjective = 'Defend against the Demonic Breach';

    this.cameraCtrl.addScreenShake(0.85);
    soundEngine.playBossSpawnHorn();

    // Spawn first demonic breach wave
    const spawnPositions = [
      new THREE.Vector3(8, 0, -4),
      new THREE.Vector3(-8, 0, -4),
      new THREE.Vector3(0, 0, -12),
      new THREE.Vector3(5, 0, 12),
    ];

    spawnPositions.forEach((pos, idx) => {
      const type: EnemyType = idx === 2 ? 'hellbrute' : 'hellspawn';
      const enemy = new EnemyInstance(type, pos);
      this.enemies.push(enemy);
      this.scene.add(enemy.group);
      this.particles.spawnGroundShockwave(pos, 3.5, 0xef4444);
    });

    this.pushUIUpdate();
  }

  public triggerBossArrival() {
    if (this.currentBoss) return;
    this.storylinePhase = 'boss';
    this.currentObjective = 'Confront The Hollow King - Ruler of Limbo';

    soundEngine.playBossMusic(1);

    this.currentBoss = new HollowKingBoss(1);
    this.currentBoss.group.position.set(0, 0, -14);
    this.scene.add(this.currentBoss.group);

    const def = REALM_DEFINITIONS.find(r => r.id === 1) || REALM_DEFINITIONS[0];
    this.triggerBossEntranceForCurrentBoss(1, def);

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
      voiceManager.playAzraelWrathBark();
      if (res.embersGained > 0) {
        this.realmEmbersEarned += res.embersGained;
        this.playerData.embers += res.embersGained;
        savePlayerData(this.playerData);
      }
      if (res.bossStaggered) {
        this.bossStaggerFlashTimer = 0.85;
        this.cameraCtrl.addScreenShake(1.2);
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
    voiceManager.playAzraelSpecialAttackLine();
    if (res.embersGained > 0) {
      this.realmEmbersEarned += res.embersGained;
      this.playerData.embers += res.embersGained;
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
    if (preset === 'ultra') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.toneMappingExposure = 1.25;
      if (this.bloomPass) {
        this.bloomPass.enabled = true;
        this.bloomPass.strength = 1.35;
        this.bloomPass.radius = 0.75;
        this.bloomPass.threshold = 0.7;
      }
      if (this.dirLight) {
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.set(2048, 2048);
      }
    } else if (preset === 'balanced') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.toneMappingExposure = 1.15;
      if (this.bloomPass) {
        this.bloomPass.enabled = true;
        this.bloomPass.strength = 0.85;
        this.bloomPass.radius = 0.45;
        this.bloomPass.threshold = 0.82;
      }
      if (this.dirLight) {
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.set(1024, 1024);
      }
    } else {
      this.renderer.setPixelRatio(1.0);
      this.renderer.toneMappingExposure = 1.05;
      if (this.bloomPass) {
        this.bloomPass.enabled = false;
      }
      if (this.dirLight) {
        this.dirLight.castShadow = false;
      }
    }
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

  public unstuckPlayer() {
    this.azrael.reset();
    this.azrael.group.position.set(0, 0, 6);
    this.azrael.group.rotation.set(0, Math.PI, 0);
    this.combat.health = Math.max(this.combat.health, 50);
    this.isGameOver = false;
    soundEngine.playMemoryChime();
    this.particles.spawnSparks(new THREE.Vector3(0, 1, 6), 25, 0x38bdf8);
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

    // 1. Combat Hitstop check
    const isPaused = this.combat.update(delta);
    if (!isPaused) {
      this.updateGameLogic(delta);
    }

    // 2. Render Scene via UE5 Multi-Pass Composer (Ultra/Balanced) or Direct WebGL (Low)
    if ((this.graphicsPreset === 'ultra' || this.graphicsPreset === 'balanced') && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.cameraCtrl.camera);
    }
  };

  private updateGameLogic(delta: number) {
    const input = this.inputMgr.update();

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
      this.particles.update(delta, this.azrael.group.position, this.realmWorld.currentRealmDef?.accentColor);
      this.abaddonDialogueCtrl.update(delta);
      voiceManager.update(delta);
      this.cameraCtrl.update(delta, this.azrael.group.position, 0, 0, 0, false);
      this.pushUIUpdate();
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

    // 1. Azrael Movement & Orientation
    let isMoving = false;
    if (!this.azrael.isDead && !this.azrael.isAttacking && !this.azrael.isDodging) {
      const moveVec = new THREE.Vector3(input.moveX, 0, -input.moveZ);
      if (moveVec.lengthSq() > 0.001) {
        isMoving = true;
        // Transform move vector relative to camera yaw
        moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraCtrl.yaw);

        // Face movement direction
        const targetAngle = Math.atan2(moveVec.x, moveVec.z);
        this.azrael.group.rotation.y = THREE.MathUtils.damp(this.azrael.group.rotation.y, targetAngle, 14, delta);

        // Move player
        const speed = input.isSprinting ? 9.0 : 5.5;
        this.azrael.group.position.addScaledVector(moveVec, speed * delta);

        // Arena boundary limit (radius 26.5m - stays strictly inside flat battle arena)
        const dist2D = Math.hypot(this.azrael.group.position.x, this.azrael.group.position.z);
        const maxArenaRadius = 26.5;
        if (dist2D > maxArenaRadius) {
          const factor = maxArenaRadius / dist2D;
          this.azrael.group.position.x *= factor;
          this.azrael.group.position.z *= factor;
        }
      }
    }

    // Dynamic roll momentum when dodging
    if (this.azrael.isDodging && !this.azrael.isDead) {
      const rollDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.azrael.group.rotation.y);
      this.azrael.group.position.addScaledVector(rollDir, 8.0 * delta);

      const rollDist2D = Math.hypot(this.azrael.group.position.x, this.azrael.group.position.z);
      if (rollDist2D > 26.5) {
        const factor = 26.5 / rollDist2D;
        this.azrael.group.position.x *= factor;
        this.azrael.group.position.z *= factor;
      }
    }

    // Resolve realm environmental obstacle collisions & keep Azrael strictly grounded on arena floor (y = 0)
    this.realmWorld.resolveCollision(this.azrael.group.position, 0.75);
    this.azrael.group.position.y = 0;

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
        this.realmEmbersEarned += res.embersGained;
        this.playerData.embers += res.embersGained;
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
        this.realmEnemiesDefeated += res.defeatedEnemies.length;
        for (const defEnemy of res.defeatedEnemies) {
          if (Math.random() < 0.38) {
            const pickup = new HealthPickup(defEnemy.group.position);
            this.scene.add(pickup.group);
            this.healthPickups.push(pickup);
            this.particles.spawnSparks(defEnemy.group.position, 20, 0xef4444);
          }
        }
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
        this.realmEmbersEarned += res.embersGained;
        this.playerData.embers += res.embersGained;
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
        this.realmEnemiesDefeated += res.defeatedEnemies.length;
        for (const defEnemy of res.defeatedEnemies) {
          if (Math.random() < 0.45) {
            const pickup = new HealthPickup(defEnemy.group.position);
            this.scene.add(pickup.group);
            this.healthPickups.push(pickup);
            this.particles.spawnSparks(defEnemy.group.position, 20, 0xef4444);
          }
        }
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
      this.realmEmbersEarned += convRes.embersGained;
      this.playerData.embers += convRes.embersGained;
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

        this.currentObjective = `Prologue: Uncover Azrael's memories (${this.collectedFragmentsCount}/3)`;

        // Story trigger: Collecting fragments summons the demonic breach!
        if (this.collectedFragmentsCount >= 2 && this.storylinePhase === 'exploration') {
          setTimeout(() => {
            this.triggerDemonicBreach();
          }, 2400);
        }
      }
    }

    // Decay memory log display timer
    if (this.memoryLogTimer > 0) {
      this.memoryLogTimer -= delta;
      if (this.memoryLogTimer <= 0) {
        this.currentMemoryLog = null;
      }
    }

    // In breach phase, summon The Hollow King when wave is defeated or player reaches Hellgate
    if (this.storylinePhase === 'breach' && !this.currentBoss) {
      const remainingEnemies = this.enemies.filter(e => !e.isDead);
      const distToHellgate = playerPos.distanceTo(new THREE.Vector3(0, 0, -22));
      if (remainingEnemies.length === 0 || distToHellgate < 15) {
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
      const result = enemy.update(delta, playerPos);
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
        // A. Fallen Court Summons
        if (this.currentBoss.pendingSummons) {
          this.currentBoss.pendingSummons = false;
          const summonAngles = [Math.PI * 0.4, -Math.PI * 0.4];
          summonAngles.forEach(ang => {
            const spawnPos = new THREE.Vector3(
              Math.sin(ang) * 9,
              0,
              Math.cos(ang) * 9 - 8
            );
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

    // 6.7. Audio Zone System (Ruins vs Central Arena vs Hellgate Portal)
    let audioZone: 'ruins' | 'arena' | 'hellgate' = 'arena';
    const distToHellgate = playerPos.distanceTo(new THREE.Vector3(0, 0, -22));
    if (distToHellgate < 12.0) {
      audioZone = 'hellgate';
    } else if (new THREE.Vector2(playerPos.x, playerPos.z).length() > 20.0) {
      audioZone = 'ruins';
    }
    soundEngine.updateAudioZone(audioZone, delta);

    // 7. Update Realm World, Ecosystem, Particles & Combat System
    this.realmWorld.update(delta, this.azrael.group.position);
    this.ecosystemMgr.update(delta, this.azrael.group.position);
    this.particles.update(delta, this.azrael.group.position, this.realmWorld.currentRealmDef?.accentColor);
    this.combat.update(delta, minEnemyDist < 12.0 || hasActiveBoss);

    // 8. White-Eyed God Secret Sequence Update
    if (this.isWhiteEyedGodActive) {
      this.whiteEyedGodTimer += delta;
      this.whiteEyedGod.update(delta);
      // Turn camera to face the looming void eyes
      this.cameraCtrl.camera.position.set(0, 3, 5);
      this.cameraCtrl.camera.lookAt(0, 6, -18);
    } else {
      // Normal camera track with dynamic combat FOV & combo shake
      this.cameraCtrl.update(delta, this.azrael.group.position, input.lookX, input.lookY, this.combat.comboCount, minEnemyDist < 14 || hasActiveBoss);
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
    this.healthPickups.forEach(p => p.dispose());
    this.spikeTraps.forEach(t => t.dispose());
    this.burningBraziers.forEach(b => b.dispose());
    this.weaponManifestCtrl.dispose();
    this.convergenceCtrl.dispose();
    this.composer?.dispose();
    this.renderer.dispose();
    this.particles.dispose();
    this.realmWorld.dispose();
    this.ecosystemMgr.dispose();
  }
}
