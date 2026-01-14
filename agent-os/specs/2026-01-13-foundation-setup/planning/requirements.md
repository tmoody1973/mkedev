# Spec Requirements: Foundation Week 1 - MKE.dev Setup

## Initial Description

Set up the complete foundation for MKE.dev, a voice-first AI-powered civic intelligence platform for Milwaukee. This foundation week establishes the monorepo structure, Convex backend with full data model, Clerk authentication, Mapbox integration with all ESRI layers, and the chat-first application shell.

## Requirements Discussion

### First Round Questions

**Q1:** Should we use a monorepo structure with pnpm workspaces, or separate repositories?
**Answer:** Monorepo with pnpm workspaces (apps/web + apps/agents)

**Q2:** For the Convex schema, should we define the full data model upfront or start minimal and expand?
**Answer:** Define full data model upfront (Parcel, ZoningDistrict, Conversation, Document, etc.)

**Q3:** What Clerk authentication methods should be enabled?
**Answer:** Google social login + email/password only

**Q4:** Which map layers should be included from day one vs. added incrementally?
**Answer:** ALL layers from day one:
- Zoning Districts (Layer 11)
- Parcels/MPROP (Layer 2)
- TIF Districts (Layer 8)
- Opportunity Zones (Layer 9)
- Historic Districts (Layer 17)
- ARB Areas (Layer 1)
- City-Owned Lots

**Q5:** What layout approach for the app shell?
**Answer:** Chat-first layout (chat 40% left, map 60% right, stacked on mobile)

**Q6:** What behavior when a user clicks a parcel on the map?
**Answer:** Standard behavior (highlight parcel, show popup, send context to chat)

**Q7:** What documents should be included in the initial corpus for RAG?
**Answer:**
- Zoning Code PDF (Gemini File Search RAG)
- Housing Element PDF (Gemini File Search RAG)
- City properties and houses for sale
- ALL neighborhood plans
- Incentive documentation

**Q8:** What approach for data ingestion pipeline?
**Answer:** Convex cron jobs + manual trigger option

**Q9:** What should be deferred to later phases?
**Answer:** Everything included, nothing deferred

### Existing Code to Reference

**Similar Features Identified:**
- Feature: AppShell Layout - Path: `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/shell/components/AppShell.tsx`
- Feature: ChatPanel Component - Path: `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/shell/components/ChatPanel.tsx`
- Feature: MapPanel Component - Path: `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/shell/components/MapPanel.tsx`
- Feature: Header Component - Path: `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/shell/components/Header.tsx`
- Feature: Data Model Types - Path: `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/data-model/types.ts`
- Feature: Design System Tokens - Path: `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/design-system/tokens.css`
- Feature: Tailwind Colors - Path: `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/design-system/tailwind-colors.md`
- Feature: Fonts Configuration - Path: `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/design-system/fonts.md`

### Follow-up Questions

No follow-up questions needed. User provided comprehensive answers covering all decision points.

## Visual Assets

### Files Provided:
No visual assets provided in spec planning folder.

### Reference Components in Product Plan:
The product-plan folder contains reference TSX components that serve as visual/structural guides:
- `AppShell.tsx`: Chat-first layout with 40/60 split, responsive stacking
- `ChatPanel.tsx`: Chat interface structure
- `MapPanel.tsx`: Map container structure
- `Header.tsx`: Navigation and voice toggle controls

## Requirements Summary

### Functional Requirements

**Project Structure:**
- pnpm monorepo with workspaces
- `apps/web`: Next.js 15 application with App Router
- `apps/agents`: Agent system (for later integration)
- Shared packages as needed

**Data Model (Convex Schema):**
- Parcel: Tax key, address, coordinates, lot size, zoning references
- ZoningDistrict: Code, category, permitted/conditional uses, dimensional standards
- IncentiveZone: TIF, Opportunity Zone, BID, NID, etc.
- AreaPlan: Neighborhood plans with goals and recommendations
- Conversation: Chat sessions with user association
- Message: Individual messages with role, content, generative cards
- Document: Knowledge base documents for RAG

**Authentication (Clerk):**
- Google OAuth social login
- Email/password authentication
- No other social providers initially

**Map Integration (Mapbox + ESRI):**
- Base map with Milwaukee focus
- Layer 11: Zoning Districts with color coding
- Layer 2: Parcels/MPROP data
- Layer 8: TIF Districts
- Layer 9: Opportunity Zones
- Layer 17: Historic Districts
- Layer 1: ARB (Architectural Review Board) Areas
- City-Owned Lots layer
- Layer toggle controls in UI

**App Shell:**
- Chat-first layout: 40% chat panel (left), 60% map panel (right)
- Mobile: Stacked layout with chat primary
- Header with logo, voice toggle, layers control, user menu
- Neobrutalist design: 2px black borders, 4px shadow offsets
- Light/dark mode support

**Parcel Interaction:**
- Click parcel to highlight
- Show popup with basic info
- Send parcel context to chat for AI interaction

**Document Corpus:**
- Zoning Code PDF integrated with Gemini File Search
- Housing Element PDF integrated with Gemini File Search
- City properties/houses for sale data
- All neighborhood plans
- Incentive program documentation

**Ingestion Pipeline:**
- Convex cron jobs for scheduled updates
- Manual trigger option for on-demand refresh

### Design System

**UI Component Library:**
- **RetroUI** (retroui.dev): Neobrutalist React component library
- Use RetroUI components as the primary UI building blocks
- Customize with project design tokens as needed

**RetroUI Installation (Next.js):**
```bash
# Initialize shadcn
npx shadcn@latest init

# Install utilities
npx shadcn@latest add https://retroui.dev/r/utils.json

# Install components via CLI
npx shadcn@latest add 'https://retroui.dev/r/button.json'
# (repeat for other components: card, input, etc.)
```

**RetroUI Fonts (layout.tsx):**
```tsx
import { Archivo_Black, Space_Grotesk } from "next/font/google";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
  display: "swap",
});
```

**RetroUI Theme Variables (global.css):**
- Define `--primary`, `--secondary`, `--accent`, `--border` in `:root`
- Define dark mode variants in `.dark` selector
- Include shadow values for neobrutalist style

**Colors:**
- Primary: `sky` (buttons, links, accents)
- Secondary: `amber` (tags, highlights)
- Neutral: `stone` (backgrounds, text, borders)

**Typography:**
- Headings: Space Grotesk
- Body: DM Sans
- Monospace: IBM Plex Mono

**UI Style:**
- Neobrutalist aesthetic (via RetroUI)
- 2px black borders
- 4px shadow offsets
- Full light/dark mode support
- Voice-first with prominent microphone controls

### Reusability Opportunities

- Use existing `AppShell.tsx` as layout template
- Use existing `ChatPanel.tsx` structure for chat interface
- Use existing `MapPanel.tsx` structure for map container
- Use existing `types.ts` as basis for Convex schema
- Use existing `tokens.css` for design system variables
- Reference `tailwind-colors.md` for Tailwind configuration

### Scope Boundaries

**In Scope:**
- Complete monorepo setup with pnpm workspaces
- Full Convex schema with all data model entities
- Clerk authentication (Google + email/password)
- Mapbox map with all 7+ ESRI layers
- Chat-first app shell with responsive layout
- Parcel click-to-chat interaction flow
- Document corpus setup with Gemini File Search
- Convex cron job ingestion pipeline
- Design system tokens and Tailwind configuration
- Light/dark mode theming

**Out of Scope:**
- Nothing explicitly deferred - all foundation elements included
- Future milestones (Conversational Interface, Agent Intelligence, etc.) are separate specs

### Technical Considerations

**Tech Stack:**
- Next.js 15 with App Router
- Convex for backend/database
- Clerk for authentication
- Mapbox GL JS for mapping
- ESRI ArcGIS REST services for Milwaukee data layers
- Gemini File Search for RAG
- Tailwind CSS for styling
- **RetroUI** (retroui.dev) for UI components
- pnpm for package management

**Integration Points:**
- Clerk <-> Convex user sync
- Mapbox <-> ESRI layer integration
- Gemini File Search <-> Document corpus
- Convex cron <-> External data sources

**ESRI Layer URLs (Milwaukee):**
- Base: `https://gis.milwaukee.gov/arcgis/rest/services/`
- Zoning: Layer 11
- Parcels/MPROP: Layer 2
- TIF Districts: Layer 8
- Opportunity Zones: Layer 9
- Historic Districts: Layer 17
- ARB Areas: Layer 1
