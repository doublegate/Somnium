/**
 * SynchronizedSound - Cue-based audio synchronization system
 *
 * Enables precise timing between audio playback and game events,
 * animations, and state changes. Inspired by Sierra's synchronized
 * sequences in cutscenes and cinematic moments.
 *
 * Based on patterns from Iceman (submarine sequences) and
 * Space Quest 3 (spacecraft animations)
 */

import logger from './logger.js';

export class SynchronizedSound {
  constructor(prioritySoundManager, gameManager) {
    this.prioritySoundManager = prioritySoundManager;
    this.gameManager = gameManager;
    this.activeSyncedSounds = new Map();
    this.cueTimers = new Map();
    this.logger = logger;
  }

  /**
   * Play a sound with synchronized cue points
   * @param {string} soundId - Sound identifier
   * @param {Array} cuePoints - Array of cue point definitions
   * @param {Object} options - Sound playback options
   * @returns {Object} Sync control object
   */
  playSynchronized(soundId, cuePoints = [], options = {}) {
    this.logger.log(
      `Playing synchronized sound: ${soundId} with ${cuePoints.length} cue points`
    );

    // Play the sound
    const sound = this.prioritySoundManager.playSound(soundId, options);

    if (!sound) {
      this.logger.warn(`Failed to play synchronized sound: ${soundId}`);
      return null;
    }

    const syncId = `${soundId}_${Date.now()}`;
    const timers = [];

    // Set up cue point handlers
    cuePoints.forEach((cue, index) => {
      const timer = setTimeout(() => {
        this.handleCue(syncId, cue, index);
      }, cue.time);

      timers.push(timer);
    });

    // Track this synchronized sound
    const syncData = {
      soundId,
      sound,
      cuePoints,
      timers,
      startTime: Date.now(),
      completed: false,
    };

    this.activeSyncedSounds.set(syncId, syncData);
    this.cueTimers.set(syncId, timers);

    // Set up cleanup on sound end
    const cleanup = () => {
      this.cleanup(syncId);
    };

    if (sound.onended !== undefined) {
      sound.onended = cleanup;
    }

    // Return control object
    return {
      syncId,
      stop: () => this.stopSynchronized(syncId),
      pause: () => this.pauseSynchronized(syncId),
      resume: () => this.resumeSynchronized(syncId),
      getProgress: () => this.getProgress(syncId),
    };
  }

  /**
   * Handle a cue point trigger
   * @param {string} syncId - Synchronized sound ID
   * @param {Object} cue - Cue point definition
   * @param {number} index - Cue point index
   */
  handleCue(syncId, cue, index) {
    this.logger.log(`Cue point ${index} triggered for ${syncId}: ${cue.type}`);

    const syncData = this.activeSyncedSounds.get(syncId);
    if (!syncData || syncData.paused) return;

    try {
      switch (cue.type) {
        case 'animation':
          this.triggerAnimation(cue);
          break;

        case 'state':
          this.changeState(cue);
          break;

        case 'effect':
          this.triggerEffect(cue);
          break;

        case 'script':
          this.executeScript(cue);
          break;

        case 'sound':
          this.playSound(cue);
          break;

        case 'event':
          this.triggerEvent(cue);
          break;

        case 'callback':
          this.executeCallback(cue);
          break;

        default:
          this.logger.warn(`Unknown cue type: ${cue.type}`);
      }

      // Execute callback if provided
      if (cue.onTrigger) {
        cue.onTrigger(syncData, index);
      }
    } catch (error) {
      this.logger.error(`Error handling cue point: ${error.message}`);
    }
  }

  /**
   * Trigger a sprite animation
   * @param {Object} cue - Animation cue definition
   */
  triggerAnimation(cue) {
    if (!this.gameManager.viewManager) {
      this.logger.warn('ViewManager not available for animation cue');
      return;
    }

    const { target, animation, loop, speed } = cue;

    // Find sprite or create animation command
    const sprite = this.gameManager.viewManager.getSprite(target);
    if (sprite) {
      sprite.setAnimation(animation, loop, speed);
      this.logger.log(`Animation ${animation} triggered on ${target}`);
    } else {
      this.logger.warn(`Animation target not found: ${target}`);
    }
  }

  /**
   * Change game state
   * @param {Object} cue - State change cue definition
   */
  changeState(cue) {
    if (!this.gameManager.gameState) {
      this.logger.warn('GameState not available for state cue');
      return;
    }

    const { state, value, property } = cue;

    if (property) {
      // Set a specific property
      this.gameManager.gameState.set(property, value);
      this.logger.log(`State property ${property} set to ${value}`);
    } else {
      // Set a named state
      this.gameManager.gameState.setState(state, value);
      this.logger.log(`State ${state} set to ${value}`);
    }
  }

  /**
   * Trigger a visual effect
   * @param {Object} cue - Effect cue definition
   */
  triggerEffect(cue) {
    if (!this.gameManager.sceneRenderer) {
      this.logger.warn('SceneRenderer not available for effect cue');
      return;
    }

    const { effect, params, duration, position } = cue;

    // Common effects based on Sierra games
    switch (effect) {
      case 'flash':
        this.gameManager.sceneRenderer.flashScreen(
          params?.color || 15,
          duration || 100
        );
        break;

      case 'shake':
        this.gameManager.sceneRenderer.shakeScreen(
          params?.intensity || 5,
          duration || 500
        );
        break;

      case 'fade':
        this.gameManager.sceneRenderer.fadeScreen(
          params?.direction || 'out',
          duration || 1000
        );
        break;

      case 'particles':
        this.gameManager.sceneRenderer.showParticles(
          position || { x: 160, y: 100 },
          params || {}
        );
        break;

      default:
        // Custom effect
        if (this.gameManager.sceneRenderer.showEffect) {
          this.gameManager.sceneRenderer.showEffect(effect, params);
        }
        break;
    }

    this.logger.log(`Effect ${effect} triggered`);
  }

  /**
   * Execute a script function
   * @param {Object} cue - Script cue definition
   */
  executeScript(cue) {
    const { script, params } = cue;

    if (typeof script === 'function') {
      script(this.gameManager, params);
      this.logger.log('Script function executed');
    } else if (typeof script === 'string') {
      // Execute named script
      if (this.gameManager.scriptManager) {
        this.gameManager.scriptManager.execute(script, params);
        this.logger.log(`Script ${script} executed`);
      }
    }
  }

  /**
   * Play another sound
   * @param {Object} cue - Sound cue definition
   */
  playSound(cue) {
    const { soundId, options } = cue;
    this.prioritySoundManager.playSound(soundId, options || {});
    this.logger.log(`Layered sound ${soundId} triggered`);
  }

  /**
   * Trigger a game event
   * @param {Object} cue - Event cue definition
   */
  triggerEvent(cue) {
    if (!this.gameManager.eventManager) {
      this.logger.warn('EventManager not available for event cue');
      return;
    }

    const { event, params } = cue;
    this.gameManager.eventManager.triggerEvent(event, params);
    this.logger.log(`Event ${event} triggered`);
  }

  /**
   * Execute a callback function
   * @param {Object} cue - Callback cue definition
   */
  executeCallback(cue) {
    if (typeof cue.callback === 'function') {
      cue.callback(this.gameManager, cue.params);
      this.logger.log('Callback executed');
    }
  }

  /**
   * Stop a synchronized sound
   * @param {string} syncId - Synchronized sound ID
   */
  stopSynchronized(syncId) {
    const syncData = this.activeSyncedSounds.get(syncId);
    if (!syncData) return;

    // Stop the sound
    if (syncData.sound && syncData.sound.stop) {
      syncData.sound.stop();
    }

    // Clean up
    this.cleanup(syncId);
    this.logger.log(`Synchronized sound stopped: ${syncId}`);
  }

  /**
   * Pause a synchronized sound (not fully implemented in base)
   * @param {string} syncId - Synchronized sound ID
   */
  pauseSynchronized(syncId) {
    const syncData = this.activeSyncedSounds.get(syncId);
    if (!syncData) return;

    syncData.paused = true;
    syncData.pauseTime = Date.now();

    // Pause remaining timers
    const remainingTimers = this.cueTimers.get(syncId) || [];
    remainingTimers.forEach((timer) => clearTimeout(timer));

    this.logger.log(`Synchronized sound paused: ${syncId}`);
  }

  /**
   * Resume a synchronized sound (not fully implemented in base)
   * @param {string} syncId - Synchronized sound ID
   */
  resumeSynchronized(syncId) {
    const syncData = this.activeSyncedSounds.get(syncId);
    if (!syncData || !syncData.paused) return;

    const pauseDuration = Date.now() - syncData.pauseTime;
    syncData.paused = false;

    // Note: Full resume would require recalculating remaining cue times
    this.logger.log(
      `Synchronized sound resumed: ${syncId} (after ${pauseDuration}ms pause)`
    );
  }

  /**
   * Get playback progress
   * @param {string} syncId - Synchronized sound ID
   * @returns {Object} Progress information
   */
  getProgress(syncId) {
    const syncData = this.activeSyncedSounds.get(syncId);
    if (!syncData) return null;

    const elapsed = Date.now() - syncData.startTime;
    const totalCues = syncData.cuePoints.length;
    const completedCues = syncData.cuePoints.filter(
      (cue) => cue.time < elapsed
    ).length;

    return {
      elapsed,
      completedCues,
      totalCues,
      progress: totalCues > 0 ? completedCues / totalCues : 0,
      paused: syncData.paused || false,
    };
  }

  /**
   * Clean up a synchronized sound
   * @param {string} syncId - Synchronized sound ID
   */
  cleanup(syncId) {
    // Clear all timers
    const timers = this.cueTimers.get(syncId);
    if (timers) {
      timers.forEach((timer) => clearTimeout(timer));
      this.cueTimers.delete(syncId);
    }

    // Mark as completed
    const syncData = this.activeSyncedSounds.get(syncId);
    if (syncData) {
      syncData.completed = true;
    }

    // Remove from active sounds after a delay (for potential queries)
    setTimeout(() => {
      this.activeSyncedSounds.delete(syncId);
    }, 1000);

    this.logger.log(`Synchronized sound cleaned up: ${syncId}`);
  }

  /**
   * Stop all synchronized sounds
   */
  stopAll() {
    const syncIds = Array.from(this.activeSyncedSounds.keys());
    syncIds.forEach((id) => this.stopSynchronized(id));
    this.logger.log('All synchronized sounds stopped');
  }

  /**
   * Predefined synchronized sequences from Sierra games
   */

  /**
   * Play submarine dive sequence (from Iceman)
   * @returns {Object} Sync control object
   */
  playSubmarineDive() {
    const cuePoints = [
      { time: 0, type: 'state', property: 'diving', value: true },
      {
        time: 1000,
        type: 'animation',
        target: 'submarine',
        animation: 'dive_start',
      },
      {
        time: 2000,
        type: 'sound',
        soundId: 'submarine_klaxon',
        options: { volume: 0.5 },
      },
      {
        time: 3000,
        type: 'effect',
        effect: 'particles',
        params: { type: 'bubbles', count: 50 },
      },
      { time: 5000, type: 'state', property: 'depth', value: 50 },
      {
        time: 7000,
        type: 'animation',
        target: 'submarine',
        animation: 'dive_level',
      },
      { time: 8000, type: 'state', property: 'diving', value: false },
      { time: 8000, type: 'event', event: 'dive_complete' },
    ];

    return this.playSynchronized('submarine_dive', cuePoints, {
      type: 'ambient',
      volume: 0.7,
    });
  }

  /**
   * Play magic spell casting sequence (from KQ4/QFG1)
   * @param {string} spellType - Type of spell
   * @returns {Object} Sync control object
   */
  playSpellCast(spellType = 'generic') {
    const cuePoints = [
      { time: 0, type: 'animation', target: 'player', animation: 'cast_start' },
      {
        time: 500,
        type: 'sound',
        soundId: 'spell_charge',
        options: { volume: 0.6 },
      },
      {
        time: 1000,
        type: 'effect',
        effect: 'particles',
        params: { type: 'sparkles', count: 30 },
      },
      {
        time: 1500,
        type: 'animation',
        target: 'player',
        animation: 'cast_release',
      },
      {
        time: 1500,
        type: 'sound',
        soundId: 'spell_release',
        options: { volume: 0.8 },
      },
      {
        time: 2000,
        type: 'effect',
        effect: 'flash',
        params: { color: 15 },
        duration: 200,
      },
      {
        time: 2200,
        type: 'event',
        event: 'spell_cast',
        params: { spell: spellType },
      },
      { time: 2500, type: 'animation', target: 'player', animation: 'idle' },
    ];

    return this.playSynchronized(`spell_${spellType}`, cuePoints, {
      type: 'magic',
      volume: 0.7,
    });
  }

  /**
   * Play door opening sequence
   * @param {string} doorType - Type of door (wooden, metal, etc.)
   * @returns {Object} Sync control object
   */
  playDoorOpen(doorType = 'wooden') {
    const cuePoints = [
      {
        time: 0,
        type: 'sound',
        soundId: `door_${doorType}_open`,
        options: { volume: 0.6 },
      },
      { time: 200, type: 'animation', target: 'door', animation: 'open' },
      { time: 800, type: 'state', property: 'door_open', value: true },
      { time: 800, type: 'event', event: 'door_opened' },
    ];

    return this.playSynchronized(`door_open_${doorType}`, cuePoints, {
      type: 'doors',
    });
  }
}

export default SynchronizedSound;
