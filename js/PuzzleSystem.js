/**
 * PuzzleSystem - Manages puzzle state, multi-step puzzles, hints, and rewards
 *
 * Responsibilities:
 * - Track puzzle completion state
 * - Handle multi-step puzzle progression
 * - Provide contextual hints
 * - Manage puzzle rewards and scoring
 * - Support puzzle reset/retry mechanics
 */

export class PuzzleSystem {
  constructor(gameState, eventManager) {
    this.gameState = gameState;
    this.eventManager = eventManager;

    // Puzzle definitions from game data
    this.puzzles = new Map(); // puzzleId -> puzzle definition
    this.puzzleStates = new Map(); // puzzleId -> current state

    // Multi-step puzzle tracking
    this.multiStepProgress = new Map(); // puzzleId -> {currentStep, completedSteps}

    // Hint system
    this.hintCooldowns = new Map(); // puzzleId -> last hint time
    this.hintCooldownTime = 30000; // 30 seconds between hints

    // Puzzle statistics
    this.puzzleStats = {
      attempted: new Set(),
      completed: new Set(),
      hints: new Map(), // puzzleId -> hint count
      resetCount: new Map(), // puzzleId -> reset count
    };
  }

  /**
   * Initialize puzzle system from game data
   * @param {Object} gameData - Game JSON with puzzle definitions
   */
  initialize(gameData) {
    if (!gameData.puzzles) return;

    // Load puzzle definitions
    for (const puzzle of gameData.puzzles) {
      this.puzzles.set(puzzle.id, puzzle);

      // Initialize state
      this.puzzleStates.set(puzzle.id, {
        started: false,
        completed: false,
        failed: false,
        attempts: 0,
      });

      // Initialize multi-step tracking if needed
      if (puzzle.steps && puzzle.steps.length > 1) {
        this.multiStepProgress.set(puzzle.id, {
          currentStep: 0,
          completedSteps: [],
          stepStates: new Map(),
        });
      }
    }
  }

  /**
   * Check if a puzzle action should trigger
   * @param {Object} action - Action being attempted
   * @returns {Object} {shouldTrigger: boolean, puzzle: Object}
   */
  checkPuzzleTrigger(action) {
    for (const [puzzleId, puzzle] of this.puzzles) {
      // Check if this action matches puzzle trigger
      if (this.matchesTrigger(action, puzzle.trigger)) {
        return { shouldTrigger: true, puzzle };
      }

      // Check multi-step triggers
      if (puzzle.steps) {
        const progress = this.multiStepProgress.get(puzzleId);
        const currentStep = puzzle.steps[progress.currentStep];

        if (currentStep && this.matchesTrigger(action, currentStep.trigger)) {
          return { shouldTrigger: true, puzzle, step: currentStep };
        }
      }
    }

    return { shouldTrigger: false };
  }

  /**
   * Check if action matches trigger conditions
   * @private
   */
  matchesTrigger(action, trigger) {
    if (!trigger) return false;

    // Match verb
    if (trigger.verb && action.verb !== trigger.verb) {
      return false;
    }

    // Match item
    if (trigger.item && action.item !== trigger.item) {
      return false;
    }

    // Match target
    if (trigger.target && action.target !== trigger.target) {
      return false;
    }

    // Match location
    if (trigger.location && this.gameState.currentRoomId !== trigger.location) {
      return false;
    }

    // Check additional conditions
    if (trigger.conditions) {
      for (const condition of trigger.conditions) {
        if (!this.eventManager.checkCondition(condition)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Attempt to solve a puzzle
   * @param {string} puzzleId - Puzzle to attempt
   * @param {Object} solution - Attempted solution
   * @returns {Object} Result of attempt
   */
  attemptPuzzle(puzzleId, solution) {
    const puzzle = this.puzzles.get(puzzleId);
    if (!puzzle) {
      return {
        success: false,
        message: 'Unknown puzzle',
      };
    }

    const state = this.puzzleStates.get(puzzleId);

    // Mark as started
    if (!state.started) {
      state.started = true;
      this.puzzleStats.attempted.add(puzzleId);
    }

    state.attempts++;

    // Check if already completed
    if (state.completed) {
      return {
        success: false,
        message: puzzle.completedMessage || "You've already solved this puzzle.",
      };
    }

    // Handle multi-step puzzle
    if (puzzle.steps) {
      return this.attemptMultiStepPuzzle(puzzleId, solution);
    }

    // Single-step puzzle
    const correct = this.checkSolution(solution, puzzle.solution);

    if (correct) {
      return this.completePuzzle(puzzleId);
    } else {
      state.failed = true;

      // Check if puzzle has limited attempts
      if (puzzle.maxAttempts && state.attempts >= puzzle.maxAttempts) {
        return this.failPuzzle(puzzleId);
      }

      return {
        success: false,
        message: puzzle.failureMessage || 'That doesn\'t work.',
        hint: state.attempts >= 3 ? this.getHint(puzzleId) : null,
      };
    }
  }

  /**
   * Attempt multi-step puzzle
   * @private
   */
  attemptMultiStepPuzzle(puzzleId, solution) {
    const puzzle = this.puzzles.get(puzzleId);
    const progress = this.multiStepProgress.get(puzzleId);
    const currentStep = puzzle.steps[progress.currentStep];

    if (!currentStep) {
      return {
        success: false,
        message: 'Puzzle error - no current step',
      };
    }

    // Check step solution
    const correct = this.checkSolution(solution, currentStep.solution);

    if (correct) {
      // Complete current step
      progress.completedSteps.push(progress.currentStep);
      progress.stepStates.set(progress.currentStep, 'completed');

      // Execute step rewards
      if (currentStep.reward) {
        this.executeReward(currentStep.reward);
      }

      // Check if puzzle complete
      if (progress.currentStep >= puzzle.steps.length - 1) {
        return this.completePuzzle(puzzleId);
      }

      // Move to next step
      progress.currentStep++;
      const nextStep = puzzle.steps[progress.currentStep];

      return {
        success: true,
        message:
          currentStep.successMessage || `Good! ${nextStep.hint || 'Keep going...'}`,
        nextHint: nextStep.hint,
        progress: `${progress.currentStep}/${puzzle.steps.length}`,
      };
    } else {
      return {
        success: false,
        message: currentStep.failureMessage || "That doesn't work for this step.",
        hint: this.getStepHint(puzzleId, progress.currentStep),
      };
    }
  }

  /**
   * Check if solution matches expected
   * @private
   */
  checkSolution(attempted, expected) {
    if (!expected) return false;

    // Check verb
    if (expected.verb && attempted.verb !== expected.verb) {
      return false;
    }

    // Check item
    if (expected.item && attempted.item !== expected.item) {
      return false;
    }

    // Check target
    if (expected.target && attempted.target !== expected.target) {
      return false;
    }

    // Check value (for combination locks, etc.)
    if (expected.value !== undefined && attempted.value !== expected.value) {
      return false;
    }

    // Check sequence (for pattern puzzles)
    if (expected.sequence) {
      if (!attempted.sequence) return false;
      if (attempted.sequence.length !== expected.sequence.length) return false;

      for (let i = 0; i < expected.sequence.length; i++) {
        if (attempted.sequence[i] !== expected.sequence[i]) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Complete a puzzle
   * @private
   */
  completePuzzle(puzzleId) {
    const puzzle = this.puzzles.get(puzzleId);
    const state = this.puzzleStates.get(puzzleId);

    state.completed = true;
    state.completedTime = Date.now();
    this.puzzleStats.completed.add(puzzleId);

    // Execute main reward
    if (puzzle.reward) {
      this.executeReward(puzzle.reward);
    }

    // Award points
    if (puzzle.points) {
      this.gameState.updateScore(puzzle.points);
    }

    // Trigger completion event
    this.eventManager.triggerEvent('puzzleCompleted', {
      puzzleId,
      attempts: state.attempts,
      hintsUsed: this.puzzleStats.hints.get(puzzleId) || 0,
    });

    // Set completion flag
    if (puzzle.completionFlag) {
      this.gameState.setFlag(puzzle.completionFlag, true);
    }

    return {
      success: true,
      message: puzzle.successMessage || 'You solved the puzzle!',
      points: puzzle.points,
    };
  }

  /**
   * Fail a puzzle permanently
   * @private
   */
  failPuzzle(puzzleId) {
    const puzzle = this.puzzles.get(puzzleId);
    const state = this.puzzleStates.get(puzzleId);

    state.failed = true;
    state.permanent = true;

    // Execute failure consequences
    if (puzzle.failureConsequence) {
      this.executeReward(puzzle.failureConsequence);
    }

    return {
      success: false,
      message:
        puzzle.permanentFailureMessage ||
        "You've failed this puzzle too many times.",
      permanent: true,
    };
  }

  /**
   * Execute puzzle reward/consequence
   * @private
   */
  executeReward(reward) {
    switch (reward.type) {
      case 'ENABLE_EXIT':
        this.gameState.setExitState(reward.room, reward.direction, 'open');
        break;

      case 'REVEAL_ITEM':
        this.gameState.addToRoom(reward.itemId, reward.room);
        break;

      case 'SET_FLAG':
        this.gameState.setFlag(reward.flag, reward.value);
        break;

      case 'REMOVE_OBJECT':
        this.gameState.removeObject(reward.objectId);
        break;

      case 'GIVE_ITEM':
        this.gameState.addItem(reward.itemId);
        break;

      case 'CHANGE_ROOM':
        this.gameState.setCurrentRoom(reward.roomId);
        break;

      case 'TRIGGER_EVENT':
        this.eventManager.triggerEvent(reward.eventId, reward.params);
        break;

      case 'MODIFY_OBJECT':
        this.gameState.setObjectState(reward.objectId, reward.property, reward.value);
        break;

      default:
        console.warn(`Unknown reward type: ${reward.type}`);
    }
  }

  /**
   * Get hint for a puzzle
   * @param {string} puzzleId - Puzzle to get hint for
   * @returns {string|null} Hint text or null if on cooldown
   */
  getHint(puzzleId) {
    const puzzle = this.puzzles.get(puzzleId);
    if (!puzzle || !puzzle.hints) return null;

    // Check cooldown
    const lastHint = this.hintCooldowns.get(puzzleId);
    const now = Date.now();

    if (lastHint && now - lastHint < this.hintCooldownTime) {
      return null; // Still on cooldown
    }

    // Track hint usage
    const hintCount = this.puzzleStats.hints.get(puzzleId) || 0;
    this.puzzleStats.hints.set(puzzleId, hintCount + 1);
    this.hintCooldowns.set(puzzleId, now);

    // Get appropriate hint based on hint count (not attempts)
    const hintIndex = Math.min(hintCount, puzzle.hints.length - 1);

    return puzzle.hints[hintIndex] || puzzle.hints[0];
  }

  /**
   * Get hint for multi-step puzzle step
   * @private
   */
  getStepHint(puzzleId, stepIndex) {
    const puzzle = this.puzzles.get(puzzleId);
    const step = puzzle.steps[stepIndex];

    if (!step || !step.hints) return null;

    // Similar cooldown logic
    const hintKey = `${puzzleId}_step${stepIndex}`;
    const lastHint = this.hintCooldowns.get(hintKey);
    const now = Date.now();

    if (lastHint && now - lastHint < this.hintCooldownTime) {
      return null;
    }

    this.hintCooldowns.set(hintKey, now);
    return step.hints[0]; // Could expand to multiple hints per step
  }

  /**
   * Reset a puzzle to initial state
   * @param {string} puzzleId - Puzzle to reset
   * @returns {boolean} Success
   */
  resetPuzzle(puzzleId) {
    const puzzle = this.puzzles.get(puzzleId);
    const state = this.puzzleStates.get(puzzleId);

    if (!puzzle || !state) return false;

    // Check if resettable
    if (puzzle.noReset || state.permanent) {
      return false;
    }

    // Reset state
    state.started = false;
    state.completed = false;
    state.failed = false;
    state.attempts = 0;

    // Reset multi-step progress
    if (puzzle.steps) {
      this.multiStepProgress.set(puzzleId, {
        currentStep: 0,
        completedSteps: [],
        stepStates: new Map(),
      });
    }

    // Track reset
    const resetCount = this.puzzleStats.resetCount.get(puzzleId) || 0;
    this.puzzleStats.resetCount.set(puzzleId, resetCount + 1);

    // Execute reset actions if defined
    if (puzzle.resetActions) {
      for (const action of puzzle.resetActions) {
        this.executeReward(action);
      }
    }

    return true;
  }

  /**
   * Get current puzzle state for a puzzle
   * @param {string} puzzleId - Puzzle to check
   * @returns {Object} Current state
   */
  getPuzzleState(puzzleId) {
    const state = this.puzzleStates.get(puzzleId);
    const puzzle = this.puzzles.get(puzzleId);

    if (!state || !puzzle) return null;

    const result = {
      id: puzzleId,
      name: puzzle.name,
      started: state.started,
      completed: state.completed,
      failed: state.failed,
      attempts: state.attempts,
    };

    // Add multi-step info
    if (puzzle.steps) {
      const progress = this.multiStepProgress.get(puzzleId);
      result.multiStep = true;
      result.currentStep = progress.currentStep;
      result.totalSteps = puzzle.steps.length;
      result.completedSteps = progress.completedSteps.length;
    }

    return result;
  }

  /**
   * Get all active puzzles in current context
   * @returns {Array} Active puzzle states
   */
  getActivePuzzles() {
    const active = [];

    for (const [puzzleId, state] of this.puzzleStates) {
      if (state.started && !state.completed && !state.permanent) {
        const puzzleState = this.getPuzzleState(puzzleId);
        if (puzzleState) {
          active.push(puzzleState);
        }
      }
    }

    return active;
  }

  /**
   * Get puzzle completion statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      totalPuzzles: this.puzzles.size,
      attempted: this.puzzleStats.attempted.size,
      completed: this.puzzleStats.completed.size,
      completionRate:
        this.puzzleStats.attempted.size > 0
          ? this.puzzleStats.completed.size / this.puzzleStats.attempted.size
          : 0,
      totalHints: Array.from(this.puzzleStats.hints.values()).reduce(
        (sum, count) => sum + count,
        0
      ),
      totalResets: Array.from(this.puzzleStats.resetCount.values()).reduce(
        (sum, count) => sum + count,
        0
      ),
    };
  }
}