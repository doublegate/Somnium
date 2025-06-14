import { EventManager } from '../js/EventManager.js';

describe('EventManager', () => {
  let eventManager;
  let mockGameState;

  beforeEach(() => {
    // Mock GameState
    mockGameState = {
      currentRoomId: 'room1',
      flags: new Map([
        ['hasKey', true],
        ['doorOpen', false]
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
        objects: ['door', 'chest']
      })
    };

    eventManager = new EventManager(mockGameState);
  });

  describe('initialization', () => {
    it('should initialize with game data', () => {
      const gameData = {
        events: [
          {
            id: 'doorOpenEvent',
            triggers: [{ type: 'USE_ITEM', item: 'key', target: 'door' }],
            conditions: [{ type: 'hasItem', item: 'key' }],
            actions: [
              { type: 'SET_FLAG', flag: 'doorOpen', value: true },
              { type: 'SHOW_MESSAGE', message: 'The door creaks open.' }
            ]
          }
        ],
        dynamicEvents: [
          {
            id: 'randomEncounter',
            probability: 0.1,
            conditions: [{ type: 'inRoom', room: 'forest' }],
            actions: [{ type: 'SHOW_MESSAGE', message: 'You hear rustling in the bushes.' }]
          }
        ]
      };

      eventManager.initialize(gameData);

      expect(eventManager.events.size).toBe(1);
      expect(eventManager.dynamicEvents.size).toBe(1);
    });
  });

  describe('triggerEvent', () => {
    beforeEach(() => {
      eventManager.events.set('testEvent', {
        id: 'testEvent',
        actions: [
          { type: 'SHOW_MESSAGE', message: 'Test message' },
          { type: 'GIVE_ITEM', item: 'coin' },
          { type: 'SET_FLAG', flag: 'eventTriggered', value: true }
        ]
      });
    });

    it('should trigger events by ID', () => {
      const result = eventManager.triggerEvent('testEvent');

      expect(result.success).toBe(true);
      expect(result.messages).toContain('Test message');
      expect(mockGameState.addItem).toHaveBeenCalledWith('coin');
      expect(mockGameState.setFlag).toHaveBeenCalledWith('eventTriggered', true);
    });

    it('should handle non-existent events', () => {
      const result = eventManager.triggerEvent('nonExistent');

      expect(result.success).toBe(false);
    });

    it('should check conditions before triggering', () => {
      eventManager.events.set('conditionalEvent', {
        id: 'conditionalEvent',
        conditions: [{ type: 'hasItem', item: 'goldKey' }],
        actions: [{ type: 'SHOW_MESSAGE', message: 'You have the key!' }]
      });

      mockGameState.hasItem.mockReturnValue(false);

      const result = eventManager.triggerEvent('conditionalEvent');

      expect(result.success).toBe(false);
      expect(result.messages).toHaveLength(0);
    });

    it('should handle one-time events', () => {
      eventManager.events.set('onceEvent', {
        id: 'onceEvent',
        oneTime: true,
        actions: [{ type: 'SHOW_MESSAGE', message: 'This only happens once' }]
      });

      const result1 = eventManager.triggerEvent('onceEvent');
      expect(result1.success).toBe(true);

      const result2 = eventManager.triggerEvent('onceEvent');
      expect(result2.success).toBe(false);
    });
  });

  describe('checkCondition', () => {
    it('should check hasItem condition', () => {
      expect(eventManager.checkCondition({ type: 'hasItem', item: 'torch' })).toBe(true);
      expect(eventManager.checkCondition({ type: 'hasItem', item: 'sword' })).toBe(false);
    });

    it('should check hasFlag condition', () => {
      expect(eventManager.checkCondition({ type: 'hasFlag', flag: 'hasKey' })).toBe(true);
      expect(eventManager.checkCondition({ type: 'hasFlag', flag: 'doorOpen' })).toBe(false);
    });

    it('should check inRoom condition', () => {
      expect(eventManager.checkCondition({ type: 'inRoom', room: 'room1' })).toBe(true);
      expect(eventManager.checkCondition({ type: 'inRoom', room: 'room2' })).toBe(false);
    });

    it('should check score condition', () => {
      expect(eventManager.checkCondition({ 
        type: 'scoreGreaterThan', 
        value: 40 
      })).toBe(true);
      
      expect(eventManager.checkCondition({ 
        type: 'scoreGreaterThan', 
        value: 60 
      })).toBe(false);
    });

    it('should check AND conditions', () => {
      const condition = {
        type: 'AND',
        conditions: [
          { type: 'hasItem', item: 'torch' },
          { type: 'hasFlag', flag: 'hasKey' }
        ]
      };

      expect(eventManager.checkCondition(condition)).toBe(true);
    });

    it('should check OR conditions', () => {
      const condition = {
        type: 'OR',
        conditions: [
          { type: 'hasItem', item: 'sword' },
          { type: 'hasFlag', flag: 'hasKey' }
        ]
      };

      expect(eventManager.checkCondition(condition)).toBe(true);
    });

    it('should check NOT conditions', () => {
      const condition = {
        type: 'NOT',
        condition: { type: 'hasFlag', flag: 'doorOpen' }
      };

      expect(eventManager.checkCondition(condition)).toBe(true);
    });

    it('should handle custom conditions', () => {
      eventManager.customConditions.set('isNight', () => {
        const hour = new Date().getHours();
        return hour < 6 || hour > 18;
      });

      const result = eventManager.checkCondition({ type: 'CUSTOM', name: 'isNight' });
      expect(typeof result).toBe('boolean');
    });
  });

  describe('executeAction', () => {
    it('should execute GIVE_ITEM action', () => {
      const messages = [];
      eventManager.executeAction({ type: 'GIVE_ITEM', item: 'sword' }, messages);

      expect(mockGameState.addItem).toHaveBeenCalledWith('sword');
    });

    it('should execute REMOVE_ITEM action', () => {
      const messages = [];
      eventManager.executeAction({ type: 'REMOVE_ITEM', item: 'torch' }, messages);

      expect(mockGameState.removeItem).toHaveBeenCalledWith('torch');
    });

    it('should execute SET_FLAG action', () => {
      const messages = [];
      eventManager.executeAction({ 
        type: 'SET_FLAG', 
        flag: 'questComplete', 
        value: true 
      }, messages);

      expect(mockGameState.setFlag).toHaveBeenCalledWith('questComplete', true);
    });

    it('should execute SHOW_MESSAGE action', () => {
      const messages = [];
      eventManager.executeAction({ 
        type: 'SHOW_MESSAGE', 
        message: 'Hello world' 
      }, messages);

      expect(messages).toContain('Hello world');
    });

    it('should execute UPDATE_SCORE action', () => {
      const messages = [];
      eventManager.executeAction({ type: 'UPDATE_SCORE', amount: 10 }, messages);

      expect(mockGameState.updateScore).toHaveBeenCalledWith(10);
    });

    it('should execute PLAY_SOUND action', () => {
      eventManager.soundManager = { playSound: jest.fn() };
      
      const messages = [];
      eventManager.executeAction({ 
        type: 'PLAY_SOUND', 
        sound: 'victory' 
      }, messages);

      expect(eventManager.soundManager.playSound).toHaveBeenCalledWith('victory');
    });

    it('should execute TRIGGER_EVENT action', () => {
      const triggerSpy = jest.spyOn(eventManager, 'triggerEvent').mockReturnValue({
        success: true,
        messages: ['Nested event']
      });

      const messages = [];
      eventManager.executeAction({ 
        type: 'TRIGGER_EVENT', 
        eventId: 'nestedEvent' 
      }, messages);

      expect(triggerSpy).toHaveBeenCalledWith('nestedEvent');
      expect(messages).toContain('Nested event');
    });

    it('should execute CHANGE_ROOM action', () => {
      mockGameState.setCurrentRoom = jest.fn();

      const messages = [];
      eventManager.executeAction({ 
        type: 'CHANGE_ROOM', 
        room: 'room2' 
      }, messages);

      expect(mockGameState.setCurrentRoom).toHaveBeenCalledWith('room2');
    });

    it('should execute ENABLE_EXIT action', () => {
      mockGameState.setExitState = jest.fn();

      const messages = [];
      eventManager.executeAction({ 
        type: 'ENABLE_EXIT', 
        room: 'room1',
        direction: 'north',
        state: 'open'
      }, messages);

      expect(mockGameState.setExitState).toHaveBeenCalledWith('room1', 'north', 'open');
    });

    it('should execute custom actions', () => {
      const customAction = jest.fn();
      eventManager.customActions.set('specialAction', customAction);

      const messages = [];
      eventManager.executeAction({ 
        type: 'CUSTOM', 
        name: 'specialAction',
        params: { test: true }
      }, messages);

      expect(customAction).toHaveBeenCalledWith({ test: true }, messages);
    });
  });

  describe('scheduleEvent', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule timed events', () => {
      eventManager.scheduleEvent('testEvent', 5000);

      expect(eventManager.scheduledEvents.length).toBe(1);
      expect(eventManager.scheduledEvents[0].delay).toBe(5000);
    });

    it('should execute scheduled events after delay', () => {
      const triggerSpy = jest.spyOn(eventManager, 'triggerEvent');
      
      eventManager.scheduleEvent('delayedEvent', 1000);
      eventManager.updateScheduledEvents(1500);

      expect(triggerSpy).toHaveBeenCalledWith('delayedEvent');
      expect(eventManager.scheduledEvents.length).toBe(0);
    });

    it('should handle repeating events', () => {
      const triggerSpy = jest.spyOn(eventManager, 'triggerEvent');
      
      eventManager.scheduleEvent('repeatEvent', 1000, true);
      
      eventManager.updateScheduledEvents(1000);
      expect(triggerSpy).toHaveBeenCalledTimes(1);
      expect(eventManager.scheduledEvents.length).toBe(1);
      
      eventManager.updateScheduledEvents(1000);
      expect(triggerSpy).toHaveBeenCalledTimes(2);
    });

    it('should cancel scheduled events', () => {
      const eventId = eventManager.scheduleEvent('cancelMe', 5000);
      expect(eventManager.scheduledEvents.length).toBe(1);

      eventManager.cancelScheduledEvent(eventId);
      expect(eventManager.scheduledEvents.length).toBe(0);
    });
  });

  describe('checkEventTriggers', () => {
    beforeEach(() => {
      eventManager.events.set('useKeyEvent', {
        id: 'useKeyEvent',
        triggers: [{ 
          type: 'USE_ITEM', 
          item: 'key', 
          target: 'door' 
        }],
        actions: [{ 
          type: 'SHOW_MESSAGE', 
          message: 'You unlock the door' 
        }]
      });
    });

    it('should trigger events based on action', () => {
      const result = eventManager.checkEventTriggers({
        type: 'USE_ITEM',
        item: 'key',
        target: 'door'
      });

      expect(result.triggered).toBe(true);
      expect(result.messages).toContain('You unlock the door');
    });

    it('should not trigger events with non-matching action', () => {
      const result = eventManager.checkEventTriggers({
        type: 'USE_ITEM',
        item: 'torch',
        target: 'door'
      });

      expect(result.triggered).toBe(false);
    });

    it('should check multiple triggers', () => {
      eventManager.events.set('multiTriggerEvent', {
        id: 'multiTriggerEvent',
        triggers: [
          { type: 'ENTER_ROOM', room: 'cave' },
          { type: 'TALK_TO', npc: 'wizard' }
        ],
        actions: [{ type: 'SHOW_MESSAGE', message: 'Multi trigger!' }]
      });

      const result = eventManager.checkEventTriggers({
        type: 'TALK_TO',
        npc: 'wizard'
      });

      expect(result.triggered).toBe(true);
    });
  });

  describe('updateDynamicEvents', () => {
    it('should check and trigger dynamic events', () => {
      eventManager.dynamicEvents.set('randomEvent', {
        id: 'randomEvent',
        probability: 1.0, // Always trigger for testing
        conditions: [{ type: 'inRoom', room: 'room1' }],
        actions: [{ type: 'SHOW_MESSAGE', message: 'Random event!' }]
      });

      const result = eventManager.updateDynamicEvents();

      expect(result.messages).toContain('Random event!');
    });

    it('should respect probability', () => {
      eventManager.dynamicEvents.set('rareEvent', {
        id: 'rareEvent',
        probability: 0.0, // Never trigger
        conditions: [],
        actions: [{ type: 'SHOW_MESSAGE', message: 'This should not appear' }]
      });

      const result = eventManager.updateDynamicEvents();

      expect(result.messages).not.toContain('This should not appear');
    });

    it('should check cooldowns', () => {
      eventManager.dynamicEvents.set('cooldownEvent', {
        id: 'cooldownEvent',
        probability: 1.0,
        cooldown: 5000,
        conditions: [],
        actions: [{ type: 'SHOW_MESSAGE', message: 'Cooldown event' }]
      });

      const result1 = eventManager.updateDynamicEvents();
      expect(result1.messages).toContain('Cooldown event');

      const result2 = eventManager.updateDynamicEvents();
      expect(result2.messages).not.toContain('Cooldown event');
    });
  });

  describe('registerCustomCondition', () => {
    it('should register and use custom conditions', () => {
      const customCondition = jest.fn().mockReturnValue(true);
      eventManager.registerCustomCondition('isSpecialTime', customCondition);

      const result = eventManager.checkCondition({
        type: 'CUSTOM',
        name: 'isSpecialTime'
      });

      expect(customCondition).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('registerCustomAction', () => {
    it('should register and execute custom actions', () => {
      const customAction = jest.fn();
      eventManager.registerCustomAction('doSpecialThing', customAction);

      const messages = [];
      eventManager.executeAction({
        type: 'CUSTOM',
        name: 'doSpecialThing',
        params: { value: 42 }
      }, messages);

      expect(customAction).toHaveBeenCalledWith({ value: 42 }, messages);
    });
  });

  describe('getEventState', () => {
    it('should return event state', () => {
      eventManager.eventHistory.add('completedEvent');
      eventManager.scheduledEvents.push({
        eventId: 'pendingEvent',
        delay: 5000,
        elapsed: 2000
      });

      const state = eventManager.getEventState();

      expect(state.triggeredEvents).toContain('completedEvent');
      expect(state.scheduledEvents).toHaveLength(1);
      expect(state.eventFlags.get('hasKey')).toBe(true);
    });
  });

  describe('complex event scenarios', () => {
    it('should handle chain of events', () => {
      eventManager.events.set('chain1', {
        id: 'chain1',
        actions: [
          { type: 'SET_FLAG', flag: 'chain1Done', value: true },
          { type: 'TRIGGER_EVENT', eventId: 'chain2' }
        ]
      });

      eventManager.events.set('chain2', {
        id: 'chain2',
        conditions: [{ type: 'hasFlag', flag: 'chain1Done' }],
        actions: [
          { type: 'SHOW_MESSAGE', message: 'Chain complete!' }
        ]
      });

      const result = eventManager.triggerEvent('chain1');

      expect(result.messages).toContain('Chain complete!');
      expect(mockGameState.setFlag).toHaveBeenCalledWith('chain1Done', true);
    });

    it('should handle event with multiple action types', () => {
      eventManager.soundManager = { 
        playSound: jest.fn(),
        playMusic: jest.fn()
      };

      eventManager.events.set('complexEvent', {
        id: 'complexEvent',
        actions: [
          { type: 'SHOW_MESSAGE', message: 'Starting complex event' },
          { type: 'GIVE_ITEM', item: 'treasure' },
          { type: 'UPDATE_SCORE', amount: 100 },
          { type: 'PLAY_SOUND', sound: 'fanfare' },
          { type: 'SET_FLAG', flag: 'treasureFound', value: true }
        ]
      });

      const result = eventManager.triggerEvent('complexEvent');

      expect(result.messages).toContain('Starting complex event');
      expect(mockGameState.addItem).toHaveBeenCalledWith('treasure');
      expect(mockGameState.updateScore).toHaveBeenCalledWith(100);
      expect(eventManager.soundManager.playSound).toHaveBeenCalledWith('fanfare');
      expect(mockGameState.setFlag).toHaveBeenCalledWith('treasureFound', true);
    });
  });
});