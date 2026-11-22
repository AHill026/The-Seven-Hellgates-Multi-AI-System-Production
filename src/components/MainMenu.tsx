/**
 * The Seven Hellgates - Main Menu & Codex
 */

import React, { useState, useEffect } from 'react';
import { PlayerData } from '../game/types';
import { hasSavedProgress } from '../game/storage';
import { audioManager } from '../audio/audio-manager';
import { Shield, Sword, Sparkles, X, Box, Volume2 } from 'lucide-react';
import { AudioSettingsModal } from './AudioSettingsModal';

interface MainMenuProps {
  playerData: PlayerData;
  onStartGame: () => void;
  onNewGame: () => void;
  onResetGame: () => void;
  onOpenBlenderStudio: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ playerData, onStartGame, onNewGame, onResetGame, onOpenBlenderStudio }) => {
  const [activeModal, setActiveModal] = useState<'lore' | 'controls' | 'credits' | 'audio' | 'confirmNewGame' | null>(null);
  const hasProgress = hasSavedProgress(playerData);

  useEffect(() => {
    // Play Awakening Theme with smooth fade in
    audioManager.playMainMenuMusic();
  }, []);

  const handleStart = () => {
    audioManager.init();
    audioManager.fadeOutMenuMusic(1.5);
    onStartGame();
  };

  const handleStartNewGame = () => {
    audioManager.init();
    audioManager.fadeOutMenuMusic(1.5);
    setActiveModal(null);
    onNewGame();
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#06070a] flex flex-col items-center justify-between p-6 select-none overflow-hidden">
      {/* Background dark gothic atmospheric gradients */}
      <div className="absolute inset-0 bg-radial from-blue-950/20 via-black/80 to-[#050608] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 w-full flex items-center justify-between max-w-4xl pt-4">
        <span className="text-xs uppercase font-mono tracking-widest text-slate-500">
          Dark Fantasy 3D Action RPG
        </span>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Three.js WebGL Engine</span>
        </div>
      </div>

      {/* Center Branding & Action Menu */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-gothic tracking-[0.2em] text-slate-100 drop-shadow-[0_0_35px_rgba(56,189,248,0.25)] mb-3">
          THE SEVEN HELLGATES
        </h1>

        <p className="text-xs sm:text-sm text-blue-300/80 font-sans tracking-wide max-w-md mx-auto mb-10 leading-relaxed">
          Seven supernatural gateways have consumed the realm. Awaken as Azrael, confront seven demonic rulers, and discover what lurks beyond the threshold.
        </p>

        {/* Buttons List */}
        <div className="flex flex-col gap-3 w-64 sm:w-72">
          {hasProgress ? (
            <>
              <button
                onClick={handleStart}
                className="w-full min-h-[46px] py-3.5 px-6 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-gothic tracking-[0.18em] text-sm font-bold uppercase rounded-xl shadow-xl shadow-blue-600/30 transition-all duration-150 hover:scale-[1.02] active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Continue Journey
              </button>

              <button
                onClick={() => setActiveModal('confirmNewGame')}
                className="w-full min-h-[44px] py-3 px-6 bg-slate-900/95 hover:bg-slate-800 text-cyan-200 border border-blue-500/45 hover:border-cyan-400/70 rounded-xl font-gothic tracking-[0.16em] text-xs font-bold uppercase transition-all duration-150 active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                New Game
              </button>
            </>
          ) : (
            <button
              onClick={handleStartNewGame}
              className="w-full min-h-[46px] py-3.5 px-6 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-gothic tracking-[0.18em] text-sm font-bold uppercase rounded-xl shadow-xl shadow-blue-600/30 transition-all duration-150 hover:scale-[1.02] active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              New Game
            </button>
          )}

          <button
            onClick={() => setActiveModal('controls')}
            className="w-full py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl font-gothic tracking-wider text-xs uppercase transition-all"
          >
            Combat & Controls
          </button>

          <button
            onClick={() => setActiveModal('lore')}
            className="w-full py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl font-gothic tracking-wider text-xs uppercase transition-all"
          >
            Codex & Lore ({playerData.loreDiscovered.length}/7)
          </button>

          <button
            onClick={onOpenBlenderStudio}
            className="w-full py-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 rounded-xl font-gothic tracking-wider text-xs uppercase transition-all flex items-center justify-center gap-2"
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>Blender 3D Studio</span>
          </button>

          <button
            onClick={() => setActiveModal('audio')}
            className="w-full py-2.5 bg-slate-900/90 hover:bg-slate-800 text-blue-300 border border-blue-900/60 hover:border-blue-700 rounded-xl font-gothic tracking-wider text-xs uppercase transition-all flex items-center justify-center gap-2"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Audio & Soundtrack</span>
          </button>

          <button
            onClick={() => setActiveModal('credits')}
            className="w-full py-2 bg-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
          >
            About & Tech
          </button>
        </div>
      </div>

      {/* Bottom status note */}
      <div className="relative z-10 text-[11px] font-mono text-slate-400 text-center pb-2">
        <span>Desktop: Mouse & Keyboard · Mobile: Virtual Touchstick & Action Buttons</span>
      </div>

      {/* MODAL: Controls & Combat Styles */}
      {activeModal === 'controls' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg bg-[#0c0d14] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold font-gothic mb-4 text-blue-400">Combat Styles & Controls</h3>

            <div className="space-y-3 text-xs mb-5">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="font-bold font-gothic text-blue-300 mb-1 flex items-center gap-1.5">
                  <Sword className="w-4 h-4" /> Reaper Stance
                </div>
                <p className="text-slate-400">Wield the runic Executioner Greatsword. Fluid 3-hit combo slashes, heavy overhead slams, and broad sweeping arcs.</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="font-bold font-gothic text-amber-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Executioner Stance
                </div>
                <p className="text-slate-400">Hellforged spiked gauntlets. High-speed close-quarters punches, shockwave ground pounds, and high stagger damage.</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="font-bold font-gothic text-cyan-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Wrath Unbound
                </div>
                <p className="text-slate-400">Supernatural awakening once the Wrath meter reaches capacity. Enormous damage escalation and blue-white aura.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-black/40 p-3 rounded-xl border border-slate-800/80 mb-5">
              <div><strong className="text-slate-200">WASD:</strong> Movement</div>
              <div><strong className="text-slate-200">Space:</strong> Dodge Roll (i-frames)</div>
              <div><strong className="text-slate-200">LMB:</strong> Light Attack Combo</div>
              <div><strong className="text-slate-200">RMB:</strong> Heavy Overhead Slam</div>
              <div><strong className="text-slate-200">Q:</strong> Switch Combat Stance</div>
              <div><strong className="text-slate-200">E:</strong> Quake Strike</div>
              <div><strong className="text-slate-200">R:</strong> Wrath Awakening</div>
              <div><strong className="text-slate-200">Tab:</strong> Target Lock-On</div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Codex & Lore */}
      {activeModal === 'lore' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg bg-[#0c0d14] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold font-gothic mb-2 text-blue-400">Recovered Lore Fragments</h3>
            <p className="text-xs text-slate-400 mb-4">Fragments of Azrael's past uncovered by slaying realm commanders.</p>

            {playerData.loreDiscovered.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-8 text-center">
                No memories have yet been restored. Defeat the ruler of Realm I (The Hollow King) to begin uncovering your past.
              </p>
            ) : (
              <div className="space-y-3 mb-5">
                {playerData.loreDiscovered.map((title, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold font-gothic text-blue-300 block mb-1">{title}</span>
                    <span className="text-[11px] text-slate-400">Memory restored to Azrael's consciousness.</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Close Codex
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Credits */}
      {activeModal === 'credits' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-[#0c0d14] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl text-center">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold font-gothic mb-2 text-blue-400">The Seven Hellgates</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              An original dark fantasy 3D action RPG built entirely with Three.js, WebGL, Web Audio API, and React.
              Featuring procedural articulated kinematics, volumetric fog, dynamic lighting, and mobile touch optimization.
            </p>

            <div className="flex justify-center gap-3 mb-5">
              <button
                onClick={() => {
                  onResetGame();
                  setActiveModal(null);
                }}
                className="px-4 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-900/60 rounded-lg"
              >
                Reset Save Data
              </button>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Confirm New Game */}
      {activeModal === 'confirmNewGame' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-[#0c0d14] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl text-center">
            <button
              onClick={() => setActiveModal(null)}
              aria-label="Close confirmation"
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold font-gothic mb-2 text-blue-300">Start New Game?</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Your current realm progress, level ({playerData.level}), embers ({playerData.embers.toLocaleString()}), and recovered relics will be reset.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 min-h-[44px] py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleStartNewGame}
                className="flex-1 min-h-[44px] py-2.5 px-4 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white rounded-xl text-xs font-gothic font-bold tracking-wider uppercase transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Start New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Audio & Music Settings */}
      <AudioSettingsModal
        isOpen={activeModal === 'audio'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};
