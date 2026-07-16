const PACMAN_ANGLE_BY_DIRECTION = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2
};

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = 20;
    this.width = canvas.width;
    this.height = canvas.height;

    // Animation state
    this.chompOpen = true;
    this.chompTimer = 0;
    this.chompInterval = 100;
  }

  cellCenter(col, row) {
    return { x: col * this.cellSize + this.cellSize / 2, y: row * this.cellSize + this.cellSize / 2 };
  }

  drawMaze(maze) {
    CanvasUtils.clearCanvas(this.ctx, this.width, this.height, '#000');

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        const cell = maze.grid[row][col];
        const { x, y } = this.cellCenter(col, row);

        if (cell === CELL_WALL) {
          CanvasUtils.drawBlock(this.ctx, col * this.cellSize, row * this.cellSize, this.cellSize, '#1a1a8f', '#0000d4');
        } else if (cell === CELL_DOT) {
          CanvasUtils.drawCircle(this.ctx, x, y, 2, '#ffd700');
        } else if (cell === CELL_POWER) {
          CanvasUtils.drawCircle(this.ctx, x, y, 5, '#ffd700');
        }
      }
    }
  }

  drawPlayer(player) {
    const { x, y } = this.cellCenter(player.col, player.row);
    const radius = this.cellSize / 2 - 1;
    const baseAngle = PACMAN_ANGLE_BY_DIRECTION[player.direction] ?? 0;
    const mouthHalfAngle = this.chompOpen ? Math.PI / 5 : 0.02;

    CanvasUtils.drawArc(
      this.ctx,
      x,
      y,
      radius,
      baseAngle + mouthHalfAngle,
      baseAngle - mouthHalfAngle + Math.PI * 2,
      '#ffff00'
    );
  }

  drawGhost(ghost) {
    const { x, y } = this.cellCenter(ghost.col, ghost.row);
    const radius = this.cellSize / 2 - 2;
    let color = ghost.color;
    if (ghost.mode === 'frightened') color = '#2121ff';
    if (ghost.mode === 'eaten') color = 'rgba(255,255,255,0.4)';

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y - 2, radius, Math.PI, 0, false);
    this.ctx.lineTo(x + radius, y + radius - 2);
    this.ctx.lineTo(x + radius / 2, y + radius / 2 - 2);
    this.ctx.lineTo(x, y + radius - 2);
    this.ctx.lineTo(x - radius / 2, y + radius / 2 - 2);
    this.ctx.lineTo(x - radius, y + radius - 2);
    this.ctx.closePath();
    this.ctx.fill();

    CanvasUtils.drawCircle(this.ctx, x - 3, y - 4, 2, '#fff');
    CanvasUtils.drawCircle(this.ctx, x + 3, y - 4, 2, '#fff');
  }

  render(gameState) {
    this.drawMaze(gameState.maze);
    for (const ghost of gameState.ghosts) {
      this.drawGhost(ghost);
    }
    this.drawPlayer(gameState.player);
  }

  updateAnimation() {
    this.chompTimer += 16;
    if (this.chompTimer >= this.chompInterval) {
      this.chompTimer = 0;
      this.chompOpen = !this.chompOpen;
    }
  }
}
