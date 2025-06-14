/**
 * InteractionSystem - Handles object interactions and puzzle mechanics
 *
 * Responsibilities:
 * - Process "use X on Y" commands
 * - Handle state-changing interactions
 * - Manage locked/unlocked states
 * - Execute puzzle logic
 * - Combine items
 */

export class InteractionSystem {
  constructor(gameState, eventManager) {
    this.gameState = gameState;
    this.eventManager = eventManager;

    // Interaction rules defined by game data
    this.interactions = new Map(); // "itemA:itemB" -> interaction result
    this.combinations = new Map(); // "itemA:itemB" -> new item
    this.unlockables = new Map(); // "lockId:keyId" -> unlock result

    // State tracking
    this.interactionHistory = [];
    this.maxHistorySize = 50;
  }

  /**
   * Initialize from game data
   * @param {Object} gameData - Game JSON with interaction definitions
   */
  initialize(gameData) {
    // Load interaction rules
    if (gameData.interactions) {
      for (const interaction of gameData.interactions) {
        const key = this.getInteractionKey(
          interaction.item1,
          interaction.item2
        );
        this.interactions.set(key, interaction);
      }
    }

    // Load item combinations
    if (gameData.combinations) {
      for (const combo of gameData.combinations) {
        const key = this.getInteractionKey(combo.item1, combo.item2);
        this.combinations.set(key, combo);
      }
    }

    // Load unlockables
    if (gameData.unlockables) {
      for (const unlock of gameData.unlockables) {
        const key = `${unlock.lockId}:${unlock.keyId}`;
        this.unlockables.set(key, unlock);
      }
    }
  }

  /**
   * Create interaction key (order-independent)
   * @private
   */
  getInteractionKey(id1, id2) {
    // Sort IDs to make key order-independent
    const sorted = [id1, id2].sort();
    return `${sorted[0]}:${sorted[1]}`;
  }

  /**
   * Use one item on another
   * @param {string} itemId - Item being used
   * @param {string} targetId - Target item/object
   * @returns {Object} {success: boolean, message: string, effects: Array}
   */
  useItemOn(itemId, targetId) {
    // Check if player has the item
    if (!this.gameState.hasItem(itemId)) {
      return {
        success: false,
        message: "You don't have that item",
        effects: [],
      };
    }

    // Check if target exists in current room or inventory
    const target = this.findTarget(targetId);
    if (!target) {
      return {
        success: false,
        message: "You can't see that here",
        effects: [],
      };
    }

    // Record interaction attempt
    this.recordInteraction(itemId, targetId);

    // Check for specific interaction
    const key = this.getInteractionKey(itemId, targetId);
    const interaction = this.interactions.get(key);

    if (interaction) {
      return this.executeInteraction(interaction, itemId, targetId);
    }

    // Check for unlock interaction
    const unlockKey = `${targetId}:${itemId}`;
    const unlock = this.unlockables.get(unlockKey);

    if (unlock) {
      return this.executeUnlock(unlock, itemId, targetId);
    }

    // Check for item combination
    const combination = this.combinations.get(key);

    if (combination) {
      return this.executeCombination(combination, itemId, targetId);
    }

    // Default failure message
    return {
      success: false,
      message: this.getDefaultFailureMessage(itemId, targetId),
      effects: [],
    };
  }

  /**
   * Execute a defined interaction
   * @private
   */
  executeInteraction(interaction, itemId, targetId) {
    const effects = [];

    // Check conditions
    if (interaction.conditions) {
      for (const condition of interaction.conditions) {
        if (!this.checkCondition(condition)) {
          return {
            success: false,
            message:
              interaction.failureMessage || "That doesn't work right now",
            effects: [],
          };
        }
      }
    }

    // Execute effects
    if (interaction.effects) {
      for (const effect of interaction.effects) {
        const result = this.applyEffect(effect);
        if (result) effects.push(result);
      }
    }

    // Consume item if specified
    if (interaction.consumeItem) {
      this.gameState.removeItem(itemId);
      effects.push({ type: 'removeItem', itemId });
    }

    // Change target state
    if (interaction.targetState) {
      this.gameState.setObjectState(targetId, interaction.targetState);
      effects.push({
        type: 'stateChange',
        objectId: targetId,
        state: interaction.targetState,
      });
    }

    // Set flags
    if (interaction.setFlags) {
      for (const [flag, value] of Object.entries(interaction.setFlags)) {
        this.gameState.setFlag(flag, value);
        effects.push({ type: 'setFlag', flag, value });
      }
    }

    // Trigger events
    if (interaction.triggerEvent) {
      this.eventManager.triggerEvent(interaction.triggerEvent);
      effects.push({ type: 'triggerEvent', event: interaction.triggerEvent });
    }

    return {
      success: true,
      message: interaction.successMessage || 'That worked!',
      effects,
    };
  }

  /**
   * Execute unlock interaction
   * @private
   */
  executeUnlock(unlock, keyId, lockId) {
    const effects = [];

    // Check if already unlocked
    const lockState = this.gameState.getObjectState(lockId);
    if (lockState === 'unlocked' || lockState === 'open') {
      return {
        success: false,
        message: "It's already unlocked",
        effects: [],
      };
    }

    // Unlock the object
    this.gameState.setObjectState(lockId, 'unlocked');
    effects.push({ type: 'stateChange', objectId: lockId, state: 'unlocked' });

    // Set unlock flag
    if (unlock.flag) {
      this.gameState.setFlag(unlock.flag, true);
      effects.push({ type: 'setFlag', flag: unlock.flag, value: true });
    }

    // Consume key if specified
    if (unlock.consumeKey) {
      this.gameState.removeItem(keyId);
      effects.push({ type: 'removeItem', itemId: keyId });
    }

    // Update exit states if this unlocks a door
    if (unlock.unlocksExit) {
      this.gameState.setExitState(
        unlock.unlocksExit.room,
        unlock.unlocksExit.direction,
        'open'
      );
      effects.push({
        type: 'unlockExit',
        room: unlock.unlocksExit.room,
        direction: unlock.unlocksExit.direction,
      });
    }

    return {
      success: true,
      message: unlock.message || 'You unlock it with the key',
      effects,
    };
  }

  /**
   * Execute item combination
   * @private
   */
  executeCombination(combination, item1Id, item2Id) {
    const effects = [];

    // Check conditions
    if (combination.conditions) {
      for (const condition of combination.conditions) {
        if (!this.checkCondition(condition)) {
          return {
            success: false,
            message:
              combination.failureMessage || "You can't combine those right now",
            effects: [],
          };
        }
      }
    }

    // Remove source items
    this.gameState.removeItem(item1Id);
    this.gameState.removeItem(item2Id);
    effects.push({ type: 'removeItem', itemId: item1Id });
    effects.push({ type: 'removeItem', itemId: item2Id });

    // Create new item
    if (combination.resultItem) {
      this.gameState.addItem(combination.resultItem);
      effects.push({ type: 'addItem', itemId: combination.resultItem });
    }

    // Set flags
    if (combination.setFlags) {
      for (const [flag, value] of Object.entries(combination.setFlags)) {
        this.gameState.setFlag(flag, value);
        effects.push({ type: 'setFlag', flag, value });
      }
    }

    return {
      success: true,
      message: combination.message || 'You combine the items',
      effects,
    };
  }

  /**
   * Check if a condition is met
   * @private
   */
  checkCondition(condition) {
    switch (condition.type) {
      case 'flag':
        return this.gameState.getFlag(condition.flag) === condition.value;

      case 'hasItem':
        return this.gameState.hasItem(condition.itemId);

      case 'objectState':
        return (
          this.gameState.getObjectState(condition.objectId) === condition.state
        );

      case 'inRoom':
        return this.gameState.currentRoomId === condition.roomId;

      case 'score':
        return this.checkScoreCondition(condition);

      default:
        console.warn(`Unknown condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Check score-based condition
   * @private
   */
  checkScoreCondition(condition) {
    const score = this.gameState.score;

    switch (condition.operator) {
      case '>=':
        return score >= condition.value;
      case '>':
        return score > condition.value;
      case '<=':
        return score <= condition.value;
      case '<':
        return score < condition.value;
      case '==':
        return score === condition.value;
      default:
        return false;
    }
  }

  /**
   * Apply an effect
   * @private
   */
  applyEffect(effect) {
    switch (effect.type) {
      case 'addItem':
        this.gameState.addItem(effect.itemId);
        return { type: 'addItem', itemId: effect.itemId };

      case 'removeItem':
        this.gameState.removeItem(effect.itemId);
        return { type: 'removeItem', itemId: effect.itemId };

      case 'setFlag':
        this.gameState.setFlag(effect.flag, effect.value);
        return { type: 'setFlag', flag: effect.flag, value: effect.value };

      case 'changeScore':
        this.gameState.updateScore(effect.points);
        return { type: 'changeScore', points: effect.points };

      case 'changeRoom':
        this.gameState.changeRoom(effect.roomId);
        return { type: 'changeRoom', roomId: effect.roomId };

      case 'setState':
        this.gameState.setObjectState(effect.objectId, effect.state);
        return {
          type: 'setState',
          objectId: effect.objectId,
          state: effect.state,
        };

      default:
        console.warn(`Unknown effect type: ${effect.type}`);
        return null;
    }
  }

  /**
   * Find target object/item in current context
   * @private
   */
  findTarget(targetId) {
    // Check inventory
    if (this.gameState.hasItem(targetId)) {
      return this.gameState.getItem(targetId);
    }

    // Check current room objects
    const roomObject = this.gameState.getObject(targetId);
    if (roomObject) {
      return roomObject;
    }

    // Check room itself
    if (targetId === this.gameState.currentRoomId) {
      return this.gameState.getCurrentRoom();
    }

    return null;
  }

  /**
   * Get default failure message
   * @private
   */
  getDefaultFailureMessage(itemId, targetId) {
    const item = this.gameState.getItem(itemId);
    const target = this.findTarget(targetId);

    if (!item || !target) {
      return "That doesn't work";
    }

    const messages = [
      `You can't use the ${item.name} on the ${target.name}`,
      `The ${item.name} doesn't work with the ${target.name}`,
      `That doesn't seem to do anything`,
      `Nothing happens`,
      `That's not going to work`,
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Record interaction for history/hints
   * @private
   */
  recordInteraction(itemId, targetId) {
    this.interactionHistory.push({
      itemId,
      targetId,
      timestamp: Date.now(),
      room: this.gameState.currentRoomId,
    });

    // Trim history
    if (this.interactionHistory.length > this.maxHistorySize) {
      this.interactionHistory.shift();
    }
  }

  /**
   * Get hints for current puzzle state
   * @returns {Array} Array of hint strings
   */
  getHints() {
    const hints = [];

    // Check for available interactions in current context
    for (const [key, interaction] of this.interactions) {
      const [item1, item2] = key.split(':');

      // Check if player has one item and can see the other
      if (this.gameState.hasItem(item1) && this.findTarget(item2)) {
        if (interaction.hint) {
          hints.push(interaction.hint);
        }
      } else if (this.gameState.hasItem(item2) && this.findTarget(item1)) {
        if (interaction.hint) {
          hints.push(interaction.hint);
        }
      }
    }

    return hints;
  }
}
