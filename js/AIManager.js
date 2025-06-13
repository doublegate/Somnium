/**
 * AIManager - Handles all LLM communication for content generation and dynamic interactions
 *
 * Responsibilities:
 * - Generate initial world from theme
 * - Validate AI responses
 * - Handle dynamic interactions
 * - Implement content moderation
 * - Manage API rate limiting
 */

export class AIManager {
  /**
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - API key for LLM service
   * @param {string} config.apiEndpoint - API endpoint URL
   * @param {string} config.model - Model name to use
   * @param {string} [config.moderationEndpoint] - Optional moderation API endpoint
   */
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiEndpoint = config.apiEndpoint;
    this.model = config.model || 'gpt-3.5-turbo';
    this.moderationEndpoint = config.moderationEndpoint;

    // Rate limiting
    this.requestCount = 0;
    this.requestResetTime = Date.now() + 60000; // Reset every minute
    this.maxRequestsPerMinute = 20;

    // Cache for responses
    this.responseCache = new Map();
    this.cacheMaxSize = 100;
  }

  /**
   * Generate complete game world from theme
   * @param {string} [theme] - Optional theme or setting
   * @returns {Promise<Object>} GameJSON object with complete world data
   * @throws {Error} with details if generation fails
   */
  async generateWorld(theme) {
    console.log(`Generating world with theme: ${theme || 'random'}`);

    try {
      // Check rate limit
      await this.checkRateLimit();

      // Build the prompt
      const prompt = this.buildWorldGenerationPrompt(theme);

      // Make API request
      const response = await this.makeAPIRequest(prompt);

      // Parse and validate response
      const gameJSON = this.parseAndValidateWorldData(response);

      return gameJSON;
    } catch (error) {
      console.error('World generation failed:', error);
      throw new Error(`Failed to generate world: ${error.message}`);
    }
  }

  /**
   * Get LLM response for unscripted action
   * @param {Object} context - Current game context
   * @param {Object} action - ParsedCommand from player
   * @returns {Promise<string>} Narrative response
   */
  async getDynamicResponse(context, action) {
    console.log('Getting dynamic response for action:', action);

    try {
      // Check cache first
      const cacheKey = this.buildCacheKey(context, action);
      if (this.responseCache.has(cacheKey)) {
        return this.responseCache.get(cacheKey);
      }

      // Check rate limit
      await this.checkRateLimit();

      // Build the prompt
      const prompt = this.buildDynamicActionPrompt(context, action);

      // Make API request
      const response = await this.makeAPIRequest(prompt, true); // true = expect text response

      // Cache the response
      this.cacheResponse(cacheKey, response);

      return response;
    } catch (error) {
      console.error('Dynamic response failed:', error);
      // Return generic fallback
      return "You can't do that here.";
    }
  }

  /**
   * Run content moderation check
   * @param {string} text - Text to check
   * @returns {Promise<{safe: boolean, reason?: string}>} Moderation result
   */
  async checkContent(text) {
    if (!this.moderationEndpoint) {
      // No moderation configured
      return { safe: true };
    }

    try {
      const response = await fetch(this.moderationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Moderation API error: ${response.status}`);
      }

      const result = await response.json();

      return {
        safe: !result.flagged,
        reason: result.reason || undefined,
      };
    } catch (error) {
      console.error('Moderation check failed:', error);
      // Default to safe on error
      return { safe: true };
    }
  }

  /**
   * Check and enforce rate limiting
   * @private
   */
  async checkRateLimit() {
    const now = Date.now();

    // Reset counter if time window has passed
    if (now > this.requestResetTime) {
      this.requestCount = 0;
      this.requestResetTime = now + 60000;
    }

    // Check if limit exceeded
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = this.requestResetTime - now;
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }

    this.requestCount++;
  }

  /**
   * Make API request to LLM
   * @private
   * @param {string} prompt - The prompt to send
   * @param {boolean} textOnly - Whether to expect plain text response
   * @returns {Promise<string|Object>} API response
   */
  async makeAPIRequest(prompt, textOnly = false) {
    // TODO: Implement actual API call
    // For now, return mock data
    console.log(
      'Mock API request with prompt:',
      prompt.substring(0, 100) + '...'
    );

    if (textOnly) {
      return 'The brass key feels cold and heavy in your hand. Its intricate engravings seem to shift in the dim light.';
    }

    // Return mock game JSON for testing
    return {
      version: '1.0.0',
      metadata: {
        title: 'The Haunted Manor',
        theme: 'haunted mansion',
        generatedAt: new Date().toISOString(),
      },
      rooms: {
        entrance: {
          name: 'Manor Entrance',
          description:
            'You stand before the imposing entrance of Ravenshollow Manor.',
          graphics: {
            primitives: [
              {
                type: 'rect',
                color: '#000000',
                dims: [0, 0, 320, 200],
              },
            ],
          },
          exits: {
            north: { roomId: 'foyer', enabled: true },
          },
        },
      },
      items: {},
      objects: {},
      puzzles: [],
      vocabulary: {
        verbs: ['look', 'take', 'use', 'open', 'close'],
        synonyms: {
          get: 'take',
          grab: 'take',
        },
      },
    };
  }

  /**
   * Build world generation prompt
   * @private
   * @param {string} theme - Theme for the world
   * @returns {string} Complete prompt
   */
  buildWorldGenerationPrompt(theme) {
    // TODO: Load from prompt templates
    return `Generate a complete adventure game world with theme: ${theme || 'fantasy adventure'}. 
    Return as JSON matching the GameJSON schema with rooms, items, objects, and puzzles.`;
  }

  /**
   * Build dynamic action prompt
   * @private
   * @param {Object} context - Game context
   * @param {Object} action - Player action
   * @returns {string} Complete prompt
   */
  buildDynamicActionPrompt(context, action) {
    return `The player in room "${context.currentRoom.name}" tries to: ${action.verb} ${action.directObject || ''}. 
    Current inventory: ${context.inventory.join(', ') || 'nothing'}. 
    Provide a brief response (1-2 sentences).`;
  }

  /**
   * Parse and validate world data from AI response
   * @private
   * @param {string|Object} response - Raw API response
   * @returns {Object} Validated GameJSON object
   */
  parseAndValidateWorldData(response) {
    let data;

    // Parse if string
    if (typeof response === 'string') {
      try {
        data = JSON.parse(response);
      } catch {
        throw new Error('Invalid JSON response from AI');
      }
    } else {
      data = response;
    }

    // Basic validation
    if (!data.rooms || Object.keys(data.rooms).length === 0) {
      throw new Error('Generated world has no rooms');
    }

    // TODO: Add comprehensive validation
    // - Check all room exits point to valid rooms
    // - Verify all item/object IDs are unique
    // - Ensure puzzles have solutions

    return data;
  }

  /**
   * Build cache key for response caching
   * @private
   * @param {Object} context - Game context
   * @param {Object} action - Player action
   * @returns {string} Cache key
   */
  buildCacheKey(context, action) {
    return `${context.currentRoom.id}-${action.verb}-${action.directObject || 'none'}`;
  }

  /**
   * Cache a response
   * @private
   * @param {string} key - Cache key
   * @param {string} response - Response to cache
   */
  cacheResponse(key, response) {
    // Implement LRU cache
    if (this.responseCache.size >= this.cacheMaxSize) {
      // Remove oldest entry
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }

    this.responseCache.set(key, response);
  }
}
