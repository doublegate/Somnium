/**
 * WeatherTimeSystem - Dynamic weather and day/night cycle
 *
 * Features:
 * - Real-time day/night cycle with configurable speed
 * - Dynamic weather patterns (clear, rain, snow, fog, storm)
 * - Weather affects gameplay (visibility, movement, combat)
 * - NPC schedules based on time of day
 * - Time-based events and triggers
 * - Seasonal changes
 * - Visual and audio effects for weather
 */

import { logger } from './logger.js';

export class WeatherTimeSystem {
  constructor(gameState, soundManager, viewManager, eventManager) {
    this.gameState = gameState;
    this.soundManager = soundManager;
    this.viewManager = viewManager;
    this.eventManager = eventManager;

    // Time system
    this.gameTime = {
      day: 1,
      hour: 8, // 8 AM start
      minute: 0,
      totalMinutes: 0, // Total game minutes elapsed
      timeScale: 60, // 1 real second = 60 game minutes (1 hour/minute)
    };

    // Season system
    this.seasons = ['spring', 'summer', 'autumn', 'winter'];
    this.currentSeason = 'spring';
    this.dayInSeason = 1;
    this.daysPerSeason = 30;

    // Weather system
    this.currentWeather = 'clear';
    this.weatherIntensity = 0; // 0-1
    this.weatherDuration = 0; // Minutes remaining
    this.weatherTransition = null;

    // Weather types and probabilities by season
    this.weatherTypes = {
      clear: { name: 'Clear', sound: null, effects: [] },
      cloudy: { name: 'Cloudy', sound: null, effects: ['reduced_light'] },
      rain: {
        name: 'Rain',
        sound: 'rain',
        effects: ['reduced_visibility', 'slippery'],
      },
      heavyRain: {
        name: 'Heavy Rain',
        sound: 'heavy_rain',
        effects: ['poor_visibility', 'difficult_movement'],
      },
      snow: {
        name: 'Snow',
        sound: 'snow',
        effects: ['cold', 'reduced_visibility'],
      },
      blizzard: {
        name: 'Blizzard',
        sound: 'blizzard',
        effects: ['freezing', 'poor_visibility', 'difficult_movement'],
      },
      fog: {
        name: 'Fog',
        sound: null,
        effects: ['poor_visibility', 'eerie'],
      },
      storm: {
        name: 'Thunderstorm',
        sound: 'thunder',
        effects: ['poor_visibility', 'dangerous'],
      },
    };

    // Weather probabilities by season
    this.weatherProbabilities = {
      spring: {
        clear: 0.5,
        cloudy: 0.2,
        rain: 0.2,
        heavyRain: 0.05,
        fog: 0.05,
      },
      summer: {
        clear: 0.7,
        cloudy: 0.15,
        rain: 0.1,
        storm: 0.05,
      },
      autumn: {
        clear: 0.3,
        cloudy: 0.3,
        rain: 0.25,
        fog: 0.1,
        storm: 0.05,
      },
      winter: {
        clear: 0.2,
        cloudy: 0.3,
        snow: 0.3,
        blizzard: 0.15,
        fog: 0.05,
      },
    };

    // Time of day periods
    this.timeOfDay = 'morning'; // dawn, morning, noon, afternoon, evening, night, midnight

    // Last update timestamp
    this.lastUpdate = Date.now();

    // Active weather effects
    this.activeEffects = new Set();

    // Statistics
    this.stats = {
      daysElapsed: 0,
      weatherChanges: 0,
      seasonsChanged: 0,
    };
  }

  /**
   * Update time and weather
   * @param {number} deltaTime - Time since last update (ms)
   */
  update(deltaTime) {
    // Update game time
    const minutesPassed = (deltaTime / 1000) * this.gameTime.timeScale;
    this.advanceTime(minutesPassed);

    // Update weather
    this.updateWeather(minutesPassed);

    // Trigger time-based events
    this.checkTimeEvents();
  }

  /**
   * Advance game time
   * @param {number} minutes - Minutes to advance
   */
  advanceTime(minutes) {
    const oldHour = this.gameTime.hour;
    const oldDay = this.gameTime.day;

    this.gameTime.minute += minutes;
    this.gameTime.totalMinutes += minutes;

    // Handle minute overflow
    while (this.gameTime.minute >= 60) {
      this.gameTime.minute -= 60;
      this.gameTime.hour++;

      if (this.gameTime.hour >= 24) {
        this.gameTime.hour -= 24;
        this.advanceDay();
      }
    }

    // Update time of day period
    const newTimeOfDay = this.getTimeOfDayPeriod();
    if (newTimeOfDay !== this.timeOfDay) {
      const oldPeriod = this.timeOfDay;
      this.timeOfDay = newTimeOfDay;

      logger.info(`Time of day changed: ${oldPeriod} → ${newTimeOfDay}`);

      this.eventManager.triggerEvent('timeOfDayChange', {
        from: oldPeriod,
        to: newTimeOfDay,
        hour: this.gameTime.hour,
      });

      // Update ambient sounds
      this.updateAmbientSounds();
    }

    // Trigger hour change events
    if (Math.floor(oldHour) !== Math.floor(this.gameTime.hour)) {
      this.eventManager.triggerEvent('hourChange', {
        hour: Math.floor(this.gameTime.hour),
        timeOfDay: this.timeOfDay,
      });
    }
  }

  /**
   * Advance to next day
   */
  advanceDay() {
    this.gameTime.day++;
    this.dayInSeason++;
    this.stats.daysElapsed++;

    logger.info(`Day ${this.gameTime.day} begins`);

    // Check for season change
    if (this.dayInSeason > this.daysPerSeason) {
      this.advanceSeason();
    }

    // Change weather each day
    this.changeWeather();

    this.eventManager.triggerEvent('newDay', {
      day: this.gameTime.day,
      season: this.currentSeason,
    });
  }

  /**
   * Advance to next season
   */
  advanceSeason() {
    const currentIndex = this.seasons.indexOf(this.currentSeason);
    const nextIndex = (currentIndex + 1) % this.seasons.length;
    const oldSeason = this.currentSeason;
    this.currentSeason = this.seasons[nextIndex];
    this.dayInSeason = 1;
    this.stats.seasonsChanged++;

    logger.info(`Season changed: ${oldSeason} → ${this.currentSeason}`);

    this.eventManager.triggerEvent('seasonChange', {
      from: oldSeason,
      to: this.currentSeason,
    });

    // Change weather for new season
    this.changeWeather();
  }

  /**
   * Update weather system
   * @param {number} minutesPassed - Minutes elapsed
   */
  updateWeather(minutesPassed) {
    if (this.weatherDuration > 0) {
      this.weatherDuration -= minutesPassed;

      if (this.weatherDuration <= 0) {
        // Weather duration expired, change weather
        this.changeWeather();
      }
    }

    // Handle weather transitions
    if (this.weatherTransition) {
      this.weatherTransition.progress += minutesPassed / 10; // 10 minute transition

      if (this.weatherTransition.progress >= 1.0) {
        // Transition complete
        this.currentWeather = this.weatherTransition.to;
        this.weatherTransition = null;
        logger.info(`Weather transition complete: ${this.currentWeather}`);
      }
    }
  }

  /**
   * Change weather based on season
   */
  changeWeather() {
    const probabilities = this.weatherProbabilities[this.currentSeason];
    const oldWeather = this.currentWeather;

    // Roll for new weather
    const roll = Math.random();
    let cumulative = 0;

    for (const [weather, probability] of Object.entries(probabilities)) {
      cumulative += probability;
      if (roll <= cumulative) {
        this.setWeather(weather, oldWeather !== weather);
        break;
      }
    }
  }

  /**
   * Set weather
   * @param {string} weatherType - Weather type
   * @param {boolean} transition - Whether to transition smoothly
   */
  setWeather(weatherType, transition = false) {
    if (!this.weatherTypes[weatherType]) {
      logger.error(`Invalid weather type: ${weatherType}`);
      return;
    }

    const oldWeather = this.currentWeather;

    if (transition) {
      // Start transition
      this.weatherTransition = {
        from: oldWeather,
        to: weatherType,
        progress: 0,
      };
    } else {
      this.currentWeather = weatherType;
    }

    // Set weather duration (2-6 hours)
    this.weatherDuration = 120 + Math.random() * 240;

    // Set weather intensity
    this.weatherIntensity = 0.3 + Math.random() * 0.7;

    // Update active effects
    this.updateWeatherEffects();

    // Update sounds
    this.updateWeatherSounds();

    this.stats.weatherChanges++;

    logger.info(`Weather: ${oldWeather} → ${weatherType}`);

    this.eventManager.triggerEvent('weatherChange', {
      from: oldWeather,
      to: weatherType,
      intensity: this.weatherIntensity,
    });
  }

  /**
   * Update active weather effects
   */
  updateWeatherEffects() {
    this.activeEffects.clear();

    const weather = this.weatherTypes[this.currentWeather];
    if (weather && weather.effects) {
      for (const effect of weather.effects) {
        this.activeEffects.add(effect);
      }
    }

    // Apply effects to gameplay
    this.applyWeatherEffects();
  }

  /**
   * Apply weather effects to gameplay
   */
  applyWeatherEffects() {
    // Visibility effects
    if (this.activeEffects.has('poor_visibility')) {
      this.gameState.setVisibilityModifier(0.5);
    } else if (this.activeEffects.has('reduced_visibility')) {
      this.gameState.setVisibilityModifier(0.75);
    } else {
      this.gameState.setVisibilityModifier(1.0);
    }

    // Movement effects
    if (this.activeEffects.has('difficult_movement')) {
      this.gameState.setMovementModifier(0.5);
    } else if (this.activeEffects.has('slippery')) {
      this.gameState.setMovementModifier(0.75);
    } else {
      this.gameState.setMovementModifier(1.0);
    }

    // Temperature effects
    if (this.activeEffects.has('freezing')) {
      this.gameState.setTemperature('freezing');
    } else if (this.activeEffects.has('cold')) {
      this.gameState.setTemperature('cold');
    } else {
      this.gameState.setTemperature('normal');
    }
  }

  /**
   * Update weather sound effects
   */
  updateWeatherSounds() {
    const weather = this.weatherTypes[this.currentWeather];

    // Stop previous weather sounds
    this.soundManager.stopAmbient('weather');

    // Play new weather sound
    if (weather.sound) {
      this.soundManager.playAmbient('weather', weather.sound, {
        volume: this.weatherIntensity,
        loop: true,
      });
    }
  }

  /**
   * Update ambient sounds based on time of day
   */
  updateAmbientSounds() {
    const sounds = {
      dawn: ['birds_chirping', 'morning_breeze'],
      morning: ['birds', 'wind'],
      noon: ['cicadas', 'wind'],
      afternoon: ['birds', 'rustling_leaves'],
      evening: ['crickets', 'owl'],
      night: ['crickets', 'night_wind', 'owl'],
      midnight: ['eerie_wind', 'distant_howl'],
    };

    const ambientSounds = sounds[this.timeOfDay] || [];

    // Stop current ambient sounds
    this.soundManager.stopAmbient('timeofday');

    // Play new ambient sounds
    for (const sound of ambientSounds) {
      this.soundManager.playAmbient('timeofday', sound, {
        volume: 0.3,
        loop: true,
      });
    }
  }

  /**
   * Get current time of day period
   * @returns {string} Time of day period
   */
  getTimeOfDayPeriod() {
    const hour = this.gameTime.hour;

    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 13) return 'noon';
    if (hour >= 13 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19) return 'evening';
    if (hour >= 19 && hour < 23) return 'night';
    return 'midnight';
  }

  /**
   * Check and trigger time-based events
   */
  checkTimeEvents() {
    const hour = Math.floor(this.gameTime.hour);

    // Trigger hourly events
    if (hour === 12 && this.gameTime.minute < 1) {
      this.eventManager.triggerEvent('noon', {});
    }

    if (hour === 0 && this.gameTime.minute < 1) {
      this.eventManager.triggerEvent('midnight', {});
    }

    // Sunrise and sunset
    if (hour === 6 && this.gameTime.minute < 1) {
      this.eventManager.triggerEvent('sunrise', {});
    }

    if (hour === 18 && this.gameTime.minute < 1) {
      this.eventManager.triggerEvent('sunset', {});
    }
  }

  /**
   * Get formatted time string
   * @returns {string} Formatted time (e.g., "8:30 AM")
   */
  getFormattedTime() {
    const hour = Math.floor(this.gameTime.hour);
    const minute = Math.floor(this.gameTime.minute);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Get current time data
   * @returns {Object} Time data
   */
  getTimeData() {
    return {
      day: this.gameTime.day,
      hour: Math.floor(this.gameTime.hour),
      minute: Math.floor(this.gameTime.minute),
      formattedTime: this.getFormattedTime(),
      timeOfDay: this.timeOfDay,
      season: this.currentSeason,
      dayInSeason: this.dayInSeason,
    };
  }

  /**
   * Get current weather data
   * @returns {Object} Weather data
   */
  getWeatherData() {
    return {
      type: this.currentWeather,
      name: this.weatherTypes[this.currentWeather]?.name,
      intensity: this.weatherIntensity,
      effects: Array.from(this.activeEffects),
      transition: this.weatherTransition,
    };
  }

  /**
   * Set time scale
   * @param {number} scale - Time scale multiplier
   */
  setTimeScale(scale) {
    this.gameTime.timeScale = Math.max(1, Math.min(3600, scale));
  }

  /**
   * Pause time
   */
  pauseTime() {
    this.gameTime.timeScale = 0;
  }

  /**
   * Resume time
   */
  resumeTime() {
    this.gameTime.timeScale = 60;
  }

  /**
   * Check if it's daytime
   * @returns {boolean} True if daytime
   */
  isDaytime() {
    const hour = this.gameTime.hour;
    return hour >= 6 && hour < 18;
  }

  /**
   * Check if it's nighttime
   * @returns {boolean} True if nighttime
   */
  isNighttime() {
    return !this.isDaytime();
  }

  /**
   * Get light level (0-1)
   * @returns {number} Light level
   */
  getLightLevel() {
    const hour = this.gameTime.hour;

    // Night (0.2 light)
    if (hour < 5 || hour >= 21) return 0.2;

    // Dawn/Dusk transition
    if (hour >= 5 && hour < 7) {
      return 0.2 + ((hour - 5) / 2) * 0.8;
    }
    if (hour >= 19 && hour < 21) {
      return 1.0 - ((hour - 19) / 2) * 0.8;
    }

    // Full daylight
    let light = 1.0;

    // Reduce light based on weather
    if (this.activeEffects.has('poor_visibility')) {
      light *= 0.4;
    } else if (this.activeEffects.has('reduced_visibility')) {
      light *= 0.7;
    }

    return light;
  }

  /**
   * Save system state
   * @returns {Object} Save data
   */
  save() {
    return {
      gameTime: { ...this.gameTime },
      currentSeason: this.currentSeason,
      dayInSeason: this.dayInSeason,
      currentWeather: this.currentWeather,
      weatherIntensity: this.weatherIntensity,
      weatherDuration: this.weatherDuration,
      timeOfDay: this.timeOfDay,
      stats: { ...this.stats },
    };
  }

  /**
   * Load system state
   * @param {Object} saveData - Save data
   */
  load(saveData) {
    this.gameTime = saveData.gameTime || this.gameTime;
    this.currentSeason = saveData.currentSeason || 'spring';
    this.dayInSeason = saveData.dayInSeason || 1;
    this.currentWeather = saveData.currentWeather || 'clear';
    this.weatherIntensity = saveData.weatherIntensity || 0.5;
    this.weatherDuration = saveData.weatherDuration || 180;
    this.timeOfDay = saveData.timeOfDay || 'morning';
    this.stats = saveData.stats || this.stats;

    this.updateWeatherEffects();
    this.updateWeatherSounds();
    this.updateAmbientSounds();
  }
}
