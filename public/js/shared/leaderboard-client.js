// Thin fetch wrapper around the leaderboard API, shared by every game's
// main.js and by the hub page.
const LeaderboardClient = {
  async fetchTop(game) {
    const res = await fetch(`/api/leaderboard/${game}`);
    if (!res.ok) {
      throw new Error(`Failed to load leaderboard for ${game}`);
    }
    return res.json();
  },

  async submitScore(game, name, score) {
    const res = await fetch(`/api/leaderboard/${game}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score })
    });
    if (!res.ok) {
      throw new Error(`Failed to submit score for ${game}`);
    }
    return res.json();
  },

  // A score qualifies for the leaderboard if there's still room in the top
  // N, or it beats the current lowest qualifying score.
  qualifies(entries, score, limit = 10) {
    if (!Array.isArray(entries) || entries.length < limit) {
      return true;
    }
    const lowestQualifying = entries[entries.length - 1].score;
    return score > lowestQualifying;
  }
};

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LeaderboardClient };
}
