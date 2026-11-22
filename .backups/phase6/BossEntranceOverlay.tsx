/**
 * The Seven Hellgates - Cinematic Boss Entrance Letterbox & Gothic Title Overlay
 * Renders obsidian widescreen letterbox bars, measured gradient scrim, realm-tinted
 * Cinzel title card, and accessible Space/Esc skip control.
 */

import React from 'react';
import { BossEntranceState } from '../game/vfx/BossEntranceDirector';

interface BossEntranceOverlayProps {
  entrance: BossEntranceState;
  onSkip: () => void;
}

export const BossEntranceOverlay: React.FC<BossEntranceOverlayProps> = ({ entrance, onSkip }) => {
  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between select-none overflow-hidden"
      role="dialog"
      aria-label={`${entrance.bossName} entrance sequence`}
    >
      {/* Top Widescreen Letterbox Curtain */}
      <div
        className="w-full h-[9vh] md:h-[11.5vh] bg-[#050508] border-b border-white/10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] translate-y-0"
      />

      {/* Bottom Scrim, Gothic Boss Title Card & Skip Action */}
      <div className="relative w-full">
        {/* Measured scrim behind title area ensuring high contrast against bright molten/void realms */}
        <div
          className={`w-full pt-16 pb-6 md:pb-8 px-6 md:px-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-opacity duration-500 ${
            entrance.titleVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            {/* Unboxed Editorial Gate & Epithet Kicker (no pills, no dots) */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm tracking-[0.22em] uppercase text-slate-300/90 mb-2">
              <span>{entrance.gateLabel}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span>{entrance.realmName}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-200/95">{entrance.bossTitle}</span>
            </div>

            {/* Primary Gothic Title */}
            <h1
              className="font-gothic font-bold text-slate-50 tracking-[0.14em] uppercase leading-tight [text-wrap:balance] drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]"
              style={{ fontSize: 'clamp(1.75rem, 3.6vw, 3.25rem)' }}
            >
              {entrance.bossName}
            </h1>

            {/* Realm-Calibrated Accent Rule */}
            <div
              className="mt-3 h-px w-44 md:w-64 transition-all duration-700"
              style={{
                background: `linear-gradient(90deg, transparent, ${entrance.accentHex}, transparent)`,
                boxShadow: `0 0 14px ${entrance.accentHex}88`,
              }}
            />
          </div>
        </div>

        {/* Bottom Widescreen Letterbox Curtain with Accessible Skip Control */}
        <div className="w-full h-[9vh] md:h-[11.5vh] bg-[#050508] border-t border-white/10 px-4 md:px-8 flex items-center justify-end pointer-events-auto">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-black/60 hover:bg-white/10 border border-white/15 text-xs font-medium text-slate-200 hover:text-white tracking-wide transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200 cursor-pointer"
          >
            Skip <span className="text-slate-400 ml-1.5 font-mono text-[11px]">Space / Esc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
