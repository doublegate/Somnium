# Somnium Quick Start Guide

## Prerequisites

- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, or Edge 80+)
- Node.js and npm (optional, for development server)
- OpenAI API key or similar LLM service access

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/doublegate/Somnium.git
cd somnium
```

### 2. Configure API Access

Create a `config.js` file (this will be gitignored):

```javascript
// js/config.js
export const API_CONFIG = {
  apiKey: 'your-openai-api-key-here',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo', // or 'gpt-4'
};
```

### 3. Start Development Server

Using Python:

```bash
python -m http.server 8000
```

Using Node.js:

```bash
npx http-server -c-1 .
```

### 4. Open the Game

Navigate to `http://localhost:8000` in your browser.

## Creating Your First Adventure

### Starting a New Game

1. Click "New Adventure" from the main menu
2. (Optional) Enter a theme like "haunted castle" or "space station"
3. Wait for the AI to generate your unique world (5-10 seconds)
4. Begin exploring!

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

### Understanding the Parser

- The parser understands many synonyms: "get" = "take" = "grab"
- You can often omit articles: "take key" instead of "take the key"
- Use simple commands - the parser works best with verb + noun
- If the game doesn't understand, try rephrasing

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

Add `?debug=true` to the URL for developer features:

- Console access to game state
- Frame rate display
- Memory usage stats
- Event log

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

1. Try generating different themed adventures
2. Experiment with unusual commands - the AI can handle creative inputs
3. Challenge yourself to find optimal solutions (maximum score)
4. Share your favorite generated adventures with others
5. Consider contributing to the project!

Remember: Every adventure is unique. Even with the same theme, you'll never play the exact same game twice. Happy adventuring!
