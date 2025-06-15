/**
 * CommandExecutor - Executes parsed commands and updates game state
 *
 * This class bridges the gap between the parser and the game engine,
 * executing commands and returning appropriate responses.
 */

import logger from './logger.js';

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
   * @param {PuzzleSystem} puzzleSystem - Puzzle management system
   * @param {NPCSystem} npcSystem - NPC management system
   * @param {GameProgression} gameProgression - Game progression tracking
   */
  constructor(
    gameState,
    eventManager,
    viewManager,
    sceneRenderer,
    soundManager,
    inventory,
    interactionSystem,
    movementSystem,
    puzzleSystem,
    npcSystem,
    gameProgression
  ) {
    this.gameState = gameState;
    this.eventManager = eventManager;
    this.viewManager = viewManager;
    this.sceneRenderer = sceneRenderer;
    this.soundManager = soundManager;
    this.inventory = inventory;
    this.interactionSystem = interactionSystem;
    this.movementSystem = movementSystem;
    this.puzzleSystem = puzzleSystem;
    this.npcSystem = npcSystem;
    this.gameProgression = gameProgression;

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

    // Resolve aliases
    const resolvedVerb = this.resolveAlias(command.verb);
    const handler = this.handlers[resolvedVerb];

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
      logger.error('Command execution error:', error);
      return {
        success: false,
        text: 'Something went wrong. Please try again.',
        audio: 'error',
      };
    }
  }

  // Movement commands
  async handleGo(command) {
    const direction =
      command.directObject || command.resolvedDirectObject?.value;

    // Use MovementSystem for enhanced navigation
    const result = await this.movementSystem.movePlayer(direction);

    return {
      success: result.success,
      text: result.message,
      audio: result.success ? 'footsteps' : 'bump',
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
    if (!command.directObject) {
      return {
        success: false,
        text: 'Take what?',
        audio: 'error',
      };
    }

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
    const result = this.inventory.addItem(object.id);
    if (!result.success) {
      return {
        success: false,
        text: result.message || "You can't carry any more.",
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
    const result = this.inventory.removeItem(objectRef.value);
    if (result.success) {
      this.gameState.addToRoom(object.id);

      return {
        success: true,
        text: 'Dropped.',
        audio: 'drop',
      };
    }

    return {
      success: false,
      text: result.message || "You can't drop that.",
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
    if (object.hiddenDetails) {
      description += ' ' + object.hiddenDetails;
    }

    // Add extra details
    if (object.details) {
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

    // Check if player has the item
    if (!this.inventory.hasItem(objectRef.value)) {
      return {
        success: false,
        text: "You don't have that.",
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
      if (result.success && result.effects && result.effects.length > 0) {
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

    // Single object use - use interaction system
    const result = this.interactionSystem.useItemOn(objectRef.value, null);

    return {
      success: result.success,
      text: result.message,
      audio: result.success ? 'use' : 'error',
    };
  }

  async handleGive(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef || !this.inventory.hasItem(objectRef.value)) {
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
    if (!targetRef || targetRef.type !== 'NPC') {
      return {
        success: false,
        text: "They're not here.",
        audio: 'error',
      };
    }

    const npcId = targetRef.value;
    const npc = this.gameState.getNPC(npcId);
    const item = this.gameState.getItem(objectRef.value);

    if (!npc || !item) {
      return {
        success: false,
        text: 'Something went wrong.',
        audio: 'error',
      };
    }

    // Use NPCSystem to handle giving
    const giveResult = this.npcSystem.giveItem(npcId, item.id);

    if (giveResult.success) {
      // Remove from inventory
      this.inventory.removeItem(item.id);

      // Update score if applicable
      if (item.givePoints) {
        this.gameState.updateScore(item.givePoints);
      }

      // Update relationship
      const relationshipChange = giveResult.relationshipChange || 10;
      this.npcSystem.updateRelationship(npcId, relationshipChange);

      // Play appropriate sound
      this.soundManager.playSoundEffect(
        giveResult.accepted ? 'give_accept' : 'give'
      );

      return {
        success: true,
        text: giveResult.message || `You give the ${item.name} to ${npc.name}.`,
        audio: 'give',
        stateChanges: giveResult.stateChanges,
      };
    }

    // NPC refuses the item
    return {
      success: false,
      text: giveResult.message || `${npc.name} doesn't want the ${item.name}.`,
      audio: 'error',
    };
  }

  async handlePut(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef || !this.inventory.hasItem(objectRef.value)) {
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
    if (!target || !target.isContainer) {
      return {
        success: false,
        text: "You can't put anything in that.",
        audio: 'error',
      };
    }

    // Check if container is open
    const isOpen =
      this.gameState.getObjectState(target.id, 'open') ||
      target.open ||
      target.isOpen;
    if (!isOpen && target.openable !== false) {
      // Some containers might not need to be opened
      return {
        success: false,
        text: `The ${target.name} is closed.`,
        audio: 'error',
      };
    }

    // Use inventory system to put item in container
    const result = this.inventory.putInContainer(
      objectRef.value,
      targetRef.value
    );

    return {
      success: result.success,
      text: result.message,
      audio: result.success ? 'put' : 'error',
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
    if (
      !object.canOpen &&
      object.type !== 'container' &&
      object.type !== 'door'
    ) {
      return {
        success: false,
        text: "That's not something you can open.",
        audio: 'error',
      };
    }

    // Check if already open
    if (object.isOpen || object.open) {
      return {
        success: false,
        text: "It's already open.",
        audio: 'error',
      };
    }

    // Check if locked
    if (object.isLocked || object.locked) {
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
    if (
      !object.canOpen &&
      object.type !== 'container' &&
      object.type !== 'door'
    ) {
      return {
        success: false,
        text: "That's not something you can close.",
        audio: 'error',
      };
    }

    // Check if already closed
    if (!object.isOpen && !object.open) {
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

    // Check if we have an indirect object (the key)
    if (command.indirectObject && command.resolvedIndirectObject) {
      const keyId = command.resolvedIndirectObject.value;
      const objectId = objectRef.value;

      // Use interaction system
      const result = this.interactionSystem.unlockObject(objectId, keyId);
      return {
        success: result.success,
        text: result.message,
        audio: result.success ? 'unlock' : 'error',
        stateChanges:
          result.success && result.scoreIncrease
            ? { score: this.gameState.score + result.scoreIncrease }
            : null,
      };
    }

    // No key specified
    return {
      success: false,
      text: 'Unlock it with what?',
      audio: 'error',
    };
  }

  async handleTalk(command) {
    if (!command.directObject) {
      return {
        success: false,
        text: 'Who do you want to talk to?',
        audio: 'error',
      };
    }

    const npcRef = command.resolvedDirectObject;
    if (!npcRef || npcRef.type !== 'NPC') {
      return {
        success: false,
        text: "You can't talk to that.",
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

    // Check if we have an NPC system
    if (this.npcSystem && this.npcSystem.startConversation) {
      const result = this.npcSystem.startConversation(npcRef.value);
      return {
        success: result.success,
        text: result.message,
        audio: result.success ? 'talk' : 'error',
      };
    }

    // Fallback to simple dialogue
    const dialogue = npc.defaultDialogue || `${npc.name} has nothing to say.`;

    return {
      success: true,
      text: dialogue,
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

    const npcId = npcRef.value;
    const npc = this.gameState.getNPC(npcId);
    if (!npc) {
      return {
        success: false,
        text: "They're not here.",
        audio: 'error',
      };
    }

    const topic = command.directObject || 'general';

    // Use NPCSystem for dialogue
    const dialogueResult = this.npcSystem.startDialogue(npcId, topic);

    if (dialogueResult.success) {
      // Update relationship based on topic
      if (topic === 'help' || topic === 'quest') {
        this.npcSystem.updateRelationship(npcId, 5);
      }

      // Check if this reveals new information
      if (dialogueResult.revealsFlag) {
        this.gameState.setFlag(dialogueResult.revealsFlag, true);
      }

      // Check if this gives an item
      if (dialogueResult.givesItem) {
        this.inventory.addItem(dialogueResult.givesItem);
      }

      // Play appropriate sound
      const mood = dialogueResult.mood || 'neutral';
      this.soundManager.playSoundEffect(`npc_${mood}`);

      return {
        success: true,
        text: `${npc.name}: "${dialogueResult.text}"`,
        audio: 'talk',
        stateChanges: dialogueResult.stateChanges,
      };
    }

    // Fallback to basic topic system if NPCSystem doesn't have dialogue
    if (npc.topics && npc.topics[topic]) {
      return {
        success: true,
        text: `${npc.name}: "${npc.topics[topic]}"`,
        audio: 'talk',
      };
    }

    // Default response
    const defaultResponses = [
      "I don't know about that.",
      "That's not something I can help with.",
      "I'm not sure what you mean.",
      'Perhaps you should ask someone else.',
    ];

    const response =
      defaultResponses[Math.floor(Math.random() * defaultResponses.length)];

    return {
      success: true,
      text: `${npc.name}: "${response}"`,
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
        text: 'Push what?',
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

    // Check if object is pushable
    if (!object.pushable) {
      return {
        success: false,
        text: object.notPushableMessage || "It won't budge.",
        audio: 'error',
      };
    }

    // Check if already pushed
    const alreadyPushed = this.gameState.getObjectState(object.id, 'pushed');
    if (alreadyPushed && !object.repeatablePush) {
      return {
        success: false,
        text:
          object.alreadyPushedMessage ||
          "You've already moved it as far as it will go.",
        audio: null,
      };
    }

    // Push the object
    this.gameState.setObjectState(object.id, 'pushed', true);

    // Handle any push effects
    if (object.pushEffects) {
      for (const effect of object.pushEffects) {
        if (effect.type === 'revealExit') {
          this.gameState.setExitState(effect.roomId, effect.direction, {
            enabled: true,
          });
        } else if (effect.type === 'revealObject') {
          const hiddenObject = this.gameState.getObject(effect.objectId);
          if (hiddenObject) {
            hiddenObject.hidden = false;
          }
        } else if (effect.type === 'setFlag') {
          this.gameState.setFlag(
            effect.flag,
            effect.value !== undefined ? effect.value : true
          );
        }
      }
    }

    // Trigger any associated events
    if (object.pushEvent) {
      await this.eventManager.triggerEvent(object.pushEvent, {
        object: object.id,
      });
    }

    // Play sound effect
    this.soundManager.playSoundEffect('furniture_push');

    return {
      success: true,
      text: object.pushMessage || `You push the ${object.name}.`,
      audio: 'push',
      stateChanges: { objectStates: { [object.id]: { pushed: true } } },
    };
  }

  async handlePull(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: 'Pull what?',
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

    // Check if object is pullable
    if (!object.pullable) {
      return {
        success: false,
        text: object.notPullableMessage || "It won't move.",
        audio: 'error',
      };
    }

    // Check if already pulled
    const alreadyPulled = this.gameState.getObjectState(object.id, 'pulled');
    if (alreadyPulled && !object.repeatablePull) {
      return {
        success: false,
        text:
          object.alreadyPulledMessage ||
          "You've already pulled it as far as it will go.",
        audio: null,
      };
    }

    // Pull the object
    this.gameState.setObjectState(object.id, 'pulled', true);

    // Handle any pull effects
    if (object.pullEffects) {
      for (const effect of object.pullEffects) {
        if (effect.type === 'revealItem') {
          this.gameState.addToRoom(effect.itemId);
        } else if (effect.type === 'openExit') {
          this.gameState.setExitState(effect.roomId, effect.direction, {
            enabled: true,
          });
        } else if (effect.type === 'setFlag') {
          this.gameState.setFlag(
            effect.flag,
            effect.value !== undefined ? effect.value : true
          );
        } else if (effect.type === 'breakObject') {
          // Object breaks when pulled
          this.gameState.setObjectState(object.id, 'broken', true);
        }
      }
    }

    // Trigger any associated events
    if (object.pullEvent) {
      await this.eventManager.triggerEvent(object.pullEvent, {
        object: object.id,
      });
    }

    // Play sound effect
    const soundEffect = object.pullSound || 'lever_pull';
    this.soundManager.playSoundEffect(soundEffect);

    return {
      success: true,
      text: object.pullMessage || `You pull the ${object.name}.`,
      audio: 'pull',
      stateChanges: { objectStates: { [object.id]: { pulled: true } } },
    };
  }

  async handleTurn(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: 'Turn what?',
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

    // Check if object is turnable
    if (!object.turnable) {
      return {
        success: false,
        text: object.notTurnableMessage || "It doesn't turn.",
        audio: 'error',
      };
    }

    // Get current state
    const currentState =
      this.gameState.getObjectState(object.id, 'turnState') || 0;
    const maxStates = object.turnStates || 2; // Default to on/off
    const newState = (currentState + 1) % maxStates;

    // Update state
    this.gameState.setObjectState(object.id, 'turnState', newState);
    this.gameState.setObjectState(object.id, 'turned', newState > 0);

    // Handle turn effects based on new state
    if (object.turnEffects && object.turnEffects[newState]) {
      const effects = object.turnEffects[newState];
      for (const effect of effects) {
        if (effect.type === 'power') {
          // Turn power on/off for connected objects
          if (effect.targets) {
            effect.targets.forEach((targetId) => {
              this.gameState.setObjectState(targetId, 'powered', effect.value);
            });
          }
        } else if (effect.type === 'openValve') {
          // Control flow (water, gas, etc)
          this.gameState.setFlag(effect.flag, effect.value);
        } else if (effect.type === 'setFlag') {
          this.gameState.setFlag(effect.flag, effect.value);
        } else if (effect.type === 'playSound') {
          this.soundManager.playSoundEffect(effect.sound);
        }
      }
    }

    // Get appropriate message
    let message = object.turnMessage;
    if (!message && object.turnMessages && object.turnMessages[newState]) {
      message = object.turnMessages[newState];
    } else if (!message) {
      message = `You turn the ${object.name}.`;
    }

    // Trigger any associated events
    if (object.turnEvent) {
      await this.eventManager.triggerEvent(object.turnEvent, {
        object: object.id,
        state: newState,
      });
    }

    // Play sound effect
    const soundEffect = object.turnSound || 'dial_turn';
    this.soundManager.playSoundEffect(soundEffect);

    return {
      success: true,
      text: message,
      audio: 'turn',
      stateChanges: {
        objectStates: {
          [object.id]: {
            turnState: newState,
            turned: newState > 0,
          },
        },
      },
    };
  }

  async handleTouch(command) {
    const objectRef = command.resolvedDirectObject;
    if (!objectRef) {
      return {
        success: false,
        text: 'Touch what?',
        audio: 'error',
      };
    }

    const object = objectRef.object;
    const item = objectRef.item;
    const target = object || item;

    if (!target) {
      return {
        success: false,
        text: "You can't touch that.",
        audio: 'error',
      };
    }

    // Mark as touched
    this.gameState.setObjectState(target.id, 'touched', true);

    // Handle touch effects
    if (target.touchEffects) {
      for (const effect of target.touchEffects) {
        if (effect.type === 'damage') {
          // Object causes damage when touched
          const currentHealth = this.gameState.health;
          this.gameState.health = Math.max(0, currentHealth - effect.amount);
          if (this.gameState.health === 0) {
            // Player dies
            await this.eventManager.triggerEvent('player_death', {
              cause: 'touch',
            });
          }
        } else if (effect.type === 'sticky') {
          // Object sticks to player
          if (object) {
            this.gameState.setObjectState(object.id, 'stuckToPlayer', true);
          }
        } else if (effect.type === 'electric') {
          // Electric shock
          this.soundManager.playSoundEffect('electric_shock');
        } else if (effect.type === 'temperature') {
          // Hot or cold
          if (effect.value === 'hot') {
            this.soundManager.playSoundEffect('sizzle');
          } else if (effect.value === 'cold') {
            this.soundManager.playSoundEffect('freeze');
          }
        } else if (effect.type === 'setFlag') {
          this.gameState.setFlag(effect.flag, effect.value);
        }
      }
    }

    // Trigger any touch events
    if (target.touchEvent) {
      await this.eventManager.triggerEvent(target.touchEvent, {
        object: target.id,
      });
    }

    // Get appropriate message
    let message = target.touchMessage;
    if (!message) {
      // Generate contextual message
      if (target.texture) {
        message = `It feels ${target.texture}.`;
      } else if (target.temperature) {
        message = `It feels ${target.temperature}.`;
      } else {
        message = `You touch the ${target.name}.`;
      }
    }

    return {
      success: true,
      text: message,
      audio: target.touchSound || null,
      stateChanges: {
        objectStates: {
          [target.id]: { touched: true },
        },
      },
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
    // Trigger wait event if event manager has this method
    if (this.eventManager.triggerEvent) {
      await this.eventManager.triggerEvent('wait');
    }

    return {
      success: true,
      text: 'Time passes...',
      audio: 'clock',
      stateChanges: { turns: this.gameState.turns + 1 },
    };
  }

  async handleLoad(command) {
    if (!command.directObject) {
      // Show available saves from browser storage
      const saves = this.gameState.getSaveFiles();
      if (saves.length === 0) {
        return {
          success: true,
          text: 'No saved games found.\nTo load: load <name>\nTo load from file: Use the menu.',
          audio: null,
        };
      }

      const saveList = saves
        .map((save) => {
          const date = new Date(save.timestamp).toLocaleString();
          return `${save.key.replace('somnium_save_', '')} - ${save.title} (${date}, Score: ${save.score})`;
        })
        .join('\n');

      return {
        success: true,
        text: `Available saves:\n${saveList}\n\nTo load: load <name>`,
        audio: null,
      };
    }

    // Load from browser storage
    const saveName = command.directObject;
    const loaded = this.gameState.loadFromStorage(saveName);

    if (loaded) {
      // Need to re-render the current room after loading
      window.dispatchEvent(
        new CustomEvent('roomChanged', {
          detail: { roomId: this.gameState.currentRoomId },
        })
      );

      return {
        success: true,
        text: `Game loaded from '${saveName}'.`,
        audio: 'success',
        meta: { action: 'load' },
      };
    }

    return {
      success: false,
      text: `Failed to load save '${saveName}'.`,
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
      shouldRestart: true,
    };
  }

  async handleScore(_command) {
    // Check if we have a game progression system
    if (this.gameProgression) {
      const score = this.gameProgression.getScore();
      const maxScore = this.gameProgression.getMaxScore();
      const moves = this.gameState.moves || 0;

      return {
        success: true,
        text: `Score: ${score} out of ${maxScore} points in ${moves} moves.`,
        audio: null,
      };
    }

    // Fallback to basic score tracking
    const score = this.gameState.score || 0;
    const maxScore = this.gameState.maxScore || 100;
    const moves = this.gameState.moves || 0;

    return {
      success: true,
      text: `Score: ${score} of ${maxScore} points in ${moves} moves.`,
      audio: null,
    };
  }

  async handleInventory(_command) {
    const items = this.inventory.listItems();

    if (items.length === 0) {
      return {
        success: true,
        text: "You aren't carrying anything.",
        audio: null,
      };
    }

    const weight = this.inventory.getTotalWeight();
    const maxWeight = this.inventory.getMaxWeight();

    let text = 'You are carrying:\n';
    for (const itemId of items) {
      const item = this.gameState.getItem(itemId);
      if (item) {
        text += `  - ${item.name}\n`;
      }
    }
    text += `\nWeight: ${weight}/${maxWeight} lbs`;

    return {
      success: true,
      text: text.trim(),
      audio: null,
    };
  }

  async handleHelp(command) {
    if (command.directObject) {
      // Command-specific help
      const verb = command.directObject;
      const helpText = this.getCommandHelp(verb);

      if (helpText) {
        return {
          success: true,
          text: helpText,
          audio: null,
        };
      }

      return {
        success: false,
        text: `No help available for '${verb}'.`,
        audio: 'error',
      };
    }

    // General help
    const commands = [
      'look',
      'examine',
      'take',
      'drop',
      'use',
      'inventory',
      'go',
      'enter',
      'exit',
      'open',
      'close',
      'unlock',
      'talk',
      'ask',
      'tell',
      'give',
      'wear',
      'remove',
      'eat',
      'drink',
      'wait',
      'save',
      'load',
      'quit',
      'restart',
      'score',
      'help',
    ];

    return {
      success: true,
      text: `Available commands:\n${commands.join(', ')}\n\nType 'help <command>' for specific help.`,
      audio: null,
    };
  }

  async handleSave(command) {
    // If no name provided, save to file
    if (!command.directObject) {
      const saved = await this.gameState.saveGame();

      if (saved) {
        return {
          success: true,
          text: 'Game saved to file.\nTo save with a name: save <name>',
          audio: 'success',
        };
      }

      return {
        success: false,
        text: 'Failed to save game.',
        audio: 'error',
      };
    }

    // Save to browser storage with name
    const saveName = command.directObject;
    const saved = this.gameState.saveToStorage(saveName);

    if (saved) {
      return {
        success: true,
        text: `Game saved as '${saveName}'.`,
        audio: 'success',
      };
    }

    return {
      success: false,
      text: 'Failed to save game.',
      audio: 'error',
    };
  }

  getCommandHelp(verb) {
    const helpTexts = {
      look: 'look [at <object>] - examine your surroundings or a specific object',
      examine: 'examine <object> - look closely at something',
      take: 'take <object> - pick up an object',
      drop: "drop <object> - drop something you're carrying",
      use: 'use <item> [on <target>] - use an item',
      inventory: "inventory - list what you're carrying",
      go: 'go <direction> - move in a direction (north, south, east, west, etc.)',
      open: 'open <object> - open a door or container',
      close: 'close <object> - close a door or container',
      unlock: 'unlock <object> [with <key>] - unlock something',
      talk: 'talk to <person> - start a conversation',
      give: 'give <item> to <person> - give something to someone',
      save: 'save [name] - save your game',
      load: 'load <name> - load a saved game',
      quit: 'quit - exit the game',
      help: 'help [command] - show help',
    };

    return helpTexts[verb];
  }

  // Support for command aliases
  resolveAlias(verb) {
    const aliases = {
      i: 'inventory',
      inv: 'inventory',
      l: 'look',
      x: 'examine',
      get: 'take',
      grab: 'take',
      pickup: 'take',
      n: 'go north',
      s: 'go south',
      e: 'go east',
      w: 'go west',
      ne: 'go northeast',
      nw: 'go northwest',
      se: 'go southeast',
      sw: 'go southwest',
      u: 'go up',
      d: 'go down',
      in: 'enter',
      out: 'exit',
    };

    return aliases[verb] || verb;
  }
}
