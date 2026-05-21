# UCIP — Urban Climate Intelligence Platform

**Team CoolCity · UNILAG National Design Competition 2026 · The 36°C Challenge**

Neighbourhood-level climate intelligence for Lagos. Crowdsourced citizen reports +
satellite + weather APIs → real-time heat maps, flood risk dashboards, green-space trackers.
Inclusion-first: works on smartphones (PWA) and feature phones (USSD).

## What's in the box

```
UCIP/
├── client/                  # React + Vite + Tailwind + Leaflet PWA
├── server/                  # Express API + scoring engine + cron + USSD handler
├── supabase/migrations/     # Production schema (PostgreSQL + PostGIS)
├── UCIP_PRD.docx            # Source PRD
├── package.json             # npm workspace root
└── .env.example
```

## Quick start (demo mode)

`DEMO_MODE=true` is the default — the server runs from an in-memory store seeded with
20 Lagos neighbourhoods + 10 sample reports. No Supabase, no Africa's Talking key, nothing
external required. Open-Meteo is keyless and called automatically on boot.

```bash
# from repo root
npm install
cp .env.example .env             # PowerShell: Copy-Item .env.example .env
npm run dev                      # client on :5173, api on :3001
```

Then open <http://localhost:5173>.

## Connecting the real backend

1. Run [supabase/migrations/001_init.sql](supabase/migrations/001_init.sql) in your Supabase project's SQL editor.
2. Set in `.env`:
   ```
   DEMO_MODE=false
   SUPABASE_URL=...
   SUPABASE_SERVICE_KEY=...
   AT_API_KEY=...          # Africa's Talking
   FIREBASE_SERVER_KEY=... # FCM (optional)
   ```
3. Restart `npm run dev`.

> Note: the Supabase write-path is stubbed in `server/src/store/index.js` for the sprint;
> migrating from in-memory → Supabase is a 1-day post-demo task. See [Post-Demo Roadmap](#post-demo-roadmap).

## API contract (`/api/v1`)

| Method | Path | What |
|---|---|---|
| GET  | `/health`              | Service ping + counters |
| POST | `/reports`             | Submit a citizen report (see PRD §4.1) |
| GET  | `/reports/recent?limit=20` | Latest reports |
| GET  | `/heatmap`             | `{ grid: [{lat,lng,heat_score,label}] }` |
| GET  | `/flood-risk`          | Same shape, `flood_risk_score` |
| GET  | `/ndvi`                | Same shape, `ndvi_health` (0–1) |
| GET  | `/leaderboard`         | NDVI leaderboard descending |
| GET  | `/planner/summary`     | LGAs + scores + auto-recommendations |
| GET  | `/geo/lga?lat&lng`     | Reverse-geocode to nearest LGA centroid |
| POST | `/alerts/subscribe`    | `{ lga, identifier }` |
| POST | `/alerts/test`         | `{ lga, kind }` — force-fires alert for demo |
| POST | `/ussd/callback`       | Africa's Talking USSD callback |

## Scoring (PRD §3.3)

Implemented in [server/src/services/scoring.js](server/src/services/scoring.js):

- **Heat** = 0.4·LST + 0.35·citizen + 0.25·weather (0–10)
- **Flood** = 0.3·rainfall + 0.25·hist-freq + 0.25·elevation + 0.2·citizen (0–10)
- **NDVI** = baseline minus a clearing-report penalty (0–1)

Citizen severity is time-decayed (half-life 2h) over the trailing 6h window so freshness
counts. All scores recompute on every report submission and every 5 min via cron.

## USSD demo

The endpoint speaks Africa's Talking's `CON ` / `END ` protocol. Drive it via curl:

```bash
# main menu
curl -X POST http://localhost:3001/api/v1/ussd/callback \
  -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text="

# pick option 1 (Report Heat) → severity 4 → use my area
curl -X POST http://localhost:3001/api/v1/ussd/callback \
  -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text=1*4*1"
```

For demo day: SSH into a terminal beside the laptop, paste the second curl, show the
`RPT-XXXX` ID, then watch the new dot appear on the live map.

## Demo day runbook (5 minutes — PRD §14)

1. **0:00–0:30** — Context. *"Lagos hit 36°C this Harmattan. Residents have zero neighbourhood-level data."*
2. **0:30–1:30** — Open `/report` on phone. GPS auto-detect → severity 4 → submit. Toast says *Report RPT-1011 live on map*.
3. **1:30–3:00** — Switch to `/map`. Toggle Heat → Flood → NDVI layer. Click a hot neighbourhood, point to the side panel.
4. **3:00–4:00** — On the open neighbourhood, hit *Trigger demo alert*. Console + Recent alerts list both show dispatch.
5. **4:00–4:30** — Switch to terminal. Run the USSD curl. Read the response aloud.
6. **4:30–5:00** — Switch to `/planner`. Export CSV. *"Same data your urban planners get."* Close.

Pre-demo checklist (do at 9am Wednesday):

- [ ] `npm run dev` clean boot, no warnings
- [ ] `/api/v1/health` returns `ok:true`
- [ ] All 20 neighbourhoods visible on the map
- [ ] Submit one fresh report and watch it appear
- [ ] Fire one test alert
- [ ] One USSD round-trip via curl

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Leaflet + Leaflet.heat, React Router |
| Backend  | Node 20, Express 4, Zod, node-cron |
| Database | Supabase (PostgreSQL + PostGIS) — in-memory fallback for demo |
| Weather  | Open-Meteo (keyless, current temp + 6h precip forecast) |
| USSD/SMS | Africa's Talking (sandbox) |
| Push     | Firebase Cloud Messaging (post-demo) |
| Satellite | Google Earth Engine — MODIS LST + Landsat NDVI (post-demo batch job) |

## Post-demo roadmap (PRD §15)

1. Wire Supabase writes (replace `store.addReport` to upsert into `reports`)
2. Earth Engine batch — daily MODIS LST + bi-weekly Landsat NDVI rasterisation
3. Real Firebase + Africa's Talking dispatch
4. Polygon-accurate reverse geocoding (`ST_Contains` instead of nearest centroid)
5. Expand to 35 states using LGA centroids from NBS open data

---

**End of README**  ·  Team CoolCity  ·  UCIP v1.0
