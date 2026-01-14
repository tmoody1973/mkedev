# Milestone 05 — Architectural Visualizer

## Overview

The VisionCard component displays AI-generated architectural previews for selected parcels. Users describe what they want via voice or text, and the system generates photorealistic renderings that respect zoning constraints and neighborhood character. Includes before/after comparison, compliance indicators, and style iteration options.

---

## User Flows to Implement

1. **Request a visualization** via natural language ("Show me a 3-story mixed-use building on this lot")
2. **Select building parameters** from guided presets (type, style, stories)
3. **View generated architectural rendering** for the selected parcel
4. **Toggle between before (street view) and after (generated visualization)**
5. **See zoning compliance indicators** (height, setbacks) overlaid on the image
6. **Regenerate with a different style** or parameters
7. **Save visualization to project** or share via link
8. **Hear voice narration** describing the generated design (accessibility)

---

## UI Components to Integrate

See `sections/architectural-visualizer/components/` for the following:

### VisionCard
- `VisionCard` — Main component displaying generated visualization
- `BeforeAfterToggle` — Slider or toggle for comparing views
- `BuildingSpecsRow` — Style, type, square footage display
- `ComplianceIndicators` — Height, setback compliance checkmarks
- `ActionButtons` — Try Another Style, Save, Share

### Parameter Selection
- `PromptInput` — Text field with voice button for natural language
- `BuildingTypeSelector` — ADU, Duplex, Mixed-Use, Single-Family
- `StyleSelector` — Cream City Brick, Modern, Industrial, Victorian
- `StoriesSelector` — 1-6 stories slider/picker

### Constraints Panel
- `ZoningConstraintsPanel` — Shows max height, setbacks, lot coverage
- `DesignOverlayInfo` — Special design requirements if applicable

### Generation State
- `GenerationIndicator` — Thinking animation during generation

---

## Backend Requirements

### AI Image Generation

Integrate with an AI image generation service (Nano Banana or similar):

```typescript
interface GenerationRequest {
  parcelId: string
  prompt: string
  buildingType: 'adu' | 'duplex' | 'mixed-use' | 'single-family'
  style: 'cream-city-brick' | 'modern' | 'industrial' | 'victorian'
  stories: number
  zoningConstraints: ZoningConstraints
}

interface GenerationResponse {
  imageUrl: string
  buildingSpecs: BuildingSpecs
  complianceCheck: ComplianceCheck
  generationId: string
}
```

### API Endpoints
- `POST /api/visualizations` — Generate new visualization
- `GET /api/visualizations/:id` — Get visualization details
- `POST /api/visualizations/:id/regenerate` — Regenerate with new params
- `POST /api/visualizations/:id/save` — Save to user's projects
- `GET /api/parcels/:id/street-view` — Get before image (Google Street View or similar)

### Zoning Compliance Check

Before generation, fetch and validate:
- Maximum allowed height for the zoning district
- Required setbacks (front, side, rear)
- Maximum lot coverage percentage
- Any design overlay requirements
- Historic district restrictions

### Voice Integration
- Text-to-speech narration of generated design description
- Voice input for natural language prompts

---

## Data Models

```typescript
interface ArchitecturalPreview {
  id: string
  parcelId: string
  parcel: Parcel
  imageUrl: string
  beforeImageUrl: string
  prompt: string
  buildingType: 'adu' | 'duplex' | 'mixed-use' | 'single-family'
  style: 'cream-city-brick' | 'modern' | 'industrial' | 'victorian'
  stories: number
  squareFootage: number
  complianceCheck: ComplianceCheck
  createdAt: string
  conversationId?: string
}

interface ComplianceCheck {
  heightCompliant: boolean
  maxHeight: number
  proposedHeight: number
  setbacksCompliant: boolean
  setbacks: {
    front: { required: number; proposed: number; compliant: boolean }
    side: { required: number; proposed: number; compliant: boolean }
    rear: { required: number; proposed: number; compliant: boolean }
  }
  lotCoverageCompliant: boolean
  maxLotCoverage: number
  proposedLotCoverage: number
  designOverlayCompliant?: boolean
  designOverlayNotes?: string
}

interface ZoningConstraints {
  maxHeight: number
  setbacks: { front: number; side: number; rear: number }
  maxLotCoverage: number
  designOverlay?: string
}
```

---

## Success Criteria

- [ ] Natural language prompt generates architectural visualization
- [ ] Preset selectors work for building type, style, stories
- [ ] Generated image displays in VisionCard
- [ ] Before/after toggle shows street view vs. generated
- [ ] Compliance indicators show for height, setbacks, lot coverage
- [ ] "Try Another Style" regenerates with new parameters
- [ ] Save and share functionality works
- [ ] Generation state shows thinking animation
- [ ] Voice narration describes the design
- [ ] Mobile responsive layout
