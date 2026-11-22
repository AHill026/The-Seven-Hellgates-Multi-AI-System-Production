/**
 * The Seven Hellgates - The White-Eyed God Climactic Reveal
 * Full 3D director reveal over the live WebGL WhiteEyedGodEncounter void stage,
 * with transparent typography, whisper subtitle, blackout transition, and New Game+ CTA.
 */

import React from 'react';
import { WhiteEyedGodStage } from '../game/cinematics/types';

interface WhiteEyedGodCutsceneProps {
  stage?: WhiteEyedGodStage;
  onRestart: () => void;
}

export const WhiteEyedGodCutscene: React.FC<WhiteEyedGodCutsceneProps> = ({
  stage = 'stare',
  onRestart,
}) => {
  const isBlackoutOrTitle = stage === 'cutToBlack' || stage === 'titleReveal';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden text-center transition-colors duration-1000 ${
        isBlackoutOrTitle
          ? 'bg-black pointer-events-auto'
          : 'bg-transparent pointer-events-none'
      }`}
    >
      {/* Subtle perimeter vignette during live 3D gaze so cosmic darkness breathes */}
      {!isBlackoutOrTitle && (
        <div
          className={`absolute inset-0 bg-radial from-transparent via-black/40 to-black/95 pointer-events-none transition-opacity duration-1000 ${
            stage === 'dissolve' ? 'opacity-65' : 'opacity-100'
          }`}
        />
      )}

      {/* 1. Whispered Subtitle over live 3D Glowing White Eyes */}
      {stage === 'whisper' && (
        <div className="absolute bottom-24 md:bottom-28 z-20 px-6 transition-opacity duration-700 opacity-95">
          <p className="text-xl md:text-2xl font-gothic italic tracking-[0.3em] text-white/95 drop-shadow-[0_0_16px_rgba(255,255,255,0.75)]">
            “Azrael…”
          </p>
        </div>
      )}

      {/* 2. Title Card & Sequel Teaser */}
      {stage === 'titleReveal' && (
        <div className="relative z-20 flex flex-col items-center justify-center p-6 max-w-xl mx-auto animate-fadeIn">
          <h1 className="text-3xl md:text-5xl font-black font-gothic tracking-[0.25em] text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] mb-3">
            THE SEVEN HELLGATES
          </h1>

          <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent my-6" />

          <p className="text-lg md:text-xl font-bold font-gothic tracking-[0.2em] text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)] mb-4">
            FACE YOUR FINAL JUDGMENT.
          </p>

          <p className="text-xs md:text-sm text-slate-400 font-sans tracking-wide leading-relaxed max-w-md mb-8">
            The seven demonic rulers have fallen. Yet beyond the threshold of creation, the White-Eyed God has awakened.
            Azrael's forgotten origin and true purpose await in the sequel.
          </p>

          <button
            type="button"
            onClick={onRestart}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-500 rounded-xl font-gothic tracking-widest text-xs uppercase transition-all shadow-xl hover:shadow-blue-900/30 active:scale-95 cursor-pointer"
          >
            Awaken Once More (New Game +)
          </button>
        </div>
      )}
    </div>
  );
};
