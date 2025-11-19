/**
 * Tutorial World - "Learning to Adventure"
 * Interactive tutorial teaching Somnium mechanics
 */

export const TUTORIAL_WORLD = {
  metadata: {
    title: 'Learning to Adventure',
    author: 'Somnium Team',
    description: 'An interactive tutorial teaching adventure game basics',
    genre: 'tutorial',
    version: '1.0',
  },

  startRoom: 'tutorial_start',

  rooms: [
    {
      id: 'tutorial_start',
      name: 'Tutorial Chamber',
      description: 'Welcome! This is your first adventure. A friendly guide waits to help you. Try typing "look" or "talk to guide" to begin.',
      graphics: {
        backgroundColor: '#00AA00',
        primitives: [
          { type: 'rect', x: 100, y: 100, width: 120, height: 60, color: '#885500', filled: true },
          { type: 'circle', x: 160, y: 80, radius: 15, color: '#FFAA00', filled: true },
          { type: 'rect', x: 150, y: 85, width: 20, height: 30, color: '#FFAA00', filled: true },
        ],
      },
      exits: {
        north: { room: 'movement_room', blocked: false },
      },
      objects: ['guide_desk'],
      items: [],
      npcs: ['tutorial_guide'],
    },

    {
      id: 'movement_room',
      name: 'Movement Practice',
      description: 'This room teaches movement. You can go north, south, east, or west. Try going east to the item room.',
      graphics: {
        backgroundColor: '#0000AA',
        primitives: [
          { type: 'polygon', points: [[160, 60], [180, 80], [140, 80]], color: '#FFFF55', filled: true },
          { type: 'polygon', points: [[160, 140], [180, 120], [140, 120]], color: '#FFFF55', filled: true },
          { type: 'polygon', points: [[60, 100], [80, 120], [80, 80]], color: '#FFFF55', filled: true },
          { type: 'polygon', points: [[260, 100], [240, 120], [240, 80]], color: '#FFFF55', filled: true },
        ],
      },
      exits: {
        south: { room: 'tutorial_start', blocked: false },
        east: { room: 'item_room', blocked: false },
      },
      objects: ['direction_signs'],
      items: [],
      npcs: [],
    },

    {
      id: 'item_room',
      name: 'Item Collection',
      description: 'This room contains a key on the floor. Try "take key" to pick it up, then "inventory" to see what you carry.',
      graphics: {
        backgroundColor: '#AA00AA',
        primitives: [
          { type: 'rect', x: 140, y: 160, width: 40, height: 5, color: '#FFFF55', filled: true },
          { type: 'circle', x: 150, y: 160, radius: 3, color: '#FFFF55', filled: true },
        ],
      },
      exits: {
        west: { room: 'movement_room', blocked: false },
        north: { room: 'puzzle_room', blocked: false },
      },
      objects: [],
      items: ['tutorial_key'],
      npcs: [],
    },

    {
      id: 'puzzle_room',
      name: 'Puzzle Challenge',
      description: 'A locked door blocks your path. Use the key you found! Try "use key on door" or "unlock door with key".',
      graphics: {
        backgroundColor: '#AA5500',
        primitives: [
          { type: 'rect', x: 130, y: 60, width: 60, height: 80, color: '#885500', filled: true },
          { type: 'circle', x: 170, y: 100, radius: 5, color: '#FFFF55', filled: true },
        ],
      },
      exits: {
        south: { room: 'item_room', blocked: false },
        north: { room: 'final_room', blocked: true },
      },
      objects: ['locked_door_tutorial'],
      items: [],
      npcs: [],
    },

    {
      id: 'final_room',
      name: 'Graduation Hall',
      description: 'Congratulations! You have completed the tutorial. You now know the basics of adventure gaming. Your journey begins!',
      graphics: {
        backgroundColor: '#FFFF55',
        primitives: [
          { type: 'polygon', points: [[160, 80], [140, 120], [180, 120]], color: '#FFAA00', filled: true },
          { type: 'circle', x: 160, y: 100, radius: 20, color: '#FF5555', filled: true },
          { type: 'circle', x: 160, y: 100, radius: 12, color: '#FFFF55', filled: true },
        ],
      },
      exits: {
        south: { room: 'puzzle_room', blocked: false },
      },
      objects: ['trophy'],
      items: ['certificate'],
      npcs: [],
    },
  ],

  objects: [
    {
      id: 'guide_desk',
      name: 'guide desk',
      description: 'A simple wooden desk where the guide sits',
      canTake: false,
      scenery: true,
    },
    {
      id: 'direction_signs',
      name: 'direction signs',
      description: 'Signs pointing in all four cardinal directions',
      canTake: false,
      scenery: true,
    },
    {
      id: 'locked_door_tutorial',
      name: 'locked door',
      description: 'A door secured with a simple lock',
      canTake: false,
      locked: true,
      canOpen: true,
    },
    {
      id: 'trophy',
      name: 'golden trophy',
      description: 'A trophy commemorating your tutorial completion',
      canTake: true,
      scenery: false,
    },
  ],

  items: [
    {
      id: 'tutorial_key',
      name: 'brass key',
      description: 'A simple brass key',
      takeable: true,
      usable: true,
      visible: true,
      keywords: ['key', 'brass'],
    },
    {
      id: 'certificate',
      name: 'certificate of completion',
      description: 'Official certificate showing you completed the tutorial',
      takeable: true,
      usable: false,
      visible: true,
      keywords: ['certificate', 'paper'],
    },
  ],

  npcs: [
    {
      id: 'tutorial_guide',
      name: 'Tutorial Guide',
      description: 'A friendly person here to teach you the basics',
      location: 'tutorial_start',
      dialogue: {
        greeting: 'Hello! Welcome to Somnium. Let me teach you how to play adventure games.',
        topics: {
          help: 'You can LOOK at things, TAKE items, USE objects, TALK to people, and MOVE in directions (north, south, east, west). Try these commands!',
          movement: 'To move, just type a direction: NORTH, SOUTH, EAST, or WEST. You can also use abbreviations like N, S, E, W.',
          items: 'To interact with items, try TAKE [item], DROP [item], USE [item], or EXAMINE [item]. Check your INVENTORY to see what you carry.',
          puzzles: 'Many adventures have puzzles. Read descriptions carefully and experiment with different commands. The key to success is exploration!',
          goodbye: 'Good luck on your adventure! Head north when you are ready to practice.',
        },
      },
      relationship: 100,
      canTrade: false,
    },
  ],

  puzzles: [
    {
      id: 'unlock_door_tutorial',
      name: 'Unlock the Door',
      description: 'Use the brass key to unlock the door and proceed',
      requiredItems: ['tutorial_key'],
      solved: false,
      steps: [
        {
          description: 'Find the brass key',
          completed: false,
          requiredItems: ['tutorial_key'],
        },
        {
          description: 'Use the key on the locked door',
          completed: false,
        },
      ],
      hint: 'Have you tried using the key on the door?',
      reward: {
        unlocks: 'final_room',
        points: 10,
        text: 'The door unlocks with a satisfying click!',
      },
    },
  ],

  achievements: [
    {
      id: 'tutorial_complete',
      name: 'Tutorial Graduate',
      description: 'Complete the tutorial',
      points: 25,
      condition: { type: 'room', room: 'final_room' },
      hidden: false,
    },
  ],

  endings: [
    {
      id: 'tutorial_success',
      name: 'Tutorial Complete',
      description: 'You have successfully learned the basics of adventure gaming. Now go forth and explore the many worlds of Somnium!',
      condition: { type: 'achievement', achievement: 'tutorial_complete' },
      pointsRequired: 10,
    },
  ],

  initialState: {
    score: 0,
    health: 100,
    maxHealth: 100,
    currentRoom: 'tutorial_start',
    inventory: [],
    visitedRooms: ['tutorial_start'],
    completedPuzzles: [],
    unlockedAchievements: [],
    flags: {
      metGuide: false,
      learnedMovement: false,
      foundKey: false,
      unlockedDoor: false,
    },
  },
};

export default TUTORIAL_WORLD;
