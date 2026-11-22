/**
 * The Seven Hellgates - Mobile On-Screen Touch Controls
 * Responsive virtual thumbstick on left, action buttons on right, camera swipe overlay.
 */

import React, { useRef, useState, useEffect } from 'react';
import { CombatStance } from '../game/types';
import { Shield, Zap, Flame, RefreshCw, Crosshair } from 'lucide-react';

interface MobileControlsProps {
  onMove: (x: number, z: number) => void;
  onLookDelta: (dx: number, dy: number) => void;
  onAction: (action: 'light' | 'heavy' | 'dodge' | 'stance' | 'ability' | 'wrath' | 'lock') => void;
  currentStance: CombatStance;
  wrathReady: boolean;
  disabled?: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onLookDelta,
  onAction,
  currentStance,
  wrathReady,
  disabled = false,
}) => {
  if (disabled) return null;
  const stickBaseRef = useRef<HTMLDivElement>(null);
  const [stickActive, setStickActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  // Right-screen camera swipe tracking
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number } | null>(null);

  // Touch move handler for joystick
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Left 45% of screen is movement joystick zone
      if (touch.clientX < window.innerWidth * 0.45 && touchIdRef.current === null) {
        touchIdRef.current = touch.identifier;
        setStickActive(true);
        updateStick(touch.clientX, touch.clientY);
      }
      // Right 55% of screen is camera drag zone (outside button overlays)
      else if (touch.clientX >= window.innerWidth * 0.45 && lookTouchIdRef.current === null) {
        lookTouchIdRef.current = touch.identifier;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateStick(touch.clientX, touch.clientY);
      } else if (touch.identifier === lookTouchIdRef.current && lastLookPos.current) {
        const dx = (touch.clientX - lastLookPos.current.x) * 0.006;
        const dy = (touch.clientY - lastLookPos.current.y) * 0.006;
        onLookDelta(dx, dy);
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setStickActive(false);
        setStickPos({ x: 0, y: 0 });
        onMove(0, 0);
      } else if (touch.identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        lastLookPos.current = null;
      }
    }
  };

  const updateStick = (clientX: number, clientY: number) => {
    if (!stickBaseRef.current) return;
    const rect = stickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const maxRadius = 45;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setStickPos({ x: dx, y: dy });
    // Normalize -1 to 1 (Y inverted for forward motion)
    onMove(dx / maxRadius, -dy / maxRadius);
  };

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-auto touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 1. Left Virtual Joystick Zone - Elevated upward for comfortable thumb reach and clear screen visibility */}
      <div className="absolute bottom-24 md:bottom-28 left-6 md:left-10 w-32 h-32 flex items-center justify-center pointer-events-none">
        <div
          ref={stickBaseRef}
          className={`w-28 h-28 rounded-full border border-white/25 bg-black/30 backdrop-blur-xs relative flex items-center justify-center transition-opacity ${
            stickActive ? 'opacity-85 border-blue-400/60 bg-black/45' : 'opacity-35'
          }`}
        >
          {/* Subtle directional cross markings */}
          <div className="absolute w-full h-[1px] bg-white/10" />
          <div className="absolute h-full w-[1px] bg-white/10" />

          {/* Thumb knob */}
          <div
            className="w-12 h-12 rounded-full bg-blue-500/80 shadow-lg shadow-blue-500/40 border border-blue-300/40 absolute transition-transform duration-75"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            }}
          />
        </div>
      </div>

      {/* 2. Right Action Buttons Cluster - Elevated upward to match joystick balance */}
      <div className="absolute bottom-20 md:bottom-24 right-6 md:right-10 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Top row: Stance switch, Special Ability, Lock-on */}
        <div className="flex items-center gap-3">
          <button
            onTouchStart={(e) => { e.stopPropagation(); onAction('stance'); }}
            className="w-12 h-12 rounded-full bg-slate-900/85 border border-slate-700 active:bg-blue-600 text-slate-200 flex flex-col items-center justify-center shadow-lg"
            aria-label="Switch Stance"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-[9px] uppercase font-mono mt-0.5">Stance</span>
          </button>

          <button
            onTouchStart={(e) => { e.stopPropagation(); onAction('ability'); }}
            className="w-12 h-12 rounded-full bg-slate-900/85 border border-amber-600/40 active:bg-amber-600 text-amber-400 flex flex-col items-center justify-center shadow-lg"
            aria-label="Special Ability"
          >
            <Zap className="w-5 h-5" />
            <span className="text-[9px] uppercase font-mono mt-0.5">Skill</span>
          </button>

          <button
            onTouchStart={(e) => { e.stopPropagation(); onAction('lock'); }}
            className="w-12 h-12 rounded-full bg-slate-900/85 border border-slate-700 active:bg-slate-700 text-slate-300 flex flex-col items-center justify-center shadow-lg"
            aria-label="Toggle Lock-on"
          >
            <Crosshair className="w-5 h-5" />
            <span className="text-[9px] uppercase font-mono mt-0.5">Lock</span>
          </button>
        </div>

        {/* Wrath Ultimate Button (when ready) */}
        {wrathReady && (
          <button
            onTouchStart={(e) => { e.stopPropagation(); onAction('wrath'); }}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400 text-white font-gothic tracking-widest text-xs rounded-xl shadow-xl shadow-blue-600/40 animate-pulse flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>WRATH UNBOUND</span>
          </button>
        )}

        {/* Primary Action Buttons: Light Attack, Heavy Slam, Dodge */}
        <div className="flex items-center gap-3">
          {/* Dodge Roll */}
          <button
            onTouchStart={(e) => { e.stopPropagation(); onAction('dodge'); }}
            className="w-14 h-14 rounded-full bg-slate-800/90 border border-slate-600 active:bg-emerald-600 text-slate-100 flex flex-col items-center justify-center shadow-lg"
            aria-label="Dodge Roll"
          >
            <Shield className="w-6 h-6" />
            <span className="text-[10px] uppercase font-mono mt-0.5 font-bold">Dodge</span>
          </button>

          {/* Heavy Attack Slam */}
          <button
            onTouchStart={(e) => { e.stopPropagation(); onAction('heavy'); }}
            className="w-14 h-14 rounded-full bg-red-950/80 border border-red-500/50 active:bg-red-600 text-red-200 flex flex-col items-center justify-center shadow-lg"
            aria-label="Heavy Slam"
          >
            <span className="text-base font-black font-gothic">HVY</span>
            <span className="text-[9px] uppercase font-mono">Slam</span>
          </button>

          {/* Light Attack */}
          <button
            onTouchStart={(e) => { e.stopPropagation(); onAction('light'); }}
            className="w-18 h-18 rounded-full bg-blue-600 border-2 border-blue-300 active:bg-blue-400 text-white flex flex-col items-center justify-center shadow-2xl shadow-blue-500/50"
            aria-label="Light Attack Combo"
          >
            <span className="text-lg font-black font-gothic">ATK</span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Slash</span>
          </button>
        </div>
      </div>
    </div>
  );
};
