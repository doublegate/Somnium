# Somnium Testing Guide

## Overview

This guide provides comprehensive testing strategies for Somnium, ensuring reliability, performance, and authentic gameplay experience.

## Test Categories

### 1. Unit Tests

Test individual modules in isolation.

#### Parser Tests

```javascript
// test/parser.test.js
describe('Parser', () => {
  test('parses simple verb-noun commands', () => {
    const parser = new Parser(vocabulary);
    expect(parser.parse('take key')).toEqual({
      verb: 'take',
      directObject: 'key',
    });
  });

  test('handles synonyms', () => {
    const parser = new Parser(vocabulary);
    expect(parser.parse('get brass key')).toEqual({
      verb: 'take', // canonical form
      directObject: 'brass_key',
    });
  });

  test('parses complex commands', () => {
    const parser = new Parser(vocabulary);
    expect(parser.parse('use key on door')).toEqual({
      verb: 'use',
      directObject: 'key',
      preposition: 'on',
      indirectObject: 'door',
    });
  });

  test('handles pronouns', () => {
    const parser = new Parser(vocabulary);
    parser.setContext({ lastNoun: 'dragon' });
    expect(parser.parse('look at it')).toEqual({
      verb: 'look',
      preposition: 'at',
      directObject: 'dragon',
    });
  });
});
```

#### GameState Tests

```javascript
describe('GameState', () => {
  test('manages inventory correctly', () => {
    const state = new GameState();
    state.addItem('key');
    expect(state.hasItem('key')).toBe(true);
    expect(state.getInventory()).toContain('key');

    state.removeItem('key');
    expect(state.hasItem('key')).toBe(false);
  });

  test('tracks flags', () => {
    const state = new GameState();
    state.setFlag('door_open', true);
    expect(state.getFlag('door_open')).toBe(true);
  });

  test('serializes and deserializes', () => {
    const state = new GameState();
    state.loadResources(testGameJSON);
    state.addItem('key');
    state.setFlag('puzzle_solved', true);

    const saved = state.serialize();
    const newState = new GameState();
    newState.loadResources(testGameJSON);
    newState.deserialize(saved);

    expect(newState.hasItem('key')).toBe(true);
    expect(newState.getFlag('puzzle_solved')).toBe(true);
  });
});
```

#### SceneRenderer Tests

```javascript
describe('SceneRenderer', () => {
  test('validates EGA colors', () => {
    const renderer = new SceneRenderer(mockCanvas);
    expect(() => renderer.validateColor('#0000AA')).not.toThrow();
    expect(() => renderer.validateColor('#123456')).toThrow();
  });

  test('calculates priority correctly', () => {
    const renderer = new SceneRenderer(mockCanvas);
    expect(renderer.getPixelPriority(160, 10)).toBe(1); // Top
    expect(renderer.getPixelPriority(160, 190)).toBe(14); // Bottom
  });
});
```

### 2. Integration Tests

Test module interactions.

#### World Generation Tests

```javascript
describe('World Generation', () => {
  test('generates valid game world', async () => {
    const aiManager = new AIManager(config);
    const gameJSON = await aiManager.generateWorld('space station');

    expect(gameJSON).toHaveProperty('plot');
    expect(gameJSON).toHaveProperty('rooms');
    expect(gameJSON.rooms.length).toBeGreaterThan(5);

    // Validate all room exits point to valid rooms
    const roomIds = gameJSON.rooms.map((r) => r.id);
    gameJSON.rooms.forEach((room) => {
      Object.values(room.exits).forEach((exit) => {
        if (exit) expect(roomIds).toContain(exit);
      });
    });
  });

  test('ensures puzzle solvability', async () => {
    const gameJSON = await aiManager.generateWorld();
    const validator = new PuzzleValidator(gameJSON);

    expect(validator.areAllPuzzlesSolvable()).toBe(true);
    expect(validator.areAllItemsReachable()).toBe(true);
  });
});
```

#### Command Execution Tests

```javascript
describe('Command Execution', () => {
  test('executes scripted events', async () => {
    const gameState = new GameState();
    gameState.loadResources(testGameJSON);
    const eventManager = new EventManager(gameState);

    await eventManager.executeCommand({
      verb: 'unlock',
      directObject: 'door',
      indirectObject: 'key',
    });

    expect(gameState.getFlag('door_unlocked')).toBe(true);
  });

  test('handles dynamic LLM responses', async () => {
    const mockAIManager = {
      getDynamicResponse: jest
        .fn()
        .mockResolvedValue('The dragon snorts dismissively at your question.'),
    };

    const eventManager = new EventManager(gameState, mockAIManager);
    const result = await eventManager.executeCommand({
      verb: 'ask',
      directObject: 'dragon',
      indirectObject: 'weather',
    });

    expect(mockAIManager.getDynamicResponse).toHaveBeenCalled();
  });
});
```

### 3. Visual Regression Tests

Ensure graphics render correctly.

```javascript
describe('Visual Rendering', () => {
  test('renders room consistently', async () => {
    const renderer = new SceneRenderer(canvas);
    renderer.renderRoom(testRoom.graphics);

    const imageData = canvas.toDataURL();
    expect(imageData).toMatchImageSnapshot();
  });

  test('dithering pattern is correct', () => {
    const renderer = new SceneRenderer(canvas);
    renderer.drawDitheredGradient(0, 0, 4, 4, '#0000AA', '#00AA00');

    const ctx = canvas.getContext('2d');
    const pixels = ctx.getImageData(0, 0, 4, 4);

    // Check checkerboard pattern
    expect(getPixelColor(pixels, 0, 0)).toBe('#0000AA');
    expect(getPixelColor(pixels, 1, 0)).toBe('#00AA00');
    expect(getPixelColor(pixels, 0, 1)).toBe('#00AA00');
    expect(getPixelColor(pixels, 1, 1)).toBe('#0000AA');
  });
});
```

### 4. Performance Tests

Ensure smooth gameplay.

```javascript
describe('Performance', () => {
  test('maintains 60 FPS during gameplay', async () => {
    const gameManager = new GameManager(canvas, config);
    await gameManager.loadGame(testSave);

    const frameTimings = [];
    let lastTime = performance.now();

    // Measure 100 frames
    for (let i = 0; i < 100; i++) {
      await animationFrame();
      const now = performance.now();
      frameTimings.push(now - lastTime);
      lastTime = now;
    }

    const avgFrameTime = average(frameTimings);
    expect(avgFrameTime).toBeLessThan(17); // 60 FPS = 16.67ms
  });

  test('handles large game worlds', async () => {
    const largeWorld = generateLargeTestWorld(50); // 50 rooms
    const state = new GameState();

    const startTime = performance.now();
    state.loadResources(largeWorld);
    const loadTime = performance.now() - startTime;

    expect(loadTime).toBeLessThan(100); // Should load in < 100ms
  });
});
```

### 5. Browser Compatibility Tests

Test across different browsers.

```javascript
// Run with Selenium or Playwright
describe('Browser Compatibility', () => {
  const browsers = ['chrome', 'firefox', 'safari', 'edge'];

  browsers.forEach((browser) => {
    test(`works in ${browser}`, async () => {
      const driver = await createDriver(browser);
      await driver.get('http://localhost:8000');

      // Wait for game to load
      await driver.wait(until.elementLocated(By.id('gameCanvas')));

      // Test basic interaction
      await driver.executeScript(`
        window.gameManager.startNewGame('test');
      `);

      // Verify canvas rendered
      const canvasData = await driver.executeScript(`
        return document.getElementById('gameCanvas')
          .toDataURL().length;
      `);

      expect(canvasData).toBeGreaterThan(1000);
      await driver.quit();
    });
  });
});
```

### 6. Content Moderation Tests

Ensure safety features work.

```javascript
describe('Content Moderation', () => {
  test('filters inappropriate content', async () => {
    const aiManager = new AIManager(config);

    const result = await aiManager.checkContent(
      'This contains inappropriate content...'
    );

    expect(result.safe).toBe(false);
    expect(result.reason).toBeDefined();
  });

  test('allows safe content', async () => {
    const result = await aiManager.checkContent('You see a beautiful garden.');

    expect(result.safe).toBe(true);
  });
});
```

### 7. Save/Load Tests

Ensure game state persistence.

```javascript
describe('Save/Load System', () => {
  test('preserves complete game state', async () => {
    const gameManager = new GameManager(canvas, config);
    await gameManager.startNewGame('castle');

    // Play a bit
    gameManager.executeCommand('take sword');
    gameManager.executeCommand('go north');

    // Save
    const saveData = gameManager.saveGame();

    // Start fresh and load
    const newGameManager = new GameManager(canvas, config);
    await newGameManager.loadGame(saveData);

    // Verify state
    expect(newGameManager.gameState.hasItem('sword')).toBe(true);
    expect(newGameManager.gameState.getCurrentRoom().id).toBe(
      saveData.state.currentRoom
    );
  });

  test('handles version mismatch', () => {
    const oldSave = { version: 0, ...testSave };
    const gameManager = new GameManager(canvas, config);

    expect(() => gameManager.loadGame(oldSave)).toThrow(
      'Save file version not supported'
    );
  });
});
```

## Test Data

### Sample Test World

```javascript
const testGameJSON = {
  plot: {
    title: 'Test Adventure',
    backstory: 'A test world for unit tests.',
    goal: 'Reach the end room.',
  },
  rooms: [
    {
      id: 'start',
      name: 'Starting Room',
      description: 'A simple test room.',
      exits: { north: 'end' },
      items: ['test_key'],
      objects: ['test_door'],
      sound: {
        music_theme: 'simple melody',
        ambience: 'silence',
      },
      graphics: {
        backgroundColor: '#0000AA',
        primitives: [
          {
            type: 'rect',
            color: '#00AA00',
            dims: [0, 100, 320, 100],
          },
        ],
      },
    },
  ],
  items: [
    {
      id: 'test_key',
      name: 'test key',
      description: 'A simple test key.',
    },
  ],
  puzzles: [
    {
      id: 'test_puzzle',
      description: 'Test puzzle',
      obstacle: 'The door is locked.',
      solution: {
        verb: 'unlock',
        item: 'test_key',
        target: 'test_door',
      },
      reward_text: 'The door opens.',
      unlocks: {
        type: 'ENABLE_EXIT',
        roomId: 'start',
        exit: 'north',
      },
    },
  ],
};
```

## Automated Test Runner

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:visual": "jest --testMatch='**/*.visual.test.js'",
    "test:perf": "jest --testMatch='**/*.perf.test.js'",
    "test:e2e": "playwright test"
  }
}
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

## Manual Test Checklist

### Pre-Release Testing

- [ ] Generate 10 different themed adventures
- [ ] Complete at least 3 full adventures
- [ ] Test all menu options
- [ ] Test save/load with 10+ saves
- [ ] Test all error conditions
- [ ] Test with slow network
- [ ] Test on mobile browsers
- [ ] Test with screen readers
- [ ] Test keyboard-only navigation
- [ ] Memory leak testing (play for 1 hour)

### Regression Test Scenarios

1. The "locked door" scenario
2. The "inventory full" scenario
3. The "invalid command spam" scenario
4. The "rapid room changes" scenario
5. The "save during animation" scenario

## Performance Benchmarks

Target metrics:

- World generation: < 5 seconds
- Room rendering: < 16ms
- Command processing: < 100ms
- Save file generation: < 500ms
- Memory usage: < 100MB after 1 hour
