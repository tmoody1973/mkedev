# Specification: Site Visualizer with Gemini 3 Pro Image

> AI-powered architectural visualization tool for Milwaukee parcels

**Status:** Draft
**Created:** 2026-01-18
**Hackathon Feature:** Yes (Gemini 3 Image Generation)

---

## 1. Overview

### 1.1 Purpose

The Site Visualizer enables users to capture images of Milwaukee parcels (from map, Street View, or upload) and generate AI-powered architectural visualizations that automatically comply with zoning constraints.

### 1.2 Hackathon Differentiation

This feature demonstrates a unique combination of Gemini 3 capabilities:
- **Gemini 3 Pro Image** for high-quality visualization generation
- **Zoning context injection** from our 1M context window implementation
- **Civic AI application** that makes zoning tangible for citizens

### 1.3 Core Value Proposition

| Without MKE.dev | With MKE.dev |
|-----------------|--------------|
| "What could I build here?" 🤷 | See a realistic visualization |
| "What does zoning allow?" 📚 | Constraints auto-applied |
| Need architect for concepts | DIY in seconds |
| Generic AI images | Milwaukee-specific context |

---

## 2. Technical Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Components  │  │ Zustand     │  │ Konva.js    │             │
│  │             │  │ Store       │  │ Canvas      │             │
│  │ Capture     │◄─┤             │◄─┤             │             │
│  │ Editor      │  │ visualizer  │  │ Mask layers │             │
│  │ Gallery     │  │ State       │  │ Transform   │             │
│  └─────────────┘  └──────┬──────┘  └─────────────┘             │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Convex Backend                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Actions         │  │ Queries         │  │ File Storage    │  │
│  │                 │  │                 │  │                 │  │
│  │ generateImage() │  │ getGallery()    │  │ Source images   │  │
│  │ saveToGallery() │  │ getVisualization│  │ Generated imgs  │  │
│  │ getZoningCtx()  │  │ getZoning()     │  │ Masks           │  │
│  └────────┬────────┘  └─────────────────┘  └─────────────────┘  │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│     Gemini 3 Pro Image Preview        │
│                                       │
│  • Image-to-image generation          │
│  • Mask-based inpainting              │
│  • Text prompt + reference image      │
└───────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| State | **Zustand** | Editor state, history, undo/redo |
| Canvas | **Konva.js** + react-konva | Image display, mask painting |
| AI | **gemini-3-pro-image-preview** | Image generation |
| Storage | **Convex file storage** | User images, gallery |
| Cache | **IndexedDB** | Offline canvas state |

### 2.3 New Dependencies

```json
{
  "dependencies": {
    "zustand": "^4.5.0",
    "konva": "^9.3.0",
    "react-konva": "^18.2.10"
  }
}
```

---

## 3. Data Models

### 3.1 Convex Schema

```typescript
// convex/schema.ts - additions

visualizations: defineTable({
  // Owner
  userId: v.string(),

  // Source
  sourceImageId: v.id("_storage"),
  sourceType: v.union(
    v.literal("map"),
    v.literal("streetview"),
    v.literal("upload")
  ),

  // Context
  parcelId: v.optional(v.id("parcels")),
  address: v.optional(v.string()),
  zoningDistrict: v.optional(v.string()),
  coordinates: v.optional(v.object({
    lat: v.number(),
    lng: v.number(),
  })),

  // Generation
  prompt: v.string(),
  enhancedPrompt: v.string(), // With zoning context
  maskImageId: v.optional(v.id("_storage")),
  generatedImageId: v.id("_storage"),

  // Metadata
  title: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_date", ["userId", "createdAt"])
  .index("by_parcel", ["parcelId"]),
```

### 3.2 Zustand Store

```typescript
// src/stores/visualizerStore.ts

interface VisualizerState {
  // Mode
  mode: 'idle' | 'capture' | 'edit' | 'generate' | 'result';

  // Source Image
  sourceImage: string | null;          // Base64
  sourceType: 'map' | 'streetview' | 'upload' | null;
  sourceImageId: string | null;        // Convex storage ID

  // Parcel Context
  parcelId: string | null;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  zoningContext: ZoningContext | null;

  // Mask Editor
  maskImage: string | null;            // Base64 of mask
  brushSize: number;
  brushColor: string;
  isDrawing: boolean;

  // Generation
  prompt: string;
  isGenerating: boolean;
  generationProgress: number;
  generatedImage: string | null;
  generationError: string | null;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  setMode: (mode: VisualizerState['mode']) => void;
  captureFromMap: (imageData: string, parcelContext?: ParcelContext) => void;
  captureFromStreetView: (imageData: string, coords: [number, number]) => void;
  uploadImage: (file: File) => Promise<void>;

  updateMask: (maskData: string) => void;
  setBrushSize: (size: number) => void;
  clearMask: () => void;

  setPrompt: (prompt: string) => void;
  generate: () => Promise<void>;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  saveToGallery: (title?: string) => Promise<string>;
  reset: () => void;
}

interface ZoningContext {
  district: string;
  category: string;
  maxHeight: number;
  maxStories: number;
  frontSetback: number;
  sideSetback: number;
  rearSetback: number;
  far: number;
  overlayZones: string[];
  isHistoric: boolean;
  neighborhoodStyle: string;
}

interface HistoryEntry {
  sourceImage: string;
  maskImage: string | null;
  prompt: string;
  generatedImage: string | null;
  timestamp: number;
}
```

---

## 4. API Design

### 4.1 Convex Actions

#### generateVisualization

```typescript
// convex/visualization/generate.ts

export const generateVisualization = action({
  args: {
    sourceImageBase64: v.string(),
    maskImageBase64: v.optional(v.string()),
    prompt: v.string(),
    parcelId: v.optional(v.id("parcels")),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    imageBase64?: string;
    enhancedPrompt?: string;
    error?: string;
  }> => {
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Build zoning context
    let zoningContext = "";
    if (args.parcelId) {
      const parcel = await ctx.runQuery(internal.parcels.get, {
        id: args.parcelId
      });
      if (parcel) {
        zoningContext = await buildZoningContext(ctx, parcel);
      }
    } else if (args.coordinates) {
      // Query zoning at coordinates
      zoningContext = await getZoningAtPoint(ctx, args.coordinates);
    }

    // 2. Enhance prompt with zoning
    const enhancedPrompt = buildEnhancedPrompt(args.prompt, zoningContext);

    // 3. Build request parts
    const parts = [
      { inlineData: { mimeType: "image/png", data: args.sourceImageBase64 }},
    ];

    if (args.maskImageBase64) {
      parts.push({
        inlineData: { mimeType: "image/png", data: args.maskImageBase64 }
      });
      parts.push({
        text: `Edit the masked region of this image. ${enhancedPrompt}`
      });
    } else {
      parts.push({
        text: `Transform this site image. ${enhancedPrompt}`
      });
    }

    // 4. Call Gemini 3 Pro Image
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["image", "text"],
            imageGenerationConfig: {
              outputImageFormat: "png",
            }
          },
          safetySettings: [
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
          ]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const result = await response.json();
    const imageData = extractImageFromResponse(result);

    return {
      success: true,
      imageBase64: imageData,
      enhancedPrompt,
    };
  }
});
```

#### saveVisualization

```typescript
// convex/visualization/save.ts

export const saveVisualization = mutation({
  args: {
    sourceImageId: v.id("_storage"),
    generatedImageId: v.id("_storage"),
    maskImageId: v.optional(v.id("_storage")),
    sourceType: v.union(v.literal("map"), v.literal("streetview"), v.literal("upload")),
    prompt: v.string(),
    enhancedPrompt: v.string(),
    parcelId: v.optional(v.id("parcels")),
    address: v.optional(v.string()),
    zoningDistrict: v.optional(v.string()),
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    return await ctx.db.insert("visualizations", {
      userId: identity.subject,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  }
});
```

### 4.2 Zoning Context Builder

```typescript
// convex/visualization/zoningContext.ts

export function buildZoningContext(
  zoning: ZoningDistrict,
  parcel: Parcel,
  overlays: string[]
): string {
  const constraints = [];

  constraints.push(`SITE CONTEXT:`);
  constraints.push(`- Address: ${parcel.address}`);
  constraints.push(`- Neighborhood: ${parcel.neighborhood || 'Milwaukee'}`);
  constraints.push(``);

  constraints.push(`ZONING CONSTRAINTS (visualization MUST comply):`);
  constraints.push(`- Zoning District: ${zoning.code} (${zoning.category})`);
  constraints.push(`- Maximum Height: ${zoning.maxHeight} feet`);
  constraints.push(`- Maximum Stories: ${zoning.maxStories}`);
  constraints.push(`- Front Setback: ${zoning.frontSetback} feet`);
  constraints.push(`- Side Setback: ${zoning.sideSetback} feet`);
  constraints.push(`- Floor Area Ratio: ${zoning.far}`);

  if (overlays.length > 0) {
    constraints.push(`- Overlay Zones: ${overlays.join(', ')}`);
  }

  if (overlays.includes('Historic')) {
    constraints.push(`- Historic District: Design must be architecturally compatible`);
  }

  constraints.push(``);
  constraints.push(`ARCHITECTURAL CONTEXT:`);
  constraints.push(`- Milwaukee urban context`);
  constraints.push(`- Generate photorealistic visualization`);
  constraints.push(`- Building should fit naturally into streetscape`);

  return constraints.join('\n');
}
```

---

## 5. Component Specifications

### 5.1 SiteVisualizer (Main Container)

```typescript
// src/components/visualizer/SiteVisualizer.tsx

interface SiteVisualizerProps {
  initialImage?: string;
  initialParcelId?: string;
  onClose: () => void;
}

// Full-screen modal or dedicated page
// Contains: ImageCapture | VisualizerCanvas | GenerationResult
// Sidebar: ZoningSidebar + PromptInput
```

### 5.2 VisualizerCanvas

```typescript
// src/components/visualizer/VisualizerCanvas.tsx

interface VisualizerCanvasProps {
  sourceImage: string;
  maskImage: string | null;
  onMaskUpdate: (maskData: string) => void;
  brushSize: number;
  isDrawing: boolean;
}

// Konva Stage with:
// - Layer 1: Source image
// - Layer 2: Mask overlay (semi-transparent)
// - Layer 3: Brush cursor
// Supports: zoom, pan, brush painting
```

### 5.3 MaskToolbar

```typescript
// src/components/visualizer/MaskToolbar.tsx

interface MaskToolbarProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Tools: Brush, Eraser, Size slider, Clear, Undo, Redo
```

### 5.4 ZoningSidebar

```typescript
// src/components/visualizer/ZoningSidebar.tsx

interface ZoningSidebarProps {
  zoningContext: ZoningContext | null;
  address: string | null;
  isLoading: boolean;
}

// Displays:
// - Parcel address
// - Zoning district badge
// - Constraint list (height, setbacks, etc.)
// - Overlay zone badges
// - "These constraints will be applied to generation"
```

### 5.5 PromptInput

```typescript
// src/components/visualizer/PromptInput.tsx

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  suggestions: string[];
}

// Textarea with:
// - Placeholder suggestions
// - Character count
// - Generate button
// - Loading state during generation
```

### 5.6 GenerationResult

```typescript
// src/components/visualizer/GenerationResult.tsx

interface GenerationResultProps {
  sourceImage: string;
  generatedImage: string;
  onTryAgain: () => void;
  onEditMore: () => void;
  onSave: () => void;
  onDownload: () => void;
}

// Side-by-side or slider comparison
// Actions: Try Again, Edit More, Save to Gallery, Download
```

---

## 6. User Interface

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                    Site Visualizer              [Close] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────┐  │
│  │                                 │  │ ZONING CONTEXT      │  │
│  │                                 │  │                     │  │
│  │         Canvas Area             │  │ 500 N Water St      │  │
│  │                                 │  │ Zone: LB2           │  │
│  │    [Image + Mask Overlay]       │  │ Max Height: 45ft    │  │
│  │                                 │  │ Setback: 0ft        │  │
│  │                                 │  │ FAR: 2.5            │  │
│  │                                 │  │                     │  │
│  └─────────────────────────────────┘  │ ─────────────────── │  │
│                                       │                     │  │
│  ┌─────────────────────────────────┐  │ YOUR PROMPT         │  │
│  │ 🖌️ Brush  🧹 Eraser  [===] Size │  │                     │  │
│  │ ↩️ Undo   ↪️ Redo    🗑️ Clear   │  │ [Add a modern      ]│  │
│  └─────────────────────────────────┘  │ [mixed-use building]│  │
│                                       │ [with ground floor ]│  │
│                                       │ [retail...         ]│  │
│                                       │                     │  │
│                                       │ [✨ Generate]       │  │
│                                       └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Result View

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Edit            Result                       [Close] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │                      │  │                      │            │
│  │      BEFORE          │  │       AFTER          │            │
│  │                      │  │                      │            │
│  │   [Source Image]     │  │  [Generated Image]   │            │
│  │                      │  │                      │            │
│  │                      │  │                      │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [🔄 Try Again] [✏️ Edit More] [💾 Save] [⬇️ Download]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Prompt: "Add a modern mixed-use building with ground floor..." │
│  Zone: LB2 | Height: 45ft max | Generated in 12.3s             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Map Integration

```typescript
// Add to MapContainer.tsx or Header.tsx

const handleCaptureForVisualization = () => {
  const canvas = map.getCanvas();
  const imageData = canvas.toDataURL('image/png');

  // Get center parcel
  const center = map.getCenter();
  const parcelAtCenter = getParcelAtPoint(center);

  visualizerStore.captureFromMap(imageData, {
    parcelId: parcelAtCenter?.id,
    coordinates: { lat: center.lat, lng: center.lng },
    address: parcelAtCenter?.address,
  });

  setShowVisualizer(true);
};
```

### 7.2 Street View Integration

```typescript
// Add to StreetViewModal.tsx

const handleCaptureForVisualization = () => {
  // Use existing screenshot functionality
  const imageUrl = getStaticStreetViewUrl(coordinates, heading, pitch, zoom);

  // Fetch and convert to base64
  const imageData = await fetchAsBase64(imageUrl);

  visualizerStore.captureFromStreetView(imageData, coordinates);
  onClose();
  setShowVisualizer(true);
};
```

### 7.3 ParcelCard Integration

```typescript
// Add to ParcelCard.tsx actions

<Button onClick={() => onVisualize(parcel)}>
  <Wand2 className="h-4 w-4 mr-1" />
  Visualize Site
</Button>
```

---

## 8. Error Handling

| Error | User Message | Recovery |
|-------|--------------|----------|
| No image captured | "Please capture or upload an image first" | Show capture options |
| Generation failed | "Generation failed. Please try again." | Retry button |
| Image too large | "Image is too large. Max 4MB." | Compress or crop |
| Rate limited | "Too many requests. Please wait." | Show cooldown timer |
| No zoning data | "Zoning info unavailable for this location" | Allow generation without context |

---

## 9. Performance Considerations

- **Image compression:** Resize captures to 1024x1024 before sending
- **Mask optimization:** Convert mask to 1-bit PNG for smaller payload
- **Progressive loading:** Show low-res preview while generating
- **Caching:** Cache recent generations in IndexedDB
- **Debounce:** Debounce mask updates to avoid excessive re-renders

---

## 10. Security & Safety

- **API key protection:** Gemini calls only via Convex actions (server-side)
- **Content moderation:** Use Gemini's safety settings to block inappropriate content
- **Rate limiting:** Limit generations per user (e.g., 20/day)
- **Disclaimer:** Add "AI-generated visualization, not architectural plans" watermark

---

## 11. Future Enhancements (v2+)

- Multiple angle generation
- 3D model export (GLTF)
- Video walkthroughs
- Real-time collaboration
- Public gallery with voting
- Integration with permit application

