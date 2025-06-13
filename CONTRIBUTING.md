# Contributing to Somnium

Thank you for your interest in contributing to Somnium! We're excited to have you join us in creating unique AI-driven adventures. This document provides guidelines for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How to Contribute](#how-to-contribute)
4. [Development Process](#development-process)
5. [Style Guidelines](#style-guidelines)
6. [Testing](#testing)
7. [Submitting Changes](#submitting-changes)
8. [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be Respectful**: Treat all contributors with respect and courtesy
- **Be Inclusive**: Welcome contributors from all backgrounds
- **Be Constructive**: Provide helpful feedback and accept criticism gracefully
- **Be Professional**: Keep discussions focused on the project

## Getting Started

1. **Fork the Repository**: Click the "Fork" button on GitHub
2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Somnium.git
   cd Somnium
   ```
3. **Add Upstream Remote**:
   ```bash
   git remote add upstream https://github.com/doublegate/Somnium.git
   ```
4. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Set Up Development Environment**: Follow the instructions in the [README](README.md)

## How to Contribute

### Areas We Need Help

- **Parser Development**: Implementing natural language processing for Phase 3
- **Game Logic**: Building event systems and scripting engine
- **AI Integration**: Connecting LLM services for dynamic content generation
- **Testing**: Expanding test coverage for all Phase 2 systems
- **Cross-browser Compatibility**: Testing on different browsers and devices
- **Documentation**: Improving user guides and API documentation
- **Accessibility**: Making the game more accessible

### Types of Contributions

1. **Bug Fixes**: Fix issues reported in GitHub Issues
2. **Features**: Implement new functionality from the roadmap
3. **Documentation**: Improve or add documentation
4. **Tests**: Add test coverage for existing code
5. **Performance**: Optimize rendering or game logic
6. **Refactoring**: Improve code quality and structure

## Development Process

### 1. Check Existing Work

- Review [Issues](https://github.com/doublegate/Somnium/issues) to avoid duplicating effort
- Check the [implementation roadmap](docs/implementation-roadmap.md)
- Look at open [Pull Requests](https://github.com/doublegate/Somnium/pulls)

### 2. Discuss Major Changes

For significant changes:

- Open an issue describing your proposal
- Wait for feedback before starting work
- This helps ensure your effort aligns with project goals

### 3. Follow the Architecture

- Read the [architecture overview](docs/architecture-overview.md)
- Maintain module boundaries and interfaces
- Follow existing patterns (see [common patterns](docs/common-patterns.md))

### 4. Write Clean Code

- Keep functions small and focused
- Add JSDoc comments for public APIs
- Use meaningful variable names
- Handle errors appropriately

## Style Guidelines

### JavaScript Style

```javascript
// Use ES6+ features
const myFunction = (param) => {
  // 2-space indentation
  if (condition) {
    return true;
  }

  // Meaningful variable names
  const playerInventory = gameState.getInventory();

  // Use === for comparisons
  if (item.id === 'brass_key') {
    // ...
  }
};

// JSDoc for public functions
/**
 * Parse player input into structured command
 * @param {string} input - Raw player input
 * @returns {ParsedCommand|null} Parsed command or null if invalid
 */
function parseCommand(input) {
  // Implementation
}

// Class naming
class SceneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }
}
```

### File Organization

- One module per file
- Name files after their primary export
- Group related files in directories
- Keep test files alongside source files

### Commit Messages

Follow conventional commit format:

```
type(scope): brief description

Longer explanation if needed.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat(parser): add support for pronouns`
- `fix(renderer): correct dithering pattern alignment`
- `docs: update API reference for GameState`

## Testing

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

### Writing Tests

- Write tests for all new functionality
- Place test files next to source files: `Parser.test.js`
- Use descriptive test names
- Test edge cases and error conditions

Example:

```javascript
describe('Parser', () => {
  test('parses simple verb-noun commands', () => {
    const parser = new Parser(vocabulary);
    const result = parser.parse('take key');

    expect(result).toEqual({
      verb: 'take',
      directObject: 'key',
    });
  });

  test('returns null for invalid input', () => {
    const parser = new Parser(vocabulary);
    expect(parser.parse('xyzzy')).toBeNull();
  });
});
```

### Manual Testing

- Test your changes in multiple browsers
- Try edge cases and unusual inputs
- Verify no regressions in existing functionality
- Check performance impact

## Submitting Changes

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Run Tests

Ensure all tests pass before submitting:

```bash
npm test
npm run lint
```

### 3. Push Changes

```bash
git push origin feature/your-feature-name
```

### 4. Create Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Provide a clear title and description
- Reference any related issues
- Include screenshots for UI changes

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing

- [ ] All tests pass
- [ ] Added new tests
- [ ] Manually tested in Chrome/Firefox/Safari

## Screenshots (if applicable)

[Add screenshots here]

## Related Issues

Fixes #123
```

### 5. Code Review

- Respond to feedback constructively
- Make requested changes promptly
- Ask questions if requirements are unclear
- Be patient - reviews ensure code quality

## Reporting Issues

### Before Creating an Issue

- Search existing issues to avoid duplicates
- Try to reproduce the problem
- Gather relevant information

### Issue Template

```markdown
## Description

Clear description of the issue

## Steps to Reproduce

1. Go to...
2. Type...
3. See error...

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- Browser: Chrome 96
- OS: Windows 10
- Somnium Version: 0.1.0

## Screenshots

[If applicable]

## Additional Context

Any other relevant information
```

### Security Issues

For security vulnerabilities, please see [SECURITY.md](SECURITY.md) for responsible disclosure procedures.

## Recognition

Contributors will be added to [CONTRIBUTORS.md](CONTRIBUTORS.md) and acknowledged in release notes.

## Questions?

- Check the [documentation](docs/)
- Ask in [GitHub Discussions](https://github.com/doublegate/Somnium/discussions)
- Reach out to maintainers

Thank you for helping make Somnium better! Every contribution, no matter how small, helps create more unique adventures for players to enjoy.
