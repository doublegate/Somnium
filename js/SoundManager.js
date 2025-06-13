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

export class SoundManager {
  constructor() {
    this.isInitialized = false;
    this.masterVolume = 0.7;
    
    // Audio tracks
    this.musicTrack = null;
    this.ambienceTrack = null;
    this.soundEffects = new Map();
    
    // Tone.js will be loaded dynamically
    this.Tone = null;
    
    // Track states
    this.isMusicPlaying = false;
    this.isAmbiencePlaying = false;
  }
  
  /**
   * Set up Tone.js and audio context
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Check if Tone.js is available
      if (typeof Tone === 'undefined') {
        console.error('Tone.js not loaded');
        return;
      }
      
      this.Tone = Tone;
      
      // Start audio context (required for browser autoplay policies)
      await this.Tone.start();
      console.log('Audio context started');
      
      // Set up master volume
      this.Tone.Destination.volume.value = this.volumeToDb(this.masterVolume);
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }
  
  /**
   * Start background music from theme description
   * @param {string} musicTheme - Theme descriptor (e.g., "mysterious", "heroic", "peaceful")
   */
  playMusic(musicTheme) {
    if (!this.isInitialized) {
      console.warn('Audio not initialized');
      return;
    }
    
    // Stop current music
    this.stopMusic();
    
    console.log(`Playing music theme: ${musicTheme}`);
    
    try {
      // Generate music based on theme
      const musicParams = this.getMusicParameters(musicTheme);
      
      // Create synthesizer
      const synth = new this.Tone.PolySynth(this.Tone.Synth, {
        oscillator: { type: musicParams.waveform },
        envelope: {
          attack: 0.2,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      }).toDestination();
      
      // Create pattern
      const pattern = new this.Tone.Pattern((time, note) => {
        synth.triggerAttackRelease(note, "8n", time);
      }, musicParams.notes, musicParams.pattern);
      
      pattern.interval = musicParams.tempo;
      
      // Store reference
      this.musicTrack = { synth, pattern };
      
      // Start playing
      pattern.start(0);
      this.Tone.Transport.start();
      this.isMusicPlaying = true;
      
    } catch (error) {
      console.error('Failed to play music:', error);
    }
  }
  
  /**
   * Start ambient sound loop
   * @param {string} ambienceDesc - Ambience descriptor (e.g., "wind", "cave drips", "forest")
   */
  playAmbience(ambienceDesc) {
    if (!this.isInitialized) {
      console.warn('Audio not initialized');
      return;
    }
    
    // Stop current ambience
    this.stopAmbience();
    
    console.log(`Playing ambience: ${ambienceDesc}`);
    
    try {
      // Generate ambience based on description
      const ambienceParams = this.getAmbienceParameters(ambienceDesc);
      
      // Create noise source
      const noise = new this.Tone.Noise(ambienceParams.type).start();
      
      // Create filter
      const filter = new this.Tone.AutoFilter({
        frequency: ambienceParams.filterFreq,
        octaves: 2.6
      }).toDestination().start();
      
      // Set volume
      const gain = new this.Tone.Gain(ambienceParams.volume);
      
      // Connect chain
      noise.connect(gain);
      gain.connect(filter);
      
      // Store reference
      this.ambienceTrack = { noise, filter, gain };
      this.isAmbiencePlaying = true;
      
    } catch (error) {
      console.error('Failed to play ambience:', error);
    }
  }
  
  /**
   * Play one-shot sound effect
   * @param {string} soundId - Sound effect ID (e.g., "door_open", "pickup", "footstep")
   */
  playSound(soundId) {
    if (!this.isInitialized) {
      console.warn('Audio not initialized');
      return;
    }
    
    console.log(`Playing sound: ${soundId}`);
    
    try {
      // Get sound parameters
      const soundParams = this.getSoundParameters(soundId);
      
      // Create appropriate sound source
      let source;
      
      switch (soundParams.type) {
        case 'synth':
          source = new this.Tone.Synth({
            oscillator: { type: soundParams.waveform },
            envelope: soundParams.envelope
          }).toDestination();
          
          source.triggerAttackRelease(
            soundParams.frequency,
            soundParams.duration
          );
          break;
          
        case 'noise':
          source = new this.Tone.NoiseSynth({
            noise: { type: soundParams.noiseType },
            envelope: soundParams.envelope
          }).toDestination();
          
          source.triggerAttackRelease(soundParams.duration);
          break;
          
        case 'metal':
          source = new this.Tone.MetalSynth({
            frequency: soundParams.frequency,
            envelope: soundParams.envelope,
            harmonicity: soundParams.harmonicity || 5.1,
            modulationIndex: soundParams.modulation || 32,
            resonance: soundParams.resonance || 4000,
            octaves: soundParams.octaves || 1.5
          }).toDestination();
          
          source.triggerAttackRelease(soundParams.duration);
          break;
          
        default:
          console.warn(`Unknown sound type: ${soundParams.type}`);
      }
      
      // Store reference for cleanup
      if (source) {
        this.soundEffects.set(soundId, source);
        
        // Clean up after sound finishes
        setTimeout(() => {
          if (source.dispose) source.dispose();
          this.soundEffects.delete(soundId);
        }, soundParams.duration * 1000 + 500);
      }
      
    } catch (error) {
      console.error('Failed to play sound:', error);
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
   * Stop background music
   */
  stopMusic() {
    if (this.musicTrack) {
      this.musicTrack.pattern.stop();
      this.musicTrack.synth.dispose();
      this.musicTrack = null;
      this.isMusicPlaying = false;
    }
  }
  
  /**
   * Stop ambient sounds
   */
  stopAmbience() {
    if (this.ambienceTrack) {
      this.ambienceTrack.noise.stop();
      this.ambienceTrack.noise.dispose();
      this.ambienceTrack.filter.dispose();
      this.ambienceTrack.gain.dispose();
      this.ambienceTrack = null;
      this.isAmbiencePlaying = false;
    }
  }
  
  /**
   * Stop all sound effects
   */
  stopAllSounds() {
    this.soundEffects.forEach(sound => {
      if (sound.dispose) sound.dispose();
    });
    this.soundEffects.clear();
  }
  
  /**
   * Set master volume (0.0 - 1.0)
   * @param {number} level - Volume level
   */
  setVolume(level) {
    this.masterVolume = Math.max(0, Math.min(1, level));
    
    if (this.isInitialized && this.Tone) {
      this.Tone.Destination.volume.value = this.volumeToDb(this.masterVolume);
    }
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
  update(deltaTime) {
    // Future: Update any time-based audio effects
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
        notes: ["C3", "Eb3", "G3", "Bb3", "C4", "Bb3", "G3", "Eb3"],
        tempo: "4n",
        pattern: "up",
        waveform: "sine"
      },
      heroic: {
        notes: ["C4", "E4", "G4", "C5", "G4", "E4", "C4", "G3"],
        tempo: "8n",
        pattern: "upDown",
        waveform: "square"
      },
      peaceful: {
        notes: ["C4", "E4", "G4", "E4"],
        tempo: "2n",
        pattern: "random",
        waveform: "triangle"
      },
      danger: {
        notes: ["C3", "C#3", "C3", "C#3", "F#3", "G3", "F#3", "C3"],
        tempo: "16n",
        pattern: "up",
        waveform: "sawtooth"
      }
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
      wind: { type: "pink", filterFreq: "8n", volume: 0.3 },
      cave: { type: "brown", filterFreq: "1n", volume: 0.2 },
      forest: { type: "white", filterFreq: "4n", volume: 0.15 },
      water: { type: "pink", filterFreq: "2n", volume: 0.25 },
      fire: { type: "brown", filterFreq: "16n", volume: 0.35 }
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
   * Get sound effect parameters
   * @private
   * @param {string} soundId - Sound ID
   * @returns {Object} Sound parameters
   */
  getSoundParameters(soundId) {
    const sounds = {
      door_open: {
        type: "metal",
        frequency: 200,
        duration: 0.5,
        harmonicity: 5.1,
        modulation: 32,
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 }
      },
      pickup: {
        type: "synth",
        waveform: "sine",
        frequency: "C5",
        duration: 0.2,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
      },
      footstep: {
        type: "noise",
        noiseType: "brown",
        duration: 0.1,
        envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 }
      },
      error: {
        type: "synth",
        waveform: "square",
        frequency: "A2",
        duration: 0.3,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
      },
      success: {
        type: "synth",
        waveform: "triangle",
        frequency: "C6",
        duration: 0.4,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 }
      }
    };
    
    return sounds[soundId] || sounds.error;
  }
}