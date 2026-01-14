# @mkedev/tile-builder

Converts Milwaukee ESRI GIS data to PMTiles for high-performance vector tile rendering.

## Why PMTiles?

- **10x faster** tile loading vs. dynamic ESRI REST queries
- **Offline capable** - tiles are static files
- **Free hosting** on Cloudflare R2 (no egress fees)
- **Weekly refresh** via GitHub Actions

## Quick Start

### Prerequisites

1. Install tippecanoe:
   ```bash
   # macOS
   brew install tippecanoe

   # Ubuntu/Debian
   sudo apt-get install build-essential libsqlite3-dev zlib1g-dev
   git clone https://github.com/felt/tippecanoe.git
   cd tippecanoe && make -j && sudo make install
   ```

2. Install dependencies:
   ```bash
   pnpm install --filter @mkedev/tile-builder
   ```

### Build Tiles Locally

```bash
# Export all ESRI layers to GeoJSON (~5-10 mins for parcels)
pnpm --filter @mkedev/tile-builder export

# Build PMTiles from GeoJSON (~2-5 mins)
pnpm --filter @mkedev/tile-builder tiles

# Check status
pnpm --filter @mkedev/tile-builder status
```

### Upload to Cloudflare R2

1. Create a Cloudflare R2 bucket named `mkedev-tiles`
2. Generate R2 API token with read/write permissions
3. Set environment variables:
   ```bash
   export R2_ACCOUNT_ID="your-account-id"
   export R2_ACCESS_KEY_ID="your-access-key"
   export R2_SECRET_ACCESS_KEY="your-secret-key"
   export R2_BUCKET="mkedev-tiles"
   export R2_PUBLIC_URL="https://tiles.mke.dev"  # Your custom domain
   ```
4. Upload:
   ```bash
   pnpm --filter @mkedev/tile-builder upload
   ```

### Full Pipeline

```bash
# Run everything: export → tiles → upload
pnpm --filter @mkedev/tile-builder all

# Skip upload (local development)
pnpm --filter @mkedev/tile-builder all --skip-upload
```

## Layers Included

| Layer | Features | Min Zoom | Description |
|-------|----------|----------|-------------|
| zoning | ~5,000 | 10 | Zoning districts with category colors |
| parcels | ~150,000 | 13 | Property parcels (MPROP data) |
| tif | ~100 | 10 | Tax Increment Financing districts |
| opportunity-zones | ~50 | 10 | Federal Opportunity Zones |
| historic | ~30 | 10 | Local historic districts |
| arb | ~20 | 10 | Architectural Review Board areas |
| city-owned | ~5,000 | 12 | City-owned municipal properties |

## Using in the App

Add to your `.env.local`:
```bash
NEXT_PUBLIC_PMTILES_URL=https://tiles.mke.dev/milwaukee.pmtiles
```

The app will automatically use PMTiles when configured, falling back to ESRI REST otherwise.

## Weekly Refresh

GitHub Actions automatically rebuilds tiles every Sunday at 6am UTC.

To manually trigger:
1. Go to Actions → "Refresh Milwaukee Tiles"
2. Click "Run workflow"

## Customizing Zone Colors

Edit `pmtiles-layer-manager.ts` to customize colors per zone code:

```typescript
// Example: Make RS6 zones bright red
'RS6', '#FF0000',
```

## Output Files

```
output/
├── geojson/
│   ├── zoning.geojson
│   ├── parcels.geojson
│   ├── tif.geojson
│   └── ...
└── tiles/
    └── milwaukee.pmtiles  # Final output (~50-100MB)
```
