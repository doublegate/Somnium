# Module API Reference

## GameManager

The central orchestrator that manages the game loop and coordinates all other modules.

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

---

## AIManager

Handles all LLM communication for content generation and dynamic interactions.

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

## GameState

Centralized storage for all game state data.

### Constructor

```javascript
new GameState();
```

### Methods

#### `loadResources(gameJSON)`

Initialize state from generated game data.

- `gameJSON`: GameJSON object

#### `getCurrentRoom()`

- Returns: Room object

#### `getInventory()`

- Returns: Array of item IDs

#### `hasItem(itemId)`

- `itemId`: String
- Returns: Boolean

#### `addItem(itemId)` / `removeItem(itemId)`

Manage inventory items.

#### `getFlag(flagName)` / `setFlag(flagName, value)`

Get/set game flags for puzzle state.

#### `getObject(objectId)`

Get object data by ID.

- Returns: Object or null

#### `serialize()`

Create saveable state snapshot.

- Returns: State object for save file

#### `deserialize(state)`

Restore from saved state.

---

## SceneRenderer

Handles all background rendering using vector primitives.

### Constructor

```javascript
new SceneRenderer(canvas);
```

- `canvas`: HTMLCanvasElement

### Methods

#### `renderRoom(roomGraphics)`

Draw complete room background.

- `roomGraphics`: Room graphics object with primitives

#### `clear()`

Clear canvas to black.

#### `drawPrimitive(primitive)`

Draw a single primitive shape.

- `primitive`: Primitive object

#### `drawDitheredGradient(x, y, width, height, color1, color2)`

Draw 2x2 dithered pattern gradient.

#### `getPixelPriority(x, y)`

Get priority value at pixel position.

- Returns: Number (0-15)

---

## ViewManager

Manages all animated sprites and moving objects.

### Constructor

```javascript
new ViewManager(sceneRenderer);
```

### Methods

#### `createView(id, viewData)`

Create new sprite from data.

- `id`: String - Unique identifier
- `viewData`: Object with animation loops

#### `updateView(id, deltaTime)`

Update animation for view.

#### `moveView(id, x, y, duration)`

Move view to position over time.

#### `setLoop(id, loopName)`

Change animation loop.

#### `renderAll()`

Draw all active views.

---

## SoundManager

Handles music and sound effects using Tone.js.

### Constructor

```javascript
new SoundManager();
```

### Methods

#### `async initialize()`

Set up Tone.js and audio context.

#### `playMusic(musicTheme)`

Start background music from theme description.

- `musicTheme`: String - Theme descriptor

#### `playAmbience(ambienceDesc)`

Start ambient sound loop.

#### `playSound(soundId)`

Play one-shot sound effect.

#### `stopAll()`

Stop all audio.

#### `setVolume(level)`

Set master volume (0.0 - 1.0).

---

## Parser

Processes player text input into structured commands.

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

#### `addSynonym(word, canonical)`

Add vocabulary synonym.

#### `setContext(gameState)`

Update parser context for pronouns.

---

## EventManager

Executes game logic from scripts and player commands.

### Constructor

```javascript
new EventManager(gameState, aiManager);
```

### Methods

#### `async executeCommand(command)`

Process parsed command.

- `command`: ParsedCommand
- Returns: Promise<void>

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

---

## Common Types

### ParsedCommand

```javascript
{
  verb: String,
  directObject?: String,
  indirectObject?: String,
  preposition?: String
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
  type: 'rect' | 'polygon' | 'dithered_gradient' | 'circle' | 'star',
  color?: String,      // EGA hex color
  color1?: String,     // For gradients
  color2?: String,     // For gradients
  dims?: [x, y, w, h], // For rect/gradient
  points?: [[x,y]...], // For polygon
  center?: [x, y],     // For circle/star
  radius?: Number
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
