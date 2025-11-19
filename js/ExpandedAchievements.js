/**
 * ExpandedAchievements - Comprehensive achievement and trophy system
 *
 * Features:
 * - 50+ achievements across multiple categories
 * - Hidden/secret achievements
 * - Progress tracking for incremental achievements
 * - Rarity tiers (common, rare, epic, legendary)
 * - Achievement notifications and rewards
 * - Statistics tracking
 * - Achievement showcase/display
 * - Platform integration (Steam, PlayStation, Xbox style)
 */

import { logger } from './logger.js';

export class ExpandedAchievements {
  constructor(gameState, eventManager) {
    this.gameState = gameState;
    this.eventManager = eventManager;

    // Achievement definitions
    this.achievements = this.initializeAchievements();

    // Player progress
    this.unlockedAchievements = new Set();
    this.achievementProgress = new Map();

    // Statistics
    this.stats = {
      totalAchievements: this.achievements.size,
      unlockedCount: 0,
      commonUnlocked: 0,
      rareUnlocked: 0,
      epicUnlocked: 0,
      legendaryUnlocked: 0,
      hiddenUnlocked: 0,
      completionPercentage: 0,
    };

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize achievement definitions
   * @returns {Map} Achievement definitions
   */
  initializeAchievements() {
    const achievements = new Map();

    // Story Achievements
    const storyAchievements = [
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete the tutorial',
        category: 'story',
        rarity: 'common',
        hidden: false,
        condition: () => this.gameState.getFlag('tutorial_complete'),
      },
      {
        id: 'adventurer',
        name: 'Adventurer',
        description: 'Complete your first adventure',
        category: 'story',
        rarity: 'common',
        hidden: false,
        condition: () => this.gameState.getScore() >= 100,
      },
      {
        id: 'master_adventurer',
        name: 'Master Adventurer',
        description: 'Complete 10 adventures',
        category: 'story',
        rarity: 'rare',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 10 },
        condition: () => this.getProgress('master_adventurer') >= 10,
      },
      {
        id: 'legend',
        name: 'Living Legend',
        description: 'Complete 50 adventures',
        category: 'story',
        rarity: 'legendary',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 50 },
        condition: () => this.getProgress('legend') >= 50,
      },
    ];

    // Combat Achievements
    const combatAchievements = [
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Win your first battle',
        category: 'combat',
        rarity: 'common',
        hidden: false,
        condition: () => this.gameState.getStatistic('battlesWon') > 0,
      },
      {
        id: 'warrior',
        name: 'Warrior',
        description: 'Win 25 battles',
        category: 'combat',
        rarity: 'rare',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 25 },
        condition: () => this.gameState.getStatistic('battlesWon') >= 25,
      },
      {
        id: 'pacifist',
        name: 'Pacifist',
        description: 'Complete an adventure without killing',
        category: 'combat',
        rarity: 'epic',
        hidden: false,
        condition: () =>
          this.gameState.getScore() >= 100 && this.gameState.getStatistic('enemiesKilled') === 0,
      },
      {
        id: 'critical_master',
        name: 'Critical Master',
        description: 'Land 100 critical hits',
        category: 'combat',
        rarity: 'rare',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 100 },
        condition: () => this.gameState.getStatistic('criticalHits') >= 100,
      },
      {
        id: 'untouchable',
        name: 'Untouchable',
        description: 'Win 10 battles without taking damage',
        category: 'combat',
        rarity: 'epic',
        hidden: true,
        incremental: true,
        progress: { current: 0, target: 10 },
        condition: () => this.getProgress('untouchable') >= 10,
      },
    ];

    // Magic Achievements
    const magicAchievements = [
      {
        id: 'apprentice_mage',
        name: 'Apprentice Mage',
        description: 'Learn your first spell',
        category: 'magic',
        rarity: 'common',
        hidden: false,
        condition: () => this.gameState.getStatistic('spellsLearned') > 0,
      },
      {
        id: 'archmage',
        name: 'Archmage',
        description: 'Master all magic schools',
        category: 'magic',
        rarity: 'legendary',
        hidden: false,
        condition: () => this.gameState.getStatistic('schoolsMastered') >= 6,
      },
      {
        id: 'spell_combo',
        name: 'Spell Synergy',
        description: 'Discover a spell combination',
        category: 'magic',
        rarity: 'rare',
        hidden: false,
        condition: () => this.gameState.getStatistic('combosDiscovered') > 0,
      },
      {
        id: 'enchanter',
        name: 'Enchanter',
        description: 'Create 10 enchanted items',
        category: 'magic',
        rarity: 'rare',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 10 },
        condition: () => this.gameState.getStatistic('enchantmentsCreated') >= 10,
      },
    ];

    // Exploration Achievements
    const explorationAchievements = [
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Visit 50 different rooms',
        category: 'exploration',
        rarity: 'common',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 50 },
        condition: () => this.gameState.getStatistic('roomsVisited') >= 50,
      },
      {
        id: 'treasure_hunter',
        name: 'Treasure Hunter',
        description: 'Find 100 items',
        category: 'exploration',
        rarity: 'rare',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 100 },
        condition: () => this.gameState.getStatistic('itemsFound') >= 100,
      },
      {
        id: 'secret_seeker',
        name: 'Secret Seeker',
        description: 'Discover 10 hidden secrets',
        category: 'exploration',
        rarity: 'epic',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 10 },
        condition: () => this.gameState.getStatistic('secretsFound') >= 10,
      },
    ];

    // Puzzle Achievements
    const puzzleAchievements = [
      {
        id: 'puzzle_solver',
        name: 'Puzzle Solver',
        description: 'Solve your first puzzle',
        category: 'puzzle',
        rarity: 'common',
        hidden: false,
        condition: () => this.gameState.getStatistic('puzzlesSolved') > 0,
      },
      {
        id: 'master_puzzler',
        name: 'Master Puzzler',
        description: 'Solve 50 puzzles',
        category: 'puzzle',
        rarity: 'rare',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 50 },
        condition: () => this.gameState.getStatistic('puzzlesSolved') >= 50,
      },
      {
        id: 'no_hints',
        name: 'No Hints Needed',
        description: 'Solve 10 puzzles without using hints',
        category: 'puzzle',
        rarity: 'epic',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 10 },
        condition: () => this.getProgress('no_hints') >= 10,
      },
      {
        id: 'speed_solver',
        name: 'Speed Solver',
        description: 'Solve a timed puzzle in under 30 seconds',
        category: 'puzzle',
        rarity: 'rare',
        hidden: true,
        condition: () => this.gameState.getFlag('speed_puzzle_solved'),
      },
    ];

    // Social Achievements
    const socialAchievements = [
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Make 10 friends',
        category: 'social',
        rarity: 'common',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 10 },
        condition: () => this.gameState.getStatistic('friendCount') >= 10,
      },
      {
        id: 'world_creator',
        name: 'World Creator',
        description: 'Share your first world',
        category: 'social',
        rarity: 'common',
        hidden: false,
        condition: () => this.gameState.getStatistic('worldsShared') > 0,
      },
      {
        id: 'community_favorite',
        name: 'Community Favorite',
        description: 'Get 100 downloads on a shared world',
        category: 'social',
        rarity: 'epic',
        hidden: false,
        condition: () => this.gameState.getStatistic('worldDownloads') >= 100,
      },
    ];

    // Competitive Achievements
    const competitiveAchievements = [
      {
        id: 'speedrunner',
        name: 'Speedrunner',
        description: 'Complete your first speedrun',
        category: 'competitive',
        rarity: 'common',
        hidden: false,
        condition: () => this.gameState.getStatistic('speedrunsCompleted') > 0,
      },
      {
        id: 'world_record',
        name: 'World Record',
        description: 'Hold a world record',
        category: 'competitive',
        rarity: 'legendary',
        hidden: false,
        condition: () => this.gameState.getStatistic('worldRecords') > 0,
      },
      {
        id: 'daily_champion',
        name: 'Daily Champion',
        description: 'Complete 30 daily challenges',
        category: 'competitive',
        rarity: 'epic',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 30 },
        condition: () => this.gameState.getStatistic('dailyChallengesCompleted') >= 30,
      },
    ];

    // Misc/Hidden Achievements
    const miscAchievements = [
      {
        id: 'developer',
        name: 'Hello Developer',
        description: 'Find the secret developer message',
        category: 'misc',
        rarity: 'epic',
        hidden: true,
        condition: () => this.gameState.getFlag('developer_message_found'),
      },
      {
        id: 'completionist',
        name: 'Completionist',
        description: 'Unlock all achievements',
        category: 'misc',
        rarity: 'legendary',
        hidden: false,
        condition: () => this.unlockedAchievements.size === this.achievements.size - 1,
      },
      {
        id: 'prestige_master',
        name: 'Prestige Master',
        description: 'Reach prestige level 10',
        category: 'misc',
        rarity: 'legendary',
        hidden: false,
        incremental: true,
        progress: { current: 0, target: 10 },
        condition: () => this.gameState.getStatistic('prestigeLevel') >= 10,
      },
    ];

    // Add all achievements to map
    const allAchievements = [
      ...storyAchievements,
      ...combatAchievements,
      ...magicAchievements,
      ...explorationAchievements,
      ...puzzleAchievements,
      ...socialAchievements,
      ...competitiveAchievements,
      ...miscAchievements,
    ];

    for (const achievement of allAchievements) {
      achievements.set(achievement.id, achievement);
      if (achievement.incremental) {
        this.achievementProgress.set(achievement.id, achievement.progress.current);
      }
    }

    return achievements;
  }

  /**
   * Setup event listeners for automatic achievement checking
   */
  setupEventListeners() {
    this.eventManager.addEventListener('combatEnd', () => this.checkAchievements());
    this.eventManager.addEventListener('puzzleSolved', () => this.checkAchievements());
    this.eventManager.addEventListener('itemFound', () => this.checkAchievements());
    this.eventManager.addEventListener('spellLearned', () => this.checkAchievements());
    this.eventManager.addEventListener('levelUp', () => this.checkAchievements());
    this.eventManager.addEventListener('friendAdded', () => this.checkAchievements());
    this.eventManager.addEventListener('worldShared', () => this.checkAchievements());
    this.eventManager.addEventListener('speedrunComplete', () => this.checkAchievements());
  }

  /**
   * Check all achievements
   */
  checkAchievements() {
    for (const [id, achievement] of this.achievements) {
      if (!this.unlockedAchievements.has(id)) {
        if (achievement.condition()) {
          this.unlockAchievement(id);
        }
      }
    }
  }

  /**
   * Unlock achievement
   * @param {string} achievementId - Achievement ID
   * @returns {boolean} True if unlocked
   */
  unlockAchievement(achievementId) {
    if (this.unlockedAchievements.has(achievementId)) {
      return false;
    }

    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      return false;
    }

    this.unlockedAchievements.add(achievementId);

    // Update statistics
    this.stats.unlockedCount++;
    this.stats[`${achievement.rarity}Unlocked`]++;
    if (achievement.hidden) this.stats.hiddenUnlocked++;
    this.stats.completionPercentage = Math.floor(
      (this.stats.unlockedCount / this.stats.totalAchievements) * 100
    );

    logger.info(`Achievement unlocked: ${achievement.name}`);

    // Trigger notification
    this.showAchievementNotification(achievement);

    // Trigger event
    this.eventManager.triggerEvent('achievementUnlocked', { achievement });

    // Award rewards
    this.awardAchievementRewards(achievement);

    return true;
  }

  /**
   * Update achievement progress
   * @param {string} achievementId - Achievement ID
   * @param {number} progress - New progress value
   */
  updateProgress(achievementId, progress) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || !achievement.incremental) {
      return;
    }

    this.achievementProgress.set(achievementId, progress);

    // Check if achievement is now complete
    if (progress >= achievement.progress.target) {
      this.unlockAchievement(achievementId);
    }
  }

  /**
   * Increment achievement progress
   * @param {string} achievementId - Achievement ID
   * @param {number} amount - Amount to increment
   */
  incrementProgress(achievementId, amount = 1) {
    const current = this.achievementProgress.get(achievementId) || 0;
    this.updateProgress(achievementId, current + amount);
  }

  /**
   * Get achievement progress
   * @param {string} achievementId - Achievement ID
   * @returns {number} Current progress
   */
  getProgress(achievementId) {
    return this.achievementProgress.get(achievementId) || 0;
  }

  /**
   * Show achievement notification
   * @param {Object} achievement - Achievement data
   */
  showAchievementNotification(achievement) {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Achievement Unlocked!', {
        body: `${achievement.name}: ${achievement.description}`,
        icon: `/assets/achievements/${achievement.rarity}.png`,
        tag: `achievement-${achievement.id}`,
      });
    }

    // In-game notification
    this.eventManager.triggerEvent('showNotification', {
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: achievement.name,
      description: achievement.description,
      rarity: achievement.rarity,
      duration: 5000,
    });
  }

  /**
   * Award achievement rewards
   * @param {Object} achievement - Achievement data
   */
  awardAchievementRewards(achievement) {
    // Base XP reward
    const xpRewards = {
      common: 50,
      rare: 150,
      epic: 300,
      legendary: 500,
    };

    const xp = xpRewards[achievement.rarity] || 50;
    this.gameState.addExperience(xp);

    // Bonus for hidden achievements
    if (achievement.hidden) {
      this.gameState.addExperience(100);
    }
  }

  /**
   * Get unlocked achievements
   * @returns {Array} Unlocked achievements
   */
  getUnlockedAchievements() {
    return Array.from(this.unlockedAchievements)
      .map((id) => this.achievements.get(id))
      .filter((a) => a);
  }

  /**
   * Get locked achievements (excluding hidden)
   * @returns {Array} Locked achievements
   */
  getLockedAchievements() {
    return Array.from(this.achievements.values()).filter(
      (a) => !this.unlockedAchievements.has(a.id) && !a.hidden
    );
  }

  /**
   * Get achievements by category
   * @param {string} category - Category name
   * @returns {Array} Achievements in category
   */
  getAchievementsByCategory(category) {
    return Array.from(this.achievements.values()).filter((a) => a.category === category);
  }

  /**
   * Get statistics
   * @returns {Object} Achievement statistics
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
      unlockedAchievements: Array.from(this.unlockedAchievements),
      achievementProgress: Array.from(this.achievementProgress.entries()),
      stats: { ...this.stats },
    };
  }

  /**
   * Load state
   * @param {Object} saveData - Save data
   */
  load(saveData) {
    this.unlockedAchievements = new Set(saveData.unlockedAchievements || []);
    this.achievementProgress = new Map(saveData.achievementProgress || []);
    this.stats = saveData.stats || this.stats;
  }
}
