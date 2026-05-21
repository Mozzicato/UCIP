# 🌡️ UCIP — Urban Climate Intelligence Platform
### *Climate intelligence for every Lagos neighbourhood — from satellites to feature phones.*

**Team CoolCity &nbsp;|&nbsp; UNILAG National Design Competition 2026 &nbsp;|&nbsp; The 36°C Challenge &nbsp;|&nbsp; Sustainable Urban Design Track**

---

---

## SLIDE 1 — The Wake-Up Call

> **Lagos hit 36 °C this Harmattan.**
> Flooding wiped out Oshodi market — again.
> Mushin lost 30% of its tree cover in one dry season.

**And nobody saw it coming.**

Not the residents. Not the planners. Not the government.

Because we have **no neighbourhood-level climate data** — and even where the data exists, **no one is told what to do about it.**

---

---

## SLIDE 2 — The Problem

### 🚨 Lagos is flying blind — and acting blind

| Gap | Reality |
|---|---|
| Weather monitoring | NiMet gives **city-wide** averages — Lekki rain warnings reach Ikeja residents |
| Heat islands | Undetected at ward or neighbourhood scale |
| Flood risk | No early-warning below LGA level |
| Green-space loss | Tracked annually, never in real-time |
| Vulnerable populations | 40% of Lagosians use **feature phones** — no app, no data |
| **What to actually do** | Even when risk is known, **residents and planners have no playbook** |

> **Result:** 22 million people make daily decisions — where to work, where to sleep, which road to take — with zero local climate awareness.
> Planners allocate ₦ billions in intervention budgets with no data to prioritise — and **no costed menu of actions** tied to that data.

---

---

## SLIDE 3 — Our Solution

# 🗺️ UCIP
## Urban Climate Intelligence Platform

> **One platform. Three life-saving layers. One solutions engine. Every neighbourhood. Every phone.**

UCIP fuses **crowdsourced citizen reports** with **satellite-derived baselines** and **live weather APIs** to produce:

| Layer | What It Shows | Who It Helps |
|---|---|---|
| 🔴 **Heat Map** | Real-time heat-stress scores (0–10) per neighbourhood | Residents, health workers |
| 🌊 **Flood Risk** | 6-hour early-warning flood risk dashboards | Residents, emergency responders |
| 🌿 **Green Space Tracker** | NDVI vegetation health + deforestation alerts | Planners, community orgs |
| 🛠 **Solutions Engine** | **Costed, quantified actions** the community OR government can take *right now*, ranked by impact | Everyone |

**The difference: UCIP doesn't stop at *"your area is at 8/10 risk"*. It tells you *"here are 6 things you can do this week, and here's what each costs."***

**Inclusion-first by design:**
- 📱 Smartphone users → Progressive Web App
- 📟 Feature-phone users → **USSD** (`*384*UCIP#`) — no internet required

---

---

## SLIDE 4 — How It Works

```
CITIZEN REPORTS          SATELLITE BASELINES        LIVE WEATHER
  (App + USSD)           MODIS · Landsat            Open-Meteo API
       │                       │                        │
       └───────────────────────┼────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Scoring Engine    │
                    │ heat = 0.4·LST      │
                    │       + 0.35·citizen│
                    │       + 0.25·weather│
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┬──────────────┐
              ▼                ▼                ▼              ▼
         📍 Live Map     🔔 Alerts          📊 Planner     🛠 Solutions
         (Leaflet.js)  (Push + SMS)        Dashboard       (costed actions)
```

### The Loop — in 5 steps

1. **Report** — A resident taps a severity rating on the app (or dials USSD). GPS auto-tags their neighbourhood.
2. **Fuse** — Our scoring engine blends their report with satellite-derived land-surface baselines and a live weather forecast every **15 minutes**.
3. **Show** — The heat map, flood-risk layer, and NDVI layer update live on every user's screen.
4. **Alert** — When risk crosses a threshold, every subscribed resident in the affected LGA gets a **push notification or SMS** — no internet needed for SMS.
5. **🆕 Solve** — Every flagged area shows a **ranked list of concrete actions** — split between *what the community can do now* and *what government must do* — each with cost, deadline, location, and a measurable KPI.

---

---

## SLIDE 5 — Under the Hood

| Layer | Technology |
|---|---|
| Frontend | React 18 · Vite · Tailwind CSS · Leaflet.js · PWA |
| Backend | Node 20 · Express · Zod · node-cron |
| Database | Supabase · PostgreSQL · PostGIS (spatial queries) |
| Satellite | Google Earth Engine — MODIS LST + Landsat NDVI *(baseline today; live batch post-MVP)* |
| Weather | Open-Meteo (keyless, real-time + 6 h forecast) |
| USSD / SMS | Africa's Talking |
| Push | Firebase Cloud Messaging |

**Scoring is transparent and auditable:**

```
Heat Score  = 0.40 × satellite LST  +  0.35 × citizen severity  +  0.25 × weather temp
Flood Risk  = 0.30 × rainfall forecast  +  0.25 × historical freq  +  0.25 × elevation  +  0.20 × citizen
NDVI Health = baseline NDVI  −  clearing-report penalty   (0 → 1 scale)
```

Citizen reports are **time-decayed** (half-life 2 h) so fresh ground-truth always beats stale data — including a stale weather forecast.

---

---

## SLIDE 6 — The Solutions Engine *(the part nobody else builds)*

> *"Data without action is just a depressing dashboard."*

For every neighbourhood, UCIP runs a **rules-based prescription engine** over the current scores and returns a ranked, quantified action list — automatically split into what **residents/CDAs** can do and what **government** must do.

### Example output — Mushin, heat 8.2, NDVI 0.12

| 🏠 Society — *immediate* | 🏛 Government — *short-term* |
|---|---|
| **Cool-roof paint programme** — paint ~900 homes (~40k m² of zinc roof) over 6 months — ₦10.8M — KPI: indoor temp ↓ 3 °C in 70% of homes | **Street tree corridors** — plant 1,800 native trees along 14 km of streets over 24 months — ₦27M — KPI: 80% survival at 24 mo |
| **Community cooling hubs** — 4 hubs in mosques/schools open 11am–4pm on red-alert days — ₦1M setup — KPI: ≥200 visitors/hub/day | **Mandatory cool-roof building code** — SRI ≥ 78 on all new permits — KPI: 100% LASBCA compliance by yr 1 |
| **Drain clearance rota** — clear 6 km of secondary drains monthly via CDA — ₦200k/month — KPI: 90% free-flow after 20mm rain | **Trunk drainage dredge** — 4 km dredged before May rains — ₦72M — KPI: flood reports ↓50% YoY |

**Why this matters:**
- 🏛 A planner opens the dashboard, sees the ward, and gets a **ready-to-cost budget line item** — no consultant required.
- 🏠 A CDA chair opens the same page and sees **what their community can do this Saturday** — without waiting for government.
- 🌍 Solutions are **triggered by data**, not by hunches — if heat score < 5.5, cool-roof paint isn't recommended, so budget isn't wasted.

> **16 vetted solutions** seeded today, each with cost, evidence base, actor, urgency, and a quantification function that produces ward-specific targets.

---

---

## SLIDE 7 — What We're Building

> *Every signal below is wired into the codebase. The prototype runs the full loop end-to-end — we're now hardening, scaling, and partnering.*

| Signal | What we've built so far |
|---|---|
| 🔨 **Working prototype** | Full stack runs the loop: report → score → map → alert → solution |
| 🌤 **Live data ingestion** | Open-Meteo weather fused every 15 min across 20 seeded Lagos neighbourhoods |
| 📟 **Inclusive design** | USSD flow built and tested end-to-end on the Africa's Talking sandbox |
| 🗺 **Spatial foundation** | PostGIS schema with GIST-indexed geometry; neighbourhood polygons modelled for all 100 Lagos areas |
| 🛠 **Solutions engine** | 16 vetted, costed actions triggered by live scores — society + government tiers |
| 🇳🇬 **Scale-ready architecture** | Schema designed for 35 states; NBS LGA centroid data ready to ingest |

**Where we go next:** swapping satellite *baselines* for a live Google Earth Engine batch, wiring production SMS/push dispatch, and a first ward pilot with a Lagos CDA partner.

---

---

## SLIDE 8 — The Market

### Who needs this?

```
22 MILLION                           ₦ 500B+
Lagos residents —              Lagos State annual budget
zero local climate data        with no granular risk data
```

| Segment | Need | Our Offer |
|---|---|---|
| **Residents** | Know their local risk + what they can do about it | Free app + USSD + community solution list |
| **Urban planners** | Prioritise tree planting, drainage, cooling centres by data — with **costed action plans** | Planner dashboard + Solutions Engine + CSV export |
| **Health agencies** | Target heat-stress interventions at the most at-risk wards | Heat score API + cooling-hub prescriptions |
| **NGOs & CSOs** | Prove deforestation claims; mobilise volunteers on ranked, costed actions | Green-space tracker + adopt-a-tree integration |
| **Insurance & real estate** | Price flood risk at neighbourhood resolution | Risk score API (paid tier) |

### Scale path

> **Lagos MVP → 36 States → West Africa**
> The same stack, the same USSD protocol, and Nigeria's NBS open LGA data gets us to national coverage in one sprint. The solutions catalog grows per-region via partner NGOs (LASEPA, LASPARK, Red Cross).

---

---

## SLIDE 9 — Impact Vision

> **What does winning look like in 12 months?**

| Milestone | Target |
|---|---|
| Lagos rollout | 100 neighbourhoods · 50,000 registered citizens |
| Satellite integration | Daily MODIS LST + bi-weekly Landsat NDVI batch jobs live |
| Government partnership | Lagos State Ministry of the Environment using planner dashboard + Solutions Engine to draft annual climate budget line items |
| Solutions enacted | ≥3 society-tier actions completed per pilot ward (e.g. drain clearance, cooling hubs, adopt-a-tree) |
| National expansion | Abuja, Kano, Port Harcourt — same infrastructure, new polygons |
| Feature-phone reach | 500,000 USSD sessions/month for users with no data plan |

> *"UCIP — climate intelligence for everyone."*
> *Not everyone with a smartphone. **Everyone.***

---

---

## SLIDE 10 — What We're Asking For

### From the judges, today:

> ✅ **Your score** — so we can keep building.
> ✅ **Your network** — Lagos State government, NGO partners, GIS data custodians.
> ✅ **Your sponsorship** — a 6-month pilot in one Lagos ward needs ~₦8M (USSD aggregator fees, CDA partnerships, field validation, Earth Engine compute).
> ✅ **Your feedback** — what's the one thing that would make a planner trust this data enough to cut a budget line from it?

---

---

## SLIDE 11 — Thank You

# 🌡️ UCIP
### *Climate intelligence for every Lagos neighbourhood.*

> **Lagos has 22 million people.**
> **One platform that sees them — and tells them what to do.**

**Team CoolCity &nbsp;·&nbsp; UNILAG National Design Competition 2026**
