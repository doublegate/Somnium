/**
 * UIManager - Handles all UI interactions and state
 *
 * Manages modals, text output, menus, and game UI state
 */

import logger from './logger.js';

export class UIManager {
  constructor() {
    this.commandHistory = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;

    // Cache UI elements
    this.elements = {
      mainMenu: document.getElementById('main-menu'),
      gameContainer: document.getElementById('game-container'),
      textWindow: document.getElementById('text-window'),
      textOutput: document.getElementById('text-output'),
      textInput: document.getElementById('text-input'),
      loadingScreen: document.getElementById('loading-screen'),
      loadingMessage: document.getElementById('loading-message'),
      themeModal: document.getElementById('theme-modal'),
      aboutModal: document.getElementById('about-modal'),
      errorModal: document.getElementById('error-modal'),
      errorMessage: document.getElementById('error-message'),
      score: document.getElementById('score'),
      gameTitle: document.getElementById('game-title'),
    };

    this.logger = logger;
  }

  // ===== Main Menu =====

  showMainMenu() {
    this.elements.mainMenu.classList.remove('hidden');
    this.logger.debug('Main menu shown');
  }

  hideMainMenu() {
    this.elements.mainMenu.classList.add('hidden');
    this.logger.debug('Main menu hidden');
  }

  // ===== Game UI =====

  showGameUI() {
    this.elements.gameContainer.style.display = 'block';
    this.elements.textWindow.classList.remove('hidden');
    this.elements.textInput.focus();
    this.logger.debug('Game UI shown');
  }

  hideGameUI() {
    this.elements.gameContainer.style.display = 'none';
    this.elements.textWindow.classList.add('hidden');
    this.clearOutput();
    this.logger.debug('Game UI hidden');
  }

  // ===== Text Output =====

  /**
   * Add text to the output window
   * @param {string} text - Text to display
   * @param {string} type - Text type (command, game, system, title, description, hint)
   */
  addOutputText(text, type = 'game') {
    const line = document.createElement('div');
    line.className = `text-line text-${type}`;
    line.textContent = text;
    this.elements.textOutput.appendChild(line);

    // Auto-scroll to bottom
    this.elements.textOutput.scrollTop = this.elements.textOutput.scrollHeight;

    // Limit history to 200 lines
    while (this.elements.textOutput.children.length > 200) {
      this.elements.textOutput.removeChild(this.elements.textOutput.firstChild);
    }
  }

  /**
   * Clear all output text
   */
  clearOutput() {
    this.elements.textOutput.innerHTML = '';
  }

  // ===== Command History =====

  /**
   * Add command to history
   * @param {string} command - Command to add
   */
  addToHistory(command) {
    if (command && command.trim()) {
      this.commandHistory.push(command);
      if (this.commandHistory.length > this.maxHistorySize) {
        this.commandHistory.shift();
      }
      this.historyIndex = this.commandHistory.length;
    }
  }

  /**
   * Navigate history up
   */
  historyUp() {
    if (this.commandHistory.length === 0) return;

    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.elements.textInput.value = this.commandHistory[this.historyIndex];
    }
  }

  /**
   * Navigate history down
   */
  historyDown() {
    if (this.commandHistory.length === 0) return;

    if (this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
      this.elements.textInput.value = this.commandHistory[this.historyIndex];
    } else {
      this.historyIndex = this.commandHistory.length;
      this.elements.textInput.value = '';
    }
  }

  // ===== Loading Screen =====

  /**
   * Show loading screen with message
   * @param {string} message - Loading message
   */
  showLoadingScreen(message = 'Loading...') {
    this.elements.loadingScreen.classList.remove('hidden');
    this.elements.loadingMessage.textContent = message;
    this.logger.debug(`Loading screen shown: ${message}`);
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    this.elements.loadingScreen.classList.add('hidden');
    this.logger.debug('Loading screen hidden');
  }

  /**
   * Update loading message
   * @param {string} message - New loading message
   */
  updateLoadingMessage(message) {
    this.elements.loadingMessage.textContent = message;
  }

  // ===== Modals =====

  /**
   * Show theme selection modal
   */
  showThemeModal() {
    this.elements.themeModal.classList.remove('hidden');
    document.getElementById('theme-input').focus();
    this.logger.debug('Theme modal shown');
  }

  /**
   * Hide theme selection modal
   */
  hideThemeModal() {
    this.elements.themeModal.classList.add('hidden');
    document.getElementById('theme-input').value = '';
    this.logger.debug('Theme modal hidden');
  }

  /**
   * Show about modal
   */
  showAboutModal() {
    this.elements.aboutModal.classList.remove('hidden');
    this.logger.debug('About modal shown');
  }

  /**
   * Hide about modal
   */
  hideAboutModal() {
    this.elements.aboutModal.classList.add('hidden');
    this.logger.debug('About modal hidden');
  }

  /**
   * Show error modal with message
   * @param {string} message - Error message
   */
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorModal.classList.remove('hidden');
    this.logger.error(`Error shown: ${message}`);
  }

  /**
   * Hide error modal
   */
  hideErrorModal() {
    this.elements.errorModal.classList.add('hidden');
    this.logger.debug('Error modal hidden');
  }

  /**
   * Show load game modal (TODO: Implement)
   */
  showLoadGameModal() {
    // TODO: Create dedicated load game modal with save slot list
    this.showError(
      'Load game UI not yet implemented. Use console: saveGameManager().loadFromSlot(0)'
    );
  }

  // ===== Dropdown Menus =====

  /**
   * Show dropdown menu
   * @param {Array} menuItems - Array of {label, action} objects
   */
  showDropdownMenu(menuItems) {
    // TODO: Implement dropdown menu system
    this.logger.debug('Dropdown menu requested:', menuItems);
    this.addOutputText('Dropdown menus not yet implemented.', 'system');
  }

  // ===== Status Bar =====

  /**
   * Update score display
   * @param {number} score - Current score
   */
  updateScore(score) {
    this.elements.score.textContent = `Score: ${score}`;
  }

  /**
   * Update game title display
   * @param {string} title - Game title
   */
  updateTitle(title) {
    this.elements.gameTitle.textContent = title;
  }

  // ===== Utility Methods =====

  /**
   * Prompt user for input
   * @param {string} message - Prompt message
   * @param {string} defaultValue - Default input value
   * @returns {string|null} User input or null if cancelled
   */
  prompt(message, defaultValue = '') {
    return window.prompt(message, defaultValue);
  }

  /**
   * Show confirmation dialog
   * @param {string} message - Confirmation message
   * @returns {boolean} True if confirmed
   */
  confirm(message) {
    return window.confirm(message);
  }

  /**
   * Focus on text input
   */
  focusInput() {
    this.elements.textInput.focus();
  }

  /**
   * Get current command input value
   * @returns {string} Current input value
   */
  getInputValue() {
    return this.elements.textInput.value;
  }

  /**
   * Set command input value
   * @param {string} value - Input value
   */
  setInputValue(value) {
    this.elements.textInput.value = value;
  }

  /**
   * Clear command input
   */
  clearInput() {
    this.elements.textInput.value = '';
  }
}

export default UIManager;
