import { NEIGHBOURHOODS } from '../data/neighbourhoods.js';

const DEMO_MODE = (process.env.DEMO_MODE ?? 'true').toLowerCase() === 'true';

// in-memory store. Replace methods to call Supabase when DEMO_MODE=false.
export const store = {
  demoMode: DEMO_MODE,
  reports: [],
  weather: new Map(),       // lga -> { temperature_c, rainfall_mm, fetched_at }
  scores: new Map(),        // lga -> { heat_score, flood_risk_score, ndvi_health, ... }
  subscribers: new Map(),   // lga -> Set of phone/user IDs (stub)
  alerts: [],
  nextReportId: 1000,
  neighbourhoods: NEIGHBOURHOODS,

  async init() {
    // Seed mock historical reports so the demo isn't empty on first boot.
    if (this.reports.length === 0) {
      const now = Date.now();
      const seed = [
        { lga: 'Mushin',    report_type: 'heat',     severity: 5, mins: 12 },
        { lga: 'Mushin',    report_type: 'heat',     severity: 4, mins: 38 },
        { lga: 'Surulere',  report_type: 'heat',     severity: 4, mins: 22 },
        { lga: 'Lagos Island', report_type: 'heat',  severity: 4, mins: 90 },
        { lga: 'Apapa',     report_type: 'flood',    severity: 4, mins: 45 },
        { lga: 'Ajegunle',  report_type: 'flood',    severity: 5, mins: 60 },
        { lga: 'Lekki Phase 1', report_type: 'flood', severity: 3, mins: 120 },
        { lga: 'Alimosho',  report_type: 'clearing', severity: 3, mins: 240 },
        { lga: 'Ikorodu',   report_type: 'clearing', severity: 2, mins: 300 },
        { lga: 'Oshodi',    report_type: 'heat',     severity: 4, mins: 75 },
      ];
      for (const s of seed) {
        const n = NEIGHBOURHOODS.find(x => x.lga === s.lga);
        if (!n) continue;
        this.reports.push({
          id: `RPT-${this.nextReportId++}`,
          report_type: s.report_type,
          severity: s.severity,
          latitude: n.lat + (Math.random() - 0.5) * 0.005,
          longitude: n.lng + (Math.random() - 0.5) * 0.005,
          lga: s.lga,
          notes: '',
          source: Math.random() > 0.7 ? 'ussd' : 'app',
          created_at: new Date(now - s.mins * 60_000).toISOString(),
        });
      }
    }
  },

  addReport(r) {
    const row = {
      id: `RPT-${this.nextReportId++}`,
      created_at: new Date().toISOString(),
      notes: '',
      source: 'app',
      ...r,
    };
    this.reports.unshift(row);
    return row;
  },

  recentReports(limit = 20) {
    return this.reports.slice(0, limit);
  },

  reportsInLastHours(lga, hours) {
    const cutoff = Date.now() - hours * 3600_000;
    return this.reports.filter(r => r.lga === lga && new Date(r.created_at).getTime() >= cutoff);
  },

  subscribe(lga, identifier) {
    if (!this.subscribers.has(lga)) this.subscribers.set(lga, new Set());
    this.subscribers.get(lga).add(identifier);
  },
  subscriberCount(lga) {
    return this.subscribers.get(lga)?.size ?? 0;
  },

  recordAlert(alert) {
    this.alerts.unshift({ id: `ALR-${Date.now()}`, ...alert });
    if (this.alerts.length > 200) this.alerts.length = 200;
  },
};
