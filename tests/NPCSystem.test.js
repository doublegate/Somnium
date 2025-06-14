import { NPCSystem } from '../js/NPCSystem.js';

describe('NPCSystem', () => {
  let npcSystem;
  let mockGameState;
  let mockMovementSystem;
  let mockEventManager;

  beforeEach(() => {
    // Mock GameState
    mockGameState = {
      currentRoomId: 'room1',
      inventory: ['item1', 'item2'],
      hasItem: jest.fn().mockReturnValue(true),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      getItem: jest.fn((id) => ({ id, name: `Item ${id}`, value: 10 })),
      getRoom: jest.fn((id) => ({ id, npcs: [] })),
      setFlag: jest.fn(),
    };

    // Mock MovementSystem
    mockMovementSystem = {
      setNPCMovement: jest.fn(),
    };

    // Mock EventManager
    mockEventManager = {
      checkCondition: jest.fn().mockReturnValue(true),
      triggerEvent: jest.fn(),
    };

    npcSystem = new NPCSystem(
      mockGameState,
      mockMovementSystem,
      mockEventManager
    );
  });

  describe('initialization', () => {
    it('should initialize NPCs from game data', () => {
      const gameData = {
        npcs: [
          {
            id: 'merchant',
            name: 'Bob the Merchant',
            startingRoom: 'market',
            inventory: ['sword', 'potion'],
            initialRelationship: 20,
            movementPattern: { type: 'stationary' },
          },
          {
            id: 'guard',
            name: 'Castle Guard',
            startingRoom: 'gate',
            health: 150,
            mood: 'wary',
          },
        ],
      };

      npcSystem.initialize(gameData);

      expect(npcSystem.npcs.size).toBe(2);
      expect(npcSystem.npcStates.size).toBe(2);
      expect(npcSystem.relationships.get('merchant')).toBe(20);
      expect(mockMovementSystem.setNPCMovement).toHaveBeenCalledWith(
        'merchant',
        {
          type: 'stationary',
        }
      );
    });
  });

  describe('conversation system', () => {
    beforeEach(() => {
      const gameData = {
        npcs: [
          {
            id: 'wizard',
            name: 'Gandalf',
            startingRoom: 'room1',
            dialogues: [
              {
                greeting: 'Greetings, traveler!',
                root: 'intro',
                nodes: {
                  intro: {
                    text: 'What brings you here?',
                    options: [
                      {
                        id: 'quest',
                        text: 'I seek the ancient artifact.',
                        response: 'Ah, the artifact! A dangerous quest indeed.',
                        nextNode: 'artifact',
                      },
                      {
                        id: 'leave',
                        text: 'Just passing through.',
                        response: 'Safe travels then.',
                        endsConversation: true,
                      },
                    ],
                  },
                  artifact: {
                    text: 'The artifact lies beyond the dark forest.',
                    options: [
                      {
                        id: 'thanks',
                        text: 'Thank you for the information.',
                        response: 'Be careful out there.',
                        endsConversation: true,
                        effects: [
                          {
                            type: 'SET_FLAG',
                            flag: 'knowsArtifactLocation',
                            value: true,
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      };
      npcSystem.initialize(gameData);
    });

    it('should start conversation with NPC in room', () => {
      const result = npcSystem.startConversation('wizard');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Greetings, traveler!');
      expect(result.npcName).toBe('Gandalf');
      expect(result.options).toHaveLength(2);
    });

    it('should not start conversation with NPC in different room', () => {
      npcSystem.npcStates.get('wizard').currentRoom = 'room2';

      const result = npcSystem.startConversation('wizard');

      expect(result.success).toBe(false);
      expect(result.message).toBe("They're not here.");
    });

    it('should handle dialogue choices', () => {
      npcSystem.startConversation('wizard');

      const result = npcSystem.selectDialogueOption('wizard', 0); // "I seek the ancient artifact"

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Ah, the artifact! A dangerous quest indeed.'
      );
      expect(result.npcResponse).toBe(
        'The artifact lies beyond the dark forest.'
      );
      expect(result.conversationEnded).toBe(false);
    });

    it('should execute dialogue effects', () => {
      npcSystem.startConversation('wizard');
      npcSystem.selectDialogueOption('wizard', 0); // Go to artifact node

      const result = npcSystem.selectDialogueOption('wizard', 0); // "Thank you"

      expect(result.conversationEnded).toBe(true);
      expect(mockGameState.setFlag).toHaveBeenCalledWith(
        'knowsArtifactLocation',
        true
      );
    });

    it('should handle hostile NPCs', () => {
      npcSystem.relationships.set('wizard', -60);

      const result = npcSystem.startConversation('wizard');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Gandalf refuses to speak with you.');
    });

    it('should track dialogue history', () => {
      npcSystem.startConversation('wizard');
      npcSystem.selectDialogueOption('wizard', 0);

      const history = npcSystem.dialogueHistory.get('wizard');
      expect(history).toContain('quest');
    });
  });

  describe('relationship system', () => {
    beforeEach(() => {
      const gameData = {
        npcs: [{ id: 'villager', name: 'John', startingRoom: 'room1' }],
      };
      npcSystem.initialize(gameData);
    });

    it('should modify relationships', () => {
      npcSystem.modifyRelationship('villager', 20);

      expect(npcSystem.relationships.get('villager')).toBe(20);
    });

    it('should clamp relationships to valid range', () => {
      npcSystem.modifyRelationship('villager', 200);
      expect(npcSystem.relationships.get('villager')).toBe(100);

      npcSystem.modifyRelationship('villager', -300);
      expect(npcSystem.relationships.get('villager')).toBe(-100);
    });

    it('should update NPC mood based on relationship', () => {
      npcSystem.modifyRelationship('villager', 60);
      expect(npcSystem.npcStates.get('villager').mood).toBe('friendly');

      npcSystem.modifyRelationship('villager', -100);
      expect(npcSystem.npcStates.get('villager').mood).toBe('wary');

      npcSystem.modifyRelationship('villager', -50);
      expect(npcSystem.npcStates.get('villager').mood).toBe('hostile');
    });

    it('should trigger relationship change events', () => {
      npcSystem.modifyRelationship('villager', 25);

      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith(
        'relationshipChanged',
        {
          npcId: 'villager',
          oldValue: 0,
          newValue: 25,
        }
      );
    });
  });

  describe('trading system', () => {
    beforeEach(() => {
      const gameData = {
        npcs: [
          {
            id: 'merchant',
            name: 'Trader Joe',
            startingRoom: 'room1',
            inventory: ['sword', 'shield', 'potion'],
            trades: true,
            tradeRules: {
              requires: ['gold'],
              requiresEqualValue: true,
            },
          },
        ],
      };
      npcSystem.initialize(gameData);
    });

    it('should start trading session', () => {
      const result = npcSystem.startTrading('merchant');

      expect(result.success).toBe(true);
      expect(result.npcInventory).toEqual(['sword', 'shield', 'potion']);
      expect(result.playerInventory).toEqual(['item1', 'item2']);
      expect(result.npcName).toBe('Trader Joe');
    });

    it('should not trade with untrusted NPCs', () => {
      npcSystem.relationships.set('merchant', -30);

      const result = npcSystem.startTrading('merchant');

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Trader Joe doesn't trust you enough to trade."
      );
    });

    it('should execute valid trades', () => {
      mockGameState.getItem.mockImplementation((id) => ({
        id,
        name: id,
        value: id === 'gold' ? 50 : 10,
      }));
      mockGameState.hasItem.mockImplementation((id) => id === 'gold');

      npcSystem.startTrading('merchant');

      const result = npcSystem.executeTrade('merchant', ['gold'], ['sword']);

      expect(result.success).toBe(true);
      expect(mockGameState.removeItem).toHaveBeenCalledWith('gold');
      expect(mockGameState.addItem).toHaveBeenCalledWith('sword');
    });

    it('should validate trade requirements', () => {
      mockGameState.hasItem.mockImplementation((id) => id === 'item1');
      mockGameState.getItem.mockImplementation((id) => ({
        id,
        name: id,
        value: 50, // Equal value so it passes value check
      }));

      npcSystem.startTrading('merchant');

      const result = npcSystem.executeTrade('merchant', ['item1'], ['sword']);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Trader Joe wants gold for that.');
    });

    it('should check trade value balance', () => {
      mockGameState.hasItem.mockImplementation((id) => id === 'item1');
      mockGameState.getItem.mockImplementation((id) => ({
        id,
        name: id,
        value: id === 'item1' ? 5 : 50,
      }));

      npcSystem.startTrading('merchant');

      const result = npcSystem.executeTrade('merchant', ['item1'], ['sword']);

      expect(result.success).toBe(false);
      expect(result.message).toBe("That's not a fair trade.");
    });

    it('should record trade history', () => {
      mockGameState.hasItem.mockImplementation((id) => id === 'gold');

      npcSystem.startTrading('merchant');
      npcSystem.executeTrade('merchant', ['gold'], ['sword']);

      expect(npcSystem.tradeHistory).toHaveLength(1);
      expect(npcSystem.tradeHistory[0]).toMatchObject({
        npcId: 'merchant',
        playerGave: ['gold'],
        playerReceived: ['sword'],
      });
    });
  });

  describe('NPC movement', () => {
    beforeEach(() => {
      const gameData = {
        npcs: [
          {
            id: 'wanderer',
            name: 'Wandering Minstrel',
            startingRoom: 'room1',
          },
        ],
      };
      npcSystem.initialize(gameData);
    });

    it('should move NPC to different room', () => {
      mockGameState.getRoom.mockImplementation((id) => ({
        id,
        npcs: id === 'room1' ? ['wanderer'] : [],
      }));

      npcSystem.moveNPC('wanderer', 'room2');

      const state = npcSystem.npcStates.get('wanderer');
      expect(state.currentRoom).toBe('room2');
      expect(mockEventManager.triggerEvent).toHaveBeenCalledWith('npcMoved', {
        npcId: 'wanderer',
        from: 'room1',
        to: 'room2',
      });
    });

    it('should check if NPC is present', () => {
      expect(npcSystem.isNPCPresent('wanderer')).toBe(true);

      npcSystem.npcStates.get('wanderer').currentRoom = 'room2';
      expect(npcSystem.isNPCPresent('wanderer')).toBe(false);
    });
  });

  describe('NPC reactions', () => {
    beforeEach(() => {
      const gameData = {
        npcs: [
          {
            id: 'reactive',
            name: 'Reactive NPC',
            startingRoom: 'room1',
            reactions: [
              {
                trigger: 'insult',
                message: 'How dare you!',
                emotion: 'angry',
                effects: [{ type: 'CHANGE_RELATIONSHIP', amount: -20 }],
              },
              {
                trigger: 'gift',
                message: 'Thank you so much!',
                emotion: 'happy',
                condition: { type: 'hasItem', itemId: 'flower' },
                effects: [{ type: 'CHANGE_RELATIONSHIP', amount: 15 }],
              },
            ],
          },
        ],
      };
      npcSystem.initialize(gameData);
    });

    it('should handle NPC reactions', () => {
      const reaction = npcSystem.getNPCReaction('reactive', { type: 'insult' });

      expect(reaction).toEqual({
        message: 'How dare you!',
        emotion: 'angry',
      });
      expect(npcSystem.relationships.get('reactive')).toBe(-20);
    });

    it('should check reaction conditions', () => {
      mockEventManager.checkCondition.mockReturnValue(false);

      const reaction = npcSystem.getNPCReaction('reactive', { type: 'gift' });

      expect(reaction).toBeNull();
    });
  });

  describe('NPC schedules', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01 10:00:00'));

      const gameData = {
        npcs: [
          {
            id: 'scheduled',
            name: 'Scheduled NPC',
            startingRoom: 'home',
            schedule: [
              { startHour: 8, endHour: 12, room: 'work' },
              { startHour: 12, endHour: 13, room: 'tavern' },
              { startHour: 13, endHour: 18, room: 'work' },
              { startHour: 18, endHour: 24, room: 'home' },
            ],
          },
        ],
      };
      npcSystem.initialize(gameData);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should update NPC location based on schedule', () => {
      npcSystem.update(0);

      expect(npcSystem.npcStates.get('scheduled').currentRoom).toBe('work');
    });

    it('should move NPC at scheduled times', () => {
      // Move to noon
      jest.setSystemTime(new Date('2024-01-01 12:00:00'));
      npcSystem.update(0);

      expect(npcSystem.npcStates.get('scheduled').currentRoom).toBe('tavern');

      // Move to evening
      jest.setSystemTime(new Date('2024-01-01 18:00:00'));
      npcSystem.update(0);

      expect(npcSystem.npcStates.get('scheduled').currentRoom).toBe('home');
    });
  });
});
