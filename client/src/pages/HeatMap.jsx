import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import Icon, { kindIcon } from '../components/Icon.jsx';
import SolutionCard from '../components/SolutionCard.jsx';

const LAGOS_CENTER = [6.55, 3.35];

const LAYERS = [
  { id: 'heat',  label: 'Heat',  icon: 'flame', color: 'text-heat-bright',  active: 'border-heat-bright/50 bg-heat-bright/10  text-heat-bright' },
  { id: 'flood', label: 'Flood', icon: 'drop',  color: 'text-flood-bright', active: 'border-flood-bright/50 bg-flood-bright/10 text-flood-bright' },
  { id: 'ndvi',  label: 'Green', icon: 'leaf',  color: 'text-ndvi-bright',  active: 'border-ndvi-bright/50 bg-ndvi-bright/10  text-ndvi-bright' },
];

export default function HeatMap() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  const pingsRef = useRef(null);

  const [active, setActive] = useState('heat');
  const [data, setData] = useState({ heat: null, flood: null, ndvi: null });
  const [selected, setSelected] = useState(null);
  const [solutions, setSolutions] = useState(null);
  const [drawerTab, setDrawerTab] = useState('summary'); // summary | solutions
  const [query, setQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  // Briefly flash a "syncing" indicator on every layer toggle to sell the live-data story.
  useEffect(() => {
    setSyncing(true);
    const t = setTimeout(() => setSyncing(false), 900);
    return () => clearTimeout(t);
  }, [active]);

  // map init
  useEffect(() => {
    if (mapRef.current) return;
    const m = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView(LAGOS_CENTER, 11);
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OSM © Carto',
      maxZoom: 19,
    }).addTo(m);
    mapRef.current = m;
    return () => { m.remove(); mapRef.current = null; };
  }, []);

  // load datasets
  useEffect(() => {
    Promise.all([api.heatmap(), api.floodRisk(), api.ndvi()])
      .then(([h, f, n]) => setData({ heat: h, flood: f, ndvi: n }))
      .catch(e => toast(e.message, { tone: 'error', title: 'Failed to load layers' }));
  }, []);

  // solutions for selected
  useEffect(() => {
    if (!selected?.label) { setSolutions(null); return; }
    setSolutions({ loading: true });
    setDrawerTab('summary');
    api.solutionsFor(selected.label)
      .then(s => setSolutions(s))
      .catch(() => setSolutions({ error: true }));
  }, [selected?.label]);

  // render active layer
  useEffect(() => {
    if (!mapRef.current) return;
    if (layerRef.current) { layerRef.current.remove(); layerRef.current = null; }
    if (pingsRef.current) { pingsRef.current.remove(); pingsRef.current = null; }

    const ds = data[active];
    if (!ds) return;

    if (active === 'heat') {
      const points = ds.grid.map(g => [g.lat, g.lng, Math.min(1, g.heat_score / 10)]);
      layerRef.current = L.heatLayer(points, {
        radius: 42, blur: 32, maxZoom: 14, minOpacity: 0.4,
        gradient: { 0.2: '#16a34a', 0.4: '#eab308', 0.7: '#f97316', 1.0: '#ef4444' },
      }).addTo(mapRef.current);
    }

    if (active === 'flood') {
      layerRef.current = L.layerGroup(
        ds.grid.map(g => L.circleMarker([g.lat, g.lng], {
          radius: 8 + g.flood_risk_score * 1.6,
          color: '#38bdf8', weight: 1.5,
          fillColor: g.flood_risk_score >= 7 ? '#0284c7' : g.flood_risk_score >= 4 ? '#38bdf8' : '#7dd3fc',
          fillOpacity: 0.5,
        }).bindTooltip(`${g.label} · Flood ${g.flood_risk_score.toFixed(1)}`))
      ).addTo(mapRef.current);
    }

    if (active === 'ndvi') {
      layerRef.current = L.layerGroup(
        ds.grid.map(g => L.circleMarker([g.lat, g.lng], {
          radius: 12,
          color: g.ndvi_health >= 0.5 ? '#4ade80' : g.ndvi_health >= 0.3 ? '#fbbf24' : '#ef4444',
          weight: 2,
          fillColor: g.ndvi_health >= 0.5 ? '#16a34a' : g.ndvi_health >= 0.3 ? '#d97706' : '#dc2626',
          fillOpacity: 0.55,
        }).bindTooltip(`${g.label} · NDVI ${g.ndvi_health.toFixed(2)}`))
      ).addTo(mapRef.current);
    }

    // Invisible click targets for every neighbourhood
    pingsRef.current = L.layerGroup(
      ds.grid.map(g => {
        const m = L.circleMarker([g.lat, g.lng], { radius: 18, color: 'transparent', fillOpacity: 0 });
        m.on('click', () => {
          setSelected(g);
          mapRef.current.flyTo([g.lat, g.lng], 13, { duration: 0.6 });
        });
        return m;
      })
    ).addTo(mapRef.current);
  }, [active, data]);

  async function triggerAlertDemo() {
    if (!selected) return toast('Pick a neighbourhood on the map first', { tone: 'warn' });
    try {
      const r = await api.triggerAlertDemo(selected.label);
      toast(`Alert dispatched to ${r.recipients} subscriber(s) in ${selected.label}`, { tone: 'success', title: 'Alert fired' });
    } catch (e) { toast(e.message, { tone: 'error' }); }
  }

  // search match
  const searchMatches = useMemo(() => {
    if (!query.trim() || !data[active]?.grid) return [];
    const q = query.toLowerCase();
    return data[active].grid.filter(g => g.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query, data, active]);

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-bg">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top-left controls: layer switcher + search */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 max-w-sm">
        {/* Layer switcher + live indicator */}
        <div className="flex items-center gap-2">
          <div className="surface-raised p-1.5 flex gap-1.5 animate-slide-up bg-white/92 backdrop-blur-xl">
            {LAYERS.map(l => (
              <button key={l.id} onClick={() => setActive(l.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border ${
                  active === l.id ? l.active : 'border-transparent text-ink-200 hover:bg-bg-hover'
                }`}>
                <Icon name={l.icon} size={16} />
                {l.label}
              </button>
            ))}
          </div>
          <SyncChip syncing={syncing} />
        </div>

        {/* Search */}
        <div className="relative animate-slide-up">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none">
            <Icon name="search" size={16} />
          </div>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search neighbourhood…"
            className="input pl-9 surface-raised border-bg-border"
          />
          {searchMatches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 surface-raised overflow-hidden animate-fade-in bg-white/95 backdrop-blur-xl">
              {searchMatches.map(g => (
                <button key={g.label} onClick={() => {
                  setSelected(g); setQuery('');
                  mapRef.current.flyTo([g.lat, g.lng], 13, { duration: 0.6 });
                }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-bg-hover flex items-center justify-between">
                  <span>{g.label}</span>
                  <span className="text-2xs text-ink-500 font-mono">
                    H {g.heat_score?.toFixed(1)} · F {g.flood_risk_score?.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[400] surface-raised p-3.5 text-xs animate-fade-in max-w-xs bg-white/92 backdrop-blur-xl">
        <div className="label-eyebrow mb-2">
          {active === 'heat' && 'Composite heat score'}
          {active === 'flood' && 'Flood risk'}
          {active === 'ndvi' && 'NDVI · vegetation health'}
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full" style={{ background: active === 'ndvi'
            ? 'linear-gradient(90deg,#ef4444,#fbbf24,#4ade80)'
            : 'linear-gradient(90deg,#16a34a,#fbbf24,#f97316,#ef4444)' }} />
          <span className="text-ink-500 text-2xs whitespace-nowrap">
            {active === 'ndvi' ? '0 → 1' : '0 → 10'}
          </span>
        </div>
      </div>

      {/* Empty-state hint when nothing selected */}
      {!selected && (
        <div className="absolute right-4 top-4 z-[400] surface-raised px-4 py-3 animate-fade-in max-w-xs bg-white/92 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-ink-200">
            <Icon name="target" size={16} className="text-accent-400" />
            <span>Click any neighbourhood to see solutions</span>
          </div>
        </div>
      )}

      {/* Right drawer */}
      {selected && <Drawer
        selected={selected} solutions={solutions}
        tab={drawerTab} setTab={setDrawerTab}
        onClose={() => setSelected(null)}
        onAlert={triggerAlertDemo} />}
    </div>
  );
}

function Drawer({ selected, solutions, tab, setTab, onClose, onAlert }) {
  const tone =
    selected.heat_score >= 7 ? 'heat' :
    selected.flood_risk_score >= 6 ? 'flood' :
    'ndvi';
  const headerTone = {
    heat:  'from-white via-heat-soft/70 to-white',
    flood: 'from-white via-flood-soft/70 to-white',
    ndvi:  'from-white via-ndvi-soft/70 to-white',
  }[tone];
  const issueCount = solutions?.diagnosis?.length || 0;
  const solCount = solutions?.solutions?.length || 0;

  return (
    <aside className="absolute right-0 top-0 bottom-0 z-[450] w-full sm:w-[440px] surface-raised rounded-none sm:rounded-l-3xl border-l border-bg-border flex flex-col animate-slide-in-r bg-white/96 backdrop-blur-xl">
      {/* Header */}
      <div className={`relative px-5 pt-5 pb-4 bg-gradient-to-br ${headerTone} border-b border-bg-border`}>
        <button onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg grid place-items-center text-ink-200 hover:bg-bg-hover hover:text-ink-50 transition">
          <Icon name="close" size={18} />
        </button>
        <div className="label-eyebrow">Neighbourhood</div>
        <h2 className="display text-3xl mt-1">{selected.label}</h2>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {issueCount > 0 ? (
            <span className="chip border-danger/30 text-danger">
              <Icon name="alert" size={12} /> {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            </span>
          ) : (
            <span className="chip border-success/30 text-success">
              <Icon name="sparkles" size={12} /> within tolerance
            </span>
          )}
          <span className="chip">
            <Icon name="target" size={12} className="text-accent-400" /> {solCount} solutions
          </span>
        </div>
      </div>

      {/* Tab strip */}
      <div className="px-2 pt-2 flex gap-1 border-b border-bg-border bg-white/80 backdrop-blur-sm">
        <TabButton active={tab === 'summary'}   onClick={() => setTab('summary')}   icon="pulse"  label="Summary" />
        <TabButton active={tab === 'solutions'} onClick={() => setTab('solutions')} icon="target" label="Solutions" badge={solCount} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'summary' ? (
          <SummaryTab selected={selected} solutions={solutions} />
        ) : (
          <SolutionsTab solutions={solutions} />
        )}
      </div>

      {/* Sticky footer action */}
      <div className="p-4 border-t border-bg-border bg-white/90 backdrop-blur">
        <button onClick={onAlert} className="btn-primary w-full">
          <Icon name="bell" size={16} /> Trigger demo alert
        </button>
        <p className="text-2xs text-ink-500 text-center mt-2">
          Push + SMS to subscribers in this LGA
        </p>
      </div>
    </aside>
  );
}

function TabButton({ active, onClick, icon, label, badge }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-t-lg transition relative ${
        active ? 'text-ink-50' : 'text-ink-500 hover:text-ink-200'
      }`}>
      <Icon name={icon} size={14} />
      {label}
      {badge !== undefined && (
        <span className={`text-2xs px-1.5 rounded-full ${active ? 'bg-accent-500/15 text-accent-600' : 'bg-bg-higher text-ink-400'}`}>
          {badge}
        </span>
      )}
      {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent-500 rounded-full" />}
    </button>
  );
}

function SummaryTab({ selected, solutions }) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Big metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MetricBlock kind="heat"  label="Heat"  value={selected.heat_score?.toFixed(1)}  max="10" />
        <MetricBlock kind="flood" label="Flood" value={selected.flood_risk_score?.toFixed(1)} max="10" />
        <MetricBlock kind="ndvi"  label="NDVI"  value={selected.ndvi_health?.toFixed(2)}   max="1" inverse />
      </div>

      {/* Diagnosis */}
      {solutions?.diagnosis?.length > 0 && (
        <div>
          <h3 className="label-eyebrow mb-2.5">Diagnosis</h3>
          <div className="space-y-1.5">
            {solutions.diagnosis.map((d, i) => (
              <div key={i} className={`rounded-xl px-3.5 py-2.5 border text-sm ${
                d.severity === 'critical' ? 'bg-danger/10  border-danger/40  text-danger'  :
                d.severity === 'high'     ? 'bg-warn/10    border-warn/40    text-warn'    :
                                            'bg-bg-higher  border-bg-border  text-ink-200'
              }`}>
                <div className="font-semibold capitalize text-xs mb-0.5">{d.severity} · {d.kind}</div>
                <div className="text-2xs leading-relaxed text-ink-200">{d.msg}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 2 solution previews */}
      {solutions?.solutions?.length > 0 && (
        <div>
          <h3 className="label-eyebrow mb-2.5 flex items-center justify-between">
            <span>Top recommended actions</span>
            <span className="text-2xs text-ink-500 normal-case">click "Solutions" tab for all</span>
          </h3>
          <div className="space-y-2">
            {solutions.solutions.slice(0, 2).map(s => <SolutionCard key={s.id} solution={s} compact />)}
          </div>
        </div>
      )}

      {solutions?.diagnosis?.length === 0 && (
        <div className="text-center py-8">
          <div className="w-14 h-14 mx-auto rounded-full bg-success/15 grid place-items-center text-success mb-3">
            <Icon name="sparkles" size={26} />
          </div>
          <div className="text-sm text-ink-200">All metrics within tolerance.</div>
          <div className="text-2xs text-ink-500 mt-1">Continue monitoring.</div>
        </div>
      )}
    </div>
  );
}

function SolutionsTab({ solutions }) {
  if (solutions?.loading) return <div className="space-y-2"><div className="skeleton h-28" /><div className="skeleton h-28" /></div>;
  if (!solutions?.solutions?.length) {
    return <div className="text-sm text-ink-500 italic text-center py-8">No issues triggered — no actions needed.</div>;
  }
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="text-2xs text-ink-500">{solutions.solutions.length} solutions, ranked by relevance</div>
      {solutions.solutions.map(s => <SolutionCard key={s.id} solution={s} />)}
    </div>
  );
}

function SyncChip({ syncing }) {
  return (
    <div className={`chip surface-raised bg-white/92 backdrop-blur-xl whitespace-nowrap transition-all duration-300 ${
      syncing ? 'border-accent-500/40 text-accent-600' : 'text-ink-500'
    }`}>
      <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${syncing ? 'bg-accent-500' : 'bg-success'}`}>
        {syncing && <span className="absolute inset-0 rounded-full bg-accent-500 animate-ping" />}
      </span>
      <span className="text-2xs font-medium">
        {syncing ? 'Syncing layer…' : 'Live · 15-min refresh'}
      </span>
    </div>
  );
}

function MetricBlock({ kind, label, value, max, inverse }) {
  const v = parseFloat(value);
  const m = parseFloat(max);
  const pct = inverse ? (1 - v / m) * 100 : (v / m) * 100;
  const tones = {
    heat:  { text: 'text-heat-bright',  bar: 'bg-heat-bright',  ring: 'border-heat-bright/30' },
    flood: { text: 'text-flood-bright', bar: 'bg-flood-bright', ring: 'border-flood-bright/30' },
    ndvi:  { text: 'text-ndvi-bright',  bar: 'bg-ndvi-bright',  ring: 'border-ndvi-bright/30' },
  }[kind];
  return (
    <div className={`surface border ${tones.ring} p-3`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-2xs uppercase tracking-wider text-ink-400">{label}</span>
        <Icon name={kindIcon(kind)} size={12} className={tones.text} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono font-bold text-xl ${tones.text}`}>{value}</span>
        <span className="text-2xs text-ink-500">/{max}</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-bg-border overflow-hidden">
        <div className={`h-full ${tones.bar} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
