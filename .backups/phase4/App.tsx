/**
 * The Seven Hellgates - Root Application Component
 */

import React, { useEffect, useRef, useState } from 'react';
import { HellgatesGame, GameUIState } from './game/HellgatesGame';
import { GameHUD } from './components/GameHUD';
import { MobileControls } from './components/MobileControls';
import { AltarModal } from './components/AltarModal';
import { RealmTravelModal } from './components/RealmTravelModal';
import { WhiteEyedGodCutscene } from './components/WhiteEyedGodCutscene';
import { MainMenu } from './components/MainMenu';
import { BlenderStudioModal } from './components/BlenderStudioModal';
import { StageCompletionModal } from './components/StageCompletionModal';
import { ArsenalModal } from './components/ArsenalModal';
import { resetPlayerData } from './game/storage';
import { PlayerStats, WeaponId, WeaponUpgradeTrack } from './game/types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<HellgatesGame | null>(null);

  const [uiState, setUiState] = useState<GameUIState | null>(null);
  const [isInMainMenu, setIsInMainMenu] = useState(true);
  const [isAltarOpen, setIsAltarOpen] = useState(false);
  const [isArsenalOpen, setIsArsenalOpen] = useState(false);
  const [isTravelOpen, setIsTravelOpen] = useState(false);
  const [isBlenderStudioOpen, setIsBlenderStudioOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);

    if (!containerRef.current) return;

    // Initialize 3D Engine
    const game = new HellgatesGame(containerRef.current, (state) => {
      setUiState({ ...state });
    });
    game.onToggleArsenal = () => {
      setIsArsenalOpen((prev) => !prev);
    };
    gameRef.current = game;

    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    setIsInMainMenu(false);
  };

  const handleResetGame = () => {
    const fresh = resetPlayerData();
    if (gameRef.current) {
      gameRef.current.playerData = fresh;
      gameRef.current.loadRealm(1);
    }
  };

  const handleUpgradeStat = (stat: keyof PlayerStats) => {
    if (gameRef.current) {
      gameRef.current.upgradeStat(stat);
    }
  };

  const handleSelectRealm = (realmId: number) => {
    if (gameRef.current) {
      gameRef.current.loadRealm(realmId);
    }
  };

  const handleRestart = () => {
    if (gameRef.current) {
      gameRef.current.restartRealm();
    }
  };

  const handleUnstuck = () => {
    if (gameRef.current) {
      gameRef.current.unstuckPlayer();
    }
  };

  const handleAdvanceRealm = () => {
    if (gameRef.current) {
      gameRef.current.advanceToNextRealm();
    }
  };

  const handleSwitchStance = () => {
    if (gameRef.current) {
      gameRef.current.switchStance();
    }
  };

  const handleActivateWrath = () => {
    if (gameRef.current) {
      gameRef.current.activateWrath();
    }
  };

  const handleMobileAction = (action: 'light' | 'heavy' | 'dodge' | 'stance' | 'ability' | 'wrath' | 'lock') => {
    if (gameRef.current) {
      gameRef.current.triggerMobileAction(action);
    }
  };

  const handleMobileMove = (x: number, z: number) => {
    if (gameRef.current) {
      gameRef.current.setVirtualMove(x, z);
    }
  };

  const handleMobileLook = (dx: number, dy: number) => {
    if (gameRef.current) {
      gameRef.current.setVirtualLook(dx, dy);
    }
  };

  const handleCycleGraphics = () => {
    if (gameRef.current) {
      gameRef.current.cycleGraphicsPreset();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-slate-100 select-none">
      {/* 1. Dedicated Three.js WebGL Mount Ref */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />

      {/* 2. Main Menu Overlay */}
      {isInMainMenu && gameRef.current && (
        <MainMenu
          playerData={gameRef.current.playerData}
          onStartGame={handleStartGame}
          onResetGame={handleResetGame}
          onOpenBlenderStudio={() => setIsBlenderStudioOpen(true)}
        />
      )}

      {/* 3. In-Game HUD (when active) */}
      {!isInMainMenu && uiState && (
        <>
          <GameHUD
            uiState={uiState}
            onOpenAltar={() => setIsAltarOpen(true)}
            onOpenArsenal={() => setIsArsenalOpen(true)}
            onOpenTravel={() => setIsTravelOpen(true)}
            onOpenBlenderStudio={() => setIsBlenderStudioOpen(true)}
            onRestart={handleRestart}
            onUnstuck={handleUnstuck}
            onAdvanceRealm={handleAdvanceRealm}
            onSwitchStance={handleSwitchStance}
            onActivateWrath={handleActivateWrath}
            onCycleGraphics={handleCycleGraphics}
            onTriggerDevour={() => gameRef.current?.triggerDevourAction()}
            onEquipWeapon={(weaponId: WeaponId) => gameRef.current?.equipWeapon(weaponId)}
            onTriggerManifest={() => gameRef.current?.triggerManifestation()}
            onTriggerConvergence={() => gameRef.current?.triggerConvergence()}
          />

          {/* 4. Mobile On-Screen Controls (disabled during victory and modal overlays) */}
          {isTouchDevice && (
            <MobileControls
              onMove={handleMobileMove}
              onLookDelta={handleMobileLook}
              onAction={handleMobileAction}
              currentStance={uiState.stance}
              wrathReady={uiState.wrath >= 50}
              disabled={uiState.isVictory || uiState.isGameOver || isAltarOpen || isArsenalOpen || isTravelOpen}
            />
          )}

          {/* 4.5. Stage Completion & Next Hellgate Transition Plate (Top-Level Stacking Context) */}
          {uiState.isVictory && (
            <StageCompletionModal
              currentRealm={uiState.currentRealm}
              battleStats={uiState.battleStats}
              onAdvanceRealm={handleAdvanceRealm}
              onOpenAltar={() => setIsAltarOpen(true)}
            />
          )}

          {/* 5. Altar of Ash Modal */}
          {isAltarOpen && gameRef.current && (
            <AltarModal
              playerData={gameRef.current.playerData}
              onUpgrade={handleUpgradeStat}
              onClose={() => setIsAltarOpen(false)}
            />
          )}

          {/* 5.5 Project Sevenfold Hybrid Arsenal Modal */}
          {isArsenalOpen && gameRef.current && (
            <ArsenalModal
              playerData={gameRef.current.playerData}
              onEquipWeapon={(weaponId: WeaponId) => gameRef.current?.equipWeapon(weaponId)}
              onUpgradeWeapon={(weaponId: WeaponId, track: WeaponUpgradeTrack) =>
                gameRef.current?.upgradeWeapon(weaponId, track)
              }
              onClose={() => setIsArsenalOpen(false)}
            />
          )}

          {/* 6. Realm Portal Travel Modal */}
          {isTravelOpen && gameRef.current && (
            <RealmTravelModal
              currentRealmId={gameRef.current.playerData.currentRealm}
              unlockedRealms={uiState.unlockedRealms}
              defeatedBosses={gameRef.current.playerData.defeatedBosses}
              onSelectRealm={handleSelectRealm}
              onClose={() => setIsTravelOpen(false)}
            />
          )}

          {/* 7. The White-Eyed God Climactic Sequence */}
          {uiState.isWhiteEyedGodActive && (
            <WhiteEyedGodCutscene
              onRestart={() => {
                handleResetGame();
                setIsInMainMenu(true);
              }}
            />
          )}
        </>
      )}

      {/* 8. Blender 3D Studio & Model Inspector Modal */}
      <BlenderStudioModal
        isOpen={isBlenderStudioOpen}
        onClose={() => setIsBlenderStudioOpen(false)}
      />
    </div>
  );
}
