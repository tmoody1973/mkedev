# MKE.dev Project Guidelines

## Project Overview

**MKE.dev** is a voice-first, AI-powered civic intelligence platform for Milwaukee. It democratizes access to civic development information through conversational AI, interactive maps, and architectural visualization.

**Hackathon:** Gemini 3 Hackathon (Deadline: February 10, 2026)

**Core Innovation:** Voice-First (Gemini Live) + Vision-Native (Nano Banana) Civic AI

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router, React 19) |
| UI Components | RetroUI (retroui.dev) - Neobrutalist |
| Styling | Tailwind CSS 3.4 |
| Backend | Convex (real-time database + serverless) |
| Auth | Clerk (Google OAuth + email/password) |
| Maps | Mapbox GL JS 3.x + ESRI ArcGIS REST |
| AI/LLM | Google Gemini 3, Gemini Live API |
| Vision | Gemini 2.5 Flash Image (Nano Banana) |
| Agents | Google ADK |
| Generative UI | CopilotKit (AG-UI protocol) |
| Observability | Comet/Opik, Sentry |
| Package Manager | pnpm |

---

## Monorepo Structure

```
mkedev/
├── apps/
│   ├── web/                 # Next.js 15 application
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities
│   │   └── convex/          # Convex schema & functions
│   └── agents/              # Google ADK agent system
├── packages/                # Shared packages (future)
├── agent-os/                # Specs, tasks, product docs
│   ├── product/             # Mission, roadmap, tech-stack
│   ├── specs/               # Feature specifications
│   └── standards/           # Coding standards
├── product-plan/            # Reference components & design
└── research/                # PRD and research docs
```

---

## Code Style

### TypeScript
- **Strict mode** enabled
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `const` over `let`, never use `var`
- Use explicit return types on exported functions
- No `any` - use `unknown` and narrow types

### Naming Conventions
```typescript
// Components: PascalCase
export function ChatPanel() {}

// Files: kebab-case for components, camelCase for utilities
// components/chat-panel.tsx
// lib/mapUtils.ts

// Convex tables: camelCase plural
// parcels, zoningDistricts, incentiveZones

// Types/Interfaces: PascalCase
interface Parcel {}
type ZoningCategory = 'residential' | 'commercial' | 'industrial'

// Constants: SCREAMING_SNAKE_CASE
const MILWAUKEE_CENTER = [-87.9065, 43.0389]
```

### Imports Order
```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External packages
import { useQuery } from 'convex/react'
import mapboxgl from 'mapbox-gl'

// 3. Internal packages/components
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'

// 4. Types (if separate)
import type { Parcel } from '@/types'

// 5. Styles
import './styles.css'
```

---

## RetroUI Component Patterns

### Installation
```bash
# Add components via shadcn CLI
npx shadcn@latest add 'https://retroui.dev/r/button.json'
npx shadcn@latest add 'https://retroui.dev/r/card.json'
npx shadcn@latest add 'https://retroui.dev/r/input.json'
```

### Neobrutalist Styling Rules
```css
/* Always use these for RetroUI components */
border: 2px solid black;           /* Light mode */
border: 2px solid white;           /* Dark mode */
box-shadow: 4px 4px 0 black;       /* Light mode */
box-shadow: 4px 4px 0 white;       /* Dark mode */

/* Hover states - translate shadow */
transform: translate(-2px, -2px);
box-shadow: 6px 6px 0 black;

/* Active states - flatten */
transform: translate(2px, 2px);
box-shadow: 2px 2px 0 black;
```

### Color Usage
```typescript
// Primary actions (buttons, links, accents)
className="bg-sky-500 hover:bg-sky-600"

// Secondary/highlights (tags, badges)
className="bg-amber-400 hover:bg-amber-500"

// Neutral (backgrounds, text, borders)
className="bg-stone-100 dark:bg-stone-800"
className="text-stone-900 dark:text-stone-100"
className="border-stone-300 dark:border-stone-600"
```

### Typography
```typescript
// Headings - Archivo Black or Space Grotesk
className="font-head text-2xl font-bold"

// Body - Space Grotesk or DM Sans
className="font-sans text-base"

// Code/monospace - IBM Plex Mono
className="font-mono text-sm"
```

---

## Convex Patterns

### Schema Definition
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  parcels: defineTable({
    taxKey: v.string(),
    address: v.string(),
    coordinates: v.array(v.number()), // [lng, lat]
    lotSize: v.number(),
    zoningDistrictId: v.id('zoningDistricts'),
    incentiveZoneIds: v.array(v.id('incentiveZones')),
    areaPlanId: v.optional(v.id('areaPlans')),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_taxKey', ['taxKey']),
})
```

### Query Pattern
```typescript
// convex/parcels.ts
import { query } from './_generated/server'
import { v } from 'convex/values'

export const getByTaxKey = query({
  args: { taxKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('parcels')
      .withIndex('by_taxKey', (q) => q.eq('taxKey', args.taxKey))
      .first()
  },
})
```

### Mutation Pattern
```typescript
// convex/parcels.ts
import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    taxKey: v.string(),
    address: v.string(),
    // ... other fields
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('parcels', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})
```

### Action Pattern (External APIs)
```typescript
// convex/esri.ts
import { action } from './_generated/server'
import { v } from 'convex/values'

export const fetchZoningLayer = action({
  args: { bounds: v.array(v.number()) },
  handler: async (ctx, args) => {
    const response = await fetch(
      `https://gis.milwaukee.gov/arcgis/rest/services/.../MapServer/11/query?...`
    )
    return await response.json()
  },
})
```

### Cron Job Pattern
```typescript
// convex/crons.ts
import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.daily(
  'refresh-documents',
  { hourUTC: 6, minuteUTC: 0 },
  internal.documents.refreshCorpus
)

export default crons
```

---

## Mapbox + ESRI Integration

### Map Initialization
```typescript
const MILWAUKEE_CENTER: [number, number] = [-87.9065, 43.0389]
const DEFAULT_ZOOM = 12

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: MILWAUKEE_CENTER,
  zoom: DEFAULT_ZOOM,
})
```

### ESRI Layer URLs
```typescript
const ESRI_BASE = 'https://gis.milwaukee.gov/arcgis/rest/services'

const LAYERS = {
  zoning: `${ESRI_BASE}/planning/zoning/MapServer/11`,
  parcels: `${ESRI_BASE}/lmi/parcels_mprop/MapServer/2`,
  tif: `${ESRI_BASE}/planning/special_districts/MapServer/8`,
  opportunityZones: `${ESRI_BASE}/planning/special_districts/MapServer/9`,
  historic: `${ESRI_BASE}/planning/special_districts/MapServer/17`,
  arb: `${ESRI_BASE}/planning/special_districts/MapServer/1`,
  cityOwned: `${ESRI_BASE}/planning/govt_owned/MapServer`,
}
```

### Parcel Click Handler
```typescript
map.on('click', 'parcels-layer', (e) => {
  const feature = e.features?.[0]
  if (!feature) return

  const { taxkey, address, zoning } = feature.properties

  // Highlight parcel
  map.setFeatureState(
    { source: 'parcels', id: feature.id },
    { selected: true }
  )

  // Show popup
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`<strong>${address}</strong><br/>Zone: ${zoning}`)
    .addTo(map)

  // Send to chat context
  setSelectedParcel({ taxkey, address, zoning })
})
```

---

## Clerk Authentication

### Provider Setup
```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from 'convex/react-clerk'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
```

### Protected Routes
```typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

---

## Testing Approach

### Focus on Critical Paths
- **2-4 unit tests** per critical component
- **Max 10 integration tests** total for Foundation
- Test user flows, not implementation details

### What to Test
- Convex schema validation
- Authentication flows
- Map layer loading
- Parcel click → chat context flow

### What NOT to Test
- RetroUI component internals
- Mapbox GL internals
- Third-party API responses (mock them)

---

## File Organization

### Component Files
```
components/
├── ui/                    # RetroUI components
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── layout/                # Layout components
│   ├── app-shell.tsx
│   ├── header.tsx
│   └── user-menu.tsx
├── map/                   # Map components
│   ├── map-view.tsx
│   ├── layer-panel.tsx
│   └── parcel-popup.tsx
└── chat/                  # Chat components
    ├── chat-panel.tsx
    ├── message-list.tsx
    └── chat-input.tsx
```

### Convex Files
```
convex/
├── schema.ts              # All table definitions
├── parcels.ts             # Parcel queries/mutations
├── conversations.ts       # Chat queries/mutations
├── documents.ts           # RAG document operations
├── esri.ts                # ESRI API actions
├── crons.ts               # Scheduled jobs
└── _generated/            # Auto-generated (don't edit)
```

---

## Document Corpus (Gemini File Search)

PDFs for RAG are stored in `data/` folder:

```
data/
├── zoning-code-pdfs/           # Milwaukee Zoning Code (Chapter 295)
│   ├── CH295-sub1.pdf          # Introduction
│   ├── CH295-sub2.pdf          # Definitions
│   ├── CH295-sub3.pdf          # Zoning Map
│   ├── CH295-sub4.pdf          # General Provisions
│   ├── CH295-sub5.pdf          # Residential Districts
│   ├── CH295-sub6.pdf          # Commercial Districts
│   ├── CH295-sub7.pdf          # Downtown Districts
│   ├── CH295-sub8.pdf          # Industrial Districts
│   ├── CH295-sub9.pdf          # Special Districts
│   ├── CH295-sub10.pdf         # Overlay Zones
│   ├── CH295-sub11.pdf         # Additional Regulations
│   └── CH295table.pdf          # Zoning Tables
└── plans/                      # City Plans
    ├── Housing-Element-*.pdf   # Housing Element Plan
    └── Citywide.pdf            # Citywide Plan
```

**Note:** More documents will be added during development. All PDFs in `data/` are candidates for Gemini File Search upload.

---

## Environment Variables

```bash
# .env.local.example

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Convex
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=https://...

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.ey...

# Google AI
GOOGLE_GEMINI_API_KEY=...

# Firecrawl
FIRECRAWL_API_KEY=...

# Opik (LLM Observability)
OPIK_API_KEY=...
OPIK_WORKSPACE=...
OPIK_PROJECT_NAME=mkedev-civic-ai

# Sentry (configured in next.config.ts, DSN hardcoded in config files)
SENTRY_AUTH_TOKEN=...  # For source map uploads in CI
```

---

## Out of Scope (Week 1)

DO NOT implement these in Foundation Week 1:
- Voice interface (Gemini Live API) → Week 2
- Agent system in apps/agents → Week 2
- Generative UI cards (CopilotKit) → Week 2
- Conversation history sidebar
- Address search/geocoding
- 2D/3D view toggle
- Feasibility analysis
- Architectural visualization (Nano Banana)
- LLM observability (Comet/Opik)
- Production deployment

---

## Progress Tracking

### Commands

| Command | Purpose |
|---------|---------|
| `/dev-diary` | Create manual devlog entry (summary, milestone) |
| `/plane-sync` | Sync tasks with Plane.so |
| `/plane-sync init` | Initialize Plane project |
| `/plane-sync status` | Show sync status |

### Devlog (devlog.md)

The devlog tracks development progress with:
- **Auto entries**: Logged when tasks are completed via `/implement-tasks`
- **Manual entries**: Created via `/dev-diary` for summaries and milestones

Entry types:
- **Task Completion**: Individual task done
- **Daily Summary**: End-of-day recap
- **Milestone**: Phase/group completion

### Plane.so Integration

Sync with Plane for visual sprint management:
- Task groups → Work Items
- Individual tasks → Checklists
- Status synced bidirectionally

---

## Specialized Agents

### mapbox-esri-layer-builder
Use this agent when building map features that integrate Esri data with Mapbox. This agent has specialized knowledge for:

- Adding ArcGIS feature services to Mapbox maps
- Converting Esri data formats for Mapbox consumption
- Styling map layers with proper symbology
- Implementing geospatial visualizations
- Handling Milwaukee's ESRI REST services

**When to use:**
```
/task mapbox-esri-layer-builder "Add the zoning districts layer from Milwaukee ESRI"
/task mapbox-esri-layer-builder "Style the TIF districts with proper color coding"
/task mapbox-esri-layer-builder "Implement parcel click interaction with popup"
```

**Trigger phrases:**
- "Add ESRI layer to map"
- "Integrate ArcGIS service"
- "Style map layer"
- "Build mapping feature"
- Any task involving Milwaukee GIS data + Mapbox

---

## Opik (LLM Observability)

### Overview
All LLM agents in this project are instrumented with [Opik](https://www.comet.com/docs/opik) for observability, tracing, and evaluation. Opik captures:
- Agent interactions (traces)
- LLM calls with token usage (spans)
- Tool executions with timing
- Errors and success/failure status

### Configuration
Set these environment variables to enable Opik:
```bash
OPIK_API_KEY=your-api-key          # Get from comet.com/opik
OPIK_WORKSPACE=your-workspace      # Optional
OPIK_PROJECT_NAME=mkedev-civic-ai  # Project name in Opik dashboard
```

If `OPIK_API_KEY` is not set, tracing is silently disabled (no errors).

### Usage in Convex Actions
Import the trace manager utility:
```typescript
import { createTraceManager } from "../lib/opik";

export const myAction = action({
  handler: async (ctx, args) => {
    const tracer = createTraceManager();

    // Start trace
    tracer.startTrace({
      name: "my-agent-action",
      input: { message: args.message },
      tags: ["agent", "gemini"],
    });

    try {
      // Start span for LLM call
      const llmSpanId = tracer.startSpan({
        name: "llm-call",
        input: { prompt: "..." },
      });

      // Make LLM call...
      const result = await callLLM();

      // End span with output
      tracer.endSpan(llmSpanId, {
        output: { response: result },
        usage: { promptTokens: 100, completionTokens: 50 },
        model: "gemini-3-flash-preview",
        provider: "google",
      });

      // Log tool execution
      tracer.logToolExecution(
        { name: "geocode_address", args: { address: "500 N Water St" } },
        { result: { lat: 43.04, lng: -87.91 }, durationMs: 150 }
      );

      // End trace with final output
      await tracer.endTrace({ response: result, success: true });

      return result;
    } catch (error) {
      await tracer.endTrace({ error: error.message, success: false });
      throw error;
    }
  },
});
```

### Viewing Traces
1. Go to [comet.com/opik](https://comet.com/opik)
2. Select your workspace and project
3. View traces, spans, and metrics in the dashboard

### Adding Feedback Scores
For evaluation metrics (e.g., hallucination detection):
```typescript
tracer.addScore("hallucination", 0.1, "Response grounded in sources");
tracer.addScore("relevance", 0.95, "Directly answers user question");
```

---

## Sentry (Error & Performance Monitoring)

### Overview
Sentry is configured for error tracking, performance monitoring, and logging across the Next.js application.

### Configuration Files
- `instrumentation-client.ts` - Client-side initialization (browser)
- `sentry.server.config.ts` - Server-side initialization (Node.js)
- `sentry.edge.config.ts` - Edge runtime initialization
- `next.config.ts` - Wrapped with `withSentryConfig`

### Exception Catching
Use `Sentry.captureException(error)` to capture exceptions in try-catch blocks:
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  // Handle error...
}
```

### Custom Span Instrumentation

#### Component Actions (UI Events)
Create spans for meaningful user interactions:
```typescript
import * as Sentry from "@sentry/nextjs";

function ParcelCard() {
  const handleClick = () => {
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Parcel Card Click",
      },
      (span) => {
        span.setAttribute("taxKey", parcel.taxKey);
        span.setAttribute("zoning", parcel.zoning);

        selectParcel(parcel);
      },
    );
  };

  return <Card onClick={handleClick}>...</Card>;
}
```

#### API Calls
Wrap fetch calls with spans:
```typescript
async function fetchParcelData(taxKey: string) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/parcels/${taxKey}`,
    },
    async () => {
      const response = await fetch(`/api/parcels/${taxKey}`);
      const data = await response.json();
      return data;
    },
  );
}
```

### Logging
Use the Sentry logger for structured logs that appear in Sentry:
```typescript
import * as Sentry from "@sentry/nextjs";

const { logger } = Sentry;

// Different severity levels
logger.trace("Starting map initialization", { center: MILWAUKEE_CENTER });
logger.debug(logger.fmt`Cache miss for parcel: ${taxKey}`);
logger.info("User selected parcel", { taxKey, address });
logger.warn("Rate limit approaching", { endpoint: "/api/chat", remaining: 5 });
logger.error("Failed to load ESRI layer", { layerId, errorCode: 500 });
logger.fatal("Database connection lost", { service: "convex" });
```

**Note:** Use `logger.fmt` template literals to bring variables into structured logs.

### Best Practices
- Create spans for meaningful actions (button clicks, API calls, critical functions)
- Use descriptive `name` and `op` properties
- Attach relevant attributes to spans for debugging context
- Lower `tracesSampleRate` in production (currently set to 1.0 for dev)
- Don't spam logs - use appropriate severity levels

---

## MCP Servers

### CopilotKit MCP (REQUIRED for CopilotKit work)
**ALWAYS use the CopilotKit MCP tools when working with CopilotKit features.** This ensures you have access to the latest documentation, patterns, and code examples.

**Available Tools:**
- `mcp__copilotkit-mcp__search-docs` - Search CopilotKit documentation for concepts, APIs, and guides
- `mcp__copilotkit-mcp__search-code` - Search CopilotKit code examples and implementation patterns

**When to use:**
- Before implementing any CopilotKit feature (Generative UI, AG-UI protocol, CoAgents)
- When configuring CopilotKit providers or hooks
- When building copilot actions or render functions
- When integrating CopilotKit with Convex or other backends
- When troubleshooting CopilotKit behavior

**Workflow:**
1. **First**: Use `search-docs` to understand the concept/API
2. **Then**: Use `search-code` to find implementation examples
3. **Finally**: Implement following the patterns from the MCP results

**Example queries:**
```
# Documentation searches
search-docs: "useCopilotAction hook"
search-docs: "AG-UI protocol setup"
search-docs: "CopilotKit with Next.js App Router"
search-docs: "generative UI components"

# Code searches
search-code: "useCopilotReadable example"
search-code: "CopilotKit provider configuration"
search-code: "render function patterns"
```

**Important:** CopilotKit is rapidly evolving. Documentation and examples from the MCP are more current than training data. Always verify patterns against MCP results before implementing.

---

## Quick Reference

### Git Commands
```bash
/git-push                    # Auto-generate commit message and push
/git-push "message"          # Push with custom commit message
```

**Repository:** https://github.com/tmoody1973/mkedev

### Run Development
```bash
pnpm dev           # Start Next.js dev server
pnpm convex dev    # Start Convex dev server (separate terminal)
```

### Add RetroUI Component
```bash
npx shadcn@latest add 'https://retroui.dev/r/[component].json'
```

### Generate Convex Types
```bash
pnpm convex dev    # Auto-generates types on schema change
```

### Key Docs
- RetroUI: https://retroui.dev/docs
- Convex: https://docs.convex.dev
- Clerk + Convex: https://docs.convex.dev/auth/clerk
- Mapbox GL JS: https://docs.mapbox.com/mapbox-gl-js
- Milwaukee GIS: https://gis.milwaukee.gov/arcgis/rest/services
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
