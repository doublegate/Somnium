# Somnium

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/doublegate/Somnium/releases/tag/v2.0.0)
[![Tests](https://img.shields.io/badge/tests-444%20passing-brightgreen.svg)](https://github.com/doublegate/Somnium/actions)
[![Coverage](https://img.shields.io/badge/coverage-61.64%25-yellow.svg)](https://github.com/doublegate/Somnium)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

An AI-driven graphical text-adventure game inspired by Sierra On-Line's SCI0-era games (1988-1989). Every time you play, the AI generates a completely unique adventure with its own story, puzzles, and world.

![Somnium Banner](https://github.com/doublegate/Somnium/blob/main/assets/banner.png)

## 🎮 Play Now

**[Play Somnium Online](https://doublegate.github.io/Somnium/)** - No installation required! Works in any modern browser.

> **Note**: The live demo runs in offline mode with static test worlds. For AI-generated adventures, follow the [Quick Start](#quick-start) guide below to set up your own API key.

## Features

### 🎮 Core Game Experience

- **AI-Generated Adventures**: Each playthrough creates a unique world with original puzzles, characters, and storylines
- **Authentic Retro Experience**: Faithful recreation of Sierra's SCI0 engine look and feel
  - 320×200 resolution with 16-color EGA graphics
  - Text parser interface with natural language understanding
  - Vector-based graphics rendering with 9 dithering patterns
  - Dynamic MIDI-style music generation with multiple sound presets
- **Complete Game Systems**:
  - Advanced parser with synonym support and abbreviations
  - Full inventory system with weight/size constraints and containers
  - Multi-step puzzle system with hints and rewards
  - NPC dialogue trees with relationship tracking
  - Trading system for merchant interactions
  - Achievement and scoring system
  - Multiple endings based on player choices
- **Save Your Dreams**: Complete save/load system preserves your unique generated worlds
- **Intelligent Interactions**: Unscripted actions handled dynamically by AI
- **Family-Friendly**: Built-in content moderation ensures appropriate content

### 🌐 v2.0 Multiplayer & Cloud Features

- **🎭 Multiplayer Co-op**: Play adventures together with friends in real-time
  - WebSocket-based real-time synchronization
  - Session browser with password protection
  - Three game modes: Co-op, Competitive, and Shared World
  - Built-in chat system for player communication
  - Automatic state synchronization across all players
- **☁️ Cloud Saves**: Save your progress to the cloud and play anywhere
  - Secure authentication with encrypted passwords
  - Unlimited cloud save slots
  - Automatic sync across devices
  - Import/export save files for offline backup
- **🤝 Social Sharing**: Share your favorite worlds with the community
  - Upload and download player-created worlds
  - Rating and review system
  - Browse by rating, date, or world name
  - Discover adventures created by other players

### 🛠️ World Creation Tools

- **Visual World Editor**: Create custom adventures with the built-in editor
  - Drag-and-drop room design
  - Vector graphics drawing tools
  - NPC and item placement
  - Puzzle and event scripting
- **World Templates**: Jump-start your creativity with professional templates
  - Medieval Castle (5-room fantasy adventure)
  - Mysterious Dungeon (4-room dungeon crawler)
  - Space Station (4-room sci-fi exploration)
  - Empty template for building from scratch
- **Interactive Tutorial**: Learn to play with a guided walkthrough
  - 5-room tutorial world teaching all mechanics
  - Helpful guide NPC with comprehensive dialogue
  - Practice movement, items, puzzles, and commands
  - Earn achievements for completing the tutorial

### 🔧 Developer Features

- **Automated Deployment**: GitHub Actions workflow for continuous deployment
- **Cross-Browser Testing**: Playwright E2E tests across 5 browsers (Chrome, Firefox, Safari, Mobile)
- **PWA Support**: Full Progressive Web App with offline capability
- **Accessibility**: ARIA labels, keyboard navigation, high contrast mode

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

### Multiplayer Server Setup (Optional)

To enable multiplayer features, run the backend servers:

1. Navigate to the server directory:

```bash
cd server
npm install
```

2. Create a `.env` file in the `server/` directory (optional):

```env
PORT=3000
MULTIPLAYER_PORT=8080
JWT_SECRET=your-secret-key
```

3. Start both servers:

```bash
# Start both API and multiplayer servers
npm run start:all

# Or start individually
npm run start              # API server only (port 3000)
npm run start:multiplayer  # Multiplayer server only (port 8080)
```

4. Access multiplayer lobby at `http://localhost:8000/multiplayer.html`

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

## Try the Demos

Explore Somnium's features through interactive demonstrations:

**Game Experiences:**
- **Tutorial World**: Learn to play with an interactive guide - `http://localhost:8000/demos/demo-adventure.html?world=tutorial`
- **Complete Adventure**: Play "The Enchanted Manor" demo - `http://localhost:8000/demos/demo-adventure.html`
- **Multiplayer Lobby**: Test multiplayer features - `http://localhost:8000/multiplayer.html`

**Technical Demos:**
- **Parser Demo**: Test the natural language parser - `http://localhost:8000/demos/parser-demo.html`
- **Graphics Demo**: See the vector graphics engine - `http://localhost:8000/demos/demo-graphics.html`
- **Sound Demo**: Experience retro sound synthesis - `http://localhost:8000/demos/sound-demo.html`

**Creation Tools:**
- **World Editor**: Create custom adventures - `http://localhost:8000/editor.html`
- **World Templates**: Browse pre-built templates in the editor's "New World" menu

See [Running Demos](docs/run-demos.md) for the complete list and instructions.

## Development

### Testing

Somnium includes a comprehensive test suite with 444+ tests covering all major systems:

- **Unit Tests**: Individual module functionality (444 tests)
- **Integration Tests**: System interactions
- **Parser Tests**: Natural language processing
- **Game Logic Tests**: Puzzles, NPCs, progression
- **E2E Tests**: Cross-browser end-to-end testing with Playwright

```bash
# Run unit tests
npm test

# Run E2E tests (requires servers running)
npx playwright test

# Run E2E tests with UI
npx playwright test --ui

# Run E2E tests in specific browser
npx playwright test --project=chromium
```

See [Test Documentation](tests/README.md) for details.

### Project Structure

```
Somnium/
├── index.html          # Main game file
├── editor.html         # World editor interface
├── multiplayer.html    # Multiplayer lobby
├── js/                 # Game engine modules
│   ├── GameManager.js        # Core game loop
│   ├── AIManager.js          # LLM integration
│   ├── Parser.js             # Text input processing
│   ├── MultiplayerManager.js # Multiplayer client
│   ├── world-templates.js    # Pre-built world templates
│   └── ...                   # Other modules
├── css/                # Styles
│   ├── main.css             # Main game styles
│   ├── editor.css           # Editor styles
│   └── multiplayer.css      # Multiplayer styles
├── server/             # Backend servers
│   ├── api-server.js        # REST API (auth, saves, sharing)
│   ├── multiplayer-server.js # WebSocket server
│   └── package.json         # Server dependencies
├── demos/              # Interactive demonstrations
├── docs/               # Documentation
├── ref_docs/           # Design documents
├── tests/              # Test suites
│   ├── unit/               # Jest unit tests
│   └── e2e/                # Playwright E2E tests
├── scripts/            # Utility scripts
│   └── generate-icons.js   # PWA icon generator
└── to-dos/             # Project tracking
```

### Building from Source

Currently, Somnium runs directly from source with no build step required. Simply serve the files from a web server.

### Testing

The project includes a comprehensive test suite using Jest:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

See [Test Suite Documentation](tests/README.md) for details on writing and running tests.

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
- [Running Demos](docs/run-demos.md) - How to run interactive demonstrations

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

🚀 **VERSION 2.0.0 RELEASED!** 🚀

Somnium v2.0.0 is **production-ready** with multiplayer, cloud features, and comprehensive testing! All development phases complete, including backend infrastructure and deployment automation.

### What's New in v2.0.0

**Path A - Full Production Launch:**
- ✅ Node.js multiplayer server with WebSocket support
- ✅ Express REST API for authentication, cloud saves, and social sharing
- ✅ GitHub Actions deployment workflow for automatic CI/CD
- ✅ Playwright E2E testing across 5 browsers (Chrome, Firefox, Safari, Mobile)
- ✅ PWA icon generation script for all required sizes

**Path B - Editor Enhancement:**
- ✅ World template library with 4 professional templates
- ✅ Interactive tutorial world teaching all game mechanics
- ✅ Pre-built worlds: Medieval Castle, Mysterious Dungeon, Space Station

**Path C - Multiplayer Focus:**
- ✅ Multiplayer lobby UI with session management
- ✅ Real-time chat system for player communication
- ✅ Three game modes: Co-op, Competitive, Shared World
- ✅ Session browser with password protection and privacy options

### What's Included in v1.0.0 (Base)

- **Phase 1 (Core Architecture)** - ✅ Complete
  - Fixed timestep game loop (60 FPS) with interpolation
  - Event-driven state management
  - FPS monitoring and debug overlay

- **Phase 2 (Graphics and Sound Systems)** - ✅ Complete
  - 16-color EGA vector graphics engine with 9 dithering patterns
  - Sierra-compatible sprite animation system
  - Procedural sound synthesis (30+ SFX, 8 music themes)
  - Retro synthesizer presets (PC Speaker, AdLib FM, MT-32)

- **Phase 3 (Parser and Game Logic)** - ✅ Complete
  - Natural language parser with 100+ verb synonyms
  - 30+ fully implemented adventure game commands
  - Enhanced inventory system with containers and equipment
  - Multi-step puzzle system with hints
  - NPC dialogue trees with relationship tracking and trading
  - Achievement and scoring system with multiple endings

- **Phase 4 (AI Integration)** - ✅ Complete
  - OpenAI-compatible LLM integration with exponential backoff retry
  - AI world generation with 8-step validation
  - Dynamic interaction handling for unscripted actions
  - Offline mode with 3 static test worlds (small, medium, large)

- **Phase 5 (Polish and Sierra Enhancements)** - ✅ Complete
  - Professional save/load system (10 slots + auto-save)
  - File import/export for save games
  - Priority-based audio management (Sierra-inspired)
  - Synchronized sound with cue-based timing
  - Layered ambient soundscapes (7 predefined)
  - Priority rendering system with depth testing
  - Enhanced parser with Sierra Said() pattern matching
  - State-based animation system

- **Main Game UI** - ✅ Complete
  - Professional UI with command history (arrow key navigation)
  - Visual save/load slot selector with metadata
  - Real-time volume controls (master, music, SFX, ambient)
  - Restart functionality with theme preservation
  - Sierra-style ASCII box title display
  - Offline mode detection and notifications

### Quality Metrics

- **444 tests passing** (100% pass rate across 20 test suites)
- **61.64% overall code coverage** with high coverage in critical modules
- **Zero ESLint/Prettier errors**
- **Full CI/CD pipeline** (Node.js 18.x and 20.x tested)

### Release Information

- **Version**: 2.0.0
- **Release Date**: June 18, 2025
- **Changelog**: See [CHANGELOG.md](CHANGELOG.md) for complete release notes
- **Download**: [Latest Release](https://github.com/doublegate/Somnium/releases/tag/v2.0.0)
- **Live Demo**: [Play Online](https://doublegate.github.io/Somnium/)
- **Multiplayer**: [Join Lobby](https://doublegate.github.io/Somnium/multiplayer.html)
- **Editor**: [Create Worlds](https://doublegate.github.io/Somnium/editor.html)

### What's Next?

v2.0.0 is production-ready with multiplayer and cloud features! Future enhancements:
- Mobile app versions (iOS/Android)
- Voice command support
- VR/AR integration
- Advanced world editor features (terrain tools, lighting effects)
- Community marketplace for custom worlds
- Leaderboards and competitive tournaments
- Mod support and plugin system

See [Deferred Implementations](docs/deferred-impl.md) for the full roadmap.

---

_Every adventure is unique. Every playthrough is a new dream. Welcome to Somnium._
