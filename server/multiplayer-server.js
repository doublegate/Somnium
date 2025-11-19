/**
 * Somnium Multiplayer Server
 * WebSocket server for real-time multiplayer sessions
 *
 * Usage: node server/multiplayer-server.js
 */

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

class MultiplayerServer {
  constructor() {
    this.server = http.createServer();
    this.wss = new WebSocket.Server({ server: this.server });

    // Session management
    this.sessions = new Map(); // sessionId -> Session
    this.clients = new Map();  // ws -> Client

    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws) => {
      console.log('[Server] New connection');

      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('[Server] Message parsing error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('[Server] WebSocket error:', error);
      });
    });

    console.log(`[Server] WebSocket server initialized on port ${PORT}`);
  }

  handleMessage(ws, message) {
    const { type } = message;

    switch (type) {
      case 'handshake':
        this.handleHandshake(ws, message);
        break;

      case 'create_session':
        this.handleCreateSession(ws, message);
        break;

      case 'join_session':
        this.handleJoinSession(ws, message);
        break;

      case 'leave_session':
        this.handleLeaveSession(ws, message);
        break;

      case 'player_action':
        this.handlePlayerAction(ws, message);
        break;

      case 'state_sync':
        this.handleStateSync(ws, message);
        break;

      case 'chat':
        this.handleChat(ws, message);
        break;

      case 'heartbeat':
        this.send(ws, { type: 'heartbeat_response' });
        break;

      default:
        console.warn('[Server] Unknown message type:', type);
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  handleHandshake(ws, message) {
    const { playerName, version } = message;

    const playerId = this.generateId();

    const client = {
      ws,
      playerId,
      playerName,
      version,
      sessionId: null,
      connectedAt: Date.now(),
    };

    this.clients.set(ws, client);

    this.send(ws, {
      type: 'handshake_response',
      playerId,
      serverVersion: '2.0.0',
    });

    console.log(`[Server] Player connected: ${playerName} (${playerId})`);
  }

  handleCreateSession(ws, message) {
    const client = this.clients.get(ws);

    if (!client) {
      return this.sendError(ws, 'Not authenticated');
    }

    const { options } = message;
    const sessionId = this.generateId();

    const session = {
      id: sessionId,
      hostId: client.playerId,
      maxPlayers: options.maxPlayers || 4,
      mode: options.mode || 'coop',
      worldId: options.worldId || null,
      private: options.private || false,
      password: options.password || null,
      players: [
        {
          id: client.playerId,
          name: client.playerName,
          isHost: true,
          currentRoom: null,
          position: { x: 0, y: 0 },
        },
      ],
      state: {},
      createdAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    client.sessionId = sessionId;

    this.send(ws, {
      type: 'session_created',
      data: {
        sessionId,
        session: this.getPublicSession(session),
      },
    });

    console.log(`[Server] Session created: ${sessionId} by ${client.playerName}`);
  }

  handleJoinSession(ws, message) {
    const client = this.clients.get(ws);

    if (!client) {
      return this.sendError(ws, 'Not authenticated');
    }

    const { sessionId, password } = message;
    const session = this.sessions.get(sessionId);

    if (!session) {
      return this.send(ws, {
        type: 'session_join_failed',
        data: { reason: 'Session not found' },
      });
    }

    // Check password
    if (session.private && session.password !== password) {
      return this.send(ws, {
        type: 'session_join_failed',
        data: { reason: 'Invalid password' },
      });
    }

    // Check max players
    if (session.players.length >= session.maxPlayers) {
      return this.send(ws, {
        type: 'session_join_failed',
        data: { reason: 'Session is full' },
      });
    }

    // Add player to session
    const player = {
      id: client.playerId,
      name: client.playerName,
      isHost: false,
      currentRoom: null,
      position: { x: 0, y: 0 },
    };

    session.players.push(player);
    client.sessionId = sessionId;

    // Notify joining player
    this.send(ws, {
      type: 'session_joined',
      data: {
        sessionId,
        players: session.players,
      },
    });

    // Notify other players
    this.broadcastToSession(sessionId, {
      type: 'player_joined',
      data: { player },
    }, client.playerId);

    console.log(`[Server] ${client.playerName} joined session ${sessionId}`);
  }

  handleLeaveSession(ws, message) {
    const client = this.clients.get(ws);

    if (!client || !client.sessionId) {
      return;
    }

    this.removePlayerFromSession(client);
  }

  handlePlayerAction(ws, message) {
    const client = this.clients.get(ws);

    if (!client || !client.sessionId) {
      return this.sendError(ws, 'Not in a session');
    }

    const { sessionId, action, timestamp } = message;

    // Broadcast action to all players in session
    this.broadcastToSession(sessionId, {
      type: 'player_action',
      data: {
        playerId: client.playerId,
        action,
        timestamp,
      },
    }, client.playerId);
  }

  handleStateSync(ws, message) {
    const client = this.clients.get(ws);

    if (!client || !client.sessionId) {
      return;
    }

    const { sessionId, state, timestamp } = message;
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    // Update session state
    session.state = { ...session.state, ...state };

    // Broadcast state to all players
    this.broadcastToSession(sessionId, {
      type: 'state_sync',
      data: {
        playerId: client.playerId,
        state,
        timestamp,
      },
    }, client.playerId);
  }

  handleChat(ws, message) {
    const client = this.clients.get(ws);

    if (!client || !client.sessionId) {
      return;
    }

    const { sessionId, message: chatMessage, timestamp } = message;

    // Broadcast chat to all players
    this.broadcastToSession(sessionId, {
      type: 'chat',
      data: {
        playerId: client.playerId,
        message: chatMessage,
        timestamp,
      },
    }, client.playerId);

    console.log(`[Server] [${sessionId}] ${client.playerName}: ${chatMessage}`);
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);

    if (!client) {
      return;
    }

    console.log(`[Server] Player disconnected: ${client.playerName}`);

    if (client.sessionId) {
      this.removePlayerFromSession(client);
    }

    this.clients.delete(ws);
  }

  removePlayerFromSession(client) {
    const session = this.sessions.get(client.sessionId);

    if (!session) {
      return;
    }

    // Remove player
    session.players = session.players.filter(p => p.id !== client.playerId);

    // Notify remaining players
    this.broadcastToSession(client.sessionId, {
      type: 'player_left',
      data: {
        playerId: client.playerId,
        playerName: client.playerName,
      },
    });

    // If host left, assign new host or delete session
    if (session.hostId === client.playerId) {
      if (session.players.length > 0) {
        session.players[0].isHost = true;
        session.hostId = session.players[0].id;
        console.log(`[Server] New host for session ${client.sessionId}: ${session.players[0].name}`);
      } else {
        // Delete empty session
        this.sessions.delete(client.sessionId);
        console.log(`[Server] Session deleted: ${client.sessionId}`);
      }
    }

    client.sessionId = null;
  }

  broadcastToSession(sessionId, message, excludePlayerId = null) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    for (const [ws, client] of this.clients.entries()) {
      if (client.sessionId === sessionId && client.playerId !== excludePlayerId) {
        this.send(ws, message);
      }
    }
  }

  send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, error) {
    this.send(ws, {
      type: 'error',
      error,
    });
  }

  getPublicSession(session) {
    return {
      id: session.id,
      maxPlayers: session.maxPlayers,
      mode: session.mode,
      worldId: session.worldId,
      playerCount: session.players.length,
      hasPassword: !!session.password,
    };
  }

  generateId() {
    return crypto.randomBytes(16).toString('hex');
  }

  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('[Server] Terminating inactive connection');
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, HEARTBEAT_INTERVAL);

    console.log('[Server] Heartbeat started');
  }

  start() {
    this.server.listen(PORT, () => {
      console.log(`[Server] Somnium Multiplayer Server listening on port ${PORT}`);
      console.log(`[Server] WebSocket URL: ws://localhost:${PORT}`);
    });
  }

  // Admin/stats endpoints
  getStats() {
    return {
      clients: this.clients.size,
      sessions: this.sessions.size,
      activePlayers: Array.from(this.clients.values()).filter(c => c.sessionId).length,
    };
  }
}

// Start server
const server = new MultiplayerServer();
server.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  server.wss.close(() => {
    process.exit(0);
  });
});

// Stats logging
setInterval(() => {
  const stats = server.getStats();
  console.log(`[Server] Stats - Clients: ${stats.clients}, Sessions: ${stats.sessions}, Active: ${stats.activePlayers}`);
}, 60000); // Every minute

module.exports = MultiplayerServer;
