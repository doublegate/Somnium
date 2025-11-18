/**
 * AmbientSoundscape - Layered environmental audio system
 *
 * Creates rich, dynamic soundscapes with multiple layers including
 * continuous backgrounds, random occasional sounds, and conditional
 * sounds based on game state.
 *
 * Inspired by Sierra's ambient systems in Iceman (ocean/submarine)
 * and Space Quest 3 (spacecraft/alien worlds)
 */

import logger from './logger.js';

export class AmbientSoundscape {
  constructor(prioritySoundManager) {
    this.prioritySoundManager = prioritySoundManager;
    this.scapes = new Map();
    this.layers = new Map();
    this.activeScape = null;
    this.randomTimers = [];
    this.conditionalInterval = null;
    this.logger = logger;

    this.initializeScapes();
  }

  /**
   * Define a soundscape
   * @param {string} name - Soundscape name
   * @param {Object} config - Soundscape configuration
   */
  defineScape(name, config) {
    this.scapes.set(name, {
      base: config.base || null, // Continuous background
      random: config.random || [], // Random occasional sounds
      conditional: config.conditional || [], // Condition-based sounds
      transitions: config.transitions || {}, // Transitions to other scapes
    });

    this.logger.log(`Soundscape defined: ${name}`);
  }

  /**
   * Initialize predefined soundscapes from Sierra games
   */
  initializeScapes() {
    // From Iceman: Ocean surface soundscape
    this.defineScape('ocean', {
      base: {
        sound: 'ocean_waves',
        volume: 0.3,
        loop: true,
      },
      random: [
        {
          sound: 'seagull_cry',
          probability: 0.1,
          minInterval: 10000,
          maxInterval: 30000,
          volumeRange: [0.3, 0.5],
        },
        {
          sound: 'ship_horn_distant',
          probability: 0.05,
          minInterval: 30000,
          maxInterval: 60000,
          volumeRange: [0.2, 0.3],
        },
        {
          sound: 'wave_splash',
          probability: 0.15,
          minInterval: 5000,
          maxInterval: 15000,
          volumeRange: [0.2, 0.4],
        },
      ],
      conditional: [
        {
          sound: 'wind_strong',
          condition: (state) => state.weather === 'stormy',
          volume: 0.4,
          loop: true,
        },
      ],
      transitions: {
        underwater: { sound: 'submersion', duration: 2000 },
      },
    });

    // From Iceman: Underwater soundscape
    this.defineScape('underwater', {
      base: {
        sound: 'underwater_ambience',
        volume: 0.4,
        loop: true,
      },
      random: [
        {
          sound: 'bubble_stream',
          probability: 0.2,
          minInterval: 3000,
          maxInterval: 8000,
          volumeRange: [0.2, 0.4],
        },
        {
          sound: 'whale_call_distant',
          probability: 0.05,
          minInterval: 20000,
          maxInterval: 60000,
          volumeRange: [0.15, 0.25],
        },
      ],
      conditional: [
        {
          sound: 'submarine_ping',
          condition: (state) => state.depth > 100,
          volume: 0.3,
          interval: 5000,
        },
        {
          sound: 'pressure_warning',
          condition: (state) => state.depth > 500,
          volume: 0.5,
          interval: 3000,
        },
      ],
      transitions: {
        ocean: { sound: 'surface', duration: 2000 },
      },
    });

    // From Space Quest 3: Space station interior
    this.defineScape('space_station', {
      base: {
        sound: 'station_hum',
        volume: 0.25,
        loop: true,
      },
      random: [
        {
          sound: 'computer_beep',
          probability: 0.2,
          minInterval: 3000,
          maxInterval: 10000,
          volumeRange: [0.3, 0.5],
        },
        {
          sound: 'distant_footsteps',
          probability: 0.1,
          minInterval: 15000,
          maxInterval: 40000,
          volumeRange: [0.15, 0.25],
        },
        {
          sound: 'vent_hiss',
          probability: 0.15,
          minInterval: 8000,
          maxInterval: 20000,
          volumeRange: [0.2, 0.3],
        },
      ],
      conditional: [
        {
          sound: 'alert_klaxon',
          condition: (state) => state.alert === true,
          volume: 0.6,
          interval: 2000,
        },
        {
          sound: 'decompression_warning',
          condition: (state) => state.airlock_breach === true,
          volume: 0.7,
          loop: true,
        },
      ],
      transitions: {
        space: { sound: 'airlock_depressurize', duration: 3000 },
      },
    });

    // From Space Quest 3: Outer space
    this.defineScape('space', {
      base: {
        sound: 'space_silence',
        volume: 0.15,
        loop: true,
      },
      random: [
        {
          sound: 'ship_engine_distant',
          probability: 0.08,
          minInterval: 20000,
          maxInterval: 50000,
          volumeRange: [0.1, 0.2],
        },
        {
          sound: 'radio_static_burst',
          probability: 0.1,
          minInterval: 15000,
          maxInterval: 35000,
          volumeRange: [0.15, 0.25],
        },
      ],
      conditional: [
        {
          sound: 'oxygen_warning',
          condition: (state) => state.oxygen < 20,
          volume: 0.5,
          interval: 5000,
        },
      ],
      transitions: {
        space_station: { sound: 'airlock_pressurize', duration: 3000 },
      },
    });

    // From KQ4: Enchanted forest
    this.defineScape('forest', {
      base: {
        sound: 'forest_ambience',
        volume: 0.3,
        loop: true,
      },
      random: [
        {
          sound: 'bird_chirp',
          probability: 0.25,
          minInterval: 2000,
          maxInterval: 8000,
          volumeRange: [0.3, 0.5],
        },
        {
          sound: 'owl_hoot',
          probability: 0.1,
          minInterval: 15000,
          maxInterval: 40000,
          volumeRange: [0.25, 0.4],
        },
        {
          sound: 'leaves_rustle',
          probability: 0.2,
          minInterval: 5000,
          maxInterval: 15000,
          volumeRange: [0.2, 0.3],
        },
        {
          sound: 'wolf_howl_distant',
          probability: 0.05,
          minInterval: 30000,
          maxInterval: 90000,
          volumeRange: [0.2, 0.3],
        },
      ],
      conditional: [
        {
          sound: 'wind_through_trees',
          condition: (state) => state.time === 'night',
          volume: 0.35,
          loop: true,
        },
        {
          sound: 'rain_on_leaves',
          condition: (state) => state.weather === 'raining',
          volume: 0.4,
          loop: true,
        },
      ],
    });

    // Generic indoor soundscape
    this.defineScape('indoor', {
      base: {
        sound: 'room_tone',
        volume: 0.2,
        loop: true,
      },
      random: [
        {
          sound: 'clock_tick',
          probability: 0.3,
          minInterval: 1000,
          maxInterval: 3000,
          volumeRange: [0.15, 0.25],
        },
        {
          sound: 'creak',
          probability: 0.05,
          minInterval: 20000,
          maxInterval: 60000,
          volumeRange: [0.2, 0.3],
        },
      ],
      conditional: [
        {
          sound: 'fireplace_crackle',
          condition: (state) => state.has_fire === true,
          volume: 0.3,
          loop: true,
        },
      ],
    });

    // Castle/dungeon soundscape
    this.defineScape('dungeon', {
      base: {
        sound: 'dungeon_ambience',
        volume: 0.25,
        loop: true,
      },
      random: [
        {
          sound: 'water_drip',
          probability: 0.3,
          minInterval: 2000,
          maxInterval: 6000,
          volumeRange: [0.25, 0.4],
        },
        {
          sound: 'chain_rattle',
          probability: 0.1,
          minInterval: 15000,
          maxInterval: 40000,
          volumeRange: [0.2, 0.35],
        },
        {
          sound: 'distant_moan',
          probability: 0.05,
          minInterval: 30000,
          maxInterval: 80000,
          volumeRange: [0.15, 0.25],
        },
      ],
      conditional: [
        {
          sound: 'torch_flicker',
          condition: (state) => state.has_torch === true,
          volume: 0.2,
          loop: true,
        },
      ],
    });

    this.logger.log('All predefined soundscapes initialized');
  }

  /**
   * Start a soundscape
   * @param {string} name - Soundscape name
   * @param {Object} gameState - Current game state for conditionals
   * @param {boolean} transition - Whether to transition smoothly
   */
  startScape(name, gameState = {}, transition = false) {
    const scape = this.scapes.get(name);
    if (!scape) {
      this.logger.warn(`Soundscape not found: ${name}`);
      return;
    }

    this.logger.log(`Starting soundscape: ${name}`);

    // Stop current scape
    if (this.activeScape && transition) {
      this.transitionScape(this.activeScape, name, gameState);
      return;
    } else {
      this.stopCurrentScape();
    }

    // Start base layer
    if (scape.base) {
      const baseSound = this.prioritySoundManager.playSound(scape.base.sound, {
        volume: scape.base.volume,
        loop: scape.base.loop,
        type: 'ambient',
      });

      if (baseSound) {
        this.layers.set('base', baseSound);
      }
    }

    // Start random sound scheduler
    if (scape.random && scape.random.length > 0) {
      this.scheduleRandomSounds(scape.random);
    }

    // Start conditional sound checker
    if (scape.conditional && scape.conditional.length > 0) {
      this.startConditionalChecker(scape.conditional, gameState);
    }

    this.activeScape = name;
  }

  /**
   * Schedule random sounds
   * @param {Array} randomSounds - Random sound definitions
   */
  scheduleRandomSounds(randomSounds) {
    this.clearRandomTimers();

    randomSounds.forEach((randomDef, index) => {
      const scheduleNext = () => {
        // Check probability
        if (Math.random() > randomDef.probability) {
          // Didn't trigger, schedule next check
          const nextDelay =
            randomDef.minInterval +
            Math.random() * (randomDef.maxInterval - randomDef.minInterval);
          const timer = setTimeout(scheduleNext, nextDelay);
          this.randomTimers.push(timer);
          return;
        }

        // Play the sound
        const volume = randomDef.volumeRange
          ? randomDef.volumeRange[0] +
            Math.random() *
              (randomDef.volumeRange[1] - randomDef.volumeRange[0])
          : 0.5;

        this.prioritySoundManager.playSound(randomDef.sound, {
          volume,
          type: 'ambient',
        });

        // Schedule next check
        const nextDelay =
          randomDef.minInterval +
          Math.random() * (randomDef.maxInterval - randomDef.minInterval);
        const timer = setTimeout(scheduleNext, nextDelay);
        this.randomTimers.push(timer);
      };

      // Initial delay
      const initialDelay =
        randomDef.minInterval +
        Math.random() * (randomDef.maxInterval - randomDef.minInterval);
      const timer = setTimeout(scheduleNext, initialDelay);
      this.randomTimers.push(timer);
    });
  }

  /**
   * Start conditional sound checker
   * @param {Array} conditionals - Conditional sound definitions
   * @param {Object} gameState - Game state object
   */
  startConditionalChecker(conditionals, gameState) {
    this.stopConditionalChecker();

    const checkInterval = 1000; // Check every second

    this.conditionalInterval = setInterval(() => {
      conditionals.forEach((condDef, index) => {
        const layerId = `conditional_${index}`;
        const isActive = condDef.condition(gameState);
        const currentLayer = this.layers.get(layerId);

        if (isActive && !currentLayer) {
          // Start this conditional sound
          if (condDef.loop) {
            const sound = this.prioritySoundManager.playSound(condDef.sound, {
              volume: condDef.volume,
              loop: true,
              type: 'ambient',
            });
            if (sound) {
              this.layers.set(layerId, sound);
            }
          } else if (condDef.interval) {
            // Periodic sound
            const playPeriodic = () => {
              if (condDef.condition(gameState)) {
                this.prioritySoundManager.playSound(condDef.sound, {
                  volume: condDef.volume,
                  type: 'ambient',
                });
              }
            };

            playPeriodic(); // Play immediately
            const timer = setInterval(playPeriodic, condDef.interval);
            this.layers.set(layerId, { isInterval: true, timer });
          }
        } else if (!isActive && currentLayer) {
          // Stop this conditional sound
          if (currentLayer.isInterval) {
            clearInterval(currentLayer.timer);
          } else if (currentLayer.stop) {
            currentLayer.stop();
          }
          this.layers.delete(layerId);
        }
      });
    }, checkInterval);
  }

  /**
   * Transition between soundscapes
   * @param {string} fromScape - Current soundscape
   * @param {string} toScape - Target soundscape
   * @param {Object} gameState - Game state
   */
  transitionScape(fromScape, toScape, gameState) {
    const fromScapeObj = this.scapes.get(fromScape);
    const transitionDef = fromScapeObj?.transitions?.[toScape];

    if (transitionDef) {
      // Play transition sound
      this.prioritySoundManager.playSound(transitionDef.sound, {
        type: 'ambient',
        volume: 0.5,
      });

      // Fade out current scape
      const duration = transitionDef.duration || 1000;

      // Fade out all layers
      for (const [layerId, layer] of this.layers) {
        if (layer && layer.volume) {
          // Simple fade simulation
          const steps = 10;
          const stepDuration = duration / steps;
          let step = 0;

          const fadeInterval = setInterval(() => {
            step++;
            const newVolume = layer.volume.value * (1 - step / steps);
            if (layer.volume.value !== undefined) {
              layer.volume.value = newVolume;
            }

            if (step >= steps) {
              clearInterval(fadeInterval);
            }
          }, stepDuration);
        }
      }

      // Start new scape after transition
      setTimeout(() => {
        this.startScape(toScape, gameState, false);
      }, duration);

      this.logger.log(`Transitioning from ${fromScape} to ${toScape}`);
    } else {
      // No transition defined, just switch
      this.startScape(toScape, gameState, false);
    }
  }

  /**
   * Stop the current soundscape
   */
  stopCurrentScape() {
    // Stop all layers
    for (const [layerId, layer] of this.layers) {
      if (layer) {
        if (layer.isInterval) {
          clearInterval(layer.timer);
        } else if (layer.stop) {
          layer.stop();
        }
      }
    }
    this.layers.clear();

    // Clear random timers
    this.clearRandomTimers();

    // Stop conditional checker
    this.stopConditionalChecker();

    if (this.activeScape) {
      this.logger.log(`Stopped soundscape: ${this.activeScape}`);
    }

    this.activeScape = null;
  }

  /**
   * Clear all random timers
   */
  clearRandomTimers() {
    this.randomTimers.forEach((timer) => clearTimeout(timer));
    this.randomTimers = [];
  }

  /**
   * Stop conditional checker
   */
  stopConditionalChecker() {
    if (this.conditionalInterval) {
      clearInterval(this.conditionalInterval);
      this.conditionalInterval = null;
    }
  }

  /**
   * Update soundscape with new game state
   * @param {Object} gameState - Updated game state
   */
  updateState(gameState) {
    // Conditionals will be checked automatically by the interval
    // This method is for external state updates that might affect conditionals
    if (this.activeScape) {
      const scape = this.scapes.get(this.activeScape);
      if (scape?.conditional) {
        // Force immediate check of conditionals
        this.checkConditionals(scape.conditional, gameState);
      }
    }
  }

  /**
   * Manually check conditionals (for immediate updates)
   * @param {Array} conditionals - Conditional definitions
   * @param {Object} gameState - Game state
   */
  checkConditionals(conditionals, gameState) {
    conditionals.forEach((condDef, index) => {
      const layerId = `conditional_${index}`;
      const isActive = condDef.condition(gameState);
      const currentLayer = this.layers.get(layerId);

      if (isActive && !currentLayer) {
        if (condDef.loop) {
          const sound = this.prioritySoundManager.playSound(condDef.sound, {
            volume: condDef.volume,
            loop: true,
            type: 'ambient',
          });
          if (sound) {
            this.layers.set(layerId, sound);
          }
        }
      } else if (!isActive && currentLayer) {
        if (currentLayer.stop) {
          currentLayer.stop();
        }
        this.layers.delete(layerId);
      }
    });
  }

  /**
   * Get current soundscape info
   * @returns {Object} Soundscape info
   */
  getInfo() {
    return {
      activeScape: this.activeScape,
      activeLayers: this.layers.size,
      randomTimers: this.randomTimers.length,
      hasConditionalChecker: this.conditionalInterval !== null,
    };
  }

  /**
   * Get list of available soundscapes
   * @returns {Array} Soundscape names
   */
  getAvailableScapes() {
    return Array.from(this.scapes.keys());
  }
}

export default AmbientSoundscape;
