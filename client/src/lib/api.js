const BASE = import.meta.env.VITE_API_BASE || '/api/v1';

async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),
  postReport: (payload) => request('/reports', { method: 'POST', body: payload }),
  recentReports: (limit = 20) => request(`/reports/recent?limit=${limit}`),
  heatmap: () => request('/heatmap'),
  floodRisk: () => request('/flood-risk'),
  ndvi: () => request('/ndvi'),
  leaderboard: () => request('/leaderboard'),
  plannerSummary: () => request('/planner/summary'),
  triggerAlertDemo: (lga) => request('/alerts/test', { method: 'POST', body: { lga } }),
  subscribe: (lga) => request('/alerts/subscribe', { method: 'POST', body: { lga } }),
  solutionsFor: (lga) => request(`/solutions/${encodeURIComponent(lga)}`),
  solutionsRollup: () => request('/solutions'),
};
