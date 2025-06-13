/**
 * SceneRenderer - Handles all background rendering using vector primitives
 *
 * Responsibilities:
 * - Draw vector primitives
 * - Implement EGA palette
 * - Handle dithering patterns
 * - Maintain priority/depth system
 * - Optimize canvas operations
 */

export class SceneRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - The game canvas element
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // EGA color palette (16 colors)
    this.egaPalette = {
      '#000000': 0, // Black
      '#0000AA': 1, // Blue
      '#00AA00': 2, // Green
      '#00AAAA': 3, // Cyan
      '#AA0000': 4, // Red
      '#AA00AA': 5, // Magenta
      '#AA5500': 6, // Brown
      '#AAAAAA': 7, // Light Gray
      '#555555': 8, // Dark Gray
      '#5555FF': 9, // Light Blue
      '#55FF55': 10, // Light Green
      '#55FFFF': 11, // Light Cyan
      '#FF5555': 12, // Light Red
      '#FF55FF': 13, // Light Magenta
      '#FFFF55': 14, // Yellow
      '#FFFFFF': 15, // White
    };

    // Reverse palette for index to color lookup
    this.egaColors = [
      '#000000', // 0: Black
      '#0000AA', // 1: Blue
      '#00AA00', // 2: Green
      '#00AAAA', // 3: Cyan
      '#AA0000', // 4: Red
      '#AA00AA', // 5: Magenta
      '#AA5500', // 6: Brown
      '#AAAAAA', // 7: Light Gray
      '#555555', // 8: Dark Gray
      '#5555FF', // 9: Light Blue
      '#55FF55', // 10: Light Green
      '#55FFFF', // 11: Light Cyan
      '#FF5555', // 12: Light Red
      '#FF55FF', // 13: Light Magenta
      '#FFFF55', // 14: Yellow
      '#FFFFFF', // 15: White
    ];

    // Alternative color names mapping
    this.colorNames = {
      black: 0,
      blue: 1,
      green: 2,
      cyan: 3,
      red: 4,
      magenta: 5,
      brown: 6,
      lightgray: 7,
      darkgray: 8,
      lightblue: 9,
      lightgreen: 10,
      lightcyan: 11,
      lightred: 12,
      lightmagenta: 13,
      yellow: 14,
      white: 15,
    };

    // Priority buffer for depth testing (320x200)
    this.priorityBuffer = new Uint8Array(320 * 200);

    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;

    // Dithering patterns (2x2)
    this.ditherPatterns = {
      // Basic percentage patterns
      0: [
        [0, 0],
        [0, 0],
      ], // 0% (solid color 1)
      1: [
        [1, 0],
        [0, 0],
      ], // 25%
      2: [
        [1, 0],
        [0, 1],
      ], // 50% (checkerboard)
      3: [
        [1, 1],
        [1, 0],
      ], // 75%
      4: [
        [1, 1],
        [1, 1],
      ], // 100% (solid color 2)
      // Additional patterns
      5: [
        [1, 1],
        [0, 0],
      ], // Horizontal lines
      6: [
        [1, 0],
        [1, 0],
      ], // Vertical lines
      7: [
        [0, 1],
        [1, 0],
      ], // Diagonal (alternate checkerboard)
      8: [
        [0, 1],
        [0, 1],
      ], // Vertical lines (alternate)
    };

    // Priority bands for Y-coordinate based depth
    this.priorityBands = 15; // 15 bands (1-15), 0 is reserved for no priority
    this.bandHeight = 200 / this.priorityBands;

    // Double buffering for flicker-free rendering
    this.backBuffer = document.createElement('canvas');
    this.backBuffer.width = 640;
    this.backBuffer.height = 400;
    this.backCtx = this.backBuffer.getContext('2d');
    this.backCtx.imageSmoothingEnabled = false;

    // Scene cache for performance
    this.sceneCache = null;
    this.currentRoomId = null;

    // Debug mode
    this.debugMode = false;
    this.showPriorityMap = false;
    this.showGrid = false;
  }

  /**
   * Draw complete room background
   * @param {Object} roomGraphics - Room graphics object with primitives array
   * @param {string} [roomId] - Optional room ID for caching
   */
  renderRoom(roomGraphics, roomId = null) {
    if (!roomGraphics || !roomGraphics.primitives) {
      console.warn('No graphics data for room');
      return;
    }

    // Check cache
    if (roomId && roomId === this.currentRoomId && this.sceneCache) {
      // Use cached scene
      this.ctx.drawImage(this.sceneCache, 0, 0);
      return;
    }

    // Clear buffers
    this.clear();
    this.priorityBuffer.fill(0);

    // Set background color
    const bgColor = this.validateColor(
      roomGraphics.backgroundColor || '#000000'
    );
    this.backCtx.fillStyle = bgColor;
    this.backCtx.fillRect(0, 0, 640, 400);

    // Draw each primitive in order to back buffer
    roomGraphics.primitives.forEach((primitive) => {
      this.drawPrimitive(primitive);
    });

    // Cache the rendered scene
    if (roomId) {
      this.currentRoomId = roomId;
      this.sceneCache = document.createElement('canvas');
      this.sceneCache.width = 640;
      this.sceneCache.height = 400;
      const cacheCtx = this.sceneCache.getContext('2d');
      cacheCtx.drawImage(this.backBuffer, 0, 0);
    }

    // Copy to main canvas
    this.ctx.drawImage(this.backBuffer, 0, 0);

    // Draw debug overlays if enabled
    if (this.debugMode) {
      this.drawDebugOverlay();
    }
  }

  /**
   * Clear canvas to black
   */
  clear() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.backCtx.fillStyle = '#000000';
    this.backCtx.fillRect(0, 0, this.backBuffer.width, this.backBuffer.height);
    this.priorityBuffer.fill(0);
  }

  /**
   * Clear scene cache
   */
  clearCache() {
    this.sceneCache = null;
    this.currentRoomId = null;
  }

  /**
   * Draw a single primitive shape
   * @param {Object} primitive - Primitive object with type and properties
   */
  drawPrimitive(primitive) {
    if (!primitive || !primitive.type) return;

    // Use back buffer context for rendering
    const ctx = this.backCtx;

    switch (primitive.type) {
      case 'rect':
        this.drawRect(primitive, ctx);
        break;
      case 'polygon':
        this.drawPolygon(primitive, ctx);
        break;
      case 'dithered_gradient':
        this.drawDitheredGradient(
          primitive.dims[0],
          primitive.dims[1],
          primitive.dims[2],
          primitive.dims[3],
          primitive.color1,
          primitive.color2,
          primitive.pattern || 2,
          ctx
        );
        break;
      case 'circle':
        this.drawCircle(primitive, ctx);
        break;
      case 'ellipse':
        this.drawEllipse(primitive, ctx);
        break;
      case 'line':
        this.drawLine(primitive, ctx);
        break;
      case 'star':
        this.drawStar(primitive, ctx);
        break;
      case 'triangle':
        this.drawTriangle(primitive, ctx);
        break;
      case 'path':
        this.drawPath(primitive, ctx);
        break;
      default:
        console.warn(`Unknown primitive type: ${primitive.type}`);
    }

    // Update priority if specified
    if (primitive.priority !== undefined) {
      this.updatePrimitivesPriority(primitive);
    }
  }

  /**
   * Draw rectangle primitive
   * @private
   * @param {Object} primitive - Rectangle data
   * @param {CanvasRenderingContext2D} ctx - Context to draw on
   */
  drawRect(primitive, ctx) {
    if (!primitive.dims || primitive.dims.length < 4) return;

    const [x, y, width, height] = primitive.dims;
    const color = this.validateColor(primitive.color || '#000000');
    const filled = primitive.filled !== false; // Default to filled

    // Scale coordinates (320x200 -> 640x400)
    const scaledX = x * 2;
    const scaledY = y * 2;
    const scaledWidth = width * 2;
    const scaledHeight = height * 2;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    if (filled) {
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
    } else {
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
    }

    // Update priority buffer if specified
    if (primitive.priority !== undefined) {
      this.updatePriorityBuffer(x, y, width, height, primitive.priority);
    }
  }

  /**
   * Draw polygon primitive
   * @private
   * @param {Object} primitive - Polygon data
   * @param {CanvasRenderingContext2D} ctx - Context to draw on
   */
  drawPolygon(primitive, ctx) {
    if (!primitive.points || primitive.points.length < 3) return;

    const color = this.validateColor(primitive.color || '#000000');
    const filled = primitive.filled !== false; // Default to filled

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.beginPath();

    // Move to first point (scaled)
    ctx.moveTo(primitive.points[0][0] * 2, primitive.points[0][1] * 2);

    // Draw lines to remaining points
    for (let i = 1; i < primitive.points.length; i++) {
      ctx.lineTo(primitive.points[i][0] * 2, primitive.points[i][1] * 2);
    }

    ctx.closePath();

    if (filled) {
      ctx.fill();
    } else {
      ctx.stroke();
    }

    // Update priority buffer if specified
    if (primitive.priority !== undefined) {
      this.updatePolygonPriority(primitive.points, primitive.priority);
    }
  }

  /**
   * Draw circle primitive
   * @private
   * @param {Object} primitive - Circle data
   * @param {CanvasRenderingContext2D} ctx - Context to draw on
   */
  drawCircle(primitive, ctx) {
    if (!primitive.center || primitive.radius === undefined) return;

    const [cx, cy] = primitive.center;
    const radius = primitive.radius;
    const color = this.validateColor(primitive.color || '#000000');
    const filled = primitive.filled !== false; // Default to filled

    // Scale coordinates
    const scaledCx = cx * 2;
    const scaledCy = cy * 2;
    const scaledRadius = radius * 2;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(scaledCx, scaledCy, scaledRadius, 0, Math.PI * 2);

    if (filled) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  /**
   * Draw ellipse primitive
   * @private
   * @param {Object} primitive - Ellipse data
   * @param {CanvasRenderingContext2D} ctx - Context to draw on
   */
  drawEllipse(primitive, ctx) {
    if (!primitive.center || !primitive.radiusX || !primitive.radiusY) return;

    const [cx, cy] = primitive.center;
    const radiusX = primitive.radiusX;
    const radiusY = primitive.radiusY;
    const rotation = primitive.rotation || 0;
    const color = this.validateColor(primitive.color || '#000000');
    const filled = primitive.filled !== false;

    // Scale coordinates
    const scaledCx = cx * 2;
    const scaledCy = cy * 2;
    const scaledRadiusX = radiusX * 2;
    const scaledRadiusY = radiusY * 2;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.ellipse(
      scaledCx,
      scaledCy,
      scaledRadiusX,
      scaledRadiusY,
      rotation,
      0,
      Math.PI * 2
    );

    if (filled) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  /**
   * Draw star primitive - for single pixels or small star shapes
   * @private
   * @param {Object} primitive - Star data
   * @param {CanvasRenderingContext2D} ctx - Context to draw on
   */
  drawStar(primitive, ctx) {
    const color = this.validateColor(primitive.color || '#FFFFFF');
    ctx.fillStyle = color;

    if (primitive.points && Array.isArray(primitive.points)) {
      // Draw star pixels (like in night sky)
      primitive.points.forEach(([x, y]) => {
        // Draw a small plus shape
        const scaledX = x * 2;
        const scaledY = y * 2;

        // Center pixel
        ctx.fillRect(scaledX, scaledY, 2, 2);
        // Cross pattern for sparkle effect
        ctx.fillRect(scaledX - 2, scaledY, 2, 2);
        ctx.fillRect(scaledX + 2, scaledY, 2, 2);
        ctx.fillRect(scaledX, scaledY - 2, 2, 2);
        ctx.fillRect(scaledX, scaledY + 2, 2, 2);
      });
    } else if (primitive.center && primitive.radius !== undefined) {
      // Draw star shape
      const [cx, cy] = primitive.center;
      const outerRadius = primitive.radius;
      const innerRadius = outerRadius * 0.4;
      const numPoints = primitive.numPoints || 5;
      const filled = primitive.filled !== false;

      ctx.strokeStyle = color;
      ctx.beginPath();

      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI) / numPoints - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x * 2, y * 2);
        } else {
          ctx.lineTo(x * 2, y * 2);
        }
      }

      ctx.closePath();

      if (filled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    }
  }

  /**
   * Draw line primitive
   * @private
   * @param {Object} primitive - Line data
   * @param {CanvasRenderingContext2D} ctx - Context to draw on
   */
  drawLine(primitive, ctx) {
    if (!primitive.points || primitive.points.length < 2) return;

    const color = this.validateColor(primitive.color || '#000000');
    const width = primitive.width || 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(primitive.points[0][0] * 2, primitive.points[0][1] * 2);
    ctx.lineTo(primitive.points[1][0] * 2, primitive.points[1][1] * 2);
    ctx.stroke();
    ctx.lineWidth = 1; // Reset
  }

  /**
   * Draw triangle primitive (optimized polygon)
   * @private
   * @param {Object} primitive - Triangle data
   * @param {CanvasRenderingContext2D} ctx - Context to draw on
   */
  drawTriangle(primitive, ctx) {
    if (!primitive.points || primitive.points.length !== 3) return;

    // Reuse polygon drawing
    this.drawPolygon(primitive, ctx);
  }

  /**
   * Draw complex path primitive
   * @private
   * @param {Object} primitive - Path data
   * @param {CanvasRenderingContext2D} ctx - Context to draw on
   */
  drawPath(primitive, ctx) {
    if (!primitive.commands || primitive.commands.length === 0) return;

    const color = this.validateColor(primitive.color || '#000000');
    const filled = primitive.filled !== false;
    const width = primitive.width || 1;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();

    primitive.commands.forEach((cmd) => {
      switch (cmd.type) {
        case 'moveTo':
          ctx.moveTo(cmd.x * 2, cmd.y * 2);
          break;
        case 'lineTo':
          ctx.lineTo(cmd.x * 2, cmd.y * 2);
          break;
        case 'quadraticCurveTo':
          ctx.quadraticCurveTo(cmd.cpx * 2, cmd.cpy * 2, cmd.x * 2, cmd.y * 2);
          break;
        case 'bezierCurveTo':
          ctx.bezierCurveTo(
            cmd.cp1x * 2,
            cmd.cp1y * 2,
            cmd.cp2x * 2,
            cmd.cp2y * 2,
            cmd.x * 2,
            cmd.y * 2
          );
          break;
        case 'closePath':
          ctx.closePath();
          break;
      }
    });

    if (filled) {
      ctx.fill();
    } else {
      ctx.stroke();
    }

    ctx.lineWidth = 1; // Reset
  }

  /**
   * Draw 2x2 dithered pattern gradient
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @param {number} [pattern=2] - Dither pattern (0-8)
   * @param {CanvasRenderingContext2D} ctx - Context to draw on
   */
  drawDitheredGradient(x, y, width, height, color1, color2, pattern = 2, ctx) {
    // Validate colors
    color1 = this.validateColor(color1);
    color2 = this.validateColor(color2);

    const ditherPattern =
      this.ditherPatterns[Math.min(8, Math.max(0, pattern))];

    // Scale to canvas size
    const scaledX = x * 2;
    const scaledY = y * 2;
    const scaledWidth = width * 2;
    const scaledHeight = height * 2;

    // Use ImageData for better performance on large areas
    if (width * height > 1000) {
      const imageData = ctx.createImageData(scaledWidth, scaledHeight);
      const data = imageData.data;
      const rgb1 = this.hexToRGB(color1);
      const rgb2 = this.hexToRGB(color2);

      for (let sy = 0; sy < scaledHeight; sy++) {
        for (let sx = 0; sx < scaledWidth; sx++) {
          const px = Math.floor(sx / 2);
          const py = Math.floor(sy / 2);
          const patternX = px % 2;
          const patternY = py % 2;
          const useColor2 = ditherPattern[patternY][patternX];
          const rgb = useColor2 ? rgb2 : rgb1;

          const index = (sy * scaledWidth + sx) * 4;
          data[index] = rgb[0];
          data[index + 1] = rgb[1];
          data[index + 2] = rgb[2];
          data[index + 3] = 255;
        }
      }

      ctx.putImageData(imageData, scaledX, scaledY);
    } else {
      // Draw base color
      ctx.fillStyle = color1;
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Apply dither pattern
      ctx.fillStyle = color2;

      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const patternX = px % 2;
          const patternY = py % 2;

          if (ditherPattern[patternY][patternX]) {
            // Draw 2x2 pixel (scaled)
            ctx.fillRect(scaledX + px * 2, scaledY + py * 2, 2, 2);
          }
        }
      }
    }
  }

  /**
   * Get priority value at pixel position
   * @param {number} x - X coordinate (0-319)
   * @param {number} y - Y coordinate (0-199)
   * @returns {number} Priority value (0-15)
   */
  getPixelPriority(x, y) {
    if (x < 0 || x >= 320 || y < 0 || y >= 200) {
      return 0;
    }

    const index = y * 320 + x;
    return this.priorityBuffer[index];
  }

  /**
   * Update priority buffer for rectangle
   * @private
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} priority - Priority value
   */
  updatePriorityBuffer(x, y, width, height, priority) {
    for (let py = y; py < y + height && py < 200; py++) {
      for (let px = x; px < x + width && px < 320; px++) {
        if (px >= 0 && py >= 0) {
          const index = py * 320 + px;
          this.priorityBuffer[index] = priority;
        }
      }
    }
  }

  /**
   * Update priority buffer for polygon
   * @private
   * @param {Array} points - Polygon points
   * @param {number} priority - Priority value
   */
  updatePolygonPriority(points, priority) {
    // Implement scanline polygon fill for priority buffer
    if (points.length < 3) return;

    // Find bounding box
    let minY = 200,
      maxY = 0;
    points.forEach(([_x, y]) => {
      minY = Math.min(minY, Math.floor(y));
      maxY = Math.max(maxY, Math.ceil(y));
    });

    // Process each scanline
    for (let y = minY; y <= maxY; y++) {
      const intersections = [];

      // Find intersections with polygon edges
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];

        // Skip horizontal edges
        if (p1[1] === p2[1]) continue;

        // Check if scanline intersects edge
        if ((p1[1] <= y && p2[1] > y) || (p2[1] <= y && p1[1] > y)) {
          // Calculate intersection X coordinate
          const t = (y - p1[1]) / (p2[1] - p1[1]);
          const x = p1[0] + t * (p2[0] - p1[0]);
          intersections.push(Math.floor(x));
        }
      }

      // Sort intersections
      intersections.sort((a, b) => a - b);

      // Fill between pairs of intersections
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          const startX = Math.max(0, intersections[i]);
          const endX = Math.min(319, intersections[i + 1]);

          for (let x = startX; x <= endX; x++) {
            if (x >= 0 && x < 320 && y >= 0 && y < 200) {
              const index = y * 320 + x;
              this.priorityBuffer[index] = priority;
            }
          }
        }
      }
    }
  }

  /**
   * Update priority for any primitive type
   * @private
   * @param {Object} primitive - Primitive with priority
   */
  updatePrimitivesPriority(primitive) {
    if (primitive.priority === undefined) return;

    switch (primitive.type) {
      case 'rect':
        if (primitive.dims && primitive.dims.length >= 4) {
          this.updatePriorityBuffer(
            primitive.dims[0],
            primitive.dims[1],
            primitive.dims[2],
            primitive.dims[3],
            primitive.priority
          );
        }
        break;
      case 'polygon':
      case 'triangle':
        if (primitive.points) {
          this.updatePolygonPriority(primitive.points, primitive.priority);
        }
        break;
      case 'circle':
        if (primitive.center && primitive.radius !== undefined) {
          // Simple bounding box for circle
          const [cx, cy] = primitive.center;
          const r = primitive.radius;
          this.updatePriorityBuffer(
            Math.floor(cx - r),
            Math.floor(cy - r),
            Math.ceil(r * 2),
            Math.ceil(r * 2),
            primitive.priority
          );
        }
        break;
    }
  }

  /**
   * Get EGA color index
   * @param {string} color - Hex color string
   * @returns {number} EGA palette index (0-15)
   */
  getColorIndex(color) {
    return this.egaPalette[color.toUpperCase()] || 0;
  }

  /**
   * Get EGA color from index
   * @param {number} index - EGA palette index (0-15)
   * @returns {string} Hex color string
   */
  getEGAColor(index) {
    return this.egaColors[Math.min(15, Math.max(0, index))];
  }

  /**
   * Validate and convert color to EGA palette
   * @param {string|number} color - Color as hex string, color name, or index
   * @returns {string} Valid EGA hex color
   */
  validateColor(color) {
    // Handle color index
    if (typeof color === 'number') {
      return this.getEGAColor(color);
    }

    // Handle color name
    if (typeof color === 'string' && !color.startsWith('#')) {
      const colorName = color.toLowerCase().replace(/\s+/g, '');
      if (this.colorNames[colorName] !== undefined) {
        return this.getEGAColor(this.colorNames[colorName]);
      }
    }

    // Handle hex color
    const upperColor = color.toUpperCase();
    if (this.egaPalette[upperColor] !== undefined) {
      return upperColor;
    }

    // Find nearest EGA color if not exact match
    return this.findNearestEGAColor(color);
  }

  /**
   * Find nearest EGA color for non-palette colors
   * @private
   * @param {string} color - Hex color string
   * @returns {string} Nearest EGA color
   */
  findNearestEGAColor(color) {
    const rgb = this.hexToRGB(color);
    let minDistance = Infinity;
    let nearestColor = '#000000';

    for (const egaColor of this.egaColors) {
      const egaRgb = this.hexToRGB(egaColor);
      const distance =
        Math.pow(rgb[0] - egaRgb[0], 2) +
        Math.pow(rgb[1] - egaRgb[1], 2) +
        Math.pow(rgb[2] - egaRgb[2], 2);

      if (distance < minDistance) {
        minDistance = distance;
        nearestColor = egaColor;
      }
    }

    return nearestColor;
  }

  /**
   * Convert hex color to RGB array
   * @private
   * @param {string} hex - Hex color string
   * @returns {number[]} RGB values [r, g, b]
   */
  hexToRGB(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }

  /**
   * Get priority band for Y coordinate
   * @param {number} y - Y coordinate (0-199)
   * @returns {number} Priority band (0-15)
   */
  getPriorityBand(y) {
    if (y < 0 || y >= 200) return 0;
    return Math.min(15, Math.floor((y / 200) * this.priorityBands) + 1);
  }

  /**
   * Set debug mode
   * @param {boolean} enabled - Enable debug mode
   * @param {Object} [options] - Debug options
   */
  setDebugMode(enabled, options = {}) {
    this.debugMode = enabled;
    this.showPriorityMap = options.showPriorityMap || false;
    this.showGrid = options.showGrid || false;
  }

  /**
   * Draw debug overlay
   * @private
   */
  drawDebugOverlay() {
    const ctx = this.ctx;

    // Draw priority map
    if (this.showPriorityMap) {
      ctx.save();
      ctx.globalAlpha = 0.5;

      for (let y = 0; y < 200; y++) {
        for (let x = 0; x < 320; x++) {
          const priority = this.getPixelPriority(x, y);
          if (priority > 0) {
            // Color code by priority
            const hue = (priority / 15) * 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillRect(x * 2, y * 2, 2, 2);
          }
        }
      }

      ctx.restore();
    }

    // Draw grid
    if (this.showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;

      // Draw vertical lines every 20 pixels (original resolution)
      for (let x = 0; x <= 320; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x * 2, 0);
        ctx.lineTo(x * 2, 400);
        ctx.stroke();
      }

      // Draw horizontal lines every 20 pixels
      for (let y = 0; y <= 200; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y * 2);
        ctx.lineTo(640, y * 2);
        ctx.stroke();
      }

      // Draw priority band indicators
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      for (let band = 1; band <= this.priorityBands; band++) {
        const y = Math.floor((band - 1) * this.bandHeight) * 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }
    }
  }
}
