import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8787);
const dataDir = process.env.LEADERBOARD_DATA_DIR || path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'leaderboard.json');
const invalidNicknamePattern = /^(unknown|undefined|null|test|player)$/i;

const sortEntries = (entries) =>
  [...entries].sort((a, b) => b.score - a.score || b.completedLevel - a.completedLevel || a.createdAt.localeCompare(b.createdAt));

const isValidDate = (value) => Boolean(value && !Number.isNaN(Date.parse(value)));

const normalizeEntry = (entry) => {
  const nickname = typeof entry?.nickname === 'string' ? entry.nickname.trim() : '';
  const score = Number(entry?.score);
  const completedLevel = Number(entry?.completedLevel);
  const createdAt = typeof entry?.createdAt === 'string' && isValidDate(entry.createdAt) ? entry.createdAt : new Date().toISOString();
  const lineUserId = typeof entry?.lineUserId === 'string' && entry.lineUserId.trim() ? entry.lineUserId.trim() : undefined;

  if (!nickname || invalidNicknamePattern.test(nickname) || !Number.isFinite(score) || score <= 0 || !Number.isFinite(completedLevel)) {
    return null;
  }

  return {
    nickname,
    lineUserId,
    score,
    completedLevel: Math.max(0, Math.floor(completedLevel)),
    createdAt,
  };
};

const readEntries = async () => {
  try {
    const raw = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortEntries(parsed.map(normalizeEntry).filter(Boolean));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const writeEntries = async (entries) => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(sortEntries(entries), null, 2)}\n`, 'utf8');
};

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error('Request body is too large'));
      }
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    request.on('error', reject);
  });

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {});
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/leaderboard') {
      sendJson(response, 200, { entries: await readEntries() });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/leaderboard') {
      const entry = normalizeEntry(await readJsonBody(request));
      if (!entry) {
        sendJson(response, 400, { error: 'Invalid leaderboard entry' });
        return;
      }

      const entries = sortEntries([...(await readEntries()), entry]);
      await writeEntries(entries);
      const rank = entries.findIndex((item) => item.createdAt === entry.createdAt && item.nickname === entry.nickname) + 1;
      sendJson(response, 201, { entry, entries, rank });
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : 'Server error' });
  }
});

server.listen(port, () => {
  console.log(`Leaderboard API listening on http://localhost:${port}`);
  console.log(`Leaderboard data file: ${dataFile}`);
});
