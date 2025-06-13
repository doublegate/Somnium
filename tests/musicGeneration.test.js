/**
 * Music Generation Tests
 */

import { SoundManager } from '../js/SoundManager.js';

// Mock Tone.js
const mockTone = {
  start: jest.fn().mockResolvedValue(undefined),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    cancel: jest.fn(),
    bpm: { value: 120 },
  },
  Gain: jest.fn().mockImplementation((value) => ({
    gain: { value, linearRampTo: jest.fn() },
    connect: jest.fn().mockReturnThis(),
    toDestination: jest.fn().mockReturnThis(),
  })),
  Panner: jest.fn().mockImplementation(() => ({
    pan: { value: 0 },
    connect: jest.fn().mockReturnThis(),
  })),
  MonoSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0 },
  })),
  FMSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0 },
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0 },
  })),
  Synth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0 },
  })),
  MembraneSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0 },
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0 },
  })),
  MetalSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0 },
  })),
  Part: jest.fn().mockImplementation((callback, events) => ({
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
    loop: false,
    loopEnd: '1m',
    events: events,
    callback: callback,
  })),
  now: jest.fn().mockReturnValue(0),
};

// Mock the dynamic import
jest.mock('tone', () => ({ Tone: mockTone }), { virtual: true });

describe('Music Generation System', () => {
  let soundManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    soundManager = new SoundManager();
    await soundManager.initialize();
  });

  describe('Music Theory Foundation', () => {
    test('should initialize music theory with scales', () => {
      expect(soundManager.musicTheory).toBeDefined();
      expect(soundManager.musicTheory.scales).toBeDefined();
      expect(soundManager.musicTheory.scales.major).toEqual([
        0, 2, 4, 5, 7, 9, 11,
      ]);
      expect(soundManager.musicTheory.scales.minor).toEqual([
        0, 2, 3, 5, 7, 8, 10,
      ]);
      expect(soundManager.musicTheory.scales.pentatonicMajor).toEqual([
        0, 2, 4, 7, 9,
      ]);
    });

    test('should have chord progressions for different moods', () => {
      expect(soundManager.musicTheory.progressions).toBeDefined();
      expect(soundManager.musicTheory.progressions.heroic).toBeDefined();
      expect(soundManager.musicTheory.progressions.mysterious).toBeDefined();
      expect(soundManager.musicTheory.progressions.peaceful).toBeDefined();
      expect(soundManager.musicTheory.progressions.danger).toBeDefined();
    });

    test('should have rhythm patterns', () => {
      expect(soundManager.musicTheory.rhythms).toBeDefined();
      expect(soundManager.musicTheory.rhythms.steady).toEqual([
        1, 0, 1, 0, 1, 0, 1, 0,
      ]);
      expect(soundManager.musicTheory.rhythms.syncopated).toBeDefined();
      expect(soundManager.musicTheory.rhythms.waltz).toEqual([
        1, 0, 0, 1, 0, 0, 1, 0, 0,
      ]);
    });

    test('should have theme configurations', () => {
      expect(soundManager.musicTheory.themes).toBeDefined();
      expect(soundManager.musicTheory.themes.heroic).toMatchObject({
        scale: 'major',
        tempo: 120,
        timeSignature: '4/4',
        rhythm: 'march',
      });
    });
  });

  describe('Music Generation', () => {
    test('should generate complete arrangement', () => {
      const arrangement = soundManager.generateArrangement('heroic');

      expect(arrangement).toBeDefined();
      expect(arrangement.theme).toBe('heroic');
      expect(arrangement.key).toBe('C');
      expect(arrangement.scale).toBe('major');
      expect(arrangement.tempo).toBe(120);
      expect(arrangement.tracks).toBeDefined();
      expect(arrangement.tracks.melody).toBeDefined();
      expect(arrangement.tracks.harmony).toBeDefined();
      expect(arrangement.tracks.bass).toBeDefined();
      expect(arrangement.tracks.drums).toBeDefined();
    });

    test('should generate melody with proper structure', () => {
      const params = {
        progression: ['I', 'V', 'vi', 'IV'],
        scale: [0, 2, 4, 5, 7, 9, 11],
        rootNote: 'C',
        rootOctave: 4,
        rhythm: [1, 0, 1, 0, 1, 0, 1, 0],
        noteLength: '8n',
        phrases: 2,
      };

      const melody = soundManager.generateMelody(params);

      expect(melody).toBeDefined();
      expect(Array.isArray(melody)).toBe(true);
      expect(melody.length).toBeGreaterThan(0);

      // Check note structure
      const firstNote = melody[0];
      expect(firstNote).toHaveProperty('note');
      expect(firstNote).toHaveProperty('duration');
      expect(firstNote).toHaveProperty('time');
      expect(firstNote).toHaveProperty('velocity');
    });

    test('should generate harmony with chord progressions', () => {
      const params = {
        progression: ['I', 'V', 'vi', 'IV'],
        scale: [0, 2, 4, 5, 7, 9, 11],
        rootNote: 'C',
        rootOctave: 3,
        noteLength: '2n',
      };

      const harmony = soundManager.generateHarmony(params);

      expect(harmony).toBeDefined();
      expect(Array.isArray(harmony)).toBe(true);
      expect(harmony.length).toBeGreaterThan(0);

      // Check chord structure
      const firstChord = harmony[0];
      expect(firstChord).toHaveProperty('notes');
      expect(Array.isArray(firstChord.notes)).toBe(true);
      expect(firstChord.notes.length).toBe(3); // Triad
    });

    test('should generate bass line', () => {
      const params = {
        progression: ['I', 'V', 'vi', 'IV'],
        rootNote: 'C',
        rootOctave: 2,
        rhythm: [1, 0, 1, 0, 1, 0, 1, 0],
        noteLength: '4n',
      };

      const bass = soundManager.generateBassLine(params);

      expect(bass).toBeDefined();
      expect(Array.isArray(bass)).toBe(true);
      expect(bass.length).toBeGreaterThan(0);
    });

    test('should generate drum patterns', () => {
      const params = {
        style: 'heroic',
        timeSignature: '4/4',
      };

      const drums = soundManager.generateDrumPattern(params);

      expect(drums).toBeDefined();
      expect(Array.isArray(drums)).toBe(true);
      expect(drums.length).toBeGreaterThan(0);

      // Check for different drum types
      const drumTypes = drums.map((d) => d.drum);
      expect(drumTypes).toContain('kick');
      expect(drumTypes).toContain('snare');
      expect(drumTypes).toContain('hihat');
    });
  });

  describe('Music Playback', () => {
    test('should play music theme', () => {
      soundManager.playMusic('heroic', 'adlib');

      expect(soundManager.currentTheme).toBe('heroic');
      expect(soundManager.channelStates.music).toBe(true);
      expect(mockTone.Transport.start).toHaveBeenCalled();
    });

    test('should set up sequencer correctly', () => {
      const arrangement = soundManager.generateArrangement('peaceful');
      soundManager.setupSequencer(arrangement, 'adlib');

      expect(soundManager.musicTracks.melody).toBeDefined();
      expect(soundManager.musicTracks.harmony).toBeDefined();
      expect(soundManager.musicTracks.bass).toBeDefined();
      expect(mockTone.Part).toHaveBeenCalled();
    });

    test('should handle PC speaker limitations', () => {
      const arrangement = soundManager.generateArrangement('mysterious');
      soundManager.setupSequencer(arrangement, 'pcSpeaker');

      // PC speaker should only have melody
      expect(soundManager.musicTracks.melody).toBeDefined();
      expect(soundManager.musicTracks.harmony).toBeNull();
      expect(soundManager.musicTracks.bass).toBeNull();
      expect(soundManager.musicTracks.drums).toBeNull();
    });

    test('should stop music properly', () => {
      soundManager.playMusic('combat', 'mt32');
      soundManager.stopMusic();

      expect(soundManager.currentTheme).toBeNull();
      expect(soundManager.channelStates.music).toBe(false);
      expect(mockTone.Transport.stop).toHaveBeenCalled();
    });
  });

  describe('Adaptive Music Features', () => {
    test('should change music intensity', () => {
      soundManager.playMusic('exploration', 'adlib');
      soundManager.setMusicIntensity(0.5);

      expect(soundManager.musicIntensity).toBe(0.5);
    });

    test('should handle theme transitions', async () => {
      soundManager.playMusic('peaceful', 'adlib');

      const transitionPromise = soundManager.transitionToTheme('danger', 1);
      expect(transitionPromise).toBeInstanceOf(Promise);

      // Note: Full transition test would require mocking timers
    });

    test('should mute individual tracks', () => {
      soundManager.playMusic('village', 'mt32');

      soundManager.muteTrack('drums', true);
      expect(soundManager.musicTracks.drums).toBeDefined();

      soundManager.muteTrack('melody', false);
      expect(soundManager.musicTracks.melody).toBeDefined();
    });
  });

  describe('Leitmotif System', () => {
    test('should add leitmotifs', () => {
      const heroMotif = {
        notes: [
          { pitch: 'C4', duration: '8n' },
          { pitch: 'E4', duration: '8n' },
          { pitch: 'G4', duration: '4n' },
        ],
      };

      soundManager.addLeitmotif('hero', heroMotif);
      expect(soundManager.leitmotifs.has('hero')).toBe(true);
      expect(soundManager.leitmotifs.get('hero')).toEqual(heroMotif);
    });

    test('should play leitmotifs', () => {
      const villainMotif = {
        notes: [
          { pitch: 'A3', duration: '4n' },
          { pitch: 'F3', duration: '4n' },
        ],
      };

      soundManager.addLeitmotif('villain', villainMotif);
      soundManager.playLeitmotif('villain');

      expect(mockTone.Synth).toHaveBeenCalled();
      const synthInstance = mockTone.Synth.mock.results[0].value;
      expect(synthInstance.triggerAttackRelease).toHaveBeenCalledTimes(2);
    });
  });

  describe('Music Theory Utilities', () => {
    test('should parse chord degrees correctly', () => {
      expect(soundManager.parseChordDegree('I')).toBe(1);
      expect(soundManager.parseChordDegree('IV')).toBe(4);
      expect(soundManager.parseChordDegree('V')).toBe(5);
      expect(soundManager.parseChordDegree('vi')).toBe(6);
      expect(soundManager.parseChordDegree('VII')).toBe(7);
    });

    test('should get scale notes correctly', () => {
      const majorScale = [0, 2, 4, 5, 7, 9, 11];

      expect(soundManager.getScaleNote('C', majorScale, 0)).toBe('C');
      expect(soundManager.getScaleNote('C', majorScale, 2)).toBe('E');
      expect(soundManager.getScaleNote('C', majorScale, 4)).toBe('G');
      expect(soundManager.getScaleNote('C', majorScale, 7)).toBe('C'); // Octave
    });

    test('should build chord tones', () => {
      const majorScale = [0, 2, 4, 5, 7, 9, 11];
      const chordTones = soundManager.getChordTones('I', 'C', majorScale);

      expect(chordTones).toContain('C');
      expect(chordTones).toContain('E');
      expect(chordTones).toContain('G');
    });

    test('should transpose notes correctly', () => {
      expect(soundManager.transposeNote('C', 7)).toBe('G'); // Perfect fifth
      expect(soundManager.transposeNote('C', 12)).toBe('C'); // Octave
      expect(soundManager.transposeNote('G', 5)).toBe('C'); // Perfect fourth
    });
  });
});
