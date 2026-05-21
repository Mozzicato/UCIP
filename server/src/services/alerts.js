import { store } from '../store/index.js';

const HEAT_THRESHOLD = 8.0;
const FLOOD_THRESHOLD = 6.0;
const FLOOD_RAINFALL_MM = 30;
const NDVI_DECLINE_THRESHOLD = 0.05;

const lastFired = new Map(); // key -> ts

function shouldFire(key, cooldownMs = 30 * 60_000) {
  const t = lastFired.get(key) || 0;
  if (Date.now() - t < cooldownMs) return false;
  lastFired.set(key, Date.now());
  return true;
}

// Stub dispatch — in production this calls FCM + Africa's Talking SMS.
// Returns recipient count + channel.
export function dispatchAlert({ lga, kind, payload }) {
  const recipients = store.subscriberCount(lga);
  const alert = {
    lga,
    kind,
    payload,
    recipients,
    channels: recipients > 0 ? ['push', 'sms'] : ['push'],
    dispatched_at: new Date().toISOString(),
  };
  store.recordAlert(alert);
  // Console-log is the demo's "delivery" — visible in the dev terminal.
  console.log(`🚨 [alert] ${kind.toUpperCase()} for ${lga} → ${recipients} subscriber(s)`);
  return alert;
}

export function evaluateAlerts() {
  const fired = [];
  for (const s of store.scores.values()) {
    const weather = store.weather.get(s.lga);
    const rain = weather?.forecast_rainfall_mm_6h ?? 0;

    if (s.heat_score >= HEAT_THRESHOLD && shouldFire(`heat:${s.lga}`)) {
      fired.push(dispatchAlert({
        lga: s.lga, kind: 'heat',
        payload: { score: s.heat_score, message: `Extreme heat in ${s.lga}. Stay hydrated, avoid 12–4pm exposure.` },
      }));
    }
    if (s.flood_risk_score >= FLOOD_THRESHOLD && rain >= FLOOD_RAINFALL_MM && shouldFire(`flood:${s.lga}`)) {
      fired.push(dispatchAlert({
        lga: s.lga, kind: 'flood',
        payload: { score: s.flood_risk_score, rainfall_mm: rain, message: `Flood risk high in ${s.lga}. Move valuables; avoid low areas.` },
      }));
    }
  }
  return fired;
}
