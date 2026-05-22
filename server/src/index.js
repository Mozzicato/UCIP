import 'dotenv/config';
import cron from 'node-cron';

import app from './app.js';
import { store } from './store/index.js';
import { recomputeAllScores } from './services/scoring.js';
import { fetchOpenMeteoForLagos } from './services/weather.js';
import { evaluateAlerts } from './services/alerts.js';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  await store.init();
  recomputeAllScores();

  cron.schedule('*/15 * * * *', async () => {
    try {
      await fetchOpenMeteoForLagos();
      recomputeAllScores();
      evaluateAlerts();
    } catch (e) { console.warn('[cron 15m]', e.message); }
  });

  if (store.demoMode) {
    cron.schedule('*/5 * * * *', () => {
      recomputeAllScores();
      evaluateAlerts();
    });
  }

  fetchOpenMeteoForLagos().then(() => {
    recomputeAllScores();
    evaluateAlerts();
  }).catch(() => {});

  app.listen(PORT, () => {
    console.log(`UCIP API → http://localhost:${PORT}/api/v1`);
    console.log(`Demo mode: ${store.demoMode ? 'ON (in-memory)' : 'OFF (Supabase)'}`);
  });
}

bootstrap();
