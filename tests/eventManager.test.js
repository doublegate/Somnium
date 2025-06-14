import { EventManager } from '../js/EventManager.js';

describe('EventManager', () => {
  let eventManager;
  let mockGameState;
  let mockAIManager;

  beforeEach(() => {
    // Mock GameState
    mockGameState = {
      currentRoomId: 'room1',
      flags: new Map([
        ['hasKey', true],
        ['doorOpen', false],
      ]),
      inventory: ['torch', 'map'],
      score: 50,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      setFlag: jest.fn(),
      getFlag: jest.fn((flag) => mockGameState.flags.get(flag)),
      hasItem: jest.fn((item) => mockGameState.inventory.includes(item)),
      updateScore: jest.fn(),
      getRoom: jest.fn().mockReturnValue({
        id: 'room1',
        objects: ['door', 'chest'],
      }),
      getCurrentRoom: jest.fn().mockReturnValue({
        id: 'room1',
        objects: ['door', 'chest'],
        events: [],
      }),
      getItem: jest.fn(),
      getObject: jest.fn(),
      getNPC: jest.fn(),
    };

    // Mock AIManager
    mockAIManager = {
      processCommand: jest.fn().mockResolvedValue({
        success: true,
        message: 'You do something dynamically.',
      }),
    };

    eventManager = new EventManager(mockGameState, mockAIManager);
  });

  describe('initialization', () => {
    it('should create an EventManager instance', () => {
      expect(eventManager).toBeDefined();
      expect(eventManager.gameState).toBe(mockGameState);
      expect(eventManager.aiManager).toBe(mockAIManager);
      expect(eventManager.scheduledEvents).toEqual([]);
      expect(eventManager.customHandlers).toBeInstanceOf(Map);
    });
  });

  describe('executeCommand', () => {
    it('should handle dynamic commands when no scripted response', async () => {
      const command = {
        verb: 'dance',
        directObject: null,
      };

      await eventManager.executeCommand(command);

      expect(mockAIManager.processCommand).toHaveBeenCalledWith(
        command,
        expect.any(Object)
      );
    });
  });

  describe('scheduleEvent', () => {
    it('should schedule an event for later', () => {
      const delay = 5000;
      const action = {
        type: 'SHOW_MESSAGE',
        message: 'Delayed message',
      };

      eventManager.scheduleEvent(delay, action);

      expect(eventManager.scheduledEvents).toHaveLength(1);
      expect(eventManager.scheduledEvents[0]).toMatchObject({
        time: expect.any(Number),
        action: action,
      });
    });
  });

  describe('checkPreCommandEvents', () => {
    it('should check for pre-command events', async () => {
      const command = {
        verb: 'open',
        directObject: 'door',
      };

      const result = await eventManager.checkPreCommandEvents(command);

      expect(result).toBeNull();
    });
  });

  describe('checkPostCommandEvents', () => {
    it('should check for post-command events', async () => {
      const command = {
        verb: 'take',
        directObject: 'key',
      };

      const result = {
        success: true,
        text: 'You take the key.',
      };

      await eventManager.checkPostCommandEvents(command, result);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('scheduled events', () => {
    it('should add events to the queue sorted by time', () => {
      const action1 = { type: 'ACTION1' };
      const action2 = { type: 'ACTION2' };

      eventManager.scheduleEvent(5000, action1);
      eventManager.scheduleEvent(2000, action2);

      expect(eventManager.scheduledEvents).toHaveLength(2);
      // Should be sorted by time (earliest first)
      expect(eventManager.scheduledEvents[0].action).toEqual(action2);
      expect(eventManager.scheduledEvents[1].action).toEqual(action1);
    });
  });

  describe('custom handlers', () => {
    it('should register custom handlers', () => {
      const customHandler = jest.fn();
      eventManager.registerHandler('customAction', customHandler);

      expect(eventManager.customHandlers.has('customAction')).toBe(true);
      expect(eventManager.customHandlers.get('customAction')).toBe(
        customHandler
      );
    });
  });
});
