class Renderer {
  constructor(canvas, nextPreviewCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nextPreviewCanvas = nextPreviewCanvas;
    this.nextCtx = nextPreviewCanvas.getContext('2d');

    this.blockSize = 20;
    this.width = canvas.width;
    this.height = canvas.height;

    // Animation state
    this.lineFlashFrame = 0;
    this.lineFlashDuration = 15;
    this.clearedLines = [];
  }

  drawBlock(x, y, color) {
    CanvasUtils.drawBlock(this.ctx, x * this.blockSize, y * this.blockSize, this.blockSize, color, '#333');
  }

  drawGrid() {
    CanvasUtils.drawGrid(this.ctx, BOARD_WIDTH, BOARD_HEIGHT, this.blockSize, this.width, this.height, '#222');
  }

  drawBoard(board) {
    CanvasUtils.clearCanvas(this.ctx, this.width, this.height, '#000');
    this.drawGrid();

    // Draw locked pieces
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board.grid[y][x];
        if (cell) {
          // Flash if line is being cleared
          if (this.clearedLines.includes(y)) {
            const flash = Math.floor((this.lineFlashFrame / this.lineFlashDuration) * 2) % 2;
            if (flash === 1) {
              this.drawBlock(x, y, '#fff');
            }
          } else {
            this.drawBlock(x, y, cell.color);
          }
        }
      }
    }
  }

  drawPiece(piece) {
    const blocks = piece.getBlocks();
    for (const block of blocks) {
      if (block.y >= 0) {
        this.drawBlock(block.x, block.y, piece.color);
      }
    }

    // Draw ghost piece (preview of where it will land)
    this.drawGhostPiece(piece);
  }

  drawGhostPiece(piece) {
    const ghostPiece = new Tetromino(piece.id);
    ghostPiece.shape = piece.shape.map(row => [...row]);
    ghostPiece.x = piece.x;
    ghostPiece.y = piece.y;

    // Simulate dropping
    while (!gameState.board.isColliding(ghostPiece, 0, 1)) {
      ghostPiece.y += 1;
    }

    const blocks = ghostPiece.getBlocks();
    this.ctx.globalAlpha = 0.3;
    for (const block of blocks) {
      if (block.y >= 0) {
        this.drawBlock(block.x, block.y, piece.color);
      }
    }
    this.ctx.globalAlpha = 1.0;
  }

  drawNextPiece(nextPiece) {
    // Clear next preview
    CanvasUtils.clearCanvas(this.nextCtx, this.nextPreviewCanvas.width, this.nextPreviewCanvas.height, '#1a1a1a');

    // Draw border
    this.nextCtx.strokeStyle = '#00d4ff';
    this.nextCtx.lineWidth = 1;
    this.nextCtx.strokeRect(0, 0, this.nextPreviewCanvas.width, this.nextPreviewCanvas.height);

    // Draw next piece centered
    const blockSize = 20;
    const offsetX = (this.nextPreviewCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
    const offsetY = (this.nextPreviewCanvas.height - nextPiece.shape.length * blockSize) / 2;

    for (let y = 0; y < nextPiece.shape.length; y++) {
      for (let x = 0; x < nextPiece.shape[y].length; x++) {
        if (nextPiece.shape[y][x]) {
          const px = offsetX + x * blockSize;
          const py = offsetY + y * blockSize;
          CanvasUtils.drawBlock(this.nextCtx, px, py, blockSize, nextPiece.color, '#333');
        }
      }
    }
  }

  render(gameState) {
    this.drawBoard(gameState.board);
    this.drawPiece(gameState.currentPiece);
    this.drawNextPiece(gameState.nextPiece);
  }

  updateClearedLines(count) {
    if (count > 0) {
      this.lineFlashFrame = 0;
    }
  }

  updateAnimation() {
    if (this.lineFlashFrame > 0) {
      this.lineFlashFrame--;
    }
  }
}
