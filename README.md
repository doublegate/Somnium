# Somnium

An AI-driven graphical text-adventure game inspired by Sierra On-Line's SCI0-era games (1988-1989). Every time you play, the AI generates a completely unique adventure with its own story, puzzles, and world.

![Somnium Banner](https://github.com/doublegate/Somnium/blob/main/assets/banner.png)

## Features

- **AI-Generated Adventures**: Each playthrough creates a unique world with original puzzles, characters, and storylines
- **Authentic Retro Experience**: Faithful recreation of Sierra's SCI0 engine look and feel
  - 320×200 resolution with 16-color EGA graphics
  - Text parser interface with natural language understanding
  - Vector-based graphics rendering
  - Dynamic MIDI-style music generation
- **Save Your Dreams**: Complete save/load system preserves your unique generated worlds
- **Intelligent Interactions**: Unscripted actions handled dynamically by AI
- **Family-Friendly**: Built-in content moderation ensures appropriate content

## Quick Start

### Prerequisites

- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, or Edge 80+)
- OpenAI API key or compatible LLM service
- Node.js and npm (optional, for development server)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/doublegate/Somnium.git
cd Somnium
```

2. Create a `config.js` file in the `js/` directory:

```javascript
export const API_CONFIG = {
  apiKey: 'your-openai-api-key-here',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
};
```

3. Start a local web server:

```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx http-server -c-1 .
```

4. Open your browser to `http://localhost:8000`

5. Click "New Adventure" and optionally enter a theme (e.g., "haunted castle", "space station")

## How to Play

### Basic Commands

- **Movement**: `go north`, `south`, `east`, `west`, `up`, `down`
- **Interaction**: `look`, `look at [object]`, `take [item]`, `use [item] on [object]`
- **Communication**: `talk to [character]`, `ask [character] about [topic]`
- **Inventory**: `inventory` or `inv`

### Tips

- Examine everything - descriptions often contain clues
- Save your game frequently (F5)
- The parser understands many synonyms (e.g., "get" = "take" = "grab")
- If stuck, try exploring other areas or talking to characters

## Development

### Project Structure

```
Somnium/
├── index.html          # Main game file
├── js/                 # Game engine modules
│   ├── GameManager.js  # Core game loop
│   ├── AIManager.js    # LLM integration
│   ├── Parser.js       # Text input processing
│   └── ...            # Other modules
├── css/               # Styles
├── docs/              # Documentation
├── ref_docs/          # Design documents
└── to-dos/            # Project tracking
```

### Building from Source

Currently, Somnium runs directly from source with no build step required. Simply serve the files from a web server.

Future versions may include:

- TypeScript migration
- Module bundling with Webpack/Parcel
- Automated testing with Jest

### Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Areas where we especially need help:

- Testing across different browsers and devices
- Improving the AI prompts for better game generation
- Adding new graphics primitives and effects
- Enhancing the parser with more natural language understanding

## Documentation

- [Quick Start Guide](docs/quick-start-guide.md) - Get playing quickly
- [Architecture Overview](docs/architecture-overview.md) - System design and modules
- [API Reference](docs/module-api-reference.md) - Detailed module documentation
- [Implementation Roadmap](docs/implementation-roadmap.md) - Development phases

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by Sierra On-Line's SCI0 engine and classic adventure games
- Built with modern web technologies and AI
- Special thanks to the adventure game community for keeping the genre alive

## Support

- **Issues**: [GitHub Issues](https://github.com/doublegate/Somnium/issues)
- **Discussions**: [GitHub Discussions](https://github.com/doublegate/Somnium/discussions)
- **Security**: See [SECURITY.md](SECURITY.md) for reporting vulnerabilities

## Status

🚧 **Under Active Development** 🚧

Somnium is currently in early development. Core engine architecture is designed and documented, but implementation is just beginning. See [CHANGELOG.md](CHANGELOG.md) for version history and [to-dos/](to-dos/) for current progress.

---

_Every adventure is unique. Every playthrough is a new dream. Welcome to Somnium._
