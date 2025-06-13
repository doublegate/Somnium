# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Somnium is an AI-driven graphical text-adventure game inspired by Sierra On-Line's SCI0-era games (1988-1989). It generates unique adventures at runtime using LLMs while maintaining strict adherence to retro aesthetics and technical constraints.

## Architecture

The engine follows Sierra's SCI philosophy of complete separation between engine and content:

- **Engine**: JavaScript modules that interpret game data (analogous to SCI interpreter)
- **Content**: AI-generated JSON packages containing all game resources (analogous to compiled SCI resources)

### Core Modules (Phase 1 Complete ✅)

- **GameManager.js**: Main game loop with fixed timestep, FPS monitoring, pause/resume
- **AIManager.js**: LLM communication with mock mode for testing, rate limiting, caching
- **GameState.js**: Event-driven state management with validation, history, and undo
- **SceneRenderer.js**: Vector-based rendering with EGA palette and priority system
- **ViewManager.js**: Sprite animation with interpolation, movement, and z-order
- **SoundManager.js**: Audio synthesis using Tone.js with channel management
- **Parser.js**: Natural language parser with vocabulary and synonym support
- **EventManager.js**: Event system with scripted/dynamic responses and scheduling

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

## CI/CD Configuration

The project uses GitHub Actions for continuous integration:

- **Node.js versions**: 18.x and 20.x (Jest 30 requires Node.js 18+)
- **Jobs**: Lint, Test (with coverage), Security Audit, Browser Compatibility
- **ESLint**: v9 with flat config format (eslint.config.js)
- **Coverage**: Reports uploaded to Codecov for the 18.x test run
- **All checks must pass** before merging pull requests

## Reference Documentation

Comprehensive design documents are in `/ref_docs/`:

- Game design philosophy and mechanics
- Technical specifications for each subsystem
- AI prompt engineering guidelines
- Save/load file format specification
- Graphics generation techniques
- Testing and QA procedures
