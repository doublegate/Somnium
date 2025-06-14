/**
 * MovementSystem - Enhanced movement and navigation system
 *
 * Responsibilities:
 * - Room navigation with pathfinding
 * - Blocked/conditional exit handling
 * - Movement animations for player and NPCs
 * - Auto-navigation for multi-room paths
 * - Collision detection
 */

export class MovementSystem {
  constructor(gameState, viewManager, eventManager) {
    this.gameState = gameState;
    this.viewManager = viewManager;
    this.eventManager = eventManager;

    // Movement configuration
    this.walkSpeed = 2; // pixels per frame at 60 FPS
    this.runSpeed = 4;

    // Current movement state
    this.playerMoving = false;
    this.playerTarget = null;
    this.playerPath = [];

    // NPC movement tracking
    this.npcMovements = new Map(); // npcId -> movement data

    // Movement animations
    this.directions = {
      north: { dx: 0, dy: -1, loop: 'walk_up' },
      south: { dx: 0, dy: 1, loop: 'walk_down' },
      east: { dx: 1, dy: 0, loop: 'walk_right' },
      west: { dx: -1, dy: 0, loop: 'walk_left' },
      northeast: { dx: 1, dy: -1, loop: 'walk_right' },
      northwest: { dx: -1, dy: -1, loop: 'walk_left' },
      southeast: { dx: 1, dy: 1, loop: 'walk_right' },
      southwest: { dx: -1, dy: 1, loop: 'walk_left' },
    };
  }

  /**
   * Check if player can move to a room
   * @param {string} fromRoomId - Current room
   * @param {string} direction - Direction to move
   * @returns {Object} {canMove: boolean, reason: string, targetRoomId: string}
   */
  canMove(fromRoomId, direction) {
    const room = this.gameState.getRoom(fromRoomId);
    if (!room || !room.exits || !room.exits[direction]) {
      return { canMove: false, reason: "You can't go that way." };
    }

    const targetRoomId = room.exits[direction];

    // Check if exit is blocked
    const exitState = this.gameState.getExitState(fromRoomId, direction);
    if (exitState) {
      // Check locked state
      if (exitState.locked) {
        return {
          canMove: false,
          reason: exitState.lockedMessage || 'That way is locked.',
          needsKey: exitState.keyId,
        };
      }

      // Check conditional exit
      if (exitState.condition) {
        const conditionMet = this.eventManager.checkCondition(
          exitState.condition
        );
        if (!conditionMet) {
          return {
            canMove: false,
            reason: exitState.blockedMessage || "You can't go that way yet.",
            condition: exitState.condition,
          };
        }
      }

      // Check if exit requires an item
      if (exitState.requiresItem) {
        if (!this.gameState.hasItem(exitState.requiresItem)) {
          return {
            canMove: false,
            reason:
              exitState.itemMessage || 'You need something to go that way.',
            needsItem: exitState.requiresItem,
          };
        }
      }
    }

    // Check if target room exists
    const targetRoom = this.gameState.getRoom(targetRoomId);
    if (!targetRoom) {
      return { canMove: false, reason: "That area isn't accessible." };
    }

    // Check room entry conditions
    if (targetRoom.entryCondition) {
      const canEnter = this.eventManager.checkCondition(
        targetRoom.entryCondition
      );
      if (!canEnter) {
        return {
          canMove: false,
          reason:
            targetRoom.entryBlockedMessage || "You can't enter there yet.",
          condition: targetRoom.entryCondition,
        };
      }
    }

    return { canMove: true, targetRoomId };
  }

  /**
   * Move player to adjacent room
   * @param {string} direction - Direction to move
   * @returns {Object} Result of movement attempt
   */
  async movePlayer(direction) {
    const currentRoomId = this.gameState.currentRoomId;
    const moveCheck = this.canMove(currentRoomId, direction);

    if (!moveCheck.canMove) {
      // Trigger blocked exit event
      await this.eventManager.triggerEvent('blockedExit', {
        room: currentRoomId,
        direction,
        reason: moveCheck.reason,
        needsKey: moveCheck.needsKey,
        needsItem: moveCheck.needsItem,
      });

      return {
        success: false,
        message: moveCheck.reason,
        blocked: true,
      };
    }

    // Animate player walking to exit
    await this.animatePlayerToExit(direction);

    // Change room
    const oldRoom = currentRoomId;
    this.gameState.setCurrentRoom(moveCheck.targetRoomId);

    // Trigger room exit event
    await this.eventManager.triggerEvent('exitRoom', {
      from: oldRoom,
      to: moveCheck.targetRoomId,
      direction,
    });

    // Position player at entrance of new room
    this.positionPlayerAtEntrance(this.getOppositeDirection(direction));

    // Trigger room entry event
    await this.eventManager.triggerEvent('enterRoom', {
      room: moveCheck.targetRoomId,
      from: oldRoom,
      direction,
    });

    return {
      success: true,
      newRoom: moveCheck.targetRoomId,
    };
  }

  /**
   * Find path between rooms
   * @param {string} fromRoomId - Starting room
   * @param {string} toRoomId - Target room
   * @returns {Array} Path of room IDs, or null if no path
   */
  findRoomPath(fromRoomId, toRoomId) {
    if (fromRoomId === toRoomId) return [fromRoomId];

    // BFS to find shortest path
    const queue = [[fromRoomId]];
    const visited = new Set([fromRoomId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const currentRoom = path[path.length - 1];
      const room = this.gameState.getRoom(currentRoom);

      if (!room || !room.exits) continue;

      for (const [direction, nextRoomId] of Object.entries(room.exits)) {
        if (visited.has(nextRoomId)) continue;

        // Check if we can actually move this way
        const moveCheck = this.canMove(currentRoom, direction);
        if (!moveCheck.canMove) continue;

        const newPath = [...path, nextRoomId];

        if (nextRoomId === toRoomId) {
          return newPath;
        }

        visited.add(nextRoomId);
        queue.push(newPath);
      }
    }

    return null; // No path found
  }

  /**
   * Auto-navigate player through multiple rooms
   * @param {string} targetRoomId - Destination room
   * @returns {Object} Result of navigation
   */
  async autoNavigate(targetRoomId) {
    const currentRoom = this.gameState.currentRoomId;
    const path = this.findRoomPath(currentRoom, targetRoomId);

    if (!path) {
      return {
        success: false,
        message: "You can't get there from here.",
      };
    }

    if (path.length === 1) {
      return {
        success: true,
        message: "You're already there.",
      };
    }

    // Navigate through each room
    for (let i = 0; i < path.length - 1; i++) {
      const fromRoom = path[i];
      const toRoom = path[i + 1];

      // Find direction to next room
      const room = this.gameState.getRoom(fromRoom);
      let direction = null;

      for (const [dir, roomId] of Object.entries(room.exits)) {
        if (roomId === toRoom) {
          direction = dir;
          break;
        }
      }

      if (!direction) {
        return {
          success: false,
          message: 'Navigation error - path broken.',
        };
      }

      // Move to next room
      const result = await this.movePlayer(direction);
      if (!result.success) {
        return {
          success: false,
          message: `Blocked at ${room.name}: ${result.message}`,
          stoppedAt: fromRoom,
        };
      }

      // Brief pause between rooms
      await this.delay(500);
    }

    return {
      success: true,
      message: `You arrive at ${this.gameState.getCurrentRoom().name}.`,
    };
  }

  /**
   * Move player within current room
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   */
  movePlayerTo(x, y) {
    const player = this.viewManager.getView('player');
    if (!player) return;

    // Set target and calculate path
    this.playerTarget = { x, y };
    this.playerMoving = true;

    // Simple direct path for now
    this.playerPath = [{ x, y }];

    // Start walking animation
    const direction = this.getDirectionTo(player.x, player.y, x, y);
    if (direction && this.directions[direction]) {
      player.setLoop(this.directions[direction].loop);
    }
  }

  /**
   * Update player movement
   * @param {number} deltaTime - Time since last update
   */
  updatePlayerMovement(deltaTime) {
    if (!this.playerMoving || !this.playerTarget) return;

    const player = this.viewManager.getView('player');
    if (!player) return;

    const speed = this.walkSpeed * (deltaTime / 16.67); // Adjust for frame rate

    // Move towards target
    const dx = this.playerTarget.x - player.x;
    const dy = this.playerTarget.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= speed) {
      // Reached target
      player.moveTo(this.playerTarget.x, this.playerTarget.y);
      this.playerMoving = false;
      this.playerTarget = null;
      player.setLoop('idle');

      // Trigger arrival event
      this.eventManager.triggerEvent('playerArrived', {
        x: player.x,
        y: player.y,
      });
    } else {
      // Move towards target
      const moveX = (dx / distance) * speed;
      const moveY = (dy / distance) * speed;

      // Check for obstacles
      const newX = player.x + moveX;
      const newY = player.y + moveY;

      if (this.canWalkTo(newX, newY)) {
        player.moveTo(newX, newY);
      } else {
        // Stop if blocked
        this.playerMoving = false;
        this.playerTarget = null;
        player.setLoop('idle');
      }
    }
  }

  /**
   * Set up NPC movement pattern
   * @param {string} npcId - NPC identifier
   * @param {Object} pattern - Movement pattern definition
   */
  setNPCMovement(npcId, pattern) {
    this.npcMovements.set(npcId, {
      pattern,
      currentIndex: 0,
      waitTime: 0,
      moving: false,
    });
  }

  /**
   * Update all NPC movements
   * @param {number} deltaTime - Time since last update
   */
  updateNPCMovements(deltaTime) {
    for (const [npcId, movement] of this.npcMovements) {
      const npc = this.viewManager.getView(npcId);
      if (!npc) continue;

      // Handle wait time
      if (movement.waitTime > 0) {
        movement.waitTime -= deltaTime;
        continue;
      }

      // Get current pattern step
      const pattern = movement.pattern;
      if (!pattern || !pattern.steps || pattern.steps.length === 0) continue;

      const step = pattern.steps[movement.currentIndex];

      // Execute step
      switch (step.type) {
        case 'move':
          this.moveNPCTo(npc, step.x, step.y, deltaTime);
          break;

        case 'wait':
          movement.waitTime = step.duration || 1000;
          break;

        case 'loop':
          movement.currentIndex = -1; // Will increment to 0
          break;

        case 'random':
          this.moveNPCRandom(npc, step.radius || 50);
          break;
      }

      // Check if step complete
      if (!movement.moving && movement.waitTime <= 0) {
        movement.currentIndex =
          (movement.currentIndex + 1) % pattern.steps.length;
      }
    }
  }

  /**
   * Move NPC to specific position
   * @private
   */
  moveNPCTo(npc, targetX, targetY, deltaTime) {
    const movement = this.npcMovements.get(npc.id);
    const speed = this.walkSpeed * (deltaTime / 16.67);

    const dx = targetX - npc.x;
    const dy = targetY - npc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= speed) {
      // Reached target
      npc.moveTo(targetX, targetY);
      npc.setLoop('idle');
      movement.moving = false;
    } else {
      // Move towards target
      movement.moving = true;

      const moveX = (dx / distance) * speed;
      const moveY = (dy / distance) * speed;

      if (this.canWalkTo(npc.x + moveX, npc.y + moveY)) {
        npc.moveTo(npc.x + moveX, npc.y + moveY);

        // Set appropriate animation
        const direction = this.getDirectionTo(npc.x, npc.y, targetX, targetY);
        if (direction && this.directions[direction]) {
          npc.setLoop(this.directions[direction].loop);
        }
      } else {
        // Skip this step if blocked
        movement.moving = false;
      }
    }
  }

  /**
   * Move NPC randomly within radius
   * @private
   */
  moveNPCRandom(npc, radius) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;

    const targetX = npc.x + Math.cos(angle) * distance;
    const targetY = npc.y + Math.sin(angle) * distance;

    // Clamp to room bounds
    const clampedX = Math.max(10, Math.min(310, targetX));
    const clampedY = Math.max(40, Math.min(190, targetY));

    const movement = this.npcMovements.get(npc.id);
    movement.targetX = clampedX;
    movement.targetY = clampedY;
    movement.moving = true;
  }

  /**
   * Check if position is walkable
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if walkable
   */
  canWalkTo(x, y) {
    // Check room bounds
    if (x < 10 || x > 310 || y < 40 || y > 190) {
      return false;
    }

    // Check collision map if available
    const room = this.gameState.getCurrentRoom();
    if (room.collisionMap) {
      // Simple grid-based collision
      const gridX = Math.floor(x / 10);
      const gridY = Math.floor((y - 40) / 10);

      if (room.collisionMap[gridY] && room.collisionMap[gridY][gridX]) {
        return false;
      }
    }

    // Check object collisions
    const objects = room.objects || [];
    for (const objId of objects) {
      const obj = this.gameState.getObject(objId);
      if (obj && obj.blocking && obj.bounds) {
        if (
          x >= obj.bounds.x &&
          x <= obj.bounds.x + obj.bounds.width &&
          y >= obj.bounds.y &&
          y <= obj.bounds.y + obj.bounds.height
        ) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Animate player walking to room exit
   * @private
   */
  async animatePlayerToExit(direction) {
    const exitPositions = {
      north: { x: 160, y: 40 },
      south: { x: 160, y: 190 },
      east: { x: 310, y: 115 },
      west: { x: 10, y: 115 },
      northeast: { x: 285, y: 40 },
      northwest: { x: 35, y: 40 },
      southeast: { x: 285, y: 190 },
      southwest: { x: 35, y: 190 },
    };

    const target = exitPositions[direction];
    if (!target) return;

    return new Promise((resolve) => {
      this.movePlayerTo(target.x, target.y);

      // Poll for completion
      const checkInterval = setInterval(() => {
        if (!this.playerMoving) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      // Timeout after 3 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        this.playerMoving = false;
        resolve();
      }, 3000);
    });
  }

  /**
   * Position player at room entrance
   * @private
   */
  positionPlayerAtEntrance(fromDirection) {
    const entrancePositions = {
      north: { x: 160, y: 180 },
      south: { x: 160, y: 50 },
      east: { x: 20, y: 115 },
      west: { x: 300, y: 115 },
      northeast: { x: 35, y: 180 },
      northwest: { x: 285, y: 180 },
      southeast: { x: 35, y: 50 },
      southwest: { x: 285, y: 50 },
    };

    const position = entrancePositions[fromDirection] || { x: 160, y: 115 };
    const player = this.viewManager.getView('player');

    if (player) {
      player.moveTo(position.x, position.y);
      player.setLoop('idle');
    }
  }

  /**
   * Get direction from one point to another
   * @private
   */
  getDirectionTo(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;

    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return null;

    const angle = Math.atan2(dy, dx);
    const octant = Math.round((8 * angle) / (2 * Math.PI) + 8) % 8;

    const directions = [
      'east',
      'southeast',
      'south',
      'southwest',
      'west',
      'northwest',
      'north',
      'northeast',
    ];

    return directions[octant];
  }

  /**
   * Get opposite direction
   * @private
   */
  getOppositeDirection(direction) {
    const opposites = {
      north: 'south',
      south: 'north',
      east: 'west',
      west: 'east',
      northeast: 'southwest',
      northwest: 'southeast',
      southeast: 'northwest',
      southwest: 'northeast',
      up: 'down',
      down: 'up',
      in: 'out',
      out: 'in',
    };

    return opposites[direction] || 'south';
  }

  /**
   * Utility delay function
   * @private
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update all movements
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    this.updatePlayerMovement(deltaTime);
    this.updateNPCMovements(deltaTime);
  }
}
