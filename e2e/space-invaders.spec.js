const { test, expect } = require('@playwright/test');
const { detectTone } = require('./helpers/audio-analysis');
const { seedRandom } = require('./helpers/seed-random');
const { freezeGameLoop } = require('./helpers/freeze-loop');

test.describe('Space Invaders - visual regression', () => {
  test.beforeEach(async ({ page }) => {
    // Freezing requestAnimationFrame stops the game loop from ticking on
    // its own (formation movement, the walk-cycle animation, main.js's own
    // game-over handling) - every visual test below drives state changes
    // explicitly instead of racing a live loop against wall-clock waits.
    await freezeGameLoop(page);
    await seedRandom(page);
    await page.goto('/space-invaders');
    // initGame() renders one frame synchronously, but a screenshot taken in
    // the same tick can still race the compositor and capture blank.
    await page.waitForTimeout(100);
  });

  test('initial render matches baseline', async ({ page }) => {
    await expect(page.locator('#game-container')).toHaveScreenshot('initial-render.png');
  });

  test('game wrapper border matches the arcade theme', async ({ page }) => {
    const border = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('game-canvas'));
      return { color: cs.borderColor, width: cs.borderWidth, style: cs.borderStyle };
    });
    expect(border.color).toBe('rgb(0, 212, 255)');
    expect(border.width).toBe('3px');
    expect(border.style).toBe('solid');
  });

  test('mid-game state after moving and firing matches baseline', async ({ page }) => {
    await page.evaluate(() => {
      gameState.setPlayerMoving('left');
      gameState.update(300);
      gameState.stopPlayerMoving();
      gameState.playerShoot();
      renderer.render(gameState);
    });
    await expect(page.locator('#game-container')).toHaveScreenshot('mid-game.png');
  });

  test('game-over overlay matches baseline (non-qualifying score)', async ({ page }) => {
    // handleGameOver() is normally triggered by the game loop noticing
    // isGameOver - with the loop frozen, call it directly instead. Stub the
    // leaderboard fetch to return a full, higher-scoring board so this
    // score reliably doesn't qualify (rather than depending on real
    // leaderboard state on disk, which may be empty and make every score
    // "qualify").
    await page.evaluate(async () => {
      LeaderboardClient.fetchTop = async () => ({
        entries: Array.from({ length: 10 }, (_, i) => ({ name: 'AAA', score: 999999 - i }))
      });
      gameState.isGameOver = true;
      await handleGameOver();
    });
    await expect(page.locator('#game-over-overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#game-wrapper')).toHaveScreenshot('game-over-overlay.png');
  });

  test('name-entry modal matches baseline (qualifying score)', async ({ page }) => {
    await page.evaluate(async () => {
      LeaderboardClient.fetchTop = async () => ({ entries: [] });
      gameState.isGameOver = true;
      await handleGameOver();
    });
    await expect(page.locator('#name-entry-overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#game-wrapper')).toHaveScreenshot('name-entry-overlay.png');
  });

  test('leaderboard overlay matches baseline', async ({ page }) => {
    await page.evaluate(() => {
      LeaderboardUI.showLeaderboardOverlay({
        overlayEl: document.getElementById('leaderboard-overlay'),
        game: 'space-invaders',
        entries: [
          { name: 'AAA', score: 890 },
          { name: 'BBB', score: 410 }
        ],
        highlightRank: 1
      });
    });
    await expect(page.locator('#game-wrapper')).toHaveScreenshot('leaderboard-overlay.png');
  });
});

// Every distinct (frequency, duration) tone used by Space Invaders'
// AudioManager. See tetris.spec.js for why each tone is rendered
// individually via the shared playBeep primitive rather than by invoking
// the sequenced methods (playPlayerHit/playWaveClear) directly in a single
// OfflineAudioContext render.
const INVADERS_TONES = [
  { name: 'shoot', frequency: 900, duration: 60 },
  { name: 'invaderHit', frequency: 220, duration: 80 },
  { name: 'playerHit-1', frequency: 400, duration: 150 },
  { name: 'playerHit-2', frequency: 300, duration: 150 },
  { name: 'playerHit-3', frequency: 200, duration: 300 },
  { name: 'waveClear-1', frequency: 500, duration: 100 },
  { name: 'waveClear-2', frequency: 700, duration: 100 },
  { name: 'waveClear-3', frequency: 900, duration: 150 }
];

test.describe('Space Invaders - audio regression', () => {
  for (const tone of INVADERS_TONES) {
    test(`${tone.name} renders as a real ~${tone.frequency}Hz / ${tone.duration}ms tone`, async ({ page }) => {
      await page.goto('/space-invaders');

      const { samples, sampleRate } = await page.evaluate(async ({ frequency, duration }) => {
        const offlineCtx = new OfflineAudioContext(1, 44100, 44100);
        const am = Object.create(AudioManager.prototype);
        am.audioContext = offlineCtx;
        am.isMuted = false;
        am.playBeep(frequency, duration);
        const rendered = await offlineCtx.startRendering();
        return { samples: Array.from(rendered.getChannelData(0)), sampleRate: offlineCtx.sampleRate };
      }, tone);

      const detected = detectTone(samples, sampleRate);
      expect(detected.frequency).toBeGreaterThan(tone.frequency * 0.9);
      expect(detected.frequency).toBeLessThan(tone.frequency * 1.1);
      expect(detected.activeDurationMs).toBeGreaterThan(tone.duration * 0.5);
      expect(detected.activeDurationMs).toBeLessThan(tone.duration * 1.3);
    });
  }
});
