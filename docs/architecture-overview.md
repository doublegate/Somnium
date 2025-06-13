# Somnium Architecture Overview

## Design Philosophy

Somnium follows the Sierra Creative Interpreter (SCI) philosophy: complete separation between the game engine and content. This architecture enables:

- **Content Independence**: The engine can run any properly formatted game data
- **AI Integration**: LLMs generate content packages that the engine interprets
- **Modularity**: Each system component has clear boundaries and responsibilities
- **Authenticity**: Faithful recreation of late-1980s adventure game experience

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
├─────────────────────────────────────────────────────────────┤
│                    User Interface Layer                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐     │
│  │  Menu Bar   │  │ Text Window  │  │  Canvas Display │     │
│  └─────────────┘  └──────────────┘  └─────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    Game Engine Core                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   GameManager                       │    │
│  │  - Main loop (requestAnimationFrame)                │    │
│  │  - Module orchestration                             │    │
│  │  - Event queue management                           │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Engine Modules                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  Parser  │ │  Event   │ │  Scene   │ │   View   │        │
│  │          │ │ Manager  │ │ Renderer │ │ Manager  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  Sound   │ │   Game   │ │    AI    │ │  Save/   │        │
│  │ Manager  │ │  State   │ │ Manager  │ │  Load    │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    External Services                        │
│  ┌─────────────────────┐  ┌─────────────────────────┐       │
│  │   LLM API Service   │  │  Content Moderation API │       │
│  └─────────────────────┘  └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Game Generation Flow

```
User Input (theme)
    ↓
AIManager (constructs prompt)
    ↓
LLM API (generates JSON)
    ↓
AIManager (validates response)
    ↓
GameState (loads resources)
    ↓
SceneRenderer (draws first room)
    ↓
Game Ready
```

### 2. Command Processing Flow

```
Player Types Command
    ↓
Parser (tokenize & structure)
    ↓
EventManager (check for scripted event)
    ↓
[Scripted Path]              [Dynamic Path]
Execute predefined actions    AIManager queries LLM
    ↓                             ↓
Update GameState             Display response
    ↓                             ↓
Render changes               Continue game
```

### 3. Render Pipeline

```
GameManager tick
    ↓
Update animations (ViewManager)
    ↓
Clear canvas (SceneRenderer)
    ↓
Draw background (SceneRenderer)
    ↓
Draw sprites by priority (ViewManager)
    ↓
Present frame
```

## Module Responsibilities

### GameManager

- **Owner of**: Main game loop, timing, global coordination
- **Depends on**: All other modules
- **Key responsibilities**:
  - Initialize and configure all modules
  - Drive the game loop via requestAnimationFrame
  - Manage game speed settings
  - Coordinate module interactions
  - Handle pause/resume states

### AIManager

- **Owner of**: LLM communication, prompt generation
- **Depends on**: GameState (for context)
- **Key responsibilities**:
  - Generate initial world from theme
  - Validate AI responses
  - Handle dynamic interactions
  - Implement content moderation
  - Manage API rate limiting

### GameState

- **Owner of**: All mutable game data
- **Depends on**: None (pure data storage)
- **Key responsibilities**:
  - Store world resources (rooms, items, etc.)
  - Track dynamic state (inventory, flags)
  - Provide query interface for game data
  - Handle state serialization/deserialization

### Parser

- **Owner of**: Natural language processing
- **Depends on**: GameState (for context)
- **Key responsibilities**:
  - Tokenize player input
  - Resolve synonyms and abbreviations
  - Handle pronouns with context
  - Structure commands for execution

### EventManager

- **Owner of**: Game logic execution
- **Depends on**: GameState, AIManager
- **Key responsibilities**:
  - Execute scripted events from JSON
  - Evaluate conditional logic
  - Route unscripted actions to AI
  - Manage timed events queue
  - Update game state from actions

### SceneRenderer

- **Owner of**: Static background rendering
- **Depends on**: None
- **Key responsibilities**:
  - Draw vector primitives
  - Implement EGA palette
  - Handle dithering patterns
  - Maintain priority/depth system
  - Optimize canvas operations

### ViewManager

- **Owner of**: Sprite animation and movement
- **Depends on**: SceneRenderer (for layering)
- **Key responsibilities**:
  - Manage sprite animations
  - Handle character movement
  - Implement animation loops
  - Coordinate with priority system
  - Update sprite positions

### SoundManager

- **Owner of**: Audio playback
- **Depends on**: Tone.js library
- **Key responsibilities**:
  - Generate music from descriptions
  - Play ambient sounds
  - Trigger sound effects
  - Manage volume settings
  - Handle audio context

## Key Design Patterns

### 1. Resource-Based Architecture

All game content is data-driven through JSON resources, similar to SCI's resource files:

- **PIC** (backgrounds) → graphics.primitives array
- **VIEW** (sprites) → view definitions with animation loops
- **SCRIPT** (logic) → event definitions in objects
- **SOUND** (audio) → music themes and sound descriptors

### 2. Event-Driven Interactions

Player actions trigger events that cascade through the system:

```javascript
PlayerInput → ParsedCommand → Event → Actions → StateChanges → Render
```

### 3. Fallback Chains

Graceful degradation for unhandled scenarios:

```javascript
Scripted Event → Dynamic AI Response → Generic Error Message
```

### 4. State Synchronization

Central GameState ensures consistency:

- Single source of truth for all game data
- All modules read from GameState
- Only EventManager writes to GameState

## Performance Considerations

### Rendering Optimization

- Use `requestAnimationFrame` for smooth 60 FPS
- Only redraw changed screen regions when possible
- Cache frequently used graphics operations
- Disable image smoothing for pixel-perfect rendering

### Memory Management

- Limit sprite cache size
- Reuse animation frame objects
- Clear unused audio buffers
- Implement save file size limits

### Network Optimization

- Cache AI responses for identical inputs
- Implement request debouncing
- Use smaller model for dynamic interactions
- Preload common sound effects

## Extension Points

### Adding New Features

1. **New Primitive Shapes**

   - Add to SceneRenderer.drawPrimitive switch
   - Update AI prompt with new shape format
   - Add validation in AIManager

2. **New Verb Commands**

   - Add to Parser vocabulary
   - Define synonyms in configuration
   - Update help documentation

3. **New Event Actions**

   - Add to EventManager.executeAction
   - Update TypeScript/JSDoc types
   - Document in event action list

4. **New Sound Types**
   - Extend SoundManager synthesis options
   - Update AI sound descriptor format
   - Add to audio preset library

## Security Architecture

### API Key Protection

- Keys stored in gitignored config files
- Consider proxy server for production
- Implement key rotation mechanism
- Monitor usage for anomalies

### Content Security

- Validate all AI-generated JSON
- Sanitize text output for XSS
- Implement CSP headers
- Restrict file system access

### User Data Protection

- Save files stored locally only
- No tracking or analytics by default
- Clear sensitive data on exit
- Implement data export tools

## Testing Architecture

### Unit Test Boundaries

Each module should be testable in isolation:

- Mock dependencies via constructor injection
- Test public APIs, not implementation
- Achieve >80% code coverage

### Integration Test Points

Critical paths that must be tested together:

- Parser → EventManager → GameState
- AIManager → GameState → Renderer
- Save → Serialize → Deserialize → Load

### End-to-End Scenarios

Complete user journeys to validate:

- New game generation → First command → Save
- Load game → Solve puzzle → Win condition
- Network failure → Graceful degradation → Recovery

## Deployment Architecture

### Static Hosting

The entire game runs client-side:

- No server requirements beyond static files
- CDN-friendly for global distribution
- Works offline after initial load (except AI features)

### Progressive Enhancement

Core features work without optional services:

- Game engine runs without AI (using test data)
- Plays without sound if Web Audio unavailable
- Degrades gracefully on older browsers

### Configuration Management

Environment-based configuration:

- Development: Local API keys, debug enabled
- Staging: Test API endpoints, limited rate
- Production: Proxy server, full moderation

This architecture ensures Somnium remains true to its SCI heritage while leveraging modern web technologies and AI capabilities to create infinite unique adventures.
