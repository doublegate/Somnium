# Somnium Demos

This directory contains interactive demonstrations of Somnium's various subsystems and features.

## Available Demos

### 1. **demo-adventure.html** - Complete Adventure Demo

A fully playable demo adventure "The Enchanted Manor" showcasing all integrated systems working together.

- Natural language parser with full vocabulary
- Multi-room exploration with puzzles
- NPC interactions and trading
- Save/load functionality
- Complete game progression

### 2. **parser-demo.html** - Natural Language Parser

Interactive demonstration of the text parser system.

- Command parsing with synonyms
- Abbreviation support
- Pronoun resolution
- Error handling and suggestions

### 3. **demo-graphics.html** - Vector Graphics Engine

Showcases the EGA vector graphics rendering capabilities.

- 16-color EGA palette
- Vector primitives (lines, rectangles, polygons, ellipses)
- 9 dithering patterns
- Scene composition

### 4. **demo-sprites.html** - Sprite Animation System

Interactive character movement and animation demo.

- Keyboard-controlled character movement
- Smooth animation with interpolation
- Collision detection
- Z-ordering

### 5. **sound-demo.html** - Sound Effects System

Comprehensive sound synthesis demonstration.

- Retro synthesizer presets (PC Speaker, AdLib, MT-32)
- Procedural sound effects library
- Spatial audio simulation
- Volume controls

### 6. **music-demo.html** - Dynamic Music Generation

Real-time procedural music composition system.

- 8 different musical themes
- Adaptive music intensity
- Multi-track sequencing
- Leitmotif system

### 7. **game-world-demo.html** - Game World Logic

Demonstrates puzzle and NPC systems.

- Multi-step puzzle mechanics
- NPC dialogue trees
- Trading system
- Relationship tracking

## Running the Demos

All demos are self-contained HTML files that can be run directly in a web browser. However, due to CORS restrictions with ES6 modules, you need to serve them through a local web server.

### Quick Start

From the project root directory:

```bash
npm start
```

Then navigate to:

- http://localhost:8080/demos/[demo-name].html

### Alternative Methods

Using Python:

```bash
python -m http.server 8080
```

Using Node.js http-server:

```bash
npx http-server -p 8080
```

## Demo Controls

Most demos include on-screen instructions. Common controls:

- **Parser demos**: Type commands and press Enter
- **Graphics demos**: Click buttons or use keyboard shortcuts
- **Sound/Music demos**: Click to play sounds, adjust sliders for parameters
- **Game demos**: Use arrow keys for movement, type commands for actions

## Technical Notes

- All demos use the same core engine modules from the `js/` directory
- Graphics are rendered to a 320×200 canvas (scaled 2x for display)
- Sound synthesis uses the Web Audio API via Tone.js
- Demos are designed to work in modern browsers (Chrome, Firefox, Safari, Edge)

## Creating New Demos

To create a new demo:

1. Copy an existing demo HTML file as a template
2. Import the required modules from `../js/`
3. Add demo-specific initialization and UI
4. Place the file in this `demos/` directory
5. Update this README with the new demo information

Remember to use relative paths:

- CSS: `href="../css/styles.css"`
- JS modules: `from '../js/ModuleName.js'`
