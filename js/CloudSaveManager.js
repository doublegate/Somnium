/**
 * CloudSaveManager.js
 * Cloud-based save game synchronization system
 * Supports multiple backends (Firebase, custom API, etc.)
 */

export class CloudSaveManager {
  constructor(saveGameManager, config = {}) {
    this.saveGameManager = saveGameManager;
    this.config = {
      backend: config.backend || 'localStorage', // 'firebase', 'api', 'localStorage'
      apiEndpoint: config.apiEndpoint || '/api/saves',
      autoSync: config.autoSync !== false,
      syncInterval: config.syncInterval || 300000, // 5 minutes
      conflictResolution: config.conflictResolution || 'newest', // 'newest', 'local', 'remote', 'manual'
      ...config,
    };

    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
    this.pendingChanges = [];
    this.userId = null;
    this.authenticated = false;

    this.logger = console;
  }

  /**
   * Initialize cloud save manager
   */
  async initialize() {
    try {
      // Check authentication status
      await this.checkAuth();

      // Start auto-sync if enabled
      if (this.config.autoSync && this.authenticated) {
        this.startAutoSync();
      }

      this.logger.log('[CloudSaveManager] Initialized');
      return true;
    } catch (error) {
      this.logger.error('[CloudSaveManager] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth() {
    const authToken = localStorage.getItem('somnium_auth_token');
    const userId = localStorage.getItem('somnium_user_id');

    if (authToken && userId) {
      // Verify token with backend
      const valid = await this.verifyAuthToken(authToken);

      if (valid) {
        this.authenticated = true;
        this.userId = userId;
        this.logger.log(`[CloudSaveManager] Authenticated as user: ${userId}`);
        return true;
      }
    }

    this.authenticated = false;
    this.userId = null;
    return false;
  }

  /**
   * Verify authentication token
   */
  async verifyAuthToken(token) {
    if (this.config.backend === 'localStorage') {
      return true; // No auth needed for local storage
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error('[CloudSaveManager] Token verification failed:', error);
      return false;
    }
  }

  /**
   * Authenticate user
   * @param {string} provider - 'email', 'google', 'github', etc.
   * @param {Object} credentials - Provider-specific credentials
   */
  async authenticate(provider, credentials) {
    try {
      if (this.config.backend === 'localStorage') {
        // Mock authentication for local storage
        this.userId = 'local_user';
        this.authenticated = true;
        localStorage.setItem('somnium_user_id', this.userId);
        localStorage.setItem('somnium_auth_token', 'local_token');
        return { success: true, userId: this.userId };
      }

      // Real authentication
      const response = await fetch(`${this.config.apiEndpoint}/auth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      this.userId = data.userId;
      this.authenticated = true;

      localStorage.setItem('somnium_user_id', data.userId);
      localStorage.setItem('somnium_auth_token', data.token);

      this.logger.log(`[CloudSaveManager] Authenticated as: ${this.userId}`);

      // Start auto-sync
      if (this.config.autoSync) {
        this.startAutoSync();
      }

      return { success: true, userId: this.userId };
    } catch (error) {
      this.logger.error('[CloudSaveManager] Authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    this.stopAutoSync();
    this.authenticated = false;
    this.userId = null;

    localStorage.removeItem('somnium_user_id');
    localStorage.removeItem('somnium_auth_token');

    this.logger.log('[CloudSaveManager] Signed out');
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    if (this.syncInterval) {
      return; // Already running
    }

    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.config.syncInterval);

    // Initial sync
    this.sync();

    this.logger.log('[CloudSaveManager] Auto-sync started');
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.logger.log('[CloudSaveManager] Auto-sync stopped');
    }
  }

  /**
   * Synchronize saves with cloud
   */
  async sync() {
    if (!this.authenticated) {
      this.logger.warn('[CloudSaveManager] Not authenticated, skipping sync');
      return { success: false, error: 'Not authenticated' };
    }

    if (this.syncInProgress) {
      this.logger.warn('[CloudSaveManager] Sync already in progress');
      return { success: false, error: 'Sync in progress' };
    }

    this.syncInProgress = true;

    try {
      this.logger.log('[CloudSaveManager] Starting sync...');

      // Get local saves
      const localSaves = await this.getLocalSaves();

      // Get cloud saves
      const cloudSaves = await this.getCloudSaves();

      // Detect conflicts and merge
      const syncResult = await this.mergeSaves(localSaves, cloudSaves);

      // Upload local changes
      if (syncResult.toUpload.length > 0) {
        await this.uploadSaves(syncResult.toUpload);
      }

      // Download remote changes
      if (syncResult.toDownload.length > 0) {
        await this.downloadSaves(syncResult.toDownload);
      }

      // Resolve conflicts
      if (syncResult.conflicts.length > 0) {
        await this.resolveConflicts(syncResult.conflicts);
      }

      this.lastSyncTime = Date.now();
      this.syncInProgress = false;

      this.logger.log('[CloudSaveManager] Sync completed');

      return {
        success: true,
        uploaded: syncResult.toUpload.length,
        downloaded: syncResult.toDownload.length,
        conflicts: syncResult.conflicts.length,
      };
    } catch (error) {
      this.syncInProgress = false;
      this.logger.error('[CloudSaveManager] Sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all local saves
   */
  async getLocalSaves() {
    const saves = [];

    for (let slot = 1; slot <= 10; slot++) {
      const save = this.saveGameManager.loadGame(slot);
      if (save) {
        saves.push({
          slot,
          data: save,
          timestamp: save.timestamp,
          hash: this.hashSave(save),
        });
      }
    }

    return saves;
  }

  /**
   * Get all cloud saves
   */
  async getCloudSaves() {
    if (this.config.backend === 'localStorage') {
      // Cloud saves stored in localStorage with prefix
      const cloudSaves = [];
      const prefix = 'somnium_cloud_save_';

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          const slot = parseInt(key.replace(prefix, ''));
          const data = JSON.parse(localStorage.getItem(key));
          cloudSaves.push({
            slot,
            data,
            timestamp: data.timestamp,
            hash: this.hashSave(data),
          });
        }
      }

      return cloudSaves;
    }

    // Fetch from API
    const token = localStorage.getItem('somnium_auth_token');

    const response = await fetch(`${this.config.apiEndpoint}/saves`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cloud saves');
    }

    const data = await response.json();
    return data.saves || [];
  }

  /**
   * Merge local and cloud saves, detect conflicts
   */
  async mergeSaves(localSaves, cloudSaves) {
    const toUpload = [];
    const toDownload = [];
    const conflicts = [];

    // Create lookup maps
    const localMap = new Map(localSaves.map((s) => [s.slot, s]));
    const cloudMap = new Map(cloudSaves.map((s) => [s.slot, s]));

    // Check all slots (1-10)
    for (let slot = 1; slot <= 10; slot++) {
      const local = localMap.get(slot);
      const cloud = cloudMap.get(slot);

      if (local && !cloud) {
        // Only local - upload
        toUpload.push(local);
      } else if (!local && cloud) {
        // Only cloud - download
        toDownload.push(cloud);
      } else if (local && cloud) {
        // Both exist - check for conflicts
        if (local.hash !== cloud.hash) {
          // Content differs
          if (local.timestamp > cloud.timestamp) {
            // Local is newer
            if (this.config.conflictResolution === 'newest') {
              toUpload.push(local);
            } else if (this.config.conflictResolution === 'manual') {
              conflicts.push({ slot, local, cloud });
            }
          } else if (cloud.timestamp > local.timestamp) {
            // Cloud is newer
            if (this.config.conflictResolution === 'newest') {
              toDownload.push(cloud);
            } else if (this.config.conflictResolution === 'manual') {
              conflicts.push({ slot, local, cloud });
            }
          } else {
            // Same timestamp but different content - conflict
            conflicts.push({ slot, local, cloud });
          }
        }
        // If hashes match, no action needed
      }
    }

    return { toUpload, toDownload, conflicts };
  }

  /**
   * Upload saves to cloud
   */
  async uploadSaves(saves) {
    for (const save of saves) {
      await this.uploadSave(save.slot, save.data);
    }

    this.logger.log(`[CloudSaveManager] Uploaded ${saves.length} saves`);
  }

  /**
   * Upload single save to cloud
   */
  async uploadSave(slot, saveData) {
    if (this.config.backend === 'localStorage') {
      const key = `somnium_cloud_save_${slot}`;
      localStorage.setItem(key, JSON.stringify(saveData));
      return;
    }

    const token = localStorage.getItem('somnium_auth_token');

    const response = await fetch(`${this.config.apiEndpoint}/saves/${slot}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload save slot ${slot}`);
    }
  }

  /**
   * Download saves from cloud
   */
  async downloadSaves(saves) {
    for (const save of saves) {
      this.saveGameManager.saveGame(save.slot, save.data);
    }

    this.logger.log(`[CloudSaveManager] Downloaded ${saves.length} saves`);
  }

  /**
   * Resolve save conflicts
   */
  async resolveConflicts(conflicts) {
    if (this.config.conflictResolution === 'local') {
      // Keep local versions
      await this.uploadSaves(conflicts.map((c) => c.local));
    } else if (this.config.conflictResolution === 'remote') {
      // Keep cloud versions
      await this.downloadSaves(conflicts.map((c) => c.cloud));
    } else if (this.config.conflictResolution === 'manual') {
      // Emit event for manual resolution
      this.emit('conflicts-detected', conflicts);
    }
  }

  /**
   * Hash save data for comparison
   */
  hashSave(saveData) {
    // Simple hash function (in production, use crypto.subtle.digest)
    const str = JSON.stringify(saveData);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }

  /**
   * Delete cloud save
   */
  async deleteSave(slot) {
    if (!this.authenticated) {
      throw new Error('Not authenticated');
    }

    if (this.config.backend === 'localStorage') {
      const key = `somnium_cloud_save_${slot}`;
      localStorage.removeItem(key);
      return;
    }

    const token = localStorage.getItem('somnium_auth_token');

    const response = await fetch(`${this.config.apiEndpoint}/saves/${slot}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete save slot ${slot}`);
    }

    this.logger.log(`[CloudSaveManager] Deleted cloud save slot ${slot}`);
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      authenticated: this.authenticated,
      userId: this.userId,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      autoSyncEnabled: this.config.autoSync && this.syncInterval !== null,
    };
  }

  /**
   * Event emitter
   */
  emit(event, data) {
    window.dispatchEvent(
      new CustomEvent(`somnium:cloudsave:${event}`, { detail: data })
    );
  }

  /**
   * Listen to events
   */
  on(event, handler) {
    window.addEventListener(`somnium:cloudsave:${event}`, handler);
  }

  /**
   * Stop listening to events
   */
  off(event, handler) {
    window.removeEventListener(`somnium:cloudsave:${event}`, handler);
  }
}
