const GAME_ID = 'tetris';

// Global game state
let gameState;
let renderer;
let audioManager;
let lastTime = 0;

// Initialize game
function initGame() {
  const canvas = document.getElementById('game-canvas');
  const nextPreviewCanvas = document.getElementById('next-preview');

  gameState = new GameState();
  renderer = new Renderer(canvas, nextPreviewCanvas);
  audioManager = new AudioManager();

  updateUI();
  renderer.render(gameState);
}

// Update UI elements
function updateUI() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('level').textContent = gameState.level;
  document.getElementById('lines').textContent = gameState.linesCleared;
}

// Handle keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  switch (e.key) {
    case 'ArrowLeft':
      gameState.moveLeft();
      audioManager.playBeep(700, 50);
      e.preventDefault();
      break;
    case 'ArrowRight':
      gameState.moveRight();
      audioManager.playBeep(700, 50);
      e.preventDefault();
      break;
    case 'ArrowDown':
      gameState.softDrop();
      e.preventDefault();
      break;
    case ' ':
      gameState.hardDrop();
      audioManager.playBeep(900, 100);
      e.preventDefault();
      break;
    case 'Enter':
      gameState.togglePause();
      e.preventDefault();
      break;
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Debounce rapid rotations
let lastRotateTime = 0;
const rotateDebounceTime = 100;

function attemptRotate() {
  const now = Date.now();
  if (now - lastRotateTime > rotateDebounceTime) {
    gameState.rotate();
    audioManager.playRotate();
    lastRotateTime = now;
  }
}

// Arrow up for rotation
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    attemptRotate();
    e.preventDefault();
  }
});

// Keyboard held down handling for continuous soft drop
function handleHeldKeys() {
  if (keys['ArrowDown'] && !gameState.isPaused && !gameState.isGameOver) {
    // Soft drop is already handled on key down, this adds continuous soft drop
    // Could be enhanced with faster gravity when held
  }
}

// Button controls
document.getElementById('pause-btn').addEventListener('click', () => {
  gameState.togglePause();
  updatePauseButton();
});

document.getElementById('mute-btn').addEventListener('click', () => {
  const isMuted = audioManager.toggleMute();
  const btn = document.getElementById('mute-btn');
  btn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
});

document.getElementById('restart-btn').addEventListener('click', () => {
  hideGameOverOverlay();
  gameState.reset();
  updateUI();
  lastTime = 0;
  requestAnimationFrame(gameLoop);
});

document.getElementById('leaderboard-btn').addEventListener('click', async () => {
  try {
    const { entries } = await LeaderboardClient.fetchTop(GAME_ID);
    LeaderboardUI.showLeaderboardOverlay({
      overlayEl: document.getElementById('leaderboard-overlay'),
      game: GAME_ID,
      entries
    });
  } catch (err) {
    // Leaderboard service unreachable - nothing to show, leave the button inert.
  }
});

function updatePauseButton() {
  const btn = document.getElementById('pause-btn');
  btn.textContent = gameState.isPaused ? 'Resume' : 'Pause';
}

function showGameOverOverlay() {
  const overlay = document.getElementById('game-over-overlay');
  document.getElementById('final-score').textContent = `Score: ${gameState.score}`;
  overlay.classList.remove('hidden');
}

function hideGameOverOverlay() {
  const overlay = document.getElementById('game-over-overlay');
  overlay.classList.add('hidden');
}

// On game over, offer a name-entry prompt when the score qualifies for the
// top 10; otherwise fall back to the plain game-over overlay. If the
// leaderboard API is unreachable, fail open to the plain overlay rather
// than blocking the player from seeing their game ended.
async function handleGameOver() {
  audioManager.playGameOver();

  try {
    const { entries } = await LeaderboardClient.fetchTop(GAME_ID);
    if (LeaderboardClient.qualifies(entries, gameState.score)) {
      LeaderboardUI.showNameEntryModal({
        overlayEl: document.getElementById('name-entry-overlay'),
        score: gameState.score,
        onSubmit: async (name) => {
          const result = await LeaderboardClient.submitScore(GAME_ID, name, gameState.score);
          LeaderboardUI.showLeaderboardOverlay({
            overlayEl: document.getElementById('leaderboard-overlay'),
            game: GAME_ID,
            entries: result.entries,
            highlightRank: result.rank
          });
        }
      });
      return;
    }
  } catch (err) {
    // fall through to the plain overlay below
  }

  showGameOverOverlay();
}

// Main game loop
function gameLoop(currentTime) {
  if (lastTime === 0) {
    lastTime = currentTime;
  }

  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  // Update game state
  gameState.update(deltaTime);

  // Handle held keys for continuous movement
  handleHeldKeys();

  // Update renderer animation state
  renderer.updateAnimation();

  // Render
  renderer.render(gameState);

  // Update UI
  updateUI();

  // Check for game over
  if (gameState.isGameOver) {
    handleGameOver();
  } else {
    // Continue loop only if game is not over
    requestAnimationFrame(gameLoop);
  }
}

// Start game when page loads
document.addEventListener('DOMContentLoaded', () => {
  initGame();
  requestAnimationFrame(gameLoop);
});
