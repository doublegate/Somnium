/**
 * AdvancedPuzzles - Complex puzzle types beyond basic inventory puzzles
 *
 * Features:
 * - Logic puzzles (riddles, pattern matching, deduction)
 * - Timed challenges with countdown timers
 * - Multi-room puzzle chains
 * - Combination locks and cipher puzzles
 * - Sliding tile puzzles
 * - Memory matching games
 * - Sequence puzzles
 * - Environmental puzzles (redirect water, align mirrors)
 */

import { logger } from './logger.js';

export class AdvancedPuzzles {
  constructor(gameState, soundManager, eventManager) {
    this.gameState = gameState;
    this.soundManager = soundManager;
    this.eventManager = eventManager;

    // Active puzzles
    this.activePuzzles = new Map();

    // Timed puzzle trackers
    this.timers = new Map();

    // Puzzle templates
    this.puzzleTemplates = this.initializePuzzleTemplates();

    // Statistics
    this.stats = {
      puzzlesSolved: 0,
      puzzlesFailed: 0,
      timedPuzzlesCompleted: 0,
      logicPuzzlesSolved: 0,
      chainPuzzlesCompleted: 0,
    };
  }

  /**
   * Initialize puzzle templates
   * @returns {Object} Puzzle templates by type
   */
  initializePuzzleTemplates() {
    return {
      riddle: {
        type: 'riddle',
        validate: (answer, solution) => {
          return (
            answer.toLowerCase().trim() === solution.toLowerCase().trim()
          );
        },
      },
      combinationLock: {
        type: 'combinationLock',
        validate: (attempt, solution) => {
          return JSON.stringify(attempt) === JSON.stringify(solution);
        },
      },
      slidingTiles: {
        type: 'slidingTiles',
        validate: (state, solution) => {
          return JSON.stringify(state) === JSON.stringify(solution);
        },
      },
      sequencePuzzle: {
        type: 'sequencePuzzle',
        validate: (sequence, solution) => {
          return JSON.stringify(sequence) === JSON.stringify(solution);
        },
      },
      memoryMatch: {
        type: 'memoryMatch',
        validate: (matches, required) => {
          return matches >= required;
        },
      },
      cipherPuzzle: {
        type: 'cipherPuzzle',
        validate: (decoded, solution) => {
          return decoded.toLowerCase() === solution.toLowerCase();
        },
      },
    };
  }

  /**
   * Start a puzzle
   * @param {string} puzzleId - Puzzle ID
   * @param {Object} puzzleData - Puzzle configuration
   * @returns {Object} Start result
   */
  startPuzzle(puzzleId, puzzleData) {
    if (this.activePuzzles.has(puzzleId)) {
      return { success: false, message: 'Puzzle already active!' };
    }

    const puzzle = {
      id: puzzleId,
      type: puzzleData.type,
      data: puzzleData,
      startTime: Date.now(),
      attempts: 0,
      maxAttempts: puzzleData.maxAttempts || Infinity,
      timeLimit: puzzleData.timeLimit || null, // seconds
      hintsUsed: 0,
      state: this.initializePuzzleState(puzzleData),
    };

    this.activePuzzles.set(puzzleId, puzzle);

    // Start timer if time-limited
    if (puzzle.timeLimit) {
      this.startTimer(puzzleId, puzzle.timeLimit);
    }

    logger.info(`Started puzzle: ${puzzleId} (${puzzleData.type})`);

    this.eventManager.triggerEvent('puzzleStart', {
      puzzleId,
      type: puzzleData.type,
    });

    return {
      success: true,
      puzzle,
      message: puzzleData.description || 'Puzzle started!',
    };
  }

  /**
   * Initialize puzzle state based on type
   * @param {Object} puzzleData - Puzzle configuration
   * @returns {Object} Initial state
   */
  initializePuzzleState(puzzleData) {
    switch (puzzleData.type) {
      case 'riddle':
        return { answered: false };

      case 'combinationLock':
        return {
          currentCombo: new Array(puzzleData.length || 4).fill(0),
          digits: puzzleData.digits || 10,
        };

      case 'slidingTiles':
        return {
          grid: this.generateSlidingPuzzle(
            puzzleData.size || 3,
            puzzleData.solution
          ),
          emptyPos: puzzleData.emptyStart || {
            row: puzzleData.size - 1,
            col: puzzleData.size - 1,
          },
        };

      case 'sequencePuzzle':
        return {
          sequence: [],
          target: puzzleData.target,
        };

      case 'memoryMatch':
        return {
          grid: this.generateMemoryGrid(puzzleData.pairs || 8),
          revealed: [],
          matches: 0,
        };

      case 'cipherPuzzle':
        return {
          encoded: puzzleData.encoded,
          decoded: '',
          cipherType: puzzleData.cipherType || 'caesar',
          key: puzzleData.key,
        };

      default:
        return {};
    }
  }

  /**
   * Attempt to solve a puzzle
   * @param {string} puzzleId - Puzzle ID
   * @param {any} solution - Proposed solution
   * @returns {Object} Attempt result
   */
  attemptSolution(puzzleId, solution) {
    const puzzle = this.activePuzzles.get(puzzleId);

    if (!puzzle) {
      return { success: false, message: 'Puzzle not found!' };
    }

    // Check if time expired
    if (this.timers.has(puzzleId)) {
      const timer = this.timers.get(puzzleId);
      if (timer.expired) {
        return this.failPuzzle(puzzleId, 'Time expired!');
      }
    }

    puzzle.attempts++;

    // Validate solution
    const template = this.puzzleTemplates[puzzle.type];
    const correct = template.validate(solution, puzzle.data.solution);

    if (correct) {
      return this.solvePuzzle(puzzleId);
    } else {
      // Check if max attempts reached
      if (puzzle.attempts >= puzzle.maxAttempts) {
        return this.failPuzzle(puzzleId, 'No attempts remaining!');
      }

      this.soundManager.playSoundEffect('puzzle_wrong');

      return {
        success: false,
        correct: false,
        attemptsRemaining: puzzle.maxAttempts - puzzle.attempts,
        message: puzzle.data.wrongMessage || 'Incorrect solution.',
      };
    }
  }

  /**
   * Solve puzzle successfully
   * @param {string} puzzleId - Puzzle ID
   * @returns {Object} Solution result
   */
  solvePuzzle(puzzleId) {
    const puzzle = this.activePuzzles.get(puzzleId);

    if (!puzzle) {
      return { success: false, message: 'Puzzle not found!' };
    }

    // Stop timer
    if (this.timers.has(puzzleId)) {
      this.stopTimer(puzzleId);
    }

    // Calculate completion time
    const timeElapsed = (Date.now() - puzzle.startTime) / 1000;

    // Update statistics
    this.stats.puzzlesSolved++;
    if (puzzle.timeLimit) this.stats.timedPuzzlesCompleted++;
    if (puzzle.type === 'riddle') this.stats.logicPuzzlesSolved++;
    if (puzzle.data.isChainPuzzle) this.stats.chainPuzzlesCompleted++;

    // Award rewards
    const rewards = this.awardPuzzleRewards(puzzle, timeElapsed);

    // Mark puzzle as solved
    this.gameState.setFlag(`puzzle_${puzzleId}_solved`, true);

    this.activePuzzles.delete(puzzleId);

    logger.info(`Puzzle solved: ${puzzleId} in ${timeElapsed.toFixed(1)}s`);

    this.soundManager.playSoundEffect('puzzle_solve');

    this.eventManager.triggerEvent('puzzleSolved', {
      puzzleId,
      timeElapsed,
      attempts: puzzle.attempts,
      hintsUsed: puzzle.hintsUsed,
      rewards,
    });

    return {
      success: true,
      correct: true,
      message: puzzle.data.successMessage || 'Puzzle solved!',
      timeElapsed,
      attempts: puzzle.attempts,
      rewards,
    };
  }

  /**
   * Fail puzzle
   * @param {string} puzzleId - Puzzle ID
   * @param {string} reason - Failure reason
   * @returns {Object} Failure result
   */
  failPuzzle(puzzleId, reason) {
    const puzzle = this.activePuzzles.get(puzzleId);

    if (!puzzle) {
      return { success: false, message: 'Puzzle not found!' };
    }

    // Stop timer
    if (this.timers.has(puzzleId)) {
      this.stopTimer(puzzleId);
    }

    this.stats.puzzlesFailed++;

    this.activePuzzles.delete(puzzleId);

    logger.warn(`Puzzle failed: ${puzzleId} - ${reason}`);

    this.soundManager.playSoundEffect('puzzle_fail');

    this.eventManager.triggerEvent('puzzleFailed', {
      puzzleId,
      reason,
    });

    return {
      success: false,
      failed: true,
      message: `Puzzle failed: ${reason}`,
    };
  }

  /**
   * Get hint for puzzle
   * @param {string} puzzleId - Puzzle ID
   * @returns {Object} Hint result
   */
  getHint(puzzleId) {
    const puzzle = this.activePuzzles.get(puzzleId);

    if (!puzzle) {
      return { success: false, message: 'Puzzle not found!' };
    }

    if (!puzzle.data.hints || puzzle.hintsUsed >= puzzle.data.hints.length) {
      return { success: false, message: 'No hints available!' };
    }

    const hint = puzzle.data.hints[puzzle.hintsUsed];
    puzzle.hintsUsed++;

    // Deduct points for using hint
    if (puzzle.data.hintPenalty) {
      this.gameState.updateScore(-puzzle.data.hintPenalty);
    }

    this.soundManager.playSoundEffect('hint');

    return {
      success: true,
      hint,
      hintsRemaining: puzzle.data.hints.length - puzzle.hintsUsed,
    };
  }

  /**
   * Update puzzle state (for interactive puzzles)
   * @param {string} puzzleId - Puzzle ID
   * @param {Object} stateUpdate - State changes
   * @returns {Object} Update result
   */
  updatePuzzleState(puzzleId, stateUpdate) {
    const puzzle = this.activePuzzles.get(puzzleId);

    if (!puzzle) {
      return { success: false, message: 'Puzzle not found!' };
    }

    // Apply state update
    Object.assign(puzzle.state, stateUpdate);

    // Check if puzzle is auto-solved by state
    if (puzzle.data.autoValidate) {
      const template = this.puzzleTemplates[puzzle.type];
      const correct = template.validate(puzzle.state, puzzle.data.solution);

      if (correct) {
        return this.solvePuzzle(puzzleId);
      }
    }

    return {
      success: true,
      state: puzzle.state,
    };
  }

  /**
   * Start timer for timed puzzle
   * @param {string} puzzleId - Puzzle ID
   * @param {number} timeLimit - Time limit in seconds
   */
  startTimer(puzzleId, timeLimit) {
    const timer = {
      startTime: Date.now(),
      timeLimit: timeLimit * 1000,
      expired: false,
    };

    this.timers.set(puzzleId, timer);

    // Set timeout for expiration
    setTimeout(() => {
      if (this.timers.has(puzzleId)) {
        this.timers.get(puzzleId).expired = true;
        this.failPuzzle(puzzleId, 'Time expired!');
      }
    }, timer.timeLimit);
  }

  /**
   * Stop timer
   * @param {string} puzzleId - Puzzle ID
   */
  stopTimer(puzzleId) {
    this.timers.delete(puzzleId);
  }

  /**
   * Get remaining time for puzzle
   * @param {string} puzzleId - Puzzle ID
   * @returns {number} Remaining seconds
   */
  getRemainingTime(puzzleId) {
    const timer = this.timers.get(puzzleId);

    if (!timer) return null;

    const elapsed = Date.now() - timer.startTime;
    const remaining = Math.max(0, timer.timeLimit - elapsed);

    return Math.ceil(remaining / 1000);
  }

  /**
   * Award rewards for solving puzzle
   * @param {Object} puzzle - Puzzle data
   * @param {number} timeElapsed - Time to solve
   * @returns {Object} Rewards
   */
  awardPuzzleRewards(puzzle, timeElapsed) {
    const rewards = {
      score: 0,
      items: [],
      experience: 0,
    };

    // Base score
    rewards.score = puzzle.data.score || 50;

    // Bonus for speed (if timed)
    if (puzzle.timeLimit) {
      const timeBonus = Math.max(
        0,
        Math.floor((puzzle.timeLimit - timeElapsed) * 10)
      );
      rewards.score += timeBonus;
    }

    // Bonus for few attempts
    if (puzzle.attempts === 1) {
      rewards.score += 25; // Perfect solve bonus
    }

    // Penalty for hints
    rewards.score -= puzzle.hintsUsed * (puzzle.data.hintPenalty || 10);

    // Award items
    if (puzzle.data.rewardItems) {
      rewards.items = puzzle.data.rewardItems;
      for (const itemId of rewards.items) {
        this.gameState.addItem(itemId);
      }
    }

    // Award experience
    rewards.experience = puzzle.data.experience || 25;
    this.gameState.addExperience(rewards.experience);

    // Update score
    this.gameState.updateScore(rewards.score);

    return rewards;
  }

  /**
   * Generate sliding tile puzzle
   * @param {number} size - Grid size (3x3, 4x4, etc.)
   * @param {Array} solution - Solution state
   * @returns {Array} Shuffled grid
   */
  generateSlidingPuzzle(size, solution) {
    // Start with solution
    const grid = solution || this.generateSolutionGrid(size);

    // Shuffle by making random valid moves
    const shuffled = JSON.parse(JSON.stringify(grid));
    let emptyRow = size - 1;
    let emptyCol = size - 1;

    for (let i = 0; i < size * size * 10; i++) {
      const validMoves = [];

      if (emptyRow > 0) validMoves.push({ row: -1, col: 0 });
      if (emptyRow < size - 1) validMoves.push({ row: 1, col: 0 });
      if (emptyCol > 0) validMoves.push({ row: 0, col: -1 });
      if (emptyCol < size - 1) validMoves.push({ row: 0, col: 1 });

      const move = validMoves[Math.floor(Math.random() * validMoves.length)];
      const newRow = emptyRow + move.row;
      const newCol = emptyCol + move.col;

      // Swap
      [
        shuffled[emptyRow][emptyCol],
        shuffled[newRow][newCol],
      ] = [
        shuffled[newRow][newCol],
        shuffled[emptyRow][emptyCol],
      ];

      emptyRow = newRow;
      emptyCol = newCol;
    }

    return shuffled;
  }

  /**
   * Generate solution grid for sliding puzzle
   * @param {number} size - Grid size
   * @returns {Array} Solution grid
   */
  generateSolutionGrid(size) {
    const grid = [];
    let num = 1;

    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        if (row === size - 1 && col === size - 1) {
          grid[row][col] = 0; // Empty space
        } else {
          grid[row][col] = num++;
        }
      }
    }

    return grid;
  }

  /**
   * Generate memory matching grid
   * @param {number} pairs - Number of pairs
   * @returns {Array} Grid with hidden pairs
   */
  generateMemoryGrid(pairs) {
    const symbols = [];

    // Create pairs
    for (let i = 0; i < pairs; i++) {
      symbols.push(i, i);
    }

    // Shuffle
    for (let i = symbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
    }

    // Convert to grid
    const gridSize = Math.ceil(Math.sqrt(pairs * 2));
    const grid = [];

    let index = 0;
    for (let row = 0; row < gridSize; row++) {
      grid[row] = [];
      for (let col = 0; col < gridSize; col++) {
        grid[row][col] = {
          symbol: symbols[index] !== undefined ? symbols[index] : null,
          revealed: false,
        };
        index++;
      }
    }

    return grid;
  }

  /**
   * Get active puzzle data
   * @param {string} puzzleId - Puzzle ID
   * @returns {Object|null} Puzzle data or null
   */
  getActivePuzzle(puzzleId) {
    return this.activePuzzles.get(puzzleId) || null;
  }

  /**
   * Get statistics
   * @returns {Object} Puzzle statistics
   */
  getStatistics() {
    return { ...this.stats };
  }

  /**
   * Save state
   * @returns {Object} Save data
   */
  save() {
    return {
      activePuzzles: Array.from(this.activePuzzles.entries()),
      stats: { ...this.stats },
    };
  }

  /**
   * Load state
   * @param {Object} saveData - Save data
   */
  load(saveData) {
    this.activePuzzles = new Map(saveData.activePuzzles || []);
    this.stats = saveData.stats || this.stats;

    // Restart timers for loaded puzzles
    for (const [puzzleId, puzzle] of this.activePuzzles) {
      if (puzzle.timeLimit) {
        const elapsed = (Date.now() - puzzle.startTime) / 1000;
        const remaining = Math.max(0, puzzle.timeLimit - elapsed);
        if (remaining > 0) {
          this.startTimer(puzzleId, remaining);
        } else {
          this.failPuzzle(puzzleId, 'Time expired during save!');
        }
      }
    }
  }
}
