// Stubs requestAnimationFrame to a no-op before any page script runs, so the
// game loop (kicked off once via requestAnimationFrame(gameLoop) in each
// game's main.js) never starts ticking on its own. initGame() still renders
// one frame synchronously, so the page isn't blank - but nothing moves,
// nothing re-renders, and no real-time-driven event (an animation toggle, a
// ghost step, main.js's own game-over handling) fires until a test drives it
// explicitly. This is what makes visual regression screenshots deterministic
// instead of racing a live requestAnimationFrame loop.
async function freezeGameLoop(page) {
  await page.addInitScript(() => {
    window.requestAnimationFrame = () => 0;
  });
}

module.exports = { freezeGameLoop };
