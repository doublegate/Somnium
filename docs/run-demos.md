# Running Somnium Demos

This guide explains how to run the interactive demonstrations included with Somnium.

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Node.js and npm installed (for the development server)
- The Somnium repository cloned locally

## Starting the Demo Server

Due to browser security restrictions (CORS), the demos must be served through a web server rather than opened directly as files.

### Using npm (Recommended)

From the project root directory:

```bash
# Install dependencies (first time only)
npm install

# Start the development server
npm start
```

The server will start on http://localhost:8080

### Alternative: Using npm run dev

```bash
npm run dev
```

This starts the server on http://localhost:8000

### Alternative: Using Python

If you have Python installed:

```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

### Alternative: Using Node.js without npm

```bash
npx http-server -p 8080
```

## Accessing the Demos

Once the server is running, open your browser and navigate to:

```
http://localhost:8080/demos/
```

Or directly to a specific demo:

```
http://localhost:8080/demos/[demo-name].html
```

## Available Demos

### 1. Complete Adventure Demo

**URL**: http://localhost:8080/demos/demo-adventure.html

A fully playable adventure game demonstrating all systems working together.

**How to play**:

- Type commands in natural language (e.g., "look around", "take key", "go north")
- Use abbreviations: `n` for north, `i` for inventory, `x` for examine
- Type `help` to see all available commands
- Save your progress with `save [name]`

### 2. Parser Demo

**URL**: http://localhost:8080/demos/parser-demo.html

Test the natural language parser with various commands.

**Try these**:

- Basic commands: `look`, `take lamp`, `go north`
- Complex commands: `put the red key in the wooden box`
- Abbreviations: `n`, `s`, `e`, `w`, `i`, `x`
- Pronouns: `take book` then `examine it`

### 3. Graphics Demo

**URL**: http://localhost:8080/demos/demo-graphics.html

Explore the vector graphics rendering system.

**Features**:

- Click buttons to see different primitive types
- Observe EGA color palette usage
- See dithering patterns in action
- Watch scene composition

### 4. Sprite Demo

**URL**: http://localhost:8080/demos/demo-sprites.html

Interactive character animation demonstration.

**Controls**:

- Arrow keys: Move character
- Spacebar: Toggle running
- R: Reset position
- Watch smooth animation and collision detection

### 5. Sound Effects Demo

**URL**: http://localhost:8080/demos/sound-demo.html

Comprehensive sound synthesis showcase.

**How to use**:

- Click sound buttons to play effects
- Adjust volume sliders
- Try different synthesizer presets
- Test spatial audio with position slider

### 6. Music Demo

**URL**: http://localhost:8080/demos/music-demo.html

Dynamic music generation system.

**Features**:

- Select different musical themes
- Adjust music intensity slider
- Mute individual tracks
- Play character leitmotifs
- Switch between synthesizer presets

### 7. Game World Demo

**URL**: http://localhost:8080/demos/game-world-demo.html

Test puzzle and NPC interaction systems.

**Try these**:

- Solve multi-step puzzles
- Talk to NPCs and explore dialogue trees
- Trade items with merchants
- Track relationship changes

## Troubleshooting

### "Failed to load module" Error

Make sure you're accessing the demos through a web server (localhost) and not as file:// URLs.

### Sound Not Working

- Check your browser allows audio playback
- Some browsers require user interaction before playing audio
- Make sure your system volume is not muted

### Graphics Not Rendering

- Ensure your browser supports HTML5 Canvas
- Check the browser console for any error messages
- Try refreshing the page

### Performance Issues

- Close other browser tabs to free up resources
- Try a different browser
- Check if hardware acceleration is enabled in your browser

## Browser Compatibility

The demos are tested on:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development Tips

### Debugging

Open the browser developer console (F12) to see:

- Debug messages from the game engine
- Any JavaScript errors
- Network requests for module loading

### Making Changes

If you modify the engine code in the `js/` directory, simply refresh the demo page to see your changes.

### Creating New Demos

See the [demos README](../demos/README.md) for instructions on creating new demonstrations.

## Additional Resources

- [Main README](../README.md) - Project overview
- [Game Design Document](game-design.md) - Detailed design specifications
- [Architecture Document](architecture.md) - Technical architecture details
- [API Reference](api-reference.md) - Module API documentation
