# MKE.dev

> Voice-First AI-Powered Civic Intelligence Platform for Milwaukee

![Node](https://img.shields.io/badge/node-20%2B-green)
![pnpm](https://img.shields.io/badge/pnpm-9%2B-orange)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![License](https://img.shields.io/badge/license-MIT-blue)

**Gemini 3 Hackathon Entry** | Deadline: February 10, 2026

---

## Overview

MKE.dev democratizes access to Milwaukee's civic development information by transforming complex zoning codes, financial incentives, and regulatory data into a single, intuitive, voice-first conversational experience.

### Key Features

- **Voice-First Interface** - Real-time voice conversations via Gemini Live API with full chat integration
- **Zoning Interpreter Agent** - AI-powered zoning assistant using Gemini function calling with RAG (14 tools)
- **AI Site Visualizer** - Transform photos into architectural renderings with Gemini 3 Pro Image
- **Generative UI Cards** - Rich interactive cards for homes, parcels, zoning info, and properties
- **Interactive 3D Map** - Mapbox GL JS with 2D/3D toggle and 8 Milwaukee ESRI data layers
- **File Search RAG** - 42 documents across 5 stores (zoning codes, area plans, policies, incentives)
- **Conversation History** - Persistent chat with search, starring, and PDF report generation
- **Homes MKE Integration** - Search city-owned homes for sale with detailed property cards
- **Vacant Lots Layer** - Browse city-owned vacant lots from Strong Neighborhoods program
- **High-Performance Tiles** - PMTiles (313,000+ features) for instant map rendering

### Target Users

- **Homeowners** exploring ADUs or renovations
- **Developers** scouting opportunities and analyzing incentives
- **Architects** verifying dimensional standards
- **City Planners** reducing repetitive inquiries
- **Visually Impaired Residents** seeking independent access to property information

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router, React 19) |
| UI Components | RetroUI (neobrutalist design) |
| Styling | Tailwind CSS 3.4 |
| Backend | Convex (real-time database) |
| Auth | Clerk (Google OAuth + email) |
| Maps | Mapbox GL JS + Milwaukee ESRI ArcGIS |
| Tiles | PMTiles on Cloudflare R2 |
| AI/LLM | Google Gemini 3 (Flash + Pro) |
| Voice | Gemini Live API (bidirectional audio + text) |
| Vision | Gemini 3 Pro Image + 2.5 Flash (with fallback) |
| Agents | Google ADK |
| Generative UI | CopilotKit |
| Reports | Hybiscus PDF API |
| Monitoring | Sentry (error + performance) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- [Mapbox account](https://account.mapbox.com/) (free tier works)
- [Clerk account](https://clerk.com/) (free tier works)
- [Convex account](https://convex.dev/) (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/tmoody1973/mkedev.git
cd mkedev

# Install dependencies
pnpm install

# Copy environment template
cp .env.local.example apps/web/.env.local
```

### Configure Environment

Edit `apps/web/.env.local` with your API keys:

```bash
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx

# Optional (for full features)
CONVEX_DEPLOYMENT=dev:xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
GEMINI_API_KEY=xxx
FIRECRAWL_API_KEY=xxx
```

### Development

```bash
# Start Next.js dev server
pnpm dev

# In a separate terminal, start Convex (if using)
cd apps/web && npx convex dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
mkedev/
├── apps/
│   ├── web/                    # Next.js 15 application
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # React components
│   │   │   │   ├── chat/       # Chat panel components
│   │   │   │   ├── copilot/    # Generative UI cards
│   │   │   │   ├── map/        # Map and layer components
│   │   │   │   ├── shell/      # App shell and header
│   │   │   │   └── ui/         # RetroUI components
│   │   │   ├── contexts/       # React contexts (MapContext with 3D support)
│   │   │   ├── hooks/          # Custom hooks
│   │   │   └── lib/voice/      # Gemini Live voice integration
│   │   ├── convex/             # Convex schema & functions
│   │   │   ├── agents/         # Zoning Interpreter Agent
│   │   │   └── ingestion/      # RAG & File Search Stores
│   │   └── scripts/            # Setup scripts
│   └── agents/                 # Google ADK agents (standalone)
├── packages/
│   └── tile-builder/           # ESRI → PMTiles pipeline
├── agent-os/                   # Specs and documentation
│   ├── product/                # Mission, roadmap, tech stack
│   └── specs/                  # Feature specifications
└── data/                       # PDF documents for RAG
    ├── zoning-code-pdfs/       # Milwaukee Zoning Code (12 PDFs)
    └── plans/                  # City area plans
```

---

## Voice Interface

MKE.dev features a voice-first interface powered by Gemini Live API:

### Capabilities

- **Bidirectional Audio** - Speak naturally and hear responses
- **Real-time Transcription** - User speech appears in chat as you speak
- **Function Calling** - Voice commands trigger map actions and data lookups
- **Generative UI** - Voice requests render rich cards (homes, zoning, parcels)
- **Seamless Integration** - Voice and text conversations share the same chat

### Voice Commands

```
"Show me homes for sale in Bay View"
→ Displays HomesListCard with available properties

"What's the zoning at 500 N Water Street?"
→ Flies to location, shows ZoneInfoCard with district info

"Explain what RS6 zoning means"
→ Shows CodeCitationCard with regulations from zoning code

"Search for commercial properties downtown"
→ Displays CommercialPropertiesListCard
```

---

## Map Layers

MKE.dev integrates 8 Milwaukee GIS data layers:

| Layer | Source | Description |
|-------|--------|-------------|
| Zoning Districts | ESRI Layer 11 | Color-coded by category (residential, commercial, industrial, mixed-use) |
| Parcels | ESRI Layer 2 | Clickable parcels with property info |
| TIF Districts | ESRI Layer 8 | Tax Increment Financing zones |
| Opportunity Zones | ESRI Layer 9 | Federal opportunity zone boundaries |
| Historic Districts | ESRI Layer 17 | Historic preservation areas |
| ARB Areas | ESRI Layer 1 | Architectural Review Board districts |
| City-Owned | ESRI MapServer | Municipal properties |
| Vacant Lots | Strong Neighborhoods | City-owned vacant lots with disposition status |

Layers are served via PMTiles for optimal performance (313,000+ features).

---

## Zoning Interpreter Agent

The AI-powered Zoning Interpreter Agent helps users understand Milwaukee zoning requirements through natural conversation.

### Agent Tools (14 Total)

| Tool | Description |
|------|-------------|
| `geocode_address` | Convert street addresses to coordinates via Mapbox |
| `query_zoning_at_point` | Get zoning district + overlays from Milwaukee ESRI |
| `calculate_parking` | Calculate required parking spaces by use type |
| `query_zoning_code` | RAG search against 12 zoning code PDFs |
| `query_area_plans` | Search neighborhood plans for development context |
| `query_incentives` | Search housing assistance programs (STRONG, ARCH, etc.) |
| `search_homes_for_sale` | Find city-owned homes with filters |
| `get_home_details` | Get full property info, images, listing URL |
| `search_commercial_properties` | Find commercial real estate |
| `get_commercial_property_details` | Get commercial property details |
| `search_development_sites` | Find development opportunities |
| `get_development_site_details` | Get development site details |
| `search_vacant_lots` | Find city-owned vacant lots with filters |
| `get_vacant_lot_details` | Get vacant lot info with parcel enrichment |

### Example Queries

```
"What zoning district is 500 N Water St in?"
→ C9F(A) - Downtown Office and Service

"How many parking spaces for a 5000 sq ft restaurant at that address?"
→ 0 required (downtown), 4 bicycle spaces required

"Show me 3-bedroom homes for sale"
→ Returns HomesListCard with matching properties

"What are the setback requirements for RS6 residential?"
→ Front: Average, Side: 3-6 ft, Rear: 20 ft (with code citations)

"Show me vacant lots in Harambee"
→ Returns VacantLotsListCard with available properties
```

### RAG Document Corpus

42 documents indexed across 5 Gemini File Search Stores:

| Store | Documents | Content |
|-------|-----------|---------|
| mkedev-zoning-codes | 12 PDFs | CH295 Subchapters 1-11 + Use Tables |
| mkedev-area-plans | 13 PDFs | Neighborhood development plans |
| mkedev-policies | 2 PDFs | City policies and guidelines |
| Milwaukee Planning Documents | 7 docs | Comprehensive planning docs |
| mkedev-incentives | 8 docs | Housing assistance programs (STRONG, ARCH, etc.) |

---

## Generative UI Cards

Rich interactive cards render in chat for structured data:

| Card Type | Use Case |
|-----------|----------|
| `ZoneInfoCard` | Zoning district summary with category and overlays |
| `ParcelCard` | Full parcel info with address, zoning, permitted uses |
| `CodeCitationCard` | Zoning code excerpts with PDF viewer links |
| `HomeCard` | Detailed home listing with images and Street View |
| `HomesListCard` | List of homes with quick select |
| `CommercialPropertyCard` | Commercial property details |
| `CommercialPropertiesListCard` | List of commercial properties |
| `DevelopmentSiteCard` | Development opportunity details |
| `DevelopmentSitesListCard` | List of development sites |
| `VacantLotCard` | Vacant lot details with Street View and visualize |
| `VacantLotsListCard` | List of vacant lots with status badges |

---

## AI Site Visualizer

Transform photos into architectural renderings with Gemini 3 Pro Image:

### Features

- **Map Screenshot Capture** - Purple camera button captures current map view
- **Street View Integration** - Capture and visualize from Street View modal
- **Mask Painting** - Brush/eraser tools to mark areas for AI modification
- **Zoom & Pan** - Scroll to zoom (0.5x-5x), space+drag to pan for precise masking
- **Screenshot Gallery** - Persistent gallery of captured images (survives page refresh)
- **Zoning-Aware Prompts** - Generation considers Milwaukee zoning constraints
- **Scale-Accurate Design** - Uses lot dimensions for realistic proportions
- **Before/After Comparison** - Side-by-side view with synced zoom
- **Model Fallback** - Automatic fallback to Gemini 2.5 Flash Image if primary fails

### Example Prompts

```
"Add a 4-story mixed-use building with retail on ground floor"
"Transform this into a community park with walking paths"
"Replace this parking lot with townhomes"
"Design a modern bungalow with nice landscaping"
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token | Yes |
| `CONVEX_DEPLOYMENT` | Convex deployment ID | No* |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL | No* |
| `NEXT_PUBLIC_PMTILES_URL` | PMTiles R2 URL | No** |
| `GEMINI_API_KEY` | Google Gemini API key | Yes*** |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (Street View) | No |
| `HYBISCUS_API_KEY` | Hybiscus PDF API key | No |
| `FIRECRAWL_API_KEY` | Firecrawl API key | No |

\* Required for database features
\** Falls back to ESRI REST API if not set
\*** Required for AI, voice, and visualizer features

---

## Development Roadmap

### Week 1: Foundation (Complete)
- [x] Monorepo with pnpm workspaces
- [x] Next.js 15 with RetroUI design system
- [x] Clerk authentication
- [x] Convex backend schema
- [x] Mapbox + ESRI layer integration
- [x] Chat panel UI
- [x] PMTiles pipeline

### Week 2: Voice & AI (Complete)
- [x] **Zoning Interpreter Agent** - Gemini function calling with 14 tools
- [x] **File Search RAG** - 42 docs across 5 persistent stores
- [x] **ESRI Integration** - Geocoding + zoning lookup
- [x] **3D Map Visualization** - Zoning extrusions with category colors
- [x] **Gemini Live API** - Voice conversations with text transcription
- [x] **Voice-to-Chat** - Voice messages render in chat with cards
- [x] **Generative UI Cards** - 11 card types for structured data
- [x] **Conversation History** - Persistence, search, starring
- [x] **Homes MKE Integration** - City-owned homes search
- [x] **AI Site Visualizer** - Gemini 3 Pro Image architectural rendering
- [x] **PDF Report Generation** - Export conversations via Hybiscus API
- [x] **Incentives RAG** - Housing assistance programs (STRONG, ARCH, etc.)

### Week 3: Advanced Features (Complete)
- [x] City-owned vacant lots layer and tools
- [x] Street View modal integration across all popups
- [x] Lot size enrichment from parcels layer
- [x] Context caching for deep zoning analysis
- [x] Parcel highlight improvements
- [x] Visualizer zoom/pan for precise masking
- [x] Screenshot gallery with localStorage persistence
- [x] Gemini model fallback (Pro → 2.5 Flash)
- [x] On-demand area plans fetching in ParcelCard
- [x] Sentry error and performance monitoring

### Week 4: Polish & Submit
- [ ] Accessibility testing
- [ ] Demo video
- [ ] Submission materials

---

## Scripts

```bash
# Development
pnpm dev                  # Start Next.js dev server
pnpm lint                 # Run ESLint
pnpm format               # Run Prettier
pnpm typecheck            # Run TypeScript check

# Convex (in apps/web directory)
npx convex dev            # Start Convex dev server
npx convex run agents/zoning:chat '{"message": "..."}'  # Test agent

# RAG Setup (one-time)
npx tsx scripts/setup-file-search-stores.ts  # Upload PDFs to Gemini
npx tsx scripts/upload-incentives.ts          # Upload incentives docs
npx convex run ingestion/fileSearchStores:syncStoresFromGemini  # Register stores

# Data Sync
npx convex run vacantLots:quickSync           # Sync vacant lots from ESRI

# Tile Building (requires tippecanoe)
pnpm --filter tile-builder export    # Export ESRI → GeoJSON
pnpm --filter tile-builder build     # Build PMTiles
pnpm --filter tile-builder upload    # Upload to R2
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **City of Milwaukee** - Open GIS data via [Milwaukee Maps](https://city.milwaukee.gov/DownloadMapData)
- **RetroUI** - Neobrutalist component library
- **Mapbox** - Map rendering and interaction
- **Anthropic** - Claude AI assistance in development

---

## Team

Built for the Gemini 3 Hackathon by Tarik Moody.

---

<p align="center">
  <strong>MKE.dev</strong> — Making Milwaukee's civic development accessible to everyone
</p>
