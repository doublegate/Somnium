/**
 * SaveGameManager - Handles game save/load operations
 *
 * Provides multiple save slots, auto-save functionality,
 * browser localStorage persistence, and file export/import.
 */

import { logger } from './logger.js';

export class SaveGameManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.maxSaveSlots = 10;
    this.autoSaveInterval = 5 * 60 * 1000; // 5 minutes
    this.autoSaveTimer = null;
    this.storagePrefix = 'somnium_save_';
    this.logger = logger;
  }

  /**
   * Save game to a specific slot
   * @param {number} slot - Save slot number (0-9, or -1 for autosave)
   * @param {string} saveName - Optional custom save name
   * @returns {Object} Save data
   */
  saveToSlot(slot, saveName = null) {
    if (slot < -1 || slot >= this.maxSaveSlots) {
      throw new Error(`Invalid save slot: ${slot}`);
    }

    this.logger.log(`Saving game to slot ${slot}`);

    // Get save data from game manager
    const saveData = this.gameManager.saveGame();

    // Add metadata
    saveData.slot = slot;
    saveData.saveName =
      saveName || (slot === -1 ? 'Auto-save' : `Save ${slot + 1}`);
    saveData.timestamp = new Date().toISOString();

    // Add thumbnail data (simplified - could be canvas snapshot)
    saveData.thumbnail = this.generateThumbnail();

    // Save to localStorage
    try {
      const key = this.getStorageKey(slot);
      localStorage.setItem(key, JSON.stringify(saveData));
      this.logger.log(`Game saved to slot ${slot} successfully`);

      // Update save slot list
      this.updateSaveSlotList();

      return saveData;
    } catch (error) {
      this.logger.error('Failed to save game:', error);
      throw new Error('Failed to save game to browser storage');
    }
  }

  /**
   * Load game from a specific slot
   * @param {number} slot - Save slot number
   * @returns {Promise<Object>} Save data
   */
  async loadFromSlot(slot) {
    if (slot < -1 || slot >= this.maxSaveSlots) {
      throw new Error(`Invalid save slot: ${slot}`);
    }

    this.logger.log(`Loading game from slot ${slot}`);

    try {
      const key = this.getStorageKey(slot);
      const savedDataStr = localStorage.getItem(key);

      if (!savedDataStr) {
        throw new Error(`No save found in slot ${slot}`);
      }

      const saveData = JSON.parse(savedDataStr);

      // Validate save data
      this.validateSaveData(saveData);

      // Load into game manager
      await this.gameManager.loadGame(saveData);

      this.logger.log(`Game loaded from slot ${slot} successfully`);
      return saveData;
    } catch (error) {
      this.logger.error('Failed to load game:', error);
      throw error;
    }
  }

  /**
   * Delete a save from a specific slot
   * @param {number} slot - Save slot number
   */
  deleteSlot(slot) {
    if (slot < -1 || slot >= this.maxSaveSlots) {
      throw new Error(`Invalid save slot: ${slot}`);
    }

    this.logger.log(`Deleting save from slot ${slot}`);

    try {
      const key = this.getStorageKey(slot);
      localStorage.removeItem(key);

      // Update save slot list
      this.updateSaveSlotList();

      this.logger.log(`Save slot ${slot} deleted`);
    } catch (error) {
      this.logger.error('Failed to delete save:', error);
      throw error;
    }
  }

  /**
   * Get list of all available saves
   * @returns {Array} Array of save metadata objects
   */
  getSaveSlots() {
    const saves = [];

    for (let slot = 0; slot < this.maxSaveSlots; slot++) {
      const key = this.getStorageKey(slot);
      const savedDataStr = localStorage.getItem(key);

      if (savedDataStr) {
        try {
          const saveData = JSON.parse(savedDataStr);
          saves.push({
            slot,
            saveName: saveData.saveName,
            timestamp: saveData.timestamp,
            thumbnail: saveData.thumbnail,
            metadata: saveData.metadata,
          });
        } catch (error) {
          this.logger.warn(`Corrupted save in slot ${slot}`);
        }
      } else {
        saves.push({
          slot,
          empty: true,
        });
      }
    }

    // Add autosave slot
    const autoSaveKey = this.getStorageKey(-1);
    const autoSaveStr = localStorage.getItem(autoSaveKey);

    if (autoSaveStr) {
      try {
        const saveData = JSON.parse(autoSaveStr);
        saves.push({
          slot: -1,
          saveName: 'Auto-save',
          timestamp: saveData.timestamp,
          thumbnail: saveData.thumbnail,
          metadata: saveData.metadata,
        });
      } catch (error) {
        this.logger.warn('Corrupted auto-save');
      }
    }

    return saves;
  }

  /**
   * Export save to downloadable file
   * @param {number} slot - Save slot to export
   * @returns {string} Download URL
   */
  exportSaveToFile(slot) {
    const key = this.getStorageKey(slot);
    const savedDataStr = localStorage.getItem(key);

    if (!savedDataStr) {
      throw new Error(`No save found in slot ${slot}`);
    }

    const saveData = JSON.parse(savedDataStr);

    // Create blob and download URL
    const blob = new Blob([JSON.stringify(saveData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const filename = `somnium_save_${saveData.saveName.replace(/\s/g, '_')}_${Date.now()}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

    this.logger.log(`Save exported to file: ${filename}`);
    return url;
  }

  /**
   * Import save from file
   * @param {File} file - File object from input
   * @param {number} targetSlot - Target save slot
   * @returns {Promise<Object>} Imported save data
   */
  async importSaveFromFile(file, targetSlot) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result);

          // Validate save data
          this.validateSaveData(saveData);

          // Update slot number
          saveData.slot = targetSlot;

          // Save to target slot
          const key = this.getStorageKey(targetSlot);
          localStorage.setItem(key, JSON.stringify(saveData));

          // Update save slot list
          this.updateSaveSlotList();

          this.logger.log(`Save imported to slot ${targetSlot}`);
          resolve(saveData);
        } catch (error) {
          this.logger.error('Failed to import save:', error);
          reject(new Error('Invalid save file format'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read save file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Enable auto-save functionality
   * @param {number} interval - Auto-save interval in milliseconds
   */
  enableAutoSave(interval = this.autoSaveInterval) {
    this.disableAutoSave(); // Clear any existing timer

    this.autoSaveTimer = setInterval(() => {
      if (this.gameManager.isGameRunning()) {
        try {
          this.saveToSlot(-1, 'Auto-save');
          this.logger.log('Auto-save completed');
        } catch (error) {
          this.logger.error('Auto-save failed:', error);
        }
      }
    }, interval);

    this.logger.log(`Auto-save enabled (interval: ${interval}ms)`);
  }

  /**
   * Disable auto-save functionality
   */
  disableAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      this.logger.log('Auto-save disabled');
    }
  }

  /**
   * Check if auto-save is enabled
   * @returns {boolean}
   */
  isAutoSaveEnabled() {
    return this.autoSaveTimer !== null;
  }

  /**
   * Quick save to most recent slot or slot 0
   */
  quickSave() {
    // Find most recently used slot (excluding autosave)
    let lastSlot = 0;
    let lastTimestamp = 0;

    for (let slot = 0; slot < this.maxSaveSlots; slot++) {
      const key = this.getStorageKey(slot);
      const savedDataStr = localStorage.getItem(key);

      if (savedDataStr) {
        try {
          const saveData = JSON.parse(savedDataStr);
          const timestamp = new Date(saveData.timestamp).getTime();

          if (timestamp > lastTimestamp) {
            lastTimestamp = timestamp;
            lastSlot = slot;
          }
        } catch (error) {
          // Ignore corrupted saves
        }
      }
    }

    return this.saveToSlot(lastSlot, 'Quick Save');
  }

  /**
   * Quick load from most recent save
   * @returns {Promise<Object>} Loaded save data
   */
  async quickLoad() {
    // Find most recent save (including autosave)
    let mostRecentSlot = -1;
    let mostRecentTimestamp = 0;

    for (let slot = -1; slot < this.maxSaveSlots; slot++) {
      const key = this.getStorageKey(slot);
      const savedDataStr = localStorage.getItem(key);

      if (savedDataStr) {
        try {
          const saveData = JSON.parse(savedDataStr);
          const timestamp = new Date(saveData.timestamp).getTime();

          if (timestamp > mostRecentTimestamp) {
            mostRecentTimestamp = timestamp;
            mostRecentSlot = slot;
          }
        } catch (error) {
          // Ignore corrupted saves
        }
      }
    }

    if (mostRecentSlot === -1 && mostRecentTimestamp === 0) {
      throw new Error('No saves found');
    }

    return this.loadFromSlot(mostRecentSlot);
  }

  /**
   * Get storage key for a save slot
   * @private
   * @param {number} slot - Save slot number
   * @returns {string} Storage key
   */
  getStorageKey(slot) {
    if (slot === -1) {
      return `${this.storagePrefix}autosave`;
    }
    return `${this.storagePrefix}slot_${slot}`;
  }

  /**
   * Generate thumbnail data for save
   * @private
   * @returns {Object} Thumbnail data
   */
  generateThumbnail() {
    // Simplified thumbnail - could capture canvas snapshot
    const currentRoom = this.gameManager.gameState.getCurrentRoom();

    return {
      roomName: currentRoom?.name || 'Unknown',
      score: this.gameManager.gameState.score || 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Validate save data structure
   * @private
   * @param {Object} saveData - Save data to validate
   * @throws {Error} if invalid
   */
  validateSaveData(saveData) {
    if (!saveData) {
      throw new Error('Save data is null or undefined');
    }

    if (!saveData.version) {
      throw new Error('Save data missing version field');
    }

    if (!saveData.state) {
      throw new Error('Save data missing state field');
    }

    if (!saveData.gameJSON) {
      throw new Error('Save data missing gameJSON field');
    }

    // Check version compatibility
    const saveVersion = saveData.version;
    const currentVersion = '1.0.0';

    if (saveVersion !== currentVersion) {
      this.logger.warn(
        `Save version mismatch: ${saveVersion} vs ${currentVersion}`
      );
      // Could implement migration logic here
    }
  }

  /**
   * Update save slot list in localStorage
   * @private
   */
  updateSaveSlotList() {
    const slots = this.getSaveSlots();
    localStorage.setItem(`${this.storagePrefix}list`, JSON.stringify(slots));
  }

  /**
   * Clear all saves (dangerous!)
   */
  clearAllSaves() {
    this.logger.warn('Clearing all saves');

    for (let slot = -1; slot < this.maxSaveSlots; slot++) {
      try {
        const key = this.getStorageKey(slot);
        localStorage.removeItem(key);
      } catch (error) {
        this.logger.error(`Failed to clear slot ${slot}:`, error);
      }
    }

    // Clear slot list
    localStorage.removeItem(`${this.storagePrefix}list`);

    this.logger.log('All saves cleared');
  }

  /**
   * Get storage usage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    let totalSize = 0;
    let saveCount = 0;

    for (let slot = -1; slot < this.maxSaveSlots; slot++) {
      const key = this.getStorageKey(slot);
      const savedDataStr = localStorage.getItem(key);

      if (savedDataStr) {
        totalSize += savedDataStr.length;
        saveCount++;
      }
    }

    // Estimate in KB
    const sizeKB = Math.round(totalSize / 1024);

    return {
      saveCount,
      totalSizeKB: sizeKB,
      maxSlots: this.maxSaveSlots,
      usedSlots: saveCount,
      autoSaveEnabled: this.isAutoSaveEnabled(),
    };
  }
}

export default SaveGameManager;
