import app from '../server/src/app.js';
import { store } from '../server/src/store/index.js';
import { fetchOpenMeteoForLagos } from '../server/src/services/weather.js';
import { recomputeAllScores } from '../server/src/services/scoring.js';

let bootPromise;

function ensureBootstrap() {
  if (!bootPromise) {
    bootPromise = (async () => {
      await store.init();
      try { await fetchOpenMeteoForLagos(); } catch { /* network fallback handled in service */ }
      recomputeAllScores();
    })();
  }
  return bootPromise;
}

export default async function handler(req, res) {
  await ensureBootstrap();
  return app(req, res);
}
