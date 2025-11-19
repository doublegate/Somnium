/**
 * Test World: The Dragon's Crown
 * A fantasy quest adventure in the style of King's Quest
 *
 * Quest: The ancient Dragon's Crown has been stolen by the dragon Malakor.
 * The kingdom is in peril without its magical protection. You must journey
 * through forests, temples, and mountains to retrieve the crown from the
 * dragon's lair and restore peace to the realm.
 */

export const FANTASY_WORLD = {
  metadata: {
    title: "The Dragon's Crown",
    author: 'Somnium Engine',
    version: '1.0',
    description:
      'A classic fantasy quest to retrieve a stolen crown from a dragon.',
    genre: 'fantasy',
    difficulty: 'medium',
    estimatedPlaytime: '45-60 minutes',
  },

  startRoom: 'village_square',

  // ROOMS
  rooms: [
    {
      id: 'village_square',
      name: 'Village Square',
      description:
        "The bustling heart of Thornhaven village. Colorful market stalls surround a central fountain. To the north, the Royal Castle looms on the hillside. The Golden Griffin tavern's sign swings in the breeze to the east. A dirt path leads south into the Whispering Woods.",
      graphics: {
        backgroundColor: '#00AA00', // Green
        primitives: [
          // Sky
          {
            type: 'rect',
            x: 0,
            y: 0,
            width: 320,
            height: 100,
            color: '#5555FF',
            filled: true,
          },
          // Fountain (center)
          {
            type: 'circle',
            x: 160,
            y: 140,
            radius: 25,
            color: '#AAAAAA',
            filled: true,
          },
          {
            type: 'circle',
            x: 160,
            y: 135,
            radius: 15,
            color: '#5555FF',
            filled: true,
          },
          // Water spray
          {
            type: 'line',
            x1: 160,
            y1: 120,
            x2: 160,
            y2: 110,
            color: '#55FFFF',
          },
          {
            type: 'line',
            x1: 155,
            y1: 122,
            x2: 150,
            y2: 115,
            color: '#55FFFF',
          },
          {
            type: 'line',
            x1: 165,
            y1: 122,
            x2: 170,
            y2: 115,
            color: '#55FFFF',
          },
          // Market stalls (left)
          {
            type: 'rect',
            x: 20,
            y: 120,
            width: 60,
            height: 40,
            color: '#AA5500',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [20, 120],
              [50, 100],
              [80, 120],
            ],
            color: '#FF5555',
            filled: true,
          },
          // Market stalls (right)
          {
            type: 'rect',
            x: 240,
            y: 120,
            width: 60,
            height: 40,
            color: '#AA5500',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [240, 120],
              [270, 100],
              [300, 120],
            ],
            color: '#55FF55',
            filled: true,
          },
          // Path south (dirt)
          {
            type: 'rect',
            x: 140,
            y: 170,
            width: 40,
            height: 30,
            color: '#AA5500',
            filled: true,
          },
        ],
      },
      exits: {
        north: { room: 'castle_throne', blocked: false },
        east: { room: 'tavern', blocked: false },
        south: { room: 'forest_path', blocked: false },
      },
      objects: ['fountain', 'market_stalls'],
      items: [],
      npcs: [],
    },

    {
      id: 'tavern',
      name: 'The Golden Griffin Tavern',
      description:
        'A cozy tavern filled with the aroma of roasted meat and ale. Wooden tables are occupied by villagers sharing tales and rumors. A large fireplace crackles in the corner. Martha the innkeeper polishes mugs behind the bar. A weathered notice board hangs by the door.',
      graphics: {
        backgroundColor: '#AA5500', // Brown
        primitives: [
          // Bar (left side)
          {
            type: 'rect',
            x: 10,
            y: 100,
            width: 80,
            height: 60,
            color: '#885500',
            filled: true,
          },
          // Mugs on bar
          {
            type: 'rect',
            x: 20,
            y: 110,
            width: 10,
            height: 15,
            color: '#FFFF55',
            filled: true,
          },
          {
            type: 'rect',
            x: 40,
            y: 110,
            width: 10,
            height: 15,
            color: '#FFFF55',
            filled: true,
          },
          {
            type: 'rect',
            x: 60,
            y: 110,
            width: 10,
            height: 15,
            color: '#FFFF55',
            filled: true,
          },
          // Fireplace (right side)
          {
            type: 'rect',
            x: 240,
            y: 100,
            width: 60,
            height: 70,
            color: '#555555',
            filled: true,
          },
          // Fire
          {
            type: 'polygon',
            points: [
              [250, 150],
              [260, 130],
              [270, 150],
            ],
            color: '#FF5555',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [265, 150],
              [270, 135],
              [280, 150],
            ],
            color: '#FFFF55',
            filled: true,
          },
          // Tables (center)
          {
            type: 'ellipse',
            x: 160,
            y: 140,
            radiusX: 30,
            radiusY: 20,
            color: '#885500',
            filled: true,
          },
          // Notice board (by door)
          {
            type: 'rect',
            x: 140,
            y: 60,
            width: 40,
            height: 30,
            color: '#AA5500',
            filled: true,
          },
          {
            type: 'rect',
            x: 145,
            y: 65,
            width: 30,
            height: 20,
            color: '#FFFFFF',
            filled: true,
          },
        ],
      },
      exits: {
        west: { room: 'village_square', blocked: false },
      },
      objects: ['bar', 'fireplace', 'notice_board', 'tables'],
      items: ['tavern_rumors'],
      npcs: ['innkeeper_martha'],
    },

    {
      id: 'castle_throne',
      name: 'Castle Throne Room',
      description:
        "The grand throne room of Castle Thornhaven. Tall stained glass windows cast colored light across marble floors. King Edmund sits upon his throne, his face etched with worry. The crown pedestal beside him stands empty - a stark reminder of the kingdom's stolen protection.",
      graphics: {
        backgroundColor: '#0000AA', // Blue
        primitives: [
          // Throne (elevated platform)
          {
            type: 'rect',
            x: 120,
            y: 120,
            width: 80,
            height: 20,
            color: '#555555',
            filled: true,
          },
          // Throne chair
          {
            type: 'rect',
            x: 140,
            y: 90,
            width: 40,
            height: 30,
            color: '#FFFF55',
            filled: true,
          },
          // Throne back
          {
            type: 'rect',
            x: 145,
            y: 60,
            width: 30,
            height: 30,
            color: '#FFFF55',
            filled: true,
          },
          // Empty crown pedestal
          {
            type: 'rect',
            x: 200,
            y: 110,
            width: 20,
            height: 30,
            color: '#AAAAAA',
            filled: true,
          },
          // Pedestal top (empty!)
          {
            type: 'rect',
            x: 195,
            y: 105,
            width: 30,
            height: 5,
            color: '#FFFFFF',
            filled: true,
          },
          // Stained glass windows
          {
            type: 'rect',
            x: 40,
            y: 40,
            width: 30,
            height: 60,
            color: '#FF5555',
            filled: true,
          },
          {
            type: 'rect',
            x: 250,
            y: 40,
            width: 30,
            height: 60,
            color: '#5555FF',
            filled: true,
          },
          // Red carpet
          {
            type: 'rect',
            x: 140,
            y: 140,
            width: 40,
            height: 60,
            color: '#AA0000',
            filled: true,
          },
        ],
      },
      exits: {
        south: { room: 'village_square', blocked: false },
        east: { room: 'wizard_tower', blocked: false },
      },
      objects: ['throne', 'crown_pedestal', 'stained_glass'],
      items: [],
      npcs: ['king_edmund'],
    },

    {
      id: 'wizard_tower',
      name: "Wizard's Tower",
      description:
        'A circular chamber filled with arcane wonders. Shelves overflow with dusty tomes and glowing potion bottles. Aldric the wizard studies an ancient spellbook at his workbench. A crystal ball on a pedestal swirls with mystical energies. Strange symbols glow on the stone walls.',
      graphics: {
        backgroundColor: '#550055', // Purple
        primitives: [
          // Workbench
          {
            type: 'rect',
            x: 200,
            y: 120,
            width: 80,
            height: 40,
            color: '#885500',
            filled: true,
          },
          // Spellbooks on bench
          {
            type: 'rect',
            x: 210,
            y: 110,
            width: 15,
            height: 10,
            color: '#AA0000',
            filled: true,
          },
          {
            type: 'rect',
            x: 230,
            y: 110,
            width: 15,
            height: 10,
            color: '#0000AA',
            filled: true,
          },
          {
            type: 'rect',
            x: 250,
            y: 110,
            width: 15,
            height: 10,
            color: '#00AA00',
            filled: true,
          },
          // Crystal ball on pedestal
          {
            type: 'rect',
            x: 70,
            y: 130,
            width: 20,
            height: 30,
            color: '#AAAAAA',
            filled: true,
          },
          {
            type: 'circle',
            x: 80,
            y: 120,
            radius: 15,
            color: '#5555FF',
            filled: true,
          },
          {
            type: 'circle',
            x: 80,
            y: 120,
            radius: 8,
            color: '#FFFFFF',
            filled: true,
          },
          // Potion bottles on shelves
          {
            type: 'rect',
            x: 20,
            y: 80,
            width: 8,
            height: 15,
            color: '#FF5555',
            filled: true,
          },
          {
            type: 'rect',
            x: 35,
            y: 80,
            width: 8,
            height: 15,
            color: '#55FF55',
            filled: true,
          },
          {
            type: 'rect',
            x: 50,
            y: 80,
            width: 8,
            height: 15,
            color: '#5555FF',
            filled: true,
          },
          // Glowing runes on walls
          {
            type: 'circle',
            x: 160,
            y: 60,
            radius: 8,
            color: '#FFFF55',
            filled: true,
          },
          {
            type: 'circle',
            x: 190,
            y: 70,
            radius: 6,
            color: '#55FFFF',
            filled: true,
          },
          {
            type: 'circle',
            x: 130,
            y: 65,
            radius: 7,
            color: '#FF55FF',
            filled: true,
          },
        ],
      },
      exits: {
        west: { room: 'castle_throne', blocked: false },
      },
      objects: ['workbench', 'crystal_ball', 'potion_shelves', 'runes'],
      items: ['healing_potion', 'magic_scroll_shield'],
      npcs: ['wizard_aldric'],
    },

    {
      id: 'forest_path',
      name: 'Whispering Woods Path',
      description:
        'A winding path through ancient forest. Towering oaks filter sunlight into dancing shadows. The whisper of wind through leaves sounds almost like voices. To the east, you glimpse the ruins of an ancient temple. The path continues south toward the mountains.',
      graphics: {
        backgroundColor: '#005500', // Dark green
        primitives: [
          // Sky glimpses through trees
          {
            type: 'polygon',
            points: [
              [50, 20],
              [80, 20],
              [70, 50],
              [60, 50],
            ],
            color: '#5555FF',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [200, 30],
              [240, 30],
              [230, 60],
              [210, 60],
            ],
            color: '#5555FF',
            filled: true,
          },
          // Large tree trunks
          {
            type: 'rect',
            x: 30,
            y: 50,
            width: 25,
            height: 120,
            color: '#553300',
            filled: true,
          },
          {
            type: 'rect',
            x: 265,
            y: 40,
            width: 30,
            height: 130,
            color: '#553300',
            filled: true,
          },
          // Tree canopy (left)
          {
            type: 'circle',
            x: 42,
            y: 40,
            radius: 35,
            color: '#00AA00',
            filled: true,
          },
          // Tree canopy (right)
          {
            type: 'circle',
            x: 280,
            y: 35,
            radius: 40,
            color: '#00AA00',
            filled: true,
          },
          // Forest path (dirt)
          {
            type: 'polygon',
            points: [
              [140, 100],
              [180, 100],
              [200, 200],
              [120, 200],
            ],
            color: '#AA5500',
            filled: true,
          },
          // Mushrooms along path
          {
            type: 'circle',
            x: 100,
            y: 150,
            radius: 5,
            color: '#FF5555',
            filled: true,
          },
          {
            type: 'rect',
            x: 98,
            y: 150,
            width: 4,
            height: 8,
            color: '#FFFFFF',
            filled: true,
          },
          {
            type: 'circle',
            x: 220,
            y: 145,
            radius: 4,
            color: '#FF5555',
            filled: true,
          },
          {
            type: 'rect',
            x: 219,
            y: 145,
            width: 3,
            height: 6,
            color: '#FFFFFF',
            filled: true,
          },
        ],
      },
      exits: {
        north: { room: 'village_square', blocked: false },
        east: { room: 'ancient_temple', blocked: false },
        south: { room: 'mountain_pass', blocked: false },
      },
      objects: ['old_oak', 'mushrooms', 'path'],
      items: ['forest_herbs'],
      npcs: [],
    },

    {
      id: 'ancient_temple',
      name: 'Ancient Temple Ruins',
      description:
        'Crumbling stone pillars mark this forgotten place of worship. Vines reclaim marble walls carved with cryptic runes. A stone altar stands at the center, its surface inscribed with an ancient riddle. An iron door to the north is sealed with magical locks - three gemstone sockets glow faintly.',
      graphics: {
        backgroundColor: '#555555', // Gray
        primitives: [
          // Stone pillars
          {
            type: 'rect',
            x: 40,
            y: 60,
            width: 20,
            height: 100,
            color: '#AAAAAA',
            filled: true,
          },
          {
            type: 'rect',
            x: 260,
            y: 60,
            width: 20,
            height: 100,
            color: '#AAAAAA',
            filled: true,
          },
          // Broken pillar (center left)
          {
            type: 'rect',
            x: 100,
            y: 120,
            width: 15,
            height: 50,
            color: '#999999',
            filled: true,
          },
          // Central altar
          {
            type: 'rect',
            x: 140,
            y: 130,
            width: 40,
            height: 30,
            color: '#888888',
            filled: true,
          },
          // Altar top
          {
            type: 'rect',
            x: 135,
            y: 125,
            width: 50,
            height: 5,
            color: '#AAAAAA',
            filled: true,
          },
          // Runes on altar (glowing)
          {
            type: 'line',
            x1: 145,
            y1: 135,
            x2: 155,
            y2: 135,
            color: '#55FFFF',
          },
          {
            type: 'line',
            x1: 160,
            y1: 135,
            x2: 170,
            y2: 135,
            color: '#55FFFF',
          },
          // Vines
          {
            type: 'line',
            x1: 40,
            y1: 70,
            x2: 45,
            y2: 100,
            color: '#00AA00',
          },
          {
            type: 'line',
            x1: 45,
            y1: 100,
            x2: 40,
            y2: 130,
            color: '#00AA00',
          },
          {
            type: 'line',
            x1: 270,
            y1: 80,
            x2: 265,
            y2: 110,
            color: '#00AA00',
          },
          // Sealed iron door (north)
          {
            type: 'rect',
            x: 130,
            y: 40,
            width: 60,
            height: 70,
            color: '#333333',
            filled: true,
          },
          // Three gemstone sockets on door
          {
            type: 'circle',
            x: 145,
            y: 70,
            radius: 6,
            color: '#FF5555',
            filled: true,
          }, // Ruby socket
          {
            type: 'circle',
            x: 160,
            y: 70,
            radius: 6,
            color: '#5555FF',
            filled: true,
          }, // Sapphire socket
          {
            type: 'circle',
            x: 175,
            y: 70,
            radius: 6,
            color: '#55FF55',
            filled: true,
          }, // Emerald socket
        ],
      },
      exits: {
        west: { room: 'forest_path', blocked: false },
        north: { room: 'dark_dungeon', blocked: true }, // Requires gemstones
      },
      objects: ['stone_altar', 'pillars', 'sealed_door', 'runes_temple'],
      items: [],
      npcs: [],
    },

    {
      id: 'dark_dungeon',
      name: 'Dark Dungeon',
      description:
        'A dank underground chamber lit by flickering torches. Water drips from the ceiling into murky pools. Ancient cells line the walls, their doors long rusted open. Skeletal remains hint at the dungeon\'s grim history. A treasure chest sits in the corner, protected by a magical barrier.',
      graphics: {
        backgroundColor: '#000000', // Black
        primitives: [
          // Stone walls
          {
            type: 'rect',
            x: 0,
            y: 0,
            width: 30,
            height: 200,
            color: '#333333',
            filled: true,
          },
          {
            type: 'rect',
            x: 290,
            y: 0,
            width: 30,
            height: 200,
            color: '#333333',
            filled: true,
          },
          // Torch (left)
          {
            type: 'rect',
            x: 50,
            y: 70,
            width: 5,
            height: 20,
            color: '#885500',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [48, 70],
              [52, 60],
              [57, 70],
            ],
            color: '#FF5555',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [50, 68],
              [52, 62],
              [55, 68],
            ],
            color: '#FFFF55',
            filled: true,
          },
          // Torch (right)
          {
            type: 'rect',
            x: 265,
            y: 70,
            width: 5,
            height: 20,
            color: '#885500',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [263, 70],
              [267, 60],
              [272, 70],
            ],
            color: '#FF5555',
            filled: true,
          },
          // Cell doors (rusted open)
          {
            type: 'rect',
            x: 80,
            y: 100,
            width: 30,
            height: 50,
            color: '#AA5500',
            filled: false,
          },
          {
            type: 'rect',
            x: 210,
            y: 100,
            width: 30,
            height: 50,
            color: '#AA5500',
            filled: false,
          },
          // Murky water pool (center)
          {
            type: 'ellipse',
            x: 160,
            y: 160,
            radiusX: 30,
            radiusY: 15,
            color: '#003333',
            filled: true,
          },
          // Treasure chest (corner)
          {
            type: 'rect',
            x: 250,
            y: 140,
            width: 30,
            height: 25,
            color: '#AA5500',
            filled: true,
          },
          // Chest lid
          {
            type: 'rect',
            x: 248,
            y: 135,
            width: 34,
            height: 5,
            color: '#885500',
            filled: true,
          },
          // Magical barrier (purple glow around chest)
          {
            type: 'circle',
            x: 265,
            y: 150,
            radius: 25,
            color: '#FF55FF',
            filled: false,
          },
          // Skeleton (in cell)
          {
            type: 'circle',
            x: 95,
            y: 115,
            radius: 5,
            color: '#FFFFFF',
            filled: true,
          }, // Skull
          {
            type: 'rect',
            x: 93,
            y: 120,
            width: 4,
            height: 10,
            color: '#FFFFFF',
            filled: true,
          }, // Bones
        ],
      },
      exits: {
        south: { room: 'ancient_temple', blocked: false },
      },
      objects: ['treasure_chest', 'torches', 'cells', 'skeleton'],
      items: ['ancient_key', 'magic_sword'],
      npcs: [],
    },

    {
      id: 'mountain_pass',
      name: 'Treacherous Mountain Pass',
      description:
        'A narrow rocky trail winds up the mountainside. Snow-capped peaks tower above. The path is treacherous - loose stones and a sheer drop to one side. To the north, you see a dark cave entrance: the Dragon\'s Lair. Cold wind howls, carrying the scent of sulfur and smoke.',
      graphics: {
        backgroundColor: '#5555FF', // Sky blue
        primitives: [
          // Mountain peaks (background)
          {
            type: 'polygon',
            points: [
              [0, 100],
              [80, 20],
              [160, 100],
            ],
            color: '#888888',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [160, 100],
              [240, 30],
              [320, 100],
            ],
            color: '#999999',
            filled: true,
          },
          // Snow caps
          {
            type: 'polygon',
            points: [
              [60, 40],
              [80, 20],
              [100, 40],
            ],
            color: '#FFFFFF',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [220, 50],
              [240, 30],
              [260, 50],
            ],
            color: '#FFFFFF',
            filled: true,
          },
          // Rocky path
          {
            type: 'polygon',
            points: [
              [100, 150],
              [150, 130],
              [170, 200],
              [80, 200],
            ],
            color: '#885555',
            filled: true,
          },
          // Loose stones
          {
            type: 'circle',
            x: 120,
            y: 160,
            radius: 5,
            color: '#555555',
            filled: true,
          },
          {
            type: 'circle',
            x: 135,
            y: 170,
            radius: 4,
            color: '#666666',
            filled: true,
          },
          {
            type: 'circle',
            x: 150,
            y: 155,
            radius: 6,
            color: '#555555',
            filled: true,
          },
          // Cave entrance (dark, ominous)
          {
            type: 'ellipse',
            x: 160,
            y: 90,
            radiusX: 40,
            radiusY: 30,
            color: '#000000',
            filled: true,
          },
          {
            type: 'ellipse',
            x: 160,
            y: 95,
            radiusX: 35,
            radiusY: 25,
            color: '#330000',
            filled: true,
          },
          // Smoke wisps from cave
          {
            type: 'circle',
            x: 150,
            y: 70,
            radius: 8,
            color: '#555555',
            filled: true,
          },
          {
            type: 'circle',
            x: 165,
            y: 65,
            radius: 6,
            color: '#666666',
            filled: true,
          },
        ],
      },
      exits: {
        north: { room: 'forest_path', blocked: false },
        east: { room: 'dragon_lair', blocked: false },
      },
      objects: ['cave_entrance', 'mountain_peaks', 'loose_stones'],
      items: [],
      npcs: [],
    },

    {
      id: 'dragon_lair',
      name: "Dragon's Lair",
      description:
        'A massive cavern filled with the dragon\'s hoard. Mountains of gold coins, jeweled artifacts, and ancient treasures gleam in the dim light. At the center, coiled upon the largest pile, is Malakor the Red - a magnificent dragon with scales like burnished copper. His eyes glow with ancient intelligence. The Dragon\'s Crown sits atop his hoard, radiating magical energy.',
      graphics: {
        backgroundColor: '#000000', // Black (cave)
        primitives: [
          // Cave walls
          {
            type: 'polygon',
            points: [
              [0, 0],
              [60, 80],
              [0, 160],
            ],
            color: '#333333',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [320, 0],
              [260, 80],
              [320, 160],
            ],
            color: '#333333',
            filled: true,
          },
          // Treasure piles (gold coins)
          {
            type: 'ellipse',
            x: 100,
            y: 160,
            radiusX: 40,
            radiusY: 20,
            color: '#FFFF55',
            filled: true,
          },
          {
            type: 'ellipse',
            x: 220,
            y: 165,
            radiusX: 35,
            radiusY: 18,
            color: '#FFFF55',
            filled: true,
          },
          // Central hoard (largest pile)
          {
            type: 'ellipse',
            x: 160,
            y: 145,
            radiusX: 60,
            radiusY: 30,
            color: '#FFAA00',
            filled: true,
          },
          // Dragon body (coiled on hoard)
          {
            type: 'ellipse',
            x: 160,
            y: 120,
            radiusX: 50,
            radiusY: 25,
            color: '#AA3300',
            filled: true,
          },
          // Dragon head
          {
            type: 'ellipse',
            x: 140,
            y: 105,
            radiusX: 20,
            radiusY: 15,
            color: '#AA3300',
            filled: true,
          },
          // Dragon eyes (glowing)
          {
            type: 'circle',
            x: 135,
            y: 103,
            radius: 3,
            color: '#FFFF00',
            filled: true,
          },
          {
            type: 'circle',
            x: 145,
            y: 103,
            radius: 3,
            color: '#FFFF00',
            filled: true,
          },
          // Dragon horns
          {
            type: 'polygon',
            points: [
              [130, 100],
              [128, 90],
              [132, 98],
            ],
            color: '#FFFFFF',
            filled: true,
          },
          {
            type: 'polygon',
            points: [
              [150, 100],
              [152, 90],
              [148, 98],
            ],
            color: '#FFFFFF',
            filled: true,
          },
          // Dragon wings (folded)
          {
            type: 'polygon',
            points: [
              [180, 115],
              [200, 100],
              [195, 130],
            ],
            color: '#882200',
            filled: true,
          },
          // Dragon's Crown (on top of hoard, glowing)
          {
            type: 'circle',
            x: 160,
            y: 95,
            radius: 12,
            color: '#FFFF55',
            filled: false,
          },
          {
            type: 'circle',
            x: 160,
            y: 95,
            radius: 8,
            color: '#FFFF55',
            filled: false,
          },
          // Crown jewels (glowing gems)
          {
            type: 'circle',
            x: 160,
            y: 88,
            radius: 3,
            color: '#FF5555',
            filled: true,
          },
          {
            type: 'circle',
            x: 153,
            y: 95,
            radius: 3,
            color: '#5555FF',
            filled: true,
          },
          {
            type: 'circle',
            x: 167,
            y: 95,
            radius: 3,
            color: '#55FF55',
            filled: true,
          },
          // Scattered jewels
          {
            type: 'circle',
            x: 90,
            y: 155,
            radius: 4,
            color: '#FF55FF',
            filled: true,
          },
          {
            type: 'circle',
            x: 230,
            y: 160,
            radius: 3,
            color: '#55FFFF',
            filled: true,
          },
        ],
      },
      exits: {
        west: { room: 'mountain_pass', blocked: false },
        south: { room: 'sacred_grove', blocked: true }, // Unlocks after quest
      },
      objects: ['treasure_hoard', 'crown_on_hoard', 'dragon'],
      items: [],
      npcs: ['dragon_malakor'],
    },

    {
      id: 'sacred_grove',
      name: 'Sacred Grove',
      description:
        'A mystical clearing bathed in ethereal light. Ancient trees form a perfect circle around a pool of crystal-clear water. The air shimmers with healing magic. This place exists outside normal space - accessible only to those who have proven themselves worthy. You feel your wounds healing and your spirit restored.',
      graphics: {
        backgroundColor: '#55FF55', // Bright green
        primitives: [
          // Sky (mystical purple-blue)
          {
            type: 'rect',
            x: 0,
            y: 0,
            width: 320,
            height: 80,
            color: '#5555FF',
            filled: true,
          },
          // Ethereal glow
          {
            type: 'circle',
            x: 160,
            y: 40,
            radius: 30,
            color: '#FFFFFF',
            filled: true,
          },
          {
            type: 'circle',
            x: 160,
            y: 40,
            radius: 40,
            color: '#FFFF55',
            filled: false,
          },
          // Ancient trees in circle (8 trees)
          // Tree 1 (north)
          {
            type: 'rect',
            x: 155,
            y: 50,
            width: 10,
            height: 30,
            color: '#885500',
            filled: true,
          },
          {
            type: 'circle',
            x: 160,
            y: 45,
            radius: 15,
            color: '#00AA00',
            filled: true,
          },
          // Tree 2 (northeast)
          {
            type: 'rect',
            x: 220,
            y: 70,
            width: 10,
            height: 30,
            color: '#885500',
            filled: true,
          },
          {
            type: 'circle',
            x: 225,
            y: 65,
            radius: 15,
            color: '#00AA00',
            filled: true,
          },
          // Tree 3 (east)
          {
            type: 'rect',
            x: 250,
            y: 110,
            width: 10,
            height: 30,
            color: '#885500',
            filled: true,
          },
          {
            type: 'circle',
            x: 255,
            y: 105,
            radius: 15,
            color: '#00AA00',
            filled: true,
          },
          // Tree 4 (southeast)
          {
            type: 'rect',
            x: 220,
            y: 150,
            width: 10,
            height: 30,
            color: '#885500',
            filled: true,
          },
          {
            type: 'circle',
            x: 225,
            y: 145,
            radius: 15,
            color: '#00AA00',
            filled: true,
          },
          // Tree 5 (south)
          {
            type: 'rect',
            x: 155,
            y: 170,
            width: 10,
            height: 30,
            color: '#885500',
            filled: true,
          },
          // Tree 6 (southwest)
          {
            type: 'rect',
            x: 90,
            y: 150,
            width: 10,
            height: 30,
            color: '#885500',
            filled: true,
          },
          {
            type: 'circle',
            x: 95,
            y: 145,
            radius: 15,
            color: '#00AA00',
            filled: true,
          },
          // Tree 7 (west)
          {
            type: 'rect',
            x: 60,
            y: 110,
            width: 10,
            height: 30,
            color: '#885500',
            filled: true,
          },
          {
            type: 'circle',
            x: 65,
            y: 105,
            radius: 15,
            color: '#00AA00',
            filled: true,
          },
          // Tree 8 (northwest)
          {
            type: 'rect',
            x: 90,
            y: 70,
            width: 10,
            height: 30,
            color: '#885500',
            filled: true,
          },
          {
            type: 'circle',
            x: 95,
            y: 65,
            radius: 15,
            color: '#00AA00',
            filled: true,
          },
          // Crystal pool (center)
          {
            type: 'circle',
            x: 160,
            y: 120,
            radius: 30,
            color: '#55FFFF',
            filled: true,
          },
          {
            type: 'circle',
            x: 160,
            y: 120,
            radius: 20,
            color: '#AAFFFF',
            filled: true,
          },
          // Magical sparkles
          {
            type: 'circle',
            x: 140,
            y: 100,
            radius: 2,
            color: '#FFFFFF',
            filled: true,
          },
          {
            type: 'circle',
            x: 180,
            y: 105,
            radius: 2,
            color: '#FFFF55',
            filled: true,
          },
          {
            type: 'circle',
            x: 170,
            y: 140,
            radius: 2,
            color: '#FF55FF',
            filled: true,
          },
          {
            type: 'circle',
            x: 145,
            y: 130,
            radius: 2,
            color: '#55FFFF',
            filled: true,
          },
        ],
      },
      exits: {
        north: { room: 'dragon_lair', blocked: false },
      },
      objects: ['crystal_pool', 'ancient_trees', 'ethereal_light'],
      items: ['blessing_of_grove'],
      npcs: [],
    },
  ],

  // OBJECTS
  objects: [
    // Village Square
    {
      id: 'fountain',
      name: 'village fountain',
      description:
        'A beautiful marble fountain depicting a griffin. Clear water sprays from its beak into the basin below.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'market_stalls',
      name: 'market stalls',
      description:
        'Colorful vendor stalls selling produce, cloth, and trinkets. Most merchants have closed up - worried about the dragon threat.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },

    // Tavern
    {
      id: 'bar',
      name: 'tavern bar',
      description:
        "Martha's well-worn bar, covered in rings from countless mugs. She keeps it polished despite the hard times.",
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'fireplace',
      name: 'fireplace',
      description:
        'A large stone fireplace with a roaring fire. Its warmth is comforting after the chill outside.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'notice_board',
      name: 'notice board',
      description:
        "A wooden board with various notices. Most prominent: 'REWARD: 1000 gold pieces to any brave soul who retrieves the Dragon's Crown from Malakor's lair!'",
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'tables',
      name: 'wooden tables',
      description:
        'Several round tables where villagers gather to drink and share news.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },

    // Castle
    {
      id: 'throne',
      name: 'royal throne',
      description:
        'An ornate golden throne, passed down through generations of Thornhaven kings. King Edmund sits upon it, looking worried.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'crown_pedestal',
      name: 'crown pedestal',
      description:
        "An empty marble pedestal where the Dragon's Crown once rested. Its absence is palpable - you can feel the kingdom's magical protection fading.",
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'stained_glass',
      name: 'stained glass windows',
      description:
        'Beautiful windows depicting the history of Thornhaven - including the ancient pact between the first king and the dragons.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },

    // Wizard Tower
    {
      id: 'workbench',
      name: "wizard's workbench",
      description:
        'Cluttered with alchemical equipment, bubbling flasks, and ancient tomes. Aldric is currently studying a large spellbook.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'crystal_ball',
      name: 'crystal ball',
      description:
        'A perfect sphere of crystal on a silver pedestal. Mystical energies swirl within its depths, showing glimpses of distant places.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'potion_shelves',
      name: 'potion shelves',
      description:
        'Shelves lined with bottles of every color - healing draughts, magical elixirs, and mysterious concoctions.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'runes',
      name: 'glowing runes',
      description:
        'Ancient magical symbols carved into the stone walls. They pulse with soft light, maintaining the tower\'s protective enchantments.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },

    // Forest
    {
      id: 'old_oak',
      name: 'ancient oak tree',
      description:
        'A massive oak that must be centuries old. Its gnarled trunk and spreading branches seem almost sentient.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'mushrooms',
      name: 'red mushrooms',
      description:
        'Bright red mushrooms with white spots grow along the path. They look poisonous - best not to touch them.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'path',
      name: 'forest path',
      description:
        'A well-worn dirt path winding through the trees. Many travelers have passed this way.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },

    // Temple
    {
      id: 'stone_altar',
      name: 'stone altar',
      description:
        'An ancient altar inscribed with a riddle: "Three colors of earth do I crave, Ruby red, ocean blue, and forest jade. Place these gems in their rightful seats, And the sealed door shall retreat."',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: true,
      scenery: true,
    },
    {
      id: 'pillars',
      name: 'stone pillars',
      description:
        'Crumbling marble pillars that once supported a grand roof. Now they stand exposed to the elements.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'sealed_door',
      name: 'sealed iron door',
      description:
        'A massive iron door sealed with ancient magic. Three gemstone sockets glow faintly: ruby red, sapphire blue, and emerald green.',
      canTake: false,
      canOpen: true,
      canLookAt: true,
      canUse: true,
      locked: true,
      scenery: true,
    },
    {
      id: 'runes_temple',
      name: 'temple runes',
      description:
        'Cryptic symbols carved into the marble walls. They seem to tell the story of an ancient civilization.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },

    // Dungeon
    {
      id: 'treasure_chest',
      name: 'treasure chest',
      description:
        'An old wooden chest bound with iron. A magical barrier shimmers around it - you need to dispel the magic first.',
      canTake: false,
      canOpen: true,
      canLookAt: true,
      canUse: false,
      locked: true,
      scenery: true,
    },
    {
      id: 'torches',
      name: 'flickering torches',
      description:
        'Iron torches mounted on the walls, their flames dancing in the damp air.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'cells',
      name: 'dungeon cells',
      description:
        'Rusted iron cages that once held prisoners. Their doors hang open, long since abandoned.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'skeleton',
      name: 'skeleton',
      description:
        'The remains of some unfortunate soul who died here long ago. A grim reminder of mortality.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },

    // Mountain Pass
    {
      id: 'cave_entrance',
      name: 'cave entrance',
      description:
        "A dark, foreboding cave mouth leading into the dragon's lair. Smoke and the smell of sulfur pour from within.",
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'mountain_peaks',
      name: 'mountain peaks',
      description:
        'Towering snow-capped mountains stretching into the sky. Their majesty is both beautiful and intimidating.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'loose_stones',
      name: 'loose stones',
      description:
        'Dangerous loose rocks that could cause a landslide. Watch your step!',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },

    // Dragon's Lair
    {
      id: 'treasure_hoard',
      name: "dragon's hoard",
      description:
        'An immense pile of treasure - gold coins, jeweled artifacts, ancient weapons, and priceless relics. Centuries of accumulated wealth.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'crown_on_hoard',
      name: "Dragon's Crown",
      description:
        'The legendary Dragon\'s Crown rests atop the hoard, radiating golden light. Three magical gems adorn it: ruby, sapphire, and emerald. This is what you came for - but the dragon guards it jealously.',
      canTake: true,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: false,
    },
    {
      id: 'dragon',
      name: 'dragon Malakor',
      description:
        'Malakor the Red is a magnificent dragon with scales like burnished copper. His eyes glow with ancient intelligence. He watches you warily, ready to attack or negotiate.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },

    // Sacred Grove
    {
      id: 'crystal_pool',
      name: 'crystal pool',
      description:
        'A pool of the clearest water you have ever seen. It radiates healing magic. Drinking from it would restore health and spirit.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: true,
      scenery: true,
    },
    {
      id: 'ancient_trees',
      name: 'ancient trees',
      description:
        'Eight impossibly old trees forming a perfect circle. They seem to exist outside normal time, protected by powerful magic.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
    {
      id: 'ethereal_light',
      name: 'ethereal light',
      description:
        'A soft, mystical glow that has no visible source. It fills the grove with peace and tranquility.',
      canTake: false,
      canOpen: false,
      canLookAt: true,
      canUse: false,
      scenery: true,
    },
  ],

  // ITEMS
  items: [
    // Tavern
    {
      id: 'tavern_rumors',
      name: 'scrap of paper',
      description:
        'A note left on the bar: "I heard the old temple in the woods has a secret passage to ancient dungeons. They say treasure and danger await in equal measure."',
      takeable: true,
      usable: false,
      visible: true,
      keywords: ['paper', 'note', 'scrap', 'rumors'],
    },

    // Wizard Tower
    {
      id: 'healing_potion',
      name: 'healing potion',
      description:
        'A small glass vial filled with red liquid. Restores health when drunk.',
      takeable: true,
      usable: true,
      visible: true,
      consumable: true,
      healthRestore: 50,
      keywords: ['potion', 'vial', 'red', 'health'],
    },
    {
      id: 'magic_scroll_shield',
      name: 'scroll of protection',
      description:
        'An ancient scroll inscribed with defensive runes. Reading it grants temporary protection from harm.',
      takeable: true,
      usable: true,
      visible: true,
      consumable: true,
      keywords: ['scroll', 'protection', 'shield', 'magic'],
    },

    // Forest
    {
      id: 'forest_herbs',
      name: 'healing herbs',
      description:
        'Fresh medicinal herbs growing beside the path. They have minor healing properties.',
      takeable: true,
      usable: true,
      visible: true,
      consumable: true,
      healthRestore: 15,
      keywords: ['herbs', 'plants', 'medicine'],
    },

    // Dungeon
    {
      id: 'ancient_key',
      name: 'ancient iron key',
      description:
        'A heavy iron key covered in rust and strange markings. It looks important.',
      takeable: true,
      usable: true,
      visible: false, // Hidden in chest
      keywords: ['key', 'iron', 'ancient'],
    },
    {
      id: 'magic_sword',
      name: 'Dragonbane Sword',
      description:
        'A magnificent sword with a gleaming blade etched with dragon-slaying runes. The hilt is wrapped in dragon leather. This weapon was forged specifically to combat dragons.',
      takeable: true,
      usable: true,
      visible: false, // Hidden in chest
      keywords: ['sword', 'blade', 'weapon', 'dragonbane'],
    },

    // Quest Items (obtained through puzzles/NPCs)
    {
      id: 'ruby_gem',
      name: 'ruby gemstone',
      description:
        'A brilliant red ruby that glows with inner fire. One of three gems needed for the temple door.',
      takeable: true,
      usable: true,
      visible: false, // Given by King Edmund as quest starter
      keywords: ['ruby', 'gem', 'red', 'stone'],
    },
    {
      id: 'sapphire_gem',
      name: 'sapphire gemstone',
      description:
        'A deep blue sapphire that shimmers like the ocean. One of three gems needed for the temple door.',
      takeable: true,
      usable: true,
      visible: false, // Found via Wizard Aldric
      keywords: ['sapphire', 'gem', 'blue', 'stone'],
    },
    {
      id: 'emerald_gem',
      name: 'emerald gemstone',
      description:
        'A vibrant green emerald that sparkles like forest leaves. One of three gems needed for the temple door.',
      takeable: true,
      usable: true,
      visible: false, // Found in forest (requires searching)
      keywords: ['emerald', 'gem', 'green', 'stone'],
    },

    // Sacred Grove
    {
      id: 'blessing_of_grove',
      name: 'blessing of the grove',
      description:
        'A magical blessing that grants courage and strength. The sacred grove has judged you worthy.',
      takeable: true,
      usable: true,
      visible: false, // Appears after defeating/negotiating with dragon
      keywords: ['blessing', 'magic', 'grove'],
    },

    // Dragon's Crown (quest objective)
    {
      id: 'dragons_crown',
      name: "Dragon's Crown",
      description:
        'The legendary crown that protects the kingdom. It radiates powerful magic from its three enchanted gems.',
      takeable: true,
      usable: false,
      visible: false, // In dragon's lair, must be taken from hoard
      keywords: ['crown', 'dragons', 'royal'],
    },

    // Currency
    {
      id: 'gold_coins',
      name: 'gold coins',
      description: 'Shiny gold coins. The universal currency of the realm.',
      takeable: true,
      usable: false,
      visible: false, // Found in various locations
      keywords: ['gold', 'coins', 'money', 'currency'],
    },
  ],

  // NPCs
  npcs: [
    {
      id: 'king_edmund',
      name: 'King Edmund',
      description:
        'The aging king of Thornhaven. His face is lined with worry about the stolen crown and the threat to his kingdom.',
      location: 'castle_throne',
      dialogue: {
        greeting:
          'Welcome, brave adventurer. Our kingdom is in grave peril. The dragon Malakor has stolen the Dragon\'s Crown - without it, our magical protections fail. Will you help us?',
        topics: {
          crown:
            'The Dragon\'s Crown has protected our kingdom for generations. It was forged in ancient times through a pact with the good dragons. Now Malakor, corrupted by greed, has taken it for his hoard.',
          dragon:
            'Malakor was once a noble dragon, guardian of our realm. But something changed him - perhaps centuries of isolation, perhaps the allure of treasure. Now he threatens everything we hold dear.',
          quest:
            'If you retrieve the crown, I will reward you with 1000 gold pieces and a place of honor in the kingdom. But be warned - Malakor is powerful and cunning. You will need preparation.',
          gems:
            'I can give you this ruby gemstone - it was part of my coronation regalia. I have heard the wizard Aldric may know of other gems. You will need three gems to access the ancient dungeons.',
        },
      },
      relationship: 50,
      canTrade: true,
      inventory: ['ruby_gem'],
      tradeRules: [
        {
          gives: ['ruby_gem'],
          requires: ['quest_accepted'],
          description: 'King Edmund gives you a ruby to help your quest.',
        },
      ],
    },

    {
      id: 'wizard_aldric',
      name: 'Wizard Aldric',
      description:
        'An elderly wizard with a long white beard and piercing blue eyes. He wears star-patterned robes and carries an oak staff.',
      location: 'wizard_tower',
      dialogue: {
        greeting:
          'Ah, a visitor! Welcome to my tower. I sense you are on an important quest. How may my knowledge serve you?',
        topics: {
          magic:
            'Magic flows through all things in this realm. The Dragon\'s Crown is one of the most powerful magical artifacts ever created. Its loss weakens the very fabric of our reality.',
          gems:
            'You seek the three gems? I have a sapphire from my travels in the northern seas. Take it - you will need it to access the temple dungeons. The emerald... search carefully in the Whispering Woods.',
          dragon:
            'To face Malakor, you need more than courage. You need the Dragonbane Sword - forged long ago for such a purpose. It is hidden in the dungeons beneath the temple. And remember: dragons are intelligent - combat is not your only option.',
          potions:
            'I have healing potions and protective scrolls. Take what you need from my shelves - consider it my contribution to saving the kingdom.',
        },
      },
      relationship: 60,
      canTrade: true,
      inventory: ['sapphire_gem', 'healing_potion', 'magic_scroll_shield'],
      tradeRules: [
        {
          gives: ['sapphire_gem'],
          requires: ['ruby_gem'],
          description:
            'Aldric gives you a sapphire after you show him the ruby.',
        },
      ],
    },

    {
      id: 'innkeeper_martha',
      name: 'Martha the Innkeeper',
      description:
        'A plump, friendly woman with rosy cheeks. She runs the Golden Griffin tavern and knows all the local gossip.',
      location: 'tavern',
      dialogue: {
        greeting:
          'Welcome to the Golden Griffin! What can I get you? Ale? Mead? Or perhaps you want to hear the latest rumors?',
        topics: {
          rumors:
            'Folk say there\'s treasure in the old temple ruins - but also danger. And I heard tell of a secret passage to ancient dungeons. Course, you\'d need the right keys to get in.',
          village:
            'Thornhaven was once a prosperous place. But since Malakor took the crown, dark times have fallen. Crops fail, livestock sicken. We need a hero.',
          dragon:
            'My grandfather told stories of when Malakor was good - can you believe it? He actually helped the kingdom once. What turned him evil, I couldn\'t say.',
          food:
            'Business is slow these days, but I still make the best stew this side of the mountains. Here, have some on the house - you look like you could use it.',
        },
      },
      relationship: 40,
      canTrade: false,
      inventory: [],
    },

    {
      id: 'dragon_malakor',
      name: 'Malakor the Red',
      description:
        'A magnificent and terrifying dragon with copper-red scales. His eyes glow with ancient intelligence and barely contained rage.',
      location: 'dragon_lair',
      dialogue: {
        greeting:
          'So... another would-be hero comes to steal my treasure. How predictable. State your business quickly, mortal, before I reduce you to ash!',
        topics: {
          crown:
            'The crown? It is MINE now! The humans used its magic for centuries, never thinking to share the power. I merely took what should have been mine from the beginning!',
          treasure:
            'Every piece of gold, every jewel - earned through centuries of existence. This is my life\'s work, my legacy. And you dare suggest I simply give it up?',
          negotiation:
            'You wish to... talk? How unusual. Very well. Perhaps there is a way we both get what we want. The kingdom needs protection, yes? I could provide that - for a price. A share of the kingdom\'s wealth, fair tribute, and RESPECT.',
          combat:
            'You choose to fight? Bold, but foolish. I have lived a thousand years and defeated countless warriors. But if you have the legendary Dragonbane Sword... perhaps you have a chance. EN GARDE!',
        },
      },
      relationship: -30,
      hostile: true,
      canTrade: true,
      inventory: ['dragons_crown'],
      combatStats: {
        health: 200,
        attack: 30,
        defense: 25,
        fireBreathDamage: 50,
      },
      tradeRules: [
        {
          gives: ['dragons_crown'],
          requires: ['gold_coins'],
          description:
            'Malakor might return the crown if offered sufficient tribute (negotiation path).',
        },
      ],
    },
  ],

  // PUZZLES
  puzzles: [
    {
      id: 'temple_door_puzzle',
      name: 'Temple Gem Door',
      description:
        'The sealed temple door requires three gemstones: ruby, sapphire, and emerald.',
      requiredItems: ['ruby_gem', 'sapphire_gem', 'emerald_gem'],
      solved: false,
      steps: [
        {
          description: 'Obtain the ruby gemstone from King Edmund',
          completed: false,
          requiredItems: ['ruby_gem'],
        },
        {
          description: 'Obtain the sapphire gemstone from Wizard Aldric',
          completed: false,
          requiredItems: ['sapphire_gem'],
        },
        {
          description: 'Find the emerald gemstone in the Whispering Woods',
          completed: false,
          requiredItems: ['emerald_gem'],
        },
        {
          description: 'Use all three gems on the sealed door',
          completed: false,
          requiredItems: ['ruby_gem', 'sapphire_gem', 'emerald_gem'],
        },
      ],
      hint: 'The king, the wizard, and the forest each hold one gem. Gather them all to unseal the ancient door.',
      reward: {
        unlocks: 'dark_dungeon',
        text: 'The door swings open with a grinding sound, revealing stairs descending into darkness.',
      },
    },

    {
      id: 'dragon_confrontation',
      name: 'Retrieve the Dragon\'s Crown',
      description:
        'Recover the Dragon\'s Crown from Malakor. This can be accomplished through combat or negotiation.',
      requiredItems: [], // Optional: magic_sword for combat path
      solved: false,
      multiPath: true,
      steps: [
        {
          description: 'Find the Dragonbane Sword in the dungeon',
          completed: false,
          optional: true,
          requiredItems: ['magic_sword'],
        },
        {
          description:
            'Confront Malakor in his lair (combat or negotiation)',
          completed: false,
        },
        {
          description: 'Obtain the Dragon\'s Crown',
          completed: false,
          requiredItems: ['dragons_crown'],
        },
        {
          description: 'Return the crown to King Edmund',
          completed: false,
        },
      ],
      hint: 'Dragons are not mindless beasts. Sometimes words are mightier than swords. But having a legendary dragon-slaying blade doesn\'t hurt.',
      reward: {
        points: 100,
        endings: ['heroic_victory', 'peaceful_resolution'],
        text: 'You have recovered the Dragon\'s Crown! The kingdom is saved!',
      },
    },

    {
      id: 'treasure_chest_puzzle',
      name: 'Dispel the Magical Barrier',
      description:
        'A treasure chest in the dungeon is protected by a magical barrier. Use a dispel magic scroll or protective magic to access it.',
      requiredItems: ['magic_scroll_shield'], // Use protection scroll
      solved: false,
      steps: [
        {
          description:
            'Find a scroll of protection in the wizard\'s tower',
          completed: false,
          requiredItems: ['magic_scroll_shield'],
        },
        {
          description: 'Use the scroll to dispel the barrier',
          completed: false,
        },
        {
          description: 'Open the treasure chest',
          completed: false,
        },
      ],
      hint: 'Magical barriers require magical solutions. The wizard might have something useful.',
      reward: {
        items: ['magic_sword', 'ancient_key', 'gold_coins'],
        text: 'The barrier fades with a shimmer. Inside the chest you find the legendary Dragonbane Sword and other treasures!',
      },
    },
  ],

  // ACHIEVEMENTS
  achievements: [
    {
      id: 'dragon_slayer',
      name: 'Dragon Slayer',
      description: 'Defeat Malakor in single combat',
      points: 50,
      condition: { type: 'combat', target: 'dragon_malakor' },
      hidden: false,
    },
    {
      id: 'silver_tongue',
      name: 'Silver Tongue',
      description: 'Negotiate a peaceful resolution with Malakor',
      points: 75,
      condition: { type: 'dialogue', target: 'dragon_malakor', topic: 'negotiation' },
      hidden: false,
    },
    {
      id: 'treasure_hunter',
      name: 'Treasure Hunter',
      description: 'Find all hidden treasures in the realm',
      points: 30,
      condition: {
        type: 'items',
        items: [
          'magic_sword',
          'ancient_key',
          'gold_coins',
          'healing_potion',
          'all_gems',
        ],
      },
      hidden: false,
    },
    {
      id: 'hero_of_realm',
      name: 'Hero of the Realm',
      description:
        'Complete the quest with the best possible outcome (peaceful resolution + all gems + max relationship with all NPCs)',
      points: 100,
      condition: {
        type: 'ending',
        ending: 'peaceful_resolution',
        requirements: ['all_gems', 'high_relationships'],
      },
      hidden: false,
    },
    {
      id: 'dungeon_delver',
      name: 'Dungeon Delver',
      description: 'Successfully navigate the dark dungeon and claim its treasures',
      points: 25,
      condition: { type: 'puzzle', puzzle: 'treasure_chest_puzzle' },
      hidden: false,
    },
    {
      id: 'loremaster',
      name: 'Loremaster',
      description:
        'Discover all the lore about the Dragon\'s Crown and the ancient pact',
      points: 20,
      condition: {
        type: 'dialogue',
        topics: ['crown', 'dragon', 'magic', 'history'],
      },
      hidden: true,
    },
  ],

  // ENDINGS
  endings: [
    {
      id: 'heroic_victory',
      name: 'Heroic Victory',
      description:
        'You defeated Malakor in honorable combat and returned the Dragon\'s Crown to King Edmund. The kingdom celebrates you as its greatest hero. Songs will be sung of your valor for generations to come.',
      condition: {
        type: 'combat',
        target: 'dragon_malakor',
        hasItem: 'dragons_crown',
        returnedToKing: true,
      },
      pointsRequired: 50,
      image: 'heroic_ending',
    },
    {
      id: 'peaceful_resolution',
      name: 'The New Pact',
      description:
        'Through wisdom and diplomacy, you negotiated a new pact between Malakor and the kingdom. The dragon returns the crown and agrees to protect Thornhaven in exchange for fair tribute and respect. Peace reigns, and you are hailed as the realm\'s greatest diplomat.',
      condition: {
        type: 'dialogue',
        target: 'dragon_malakor',
        topic: 'negotiation',
        hasItem: 'dragons_crown',
        returnedToKing: true,
      },
      pointsRequired: 75,
      image: 'peaceful_ending',
    },
    {
      id: 'tragic_sacrifice',
      name: 'Tragic Sacrifice',
      description:
        'You fought bravely against Malakor but fell in battle. However, your sacrifice was not in vain - you weakened the dragon enough that the kingdom\'s knights were able to finish what you started. The crown was recovered, and you are remembered as a fallen hero.',
      condition: {
        type: 'death',
        location: 'dragon_lair',
        enemy: 'dragon_malakor',
      },
      pointsRequired: 25,
      image: 'sacrifice_ending',
    },
    {
      id: 'dark_path',
      name: 'The Dark Path',
      description:
        'You chose to side with Malakor, betraying the kingdom for a share of the dragon\'s vast hoard. The kingdom falls into darkness, but you live in luxury... haunted by what you\'ve done. Power always comes with a price.',
      condition: {
        type: 'betrayal',
        target: 'king_edmund',
        alliedWith: 'dragon_malakor',
      },
      pointsRequired: 0,
      image: 'dark_ending',
    },
    {
      id: 'failure',
      name: 'Kingdom Falls',
      description:
        'Without the Dragon\'s Crown, the kingdom\'s magical protections failed completely. Malakor\'s power grew unchecked, and darkness spread across the land. Your adventure ended in failure, but perhaps another hero will succeed where you fell short.',
      condition: {
        type: 'timeout',
        daysElapsed: 30,
        hasItem: 'dragons_crown',
        value: false,
      },
      pointsRequired: 0,
      image: 'failure_ending',
    },
  ],

  // INITIAL GAME STATE
  initialState: {
    score: 0,
    health: 100,
    maxHealth: 100,
    currentRoom: 'village_square',
    inventory: [],
    visitedRooms: ['village_square'],
    completedPuzzles: [],
    unlockedAchievements: [],
    flags: {
      questAccepted: false,
      metKing: false,
      metWizard: false,
      metInnkeeper: false,
      foundAllGems: false,
      sealedDoorOpened: false,
      chestOpened: false,
      dragonConfronted: false,
      crownReturned: false,
    },
    relationships: {
      king_edmund: 50,
      wizard_aldric: 60,
      innkeeper_martha: 40,
      dragon_malakor: -30,
    },
  },
};
