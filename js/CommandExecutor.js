/**
 * CommandExecutor - Executes parsed commands and updates game state
 * 
 * This class bridges the gap between the parser and the game engine,
 * executing commands and returning appropriate responses.
 */

export class CommandExecutor {
  /**
   * @param {GameState} gameState - Game state manager
   * @param {EventManager} eventManager - Event system
   * @param {ViewManager} viewManager - Sprite/view system
   * @param {SceneRenderer} sceneRenderer - Graphics system
   * @param {SoundManager} soundManager - Audio system
   */
  constructor(gameState, eventManager, viewManager, sceneRenderer, soundManager) {
    this.gameState = gameState;
    this.eventManager = eventManager;
    this.viewManager = viewManager;
    this.sceneRenderer = sceneRenderer;
    this.soundManager = soundManager;
    
    // Command handlers mapped to verbs
    this.handlers = {
      // Movement
      go: this.handleGo.bind(this),
      enter: this.handleEnter.bind(this),
      exit: this.handleExit.bind(this),
      
      // Object manipulation
      take: this.handleTake.bind(this),
      drop: this.handleDrop.bind(this),
      use: this.handleUse.bind(this),
      give: this.handleGive.bind(this),
      put: this.handlePut.bind(this),
      
      // Examination
      look: this.handleLook.bind(this),
      examine: this.handleExamine.bind(this),
      search: this.handleSearch.bind(this),
      read: this.handleRead.bind(this),
      
      // Container operations
      open: this.handleOpen.bind(this),
      close: this.handleClose.bind(this),
      unlock: this.handleUnlock.bind(this),
      
      // Communication
      talk: this.handleTalk.bind(this),
      ask: this.handleAsk.bind(this),
      tell: this.handleTell.bind(this),
      yell: this.handleYell.bind(this),
      
      // Physical actions
      push: this.handlePush.bind(this),
      pull: this.handlePull.bind(this),
      turn: this.handleTurn.bind(this),
      touch: this.handleTouch.bind(this),
      
      // Special actions
      eat: this.handleEat.bind(this),
      drink: this.handleDrink.bind(this),
      wear: this.handleWear.bind(this),
      remove: this.handleRemove.bind(this),
      wait: this.handleWait.bind(this),
      
      // Meta commands
      save: this.handleSave.bind(this),
      load: this.handleLoad.bind(this),
      quit: this.handleQuit.bind(this),
      restart: this.handleRestart.bind(this),
      inventory: this.handleInventory.bind(this),
      score: this.handleScore.bind(this),
      help: this.handleHelp.bind(this),
    };
    
    // Track command history for undo
    this.commandHistory = [];
    this.maxHistory = 10;
  }

  /**
   * Execute a parsed command
   * @param {Object} parsedCommand - Command from parser
   * @returns {Object} Response with text and optional state changes
   */
  async execute(parsedCommand) {
    if (!parsedCommand || !parsedCommand.success) {
      return {
        success: false,
        text: parsedCommand?.error || "I don't understand that.",
        audio: 'error'
      };
    }
    
    const command = parsedCommand.command;
    const handler = this.handlers[command.verb];
    
    if (!handler) {
      return {
        success: false,
        text: `I don't know how to ${command.verb}.`,
        audio: 'error'
      };
    }
    
    try {
      // Check if command should trigger any events first
      const preEventResult = await this.eventManager.checkPreCommandEvents(command);
      if (preEventResult && preEventResult.preventDefault) {
        return preEventResult.response;
      }
      
      // Execute the command
      const result = await handler(command);
      
      // Trigger post-command events
      await this.eventManager.checkPostCommandEvents(command, result);
      
      // Add to history if successful
      if (result.success) {
        this.addToHistory(command);
        
        // Update game state
        if (result.stateChanges) {
          this.applyStateChanges(result.stateChanges);
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('Command execution error:', error);
      return {
        success: false,
        text: "Something went wrong. Please try again.",
        audio: 'error'
      };
    }
  }

  // Movement commands
  async handleGo(command) {
    const direction = command.directObject;
    const currentRoom = this.gameState.getCurrentRoom();
    
    if (!currentRoom.exits || !currentRoom.exits[direction]) {
      return {
        success: false,
        text: "You can't go that way.",
        audio: 'bump'
      };
    }
    
    const targetRoomId = currentRoom.exits[direction];
    const targetRoom = this.gameState.getRoom(targetRoomId);
    
    if (!targetRoom) {
      return {
        success: false,
        text: "That way is blocked.",
        audio: 'bump'
      };
    }
    
    // Check if exit is locked or blocked
    const exitState = this.gameState.getExitState(currentRoom.id, direction);
    if (exitState && exitState.locked) {
      return {
        success: false,
        text: exitState.lockedMessage || "That way is locked.",
        audio: 'locked'
      };
    }
    
    // Move to new room
    this.gameState.setCurrentRoom(targetRoomId);
    
    // Trigger room entry events
    await this.eventManager.triggerRoomEntry(targetRoomId);
    
    return {
      success: true,
      text: this.describeRoom(targetRoom),
      audio: 'footsteps',
      stateChanges: {
        moves: this.gameState.moves + 1
      }
    };
  }

  async handleEnter(command) {
    // Try to find an "in" exit or a container/vehicle
    const currentRoom = this.gameState.getCurrentRoom();
    
    if (currentRoom.exits && currentRoom.exits.in) {
      return this.handleGo({ ...command, directObject: 'in' });
    }
    
    return {
      success: false,
      text: "There's nothing here to enter.",
      audio: 'error'
    };
  }

  async handleExit(command) {
    const currentRoom = this.gameState.getCurrentRoom();
    
    if (currentRoom.exits && currentRoom.exits.out) {
      return this.handleGo({ ...command, directObject: 'out' });
    }
    
    return {
      success: false,
      text: "There's no obvious exit here.",
      audio: 'error'
    };
  }

  // Object manipulation
  async handleTake(command) {
    if (command.modifiers.includes('all')) {
      return this.handleTakeAll(command);
    }
    
    const objectRef = command.resolvedDirectObject;
    if (!objectRef || objectRef.type === 'unknown') {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error'
      };
    }
    
    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't take that.",
        audio: 'error'
      };
    }
    
    // Check if already in inventory
    if (this.gameState.hasItem(object.id)) {
      return {
        success: false,
        text: "You already have that.",
        audio: 'error'
      };
    }
    
    // Check if takeable
    if (object.fixed || object.takeable === false) {
      return {
        success: false,
        text: object.fixedMessage || "You can't take that.",
        audio: 'error'
      };
    }
    
    // Check weight/size limits
    if (object.weight) {
      const currentWeight = this.gameState.getInventoryWeight();
      const maxWeight = this.gameState.getMaxCarryWeight();
      
      if (currentWeight + object.weight > maxWeight) {
        return {
          success: false,
          text: "You're carrying too much already.",
          audio: 'error'
        };
      }
    }
    
    // Take the object
    this.gameState.addToInventory(object.id);
    this.gameState.removeFromRoom(object.id);
    
    return {
      success: true,
      text: `Taken.`,
      audio: 'pickup',
      stateChanges: {
        score: this.gameState.score + (object.points || 0)
      }
    };
  }

  async handleTakeAll(command) {
    const currentRoom = this.gameState.getCurrentRoom();
    const items = currentRoom.items || [];
    
    if (items.length === 0) {
      return {
        success: false,
        text: "There's nothing here to take.",
        audio: 'error'
      };
    }
    
    const taken = [];
    const failed = [];
    
    for (const itemId of items) {
      const result = await this.handleTake({
        ...command,
        modifiers: [],
        resolvedDirectObject: {
          type: 'object',
          value: itemId,
          object: this.gameState.getItem(itemId)
        }
      });
      
      if (result.success) {
        taken.push(itemId);
      } else {
        failed.push(itemId);
      }
    }
    
    if (taken.length === 0) {
      return {
        success: false,
        text: "You can't take anything here.",
        audio: 'error'
      };
    }
    
    let text = `You take ${taken.length} item${taken.length > 1 ? 's' : ''}.`;
    if (failed.length > 0) {
      text += ` You couldn't take ${failed.length} item${failed.length > 1 ? 's' : ''}.`;
    }
    
    return {
      success: true,
      text,
      audio: 'pickup'
    };
  }

  async handleDrop(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef || !this.gameState.hasItem(objectRef.value)) {
      return {
        success: false,
        text: "You don't have that.",
        audio: 'error'
      };
    }
    
    const object = this.gameState.getItem(objectRef.value);
    
    // Drop the item
    this.gameState.removeFromInventory(object.id);
    this.gameState.addToRoom(object.id);
    
    return {
      success: true,
      text: "Dropped.",
      audio: 'drop'
    };
  }

  // Examination
  async handleLook(command) {
    // No object specified - describe room
    if (!command.directObject) {
      const room = this.gameState.getCurrentRoom();
      return {
        success: true,
        text: this.describeRoom(room, true),
        audio: null
      };
    }
    
    // Look at specific object
    return this.handleExamine(command);
  }

  async handleExamine(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef || objectRef.type === 'unknown') {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error'
      };
    }
    
    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't examine that.",
        audio: 'error'
      };
    }
    
    let description = object.description || "You see nothing special.";
    
    // Add container contents if applicable
    if (object.type === 'container' && object.open) {
      const contents = object.contents || [];
      if (contents.length > 0) {
        description += "\nIt contains: " + contents.map(id => 
          this.gameState.getItem(id)?.name || id
        ).join(', ') + '.';
      } else {
        description += "\nIt's empty.";
      }
    }
    
    // Check for hidden details
    if (object.details && object.examined) {
      description += '\n' + object.details;
    }
    
    // Mark as examined
    this.gameState.setObjectState(object.id, 'examined', true);
    
    return {
      success: true,
      text: description,
      audio: null
    };
  }

  // Inventory
  async handleInventory(command) {
    const inventory = this.gameState.getInventory();
    
    if (inventory.length === 0) {
      return {
        success: true,
        text: "You're not carrying anything.",
        audio: null
      };
    }
    
    const items = inventory.map(id => {
      const item = this.gameState.getItem(id);
      return item?.name || id;
    });
    
    return {
      success: true,
      text: "You are carrying:\n" + items.map(name => `  - ${name}`).join('\n'),
      audio: null
    };
  }

  // Meta commands
  async handleSave(command) {
    return {
      success: true,
      text: "Game saved. (Feature coming soon)",
      audio: 'success',
      meta: { action: 'save' }
    };
  }

  async handleHelp(command) {
    const helpText = `Common commands:
- LOOK/L - Examine your surroundings
- EXAMINE/X [object] - Look at something closely  
- TAKE/GET [object] - Pick up an item
- DROP [object] - Put down an item
- INVENTORY/I - Check what you're carrying
- GO [direction] or N/S/E/W - Move around
- USE [item] ON [object] - Use an item
- TALK TO [person] - Speak with someone
- SAVE/LOAD - Save or restore your game
- HELP - Show this message`;
    
    return {
      success: true,
      text: helpText,
      audio: null
    };
  }

  // Helper methods
  describeRoom(room, verbose = false) {
    let description = room.name + '\n' + room.description;
    
    // List exits
    if (room.exits && Object.keys(room.exits).length > 0) {
      const exitList = Object.keys(room.exits).join(', ');
      description += `\n\nExits: ${exitList}`;
    }
    
    // List items
    const items = (room.items || []).map(id => this.gameState.getItem(id));
    const visibleItems = items.filter(item => item && !item.hidden);
    
    if (visibleItems.length > 0) {
      description += '\n\nYou can see: ' + visibleItems.map(item => item.name).join(', ') + '.';
    }
    
    // List NPCs
    if (room.npcs && room.npcs.length > 0) {
      const npcNames = room.npcs.map(id => {
        const npc = this.gameState.getNPC(id);
        return npc?.name || id;
      });
      description += '\n' + npcNames.join(', ') + ' is here.';
    }
    
    return description;
  }

  applyStateChanges(changes) {
    Object.entries(changes).forEach(([key, value]) => {
      if (typeof this.gameState[key] !== 'undefined') {
        this.gameState[key] = value;
      }
    });
  }

  addToHistory(command) {
    this.commandHistory.push({
      command,
      timestamp: Date.now(),
      state: this.gameState.createSnapshot()
    });
    
    if (this.commandHistory.length > this.maxHistory) {
      this.commandHistory.shift();
    }
  }

  // Stub handlers for remaining commands
  async handleUse(command) {
    return { success: false, text: "Using objects is not yet implemented.", audio: 'error' };
  }
  
  async handleGive(command) {
    return { success: false, text: "Giving is not yet implemented.", audio: 'error' };
  }
  
  async handlePut(command) {
    return { success: false, text: "Putting objects is not yet implemented.", audio: 'error' };
  }
  
  async handleSearch(command) {
    return { success: false, text: "Searching is not yet implemented.", audio: 'error' };
  }
  
  async handleRead(command) {
    return { success: false, text: "Reading is not yet implemented.", audio: 'error' };
  }
  
  async handleOpen(command) {
    return { success: false, text: "Opening is not yet implemented.", audio: 'error' };
  }
  
  async handleClose(command) {
    return { success: false, text: "Closing is not yet implemented.", audio: 'error' };
  }
  
  async handleUnlock(command) {
    return { success: false, text: "Unlocking is not yet implemented.", audio: 'error' };
  }
  
  async handleTalk(command) {
    return { success: false, text: "Talking is not yet implemented.", audio: 'error' };
  }
  
  async handleAsk(command) {
    return { success: false, text: "Asking is not yet implemented.", audio: 'error' };
  }
  
  async handleTell(command) {
    return { success: false, text: "Telling is not yet implemented.", audio: 'error' };
  }
  
  async handleYell(command) {
    return { success: false, text: "Yelling is not yet implemented.", audio: 'error' };
  }
  
  async handlePush(command) {
    return { success: false, text: "Pushing is not yet implemented.", audio: 'error' };
  }
  
  async handlePull(command) {
    return { success: false, text: "Pulling is not yet implemented.", audio: 'error' };
  }
  
  async handleTurn(command) {
    return { success: false, text: "Turning is not yet implemented.", audio: 'error' };
  }
  
  async handleTouch(command) {
    return { success: false, text: "Touching is not yet implemented.", audio: 'error' };
  }
  
  async handleEat(command) {
    return { success: false, text: "Eating is not yet implemented.", audio: 'error' };
  }
  
  async handleDrink(command) {
    return { success: false, text: "Drinking is not yet implemented.", audio: 'error' };
  }
  
  async handleWear(command) {
    return { success: false, text: "Wearing is not yet implemented.", audio: 'error' };
  }
  
  async handleRemove(command) {
    return { success: false, text: "Removing worn items is not yet implemented.", audio: 'error' };
  }
  
  async handleWait(command) {
    return { 
      success: true, 
      text: "Time passes...", 
      audio: 'clock',
      stateChanges: { turns: this.gameState.turns + 1 }
    };
  }
  
  async handleLoad(command) {
    return { success: true, text: "Loading games is not yet implemented.", audio: 'error' };
  }
  
  async handleQuit(command) {
    return { 
      success: true, 
      text: "Thanks for playing!", 
      audio: 'goodbye',
      meta: { action: 'quit' }
    };
  }
  
  async handleRestart(command) {
    return { 
      success: true, 
      text: "Restarting game...", 
      audio: 'restart',
      meta: { action: 'restart' }
    };
  }
  
  async handleScore(command) {
    const score = this.gameState.score || 0;
    const maxScore = this.gameState.maxScore || 100;
    const moves = this.gameState.moves || 0;
    
    return {
      success: true,
      text: `Score: ${score} of ${maxScore} points in ${moves} moves.`,
      audio: null
    };
  }
}