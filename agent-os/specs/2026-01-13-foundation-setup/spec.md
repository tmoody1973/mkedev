# Specification: Foundation Week 1 - MKE.dev Setup

## Goal

Establish the complete technical foundation for MKE.dev, a voice-first AI-powered civic intelligence platform for Milwaukee, including monorepo structure, Convex backend with full data model, Clerk authentication, Mapbox integration with all ESRI layers, and the chat-first application shell using RetroUI neobrutalist components.

## User Stories

- As a developer, I want a well-structured monorepo with pnpm workspaces so that I can develop the web app and agent system in a unified codebase
- As a user, I want to authenticate via Google or email/password so that my conversations and preferences are saved across sessions
- As a user, I want to view Milwaukee parcels on an interactive map with zoning, TIF, and incentive zone overlays so that I can explore development opportunities visually

## Specific Requirements

**Monorepo Structure with pnpm Workspaces**
- Initialize pnpm workspace with `apps/web` for Next.js 15 application
- Initialize `apps/agents` directory for future agent system integration
- Configure shared TypeScript config at root level
- Configure shared ESLint and Prettier configs
- Set up path aliases for cross-package imports
- Include `.env.local.example` with all required environment variables

**Next.js 15 Application Setup**
- Use App Router with React Server Components
- Configure Tailwind CSS 3.4 with design tokens from `tokens.css`
- Install RetroUI components via shadcn CLI for neobrutalist styling
- Configure Google Fonts: Archivo Black (headings), Space Grotesk (body), IBM Plex Mono (monospace)
- Set up light/dark mode theming with CSS custom properties
- Configure Convex provider at app root

**Convex Schema with Full Data Model**
- Define `parcels` table: taxKey, address, coordinates, lotSize, zoningDistrictId, incentiveZoneIds, areaPlanId
- Define `zoningDistricts` table: code, name, category, permittedUses, conditionalUses, dimensionalStandards, color
- Define `incentiveZones` table: name, type (tif/opportunity-zone/bid/nid), benefits, expirationDate, boundaryGeojson
- Define `areaPlans` table: name, neighborhood, adoptedDate, goals, landUseRecommendations, documentUrl
- Define `conversations` table: userId, title, createdAt, updatedAt, starred
- Define `messages` table: conversationId, role, content, timestamp, inputMode, parcelId, cards
- Define `documents` table: title, category, sourceUrl, content, lastCrawled, status, pageCount
- Include createdAt/updatedAt timestamps on all tables per model standards

**Clerk Authentication Integration**
- Enable Google OAuth social login as primary method
- Enable email/password authentication as secondary method
- Configure Clerk-Convex user sync via webhook
- Add ClerkProvider to app layout wrapping ConvexProvider
- Create protected routes middleware for authenticated pages
- Implement UserMenu component with avatar and logout

**Mapbox Integration with ESRI Layers**
- Initialize Mapbox GL JS 3.x with Milwaukee-centered view (43.0389, -87.9065)
- Integrate ESRI ArcGIS REST layers via mapbox-gl-arcgis-featureserver
- Layer 11: Zoning Districts with category-based color coding
- Layer 2: Parcels/MPROP data with click interaction
- Layer 8: TIF Districts overlay
- Layer 9: Opportunity Zones overlay
- Layer 17: Historic Districts overlay
- Layer 1: ARB (Architectural Review Board) Areas overlay
- City-Owned Lots layer from govt_owned MapServer

**Map Layer Controls**
- Implement LayerPanel component with expand/collapse behavior
- Show layer count indicator (X of Y active)
- Per-layer visibility toggle with Eye/EyeOff icons
- Per-layer opacity slider (0-100%)
- Color swatch and legend items for each layer
- Store layer visibility state in component state (future: persist to user preferences)

**Chat-First Application Shell**
- 40% width chat panel on left, 60% width map panel on right
- Mobile responsive: stacked layout with chat primary, map as collapsible overlay
- Header with MKE.dev logo, voice toggle button, layers button, user menu
- Neobrutalist styling: 2px black borders, 4px shadow offsets throughout
- Dark mode: white borders, adjusted shadow colors

**Chat Panel Component**
- Empty state with microphone icon and "Hey MKE, what can I build?" prompt
- Message list with user messages (sky-500 background) and assistant messages (white/stone-800)
- Loading indicator with animated bouncing dots
- Input area with text field, voice input button (amber-400), send button (sky-500)
- Support for uiComponent slot in messages for generative cards

**Parcel Click Interaction**
- Highlight clicked parcel on map with distinct border/fill
- Show popup with address, tax key, and zoning code
- Send parcel context to chat: populate input or trigger automatic query
- Store selected parcel ID in map state

**Document Ingestion Setup**
- Configure Firecrawl API connection for web crawling
- Set up Gemini File Search for PDF RAG (Zoning Code, Housing Element)
- Create Convex cron job schedule for automated refresh
- Implement manual trigger action for on-demand ingestion
- Define initial corpus targets: zoning code, housing element, neighborhood plans, incentive docs

## Visual Design

No visual assets provided in planning folder. Reference the TSX components in `product-plan/shell/components/` and `product-plan/sections/geospatial-explorer/components/` for structural and visual guidance.

## Existing Code to Leverage

**`/product-plan/shell/components/AppShell.tsx`**
- Provides the 40/60 split layout pattern with responsive mobile stacking
- Shows header integration and panel slot architecture
- Use as template for the main layout component structure
- Follow the flex-based responsive breakpoints (md:w-2/5, md:w-3/5)

**`/product-plan/shell/components/ChatPanel.tsx`**
- Contains message rendering logic with role-based styling
- Shows input form pattern with voice and send buttons
- Includes loading state indicator implementation
- Follow the neobrutalist shadow and border patterns exactly

**`/product-plan/shell/components/Header.tsx`**
- Demonstrates voice toggle and layers button styling
- Shows UserMenu integration pattern
- Use identical button styling with translate-y hover effects

**`/product-plan/data-model/types.ts`**
- Complete TypeScript interfaces for all data entities
- Use as basis for Convex schema field definitions
- Follow the same naming conventions and relationship patterns
- Reference GenerativeCard types for future message card rendering

**`/product-plan/sections/geospatial-explorer/components/LayerPanel.tsx`**
- Fully implemented layer toggle and opacity control UI
- Shows expand/collapse panel pattern
- Contains legend rendering logic
- Reuse or adapt this component directly for map layer controls

## Out of Scope

- Voice interface implementation (Gemini Live API integration is Week 2)
- Agent system implementation in `apps/agents` (placeholder only this week)
- Generative UI card components (CopilotKit integration is Week 2)
- Conversation history sidebar and persistence
- Address search/geocoding functionality
- 2D/3D view toggle
- Parcel feasibility analysis
- Architectural visualization (Gemini 2.5 Flash Image)
- Multi-agent orchestration (Google ADK)
- LLM observability (Comet/Opik integration)
- User preferences persistence
- Push to production deployment (development environment only)
