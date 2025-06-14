import { CommandExecutor } from '../js/CommandExecutor.js';

describe('CommandExecutor', () => {
  let commandExecutor;
  let mockGameState;
  let mockEventManager;
  let mockSceneRenderer;
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
        ['room1', {
          id: 'room1',
          name: 'Test Room',
          description: 'A test room',
          exits: { north: 'room2', south: 'room3' },
          objects: ['door', 'table'],
          npcs: ['merchant']
        }],
        ['room2', {
          id: 'room2',
          name: 'North Room',
          description: 'The northern room'
        }]
      ]),
      items: new Map([
        ['key', { id: 'key', name: 'brass key', description: 'A small brass key' }],
        ['torch', { id: 'torch', name: 'torch', description: 'A burning torch' }]
      ]),
      objects: new Map([
        ['door', { id: 'door', name: 'wooden door', description: 'A heavy wooden door', canTake: false }],
        ['table', { id: 'table', name: 'table', description: 'An old wooden table', canTake: false }],
        ['book', { id: 'book', name: 'dusty book', description: 'An ancient tome', canTake: true }]
      ]),
      npcs: new Map([
        ['merchant', { id: 'merchant', name: 'Bob', description: 'A friendly merchant' }]
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
      saveGame: jest.fn().mockReturnValue(true),
      loadGame: jest.fn().mockReturnValue(true),
      getSaveFiles: jest.fn().mockReturnValue(['save1', 'save2']),
      deleteSave: jest.fn().mockReturnValue(true),
      history: [],
      flags: new Map()
    };

    // Mock EventManager
    mockEventManager = {
      triggerEvent: jest.fn(),
      scheduleEvent: jest.fn(),
      checkCondition: jest.fn().mockReturnValue(true),
      on: jest.fn()
    };

    // Mock SceneRenderer
    mockSceneRenderer = {
      renderScene: jest.fn()
    };

    // Mock Inventory
    mockInventory = {
      addItem: jest.fn().mockReturnValue({ success: true }),
      removeItem: jest.fn().mockReturnValue({ success: true }),
      hasItem: jest.fn().mockReturnValue(true),
      canCarry: jest.fn().mockReturnValue(true),
      getWeight: jest.fn().mockReturnValue(10),
      getSize: jest.fn().mockReturnValue(5),
      listItems: jest.fn().mockReturnValue(['key', 'torch']),
      examineItem: jest.fn().mockReturnValue({ success: true, description: 'Item description' }),
      isWearing: jest.fn().mockReturnValue(false),
      wearItem: jest.fn().mockReturnValue({ success: true }),
      removeWornItem: jest.fn().mockReturnValue({ success: true })
    };

    // Mock InteractionSystem
    mockInteractionSystem = {
      useItems: jest.fn().mockReturnValue({ success: false, message: 'Nothing happens.' }),
      unlockObject: jest.fn().mockReturnValue({ success: false }),
      combineItems: jest.fn().mockReturnValue({ success: false })
    };

    // Mock MovementSystem
    mockMovementSystem = {
      movePlayer: jest.fn().mockReturnValue({ success: true, message: 'You move north.' }),
      canMove: jest.fn().mockReturnValue(true),
      getBlockedMessage: jest.fn().mockReturnValue('The way is blocked.')
    };

    commandExecutor = new CommandExecutor(
      mockGameState,
      mockEventManager,
      mockSceneRenderer,
      mockInventory,
      mockInteractionSystem,
      mockMovementSystem
    );
  });

  describe('executeCommand', () => {
    it('should execute parsed commands', () => {
      const result = commandExecutor.executeCommand({
        verb: 'look',
        target: null
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Test Room');
    });

    it('should handle unknown verbs', () => {
      const result = commandExecutor.executeCommand({
        verb: 'dance',
        target: null
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("don't know how to 'dance'");
    });

    it('should add commands to history', () => {
      commandExecutor.executeCommand({ verb: 'look' });
      commandExecutor.executeCommand({ verb: 'inventory' });

      expect(mockGameState.history).toHaveLength(2);
      expect(mockGameState.history[0].command).toBe('look');
    });
  });

  describe('look command', () => {
    it('should describe the current room', () => {
      const result = commandExecutor.handleLook();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Test Room');
      expect(result.message).toContain('A test room');
      expect(result.message).toContain('Exits: north, south');
    });

    it('should look at specific objects', () => {
      const result = commandExecutor.handleLook({ target: 'door' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('A heavy wooden door');
    });

    it('should look at inventory items', () => {
      const result = commandExecutor.handleLook({ target: 'key' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('A small brass key');
    });

    it('should handle looking at non-existent things', () => {
      const result = commandExecutor.handleLook({ target: 'ghost' });

      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see any 'ghost'");
    });

    it('should look at NPCs', () => {
      const result = commandExecutor.handleLook({ target: 'merchant' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('A friendly merchant');
    });
  });

  describe('take command', () => {
    beforeEach(() => {
      mockGameState.getRoom.mockReturnValue({
        objects: ['book']
      });
    });

    it('should take objects from room', () => {
      const result = commandExecutor.handleTake({ target: 'book' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('take the dusty book');
      expect(mockInventory.addItem).toHaveBeenCalledWith('book');
    });

    it('should not take non-takeable objects', () => {
      const result = commandExecutor.handleTake({ target: 'door' });

      expect(result.success).toBe(false);
      expect(result.message).toContain("can't take");
    });

    it('should handle taking non-existent items', () => {
      const result = commandExecutor.handleTake({ target: 'ghost' });

      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see");
    });

    it('should handle inventory full', () => {
      mockInventory.canCarry.mockReturnValue(false);
      mockInventory.addItem.mockReturnValue({
        success: false,
        message: "You can't carry any more."
      });

      const result = commandExecutor.handleTake({ target: 'book' });

      expect(result.success).toBe(false);
      expect(result.message).toContain("can't carry");
    });
  });

  describe('drop command', () => {
    it('should drop items from inventory', () => {
      const result = commandExecutor.handleDrop({ target: 'key' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('drop the brass key');
      expect(mockInventory.removeItem).toHaveBeenCalledWith('key');
    });

    it('should handle dropping non-possessed items', () => {
      mockInventory.hasItem.mockReturnValue(false);

      const result = commandExecutor.handleDrop({ target: 'sword' });

      expect(result.success).toBe(false);
      expect(result.message).toContain("don't have");
    });

    it('should handle worn items', () => {
      mockInventory.isWearing.mockReturnValue(true);
      mockInventory.removeItem.mockReturnValue({
        success: false,
        message: "You need to remove it first."
      });

      const result = commandExecutor.handleDrop({ target: 'key' });

      expect(result.success).toBe(false);
      expect(result.message).toContain("need to remove");
    });
  });

  describe('use command', () => {
    it('should use single items', () => {
      mockInteractionSystem.useItems.mockReturnValue({
        success: true,
        message: 'You light the torch.'
      });

      const result = commandExecutor.handleUse({ item: 'torch' });

      expect(result.success).toBe(true);
      expect(mockInteractionSystem.useItems).toHaveBeenCalledWith('torch', null);
    });

    it('should use items on targets', () => {
      mockInteractionSystem.useItems.mockReturnValue({
        success: true,
        message: 'You unlock the door.'
      });

      const result = commandExecutor.handleUse({ item: 'key', target: 'door' });

      expect(result.success).toBe(true);
      expect(mockInteractionSystem.useItems).toHaveBeenCalledWith('key', 'door');
    });

    it('should handle using non-possessed items', () => {
      mockInventory.hasItem.mockReturnValue(false);

      const result = commandExecutor.handleUse({ item: 'sword' });

      expect(result.success).toBe(false);
      expect(result.message).toContain("don't have");
    });
  });

  describe('inventory command', () => {
    it('should list inventory items', () => {
      const result = commandExecutor.handleInventory();

      expect(result.success).toBe(true);
      expect(result.message).toContain('carrying:');
      expect(result.message).toContain('brass key');
      expect(result.message).toContain('torch');
    });

    it('should show inventory weight', () => {
      const result = commandExecutor.handleInventory();

      expect(result.message).toContain('Weight: 10');
    });

    it('should handle empty inventory', () => {
      mockInventory.listItems.mockReturnValue([]);

      const result = commandExecutor.handleInventory();

      expect(result.message).toContain("aren't carrying anything");
    });
  });

  describe('movement commands', () => {
    it('should move in valid directions', () => {
      const result = commandExecutor.handleGo({ direction: 'north' });

      expect(result.success).toBe(true);
      expect(mockMovementSystem.movePlayer).toHaveBeenCalledWith('north');
    });

    it('should handle blocked movement', () => {
      mockMovementSystem.canMove.mockReturnValue(false);
      mockMovementSystem.movePlayer.mockReturnValue({
        success: false,
        message: 'The door is locked.'
      });

      const result = commandExecutor.handleGo({ direction: 'north' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('locked');
    });

    it('should handle invalid directions', () => {
      mockMovementSystem.movePlayer.mockReturnValue({
        success: false,
        message: "You can't go that way."
      });

      const result = commandExecutor.handleGo({ direction: 'west' });

      expect(result.success).toBe(false);
    });
  });

  describe('examine command', () => {
    it('should examine objects in detail', () => {
      const result = commandExecutor.handleExamine({ target: 'door' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('heavy wooden door');
    });

    it('should reveal hidden details', () => {
      mockGameState.objects.get('door').hiddenDetails = 'You notice a keyhole.';

      const result = commandExecutor.handleExamine({ target: 'door' });

      expect(result.message).toContain('keyhole');
    });
  });

  describe('open/close commands', () => {
    it('should open openable objects', () => {
      mockGameState.objects.get('door').canOpen = true;
      mockGameState.objects.get('door').isOpen = false;

      const result = commandExecutor.handleOpen({ target: 'door' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('open the wooden door');
    });

    it('should not open already open objects', () => {
      mockGameState.objects.get('door').canOpen = true;
      mockGameState.objects.get('door').isOpen = true;

      const result = commandExecutor.handleOpen({ target: 'door' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('already open');
    });

    it('should handle locked objects', () => {
      mockGameState.objects.get('door').canOpen = true;
      mockGameState.objects.get('door').isLocked = true;

      const result = commandExecutor.handleOpen({ target: 'door' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('locked');
    });
  });

  describe('talk command', () => {
    it('should initiate NPC conversations', () => {
      commandExecutor.npcSystem = {
        startConversation: jest.fn().mockReturnValue({
          success: true,
          message: 'Hello there!',
          options: ['Ask about wares', 'Leave']
        })
      };

      const result = commandExecutor.handleTalk({ target: 'merchant' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Hello there!');
    });

    it('should handle talking to non-NPCs', () => {
      const result = commandExecutor.handleTalk({ target: 'door' });

      expect(result.success).toBe(false);
      expect(result.message).toContain("can't talk to");
    });
  });

  describe('save/load commands', () => {
    it('should save game state', () => {
      const result = commandExecutor.handleSave({ filename: 'mysave' });

      expect(result.success).toBe(true);
      expect(mockGameState.saveGame).toHaveBeenCalledWith('mysave');
    });

    it('should load game state', () => {
      const result = commandExecutor.handleLoad({ filename: 'mysave' });

      expect(result.success).toBe(true);
      expect(mockGameState.loadGame).toHaveBeenCalledWith('mysave');
    });

    it('should list save files', () => {
      const result = commandExecutor.handleSave({});

      expect(result.success).toBe(true);
      expect(result.message).toContain('Available saves:');
      expect(result.message).toContain('save1');
      expect(result.message).toContain('save2');
    });
  });

  describe('help command', () => {
    it('should show general help', () => {
      const result = commandExecutor.handleHelp();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Available commands:');
      expect(result.message).toContain('look');
      expect(result.message).toContain('take');
    });

    it('should show command-specific help', () => {
      const result = commandExecutor.handleHelp({ topic: 'look' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('look');
      expect(result.message).toContain('examine your surroundings');
    });
  });

  describe('unlock command', () => {
    it('should unlock objects with correct key', () => {
      mockInteractionSystem.unlockObject.mockReturnValue({
        success: true,
        message: 'You unlock the door.'
      });

      const result = commandExecutor.handleUnlock({ target: 'door', item: 'key' });

      expect(result.success).toBe(true);
      expect(mockInteractionSystem.unlockObject).toHaveBeenCalledWith('door', 'key');
    });
  });

  describe('give command', () => {
    it('should give items to NPCs', () => {
      commandExecutor.npcSystem = {
        isNPCPresent: jest.fn().mockReturnValue(true),
        getNPCReaction: jest.fn().mockReturnValue({
          message: 'Thank you!'
        })
      };

      const result = commandExecutor.handleGive({ item: 'key', target: 'merchant' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('give the brass key to Bob');
    });
  });

  describe('wear/remove commands', () => {
    it('should wear wearable items', () => {
      const result = commandExecutor.handleWear({ item: 'key' });

      expect(result.success).toBe(true);
      expect(mockInventory.wearItem).toHaveBeenCalledWith('key');
    });

    it('should remove worn items', () => {
      mockInventory.isWearing.mockReturnValue(true);

      const result = commandExecutor.handleRemove({ item: 'key' });

      expect(result.success).toBe(true);
      expect(mockInventory.removeWornItem).toHaveBeenCalledWith('key');
    });
  });

  describe('put command', () => {
    it('should put items in containers', () => {
      mockGameState.objects.get('table').isContainer = true;
      mockInventory.putInContainer = jest.fn().mockReturnValue({
        success: true,
        message: 'You put the key in the table.'
      });

      const result = commandExecutor.handlePut({ item: 'key', target: 'table' });

      expect(result.success).toBe(true);
      expect(mockInventory.putInContainer).toHaveBeenCalledWith('key', 'table');
    });
  });

  describe('meta commands', () => {
    it('should handle quit command', () => {
      window.confirm = jest.fn().mockReturnValue(true);

      const result = commandExecutor.handleQuit();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Thanks for playing');
    });

    it('should handle restart command', () => {
      window.confirm = jest.fn().mockReturnValue(true);

      const result = commandExecutor.handleRestart();

      expect(result.success).toBe(true);
      expect(result.shouldRestart).toBe(true);
    });

    it('should show score', () => {
      commandExecutor.gameProgression = {
        getScore: jest.fn().mockReturnValue(100),
        getMaxScore: jest.fn().mockReturnValue(200),
        getAchievements: jest.fn().mockReturnValue([
          { name: 'Explorer', unlocked: true }
        ])
      };

      const result = commandExecutor.handleScore();

      expect(result.success).toBe(true);
      expect(result.message).toContain('100 out of 200');
    });
  });

  describe('wait command', () => {
    it('should wait and pass time', () => {
      const result = commandExecutor.handleWait();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Time passes');
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith('wait');
    });
  });

  describe('alias support', () => {
    it('should support command aliases', () => {
      // 'i' is alias for 'inventory'
      const result = commandExecutor.executeCommand({ verb: 'i' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('carrying:');
    });

    it('should support examine aliases', () => {
      // 'x' is alias for 'examine'
      const result = commandExecutor.executeCommand({ 
        verb: 'x',
        target: 'door'
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('wooden door');
    });
  });

  describe('error handling', () => {
    it('should handle null commands gracefully', () => {
      const result = commandExecutor.executeCommand(null);

      expect(result.success).toBe(false);
      expect(result.message).toContain("didn't understand");
    });

    it('should handle commands with missing targets', () => {
      const result = commandExecutor.executeCommand({ verb: 'take' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Take what?');
    });

    it('should provide suggestions for typos', () => {
      const result = commandExecutor.executeCommand({ 
        verb: 'lok',
        target: 'door'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Did you mean 'look'?");
    });
  });
});