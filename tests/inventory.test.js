import { Inventory } from '../js/Inventory.js';
import { GameState } from '../js/GameState.js';

describe('Inventory System', () => {
  let inventory;
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
    inventory = new Inventory(gameState);

    // Mock game data
    const mockData = {
      items: {
        sword: {
          id: 'sword',
          name: 'iron sword',
          weight: 5,
          size: 10,
        },
        coin: {
          id: 'coin',
          name: 'gold coin',
          weight: 0.1,
          size: 0.5,
        },
        armor: {
          id: 'armor',
          name: 'leather armor',
          weight: 10,
          size: 20,
          wearable: true,
          slot: 'body',
        },
        ring: {
          id: 'ring',
          name: 'magic ring',
          weight: 0.1,
          size: 0.1,
          wearable: true,
          slot: 'accessory',
        },
        pouch: {
          id: 'pouch',
          name: 'small pouch',
          weight: 0.5,
          size: 2,
          type: 'container',
        },
      },
    };

    // Mock getItem method
    gameState.getItem = jest.fn((id) => mockData.items[id]);
    gameState.addItem = jest.fn();
    gameState.removeItem = jest.fn();
  });

  describe('Weight Management', () => {
    test('calculates total weight correctly', () => {
      inventory.items = ['sword', 'coin'];
      expect(inventory.getTotalWeight()).toBe(5.1);
    });

    test('calculates worn item weight at half rate', () => {
      inventory.items = ['sword'];
      inventory.worn.body = 'armor';
      expect(inventory.getTotalWeight()).toBe(10); // 5 + (10 * 0.5)
    });

    test('prevents adding items over weight limit', () => {
      inventory.maxWeight = 10;
      inventory.items = ['sword']; // Weight: 5

      const check = inventory.canAddItem('armor'); // Weight: 10
      expect(check.canAdd).toBe(false);
      expect(check.reason).toContain('too heavy');
    });
  });

  describe('Size Management', () => {
    test('calculates total size correctly', () => {
      inventory.items = ['sword', 'coin'];
      expect(inventory.getTotalSize()).toBe(10.5);
    });

    test('prevents adding items over size limit', () => {
      inventory.maxSize = 15;
      inventory.items = ['sword']; // Size: 10

      const check = inventory.canAddItem('armor'); // Size: 20
      expect(check.canAdd).toBe(false);
      expect(check.reason).toContain('too bulky');
    });
  });

  describe('Item Management', () => {
    test('adds items to inventory', () => {
      const result = inventory.addItem('coin');
      expect(result).toBe(true);
      expect(inventory.items).toContain('coin');
      expect(gameState.addItem).toHaveBeenCalledWith('coin');
    });

    test('prevents adding duplicate items', () => {
      inventory.items = ['coin'];
      const check = inventory.canAddItem('coin');
      expect(check.canAdd).toBe(false);
      expect(check.reason).toContain('already carrying');
    });

    test('removes items from inventory', () => {
      inventory.items = ['coin', 'sword'];
      const result = inventory.removeItem('coin');
      expect(result).toBe(true);
      expect(inventory.items).not.toContain('coin');
      expect(gameState.removeItem).toHaveBeenCalledWith('coin');
    });

    test('respects item count limit', () => {
      inventory.maxItems = 3;
      inventory.items = ['coin', 'sword', 'ring'];

      const check = inventory.canAddItem('armor');
      expect(check.canAdd).toBe(false);
      expect(check.reason).toContain("can't carry any more");
    });
  });

  describe('Wearable Items', () => {
    test('wears items in appropriate slots', () => {
      inventory.items = ['armor'];
      const result = inventory.wearItem('armor');

      expect(result.success).toBe(true);
      expect(result.message).toContain('put on');
      expect(inventory.worn.body).toBe('armor');
      expect(inventory.items).not.toContain('armor');
    });

    test('prevents wearing non-wearable items', () => {
      inventory.items = ['sword'];
      const result = inventory.wearItem('sword');

      expect(result.success).toBe(false);
      expect(result.message).toContain("can't wear");
    });

    test('swaps worn items in same slot', () => {
      inventory.items = ['armor'];
      inventory.worn.body = 'ring'; // Wrong slot, but for test

      const result = inventory.wearItem('armor');
      expect(result.success).toBe(true);
      expect(inventory.worn.body).toBe('armor');
      expect(inventory.items).toContain('ring');
    });

    test('removes worn items', () => {
      inventory.worn.body = 'armor';
      const result = inventory.removeWornItem('armor');

      expect(result.success).toBe(true);
      expect(inventory.worn.body).toBeNull();
      expect(inventory.items).toContain('armor');
    });
  });

  describe('Container Management', () => {
    test('adds items to containers', () => {
      const result = inventory.addItem('coin', 'pouch');
      expect(result).toBe(true);
      expect(inventory.getContainerContents('pouch')).toContain('coin');
    });

    test('tracks items in containers', () => {
      inventory.containers.set('pouch', ['coin', 'ring']);
      const allItems = inventory.getAllItems();
      expect(allItems).toContain('coin');
      expect(allItems).toContain('ring');
    });

    test('transfers items between containers', () => {
      inventory.items = ['coin'];
      inventory.containers.set('pouch', []);

      const result = inventory.transferItem('coin', null, 'pouch');
      expect(result).toBe(true);
      expect(inventory.items).not.toContain('coin');
      expect(inventory.getContainerContents('pouch')).toContain('coin');
    });

    test('finds items in containers', () => {
      inventory.containers.set('pouch', ['coin']);
      expect(inventory.isInContainer('coin')).toBe('pouch');
    });
  });

  describe('Serialization', () => {
    test('serializes inventory state', () => {
      inventory.items = ['sword'];
      inventory.worn = { body: 'armor' };
      inventory.containers.set('pouch', ['coin']);

      const serialized = inventory.serialize();
      expect(serialized.items).toEqual(['sword']);
      expect(serialized.worn).toEqual({ body: 'armor' });
      expect(serialized.containers).toEqual([['pouch', ['coin']]]);
    });

    test('deserializes inventory state', () => {
      const data = {
        items: ['sword'],
        worn: { body: 'armor' },
        containers: [['pouch', ['coin']]],
      };

      inventory.deserialize(data);
      expect(inventory.items).toEqual(['sword']);
      expect(inventory.worn.body).toBe('armor');
      expect(inventory.getContainerContents('pouch')).toEqual(['coin']);
    });
  });
});
