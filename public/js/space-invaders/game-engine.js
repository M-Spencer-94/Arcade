const GAME_WIDTH = 300;
const GAME_HEIGHT = 380;

const INVADER_ROWS = 5;
const INVADER_COLS = 8;
const INVADER_WIDTH = 24;
const INVADER_HEIGHT = 16;
const INVADER_H_SPACING = 6;
const INVADER_V_SPACING = 10;
const FORMATION_START_X = (GAME_WIDTH - (INVADER_COLS * INVADER_WIDTH + (INVADER_COLS - 1) * INVADER_H_SPACING)) / 2;
const FORMATION_START_Y = 30;
// Row 0 is the top row, worth the most points - classic arcade convention.
const ROW_POINTS = [30, 20, 20, 10, 10];

const FORMATION_STEP_DISTANCE = 8;
const FORMATION_DROP_DISTANCE = 16;
const BASE_STEP_INTERVAL = 800;
const WAVE_STEP_SPEEDUP = 80;
const WAVE_MIN_STEP_INTERVAL = 300;
const MIN_STEP_INTERVAL = 80;

const BASE_SHOT_INTERVAL = 1200;
const WAVE_SHOT_SPEEDUP = 100;
const WAVE_MIN_SHOT_INTERVAL = 400;
const MAX_INVADER_BULLETS = 3;

const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 14;
const PLAYER_Y = GAME_HEIGHT - 40;
const PLAYER_START_X = (GAME_WIDTH - PLAYER_WIDTH) / 2;
const PLAYER_SPEED = 0.18; // px/ms

const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 10;
const PLAYER_BULLET_SPEED = -0.3; // px/ms, negative = upward
const INVADER_BULLET_SPEED = 0.15; // px/ms, positive = downward

const STARTING_LIVES = 3;

function buildFormation() {
  const invaders = [];
  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      invaders.push({ row, col, alive: true });
    }
  }
  return invaders;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

class GameState {
  constructor() {
    this.wave = 1;
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.isGameOver = false;
    this.isPaused = false;

    this.invaders = buildFormation();
    this.formationDirection = 1;
    this.formationOffsetX = 0;
    this.formationOffsetY = 0;
    this.formationStepTimer = 0;

    this.player = { x: PLAYER_START_X, moving: null };
    this.playerBullet = null;
    this.invaderBullets = [];
    this.invaderShotTimer = 0;

    // Last thing that happened this tick, for main.js to react to (sound
    // effects) without engine code needing to know about audio at all.
    this.lastEvent = null;
  }

  setPlayerMoving(direction) {
    this.player.moving = direction;
  }

  stopPlayerMoving() {
    this.player.moving = null;
  }

  playerShoot() {
    if (this.isGameOver || this.isPaused || this.playerBullet) return;
    this.playerBullet = { x: this.player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2, y: PLAYER_Y };
  }

  aliveCount() {
    return this.invaders.reduce((count, inv) => count + (inv.alive ? 1 : 0), 0);
  }

  getInvaderPosition(invader) {
    const baseX = FORMATION_START_X + invader.col * (INVADER_WIDTH + INVADER_H_SPACING);
    const baseY = FORMATION_START_Y + invader.row * (INVADER_HEIGHT + INVADER_V_SPACING);
    return { x: baseX + this.formationOffsetX, y: baseY + this.formationOffsetY };
  }

  getFormationBounds() {
    let minX = Infinity;
    let maxX = -Infinity;
    for (const invader of this.invaders) {
      if (!invader.alive) continue;
      const pos = this.getInvaderPosition(invader);
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + INVADER_WIDTH);
    }
    return { minX, maxX };
  }

  getStepInterval() {
    const totalInvaders = INVADER_ROWS * INVADER_COLS;
    const aliveRatio = this.aliveCount() / totalInvaders;
    const waveBase = Math.max(WAVE_MIN_STEP_INTERVAL, BASE_STEP_INTERVAL - (this.wave - 1) * WAVE_STEP_SPEEDUP);
    return Math.max(MIN_STEP_INTERVAL, Math.round(waveBase * aliveRatio));
  }

  getShotInterval() {
    return Math.max(WAVE_MIN_SHOT_INTERVAL, BASE_SHOT_INTERVAL - (this.wave - 1) * WAVE_SHOT_SPEEDUP);
  }

  updatePlayer(deltaTime) {
    if (this.player.moving === 'left') {
      this.player.x -= PLAYER_SPEED * deltaTime;
    } else if (this.player.moving === 'right') {
      this.player.x += PLAYER_SPEED * deltaTime;
    }
    this.player.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, this.player.x));
  }

  updateFormation(deltaTime) {
    if (this.aliveCount() === 0) {
      this.nextWave();
      return;
    }

    this.formationStepTimer += deltaTime;
    const interval = this.getStepInterval();
    if (this.formationStepTimer < interval) return;
    this.formationStepTimer -= interval;

    const bounds = this.getFormationBounds();
    const proposedMinX = bounds.minX + this.formationDirection * FORMATION_STEP_DISTANCE;
    const proposedMaxX = bounds.maxX + this.formationDirection * FORMATION_STEP_DISTANCE;

    if (proposedMinX < 0 || proposedMaxX > GAME_WIDTH) {
      this.formationDirection *= -1;
      this.formationOffsetY += FORMATION_DROP_DISTANCE;
    } else {
      this.formationOffsetX += this.formationDirection * FORMATION_STEP_DISTANCE;
    }
  }

  updateInvaderShooting(deltaTime) {
    this.invaderShotTimer += deltaTime;
    const interval = this.getShotInterval();
    if (this.invaderShotTimer < interval) return;
    this.invaderShotTimer -= interval;

    if (this.invaderBullets.length >= MAX_INVADER_BULLETS) return;

    const aliveCols = [...new Set(this.invaders.filter((inv) => inv.alive).map((inv) => inv.col))];
    if (aliveCols.length === 0) return;

    const chosenCol = aliveCols[Math.floor(Math.random() * aliveCols.length)];
    const columnInvaders = this.invaders.filter((inv) => inv.alive && inv.col === chosenCol);
    const shooter = columnInvaders.reduce((lowest, inv) => (inv.row > lowest.row ? inv : lowest));
    const pos = this.getInvaderPosition(shooter);

    this.invaderBullets.push({ x: pos.x + INVADER_WIDTH / 2 - BULLET_WIDTH / 2, y: pos.y + INVADER_HEIGHT });
  }

  updateBullets(deltaTime) {
    if (this.playerBullet) {
      this.playerBullet.y += PLAYER_BULLET_SPEED * deltaTime;
      if (this.playerBullet.y + BULLET_HEIGHT < 0) this.playerBullet = null;
    }

    this.invaderBullets = this.invaderBullets.filter((bullet) => {
      bullet.y += INVADER_BULLET_SPEED * deltaTime;
      return bullet.y < GAME_HEIGHT;
    });
  }

  handlePlayerBulletCollisions() {
    if (!this.playerBullet) return;
    const bulletRect = { x: this.playerBullet.x, y: this.playerBullet.y, width: BULLET_WIDTH, height: BULLET_HEIGHT };

    for (const invader of this.invaders) {
      if (!invader.alive) continue;
      const pos = this.getInvaderPosition(invader);
      const invaderRect = { x: pos.x, y: pos.y, width: INVADER_WIDTH, height: INVADER_HEIGHT };

      if (rectsOverlap(bulletRect, invaderRect)) {
        invader.alive = false;
        this.score += ROW_POINTS[invader.row];
        this.playerBullet = null;
        this.lastEvent = 'invaderHit';
        break;
      }
    }
  }

  handleInvaderBulletCollisions() {
    const playerRect = { x: this.player.x, y: PLAYER_Y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };

    for (let i = this.invaderBullets.length - 1; i >= 0; i--) {
      const bullet = this.invaderBullets[i];
      const bulletRect = { x: bullet.x, y: bullet.y, width: BULLET_WIDTH, height: BULLET_HEIGHT };

      if (rectsOverlap(bulletRect, playerRect)) {
        this.invaderBullets.splice(i, 1);
        this.loseLife();
        break;
      }
    }
  }

  checkInvasion() {
    if (this.isGameOver) return;
    for (const invader of this.invaders) {
      if (!invader.alive) continue;
      const pos = this.getInvaderPosition(invader);
      if (pos.y + INVADER_HEIGHT >= PLAYER_Y) {
        this.isGameOver = true;
        return;
      }
    }
  }

  loseLife() {
    this.lives -= 1;
    this.lastEvent = 'playerHit';
    if (this.lives <= 0) {
      this.isGameOver = true;
    } else {
      this.playerBullet = null;
      this.invaderBullets = [];
      this.player.x = PLAYER_START_X;
    }
  }

  nextWave() {
    this.wave += 1;
    this.invaders = buildFormation();
    this.formationDirection = 1;
    this.formationOffsetX = 0;
    this.formationOffsetY = 0;
    this.formationStepTimer = 0;
    this.playerBullet = null;
    this.invaderBullets = [];
    this.lastEvent = 'waveClear';
  }

  update(deltaTime) {
    if (this.isGameOver || this.isPaused) return;

    this.updatePlayer(deltaTime);
    this.updateFormation(deltaTime);
    this.updateInvaderShooting(deltaTime);
    this.updateBullets(deltaTime);
    this.handlePlayerBulletCollisions();
    this.handleInvaderBulletCollisions();
    this.checkInvasion();
  }

  reset() {
    this.wave = 1;
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.isGameOver = false;
    this.isPaused = false;
    this.invaders = buildFormation();
    this.formationDirection = 1;
    this.formationOffsetX = 0;
    this.formationOffsetY = 0;
    this.formationStepTimer = 0;
    this.player = { x: PLAYER_START_X, moving: null };
    this.playerBullet = null;
    this.invaderBullets = [];
    this.invaderShotTimer = 0;
    this.lastEvent = null;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }
}

// Export for Node.js (testing)
/* istanbul ignore next -- browser-vs-Node compatibility guard; the else
   branch can't execute under a Node-based test run. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GAME_WIDTH,
    GAME_HEIGHT,
    INVADER_ROWS,
    INVADER_COLS,
    INVADER_WIDTH,
    INVADER_HEIGHT,
    FORMATION_START_X,
    FORMATION_START_Y,
    ROW_POINTS,
    FORMATION_STEP_DISTANCE,
    FORMATION_DROP_DISTANCE,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    PLAYER_Y,
    PLAYER_START_X,
    BULLET_WIDTH,
    BULLET_HEIGHT,
    MAX_INVADER_BULLETS,
    STARTING_LIVES,
    buildFormation,
    rectsOverlap,
    GameState
  };
}
