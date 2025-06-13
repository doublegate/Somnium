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

### Planned

- Phase 2.3: Sound Synthesis System
- Phase 2.4: Music Generation
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
