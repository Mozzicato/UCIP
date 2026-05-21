import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cron from 'node-cron';

import { store } from './store/index.js';
import { recomputeAllScores } from './services/scoring.js';
import { fetchOpenMeteoForLagos } from './services/weather.js';
import { evaluateAlerts } from './services/alerts.js';

import reports from './routes/reports.js';
import maps from './routes/maps.js';
import planner from './routes/planner.js';
import alerts from './routes/alerts.js';
import ussd from './routes/ussd.js';
import geo from './routes/geo.js';
import solutions from './routes/solutions.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/api/v1/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'ucip-api',
    version: '1.0.0',
    demo_mode: store.demoMode,
    neighbourhoods: store.neighbourhoods.length,
    reports: store.reports.length,
    time: new Date().toISOString(),
  });
});

app.use('/api/v1/reports', reports);
app.use('/api/v1', maps);
app.use('/api/v1/planner', planner);
app.use('/api/v1/alerts', alerts);
app.use('/api/v1/ussd', ussd);
app.use('/api/v1/geo', geo);
app.use('/api/v1/solutions', solutions);

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

async function bootstrap() {
  await store.init();
  recomputeAllScores();

  // 15-min: fetch weather + recompute
  cron.schedule('*/15 * * * *', async () => {
    try {
      await fetchOpenMeteoForLagos();
      recomputeAllScores();
      evaluateAlerts();
    } catch (e) { console.warn('[cron 15m]', e.message); }
  });

  // 5-min in demo mode for snappier updates
  if (store.demoMode) {
    cron.schedule('*/5 * * * *', () => {
      recomputeAllScores();
      evaluateAlerts();
    });
  }

  // first fetch right after boot (best-effort)
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
