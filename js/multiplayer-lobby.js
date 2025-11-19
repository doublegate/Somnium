/**
 * Multiplayer Lobby UI Controller
 * Connects the lobby interface to MultiplayerManager
 */

import { MultiplayerManager } from './MultiplayerManager.js';

class MultiplayerLobby {
  constructor() {
    this.multiplayerManager = null;
    this.currentSessionId = null;
    this.playerName = '';
    this.sessions = [];

    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    // Screens
    this.connectionScreen = document.getElementById('connection-screen');
    this.lobbyScreen = document.getElementById('lobby-screen');

    // Connection
    this.playerNameInput = document.getElementById('player-name');
    this.serverUrlInput = document.getElementById('server-url');
    this.connectBtn = document.getElementById('connect-btn');
    this.connectionStatus = document.getElementById('connection-status');

    // Lobby
    this.currentPlayerName = document.getElementById('current-player-name');
    this.disconnectBtn = document.getElementById('disconnect-btn');
    this.sessionsList = document.getElementById('sessions-list');
    this.currentSessionSection = document.getElementById('current-session');

    // Session actions
    this.createSessionBtn = document.getElementById('create-session-btn');
    this.refreshSessionsBtn = document.getElementById('refresh-sessions-btn');
    this.leaveSessionBtn = document.getElementById('leave-session-btn');
    this.startGameBtn = document.getElementById('start-game-btn');

    // Session info
    this.sessionIdSpan = document.getElementById('session-id');
    this.sessionModeSpan = document.getElementById('session-mode');
    this.sessionWorldSpan = document.getElementById('session-world');
    this.playerCountSpan = document.getElementById('player-count');
    this.maxPlayersSpan = document.getElementById('max-players');
    this.playersList = document.getElementById('players-list');

    // Chat
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendChatBtn = document.getElementById('send-chat-btn');

    // Modals
    this.createSessionModal = document.getElementById('create-session-modal');
    this.joinSessionModal = document.getElementById('join-session-modal');
  }

  setupEventListeners() {
    // Connection
    this.connectBtn.addEventListener('click', () => this.connect());
    this.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.connect();
    });

    // Lobby
    this.disconnectBtn.addEventListener('click', () => this.disconnect());
    this.createSessionBtn.addEventListener('click', () => this.showCreateSessionModal());
    this.refreshSessionsBtn.addEventListener('click', () => this.refreshSessions());
    this.leaveSessionBtn.addEventListener('click', () => this.leaveSession());
    this.startGameBtn.addEventListener('click', () => this.startGame());

    // Chat
    this.sendChatBtn.addEventListener('click', () => this.sendChat());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendChat();
    });

    // Create session modal
    document.getElementById('confirm-create-btn').addEventListener('click', () => this.createSession());
    document.getElementById('cancel-create-btn').addEventListener('click', () => this.hideCreateSessionModal());
    document.getElementById('private-session-input').addEventListener('change', (e) => {
      document.getElementById('password-group').style.display = e.target.checked ? 'block' : 'none';
    });

    // Join session modal
    document.getElementById('confirm-join-btn').addEventListener('click', () => this.joinSession());
    document.getElementById('cancel-join-btn').addEventListener('click', () => this.hideJoinSessionModal());
  }

  async connect() {
    const playerName = this.playerNameInput.value.trim();
    const serverUrl = this.serverUrlInput.value.trim();

    if (!playerName) {
      this.showConnectionStatus('Please enter your name', 'error');
      return;
    }

    this.playerName = playerName;
    this.showConnectionStatus('Connecting...', 'warning');

    try {
      this.multiplayerManager = new MultiplayerManager(null, { serverUrl });
      await this.multiplayerManager.connect(playerName);

      this.setupMultiplayerListeners();
      this.showLobbyScreen();
      this.showConnectionStatus('Connected!', 'success');
    } catch (error) {
      console.error('Connection error:', error);
      this.showConnectionStatus(`Connection failed: ${error.message}`, 'error');
    }
  }

  setupMultiplayerListeners() {
    this.multiplayerManager.on('disconnected', () => {
      alert('Disconnected from server');
      this.showConnectionScreen();
    });

    this.multiplayerManager.on('session_created', (data) => {
      this.currentSessionId = data.sessionId;
      this.showCurrentSession();
      this.addChatMessage('System', 'Session created successfully', true);
    });

    this.multiplayerManager.on('session_joined', (data) => {
      this.currentSessionId = data.sessionId;
      this.showCurrentSession();
      this.updatePlayersList(data.players);
      this.addChatMessage('System', 'Joined session successfully', true);
    });

    this.multiplayerManager.on('player_joined', (player) => {
      this.addChatMessage('System', `${player.name} joined the session`, true);
      this.refreshCurrentSession();
    });

    this.multiplayerManager.on('player_left', ({ playerName }) => {
      this.addChatMessage('System', `${playerName} left the session`, true);
      this.refreshCurrentSession();
    });

    this.multiplayerManager.on('chat', ({ player, message }) => {
      this.addChatMessage(player ? player.name : 'Unknown', message);
    });
  }

  showConnectionScreen() {
    this.connectionScreen.classList.add('active');
    this.lobbyScreen.classList.remove('active');
  }

  showLobbyScreen() {
    this.connectionScreen.classList.remove('active');
    this.lobbyScreen.classList.add('active');
    this.currentPlayerName.textContent = this.playerName;
    this.refreshSessions();
  }

  disconnect() {
    if (this.multiplayerManager) {
      this.multiplayerManager.disconnect();
    }
    this.showConnectionScreen();
  }

  showConnectionStatus(message, type) {
    this.connectionStatus.textContent = message;
    this.connectionStatus.className = `status-message ${type}`;
  }

  showCreateSessionModal() {
    this.createSessionModal.classList.remove('hidden');
  }

  hideCreateSessionModal() {
    this.createSessionModal.classList.add('hidden');
  }

  async createSession() {
    const maxPlayers = parseInt(document.getElementById('max-players-input').value);
    const mode = document.getElementById('mode-input').value;
    const worldId = document.getElementById('world-input').value;
    const isPrivate = document.getElementById('private-session-input').checked;
    const password = isPrivate ? document.getElementById('password-input').value : null;

    try {
      await this.multiplayerManager.createSession({
        maxPlayers,
        mode,
        worldId,
        private: isPrivate,
        password,
      });

      this.hideCreateSessionModal();
    } catch (error) {
      console.error('Create session error:', error);
      alert('Failed to create session');
    }
  }

  showJoinSessionModal(sessionId, hasPassword) {
    document.getElementById('join-session-id').value = sessionId;
    document.getElementById('join-password-group').style.display = hasPassword ? 'block' : 'none';
    this.joinSessionModal.classList.remove('hidden');
  }

  hideJoinSessionModal() {
    this.joinSessionModal.classList.add('hidden');
  }

  async joinSession() {
    const sessionId = document.getElementById('join-session-id').value;
    const password = document.getElementById('join-password-input').value || null;

    try {
      await this.multiplayerManager.joinSession(sessionId, password);
      this.hideJoinSessionModal();
    } catch (error) {
      console.error('Join session error:', error);
      alert('Failed to join session: ' + error.message);
    }
  }

  leaveSession() {
    if (this.multiplayerManager) {
      this.multiplayerManager.leaveSession();
    }

    this.currentSessionId = null;
    this.hideCurrentSession();
    this.addChatMessage('System', 'Left the session', true);
  }

  showCurrentSession() {
    this.currentSessionSection.classList.remove('hidden');
    this.refreshCurrentSession();
  }

  hideCurrentSession() {
    this.currentSessionSection.classList.add('hidden');
  }

  refreshCurrentSession() {
    if (!this.currentSessionId) return;

    const status = this.multiplayerManager.getStatus();
    const players = this.multiplayerManager.getPlayers();

    this.sessionIdSpan.textContent = this.currentSessionId;
    this.playerCountSpan.textContent = players.length;

    this.updatePlayersList(players);
  }

  updatePlayersList(players) {
    this.playersList.innerHTML = '';

    players.forEach((player) => {
      const card = document.createElement('div');
      card.className = 'player-card';

      const avatar = document.createElement('div');
      avatar.className = 'player-avatar';
      avatar.textContent = player.name.charAt(0).toUpperCase();

      const name = document.createElement('div');
      name.className = 'player-name';
      name.textContent = player.name;

      card.appendChild(avatar);
      card.appendChild(name);

      if (player.isHost) {
        const badge = document.createElement('span');
        badge.className = 'player-badge host';
        badge.textContent = 'Host';
        card.appendChild(badge);
      }

      this.playersList.appendChild(card);
    });
  }

  refreshSessions() {
    // In a real implementation, fetch active sessions from server
    // For now, show placeholder
    this.sessionsList.innerHTML = '<p class="no-sessions">No active sessions. Create one to get started!</p>';
  }

  startGame() {
    // Redirect to main game with multiplayer mode
    window.location.href = `index.html?multiplayer=true&session=${this.currentSessionId}`;
  }

  sendChat() {
    const message = this.chatInput.value.trim();

    if (!message) return;

    if (this.multiplayerManager && this.currentSessionId) {
      this.multiplayerManager.sendChat(message);
      this.addChatMessage(this.playerName, message);
    }

    this.chatInput.value = '';
  }

  addChatMessage(playerName, message, isSystem = false) {
    const messageEl = document.createElement('div');
    messageEl.className = isSystem ? 'chat-message system' : 'chat-message';

    if (!isSystem) {
      const header = document.createElement('div');
      header.className = 'chat-message-header';

      const player = document.createElement('span');
      player.className = 'chat-message-player';
      player.textContent = playerName;

      const time = document.createElement('span');
      time.className = 'chat-message-time';
      time.textContent = new Date().toLocaleTimeString();

      header.appendChild(player);
      header.appendChild(time);
      messageEl.appendChild(header);
    }

    const text = document.createElement('div');
    text.className = 'chat-message-text';
    text.textContent = message;
    messageEl.appendChild(text);

    this.chatMessages.appendChild(messageEl);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
}

// Initialize lobby when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.multiplayerLobby = new MultiplayerLobby();
});

export default MultiplayerLobby;
