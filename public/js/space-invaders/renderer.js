const INVADER_ROW_COLORS = ['#ff4444', '#00ff88', '#00ff88', '#00d4ff', '#00d4ff'];

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Animation state - a 2-frame "walk cycle" toggle, classic invader look.
    this.animFrame = 0;
    this.animTimer = 0;
    this.animInterval = 400;
  }

  drawInvader(x, y, row) {
    const color = INVADER_ROW_COLORS[row] || '#00d4ff';
    CanvasUtils.drawRect(this.ctx, x + 4, y, INVADER_WIDTH - 8, INVADER_HEIGHT - 6, color);

    if (this.animFrame === 0) {
      CanvasUtils.drawRect(this.ctx, x, y + INVADER_HEIGHT - 6, 6, 6, color);
      CanvasUtils.drawRect(this.ctx, x + INVADER_WIDTH - 6, y + INVADER_HEIGHT - 6, 6, 6, color);
    } else {
      CanvasUtils.drawRect(this.ctx, x + 3, y + INVADER_HEIGHT - 6, 6, 6, color);
      CanvasUtils.drawRect(this.ctx, x + INVADER_WIDTH - 9, y + INVADER_HEIGHT - 6, 6, 6, color);
    }
  }

  drawPlayer(player) {
    CanvasUtils.drawRect(this.ctx, player.x, PLAYER_Y + 6, PLAYER_WIDTH, PLAYER_HEIGHT - 6, '#00ff00');
    CanvasUtils.drawRect(this.ctx, player.x + PLAYER_WIDTH / 2 - 4, PLAYER_Y, 8, 8, '#00ff00');
  }

  drawBullet(bullet, color) {
    CanvasUtils.drawRect(this.ctx, bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT, color);
  }

  render(gameState) {
    CanvasUtils.clearCanvas(this.ctx, this.width, this.height, '#000');

    for (const invader of gameState.invaders) {
      if (!invader.alive) continue;
      const pos = gameState.getInvaderPosition(invader);
      this.drawInvader(pos.x, pos.y, invader.row);
    }

    this.drawPlayer(gameState.player);

    if (gameState.playerBullet) {
      this.drawBullet(gameState.playerBullet, '#ffffff');
    }
    for (const bullet of gameState.invaderBullets) {
      this.drawBullet(bullet, '#ff4444');
    }
  }

  updateAnimation() {
    this.animTimer += 16;
    if (this.animTimer >= this.animInterval) {
      this.animTimer = 0;
      this.animFrame = this.animFrame === 0 ? 1 : 0;
    }
  }
}
