/**
 * WorldGenerator - Utilities for game world generation
 *
 * Provides both AI-generated and static world creation capabilities,
 * along with world manipulation and enhancement utilities.
 */

import logger from './logger.js';

export class WorldGenerator {
  constructor(aiManager) {
    this.aiManager = aiManager;
    this.logger = logger;
  }

  /**
   * Generate a complete world using AI
   * @param {string} theme - Theme for the world
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated world data
   */
  async generateAIWorld(theme, options = {}) {
    this.logger.log(`Generating AI world with theme: ${theme}`);

    try {
      const worldData = await this.aiManager.generateWorld(theme);

      // Post-process the world
      if (options.enhanceGraphics) {
        this.enhanceGraphics(worldData);
      }

      if (options.addAmbientSounds) {
        this.addAmbientSounds(worldData);
      }

      return worldData;
    } catch (error) {
      this.logger.error('AI world generation failed:', error);
      throw error;
    }
  }

  /**
   * Create a static test world for development
   * @param {string} type - World type (small, medium, large, custom)
   * @returns {Object} Static world data
   */
  createStaticWorld(type = 'small') {
    this.logger.log(`Creating static world: ${type}`);

    switch (type) {
      case 'small':
        return this.createSmallTestWorld();
      case 'medium':
        return this.createMediumTestWorld();
      case 'large':
        return this.createLargeTestWorld();
      default:
        return this.createSmallTestWorld();
    }
  }

  /**
   * Create a small test world (3-5 rooms)
   * @private
   * @returns {Object} World data
   */
  createSmallTestWorld() {
    return {
      version: '1.0.0',
      metadata: {
        title: 'Test Manor',
        theme: 'haunted mansion',
        generatedAt: new Date().toISOString(),
        difficulty: 'easy',
        estimatedPlaytime: '10-15 minutes',
        mockData: true,
      },
      rooms: {
        entrance: {
          name: 'Manor Entrance',
          description:
            'You stand at the entrance of a decaying Victorian manor. The heavy oak door creaks ominously.',
          graphics: {
            primitives: [
              { type: 'rect', color: 0, dims: [0, 0, 320, 200] },
              { type: 'rect', color: 8, dims: [0, 120, 320, 80] },
              { type: 'rect', color: 6, dims: [120, 40, 80, 100] },
              { type: 'rect', color: 0, dims: [130, 50, 60, 80] },
            ],
          },
          exits: {
            north: { roomId: 'hall', enabled: true },
          },
          objects: ['door'],
          items: [],
        },
        hall: {
          name: 'Grand Hall',
          description:
            'A vast hall with a dusty chandelier hanging from the ceiling. Portraits line the walls.',
          graphics: {
            primitives: [
              { type: 'rect', color: 0, dims: [0, 0, 320, 200] },
              { type: 'rect', color: 7, dims: [0, 100, 320, 100] },
              {
                type: 'polygon',
                color: 14,
                points: [
                  [160, 60],
                  [150, 70],
                  [170, 70],
                ],
              },
            ],
          },
          exits: {
            south: { roomId: 'entrance', enabled: true },
            east: { roomId: 'library', enabled: true },
            west: {
              roomId: 'dining',
              enabled: false,
              requirement: 'dining_key',
            },
          },
          objects: ['chandelier'],
          items: ['candle'],
        },
        library: {
          name: 'Library',
          description:
            'Towering bookshelves surround you. The smell of old paper fills the air.',
          graphics: {
            primitives: [
              { type: 'rect', color: 0, dims: [0, 0, 320, 200] },
              { type: 'rect', color: 6, dims: [10, 40, 60, 120] },
              { type: 'rect', color: 6, dims: [250, 40, 60, 120] },
            ],
          },
          exits: {
            west: { roomId: 'hall', enabled: true },
          },
          objects: ['bookshelf'],
          items: ['book', 'dining_key'],
        },
        dining: {
          name: 'Dining Room',
          description:
            'A long dining table dominates the room. Cobwebs hang from the corners.',
          graphics: {
            primitives: [
              { type: 'rect', color: 0, dims: [0, 0, 320, 200] },
              { type: 'rect', color: 6, dims: [60, 100, 200, 40] },
            ],
          },
          exits: {
            east: { roomId: 'hall', enabled: true },
          },
          objects: ['table'],
          items: ['silver_key'],
        },
      },
      items: {
        candle: {
          name: 'candle',
          description: 'A half-melted wax candle',
          takeable: true,
          size: 1,
          weight: 1,
          uses: ['light'],
        },
        book: {
          name: 'ancient book',
          description: 'A leather-bound tome with strange symbols',
          takeable: true,
          size: 2,
          weight: 2,
          readText:
            'The book contains cryptic passages about hidden treasures.',
        },
        dining_key: {
          name: 'brass key',
          description: 'A tarnished brass key with ornate engravings',
          takeable: true,
          size: 1,
          weight: 1,
          uses: ['unlock_dining'],
        },
        silver_key: {
          name: 'silver key',
          description: 'A gleaming silver key',
          takeable: true,
          size: 1,
          weight: 1,
          uses: ['unlock_secret'],
        },
      },
      objects: {
        door: {
          name: 'oak door',
          description: 'A heavy oak door with iron fittings',
          takeable: false,
          states: ['closed', 'open'],
          currentState: 'closed',
          interactions: {
            open: { newState: 'open' },
          },
        },
        chandelier: {
          name: 'chandelier',
          description: 'A grand crystal chandelier covered in dust',
          takeable: false,
        },
        bookshelf: {
          name: 'bookshelf',
          description: 'Tall wooden shelves filled with ancient books',
          takeable: false,
          searchable: true,
        },
        table: {
          name: 'dining table',
          description: 'A long oak table with intricate carvings',
          takeable: false,
        },
      },
      npcs: {},
      puzzles: [
        {
          id: 'access_dining',
          description: 'Find a way to access the locked dining room',
          steps: [
            { action: 'search', target: 'bookshelf', location: 'library' },
            { action: 'take', item: 'dining_key', location: 'library' },
            { action: 'unlock', target: 'dining_door', requires: 'dining_key' },
          ],
          reward: { points: 10, item: 'silver_key' },
          hints: [
            { text: 'The library might contain useful items', delay: 60000 },
            { text: 'Try searching the bookshelf carefully', delay: 120000 },
          ],
        },
      ],
      vocabulary: {
        verbs: [
          'look',
          'take',
          'drop',
          'use',
          'open',
          'close',
          'read',
          'search',
          'unlock',
          'examine',
        ],
        synonyms: {
          get: 'take',
          grab: 'take',
          pickup: 'take',
          examine: 'look',
          inspect: 'look',
        },
      },
      scoring: {
        maxPoints: 50,
        achievements: [
          { id: 'enter_manor', name: 'First Steps', points: 5 },
          { id: 'find_key', name: 'Key Finder', points: 10 },
          { id: 'access_dining', name: 'Dining Access', points: 10 },
        ],
      },
    };
  }

  /**
   * Create a medium test world (6-10 rooms)
   * @private
   * @returns {Object} World data
   */
  createMediumTestWorld() {
    // Extend the small world with more rooms
    const world = this.createSmallTestWorld();

    world.metadata.title = 'Extended Manor';
    world.metadata.estimatedPlaytime = '20-30 minutes';

    // Add more rooms
    world.rooms.kitchen = {
      name: 'Kitchen',
      description:
        'A dusty kitchen with rusted pots and pans hanging from the ceiling.',
      graphics: {
        primitives: [
          { type: 'rect', color: 0, dims: [0, 0, 320, 200] },
          { type: 'rect', color: 7, dims: [0, 100, 320, 100] },
        ],
      },
      exits: {
        north: { roomId: 'dining', enabled: true },
      },
      objects: ['stove'],
      items: ['knife'],
    };

    world.rooms.dining.exits.south = { roomId: 'kitchen', enabled: true };

    // Add corresponding items and objects
    world.items.knife = {
      name: 'rusty knife',
      description: 'A rusty but still sharp kitchen knife',
      takeable: true,
      size: 1,
      weight: 1,
      uses: ['cut'],
    };

    world.objects.stove = {
      name: 'old stove',
      description: 'An antique cast iron stove',
      takeable: false,
    };

    return world;
  }

  /**
   * Create a large test world (15+ rooms)
   * @private
   * @returns {Object} World data
   */
  createLargeTestWorld() {
    // Use the demo world from demos as base
    const world = this.createMediumTestWorld();

    world.metadata.title = 'Complete Manor Estate';
    world.metadata.estimatedPlaytime = '45-60 minutes';
    world.metadata.difficulty = 'medium';

    // Would add many more rooms, NPCs, puzzles here
    // For now, just return the medium world
    return world;
  }

  /**
   * Enhance graphics in a world with better primitives
   * @param {Object} worldData - World data to enhance
   */
  enhanceGraphics(worldData) {
    this.logger.log('Enhancing world graphics');

    for (const room of Object.values(worldData.rooms)) {
      if (room.graphics && room.graphics.primitives) {
        // Ensure all primitives have valid structure
        room.graphics.primitives = room.graphics.primitives.filter(
          (primitive) => {
            return primitive.type && primitive.color !== undefined;
          }
        );

        // Add sky if no background
        if (
          !room.graphics.primitives.some(
            (p) => p.type === 'rect' && p.dims[1] === 0
          )
        ) {
          room.graphics.primitives.unshift({
            type: 'rect',
            color: 9, // Light blue sky
            dims: [0, 0, 320, 80],
          });
        }
      }
    }
  }

  /**
   * Add ambient sound definitions to rooms
   * @param {Object} worldData - World data to enhance
   */
  addAmbientSounds(worldData) {
    this.logger.log('Adding ambient sounds to world');

    for (const [roomId, room] of Object.entries(worldData.rooms)) {
      // Add ambient sound based on room type
      if (!room.ambientSound) {
        // Detect room type from name/description
        const description = room.description.toLowerCase();
        const name = room.name.toLowerCase();

        if (name.includes('forest') || description.includes('trees')) {
          room.ambientSound = 'forest';
        } else if (name.includes('ocean') || description.includes('waves')) {
          room.ambientSound = 'ocean';
        } else if (name.includes('dungeon') || name.includes('cell')) {
          room.ambientSound = 'dungeon';
        } else if (name.includes('space') || description.includes('stars')) {
          room.ambientSound = 'space';
        } else {
          room.ambientSound = 'indoor';
        }
      }
    }
  }

  /**
   * Validate and fix common world issues
   * @param {Object} worldData - World data to validate
   * @returns {Object} Fixed world data
   */
  validateAndFix(worldData) {
    this.logger.log('Validating and fixing world data');

    const fixed = JSON.parse(JSON.stringify(worldData)); // Deep clone

    // Fix missing required fields
    if (!fixed.version) fixed.version = '1.0.0';
    if (!fixed.metadata) fixed.metadata = { title: 'Untitled Adventure' };
    if (!fixed.rooms) fixed.rooms = {};
    if (!fixed.items) fixed.items = {};
    if (!fixed.objects) fixed.objects = {};
    if (!fixed.npcs) fixed.npcs = {};
    if (!fixed.puzzles) fixed.puzzles = [];
    if (!fixed.vocabulary) fixed.vocabulary = { verbs: [], synonyms: {} };

    // Ensure start room exists
    if (!fixed.rooms.start && Object.keys(fixed.rooms).length > 0) {
      const firstRoomId = Object.keys(fixed.rooms)[0];
      fixed.rooms.start = fixed.rooms[firstRoomId];
      this.logger.warn(
        `No 'start' room found, using '${firstRoomId}' as start`
      );
    }

    // Fix broken exit references
    for (const [roomId, room] of Object.entries(fixed.rooms)) {
      if (room.exits) {
        for (const [direction, exit] of Object.entries(room.exits)) {
          if (exit.roomId && !fixed.rooms[exit.roomId]) {
            this.logger.warn(
              `Room ${roomId} has broken exit ${direction} to ${exit.roomId}, removing`
            );
            delete room.exits[direction];
          }
        }
      }
    }

    // Fix broken item/object references in rooms
    for (const [roomId, room] of Object.entries(fixed.rooms)) {
      if (room.items) {
        room.items = room.items.filter((itemId) => {
          if (!fixed.items[itemId]) {
            this.logger.warn(
              `Room ${roomId} references non-existent item ${itemId}, removing`
            );
            return false;
          }
          return true;
        });
      }

      if (room.objects) {
        room.objects = room.objects.filter((objectId) => {
          if (!fixed.objects[objectId]) {
            this.logger.warn(
              `Room ${roomId} references non-existent object ${objectId}, removing`
            );
            return false;
          }
          return true;
        });
      }
    }

    return fixed;
  }

  /**
   * Merge two worlds together
   * @param {Object} world1 - First world
   * @param {Object} world2 - Second world
   * @param {string} connectionRoom1 - Room in world1 to connect from
   * @param {string} connectionRoom2 - Room in world2 to connect to
   * @param {string} direction - Direction of connection
   * @returns {Object} Merged world
   */
  mergeWorlds(
    world1,
    world2,
    connectionRoom1,
    connectionRoom2,
    direction = 'north'
  ) {
    this.logger.log(
      `Merging worlds via ${connectionRoom1} -> ${connectionRoom2}`
    );

    const merged = JSON.parse(JSON.stringify(world1)); // Deep clone

    // Prefix world2 rooms to avoid conflicts
    const prefix = 'w2_';

    // Add world2 rooms with prefix
    for (const [roomId, room] of Object.entries(world2.rooms)) {
      const newRoomId = prefix + roomId;
      merged.rooms[newRoomId] = { ...room };

      // Update exit references
      if (merged.rooms[newRoomId].exits) {
        const updatedExits = {};
        for (const [dir, exit] of Object.entries(
          merged.rooms[newRoomId].exits
        )) {
          updatedExits[dir] = {
            ...exit,
            roomId: prefix + exit.roomId,
          };
        }
        merged.rooms[newRoomId].exits = updatedExits;
      }
    }

    // Create connection
    if (!merged.rooms[connectionRoom1].exits) {
      merged.rooms[connectionRoom1].exits = {};
    }

    merged.rooms[connectionRoom1].exits[direction] = {
      roomId: prefix + connectionRoom2,
      enabled: true,
    };

    // Merge items, objects, etc.
    merged.items = { ...merged.items, ...world2.items };
    merged.objects = { ...merged.objects, ...world2.objects };
    merged.npcs = { ...merged.npcs, ...world2.npcs };
    merged.puzzles = [...(merged.puzzles || []), ...(world2.puzzles || [])];

    return merged;
  }

  /**
   * Generate a random theme for world generation
   * @returns {string} Random theme
   */
  getRandomTheme() {
    const themes = [
      'haunted Victorian mansion',
      'abandoned space station',
      'enchanted forest kingdom',
      'underwater research facility',
      'medieval castle siege',
      'cyberpunk megacity',
      'ancient Egyptian tomb',
      'steampunk airship adventure',
      'post-apocalyptic wasteland',
      'fairy tale wonderland',
      'pirate island treasure hunt',
      'noir detective mystery',
      'wild west frontier town',
      'Japanese feudal village',
      'Antarctic research outpost',
    ];

    return themes[Math.floor(Math.random() * themes.length)];
  }
}

export default WorldGenerator;
