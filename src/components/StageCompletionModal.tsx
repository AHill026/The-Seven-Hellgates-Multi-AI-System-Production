/**
 * The Seven Hellgates - Stage Completion & Hellgate Transition Sequence
 * Multi-slide victory modal featuring:
 * Slide 1: Realm Battle Chronicle (enemies vanquished, peak combo, embers harvested, elapsed time)
 * Slide 2: Enter Next Hellgate (destination realm preview, boss prophecy, environmental hazards, breach trigger)
 * Optimized for desktop click and iPhone Safari touch interactions with re-entrance locking.
 */

import React, { useState } from 'react';
import { RealmDefinition } from '../game/types';
import { RealmBattleStats } from '../game/HellgatesGame';
import { REALM_DEFINITIONS } from '../game/worlds/RealmBuilder';
import {
  Flame,
  ChevronRight,
  ChevronLeft,
  Skull,
  Swords,
  Sparkles,
  Clock,
  Compass,
  ShieldAlert,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface StageCompletionModalProps {
  currentRealm: RealmDefinition;
  battleStats: RealmBattleStats;
  onAdvanceRealm: () => void;
  onOpenAltar: () => void;
}

export const StageCompletionModal: React.FC<StageCompletionModalProps> = ({
  currentRealm,
  battleStats,
  onAdvanceRealm,
  onOpenAltar,
}) => {
  const [currentSlide, setCurrentSlide] = useState<1 | 2>(1);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  // Find the next realm definition
  const nextRealm = REALM_DEFINITIONS.find((r) => r.id === currentRealm.id + 1);
  const isFinalRealm = currentRealm.id >= 7;

  // Format battle duration
  const minutes = Math.floor((battleStats?.elapsedSeconds || 0) / 60);
  const seconds = (battleStats?.elapsedSeconds || 0) % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Safe realm advancement trigger with touch + click dual support and duplicate guard
  const handleAdvance = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isTriggering) return;
    setIsTriggering(true);
    onAdvanceRealm();
  };

  const handleOpenAltar = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onOpenAltar();
  };

  const handleSwitchSlide = (slide: 1 | 2, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentSlide(slide);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto select-none animate-fadeIn"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Cinematic CSS-Based Particle Background Overlay (Celestial Embers & Soul Ash) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { left: '4%', delay: '0s', duration: '6.5s', size: '4px', bg: 'bg-cyan-400' },
          { left: '11%', delay: '1.2s', duration: '8.0s', size: '3px', bg: 'bg-blue-400' },
          { left: '18%', delay: '2.5s', duration: '7.2s', size: '5px', bg: 'bg-amber-300' },
          { left: '26%', delay: '0.8s', duration: '6.0s', size: '3px', bg: 'bg-cyan-300' },
          { left: '33%', delay: '3.1s', duration: '8.5s', size: '4px', bg: 'bg-blue-500' },
          { left: '41%', delay: '1.8s', duration: '7.0s', size: '6px', bg: 'bg-cyan-400' },
          { left: '49%', delay: '0.4s', duration: '6.8s', size: '3px', bg: 'bg-amber-400' },
          { left: '56%', delay: '2.9s', duration: '8.2s', size: '5px', bg: 'bg-blue-300' },
          { left: '63%', delay: '1.5s', duration: '7.5s', size: '4px', bg: 'bg-cyan-400' },
          { left: '71%', delay: '3.4s', duration: '6.3s', size: '3px', bg: 'bg-blue-400' },
          { left: '78%', delay: '0.7s', duration: '8.8s', size: '5px', bg: 'bg-amber-300' },
          { left: '85%', delay: '2.1s', duration: '7.1s', size: '4px', bg: 'bg-cyan-300' },
          { left: '92%', delay: '1.0s', duration: '6.6s', size: '3px', bg: 'bg-blue-500' },
          { left: '97%', delay: '3.8s', duration: '8.4s', size: '5px', bg: 'bg-cyan-400' },
        ].map((pt, i) => (
          <div
            key={i}
            className={`absolute rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-victory-particle ${pt.bg}`}
            style={
              {
                left: pt.left,
                bottom: '-20px',
                width: pt.size,
                height: pt.size,
                animationDelay: pt.delay,
                '--duration': pt.duration,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Outer Gothic Modal Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-900/60 bg-gradient-to-b from-slate-950 via-black to-slate-950/95 p-6 md:p-8 shadow-[0_0_50px_rgba(30,58,138,0.35)] z-10">
        {/* Subtle decorative gothic corner braces */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400/50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400/50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400/50" />

        {/* Top Pagination & Step Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-blue-400">
              GATE PURIFICATION
            </span>
            <span className="text-slate-600 text-xs">/</span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">
              {currentSlide === 1 ? 'SLIDE 1: BATTLE CHRONICLE' : 'SLIDE 2: HELLGATE THRESHOLD'}
            </span>
          </div>

          {/* Interactive Step Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={(e) => handleSwitchSlide(1, e)}
              onTouchEnd={(e) => handleSwitchSlide(1, e)}
              className={`px-2.5 py-1 text-[11px] font-gothic tracking-wider rounded transition-all cursor-pointer ${
                currentSlide === 1
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Chronicle
            </button>
            <button
              type="button"
              onClick={(e) => handleSwitchSlide(2, e)}
              onTouchEnd={(e) => handleSwitchSlide(2, e)}
              className={`px-2.5 py-1 text-[11px] font-gothic tracking-wider rounded transition-all cursor-pointer ${
                currentSlide === 2
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Next Gate
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SLIDE 1: BATTLE CHRONICLE & REALM PURIFIED               */}
        {/* ======================================================== */}
        {currentSlide === 1 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Header Lockup */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-950/80 border border-blue-400/50 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <Flame className="w-7 h-7 text-blue-400 animate-pulse" />
              </div>
              <h2 className="font-gothic font-black text-2xl md:text-3xl tracking-[0.25em] text-blue-400 drop-shadow-md">
                GATE {currentRealm.id} PURIFIED
              </h2>
              <p className="text-xs md:text-sm text-slate-300 tracking-wide mt-1">
                {battleStats?.bossName ? `${battleStats.bossName} Vanquished` : currentRealm.bossName}
              </p>
            </div>

            {/* Battle Review Statistics Grid (Anti-Slop Clean Typography & Tabular Numerals) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/60 border border-white/10 rounded-xl p-4 my-1">
              {/* Demons Slain */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Skull className="w-3.5 h-3.5 text-red-400" />
                  <span>Demons Slain</span>
                </div>
                <span className="font-mono font-bold text-2xl md:text-3xl text-slate-100 tabular-nums">
                  {battleStats?.enemiesDefeated ?? 0}
                </span>
              </div>

              {/* Peak Combo Chain */}
              <div className="flex flex-col border-l border-white/10 pl-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>Peak Combo</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono font-bold text-2xl md:text-3xl text-amber-300 tabular-nums">
                    {battleStats?.peakCombo ?? 0}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/80">HITS</span>
                </div>
              </div>

              {/* Embers Won */}
              <div className="flex flex-col border-l border-white/10 pl-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Embers Won</span>
                </div>
                <span className="font-mono font-bold text-2xl md:text-3xl text-cyan-300 tabular-nums">
                  +{battleStats?.embersEarned ?? 0}
                </span>
              </div>

              {/* Battle Duration */}
              <div className="flex flex-col border-l border-white/10 pl-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  <span>Combat Time</span>
                </div>
                <span className="font-mono font-bold text-2xl md:text-3xl text-slate-200 tabular-nums">
                  {timeFormatted}
                </span>
              </div>
            </div>

            {/* Lore Essence Extraction Callout */}
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-blue-300 block mb-0.5">
                Soul Essence Absorbed
              </span>
              The demonic sovereign of this gate has dissolved into celestial ash. The seal has broken, opening the portal deeper into the infernal depths.
            </div>

            {/* Slide 1 Footer Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleSwitchSlide(2, e)}
                onTouchEnd={(e) => handleSwitchSlide(2, e)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-gothic tracking-wider border border-white/10 transition-all cursor-pointer"
              >
                <span>View Gate {nextRealm?.id || 2} Intel</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleAdvance}
                onTouchEnd={handleAdvance}
                disabled={isTriggering}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-gothic text-xs tracking-widest uppercase transition-all shadow-xl shadow-cyan-500/30 active:scale-95 disabled:opacity-50 font-bold cursor-pointer"
              >
                {isTriggering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Breaching Gate...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Next Hellgate</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 2: ENTER NEXT HELLGATE & DEMONIC PROPHECY           */}
        {/* ======================================================== */}
        {currentSlide === 2 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Header Lockup */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Compass className="w-7 h-7 text-cyan-400 animate-spin-slow" />
              </div>
              <h2 className="font-gothic font-black text-2xl md:text-3xl tracking-[0.25em] text-cyan-300 drop-shadow-md">
                {isFinalRealm
                  ? 'THE FINAL THRESHOLD'
                  : `GATE ${nextRealm?.id || currentRealm.id + 1}: ${nextRealm?.name.toUpperCase() || 'UNSEALED'}`}
              </h2>
              <p className="text-xs md:text-sm text-slate-300 tracking-wide mt-1">
                {isFinalRealm
                  ? 'The Cosmic Void beyond the Seven Gates'
                  : nextRealm?.subtitle || 'The Next Demonic Circle'}
              </p>
            </div>

            {/* Next Realm Intel Card */}
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              {/* Target Arch-Demon */}
              <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-0.5">
                    Target Arch-Demon
                  </span>
                  <span className="font-gothic font-bold text-sm md:text-base text-red-400 tracking-wider">
                    {isFinalRealm ? 'The White-Eyed God' : nextRealm?.bossName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-0.5">
                    Demon Title
                  </span>
                  <span className="font-sans text-xs text-slate-300">
                    {isFinalRealm ? 'The Sovereign of the Void' : nextRealm?.bossTitle}
                  </span>
                </div>
              </div>

              {/* Biome Description */}
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{isFinalRealm
                  ? 'A realm of pure cosmic darkness where light itself decays. The architect of the Seven Seals stirs from primordial slumber.'
                  : nextRealm?.description || 'A treacherous circle guarded by demonic forces and environmental hazards.'}"
              </p>

              {/* Environmental Hazard Warning */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/25 border border-amber-500/30 text-[11px] text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Threat Assessment:</strong> Floor spike grates, flaming braziers, and elite demonic ambush units occupy this territory.
                </span>
              </div>
            </div>

            {/* Slide 2 Navigation & Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleSwitchSlide(1, e)}
                onTouchEnd={(e) => handleSwitchSlide(1, e)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-gothic tracking-wider border border-white/10 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Chronicle</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleOpenAltar}
                  onTouchEnd={handleOpenAltar}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
                  title="Spend soul embers to increase Vitality, Vigor, and Strength"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Altar of Ash</span>
                </button>

                <button
                  type="button"
                  onClick={handleAdvance}
                  onTouchEnd={handleAdvance}
                  disabled={isTriggering}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-gothic text-xs tracking-widest uppercase transition-all shadow-lg shadow-cyan-500/30 active:scale-95 font-bold disabled:opacity-50 cursor-pointer"
                >
                  {isTriggering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Breaching Gate...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Next Hellgate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
