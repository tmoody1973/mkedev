# Spec Shape: Site Visualizer with Gemini 3 Pro Image

## Overview

**Feature:** AI-powered site plan visualization tool that allows users to capture map/Street View images, highlight regions, and generate zoning-compliant architectural visualizations using Gemini 3 Pro Image.

**Hackathon Value:** Demonstrates unique combination of Gemini 3 capabilities (image generation + zoning context from 1M context window) applied to civic planning use case.

---

## Problem Statement

### Current Pain Points

1. **Visualization Gap:** Citizens and developers can't easily visualize what could be built on a parcel
2. **Zoning Complexity:** Even if they could generate images, they don't know height limits, setbacks, FAR, etc.
3. **No Context:** Generic AI image generators don't know Milwaukee's architectural character or zoning rules
4. **Fragmented Tools:** Would need to use separate tools for map capture, image editing, and AI generation

### User Stories

> "As a **prospective homebuyer**, I want to see what a house could look like on a vacant city-owned lot so I can decide if I want to apply for the lot."

> "As a **developer**, I want to quickly visualize a mixed-use building on a parking lot to show investors what's possible within zoning constraints."

> "As a **neighborhood planner**, I want to generate before/after visualizations for community meetings to show proposed development concepts."

> "As a **city staff member**, I want to help citizens understand what zoning allows by showing them realistic visualizations."

---

## Requirements Gathering

### Functional Requirements

#### Image Capture
- [ ] Capture screenshot from Mapbox map view
- [ ] Capture screenshot from Street View modal
- [ ] Upload custom site photos
- [ ] Auto-detect parcel from map center/click
- [ ] Store source images in user gallery

#### Region Selection (Mask Editor)
- [ ] Interactive canvas with zoom/pan
- [ ] Brush tool for painting mask regions
- [ ] Eraser tool for removing mask
- [ ] Clear mask button
- [ ] Adjustable brush size
- [ ] Visual overlay showing selected region

#### AI Generation
- [ ] Text prompt input for user instructions
- [ ] Auto-inject zoning constraints from parcel data
- [ ] Call Gemini 3 Pro Image (`gemini-3-pro-image-preview`)
- [ ] Support image-to-image with mask (inpainting)
- [ ] Support full image generation from reference
- [ ] Display generation progress/status
- [ ] Show generated result alongside original

#### Zoning Context Injection
- [ ] Fetch zoning district from parcel
- [ ] Include max height, stories, setbacks, FAR
- [ ] Include overlay zones (Historic, Downtown, etc.)
- [ ] Include neighborhood context
- [ ] Format as natural language constraints for prompt

#### User Gallery
- [ ] Save visualizations to user account
- [ ] View history of generations
- [ ] Before/after comparison view
- [ ] Delete saved visualizations
- [ ] Download generated images

### Non-Functional Requirements

- **Performance:** Generation should complete in <30 seconds
- **Image Quality:** Output 1024x1024 minimum
- **Mobile:** Basic support (capture and view, not full editing)
- **Offline:** Cache recent images locally (IndexedDB)

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CAPTURE                                                   │
│                                                              │
│    User on map → Clicks parcel → "Visualize This Site"      │
│                       OR                                     │
│    User in Street View → "Capture for Visualization"        │
│                       OR                                     │
│    User uploads site photo                                   │
└─────────────────────────────────┬───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. EDIT (Optional)                                           │
│                                                              │
│    Canvas shows captured image                               │
│    User can paint mask to highlight "edit this area"         │
│    Zoning info displayed in sidebar                          │
└─────────────────────────────────┬───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PROMPT                                                    │
│                                                              │
│    User types: "Add a 3-story mixed-use building"           │
│    System shows: "Zone LB2: Max 45ft, 0ft setback"          │
│    User clicks "Generate"                                    │
└─────────────────────────────────┬───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. GENERATE                                                  │
│                                                              │
│    Loading state with progress                               │
│    Gemini 3 Pro Image processes request                     │
│    Result displayed side-by-side with original              │
└─────────────────────────────────┬───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ITERATE / SAVE                                            │
│                                                              │
│    "Try Again" → Back to prompt                              │
│    "Edit More" → Back to mask editor                         │
│    "Save to Gallery" → Stored in Convex                      │
│    "Download" → PNG to device                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Decisions

### State Management: Zustand

**Why Zustand over React Context:**
- Complex nested state (history trees, canvas state)
- Need undo/redo with branching
- Better performance for frequent updates
- Persist middleware for local caching
- ~1KB bundle size

### Canvas: Konva.js

**Why Konva.js:**
- Same as Nano Banana (proven for this use case)
- React bindings (react-konva)
- Built-in support for masking, layers, transformations
- Good touch support for mobile

### Storage: Convex + IndexedDB

**Convex for:**
- User gallery (cloud sync)
- Generation history
- Sharing between users

**IndexedDB for:**
- Canvas state caching
- Recent images (offline access)
- Undo/redo history

### AI Model: gemini-3-pro-image-preview

**Why Gemini 3 Pro Image:**
- Required for hackathon (Gemini 3)
- Best quality image generation
- Supports image-to-image with masks
- Can accept reference images

---

## Zoning Context Template

```typescript
const zoningPromptTemplate = `
SITE CONTEXT:
- Address: {{address}}
- Neighborhood: {{neighborhood}}
- Current Use: {{currentUse}}

ZONING CONSTRAINTS (generated image MUST comply):
- Zoning District: {{zoningDistrict}} ({{zoningCategory}})
- Maximum Height: {{maxHeight}} feet
- Maximum Stories: {{maxStories}}
- Front Setback: {{frontSetback}} feet
- Side Setback: {{sideSetback}} feet
- Rear Setback: {{rearSetback}} feet
- Floor Area Ratio (FAR): {{far}}
{{#if overlayZones}}
- Overlay Zones: {{overlayZones}}
{{/if}}
{{#if historicDistrict}}
- Historic District: Yes - must be architecturally compatible
{{/if}}

ARCHITECTURAL CONTEXT:
- Milwaukee urban context
- {{neighborhoodStyle}} architectural character
- Surroundings: {{adjacentDescription}}

USER REQUEST:
{{userPrompt}}

Generate a photorealistic architectural visualization that fits naturally
into the existing streetscape while complying with all zoning constraints.
`;
```

---

## UI Components

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `SiteVisualizer` | Main container/page |
| `ImageCapture` | Capture controls (map, street view, upload) |
| `VisualizerCanvas` | Konva.js canvas with mask tools |
| `MaskToolbar` | Brush, eraser, size, clear |
| `ZoningSidebar` | Display zoning constraints |
| `PromptInput` | User prompt + generate button |
| `GenerationResult` | Before/after comparison |
| `VisualizationGallery` | User's saved visualizations |

### Integration Points

- **Header:** Add "Visualize" button (like 3D toggle)
- **ParcelCard:** Add "Visualize This Site" action
- **Street View Modal:** Add "Capture for Visualization" button
- **Chat:** Agent can suggest "Would you like to visualize this?"

---

## Out of Scope (v1)

- Video generation
- 3D model export
- Multiple angle generation
- Real-time collaboration
- Public gallery/sharing
- Mobile mask editing (view only)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Generation success rate | >90% |
| Time to generate | <30 seconds |
| User saves visualization | >50% of generations |
| Zoning compliance in output | Visually reasonable |

---

## Open Questions

1. **Pricing/Limits:** Should we limit generations per user? (API costs)
2. **Moderation:** Should generated images be reviewed? (inappropriate content)
3. **Attribution:** How to handle AI-generated image attribution?
4. **Accuracy disclaimer:** Need disclaimer that visualizations are conceptual?

---

## References

- [Nano Banana Editor](https://github.com/markfulton/NanoBananaEditor) - Reference implementation
- [Gemini Image Generation](https://ai.google.dev/gemini-api/docs/image-generation) - API docs
- [Konva.js](https://konvajs.org/) - Canvas library
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
