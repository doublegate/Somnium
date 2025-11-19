/**
 * CommunityHub - Social features for world sharing, ratings, and discovery
 *
 * Features:
 * - World sharing and downloading
 * - Rating and review system
 * - Featured worlds showcase
 * - Community challenges
 * - Creator profiles
 * - Trending and popular worlds
 * - Search and filtering
 * - Moderation and reporting
 */

import { logger } from './logger.js';

export class CommunityHub {
  constructor(apiClient, gameState, eventManager) {
    this.apiClient = apiClient;
    this.gameState = gameState;
    this.eventManager = eventManager;

    // Local cache
    this.cache = {
      worlds: new Map(),
      profiles: new Map(),
      featured: [],
      trending: [],
      lastUpdate: null,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
    };

    // User data
    this.currentUser = null;
    this.userWorlds = [];
    this.userRatings = new Map();

    // Statistics
    this.stats = {
      worldsShared: 0,
      worldsDownloaded: 0,
      ratingsGiven: 0,
      commentsPosted: 0,
    };

    // API endpoints
    this.endpoints = {
      share: '/api/share',
      worlds: '/api/worlds',
      featured: '/api/worlds/featured',
      trending: '/api/worlds/trending',
      search: '/api/worlds/search',
      profile: '/api/profile',
      rate: '/api/worlds/{id}/rate',
      comment: '/api/worlds/{id}/comment',
      report: '/api/worlds/{id}/report',
    };
  }

  /**
   * Share a world
   * @param {Object} worldData - World JSON data
   * @param {Object} metadata - World metadata
   * @returns {Promise<Object>} Share result
   */
  async shareWorld(worldData, metadata) {
    try {
      const shareData = {
        worldData,
        title: metadata.title || 'Untitled World',
        description: metadata.description || '',
        tags: metadata.tags || [],
        difficulty: metadata.difficulty || 'normal',
        estimatedPlaytime: metadata.estimatedPlaytime || 30,
        creator: this.currentUser?.username || 'Anonymous',
        createdAt: Date.now(),
        version: '2.0.0',
      };

      const response = await this.apiClient.post(
        this.endpoints.share,
        shareData
      );

      if (response.success) {
        this.stats.worldsShared++;
        this.userWorlds.push(response.world);

        logger.info(`World shared: ${response.world.id}`);

        this.eventManager.triggerEvent('worldShared', {
          worldId: response.world.id,
          title: shareData.title,
        });

        return {
          success: true,
          worldId: response.world.id,
          shareUrl: response.shareUrl,
        };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Share world failed:', error);
      return { success: false, message: 'Failed to share world' };
    }
  }

  /**
   * Download a world
   * @param {string} worldId - World ID
   * @returns {Promise<Object>} Download result
   */
  async downloadWorld(worldId) {
    try {
      // Check cache first
      if (this.cache.worlds.has(worldId)) {
        return {
          success: true,
          world: this.cache.worlds.get(worldId),
        };
      }

      const response = await this.apiClient.get(
        `${this.endpoints.worlds}/${worldId}`
      );

      if (response.success) {
        this.cache.worlds.set(worldId, response.world);
        this.stats.worldsDownloaded++;

        logger.info(`World downloaded: ${worldId}`);

        this.eventManager.triggerEvent('worldDownloaded', {
          worldId,
          title: response.world.title,
        });

        return {
          success: true,
          world: response.world,
        };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Download world failed:', error);
      return { success: false, message: 'Failed to download world' };
    }
  }

  /**
   * Get featured worlds
   * @param {number} limit - Number of worlds to fetch
   * @returns {Promise<Object>} Featured worlds
   */
  async getFeaturedWorlds(limit = 10) {
    try {
      // Check cache
      if (
        this.cache.featured.length > 0 &&
        this.isCacheValid()
      ) {
        return { success: true, worlds: this.cache.featured.slice(0, limit) };
      }

      const response = await this.apiClient.get(this.endpoints.featured, {
        params: { limit },
      });

      if (response.success) {
        this.cache.featured = response.worlds;
        this.cache.lastUpdate = Date.now();

        return { success: true, worlds: response.worlds };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Get featured worlds failed:', error);
      return { success: false, message: 'Failed to fetch featured worlds' };
    }
  }

  /**
   * Get trending worlds
   * @param {string} timeframe - Timeframe (day, week, month, all-time)
   * @param {number} limit - Number of worlds to fetch
   * @returns {Promise<Object>} Trending worlds
   */
  async getTrendingWorlds(timeframe = 'week', limit = 20) {
    try {
      // Check cache
      if (
        this.cache.trending.length > 0 &&
        this.isCacheValid()
      ) {
        return { success: true, worlds: this.cache.trending.slice(0, limit) };
      }

      const response = await this.apiClient.get(this.endpoints.trending, {
        params: { timeframe, limit },
      });

      if (response.success) {
        this.cache.trending = response.worlds;
        this.cache.lastUpdate = Date.now();

        return { success: true, worlds: response.worlds };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Get trending worlds failed:', error);
      return { success: false, message: 'Failed to fetch trending worlds' };
    }
  }

  /**
   * Search worlds
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Search results
   */
  async searchWorlds(criteria) {
    try {
      const params = {
        query: criteria.query || '',
        tags: criteria.tags || [],
        difficulty: criteria.difficulty || null,
        minRating: criteria.minRating || 0,
        sort: criteria.sort || 'relevance', // relevance, rating, downloads, recent
        page: criteria.page || 1,
        limit: criteria.limit || 20,
      };

      const response = await this.apiClient.get(this.endpoints.search, {
        params,
      });

      if (response.success) {
        return {
          success: true,
          worlds: response.worlds,
          total: response.total,
          page: response.page,
          pages: response.pages,
        };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Search worlds failed:', error);
      return { success: false, message: 'Failed to search worlds' };
    }
  }

  /**
   * Rate a world
   * @param {string} worldId - World ID
   * @param {number} rating - Rating (1-5 stars)
   * @param {string} comment - Optional comment
   * @returns {Promise<Object>} Rating result
   */
  async rateWorld(worldId, rating, comment = '') {
    try {
      if (rating < 1 || rating > 5) {
        return { success: false, message: 'Rating must be between 1 and 5' };
      }

      const response = await this.apiClient.post(
        this.endpoints.rate.replace('{id}', worldId),
        { rating, comment }
      );

      if (response.success) {
        this.userRatings.set(worldId, { rating, comment });
        this.stats.ratingsGiven++;

        logger.info(`Rated world ${worldId}: ${rating} stars`);

        this.eventManager.triggerEvent('worldRated', {
          worldId,
          rating,
        });

        return {
          success: true,
          newAverage: response.averageRating,
          totalRatings: response.totalRatings,
        };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Rate world failed:', error);
      return { success: false, message: 'Failed to rate world' };
    }
  }

  /**
   * Post comment on world
   * @param {string} worldId - World ID
   * @param {string} comment - Comment text
   * @returns {Promise<Object>} Comment result
   */
  async postComment(worldId, comment) {
    try {
      const response = await this.apiClient.post(
        this.endpoints.comment.replace('{id}', worldId),
        { comment, author: this.currentUser?.username || 'Anonymous' }
      );

      if (response.success) {
        this.stats.commentsPosted++;

        logger.info(`Posted comment on world ${worldId}`);

        return { success: true, commentId: response.commentId };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Post comment failed:', error);
      return { success: false, message: 'Failed to post comment' };
    }
  }

  /**
   * Report a world
   * @param {string} worldId - World ID
   * @param {string} reason - Report reason
   * @param {string} details - Additional details
   * @returns {Promise<Object>} Report result
   */
  async reportWorld(worldId, reason, details = '') {
    try {
      const response = await this.apiClient.post(
        this.endpoints.report.replace('{id}', worldId),
        { reason, details, reporter: this.currentUser?.id }
      );

      if (response.success) {
        logger.info(`Reported world ${worldId}: ${reason}`);
        return { success: true, message: 'Report submitted successfully' };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Report world failed:', error);
      return { success: false, message: 'Failed to submit report' };
    }
  }

  /**
   * Get user profile
   * @param {string} username - Username
   * @returns {Promise<Object>} Profile data
   */
  async getUserProfile(username) {
    try {
      // Check cache
      if (this.cache.profiles.has(username)) {
        return {
          success: true,
          profile: this.cache.profiles.get(username),
        };
      }

      const response = await this.apiClient.get(
        `${this.endpoints.profile}/${username}`
      );

      if (response.success) {
        this.cache.profiles.set(username, response.profile);

        return { success: true, profile: response.profile };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Get user profile failed:', error);
      return { success: false, message: 'Failed to fetch profile' };
    }
  }

  /**
   * Get user's shared worlds
   * @param {string} username - Username
   * @returns {Promise<Object>} User worlds
   */
  async getUserWorlds(username) {
    try {
      const response = await this.apiClient.get(
        `${this.endpoints.profile}/${username}/worlds`
      );

      if (response.success) {
        return { success: true, worlds: response.worlds };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Get user worlds failed:', error);
      return { success: false, message: 'Failed to fetch user worlds' };
    }
  }

  /**
   * Follow a creator
   * @param {string} username - Username to follow
   * @returns {Promise<Object>} Follow result
   */
  async followCreator(username) {
    try {
      const response = await this.apiClient.post(
        `${this.endpoints.profile}/${username}/follow`,
        { follower: this.currentUser?.username }
      );

      if (response.success) {
        logger.info(`Following creator: ${username}`);

        this.eventManager.triggerEvent('creatorFollowed', { username });

        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Follow creator failed:', error);
      return { success: false, message: 'Failed to follow creator' };
    }
  }

  /**
   * Check if cache is valid
   * @returns {boolean} True if cache is valid
   */
  isCacheValid() {
    if (!this.cache.lastUpdate) return false;

    const age = Date.now() - this.cache.lastUpdate;
    return age < this.cache.cacheTimeout;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.worlds.clear();
    this.cache.profiles.clear();
    this.cache.featured = [];
    this.cache.trending = [];
    this.cache.lastUpdate = null;
  }

  /**
   * Set current user
   * @param {Object} user - User data
   */
  setCurrentUser(user) {
    this.currentUser = user;
    logger.info(`Current user set: ${user.username}`);
  }

  /**
   * Get statistics
   * @returns {Object} Community statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      userWorlds: this.userWorlds.length,
      ratingsGiven: this.userRatings.size,
    };
  }

  /**
   * Save state
   * @returns {Object} Save data
   */
  save() {
    return {
      currentUser: this.currentUser,
      userWorlds: this.userWorlds,
      userRatings: Array.from(this.userRatings.entries()),
      stats: { ...this.stats },
    };
  }

  /**
   * Load state
   * @param {Object} saveData - Save data
   */
  load(saveData) {
    this.currentUser = saveData.currentUser || null;
    this.userWorlds = saveData.userWorlds || [];
    this.userRatings = new Map(saveData.userRatings || []);
    this.stats = saveData.stats || this.stats;
  }
}
