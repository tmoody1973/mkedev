# MKE.dev — Complete Implementation Instructions

## What You're Receiving

In this export package, you have:

- **Finished UI designs** — Props-based React components for all sections
- **Data models** — TypeScript interfaces for all entities
- **Section specifications** — User flows and UI requirements
- **Design tokens** — Color palette and typography choices
- **Sample data** — Realistic test data for all entities

## What You'll Build

You will build the **backend, authentication, data fetching, and business logic** to make these UI components functional. The UI is designed and ready — you're wiring it up to a real system.

---

# Milestone 01 — Foundation

## Design Tokens

**Colors (Tailwind palette names):**
- **Primary:** `sky` — Buttons, links, key accents
- **Secondary:** `amber` — Tags, highlights, secondary elements
- **Neutral:** `stone` — Backgrounds, text, borders

**Typography (Google Fonts):**
- **Heading:** Space Grotesk
- **Body:** DM Sans
- **Mono:** IBM Plex Mono

**UI Style:**
- Neobrutalist design: 2px black borders, 4px shadow offsets
- Full light/dark mode support
- Voice-first with prominent microphone controls

## Data Model

**Core Entities:**
- `Parcel` — Property identified by tax key
- `ZoningDistrict` — Classification defining permitted uses
- `IncentiveZone` — Geographic area with financial incentives
- `AreaPlan` — Neighborhood planning document
- `Conversation` — Chat session between user and platform
- `Query` — Single question within a conversation
- `FeasibilityReport` — Analysis synthesizing zoning, incentives, requirements
- `ArchitecturalPreview` — Photorealistic visualization
- `Document` — Source file in knowledge base

## Application Shell

**Layout:** Split view with Chat (40%) on left, Map (60%) on right

**Header:**
- Logo (left): MKE.dev wordmark
- Voice Toggle (center-right): Microphone button
- Map Layers (center-right): Layer selection button
- User Menu (right): Avatar with dropdown

**Responsive Breakpoints:**
- Desktop (1024px+): 40/60 split
- Tablet (768-1023px): 50/50 split
- Mobile (<768px): Stacked (map collapsible, chat primary)

---

# Milestone 02 — Conversational Interface

## Overview
Voice-first chat experience with AI-powered responses and generative UI cards.

## User Flows
1. Text/voice input with AI responses
2. Voice mode with waveform visualization
3. Map clicks trigger contextual queries
4. Conversation history with search and starring
5. Generative UI cards inline with messages

## Components
- `ChatContainer`, `MessageBubble`, `ChatInput`, `VoiceIndicator`
- Generative cards: `ZoneInfoCard`, `ParcelAnalysisCard`, `IncentivesSummaryCard`, `AreaPlanContextCard`, `PermitProcessCard`, `CodeCitationCard`, `OpportunityListCard`
- `HistoryPanel`, `ConversationList`, `SearchInput`

## Backend
- Conversation CRUD API
- LLM integration with RAG pipeline
- Speech-to-text/text-to-speech for voice
- WebSocket for streaming responses

---

# Milestone 03 — Geospatial Explorer

## Overview
Interactive Mapbox map with 8 toggleable ESRI data layers.

## User Flows
1. Toggle layers via bottom sheet panel
2. Address search with autocomplete
3. Parcel click triggers chat query
4. Geolocation "locate me"
5. Voice navigation commands

## Components
- `MapContainer`, `MapControls`, `LocationBar`
- `LayerPanel`, `LayerToggle`, `LayerLegend`
- `AddressSearch`, `LocateButton`, `ParcelHighlight`

## Data Layers
1. Zoning Districts
2. Parcel Boundaries
3. TIF Districts
4. Opportunity Zones
5. City-Owned Properties
6. Area Plan Boundaries
7. Historic Districts
8. Design Overlay Zones

## Backend
- Mapbox GL JS integration
- ESRI ArcGIS layer proxying
- Parcel lookup API
- Geocoding with autocomplete

---

# Milestone 04 — Agent Intelligence

## Overview
Visual transparency layer showing multi-agent orchestration.

## User Flows
1. View agent progress during query processing
2. See active agents with completion checkmarks
3. Expand "Sources & Contributors" panel
4. View agent findings with citations

## The 6 Specialist Agents
1. **Zoning Interpreter** — Zoning code analysis
2. **Incentives Navigator** — Financial programs & grants
3. **Feasibility Analyst** — Project viability assessment
4. **Design Advisor** — Architectural guidelines
5. **Permit Pathfinder** — Permit requirements
6. **Compliance Checker** — Code compliance verification

## Components
- `AgentActivityIndicator`, `AgentProgressBar`, `AgentCheckmark`
- `AgentContributorsPanel`, `AgentContribution`, `SourceCitation`
- `AgentRoster`, `AgentCard`

## Backend
- Multi-agent orchestration layer
- WebSocket/SSE for real-time progress
- Agent response aggregation

---

# Milestone 05 — Architectural Visualizer

## Overview
AI-generated architectural previews with zoning compliance checking.

## User Flows
1. Natural language visualization requests
2. Building parameter presets (type, style, stories)
3. Before/after comparison toggle
4. Zoning compliance indicators
5. Save and share visualizations

## Components
- `VisionCard`, `BeforeAfterToggle`, `BuildingSpecsRow`
- `ComplianceIndicators`, `ActionButtons`
- `PromptInput`, `BuildingTypeSelector`, `StyleSelector`, `StoriesSelector`
- `ZoningConstraintsPanel`, `GenerationIndicator`

## Backend
- AI image generation integration (Nano Banana)
- Zoning constraint validation
- Street View API for "before" images
- Visualization storage and sharing

---

# Milestone 06 — Knowledge Base

## Overview
RAG system transparency with document corpus management.

## User Flows
1. View corpus stats dashboard
2. Browse documents by category
3. Search knowledge base
4. Monitor Firecrawl sync status
5. Filter by source, date, type

## Components
- `KnowledgeBase`, `CorpusStatsHeader`, `CategoryGrid`, `CategoryCard`
- `DocumentList`, `DocumentCard`, `SearchBar`
- `SourceStatusPanel`, `SourceStatusCard`, `RecentUpdatesFeed`

## Backend
- Document management API
- Firecrawl integration for web crawling
- Vector database for RAG indexing
- Source sync monitoring

## Data Sources
- City of Milwaukee DCD
- Milwaukee Zoning Code
- Area Plans
- Historic Preservation Commission
- RACM (Development incentives)

---

# External Integrations

| Service | Purpose |
|---------|---------|
| Mapbox GL JS | Base map with vector tiles, 3D terrain |
| ESRI ArcGIS | 8 data layers (zoning, TIF, OZ, etc.) |
| Gemini API | Voice input/output, LLM responses |
| Firecrawl | Document ingestion for knowledge base |
| Nano Banana | AI architectural visualization |
| Vector DB | RAG indexing (Pinecone, Weaviate, etc.) |

---

# Files Reference

```
product-plan/
├── design-system/         # Colors, typography, tokens
├── data-model/            # Entity types, sample data
├── shell/                 # Shell components
└── sections/
    ├── conversational-interface/
    ├── geospatial-explorer/
    ├── agent-intelligence/
    ├── architectural-visualizer/
    └── knowledge-base/
```

Each section contains:
- `README.md` — Feature overview
- `tests.md` — Test-writing instructions (TDD)
- `components/` — React components
- `types.ts` — TypeScript interfaces
- `sample-data.json` — Test data
