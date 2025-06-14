/**
 * GameManager - Central orchestrator that manages the game loop and coordinates all other modules
 *
 * Responsibilities:
 * - Initialize and configure all modules
 * - Drive the game loop via requestAnimationFrame
 * - Manage game speed settings
 * - Coordinate module interactions
 * - Handle pause/resume states
 */

import { AIManager } from './AIManager.js';
import { GameState } from './GameState.js';
import { SceneRenderer } from './SceneRenderer.js';
import { ViewManager } from './ViewManager.js';
import { SoundManager } from './SoundManager.js';
import { Parser } from './Parser.js';
import { EventManager } from './EventManager.js';
import { CommandExecutor } from './CommandExecutor.js';
import { Inventory } from './Inventory.js';
import { InteractionSystem } from './InteractionSystem.js';
import { MovementSystem } from './MovementSystem.js';
import { PuzzleSystem } from './PuzzleSystem.js';
import { NPCSystem } from './NPCSystem.js';
import { GameProgression } from './GameProgression.js';

export class GameManager {
  /**
   * @param {HTMLCanvasElement} canvasElement - The game display canvas
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey - LLM API key
   * @param {string} config.apiEndpoint - LLM API URL
   * @param {boolean} config.moderationEnabled - Enable content filtering
   * @param {boolean} config.debugMode - Enable debug features
   */
  constructor(canvasElement, config) {
    this.canvas = canvasElement;
    this.config = config;

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.gameSpeed = 3; // Normal speed (1-5 scale)

    // Initialize modules
    this.aiManager = new AIManager({
      apiKey: config.apiKey,
      apiEndpoint: config.apiEndpoint,
      model: config.model || 'gpt-3.5-turbo',
      moderationEndpoint: config.moderationEndpoint,
    });

    this.gameState = new GameState();
    this.sceneRenderer = new SceneRenderer(canvasElement);
    this.viewManager = new ViewManager(this.sceneRenderer);
    this.soundManager = new SoundManager();
    this.parser = new Parser({}); // TODO: Load vocabulary config
    this.eventManager = new EventManager(this.gameState, this.aiManager);

    // Initialize game logic systems
    this.inventory = new Inventory(this.gameState);
    this.movementSystem = new MovementSystem(
      this.gameState,
      this.viewManager,
      this.eventManager
    );
    this.interactionSystem = new InteractionSystem(
      this.gameState,
      this.eventManager
    );
    this.puzzleSystem = new PuzzleSystem(this.gameState, this.eventManager);
    this.npcSystem = new NPCSystem(
      this.gameState,
      this.movementSystem,
      this.eventManager
    );
    this.gameProgression = new GameProgression(
      this.gameState,
      this.eventManager
    );

    // Initialize command executor with all systems
    this.commandExecutor = new CommandExecutor(
      this.gameState,
      this.eventManager,
      this.viewManager,
      this.sceneRenderer,
      this.soundManager,
      this.inventory,
      this.interactionSystem,
      this.movementSystem
    );

    // Timing
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.accumulator = 0;
    this.fixedTimeStep = 1 / 60; // 60 FPS physics
    this.maxDeltaTime = 0.1; // Cap delta to prevent spiral of death

    // Performance monitoring
    this.frameCount = 0;
    this.fpsTime = 0;
    this.currentFPS = 60;

    // Bind methods
    this.gameLoop = this.gameLoop.bind(this);
  }

  /**
   * Generates and starts a new adventure
   * @param {string} [theme] - Theme or setting for the adventure
   * @returns {Promise<void>}
   * @throws {Error} if generation fails
   */
  async startNewGame(theme) {
    try {
      console.log(`Starting new game with theme: ${theme || 'random'}`);

      // Generate world via AI
      const gameJSON = await this.aiManager.generateWorld(theme);

      // Load resources into game state
      this.gameState.loadResources(gameJSON);

      // Initialize all game systems with game data
      this.interactionSystem.initialize(gameJSON);
      this.puzzleSystem.initialize(gameJSON);
      this.npcSystem.initialize(gameJSON);
      this.gameProgression.initialize(gameJSON);

      // Initialize audio
      await this.soundManager.initialize();

      // Render first room
      const currentRoom = this.gameState.getCurrentRoom();
      this.sceneRenderer.renderRoom(currentRoom.graphics);

      // Start game loop
      this.isRunning = true;
      this.isPaused = false;
      requestAnimationFrame(this.gameLoop);
    } catch (error) {
      console.error('Failed to start new game:', error);
      throw error;
    }
  }

  /**
   * Loads a previously saved game
   * @param {Object} saveData - Complete save file object
   * @returns {Promise<void>}
   * @throws {Error} if save file invalid
   */
  async loadGame(saveData) {
    try {
      console.log('Loading saved game...');

      // Validate save data
      if (!saveData || !saveData.state || !saveData.gameJSON) {
        throw new Error('Invalid save file format');
      }

      // Restore game state
      this.gameState.loadResources(saveData.gameJSON);
      this.gameState.deserialize(saveData.state);

      // Initialize all game systems with game data
      this.interactionSystem.initialize(saveData.gameJSON);
      this.puzzleSystem.initialize(saveData.gameJSON);
      this.npcSystem.initialize(saveData.gameJSON);
      this.gameProgression.initialize(saveData.gameJSON);

      // Initialize audio
      await this.soundManager.initialize();

      // Render current room
      const currentRoom = this.gameState.getCurrentRoom();
      this.sceneRenderer.renderRoom(currentRoom.graphics);

      // Start game loop
      this.isRunning = true;
      this.isPaused = false;
      requestAnimationFrame(this.gameLoop);
    } catch (error) {
      console.error('Failed to load game:', error);
      throw error;
    }
  }

  /**
   * Creates a save file of current game state
   * @returns {Object} SaveFile object
   */
  saveGame() {
    console.log('Saving game...');

    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      state: this.gameState.serialize(),
      gameJSON: this.gameState.gameJSON, // Original generated content
    };
  }

  /**
   * Pause game loop and timers
   */
  pauseGame() {
    console.log('Game paused');
    this.isPaused = true;
    this.soundManager.pauseAll();
  }

  /**
   * Resume game loop and timers
   */
  resumeGame() {
    console.log('Game resumed');
    this.isPaused = false;
    this.soundManager.resumeAll();

    if (this.isRunning) {
      requestAnimationFrame(this.gameLoop);
    }
  }

  /**
   * Adjust game speed (1-5, where 3 is normal)
   * @param {number} speed - Speed value from 1 to 5
   */
  setSpeed(speed) {
    if (speed >= 1 && speed <= 5) {
      this.gameSpeed = speed;
      console.log(`Game speed set to ${speed}`);
    }
  }

  /**
   * Main game loop with fixed timestep and interpolation
   * @param {number} currentTime - Current timestamp from requestAnimationFrame
   */
  gameLoop(currentTime) {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    // Calculate delta time and cap it
    if (this.lastFrameTime) {
      this.deltaTime = Math.min(
        (currentTime - this.lastFrameTime) / 1000,
        this.maxDeltaTime
      );

      // Apply game speed modifier
      const speedMultiplier = this.gameSpeed / 3; // 3 is normal speed
      const adjustedDelta = this.deltaTime * speedMultiplier;

      // Update FPS counter
      this.updateFPS(currentTime);

      // Accumulate time for fixed updates
      this.accumulator += adjustedDelta;

      // Fixed timestep updates
      while (this.accumulator >= this.fixedTimeStep) {
        this.fixedUpdate(this.fixedTimeStep);
        this.accumulator -= this.fixedTimeStep;
      }

      // Calculate interpolation value for smooth rendering
      const interpolation = this.accumulator / this.fixedTimeStep;

      // Variable timestep updates (animations, etc)
      this.update(adjustedDelta);

      // Render frame with interpolation
      this.render(interpolation);
    }

    this.lastFrameTime = currentTime;

    // Continue loop
    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Fixed timestep update for physics and game logic
   * @param {number} deltaTime - Fixed time step (typically 1/60 second)
   */
  fixedUpdate(deltaTime) {
    // Update game logic that needs deterministic timing
    this.eventManager.updateScheduledEvents(deltaTime);

    // Update movement systems
    this.movementSystem.update(deltaTime);

    // Update NPCs
    this.npcSystem.update(deltaTime);

    // Check game completion
    const completion = this.gameProgression.checkGameCompletion();
    if (completion.completed) {
      this.gameProgression.triggerEnding(completion.endingId);
    }

    // Update character positions (physics)
    this.viewManager.updatePositions(deltaTime);
  }

  /**
   * Variable timestep update for animations and non-critical systems
   * @param {number} deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime) {
    // Update animations
    this.viewManager.updateAnimations(deltaTime);

    // Update sound system
    this.soundManager.update(deltaTime);
  }

  /**
   * Render current frame with interpolation
   * @param {number} interpolation - Value between 0-1 for smooth motion
   */
  render(interpolation) {
    // Clear canvas
    this.sceneRenderer.clear();

    // Render room background
    const currentRoom = this.gameState.getCurrentRoom();
    if (currentRoom) {
      this.sceneRenderer.renderRoom(currentRoom.graphics);
    }

    // Render all sprites with interpolation
    this.viewManager.renderAll(interpolation);
  }

  /**
   * Update FPS counter
   * @param {number} currentTime - Current timestamp
   */
  updateFPS(currentTime) {
    this.frameCount++;

    // Update FPS every second
    if (currentTime - this.fpsTime >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = currentTime;

      // Dispatch FPS update event for UI
      window.dispatchEvent(
        new CustomEvent('game-fps', {
          detail: { fps: this.currentFPS },
          bubbles: true,
        })
      );
    }
  }

  /**
   * Stop game loop and cleanup
   */
  stopGame() {
    console.log('Stopping game...');
    this.isRunning = false;
    this.isPaused = false;
    this.soundManager.stopAll();
  }

  /**
   * Handle player text input
   * @param {string} input - Raw text from player
   */
  async handlePlayerInput(input) {
    try {
      // Parse the input
      this.parser.setContext(this.gameState);
      const command = this.parser.parse(input);

      if (command) {
        // Execute the command
        await this.eventManager.executeCommand(command);
      } else {
        // Display error message
        this.displayMessage("I don't understand that command.");
      }
    } catch (error) {
      console.error('Error handling player input:', error);
      this.displayMessage('Something went wrong. Please try again.');
    }
  }

  /**
   * Display message to player (placeholder - will integrate with UI)
   * @param {string} message - Text to display
   */
  displayMessage(message) {
    // TODO: Integrate with actual UI text window
    console.log(`[Game Message] ${message}`);
  }

  /**
   * Get current FPS
   * @returns {number} Current frames per second
   */
  getFPS() {
    return this.currentFPS;
  }

  /**
   * Check if game is currently running
   * @returns {boolean}
   */
  isGameRunning() {
    return this.isRunning && !this.isPaused;
  }
}
