/**
 * GameProgression - Manages scoring, achievements, game completion, and endings
 *
 * Responsibilities:
 * - Track and calculate score
 * - Manage achievements and milestones
 * - Detect game completion conditions
 * - Support multiple endings
 * - Handle save points and checkpoints
 */

export class GameProgression {
  constructor(gameState, eventManager) {
    this.gameState = gameState;
    this.eventManager = eventManager;

    // Progression data from game JSON
    this.progressionData = null;
    this.endings = new Map(); // endingId -> ending data
    this.achievements = new Map(); // achievementId -> achievement data

    // Current progression state
    this.score = 0;
    this.maxScore = 0;
    this.moves = 0;
    this.startTime = Date.now();

    // Achievement tracking
    this.unlockedAchievements = new Set();
    this.achievementProgress = new Map(); // achievementId -> progress data

    // Save points
    this.savePoints = new Map(); // savePointId -> save data
    this.lastCheckpoint = null;
    this.autoSaveEnabled = true;
    this.autoSaveInterval = 300000; // 5 minutes

    // Ending tracking
    this.currentPath = 'neutral'; // Track story path for endings
    this.endingFactors = new Map(); // factor -> value for ending calculation

    // Statistics
    this.statistics = {
      roomsVisited: new Set(),
      itemsCollected: new Set(),
      puzzlesSolved: new Set(),
      npcsmet: new Set(),
      deaths: 0,
      hintsUsed: 0,
      timePlayed: 0,
    };
  }

  /**
   * Initialize progression system from game data
   * @param {Object} gameData - Game JSON with progression definitions
   */
  initialize(gameData) {
    if (gameData.progression) {
      this.progressionData = gameData.progression;
      this.maxScore = gameData.progression.maxScore || 0;
    }

    // Load endings
    if (gameData.endings) {
      for (const ending of gameData.endings) {
        this.endings.set(ending.id, ending);
      }
    }

    // Load achievements
    if (gameData.achievements) {
      for (const achievement of gameData.achievements) {
        this.achievements.set(achievement.id, achievement);

        // Initialize progress tracking for progressive achievements
        if (achievement.progressive) {
          this.achievementProgress.set(achievement.id, {
            current: 0,
            target: achievement.target,
          });
        }
      }
    }

    // Start auto-save timer
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }

    // Subscribe to game events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to game events for tracking
   * @private
   */
  subscribeToEvents() {
    // Check if eventManager has 'on' method (it might not in tests)
    if (!this.eventManager || typeof this.eventManager.on !== 'function') {
      return;
    }

    // Room changes
    this.eventManager.on('enterRoom', (data) => {
      this.statistics.roomsVisited.add(data.room);
      this.checkLocationAchievements(data.room);
    });

    // Item collection
    this.eventManager.on('itemCollected', (data) => {
      this.statistics.itemsCollected.add(data.itemId);
      this.checkCollectionAchievements();
    });

    // Puzzle completion
    this.eventManager.on('puzzleCompleted', (data) => {
      this.statistics.puzzlesSolved.add(data.puzzleId);
      this.checkPuzzleAchievements();
    });

    // NPC interactions
    this.eventManager.on('npcMet', (data) => {
      this.statistics.npcsmet.add(data.npcId);
    });

    // Death tracking
    this.eventManager.on('playerDeath', () => {
      this.statistics.deaths++;
      this.checkDeathAchievements();
    });
  }

  /**
   * Update game score
   * @param {number} points - Points to add (can be negative)
   * @param {string} reason - Reason for score change
   */
  updateScore(points, reason = '') {
    const oldScore = this.score;
    this.score = Math.max(0, this.score + points);

    // Track score milestones
    this.checkScoreAchievements(oldScore, this.score);

    // Trigger score change event
    this.eventManager.triggerEvent('scoreChanged', {
      oldScore,
      newScore: this.score,
      change: points,
      reason,
    });

    // Check for perfect score
    if (this.score >= this.maxScore) {
      this.unlockAchievement('perfect_score');
    }
  }

  /**
   * Increment move counter
   */
  incrementMoves() {
    this.moves++;

    // Check for efficiency achievements
    if (this.progressionData && this.progressionData.parMoves) {
      if (this.moves === this.progressionData.parMoves) {
        this.unlockAchievement('par_moves');
      }
    }
  }

  /**
   * Check if game completion conditions are met
   * @returns {Object} {completed: boolean, endingId: string}
   */
  checkGameCompletion() {
    // Check main goal completion
    if (this.progressionData && this.progressionData.winCondition) {
      const conditionMet = this.eventManager.checkCondition(
        this.progressionData.winCondition
      );

      if (conditionMet) {
        // Determine which ending
        const endingId = this.determineEnding();
        return { completed: true, endingId };
      }
    }

    // Check for failure conditions
    if (this.progressionData && this.progressionData.failureConditions) {
      for (const condition of this.progressionData.failureConditions) {
        if (this.eventManager.checkCondition(condition)) {
          return { completed: true, endingId: 'failure', failed: true };
        }
      }
    }

    return { completed: false };
  }

  /**
   * Determine which ending the player achieved
   * @private
   */
  determineEnding() {
    let bestEnding = null;
    let bestPriority = -1;

    for (const [endingId, ending] of this.endings) {
      // Check if ending conditions are met
      if (ending.conditions) {
        let allConditionsMet = true;

        for (const condition of ending.conditions) {
          if (!this.checkEndingCondition(condition)) {
            allConditionsMet = false;
            break;
          }
        }

        if (allConditionsMet && ending.priority > bestPriority) {
          bestEnding = endingId;
          bestPriority = ending.priority;
        }
      }
    }

    return bestEnding || 'default';
  }

  /**
   * Check specific ending condition
   * @private
   */
  checkEndingCondition(condition) {
    switch (condition.type) {
      case 'score':
        return this.checkScoreCondition(condition);

      case 'achievement':
        return this.unlockedAchievements.has(condition.achievementId);

      case 'path':
        return this.currentPath === condition.path;

      case 'factor': {
        const value = this.endingFactors.get(condition.factor) || 0;
        return this.checkValueCondition(
          value,
          condition.operator,
          condition.value
        );
      }

      case 'time': {
        const timePlayed = Date.now() - this.startTime;
        return this.checkValueCondition(
          timePlayed,
          condition.operator,
          condition.value * 60000
        ); // Convert minutes to ms
      }

      default:
        return this.eventManager.checkCondition(condition);
    }
  }

  /**
   * Check score-based condition
   * @private
   */
  checkScoreCondition(condition) {
    return this.checkValueCondition(
      this.score,
      condition.operator,
      condition.value
    );
  }

  /**
   * Check value comparison
   * @private
   */
  checkValueCondition(value, operator, target) {
    switch (operator) {
      case '>=':
        return value >= target;
      case '>':
        return value > target;
      case '<=':
        return value <= target;
      case '<':
        return value < target;
      case '==':
        return value === target;
      case '!=':
        return value !== target;
      default:
        return false;
    }
  }

  /**
   * Trigger game ending
   * @param {string} endingId - ID of ending achieved
   */
  triggerEnding(endingId) {
    const ending = this.endings.get(endingId);
    if (!ending) {
      console.error(`Unknown ending: ${endingId}`);
      return;
    }

    // Calculate final statistics
    const finalStats = this.getFinalStatistics();

    // Unlock ending achievement if exists
    if (ending.achievement) {
      this.unlockAchievement(ending.achievement);
    }

    // Trigger ending event
    this.eventManager.triggerEvent('gameEnding', {
      endingId,
      ending,
      score: this.score,
      moves: this.moves,
      statistics: finalStats,
    });
  }

  /**
   * Unlock an achievement
   * @param {string} achievementId - Achievement to unlock
   */
  unlockAchievement(achievementId) {
    if (this.unlockedAchievements.has(achievementId)) {
      return; // Already unlocked
    }

    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      return; // Unknown achievement
    }

    this.unlockedAchievements.add(achievementId);

    // Award points if specified
    if (achievement.points) {
      this.updateScore(achievement.points, `Achievement: ${achievement.name}`);
    }

    // Trigger achievement event
    this.eventManager.triggerEvent('achievementUnlocked', {
      achievementId,
      achievement,
    });

    // Check for meta-achievements (achievements for getting achievements)
    this.checkMetaAchievements();
  }

  /**
   * Update progressive achievement progress
   * @param {string} achievementId - Achievement to update
   * @param {number} amount - Amount to add to progress
   */
  updateAchievementProgress(achievementId, amount = 1) {
    const progress = this.achievementProgress.get(achievementId);
    if (!progress) return;

    progress.current += amount;

    // Check if completed
    if (progress.current >= progress.target) {
      this.unlockAchievement(achievementId);
    }
  }

  /**
   * Create a save point
   * @param {string} savePointId - ID for this save point
   * @param {string} description - Description of save point
   */
  createSavePoint(savePointId, description = '') {
    const saveData = {
      id: savePointId,
      description,
      timestamp: Date.now(),
      gameState: this.gameState.createSnapshot(),
      score: this.score,
      moves: this.moves,
      achievements: Array.from(this.unlockedAchievements),
      statistics: { ...this.statistics },
    };

    this.savePoints.set(savePointId, saveData);
    this.lastCheckpoint = savePointId;

    // Trigger save point event
    this.eventManager.triggerEvent('savePointCreated', {
      savePointId,
      description,
    });
  }

  /**
   * Restore from save point
   * @param {string} savePointId - Save point to restore
   */
  restoreSavePoint(savePointId) {
    const saveData = this.savePoints.get(savePointId);
    if (!saveData) {
      return false;
    }

    // Restore game state
    this.gameState.restoreSnapshot(saveData.gameState);

    // Restore progression data
    this.score = saveData.score;
    this.moves = saveData.moves;
    this.unlockedAchievements = new Set(saveData.achievements);
    this.statistics = { ...saveData.statistics };

    // Trigger restore event
    this.eventManager.triggerEvent('savePointRestored', {
      savePointId,
    });

    return true;
  }

  /**
   * Start auto-save timer
   * @private
   */
  startAutoSave() {
    setInterval(() => {
      if (this.autoSaveEnabled) {
        this.createSavePoint('autosave', 'Auto-save');
      }
    }, this.autoSaveInterval);
  }

  /**
   * Check location-based achievements
   * @private
   */
  checkLocationAchievements(roomId) {
    // Explorer achievement
    if (this.statistics.roomsVisited.size >= 10) {
      this.unlockAchievement('explorer');
    }

    // Completionist achievement
    if (
      this.progressionData &&
      this.statistics.roomsVisited.size >= this.progressionData.totalRooms
    ) {
      this.unlockAchievement('completionist');
    }

    // Secret room achievements
    const room = this.gameState.getRoom(roomId);
    if (room && room.secret) {
      this.unlockAchievement('secret_finder');
    }
  }

  /**
   * Check collection achievements
   * @private
   */
  checkCollectionAchievements() {
    // Collector achievements
    const itemCount = this.statistics.itemsCollected.size;

    if (itemCount >= 10) {
      this.unlockAchievement('collector_bronze');
    }
    if (itemCount >= 25) {
      this.unlockAchievement('collector_silver');
    }
    if (itemCount >= 50) {
      this.unlockAchievement('collector_gold');
    }
  }

  /**
   * Check puzzle achievements
   * @private
   */
  checkPuzzleAchievements() {
    const puzzleCount = this.statistics.puzzlesSolved.size;

    if (puzzleCount >= 5) {
      this.unlockAchievement('puzzle_solver');
    }
    if (puzzleCount >= 10) {
      this.unlockAchievement('puzzle_master');
    }
  }

  /**
   * Check death-related achievements
   * @private
   */
  checkDeathAchievements() {
    if (this.statistics.deaths >= 10) {
      this.unlockAchievement('persistent');
    }

    // No death achievement check happens at game end
  }

  /**
   * Check score achievements
   * @private
   */
  checkScoreAchievements(oldScore, newScore) {
    const thresholds = [100, 250, 500, 1000];

    for (const threshold of thresholds) {
      if (oldScore < threshold && newScore >= threshold) {
        this.unlockAchievement(`score_${threshold}`);
      }
    }
  }

  /**
   * Check meta achievements
   * @private
   */
  checkMetaAchievements() {
    const achievementCount = this.unlockedAchievements.size;

    if (achievementCount >= 10) {
      this.unlockAchievement('achievement_hunter');
    }
    if (achievementCount >= 25) {
      this.unlockAchievement('achievement_master');
    }
  }

  /**
   * Update story path based on player choices
   * @param {string} factor - Factor that influences ending
   * @param {number} value - Value to add/set
   */
  updateEndingFactor(factor, value) {
    const current = this.endingFactors.get(factor) || 0;
    this.endingFactors.set(factor, current + value);

    // Update current path based on factors
    this.updateCurrentPath();
  }

  /**
   * Update current story path
   * @private
   */
  updateCurrentPath() {
    const karma = this.endingFactors.get('karma') || 0;
    const heroism = this.endingFactors.get('heroism') || 0;

    if (karma >= 50 && heroism >= 50) {
      this.currentPath = 'hero';
    } else if (karma <= -50) {
      this.currentPath = 'villain';
    } else if (heroism >= 50) {
      this.currentPath = 'champion';
    } else {
      this.currentPath = 'neutral';
    }
  }

  /**
   * Get current progression status
   * @returns {Object} Current status
   */
  getProgressionStatus() {
    return {
      score: this.score,
      maxScore: this.maxScore,
      moves: this.moves,
      timePlayed: Date.now() - this.startTime,
      achievementsUnlocked: this.unlockedAchievements.size,
      totalAchievements: this.achievements.size,
      currentPath: this.currentPath,
      completionPercentage: this.calculateCompletionPercentage(),
    };
  }

  /**
   * Calculate game completion percentage
   * @private
   */
  calculateCompletionPercentage() {
    let total = 0;
    let completed = 0;

    // Score completion
    if (this.maxScore > 0) {
      total += 1;
      completed += this.score / this.maxScore;
    }

    // Room exploration
    if (this.progressionData && this.progressionData.totalRooms) {
      total += 1;
      completed +=
        this.statistics.roomsVisited.size / this.progressionData.totalRooms;
    }

    // Achievement completion
    if (this.achievements.size > 0) {
      total += 1;
      completed += this.unlockedAchievements.size / this.achievements.size;
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  /**
   * Get final game statistics
   * @private
   */
  getFinalStatistics() {
    return {
      score: this.score,
      maxScore: this.maxScore,
      moves: this.moves,
      timePlayed: Date.now() - this.startTime,
      roomsExplored: this.statistics.roomsVisited.size,
      itemsCollected: this.statistics.itemsCollected.size,
      puzzlesSolved: this.statistics.puzzlesSolved.size,
      npcsmet: this.statistics.npcsmet.size,
      deaths: this.statistics.deaths,
      hintsUsed: this.statistics.hintsUsed,
      achievementsUnlocked: this.unlockedAchievements.size,
      completionPercentage: this.calculateCompletionPercentage(),
    };
  }

  /**
   * Get all available achievements as an array
   * @returns {Array} Array of achievement objects
   */
  getAllAchievements() {
    return Array.from(this.achievements.values());
  }

  /**
   * Get set of unlocked achievement IDs
   * @returns {Set} Set of unlocked achievement IDs
   */
  getUnlockedAchievements() {
    return this.unlockedAchievements;
  }
}
