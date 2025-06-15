# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - December 15, 2024

- **Enhanced Command Implementation**

  - Multi-stage pull mechanics with state tracking
  - Object search with item requirements (requiresItem property)
  - Touch effects system (damage, sticky, electric, temperature)
  - Multi-word command aliases (directional shortcuts like "n" → "go north")
  - Improved NPC interaction with proper parameter handling
  - Container state checking for put command
  - Enhanced error messages with object names

- **Test Coverage Improvements**

  - Added 83 new test cases across command handlers
  - Fixed all 37 failing tests - now 444/444 passing
  - Significantly improved code coverage (restored patch coverage)
  - Added comprehensive tests for new command features

- **Code Quality**
  - Fixed all ESLint warnings (0 errors)
  - Applied Prettier formatting to entire codebase
  - Consistent code style across all modules

### Fixed - December 15, 2024

- Command parameter order in handleAsk (NPC in directObject, topic in indirectObject)
- Type check case sensitivity ('NPC' vs 'npc')
- Health updates now properly applied to gameState
- Multi-word alias parsing and command modification
- Object revealing in search (not just items)
- Proper article generation ("a" vs "an") for found items

### Added - Earlier Sessions

- Initial project structure and documentation
- Comprehensive design documents in `ref_docs/`
- Generated implementation guides in `docs/`
- Basic repository setup files (README, LICENSE, etc.)
- Project tracking structure in `to-dos/`
- **Phase 1: Core Architecture Implementation (Complete)**
  - GameManager with fixed timestep game loop (60 FPS)
  - AIManager with mock mode for testing
  - GameState with event-driven architecture and validation
  - Basic module stubs for all 8 core modules
  - FPS monitoring and debug overlay
  - Comprehensive test suites
- **Phase 2.1: Vector Graphics Engine (Complete)**
  - Comprehensive EGA palette system with color validation
  - Support for color names and indices
  - Extended primitive types: ellipse, line, triangle, paths
  - Enhanced star rendering (pixels and shapes)
  - 9 different dithering patterns
  - Proper scanline polygon fill for priority buffer
  - Double buffering and scene caching
  - Debug visualization modes
  - Demo page showcasing all features
- **Phase 2.2: Sprite and Animation System (Complete)**
  - VIEW resource structure with loops and cells
  - Animation playback with timing control and speed multiplier
  - Character movement with smooth interpolation
  - Bounding box collision detection system
  - Sprite pooling for performance (50 sprite pool)
  - Batch rendering with off-screen canvas
  - Z-order management based on Y position and priority
  - Sprite effects: mirroring, scaling, ghost, inverted
  - Comprehensive test suite with 100% coverage
  - Interactive demo page with keyboard controls

### Changed

- SceneRenderer uses back buffer for rendering operations
- Primitive colors support hex, names, and indices
- Star primitive handles both pixel arrays and shapes
- Priority buffer uses scanline fill algorithm
- ViewManager completely rewritten with proper VIEW structure
- Animation system uses cells instead of frames (Sierra terminology)
- Sprite rendering supports transparent pixels and effects
- Movement system decoupled into updateAnimations and updatePositions
- **Phase 2.3: Sound Synthesis System (Complete)**
  - Complete Tone.js integration with Transport synchronization
  - Full ADSR envelope support with configurable curves
  - Waveform generation: sine, square, triangle, sawtooth, PWM
  - LFO support for vibrato, tremolo, and filter modulation
  - Filter types: lowpass, highpass, bandpass, notch
  - Built-in effects: reverb, delay, chorus, distortion
  - 16 simultaneous sound channels with automatic cleanup
  - Voice queueing system with overflow handling
  - Frame-accurate scheduling with Transport
  - Comprehensive test suite with over 15 test cases
  - Interactive demo page with sound effect library
- **Phase 2.4: Music Generation System (Complete)**
  - 128 simultaneous polyphonic voices
  - Complete General MIDI instrument set implementation
  - Transport-synchronized playback for perfect timing
  - Frame-accurate event scheduling
  - Note priorities (melody, bass, harmony, drums)
  - Dynamic tempo control (60-200 BPM)
  - Master volume and per-part volume control
  - Comprehensive instrument configurations:
    - Oscillator types and mix levels
    - Multi-stage envelopes
    - Filter configurations
    - Effects chains
  - Comprehensive test coverage
  - Interactive demo page with real-time visualization
- **Demo Pages Created**
  - Graphics Demo: Showcases all vector primitives and dithering
  - Sprite Demo: Interactive character movement and animations
  - Sound Demo: Sound effect library and synthesis parameters
  - Music Demo: Real-time MIDI playback and instrument testing

### Fixed

- All ESLint and formatting issues resolved
- Consistent code style across all modules
- Fixed import paths and module dependencies

### Added - June 13, 2025

- **Phase 3: Parser and Game Logic (Complete)**
  - **Phase 3.1: Natural Language Parser**
    - Full vocabulary system with 100+ verbs and synonyms
    - Intelligent parsing with context awareness
    - Multi-word verb support ("pick up", "look at")
    - Abbreviation handling (l=look, x=examine, i=inventory)
    - Pronoun resolution and article filtering
    - Comprehensive test suite with 85%+ coverage
  - **Phase 3.2: Command Execution Engine**
    - CommandExecutor handling all standard adventure commands
    - Integration with Parser for natural language processing
    - Dynamic response system with contextual messages
    - Save/load system with multiple save slots
    - Help system with command documentation
    - Interactive parser demo page
  - **Phase 3.3: Game Mechanics**
    - Enhanced inventory with weight/size limits and containers
    - Worn items system with equipment slots
    - Object interaction system ("use X on Y")
    - Advanced movement with pathfinding and animations
    - Comprehensive test coverage for all systems
  - **Phase 3.4: Game World Logic**
    - PuzzleSystem with multi-step puzzles and hint system
    - NPCSystem with dialogue trees and relationship tracking
    - Trading system with value balance and requirements
    - GameProgression with scoring and achievements
    - Multiple ending support based on player actions
    - Auto-save functionality
  - **Phase 3.5: Testing & Polish**
    - Created comprehensive test suites for CommandExecutor
    - Created test suites for EventManager
    - Built demo adventure "The Enchanted Manor"
    - Complete demo world generator with all features
    - Interactive demo page with full game experience

### Fixed - June 13, 2025

- Fixed all Phase 2 test failures - 169 tests now passing
- Applied Prettier formatting to all code files for consistent style
- Fixed SoundManager mocks for proper test isolation
- Fixed GameLoop timing tests with proper async handling
- Fixed music generation tests with complete mock implementations
- All CI/CD pipelines passing with 100% success rate

### Completed - June 13, 2025

- **Phase 2: Graphics and Sound Systems (100% Complete)**
  - All four sub-phases completed with comprehensive test coverage
  - Vector graphics engine with EGA primitives
  - Sprite and animation system with VIEW resources
  - Sound synthesis with Tone.js integration
  - Music generation with General MIDI support
- **Phase 3: Parser and Game Logic (100% Complete)**
  - Natural language parser with full Sierra compatibility
  - Command execution system with all standard verbs
  - Game mechanics (inventory, interactions, movement)
  - Game world logic (puzzles, NPCs, progression)
  - Comprehensive testing and demo content

### Added - December 14, 2024

- **Project Reorganization**
  - Created `demos/` subdirectory for all demo files
  - Created `tests/` directory and consolidated all test files
  - Updated all import paths in moved files
  - Created comprehensive README documentation for both directories
- **Documentation Updates**
  - Created `docs/deferred-impl.md` tracking 50+ TODOs and future work
  - Created `to-dos/phase-4-todo.md` with detailed AI integration plan
  - Updated all documentation to reflect Phase 3 completion
- **Test Fixes**
  - Fixed 78 test failures in CommandExecutor and EventManager
  - Updated mock objects to match implementation exactly
  - Fixed property names (canTake → takeable)
  - Fixed command structure (modifiers array placement)
  - Result: 362 tests passing with 100% pass rate!

### Added - December 15, 2024

- **Phase 3 Enhancements**
  - Implemented remaining command handlers:
    - `push` - Move heavy objects with state tracking and effects
    - `pull` - Pull levers/objects with multi-stage effects
    - `turn` - Turn dials/knobs with state cycling
    - `touch` - Feel texture/temperature with sensory feedback
  - Enhanced `handleAsk()` with full NPCSystem integration
  - Added container state checking in `handlePut()`
  - Integrated GameManager with all game systems
- **Test Infrastructure Updates**
  - Updated gameLoop tests with proper system mocks
  - Fixed CommandExecutor test mocks for new APIs
  - Added missing mock methods (playSoundEffect, updateRelationship)
  - Result: All 363 tests passing!
- **Code Quality**
  - Fixed ESLint unused variable error in EventManager
  - Applied Prettier formatting to all modified files
  - Maintained consistent code style throughout
  - Created `tests/` directory and moved all test files there
  - Added comprehensive README.md for both directories
  - Added `docs/run-demos.md` guide for running demos
  - Created `docs/deferred-impl.md` tracking remaining work

### Fixed - December 14, 2024

- **All Test Failures Resolved (362 tests passing)**
  - Fixed all 50 CommandExecutor test failures
  - Fixed all 7 EventManager test failures
  - Updated mock objects to match implementation
  - Fixed property name mismatches (takeable vs canTake)
  - Fixed method signatures and return values
  - Removed duplicate method implementations
  - All tests now passing with 100% success rate

### Changed - December 14, 2024

- Updated all demo import paths for new directory structure
- Updated CommandExecutor with complete implementations for:
  - handleInventory, handleHelp, handleSave
  - Alias resolution for command shortcuts
  - Proper error handling and user feedback
- Updated EventManager to use processCommand instead of getDynamicResponse
- Updated project documentation with current status

### Planned

- Phase 4: AI Integration (Starting Soon)
- Phase 5: Polish and Release

## [0.0.1] - 2025-01-13

### Added

- Initial repository creation
- Design documentation outlining game vision
- Technical specifications for all systems
- SCI0-inspired architecture design
- AI prompt engineering guidelines

### Documentation

- Game Design Document with complete specifications
- Graphics Generation Guide with EGA constraints
- LLM Interaction Protocols
- Save/Load File Format Specification
- Testing and QA procedures
- Development setup instructions
- Engine extensibility guide
- Content moderation guidelines

[Unreleased]: https://github.com/doublegate/Somnium/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/doublegate/Somnium/releases/tag/v0.0.1
