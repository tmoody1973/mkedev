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
| P0 | Voice Activity Detection | Automatic microphone management | Gemini Live |
| P0 | Nano Banana Tool | `generateArchitecturalPreview` using Gemini 2.5 Flash Image | Agents |
| P0 | Design Advisor Agent | Agent for design guidelines + vision integration | Nano Banana |
| P0 | VisionCard Component | Generative UI for architectural previews | CopilotKit |
| P0 | ZoneInfoCard Component | Generative UI for zoning summaries | CopilotKit |
| P1 | VoiceIndicator | Visual feedback during voice interaction | Gemini Live |

### Week 3: Advanced Agents & Evaluation (Days 15-21)

| Priority | Feature | Description | Dependencies |
|----------|---------|-------------|--------------|
| P0 | Incentives Navigator Agent | Agent for TIF, OZ, and other incentives | Document Ingestion |
| P0 | Feasibility Analyst Agent | Meta-agent orchestrating all other agents | All agents |
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
| P1 | Monitoring & Alerts | Opik production monitoring, error alerting |
| P1 | Analytics | User behavior tracking (privacy-respecting) |
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
| P0 | Automated Crawling | Weekly Firecrawl runs for new content |
| P0 | Source Monitoring | Dashboard showing sync status per source |
| P1 | Document Versioning | Track changes to regulations over time |
| P1 | City API Integration | Direct integration with city permit system |
| P2 | Community Contributions | Allow verified users to flag outdated info |

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
    │       │   └── ESRI Layers
    │       └── Conversational Interface
    │           ├── Gemini Live (Voice)
    │           └── CopilotKit (Generative UI)
    │
Document Ingestion (Firecrawl → Gemini File Search)
    └── Agent System (Google ADK)
        ├── Zoning Interpreter
        ├── Area Plan Advisor
        ├── Incentives Navigator
        ├── Design Advisor
        │   └── Nano Banana (Vision)
        ├── Permit Navigator
        └── Feasibility Analyst (Meta-Agent)
            └── Orchestrates all above

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
