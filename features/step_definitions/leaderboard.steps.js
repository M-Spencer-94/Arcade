const { Before, After, Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const createLeaderboardRouter = require('../../routes/leaderboard');

let server;
let baseUrl;
let dataDir;
let lastResponse;
let lastBody;

function startServer(dir) {
  const app = express();
  app.use(express.json());
  app.use('/api/leaderboard', createLeaderboardRouter({ dataDir: dir }));
  return new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
}

Before(async function () {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leaderboard-test-'));
  server = await startServer(dataDir);
  baseUrl = `http://localhost:${server.address().port}`;
  lastResponse = null;
  lastBody = null;
});

After(async function () {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(dataDir, { recursive: true, force: true });
});

Given('a fresh leaderboard server', function () {
  // Server is already started fresh in the Before hook.
});

Given('a score of {int} for {string} has been submitted to {string}', async function (score, name, game) {
  await fetch(`${baseUrl}/api/leaderboard/${game}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score })
  });
});

Given('{int} distinct scores have been submitted to {string}', async function (count, game) {
  for (let i = 0; i < count; i++) {
    await fetch(`${baseUrl}/api/leaderboard/${game}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `P${i}`, score: (i + 1) * 10 })
    });
  }
});

Given('{int} distinct scores from {int} to {int} have been submitted to {string}', async function (count, from, to, game) {
  const step = (to - from) / (count - 1);
  for (let i = 0; i < count; i++) {
    const score = Math.round(from + step * i);
    await fetch(`${baseUrl}/api/leaderboard/${game}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `P${i}`, score })
    });
  }
});

Given('the {string} leaderboard file is corrupted', function (game) {
  fs.writeFileSync(path.join(dataDir, `${game}.json`), '{ this is not valid json');
});

Given('the {string} leaderboard file contains JSON without an entries array', function (game) {
  fs.writeFileSync(path.join(dataDir, `${game}.json`), JSON.stringify({ foo: 'bar' }));
});

Given('the {string} leaderboard file contains the JSON literal null', function (game) {
  fs.writeFileSync(path.join(dataDir, `${game}.json`), 'null');
});

When('I request the leaderboard for {string}', async function (game) {
  lastResponse = await fetch(`${baseUrl}/api/leaderboard/${game}`);
  lastBody = await lastResponse.json();
});

When('I submit a score of {float} for {string} to {string}', async function (score, name, game) {
  lastResponse = await fetch(`${baseUrl}/api/leaderboard/${game}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score })
  });
  lastBody = await lastResponse.json();
});

When('the leaderboard server restarts', async function () {
  await new Promise((resolve) => server.close(resolve));
  // A fresh router instance against the SAME dataDir simulates a process
  // restart: persistence must come entirely from the JSON files on disk,
  // not from anything held in the previous server's memory.
  server = await startServer(dataDir);
  baseUrl = `http://localhost:${server.address().port}`;
});

Then('the response status should be {int}', function (status) {
  assert.strictEqual(lastResponse.status, status);
});

Then('the leaderboard should have {int} entries', function (count) {
  assert.strictEqual(lastBody.entries.length, count);
});

Then('the leaderboard for {string} should have {int} entries', async function (game, count) {
  const res = await fetch(`${baseUrl}/api/leaderboard/${game}`);
  const body = await res.json();
  assert.strictEqual(body.entries.length, count);
});

Then('the response rank should be {int}', function (rank) {
  assert.strictEqual(lastBody.rank, rank);
});

Then('the response rank should be null', function () {
  assert.strictEqual(lastBody.rank, null);
});

Then('entry {int} should be {string} with score {int}', function (position, name, score) {
  const entry = lastBody.entries[position - 1];
  assert.ok(entry, `Expected an entry at position ${position}`);
  assert.strictEqual(entry.name, name);
  assert.strictEqual(entry.score, score);
});
