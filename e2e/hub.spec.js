const { test, expect } = require('@playwright/test');

test.describe('Arcade hub', () => {
  test('renders three game cards with working links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.game-card')).toHaveCount(3);

    await expect(page.locator('.game-card a.play-link').nth(0)).toHaveAttribute('href', '/tetris');
    await expect(page.locator('.game-card a.play-link').nth(1)).toHaveAttribute('href', '/pacman');
    await expect(page.locator('.game-card a.play-link').nth(2)).toHaveAttribute('href', '/space-invaders');
  });

  test('initial render matches baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hub-container')).toHaveScreenshot('initial-render.png');
  });

  test('leaderboard button shows an empty-state overlay for a game with no scores', async ({ page }) => {
    await page.goto('/');
    await page.locator('.leaderboard-btn[data-game="space-invaders"]').click();
    await expect(page.locator('#leaderboard-overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#leaderboard-overlay')).toContainText('Space Invaders Leaderboard');
  });

  test('each game page is reachable and renders its own canvas', async ({ page }) => {
    for (const path of ['/tetris', '/pacman', '/space-invaders']) {
      await page.goto(path);
      await expect(page.locator('#game-canvas')).toBeVisible();
    }
  });
});
