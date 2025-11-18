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

import logger from './logger.js';

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
    logger.ai(`Generating world with theme: ${theme || 'random'}`);

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
      logger.error('World generation failed:', error);
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
    logger.ai('Getting dynamic response for action:', action);

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
      logger.error('Dynamic response failed:', error);
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
      logger.error('Moderation check failed:', error);
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
   * @param {number} retries - Number of retries on failure
   * @returns {Promise<string|Object>} API response
   */
  async makeAPIRequest(prompt, textOnly = false, retries = 3) {
    // Check if we should use mock mode (no API key configured)
    if (!this.apiKey || this.apiKey === 'your-api-key-here') {
      return this.getMockResponse(textOnly);
    }

    logger.ai('Making API request:', prompt.substring(0, 100) + '...');

    const messages = [
      {
        role: 'system',
        content: textOnly
          ? 'You are a narrative game master for a classic Sierra-style adventure game. Respond in 1-2 concise sentences matching the retro style.'
          : 'You are a game world generator for classic Sierra-style adventure games. Return valid JSON only, no markdown.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const requestBody = {
      model: this.model,
      messages,
      temperature: textOnly ? 0.8 : 0.7,
      max_tokens: textOnly ? 150 : 4000,
    };

    if (!textOnly) {
      // For JSON responses, use response format
      requestBody.response_format = { type: 'json_object' };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `API error ${response.status}: ${errorData.error?.message || response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0]) {
          throw new Error('Invalid API response structure');
        }

        const content = data.choices[0].message.content;

        // Parse JSON if not text-only
        if (!textOnly) {
          try {
            return JSON.parse(content);
          } catch (parseError) {
            throw new Error(`Failed to parse JSON response: ${parseError.message}`);
          }
        }

        return content;
      } catch (error) {
        logger.error(`API request failed (attempt ${attempt + 1}/${retries + 1}):`, error);

        if (attempt === retries) {
          // Last attempt failed, return mock data as fallback
          logger.warn('All API attempts failed, falling back to mock data');
          return this.getMockResponse(textOnly);
        }

        // Exponential backoff
        const backoffTime = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }
  }

  /**
   * Get mock response for testing/offline mode
   * @private
   * @param {boolean} textOnly - Whether to return text or JSON
   * @returns {string|Object} Mock response
   */
  getMockResponse(textOnly) {
    logger.ai('Using mock response (offline mode)');

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
        mockData: true,
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
                color: 8,
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
    const themeDescription = theme || 'classic fantasy adventure';

    return `You are generating a complete Sierra-style adventure game world in the style of King's Quest or Space Quest.

THEME: ${themeDescription}

Generate a JSON object with the following structure:

{
  "version": "1.0.0",
  "metadata": {
    "title": "Game Title",
    "theme": "${themeDescription}",
    "generatedAt": "${new Date().toISOString()}",
    "difficulty": "medium",
    "estimatedPlaytime": "30-45 minutes"
  },
  "rooms": {
    "start": {
      "name": "Room Name",
      "description": "Detailed room description",
      "graphics": {
        "primitives": [
          {"type": "rect", "color": 0, "dims": [0, 0, 320, 200]},
          {"type": "polygon", "color": 2, "points": [[x1, y1], [x2, y2], ...]}
        ]
      },
      "exits": {
        "north": {"roomId": "other_room", "enabled": true},
        "south": {"roomId": "another_room", "enabled": false, "requirement": "has_key"}
      },
      "objects": ["object_id_1", "object_id_2"],
      "items": ["item_id_1"],
      "events": []
    }
  },
  "items": {
    "key": {
      "name": "brass key",
      "description": "A tarnished brass key",
      "takeable": true,
      "size": 1,
      "weight": 1,
      "uses": ["unlock_door"]
    }
  },
  "objects": {
    "door": {
      "name": "wooden door",
      "description": "A sturdy oak door",
      "takeable": false,
      "states": ["locked", "unlocked", "open"],
      "currentState": "locked",
      "interactions": {
        "unlock": {"requires": "key", "newState": "unlocked"}
      }
    }
  },
  "npcs": {
    "wizard": {
      "name": "Old Wizard",
      "description": "A wise old wizard",
      "room": "tower",
      "dialogue": {
        "greeting": "Welcome, traveler!",
        "quest": "I need your help..."
      },
      "trading": {
        "gives": "magic_wand",
        "wants": ["crystal", "potion"]
      }
    }
  },
  "puzzles": [
    {
      "id": "unlock_gate",
      "description": "Find a way through the locked gate",
      "steps": [
        {"action": "find_key", "location": "garden"},
        {"action": "unlock", "target": "gate", "requires": "key"}
      ],
      "reward": {"points": 10, "item": "treasure"},
      "hints": [
        {"text": "Look around the garden carefully", "delay": 120000}
      ]
    }
  ],
  "vocabulary": {
    "verbs": ["look", "take", "use", "open", "close", "talk", "give"],
    "synonyms": {
      "get": "take",
      "grab": "take",
      "examine": "look",
      "speak": "talk"
    }
  },
  "scoring": {
    "maxPoints": 100,
    "achievements": [
      {"id": "first_puzzle", "name": "Puzzle Master", "points": 10}
    ]
  }
}

REQUIREMENTS:
1. Create 8-12 interconnected rooms with logical exits
2. Include 15-20 items and objects
3. Design 3-5 multi-step puzzles that are SOLVABLE
4. Include 2-3 NPCs with dialogue
5. Graphics primitives should create simple Sierra-style scenes (320x200, EGA colors 0-15)
6. All room exits must reference existing rooms
7. All item/object references must be valid
8. Puzzles must have all required items placed in accessible locations
9. Include appropriate vocabulary and synonyms

COLOR PALETTE (EGA):
0=black, 1=blue, 2=green, 3=cyan, 4=red, 5=magenta, 6=brown, 7=light gray,
8=dark gray, 9=light blue, 10=light green, 11=light cyan, 12=light red,
13=light magenta, 14=yellow, 15=white

Generate a complete, playable adventure game world. Return ONLY valid JSON, no markdown or explanations.`;
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
      } catch (error) {
        throw new Error(`Invalid JSON response from AI: ${error.message}`);
      }
    } else {
      data = response;
    }

    // Comprehensive validation
    const errors = [];

    // 1. Check basic structure
    if (!data.version) errors.push('Missing version field');
    if (!data.metadata) errors.push('Missing metadata field');
    if (!data.rooms) errors.push('Missing rooms field');

    // 2. Validate rooms
    if (data.rooms && Object.keys(data.rooms).length === 0) {
      errors.push('Generated world has no rooms');
    }

    const roomIds = new Set(Object.keys(data.rooms || {}));
    const itemIds = new Set(Object.keys(data.items || {}));
    const objectIds = new Set(Object.keys(data.objects || {}));
    const npcIds = new Set(Object.keys(data.npcs || {}));

    // 3. Validate room exits point to valid rooms
    if (data.rooms) {
      for (const [roomId, room] of Object.entries(data.rooms)) {
        if (!room.name) errors.push(`Room ${roomId} missing name`);
        if (!room.description) errors.push(`Room ${roomId} missing description`);

        // Check exits
        if (room.exits) {
          for (const [direction, exit] of Object.entries(room.exits)) {
            if (exit.roomId && !roomIds.has(exit.roomId)) {
              errors.push(`Room ${roomId} exit ${direction} points to non-existent room: ${exit.roomId}`);
            }
          }
        }

        // Check room items references
        if (room.items) {
          for (const itemId of room.items) {
            if (!itemIds.has(itemId)) {
              errors.push(`Room ${roomId} references non-existent item: ${itemId}`);
            }
          }
        }

        // Check room objects references
        if (room.objects) {
          for (const objectId of room.objects) {
            if (!objectIds.has(objectId)) {
              errors.push(`Room ${roomId} references non-existent object: ${objectId}`);
            }
          }
        }
      }
    }

    // 4. Validate items
    if (data.items) {
      for (const [itemId, item] of Object.entries(data.items)) {
        if (!item.name) errors.push(`Item ${itemId} missing name`);
        if (!item.description) errors.push(`Item ${itemId} missing description`);
      }
    }

    // 5. Validate objects
    if (data.objects) {
      for (const [objectId, object] of Object.entries(data.objects)) {
        if (!object.name) errors.push(`Object ${objectId} missing name`);
        if (!object.description) errors.push(`Object ${objectId} missing description`);
      }
    }

    // 6. Validate puzzles have solvable paths
    if (data.puzzles) {
      for (const puzzle of data.puzzles) {
        if (!puzzle.id) errors.push('Puzzle missing id');
        if (!puzzle.description) errors.push(`Puzzle ${puzzle.id} missing description`);
        if (!puzzle.steps || puzzle.steps.length === 0) {
          errors.push(`Puzzle ${puzzle.id} has no steps`);
        }

        // Check that required items exist
        if (puzzle.steps) {
          for (const step of puzzle.steps) {
            if (step.requires && !itemIds.has(step.requires)) {
              errors.push(`Puzzle ${puzzle.id} requires non-existent item: ${step.requires}`);
            }
            if (step.target && !objectIds.has(step.target)) {
              errors.push(`Puzzle ${puzzle.id} targets non-existent object: ${step.target}`);
            }
          }
        }
      }
    }

    // 7. Validate NPCs
    if (data.npcs) {
      for (const [npcId, npc] of Object.entries(data.npcs)) {
        if (!npc.name) errors.push(`NPC ${npcId} missing name`);
        if (!npc.description) errors.push(`NPC ${npcId} missing description`);
        if (npc.room && !roomIds.has(npc.room)) {
          errors.push(`NPC ${npcId} placed in non-existent room: ${npc.room}`);
        }

        // Check trading items
        if (npc.trading) {
          if (npc.trading.gives && !itemIds.has(npc.trading.gives)) {
            errors.push(`NPC ${npcId} trading non-existent item: ${npc.trading.gives}`);
          }
          if (npc.trading.wants) {
            for (const wantedItem of npc.trading.wants) {
              if (!itemIds.has(wantedItem)) {
                errors.push(`NPC ${npcId} wants non-existent item: ${wantedItem}`);
              }
            }
          }
        }
      }
    }

    // 8. Check for isolated rooms (not reachable from start)
    const reachableRooms = this.findReachableRooms(data.rooms, 'start');
    const unreachableRooms = Array.from(roomIds).filter(
      (id) => !reachableRooms.has(id) && id !== 'start'
    );
    if (unreachableRooms.length > 0) {
      logger.warn(`Unreachable rooms detected: ${unreachableRooms.join(', ')}`);
    }

    // If there are critical errors, throw
    if (errors.length > 0) {
      const errorMessage = `World validation failed:\n${errors.join('\n')}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    logger.log('World validation successful');
    return data;
  }

  /**
   * Find all rooms reachable from a starting room
   * @private
   * @param {Object} rooms - Rooms object
   * @param {string} startRoom - Starting room ID
   * @returns {Set} Set of reachable room IDs
   */
  findReachableRooms(rooms, startRoom) {
    const reachable = new Set();
    const queue = [startRoom];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();

      if (visited.has(current)) continue;
      visited.add(current);

      const room = rooms[current];
      if (!room) continue;

      reachable.add(current);

      // Add all connected rooms to queue
      if (room.exits) {
        for (const exit of Object.values(room.exits)) {
          if (exit.roomId && !visited.has(exit.roomId)) {
            queue.push(exit.roomId);
          }
        }
      }
    }

    return reachable;
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
