import { Router } from 'express';
import { store } from '../store/index.js';
import { recomputeAllScores } from '../services/scoring.js';

const router = Router();

// Africa's Talking sends form-urlencoded by default. Support both.
router.use((req, _res, next) => {
  if (req.is('application/x-www-form-urlencoded') && !Object.keys(req.body || {}).length) {
    // parse manually since we didn't mount urlencoded globally
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => {
      req.body = Object.fromEntries(new URLSearchParams(data));
      next();
    });
  } else next();
});

const SEVERITY_LABELS = ['Mild', 'Moderate', 'Hot', 'Very Hot', 'Extreme'];
const TYPES = { '1': 'heat', '2': 'flood', '3': 'clearing' };

// AT contract: respond with text starting with CON (continue) or END (terminate).
// Inputs accumulate in `text` as values joined by `*`.
router.post('/callback', (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text = '' } = req.body || {};
  const parts = text.split('*').filter(Boolean);

  // Step 0: main menu
  if (parts.length === 0) {
    return ussdText(res, 'CON',
      'Welcome to UCIP\n' +
      '1. Report Heat\n' +
      '2. Report Flood\n' +
      '3. Report Tree Clearing\n' +
      '4. Check My Area'
    );
  }

  const choice = parts[0];

  // Path: Check My Area
  if (choice === '4') {
    if (parts.length === 1) {
      return ussdText(res, 'CON', 'Enter neighbourhood name (e.g. Surulere):');
    }
    const lga = parts[1];
    const s = store.scores.get(matchLga(lga));
    if (!s) return ussdText(res, 'END', `Sorry, ${lga} not in coverage yet.`);
    return ussdText(res, 'END',
      `${s.lga}\n` +
      `Heat: ${s.heat_score.toFixed(1)}/10\n` +
      `Flood: ${s.flood_risk_score.toFixed(1)}/10\n` +
      `Green: ${s.ndvi_health.toFixed(2)}\n` +
      `Updated ${minsAgo(s.updated_at)}m ago`
    );
  }

  // Paths: report 1/2/3
  if (!['1', '2', '3'].includes(choice)) {
    return ussdText(res, 'END', 'Invalid option. Dial again.');
  }
  const report_type = TYPES[choice];

  // Step 1: severity
  if (parts.length === 1) {
    return ussdText(res, 'CON',
      `Rate ${report_type} severity:\n` +
      SEVERITY_LABELS.map((s, i) => `${i + 1}. ${s}`).join('\n')
    );
  }
  const severity = parseInt(parts[1]);
  if (!(severity >= 1 && severity <= 5)) {
    return ussdText(res, 'END', 'Invalid severity. Dial again.');
  }

  // Step 2: location prompt
  if (parts.length === 2) {
    return ussdText(res, 'CON', 'Location:\n1. Use my area (default)\n2. Type neighbourhood name');
  }
  const locChoice = parts[2];

  // Step 3: collect or default
  let lga;
  if (locChoice === '1') {
    lga = lgaForPhone(phoneNumber);
  } else if (locChoice === '2') {
    if (parts.length === 3) {
      return ussdText(res, 'CON', 'Type neighbourhood name:');
    }
    lga = matchLga(parts[3]);
  } else {
    return ussdText(res, 'END', 'Invalid choice.');
  }

  if (!lga) return ussdText(res, 'END', 'Neighbourhood not recognised. Try again.');

  const n = store.neighbourhoods.find(x => x.lga === lga);
  const row = store.addReport({
    report_type,
    severity,
    latitude: n.lat,
    longitude: n.lng,
    lga,
    notes: `via USSD ${sessionId?.slice(-6) || ''}`,
    source: 'ussd',
  });
  recomputeAllScores();
  return ussdText(res, 'END',
    `Report ${row.id} submitted!\n` +
    `${report_type}/${SEVERITY_LABELS[severity - 1]} @ ${lga}.\n` +
    `You'll get alerts for your area.`
  );
});

function ussdText(res, prefix, body) {
  res.set('Content-Type', 'text/plain').send(`${prefix} ${body}`);
}

function matchLga(input) {
  if (!input) return null;
  const q = input.trim().toLowerCase();
  const exact = store.neighbourhoods.find(n => n.lga.toLowerCase() === q);
  if (exact) return exact.lga;
  const partial = store.neighbourhoods.find(n => n.lga.toLowerCase().includes(q) || q.includes(n.lga.toLowerCase()));
  return partial?.lga ?? null;
}

function lgaForPhone(phone) {
  // Demo heuristic: use last digit modulo N. In production this is a per-user lookup.
  if (!phone) return store.neighbourhoods[0].lga;
  const idx = Math.abs([...phone].reduce((a, c) => a + c.charCodeAt(0), 0)) % store.neighbourhoods.length;
  return store.neighbourhoods[idx].lga;
}

function minsAgo(iso) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

export default router;
