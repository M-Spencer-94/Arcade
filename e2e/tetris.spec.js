const { test, expect } = require('@playwright/test');
const { detectTone } = require('./helpers/audio-analysis');
const { seedRandom } = require('./helpers/seed-random');
const { freezeGameLoop } = require('./helpers/freeze-loop');

test.describe('Tetris - visual regression', () => {
  test.beforeEach(async ({ page }) => {
    // Freezing requestAnimationFrame stops the game loop from ticking on
    // its own (gravity, line-clear flash animation, main.js's own
    // game-over handling) - every visual test below drives state changes
    // explicitly instead of racing a live loop against wall-clock waits.
    await freezeGameLoop(page);
    await seedRandom(page);
    await page.goto('/tetris');
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

  test('mid-game state after moves matches baseline', async ({ page }) => {
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    // The game loop is frozen, so nothing re-paints the canvas on its own
    // after these discrete moves - render the current state explicitly.
    await page.evaluate(() => renderer.render(gameState));
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
        game: 'tetris',
        entries: [
          { name: 'AAA', score: 12000 },
          { name: 'BBB', score: 8000 },
          { name: 'CCC', score: 4200 }
        ],
        highlightRank: 1
      });
    });
    await expect(page.locator('#game-wrapper')).toHaveScreenshot('leaderboard-overlay.png');
  });
});

// Every distinct (frequency, duration) tone used by Tetris's AudioManager,
// across all of its effects (playRotate/playLineClear/playGameOver/playLock).
// Sequenced effects (playLineClear, playGameOver) are multiple playBeep
// calls under the hood - proving the shared playBeep primitive renders each
// documented tone correctly in a *real* browser AudioContext is what Tier 2
// adds on top of Tier 1's mocked call-argument assertions (which already
// prove each method calls playBeep/playSequence with the right arguments in
// the right order). Rendering a whole multi-step sequence in one
// OfflineAudioContext buffer isn't reliable here: playSequence schedules
// later steps via real setTimeout, which races against
// OfflineAudioContext.startRendering() rather than sharing its clock.
const TETRIS_TONES = [
  { name: 'rotate', frequency: 600, duration: 80 },
  { name: 'lineClear-1', frequency: 800, duration: 150 },
  { name: 'lineClear-2', frequency: 1000, duration: 150 },
  { name: 'lineClear-3', frequency: 1200, duration: 150 },
  { name: 'gameOver-1', frequency: 400, duration: 150 },
  { name: 'gameOver-2', frequency: 300, duration: 150 },
  { name: 'gameOver-3', frequency: 200, duration: 300 },
  { name: 'lock', frequency: 500, duration: 100 }
];

test.describe('Tetris - audio regression', () => {
  for (const tone of TETRIS_TONES) {
    test(`${tone.name} renders as a real ~${tone.frequency}Hz / ${tone.duration}ms tone`, async ({ page }) => {
      await page.goto('/tetris');

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

  test('toggleMute silences playBeep - no tone rendered', async ({ page }) => {
    await page.goto('/tetris');

    const { samples, sampleRate } = await page.evaluate(async () => {
      const offlineCtx = new OfflineAudioContext(1, 44100, 44100);
      const am = Object.create(AudioManager.prototype);
      am.audioContext = offlineCtx;
      am.isMuted = false;
      am.toggleMute();
      am.playBeep(600, 80);
      const rendered = await offlineCtx.startRendering();
      return { samples: Array.from(rendered.getChannelData(0)), sampleRate: offlineCtx.sampleRate };
    });

    const detected = detectTone(samples, sampleRate);
    expect(detected.activeDurationMs).toBe(0);
  });
});
