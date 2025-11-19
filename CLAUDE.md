# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Somnium is an AI-driven graphical text-adventure game inspired by Sierra On-Line's SCI0-era games (1988-1989). It generates unique adventures at runtime using LLMs while maintaining strict adherence to retro aesthetics and technical constraints.

## Architecture

The engine follows Sierra's SCI philosophy of complete separation between engine and content:

- **Engine**: JavaScript modules that interpret game data (analogous to SCI interpreter)
- **Content**: AI-generated JSON packages containing all game resources (analogous to compiled SCI resources)

### Core Modules (Phases 1-5 Complete ✅)

**Phase 1 - Core Architecture:**

- **GameManager.js**: Main game loop with fixed timestep, FPS monitoring, pause/resume, integrated AI systems
- **AIManager.js**: Full LLM integration with OpenAI-compatible API, rate limiting, caching, retry logic
- **GameState.js**: Event-driven state management with validation, history, and undo
- **EventManager.js**: Event system with scripted/dynamic responses and scheduling

**Phase 2 - Graphics and Sound:**

- **SceneRenderer.js**: Complete vector rendering with EGA palette, 9 dithering patterns, priority buffer
- **ViewManager.js**: Full sprite animation with VIEW resources, smooth interpolation, effects
- **SoundManager.js**: Tone.js integration with ADSR envelopes, filters, effects, 16 channels

**Phase 3 - Parser and Game Logic:**

- **Parser.js**: Natural language parser with tokenization, synonyms, abbreviations, pronouns
- **EnhancedParser.js**: Sierra-style Said pattern matching with word classes and alternatives
- **CommandExecutor.js**: Handles 30+ adventure game verbs with contextual responses
- **Inventory.js**: Enhanced inventory with weight/size limits, containers, worn items
- **InteractionSystem.js**: Object interaction matrix for "use X on Y" mechanics
- **MovementSystem.js**: Advanced movement with pathfinding and animations
- **PuzzleSystem.js**: Multi-step puzzles with state tracking and hint system
- **NPCSystem.js**: Dialogue trees, trading, and relationship tracking
- **GameProgression.js**: Scoring, achievements, and multiple endings

**Phase 4 - AI Integration:**

- **WorldGenerator.js**: AI and static world generation with enhancement utilities
- **DynamicInteractionHandler.js**: Unscripted action handling with AI-powered responses
- **AIManager (Enhanced)**: Comprehensive prompt templates, world validation, error recovery

**Phase 5 - Polish and Save System:**

- **SaveGameManager.js**: Multi-slot save system with localStorage, file import/export, auto-save
- **Sierra-Inspired Enhancements:**
  - **PrioritySoundManager.js**: Priority-based audio channel management (speech > UI > ambient)
  - **SynchronizedSound.js**: Cue-based audio synchronization for cutscenes
  - **AmbientSoundscape.js**: Layered environmental audio with conditional sounds
  - **PriorityRenderer.js**: Priority-based rendering with depth testing
  - **SaidPattern.js**: Sierra Said() pattern matching system
  - **StateAnimator.js**: State machine for complex character animations

### v2.1 Content Creation & Enhancement Modules

**Visual Content Creation Tools:**

- **World Editor** (`editors/world-editor.html`): Professional drag-and-drop world designer (~1000 lines)
  - Interactive canvas with zoom (25%-200%) and pan controls
  - Drag-and-drop room positioning with auto-layout algorithm
  - Real-time validation for room connections and item placement
  - Export to game-ready JSON format
  - Visual connection management with exit editing

- **Puzzle Builder** (`editors/puzzle-builder.html`): Flowchart-style puzzle designer (~800 lines)
  - 6 node types: item, action, sequence, condition, combine, trigger
  - Visual dependency graph with auto-arranged hierarchical layout
  - Testing mode for step-by-step puzzle simulation
  - Solution path validation and auto-calculation
  - Export puzzles directly to game format

- **Dialogue Tree Editor** (`editors/dialogue-editor.html`): NPC conversation designer (~1000 lines)
  - 6 node types: greeting, question, response, branch, trade, end
  - Branching dialogue with conditions and state tracking
  - Emotion system (neutral, happy, sad, angry, surprised, fearful)
  - Live preview and interactive playthrough mode
  - Export dialogue trees to game-ready JSON

**Backend Enhancement Modules:**

- **AssetLibrary.js**: Comprehensive asset management system (~700 lines)
  - Multi-category organization (graphics, audio, dialogue, worlds, puzzles)
  - Advanced keyword search with real-time filtering
  - Tag-based categorization with auto-tagging
  - Usage tracking and analytics (creation date, last used, usage count)
  - Bulk operations (export, delete, tag)
  - Integration with all visual editors

- **EnhancedWorldGenerator.js**: Multi-phase AI world generation (~500 lines)
  - 5-phase pipeline: Structure → Rooms → NPCs → Items → Puzzles
  - Retry logic (up to 3 attempts per phase)
  - Auto-fix common issues (missing IDs, broken references)
  - Enhanced room generation with rich descriptions
  - NPC personality and dialogue integration
  - Puzzle difficulty balancing

- **WorldValidator.js**: Comprehensive world validation (~550 lines)
  - Graph algorithms for connectivity checking (DFS, cycle detection)
  - 6 validation categories: structure, rooms, NPCs, items, puzzles, events
  - Error severity levels (error, warning, info)
  - Reachability analysis for all rooms and items
  - Puzzle solvability verification
  - NPC dialogue tree completeness checking

- **ExpandedAchievements.js**: 50+ achievements system (~650 lines)
  - 8 categories: Exploration, Combat, Social, Collection, Puzzle, Speed, Secret, Meta
  - 4 rarity tiers with XP rewards (Common, Rare, Epic, Legendary)
  - Incremental progress tracking
  - Event-driven automatic checking
  - Achievement notifications and statistics

- **FriendSystem.js**: Real-time friend management and messaging (~650 lines)
  - Add/remove friends with username search
  - Online status tracking (online, offline, away, busy)
  - Real-time messaging with WebSocket delivery
  - Typing indicators and read receipts
  - Message history with timestamps
  - Friend list with status indicators
  - Block/unblock functionality

## Development Commands

```bash
# Local development server (required due to CORS for modules)
npm start  # runs http-server on port 8080
npm run dev  # runs http-server on port 8000

# Install dependencies
npm install  # or npm ci for clean install

# Testing
npm test  # run Jest tests
npm run test:watch  # run tests in watch mode
npm run test:coverage  # generate coverage report

# Code Quality
npm run lint  # run ESLint
npm run lint:fix  # auto-fix ESLint issues
npm run format  # format with Prettier
npm run format:check  # check formatting
npm run validate  # run all checks
```

## Key Technical Constraints

1. **Graphics**: Strict 320×200 resolution, 16-color EGA palette only
2. **Drawing**: Vector primitives only (no raster images) - rectangles, polygons, dithered gradients
3. **Sound**: Procedural generation via Tone.js descriptors, no audio files
4. **Save Format**: Complete game state + original AI-generated JSON in single file
5. **Parser**: Must handle Sierra-style abbreviations and synonyms

## AI Integration Guidelines

### World Generation

- Single master JSON request at game start containing all resources
- Validate all object/item/room ID references for consistency
- Ensure every puzzle has obtainable solution items

### Dynamic Interactions

- Scripted events take precedence over LLM responses
- Context includes: current room, visible objects, recent events, inventory
- LLM fallback for unscripted actions must not break game logic

## Testing Focus Areas

1. **Parser Coverage**: Test verb synonyms, abbreviations, pronouns
2. **State Consistency**: Save/load preservation, puzzle state tracking
3. **Graphics Rendering**: Primitive layering, z-order, EGA color accuracy
4. **AI Responses**: Validate JSON structure, handle malformed responses
5. **Cross-browser**: Canvas rendering, Web Audio API compatibility

## Implementation Notes

- Start with static test JSON before integrating LLM
- Use feature flags for gradual AI integration
- Implement proper API key management (never commit keys)
- Focus on authentic SCI0 experience over modern conveniences
- Text window pauses game action (critical SCI0 behavior)
- Game loop uses fixed timestep (60 FPS) with interpolation
- State management uses EventTarget for loose coupling
- All modules have mock modes for testing without dependencies
- Debug mode shows FPS counter and additional logging
- Validation runs on all game data loading with detailed errors

### Recent Enhancements (All Phases Complete! ✅)

**Phase 3 Enhancements:**

- **Command Execution**: All 30+ verbs fully implemented with contextual responses
- **Multi-word Aliases**: Directional shortcuts expand properly (n→go north)
- **Item Requirements**: Push/search commands check for required items
- **Multi-stage Mechanics**: Pull commands track interaction count for progressive effects
- **Touch Effects**: Objects can have damage, temperature, electric, or sticky effects
- **Container State**: Put/take operations validate container open/closed state
- **Health System**: Consumable items restore player health when eaten/drunk
- **Event Integration**: Commands like yell and ring trigger room-specific events
- **NPC Integration**: Ask command properly routes to NPCSystem dialogue trees

**Phase 4 - AI Integration (Complete ✅):**

- **Real LLM Integration**: OpenAI-compatible API with exponential backoff retry logic
- **World Generation**: Comprehensive prompt templates with full validation
- **Dynamic Interactions**: AI-powered responses for unscripted actions
- **World Validation**: Complete validation of rooms, items, objects, NPCs, and puzzles
- **Offline Mode**: Automatic fallback to mock data when API unavailable

**Phase 5 - Save System & Sierra Enhancements (Complete ✅):**

- **Save/Load System**: Multi-slot saves, auto-save, file import/export
- **Priority Sound Manager**: Audio channel management with priority levels
- **Synchronized Sound**: Cue-based audio for cutscenes and animations
- **Ambient Soundscapes**: Layered environmental audio (7 predefined scapes)
- **Priority Rendering**: Depth-based rendering system like Sierra games
- **Enhanced Parser**: Sierra Said() pattern matching with word classes

## CI/CD Configuration

The project uses GitHub Actions for continuous integration:

- **Node.js versions**: 18.x and 20.x (Jest 30 requires Node.js 18+)
- **Jobs**: Lint, Test (with coverage), Security Audit, Browser Compatibility
- **ESLint**: v9 with flat config format (eslint.config.js)
- **Coverage**: Reports uploaded to Codecov for the 18.x test run
- **All checks must pass** before merging pull requests

## Current Status

✅ **v2.1.0 RELEASED!** All 5 development phases complete + Content Creation Suite!

- **Phase 1 (Core Architecture)**: ✅ Complete - All core modules implemented
- **Phase 2 (Graphics and Sound)**: ✅ Complete - Full rendering and audio systems
- **Phase 3 (Parser and Game Logic)**: ✅ Complete - Natural language parser and game mechanics
- **Phase 4 (AI Integration)**: ✅ Complete - Full LLM integration with world generation
- **Phase 5 (Polish and Testing)**: ✅ Complete - Save system and Sierra enhancements
- **v2.1 (Content Creation Suite)**: ✅ Complete - Visual editors, asset library, enhanced AI, social features

### v2.1.0 Features

- **3 Visual Editors**: World Editor, Puzzle Builder, Dialogue Tree Editor (~2800 lines total)
- **4 Backend Modules**: AssetLibrary, EnhancedWorldGenerator, WorldValidator, ExpandedAchievements (~2500 lines)
- **Social Features**: FriendSystem with real-time messaging (~650 lines)
- **Production Assets**: 12 PNG icons generated using Sharp library
- **11,000+ lines of new code** with full backward compatibility

### Test Coverage

- **Tests**: 444 tests passing ✅ (100% pass rate!)
- **Test Suites**: 20 suites, all passing
- **Coverage**: 61.64% overall
  - Parser: 87.37%
  - NPCSystem: 81.19%
  - InteractionSystem: 79.87%
  - PuzzleSystem: 71.42%
  - CommandExecutor: Enhanced with all 30+ verb implementations
  - EventManager: Full event handling and scheduling support

## Demo Pages

All demos are now in the `demos/` subdirectory:

- `demos/demo-graphics.html` - Showcases vector primitives, dithering, and EGA palette
- `demos/sprite-demo.html` - Interactive character movement with keyboard controls
- `demos/sound-demo.html` - Sound effect library and synthesis parameters
- `demos/music-demo.html` - Real-time music generation and instrument testing
- `demos/parser-demo.html` - Natural language parser with demo world
- `demos/game-world-demo.html` - Interactive demo of puzzle and NPC systems
- `demos/demo-adventure.html` - Complete playable adventure "The Enchanted Manor"

See [Running Demos](docs/run-demos.md) for detailed instructions.

## Reference Documentation

Comprehensive design documents are in `/ref_docs/`:

- Game design philosophy and mechanics
- Technical specifications for each subsystem
- AI prompt engineering guidelines
- Save/load file format specification
- Graphics generation techniques
- Testing and QA procedures
