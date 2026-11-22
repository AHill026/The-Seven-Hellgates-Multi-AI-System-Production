/**
 * The Seven Hellgates - Cinematic Boss Entrance Letterbox & Gothic Title Overlay
 * Mandatory concise sequence presentation (non-skippable).
 */

import React from 'react';
import { BossEntranceState } from '../game/vfx/BossEntranceDirector';

interface BossEntranceSubtitle {
  speaker: string;
  speakerTitle?: string;
  text: string;
  accentColor?: string;
}

interface BossEntranceOverlayProps {
  entrance: BossEntranceState;
  subtitle?: BossEntranceSubtitle | null;
}

export const BossEntranceOverlay: React.FC<BossEntranceOverlayProps> = ({ entrance, subtitle }) => {
  const speakerColor = subtitle?.accentColor || entrance.accentHex || '#e2e8f0';

  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between select-none overflow-hidden"
      role="dialog"
      aria-label={`${entrance.bossName} entrance sequence`}
    >
      {/* Top Widescreen Letterbox Curtain + Spoken Entrance Subtitle */}
      <div className="w-full flex flex-col items-center">
        <div
          className="w-full h-[9vh] md:h-[11.5vh] bg-[#050508] border-b border-white/10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] translate-y-0"
        />
        {subtitle && (
          <div className="mt-4 mx-4 max-w-2xl px-6 py-2.5 rounded-xl bg-black/80 border border-white/15 shadow-2xl text-center animate-fadeIn">
            <div className="flex items-center justify-center gap-2 text-[11px] font-gothic font-bold uppercase tracking-[0.2em] mb-1">
              <span style={{ color: speakerColor }}>{subtitle.speaker}</span>
              {subtitle.speakerTitle && (
                <>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-slate-400 font-serif italic normal-case tracking-normal text-[11px]">
                    {subtitle.speakerTitle}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-100 font-serif italic leading-relaxed drop-shadow">
              "{subtitle.text}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Scrim, Gothic Boss Title Card & Matching Letterbox Curtain */}
      <div className="relative w-full">
        <div
          className={`w-full pt-16 pb-6 md:pb-8 px-6 md:px-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-opacity duration-500 ${
            entrance.titleVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm tracking-[0.22em] uppercase text-slate-300/90 mb-2">
              <span>{entrance.gateLabel}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span>{entrance.realmName}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-200/95">{entrance.bossTitle}</span>
            </div>

            <h1
              className="font-gothic font-bold text-slate-50 tracking-[0.14em] uppercase leading-tight [text-wrap:balance] drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]"
              style={{ fontSize: 'clamp(1.75rem, 3.6vw, 3.25rem)' }}
            >
              {entrance.bossName}
            </h1>

            <div
              className="mt-3 h-px w-44 md:w-64 transition-all duration-700"
              style={{
                background: `linear-gradient(90deg, transparent, ${entrance.accentHex}, transparent)`,
                boxShadow: `0 0 14px ${entrance.accentHex}88`,
              }}
            />
          </div>
        </div>

        <div className="w-full h-[9vh] md:h-[11.5vh] bg-[#050508] border-t border-white/10" />
      </div>
    </div>
  );
};
