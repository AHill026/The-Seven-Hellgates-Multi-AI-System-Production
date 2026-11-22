/**
 * THE SEVEN HELLGATES — Reusable Audio Settings Panel
 * Shared between AudioSettingsModal (HUD/Main Menu) and PauseMenuModal (Escape).
 * Includes dedicated Sound Effects (SFX) On/Off toggle, Master, Music, SFX, Ambience, and Voice controls.
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Zap, Wind, Play, Mic } from 'lucide-react';
import { audioManager, AudioSettings } from '../audio/audio-manager';
import { voiceManager } from '../game/audio/VoiceManager';

interface AudioSettingsPanelProps {
  compact?: boolean;
}

export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({ compact = false }) => {
  const [settings, setSettings] = useState<AudioSettings>({ ...audioManager.settings });

  useEffect(() => {
    setSettings({ ...audioManager.settings });
    return audioManager.subscribe(() => {
      setSettings({ ...audioManager.settings });
    });
  }, []);

  const handleMasterChange = (val: number) => {
    audioManager.setMasterVolume(val);
  };

  const handleMusicChange = (val: number) => {
    audioManager.setMusicVolume(val);
  };

  const handleSfxChange = (val: number) => {
    audioManager.setSfxVolume(val);
  };

  const handleToggleSfx = () => {
    const enabled = audioManager.toggleSfx();
    if (enabled && !audioManager.settings.isMuted) {
      audioManager.playSwordSwing(0.85);
    }
  };

  const handleAmbientChange = (val: number) => {
    audioManager.setAmbientVolume(val);
  };

  const handleVoiceChange = (val: number) => {
    audioManager.setVoiceVolume(val);
  };

  const handleToggleMute = () => {
    const muted = audioManager.toggleMute();
    if (muted) {
      voiceManager.stopAll();
    }
  };

  const sfxDisabled = settings.isMuted || !settings.sfxEnabled;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Master Mute & Dedicated SFX Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleToggleMute}
          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border text-left transition-all duration-150 ${
            settings.isMuted
              ? 'bg-red-950/75 hover:bg-red-900/80 border-red-500/60 text-red-200'
              : 'bg-emerald-950/70 hover:bg-emerald-900/75 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {settings.isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-bold font-gothic tracking-wider block whitespace-nowrap">
                {settings.isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {settings.isMuted ? 'Tap to unmute all' : 'All buses unmuted'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10 shrink-0">
            {settings.isMuted ? 'OFF' : 'ON'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleToggleSfx}
          disabled={settings.isMuted}
          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border text-left transition-all duration-150 disabled:opacity-50 ${
            settings.sfxEnabled
              ? 'bg-cyan-950/70 hover:bg-cyan-900/75 border-cyan-500/50 text-cyan-200'
              : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Zap
              className={`w-4 h-4 shrink-0 ${
                settings.sfxEnabled ? 'text-cyan-400' : 'text-slate-500'
              }`}
            />
            <div className="min-w-0">
              <span className="text-[11px] font-bold font-gothic tracking-wider block whitespace-nowrap">
                SOUND EFFECTS
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {settings.sfxEnabled ? 'Combat & UI SFX active' : 'Combat SFX disabled'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10 shrink-0">
            {settings.sfxEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Volume Sliders */}
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {/* Master Volume */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold font-sans">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" /> Master Volume
            </span>
            <span className="text-slate-300 tabular-nums">
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
            aria-label="Master Volume"
            className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-45"
          />
        </div>

        {/* Music Volume */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold font-sans">
              <Music className="w-3.5 h-3.5 text-amber-400" /> Background Music
            </span>
            <span className="text-slate-300 tabular-nums">
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
            aria-label="Background Music Volume"
            className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-45"
          />
        </div>

        {/* SFX Volume */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold font-sans">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> Sound Effects Level
            </span>
            <span className="text-slate-300 tabular-nums">
              {settings.sfxEnabled ? `${Math.round(settings.sfx * 100)}%` : 'OFF'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.sfx}
            onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
            disabled={sfxDisabled}
            aria-label="Sound Effects Volume"
            className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-45"
          />
        </div>

        {/* Ambient Volume */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold font-sans">
              <Wind className="w-3.5 h-3.5 text-indigo-400" /> Environmental Ambience
            </span>
            <span className="text-slate-300 tabular-nums">
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
            aria-label="Environmental Ambience Volume"
            className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-45"
          />
        </div>

        {/* Voice / Dialogue Volume */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold font-sans">
              <Mic className="w-3.5 h-3.5 text-sky-400" /> Character Voices & Dialogue
            </span>
            <span className="text-slate-300 tabular-nums">
              {Math.round((settings.voice ?? 0.9) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.voice ?? 0.9}
            onChange={(e) => handleVoiceChange(parseFloat(e.target.value))}
            disabled={settings.isMuted}
            aria-label="Character Voices Volume"
            className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-45"
          />
        </div>
      </div>

      {/* Quick Test SFX & Voice Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => audioManager.playSwordSwing(1.0)}
          disabled={sfxDisabled}
          className="flex items-center justify-center gap-1.5 min-h-[38px] py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-all active:scale-95 disabled:opacity-45 whitespace-nowrap"
        >
          <Play className="w-3 h-3 text-cyan-400 fill-cyan-400 shrink-0" /> Test Swing
        </button>
        <button
          type="button"
          onClick={() => audioManager.playHitImpact(true)}
          disabled={sfxDisabled}
          className="flex items-center justify-center gap-1.5 min-h-[38px] py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-all active:scale-95 disabled:opacity-45 whitespace-nowrap"
        >
          <Play className="w-3 h-3 text-red-400 fill-red-400 shrink-0" /> Test Impact
        </button>
        <button
          type="button"
          onClick={() =>
            voiceManager.playLine({
              character: 'azrael',
              text: 'The seals fracture... yet cold iron remembers its oath.',
              priority: 'story',
              emotion: 'determination',
              intensity: 'intense',
            })
          }
          disabled={settings.isMuted}
          className="flex items-center justify-center gap-1.5 min-h-[38px] py-1.5 bg-slate-900 hover:bg-slate-800 border border-sky-800/70 rounded-lg text-xs font-semibold text-sky-200 transition-all active:scale-95 disabled:opacity-45 whitespace-nowrap"
        >
          <Mic className="w-3 h-3 text-sky-400 shrink-0" /> Test Azrael
        </button>
        <button
          type="button"
          onClick={() =>
            voiceManager.playLine({
              character: 'hollow_king',
              text: 'Azrael... you wander once more into the shadow of the Seal.',
              priority: 'story',
              intensity: 'intense',
            })
          }
          disabled={settings.isMuted}
          className="flex items-center justify-center gap-1.5 min-h-[38px] py-1.5 bg-slate-900 hover:bg-slate-800 border border-indigo-800/70 rounded-lg text-xs font-semibold text-indigo-200 transition-all active:scale-95 disabled:opacity-45 whitespace-nowrap"
        >
          <Mic className="w-3 h-3 text-indigo-400 shrink-0" /> Test Hollow King
        </button>
      </div>
    </div>
  );
};
