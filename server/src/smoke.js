// Boots the API, hits every key endpoint once, prints PASS/FAIL, exits.
// Run with: node server/src/smoke.js (after npm install).

import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const PORT = 3099;
const BASE = `http://localhost:${PORT}/api/v1`;

const server = spawn(process.execPath, ['server/src/index.js'], {
  env: { ...process.env, PORT, DEMO_MODE: 'true' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let booted = false;
server.stdout.on('data', (b) => {
  const s = b.toString();
  process.stdout.write(`[srv] ${s}`);
  if (s.includes('UCIP API')) booted = true;
});
server.stderr.on('data', (b) => process.stderr.write(`[srv:err] ${b}`));

async function check(name, path, opts) {
  try {
    const r = await fetch(`${BASE}${path}`, opts);
    const j = await r.json();
    const ok = r.ok && (j.ok !== false);
    console.log(`${ok ? '✅' : '❌'} ${name} → ${r.status} ${ok ? '' : JSON.stringify(j).slice(0, 100)}`);
    return { ok, j };
  } catch (e) {
    console.log(`❌ ${name} threw: ${e.message}`);
    return { ok: false };
  }
}

async function run() {
  for (let i = 0; i < 50 && !booted; i++) await wait(200);
  if (!booted) { console.error('Server failed to boot'); process.exit(1); }
  await wait(300);

  const results = [];
  results.push(await check('health',     '/health'));
  results.push(await check('heatmap',    '/heatmap'));
  results.push(await check('flood-risk', '/flood-risk'));
  results.push(await check('ndvi',       '/ndvi'));
  results.push(await check('leaderboard','/leaderboard'));
  results.push(await check('planner',    '/planner/summary'));
  results.push(await check('geo',        '/geo/lga?lat=6.5244&lng=3.3792'));
  results.push(await check('post-report', '/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      report_type: 'heat', severity: 4,
      latitude: 6.5326, longitude: 3.3540,
      lga: 'Mushin', notes: 'smoke test', source: 'app',
    }),
  }));
  results.push(await check('recent',     '/reports/recent?limit=5'));
  results.push(await check('alert-test', '/alerts/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lga: 'Mushin', kind: 'flood' }),
  }));

  const pass = results.filter(r => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  server.kill('SIGTERM');
  process.exit(pass === results.length ? 0 : 1);
}

run().catch(e => { console.error(e); server.kill('SIGTERM'); process.exit(2); });
