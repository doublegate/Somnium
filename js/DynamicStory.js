/**
 * DynamicStory - AI-powered dynamic storytelling and narrative generation
 *
 * Features:
 * - Dynamic narrative branching based on player choices
 * - Character-driven story adaptation
 * - Procedural quest generation
 * - Relationship-based dialogue
 * - Contextual event narration
 * - Story memory and callbacks
 * - Plot thread tracking
 * - Adaptive difficulty based on player performance
 */

import { logger } from './logger.js';

export class DynamicStory {
  constructor(aiManager, gameState, npcSystem, eventManager) {
    this.aiManager = aiManager;
    this.gameState = gameState;
    this.npcSystem = npcSystem;
    this.eventManager = eventManager;

    // Story state
    this.storyMemory = [];
    this.plotThreads = new Map();
    this.characterArcs = new Map();
    this.playerChoices = [];

    // Narrative themes
    this.currentTheme = 'adventure';
    this.mood = 'neutral';

    // Quest generation
    this.activeQuests = new Map();
    this.questTemplates = this.initializeQuestTemplates();

    // Story statistics
    this.stats = {
      eventsNarrated: 0,
      questsGenerated: 0,
      choicesMade: 0,
      plotThreadsResolved: 0,
    };

    // AI prompts
    this.prompts = this.initializePrompts();
  }

  /**
   * Initialize quest templates
   * @returns {Object} Quest templates
   */
  initializeQuestTemplates() {
    return {
      fetch: {
        type: 'fetch',
        structure: {
          objective: 'Retrieve [item] from [location]',
          complications: ['guards', 'puzzles', 'monsters', 'traps'],
          rewards: ['item', 'knowledge', 'ally'],
        },
      },
      rescue: {
        type: 'rescue',
        structure: {
          objective: 'Save [character] from [danger]',
          complications: ['time_limit', 'enemies', 'obstacles'],
          rewards: ['ally', 'reputation', 'item'],
        },
      },
      mystery: {
        type: 'mystery',
        structure: {
          objective: 'Solve the mystery of [event]',
          complications: ['clues', 'red_herrings', 'suspects'],
          rewards: ['knowledge', 'item', 'reputation'],
        },
      },
      revenge: {
        type: 'revenge',
        structure: {
          objective: 'Defeat [antagonist] who [wrongdoing]',
          complications: ['minions', 'fortifications', 'moral_dilemma'],
          rewards: ['justice', 'item', 'closure'],
        },
      },
      discovery: {
        type: 'discovery',
        structure: {
          objective: 'Find [legendary_item/place]',
          complications: ['riddles', 'trials', 'guardians'],
          rewards: ['item', 'knowledge', 'power'],
        },
      },
    };
  }

  /**
   * Initialize AI prompts
   * @returns {Object} Prompt templates
   */
  initializePrompts() {
    return {
      narrateEvent: `You are a master storyteller narrating events in a fantasy adventure game.

Context: {context}
Recent Events: {recentEvents}
Current Mood: {mood}
Player Action: {action}

Provide a vivid, atmospheric narration (2-3 sentences) of what happens next.
Style: {theme} with {mood} tone.`,

      generateQuest: `Generate a quest for a fantasy adventure game.

Quest Type: {questType}
Player Level: {playerLevel}
Current Location: {location}
Story Context: {storyContext}

Create a quest with:
1. Title
2. Description (1-2 paragraphs)
3. Objectives (2-4 steps)
4. Rewards
5. NPC quest giver

Return as JSON.`,

      adaptDialogue: `Generate NPC dialogue that adapts to the relationship and context.

NPC: {npcName} ({npcPersonality})
Relationship: {relationship}/100
Recent Interactions: {recentInteractions}
Current Context: {context}
Player Question: {question}

Generate a response that reflects:
1. The relationship level
2. NPC personality
3. Current story context
4. Player's recent actions`,

      developPlot: `Continue developing the story plot thread.

Plot Thread: {plotThread}
Current Status: {status}
Player Actions: {playerActions}
World State: {worldState}

Suggest the next development in this plot thread that:
1. Builds on player choices
2. Maintains internal consistency
3. Creates engaging moments
4. Offers meaningful decisions`,
    };
  }

  /**
   * Narrate an event with AI-generated description
   * @param {string} eventType - Type of event
   * @param {Object} context - Event context
   * @returns {Promise<string>} Narration
   */
  async narrateEvent(eventType, context = {}) {
    try {
      // Build context
      const recentEvents = this.storyMemory.slice(-5).map((e) => e.summary);

      const prompt = this.prompts.narrateEvent
        .replace('{context}', JSON.stringify(context))
        .replace('{recentEvents}', recentEvents.join(', '))
        .replace('{mood}', this.mood)
        .replace('{action}', eventType)
        .replace('{theme}', this.currentTheme);

      // Get AI narration
      const response = await this.aiManager.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.8,
      });

      const narration = response.text;

      // Add to story memory
      this.storyMemory.push({
        type: eventType,
        narration,
        context,
        timestamp: Date.now(),
        summary: eventType,
      });

      this.stats.eventsNarrated++;

      logger.info(`Event narrated: ${eventType}`);

      return narration;
    } catch (error) {
      logger.error('Event narration failed:', error);
      return this.getDefaultNarration(eventType);
    }
  }

  /**
   * Generate a procedural quest
   * @param {string} questType - Quest type
   * @param {Object} params - Quest parameters
   * @returns {Promise<Object>} Generated quest
   */
  async generateQuest(questType, params = {}) {
    try {
      const template = this.questTemplates[questType];

      if (!template) {
        return {
          success: false,
          message: 'Invalid quest type!',
        };
      }

      const prompt = this.prompts.generateQuest
        .replace('{questType}', questType)
        .replace('{playerLevel}', this.gameState.getPlayerLevel())
        .replace('{location}', this.gameState.getCurrentRoomName())
        .replace('{storyContext}', this.getStoryContext());

      const response = await this.aiManager.generateJSON(prompt);

      const quest = {
        id: `quest_${Date.now()}`,
        type: questType,
        ...response.quest,
        status: 'active',
        progress: {},
        startTime: Date.now(),
      };

      this.activeQuests.set(quest.id, quest);
      this.stats.questsGenerated++;

      logger.info(`Quest generated: ${quest.title}`);

      this.eventManager.triggerEvent('questGenerated', { quest });

      return {
        success: true,
        quest,
      };
    } catch (error) {
      logger.error('Quest generation failed:', error);
      return {
        success: false,
        message: 'Failed to generate quest',
      };
    }
  }

  /**
   * Adapt NPC dialogue based on relationship and context
   * @param {string} npcId - NPC ID
   * @param {string} question - Player's question/topic
   * @returns {Promise<string>} Adapted dialogue
   */
  async adaptDialogue(npcId, question) {
    try {
      const npc = this.npcSystem.getNPC(npcId);
      const relationship = this.npcSystem.getRelationship(npcId);
      const recentInteractions = this.getRecentNPCInteractions(npcId);

      const prompt = this.prompts.adaptDialogue
        .replace('{npcName}', npc.name)
        .replace('{npcPersonality}', npc.personality || 'friendly')
        .replace('{relationship}', relationship)
        .replace('{recentInteractions}', JSON.stringify(recentInteractions))
        .replace('{context}', this.getStoryContext())
        .replace('{question}', question);

      const response = await this.aiManager.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.7,
      });

      return response.text;
    } catch (error) {
      logger.error('Dialogue adaptation failed:', error);
      return `${npc.name} looks at you thoughtfully.`;
    }
  }

  /**
   * Track player choice for story adaptation
   * @param {string} choice - Choice description
   * @param {Object} consequences - Choice consequences
   */
  trackPlayerChoice(choice, consequences = {}) {
    this.playerChoices.push({
      choice,
      consequences,
      timestamp: Date.now(),
      location: this.gameState.getCurrentRoomName(),
    });

    this.stats.choicesMade++;

    // Update mood based on choice
    if (consequences.mood) {
      this.mood = consequences.mood;
    }

    // Update plot threads
    if (consequences.plotThread) {
      this.advancePlotThread(consequences.plotThread);
    }
  }

  /**
   * Advance a plot thread
   * @param {string} threadId - Plot thread ID
   */
  async advancePlotThread(threadId) {
    const thread = this.plotThreads.get(threadId);

    if (!thread) {
      // Create new plot thread
      this.plotThreads.set(threadId, {
        id: threadId,
        status: 'active',
        developments: [],
        startTime: Date.now(),
      });
      return;
    }

    try {
      const prompt = this.prompts.developPlot
        .replace('{plotThread}', threadId)
        .replace('{status}', thread.status)
        .replace('{playerActions}', JSON.stringify(this.playerChoices.slice(-3)))
        .replace('{worldState}', this.getStoryContext());

      const response = await this.aiManager.generateJSON(prompt);

      thread.developments.push({
        development: response.nextDevelopment,
        timestamp: Date.now(),
      });

      // Check if thread is resolved
      if (response.resolved) {
        thread.status = 'resolved';
        this.stats.plotThreadsResolved++;

        this.eventManager.triggerEvent('plotThreadResolved', {
          threadId,
        });
      }
    } catch (error) {
      logger.error('Plot thread advancement failed:', error);
    }
  }

  /**
   * Get current story context
   * @returns {string} Story context summary
   */
  getStoryContext() {
    return JSON.stringify({
      location: this.gameState.getCurrentRoomName(),
      playerLevel: this.gameState.getPlayerLevel(),
      recentEvents: this.storyMemory.slice(-3).map((e) => e.summary),
      activePlots: Array.from(this.plotThreads.keys()),
      mood: this.mood,
      theme: this.currentTheme,
    });
  }

  /**
   * Get recent NPC interactions
   * @param {string} npcId - NPC ID
   * @returns {Array} Recent interactions
   */
  getRecentNPCInteractions(npcId) {
    return this.storyMemory
      .filter((event) => event.context?.npcId === npcId)
      .slice(-5)
      .map((event) => ({
        type: event.type,
        summary: event.summary,
      }));
  }

  /**
   * Get default narration for event type
   * @param {string} eventType - Event type
   * @returns {string} Default narration
   */
  getDefaultNarration(eventType) {
    const defaults = {
      combat_start: 'Battle begins!',
      puzzle_solved: 'The puzzle yields to your efforts.',
      item_found: 'You discover something interesting.',
      npc_met: 'A new face appears before you.',
      location_entered: 'You arrive at a new location.',
    };

    return defaults[eventType] || 'Something happens.';
  }

  /**
   * Update story theme
   * @param {string} theme - New theme
   */
  setTheme(theme) {
    this.currentTheme = theme;
    logger.info(`Story theme changed to: ${theme}`);
  }

  /**
   * Update story mood
   * @param {string} mood - New mood
   */
  setMood(mood) {
    this.mood = mood;
    logger.info(`Story mood changed to: ${mood}`);
  }

  /**
   * Get active plot threads
   * @returns {Array} Active plot threads
   */
  getActivePlotThreads() {
    return Array.from(this.plotThreads.values()).filter(
      (thread) => thread.status === 'active'
    );
  }

  /**
   * Get quest status
   * @param {string} questId - Quest ID
   * @returns {Object|null} Quest data or null
   */
  getQuest(questId) {
    return this.activeQuests.get(questId) || null;
  }

  /**
   * Update quest progress
   * @param {string} questId - Quest ID
   * @param {Object} progress - Progress update
   */
  updateQuestProgress(questId, progress) {
    const quest = this.activeQuests.get(questId);

    if (!quest) return;

    Object.assign(quest.progress, progress);

    // Check if quest is complete
    if (this.isQuestComplete(quest)) {
      this.completeQuest(questId);
    }
  }

  /**
   * Check if quest is complete
   * @param {Object} quest - Quest data
   * @returns {boolean} True if complete
   */
  isQuestComplete(quest) {
    // Simple completion check - all objectives met
    return quest.objectives.every(
      (objective) => quest.progress[objective.id]
    );
  }

  /**
   * Complete quest
   * @param {string} questId - Quest ID
   */
  completeQuest(questId) {
    const quest = this.activeQuests.get(questId);

    if (!quest) return;

    quest.status = 'completed';
    quest.completionTime = Date.now();

    // Award rewards
    if (quest.rewards) {
      for (const reward of quest.rewards) {
        this.awardQuestReward(reward);
      }
    }

    logger.info(`Quest completed: ${quest.title}`);

    this.eventManager.triggerEvent('questCompleted', { quest });
  }

  /**
   * Award quest reward
   * @param {Object} reward - Reward data
   */
  awardQuestReward(reward) {
    switch (reward.type) {
      case 'experience':
        this.gameState.addExperience(reward.amount);
        break;
      case 'item':
        this.gameState.addItem(reward.itemId);
        break;
      case 'gold':
        this.gameState.addGold(reward.amount);
        break;
      case 'reputation':
        // Add reputation system if available
        break;
    }
  }

  /**
   * Get statistics
   * @returns {Object} Story statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      storyMemorySize: this.storyMemory.length,
      activePlotThreads: this.getActivePlotThreads().length,
      activeQuests: this.activeQuests.size,
      choicesMade: this.playerChoices.length,
    };
  }

  /**
   * Save state
   * @returns {Object} Save data
   */
  save() {
    return {
      storyMemory: this.storyMemory.slice(-50), // Keep last 50 events
      plotThreads: Array.from(this.plotThreads.entries()),
      playerChoices: this.playerChoices.slice(-20), // Keep last 20 choices
      activeQuests: Array.from(this.activeQuests.entries()),
      currentTheme: this.currentTheme,
      mood: this.mood,
      stats: { ...this.stats },
    };
  }

  /**
   * Load state
   * @param {Object} saveData - Save data
   */
  load(saveData) {
    this.storyMemory = saveData.storyMemory || [];
    this.plotThreads = new Map(saveData.plotThreads || []);
    this.playerChoices = saveData.playerChoices || [];
    this.activeQuests = new Map(saveData.activeQuests || []);
    this.currentTheme = saveData.currentTheme || 'adventure';
    this.mood = saveData.mood || 'neutral';
    this.stats = saveData.stats || this.stats;
  }
}
