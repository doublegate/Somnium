# Somnium Implementation Roadmap

## Overview

This document provides a structured approach to implementing Somnium, breaking down the project into manageable phases with clear dependencies and milestones.

## Phase 1: Core Engine Foundation (Weeks 1-2)

### 1.1 Project Setup

- [ ] Initialize package.json with dependencies (Tone.js)
- [ ] Create index.html with canvas element (320x200)
- [ ] Set up basic CSS for retro styling
- [ ] Create development server configuration
- [ ] Set up .gitignore for API keys and saves

### 1.2 Core Module Stubs

- [ ] GameManager.js - Main game loop with requestAnimationFrame
- [ ] GameState.js - Basic state structure and getters/setters
- [ ] SceneRenderer.js - Canvas initialization and clear methods
- [ ] Parser.js - Basic verb/noun extraction
- [ ] EventManager.js - Event queue and execution framework

### 1.3 Static Test Data

- [ ] Create test-world.json with sample game data
- [ ] Implement JSON loading and validation
- [ ] Basic room rendering from static data
- [ ] Simple text output system

## Phase 2: Graphics System (Week 3)

### 2.1 EGA Palette Implementation

- [ ] Define 16-color palette constants
- [ ] Implement color validation utilities
- [ ] Set up pixel-perfect rendering (imageSmoothingEnabled = false)

### 2.2 Primitive Rendering

- [ ] Rectangle drawing with EGA colors
- [ ] Polygon rendering with fill
- [ ] Dithered gradient implementation (2x2 pattern)
- [ ] Circle and star shape support
- [ ] Z-order/priority system

### 2.3 Scene Composition

- [ ] Background clearing and redraw
- [ ] Primitive batching from JSON
- [ ] Label system for scene regions
- [ ] Basic view placeholder rendering

## Phase 3: Game Logic (Week 4)

### 3.1 Parser Enhancement

- [ ] Verb synonym dictionary
- [ ] Multi-word noun support
- [ ] Pronoun resolution ("it", "them")
- [ ] Command abbreviations
- [ ] Error message generation

### 3.2 Event System

- [ ] Script action execution (SET_FLAG, GIVE_ITEM, etc.)
- [ ] Conditional logic evaluation
- [ ] Puzzle state tracking
- [ ] Score system implementation
- [ ] Timer/delayed event support

### 3.3 Navigation

- [ ] Room exit handling
- [ ] Player position tracking
- [ ] Movement commands (north, south, etc.)
- [ ] Room transition effects

## Phase 4: AI Integration (Weeks 5-6)

### 4.1 AIManager Implementation

- [ ] API key configuration system
- [ ] Master prompt template
- [ ] JSON generation request handling
- [ ] Response validation and error recovery
- [ ] Theme/seed injection

### 4.2 Dynamic Interactions

- [ ] Context gathering for LLM queries
- [ ] Unscripted action handling
- [ ] Response integration without state corruption
- [ ] Rate limiting and caching

### 4.3 Content Moderation

- [ ] Moderation API integration
- [ ] Local filter implementation
- [ ] Fallback response system
- [ ] Content logging for analysis

## Phase 5: Audio System (Week 7)

### 5.1 Tone.js Integration

- [ ] Library setup and initialization
- [ ] Basic synth instrument creation
- [ ] Music theme interpreter
- [ ] Ambient sound generator

### 5.2 Sound Management

- [ ] Room-based music switching
- [ ] Sound effect triggering
- [ ] Volume controls
- [ ] Audio state in save files

## Phase 6: UI and Polish (Week 8)

### 6.1 Menu System

- [ ] Sierra-style menu bar
- [ ] File menu (Save/Load/Quit)
- [ ] Game menu (Inventory/Score)
- [ ] Speed control
- [ ] Help system

### 6.2 Text Window

- [ ] Modal text display
- [ ] Game pause during input
- [ ] Command history
- [ ] Text wrapping and scrolling

### 6.3 Save/Load System

- [ ] Complete state serialization
- [ ] File download/upload handlers
- [ ] Version checking
- [ ] Multiple save slots

## Phase 7: Animation System (Week 9)

### 7.1 ViewManager Development

- [ ] Sprite data structure
- [ ] Animation loop playback
- [ ] Movement interpolation
- [ ] Collision detection basics

### 7.2 Character Animation

- [ ] Player character movement
- [ ] NPC idle animations
- [ ] Object state animations
- [ ] Priority-based layering

## Phase 8: Testing and QA (Week 10)

### 8.1 Unit Testing

- [ ] Parser test suite
- [ ] State management tests
- [ ] Event execution tests
- [ ] Save/load integrity tests

### 8.2 Integration Testing

- [ ] Full game flow testing
- [ ] AI response validation
- [ ] Cross-browser testing
- [ ] Performance profiling

### 8.3 Puzzle Validation

- [ ] Automated solver implementation
- [ ] Solvability verification
- [ ] Dead-end detection
- [ ] Hint system testing

## Phase 9: Optimization (Week 11)

### 9.1 Performance

- [ ] Memory leak detection
- [ ] Rendering optimization
- [ ] API call reduction
- [ ] Asset caching strategies

### 9.2 Error Handling

- [ ] Graceful degradation
- [ ] Error recovery flows
- [ ] User-friendly error messages
- [ ] Debug mode implementation

## Phase 10: Launch Preparation (Week 12)

### 10.1 Documentation

- [ ] User manual creation
- [ ] Command reference
- [ ] Troubleshooting guide
- [ ] API documentation

### 10.2 Deployment

- [ ] Production build configuration
- [ ] API key security
- [ ] Hosting setup
- [ ] Analytics integration

## Critical Path Dependencies

```
Project Setup → Core Modules → Graphics OR Game Logic
                                  ↓
                            AI Integration
                                  ↓
                         Audio System → UI Polish
                                            ↓
                                    Animation System
                                            ↓
                                      Testing & QA
                                            ↓
                                     Optimization
                                            ↓
                                   Launch Preparation
```

## Risk Mitigation

1. **AI Response Quality**: Develop comprehensive test suite early
2. **Performance Issues**: Profile regularly, especially canvas operations
3. **Browser Compatibility**: Test on all major browsers throughout development
4. **API Costs**: Implement caching and rate limiting from the start
5. **Save File Corruption**: Extensive testing of serialization/deserialization

## Success Metrics

- [ ] Generate coherent, solvable adventures consistently
- [ ] Maintain 60 FPS during gameplay
- [ ] < 2 second AI response time for dynamic interactions
- [ ] Zero game-breaking bugs in puzzle logic
- [ ] Authentic SCI0 look and feel
