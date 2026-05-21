import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';
import SolutionCard from '../components/SolutionCard.jsx';
import Icon from '../components/Icon.jsx';

export default function Planner() {
  const [summary, setSummary] = useState(null);
  const [board, setBoard] = useState([]);
  const [selectedLga, setSelectedLga] = useState('');
  const [solutionDetail, setSolutionDetail] = useState(null);
  const [actorFilter, setActorFilter] = useState('all');

  useEffect(() => {
    Promise.all([api.plannerSummary(), api.leaderboard()])
      .then(([s, l]) => {
        setSummary(s); setBoard(l.leaderboard || []);
        if (s.lgas?.length) setSelectedLga(s.lgas[0].lga);
      });
  }, []);

  useEffect(() => {
    if (!selectedLga) return;
    api.solutionsFor(selectedLga).then(setSolutionDetail).catch(() => setSolutionDetail(null));
  }, [selectedLga]);

  const filteredSolutions = useMemo(() => {
    if (!solutionDetail?.solutions) return [];
    if (actorFilter === 'all') return solutionDetail.solutions;
    return solutionDetail.solutions.filter(s => s.actor === actorFilter || s.actor === 'both');
  }, [solutionDetail, actorFilter]);

  // headline KPIs
  const kpis = useMemo(() => {
    if (!summary?.lgas) return null;
    const lgas = summary.lgas;
    const heat = lgas.reduce((a, l) => a + l.heat_score, 0) / lgas.length;
    const flood = lgas.reduce((a, l) => a + l.flood_risk_score, 0) / lgas.length;
    const critical = lgas.filter(l => l.heat_score >= 7 || l.flood_risk_score >= 7).length;
    return { heat, flood, critical, total: lgas.length };
  }, [summary]);

  function exportCsv(kind = 'risk') {
    if (!summary?.lgas) return;
    let rows, filename;
    if (kind === 'risk') {
      rows = [
        ['LGA', 'Heat', 'Flood', 'NDVI', 'Reports 24h', 'Priority'],
        ...summary.lgas.map(l => [l.lga, l.heat_score, l.flood_risk_score, l.ndvi_health, l.reports_24h, JSON.stringify(l.summary)]),
      ];
      filename = `ucip-risk-${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      // solutions for the selected LGA
      if (!solutionDetail?.solutions) return;
      rows = [['LGA', 'Solution', 'Actor', 'Urgency', 'Cost band', 'Target', 'Deadline', 'Locations', 'Cost estimate', 'KPI', 'Funding']];
      for (const s of solutionDetail.solutions) {
        rows.push([
          solutionDetail.lga, JSON.stringify(s.title), s.actor, s.urgency, s.cost,
          JSON.stringify(s.action?.target || ''),
          JSON.stringify(s.action?.deadline || ''),
          JSON.stringify(s.action?.locations || ''),
          JSON.stringify(s.action?.cost_estimate || ''),
          JSON.stringify(s.action?.kpi || ''),
          JSON.stringify(s.who_pays || ''),
        ]);
      }
      filename = `ucip-solutions-${solutionDetail.lga.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-10 pb-10 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-in">
        <div>
          <div className="label-eyebrow text-accent-600">For planners</div>
          <h1 className="display text-4xl md:text-5xl mt-1">City briefing</h1>
          <p className="text-ink-400 mt-2 text-sm max-w-2xl">
            Aggregated risk per LGA and quantified actions a planner or community can take this week, this quarter, and this year.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCsv('risk')} className="btn-secondary text-sm">
            <Icon name="download" size={14} /> Risk CSV
          </button>
          <button onClick={() => exportCsv('solutions')} className="btn-secondary text-sm">
            <Icon name="download" size={14} /> Solutions CSV
          </button>
        </div>
      </header>

      {/* KPI row */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
          <Kpi label="Avg heat" value={kpis.heat.toFixed(1)} max="/10" icon="flame" tone="text-heat-bright" />
          <Kpi label="Avg flood" value={kpis.flood.toFixed(1)} max="/10" icon="drop" tone="text-flood-bright" />
          <Kpi label="Critical LGAs" value={kpis.critical} max={`of ${kpis.total}`} icon="alert" tone="text-danger" />
          <Kpi label="Active alerts" value={summary?.totals?.active_alerts ?? 0} max="last hr" icon="bell" tone="text-accent-400" />
        </div>
      )}

      {/* Risk table */}
      <section className="surface overflow-hidden animate-fade-in bg-white/95">
        <header className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <div>
            <h2 className="display text-lg">Risk by neighbourhood</h2>
            <p className="text-2xs text-ink-500">Tap a row to load solutions below</p>
          </div>
          <span className="chip">{summary?.lgas?.length ?? 0} LGAs</span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white text-ink-400">
              <tr>
                <th className="text-left px-5 py-3 text-2xs font-semibold uppercase tracking-wider">LGA</th>
                <th className="text-left px-3 py-3 text-2xs font-semibold uppercase tracking-wider">Heat</th>
                <th className="text-left px-3 py-3 text-2xs font-semibold uppercase tracking-wider">Flood</th>
                <th className="text-left px-3 py-3 text-2xs font-semibold uppercase tracking-wider">NDVI</th>
                <th className="text-left px-3 py-3 text-2xs font-semibold uppercase tracking-wider">Reports</th>
                <th className="text-left px-3 py-3 text-2xs font-semibold uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody>
              {summary?.lgas?.map(l => (
                <tr key={l.lga} onClick={() => setSelectedLga(l.lga)}
                  className={`border-t border-bg-border cursor-pointer transition-colors ${
                    selectedLga === l.lga ? 'bg-accent-500/10' : 'hover:bg-bg-hover'
                  }`}>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold flex items-center gap-2">
                      {selectedLga === l.lga && <span className="w-1.5 h-4 rounded-full bg-accent-500" />}
                      {l.lga}
                    </div>
                  </td>
                  <td className="px-3 py-3.5"><ScoreBadge score={l.heat_score} /></td>
                  <td className="px-3 py-3.5"><ScoreBadge score={l.flood_risk_score} /></td>
                  <td className="px-3 py-3.5">
                    <span className={`font-mono text-xs ${l.ndvi_health < 0.3 ? 'text-danger' : l.ndvi_health < 0.5 ? 'text-warn' : 'text-success'}`}>
                      {l.ndvi_health.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-ink-300 font-mono text-xs">{l.reports_24h}</td>
                  <td className="px-3 py-3.5 text-ink-400 max-w-md text-xs">{l.summary}</td>
                </tr>
              ))}
              {!summary && (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-ink-500">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Solutions deep-dive */}
      <section className="surface p-5 md:p-6 animate-fade-in bg-white/95">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="display text-2xl flex items-center gap-2">
              <Icon name="target" size={22} className="text-accent-400" />
              Actions for {selectedLga}
            </h2>
            <p className="text-xs text-ink-500 mt-1">
              {solutionDetail?.diagnosis?.length
                ? `${solutionDetail.diagnosis.length} issue${solutionDetail.diagnosis.length > 1 ? 's' : ''} detected · ${filteredSolutions.length} actions ranked`
                : 'Pick an LGA above to see tailored solutions'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={selectedLga} onChange={e => setSelectedLga(e.target.value)} className="input py-2 px-3 w-auto bg-white">
              {summary?.lgas?.map(l => <option key={l.lga} value={l.lga} className="bg-bg-card">{l.lga}</option>)}
            </select>
            <div className="surface-raised flex p-1 text-xs bg-white/95">
              {[
                { id: 'all', label: 'All', icon: null },
                { id: 'society', label: 'Society', icon: 'handshake' },
                { id: 'government', label: 'Government', icon: 'building' },
              ].map(f => (
                <button key={f.id} onClick={() => setActorFilter(f.id)}
                  className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                    actorFilter === f.id ? 'bg-accent-500/20 text-accent-600' : 'text-ink-400 hover:text-ink-200'
                  }`}>
                  {f.icon && <Icon name={f.icon} size={12} />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Diagnosis */}
        {solutionDetail?.diagnosis?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {solutionDetail.diagnosis.map((d, i) => (
              <div key={i} className={`text-xs rounded-lg px-3 py-1.5 border flex items-center gap-2 ${
                d.severity === 'critical' ? 'bg-danger/10 border-danger/40 text-danger' :
                d.severity === 'high'     ? 'bg-warn/10   border-warn/40   text-warn' :
                                            'bg-bg-higher border-bg-border  text-ink-300'
              }`}>
                <Icon name="alert" size={12} />
                <span className="font-semibold capitalize">{d.severity}:</span>
                <span>{d.msg}</span>
              </div>
            ))}
          </div>
        )}

        {filteredSolutions.length === 0 ? (
          <div className="text-center py-12">
            {solutionDetail ? (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-success/15 grid place-items-center text-success mb-3">
                  <Icon name="sparkles" size={26} />
                </div>
                <div className="text-sm text-ink-200">No actions triggered for this filter</div>
                <div className="text-2xs text-ink-500 mt-1">Either area is within tolerance or no matching actor.</div>
              </>
            ) : <div className="text-sm text-ink-500">Loading…</div>}
          </div>
        ) : (
          <UrgencyColumns solutions={filteredSolutions} />
        )}
      </section>

      {/* NDVI leaderboard */}
      <section className="surface p-5 md:p-6 animate-fade-in bg-white/95">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="display text-lg flex items-center gap-2">
              <Icon name="leaf" size={18} className="text-ndvi-bright" />
              Green-space leaderboard
            </h2>
            <p className="text-2xs text-ink-500 mt-0.5">NDVI per neighbourhood — higher is healthier</p>
          </div>
        </header>
        <div className="space-y-2">
          {board.map((b, i) => (
            <button key={b.lga} onClick={() => setSelectedLga(b.lga)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-bg-hover transition group">
              <span className="w-6 text-xs text-ink-500 font-mono">{i + 1}</span>
              <span className="w-28 text-sm text-left truncate group-hover:text-accent-400">{b.lga}</span>
              <div className="flex-1 h-2 rounded-full bg-bg-border overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, b.ndvi_health * 100)}%`,
                  background: b.ndvi_health >= 0.5 ? '#4ade80' : b.ndvi_health >= 0.3 ? '#fbbf24' : '#ef4444',
                }} />
              </div>
              <span className="w-10 text-right font-mono text-2xs text-ink-300">{b.ndvi_health.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, max, icon, tone }) {
  return (
    <div className="surface p-4 bg-white/95">
      <div className="flex items-start justify-between mb-2">
        <span className="label-eyebrow">{label}</span>
        <Icon name={icon} size={16} className={tone} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="display text-3xl">{value}</span>
        <span className="text-2xs text-ink-500">{max}</span>
      </div>
    </div>
  );
}

function UrgencyColumns({ solutions }) {
  const buckets = {
    immediate:  solutions.filter(s => s.urgency === 'immediate'),
    short_term: solutions.filter(s => s.urgency === 'short_term'),
    long_term:  solutions.filter(s => s.urgency === 'long_term'),
  };
  const meta = {
    immediate:  { title: 'Immediate', sub: 'this week',  dot: 'bg-danger',  text: 'text-danger' },
    short_term: { title: 'Short-term', sub: '1–6 months', dot: 'bg-warn',    text: 'text-warn' },
    long_term:  { title: 'Long-term',  sub: '6 months+',  dot: 'bg-ink-400', text: 'text-ink-400' },
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {['immediate', 'short_term', 'long_term'].map(k => (
        <div key={k}>
          <header className="flex items-center justify-between mb-3 pb-2 border-b border-bg-border">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${meta[k].dot}`} />
              <span className={`text-sm font-semibold ${meta[k].text}`}>{meta[k].title}</span>
              <span className="text-2xs text-ink-500">{meta[k].sub}</span>
            </div>
            <span className="text-2xs text-ink-500 font-mono">{buckets[k].length}</span>
          </header>
          <div className="space-y-3">
            {buckets[k].length === 0
              ? <div className="text-2xs text-ink-600 italic py-2 text-center">No actions in this window</div>
              : buckets[k].map(s => <SolutionCard key={s.id} solution={s} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
