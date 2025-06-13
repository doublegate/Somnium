# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

### Planned

- Phase 3: Parser and Game Logic
- Phase 4: AI Integration
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
