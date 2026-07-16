// Shared 2D canvas drawing primitives reused by all three games' renderers.
const CanvasUtils = {
  clearCanvas(ctx, width, height, bgColor = '#000') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  },

  drawBlock(ctx, x, y, size, fillColor, strokeColor = '#333') {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, size - 1, size - 1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size - 1, size - 1);
  },

  drawGrid(ctx, cols, rows, cellSize, width, height, color = '#222') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, height);
      ctx.stroke();
    }

    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(width, y * cellSize);
      ctx.stroke();
    }
  },

  drawRect(ctx, x, y, width, height, fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
  },

  drawCircle(ctx, cx, cy, radius, fillColor) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  },

  drawArc(ctx, cx, cy, radius, startAngle, endAngle, fillColor) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
  },

  drawCenteredText(ctx, text, x, y, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }
};

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CanvasUtils };
}
