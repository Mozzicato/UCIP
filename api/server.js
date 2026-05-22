import app from '../server/src/app.js';
import { store } from '../server/src/store/index.js';
import { fetchOpenMeteoForLagos } from '../server/src/services/weather.js';
import { recomputeAllScores } from '../server/src/services/scoring.js';

let bootPromise;

function ensureBootstrap() {
  if (!bootPromise) {
    bootPromise = (async () => {
      await store.init();
      try { await fetchOpenMeteoForLagos(); } catch (e) { console.warn('[bootstrap weather]', e?.message); }
      recomputeAllScores();
    })().catch((e) => {
      console.error('[bootstrap fatal]', e);
      bootPromise = null;
      throw e;
    });
  }
  return bootPromise;
}

export default async function handler(req, res) {
  try {
    await ensureBootstrap();
    return app(req, res);
  } catch (e) {
    console.error('[handler]', e);
    res.status(500).json({ error: 'Function startup failed', message: e?.message || String(e) });
  }
}
