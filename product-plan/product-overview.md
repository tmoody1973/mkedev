# MKE.dev — Product Overview

## Summary

MKE.dev is a voice-first, AI-powered civic intelligence platform that democratizes access to Milwaukee's development information by unifying complex zoning codes, financial incentives, and regulatory data into a single, intuitive conversational interface.

## Planned Sections

1. **Conversational Interface** — The unified voice and text chat experience where users ask questions and receive AI-powered answers with generative UI components.

2. **Geospatial Explorer** — The interactive Mapbox map with layered ESRI data for visualizing zoning, TIF districts, Opportunity Zones, and property information.

3. **Agent Intelligence** — The multi-agent system (Zoning Interpreter, Incentives Navigator, Feasibility Analyst, etc.) that powers complex queries and synthesizes answers.

4. **Architectural Visualizer** — The Nano Banana-powered feature for generating photorealistic building previews and visual zoning interpretations.

5. **Knowledge Base** — The RAG system managing document ingestion, Firecrawl updates, and the unified corpus of zoning codes, area plans, and policies.

## Data Model

Core entities defined for this product:

- **Parcel** — A specific piece of property identified by a tax key
- **ZoningDistrict** — A classification defining permitted uses and dimensional standards
- **IncentiveZone** — A geographic area offering financial incentives (TIF, Opportunity Zone, etc.)
- **AreaPlan** — A neighborhood-specific planning document
- **Conversation** — A chat session between user and platform
- **Query** — A single question or request within a conversation
- **FeasibilityReport** — A generated analysis synthesizing zoning, incentives, and requirements
- **ArchitecturalPreview** — A photorealistic visualization of a proposed building
- **Document** — A source file in the knowledge base for RAG-powered responses

## Design System

**Colors:**
- Primary: `sky` — Used for buttons, links, key accents
- Secondary: `amber` — Used for tags, highlights, secondary elements
- Neutral: `stone` — Used for backgrounds, text, borders

**Typography:**
- Heading: Space Grotesk
- Body: DM Sans
- Mono: IBM Plex Mono

**UI Style:**
- Neobrutalist design: 2px black borders, 4px shadow offsets
- Full light/dark mode support
- Voice-first with prominent microphone controls

## Implementation Sequence

Build this product in milestones:

1. **Foundation** — Set up design tokens, data model types, and application shell (chat-first, map-centric layout)
2. **Conversational Interface** — Voice and text chat with generative UI cards and history
3. **Geospatial Explorer** — Interactive map with 8 toggleable data layers
4. **Agent Intelligence** — Agent activity indicators and contribution panels
5. **Architectural Visualizer** — AI-generated building previews with compliance checking
6. **Knowledge Base** — Document corpus dashboard with source monitoring

Each milestone has a dedicated instruction document in `product-plan/instructions/`.
