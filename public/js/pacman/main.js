const GAME_ID = 'pacman';

let gameState;
let renderer;
let audioManager;
let lastTime = 0;

function initGame() {
  const canvas = document.getElementById('game-canvas');
  gameState = new GameState();
  renderer = new Renderer(canvas);
  audioManager = new AudioManager();

  updateUI();
  renderer.render(gameState);
}

function updateUI() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('level').textContent = gameState.level;
  document.getElementById('lives').textContent = gameState.lives;
}

const KEY_TO_DIRECTION = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

window.addEventListener('keydown', (e) => {
  const dir = KEY_TO_DIRECTION[e.key];
  if (dir) {
    gameState.movePlayerDirection(dir);
    e.preventDefault();
  } else if (e.key === 'Enter') {
    gameState.togglePause();
    updatePauseButton();
    e.preventDefault();
  }
});

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

function playEatSound(event) {
  switch (event) {
    case 'dot':
      audioManager.playChomp();
      break;
    case 'power':
      audioManager.playPowerPellet();
      break;
    case 'ghost':
      audioManager.playGhostEaten();
      break;
    case 'death':
      audioManager.playDeath();
      break;
    case 'levelComplete':
      audioManager.playLevelComplete();
      break;
  }
}

// On game over, offer a name-entry prompt when the score qualifies for the
// top 10; otherwise fall back to the plain game-over overlay. If the
// leaderboard API is unreachable, fail open to the plain overlay rather
// than blocking the player from seeing their game ended.
async function handleGameOver() {
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

  gameState.update(deltaTime);

  if (gameState.lastEatEvent) {
    playEatSound(gameState.lastEatEvent);
    gameState.lastEatEvent = null;
  }

  renderer.updateAnimation();
  renderer.render(gameState);
  updateUI();

  if (gameState.isGameOver) {
    handleGameOver();
  } else {
    requestAnimationFrame(gameLoop);
  }
}

// Start game when page loads
document.addEventListener('DOMContentLoaded', () => {
  initGame();
  requestAnimationFrame(gameLoop);
});
