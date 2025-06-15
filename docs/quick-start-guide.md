# Somnium Quick Start Guide

## Prerequisites

- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, or Edge 80+)
- Node.js and npm (for development)
- OpenAI API key or similar LLM service access (when AI integration is complete)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/doublegate/Somnium.git
cd somnium
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API Access (Future)

When AI integration is complete, create a `config.js` file (this will be gitignored):

```javascript
// js/config.js
export const API_CONFIG = {
  apiKey: 'your-openai-api-key-here',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo', // or 'gpt-4'
};
```

### 4. Start Development Server

```bash
npm start  # starts http-server on port 8080
# or
npm run dev  # starts http-server on port 8000
```

### 5. Explore the Demo Pages

Navigate to:

- `http://localhost:8080` - Main game interface
- `http://localhost:8080/demos/demo-adventure.html` - Complete playable adventure
- `http://localhost:8080/demos/demo-graphics.html` - Vector graphics showcase
- `http://localhost:8080/demos/sprite-demo.html` - Interactive sprite animation
- `http://localhost:8080/demos/sound-demo.html` - Sound synthesis library
- `http://localhost:8080/demos/music-demo.html` - Music generation system
- `http://localhost:8080/demos/parser-demo.html` - Natural language parser
- `http://localhost:8080/demos/game-world-demo.html` - Puzzle and NPC systems

## Current Development Status

**Phase 1 (Core Architecture)** - ✅ Complete

- All 8 core modules implemented
- Fixed timestep game loop with interpolation
- Event-driven state management
- FPS monitoring and debug overlay

**Phase 2 (Graphics and Sound)** - ✅ Complete

- Vector graphics with EGA palette (all primitives)
- 9 dithering patterns for visual effects
- Sprite animation with smooth interpolation
- 16-channel Tone.js sound synthesis
- 128-voice polyphonic music system

**Phase 3 (Parser and Game Logic)** - ✅ Complete

- Natural language parser ✅ (150+ verbs, pronouns, multi-word nouns)
- Command execution system ✅ (30+ adventure game verbs)
- Game mechanics ✅ (inventory, interactions, movement, puzzles, NPCs)
- Save/load functionality ✅ (multiple slots with metadata)

**Testing Status**: 444 tests passing across all modules (100% pass rate)

## Creating Your First Adventure

### Starting a New Game

1. Click "New Adventure" from the main menu
2. (Optional) Enter a theme like "haunted castle" or "space station"
3. Wait for the AI to generate your unique world (5-10 seconds) _[AI integration pending]_
4. Begin exploring!

**Note**: Currently using test data while AI integration is in development.

### Basic Commands

**Movement:**

- `go north` or just `north` (also: south, east, west, up, down)
- `enter [place]`
- `exit`

**Interaction:**

- `look` or `look around` - Describe current location
- `look at [object]` - Examine something specific
- `take [item]` or `get [item]` - Pick up an item
- `inventory` or `inv` - Check what you're carrying
- `use [item] on [object]` - Use an item

**Communication:**

- `talk to [character]`
- `ask [character] about [topic]`
- `give [item] to [character]`

**Common Actions:**

- `open [object]`
- `close [object]`
- `push [object]`
- `pull [object]`
- `unlock [object] with [item]`

### Keyboard Shortcuts

- `ESC` - Open game menu
- `F1` - Help
- `F5` - Save game
- `F7` - Load game
- `Arrow Keys` - Move character (when implemented)

## Understanding the Interface

```
┌─────────────────────────────────────┐
│ File  Game  Speed  Sound  Help      │  <- Menu Bar
├─────────────────────────────────────┤
│                                     │
│                                     │
│         [Game Graphics              │  <- Game Display (320x200)
│          Display Area]              │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ > look at dragon                    │  <- Text Input/Output
│ The dragon regards you with ancient │
│ eyes that gleam like emeralds.      │
└─────────────────────────────────────┘
```

## Saving and Loading

### To Save Your Game

1. Click `File > Save` from the menu, or press `F5`
2. Choose a save slot (1-10)
3. Enter a description (optional)
4. The game will download a `.sav` file to your computer

### To Load a Saved Game

1. Click `File > Load` from the menu, or press `F7`
2. Select the `.sav` file from your computer
3. The game will restore exactly where you left off

## Tips for Playing

### General Tips

- **Examine everything** - Look at objects for clues
- **Try different verbs** - If "open" doesn't work, try "unlock" or "push"
- **Check your inventory** - You might already have what you need
- **Talk to everyone** - NPCs often provide hints
- **Save often** - Before trying something dangerous

### Puzzle Solving

- Most puzzles require finding and using the right item
- Pay attention to descriptions - they often contain hints
- If stuck, try exploring other areas first
- The game is designed to be solvable - every puzzle has a solution

### Understanding the Parser ✅ Fully Implemented

- The parser understands 150+ verbs with extensive synonyms
- Handles multi-word nouns: "take brass key", "look at old wooden chest"
- Supports all pronouns: it, them, him, her, me
- Complex commands: "use key on door", "give sword to knight"
- Command abbreviations: "n" for north, "inv" for inventory
- Confidence scoring helps identify ambiguous commands

## Troubleshooting

### "I don't understand that" Messages

- Check your spelling
- Try simpler phrasing
- Make sure the object exists in the current room
- Use "look" to see what's available

### Game Won't Start

- Check your internet connection (needed for AI generation)
- Verify your API key is correct in config.js
- Check the browser console for error messages
- Try refreshing the page

### Performance Issues

- Close other browser tabs
- Try a different browser
- Reduce game speed in the Speed menu
- Check if your computer meets minimum requirements

## Example Playthrough

```
> look
You stand in a dusty library. Ancient tomes line the walls, and a
large oak desk dominates the center of the room. A door leads north.

> look at desk
The desk is covered in papers. A brass key glints among them.

> take brass key
You pick up the brass key.

> inventory
You are carrying:
- a brass key

> go north
The door is locked.

> unlock door with brass key
You unlock the door with the brass key. It swings open revealing
a moonlit corridor beyond.

> go north
You enter the moonlit corridor...
```

## Advanced Features

### Debug Mode

Add `?debug=true` to the URL or press `D` for developer features:

- FPS counter overlay (top-right corner)
- Console access to game state
- Performance metrics
- Event and command history logging
- Priority visualization in renderer
- Audio channel monitoring

### Custom Themes

When starting a new game, you can combine themes:

- "haunted pirate ship"
- "cyberpunk detective story"
- "medieval comedy"

The AI will blend these concepts into unique adventures.

## Getting Help

- Press `F1` or click `Help` for in-game command reference
- Check `/docs` folder for technical documentation
- Report bugs or issues to the development team
- Join our community forums for tips and discussions

## Next Steps

1. Explore the demo pages to see all implemented features
2. Test the parser with complex commands and pronouns
3. Check out the graphics and sound capabilities
4. Review the comprehensive test suite (444 tests)
5. Consider contributing to Phase 4 AI integration!

### Upcoming Features (Phase 4-5)

- AI integration for dynamic content generation
- LLM-powered world generation with themes
- Dynamic NPC conversations
- Content moderation and safety filters
- Final UI polish and optimization

Remember: Every adventure is unique. Even with the same theme, you'll never play the exact same game twice. Happy adventuring!
