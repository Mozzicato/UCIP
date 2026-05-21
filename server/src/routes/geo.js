import { Router } from 'express';
import { store } from '../store/index.js';

const router = Router();

// haversine distance in km
function distKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Nearest-centroid reverse geocode. In production we'd do PostGIS ST_Contains
// against neighbourhood polygons; nearest-centroid is fine for the demo with 20 points.
router.get('/lga', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat,lng required' });
  }
  let best = null, bestD = Infinity;
  for (const n of store.neighbourhoods) {
    const d = distKm({ lat, lng }, { lat: n.lat, lng: n.lng });
    if (d < bestD) { bestD = d; best = n; }
  }
  res.json({
    lga: best?.lga,
    nearest: best?.lga,
    distance_km: Math.round(bestD * 100) / 100,
  });
});

router.get('/neighbourhoods', (_req, res) => {
  res.json({ neighbourhoods: store.neighbourhoods });
});

export default router;
