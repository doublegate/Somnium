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
    this.elements.themeModal.removeAttribute('aria-hidden');
    document.getElementById('theme-input').focus();
    this.logger.debug('Theme modal shown');
  }

  /**
   * Hide theme selection modal
   */
  hideThemeModal() {
    this.elements.themeModal.classList.add('hidden');
    this.elements.themeModal.setAttribute('aria-hidden', 'true');
    document.getElementById('theme-input').value = '';
    this.logger.debug('Theme modal hidden');
  }

  /**
   * Show about modal
   */
  showAboutModal() {
    this.elements.aboutModal.classList.remove('hidden');
    this.elements.aboutModal.removeAttribute('aria-hidden');
    this.logger.debug('About modal shown');
  }

  /**
   * Hide about modal
   */
  hideAboutModal() {
    this.elements.aboutModal.classList.add('hidden');
    this.elements.aboutModal.setAttribute('aria-hidden', 'true');
    this.logger.debug('About modal hidden');
  }

  /**
   * Show error modal with message
   * @param {string} message - Error message
   */
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorModal.classList.remove('hidden');
    this.elements.errorModal.removeAttribute('aria-hidden');
    this.logger.error(`Error shown: ${message}`);
  }

  /**
   * Hide error modal
   */
  hideErrorModal() {
    this.elements.errorModal.classList.add('hidden');
    this.elements.errorModal.setAttribute('aria-hidden', 'true');
    this.logger.debug('Error modal hidden');
  }

  /**
   * Show save game modal with slot selector
   * @param {Object} saveGameManager - SaveGameManager instance
   * @param {Function} onSave - Callback when save is selected
   */
  showSaveGameModal(saveGameManager, onSave) {
    const modal = document.getElementById('save-modal');
    const container = document.getElementById('save-slots');

    // Clear existing slots
    container.innerHTML = '';

    // Get all save slots
    const slots = saveGameManager.getSaveSlots();

    // Create slot elements (exclude auto-save slot -1)
    slots
      .filter((slot) => slot.slot !== -1)
      .forEach((slot) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = slot.empty ? 'save-slot empty' : 'save-slot';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'save-slot-info';

        if (slot.empty) {
          const nameDiv = document.createElement('div');
          nameDiv.className = 'save-slot-name';
          nameDiv.textContent = `Slot ${slot.slot + 1} - Empty`;
          infoDiv.appendChild(nameDiv);
        } else {
          const nameDiv = document.createElement('div');
          nameDiv.className = 'save-slot-name';
          nameDiv.textContent = slot.saveName;
          infoDiv.appendChild(nameDiv);

          const metaDiv = document.createElement('div');
          metaDiv.className = 'save-slot-meta';
          const date = new Date(slot.timestamp);
          metaDiv.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} | ${slot.metadata?.title || 'Unknown'} | Score: ${slot.metadata?.score || 0}`;
          infoDiv.appendChild(metaDiv);
        }

        slotDiv.appendChild(infoDiv);

        // Add save button
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'save-slot-actions';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-slot-btn';
        saveBtn.textContent = slot.empty ? 'Save Here' : 'Overwrite';
        saveBtn.onclick = () => {
          const saveName = this.prompt(
            'Enter a name for this save:',
            slot.empty ? 'New Save' : slot.saveName
          );
          if (saveName) {
            onSave(slot.slot, saveName);
            this.hideSaveGameModal();
          }
        };
        actionsDiv.appendChild(saveBtn);

        // Add delete button if slot is not empty
        if (!slot.empty) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'save-slot-btn danger';
          deleteBtn.textContent = 'Delete';
          deleteBtn.onclick = () => {
            if (this.confirm(`Delete save "${slot.saveName}"?`)) {
              saveGameManager.deleteSlot(slot.slot);
              this.showSaveGameModal(saveGameManager, onSave); // Refresh
            }
          };
          actionsDiv.appendChild(deleteBtn);
        }

        slotDiv.appendChild(actionsDiv);

        // Add ARIA attributes
        slotDiv.setAttribute('role', 'listitem');
        slotDiv.setAttribute('aria-label', slot.empty ? `Slot ${slot.slot + 1} - Empty` : `${slot.saveName} - ${new Date(slot.timestamp).toLocaleString()}`);
        saveBtn.setAttribute('aria-label', slot.empty ? `Save to slot ${slot.slot + 1}` : `Overwrite save in slot ${slot.slot + 1}`);

        container.appendChild(slotDiv);
      });

    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');
    this.logger.debug('Save game modal shown');
  }

  /**
   * Hide save game modal
   */
  hideSaveGameModal() {
    const modal = document.getElementById('save-modal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    this.logger.debug('Save game modal hidden');
  }

  /**
   * Show load game modal with slot selector
   * @param {Object} saveGameManager - SaveGameManager instance
   * @param {Function} onLoad - Callback when load is selected
   */
  showLoadGameModal(saveGameManager, onLoad) {
    const modal = document.getElementById('load-modal');
    const container = document.getElementById('load-slots');

    // Clear existing slots
    container.innerHTML = '';

    // Get all save slots
    const slots = saveGameManager.getSaveSlots();

    // Filter only non-empty slots (including auto-save)
    const nonEmptySlots = slots.filter((slot) => !slot.empty);

    if (nonEmptySlots.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: var(--ega-light-gray);">No saved games found.</p>';
    } else {
      nonEmptySlots.forEach((slot) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'save-slot';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'save-slot-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'save-slot-name';
        nameDiv.textContent = slot.saveName;
        infoDiv.appendChild(nameDiv);

        const metaDiv = document.createElement('div');
        metaDiv.className = 'save-slot-meta';
        const date = new Date(slot.timestamp);
        metaDiv.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} | ${slot.metadata?.title || 'Unknown'} | Score: ${slot.metadata?.score || 0}`;
        infoDiv.appendChild(metaDiv);

        slotDiv.appendChild(infoDiv);

        // Add load button
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'save-slot-actions';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'save-slot-btn';
        loadBtn.textContent = 'Load';
        loadBtn.onclick = () => {
          onLoad(slot.slot);
          this.hideLoadGameModal();
        };
        actionsDiv.appendChild(loadBtn);

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'save-slot-btn danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
          if (this.confirm(`Delete save "${slot.saveName}"?`)) {
            saveGameManager.deleteSlot(slot.slot);
            this.showLoadGameModal(saveGameManager, onLoad); // Refresh
          }
        };
        actionsDiv.appendChild(deleteBtn);

        slotDiv.appendChild(actionsDiv);
        container.appendChild(slotDiv);
      });
    }

    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');
    this.logger.debug('Load game modal shown');
  }

  /**
   * Hide load game modal
   */
  hideLoadGameModal() {
    const modal = document.getElementById('load-modal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    this.logger.debug('Load game modal hidden');
  }

  /**
   * Show volume control modal
   * @param {Object} soundManager - SoundManager instance
   */
  showVolumeModal(soundManager) {
    const modal = document.getElementById('volume-modal');

    // Set current values
    const masterSlider = document.getElementById('master-volume');
    const musicSlider = document.getElementById('music-volume');
    const sfxSlider = document.getElementById('sfx-volume');
    const ambientSlider = document.getElementById('ambient-volume');

    masterSlider.value = Math.round(soundManager.masterVolume * 100);
    musicSlider.value = Math.round(
      soundManager.getCategoryVolume('music') * 100
    );
    sfxSlider.value = Math.round(soundManager.getCategoryVolume('sfx') * 100);
    ambientSlider.value = Math.round(
      soundManager.getCategoryVolume('ambient') * 100
    );

    // Update value displays
    document.getElementById('master-volume-value').textContent =
      `${masterSlider.value}%`;
    document.getElementById('music-volume-value').textContent =
      `${musicSlider.value}%`;
    document.getElementById('sfx-volume-value').textContent =
      `${sfxSlider.value}%`;
    document.getElementById('ambient-volume-value').textContent =
      `${ambientSlider.value}%`;

    // Add event listeners for real-time updates
    const updateVolume = (slider, valueSpan, callback) => {
      slider.oninput = () => {
        const value = parseInt(slider.value);
        valueSpan.textContent = `${value}%`;
        // Update ARIA attributes
        slider.setAttribute('aria-valuenow', value);
        slider.setAttribute('aria-valuetext', `${value} percent`);
        callback(value / 100);
      };
    };

    updateVolume(
      masterSlider,
      document.getElementById('master-volume-value'),
      (v) => soundManager.setMasterVolume(v)
    );
    updateVolume(
      musicSlider,
      document.getElementById('music-volume-value'),
      (v) => soundManager.setCategoryVolume('music', v)
    );
    updateVolume(sfxSlider, document.getElementById('sfx-volume-value'), (v) =>
      soundManager.setCategoryVolume('sfx', v)
    );
    updateVolume(
      ambientSlider,
      document.getElementById('ambient-volume-value'),
      (v) => soundManager.setCategoryVolume('ambient', v)
    );

    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');
    this.logger.debug('Volume control modal shown');
  }

  /**
   * Hide volume control modal
   */
  hideVolumeModal() {
    const modal = document.getElementById('volume-modal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    this.logger.debug('Volume control modal hidden');
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

  // ===== Achievement Notifications =====

  /**
   * Show achievement notification popup
   * @param {Object} achievement - Achievement data
   * @param {string} achievement.id - Achievement ID
   * @param {string} achievement.name - Achievement display name
   * @param {string} achievement.description - Achievement description
   * @param {number} achievement.points - Points awarded
   * @param {string} achievement.icon - Icon/emoji for achievement (default: 🏆)
   */
  showAchievementNotification(achievement) {
    const container = document.getElementById('achievement-container');
    if (!container) {
      this.logger.warn('Achievement container not found');
      return;
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.setAttribute('data-achievement-id', achievement.id);

    // Build notification HTML
    const icon = achievement.icon || '🏆';
    notification.innerHTML = `
      <div class="achievement-header">
        <div class="achievement-icon">${icon}</div>
        <div class="achievement-title">Achievement Unlocked!</div>
      </div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-description">${achievement.description}</div>
      <div class="achievement-points">+${achievement.points || 0} points</div>
    `;

    // Add to container
    container.appendChild(notification);

    // Play achievement sound if available
    if (window.gameManager && window.gameManager.soundManager) {
      try {
        window.gameManager.soundManager.playSound('achievement_unlock', {
          category: 'ui',
          volume: 0.8,
        });
      } catch (error) {
        this.logger.debug('Achievement sound not available');
      }
    }

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.hideAchievementNotification(notification);
    }, 5000);

    this.logger.debug(`Achievement notification shown: ${achievement.name}`);
  }

  /**
   * Hide achievement notification with animation
   * @param {HTMLElement} notification - Notification element to hide
   */
  hideAchievementNotification(notification) {
    notification.classList.add('hiding');

    // Remove from DOM after animation completes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300); // Match slideOutRight animation duration
  }

  /**
   * Clear all achievement notifications
   */
  clearAchievementNotifications() {
    const container = document.getElementById('achievement-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * Show achievement progress notification (for multi-step achievements)
   * @param {Object} achievement - Achievement data
   * @param {number} currentProgress - Current progress (e.g., 3)
   * @param {number} totalProgress - Total required (e.g., 5)
   */
  showAchievementProgress(achievement, currentProgress, totalProgress) {
    const container = document.getElementById('achievement-container');
    if (!container) {
      this.logger.warn('Achievement container not found');
      return;
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.setAttribute('data-achievement-id', achievement.id);

    // Build notification HTML
    const icon = achievement.icon || '📊';
    const progressPercent = Math.round((currentProgress / totalProgress) * 100);

    notification.innerHTML = `
      <div class="achievement-header">
        <div class="achievement-icon">${icon}</div>
        <div class="achievement-title">Achievement Progress</div>
      </div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-description">${currentProgress}/${totalProgress} ${achievement.description}</div>
      <div class="achievement-progress">
        <div class="achievement-progress-bar" style="width: ${progressPercent}%"></div>
      </div>
    `;

    // Add to container
    container.appendChild(notification);

    // Auto-dismiss after 3 seconds (shorter for progress updates)
    setTimeout(() => {
      this.hideAchievementNotification(notification);
    }, 3000);

    this.logger.debug(
      `Achievement progress shown: ${achievement.name} (${currentProgress}/${totalProgress})`
    );
  }

  // ===== Achievement Gallery =====

  /**
   * Show achievement gallery modal
   * @param {Object} gameProgression - GameProgression instance
   */
  showAchievementGallery(gameProgression) {
    const modal = document.getElementById('achievement-modal');
    const gallery = document.getElementById('achievement-gallery');
    const countSpan = document.getElementById('achievement-count');
    const pointsSpan = document.getElementById('achievement-points');

    if (!modal || !gallery) {
      this.logger.warn('Achievement modal elements not found');
      return;
    }

    // Clear existing content
    gallery.innerHTML = '';

    // Get achievements data
    const achievements = gameProgression.getAllAchievements();
    const unlockedAchievements = gameProgression.getUnlockedAchievements();
    const achievementProgress = gameProgression.achievementProgress || new Map();

    // Calculate statistics
    const totalAchievements = achievements.length;
    const unlockedCount = unlockedAchievements.size;
    const totalPoints = Array.from(unlockedAchievements).reduce(
      (sum, id) => {
        const achievement = achievements.find((a) => a.id === id);
        return sum + (achievement?.points || 0);
      },
      0
    );

    // Update stats display
    countSpan.textContent = `${unlockedCount}/${totalAchievements} Unlocked`;
    pointsSpan.textContent = `${totalPoints} Points`;

    // Create achievement cards
    achievements.forEach((achievement) => {
      const card = this.createAchievementCard(
        achievement,
        unlockedAchievements.has(achievement.id),
        achievementProgress.get(achievement.id)
      );
      gallery.appendChild(card);
    });

    // Show modal
    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');
    this.logger.debug('Achievement gallery shown');
  }

  /**
   * Create achievement card element
   * @private
   * @param {Object} achievement - Achievement data
   * @param {boolean} unlocked - Whether achievement is unlocked
   * @param {Object} progress - Progress data (for multi-step achievements)
   * @returns {HTMLElement} Achievement card element
   */
  createAchievementCard(achievement, unlocked, progress) {
    const card = document.createElement('div');
    card.className = `achievement-card ${unlocked ? '' : 'locked'}`;
    card.setAttribute('role', 'listitem');

    const icon = achievement.icon || '🏆';
    const iconHtml = unlocked ? icon : '🔒';

    let statusHtml = '';
    let progressBarHtml = '';
    let ariaLabel = '';

    if (progress && !unlocked) {
      const progressPercent = Math.round(
        (progress.current / progress.target) * 100
      );
      statusHtml = `<div class="achievement-card-status">Progress: ${progress.current}/${progress.target}</div>`;
      progressBarHtml = `
        <div class="achievement-card-progress" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100" aria-valuetext="${progressPercent} percent complete">
          <div class="achievement-card-progress-bar" style="width: ${progressPercent}%"></div>
        </div>
      `;
      ariaLabel = `${achievement.name}, ${achievement.points} points, Locked - Progress: ${progress.current} of ${progress.target}, ${progressPercent}% complete. ${achievement.description}`;
    } else if (unlocked) {
      statusHtml = `<div class="achievement-card-status">✓ Unlocked</div>`;
      ariaLabel = `${achievement.name}, ${achievement.points} points, Unlocked. ${achievement.description}`;
    } else {
      statusHtml = `<div class="achievement-card-status">Locked</div>`;
      ariaLabel = `${achievement.name}, ${achievement.points} points, Locked. ${achievement.description}`;
    }

    card.setAttribute('aria-label', ariaLabel);

    card.innerHTML = `
      <div class="achievement-card-icon" aria-hidden="true">${iconHtml}</div>
      <div class="achievement-card-content">
        <div class="achievement-card-header">
          <div class="achievement-card-name">${achievement.name}</div>
          <div class="achievement-card-points">${achievement.points || 0} pts</div>
        </div>
        <div class="achievement-card-description">${achievement.description}</div>
        ${statusHtml}
        ${progressBarHtml}
      </div>
    `;

    return card;
  }

  /**
   * Hide achievement gallery modal
   */
  hideAchievementGallery() {
    const modal = document.getElementById('achievement-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      this.logger.debug('Achievement gallery hidden');
    }
  }
}

export default UIManager;
