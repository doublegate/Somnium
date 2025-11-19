/**
 * CompetitiveFeatures - Speedruns, challenges, and competitive gameplay
 *
 * Features:
 * - Speedrun tracking and leaderboards
 * - Daily/weekly challenges
 * - Achievement hunting
 * - Time attack mode
 * - Score attack mode
 * - Permadeath/ironman mode
 * - Challenge creation and sharing
 * - Personal best tracking
 */

import { logger } from './logger.js';

export class CompetitiveFeatures {
  constructor(gameState, eventManager, apiClient) {
    this.gameState = gameState;
    this.eventManager = eventManager;
    this.apiClient = apiClient;

    // Speedrun tracking
    this.activeSpeedrun = null;
    this.personalBests = new Map();

    // Challenge tracking
    this.activeChallenges = [];
    this.completedChallenges = new Set();
    this.dailyChallenge = null;
    this.weeklyChallenge = null;

    // Competitive modes
    this.competitiveModes = {
      speedrun: { active: false, category: null },
      scoreAttack: { active: false, target: 0 },
      timeAttack: { active: false, timeLimit: 0 },
      permadeath: { active: false, lives: 1 },
      ironman: { active: false, noSaves: true },
    };

    // Statistics
    this.stats = {
      speedrunsCompleted: 0,
      challengesCompleted: 0,
      personalBestCount: 0,
      worldRecords: 0,
      dailyChallengesCompleted: 0,
      weeklyChallengesCompleted: 0,
    };

    // Speedrun categories
    this.speedrunCategories = {
      any: {
        name: 'Any%',
        description: 'Complete the game as fast as possible',
        rules: [],
      },
      '100%': {
        name: '100%',
        description: 'Collect all items and complete all puzzles',
        rules: ['collect_all_items', 'solve_all_puzzles'],
      },
      noMagic: {
        name: 'No Magic',
        description: 'Complete without using any magic spells',
        rules: ['no_magic_use'],
      },
      pacifist: {
        name: 'Pacifist',
        description: 'Complete without killing any enemies',
        rules: ['no_kills'],
      },
      minimalist: {
        name: 'Minimalist',
        description: 'Complete with minimum required actions',
        rules: ['minimize_actions'],
      },
    };
  }

  /**
   * Start speedrun
   * @param {string} category - Speedrun category
   * @param {Object} options - Speedrun options
   * @returns {Object} Start result
   */
  startSpeedrun(category, options = {}) {
    if (this.activeSpeedrun) {
      return { success: false, message: 'Speedrun already active!' };
    }

    if (!this.speedrunCategories[category]) {
      return { success: false, message: 'Invalid speedrun category!' };
    }

    this.activeSpeedrun = {
      category,
      startTime: Date.now(),
      splits: [],
      violations: [],
      completed: false,
      stats: {
        actions: 0,
        enemiesKilled: 0,
        magicUsed: 0,
        itemsCollected: 0,
        puzzlesSolved: 0,
      },
    };

    this.competitiveModes.speedrun.active = true;
    this.competitiveModes.speedrun.category = category;

    logger.info(`Speedrun started: ${category}`);

    this.eventManager.triggerEvent('speedrunStart', { category });

    return {
      success: true,
      category,
      rules: this.speedrunCategories[category].rules,
    };
  }

  /**
   * Add split to speedrun
   * @param {string} splitName - Split checkpoint name
   */
  addSplit(splitName) {
    if (!this.activeSpeedrun) return;

    const split = {
      name: splitName,
      time: Date.now() - this.activeSpeedrun.startTime,
      timestamp: Date.now(),
    };

    this.activeSpeedrun.splits.push(split);

    logger.info(`Split: ${splitName} at ${this.formatTime(split.time)}`);

    this.eventManager.triggerEvent('speedrunSplit', split);
  }

  /**
   * Complete speedrun
   * @param {boolean} success - Whether run was successful
   * @returns {Object} Completion result
   */
  completeSpeedrun(success) {
    if (!this.activeSpeedrun) {
      return { success: false, message: 'No active speedrun!' };
    }

    const finalTime = Date.now() - this.activeSpeedrun.startTime;
    this.activeSpeedrun.finalTime = finalTime;
    this.activeSpeedrun.completed = success;

    const category = this.activeSpeedrun.category;
    const rules = this.speedrunCategories[category].rules;

    // Check for rule violations
    const violations = this.checkSpeedrunViolations(rules);

    const result = {
      category,
      time: finalTime,
      formattedTime: this.formatTime(finalTime),
      splits: this.activeSpeedrun.splits,
      violations,
      valid: violations.length === 0,
      personalBest: false,
      worldRecord: false,
    };

    // Check personal best
    const currentPB = this.personalBests.get(category);
    if (!currentPB || (result.valid && finalTime < currentPB.time)) {
      this.personalBests.set(category, {
        time: finalTime,
        date: Date.now(),
        splits: this.activeSpeedrun.splits,
      });
      result.personalBest = true;
      this.stats.personalBestCount++;
    }

    this.stats.speedrunsCompleted++;

    this.competitiveModes.speedrun.active = false;
    this.activeSpeedrun = null;

    logger.info(
      `Speedrun completed: ${category} in ${result.formattedTime} (${result.valid ? 'VALID' : 'INVALID'})`
    );

    this.eventManager.triggerEvent('speedrunComplete', result);

    // Submit to leaderboard if valid
    if (result.valid && this.apiClient) {
      this.submitSpeedrun(category, result);
    }

    return result;
  }

  /**
   * Check speedrun rule violations
   * @param {Array} rules - Category rules
   * @returns {Array} Violations
   */
  checkSpeedrunViolations(rules) {
    const violations = [];

    for (const rule of rules) {
      switch (rule) {
        case 'collect_all_items':
          if (!this.gameState.hasAllItems()) {
            violations.push('Not all items collected');
          }
          break;

        case 'solve_all_puzzles':
          if (!this.gameState.hasAllPuzzlesSolved()) {
            violations.push('Not all puzzles solved');
          }
          break;

        case 'no_magic_use':
          if (this.activeSpeedrun.stats.magicUsed > 0) {
            violations.push('Magic was used');
          }
          break;

        case 'no_kills':
          if (this.activeSpeedrun.stats.enemiesKilled > 0) {
            violations.push('Enemies were killed');
          }
          break;

        case 'minimize_actions':
          // Check if actions are within threshold
          const threshold = 100;
          if (this.activeSpeedrun.stats.actions > threshold) {
            violations.push(`Too many actions (${this.activeSpeedrun.stats.actions})`);
          }
          break;
      }
    }

    return violations;
  }

  /**
   * Track speedrun action
   * @param {string} actionType - Type of action
   */
  trackAction(actionType) {
    if (!this.activeSpeedrun) return;

    this.activeSpeedrun.stats.actions++;

    switch (actionType) {
      case 'kill':
        this.activeSpeedrun.stats.enemiesKilled++;
        break;
      case 'magic':
        this.activeSpeedrun.stats.magicUsed++;
        break;
      case 'item':
        this.activeSpeedrun.stats.itemsCollected++;
        break;
      case 'puzzle':
        this.activeSpeedrun.stats.puzzlesSolved++;
        break;
    }
  }

  /**
   * Submit speedrun to leaderboard
   * @param {string} category - Category
   * @param {Object} result - Speedrun result
   */
  async submitSpeedrun(category, result) {
    try {
      const response = await this.apiClient.post('/api/speedruns/submit', {
        category,
        time: result.time,
        splits: result.splits,
        player: this.gameState.getPlayerName(),
        timestamp: Date.now(),
      });

      if (response.success) {
        logger.info(`Speedrun submitted to leaderboard: Rank ${response.rank}`);

        if (response.rank === 1) {
          this.stats.worldRecords++;
          this.eventManager.triggerEvent('worldRecord', { category });
        }
      }
    } catch (error) {
      logger.error('Failed to submit speedrun:', error);
    }
  }

  /**
   * Get daily challenge
   * @returns {Promise<Object>} Daily challenge
   */
  async getDailyChallenge() {
    try {
      // Check if already loaded today
      if (this.dailyChallenge && this.isSameDay(this.dailyChallenge.date)) {
        return { success: true, challenge: this.dailyChallenge };
      }

      const response = await this.apiClient.get('/api/challenges/daily');

      if (response.success) {
        this.dailyChallenge = {
          ...response.challenge,
          date: Date.now(),
        };

        return { success: true, challenge: this.dailyChallenge };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Failed to get daily challenge:', error);
      return { success: false, message: 'Failed to fetch daily challenge' };
    }
  }

  /**
   * Complete daily challenge
   * @param {Object} completionData - Completion data
   * @returns {Promise<Object>} Completion result
   */
  async completeDailyChallenge(completionData) {
    try {
      const response = await this.apiClient.post(
        '/api/challenges/daily/complete',
        {
          challengeId: this.dailyChallenge.id,
          ...completionData,
        }
      );

      if (response.success) {
        this.stats.dailyChallengesCompleted++;

        logger.info('Daily challenge completed!');

        this.eventManager.triggerEvent('dailyChallengeComplete', {
          rewards: response.rewards,
        });

        return {
          success: true,
          rewards: response.rewards,
          rank: response.rank,
        };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Failed to complete daily challenge:', error);
      return { success: false, message: 'Failed to complete challenge' };
    }
  }

  /**
   * Start challenge mode
   * @param {string} challengeType - Challenge type
   * @param {Object} params - Challenge parameters
   * @returns {Object} Start result
   */
  startChallenge(challengeType, params = {}) {
    const challenge = {
      type: challengeType,
      startTime: Date.now(),
      params,
      progress: {},
      completed: false,
    };

    this.activeChallenges.push(challenge);

    logger.info(`Challenge started: ${challengeType}`);

    this.eventManager.triggerEvent('challengeStart', { type: challengeType });

    return { success: true, challenge };
  }

  /**
   * Update challenge progress
   * @param {string} challengeType - Challenge type
   * @param {Object} progress - Progress update
   */
  updateChallengeProgress(challengeType, progress) {
    const challenge = this.activeChallenges.find(
      (c) => c.type === challengeType
    );

    if (!challenge) return;

    Object.assign(challenge.progress, progress);

    // Check if challenge is complete
    if (this.isChallengeComplete(challenge)) {
      this.completeChallenge(challenge);
    }
  }

  /**
   * Check if challenge is complete
   * @param {Object} challenge - Challenge data
   * @returns {boolean} True if complete
   */
  isChallengeComplete(challenge) {
    switch (challenge.type) {
      case 'score_attack':
        return challenge.progress.score >= challenge.params.targetScore;

      case 'time_attack':
        const elapsed = Date.now() - challenge.startTime;
        return (
          challenge.progress.objective &&
          elapsed <= challenge.params.timeLimit
        );

      case 'collection':
        return (
          challenge.progress.collected >= challenge.params.requiredItems
        );

      case 'no_damage':
        return (
          challenge.progress.objective && challenge.progress.damageTaken === 0
        );

      default:
        return false;
    }
  }

  /**
   * Complete challenge
   * @param {Object} challenge - Challenge data
   */
  completeChallenge(challenge) {
    challenge.completed = true;
    challenge.completionTime = Date.now();

    this.completedChallenges.add(challenge.type);
    this.stats.challengesCompleted++;

    // Remove from active
    const index = this.activeChallenges.indexOf(challenge);
    if (index > -1) {
      this.activeChallenges.splice(index, 1);
    }

    logger.info(`Challenge completed: ${challenge.type}`);

    this.eventManager.triggerEvent('challengeComplete', {
      type: challenge.type,
      time: challenge.completionTime - challenge.startTime,
    });
  }

  /**
   * Format time for display
   * @param {number} milliseconds - Time in milliseconds
   * @returns {string} Formatted time (MM:SS.mmm)
   */
  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;

    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Check if date is same day
   * @param {number} timestamp - Timestamp to check
   * @returns {boolean} True if same day
   */
  isSameDay(timestamp) {
    const date1 = new Date(timestamp);
    const date2 = new Date();

    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Get personal bests
   * @returns {Object} Personal bests by category
   */
  getPersonalBests() {
    const bests = {};

    for (const [category, record] of this.personalBests) {
      bests[category] = {
        time: record.time,
        formattedTime: this.formatTime(record.time),
        date: record.date,
      };
    }

    return bests;
  }

  /**
   * Get active speedrun data
   * @returns {Object|null} Active speedrun or null
   */
  getActiveSpeedrun() {
    if (!this.activeSpeedrun) return null;

    const elapsed = Date.now() - this.activeSpeedrun.startTime;

    return {
      category: this.activeSpeedrun.category,
      elapsed,
      formattedTime: this.formatTime(elapsed),
      splits: this.activeSpeedrun.splits,
      stats: this.activeSpeedrun.stats,
    };
  }

  /**
   * Get statistics
   * @returns {Object} Competitive statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      personalBests: this.personalBests.size,
      activeChallenges: this.activeChallenges.length,
      completedChallenges: this.completedChallenges.size,
    };
  }

  /**
   * Save state
   * @returns {Object} Save data
   */
  save() {
    return {
      personalBests: Array.from(this.personalBests.entries()),
      completedChallenges: Array.from(this.completedChallenges),
      stats: { ...this.stats },
    };
  }

  /**
   * Load state
   * @param {Object} saveData - Save data
   */
  load(saveData) {
    this.personalBests = new Map(saveData.personalBests || []);
    this.completedChallenges = new Set(saveData.completedChallenges || []);
    this.stats = saveData.stats || this.stats;
  }
}
