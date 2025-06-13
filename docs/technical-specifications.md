# Somnium Technical Specifications

> **Implementation Status**: Phase 1 and 2 complete. All core modules, graphics rendering, sprite animation, and sound systems are fully implemented.

## System Requirements

### Minimum Browser Requirements

- Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- JavaScript ES6+ support
- Canvas 2D API support
- Web Audio API support
- 2GB RAM recommended
- Stable internet connection for AI features

## Core Technical Constraints

### Graphics Specifications

- **Resolution**: Fixed 320×200 pixels
- **Color Palette**: 16-color EGA only
- **Rendering**: Pixel-perfect (no smoothing)
- **Frame Rate**: Target 60 FPS, minimum 30 FPS

### EGA Color Palette (Exact Values)

```javascript
const EGA_PALETTE = {
  0x0: '#000000', // Black
  0x1: '#0000AA', // Blue
  0x2: '#00AA00', // Green
  0x3: '#00AAAA', // Cyan
  0x4: '#AA0000', // Red
  0x5: '#AA00AA', // Magenta
  0x6: '#AA5500', // Brown
  0x7: '#AAAAAA', // Light Gray
  0x8: '#555555', // Dark Gray
  0x9: '#5555FF', // Light Blue
  0xa: '#55FF55', // Light Green
  0xb: '#55FFFF', // Light Cyan
  0xc: '#FF5555', // Light Red
  0xd: '#FF55FF', // Light Magenta
  0xe: '#FFFF55', // Yellow
  0xf: '#FFFFFF', // White
};
```

### JSON Schema Specifications

#### Master Game JSON Structure

```typescript
interface GameJSON {
  plot: {
    title: string;
    backstory: string;
    goal: string;
  };

  rooms: Array<{
    id: string;
    name: string;
    description: string;
    exits: {
      [direction: string]: string; // roomId
    };
    items: string[]; // itemIds
    objects: string[]; // objectIds
    sound: {
      music_theme: string;
      ambience: string;
    };
    graphics: {
      backgroundColor: string; // EGA hex
      primitives: Array<{
        type: 'rect' | 'polygon' | 'dithered_gradient' | 'circle' | 'star';
        color?: string; // EGA hex
        color1?: string; // For gradients
        color2?: string; // For gradients
        dims?: [number, number, number, number]; // x, y, width, height
        points?: Array<[number, number]>; // For polygons
        center?: [number, number]; // For circles/stars
        radius?: number;
        label?: string;
      }>;
    };
  }>;

  items: Array<{
    id: string;
    name: string;
    description: string;
  }>;

  puzzles: Array<{
    id: string;
    description: string;
    obstacle: string;
    solution: {
      verb: string;
      item: string;
      target?: string;
    };
    reward_text: string;
    unlocks: {
      type: 'ENABLE_EXIT' | 'REVEAL_ITEM' | 'SET_FLAG' | 'REMOVE_OBJECT';
      [key: string]: any;
    };
  }>;

  objects?: Array<{
    id: string;
    name: string;
    description: string;
    events: {
      [eventName: string]: {
        condition?: string; // Flag expression
        responseText: string;
        actions?: Array<{
          type: string;
          [param: string]: any;
        }>;
      };
    };
  }>;
}
```

#### Save File Structure

```typescript
interface SaveFile {
  version: number;
  timestamp: number;
  resources: GameJSON; // Original generated content
  state: {
    currentRoom: string;
    playerPosition?: [number, number];
    inventory: string[];
    flags: { [key: string]: boolean | number | string };
    objectStates: {
      [objectId: string]: {
        visible?: boolean;
        position?: [number, number];
        currentAnimation?: string;
        [key: string]: any;
      };
    };
    viewStates: {
      [viewId: string]: {
        position: [number, number];
        currentLoop: string;
        currentFrame: number;
      };
    };
    timers: Array<{
      id: string;
      remainingTime: number;
      action: any;
    }>;
    score: number;
    moves: number;
  };
}
```

## API Specifications

### LLM Integration

#### Initial Generation Request

```javascript
const generationPrompt = {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'gemini-pro',
  temperature: 0.3, // 0.3-0.5 for consistency
  max_tokens: 4000, // Adjust based on model
  messages: [
    {
      role: 'system',
      content: MASTER_PROMPT_TEMPLATE,
    },
    {
      role: 'user',
      content: `Generate adventure with theme: ${userTheme}`,
    },
  ],
};
```

#### Dynamic Interaction Request

```javascript
const dynamicPrompt = {
  model: 'gpt-3.5-turbo', // Faster model for interactions
  temperature: 0.7, // Higher for variety
  max_tokens: 150, // Keep responses concise
  messages: [
    {
      role: 'system',
      content: 'You are the narrator for a Sierra-style adventure game...',
    },
    {
      role: 'user',
      content: buildContextString(gameState, playerAction),
    },
  ],
};
```

### Module APIs

#### GameManager API

```javascript
class GameManager {
  constructor(canvas, config);

  async startNewGame(theme?: string): Promise<void>;
  async loadGame(saveData: SaveFile): Promise<void>;
  saveGame(): SaveFile;

  pauseGame(): void;
  resumeGame(): void;
  setSpeed(speed: number): void; // 1-5

  // Internal use
  update(deltaTime: number): void;
  render(): void;
}
```

#### Parser API

```javascript
class Parser {
  constructor(vocabulary: VocabularyConfig);

  parse(input: string): ParsedCommand | null;
  addSynonym(word: string, canonical: string): void;
  setContext(gameState: GameState): void;
}

interface ParsedCommand {
  verb: string;
  directObject?: string;
  indirectObject?: string;
  preposition?: string;
}
```

#### EventManager API

```javascript
class EventManager {
  constructor(gameState: GameState);

  async executeCommand(command: ParsedCommand): Promise<void>;
  scheduleEvent(delay: number, action: Action): void;

  // Action types
  executeAction(action: Action): void;
}

type Action =
  | { type: 'SET_FLAG'; flag: string; value: any }
  | { type: 'GIVE_ITEM'; item: string }
  | { type: 'REMOVE_ITEM'; item: string }
  | { type: 'PLAY_SOUND'; sound: string }
  | { type: 'SHOW_MESSAGE'; text: string }
  | { type: 'CHANGE_ROOM'; room: string }
  | { type: 'ENABLE_EXIT'; room: string; direction: string }
  | { type: 'MOVE_VIEW'; view: string; x: number; y: number };
```

## Performance Specifications

### Memory Limits

- Maximum game JSON size: 500KB
- Maximum save file size: 1MB
- Sprite cache limit: 50 sprites
- Sound buffer limit: 10 concurrent sounds

### Timing Specifications

- Game loop: 16.67ms (60 FPS target)
- Animation frame duration: 100-300ms typical
- Input polling: Every frame
- Auto-save interval: 5 minutes (optional)

### Network Specifications

- AI API timeout: 30 seconds
- Retry attempts: 3 with exponential backoff
- Cache dynamic responses: 5 minutes
- Rate limit: 10 requests per minute

## Drawing Primitives Implementation

### Dithered Gradient Algorithm

```javascript
function drawDitheredGradient(ctx, x, y, w, h, color1, color2) {
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const useColor1 = (px + py) % 2 === 0;
      const color = useColor1 ? color1 : color2;
      // Set pixel using color...
    }
  }

  ctx.putImageData(imageData, x, y);
}
```

### Priority System

- Y-coordinate based: Higher Y = higher priority (closer to viewer)
- Priority bands: 15 bands (0-14) mapped to Y coordinates
- Special priority 15: Always on top (UI elements)

## Error Handling Specifications

### LLM Error Recovery

1. Invalid JSON: Re-prompt with error details
2. Missing required fields: Use defaults or re-prompt
3. API timeout: Show loading message, offer retry
4. Rate limit: Queue requests, show estimation

### Runtime Error Handling

1. Missing resources: Graceful degradation
2. Canvas errors: Fallback to basic rendering
3. Audio errors: Continue without sound
4. Save corruption: Offer recovery options

## Security Specifications

### API Key Management

- Never expose keys in client code
- Use environment variables or proxy server
- Implement key rotation capability
- Monitor usage for anomalies

### Content Security

- Sanitize all LLM outputs
- Validate JSON structure strictly
- Prevent script injection
- Limit file operations to saves only

## Browser Storage Limits

- localStorage: 5-10MB typical
- IndexedDB: Much larger, use for save files
- Session storage: Temporary game state only
