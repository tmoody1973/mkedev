# Raw Idea: Garbage & Recycling Collection Layer

## Feature Description

Integrate Milwaukee's Garbage & Recycling Collection data from the DPW Sanitation ESRI MapServer into MKE.dev, allowing users to view collection routes on the map and query collection schedules via voice/chat.

## Data Source

**ESRI REST API:** https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/DPW_Sanitation/MapServer

### Available Layers

| ID | Name |
|----|------|
| 0 | Sanitation districts |
| 3 | A - garbage day route (Monday) |
| 4 | B - garbage day route (Tuesday) |
| 5 | C - garbage day route (Wednesday) |
| 6 | D - garbage day route (Thursday) |
| 7 | E - garbage day route (Friday) |
| 8 | other - garbage day route |
| 12 | Recycling collection routes - summer |
| 13 | Recycling collection routes - winter |

Data is refreshed nightly by the city.

## Implementation Pattern

Follow same pattern as existing zoning/parcel layers:
1. Use `packages/tile-builder/` to export ESRI data to GeoJSON then PMTiles
2. Upload PMTiles to Cloudflare R2
3. Create layer manager in `apps/web/src/components/map/layers/`
4. Add to LayerPanel toggle list
5. Cron job in `convex/crons.ts` to refresh after major holidays

## Requirements

### Garbage Day Layer
- Color-coded polygons by collection day
- Day A (Monday): #3b82f6 (blue)
- Day B (Tuesday): #22c55e (green)
- Day C (Wednesday): #f97316 (orange)
- Day D (Thursday): #a855f7 (purple)
- Day E (Friday): #ec4899 (pink)

### Recycling Layer
- Separate toggleable layer
- Auto-switch between summer/winter schedules based on current date
- Milwaukee switches recycling schedules around March 15 and November 1

### Click Popup
- Show collection day (A-E and weekday name)
- Show route ID
- Calculate and display next collection date

### Holiday Cron Job
- Refresh PMTiles 1-2 days before major holidays
- Holidays: New Year's Day, Memorial Day, July 4th, Labor Day, Thanksgiving, Christmas
- After holidays, garbage collection shifts by one day for the week

### Voice Tool
- Add `query_collection_schedule` tool to voice-tools.ts and agent tools.ts
- Answer questions like "When is my garbage collected at [address]?"
- Return collection day, route ID, next pickup date, and any holiday delays

## Color Scheme

| Day | Weekday | Color | Tailwind |
|-----|---------|-------|----------|
| A | Monday | #3b82f6 | blue-500 |
| B | Tuesday | #22c55e | green-500 |
| C | Wednesday | #f97316 | orange-500 |
| D | Thursday | #a855f7 | purple-500 |
| E | Friday | #ec4899 | pink-500 |

## Existing Code to Reference

- `packages/tile-builder/src/config.ts` - Layer configuration pattern
- `packages/tile-builder/src/export-layer.ts` - ESRI export script
- `apps/web/src/components/map/layers/layer-config.ts` - Layer configuration
- `apps/web/src/components/map/layers/pmtiles-layer-manager.ts` - PMTiles rendering
- `apps/web/src/lib/voice/voice-tools.ts` - Voice tool definitions
- `apps/web/convex/agents/tools.ts` - Agent tool declarations
- `apps/web/convex/crons.ts` - Cron job definitions
