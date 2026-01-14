# MKE.dev — Export Package

This export package contains everything you need to implement MKE.dev, a voice-first AI-powered civic intelligence platform for Milwaukee development information.

## Quick Start

### Option 1: One-Shot Implementation

1. Open your AI coding assistant (Claude, Cursor, etc.)
2. Copy the contents of `prompts/one-shot-prompt.md`
3. Paste and answer the clarifying questions
4. Let the agent implement the full application

### Option 2: Incremental Implementation

Build milestone by milestone:

1. Copy `prompts/section-prompt.md`
2. Fill in the variables for the section you're building
3. Reference the instruction file for that milestone
4. Repeat for each section

## Package Contents

```
product-plan/
├── README.md                      # This file
├── product-overview.md            # Product summary
│
├── prompts/                       # Ready-to-use AI prompts
│   ├── one-shot-prompt.md         # Full implementation prompt
│   └── section-prompt.md          # Section-by-section template
│
├── instructions/                  # Implementation guides
│   ├── one-shot-instructions.md   # All milestones combined
│   └── incremental/               # Milestone-by-milestone
│       ├── 01-foundation.md
│       ├── 02-conversational-interface.md
│       ├── 03-geospatial-explorer.md
│       ├── 04-agent-intelligence.md
│       ├── 05-architectural-visualizer.md
│       └── 06-knowledge-base.md
│
├── design-system/                 # Design tokens
│   ├── tokens.css                 # CSS custom properties
│   ├── tailwind-colors.md         # Color usage guide
│   └── fonts.md                   # Typography guide
│
├── data-model/                    # Entity definitions
│   ├── README.md                  # Data model overview
│   └── types.ts                   # TypeScript interfaces
│
├── shell/                         # Application shell
│   └── components/                # Shell React components
│
└── sections/                      # Feature sections
    ├── conversational-interface/
    ├── geospatial-explorer/
    ├── agent-intelligence/
    ├── architectural-visualizer/
    └── knowledge-base/
        ├── README.md              # Section overview
        ├── tests.md               # TDD test instructions
        ├── types.ts               # TypeScript interfaces
        ├── sample-data.json       # Test data
        └── components/            # React components
```

## Milestones

| # | Milestone | Description |
|---|-----------|-------------|
| 01 | Foundation | Design tokens, data model, shell layout |
| 02 | Conversational Interface | Voice/text chat with generative UI cards |
| 03 | Geospatial Explorer | Interactive map with 8 data layers |
| 04 | Agent Intelligence | Multi-agent progress and contributions |
| 05 | Architectural Visualizer | AI-generated building previews |
| 06 | Knowledge Base | RAG system transparency dashboard |

## Design System

**Colors (Tailwind):**
- Primary: `sky` — Buttons, links, accents
- Secondary: `amber` — Tags, highlights
- Neutral: `stone` — Backgrounds, text, borders

**Typography (Google Fonts):**
- Heading: Space Grotesk
- Body: DM Sans
- Mono: IBM Plex Mono

**UI Style:**
- Neobrutalist: 2px black borders, 4px shadow offsets
- Full light/dark mode support
- Voice-first with prominent microphone controls

## External Integrations

| Service | Purpose |
|---------|---------|
| Mapbox GL JS | Base map with vector tiles |
| ESRI ArcGIS | 8 data layers |
| Gemini API | Voice + LLM |
| Firecrawl | Document ingestion |
| Nano Banana | AI visualizations |

## Using the Components

All components are **props-based** — they accept data and callbacks via props, making them portable to any React setup.

```tsx
import { ConversationalInterface } from './sections/conversational-interface/components'

<ConversationalInterface
  conversations={data}
  onSendMessage={(text) => /* handle */}
  onVoiceStart={() => /* handle */}
/>
```

## Test-Driven Development

Each section includes a `tests.md` file with:
- Unit tests for each component
- Integration tests for user flows
- Edge cases to handle
- Accessibility requirements

Write tests first, then implement to make them pass.

## Questions?

The prompts are designed to guide AI assistants in asking clarifying questions about:
- Authentication & authorization
- User modeling
- Tech stack preferences
- Backend business logic
- External integrations

Answer these questions to customize the implementation for your specific needs.
