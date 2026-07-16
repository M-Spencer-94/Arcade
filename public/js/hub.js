document.querySelectorAll('.leaderboard-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const game = btn.dataset.game;
    try {
      const { entries } = await LeaderboardClient.fetchTop(game);
      LeaderboardUI.showLeaderboardOverlay({
        overlayEl: document.getElementById('leaderboard-overlay'),
        game,
        entries
      });
    } catch (err) {
      // Leaderboard service unreachable - nothing to show, leave the button inert.
    }
  });
});
