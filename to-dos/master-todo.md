# Somnium Master TODO

## Overview
This master TODO tracks all development phases for the Somnium AI-driven adventure game engine.

## Phase Status Overview
- [ ] **Phase 1**: Core Architecture Implementation (In Progress)
- [ ] **Phase 2**: Graphics and Sound Systems
- [ ] **Phase 3**: Parser and Game Logic
- [ ] **Phase 4**: AI Integration
- [ ] **Phase 5**: Polish and Testing

## Phase 1: Core Architecture Implementation
**Status**: In Progress (Phase 1.1 Complete, Starting Phase 1.2)

### Phase 1.1: Project Setup ✅ COMPLETE
- [x] Create basic HTML structure
- [x] Set up CSS with EGA palette
- [x] Initialize JavaScript module structure
- [x] Configure development environment
- [x] Set up testing framework
- [x] Create documentation structure

### Phase 1.2: Core Module Stubs
- [ ] Create GameManager.js with basic structure
- [ ] Create GameState.js with state management interface
- [ ] Create SceneRenderer.js with canvas initialization
- [ ] Create ViewManager.js with sprite system foundation
- [ ] Create SoundManager.js with Tone.js integration
- [ ] Create Parser.js with command structure
- [ ] Create EventManager.js with event queue
- [ ] Create AIManager.js with API interface

### Phase 1.3: Basic Game Loop
- [ ] Implement main game loop in GameManager
- [ ] Add frame timing and update cycles
- [ ] Connect all modules to GameManager
- [ ] Create module initialization sequence
- [ ] Add basic error handling
- [ ] Implement pause/resume functionality

### Phase 1.4: State Management Foundation
- [ ] Design state structure for rooms/objects/inventory
- [ ] Implement state getters/setters
- [ ] Add state validation
- [ ] Create state change event system
- [ ] Add debug state inspection tools

## Phase 2: Graphics and Sound Systems
**Status**: Not Started

### Phase 2.1: Vector Graphics Engine
- [ ] Implement primitive drawing functions
- [ ] Add EGA dithering patterns
- [ ] Create draw order/z-index system
- [ ] Add clipping and viewport management
- [ ] Implement priority bands for walkable areas

### Phase 2.2: Sprite and Animation System
- [ ] Design VIEW resource format
- [ ] Implement sprite rendering
- [ ] Add animation sequencing
- [ ] Create character movement system
- [ ] Add collision detection

### Phase 2.3: Sound System
- [ ] Design SOUND resource format
- [ ] Implement Tone.js synthesizers
- [ ] Add music playback system
- [ ] Create sound effect engine
- [ ] Add volume controls

## Phase 3: Parser and Game Logic
**Status**: Not Started

### Phase 3.1: Text Parser
- [ ] Implement tokenization
- [ ] Add verb/noun recognition
- [ ] Create synonym system
- [ ] Add pronoun resolution
- [ ] Implement abbreviation handling

### Phase 3.2: Event and Script System
- [ ] Design SCRIPT resource format
- [ ] Create event queue and dispatcher
- [ ] Implement conditional logic
- [ ] Add timer system
- [ ] Create trigger system

### Phase 3.3: Game Logic Integration
- [ ] Connect parser to game actions
- [ ] Implement object interactions
- [ ] Add inventory management
- [ ] Create puzzle state tracking
- [ ] Add score system

## Phase 4: AI Integration
**Status**: Not Started

### Phase 4.1: World Generation
- [ ] Design JSON schema for game data
- [ ] Create validation system
- [ ] Implement static test world
- [ ] Add AI prompt templates
- [ ] Create generation pipeline

### Phase 4.2: Dynamic AI Responses
- [ ] Design context collection system
- [ ] Implement AI fallback handler
- [ ] Add response validation
- [ ] Create caching system
- [ ] Add rate limiting

### Phase 4.3: AI Configuration
- [ ] Add API key management
- [ ] Create model selection
- [ ] Implement retry logic
- [ ] Add error handling
- [ ] Create offline fallback

## Phase 5: Polish and Testing
**Status**: Not Started

### Phase 5.1: Save/Load System
- [ ] Design save file format
- [ ] Implement save functionality
- [ ] Add load functionality
- [ ] Create save file validation
- [ ] Add autosave

### Phase 5.2: UI Polish
- [ ] Refine menu system
- [ ] Add keyboard shortcuts
- [ ] Improve error messages
- [ ] Add loading indicators
- [ ] Create help system

### Phase 5.3: Testing and QA
- [ ] Create comprehensive test suite
- [ ] Add integration tests
- [ ] Perform cross-browser testing
- [ ] Add performance profiling
- [ ] Create demo adventure

## Next Steps
1. Begin Phase 1.2 by creating core module stubs
2. Set up module communication interfaces
3. Establish coding patterns and conventions
4. Create unit tests for each module

## Notes
- Each phase builds on the previous one
- Testing should be ongoing, not just in Phase 5
- AI integration can be mocked during early phases
- Focus on Sierra SCI0 authenticity throughout