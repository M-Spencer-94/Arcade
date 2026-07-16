// Two DOM components shared by every game's leaderboard flow: a name-entry
// modal (shown when a game-over score qualifies for the top 10) and a
// read-only leaderboard display. Both reuse the existing .overlay /
// .overlay-content markup pattern already used for game-over overlays.
const LeaderboardUI = {
  showNameEntryModal({ overlayEl, score, onSubmit }) {
    overlayEl.innerHTML = `
      <div class="overlay-content name-entry">
        <h2>New High Score!</h2>
        <p>Score: ${score}</p>
        <input id="name-entry-input" type="text" maxlength="12" placeholder="AAA" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" />
        <button id="name-entry-submit">Save Score</button>
      </div>
    `;
    overlayEl.classList.remove('hidden');

    const input = overlayEl.querySelector('#name-entry-input');
    const submitBtn = overlayEl.querySelector('#name-entry-submit');
    input.focus();

    const submit = () => {
      const name = input.value.trim();
      if (!name) return;
      overlayEl.classList.add('hidden');
      onSubmit(name);
    };

    submitBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  },

  showLeaderboardOverlay({ overlayEl, game, entries, highlightRank = null }) {
    const rows = entries.length
      ? entries
          .map((entry, i) => {
            const rank = i + 1;
            const rowClass = rank === highlightRank ? 'highlight' : '';
            return `<tr class="${rowClass}"><td>${rank}</td><td>${escapeHtml(entry.name)}</td><td>${entry.score}</td></tr>`;
          })
          .join('')
      : '<tr><td colspan="3">No scores yet - be the first!</td></tr>';

    overlayEl.innerHTML = `
      <div class="overlay-content leaderboard-content">
        <h2>${gameTitle(game)} Leaderboard</h2>
        <table class="leaderboard-table">
          <thead><tr><th>#</th><th>Name</th><th>Score</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <button id="leaderboard-close-btn">Close</button>
      </div>
    `;
    overlayEl.classList.remove('hidden');

    overlayEl.querySelector('#leaderboard-close-btn').addEventListener('click', () => {
      overlayEl.classList.add('hidden');
    });
  }
};

function gameTitle(game) {
  const titles = { tetris: 'Tetris', pacman: 'Pac-Man', 'space-invaders': 'Space Invaders' };
  return titles[game] || game;
}

// Entries are rendered via innerHTML, and a name is player-supplied data -
// escape it so a crafted name can't inject markup into every viewer's page.
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LeaderboardUI };
}
