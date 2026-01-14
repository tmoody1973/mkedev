# Task Breakdown: Foundation Week 1 - MKE.dev Setup

## Overview
Total Tasks: 10 Task Groups | Estimated Duration: 5-7 Days

This breakdown establishes the complete technical foundation for MKE.dev, a voice-first AI-powered civic intelligence platform for Milwaukee. Tasks are organized by dependency order and specialization area.

---

## Task List

### Infrastructure Layer

#### Task Group 1: Monorepo & Project Structure
**Dependencies:** None

- [x] 1.0 Complete monorepo setup with pnpm workspaces
  - [x] 1.1 Initialize pnpm workspace at project root
    - Create `pnpm-workspace.yaml` with apps/* and packages/* patterns
    - Initialize root `package.json` with workspace scripts
  - [x] 1.2 Create `apps/web` Next.js 15 application
    - Use `create-next-app` with App Router, TypeScript, Tailwind, ESLint
    - Configure `next.config.ts` for transpilePackages
  - [x] 1.3 Create `apps/agents` placeholder directory
    - Add basic `package.json` for future agent system
    - Include README documenting future purpose
  - [x] 1.4 Configure shared TypeScript config at root
    - Create `tsconfig.base.json` with strict settings
    - Extend in each app's `tsconfig.json`
    - Configure path aliases for cross-package imports
  - [x] 1.5 Configure shared ESLint and Prettier configs
    - Create `.eslintrc.js` at root with Next.js and TypeScript rules
    - Create `.prettierrc` with consistent formatting
    - Add lint and format scripts to root package.json
  - [x] 1.6 Create `.env.local.example` with all required variables
    - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    - CLERK_SECRET_KEY
    - CONVEX_DEPLOYMENT
    - NEXT_PUBLIC_CONVEX_URL
    - NEXT_PUBLIC_MAPBOX_TOKEN
    - FIRECRAWL_API_KEY
    - GEMINI_API_KEY

**Acceptance Criteria:**
- `pnpm install` runs successfully from root
- `pnpm --filter web dev` starts Next.js development server
- TypeScript compilation works across workspaces
- ESLint and Prettier run from root with `pnpm lint` and `pnpm format`

---

### Design System Layer

#### Task Group 2: Tailwind & RetroUI Configuration
**Dependencies:** Task Group 1

- [x] 2.0 Complete design system setup
  - [x] 2.1 Configure Tailwind CSS with design tokens
    - Copy color palette from `product-plan/design-system/tailwind-colors.md`
    - Configure sky (primary), amber (secondary), stone (neutral) scales
    - Add neobrutalist shadow utilities (shadow-brutal: 4px 4px 0 black)
  - [x] 2.2 Initialize shadcn CLI and install RetroUI base
    - Run `npx shadcn@latest init` with New York style, Stone base color
    - Install RetroUI utils: `npx shadcn@latest add https://retroui.dev/r/utils.json`
  - [x] 2.3 Install core RetroUI components
    - Button, Card, Input, Badge, Avatar components
    - Verify neobrutalist styling (2px borders, 4px shadows)
  - [x] 2.4 Configure Google Fonts in layout
    - Archivo Black for headings (--font-head)
    - Space Grotesk for body (--font-sans)
    - IBM Plex Mono for code (--font-mono)
  - [x] 2.5 Set up light/dark mode theming
    - Configure CSS custom properties in globals.css
    - Set up `--primary`, `--secondary`, `--border`, `--background` variables
    - Add dark mode variants with `.dark` selector
    - Integrate with system preference detection

**Acceptance Criteria:**
- RetroUI components render with neobrutalist styling
- Fonts load correctly (visible in devtools Network tab)
- Dark mode toggle works and persists
- Tailwind IntelliSense shows custom colors and utilities

---

### Backend Layer

#### Task Group 3: Convex Backend Setup
**Dependencies:** Task Group 1

- [x] 3.0 Complete Convex backend initialization
  - [x] 3.1 Initialize Convex in apps/web
    - Run `npx convex dev` to create project
    - Configure Convex provider in app layout
  - [x] 3.2 Define `parcels` table schema
    - Fields: taxKey, address, city, state, zipCode, coordinates, lotSize
    - References: zoningDistrictId, incentiveZoneIds (array), areaPlanId (optional)
    - Optional: owner, assessedValue, landUse
    - Include createdAt/updatedAt timestamps
  - [x] 3.3 Define `zoningDistricts` table schema
    - Fields: code, name, category (enum), description, color
    - Nested: permittedUses (array), conditionalUses (array)
    - Nested: dimensionalStandards object (maxHeight, minLotSize, setbacks, etc.)
    - Include createdAt/updatedAt timestamps
  - [x] 3.4 Define `incentiveZones` table schema
    - Fields: name, type (tif/opportunity-zone/bid/nid enum), description
    - Fields: benefits (array), expirationDate (optional), boundaryGeojson (optional)
    - Include createdAt/updatedAt timestamps
  - [x] 3.5 Define `areaPlans` table schema
    - Fields: name, neighborhood, adoptedDate, summary
    - Fields: goals (array), landUseRecommendations (array)
    - Optional: documentUrl, boundaryGeojson
    - Include createdAt/updatedAt timestamps
  - [x] 3.6 Define `conversations` table schema
    - Fields: userId, title, starred (boolean)
    - Include createdAt/updatedAt timestamps
    - Index on userId for user queries
  - [x] 3.7 Define `messages` table schema
    - Fields: conversationId, role (user/assistant/system enum), content, timestamp
    - Optional: inputMode (text/voice), parcelId, cards (array of GenerativeCard)
    - Include createdAt/updatedAt timestamps
    - Index on conversationId
  - [x] 3.8 Define `documents` table schema
    - Fields: title, category (enum), sourceUrl, content, lastCrawled
    - Fields: status (active/stale/error enum), wordCount, pageCount (optional)
    - Include createdAt/updatedAt timestamps
    - Index on category and status

**Acceptance Criteria:**
- `npx convex dev` runs without schema errors
- All 7 tables visible in Convex dashboard
- Schema matches types from `product-plan/data-model/types.ts`
- Indexes created for foreign key relationships

---

### Authentication Layer

#### Task Group 4: Clerk Authentication Integration
**Dependencies:** Task Groups 1, 3

- [x] 4.0 Complete Clerk authentication setup
  - [x] 4.1 Install and configure Clerk
    - Install `@clerk/nextjs` package
    - Add ClerkProvider to app layout (wrapping ConvexProvider)
    - Configure publishable and secret keys in env
  - [x] 4.2 Enable authentication methods in Clerk Dashboard
    - Enable Google OAuth social login as primary
    - Enable email/password as secondary
    - Configure redirect URLs for development
  - [x] 4.3 Create protected routes middleware
    - Create `middleware.ts` at apps/web root
    - Protect all routes except public landing (if any)
    - Configure auth redirect behavior
  - [x] 4.4 Configure Clerk-Convex user sync webhook
    - Set up webhook endpoint in Convex for user creation/update
    - Map Clerk user ID to Convex user record
    - Handle user deletion events
  - [x] 4.5 Implement UserMenu component
    - Display user avatar (from Clerk)
    - Show user name on hover/expanded state
    - Include logout button with proper redirect
    - Follow RetroUI styling with neobrutalist borders

**Acceptance Criteria:**
- Google OAuth login flow completes successfully
- Email/password registration and login work
- Authenticated users synced to Convex
- UserMenu displays correct user info
- Logout redirects to appropriate page

---

### Map Integration Layer

#### Task Group 5: Mapbox Base Setup
**Dependencies:** Task Groups 1, 2

- [x] 5.0 Complete Mapbox foundation
  - [x] 5.1 Install and configure Mapbox GL JS
    - Install `mapbox-gl` and `@types/mapbox-gl`
    - Install `mapbox-gl-arcgis-featureserver` for ESRI integration
    - Add Mapbox CSS import
  - [x] 5.2 Create MapContainer component
    - Initialize map with Milwaukee center (43.0389, -87.9065)
    - Set appropriate zoom level (12-13) for city view
    - Configure map style (streets-v12 or custom)
    - Handle map load and error states
  - [x] 5.3 Create MapContext for state management
    - Store map instance reference
    - Track selected parcel ID
    - Track layer visibility states
    - Expose methods for programmatic map control
  - [x] 5.4 Write 2-4 focused tests for map initialization
    - Test map renders without errors
    - Test initial center coordinates are correct
    - Test map context provides required values

**Acceptance Criteria:**
- Map renders centered on Milwaukee
- Map is interactive (pan, zoom work)
- MapContext accessible throughout app
- Tests pass for critical map behaviors

---

#### Task Group 6: ESRI Layer Integration
**Dependencies:** Task Group 5

- [x] 6.0 Complete ESRI layer integration
  - [x] 6.1 Integrate Zoning Districts layer (Layer 11)
    - Connect to `gis.milwaukee.gov/arcgis/rest/services/` Layer 11
    - Apply category-based color coding (residential, commercial, industrial, mixed-use, special)
    - Enable hover tooltip with zone code
  - [x] 6.2 Integrate Parcels/MPROP layer (Layer 2)
    - Connect to Layer 2 feature server
    - Configure click interaction (highlight selected)
    - Set up parcel data extraction on click
  - [x] 6.3 Integrate TIF Districts overlay (Layer 8)
    - Connect to Layer 8 with semi-transparent fill
    - Add distinct border color for visibility
    - Default to visible off
  - [x] 6.4 Integrate Opportunity Zones overlay (Layer 9)
    - Connect to Layer 9 with contrasting fill color
    - Default to visible off
  - [x] 6.5 Integrate Historic Districts overlay (Layer 17)
    - Connect to Layer 17 with heritage color palette
    - Default to visible off
  - [x] 6.6 Integrate ARB Areas overlay (Layer 1)
    - Connect to Layer 1 (Architectural Review Board)
    - Default to visible off
  - [x] 6.7 Integrate City-Owned Lots layer
    - Connect to govt_owned MapServer
    - Use distinctive fill color for municipal properties
    - Default to visible off

**Acceptance Criteria:**
- All 7 layers load from ESRI REST services
- Zoning layer displays with category colors
- Parcels layer supports click interaction
- Overlay layers toggle on/off correctly

---

#### Task Group 7: Layer Controls Panel
**Dependencies:** Task Group 6

- [x] 7.0 Complete layer controls UI
  - [x] 7.1 Create LayerPanel component structure
    - Collapsible panel with expand/collapse toggle
    - Reference `product-plan/sections/geospatial-explorer/components/LayerPanel.tsx`
    - Position fixed on right side of map
    - Apply neobrutalist styling (2px borders, shadows)
  - [x] 7.2 Implement layer count indicator
    - Display "X of Y active" in panel header
    - Update count reactively as layers toggle
  - [x] 7.3 Implement per-layer visibility toggle
    - Eye/EyeOff icon toggle for each layer
    - Trigger map layer visibility change
    - Visual feedback for active/inactive state
  - [x] 7.4 Implement per-layer opacity slider
    - Range slider 0-100%
    - Apply opacity to corresponding map layer
    - Show current percentage value
  - [x] 7.5 Add color swatch and legend items
    - Color indicator matching layer fill/stroke
    - Layer name label
    - Optional: legend items for categorical layers (zoning)
  - [x] 7.6 Write 2-4 focused tests for layer controls
    - Test panel expands and collapses
    - Test visibility toggle updates layer count
    - Test layer visibility state changes

**Acceptance Criteria:**
- LayerPanel expands/collapses smoothly
- Layer count updates correctly
- Toggle visibility shows/hides map layers
- Opacity slider adjusts layer transparency
- Tests pass for critical interactions

---

### Frontend Application Layer

#### Task Group 8: App Shell & Layout
**Dependencies:** Task Groups 2, 4, 5

- [x] 8.0 Complete application shell
  - [x] 8.1 Create AppShell layout component
    - Reference `product-plan/shell/components/AppShell.tsx`
    - 40% width chat panel (left), 60% width map panel (right)
    - Use flexbox with md:w-2/5 and md:w-3/5 breakpoints
    - Apply neobrutalist border between panels
  - [x] 8.2 Implement mobile responsive layout
    - Stacked layout with chat primary on mobile
    - Map as collapsible overlay or secondary view
    - Touch-friendly toggle for map visibility
  - [x] 8.3 Create Header component
    - Reference `product-plan/shell/components/Header.tsx`
    - MKE.dev logo (left)
    - Voice toggle button (placeholder - Week 2)
    - Layers button triggering LayerPanel
    - UserMenu component (right)
    - Apply translate-y hover effects per reference
  - [x] 8.4 Integrate providers in app layout
    - ClerkProvider wrapping ConvexProvider wrapping app
    - MapContext provider wrapping main content
    - ThemeProvider for dark mode support
  - [x] 8.5 Write 2-4 focused tests for app shell
    - Test shell renders with both panels
    - Test header displays user info when authenticated
    - Test responsive layout switches at breakpoint

**Acceptance Criteria:**
- Desktop shows 40/60 split layout
- Mobile shows stacked layout with chat primary
- Header displays all required elements
- Providers properly nested in layout
- Tests pass for critical layout behaviors

---

#### Task Group 9: Chat Panel Component
**Dependencies:** Task Groups 8, 4

- [x] 9.0 Complete chat panel UI
  - [x] 9.1 Create ChatPanel container component
    - Reference `product-plan/shell/components/ChatPanel.tsx`
    - Flex column layout with message area and input area
    - Apply neobrutalist styling throughout
  - [x] 9.2 Implement empty state display
    - Large microphone icon (centered)
    - "Hey MKE, what can I build?" prompt text
    - Subtle animation or visual interest
  - [x] 9.3 Implement message list rendering
    - User messages: sky-500 background, right-aligned or left with user indicator
    - Assistant messages: white (light) / stone-800 (dark) background
    - Timestamp display
    - Auto-scroll to latest message
  - [x] 9.4 Implement loading indicator
    - Animated bouncing dots pattern
    - Display during AI response generation
    - Accessible loading announcement
  - [x] 9.5 Create chat input area
    - Text input field with RetroUI styling
    - Voice input button (amber-400) - placeholder for Week 2
    - Send button (sky-500) with arrow icon
    - Submit on Enter key
  - [x] 9.6 Add uiComponent slot for generative cards
    - Message type supports cards array
    - Render placeholder for card components (Week 2)
    - Proper spacing between text and cards
  - [x] 9.7 Write 2-4 focused tests for chat panel
    - Test empty state renders correctly
    - Test messages display with correct styling by role
    - Test input submission triggers callback

**Acceptance Criteria:**
- Empty state displays with prompt
- Messages render with role-based styling
- Input area submits text correctly
- Loading indicator appears during processing
- Tests pass for critical chat behaviors

---

#### Task Group 10: Parcel Click Interaction
**Dependencies:** Task Groups 6, 9

- [x] 10.0 Complete parcel interaction flow
  - [x] 10.1 Implement parcel highlight on click
    - Distinct border color (e.g., sky-500)
    - Elevated fill opacity
    - Clear previous selection on new click
  - [x] 10.2 Create parcel popup component
    - Display address
    - Display tax key
    - Display zoning code
    - Apply neobrutalist styling to popup
    - Close button or click-away to dismiss
  - [x] 10.3 Implement parcel context to chat
    - On parcel click, populate chat input with parcel address
    - OR trigger automatic query: "Tell me about [address]"
    - Pass parcel ID to message context
  - [x] 10.4 Store selected parcel in MapContext
    - Update selectedParcelId on click
    - Clear on map click outside parcels
    - Expose getter for other components
  - [x] 10.5 Write 2-4 focused tests for parcel interaction
    - Test parcel click updates selected state
    - Test popup displays parcel info
    - Test chat receives parcel context

**Acceptance Criteria:**
- Clicked parcel visually highlighted on map
- Popup shows address, tax key, zoning code
- Chat input receives parcel context
- Selected parcel tracked in MapContext
- Tests pass for critical interactions

---

### Data Pipeline Layer

#### Task Group 11: Document Ingestion Setup
**Dependencies:** Task Group 3

- [x] 11.0 Complete document ingestion infrastructure
  - [x] 11.1 Configure Firecrawl API connection
    - Install firecrawl-js SDK
    - Create Convex action for Firecrawl API calls
    - Set up API key in environment
    - Test connection with sample URL
  - [x] 11.2 Set up Gemini File Search for PDF RAG
    - Configure Gemini API with File Search capability
    - Create document upload action for PDFs
    - Test with sample PDF document
  - [x] 11.3 Create Convex cron job schedule
    - Define cron schedule for automated refresh (e.g., daily)
    - Create cron handler function
    - Configure which sources to refresh
  - [x] 11.4 Implement manual trigger action
    - Create Convex action for on-demand ingestion
    - Accept source URL or document ID parameter
    - Return status and any errors
  - [x] 11.5 Define initial corpus targets
    - Zoning Code PDF (Gemini File Search)
    - Housing Element PDF (Gemini File Search)
    - Neighborhood plans (Firecrawl)
    - Incentive documentation (Firecrawl)
    - Document target URLs in configuration

**Acceptance Criteria:**
- Firecrawl API connection established
- Gemini File Search configured for PDFs
- Cron job defined and schedulable
- Manual trigger action callable
- Initial corpus targets documented

---

### Integration & Verification

#### Task Group 12: End-to-End Integration & Test Review
**Dependencies:** Task Groups 1-11

- [x] 12.0 Verify complete foundation integration
  - [x] 12.1 Review all tests from previous task groups
    - Review 2-4 tests from Task 5.4 (Map initialization)
    - Review 2-4 tests from Task 7.6 (Layer controls)
    - Review 2-4 tests from Task 8.5 (App shell)
    - Review 2-4 tests from Task 9.7 (Chat panel)
    - Review 2-4 tests from Task 10.5 (Parcel interaction)
    - Total existing tests: approximately 10-20 tests
  - [x] 12.2 Identify critical integration gaps
    - Focus on cross-component integration points
    - Authentication flow through to Convex
    - Map-to-chat parcel context flow
    - Do NOT assess unrelated application areas
  - [x] 12.3 Write up to 10 additional integration tests if needed
    - Authenticated user can view map and chat
    - Parcel click flows through to chat panel
    - Layer toggle persists across components
    - Focus on end-to-end user workflows only
  - [x] 12.4 Run all foundation-specific tests
    - Run only tests related to Foundation Week 1 features
    - Expected total: approximately 20-30 tests maximum
    - Do NOT run unrelated test suites
  - [x] 12.5 Verify development environment completeness
    - All environment variables documented in .env.local.example
    - `pnpm dev` starts all required services
    - No console errors in browser
    - Convex dev server connects successfully

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 20-30 tests total)
- Authentication flow works end-to-end
- Map and chat panels communicate correctly
- Layer controls affect map display
- No more than 10 additional integration tests added
- Development environment fully functional

---

## Execution Order

Recommended implementation sequence accounting for dependencies:

```
Phase 1: Infrastructure (Days 1-2)
|-- Task Group 1: Monorepo & Project Structure
|-- Task Group 2: Tailwind & RetroUI Configuration (parallel after 1)
|-- Task Group 3: Convex Backend Setup (parallel after 1)

Phase 2: Authentication & Map Base (Days 2-3)
|-- Task Group 4: Clerk Authentication (after 1, 3)
|-- Task Group 5: Mapbox Base Setup (after 1, 2)

Phase 3: Map Features (Days 3-4)
|-- Task Group 6: ESRI Layer Integration (after 5)
|-- Task Group 7: Layer Controls Panel (after 6)

Phase 4: Application UI (Days 4-5)
|-- Task Group 8: App Shell & Layout (after 2, 4, 5)
|-- Task Group 9: Chat Panel Component (after 8)
|-- Task Group 10: Parcel Click Interaction (after 6, 9)

Phase 5: Data & Integration (Days 5-7)
|-- Task Group 11: Document Ingestion Setup (after 3)
|-- Task Group 12: End-to-End Integration & Test Review (after all)
```

---

## Dependencies Graph

```
1 (Monorepo)
├── 2 (Design System)
├── 3 (Convex)
│   ├── 4 (Clerk Auth)
│   └── 11 (Document Ingestion)
└── 5 (Mapbox Base)
    └── 6 (ESRI Layers)
        └── 7 (Layer Controls)
        └── 10 (Parcel Interaction)

2 + 4 + 5 → 8 (App Shell)
8 → 9 (Chat Panel)
6 + 9 → 10 (Parcel Interaction)

All → 12 (Integration)
```

---

## Reference Files

**Product Plan Components (templates):**
- `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/shell/components/AppShell.tsx`
- `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/shell/components/ChatPanel.tsx`
- `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/shell/components/Header.tsx`
- `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/sections/geospatial-explorer/components/LayerPanel.tsx`

**Data Model Reference:**
- `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/data-model/types.ts`

**Design System Reference:**
- `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/design-system/tokens.css`
- `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/design-system/tailwind-colors.md`
- `/Users/tarikmoody/Documents/Projects/mkedev/product-plan/design-system/fonts.md`

---

## Out of Scope Reminders

The following are explicitly NOT part of Foundation Week 1:
- Voice interface (Gemini Live API - Week 2)
- Generative UI cards (CopilotKit - Week 2)
- Conversation history sidebar
- Address search/geocoding
- 2D/3D view toggle
- Parcel feasibility analysis
- Architectural visualization
- Multi-agent orchestration (Google ADK)
- LLM observability (Comet/Opik)
- User preferences persistence
- Production deployment
