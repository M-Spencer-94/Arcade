// Overrides Math.random with a deterministic PRNG before any page script
// runs, so screenshot baselines aren't flaky against the games' random
// piece/spawn generation. Playwright's addInitScript guarantees this runs
// before the page's own <script> tags execute.
async function seedRandom(page, seed = 42) {
  await page.addInitScript((initialSeed) => {
    let state = initialSeed;
    Math.random = function seededRandom() {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }, seed);
}

module.exports = { seedRandom };
