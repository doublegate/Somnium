import { GameProgression } from '../js/GameProgression.js';

describe('GameProgression', () => {
  let gameProgression;
  let mockGameState;
  let mockEventManager;

  beforeEach(() => {
    jest.useFakeTimers();

    // Mock GameState
    mockGameState = {
      currentRoomId: 'room1',
      createSnapshot: jest.fn().mockReturnValue({ snapshot: 'data' }),
      restoreSnapshot: jest.fn(),
      getRoom: jest.fn((id) => ({ id, secret: id === 'secretRoom' })),
    };

    // Mock EventManager
    mockEventManager = {
      checkCondition: jest.fn().mockReturnValue(false),
      triggerEvent: jest.fn(),
      on: jest.fn(),
    };

    gameProgression = new GameProgression(mockGameState, mockEventManager);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize progression data from game data', () => {
      const gameData = {
        progression: {
          maxScore: 500,
          parMoves: 100,
          winCondition: { type: 'flag', flag: 'gameWon', value: true },
          totalRooms: 20,
        },
        endings: [
          {
            id: 'good',
            priority: 2,
            conditions: [{ type: 'score', operator: '>=', value: 400 }],
          },
          {
            id: 'bad',
            priority: 1,
            conditions: [{ type: 'score', operator: '<', value: 200 }],
          },
        ],
        achievements: [
          { id: 'explorer', name: 'Explorer', points: 10 },
          { id: 'collector', name: 'Collector', progressive: true, target: 10 },
        ],
      };

      gameProgression.initialize(gameData);

      expect(gameProgression.maxScore).toBe(500);
      expect(gameProgression.endings.size).toBe(2);
      expect(gameProgression.achievements.size).toBe(2);
      expect(gameProgression.achievementProgress.has('collector')).toBe(true);
    });

    it('should subscribe to game events', () => {
      gameProgression.initialize({});

      expect(mockEventManager.on).toHaveBeenCalledWith(
        'enterRoom',
        expect.any(Function)
      );
      expect(mockEventManager.on).toHaveBeenCalledWith(
        'itemCollected',
        expect.any(Function)
      );
      expect(mockEventManager.on).toHaveBeenCalledWith(
        'puzzleCompleted',
        expect.any(Function)
      );
      expect(mockEventManager.on).toHaveBeenCalledWith(
        'npcMet',
        expect.any(Function)
      );
      expect(mockEventManager.on).toHaveBeenCalledWith(
        'playerDeath',
        expect.any(Function)
      );
    });
  });

  describe('score management', () => {
    beforeEach(() => {
      gameProgression.initialize({ progression: { maxScore: 500 } });
    });

    it('should update score', () => {
      gameProgression.updateScore(50, 'Found treasure');

      expect(gameProgression.score).toBe(50);
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith(
        'scoreChanged',
        {
          oldScore: 0,
          newScore: 50,
          change: 50,
          reason: 'Found treasure',
        }
      );
    });

    it('should not allow negative scores', () => {
      gameProgression.updateScore(-100);
      expect(gameProgression.score).toBe(0);
    });

    it('should check score achievements', () => {
      gameProgression.achievements.set('score_100', {
        id: 'score_100',
        name: '100 Points',
      });

      gameProgression.updateScore(100);

      expect(gameProgression.unlockedAchievements.has('score_100')).toBe(true);
    });

    it('should unlock perfect score achievement', () => {
      gameProgression.achievements.set('perfect_score', {
        id: 'perfect_score',
      });

      gameProgression.updateScore(500);

      expect(gameProgression.unlockedAchievements.has('perfect_score')).toBe(
        true
      );
    });
  });

  describe('move tracking', () => {
    beforeEach(() => {
      gameProgression.initialize({ progression: { parMoves: 50 } });
      gameProgression.achievements.set('par_moves', {
        id: 'par_moves',
        name: 'Par Score',
      });
    });

    it('should increment moves', () => {
      gameProgression.incrementMoves();
      gameProgression.incrementMoves();

      expect(gameProgression.moves).toBe(2);
    });

    it('should unlock par moves achievement', () => {
      for (let i = 0; i < 50; i++) {
        gameProgression.incrementMoves();
      }

      expect(gameProgression.unlockedAchievements.has('par_moves')).toBe(true);
    });
  });

  describe('game completion', () => {
    beforeEach(() => {
      const gameData = {
        progression: {
          winCondition: { type: 'flag', flag: 'artifactFound', value: true },
          failureConditions: [{ type: 'flag', flag: 'poisoned', value: true }],
        },
        endings: [
          {
            id: 'heroic',
            priority: 3,
            conditions: [
              { type: 'score', operator: '>=', value: 400 },
              { type: 'achievement', achievementId: 'no_deaths' },
            ],
          },
          {
            id: 'good',
            priority: 2,
            conditions: [{ type: 'score', operator: '>=', value: 200 }],
          },
          {
            id: 'default',
            priority: 1,
            conditions: [],
          },
        ],
      };
      gameProgression.initialize(gameData);
    });

    it('should detect game completion', () => {
      mockEventManager.checkCondition.mockImplementation(
        (condition) => condition.flag === 'artifactFound'
      );

      const result = gameProgression.checkGameCompletion();

      expect(result.completed).toBe(true);
      expect(result.endingId).toBe('default');
    });

    it('should detect failure conditions', () => {
      mockEventManager.checkCondition.mockImplementation(
        (condition) => condition.flag === 'poisoned'
      );

      const result = gameProgression.checkGameCompletion();

      expect(result.completed).toBe(true);
      expect(result.endingId).toBe('failure');
      expect(result.failed).toBe(true);
    });

    it('should determine best ending based on conditions', () => {
      mockEventManager.checkCondition.mockImplementation(
        (condition) => condition.flag === 'artifactFound'
      );
      gameProgression.score = 250;

      const result = gameProgression.checkGameCompletion();

      expect(result.endingId).toBe('good');
    });

    it('should prioritize higher priority endings', () => {
      mockEventManager.checkCondition.mockImplementation(
        (condition) => condition.flag === 'artifactFound'
      );
      gameProgression.score = 450;
      gameProgression.unlockedAchievements.add('no_deaths');

      const result = gameProgression.checkGameCompletion();

      expect(result.endingId).toBe('heroic');
    });
  });

  describe('achievements', () => {
    beforeEach(() => {
      const gameData = {
        achievements: [
          { id: 'first_room', name: 'First Steps', points: 5 },
          { id: 'explorer', name: 'Explorer' },
          { id: 'collector', name: 'Collector', progressive: true, target: 5 },
        ],
      };
      gameProgression.initialize(gameData);
    });

    it('should unlock achievements', () => {
      gameProgression.unlockAchievement('first_room');

      expect(gameProgression.unlockedAchievements.has('first_room')).toBe(true);
      expect(gameProgression.score).toBe(5);
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith(
        'achievementUnlocked',
        expect.objectContaining({ achievementId: 'first_room' })
      );
    });

    it('should not unlock same achievement twice', () => {
      gameProgression.unlockAchievement('first_room');
      gameProgression.unlockAchievement('first_room');

      expect(gameProgression.score).toBe(5); // Only counted once
    });

    it('should update progressive achievement progress', () => {
      gameProgression.updateAchievementProgress('collector', 3);

      const progress = gameProgression.achievementProgress.get('collector');
      expect(progress.current).toBe(3);
      expect(gameProgression.unlockedAchievements.has('collector')).toBe(false);

      gameProgression.updateAchievementProgress('collector', 2);
      expect(gameProgression.unlockedAchievements.has('collector')).toBe(true);
    });

    it('should check meta achievements', () => {
      gameProgression.achievements.set('achievement_hunter', {
        id: 'achievement_hunter',
        name: 'Achievement Hunter',
      });

      // Unlock 10 achievements
      for (let i = 0; i < 10; i++) {
        gameProgression.achievements.set(`ach_${i}`, { id: `ach_${i}` });
        gameProgression.unlockAchievement(`ach_${i}`);
      }

      expect(
        gameProgression.unlockedAchievements.has('achievement_hunter')
      ).toBe(true);
    });
  });

  describe('save points', () => {
    it('should create save points', () => {
      gameProgression.score = 100;
      gameProgression.moves = 50;

      gameProgression.createSavePoint('checkpoint1', 'Before boss fight');

      const savePoint = gameProgression.savePoints.get('checkpoint1');
      expect(savePoint).toBeDefined();
      expect(savePoint.description).toBe('Before boss fight');
      expect(savePoint.score).toBe(100);
      expect(savePoint.moves).toBe(50);
      expect(mockGameState.createSnapshot).toHaveBeenCalled();
    });

    it('should restore from save points', () => {
      gameProgression.createSavePoint('checkpoint1');

      // Change state
      gameProgression.score = 200;
      gameProgression.moves = 100;

      // Restore
      const success = gameProgression.restoreSavePoint('checkpoint1');

      expect(success).toBe(true);
      expect(gameProgression.score).toBe(0); // Original score
      expect(gameProgression.moves).toBe(0); // Original moves
      expect(mockGameState.restoreSnapshot).toHaveBeenCalled();
    });

    it('should handle auto-save', () => {
      gameProgression.initialize({});

      jest.advanceTimersByTime(300000); // 5 minutes

      expect(gameProgression.savePoints.has('autosave')).toBe(true);
    });
  });

  describe('ending factors', () => {
    beforeEach(() => {
      gameProgression.initialize({});
    });

    it('should update ending factors', () => {
      gameProgression.updateEndingFactor('karma', 30);
      gameProgression.updateEndingFactor('karma', 25);

      expect(gameProgression.endingFactors.get('karma')).toBe(55);
    });

    it('should update story path based on factors', () => {
      gameProgression.updateEndingFactor('karma', 60);
      gameProgression.updateEndingFactor('heroism', 60);

      expect(gameProgression.currentPath).toBe('hero');
    });

    it('should set villain path for negative karma', () => {
      gameProgression.updateEndingFactor('karma', -60);

      expect(gameProgression.currentPath).toBe('villain');
    });
  });

  describe('statistics tracking', () => {
    beforeEach(() => {
      gameProgression.initialize({ progression: { totalRooms: 10 } });

      // Simulate event handlers
      const handlers = {};
      mockEventManager.on.mockImplementation((event, handler) => {
        handlers[event] = handler;
      });

      gameProgression.initialize({});

      // Trigger events manually
      handlers.enterRoom({ room: 'room1' });
      handlers.enterRoom({ room: 'room2' });
      handlers.itemCollected({ itemId: 'sword' });
      handlers.puzzleCompleted({ puzzleId: 'door' });
    });

    it('should track visited rooms', () => {
      expect(gameProgression.statistics.roomsVisited.size).toBe(2);
    });

    it('should track collected items', () => {
      expect(gameProgression.statistics.itemsCollected.has('sword')).toBe(true);
    });

    it('should track solved puzzles', () => {
      expect(gameProgression.statistics.puzzlesSolved.has('door')).toBe(true);
    });

    it('should calculate completion percentage', () => {
      gameProgression.score = 250;
      gameProgression.maxScore = 500;
      gameProgression.progressionData = { totalRooms: 10 };
      gameProgression.statistics.roomsVisited = new Set([
        'r1',
        'r2',
        'r3',
        'r4',
        'r5',
      ]);
      gameProgression.achievements = new Map([
        ['a1', {}],
        ['a2', {}],
        ['a3', {}],
        ['a4', {}],
      ]);
      gameProgression.unlockedAchievements = new Set(['a1', 'a2']);

      const percentage = gameProgression.calculateCompletionPercentage();

      // (0.5 + 0.5 + 0.5) / 3 = 0.5 = 50%
      expect(percentage).toBe(50);
    });
  });

  describe('progression status', () => {
    it('should get current progression status', () => {
      gameProgression.score = 150;
      gameProgression.maxScore = 300;
      gameProgression.moves = 75;
      gameProgression.achievements = new Map([
        ['a1', {}],
        ['a2', {}],
      ]);
      gameProgression.unlockedAchievements = new Set(['a1']);

      const status = gameProgression.getProgressionStatus();

      expect(status).toMatchObject({
        score: 150,
        maxScore: 300,
        moves: 75,
        achievementsUnlocked: 1,
        totalAchievements: 2,
        currentPath: 'neutral',
      });
    });

    it('should get final statistics', () => {
      gameProgression.score = 400;
      gameProgression.statistics.roomsVisited = new Set(['r1', 'r2', 'r3']);
      gameProgression.statistics.deaths = 2;

      const stats = gameProgression.getFinalStatistics();

      expect(stats).toMatchObject({
        score: 400,
        roomsExplored: 3,
        deaths: 2,
      });
    });
  });

  describe('ending triggers', () => {
    beforeEach(() => {
      const gameData = {
        endings: [
          {
            id: 'golden',
            name: 'Golden Ending',
            achievement: 'golden_achievement',
          },
        ],
        achievements: [
          { id: 'golden_achievement', name: 'Golden Achievement' },
        ],
      };
      gameProgression.initialize(gameData);
    });

    it('should trigger game ending', () => {
      gameProgression.triggerEnding('golden');

      expect(
        gameProgression.unlockedAchievements.has('golden_achievement')
      ).toBe(true);
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith(
        'gameEnding',
        expect.objectContaining({
          endingId: 'golden',
          score: 0,
          moves: 0,
        })
      );
    });
  });
});
