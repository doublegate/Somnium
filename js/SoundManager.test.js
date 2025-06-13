/**
 * Tests for SoundManager
 */

import { jest } from '@jest/globals';
import { SoundManager } from './SoundManager.js';

// Mock Tone.js
const mockTone = {
  start: jest.fn().mockResolvedValue(),
  Transport: {
    start: jest.fn(),
    pause: jest.fn(),
  },
  Destination: {
    volume: { value: 0 },
  },
  Gain: jest.fn().mockImplementation((value) => ({
    gain: { value },
    connect: jest.fn().mockReturnThis(),
    toDestination: jest.fn().mockReturnThis(),
  })),
  Panner: jest.fn().mockImplementation(() => ({
    pan: { value: 0 },
    connect: jest.fn().mockReturnThis(),
  })),
  MonoSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  FMSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  Synth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  MetalSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  MembraneSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  Noise: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(),
  })),
  AutoFilter: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    start: jest.fn().mockReturnThis(),
    toDestination: jest.fn().mockReturnThis(),
  })),
  Reverb: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
  })),
  BitCrusher: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
  })),
  Chorus: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
  })),
  Pattern: jest.fn().mockImplementation((_callback, _notes, _pattern) => ({
    start: jest.fn(),
    stop: jest.fn(),
    interval: '4n',
  })),
  Frequency: jest.fn().mockImplementation((_note) => ({
    toFrequency: jest.fn().mockReturnValue(440),
  })),
};

// Mock import
jest.mock('tone', () => ({ Tone: mockTone }), { virtual: true });

describe('SoundManager', () => {
  let soundManager;

  beforeEach(() => {
    soundManager = new SoundManager();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(soundManager.isInitialized).toBe(false);
      expect(soundManager.volumes.master).toBe(0.7);
      expect(soundManager.volumes.music).toBe(0.8);
      expect(soundManager.volumes.sfx).toBe(0.9);
      expect(soundManager.volumes.ambient).toBe(0.7);
    });

    it('should initialize audio context', async () => {
      await soundManager.initialize();

      expect(mockTone.start).toHaveBeenCalled();
      expect(soundManager.isInitialized).toBe(true);
    });

    it('should set up volume nodes', async () => {
      await soundManager.initialize();

      expect(mockTone.Gain).toHaveBeenCalledTimes(4); // master, music, sfx, ambient
      expect(soundManager.volumeNodes).toBeDefined();
      expect(soundManager.volumeNodes.master).toBeDefined();
    });

    it('should initialize retro presets', async () => {
      await soundManager.initialize();

      expect(soundManager.retroPresets).toBeDefined();
      expect(soundManager.retroPresets.pcSpeaker).toBeDefined();
      expect(soundManager.retroPresets.adlib).toBeDefined();
      expect(soundManager.retroPresets.mt32).toBeDefined();
    });
  });

  describe('volume control', () => {
    beforeEach(async () => {
      await soundManager.initialize();
    });

    it('should set volume for specific category', () => {
      soundManager.setVolume('master', 0.5);
      expect(soundManager.volumes.master).toBe(0.5);
      expect(soundManager.volumeNodes.master.gain.value).toBe(0.5);
    });

    it('should clamp volume values', () => {
      soundManager.setVolume('master', 1.5);
      expect(soundManager.volumes.master).toBe(1);

      soundManager.setVolume('master', -0.5);
      expect(soundManager.volumes.master).toBe(0);
    });

    it('should get current volume', () => {
      soundManager.setVolume('music', 0.6);
      expect(soundManager.getVolume('music')).toBe(0.6);
    });

    it('should set all volumes at once', () => {
      soundManager.setAllVolumes({
        master: 0.8,
        music: 0.7,
        sfx: 0.6,
        ambient: 0.5,
      });

      expect(soundManager.volumes.master).toBe(0.8);
      expect(soundManager.volumes.music).toBe(0.7);
      expect(soundManager.volumes.sfx).toBe(0.6);
      expect(soundManager.volumes.ambient).toBe(0.5);
    });
  });

  describe('music playback', () => {
    beforeEach(async () => {
      await soundManager.initialize();
    });

    it('should play music with theme', () => {
      soundManager.playMusic('mysterious');

      expect(mockTone.Pattern).toHaveBeenCalled();
      expect(mockTone.Transport.start).toHaveBeenCalled();
      expect(soundManager.channelStates.music).toBe(true);
    });

    it('should use specified preset', () => {
      soundManager.playMusic('heroic', 'pcSpeaker');

      expect(mockTone.MonoSynth).toHaveBeenCalled();
      expect(mockTone.BitCrusher).toHaveBeenCalled(); // PC speaker effect
    });

    it('should stop music', () => {
      soundManager.playMusic('peaceful');
      soundManager.stopMusic();

      expect(soundManager.channelStates.music).toBe(false);
      expect(soundManager.channels.music).toBeNull();
    });
  });

  describe('sound effects', () => {
    beforeEach(async () => {
      await soundManager.initialize();
    });

    it('should play simple sound effect', () => {
      soundManager.playSound('pickup');

      expect(mockTone.Synth).toHaveBeenCalled();
      expect(soundManager.channelStates.sfx1).toBe(true);
    });

    it('should handle spatial audio', () => {
      soundManager.playSound('footstep', { x: 100, y: 50 });

      expect(soundManager.spatialPanner.pan.value).toBeCloseTo(-0.375, 2);
    });

    it('should apply pitch variation', () => {
      soundManager.playSound('pickup', { pitch: 1.5 });

      expect(mockTone.Frequency).toHaveBeenCalled();
    });

    it('should use sound pool for repeated sounds', () => {
      // Play and let finish
      soundManager.playSound('beep');
      jest.advanceTimersByTime(200);

      // Play again - should reuse
      soundManager.playSound('beep');

      // Pool should have been used
      expect(soundManager.soundPool.has('beep')).toBe(true);
    });

    it('should handle procedural sounds', () => {
      soundManager.playSound('door_open');

      expect(mockTone.PolySynth).toHaveBeenCalled();
      expect(mockTone.Chorus).toHaveBeenCalled();
    });

    it('should play footstep variations', () => {
      soundManager.playSound('footstep_wood');

      expect(mockTone.NoiseSynth).toHaveBeenCalled();
      expect(mockTone.MembraneSynth).toHaveBeenCalled();
    });
  });

  describe('ambient sounds', () => {
    beforeEach(async () => {
      await soundManager.initialize();
    });

    it('should play ambient sound', () => {
      soundManager.playAmbience('wind');

      expect(mockTone.Noise).toHaveBeenCalled();
      expect(mockTone.AutoFilter).toHaveBeenCalled();
      expect(soundManager.channelStates.ambient).toBe(true);
    });

    it('should add reverb for cave ambience', () => {
      soundManager.playAmbience('cave drips');

      expect(mockTone.Reverb).toHaveBeenCalled();
    });

    it('should stop ambient sound', () => {
      soundManager.playAmbience('forest');
      soundManager.stopAmbience();

      expect(soundManager.channelStates.ambient).toBe(false);
      expect(soundManager.channels.ambient).toBeNull();
    });
  });

  describe('channel management', () => {
    beforeEach(async () => {
      await soundManager.initialize();
    });

    it('should use alternating SFX channels', () => {
      soundManager.playSound('pickup');
      expect(soundManager.channelStates.sfx1).toBe(true);

      soundManager.playSound('drop');
      expect(soundManager.channelStates.sfx2).toBe(true);
    });

    it('should stop all sounds', () => {
      soundManager.playMusic('mysterious');
      soundManager.playAmbience('wind');
      soundManager.playSound('pickup');

      soundManager.stopAll();

      expect(soundManager.channelStates.music).toBe(false);
      expect(soundManager.channelStates.ambient).toBe(false);
      expect(soundManager.channelStates.sfx1).toBe(false);
      expect(soundManager.channelStates.sfx2).toBe(false);
    });
  });

  describe('pause/resume', () => {
    beforeEach(async () => {
      await soundManager.initialize();
    });

    it('should pause all audio', () => {
      soundManager.pauseAll();
      expect(mockTone.Transport.pause).toHaveBeenCalled();
    });

    it('should resume all audio', () => {
      soundManager.resumeAll();
      expect(mockTone.Transport.start).toHaveBeenCalled();
    });
  });

  describe('sound parameters', () => {
    beforeEach(async () => {
      await soundManager.initialize();
    });

    it('should get correct parameters for UI sounds', () => {
      const params = soundManager.getSoundParameters('menu_open');
      expect(params.type).toBe('synth');
      expect(params.waveform).toBe('square');
      expect(Array.isArray(params.frequency)).toBe(true);
    });

    it('should get correct parameters for footsteps', () => {
      const params = soundManager.getSoundParameters('footstep_grass');
      expect(params.type).toBe('procedural');
      expect(params.surface).toBe('grass');
    });

    it('should fall back to base sound', () => {
      const params = soundManager.getSoundParameters('unknown_sound');
      expect(params.type).toBe('synth'); // error sound
      expect(params.waveform).toBe('square');
    });
  });

  describe('retro presets', () => {
    beforeEach(async () => {
      await soundManager.initialize();
    });

    it('should have PC speaker limitations', () => {
      const pcSpeaker = soundManager.retroPresets.pcSpeaker;
      expect(pcSpeaker.polyphony).toBe(1); // monophonic

      pcSpeaker.synth();
      expect(mockTone.MonoSynth).toHaveBeenCalled();
    });

    it('should have AdLib FM synthesis', () => {
      const adlib = soundManager.retroPresets.adlib;
      expect(adlib.polyphony).toBe(9); // 9 channels

      adlib.synth();
      expect(mockTone.FMSynth).toHaveBeenCalled();
    });

    it('should have MT-32 capabilities', () => {
      const mt32 = soundManager.retroPresets.mt32;
      expect(mt32.polyphony).toBe(32); // 32 voices

      mt32.synth();
      expect(mockTone.PolySynth).toHaveBeenCalled();
    });
  });
});
