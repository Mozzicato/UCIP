import { Router } from 'express';
import { store } from '../store/index.js';
import { solutionsFor } from '../services/solutions.js';
import { SOLUTIONS } from '../data/solutions.js';

const router = Router();

router.get('/catalog', (_req, res) => {
  res.json({ solutions: SOLUTIONS, count: SOLUTIONS.length });
});

router.get('/:lga', (req, res) => {
  const score = store.scores.get(req.params.lga);
  if (!score) return res.status(404).json({ error: `No data for ${req.params.lga}` });
  res.json(solutionsFor(score));
});

router.get('/', (_req, res) => {
  // City-wide rollup: top 3 solutions per LGA where any issues exist
  const rollup = [...store.scores.values()].map(s => {
    const r = solutionsFor(s);
    return {
      lga: s.lga,
      diagnosis: r.diagnosis,
      top_solutions: r.solutions.slice(0, 3),
    };
  }).filter(r => r.diagnosis.length > 0);
  res.json({ neighbourhoods: rollup });
});

export default router;
