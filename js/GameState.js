/**
 * GameState - Centralized storage for all game state data
 *
 * Responsibilities:
 * - Store world resources (rooms, items, etc.)
 * - Track dynamic state (inventory, flags)
 * - Provide query interface for game data
 * - Handle state serialization/deserialization
 */

import logger from './logger.js';

export class GameState extends EventTarget {
  constructor() {
    super();

    // Static game data (from AI generation)
    this.gameJSON = null;
    this.rooms = {};
    this.items = {};
    this.objects = {};
    this.puzzles = [];
    this.vocabulary = {};

    // Dynamic game state
    this.currentRoomId = null;
    this.inventory = [];
    this.maxInventorySize = 10;
    this.maxCarryWeight = 100;
    this.flags = {};
    this.objectStates = {};
    this.exitStates = {};
    this.score = 0;
    this.maxScore = 100;
    this.moves = 0;
    this.turns = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.worn = {};

    // State history for undo (optional feature)
    this.stateHistory = [];
    this.maxHistorySize = 10;

    // State validation schema
    this.validators = {
      rooms: this.validateRooms.bind(this),
      items: this.validateItems.bind(this),
      state: this.validateState.bind(this),
    };
  }

  /**
   * Initialize state from generated game data
   * @param {Object} gameJSON - Complete game data from AI
   * @throws {Error} If validation fails
   */
  loadResources(gameJSON) {
    logger.info('Loading game resources...');

    this.gameJSON = gameJSON;
    this.rooms = gameJSON.rooms || {};
    this.items = gameJSON.items || {};
    this.objects = gameJSON.objects || {};
    this.puzzles = gameJSON.puzzles || [];
    this.vocabulary = gameJSON.vocabulary || {};

    // Validate loaded data
    const validation = this.validateAll();
    if (!validation.valid) {
      console.error('Game data validation failed:', validation.errors);
      throw new Error('Invalid game data: ' + validation.errors.join(', '));
    }

    // Set initial room
    this.currentRoomId = gameJSON.startRoom || Object.keys(this.rooms)[0];

    // Initialize flags from puzzle definitions
    this.initializeFlags();

    // Save initial state for undo functionality
    this.saveStateSnapshot();

    // Dispatch loaded event
    this.dispatchEvent(
      new CustomEvent('resourcesLoaded', {
        detail: {
          rooms: Object.keys(this.rooms).length,
          items: Object.keys(this.items).length,
          puzzles: this.puzzles.length,
        },
      })
    );
  }

  /**
   * Get current room object
   * @returns {Object} Current room data
   */
  getCurrentRoom() {
    return this.rooms[this.currentRoomId] || null;
  }

  /**
   * Change current room
   * @param {string} roomId - ID of room to move to
   * @returns {boolean} Success
   */
  changeRoom(roomId) {
    if (this.rooms[roomId]) {
      const previousRoom = this.currentRoomId;
      this.currentRoomId = roomId;
      this.moves++;

      // Dispatch room change event
      this.dispatchEvent(
        new CustomEvent('roomChange', {
          detail: {
            previousRoom,
            currentRoom: roomId,
            room: this.rooms[roomId],
          },
        })
      );

      return true;
    }
    return false;
  }

  /**
   * Get player inventory
   * @returns {Array<string>} Array of item IDs
   */
  getInventory() {
    return [...this.inventory]; // Return copy
  }

  /**
   * Check if player has specific item
   * @param {string} itemId - Item ID to check
   * @returns {boolean} Whether player has item
   */
  hasItem(itemId) {
    return this.inventory.includes(itemId);
  }

  /**
   * Add item to inventory
   * @param {string} itemId - Item ID to add
   * @returns {boolean} Success
   */
  addItem(itemId) {
    if (this.items[itemId] && !this.hasItem(itemId)) {
      this.inventory.push(itemId);
      this.saveStateSnapshot();

      // Dispatch inventory change event
      this.dispatchEvent(
        new CustomEvent('inventoryChange', {
          detail: {
            action: 'add',
            itemId,
            item: this.items[itemId],
            inventory: [...this.inventory],
          },
        })
      );

      return true;
    }
    return false;
  }

  /**
   * Remove item from inventory
   * @param {string} itemId - Item ID to remove
   * @returns {boolean} Success
   */
  removeItem(itemId) {
    const index = this.inventory.indexOf(itemId);
    if (index > -1) {
      this.inventory.splice(index, 1);
      this.saveStateSnapshot();

      // Dispatch inventory change event
      this.dispatchEvent(
        new CustomEvent('inventoryChange', {
          detail: {
            action: 'remove',
            itemId,
            item: this.items[itemId],
            inventory: [...this.inventory],
          },
        })
      );

      return true;
    }
    return false;
  }

  /**
   * Get game flag value
   * @param {string} flagName - Flag name
   * @returns {*} Flag value (any type)
   */
  getFlag(flagName) {
    return this.flags[flagName];
  }

  /**
   * Set game flag value
   * @param {string} flagName - Flag name
   * @param {*} value - Value to set
   */
  setFlag(flagName, value) {
    const previousValue = this.flags[flagName];
    this.flags[flagName] = value;
    this.saveStateSnapshot();

    // Dispatch flag change event
    this.dispatchEvent(
      new CustomEvent('flagChange', {
        detail: {
          flag: flagName,
          previousValue,
          value,
          flags: { ...this.flags },
        },
      })
    );
  }

  /**
   * Get object data by ID
   * @param {string} objectId - Object ID
   * @returns {Object|null} Object data or null
   */
  getObject(objectId) {
    // Check room objects first
    const currentRoom = this.getCurrentRoom();
    if (currentRoom && currentRoom.objects) {
      const roomObject = currentRoom.objects[objectId];
      if (roomObject) return roomObject;
    }

    // Then check global objects
    return this.objects[objectId] || null;
  }

  /**
   * Get item data by ID
   * @param {string} itemId - Item ID
   * @returns {Object|null} Item data or null
   */
  getItem(itemId) {
    return this.items[itemId] || null;
  }

  /**
   * Update score
   * @param {number} points - Points to add (can be negative)
   */
  updateScore(points) {
    const previousScore = this.score;
    this.score = Math.max(0, this.score + points);

    // Dispatch score change event
    this.dispatchEvent(
      new CustomEvent('scoreChange', {
        detail: {
          previousScore,
          score: this.score,
          change: points,
        },
      })
    );
  }

  /**
   * Create saveable state snapshot
   * @returns {Object} State object for save file
   */
  serialize() {
    return {
      currentRoomId: this.currentRoomId,
      inventory: [...this.inventory],
      flags: { ...this.flags },
      score: this.score,
      moves: this.moves,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Restore from saved state
   * @param {Object} state - Saved state object
   */
  deserialize(state) {
    if (!state) return;

    this.currentRoomId = state.currentRoomId || this.currentRoomId;
    this.inventory = state.inventory || [];
    this.flags = state.flags || {};
    this.score = state.score || 0;
    this.moves = state.moves || 0;
  }

  /**
   * Initialize flags from puzzle definitions
   * @private
   */
  initializeFlags() {
    // Set default flags from puzzles
    if (this.puzzles) {
      this.puzzles.forEach((puzzle) => {
        if (puzzle.flags) {
          Object.entries(puzzle.flags).forEach(([flag, defaultValue]) => {
            if (!(flag in this.flags)) {
              this.flags[flag] = defaultValue;
            }
          });
        }
      });
    }

    // Add standard flags
    this.flags.gameStarted = true;
    this.flags.debugMode = false;
  }

  /**
   * Save current state to history (for undo feature)
   * @private
   */
  saveStateSnapshot() {
    const snapshot = this.serialize();

    this.stateHistory.push(snapshot);

    // Limit history size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Undo last action
   * @returns {boolean} Success
   */
  undo() {
    if (this.stateHistory.length > 1) {
      // Remove current state
      this.stateHistory.pop();

      // Restore previous state
      const previousState = this.stateHistory[this.stateHistory.length - 1];
      this.deserialize(previousState);

      return true;
    }
    return false;
  }

  /**
   * Get all rooms
   * @returns {Object} Room dictionary
   */
  getAllRooms() {
    return this.rooms;
  }

  /**
   * Get all items
   * @returns {Object} Item dictionary
   */
  getAllItems() {
    return this.items;
  }

  /**
   * Get vocabulary data
   * @returns {Object} Vocabulary configuration
   */
  getVocabulary() {
    return this.vocabulary;
  }

  /**
   * Check if exit is available
   * @param {string} direction - Exit direction (north, south, etc.)
   * @returns {boolean} Whether exit exists and is enabled
   */
  canExit(direction) {
    const currentRoom = this.getCurrentRoom();
    if (!currentRoom || !currentRoom.exits) return false;

    const exit = currentRoom.exits[direction];
    return exit ? exit.enabled : false;
  }

  /**
   * Get room ID for exit
   * @param {string} direction - Exit direction
   * @returns {string|null} Room ID or null
   */
  getExitRoom(direction) {
    const currentRoom = this.getCurrentRoom();
    if (!currentRoom || !currentRoom.exits) return null;

    const exit = currentRoom.exits[direction];
    return exit && exit.enabled ? exit.roomId : null;
  }

  /**
   * Validate room data structure
   * @param {Object} rooms - Rooms object to validate
   * @returns {Object} Validation result {valid: boolean, errors: Array}
   */
  validateRooms(rooms) {
    const errors = [];

    if (!rooms || typeof rooms !== 'object') {
      errors.push('Rooms must be an object');
      return { valid: false, errors };
    }

    Object.entries(rooms).forEach(([roomId, room]) => {
      // Check required fields
      if (!room.name) errors.push(`Room ${roomId} missing name`);
      if (!room.description) errors.push(`Room ${roomId} missing description`);
      if (!room.graphics) errors.push(`Room ${roomId} missing graphics`);

      // Validate exits
      if (room.exits) {
        Object.entries(room.exits).forEach(([direction, exit]) => {
          if (!exit.roomId) {
            errors.push(`Room ${roomId} exit ${direction} missing roomId`);
          }
          if (!rooms[exit.roomId]) {
            errors.push(
              `Room ${roomId} exit ${direction} points to non-existent room ${exit.roomId}`
            );
          }
        });
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate item data structure
   * @param {Object} items - Items object to validate
   * @returns {Object} Validation result
   */
  validateItems(items) {
    const errors = [];

    if (!items || typeof items !== 'object') {
      return { valid: true, errors }; // Items are optional
    }

    Object.entries(items).forEach(([itemId, item]) => {
      if (!item.name) errors.push(`Item ${itemId} missing name`);
      if (!item.description) errors.push(`Item ${itemId} missing description`);
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate save state structure
   * @param {Object} state - State object to validate
   * @returns {Object} Validation result
   */
  validateState(state) {
    const errors = [];

    if (!state || typeof state !== 'object') {
      errors.push('State must be an object');
      return { valid: false, errors };
    }

    // Check required fields
    if (!state.currentRoomId) errors.push('State missing currentRoomId');
    if (!Array.isArray(state.inventory))
      errors.push('State inventory must be an array');
    if (typeof state.score !== 'number')
      errors.push('State score must be a number');
    if (typeof state.moves !== 'number')
      errors.push('State moves must be a number');

    // Validate room exists
    if (state.currentRoomId && !this.rooms[state.currentRoomId]) {
      errors.push(`State references non-existent room ${state.currentRoomId}`);
    }

    // Validate inventory items exist
    if (state.inventory) {
      state.inventory.forEach((itemId) => {
        if (!this.items[itemId]) {
          errors.push(`State inventory contains non-existent item ${itemId}`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate all game data
   * @returns {Object} Combined validation result
   */
  validateAll() {
    const results = {
      rooms: this.validateRooms(this.rooms),
      items: this.validateItems(this.items),
      valid: true,
      errors: [],
    };

    // Combine all errors
    Object.values(results).forEach((result) => {
      if (result.errors) {
        results.errors.push(...result.errors);
        if (!result.valid) results.valid = false;
      }
    });

    return results;
  }

  /**
   * Get room by ID
   * @param {string} roomId - Room ID
   * @returns {Object|null} Room object or null
   */
  getRoom(roomId) {
    return this.rooms[roomId] || null;
  }

  /**
   * Set current room
   * @param {string} roomId - Room ID to set as current
   */
  setCurrentRoom(roomId) {
    if (this.rooms[roomId]) {
      this.changeRoom(roomId);
    }
  }

  /**
   * Get total weight of inventory items
   * @returns {number} Total weight
   */
  getInventoryWeight() {
    return this.inventory.reduce((total, itemId) => {
      const item = this.getItem(itemId);
      return total + (item?.weight || 0);
    }, 0);
  }

  /**
   * Get maximum carry weight
   * @returns {number} Max weight
   */
  getMaxCarryWeight() {
    return this.maxCarryWeight;
  }

  /**
   * Add item to inventory (alias for addItem)
   * @param {string} itemId - Item ID
   */
  addToInventory(itemId) {
    this.addItem(itemId);
  }

  /**
   * Remove item from inventory (alias for removeItem)
   * @param {string} itemId - Item ID
   */
  removeFromInventory(itemId) {
    this.removeItem(itemId);
  }

  /**
   * Remove item from current room
   * @param {string} itemId - Item ID
   */
  removeFromRoom(itemId) {
    const room = this.getCurrentRoom();
    if (room && room.items) {
      const index = room.items.indexOf(itemId);
      if (index > -1) {
        room.items.splice(index, 1);
      }
    }
  }

  /**
   * Add item to current room
   * @param {string} itemId - Item ID
   */
  addToRoom(itemId) {
    const room = this.getCurrentRoom();
    if (room) {
      if (!room.items) room.items = [];
      if (!room.items.includes(itemId)) {
        room.items.push(itemId);
      }
    }
  }

  /**
   * Get NPC by ID
   * @param {string} npcId - NPC ID
   * @returns {Object|null} NPC object or null
   */
  getNPC(npcId) {
    // Check current room NPCs
    const room = this.getCurrentRoom();
    if (room && room.npcs && room.npcs[npcId]) {
      return room.npcs[npcId];
    }
    // Check global NPCs
    return this.objects[npcId] || null;
  }

  /**
   * Set object state
   * @param {string} objectId - Object ID
   * @param {string} stateKey - State key (e.g., 'examined', 'open')
   * @param {*} value - State value
   */
  setObjectState(objectId, stateKey, value) {
    if (!this.objectStates[objectId]) {
      this.objectStates[objectId] = {};
    }
    this.objectStates[objectId][stateKey] = value;
  }

  /**
   * Get object state
   * @param {string} objectId - Object ID
   * @param {string} stateKey - State key
   * @returns {*} State value
   */
  getObjectState(objectId, stateKey) {
    return this.objectStates[objectId]?.[stateKey];
  }

  /**
   * Get exit state
   * @param {string} roomId - Room ID
   * @param {string} direction - Exit direction
   * @returns {Object|null} Exit state
   */
  getExitState(roomId, direction) {
    const key = `${roomId}:${direction}`;
    return this.exitStates[key] || null;
  }

  /**
   * Set exit state
   * @param {string} roomId - Room ID
   * @param {string} direction - Exit direction
   * @param {Object} state - Exit state
   */
  setExitState(roomId, direction, state) {
    const key = `${roomId}:${direction}`;
    this.exitStates[key] = state;
  }

  /**
   * Create a complete snapshot of current state
   * @returns {Object} Complete state snapshot
   */
  createSnapshot() {
    return {
      currentRoomId: this.currentRoomId,
      inventory: [...this.inventory],
      worn: { ...this.worn },
      flags: { ...this.flags },
      objectStates: JSON.parse(JSON.stringify(this.objectStates)),
      exitStates: JSON.parse(JSON.stringify(this.exitStates)),
      score: this.score,
      moves: this.moves,
      turns: this.turns,
      health: this.health,
      timestamp: Date.now(),
    };
  }

  /**
   * Create a complete save file
   * @returns {Object} Save file object
   */
  createSaveFile() {
    return {
      version: 1,
      resources: {
        gameJSON: this.gameJSON,
        rooms: this.rooms,
        items: this.items,
        objects: this.objects,
        puzzles: this.puzzles,
        vocabulary: this.vocabulary,
      },
      state: {
        currentRoom: this.currentRoomId,
        inventory: [...this.inventory],
        worn: { ...this.worn },
        flags: { ...this.flags },
        objectStates: JSON.parse(JSON.stringify(this.objectStates)),
        exitStates: JSON.parse(JSON.stringify(this.exitStates)),
        score: this.score,
        maxScore: this.maxScore,
        moves: this.moves,
        turns: this.turns,
        health: this.health,
        maxHealth: this.maxHealth,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Save game to file
   * @param {string} filename - Optional filename
   * @returns {Promise<boolean>} Success
   */
  async saveGame(filename) {
    try {
      const saveData = this.createSaveFile();
      const jsonStr = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });

      // Generate filename if not provided
      if (!filename) {
        const title = saveData.resources.gameJSON?.plot?.title || 'Somnium';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.somnium.json`;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Dispatch save event
      this.dispatchEvent(
        new CustomEvent('gameSaved', {
          detail: { filename, timestamp: new Date().toISOString() },
        })
      );

      return true;
    } catch (error) {
      console.error('Save game error:', error);
      return false;
    }
  }

  /**
   * Load game from save file object
   * @param {Object} saveData - Save file data
   * @returns {boolean} Success
   */
  loadFromSaveData(saveData) {
    try {
      // Validate version
      if (saveData.version !== 1) {
        throw new Error(`Unsupported save file version: ${saveData.version}`);
      }

      // Validate structure
      if (!saveData.resources || !saveData.state) {
        throw new Error('Invalid save file structure');
      }

      // Load resources
      const { resources, state } = saveData;
      this.gameJSON = resources.gameJSON || null;
      this.rooms = resources.rooms || {};
      this.items = resources.items || {};
      this.objects = resources.objects || {};
      this.puzzles = resources.puzzles || [];
      this.vocabulary = resources.vocabulary || {};

      // Apply state
      this.currentRoomId = state.currentRoom || null;
      this.inventory = state.inventory || [];
      this.worn = state.worn || {};
      this.flags = state.flags || {};
      this.objectStates = state.objectStates || {};
      this.exitStates = state.exitStates || {};
      this.score = state.score || 0;
      this.maxScore = state.maxScore || 100;
      this.moves = state.moves || 0;
      this.turns = state.turns || 0;
      this.health = state.health || 100;
      this.maxHealth = state.maxHealth || 100;

      // Clear history on load
      this.stateHistory = [];
      this.saveStateSnapshot();

      // Dispatch load event
      this.dispatchEvent(
        new CustomEvent('gameLoaded', {
          detail: {
            title: resources.gameJSON?.plot?.title || 'Unknown',
            timestamp: state.timestamp,
          },
        })
      );

      return true;
    } catch (error) {
      console.error('Load game error:', error);
      this.dispatchEvent(
        new CustomEvent('loadError', {
          detail: { error: error.message },
        })
      );
      return false;
    }
  }

  /**
   * Load game from file
   * @param {File} file - File object from input
   * @returns {Promise<boolean>} Success
   */
  async loadGame(file) {
    try {
      const text = await file.text();
      const saveData = JSON.parse(text);
      return this.loadFromSaveData(saveData);
    } catch (error) {
      console.error('Load game file error:', error);
      this.dispatchEvent(
        new CustomEvent('loadError', {
          detail: { error: 'Failed to read save file' },
        })
      );
      return false;
    }
  }

  /**
   * Get list of saved games (browser storage)
   * @returns {Array} List of save metadata
   */
  getSaveFiles() {
    const saves = [];

    // Check localStorage for saves
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('somnium_save_')) {
        try {
          const saveData = JSON.parse(localStorage.getItem(key));
          saves.push({
            key,
            title: saveData.resources?.gameJSON?.plot?.title || 'Unknown',
            timestamp: saveData.state?.timestamp,
            score: saveData.state?.score || 0,
            moves: saveData.state?.moves || 0,
          });
        } catch (error) {
          console.error(`Invalid save file ${key}:`, error);
        }
      }
    }

    // Sort by timestamp (newest first)
    saves.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return saves;
  }

  /**
   * Save game to browser storage
   * @param {string} slotName - Save slot name
   * @returns {boolean} Success
   */
  saveToStorage(slotName) {
    try {
      const saveData = this.createSaveFile();
      const key = `somnium_save_${slotName}`;
      localStorage.setItem(key, JSON.stringify(saveData));

      this.dispatchEvent(
        new CustomEvent('gameSaved', {
          detail: { slotName, timestamp: saveData.state.timestamp },
        })
      );

      return true;
    } catch (error) {
      console.error('Save to storage error:', error);
      return false;
    }
  }

  /**
   * Load game from browser storage
   * @param {string} slotName - Save slot name
   * @returns {boolean} Success
   */
  loadFromStorage(slotName) {
    try {
      const key = `somnium_save_${slotName}`;
      const saveText = localStorage.getItem(key);
      if (!saveText) {
        throw new Error('Save slot not found');
      }

      const saveData = JSON.parse(saveText);
      return this.loadFromSaveData(saveData);
    } catch (error) {
      console.error('Load from storage error:', error);
      this.dispatchEvent(
        new CustomEvent('loadError', {
          detail: { error: error.message },
        })
      );
      return false;
    }
  }

  /**
   * Wear an item
   * @param {string} itemId - Item ID
   */
  wearItem(itemId) {
    const item = this.getItem(itemId);
    if (!item || !item.wearable) return;

    const slot = item.slot || 'default';
    if (!this.worn) this.worn = {};
    this.worn[slot] = itemId;

    // Move from inventory to worn
    this.removeFromInventory(itemId);
  }

  /**
   * Remove worn item
   * @param {string} itemId - Item ID
   */
  removeWornItem(itemId) {
    if (!this.worn) this.worn = {};

    // Find which slot it's in
    for (const [slot, wornId] of Object.entries(this.worn)) {
      if (wornId === itemId) {
        delete this.worn[slot];
        this.addToInventory(itemId);
        break;
      }
    }
  }

  /**
   * Check if wearing an item
   * @param {string} itemId - Item ID
   * @returns {boolean} True if wearing
   */
  isWearing(itemId) {
    if (!this.worn) return false;
    return Object.values(this.worn).includes(itemId);
  }

  /**
   * Get worn item in slot
   * @param {string} slot - Equipment slot
   * @returns {Object|null} Worn item
   */
  getWornItem(slot) {
    if (!this.worn) return null;
    const itemId = this.worn[slot];
    return itemId ? this.getItem(itemId) : null;
  }
}
