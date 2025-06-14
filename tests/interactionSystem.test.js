import { InteractionSystem } from '../js/InteractionSystem.js';
import { GameState } from '../js/GameState.js';
import { EventManager } from '../js/EventManager.js';

describe('InteractionSystem', () => {
  let interactionSystem;
  let gameState;
  let eventManager;

  beforeEach(() => {
    gameState = new GameState();
    eventManager = new EventManager(gameState);
    interactionSystem = new InteractionSystem(gameState, eventManager);

    // Mock game data
    const mockData = {
      items: {
        key: { id: 'key', name: 'brass key' },
        lamp: { id: 'lamp', name: 'oil lamp' },
        book: { id: 'book', name: 'ancient book' },
        water: { id: 'water', name: 'bottle of water' },
        flour: { id: 'flour', name: 'bag of flour' },
        bread: { id: 'bread', name: 'loaf of bread' },
      },
      objects: {
        door: { id: 'door', name: 'wooden door', state: 'locked' },
        torch: { id: 'torch', name: 'wall torch', state: 'unlit' },
      },
    };

    // Mock methods
    gameState.hasItem = jest.fn((id) =>
      ['key', 'lamp', 'water', 'flour'].includes(id)
    );
    gameState.getItem = jest.fn((id) => mockData.items[id]);
    gameState.getObject = jest.fn((id) => mockData.objects[id]);
    gameState.removeItem = jest.fn();
    gameState.addItem = jest.fn();
    gameState.setObjectState = jest.fn();
    gameState.setFlag = jest.fn();
    gameState.setExitState = jest.fn();
    gameState.updateScore = jest.fn();
    gameState.changeRoom = jest.fn();
    gameState.currentRoomId = 'library';

    // Mock findTarget to return the object
    interactionSystem.findTarget = jest.fn((id) => {
      if (mockData.items[id]) return mockData.items[id];
      if (mockData.objects[id]) return mockData.objects[id];
      return null;
    });

    eventManager.triggerEvent = jest.fn();
    eventManager.checkCondition = jest.fn((condition) => true);
  });

  describe('Initialization', () => {
    test('loads interactions from game data', () => {
      const gameData = {
        interactions: [
          {
            item1: 'lamp',
            item2: 'book',
            successMessage: 'The lamp illuminates the book!',
          },
        ],
        combinations: [
          {
            item1: 'water',
            item2: 'flour',
            resultItem: 'dough',
            message: 'You mix water and flour to make dough.',
          },
        ],
        unlockables: [
          {
            lockId: 'door',
            keyId: 'key',
            message: 'The door unlocks with a click.',
          },
        ],
      };

      interactionSystem.initialize(gameData);

      expect(interactionSystem.interactions.size).toBe(1);
      expect(interactionSystem.combinations.size).toBe(1);
      expect(interactionSystem.unlockables.size).toBe(1);
    });

    test('creates order-independent interaction keys', () => {
      const key1 = interactionSystem.getInteractionKey('lamp', 'book');
      const key2 = interactionSystem.getInteractionKey('book', 'lamp');
      expect(key1).toBe(key2);
    });
  });

  describe('Basic Interactions', () => {
    beforeEach(() => {
      interactionSystem.interactions.set('book:lamp', {
        successMessage: 'The lamp helps you read the ancient text!',
        effects: [
          { type: 'setFlag', flag: 'book_read', value: true },
          { type: 'changeScore', points: 10 },
        ],
      });
    });

    test('executes successful interaction', () => {
      const result = interactionSystem.useItemOn('lamp', 'book');

      expect(result.success).toBe(true);
      expect(result.message).toContain('helps you read');
      expect(result.effects).toHaveLength(2);
      expect(gameState.setFlag).toHaveBeenCalledWith('book_read', true);
      expect(gameState.updateScore).toHaveBeenCalledWith(10);
    });

    test('handles missing item', () => {
      gameState.hasItem.mockReturnValue(false);
      const result = interactionSystem.useItemOn('torch', 'book');

      expect(result.success).toBe(false);
      expect(result.message).toContain("don't have");
    });

    test('handles missing target', () => {
      interactionSystem.findTarget.mockReturnValue(null);
      const result = interactionSystem.useItemOn('lamp', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.message).toContain("can't see");
    });

    test('handles unscripted interaction', () => {
      const result = interactionSystem.useItemOn('key', 'book');

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });
  });

  describe('Conditional Interactions', () => {
    test('checks conditions before executing', () => {
      interactionSystem.interactions.set('key:torch', {
        conditions: [{ type: 'flag', flag: 'torch_ready', value: true }],
        successMessage: 'You unlock the torch mechanism.',
        failureMessage: 'The torch is not ready yet.',
      });

      eventManager.checkCondition.mockReturnValue(false);
      const result = interactionSystem.useItemOn('key', 'torch');

      expect(result.success).toBe(false);
      expect(result.message).toBe('The torch is not ready yet.');
    });

    test('consumes items when specified', () => {
      interactionSystem.interactions.set('key:lamp', {
        consumeItem: true,
        successMessage: 'The key melts in the lamp flame!',
      });

      const result = interactionSystem.useItemOn('key', 'lamp');

      expect(result.success).toBe(true);
      expect(gameState.removeItem).toHaveBeenCalledWith('key');
      expect(result.effects).toContainEqual({
        type: 'removeItem',
        itemId: 'key',
      });
    });
  });

  describe('Unlock Interactions', () => {
    beforeEach(() => {
      interactionSystem.unlockables.set('door:key', {
        message: 'The door unlocks!',
        flag: 'door_unlocked',
      });
    });

    test('unlocks locked objects', () => {
      gameState.getObjectState = jest.fn(() => 'locked');
      const result = interactionSystem.useItemOn('key', 'door');

      expect(result.success).toBe(true);
      expect(result.message).toBe('The door unlocks!');
      expect(gameState.setObjectState).toHaveBeenCalledWith('door', 'unlocked');
      expect(gameState.setFlag).toHaveBeenCalledWith('door_unlocked', true);
    });

    test('handles already unlocked objects', () => {
      gameState.getObjectState = jest.fn(() => 'unlocked');
      const result = interactionSystem.useItemOn('key', 'door');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already unlocked');
    });

    test('unlocks exits when specified', () => {
      interactionSystem.unlockables.set('door:key', {
        message: 'The door opens!',
        unlocksExit: { room: 'hallway', direction: 'north' },
      });

      gameState.getObjectState = jest.fn(() => 'locked');
      const result = interactionSystem.useItemOn('key', 'door');

      expect(gameState.setExitState).toHaveBeenCalledWith(
        'hallway',
        'north',
        'open'
      );
      expect(result.effects).toContainEqual({
        type: 'unlockExit',
        room: 'hallway',
        direction: 'north',
      });
    });
  });

  describe('Item Combinations', () => {
    beforeEach(() => {
      interactionSystem.combinations.set('flour:water', {
        resultItem: 'bread',
        message: 'You combine the ingredients to make bread!',
        setFlags: { bread_made: true },
      });
    });

    test('combines items successfully', () => {
      const result = interactionSystem.useItemOn('water', 'flour');

      expect(result.success).toBe(true);
      expect(result.message).toContain('make bread');
      expect(gameState.removeItem).toHaveBeenCalledWith('water');
      expect(gameState.removeItem).toHaveBeenCalledWith('flour');
      expect(gameState.addItem).toHaveBeenCalledWith('bread');
      expect(gameState.setFlag).toHaveBeenCalledWith('bread_made', true);
    });

    test('checks combination conditions', () => {
      interactionSystem.combinations.set('flour:water', {
        conditions: [{ type: 'flag', flag: 'has_oven', value: true }],
        resultItem: 'bread',
        message: 'You bake bread!',
        failureMessage: 'You need an oven to make bread.',
      });

      eventManager.checkCondition.mockReturnValue(false);
      const result = interactionSystem.useItemOn('water', 'flour');

      expect(result.success).toBe(false);
      expect(result.message).toBe('You need an oven to make bread.');
    });
  });

  describe('Condition Checking', () => {
    test('checks flag conditions', () => {
      gameState.getFlag = jest.fn(() => true);
      const result = interactionSystem.checkCondition({
        type: 'flag',
        flag: 'has_key',
        value: true,
      });
      expect(result).toBe(true);
      expect(gameState.getFlag).toHaveBeenCalledWith('has_key');
    });

    test('checks hasItem conditions', () => {
      const result = interactionSystem.checkCondition({
        type: 'hasItem',
        itemId: 'key',
      });
      expect(result).toBe(true);
      expect(gameState.hasItem).toHaveBeenCalledWith('key');
    });

    test('checks objectState conditions', () => {
      gameState.getObjectState = jest.fn(() => 'open');
      const result = interactionSystem.checkCondition({
        type: 'objectState',
        objectId: 'door',
        state: 'open',
      });
      expect(result).toBe(true);
    });

    test('checks score conditions', () => {
      gameState.score = 50;
      expect(
        interactionSystem.checkScoreCondition({
          operator: '>=',
          value: 40,
        })
      ).toBe(true);
      expect(
        interactionSystem.checkScoreCondition({
          operator: '<',
          value: 40,
        })
      ).toBe(false);
    });
  });

  describe('Effect Application', () => {
    test('applies various effect types', () => {
      const effects = [
        { type: 'addItem', itemId: 'sword' },
        { type: 'removeItem', itemId: 'key' },
        { type: 'setFlag', flag: 'quest_complete', value: true },
        { type: 'changeScore', points: 25 },
        { type: 'changeRoom', roomId: 'throne_room' },
        { type: 'setState', objectId: 'gate', state: 'open' },
      ];

      effects.forEach((effect) => {
        interactionSystem.applyEffect(effect);
      });

      expect(gameState.addItem).toHaveBeenCalledWith('sword');
      expect(gameState.removeItem).toHaveBeenCalledWith('key');
      expect(gameState.setFlag).toHaveBeenCalledWith('quest_complete', true);
      expect(gameState.updateScore).toHaveBeenCalledWith(25);
      expect(gameState.changeRoom).toHaveBeenCalledWith('throne_room');
      expect(gameState.setObjectState).toHaveBeenCalledWith('gate', 'open');
    });
  });

  describe('Hint System', () => {
    test('provides hints for available interactions', () => {
      interactionSystem.interactions.set('key:door', {
        hint: 'That key might open something...',
      });

      gameState.hasItem.mockImplementation((id) => id === 'key');
      interactionSystem.findTarget.mockImplementation((id) =>
        id === 'door' ? {} : null
      );

      const hints = interactionSystem.getHints();
      expect(hints).toContain('That key might open something...');
    });
  });

  describe('Interaction History', () => {
    test('records interaction attempts', () => {
      interactionSystem.useItemOn('key', 'door');

      expect(interactionSystem.interactionHistory).toHaveLength(1);
      expect(interactionSystem.interactionHistory[0]).toMatchObject({
        itemId: 'key',
        targetId: 'door',
        room: 'library',
      });
    });

    test('limits history size', () => {
      interactionSystem.maxHistorySize = 3;

      for (let i = 0; i < 5; i++) {
        interactionSystem.recordInteraction(`item${i}`, 'target');
      }

      expect(interactionSystem.interactionHistory).toHaveLength(3);
      expect(interactionSystem.interactionHistory[0].itemId).toBe('item2');
    });
  });
});
