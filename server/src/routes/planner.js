import { Router } from 'express';
import { store } from '../store/index.js';
import { recommendation } from '../services/scoring.js';

const router = Router();

router.get('/summary', (_req, res) => {
  const lgas = [...store.scores.values()].map(s => ({
    ...s,
    summary: recommendation(s),
  }));

  // sort by composite risk (heat + flood, weighted) descending
  lgas.sort((a, b) => (b.heat_score + b.flood_risk_score) - (a.heat_score + a.flood_risk_score));

  const reports_24h = store.reports.filter(
    r => Date.now() - new Date(r.created_at).getTime() < 24 * 3600_000
  ).length;

  res.json({
    totals: {
      reports_24h,
      neighbourhoods: store.neighbourhoods.length,
      active_alerts: store.alerts.filter(a => Date.now() - new Date(a.dispatched_at).getTime() < 3600_000).length,
    },
    lgas,
    generated_at: new Date().toISOString(),
  });
});

export default router;
