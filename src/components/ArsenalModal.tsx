/**
 * Project Sevenfold - Hybrid Arsenal & Seal Resonance Modal
 * Allows Azrael to inspect collected Legendary Seal Weapons, equip his physical weapon,
 * invest Embers into 6 weapon mastery tracks, and view Seal Resonance progression.
 */

import React, { useState } from 'react';
import { Flame, Lock, Check, Sword, Sparkles, X, AlertTriangle } from 'lucide-react';
import { PlayerData, WeaponId, WeaponUpgradeTrack } from '../game/types';
import {
  SEVENFOLD_WEAPONS,
  WEAPON_UPGRADE_TRACKS,
  getWeaponEffectiveStats,
  getWeaponUpgradeCost,
  getSealResonanceInfo,
  CROSS_WEAPON_SYNERGIES,
} from '../game/arsenal/WeaponRegistry';

interface ArsenalModalProps {
  playerData: PlayerData;
  onEquipWeapon: (id: WeaponId) => void;
  onUpgradeWeapon: (id: WeaponId, track: WeaponUpgradeTrack) => void;
  onClose: () => void;
}

export const ArsenalModal: React.FC<ArsenalModalProps> = ({
  playerData,
  onEquipWeapon,
  onUpgradeWeapon,
  onClose,
}) => {
  const { unlockedWeapons, equippedWeaponId, weaponUpgrades } = playerData.arsenal;
  const [selectedId, setSelectedId] = useState<WeaponId>(equippedWeaponId || 'kings_remnant');

  const selectedWeapon =
    SEVENFOLD_WEAPONS.find((w) => w.id === selectedId) || SEVENFOLD_WEAPONS[0];
  const isSelectedUnlocked = unlockedWeapons.includes(selectedWeapon.id);
  const isSelectedEquipped = equippedWeaponId === selectedWeapon.id;
  const selectedUpgrades = weaponUpgrades[selectedWeapon.id];
  const effectiveStats = getWeaponEffectiveStats(selectedWeapon.id, selectedUpgrades);
  const resonance = getSealResonanceInfo(unlockedWeapons.length);

  const relevantSynergies = CROSS_WEAPON_SYNERGIES.filter(
    (s) =>
      (s.physicalWeapon === selectedWeapon.id || s.manifestWeapon === selectedWeapon.id) &&
      unlockedWeapons.includes(s.physicalWeapon) &&
      unlockedWeapons.includes(s.manifestWeapon)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-md p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#0b0c12] border border-slate-800 rounded-2xl text-slate-100 shadow-2xl shadow-black overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-bold font-gothic tracking-wider text-slate-100">
              Project Sevenfold — Hybrid Arsenal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Wield one physical Seal Weapon; manifest collected relics via [V] and awaken Convergence via [X] at 7 Seals.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm tabular-nums">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{playerData.embers.toLocaleString()} Embers</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
              aria-label="Close Arsenal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Seal Resonance Strip */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-black/30 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-gothic font-bold tracking-wider text-cyan-300">
              {resonance.title}
            </span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-300">
              {unlockedWeapons.length} / 7 Seals Unsealed
            </span>
          </div>
          <p className="text-xs italic font-serif text-slate-400">
            "{resonance.whisper}"
          </p>
        </div>

        {/* Main Split Content */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: 7 Weapon Slots */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 divide-y divide-slate-800/50">
            {SEVENFOLD_WEAPONS.map((weapon) => {
              const unlocked = unlockedWeapons.includes(weapon.id);
              const equipped = equippedWeaponId === weapon.id;
              const selected = selectedWeapon.id === weapon.id;

              return (
                <button
                  key={weapon.id}
                  onClick={() => setSelectedId(weapon.id)}
                  className={`w-full text-left px-5 py-3.5 transition-colors flex items-center justify-between gap-3 ${
                    selected
                      ? 'bg-slate-900/90 text-white'
                      : 'hover:bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                      <span>[{weapon.slotIndex}]</span>
                      <span aria-hidden="true">·</span>
                      <span>Realm {weapon.realmId}: {weapon.realmName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {unlocked ? (
                        <span
                          className="font-gothic font-bold text-sm truncate"
                          style={{ color: selected ? weapon.accentCssColor : undefined }}
                        >
                          {weapon.name}
                        </span>
                      ) : (
                        <span className="font-gothic text-sm text-slate-500 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                          Sealed Relic
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {unlocked ? (
                        <>
                          {weapon.classLabel}
                          {weapon.isProvisionalLore ? ' · [PROVISIONAL]' : ''}
                        </>
                      ) : (
                        `Defeat ${weapon.sovereignName}`
                      )}
                    </div>
                  </div>

                  {equipped && (
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold shrink-0 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Equipped
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Relic Inspection & Upgrades */}
          <div className="lg:col-span-8 p-6 space-y-6">
            {!isSelectedUnlocked ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <Lock className="w-10 h-10 text-slate-600 mb-3" />
                <h3 className="text-lg font-gothic font-bold text-slate-300 tracking-wider">
                  Sealed Sovereign Relic — Slot [{selectedWeapon.slotIndex}]
                </h3>
                <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
                  This fragment of the Sevenfold Seal remains bound within Realm {selectedWeapon.realmId} ({selectedWeapon.realmName}).
                  Defeat <span className="text-slate-200 font-medium">{selectedWeapon.sovereignName}</span> to unseal its form, abilities, and manifestation power.
                </p>
              </div>
            ) : (
              <>
                {/* Weapon Title & Equip Action */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>Hotkey [{selectedWeapon.slotIndex}]</span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedWeapon.classLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>Realm {selectedWeapon.realmId}</span>
                    </div>
                    <h3
                      className="text-2xl font-gothic font-bold tracking-wider mt-1"
                      style={{ color: selectedWeapon.accentCssColor }}
                    >
                      {selectedWeapon.name}
                    </h3>
                    {selectedWeapon.isProvisionalLore && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>[PROVISIONAL] Lore & Sovereign encounter placeholder awaiting final canon</span>
                      </div>
                    )}
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      {selectedWeapon.description}
                    </p>
                    <p className="text-xs italic font-serif text-slate-400 mt-1.5">
                      "{selectedWeapon.loreHint}"
                    </p>
                  </div>

                  <button
                    onClick={() => onEquipWeapon(selectedWeapon.id)}
                    disabled={isSelectedEquipped}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-2 ${
                      isSelectedEquipped
                        ? 'bg-slate-800 text-cyan-300 cursor-default border border-cyan-500/40'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 active:scale-95'
                    }`}
                  >
                    <Sword className="w-3.5 h-3.5" />
                    <span>{isSelectedEquipped ? 'Currently Wielded' : 'Equip Physical Weapon'}</span>
                  </button>
                </div>

                {/* Stats Summary Grid */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Effective Combat Profile
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs py-3 border-y border-slate-800/60">
                    <div>
                      <span className="text-slate-400 block">Base Attack</span>
                      <span className="text-base font-mono font-bold tabular-nums text-slate-100">
                        {effectiveStats.damage}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Attack Cadence</span>
                      <span className="text-base font-mono font-bold tabular-nums text-slate-100">
                        {effectiveStats.speedMultiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Stagger Power</span>
                      <span className="text-base font-mono font-bold tabular-nums text-slate-100">
                        {effectiveStats.staggerPower.toFixed(2)}x
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Strike Reach</span>
                      <span className="text-base font-mono font-bold tabular-nums text-slate-100">
                        {effectiveStats.range.toFixed(2)}m
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Manifestation [V]</span>
                      <span className="text-base font-mono font-bold tabular-nums text-cyan-300">
                        {effectiveStats.manifestDamage} DMG
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Manifest Cooldown</span>
                      <span className="text-base font-mono font-bold tabular-nums text-cyan-300">
                        {effectiveStats.manifestCooldown.toFixed(2)}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signature Manifestation & Abilities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Supernatural Manifestation [V]
                    </h4>
                    <p className="text-sm font-semibold text-slate-100">
                      {selectedWeapon.signatureManifestName}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {selectedWeapon.signatureManifestDesc}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Canonical Techniques
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {selectedWeapon.abilities.map((ability) => (
                        <li key={ability} className="flex items-center gap-2">
                          <span className="text-slate-500" aria-hidden="true">·</span>
                          <span>{ability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Active Cross-Weapon Synergies */}
                {relevantSynergies.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Unlocked Cross-Weapon Resonance Combos
                    </h4>
                    <div className="space-y-1.5">
                      {relevantSynergies.map((syn) => (
                        <div key={syn.id} className="text-xs text-slate-300">
                          <span className="font-semibold text-cyan-300">{syn.name}</span>
                          <span className="text-slate-500 mx-1.5" aria-hidden="true">—</span>
                          <span className="text-slate-400">{syn.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6 Upgrade Tracks */}
                <div className="pt-2 border-t border-slate-800/60">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Weapon Tempering (Ember Upgrades)
                  </h4>
                  <div className="divide-y divide-slate-800/60">
                    {WEAPON_UPGRADE_TRACKS.map((track) => {
                      const currentLvl = selectedUpgrades?.[track.key] || 0;
                      const isMax = currentLvl >= track.maxLevel;
                      const cost = getWeaponUpgradeCost(currentLvl);
                      const canAfford = !isMax && playerData.embers >= cost;

                      return (
                        <div
                          key={track.key}
                          className="py-2.5 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-slate-200">{track.label}</span>
                              <span className="text-xs font-mono tabular-nums text-cyan-400">
                                Tier {currentLvl}/{track.maxLevel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{track.desc}</p>
                          </div>

                          <button
                            onClick={() => onUpgradeWeapon(selectedWeapon.id, track.key)}
                            disabled={!canAfford || isMax}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg tabular-nums transition-all shrink-0 ${
                              isMax
                                ? 'bg-slate-900 text-emerald-400 cursor-default border border-emerald-500/30'
                                : canAfford
                                ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {isMax ? 'Mastered' : `Upgrade (${cost})`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 flex items-center justify-between bg-black/40">
          <span className="text-xs text-slate-400">
            Shortcuts: Keys [1–7] equip unlocked weapon · [V] manifest relic · [X] Sevenfold Convergence
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
