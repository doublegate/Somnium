/**
 * E2E Tests for Somnium Game
 */

const { test, expect } = require('@playwright/test');

test.describe('Game Loading', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Somnium/);
  });

  test('should display menu bar', async ({ page }) => {
    await page.goto('/');
    const menuBar = page.locator('#menu-bar');
    await expect(menuBar).toBeVisible();
  });

  test('should have game canvas', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('Menu Interactions', () => {
  test('should open File menu', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-menu="file"]');
    await expect(page.locator('#dropdown-menus')).toContainText('New Game');
  });

  test('should open About modal', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-menu="help"]');
    await page.click('button:has-text("About")');
    const modal = page.locator('#about-modal');
    await expect(modal).not.toHaveClass(/hidden/);
  });
});

test.describe('Game Start', () => {
  test('should start a new game', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-menu="file"]');
    await page.click('button:has-text("New Game")');

    // Should show theme input modal
    const themeModal = page.locator('#theme-modal');
    await expect(themeModal).not.toHaveClass(/hidden/);
  });

  test('should accept theme input', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-menu="file"]');
    await page.click('button:has-text("New Game")');

    await page.fill('#theme-input', 'A spooky haunted house');
    await page.click('#start-game-btn');

    // Game should start loading
    await expect(page.locator('#loading-screen')).toBeVisible();
  });
});

test.describe('Parser Commands', () => {
  test('should accept text input', async ({ page }) => {
    await page.goto('/');

    // Manually start game in test mode if needed
    await page.evaluate(() => {
      // Load tutorial world for testing
      window.location.href = '/?test=tutorial';
    });

    await page.waitForTimeout(1000);

    const input = page.locator('#text-input');
    await expect(input).toBeVisible();
    await input.fill('look');
    await input.press('Enter');

    // Should show output
    const output = page.locator('#text-output');
    await expect(output).not.toBeEmpty();
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('role', 'img');
    await expect(canvas).toHaveAttribute('aria-label');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have skip to main content link', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeVisible();
  });
});

test.describe('PWA Features', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto('/');

    const sw = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });

    expect(sw).toBeTruthy();
  });

  test('should have manifest link', async ({ page }) => {
    await page.goto('/');

    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', 'manifest.json');
  });
});

test.describe('Multiplayer Lobby', () => {
  test('should load multiplayer page', async ({ page }) => {
    await page.goto('/multiplayer.html');
    await expect(page.locator('#multiplayer-container')).toBeVisible();
  });

  test('should have player name input', async ({ page }) => {
    await page.goto('/multiplayer.html');
    const nameInput = page.locator('#player-name');
    await expect(nameInput).toBeVisible();
  });

  test('should require player name to connect', async ({ page }) => {
    await page.goto('/multiplayer.html');
    await page.click('#connect-btn');
    await expect(page.locator('#connection-status')).toContainText('name');
  });
});

test.describe('World Editor', () => {
  test('should load editor page', async ({ page }) => {
    await page.goto('/editor.html');
    await expect(page.locator('#editor-container')).toBeVisible();
  });

  test('should have drawing tools', async ({ page }) => {
    await page.goto('/editor.html');
    const tools = page.locator('.graphics-tools');
    await expect(tools).toBeVisible();
  });

  test('should create new room', async ({ page }) => {
    await page.goto('/editor.html');
    await page.click('[data-action="create-room"]');
    const modal = page.locator('#new-room-modal');
    await expect(modal).not.toHaveClass(/hidden/);
  });
});
