/**
 * Tests for GameState module
 */

describe('GameState', () => {
  let GameState;
  let gameState;
  let mockGameData;
  
  beforeEach(() => {
    // Import GameState
    GameState = require('../js/GameState.js').GameState;
    
    // Create mock game data
    mockGameData = {
      startRoom: 'room1',
      rooms: {
        room1: {
          name: 'Test Room 1',
          description: 'A test room',
          graphics: { type: 'vector', data: [] },
          exits: {
            north: { roomId: 'room2', enabled: true }
          }
        },
        room2: {
          name: 'Test Room 2',
          description: 'Another test room',
          graphics: { type: 'vector', data: [] }
        }
      },
      items: {
        item1: {
          name: 'Test Item',
          description: 'A test item'
        }
      },
      puzzles: [
        {
          id: 'puzzle1',
          flags: {
            puzzle1Solved: false
          }
        }
      ]
    };
    
    gameState = new GameState();
  });
  
  describe('Initialization', () => {
    test('should extend EventTarget', () => {
      expect(gameState instanceof EventTarget).toBe(true);
    });
    
    test('should initialize with default values', () => {
      expect(gameState.currentRoomId).toBeNull();
      expect(gameState.inventory).toEqual([]);
      expect(gameState.flags).toEqual({});
      expect(gameState.score).toBe(0);
      expect(gameState.moves).toBe(0);
    });
  });
  
  describe('Resource Loading', () => {
    test('should load valid game data', () => {
      const eventSpy = jest.fn();
      gameState.addEventListener('resourcesLoaded', eventSpy);
      
      gameState.loadResources(mockGameData);
      
      expect(gameState.rooms).toBe(mockGameData.rooms);
      expect(gameState.items).toBe(mockGameData.items);
      expect(gameState.currentRoomId).toBe('room1');
      expect(gameState.flags.gameStarted).toBe(true);
      expect(gameState.flags.puzzle1Solved).toBe(false);
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'resourcesLoaded',
          detail: {
            rooms: 2,
            items: 1,
            puzzles: 1
          }
        })
      );
    });
    
    test('should throw error on invalid room data', () => {
      const invalidData = {
        rooms: {
          badRoom: {
            // Missing required fields
          }
        }
      };
      
      expect(() => gameState.loadResources(invalidData)).toThrow('Invalid game data');
    });
  });
  
  describe('Room Navigation', () => {
    beforeEach(() => {
      gameState.loadResources(mockGameData);
    });
    
    test('should get current room', () => {
      const room = gameState.getCurrentRoom();
      expect(room).toBe(mockGameData.rooms.room1);
    });
    
    test('should change rooms and dispatch event', () => {
      const eventSpy = jest.fn();
      gameState.addEventListener('roomChange', eventSpy);
      
      const result = gameState.changeRoom('room2');
      
      expect(result).toBe(true);
      expect(gameState.currentRoomId).toBe('room2');
      expect(gameState.moves).toBe(1);
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'roomChange',
          detail: {
            previousRoom: 'room1',
            currentRoom: 'room2',
            room: mockGameData.rooms.room2
          }
        })
      );
    });
    
    test('should not change to non-existent room', () => {
      const result = gameState.changeRoom('invalidRoom');
      expect(result).toBe(false);
      expect(gameState.currentRoomId).toBe('room1');
    });
    
    test('should check exit availability', () => {
      expect(gameState.canExit('north')).toBe(true);
      expect(gameState.canExit('south')).toBe(false);
    });
    
    test('should get exit room ID', () => {
      expect(gameState.getExitRoom('north')).toBe('room2');
      expect(gameState.getExitRoom('south')).toBeNull();
    });
  });
  
  describe('Inventory Management', () => {
    beforeEach(() => {
      gameState.loadResources(mockGameData);
    });
    
    test('should add item and dispatch event', () => {
      const eventSpy = jest.fn();
      gameState.addEventListener('inventoryChange', eventSpy);
      
      const result = gameState.addItem('item1');
      
      expect(result).toBe(true);
      expect(gameState.hasItem('item1')).toBe(true);
      expect(gameState.getInventory()).toEqual(['item1']);
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'inventoryChange',
          detail: {
            action: 'add',
            itemId: 'item1',
            item: mockGameData.items.item1,
            inventory: ['item1']
          }
        })
      );
    });
    
    test('should not add non-existent item', () => {
      const result = gameState.addItem('invalidItem');
      expect(result).toBe(false);
      expect(gameState.getInventory()).toEqual([]);
    });
    
    test('should not add duplicate item', () => {
      gameState.addItem('item1');
      const result = gameState.addItem('item1');
      expect(result).toBe(false);
      expect(gameState.getInventory()).toEqual(['item1']);
    });
    
    test('should remove item and dispatch event', () => {
      gameState.addItem('item1');
      
      const eventSpy = jest.fn();
      gameState.addEventListener('inventoryChange', eventSpy);
      
      const result = gameState.removeItem('item1');
      
      expect(result).toBe(true);
      expect(gameState.hasItem('item1')).toBe(false);
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'inventoryChange',
          detail: {
            action: 'remove',
            itemId: 'item1',
            item: mockGameData.items.item1,
            inventory: []
          }
        })
      );
    });
  });
  
  describe('Flag Management', () => {
    beforeEach(() => {
      gameState.loadResources(mockGameData);
    });
    
    test('should set flag and dispatch event', () => {
      const eventSpy = jest.fn();
      gameState.addEventListener('flagChange', eventSpy);
      
      gameState.setFlag('testFlag', true);
      
      expect(gameState.getFlag('testFlag')).toBe(true);
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'flagChange',
          detail: {
            flag: 'testFlag',
            previousValue: undefined,
            value: true,
            flags: expect.objectContaining({ testFlag: true })
          }
        })
      );
    });
  });
  
  describe('Score Management', () => {
    beforeEach(() => {
      gameState.loadResources(mockGameData);
    });
    
    test('should update score and dispatch event', () => {
      const eventSpy = jest.fn();
      gameState.addEventListener('scoreChange', eventSpy);
      
      gameState.updateScore(10);
      
      expect(gameState.score).toBe(10);
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'scoreChange',
          detail: {
            previousScore: 0,
            score: 10,
            change: 10
          }
        })
      );
    });
    
    test('should not allow negative score', () => {
      gameState.updateScore(-10);
      expect(gameState.score).toBe(0);
    });
  });
  
  describe('State Serialization', () => {
    beforeEach(() => {
      gameState.loadResources(mockGameData);
      gameState.addItem('item1');
      gameState.setFlag('testFlag', true);
      gameState.updateScore(50);
    });
    
    test('should serialize state', () => {
      const serialized = gameState.serialize();
      
      expect(serialized).toEqual({
        currentRoomId: 'room1',
        inventory: ['item1'],
        flags: expect.objectContaining({
          testFlag: true,
          gameStarted: true
        }),
        score: 50,
        moves: 0,
        timestamp: expect.any(String)
      });
    });
    
    test('should deserialize state', () => {
      const savedState = gameState.serialize();
      
      // Change state
      gameState.changeRoom('room2');
      gameState.removeItem('item1');
      gameState.setFlag('testFlag', false);
      
      // Restore
      gameState.deserialize(savedState);
      
      expect(gameState.currentRoomId).toBe('room1');
      expect(gameState.hasItem('item1')).toBe(true);
      expect(gameState.getFlag('testFlag')).toBe(true);
      expect(gameState.score).toBe(50);
    });
  });
  
  describe('State History and Undo', () => {
    beforeEach(() => {
      gameState.loadResources(mockGameData);
    });
    
    test('should save state snapshots', () => {
      gameState.addItem('item1');
      gameState.setFlag('test', true);
      
      expect(gameState.stateHistory.length).toBe(2);
    });
    
    test('should undo last action', () => {
      gameState.addItem('item1');
      
      const result = gameState.undo();
      
      expect(result).toBe(true);
      expect(gameState.hasItem('item1')).toBe(false);
    });
    
    test('should limit history size', () => {
      // Set small history size
      gameState.maxHistorySize = 3;
      
      // Make more changes than history size
      for (let i = 0; i < 5; i++) {
        gameState.setFlag(`flag${i}`, true);
      }
      
      expect(gameState.stateHistory.length).toBe(3);
    });
  });
  
  describe('Validation', () => {
    test('should validate room structure', () => {
      const result = gameState.validateRooms(mockGameData.rooms);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('should catch missing room fields', () => {
      const badRooms = {
        room1: {
          name: 'Room 1'
          // Missing description and graphics
        }
      };
      
      const result = gameState.validateRooms(badRooms);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Room room1 missing description');
      expect(result.errors).toContain('Room room1 missing graphics');
    });
    
    test('should catch invalid exit references', () => {
      const badRooms = {
        room1: {
          name: 'Room 1',
          description: 'Desc',
          graphics: {},
          exits: {
            north: { roomId: 'nonexistent' }
          }
        }
      };
      
      const result = gameState.validateRooms(badRooms);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Room room1 exit north points to non-existent room nonexistent');
    });
    
    test('should validate save state', () => {
      gameState.loadResources(mockGameData);
      
      const validState = {
        currentRoomId: 'room1',
        inventory: ['item1'],
        flags: {},
        score: 0,
        moves: 0
      };
      
      const result = gameState.validateState(validState);
      expect(result.valid).toBe(true);
    });
    
    test('should catch invalid state references', () => {
      gameState.loadResources(mockGameData);
      
      const invalidState = {
        currentRoomId: 'badRoom',
        inventory: ['badItem'],
        flags: {},
        score: 0,
        moves: 0
      };
      
      const result = gameState.validateState(invalidState);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('State references non-existent room badRoom');
      expect(result.errors).toContain('State inventory contains non-existent item badItem');
    });
  });
});