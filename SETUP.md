# Somnium - Quick Setup Guide

This guide will help you set up and run Somnium in 5 minutes.

## Quick Start (Offline Mode)

The fastest way to try Somnium is offline mode, which uses pre-built test worlds:

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Create configuration file**:

   ```bash
   cp js/config.template.js js/config.js
   ```

   The default configuration runs in **offline mode** (no API key needed).

3. **Start the server**:

   ```bash
   npm start
   ```

4. **Play the game**:
   - Open http://localhost:8080 in your browser
   - Click **"New Adventure"**
   - Start exploring!

That's it! You're now playing Somnium with a built-in test world.

## AI-Powered Mode (Optional)

For unique, AI-generated adventures, you'll need an OpenAI API key.

### Getting an API Key

1. Visit https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Copy the key (starts with `sk-...`)

### Configuring AI Mode

1. Open `js/config.js` in your editor
2. Replace `'your-api-key-here'` with your actual API key:

   ```javascript
   apiKey: 'sk-your-actual-key-here',
   ```

3. (Optional) Choose your preferred model:

   ```javascript
   model: 'gpt-3.5-turbo', // Fast and cheap
   // model: 'gpt-4',         // Better quality, more expensive
   ```

4. Save the file and restart the server

Now when you start a new adventure, the AI will generate a unique world based on your chosen theme!

## Configuration Options

Edit `js/config.js` to customize your experience:

### API Settings

```javascript
// AI Configuration
apiKey: 'your-api-key-here',
apiEndpoint: 'https://api.openai.com/v1/chat/completions',
model: 'gpt-3.5-turbo',
```

### Game Settings

```javascript
// Gameplay
autoSave: true,              // Auto-save every 5 minutes
debugMode: false,            // Show FPS counter
useSierraParser: true,       // Sierra-style command parsing
usePriorityRenderer: true,   // Sierra-style graphics
```

### Audio Settings

```javascript
// Volume (0.0 to 1.0)
masterVolume: 0.7,
musicVolume: 0.6,
sfxVolume: 0.8,
ambientVolume: 0.5,
```

## Alternative: Local LLM

You can use a local LLM instead of OpenAI:

### Using Ollama

1. Install Ollama: https://ollama.ai
2. Start Ollama with a model:

   ```bash
   ollama run llama2
   ```

3. Update `js/config.js`:

   ```javascript
   export const API_CONFIG = {
     apiKey: 'not-needed',
     apiEndpoint: 'http://localhost:11434/v1/chat/completions',
     model: 'llama2',
     // ... rest of settings
   };
   ```

### Using LM Studio

1. Install LM Studio: https://lmstudio.ai
2. Load a model and start the local server
3. Update `js/config.js`:
   ```javascript
   export const API_CONFIG = {
     apiKey: 'not-needed',
     apiEndpoint: 'http://localhost:1234/v1/chat/completions',
     model: 'your-model-name',
     // ... rest of settings
   };
   ```

## Gameplay Tips

### Basic Commands

- **Movement**: `go north`, `n`, `south`, `e`, `w`
- **Looking**: `look`, `look at door`, `examine key`
- **Items**: `take lamp`, `drop book`, `inventory`
- **Using**: `use key on door`, `open chest`
- **NPCs**: `talk to merchant`, `ask guard about castle`

### Command Shortcuts

- `n`, `s`, `e`, `w`, `up`, `down` - Movement
- `i` or `inv` - Show inventory
- `x [object]` - Examine object
- `l` - Look around

### Menu Bar

- **File**: Save, Load, Quit
- **Game**: Restart, Inventory, About
- **Speed**: Adjust game speed (1-5)
- **Sound**: Toggle audio on/off
- **Help**: Commands, How to Play

### Saving Your Game

- Use **File > Save Game** from the menu
- Or type `save` in the game
- Auto-save runs every 5 minutes (if enabled)
- Save files are stored in your browser's localStorage

## Troubleshooting

### "Missing config.js" Error

Run: `cp js/config.template.js js/config.js`

### "Must run through a web server" Error

Don't open index.html directly. Instead, run `npm start` and use http://localhost:8080

### AI Responses Not Working

1. Check your API key is correct in `js/config.js`
2. Verify you have API credits in your OpenAI account
3. Check browser console (F12) for error messages
4. The game will automatically fall back to offline mode if the API fails

### Sound Not Playing

1. Click anywhere on the page to allow audio
2. Check your browser's audio settings
3. Adjust volume in the **Sound** menu
4. Some browsers block auto-play audio

### Graphics Issues

1. Ensure your browser supports HTML5 Canvas
2. Try a different browser (Chrome, Firefox, Safari, Edge)
3. Clear browser cache and reload
4. Check browser console for errors (F12)

## Performance Tips

### For Slower Computers

- Close other browser tabs
- Disable debug mode: `debugMode: false`
- Lower game speed to 1-2

### For Budget API Usage

- Use `gpt-3.5-turbo` (cheaper than GPT-4)
- Increase cache size: `responseCacheSize: 200`
- Lower rate limit: `maxRequestsPerMinute: 5`
- Use offline mode for testing

## Next Steps

- **Read the manual**: See `docs/game-design.md` for game mechanics
- **Try the demos**: Run `npm start` and visit http://localhost:8080/demos/
- **Explore the code**: Check out `docs/architecture.md` for technical details
- **Join development**: See `CONTRIBUTING.md` for how to contribute

## Additional Resources

- **Main README**: Project overview and features
- **Demo Guide**: `docs/run-demos.md` - How to run interactive demos
- **API Reference**: `docs/api-reference.md` - Module documentation
- **Game Design**: `docs/game-design.md` - Gameplay mechanics
- **Architecture**: `docs/architecture.md` - Technical architecture

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the browser console for errors (F12)
3. Check `docs/` for detailed documentation
4. Open an issue on GitHub

## Have Fun!

Somnium is designed to create unique adventures every time you play. Experiment with different themes, explore creative solutions to puzzles, and enjoy the AI-driven storytelling!

Happy adventuring! 🎮✨
