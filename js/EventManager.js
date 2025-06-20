/**
 * EventManager - Executes game logic from scripts and player commands
 *
 * Responsibilities:
 * - Execute scripted events from JSON
 * - Evaluate conditional logic
 * - Route unscripted actions to AI
 * - Manage timed events queue
 * - Update game state from actions
 */

import logger from './logger.js';

export class EventManager {
  /**
   * @param {GameState} gameState - Reference to game state
   * @param {AIManager} aiManager - Reference to AI manager
   */
  constructor(gameState, aiManager) {
    this.gameState = gameState;
    this.aiManager = aiManager;

    // Scheduled events queue
    this.scheduledEvents = [];

    // Event handlers for custom actions
    this.customHandlers = new Map();

    // Register default handlers
    this.registerDefaultHandlers();
  }

  /**
   * Process parsed command
   * @param {Object} command - ParsedCommand from parser
   * @returns {Promise<void>}
   */
  async executeCommand(command) {
    logger.event('Executing command:', command);

    try {
      // Check for scripted response first
      const scriptedResponse = this.findScriptedResponse(command);

      if (scriptedResponse) {
        // Execute scripted actions
        await this.executeScriptedEvent(scriptedResponse);
      } else {
        // No scripted response, use AI for dynamic response
        await this.handleDynamicCommand(command);
      }
    } catch (error) {
      logger.error('Error executing command:', error);
      this.showMessage('Something went wrong. Please try again.');
    }
  }

  /**
   * Check for pre-command events
   * @param {Object} command - Parsed command
   * @returns {Object|null} Event result if preventDefault
   */
  async checkPreCommandEvents(command) {
    // Find events triggered before this command
    const events = this.findEventsByTrigger('pre_command', command);

    for (const event of events) {
      if (this.checkCondition(event.condition)) {
        const result = await this.executeScriptedEvent(event);
        if (result && result.preventDefault) {
          return result;
        }
      }
    }

    return null;
  }

  /**
   * Check for post-command events
   * @param {Object} command - Parsed command
   * @param {Object} result - Command execution result
   */
  async checkPostCommandEvents(command, _result) {
    // Find events triggered after this command
    const events = this.findEventsByTrigger('post_command', command);

    for (const event of events) {
      if (this.checkCondition(event.condition)) {
        await this.executeScriptedEvent(event);
      }
    }
  }

  /**
   * Trigger room entry events
   * @param {string} roomId - Room entered
   */
  async triggerRoomEntry(roomId) {
    const events = this.findEventsByTrigger('room_entry', { roomId });

    for (const event of events) {
      if (this.checkCondition(event.condition)) {
        await this.executeScriptedEvent(event);
      }
    }
  }

  /**
   * Execute single game action
   * @param {Object} action - Action object
   */
  executeAction(action) {
    if (!action || !action.type) {
      logger.warn('Invalid action:', action);
      return;
    }

    logger.event('Executing action:', action.type);

    switch (action.type) {
      case 'SET_FLAG':
        this.gameState.setFlag(action.flag, action.value);
        break;

      case 'GIVE_ITEM':
        this.gameState.addItem(action.itemId);
        if (action.message) {
          this.showMessage(action.message);
        }
        break;

      case 'REMOVE_ITEM':
        this.gameState.removeItem(action.itemId);
        if (action.message) {
          this.showMessage(action.message);
        }
        break;

      case 'PLAY_SOUND':
        // TODO: Get sound manager reference
        logger.sound(`Playing sound: ${action.soundId}`);
        break;

      case 'SHOW_MESSAGE':
        this.showMessage(action.text);
        break;

      case 'CHANGE_ROOM':
        this.gameState.changeRoom(action.roomId);
        // TODO: Trigger room render
        break;

      case 'ENABLE_EXIT':
        this.enableExit(action.roomId, action.exit);
        break;

      case 'DISABLE_EXIT':
        this.disableExit(action.roomId, action.exit);
        break;

      case 'MOVE_VIEW':
        // TODO: Get view manager reference
        logger.debug(
          `Moving view ${action.viewId} to ${action.x}, ${action.y}`
        );
        break;

      case 'UPDATE_SCORE':
        this.gameState.updateScore(action.points);
        if (action.message) {
          this.showMessage(action.message);
        }
        break;

      case 'END_GAME':
        this.handleEndGame(action);
        break;

      default:
        // Check for custom handler
        if (this.customHandlers.has(action.type)) {
          const handler = this.customHandlers.get(action.type);
          handler(action);
        } else {
          logger.warn(`Unknown action type: ${action.type}`);
        }
    }
  }

  /**
   * Schedule future action
   * @param {number} delay - Delay in milliseconds
   * @param {Object} action - Action object
   */
  scheduleEvent(delay, action) {
    const scheduledTime = Date.now() + delay;

    this.scheduledEvents.push({
      time: scheduledTime,
      action: action,
    });

    // Sort by time
    this.scheduledEvents.sort((a, b) => a.time - b.time);

    logger.event(`Scheduled event for ${delay}ms from now`);
  }

  /**
   * Update scheduled events (called each frame)
   * @param {number} deltaTime - Time since last update
   */
  updateScheduledEvents(_deltaTime) {
    const currentTime = Date.now();
    const eventsToExecute = [];

    // Find events that should execute
    while (
      this.scheduledEvents.length > 0 &&
      this.scheduledEvents[0].time <= currentTime
    ) {
      eventsToExecute.push(this.scheduledEvents.shift());
    }

    // Execute them
    eventsToExecute.forEach((event) => {
      this.executeAction(event.action);
    });
  }

  /**
   * Evaluate conditional expression
   * @param {string} condition - Flag expression (e.g., "hasTorch && !doorOpen")
   * @returns {boolean} Result of evaluation
   */
  checkCondition(condition) {
    if (!condition) return true;

    try {
      // Replace flag names with actual values
      let expression = condition;

      // Find all flag references (alphanumeric + underscore)
      const flagPattern = /\b(\w+)\b/g;
      const flags = expression.match(flagPattern) || [];

      // Replace each flag with its value
      flags.forEach((flag) => {
        // Skip operators
        if (['true', 'false', 'and', 'or', 'not'].includes(flag)) {
          return;
        }

        const value = this.gameState.getFlag(flag);
        expression = expression.replace(
          new RegExp(`\\b${flag}\\b`, 'g'),
          value ? 'true' : 'false'
        );
      });

      // Replace logical operators
      expression = expression
        .replace(/&&/g, ' and ')
        .replace(/\|\|/g, ' or ')
        .replace(/!/g, ' not ');

      // Evaluate (in a safe way)
      return this.evaluateExpression(expression);
    } catch (error) {
      logger.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Find scripted response for command
   * @private
   * @param {Object} command - Parsed command
   * @returns {Object|null} Scripted event or null
   */
  findScriptedResponse(command) {
    const currentRoom = this.gameState.getCurrentRoom();
    if (!currentRoom) return null;

    // Check room-specific events
    if (currentRoom.events) {
      for (const event of currentRoom.events) {
        if (this.matchesCommand(command, event)) {
          return event;
        }
      }
    }

    // Check object events
    if (command.directObject) {
      const object = this.gameState.getObject(command.directObject);
      if (object && object.events) {
        for (const event of object.events) {
          if (this.matchesCommand(command, event)) {
            return event;
          }
        }
      }
    }

    // Check global events
    const gameJSON = this.gameState.gameJSON;
    if (gameJSON && gameJSON.globalEvents) {
      for (const event of gameJSON.globalEvents) {
        if (this.matchesCommand(command, event)) {
          return event;
        }
      }
    }

    return null;
  }

  /**
   * Check if command matches event trigger
   * @private
   * @param {Object} command - Parsed command
   * @param {Object} event - Event definition
   * @returns {boolean} Whether command matches
   */
  matchesCommand(command, event) {
    if (!event.trigger) return false;

    // Check verb
    if (event.trigger.verb && event.trigger.verb !== command.verb) {
      return false;
    }

    // Check object
    if (event.trigger.object && event.trigger.object !== command.directObject) {
      return false;
    }

    // Check preposition
    if (
      event.trigger.preposition &&
      event.trigger.preposition !== command.preposition
    ) {
      return false;
    }

    // Check indirect object
    if (
      event.trigger.indirectObject &&
      event.trigger.indirectObject !== command.indirectObject
    ) {
      return false;
    }

    // Check condition
    if (event.condition && !this.checkCondition(event.condition)) {
      return false;
    }

    return true;
  }

  /**
   * Handle dynamic command via AI
   * @private
   * @param {Object} command - Parsed command
   */
  async handleDynamicCommand(command) {
    // Build context for AI
    const context = {
      currentRoom: this.gameState.getCurrentRoom(),
      inventory: this.gameState.inventory,
      flags: this.gameState.flags,
      recentEvents: [], // TODO: Track recent events
    };

    // Get AI response
    const response = await this.aiManager.processCommand(command, context);

    // Display response
    if (response && response.message) {
      this.showMessage(response.message);
    }
  }

  /**
   * Show message to player
   * @private
   * @param {string} message - Message text
   */
  showMessage(message) {
    // TODO: Integrate with UI
    logger.game(message);

    // Dispatch custom event for UI
    window.dispatchEvent(
      new CustomEvent('game-message', {
        detail: { message },
      })
    );
  }

  /**
   * Enable room exit
   * @private
   * @param {string} roomId - Room ID
   * @param {string} exit - Exit direction
   */
  enableExit(roomId, exit) {
    const room = this.gameState.rooms[roomId];
    if (room && room.exits && room.exits[exit]) {
      room.exits[exit].enabled = true;
    }
  }

  /**
   * Disable room exit
   * @private
   * @param {string} roomId - Room ID
   * @param {string} exit - Exit direction
   */
  disableExit(roomId, exit) {
    const room = this.gameState.rooms[roomId];
    if (room && room.exits && room.exits[exit]) {
      room.exits[exit].enabled = false;
    }
  }

  /**
   * Handle end game action
   * @private
   * @param {Object} action - End game action
   */
  handleEndGame(action) {
    logger.info('Game ended:', action.ending);

    if (action.message) {
      this.showMessage(action.message);
    }

    // Dispatch end game event
    window.dispatchEvent(
      new CustomEvent('game-ended', {
        detail: {
          ending: action.ending,
          score: this.gameState.score,
          moves: this.gameState.moves,
        },
      })
    );
  }

  /**
   * Evaluate logical expression safely
   * @private
   * @param {string} expression - Expression with true/false/and/or/not
   * @returns {boolean} Result
   */
  evaluateExpression(expression) {
    // Simple evaluation of boolean expressions
    // This is a basic implementation that handles common cases

    // Handle single values
    if (expression === 'true') return true;
    if (expression === 'false') return false;

    // Handle NOT operations
    if (expression.startsWith('not ')) {
      return !this.evaluateExpression(expression.substring(4));
    }

    // Handle AND operations
    if (expression.includes(' and ')) {
      const parts = expression.split(' and ');
      return parts.every((part) => this.evaluateExpression(part.trim()));
    }

    // Handle OR operations
    if (expression.includes(' or ')) {
      const parts = expression.split(' or ');
      return parts.some((part) => this.evaluateExpression(part.trim()));
    }

    // Default to false for unknown expressions
    return false;
  }

  /**
   * Trigger a named event
   * @param {string} eventName - Name of event to trigger
   * @param {Object} context - Event context data
   * @returns {Promise<boolean>} Whether event was triggered
   */
  async triggerEvent(eventName, context = {}) {
    // Find events by name
    const events = this.findEventsByName(eventName);

    let triggered = false;
    for (const event of events) {
      if (this.checkCondition(event.condition)) {
        await this.executeScriptedEvent(event);
        triggered = true;
      }
    }

    // Also check for custom event handlers
    if (this.customHandlers.has(eventName)) {
      const handler = this.customHandlers.get(eventName);
      await handler(context);
      triggered = true;
    }

    return triggered;
  }

  /**
   * Find events by name
   * @private
   * @param {string} eventName - Event name to find
   * @returns {Array} Matching events
   */
  findEventsByName(eventName) {
    const events = [];

    // Check room events
    const room = this.gameState.getCurrentRoom();
    if (room && room.events) {
      room.events.forEach((event) => {
        if (event.name === eventName) {
          events.push(event);
        }
      });
    }

    // Check global events
    if (this.gameState.gameJSON && this.gameState.gameJSON.events) {
      this.gameState.gameJSON.events.forEach((event) => {
        if (event.name === eventName) {
          events.push(event);
        }
      });
    }

    return events;
  }

  /**
   * Process scheduled events
   * Should be called from game loop
   * @param {number} deltaTime - Time since last update in ms
   */
  processScheduledEvents(_deltaTime) {
    const now = Date.now();
    const eventsToProcess = [];

    // Find events ready to execute
    this.scheduledEvents = this.scheduledEvents.filter((scheduledEvent) => {
      if (scheduledEvent.time <= now) {
        eventsToProcess.push(scheduledEvent);
        return false; // Remove from queue
      }
      return true; // Keep in queue
    });

    // Execute ready events
    eventsToProcess.forEach((scheduledEvent) => {
      if (scheduledEvent.event) {
        this.executeScriptedEvent(scheduledEvent.event);
      } else if (scheduledEvent.action) {
        this.executeAction(scheduledEvent.action);
      } else if (scheduledEvent.callback) {
        scheduledEvent.callback();
      }
    });
  }

  /**
   * Register custom action handler
   * @param {string} actionType - Action type name
   * @param {Function} handler - Handler function
   */
  registerHandler(actionType, handler) {
    this.customHandlers.set(actionType, handler);
  }

  /**
   * Register default command handlers
   * @private
   */
  registerDefaultHandlers() {
    // Movement handler
    this.registerHandler('MOVE', (action) => {
      const direction = action.direction;
      const exitRoom = this.gameState.getExitRoom(direction);

      if (exitRoom) {
        this.executeAction({
          type: 'CHANGE_ROOM',
          roomId: exitRoom,
        });
      } else {
        this.showMessage("You can't go that way.");
      }
    });

    // Look handler
    this.registerHandler('LOOK', (_action) => {
      const currentRoom = this.gameState.getCurrentRoom();
      if (currentRoom) {
        this.showMessage(currentRoom.description);
      }
    });

    // Inventory handler
    this.registerHandler('INVENTORY', (_action) => {
      const inventory = this.gameState.getInventory();
      if (inventory.length === 0) {
        this.showMessage("You're not carrying anything.");
      } else {
        const items = inventory.map((id) => {
          const item = this.gameState.getItem(id);
          return item ? item.name : id;
        });
        this.showMessage(`You are carrying: ${items.join(', ')}`);
      }
    });
  }

  /**
   * Find events by trigger type
   * @private
   * @param {string} triggerType - Type of trigger
   * @param {Object} context - Trigger context
   * @returns {Array} Matching events
   */
  findEventsByTrigger(triggerType, context) {
    // This would search through game events for matching triggers
    const events = [];

    // Check current room events
    const room = this.gameState.getCurrentRoom();
    if (room && room.events) {
      room.events.forEach((event) => {
        if (event.trigger === triggerType) {
          // Check if context matches
          if (this.matchesTriggerContext(event, context)) {
            events.push(event);
          }
        }
      });
    }

    // Check global events
    if (this.gameState.gameJSON && this.gameState.gameJSON.events) {
      this.gameState.gameJSON.events.forEach((event) => {
        if (event.trigger === triggerType) {
          if (this.matchesTriggerContext(event, context)) {
            events.push(event);
          }
        }
      });
    }

    return events;
  }

  /**
   * Check if event context matches trigger
   * @private
   * @param {Object} event - Event object
   * @param {Object} context - Trigger context
   * @returns {boolean} Whether it matches
   */
  matchesTriggerContext(event, context) {
    if (!event.context) return true;

    // Check each context property
    for (const [key, value] of Object.entries(event.context)) {
      if (context[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute scripted event and return result
   * @private
   * @param {Object} event - Event object
   * @returns {Object|null} Event result
   */
  async executeScriptedEvent(event) {
    if (!event || !event.actions) return null;

    let result = { preventDefault: false };

    for (const action of event.actions) {
      this.executeAction(action);

      // Check for preventDefault flag
      if (action.preventDefault) {
        result.preventDefault = true;
        result.response = {
          success: false,
          text: action.message || "You can't do that.",
          audio: action.audio || 'error',
        };
      }
    }

    return result;
  }
}
