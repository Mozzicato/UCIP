# Deploying UCIP to Vercel

## Quick Deploy (2 minutes)

### Option 1: CLI Deploy (Fastest)
```bash
npm install -g vercel
vercel --prod
```

### Option 2: GitHub Deploy (Recommended for demos)
1. Push to GitHub ✅ (already done)
2. Go to [vercel.com](https://vercel.com)
3. Import the GitHub repository
4. Set environment variables:
   - `DEMO_MODE` = `true` (default - no database needed)
   - `VITE_API_BASE` = `/api/v1`
5. Deploy!

## What's Included
- ✅ **Demo Mode**: All data is mocked, no Supabase required
- ✅ **Frontend**: React + Vite (optimized build ~150KB gzipped)
- ✅ **Backend**: Node.js Express API (runs in demo mode)
- ✅ **Live Map**: Leaflet heatmap with Lagos data
- ✅ **Real-time Reports**: Mock data generator
- ✅ **Solutions Engine**: Climate adaptation recommendations

## Features Available on Vercel
1. **Home Dashboard** - Overview of Lagos neighbourhoods, air quality scores
2. **Live Heat Map** - Air quality heatmap visualization
3. **Report Form** - Submit pollution reports (saved in memory)
4. **Planner** - Climate adaptation solutions by neighbourhood
5. **Health Check** - `/api/v1/health` endpoint

## Environment Variables (Pre-configured)
- `DEMO_MODE=true` - Uses in-memory mock data
- `VITE_API_BASE=/api/v1` - Routes requests to backend

## Testing After Deploy
```bash
# Check health
curl https://your-domain.vercel.app/api/v1/health

# Get sample data
curl https://your-domain.vercel.app/api/v1/planner/summary
```

## Customizing for Demo
Edit `.env.production` to control:
- Which Lagos neighbourhoods appear
- Air quality simulation levels
- Solution recommendations

## Troubleshooting

### "API calls failing"
→ Ensure `VITE_API_BASE` is set to `/api/v1`

### "Build times out"
→ Increase build timeout in `vercel.json`

### "Backend not starting"
→ Check that `DEMO_MODE=true` is set (no database queries)

## Next Steps for Production
1. Connect Supabase database
2. Add real weather data from Open-Meteo API
3. Enable actual pollution data sources
4. Set up SMS notifications with AfricasTalking
