import { SOLUTIONS } from '../data/solutions.js';
import { store } from '../store/index.js';

function clearingCount(lga) {
  return store.reportsInLastHours(lga, 24 * 14).filter(r => r.report_type === 'clearing').length;
}

function matches(sol, ctx) {
  const t = sol.triggers || {};
  if (t.heat_min !== undefined && ctx.heat_score < t.heat_min) return false;
  if (t.flood_min !== undefined && ctx.flood_risk_score < t.flood_min) return false;
  if (t.ndvi_max !== undefined && ctx.ndvi_health > t.ndvi_max) return false;
  if (t.clearing_reports_min !== undefined && ctx.clearing_reports < t.clearing_reports_min) return false;
  return true;
}

// Higher score = more relevant. Combines:
//  – how far the trigger threshold is exceeded
//  – impact magnitude on the problem dimension
//  – immediacy (immediate > short_term > long_term)
function relevance(sol, ctx) {
  const t = sol.triggers || {};
  let exceed = 0;
  if (t.heat_min !== undefined)              exceed += Math.max(0, ctx.heat_score - t.heat_min) / 10;
  if (t.flood_min !== undefined)             exceed += Math.max(0, ctx.flood_risk_score - t.flood_min) / 10;
  if (t.ndvi_max !== undefined)              exceed += Math.max(0, t.ndvi_max - ctx.ndvi_health);
  if (t.clearing_reports_min !== undefined)  exceed += Math.min(1, ctx.clearing_reports / 5);

  const impactMag =
    Math.abs(sol.impact?.heat  ?? 0) / 2 +
    Math.abs(sol.impact?.flood ?? 0) / 2 +
    Math.abs(sol.impact?.ndvi  ?? 0) * 5;

  const urgencyBoost = sol.urgency === 'immediate' ? 0.4 : sol.urgency === 'short_term' ? 0.2 : 0;

  return exceed * 1.5 + impactMag + urgencyBoost;
}

export function solutionsFor(score) {
  const ctx = {
    lga: score.lga,
    heat_score: score.heat_score,
    flood_risk_score: score.flood_risk_score,
    ndvi_health: score.ndvi_health,
    clearing_reports: clearingCount(score.lga),
  };

  const matched = SOLUTIONS
    .filter(s => matches(s, ctx))
    .map(s => {
      // Run the quantify function to produce LGA-specific concrete targets.
      // Failures are non-fatal — solution still shown without the action box.
      let action = null;
      try { action = s.quantify ? s.quantify(ctx) : null; }
      catch (e) { console.warn(`[solutions] quantify failed for ${s.id}:`, e.message); }
      const { quantify, ...rest } = s;
      return { ...rest, action, _score: relevance(s, ctx) };
    })
    .sort((a, b) => b._score - a._score);

  return {
    lga: score.lga,
    diagnosis: diagnose(ctx),
    context: ctx,
    solutions: matched.map(({ _score, ...s }) => s),
    by_actor: {
      society:    matched.filter(s => s.actor === 'society' || s.actor === 'both').map(s => s.id),
      government: matched.filter(s => s.actor === 'government' || s.actor === 'both').map(s => s.id),
    },
    by_urgency: {
      immediate:  matched.filter(s => s.urgency === 'immediate').map(s => s.id),
      short_term: matched.filter(s => s.urgency === 'short_term').map(s => s.id),
      long_term:  matched.filter(s => s.urgency === 'long_term').map(s => s.id),
    },
  };
}

function diagnose(ctx) {
  const issues = [];
  if (ctx.heat_score >= 8)       issues.push({ kind: 'heat', severity: 'critical', msg: 'Extreme heat island — health emergency conditions.' });
  else if (ctx.heat_score >= 6)  issues.push({ kind: 'heat', severity: 'high',     msg: 'Persistent heat island. Vulnerable groups at risk.' });
  else if (ctx.heat_score >= 4)  issues.push({ kind: 'heat', severity: 'moderate', msg: 'Above-baseline warmth. Plan mitigations.' });

  if (ctx.flood_risk_score >= 7) issues.push({ kind: 'flood', severity: 'critical', msg: 'Active flood risk — pre-position resources now.' });
  else if (ctx.flood_risk_score >= 5) issues.push({ kind: 'flood', severity: 'high', msg: 'Elevated flood risk. Drains likely choked.' });

  if (ctx.ndvi_health < 0.2)     issues.push({ kind: 'ndvi', severity: 'critical', msg: 'Vegetation collapse. Concrete heat-trap conditions.' });
  else if (ctx.ndvi_health < 0.35) issues.push({ kind: 'ndvi', severity: 'high', msg: 'Vegetation cover below healthy threshold.' });

  if (ctx.clearing_reports >= 3) issues.push({ kind: 'ndvi', severity: 'high', msg: `${ctx.clearing_reports} clearing reports in last 14 days — active deforestation.` });

  return issues;
}
