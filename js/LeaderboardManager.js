/**
 * LeaderboardManager - Global Leaderboard System
 * Manages player rankings, scores, and achievements
 *
 * Features:
 * - Global leaderboards (all-time, weekly, monthly)
 * - Category-based rankings (fastest time, highest score, etc.)
 * - Player profiles and statistics
 * - Achievement tracking
 * - Historical data and trends
 *
 * @module LeaderboardManager
 * @version 2.0.0
 */

import logger from './logger.js';

export default class LeaderboardManager {
  constructor(apiClient) {
    this.apiClient = apiClient;

    // State
    this.leaderboards = new Map();
    this.myRanking = null;
    this.cachedData = new Map();

    // Configuration
    this.config = {
      apiEndpoint: '/api/leaderboard',
      cacheTimeout: 60000, // 1 minute
      defaultLimit: 100,
      autoRefresh: false,
      refreshInterval: 60000,
    };

    // Refresh timer
    this.refreshTimer = null;
  }

  /**
   * Get global leaderboard
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Leaderboard entries
   */
  async getGlobalLeaderboard(options = {}) {
    const {
      timeframe = 'all-time', // all-time, weekly, monthly, daily
      category = 'score', // score, time, achievements, wins
      limit = this.config.defaultLimit,
      offset = 0,
    } = options;

    const cacheKey = `global-${timeframe}-${category}-${limit}-${offset}`;

    // Check cache
    if (this.isCacheValid(cacheKey)) {
      return this.cachedData.get(cacheKey).data;
    }

    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/global`,
        {
          params: { timeframe, category, limit, offset },
        }
      );

      const leaderboard = response.data.leaderboard;
      this.cacheData(cacheKey, leaderboard);

      logger.info('Global leaderboard fetched:', {
        timeframe,
        category,
        entries: leaderboard.length,
      });

      return leaderboard;
    } catch (error) {
      logger.error('Failed to get global leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get my ranking
   * @param {string} timeframe - Time period
   * @param {string} category - Ranking category
   * @returns {Promise<Object>} My ranking data
   */
  async getMyRanking(timeframe = 'all-time', category = 'score') {
    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/my-ranking`,
        {
          params: { timeframe, category },
        }
      );

      this.myRanking = response.data.ranking;
      return this.myRanking;
    } catch (error) {
      logger.error('Failed to get my ranking:', error);
      throw error;
    }
  }

  /**
   * Get player profile
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} Player profile
   */
  async getPlayerProfile(playerId) {
    const cacheKey = `profile-${playerId}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cachedData.get(cacheKey).data;
    }

    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/player/${playerId}`
      );

      const profile = response.data.profile;
      this.cacheData(cacheKey, profile);

      return profile;
    } catch (error) {
      logger.error('Failed to get player profile:', error);
      throw error;
    }
  }

  /**
   * Get player statistics
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} Player statistics
   */
  async getPlayerStats(playerId) {
    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/player/${playerId}/stats`
      );

      return response.data.stats;
    } catch (error) {
      logger.error('Failed to get player stats:', error);
      throw error;
    }
  }

  /**
   * Submit score
   * @param {Object} scoreData - Score information
   * @returns {Promise<Object>} Updated ranking
   */
  async submitScore(scoreData) {
    const {
      worldId,
      score,
      time,
      achievements = [],
      metadata = {},
    } = scoreData;

    try {
      const response = await this.apiClient.post(
        `${this.config.apiEndpoint}/submit-score`,
        {
          worldId,
          score,
          time,
          achievements,
          metadata,
        }
      );

      // Invalidate cache
      this.clearCache();

      const ranking = response.data.ranking;
      logger.info('Score submitted:', { score, newRank: ranking.rank });

      // Dispatch event
      window.dispatchEvent(
        new CustomEvent('leaderboardScoreSubmitted', {
          detail: { ranking },
        })
      );

      return ranking;
    } catch (error) {
      logger.error('Failed to submit score:', error);
      throw error;
    }
  }

  /**
   * Get world-specific leaderboard
   * @param {string} worldId - World ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} World leaderboard
   */
  async getWorldLeaderboard(worldId, options = {}) {
    const {
      timeframe = 'all-time',
      category = 'score',
      limit = 50,
    } = options;

    const cacheKey = `world-${worldId}-${timeframe}-${category}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cachedData.get(cacheKey).data;
    }

    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/world/${worldId}`,
        {
          params: { timeframe, category, limit },
        }
      );

      const leaderboard = response.data.leaderboard;
      this.cacheData(cacheKey, leaderboard);

      return leaderboard;
    } catch (error) {
      logger.error('Failed to get world leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get nearby rankings (players near my rank)
   * @param {number} range - Number of players above/below
   * @returns {Promise<Array>} Nearby rankings
   */
  async getNearbyRankings(range = 5) {
    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/nearby`,
        {
          params: { range },
        }
      );

      return response.data.rankings;
    } catch (error) {
      logger.error('Failed to get nearby rankings:', error);
      throw error;
    }
  }

  /**
   * Search players
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Matching players
   */
  async searchPlayers(query, limit = 20) {
    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/search`,
        {
          params: { q: query, limit },
        }
      );

      return response.data.players;
    } catch (error) {
      logger.error('Failed to search players:', error);
      throw error;
    }
  }

  /**
   * Get achievement leaderboard
   * @param {string} achievementId - Achievement ID
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Players with achievement
   */
  async getAchievementLeaderboard(achievementId, limit = 50) {
    const cacheKey = `achievement-${achievementId}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cachedData.get(cacheKey).data;
    }

    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/achievement/${achievementId}`,
        {
          params: { limit },
        }
      );

      const leaderboard = response.data.leaderboard;
      this.cacheData(cacheKey, leaderboard);

      return leaderboard;
    } catch (error) {
      logger.error('Failed to get achievement leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get historical rankings for a player
   * @param {string} playerId - Player ID
   * @param {string} timeframe - Time period
   * @returns {Promise<Array>} Historical data
   */
  async getPlayerHistory(playerId, timeframe = 'monthly') {
    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/player/${playerId}/history`,
        {
          params: { timeframe },
        }
      );

      return response.data.history;
    } catch (error) {
      logger.error('Failed to get player history:', error);
      throw error;
    }
  }

  /**
   * Format rank with medal/icon
   * @param {number} rank - Player rank
   * @returns {string} Formatted rank
   */
  formatRank(rank) {
    if (rank === 1) return '🥇 1st';
    if (rank === 2) return '🥈 2nd';
    if (rank === 3) return '🥉 3rd';
    return `${rank}th`;
  }

  /**
   * Format score with commas
   * @param {number} score - Score value
   * @returns {string} Formatted score
   */
  formatScore(score) {
    return score.toLocaleString();
  }

  /**
   * Format time duration
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate rank change
   * @param {number} oldRank - Previous rank
   * @param {number} newRank - Current rank
   * @returns {Object} Rank change data
   */
  calculateRankChange(oldRank, newRank) {
    const change = oldRank - newRank; // Positive = improvement

    return {
      change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
      icon: change > 0 ? '▲' : change < 0 ? '▼' : '=',
      color: change > 0 ? 'green' : change < 0 ? 'red' : 'gray',
    };
  }

  /**
   * Check if cache is valid
   * @param {string} key - Cache key
   * @returns {boolean} Valid status
   */
  isCacheValid(key) {
    if (!this.cachedData.has(key)) return false;

    const cached = this.cachedData.get(key);
    const age = Date.now() - cached.timestamp;

    return age < this.config.cacheTimeout;
  }

  /**
   * Cache data
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  cacheData(key, data) {
    this.cachedData.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cachedData.clear();
    logger.info('Leaderboard cache cleared');
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    if (!this.config.autoRefresh) return;

    this.stopAutoRefresh();

    this.refreshTimer = setInterval(() => {
      this.clearCache();
      logger.debug('Leaderboard cache auto-cleared');
    }, this.config.refreshInterval);

    logger.info('Leaderboard auto-refresh started');
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      logger.info('Leaderboard auto-refresh stopped');
    }
  }

  /**
   * Dispose leaderboard manager
   */
  dispose() {
    this.stopAutoRefresh();
    this.clearCache();
    this.leaderboards.clear();
    this.myRanking = null;
    logger.info('LeaderboardManager disposed');
  }
}
