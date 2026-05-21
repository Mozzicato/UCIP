// 20 representative Lagos neighbourhoods with centroid coords + LGA + baseline metrics.
// Baseline metrics seed the scoring engine before live data arrives.
// elevation_m and historical_flood_freq are calibrated to known Lagos hot/flood zones.
export const NEIGHBOURHOODS = [
  { lga: 'Ikoyi',           lat: 6.4500, lng: 3.4350, elevation_m: 6,  historical_flood_freq: 3, baseline_lst: 30.2, baseline_ndvi: 0.42 },
  { lga: 'Victoria Island', lat: 6.4281, lng: 3.4216, elevation_m: 4,  historical_flood_freq: 5, baseline_lst: 30.6, baseline_ndvi: 0.36 },
  { lga: 'Lekki Phase 1',   lat: 6.4474, lng: 3.4553, elevation_m: 5,  historical_flood_freq: 6, baseline_lst: 30.9, baseline_ndvi: 0.41 },
  { lga: 'Ajah',            lat: 6.4675, lng: 3.5634, elevation_m: 4,  historical_flood_freq: 7, baseline_lst: 31.4, baseline_ndvi: 0.38 },
  { lga: 'Lagos Island',    lat: 6.4541, lng: 3.3947, elevation_m: 3,  historical_flood_freq: 8, baseline_lst: 32.5, baseline_ndvi: 0.18 },
  { lga: 'Yaba',            lat: 6.5095, lng: 3.3711, elevation_m: 12, historical_flood_freq: 4, baseline_lst: 32.1, baseline_ndvi: 0.24 },
  { lga: 'Surulere',        lat: 6.5009, lng: 3.3548, elevation_m: 14, historical_flood_freq: 5, baseline_lst: 33.0, baseline_ndvi: 0.20 },
  { lga: 'Mushin',          lat: 6.5326, lng: 3.3540, elevation_m: 15, historical_flood_freq: 6, baseline_lst: 34.2, baseline_ndvi: 0.12 },
  { lga: 'Oshodi',          lat: 6.5557, lng: 3.3416, elevation_m: 16, historical_flood_freq: 5, baseline_lst: 33.8, baseline_ndvi: 0.15 },
  { lga: 'Apapa',           lat: 6.4525, lng: 3.3601, elevation_m: 5,  historical_flood_freq: 9, baseline_lst: 32.9, baseline_ndvi: 0.14 },
  { lga: 'Ajegunle',        lat: 6.4498, lng: 3.3439, elevation_m: 4,  historical_flood_freq: 9, baseline_lst: 33.1, baseline_ndvi: 0.10 },
  { lga: 'Ikeja',           lat: 6.6018, lng: 3.3515, elevation_m: 39, historical_flood_freq: 2, baseline_lst: 31.4, baseline_ndvi: 0.34 },
  { lga: 'Agege',           lat: 6.6155, lng: 3.3242, elevation_m: 34, historical_flood_freq: 4, baseline_lst: 32.8, baseline_ndvi: 0.22 },
  { lga: 'Alimosho',        lat: 6.6133, lng: 3.2615, elevation_m: 38, historical_flood_freq: 3, baseline_lst: 33.5, baseline_ndvi: 0.28 },
  { lga: 'Ikorodu',         lat: 6.6194, lng: 3.5106, elevation_m: 24, historical_flood_freq: 6, baseline_lst: 32.0, baseline_ndvi: 0.48 },
  { lga: 'Badagry',         lat: 6.4151, lng: 2.8810, elevation_m: 8,  historical_flood_freq: 7, baseline_lst: 30.6, baseline_ndvi: 0.55 },
  { lga: 'Epe',             lat: 6.5840, lng: 3.9819, elevation_m: 20, historical_flood_freq: 5, baseline_lst: 31.2, baseline_ndvi: 0.62 },
  { lga: 'Festac',          lat: 6.4670, lng: 3.2842, elevation_m: 6,  historical_flood_freq: 7, baseline_lst: 32.1, baseline_ndvi: 0.26 },
  { lga: 'Amuwo-Odofin',    lat: 6.4598, lng: 3.2730, elevation_m: 5,  historical_flood_freq: 8, baseline_lst: 32.6, baseline_ndvi: 0.22 },
  { lga: 'Ojo',             lat: 6.4593, lng: 3.1822, elevation_m: 9,  historical_flood_freq: 5, baseline_lst: 31.9, baseline_ndvi: 0.30 },
];
