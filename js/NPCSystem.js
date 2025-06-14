/**
 * NPCSystem - Manages NPC dialogue, movement, trading, and interactions
 *
 * Responsibilities:
 * - Handle dialogue trees and conversations
 * - Manage NPC movement patterns and AI
 * - Support trading and inventory exchanges
 * - Track NPC states and reactions
 * - Implement relationship/reputation system
 */

export class NPCSystem {
  constructor(gameState, movementSystem, eventManager) {
    this.gameState = gameState;
    this.movementSystem = movementSystem;
    this.eventManager = eventManager;

    // NPC definitions and states
    this.npcs = new Map(); // npcId -> NPC data
    this.npcStates = new Map(); // npcId -> dynamic state

    // Dialogue tracking
    this.activeConversations = new Map(); // npcId -> conversation state
    this.dialogueHistory = new Map(); // npcId -> [chosen options]

    // Relationship tracking
    this.relationships = new Map(); // npcId -> relationship value (-100 to 100)
    this.reputationFactors = {
      helpfulAction: 10,
      trade: 5,
      insult: -20,
      attack: -50,
      gift: 15,
    };

    // Trading system
    this.activeTrades = new Map();
    this.tradeHistory = [];
  }

  /**
   * Initialize NPCs from game data
   * @param {Object} gameData - Game JSON with NPC definitions
   */
  initialize(gameData) {
    if (!gameData.npcs) return;

    for (const npc of gameData.npcs) {
      this.npcs.set(npc.id, npc);

      // Initialize NPC state
      this.npcStates.set(npc.id, {
        currentRoom: npc.startingRoom,
        inventory: npc.inventory || [],
        health: npc.health || 100,
        mood: npc.mood || 'neutral',
        active: true,
        lastInteraction: null,
      });

      // Initialize relationship
      this.relationships.set(npc.id, npc.initialRelationship || 0);

      // Set up movement pattern if defined
      if (npc.movementPattern) {
        this.movementSystem.setNPCMovement(npc.id, npc.movementPattern);
      }
    }
  }

  /**
   * Start conversation with NPC
   * @param {string} npcId - NPC to talk to
   * @returns {Object} Conversation start result
   */
  startConversation(npcId) {
    const npc = this.npcs.get(npcId);
    const state = this.npcStates.get(npcId);

    if (!npc || !state) {
      return {
        success: false,
        message: "They're not here.",
      };
    }

    // Check if NPC is in current room
    if (state.currentRoom !== this.gameState.currentRoomId) {
      return {
        success: false,
        message: "They're not here.",
      };
    }

    // Check if NPC is willing to talk
    const relationship = this.relationships.get(npcId);
    if (relationship < -50) {
      return {
        success: false,
        message: npc.hostileMessage || `${npc.name} refuses to speak with you.`,
      };
    }

    // Get appropriate dialogue tree
    const dialogue = this.getDialogueTree(npcId);

    if (!dialogue) {
      return {
        success: true,
        message: npc.noDialogueMessage || `${npc.name} has nothing to say.`,
        options: [],
      };
    }

    // Start conversation
    this.activeConversations.set(npcId, {
      currentNode: dialogue.root,
      history: [],
      startTime: Date.now(),
    });

    state.lastInteraction = Date.now();

    return {
      success: true,
      message: dialogue.greeting || `${npc.name} looks at you expectantly.`,
      npcName: npc.name,
      options: this.getDialogueOptions(npcId, dialogue.root),
    };
  }

  /**
   * Continue conversation with dialogue choice
   * @param {string} npcId - NPC in conversation
   * @param {number} optionIndex - Selected option index
   * @returns {Object} Conversation continuation
   */
  selectDialogueOption(npcId, optionIndex) {
    const conversation = this.activeConversations.get(npcId);
    if (!conversation) {
      return {
        success: false,
        message: 'No active conversation.',
      };
    }

    const currentNode = this.getDialogueNode(npcId, conversation.currentNode);

    if (!currentNode || !currentNode.options) {
      return {
        success: false,
        message: 'Invalid conversation state.',
      };
    }

    const selectedOption = currentNode.options[optionIndex];
    if (!selectedOption) {
      return {
        success: false,
        message: 'Invalid option.',
      };
    }

    // Record choice
    conversation.history.push({
      node: conversation.currentNode,
      choice: optionIndex,
      timestamp: Date.now(),
    });

    if (!this.dialogueHistory.has(npcId)) {
      this.dialogueHistory.set(npcId, []);
    }
    this.dialogueHistory.get(npcId).push(selectedOption.id);

    // Execute option effects
    if (selectedOption.effects) {
      this.executeDialogueEffects(npcId, selectedOption.effects);
    }

    // Check if conversation ends
    if (selectedOption.endsConversation) {
      this.endConversation(npcId);
      return {
        success: true,
        message: selectedOption.response,
        conversationEnded: true,
      };
    }

    // Move to next node
    const nextNode = selectedOption.nextNode || 'exit';
    if (nextNode === 'exit') {
      this.endConversation(npcId);
      return {
        success: true,
        message: selectedOption.response,
        conversationEnded: true,
      };
    }

    conversation.currentNode = nextNode;

    // Get next dialogue node
    const nextDialogueNode = this.getDialogueNode(npcId, nextNode);

    return {
      success: true,
      message: selectedOption.response,
      npcResponse: nextDialogueNode.text,
      options: this.getDialogueOptions(npcId, nextNode),
      conversationEnded: false,
    };
  }

  /**
   * Get appropriate dialogue tree for NPC
   * @private
   */
  getDialogueTree(npcId) {
    const npc = this.npcs.get(npcId);
    if (!npc.dialogues) return null;

    // Check conditional dialogues
    for (const dialogue of npc.dialogues) {
      if (dialogue.condition) {
        if (this.eventManager.checkCondition(dialogue.condition)) {
          return dialogue;
        }
      } else {
        // Default dialogue
        return dialogue;
      }
    }

    return null;
  }

  /**
   * Get dialogue node by ID
   * @private
   */
  getDialogueNode(npcId, nodeId) {
    const dialogue = this.getDialogueTree(npcId);
    if (!dialogue || !dialogue.nodes) return null;

    return dialogue.nodes[nodeId];
  }

  /**
   * Get available dialogue options for a node
   * @private
   */
  getDialogueOptions(npcId, nodeId) {
    const node = this.getDialogueNode(npcId, nodeId);
    if (!node || !node.options) return [];

    // Filter options based on conditions
    return node.options.filter((option) => {
      if (!option.condition) return true;
      return this.eventManager.checkCondition(option.condition);
    });
  }

  /**
   * Execute dialogue effects
   * @private
   */
  executeDialogueEffects(npcId, effects) {
    for (const effect of effects) {
      switch (effect.type) {
        case 'SET_FLAG':
          this.gameState.setFlag(effect.flag, effect.value);
          break;

        case 'GIVE_ITEM':
          this.giveItemToPlayer(npcId, effect.itemId);
          break;

        case 'TAKE_ITEM':
          this.takeItemFromPlayer(effect.itemId);
          break;

        case 'CHANGE_RELATIONSHIP':
          this.modifyRelationship(npcId, effect.amount);
          break;

        case 'TRIGGER_EVENT':
          this.eventManager.triggerEvent(effect.eventId, effect.params);
          break;

        case 'UNLOCK_DIALOGUE':
          // Mark dialogue option as available
          this.gameState.setFlag(
            `dialogue_${npcId}_${effect.dialogueId}`,
            true
          );
          break;

        case 'START_TRADE':
          this.startTrading(npcId);
          break;

        default:
          console.warn(`Unknown dialogue effect: ${effect.type}`);
      }
    }
  }

  /**
   * End active conversation
   * @private
   */
  endConversation(npcId) {
    this.activeConversations.delete(npcId);
  }

  /**
   * Give item from NPC to player
   * @private
   */
  giveItemToPlayer(npcId, itemId) {
    const state = this.npcStates.get(npcId);
    const itemIndex = state.inventory.indexOf(itemId);

    if (itemIndex > -1) {
      state.inventory.splice(itemIndex, 1);
      this.gameState.addItem(itemId);
    }
  }

  /**
   * Take item from player
   * @private
   */
  takeItemFromPlayer(itemId) {
    if (this.gameState.hasItem(itemId)) {
      this.gameState.removeItem(itemId);
    }
  }

  /**
   * Modify relationship with NPC
   * @param {string} npcId - NPC ID
   * @param {number} amount - Amount to change (-100 to 100)
   */
  modifyRelationship(npcId, amount) {
    const current = this.relationships.get(npcId) || 0;
    const newValue = Math.max(-100, Math.min(100, current + amount));
    this.relationships.set(npcId, newValue);

    // Update NPC mood based on relationship
    this.updateNPCMood(npcId, newValue);

    // Trigger relationship change event
    this.eventManager.triggerEvent('relationshipChanged', {
      npcId,
      oldValue: current,
      newValue,
    });
  }

  /**
   * Update NPC mood based on relationship
   * @private
   */
  updateNPCMood(npcId, relationship) {
    const state = this.npcStates.get(npcId);
    if (!state) return;

    if (relationship >= 50) {
      state.mood = 'friendly';
    } else if (relationship >= 0) {
      state.mood = 'neutral';
    } else if (relationship >= -50) {
      state.mood = 'wary';
    } else {
      state.mood = 'hostile';
    }
  }

  /**
   * Start trading with NPC
   * @param {string} npcId - NPC to trade with
   * @returns {Object} Trade interface data
   */
  startTrading(npcId) {
    const npc = this.npcs.get(npcId);
    const state = this.npcStates.get(npcId);

    if (!npc || !state) {
      return {
        success: false,
        message: 'Cannot trade with that character.',
      };
    }

    // Check if NPC trades
    if (!npc.trades) {
      return {
        success: false,
        message: `${npc.name} doesn't want to trade.`,
      };
    }

    // Check relationship
    const relationship = this.relationships.get(npcId);
    if (relationship < -20) {
      return {
        success: false,
        message: `${npc.name} doesn't trust you enough to trade.`,
      };
    }

    // Create trade session
    const tradeSession = {
      npcId,
      playerOffer: [],
      npcOffer: [],
      status: 'negotiating',
    };

    this.activeTrades.set(npcId, tradeSession);

    return {
      success: true,
      npcInventory: state.inventory,
      playerInventory: this.gameState.inventory,
      npcName: npc.name,
      tradeRules: npc.tradeRules || {},
    };
  }

  /**
   * Execute a trade
   * @param {string} npcId - NPC to trade with
   * @param {Array} playerItems - Items player offers
   * @param {Array} npcItems - Items requested from NPC
   * @returns {Object} Trade result
   */
  executeTrade(npcId, playerItems, npcItems) {
    const trade = this.activeTrades.get(npcId);
    if (!trade) {
      return {
        success: false,
        message: 'No active trade.',
      };
    }

    const npc = this.npcs.get(npcId);
    const state = this.npcStates.get(npcId);

    // Validate trade
    const validation = this.validateTrade(npcId, playerItems, npcItems);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
      };
    }

    // Execute trade
    // Remove items from player
    for (const itemId of playerItems) {
      this.gameState.removeItem(itemId);
      state.inventory.push(itemId);
    }

    // Give items to player
    for (const itemId of npcItems) {
      const index = state.inventory.indexOf(itemId);
      if (index > -1) {
        state.inventory.splice(index, 1);
        this.gameState.addItem(itemId);
      }
    }

    // Record trade
    this.tradeHistory.push({
      npcId,
      playerGave: playerItems,
      playerReceived: npcItems,
      timestamp: Date.now(),
    });

    // Improve relationship
    this.modifyRelationship(npcId, this.reputationFactors.trade);

    // Clean up
    this.activeTrades.delete(npcId);

    return {
      success: true,
      message: npc.tradeSuccessMessage || 'Trade successful!',
    };
  }

  /**
   * Validate trade fairness
   * @private
   */
  validateTrade(npcId, playerItems, npcItems) {
    const npc = this.npcs.get(npcId);
    const state = this.npcStates.get(npcId);

    // Check if NPC has all requested items
    for (const itemId of npcItems) {
      if (!state.inventory.includes(itemId)) {
        return {
          valid: false,
          message: `${npc.name} doesn't have that item.`,
        };
      }
    }

    // Check if player has all offered items
    for (const itemId of playerItems) {
      if (!this.gameState.hasItem(itemId)) {
        return {
          valid: false,
          message: "You don't have that item.",
        };
      }
    }

    // Check trade rules
    if (npc.tradeRules) {
      // Check value balance first (if required)
      if (npc.tradeRules.requiresEqualValue) {
        const playerValue = this.calculateTradeValue(playerItems);
        const npcValue = this.calculateTradeValue(npcItems);

        if (playerValue < npcValue * 0.8) {
          return {
            valid: false,
            message: "That's not a fair trade.",
          };
        }
      }

      // Check required items
      if (npc.tradeRules.requires) {
        for (const required of npc.tradeRules.requires) {
          if (!playerItems.includes(required)) {
            const item = this.gameState.getItem(required);
            return {
              valid: false,
              message: `${npc.name} wants ${item?.name || required} for that.`,
            };
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Calculate trade value
   * @private
   */
  calculateTradeValue(items) {
    let value = 0;
    for (const itemId of items) {
      const item = this.gameState.getItem(itemId);
      if (item && item.value) {
        value += item.value;
      }
    }
    return value;
  }

  /**
   * Move NPC to a different room
   * @param {string} npcId - NPC to move
   * @param {string} targetRoomId - Destination room
   */
  moveNPC(npcId, targetRoomId) {
    const state = this.npcStates.get(npcId);
    if (!state) return;

    const oldRoom = state.currentRoom;
    state.currentRoom = targetRoomId;

    // Update room NPC lists
    const oldRoomData = this.gameState.getRoom(oldRoom);
    if (oldRoomData && oldRoomData.npcs) {
      const index = oldRoomData.npcs.indexOf(npcId);
      if (index > -1) {
        oldRoomData.npcs.splice(index, 1);
      }
    }

    const newRoomData = this.gameState.getRoom(targetRoomId);
    if (newRoomData) {
      if (!newRoomData.npcs) newRoomData.npcs = [];
      newRoomData.npcs.push(npcId);
    }

    // Trigger movement event
    this.eventManager.triggerEvent('npcMoved', {
      npcId,
      from: oldRoom,
      to: targetRoomId,
    });
  }

  /**
   * Check if NPC is in current room
   * @param {string} npcId - NPC to check
   * @returns {boolean} True if in current room
   */
  isNPCPresent(npcId) {
    const state = this.npcStates.get(npcId);
    return state && state.currentRoom === this.gameState.currentRoomId;
  }

  /**
   * Get NPC reaction to player action
   * @param {string} npcId - NPC to react
   * @param {Object} action - Player action
   * @returns {Object} Reaction result
   */
  getNPCReaction(npcId, action) {
    const npc = this.npcs.get(npcId);
    if (!npc || !npc.reactions) return null;

    // Find matching reaction
    for (const reaction of npc.reactions) {
      if (reaction.trigger === action.type) {
        // Check conditions
        if (
          reaction.condition &&
          !this.eventManager.checkCondition(reaction.condition)
        ) {
          continue;
        }

        // Execute reaction
        if (reaction.effects) {
          this.executeDialogueEffects(npcId, reaction.effects);
        }

        return {
          message: reaction.message,
          emotion: reaction.emotion,
        };
      }
    }

    return null;
  }

  /**
   * Update all NPCs
   * @param {number} deltaTime - Time since last update
   */
  update(_deltaTime) {
    // Update NPC schedules
    for (const [npcId, npc] of this.npcs) {
      if (npc.schedule) {
        this.updateNPCSchedule(npcId, npc.schedule);
      }
    }

    // Movement is handled by MovementSystem
  }

  /**
   * Update NPC based on schedule
   * @private
   */
  updateNPCSchedule(npcId, schedule) {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    for (const entry of schedule) {
      if (currentHour >= entry.startHour && currentHour < entry.endHour) {
        const state = this.npcStates.get(npcId);
        if (state.currentRoom !== entry.room) {
          this.moveNPC(npcId, entry.room);
        }
        break;
      }
    }
  }
}
