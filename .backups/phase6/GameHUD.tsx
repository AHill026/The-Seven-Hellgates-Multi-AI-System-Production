/**
 * The Seven Hellgates - In-Game HUD & Interface
 * Responsive, dark-fantasy aesthetic, zero viewport occlusion.
 */

import React from 'react';
import { GameUIState } from '../game/HellgatesGame';
import { WeaponId } from '../game/types';
import { SEVENFOLD_WEAPONS, WEAPON_BY_ID } from '../game/arsenal/WeaponRegistry';
import { Flame, Shield, Volume2, VolumeX, RotateCcw, Compass, MapPin, Zap, Skull, Sparkles, Box, Sword, Lock } from 'lucide-react';
import { audioManager } from '../audio/audio-manager';
import { AudioSettingsModal } from './AudioSettingsModal';
import { ComboMultiplierWidget } from './ComboMultiplierWidget';

interface GameHUDProps {
  uiState: GameUIState;
  onOpenAltar: () => void;
  onOpenArsenal: () => void;
  onOpenTravel: () => void;
  onOpenBlenderStudio: () => void;
  onRestart: () => void;
  onUnstuck?: () => void;
  onAdvanceRealm: () => void;
  onSwitchStance: () => void;
  onActivateWrath: () => void;
  onCycleGraphics: () => void;
  onTriggerDevour?: () => void;
  onEquipWeapon: (weaponId: WeaponId) => void;
  onTriggerManifest: () => void;
  onTriggerConvergence: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  uiState,
  onOpenAltar,
  onOpenArsenal,
  onOpenTravel,
  onOpenBlenderStudio,
  onRestart,
  onUnstuck,
  onAdvanceRealm,
  onSwitchStance,
  onActivateWrath,
  onCycleGraphics,
  onTriggerDevour,
  onEquipWeapon,
  onTriggerManifest,
  onTriggerConvergence,
}) => {
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = React.useState(false);
  const isMuted = audioManager.settings.isMuted;

  const hpPercent = Math.max(0, Math.min(100, (uiState.health / uiState.maxHealth) * 100));
  const stamPercent = Math.max(0, Math.min(100, (uiState.stamina / uiState.maxStamina) * 100));
  const wrathPercent = Math.max(0, Math.min(100, (uiState.wrath / uiState.maxWrath) * 100));

  const equippedWeapon = WEAPON_BY_ID[uiState.equippedWeaponId] || WEAPON_BY_ID.kings_remnant;

  const stanceLabels: Record<string, { name: string; weapon: string; color: string }> = {
    reaper: { name: 'REAPER', weapon: equippedWeapon.name, color: 'text-blue-400 border-blue-500/40 bg-blue-950/40' },
    executioner: { name: 'EXECUTIONER', weapon: 'Hellforged Gauntlets', color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' },
    wrath_unbound: { name: 'WRATH UNBOUND', weapon: 'Sovereign Wrath Awakening', color: 'text-cyan-300 border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-500/30' },
  };

  const currentStanceInfo = stanceLabels[uiState.stance] || stanceLabels.reaper;
  const hasOffhandWeapons = uiState.unlockedWeapons.some((w) => w !== uiState.equippedWeaponId);

  const isBossEntranceActive = Boolean(uiState.bossEntrance?.isActive);

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden transition-opacity duration-300 ${
        isBossEntranceActive ? 'opacity-0 invisible' : 'opacity-100 visible'
      }`}
    >
      {/* Screen-Space Golden Stagger Flash & Vignette */}
      {uiState.bossStaggerFlashActive && (
        <div className="absolute inset-0 pointer-events-none z-30 bg-radial from-amber-400/25 via-amber-500/15 to-amber-950/40 animate-pulse transition-opacity duration-150" />
      )}

      {/* --- TOP ROW --- */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Azrael Status Bars */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Header Name & Embers */}
          <div className="flex items-center gap-3 text-sm">
            <span className="font-gothic font-bold text-base md:text-lg tracking-wider text-slate-100 drop-shadow">
              AZRAEL
            </span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold tabular-nums">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{uiState.embers.toLocaleString()}</span>
            </div>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="text-xs font-mono text-cyan-300/90 tabular-nums">
              {uiState.sealResonance.count}/7 Seals
            </span>
          </div>

          {/* Health Bar (Red with dynamic green healing pulse) */}
          <div className="flex items-center gap-2">
            <div className={`w-48 md:w-64 h-3.5 bg-black/70 rounded border p-0.5 relative overflow-hidden shadow-md transition-all duration-200 ${
              uiState.isHealing || uiState.isPassivelyRegenerating
                ? 'border-emerald-500/80 shadow-emerald-500/30'
                : 'border-red-950'
            }`}>
              <div
                className={`h-full rounded-sm transition-all duration-150 ${
                  uiState.isHealing || uiState.isPassivelyRegenerating
                    ? 'bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-400'
                    : 'bg-gradient-to-r from-red-700 via-red-600 to-red-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <span className={`text-[11px] font-mono font-semibold tabular-nums transition-colors duration-150 ${
              uiState.isHealing || uiState.isPassivelyRegenerating ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {Math.round(uiState.health)}/{Math.round(uiState.maxHealth)}
            </span>
            {uiState.isPassivelyRegenerating && (
              <span className="text-[10px] font-mono text-emerald-400">+4/s</span>
            )}
            {uiState.isHealing && !uiState.isPassivelyRegenerating && (
              <span className="text-[10px] font-mono text-emerald-300 font-bold">+HEAL</span>
            )}
          </div>

          {/* Stamina Bar (Emerald/Amber) */}
          <div className="flex items-center gap-2">
            <div className="w-40 md:w-52 h-2.5 bg-black/70 rounded border border-emerald-950 p-0.5 relative overflow-hidden shadow-md">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-sm transition-all duration-75"
                style={{ width: `${stamPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              {Math.round(uiState.stamina)}
            </span>
          </div>

          {/* Wrath Meter (Supernatural Cyan) */}
          <div className="flex items-center gap-2">
            <div className="w-36 md:w-44 h-2 bg-black/70 rounded border border-cyan-950 p-0.5 relative overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-sm transition-all duration-150 ${
                  wrathPercent >= 50 ? 'animate-pulse' : ''
                }`}
                style={{ width: `${wrathPercent}%` }}
              />
            </div>
            <button
              onClick={onActivateWrath}
              disabled={wrathPercent < 50}
              className={`text-[10px] font-mono font-semibold tabular-nums transition-colors ${
                wrathPercent >= 50 ? 'text-cyan-300 hover:text-white cursor-pointer' : 'text-cyan-600 cursor-default'
              }`}
              title="Trigger Sovereign Wrath AoE Strike (Key: R, requires 50% Wrath)"
            >
              WRATH {Math.round(wrathPercent)}% {wrathPercent >= 50 ? '[R READY]' : ''}
            </button>
          </div>

          {/* Stance Selector & Weapon Action Row */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={onSwitchStance}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-gothic tracking-wider font-bold transition-all pointer-events-auto active:scale-95 ${currentStanceInfo.color}`}
              title="Click or press Q to switch stance"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{currentStanceInfo.name}</span>
            </button>
            <span className="text-[11px] text-slate-300 hidden md:inline font-mono">
              {currentStanceInfo.weapon}
            </span>

            {/* Manifest Relic Skill [V] */}
            {hasOffhandWeapons && (
              <button
                onClick={onTriggerManifest}
                disabled={uiState.manifestCooldown > 0}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-gothic tracking-wider font-bold transition-all pointer-events-auto active:scale-95 ${
                  uiState.manifestCooldown > 0
                    ? 'bg-zinc-900/70 border-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-cyan-950/85 border-cyan-500/70 text-cyan-200 hover:bg-cyan-900 shadow-lg shadow-cyan-900/40'
                }`}
                title="Manifest Spectral Seal Weapon Strike (Key: V)"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>MANIFEST</span>
                {uiState.manifestCooldown > 0 ? (
                  <span className="font-mono text-[10px] text-zinc-400 tabular-nums">
                    {uiState.manifestCooldown.toFixed(1)}s
                  </span>
                ) : (
                  <span className="text-[10px] text-cyan-300 font-mono">[V]</span>
                )}
              </button>
            )}

            {/* Sevenfold Convergence Ultimate [X] */}
            {uiState.convergenceUnlocked && (
              <button
                onClick={onTriggerConvergence}
                disabled={uiState.convergenceCooldown > 0 || uiState.isConvergenceActive}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-gothic tracking-wider font-bold transition-all pointer-events-auto active:scale-95 ${
                  uiState.convergenceCooldown > 0 || uiState.isConvergenceActive
                    ? 'bg-zinc-900/70 border-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-amber-950/90 border-amber-400/80 text-amber-200 hover:bg-amber-900 shadow-lg shadow-amber-500/30'
                }`}
                title="Unleash Sevenfold Convergence Ultimate (Key: X)"
              >
                <Sword className="w-3.5 h-3.5 text-amber-300" />
                <span>CONVERGENCE</span>
                {uiState.convergenceCooldown > 0 ? (
                  <span className="font-mono text-[10px] text-zinc-400 tabular-nums">
                    {uiState.convergenceCooldown.toFixed(1)}s
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-300 font-mono">[X]</span>
                )}
              </button>
            )}

            {/* Sovereign Gluttonous Monstrance Skill: Devour */}
            {uiState.hasGluttonousMonstrance && (
              <button
                onClick={onTriggerDevour}
                disabled={Boolean(uiState.devourCooldown && uiState.devourCooldown > 0)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-gothic tracking-wider font-bold transition-all pointer-events-auto active:scale-95 ${
                  uiState.devourCooldown && uiState.devourCooldown > 0
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-red-950/90 border-red-500/80 text-red-200 hover:bg-red-900 shadow-lg shadow-red-900/40'
                }`}
                title="Activate Sovereign Gluttonous Monstrance Devour Skill (Key: F)"
              >
                <Skull className="w-3.5 h-3.5 text-red-400" />
                <span>DEVOUR</span>
                {uiState.devourCooldown && uiState.devourCooldown > 0 ? (
                  <span className="font-mono text-[10px] text-zinc-400 tabular-nums">
                    {uiState.devourCooldown.toFixed(1)}s
                  </span>
                ) : (
                  <span className="text-[10px] text-red-300 font-mono">[F]</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Top-Right: Realm Banner, Quick Utility Controls & Combo Multiplier Widget */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Realm Indicator */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end text-xs text-blue-400 font-gothic font-semibold tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>REALM {uiState.currentRealm.id}: {uiState.currentRealm.name.toUpperCase()}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-sans block">
              {uiState.currentRealm.subtitle}
            </span>
          </div>

          {/* Navigation & Progression Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 mt-1">
            <button
              onClick={onOpenArsenal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 rounded-lg text-xs font-semibold text-cyan-200 shadow-lg active:scale-95 transition-all"
              title="Open Sevenfold Hybrid Arsenal (Key: C)"
            >
              <Sword className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arsenal [C]</span>
            </button>

            <button
              onClick={onOpenAltar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 shadow-lg active:scale-95 transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Altar of Ash</span>
            </button>

            <button
              onClick={onOpenTravel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 shadow-lg active:scale-95 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Hellgates</span>
            </button>

            <button
              onClick={onOpenBlenderStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-amber-500/40 hover:border-amber-400 rounded-lg text-xs font-semibold text-amber-300 shadow-lg active:scale-95 transition-all"
              title="Open Blender 3D Studio & glTF Model Inspector"
            >
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span>Blender 3D</span>
            </button>

            <button
              onClick={onCycleGraphics}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 shadow-lg active:scale-95 transition-all"
              title="Toggle Graphics Preset (Ultra UE5 / Balanced / Low)"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                {uiState.graphicsPreset === 'ultra' ? 'UE5 Ultra' : uiState.graphicsPreset === 'balanced' ? 'Balanced' : 'Low'}
              </span>
            </button>

            <button
              onClick={() => setIsAudioSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 shadow-lg active:scale-95 transition-all"
              title="Audio, Music & Sound Settings"
              aria-label="Audio Settings"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
              <span className="text-[11px] font-mono hidden sm:inline">Audio</span>
            </button>

            {onUnstuck && (
              <button
                onClick={onUnstuck}
                className="flex items-center gap-1 px-2 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-300 hover:text-cyan-300 text-xs font-semibold shadow-lg active:scale-95 transition-all"
                title="Unstuck / Center Character (Press U)"
                aria-label="Unstuck Character"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-mono hidden md:inline">Unstuck [U]</span>
              </button>
            )}

            <button
              onClick={onRestart}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-400 hover:text-white transition-colors"
              aria-label="Restart Realm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Combo Multiplier HUD Widget */}
          <div className="mt-2 pointer-events-none self-end">
            <ComboMultiplierWidget
              comboCount={uiState.comboCount}
              comboTimerPercent={uiState.comboTimerPercent}
              comboMultiplier={uiState.comboMultiplier}
            />
          </div>
        </div>
      </div>

      {/* --- TOP-CENTER OBJECTIVE BANNER --- */}
      {uiState.currentObjective && (
        <div className="self-center -mt-1 md:mt-0 px-4 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-slate-700/60 shadow-xl pointer-events-none transition-all">
          <span className="text-[11px] md:text-xs font-gothic tracking-wider text-slate-200">
            {uiState.currentObjective}
          </span>
        </div>
      )}

      {/* --- CROSS-WEAPON SYNERGY NOTIFICATION BANNER --- */}
      {uiState.activeComboBanner && (
        <div className="self-center px-5 py-2 rounded-xl bg-black/85 border border-cyan-400/60 shadow-2xl pointer-events-none animate-fadeIn text-center">
          <div
            className="text-xs md:text-sm font-gothic font-bold tracking-[0.2em]"
            style={{ color: uiState.activeComboBanner.color }}
          >
            {uiState.activeComboBanner.name}
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">
            {uiState.activeComboBanner.description}
          </div>
        </div>
      )}

      {/* --- SEAL RESONANCE WHISPER TOAST --- */}
      {uiState.sealResonance.whisper && (
        <div className="self-center px-5 py-2 rounded-xl bg-black/85 border border-slate-700/80 shadow-xl pointer-events-none text-center max-w-lg animate-fadeIn">
          <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider block">
            {uiState.sealResonance.title} ({uiState.sealResonance.count}/7 Seals)
          </span>
          <p className="text-xs italic font-serif text-slate-200 mt-0.5">
            "{uiState.sealResonance.whisper}"
          </p>
        </div>
      )}

      {/* --- TOP-CENTER: BOSS HEALTH BAR (When Boss is active) --- */}
      {uiState.bossHealth !== null && uiState.bossMaxHealth !== null && uiState.bossHealth > 0 && (
        <div className="self-center w-full max-w-xl mx-auto flex flex-col items-center pointer-events-none mt-2 animate-fadeIn">
          <div className="flex items-center justify-between w-full px-2 mb-1">
            <div className="flex items-center gap-2">
              <Skull className={`w-4 h-4 ${
                uiState.bossPhase === 3 ? 'text-amber-400 animate-pulse' : (uiState.bossPhase === 2 ? 'text-cyan-400' : 'text-red-500')
              }`} />
              <div className="flex items-baseline gap-2">
                <span className="font-gothic font-bold text-sm md:text-base tracking-widest text-slate-100 drop-shadow">
                  {uiState.bossName}
                </span>
                {uiState.isBossProvisional && (
                  <span className="text-[10px] font-mono text-amber-400">
                    [PROVISIONAL]
                  </span>
                )}
                {uiState.bossPhaseSubtitle && (
                  <span className="text-[11px] font-serif italic text-slate-400 hidden sm:inline">
                    — {uiState.bossPhaseSubtitle}
                  </span>
                )}
              </div>
            </div>

            {/* Phase Text */}
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              uiState.bossPhase === 3
                ? 'text-amber-300'
                : uiState.bossPhase === 2
                ? 'text-cyan-300'
                : 'text-slate-300'
            }`}>
              PHASE {uiState.bossPhase === 3 ? 'III' : uiState.bossPhase === 2 ? 'II' : 'I'}
              {uiState.bossPhaseSubtitle ? ` · ${uiState.bossPhaseSubtitle.toUpperCase()}` : ''}
            </span>
          </div>

          {/* Execution Ready Banner */}
          {uiState.isBossExecutionReady && (
            <div className="flex items-center gap-2 mb-1.5 px-3 py-1 rounded bg-amber-950/95 border-2 border-amber-400 text-amber-200 font-gothic tracking-widest text-xs font-bold shadow-xl shadow-amber-500/40 animate-bounce">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>EXECUTION OPPORTUNITY — ATTACK TO DELIVER PURGING BLOW!</span>
            </div>
          )}

          {/* Feeding Siphon Banner */}
          {uiState.isBossFeeding && !uiState.isBossExecutionReady && (
            <div className="flex items-center gap-2 mb-1.5 px-3 py-1 rounded bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-gothic tracking-widest text-xs font-bold shadow-lg animate-pulse">
              <span>SOVEREIGN IS FEASTING — ATTACK NOW TO INTERRUPT SIPHON!</span>
            </div>
          )}

          {/* Vortex Warning Banner */}
          {uiState.isBossVortex && !uiState.isBossExecutionReady && (
            <div className="flex items-center gap-2 mb-1.5 px-3 py-1 rounded bg-red-950/90 border border-red-500 text-red-300 font-gothic tracking-widest text-xs font-bold shadow-lg animate-pulse">
              <span>COLOSSAL MAW VORTEX — SPRINT / DODGE AWAY FROM THE PIT!</span>
            </div>
          )}

          {/* Stagger Vulnerability Banner */}
          {uiState.isBossStaggered && !uiState.isBossExecutionReady && (
            <div className="flex items-center gap-2 mb-1.5 px-3 py-1 rounded bg-amber-950/90 border border-amber-400 text-amber-300 font-gothic tracking-widest text-xs font-bold shadow-lg shadow-amber-500/30 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>POSTURE BROKEN — CRITICAL VULNERABILITY (+45% DAMAGE)</span>
            </div>
          )}

          {/* Health Bar Track with Phase Ticks at 60% and 30% */}
          <div className={`w-full h-3.5 bg-black/85 rounded p-0.5 shadow-2xl overflow-hidden relative transition-all duration-150 ${
            uiState.isBossStaggered
              ? 'border-2 border-amber-400 shadow-amber-400/50 scale-[1.01]'
              : 'border border-red-950/80'
          }`}>
            {/* Phase threshold tick marks */}
            <div className="absolute top-0 bottom-0 left-[30%] w-[1.5px] bg-amber-400/70 z-10 pointer-events-none" title="Phase III Threshold (30%)" />
            <div className="absolute top-0 bottom-0 left-[60%] w-[1.5px] bg-cyan-400/70 z-10 pointer-events-none" title="Phase II Threshold (60%)" />

            <div
              className={`h-full rounded-sm transition-all duration-100 ${
                uiState.isBossStaggered
                  ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 animate-pulse shadow-md shadow-amber-400/60'
                  : uiState.bossPhase === 3
                  ? 'bg-gradient-to-r from-cyan-600 via-sky-400 to-amber-300 animate-pulse shadow-md shadow-cyan-400/50'
                  : uiState.bossPhase === 2
                  ? 'bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-400 animate-pulse'
                  : 'bg-gradient-to-r from-red-800 via-red-600 to-red-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (uiState.bossHealth / uiState.bossMaxHealth) * 100))}%` }}
            />
          </div>

          {/* Cinematic Boss Dialogue Ribbon */}
          {uiState.bossDialogue && (
            <div className="mt-1.5 px-4 py-1 bg-black/85 border border-cyan-500/40 rounded-lg text-center text-xs md:text-sm font-serif italic text-cyan-200 drop-shadow-md animate-fadeIn backdrop-blur-md">
              "{uiState.bossDialogue}"
            </div>
          )}
        </div>
      )}

      {/* --- FORGOTTEN SOULS WHISPERED DIALOGUE RIBBON (Gilded Warden) --- */}
      {uiState.wardenWhisper && (
        <div className="self-center w-full max-w-lg mx-auto pointer-events-none mb-3 animate-fadeIn">
          <div className="bg-gradient-to-r from-amber-950/90 via-black/90 to-yellow-950/90 border border-amber-500/60 rounded-xl px-5 py-2 shadow-2xl backdrop-blur-md flex items-center justify-center gap-3">
            <p className="text-xs md:text-sm text-amber-200 italic font-serif tracking-wide drop-shadow text-center">
              "{uiState.wardenWhisper}"
            </p>
          </div>
        </div>
      )}

      {/* --- CINEMATIC DIALOGUE SUBTITLE RIBBON (Abaddon & The Maw of Endless Hunger) --- */}
      {uiState.activeDialogueSubtitle && (
        <div className="self-center w-full max-w-2xl mx-auto pointer-events-none mb-3 animate-fadeIn">
          <div className="bg-gradient-to-r from-red-950/95 via-black/95 to-red-950/95 border border-red-600/70 rounded-2xl px-6 py-3 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <Skull className="w-4 h-4 text-red-400" />
              <span className="text-[11px] font-gothic font-bold uppercase tracking-[0.2em] text-red-300 drop-shadow">
                {uiState.activeDialogueSubtitle.speaker}
              </span>
              {uiState.activeDialogueSubtitle.speakerTitle && (
                <span className="text-[10px] font-serif italic text-slate-400 ml-auto hidden sm:inline">
                  — {uiState.activeDialogueSubtitle.speakerTitle}
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-100 italic font-serif leading-relaxed drop-shadow-sm text-center">
              "{uiState.activeDialogueSubtitle.text}"
            </p>
          </div>
        </div>
      )}

      {/* --- NON-BLOCKING MEMORY FRAGMENT LOG RIBBON (Never pauses gameplay) --- */}
      {uiState.currentMemoryLog && (
        <div className="self-center w-full max-w-xl mx-auto pointer-events-none mb-3 animate-fadeIn transition-all">
          <div className="bg-gradient-to-r from-cyan-950/90 via-black/90 to-blue-950/90 border border-cyan-500/50 rounded-2xl p-4 md:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] font-gothic font-bold uppercase tracking-[0.25em] text-cyan-300 drop-shadow">
                Memory Fragment Recovered
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80 ml-auto">
                {uiState.currentMemoryLog.title}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-200 italic font-serif leading-relaxed drop-shadow-sm">
              "{uiState.currentMemoryLog.text}"
            </p>
          </div>
        </div>
      )}

      {/* --- GAME OVER BANNER --- */}
      {uiState.isGameOver && (
        <div className="self-center w-full max-w-md bg-black/90 border border-red-950 rounded-2xl p-6 text-center shadow-2xl pointer-events-auto animate-fadeIn">
          <h2 className="text-3xl font-black font-gothic tracking-[0.2em] text-red-500 drop-shadow mb-2">
            YOU DIED
          </h2>
          <p className="text-xs text-slate-400 mb-5">Your essence dissolved into the ash of the realm.</p>
          <button
            onClick={onRestart}
            className="px-6 py-2.5 bg-red-900/80 hover:bg-red-800 text-white border border-red-700/60 rounded-xl font-gothic text-xs tracking-widest uppercase transition-all shadow-lg active:scale-95"
          >
            Awaken at Gate
          </button>
        </div>
      )}

      {/* --- BOTTOM SECTION: SEVENFOLD QUICK-BAR & CONTROLS GUIDE --- */}
      <div className="flex flex-col items-center gap-2">
        {/* Sevenfold Arsenal Quick-Bar */}
        <div className="hidden md:flex items-center gap-1.5 pointer-events-auto bg-black/75 backdrop-blur-md border border-slate-800/90 px-2.5 py-1.5 rounded-xl shadow-xl">
          {SEVENFOLD_WEAPONS.map((w) => {
            const unlocked = uiState.unlockedWeapons.includes(w.id);
            const equipped = uiState.equippedWeaponId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => unlocked && onEquipWeapon(w.id)}
                disabled={!unlocked}
                title={
                  unlocked
                    ? `[${w.slotIndex}] ${w.name} (${w.classLabel})`
                    : `[${w.slotIndex}] Sealed Relic — Defeat ${w.sovereignName}`
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  equipped
                    ? 'bg-slate-800 text-white border border-cyan-400/70 shadow-sm shadow-cyan-500/20'
                    : unlocked
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                    : 'text-slate-600 cursor-not-allowed border border-transparent'
                }`}
              >
                <span className="font-bold tabular-nums">{w.slotIndex}</span>
                {unlocked ? (
                  <span
                    className="max-w-[92px] truncate font-sans text-[11px]"
                    style={{ color: equipped ? w.accentCssColor : undefined }}
                  >
                    {w.name.replace(/^The /, '')}
                  </span>
                ) : (
                  <Lock className="w-3 h-3 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Desktop Controls Guide */}
        <div className="hidden md:flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-400 bg-black/60 backdrop-blur-sm border border-slate-800/80 px-4 py-1.5 rounded-lg self-center">
          <span><strong className="text-slate-200">WASD</strong> Move</span>
          <span><strong className="text-slate-200">Space</strong> Dodge</span>
          <span><strong className="text-slate-200">LMB</strong> Light Combo</span>
          <span><strong className="text-slate-200">RMB</strong> Heavy</span>
          <span><strong className="text-slate-200">Q</strong> Stance</span>
          <span><strong className="text-slate-200">E</strong> Quake</span>
          <span><strong className="text-cyan-300">1–7</strong> Weapon</span>
          <span><strong className="text-cyan-300">V</strong> Manifest</span>
          {uiState.convergenceUnlocked && (
            <span><strong className="text-amber-300">X</strong> Convergence</span>
          )}
          <span><strong className="text-slate-200">C</strong> Arsenal</span>
          {uiState.hasGluttonousMonstrance && <span><strong className="text-red-400">F</strong> Devour</span>}
          <span><strong className="text-slate-200">R</strong> Wrath</span>
          <span><strong className="text-slate-200">Tab</strong> Lock</span>
        </div>
      </div>

      {/* --- AUDIO SETTINGS MODAL --- */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />
    </div>
  );
};
