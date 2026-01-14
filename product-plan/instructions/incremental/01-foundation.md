# Milestone 01 — Foundation

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

## Foundation Setup

This milestone establishes the project foundation: design tokens, data model types, routing structure, and the application shell.

### 1. Design Tokens

Set up the design system tokens in your Tailwind/CSS configuration.

**Colors (Tailwind palette names):**
- **Primary:** `sky` — Used for buttons, links, key accents
- **Secondary:** `amber` — Used for tags, highlights, secondary elements
- **Neutral:** `stone` — Used for backgrounds, text, borders

**Typography (Google Fonts):**
- **Heading:** Space Grotesk
- **Body:** DM Sans
- **Mono:** IBM Plex Mono

**UI Style:**
- Neobrutalist design: 2px black borders, 4px shadow offsets
- Full light/dark mode support
- Voice-first with prominent microphone controls

### 2. Data Model Types

Implement TypeScript interfaces for all core entities. See `data-model/types.ts` for the complete type definitions.

**Core Entities:**
- `Parcel` — A specific piece of property identified by a tax key
- `ZoningDistrict` — A classification defining permitted uses and dimensional standards
- `IncentiveZone` — A geographic area offering financial incentives (TIF, Opportunity Zone, etc.)
- `AreaPlan` — A neighborhood-specific planning document
- `Conversation` — A chat session between user and platform
- `Query` — A single question or request within a conversation
- `FeasibilityReport` — A generated analysis synthesizing zoning, incentives, and requirements
- `ArchitecturalPreview` — A photorealistic visualization of a proposed building
- `Document` — A source file in the knowledge base for RAG-powered responses

**Key Relationships:**
- Parcel belongs to one ZoningDistrict
- Parcel can be within multiple IncentiveZones
- Parcel can be covered by one AreaPlan
- Conversation contains many Queries
- Query can reference a Parcel
- FeasibilityReport is generated for a Parcel
- ArchitecturalPreview belongs to a Conversation

### 3. Routing Structure

This application uses a **non-traditional navigation pattern**. Users interact through the Conversational Interface, and the map updates based on queries. There are no separate "pages" for sections.

**Shell Layout:**
- Split view: Chat panel (40%) on the left, Map panel (60%) on the right
- Single-page application with overlay panels and modals

**Routes to implement:**
- `/` — Main application (shell with chat + map)
- `/admin/knowledge-base` — Knowledge Base dashboard (admin-only, if separate)

### 4. Application Shell

Implement the shell layout from `shell/` components.

**Header Bar:**
- Logo (left): MKE.dev wordmark, clicking resets/returns to home state
- Voice Toggle (center-right): Microphone button with active state indicator
- Map Layers (center-right): Button to open layer selection panel overlay
- User Menu (right): Avatar with dropdown for user name and logout

**Split View Layout:**
- Desktop (1024px+): Side-by-side split, chat 40% / map 60%
- Tablet (768px-1023px): Same split at 50/50
- Mobile (<768px): Stacked layout — Map on top (collapsible), Chat on bottom (primary)

**Panels and Overlays:**
- Map Layers Panel: Slide-out or modal for toggling data layers
- Parcel Details: Click a parcel on the map to see enriched data in a card
- Generated Visualizations: Architectural previews appear as cards in chat

---

## Files to Reference

- `design-system/` — Tokens, colors, fonts
- `data-model/` — Entity types and sample data
- `shell/` — Shell components (Header, SplitLayout)

## Success Criteria

- [ ] Design tokens configured (colors, typography, neobrutalist styling)
- [ ] Data model types implemented
- [ ] Shell layout renders with chat/map split view
- [ ] Header with logo, voice toggle, layers button, user menu
- [ ] Responsive breakpoints working (desktop/tablet/mobile)
- [ ] Light/dark mode toggle functional
