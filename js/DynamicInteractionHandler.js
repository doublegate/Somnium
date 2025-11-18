/**
 * DynamicInteractionHandler - Handles unscripted player actions via AI
 *
 * When a player performs an action that doesn't have a scripted response,
 * this handler uses the AIManager to generate contextually appropriate
 * responses while maintaining game state consistency.
 */

import { logger } from './logger.js';

export class DynamicInteractionHandler {
  constructor(aiManager, gameState, commandExecutor) {
    this.aiManager = aiManager;
    this.gameState = gameState;
    this.commandExecutor = commandExecutor;
    this.logger = logger;

    // Fallback responses for common unscripted actions
    this.fallbackResponses = {
      default: "You can't do that here.",
      look: "You don't see anything special about that.",
      take: "You can't take that.",
      use: "That doesn't seem to work.",
      talk: "They don't respond.",
      eat: "That's not edible.",
      drink: "You can't drink that.",
      touch: "It feels ordinary.",
      smell: "It has no particular smell.",
      listen: "You don't hear anything unusual.",
      taste: "That would be unwise.",
    };
  }

  /**
   * Handle an unscripted action
   * @param {Object} command - Parsed command
   * @returns {Promise<string>} Response text
   */
  async handleDynamicAction(command) {
    this.logger.log('Handling dynamic action:', command);

    try {
      // Build context for AI
      const context = this.buildContext(command);

      // Check if we should use AI or fallback
      if (!this.shouldUseAI(command, context)) {
        return this.getFallbackResponse(command);
      }

      // Get AI response
      const response = await this.aiManager.getDynamicResponse(context, command);

      // Validate and sanitize response
      const sanitized = this.sanitizeResponse(response);

      // Check if response might affect game state
      if (this.mightAffectState(sanitized)) {
        this.logger.warn('AI response might affect state, using fallback instead');
        return this.getFallbackResponse(command);
      }

      return sanitized;
    } catch (error) {
      this.logger.error('Dynamic action handling failed:', error);
      return this.getFallbackResponse(command);
    }
  }

  /**
   * Build context for AI from current game state
   * @param {Object} command - Parsed command
   * @returns {Object} Context object
   */
  buildContext(command) {
    const currentRoom = this.gameState.getCurrentRoom();
    const inventory = this.gameState.getInventory();

    const context = {
      currentRoom: {
        id: currentRoom.id,
        name: currentRoom.name,
        description: currentRoom.description,
      },
      inventory: inventory.map((item) => item.name),
      visibleObjects: this.getVisibleObjects(currentRoom),
      recentActions: this.gameState.getRecentActions ? this.gameState.getRecentActions(5) : [],
      score: this.gameState.score || 0,
    };

    // Add target object/item info if available
    if (command.directObject) {
      const targetInfo = this.getTargetInfo(command.directObject, currentRoom);
      if (targetInfo) {
        context.target = targetInfo;
      }
    }

    return context;
  }

  /**
   * Get information about visible objects in the room
   * @param {Object} room - Current room
   * @returns {Array} Visible object names
   */
  getVisibleObjects(room) {
    const objects = [];

    if (room.objects) {
      room.objects.forEach((objId) => {
        const obj = this.gameState.getObject(objId);
        if (obj) {
          objects.push(obj.name);
        }
      });
    }

    if (room.items) {
      room.items.forEach((itemId) => {
        const item = this.gameState.getItem(itemId);
        if (item) {
          objects.push(item.name);
        }
      });
    }

    return objects;
  }

  /**
   * Get detailed info about a target object/item
   * @param {string} targetName - Target name
   * @param {Object} room - Current room
   * @returns {Object|null} Target info
   */
  getTargetInfo(targetName, room) {
    // Check objects in room
    if (room.objects) {
      for (const objId of room.objects) {
        const obj = this.gameState.getObject(objId);
        if (obj && obj.name.toLowerCase().includes(targetName.toLowerCase())) {
          return {
            type: 'object',
            name: obj.name,
            description: obj.description,
            takeable: obj.takeable || false,
          };
        }
      }
    }

    // Check items in room
    if (room.items) {
      for (const itemId of room.items) {
        const item = this.gameState.getItem(itemId);
        if (item && item.name.toLowerCase().includes(targetName.toLowerCase())) {
          return {
            type: 'item',
            name: item.name,
            description: item.description,
            takeable: item.takeable !== false,
          };
        }
      }
    }

    // Check inventory
    const inventory = this.gameState.getInventory();
    for (const item of inventory) {
      if (item.name.toLowerCase().includes(targetName.toLowerCase())) {
        return {
          type: 'item',
          name: item.name,
          description: item.description,
          inInventory: true,
        };
      }
    }

    return null;
  }

  /**
   * Determine if AI should be used for this action
   * @param {Object} command - Parsed command
   * @param {Object} context - Game context
   * @returns {boolean} Whether to use AI
   */
  shouldUseAI(command, context) {
    // Don't use AI if offline
    if (!this.aiManager.apiKey || this.aiManager.apiKey === 'your-api-key-here') {
      return false;
    }

    // Don't use AI for very common actions - use fallbacks
    const simpleVerbs = ['look', 'examine', 'take', 'drop'];
    if (simpleVerbs.includes(command.verb) && !command.directObject) {
      return false;
    }

    // Don't use AI if target doesn't exist
    if (command.directObject && !context.target) {
      return false;
    }

    // Use AI for creative/unusual actions
    const creativeVerbs = [
      'smell',
      'taste',
      'listen',
      'sing',
      'dance',
      'jump',
      'yell',
      'whisper',
      'knock',
      'wave',
      'bow',
      'pray',
      'meditate',
    ];

    if (creativeVerbs.includes(command.verb)) {
      return true;
    }

    // Use AI if target has a description but action is unscripted
    if (context.target && context.target.description) {
      return true;
    }

    return false;
  }

  /**
   * Get fallback response for a command
   * @param {Object} command - Parsed command
   * @returns {string} Fallback response
   */
  getFallbackResponse(command) {
    const verb = command.verb;

    if (this.fallbackResponses[verb]) {
      return this.fallbackResponses[verb];
    }

    return this.fallbackResponses.default;
  }

  /**
   * Sanitize AI response to prevent injection/exploits
   * @param {string} response - Raw AI response
   * @returns {string} Sanitized response
   */
  sanitizeResponse(response) {
    if (!response || typeof response !== 'string') {
      return this.fallbackResponses.default;
    }

    // Trim whitespace
    let sanitized = response.trim();

    // Remove any HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove script-like content
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Limit length
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 497) + '...';
    }

    // Ensure it's not empty after sanitization
    if (!sanitized) {
      return this.fallbackResponses.default;
    }

    return sanitized;
  }

  /**
   * Check if response might affect game state
   * @param {string} response - Sanitized response
   * @returns {boolean} Whether response might change state
   */
  mightAffectState(response) {
    // Keywords that might indicate state changes
    const stateKeywords = [
      'you take',
      'you get',
      'you pick up',
      'you drop',
      'you open',
      'you close',
      'you unlock',
      'you die',
      'you win',
      'you lose',
      'score',
      'points',
      'achievement',
    ];

    const lowerResponse = response.toLowerCase();
    return stateKeywords.some((keyword) => lowerResponse.includes(keyword));
  }

  /**
   * Generate a dynamic hint for a puzzle
   * @param {Object} puzzle - Puzzle object
   * @param {number} progress - Completion progress (0-1)
   * @returns {Promise<string>} Hint text
   */
  async generateHint(puzzle, progress = 0) {
    try {
      const context = this.buildContext({ verb: 'hint' });

      const prompt = `The player is stuck on this puzzle: ${puzzle.description}

Current progress: ${Math.round(progress * 100)}%
Completed steps: ${puzzle.steps.filter((s) => s.completed).length}/${puzzle.steps.length}
Current location: ${context.currentRoom.name}
Inventory: ${context.inventory.join(', ') || 'nothing'}

Generate a helpful but not too obvious hint (1-2 sentences) that guides them toward the next step.`;

      const hint = await this.aiManager.makeAPIRequest(prompt, true);
      return this.sanitizeResponse(hint);
    } catch (error) {
      this.logger.error('Hint generation failed:', error);

      // Return generic puzzle hint
      if (puzzle.hints && puzzle.hints.length > 0) {
        return puzzle.hints[0].text;
      }

      return 'Try exploring thoroughly and examining everything carefully.';
    }
  }

  /**
   * Generate dynamic NPC dialogue
   * @param {Object} npc - NPC object
   * @param {string} topic - Dialogue topic
   * @returns {Promise<string>} NPC response
   */
  async generateNPCDialogue(npc, topic) {
    try {
      const context = this.buildContext({ verb: 'talk' });

      const prompt = `NPC: ${npc.name} - ${npc.description}
Location: ${context.currentRoom.name}
Player asks about: ${topic}

Generate a brief response (1-2 sentences) that:
1. Matches the NPC's personality
2. Stays true to the game's theme
3. Might provide subtle hints if relevant

Response:`;

      const response = await this.aiManager.makeAPIRequest(prompt, true);
      return this.sanitizeResponse(response);
    } catch (error) {
      this.logger.error('NPC dialogue generation failed:', error);

      // Return generic NPC response
      if (npc.dialogue && npc.dialogue.default) {
        return npc.dialogue.default;
      }

      return `${npc.name} doesn't respond to that.`;
    }
  }

  /**
   * Generate a contextual room description enhancement
   * @param {Object} room - Room object
   * @param {string} direction - Focus direction
   * @returns {Promise<string>} Enhanced description
   */
  async enhanceRoomDescription(room, direction = null) {
    try {
      const context = this.buildContext({ verb: 'look' });

      let prompt = `Room: ${room.name}
Base description: ${room.description}
Visible objects: ${context.visibleObjects.join(', ')}`;

      if (direction) {
        prompt += `\nPlayer is specifically looking ${direction}`;
      }

      prompt += `\n\nGenerate a brief atmospheric detail (1 sentence) that enhances immersion without contradicting the base description.`;

      const enhancement = await this.aiManager.makeAPIRequest(prompt, true);
      return this.sanitizeResponse(enhancement);
    } catch (error) {
      this.logger.error('Room description enhancement failed:', error);
      return '';
    }
  }

  /**
   * Set a custom fallback response for a verb
   * @param {string} verb - Verb to set fallback for
   * @param {string} response - Fallback response
   */
  setFallbackResponse(verb, response) {
    this.fallbackResponses[verb] = response;
  }

  /**
   * Get statistics about AI usage
   * @returns {Object} Usage statistics
   */
  getStats() {
    return {
      cacheSize: this.aiManager.responseCache.size,
      requestCount: this.aiManager.requestCount,
      rateLimitReset: this.aiManager.requestResetTime,
      offlineMode: !this.aiManager.apiKey || this.aiManager.apiKey === 'your-api-key-here',
    };
  }
}

export default DynamicInteractionHandler;
