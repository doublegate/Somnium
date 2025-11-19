# Deep Improvements for Somnium Engine

Based on comprehensive analysis of Sierra's SCI games (King's Quest 4, Space Quest 3, Quest for Glory 1 EGA, and Police Quest 2: The Iceman), this document outlines architectural improvements that would elevate Somnium from a promising prototype to a production-ready adventure game engine.

## Overview

The analysis revealed three critical areas where Sierra's battle-tested patterns can significantly enhance Somnium:

1. **Parser System**: Sierra's `Said` syntax and multi-word verb handling
2. **Graphics Engine**: Priority-based rendering and state-driven animations
3. **Sound System**: Layered audio with priority management and synchronization

Additionally, modern web technologies can provide improvements beyond what Sierra could achieve in the 1980s:

4. **Resource Management**: Scene-based loading with predictive caching
5. **Performance Architecture**: Web Workers for non-blocking game logic
6. **Development Workflow**: Visual tools and hot-reloading

## 1. Parser Improvements

### 1.1 Implement Sierra's Said Pattern Matching

Sierra's parser uses a sophisticated pattern matching system that goes beyond simple string matching. Here's how to implement it in JavaScript:

```javascript
// SaidPattern class for flexible command matching
class SaidPattern {
  constructor(pattern) {
    // Convert Sierra-style pattern to regex
    // Example: "look/examine/l [at] <object>"
    this.pattern = this.compileSaidPattern(pattern);
    this.captureGroups = [];
  }

  compileSaidPattern(pattern) {
    // Sierra patterns use:
    // / for alternatives: "get/take/grab"
    // [] for optional words: "[the] key"
    // <> for word classes: "<object>"
    // * for wildcards: "* key"

    let regex = pattern
      .replace(/\[([^\]]+)\]/g, '(?:$1)?') // Optional words
      .replace(/([^\/]+)\/([^\/\s]+)/g, '(?:$1|$2)') // Alternatives
      .replace(/<(\w+)>/g, (match, group) => {
        this.captureGroups.push(group);
        return '(\\w+)'; // Capture word class
      })
      .replace(/\*/g, '.*'); // Wildcards

    return new RegExp(`^${regex}$`, 'i');
  }

  matches(input, vocabulary) {
    // First expand input using vocabulary synonyms
    const expanded = this.expandSynonyms(input, vocabulary);
    const match = expanded.match(this.pattern);

    if (match) {
      const captures = {};
      this.captureGroups.forEach((group, index) => {
        captures[group] = match[index + 1];
      });
      return { matched: true, captures };
    }

    return { matched: false };
  }

  expandSynonyms(input, vocabulary) {
    return input
      .split(' ')
      .map((word) => {
        const canonical = vocabulary.getCanonical(word);
        return canonical || word;
      })
      .join(' ');
  }
}

// Enhanced Parser with Sierra-style patterns
class EnhancedParser extends Parser {
  constructor(vocabulary) {
    super(vocabulary);
    this.saidPatterns = new Map();
    this.initializePatterns();
  }

  initializePatterns() {
    // From KQ4: Complex fairy tale commands
    this.addPattern('give/offer/hand [the] <item> [to] <character>', 'GIVE');
    this.addPattern('wave [the] [magic] wand [at] <target>', 'WAVE_WAND');

    // From SQ3: Sci-fi interactions
    this.addPattern(
      'insert/put [the] <item> [in/into] [the] <container>',
      'INSERT'
    );
    this.addPattern('scan/analyze <object> [with] [the] [scanner]', 'SCAN');

    // From QFG1: Combat and RPG commands
    this.addPattern('cast [magic/spell] <spell> [at/on] <target>', 'CAST');
    this.addPattern('throw/hurl [the] <item> [at] <target>', 'THROW');

    // From Iceman: Procedural commands
    this.addPattern('set [the] <control> [to] <value>', 'SET_CONTROL');
    this.addPattern(
      'check/inspect [the] <equipment> [for] [damage]',
      'INSPECT'
    );
  }

  parse(input) {
    // Try Sierra-style pattern matching first
    for (const [pattern, action] of this.saidPatterns) {
      const result = pattern.matches(input, this.vocabulary);
      if (result.matched) {
        return {
          action,
          ...result.captures,
          raw: input,
          confidence: 1.0,
        };
      }
    }

    // Fall back to original parser
    return super.parse(input);
  }
}
```

### 1.2 Multi-Word Verb Support

Based on analysis of the games, here are the most common multi-word verbs that need special handling:

```javascript
class VocabularyEnhanced extends Vocabulary {
  constructor() {
    super();
    this.initializeMultiWordVerbs();
  }

  initializeMultiWordVerbs() {
    // From various Sierra games
    this.multiWordVerbs = {
      'pick up': 'take',
      'put down': 'drop',
      'look at': 'examine',
      'turn on': 'activate',
      'turn off': 'deactivate',
      'climb up': 'ascend',
      'climb down': 'descend',
      'get in': 'enter',
      'get out': 'exit',
      'lie down': 'sleep',
      'stand up': 'stand',
      'sit down': 'sit',
      'wake up': 'wake',
      'pick lock': 'unlock',
      'put on': 'wear',
      'take off': 'remove',
    };
  }

  preprocessInput(input) {
    // Check for multi-word verbs before tokenization
    let processed = input.toLowerCase();

    for (const [multiWord, canonical] of Object.entries(this.multiWordVerbs)) {
      const regex = new RegExp(`\\b${multiWord}\\b`, 'g');
      processed = processed.replace(regex, canonical);
    }

    return processed;
  }
}
```

### 1.3 Context-Sensitive Parsing

From QFG1 and Iceman, we see commands that only work in specific contexts:

```javascript
class ContextualCommandExecutor extends CommandExecutor {
  validateContext(command) {
    const context = this.gameState.getContext();

    switch (command.action) {
      case 'ORDER':
        // From SQ3: Must be sitting at bar
        if (!context.sitting || context.location !== 'bar') {
          return {
            valid: false,
            message: 'You need to be sitting at the bar.',
          };
        }
        break;

      case 'DIVE':
        // From Iceman: Must be at proper depth
        if (context.depth < 50) {
          return {
            valid: false,
            message: 'Not deep enough to execute that maneuver.',
          };
        }
        break;

      case 'CAST':
        // From QFG1: Must have spell learned and mana
        const spell = command.spell;
        if (!this.gameState.hasSpell(spell)) {
          return {
            valid: false,
            message: `You don't know the ${spell} spell.`,
          };
        }
        if (this.gameState.mana < this.getSpellCost(spell)) {
          return { valid: false, message: 'Not enough mana.' };
        }
        break;
    }

    return { valid: true };
  }
}
```

## 2. Graphics Generation and Display Improvements

### 2.1 Priority-Based Rendering System

Sierra games use a sophisticated priority system for proper sprite layering:

```javascript
class PriorityRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.priorityBuffer = new Uint8Array(320 * 200);
    this.priorityGradient = this.generatePriorityGradient();
  }

  generatePriorityGradient() {
    // Based on KQ4's priority system
    const gradient = [];
    for (let y = 0; y < 200; y++) {
      if (y < 48)
        gradient[y] = 4; // Sky/background
      else if (y < 60)
        gradient[y] = 5; // Far distance
      else if (y < 72)
        gradient[y] = 6; // Mid-far
      else if (y < 84)
        gradient[y] = 7; // Mid distance
      else if (y < 96)
        gradient[y] = 8; // Mid-near
      else if (y < 108)
        gradient[y] = 9; // Near distance
      else if (y < 120)
        gradient[y] = 10; // Closer
      else if (y < 132)
        gradient[y] = 11; // Close
      else if (y < 144)
        gradient[y] = 12; // Very close
      else if (y < 156)
        gradient[y] = 13; // Foreground
      else gradient[y] = 14; // Immediate foreground
    }
    return gradient;
  }

  renderScene(scene, sprites) {
    // Clear buffers
    this.ctx.clearRect(0, 0, 320, 200);
    this.priorityBuffer.fill(0);

    // Render background with priority info
    this.renderBackground(scene.background, scene.priorityMap);

    // Sort sprites by priority
    const sortedSprites = this.sortSpritesByPriority(sprites);

    // Render sprites respecting priority
    for (const sprite of sortedSprites) {
      this.renderSprite(sprite);
    }
  }

  sortSpritesByPriority(sprites) {
    return sprites.sort((a, b) => {
      // Fixed priority overrides Y-position
      if (a.fixedPriority && b.fixedPriority) {
        return a.priority - b.priority;
      }
      if (a.fixedPriority) return -1;
      if (b.fixedPriority) return 1;

      // Otherwise use Y position
      return a.y - b.y;
    });
  }

  renderSprite(sprite) {
    const priority = sprite.fixedPriority
      ? sprite.priority
      : this.priorityGradient[Math.floor(sprite.y)];

    // Only render pixels that have higher priority
    for (let sy = 0; sy < sprite.height; sy++) {
      for (let sx = 0; sx < sprite.width; sx++) {
        const px = sprite.x + sx;
        const py = sprite.y + sy;
        const bufferIndex = py * 320 + px;

        if (this.priorityBuffer[bufferIndex] <= priority) {
          // Render pixel
          this.ctx.fillStyle = sprite.getPixel(sx, sy);
          this.ctx.fillRect(px, py, 1, 1);
          this.priorityBuffer[bufferIndex] = priority;
        }
      }
    }
  }
}
```

### 2.2 State-Based Animation System

From analyzing room scripts, Sierra uses state machines for complex animations:

```javascript
class StateAnimator {
  constructor(view) {
    this.view = view;
    this.states = new Map();
    this.currentState = null;
    this.stateTime = 0;
  }

  defineState(name, config) {
    this.states.set(name, {
      loops: config.loops || [],
      transitions: config.transitions || {},
      onEnter: config.onEnter || (() => {}),
      onExit: config.onExit || (() => {}),
      duration: config.duration || Infinity,
    });
  }

  initializeStates() {
    // From KQ4: Rosella's animations
    this.defineState('idle', {
      loops: [{ loop: 0, cels: [0], cycleTime: 1000 }],
      transitions: {
        walk: { condition: () => this.view.isMoving },
        pickup: { condition: () => this.view.currentAction === 'take' },
      },
    });

    this.defineState('walk', {
      loops: [
        { loop: 1, cels: [0, 1, 2, 3], cycleTime: 150 }, // Right
        { loop: 2, cels: [0, 1, 2, 3], cycleTime: 150 }, // Left
        { loop: 3, cels: [0, 1, 2, 3], cycleTime: 150 }, // Away
        { loop: 4, cels: [0, 1, 2, 3], cycleTime: 150 }, // Toward
      ],
      transitions: {
        idle: { condition: () => !this.view.isMoving },
      },
    });

    this.defineState('pickup', {
      loops: [{ loop: 5, cels: [0, 1, 2, 3, 4], cycleTime: 200 }],
      duration: 1000,
      onExit: () => (this.view.currentAction = null),
      transitions: {
        idle: { condition: () => true }, // Always return to idle
      },
    });
  }

  update(deltaTime) {
    if (!this.currentState) return;

    this.stateTime += deltaTime;
    const state = this.states.get(this.currentState);

    // Check for state transitions
    for (const [nextState, transition] of Object.entries(state.transitions)) {
      if (transition.condition()) {
        this.changeState(nextState);
        return;
      }
    }

    // Check duration-based transitions
    if (this.stateTime >= state.duration) {
      const defaultTransition = Object.keys(state.transitions)[0];
      if (defaultTransition) {
        this.changeState(defaultTransition);
      }
    }

    // Update animation
    this.updateAnimation(state, deltaTime);
  }

  changeState(newState) {
    const oldState = this.states.get(this.currentState);
    const nextState = this.states.get(newState);

    if (oldState) oldState.onExit();

    this.currentState = newState;
    this.stateTime = 0;

    nextState.onEnter();
  }
}
```

### 2.3 Day/Night Cycle System (from KQ4)

```javascript
class DayNightSystem {
  constructor(sceneRenderer) {
    this.sceneRenderer = sceneRenderer;
    this.currentTime = 'day';
    this.overlayCache = new Map();
  }

  setTimeOfDay(time) {
    if (this.currentTime === time) return;

    this.currentTime = time;
    this.updateSceneGraphics();
  }

  updateSceneGraphics() {
    const scene = this.sceneRenderer.currentScene;

    if (this.currentTime === 'night') {
      // KQ4 pattern: night graphics are room number + 100
      const nightOverlay = this.getNightOverlay(scene.id);
      this.sceneRenderer.applyOverlay(nightOverlay);

      // Adjust palette for night colors
      this.sceneRenderer.setPalette(this.getNightPalette());

      // Add moon/stars if outdoors
      if (scene.isOutdoor) {
        this.addCelestialBodies();
      }
    } else {
      this.sceneRenderer.clearOverlay();
      this.sceneRenderer.setPalette(this.getDayPalette());
    }
  }

  getNightOverlay(sceneId) {
    if (!this.overlayCache.has(sceneId)) {
      // Generate darker overlay with moonlight effects
      const overlay = this.generateNightOverlay();
      this.overlayCache.set(sceneId, overlay);
    }
    return this.overlayCache.get(sceneId);
  }

  generateNightOverlay() {
    const overlay = new ImageData(320, 200);
    const data = overlay.data;

    for (let i = 0; i < data.length; i += 4) {
      // Apply blue-tinted darkness
      data[i] = 0; // R
      data[i + 1] = 0; // G
      data[i + 2] = 20; // B
      data[i + 3] = 180; // A (transparency)
    }

    return overlay;
  }
}
```

## 3. Sound and Music Generation Improvements

### 3.1 Priority-Based Sound System

Based on Sierra's sound handling, implement a priority system:

```javascript
class PrioritySoundManager extends SoundManager {
  constructor() {
    super();
    this.activeSounds = new Map();
    this.soundPriorities = {
      music: 1,
      ambient: 2,
      speech: 10, // Highest priority
      footsteps: 3,
      doors: 5,
      combat: 8,
      magic: 7,
      ui: 9,
    };
  }

  playSound(soundId, options = {}) {
    const priority = options.priority || this.getSoundPriority(soundId);

    // Check if we need to interrupt lower priority sounds
    if (this.activeSounds.size >= this.maxChannels) {
      const lowestPriority = this.findLowestPrioritySound();
      if (lowestPriority && lowestPriority.priority < priority) {
        this.stopSound(lowestPriority.id);
      } else if (lowestPriority && lowestPriority.priority >= priority) {
        // Don't play this sound
        return null;
      }
    }

    const sound = super.playSound(soundId, options);
    this.activeSounds.set(soundId, { sound, priority });

    return sound;
  }

  getSoundPriority(soundId) {
    // Determine priority based on sound type
    if (soundId.includes('music')) return this.soundPriorities.music;
    if (soundId.includes('footstep')) return this.soundPriorities.footsteps;
    if (soundId.includes('door')) return this.soundPriorities.doors;
    if (soundId.includes('speech')) return this.soundPriorities.speech;
    return 5; // Default medium priority
  }
}
```

### 3.2 Synchronized Sound Effects

From analyzing Iceman and SQ3, implement cue-based synchronization:

```javascript
class SynchronizedSound {
  constructor(soundManager) {
    this.soundManager = soundManager;
    this.cueHandlers = new Map();
  }

  playSynchronized(soundId, cuePoints) {
    const sound = this.soundManager.playSound(soundId);

    // Set up cue point handlers
    cuePoints.forEach((cue) => {
      const timer = setTimeout(() => {
        this.handleCue(cue);
      }, cue.time);

      this.cueHandlers.set(soundId, timer);
    });

    // Clean up on sound end
    sound.onended = () => {
      this.cleanup(soundId);
    };

    return sound;
  }

  handleCue(cue) {
    switch (cue.type) {
      case 'animation':
        // Trigger sprite animation
        this.gameManager.viewManager.triggerAnimation(
          cue.target,
          cue.animation
        );
        break;

      case 'state':
        // Change game state
        this.gameManager.gameState.setState(cue.state, cue.value);
        break;

      case 'effect':
        // Trigger visual effect
        this.gameManager.sceneRenderer.showEffect(cue.effect);
        break;

      case 'script':
        // Execute script function
        this.gameManager.scriptManager.execute(cue.script);
        break;
    }
  }

  // Example: Submarine dive sequence from Iceman
  playSubmarineDive() {
    const cuePoints = [
      { time: 0, type: 'state', state: 'diving', value: true },
      {
        time: 1000,
        type: 'animation',
        target: 'submarine',
        animation: 'dive_start',
      },
      { time: 3000, type: 'effect', effect: 'bubbles' },
      { time: 5000, type: 'state', state: 'depth', value: 50 },
      {
        time: 7000,
        type: 'animation',
        target: 'submarine',
        animation: 'dive_level',
      },
      { time: 8000, type: 'state', state: 'diving', value: false },
    ];

    this.playSynchronized('submarine_dive', cuePoints);
  }
}
```

### 3.3 Ambient Sound Layers

From ocean scenes in Iceman and space scenes in SQ3:

```javascript
class AmbientSoundscape {
  constructor(soundManager) {
    this.soundManager = soundManager;
    this.layers = new Map();
    this.activeScape = null;
  }

  defineScape(name, config) {
    this.scapes.set(name, {
      base: config.base, // Continuous background
      random: config.random || [], // Random occasional sounds
      conditional: config.conditional || [], // Condition-based sounds
    });
  }

  initializeScapes() {
    // From Iceman: Ocean soundscape
    this.defineScape('ocean', {
      base: {
        sound: 'ocean_waves',
        volume: 0.3,
        loop: true,
      },
      random: [
        { sound: 'seagull', probability: 0.1, minInterval: 10000 },
        { sound: 'ship_horn', probability: 0.05, minInterval: 30000 },
        { sound: 'splash', probability: 0.15, minInterval: 5000 },
      ],
      conditional: [
        {
          sound: 'submarine_ping',
          condition: () => this.gameState.depth > 100,
          interval: 5000,
        },
      ],
    });

    // From SQ3: Space soundscape
    this.defineScape('space', {
      base: {
        sound: 'space_ambience',
        volume: 0.2,
        loop: true,
      },
      random: [
        { sound: 'computer_beep', probability: 0.2, minInterval: 3000 },
        { sound: 'distant_engine', probability: 0.1, minInterval: 15000 },
      ],
      conditional: [
        {
          sound: 'alert_klaxon',
          condition: () => this.gameState.alert === true,
          interval: 2000,
        },
      ],
    });
  }

  startScape(name) {
    this.stopCurrentScape();

    const scape = this.scapes.get(name);
    if (!scape) return;

    // Start base layer
    const baseSound = this.soundManager.playSound(scape.base.sound, {
      volume: scape.base.volume,
      loop: scape.base.loop,
    });

    this.layers.set('base', baseSound);

    // Start random sound scheduler
    this.scheduleRandomSounds(scape.random);

    // Start conditional sound checker
    this.startConditionalChecker(scape.conditional);

    this.activeScape = name;
  }
}
```

## 4. Modern Web Enhancements

### 4.1 Resource Management System

```javascript
class SceneResourceManager {
  constructor() {
    this.cache = new Map();
    this.loadingQueue = [];
    this.preloadDistance = 2; // Preload scenes 2 rooms away
  }

  async loadScene(sceneId) {
    // Check cache first
    if (this.cache.has(sceneId)) {
      return this.cache.get(sceneId);
    }

    // Load scene manifest
    const manifest = await fetch(`/scenes/${sceneId}/manifest.json`).then((r) =>
      r.json()
    );

    // Load all resources in parallel
    const resources = await Promise.all([
      this.loadGraphics(manifest.graphics),
      this.loadSounds(manifest.sounds),
      this.loadScripts(manifest.scripts),
    ]);

    const scene = {
      id: sceneId,
      graphics: resources[0],
      sounds: resources[1],
      scripts: resources[2],
      manifest,
    };

    this.cache.set(sceneId, scene);

    // Predictive preloading
    this.preloadAdjacentScenes(manifest.exits);

    return scene;
  }

  preloadAdjacentScenes(exits) {
    // Preload connected rooms in background
    const preloadIds = Object.values(exits).filter(
      (id) => id && !this.cache.has(id)
    );

    preloadIds.forEach((id) => {
      if (!this.loadingQueue.includes(id)) {
        this.loadingQueue.push(id);
        // Load with low priority
        requestIdleCallback(() => this.loadScene(id));
      }
    });
  }

  // Memory management
  pruneCache(currentSceneId, maxDistance = 3) {
    const reachableScenes = this.findReachableScenes(
      currentSceneId,
      maxDistance
    );

    for (const [sceneId, scene] of this.cache) {
      if (!reachableScenes.has(sceneId)) {
        this.cache.delete(sceneId);
        // Clean up resources
        this.disposeSceneResources(scene);
      }
    }
  }
}
```

### 4.2 Web Worker Architecture

```javascript
// gameWorker.js
class GameLogicWorker {
  constructor() {
    this.gameState = new GameState();
    this.parser = new EnhancedParser();
    this.commandExecutor = new ContextualCommandExecutor();
    this.eventManager = new EventManager();

    this.initializeMessageHandlers();
  }

  initializeMessageHandlers() {
    self.onmessage = (e) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'INIT':
          this.initialize(payload);
          break;

        case 'COMMAND':
          this.processCommand(payload);
          break;

        case 'UPDATE':
          this.update(payload.deltaTime);
          break;

        case 'SAVE':
          this.saveGame(payload.slot);
          break;
      }
    };
  }

  async processCommand(input) {
    // Parse command
    const command = this.parser.parse(input);

    // Validate context
    const validation = this.commandExecutor.validateContext(command);
    if (!validation.valid) {
      this.postMessage({
        type: 'COMMAND_RESULT',
        payload: {
          success: false,
          message: validation.message,
        },
      });
      return;
    }

    // Execute command
    const result = await this.commandExecutor.execute(command);

    // Update render state
    this.sendRenderState();

    // Send command result
    this.postMessage({
      type: 'COMMAND_RESULT',
      payload: result,
    });
  }

  sendRenderState() {
    // Extract only what's needed for rendering
    const renderState = {
      room: this.gameState.currentRoom,
      sprites: this.extractSpriteData(),
      overlays: this.gameState.overlays,
      ui: {
        score: this.gameState.score,
        inventory: this.gameState.inventory.getVisible(),
      },
    };

    this.postMessage({
      type: 'RENDER_STATE',
      payload: renderState,
    });
  }
}

// Initialize worker
new GameLogicWorker();
```

### 4.3 Development Tools

```javascript
// Scene Editor (React component)
const SceneEditor = () => {
  const [scene, setScene] = useState(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [priorityView, setPriorityView] = useState(false);

  const tools = {
    select: SelectTool,
    line: LineTool,
    rect: RectangleTool,
    polygon: PolygonTool,
    fill: FillTool,
    priority: PriorityTool,
  };

  const CurrentTool = tools[selectedTool];

  return (
    <div className="scene-editor">
      <Toolbar>
        {Object.keys(tools).map((tool) => (
          <ToolButton
            key={tool}
            active={selectedTool === tool}
            onClick={() => setSelectedTool(tool)}
          >
            {tool}
          </ToolButton>
        ))}
      </Toolbar>

      <Canvas
        width={320}
        height={200}
        scale={3}
        onDraw={(ctx, coords) => CurrentTool.draw(ctx, coords, scene)}
        showPriority={priorityView}
      />

      <PropertiesPanel>
        <SceneProperties scene={scene} onChange={setScene} />
        <LayerList layers={scene?.layers} />
        <ExitEditor exits={scene?.exits} />
      </PropertiesPanel>

      <StatusBar>
        <Coordinates />
        <CurrentColor />
        <SaveButton onClick={() => exportScene(scene)} />
      </StatusBar>
    </div>
  );
};

// Hot reload for development
if (import.meta.hot) {
  import.meta.hot.accept('./scenes/', (newModule) => {
    // Reload current scene without losing state
    gameManager.reloadCurrentScene();
  });
}
```

## 5. Implementation Plan

### Phase 1: Parser Enhancement (Week 1)

1. **Day 1-2**: Implement SaidPattern class and pattern compiler
2. **Day 3-4**: Integrate multi-word verb support and vocabulary preprocessing
3. **Day 5**: Add context validation system
4. **Day 6-7**: Create comprehensive test suite with examples from Sierra games

### Phase 2: Graphics System (Week 2)

1. **Day 1-2**: Implement priority-based renderer
2. **Day 3-4**: Create state-based animation system
3. **Day 5**: Add day/night cycle support
4. **Day 6-7**: Optimize rendering performance and add debugging tools

### Phase 3: Sound Enhancement (Week 3)

1. **Day 1-2**: Implement priority-based sound system
2. **Day 3-4**: Add synchronized sound effects with cue points
3. **Day 5-6**: Create ambient soundscape system
4. **Day 7**: Integration testing with graphics system

### Phase 4: Modern Architecture (Week 4)

1. **Day 1-2**: Implement resource management with predictive loading
2. **Day 3-4**: Set up Web Worker architecture
3. **Day 5-7**: Create scene editor tool

### Phase 5: Integration and Polish (Week 5)

1. **Day 1-2**: Integrate all systems
2. **Day 3-4**: Performance optimization
3. **Day 5-6**: Create migration guide for existing content
4. **Day 7**: Documentation and examples

## Conclusion

By implementing these improvements inspired by Sierra's proven patterns while leveraging modern web technologies, Somnium can become a powerful, production-ready adventure game engine. The combination of sophisticated parsing, priority-based rendering, layered audio, and modern development tools will create an engine that honors the classic adventure game legacy while providing a superior development experience.

The most impactful improvements to prioritize are:

1. **Parser Enhancement**: The Said pattern system will dramatically improve input flexibility
2. **Priority Rendering**: Essential for proper visual depth and polish
3. **Web Worker Architecture**: Ensures smooth 60 FPS even during complex operations
4. **Scene Editor**: Dramatically speeds up content creation

These improvements transform Somnium from a technical demo into a professional game development platform ready for creating the next generation of adventure games.
