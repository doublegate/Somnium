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

**Frontend (Game Engine)**:
- **Advanced Features**: Voice commands, mobile responsive UI, VR/AR support
- **World Templates**: Creating new pre-built world templates
- **Accessibility**: Improving ARIA labels, keyboard navigation, screen reader support
- **Cross-browser Compatibility**: Testing on different browsers and devices
- **Performance**: Optimizing rendering loop, reducing memory usage

**Backend (v2.0 Servers)**:
- **Multiplayer Features**: Spectator mode, tournament system, advanced matchmaking
- **Cloud Features**: Database migration (file storage → PostgreSQL), Redis caching
- **API Development**: New endpoints, rate limiting improvements, WebSocket scaling
- **Security**: Authentication improvements, input validation, security audits
- **Performance**: Load testing, optimization, horizontal scaling

**Content Creation**:
- **Test Worlds**: Designing new demo adventures with puzzles and NPCs
- **Tutorial Worlds**: Creating educational worlds for new players
- **World Templates**: Building reusable templates for different genres

**Documentation & Community**:
- **User Guides**: Writing tutorials, FAQs, troubleshooting guides
- **API Documentation**: Documenting endpoints, WebSocket events, data formats
- **Video Content**: Creating walkthroughs, tutorials, developer guides
- **Localization**: Translating UI and documentation to other languages

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

### Unit Testing (Jest)

**Running Unit Tests**:

```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

**Writing Unit Tests**:

- Write tests for all new functionality
- Place test files in `tests/` directory
- Use descriptive test names
- Test edge cases and error conditions
- Aim for 70%+ code coverage

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

### End-to-End Testing (Playwright)

**Running E2E Tests**:

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run specific test file
npx playwright test tests/e2e/game.spec.js
```

**Writing E2E Tests**:

- Place tests in `tests/e2e/` directory
- Test full user workflows
- Include accessibility checks
- Test across multiple browsers

Example:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Game Loading', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Somnium/);

    // Check canvas rendered
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });
});
```

### Backend Testing

**Server Tests**:

```bash
cd server
npm test
```

**Manual API Testing**:

```bash
# Test API endpoints
curl http://localhost:3000/api/health

# Test WebSocket
wscat -c ws://localhost:8080
```

### Manual Testing Checklist

- [ ] Test in Chrome, Firefox, and Safari
- [ ] Test on mobile devices (iOS and Android)
- [ ] Try edge cases and unusual inputs
- [ ] Verify no regressions in existing functionality
- [ ] Check performance impact (FPS, memory usage)
- [ ] Test with screen reader (accessibility)
- [ ] Test keyboard navigation
- [ ] Verify console has no errors

## Backend Development (v2.0)

### Setting Up Backend Environment

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your configuration
nano .env

# Generate secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Start servers
npm run start:all
```

### Backend Project Structure

```
server/
├── api-server.js           # Express REST API
├── multiplayer-server.js   # WebSocket server
├── package.json            # Dependencies
├── .env.example            # Environment template
├── .env                    # Your config (gitignored)
├── storage/                # File storage
│   ├── users/             # User data
│   ├── saves/             # Cloud saves
│   └── shared/            # Shared worlds
└── logs/                  # Server logs
```

### Adding New API Endpoints

1. **Define Route** in `api-server.js`:

```javascript
// GET /api/stats
app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const stats = await getPlayerStats(req.userId);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
```

2. **Add Authentication** if needed:
   - Use `authenticate` middleware for protected routes
   - JWT token in `Authorization: Bearer <token>` header

3. **Handle Errors** properly:
   - Catch all errors
   - Return appropriate HTTP status codes
   - Log errors for debugging

4. **Document the Endpoint**:
   - Add to API documentation
   - Include request/response examples
   - Note authentication requirements

### Adding WebSocket Events

1. **Define Handler** in `multiplayer-server.js`:

```javascript
handleCustomEvent(ws, message) {
  const client = this.clients.get(ws);
  if (!client || !client.sessionId) return;

  const session = this.sessions.get(client.sessionId);
  if (!session) return;

  // Handle event
  // ...

  // Broadcast to session
  this.broadcastToSession(client.sessionId, {
    type: 'custom_event_response',
    data: responseData,
  });
}
```

2. **Add to Message Router**:

```javascript
switch (type) {
  // ... existing cases
  case 'custom_event':
    this.handleCustomEvent(ws, message);
    break;
}
```

3. **Update Client** (`js/MultiplayerManager.js`):

```javascript
sendCustomEvent(data) {
  this.send({
    type: 'custom_event',
    data: data,
  });
}
```

### Backend Best Practices

- **Security First**: Never trust client input, validate everything
- **Error Handling**: Catch errors, log them, return user-friendly messages
- **Rate Limiting**: Protect endpoints from abuse
- **Input Validation**: Sanitize and validate all user input
- **Authentication**: Use JWT tokens, never plain passwords
- **Logging**: Log important events, errors, and security issues
- **Performance**: Optimize database queries, cache when appropriate

### Deployment Testing

Before submitting backend changes:

```bash
# Run in production mode
NODE_ENV=production npm start

# Test API endpoints
curl http://localhost:3000/api/health
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/saves

# Test WebSocket connection
wscat -c ws://localhost:8080

# Check logs for errors
tail -f logs/server.log
```

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
