# MKE.dev — Product Roadmap

## Overview

This roadmap outlines the phased development plan for MKE.dev, starting with a 4-week hackathon sprint for the Gemini 3 Hackathon (deadline: February 10, 2026), followed by post-launch phases for production readiness and scale.

---

## Phase 0: MVP — Hackathon Sprint (4 Weeks)

**Timeline**: January 13, 2026 → February 10, 2026
**Goal**: Deliver a compelling "Voice-to-Vision" demo showcasing core capabilities

### Week 1: Foundation & Core Intelligence (Days 1-7)

| Priority | Feature | Description | Dependencies |
|----------|---------|-------------|--------------|
| P0 | Project Setup | Initialize Next.js 15, Convex, Clerk | None |
| P0 | Design System | Implement tokens, typography, neobrutalist UI | Project Setup |
| P0 | App Shell | Chat-first, map-centric layout | Design System |
| P0 | Mapbox Integration | Base map with ESRI zoning/parcel layers | App Shell |
| P0 | Document Ingestion | Firecrawl → Gemini File Search for core PDFs | None |
| P0 | Zoning Interpreter Agent | Primary agent for zoning queries | Document Ingestion |
| P0 | Area Plan Advisor Agent | Agent for neighborhood plan alignment | Document Ingestion |
| P0 | Opik Integration | `@track` decorators on all agent functions | Agents |

### Week 2: Voice & Vision Integration (Days 8-14)

| Priority | Feature | Description | Dependencies |
|----------|---------|-------------|--------------|
| P0 | Gemini Live API | Real-time bidirectional voice interface | App Shell |
| P0 | Live Tool Bridge | Tool-based architecture bridging Live to File Search ([arch](../../docs/architecture/gemini-live-file-search-integration.md)) | Gemini Live, RAG |
| P0 | Voice Activity Detection | Automatic microphone management | Gemini Live |
| P0 | Mapbox Spatial Tools | Agent tools for geocoding, POI search, isochrone, directions | Mapbox Integration |
| P0 | Forms Integration | Actionable permit/application forms with download links | Document Ingestion |
| P0 | FormActionCard Component | Generative UI for form actions with walkthrough | CopilotKit, Forms |
| P0 | Nano Banana Tool | `generateArchitecturalPreview` using Gemini 3.0 Flash Image | Agents |
| P0 | Design Advisor Agent | Agent for design guidelines + vision integration | Nano Banana |
| P0 | VisionCard Component | Generative UI for architectural previews | CopilotKit |
| P0 | ZoneInfoCard Component | Generative UI for zoning summaries | CopilotKit |
| P0 | Clickable Citations | Inline [N] citations with PDF viewer modal ([spec](../specs/2026-01-15-citation-links/spec.md)) | RAG, Document Corpus |
| P1 | VoiceIndicator | Visual feedback during voice interaction | Gemini Live |
| P1 | IsochroneCard Component | Generative UI for accessibility/reachability analysis | Mapbox Spatial Tools |

### Week 3: Advanced Agents & Evaluation (Days 15-21)

| Priority | Feature | Description | Dependencies |
|----------|---------|-------------|--------------|
| P0 | Incentives Navigator Agent | Agent for TIF, OZ, and other incentives | Document Ingestion |
| P0 | Orchestrator Agent | Meta-agent for complex multi-domain queries ([spec](../specs/2026-01-15-orchestrator-agent/spec.md)) | All agents |
| P0 | Additional Map Layers | TIF, Opportunity Zones, Historic Districts, etc. | Mapbox |
| P0 | Opik Evaluation Pipeline | RAG accuracy and hallucination testing | Opik Integration |
| P1 | Prompt Optimization | Agent Optimizer cycle on Zoning Interpreter | Opik Evaluation |
| P1 | IncentivesSummaryCard | Generative UI for incentive stacking | CopilotKit |
| P1 | ParcelAnalysisCard | Generative UI for parcel feasibility | CopilotKit |

### Week 4: Polish, Demo & Submission (Days 22-28)

| Priority | Feature | Description | Dependencies |
|----------|---------|-------------|--------------|
| P0 | UX/UI Polish | Visual refinements, animations, error states | All UI |
| P0 | Accessibility Testing | Voice-only navigation, screen reader support | All |
| P0 | Demo Video | ~3 minute "Voice-to-Vision" workflow video | All features |
| P0 | Submission Materials | Text description, public repo, live deployment | All |
| P1 | Conversation History | Save/recall previous conversations | Convex |
| P2 | User Feedback System | Thumbs up/down with Opik integration | Opik |

---

## Phase 1: Production Hardening (Post-Hackathon)

**Goal**: Make the platform reliable and secure for public use

| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | Error Handling | Graceful degradation, retry logic, user-friendly errors |
| P0 | Rate Limiting | Protect APIs from abuse |
| P0 | Security Audit | Review auth, data access, API keys |
| P0 | Performance Optimization | Lazy loading, caching, bundle optimization |
| P0 | Orchestrator Agent Phase 1 | Basic multi-agent orchestration with sequential execution ([spec](../specs/2026-01-15-orchestrator-agent/spec.md)) |
| P0 | Memory Layer Phase 1 | Supermemory setup, basic save/recall, project memory ([spec](../specs/2026-01-15-memory-layer/spec.md)) |
| P1 | Orchestrator Agent Phase 2 | Parallel task execution, result caching |
| P1 | Memory Layer Phase 2 | Auto-learning, user profile injection, preference learning |
| P1 | Monitoring & Alerts | Opik production monitoring, error alerting |
| P1 | Analytics | User behavior tracking (privacy-respecting) |
| P2 | Orchestrator Agent Phase 3 | Iterative refinement, user clarification, explanation mode |
| P2 | Memory Layer Phase 3 | User memory management UI, privacy controls, memory indicators |
| P2 | Offline Support | Basic functionality when network is unavailable |

---

## Phase 2: Feature Expansion

**Goal**: Complete the core feature set based on user feedback

| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | Permit Navigator Agent | Step-by-step permit process guidance |
| P0 | PermitProcessCard | Visual permit timeline component |
| P0 | Real Estate Finder Agent | Property search by criteria |
| P0 | OpportunityListCard | Search results with match scores |
| P1 | Opportunity Scout Agent | Proactive site recommendations |
| P1 | Saved Searches | Alert users to new matching properties |
| P2 | PDF Export | Generate feasibility reports as PDFs |
| P2 | Comparison Tool | Compare multiple parcels side-by-side |

---

## Phase 3: Knowledge Base Expansion

**Goal**: Expand document corpus and keep it current

| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | **Planning Ingestion Agent** | Google ADK Python agent for crawling Milwaukee planning docs ([spec](../specs/2026-01-16-planning-ingestion-agent/spec.md)) |
| P0 | Automated Crawling | Weekly Firecrawl runs for new content (via Planning Ingestion Agent) |
| P0 | Source Monitoring | Dashboard showing sync status per source |
| P1 | Document Versioning | Track changes to regulations over time |
| P1 | City API Integration | Direct integration with city permit system |
| P2 | Community Contributions | Allow verified users to flag outdated info |

### Planning Ingestion Agent Details

**Architecture**: Standalone Google ADK Python service at `apps/agents/planning-ingestion/`

**Data Sources**:
- HTML Pages (weekly): Home Building Sites, Vacant Lots, Commercial Properties, Overlay Zones, Design Guidelines
- PDF Documents (monthly): House Design Standards, Green Milwaukee Guide, Vacant Lot Handbook

**Key Features**:
- Firecrawl MCP integration for web scraping
- Content hashing for change detection
- Convex HTTP API for storage
- Gemini File Search Store uploads for RAG
- Opik observability tracing

**Why ADK (not Convex)**:
- Native Firecrawl MCP support
- Better suited for background batch processing
- Keeps existing chat agent untouched (avoids migration risk)

---

## Phase 4: Scale & Replication

**Goal**: Prepare platform for other municipalities

| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | Multi-Tenant Architecture | Support multiple cities in one deployment |
| P0 | Configuration System | City-specific settings, data sources, branding |
| P1 | Admin Dashboard | City staff tools for document management |
| P1 | White-Label Support | Custom domains and branding per city |
| P2 | API Access | Public API for third-party integrations |
| P2 | Open Source Core | Release core components for civic tech community |

---

## Milestone Summary

| Phase | Name | Key Deliverable |
|-------|------|-----------------|
| **0** | MVP / Hackathon | Voice-to-Vision demo, Gemini 3 submission |
| **1** | Production Hardening | Reliable, secure public platform |
| **2** | Feature Expansion | Complete agent roster, all Generative UI cards |
| **3** | Knowledge Base | Automated updates, comprehensive corpus |
| **4** | Scale | Multi-city support, API, open source |

---

## Dependencies Map

```
Foundation
    ├── Design System
    │   └── App Shell
    │       ├── Mapbox Integration
    │       │   ├── ESRI Layers (zoning, parcels, TIF, etc.)
    │       │   ├── 3D Buildings (Mapbox Standard style)
    │       │   └── Mapbox Spatial Tools
    │       │       ├── Geocoding (address → coordinates)
    │       │       ├── POI Search (nearby places)
    │       │       ├── Isochrone (accessibility analysis)
    │       │       ├── Directions (travel time/distance)
    │       │       └── Static Maps (visual context)
    │       └── Conversational Interface
    │           ├── Gemini Live (Voice) [spec](../specs/2026-01-15-gemini-live-voice/spec.md)
    │           │   ├── useGeminiLive Hook (WebSocket + audio)
    │           │   ├── VoiceChat Component (UI)
    │           │   ├── executeLiveTool Action (Convex)
    │           │   └── Tool Bridge → File Search RAG
    │           └── CopilotKit (Generative UI)
    │               └── FormActionCard (form downloads + walkthrough)
    │
Document Ingestion (Gemini File Search)
    ├── Zoning Code PDFs (informational)
    ├── Area Plans PDFs (informational)
    ├── Application Forms (actionable)
    │   ├── Form metadata (downloadUrl, formNumber, etc.)
    │   └── Form-aware RAG responses
    │
    └── Planning Ingestion Agent (Google ADK Python)
        ├── Firecrawl MCP (web scraping)
        ├── HTML Pages (weekly): Home Sites, Vacant Lots, Commercial, Overlays
        ├── PDF Documents (monthly): Design Standards, Green Guide, Handbooks
        ├── Content Hashing (change detection)
        ├── Convex HTTP API (storage)
        └── Gemini File Search Store (RAG indexing)
    │
    └── Agent System (Google ADK)
        ├── Specialized Agents (Single-Domain)
        │   ├── Zoning Interpreter (zoning code, parking, permitted uses)
        │   ├── Area Plan Advisor (neighborhood vision, development goals)
        │   ├── Incentives Navigator (TIF, OZ, tax credits)
        │   ├── Spatial Agent (geocoding, parcel search, ESRI queries)
        │   ├── Design Advisor + Nano Banana (vision generation)
        │   └── Permit Navigator (form-aware guidance)
        │
        ├── Memory Layer (Supermemory)
        │   ├── User Profiles (auto-learned preferences)
        │   ├── Project Memory (multi-session tracking)
        │   ├── Interaction Memory (findings, calculations)
        │   └── Semantic Recall (search past interactions)
        │
        └── Orchestrator Agent (Multi-Domain)
            ├── Query Classification (simple vs complex)
            ├── Workflow Planning (task DAG generation)
            ├── Parallel Execution (independent tasks)
            ├── Result Synthesis (combine agent outputs)
            ├── Memory Integration (user context + preferences)
            └── Handles: feasibility analysis, site comparison,
                incentive stacking, complex neighborhood queries

Opik/Comet
    ├── Tracing (all agents)
    ├── Evaluation (RAG, hallucination)
    └── Optimization (prompt tuning)
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gemini Live API instability | Medium | High | Fallback to text-only mode |
| ESRI data unavailability | Low | High | Cache last-known-good data |
| Document corpus gaps | Medium | Medium | Clear "no data" messaging |
| Hallucination in responses | Medium | High | Strict RAG grounding, source citations |
| Accessibility compliance | Low | High | Test with actual users, WAVE audits |

---

## Technical Architecture Notes

### Gemini Live + File Search Integration

**Problem**: Gemini Live API does not natively support File Search. Our RAG documents (zoning codes, area plans) are stored in Gemini File Search Stores.

**Solution**: Tool-based bridge architecture. Gemini Live supports function calling—we define tools that invoke our existing Convex RAG pipeline.

```
User Voice → Gemini Live → functionCall: search_zoning_docs
                              ↓
                      Convex Backend (executeLiveTool)
                              ↓
                      ragV2.queryDocuments → File Search API
                              ↓
                      Tool Result → Gemini Live → Voice Response
```

**Key Components**:
| Component | Location | Purpose |
|-----------|----------|---------|
| `liveSession.ts` | `convex/agents/` | Convex action executing Live tools |
| `useGeminiLive.ts` | `src/hooks/` | React hook for WebSocket + audio |
| `VoiceChat.tsx` | `src/components/voice/` | Voice UI component |

**Tools Available in Live Sessions**:
- `search_zoning_docs` → queries zoning-codes File Search Store
- `search_area_plans` → queries area-plans File Search Store
- `geocode_address` → existing geocoding tool
- `query_zoning_at_point` → existing ESRI query tool
- `calculate_parking` → existing parking calculator

**Full Architecture**: See [gemini-live-file-search-integration.md](../../docs/architecture/gemini-live-file-search-integration.md)
