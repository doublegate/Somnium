/**
 * Somnium - Main Entry Point
 *
 * This file initializes the game and sets up the main menu.
 * The actual game engine modules will be imported and initialized here.
 */

// Import game modules
import logger from './logger.js';
import { GameManager } from './GameManager.js';

// Global game manager instance
let gameManager = null;

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  logger.info('Somnium v0.0.1 - Initializing...');

  // Check for API configuration
  if (!window.API_CONFIG) {
    logger.error('API configuration not found. Please create js/config.js');
    return;
  }

  // Initialize UI handlers
  initializeUI();

  // Setup FPS counter listener
  window.addEventListener('game-fps', (event) => {
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) {
      fpsCounter.textContent = `FPS: ${event.detail.fps}`;
    }
  });
});

/**
 * Initialize UI event handlers
 */
function initializeUI() {
  // Main menu buttons
  const newGameBtn = document.getElementById('new-game-btn');
  const loadGameBtn = document.getElementById('load-game-btn');
  const aboutBtn = document.getElementById('about-btn');

  // Modal elements
  const themeModal = document.getElementById('theme-modal');
  const aboutModal = document.getElementById('about-modal');
  const errorModal = document.getElementById('error-modal');

  // Theme selection
  const startAdventureBtn = document.getElementById('start-adventure-btn');
  const cancelThemeBtn = document.getElementById('cancel-theme-btn');
  const themeInput = document.getElementById('theme-input');

  // About modal
  const closeAboutBtn = document.getElementById('close-about-btn');

  // Error modal
  const closeErrorBtn = document.getElementById('close-error-btn');

  // New Game
  newGameBtn.addEventListener('click', () => {
    themeModal.classList.remove('hidden');
    themeInput.focus();
  });

  // Load Game
  loadGameBtn.addEventListener('click', () => {
    // TODO: Implement load game functionality
    showError('Load game functionality coming soon!');
  });

  // About
  aboutBtn.addEventListener('click', () => {
    aboutModal.classList.remove('hidden');
  });

  // Start Adventure
  startAdventureBtn.addEventListener('click', () => {
    const theme = themeInput.value.trim() || null;
    themeModal.classList.add('hidden');
    startNewGame(theme);
  });

  // Cancel Theme
  cancelThemeBtn.addEventListener('click', () => {
    themeModal.classList.add('hidden');
    themeInput.value = '';
  });

  // Close About
  closeAboutBtn.addEventListener('click', () => {
    aboutModal.classList.add('hidden');
  });

  // Close Error
  closeErrorBtn.addEventListener('click', () => {
    errorModal.classList.add('hidden');
  });

  // Enter key in theme input
  themeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      startAdventureBtn.click();
    }
  });

  // Menu bar handlers
  initializeMenuBar();
}

/**
 * Initialize menu bar functionality
 */
function initializeMenuBar() {
  const menuItems = document.querySelectorAll('.menu-item');

  menuItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      const menuName = e.target.getAttribute('data-menu');
      // TODO: Implement dropdown menus
      logger.debug(`Menu clicked: ${menuName}`);
    });
  });
}

/**
 * Start a new game with the given theme
 * @param {string|null} theme - The theme for the adventure
 */
async function startNewGame(theme) {
  logger.info('Starting new game with theme:', theme || 'random');

  // Hide main menu
  document.getElementById('main-menu').classList.add('hidden');

  // Show loading screen
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.classList.remove('hidden');

  try {
    // Get the game canvas
    const canvas = document.getElementById('game-canvas');

    // Initialize game manager
    gameManager = new GameManager(canvas, {
      apiKey: window.API_CONFIG.apiKey,
      apiEndpoint: window.API_CONFIG.apiEndpoint,
      moderationEnabled: window.API_CONFIG.moderationEnabled || false,
      debugMode: window.API_CONFIG.debugMode || false,
    });

    // Start new game
    await gameManager.startNewGame(theme);

    // Hide loading screen
    loadingScreen.classList.add('hidden');

    // Show game canvas
    const gameContainer = document.getElementById('game-container');
    gameContainer.style.display = 'block';

    // Show debug info if in debug mode
    if (window.API_CONFIG.debugMode) {
      document.getElementById('debug-info').classList.remove('hidden');
    }

    // Set up input handler
    setupGameInput();
  } catch (error) {
    logger.error('Failed to start game:', error);
    loadingScreen.classList.add('hidden');
    showError('Failed to start game. Please check your API configuration.');
  }
}

/**
 * Show an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
  const errorModal = document.getElementById('error-modal');
  const errorMessage = document.getElementById('error-message');

  errorMessage.textContent = message;
  errorModal.classList.remove('hidden');
}

/**
 * Set up game input handling
 */
function setupGameInput() {
  const inputLine = document.querySelector('.input-line');
  const commandInput = inputLine.querySelector('#command-input');

  // Show input line
  inputLine.style.display = 'flex';

  // Focus on input
  commandInput.focus();

  // Handle command submission
  commandInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const command = commandInput.value.trim();
      if (command && gameManager) {
        // Clear input
        commandInput.value = '';

        // Display command in text window
        displayGameText(`> ${command}`);

        // Process command
        await gameManager.handlePlayerInput(command);
      }
    }
  });

  // Listen for game messages
  window.addEventListener('game-message', (e) => {
    displayGameText(e.detail.message);
  });
}

/**
 * Display text in the game text window
 * @param {string} text - Text to display
 */
function displayGameText(text) {
  const textDisplay = document.getElementById('text-display');

  // Add text line
  const line = document.createElement('div');
  line.className = 'text-line';
  line.textContent = text;
  textDisplay.appendChild(line);

  // Scroll to bottom
  textDisplay.scrollTop = textDisplay.scrollHeight;

  // Limit history to 100 lines
  while (textDisplay.children.length > 100) {
    textDisplay.removeChild(textDisplay.firstChild);
  }
}

// Export for testing
export { startNewGame, showError };
