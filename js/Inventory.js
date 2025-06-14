/**
 * Inventory - Enhanced inventory management system
 *
 * Responsibilities:
 * - Track items with weight and size constraints
 * - Handle container objects
 * - Support worn items and equipment
 * - Manage item combinations
 * - Provide inventory queries
 */

export class Inventory {
  constructor(gameState) {
    this.gameState = gameState;

    // Inventory configuration
    this.maxWeight = 100;
    this.maxSize = 50;
    this.maxItems = 20;

    // Current inventory state
    this.items = []; // Array of item IDs
    this.worn = {}; // Map of slot -> itemId
    this.containers = new Map(); // Map of containerId -> [itemIds]

    // Equipment slots
    this.wearableSlots = {
      head: null,
      body: null,
      hands: null,
      feet: null,
      accessory: null,
    };
  }

  /**
   * Calculate total weight of inventory
   * @returns {number} Total weight
   */
  getTotalWeight() {
    let weight = 0;

    // Weight of carried items
    for (const itemId of this.items) {
      const item = this.gameState.getItem(itemId);
      if (item && item.weight) {
        weight += item.weight;
      }
    }

    // Weight of worn items
    for (const slot in this.worn) {
      const itemId = this.worn[slot];
      if (itemId) {
        const item = this.gameState.getItem(itemId);
        if (item && item.weight) {
          weight += item.weight * 0.5; // Worn items count half weight
        }
      }
    }

    return weight;
  }

  /**
   * Calculate total size/bulk of inventory
   * @returns {number} Total size
   */
  getTotalSize() {
    let size = 0;

    for (const itemId of this.items) {
      const item = this.gameState.getItem(itemId);
      if (item && item.size) {
        size += item.size;
      }
    }

    return size;
  }

  /**
   * Check if item can be added to inventory
   * @param {string} itemId - Item to check
   * @returns {Object} {canAdd: boolean, reason: string}
   */
  canAddItem(itemId) {
    const item = this.gameState.getItem(itemId);
    if (!item) {
      return { canAdd: false, reason: "Item doesn't exist" };
    }

    // Check if already carrying
    if (this.items.includes(itemId)) {
      return { canAdd: false, reason: "You're already carrying that" };
    }

    // Check item count
    if (this.items.length >= this.maxItems) {
      return { canAdd: false, reason: "You can't carry any more items" };
    }

    // Check weight limit
    const newWeight = this.getTotalWeight() + (item.weight || 0);
    if (newWeight > this.maxWeight) {
      return { canAdd: false, reason: "That's too heavy to carry" };
    }

    // Check size limit
    const newSize = this.getTotalSize() + (item.size || 0);
    if (newSize > this.maxSize) {
      return { canAdd: false, reason: "That's too bulky to carry" };
    }

    return { canAdd: true, reason: 'OK' };
  }

  /**
   * Add item to inventory
   * @param {string} itemId - Item to add
   * @param {string} containerId - Optional container to add to
   * @returns {boolean} Success
   */
  addItem(itemId, containerId = null) {
    const check = this.canAddItem(itemId);
    if (!check.canAdd) {
      return false;
    }

    if (containerId) {
      // Add to specific container
      if (!this.containers.has(containerId)) {
        this.containers.set(containerId, []);
      }
      this.containers.get(containerId).push(itemId);
    } else {
      // Add to main inventory
      this.items.push(itemId);
    }

    // Update game state
    this.gameState.addItem(itemId);

    return true;
  }

  /**
   * Remove item from inventory
   * @param {string} itemId - Item to remove
   * @returns {boolean} Success
   */
  removeItem(itemId) {
    // Check main inventory
    const index = this.items.indexOf(itemId);
    if (index > -1) {
      this.items.splice(index, 1);
      this.gameState.removeItem(itemId);
      return true;
    }

    // Check containers
    for (const [, contents] of this.containers) {
      const containerIndex = contents.indexOf(itemId);
      if (containerIndex > -1) {
        contents.splice(containerIndex, 1);
        this.gameState.removeItem(itemId);
        return true;
      }
    }

    // Check worn items
    for (const slot in this.worn) {
      if (this.worn[slot] === itemId) {
        this.worn[slot] = null;
        this.gameState.removeItem(itemId);
        return true;
      }
    }

    return false;
  }

  /**
   * Wear an item
   * @param {string} itemId - Item to wear
   * @returns {Object} {success: boolean, message: string}
   */
  wearItem(itemId) {
    const item = this.gameState.getItem(itemId);
    if (!item) {
      return { success: false, message: "You don't have that item" };
    }

    if (!item.wearable || !item.slot) {
      return { success: false, message: "You can't wear that" };
    }

    // Check if item is in inventory
    if (!this.items.includes(itemId) && !this.isInContainer(itemId)) {
      return { success: false, message: 'You need to be carrying that first' };
    }

    const slot = item.slot;

    // Remove from inventory
    this.removeFromInventoryList(itemId);

    // Handle existing worn item
    if (this.worn[slot]) {
      // Move old item back to inventory
      this.items.push(this.worn[slot]);
    }

    // Wear the new item
    this.worn[slot] = itemId;

    return { success: true, message: `You put on the ${item.name}` };
  }

  /**
   * Remove a worn item
   * @param {string} itemId - Item to remove
   * @returns {Object} {success: boolean, message: string}
   */
  removeWornItem(itemId) {
    for (const slot in this.worn) {
      if (this.worn[slot] === itemId) {
        const item = this.gameState.getItem(itemId);

        // Check if we can carry it
        const check = this.canAddItem(itemId);
        if (!check.canAdd) {
          return { success: false, message: check.reason };
        }

        // Remove from worn
        this.worn[slot] = null;

        // Add to inventory
        this.items.push(itemId);

        return { success: true, message: `You remove the ${item.name}` };
      }
    }

    return { success: false, message: "You're not wearing that" };
  }

  /**
   * Check if item is in a container
   * @param {string} itemId - Item to check
   * @returns {string|null} Container ID or null
   */
  isInContainer(itemId) {
    for (const [containerId, contents] of this.containers) {
      if (contents.includes(itemId)) {
        return containerId;
      }
    }
    return null;
  }

  /**
   * Remove item from inventory list (not from game state)
   * @private
   */
  removeFromInventoryList(itemId) {
    const index = this.items.indexOf(itemId);
    if (index > -1) {
      this.items.splice(index, 1);
    }

    // Also check containers
    for (const contents of this.containers.values()) {
      const containerIndex = contents.indexOf(itemId);
      if (containerIndex > -1) {
        contents.splice(containerIndex, 1);
      }
    }
  }

  /**
   * Get items in a specific container
   * @param {string} containerId - Container to check
   * @returns {Array} Array of item IDs
   */
  getContainerContents(containerId) {
    return this.containers.get(containerId) || [];
  }

  /**
   * Transfer item between containers
   * @param {string} itemId - Item to transfer
   * @param {string} fromContainer - Source container (null for main inventory)
   * @param {string} toContainer - Destination container (null for main inventory)
   * @returns {boolean} Success
   */
  transferItem(itemId, fromContainer, toContainer) {
    // Remove from source
    if (fromContainer) {
      const contents = this.containers.get(fromContainer);
      if (!contents) return false;

      const index = contents.indexOf(itemId);
      if (index === -1) return false;

      contents.splice(index, 1);
    } else {
      const index = this.items.indexOf(itemId);
      if (index === -1) return false;

      this.items.splice(index, 1);
    }

    // Add to destination
    if (toContainer) {
      if (!this.containers.has(toContainer)) {
        this.containers.set(toContainer, []);
      }
      this.containers.get(toContainer).push(itemId);
    } else {
      this.items.push(itemId);
    }

    return true;
  }

  /**
   * Get all carried items (including worn and in containers)
   * @returns {Array} Array of item IDs
   */
  getAllItems() {
    const allItems = [...this.items];

    // Add worn items
    for (const itemId of Object.values(this.worn)) {
      if (itemId) allItems.push(itemId);
    }

    // Add container contents
    for (const contents of this.containers.values()) {
      allItems.push(...contents);
    }

    return allItems;
  }

  /**
   * Serialize inventory state
   * @returns {Object} Serialized inventory
   */
  serialize() {
    return {
      items: [...this.items],
      worn: { ...this.worn },
      containers: Array.from(this.containers.entries()),
    };
  }

  /**
   * Restore inventory from serialized state
   * @param {Object} data - Serialized inventory data
   */
  deserialize(data) {
    this.items = data.items || [];
    this.worn = data.worn || {};
    this.containers = new Map(data.containers || []);
  }
}
