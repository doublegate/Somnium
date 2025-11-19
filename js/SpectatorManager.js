/**
 * SpectatorManager - Multiplayer Spectator Mode
 * Allows users to watch multiplayer games without participating
 *
 * Features:
 * - Read-only view of game state
 * - Real-time updates via WebSocket
 * - Chat participation (view and optionally send)
 * - Player list viewing
 * - Spectator count display
 * - Low bandwidth mode option
 *
 * @module SpectatorManager
 * @version 2.0.0
 */

import logger from './logger.js';

export default class SpectatorManager {
  constructor(multiplayerManager) {
    this.multiplayerManager = multiplayerManager;

    // State
    this.isSpectating = false;
    this.sessionId = null;
    this.spectatorId = null;

    // Configuration
    this.config = {
      allowChat: true, // Can spectators chat?
      lowBandwidth: false, // Reduce update frequency
      showPlayerActions: true, // Show what players are doing
      receiveStateUpdates: true, // Get game state updates
    };

    // Data
    this.gameState = null;
    this.players = new Map();
    this.chatHistory = [];
    this.spectatorCount = 0;

    // Callbacks
    this.onStateUpdate = null;
    this.onPlayerAction = null;
    this.onChatMessage = null;
    this.onSpectatorJoin = null;
    this.onSpectatorLeave = null;

    // Stats
    this.stats = {
      joinTime: null,
      messagesReceived: 0,
      stateUpdates: 0,
      bandwidth: 0, // bytes
    };
  }

  /**
   * Join a session as spectator
   * @param {string} sessionId - Session to spectate
   * @param {string} spectatorName - Display name for spectator
   * @returns {Promise<boolean>} Success status
   */
  async joinAsSpectator(sessionId, spectatorName = 'Spectator') {
    if (this.isSpectating) {
      logger.warn('Already spectating a session');
      return false;
    }

    try {
      // Connect via multiplayer manager with spectator flag
      await this.multiplayerManager.connect(spectatorName, {
        spectator: true,
      });

      // Send spectator join request
      this.multiplayerManager.send({
        type: 'join_as_spectator',
        sessionId: sessionId,
        spectatorName: spectatorName,
        config: this.config,
      });

      this.sessionId = sessionId;
      this.isSpectating = true;
      this.stats.joinTime = Date.now();

      // Setup message listeners
      this.setupListeners();

      logger.info('Joined session as spectator:', sessionId);
      return true;
    } catch (error) {
      logger.error('Failed to join as spectator:', error);
      return false;
    }
  }

  /**
   * Leave spectator mode
   */
  leaveSpectatorMode() {
    if (!this.isSpectating) {
      return;
    }

    // Send leave notification
    this.multiplayerManager.send({
      type: 'leave_spectator',
      sessionId: this.sessionId,
      spectatorId: this.spectatorId,
    });

    this.cleanup();

    logger.info('Left spectator mode');
  }

  /**
   * Setup event listeners for spectator updates
   */
  setupListeners() {
    // Spectator joined confirmation
    this.multiplayerManager.on('spectator_joined', (data) => {
      this.spectatorId = data.spectatorId;
      this.gameState = data.initialState;
      this.players = new Map(
        Object.entries(data.players || {})
      );
      this.spectatorCount = data.spectatorCount || 0;

      logger.info('Spectator mode confirmed', {
        spectatorId: this.spectatorId,
        players: this.players.size,
        spectators: this.spectatorCount,
      });

      if (this.onSpectatorJoin) {
        this.onSpectatorJoin(data);
      }
    });

    // Game state updates
    this.multiplayerManager.on('state_update', (data) => {
      if (!this.isSpectating) return;

      this.gameState = data.state;
      this.stats.stateUpdates++;
      this.stats.bandwidth += JSON.stringify(data).length;

      if (this.onStateUpdate) {
        this.onStateUpdate(data.state);
      }
    });

    // Player actions
    this.multiplayerManager.on('player_action', (data) => {
      if (!this.isSpectating || !this.config.showPlayerActions) return;

      this.stats.messagesReceived++;

      if (this.onPlayerAction) {
        this.onPlayerAction(data);
      }

      // Dispatch event for UI
      window.dispatchEvent(
        new CustomEvent('spectatorPlayerAction', {
          detail: data,
        })
      );
    });

    // Chat messages
    this.multiplayerManager.on('chat_message', (data) => {
      if (!this.isSpectating) return;

      this.chatHistory.push({
        player: data.player,
        message: data.message,
        timestamp: data.timestamp || Date.now(),
        isSpectator: data.isSpectator || false,
      });

      this.stats.messagesReceived++;

      if (this.onChatMessage) {
        this.onChatMessage(data);
      }
    });

    // Player list updates
    this.multiplayerManager.on('player_joined', (data) => {
      if (!this.isSpectating) return;

      this.players.set(data.playerId, {
        name: data.playerName,
        isHost: data.isHost || false,
        isReady: data.isReady || false,
      });

      window.dispatchEvent(
        new CustomEvent('spectatorPlayerJoined', {
          detail: data,
        })
      );
    });

    this.multiplayerManager.on('player_left', (data) => {
      if (!this.isSpectating) return;

      this.players.delete(data.playerId);

      window.dispatchEvent(
        new CustomEvent('spectatorPlayerLeft', {
          detail: data,
        })
      );
    });

    // Spectator count updates
    this.multiplayerManager.on('spectator_count', (data) => {
      this.spectatorCount = data.count;

      window.dispatchEvent(
        new CustomEvent('spectatorCountUpdate', {
          detail: { count: data.count },
        })
      );
    });

    // Session ended
    this.multiplayerManager.on('session_ended', (data) => {
      logger.info('Session ended, leaving spectator mode');
      this.leaveSpectatorMode();

      window.dispatchEvent(
        new CustomEvent('spectatorSessionEnded', {
          detail: data,
        })
      );
    });

    // Kicked from session
    this.multiplayerManager.on('spectator_kicked', (data) => {
      logger.warn('Kicked from spectator mode:', data.reason);
      this.leaveSpectatorMode();

      window.dispatchEvent(
        new CustomEvent('spectatorKicked', {
          detail: data,
        })
      );
    });
  }

  /**
   * Send chat message as spectator
   * @param {string} message - Message to send
   * @returns {boolean} Success status
   */
  sendChatMessage(message) {
    if (!this.isSpectating) {
      logger.warn('Not spectating, cannot send chat');
      return false;
    }

    if (!this.config.allowChat) {
      logger.warn('Spectator chat disabled');
      return false;
    }

    this.multiplayerManager.send({
      type: 'spectator_chat',
      sessionId: this.sessionId,
      spectatorId: this.spectatorId,
      message: message,
    });

    return true;
  }

  /**
   * Request full state refresh
   */
  requestStateRefresh() {
    if (!this.isSpectating) {
      return;
    }

    this.multiplayerManager.send({
      type: 'request_state_refresh',
      sessionId: this.sessionId,
      spectatorId: this.spectatorId,
    });

    logger.info('Requested state refresh');
  }

  /**
   * Toggle low bandwidth mode
   * @param {boolean} enabled - Enable low bandwidth mode
   */
  setLowBandwidth(enabled) {
    this.config.lowBandwidth = enabled;

    if (this.isSpectating) {
      this.multiplayerManager.send({
        type: 'spectator_config_update',
        sessionId: this.sessionId,
        spectatorId: this.spectatorId,
        config: { lowBandwidth: enabled },
      });
    }

    logger.info('Low bandwidth mode:', enabled);
  }

  /**
   * Toggle chat permission
   * @param {boolean} enabled - Allow spectator chat
   */
  setAllowChat(enabled) {
    this.config.allowChat = enabled;
    logger.info('Spectator chat:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Get current game state (read-only)
   * @returns {Object} Current game state
   */
  getGameState() {
    return this.gameState ? { ...this.gameState } : null;
  }

  /**
   * Get player list
   * @returns {Map} Players in session
   */
  getPlayers() {
    return new Map(this.players);
  }

  /**
   * Get chat history
   * @returns {Array} Chat messages
   */
  getChatHistory() {
    return [...this.chatHistory];
  }

  /**
   * Get spectator count
   * @returns {number} Number of spectators
   */
  getSpectatorCount() {
    return this.spectatorCount;
  }

  /**
   * Get spectator statistics
   * @returns {Object} Stats
   */
  getStats() {
    const duration = this.stats.joinTime
      ? Date.now() - this.stats.joinTime
      : 0;

    return {
      ...this.stats,
      duration,
      bandwidthPerSecond:
        duration > 0 ? (this.stats.bandwidth / duration) * 1000 : 0,
    };
  }

  /**
   * Check if currently spectating
   * @returns {boolean} Spectating status
   */
  isCurrentlySpectating() {
    return this.isSpectating;
  }

  /**
   * Get session info
   * @returns {Object} Session information
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      spectatorId: this.spectatorId,
      isSpectating: this.isSpectating,
      playerCount: this.players.size,
      spectatorCount: this.spectatorCount,
      chatEnabled: this.config.allowChat,
      lowBandwidth: this.config.lowBandwidth,
    };
  }

  /**
   * Cleanup spectator resources
   */
  cleanup() {
    this.isSpectating = false;
    this.sessionId = null;
    this.spectatorId = null;
    this.gameState = null;
    this.players.clear();
    this.chatHistory = [];
    this.spectatorCount = 0;

    // Reset callbacks
    this.onStateUpdate = null;
    this.onPlayerAction = null;
    this.onChatMessage = null;
    this.onSpectatorJoin = null;
    this.onSpectatorLeave = null;
  }

  /**
   * Export spectator session data
   * @returns {Object} Session data for replay
   */
  exportSessionData() {
    return {
      sessionId: this.sessionId,
      joinTime: this.stats.joinTime,
      leaveTime: Date.now(),
      finalState: this.gameState,
      players: Array.from(this.players.entries()),
      chatHistory: this.chatHistory,
      stats: this.getStats(),
    };
  }

  /**
   * Dispose spectator manager
   */
  dispose() {
    if (this.isSpectating) {
      this.leaveSpectatorMode();
    }
    this.cleanup();
    logger.info('SpectatorManager disposed');
  }
}
