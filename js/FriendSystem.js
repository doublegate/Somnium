/**
 * FriendSystem - Friend management and messaging
 *
 * Features:
 * - Friend requests (send, accept, reject)
 * - Friend list management
 * - Direct messaging between friends
 * - Online/offline status tracking
 * - Message history and persistence
 * - Typing indicators
 * - Read receipts
 * - Message notifications
 * - Block/unblock functionality
 */

import { logger } from './logger.js';

export class FriendSystem {
  constructor(apiClient, gameState, eventManager) {
    this.apiClient = apiClient;
    this.gameState = gameState;
    this.eventManager = eventManager;

    // Friend data
    this.friends = new Map(); // friendId -> friend data
    this.friendRequests = new Map(); // requestId -> request data
    this.blockedUsers = new Set();

    // Messaging
    this.conversations = new Map(); // friendId -> messages[]
    this.unreadCounts = new Map(); // friendId -> count
    this.typingIndicators = new Map(); // friendId -> timestamp

    // Online status
    this.onlineStatus = new Map(); // friendId -> status
    this.lastSeen = new Map(); // friendId -> timestamp

    // Current user
    this.currentUser = null;

    // Statistics
    this.stats = {
      friendsAdded: 0,
      requestsSent: 0,
      messagesReceived: 0,
      messagesSent: 0,
    };

    // WebSocket connection for real-time updates
    this.ws = null;
    this.wsReconnectAttempts = 0;
  }

  /**
   * Initialize friend system
   * @param {Object} user - Current user data
   */
  async initialize(user) {
    this.currentUser = user;

    // Load friends list
    await this.loadFriends();

    // Load pending requests
    await this.loadFriendRequests();

    // Connect to WebSocket for real-time updates
    this.connectWebSocket();

    logger.info('Friend system initialized');
  }

  /**
   * Connect to WebSocket for real-time messaging
   */
  connectWebSocket() {
    if (this.ws) return;

    const wsUrl = `ws://localhost:8080/friends?userId=${this.currentUser.id}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        logger.info('WebSocket connected for friend system');
        this.wsReconnectAttempts = 0;

        // Send online status
        this.sendStatus('online');
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };

      this.ws.onclose = () => {
        logger.warn('WebSocket disconnected');
        this.ws = null;

        // Attempt reconnect
        if (this.wsReconnectAttempts < 5) {
          setTimeout(() => {
            this.wsReconnectAttempts++;
            this.connectWebSocket();
          }, 2000 * Math.pow(2, this.wsReconnectAttempts));
        }
      };

      this.ws.onerror = (error) => {
        logger.error('WebSocket error:', error);
      };
    } catch (error) {
      logger.error('Failed to connect WebSocket:', error);
    }
  }

  /**
   * Handle WebSocket messages
   * @param {Object} data - Message data
   */
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'message':
        this.receiveMessage(data.from, data.message);
        break;

      case 'typing':
        this.typingIndicators.set(data.from, Date.now());
        this.eventManager.triggerEvent('friendTyping', { friendId: data.from });
        break;

      case 'status':
        this.onlineStatus.set(data.userId, data.status);
        if (data.status === 'offline') {
          this.lastSeen.set(data.userId, data.timestamp);
        }
        this.eventManager.triggerEvent('friendStatusChange', {
          friendId: data.userId,
          status: data.status,
        });
        break;

      case 'friend_request':
        this.receiveFriendRequest(data.request);
        break;

      case 'friend_accepted':
        this.handleFriendAccepted(data.friendId);
        break;
    }
  }

  /**
   * Send friend request
   * @param {string} username - Username to send request to
   * @returns {Promise<Object>} Request result
   */
  async sendFriendRequest(username) {
    try {
      const response = await this.apiClient.post('/api/friends/request', {
        from: this.currentUser.id,
        toUsername: username,
      });

      if (response.success) {
        this.stats.requestsSent++;

        logger.info(`Friend request sent to ${username}`);

        this.eventManager.triggerEvent('friendRequestSent', { username });

        return { success: true, requestId: response.requestId };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Failed to send friend request:', error);
      return { success: false, message: 'Failed to send request' };
    }
  }

  /**
   * Accept friend request
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} Accept result
   */
  async acceptFriendRequest(requestId) {
    try {
      const response = await this.apiClient.post(
        `/api/friends/request/${requestId}/accept`,
        { userId: this.currentUser.id }
      );

      if (response.success) {
        // Add to friends
        const friend = response.friend;
        this.friends.set(friend.id, friend);

        // Remove from requests
        this.friendRequests.delete(requestId);

        this.stats.friendsAdded++;

        logger.info(`Friend request accepted: ${friend.username}`);

        this.eventManager.triggerEvent('friendAdded', { friend });

        return { success: true, friend };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Failed to accept friend request:', error);
      return { success: false, message: 'Failed to accept request' };
    }
  }

  /**
   * Reject friend request
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} Reject result
   */
  async rejectFriendRequest(requestId) {
    try {
      const response = await this.apiClient.post(
        `/api/friends/request/${requestId}/reject`,
        { userId: this.currentUser.id }
      );

      if (response.success) {
        this.friendRequests.delete(requestId);

        logger.info('Friend request rejected');

        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error) {
      logger.error('Failed to reject friend request:', error);
      return { success: false, message: 'Failed to reject request' };
    }
  }

  /**
   * Send message to friend
   * @param {string} friendId - Friend ID
   * @param {string} message - Message content
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(friendId, message) {
    if (this.blockedUsers.has(friendId)) {
      return { success: false, message: 'Cannot send to blocked user' };
    }

    const friend = this.friends.get(friendId);
    if (!friend) {
      return { success: false, message: 'Not a friend' };
    }

    const messageData = {
      id: `msg_${Date.now()}_${Math.random()}`,
      from: this.currentUser.id,
      to: friendId,
      content: message,
      timestamp: Date.now(),
      read: false,
    };

    // Add to local conversation
    if (!this.conversations.has(friendId)) {
      this.conversations.set(friendId, []);
    }
    this.conversations.get(friendId).push(messageData);

    this.stats.messagesSent++;

    // Send via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'message',
          to: friendId,
          message: messageData,
        })
      );
    }

    // Also send via API for persistence
    try {
      await this.apiClient.post('/api/friends/messages', messageData);
    } catch (error) {
      logger.error('Failed to persist message:', error);
    }

    this.eventManager.triggerEvent('messageSent', { friendId, message: messageData });

    return { success: true, messageId: messageData.id };
  }

  /**
   * Receive message from friend
   * @param {string} friendId - Friend ID
   * @param {Object} messageData - Message data
   */
  receiveMessage(friendId, messageData) {
    if (!this.conversations.has(friendId)) {
      this.conversations.set(friendId, []);
    }

    this.conversations.get(friendId).push(messageData);

    // Increment unread count
    const currentUnread = this.unreadCounts.get(friendId) || 0;
    this.unreadCounts.set(friendId, currentUnread + 1);

    this.stats.messagesReceived++;

    logger.info(`Message received from ${friendId}`);

    this.eventManager.triggerEvent('messageReceived', {
      friendId,
      message: messageData,
    });

    // Send notification
    this.showMessageNotification(friendId, messageData);
  }

  /**
   * Mark messages as read
   * @param {string} friendId - Friend ID
   */
  markAsRead(friendId) {
    const conversation = this.conversations.get(friendId);
    if (conversation) {
      conversation.forEach((msg) => {
        if (msg.to === this.currentUser.id) {
          msg.read = true;
        }
      });
    }

    this.unreadCounts.set(friendId, 0);

    // Send read receipt
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'read_receipt',
          to: friendId,
        })
      );
    }
  }

  /**
   * Send typing indicator
   * @param {string} friendId - Friend ID
   */
  sendTypingIndicator(friendId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'typing',
          to: friendId,
        })
      );
    }
  }

  /**
   * Send status update
   * @param {string} status - Status (online, away, offline)
   */
  sendStatus(status) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'status',
          status,
          timestamp: Date.now(),
        })
      );
    }
  }

  /**
   * Block user
   * @param {string} userId - User ID to block
   */
  blockUser(userId) {
    this.blockedUsers.add(userId);
    this.friends.delete(userId);

    logger.info(`Blocked user: ${userId}`);

    this.eventManager.triggerEvent('userBlocked', { userId });
  }

  /**
   * Unblock user
   * @param {string} userId - User ID to unblock
   */
  unblockUser(userId) {
    this.blockedUsers.delete(userId);

    logger.info(`Unblocked user: ${userId}`);

    this.eventManager.triggerEvent('userUnblocked', { userId });
  }

  /**
   * Load friends list from server
   */
  async loadFriends() {
    try {
      const response = await this.apiClient.get(
        `/api/friends?userId=${this.currentUser.id}`
      );

      if (response.success) {
        response.friends.forEach((friend) => {
          this.friends.set(friend.id, friend);
        });

        logger.info(`Loaded ${this.friends.size} friends`);
      }
    } catch (error) {
      logger.error('Failed to load friends:', error);
    }
  }

  /**
   * Load friend requests from server
   */
  async loadFriendRequests() {
    try {
      const response = await this.apiClient.get(
        `/api/friends/requests?userId=${this.currentUser.id}`
      );

      if (response.success) {
        response.requests.forEach((request) => {
          this.friendRequests.set(request.id, request);
        });

        logger.info(`Loaded ${this.friendRequests.size} friend requests`);
      }
    } catch (error) {
      logger.error('Failed to load friend requests:', error);
    }
  }

  /**
   * Receive friend request notification
   * @param {Object} request - Request data
   */
  receiveFriendRequest(request) {
    this.friendRequests.set(request.id, request);

    this.eventManager.triggerEvent('friendRequestReceived', { request });

    logger.info(`Friend request received from ${request.fromUsername}`);
  }

  /**
   * Handle friend accepted notification
   * @param {string} friendId - Friend ID
   */
  async handleFriendAccepted(friendId) {
    // Load friend data
    try {
      const response = await this.apiClient.get(`/api/users/${friendId}`);

      if (response.success) {
        this.friends.set(friendId, response.user);

        this.eventManager.triggerEvent('friendAdded', { friend: response.user });

        logger.info(`Friend added: ${response.user.username}`);
      }
    } catch (error) {
      logger.error('Failed to load friend data:', error);
    }
  }

  /**
   * Show message notification
   * @param {string} friendId - Friend ID
   * @param {Object} messageData - Message data
   */
  showMessageNotification(friendId, messageData) {
    const friend = this.friends.get(friendId);
    if (!friend) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Message from ${friend.username}`, {
        body: messageData.content.substring(0, 100),
        icon: '/assets/icons/icon-192x192.png',
        tag: `friend-message-${friendId}`,
      });
    }
  }

  /**
   * Get conversation with friend
   * @param {string} friendId - Friend ID
   * @returns {Array} Message history
   */
  getConversation(friendId) {
    return this.conversations.get(friendId) || [];
  }

  /**
   * Get unread count for friend
   * @param {string} friendId - Friend ID
   * @returns {number} Unread count
   */
  getUnreadCount(friendId) {
    return this.unreadCounts.get(friendId) || 0;
  }

  /**
   * Get total unread count
   * @returns {number} Total unread
   */
  getTotalUnreadCount() {
    let total = 0;
    for (const count of this.unreadCounts.values()) {
      total += count;
    }
    return total;
  }

  /**
   * Get online status of friend
   * @param {string} friendId - Friend ID
   * @returns {string} Status
   */
  getStatus(friendId) {
    return this.onlineStatus.get(friendId) || 'offline';
  }

  /**
   * Check if user is typing
   * @param {string} friendId - Friend ID
   * @returns {boolean} True if typing
   */
  isTyping(friendId) {
    const lastTyping = this.typingIndicators.get(friendId);
    if (!lastTyping) return false;

    // Typing indicator expires after 3 seconds
    return Date.now() - lastTyping < 3000;
  }

  /**
   * Get friends list
   * @returns {Array} Friends
   */
  getFriends() {
    return Array.from(this.friends.values());
  }

  /**
   * Get friend requests
   * @returns {Array} Friend requests
   */
  getFriendRequests() {
    return Array.from(this.friendRequests.values());
  }

  /**
   * Get statistics
   * @returns {Object} Friend statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      friendCount: this.friends.size,
      pendingRequests: this.friendRequests.size,
      totalUnread: this.getTotalUnreadCount(),
      blockedUsers: this.blockedUsers.size,
    };
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.ws) {
      this.sendStatus('offline');
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Save state
   * @returns {Object} Save data
   */
  save() {
    return {
      friends: Array.from(this.friends.entries()),
      friendRequests: Array.from(this.friendRequests.entries()),
      blockedUsers: Array.from(this.blockedUsers),
      conversations: Array.from(this.conversations.entries()),
      unreadCounts: Array.from(this.unreadCounts.entries()),
      stats: { ...this.stats },
    };
  }

  /**
   * Load state
   * @param {Object} saveData - Save data
   */
  load(saveData) {
    this.friends = new Map(saveData.friends || []);
    this.friendRequests = new Map(saveData.friendRequests || []);
    this.blockedUsers = new Set(saveData.blockedUsers || []);
    this.conversations = new Map(saveData.conversations || []);
    this.unreadCounts = new Map(saveData.unreadCounts || []);
    this.stats = saveData.stats || this.stats;
  }
}
