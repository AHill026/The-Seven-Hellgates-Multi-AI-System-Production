/**
 * The Seven Hellgates - Ecosystem Event Dispatcher
 * High-performance typed publish-subscribe bus for living realm world events.
 */

import { EcosystemEvent, EcosystemEventType } from './types';

type EventListener = (event: EcosystemEvent) => void;

export class EcosystemEventDispatcher {
  private listeners: Map<EcosystemEventType, Set<EventListener>> = new Map();
  private allListeners: Set<EventListener> = new Set();
  private eventHistory: EcosystemEvent[] = [];
  private readonly maxHistory = 50;

  public on(type: EcosystemEventType, listener: EventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  public off(type: EcosystemEventType, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  public onAny(listener: EventListener) {
    this.allListeners.add(listener);
  }

  public offAny(listener: EventListener) {
    this.allListeners.delete(listener);
  }

  public emit(event: EcosystemEvent) {
    // Record history
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    // Dispatch to specific listeners
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error('[EcosystemEventDispatcher] Error in listener:', err);
        }
      });
    }

    // Dispatch to global listeners
    this.allListeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('[EcosystemEventDispatcher] Error in global listener:', err);
      }
    });
  }

  public getHistory(): readonly EcosystemEvent[] {
    return this.eventHistory;
  }

  public clear() {
    this.listeners.clear();
    this.allListeners.clear();
    this.eventHistory = [];
  }
}
