import { PuzzleSystem } from '../js/PuzzleSystem.js';

describe('PuzzleSystem', () => {
  let puzzleSystem;
  let mockGameState;
  let mockEventManager;

  beforeEach(() => {
    // Mock GameState
    mockGameState = {
      currentRoomId: 'room1',
      hasItem: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      setFlag: jest.fn(),
      setExitState: jest.fn(),
      addToRoom: jest.fn(),
      removeObject: jest.fn(),
      setCurrentRoom: jest.fn(),
      setObjectState: jest.fn(),
      updateScore: jest.fn(),
    };

    // Mock EventManager
    mockEventManager = {
      checkCondition: jest.fn().mockReturnValue(true),
      triggerEvent: jest.fn(),
    };

    puzzleSystem = new PuzzleSystem(mockGameState, mockEventManager);
  });

  describe('initialization', () => {
    it('should initialize puzzles from game data', () => {
      const gameData = {
        puzzles: [
          {
            id: 'puzzle1',
            name: 'Door Puzzle',
            trigger: { verb: 'use', item: 'key', target: 'door' },
            solution: { verb: 'use', item: 'key', target: 'door' },
            reward: { type: 'ENABLE_EXIT', room: 'room1', direction: 'north' },
            points: 10,
          },
          {
            id: 'puzzle2',
            name: 'Multi-step Puzzle',
            steps: [
              { solution: { verb: 'push', target: 'button1' } },
              { solution: { verb: 'push', target: 'button2' } },
            ],
          },
        ],
      };

      puzzleSystem.initialize(gameData);

      expect(puzzleSystem.puzzles.size).toBe(2);
      expect(puzzleSystem.puzzleStates.size).toBe(2);
      expect(puzzleSystem.multiStepProgress.has('puzzle2')).toBe(true);
    });
  });

  describe('puzzle triggers', () => {
    beforeEach(() => {
      const gameData = {
        puzzles: [
          {
            id: 'doorPuzzle',
            trigger: { verb: 'use', item: 'key', target: 'door' },
            solution: { verb: 'use', item: 'key', target: 'door' },
          },
        ],
      };
      puzzleSystem.initialize(gameData);
    });

    it('should detect matching puzzle trigger', () => {
      const action = { verb: 'use', item: 'key', target: 'door' };
      const result = puzzleSystem.checkPuzzleTrigger(action);

      expect(result.shouldTrigger).toBe(true);
      expect(result.puzzle.id).toBe('doorPuzzle');
    });

    it('should not trigger with wrong action', () => {
      const action = { verb: 'look', item: 'key', target: 'door' };
      const result = puzzleSystem.checkPuzzleTrigger(action);

      expect(result.shouldTrigger).toBe(false);
    });

    it('should check trigger conditions', () => {
      const gameData = {
        puzzles: [
          {
            id: 'conditionalPuzzle',
            trigger: {
              verb: 'push',
              target: 'button',
              conditions: [{ type: 'flag', flag: 'powerOn', value: true }],
            },
          },
        ],
      };
      puzzleSystem.initialize(gameData);

      mockEventManager.checkCondition.mockReturnValue(false);

      const action = { verb: 'push', target: 'button' };
      const result = puzzleSystem.checkPuzzleTrigger(action);

      expect(result.shouldTrigger).toBe(false);
    });
  });

  describe('single-step puzzles', () => {
    beforeEach(() => {
      const gameData = {
        puzzles: [
          {
            id: 'simplePuzzle',
            solution: { verb: 'use', item: 'key', target: 'door' },
            reward: { type: 'SET_FLAG', flag: 'doorOpen', value: true },
            points: 10,
            successMessage: 'The door unlocks!',
            failureMessage: "That doesn't work.",
            hints: ['Try using something on the door.', 'You need a key.'],
          },
        ],
      };
      puzzleSystem.initialize(gameData);
    });

    it('should complete puzzle with correct solution', () => {
      const solution = { verb: 'use', item: 'key', target: 'door' };
      const result = puzzleSystem.attemptPuzzle('simplePuzzle', solution);

      expect(result.success).toBe(true);
      expect(result.message).toBe('The door unlocks!');
      expect(result.points).toBe(10);
      expect(mockGameState.setFlag).toHaveBeenCalledWith('doorOpen', true);
      expect(mockGameState.updateScore).toHaveBeenCalledWith(10);
    });

    it('should fail with incorrect solution', () => {
      const solution = { verb: 'push', target: 'door' };
      const result = puzzleSystem.attemptPuzzle('simplePuzzle', solution);

      expect(result.success).toBe(false);
      expect(result.message).toBe("That doesn't work.");
      expect(result.hint).toBeNull(); // No hint on first attempts
    });

    it('should provide hints after multiple failures', () => {
      const wrongSolution = { verb: 'push', target: 'door' };

      // Fail 3 times
      puzzleSystem.attemptPuzzle('simplePuzzle', wrongSolution);
      puzzleSystem.attemptPuzzle('simplePuzzle', wrongSolution);
      const result = puzzleSystem.attemptPuzzle('simplePuzzle', wrongSolution);

      expect(result.hint).toBe('Try using something on the door.');
    });

    it('should not allow solving already completed puzzle', () => {
      const solution = { verb: 'use', item: 'key', target: 'door' };

      // Complete puzzle
      puzzleSystem.attemptPuzzle('simplePuzzle', solution);

      // Try again
      const result = puzzleSystem.attemptPuzzle('simplePuzzle', solution);

      expect(result.success).toBe(false);
      expect(result.message).toBe("You've already solved this puzzle.");
    });
  });

  describe('multi-step puzzles', () => {
    beforeEach(() => {
      const gameData = {
        puzzles: [
          {
            id: 'sequencePuzzle',
            steps: [
              {
                solution: { verb: 'push', target: 'button1' },
                successMessage: 'First button pressed!',
                hint: 'Press the buttons in order.',
              },
              {
                solution: { verb: 'push', target: 'button2' },
                successMessage: 'Second button pressed!',
              },
              {
                solution: { verb: 'push', target: 'button3' },
                reward: {
                  type: 'REVEAL_ITEM',
                  itemId: 'treasure',
                  room: 'room1',
                },
              },
            ],
            points: 25,
            successMessage: 'The sequence is complete!',
          },
        ],
      };
      puzzleSystem.initialize(gameData);
    });

    it('should progress through steps sequentially', () => {
      // Step 1
      let result = puzzleSystem.attemptPuzzle('sequencePuzzle', {
        verb: 'push',
        target: 'button1',
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('First button pressed!');
      expect(result.progress).toBe('1/3');

      // Step 2
      result = puzzleSystem.attemptPuzzle('sequencePuzzle', {
        verb: 'push',
        target: 'button2',
      });
      expect(result.success).toBe(true);
      expect(result.progress).toBe('2/3');

      // Step 3 - Complete
      result = puzzleSystem.attemptPuzzle('sequencePuzzle', {
        verb: 'push',
        target: 'button3',
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('The sequence is complete!');
      expect(mockGameState.addToRoom).toHaveBeenCalledWith('treasure', 'room1');
      expect(mockGameState.updateScore).toHaveBeenCalledWith(25);
    });

    it('should not allow skipping steps', () => {
      // Try step 2 first
      const result = puzzleSystem.attemptPuzzle('sequencePuzzle', {
        verb: 'push',
        target: 'button2',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('puzzle rewards', () => {
    beforeEach(() => {
      const gameData = {
        puzzles: [
          {
            id: 'rewardPuzzle',
            solution: { verb: 'solve' },
            reward: { type: 'ENABLE_EXIT', room: 'room1', direction: 'north' },
          },
        ],
      };
      puzzleSystem.initialize(gameData);
    });

    it('should execute ENABLE_EXIT reward', () => {
      puzzleSystem.attemptPuzzle('rewardPuzzle', { verb: 'solve' });

      expect(mockGameState.setExitState).toHaveBeenCalledWith(
        'room1',
        'north',
        'open'
      );
    });

    it('should execute multiple reward types', () => {
      const gameData = {
        puzzles: [
          {
            id: 'multiReward',
            solution: { verb: 'solve' },
            reward: { type: 'GIVE_ITEM', itemId: 'prize' },
          },
        ],
      };
      puzzleSystem.initialize(gameData);

      puzzleSystem.attemptPuzzle('multiReward', { verb: 'solve' });

      expect(mockGameState.addItem).toHaveBeenCalledWith('prize');
    });
  });

  describe('puzzle reset', () => {
    beforeEach(() => {
      const gameData = {
        puzzles: [
          {
            id: 'resetPuzzle',
            solution: { verb: 'solve' },
            resetActions: [
              { type: 'SET_FLAG', flag: 'puzzleReset', value: true },
            ],
          },
          {
            id: 'noResetPuzzle',
            solution: { verb: 'solve' },
            noReset: true,
          },
        ],
      };
      puzzleSystem.initialize(gameData);
    });

    it('should reset puzzle state', () => {
      // Attempt puzzle
      puzzleSystem.attemptPuzzle('resetPuzzle', { verb: 'wrong' });

      // Reset
      const success = puzzleSystem.resetPuzzle('resetPuzzle');

      expect(success).toBe(true);

      const state = puzzleSystem.getPuzzleState('resetPuzzle');
      expect(state.started).toBe(false);
      expect(state.attempts).toBe(0);
      expect(mockGameState.setFlag).toHaveBeenCalledWith('puzzleReset', true);
    });

    it('should not reset non-resettable puzzles', () => {
      const success = puzzleSystem.resetPuzzle('noResetPuzzle');
      expect(success).toBe(false);
    });
  });

  describe('puzzle statistics', () => {
    beforeEach(() => {
      const gameData = {
        puzzles: [
          { id: 'puzzle1', solution: { verb: 'solve1' } },
          { id: 'puzzle2', solution: { verb: 'solve2' } },
          { id: 'puzzle3', solution: { verb: 'solve3' } },
        ],
      };
      puzzleSystem.initialize(gameData);
    });

    it('should track puzzle statistics', () => {
      // Attempt puzzles
      puzzleSystem.attemptPuzzle('puzzle1', { verb: 'solve1' });
      puzzleSystem.attemptPuzzle('puzzle2', { verb: 'wrong' });
      puzzleSystem.attemptPuzzle('puzzle2', { verb: 'solve2' });

      // Get hint
      puzzleSystem.attemptPuzzle('puzzle3', { verb: 'wrong' });
      puzzleSystem.attemptPuzzle('puzzle3', { verb: 'wrong' });
      puzzleSystem.attemptPuzzle('puzzle3', { verb: 'wrong' });

      const stats = puzzleSystem.getStatistics();

      expect(stats.totalPuzzles).toBe(3);
      expect(stats.attempted).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.completionRate).toBeCloseTo(0.67, 2);
    });

    it('should get active puzzles', () => {
      puzzleSystem.attemptPuzzle('puzzle1', { verb: 'wrong' });
      puzzleSystem.attemptPuzzle('puzzle2', { verb: 'solve2' }); // Complete

      const active = puzzleSystem.getActivePuzzles();

      expect(active.length).toBe(1);
      expect(active[0].id).toBe('puzzle1');
    });
  });

  describe('hint cooldowns', () => {
    beforeEach(() => {
      jest.useFakeTimers();

      const gameData = {
        puzzles: [
          {
            id: 'hintPuzzle',
            solution: { verb: 'solve' },
            hints: ['Hint 1', 'Hint 2'],
          },
        ],
      };
      puzzleSystem.initialize(gameData);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should enforce hint cooldowns', () => {
      // Get first hint
      puzzleSystem.attemptPuzzle('hintPuzzle', { verb: 'wrong' });
      puzzleSystem.attemptPuzzle('hintPuzzle', { verb: 'wrong' });
      const result1 = puzzleSystem.attemptPuzzle('hintPuzzle', {
        verb: 'wrong',
      });
      expect(result1.hint).toBe('Hint 1');

      // Try to get another hint immediately
      const hint2 = puzzleSystem.getHint('hintPuzzle');
      expect(hint2).toBeNull();

      // Advance time past cooldown
      jest.advanceTimersByTime(31000);

      // Now should get hint
      const hint3 = puzzleSystem.getHint('hintPuzzle');
      expect(hint3).toBe('Hint 2');
    });
  });
});
