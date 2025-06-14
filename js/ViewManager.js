/**
 * ViewManager - Manages all animated sprites and moving objects
 *
 * Responsibilities:
 * - Manage sprite animations with VIEW resource structure
 * - Handle character movement with smooth interpolation
 * - Implement animation loops with timing control
 * - Coordinate with priority system for proper z-ordering
 * - Collision detection with bounding boxes
 * - Sprite pooling and batch rendering
 * - Sprite effects (mirroring, scaling)
 *
 * VIEW Resource Structure:
 * - Each VIEW contains multiple loops (walk left, walk right, idle, etc.)
 * - Each loop contains multiple cells (animation frames)
 * - Each cell contains pixel data and metadata (dimensions, anchor point)
 */

// View effect constants
export const ViewEffects = {
  GHOST: 1, // 50% transparency
  INVERTED: 2, // Color inversion
  FLASHING: 4, // Flashing effect
  OUTLINED: 8, // Black outline
};

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

    // Sprite pool for performance
    this.spritePool = [];
    this.poolSize = 0;

    // Collision detection
    this.collisionEnabled = true;
    this.collisionMap = new Map();

    // Batch rendering
    this.renderBatch = [];
    this.batchCanvas = null;
    this.batchCtx = null;

    // Initialize batch canvas
    this.initBatchCanvas();
  }

  /**
   * Initialize batch rendering canvas
   * @private
   */
  initBatchCanvas() {
    this.batchCanvas = document.createElement('canvas');
    this.batchCanvas.width = 640;
    this.batchCanvas.height = 400;
    this.batchCtx = this.batchCanvas.getContext('2d');
    this.batchCtx.imageSmoothingEnabled = false;
  }

  /**
   * Create new sprite from VIEW data
   * @param {string} id - Unique identifier
   * @param {Object} viewData - VIEW resource with loops and cells
   * @returns {Object} Created view instance
   */
  createView(id, viewData) {
    if (this.views.has(id)) {
      console.warn(`View with id ${id} already exists`);
      return this.views.get(id);
    }

    // Get view from pool if available
    const view = this.getFromPool() || {
      id: '',
      data: null,
      x: 0,
      y: 0,
      currentLoop: 0,
      currentCell: 0,
      cellTime: 0,
      visible: true,
      priority: 0,
      scale: 1,
      mirrored: false,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      velocity: { x: 0, y: 0 },
      moving: false,
      loopCallback: null,
      effectMask: 0,
    };

    // Initialize view properties
    view.id = id;
    view.data = this.validateViewData(viewData);
    view.x = viewData.x || 0;
    view.y = viewData.y || 0;
    view.currentLoop = viewData.defaultLoop || 0;
    view.currentCell = 0;
    view.cellTime = 0;
    view.visible = viewData.visible !== false;
    view.priority = viewData.priority || this.calculatePriority(view.y);
    view.scale = viewData.scale || 1;
    view.mirrored = viewData.mirrored || false;
    view.effectMask = viewData.effectMask || 0;

    // Calculate initial bounding box
    this.updateBoundingBox(view);

    this.views.set(id, view);
    console.log(`Created view: ${id} with ${view.data.loops.length} loops`);
    return view;
  }

  /**
   * Remove a view
   * @param {string} id - View ID to remove
   */
  removeView(id) {
    const view = this.views.get(id);
    if (view) {
      // Return view to pool for reuse
      this.returnToPool(view);
    }
    this.views.delete(id);
    this.movements.delete(id);
  }

  /**
   * Validate and normalize VIEW data structure
   * @private
   * @param {Object} viewData - Raw VIEW data
   * @returns {Object} Normalized VIEW data
   */
  validateViewData(viewData) {
    const normalized = {
      loops: [],
      description: viewData.description || '',
    };

    // Ensure loops array exists
    const loops = viewData.loops || [];
    if (Array.isArray(loops)) {
      normalized.loops = loops.map((loop) => this.validateLoop(loop));
    } else if (typeof loops === 'object') {
      // Convert object format to array format
      normalized.loops = Object.entries(loops).map(([name, loop]) => ({
        ...this.validateLoop(loop),
        name,
      }));
    }

    return normalized;
  }

  /**
   * Validate and normalize loop data
   * @private
   * @param {Object} loopData - Raw loop data
   * @returns {Object} Normalized loop data
   */
  validateLoop(loopData) {
    return {
      name: loopData.name || 'unnamed',
      cells: (loopData.cells || loopData.frames || []).map((cell) =>
        this.validateCell(cell)
      ),
      repeat: loopData.repeat !== false,
      speed: loopData.speed || 1.0,
    };
  }

  /**
   * Validate and normalize cell data
   * @private
   * @param {Object} cellData - Raw cell data
   * @returns {Object} Normalized cell data
   */
  validateCell(cellData) {
    return {
      width: cellData.width || 16,
      height: cellData.height || 16,
      anchorX: cellData.anchorX || cellData.width / 2 || 8,
      anchorY: cellData.anchorY || cellData.height || 16,
      duration: cellData.duration || 100, // milliseconds
      pixels: cellData.pixels || [],
      transparentColor: cellData.transparentColor ?? 0,
    };
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
    if (!loop || !loop.cells || loop.cells.length === 0) return;

    // Update cell timing
    let currentCell = loop.cells[view.currentCell];
    view.cellTime +=
      deltaTime * this.animationSpeed * (loop.speed || 1.0) * 1000; // Convert to ms

    // Check if it's time to advance cell
    while (view.cellTime >= currentCell.duration) {
      view.cellTime -= currentCell.duration; // Preserve overflow time
      view.currentCell++;

      // Handle loop completion
      if (view.currentCell >= loop.cells.length) {
        if (loop.repeat) {
          view.currentCell = 0;
          // Trigger loop callback when looping back to start
          if (view.loopCallback) {
            view.loopCallback(view.id, view.currentLoop);
          }
        } else {
          view.currentCell = loop.cells.length - 1;
          view.cellTime = 0; // Reset timing for non-repeating animations
          // Trigger loop callback when animation ends
          if (view.loopCallback) {
            view.loopCallback(view.id, view.currentLoop);
          }
          break; // Stop advancing for non-repeating animations
        }
      }

      // Update currentCell reference for next iteration
      currentCell = loop.cells[view.currentCell];
    }

    // Update bounding box for new cell
    this.updateBoundingBox(view);
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
   * @param {number|string} loop - Loop index or name
   * @param {Function} callback - Optional callback when loop completes
   */
  setLoop(id, loop, callback = null) {
    const view = this.views.get(id);
    if (!view) return;

    let loopIndex = -1;

    // Handle loop by index or name
    if (typeof loop === 'number') {
      loopIndex = loop;
    } else if (typeof loop === 'string') {
      loopIndex = view.data.loops.findIndex((l) => l.name === loop);
    }

    if (loopIndex >= 0 && loopIndex < view.data.loops.length) {
      view.currentLoop = loopIndex;
      view.currentCell = 0;
      view.cellTime = 0;
      view.loopCallback = callback;
      this.updateBoundingBox(view);
    } else {
      console.warn(`Loop ${loop} not found for view ${id}`);
    }
  }

  /**
   * Update view's bounding box based on current cell
   * @private
   * @param {Object} view - View instance
   */
  updateBoundingBox(view) {
    const loop = view.data.loops[view.currentLoop];
    if (!loop || !loop.cells[view.currentCell]) return;

    const cell = loop.cells[view.currentCell];
    view.boundingBox = {
      x: view.x - cell.anchorX * view.scale,
      y: view.y - cell.anchorY * view.scale,
      width: cell.width * view.scale,
      height: cell.height * view.scale,
    };
  }

  /**
   * Calculate priority based on Y position
   * @private
   * @param {number} y - Y position (0-200)
   * @returns {number} Priority value (0-15)
   */
  calculatePriority(y) {
    // Map Y position to priority bands (Sierra-style)
    // Higher Y = higher priority (drawn later)
    return Math.floor((y / 200) * 15);
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
   * Draw all active views with interpolation and batch rendering
   * @param {number} interpolation - Interpolation value (0-1) for smooth motion
   */
  renderAll(interpolation = 0) {
    // Clear batch canvas
    this.batchCtx.clearRect(0, 0, 640, 400);

    // Sort views by Y position for proper z-order
    const sortedViews = Array.from(this.views.values())
      .filter((view) => view.visible)
      .sort((a, b) => {
        // First sort by priority band
        const priorityDiff = a.priority - b.priority;
        if (priorityDiff !== 0) return priorityDiff;
        // Then by Y position within same priority
        return a.y - b.y;
      });

    // Batch render all views
    this.renderBatch = sortedViews;
    sortedViews.forEach((view) => {
      this.renderView(view, interpolation, this.batchCtx);
    });

    // Draw batch to main canvas
    this.sceneRenderer.ctx.drawImage(this.batchCanvas, 0, 0);
  }

  /**
   * Draw a single view with interpolation and effects
   * @private
   * @param {Object} view - View object
   * @param {number} interpolation - Interpolation value for smooth motion
   * @param {CanvasRenderingContext2D} ctx - Canvas context to draw to
   */
  renderView(view, interpolation = 0, ctx = null) {
    const context = ctx || this.sceneRenderer.ctx;
    const loop = view.data.loops[view.currentLoop];
    if (!loop || !loop.cells || loop.cells.length === 0) return;

    const cell = loop.cells[view.currentCell];
    if (!cell || !cell.pixels || cell.pixels.length === 0) return;

    // Calculate interpolated position if moving
    let renderX = view.x;
    let renderY = view.y;

    const movement = this.movements.get(view.id);
    if (movement) {
      const progress = Math.min(
        movement.elapsed / movement.duration + interpolation * 0.016,
        1
      );
      renderX =
        movement.startX + (movement.targetX - movement.startX) * progress;
      renderY =
        movement.startY + (movement.targetY - movement.startY) * progress;
    }

    // Calculate draw position (account for anchor point)
    const drawX = Math.floor((renderX - cell.anchorX * view.scale) * 2); // Scale to 640x400
    const drawY = Math.floor((renderY - cell.anchorY * view.scale) * 2);

    // Save context state for effects
    context.save();

    // Apply sprite effects
    if (view.mirrored) {
      context.scale(-1, 1);
      context.translate(-drawX * 2 - cell.width * 2 * view.scale, 0);
    }

    // Apply effect mask
    if (view.effectMask & ViewEffects.GHOST) {
      context.globalAlpha = 0.5;
    }
    if (view.effectMask & ViewEffects.INVERTED) {
      context.globalCompositeOperation = 'difference';
    }

    // Draw sprite pixels
    cell.pixels.forEach((pixel) => {
      const [x, y, colorIndex] = pixel;

      // Skip transparent pixels
      if (colorIndex === cell.transparentColor) return;

      const color = this.getEGAColor(colorIndex);
      context.fillStyle = color;

      const pixelX = view.mirrored
        ? drawX + (cell.width - x - 1) * 2 * view.scale
        : drawX + x * 2 * view.scale;
      const pixelY = drawY + y * 2 * view.scale;

      context.fillRect(pixelX, pixelY, 2 * view.scale, 2 * view.scale);
    });

    // Restore context state
    context.restore();

    // Debug: Draw bounding box
    if (this.sceneRenderer.debugMode) {
      this.drawBoundingBox(view, context);
    }
  }

  /**
   * Draw debug bounding box for view
   * @private
   * @param {Object} view - View object
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawBoundingBox(view, ctx) {
    ctx.strokeStyle = '#FF55FF';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      view.boundingBox.x * 2,
      view.boundingBox.y * 2,
      view.boundingBox.width * 2,
      view.boundingBox.height * 2
    );
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

  /**
   * Check collision between two views
   * @param {string} id1 - First view ID
   * @param {string} id2 - Second view ID
   * @returns {boolean} True if views are colliding
   */
  checkCollision(id1, id2) {
    if (!this.collisionEnabled) return false;

    const view1 = this.views.get(id1);
    const view2 = this.views.get(id2);
    if (!view1 || !view2) return false;

    return this.checkBoundingBoxCollision(view1.boundingBox, view2.boundingBox);
  }

  /**
   * Check if view collides with any other view
   * @param {string} id - View ID to check
   * @returns {Array<string>} Array of colliding view IDs
   */
  getCollisions(id) {
    if (!this.collisionEnabled) return [];

    const view = this.views.get(id);
    if (!view) return [];

    const collisions = [];
    this.views.forEach((otherView, otherId) => {
      if (
        otherId !== id &&
        otherView.visible &&
        this.checkBoundingBoxCollision(view.boundingBox, otherView.boundingBox)
      ) {
        collisions.push(otherId);
      }
    });

    return collisions;
  }

  /**
   * Check collision between two bounding boxes
   * @private
   * @param {Object} box1 - First bounding box
   * @param {Object} box2 - Second bounding box
   * @returns {boolean} True if boxes overlap
   */
  checkBoundingBoxCollision(box1, box2) {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  /**
   * Set view effect mask
   * @param {string} id - View ID
   * @param {number} effectMask - Bitmask of effects to apply
   */
  setEffectMask(id, effectMask) {
    const view = this.views.get(id);
    if (view) {
      view.effectMask = effectMask;
    }
  }

  /**
   * Mirror view horizontally
   * @param {string} id - View ID
   * @param {boolean} mirrored - Whether to mirror the view
   */
  setMirrored(id, mirrored) {
    const view = this.views.get(id);
    if (view) {
      view.mirrored = mirrored;
    }
  }

  /**
   * Set view scale
   * @param {string} id - View ID
   * @param {number} scale - Scale factor (1.0 = normal)
   */
  setScale(id, scale) {
    const view = this.views.get(id);
    if (view) {
      view.scale = Math.max(0.5, Math.min(3.0, scale));
      this.updateBoundingBox(view);
    }
  }

  /**
   * Get view from sprite pool
   * @private
   * @returns {Object|null} Pooled view or null
   */
  getFromPool() {
    return this.spritePool.pop() || null;
  }

  /**
   * Return view to sprite pool
   * @private
   * @param {Object} view - View to return to pool
   */
  returnToPool(view) {
    if (this.spritePool.length < 50) {
      // Reset view properties
      view.id = '';
      view.visible = false;
      view.loopCallback = null;
      this.spritePool.push(view);
    }
  }

  /**
   * Get view priority at current position
   * @param {string} id - View ID
   * @returns {number} Priority value (0-15)
   */
  getViewPriority(id) {
    const view = this.views.get(id);
    return view ? view.priority : 0;
  }

  /**
   * Update view priority based on Y position
   * @param {string} id - View ID
   */
  updateViewPriority(id) {
    const view = this.views.get(id);
    if (view) {
      view.priority = this.calculatePriority(view.y);
    }
  }
}
