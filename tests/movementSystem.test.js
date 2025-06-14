import { MovementSystem } from '../js/MovementSystem.js';
import { GameState } from '../js/GameState.js';
import { ViewManager } from '../js/ViewManager.js';
import { EventManager } from '../js/EventManager.js';

describe('MovementSystem', () => {
  let movementSystem;
  let gameState;
  let viewManager;
  let eventManager;

  beforeEach(() => {
    gameState = new GameState();
    viewManager = new ViewManager();
    eventManager = new EventManager(gameState);
    movementSystem = new MovementSystem(gameState, viewManager, eventManager);

    // Mock game rooms
    const mockRooms = {
      library: {
        id: 'library',
        name: 'Library',
        exits: { north: 'hallway', east: 'study' },
      },
      hallway: {
        id: 'hallway',
        name: 'Hallway',
        exits: { south: 'library', north: 'entrance', east: 'kitchen' },
      },
      study: {
        id: 'study',
        name: 'Study',
        exits: { west: 'library', north: 'secret' },
        exitStates: {
          north: {
            locked: false,
            condition: 'bookshelf_moved',
            blockedMessage: 'There is no exit north.',
          },
        },
      },
      entrance: {
        id: 'entrance',
        name: 'Entrance',
        exits: { south: 'hallway', north: 'outside' },
        exitStates: {
          north: {
            locked: true,
            keyId: 'silver_key',
            lockedMessage: 'The door is locked.',
          },
        },
      },
      kitchen: {
        id: 'kitchen',
        name: 'Kitchen',
        exits: { west: 'hallway' },
      },
      secret: {
        id: 'secret',
        name: 'Secret Room',
        exits: { south: 'study' },
        entryCondition: { type: 'flag', flag: 'worthy', value: true },
        entryBlockedMessage: 'You are not worthy to enter.',
      },
      outside: {
        id: 'outside',
        name: 'Outside',
        exits: {},
      },
    };

    // Mock methods
    gameState.getRoom = jest.fn((id) => mockRooms[id]);
    gameState.currentRoomId = 'library';
    gameState.setCurrentRoom = jest.fn();
    gameState.getExitState = jest.fn((roomId, direction) => {
      const room = mockRooms[roomId];
      return room?.exitStates?.[direction];
    });
    gameState.hasItem = jest.fn((id) => id === 'brass_key');
    gameState.getCurrentRoom = jest.fn(
      () => mockRooms[gameState.currentRoomId] || {}
    );

    viewManager.getView = jest.fn(() => ({
      x: 100,
      y: 100,
      setLoop: jest.fn(),
      moveTo: jest.fn(),
    }));

    eventManager.checkCondition = jest.fn(() => false);
    eventManager.triggerEvent = jest.fn();
  });

  describe('Movement Validation', () => {
    test('allows movement to valid exits', () => {
      const result = movementSystem.canMove('library', 'north');
      expect(result.canMove).toBe(true);
      expect(result.targetRoomId).toBe('hallway');
    });

    test('blocks movement to non-existent exits', () => {
      const result = movementSystem.canMove('library', 'south');
      expect(result.canMove).toBe(false);
      expect(result.reason).toContain("can't go that way");
    });

    test('blocks movement through locked exits', () => {
      const result = movementSystem.canMove('entrance', 'north');
      expect(result.canMove).toBe(false);
      expect(result.reason).toContain('locked');
      expect(result.needsKey).toBe('silver_key');
    });

    test('blocks movement when condition not met', () => {
      const result = movementSystem.canMove('study', 'north');
      expect(result.canMove).toBe(false);
      expect(result.reason).toContain('no exit north');
    });

    test('allows movement when condition is met', () => {
      eventManager.checkCondition.mockReturnValue(true);
      const result = movementSystem.canMove('study', 'north');
      expect(result.canMove).toBe(true);
      expect(result.targetRoomId).toBe('secret');
    });

    test('blocks entry to rooms with entry conditions', () => {
      eventManager.checkCondition.mockReturnValue(false);
      const result = movementSystem.canMove('study', 'north');

      // Even if we can exit study, we can't enter secret room
      eventManager.checkCondition
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      const result2 = movementSystem.canMove('study', 'north');
      expect(result2.canMove).toBe(false);
      expect(result2.reason).toContain('not worthy');
    });
  });

  describe('Player Movement', () => {
    test('moves player to adjacent room', async () => {
      movementSystem.animatePlayerToExit = jest.fn();
      movementSystem.positionPlayerAtEntrance = jest.fn();

      const result = await movementSystem.movePlayer('north');

      expect(result.success).toBe(true);
      expect(result.newRoom).toBe('hallway');
      expect(gameState.setCurrentRoom).toHaveBeenCalledWith('hallway');
      expect(eventManager.triggerEvent).toHaveBeenCalledWith(
        'exitRoom',
        expect.any(Object)
      );
      expect(eventManager.triggerEvent).toHaveBeenCalledWith(
        'enterRoom',
        expect.any(Object)
      );
    });

    test('handles blocked movement', async () => {
      const result = await movementSystem.movePlayer('south');

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(eventManager.triggerEvent).toHaveBeenCalledWith(
        'blockedExit',
        expect.objectContaining({
          room: 'library',
          direction: 'south',
        })
      );
    });
  });

  describe('Pathfinding', () => {
    test('finds direct path between adjacent rooms', () => {
      const path = movementSystem.findRoomPath('library', 'hallway');
      expect(path).toEqual(['library', 'hallway']);
    });

    test('finds multi-room path', () => {
      const path = movementSystem.findRoomPath('library', 'kitchen');
      expect(path).toEqual(['library', 'hallway', 'kitchen']);
    });

    test('returns null for impossible paths', () => {
      const path = movementSystem.findRoomPath('library', 'outside');
      expect(path).toBeNull();
    });

    test('handles same room', () => {
      const path = movementSystem.findRoomPath('library', 'library');
      expect(path).toEqual(['library']);
    });
  });

  describe('Auto-Navigation', () => {
    test('navigates through multiple rooms', async () => {
      movementSystem.movePlayer = jest
        .fn()
        .mockResolvedValueOnce({ success: true, newRoom: 'hallway' })
        .mockResolvedValueOnce({ success: true, newRoom: 'kitchen' });

      const result = await movementSystem.autoNavigate('kitchen');

      expect(result.success).toBe(true);
      expect(result.message).toContain('arrive at');
      expect(movementSystem.movePlayer).toHaveBeenCalledTimes(2);
    });

    test('stops navigation when blocked', async () => {
      movementSystem.movePlayer = jest
        .fn()
        .mockResolvedValueOnce({ success: true, newRoom: 'hallway' })
        .mockResolvedValueOnce({ success: false, message: 'Door is locked' });

      const result = await movementSystem.autoNavigate('entrance');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Blocked at');
      expect(result.stoppedAt).toBe('hallway');
    });

    test('handles unreachable destinations', async () => {
      const result = await movementSystem.autoNavigate('outside');

      expect(result.success).toBe(false);
      expect(result.message).toContain("can't get there");
    });
  });

  describe('In-Room Movement', () => {
    test('moves player to position', () => {
      const player = {
        x: 100,
        y: 100,
        setLoop: jest.fn(),
        moveTo: jest.fn(),
      };
      viewManager.getView.mockReturnValue(player);

      movementSystem.movePlayerTo(200, 150);

      expect(movementSystem.playerMoving).toBe(true);
      expect(movementSystem.playerTarget).toEqual({ x: 200, y: 150 });
      expect(player.setLoop).toHaveBeenCalledWith('walk_right');
    });

    test('updates player movement over time', () => {
      const player = {
        x: 100,
        y: 100,
        setLoop: jest.fn(),
        moveTo: jest.fn(),
      };
      viewManager.getView.mockReturnValue(player);

      movementSystem.playerTarget = { x: 110, y: 100 };
      movementSystem.playerMoving = true;

      // Simulate movement update
      movementSystem.updatePlayerMovement(16.67); // One frame

      expect(player.moveTo).toHaveBeenCalled();
    });

    test('stops at obstacles', () => {
      const player = {
        x: 100,
        y: 100,
        setLoop: jest.fn(),
        moveTo: jest.fn(),
      };
      viewManager.getView.mockReturnValue(player);

      movementSystem.canWalkTo = jest.fn().mockReturnValue(false);
      movementSystem.playerMoving = true;
      movementSystem.playerTarget = { x: 200, y: 100 };

      movementSystem.updatePlayerMovement(16.67);

      expect(movementSystem.playerMoving).toBe(false);
      expect(player.setLoop).toHaveBeenCalledWith('idle');
    });
  });

  describe('NPC Movement', () => {
    test('sets up NPC movement pattern', () => {
      const pattern = {
        steps: [
          { type: 'move', x: 100, y: 100 },
          { type: 'wait', duration: 1000 },
          { type: 'move', x: 200, y: 100 },
          { type: 'loop' },
        ],
      };

      movementSystem.setNPCMovement('guard', pattern);

      expect(movementSystem.npcMovements.has('guard')).toBe(true);
      expect(movementSystem.npcMovements.get('guard').pattern).toBe(pattern);
    });

    test('updates NPC movement', () => {
      const npc = {
        id: 'guard',
        x: 100,
        y: 100,
        setLoop: jest.fn(),
        moveTo: jest.fn(),
      };
      viewManager.getView.mockReturnValue(npc);

      movementSystem.npcMovements.set('guard', {
        pattern: {
          steps: [{ type: 'move', x: 150, y: 100 }],
        },
        currentIndex: 0,
        waitTime: 0,
        moving: false,
      });

      movementSystem.updateNPCMovements(16.67);

      expect(npc.setLoop).toHaveBeenCalled();
      expect(movementSystem.npcMovements.get('guard').moving).toBe(true);
    });

    test('handles NPC wait steps', () => {
      movementSystem.npcMovements.set('guard', {
        pattern: {
          steps: [{ type: 'wait', duration: 500 }],
        },
        currentIndex: 0,
        waitTime: 0,
        moving: false,
      });

      movementSystem.updateNPCMovements(100);

      expect(movementSystem.npcMovements.get('guard').waitTime).toBe(500);
    });
  });

  describe('Collision Detection', () => {
    test('allows movement within bounds', () => {
      expect(movementSystem.canWalkTo(160, 100)).toBe(true);
    });

    test('blocks movement outside bounds', () => {
      expect(movementSystem.canWalkTo(5, 100)).toBe(false);
      expect(movementSystem.canWalkTo(315, 100)).toBe(false);
      expect(movementSystem.canWalkTo(160, 35)).toBe(false);
      expect(movementSystem.canWalkTo(160, 195)).toBe(false);
    });

    test('checks collision map', () => {
      gameState.getCurrentRoom = jest.fn(() => ({
        collisionMap: [[0, 0, 1, 0]],
      }));

      expect(movementSystem.canWalkTo(25, 40)).toBe(false); // Grid position [2,0] = 1
      expect(movementSystem.canWalkTo(15, 40)).toBe(true); // Grid position [1,0] = 0
    });

    test('checks object collisions', () => {
      gameState.getCurrentRoom = jest.fn(() => ({
        objects: ['table'],
      }));
      gameState.getObject = jest.fn(() => ({
        blocking: true,
        bounds: { x: 100, y: 80, width: 50, height: 30 },
      }));

      expect(movementSystem.canWalkTo(125, 95)).toBe(false); // Inside object bounds
      expect(movementSystem.canWalkTo(80, 95)).toBe(true); // Outside object bounds
    });
  });

  describe('Direction Utilities', () => {
    test('calculates direction between points', () => {
      expect(movementSystem.getDirectionTo(100, 100, 200, 100)).toBe('east');
      expect(movementSystem.getDirectionTo(100, 100, 100, 50)).toBe('north');
      expect(movementSystem.getDirectionTo(100, 100, 50, 50)).toBe('northwest');
    });

    test('gets opposite directions', () => {
      expect(movementSystem.getOppositeDirection('north')).toBe('south');
      expect(movementSystem.getOppositeDirection('east')).toBe('west');
      expect(movementSystem.getOppositeDirection('northeast')).toBe(
        'southwest'
      );
      expect(movementSystem.getOppositeDirection('in')).toBe('out');
    });
  });
});
