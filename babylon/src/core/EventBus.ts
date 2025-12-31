// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (...args: any[]) => void;

interface EventSubscription {
  callback: EventCallback;
  once: boolean;
}

/**
 * Global event bus for decoupled communication between game systems
 */
export class EventBus {
  private static instance: EventBus;
  private events: Map<string, EventSubscription[]> = new Map();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push({ callback, once: false });

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once
   */
  once(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push({ callback, once: true });

    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    const subscriptions = this.events.get(event);
    if (subscriptions) {
      const index = subscriptions.findIndex((sub) => sub.callback === callback);
      if (index !== -1) {
        subscriptions.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: unknown[]): void {
    const subscriptions = this.events.get(event);
    if (subscriptions) {
      // Create copy to avoid issues with once() removing during iteration
      const subs = [...subscriptions];
      for (const sub of subs) {
        sub.callback(...args);
        if (sub.once) {
          this.off(event, sub.callback);
        }
      }
    }
  }

  /**
   * Clear all subscriptions for an event
   */
  clear(event: string): void {
    this.events.delete(event);
  }

  /**
   * Clear all events
   */
  clearAll(): void {
    this.events.clear();
  }
}

// Event names as constants
export const GameEvents = {
  // Player events
  PLAYER_HEALTH_CHANGED: 'player:healthChanged',
  PLAYER_ARMOR_CHANGED: 'player:armorChanged',
  PLAYER_AMMO_CHANGED: 'player:ammoChanged',
  PLAYER_WEAPON_CHANGED: 'player:weaponChanged',
  PLAYER_DIED: 'player:died',
  PLAYER_DAMAGED: 'player:damaged',

  // Enemy events
  ENEMY_KILLED: 'enemy:killed',
  ENEMY_SPAWNED: 'enemy:spawned',

  // Game events
  SCORE_CHANGED: 'game:scoreChanged',
  DIFFICULTY_CHANGED: 'game:difficultyChanged',
  GAME_OVER: 'game:over',
  GAME_RESTART: 'game:restart',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',

  // Scene events
  SCENE_CHANGE: 'scene:change',
  SCENE_READY: 'scene:ready',
  ENTER_BUILDING: 'scene:enterBuilding',
  EXIT_BUILDING: 'scene:exitBuilding',

  // Pickup events
  PICKUP_COLLECTED: 'pickup:collected',

  // Weapon events
  WEAPON_FIRED: 'weapon:fired',
  WEAPON_SWITCHED: 'weapon:switched',

  // UI events
  SHOW_DIALOGUE: 'ui:showDialogue',
  HIDE_DIALOGUE: 'ui:hideDialogue',
  SHOW_GAME_OVER: 'ui:showGameOver',

  // Loading events
  LOADING_PROGRESS: 'loading:progress',
  LOADING_COMPLETE: 'loading:complete',
};
