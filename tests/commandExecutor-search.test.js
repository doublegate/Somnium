import { CommandExecutor } from '../js/CommandExecutor.js';

describe('CommandExecutor - Search and Additional Commands', () => {
  let commandExecutor;
  let mockGameState;
  let mockEventManager;
  let mockViewManager;
  let mockSceneRenderer;
  let mockSoundManager;
  let mockInventory;
  let mockInteractionSystem;
  let mockMovementSystem;

  beforeEach(() => {
    // Mock GameState
    mockGameState = {
      currentRoomId: 'room1',
      playerName: 'Test Player',
      inventory: ['key', 'torch'],
      rooms: new Map([
        [
          'room1',
          {
            id: 'room1',
            name: 'Test Room',
            description: 'A test room',
            exits: { north: 'room2', south: 'room3' },
            objects: ['desk', 'bookshelf', 'rug', 'painting'],
            hiddenItems: {
              desk: ['letter', 'coin'],
              bookshelf: ['secret_book'],
              rug: [],
              painting: ['safe']
            },
          },
        ],
      ]),
      items: new Map([
        [
          'letter',
          { id: 'letter', name: 'old letter', description: 'A faded letter', hidden: true },
        ],
        [
          'coin',
          { id: 'coin', name: 'gold coin', description: 'A shiny gold coin', hidden: true },
        ],
        [
          'secret_book',
          { id: 'secret_book', name: 'secret book', description: 'A hidden tome', hidden: true },
        ],
      ]),
      objects: new Map([
        [
          'desk',
          {
            id: 'desk',
            name: 'wooden desk',
            description: 'An old wooden desk with drawers',
            searchable: true,
            searchMessage: 'You carefully search through the desk drawers.',
            searchedMessage: 'You already searched the desk thoroughly.',
            takeable: false,
          },
        ],
        [
          'bookshelf',
          {
            id: 'bookshelf',
            name: 'bookshelf',
            description: 'A tall bookshelf filled with books',
            searchable: true,
            searchEvent: 'bookshelf_searched',
            takeable: false,
          },
        ],
        [
          'rug',
          {
            id: 'rug',
            name: 'ornate rug',
            description: 'A beautifully woven rug',
            searchable: true,
            searchMessage: 'You find nothing under the rug.',
            takeable: false,
          },
        ],
        [
          'painting',
          {
            id: 'painting',
            name: 'landscape painting',
            description: 'A scenic landscape painting',
            searchable: true,
            requiresItem: 'magnifying_glass',
            searchFailMessage: 'You need something to examine the painting more closely.',
            takeable: false,
          },
        ],
        [
          'safe',
          {
            id: 'safe',
            name: 'wall safe',
            description: 'A hidden wall safe',
            hidden: true,
            locked: true,
            isContainer: true,
          },
        ],
      ]),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      setCurrentRoom: jest.fn(),
      getRoom: jest.fn((id) => mockGameState.rooms.get(id)),
      getItem: jest.fn((id) => mockGameState.items.get(id)),
      getObject: jest.fn((id) => mockGameState.objects.get(id)),
      hasItem: jest.fn((id) => mockGameState.inventory.includes(id)),
      addToRoom: jest.fn(),
      removeFromRoom: jest.fn(),
      getCurrentRoom: jest.fn(() =>
        mockGameState.rooms.get(mockGameState.currentRoomId)
      ),
      setObjectState: jest.fn(),
      getObjectState: jest.fn(),
      setFlag: jest.fn(),
      getFlag: jest.fn(),
    };

    // Mock EventManager
    mockEventManager = {
      triggerEvent: jest.fn().mockResolvedValue(true),
      scheduleEvent: jest.fn(),
      checkCondition: jest.fn().mockReturnValue(true),
      on: jest.fn(),
      checkPreCommandEvents: jest.fn().mockResolvedValue(null),
      checkPostCommandEvents: jest.fn().mockResolvedValue(null),
    };

    // Mock SoundManager
    mockSoundManager = {
      playSound: jest.fn(),
      playMusic: jest.fn(),
      playSoundEffect: jest.fn(),
    };

    // Mock Inventory
    mockInventory = {
      items: ['key', 'torch'],
      addItem: jest.fn().mockReturnValue({ success: true }),
      removeItem: jest.fn().mockReturnValue({ success: true }),
      hasItem: jest.fn().mockReturnValue(true),
      canCarry: jest.fn().mockReturnValue(true),
    };

    // Mock other systems
    mockViewManager = { updateView: jest.fn() };
    mockSceneRenderer = { renderScene: jest.fn() };
    mockInteractionSystem = {
      useItems: jest.fn().mockReturnValue({ success: false }),
      useItemOn: jest.fn().mockReturnValue({ success: false }),
    };
    mockMovementSystem = {
      movePlayer: jest.fn().mockReturnValue({ success: true }),
    };

    commandExecutor = new CommandExecutor(
      mockGameState,
      mockEventManager,
      mockViewManager,
      mockSceneRenderer,
      mockSoundManager,
      mockInventory,
      mockInteractionSystem,
      mockMovementSystem
    );

    // Add missing systems
    commandExecutor.puzzleSystem = null;
    commandExecutor.npcSystem = null;
    commandExecutor.gameProgression = null;
  });

  describe('handleSearch command', () => {
    it('should search a searchable object and find hidden items', async () => {
      mockGameState.getObjectState.mockReturnValue(false); // Not searched yet

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'search',
          directObject: 'desk',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'desk',
            object: mockGameState.objects.get('desk'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('You carefully search through the desk drawers');
      expect(result.text).toContain('You find: an old letter, a gold coin');
      expect(mockInventory.addItem).toHaveBeenCalledWith('letter');
      expect(mockInventory.addItem).toHaveBeenCalledWith('coin');
      expect(mockGameState.setObjectState).toHaveBeenCalledWith('desk', 'searched', true);
    });

    it('should not find items when searching again', async () => {
      mockGameState.getObjectState.mockReturnValue(true); // Already searched

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'search',
          directObject: 'desk',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'desk',
            object: mockGameState.objects.get('desk'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('You already searched the desk thoroughly.');
      expect(mockInventory.addItem).not.toHaveBeenCalled();
    });

    it('should handle searching with no hidden items', async () => {
      mockGameState.getObjectState.mockReturnValue(false);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'search',
          directObject: 'rug',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'rug',
            object: mockGameState.objects.get('rug'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('You find nothing under the rug.');
      expect(mockInventory.addItem).not.toHaveBeenCalled();
    });

    it('should trigger search events', async () => {
      mockGameState.getObjectState.mockReturnValue(false);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'search',
          directObject: 'bookshelf',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'bookshelf',
            object: mockGameState.objects.get('bookshelf'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith('bookshelf_searched', {
        object: 'bookshelf',
        itemsFound: ['secret_book'],
      });
    });

    it('should require specific item for some searches', async () => {
      mockGameState.hasItem.mockReturnValue(false);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'search',
          directObject: 'painting',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'painting',
            object: mockGameState.objects.get('painting'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('You need something to examine the painting more closely.');
      expect(mockInventory.addItem).not.toHaveBeenCalled();
    });

    it('should reveal hidden objects when found', async () => {
      mockGameState.hasItem.mockReturnValue(true);
      mockGameState.getObjectState.mockReturnValue(false);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'search',
          directObject: 'painting',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'painting',
            object: mockGameState.objects.get('painting'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('You find: a wall safe');
      expect(mockGameState.setObjectState).toHaveBeenCalledWith('safe', 'hidden', false);
    });

    it('should fail to search non-searchable objects', async () => {
      const wall = {
        id: 'wall',
        name: 'stone wall',
        searchable: false,
      };
      mockGameState.objects.set('wall', wall);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'search',
          directObject: 'wall',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'wall',
            object: wall,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe("There's nothing to search there.");
    });

    it('should handle search without direct object', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'search',
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('Search what?');
    });

    it('should handle inventory capacity when finding items', async () => {
      mockGameState.getObjectState.mockReturnValue(false);
      mockInventory.canCarry.mockReturnValue(false);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'search',
          directObject: 'desk',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'desk',
            object: mockGameState.objects.get('desk'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain("can't carry everything");
      expect(mockGameState.addToRoom).toHaveBeenCalled();
    });
  });

  describe('handleRead command', () => {
    it('should read readable items', async () => {
      const book = {
        id: 'book',
        name: 'ancient book',
        readable: true,
        text: 'The book contains ancient wisdom about the quest.',
      };
      mockGameState.items.set('book', book);
      mockInventory.hasItem.mockReturnValue(true);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'read',
          directObject: 'book',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'book',
            item: book,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('The book contains ancient wisdom about the quest.');
    });

    it('should read readable objects in room', async () => {
      const sign = {
        id: 'sign',
        name: 'wooden sign',
        readable: true,
        text: 'Welcome to the Test Room!',
      };
      mockGameState.objects.set('sign', sign);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'read',
          directObject: 'sign',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'sign',
            object: sign,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('Welcome to the Test Room!');
    });

    it('should fail to read non-readable items', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'read',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            item: mockGameState.items.get('key'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe("There's nothing to read on the brass key.");
    });

    it('should handle read without target', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'read',
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('Read what?');
    });
  });

  describe('handleEat and handleDrink commands', () => {
    it('should eat edible items', async () => {
      const apple = {
        id: 'apple',
        name: 'red apple',
        edible: true,
        eatMessage: 'The apple is crisp and delicious.',
        healthRestore: 10,
      };
      mockGameState.items.set('apple', apple);
      mockGameState.health = 90;
      mockGameState.maxHealth = 100;
      mockGameState.removeFromInventory = jest.fn();

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'eat',
          directObject: 'apple',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'apple',
            item: apple,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('The apple is crisp and delicious.');
      expect(mockGameState.removeFromInventory).toHaveBeenCalledWith('apple');
      expect(result.stateChanges.health).toBe(100);
    });

    it('should drink drinkable items', async () => {
      const potion = {
        id: 'potion',
        name: 'healing potion',
        drinkable: true,
        drinkMessage: 'The potion tastes sweet and refreshing.',
        healthRestore: 25,
      };
      mockGameState.items.set('potion', potion);
      mockGameState.health = 50;
      mockGameState.maxHealth = 100;
      mockGameState.removeFromInventory = jest.fn();

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'drink',
          directObject: 'potion',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'potion',
            item: potion,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('The potion tastes sweet and refreshing.');
      expect(mockGameState.removeFromInventory).toHaveBeenCalledWith('potion');
      expect(result.stateChanges.health).toBe(75);
    });

    it('should fail to eat non-edible items', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'eat',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            item: mockGameState.items.get('key'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe("That's not edible.");
    });

    it('should fail to drink non-drinkable items', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'drink',
          directObject: 'torch',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'torch',
            item: mockGameState.items.get('torch'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe("You can't drink that.");
    });

    it('should require item in inventory to eat', async () => {
      mockGameState.hasItem.mockReturnValue(false);
      
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'eat',
          directObject: 'apple',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'apple',
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe("You don't have that.");
    });
  });

  describe('handleYell command', () => {
    it('should yell and trigger echo', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'yell',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('You yell loudly. Your voice echoes.');
      expect(mockSoundManager.playSoundEffect).toHaveBeenCalledWith('yell');
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith('yell', {
        room: 'room1',
      });
    });

    it('should yell specific words', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'yell',
          directObject: 'help',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('You yell "HELP!" Your voice echoes.');
    });
  });

  describe('multi-word command aliases', () => {
    it('should resolve multi-word aliases like "n" to "go north"', async () => {
      // First test that 'n' is resolved to 'go' with direction
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'n',
          modifiers: [],
        },
      });

      // The alias resolution should convert 'n' to 'go' with north direction
      expect(mockMovementSystem.movePlayer).toHaveBeenCalledWith('north');
      expect(result.success).toBe(true);
    });

    it('should handle all directional aliases', async () => {
      const directions = [
        { alias: 's', direction: 'south' },
        { alias: 'e', direction: 'east' },
        { alias: 'w', direction: 'west' },
        { alias: 'ne', direction: 'northeast' },
        { alias: 'nw', direction: 'northwest' },
        { alias: 'se', direction: 'southeast' },
        { alias: 'sw', direction: 'southwest' },
        { alias: 'u', direction: 'up' },
        { alias: 'd', direction: 'down' },
      ];

      for (const { alias, direction } of directions) {
        await commandExecutor.execute({
          success: true,
          command: {
            verb: alias,
            modifiers: [],
          },
        });

        expect(mockMovementSystem.movePlayer).toHaveBeenCalledWith(direction);
      }
    });
  });
});