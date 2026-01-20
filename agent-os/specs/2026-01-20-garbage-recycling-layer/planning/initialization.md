# Spec Initialization: Garbage & Recycling Collection Layer

## Initial Idea

Integrate Milwaukee's Garbage & Recycling Collection data into MKE.dev as a toggleable map layer.

## Data Source

- **Open Data Portal**: https://data.milwaukee.gov/dataset/garbage-recycling-collection
- **ESRI REST API**: https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/DPW_Sanitation/MapServer
- **Available Layers**:
  - Layer 0: Sanitation districts
  - Layers 3-8: Garbage routes by day (A, B, C, D, E, Other)
  - Layer 9: Garbage collection routes - summer
  - Layer 21: Garbage collection routes - winter
  - Layer 12: Recycling collection routes - summer
  - Layer 13: Recycling collection routes - winter
- **Data Refresh**: Nightly by the city

## User Requirements

1. Convert ESRI data to GeoJSON for Mapbox display
2. Add as a toggleable map layer (similar to zoning, TIF districts, etc.)
3. Create a cron job to refresh data after major holidays (garbage schedules change around holidays)
4. Allow users to see what day their garbage/recycling is collected

## Questions to Explore

1. Which specific layers to include (garbage routes, recycling routes, districts)?
2. Should we cache the GeoJSON in Convex or fetch live from ESRI?
3. How should the layer be styled (colors by collection day)?
4. What holidays trigger the refresh cron?
5. Should there be a popup showing collection details when clicking?
6. Voice integration - should users be able to ask "When is my garbage collected at [address]?"

## Context

- Project uses Convex for backend/crons
- Map uses Mapbox GL JS with ESRI layer integration
- Existing pattern: ESRILayerManager classes convert ESRI to Mapbox layers
- Crons defined in convex/crons.ts
- Similar layers exist: zoning, TIF, opportunity zones, homes for sale
