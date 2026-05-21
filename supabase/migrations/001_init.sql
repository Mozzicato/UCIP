-- UCIP — initial schema
-- Run inside Supabase SQL editor or `supabase db push`.

create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  phone text unique,
  email text unique,
  default_lga text,
  alert_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  report_type text not null check (report_type in ('heat', 'flood', 'clearing')),
  severity smallint not null check (severity between 1 and 5),
  location geography(point, 4326) not null,
  lga text not null,
  notes text default '',
  photo_url text,
  source text not null default 'app' check (source in ('app', 'ussd')),
  user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists weather_readings (
  id bigserial primary key,
  lga text not null,
  temperature_c numeric(5,2),
  forecast_rainfall_mm_6h numeric(6,2),
  fetched_at timestamptz not null default now()
);

create table if not exists neighbourhood_scores (
  lga text primary key,
  heat_score numeric(4,2),
  flood_risk_score numeric(4,2),
  ndvi_health numeric(4,3),
  reports_24h integer default 0,
  updated_at timestamptz not null default now()
);

create table if not exists alert_subscriptions (
  id bigserial primary key,
  lga text not null,
  identifier text not null,           -- phone number, FCM token, or email
  channel text not null check (channel in ('sms', 'push', 'email')),
  created_at timestamptz not null default now(),
  unique (lga, identifier, channel)
);

create table if not exists alerts (
  id text primary key,
  lga text not null,
  kind text not null check (kind in ('heat', 'flood', 'clearing')),
  payload jsonb not null,
  recipients integer not null default 0,
  channels text[] not null default '{}',
  dispatched_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes (from PRD §3.2)
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_reports_location on reports using gist (location);
create index if not exists idx_reports_type_created on reports (report_type, created_at desc);
create index if not exists idx_reports_lga on reports (lga, created_at desc);
create index if not exists idx_scores_lga on neighbourhood_scores (lga);
create index if not exists idx_weather_lga_fetched on weather_readings (lga, fetched_at desc);
create index if not exists idx_alerts_lga_dispatched on alerts (lga, dispatched_at desc);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security — public reads, authenticated writes
-- ─────────────────────────────────────────────────────────────

alter table reports                enable row level security;
alter table neighbourhood_scores   enable row level security;
alter table weather_readings       enable row level security;
alter table alerts                 enable row level security;
alter table alert_subscriptions    enable row level security;

create policy "reports_public_read"      on reports              for select using (true);
create policy "reports_anon_insert"      on reports              for insert with check (true);
create policy "scores_public_read"       on neighbourhood_scores for select using (true);
create policy "weather_public_read"      on weather_readings     for select using (true);
create policy "alerts_public_read"       on alerts               for select using (true);
create policy "subs_owner_rw"            on alert_subscriptions  for all using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- View: latest weather per LGA
-- ─────────────────────────────────────────────────────────────

create or replace view latest_weather_per_lga as
select distinct on (lga) lga, temperature_c, forecast_rainfall_mm_6h, fetched_at
from weather_readings
order by lga, fetched_at desc;
