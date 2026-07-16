const { Before, Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Load test setup
require('../../test-setup');

// Import game engine and audio manager directly - no reliance on ambient globals
const { Tetromino, GameBoard, GameState, TETROMINOES, PIECES, BOARD_WIDTH, BOARD_HEIGHT } = require('../../public/js/tetris/game-engine.js');
const { AudioManager } = require('../../public/js/tetris/audio-manager.js');

const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800];

// Global test state
let gameState;
// Snapshot of state captured immediately before the most recent action, so
// Then steps can make real "did/didn't change" assertions instead of vacuous
// ones. Every When step that mutates gameState refreshes this first.
let previous;

// State for the audio scenarios
let audioManager;
let savedAudioContext;

// State for the direct GameBoard/Tetromino edge-case scenarios
let testBoard;
let testPiece;

// State for the piece-rotation-across-all-types scenario
let rotationTestResults = [];

// State for the "several separate lock events" line-clearing scenario
let clearBatchRows = [];

// State for the gravity-delay-formula scenario
let gravityDelaySamples = [];

function snapshotState() {
  return {
    piece: gameState.currentPiece,
    x: gameState.currentPiece.x,
    y: gameState.currentPiece.y,
    rotationState: gameState.currentPiece.rotationState,
    shape: gameState.currentPiece.shape.map(row => [...row]),
    score: gameState.score,
    level: gameState.level,
    linesCleared: gameState.linesCleared,
    isPaused: gameState.isPaused,
    isGameOver: gameState.isGameOver,
    gravityCounter: gameState.gravityCounter,
    board: gameState.board.grid.map(row => [...row]),
  };
}

// Positions the current piece resting exactly on top of the given row, i.e.
// one more row of downward movement would collide. Used to set up hard-drop
// scenarios that lock with zero rows of movement (and therefore zero hard
// drop points), isolating line-clear scoring from movement scoring.
function restPieceOnTopOfRow(rowIndex) {
  gameState.currentPiece.y = rowIndex - gameState.currentPiece.shape.length;
}

Before(function() {
  // Initialize fresh game state before each scenario
  gameState = new GameState();
  previous = snapshotState();
});

// ============================================================================
// GIVEN Steps - Setup
// ============================================================================

Given('a new game has started', function() {
  gameState = new GameState();
  previous = snapshotState();
  assert.strictEqual(gameState.score, 0);
  assert.strictEqual(gameState.level, 1);
  assert.strictEqual(gameState.isGameOver, false);
});

Given('the score is {int}', function(score) {
  gameState.score = score;
});

Given('the game is paused', function() {
  previous = snapshotState();
  gameState.togglePause();
  assert.strictEqual(gameState.isPaused, true);
});

Given('the game is over', function() {
  gameState.isGameOver = true;
});

Given('the board is empty', function() {
  gameState.board.grid.forEach(row => row.fill(null));
});

Given('the board is nearly full', function() {
  // Stack blocks almost to the top, but leave a different single gap in
  // each row so that no row is ever complete on its own (which would
  // immediately clear it and undo the "nearly full" setup). Only row 0 is
  // left fully clear, as spawn room for the next piece.
  for (let y = 1; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (x !== y % BOARD_WIDTH) {
        gameState.board.grid[y][x] = { color: '#00f0f0', id: 'I' };
      }
    }
  }
});

Given('the board has locked pieces below', function() {
  // Rows 15-19 act as a solid floor. Leave one column empty in each row so
  // none of them is ever "complete" (which would clear the floor away).
  for (let y = 15; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH - 1; x++) {
      gameState.board.grid[y][x] = { color: '#f00000', id: 'Z' };
    }
  }
  // Rest the current piece directly on top of the floor so the very next
  // soft drop locks it instead of just moving it down.
  restPieceOnTopOfRow(15);
});

Given('the board has locked pieces at column {int}', function(col) {
  for (let y = 15; y < BOARD_HEIGHT; y++) {
    gameState.board.grid[y][col] = { color: '#f00000', id: 'Z' };
  }
  // Bring the piece down to the same row as the obstacle, otherwise a
  // spawn-height piece can never actually collide with it.
  gameState.currentPiece.y = 15;
});

Given('the board has an incomplete row', function() {
  // Fill row 19 (bottom) with pieces except one column
  for (let x = 0; x < BOARD_WIDTH - 1; x++) {
    gameState.board.grid[19][x] = { color: '#f00000', id: 'Z' };
  }
  // Leave the last column empty
  gameState.board.grid[19][BOARD_WIDTH - 1] = null;
});

Given('the board has two non-adjacent complete rows', function() {
  // Row 15 complete
  for (let x = 0; x < BOARD_WIDTH; x++) {
    gameState.board.grid[15][x] = { color: '#f00000', id: 'Z' };
  }
  // Row 19 complete
  for (let x = 0; x < BOARD_WIDTH; x++) {
    gameState.board.grid[19][x] = { color: '#f00000', id: 'Z' };
  }
});

Given('only the top row is complete', function() {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    gameState.board.grid[0][x] = { color: '#f00000', id: 'Z' };
  }
});

Given('only the bottom row is complete', function() {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    gameState.board.grid[19][x] = { color: '#f00000', id: 'Z' };
  }
});

Given('the board is nearly full with several complete rows', function() {
  // Three separate rows, each missing exactly a 4-wide, I-piece-sized gap,
  // so a sequence of separate I-piece locks completes them one at a time.
  clearBatchRows = [10, 13, 16];
  clearBatchRows.forEach(row => {
    for (let x = 0; x < 6; x++) {
      gameState.board.grid[row][x] = { color: '#f00000', id: 'Z' };
    }
  });
});

Given('the board is set up for a single line clear', function() {
  // Fill row 19 leaving a 4-wide gap sized for an I piece, and rest the
  // current piece (forced to an I tetromino) directly in that gap so a
  // hard drop locks it there with zero rows of movement.
  for (let x = 0; x < 6; x++) {
    gameState.board.grid[19][x] = { color: '#f00000', id: 'Z' };
  }
  gameState.currentPiece = new Tetromino('I');
  gameState.currentPiece.x = 6;
  gameState.currentPiece.y = 19;
});

Given('the board is set up for a double line clear', function() {
  // Fill rows 18 and 19
  for (let y = 18; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      gameState.board.grid[y][x] = { color: '#f00000', id: 'Z' };
    }
  }
  restPieceOnTopOfRow(18);
});

Given('the board is set up for a triple line clear', function() {
  // Fill rows 17, 18, 19
  for (let y = 17; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      gameState.board.grid[y][x] = { color: '#f00000', id: 'Z' };
    }
  }
  restPieceOnTopOfRow(17);
});

Given('the board is set up for a 4-line clear', function() {
  // Fill rows 16, 17, 18, 19
  for (let y = 16; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      gameState.board.grid[y][x] = { color: '#f00000', id: 'Z' };
    }
  }
  gameState.currentPiece = new Tetromino('I');
  restPieceOnTopOfRow(16);
});

Given('the board is set up for a line clear with hard drop', function() {
  // Fill row 19 except the last 4 columns, sized for an I piece
  for (let x = 0; x < 6; x++) {
    gameState.board.grid[19][x] = { color: '#f00000', id: 'Z' };
  }
  gameState.currentPiece = new Tetromino('I');
  gameState.currentPiece.x = 6;
});

Given('the current piece is an I tetromino', function() {
  gameState.currentPiece = new Tetromino('I');
});

Given('the current piece is a tetromino', function() {
  gameState.currentPiece = new Tetromino(PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]);
});

Given('the current piece is not an O tetromino', function() {
  gameState.currentPiece = new Tetromino('I');
});

Given('the current piece is an O tetromino', function() {
  gameState.currentPiece = new Tetromino('O');
});

Given('the current piece is positioned at column {int}', function(col) {
  gameState.currentPiece.x = col;
});

Given('the piece is at the right edge', function() {
  // rotate() never changes x, only the shape - so a fresh horizontal I
  // piece (width 4) rotating to vertical (width 1) never collides with a
  // wall, regardless of x. To make the *next* rotation (back to width 4)
  // actually overflow the right wall by exactly 1 column - so the wall
  // kick's single-column left shift resolves it - first pre-rotate to the
  // narrow orientation, then position it one column further right than
  // the widest shape can tolerate.
  gameState.currentPiece.rotate();
  gameState.currentPiece.x = 7;
});

Given('the piece is at the left edge', function() {
  // Mirrors the right-edge setup: pre-rotate to the narrow orientation,
  // then push 1 column past the left wall so the next rotation (back to
  // width 4) overflows the left edge in a way only a rightward shift can
  // resolve (a leftward shift only makes it worse).
  gameState.currentPiece.rotate();
  gameState.currentPiece.x = -1;
});

Given('the piece is completely blocked from rotating', function() {
  // Create a situation where rotation is blocked
  gameState.currentPiece = new Tetromino('I');
  gameState.currentPiece.x = 0;
  gameState.currentPiece.y = 18;
  // Fill surrounding area to block rotation
  for (let x = 0; x < 5; x++) {
    gameState.board.grid[19][x] = { color: '#f00000', id: 'Z' };
  }
});

Given('the piece is already at the bottom', function() {
  gameState.currentPiece.y = 19 - gameState.currentPiece.shape.length + 1;
});

Given('the level is {int}', function(level) {
  gameState.level = level;
  gameState.gravityDelay = gameState.getGravityDelay();
});

Given('the lines cleared is {int}', function(lines) {
  gameState.linesCleared = lines;
});

Given('{int} lines have been cleared', function(lines) {
  gameState.linesCleared = lines;
});

Given('the player has played for a while', function() {
  gameState.score = 500;
  gameState.level = 2;
  gameState.linesCleared = 15;
});

Given('has accumulated some score', function() {
  gameState.score = 500;
});

// --- Direct GameBoard/Tetromino edge-case setup (bypasses GameState) -------

Given('a tetromino positioned partially above the board', function() {
  testBoard = new GameBoard();
  testPiece = new Tetromino('T'); // 2 rows tall
  testPiece.y = -1; // top row off-board, bottom row on-board
});

Given('a tetromino positioned entirely below the board', function() {
  testBoard = new GameBoard();
  testPiece = new Tetromino('O');
  testPiece.y = BOARD_HEIGHT; // fully below the visible board
});

Given('a tetromino positioned entirely above the board', function() {
  testBoard = new GameBoard();
  testPiece = new Tetromino('O');
  testPiece.y = -5; // fully above the visible board
});

Given('a fresh board and a centered tetromino', function() {
  testBoard = new GameBoard();
  testPiece = new Tetromino('T');
});

// --- Audio setup ------------------------------------------------------------

Given('a fresh audio manager', function() {
  audioManager = new AudioManager();
});

Given('the audio manager is muted', function() {
  audioManager.toggleMute();
  assert.strictEqual(audioManager.isMuted, true);
});

Given('the audio manager is unmuted', function() {
  audioManager.toggleMute();
  assert.strictEqual(audioManager.isMuted, false);
});

Given('a browser environment with only webkitAudioContext available', function() {
  // Simulates an older WebKit browser that only exposes the vendor-prefixed
  // constructor, exercising SynthAudioManager's `window.AudioContext ||
  // window.webkitAudioContext` fallback.
  savedAudioContext = window.AudioContext;
  window.AudioContext = undefined;
});

// ============================================================================
// WHEN Steps - Actions
// ============================================================================

When('the player moves left', function() {
  previous = snapshotState();
  gameState.moveLeft();
});

When('the player moves left {int} times', function(times) {
  previous = snapshotState();
  for (let i = 0; i < times; i++) {
    gameState.moveLeft();
  }
});

When('the player moves right', function() {
  previous = snapshotState();
  gameState.moveRight();
});

When('the player moves right {int} times', function(times) {
  previous = snapshotState();
  for (let i = 0; i < times; i++) {
    gameState.moveRight();
  }
});

When('the player tries to move into a locked piece', function() {
  previous = snapshotState();
  gameState.moveLeft();
});

When('the player hard drops', function() {
  previous = snapshotState();
  gameState.hardDrop();
});

When('the player hard drops multiple times until the top is full', function() {
  previous = snapshotState();
  while (!gameState.isGameOver && gameState.linesCleared < 100) {
    gameState.hardDrop();
  }
});

When('the player soft drops', function() {
  previous = snapshotState();
  gameState.softDrop();
});

When('the player soft drops {int} times', function(times) {
  previous = snapshotState();
  for (let i = 0; i < times; i++) {
    gameState.softDrop();
  }
});

When('the player soft drops {int} row', function(times) {
  previous = snapshotState();
  for (let i = 0; i < times; i++) {
    gameState.softDrop();
  }
});

When('the player soft drops until hitting the floor', function() {
  previous = snapshotState();
  while (!gameState.board.isColliding(gameState.currentPiece, 0, 1)) {
    gameState.softDrop();
  }
  gameState.softDrop(); // One more to lock
});

When('the player soft drops, then moves, then soft drops again', function() {
  previous = snapshotState();
  gameState.softDrop();
  gameState.moveLeft();
  gameState.softDrop();
});

When('the player rotates the piece', function() {
  previous = snapshotState();
  gameState.rotate();
});

When('the player rotates the piece {int} time', function(times) {
  previous = snapshotState();
  for (let i = 0; i < times; i++) {
    gameState.rotate();
  }
});

When('the player rotates the piece {int} times', function(times) {
  previous = snapshotState();
  for (let i = 0; i < times; i++) {
    gameState.rotate();
  }
});

When('the player rotates the piece multiple times', function() {
  previous = snapshotState();
  for (let i = 0; i < 10; i++) {
    gameState.rotate();
  }
});

When('the player tests rotation for each piece type', function() {
  rotationTestResults = PIECE_TYPES.map(type => {
    const piece = new Tetromino(type);
    const states = [piece.rotationState];
    for (let i = 0; i < 4; i++) {
      piece.rotate();
      states.push(piece.rotationState);
    }
    return { type, states };
  });
});

When('the player toggles pause', function() {
  previous = snapshotState();
  gameState.togglePause();
});

When('the player toggles pause to resume', function() {
  previous = snapshotState();
  gameState.togglePause();
});

When('the game is resumed', function() {
  previous = snapshotState();
  gameState.togglePause();
});

When('the player clears 10 lines', function() {
  gameState.linesCleared = 10;
  gameState.level = Math.floor(gameState.linesCleared / 10) + 1;
});

When('the player clears 10 more lines', function() {
  gameState.linesCleared += 10;
  gameState.level = Math.floor(gameState.linesCleared / 10) + 1;
});

When('the player clears {int} lines then {int} lines', function(first, second) {
  previous = snapshotState();

  const clearOneLine = () => {
    const row = 10;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      gameState.board.grid[row][x] = { color: '#f00000', id: 'Z' };
    }
    // Keep a small spawn area clear so locking the helper piece never
    // accidentally triggers game over or completes another row. Columns
    // 8-9 are used because "the board is nearly full" leaves a different
    // single gap column in each row (column = row % 10), and none of the
    // rows near the spawn area (0-1) use gap column 8 or 9.
    gameState.board.grid[0][8] = null;
    gameState.board.grid[0][9] = null;
    gameState.board.grid[1][8] = null;
    gameState.board.grid[1][9] = null;
    gameState.currentPiece = new Tetromino('O');
    gameState.currentPiece.x = 8;
    gameState.currentPiece.y = 0;
    gameState.lockCurrentPiece();
  };

  for (let i = 0; i < first; i++) clearOneLine();
  for (let i = 0; i < second; i++) clearOneLine();
});

When('a new piece lands', function() {
  previous = snapshotState();
  gameState.hardDrop();
});

When('the row is cleared', function() {
  previous = snapshotState();
  gameState.board.clearLines();
});

When('multiple pieces lock and complete several rows', function() {
  previous = snapshotState();
  clearBatchRows.forEach(row => {
    gameState.currentPiece = new Tetromino('I');
    gameState.currentPiece.x = 6;
    gameState.currentPiece.y = row;
    gameState.lockCurrentPiece();
  });
});

When('the player resets the game', function() {
  gameState.reset();
});

When('time passes', function() {
  previous = snapshotState();
  // 1000ms comfortably exceeds any level's gravity delay (max 800ms, min
  // 100ms), so this reliably triggers a gravity tick whenever the game
  // isn't paused/over, and reliably does nothing when it is.
  gameState.update(1000);
});

When('a small amount of time passes', function() {
  previous = snapshotState();
  // Deliberately smaller than the level 1 gravity delay (800ms) so the
  // gravity counter accumulates without yet crossing the threshold.
  gameState.update(100);
});

When('the level increases to {int}', function(newLevel) {
  gameState.level = newLevel;
  gameState.gravityDelay = gameState.getGravityDelay();
});

When('the level is set to several representative values', function() {
  const levels = [1, 2, 3, 5, 10, 14, 15, 20, 50];
  gravityDelaySamples = levels.map(level => {
    gameState.level = level;
    return { level, delay: gameState.getGravityDelay() };
  });
});

When('a new game starts', function() {
  gameState = new GameState();
  previous = snapshotState();
});

// --- Direct GameBoard/Tetromino edge-case actions ---------------------------

When('the tetromino is locked onto an empty board', function() {
  testBoard.lockPiece(testPiece);
});

// --- Audio actions -----------------------------------------------------------

When('the rotate sound is played', function() {
  audioManager.playRotate();
});

When('the lock sound is played', function() {
  audioManager.playLock();
});

When('the line clear sound is played', async function() {
  audioManager.playLineClear();
  // playLineClear schedules 3 beeps up to 200ms apart; wait long enough
  // for all of them to have fired before asserting.
  await new Promise(resolve => setTimeout(resolve, 300));
});

When('the game over sound is played', async function() {
  audioManager.playGameOver();
  // playGameOver schedules 3 beeps up to 300ms apart.
  await new Promise(resolve => setTimeout(resolve, 400));
});

When('a beep is played with no frequency or duration specified', function() {
  audioManager.playBeep();
});

When('a fresh audio manager is created', function() {
  audioManager = new AudioManager();
  // Restore immediately so later scenarios aren't affected.
  window.AudioContext = savedAudioContext;
});

// ============================================================================
// THEN Steps - Assertions
// ============================================================================

Then('the piece x position should decrease by {int}', function(amount) {
  assert.strictEqual(gameState.currentPiece.x, previous.x - amount);
});

Then('the piece x position should increase by {int}', function(amount) {
  assert.strictEqual(gameState.currentPiece.x, previous.x + amount);
});

Then('the piece should be at column {int}', function(col) {
  assert.strictEqual(gameState.currentPiece.x, col);
});

Then('the piece should be at its rightmost valid column', function() {
  const maxX = BOARD_WIDTH - gameState.currentPiece.shape[0].length;
  assert.strictEqual(gameState.currentPiece.x, maxX);
});

Then('x position should not go below {int}', function(min) {
  assert.strictEqual(gameState.currentPiece.x, min);
});

Then('the piece position should not change', function() {
  assert.strictEqual(gameState.currentPiece.x, previous.x);
  assert.strictEqual(gameState.currentPiece.y, previous.y);
});

Then('the piece position should change', function() {
  assert(
    gameState.currentPiece.x !== previous.x || gameState.currentPiece.y !== previous.y,
    'Expected the piece position to change'
  );
});

Then('the piece position should remain unchanged', function() {
  assert.strictEqual(gameState.currentPiece.x, previous.x);
  assert.strictEqual(gameState.currentPiece.y, previous.y);
});

Then('the piece y position should be {int}', function(y) {
  assert.strictEqual(gameState.currentPiece.y, y);
});

Then('the piece y position should increase by {int}', function(amount) {
  assert.strictEqual(gameState.currentPiece.y, previous.y + amount);
});

Then('the piece y position should not change', function() {
  assert.strictEqual(gameState.currentPiece.y, previous.y);
});

Then('the piece y position should change', function() {
  assert.notStrictEqual(gameState.currentPiece.y, previous.y);
});

Then('score should increase', function() {
  assert(gameState.score > previous.score, 'Expected the score to have increased');
});

Then('the score should increase by {int}', function(points) {
  assert.strictEqual(gameState.score - previous.score, points);
});

Then('the score should be {int}', function(score) {
  assert.strictEqual(gameState.score, score);
});

Then('the score should increase according to the hard drop formula', function() {
  // Hard drop awards exactly 2 points per row the piece travelled, on top
  // of any line-clear bonus. previous.piece is the same object that was
  // dropped (lockCurrentPiece mutates it in place before swapping
  // currentPiece to the next piece), so its y now holds the landing row.
  const rowsMoved = previous.piece.y - previous.y;
  const linesClearedThisAction = gameState.linesCleared - previous.linesCleared;
  const expected = rowsMoved * 2 + LINE_CLEAR_POINTS[linesClearedThisAction] * previous.level;
  assert.strictEqual(gameState.score - previous.score, expected);
});

Then('the score should not increase from the drop', function() {
  assert.strictEqual(gameState.score, previous.score);
});

Then('the rotation state should be {int}', function(state) {
  assert.strictEqual(gameState.currentPiece.rotationState, state);
});

Then('the rotation state should not change', function() {
  assert.strictEqual(gameState.currentPiece.rotationState, previous.rotationState);
});

Then('the rotation state should change', function() {
  assert.notStrictEqual(gameState.currentPiece.rotationState, previous.rotationState);
});

Then('rotation state should cycle through all states', function() {
  // The piece may already have been rotated any number of times, so don't
  // assume it starts at state 0 - just verify that 4 more rotations visit
  // all 4 distinct states and return to where they started.
  const startState = gameState.currentPiece.rotationState;
  const seen = new Set([startState]);
  for (let i = 0; i < 3; i++) {
    gameState.rotate();
    seen.add(gameState.currentPiece.rotationState);
  }
  gameState.rotate();
  assert.strictEqual(gameState.currentPiece.rotationState, startState, 'Should return to the start state after 4 rotations');
  assert.strictEqual(seen.size, 4, 'Should visit all 4 distinct rotation states');
});

Then('{int} line should be cleared', function(count) {
  assert.strictEqual(gameState.linesCleared - previous.linesCleared, count);
});

Then('{int} lines should be cleared', function(count) {
  assert.strictEqual(gameState.linesCleared - previous.linesCleared, count);
});

Then('no lines should be cleared', function() {
  assert.strictEqual(gameState.linesCleared - previous.linesCleared, 0);
});

Then('the completed row should be removed', function() {
  assert(gameState.board.grid[19].every(cell => cell === null));
});

Then('both completed rows should be removed', function() {
  assert(gameState.board.grid.every(row => !row.every(cell => cell !== null)));
});

Then('all completed rows should be removed', function() {
  assert(gameState.board.grid.every(row => !row.every(cell => cell !== null)));
});

Then('rows above should cascade down', function() {
  // No row should still be fully complete, and the board must keep its
  // exact height after the splice/unshift cascade.
  assert.strictEqual(gameState.board.grid.length, BOARD_HEIGHT);
  assert(gameState.board.grid.every(row => !row.every(cell => cell !== null)));
});

Then('the board state should remain unchanged', function() {
  assert.deepStrictEqual(gameState.board.grid, previous.board);
});

Then('the incomplete row should remain incomplete', function() {
  // A hard drop still locks the falling piece somewhere on the board, so
  // the board as a whole does change - what must NOT change is that row
  // 19's gap is still there (i.e. it was never completed and cleared).
  assert(gameState.board.grid[19].some(cell => cell === null), 'Row 19 should still have its gap');
});

Then('both rows should be cleared', function() {
  assert.strictEqual(gameState.linesCleared - previous.linesCleared, 2);
});

Then('the gap between them should be removed', function() {
  // After removing the two non-adjacent complete rows and cascading, the
  // board must still be exactly BOARD_HEIGHT rows tall.
  assert.strictEqual(gameState.board.grid.length, BOARD_HEIGHT);
});

Then('the top row should be removed', function() {
  assert(gameState.board.grid[0].every(cell => cell === null));
});

Then('all rows below should cascade up', function() {
  assert(gameState.board.grid.every(row => row.every(cell => cell === null)));
});

Then('the bottom row should be removed', function() {
  assert(gameState.board.grid[19].every(cell => cell === null));
});

Then('a new empty row should appear at the top', function() {
  assert(gameState.board.grid[0].every(cell => cell === null));
});

Then('all complete rows should be cleared', function() {
  assert.strictEqual(gameState.linesCleared - previous.linesCleared, clearBatchRows.length);
});

Then('score should accumulate for each clear', function() {
  const expected = clearBatchRows.length * LINE_CLEAR_POINTS[1] * previous.level;
  assert.strictEqual(gameState.score - previous.score, expected);
});

Then('the piece should move successfully', function() {
  assert.notStrictEqual(gameState.currentPiece.x, previous.x);
});

Then('no collision should be detected', function() {
  assert.strictEqual(gameState.board.isColliding(gameState.currentPiece, 0, 0), false);
});

Then('no collision should be detected for that tetromino', function() {
  assert.strictEqual(testBoard.isColliding(testPiece, 0, 0), false);
});

Then('the piece should lock', function() {
  assert(
    gameState.isGameOver || gameState.currentPiece !== previous.piece,
    'Expected the piece to have locked'
  );
});

Then('the piece should lock immediately', function() {
  assert(
    gameState.isGameOver || gameState.currentPiece !== previous.piece,
    'Expected the piece to have locked immediately'
  );
});

Then('the current piece should be locked', function() {
  assert(
    gameState.isGameOver || gameState.currentPiece !== previous.piece,
    'Expected the dropped piece to have locked'
  );
});

Then('a new piece should spawn', function() {
  assert.notStrictEqual(gameState.currentPiece, previous.piece);
});

Then('a new current piece should exist', function() {
  assert(gameState.currentPiece !== null);
});

Then('a new next piece should exist', function() {
  assert(gameState.nextPiece !== null);
});

Then('the piece should not move into the locked pieces', function() {
  assert.strictEqual(gameState.currentPiece.x, previous.x);
});

Then('the piece should not pass through locked pieces', function() {
  const blocks = previous.piece.getBlocks();
  assert(blocks.every(b => b.y < 15), 'Piece should have locked above the floor, not inside/through it');
});

Then('the piece should remain at column {int}', function(col) {
  assert.strictEqual(gameState.currentPiece.x, col);
});

Then('the piece should shift left', function() {
  assert(gameState.currentPiece.x < previous.x, 'Expected the piece to shift left');
});

Then('the piece should shift right', function() {
  assert(gameState.currentPiece.x > previous.x, 'Expected the piece to shift right');
});

Then('the rotation should succeed', function() {
  assert.strictEqual(gameState.currentPiece.rotationState, (previous.rotationState + 1) % 4);
});

Then('the rotation should fail', function() {
  assert.strictEqual(gameState.currentPiece.rotationState, previous.rotationState);
});

Then('the rotation should revert to original state', function() {
  assert.strictEqual(gameState.currentPiece.rotationState, previous.rotationState);
});

Then('the piece should remain in original position', function() {
  assert.strictEqual(gameState.currentPiece.x, previous.x);
  assert.strictEqual(gameState.currentPiece.y, previous.y);
});

Then('the piece shape should remain unchanged', function() {
  assert.deepStrictEqual(gameState.currentPiece.shape, previous.shape);
});

Then('each piece type should rotate successfully', function() {
  rotationTestResults.forEach(({ type, states }) => {
    assert.strictEqual(states[1], 1, `${type} should rotate to state 1`);
  });
});

Then('rotation state should cycle correctly', function() {
  rotationTestResults.forEach(({ type, states }) => {
    assert.deepStrictEqual(states, [0, 1, 2, 3, 0], `${type} rotation states should cycle 0-1-2-3-0`);
  });
});

Then('the piece should move to its final landing position', function() {
  assert(
    gameState.board.isColliding(previous.piece, 0, 1),
    'Expected the piece to have landed (no further downward movement possible)'
  );
});

Then('lines should be cleared', function() {
  assert(gameState.linesCleared - previous.linesCleared >= 1);
});

Then('score should include both hard drop and line clear points', function() {
  const rowsMoved = previous.piece.y - previous.y;
  const linesClearedThisAction = gameState.linesCleared - previous.linesCleared;
  assert(linesClearedThisAction >= 1, 'Expected at least one line to have been cleared');
  const expected = rowsMoved * 2 + LINE_CLEAR_POINTS[linesClearedThisAction] * previous.level;
  assert.strictEqual(gameState.score - previous.score, expected);
});

Then('the level should be {int}', function(level) {
  assert.strictEqual(gameState.level, level);
});

Then('the lines cleared should be {int}', function(lines) {
  assert.strictEqual(gameState.linesCleared, lines);
});

Then('the board should be empty', function() {
  const empty = gameState.board.grid.every(row => row.every(cell => cell === null));
  assert(empty, 'Board should be empty');
});

Then('all cells should be null', function() {
  const allNull = gameState.board.grid.every(row => row.every(cell => cell === null));
  assert(allNull, 'All cells should be null');
});

Then('a piece should be active', function() {
  assert(gameState.currentPiece !== null);
});

Then('the piece x position should be centered', function() {
  const expectedX = Math.floor((BOARD_WIDTH - gameState.currentPiece.shape[0].length) / 2);
  assert.strictEqual(gameState.currentPiece.x, expectedX);
});

Then('a next piece should be visible', function() {
  assert(gameState.nextPiece !== null);
});

Then('the next piece should be a valid tetromino type', function() {
  assert(PIECE_TYPES.includes(gameState.nextPiece.id));
});

Then('the game should not be paused', function() {
  assert.strictEqual(gameState.isPaused, false);
});

Then('the game should not be over', function() {
  assert.strictEqual(gameState.isGameOver, false);
});

Then('the current piece should exist', function() {
  assert(gameState.currentPiece !== null);
});

Then('the current piece should be a valid tetromino', function() {
  assert(PIECE_TYPES.includes(gameState.currentPiece.id));
});

Then('the next piece should be one of: I, O, T, S, Z, J, L', function() {
  assert(PIECE_TYPES.includes(gameState.nextPiece.id));
});

Then('the current piece should be one of: I, O, T, S, Z, J, L', function() {
  assert(PIECE_TYPES.includes(gameState.currentPiece.id));
});

Then('game over should be triggered', function() {
  assert.strictEqual(gameState.isGameOver, true);
});

Then('the isGameOver flag should be true', function() {
  assert.strictEqual(gameState.isGameOver, true);
});

Then('the isGameOver flag should be false', function() {
  assert.strictEqual(gameState.isGameOver, false);
});

Then('the piece should not move', function() {
  assert.strictEqual(gameState.currentPiece.x, previous.x);
  assert.strictEqual(gameState.currentPiece.y, previous.y);
});

Then('the piece should not move or lock', function() {
  assert.strictEqual(gameState.currentPiece, previous.piece);
  assert.strictEqual(gameState.currentPiece.x, previous.x);
  assert.strictEqual(gameState.currentPiece.y, previous.y);
});

Then('the game should be paused', function() {
  assert.strictEqual(gameState.isPaused, true);
});

Then('the gravity delay should be {int}ms', function(ms) {
  assert.strictEqual(gameState.gravityDelay, ms);
});

Then('the gravity delay should match the formula at each level', function() {
  const expectedByLevel = {
    1: 800, 2: 750, 3: 700, 5: 600, 10: 350, 14: 150, 15: 100, 20: 100, 50: 100,
  };
  gravityDelaySamples.forEach(({ level, delay }) => {
    assert.strictEqual(delay, expectedByLevel[level], `Level ${level} should have gravity delay ${expectedByLevel[level]}`);
  });
});

Then('increasing level should not decrease delay further', function() {
  const oldDelay = gameState.gravityDelay;
  gameState.level += 1;
  gameState.gravityDelay = gameState.getGravityDelay();
  assert.strictEqual(gameState.gravityDelay, oldDelay);
});

Then('gravity timer should not advance', function() {
  assert.strictEqual(gameState.gravityCounter, previous.gravityCounter);
});

Then('the piece should not fall', function() {
  assert.strictEqual(gameState.currentPiece.y, previous.y);
});

Then('the piece should fall due to gravity', function() {
  assert(gameState.currentPiece.y > previous.y, 'Expected the piece to have fallen');
});

Then('the score should remain unchanged', function() {
  assert.strictEqual(gameState.score, previous.score);
});

Then('the score should accumulate correctly', function() {
  assert.strictEqual(gameState.score - previous.score, 2);
});

Then('total score should accumulate correctly', function() {
  const linesClearedThisAction = gameState.linesCleared - previous.linesCleared;
  const expected = linesClearedThisAction * LINE_CLEAR_POINTS[1] * previous.level;
  assert.strictEqual(gameState.score - previous.score, expected);
});

// --- Direct GameBoard/Tetromino edge-case assertions ------------------------

Then('only the in-bounds blocks should be written to the board', function() {
  const blocks = testPiece.getBlocks();
  const inBounds = blocks.filter(b => b.y >= 0);
  const outOfBounds = blocks.filter(b => b.y < 0);
  assert(inBounds.length > 0, 'Expected at least one in-bounds block');
  assert(outOfBounds.length > 0, 'Expected at least one out-of-bounds block to exercise the skip branch');
  inBounds.forEach(b => {
    assert(testBoard.grid[b.y][b.x] !== null, 'In-bounds block should be written to the board');
  });
  assert.strictEqual(testBoard.grid.length, BOARD_HEIGHT);
});

Then('the board should not consider it game over', function() {
  assert.strictEqual(testBoard.isGameOver(testPiece), false);
});

Then('no collision should be detected for that tetromino with no offset given', function() {
  // Exercises isColliding's default deltaX/deltaY parameters (0, 0),
  // which every other call site in the codebase always passes explicitly.
  assert.strictEqual(testBoard.isColliding(testPiece), false);
});

// --- Audio assertions --------------------------------------------------------

Then('a beep of {int}Hz for {int}ms should have been played', function(freq, duration) {
  assert.deepStrictEqual(audioManager.audioContext.calls, [{ frequency: freq, duration }]);
});

Then('no beep should have been played', function() {
  assert.deepStrictEqual(audioManager.audioContext.calls, []);
});

Then('it should use the webkitAudioContext', function() {
  assert(audioManager.audioContext instanceof window.webkitAudioContext);
});

Then('beeps of {int}Hz, {int}Hz and {int}Hz for {int}ms each should have been played in order', function(f1, f2, f3, dur) {
  assert.deepStrictEqual(audioManager.audioContext.calls, [
    { frequency: f1, duration: dur },
    { frequency: f2, duration: dur },
    { frequency: f3, duration: dur },
  ]);
});

Then('beeps of {int}Hz for {int}ms, {int}Hz for {int}ms and {int}Hz for {int}ms should have been played in order', function(f1, d1, f2, d2, f3, d3) {
  assert.deepStrictEqual(audioManager.audioContext.calls, [
    { frequency: f1, duration: d1 },
    { frequency: f2, duration: d2 },
    { frequency: f3, duration: d3 },
  ]);
});
