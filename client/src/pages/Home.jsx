import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import Icon, { kindIcon } from '../components/Icon.jsx';
import { scoreTone } from '../components/ScoreBadge.jsx';

export default function Home() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState(null);
  const [heroAction, setHeroAction] = useState(null);

  useEffect(() => {
    Promise.all([api.plannerSummary(), api.recentReports(6)])
      .then(([s, r]) => { setSummary(s); setRecent(r.reports || []); })
      .catch(e => setError(e.message));
  }, []);

  const topThree = summary?.lgas?.slice(0, 3) || [];
  const hero = topThree[0];

  // Fetch the top recommended action for the hero LGA — surfaces the solutions engine on landing.
  useEffect(() => {
    if (!hero?.lga) return;
    let cancelled = false;
    api.solutionsFor(hero.lga)
      .then(s => { if (!cancelled) setHeroAction(s?.solutions?.[0] || null); })
      .catch(() => { if (!cancelled) setHeroAction(null); });
    return () => { cancelled = true; };
  }, [hero?.lga]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-10">
      {/* Eyebrow / status strip */}
      <div className="flex items-center justify-between mb-5 animate-fade-in surface-raised px-4 py-3 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="live-dot" />
          <span className="label-eyebrow text-ink-200">Live · Lagos State</span>
          <span className="hidden md:inline label-eyebrow text-ink-500">
            Updated {summary ? timeAgo(summary.generated_at) : '—'}
          </span>
        </div>
        <Link to="/map" className="text-sm text-accent-600 hover:text-accent-500 flex items-center gap-1.5">
          Open live map <Icon name="arrow_right" size={14} />
        </Link>
      </div>

      {/* HERO */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 mb-10 animate-slide-up">
        {/* Featured neighbourhood — large */}
        <div className="lg:col-span-2 surface-raised relative overflow-hidden p-6 md:p-8 min-h-[320px] bg-gradient-to-br from-white via-accent-50/50 to-white border-accent-500/10">
          <div className="absolute inset-0 bg-grid-faint bg-[size:32px_32px] opacity-60 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />

          {hero ? (
            <div className="relative flex flex-col h-full gap-6">
              <div>
                <div className="label-eyebrow text-accent-600">⚠ Highest risk right now</div>
                <h1 className="display text-5xl md:text-7xl mt-2 leading-[0.95]">
                  {hero.lga}
                </h1>
                <p className="text-ink-200 mt-3 max-w-2xl text-sm md:text-base leading-relaxed">
                  {hero.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricPill kind="heat"  label="Heat"  value={hero.heat_score.toFixed(1)} max="10" />
                <MetricPill kind="flood" label="Flood" value={hero.flood_risk_score.toFixed(1)} max="10" />
                <MetricPill kind="ndvi"  label="NDVI"  value={hero.ndvi_health.toFixed(2)} max="1" inverse />
              </div>

              <div className="flex items-center gap-3 mt-auto pt-1">
                <Link to="/map" className="btn-primary text-sm">
                  Investigate
                  <Icon name="arrow_right" size={14} />
                </Link>
                <span className="chip">Layered: heat · flood · green space</span>
              </div>
            </div>
          ) : (
            <HeroSkeleton error={error} />
          )}
        </div>

        {/* Right-side: KPIs stacked */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-5">
          <StatTile icon="bell"   label="Active alerts" value={summary?.totals?.active_alerts} hint="last hour"   ready={!!summary} />
          <StatTile icon="pulse"  label="Reports (24h)" value={summary?.totals?.reports_24h}   hint="app + USSD"  ready={!!summary} />
          <StatTile icon="map"    label="Coverage"      value={summary?.totals?.neighbourhoods} hint="LGAs tracked" suffix="LGAs" ready={!!summary} />
        </div>
      </section>

      {/* Solutions teaser — surfaces the prescription engine on landing */}
      {hero && (
        <section className="mb-10 animate-fade-in">
          <HeroActionCard hero={hero} action={heroAction} />
        </section>
      )}

      {/* Top risks + Recent reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        {/* Top risks (top 3) */}
        <section className="lg:col-span-2 surface p-5 md:p-6 animate-fade-in">
          <header className="flex items-center justify-between mb-5">
            <div>
              <h2 className="display text-xl">Hotspots</h2>
              <p className="text-xs text-ink-500 mt-0.5">Neighbourhoods ranked by composite risk</p>
            </div>
            <Link to="/planner" className="text-xs text-ink-200 hover:text-accent-400 flex items-center gap-1">
              See all <Icon name="arrow_right" size={12} />
            </Link>
          </header>

          {topThree.length === 0 ? (
            <ListSkeleton n={3} />
          ) : (
            <div className="space-y-2.5">
              {topThree.map((l, i) => <HotspotRow key={l.lga} lga={l} rank={i + 1} />)}
            </div>
          )}
        </section>

        {/* Recent reports */}
        <section className="surface p-5 md:p-6 animate-fade-in">
          <header className="flex items-center justify-between mb-5">
            <h2 className="display text-xl">Activity</h2>
            <span className="chip">Live feed</span>
          </header>

          {recent.length === 0 ? (
            <ListSkeleton n={5} />
          ) : (
            <ul className="space-y-3">
              {recent.map(r => <ReportRow key={r.id} r={r} />)}
            </ul>
          )}

          <Link to="/report" className="btn-secondary w-full mt-5 text-sm justify-center">
            <Icon name="pin" size={16} />
            Submit a report
          </Link>
        </section>
      </div>

      {/* Quick actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <ActionCard
          to="/map" icon="layers" tone="accent"
          title="Live climate map"
          desc="Heat, flood and green-space layers updated every 15 minutes"
        />
        <ActionCard
          to="/planner" icon="target" tone="success"
          title="Solutions for planners"
          desc="Quantified, costed actions per LGA. Society + government split."
        />
        <ActionCard
          to="/report" icon="pin" tone="flood"
          title="Citizen reporting"
          desc="Crowdsource what's happening in your neighbourhood. 30 seconds."
        />
      </section>
    </div>
  );
}

/* ─── small subcomponents ─── */

function HeroSkeleton({ error }) {
  if (error) return <div className="text-danger text-sm">API offline — {error}</div>;
  return (
    <div className="space-y-3">
      <div className="skeleton h-3 w-32" />
      <div className="skeleton h-14 w-60" />
      <div className="skeleton h-3 w-full max-w-md" />
      <div className="skeleton h-3 w-3/4" />
    </div>
  );
}

function ListSkeleton({ n }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: n }).map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
    </div>
  );
}

function MetricPill({ kind, label, value, max, inverse }) {
  const v = parseFloat(value);
  const m = parseFloat(max);
  const pct = inverse ? (1 - v / m) * 100 : (v / m) * 100;
  const colors = {
    heat:  { ring: 'border-heat-bright/40',  text: 'text-heat-bright',  bar: 'bg-heat-bright' },
    flood: { ring: 'border-flood-bright/40', text: 'text-flood-bright', bar: 'bg-flood-bright' },
    ndvi:  { ring: 'border-ndvi-bright/40',  text: 'text-ndvi-bright',  bar: 'bg-ndvi-bright' },
  }[kind];
  return (
    <div className={`flex items-center gap-3 surface border ${colors.ring} px-3 py-2`}>
      <Icon name={kindIcon(kind)} size={16} className={colors.text} />
      <div>
        <div className="text-2xs uppercase tracking-wider text-ink-400">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono font-semibold text-base text-ink-50">{value}</span>
          <span className="text-2xs text-ink-500">/ {max}</span>
        </div>
      </div>
      <div className="w-12 h-1.5 rounded-full bg-bg-border overflow-hidden">
        <div className={`h-full ${colors.bar} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, hint, suffix, ready }) {
  return (
    <div className="surface p-5 hover:-translate-y-0.5 hover:shadow-lift transition-all group bg-white/95">
      <div className="flex items-start justify-between mb-3">
        <span className="label-eyebrow">{label}</span>
        <Icon name={icon} size={18} className="text-ink-500 group-hover:text-accent-400 transition-colors" />
      </div>
      {ready ? (
        <div className="flex items-baseline gap-1.5">
          <span className="display text-4xl">{value ?? 0}</span>
          {suffix && <span className="text-ink-500 text-sm">{suffix}</span>}
        </div>
      ) : (
        <div className="skeleton h-9 w-20 rounded-lg" />
      )}
      <div className="text-2xs text-ink-500 mt-1">{hint}</div>
    </div>
  );
}

function HeroActionCard({ hero, action }) {
  if (!action) {
    return (
      <div className="surface p-5 md:p-6 bg-white/95 border-accent-500/15">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="target" size={16} className="text-accent-400" />
          <span className="label-eyebrow text-accent-600">Top action for {hero.lga}</span>
        </div>
        <div className="skeleton h-4 w-2/3 mb-2" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    );
  }

  const a = action.action || {};
  const actorTone =
    action.actor === 'society'    ? { label: 'Community',  cls: 'text-flood-bright bg-flood-bright/10', icon: 'handshake' } :
    action.actor === 'government' ? { label: 'Government', cls: 'text-accent-400 bg-accent-500/10',     icon: 'building'  } :
                                    { label: 'Joint',      cls: 'text-success bg-success/10',           icon: 'sparkles'  };
  const urgencyDot =
    action.urgency === 'immediate'  ? 'bg-danger'  :
    action.urgency === 'short_term' ? 'bg-warn'    : 'bg-ink-400';
  const urgencyLabel =
    action.urgency === 'immediate'  ? 'Immediate'  :
    action.urgency === 'short_term' ? 'Short-term' : 'Long-term';

  return (
    <Link to="/planner" className="block surface p-5 md:p-6 bg-white/95 hover:-translate-y-0.5 hover:shadow-lift transition-all border-accent-500/15 hover:border-accent-500/40">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="target" size={16} className="text-accent-400" />
            <span className="label-eyebrow text-accent-600">Top action for {hero.lga}</span>
          </div>
          <h3 className="display text-xl md:text-2xl text-ink-50 leading-tight">{action.title}</h3>
          {a.target && (
            <p className="text-sm text-ink-400 mt-2 leading-relaxed line-clamp-2">{a.target}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-2xs">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${actorTone.cls}`}>
              <Icon name={actorTone.icon} size={11} />
              {actorTone.label}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-400">
              <span className={`w-1.5 h-1.5 rounded-full ${urgencyDot}`} />
              {urgencyLabel}
            </span>
            {a.cost_estimate && (
              <span className="inline-flex items-center gap-1 text-ink-400">
                <Icon name="cash" size={11} />
                {a.cost_estimate.split('(')[0].trim()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-accent-600 shrink-0 md:self-end">
          <span>Open Planner</span>
          <Icon name="arrow_right" size={14} />
        </div>
      </div>
    </Link>
  );
}

function HotspotRow({ lga, rank }) {
  const tone = scoreTone(lga.heat_score);
  return (
    <Link to="/map" className="flex items-center gap-4 p-3 rounded-2xl hover:bg-bg-hover transition group border border-transparent hover:border-bg-border">
      <div className={`w-10 h-10 rounded-xl surface-raised grid place-items-center text-sm font-bold ${tone.text} bg-white`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-ink-50 truncate">{lga.lga}</div>
        <div className="text-2xs text-ink-500 truncate mt-0.5">{lga.summary}</div>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 text-2xs">
        <ScoreBar kind="heat"  value={lga.heat_score} max={10} />
        <ScoreBar kind="flood" value={lga.flood_risk_score} max={10} />
        <ScoreBar kind="ndvi"  value={(1 - lga.ndvi_health) * 10} max={10} />
      </div>
      <Icon name="chevron_right" size={16} className="text-ink-500 group-hover:text-accent-400 transition" />
    </Link>
  );
}

function ScoreBar({ kind, value, max }) {
  const colors = { heat: 'bg-heat-bright', flood: 'bg-flood-bright', ndvi: 'bg-ndvi-bright' };
  return (
    <div className="w-6 h-12 rounded-sm bg-bg-border overflow-hidden flex flex-col justify-end">
      <div className={`w-full ${colors[kind]} opacity-80`} style={{ height: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

function ReportRow({ r }) {
  return (
    <li className="flex items-start gap-3">
      <div className={`shrink-0 w-9 h-9 rounded-lg surface-raised grid place-items-center ${
        r.report_type === 'heat'  ? 'text-heat-bright'  :
        r.report_type === 'flood' ? 'text-flood-bright' : 'text-ndvi-bright'
      }`}>
        <Icon name={kindIcon(r.report_type)} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-sm text-ink-50 truncate">{r.lga}</span>
          <span className="text-2xs text-ink-500 shrink-0">{timeAgo(r.created_at)}</span>
        </div>
        <div className="text-2xs text-ink-400 mt-0.5">
          Severity {r.severity}/5 · via {r.source}
        </div>
      </div>
    </li>
  );
}

function ActionCard({ to, icon, tone, title, desc }) {
  const tones = {
    accent: 'hover:border-accent-500/60 hover:shadow-glow',
    success: 'hover:border-success/60',
    flood: 'hover:border-flood-bright/60',
  };
  const iconTones = {
    accent: 'text-accent-400 bg-accent-500/10',
    success: 'text-success bg-success/10',
    flood: 'text-flood-bright bg-flood-bright/10',
  };
  return (
    <Link to={to} className={`surface p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-white ${tones[tone]} group bg-white/95`}>
      <div className={`w-12 h-12 rounded-2xl grid place-items-center mb-4 ${iconTones[tone]} border border-white/60 shadow-sm`}>
        <Icon name={icon} size={22} />
      </div>
      <h3 className="display text-lg text-ink-50 mb-1">{title}</h3>
      <p className="text-sm text-ink-400 leading-relaxed">{desc}</p>
      <div className="mt-4 text-xs text-ink-200 flex items-center gap-1.5 group-hover:text-accent-400 transition-colors">
        Open <Icon name="arrow_right" size={12} />
      </div>
    </Link>
  );
}

function timeAgo(iso) {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
