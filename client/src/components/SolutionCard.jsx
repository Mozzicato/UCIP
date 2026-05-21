import { useState } from 'react';
import Icon, { kindIcon } from './Icon.jsx';

const KIND_META = {
  heat:  { tone: 'border-heat-bright/30  bg-heat-bright/[0.04]  hover:border-heat-bright/50',  text: 'text-heat-bright',  ring: 'ring-heat'  },
  flood: { tone: 'border-flood-bright/30 bg-flood-bright/[0.04] hover:border-flood-bright/50', text: 'text-flood-bright', ring: 'ring-flood' },
  ndvi:  { tone: 'border-ndvi-bright/30  bg-ndvi-bright/[0.04]  hover:border-ndvi-bright/50',  text: 'text-ndvi-bright',  ring: 'ring-ndvi'  },
};

const ACTOR_META = {
  society:    { label: 'Society',    icon: 'handshake', cls: 'text-flood-bright bg-flood-bright/10' },
  government: { label: 'Government', icon: 'building',  cls: 'text-accent-400 bg-accent-500/10' },
  both:       { label: 'Joint',      icon: 'sparkles',  cls: 'text-success bg-success/10' },
};

const URGENCY_META = {
  immediate:  { label: 'Immediate',  dot: 'bg-danger' },
  short_term: { label: 'Short-term', dot: 'bg-warn' },
  long_term:  { label: 'Long-term',  dot: 'bg-ink-400' },
};

const COST_META = {
  low:    '₦',
  medium: '₦₦',
  high:   '₦₦₦',
};

export default function SolutionCard({ solution, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const k = KIND_META[solution.kind] || KIND_META.heat;
  const a = ACTOR_META[solution.actor] || ACTOR_META.both;
  const u = URGENCY_META[solution.urgency];
  const action = solution.action;
  const showDetails = !compact || expanded;

  return (
    <article className={`group rounded-3xl border ${k.tone} bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift`}>
      <div className={`h-1 w-14 rounded-full bg-gradient-to-r ${
        solution.kind === 'heat' ? 'from-heat-bright to-heat-mid' :
        solution.kind === 'flood' ? 'from-flood-bright to-flood-mid' :
        'from-ndvi-bright to-ndvi-mid'
      } mb-4`} />

      {/* Header: icon, title, actor pill */}
      <header className="flex items-start gap-3 mb-3">
        <div className={`shrink-0 w-10 h-10 rounded-2xl surface-raised grid place-items-center ${k.text}`}>
          <Icon name={kindIcon(solution.kind)} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-ink-50 leading-tight">{solution.title}</h4>
          <div className="flex items-center gap-2 mt-1.5 text-2xs">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${a.cls}`}>
              <Icon name={a.icon} size={11} />
              {a.label}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-400">
              <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
              {u.label}
            </span>
            <span className="text-ink-400 font-mono">{COST_META[solution.cost]}</span>
          </div>
        </div>
      </header>

      {/* Quantified target — the headline */}
      {action?.target && (
        <div className="rounded-2xl border border-accent-500/15 bg-accent-50/80 px-3.5 py-3 mb-3">
          <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wider text-accent-400 font-semibold mb-1.5">
            <Icon name="target" size={12} />
            Target
          </div>
          <div className="text-sm font-semibold text-ink-50 leading-snug">{action.target}</div>
          {action.deadline && (
            <div className="flex items-center gap-1.5 mt-2 text-2xs text-accent-300/90">
              <Icon name="calendar" size={12} />
              {action.deadline}
            </div>
          )}
        </div>
      )}

      {/* Detail rows */}
      {showDetails && action && (
        <div className="space-y-2 text-xs animate-fade-in">
          {action.locations && <DetailRow icon="pin" label="Where" value={action.locations} />}
          {action.cost_estimate && <DetailRow icon="cash" label="Cost" value={action.cost_estimate} />}
          {action.kpi && <DetailRow icon="pulse" label="Success" value={action.kpi} />}
        </div>
      )}

      {/* Description + meta */}
      {showDetails && (
        <>
          <p className="text-2xs text-ink-400 leading-relaxed mt-3">{solution.description}</p>
          {solution.who_pays && (
            <div className="text-2xs text-ink-500 mt-2">
              <span className="text-ink-400">Funding:</span> {solution.who_pays}
            </div>
          )}
          {solution.evidence && (
            <div className="text-2xs text-ink-500 italic mt-1">
              Evidence: {solution.evidence}
            </div>
          )}
        </>
      )}

      {/* Compact expand toggle */}
      {compact && (
        <button onClick={() => setExpanded(!expanded)}
          className="mt-2 text-2xs text-accent-600 hover:text-accent-500 flex items-center gap-1">
          {expanded ? 'Show less' : 'Show details'}
          <Icon name="chevron_right" size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      )}
    </article>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-bg-border/70 bg-bg/60 px-3 py-2">
      <div className="shrink-0 w-5 h-5 rounded-md bg-white grid place-items-center text-ink-400 mt-0.5 border border-bg-border">
        <Icon name={icon} size={11} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xs uppercase tracking-wider text-ink-500">{label}</div>
        <div className="text-ink-200 leading-snug">{value}</div>
      </div>
    </div>
  );
}
