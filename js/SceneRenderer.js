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
      '#000000': 0,  // Black
      '#0000AA': 1,  // Blue
      '#00AA00': 2,  // Green
      '#00AAAA': 3,  // Cyan
      '#AA0000': 4,  // Red
      '#AA00AA': 5,  // Magenta
      '#AA5500': 6,  // Brown
      '#AAAAAA': 7,  // Light Gray
      '#555555': 8,  // Dark Gray
      '#5555FF': 9,  // Light Blue
      '#55FF55': 10, // Light Green
      '#55FFFF': 11, // Light Cyan
      '#FF5555': 12, // Light Red
      '#FF55FF': 13, // Light Magenta
      '#FFFF55': 14, // Yellow
      '#FFFFFF': 15  // White
    };
    
    // Priority buffer for depth testing (320x200)
    this.priorityBuffer = new Uint8Array(320 * 200);
    
    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    
    // Dithering patterns (2x2)
    this.ditherPatterns = {
      0: [[0, 0], [0, 0]], // 0% (solid color 1)
      1: [[1, 0], [0, 0]], // 25%
      2: [[1, 0], [0, 1]], // 50% (checkerboard)
      3: [[1, 1], [1, 0]], // 75%
      4: [[1, 1], [1, 1]]  // 100% (solid color 2)
    };
  }
  
  /**
   * Draw complete room background
   * @param {Object} roomGraphics - Room graphics object with primitives array
   */
  renderRoom(roomGraphics) {
    if (!roomGraphics || !roomGraphics.primitives) {
      console.warn('No graphics data for room');
      return;
    }
    
    // Clear priority buffer
    this.priorityBuffer.fill(0);
    
    // Draw each primitive in order
    roomGraphics.primitives.forEach(primitive => {
      this.drawPrimitive(primitive);
    });
  }
  
  /**
   * Clear canvas to black
   */
  clear() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.priorityBuffer.fill(0);
  }
  
  /**
   * Draw a single primitive shape
   * @param {Object} primitive - Primitive object with type and properties
   */
  drawPrimitive(primitive) {
    if (!primitive || !primitive.type) return;
    
    switch (primitive.type) {
      case 'rect':
        this.drawRect(primitive);
        break;
      case 'polygon':
        this.drawPolygon(primitive);
        break;
      case 'dithered_gradient':
        this.drawDitheredGradient(
          primitive.dims[0], 
          primitive.dims[1], 
          primitive.dims[2], 
          primitive.dims[3],
          primitive.color1, 
          primitive.color2,
          primitive.pattern || 2
        );
        break;
      case 'circle':
        this.drawCircle(primitive);
        break;
      case 'star':
        this.drawStar(primitive);
        break;
      default:
        console.warn(`Unknown primitive type: ${primitive.type}`);
    }
  }
  
  /**
   * Draw rectangle primitive
   * @private
   * @param {Object} primitive - Rectangle data
   */
  drawRect(primitive) {
    if (!primitive.dims || primitive.dims.length < 4) return;
    
    const [x, y, width, height] = primitive.dims;
    const color = primitive.color || '#000000';
    
    // Scale coordinates (320x200 -> 640x400)
    const scaledX = x * 2;
    const scaledY = y * 2;
    const scaledWidth = width * 2;
    const scaledHeight = height * 2;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
    
    // Update priority buffer if specified
    if (primitive.priority !== undefined) {
      this.updatePriorityBuffer(x, y, width, height, primitive.priority);
    }
  }
  
  /**
   * Draw polygon primitive
   * @private
   * @param {Object} primitive - Polygon data
   */
  drawPolygon(primitive) {
    if (!primitive.points || primitive.points.length < 3) return;
    
    const color = primitive.color || '#000000';
    
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    
    // Move to first point (scaled)
    this.ctx.moveTo(primitive.points[0][0] * 2, primitive.points[0][1] * 2);
    
    // Draw lines to remaining points
    for (let i = 1; i < primitive.points.length; i++) {
      this.ctx.lineTo(primitive.points[i][0] * 2, primitive.points[i][1] * 2);
    }
    
    this.ctx.closePath();
    this.ctx.fill();
    
    // Update priority buffer if specified
    if (primitive.priority !== undefined) {
      this.updatePolygonPriority(primitive.points, primitive.priority);
    }
  }
  
  /**
   * Draw circle primitive
   * @private
   * @param {Object} primitive - Circle data
   */
  drawCircle(primitive) {
    if (!primitive.center || primitive.radius === undefined) return;
    
    const [cx, cy] = primitive.center;
    const radius = primitive.radius;
    const color = primitive.color || '#000000';
    
    // Scale coordinates
    const scaledCx = cx * 2;
    const scaledCy = cy * 2;
    const scaledRadius = radius * 2;
    
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(scaledCx, scaledCy, scaledRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * Draw star primitive
   * @private
   * @param {Object} primitive - Star data
   */
  drawStar(primitive) {
    if (!primitive.center || primitive.radius === undefined) return;
    
    const [cx, cy] = primitive.center;
    const outerRadius = primitive.radius;
    const innerRadius = outerRadius * 0.4;
    const points = primitive.points || 5;
    const color = primitive.color || '#000000';
    
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      if (i === 0) {
        this.ctx.moveTo(x * 2, y * 2);
      } else {
        this.ctx.lineTo(x * 2, y * 2);
      }
    }
    
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  /**
   * Draw 2x2 dithered pattern gradient
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @param {number} [pattern=2] - Dither pattern (0-4)
   */
  drawDitheredGradient(x, y, width, height, color1, color2, pattern = 2) {
    const ditherPattern = this.ditherPatterns[Math.min(4, Math.max(0, pattern))];
    
    // Scale to canvas size
    const scaledX = x * 2;
    const scaledY = y * 2;
    const scaledWidth = width * 2;
    const scaledHeight = height * 2;
    
    // Draw base color
    this.ctx.fillStyle = color1;
    this.ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
    
    // Apply dither pattern
    this.ctx.fillStyle = color2;
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const patternX = px % 2;
        const patternY = py % 2;
        
        if (ditherPattern[patternY][patternX]) {
          // Draw 2x2 pixel (scaled)
          this.ctx.fillRect(
            scaledX + (px * 2),
            scaledY + (py * 2),
            2,
            2
          );
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
    // TODO: Implement polygon fill algorithm for priority buffer
    // For now, just use bounding box
    let minX = 320, minY = 200, maxX = 0, maxY = 0;
    
    points.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    
    this.updatePriorityBuffer(
      Math.floor(minX),
      Math.floor(minY),
      Math.ceil(maxX - minX),
      Math.ceil(maxY - minY),
      priority
    );
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
   * Draw line (used internally for debugging)
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {string} color - Line color
   */
  drawLine(x1, y1, x2, y2, color) {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x1 * 2, y1 * 2);
    this.ctx.lineTo(x2 * 2, y2 * 2);
    this.ctx.stroke();
  }
}