# Deferred Implementations

This document tracks functionality that was commented out, removed, marked as TODO, or needs to be implemented to complete the Somnium project. Items are organized by phase and priority.

## Phase 3 - Current Phase (Parser and Game Logic)

### CommandExecutor.js

1. **Alias resolution for multi-word commands**

   - Currently `resolveAlias()` only handles single-word aliases
   - Need to parse aliases like 'n' -> 'go north' properly
   - Location: `CommandExecutor.js` line ~1650

2. **Complete handleAsk() implementation**

   - Currently has basic topic handling
   - Need to integrate with NPCSystem for dynamic responses
   - Location: `CommandExecutor.js` line ~1090

3. **Complete handleGive() NPC acceptance logic**

   - Currently simplified to always accept items
   - Need to check `npc.acceptsItems` array
   - Need to handle `acceptMessage` and `refuseMessage`
   - Location: `CommandExecutor.js` line ~706

4. **Save/Load implementation**

   - `handleSave()` currently returns "Feature coming soon"
   - `handleLoad()` returns "not yet implemented"
   - Need actual save/load functionality with GameState
   - Location: `CommandExecutor.js` lines ~509, ~1482

5. **Container state checking in handlePut()**
   - Need to check if container is open before putting items
   - Currently missing `target.open` check
   - Location: `CommandExecutor.js` line ~764

### EventManager.js

1. **Missing triggerEvent() method**

   - Referenced by tests but not implemented
   - Needed for wait command and other event triggers
   - Should dispatch events to registered handlers

2. **Missing checkCondition() method**

   - Referenced in tests but not implemented
   - Should evaluate condition objects against game state

3. **Dynamic command execution**
   - `executeCommand()` should handle scripted events
   - Currently only passes to AI manager

### Test Failures

1. **CommandExecutor tests expecting different response formats**

   - Help command expects specific text format
   - Score command expects "out of" instead of "of"
   - Some tests expect properties that don't exist (takeable vs canTake)

2. **Mock object mismatches**
   - Tests use different property names than implementation
   - Need to align mock objects with actual game object structure

## Phase 4 - AI Integration (Not Started)

### AIManager.js

1. **Real LLM integration**

   - Currently only has mock mode
   - Need to implement actual API calls
   - Rate limiting and caching systems

2. **Prompt engineering**

   - World generation prompts
   - Dynamic interaction prompts
   - Context management

3. **Response validation**
   - JSON schema validation
   - Consistency checking
   - Error recovery

### World Generation

1. **JSON resource generation**

   - Complete game world from single prompt
   - Rooms, items, NPCs, puzzles
   - Ensure solvability

2. **Dynamic content**
   - Runtime generation of descriptions
   - Contextual NPC dialogue
   - Adaptive puzzle hints

## Phase 5 - Polish and Testing (Not Started)

### UI/UX

1. **Menu system implementation**

   - Main menu functionality
   - Settings/options
   - Save/load UI

2. **Text formatting**
   - Proper text wrapping
   - Color highlighting
   - Animation effects

### Cross-browser

1. **Browser compatibility**
   - Test on all major browsers
   - Polyfills where needed
   - Performance optimization

### Performance

1. **Canvas optimization**
   - Dirty rectangle updates
   - Sprite batching
   - Memory management

## General TODOs Found in Code

### GameState.js

- Save/load system implementation
- Proper error handling for corrupted saves
- Migration system for save file versions

### Parser.js

- Multi-language support infrastructure
- Custom vocabulary loading
- Parser hint system

### SceneRenderer.js

- Particle effects system
- Advanced dithering patterns
- Performance profiling

### SoundManager.js

- Spatial audio improvements
- Dynamic music transitions
- Sound effect variations

### ViewManager.js

- Sprite scaling for different resolutions
- Advanced animation blending
- Effect overlays (glow, shadow)

## Configuration and Setup

### API Key Management

- Move from config.js to environment variables
- Implement secure key storage
- Add key rotation support

### Build System

- Production build optimization
- Asset bundling
- Minification setup

## Testing Infrastructure

### Integration Tests

- Full game playthrough tests
- AI response validation tests
- Performance benchmarks

### E2E Tests

- Browser automation tests
- Cross-platform testing
- Accessibility testing

## Documentation

### API Documentation

- JSDoc completion for all modules
- Usage examples
- Module interaction diagrams

### User Documentation

- Player guide
- Modding guide
- Adventure creation tools

## Future Enhancements

### Multiplayer Support

- Shared world exploration
- Turn-based gameplay
- Chat integration

### Mobile Support

- Touch controls
- Responsive UI
- Performance optimization

### Modding System

- Custom adventure format
- Asset replacement
- Script injection

---

**Note**: This document should be updated as implementations are completed or new deferred items are discovered. Each item should include enough context to understand what needs to be done and where in the codebase it belongs.
