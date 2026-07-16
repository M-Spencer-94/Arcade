const { Before, Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Load test setup (JSDOM + mocked AudioContext etc.)
require('../../test-setup');

// Import game engine and audio manager directly - no reliance on ambient
// globals, matching tetris.steps.js/pacman.steps.js's convention.
const {
  INVADER_ROWS,
  INVADER_COLS,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_Y,
  PLAYER_START_X,
  BULLET_WIDTH,
  STARTING_LIVES,
  rectsOverlap,
  GameState
} = require('../../public/js/space-invaders/game-engine.js');
const { AudioManager } = require('../../public/js/space-invaders/audio-manager.js');

// Formula constants mirrored from game-engine.js. These aren't exported (the
// engine only exposes getStepInterval()/getShotInterval() as methods), so -
// matching tetris.steps.js's own LINE_CLEAR_POINTS mirror - the values are
// hardcoded here to give an independent cross-check of the documented
// formulas rather than just calling the getter and comparing it to itself.
const BASE_STEP_INTERVAL = 800;
const WAVE_STEP_SPEEDUP = 80;
const WAVE_MIN_STEP_INTERVAL = 300;
const MIN_STEP_INTERVAL = 80;
const BASE_SHOT_INTERVAL = 1200;
const WAVE_SHOT_SPEEDUP = 100;
const WAVE_MIN_SHOT_INTERVAL = 400;
const TOTAL_INVADERS = INVADER_ROWS * INVADER_COLS;

// Global test state
let gameState;
// Snapshot of state captured immediately before the most recent mutating
// action, so Then steps can make real "did/didn't change" assertions
// instead of vacuous ones. Every When step (and any Given step that itself
// mutates state) refreshes this first.
let previous;

// State for the audio scenarios
let audioManager;

// State for the direct rectsOverlap scenarios
let rectA;
let rectB;

function snapshotState() {
  return {
    score: gameState.score,
    lives: gameState.lives,
    wave: gameState.wave,
    isGameOver: gameState.isGameOver,
    isPaused: gameState.isPaused,
    playerX: gameState.player.x,
    playerMoving: gameState.player.moving,
    playerBullet: gameState.playerBullet,
    invaderBulletsCount: gameState.invaderBullets.length,
    formationOffsetX: gameState.formationOffsetX,
    formationOffsetY: gameState.formationOffsetY,
    formationDirection: gameState.formationDirection,
    formationStepTimer: gameState.formationStepTimer,
    invaderShotTimer: gameState.invaderShotTimer,
    lastEvent: gameState.lastEvent,
    aliveCount: gameState.aliveCount()
  };
}

// True when `bullet` is exactly where firing from `inv` would have placed
// it, per updateInvaderShooting's own position formula. Used to identify -
// structurally, without assuming which column Math.random() picked - which
// invader actually fired a given bullet.
function invaderFiredBullet(inv, bullet) {
  const pos = gameState.getInvaderPosition(inv);
  return pos.x + INVADER_WIDTH / 2 - BULLET_WIDTH / 2 === bullet.x && pos.y + INVADER_HEIGHT === bullet.y;
}

Before(function () {
  gameState = new GameState();
  previous = snapshotState();
});

// ============================================================================
// GIVEN Steps - Setup
// ============================================================================

Given('a new Space Invaders game has started', function () {
  gameState = new GameState();
  previous = snapshotState();
  assert.strictEqual(gameState.score, 0);
  assert.strictEqual(gameState.wave, 1);
  assert.strictEqual(gameState.lives, STARTING_LIVES);
  assert.strictEqual(gameState.isGameOver, false);
});

Given('the invaders score is {int}', function (score) {
  gameState.score = score;
});

Given('the invaders lives is {int}', function (lives) {
  gameState.lives = lives;
});

Given('the invaders wave is {int}', function (wave) {
  gameState.wave = wave;
});

Given('the invaders game is paused', function () {
  previous = snapshotState();
  gameState.togglePause();
  assert.strictEqual(gameState.isPaused, true);
});

Given('the invaders game is over', function () {
  gameState.isGameOver = true;
});

Given('the invaders player is at x {int}', function (x) {
  gameState.player.x = x;
});

Given('the invaders player is moving {word}', function (direction) {
  gameState.setPlayerMoving(direction);
});

Given('the invaders player has already fired', function () {
  gameState.playerShoot();
  previous = snapshotState();
});

Given('the player bullet is at y {int}', function (y) {
  if (!gameState.playerBullet) gameState.playerShoot();
  gameState.playerBullet.y = y;
});

Given('an invader bullet is at y {int}', function (y) {
  gameState.invaderBullets = [{ x: 100, y }];
});

Given('{int} invader bullets are already in flight', function (count) {
  gameState.invaderBullets = Array.from({ length: count }, (_, i) => ({ x: 10 * i, y: 100 }));
});

Given('an invader bullet is positioned exactly on the player', function () {
  gameState.invaderBullets = [{ x: gameState.player.x, y: PLAYER_Y }];
});

Given("an invader bullet is positioned just past the player's edge", function () {
  // Bullet's left edge sits exactly at the player's right edge - touching
  // only, which rectsOverlap's strict "<" treats as not overlapping.
  gameState.invaderBullets = [{ x: gameState.player.x + PLAYER_WIDTH, y: PLAYER_Y }];
});

Given('the player bullet is positioned at the row {int} column {int} invader', function (row, col) {
  const inv = gameState.invaders.find((i) => i.row === row && i.col === col);
  const pos = gameState.getInvaderPosition(inv);
  gameState.playerBullet = { x: pos.x, y: pos.y };
});

Given("the player bullet is positioned just past the row {int} column {int} invader's right edge", function (row, col) {
  const inv = gameState.invaders.find((i) => i.row === row && i.col === col);
  const pos = gameState.getInvaderPosition(inv);
  // Touching the invader's right edge only, not overlapping it.
  gameState.playerBullet = { x: pos.x + INVADER_WIDTH, y: pos.y };
});

Given('the row {int} column {int} invader is dead', function (row, col) {
  gameState.invaders.find((i) => i.row === row && i.col === col).alive = false;
});

Given('every invader in column {int} is dead', function (col) {
  gameState.invaders.filter((inv) => inv.col === col).forEach((inv) => { inv.alive = false; });
});

Given('every invader is dead', function () {
  gameState.invaders.forEach((inv) => { inv.alive = false; });
});

Given('every invader is dead except those in column {int}', function (col) {
  gameState.invaders.forEach((inv) => { inv.alive = inv.col === col; });
});

Given('exactly {int} invaders are alive', function (count) {
  let remaining = count;
  gameState.invaders.forEach((inv) => {
    inv.alive = remaining > 0;
    if (remaining > 0) remaining -= 1;
  });
});

Given('the invaders in column {int} at rows {int} and {int} have swapped row values', function (col, rowA, rowB) {
  const invA = gameState.invaders.find((i) => i.col === col && i.row === rowA);
  const invB = gameState.invaders.find((i) => i.col === col && i.row === rowB);
  const tmpRow = invA.row;
  invA.row = invB.row;
  invB.row = tmpRow;
});

Given('the formation offset x is {int}', function (x) {
  gameState.formationOffsetX = x;
});

Given('the formation offset y is {int}', function (y) {
  gameState.formationOffsetY = y;
});

Given('the formation direction is {int}', function (direction) {
  gameState.formationDirection = direction;
});

Given('the formation is positioned so its lowest invader exactly reaches the player row', function () {
  const bottomInvader = gameState.invaders.reduce((lowest, inv) => (inv.row > lowest.row ? inv : lowest));
  const baseY = gameState.getInvaderPosition(bottomInvader).y;
  gameState.formationOffsetY = PLAYER_Y - INVADER_HEIGHT - baseY;
});

Given('the formation is positioned {int}px short of reaching the player row', function (px) {
  const bottomInvader = gameState.invaders.reduce((lowest, inv) => (inv.row > lowest.row ? inv : lowest));
  const baseY = gameState.getInvaderPosition(bottomInvader).y;
  gameState.formationOffsetY = PLAYER_Y - INVADER_HEIGHT - baseY - px;
});

Given('a fresh Space Invaders audio manager', function () {
  audioManager = new AudioManager();
});

Given('rectangle A at x {int} y {int} width {int} height {int}', function (x, y, width, height) {
  rectA = { x, y, width, height };
});

Given('rectangle B at x {int} y {int} width {int} height {int}', function (x, y, width, height) {
  rectB = { x, y, width, height };
});

// ============================================================================
// WHEN Steps - Actions
// ============================================================================

When('{int}ms passes for the invaders player', function (ms) {
  previous = snapshotState();
  gameState.updatePlayer(ms);
});

When('the invaders player stops moving', function () {
  previous = snapshotState();
  gameState.stopPlayerMoving();
});

When('the invaders player shoots', function () {
  previous = snapshotState();
  gameState.playerShoot();
});

When('{int}ms passes for bullet movement', function (ms) {
  previous = snapshotState();
  gameState.updateBullets(ms);
});

When('{int}ms passes for the formation', function (ms) {
  previous = snapshotState();
  gameState.updateFormation(ms);
});

When('{int}ms passes for invader shooting', function (ms) {
  previous = snapshotState();
  gameState.updateInvaderShooting(ms);
});

When('player bullet collisions are processed', function () {
  previous = snapshotState();
  gameState.handlePlayerBulletCollisions();
});

When('invader bullet collisions are processed', function () {
  previous = snapshotState();
  gameState.handleInvaderBulletCollisions();
});

When('the invasion check runs', function () {
  previous = snapshotState();
  gameState.checkInvasion();
});

When('the invaders player loses a life', function () {
  previous = snapshotState();
  gameState.loseLife();
});

When('the wave advances', function () {
  previous = snapshotState();
  gameState.nextWave();
});

When('the invaders player toggles pause', function () {
  previous = snapshotState();
  gameState.togglePause();
});

When('the invaders game is reset', function () {
  gameState.reset();
});

When('{int}ms of Space Invaders time passes', function (ms) {
  previous = snapshotState();
  gameState.update(ms);
});

When('the invaders shoot sound is played', function () {
  audioManager.playShoot();
});

When('the invaders invader-hit sound is played', function () {
  audioManager.playInvaderHit();
});

When('the invaders player-hit sound is played', async function () {
  audioManager.playPlayerHit();
  // playPlayerHit schedules 3 beeps, the last one 200ms out.
  await new Promise((resolve) => setTimeout(resolve, 300));
});

When('the invaders wave-clear sound is played', async function () {
  audioManager.playWaveClear();
  // playWaveClear schedules 3 beeps, the last one 200ms out.
  await new Promise((resolve) => setTimeout(resolve, 300));
});

// ============================================================================
// THEN Steps - Assertions
// ============================================================================

Then('the invaders player x should be {int}', function (x) {
  assert.strictEqual(gameState.player.x, x);
});

Then('the invaders player x should decrease by {int}', function (amount) {
  assert.strictEqual(previous.playerX - gameState.player.x, amount);
});

Then('the invaders player x should increase by {int}', function (amount) {
  assert.strictEqual(gameState.player.x - previous.playerX, amount);
});

Then('the invaders player x should not change', function () {
  assert.strictEqual(gameState.player.x, previous.playerX);
});

Then('the invaders player x should be at the starting position', function () {
  assert.strictEqual(gameState.player.x, PLAYER_START_X);
});

Then('the invaders player should not be moving', function () {
  assert.strictEqual(gameState.player.moving, null);
});

Then('a player bullet should exist', function () {
  assert(gameState.playerBullet !== null, 'Expected a player bullet to exist');
});

Then('no player bullet should exist', function () {
  assert.strictEqual(gameState.playerBullet, null);
});

Then('no additional player bullet should have been created', function () {
  assert.strictEqual(gameState.playerBullet, previous.playerBullet, 'Expected playerShoot() to have been a no-op');
});

Then('the player bullet should be at the top of the player', function () {
  assert(gameState.playerBullet !== null);
  assert.strictEqual(gameState.playerBullet.y, PLAYER_Y);
  const expectedX = gameState.player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2;
  assert.strictEqual(gameState.playerBullet.x, expectedX);
});

Then('that invader bullet should no longer be in flight', function () {
  assert.strictEqual(gameState.invaderBullets.length, 0);
});

Then('that invader bullet should still be in flight', function () {
  assert.strictEqual(gameState.invaderBullets.length, 1);
});

Then('the invader bullet y should be {int}', function (y) {
  assert.strictEqual(gameState.invaderBullets[0].y, y);
});

Then('the player bullet y should be {int}', function (y) {
  assert(gameState.playerBullet !== null, 'Expected a player bullet to exist');
  assert.strictEqual(gameState.playerBullet.y, y);
});

Then('there should be no invader bullets in flight', function () {
  assert.strictEqual(gameState.invaderBullets.length, 0);
});

Then('the number of invader bullets should increase by {int}', function (amount) {
  assert.strictEqual(gameState.invaderBullets.length - previous.invaderBulletsCount, amount);
});

Then('the number of invader bullets should not change', function () {
  assert.strictEqual(gameState.invaderBullets.length, previous.invaderBulletsCount);
});

Then('the fired invader bullet should originate from the alive invader with the highest row in its column', function () {
  const bullet = gameState.invaderBullets[gameState.invaderBullets.length - 1];
  assert(bullet, 'Expected a bullet to have been fired');
  const matches = gameState.invaders.filter((inv) => inv.alive && invaderFiredBullet(inv, bullet));
  assert.strictEqual(matches.length, 1, 'Expected exactly one alive invader to match the fired bullet position');
  const shooter = matches[0];
  const columnAlive = gameState.invaders.filter((inv) => inv.alive && inv.col === shooter.col);
  const maxRow = Math.max(...columnAlive.map((inv) => inv.row));
  assert.strictEqual(shooter.row, maxRow, 'Expected the shooter to be the alive invader with the highest row in its column');
});

Then('the fired invader bullet should originate from column {int}', function (col) {
  const bullet = gameState.invaderBullets[gameState.invaderBullets.length - 1];
  const shooter = gameState.invaders.find((inv) => inv.alive && invaderFiredBullet(inv, bullet));
  assert(shooter, 'Expected to find the alive invader that fired this bullet');
  assert.strictEqual(shooter.col, col);
});

Then('the formation step interval should be {int}ms', function (ms) {
  const aliveRatio = gameState.aliveCount() / TOTAL_INVADERS;
  const waveBase = Math.max(WAVE_MIN_STEP_INTERVAL, BASE_STEP_INTERVAL - (gameState.wave - 1) * WAVE_STEP_SPEEDUP);
  const expected = Math.max(MIN_STEP_INTERVAL, Math.round(waveBase * aliveRatio));
  assert.strictEqual(ms, expected, 'test data does not match the documented step-interval formula');
  assert.strictEqual(gameState.getStepInterval(), ms);
});

Then('the invader shot interval should be {int}ms', function (ms) {
  const expected = Math.max(WAVE_MIN_SHOT_INTERVAL, BASE_SHOT_INTERVAL - (gameState.wave - 1) * WAVE_SHOT_SPEEDUP);
  assert.strictEqual(ms, expected, 'test data does not match the documented shot-interval formula');
  assert.strictEqual(gameState.getShotInterval(), ms);
});

Then('the formation offset x should increase by {int}', function (amount) {
  assert.strictEqual(gameState.formationOffsetX - previous.formationOffsetX, amount);
});

Then('the formation offset x should decrease by {int}', function (amount) {
  assert.strictEqual(previous.formationOffsetX - gameState.formationOffsetX, amount);
});

Then('the formation offset x should not change', function () {
  assert.strictEqual(gameState.formationOffsetX, previous.formationOffsetX);
});

Then('the formation offset x should be {int}', function (x) {
  assert.strictEqual(gameState.formationOffsetX, x);
});

Then('the formation offset y should increase by {int}', function (amount) {
  assert.strictEqual(gameState.formationOffsetY - previous.formationOffsetY, amount);
});

Then('the formation offset y should not change', function () {
  assert.strictEqual(gameState.formationOffsetY, previous.formationOffsetY);
});

Then('the formation offset y should be {int}', function (y) {
  assert.strictEqual(gameState.formationOffsetY, y);
});

Then('the formation direction should not change', function () {
  assert.strictEqual(gameState.formationDirection, previous.formationDirection);
});

Then('the formation direction should be {int}', function (direction) {
  assert.strictEqual(gameState.formationDirection, direction);
});

Then('the formation bounds should span from column {int} to column {int}', function (colMin, colMax) {
  const findInCol = (col) => gameState.invaders.find((inv) => inv.col === col);
  const posMin = gameState.getInvaderPosition(findInCol(colMin));
  const posMax = gameState.getInvaderPosition(findInCol(colMax));
  const bounds = gameState.getFormationBounds();
  assert.strictEqual(bounds.minX, posMin.x);
  assert.strictEqual(bounds.maxX, posMax.x + INVADER_WIDTH);
});

Then('every invader should be alive again', function () {
  assert.strictEqual(gameState.invaders.length, TOTAL_INVADERS);
  assert(gameState.invaders.every((inv) => inv.alive), 'Expected every invader to be alive');
});

Then('the row {int} column {int} invader should be dead', function (row, col) {
  const inv = gameState.invaders.find((i) => i.row === row && i.col === col);
  assert.strictEqual(inv.alive, false);
});

Then('the row {int} column {int} invader should be alive', function (row, col) {
  const inv = gameState.invaders.find((i) => i.row === row && i.col === col);
  assert.strictEqual(inv.alive, true);
});

Then('the invaders score should be {int}', function (score) {
  assert.strictEqual(gameState.score, score);
});

Then('the invaders score should increase by {int}', function (amount) {
  assert.strictEqual(gameState.score - previous.score, amount);
});

Then('the invaders score should not change', function () {
  assert.strictEqual(gameState.score, previous.score);
});

Then('the invaders lives should be {int}', function (lives) {
  assert.strictEqual(gameState.lives, lives);
});

Then('the invaders lives should decrease by {int}', function (amount) {
  assert.strictEqual(previous.lives - gameState.lives, amount);
});

Then('the invaders lives should not change', function () {
  assert.strictEqual(gameState.lives, previous.lives);
});

Then('the invaders wave should be {int}', function (wave) {
  assert.strictEqual(gameState.wave, wave);
});

Then('the invaders wave should increase by {int}', function (amount) {
  assert.strictEqual(gameState.wave - previous.wave, amount);
});

Then('the invaders game should be over', function () {
  assert.strictEqual(gameState.isGameOver, true);
});

Then('the invaders game should not be over', function () {
  assert.strictEqual(gameState.isGameOver, false);
});

Then('the invaders game should be paused', function () {
  assert.strictEqual(gameState.isPaused, true);
});

Then('the invaders game should not be paused', function () {
  assert.strictEqual(gameState.isPaused, false);
});

Then('the last invaders event should be {string}', function (eventName) {
  assert.strictEqual(gameState.lastEvent, eventName);
});

Then('the last invaders event should be null', function () {
  assert.strictEqual(gameState.lastEvent, null);
});

// --- rectsOverlap direct assertions -----------------------------------------

Then('the rectangles should overlap', function () {
  assert.strictEqual(rectsOverlap(rectA, rectB), true);
});

Then('the rectangles should not overlap', function () {
  assert.strictEqual(rectsOverlap(rectA, rectB), false);
});

// --- Audio assertions --------------------------------------------------------

Then('a Space Invaders beep of {int}Hz for {int}ms should have been played', function (freq, duration) {
  assert.deepStrictEqual(audioManager.audioContext.calls, [{ frequency: freq, duration }]);
});

Then(
  'the invaders {word} sound sequence should be {int}Hz for {int}ms, {int}Hz for {int}ms and {int}Hz for {int}ms',
  function (name, f1, d1, f2, d2, f3, d3) {
    assert.deepStrictEqual(audioManager.audioContext.calls, [
      { frequency: f1, duration: d1 },
      { frequency: f2, duration: d2 },
      { frequency: f3, duration: d3 }
    ]);
  }
);
