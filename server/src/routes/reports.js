import { Router } from 'express';
import { z } from 'zod';
import { store } from '../store/index.js';
import { recomputeAllScores } from '../services/scoring.js';
import { evaluateAlerts } from '../services/alerts.js';

const router = Router();

const ReportSchema = z.object({
  report_type: z.enum(['heat', 'flood', 'clearing']),
  severity: z.number().int().min(1).max(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  lga: z.string().min(1).max(80),
  notes: z.string().max(500).optional().default(''),
  photo: z.string().optional(),
  source: z.enum(['app', 'ussd']).optional().default('app'),
});

router.post('/', (req, res) => {
  const parsed = ReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid report', details: parsed.error.flatten() });
  }
  const row = store.addReport(parsed.data);
  // Recompute scores synchronously so the next /heatmap call reflects this report.
  recomputeAllScores();
  evaluateAlerts();
  res.status(201).json(row);
});

router.get('/recent', (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  res.json({ reports: store.recentReports(limit), count: store.reports.length });
});

export default router;
