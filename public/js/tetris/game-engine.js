// Tetromino piece definitions
const TETROMINOES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#00f0f0',
    id: 'I'
  },
  O: {
    shape: [[1, 1], [1, 1]],
    color: '#f0f000',
    id: 'O'
  },
  T: {
    shape: [[0, 1, 0], [1, 1, 1]],
    color: '#a000f0',
    id: 'T'
  },
  S: {
    shape: [[0, 1, 1], [1, 1, 0]],
    color: '#00f000',
    id: 'S'
  },
  Z: {
    shape: [[1, 1, 0], [0, 1, 1]],
    color: '#f00000',
    id: 'Z'
  },
  J: {
    shape: [[1, 0, 0], [1, 1, 1]],
    color: '#0000f0',
    id: 'J'
  },
  L: {
    shape: [[0, 0, 1], [1, 1, 1]],
    color: '#f0a000',
    id: 'L'
  }
};

const PIECES = Object.values(TETROMINOES);
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

class Tetromino {
  constructor(type) {
    const tetromino = TETROMINOES[type];
    this.shape = tetromino.shape.map(row => [...row]);
    this.color = tetromino.color;
    this.id = tetromino.id;
    this.x = Math.floor((BOARD_WIDTH - this.shape[0].length) / 2);
    this.y = 0;
    this.rotationState = 0;
  }

  rotate() {
    const newShape = [];
    const height = this.shape.length;
    const width = this.shape[0].length;

    for (let x = 0; x < width; x++) {
      const newRow = [];
      for (let y = height - 1; y >= 0; y--) {
        newRow.push(this.shape[y][x]);
      }
      newShape.push(newRow);
    }

    this.shape = newShape;
    this.rotationState = (this.rotationState + 1) % 4;
  }

  getBlocks() {
    const blocks = [];
    for (let y = 0; y < this.shape.length; y++) {
      for (let x = 0; x < this.shape[y].length; x++) {
        if (this.shape[y][x]) {
          blocks.push({ x: this.x + x, y: this.y + y });
        }
      }
    }
    return blocks;
  }
}

class GameBoard {
  constructor() {
    this.grid = Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null));
  }

  isColliding(tetromino, deltaX = 0, deltaY = 0) {
    const blocks = tetromino.getBlocks();
    for (const block of blocks) {
      const newX = block.x + deltaX;
      const newY = block.y + deltaY;

      // Check bounds
      if (newX < 0 || newX >= BOARD_WIDTH) return true;
      if (newY >= BOARD_HEIGHT) return true;

      // Check collision with existing blocks
      if (newY >= 0 && this.grid[newY][newX] !== null) {
        return true;
      }
    }
    return false;
  }

  lockPiece(tetromino) {
    const blocks = tetromino.getBlocks();
    for (const block of blocks) {
      if (block.y >= 0) {
        this.grid[block.y][block.x] = {
          color: tetromino.color,
          id: tetromino.id
        };
      }
    }
  }

  clearLines() {
    const clearedLines = [];
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== null)) {
        clearedLines.push(y);
      }
    }

    // Remove cleared lines
    for (let i = clearedLines.length - 1; i >= 0; i--) {
      this.grid.splice(clearedLines[i], 1);
      this.grid.unshift(Array(BOARD_WIDTH).fill(null));
    }

    return clearedLines.length;
  }

  isGameOver(tetromino) {
    const blocks = tetromino.getBlocks();
    for (const block of blocks) {
      if (block.y >= 0 && block.y < BOARD_HEIGHT && this.grid[block.y][block.x] !== null) {
        return true;
      }
    }
    return false;
  }
}

class GameState {
  constructor() {
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.board = new GameBoard();
    this.currentPiece = this.generateNewPiece();
    this.nextPiece = this.generateNewPiece();
    this.isGameOver = false;
    this.isPaused = false;
    this.gravityCounter = 0;
    this.gravityDelay = this.getGravityDelay();
  }

  generateNewPiece() {
    const randomType = PIECES[Math.floor(Math.random() * PIECES.length)].id;
    return new Tetromino(randomType);
  }

  getGravityDelay() {
    return Math.max(100, 800 - (this.level - 1) * 50);
  }

  moveLeft() {
    if (!this.isGameOver && !this.isPaused) {
      if (!this.board.isColliding(this.currentPiece, -1, 0)) {
        this.currentPiece.x -= 1;
      }
    }
  }

  moveRight() {
    if (!this.isGameOver && !this.isPaused) {
      if (!this.board.isColliding(this.currentPiece, 1, 0)) {
        this.currentPiece.x += 1;
      }
    }
  }

  softDrop() {
    if (!this.isGameOver && !this.isPaused) {
      if (!this.board.isColliding(this.currentPiece, 0, 1)) {
        this.currentPiece.y += 1;
        this.score += 1;
      } else {
        this.lockCurrentPiece();
      }
    }
  }

  hardDrop() {
    if (!this.isGameOver && !this.isPaused) {
      while (!this.board.isColliding(this.currentPiece, 0, 1)) {
        this.currentPiece.y += 1;
        this.score += 2;
      }
      this.lockCurrentPiece();
    }
  }

  rotate() {
    if (!this.isGameOver && !this.isPaused) {
      this.currentPiece.rotate();

      // Wall kick: try to adjust position if rotation causes collision
      if (this.board.isColliding(this.currentPiece, 0, 0)) {
        // Try shifting left
        this.currentPiece.x -= 1;
        if (this.board.isColliding(this.currentPiece, 0, 0)) {
          // Try shifting right (2 units total)
          this.currentPiece.x += 2;
          if (this.board.isColliding(this.currentPiece, 0, 0)) {
            // Revert rotation
            this.currentPiece.x -= 1;
            for (let i = 0; i < 3; i++) {
              this.currentPiece.rotate();
            }
          }
        }
      }
    }
  }

  lockCurrentPiece() {
    if (this.board.isGameOver(this.currentPiece)) {
      this.isGameOver = true;
      return;
    }

    this.board.lockPiece(this.currentPiece);
    const linesCleared = this.board.clearLines();

    if (linesCleared > 0) {
      this.linesCleared += linesCleared;
      const points = [0, 100, 300, 500, 800][linesCleared] * this.level;
      this.score += points;

      // Level up every 10 lines
      const newLevel = Math.floor(this.linesCleared / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.gravityDelay = this.getGravityDelay();
      }
    }

    this.currentPiece = this.nextPiece;
    this.nextPiece = this.generateNewPiece();
  }

  update(deltaTime) {
    if (this.isGameOver || this.isPaused) {
      return;
    }

    this.gravityCounter += deltaTime;
    if (this.gravityCounter >= this.gravityDelay) {
      this.gravityCounter -= this.gravityDelay;

      if (!this.board.isColliding(this.currentPiece, 0, 1)) {
        this.currentPiece.y += 1;
      } else {
        this.lockCurrentPiece();
      }
    }
  }

  reset() {
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.board = new GameBoard();
    this.currentPiece = this.generateNewPiece();
    this.nextPiece = this.generateNewPiece();
    this.isGameOver = false;
    this.isPaused = false;
    this.gravityCounter = 0;
    this.gravityDelay = this.getGravityDelay();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }
}

// Export for Node.js (testing)
/* istanbul ignore else -- always true under a Node-based test run; the
   else branch only applies when this file is loaded via a <script> tag. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TETROMINOES, PIECES, BOARD_WIDTH, BOARD_HEIGHT, Tetromino, GameBoard, GameState };
}
