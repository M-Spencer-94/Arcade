const { Before, Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Load test setup (JSDOM + mocked AudioContext etc.)
require('../../test-setup');

// Import game engine and audio manager directly - no reliance on ambient
// globals, matching tetris.steps.js's convention.
const {
  MAZE_COLS,
  MAZE_ROWS,
  CELL_WALL,
  CELL_EMPTY,
  CELL_DOT,
  CELL_POWER,
  DIRECTIONS,
  PLAYER_SPAWN,
  GHOST_SPAWNS,
  GHOST_CHAIN_POINTS,
  FRIGHTENED_DURATION,
  SCATTER_DURATION,
  CHASE_DURATION,
  Maze,
  Entity,
  Player,
  Ghost,
  GameState
} = require('../../public/js/pacman/game-engine.js');
const { AudioManager } = require('../../public/js/pacman/audio-manager.js');

// Global test state
let gameState;
// Snapshot of state captured immediately before the most recent mutating
// action, so Then steps can make real "did/didn't change" assertions
// instead of vacuous ones. Every When step that mutates gameState refreshes
// this first.
let previous;

// State for the audio scenarios
let audioManager;

// State for the direct Maze edge-case scenarios (wrapCol/isWall boundaries)
let testMaze;

// Result of the most recent direct Ghost.pickDirectionTowards() call
let pickResult;

function snapshotState() {
  return {
    score: gameState.score,
    lives: gameState.lives,
    level: gameState.level,
    isGameOver: gameState.isGameOver,
    isPaused: gameState.isPaused,
    playerCol: gameState.player.col,
    playerRow: gameState.player.row,
    playerDirection: gameState.player.direction,
    ghosts: gameState.ghosts.map((g) => ({ col: g.col, row: g.row, mode: g.mode })),
    frightenedTimer: gameState.frightenedTimer,
    ghostChainCount: gameState.ghostChainCount,
    globalMode: gameState.globalMode,
    globalModeTimer: gameState.globalModeTimer,
    lastEatEvent: gameState.lastEatEvent,
    dotsRemaining: gameState.maze.dotsRemaining()
  };
}

Before(function () {
  gameState = new GameState();
  previous = snapshotState();
});

// ============================================================================
// GIVEN Steps - Setup
// ============================================================================

Given('a new Pac-Man game has started', function () {
  gameState = new GameState();
  previous = snapshotState();
  assert.strictEqual(gameState.score, 0);
  assert.strictEqual(gameState.lives, 3);
  assert.strictEqual(gameState.level, 1);
  assert.strictEqual(gameState.isGameOver, false);
});

Given('the Pac-Man score is {int}', function (score) {
  gameState.score = score;
});

Given('the Pac-Man lives is {int}', function (lives) {
  gameState.lives = lives;
});

Given('the Pac-Man game is paused', function () {
  previous = snapshotState();
  gameState.togglePause();
  assert.strictEqual(gameState.isPaused, true);
});

Given('the Pac-Man game is over', function () {
  gameState.isGameOver = true;
});

Given('the ghost chain count is {int}', function (count) {
  gameState.ghostChainCount = count;
});

Given('the frightened timer is {int}ms', function (ms) {
  gameState.frightenedTimer = ms;
});

Given('the global mode is {word}', function (mode) {
  gameState.globalMode = mode;
  gameState.ghosts.forEach((ghost) => {
    if (ghost.mode !== 'frightened' && ghost.mode !== 'eaten') ghost.mode = mode;
  });
});

Given('the player is at column {int} row {int}', function (col, row) {
  gameState.player.col = col;
  gameState.player.row = row;
});

Given('the player is moving {word}', function (dir) {
  gameState.player.direction = dir;
});

Given("the cell at the player's position has no dot", function () {
  gameState.maze.grid[gameState.player.row][gameState.player.col] = CELL_EMPTY;
});

Given("only the dot at the player's position remains", function () {
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      if (gameState.maze.grid[r][c] !== CELL_WALL) {
        gameState.maze.grid[r][c] = CELL_EMPTY;
      }
    }
  }
  gameState.maze.grid[gameState.player.row][gameState.player.col] = CELL_DOT;
});

Given("ghost {int} is at the player's position in {word} mode", function (num, mode) {
  const ghost = gameState.ghosts[num - 1];
  ghost.col = gameState.player.col;
  ghost.row = gameState.player.row;
  ghost.mode = mode;
});

Given('ghost {int} is in {word} mode', function (num, mode) {
  gameState.ghosts[num - 1].mode = mode;
});

Given('ghost {int} has moved to column {int} row {int}', function (num, col, row) {
  gameState.ghosts[num - 1].col = col;
  gameState.ghosts[num - 1].row = row;
});

Given('ghost {int} is at column {int} row {int}', function (num, col, row) {
  const ghost = gameState.ghosts[num - 1];
  ghost.col = col;
  ghost.row = row;
  ghost.moveCounter = 0;
});

// Walls off all four neighbours of an otherwise-open interior tile so no
// legal move exists from it - the only way to exercise
// pickDirectionTowards's "no legal moves" branch, since the hardcoded maze
// never naturally boxes in a reachable tile on all four sides.
Given('ghost {int} is boxed in with no legal moves', function (num) {
  gameState.maze.grid[2][7] = CELL_WALL; // up
  gameState.maze.grid[4][7] = CELL_WALL; // down
  gameState.maze.grid[3][6] = CELL_WALL; // left
  gameState.maze.grid[3][8] = CELL_WALL; // right
  const ghost = gameState.ghosts[num - 1];
  ghost.col = 7;
  ghost.row = 3;
  ghost.moveCounter = 0;
});

Given('ghost {int} is eaten and at its home tile', function (num) {
  const ghost = gameState.ghosts[num - 1];
  ghost.mode = 'eaten';
  ghost.col = GHOST_SPAWNS[num - 1].col;
  ghost.row = GHOST_SPAWNS[num - 1].row;
  ghost.moveCounter = 0;
});

Given('ghost {int} is eaten and away from its home tile', function (num) {
  const ghost = gameState.ghosts[num - 1];
  ghost.mode = 'eaten';
  // Shift a couple of columns inward from home, staying in-bounds, so it's
  // unambiguously not on its home tile.
  ghost.col = GHOST_SPAWNS[num - 1].col === 1 ? 3 : 11;
  ghost.row = GHOST_SPAWNS[num - 1].row;
  ghost.moveCounter = 0;
});

Given('a fresh maze', function () {
  testMaze = new Maze();
});

Given('a fresh Pac-Man audio manager', function () {
  audioManager = new AudioManager();
});

// ============================================================================
// WHEN Steps - Actions
// ============================================================================

When('the player sets direction to {word}', function (dir) {
  gameState.movePlayerDirection(dir);
});

When('{int}ms of time passes', function (ms) {
  previous = snapshotState();
  gameState.update(ms);
});

When("the game processes eating at the player's position", function () {
  previous = snapshotState();
  gameState.handleEating();
});

When('ghost collisions are processed', function () {
  previous = snapshotState();
  gameState.handleGhostCollisions();
});

When('the global mode timer advances by {int}ms', function (ms) {
  previous = snapshotState();
  gameState.updateGlobalMode(ms);
});

When('the frightened timer counts down by {int}ms', function (ms) {
  previous = snapshotState();
  gameState.updateFrightenedTimer(ms);
});

When('the Pac-Man player toggles pause', function () {
  previous = snapshotState();
  gameState.togglePause();
});

When('the player resets the Pac-Man game', function () {
  gameState.reset();
});

When('ghost {int} updates for {int}ms', function (num, ms) {
  previous = snapshotState();
  const ghost = gameState.ghosts[num - 1];
  ghost.update(ms, gameState.maze, gameState.player.col, gameState.player.row);
});

When('ghost {int} picks a direction towards column {int} row {int}', function (num, col, row) {
  const ghost = gameState.ghosts[num - 1];
  pickResult = ghost.pickDirectionTowards({ col, row }, gameState.maze);
});

When('ghost {int} picks a direction with no target', function (num) {
  const ghost = gameState.ghosts[num - 1];
  pickResult = ghost.pickDirectionTowards(null, gameState.maze);
});

When('the chomp sound is played', function () {
  audioManager.playChomp();
});

When('the power pellet sound is played', function () {
  audioManager.playPowerPellet();
});

When('the ghost eaten sound is played', function () {
  audioManager.playGhostEaten();
});

When('the death sound is played', async function () {
  audioManager.playDeath();
  // playDeath schedules 4 beeps, the last one 360ms out - wait comfortably
  // longer than that for all of them to have fired.
  await new Promise((resolve) => setTimeout(resolve, 500));
});

When('the level complete sound is played', async function () {
  audioManager.playLevelComplete();
  // playLevelComplete schedules 3 beeps, the last one 240ms out.
  await new Promise((resolve) => setTimeout(resolve, 400));
});

// ============================================================================
// THEN Steps - Assertions
// ============================================================================

Then('the Pac-Man score should be {int}', function (score) {
  assert.strictEqual(gameState.score, score);
});

Then('the Pac-Man score should increase by {int}', function (points) {
  assert.strictEqual(gameState.score - previous.score, points);
});

Then('the Pac-Man score should not change', function () {
  assert.strictEqual(gameState.score, previous.score);
});

Then('the Pac-Man lives should be {int}', function (lives) {
  assert.strictEqual(gameState.lives, lives);
});

Then('the Pac-Man lives should decrease by {int}', function (amount) {
  assert.strictEqual(previous.lives - gameState.lives, amount);
});

Then('the Pac-Man lives should not change', function () {
  assert.strictEqual(gameState.lives, previous.lives);
});

Then('the Pac-Man level should be {int}', function (level) {
  assert.strictEqual(gameState.level, level);
});

Then('the Pac-Man game should be over', function () {
  assert.strictEqual(gameState.isGameOver, true);
});

Then('the Pac-Man game should not be over', function () {
  assert.strictEqual(gameState.isGameOver, false);
});

Then('the Pac-Man game should be paused', function () {
  assert.strictEqual(gameState.isPaused, true);
});

Then('the Pac-Man game should not be paused', function () {
  assert.strictEqual(gameState.isPaused, false);
});

Then('the player column should be {int}', function (col) {
  assert.strictEqual(gameState.player.col, col);
});

Then('the player row should be {int}', function (row) {
  assert.strictEqual(gameState.player.row, row);
});

Then('the player direction should be {word}', function (dir) {
  assert.strictEqual(gameState.player.direction, dir);
});

Then('the player position should not change', function () {
  assert.strictEqual(gameState.player.col, previous.playerCol);
  assert.strictEqual(gameState.player.row, previous.playerRow);
});

Then('the player column should increase by {int}', function (amount) {
  assert.strictEqual(gameState.player.col - previous.playerCol, amount);
});

Then('the player row should increase by {int}', function (amount) {
  assert.strictEqual(gameState.player.row - previous.playerRow, amount);
});

Then('the player should be back at the spawn position', function () {
  assert.strictEqual(gameState.player.col, PLAYER_SPAWN.col);
  assert.strictEqual(gameState.player.row, PLAYER_SPAWN.row);
});

Then('the player should not be back at the spawn position', function () {
  assert(
    gameState.player.col !== PLAYER_SPAWN.col || gameState.player.row !== PLAYER_SPAWN.row,
    'Expected the player to not have been reset to spawn'
  );
});

Then('the last eat event should be {string}', function (event) {
  assert.strictEqual(gameState.lastEatEvent, event);
});

Then('the last eat event should be null', function () {
  assert.strictEqual(gameState.lastEatEvent, null);
});

Then('the remaining dot count should decrease by {int}', function (amount) {
  assert.strictEqual(previous.dotsRemaining - gameState.maze.dotsRemaining(), amount);
});

Then('the remaining dot count should not change', function () {
  assert.strictEqual(gameState.maze.dotsRemaining(), previous.dotsRemaining);
});

Then('the remaining dot count should be restored to a full maze', function () {
  assert.strictEqual(gameState.maze.dotsRemaining(), new Maze().dotsRemaining());
});

Then('the ghost chain count should be {int}', function (count) {
  assert.strictEqual(gameState.ghostChainCount, count);
});

Then('the ghost chain count should increase by {int}', function (amount) {
  assert.strictEqual(gameState.ghostChainCount - previous.ghostChainCount, amount);
});

Then('the frightened timer should be {int}ms', function (ms) {
  assert.strictEqual(gameState.frightenedTimer, ms);
});

Then('the global mode should be {word}', function (mode) {
  assert.strictEqual(gameState.globalMode, mode);
});

Then('ghost {int} should be in {word} mode', function (num, mode) {
  assert.strictEqual(gameState.ghosts[num - 1].mode, mode);
});

Then('every ghost should be in {word} mode', function (mode) {
  assert(gameState.ghosts.every((g) => g.mode === mode), `Expected every ghost to be in ${mode} mode`);
});

Then('every ghost except ghost {int} should be in {word} mode', function (num, mode) {
  gameState.ghosts.forEach((ghost, i) => {
    if (i === num - 1) return;
    assert.strictEqual(ghost.mode, mode, `Expected ghost ${i + 1} to be in ${mode} mode`);
  });
});

Then('every ghost should be back at its home position', function () {
  gameState.ghosts.forEach((ghost, i) => {
    assert.strictEqual(ghost.col, GHOST_SPAWNS[i].col);
    assert.strictEqual(ghost.row, GHOST_SPAWNS[i].row);
  });
});

Then("ghost {int}'s move delay should be {int}ms", function (num, ms) {
  assert.strictEqual(gameState.ghosts[num - 1].currentMoveDelay(), ms);
});

Then('ghost {int} should not have moved', function (num) {
  const ghost = gameState.ghosts[num - 1];
  assert.strictEqual(ghost.col, previous.ghosts[num - 1].col);
  assert.strictEqual(ghost.row, previous.ghosts[num - 1].row);
});

Then('ghost {int} should have moved', function (num) {
  const ghost = gameState.ghosts[num - 1];
  assert(
    ghost.col !== previous.ghosts[num - 1].col || ghost.row !== previous.ghosts[num - 1].row,
    `Expected ghost ${num} to have moved`
  );
});

Then("ghost {int}'s target should be its scatter corner", function (num) {
  const ghost = gameState.ghosts[num - 1];
  const target = ghost.getTarget(gameState.player.col, gameState.player.row);
  assert.deepStrictEqual(target, GHOST_SPAWNS[num - 1].scatterTarget);
});

Then("ghost {int}'s target should be the player's position", function (num) {
  const ghost = gameState.ghosts[num - 1];
  const target = ghost.getTarget(gameState.player.col, gameState.player.row);
  assert.deepStrictEqual(target, { col: gameState.player.col, row: gameState.player.row });
});

Then("ghost {int}'s target should be its home tile", function (num) {
  const ghost = gameState.ghosts[num - 1];
  const target = ghost.getTarget(gameState.player.col, gameState.player.row);
  assert.deepStrictEqual(target, { col: GHOST_SPAWNS[num - 1].col, row: GHOST_SPAWNS[num - 1].row });
});

Then("ghost {int}'s target should be null", function (num) {
  const ghost = gameState.ghosts[num - 1];
  const target = ghost.getTarget(gameState.player.col, gameState.player.row);
  assert.strictEqual(target, null);
});

Then('no direction should be available', function () {
  assert.strictEqual(pickResult, null);
});

Then('the picked direction should be a legal move', function () {
  assert(Object.keys(DIRECTIONS).includes(pickResult), 'Expected a legal direction name');
});

Then('the picked direction should be {word}', function (dir) {
  assert.strictEqual(pickResult, dir);
});

// --- Maze internals ----------------------------------------------------------

Then('wrapping column {int} should give column {int}', function (col, expected) {
  assert.strictEqual(testMaze.wrapCol(col), expected);
});

Then('row {int} at column {int} should be a wall', function (row, col) {
  assert.strictEqual(testMaze.isWall(col, row), true);
});

Then('row {int} at column {int} should not be a wall', function (row, col) {
  assert.strictEqual(testMaze.isWall(col, row), false);
});

// --- Audio assertions ---------------------------------------------------------

Then('a Pac-Man beep of {int}Hz for {int}ms should have been played', function (freq, duration) {
  assert.deepStrictEqual(audioManager.audioContext.calls, [{ frequency: freq, duration }]);
});

Then(
  'the death sound sequence should be {int}Hz for {int}ms, {int}Hz for {int}ms, {int}Hz for {int}ms and {int}Hz for {int}ms',
  function (f1, d1, f2, d2, f3, d3, f4, d4) {
    assert.deepStrictEqual(audioManager.audioContext.calls, [
      { frequency: f1, duration: d1 },
      { frequency: f2, duration: d2 },
      { frequency: f3, duration: d3 },
      { frequency: f4, duration: d4 }
    ]);
  }
);

Then(
  'the level-complete sound sequence should be {int}Hz for {int}ms, {int}Hz for {int}ms and {int}Hz for {int}ms',
  function (f1, d1, f2, d2, f3, d3) {
    assert.deepStrictEqual(audioManager.audioContext.calls, [
      { frequency: f1, duration: d1 },
      { frequency: f2, duration: d2 },
      { frequency: f3, duration: d3 }
    ]);
  }
);
