/**
 * THE SEVEN HELLGATES — Escape Pause Menu
 * Centralizes Resume, Audio Settings (SFX toggle, Music, Master),
 * Seven-Realm Weather toggles (Ash Storm, Ember Mist, Void Silence),
 * UE5 Graphics Preset controls, and Journey Actions.
 */

import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Compass,
  Sparkles,
  CloudFog,
  Flame,
  Moon,
  X,
  Volume2,
  Sword,
} from 'lucide-react';
import { GraphicsPreset, GameUIState } from '../game/HellgatesGame';
import {
  WEATHER_DESCRIPTORS,
  WEATHER_ORDER,
  WeatherState,
} from '../game/vfx/WeatherSystem';
import { AudioSettingsPanel } from './AudioSettingsPanel';

interface PauseMenuModalProps {
  uiState: GameUIState;
  onResume: () => void;
  onSetWeather: (state: WeatherState) => void;
  onSetGraphicsPreset: (preset: GraphicsPreset) => void;
  onUnstuck: () => void;
  onRestart: () => void;
  onNewGame: () => void;
}

const WEATHER_ICONS: Record<WeatherState, React.ReactNode> = {
  ash_storm: <CloudFog className="w-4 h-4 shrink-0" />,
  ember_mist: <Flame className="w-4 h-4 shrink-0" />,
  void_silence: <Moon className="w-4 h-4 shrink-0" />,
};

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  uiState,
  onResume,
  onSetWeather,
  onSetGraphicsPreset,
  onUnstuck,
  onRestart,
  onNewGame,
}) => {
  const [confirmingNewGame, setConfirmingNewGame] = useState(false);

  const activeWeather = WEATHER_DESCRIPTORS[uiState.weatherState];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
    >
      <div className="relative w-full max-w-3xl bg-[#0b0d14] border border-blue-900/60 rounded-2xl p-5 md:p-6 text-slate-100 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/90 mb-5">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-400 block">
              Realm {uiState.currentRealm.id} · {uiState.currentRealm.name}
            </span>
            <h2 className="text-xl md:text-2xl font-bold font-gothic tracking-[0.16em] text-slate-100 uppercase">
              Game Paused
            </h2>
          </div>

          <button
            type="button"
            onClick={onResume}
            className="min-h-[44px] px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white rounded-xl text-xs font-gothic font-bold tracking-wider uppercase flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-white shrink-0" />
            <span>Resume [Esc]</span>
          </button>
        </div>

        {/* Two-column desktop layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column: Audio Settings */}
          <div className="bg-[#090b10] border border-slate-800/90 rounded-xl p-4">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800/80">
              <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
              <h3 className="text-xs font-gothic font-bold tracking-[0.16em] uppercase text-slate-200">
                Audio Settings
              </h3>
            </div>
            <AudioSettingsPanel compact />
          </div>

          {/* Right Column: Weather, Graphics & Realm Actions */}
          <div className="flex flex-col justify-between gap-4">
            {/* Weather System */}
            <div className="bg-[#090b10] border border-slate-800/90 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <CloudFog className="w-4 h-4 text-amber-400 shrink-0" />
                  <h3 className="text-xs font-gothic font-bold tracking-[0.16em] uppercase text-slate-200">
                    Realm Weather
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Hotkey [G]</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {WEATHER_ORDER.map((stateKey) => {
                  const desc = WEATHER_DESCRIPTORS[stateKey];
                  const selected = uiState.weatherState === stateKey;
                  return (
                    <button
                      key={stateKey}
                      type="button"
                      onClick={() => onSetWeather(stateKey)}
                      className={`min-h-[44px] px-2 py-2 rounded-lg border text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
                        selected
                          ? 'bg-slate-800 text-white border-cyan-400 shadow-md shadow-cyan-950/50'
                          : 'bg-slate-900/70 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      <span style={{ color: selected ? desc.accentHex : undefined }}>
                        {WEATHER_ICONS[stateKey]}
                      </span>
                      <span className="whitespace-nowrap">{desc.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activeWeather.description}
              </p>
            </div>

            {/* Graphics Quality */}
            <div className="bg-[#090b10] border border-slate-800/90 rounded-xl p-4">
              <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-800/80">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <h3 className="text-xs font-gothic font-bold tracking-[0.16em] uppercase text-slate-200">
                  UE5 Rendering Preset
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'ultra', label: 'UE5 Ultra' },
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'low', label: 'Low' },
                  ] as const
                ).map((p) => {
                  const active = uiState.graphicsPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSetGraphicsPreset(p.id)}
                      className={`min-h-[44px] px-2.5 py-2 rounded-lg border text-xs font-mono font-semibold transition-all duration-150 whitespace-nowrap ${
                        active
                          ? 'bg-cyan-950/75 text-cyan-200 border-cyan-400'
                          : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Utility Actions */}
            <div className="bg-[#090b10] border border-slate-800/90 rounded-xl p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUnstuck();
                    onResume();
                  }}
                  className="min-h-[44px] px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-cyan-200 flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Unstuck [U]</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onRestart();
                    onResume();
                  }}
                  className="min-h-[44px] px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Restart Realm</span>
                </button>
              </div>

              {!confirmingNewGame ? (
                <button
                  type="button"
                  onClick={() => setConfirmingNewGame(true)}
                  className="w-full min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-600/60 rounded-lg text-xs font-gothic font-bold tracking-wider uppercase text-slate-300 hover:text-red-200 flex items-center justify-center gap-2 transition-all whitespace-nowrap"
                >
                  <Sword className="w-3.5 h-3.5 shrink-0" />
                  <span>Start New Game</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingNewGame(false);
                      onNewGame();
                    }}
                    className="flex-1 min-h-[44px] px-3 py-2 bg-red-800 hover:bg-red-700 text-white border border-red-500 rounded-lg text-xs font-gothic font-bold tracking-wider uppercase transition-all whitespace-nowrap"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingNewGame(false)}
                    className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all whitespace-nowrap"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
