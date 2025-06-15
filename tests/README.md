# Somnium Test Suite

This directory contains the test suite for the Somnium game engine.

## Overview

The test suite uses Jest as the testing framework and provides comprehensive coverage of all major engine modules.

## Test Organization

Tests are organized by module, with each test file corresponding to a module in the `js/` directory:

### Core Engine Tests

- **gameState.test.js** - Game state management and validation
- **gameManager.test.js** - Main game loop and coordination
- **parser.test.js** - Natural language parser functionality
- **commandExecutor.test.js** - Command execution and game responses
- **eventManager.test.js** - Event system and scripting

### System Tests

- **inventory.test.js** - Inventory management with weight/size constraints
- **interactionSystem.test.js** - Object interaction mechanics
- **movementSystem.test.js** - Player and NPC movement
- **puzzleSystem.test.js** - Puzzle mechanics and hint system
- **NPCSystem.test.js** - NPC behavior, dialogue, and trading

### Graphics and Audio Tests

- **sceneRenderer.test.js** - Vector graphics rendering
- **viewManager.test.js** - Sprite animation system
- **SoundManager.test.js** - Sound synthesis and music generation
- **musicGeneration.test.js** - Procedural music composition

### Support Tests

- **GameProgression.test.js** - Scoring, achievements, and endings
- **placeholder.test.js** - Basic test suite verification

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Run a specific test file

```bash
npm test -- tests/parser.test.js
```

### Run tests matching a pattern

```bash
npm test -- --testNamePattern="should parse"
```

## Writing Tests

### Test Structure

Each test file follows this general structure:

```javascript
import { ModuleName } from '../js/ModuleName.js';

describe('ModuleName', () => {
  let instance;
  let mockDependency;

  beforeEach(() => {
    // Set up mocks and test instance
    mockDependency = {
      method: jest.fn(),
    };
    instance = new ModuleName(mockDependency);
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = instance.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, specific test names that describe the behavior being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
3. **Mock External Dependencies**: Use Jest mocks for external modules and services
4. **Test Edge Cases**: Include tests for error conditions, empty inputs, and boundary values
5. **Keep Tests Independent**: Each test should run independently without relying on others

### Common Test Patterns

#### Testing Async Functions

```javascript
it('should handle async operations', async () => {
  const result = await instance.asyncMethod();
  expect(result).toBe('expected');
});
```

#### Testing Event Emitters

```javascript
it('should emit events', () => {
  const listener = jest.fn();
  instance.on('event', listener);

  instance.triggerEvent();

  expect(listener).toHaveBeenCalledWith(expectedData);
});
```

#### Testing Error Handling

```javascript
it('should throw error for invalid input', () => {
  expect(() => instance.method(null)).toThrow('Invalid input');
});
```

## Test Coverage

Current test statistics:

- **Total Tests**: 444 tests (100% passing rate)
- **Overall Coverage**: 61.64%
- **Core Module Coverage**:
  - Parser: 87.37%
  - NPCSystem: 81.19%
  - InteractionSystem: 79.87%
  - PuzzleSystem: 71.42%
  - Other modules: Varying coverage levels

To view detailed coverage report:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

Tests are automatically run on:

- Every push to the repository
- All pull requests
- Before releases

The CI pipeline includes:

- Running all tests
- Checking code coverage thresholds
- Linting and formatting verification

## Troubleshooting

### Common Issues

#### Module not found errors

Ensure all imports use the correct relative paths:

```javascript
// Correct
import { Module } from '../js/Module.js';

// Incorrect
import { Module } from './Module.js';
```

#### Timeout errors

For tests that take longer, increase the timeout:

```javascript
it('should complete long operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

#### Mock not working

Ensure mocks are properly reset between tests:

```javascript
afterEach(() => {
  jest.clearAllMocks();
});
```

## Contributing

When adding new features:

1. Write tests first (TDD approach encouraged)
2. Ensure all existing tests still pass
3. Add tests for edge cases and error conditions
4. Update this README if adding new test patterns

## Test Data

The `tests/` directory may include test fixtures and mock data:

- Mock game worlds for parser testing
- Sample save files for load/save testing
- Test graphics data for rendering tests

Keep test data minimal and focused on the specific test requirements.
