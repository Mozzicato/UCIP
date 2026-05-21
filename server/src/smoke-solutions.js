// Verify /solutions/:lga endpoint:
//  – returns for every neighbourhood
//  – every solution has an `action` object with target+deadline
//  – sample a couple LGAs and print the headline targets

import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const PORT = 3097;
const BASE = `http://localhost:${PORT}/api/v1`;

const server = spawn(process.execPath, ['server/src/index.js'], {
  env: { ...process.env, PORT, DEMO_MODE: 'true' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let booted = false;
server.stdout.on('data', b => { if (b.toString().includes('UCIP API')) booted = true; });
server.stderr.on('data', b => process.stderr.write(`[err] ${b}`));

async function run() {
  for (let i = 0; i < 60 && !booted; i++) await wait(200);
  await wait(400);

  let totalPass = 0, totalFail = 0;

  // Pull the neighbourhood list
  const neighbourhoods = await (await fetch(`${BASE}/geo/neighbourhoods`)).json();

  for (const n of neighbourhoods.neighbourhoods) {
    const r = await fetch(`${BASE}/solutions/${encodeURIComponent(n.lga)}`);
    const j = await r.json();
    if (!r.ok || !Array.isArray(j.solutions)) {
      console.log(`❌ ${n.lga} — endpoint returned ${r.status}`);
      totalFail++;
      continue;
    }

    let actionsOk = 0, actionsTotal = j.solutions.length;
    for (const s of j.solutions) {
      if (s.action && s.action.target && s.action.deadline && s.action.cost_estimate) actionsOk++;
      else console.log(`  ⚠ ${n.lga} → ${s.id}: missing quantify fields`);
    }

    const ok = actionsOk === actionsTotal;
    console.log(`${ok ? '✅' : '❌'} ${n.lga.padEnd(18)} → ${j.solutions.length} solutions, ${j.diagnosis.length} issues`);
    if (ok) totalPass++; else totalFail++;
  }

  // Print the top targets for two high-risk neighbourhoods as a visual sanity check
  for (const lga of ['Mushin', 'Apapa']) {
    const j = await (await fetch(`${BASE}/solutions/${lga}`)).json();
    console.log(`\n── ${lga.toUpperCase()} top 3 targets ──`);
    for (const s of j.solutions.slice(0, 3)) {
      console.log(`  • ${s.title}`);
      console.log(`    🎯 ${s.action?.target}`);
      console.log(`    📅 ${s.action?.deadline}`);
      console.log(`    💵 ${s.action?.cost_estimate}`);
    }
  }

  console.log(`\n${totalPass}/${totalPass + totalFail} LGAs all-quantified`);
  server.kill('SIGTERM');
  process.exit(totalFail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); server.kill('SIGTERM'); process.exit(2); });
