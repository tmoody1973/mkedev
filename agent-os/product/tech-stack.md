# MKE.dev — Tech Stack

## Overview

MKE.dev is built on a modern, AI-native technology stack optimized for real-time voice interaction, multi-agent orchestration, and rich geospatial visualization.

---

## Core Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 (React 19) | Server Components, App Router |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **UI Components** | RetroUI (Neobrutalism) | Bold, accessible component library |
| **Backend** | Convex | Real-time database & serverless functions |
| **Authentication** | Clerk | User auth & session management |
| **Mapping** | Mapbox GL JS | Interactive vector tile maps |
| **Spatial Data** | ESRI ArcGIS REST | City of Milwaukee GIS layers |
| **AI/LLM** | Google Gemini 3 | Language model, RAG, function calling |
| **Voice** | Gemini Live API | Real-time bidirectional audio |
| **Image Generation** | Gemini 2.5 Flash Image (Nano Banana) | Architectural visualization |
| **Agent Framework** | Google ADK | Multi-agent orchestration |
| **Generative UI** | CopilotKit | AG-UI protocol for dynamic components |
| **Observability** | Comet/Opik | LLM tracing, evaluation, optimization |
| **Data Ingestion** | Firecrawl | Web crawling & PDF processing |

---

## Frontend

### Framework & Runtime
- **Next.js 15**: App Router, React Server Components, streaming
- **React 19**: Latest React with concurrent features
- **TypeScript 5.x**: Full type safety across the codebase

### Styling & Design
- **Tailwind CSS 3.4**: Utility-first styling
- **CSS Custom Properties**: Design tokens in `tokens.css`
- **Color Palette**:
  - Primary: `sky` (buttons, links, accents)
  - Secondary: `amber` (tags, highlights)
  - Neutral: `stone` (backgrounds, borders)

### Typography (Google Fonts)
- **Headings**: Space Grotesk
- **Body**: DM Sans
- **Monospace**: IBM Plex Mono

### UI Components
- **RetroUI**: Neobrutalism component library
- **Style**: 2px black borders, 4px shadow offsets
- **Modes**: Full light/dark mode support

### Key Libraries
```json
{
  "next": "15.x",
  "react": "19.x",
  "tailwindcss": "3.4.x",
  "@clerk/nextjs": "latest",
  "mapbox-gl": "3.x",
  "@copilotkit/react-core": "latest",
  "@copilotkit/react-ui": "latest"
}
```

---

## Backend

### Database & Functions
- **Convex**: Real-time database with serverless functions
  - Schema validation
  - Real-time subscriptions
  - Automatic caching
  - TypeScript-native

### Authentication
- **Clerk**: Managed auth provider
  - Social logins (Google, GitHub)
  - Email/password
  - Session management
  - Webhook integration with Convex

### API Architecture
- **Convex Actions**: For external API calls (Gemini, ESRI)
- **Convex Mutations**: For data writes
- **Convex Queries**: For data reads with real-time sync

---

## Mapping & Geospatial

### Map Engine
- **Mapbox GL JS 3.x**: WebGL-powered vector maps
- **mapbox-gl-arcgis-featureserver**: Tiled ESRI layer integration

### Data Sources (ESRI ArcGIS REST)

| Layer | Endpoint |
|-------|----------|
| Zoning Districts | `milwaukeemaps.milwaukee.gov/.../zoning/MapServer/11` |
| Parcels (MPROP) | `milwaukeemaps.milwaukee.gov/.../parcels_mprop/MapServer/2` |
| TIF Districts | `milwaukeemaps.milwaukee.gov/.../special_districts/MapServer/8` |
| Opportunity Zones | `milwaukeemaps.milwaukee.gov/.../special_districts/MapServer/9` |
| Historic Districts | `milwaukeemaps.milwaukee.gov/.../special_districts/MapServer/17` |
| ARB Areas | `milwaukeemaps.milwaukee.gov/.../special_districts/MapServer/1` |
| City-Owned Lots | `milwaukeemaps.milwaukee.gov/.../govt_owned/MapServer` |
| Geocoding | `milwaukeemaps.milwaukee.gov/.../AddressLL_Top1/GeocodeServer` |

### Map Features
- 2D/3D view toggle
- Layer visibility controls
- Parcel click → context enrichment
- Dynamic styling by zoning category

---

## AI & Agent System

### Language Models
- **Gemini 3**: Primary LLM for reasoning, RAG, function calling
- **Gemini 2.5 Flash Image (Nano Banana)**: Architectural visualization

### Voice Interface
- **Gemini Live API**: Real-time bidirectional audio
  - 16-bit PCM, 16kHz mono input
  - 24kHz output
  - < 500ms response latency
  - Natural interruption handling
  - Voice Activity Detection (VAD)

### Agent Framework
- **Google Agent Development Kit (ADK)**
  - TypeScript-native
  - Function tool definitions with Zod schemas
  - Multi-agent orchestration

### Agent Roster

| Agent | Specialty |
|-------|-----------|
| Zoning Interpreter | Zoning code parsing, permitted uses, dimensional standards |
| Area Plan Advisor | Neighborhood plan alignment, community goals |
| Incentives Navigator | TIF, Opportunity Zones, stacking analysis |
| Design Advisor | Design guidelines, historic requirements |
| Permit Navigator | Permit process, timelines, fees |
| Feasibility Analyst | Meta-agent orchestrating all others |

### RAG Pipeline
- **Gemini File Search**: Document embedding and retrieval
- **Firecrawl**: Automated web crawling and PDF ingestion
- **Document Corpus**: 500+ pages (zoning code, 14 area plans, policies)

---

## Generative UI

### Framework
- **CopilotKit**: AG-UI protocol for agent-to-UI communication
- **Static Generative UI**: Pre-defined components rendered by agents

### Components

| Component | Purpose |
|-----------|---------|
| ZoneInfoCard | Zoning district summary |
| ParcelAnalysisCard | Feasibility assessment |
| IncentivesSummaryCard | Available financial incentives |
| AreaPlanContextCard | Neighborhood plan alignment |
| PermitProcessCard | Permit timeline visualization |
| CodeCitationCard | Source document references |
| OpportunityListCard | Property search results |
| VisionCard | Architectural preview image |

---

## Observability & Monitoring

### LLM Observability
- **Comet/Opik**: Comprehensive LLM monitoring platform
  - End-to-end trace logging
  - Token usage and cost tracking
  - Response latency monitoring

### Evaluation
- **LLM-as-Judge**: Automated quality assessment
- **Heuristic Metrics**: RAG accuracy, hallucination detection
- **User Feedback**: Thumbs up/down → Opik traces

### Optimization
- **HRPO/MetaPrompt**: Automated prompt optimization
- **A/B Testing**: Prompt variant comparison

---

## Development Tools

### Package Manager
- **pnpm**: Fast, disk-efficient package manager

### Linting & Formatting
- **ESLint**: Code linting with Next.js config
- **Prettier**: Code formatting
- **TypeScript**: Strict mode enabled

### Testing
- **Vitest**: Unit and integration testing
- **Playwright**: E2E testing
- **Testing Library**: React component testing

### CI/CD
- **GitHub Actions**: Automated testing and deployment
- **Vercel**: Production hosting and preview deployments

---

## Third-Party Services

| Service | Purpose | Notes |
|---------|---------|-------|
| Clerk | Authentication | Social login, session management |
| Mapbox | Map tiles & rendering | Vector tiles, geocoding |
| Google Cloud | AI/ML APIs | Gemini, ADK |
| Firecrawl | Web scraping | PDF and page crawling |
| Comet | LLM observability | Monitoring, evaluation |
| Vercel | Hosting | Edge functions, CDN |

---

## Environment Variables

```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Database
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=https://...

# Mapping
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.ey...

# AI
GOOGLE_GEMINI_API_KEY=...

# Observability
COMET_API_KEY=...
OPIK_PROJECT_NAME=mke-dev

# Data Ingestion
FIRECRAWL_API_KEY=...
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Next.js    │  │  Mapbox GL   │  │    CopilotKit UI     │  │
│  │   Frontend   │  │    Map       │  │  (Generative Cards)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │   Gemini Live     │                        │
│                    │   (Voice API)     │                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                      Backend & AI Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Convex    │  │    Clerk     │  │     Google ADK       │  │
│  │  (Database)  │  │   (Auth)     │  │  (Agent Orchestrator)│  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                              │                                   │
│           ┌──────────────────┼──────────────────┐               │
│           │                  │                  │               │
│  ┌────────┴───────┐  ┌───────┴───────┐  ┌──────┴──────┐       │
│  │  Gemini 3 +    │  │  Gemini Live  │  │  Comet/Opik │       │
│  │  File Search   │  │   (Audio)     │  │ (Observability)│    │
│  └────────────────┘  └───────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                       Data Sources                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Milwaukee    │  │  Firecrawl   │  │   MPROP Property     │  │
│  │ ESRI ArcGIS  │  │  (Documents) │  │      Data            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```
