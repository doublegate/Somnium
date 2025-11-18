/**
 * Somnium - Main Entry Point
 *
 * Initializes the game and wires up all UI interactions
 */

import logger from './logger.js';
import { GameManager } from './GameManager.js';
import { UIManager } from './UIManager.js';
import { SaveGameManager } from './SaveGameManager.js';

// Global instances
let gameManager = null;
let uiManager = null;
let saveGameManager = null;

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
  logger.info('Somnium v0.0.1 - Initializing...');

  // Wait for config to load
  await waitForConfig();

  // Initialize UI Manager
  uiManager = new UIManager();

  // Initialize UI handlers
  initializeUI();

  // Setup FPS counter listener
  window.addEventListener('game-fps', (event) => {
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) {
      fpsCounter.textContent = `FPS: ${event.detail.fps}`;
    }
  });

  logger.info('Somnium ready');
});

/**
 * Wait for API config to load
 */
async function waitForConfig() {
  return new Promise((resolve) => {
    const checkConfig = () => {
      if (window.API_CONFIG) {
        logger.info('Configuration loaded');
        resolve();
      } else {
        setTimeout(checkConfig, 100);
      }
    };
    checkConfig();
  });
}

/**
 * Initialize UI event handlers
 */
function initializeUI() {
  // Main menu buttons
  document.getElementById('new-game-btn').addEventListener('click', () => {
    uiManager.showThemeModal();
  });

  document.getElementById('load-game-btn').addEventListener('click', () => {
    uiManager.showLoadGameModal();
  });

  document.getElementById('about-btn').addEventListener('click', () => {
    uiManager.showAboutModal();
  });

  // Theme modal
  document
    .getElementById('start-adventure-btn')
    .addEventListener('click', async () => {
      const theme = document.getElementById('theme-input').value.trim() || null;
      await startNewGame(theme);
    });

  document.getElementById('cancel-theme-btn').addEventListener('click', () => {
    uiManager.hideThemeModal();
  });

  // Theme input Enter key
  document.getElementById('theme-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('start-adventure-btn').click();
    }
  });

  // About modal
  document.getElementById('close-about-btn').addEventListener('click', () => {
    uiManager.hideAboutModal();
  });

  // Error modal
  document.getElementById('close-error-btn').addEventListener('click', () => {
    uiManager.hideErrorModal();
  });

  // Menu bar items
  document.querySelectorAll('.menu-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      const menu = e.target.getAttribute('data-menu');
      handleMenuClick(menu);
    });
  });

  // Text input
  const textInput = document.getElementById('text-input');
  textInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && gameManager) {
      const command = textInput.value.trim();
      if (command) {
        // Add to history
        uiManager.addToHistory(command);

        // Display command
        uiManager.addOutputText(`> ${command}`, 'command');

        // Clear input
        uiManager.clearInput();

        // Process command
        await gameManager.handlePlayerInput(command);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      uiManager.historyUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      uiManager.historyDown();
    }
  });
}

/**
 * Start a new game with the given theme
 * @param {string|null} theme - The theme for the adventure
 */
async function startNewGame(theme) {
  try {
    logger.info('Starting new game with theme:', theme || 'random');

    uiManager.hideThemeModal();
    uiManager.hideMainMenu();
    uiManager.showLoadingScreen('Generating your unique adventure...');

    // Get the game canvas
    const canvas = document.getElementById('game-canvas');

    // Create game configuration
    const config = {
      apiKey: window.API_CONFIG.apiKey,
      apiEndpoint: window.API_CONFIG.apiEndpoint,
      model: window.API_CONFIG.model || 'gpt-3.5-turbo',
      moderationEndpoint: window.API_CONFIG.moderationEndpoint,
      debugMode: window.API_CONFIG.debugMode || false,
      useSierraParser: window.API_CONFIG.useSierraParser !== false,
      usePriorityRenderer: window.API_CONFIG.usePriorityRenderer !== false,
    };

    // Initialize game manager
    gameManager = new GameManager(canvas, config);

    // Override displayMessage to use UI
    gameManager.displayMessage = (message) => {
      uiManager.addOutputText(message, 'game');
    };

    // Create save game manager
    saveGameManager = new SaveGameManager(gameManager);

    // Enable auto-save if configured
    if (window.API_CONFIG.autoSave !== false) {
      saveGameManager.enableAutoSave();
    }

    // Determine if we should use AI or static world
    const useStatic = !config.apiKey || config.apiKey === 'your-api-key-here';

    if (useStatic) {
      uiManager.updateLoadingMessage('Loading test world...');
    } else {
      uiManager.updateLoadingMessage('AI is crafting your adventure...');
    }

    // Start the game
    await gameManager.startNewGame(theme, {
      useStatic,
      worldType: useStatic ? 'small' : undefined,
    });

    // Hide loading screen
    uiManager.hideLoadingScreen();

    // Show game UI
    uiManager.showGameUI();

    // Display welcome message
    const currentRoom = gameManager.gameState.getCurrentRoom();
    const metadata = gameManager.gameState.gameJSON?.metadata || {};

    uiManager.addOutputText(
      '╔════════════════════════════════════════╗',
      'title'
    );
    uiManager.addOutputText(
      `  ${metadata.title || 'Somnium'}`.padEnd(42) + '║',
      'title'
    );
    uiManager.addOutputText(
      '╚════════════════════════════════════════╝',
      'title'
    );
    uiManager.addOutputText('');

    if (metadata.mockData) {
      uiManager.addOutputText(
        '[ Running in OFFLINE MODE - Using test world ]',
        'system'
      );
      uiManager.addOutputText('');
    }

    uiManager.addOutputText(currentRoom.description, 'description');
    uiManager.addOutputText('');
    uiManager.addOutputText(
      'Type "look" to examine your surroundings, or "help" for commands.',
      'hint'
    );

    // Update title
    uiManager.updateTitle(metadata.title || 'Somnium');

    // Enable debug mode if configured
    if (config.debugMode) {
      document.getElementById('debug-info').classList.remove('hidden');
    }

    // Focus input
    uiManager.focusInput();

    logger.info('Game started successfully');
  } catch (error) {
    logger.error('Failed to start game:', error);
    uiManager.hideLoadingScreen();
    uiManager.showError(`Failed to start game: ${error.message}`);
    uiManager.showMainMenu();
  }
}

/**
 * Handle menu bar clicks
 * @param {string} menu - Menu identifier
 */
function handleMenuClick(menu) {
  if (!gameManager) {
    uiManager.showError('No game is currently running');
    return;
  }

  switch (menu) {
    case 'file':
      showFileMenu();
      break;
    case 'game':
      showGameMenu();
      break;
    case 'speed':
      showSpeedMenu();
      break;
    case 'sound':
      showSoundMenu();
      break;
    case 'help':
      showHelpMenu();
      break;
  }
}

/**
 * Show file menu
 */
function showFileMenu() {
  const menu = [
    { label: 'Save Game', action: () => saveGame() },
    { label: 'Load Game', action: () => loadGame() },
    { label: 'Quit to Main Menu', action: () => quitToMenu() },
  ];
  uiManager.showDropdownMenu(menu);
}

/**
 * Show game menu
 */
function showGameMenu() {
  const menu = [
    { label: 'Restart', action: () => restartGame() },
    { label: 'Inventory', action: () => showInventory() },
    { label: 'About', action: () => uiManager.showAboutModal() },
  ];
  uiManager.showDropdownMenu(menu);
}

/**
 * Show speed menu
 */
function showSpeedMenu() {
  const menu = [
    { label: 'Very Slow (1)', action: () => gameManager.setSpeed(1) },
    { label: 'Slow (2)', action: () => gameManager.setSpeed(2) },
    { label: 'Normal (3)', action: () => gameManager.setSpeed(3) },
    { label: 'Fast (4)', action: () => gameManager.setSpeed(4) },
    { label: 'Very Fast (5)', action: () => gameManager.setSpeed(5) },
  ];
  uiManager.showDropdownMenu(menu);
}

/**
 * Show sound menu
 */
function showSoundMenu() {
  const menu = [
    { label: 'Sound On/Off', action: () => toggleSound() },
    { label: 'About', action: () => uiManager.showAboutModal() },
  ];
  uiManager.showDropdownMenu(menu);
}

/**
 * Show help menu
 */
function showHelpMenu() {
  const menu = [
    { label: 'How to Play', action: () => showHelp() },
    { label: 'Commands', action: () => showCommands() },
    { label: 'About', action: () => uiManager.showAboutModal() },
  ];
  uiManager.showDropdownMenu(menu);
}

/**
 * Save current game
 */
function saveGame() {
  if (!saveGameManager) return;

  try {
    const slot = 0; // TODO: Show save slot selector
    const saveName = uiManager.prompt(
      'Enter a name for this save:',
      'Save Game'
    );
    if (saveName) {
      saveGameManager.saveToSlot(slot, saveName);
      uiManager.addOutputText('Game saved successfully.', 'system');
    }
  } catch (error) {
    uiManager.showError(`Failed to save game: ${error.message}`);
  }
}

/**
 * Load a saved game
 */
async function loadGame() {
  if (!saveGameManager) return;

  try {
    const slot = 0; // TODO: Show load slot selector
    await saveGameManager.loadFromSlot(slot);
    uiManager.addOutputText('Game loaded successfully.', 'system');

    // Refresh display
    const currentRoom = gameManager.gameState.getCurrentRoom();
    uiManager.addOutputText('');
    uiManager.addOutputText(currentRoom.description, 'description');
  } catch (error) {
    uiManager.showError(`Failed to load game: ${error.message}`);
  }
}

/**
 * Quit to main menu
 */
function quitToMenu() {
  if (
    uiManager.confirm(
      'Are you sure you want to quit? Unsaved progress will be lost.'
    )
  ) {
    if (gameManager) {
      gameManager.stopGame();
      gameManager = null;
    }
    if (saveGameManager) {
      saveGameManager.disableAutoSave();
      saveGameManager = null;
    }
    uiManager.hideGameUI();
    uiManager.showMainMenu();
  }
}

/**
 * Restart current game
 */
function restartGame() {
  if (
    uiManager.confirm(
      'Are you sure you want to restart? All progress will be lost.'
    )
  ) {
    uiManager.addOutputText(
      'Restart not yet implemented. Use "Quit" and start a new game.',
      'system'
    );
  }
}

/**
 * Show inventory
 */
function showInventory() {
  if (!gameManager) return;

  const inventory = gameManager.gameState.getInventory();
  if (inventory.length === 0) {
    uiManager.addOutputText("You aren't carrying anything.", 'game');
  } else {
    uiManager.addOutputText('You are carrying:', 'game');
    inventory.forEach((item) => {
      uiManager.addOutputText(`  - ${item.name}`, 'game');
    });
  }
}

/**
 * Toggle sound on/off
 */
function toggleSound() {
  if (!gameManager) return;

  // Simple mute toggle
  const currentVolume = gameManager.soundManager.masterVolume;
  if (currentVolume > 0) {
    gameManager.soundManager.setMasterVolume(0);
    uiManager.addOutputText('Sound muted.', 'system');
  } else {
    gameManager.soundManager.setMasterVolume(
      window.API_CONFIG.masterVolume || 0.7
    );
    uiManager.addOutputText('Sound enabled.', 'system');
  }
}

/**
 * Show help information
 */
function showHelp() {
  uiManager.clearOutput();
  uiManager.addOutputText(
    '╔════════════════════════════════════════╗',
    'title'
  );
  uiManager.addOutputText('  HOW TO PLAY'.padEnd(42) + '║', 'title');
  uiManager.addOutputText(
    '╚════════════════════════════════════════╝',
    'title'
  );
  uiManager.addOutputText('');
  uiManager.addOutputText(
    'Somnium is a text adventure game. Type commands to interact with the world.',
    'game'
  );
  uiManager.addOutputText('');
  uiManager.addOutputText('Common commands:', 'game');
  uiManager.addOutputText('  look - Examine your surroundings', 'game');
  uiManager.addOutputText('  take [item] - Pick up an item', 'game');
  uiManager.addOutputText('  use [item] - Use an item', 'game');
  uiManager.addOutputText(
    '  go [direction] - Move (north, south, east, west)',
    'game'
  );
  uiManager.addOutputText('  talk to [character] - Speak with someone', 'game');
  uiManager.addOutputText('  inventory - See what you are carrying', 'game');
  uiManager.addOutputText('');
  uiManager.addOutputText('Type "commands" for a full list.', 'hint');
}

/**
 * Show available commands
 */
function showCommands() {
  uiManager.clearOutput();
  uiManager.addOutputText(
    '╔════════════════════════════════════════╗',
    'title'
  );
  uiManager.addOutputText('  AVAILABLE COMMANDS'.padEnd(42) + '║', 'title');
  uiManager.addOutputText(
    '╚════════════════════════════════════════╝',
    'title'
  );
  uiManager.addOutputText('');

  const commands = [
    'look, examine, l',
    'take, get, grab',
    'drop, put down',
    'use, activate',
    'open, close',
    'go [direction], n/s/e/w/up/down',
    'talk to [character]',
    'give [item] to [character]',
    'ask [character] about [topic]',
    'inventory, inv, i',
    'save, load',
    'help, ?',
  ];

  commands.forEach((cmd) => {
    uiManager.addOutputText(`  ${cmd}`, 'game');
  });
  uiManager.addOutputText('');
  uiManager.addOutputText('The parser understands many synonyms!', 'hint');
}

// Export for debugging/testing
window.getGameManager = () => gameManager;
window.getUIManager = () => uiManager;
window.getSaveGameManager = () => saveGameManager;

export { startNewGame, uiManager, gameManager, saveGameManager };
