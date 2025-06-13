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
    console.log('Executing command:', command);

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
      console.error('Error executing command:', error);
      this.showMessage('Something went wrong. Please try again.');
    }
  }

  /**
   * Execute single game action
   * @param {Object} action - Action object
   */
  executeAction(action) {
    if (!action || !action.type) {
      console.warn('Invalid action:', action);
      return;
    }

    console.log('Executing action:', action.type);

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
        console.log(`Playing sound: ${action.soundId}`);
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
        console.log(`Moving view ${action.viewId} to ${action.x}, ${action.y}`);
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
          console.warn(`Unknown action type: ${action.type}`);
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

    console.log(`Scheduled event for ${delay}ms from now`);
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
      console.error('Error evaluating condition:', error);
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
   * Execute scripted event
   * @private
   * @param {Object} event - Event definition
   */
  async executeScriptedEvent(event) {
    console.log('Executing scripted event');

    // Execute all actions
    if (event.actions) {
      for (const action of event.actions) {
        this.executeAction(action);
      }
    }

    // Show response message
    if (event.response) {
      this.showMessage(event.response);
    }
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
      inventory: this.gameState.getInventory(),
      flags: this.gameState.flags,
      recentEvents: [], // TODO: Track recent events
    };

    // Get AI response
    const response = await this.aiManager.getDynamicResponse(context, command);

    // Display response
    this.showMessage(response);
  }

  /**
   * Show message to player
   * @private
   * @param {string} message - Message text
   */
  showMessage(message) {
    // TODO: Integrate with UI
    console.log(`[Game] ${message}`);

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
    console.log('Game ended:', action.ending);

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
    // Simple recursive descent parser for boolean expressions
    const tokens = expression.split(/\s+/);

    const evaluate = (tokens, index = 0) => {
      if (index >= tokens.length) return true;

      const token = tokens[index];

      if (token === 'true') return true;
      if (token === 'false') return false;
      if (token === 'not') {
        return !evaluate(tokens, index + 1);
      }

      // For now, just return false for complex expressions
      // TODO: Implement full boolean expression parser
      return false;
    };

    return evaluate(tokens);
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
}
