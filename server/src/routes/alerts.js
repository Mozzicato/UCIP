import { Router } from 'express';
import { store } from '../store/index.js';
import { dispatchAlert, evaluateAlerts } from '../services/alerts.js';

const router = Router();

router.get('/recent', (_req, res) => {
  res.json({ alerts: store.alerts.slice(0, 20) });
});

router.post('/subscribe', (req, res) => {
  const { lga, identifier } = req.body || {};
  if (!lga) return res.status(400).json({ error: 'lga required' });
  const id = identifier || `anon-${Math.random().toString(36).slice(2, 9)}`;
  store.subscribe(lga, id);
  res.status(201).json({ subscribed: true, lga, subscriber_count: store.subscriberCount(lga) });
});

// Forces an alert for demo purposes — bypasses thresholds + cooldowns.
router.post('/test', (req, res) => {
  const { lga, kind = 'flood' } = req.body || {};
  if (!lga) return res.status(400).json({ error: 'lga required' });
  const score = store.scores.get(lga);
  const alert = dispatchAlert({
    lga,
    kind,
    payload: {
      score: score?.[`${kind}_score`] ?? score?.flood_risk_score ?? 7.5,
      message: `[DEMO] ${kind.toUpperCase()} alert for ${lga}.`,
      demo: true,
    },
  });
  res.status(201).json(alert);
});

// Re-runs the threshold engine on demand
router.post('/evaluate', (_req, res) => {
  res.json({ fired: evaluateAlerts() });
});

export default router;
