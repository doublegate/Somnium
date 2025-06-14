/**
 * Tests for Game Loop functionality
 */

describe('GameManager - Game Loop', () => {
  let GameManager;
  let gameManager;
  let mockCanvas;
  let mockConfig;

  beforeEach(() => {
    // Mock canvas
    mockCanvas = {
      width: 320,
      height: 200,
      getContext: jest.fn(() => ({
        fillStyle: '',
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
      })),
    };

    // Mock config
    mockConfig = {
      apiKey: 'test-key',
      apiEndpoint: 'https://test.api',
      debugMode: true,
    };

    // Mock modules
    jest.mock('../js/AIManager.js', () => ({
      AIManager: jest.fn().mockImplementation(() => ({
        generateWorld: jest.fn().mockResolvedValue({ rooms: [], objects: [] }),
      })),
    }));

    jest.mock('../js/GameState.js', () => ({
      GameState: jest.fn().mockImplementation(() => ({
        loadResources: jest.fn(),
        getCurrentRoom: jest.fn().mockReturnValue({ graphics: {} }),
        serialize: jest.fn().mockReturnValue({}),
        gameJSON: {},
      })),
    }));

    jest.mock('../js/SceneRenderer.js', () => ({
      SceneRenderer: jest.fn().mockImplementation(() => ({
        clear: jest.fn(),
        renderRoom: jest.fn(),
        ctx: mockCanvas.getContext(),
      })),
    }));

    jest.mock('../js/ViewManager.js', () => ({
      ViewManager: jest.fn().mockImplementation(() => ({
        updateAnimations: jest.fn(),
        updatePositions: jest.fn(),
        renderAll: jest.fn(),
      })),
    }));

    jest.mock('../js/SoundManager.js', () => ({
      SoundManager: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(),
        update: jest.fn(),
        pauseAll: jest.fn(),
        resumeAll: jest.fn(),
        stopAll: jest.fn(),
      })),
    }));

    jest.mock('../js/Parser.js', () => ({
      Parser: jest.fn().mockImplementation(() => ({
        setContext: jest.fn(),
        parse: jest.fn(),
      })),
    }));

    jest.mock('../js/EventManager.js', () => ({
      EventManager: jest.fn().mockImplementation(() => ({
        updateScheduledEvents: jest.fn(),
        executeCommand: jest.fn(),
      })),
    }));

    // Import GameManager after mocks are set up
    GameManager = require('../js/GameManager.js').GameManager;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('should initialize with correct default values', () => {
    gameManager = new GameManager(mockCanvas, mockConfig);

    expect(gameManager.isRunning).toBe(false);
    expect(gameManager.isPaused).toBe(false);
    expect(gameManager.gameSpeed).toBe(3); // Normal speed
    expect(gameManager.fixedTimeStep).toBe(1 / 60); // 60 FPS
    expect(gameManager.currentFPS).toBe(60);
  });

  test('should start game loop when startNewGame is called', async () => {
    gameManager = new GameManager(mockCanvas, mockConfig);

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn();

    await gameManager.startNewGame('test theme');

    expect(gameManager.isRunning).toBe(true);
    expect(gameManager.isPaused).toBe(false);
    expect(global.requestAnimationFrame).toHaveBeenCalledWith(
      gameManager.gameLoop
    );
  });

  test('should pause and resume game correctly', () => {
    gameManager = new GameManager(mockCanvas, mockConfig);
    gameManager.isRunning = true;

    // Pause game
    gameManager.pauseGame();
    expect(gameManager.isPaused).toBe(true);
    expect(gameManager.soundManager.pauseAll).toHaveBeenCalled();

    // Resume game
    global.requestAnimationFrame = jest.fn();
    gameManager.resumeGame();
    expect(gameManager.isPaused).toBe(false);
    expect(gameManager.soundManager.resumeAll).toHaveBeenCalled();
    expect(global.requestAnimationFrame).toHaveBeenCalledWith(
      gameManager.gameLoop
    );
  });

  test('should handle fixed timestep updates correctly', () => {
    gameManager = new GameManager(mockCanvas, mockConfig);
    gameManager.isRunning = true;
    gameManager.lastFrameTime = 1000;

    // Simulate frame with enough accumulated time for 2 fixed updates
    const currentTime = 1000 + 1000 / 29; // ~34.5ms later (ensure > 2 * 16.67ms)
    gameManager.gameLoop(currentTime);

    // Should have called fixedUpdate twice (2 x 16.67ms)
    expect(
      gameManager.eventManager.updateScheduledEvents
    ).toHaveBeenCalledTimes(2);
    expect(gameManager.viewManager.updatePositions).toHaveBeenCalledTimes(2);
  });

  test('should cap delta time to prevent spiral of death', () => {
    gameManager = new GameManager(mockCanvas, mockConfig);
    gameManager.isRunning = true;
    gameManager.lastFrameTime = 1000;

    // Simulate a very long frame (200ms)
    const currentTime = 1200;
    gameManager.gameLoop(currentTime);

    // Delta should be capped at maxDeltaTime (100ms)
    expect(gameManager.deltaTime).toBe(0.1); // 100ms in seconds
  });

  test('should update FPS counter correctly', () => {
    gameManager = new GameManager(mockCanvas, mockConfig);

    // Mock window.dispatchEvent
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    // Initialize FPS time
    gameManager.fpsTime = 0;
    gameManager.frameCount = 0;

    // Simulate 59 frames under 1 second
    for (let i = 0; i < 59; i++) {
      gameManager.updateFPS(i * 16.67);
    }

    // After exactly 1 second, should dispatch FPS event (60th frame)
    gameManager.updateFPS(1000);

    // Check that event was dispatched with correct structure
    expect(dispatchEventSpy).toHaveBeenCalled();
    const lastCall =
      dispatchEventSpy.mock.calls[dispatchEventSpy.mock.calls.length - 1][0];
    expect(lastCall.type).toBe('game-fps');
    expect(lastCall.detail.fps).toBe(60);
  });

  test('should handle different game speeds', () => {
    gameManager = new GameManager(mockCanvas, mockConfig);
    gameManager.isRunning = true;
    gameManager.lastFrameTime = 1000;
    gameManager.accumulator = 0; // Start with clean accumulator

    // Set to fastest speed (5)
    gameManager.setSpeed(5);
    expect(gameManager.gameSpeed).toBe(5);

    // Simulate frame
    const currentTime = 1016.67; // One frame later
    gameManager.gameLoop(currentTime);

    // Check that speed multiplier was applied
    const baseDelta = 0.01667; // 16.67ms frame in seconds
    const expectedMultiplier = 5 / 3; // Speed 5 divided by normal speed 3
    const expectedAdjustedDelta = baseDelta * expectedMultiplier;
    // Account for fixed update consumption: accumulator = adjustedDelta - fixedTimeStep
    const expectedAccumulator =
      expectedAdjustedDelta - gameManager.fixedTimeStep;

    // Accumulator should have the adjusted delta minus one fixed timestep
    expect(gameManager.accumulator).toBeCloseTo(expectedAccumulator, 4);
  });

  test('should render with interpolation', () => {
    gameManager = new GameManager(mockCanvas, mockConfig);
    gameManager.isRunning = true;
    gameManager.lastFrameTime = 1000;
    // Pre-calculate to get exactly 0.5 interpolation after frame processing
    const frameDelta = 8.33; // Half frame in ms
    const adjustedDelta = frameDelta / 1000; // Convert to seconds
    gameManager.accumulator = gameManager.fixedTimeStep * 0.5 - adjustedDelta;

    // Simulate frame
    const currentTime = 1000 + frameDelta;
    gameManager.gameLoop(currentTime);

    // Should render with interpolation value of ~0.5
    expect(gameManager.viewManager.renderAll).toHaveBeenCalledWith(
      expect.closeTo(0.5, 1)
    );
  });
});
