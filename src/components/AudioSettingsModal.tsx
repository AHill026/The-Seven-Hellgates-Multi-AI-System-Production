/**
 * THE SEVEN HELLGATES — Audio Settings Modal
 * Wraps the shared AudioSettingsPanel for Main Menu & HUD modal access.
 */

import React from 'react';
import { Volume2, X } from 'lucide-react';
import { AudioSettingsPanel } from './AudioSettingsPanel';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none animate-fadeIn">
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
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AudioSettingsPanel />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 min-h-[44px] py-2.5 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white rounded-xl text-xs font-gothic tracking-wider font-bold uppercase transition-all shadow-lg active:scale-95"
        >
          Confirm Settings
        </button>
      </div>
    </div>
  );
};
