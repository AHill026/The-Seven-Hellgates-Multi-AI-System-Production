/**
 * The Seven Hellgates - Dynamic Combo Multiplier HUD Widget
 * Tracks consecutive hits with stylish tier-escalating visual flair, animated rank emblems,
 * combat multiplier buffs, and a real-time decay meter.
 */

import React, { useMemo } from 'react';
import { Flame, Swords, Skull, Crown, Zap, Sparkles } from 'lucide-react';

interface ComboMultiplierWidgetProps {
  comboCount: number;
  comboTimerPercent: number;
  comboMultiplier: number;
}

interface ComboTierConfig {
  rank: string;
  subtitle: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  accentBg: string;
  meterColor: string;
  icon: React.ReactNode;
  multiplierText: string;
}

export const ComboMultiplierWidget: React.FC<ComboMultiplierWidgetProps> = ({
  comboCount,
  comboTimerPercent,
  comboMultiplier,
}) => {
  if (comboCount < 2) return null;

  // Determine stylistic tier based on consecutive hit count
  const tierConfig: ComboTierConfig = useMemo(() => {
    if (comboCount >= 20) {
      return {
        rank: 'SOVEREIGN WRATH',
        subtitle: 'GODSLAYER ASCENDANCE',
        badgeBg: 'bg-gradient-to-br from-cyan-950/90 via-slate-950/95 to-blue-950/90',
        borderColor: 'border-cyan-400/90',
        textColor: 'text-cyan-300',
        glowColor: 'shadow-[0_0_25px_rgba(56,189,248,0.45)]',
        accentBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50',
        meterColor: 'bg-gradient-to-r from-blue-500 to-cyan-300',
        icon: <Crown className="w-5 h-5 text-cyan-300 animate-pulse fill-cyan-400/30" />,
        multiplierText: `${comboMultiplier.toFixed(2)}x POWER & WRATH`,
      };
    }
    if (comboCount >= 12) {
      return {
        rank: 'EXECUTIONER',
        subtitle: 'OCCULT RAMPAGE',
        badgeBg: 'bg-gradient-to-br from-purple-950/90 via-slate-950/95 to-purple-900/80',
        borderColor: 'border-purple-400/80',
        textColor: 'text-purple-300',
        glowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
        accentBg: 'bg-purple-500/20 text-purple-200 border-purple-400/50',
        meterColor: 'bg-gradient-to-r from-purple-600 to-purple-400',
        icon: <Zap className="w-5 h-5 text-purple-300 animate-bounce fill-purple-400/30" />,
        multiplierText: `${comboMultiplier.toFixed(2)}x WRATH MULTIPLIER`,
      };
    }
    if (comboCount >= 6) {
      return {
        rank: 'CARNAGE',
        subtitle: 'BLOOD FORGED',
        badgeBg: 'bg-gradient-to-br from-red-950/90 via-slate-950/95 to-red-900/80',
        borderColor: 'border-red-500/80',
        textColor: 'text-red-400',
        glowColor: 'shadow-[0_0_18px_rgba(239,68,68,0.35)]',
        accentBg: 'bg-red-500/20 text-red-200 border-red-500/50',
        meterColor: 'bg-gradient-to-r from-red-600 to-amber-500',
        icon: <Skull className="w-5 h-5 text-red-400 animate-pulse fill-red-500/20" />,
        multiplierText: `${comboMultiplier.toFixed(2)}x WRATH MULTIPLIER`,
      };
    }
    // Tier 1: 2 to 5 hits
    return {
      rank: 'RELENTLESS',
      subtitle: 'CHAINED ONSLAUGHT',
      badgeBg: 'bg-gradient-to-br from-amber-950/85 via-slate-950/95 to-stone-900/80',
      borderColor: 'border-amber-500/60',
      textColor: 'text-amber-400',
      glowColor: 'shadow-[0_0_14px_rgba(245,158,11,0.25)]',
      accentBg: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
      meterColor: 'bg-gradient-to-r from-amber-600 to-yellow-400',
      icon: <Swords className="w-5 h-5 text-amber-400" />,
      multiplierText: `${comboMultiplier.toFixed(2)}x WRATH MULTIPLIER`,
    };
  }, [comboCount, comboMultiplier]);

  const isExpiring = comboTimerPercent < 28;

  return (
    <div
      key={`combo-tier-${tierConfig.rank}`}
      className={`pointer-events-none transition-all duration-300 ${tierConfig.glowColor}`}
    >
      <div
        className={`relative overflow-hidden rounded-xl border backdrop-blur-md px-4 py-3 min-w-[210px] md:min-w-[250px] ${tierConfig.badgeBg} ${tierConfig.borderColor}`}
      >
        {/* Subtle decorative gothic corner highlights */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/40" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/40" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white/40" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/40" />

        {/* Top Header: Rank Title & Icon */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            {tierConfig.icon}
            <span
              className={`font-gothic font-extrabold text-xs md:text-sm tracking-widest uppercase ${tierConfig.textColor}`}
            >
              {tierConfig.rank}
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-tighter text-slate-400 uppercase">
            {tierConfig.subtitle}
          </span>
        </div>

        {/* Center: Punchy Hero Combo Hit Counter */}
        <div className="flex items-baseline justify-between pt-2 pb-1.5">
          <div className="flex items-baseline gap-1">
            <span
              key={`hit-${comboCount}`}
              className={`font-gothic font-black text-3xl md:text-4xl tabular-nums leading-none tracking-tight drop-shadow-md inline-block animate-scale-punch ${tierConfig.textColor}`}
            >
              {comboCount}
            </span>
            <span className="font-gothic font-bold text-xs md:text-sm text-slate-300 tracking-wider">
              HITS
            </span>
          </div>

          {/* Dynamic Active Multiplier Pill */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-tight shadow-sm ${tierConfig.accentBg}`}
          >
            <Sparkles className="w-3 h-3 animate-spin-slow" />
            <span>{tierConfig.multiplierText}</span>
          </div>
        </div>

        {/* Bottom: Dynamic Decay Timer Bar */}
        <div className="mt-1 w-full bg-black/60 rounded-full h-1.5 p-[1px] border border-white/10 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-75 ${tierConfig.meterColor} ${
              isExpiring ? 'animate-pulse' : ''
            }`}
            style={{ width: `${comboTimerPercent}%` }}
          />
        </div>

        {/* Warning pulse if combo is about to drop */}
        {isExpiring && (
          <div className="text-[9px] text-amber-400/90 font-mono text-right pt-0.5 tracking-tight animate-pulse">
            STRIKE NOW!
          </div>
        )}
      </div>
    </div>
  );
};
