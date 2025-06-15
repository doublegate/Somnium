import { CommandExecutor } from '../js/CommandExecutor.js';

describe('CommandExecutor', () => {
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
            objects: ['door', 'table'],
            npcs: ['merchant'],
          },
        ],
        [
          'room2',
          {
            id: 'room2',
            name: 'North Room',
            description: 'The northern room',
          },
        ],
      ]),
      items: new Map([
        [
          'key',
          { id: 'key', name: 'brass key', description: 'A small brass key' },
        ],
        [
          'torch',
          { id: 'torch', name: 'torch', description: 'A burning torch' },
        ],
      ]),
      objects: new Map([
        [
          'door',
          {
            id: 'door',
            name: 'wooden door',
            description: 'A heavy wooden door',
            takeable: false,
          },
        ],
        [
          'table',
          {
            id: 'table',
            name: 'table',
            description: 'An old wooden table',
            takeable: false,
          },
        ],
        [
          'book',
          {
            id: 'book',
            name: 'dusty book',
            description: 'An ancient tome',
            canTake: true,
          },
        ],
      ]),
      npcs: new Map([
        [
          'merchant',
          { id: 'merchant', name: 'Bob', description: 'A friendly merchant' },
        ],
      ]),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      setCurrentRoom: jest.fn(),
      getRoom: jest.fn((id) => mockGameState.rooms.get(id)),
      getItem: jest.fn((id) => mockGameState.items.get(id)),
      getObject: jest.fn((id) => mockGameState.objects.get(id)),
      getNPC: jest.fn((id) => mockGameState.npcs.get(id)),
      hasItem: jest.fn((id) => mockGameState.inventory.includes(id)),
      addToRoom: jest.fn(),
      removeFromRoom: jest.fn(),
      saveGame: jest.fn().mockResolvedValue(true),
      loadGame: jest.fn().mockResolvedValue(true),
      saveToStorage: jest.fn().mockReturnValue(true),
      loadFromStorage: jest.fn().mockReturnValue(true),
      getSaveFiles: jest.fn().mockReturnValue([
        {
          key: 'somnium_save_save1',
          title: 'Test Adventure',
          timestamp: new Date().toISOString(),
          score: 10,
          moves: 5,
        },
        {
          key: 'somnium_save_save2',
          title: 'Another Game',
          timestamp: new Date().toISOString(),
          score: 20,
          moves: 15,
        },
      ]),
      deleteSave: jest.fn().mockReturnValue(true),
      history: [],
      flags: new Map(),
      createSnapshot: jest.fn().mockReturnValue({}),
      restoreSnapshot: jest.fn(),
      setFlag: jest.fn(),
      getFlag: jest.fn(),
      getCurrentRoom: jest.fn(() =>
        mockGameState.rooms.get(mockGameState.currentRoomId)
      ),
      setObjectState: jest.fn(),
      getObjectState: jest.fn((id, state) => {
        const obj = mockGameState.objects.get(id);
        return obj && obj[state];
      }),
    };

    // Mock EventManager
    mockEventManager = {
      triggerEvent: jest.fn(),
      scheduleEvent: jest.fn(),
      checkCondition: jest.fn().mockReturnValue(true),
      on: jest.fn(),
      checkPreCommandEvents: jest.fn().mockResolvedValue(null),
      checkPostCommandEvents: jest.fn().mockResolvedValue(null),
    };

    // Mock ViewManager
    mockViewManager = {
      updateView: jest.fn(),
    };

    // Mock SceneRenderer
    mockSceneRenderer = {
      renderScene: jest.fn(),
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
      worn: {},
      containers: {},
      addItem: jest.fn().mockReturnValue({ success: true }),
      removeItem: jest.fn().mockReturnValue({ success: true }),
      hasItem: jest.fn().mockReturnValue(true),
      canCarry: jest.fn().mockReturnValue(true),
      getWeight: jest.fn().mockReturnValue(10),
      getSize: jest.fn().mockReturnValue(5),
      listItems: jest.fn().mockReturnValue(['key', 'torch']),
      getAllItems: jest.fn().mockReturnValue(['key', 'torch']),
      examineItem: jest
        .fn()
        .mockReturnValue({ success: true, description: 'Item description' }),
      isWearing: jest.fn().mockReturnValue(false),
      wearItem: jest.fn().mockReturnValue({ success: true }),
      removeWornItem: jest.fn().mockReturnValue({ success: true }),
      putInContainer: jest.fn().mockReturnValue({ success: true }),
      getTotalWeight: jest.fn().mockReturnValue(10),
      getMaxWeight: jest.fn().mockReturnValue(100),
      canAddItem: jest.fn().mockReturnValue({ canAdd: true }),
    };

    // Mock InteractionSystem
    mockInteractionSystem = {
      useItems: jest
        .fn()
        .mockReturnValue({ success: false, message: 'Nothing happens.' }),
      useItemOn: jest.fn().mockReturnValue({
        success: false,
        message: 'Nothing happens.',
        effects: [],
      }),
      unlockObject: jest.fn().mockReturnValue({ success: false }),
      combineItems: jest.fn().mockReturnValue({ success: false }),
    };

    // Mock MovementSystem
    mockMovementSystem = {
      movePlayer: jest
        .fn()
        .mockReturnValue({ success: true, message: 'You move north.' }),
      canMove: jest.fn().mockReturnValue(true),
      getBlockedMessage: jest.fn().mockReturnValue('The way is blocked.'),
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

    // Add missing systems to commandExecutor
    commandExecutor.puzzleSystem = null;
    commandExecutor.npcSystem = {
      isNPCPresent: jest.fn().mockReturnValue(true),
      getNPCReaction: jest.fn().mockReturnValue({
        message: 'Thank you!',
      }),
      giveItem: jest.fn().mockReturnValue({
        success: true,
        message: 'Thank you for the gift!',
        accepted: true,
        relationshipChange: 10,
      }),
      updateRelationship: jest.fn(),
      startConversation: jest.fn().mockReturnValue({
        success: true,
        message: 'Hello there!',
        options: ['Ask about wares', 'Leave'],
      }),
    };
    commandExecutor.gameProgression = null;
  });

  describe('executeCommand', () => {
    it('should execute parsed commands', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'look',
          directObject: null,
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Test Room');
    });

    it('should handle unknown verbs', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'dance',
          directObject: null,
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("don't know how to dance");
    });

    it('should add commands to history', async () => {
      await commandExecutor.execute({
        success: true,
        command: { verb: 'look', directObject: null, modifiers: [] },
      });
      await commandExecutor.execute({
        success: true,
        command: { verb: 'inventory', directObject: null, modifiers: [] },
      });

      expect(commandExecutor.commandHistory).toHaveLength(2);
      expect(commandExecutor.commandHistory[0].command.verb).toBe('look');
    });
  });

  describe('look command', () => {
    it('should describe the current room', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'look',
          directObject: null,
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Test Room');
      expect(result.text).toContain('A test room');
      expect(result.text).toContain('Exits: north, south');
    });

    it('should look at specific objects', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'look',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('A heavy wooden door');
    });

    it('should look at inventory items', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'look',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            object: mockGameState.items.get('key'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('A small brass key');
    });

    it('should handle looking at non-existent things', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'look',
          directObject: 'ghost',
          resolvedDirectObject: {
            type: 'unknown',
            value: 'ghost',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("don't see that here");
    });

    it('should look at NPCs', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'look',
          directObject: 'merchant',
          resolvedDirectObject: {
            type: 'NPC',
            value: 'merchant',
            object: mockGameState.npcs.get('merchant'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('A friendly merchant');
    });
  });

  describe('take command', () => {
    beforeEach(() => {
      mockGameState.getRoom.mockReturnValue({
        objects: ['book', 'door'],
      });
    });

    it('should take objects from room', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'take',
          directObject: 'book',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'book',
            object: mockGameState.objects.get('book'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Taken');
      expect(mockInventory.addItem).toHaveBeenCalledWith('book');
    });

    it('should not take non-takeable objects', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'take',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("can't take that");
    });

    it('should handle taking non-existent items', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'take',
          directObject: 'ghost',
          resolvedDirectObject: {
            type: 'unknown',
            value: 'ghost',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("don't see");
    });

    it('should handle inventory full', async () => {
      mockInventory.canCarry.mockReturnValue(false);
      mockInventory.addItem.mockReturnValue({
        success: false,
        message: "You can't carry any more.",
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'take',
          directObject: 'book',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'book',
            object: mockGameState.objects.get('book'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("can't carry");
    });
  });

  describe('drop command', () => {
    it('should drop items from inventory', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'drop',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            object: mockGameState.items.get('key'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Dropped');
      expect(mockInventory.removeItem).toHaveBeenCalledWith('key');
    });

    it('should handle dropping non-possessed items', async () => {
      mockInventory.hasItem.mockReturnValue(false);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'drop',
          directObject: 'sword',
          resolvedDirectObject: {
            type: 'unknown',
            value: 'sword',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("don't have");
    });

    it('should handle worn items', async () => {
      mockInventory.isWearing.mockReturnValue(true);
      mockInventory.removeItem.mockReturnValue({
        success: false,
        message: 'You need to remove it first.',
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'drop',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            object: mockGameState.items.get('key'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain('need to remove');
    });
  });

  describe('use command', () => {
    it('should use single items', async () => {
      mockInteractionSystem.useItemOn.mockReturnValue({
        success: true,
        message: 'You light the torch.',
        effects: [],
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'use',
          directObject: 'torch',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'torch',
            object: mockGameState.items.get('torch'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockInteractionSystem.useItemOn).toHaveBeenCalledWith(
        'torch',
        null
      );
    });

    it('should use items on targets', async () => {
      mockInteractionSystem.useItemOn.mockReturnValue({
        success: true,
        message: 'You unlock the door.',
        effects: [],
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'use',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            object: mockGameState.items.get('key'),
          },
          modifiers: [],
          indirectObject: 'door',
          resolvedIndirectObject: { type: 'OBJECT', value: 'door' },
          preposition: 'on',
        },
      });

      expect(result.success).toBe(true);
      expect(mockInteractionSystem.useItemOn).toHaveBeenCalledWith(
        'key',
        'door'
      );
    });

    it('should handle using non-possessed items', async () => {
      mockInventory.hasItem.mockReturnValue(false);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'use',
          directObject: 'sword',
          resolvedDirectObject: {
            type: 'unknown',
            value: 'sword',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("don't have");
    });
  });

  describe('inventory command', () => {
    it('should list inventory items', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'inventory',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('carrying:');
      expect(result.text).toContain('brass key');
      expect(result.text).toContain('torch');
    });

    it('should show inventory weight', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'inventory',
          modifiers: [],
        },
      });

      expect(result.text).toContain('Weight: 10');
    });

    it('should handle empty inventory', async () => {
      mockInventory.listItems.mockReturnValue([]);
      mockInventory.items = [];

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'inventory',
          modifiers: [],
        },
      });

      expect(result.text).toContain("aren't carrying anything");
    });
  });

  describe('movement commands', () => {
    it('should move in valid directions', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'go',
          directObject: 'north',
          resolvedDirectObject: {
            type: 'DIRECTION',
            value: 'north',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockMovementSystem.movePlayer).toHaveBeenCalledWith('north');
    });

    it('should handle blocked movement', async () => {
      mockMovementSystem.canMove.mockReturnValue(false);
      mockMovementSystem.movePlayer.mockReturnValue({
        success: false,
        message: 'The door is locked.',
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'go',
          directObject: 'north',
          resolvedDirectObject: {
            type: 'DIRECTION',
            value: 'north',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain('locked');
    });

    it('should handle invalid directions', async () => {
      mockMovementSystem.movePlayer.mockReturnValue({
        success: false,
        message: "You can't go that way.",
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'go',
          directObject: 'west',
          resolvedDirectObject: {
            type: 'DIRECTION',
            value: 'west',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('examine command', () => {
    it('should examine objects in detail', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'examine',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('heavy wooden door');
    });

    it('should reveal hidden details', async () => {
      mockGameState.objects.get('door').hiddenDetails = 'You notice a keyhole.';

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'examine',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
        },
      });

      expect(result.text).toContain('keyhole');
    });
  });

  describe('open/close commands', () => {
    it('should open openable objects', async () => {
      mockGameState.objects.get('door').canOpen = true;
      mockGameState.objects.get('door').isOpen = false;

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'open',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('open the wooden door');
    });

    it('should not open already open objects', async () => {
      mockGameState.objects.get('door').canOpen = true;
      mockGameState.objects.get('door').isOpen = true;

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'open',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain('already open');
    });

    it('should handle locked objects', async () => {
      mockGameState.objects.get('door').canOpen = true;
      mockGameState.objects.get('door').isLocked = true;

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'open',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain('locked');
    });
  });

  describe('talk command', () => {
    it('should initiate NPC conversations', async () => {
      commandExecutor.npcSystem.startConversation = jest.fn().mockReturnValue({
        success: true,
        message: 'Hello there!',
        options: ['Ask about wares', 'Leave'],
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'talk',
          directObject: 'merchant',
          resolvedDirectObject: {
            type: 'NPC',
            value: 'merchant',
            object: mockGameState.npcs.get('merchant'),
          },
          modifiers: [],
          preposition: 'to',
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Hello there!');
    });

    it('should handle talking to non-NPCs', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'talk',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
          preposition: 'to',
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("can't talk to");
    });
  });

  describe('save/load commands', () => {
    it('should save game state', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'save',
          directObject: 'mysave',
          resolvedDirectObject: {
            type: 'STRING',
            value: 'mysave',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockGameState.saveToStorage).toHaveBeenCalledWith('mysave');
    });

    it('should load game state', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'load',
          directObject: 'mysave',
          resolvedDirectObject: {
            type: 'STRING',
            value: 'mysave',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockGameState.loadFromStorage).toHaveBeenCalledWith('mysave');
    });

    it('should save to file when no name provided', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'save',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Game saved to file');
      expect(mockGameState.saveGame).toHaveBeenCalled();
    });

    it('should list save files with load command', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'load',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Available saves:');
      expect(result.text).toContain('save1');
      expect(result.text).toContain('save2');
    });
  });

  describe('help command', () => {
    it('should show general help', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'help',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Available commands:');
      expect(result.text).toContain('look');
      expect(result.text).toContain('take');
    });

    it('should show command-specific help', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'help',
          directObject: 'look',
          resolvedDirectObject: {
            type: 'STRING',
            value: 'look',
            object: null,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('look');
      expect(result.text).toContain('examine your surroundings');
    });
  });

  describe('unlock command', () => {
    it('should unlock objects with correct key', async () => {
      mockInteractionSystem.unlockObject.mockReturnValue({
        success: true,
        message: 'You unlock the door.',
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'unlock',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
          indirectObject: 'key',
          resolvedIndirectObject: {
            type: 'ITEM',
            value: 'key',
            object: mockGameState.items.get('key'),
          },
          preposition: 'with',
        },
      });

      expect(result.success).toBe(true);
      expect(mockInteractionSystem.unlockObject).toHaveBeenCalledWith(
        'door',
        'key'
      );
    });
  });

  describe('give command', () => {
    it('should give items to NPCs', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'give',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            object: mockGameState.items.get('key'),
          },
          modifiers: [],
          indirectObject: 'merchant',
          resolvedIndirectObject: {
            type: 'NPC',
            value: 'merchant',
            object: mockGameState.npcs.get('merchant'),
          },
          preposition: 'to',
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Thank you for the gift!');
    });
  });

  describe('wear/remove commands', () => {
    it('should wear wearable items', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'wear',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            object: mockGameState.items.get('key'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockInventory.wearItem).toHaveBeenCalledWith('key');
    });

    it('should remove worn items', async () => {
      mockInventory.isWearing.mockReturnValue(true);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'remove',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            object: mockGameState.items.get('key'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockInventory.removeWornItem).toHaveBeenCalledWith('key');
    });
  });

  describe('put command', () => {
    it('should put items in containers', async () => {
      mockGameState.objects.get('table').isContainer = true;
      mockGameState.objects.get('table').isOpen = true;
      mockInventory.putInContainer = jest.fn().mockReturnValue({
        success: true,
        message: 'You put the key in the table.',
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'put',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            object: mockGameState.items.get('key'),
          },
          modifiers: [],
          indirectObject: 'table',
          resolvedIndirectObject: {
            type: 'OBJECT',
            value: 'table',
            object: mockGameState.objects.get('table'),
          },
          preposition: 'in',
        },
      });

      expect(result.success).toBe(true);
      expect(mockInventory.putInContainer).toHaveBeenCalledWith('key', 'table');
    });
  });

  describe('meta commands', () => {
    it('should handle quit command', async () => {
      window.confirm = jest.fn().mockReturnValue(true);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'quit',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Thanks for playing');
    });

    it('should handle restart command', async () => {
      window.confirm = jest.fn().mockReturnValue(true);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'restart',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.shouldRestart).toBe(true);
    });

    it('should show score', async () => {
      commandExecutor.gameProgression = {
        getScore: jest.fn().mockReturnValue(100),
        getMaxScore: jest.fn().mockReturnValue(200),
        getAchievements: jest
          .fn()
          .mockReturnValue([{ name: 'Explorer', unlocked: true }]),
      };

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'score',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('100 out of 200');
    });
  });

  describe('wait command', () => {
    it('should wait and pass time', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'wait',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Time passes');
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith('wait');
    });
  });

  describe('alias support', () => {
    it('should support command aliases', async () => {
      // 'i' is alias for 'inventory'
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'i',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('carrying:');
    });

    it('should support examine aliases', async () => {
      // 'x' is alias for 'examine'
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'x',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toContain('wooden door');
    });
  });

  describe('error handling', () => {
    it('should handle null commands gracefully', async () => {
      const result = await commandExecutor.execute({
        success: false,
        error: "I didn't understand that command.",
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("didn't understand");
    });

    it('should handle commands with missing targets', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'take',
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain('Take what?');
    });

    it('should provide suggestions for typos', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'lok',
          directObject: 'door',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'door',
            object: mockGameState.objects.get('door'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toContain("don't know how to lok");
    });
  });
});
