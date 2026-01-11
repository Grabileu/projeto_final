// apply-server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json({ limit: '20mb' }));

const PORT = process.env.PORT || 3000;
const BASE_DIR = process.env.BASE_DIR ? path.resolve(process.env.BASE_DIR) : process.cwd();
const TOKEN = process.env.APPLY_TOKEN || null;

if (!TOKEN) {
  console.warn('Warning: no APPLY_TOKEN set — server will accept requests only without token if not provided.');
}

const safeJoin = (base, target) => {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(target);
  return resolvedTarget.startsWith(resolvedBase) ? resolvedTarget : null;
};

const handleApply = async (req, res) => {
  try {
    const headerToken = (req.headers['x-apply-token'] || req.headers['authorization'] || '').toString();
    const authToken = headerToken.replace(/^Bearer\s+/i, '') || headerToken;

    if (TOKEN && authToken !== TOKEN) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: invalid token' });
    }

    const files = req.body && Array.isArray(req.body.files) ? req.body.files : null;
    if (!files) return res.status(400).json({ ok: false, error: 'Bad request: missing files array' });

    const results = [];

    for (const f of files) {
      if (!f.path || typeof f.content !== 'string') {
        results.push({ path: f.path || null, ok: false, error: 'Invalid file object' });
        continue;
      }

      const targetPath = safeJoin(BASE_DIR, path.resolve(BASE_DIR, f.path));
      if (!targetPath) {
        results.push({ path: f.path, ok: false, error: 'Path outside base directory or invalid' });
        continue;
      }

      const dir = path.dirname(targetPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(targetPath, f.content, { encoding: 'utf8' });

      results.push({ path: f.path, ok: true });
    }

    res.json({ ok: true, base: BASE_DIR, results });
  } catch (err) {
    console.error('apply error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};

const handleRoot = (req, res) =>
  res.send('Apply server running. POST /apply with JSON { files:[{path,content}] } and header x-apply-token.');

app.post('/apply', handleApply);
app.get('/', handleRoot);

const startServer = async () => {
  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });

  console.log(`Apply server listening on http://127.0.0.1:${PORT}`);
  console.log('Base dir:', BASE_DIR);
};

startServer().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});