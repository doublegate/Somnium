/**
 * WorldValidator - Validates game world data for consistency and playability
 *
 * Features:
 * - Room connectivity validation
 * - Item reference validation
 * - Puzzle solvability checks
 * - NPC placement validation
 * - Circular dependency detection
 * - Accessibility analysis
 * - Balance checks
 */

import { logger } from './logger.js';

export class WorldValidator {
  constructor() {
    // Validation rules
    this.rules = {
      minRooms: 3,
      maxRooms: 50,
      minItems: 5,
      minNPCs: 1,
      minPuzzles: 1,
      requireStartingRoom: true,
      requireWinCondition: true,
    };

    // Validation statistics
    this.stats = {
      worldsValidated: 0,
      errorsFound: 0,
      warningsFound: 0,
    };
  }

  /**
   * Validate complete world data
   * @param {Object} worldData - World JSON data
   * @returns {Object} Validation result
   */
  validate(worldData) {
    const errors = [];
    const warnings = [];

    logger.info('Validating world data...');

    // Basic structure validation
    if (!worldData.rooms || !Array.isArray(worldData.rooms)) {
      errors.push({
        type: 'missing_rooms',
        message: 'World must have rooms array',
        severity: 'error',
      });
      return { valid: false, errors, warnings };
    }

    // Room count validation
    if (worldData.rooms.length < this.rules.minRooms) {
      errors.push({
        type: 'insufficient_rooms',
        message: `World must have at least ${this.rules.minRooms} rooms`,
        severity: 'error',
      });
    }

    if (worldData.rooms.length > this.rules.maxRooms) {
      warnings.push({
        type: 'too_many_rooms',
        message: `World has ${worldData.rooms.length} rooms, may impact performance`,
        severity: 'warning',
      });
    }

    // Validate individual components
    this.validateRooms(worldData, errors, warnings);
    this.validateItems(worldData, errors, warnings);
    this.validateNPCs(worldData, errors, warnings);
    this.validatePuzzles(worldData, errors, warnings);

    // Graph analysis
    this.validateConnectivity(worldData, errors, warnings);
    this.validateAccessibility(worldData, errors, warnings);

    // Solvability validation
    this.validateSolvability(worldData, errors, warnings);

    // Balance checks
    this.validateBalance(worldData, errors, warnings);

    // Update statistics
    this.stats.worldsValidated++;
    this.stats.errorsFound += errors.length;
    this.stats.warningsFound += warnings.length;

    const valid = errors.length === 0;

    logger.info(
      `Validation complete: ${valid ? 'PASS' : 'FAIL'} (${errors.length} errors, ${warnings.length} warnings)`
    );

    return {
      valid,
      errors,
      warnings,
      stats: {
        roomCount: worldData.rooms?.length || 0,
        itemCount: worldData.items?.length || 0,
        npcCount: worldData.npcs?.length || 0,
        puzzleCount: worldData.puzzles?.length || 0,
      },
    };
  }

  /**
   * Validate rooms
   * @param {Object} worldData - World data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateRooms(worldData, errors, warnings) {
    const roomIds = new Set();

    for (const room of worldData.rooms) {
      // Duplicate ID check
      if (roomIds.has(room.id)) {
        errors.push({
          type: 'duplicate_room_id',
          roomId: room.id,
          message: `Duplicate room ID: ${room.id}`,
          severity: 'error',
        });
      }
      roomIds.add(room.id);

      // Required fields
      if (!room.name) {
        errors.push({
          type: 'missing_room_name',
          roomId: room.id,
          message: `Room ${room.id} missing name`,
          severity: 'error',
        });
      }

      if (!room.description) {
        warnings.push({
          type: 'missing_room_description',
          roomId: room.id,
          message: `Room ${room.id} missing description`,
          severity: 'warning',
        });
      }

      // Exit validation
      if (room.exits) {
        for (const [direction, targetId] of Object.entries(room.exits)) {
          if (!worldData.rooms.find((r) => r.id === targetId)) {
            errors.push({
              type: 'invalid_exit',
              roomId: room.id,
              direction,
              targetId,
              message: `Room ${room.id} has invalid exit to ${targetId}`,
              severity: 'error',
            });
          }
        }
      }
    }
  }

  /**
   * Validate items
   * @param {Object} worldData - World data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateItems(worldData, errors, warnings) {
    if (!worldData.items || worldData.items.length < this.rules.minItems) {
      warnings.push({
        type: 'insufficient_items',
        message: `World should have at least ${this.rules.minItems} items`,
        severity: 'warning',
      });
    }

    const itemIds = new Set();
    const roomIds = new Set(worldData.rooms.map((r) => r.id));
    const npcIds = new Set(worldData.npcs?.map((n) => n.id) || []);

    for (const item of worldData.items || []) {
      // Duplicate ID check
      if (itemIds.has(item.id)) {
        errors.push({
          type: 'duplicate_item_id',
          itemId: item.id,
          message: `Duplicate item ID: ${item.id}`,
          severity: 'error',
        });
      }
      itemIds.add(item.id);

      // Location validation
      if (item.location && !roomIds.has(item.location) && !npcIds.has(item.location)) {
        errors.push({
          type: 'invalid_item_location',
          itemId: item.id,
          location: item.location,
          message: `Item ${item.id} has invalid location: ${item.location}`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Validate NPCs
   * @param {Object} worldData - World data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateNPCs(worldData, errors, warnings) {
    const npcIds = new Set();
    const roomIds = new Set(worldData.rooms.map((r) => r.id));

    for (const npc of worldData.npcs || []) {
      // Duplicate ID check
      if (npcIds.has(npc.id)) {
        errors.push({
          type: 'duplicate_npc_id',
          npcId: npc.id,
          message: `Duplicate NPC ID: ${npc.id}`,
          severity: 'error',
        });
      }
      npcIds.add(npc.id);

      // Room validation
      if (npc.startingRoom && !roomIds.has(npc.startingRoom)) {
        errors.push({
          type: 'invalid_npc_room',
          npcId: npc.id,
          roomId: npc.startingRoom,
          message: `NPC ${npc.id} starting room ${npc.startingRoom} doesn't exist`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Validate puzzles
   * @param {Object} worldData - World data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validatePuzzles(worldData, errors, warnings) {
    const puzzleIds = new Set();
    const itemIds = new Set(worldData.items?.map((i) => i.id) || []);
    const roomIds = new Set(worldData.rooms.map((r) => r.id));

    for (const puzzle of worldData.puzzles || []) {
      // Duplicate ID check
      if (puzzleIds.has(puzzle.id)) {
        errors.push({
          type: 'duplicate_puzzle_id',
          puzzleId: puzzle.id,
          message: `Duplicate puzzle ID: ${puzzle.id}`,
          severity: 'error',
        });
      }
      puzzleIds.add(puzzle.id);

      // Required items validation
      if (puzzle.requiredItems) {
        for (const itemId of puzzle.requiredItems) {
          if (!itemIds.has(itemId)) {
            errors.push({
              type: 'missing_puzzle_item',
              puzzleId: puzzle.id,
              itemId,
              message: `Puzzle ${puzzle.id} requires non-existent item: ${itemId}`,
              severity: 'error',
            });
          }
        }
      }

      // Location validation
      if (puzzle.location && !roomIds.has(puzzle.location)) {
        errors.push({
          type: 'invalid_puzzle_location',
          puzzleId: puzzle.id,
          location: puzzle.location,
          message: `Puzzle ${puzzle.id} location ${puzzle.location} doesn't exist`,
          severity: 'error',
        });
      }

      // Solution validation
      if (!puzzle.solution) {
        warnings.push({
          type: 'missing_puzzle_solution',
          puzzleId: puzzle.id,
          message: `Puzzle ${puzzle.id} has no solution defined`,
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Validate room connectivity
   * @param {Object} worldData - World data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateConnectivity(worldData, errors, warnings) {
    if (!worldData.rooms || worldData.rooms.length === 0) return;

    // Build adjacency list
    const graph = new Map();
    for (const room of worldData.rooms) {
      graph.set(room.id, []);
      if (room.exits) {
        for (const targetId of Object.values(room.exits)) {
          graph.get(room.id).push(targetId);
        }
      }
    }

    // Find connected components
    const visited = new Set();
    const components = [];

    for (const room of worldData.rooms) {
      if (!visited.has(room.id)) {
        const component = [];
        this.dfs(room.id, graph, visited, component);
        components.push(component);
      }
    }

    // Check for disconnected rooms
    if (components.length > 1) {
      errors.push({
        type: 'disconnected_rooms',
        message: `World has ${components.length} disconnected areas`,
        components: components.map((c) => c.length),
        severity: 'error',
      });

      // Report specific unreachable rooms
      for (let i = 1; i < components.length; i++) {
        for (const roomId of components[i]) {
          errors.push({
            type: 'unreachable_room',
            roomId,
            message: `Room ${roomId} is unreachable from start`,
            severity: 'error',
          });
        }
      }
    }
  }

  /**
   * DFS helper for connectivity check
   * @param {string} nodeId - Current node
   * @param {Map} graph - Adjacency list
   * @param {Set} visited - Visited nodes
   * @param {Array} component - Current component
   */
  dfs(nodeId, graph, visited, component) {
    visited.add(nodeId);
    component.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.dfs(neighbor, graph, visited, component);
      }
    }
  }

  /**
   * Validate item accessibility
   * @param {Object} worldData - World data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateAccessibility(worldData, errors, warnings) {
    // Check if puzzle-required items are accessible
    for (const puzzle of worldData.puzzles || []) {
      if (puzzle.requiredItems) {
        for (const itemId of puzzle.requiredItems) {
          const item = worldData.items?.find((i) => i.id === itemId);
          if (item && item.location) {
            // Check if location is accessible
            const room = worldData.rooms.find((r) => r.id === item.location);
            if (!room) {
              errors.push({
                type: 'inaccessible_item',
                itemId,
                puzzleId: puzzle.id,
                message: `Puzzle ${puzzle.id} requires item ${itemId} which is in non-existent location`,
                severity: 'error',
              });
            }
          }
        }
      }
    }
  }

  /**
   * Validate puzzle solvability
   * @param {Object} worldData - World data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateSolvability(worldData, errors, warnings) {
    // Check for circular dependencies
    const puzzleDeps = new Map();

    for (const puzzle of worldData.puzzles || []) {
      puzzleDeps.set(puzzle.id, {
        requires: puzzle.requiredItems || [],
        provides: puzzle.reward,
      });
    }

    // Simple cycle detection
    for (const [puzzleId, deps] of puzzleDeps) {
      if (this.hasCircularDependency(puzzleId, puzzleDeps, new Set())) {
        errors.push({
          type: 'circular_dependency',
          puzzleId,
          message: `Puzzle ${puzzleId} has circular dependency`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Check for circular dependencies
   * @param {string} puzzleId - Puzzle ID
   * @param {Map} deps - Dependencies map
   * @param {Set} visited - Visited puzzles
   * @returns {boolean} True if circular dependency found
   */
  hasCircularDependency(puzzleId, deps, visited) {
    if (visited.has(puzzleId)) return true;

    visited.add(puzzleId);

    const puzzle = deps.get(puzzleId);
    if (puzzle && puzzle.requires) {
      for (const itemId of puzzle.requires) {
        // Find puzzle that provides this item
        for (const [otherId, otherPuzzle] of deps) {
          if (otherPuzzle.provides === itemId) {
            if (this.hasCircularDependency(otherId, deps, new Set(visited))) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Validate game balance
   * @param {Object} worldData - World data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateBalance(worldData, errors, warnings) {
    // Check difficulty progression
    const puzzles = worldData.puzzles || [];
    let lastDifficulty = 0;
    const difficultyMap = { easy: 1, normal: 2, hard: 3 };

    for (const puzzle of puzzles) {
      const difficulty = difficultyMap[puzzle.difficulty] || 2;
      if (difficulty < lastDifficulty - 1) {
        warnings.push({
          type: 'difficulty_spike',
          puzzleId: puzzle.id,
          message: `Puzzle ${puzzle.id} difficulty drops significantly`,
          severity: 'warning',
        });
      }
      lastDifficulty = difficulty;
    }

    // Check for dead ends
    for (const room of worldData.rooms) {
      const exitCount = room.exits ? Object.keys(room.exits).length : 0;
      if (exitCount === 0) {
        warnings.push({
          type: 'dead_end_room',
          roomId: room.id,
          message: `Room ${room.id} has no exits (dead end)`,
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Get validation statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return { ...this.stats };
  }
}
