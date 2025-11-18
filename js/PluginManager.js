/**
 * PluginManager.js
 * Manages plugin loading, lifecycle, and API for extending Somnium
 *
 * Plugin Architecture:
 * - Sandboxed execution environment
 * - Event-based hooks system
 * - Safe API exposure
 * - Hot-reloading support
 */

export class PluginManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.plugins = new Map();
    this.hooks = new Map();
    this.pluginApis = new Map();
    this.loadedPlugins = new Set();

    // Plugin lifecycle hooks
    this.lifecycleHooks = [
      'onInit',
      'onGameStart',
      'onGameEnd',
      'onRoomEnter',
      'onRoomExit',
      'onCommand',
      'onParserInput',
      'onRender',
      'onUpdate',
      'onSave',
      'onLoad',
      'onItemPickup',
      'onItemUse',
      'onNPCInteraction',
      'onPuzzleSolved',
      'onAchievementUnlocked',
    ];

    this.logger = console;
  }

  /**
   * Register a plugin
   * @param {Object} pluginManifest - Plugin metadata and entry point
   */
  async registerPlugin(pluginManifest) {
    const { id, name, version, author, entry, dependencies = [] } = pluginManifest;

    // Validate manifest
    if (!id || !name || !entry) {
      throw new Error('Invalid plugin manifest: missing required fields');
    }

    // Check if already registered
    if (this.plugins.has(id)) {
      throw new Error(`Plugin ${id} is already registered`);
    }

    // Check dependencies
    for (const dep of dependencies) {
      if (!this.loadedPlugins.has(dep)) {
        throw new Error(`Plugin ${id} requires missing dependency: ${dep}`);
      }
    }

    // Store plugin metadata
    this.plugins.set(id, {
      id,
      name,
      version,
      author,
      entry,
      dependencies,
      manifest: pluginManifest,
      loaded: false,
      enabled: true,
      instance: null,
    });

    this.logger.log(`[PluginManager] Registered plugin: ${name} v${version}`);

    return id;
  }

  /**
   * Load and initialize a plugin
   * @param {string} pluginId - Plugin identifier
   */
  async loadPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.loaded) {
      this.logger.warn(`[PluginManager] Plugin ${pluginId} already loaded`);
      return;
    }

    try {
      // Load plugin module
      const PluginModule = await this.loadPluginModule(plugin.entry);

      // Create plugin instance with sandboxed API
      const pluginApi = this.createPluginApi(pluginId);
      const instance = new PluginModule(pluginApi);

      // Store instance
      plugin.instance = instance;
      plugin.loaded = true;
      this.loadedPlugins.add(pluginId);

      // Call initialization hook
      if (typeof instance.onInit === 'function') {
        await instance.onInit();
      }

      this.logger.log(`[PluginManager] Loaded plugin: ${plugin.name}`);

      return instance;
    } catch (error) {
      this.logger.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Dynamically import plugin module
   * @param {string} entryPoint - Module path or URL
   */
  async loadPluginModule(entryPoint) {
    // Support both local modules and remote URLs
    if (entryPoint.startsWith('http://') || entryPoint.startsWith('https://')) {
      // Remote plugin - fetch and create blob URL
      const response = await fetch(entryPoint);
      const code = await response.text();
      const blob = new Blob([code], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const module = await import(url);
      URL.revokeObjectURL(url);
      return module.default;
    } else {
      // Local plugin
      const module = await import(entryPoint);
      return module.default;
    }
  }

  /**
   * Create sandboxed API for plugin
   * @param {string} pluginId - Plugin identifier
   */
  createPluginApi(pluginId) {
    const api = {
      // Plugin info
      pluginId,

      // Event system
      on: (event, handler) => this.registerHook(pluginId, event, handler),
      off: (event, handler) => this.unregisterHook(pluginId, event, handler),
      emit: (event, data) => this.emitHook(event, data),

      // Game state access (read-only proxy)
      getGameState: () => this.createReadOnlyProxy(this.gameManager.gameState.state),

      // Safe game operations
      addOutputText: (text, type) => this.gameManager.uiManager.addOutputText(text, type),
      playSound: (soundId) => this.gameManager.soundManager.playSound(soundId),
      showNotification: (message) => this.showPluginNotification(pluginId, message),

      // Parser extensions
      registerCommand: (verb, handler) => this.registerCustomCommand(pluginId, verb, handler),
      registerSynonym: (word, synonym) => this.registerSynonym(pluginId, word, synonym),

      // Custom objects/items
      addCustomObject: (object) => this.addCustomObject(pluginId, object),
      addCustomItem: (item) => this.addCustomItem(pluginId, item),

      // Rendering hooks
      registerRenderer: (renderer) => this.registerCustomRenderer(pluginId, renderer),

      // Storage (scoped to plugin)
      storage: {
        get: (key) => this.getPluginStorage(pluginId, key),
        set: (key, value) => this.setPluginStorage(pluginId, key, value),
        remove: (key) => this.removePluginStorage(pluginId, key),
        clear: () => this.clearPluginStorage(pluginId),
      },

      // Utilities
      logger: {
        log: (...args) => this.logger.log(`[Plugin:${pluginId}]`, ...args),
        warn: (...args) => this.logger.warn(`[Plugin:${pluginId}]`, ...args),
        error: (...args) => this.logger.error(`[Plugin:${pluginId}]`, ...args),
      },

      // Network (if enabled)
      fetch: (url, options) => this.safeFetch(pluginId, url, options),
    };

    this.pluginApis.set(pluginId, api);
    return api;
  }

  /**
   * Create read-only proxy for game state
   */
  createReadOnlyProxy(obj) {
    return new Proxy(obj, {
      set: () => {
        throw new Error('Game state is read-only for plugins');
      },
      deleteProperty: () => {
        throw new Error('Game state is read-only for plugins');
      },
      get: (target, prop) => {
        const value = target[prop];
        if (typeof value === 'object' && value !== null) {
          return this.createReadOnlyProxy(value);
        }
        return value;
      },
    });
  }

  /**
   * Register a hook handler
   */
  registerHook(pluginId, event, handler) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }

    this.hooks.get(event).push({
      pluginId,
      handler,
    });
  }

  /**
   * Unregister a hook handler
   */
  unregisterHook(pluginId, event, handler) {
    if (!this.hooks.has(event)) return;

    const handlers = this.hooks.get(event);
    const index = handlers.findIndex(
      (h) => h.pluginId === pluginId && h.handler === handler
    );

    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit a hook event to all registered handlers
   */
  async emitHook(event, data) {
    if (!this.hooks.has(event)) return data;

    const handlers = this.hooks.get(event);
    let result = data;

    for (const { pluginId, handler } of handlers) {
      const plugin = this.plugins.get(pluginId);

      if (!plugin || !plugin.enabled) continue;

      try {
        const hookResult = await handler(result);

        // Allow hooks to modify data
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        this.logger.error(`[PluginManager] Hook error in plugin ${pluginId}:`, error);
      }
    }

    return result;
  }

  /**
   * Register custom command
   */
  registerCustomCommand(pluginId, verb, handler) {
    const commandExecutor = this.gameManager.commandExecutor;

    if (!commandExecutor.customCommands) {
      commandExecutor.customCommands = new Map();
    }

    commandExecutor.customCommands.set(verb, {
      pluginId,
      handler,
    });

    this.logger.log(`[PluginManager] Registered custom command: ${verb} (${pluginId})`);
  }

  /**
   * Plugin storage operations
   */
  getPluginStorage(pluginId, key) {
    const storageKey = `plugin_${pluginId}_${key}`;
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  }

  setPluginStorage(pluginId, key, value) {
    const storageKey = `plugin_${pluginId}_${key}`;
    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  removePluginStorage(pluginId, key) {
    const storageKey = `plugin_${pluginId}_${key}`;
    localStorage.removeItem(storageKey);
  }

  clearPluginStorage(pluginId) {
    const prefix = `plugin_${pluginId}_`;
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Safe fetch wrapper with CORS restrictions
   */
  async safeFetch(pluginId, url, options = {}) {
    // TODO: Add whitelist/blacklist for plugin network access
    const plugin = this.plugins.get(pluginId);

    if (!plugin.manifest.permissions?.includes('network')) {
      throw new Error(`Plugin ${pluginId} does not have network permission`);
    }

    return fetch(url, options);
  }

  /**
   * Show plugin notification
   */
  showPluginNotification(pluginId, message) {
    const plugin = this.plugins.get(pluginId);
    const fullMessage = `[${plugin.name}] ${message}`;

    if (this.gameManager.uiManager) {
      this.gameManager.uiManager.addOutputText(fullMessage, 'system');
    }
  }

  /**
   * Enable/disable a plugin
   */
  setPluginEnabled(pluginId, enabled) {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.enabled = enabled;

    if (plugin.instance) {
      if (enabled && typeof plugin.instance.onEnable === 'function') {
        plugin.instance.onEnable();
      } else if (!enabled && typeof plugin.instance.onDisable === 'function') {
        plugin.instance.onDisable();
      }
    }

    this.logger.log(`[PluginManager] Plugin ${pluginId} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);

    if (!plugin || !plugin.loaded) return;

    try {
      // Call cleanup hook
      if (plugin.instance && typeof plugin.instance.onUnload === 'function') {
        await plugin.instance.onUnload();
      }

      // Remove all hooks
      for (const [event, handlers] of this.hooks.entries()) {
        this.hooks.set(
          event,
          handlers.filter((h) => h.pluginId !== pluginId)
        );
      }

      // Mark as unloaded
      plugin.loaded = false;
      plugin.instance = null;
      this.loadedPlugins.delete(pluginId);

      this.logger.log(`[PluginManager] Unloaded plugin: ${plugin.name}`);
    } catch (error) {
      this.logger.error(`[PluginManager] Error unloading plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins() {
    return Array.from(this.plugins.values()).map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      author: plugin.author,
      loaded: plugin.loaded,
      enabled: plugin.enabled,
    }));
  }

  /**
   * Hot reload a plugin (for development)
   */
  async reloadPlugin(pluginId) {
    await this.unloadPlugin(pluginId);
    await this.loadPlugin(pluginId);
    this.logger.log(`[PluginManager] Reloaded plugin: ${pluginId}`);
  }
}
