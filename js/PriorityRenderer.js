/**
 * PriorityRenderer - Sierra-style priority-based rendering system
 * Based on analysis of KQ4, SQ3, QFG1, and Iceman graphics
 */

export class PriorityRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Priority buffer for pixel-level depth testing
    this.priorityBuffer = new Uint8Array(320 * 200);
    
    // Visual buffer for actual pixel data
    this.visualBuffer = new ImageData(320, 200);
    
    // Control buffer for walkable areas, triggers, etc.
    this.controlBuffer = new Uint8Array(320 * 200);
    
    // Generate priority bands based on Y position
    this.priorityGradient = this.generatePriorityGradient();
    
    // Priority color map for debug visualization
    this.priorityColors = [
      '#000000', // 0 - Never drawn
      '#FF0000', // 1 - Background (sky)
      '#FF8800', // 2 - Far mountains
      '#FFFF00', // 3 - Mid distance
      '#88FF00', // 4 - Near distance
      '#00FF00', // 5 - Ground level far
      '#00FF88', // 6 - Ground level mid
      '#00FFFF', // 7 - Ground level near
      '#0088FF', // 8 - Actor level far
      '#0000FF', // 9 - Actor level mid
      '#8800FF', // 10 - Actor level near
      '#FF00FF', // 11 - Foreground objects
      '#FF0088', // 12 - Very near foreground
      '#FFFFFF', // 13 - Immediate foreground
      '#888888', // 14 - Always on top
      '#CCCCCC'  // 15 - UI/Debug layer
    ];
    
    // Control color meanings (from Sierra games)
    this.controlColors = {
      0: 'walkable',      // Black - normal walking area
      1: 'blocked',       // Blue - obstacle
      2: 'water',         // Cyan - water (special walking)
      3: 'trigger',       // Green - trigger area
      4: 'special',       // Red - special area
      14: 'edgeBottom',   // Near white - room edge
      15: 'edgeTop'       // White - room edge
    };
  }

  /**
   * Generate priority gradient based on Y position
   * Based on Sierra's typical priority band distribution
   */
  generatePriorityGradient() {
    const gradient = new Uint8Array(200);
    
    // Priority band distribution from Sierra games
    for (let y = 0; y < 200; y++) {
      if (y < 42) {
        gradient[y] = 1; // Sky/background
      } else if (y < 48) {
        gradient[y] = 2; // Far mountains/horizon
      } else if (y < 54) {
        gradient[y] = 3; // Far distance
      } else if (y < 60) {
        gradient[y] = 4; // Mid-far distance
      } else if (y < 72) {
        gradient[y] = 5; // Mid distance
      } else if (y < 84) {
        gradient[y] = 6; // Mid-near distance
      } else if (y < 96) {
        gradient[y] = 7; // Near distance
      } else if (y < 108) {
        gradient[y] = 8; // Actor far
      } else if (y < 120) {
        gradient[y] = 9; // Actor mid
      } else if (y < 132) {
        gradient[y] = 10; // Actor near
      } else if (y < 144) {
        gradient[y] = 11; // Foreground
      } else if (y < 168) {
        gradient[y] = 12; // Near foreground
      } else if (y < 190) {
        gradient[y] = 13; // Immediate foreground
      } else {
        gradient[y] = 14; // UI area
      }
    }
    
    return gradient;
  }

  /**
   * Clear all buffers
   */
  clear() {
    this.priorityBuffer.fill(0);
    this.controlBuffer.fill(0);
    this.visualBuffer = new ImageData(320, 200);
    this.ctx.clearRect(0, 0, 320, 200);
  }

  /**
   * Render a complete scene with priority
   */
  renderScene(scene, sprites) {
    this.clear();
    
    // 1. Render background with priority map
    if (scene.background) {
      this.renderBackground(scene.background);
    }
    
    // 2. Apply priority map if provided
    if (scene.priorityMap) {
      this.applyPriorityMap(scene.priorityMap);
    }
    
    // 3. Apply control map if provided
    if (scene.controlMap) {
      this.applyControlMap(scene.controlMap);
    }
    
    // 4. Sort and render sprites
    const sortedSprites = this.sortSpritesByPriority(sprites);
    for (const sprite of sortedSprites) {
      this.renderSprite(sprite);
    }
    
    // 5. Apply the visual buffer to canvas
    this.ctx.putImageData(this.visualBuffer, 0, 0);
  }

  /**
   * Render background graphics
   */
  renderBackground(background) {
    // Background is always at lowest priority
    const priority = 1;
    
    // Render background primitives
    if (background.primitives) {
      for (const primitive of background.primitives) {
        this.renderPrimitive(primitive, priority);
      }
    }
  }

  /**
   * Apply custom priority map
   */
  applyPriorityMap(priorityMap) {
    if (priorityMap.data) {
      // Direct priority data
      for (let i = 0; i < priorityMap.data.length; i++) {
        this.priorityBuffer[i] = priorityMap.data[i];
      }
    } else if (priorityMap.bands) {
      // Priority bands definition
      for (const band of priorityMap.bands) {
        for (let y = band.startY; y <= band.endY; y++) {
          for (let x = 0; x < 320; x++) {
            const index = y * 320 + x;
            this.priorityBuffer[index] = band.priority;
          }
        }
      }
    }
  }

  /**
   * Apply control map for walkable areas, triggers, etc.
   */
  applyControlMap(controlMap) {
    if (controlMap.data) {
      for (let i = 0; i < controlMap.data.length; i++) {
        this.controlBuffer[i] = controlMap.data[i];
      }
    } else if (controlMap.areas) {
      // Area definitions
      for (const area of controlMap.areas) {
        this.fillControlArea(area);
      }
    }
  }

  /**
   * Sort sprites by their rendering priority
   */
  sortSpritesByPriority(sprites) {
    return sprites.sort((a, b) => {
      // Fixed priority always wins
      if (a.fixedPriority && !b.fixedPriority) return -1;
      if (!a.fixedPriority && b.fixedPriority) return 1;
      if (a.fixedPriority && b.fixedPriority) {
        return a.priority - b.priority;
      }
      
      // Otherwise sort by Y position (lower Y = farther away = drawn first)
      return a.y - b.y;
    });
  }

  /**
   * Render a sprite with priority testing
   */
  renderSprite(sprite) {
    // Determine sprite priority
    const spritePriority = sprite.fixedPriority ? 
      sprite.priority : 
      this.getPriorityAtY(sprite.y + sprite.height - 1); // Use bottom of sprite
    
    // Get sprite image data
    const spriteData = sprite.getImageData ? 
      sprite.getImageData() : 
      this.generateSpriteImageData(sprite);
    
    // Render each pixel with priority testing
    for (let sy = 0; sy < sprite.height; sy++) {
      for (let sx = 0; sx < sprite.width; sx++) {
        const px = Math.floor(sprite.x) + sx;
        const py = Math.floor(sprite.y) + sy;
        
        // Bounds checking
        if (px < 0 || px >= 320 || py < 0 || py >= 200) continue;
        
        const bufferIndex = py * 320 + px;
        const spriteIndex = sy * sprite.width + sx;
        
        // Get pixel from sprite
        const r = spriteData.data[spriteIndex * 4];
        const g = spriteData.data[spriteIndex * 4 + 1];
        const b = spriteData.data[spriteIndex * 4 + 2];
        const a = spriteData.data[spriteIndex * 4 + 3];
        
        // Skip transparent pixels
        if (a === 0) continue;
        
        // Priority test
        if (this.priorityBuffer[bufferIndex] <= spritePriority) {
          // Update visual buffer
          this.visualBuffer.data[bufferIndex * 4] = r;
          this.visualBuffer.data[bufferIndex * 4 + 1] = g;
          this.visualBuffer.data[bufferIndex * 4 + 2] = b;
          this.visualBuffer.data[bufferIndex * 4 + 3] = a;
          
          // Update priority buffer
          this.priorityBuffer[bufferIndex] = spritePriority;
        }
      }
    }
  }

  /**
   * Render a primitive shape
   */
  renderPrimitive(primitive, basePriority) {
    const priority = primitive.priority || basePriority;
    
    switch (primitive.type) {
      case 'rect':
        this.fillRect(
          primitive.x || primitive.dims[0],
          primitive.y || primitive.dims[1],
          primitive.width || primitive.dims[2],
          primitive.height || primitive.dims[3],
          primitive.color,
          priority
        );
        break;
        
      case 'polygon':
        this.fillPolygon(primitive.points, primitive.color, priority);
        break;
        
      case 'circle':
        this.fillCircle(
          primitive.center[0],
          primitive.center[1],
          primitive.radius,
          primitive.color,
          priority
        );
        break;
        
      case 'line':
        this.drawLine(
          primitive.start[0],
          primitive.start[1],
          primitive.end[0],
          primitive.end[1],
          primitive.color,
          priority,
          primitive.width || 1
        );
        break;
    }
  }

  /**
   * Fill rectangle with priority
   */
  fillRect(x, y, width, height, color, priority) {
    const rgb = this.parseColor(color);
    
    for (let py = y; py < y + height; py++) {
      for (let px = x; px < x + width; px++) {
        if (px < 0 || px >= 320 || py < 0 || py >= 200) continue;
        
        const index = py * 320 + px;
        
        if (this.priorityBuffer[index] <= priority) {
          this.visualBuffer.data[index * 4] = rgb.r;
          this.visualBuffer.data[index * 4 + 1] = rgb.g;
          this.visualBuffer.data[index * 4 + 2] = rgb.b;
          this.visualBuffer.data[index * 4 + 3] = 255;
          this.priorityBuffer[index] = priority;
        }
      }
    }
  }

  /**
   * Fill polygon using scanline algorithm with priority
   */
  fillPolygon(points, color, priority) {
    if (points.length < 3) return;
    
    const rgb = this.parseColor(color);
    
    // Find bounds
    let minY = 200, maxY = 0;
    for (const point of points) {
      minY = Math.min(minY, point[1]);
      maxY = Math.max(maxY, point[1]);
    }
    
    // Scanline fill
    for (let y = minY; y <= maxY; y++) {
      const intersections = [];
      
      // Find all intersections with scanline
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        if ((p1[1] <= y && p2[1] > y) || (p1[1] > y && p2[1] <= y)) {
          const x = p1[0] + (y - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]);
          intersections.push(Math.floor(x));
        }
      }
      
      // Sort intersections
      intersections.sort((a, b) => a - b);
      
      // Fill between pairs of intersections
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          for (let x = intersections[i]; x <= intersections[i + 1]; x++) {
            if (x < 0 || x >= 320 || y < 0 || y >= 200) continue;
            
            const index = y * 320 + x;
            
            if (this.priorityBuffer[index] <= priority) {
              this.visualBuffer.data[index * 4] = rgb.r;
              this.visualBuffer.data[index * 4 + 1] = rgb.g;
              this.visualBuffer.data[index * 4 + 2] = rgb.b;
              this.visualBuffer.data[index * 4 + 3] = 255;
              this.priorityBuffer[index] = priority;
            }
          }
        }
      }
    }
  }

  /**
   * Get priority at Y position
   */
  getPriorityAtY(y) {
    if (y < 0) return 1;
    if (y >= 200) return 14;
    return this.priorityGradient[Math.floor(y)];
  }

  /**
   * Check if position is walkable
   */
  isWalkable(x, y) {
    if (x < 0 || x >= 320 || y < 0 || y >= 200) return false;
    const index = y * 320 + x;
    return this.controlBuffer[index] === 0; // 0 = walkable in Sierra games
  }

  /**
   * Get control value at position
   */
  getControlAt(x, y) {
    if (x < 0 || x >= 320 || y < 0 || y >= 200) return -1;
    const index = y * 320 + x;
    return this.controlBuffer[index];
  }

  /**
   * Debug visualization - show priority map
   */
  showPriorityMap() {
    const debugData = new ImageData(320, 200);
    
    for (let i = 0; i < this.priorityBuffer.length; i++) {
      const priority = this.priorityBuffer[i];
      const color = this.parseColor(this.priorityColors[priority] || '#000000');
      
      debugData.data[i * 4] = color.r;
      debugData.data[i * 4 + 1] = color.g;
      debugData.data[i * 4 + 2] = color.b;
      debugData.data[i * 4 + 3] = 255;
    }
    
    this.ctx.putImageData(debugData, 0, 0);
  }

  /**
   * Parse color string to RGB
   */
  parseColor(color) {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    }
    
    // Default to black
    return { r: 0, g: 0, b: 0 };
  }

  /**
   * Generate sprite image data (fallback)
   */
  generateSpriteImageData(sprite) {
    const data = new ImageData(sprite.width, sprite.height);
    const color = this.parseColor(sprite.color || '#FF00FF');
    
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = color.r;
      data.data[i + 1] = color.g;
      data.data[i + 2] = color.b;
      data.data[i + 3] = 255;
    }
    
    return data;
  }

  /**
   * Fill control area
   */
  fillControlArea(area) {
    const controlValue = area.type === 'walkable' ? 0 :
                        area.type === 'blocked' ? 1 :
                        area.type === 'water' ? 2 :
                        area.type === 'trigger' ? 3 : 4;
    
    if (area.rect) {
      for (let y = area.rect[1]; y < area.rect[1] + area.rect[3]; y++) {
        for (let x = area.rect[0]; x < area.rect[0] + area.rect[2]; x++) {
          if (x >= 0 && x < 320 && y >= 0 && y < 200) {
            this.controlBuffer[y * 320 + x] = controlValue;
          }
        }
      }
    } else if (area.polygon) {
      // Use polygon fill for control areas
      this.fillControlPolygon(area.polygon, controlValue);
    }
  }

  /**
   * Fill control polygon
   */
  fillControlPolygon(points, value) {
    // Similar to fillPolygon but for control buffer
    // ... (implementation similar to fillPolygon but writing to controlBuffer)
  }

  /**
   * Draw line with priority
   */
  drawLine(x1, y1, x2, y2, color, priority, width = 1) {
    const rgb = this.parseColor(color);
    
    // Bresenham's line algorithm
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let x = x1;
    let y = y1;
    
    while (true) {
      // Draw pixel with width
      for (let wy = -Math.floor(width/2); wy <= Math.floor(width/2); wy++) {
        for (let wx = -Math.floor(width/2); wx <= Math.floor(width/2); wx++) {
          const px = x + wx;
          const py = y + wy;
          
          if (px >= 0 && px < 320 && py >= 0 && py < 200) {
            const index = py * 320 + px;
            
            if (this.priorityBuffer[index] <= priority) {
              this.visualBuffer.data[index * 4] = rgb.r;
              this.visualBuffer.data[index * 4 + 1] = rgb.g;
              this.visualBuffer.data[index * 4 + 2] = rgb.b;
              this.visualBuffer.data[index * 4 + 3] = 255;
              this.priorityBuffer[index] = priority;
            }
          }
        }
      }
      
      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * Fill circle with priority
   */
  fillCircle(cx, cy, radius, color, priority) {
    const rgb = this.parseColor(color);
    
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        
        if (distance <= radius && x >= 0 && x < 320 && y >= 0 && y < 200) {
          const index = y * 320 + x;
          
          if (this.priorityBuffer[index] <= priority) {
            this.visualBuffer.data[index * 4] = rgb.r;
            this.visualBuffer.data[index * 4 + 1] = rgb.g;
            this.visualBuffer.data[index * 4 + 2] = rgb.b;
            this.visualBuffer.data[index * 4 + 3] = 255;
            this.priorityBuffer[index] = priority;
          }
        }
      }
    }
  }
}