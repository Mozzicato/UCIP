import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import Icon from '../components/Icon.jsx';

const TYPES = [
  { id: 'heat',     label: 'Heat',          icon: 'flame', tone: 'heat',  desc: 'Unusual warmth, heat island, dangerous exposure' },
  { id: 'flood',    label: 'Flood',         icon: 'drop',  tone: 'flood', desc: 'Standing or rising water, drainage failure' },
  { id: 'clearing', label: 'Tree clearing', icon: 'leaf',  tone: 'ndvi',  desc: 'Vegetation loss, illegal clearing spotted' },
];

const SEVERITY = [
  { value: 1, label: 'Mild',     desc: 'Barely noticeable' },
  { value: 2, label: 'Moderate', desc: 'Some discomfort' },
  { value: 3, label: 'Strong',   desc: 'Clearly affecting people' },
  { value: 4, label: 'Severe',   desc: 'Forcing changes in behaviour' },
  { value: 5, label: 'Extreme',  desc: 'Dangerous, emergency conditions' },
];

const TONE_CLS = {
  heat:  { ring: 'border-heat-bright/60 bg-heat-bright/10  text-heat-bright',  bar: 'bg-heat-bright' },
  flood: { ring: 'border-flood-bright/60 bg-flood-bright/10 text-flood-bright', bar: 'bg-flood-bright' },
  ndvi:  { ring: 'border-ndvi-bright/60 bg-ndvi-bright/10  text-ndvi-bright',  bar: 'bg-ndvi-bright' },
};

export default function Report() {
  const navigate = useNavigate();
  const toast = useToast();
  const [type, setType] = useState('heat');
  const [severity, setSeverity] = useState(3);
  const [coords, setCoords] = useState(null);
  const [lga, setLga] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [reverse, setReverse] = useState(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    detectLocation();
  }, []);

  function detectLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        fetch(`${import.meta.env.VITE_API_BASE || '/api/v1'}/geo/lga?lat=${c.lat}&lng=${c.lng}`)
          .then(r => r.json()).then(j => {
            if (j.lga) { setLga(j.lga); setReverse(j); }
          })
          .catch(() => {})
          .finally(() => setLocating(false));
      },
      () => {
        setCoords({ lat: 6.5244, lng: 3.3792 });
        setLga('Lagos Island');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function submit() {
    if (!coords) return toast('Need a GPS pin first', { tone: 'warn' });
    setSubmitting(true);
    try {
      const r = await api.postReport({
        report_type: type,
        severity,
        latitude: coords.lat,
        longitude: coords.lng,
        lga: lga || 'Unknown',
        notes,
        source: 'app',
      });
      toast(`Report ${r.id} now live on the map`, { tone: 'success', title: 'Submitted' });
      navigate('/map');
    } catch (e) {
      toast(e.message, { tone: 'error', title: 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  }

  const typeMeta = TYPES.find(t => t.id === type);
  const tone = TONE_CLS[typeMeta.tone];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-10 space-y-6">
      <header className="animate-fade-in">
        <div className="label-eyebrow text-accent-600">Citizen reporting</div>
        <h1 className="display text-4xl md:text-5xl mt-1">Report what you see</h1>
        <p className="text-ink-400 mt-2 text-sm max-w-2xl">
          Anonymous. Takes 30 seconds. Your report joins satellite + weather data for your neighbourhood.
        </p>
      </header>

      <section className="surface-raised bg-white/95 p-4 md:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
        <MiniStat label="Fast path" value="30s" note="from open to submit" />
        <MiniStat label="Works offline" value="USSD" note="feature phone support" />
        <MiniStat label="Live impact" value="Map" note="joins dashboard instantly" />
      </section>

      {/* Step 1: Type */}
      <Step n={1} title="What did you spot?" >
        <div className="grid grid-cols-3 gap-2.5">
          {TYPES.map(t => {
            const active = type === t.id;
            const tCls = TONE_CLS[t.tone];
            return (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`relative rounded-3xl p-4 text-left border transition-all shadow-sm ${
                  active ? tCls.ring : 'border-bg-border bg-white hover:bg-bg-hover'
                }`}>
                <Icon name={t.icon} size={26} className={active ? tCls.ring.split(' ')[2] : 'text-ink-400'} />
                <div className="font-semibold mt-2 text-sm">{t.label}</div>
                <div className="text-2xs text-ink-500 leading-snug mt-0.5">{t.desc}</div>
                {active && <div className="absolute top-2 right-2 text-success"><Icon name="sparkles" size={14} /></div>}
              </button>
            );
          })}
        </div>
      </Step>

      {/* Step 2: Severity */}
      <Step n={2} title="How severe is it?">
        <div className="flex items-end gap-1.5 mb-3">
          {SEVERITY.map((s, i) => {
            const active = severity >= s.value;
            return (
              <button key={s.value} onClick={() => setSeverity(s.value)}
                className={`flex-1 rounded-xl transition-all ${
                  active ? tone.bar : 'bg-bg-border hover:bg-bg-hover'
                }`}
                style={{ height: `${20 + i * 10}px` }} />
            );
          })}
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="display text-2xl">{SEVERITY[severity - 1].label}</div>
            <div className="text-2xs text-ink-500 mt-0.5">{SEVERITY[severity - 1].desc}</div>
          </div>
          <div className="font-mono text-ink-400 text-sm">{severity}/5</div>
        </div>
      </Step>

      {/* Step 3: Location */}
      <Step n={3} title="Where are you?">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm">
            {coords ? (
              <>
                <span className="live-dot" />
                <span className="text-success">GPS locked</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
                <span className="text-warn">{locating ? 'Locating…' : 'Awaiting GPS'}</span>
              </>
            )}
          </div>
          <button onClick={detectLocation} disabled={locating}
            className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1.5">
            <Icon name="refresh" size={12} />
            Re-detect
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <CoordBox label="Latitude"  value={coords?.lat?.toFixed(5) ?? '—'} />
          <CoordBox label="Longitude" value={coords?.lng?.toFixed(5) ?? '—'} />
        </div>

        <label className="label-eyebrow block mb-1.5">Neighbourhood / LGA</label>
        <input value={lga} onChange={e => setLga(e.target.value)} placeholder="e.g. Surulere" className="input" />
        {reverse?.nearest && (
          <div className="text-2xs text-ink-500 mt-1.5 flex items-center gap-1">
            <Icon name="target" size={11} /> Nearest centroid: {reverse.nearest} ({reverse.distance_km} km)
          </div>
        )}
      </Step>

      {/* Step 4: Notes */}
      <Step n={4} title="Anything else?" optional>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Optional: e.g. ‘Very hot near the market, traders moving stalls indoors’"
          className="input resize-none" />
      </Step>

      {/* Submit */}
      <div className="sticky bottom-20 md:bottom-4 pt-2">
        <button onClick={submit} disabled={submitting || !coords}
          className="btn-primary w-full text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? (
            <>
              <Icon name="refresh" size={16} className="animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Icon name="bolt" size={16} />
              Submit report
            </>
          )}
        </button>
        {!coords && <p className="text-2xs text-ink-500 text-center mt-2">Waiting for GPS lock to enable submit</p>}
      </div>
    </div>
  );
}

function Step({ n, title, optional, children }) {
  return (
    <section className="surface p-5 md:p-6 animate-slide-up bg-white/95">
      <header className="flex items-center gap-3 mb-4">
        <div className="w-7 h-7 rounded-lg bg-accent-500/15 text-accent-600 grid place-items-center text-sm font-semibold font-mono">{n}</div>
        <h2 className="font-semibold text-base">{title}</h2>
        {optional && <span className="chip text-ink-500">optional</span>}
      </header>
      {children}
    </section>
  );
}

function MiniStat({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-bg-border bg-bg/70 p-4">
      <div className="text-2xs uppercase tracking-[0.14em] text-ink-500 font-semibold">{label}</div>
      <div className="display text-2xl mt-2">{value}</div>
      <div className="text-2xs text-ink-500 mt-1">{note}</div>
    </div>
  );
}

function CoordBox({ label, value }) {
  return (
    <div className="surface-raised px-3 py-2.5">
      <div className="text-2xs uppercase tracking-wider text-ink-500">{label}</div>
      <div className="font-mono text-sm text-ink-50 mt-0.5">{value}</div>
    </div>
  );
}
