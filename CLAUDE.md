# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Somnium is an AI-driven graphical text-adventure game inspired by Sierra On-Line's SCI0-era games (1988-1989). It generates unique adventures at runtime using LLMs while maintaining strict adherence to retro aesthetics and technical constraints.

## Architecture

The engine follows Sierra's SCI philosophy of complete separation between engine and content:
- **Engine**: JavaScript modules that interpret game data (analogous to SCI interpreter)
- **Content**: AI-generated JSON packages containing all game resources (analogous to compiled SCI resources)

### Core Modules

- **GameManager.js**: Main game loop, orchestrates all subsystems
- **AIManager.js**: LLM communication for world generation and dynamic interactions
- **GameState.js**: Centralized game state management
- **SceneRenderer.js**: Vector-based background rendering (320×200, 16-color EGA)
- **ViewManager.js**: Sprite animation and character movement
- **SoundManager.js**: Procedural music/SFX using Tone.js
- **Parser.js**: Natural language text parser
- **EventManager.js**: Script execution and puzzle logic

## Development Commands

```bash
# Local development server (required due to CORS for modules)
python -m http.server 8000
# or
npx http-server -c-1 .

# Install dependencies (when package.json exists)
npm install

# Run tests (when implemented)
npm test
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

## Reference Documentation

Comprehensive design documents are in `/ref_docs/`:
- Game design philosophy and mechanics
- Technical specifications for each subsystem
- AI prompt engineering guidelines
- Save/load file format specification
- Graphics generation techniques
- Testing and QA procedures