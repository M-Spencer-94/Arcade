const express = require('express');
const path = require('path');
const createLeaderboardRouter = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/leaderboard', createLeaderboardRouter({ dataDir: path.join(__dirname, 'data', 'leaderboards') }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/tetris', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tetris.html'));
});

app.get('/pacman', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pacman.html'));
});

app.get('/space-invaders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'space-invaders.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Arcade server running at http://localhost:${PORT}`);
});
