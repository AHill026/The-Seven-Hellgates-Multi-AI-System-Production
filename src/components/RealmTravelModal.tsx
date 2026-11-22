/**
 * The Seven Hellgates - Realm Portal Travel Modal
 */

import React from 'react';
import { REALM_DEFINITIONS } from '../game/worlds/RealmBuilder';
import { Lock, Skull, CheckCircle2, X } from 'lucide-react';

interface RealmTravelModalProps {
  currentRealmId: number;
  unlockedRealms: number[];
  defeatedBosses: string[];
  onSelectRealm: (realmId: number) => void;
  onClose: () => void;
}

export const RealmTravelModal: React.FC<RealmTravelModalProps> = ({
  currentRealmId,
  unlockedRealms,
  defeatedBosses,
  onSelectRealm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-[#0c0d14] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl shadow-black/95 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 transition-colors"
          aria-label="Close Portal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-2xl font-bold font-gothic tracking-wider text-slate-100">
            The Seven Hellgates
          </h2>
          <p className="text-xs text-slate-400">Choose a realm of suffering to enter its supernatural domain</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {REALM_DEFINITIONS.map((def) => {
            const isUnlocked = unlockedRealms.includes(def.id);
            const isCurrent = currentRealmId === def.id;
            const isBossDefeated = defeatedBosses.includes(def.bossName);

            return (
              <div
                key={def.id}
                className={`relative p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500/50'
                    : isUnlocked
                    ? 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800 cursor-pointer'
                    : 'bg-black/40 border-slate-900 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (isUnlocked && !isCurrent) {
                    onSelectRealm(def.id);
                    onClose();
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-blue-400 border border-slate-800">
                      GATE {def.id}
                    </span>
                    <h3 className="font-bold text-sm text-slate-200 font-gothic">{def.name}</h3>
                  </div>

                  {isBossDefeated ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium text-[11px]">Ruler Slain</span>
                    </div>
                  ) : isUnlocked ? (
                    <div className="flex items-center gap-1 text-red-400 text-xs">
                      <Skull className="w-4 h-4" />
                      <span className="font-medium text-[11px]">{def.bossName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Lock className="w-4 h-4" />
                      <span className="text-[11px]">Sealed</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-blue-300/80 font-medium mb-1">{def.subtitle}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{def.description}</p>

                {isCurrent && (
                  <div className="mt-2.5 pt-2 border-t border-blue-500/20 text-xs text-blue-400 font-semibold flex items-center justify-between">
                    <span>Currently Inhabited</span>
                    <span className="text-[10px] text-slate-400">Battle active</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
