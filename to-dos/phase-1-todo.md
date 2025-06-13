# Phase 1: Core Architecture Implementation TODO

## Overview

Phase 1 establishes the foundational architecture of the Somnium engine, creating the module structure and basic game loop that all other features will build upon.

## Phase Status

- [x] Phase 1.1: Project Setup ✅ COMPLETE
- [x] Phase 1.2: Core Module Stubs ✅ COMPLETE (June 13, 2025)
- [ ] Phase 1.3: Basic Game Loop (Current)
- [ ] Phase 1.4: State Management Foundation

## Phase 1.2: Core Module Stubs ✅ COMPLETE

### GameManager.js ✅

- [x] Create file with module export structure
- [x] Add properties for game state, modules, and loop control
- [x] Define init() method signature (constructor)
- [x] Define start() method signature (startNewGame)
- [x] Define stop() method signature (stopGame)
- [x] Define update() method signature
- [x] Define render() method signature
- [x] Add module registration system (constructor initialization)
- [x] Add basic error handling structure

### GameState.js ✅

- [x] Create file with state container
- [x] Define room state structure
- [x] Define object state structure
- [x] Define player state structure (currentRoom, inventory)
- [x] Define inventory structure
- [x] Add state getter methods
- [x] Add state setter methods
- [x] Add state validation stubs
- [x] Add state change notification system (state snapshots)

### SceneRenderer.js ✅

- [x] Create file with canvas management
- [x] Add canvas context acquisition
- [x] Define coordinate system (320×200)
- [x] Add clear() method
- [x] Add drawRectangle() stub (drawRect)
- [x] Add drawPolygon() stub
- [x] Add drawLine() stub
- [x] Add fillPattern() stub for dithering (drawDitheredGradient)
- [x] Add render queue structure (priority buffer)

### ViewManager.js ✅

- [x] Create file with sprite system structure
- [x] Define View class for sprites (view objects)
- [x] Define Loop class for animation loops (in view data)
- [x] Define Cel class for individual frames (frame objects)
- [x] Add sprite loading stub (createView)
- [x] Add animation update stub
- [x] Add sprite rendering stub
- [x] Add position management
- [x] Add z-order sorting structure (priority sorting)

### SoundManager.js ✅

- [x] Create file with Tone.js import
- [x] Initialize Tone.js context
- [x] Define Sound class structure (sound parameters)
- [x] Add play() method stub (playSound)
- [x] Add stop() method stub (stopAll)
- [x] Add volume control structure
- [x] Add sound loading stub (parameter generation)
- [x] Add music/sfx channel separation
- [x] Add basic synthesizer setup

### Parser.js ✅

- [x] Create file with parser structure
- [x] Define token types (verb, noun, etc.)
- [x] Add tokenize() method stub (in parse method)
- [x] Add parse() method stub
- [x] Define command structure (ParsedCommand)
- [x] Add vocabulary structure
- [x] Add synonym mapping structure
- [x] Add abbreviation system stub (expandSynonyms)
- [x] Add command validation stub

### EventManager.js ✅

- [x] Create file with event system
- [x] Define Event class structure (action objects)
- [x] Add event queue array (scheduledEvents)
- [x] Add queueEvent() method (scheduleEvent)
- [x] Add processEvents() stub (updateScheduledEvents)
- [x] Add event priority system (scheduled by time)
- [x] Add conditional trigger structure
- [x] Add timer event structure
- [x] Add event handler registration

### AIManager.js ✅

- [x] Create file with AI interface
- [x] Add API configuration structure
- [x] Define generateWorld() stub
- [x] Define processAction() stub (getDynamicResponse)
- [x] Add prompt template structure
- [x] Add response validation stub
- [x] Add context collection stub
- [x] Add mock mode for testing
- [x] Add error handling structure

## Phase 1.3: Basic Game Loop

### Game Loop Implementation

- [ ] Implement requestAnimationFrame loop
- [ ] Add fixed timestep with interpolation
- [ ] Add FPS counter
- [ ] Add frame timing measurements
- [ ] Implement update/render separation
- [ ] Add pause/resume functionality
- [ ] Add loop state management
- [ ] Add performance monitoring

### Module Integration

- [ ] Wire up all modules to GameManager
- [ ] Create initialization sequence
- [ ] Add module dependency checking
- [ ] Implement module communication
- [ ] Add module error handling
- [ ] Create module lifecycle hooks
- [ ] Add module hot-reloading support

### Error Handling

- [ ] Create central error handler
- [ ] Add error logging system
- [ ] Implement graceful degradation
- [ ] Add error recovery mechanisms
- [ ] Create error reporting UI
- [ ] Add debug mode toggles

## Phase 1.4: State Management Foundation

### State Structure Design

- [ ] Create comprehensive state schema
- [ ] Design room data structure
- [ ] Design object data structure
- [ ] Design character data structure
- [ ] Design inventory system
- [ ] Design flag/variable system
- [ ] Design timer system
- [ ] Document state format

### State Operations

- [ ] Implement state initialization
- [ ] Add state loading from JSON
- [ ] Create state mutation methods
- [ ] Add state validation
- [ ] Implement state snapshots
- [ ] Add state diffing
- [ ] Create state history
- [ ] Add undo/redo structure

### State Events

- [ ] Design state change events
- [ ] Implement event dispatching
- [ ] Add event listeners
- [ ] Create event filtering
- [ ] Add event batching
- [ ] Implement event replay
- [ ] Add event logging

### Debug Tools

- [ ] Create state inspector UI
- [ ] Add state export function
- [ ] Implement state import
- [ ] Add state validation UI
- [ ] Create state diff viewer
- [ ] Add performance metrics
- [ ] Implement state search

## Testing Requirements

### Unit Tests (per module)

- [ ] GameManager tests
- [ ] GameState tests
- [ ] SceneRenderer tests
- [ ] ViewManager tests
- [ ] SoundManager tests
- [ ] Parser tests
- [ ] EventManager tests
- [ ] AIManager tests

### Integration Tests

- [ ] Module initialization tests
- [ ] Module communication tests
- [ ] Game loop tests
- [ ] State management tests
- [ ] Error handling tests

## Success Criteria

- All modules created with proper structure
- Modules can be imported and initialized
- Basic game loop runs without errors
- State can be created and modified
- All tests pass
- No console errors during normal operation
- Documentation updated for each module

## Next Steps After Phase 1

- Phase 2.1: Implement vector graphics primitives
- Phase 2.2: Create sprite rendering system
- Phase 2.3: Build sound synthesis engine
