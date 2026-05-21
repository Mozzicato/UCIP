import { store } from '../store/index.js';

const BASE = process.env.OPEN_METEO_BASE || 'https://api.open-meteo.com/v1';

// Fetch current temperature + 6h precip forecast per neighbourhood centroid.
// Open-Meteo is keyless and rate-limit friendly. We chunk neighbourhoods to keep URLs short.
export async function fetchOpenMeteoForLagos() {
  const ns = store.neighbourhoods;
  if (!ns.length) return 0;

  const chunks = chunk(ns, 8); // up to 8 lat/lng pairs per request
  let updated = 0;

  for (const c of chunks) {
    const lats = c.map(n => n.lat.toFixed(4)).join(',');
    const lngs = c.map(n => n.lng.toFixed(4)).join(',');
    const url = `${BASE}/forecast?latitude=${lats}&longitude=${lngs}` +
      `&current=temperature_2m,precipitation&hourly=precipitation` +
      `&forecast_hours=6&timezone=Africa%2FLagos`;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`);
      const json = await r.json();
      const list = Array.isArray(json) ? json : [json]; // single point returns object
      for (let i = 0; i < c.length; i++) {
        const point = list[i] || list[0];
        const tempC = point?.current?.temperature_2m;
        const hourly = point?.hourly?.precipitation || [];
        const rain6h = hourly.slice(0, 6).reduce((a, b) => a + (b || 0), 0);
        store.weather.set(c[i].lga, {
          temperature_c: typeof tempC === 'number' ? tempC : c[i].baseline_lst,
          forecast_rainfall_mm_6h: rain6h,
          fetched_at: new Date().toISOString(),
        });
        updated++;
      }
    } catch (e) {
      // network failures are non-fatal — scoring falls back to baselines
      console.warn('[weather] fetch failed:', e.message);
      for (const n of c) {
        if (!store.weather.has(n.lga)) {
          store.weather.set(n.lga, {
            temperature_c: n.baseline_lst,
            forecast_rainfall_mm_6h: 0,
            fetched_at: new Date().toISOString(),
            stale: true,
          });
        }
      }
    }
  }
  return updated;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
