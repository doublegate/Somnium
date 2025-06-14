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
   * @param {Inventory} inventory - Inventory management system
   * @param {InteractionSystem} interactionSystem - Object interaction system
   * @param {MovementSystem} movementSystem - Movement and navigation system
   */
  constructor(
    gameState,
    eventManager,
    viewManager,
    sceneRenderer,
    soundManager,
    inventory,
    interactionSystem,
    movementSystem
  ) {
    this.gameState = gameState;
    this.eventManager = eventManager;
    this.viewManager = viewManager;
    this.sceneRenderer = sceneRenderer;
    this.soundManager = soundManager;
    this.inventory = inventory;
    this.interactionSystem = interactionSystem;
    this.movementSystem = movementSystem;

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
        audio: 'error',
      };
    }

    const command = parsedCommand.command;
    const handler = this.handlers[command.verb];

    if (!handler) {
      return {
        success: false,
        text: `I don't know how to ${command.verb}.`,
        audio: 'error',
      };
    }

    try {
      // Check if command should trigger any events first
      const preEventResult =
        await this.eventManager.checkPreCommandEvents(command);
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
        text: 'Something went wrong. Please try again.',
        audio: 'error',
      };
    }
  }

  // Movement commands
  async handleGo(command) {
    const direction = command.directObject;

    // Use MovementSystem for enhanced navigation
    const result = await this.movementSystem.movePlayer(direction);

    if (!result.success) {
      return {
        success: false,
        text: result.message,
        audio: result.blocked ? 'locked' : 'bump',
      };
    }

    // Get the new room
    const targetRoom = this.gameState.getRoom(result.newRoom);

    return {
      success: true,
      text: this.describeRoom(targetRoom),
      audio: 'footsteps',
      stateChanges: {
        moves: this.gameState.moves + 1,
      },
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
      audio: 'error',
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
      audio: 'error',
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
        audio: 'error',
      };
    }

    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't take that.",
        audio: 'error',
      };
    }

    // Check if takeable
    if (object.fixed || object.takeable === false) {
      return {
        success: false,
        text: object.fixedMessage || "You can't take that.",
        audio: 'error',
      };
    }

    // Use inventory system to check if can add
    const canAddCheck = this.inventory.canAddItem(object.id);
    if (!canAddCheck.canAdd) {
      return {
        success: false,
        text: canAddCheck.reason,
        audio: 'error',
      };
    }

    // Take the object
    const added = this.inventory.addItem(object.id);
    if (!added) {
      return {
        success: false,
        text: 'Something went wrong taking that.',
        audio: 'error',
      };
    }

    this.gameState.removeFromRoom(object.id);

    return {
      success: true,
      text: `Taken.`,
      audio: 'pickup',
      stateChanges: {
        score: this.gameState.score + (object.points || 0),
      },
    };
  }

  async handleTakeAll(command) {
    const currentRoom = this.gameState.getCurrentRoom();
    const items = currentRoom.items || [];

    if (items.length === 0) {
      return {
        success: false,
        text: "There's nothing here to take.",
        audio: 'error',
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
          object: this.gameState.getItem(itemId),
        },
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
        audio: 'error',
      };
    }

    let text = `You take ${taken.length} item${taken.length > 1 ? 's' : ''}.`;
    if (failed.length > 0) {
      text += ` You couldn't take ${failed.length} item${failed.length > 1 ? 's' : ''}.`;
    }

    return {
      success: true,
      text,
      audio: 'pickup',
    };
  }

  async handleDrop(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: 'Drop what?',
        audio: 'error',
      };
    }

    // Check if we have the item
    if (!this.inventory.getAllItems().includes(objectRef.value)) {
      return {
        success: false,
        text: "You don't have that.",
        audio: 'error',
      };
    }

    const object = this.gameState.getItem(objectRef.value);

    // Drop the item using inventory system
    const removed = this.inventory.removeItem(objectRef.value);
    if (removed) {
      this.gameState.addToRoom(object.id);

      return {
        success: true,
        text: 'Dropped.',
        audio: 'drop',
      };
    }

    return {
      success: false,
      text: "You can't drop that.",
      audio: 'error',
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
        audio: null,
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
        audio: 'error',
      };
    }

    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't examine that.",
        audio: 'error',
      };
    }

    let description = object.description || 'You see nothing special.';

    // Add container contents if applicable
    if (object.type === 'container' && object.open) {
      const contents = object.contents || [];
      if (contents.length > 0) {
        description +=
          '\nIt contains: ' +
          contents
            .map((id) => this.gameState.getItem(id)?.name || id)
            .join(', ') +
          '.';
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
      audio: null,
    };
  }

  // Inventory
  async handleInventory(_command) {
    const items = this.inventory.getAllItems();

    if (items.length === 0) {
      return {
        success: true,
        text: "You're not carrying anything.",
        audio: null,
      };
    }

    // Build inventory display
    let text = 'You are carrying:\n';

    // Regular items
    const regularItems = this.inventory.items.map((id) => {
      const item = this.gameState.getItem(id);
      return item?.name || id;
    });

    if (regularItems.length > 0) {
      text += regularItems.map((name) => `  - ${name}`).join('\n');
    }

    // Worn items
    const wornItems = [];
    for (const [slot, itemId] of Object.entries(this.inventory.worn)) {
      if (itemId) {
        const item = this.gameState.getItem(itemId);
        wornItems.push(`${item?.name || itemId} (worn on ${slot})`);
      }
    }

    if (wornItems.length > 0) {
      text +=
        '\n\nWearing:\n' + wornItems.map((desc) => `  - ${desc}`).join('\n');
    }

    // Container contents
    if (this.inventory.containers.size > 0) {
      for (const [containerId, contents] of this.inventory.containers) {
        if (contents.length > 0) {
          const container = this.gameState.getItem(containerId);
          text += `\n\nIn ${container?.name || containerId}:\n`;
          const containerItems = contents.map((id) => {
            const item = this.gameState.getItem(id);
            return `  - ${item?.name || id}`;
          });
          text += containerItems.join('\n');
        }
      }
    }

    // Weight info
    const totalWeight = this.inventory.getTotalWeight();
    const maxWeight = this.inventory.maxWeight;
    text += `\n\nTotal weight: ${totalWeight}/${maxWeight}`;

    return {
      success: true,
      text,
      audio: null,
    };
  }

  // Meta commands
  async handleSave(_command) {
    return {
      success: true,
      text: 'Game saved. (Feature coming soon)',
      audio: 'success',
      meta: { action: 'save' },
    };
  }

  async handleHelp(_command) {
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
      audio: null,
    };
  }

  // Helper methods
  describeRoom(room, _verbose = false) {
    let description = room.name + '\n' + room.description;

    // List exits
    if (room.exits && Object.keys(room.exits).length > 0) {
      const exitList = Object.keys(room.exits).join(', ');
      description += `\n\nExits: ${exitList}`;
    }

    // List items
    const items = (room.items || []).map((id) => this.gameState.getItem(id));
    const visibleItems = items.filter((item) => item && !item.hidden);

    if (visibleItems.length > 0) {
      description +=
        '\n\nYou can see: ' +
        visibleItems.map((item) => item.name).join(', ') +
        '.';
    }

    // List NPCs
    if (room.npcs && room.npcs.length > 0) {
      const npcNames = room.npcs.map((id) => {
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
      state: this.gameState.createSnapshot(),
    });

    if (this.commandHistory.length > this.maxHistory) {
      this.commandHistory.shift();
    }
  }

  findUseEvent(itemId, targetId) {
    // Find scripted event for using item on target
    const item = this.gameState.getItem(itemId);
    if (item && item.useEvents) {
      return item.useEvents.find(
        (event) => event.target === targetId || event.target === 'any'
      );
    }
    return null;
  }

  // Stub handlers for remaining commands
  async handleUse(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: 'Use what?',
        audio: 'error',
      };
    }

    // Handle use with indirect object
    if (command.indirectObject) {
      const targetRef = command.resolvedIndirectObject;
      if (!targetRef) {
        return {
          success: false,
          text: `You don't see any ${command.indirectObject} here.`,
          audio: 'error',
        };
      }

      // Use InteractionSystem for item interactions
      const result = this.interactionSystem.useItemOn(
        objectRef.value,
        targetRef.value
      );

      // Play appropriate sound effect
      if (result.success && result.effects.length > 0) {
        // Check for specific sound effects in the result
        for (const effect of result.effects) {
          if (effect.type === 'playSound') {
            this.soundManager.playSoundEffect(effect.sound);
          }
        }
      }

      return {
        success: result.success,
        text: result.message,
        audio: result.success ? 'use' : 'error',
      };
    }

    // Single object use - check if usable
    const object =
      this.gameState.getItem(objectRef.value) ||
      this.gameState.getObject(objectRef.value);

    if (!object) {
      return {
        success: false,
        text: "You can't use that.",
        audio: 'error',
      };
    }

    // Generic use
    if (object.useMessage) {
      return {
        success: true,
        text: object.useMessage,
        audio: 'use',
      };
    }

    return {
      success: false,
      text: `You need to specify what to use the ${object.name} on.`,
      audio: 'error',
    };
  }

  async handleGive(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef || !this.gameState.hasItem(objectRef.value)) {
      return {
        success: false,
        text: "You don't have that.",
        audio: 'error',
      };
    }

    if (!command.indirectObject) {
      return {
        success: false,
        text: 'Who do you want to give it to?',
        audio: 'error',
      };
    }

    const targetRef = command.resolvedIndirectObject;
    if (!targetRef || targetRef.type !== 'npc') {
      return {
        success: false,
        text: "They're not here.",
        audio: 'error',
      };
    }

    const npc = this.gameState.getNPC(targetRef.value);
    const item = this.gameState.getItem(objectRef.value);

    // Check if NPC accepts this item
    if (npc.acceptsItems && npc.acceptsItems.includes(item.id)) {
      this.gameState.removeFromInventory(item.id);
      this.gameState.setFlag(`gave_${item.id}_to_${npc.id}`, true);

      return {
        success: true,
        text: npc.acceptMessage || `${npc.name} takes the ${item.name}.`,
        audio: 'give',
        stateChanges: {
          score: this.gameState.score + (item.givePoints || 0),
        },
      };
    }

    return {
      success: false,
      text: npc.refuseMessage || `${npc.name} doesn't want that.`,
      audio: 'error',
    };
  }

  async handlePut(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef || !this.gameState.hasItem(objectRef.value)) {
      return {
        success: false,
        text: "You don't have that.",
        audio: 'error',
      };
    }

    if (!command.indirectObject) {
      return {
        success: false,
        text: 'Where do you want to put it?',
        audio: 'error',
      };
    }

    const targetRef = command.resolvedIndirectObject;
    if (!targetRef) {
      return {
        success: false,
        text: `I don't see any ${command.indirectObject} here.`,
        audio: 'error',
      };
    }

    const target = targetRef.object;
    if (!target || target.type !== 'container') {
      return {
        success: false,
        text: "You can't put anything in that.",
        audio: 'error',
      };
    }

    if (!target.open) {
      return {
        success: false,
        text: `The ${target.name} is closed.`,
        audio: 'error',
      };
    }

    const item = this.gameState.getItem(objectRef.value);

    // Move item to container
    this.gameState.removeFromInventory(item.id);
    if (!target.contents) target.contents = [];
    target.contents.push(item.id);

    return {
      success: true,
      text: `You put the ${item.name} in the ${target.name}.`,
      audio: 'put',
    };
  }

  async handleSearch(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      // Search the room
      const room = this.gameState.getCurrentRoom();
      if (room.searchable) {
        const searched = this.gameState.getFlag(`searched_${room.id}`);
        if (!searched && room.hiddenItems) {
          // Reveal hidden items
          room.hiddenItems.forEach((itemId) => {
            this.gameState.addToRoom(itemId);
          });
          this.gameState.setFlag(`searched_${room.id}`, true);

          return {
            success: true,
            text: room.searchMessage || 'You find something!',
            audio: 'discover',
          };
        }
      }
      return {
        success: true,
        text: "You don't find anything special.",
        audio: null,
      };
    }

    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't search that.",
        audio: 'error',
      };
    }

    // Search specific object
    if (object.searchable) {
      const searched = this.gameState.getObjectState(object.id, 'searched');
      if (!searched && object.hiddenItems) {
        // Reveal hidden items
        object.hiddenItems.forEach((itemId) => {
          if (object.type === 'container') {
            if (!object.contents) object.contents = [];
            object.contents.push(itemId);
          } else {
            this.gameState.addToRoom(itemId);
          }
        });
        this.gameState.setObjectState(object.id, 'searched', true);

        return {
          success: true,
          text:
            object.searchMessage ||
            `You search the ${object.name} and find something!`,
          audio: 'discover',
        };
      }
    }

    return {
      success: true,
      text: `You search the ${object.name} but find nothing special.`,
      audio: null,
    };
  }

  async handleRead(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error',
      };
    }

    const object = objectRef.object || this.gameState.getItem(objectRef.value);
    if (!object) {
      return {
        success: false,
        text: "You can't read that.",
        audio: 'error',
      };
    }

    // Check if readable
    if (!object.readable) {
      return {
        success: false,
        text: "There's nothing to read on that.",
        audio: 'error',
      };
    }

    // Return the text
    return {
      success: true,
      text: object.text || 'The text is too faded to read.',
      audio: null,
      stateChanges: object.readPoints
        ? {
            score: this.gameState.score + object.readPoints,
          }
        : null,
    };
  }

  async handleOpen(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error',
      };
    }

    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't open that.",
        audio: 'error',
      };
    }

    // Check if openable
    if (object.type !== 'container' && object.type !== 'door') {
      return {
        success: false,
        text: "That's not something you can open.",
        audio: 'error',
      };
    }

    // Check if already open
    if (object.open) {
      return {
        success: false,
        text: "It's already open.",
        audio: 'error',
      };
    }

    // Check if locked
    if (object.locked) {
      return {
        success: false,
        text: object.lockedMessage || "It's locked.",
        audio: 'locked',
      };
    }

    // Open it
    this.gameState.setObjectState(object.id, 'open', true);

    let text = `You open the ${object.name}.`;

    // Reveal contents if container
    if (
      object.type === 'container' &&
      object.contents &&
      object.contents.length > 0
    ) {
      const items = object.contents.map((id) => {
        const item = this.gameState.getItem(id);
        return item?.name || id;
      });
      text += `\nInside you find: ${items.join(', ')}.`;
    }

    return {
      success: true,
      text,
      audio: 'open',
    };
  }

  async handleClose(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error',
      };
    }

    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't close that.",
        audio: 'error',
      };
    }

    // Check if closeable
    if (object.type !== 'container' && object.type !== 'door') {
      return {
        success: false,
        text: "That's not something you can close.",
        audio: 'error',
      };
    }

    // Check if already closed
    if (!object.open) {
      return {
        success: false,
        text: "It's already closed.",
        audio: 'error',
      };
    }

    // Close it
    this.gameState.setObjectState(object.id, 'open', false);

    return {
      success: true,
      text: `You close the ${object.name}.`,
      audio: 'close',
    };
  }

  async handleUnlock(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error',
      };
    }

    const object = objectRef.object;
    if (!object || !object.locked) {
      return {
        success: false,
        text: "That's not locked.",
        audio: 'error',
      };
    }

    // Need a key
    if (!object.keyId) {
      return {
        success: false,
        text: "You can't unlock that.",
        audio: 'error',
      };
    }

    // Check if player has the key
    if (!this.gameState.hasItem(object.keyId)) {
      return {
        success: false,
        text: "You don't have the right key.",
        audio: 'error',
      };
    }

    // Unlock it
    this.gameState.setObjectState(object.id, 'locked', false);

    return {
      success: true,
      text: `You unlock the ${object.name}.`,
      audio: 'unlock',
      stateChanges: {
        score: this.gameState.score + (object.unlockPoints || 0),
      },
    };
  }

  async handleTalk(command) {
    if (!command.indirectObject) {
      return {
        success: false,
        text: 'Who do you want to talk to?',
        audio: 'error',
      };
    }

    const npcRef = command.resolvedIndirectObject;
    if (!npcRef || npcRef.type !== 'npc') {
      return {
        success: false,
        text: "They're not here.",
        audio: 'error',
      };
    }

    const npc = this.gameState.getNPC(npcRef.value);
    if (!npc) {
      return {
        success: false,
        text: "You can't talk to that.",
        audio: 'error',
      };
    }

    // Get appropriate dialogue
    let dialogue = npc.defaultDialogue || `${npc.name} has nothing to say.`;

    // Check for conditional dialogue
    if (npc.dialogues) {
      for (const d of npc.dialogues) {
        if (!d.condition || this.eventManager.checkCondition(d.condition)) {
          dialogue = d.text;

          // Execute any associated actions
          if (d.actions) {
            for (const action of d.actions) {
              this.eventManager.executeAction(action);
            }
          }
          break;
        }
      }
    }

    return {
      success: true,
      text: `${npc.name}: "${dialogue}"`,
      audio: 'talk',
    };
  }

  async handleAsk(command) {
    if (!command.indirectObject) {
      return {
        success: false,
        text: 'Who do you want to ask?',
        audio: 'error',
      };
    }

    const npcRef = command.resolvedIndirectObject;
    if (!npcRef || npcRef.type !== 'npc') {
      return {
        success: false,
        text: "They're not here.",
        audio: 'error',
      };
    }

    const npc = this.gameState.getNPC(npcRef.value);
    const topic = command.directObject || 'general';

    // Look for topic-specific response
    if (npc.topics && npc.topics[topic]) {
      return {
        success: true,
        text: `${npc.name}: "${npc.topics[topic]}"`,
        audio: 'talk',
      };
    }

    // Default response
    return {
      success: true,
      text: `${npc.name}: "I don't know about that."`,
      audio: 'talk',
    };
  }

  async handleTell(command) {
    if (!command.indirectObject) {
      return {
        success: false,
        text: 'Who do you want to tell?',
        audio: 'error',
      };
    }

    const npcRef = command.resolvedIndirectObject;
    if (!npcRef || npcRef.type !== 'npc') {
      return {
        success: false,
        text: "They're not here.",
        audio: 'error',
      };
    }

    const topic = command.directObject;
    if (!topic) {
      return {
        success: false,
        text: 'What do you want to tell them about?',
        audio: 'error',
      };
    }

    const npc = this.gameState.getNPC(npcRef.value);

    return {
      success: true,
      text: `You tell ${npc.name} about ${topic}. They nod thoughtfully.`,
      audio: 'talk',
    };
  }

  async handleYell(_command) {
    return {
      success: true,
      text: 'You yell loudly. Your voice echoes in the distance.',
      audio: 'yell',
    };
  }

  async handlePush(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error',
      };
    }

    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't push that.",
        audio: 'error',
      };
    }

    if (object.pushable) {
      // Set flag if this reveals something
      if (object.id === 'bookshelf') {
        this.gameState.setFlag('bookshelf_moved', true);
      }

      return {
        success: true,
        text: object.pushMessage || `You push the ${object.name}.`,
        audio: 'push',
      };
    }

    return {
      success: false,
      text: "It won't budge.",
      audio: 'error',
    };
  }

  async handlePull(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error',
      };
    }

    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't pull that.",
        audio: 'error',
      };
    }

    if (object.pullable) {
      return {
        success: true,
        text: object.pullMessage || `You pull the ${object.name}.`,
        audio: 'pull',
      };
    }

    return {
      success: false,
      text: "It won't move.",
      audio: 'error',
    };
  }

  async handleTurn(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error',
      };
    }

    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't turn that.",
        audio: 'error',
      };
    }

    if (object.turnable) {
      // Toggle state
      const currentState =
        this.gameState.getObjectState(object.id, 'turned') || false;
      this.gameState.setObjectState(object.id, 'turned', !currentState);

      return {
        success: true,
        text: object.turnMessage || `You turn the ${object.name}.`,
        audio: 'turn',
      };
    }

    return {
      success: false,
      text: "It doesn't turn.",
      audio: 'error',
    };
  }

  async handleTouch(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: "I don't see that here.",
        audio: 'error',
      };
    }

    const object = objectRef.object;
    if (!object) {
      return {
        success: false,
        text: "You can't touch that.",
        audio: 'error',
      };
    }

    return {
      success: true,
      text:
        object.touchMessage ||
        object.description ||
        `You touch the ${object.name}.`,
      audio: null,
    };
  }

  async handleEat(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef || !this.gameState.hasItem(objectRef.value)) {
      return {
        success: false,
        text: "You don't have that.",
        audio: 'error',
      };
    }

    const item = this.gameState.getItem(objectRef.value);
    if (!item.edible) {
      return {
        success: false,
        text: "That's not edible.",
        audio: 'error',
      };
    }

    // Consume the item
    this.gameState.removeFromInventory(item.id);

    // Apply effects
    const changes = {};
    if (item.healthRestore) {
      const newHealth = Math.min(
        this.gameState.health + item.healthRestore,
        this.gameState.maxHealth
      );
      changes.health = newHealth;
    }

    return {
      success: true,
      text: item.eatMessage || `You eat the ${item.name}.`,
      audio: 'eat',
      stateChanges: changes,
    };
  }

  async handleDrink(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef || !this.gameState.hasItem(objectRef.value)) {
      return {
        success: false,
        text: "You don't have that.",
        audio: 'error',
      };
    }

    const item = this.gameState.getItem(objectRef.value);
    if (!item.drinkable) {
      return {
        success: false,
        text: "You can't drink that.",
        audio: 'error',
      };
    }

    // Consume the item
    this.gameState.removeFromInventory(item.id);

    // Apply effects
    const changes = {};
    if (item.healthRestore) {
      const newHealth = Math.min(
        this.gameState.health + item.healthRestore,
        this.gameState.maxHealth
      );
      changes.health = newHealth;
    }

    return {
      success: true,
      text: item.drinkMessage || `You drink the ${item.name}.`,
      audio: 'drink',
      stateChanges: changes,
    };
  }

  async handleWear(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: 'Wear what?',
        audio: 'error',
      };
    }

    // Use inventory system to wear item
    const result = this.inventory.wearItem(objectRef.value);

    if (result.success) {
      const item = this.gameState.getItem(objectRef.value);
      const scoreChange =
        item && item.wearPoints
          ? { score: this.gameState.score + item.wearPoints }
          : null;

      return {
        success: true,
        text: result.message,
        audio: 'wear',
        stateChanges: scoreChange,
      };
    }

    return {
      success: false,
      text: result.message,
      audio: 'error',
    };
  }

  async handleRemove(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: 'What do you want to remove?',
        audio: 'error',
      };
    }

    // Use inventory system to remove worn item
    const result = this.inventory.removeWornItem(objectRef.value);

    return {
      success: result.success,
      text: result.message,
      audio: result.success ? 'remove' : 'error',
    };
  }

  async handleWait(_command) {
    return {
      success: true,
      text: 'Time passes...',
      audio: 'clock',
      stateChanges: { turns: this.gameState.turns + 1 },
    };
  }

  async handleLoad(_command) {
    return {
      success: true,
      text: 'Loading games is not yet implemented.',
      audio: 'error',
    };
  }

  async handleQuit(_command) {
    return {
      success: true,
      text: 'Thanks for playing!',
      audio: 'goodbye',
      meta: { action: 'quit' },
    };
  }

  async handleRestart(_command) {
    return {
      success: true,
      text: 'Restarting game...',
      audio: 'restart',
      meta: { action: 'restart' },
    };
  }

  async handleScore(_command) {
    const score = this.gameState.score || 0;
    const maxScore = this.gameState.maxScore || 100;
    const moves = this.gameState.moves || 0;

    return {
      success: true,
      text: `Score: ${score} of ${maxScore} points in ${moves} moves.`,
      audio: null,
    };
  }
}
