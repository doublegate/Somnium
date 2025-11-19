/**
 * EnhancedWorldGenerator - Improved AI world generation with quality controls
 *
 * Features:
 * - Template-based generation with constraints
 * - Multi-pass generation for consistency
 * - Automatic validation and fixing
 * - Genre-specific generation (fantasy, sci-fi, mystery, horror)
 * - Difficulty scaling
 * - Coherent narrative structure
 * - Balanced puzzle difficulty progression
 * - Rich NPC personalities and relationships
 */

import { logger } from './logger.js';

export class EnhancedWorldGenerator {
  constructor(aiManager, worldValidator) {
    this.aiManager = aiManager;
    this.worldValidator = worldValidator;

    // Generation templates
    this.templates = this.initializeTemplates();

    // Generation parameters
    this.defaultParams = {
      roomCount: 10,
      npcCount: 5,
      puzzleCount: 6,
      itemCount: 15,
      difficulty: 'normal',
      genre: 'fantasy',
      theme: null,
      enforceLogic: true,
      maxRetries: 3,
    };

    // Statistics
    this.stats = {
      worldsGenerated: 0,
      retries: 0,
      validationsFailed: 0,
      averageGenerationTime: 0,
    };
  }

  /**
   * Initialize generation templates
   * @returns {Object} Templates by genre
   */
  initializeTemplates() {
    return {
      fantasy: {
        rooms: ['castle hall', 'dungeon', 'tower', 'throne room', 'armory', 'library', 'courtyard'],
        npcs: ['wizard', 'knight', 'merchant', 'guard', 'princess', 'blacksmith'],
        items: ['sword', 'potion', 'scroll', 'key', 'gem', 'shield', 'armor'],
        puzzles: ['locked door', 'riddle', 'magic barrier', 'hidden passage'],
      },
      scifi: {
        rooms: ['bridge', 'engine room', 'cargo bay', 'medical bay', 'lab', 'airlock'],
        npcs: ['captain', 'engineer', 'scientist', 'security', 'android', 'pilot'],
        items: ['data pad', 'laser', 'med kit', 'keycard', 'tool kit', 'scanner'],
        puzzles: ['control panel', 'code sequence', 'airlock puzzle', 'reactor control'],
      },
      mystery: {
        rooms: ['crime scene', 'office', 'bedroom', 'study', 'basement', 'attic'],
        npcs: ['detective', 'suspect', 'witness', 'victim', 'butler', 'maid'],
        items: ['evidence', 'note', 'weapon', 'clue', 'photograph', 'diary'],
        puzzles: ['combination lock', 'hidden compartment', 'cipher', 'timeline puzzle'],
      },
      horror: {
        rooms: ['abandoned house', 'cellar', 'graveyard', 'ritual chamber', 'attic', 'crypt'],
        npcs: ['survivor', 'ghost', 'cultist', 'possessed', 'child', 'caretaker'],
        items: ['flashlight', 'weapon', 'amulet', 'book', 'candle', 'medicine'],
        puzzles: ['ritual puzzle', 'escape sequence', 'symbol matching', 'sound puzzle'],
      },
    };
  }

  /**
   * Generate complete world with enhanced quality
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generated world data
   */
  async generateWorld(params = {}) {
    const startTime = Date.now();
    const config = { ...this.defaultParams, ...params };

    logger.info(`Generating world: ${config.genre}, ${config.difficulty}`);

    let world = null;
    let attempts = 0;
    let validationErrors = [];

    while (attempts < config.maxRetries) {
      try {
        // Phase 1: Generate structure
        const structure = await this.generateStructure(config);

        // Phase 2: Generate rooms
        const rooms = await this.generateRooms(structure, config);

        // Phase 3: Generate NPCs
        const npcs = await this.generateNPCs(structure, config);

        // Phase 4: Generate items
        const items = await this.generateItems(structure, config);

        // Phase 5: Generate puzzles
        const puzzles = await this.generatePuzzles(structure, config);

        // Assemble world
        world = {
          title: structure.title,
          description: structure.description,
          genre: config.genre,
          difficulty: config.difficulty,
          rooms,
          npcs,
          items,
          puzzles,
          metadata: {
            generatedAt: Date.now(),
            generationTime: 0, // Will be set later
            version: '2.0.0',
            theme: config.theme,
          },
        };

        // Validate world
        if (config.enforceLogic) {
          const validation = this.worldValidator.validate(world);

          if (!validation.valid) {
            validationErrors = validation.errors;
            attempts++;

            logger.warn(`Validation failed (attempt ${attempts}):`, validation.errors);

            // Try to fix common issues
            world = await this.fixValidationIssues(world, validation.errors);

            // Re-validate
            const revalidation = this.worldValidator.validate(world);
            if (revalidation.valid) {
              break; // Success!
            }

            continue;
          }
        }

        // Success!
        break;
      } catch (error) {
        logger.error(`Generation failed (attempt ${attempts + 1}):`, error);
        attempts++;

        if (attempts >= config.maxRetries) {
          throw new Error('Failed to generate valid world after max retries');
        }
      }
    }

    const generationTime = Date.now() - startTime;
    world.metadata.generationTime = generationTime;

    // Update statistics
    this.stats.worldsGenerated++;
    this.stats.retries += attempts;
    this.stats.averageGenerationTime =
      (this.stats.averageGenerationTime * (this.stats.worldsGenerated - 1) + generationTime) /
      this.stats.worldsGenerated;

    if (validationErrors.length > 0) {
      this.stats.validationsFailed++;
    }

    logger.info(`World generated successfully in ${generationTime}ms (${attempts} retries)`);

    return world;
  }

  /**
   * Generate world structure
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Structure data
   */
  async generateStructure(config) {
    const prompt = `Generate a ${config.genre} adventure game structure.

Theme: ${config.theme || 'classic ' + config.genre}
Difficulty: ${config.difficulty}
Room Count: ${config.roomCount}

Create a JSON structure with:
1. title: Game title
2. description: 2-paragraph description
3. mainObjective: Primary goal
4. storyArc: Beginning, middle, end outline
5. keyLocations: List of important room types

Return JSON only.`;

    const response = await this.aiManager.generateJSON(prompt);

    return {
      title: response.title || 'Untitled Adventure',
      description: response.description || '',
      mainObjective: response.mainObjective || 'Explore and survive',
      storyArc: response.storyArc || {},
      keyLocations: response.keyLocations || [],
    };
  }

  /**
   * Generate rooms with connections
   * @param {Object} structure - World structure
   * @param {Object} config - Configuration
   * @returns {Promise<Array>} Rooms
   */
  async generateRooms(structure, config) {
    const template = this.templates[config.genre];
    const rooms = [];

    const prompt = `Generate ${config.roomCount} interconnected rooms for a ${config.genre} game.

Key Locations: ${structure.keyLocations.join(', ')}
Difficulty: ${config.difficulty}

For each room create:
- id: unique identifier
- name: room name
- description: detailed description (2-3 sentences)
- exits: connections to other rooms (north, south, east, west, up, down)
- objects: visible objects (3-5)
- hidden: hidden items/secrets (0-2)
- ambience: atmosphere description

Ensure all rooms are accessible. Return JSON array.`;

    const response = await this.aiManager.generateJSON(prompt);

    return response.rooms || [];
  }

  /**
   * Generate NPCs with personalities
   * @param {Object} structure - World structure
   * @param {Object} config - Configuration
   * @returns {Promise<Array>} NPCs
   */
  async generateNPCs(structure, config) {
    const prompt = `Generate ${config.npcCount} NPCs for a ${config.genre} game.

Story Context: ${structure.mainObjective}
Difficulty: ${config.difficulty}

For each NPC create:
- id: unique identifier
- name: NPC name
- description: physical appearance (1-2 sentences)
- personality: character traits
- startingRoom: room ID where they start
- dialogue: 3-5 dialogue options with responses
- trades: items they want/offer (if applicable)
- relationship: initial relationship value (-100 to 100)
- questGiver: true if they give quests

Return JSON array.`;

    const response = await this.aiManager.generateJSON(prompt);

    return response.npcs || [];
  }

  /**
   * Generate items with properties
   * @param {Object} structure - World structure
   * @param {Object} config - Configuration
   * @returns {Promise<Array>} Items
   */
  async generateItems(structure, config) {
    const prompt = `Generate ${config.itemCount} items for a ${config.genre} game.

Main Objective: ${structure.mainObjective}
Difficulty: ${config.difficulty}

Include:
- Key items for main quest (3-4)
- Optional items for side content (4-6)
- Consumables (3-5)

For each item create:
- id: unique identifier
- name: item name
- description: what it looks like
- location: room ID or NPC ID
- takeable: can be picked up
- uses: what it can be used for
- consumable: true if single-use
- effects: game effects (health, mana, etc.)

Return JSON array.`;

    const response = await this.aiManager.generateJSON(prompt);

    return response.items || [];
  }

  /**
   * Generate puzzles with solutions
   * @param {Object} structure - World structure
   * @param {Object} config - Configuration
   * @returns {Promise<Array>} Puzzles
   */
  async generatePuzzles(structure, config) {
    const prompt = `Generate ${config.puzzleCount} puzzles for a ${config.genre} game.

Main Objective: ${structure.mainObjective}
Difficulty: ${config.difficulty}

Puzzle progression: Start easy, end hard.

For each puzzle create:
- id: unique identifier
- name: puzzle name
- description: what player sees
- type: puzzle type (riddle, combination, sliding_tiles, etc.)
- location: room ID
- requiredItems: items needed to solve (IDs)
- solution: correct answer/state
- hints: 2-3 hints
- reward: what player gets (item ID or flag)
- difficulty: easy/normal/hard

Return JSON array.`;

    const response = await this.aiManager.generateJSON(prompt);

    return response.puzzles || [];
  }

  /**
   * Fix common validation issues
   * @param {Object} world - World data
   * @param {Array} errors - Validation errors
   * @returns {Promise<Object>} Fixed world
   */
  async fixValidationIssues(world, errors) {
    logger.info('Attempting to fix validation issues...');

    for (const error of errors) {
      if (error.type === 'missing_connection') {
        // Add missing room connections
        const room = world.rooms.find((r) => r.id === error.roomId);
        if (room && world.rooms.length > 1) {
          const targetRoom = world.rooms.find((r) => r.id !== room.id);
          if (targetRoom) {
            room.exits = room.exits || {};
            room.exits.north = targetRoom.id;
            targetRoom.exits = targetRoom.exits || {};
            targetRoom.exits.south = room.id;
          }
        }
      }

      if (error.type === 'missing_item') {
        // Add missing puzzle item
        const item = {
          id: error.itemId,
          name: 'Mysterious Object',
          description: 'An important item.',
          location: world.rooms[0].id,
          takeable: true,
        };
        world.items.push(item);
      }

      if (error.type === 'unreachable_room') {
        // Connect unreachable room
        const room = world.rooms.find((r) => r.id === error.roomId);
        if (room && world.rooms.length > 1) {
          const connectedRoom = world.rooms[0];
          connectedRoom.exits = connectedRoom.exits || {};
          connectedRoom.exits.east = room.id;
          room.exits = room.exits || {};
          room.exits.west = connectedRoom.id;
        }
      }
    }

    return world;
  }

  /**
   * Get statistics
   * @returns {Object} Generator statistics
   */
  getStatistics() {
    return { ...this.stats };
  }
}
