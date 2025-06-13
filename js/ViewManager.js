/**
 * ViewManager - Manages all animated sprites and moving objects
 *
 * Responsibilities:
 * - Manage sprite animations
 * - Handle character movement
 * - Implement animation loops
 * - Coordinate with priority system
 * - Update sprite positions
 */

export class ViewManager {
  /**
   * @param {SceneRenderer} sceneRenderer - Reference to scene renderer for priority checking
   */
  constructor(sceneRenderer) {
    this.sceneRenderer = sceneRenderer;

    // Active views (sprites)
    this.views = new Map();

    // Animation timing
    this.animationSpeed = 1.0;

    // Movement tracking
    this.movements = new Map();
  }

  /**
   * Create new sprite from data
   * @param {string} id - Unique identifier
   * @param {Object} viewData - Object with animation loops
   */
  createView(id, viewData) {
    if (this.views.has(id)) {
      console.warn(`View with id ${id} already exists`);
      return;
    }

    const view = {
      id: id,
      data: viewData,
      x: viewData.x || 0,
      y: viewData.y || 0,
      currentLoop: viewData.defaultLoop || Object.keys(viewData.loops)[0],
      currentFrame: 0,
      frameTime: 0,
      visible: true,
      priority: viewData.priority || 0,
      scale: viewData.scale || 1,
    };

    this.views.set(id, view);
    console.log(`Created view: ${id}`);
  }

  /**
   * Remove a view
   * @param {string} id - View ID to remove
   */
  removeView(id) {
    this.views.delete(id);
    this.movements.delete(id);
  }

  /**
   * Update animation for view
   * @param {string} id - View ID
   * @param {number} deltaTime - Time since last update (seconds)
   */
  updateView(id, deltaTime) {
    const view = this.views.get(id);
    if (!view || !view.visible) return;

    const loop = view.data.loops[view.currentLoop];
    if (!loop || !loop.frames || loop.frames.length === 0) return;

    // Update frame timing
    view.frameTime += deltaTime * this.animationSpeed;

    const frameDuration = loop.frameDuration || 0.1; // Default 100ms per frame

    // Check if it's time to advance frame
    if (view.frameTime >= frameDuration) {
      view.frameTime = 0;
      view.currentFrame++;

      // Loop or stop at end
      if (view.currentFrame >= loop.frames.length) {
        if (loop.repeat !== false) {
          view.currentFrame = 0;
        } else {
          view.currentFrame = loop.frames.length - 1;
        }
      }
    }
  }

  /**
   * Update animations only (variable timestep)
   * @param {number} deltaTime - Time since last update (seconds)
   */
  updateAnimations(deltaTime) {
    // Update animations
    this.views.forEach((view, id) => {
      this.updateView(id, deltaTime);
    });
  }

  /**
   * Update positions only (fixed timestep)
   * @param {number} deltaTime - Fixed timestep (seconds)
   */
  updatePositions(deltaTime) {
    // Update movements
    this.updateMovements(deltaTime);
  }

  /**
   * Update all views (legacy method for compatibility)
   * @param {number} deltaTime - Time since last update (seconds)
   */
  updateAll(_deltaTime) {
    this.updateAnimations(_deltaTime);
    this.updatePositions(_deltaTime);
  }

  /**
   * Move view to position over time
   * @param {string} id - View ID
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   * @param {number} duration - Movement duration in seconds
   */
  moveView(id, x, y, duration) {
    const view = this.views.get(id);
    if (!view) return;

    // Create movement data
    const movement = {
      startX: view.x,
      startY: view.y,
      targetX: x,
      targetY: y,
      duration: duration,
      elapsed: 0,
    };

    this.movements.set(id, movement);
  }

  /**
   * Set view position immediately
   * @param {string} id - View ID
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(id, x, y) {
    const view = this.views.get(id);
    if (view) {
      view.x = x;
      view.y = y;
      this.movements.delete(id); // Cancel any movement
    }
  }

  /**
   * Change animation loop
   * @param {string} id - View ID
   * @param {string} loopName - Name of the loop to play
   */
  setLoop(id, loopName) {
    const view = this.views.get(id);
    if (!view) return;

    if (view.data.loops[loopName]) {
      view.currentLoop = loopName;
      view.currentFrame = 0;
      view.frameTime = 0;
    } else {
      console.warn(`Loop ${loopName} not found for view ${id}`);
    }
  }

  /**
   * Set view visibility
   * @param {string} id - View ID
   * @param {boolean} visible - Whether view should be visible
   */
  setVisible(id, visible) {
    const view = this.views.get(id);
    if (view) {
      view.visible = visible;
    }
  }

  /**
   * Draw all active views with interpolation
   * @param {number} interpolation - Interpolation value (0-1) for smooth motion
   */
  renderAll(interpolation = 0) {
    // Sort views by priority (lower priority drawn first)
    const sortedViews = Array.from(this.views.values())
      .filter((view) => view.visible)
      .sort((a, b) => a.priority - b.priority);

    // Draw each view
    sortedViews.forEach((view) => {
      this.renderView(view, interpolation);
    });
  }

  /**
   * Draw a single view with interpolation
   * @private
   * @param {Object} view - View object
   * @param {number} interpolation - Interpolation value for smooth motion
   */
  renderView(view, interpolation = 0) {
    const loop = view.data.loops[view.currentLoop];
    if (!loop || !loop.frames || loop.frames.length === 0) return;

    const frame = loop.frames[view.currentFrame];
    if (!frame) return;

    // Get canvas context
    const ctx = this.sceneRenderer.ctx;

    // Calculate interpolated position if moving
    let renderX = view.x;
    let renderY = view.y;

    if (view.moving && view.startX !== undefined) {
      const progress =
        view.progress + interpolation * (1 / (view.duration * 60));
      renderX =
        view.startX + (view.targetX - view.startX) * Math.min(progress, 1);
      renderY =
        view.startY + (view.targetY - view.startY) * Math.min(progress, 1);
    }

    // Calculate position (account for sprite anchor point)
    const anchorX = frame.anchorX || 0;
    const anchorY = frame.anchorY || 0;
    const drawX = (renderX - anchorX) * 2; // Scale to 640x400
    const drawY = (renderY - anchorY) * 2;

    // Draw sprite pixels
    if (frame.pixels) {
      frame.pixels.forEach((pixel) => {
        const [x, y, colorIndex] = pixel;
        const color = this.getEGAColor(colorIndex);

        ctx.fillStyle = color;
        ctx.fillRect(
          drawX + x * 2 * view.scale,
          drawY + y * 2 * view.scale,
          2 * view.scale,
          2 * view.scale
        );
      });
    }
  }

  /**
   * Update all movements
   * @private
   * @param {number} deltaTime - Time since last update
   */
  updateMovements(deltaTime) {
    const completedMovements = [];

    this.movements.forEach((movement, id) => {
      const view = this.views.get(id);
      if (!view) {
        completedMovements.push(id);
        return;
      }

      movement.elapsed += deltaTime;

      if (movement.elapsed >= movement.duration) {
        // Movement complete
        view.x = movement.targetX;
        view.y = movement.targetY;
        completedMovements.push(id);
      } else {
        // Interpolate position
        const progress = movement.elapsed / movement.duration;
        view.x =
          movement.startX + (movement.targetX - movement.startX) * progress;
        view.y =
          movement.startY + (movement.targetY - movement.startY) * progress;
      }
    });

    // Remove completed movements
    completedMovements.forEach((id) => this.movements.delete(id));
  }

  /**
   * Get EGA color from palette index
   * @private
   * @param {number} index - Color index (0-15)
   * @returns {string} Hex color string
   */
  getEGAColor(index) {
    const egaColors = [
      '#000000',
      '#0000AA',
      '#00AA00',
      '#00AAAA',
      '#AA0000',
      '#AA00AA',
      '#AA5500',
      '#AAAAAA',
      '#555555',
      '#5555FF',
      '#55FF55',
      '#55FFFF',
      '#FF5555',
      '#FF55FF',
      '#FFFF55',
      '#FFFFFF',
    ];

    return egaColors[index] || '#000000';
  }

  /**
   * Check if view is at specific position
   * @param {string} id - View ID
   * @param {number} x - X position to check
   * @param {number} y - Y position to check
   * @param {number} tolerance - Position tolerance
   * @returns {boolean} Whether view is at position
   */
  isViewAt(id, x, y, tolerance = 1) {
    const view = this.views.get(id);
    if (!view) return false;

    return (
      Math.abs(view.x - x) <= tolerance && Math.abs(view.y - y) <= tolerance
    );
  }

  /**
   * Get view by ID
   * @param {string} id - View ID
   * @returns {Object|null} View object or null
   */
  getView(id) {
    return this.views.get(id) || null;
  }

  /**
   * Get all view IDs
   * @returns {Array<string>} Array of view IDs
   */
  getAllViewIds() {
    return Array.from(this.views.keys());
  }

  /**
   * Set animation speed multiplier
   * @param {number} speed - Speed multiplier (1.0 = normal)
   */
  setAnimationSpeed(speed) {
    this.animationSpeed = Math.max(0.1, Math.min(5.0, speed));
  }
}
