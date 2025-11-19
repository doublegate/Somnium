/**
 * SocialManager.js
 * Social features for sharing saves, worlds, achievements, and screenshots
 */

export class SocialManager {
  constructor(gameManager) {
    this.gameManager = gameManager;

    this.shareEndpoint = '/api/share';
    this.shareUrl = window.location.origin;

    this.logger = console;
  }

  /**
   * Share save game
   * @param {number} slot - Save game slot
   * @param {Object} options - Share options
   */
  async shareSaveGame(slot, options = {}) {
    const saveData = this.gameManager.saveGameManager.loadGame(slot);

    if (!saveData) {
      throw new Error(`No save game found in slot ${slot}`);
    }

    const shareData = {
      type: 'save',
      data: saveData,
      title: options.title || `My ${saveData.worldTitle} Adventure`,
      description: options.description || `Save game from ${saveData.currentRoom}`,
      public: options.public !== false,
    };

    return this.shareContent(shareData);
  }

  /**
   * Share custom world
   * @param {Object} worldData - World JSON data
   * @param {Object} options - Share options
   */
  async shareWorld(worldData, options = {}) {
    const shareData = {
      type: 'world',
      data: worldData,
      title: options.title || worldData.metadata.title,
      description: options.description || worldData.metadata.description,
      author: worldData.metadata.author,
      genre: worldData.metadata.genre,
      public: options.public !== false,
      tags: options.tags || [],
    };

    return this.shareContent(shareData);
  }

  /**
   * Share achievement
   * @param {string} achievementId - Achievement identifier
   */
  async shareAchievement(achievementId) {
    const achievement = this.gameManager.gameProgression.achievements.find(
      (a) => a.id === achievementId
    );

    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`);
    }

    const shareData = {
      type: 'achievement',
      data: achievement,
      title: `I unlocked: ${achievement.name}!`,
      description: achievement.description,
      points: achievement.points,
    };

    return this.shareContent(shareData);
  }

  /**
   * Share screenshot
   * @param {HTMLCanvasElement} canvas - Canvas to capture
   * @param {Object} options - Share options
   */
  async shareScreenshot(canvas, options = {}) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        try {
          const shareData = {
            type: 'screenshot',
            blob,
            title: options.title || 'My Somnium Adventure',
            description: options.description || 'Check out this moment from my adventure!',
          };

          const result = await this.shareContent(shareData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 'image/png');
    });
  }

  /**
   * Generic share content method
   * @param {Object} shareData - Content to share
   */
  async shareContent(shareData) {
    // Try Web Share API first (mobile-friendly)
    if (navigator.share && shareData.type !== 'world') {
      try {
        const webShareData = {
          title: shareData.title,
          text: shareData.description,
        };

        // Add file for screenshots
        if (shareData.blob) {
          const file = new File([shareData.blob], 'screenshot.png', {
            type: 'image/png',
          });
          webShareData.files = [file];
        }

        await navigator.share(webShareData);

        return {
          success: true,
          method: 'native',
          message: 'Shared successfully',
        };
      } catch (error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            method: 'native',
            message: 'Share canceled',
          };
        }
        // Fall through to custom share
      }
    }

    // Custom share (upload to server, get shareable link)
    return this.uploadAndShare(shareData);
  }

  /**
   * Upload content and get shareable link
   * @param {Object} shareData - Content to share
   */
  async uploadAndShare(shareData) {
    try {
      const formData = new FormData();
      formData.append('type', shareData.type);
      formData.append('title', shareData.title);
      formData.append('description', shareData.description);

      if (shareData.blob) {
        formData.append('file', shareData.blob, 'screenshot.png');
      } else {
        formData.append('data', JSON.stringify(shareData.data));
      }

      if (shareData.public !== undefined) {
        formData.append('public', shareData.public);
      }

      if (shareData.tags) {
        formData.append('tags', JSON.stringify(shareData.tags));
      }

      const response = await fetch(this.shareEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Share upload failed');
      }

      const result = await response.json();
      const shareUrl = `${this.shareUrl}/shared/${result.id}`;

      // Show share modal with options
      this.showShareModal(shareUrl, shareData);

      return {
        success: true,
        method: 'custom',
        url: shareUrl,
        id: result.id,
      };
    } catch (error) {
      this.logger.error('[SocialManager] Share failed:', error);

      return {
        success: false,
        method: 'custom',
        error: error.message,
      };
    }
  }

  /**
   * Show share modal with social media options
   * @param {string} url - Shareable URL
   * @param {Object} shareData - Share metadata
   */
  showShareModal(url, shareData) {
    const modal = this.createShareModal(url, shareData);
    document.body.appendChild(modal);

    modal.querySelector('.share-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * Create share modal HTML
   */
  createShareModal(url, shareData) {
    const modal = document.createElement('div');
    modal.className = 'social-share-modal';
    modal.innerHTML = `
      <div class="social-share-content">
        <h2>Share</h2>
        <button class="share-close">&times;</button>

        <p class="share-url-label">Shareable Link:</p>
        <div class="share-url-container">
          <input type="text" class="share-url-input" value="${url}" readonly>
          <button class="share-copy-btn">Copy</button>
        </div>

        <p class="share-social-label">Share on:</p>
        <div class="share-social-buttons">
          <button class="share-btn share-twitter" data-platform="twitter">
            <span>𝕏</span> Twitter
          </button>
          <button class="share-btn share-facebook" data-platform="facebook">
            <span>f</span> Facebook
          </button>
          <button class="share-btn share-reddit" data-platform="reddit">
            <span>R</span> Reddit
          </button>
          <button class="share-btn share-discord" data-platform="discord">
            <span>D</span> Discord
          </button>
        </div>

        <div class="share-embed-section">
          <p class="share-embed-label">Embed Code:</p>
          <textarea class="share-embed-code" readonly><iframe src="${url}" width="640" height="480"></iframe></textarea>
        </div>
      </div>
    `;

    // Copy URL button
    modal.querySelector('.share-copy-btn').addEventListener('click', () => {
      const input = modal.querySelector('.share-url-input');
      input.select();
      document.execCommand('copy');

      const btn = modal.querySelector('.share-copy-btn');
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy'), 2000);
    });

    // Social media buttons
    modal.querySelectorAll('.share-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        this.shareToSocialMedia(platform, url, shareData);
      });
    });

    return modal;
  }

  /**
   * Share to social media platforms
   */
  shareToSocialMedia(platform, url, shareData) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(shareData.title);
    const encodedDescription = encodeURIComponent(shareData.description);

    let shareUrl;

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'discord':
        // Discord doesn't have a direct share URL, copy to clipboard instead
        this.copyToClipboard(`${shareData.title}\n${url}`);
        alert('Link copied to clipboard! Paste it in Discord.');
        return;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  /**
   * Copy text to clipboard
   */
  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * Load shared content
   * @param {string} shareId - Share identifier
   */
  async loadSharedContent(shareId) {
    try {
      const response = await fetch(`${this.shareEndpoint}/${shareId}`);

      if (!response.ok) {
        throw new Error('Failed to load shared content');
      }

      const data = await response.json();

      return {
        success: true,
        type: data.type,
        content: data.content,
        metadata: data.metadata,
      };
    } catch (error) {
      this.logger.error('[SocialManager] Load shared content failed:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Browse community-shared worlds
   * @param {Object} filters - Search filters
   */
  async browseSharedWorlds(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        type: 'world',
        genre: filters.genre || '',
        sort: filters.sort || 'popular',
        page: filters.page || 1,
      });

      const response = await fetch(`${this.shareEndpoint}?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to browse shared worlds');
      }

      const data = await response.json();

      return {
        success: true,
        worlds: data.worlds,
        total: data.total,
        page: data.page,
      };
    } catch (error) {
      this.logger.error('[SocialManager] Browse failed:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Rate shared content
   * @param {string} shareId - Share identifier
   * @param {number} rating - Rating (1-5)
   */
  async rateContent(shareId, rating) {
    try {
      const response = await fetch(`${this.shareEndpoint}/${shareId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error('Failed to rate content');
      }

      return { success: true };
    } catch (error) {
      this.logger.error('[SocialManager] Rating failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Report inappropriate content
   * @param {string} shareId - Share identifier
   * @param {string} reason - Report reason
   */
  async reportContent(shareId, reason) {
    try {
      const response = await fetch(`${this.shareEndpoint}/${shareId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to report content');
      }

      return { success: true };
    } catch (error) {
      this.logger.error('[SocialManager] Report failed:', error);
      return { success: false, error: error.message };
    }
  }
}
