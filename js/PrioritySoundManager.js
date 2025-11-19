/**
 * PrioritySoundManager - Sierra-inspired priority-based sound system
 *
 * Implements sophisticated audio channel management with priority levels,
 * ensuring that important sounds (speech, UI) are never interrupted by
 * lower-priority sounds (ambient, footsteps).
 *
 * Based on patterns from Sierra's SCI games (KQ4, SQ3, QFG1EGA, Iceman)
 */

import logger from './logger.js';

export class PrioritySoundManager {
  constructor(soundManager) {
    this.soundManager = soundManager;
    this.activeSounds = new Map();
    this.maxChannels = 16;

    // Priority hierarchy (higher = more important)
    this.soundPriorities = {
      music: 1,
      ambient: 2,
      footsteps: 3,
      doors: 5,
      objects: 6,
      magic: 7,
      combat: 8,
      ui: 9,
      speech: 10, // Highest priority - never interrupted
    };

    // Sound type patterns for auto-detection
    this.typePatterns = {
      music: /music|theme|score/i,
      ambient: /ambient|atmosphere|wind|rain/i,
      footsteps: /footstep|walk|step/i,
      doors: /door|open|close|creak/i,
      objects: /pick|drop|use|item/i,
      magic: /spell|magic|cast|enchant/i,
      combat: /hit|attack|block|damage/i,
      ui: /click|menu|select|button/i,
      speech: /voice|speech|dialogue|talk/i,
    };

    this.logger = logger;
    this.logger.log('PrioritySoundManager initialized');
  }

  /**
   * Play a sound with priority management
   * @param {string} soundId - Sound identifier
   * @param {Object} options - Play options including priority
   * @returns {Object|null} Sound instance or null if not played
   */
  playSound(soundId, options = {}) {
    const priority =
      options.priority !== undefined
        ? options.priority
        : this.getSoundPriority(soundId, options.type);

    this.logger.log(
      `Playing sound: ${soundId} with priority ${priority} (${this.getPriorityName(priority)})`
    );

    // Check if we need to interrupt lower priority sounds
    if (this.activeSounds.size >= this.maxChannels) {
      const lowestPriority = this.findLowestPrioritySound();

      if (lowestPriority && lowestPriority.priority < priority) {
        this.logger.log(
          `Interrupting lower priority sound: ${lowestPriority.id} (priority ${lowestPriority.priority})`
        );
        this.stopSound(lowestPriority.id);
      } else if (lowestPriority && lowestPriority.priority >= priority) {
        // Don't play this sound - channel limit reached
        this.logger.log(
          `Cannot play ${soundId} - all channels occupied by equal or higher priority sounds`
        );
        return null;
      }
    }

    // Play the sound through the underlying SoundManager
    const sound = this.soundManager.playSound(soundId, options);

    if (sound) {
      // Track this sound
      this.activeSounds.set(soundId, {
        sound,
        priority,
        type: options.type || this.detectSoundType(soundId),
        startTime: Date.now(),
      });

      // Clean up when sound ends
      const cleanup = () => {
        this.activeSounds.delete(soundId);
        this.logger.log(`Sound completed: ${soundId}`);
      };

      // Handle cleanup based on sound type
      if (sound.onended !== undefined) {
        sound.onended = cleanup;
      } else if (sound.stop) {
        // Wrap original stop method
        const originalStop = sound.stop.bind(sound);
        sound.stop = () => {
          cleanup();
          originalStop();
        };
      }
    }

    return sound;
  }

  /**
   * Stop a specific sound
   * @param {string} soundId - Sound identifier
   */
  stopSound(soundId) {
    const entry = this.activeSounds.get(soundId);
    if (entry) {
      if (entry.sound.stop) {
        entry.sound.stop();
      }
      this.activeSounds.delete(soundId);
      this.logger.log(`Sound stopped: ${soundId}`);
    }
  }

  /**
   * Stop all sounds of a specific type
   * @param {string} type - Sound type to stop
   */
  stopSoundsByType(type) {
    const soundsToStop = [];

    for (const [id, entry] of this.activeSounds) {
      if (entry.type === type) {
        soundsToStop.push(id);
      }
    }

    soundsToStop.forEach((id) => this.stopSound(id));

    this.logger.log(`Stopped ${soundsToStop.length} sounds of type: ${type}`);
  }

  /**
   * Stop all sounds below a certain priority
   * @param {number} minPriority - Minimum priority to keep playing
   */
  stopLowerPrioritySounds(minPriority) {
    const soundsToStop = [];

    for (const [id, entry] of this.activeSounds) {
      if (entry.priority < minPriority) {
        soundsToStop.push(id);
      }
    }

    soundsToStop.forEach((id) => this.stopSound(id));

    this.logger.log(
      `Stopped ${soundsToStop.length} sounds below priority ${minPriority}`
    );
  }

  /**
   * Fade out a sound over time
   * @param {string} soundId - Sound identifier
   * @param {number} duration - Fade duration in ms
   */
  fadeOutSound(soundId, duration = 1000) {
    const entry = this.activeSounds.get(soundId);
    if (!entry || !entry.sound) return;

    const sound = entry.sound;
    const steps = 20;
    const stepDuration = duration / steps;

    // Get initial volume
    const initialVolume = sound.volume ? sound.volume.value : 1;

    let step = 0;
    const fadeInterval = setInterval(() => {
      step++;
      const newVolume = initialVolume * (1 - step / steps);

      if (sound.volume && sound.volume.value !== undefined) {
        sound.volume.value = newVolume;
      }

      if (step >= steps) {
        clearInterval(fadeInterval);
        this.stopSound(soundId);
      }
    }, stepDuration);
  }

  /**
   * Cross-fade between two sounds
   * @param {string} outSoundId - Sound to fade out
   * @param {string} inSoundId - Sound to fade in
   * @param {Object} inOptions - Options for the new sound
   * @param {number} duration - Crossfade duration in ms
   */
  crossfade(outSoundId, inSoundId, inOptions = {}, duration = 1000) {
    // Start fading out the old sound
    this.fadeOutSound(outSoundId, duration);

    // Start the new sound at zero volume
    const newOptions = { ...inOptions, volume: 0 };
    const newSound = this.playSound(inSoundId, newOptions);

    if (!newSound) return null;

    // Fade in the new sound
    const steps = 20;
    const stepDuration = duration / steps;
    const targetVolume = inOptions.volume || 1;

    let step = 0;
    const fadeInterval = setInterval(() => {
      step++;
      const newVolume = targetVolume * (step / steps);

      if (newSound.volume && newSound.volume.value !== undefined) {
        newSound.volume.value = newVolume;
      }

      if (step >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepDuration);

    return newSound;
  }

  /**
   * Get sound priority based on ID and type
   * @param {string} soundId - Sound identifier
   * @param {string} type - Optional explicit type
   * @returns {number} Priority level
   */
  getSoundPriority(soundId, type = null) {
    // Use explicit type if provided
    if (type && this.soundPriorities[type] !== undefined) {
      return this.soundPriorities[type];
    }

    // Auto-detect based on ID patterns
    const detectedType = this.detectSoundType(soundId);
    return this.soundPriorities[detectedType] || 5; // Default medium priority
  }

  /**
   * Detect sound type from ID
   * @param {string} soundId - Sound identifier
   * @returns {string} Detected type
   */
  detectSoundType(soundId) {
    for (const [type, pattern] of Object.entries(this.typePatterns)) {
      if (pattern.test(soundId)) {
        return type;
      }
    }
    return 'objects'; // Default type
  }

  /**
   * Get priority name for logging
   * @param {number} priority - Priority level
   * @returns {string} Priority name
   */
  getPriorityName(priority) {
    for (const [name, level] of Object.entries(this.soundPriorities)) {
      if (level === priority) {
        return name;
      }
    }
    return 'unknown';
  }

  /**
   * Find the lowest priority sound currently playing
   * @returns {Object|null} Sound entry with lowest priority
   */
  findLowestPrioritySound() {
    if (this.activeSounds.size === 0) return null;

    let lowest = null;

    for (const [id, entry] of this.activeSounds) {
      if (
        !lowest ||
        entry.priority < lowest.priority ||
        (entry.priority === lowest.priority &&
          entry.startTime < lowest.startTime)
      ) {
        lowest = { ...entry, id };
      }
    }

    return lowest;
  }

  /**
   * Get all currently active sounds
   * @returns {Array} Active sounds with metadata
   */
  getActiveSounds() {
    return Array.from(this.activeSounds.entries()).map(([id, entry]) => ({
      id,
      priority: entry.priority,
      type: entry.type,
      priorityName: this.getPriorityName(entry.priority),
      duration: Date.now() - entry.startTime,
    }));
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    const soundIds = Array.from(this.activeSounds.keys());
    soundIds.forEach((id) => this.stopSound(id));
    this.logger.log('All sounds stopped');
  }

  /**
   * Get priority system statistics
   * @returns {Object} Statistics about sound usage
   */
  getStats() {
    const typeCount = {};
    const priorityCount = {};

    for (const entry of this.activeSounds.values()) {
      typeCount[entry.type] = (typeCount[entry.type] || 0) + 1;
      priorityCount[entry.priority] = (priorityCount[entry.priority] || 0) + 1;
    }

    return {
      activeSounds: this.activeSounds.size,
      maxChannels: this.maxChannels,
      utilization: (this.activeSounds.size / this.maxChannels) * 100,
      byType: typeCount,
      byPriority: priorityCount,
    };
  }
}

export default PrioritySoundManager;
