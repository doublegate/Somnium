import { EventManager } from '../js/EventManager.js';

describe('EventManager - Extended Tests', () => {
  let eventManager;
  let mockGameState;
  let mockAIManager;

  beforeEach(() => {
    // Mock GameState
    mockGameState = {
      currentRoom: {
        id: 'room1',
        name: 'Test Room',
        description: 'A test room',
        events: [
          {
            name: 'lever_pulled',
            condition: 'leverReady',
            actions: [
              { type: 'SHOW_MESSAGE', text: 'The door opens!' },
              { type: 'ENABLE_EXIT', roomId: 'room1', exit: 'north' },
            ],
          },
          {
            name: 'wall_touched',
            actions: [
              { type: 'SET_FLAG', flag: 'secretFound', value: true },
              { type: 'SHOW_MESSAGE', text: 'You discover a secret!' },
            ],
          },
        ],
      },
      gameJSON: {
        events: [
          {
            name: 'game_over',
            actions: [
              { type: 'END_GAME', ending: 'victory', message: 'You win!' },
            ],
          },
          {
            name: 'alarm_triggered',
            condition: 'alarmActive',
            actions: [
              { type: 'PLAY_SOUND', soundId: 'alarm' },
              { type: 'SHOW_MESSAGE', text: 'ALARM! ALARM!' },
            ],
          },
        ],
        globalEvents: [
          {
            trigger: { verb: 'use', object: 'key', indirectObject: 'door' },
            condition: 'doorLocked',
            actions: [
              { type: 'SET_FLAG', flag: 'doorLocked', value: false },
              { type: 'SHOW_MESSAGE', text: 'The door unlocks.' },
            ],
          },
        ],
      },
      rooms: {
        room1: {
          exits: {
            north: { enabled: false, roomId: 'room2' },
          },
        },
      },
      flags: new Map([
        ['leverReady', true],
        ['alarmActive', false],
        ['doorLocked', true],
      ]),
      inventory: ['key', 'torch'],
      score: 0,
      moves: 0,
      getFlag: jest.fn((flag) => mockGameState.flags.get(flag)),
      setFlag: jest.fn((flag, value) => mockGameState.flags.set(flag, value)),
      getCurrentRoom: jest.fn(() => mockGameState.currentRoom),
      getObject: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      changeRoom: jest.fn(),
      updateScore: jest.fn(),
    };

    // Mock AIManager
    mockAIManager = {
      processCommand: jest.fn().mockResolvedValue({
        message: 'I understand your command.',
      }),
    };

    // Mock window.dispatchEvent
    window.dispatchEvent = jest.fn();

    eventManager = new EventManager(mockGameState, mockAIManager);
  });

  describe('triggerEvent', () => {
    it('should trigger named events and execute their actions', async () => {
      const result = await eventManager.triggerEvent('lever_pulled');

      expect(result).toBe(true);
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game-message',
          detail: { message: 'The door opens!' },
        })
      );
      expect(mockGameState.rooms.room1.exits.north.enabled).toBe(true);
    });

    it('should check conditions before triggering events', async () => {
      const result = await eventManager.triggerEvent('alarm_triggered');

      expect(result).toBe(false); // alarmActive is false
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });

    it('should trigger events without conditions', async () => {
      const result = await eventManager.triggerEvent('wall_touched');

      expect(result).toBe(true);
      expect(mockGameState.setFlag).toHaveBeenCalledWith('secretFound', true);
    });

    it('should search global events', async () => {
      const result = await eventManager.triggerEvent('game_over');

      expect(result).toBe(true);
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game-ended',
          detail: {
            ending: 'victory',
            score: 0,
            moves: 0,
          },
        })
      );
    });

    it('should execute custom handlers if registered', async () => {
      const customHandler = jest.fn();
      eventManager.registerHandler('custom_event', customHandler);

      const result = await eventManager.triggerEvent('custom_event', {
        data: 'test',
      });

      expect(result).toBe(true);
      expect(customHandler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should return false if no matching events found', async () => {
      const result = await eventManager.triggerEvent('nonexistent_event');

      expect(result).toBe(false);
    });

    it('should trigger multiple events with same name', async () => {
      mockGameState.currentRoom.events.push({
        name: 'lever_pulled',
        actions: [{ type: 'UPDATE_SCORE', points: 10 }],
      });

      const result = await eventManager.triggerEvent('lever_pulled');

      expect(result).toBe(true);
      expect(window.dispatchEvent).toHaveBeenCalled();
      expect(mockGameState.updateScore).toHaveBeenCalledWith(10);
    });
  });

  describe('processScheduledEvents', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process events when their time arrives', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Schedule events
      eventManager.scheduledEvents = [
        {
          time: now - 100, // Past
          action: { type: 'SHOW_MESSAGE', text: 'Event 1' },
        },
        {
          time: now + 1000, // Future
          action: { type: 'SHOW_MESSAGE', text: 'Event 2' },
        },
        {
          time: now - 50, // Past
          action: { type: 'UPDATE_SCORE', points: 5 },
        },
      ];

      eventManager.processScheduledEvents(100);

      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
      expect(mockGameState.updateScore).toHaveBeenCalledWith(5);
      expect(eventManager.scheduledEvents).toHaveLength(1);
      expect(eventManager.scheduledEvents[0].time).toBe(now + 1000);
    });

    it('should handle scheduled events with event objects', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      eventManager.scheduledEvents = [
        {
          time: now - 10,
          event: {
            actions: [
              { type: 'SET_FLAG', flag: 'timedEvent', value: true },
              { type: 'SHOW_MESSAGE', text: 'Timed event fired!' },
            ],
          },
        },
      ];

      eventManager.processScheduledEvents(100);

      expect(mockGameState.setFlag).toHaveBeenCalledWith('timedEvent', true);
      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    it('should handle scheduled callbacks', () => {
      const now = Date.now();
      jest.setSystemTime(now);
      const callback = jest.fn();

      eventManager.scheduledEvents = [
        {
          time: now - 1,
          callback: callback,
        },
      ];

      eventManager.processScheduledEvents(100);

      expect(callback).toHaveBeenCalled();
      expect(eventManager.scheduledEvents).toHaveLength(0);
    });

    it('should not process future events', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      eventManager.scheduledEvents = [
        {
          time: now + 1000,
          action: { type: 'SHOW_MESSAGE', text: 'Future event' },
        },
      ];

      eventManager.processScheduledEvents(100);

      expect(window.dispatchEvent).not.toHaveBeenCalled();
      expect(eventManager.scheduledEvents).toHaveLength(1);
    });

    it('should handle empty scheduled events', () => {
      eventManager.scheduledEvents = [];

      // Should not throw
      expect(() => eventManager.processScheduledEvents(100)).not.toThrow();
    });
  });

  describe('executeScriptedEvent', () => {
    it('should execute all actions in an event', async () => {
      const event = {
        actions: [
          { type: 'SET_FLAG', flag: 'testFlag', value: true },
          { type: 'GIVE_ITEM', itemId: 'sword', message: 'You found a sword!' },
          { type: 'UPDATE_SCORE', points: 20, message: 'Quest complete!' },
          { type: 'PLAY_SOUND', soundId: 'victory' },
        ],
      };

      const result = await eventManager.executeScriptedEvent(event);

      expect(mockGameState.setFlag).toHaveBeenCalledWith('testFlag', true);
      expect(mockGameState.addItem).toHaveBeenCalledWith('sword');
      expect(mockGameState.updateScore).toHaveBeenCalledWith(20);
      expect(window.dispatchEvent).toHaveBeenCalledTimes(2); // Two messages
      expect(result.preventDefault).toBe(false);
    });

    it('should handle preventDefault actions', async () => {
      const event = {
        actions: [
          {
            type: 'SHOW_MESSAGE',
            text: 'Not yet!',
            preventDefault: true,
            message: "You can't do that yet.",
            audio: 'deny',
          },
        ],
      };

      const result = await eventManager.executeScriptedEvent(event);

      expect(result.preventDefault).toBe(true);
      expect(result.response.success).toBe(false);
      expect(result.response.text).toBe("You can't do that yet.");
      expect(result.response.audio).toBe('deny');
    });

    it('should return null for invalid events', async () => {
      const result = await eventManager.executeScriptedEvent(null);
      expect(result).toBeNull();

      const result2 = await eventManager.executeScriptedEvent({});
      expect(result2).toBeNull();
    });
  });

  describe('scheduleEvent', () => {
    it('should schedule events in time order', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      eventManager.scheduleEvent(500, {
        type: 'SHOW_MESSAGE',
        text: 'Event 1',
      });
      eventManager.scheduleEvent(100, {
        type: 'SHOW_MESSAGE',
        text: 'Event 2',
      });
      eventManager.scheduleEvent(300, {
        type: 'SHOW_MESSAGE',
        text: 'Event 3',
      });

      expect(eventManager.scheduledEvents).toHaveLength(3);
      expect(eventManager.scheduledEvents[0].time).toBe(now + 100);
      expect(eventManager.scheduledEvents[1].time).toBe(now + 300);
      expect(eventManager.scheduledEvents[2].time).toBe(now + 500);

      Date.now.mockRestore();
    });
  });

  describe('findEventsByTrigger', () => {
    it('should find room events by trigger type', () => {
      mockGameState.currentRoom.events.push({
        trigger: 'room_entry',
        context: { roomId: 'room1' },
        actions: [{ type: 'SHOW_MESSAGE', text: 'Welcome!' }],
      });

      const events = eventManager.findEventsByTrigger('room_entry', {
        roomId: 'room1',
      });

      expect(events).toHaveLength(1);
      expect(events[0].actions[0].text).toBe('Welcome!');
    });

    it('should match trigger context', () => {
      mockGameState.gameJSON.events.push({
        trigger: 'item_used',
        context: { itemId: 'key', targetId: 'door' },
        actions: [{ type: 'SHOW_MESSAGE', text: 'Key used on door' }],
      });

      const events = eventManager.findEventsByTrigger('item_used', {
        itemId: 'key',
        targetId: 'door',
      });

      expect(events).toHaveLength(1);

      const noMatch = eventManager.findEventsByTrigger('item_used', {
        itemId: 'sword',
        targetId: 'door',
      });

      expect(noMatch).toHaveLength(0);
    });
  });

  describe('checkCondition', () => {
    it('should evaluate simple flag conditions', () => {
      expect(eventManager.checkCondition('leverReady')).toBe(true);
      expect(eventManager.checkCondition('alarmActive')).toBe(false);
      expect(eventManager.checkCondition('doorLocked')).toBe(true);
    });

    it('should evaluate complex conditions with operators', () => {
      expect(eventManager.checkCondition('leverReady && doorLocked')).toBe(
        true
      );
      expect(eventManager.checkCondition('leverReady && !alarmActive')).toBe(
        true
      );
      expect(eventManager.checkCondition('alarmActive || doorLocked')).toBe(
        true
      );
      expect(eventManager.checkCondition('!leverReady')).toBe(false);
    });

    it('should handle empty conditions as true', () => {
      expect(eventManager.checkCondition('')).toBe(true);
      expect(eventManager.checkCondition(null)).toBe(true);
      expect(eventManager.checkCondition(undefined)).toBe(true);
    });

    it('should handle unknown flags as false', () => {
      expect(eventManager.checkCondition('unknownFlag')).toBe(false);
    });
  });

  describe('custom action handlers', () => {
    it('should execute registered custom action types', () => {
      const customHandler = jest.fn();
      eventManager.registerHandler('CUSTOM_ACTION', customHandler);

      eventManager.executeAction({
        type: 'CUSTOM_ACTION',
        data: 'test data',
      });

      expect(customHandler).toHaveBeenCalledWith({
        type: 'CUSTOM_ACTION',
        data: 'test data',
      });
    });

    it('should warn about unknown action types', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      eventManager.executeAction({
        type: 'UNKNOWN_ACTION',
      });

      expect(consoleWarn).toHaveBeenCalledWith(
        'Unknown action type: UNKNOWN_ACTION'
      );
      consoleWarn.mockRestore();
    });
  });

  describe('executeCommand integration', () => {
    it('should find and execute scripted responses', async () => {
      const command = {
        verb: 'use',
        directObject: 'key',
        indirectObject: 'door',
        preposition: 'on',
      };

      await eventManager.executeCommand(command);

      expect(mockGameState.setFlag).toHaveBeenCalledWith('doorLocked', false);
      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    it('should fall back to AI for unscripted commands', async () => {
      const command = {
        verb: 'dance',
        directObject: null,
      };

      await eventManager.executeCommand(command);

      expect(mockAIManager.processCommand).toHaveBeenCalledWith(
        command,
        expect.objectContaining({
          currentRoom: mockGameState.currentRoom,
          inventory: mockGameState.inventory,
          flags: mockGameState.flags,
        })
      );
    });
  });
});
