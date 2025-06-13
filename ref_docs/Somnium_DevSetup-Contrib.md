# Developer Setup and Contribution Guide

Welcome to the Somnium development team! This guide will help you set up the project on your machine, understand the project structure, and follow best practices for contributing code or content. Whether you're focusing on engine code, AI prompt tweaks, or content creation, this document provides the information needed to get started and work effectively with the team.

## Introduction

**Project Overview:** Somnium is a web-based AI-driven adventure game. It consists of a frontend web app (HTML/JS/CSS) that runs a custom game engine and communicates with an LLM backend for content generation. The project draws inspiration from classic Sierra games, so we often reference those in design and code comments.

**Key Technologies:**

- Language: JavaScript (ES6+). Optionally, in future, we may migrate to TypeScript for better maintainability, but currently plain JS.
- Canvas for graphics, Web Audio (Tone.js) for sound.
- The LLM API (OpenAI GPT or Google Gemini or similar) accessed via fetch calls; API keys required (not in repo for security).
- Build tools: None complex yet; we use plain JS modules (if we do) or a simple bundler if needed. The project can run as static files served from a local server.

## Project Structure

Here's an outline of the repository structure:

```
somnium-project/
│
├── index.html            # Main HTML file running the game
├── css/
│   └── styles.css        # Basic styles (canvas styling, UI layout)
├── js/
│   ├── GameManager.js    # Core game loop and engine coordinator
│   ├── AIManager.js      # Handles LLM communication
│   ├── GameState.js      # Stores game state
│   ├── SceneRenderer.js  # Draws backgrounds
│   ├── ViewManager.js    # Handles sprite animations
│   ├── SoundManager.js   # Music and SFX
│   ├── Parser.js         # Text parser
│   ├── EventManager.js   # Processes events and scripts
│   ├── InputManager.js   # (if separate) handles keyboard/mouse input
│   ├── UI.js             # UI elements like menu, modal text box
│   └── utils/            # Utility functions (e.g., for color conversion)
│
├── assets/
│   ├── images/           # Any static images (maybe UI icons, etc.)
│   └── audio/            # Any static audio (like a title theme or click sound)
│
├── prompts/              # Prompt templates or examples (for development reference)
│   ├── world_prompt.txt
│   └── interaction_prompt.txt
│
├── saves/                # (gitignored) Default directory where saves might be stored during dev
│
├── tests/                # Test scripts if using any automated tests
│
├── docs/                 # Documentation (design docs, etc. possibly including this content)
│
└── package.json          # If using npm for any libraries (e.g., Tone.js can be via CDN or npm)
```

**Note:** Some components might not exist yet or are combined, depending on implementation progress. For instance, Input handling might be partly in GameManager until we separate it.

We strive to keep code modular:

- Each manager is largely independent and communicates via agreed interfaces (e.g., GameManager calls AIManager.generateWorld(), AIManager returns JSON, GameManager calls GameState.init(json), etc.).
- UI and engine logic are separated. The UI.js handles showing/hiding the text input box, menus, but it invokes GameManager or others for actual game actions.

## Setting Up Development Environment

**Prerequisites:**

- Node.js and npm (optional but useful for running a local server or managing dependencies).
- A modern web browser (Chrome or Firefox recommended for dev due to good dev tools).
- If using npm, `npm install` to fetch dependencies (if any listed in package.json, e.g., Tone.js or potential others).

  - Currently, Tone.js can be used via CDN script tag, but for dev, we might use npm and bundle.

**Running the Game Locally:**
Since it's a web app, you can simply open `index.html` in a browser. However, due to security, some browsers restrict fetch or file:// for APIs and local audio files. It's best to run a local server:

- The simplest: if you have Python installed, run `python -m http.server 8000` in the project directory. This serves files at [http://localhost:8000](http://localhost:8000).
- Or use an npm package like `http-server`:

  - `npm install -g http-server`
  - then `http-server -c-1 .` (the -c-1 disables caching).

- Or use Live Server extension if you're using VSCode.

Once served, open the URL ([http://localhost:8000](http://localhost:8000) or given by tool). You should see the game UI. Open console to see logs.

**API Keys Configuration:**
The LLM API likely requires a secret key. We do NOT commit this to repo for security. Instead:

- We use an environment config. Possibly an `apiKey.js` that is gitignored, which exports the key or we fetch it from a server.
- As a developer, get the API key from the project lead. Then:

  - If there's a config file template (like `config.sample.js`), put your key in and rename to `config.js`.
  - Or set an environment variable if we proxy via Node.

- Some devs use a proxy server to avoid exposing key on client. If so, follow instructions for running that proxy (maybe a simple Express server that stores the key and forwards requests).
- For now, let's say we use fetch directly from client. That means the key could be exposed. It's not ideal, but maybe during development it's okay. In production, a proxy or cloud function would hide it.
- So in dev, set `AIManager.apiKey = "sk-...";` or similar. Ensure not to commit that file.

**Installing Dependencies:**

- Tone.js: we include via CDN in index.html for simplicity. If bundling, `npm install tone`.
- If we eventually use frameworks (unlikely, as we custom build engine).
- For testing libraries, might see some in package.json (like Jest for unit tests).

**Build Process:**
No heavy build yet. If we start using modules, we might need a bundler:

- Could use Parcel or Webpack with minimal config.
- Right now, ensure all JS files are included via `<script>` in correct order or use ES6 module imports with `<script type="module">`.

  - If using modules, then you usually can't run from file://, need http. We already plan local server so it's fine.

**Coding Guidelines:**

- Indentation: 2 spaces (consistent across files).
- Variables: use meaningful names. Follow JavaScript conventions (camelCase for variables and functions, PascalCase for classes).
- Comments: Use JSDoc style for functions and classes. Given our team might expand, document parameters and returns where not obvious.
- Keep functions relatively short. If a function in SceneRenderer is handling too much, break it (like we did logically with drawDitheredGradient etc.).
- Use const/let, avoid var.
- Prefer === for comparisons to avoid type coercion bugs.
- We are targeting modern browsers, so ES6 features (arrow functions, etc.) are fine.

**Branching and Version Control:**

- We use Git. The `main` branch holds stable code. For new features or fixes, create a branch, e.g., `feature-parser-improvement` or `bugfix-save-crash`.
- Submit a pull request for review. At least one other dev should review, especially for bigger changes.
- Ensure PRs pass tests (if we have automated tests, run `npm test` before pushing).
- Keep commits clean and messages descriptive. E.g., "Fix parser not recognizing 'take'" rather than "fix stuff".

**Dev Tools and Logging:**

- Use the browser console heavily for debugging. We have a global `GameManager` instance (maybe accessible via console for testing commands).
- We might have a debug mode: e.g., pressing \~ could open a debug panel or typing a cheat in parser triggers debug info (like list flags or skip puzzles). You can implement such for your convenience but gate it (maybe only if `?debug=true` in URL).
- For profiling performance, use Chrome Performance tab when needed (especially if adding heavy drawing code).

## Contributing Code Changes

When adding new features or modifying:

- Check relevant docs (like the design docs) to ensure alignment with intended design.
- Write or update tests if appropriate. E.g., if adding a new verb in Parser, update Parser tests.
- Test manually in the game to ensure new feature works and doesn’t break others.
- If the change affects the AI prompt or output format, be extra careful: run a few generation cycles to ensure no breakage in loading content.
- Document any new module or major function in code and possibly update this guide or other docs if it changes usage (like if devs now have to config something new).

**Bug Reporting/Fixing:**

- If you find a bug, check GitHub issues (if we use) to see if known.
- Write an issue with steps to reproduce if you can't fix immediately.
- When fixing, refer to the issue number in commit message.

**Style and Linting:**

- We may use ESLint with a predefined config (maybe Airbnb style or StandardJS) to catch issues. If so, run linter before commit.
- Format code properly. We might have a .editorconfig to help or just adhere to existing code style.

## Testing and QA during Development

It’s good to run through quick test scenarios after changes:

- Start a new game with a simple seed, see if generation still works.
- Try a known problematic command sequence to ensure previous bugs fixed and no regressions.
- Run unit tests (if any) frequently.

We have a separate Testing and QA Plan doc; refer to that to know what aspects need manual test vs automated. As a contributor, be mindful not to introduce new potential issues:

- e.g., if altering AIManager, consider the moderation pipeline etc.

## Documentation and Communication

We maintain docs in the `docs/` folder. If you make significant design changes, update or add docs accordingly. For example, if you extend the JSON format or add a new module, document it.

We use a team Slack/Discord (if applicable) for quick communication. Feel free to ask questions or discuss design decisions there. It's better to gather consensus on a large change before investing time (e.g., switching to TypeScript, or rewriting part of engine).

For prompt changes: share your reasoning and maybe sample outputs with the team, because prompts are delicate – a small tweak can have wide effects. We'll often test those collaboratively.

## Setting Up a Development Environment (Summary)

1. Clone the repository.
2. Obtain API key and configure it (e.g., create `js/config.js` with `export const API_KEY = 'yourkey';` and have AIManager import it, or set up proxy).
3. Install any dependencies: `npm install` (if using any).
4. Start a local server and open the game.
5. Ensure you can start a new game (the AI request might take a few seconds, watch console for the JSON).
6. Try saving/loading.
7. You're now ready to code!

## Additional Resources for Developers

- **Sierra SCI Documentation:** We have links and references (like the SCI Companion docs) to understand the original engine. They’re not required reading, but if you want to deepen understanding (especially for graphics or priority), check out those resources (some are cited in our design docs).
- **Tone.js docs:** if working on audio, see tonejs documentation for how to create synths or sound effects.
- **OpenAI API docs:** if you dive into AIManager, knowing the API usage (rate limits, how to format conversation or prompts) is useful.
- **MDN Web Docs:** For any web APIs we use (CanvasRenderingContext2D, WebAudio, etc.), MDN is a good reference.

## Contribution Etiquette

- Be respectful in code reviews; we all come from different backgrounds. Provide constructive feedback.
- When reviewing PRs, ensure functionality and style, but also try to run the branch code if possible to catch any issues.
- If a deadline is near (perhaps a release or demo), focus on stabilizing rather than big changes.

We all share a passion for both classic adventure games and cutting-edge AI tech. By following this guide, you'll help maintain a codebase that's robust, extensible, and fun to work with. We welcome creative ideas and improvements—Somnium is an innovative project and there's plenty of room for contributors to leave their mark, just as long as we keep the experience smooth and true to its vision.

Happy coding and adventuring!
