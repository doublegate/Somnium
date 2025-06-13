# CI Setup Documentation

## Overview

This document explains how Prettier and ESLint are configured to work together without conflicts in the Somnium project.

## Configuration

### Prettier Configuration (`.prettierrc.json`)

Prettier handles all code formatting with these rules:
- Semicolons: Always required
- Single quotes for strings
- Trailing commas in ES5-compatible places
- 80 character line width
- 2 space indentation
- Arrow function parentheses always included
- LF line endings

### ESLint Configuration (`eslint.config.js`)

ESLint is configured to:
1. Use `eslint-plugin-prettier` to run Prettier as an ESLint rule
2. Import `eslint-config-prettier` to disable all formatting rules
3. Focus only on code quality rules (unused variables, console statements, etc.)

### Integration Strategy

1. **Prettier runs first** - Handles all formatting decisions
2. **ESLint runs second** - Checks code quality and ensures Prettier was run
3. **No conflicts** - ESLint's formatting rules are disabled

## NPM Scripts

```bash
# Format code with Prettier
npm run format

# Check formatting without fixing
npm run format:check

# Run ESLint (includes Prettier check)
npm run lint

# Fix ESLint issues (runs Prettier automatically)
npm run lint:fix

# Combined commands
npm run fix      # format + lint:fix
npm run check    # format:check + lint
npm run validate # check + test
```

## CI Workflow

The GitHub Actions CI workflow (`ci.yml`) runs these checks in order:

1. **Check Prettier formatting** - Ensures code is properly formatted
2. **Run ESLint with Prettier integration** - Checks code quality
3. **Run combined validation** - Runs all checks together

This ensures that:
- Code formatting is consistent across the project
- Code quality issues are caught early
- No formatting conflicts occur between tools

## Local Development

When developing locally:

1. Run `npm run fix` before committing to auto-fix all issues
2. The pre-commit hook will also run these checks automatically
3. If CI fails, run `npm run fix` locally and push the changes

## Troubleshooting

### "Delete `⏎`" errors
These are Prettier formatting issues. Run `npm run format` to fix.

### "Unexpected console statement" warnings
These are ESLint warnings for console.log statements. They're acceptable during development but should be removed or converted to proper logging before production.

### Conflicts between tools
If you see formatting being changed back and forth:
1. Ensure you have the latest `.prettierrc.json` and `eslint.config.js`
2. Run `npm install` to get the latest versions of the tools
3. Use `npm run fix` instead of running tools separately