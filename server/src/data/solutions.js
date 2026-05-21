// UCIP Solutions Catalog
//
// Each solution is a concrete, costed action with:
//   actor:    'society' | 'government' | 'both'
//   urgency:  'immediate' (today–this week) | 'short_term' (1–6 months) | 'long_term' (6mo+)
//   cost:     'low' (<₦5M), 'medium' (₦5–50M), 'high' (>₦50M)
//   impact:   { heat?: -0..2, flood?: -0..2, ndvi?: +0..0.2 } — point changes on 0–10 / 0–1
//   triggers: { heat_min?, flood_min?, ndvi_max?, clearing_reports_min? }
//   quantify(ctx) -> { target, deadline, locations, cost_estimate, kpi }
//     Produces specific, quantified targets for a given LGA context. Lagos ward
//     proxy: ~30k residents, ~6k households, ~12 km² built-up area per neighbourhood.
//
// The quantify function is the difference between "plant trees" and
// "plant 412 trees along Mushin's market arcades by Dec 2026 — cost ₦4.1M".

const WARD_POP = 30_000;        // avg Lagos neighbourhood (ward proxy) population
const WARD_HOUSEHOLDS = 6_000;
const WARD_BUILT_KM2 = 12;      // built-up area
const WARD_DRAIN_KM = 8;        // typical drain network length per ward

// short helper: this-year and N-months-out deadlines
function inMonths(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
}
function thisRainySeason() {
  const now = new Date();
  const yr = now.getMonth() >= 4 ? now.getFullYear() + 1 : now.getFullYear();
  return `before May ${yr} rains`;
}

function fmtN(n) { return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`; }
function fmtNaira(n) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000)         return `₦${Math.round(n / 1000)}k`;
  return `₦${n}`;
}

export const SOLUTIONS = [
  // ───────────────────────────────── HEAT ─────────────────────────────────
  {
    id: 'cool-roof-paint',
    kind: 'heat',
    title: 'Cool-roof reflective paint programme',
    description:
      'White or light-coloured reflective paint on zinc and concrete roofs drops indoor temperature by 3–7°C ' +
      'and surface temperature by up to 15°C. Highest yield in dense informal settlements where most homes have dark zinc roofs.',
    actor: 'both',
    urgency: 'immediate',
    cost: 'low',
    impact: { heat: -1.2 },
    who_pays: 'Lagos State subsidy + LGA matching grants; residents apply via ward office.',
    evidence: 'Million Cool Roofs Initiative (Niamey, Dakar pilots).',
    triggers: { heat_min: 5.5 },
    quantify: (ctx) => {
      const intensity = Math.max(0.1, (ctx.heat_score - 5.5) / 4.5);
      const homes = Math.round(WARD_HOUSEHOLDS * 0.15 * intensity);
      const area_m2 = homes * 45;
      const cost = homes * 12_000; // ₦12k paint+labour per home
      return {
        target: `Paint ${fmtN(homes)} homes (~${fmtN(area_m2)} m² of roof) with reflective paint in ${ctx.lga}`,
        deadline: inMonths(6),
        locations: 'Priority: dense zinc-roof clusters in informal settlements; surveyed via aerial imagery.',
        cost_estimate: `${fmtNaira(cost)} (≈₦12k/home incl. paint + labour)`,
        kpi: `Indoor temp drop ≥3°C in 70% of treated homes; verify with cheap loggers in 50-home audit sample.`,
      };
    },
  },
  {
    id: 'street-tree-corridors',
    kind: 'heat',
    title: 'Street tree corridors (native species)',
    description:
      'Plant heat-tolerant, deep-rooted natives — Neem (Azadirachta indica), African Almond (Terminalia catappa), ' +
      'Mango (Mangifera indica) — every 8m along major roads and market arcades. Target 30% canopy by 2030.',
    actor: 'government',
    urgency: 'short_term',
    cost: 'medium',
    impact: { heat: -1.5, ndvi: 0.08 },
    who_pays: 'LASPARK + LGA annual budget line; Federal Ecological Fund top-up.',
    evidence: 'Surface temp drops 2–4°C under mature canopy (LASUSTECH 2023 study).',
    triggers: { heat_min: 6.0, ndvi_max: 0.4 },
    quantify: (ctx) => {
      const gap = Math.max(0.05, 0.5 - ctx.ndvi_health);
      const trees = Math.round(800 + gap * 4000);            // 800–2800 trees per ward
      const km   = Math.round(trees * 0.008 * 10) / 10;      // 1 tree / 8m
      const cost = trees * 15_000;                            // ₦15k per tree incl. 2-yr maintenance
      return {
        target: `Plant ${fmtN(trees)} native trees along ~${km} km of streets in ${ctx.lga} over 24 months`,
        deadline: `Phase 1 (40%) by ${inMonths(12)}; full programme by ${inMonths(24)}`,
        locations: 'Major roads, market arcades, school perimeters, BRT corridors. Skip flood-prone alignments.',
        cost_estimate: `${fmtNaira(cost)} (₦15k/tree, includes 2-year maintenance contract)`,
        kpi: `Survival rate ≥80% at 24 months; canopy cover audited by drone biannually.`,
      };
    },
  },
  {
    id: 'community-cooling-hubs',
    kind: 'heat',
    title: 'Community cooling hubs',
    description:
      'Designate mosques, churches, markets, and primary schools as daytime cooling shelters with fans, ' +
      'free water, ORS sachets. Open 11am–4pm during heat advisories.',
    actor: 'society',
    urgency: 'immediate',
    cost: 'low',
    impact: { heat: -0.5 },
    who_pays: 'CDA + religious institutions; Red Cross supplies kits.',
    evidence: 'Reduced heat-related ER visits by ~25% in Ahmedabad heat action plan.',
    triggers: { heat_min: 7.5 },
    quantify: (ctx) => {
      const hubs = Math.max(3, Math.round((ctx.heat_score - 6) * 1.5));
      return {
        target: `Open ${hubs} cooling hubs across ${ctx.lga} (1 per ~${Math.round(WARD_POP / hubs / 1000)}k residents)`,
        deadline: `Operational by ${inMonths(1)} — before next heat advisory`,
        locations: 'Existing CDA halls, mosques, churches, primary schools. Map to be co-designed with CDA chair.',
        cost_estimate: `${fmtNaira(hubs * 250_000)} setup (fans, water tanks, ORS), ₦80k/hub/month operating`,
        kpi: `≥200 unique daily visitors per hub during red-alert days; track via tally sheets.`,
      };
    },
  },
  {
    id: 'public-shade-structures',
    kind: 'heat',
    title: 'Install permanent shade structures',
    description:
      'Erect light-frame canopies, tensile shades, and bus-stop awnings at high-exposure points: market stalls, ' +
      'BRT stops, schoolyards, motor parks. Combine with cool-roof paint on the canopy for compounded effect.',
    actor: 'government',
    urgency: 'short_term',
    cost: 'medium',
    impact: { heat: -0.9 },
    who_pays: 'LGA capital budget + market-association levies + outdoor-advertising revenue.',
    evidence: 'Riyadh "Saudi Green" shade canopies dropped pedestrian-level air temp by 5–8°C.',
    triggers: { heat_min: 6.5 },
    quantify: (ctx) => {
      const sites = Math.max(4, Math.round((ctx.heat_score - 5) * 2));
      const m2    = sites * 60;
      const cost  = m2 * 18_000;
      return {
        target: `Install shade structures at ${sites} sites in ${ctx.lga} totalling ~${fmtN(m2)} m²`,
        deadline: `Phase 1 (3 highest-priority sites) by ${inMonths(3)}; full set by ${inMonths(9)}`,
        locations:
          'Top-3 from each: market stalls (e.g. Mushin market), BRT/danfo stops, ' +
          'primary-school yards, motor parks, queueing zones at banks/hospitals.',
        cost_estimate: `${fmtNaira(cost)} (≈₦18k/m² for tensile canopy + cool-paint coating)`,
        kpi: `Surface temp under shade ≥8°C cooler than adjacent exposed surface at 1pm; verified by IR thermometer audit.`,
      };
    },
  },
  {
    id: 'cool-roof-buildingcode',
    kind: 'heat',
    title: 'Update building code: mandatory cool roofs',
    description:
      'Amend Lagos State Physical Planning Permit Regulations to require Solar Reflectance Index (SRI) ≥ 78 on all ' +
      'new buildings and major renovations.',
    actor: 'government',
    urgency: 'long_term',
    cost: 'low',
    impact: { heat: -0.8 },
    who_pays: 'Regulatory — no direct cost; enforced via LASBCA permit fees.',
    evidence: 'India ECBC 2017, California Title 24.',
    triggers: { heat_min: 6.5 },
    quantify: (ctx) => ({
      target: `Draft + pass cool-roof amendment to Lagos building permit regulations (apply state-wide; ${ctx.lga} pilot ward)`,
      deadline: `Bill drafted by ${inMonths(6)}; LASBCA enforcement from ${inMonths(12)}`,
      locations: 'State-wide policy; permit applications screened at LASBCA Alausa intake.',
      cost_estimate: '<₦5M legal drafting + stakeholder consultations. Revenue-positive via permit-fee compliance.',
      kpi: `100% of new permits issued in ${ctx.lga} from year-1 carry SRI-compliance certificate.`,
    }),
  },
  {
    id: 'shift-work-hours',
    kind: 'heat',
    title: 'Adjusted outdoor work + market hours advisory',
    description:
      'Push SMS advisory to traders, okada riders, construction workers to avoid 12pm–4pm exposure. Schools to release before 1pm on red-alert days.',
    actor: 'both',
    urgency: 'immediate',
    cost: 'low',
    impact: { heat: -0.3 },
    who_pays: 'LASEMA SMS broadcast; market associations.',
    evidence: 'Standard practice in Phoenix and Karachi heat action plans.',
    triggers: { heat_min: 8.0 },
    quantify: (ctx) => ({
      target: `Issue red-alert advisory to ${fmtN(WARD_POP)} residents of ${ctx.lga} on every heat-score ≥ 8 day`,
      deadline: 'SOP signed off this week; first dispatch on the next red-alert day',
      locations: 'SMS via Africa\'s Talking; megaphone announcements at major markets; school WhatsApp groups.',
      cost_estimate: `<₦500k/month SMS costs at ₦4/SMS, ~30k recipients × 4 advisories`,
      kpi: `Heat-related clinic visits ↓ ≥20% on advisory days vs. control days.`,
    }),
  },

  // ───────────────────────────────── FLOOD ────────────────────────────────
  {
    id: 'drain-clearance-rota',
    kind: 'flood',
    title: 'Monthly community drain-clearance rota',
    description:
      'CDAs organise monthly Saturday clean-ups of secondary drains; LGA provides shovels, gloves, waste collection. ' +
      'Block reported within 24h → fine.',
    actor: 'both',
    urgency: 'immediate',
    cost: 'low',
    impact: { flood: -1.0 },
    who_pays: 'CDA labour + LGA logistics (≈₦200k/ward/month).',
    evidence: 'Lagos State Environmental Protection Agency monthly sanitation.',
    triggers: { flood_min: 5.0 },
    quantify: (ctx) => {
      const km = Math.round(WARD_DRAIN_KM * Math.min(1, ctx.flood_risk_score / 8));
      return {
        target: `Clear ${km} km of secondary drains in ${ctx.lga} every month (rotating 12 sub-segments)`,
        deadline: `First cleanup Saturday of next month; sustained programme through ${inMonths(12)}`,
        locations: 'Mapped per ward via UCIP citizen reports; CDA captains assigned per 0.6 km segment.',
        cost_estimate: `${fmtNaira(200_000 * 12)} / year per LGA (logistics + waste haulage)`,
        kpi: `≤10% of monitored drain segments fail the "free-flow" test 48h after a 20mm rainfall event.`,
      };
    },
  },
  {
    id: 'drainage-audit-dredge',
    kind: 'flood',
    title: 'Trunk drainage audit + dredging programme',
    description:
      'Engineering survey of primary and secondary drains; mechanical dredging of choked sections before May rains. ' +
      'Publish progress dashboard publicly.',
    actor: 'government',
    urgency: 'short_term',
    cost: 'high',
    impact: { flood: -2.0 },
    who_pays: 'Lagos State Ministry of the Environment capital budget.',
    evidence: 'Apapa, Lekki choke-point clearance dropped flood frequency 40% in 2022.',
    triggers: { flood_min: 6.0 },
    quantify: (ctx) => {
      const km = Math.round((WARD_DRAIN_KM * 0.4) * Math.min(1.2, ctx.flood_risk_score / 7));
      const cost = km * 18_000_000; // ₦18M/km dredge + minor reconstruction
      return {
        target: `Dredge + rehabilitate ~${km} km of trunk drainage in ${ctx.lga}`,
        deadline: thisRainySeason(),
        locations: 'Engineering survey identifies priority segments; UCIP flood-report hotspots cross-referenced.',
        cost_estimate: `${fmtNaira(cost)} (≈₦18M/km incl. mechanical dredging, silt haulage, minor reconstruction)`,
        kpi: `Hydraulic capacity restored to design spec ≥85% on audited segments; flood reports ↓50% YoY.`,
      };
    },
  },
  {
    id: 'setback-enforcement',
    kind: 'flood',
    title: 'Enforce 30m floodplain setback rules',
    description:
      'No new construction within 30m of canals, lagoon edge, or designated floodplains. Demolish illegal blockages on drains; survey via satellite + citizen reports.',
    actor: 'government',
    urgency: 'short_term',
    cost: 'medium',
    impact: { flood: -1.2 },
    who_pays: 'LASBCA enforcement budget; demolition cost recovered via fines.',
    evidence: 'Lagos State Building Control Law 2010 §32.',
    triggers: { flood_min: 6.5 },
    quantify: (ctx) => {
      const structures = Math.max(8, Math.round((ctx.flood_risk_score - 5) * 6));
      return {
        target: `Audit and resolve ${structures} suspected setback violations in ${ctx.lga}`,
        deadline: `Survey complete by ${inMonths(2)}; enforcement actions by ${inMonths(6)}`,
        locations: 'Canal banks, lagoon edges, designated floodplains. Cross-ref UCIP flood hotspots + satellite imagery.',
        cost_estimate: `${fmtNaira(structures * 600_000)} enforcement; recovered via ₦1.5M/structure fines.`,
        kpi: `100% of audited cases resolved (demolish, retrofit, or formal exemption) within 12 months.`,
      };
    },
  },
  {
    id: 'sandbag-prepositioning',
    kind: 'flood',
    title: 'Pre-position sandbag caches at ward level',
    description:
      'Stage 200–500 sandbags + tarpaulin per ward at LGA office or police post before each rainy season. Residents collect on red-alert.',
    actor: 'government',
    urgency: 'immediate',
    cost: 'low',
    impact: { flood: -0.6 },
    who_pays: 'LASEMA emergency budget (~₦300k per ward per season).',
    evidence: 'Standard FEMA / Red Cross practice.',
    triggers: { flood_min: 7.0 },
    quantify: (ctx) => {
      const bags = Math.max(300, Math.round((ctx.flood_risk_score - 5) * 200));
      return {
        target: `Stage ${fmtN(bags)} pre-filled sandbags + 50 tarpaulins at ${ctx.lga} LGA office`,
        deadline: thisRainySeason(),
        locations: 'LGA HQ + 2 satellite drop-points (police station, secondary school). Collection log via UCIP app.',
        cost_estimate: `${fmtNaira(bags * 800 + 200_000)} (≈₦800/sandbag + ₦200k tarps & logistics)`,
        kpi: `≥90% of bags distributed within 6h of red-alert SMS; zero stockouts during peak rainfall events.`,
      };
    },
  },
  {
    id: 'mangrove-restoration',
    kind: 'flood',
    title: 'Mangrove + bioshield restoration along lagoon edge',
    description:
      'Replant Rhizophora and Avicennia along Lagos Lagoon shoreline (Apapa, VI, Lekki, Ikorodu). Each km of mangrove ' +
      'reduces inland surge by 0.5–1.5m.',
    actor: 'both',
    urgency: 'long_term',
    cost: 'medium',
    impact: { flood: -1.5, ndvi: 0.12 },
    who_pays: 'Lagos State + private CSR (banks, telcos); community nurseries.',
    evidence: 'UNEP estimates mangroves provide ~US$80B/year flood-protection value globally.',
    triggers: { flood_min: 5.5 },
    quantify: (ctx) => {
      const km = 2 + Math.round((ctx.flood_risk_score - 5) * 0.6);
      const seedlings = km * 8_000;
      return {
        target: `Plant ${fmtN(seedlings)} mangrove seedlings along ${km} km of ${ctx.lga} shoreline`,
        deadline: `Nursery phase: ${inMonths(6)}. Planting season: ${inMonths(12)}–${inMonths(24)}.`,
        locations: 'Tidal flats abutting the Lagoon — site-survey to identify suitable substrate.',
        cost_estimate: `${fmtNaira(seedlings * 600 + 5_000_000)} (₦600/seedling, ₦5M nursery + monitoring)`,
        kpi: `≥70% seedling survival at 24 months; measurable wave-attenuation in 2 metered transects.`,
      };
    },
  },
  {
    id: 'rainwater-harvesting',
    kind: 'flood',
    title: 'Household rainwater harvesting incentive',
    description:
      'Tax/permit rebate for homes installing 1500L+ rainwater tanks. Reduces runoff at source while addressing water scarcity.',
    actor: 'both',
    urgency: 'short_term',
    cost: 'medium',
    impact: { flood: -0.4 },
    who_pays: 'LGA permit-fee rebate; homeowner pays equipment (~₦150k per 1500L unit).',
    evidence: 'Bengaluru mandatory RWH bylaw 2009.',
    triggers: { flood_min: 5.0 },
    quantify: (ctx) => {
      const tanks = Math.round(WARD_HOUSEHOLDS * 0.08);  // 8% of households
      const litres = tanks * 1500;
      return {
        target: `Install ${fmtN(tanks)} household RWH tanks (~${fmtN(litres)} L total storage) in ${ctx.lga}`,
        deadline: `Pilot block by ${inMonths(3)}; full rollout by ${inMonths(18)}`,
        locations: 'Priority: flood-prone streets surfaced by UCIP citizen reports. Multi-tenant buildings first.',
        cost_estimate: `Homeowner pays ${fmtNaira(150_000)} per unit; LGA matches with ${fmtNaira(50_000)} rebate → ${fmtNaira(tanks * 50_000)} programme cost`,
        kpi: `≥60% of installed tanks half-full or more after a 30mm rainfall event (monitored via random audits).`,
      };
    },
  },

  // ─────────────────────────── NDVI / CLEARING ────────────────────────────
  {
    id: 'adopt-a-tree',
    kind: 'ndvi',
    title: 'Adopt-a-tree programme',
    description:
      'CDAs and schools "adopt" trees on public land — water, prune, report damage. Each tree gets a QR-coded plaque ' +
      'linking to UCIP for live health updates.',
    actor: 'society',
    urgency: 'short_term',
    cost: 'low',
    impact: { ndvi: 0.05 },
    who_pays: 'CDA + sponsor (₦5k per tree per year).',
    evidence: 'NYC MillionTreesNYC reached target 2 years early via volunteer adoption.',
    triggers: { ndvi_max: 0.4 },
    quantify: (ctx) => {
      const trees = Math.round((0.45 - ctx.ndvi_health) * 2_500);
      return {
        target: `Enrol ${fmtN(trees)} existing public-land trees in ${ctx.lga} into the adopt-a-tree register`,
        deadline: `Census + plaques completed by ${inMonths(4)}`,
        locations: 'Parks, school grounds, road medians. Schools and CDAs each adopt clusters of 20–50 trees.',
        cost_estimate: `${fmtNaira(trees * 5_000)} / year (₦5k/tree: plaque + care kit + small honorarium)`,
        kpi: `≥85% of adopted trees alive + healthy at year-end (verified by quarterly NDVI + spot check).`,
      };
    },
  },
  {
    id: 'reforestation-grant',
    kind: 'ndvi',
    title: 'Targeted reforestation grant for hot/bare wards',
    description:
      'Match-fund native-species planting in wards with NDVI < 0.3. Includes 2-year maintenance contract with local cooperative.',
    actor: 'government',
    urgency: 'short_term',
    cost: 'medium',
    impact: { ndvi: 0.15, heat: -0.6 },
    who_pays: 'Lagos State + Federal Ecological Fund + REDD+ carbon credits.',
    evidence: 'Ethiopia Green Legacy planted 25B trees 2019–2023.',
    triggers: { ndvi_max: 0.3 },
    quantify: (ctx) => {
      // To lift NDVI by 0.1: ~1500 mature trees per ward (rule of thumb)
      const gap = Math.max(0.05, 0.4 - ctx.ndvi_health);
      const trees = Math.round(gap * 15_000);
      return {
        target: `Plant ${fmtN(trees)} native trees in ${ctx.lga} — lifting NDVI from ${ctx.ndvi_health.toFixed(2)} toward 0.40`,
        deadline: `Year 1: ${fmtN(Math.round(trees * 0.6))} trees. Year 2: remaining ${fmtN(Math.round(trees * 0.4))} + replacement.`,
        locations: 'Idle public plots, school perimeters, road medians, drainage banks (where flood-safe).',
        cost_estimate: `${fmtNaira(trees * 18_000)} (₦18k/tree all-in: seedling + planting + 2-year care)`,
        kpi: `NDVI ≥0.35 within 24 months across the planted polygons (validated via Landsat composite).`,
      };
    },
  },
  {
    id: 'greenbelt-zoning',
    kind: 'ndvi',
    title: 'Greenbelt zoning + tree-cutting permits',
    description:
      'Reclassify residual urban forest patches as protected greenbelt. Cutting requires LASEPA permit + ₦500k/tree replacement bond.',
    actor: 'government',
    urgency: 'long_term',
    cost: 'low',
    impact: { ndvi: 0.1 },
    who_pays: 'LASEPA — revenue-positive via permit fees and fines.',
    evidence: 'Singapore Park Connector Network; Lagos State Urban and Regional Planning Law §47.',
    triggers: { ndvi_max: 0.5, clearing_reports_min: 1 },
    quantify: (ctx) => ({
      target: `Designate every contiguous green patch >0.5 ha in ${ctx.lga} as protected greenbelt (gazette under URP Law §47)`,
      deadline: `Gazette notice by ${inMonths(6)}; cutting permits active from ${inMonths(8)}`,
      locations: 'GIS-mapped from latest Landsat NDVI; physically marked with signposts + boundary plaques.',
      cost_estimate: '<₦8M survey + gazette + 200 boundary signposts. Revenue-positive from permit fees.',
      kpi: `Zero net loss of greenbelt area year-over-year; every cutting permit met with ₦500k/tree bond.`,
    }),
  },
  {
    id: 'report-illegal-clearing',
    kind: 'ndvi',
    title: 'Citizen reporting + LASEPA 48-hour response',
    description:
      'UCIP citizen reports route directly to LASEPA enforcement. Verified clearing → stop-work notice within 48h.',
    actor: 'both',
    urgency: 'immediate',
    cost: 'low',
    impact: { ndvi: 0.04 },
    who_pays: 'LASEPA existing enforcement team.',
    evidence: 'SeeClickFix model; Bogotá ParticipaBOG.',
    triggers: { clearing_reports_min: 1 },
    quantify: (ctx) => ({
      target: `Auto-route all UCIP clearing reports in ${ctx.lga} to LASEPA; respond to ${Math.max(5, ctx.clearing_reports * 3)}/month`,
      deadline: 'API + SLA signed off within 2 weeks; first dispatch on next clearing report',
      locations: 'Webhook → LASEPA case management system; field response within ward boundaries.',
      cost_estimate: '<₦2M integration + ongoing staff time (no new headcount).',
      kpi: `≥80% of verified reports get a stop-work notice within 48h; case-status visible publicly via UCIP.`,
    }),
  },
  {
    id: 'community-garden',
    kind: 'ndvi',
    title: 'Community gardens on idle public land',
    description:
      'Convert vacant LGA-owned plots to vegetable + tree gardens managed by women cooperatives. Doubles as cooling + food security.',
    actor: 'both',
    urgency: 'short_term',
    cost: 'low',
    impact: { ndvi: 0.06, heat: -0.3 },
    who_pays: 'LGA land + NGO seed funding (Slum Dwellers International, etc.).',
    evidence: 'Detroit Black Community Food Security Network model.',
    triggers: { ndvi_max: 0.4 },
    quantify: (ctx) => {
      const plots = Math.max(2, Math.round((0.5 - ctx.ndvi_health) * 12));
      const m2 = plots * 400;
      return {
        target: `Establish ${plots} community gardens (~${fmtN(m2)} m² total) on idle LGA-owned land in ${ctx.lga}`,
        deadline: `Plots gazetted + cooperatives formed by ${inMonths(3)}; first harvest by ${inMonths(9)}`,
        locations: 'LGA-owned vacant plots; women cooperatives nominate sites, vetted by surveyor.',
        cost_estimate: `${fmtNaira(plots * 800_000)} seed funding (fence, water, tools, seedlings, training)`,
        kpi: `Each plot harvests ≥3 vegetable cycles/year; member households see ₦20k+/month food savings.`,
      };
    },
  },
];

export const KIND_LABEL = { heat: 'Heat', flood: 'Flood', ndvi: 'Green space' };
export const ACTOR_LABEL = { society: 'Society', government: 'Government', both: 'Society + Government' };
export const URGENCY_LABEL = { immediate: 'Immediate', short_term: 'Short-term (1–6mo)', long_term: 'Long-term (6mo+)' };
export const COST_LABEL = { low: '₦ Low', medium: '₦₦ Medium', high: '₦₦₦ High' };
