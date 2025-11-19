/**
 * World Templates Library
 * Pre-built templates for quick world creation
 */

export const WORLD_TEMPLATES = {
  /**
   * Empty Template - Blank canvas
   */
  empty: {
    metadata: {
      title: 'Untitled Adventure',
      author: '',
      description: '',
      genre: 'adventure',
      version: '1.0',
    },
    startRoom: 'start',
    rooms: [
      {
        id: 'start',
        name: 'Starting Room',
        description: 'You are in an empty room.',
        graphics: {
          backgroundColor: '#0000AA',
          primitives: [],
        },
        exits: {},
        objects: [],
        items: [],
        npcs: [],
      },
    ],
    objects: [],
    items: [],
    npcs: [],
    puzzles: [],
    achievements: [],
    endings: [],
    initialState: {
      score: 0,
      health: 100,
      maxHealth: 100,
      currentRoom: 'start',
      inventory: [],
    },
  },

  /**
   * Medieval Castle Template
   */
  medievalCastle: {
    metadata: {
      title: 'Castle Adventure',
      author: '',
      description: 'Explore a medieval castle',
      genre: 'fantasy',
      version: '1.0',
    },
    startRoom: 'courtyard',
    rooms: [
      {
        id: 'courtyard',
        name: 'Castle Courtyard',
        description: 'A grand courtyard with cobblestone paths. The castle entrance looms to the north.',
        graphics: {
          backgroundColor: '#555555',
          primitives: [
            // Castle walls
            { type: 'rect', x: 0, y: 0, width: 50, height: 200, color: '#888888', filled: true },
            { type: 'rect', x: 270, y: 0, width: 50, height: 200, color: '#888888', filled: true },
            // Gate
            { type: 'rect', x: 130, y: 60, width: 60, height: 80, color: '#AA5500', filled: true },
            // Flag
            { type: 'rect', x: 60, y: 20, width: 3, height: 40, color: '#AAAAAA', filled: true },
            { type: 'polygon', points: [[63, 20], [90, 30], [63, 40]], color: '#FF5555', filled: true },
          ],
        },
        exits: {
          north: { room: 'great_hall', blocked: false },
          east: { room: 'armory', blocked: false },
          west: { room: 'gardens', blocked: false },
        },
        objects: ['fountain_castle'],
        items: [],
        npcs: [],
      },
      {
        id: 'great_hall',
        name: 'Great Hall',
        description: 'A magnificent hall with high ceilings and a long dining table.',
        graphics: {
          backgroundColor: '#AA5500',
          primitives: [
            // Long table
            { type: 'rect', x: 80, y: 120, width: 160, height: 40, color: '#885500', filled: true },
            // Throne
            { type: 'rect', x: 150, y: 60, width: 20, height: 30, color: '#FFFF55', filled: true },
            // Chandeliers
            { type: 'circle', x: 100, y: 40, radius: 8, color: '#FFFF55', filled: true },
            { type: 'circle', x: 220, y: 40, radius: 8, color: '#FFFF55', filled: true },
          ],
        },
        exits: {
          south: { room: 'courtyard', blocked: false },
          up: { room: 'tower', blocked: false },
        },
        objects: ['throne', 'table'],
        items: [],
        npcs: ['king'],
      },
      {
        id: 'armory',
        name: 'Castle Armory',
        description: 'Weapons and armor line the walls.',
        graphics: {
          backgroundColor: '#555555',
          primitives: [
            // Weapon racks
            { type: 'line', x1: 40, y1: 80, x2: 80, y2: 80, color: '#AAAAAA' },
            { type: 'line', x1: 240, y1: 80, x2: 280, y2: 80, color: '#AAAAAA' },
            // Shields
            { type: 'circle', x: 60, y: 60, radius: 12, color: '#AA0000', filled: true },
            { type: 'circle', x: 260, y: 60, radius: 12, color: '#0000AA', filled: true },
          ],
        },
        exits: {
          west: { room: 'courtyard', blocked: false },
        },
        objects: ['weapon_rack'],
        items: ['sword'],
        npcs: [],
      },
      {
        id: 'gardens',
        name: 'Royal Gardens',
        description: 'Beautiful gardens with flowers and fountains.',
        graphics: {
          backgroundColor: '#00AA00',
          primitives: [
            // Trees
            { type: 'rect', x: 50, y: 100, width: 10, height: 40, color: '#885500', filled: true },
            { type: 'circle', x: 55, y: 90, radius: 20, color: '#00FF00', filled: true },
            { type: 'rect', x: 260, y: 100, width: 10, height: 40, color: '#885500', filled: true },
            { type: 'circle', x: 265, y: 90, radius: 20, color: '#00FF00', filled: true },
            // Fountain
            { type: 'circle', x: 160, y: 120, radius: 20, color: '#5555FF', filled: true },
          ],
        },
        exits: {
          east: { room: 'courtyard', blocked: false },
        },
        objects: ['garden_fountain'],
        items: ['rose'],
        npcs: [],
      },
      {
        id: 'tower',
        name: 'Castle Tower',
        description: 'The highest point of the castle with a view of the kingdom.',
        graphics: {
          backgroundColor: '#5555FF',
          primitives: [
            // Window
            { type: 'rect', x: 120, y: 60, width: 80, height: 60, color: '#000000', filled: true },
            // View outside
            { type: 'rect', x: 125, y: 65, width: 70, height: 50, color: '#00AA00', filled: true },
            // Telescope
            { type: 'rect', x: 200, y: 130, width: 40, height: 5, color: '#AAAAAA', filled: true },
          ],
        },
        exits: {
          down: { room: 'great_hall', blocked: false },
        },
        objects: ['telescope'],
        items: ['spyglass'],
        npcs: [],
      },
    ],
    objects: [
      { id: 'fountain_castle', name: 'stone fountain', description: 'A decorative fountain', canTake: false, scenery: true },
      { id: 'throne', name: 'royal throne', description: 'An ornate golden throne', canTake: false, scenery: true },
      { id: 'table', name: 'dining table', description: 'A long wooden table', canTake: false, scenery: true },
      { id: 'weapon_rack', name: 'weapon rack', description: 'Holds various weapons', canTake: false, scenery: true },
      { id: 'garden_fountain', name: 'garden fountain', description: 'A beautiful fountain', canTake: false, scenery: true },
      { id: 'telescope', name: 'telescope', description: 'For viewing distant lands', canTake: false, canUse: true },
    ],
    items: [
      { id: 'sword', name: 'iron sword', description: 'A sturdy weapon', takeable: true, usable: true },
      { id: 'rose', name: 'red rose', description: 'A beautiful flower', takeable: true, usable: false },
      { id: 'spyglass', name: 'brass spyglass', description: 'See far away', takeable: true, usable: true },
    ],
    npcs: [
      {
        id: 'king',
        name: 'King Arthur',
        description: 'The wise king of the castle',
        location: 'great_hall',
        dialogue: {
          greeting: 'Welcome to my castle, brave adventurer!',
          topics: {
            quest: 'I need someone to retrieve the ancient artifact from the tower.',
          },
        },
        relationship: 50,
      },
    ],
    puzzles: [],
    achievements: [],
    endings: [],
  },

  /**
   * Dungeon Crawler Template
   */
  dungeon: {
    metadata: {
      title: 'Dungeon Adventure',
      author: '',
      description: 'Explore dangerous dungeons',
      genre: 'fantasy',
      version: '1.0',
    },
    startRoom: 'dungeon_entrance',
    rooms: [
      {
        id: 'dungeon_entrance',
        name: 'Dungeon Entrance',
        description: 'Dark stone stairs descend into darkness.',
        graphics: {
          backgroundColor: '#333333',
          primitives: [
            // Stairs
            { type: 'rect', x: 100, y: 150, width: 120, height: 10, color: '#555555', filled: true },
            { type: 'rect', x: 110, y: 140, width: 100, height: 10, color: '#666666', filled: true },
            { type: 'rect', x: 120, y: 130, width: 80, height: 10, color: '#555555', filled: true },
            // Torch
            { type: 'rect', x: 50, y: 80, width: 5, height: 20, color: '#885500', filled: true },
            { type: 'polygon', points: [[48, 80], [52, 70], [57, 80]], color: '#FF5555', filled: true },
          ],
        },
        exits: {
          down: { room: 'dark_corridor', blocked: false },
        },
        objects: ['torch_entrance'],
        items: [],
        npcs: [],
      },
      {
        id: 'dark_corridor',
        name: 'Dark Corridor',
        description: 'A long, dark corridor with wet stone walls.',
        graphics: {
          backgroundColor: '#000000',
          primitives: [
            // Walls
            { type: 'rect', x: 0, y: 0, width: 30, height: 200, color: '#222222', filled: true },
            { type: 'rect', x: 290, y: 0, width: 30, height: 200, color: '#222222', filled: true },
            // Water drips
            { type: 'circle', x: 100, y: 100, radius: 2, color: '#5555FF', filled: true },
            { type: 'circle', x: 220, y: 80, radius: 2, color: '#5555FF', filled: true },
          ],
        },
        exits: {
          up: { room: 'dungeon_entrance', blocked: false },
          north: { room: 'treasure_room', blocked: true },
          south: { room: 'monster_lair', blocked: false },
        },
        objects: ['locked_door'],
        items: ['rusty_key'],
        npcs: [],
      },
      {
        id: 'treasure_room',
        name: 'Treasure Chamber',
        description: 'Gold and jewels shimmer in the torchlight.',
        graphics: {
          backgroundColor: '#AA5500',
          primitives: [
            // Treasure chests
            { type: 'rect', x: 80, y: 140, width: 40, height: 30, color: '#FFAA00', filled: true },
            { type: 'rect', x: 200, y: 140, width: 40, height: 30, color: '#FFAA00', filled: true },
            // Gold piles
            { type: 'circle', x: 160, y: 160, radius: 15, color: '#FFFF00', filled: true },
          ],
        },
        exits: {
          south: { room: 'dark_corridor', blocked: false },
        },
        objects: ['treasure_chest'],
        items: ['gold_coins', 'magic_amulet'],
        npcs: [],
      },
      {
        id: 'monster_lair',
        name: 'Monster Lair',
        description: 'Bones litter the floor. Something dangerous lives here.',
        graphics: {
          backgroundColor: '#550000',
          primitives: [
            // Bones
            { type: 'rect', x: 60, y: 170, width: 20, height: 5, color: '#FFFFFF', filled: true },
            { type: 'rect', x: 240, y: 165, width: 15, height: 5, color: '#FFFFFF', filled: true },
            // Monster eyes (in darkness)
            { type: 'circle', x: 150, y: 80, radius: 5, color: '#FF0000', filled: true },
            { type: 'circle', x: 170, y: 80, radius: 5, color: '#FF0000', filled: true },
          ],
        },
        exits: {
          north: { room: 'dark_corridor', blocked: false },
        },
        objects: ['bones'],
        items: [],
        npcs: ['dungeon_monster'],
      },
    ],
    objects: [
      { id: 'torch_entrance', name: 'burning torch', description: 'Provides light', canTake: false, scenery: true },
      { id: 'locked_door', name: 'locked door', description: 'Requires a key', canTake: false, locked: true },
      { id: 'treasure_chest', name: 'treasure chest', description: 'Full of riches', canTake: false, canOpen: true },
      { id: 'bones', name: 'pile of bones', description: 'Ancient remains', canTake: false, scenery: true },
    ],
    items: [
      { id: 'rusty_key', name: 'rusty key', description: 'Opens the locked door', takeable: true, usable: true },
      { id: 'gold_coins', name: 'gold coins', description: 'Valuable currency', takeable: true, usable: false },
      { id: 'magic_amulet', name: 'magic amulet', description: 'Protects from harm', takeable: true, usable: true },
    ],
    npcs: [
      {
        id: 'dungeon_monster',
        name: 'Dungeon Monster',
        description: 'A fearsome creature',
        location: 'monster_lair',
        hostile: true,
        dialogue: {
          greeting: '*Roars menacingly*',
        },
      },
    ],
  },

  /**
   * Space Station Template
   */
  spaceStation: {
    metadata: {
      title: 'Space Station Adventure',
      author: '',
      description: 'Explore a space station',
      genre: 'scifi',
      version: '1.0',
    },
    startRoom: 'docking_bay',
    rooms: [
      {
        id: 'docking_bay',
        name: 'Docking Bay',
        description: 'Your ship is docked here. Stars visible through the bay doors.',
        graphics: {
          backgroundColor: '#000000',
          primitives: [
            // Stars
            { type: 'circle', x: 50, y: 30, radius: 1, color: '#FFFFFF', filled: true },
            { type: 'circle', x: 120, y: 60, radius: 1, color: '#FFFFFF', filled: true },
            { type: 'circle', x: 250, y: 40, radius: 1, color: '#FFFFFF', filled: true },
            // Ship
            { type: 'polygon', points: [[140, 140], [180, 140], [160, 120]], color: '#AAAAAA', filled: true },
            // Bay doors
            { type: 'rect', x: 0, y: 0, width: 50, height: 200, color: '#333333', filled: true },
            { type: 'rect', x: 270, y: 0, width: 50, height: 200, color: '#333333', filled: true },
          ],
        },
        exits: {
          north: { room: 'main_corridor', blocked: false },
        },
        objects: ['ship', 'bay_doors'],
        items: [],
        npcs: [],
      },
      {
        id: 'main_corridor',
        name: 'Main Corridor',
        description: 'A sterile white corridor with blinking lights.',
        graphics: {
          backgroundColor: '#FFFFFF',
          primitives: [
            // Floor
            { type: 'rect', x: 0, y: 150, width: 320, height: 50, color: '#AAAAAA', filled: true },
            // Lights
            { type: 'circle', x: 80, y: 40, radius: 5, color: '#55FF55', filled: true },
            { type: 'circle', x: 240, y: 40, radius: 5, color: '#55FF55', filled: true },
          ],
        },
        exits: {
          south: { room: 'docking_bay', blocked: false },
          east: { room: 'control_room', blocked: false },
          west: { room: 'crew_quarters', blocked: false },
        },
        objects: ['light_panel'],
        items: [],
        npcs: [],
      },
      {
        id: 'control_room',
        name: 'Control Room',
        description: 'Computer terminals and control panels line the walls.',
        graphics: {
          backgroundColor: '#0000AA',
          primitives: [
            // Main screen
            { type: 'rect', x: 100, y: 60, width: 120, height: 80, color: '#000000', filled: true },
            { type: 'rect', x: 105, y: 65, width: 110, height: 70, color: '#00AA00', filled: true },
            // Control panels
            { type: 'rect', x: 50, y: 150, width: 220, height: 30, color: '#555555', filled: true },
          ],
        },
        exits: {
          west: { room: 'main_corridor', blocked: false },
        },
        objects: ['main_computer', 'control_panel'],
        items: ['access_card'],
        npcs: [],
      },
      {
        id: 'crew_quarters',
        name: 'Crew Quarters',
        description: 'Bunks and personal lockers for the crew.',
        graphics: {
          backgroundColor: '#555555',
          primitives: [
            // Bunks
            { type: 'rect', x: 40, y: 100, width: 60, height: 30, color: '#888888', filled: true },
            { type: 'rect', x: 40, y: 140, width: 60, height: 30, color: '#888888', filled: true },
            { type: 'rect', x: 220, y: 100, width: 60, height: 30, color: '#888888', filled: true },
            // Lockers
            { type: 'rect', x: 150, y: 120, width: 40, height: 60, color: '#AAAAAA', filled: true },
          ],
        },
        exits: {
          east: { room: 'main_corridor', blocked: false },
        },
        objects: ['locker'],
        items: ['space_suit'],
        npcs: [],
      },
    ],
    objects: [
      { id: 'ship', name: 'your ship', description: 'Your personal spacecraft', canTake: false, scenery: true },
      { id: 'bay_doors', name: 'bay doors', description: 'Large metal doors', canTake: false, scenery: true },
      { id: 'light_panel', name: 'light panel', description: 'Control panel for lights', canTake: false, canUse: true },
      { id: 'main_computer', name: 'main computer', description: 'Station control system', canTake: false, canUse: true },
      { id: 'control_panel', name: 'control panel', description: 'Various controls', canTake: false, canUse: true },
      { id: 'locker', name: 'storage locker', description: 'Personal storage', canTake: false, canOpen: true },
    ],
    items: [
      { id: 'access_card', name: 'access card', description: 'Grants security access', takeable: true, usable: true },
      { id: 'space_suit', name: 'space suit', description: 'For spacewalks', takeable: true, usable: true },
    ],
    npcs: [],
  },
};

export default WORLD_TEMPLATES;
