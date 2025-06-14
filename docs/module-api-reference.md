# Module API Reference

> **Implementation Status**: Phase 1-2 complete, Phase 3 in progress. All core modules fully implemented with comprehensive APIs.

## GameManager ✅ COMPLETE

The central orchestrator that manages the game loop and coordinates all other modules. Implements fixed timestep game loop with interpolation for smooth 60 FPS rendering.

### Constructor

```javascript
new GameManager(canvasElement, config);
```

- `canvasElement`: HTMLCanvasElement - The game display canvas
- `config`: Object - Configuration options
  - `apiKey`: String - LLM API key
  - `apiEndpoint`: String - LLM API URL
  - `moderationEnabled`: Boolean - Enable content filtering
  - `debugMode`: Boolean - Enable debug features

### Methods

#### `async startNewGame(theme)`

Generates and starts a new adventure.

- `theme`: String (optional) - Theme or setting for the adventure
- Returns: Promise<void>
- Throws: Error if generation fails

#### `async loadGame(saveData)`

Loads a previously saved game.

- `saveData`: SaveFile - Complete save file object
- Returns: Promise<void>
- Throws: Error if save file invalid

#### `saveGame()`

Creates a save file of current game state.

- Returns: SaveFile object

#### `pauseGame()` / `resumeGame()`

Pause/resume game loop and timers.

#### `setSpeed(speed)`

Adjust game speed (1-5, where 3 is normal).

#### `update(deltaTime)`

Update all game systems with fixed timestep accumulator.

- `deltaTime`: Number - Time since last frame in ms

#### `render()`

Render current frame with interpolation.

#### `showDebug()` / `hideDebug()`

Toggle FPS counter and debug overlay.

---

## AIManager ✅ COMPLETE

Handles all LLM communication for content generation and dynamic interactions. Includes mock mode for testing without API calls.

### Constructor

```javascript
new AIManager(config);
```

- `config`: Object
  - `apiKey`: String
  - `apiEndpoint`: String
  - `model`: String - Model name
  - `moderationEndpoint`: String (optional)

### Methods

#### `async generateWorld(theme)`

Generate complete game world from theme.

- `theme`: String (optional)
- Returns: Promise<GameJSON>
- Throws: Error with details if generation fails

#### `async getDynamicResponse(context, action)`

Get LLM response for unscripted action.

- `context`: Object - Current game context
- `action`: ParsedCommand - Player's action
- Returns: Promise<String> - Narrative response

#### `async checkContent(text)`

Run content moderation check.

- `text`: String
- Returns: Promise<{safe: Boolean, reason?: String}>

---

## GameState ✅ COMPLETE

Centralized storage for all game state data. Extends EventTarget for state change notifications. Includes validation, undo/redo support, and comprehensive state management.

### Constructor

```javascript
new GameState();
```

### Methods

#### `loadResources(gameJSON)`

Initialize state from generated game data with validation.

- `gameJSON`: GameJSON object
- Throws: Error if validation fails

#### `getCurrentRoom()`

- Returns: Room object

#### `getInventory()`

- Returns: Array of item IDs

#### `hasItem(itemId)`

- `itemId`: String
- Returns: Boolean

#### `addItem(itemId)` / `removeItem(itemId)`

Manage inventory items. Dispatches 'inventoryChanged' event.

#### `getFlag(flagName)` / `setFlag(flagName, value)`

Get/set game flags for puzzle state. Dispatches 'flagChanged' event.

#### `getObject(objectId)`

Get object data by ID.

- Returns: Object or null

#### `serialize()`

Create saveable state snapshot.

- Returns: State object for save file

#### `deserialize(state)`

Restore from saved state.

#### `undo()` / `redo()`

Undo/redo state changes with history support.

#### `validate(data)`

Validate game data structure.

- Returns: {valid: Boolean, errors: Array}

### Events

- `stateChanged`: Any state change
- `roomChanged`: Player moved rooms
- `inventoryChanged`: Inventory modified
- `flagChanged`: Flag value changed

---

## SceneRenderer ✅ COMPLETE

Handles all background rendering using vector primitives. Implements all SCI0-era drawing primitives with EGA palette, dithering patterns, and priority system.

### Constructor

```javascript
new SceneRenderer(canvas);
```

- `canvas`: HTMLCanvasElement

### Methods

#### `renderRoom(roomGraphics, roomId)`

Draw complete room background with caching support.

- `roomGraphics`: Room graphics object with primitives and backgroundColor
- `roomId`: Optional string for scene caching

#### `clear()`

Clear canvas to black.

#### `drawPrimitive(primitive)`

Draw a single primitive shape.

- `primitive`: Primitive object with type and properties

Supported primitive types:

- `rect`: Rectangle with optional fill/stroke
- `polygon`: Polygon with vertex array (scanline filled)
- `circle`: Circle with center and radius (pixel-perfect)
- `ellipse`: Ellipse with radiusX, radiusY, rotation
- `line`: Line between two points (Bresenham algorithm)
- `star`: 5-pointed star shape
- `triangle`: Optimized 3-point polygon
- `path`: Complex path with commands
- `dithered_gradient`: 9 different dither patterns

#### `drawDitheredRect(x, y, width, height, color1, color2, pattern)`

Draw rectangle with dithering pattern.

- `pattern`: String - Pattern name:
  - 'CHECKERBOARD': 50% mix checkerboard
  - 'VERTICAL': Vertical lines
  - 'HORIZONTAL': Horizontal lines
  - 'DIAGONAL_LEFT': Left diagonal pattern
  - 'DIAGONAL_RIGHT': Right diagonal pattern
  - 'DOTS_SPARSE': Sparse dot pattern
  - 'DOTS_MEDIUM': Medium dot pattern
  - 'CROSS_HATCH': Cross-hatch pattern
  - 'SOLID': Solid color1

#### `getPixelPriority(x, y)`

Get priority value at pixel position.

- Returns: Number (0-15)

#### `validateColor(color)`

Validate and convert color to EGA palette.

- `color`: String (hex/name) or number (index)
- Returns: Valid EGA hex color string

#### `getEGAColor(index)`

Get EGA color from palette index.

- `index`: Number 0-15
- Returns: Hex color string

#### `setDebugMode(enabled, options)`

Enable debug visualization.

- `enabled`: Boolean
- `options`: Object with `showPriorityMap`, `showGrid`

#### `clearCache()`

Clear the scene cache for re-rendering.

---

## ViewManager ✅ COMPLETE

Manages all animated sprites and moving objects. Implements smooth interpolation, sprite pooling, collision detection, and z-order management.

### Constructor

```javascript
new ViewManager(sceneRenderer);
```

### Methods

#### `createSprite(id, viewData, options)`

Create new sprite from data.

- `id`: String - Unique identifier
- `viewData`: Object with animation loops
- `options`: Object - Creation options
  - `x`, `y`: Initial position
  - `scale`: Sprite scale
  - `visible`: Initial visibility

#### `update(deltaTime)`

Update all sprite animations and movements.

#### `moveSprite(id, targetX, targetY, duration, easing)`

Move sprite smoothly to position.

- `easing`: String - 'linear', 'easeIn', 'easeOut', 'easeInOut'

#### `setAnimation(id, loopName, frame)`

Change sprite animation loop.

#### `render(ctx, interpolation)`

Draw all active sprites with interpolation.

#### `checkCollision(id1, id2)`

Check collision between two sprites.

- Returns: Boolean

#### `setSpriteProperty(id, property, value)`

Set sprite property (scale, visible, priority, etc).

---

## SoundManager ✅ COMPLETE

Handles music and sound effects using Tone.js. Implements 16-channel audio, 128 polyphonic voices, ADSR envelopes, and frame-accurate scheduling.

### Constructor

```javascript
new SoundManager();
```

### Methods

#### `async initialize()`

Set up Tone.js and audio context.

#### `playMusic(descriptor)`

Start background music from descriptor.

- `descriptor`: Object - Music configuration
  - `tempo`: Number - BPM
  - `timeSignature`: Array - [4, 4]
  - `parts`: Array - Instrument parts

#### `playSound(descriptor, channel)`

Play sound effect on specific channel.

- `descriptor`: Object - Sound configuration
  - `waveform`: String - 'sine', 'square', 'sawtooth', 'triangle'
  - `frequency`: Number or Note string
  - `duration`: Number - Seconds
  - `envelope`: ADSR values
  - `effects`: Array - Effect chain

#### `stopChannel(channel)`

Stop specific audio channel.

#### `stopAll()`

Stop all audio channels.

#### `setMasterVolume(level)` / `setChannelVolume(channel, level)`

Set volume levels (0.0 - 1.0).

#### `scheduleSound(descriptor, time, channel)`

Schedule sound for future playback with frame accuracy.

---

## Parser ✅ COMPLETE

Processes player text input into structured commands. Supports 150+ verbs with synonyms, multi-word nouns, pronouns (it, them, him, her, me), and command abbreviations.

### Constructor

```javascript
new Parser(vocabulary);
```

- `vocabulary`: Object - Verb synonyms and patterns

### Methods

#### `parse(input)`

Parse player input string.

- `input`: String
- Returns: ParsedCommand or null

```javascript
{
  verb: String,
  directObject?: String,
  indirectObject?: String,
  preposition?: String,
  raw: String,          // Original input
  confidence: Number    // Parse confidence 0-1
}
```

#### `addVerb(verb, options)`

Add verb to vocabulary.

- `options`: Object
  - `synonyms`: Array<String>
  - `prepositions`: Array<String>
  - `requiresObject`: Boolean

#### `addNoun(noun, options)`

Add noun to vocabulary.

- `options`: Object
  - `synonyms`: Array<String>
  - `adjectives`: Array<String>

#### `setContext(context)`

Update parser context for pronoun resolution.

- `context`: Object
  - `lastNoun`: String
  - `lastActor`: String
  - `roomObjects`: Array<String>

---

## EventManager & CommandSystem ✅ COMPLETE

Executes game logic from scripts and player commands. CommandSystem provides advanced command registration with patterns, hooks, and priority handling.

### Constructor

```javascript
new EventManager(gameState, aiManager);
```

### EventManager Methods

#### `async executeCommand(command)`

Process parsed command through registered handlers.

- `command`: ParsedCommand
- Returns: Promise<CommandResult>

#### `executeAction(action)`

Execute single game action.

- `action`: Action object

#### `scheduleEvent(delay, action)`

Schedule future action.

- `delay`: Number - Milliseconds
- `action`: Action object

#### `checkCondition(condition)`

Evaluate conditional expression.

- `condition`: String - Flag expression
- Returns: Boolean

### CommandSystem Methods

#### `registerCommand(config)`

Register command handler.

```javascript
{
  pattern: String | RegExp,
  handler: async (match, context) => CommandResult,
  preExecute?: async (command, context) => Boolean,
  postExecute?: async (result, context) => void,
  priority?: Number,
  aliases?: Array<String>
}
```

#### `executeCommand(parsedCommand, context)`

Execute command with hooks.

- Returns: Promise<CommandResult>

```javascript
{
  success: Boolean,
  message?: String,
  consumed?: Boolean,
  data?: Any
}
```

#### `getCommandHistory()`

Get command execution history.

- Returns: Array<CommandHistoryEntry>

---

## Common Types

### ParsedCommand

```javascript
{
  verb: String,
  directObject?: String,
  indirectObject?: String,
  preposition?: String,
  raw: String,          // Original input
  confidence: Number    // Parse confidence 0-1
}
```

### Action

```javascript
{
  type: 'SET_FLAG' | 'GIVE_ITEM' | 'REMOVE_ITEM' | 'PLAY_SOUND' |
        'SHOW_MESSAGE' | 'CHANGE_ROOM' | 'ENABLE_EXIT' | 'MOVE_VIEW',
  // Additional properties based on type
}
```

### Primitive

```javascript
{
  type: 'rect' | 'polygon' | 'dithered_gradient' | 'circle' | 'ellipse' |
        'line' | 'star' | 'triangle' | 'path',
  color?: String,      // EGA hex color or name or index
  filled?: Boolean,    // Whether to fill or stroke (default: true)
  priority?: Number,   // Priority value 0-15

  // Type-specific properties:

  // For rect/dithered_gradient:
  dims?: [x, y, w, h],

  // For polygon/triangle/line:
  points?: [[x,y]...],

  // For circle:
  center?: [x, y],
  radius?: Number,

  // For ellipse:
  center?: [x, y],
  radiusX?: Number,
  radiusY?: Number,
  rotation?: Number,

  // For star (pixels):
  points?: [[x,y]...], // Star pixel locations

  // For star (shape):
  center?: [x, y],
  radius?: Number,
  numPoints?: Number,  // Number of star points (default: 5)

  // For line:
  width?: Number,      // Line width (default: 1)

  // For dithered_gradient:
  color1?: String,     // First color
  color2?: String,     // Second color
  pattern?: String,    // Pattern name (see drawDitheredRect)

  // For path:
  commands?: [         // Path drawing commands
    { type: 'moveTo', x: Number, y: Number },
    { type: 'lineTo', x: Number, y: Number },
    { type: 'quadraticCurveTo', cpx: Number, cpy: Number, x: Number, y: Number },
    { type: 'bezierCurveTo', cp1x: Number, cp1y: Number, cp2x: Number, cp2y: Number, x: Number, y: Number },
    { type: 'closePath' }
  ]
}
```

---

## Usage Examples

### Starting a New Game

```javascript
const canvas = document.getElementById('gameCanvas');
const gameManager = new GameManager(canvas, {
  apiKey: 'your-api-key',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
});

await gameManager.startNewGame('haunted mansion');
```

### Handling Player Input

```javascript
const parser = new Parser(vocabularyConfig);
const command = parser.parse('take brass key');
if (command) {
  await eventManager.executeCommand(command);
}
```

### Custom Event Action

```javascript
eventManager.executeAction({
  type: 'SHOW_MESSAGE',
  text: 'The door creaks open revealing a dark passage.',
});

eventManager.executeAction({
  type: 'ENABLE_EXIT',
  roomId: 'hallway',
  exit: 'north',
});
```
