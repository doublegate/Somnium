/**
 * SoundManager - Handles music and sound effects using Tone.js
 *
 * Responsibilities:
 * - Generate music from descriptions
 * - Play ambient sounds
 * - Trigger sound effects
 * - Manage volume settings
 * - Handle audio context
 */

import logger from './logger.js';

export class SoundManager {
  constructor() {
    this.isInitialized = false;

    // Volume controls by category
    this.volumes = {
      master: 0.7,
      music: 0.8,
      sfx: 0.9,
      ambient: 0.7,
    };

    // Audio channels (4 total, like SCI0)
    this.channels = {
      music: null, // Channel 0: Background music
      ambient: null, // Channel 1: Ambient sounds
      sfx1: null, // Channel 2: Sound effects 1
      sfx2: null, // Channel 3: Sound effects 2
    };

    // Sound effect cache and pool
    this.soundCache = new Map();
    this.soundPool = new Map();
    this.maxPoolSize = 3; // Max instances per sound

    // Tone.js will be loaded dynamically
    this.Tone = null;

    // Track states
    this.channelStates = {
      music: false,
      ambient: false,
      sfx1: false,
      sfx2: false,
    };

    // Retro presets
    this.retroPresets = null;

    // Spatial audio settings
    this.spatialEnabled = true;
    this.listenerPosition = { x: 160, y: 100 }; // Center of 320x200 screen

    // Music generation
    this.musicTheory = null;
    this.sequencer = null;
    this.currentTheme = null;
    this.musicTracks = {
      melody: null,
      harmony: null,
      bass: null,
      drums: null,
    };
    this.musicIntensity = 1.0; // 0.0 to 1.0
    this.leitmotifs = new Map(); // Character/location themes
  }

  /**
   * Set up Tone.js and audio context
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Import Tone.js dynamically
      const { Tone } = await import('tone');
      this.Tone = Tone;

      // Start audio context (required for browser autoplay policies)
      await this.Tone.start();
      logger.sound('Audio context started');

      // Initialize volume nodes for each category
      this.volumeNodes = {
        master: new this.Tone.Gain(this.volumes.master).toDestination(),
        music: new this.Tone.Gain(this.volumes.music),
        sfx: new this.Tone.Gain(this.volumes.sfx),
        ambient: new this.Tone.Gain(this.volumes.ambient),
      };

      // Connect category volumes to master
      this.volumeNodes.music.connect(this.volumeNodes.master);
      this.volumeNodes.sfx.connect(this.volumeNodes.master);
      this.volumeNodes.ambient.connect(this.volumeNodes.master);

      // Initialize retro synthesizer presets
      this.initializeRetroPresets();

      // Initialize music theory foundation
      this.initializeMusicTheory();

      // Initialize music sequencer
      this.initializeSequencer();

      // Set up spatial audio panner
      this.spatialPanner = new this.Tone.Panner().connect(this.volumeNodes.sfx);

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize audio:', error);
    }
  }

  /**
   * Start background music from theme description
   * @param {string} musicTheme - Theme descriptor (e.g., "mysterious", "heroic", "peaceful")
   * @param {string} preset - Synthesizer preset ('pcSpeaker', 'adlib', 'mt32')
   * @param {Object} options - Additional options
   */
  playMusic(musicTheme, preset = 'adlib', options = {}) {
    if (!this.isInitialized) {
      logger.warn('Audio not initialized');
      return;
    }

    // Stop current music
    this.stopMusic();

    logger.sound(`Playing music theme: ${musicTheme} with ${preset} preset`);

    try {
      // Store current theme
      this.currentTheme = musicTheme;

      // Generate complete musical arrangement
      const arrangement = this.generateArrangement(musicTheme, {
        ...options,
        preset: preset,
      });

      // Set up sequencer with the arrangement
      this.setupSequencer(arrangement, preset);

      // Start playing
      this.startSequencer();
      this.channelStates.music = true;
    } catch (error) {
      logger.error('Failed to play music:', error);
    }
  }

  /**
   * Start ambient sound loop
   * @param {string} ambienceDesc - Ambience descriptor (e.g., "wind", "cave drips", "forest")
   * @param {Object} options - Additional options
   */
  playAmbience(ambienceDesc, _options = {}) {
    if (!this.isInitialized) {
      logger.warn('Audio not initialized');
      return;
    }

    // Stop current ambience
    this.stopAmbience();

    logger.sound(`Playing ambience: ${ambienceDesc}`);

    try {
      // Generate ambience based on description
      const ambienceParams = this.getAmbienceParameters(ambienceDesc);

      // Create noise source
      const noise = new this.Tone.Noise(ambienceParams.type).start();

      // Create filter
      const filter = new this.Tone.AutoFilter({
        frequency: ambienceParams.filterFreq,
        octaves: ambienceParams.octaves || 2.6,
      }).start();

      // Set volume
      const gain = new this.Tone.Gain(ambienceParams.volume);

      // Add reverb for cave/indoor environments
      let reverb = null;
      if (ambienceDesc.includes('cave') || ambienceDesc.includes('chamber')) {
        reverb = new this.Tone.Reverb({
          decay: 4,
          wet: 0.3,
        });
      }

      // Connect chain
      noise.connect(gain);
      if (reverb) {
        gain.connect(reverb);
        reverb.connect(filter);
      } else {
        gain.connect(filter);
      }
      filter.connect(this.volumeNodes.ambient);

      // Store reference
      this.channels.ambient = { noise, filter, gain, reverb };
      this.channelStates.ambient = true;
    } catch (error) {
      logger.error('Failed to play ambience:', error);
    }
  }

  /**
   * Play one-shot sound effect
   * @param {string} soundId - Sound effect ID (e.g., "door_open", "pickup", "footstep")
   * @param {Object} options - Options for the sound
   * @param {number} options.x - X position for spatial audio (0-320)
   * @param {number} options.y - Y position for spatial audio (0-200)
   * @param {string} options.preset - Synthesizer preset
   * @param {number} options.pitch - Pitch multiplier (0.5-2.0)
   */
  playSound(soundId, options = {}) {
    if (!this.isInitialized) {
      logger.warn('Audio not initialized');
      return;
    }

    logger.sound(`Playing sound: ${soundId}`, options);

    try {
      // Check sound pool for available instance
      let source = this.getFromPool(soundId);

      if (!source) {
        // Get sound parameters
        const soundParams = this.getSoundParameters(soundId);

        // Apply pitch variation if specified
        if (options.pitch && soundParams.frequency) {
          if (typeof soundParams.frequency === 'string') {
            // Convert note to frequency, then apply pitch
            const baseFreq = this.Tone.Frequency(
              soundParams.frequency
            ).toFrequency();
            soundParams.frequency = baseFreq * (options.pitch || 1);
          } else {
            soundParams.frequency *= options.pitch || 1;
          }
        }

        // Create appropriate sound source
        source = this.createSoundSource(soundParams, options.preset);
      }

      if (!source) return;

      // Apply spatial audio if position provided (skip for procedural sounds)
      if (
        this.spatialEnabled &&
        (options.x !== undefined || options.y !== undefined) &&
        source.connect // Check if source is a connectable audio node
      ) {
        const panner = this.calculatePanning(options.x, options.y);
        source.connect(this.spatialPanner);
        this.spatialPanner.pan.value = panner;
      } else if (source.connect) {
        // Only connect if source is a connectable audio node
        source.connect(this.volumeNodes.sfx);
      }

      // Play the sound
      const soundParams = this.getSoundParameters(soundId);
      this.triggerSound(source, soundParams);

      // Choose channel
      const channel = this.channelStates.sfx1 ? 'sfx2' : 'sfx1';
      this.channels[channel] = source;
      this.channelStates[channel] = true;

      // Return to pool or dispose after sound finishes
      setTimeout(
        () => {
          this.channelStates[channel] = false;
          this.returnToPool(soundId, source) || source.dispose();
        },
        soundParams.duration * 1000 + 100
      );
    } catch (error) {
      logger.error('Failed to play sound:', error);
    }
  }

  /**
   * Stop all audio
   */
  stopAll() {
    this.stopMusic();
    this.stopAmbience();
    this.stopAllSounds();
  }

  /**
   * Create a sound source from parameters
   * @private
   */
  createSoundSource(soundParams, preset) {
    let source;
    const synthPreset = preset && this.retroPresets[preset];

    switch (soundParams.type) {
      case 'synth':
        if (synthPreset) {
          source = synthPreset.synth();
        } else {
          source = new this.Tone.Synth({
            oscillator: { type: soundParams.waveform },
            envelope: soundParams.envelope,
          });
        }
        break;

      case 'noise':
        source = new this.Tone.NoiseSynth({
          noise: { type: soundParams.noiseType },
          envelope: soundParams.envelope,
        });
        break;

      case 'metal':
        source = new this.Tone.MetalSynth({
          frequency: soundParams.frequency,
          envelope: soundParams.envelope,
          harmonicity: soundParams.harmonicity || 5.1,
          modulationIndex: soundParams.modulation || 32,
          resonance: soundParams.resonance || 4000,
          octaves: soundParams.octaves || 1.5,
        });
        break;

      case 'procedural':
        source = this.createProceduralSound(soundParams);
        break;

      default:
        console.warn(`Unknown sound type: ${soundParams.type}`);
    }

    return source;
  }

  /**
   * Create procedural sound effects
   * @private
   */
  createProceduralSound(params) {
    switch (params.procedural) {
      case 'door': {
        // Combination of low frequency and metallic sound
        const doorSynth = new this.Tone.PolySynth(this.Tone.Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.2 },
        });

        // Add slight chorus for wooden effect
        const chorus = new this.Tone.Chorus(4, 2.5, 0.5);
        doorSynth.connect(chorus);
        chorus.connect(this.volumeNodes.sfx);

        return doorSynth;
      }

      case 'footstep': {
        // Layer noise with pitched percussion
        const footNoise = new this.Tone.NoiseSynth({
          noise: { type: params.surface === 'metal' ? 'white' : 'brown' },
          envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
        });

        const footThud = new this.Tone.MembraneSynth({
          pitchDecay: 0.008,
          octaves: params.surface === 'wood' ? 2 : 4,
          envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
        });

        // Mix both sounds
        const footMixer = new this.Tone.Gain(0.5);
        footNoise.connect(footMixer);
        footThud.connect(footMixer);
        footMixer.connect(this.volumeNodes.sfx);

        return {
          noise: footNoise,
          thud: footThud,
          trigger: (freq) => {
            footNoise.triggerAttackRelease(params.duration);
            footThud.triggerAttackRelease(freq || 60, params.duration);
          },
        };
      }

      default:
        return null;
    }
  }

  /**
   * Trigger a sound based on its type
   * @private
   */
  triggerSound(source, params) {
    if (source.trigger) {
      // Custom trigger function
      source.trigger(params.frequency);
    } else if (source.triggerAttackRelease) {
      if (params.frequency) {
        source.triggerAttackRelease(params.frequency, params.duration);
      } else {
        source.triggerAttackRelease(params.duration);
      }
    } else if (source.triggerAttack) {
      source.triggerAttack();
      setTimeout(() => source.triggerRelease(), params.duration * 1000);
    }
  }

  /**
   * Calculate panning based on position
   * @private
   */
  calculatePanning(x, y) {
    if (x === undefined) return 0;

    // Convert x position (0-320) to panning (-1 to 1)
    const normalizedX = x / 320;
    const pan = (normalizedX - 0.5) * 2;

    // Apply distance attenuation based on y if provided
    if (y !== undefined) {
      const distance = Math.abs(y - this.listenerPosition.y) / 200;
      return pan * (1 - distance * 0.3); // Reduce panning effect with distance
    }

    return Math.max(-1, Math.min(1, pan));
  }

  /**
   * Get sound from pool if available
   * @private
   */
  getFromPool(soundId) {
    const pool = this.soundPool.get(soundId);
    if (pool && pool.length > 0) {
      return pool.pop();
    }
    return null;
  }

  /**
   * Return sound to pool for reuse
   * @private
   */
  returnToPool(soundId, source) {
    if (!this.soundPool.has(soundId)) {
      this.soundPool.set(soundId, []);
    }

    const pool = this.soundPool.get(soundId);
    if (pool.length < this.maxPoolSize) {
      // Reset the source
      if (source.disconnect) {
        source.disconnect();
      }
      pool.push(source);
      return true;
    }
    return false;
  }

  /**
   * Stop background music
   */
  stopMusic() {
    // Stop sequencer
    this.clearSequencer();

    // Clear old pattern-based music if any
    if (this.channels.music) {
      if (this.channels.music.pattern) {
        this.channels.music.pattern.stop();
      }
      if (this.channels.music.synth) {
        this.channels.music.synth.dispose();
      }
      this.channels.music = null;
    }

    this.channelStates.music = false;
    this.currentTheme = null;
  }

  /**
   * Stop ambient sounds
   */
  stopAmbience() {
    if (this.channels.ambient) {
      if (this.channels.ambient.noise) {
        this.channels.ambient.noise.stop();
        this.channels.ambient.noise.dispose();
      }
      if (this.channels.ambient.filter) {
        this.channels.ambient.filter.dispose();
      }
      if (this.channels.ambient.gain) {
        this.channels.ambient.gain.dispose();
      }
      this.channels.ambient = null;
      this.channelStates.ambient = false;
    }
  }

  /**
   * Stop all sound effects
   */
  stopAllSounds() {
    // Stop channel sounds
    ['sfx1', 'sfx2'].forEach((channel) => {
      if (this.channels[channel]) {
        if (this.channels[channel].dispose) {
          this.channels[channel].dispose();
        }
        this.channels[channel] = null;
        this.channelStates[channel] = false;
      }
    });

    // Clear sound pool
    this.soundPool.forEach((pool) => {
      pool.forEach((sound) => {
        if (sound.dispose) sound.dispose();
      });
    });
    this.soundPool.clear();
  }

  /**
   * Set volume for a specific category
   * @param {string} category - 'master', 'music', 'sfx', or 'ambient'
   * @param {number} level - Volume level (0.0 - 1.0)
   */
  setVolume(category, level) {
    const validCategories = ['master', 'music', 'sfx', 'ambient'];
    if (!validCategories.includes(category)) {
      console.warn(`Invalid volume category: ${category}`);
      return;
    }

    this.volumes[category] = Math.max(0, Math.min(1, level));

    if (this.isInitialized && this.volumeNodes && this.volumeNodes[category]) {
      this.volumeNodes[category].gain.value = this.volumes[category];
    }
  }

  /**
   * Get current volume for a category
   * @param {string} category - Volume category
   * @returns {number} Current volume level
   */
  getVolume(category) {
    return this.volumes[category] || 0;
  }

  /**
   * Set all volumes at once
   * @param {Object} volumes - Object with volume levels
   */
  setAllVolumes(volumes) {
    Object.entries(volumes).forEach(([category, level]) => {
      this.setVolume(category, level);
    });
  }

  /**
   * Pause all audio
   */
  pauseAll() {
    if (this.isInitialized && this.Tone) {
      this.Tone.Transport.pause();
    }
  }

  /**
   * Resume all audio
   */
  resumeAll() {
    if (this.isInitialized && this.Tone) {
      this.Tone.Transport.start();
    }
  }

  /**
   * Update sound system (called each frame)
   * @param {number} deltaTime - Time since last update
   */
  update(_deltaTime) {
    // Future: Update any time-based audio effects
  }

  /**
   * Initialize retro synthesizer presets
   * @private
   */
  initializeRetroPresets() {
    this.retroPresets = {
      // PC Speaker emulation (square waves only)
      pcSpeaker: {
        synth: () =>
          new this.Tone.MonoSynth({
            oscillator: { type: 'square' },
            envelope: {
              attack: 0.001,
              decay: 0.01,
              sustain: 0.8,
              release: 0.01,
            },
            filterEnvelope: {
              attack: 0.001,
              decay: 0.01,
              sustain: 1,
              release: 0.01,
              baseFrequency: 8000,
              octaves: 0,
            },
          }),
        // PC speaker could only play one note at a time
        polyphony: 1,
      },

      // AdLib FM synthesis emulation
      adlib: {
        synth: () =>
          new this.Tone.FMSynth({
            harmonicity: 3,
            modulationIndex: 10,
            oscillator: { type: 'sine' },
            envelope: {
              attack: 0.01,
              decay: 0.2,
              sustain: 0.3,
              release: 0.1,
            },
            modulation: { type: 'sine' },
            modulationEnvelope: {
              attack: 0.01,
              decay: 0.2,
              sustain: 0.3,
              release: 0.1,
            },
          }),
        polyphony: 9, // AdLib had 9 channels
      },

      // Roland MT-32 emulation (simplified)
      mt32: {
        synth: () =>
          new this.Tone.PolySynth(this.Tone.Synth, {
            oscillator: { type: 'sawtooth' },
            envelope: {
              attack: 0.02,
              decay: 0.3,
              sustain: 0.4,
              release: 0.5,
            },
          }),
        polyphony: 32,
      },
    };
  }

  /**
   * Convert linear volume to decibels
   * @private
   * @param {number} volume - Linear volume (0-1)
   * @returns {number} Volume in decibels
   */
  volumeToDb(volume) {
    // Convert to dB (0 = -Infinity dB, 1 = 0 dB)
    return volume > 0 ? 20 * Math.log10(volume) : -60;
  }

  /**
   * Get music parameters from theme
   * @private
   * @param {string} theme - Music theme
   * @returns {Object} Music parameters
   */
  getMusicParameters(theme) {
    const themes = {
      mysterious: {
        notes: ['C3', 'Eb3', 'G3', 'Bb3', 'C4', 'Bb3', 'G3', 'Eb3'],
        tempo: '4n',
        pattern: 'up',
        waveform: 'sine',
      },
      heroic: {
        notes: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'G3'],
        tempo: '8n',
        pattern: 'upDown',
        waveform: 'square',
      },
      peaceful: {
        notes: ['C4', 'E4', 'G4', 'E4'],
        tempo: '2n',
        pattern: 'random',
        waveform: 'triangle',
      },
      danger: {
        notes: ['C3', 'C#3', 'C3', 'C#3', 'F#3', 'G3', 'F#3', 'C3'],
        tempo: '16n',
        pattern: 'up',
        waveform: 'sawtooth',
      },
    };

    return themes[theme] || themes.mysterious;
  }

  /**
   * Get ambience parameters from description
   * @private
   * @param {string} desc - Ambience description
   * @returns {Object} Ambience parameters
   */
  getAmbienceParameters(desc) {
    const ambiences = {
      wind: { type: 'pink', filterFreq: '8n', volume: 0.3 },
      cave: { type: 'brown', filterFreq: '1n', volume: 0.2 },
      forest: { type: 'white', filterFreq: '4n', volume: 0.15 },
      water: { type: 'pink', filterFreq: '2n', volume: 0.25 },
      fire: { type: 'brown', filterFreq: '16n', volume: 0.35 },
    };

    // Find matching ambience or default
    for (const [key, params] of Object.entries(ambiences)) {
      if (desc.toLowerCase().includes(key)) {
        return params;
      }
    }

    return ambiences.wind;
  }

  /**
   * Initialize music theory foundation
   * @private
   */
  initializeMusicTheory() {
    this.musicTheory = {
      // Scale definitions (intervals from root)
      scales: {
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10],
        harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
        pentatonicMajor: [0, 2, 4, 7, 9],
        pentatonicMinor: [0, 3, 5, 7, 10],
        blues: [0, 3, 5, 6, 7, 10],
        dorian: [0, 2, 3, 5, 7, 9, 10],
        phrygian: [0, 1, 3, 5, 7, 8, 10],
        lydian: [0, 2, 4, 6, 7, 9, 11],
        mixolydian: [0, 2, 4, 5, 7, 9, 10],
      },

      // Chord progressions for different moods
      progressions: {
        heroic: ['I', 'V', 'vi', 'IV', 'I', 'V', 'I', 'IV'],
        mysterious: ['i', 'iv', 'VII', 'III', 'VI', 'ii°', 'V', 'i'],
        peaceful: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'ii', 'V'],
        danger: ['i', 'V', 'i', 'V', 'VI', 'V', 'i', 'V'],
        sad: ['i', 'VI', 'III', 'VII', 'i', 'iv', 'V', 'i'],
        triumphant: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'],
        exploration: ['I', 'ii', 'IV', 'vi', 'V', 'iii', 'IV', 'I'],
        combat: ['i', 'V', 'i', 'VII', 'VI', 'V', 'i', 'V'],
      },

      // Rhythm patterns (1 = note, 0 = rest)
      rhythms: {
        steady: [1, 0, 1, 0, 1, 0, 1, 0],
        syncopated: [1, 0, 0, 1, 0, 1, 1, 0],
        driving: [1, 1, 1, 1, 1, 1, 1, 1],
        sparse: [1, 0, 0, 0, 1, 0, 0, 0],
        waltz: [1, 0, 0, 1, 0, 0, 1, 0, 0],
        march: [1, 0, 1, 0, 1, 1, 1, 0],
        flowing: [1, 1, 0, 1, 1, 0, 1, 0],
        dramatic: [1, 0, 0, 0, 0, 1, 1, 1],
      },

      // Theme characteristics
      themes: {
        heroic: {
          scale: 'major',
          tempo: 120,
          timeSignature: '4/4',
          rhythm: 'march',
          octaveRange: [3, 5],
          noteLength: '8n',
          intensity: 0.8,
        },
        mysterious: {
          scale: 'harmonicMinor',
          tempo: 90,
          timeSignature: '4/4',
          rhythm: 'sparse',
          octaveRange: [2, 4],
          noteLength: '4n',
          intensity: 0.5,
        },
        peaceful: {
          scale: 'major',
          tempo: 80,
          timeSignature: '3/4',
          rhythm: 'waltz',
          octaveRange: [3, 5],
          noteLength: '2n',
          intensity: 0.3,
        },
        danger: {
          scale: 'phrygian',
          tempo: 140,
          timeSignature: '4/4',
          rhythm: 'driving',
          octaveRange: [2, 4],
          noteLength: '16n',
          intensity: 0.9,
        },
        exploration: {
          scale: 'lydian',
          tempo: 100,
          timeSignature: '4/4',
          rhythm: 'flowing',
          octaveRange: [3, 5],
          noteLength: '8n',
          intensity: 0.6,
        },
        combat: {
          scale: 'minor',
          tempo: 150,
          timeSignature: '4/4',
          rhythm: 'driving',
          octaveRange: [2, 5],
          noteLength: '16n',
          intensity: 1.0,
        },
        village: {
          scale: 'dorian',
          tempo: 110,
          timeSignature: '4/4',
          rhythm: 'steady',
          octaveRange: [3, 4],
          noteLength: '8n',
          intensity: 0.4,
        },
        castle: {
          scale: 'mixolydian',
          tempo: 95,
          timeSignature: '4/4',
          rhythm: 'march',
          octaveRange: [2, 4],
          noteLength: '4n',
          intensity: 0.7,
        },
      },

      // Note names
      notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    };
  }

  /**
   * Initialize music sequencer
   * @private
   */
  initializeSequencer() {
    this.sequencer = {
      tracks: {},
      patterns: {},
      currentBar: 0,
      barsPerPhrase: 4,
      phrasesPerSection: 2,
      isPlaying: false,
      loopPoint: 0,
      variations: [],
      intensity: 1.0,
    };
  }

  /**
   * Generate complete musical arrangement
   * @private
   * @param {string} theme - Theme name
   * @param {Object} options - Generation options
   * @returns {Object} Complete arrangement
   */
  generateArrangement(theme, options = {}) {
    const themeConfig =
      this.musicTheory.themes[theme] || this.musicTheory.themes.peaceful;
    const scale = this.musicTheory.scales[themeConfig.scale];
    const progression =
      this.musicTheory.progressions[theme] ||
      this.musicTheory.progressions.peaceful;

    // Generate key and root note
    const rootNote = options.key || 'C';
    const rootOctave = themeConfig.octaveRange[0];

    // Generate arrangement structure
    const arrangement = {
      theme: theme,
      key: rootNote,
      scale: themeConfig.scale,
      tempo: options.tempo || themeConfig.tempo,
      timeSignature: themeConfig.timeSignature,
      intensity: options.intensity || themeConfig.intensity,
      tracks: {},
    };

    // Generate melody track
    arrangement.tracks.melody = this.generateMelody({
      progression,
      scale,
      rootNote,
      rootOctave: rootOctave + 1,
      rhythm: this.musicTheory.rhythms[themeConfig.rhythm],
      noteLength: themeConfig.noteLength,
      phrases: 4,
    });

    // Generate harmony track
    arrangement.tracks.harmony = this.generateHarmony({
      progression,
      scale,
      rootNote,
      rootOctave,
      noteLength: '2n',
    });

    // Generate bass track
    arrangement.tracks.bass = this.generateBassLine({
      progression,
      rootNote,
      rootOctave: rootOctave - 1,
      rhythm: this.musicTheory.rhythms.steady,
      noteLength: '4n',
    });

    // Generate drum track (if not PC speaker)
    if (options.preset !== 'pcSpeaker') {
      arrangement.tracks.drums = this.generateDrumPattern({
        style: theme,
        timeSignature: themeConfig.timeSignature,
      });
    }

    return arrangement;
  }

  /**
   * Generate melody line
   * @private
   */
  generateMelody(params) {
    const {
      progression,
      scale,
      rootNote,
      rootOctave,
      rhythm,
      noteLength,
      phrases,
    } = params;
    const melody = [];

    for (let phrase = 0; phrase < phrases; phrase++) {
      const isQuestion = phrase % 2 === 0; // Alternating question/answer phrases

      for (let bar = 0; bar < progression.length; bar++) {
        const chord = progression[bar];
        const chordTones = this.getChordTones(chord, rootNote, scale);

        for (let beat = 0; beat < rhythm.length; beat++) {
          if (rhythm[beat] === 1) {
            // Choose note based on melodic contour
            let note;
            if (isQuestion && beat === rhythm.length - 1) {
              // Question phrases end on unstable note
              note = this.chooseNonChordTone(chordTones, scale, rootNote);
            } else if (
              !isQuestion &&
              beat === rhythm.length - 1 &&
              bar === progression.length - 1
            ) {
              // Answer phrases end on tonic
              note = rootNote;
            } else {
              // Mix of chord tones and passing notes
              note =
                Math.random() > 0.7
                  ? this.choosePassingNote(chordTones, scale, rootNote)
                  : this.chooseChordTone(chordTones);
            }

            // Add octave
            const octaveVariation = Math.floor(Math.random() * 2);
            const octave = rootOctave + octaveVariation;

            melody.push({
              note: note + octave,
              duration: noteLength,
              time: `${bar}:${beat}:0`,
              velocity: 0.5 + Math.random() * 0.3,
            });
          }
        }
      }
    }

    return melody;
  }

  /**
   * Generate harmony/chord accompaniment
   * @private
   */
  generateHarmony(params) {
    const { progression, scale, rootNote, rootOctave, noteLength } = params;
    const harmony = [];

    for (let bar = 0; bar < progression.length; bar++) {
      const chord = progression[bar];
      const chordNotes = this.getChordNotes(chord, rootNote, rootOctave, scale);

      // Add chord on beat 1
      harmony.push({
        notes: chordNotes,
        duration: noteLength,
        time: `${bar}:0:0`,
        velocity: 0.4,
      });

      // Sometimes add passing chord on beat 3
      if (Math.random() > 0.6) {
        const passingChord = this.getPassingChord(
          chord,
          progression[bar + 1] || progression[0]
        );
        const passingNotes = this.getChordNotes(
          passingChord,
          rootNote,
          rootOctave,
          scale
        );

        harmony.push({
          notes: passingNotes,
          duration: '8n',
          time: `${bar}:2:0`,
          velocity: 0.3,
        });
      }
    }

    return harmony;
  }

  /**
   * Generate bass line
   * @private
   */
  generateBassLine(params) {
    const { progression, rootNote, rootOctave, rhythm, noteLength } = params;
    const bass = [];

    for (let bar = 0; bar < progression.length; bar++) {
      const chord = progression[bar];
      const bassNote = this.getChordRoot(chord, rootNote);

      for (let beat = 0; beat < rhythm.length; beat++) {
        if (rhythm[beat] === 1) {
          let note = bassNote;

          // Add some variation - occasional fifth or octave
          if (beat > 0 && Math.random() > 0.7) {
            const variation = Math.random();
            if (variation > 0.5) {
              // Fifth above
              note = this.transposeNote(bassNote, 7);
            } else {
              // Octave
              note = bassNote;
            }
          }

          bass.push({
            note: note + rootOctave,
            duration: noteLength,
            time: `${bar}:${beat}:0`,
            velocity: 0.6,
          });
        }
      }
    }

    return bass;
  }

  /**
   * Generate drum pattern
   * @private
   */
  generateDrumPattern(params) {
    const { style, timeSignature } = params;
    const drums = [];

    // Simple drum patterns based on style
    const patterns = {
      heroic: {
        kick: [1, 0, 0, 0, 1, 0, 0, 0],
        snare: [0, 0, 1, 0, 0, 0, 1, 0],
        hihat: [1, 1, 0, 1, 1, 1, 0, 1],
      },
      mysterious: {
        kick: [1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0],
        hihat: [0, 1, 0, 1, 0, 1, 0, 1],
      },
      combat: {
        kick: [1, 0, 1, 0, 1, 0, 1, 0],
        snare: [0, 1, 0, 1, 0, 1, 0, 1],
        hihat: [1, 1, 1, 1, 1, 1, 1, 1],
      },
      peaceful: {
        kick: [1, 0, 0, 0, 0, 0],
        snare: [0, 0, 1, 0, 0, 0],
        hihat: [1, 0, 1, 0, 1, 0],
      },
    };

    const pattern = patterns[style] || patterns.peaceful;
    const barLength = timeSignature === '3/4' ? 6 : 8;

    // Generate 4 bars of drums
    for (let bar = 0; bar < 4; bar++) {
      for (let beat = 0; beat < barLength; beat++) {
        if (pattern.kick[beat % pattern.kick.length]) {
          drums.push({
            drum: 'kick',
            time: `${bar}:${beat}:0`,
            velocity: 0.8,
          });
        }
        if (pattern.snare[beat % pattern.snare.length]) {
          drums.push({
            drum: 'snare',
            time: `${bar}:${beat}:0`,
            velocity: 0.6,
          });
        }
        if (pattern.hihat[beat % pattern.hihat.length]) {
          drums.push({
            drum: 'hihat',
            time: `${bar}:${beat}:0`,
            velocity: 0.4,
          });
        }
      }
    }

    return drums;
  }

  /**
   * Set up the sequencer with an arrangement
   * @private
   */
  setupSequencer(arrangement, preset) {
    // Clear existing tracks
    this.clearSequencer();

    // Set tempo
    this.Tone.Transport.bpm.value = arrangement.tempo;

    // Create synthesizers for each track
    const synthPreset = this.retroPresets[preset] || this.retroPresets.adlib;

    // Melody track
    if (arrangement.tracks.melody) {
      const melodySynth = synthPreset.synth();
      melodySynth.connect(this.volumeNodes.music);

      const melodyPart = new this.Tone.Part((time, note) => {
        melodySynth.triggerAttackRelease(
          note.note,
          note.duration,
          time,
          note.velocity
        );
      }, arrangement.tracks.melody);

      melodyPart.loop = true;
      melodyPart.loopEnd = '4m';

      this.musicTracks.melody = { synth: melodySynth, part: melodyPart };
    }

    // Harmony track (not for PC speaker)
    if (arrangement.tracks.harmony && preset !== 'pcSpeaker') {
      const harmonySynth = new this.Tone.PolySynth(this.Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.5, sustain: 0.3, release: 0.5 },
      });
      harmonySynth.connect(this.volumeNodes.music);
      harmonySynth.volume.value = -6; // Quieter than melody

      const harmonyPart = new this.Tone.Part((time, chord) => {
        harmonySynth.triggerAttackRelease(
          chord.notes,
          chord.duration,
          time,
          chord.velocity
        );
      }, arrangement.tracks.harmony);

      harmonyPart.loop = true;
      harmonyPart.loopEnd = '4m';

      this.musicTracks.harmony = { synth: harmonySynth, part: harmonyPart };
    }

    // Bass track (not for PC speaker)
    if (arrangement.tracks.bass && preset !== 'pcSpeaker') {
      const bassSynth = new this.Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 },
        filter: { Q: 2, frequency: 200, type: 'lowpass' },
      });
      bassSynth.connect(this.volumeNodes.music);
      bassSynth.volume.value = -3;

      const bassPart = new this.Tone.Part((time, note) => {
        bassSynth.triggerAttackRelease(
          note.note,
          note.duration,
          time,
          note.velocity
        );
      }, arrangement.tracks.bass);

      bassPart.loop = true;
      bassPart.loopEnd = '4m';

      this.musicTracks.bass = { synth: bassSynth, part: bassPart };
    }

    // Drum track (if present and not PC speaker)
    if (arrangement.tracks.drums && preset !== 'pcSpeaker') {
      const drumSynths = {
        kick: new this.Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 10,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
        }),
        snare: new this.Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
        }),
        hihat: new this.Tone.MetalSynth({
          frequency: 200,
          envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5,
        }),
      };

      // Connect and adjust volumes
      drumSynths.kick.connect(this.volumeNodes.music);
      drumSynths.kick.volume.value = -10;
      drumSynths.snare.connect(this.volumeNodes.music);
      drumSynths.snare.volume.value = -12;
      drumSynths.hihat.connect(this.volumeNodes.music);
      drumSynths.hihat.volume.value = -18;

      const drumPart = new this.Tone.Part((time, hit) => {
        if (hit.drum === 'kick') {
          drumSynths.kick.triggerAttackRelease('C1', '8n', time, hit.velocity);
        } else if (hit.drum === 'snare') {
          drumSynths.snare.triggerAttackRelease('8n', time, hit.velocity);
        } else if (hit.drum === 'hihat') {
          drumSynths.hihat.triggerAttackRelease('32n', time, hit.velocity);
        }
      }, arrangement.tracks.drums);

      drumPart.loop = true;
      drumPart.loopEnd = '4m';

      this.musicTracks.drums = { synths: drumSynths, part: drumPart };
    }
  }

  /**
   * Start the sequencer
   * @private
   */
  startSequencer() {
    // Start all parts
    Object.values(this.musicTracks).forEach((track) => {
      if (track && track.part) {
        track.part.start(0);
      }
    });

    // Start transport
    this.Tone.Transport.start();
    this.sequencer.isPlaying = true;
  }

  /**
   * Clear the sequencer
   * @private
   */
  clearSequencer() {
    // Stop transport
    this.Tone.Transport.stop();
    this.Tone.Transport.cancel();

    // Dispose of all tracks
    Object.values(this.musicTracks).forEach((track) => {
      if (track) {
        if (track.part) track.part.dispose();
        if (track.synth) track.synth.dispose();
        if (track.synths) {
          Object.values(track.synths).forEach((synth) => synth.dispose());
        }
      }
    });

    // Clear references
    this.musicTracks = {
      melody: null,
      harmony: null,
      bass: null,
      drums: null,
    };

    this.sequencer.isPlaying = false;
  }

  /**
   * Change music intensity
   * @param {number} intensity - 0.0 to 1.0
   */
  setMusicIntensity(intensity) {
    this.musicIntensity = Math.max(0, Math.min(1, intensity));

    // Adjust track volumes based on intensity
    if (this.musicTracks.melody && this.musicTracks.melody.synth) {
      this.musicTracks.melody.synth.volume.value = -6 + this.musicIntensity * 6;
    }
    if (this.musicTracks.harmony && this.musicTracks.harmony.synth) {
      this.musicTracks.harmony.synth.volume.value =
        -12 + this.musicIntensity * 6;
    }
    if (this.musicTracks.bass && this.musicTracks.bass.synth) {
      this.musicTracks.bass.synth.volume.value = -9 + this.musicIntensity * 6;
    }
    if (this.musicTracks.drums && this.musicTracks.drums.synths) {
      this.musicTracks.drums.synths.kick.volume.value =
        -16 + this.musicIntensity * 6;
      this.musicTracks.drums.synths.snare.volume.value =
        -18 + this.musicIntensity * 6;
      this.musicTracks.drums.synths.hihat.volume.value =
        -24 + this.musicIntensity * 6;
    }
  }

  /**
   * Transition to a new theme
   * @param {string} newTheme - New theme name
   * @param {number} transitionTime - Transition time in seconds
   */
  async transitionToTheme(newTheme, transitionTime = 2) {
    if (this.currentTheme === newTheme) return;

    // Fade out current music
    const fadeOut = new this.Tone.Gain(1).connect(this.volumeNodes.music);
    fadeOut.gain.linearRampTo(0, transitionTime);

    // Wait for fade
    await new Promise((resolve) => setTimeout(resolve, transitionTime * 1000));

    // Play new theme
    this.playMusic(newTheme, this.channels.music?.preset || 'adlib');

    // Fade in
    const fadeIn = new this.Tone.Gain(0).connect(this.volumeNodes.music);
    fadeIn.gain.linearRampTo(1, transitionTime);
  }

  /**
   * Add a leitmotif for a character or location
   * @param {string} id - Character/location ID
   * @param {Object} motif - Motif definition
   */
  addLeitmotif(id, motif) {
    this.leitmotifs.set(id, motif);
  }

  /**
   * Play a leitmotif
   * @param {string} id - Leitmotif ID
   */
  playLeitmotif(id) {
    const motif = this.leitmotifs.get(id);
    if (!motif) return;

    // Create a simple synth for the motif
    const synth = new this.Tone.Synth().connect(this.volumeNodes.music);

    // Play the motif notes
    const now = this.Tone.now();
    motif.notes.forEach((note, i) => {
      synth.triggerAttackRelease(note.pitch, note.duration, now + i * 0.25);
    });

    // Clean up after playing
    setTimeout(() => synth.dispose(), motif.notes.length * 250 + 1000);
  }

  /**
   * Get chord tones for a chord symbol
   * @private
   */
  getChordTones(chordSymbol, rootNote, scale) {
    const degree = this.parseChordDegree(chordSymbol);
    const chordRoot = this.getScaleNote(rootNote, scale, degree - 1);

    // Build triad
    const tones = [
      chordRoot,
      this.getScaleNote(rootNote, scale, (degree + 1) % scale.length),
      this.getScaleNote(rootNote, scale, (degree + 3) % scale.length),
    ];

    return tones;
  }

  /**
   * Get full chord notes with octave
   * @private
   */
  getChordNotes(chordSymbol, rootNote, octave, scale) {
    const tones = this.getChordTones(chordSymbol, rootNote, scale);
    return tones.map((tone) => tone + octave);
  }

  /**
   * Get chord root note
   * @private
   */
  getChordRoot(chordSymbol, rootNote) {
    const degree = this.parseChordDegree(chordSymbol);
    const scale = this.musicTheory.scales.major; // Use major scale for chord roots
    return this.getScaleNote(rootNote, scale, degree - 1);
  }

  /**
   * Parse chord degree from Roman numeral
   * @private
   */
  parseChordDegree(chordSymbol) {
    const numerals = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
    const baseNumeral = chordSymbol.toUpperCase().replace(/[^IVX]/g, '');
    return numerals[baseNumeral] || 1;
  }

  /**
   * Get note from scale
   * @private
   */
  getScaleNote(rootNote, scale, degree) {
    const rootIndex = this.musicTheory.notes.indexOf(rootNote.toUpperCase());
    const interval = scale[degree % scale.length];
    const noteIndex = (rootIndex + interval) % 12;
    return this.musicTheory.notes[noteIndex];
  }

  /**
   * Choose a chord tone
   * @private
   */
  chooseChordTone(chordTones) {
    return chordTones[Math.floor(Math.random() * chordTones.length)];
  }

  /**
   * Choose a non-chord tone
   * @private
   */
  chooseNonChordTone(chordTones, scale, rootNote) {
    const allNotes = scale.map((_, i) => this.getScaleNote(rootNote, scale, i));
    const nonChordTones = allNotes.filter((note) => !chordTones.includes(note));
    return (
      nonChordTones[Math.floor(Math.random() * nonChordTones.length)] ||
      chordTones[0]
    );
  }

  /**
   * Choose a passing note
   * @private
   */
  choosePassingNote(chordTones, scale, rootNote) {
    if (Math.random() > 0.5) {
      return this.chooseChordTone(chordTones);
    } else {
      return this.chooseNonChordTone(chordTones, scale, rootNote);
    }
  }

  /**
   * Get passing chord between two chords
   * @private
   */
  getPassingChord(currentChord, nextChord) {
    // Simple logic - use the dominant of the next chord
    const nextDegree = this.parseChordDegree(nextChord);
    const dominantDegree = ((nextDegree + 3) % 7) + 1; // Fifth above
    return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][dominantDegree - 1];
  }

  /**
   * Transpose a note by semitones
   * @private
   */
  transposeNote(note, semitones) {
    const noteIndex = this.musicTheory.notes.indexOf(note.toUpperCase());
    const newIndex = (noteIndex + semitones + 12) % 12;
    return this.musicTheory.notes[newIndex];
  }

  /**
   * Mute/unmute a music track
   * @param {string} trackName - 'melody', 'harmony', 'bass', or 'drums'
   * @param {boolean} mute - Whether to mute
   */
  muteTrack(trackName, mute) {
    const track = this.musicTracks[trackName];
    if (track) {
      if (track.synth) {
        track.synth.volume.value = mute ? -Infinity : 0;
      } else if (track.synths) {
        Object.values(track.synths).forEach((synth) => {
          synth.volume.value = mute ? -Infinity : -10;
        });
      }
    }
  }

  /**
   * Get sound effect parameters
   * @private
   * @param {string} soundId - Sound ID
   * @returns {Object} Sound parameters
   */
  getSoundParameters(soundId) {
    const sounds = {
      // Door sounds
      door_open: {
        type: 'procedural',
        procedural: 'door',
        frequency: [100, 150, 80],
        duration: 0.5,
      },
      door_close: {
        type: 'procedural',
        procedural: 'door',
        frequency: [80, 120, 100],
        duration: 0.4,
      },
      door_locked: {
        type: 'metal',
        frequency: 300,
        duration: 0.2,
        harmonicity: 15,
        modulation: 10,
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
      },

      // Item/inventory sounds
      pickup: {
        type: 'synth',
        waveform: 'sine',
        frequency: ['C5', 'E5', 'G5'],
        duration: 0.2,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
      },
      drop: {
        type: 'synth',
        waveform: 'triangle',
        frequency: ['G4', 'E4', 'C4'],
        duration: 0.15,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.04 },
      },
      use_item: {
        type: 'synth',
        waveform: 'square',
        frequency: 'A4',
        duration: 0.1,
        envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.04 },
      },

      // Footstep sounds (surface-dependent)
      footstep: {
        type: 'procedural',
        procedural: 'footstep',
        surface: 'stone',
        duration: 0.1,
      },
      footstep_wood: {
        type: 'procedural',
        procedural: 'footstep',
        surface: 'wood',
        duration: 0.08,
      },
      footstep_grass: {
        type: 'procedural',
        procedural: 'footstep',
        surface: 'grass',
        duration: 0.12,
      },
      footstep_metal: {
        type: 'procedural',
        procedural: 'footstep',
        surface: 'metal',
        duration: 0.06,
      },
      footstep_water: {
        type: 'noise',
        noiseType: 'pink',
        duration: 0.2,
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.04 },
      },

      // UI sounds
      menu_open: {
        type: 'synth',
        waveform: 'square',
        frequency: ['C4', 'G4'],
        duration: 0.1,
        envelope: { attack: 0.001, decay: 0.05, sustain: 0.1, release: 0.04 },
      },
      menu_close: {
        type: 'synth',
        waveform: 'square',
        frequency: ['G4', 'C4'],
        duration: 0.1,
        envelope: { attack: 0.001, decay: 0.05, sustain: 0.1, release: 0.04 },
      },
      menu_select: {
        type: 'synth',
        waveform: 'triangle',
        frequency: 'E5',
        duration: 0.05,
        envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
      },
      menu_move: {
        type: 'synth',
        waveform: 'square',
        frequency: 'C5',
        duration: 0.03,
        envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
      },
      error: {
        type: 'synth',
        waveform: 'square',
        frequency: ['A2', 'A2'],
        duration: 0.3,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
      },
      success: {
        type: 'synth',
        waveform: 'triangle',
        frequency: ['C5', 'E5', 'G5', 'C6'],
        duration: 0.4,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 },
      },

      // Environmental sounds
      wind: {
        type: 'noise',
        noiseType: 'pink',
        duration: 2,
        envelope: { attack: 0.5, decay: 0.5, sustain: 0.7, release: 0.5 },
      },
      water_drip: {
        type: 'synth',
        waveform: 'sine',
        frequency: ['C6', 'A5', 'F5'],
        duration: 0.3,
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.05 },
      },
      thunder: {
        type: 'noise',
        noiseType: 'brown',
        duration: 1.5,
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
      },

      // Retro PC speaker beeps
      beep: {
        type: 'synth',
        waveform: 'square',
        frequency: 800,
        duration: 0.1,
        envelope: { attack: 0.001, decay: 0.001, sustain: 0.9, release: 0.001 },
      },
      beep_low: {
        type: 'synth',
        waveform: 'square',
        frequency: 400,
        duration: 0.15,
        envelope: { attack: 0.001, decay: 0.001, sustain: 0.9, release: 0.001 },
      },
      beep_high: {
        type: 'synth',
        waveform: 'square',
        frequency: 1200,
        duration: 0.08,
        envelope: { attack: 0.001, decay: 0.001, sustain: 0.9, release: 0.001 },
      },
    };

    // Check for base sound and variations
    if (sounds[soundId]) {
      return sounds[soundId];
    }

    // Try to find a base version (e.g., "footstep" for "footstep_grass")
    const baseSoundId = soundId.split('_')[0];
    return sounds[baseSoundId] || sounds.error;
  }
}
