/**
 * The Seven Hellgates - Audio Engine Forwarder & Adapter
 * Delegates all audio operations to the unified AudioManager in src/audio/audio-manager.ts.
 * Prevents audio manager duplication while maintaining full backwards compatibility.
 */

import { audioManager } from '../../audio/audio-manager';

export const soundEngine = audioManager;
export { audioManager };
