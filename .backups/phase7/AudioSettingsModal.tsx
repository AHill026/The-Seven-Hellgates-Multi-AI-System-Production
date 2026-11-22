/**
 * THE SEVEN HELLGATES — Audio Settings Modal
 * Sliders for Master, Music, Sound Effects, and Ambient volumes.
 * Mute toggle, sound preview, and persistence via localStorage.
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Zap, Wind, X, Play } from 'lucide-react';
import { audioManager, AudioSettings } from '../audio/audio-manager';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>({ ...audioManager.settings });

  useEffect(() => {
    if (isOpen) {
      setSettings({ ...audioManager.settings });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMasterChange = (val: number) => {
    audioManager.setMasterVolume(val);
    setSettings({ ...audioManager.settings });
  };

  const handleMusicChange = (val: number) => {
    audioManager.setMusicVolume(val);
    setSettings({ ...audioManager.settings });
  };

  const handleSfxChange = (val: number) => {
    audioManager.setSfxVolume(val);
    setSettings({ ...audioManager.settings });
  };

  const handleAmbientChange = (val: number) => {
    audioManager.setAmbientVolume(val);
    setSettings({ ...audioManager.settings });
  };

  const handleToggleMute = () => {
    audioManager.toggleMute();
    setSettings({ ...audioManager.settings });
  };

  const testSfx = () => {
    audioManager.playSwordSwing(1.0);
  };

  const testImpact = () => {
    audioManager.playHitImpact(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0c0d14] border border-blue-900/60 rounded-2xl p-6 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold font-gothic tracking-wider text-slate-100 uppercase">
              Audio & Soundtrack Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mute Toggle Banner */}
        <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            {settings.isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <span className="text-xs font-bold font-gothic block text-slate-200">
                {settings.isMuted ? 'AUDIO MUTED' : 'AUDIO ENABLED'}
              </span>
              <span className="text-[10px] text-slate-400 font-sans">
                {settings.isMuted ? 'All soundtrack and sound effects silenced' : 'Pristine Web Audio spatial mix active'}
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleMute}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-gothic tracking-wider transition-all ${
              settings.isMuted
                ? 'bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200'
                : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200'
            }`}
          >
            {settings.isMuted ? 'UNMUTE' : 'MUTE'}
          </button>
        </div>

        {/* Volume Sliders */}
        <div className="space-y-4 mb-6">
          {/* Master Volume */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold font-sans">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" /> Master Volume
              </span>
              <span className="text-slate-400 tabular-nums">
                {Math.round(settings.master * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.master}
              onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
              disabled={settings.isMuted}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold font-sans">
                <Music className="w-3.5 h-3.5 text-amber-400" /> Soundtrack & Themes
              </span>
              <span className="text-slate-400 tabular-nums">
                {Math.round(settings.music * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.music}
              onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
              disabled={settings.isMuted}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold font-sans">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> Sound Effects (SFX)
              </span>
              <span className="text-slate-400 tabular-nums">
                {Math.round(settings.sfx * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.sfx}
              onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
              disabled={settings.isMuted}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Ambient Volume */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold font-sans">
                <Wind className="w-3.5 h-3.5 text-indigo-400" /> Environmental Ambience
              </span>
              <span className="text-slate-400 tabular-nums">
                {Math.round(settings.ambient * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.ambient}
              onChange={(e) => handleAmbientChange(parseFloat(e.target.value))}
              disabled={settings.isMuted}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Test SFX Buttons */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={testSfx}
            disabled={settings.isMuted}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" /> Test Swing
          </button>
          <button
            onClick={testImpact}
            disabled={settings.isMuted}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3 h-3 text-red-400 fill-red-400" /> Test Impact
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white rounded-xl text-xs font-gothic tracking-wider font-bold uppercase transition-all shadow-lg active:scale-95"
        >
          Confirm Settings
        </button>
      </div>
    </div>
  );
};
