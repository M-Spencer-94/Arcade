# Virtual Arcade

A browser-based arcade with three classics — **Tetris**, **Pac-Man**, and **Space Invaders** —
each with sound, canvas graphics, and its own persistent leaderboard. No build step, no
database: a small Express server plus vanilla JavaScript.

## Running it

**Prerequisites:** [Node.js](https://nodejs.org/) (any reasonably recent version — this part of
the app doesn't need anything special).

```bash
npm install
npm start
```

Then open **http://localhost:3000** in a browser. That's the arcade hub — pick a game from
there, or go straight to `/tetris`, `/pacman`, or `/space-invaders`.

Stop the server with `Ctrl+C`.

### Controls

| Game | Controls |
|---|---|
| Tetris | ← → move · ↓ soft drop · ↑ rotate · Space hard drop · Enter pause |
| Pac-Man | Arrow keys move · Enter pause |
| Space Invaders | ← → move · Space fire · Enter pause |

Each game has its own Pause, Mute, and Scores (leaderboard) buttons. Beating a top-10 score
prompts for a name before saving it.

## Project structure

```
public/
  index.html              Arcade hub (game picker + leaderboard previews)
  tetris.html / pacman.html / space-invaders.html
  css/                    Shared "arcade shell" theme + hub-specific layout
  js/
    shared/               Canvas drawing helpers, Web Audio synth base class,
                           leaderboard fetch client + UI components
    tetris/ pacman/ space-invaders/
                           Each game's engine, renderer, sound effects, and
                           input/game-loop wiring
routes/leaderboard.js      Leaderboard REST API (GET/POST /api/leaderboard/:game)
data/leaderboards/         Leaderboard data, one JSON file per game
server.js                  Express app - static files + API + page routes
```

## Leaderboard data

Scores persist to `data/leaderboards/{tetris,pacman,space-invaders}.json` on disk. Delete an
entry (or the whole file) to reset a leaderboard — it'll recreate itself as empty on the next
request.

## Testing

Two layers of tests. Both require **Node 18+** (this machine's default `node` is older, so a
separate Node 20 is installed via Homebrew and the test scripts below point at it automatically
— you don't need to do anything extra, just run the commands).

```bash
npm test              # Cucumber/BDD suite - game logic, audio triggering, leaderboard API
npm run test:coverage # Same suite with a coverage report (100% required on gated files)
npm run test:e2e      # Playwright - real browser screenshots + real Web Audio rendering
```

`npm run test:e2e:update` regenerates the Playwright screenshot baselines after an intentional
visual change.

## Sharing this with someone else

This isn't in git or hosted anywhere yet, so pick one of these depending on what you want:

- **Just let them play it, no setup** — deploy it somewhere with persistent storage (e.g.
  [Railway](https://railway.app), [Render](https://render.com), or a small VPS) so it's a live
  URL. The leaderboard files need to persist between requests, so a purely "serverless
  functions" host (e.g. Vercel/Netlify's default setup) isn't a great fit without switching the
  leaderboard to a hosted database first.
- **Let them run it themselves** — zip up this folder (or push it to a GitHub repo and have
  them `git clone`) and they run `npm install && npm start` locally, same as above.
- **Just show it off** — screen-share or record a quick video; no setup needed on their end at
  all.

Want me to set any of these up (init git, push to GitHub, deploy somewhere)? Happy to, just say
the word and which option you'd prefer.
