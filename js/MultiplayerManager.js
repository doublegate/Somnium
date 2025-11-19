/**
 * MultiplayerManager.js
 * Real-time multiplayer support with WebSocket communication
 * Supports co-op play, shared worlds, and competitive modes
 */

export class MultiplayerManager {
  constructor(gameManager, config = {}) {
    this.gameManager = gameManager;
    this.config = {
      serverUrl: config.serverUrl || 'ws://localhost:8080',
      reconnectAttempts: config.reconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 3000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      ...config,
    };

    this.ws = null;
    this.connected = false;
    this.sessionId = null;
    this.playerId = null;
    this.players = new Map();
    this.reconnectCount = 0;
    this.heartbeatTimer = null;

    // Message queue for offline messages
    this.messageQueue = [];

    this.logger = console;
  }

  /**
   * Connect to multiplayer server
   */
  async connect(playerName) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.serverUrl);

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectCount = 0;

          this.logger.log('[MultiplayerManager] Connected to server');

          // Send initial handshake
          this.send({
            type: 'handshake',
            playerName,
            version: '2.0.0',
          });

          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.logger.error('[MultiplayerManager] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.stopHeartbeat();

          this.logger.log('[MultiplayerManager] Disconnected from server');

          // Attempt reconnection
          if (this.reconnectCount < this.config.reconnectAttempts) {
            this.reconnect();
          } else {
            this.emit('disconnected', { reason: 'Max reconnect attempts reached' });
          }
        };
      } catch (error) {
        this.logger.error('[MultiplayerManager] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  async reconnect() {
    this.reconnectCount++;

    this.logger.log(
      `[MultiplayerManager] Reconnecting (${this.reconnectCount}/${this.config.reconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect(this.playerName);
    }, this.config.reconnectDelay);
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.sessionId = null;
      this.players.clear();

      this.logger.log('[MultiplayerManager] Disconnected');
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.connected) {
        this.send({ type: 'heartbeat' });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Create a new multiplayer session
   * @param {Object} options - Session options
   */
  async createSession(options = {}) {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }

    const message = {
      type: 'create_session',
      options: {
        maxPlayers: options.maxPlayers || 4,
        mode: options.mode || 'coop', // 'coop', 'competitive', 'shared'
        worldId: options.worldId || null,
        private: options.private || false,
        password: options.password || null,
      },
    };

    this.send(message);

    return new Promise((resolve) => {
      this.once('session_created', (data) => {
        this.sessionId = data.sessionId;
        resolve(data);
      });
    });
  }

  /**
   * Join an existing session
   * @param {string} sessionId - Session ID to join
   * @param {string} password - Optional password
   */
  async joinSession(sessionId, password = null) {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }

    this.send({
      type: 'join_session',
      sessionId,
      password,
    });

    return new Promise((resolve, reject) => {
      this.once('session_joined', (data) => {
        this.sessionId = data.sessionId;
        this.players = new Map(data.players.map((p) => [p.id, p]));
        resolve(data);
      });

      this.once('session_join_failed', (data) => {
        reject(new Error(data.reason));
      });
    });
  }

  /**
   * Leave current session
   */
  leaveSession() {
    if (!this.sessionId) {
      return;
    }

    this.send({
      type: 'leave_session',
      sessionId: this.sessionId,
    });

    this.sessionId = null;
    this.players.clear();

    this.logger.log('[MultiplayerManager] Left session');
  }

  /**
   * Send player action
   * @param {Object} action - Action data
   */
  sendAction(action) {
    if (!this.sessionId) {
      this.logger.warn('[MultiplayerManager] Not in a session');
      return;
    }

    this.send({
      type: 'player_action',
      sessionId: this.sessionId,
      action,
      timestamp: Date.now(),
    });
  }

  /**
   * Send chat message
   * @param {string} message - Chat message
   */
  sendChat(message) {
    if (!this.sessionId) {
      return;
    }

    this.send({
      type: 'chat',
      sessionId: this.sessionId,
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * Sync game state with other players
   * @param {Object} state - Game state to sync
   */
  syncState(state) {
    if (!this.sessionId) {
      return;
    }

    this.send({
      type: 'state_sync',
      sessionId: this.sessionId,
      state,
      timestamp: Date.now(),
    });
  }

  /**
   * Send message to server
   */
  send(message) {
    if (!this.connected) {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      this.logger.error('[MultiplayerManager] Send error:', error);
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'handshake_response':
          this.handleHandshake(message);
          break;

        case 'session_created':
          this.emit('session_created', message.data);
          break;

        case 'session_joined':
          this.emit('session_joined', message.data);
          break;

        case 'session_join_failed':
          this.emit('session_join_failed', message.data);
          break;

        case 'player_joined':
          this.handlePlayerJoined(message.data);
          break;

        case 'player_left':
          this.handlePlayerLeft(message.data);
          break;

        case 'player_action':
          this.handlePlayerAction(message.data);
          break;

        case 'state_sync':
          this.handleStateSync(message.data);
          break;

        case 'chat':
          this.handleChat(message.data);
          break;

        case 'heartbeat_response':
          // Connection still alive
          break;

        case 'error':
          this.logger.error('[MultiplayerManager] Server error:', message.error);
          this.emit('error', message.error);
          break;

        default:
          this.logger.warn('[MultiplayerManager] Unknown message type:', message.type);
      }
    } catch (error) {
      this.logger.error('[MultiplayerManager] Message handling error:', error);
    }
  }

  /**
   * Handle handshake response
   */
  handleHandshake(message) {
    this.playerId = message.playerId;

    this.logger.log(`[MultiplayerManager] Assigned player ID: ${this.playerId}`);

    // Flush message queue
    while (this.messageQueue.length > 0) {
      const queuedMessage = this.messageQueue.shift();
      this.send(queuedMessage);
    }

    this.emit('connected', { playerId: this.playerId });
  }

  /**
   * Handle player joined
   */
  handlePlayerJoined(data) {
    const { player } = data;

    this.players.set(player.id, player);

    this.logger.log(`[MultiplayerManager] Player joined: ${player.name}`);

    this.emit('player_joined', player);

    // Show notification in game
    if (this.gameManager.uiManager) {
      this.gameManager.uiManager.addOutputText(
        `${player.name} joined the game.`,
        'system'
      );
    }
  }

  /**
   * Handle player left
   */
  handlePlayerLeft(data) {
    const { playerId, playerName } = data;

    this.players.delete(playerId);

    this.logger.log(`[MultiplayerManager] Player left: ${playerName}`);

    this.emit('player_left', { playerId, playerName });

    // Show notification in game
    if (this.gameManager.uiManager) {
      this.gameManager.uiManager.addOutputText(
        `${playerName} left the game.`,
        'system'
      );
    }
  }

  /**
   * Handle player action
   */
  handlePlayerAction(data) {
    const { playerId, action } = data;

    this.emit('player_action', { playerId, action });

    // Process action in game
    if (this.gameManager) {
      this.processPlayerAction(playerId, action);
    }
  }

  /**
   * Process another player's action in the game
   */
  processPlayerAction(playerId, action) {
    const player = this.players.get(playerId);

    if (!player) {
      return;
    }

    switch (action.type) {
      case 'move':
        this.handlePlayerMove(player, action.data);
        break;

      case 'speak':
        this.handlePlayerSpeak(player, action.data);
        break;

      case 'use_item':
        this.handlePlayerUseItem(player, action.data);
        break;

      case 'interact':
        this.handlePlayerInteract(player, action.data);
        break;

      default:
        this.logger.warn('[MultiplayerManager] Unknown action type:', action.type);
    }
  }

  /**
   * Handle player movement
   */
  handlePlayerMove(player, data) {
    const { room } = data;

    player.currentRoom = room;

    if (this.gameManager.uiManager) {
      this.gameManager.uiManager.addOutputText(
        `${player.name} entered the room.`,
        'system'
      );
    }

    // Update player sprite position
    if (this.gameManager.viewManager) {
      this.updatePlayerSprite(player);
    }
  }

  /**
   * Handle player speaking
   */
  handlePlayerSpeak(player, data) {
    const { message } = data;

    if (this.gameManager.uiManager) {
      this.gameManager.uiManager.addOutputText(
        `${player.name} says: "${message}"`,
        'dialogue'
      );
    }
  }

  /**
   * Handle player using item
   */
  handlePlayerUseItem(player, data) {
    const { itemId } = data;

    if (this.gameManager.uiManager) {
      this.gameManager.uiManager.addOutputText(
        `${player.name} used ${itemId}.`,
        'action'
      );
    }
  }

  /**
   * Handle player interaction
   */
  handlePlayerInteract(player, data) {
    const { objectId } = data;

    if (this.gameManager.uiManager) {
      this.gameManager.uiManager.addOutputText(
        `${player.name} interacted with ${objectId}.`,
        'action'
      );
    }
  }

  /**
   * Handle state synchronization
   */
  handleStateSync(data) {
    const { playerId, state } = data;

    // Merge state from other player
    this.emit('state_sync', { playerId, state });

    // In shared mode, apply state changes
    if (this.config.mode === 'shared') {
      this.applySharedState(state);
    }
  }

  /**
   * Apply shared state from other players
   */
  applySharedState(state) {
    // Merge state carefully to avoid conflicts
    // This depends on game mode and conflict resolution strategy

    if (this.gameManager.gameState) {
      // Example: merge inventory
      if (state.sharedInventory) {
        this.gameManager.inventory.mergeShared(state.sharedInventory);
      }

      // Example: merge puzzle progress
      if (state.puzzleStates) {
        this.gameManager.puzzleSystem.mergeStates(state.puzzleStates);
      }
    }
  }

  /**
   * Handle chat message
   */
  handleChat(data) {
    const { playerId, message } = data;
    const player = this.players.get(playerId);

    if (player && this.gameManager.uiManager) {
      this.gameManager.uiManager.addOutputText(
        `[${player.name}] ${message}`,
        'chat'
      );
    }

    this.emit('chat', { playerId, player, message });
  }

  /**
   * Update player sprite position
   */
  updatePlayerSprite(player) {
    // Create or update sprite for multiplayer player
    // Implementation depends on ViewManager

    const spriteId = `player_${player.id}`;

    // This would integrate with ViewManager
    // Example:
    // this.gameManager.viewManager.updateSprite(spriteId, {
    //   x: player.position.x,
    //   y: player.position.y,
    //   view: player.avatar || 'default_player',
    // });
  }

  /**
   * Get all players in session
   */
  getPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      sessionId: this.sessionId,
      playerId: this.playerId,
      playerCount: this.players.size,
    };
  }

  /**
   * Event emitter
   */
  emit(event, data) {
    window.dispatchEvent(
      new CustomEvent(`somnium:multiplayer:${event}`, { detail: data })
    );
  }

  /**
   * Listen to event
   */
  on(event, handler) {
    window.addEventListener(`somnium:multiplayer:${event}`, (e) => {
      handler(e.detail);
    });
  }

  /**
   * Listen to event once
   */
  once(event, handler) {
    const wrappedHandler = (e) => {
      handler(e.detail);
      window.removeEventListener(`somnium:multiplayer:${event}`, wrappedHandler);
    };

    window.addEventListener(`somnium:multiplayer:${event}`, wrappedHandler);
  }

  /**
   * Stop listening to event
   */
  off(event, handler) {
    window.removeEventListener(`somnium:multiplayer:${event}`, handler);
  }
}
