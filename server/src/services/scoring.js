import { store } from '../store/index.js';

// min-max normalise a value into 0..1 given an [lo, hi] window
function norm(v, lo, hi) {
  if (hi === lo) return 0.5;
  return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
}

// time-decay weight: full weight at 0h, ~0 by `halfLifeHours * 4`
function recencyWeight(iso, halfLifeHours = 2) {
  const ageH = (Date.now() - new Date(iso).getTime()) / 3600_000;
  return Math.pow(0.5, ageH / halfLifeHours);
}

function meanCitizenSeverity(lga, type, hours = 6) {
  const recent = store.reportsInLastHours(lga, hours).filter(r => r.report_type === type);
  if (recent.length === 0) return { mean: 0, count: 0 };
  let num = 0, den = 0;
  for (const r of recent) {
    const w = recencyWeight(r.created_at);
    num += r.severity * w;
    den += w;
  }
  return { mean: den > 0 ? num / den : 0, count: recent.length };
}

export function computeHeatScore(n) {
  // satellite LST window: 26–40 °C is the realistic Lagos band
  const sat = norm(n.baseline_lst, 26, 40);
  const weather = store.weather.get(n.lga);
  const wTemp = weather ? norm(weather.temperature_c, 24, 40) : sat; // fallback if no weather yet
  const heatReports = meanCitizenSeverity(n.lga, 'heat', 6);
  const citizen = norm(heatReports.mean, 0, 5);
  // weights from PRD §3.3
  const composite = 0.4 * sat + 0.35 * citizen + 0.25 * wTemp;
  return Math.round(composite * 100) / 10; // 0..10 with 1dp
}

export function computeFloodRisk(n) {
  const weather = store.weather.get(n.lga);
  const rainfall = weather?.forecast_rainfall_mm_6h ?? 0;
  const rain = norm(rainfall, 0, 60);                       // 60mm in 6h is severe
  const histFreq = norm(n.historical_flood_freq, 0, 10);
  // elevation_risk = inverse of elevation (lower elevation = higher risk)
  const elev = 1 - norm(n.elevation_m, 0, 50);
  const floodReports = meanCitizenSeverity(n.lga, 'flood', 12);
  const citizen = norm(floodReports.mean, 0, 5);
  const composite = 0.3 * rain + 0.25 * histFreq + 0.25 * elev + 0.2 * citizen;
  return Math.round(composite * 100) / 10;
}

export function computeNdviHealth(n) {
  // Active clearing reports nudge NDVI down for the demo (in production we'd use Landsat).
  const clearingReports = meanCitizenSeverity(n.lga, 'clearing', 24 * 7);
  const penalty = 0.05 * Math.min(1, clearingReports.count / 5);
  const v = Math.max(0, Math.min(1, n.baseline_ndvi - penalty));
  return Math.round(v * 100) / 100;
}

// Short text summary used in Planner table; full structured solutions
// come from services/solutions.js via /api/v1/solutions/:lga.
export function recommendation(scores) {
  const { heat_score, flood_risk_score, ndvi_health } = scores;
  const parts = [];
  if (heat_score >= 7) parts.push('cool roofs + tree corridors');
  else if (heat_score >= 5) parts.push('shade interventions');
  if (flood_risk_score >= 7) parts.push('drain audit + sandbag caches');
  else if (flood_risk_score >= 5) parts.push('community drain clearance');
  if (ndvi_health < 0.3) parts.push('reforestation grant');
  else if (ndvi_health < 0.5) parts.push('protect green cover');
  return parts.length ? `Priority: ${parts.join('; ')}.` : 'Within tolerance; monitor.';
}

export function recomputeAllScores() {
  for (const n of store.neighbourhoods) {
    const heat_score = computeHeatScore(n);
    const flood_risk_score = computeFloodRisk(n);
    const ndvi_health = computeNdviHealth(n);
    const reports_24h = store.reportsInLastHours(n.lga, 24).length;
    store.scores.set(n.lga, {
      lga: n.lga,
      lat: n.lat,
      lng: n.lng,
      heat_score,
      flood_risk_score,
      ndvi_health,
      reports_24h,
      updated_at: new Date().toISOString(),
    });
  }
}
