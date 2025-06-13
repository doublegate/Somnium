# Common Implementation Patterns

## Parser Patterns

### Synonym Resolution
```javascript
const VERB_SYNONYMS = {
  'take': ['get', 'grab', 'pick up', 'acquire'],
  'look': ['examine', 'inspect', 'view', 'check'],
  'use': ['apply', 'utilize', 'employ'],
  'talk': ['speak', 'chat', 'converse'],
  'go': ['move', 'walk', 'travel', 'proceed']
};

function resolveVerb(verb) {
  // Check if it's already canonical
  if (VERB_SYNONYMS[verb]) return verb;
  
  // Find canonical form
  for (const [canonical, synonyms] of Object.entries(VERB_SYNONYMS)) {
    if (synonyms.includes(verb.toLowerCase())) {
      return canonical;
    }
  }
  
  return null; // Unknown verb
}
```

### Multi-word Object Recognition
```javascript
function parseNoun(words, startIndex, gameState) {
  const roomObjects = gameState.getCurrentRoomObjects();
  let bestMatch = null;
  let bestLength = 0;
  
  // Try progressively shorter phrases
  for (let length = words.length - startIndex; length > 0; length--) {
    const phrase = words.slice(startIndex, startIndex + length).join(' ');
    
    // Check room objects and inventory
    const match = roomObjects.find(obj => 
      obj.name.toLowerCase() === phrase.toLowerCase() ||
      obj.id === phrase.replace(/\s+/g, '_').toLowerCase()
    );
    
    if (match && length > bestLength) {
      bestMatch = match;
      bestLength = length;
    }
  }
  
  return bestMatch ? 
    { object: bestMatch.id, wordsConsumed: bestLength } : 
    null;
}
```

## Rendering Patterns

### EGA Color Validation
```javascript
const EGA_PALETTE = new Set([
  '#000000', '#0000AA', '#00AA00', '#00AAAA',
  '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
  '#555555', '#5555FF', '#55FF55', '#55FFFF',
  '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
]);

function validateEGAColor(color) {
  const normalized = color.toUpperCase();
  if (!EGA_PALETTE.has(normalized)) {
    throw new Error(`Invalid EGA color: ${color}`);
  }
  return normalized;
}

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
```

### Efficient Dithering
```javascript
function createDitherPattern(color1, color2) {
  // Create 2x2 pattern for reuse
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  
  // Checkerboard pattern
  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillRect(1, 1, 1, 1);
  
  ctx.fillStyle = color2;
  ctx.fillRect(1, 0, 1, 1);
  ctx.fillRect(0, 1, 1, 1);
  
  return ctx.createPattern(canvas, 'repeat');
}

// Cache patterns for performance
const ditherCache = new Map();

function getDitherPattern(color1, color2) {
  const key = `${color1}-${color2}`;
  if (!ditherCache.has(key)) {
    ditherCache.set(key, createDitherPattern(color1, color2));
  }
  return ditherCache.get(key);
}
```

### Priority-based Rendering
```javascript
class PriorityRenderer {
  constructor(height = 200) {
    this.height = height;
    this.bands = 15; // 0-14 priority bands
  }
  
  getPriority(y) {
    // Higher Y coordinate = higher priority (closer to camera)
    return Math.floor((y / this.height) * this.bands);
  }
  
  sortByPriority(objects) {
    return objects.sort((a, b) => {
      const priorityA = this.getPriority(a.y + a.height);
      const priorityB = this.getPriority(b.y + b.height);
      return priorityA - priorityB;
    });
  }
}
```

## State Management Patterns

### Flag Expression Evaluation
```javascript
function evaluateCondition(condition, gameState) {
  // Simple expression parser for conditions like "has_key == true && door_open == false"
  
  // Replace flag references with actual values
  let expression = condition;
  const flags = gameState.getAllFlags();
  
  for (const [flag, value] of Object.entries(flags)) {
    const regex = new RegExp(`\\b${flag}\\b`, 'g');
    expression = expression.replace(regex, JSON.stringify(value));
  }
  
  // Check for inventory items
  expression = expression.replace(/has_item\(['"](\w+)['"]\)/g, (match, itemId) => {
    return gameState.hasItem(itemId);
  });
  
  try {
    // Safe evaluation using Function constructor
    return new Function('return ' + expression)();
  } catch (e) {
    console.error('Failed to evaluate condition:', condition, e);
    return false;
  }
}
```

### Event Action Execution
```javascript
class ActionExecutor {
  constructor(gameState, sceneRenderer, soundManager) {
    this.gameState = gameState;
    this.sceneRenderer = sceneRenderer;
    this.soundManager = soundManager;
    
    this.actionHandlers = {
      'SET_FLAG': this.setFlag.bind(this),
      'GIVE_ITEM': this.giveItem.bind(this),
      'REMOVE_ITEM': this.removeItem.bind(this),
      'ENABLE_EXIT': this.enableExit.bind(this),
      'PLAY_SOUND': this.playSound.bind(this),
      'SHOW_MESSAGE': this.showMessage.bind(this),
      'CHANGE_ROOM': this.changeRoom.bind(this)
    };
  }
  
  async execute(action) {
    const handler = this.actionHandlers[action.type];
    if (!handler) {
      console.warn('Unknown action type:', action.type);
      return;
    }
    
    await handler(action);
  }
  
  setFlag(action) {
    this.gameState.setFlag(action.flag, action.value);
  }
  
  giveItem(action) {
    this.gameState.addItem(action.item);
    // Remove from current room if present
    const room = this.gameState.getCurrentRoom();
    room.items = room.items.filter(id => id !== action.item);
  }
  
  enableExit(action) {
    const room = this.gameState.getRoom(action.roomId);
    if (room) {
      room.exits[action.exit] = action.targetRoom;
    }
  }
}
```

## AI Integration Patterns

### Robust JSON Validation
```javascript
function validateGameJSON(json) {
  const errors = [];
  
  // Check required top-level keys
  const required = ['plot', 'rooms', 'items', 'puzzles'];
  for (const key of required) {
    if (!json[key]) {
      errors.push(`Missing required key: ${key}`);
    }
  }
  
  // Validate room structure
  if (json.rooms) {
    const roomIds = new Set(json.rooms.map(r => r.id));
    
    json.rooms.forEach((room, index) => {
      if (!room.id) {
        errors.push(`Room ${index} missing id`);
      }
      
      // Check exit validity
      if (room.exits) {
        Object.entries(room.exits).forEach(([dir, targetId]) => {
          if (targetId && !roomIds.has(targetId)) {
            errors.push(`Room ${room.id} exit ${dir} points to unknown room: ${targetId}`);
          }
        });
      }
      
      // Validate graphics
      if (room.graphics?.primitives) {
        room.graphics.primitives.forEach((prim, primIndex) => {
          try {
            if (prim.color) validateEGAColor(prim.color);
            if (prim.color1) validateEGAColor(prim.color1);
            if (prim.color2) validateEGAColor(prim.color2);
          } catch (e) {
            errors.push(`Room ${room.id} primitive ${primIndex}: ${e.message}`);
          }
        });
      }
    });
  }
  
  // Validate puzzle solvability
  if (json.puzzles && json.items) {
    const itemIds = new Set(json.items.map(i => i.id));
    
    json.puzzles.forEach(puzzle => {
      if (puzzle.solution?.item && !itemIds.has(puzzle.solution.item)) {
        errors.push(`Puzzle ${puzzle.id} requires non-existent item: ${puzzle.solution.item}`);
      }
    });
  }
  
  return errors;
}
```

### API Request Management
```javascript
class APIRequestManager {
  constructor(config) {
    this.config = config;
    this.requestQueue = [];
    this.processing = false;
    this.rateLimitDelay = 6000; // 10 requests per minute
  }
  
  async makeRequest(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ prompt, options, resolve, reject });
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.processing || this.requestQueue.length === 0) return;
    
    this.processing = true;
    const { prompt, options, resolve, reject } = this.requestQueue.shift();
    
    try {
      const response = await this.sendRequest(prompt, options);
      resolve(response);
    } catch (error) {
      reject(error);
    }
    
    // Rate limiting
    setTimeout(() => {
      this.processing = false;
      this.processQueue();
    }, this.rateLimitDelay);
  }
  
  async sendRequest(prompt, options) {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || this.config.model,
        messages: prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 150
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

## Animation Patterns

### Frame-based Animation
```javascript
class AnimationLoop {
  constructor(frames, frameDuration = 200) {
    this.frames = frames;
    this.frameDuration = frameDuration;
    this.currentFrame = 0;
    this.lastFrameTime = 0;
    this.playing = false;
  }
  
  start() {
    this.playing = true;
    this.lastFrameTime = performance.now();
  }
  
  stop() {
    this.playing = false;
    this.currentFrame = 0;
  }
  
  update(currentTime) {
    if (!this.playing) return false;
    
    const elapsed = currentTime - this.lastFrameTime;
    if (elapsed >= this.frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      this.lastFrameTime = currentTime;
      return true; // Frame changed
    }
    
    return false;
  }
  
  getCurrentFrame() {
    return this.frames[this.currentFrame];
  }
}
```

### Smooth Movement
```javascript
class MovementController {
  constructor() {
    this.movements = new Map();
  }
  
  startMovement(objectId, startPos, endPos, duration) {
    this.movements.set(objectId, {
      start: startPos,
      end: endPos,
      duration,
      startTime: performance.now(),
      easing: this.easeInOutQuad
    });
  }
  
  update(currentTime) {
    const completed = [];
    
    this.movements.forEach((movement, objectId) => {
      const elapsed = currentTime - movement.startTime;
      const progress = Math.min(elapsed / movement.duration, 1);
      
      if (progress >= 1) {
        completed.push(objectId);
      } else {
        const easedProgress = movement.easing(progress);
        const currentPos = {
          x: movement.start.x + (movement.end.x - movement.start.x) * easedProgress,
          y: movement.start.y + (movement.end.y - movement.start.y) * easedProgress
        };
        
        // Update object position
        this.updatePosition(objectId, currentPos);
      }
    });
    
    // Remove completed movements
    completed.forEach(id => this.movements.delete(id));
  }
  
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}
```

## Save/Load Patterns

### Versioned Save System
```javascript
class SaveManager {
  constructor() {
    this.currentVersion = 1;
  }
  
  createSaveFile(gameState, resources) {
    return {
      version: this.currentVersion,
      timestamp: Date.now(),
      resources: resources,
      state: {
        currentRoom: gameState.currentRoom,
        inventory: [...gameState.inventory],
        flags: { ...gameState.flags },
        objectStates: this.serializeObjectStates(gameState),
        score: gameState.score,
        moves: gameState.moves
      }
    };
  }
  
  loadSaveFile(saveData) {
    // Version checking
    if (saveData.version > this.currentVersion) {
      throw new Error('Save file from newer version');
    }
    
    // Apply migrations if needed
    let migrated = saveData;
    for (let v = saveData.version; v < this.currentVersion; v++) {
      migrated = this.migrate(migrated, v, v + 1);
    }
    
    return migrated;
  }
  
  migrate(saveData, fromVersion, toVersion) {
    // Handle version-specific migrations
    if (fromVersion === 0 && toVersion === 1) {
      // Example: Add new required fields
      saveData.state.objectStates = saveData.state.objectStates || {};
    }
    
    return saveData;
  }
}
```

These patterns provide robust, reusable solutions for common implementation challenges in Somnium. They emphasize error handling, performance optimization, and maintaining the authentic SCI experience.