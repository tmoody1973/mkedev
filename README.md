# MKE.dev

> Voice-First AI-Powered Civic Intelligence Platform for Milwaukee

![Node](https://img.shields.io/badge/node-20%2B-green)
![pnpm](https://img.shields.io/badge/pnpm-9%2B-orange)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![License](https://img.shields.io/badge/license-MIT-blue)

**Gemini 3 Hackathon Entry** | Deadline: February 10, 2026

---

## Overview

MKE.dev democratizes access to Milwaukee's civic development information by transforming complex zoning codes, financial incentives, and regulatory data into a single, intuitive, voice-first conversational experience.

### Key Features

- **Voice-First Interface** - Real-time bidirectional voice conversations powered by Gemini Live API
- **Interactive Map** - Mapbox GL JS with 7 Milwaukee ESRI data layers (zoning, parcels, TIF, opportunity zones, historic districts, ARB, city-owned)
- **AI Chat** - Context-aware conversations about zoning, permits, and development opportunities
- **High-Performance Tiles** - PMTiles served from Cloudflare R2 for instant map rendering
- **Accessibility** - WCAG 2.1 AA compliant, fully navigable by voice

### Target Users

- **Homeowners** exploring ADUs or renovations
- **Developers** scouting opportunities and analyzing incentives
- **Architects** verifying dimensional standards
- **City Planners** reducing repetitive inquiries
- **Visually Impaired Residents** seeking independent access to property information

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router, React 19) |
| UI Components | RetroUI (neobrutalist design) |
| Styling | Tailwind CSS 3.4 |
| Backend | Convex (real-time database) |
| Auth | Clerk (Google OAuth + email) |
| Maps | Mapbox GL JS + Milwaukee ESRI ArcGIS |
| Tiles | PMTiles on Cloudflare R2 |
| AI/LLM | Google Gemini 3 |
| Voice | Gemini Live API |
| Agents | Google ADK |
| Generative UI | CopilotKit |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- [Mapbox account](https://account.mapbox.com/) (free tier works)
- [Clerk account](https://clerk.com/) (free tier works)
- [Convex account](https://convex.dev/) (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/tmoody1973/mkedev.git
cd mkedev

# Install dependencies
pnpm install

# Copy environment template
cp .env.local.example apps/web/.env.local
```

### Configure Environment

Edit `apps/web/.env.local` with your API keys:

```bash
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx

# Optional (for full features)
CONVEX_DEPLOYMENT=dev:xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
GEMINI_API_KEY=xxx
```

### Development

```bash
# Start Next.js dev server
pnpm dev

# In a separate terminal, start Convex (if using)
cd apps/web && npx convex dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
mkedev/
├── apps/
│   ├── web/                    # Next.js 15 application
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # React components
│   │   │   │   ├── chat/       # Chat panel components
│   │   │   │   ├── map/        # Map and layer components
│   │   │   │   ├── shell/      # App shell and header
│   │   │   │   └── ui/         # RetroUI components
│   │   │   ├── contexts/       # React contexts
│   │   │   └── providers/      # App providers
│   │   └── convex/             # Convex schema & functions
│   └── agents/                 # Google ADK agents (Week 2)
├── packages/
│   └── tile-builder/           # ESRI → PMTiles pipeline
├── agent-os/                   # Specs and documentation
│   ├── product/                # Mission, roadmap, tech stack
│   └── specs/                  # Feature specifications
└── data/                       # PDF documents for RAG
    ├── zoning-code-pdfs/       # Milwaukee Zoning Code
    └── plans/                  # City plans
```

---

## Map Layers

MKE.dev integrates 7 Milwaukee GIS data layers:

| Layer | Source | Description |
|-------|--------|-------------|
| Zoning Districts | ESRI Layer 11 | Color-coded by category (residential, commercial, industrial, mixed-use) |
| Parcels | ESRI Layer 2 | Clickable parcels with property info |
| TIF Districts | ESRI Layer 8 | Tax Increment Financing zones |
| Opportunity Zones | ESRI Layer 9 | Federal opportunity zone boundaries |
| Historic Districts | ESRI Layer 17 | Historic preservation areas |
| ARB Areas | ESRI Layer 1 | Architectural Review Board districts |
| City-Owned | ESRI MapServer | Municipal properties |

Layers are served via PMTiles for optimal performance (313,000+ features).

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token | Yes |
| `CONVEX_DEPLOYMENT` | Convex deployment ID | No* |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL | No* |
| `NEXT_PUBLIC_PMTILES_URL` | PMTiles R2 URL | No** |
| `GEMINI_API_KEY` | Google Gemini API key | No*** |
| `FIRECRAWL_API_KEY` | Firecrawl API key | No*** |

\* Required for database features
\** Falls back to ESRI REST API if not set
\*** Required for AI features (Week 2)

---

## Development Roadmap

### Week 1: Foundation (Complete)
- [x] Monorepo with pnpm workspaces
- [x] Next.js 15 with RetroUI design system
- [x] Clerk authentication
- [x] Convex backend schema
- [x] Mapbox + ESRI layer integration
- [x] Chat panel UI
- [x] PMTiles pipeline

### Week 2: Voice & AI (In Progress)
- [ ] Gemini Live API integration
- [ ] Voice activity detection
- [ ] CopilotKit generative UI
- [ ] Zoning Interpreter agent
- [ ] Conversation history

### Week 3: Advanced Agents
- [ ] Area Plan Advisor agent
- [ ] Incentives Navigator agent
- [ ] Nano Banana architectural preview
- [ ] Feasibility Analyst meta-agent

### Week 4: Polish & Submit
- [ ] Accessibility testing
- [ ] Demo video
- [ ] Submission materials

---

## Scripts

```bash
# Development
pnpm dev                  # Start Next.js dev server
pnpm lint                 # Run ESLint
pnpm format               # Run Prettier

# Tile Building (requires tippecanoe)
pnpm --filter tile-builder export    # Export ESRI → GeoJSON
pnpm --filter tile-builder build     # Build PMTiles
pnpm --filter tile-builder upload    # Upload to R2
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **City of Milwaukee** - Open GIS data via [Milwaukee Maps](https://city.milwaukee.gov/DownloadMapData)
- **RetroUI** - Neobrutalist component library
- **Mapbox** - Map rendering and interaction
- **Anthropic** - Claude AI assistance in development

---

## Team

Built for the Gemini 3 Hackathon by Tarik Moody.

---

<p align="center">
  <strong>MKE.dev</strong> — Making Milwaukee's civic development accessible to everyone
</p>
