import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const PORT = 3098;
const URL = `http://localhost:${PORT}/api/v1/ussd/callback`;

const server = spawn(process.execPath, ['server/src/index.js'], {
  env: { ...process.env, PORT, DEMO_MODE: 'true' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let booted = false;
server.stdout.on('data', b => { if (b.toString().includes('UCIP API')) booted = true; });
server.stderr.on('data', b => process.stderr.write(`[err] ${b}`));

async function ussd(text) {
  const body = new URLSearchParams({
    sessionId: 'demo-1', serviceCode: '*384*UCIP#',
    phoneNumber: '+2348012345678', text,
  });
  const r = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  return r.text();
}

async function run() {
  for (let i = 0; i < 50 && !booted; i++) await wait(200);
  await wait(300);
  const tests = [
    ['',          /^CON Welcome to UCIP/],
    ['1',         /^CON Rate heat severity/],
    ['1*4',       /^CON Location/],
    ['1*4*1',     /^END Report RPT-/],
    ['4*Mushin',  /^END Mushin/],
  ];
  let pass = 0;
  for (const [text, want] of tests) {
    const got = await ussd(text);
    const ok = want.test(got);
    console.log(`${ok ? '✅' : '❌'} text="${text}" → ${got.slice(0, 60).replace(/\n/g, ' ')}…`);
    if (ok) pass++;
  }
  console.log(`\n${pass}/${tests.length} USSD checks passed`);
  server.kill('SIGTERM');
  process.exit(pass === tests.length ? 0 : 1);
}

run().catch(e => { console.error(e); server.kill('SIGTERM'); process.exit(2); });
