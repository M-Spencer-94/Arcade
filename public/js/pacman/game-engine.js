// A small hardcoded maze (basic scope - not a pixel-accurate recreation of
// the arcade original). # = wall, . = dot, o = power pellet. Row 7 is the
// tunnel row: it has no walls at column 0 or 14, so movement wraps there.
const MAZE_TEMPLATE = [
  '###############',
  '#o...........o#',
  '#.##.#####.##.#',
  '#.............#',
  '#.###.#.#.###.#',
  '#.............#',
  '#.##.#####.##.#',
  '...............',
  '#.##.#####.##.#',
  '#.............#',
  '#.###.#.#.###.#',
  '#.............#',
  '#.##.#####.##.#',
  '#o...........o#',
  '###############'
];

const MAZE_COLS = MAZE_TEMPLATE[0].length;
const MAZE_ROWS = MAZE_TEMPLATE.length;

const CELL_WALL = 0;
const CELL_EMPTY = 1;
const CELL_DOT = 2;
const CELL_POWER = 3;

const CELL_CHARS = { '#': CELL_WALL, '.': CELL_DOT, o: CELL_POWER };

function buildMazeGrid() {
  return MAZE_TEMPLATE.map((rowStr) => rowStr.split('').map((ch) => CELL_CHARS[ch]));
}

const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};
const DIRECTION_NAMES = Object.keys(DIRECTIONS);

const PLAYER_SPAWN = { col: 7, row: 7 };
// Ghosts spawn one tile in from their own scatter corner (the corner tile
// itself holds a power pellet, and camping directly on it would permanently
// hide the pellet under the ghost sprite) - well away from the player's
// central starting tile, so the round opens with a brief safe interval
// while they travel inward rather than an instant, unavoidable collision.
const GHOST_SPAWNS = [
  { col: 1, row: 2, scatterTarget: { col: 1, row: 1 }, color: '#ff0000' },
  { col: 13, row: 2, scatterTarget: { col: 13, row: 1 }, color: '#ffb8ff' },
  { col: 1, row: 12, scatterTarget: { col: 1, row: 13 }, color: '#00ffff' },
  { col: 13, row: 12, scatterTarget: { col: 13, row: 13 }, color: '#ffb852' }
];

const PLAYER_MOVE_DELAY = 150;
const GHOST_MOVE_DELAY = 180;
const FRIGHTENED_SLOWDOWN = 1.5;
const FRIGHTENED_DURATION = 6000;
const SCATTER_DURATION = 5000;
const CHASE_DURATION = 15000;
const GHOST_CHAIN_POINTS = [200, 400, 800, 1600];
const DOT_POINTS = 10;
const POWER_PELLET_POINTS = 50;
const STARTING_LIVES = 3;

class Maze {
  constructor() {
    this.grid = buildMazeGrid();
  }

  wrapCol(col) {
    if (col < 0) return MAZE_COLS - 1;
    if (col >= MAZE_COLS) return 0;
    return col;
  }

  isWall(col, row) {
    if (row < 0 || row >= MAZE_ROWS) return true;
    return this.grid[row][this.wrapCol(col)] === CELL_WALL;
  }

  eatAt(col, row) {
    const wrappedCol = this.wrapCol(col);
    const cell = this.grid[row][wrappedCol];
    if (cell === CELL_DOT) {
      this.grid[row][wrappedCol] = CELL_EMPTY;
      return 'dot';
    }
    if (cell === CELL_POWER) {
      this.grid[row][wrappedCol] = CELL_EMPTY;
      return 'power';
    }
    return null;
  }

  dotsRemaining() {
    let count = 0;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell === CELL_DOT || cell === CELL_POWER) count++;
      }
    }
    return count;
  }
}

class Entity {
  constructor(col, row, moveDelay) {
    this.col = col;
    this.row = row;
    this.direction = null;
    this.moveDelay = moveDelay;
    this.moveCounter = 0;
  }

  canMove(dir, maze) {
    const { dx, dy } = DIRECTIONS[dir];
    return !maze.isWall(this.col + dx, this.row + dy);
  }

  applyMove(dir, maze) {
    const { dx, dy } = DIRECTIONS[dir];
    this.col = maze.wrapCol(this.col + dx);
    this.row = this.row + dy;
  }
}

class Player extends Entity {
  constructor(col, row) {
    super(col, row, PLAYER_MOVE_DELAY);
    this.desiredDirection = null;
  }

  setDesiredDirection(dir) {
    this.desiredDirection = dir;
  }

  update(deltaTime, maze) {
    this.moveCounter += deltaTime;
    if (this.moveCounter < this.moveDelay) return;
    this.moveCounter -= this.moveDelay;

    if (this.desiredDirection && this.canMove(this.desiredDirection, maze)) {
      this.direction = this.desiredDirection;
    }
    if (this.direction && this.canMove(this.direction, maze)) {
      this.applyMove(this.direction, maze);
    }
  }
}

class Ghost extends Entity {
  constructor(col, row, scatterTarget, color) {
    super(col, row, GHOST_MOVE_DELAY);
    this.homeCol = col;
    this.homeRow = row;
    this.scatterTarget = scatterTarget;
    this.color = color;
    this.mode = 'scatter';
  }

  currentMoveDelay() {
    return this.mode === 'frightened' ? this.moveDelay * FRIGHTENED_SLOWDOWN : this.moveDelay;
  }

  getTarget(playerCol, playerRow) {
    if (this.mode === 'chase') return { col: playerCol, row: playerRow };
    if (this.mode === 'eaten') return { col: this.homeCol, row: this.homeRow };
    if (this.mode === 'frightened') return null;
    return this.scatterTarget;
  }

  // Shared by every ghost, across every mode: move toward `target` (or, with
  // no target - the frightened case - pick a random legal direction). This
  // single simple heuristic is intentionally reused everywhere rather than
  // giving each ghost its own distinct pathing personality.
  pickDirectionTowards(target, maze) {
    const legalDirs = DIRECTION_NAMES.filter((dir) => this.canMove(dir, maze));
    if (legalDirs.length === 0) return null;
    if (!target) {
      return legalDirs[Math.floor(Math.random() * legalDirs.length)];
    }

    let best = legalDirs[0];
    let bestDistance = Infinity;
    for (const dir of legalDirs) {
      const { dx, dy } = DIRECTIONS[dir];
      const distance = Math.hypot(target.col - (this.col + dx), target.row - (this.row + dy));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = dir;
      }
    }
    return best;
  }

  update(deltaTime, maze, playerCol, playerRow) {
    if (this.mode === 'eaten' && this.col === this.homeCol && this.row === this.homeRow) {
      this.mode = 'scatter';
    }

    this.moveCounter += deltaTime;
    const delay = this.currentMoveDelay();
    if (this.moveCounter < delay) return;
    this.moveCounter -= delay;

    const target = this.getTarget(playerCol, playerRow);
    const dir = this.pickDirectionTowards(target, maze);
    if (dir) {
      this.direction = dir;
      this.applyMove(dir, maze);
    }
  }
}

class GameState {
  constructor() {
    this.maze = new Maze();
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.player = new Player(PLAYER_SPAWN.col, PLAYER_SPAWN.row);
    this.ghosts = GHOST_SPAWNS.map((g) => new Ghost(g.col, g.row, g.scatterTarget, g.color));
    this.frightenedTimer = 0;
    this.ghostChainCount = 0;
    this.globalMode = 'scatter';
    this.globalModeTimer = 0;
    // Last thing that happened this tick, for main.js to react to (sound
    // effects) without engine code needing to know about audio at all.
    this.lastEatEvent = null;
  }

  movePlayerDirection(dir) {
    this.player.setDesiredDirection(dir);
  }

  updateGlobalMode(deltaTime) {
    this.globalModeTimer += deltaTime;
    const limit = this.globalMode === 'scatter' ? SCATTER_DURATION : CHASE_DURATION;
    if (this.globalModeTimer >= limit) {
      this.globalModeTimer -= limit;
      this.globalMode = this.globalMode === 'scatter' ? 'chase' : 'scatter';
    }
    for (const ghost of this.ghosts) {
      if (ghost.mode !== 'frightened' && ghost.mode !== 'eaten') {
        ghost.mode = this.globalMode;
      }
    }
  }

  updateFrightenedTimer(deltaTime) {
    if (this.frightenedTimer <= 0) return;
    this.frightenedTimer -= deltaTime;
    if (this.frightenedTimer <= 0) {
      this.frightenedTimer = 0;
      this.ghostChainCount = 0;
      for (const ghost of this.ghosts) {
        if (ghost.mode === 'frightened') ghost.mode = this.globalMode;
      }
    }
  }

  handleEating() {
    const result = this.maze.eatAt(this.player.col, this.player.row);
    if (result === 'dot') {
      this.score += DOT_POINTS;
      this.lastEatEvent = 'dot';
    } else if (result === 'power') {
      this.score += POWER_PELLET_POINTS;
      this.frightenedTimer = FRIGHTENED_DURATION;
      this.ghostChainCount = 0;
      for (const ghost of this.ghosts) {
        if (ghost.mode !== 'eaten') ghost.mode = 'frightened';
      }
      this.lastEatEvent = 'power';
    } else {
      this.lastEatEvent = null;
    }
  }

  handleGhostCollisions() {
    for (const ghost of this.ghosts) {
      if (ghost.col !== this.player.col || ghost.row !== this.player.row) continue;

      if (ghost.mode === 'frightened') {
        const points = GHOST_CHAIN_POINTS[Math.min(this.ghostChainCount, GHOST_CHAIN_POINTS.length - 1)];
        this.score += points;
        this.ghostChainCount += 1;
        ghost.mode = 'eaten';
        this.lastEatEvent = 'ghost';
      } else if (ghost.mode !== 'eaten') {
        this.loseLife();
        return;
      }
    }
  }

  loseLife() {
    this.lives -= 1;
    this.lastEatEvent = 'death';
    if (this.lives <= 0) {
      this.isGameOver = true;
    } else {
      this.resetPositions();
    }
  }

  resetPositions() {
    this.player = new Player(PLAYER_SPAWN.col, PLAYER_SPAWN.row);
    this.ghosts.forEach((ghost, i) => {
      ghost.col = GHOST_SPAWNS[i].col;
      ghost.row = GHOST_SPAWNS[i].row;
      ghost.mode = this.globalMode;
    });
  }

  nextLevel() {
    this.level += 1;
    this.maze = new Maze();
    this.frightenedTimer = 0;
    this.ghostChainCount = 0;
    this.globalMode = 'scatter';
    this.globalModeTimer = 0;
    this.resetPositions();
    this.lastEatEvent = 'levelComplete';
  }

  update(deltaTime) {
    if (this.isGameOver || this.isPaused) return;

    this.updateGlobalMode(deltaTime);
    this.updateFrightenedTimer(deltaTime);

    this.player.update(deltaTime, this.maze);
    this.handleEating();

    for (const ghost of this.ghosts) {
      ghost.update(deltaTime, this.maze, this.player.col, this.player.row);
    }
    this.handleGhostCollisions();

    if (this.maze.dotsRemaining() === 0) {
      this.nextLevel();
    }
  }

  reset() {
    this.maze = new Maze();
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.player = new Player(PLAYER_SPAWN.col, PLAYER_SPAWN.row);
    this.ghosts = GHOST_SPAWNS.map((g) => new Ghost(g.col, g.row, g.scatterTarget, g.color));
    this.frightenedTimer = 0;
    this.ghostChainCount = 0;
    this.globalMode = 'scatter';
    this.globalModeTimer = 0;
    this.lastEatEvent = null;
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
  };
}
