/**
 * AdvancedAudioManager.js
 * Advanced Web Audio API features including spatial audio,
 * convolution reverb, and real-time audio analysis
 */

import * as Tone from 'tone';

export class AdvancedAudioManager {
  constructor(soundManager) {
    this.soundManager = soundManager;

    // Advanced audio nodes
    this.spatialPanner = null;
    this.convolver = null;
    this.analyzer = null;
    this.compressor = null;

    // Spatial audio
    this.listenerPosition = { x: 0, y: 0, z: 0 };
    this.audioSources = new Map();

    // Impulse responses for convolution reverb
    this.impulseResponses = new Map();

    // Audio analysis
    this.analysisData = {
      waveform: new Uint8Array(256),
      frequency: new Uint8Array(256),
      rms: 0,
      peak: 0,
    };

    this.initialized = false;
    this.logger = console;
  }

  /**
   * Initialize advanced audio features
   */
  async initialize() {
    try {
      await Tone.start();

      // Create master analyzer
      this.analyzer = new Tone.Analyser('waveform', 256);
      this.analyzer.connect(Tone.Destination);

      // Create master compressor
      this.compressor = new Tone.Compressor({
        threshold: -24,
        ratio: 12,
        attack: 0.003,
        release: 0.25,
      });
      this.compressor.connect(this.analyzer);

      // Load impulse responses
      await this.loadImpulseResponses();

      this.initialized = true;
      this.logger.log('[AdvancedAudioManager] Initialized');

      // Start analysis loop
      this.startAnalysis();

      return true;
    } catch (error) {
      this.logger.error('[AdvancedAudioManager] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Load impulse responses for convolution reverb
   */
  async loadImpulseResponses() {
    const responses = {
      'small-room': await this.generateImpulseResponse(0.3, 0.5),
      'large-hall': await this.generateImpulseResponse(2.0, 0.7),
      'cave': await this.generateImpulseResponse(1.5, 0.9),
      'church': await this.generateImpulseResponse(3.0, 0.8),
    };

    for (const [name, buffer] of Object.entries(responses)) {
      this.impulseResponses.set(name, buffer);
    }

    this.logger.log('[AdvancedAudioManager] Loaded impulse responses');
  }

  /**
   * Generate synthetic impulse response
   * @param {number} duration - Duration in seconds
   * @param {number} decay - Decay factor (0-1)
   */
  async generateImpulseResponse(duration, decay) {
    const sampleRate = Tone.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = Tone.context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        // Exponential decay with random noise
        const t = i / length;
        const envelope = Math.exp(-decay * t * 10);
        channelData[i] = (Math.random() * 2 - 1) * envelope;
      }
    }

    return buffer;
  }

  /**
   * Create spatial audio source
   * @param {string} sourceId - Unique identifier for the audio source
   * @param {Object} position - 3D position {x, y, z}
   */
  createSpatialSource(sourceId, position = { x: 0, y: 0, z: 0 }) {
    const panner = new Tone.Panner3D({
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 10000,
      rolloffFactor: 1,
    });

    panner.connect(this.compressor);

    // Set position
    this.updateSpatialSourcePosition(sourceId, position);

    this.audioSources.set(sourceId, {
      panner,
      position,
      synth: null,
    });

    return panner;
  }

  /**
   * Update spatial source position
   * @param {string} sourceId - Source identifier
   * @param {Object} position - New position {x, y, z}
   */
  updateSpatialSourcePosition(sourceId, position) {
    const source = this.audioSources.get(sourceId);

    if (!source) {
      this.logger.warn(`[AdvancedAudioManager] Source ${sourceId} not found`);
      return;
    }

    source.position = position;
    source.panner.positionX.value = position.x;
    source.panner.positionY.value = position.y;
    source.panner.positionZ.value = position.z;
  }

  /**
   * Update listener position (camera/player)
   * @param {Object} position - Listener position {x, y, z}
   */
  updateListenerPosition(position) {
    this.listenerPosition = position;

    Tone.Listener.positionX.value = position.x;
    Tone.Listener.positionY.value = position.y;
    Tone.Listener.positionZ.value = position.z;
  }

  /**
   * Update listener orientation
   * @param {Object} forward - Forward vector {x, y, z}
   * @param {Object} up - Up vector {x, y, z}
   */
  updateListenerOrientation(forward, up = { x: 0, y: 1, z: 0 }) {
    Tone.Listener.forwardX.value = forward.x;
    Tone.Listener.forwardY.value = forward.y;
    Tone.Listener.forwardZ.value = forward.z;

    Tone.Listener.upX.value = up.x;
    Tone.Listener.upY.value = up.y;
    Tone.Listener.upZ.value = up.z;
  }

  /**
   * Apply convolution reverb
   * @param {string} preset - Reverb preset name
   * @param {Tone.ToneAudioNode} source - Audio source
   */
  applyReverb(preset, source) {
    const impulseBuffer = this.impulseResponses.get(preset);

    if (!impulseBuffer) {
      this.logger.warn(`[AdvancedAudioManager] Impulse response ${preset} not found`);
      return source;
    }

    const convolver = new Tone.Convolver(impulseBuffer);
    const dry = new Tone.Gain(0.7);
    const wet = new Tone.Gain(0.3);

    source.connect(dry);
    source.connect(convolver);
    convolver.connect(wet);

    dry.connect(this.compressor);
    wet.connect(this.compressor);

    return { convolver, dry, wet };
  }

  /**
   * Create dynamic compressor
   * @param {Object} options - Compressor parameters
   */
  createCompressor(options = {}) {
    return new Tone.Compressor({
      threshold: options.threshold || -24,
      ratio: options.ratio || 12,
      attack: options.attack || 0.003,
      release: options.release || 0.25,
      knee: options.knee || 30,
    });
  }

  /**
   * Create multi-band equalizer
   * @param {Array} bands - Array of {frequency, type, gain, Q}
   */
  createEqualizer(bands) {
    const eq = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 400,
      highFrequency: 2500,
    });

    return eq;
  }

  /**
   * Create vocoder effect
   * @param {number} bands - Number of vocoder bands
   */
  createVocoder(bands = 16) {
    const vocoder = {
      carrier: new Tone.Oscillator(440, 'sawtooth'),
      modulator: new Tone.UserMedia(),
      filters: [],
    };

    // Create band-pass filters
    const minFreq = 100;
    const maxFreq = 5000;

    for (let i = 0; i < bands; i++) {
      const freq = minFreq * Math.pow(maxFreq / minFreq, i / (bands - 1));
      const bandwidth = freq * 0.2;

      const carrierFilter = new Tone.Filter(freq, 'bandpass', -12);
      const modulatorFilter = new Tone.Filter(freq, 'bandpass', -12);
      const envelope = new Tone.Envelope(0.01, 0.2, 0.5, 0.1);
      const gain = new Tone.Gain(0);

      vocoder.carrier.connect(carrierFilter);
      vocoder.modulator.connect(modulatorFilter);
      modulatorFilter.connect(envelope);
      envelope.connect(gain.gain);
      carrierFilter.connect(gain);
      gain.connect(this.compressor);

      vocoder.filters.push({ carrierFilter, modulatorFilter, envelope, gain });
    }

    return vocoder;
  }

  /**
   * Start real-time audio analysis
   */
  startAnalysis() {
    const updateAnalysis = () => {
      if (!this.analyzer) return;

      // Get waveform data
      this.analysisData.waveform = this.analyzer.getValue();

      // Calculate RMS and peak
      let sum = 0;
      let peak = 0;
      const values = this.analysisData.waveform;

      for (let i = 0; i < values.length; i++) {
        const value = Math.abs(values[i]);
        sum += value * value;
        peak = Math.max(peak, value);
      }

      this.analysisData.rms = Math.sqrt(sum / values.length);
      this.analysisData.peak = peak;

      // Continue loop
      if (this.initialized) {
        requestAnimationFrame(updateAnalysis);
      }
    };

    updateAnalysis();
  }

  /**
   * Get current analysis data
   */
  getAnalysisData() {
    return {
      waveform: Array.from(this.analysisData.waveform),
      rms: this.analysisData.rms,
      peak: this.analysisData.peak,
    };
  }

  /**
   * Create frequency-based visualizer data
   */
  getFrequencyData() {
    if (!this.analyzer) return [];

    const fftAnalyzer = new Tone.FFT(256);
    const values = fftAnalyzer.getValue();

    return Array.from(values);
  }

  /**
   * Apply audio ducking (reduce music when dialogue plays)
   * @param {Tone.ToneAudioNode} music - Music source
   * @param {Tone.ToneAudioNode} dialogue - Dialogue source
   */
  applyDucking(music, dialogue) {
    const compressor = new Tone.Compressor({
      threshold: -30,
      ratio: 12,
      attack: 0.1,
      release: 0.5,
    });

    dialogue.connect(compressor);
    music.connect(compressor);

    return compressor;
  }

  /**
   * Create audio visualization canvas
   * @param {HTMLCanvasElement} canvas - Target canvas
   */
  createVisualization(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      const data = this.getAnalysisData();

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = width / data.waveform.length;
      let x = 0;

      for (let i = 0; i < data.waveform.length; i++) {
        const v = (data.waveform[i] + 1) / 2; // Normalize to 0-1
        const y = v * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      if (this.initialized) {
        requestAnimationFrame(draw);
      }
    };

    draw();
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.initialized = false;

    if (this.analyzer) {
      this.analyzer.dispose();
    }

    if (this.compressor) {
      this.compressor.dispose();
    }

    this.audioSources.forEach((source) => {
      source.panner.dispose();
      if (source.synth) {
        source.synth.dispose();
      }
    });

    this.audioSources.clear();
    this.logger.log('[AdvancedAudioManager] Destroyed');
  }
}
