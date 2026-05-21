import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Report from './pages/Report.jsx';
import HeatMap from './pages/HeatMap.jsx';
import Planner from './pages/Planner.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Icon from './components/Icon.jsx';
import { api } from './lib/api.js';

const tabs = [
  { to: '/',        label: 'Overview',  icon: 'home' },
  { to: '/report',  label: 'Report',    icon: 'pin' },
  { to: '/map',     label: 'Map',       icon: 'map' },
  { to: '/planner', label: 'Planner',   icon: 'chart' },
];

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchHealth = () => api.health().then(setHealth).catch(() => setHealth({ ok: false }));
    fetchHealth();
    const t = setInterval(fetchHealth, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-bg">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.12),_transparent_62%)]" />
        <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-ndvi-mid/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-28 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />

        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-bg-border/80 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo />
              <div className="hidden sm:block">
                <div className="display text-lg leading-none tracking-tightest">UCIP</div>
                <div className="text-2xs text-ink-500 uppercase tracking-[0.18em] mt-0.5">Lagos Climate Intel</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-0.5 surface px-1 py-1 rounded-2xl bg-white/90 backdrop-blur">
              {tabs.map(t => (
                <NavLink key={t.to} to={t.to} end={t.to === '/'}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-accent-500 text-white shadow-[0_14px_24px_-16px_rgba(6,182,212,0.45)]'
                        : 'text-ink-200 hover:bg-bg-hover hover:text-ink-50'
                    }`
                  }>
                  <Icon name={t.icon} size={16} />
                  {t.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ServerStatus health={health} />
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-10">
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/report"  element={<Report />} />
            <Route path="/map"     element={<HeatMap />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="*"        element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur border-t border-bg-border grid grid-cols-4 shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.35)]">
          {tabs.map(t => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 text-2xs font-medium transition ${
                  isActive ? 'text-accent-600' : 'text-ink-500'
                }`
              }>
              <Icon name={t.icon} size={20} />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}

function Logo() {
  return (
    <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-500 via-accent-400 to-ndvi-mid grid place-items-center shadow-glow border border-white/70">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18l5-7 4 5 4-8 5 10" />
      </svg>
    </div>
  );
}

function ServerStatus({ health }) {
  const ok = health?.ok;
  return (
    <div className={`chip ${ok ? '' : 'border-danger/30 text-danger'}`}>
      <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${ok ? 'bg-success' : 'bg-danger'}`}>
        {ok && <span className="absolute inset-0 rounded-full bg-success animate-ping" />}
      </span>
      <span className="hidden sm:inline">{ok ? 'Live' : 'Offline'}</span>
      {ok && <span className="hidden md:inline text-ink-500">· {health?.reports ?? 0} reports</span>}
    </div>
  );
}
