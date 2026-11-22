/**
 * The Seven Hellgates - Altar of Ash Progression Modal
 */

import React from 'react';
import { PlayerData } from '../game/types';
import { Flame, Shield, Zap, Sword, Sparkles, X } from 'lucide-react';

interface AltarModalProps {
  playerData: PlayerData;
  onUpgrade: (stat: keyof PlayerData['stats']) => void;
  onClose: () => void;
}

export const AltarModal: React.FC<AltarModalProps> = ({ playerData, onUpgrade, onClose }) => {
  const upgradeCost = 50 + playerData.level * 25;
  const canAfford = playerData.embers >= upgradeCost;

  const stats = [
    {
      key: 'vitality' as const,
      label: 'Vitality',
      desc: `Increases Maximum Health (+15 HP, currently ${100 + playerData.stats.vitality * 15} HP) and restores full Health immediately`,
      value: playerData.stats.vitality,
      icon: Shield,
      color: 'text-red-400',
    },
    {
      key: 'vigor' as const,
      label: 'Vigor',
      desc: 'Increases Maximum Stamina & Regen rate (+10 Stamina)',
      value: playerData.stats.vigor,
      icon: Zap,
      color: 'text-amber-400',
    },
    {
      key: 'strength' as const,
      label: 'Strength',
      desc: 'Increases Greatsword & Gauntlet strike damage',
      value: playerData.stats.strength,
      icon: Sword,
      color: 'text-blue-400',
    },
    {
      key: 'arcane' as const,
      label: 'Arcane',
      desc: 'Enhances Wrath buildup speed and Supernatural flame',
      value: playerData.stats.arcane,
      icon: Sparkles,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-[#0d0e15] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl shadow-black/90">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 transition-colors"
          aria-label="Close Altar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-950/60 border border-blue-500/30 rounded-xl text-blue-400">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-gothic tracking-wider text-slate-100">
              Altar of Ash
            </h2>
            <p className="text-xs text-slate-400">Channel Hellgate Embers to empower Azrael's vessel</p>
          </div>
        </div>

        {/* Level and Embers Bar */}
        <div className="flex items-center justify-between p-3.5 bg-black/50 border border-slate-800/80 rounded-xl my-4">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-widest block font-medium">Vessel Level</span>
            <span className="text-xl font-bold font-gothic text-blue-400">Level {playerData.level}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-widest block font-medium">Held Embers</span>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-lg">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{playerData.embers.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Upgrade Cost Notice */}
        <div className="text-xs text-slate-400 mb-4 flex items-center justify-between">
          <span>Cost to Ascend:</span>
          <span className={`font-semibold ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
            {upgradeCost.toLocaleString()} Embers
          </span>
        </div>

        {/* Stat Rows */}
        <div className="space-y-3 mb-6">
          {stats.map(({ key, label, desc, value, icon: Icon, color }) => (
            <div
              key={key}
              className="flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/70 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-black/40 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{label}</span>
                    <span className="text-xs text-blue-400 font-mono">[{value}]</span>
                  </div>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </div>

              <button
                onClick={() => onUpgrade(key)}
                disabled={!canAfford}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  canAfford
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                + Upgrade
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors"
        >
          Return to Battle
        </button>
      </div>
    </div>
  );
};
