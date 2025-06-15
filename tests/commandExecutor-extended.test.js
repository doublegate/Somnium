import { CommandExecutor } from '../js/CommandExecutor.js';

describe('CommandExecutor - Extended Tests for New Handlers', () => {
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
            objects: ['lever', 'dial', 'button', 'stone', 'wall'],
            npcs: ['wizard'],
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
          'lever',
          {
            id: 'lever',
            name: 'rusty lever',
            description: 'A rusty lever protruding from the wall',
            pushable: true,
            pullable: true,
            pullMessage: 'You pull the lever and hear gears grinding.',
            pushMessage: 'The lever resists being pushed.',
            pullEvent: 'lever_pulled',
            pullStages: [
              { state: 1, message: 'The lever moves slightly.' },
              { state: 2, message: 'The lever is halfway down.' },
              { state: 3, message: 'The lever clicks into place.' },
            ],
            takeable: false,
          },
        ],
        [
          'dial',
          {
            id: 'dial',
            name: 'stone dial',
            description: 'An ancient dial with symbols',
            turnable: true,
            turnPositions: ['north', 'east', 'south', 'west'],
            turnMessages: {
              north: 'The dial points north. A faint humming begins.',
              east: 'The dial points east. The humming grows louder.',
              south: 'The dial points south. Something clicks.',
              west: 'The dial points west. Silence falls.',
            },
            turnEvent: 'dial_turned',
            takeable: false,
          },
        ],
        [
          'button',
          {
            id: 'button',
            name: 'red button',
            description: 'A shiny red button',
            pushable: true,
            requiresItem: 'glove',
            pushFailMessage: 'The button is too hot to touch!',
            pushMessage: 'You press the button. A door opens somewhere.',
            pushEvent: 'button_pressed',
            touchMessage: 'The button feels extremely hot!',
            temperature: 'burning hot',
            touchEffects: [
              { type: 'damage', amount: 10 },
              { type: 'temperature', value: 'hot' },
            ],
            takeable: false,
          },
        ],
        [
          'stone',
          {
            id: 'stone',
            name: 'heavy stone',
            description: 'A large, heavy stone blocking something',
            pushable: true,
            movable: true,
            pushMessage: 'With great effort, you push the stone aside.',
            texture: 'rough and cold',
            touchMessage: 'The stone feels ancient and weathered.',
            takeable: false,
          },
        ],
        [
          'wall',
          {
            id: 'wall',
            name: 'stone wall',
            description: 'A solid stone wall',
            texture: 'smooth and cold',
            touchEffects: [
              { type: 'setFlag', flag: 'wall_touched', value: true },
            ],
            touchEvent: 'wall_touched',
            takeable: false,
          },
        ],
      ]),
      npcs: new Map([
        [
          'wizard',
          {
            id: 'wizard',
            name: 'Merlin',
            description: 'A wise wizard',
            topics: {
              magic: 'Magic is everywhere, if you know where to look.',
              lever: 'That lever controls an ancient mechanism.',
              dial: 'The dial must be turned to the correct position.',
            },
            giveItemResponse: {
              key: 'I have no use for keys in my magical realm.',
              torch: 'Light is always welcome in dark times.',
            },
          },
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
      getCurrentRoom: jest.fn(() =>
        mockGameState.rooms.get(mockGameState.currentRoomId)
      ),
      setObjectState: jest.fn(),
      getObjectState: jest.fn((id, state) => {
        const obj = mockGameState.objects.get(id);
        return obj && obj[state];
      }),
      setFlag: jest.fn(),
      getFlag: jest.fn(),
      health: 100,
      maxHealth: 100,
      removeFromInventory: jest.fn(),
      createSnapshot: jest.fn().mockReturnValue({}),
      restoreSnapshot: jest.fn(),
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
      startDialogue: jest.fn().mockReturnValue({
        success: true,
        message: 'Magic is everywhere, if you know where to look.',
        relationshipChange: 5,
        itemGiven: null,
      }),
    };
    commandExecutor.gameProgression = null;
  });

  describe('handlePush command', () => {
    it('should push a pushable object', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'push',
          directObject: 'stone',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'stone',
            object: mockGameState.objects.get('stone'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('With great effort, you push the stone aside.');
      expect(mockGameState.setObjectState).toHaveBeenCalledWith(
        'stone',
        'pushed',
        true
      );
      expect(mockSoundManager.playSoundEffect).toHaveBeenCalledWith(
        'push_stone'
      );
    });

    it('should fail to push non-pushable objects', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'push',
          directObject: 'wall',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'wall',
            object: mockGameState.objects.get('wall'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe("You can't push the stone wall.");
      expect(mockGameState.setObjectState).not.toHaveBeenCalled();
    });

    it('should require specific item for push if specified', async () => {
      mockGameState.hasItem.mockReturnValue(false);
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'push',
          directObject: 'button',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'button',
            object: mockGameState.objects.get('button'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('The button is too hot to touch!');
      expect(mockGameState.setObjectState).not.toHaveBeenCalled();
    });

    it('should trigger push event when specified', async () => {
      mockGameState.hasItem.mockReturnValue(true);
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'push',
          directObject: 'button',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'button',
            object: mockGameState.objects.get('button'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('You press the button. A door opens somewhere.');
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith(
        'button_pressed',
        {
          object: 'button',
        }
      );
    });

    it('should handle push without direct object', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'push',
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('Push what?');
    });

    it('should resist pushing when object has push resistance', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'push',
          directObject: 'lever',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'lever',
            object: mockGameState.objects.get('lever'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('The lever resists being pushed.');
    });

    it('should move object to different room if moveToRoom specified', async () => {
      const boulder = {
        id: 'boulder',
        name: 'boulder',
        pushable: true,
        moveToRoom: 'room2',
        pushMessage: 'You push the boulder into the next room.',
      };
      mockGameState.objects.set('boulder', boulder);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'push',
          directObject: 'boulder',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'boulder',
            object: boulder,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockGameState.removeFromRoom).toHaveBeenCalledWith(
        'room1',
        'boulder'
      );
      expect(mockGameState.addToRoom).toHaveBeenCalledWith('room2', 'boulder');
    });
  });

  describe('handlePull command', () => {
    it('should pull a pullable object', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'pull',
          directObject: 'lever',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'lever',
            object: mockGameState.objects.get('lever'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('You pull the lever and hear gears grinding.');
      expect(mockGameState.setObjectState).toHaveBeenCalledWith(
        'lever',
        'pulled',
        true
      );
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith(
        'lever_pulled',
        {
          object: 'lever',
        }
      );
    });

    it('should handle multi-stage pull', async () => {
      const lever = mockGameState.objects.get('lever');

      // First pull
      mockGameState.getObjectState.mockReturnValue(0);
      let result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'pull',
          directObject: 'lever',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'lever',
            object: lever,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('The lever moves slightly.');
      expect(mockGameState.setObjectState).toHaveBeenCalledWith(
        'lever',
        'pullStage',
        1
      );

      // Second pull
      mockGameState.getObjectState.mockReturnValue(1);
      result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'pull',
          directObject: 'lever',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'lever',
            object: lever,
          },
          modifiers: [],
        },
      });

      expect(result.text).toBe('The lever is halfway down.');
      expect(mockGameState.setObjectState).toHaveBeenCalledWith(
        'lever',
        'pullStage',
        2
      );
    });

    it('should fail to pull non-pullable objects', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'pull',
          directObject: 'wall',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'wall',
            object: mockGameState.objects.get('wall'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe("You can't pull the stone wall.");
    });

    it('should handle pull without direct object', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'pull',
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('Pull what?');
    });

    it('should trigger stage events', async () => {
      const chain = {
        id: 'chain',
        name: 'chain',
        pullable: true,
        pullStages: [
          { state: 1, message: 'The chain rattles.', event: 'chain_rattle' },
          { state: 2, message: 'A secret door opens!', event: 'door_open' },
        ],
      };
      mockGameState.objects.set('chain', chain);
      mockGameState.getObjectState.mockReturnValue(1);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'pull',
          directObject: 'chain',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'chain',
            object: chain,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('A secret door opens!');
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith('door_open', {
        object: 'chain',
        stage: 2,
      });
    });
  });

  describe('handleTurn command', () => {
    it('should turn a turnable object', async () => {
      mockGameState.getObjectState.mockReturnValue(0); // Current position

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'turn',
          directObject: 'dial',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'dial',
            object: mockGameState.objects.get('dial'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe(
        'The dial points east. The humming grows louder.'
      );
      expect(mockGameState.setObjectState).toHaveBeenCalledWith(
        'dial',
        'turnState',
        1
      );
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith(
        'dial_turned',
        {
          object: 'dial',
          state: 1,
        }
      );
    });

    it('should cycle through turn positions', async () => {
      const dial = mockGameState.objects.get('dial');
      mockGameState.getObjectState.mockReturnValue(3); // Last position

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'turn',
          directObject: 'dial',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'dial',
            object: dial,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe(
        'The dial points north. A faint humming begins.'
      );
      expect(mockGameState.setObjectState).toHaveBeenCalledWith(
        'dial',
        'turnState',
        0
      );
    });

    it('should fail to turn non-turnable objects', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'turn',
          directObject: 'stone',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'stone',
            object: mockGameState.objects.get('stone'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe("You can't turn the heavy stone.");
    });

    it('should handle turn without direct object', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'turn',
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('Turn what?');
    });

    it('should use default messages when no turnMessages', async () => {
      const knob = {
        id: 'knob',
        name: 'knob',
        turnable: true,
        turnPositions: ['off', 'on'],
      };
      mockGameState.objects.set('knob', knob);
      mockGameState.getObjectState.mockReturnValue(0);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'turn',
          directObject: 'knob',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'knob',
            object: knob,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('You turn the knob to position: on.');
    });
  });

  describe('handleTouch command', () => {
    it('should touch an object and feel texture', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'touch',
          directObject: 'stone',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'stone',
            object: mockGameState.objects.get('stone'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('The stone feels ancient and weathered.');
      expect(mockGameState.setObjectState).toHaveBeenCalledWith(
        'stone',
        'touched',
        true
      );
    });

    it('should feel temperature when specified', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'touch',
          directObject: 'button',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'button',
            object: mockGameState.objects.get('button'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('The button feels extremely hot!');
      expect(mockGameState.health).toBe(90); // Damage applied
      expect(mockSoundManager.playSoundEffect).toHaveBeenCalledWith('sizzle');
    });

    it('should trigger touch events', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'touch',
          directObject: 'wall',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'wall',
            object: mockGameState.objects.get('wall'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockGameState.setFlag).toHaveBeenCalledWith('wall_touched', true);
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith(
        'wall_touched',
        {
          object: 'wall',
        }
      );
    });

    it('should handle electric shock effect', async () => {
      const wire = {
        id: 'wire',
        name: 'exposed wire',
        touchEffects: [{ type: 'electric' }],
        touchMessage: 'ZAP! You get shocked!',
      };
      mockGameState.objects.set('wire', wire);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'touch',
          directObject: 'wire',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'wire',
            object: wire,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('ZAP! You get shocked!');
      expect(mockSoundManager.playSoundEffect).toHaveBeenCalledWith(
        'electric_shock'
      );
    });

    it('should handle sticky effect', async () => {
      const tar = {
        id: 'tar',
        name: 'tar',
        touchEffects: [{ type: 'sticky' }],
        touchMessage: 'The tar sticks to your hand!',
      };
      mockGameState.objects.set('tar', tar);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'touch',
          directObject: 'tar',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'tar',
            object: tar,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockGameState.setObjectState).toHaveBeenCalledWith(
        'tar',
        'stuckToPlayer',
        true
      );
    });

    it('should handle cold temperature effect', async () => {
      const ice = {
        id: 'ice',
        name: 'ice block',
        touchEffects: [{ type: 'temperature', value: 'cold' }],
        temperature: 'freezing cold',
      };
      mockGameState.objects.set('ice', ice);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'touch',
          directObject: 'ice',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'ice',
            object: ice,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('It feels freezing cold.');
      expect(mockSoundManager.playSoundEffect).toHaveBeenCalledWith('freeze');
    });

    it('should trigger player death on lethal damage', async () => {
      const spike = {
        id: 'spike',
        name: 'spike',
        touchEffects: [{ type: 'damage', amount: 100 }],
        touchMessage: 'The spike pierces your hand!',
      };
      mockGameState.objects.set('spike', spike);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'touch',
          directObject: 'spike',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'spike',
            object: spike,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockGameState.health).toBe(0);
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith(
        'player_death',
        {
          cause: 'touch',
        }
      );
    });

    it('should handle touch without direct object', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'touch',
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('Touch what?');
    });

    it('should generate default message based on texture', async () => {
      const fabric = {
        id: 'fabric',
        name: 'fabric',
        texture: 'soft and silky',
      };
      mockGameState.objects.set('fabric', fabric);

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'touch',
          directObject: 'fabric',
          resolvedDirectObject: {
            type: 'OBJECT',
            value: 'fabric',
            object: fabric,
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('It feels soft and silky.');
    });
  });

  describe('handleAsk enhanced NPC integration', () => {
    it('should ask NPC about a known topic', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'ask',
          directObject: 'wizard',
          resolvedDirectObject: {
            type: 'NPC',
            value: 'wizard',
            npc: mockGameState.npcs.get('wizard'),
          },
          indirectObject: 'magic',
          preposition: 'about',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(commandExecutor.npcSystem.startDialogue).toHaveBeenCalledWith(
        'wizard',
        'magic'
      );
      expect(result.text).toBe(
        'Magic is everywhere, if you know where to look.'
      );
    });

    it('should handle unknown topics gracefully', async () => {
      commandExecutor.npcSystem.startDialogue.mockReturnValue({
        success: false,
        message: "I don't know anything about that.",
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'ask',
          directObject: 'wizard',
          resolvedDirectObject: {
            type: 'NPC',
            value: 'wizard',
            npc: mockGameState.npcs.get('wizard'),
          },
          indirectObject: 'quantum physics',
          preposition: 'about',
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe("I don't know anything about that.");
    });

    it('should handle relationship changes from dialogue', async () => {
      commandExecutor.npcSystem.startDialogue.mockReturnValue({
        success: true,
        message: 'Let me tell you a secret...',
        relationshipChange: 10,
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'ask',
          directObject: 'wizard',
          resolvedDirectObject: {
            type: 'NPC',
            value: 'wizard',
            npc: mockGameState.npcs.get('wizard'),
          },
          indirectObject: 'secret',
          preposition: 'about',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(commandExecutor.npcSystem.updateRelationship).toHaveBeenCalledWith(
        'wizard',
        10
      );
    });

    it('should handle item rewards from dialogue', async () => {
      commandExecutor.npcSystem.startDialogue.mockReturnValue({
        success: true,
        message: 'Here, take this magic scroll.',
        itemGiven: 'scroll',
      });

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'ask',
          directObject: 'wizard',
          resolvedDirectObject: {
            type: 'NPC',
            value: 'wizard',
            npc: mockGameState.npcs.get('wizard'),
          },
          indirectObject: 'help',
          preposition: 'about',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockInventory.addItem).toHaveBeenCalledWith('scroll');
    });

    it('should require topic when asking', async () => {
      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'ask',
          directObject: 'wizard',
          resolvedDirectObject: {
            type: 'NPC',
            value: 'wizard',
            npc: mockGameState.npcs.get('wizard'),
          },
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('Ask about what?');
    });
  });

  describe('handlePut container state checking', () => {
    beforeEach(() => {
      const chest = {
        id: 'chest',
        name: 'wooden chest',
        isContainer: true,
        isOpen: false,
      };
      mockGameState.objects.set('chest', chest);
    });

    it('should check if container is open before putting items', async () => {
      mockGameState.getObjectState.mockReturnValue(false); // Container is closed

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'put',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            item: mockGameState.items.get('key'),
          },
          indirectObject: 'chest',
          resolvedIndirectObject: {
            type: 'OBJECT',
            value: 'chest',
            object: mockGameState.objects.get('chest'),
          },
          preposition: 'in',
          modifiers: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.text).toBe('The wooden chest is closed.');
      expect(mockInventory.putInContainer).not.toHaveBeenCalled();
    });

    it('should allow putting items in open containers', async () => {
      mockGameState.getObjectState.mockReturnValue(true); // Container is open

      const result = await commandExecutor.execute({
        success: true,
        command: {
          verb: 'put',
          directObject: 'key',
          resolvedDirectObject: {
            type: 'ITEM',
            value: 'key',
            item: mockGameState.items.get('key'),
          },
          indirectObject: 'chest',
          resolvedIndirectObject: {
            type: 'OBJECT',
            value: 'chest',
            object: mockGameState.objects.get('chest'),
          },
          preposition: 'in',
          modifiers: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockInventory.putInContainer).toHaveBeenCalledWith('key', 'chest');
    });
  });
});
