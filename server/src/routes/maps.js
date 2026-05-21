import { Router } from 'express';
import { store } from '../store/index.js';

const router = Router();

function grid(metricKey) {
  return [...store.scores.values()].map(s => ({
    lat: s.lat,
    lng: s.lng,
    label: s.lga,
    heat_score: s.heat_score,
    flood_risk_score: s.flood_risk_score,
    ndvi_health: s.ndvi_health,
    [metricKey]: s[metricKey],
  }));
}

router.get('/heatmap', (_req, res) => {
  res.json({
    grid: grid('heat_score'),
    legend: { min: 0, max: 10, unit: 'composite score' },
    updated_at: new Date().toISOString(),
  });
});

router.get('/flood-risk', (_req, res) => {
  res.json({
    grid: grid('flood_risk_score'),
    legend: { min: 0, max: 10, unit: 'flood risk score' },
    updated_at: new Date().toISOString(),
  });
});

router.get('/ndvi', (_req, res) => {
  res.json({
    grid: grid('ndvi_health'),
    legend: { min: 0, max: 1, unit: 'NDVI' },
    updated_at: new Date().toISOString(),
  });
});

router.get('/leaderboard', (_req, res) => {
  const board = [...store.scores.values()]
    .map(s => ({ lga: s.lga, ndvi_health: s.ndvi_health }))
    .sort((a, b) => b.ndvi_health - a.ndvi_health);
  res.json({ leaderboard: board });
});

export default router;
