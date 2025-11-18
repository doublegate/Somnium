# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-15

### 🎉 PRODUCTION RELEASE

Somnium v1.0.0 is a complete, production-ready AI-driven graphical text-adventure game inspired by Sierra On-Line's SCI0-era games (1988-1989). Every adventure is uniquely generated at runtime using LLMs while maintaining strict retro aesthetics and technical constraints.

---

## Major Features

### ✨ Phase 4 - AI Integration (Complete)

**World Generation System**
- **WorldGenerator.js**: AI-powered and static world generation
  - Three test world sizes (small 3-5 rooms, medium 6-10 rooms, large 15+ rooms)
  - Comprehensive 351-line world generation prompt template
  - Graphics enhancement utilities for procedural scene generation
  - Ambient sound assignment based on room themes
  - Complete offline mode fallback with static test worlds

**8-Step World Validation System**:
1. Room validation (exits, graphics descriptions, ambience settings)
2. Exit consistency checking (bidirectional verification)
3. Item validation (takeable items, descriptions, unique IDs)
4. Object validation (interactive objects, states, actions)
5. NPC validation (dialogue trees, trading mechanics, schedules)
6. Puzzle validation (solvability checks, required items exist)
7. ID reference validation (all item/object/room IDs referenced exist)
8. Automatic fixing utilities for common JSON structure issues

**Dynamic Interaction Handler**
- **DynamicInteractionHandler.js**: AI-powered responses for unscripted player actions
  - Context building from current game state (room, inventory, recent events, NPCs)
  - Response sanitization and validation to prevent game-breaking content
  - Intelligent fallback system for offline mode
  - Dynamic hint generation based on player progress
  - Dynamic NPC dialogue generation for natural conversations

**Enhanced AI Manager**
- Real LLM API integration using fetch() with proper error handling
- Exponential backoff retry logic (3 retries with 1s, 2s, 4s delays)
- Automatic offline mode fallback when API unavailable
- Rate limiting and request caching to minimize API costs
- Comprehensive error recovery and user notifications
- Support for OpenAI-compatible APIs (OpenAI, Anthropic, Ollama, LM Studio)
- Temperature and token controls for generation quality

**API Integration Details**:
```javascript
// Retry logic with exponential backoff
for (let attempt = 0; attempt <= retries; attempt++) {
  try {
    const response = await fetch(endpoint, config);
    // Success path
  } catch (error) {
    const backoffTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
    await sleep(backoffTime);
  }
}
```

---

### 🎨 Phase 5 - Polish and Sierra-Inspired Enhancements (Complete)

**Save/Load System**
- **SaveGameManager.js**: Professional multi-slot save system
  - 10 manual save slots + dedicated auto-save slot (-1)
  - Browser localStorage persistence (5-10MB per save)
  - File export to downloadable JSON
  - File import from uploaded JSON
  - Save thumbnails with metadata (room name, score, timestamp)
  - Version validation and compatibility checking
  - Quick save/quick load to most recent slot
  - Auto-save with configurable intervals (default: 5 minutes)
  - Storage usage statistics and management
  - Save slot corruption detection and recovery

**Priority-Based Audio System**
- **PrioritySoundManager.js**: Sierra-style audio channel management
  - 10-level priority system (speech=10, UI=9, combat=8, ambient=2, music=1)
  - Automatic interrupt handling (higher priority sounds interrupt lower)
  - Crossfade support for smooth audio transitions
  - Sound type auto-detection via regex pattern matching
  - Channel pooling with automatic cleanup
  - Category-based volume controls

**Synchronized Sound System**
- **SynchronizedSound.js**: Cue-based audio timing for cutscenes
  - 7 cue types: animation, state, effect, script, sound, event, callback
  - Frame-accurate timing synchronized with game loop
  - Predefined sequences (submarine dive, spell casting, door opening)
  - Callback system for gameplay synchronization
  - Sequence state tracking and cancellation
  - Integration with PrioritySoundManager

**Ambient Soundscape System**
- **AmbientSoundscape.js**: Layered environmental audio
  - 7 predefined soundscapes: ocean, underwater, space_station, space, forest, indoor, dungeon
  - Base loop layer for continuous ambience
  - Random occasional sounds with probability and interval controls
  - Conditional state-based sounds (weather, time of day, player health)
  - Smooth crossfades between room transitions
  - Dynamic volume mixing based on layers

**Priority-Based Rendering**
- **PriorityRenderer.js**: Depth-based rendering system like Sierra games
  - Three-buffer system: priority buffer, visual buffer, control buffer
  - Y-position priority gradient (sky=1 at y=0, foreground=14 at y=200)
  - Pixel-level depth testing for sprite compositing
  - Walkable area detection via control buffer
  - Primitive rendering with priority support (rect, polygon, circle, line)

**Enhanced Parser System**
- **SaidPattern.js**: Sierra Said() pattern matching
  - JavaScript regex compilation from Sierra syntax
  - Word classes: `<object>`, `<verb>`, `<noun>`, `<adjective>`
  - Alternatives: `get/take`, `look/examine`
  - Optional words: `[the]`, `[a]`
  - Wildcards: `*` for flexible matching
  - Capture group system for typed entity extraction
  - 40+ common Sierra adventure patterns preloaded

- **EnhancedParser.js**: Extended parser with Sierra patterns
  - Backward compatible with existing Parser.js
  - Multi-word verb preprocessing
  - Synonym expansion before pattern matching
  - Action-to-verb mapping (GIVE→give, CAST→cast, PRAY→pray)
  - Pattern matching as first-pass parser with fallback to original

**State-Based Animation System**
- **StateAnimator.js**: Complex character animation state machine
  - 8-directional walking states (N, NE, E, SE, S, SW, W, NW)
  - Action states: idle, pickup, talk, use, climb, swim, combat, death
  - Priority-based state interruption (death > combat > action > walking)
  - Smooth state transitions with validation
  - State history tracking for debugging
  - Frame callbacks for hit detection and event synchronization

---

### 🎮 Main Game UI and Player Experience (Complete)

**UIManager - Centralized UI State Management**
- Command history with arrow key navigation (max 50 commands, scrollable)
- Text output categorization with color coding:
  - **command**: Light cyan, bold (player input echo)
  - **game**: White (narrative and responses)
  - **system**: Yellow, italic (save/load messages, errors)
  - **title**: Light magenta, bold, 16px (room titles)
  - **description**: Light green (room descriptions)
  - **hint**: Light gray, italic (subtle guidance)
- Modal system for all dialogs (theme, about, error, save, load, volume)
- Loading screens with updatable messages during AI generation
- Sierra-style ASCII box title display for game start
- Offline mode detection with helpful notifications
- Automatic focus management for seamless keyboard interaction

**Visual Save/Load System**
- **Save UI**: 10-slot selector with rich metadata display
  - Shows save name, timestamp, location, score for each slot
  - "Empty" slots clearly marked and styled
  - Save/Overwrite/Delete functionality per slot
  - Custom save names via prompt dialog
  - Real-time slot updates after operations
  - Cancel button to abort save operation

- **Load UI**: Filtered slot list (only non-empty saves)
  - Auto-save included in load list with special label
  - Load/Delete functionality per slot
  - Confirmation dialogs for destructive operations
  - "No saves found" message when empty
  - Automatic modal close after successful load

**Volume Control System**
- Real-time sliders for 4 audio categories with live feedback:
  - **Master Volume**: Global audio control (0-100%)
  - **Music Volume**: Background music and themes
  - **Sound Effects**: Doors, footsteps, UI sounds
  - **Ambient Volume**: Environmental soundscapes
- Live percentage display updates during slider drag
- Immediate audio feedback (changes applied in real-time)
- Persistent volume settings (saved to game config)
- Accessible from main menu and in-game

**Game Control Features**
- **Restart Game**: Full game restart with theme preservation
  - Proper state cleanup (stop game loop, disable auto-save)
  - Loading screen during restart transition
  - Preserves original theme or allows random generation
  - Resets all game state (inventory, score, puzzles, NPCs)
  - Auto-save management (creates new auto-save for new game)

**Configuration System**
- **config.template.js**: Comprehensive configuration template with docs
  - API settings (key, endpoint, model, temperature, max tokens)
  - Feature toggles (Sierra parser, priority renderer, state animator)
  - Audio settings (master, music, sfx, ambient volumes)
  - Offline mode examples and local LLM configurations
  - Budget mode recommendations

- **config.js**: Working default configuration
  - Offline mode enabled by default (works out of the box)
  - No API key required for static test world gameplay
  - Sensible volume defaults (70% master, 60% music, 80% sfx, 50% ambient)
  - All Sierra enhancements enabled

---

### 🔧 Technical Improvements

**Code Quality**
- Fixed logger import case sensitivity across 6 new modules
  - Changed from `import { logger } from './Logger.js'`
  - To `import logger from './logger.js'`
  - Affected: PrioritySoundManager, SynchronizedSound, AmbientSoundscape, WorldGenerator, DynamicInteractionHandler, SaveGameManager
- Applied Prettier formatting to all new files
- Zero ESLint errors or warnings
- Consistent code style across 400+ files

**Testing**
- All 444 tests passing (100% pass rate)
- No test failures or skipped tests
- Maintained test coverage above 60%
- Mock implementations updated for new systems

**Integration**
- GameManager enhanced with all Phase 4 & 5 systems:
  ```javascript
  this.worldGenerator = new WorldGenerator(this.aiManager);
  this.prioritySoundManager = new PrioritySoundManager(this.soundManager);
  this.synchronizedSound = new SynchronizedSound(this.prioritySoundManager, this);
  this.ambientSoundscape = new AmbientSoundscape(this.prioritySoundManager);
  this.dynamicInteractionHandler = new DynamicInteractionHandler(
    this.aiManager, this.gameState, this.commandExecutor
  );
  this.saveGameManager = new SaveGameManager(this);
  ```
- main.js completely rewritten (497 lines) with full UI wiring
- index.html enhanced with 3 new modals (save, load, volume)
- styles.css enhanced with 150+ lines of new styling

---

## Complete Feature List

### Phase 1 - Core Architecture ✅
- GameManager with fixed timestep (60 FPS) and interpolation
- AIManager with LLM interface and mock mode
- GameState with event-driven architecture and validation
- SceneRenderer for vector graphics
- ViewManager for sprite animation
- SoundManager for audio synthesis
- Parser for natural language processing
- EventManager for event execution and scheduling
- FPS monitoring and debug overlay

### Phase 2 - Graphics and Sound ✅

**Vector Graphics Engine**
- 16-color EGA palette with strict adherence
- Vector primitives: rectangles, polygons, ellipses, lines, bezier curves, paths
- 9 dithering patterns for fills and gradients
- Scanline polygon fill with priority buffer
- Double buffering and scene composition
- 320×200 native resolution (scaled to 640×400)

**Sprite and Animation System**
- VIEW resource structure (Sierra SCI compatible)
- Smooth animation with interpolation and speed control
- Character movement with 8-directional walking
- Collision detection with bounding boxes
- Sprite effects: mirroring, scaling, ghost, inverted
- Z-order management based on Y position and priority
- Sprite pooling (50 sprite pool) for performance

**Sound Synthesis System**
- Complete Tone.js integration (v15.1.22)
- ADSR envelopes with configurable curves
- Waveforms: sine, square, triangle, sawtooth, PWM
- LFO support for vibrato, tremolo, filter modulation
- Filters: lowpass, highpass, bandpass, notch with resonance
- Effects: reverb, delay, chorus, distortion, phaser
- 16 simultaneous sound channels with auto-cleanup
- Retro synthesizer presets: PC Speaker, AdLib FM, MT-32
- 30+ procedural sound effects
- Spatial audio with left/right panning

**Music Generation System**
- 128-voice polyphony for rich compositions
- Complete General MIDI instrument set (128 instruments)
- Procedural composition with music theory foundation
- 8 musical themes: heroic, mysterious, peaceful, danger, exploration, combat, village, castle
- Multi-track sequencer (melody, harmony, bass, drums)
- Adaptive music with intensity control (0.0-1.0)
- Leitmotif system for characters and locations
- Real-time music visualization in demos

### Phase 3 - Parser and Game Logic ✅

**Natural Language Parser**
- Tokenization with punctuation handling
- 100+ verb synonyms (look/examine, get/take, etc.)
- Abbreviations: x→examine, i→inventory, l→look, n/s/e/w→directions
- Multi-word verb preprocessing ("pick up", "look at")
- Pronoun resolution (it, them, him, her)
- Word class detection (verbs, nouns, adjectives, prepositions)

**Command Execution Engine**
- 30+ adventure game verbs fully implemented:
  - Movement: go, north, south, east, west, enter, exit
  - Observation: look, examine, read, search
  - Manipulation: take, get, drop, put, give, show, use, open, close
  - Interaction: talk, ask, buy, sell, trade, push, pull, turn, touch, move
  - Personal: inventory, wear, remove, eat, drink
  - Combat: attack, cast (spell), pray
  - Meta: help, save, load, restart, quit, wait
- Contextual response system with dynamic messaging
- Multi-word alias expansion (n→"go north")
- Item requirement checking for actions
- Multi-stage interaction mechanics (pull counts, progressive effects)
- Touch effects system: damage, temperature, electric, sticky
- Container state validation (open/closed)
- Health restoration from consumables
- Event triggering from commands (yell, ring bell)

**Game Mechanics**

*Inventory System*:
- Weight and size constraints (configurable limits)
- Container support with nested items (bags, chests, etc.)
- Worn items system with equipment slots (head, body, hands, feet, accessory)
- Comprehensive inventory management (add, remove, transfer, find, wear, remove)

*Interaction System*:
- Object interaction matrix for "use X on Y" mechanics
- Item combination system (combine lockpick + door → unlocked door)
- Locked/unlocked object states
- State change triggers and callbacks

*Movement System*:
- Enhanced room navigation with exit validation
- NPC movement patterns and schedules
- Movement animations with smooth transitions
- Blocked exit handling with contextual messages

*Puzzle System*:
- Multi-step puzzle support with individual step tracking
- Hint system with 30-second cooldowns
- Puzzle rewards (items, score points) and consequences
- Reset mechanisms for retryable puzzles
- Statistics tracking (attempts, hints used, completions, time)

*NPC System*:
- Dialogue tree system with branching conversations
- Relationship tracking (-100 to 100 scale)
- NPC trading with value balance and item requirements
- NPC movement and schedules (time-based locations)
- Dialogue history and state persistence
- Multiple conversation topics per NPC

*Game Progression*:
- Point-based scoring system
- Achievement system with condition checking
- Multiple ending support based on game state
- Statistics tracking for player progress
- Auto-save functionality (5-minute intervals)

### Phase 4 - AI Integration ✅
(See Major Features section above)

### Phase 5 - Polish and Sierra Enhancements ✅
(See Major Features section above)

---

## 🎮 Gameplay Features

### Command System
- 30+ adventure game verbs with natural language parsing
- Directional shortcuts: n, s, e, w, ne, nw, se, sw
- Common abbreviations: x (examine), i (inventory), l (look)
- Multi-word commands: "pick up key", "look at painting"
- Synonym support: get/take, look/examine, etc.
- Pronoun resolution: "examine it", "take them"

### World Interaction
- Interactive objects with multiple states
- Combinable items (use X on Y)
- Locked containers and doors requiring keys
- Hidden items revealed by searching
- Environmental puzzles with multi-step solutions
- NPC dialogue and trading systems

### Progression System
- Point-based scoring
- Achievement tracking
- Multiple endings based on player choices
- Puzzle hints with cooldowns
- Relationship tracking with NPCs
- Statistics and progress monitoring

---

## 🎨 Technical Specifications

### Graphics
- **Resolution**: 320×200 native (scaled to 640×400)
- **Color Palette**: 16-color EGA (strict adherence)
- **Rendering**: Vector primitives only (no raster images)
- **Dithering**: 9 patterns for gradients and fills
- **Priority System**: Depth-based rendering with Y-gradient

### Audio
- **Engine**: Tone.js v15.1.22
- **Synthesis**: Procedural generation (no audio files)
- **Polyphony**: 128 voices music, 16 channels SFX
- **Presets**: PC Speaker, AdLib FM, MT-32 emulation
- **Effects**: Reverb, delay, distortion, chorus, phaser, LFO

### AI Integration
- **API**: OpenAI-compatible endpoints (OpenAI, Anthropic, Ollama, LM Studio)
- **Models**: GPT-3.5-turbo, GPT-4, Claude, local LLMs
- **Fallback**: Offline mode with 3 static test worlds
- **Retry Logic**: Exponential backoff (1s, 2s, 4s)
- **Validation**: 8-step comprehensive JSON validation

### Save System
- **Format**: Complete game state + original AI-generated JSON
- **Storage**: Browser localStorage (5-10MB per save)
- **Slots**: 10 manual + 1 auto-save
- **Export**: JSON file download
- **Import**: JSON file upload
- **Auto-save**: 5-minute intervals (configurable)

---

## 🧪 Testing

### Test Coverage
- **Total Tests**: 444 (100% pass rate)
- **Test Suites**: 20
- **Overall Coverage**: 61.64%
- **High Coverage Modules**:
  - Parser: 87.37%
  - NPCSystem: 81.19%
  - InteractionSystem: 79.87%
  - PuzzleSystem: 71.42%

### CI/CD
- **Framework**: Jest v30.0.0
- **Environment**: jsdom for DOM testing
- **Node Versions**: 18.x, 20.x
- **GitHub Actions**: Lint, Test, Security Audit, Browser Compatibility

---

## 📦 Demo Content

### Interactive Demos
All demos located in `demos/` subdirectory:
- **demo-graphics.html**: Vector primitives, dithering, EGA palette showcase
- **sprite-demo.html**: Character movement with keyboard controls
- **sound-demo.html**: Sound effect library and synthesis parameters
- **music-demo.html**: Real-time music generation and instrument testing
- **parser-demo.html**: Natural language parser with demo world
- **game-world-demo.html**: Puzzle and NPC systems demonstration
- **demo-adventure.html**: Complete playable adventure "The Enchanted Manor"

### Test Worlds
Static worlds for offline play:
- **Small World** (3-5 rooms): "Test Manor" haunted mansion
- **Medium World** (6-10 rooms): Multi-level adventure with NPCs
- **Large World** (15+ rooms): Expansive world with complex puzzles

---

## 🔧 Configuration

### Quick Start
1. Copy `js/config.template.js` to `js/config.js`
2. (Optional) Add OpenAI API key for AI-generated worlds
3. Adjust volumes and feature toggles as desired
4. Open `index.html` in browser or run `npm start`

### Configuration Options
```javascript
export const API_CONFIG = {
  // API Settings (leave default for offline mode)
  apiKey: 'your-api-key-here',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 4000,

  // Save System
  autoSave: true,
  autoSaveInterval: 300000, // 5 minutes

  // Sierra Enhancements
  useSierraParser: true,
  usePriorityRenderer: true,
  useStateAnimator: true,

  // Audio Volumes (0.0-1.0)
  masterVolume: 0.7,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  ambientVolume: 0.5,
};
```

---

## 🐛 Bug Fixes

### Logger Import Case Sensitivity (Phase 4/5)
- **Issue**: 6 new modules failed tests due to incorrect logger import path
- **Files**: PrioritySoundManager.js, SynchronizedSound.js, AmbientSoundscape.js, WorldGenerator.js, DynamicInteractionHandler.js, SaveGameManager.js
- **Fix**: Changed `import { logger } from './Logger.js'` to `import logger from './logger.js'`
- **Result**: All 444 tests passing

### Earlier Bug Fixes (Phase 3)
- Fixed command parameter order in handleAsk (NPC in directObject, topic in indirectObject)
- Fixed type check case sensitivity ('NPC' vs 'npc')
- Fixed health updates to properly modify gameState
- Fixed multi-word alias parsing and command modification
- Fixed object revealing in search (not just items)
- Fixed article generation ("a" vs "an") for found items
- Fixed container state checking for put/take commands
- Fixed 78 test failures in CommandExecutor and EventManager

---

## 📚 Documentation

### Comprehensive Guides
- **README.md**: Project overview and features
- **SETUP.md**: 5-minute quick start guide
- **CLAUDE.md**: Development guide for AI assistants
- **docs/**: Technical documentation (30+ files)
- **ref_docs/**: Design philosophy and specifications
- **to-dos/**: Development phase tracking

### API Documentation
- Module interfaces documented via JSDoc
- Comprehensive inline comments
- Test files serve as usage examples
- Demo pages showcase all features

---

## 🚀 Deployment

### Local Development
```bash
npm install
npm start  # http-server on port 8080
npm run dev  # http-server on port 8000
```

### Testing
```bash
npm test  # Run all tests
npm run test:watch  # Watch mode
npm run test:coverage  # Coverage report
```

### Code Quality
```bash
npm run lint  # ESLint
npm run lint:fix  # Auto-fix
npm run format  # Prettier
npm run format:check  # Check formatting
npm run validate  # All checks
```

### Production
- No build step required (vanilla ES6 modules)
- Serve static files via any HTTP server
- Works completely offline with static test worlds
- Compatible with all modern browsers

---

## 🎯 What's Next?

While v1.0.0 is feature-complete and production-ready, potential future enhancements include:

### Planned for Future Releases
- **Mobile/Responsive Support**: Touch-friendly UI, responsive CSS
- **Accessibility Enhancements**: ARIA labels, keyboard navigation, high contrast mode
- **Performance Optimizations**: Rendering loop improvements, lazy audio loading
- **Additional Content**: Detective mystery, space station thriller, fantasy quest worlds
- **Achievement UI**: Notification popups, achievement gallery
- **GitHub Pages Deployment**: Live demo hosting
- **Community Features**: World sharing, custom world editor

### Under Consideration
- Multiplayer support
- Cloud save synchronization
- Steam/itch.io distribution
- Speedrun mode
- Colorblind modes
- VR/AR experimental support

---

## 📄 License

See LICENSE file for details.

---

## 🙏 Acknowledgments

**Inspired by Sierra On-Line's legendary SCI0 engine and games**:
- King's Quest IV (1988)
- Space Quest III (1989)
- Quest for Glory I (1989)
- Police Quest II (1988)
- Leisure Suit Larry 2 (1988)
- Codename: ICEMAN (1989)

**Built with modern web technologies**:
- Tone.js v15.1.22 for audio synthesis
- Jest v30.0.0 for testing
- ESLint v9 + Prettier for code quality
- GitHub Actions for CI/CD

**Special thanks**:
- Retro gaming community for preservation efforts
- SCI decompilation projects for technical insights
- Sierra On-Line for creating timeless classics

---

## 📞 Support

For issues, questions, or contributions:
- **GitHub**: https://github.com/doublegate/Somnium
- **Issues**: Report bugs and request features
- **Discussions**: Share worlds and experiences

---

**Note**: This is a passion project celebrating the golden age of adventure gaming while showcasing the potential of AI-driven procedural generation. Every playthrough is unique! 🎮✨

---

## Previous Versions

### [Unreleased] - Development History

*(See above for complete v1.0.0 release notes)*

### [0.0.1] - 2025-01-13

**Initial Release**
- Repository creation
- Design documentation
- Technical specifications
- SCI0-inspired architecture design
- AI prompt engineering guidelines

---

[1.0.0]: https://github.com/doublegate/Somnium/releases/tag/v1.0.0
[0.0.1]: https://github.com/doublegate/Somnium/releases/tag/v0.0.1
