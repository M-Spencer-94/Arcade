const express = require('express');
const fs = require('fs');
const path = require('path');

const VALID_GAMES = new Set(['tetris', 'pacman', 'space-invaders']);
const MAX_ENTRIES = 10;
const MAX_NAME_LENGTH = 12;

function emptyBoard(game) {
  return { game, updatedAt: null, entries: [] };
}

// Factory rather than a bare router so tests can point persistence at a
// scratch directory instead of the real data/leaderboards folder.
function createLeaderboardRouter({ dataDir }) {
  const router = express.Router();
  fs.mkdirSync(dataDir, { recursive: true });

  function filePath(game) {
    return path.join(dataDir, `${game}.json`);
  }

  function readBoard(game) {
    try {
      const raw = fs.readFileSync(filePath(game), 'utf8');
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.entries)) {
        return emptyBoard(game);
      }
      return parsed;
    } catch (err) {
      // Missing file or corrupt JSON both recover to an empty board rather
      // than crashing the request - a fresh/damaged leaderboard is not an
      // error state for players.
      return emptyBoard(game);
    }
  }

  function writeBoard(game, board) {
    fs.writeFileSync(filePath(game), JSON.stringify(board, null, 2));
  }

  function isValidName(name) {
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= MAX_NAME_LENGTH;
  }

  function isValidScore(score) {
    return typeof score === 'number' && Number.isFinite(score) && Number.isInteger(score) && score >= 0;
  }

  router.get('/:game', (req, res) => {
    const { game } = req.params;
    if (!VALID_GAMES.has(game)) {
      return res.status(404).json({ error: 'Unknown game' });
    }
    res.json(readBoard(game));
  });

  router.post('/:game', (req, res) => {
    const { game } = req.params;
    if (!VALID_GAMES.has(game)) {
      return res.status(404).json({ error: 'Unknown game' });
    }

    const { name, score } = req.body;
    if (!isValidName(name)) {
      return res.status(400).json({ error: 'Invalid name' });
    }
    if (!isValidScore(score)) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    const trimmedName = name.trim().slice(0, MAX_NAME_LENGTH);
    const board = readBoard(game);
    const newEntry = { name: trimmedName, score, date: new Date().toISOString() };

    board.entries.push(newEntry);
    board.entries.sort((a, b) => b.score - a.score);

    const rankIndex = board.entries.indexOf(newEntry);
    const qualified = rankIndex < MAX_ENTRIES;

    board.entries = board.entries.slice(0, MAX_ENTRIES);
    board.game = game;
    board.updatedAt = new Date().toISOString();
    writeBoard(game, board);

    res.status(201).json({ ...board, rank: qualified ? rankIndex + 1 : null });
  });

  return router;
}

module.exports = createLeaderboardRouter;
