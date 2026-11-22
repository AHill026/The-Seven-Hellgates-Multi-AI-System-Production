/**
 * The Seven Hellgates - Story Sequence Widescreen Letterbox & Skip Overlay (STORY ONLY)
 */

import React from 'react';
import { CinematicUIState } from '../game/cinematics/types';

interface CinematicOverlayProps {
  cinematic: CinematicUIState;
  subtitle?: {
    speaker: string;
    speakerTitle?: string;
    text: string;
    accentColor?: string;
  } | null;
  onSkipStory: () => void;
}

export const CinematicOverlay: React.FC<CinematicOverlayProps> = ({
  cinematic,
  subtitle,
  onSkipStory,
}) => {
  if (!cinematic.isActive || cinematic.kind !== 'story') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between select-none overflow-hidden"
      role="dialog"
      aria-label={cinematic.title ? `${cinematic.title} story sequence` : 'Story cutscene'}
    >
      {/* Top Widescreen Bar & Optional Subtitle */}
      <div className="w-full flex flex-col items-center">
        {cinematic.showLetterbox && (
          <div className="w-full h-[8vh] md:h-[10vh] bg-[#050508] border-b border-white/10" />
        )}
        {subtitle && (
          <div className="mt-4 mx-4 max-w-2xl px-6 py-2.5 rounded-xl bg-black/80 border border-white/15 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] font-gothic font-bold uppercase tracking-[0.2em] mb-1">
              <span style={{ color: subtitle.accentColor || '#7dd3fc' }}>{subtitle.speaker}</span>
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

      {/* Bottom Realm / Event Label + Story-Only Skip Control */}
      <div className="w-full">
        {cinematic.title && cinematic.progress >= 0.1 && cinematic.progress <= 0.85 && (
          <div className="w-full pb-5 px-6 text-center">
            {cinematic.subtitleLabel && (
              <span className="block text-[11px] font-mono uppercase tracking-[0.24em] text-slate-300/80 mb-1">
                {cinematic.subtitleLabel}
              </span>
            )}
            <h2 className="font-gothic font-bold text-xl md:text-3xl tracking-[0.18em] uppercase text-slate-100 drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)]">
              {cinematic.title}
            </h2>
          </div>
        )}

        {cinematic.showLetterbox && (
          <div className="w-full h-[8vh] md:h-[10vh] bg-[#050508] border-t border-white/10 px-4 md:px-8 flex items-center justify-end pointer-events-auto">
            {cinematic.canSkip && (
              <button
                type="button"
                onClick={onSkipStory}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-black/60 hover:bg-white/10 border border-white/15 text-xs font-medium text-slate-200 hover:text-white tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Skip <span className="text-slate-400 ml-1.5 font-mono text-[11px]">Space</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
