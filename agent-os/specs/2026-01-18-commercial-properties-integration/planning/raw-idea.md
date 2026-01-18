# Commercial Properties & Development Sites Integration - Raw Idea

## Feature Description

Add a map layer for Milwaukee city commercial properties and development sites with:
- Clickable points on the map
- Geocoding with Mapbox to convert addresses to GeoJSON
- Zoning agent analysis capability (like parcels)
- CopilotKit generative UI cards (like homes for sale)
- Street View option
- Chat search functionality ("show me commercial properties")
- Data from Browse.ai API with two robots already configured:
  - Commercial Property Robot: 019bd1dc-df2e-7747-8e54-142a383e8822
  - Development Sites Robot: 019bd1ff-bd45-7594-a466-ed701e505915
  - Workspace ID: 6b2ccf52-fa0f-45ea-bf8f-4a17551e933d
- GitHub Actions for weekly automated updates
- Convex schema for storing properties
- Agent tools for querying commercial properties

## Data Source Details

Browse.ai provides managed web scraping with configured robots that extract:
- Commercial Properties: Address, building type, square footage, lot size, zoning, price, contact info
- Development Sites: Address, lot size, zoning, site details

## Data Pipeline

The data needs to be:
1. Fetched via Browse.ai API
2. Geocoded with Mapbox to get coordinates
3. Stored in Convex database
4. Rendered as map layer with clickable points
5. Searchable via chat agent
6. Displayed in CopilotKit generative UI cards with Street View

## Implementation Notes

This feature follows similar patterns to:
- Homes for Sale integration (Browse.ai + Mapbox geocoding + CopilotKit cards)
- Parcel layer (clickable map points + zoning agent analysis)

The Browse.ai robots are already configured and ready to use with the provided IDs.
