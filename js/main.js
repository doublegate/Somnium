/**
 * Somnium - Main Entry Point
 *
 * This file initializes the game and sets up the main menu.
 * The actual game engine modules will be imported and initialized here.
 */

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('Somnium v0.0.1 - Initializing...');

  // Check for API configuration
  if (!window.API_CONFIG) {
    console.error('API configuration not found. Please create js/config.js');
    return;
  }

  // Initialize UI handlers
  initializeUI();
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
      console.log(`Menu clicked: ${menuName}`);
    });
  });
}

/**
 * Start a new game with the given theme
 * @param {string|null} theme - The theme for the adventure
 */
async function startNewGame(theme) {
  console.log('Starting new game with theme:', theme || 'random');

  // Hide main menu
  document.getElementById('main-menu').classList.add('hidden');

  // Show loading screen
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.classList.remove('hidden');

  try {
    // TODO: Import and initialize game modules
    // const { GameManager } = await import('./GameManager.js');
    // const gameManager = new GameManager(...);
    // await gameManager.startNewGame(theme);

    // Temporary: Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Hide loading screen
    loadingScreen.classList.add('hidden');

    // Show game canvas
    const gameContainer = document.getElementById('game-container');
    gameContainer.style.display = 'block';

    // TODO: Remove this when game engine is implemented
    showError('Game engine not yet implemented. Check back soon!');
  } catch (error) {
    console.error('Failed to start game:', error);
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

// Export for testing
export { startNewGame, showError };
