# AI Site Visualizer: Technical Deep Dive

## What It Does

The AI Site Visualizer lets users reimagine any Milwaukee property in seconds. Capture a screenshot from the interactive map or Google Street View, paint over the area you want to transform, describe your vision in natural language, and watch as Gemini 3 generates a photorealistic architectural visualization that respects the site's context and zoning constraints.

---

## How It Works

### User Flow

1. **Capture** — Click the purple camera button on the map to capture a 3D aerial view, or open Street View and click "Visualize" to capture a street-level perspective. Screenshots are saved to a gallery for later use.

2. **Paint** — Select a screenshot and use the brush tool to mask the area you want to transform. The mask tells Gemini which pixels to regenerate while preserving the surrounding context (neighboring buildings, streets, sky).

3. **Describe** — Enter a natural language prompt like:
   - *"Turn this house into a modern bungalow with nice landscaping"*
   - *"Build a 4-story mixed-use building with retail on ground floor"*
   - *"Transform into a community park with walking paths and trees"*

4. **Generate** — Gemini 3 Pro Image processes the source image, mask, and prompt together, generating a photorealistic visualization in 10-30 seconds.

5. **Iterate** — Not quite right? Click "Continue Editing" to refine the mask, "Try Again" for a new generation, or "Save" to add it to your gallery.

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| **AI Model** | Gemini 3 Pro Image (`gemini-3-pro-image-preview`) |
| **Canvas** | Konva.js for React — hardware-accelerated 2D canvas |
| **State** | Zustand — lightweight state management for visualizer flow |
| **Backend** | Convex — serverless functions handle Gemini API calls |
| **Storage** | Convex File Storage — persistent gallery with signed URLs |
| **Map Capture** | Mapbox GL JS `map.getCanvas().toDataURL()` |
| **Street View** | Google Static Street View API |

---

## Gemini 3 Integration Details

### Image Generation Request

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-3-pro-image-preview"
});

const result = await model.generateContent({
  contents: [{
    role: "user",
    parts: [
      { inlineData: { mimeType: "image/png", data: sourceImageBase64 } },
      { inlineData: { mimeType: "image/png", data: maskImageBase64 } },
      { text: enhancedPrompt }
    ]
  }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"]
  }
});
```

### Prompt Enhancement

The user's prompt is automatically enhanced with Milwaukee context:

```typescript
const enhancedPrompt = `
You are an architectural visualization AI. Given the source image and mask,
generate a photorealistic architectural rendering that:
- Replaces ONLY the masked area with the requested design
- Maintains the existing context (sky, streets, neighboring buildings)
- Follows Milwaukee's urban character and building styles
- Creates realistic lighting, shadows, and materials

Zoning context: ${zoningCode} (${zoningCategory})
Address: ${address}

User request: ${userPrompt}
`;
```

### Mask Processing

The mask layer uses a binary approach:
- **White pixels** = areas to regenerate
- **Transparent pixels** = areas to preserve

The Konva canvas exports the mask as a separate PNG that Gemini interprets as an inpainting guide.

---

## Why This Matters for the Hackathon

### Gemini 3 Differentiators Used

1. **Native Image Generation** — Gemini 3 Pro Image can generate, not just analyze, images. This is a new capability that enables true creative applications.

2. **Multimodal Input** — We send three inputs simultaneously: source image, mask image, and text prompt. Gemini processes them together for contextually-aware generation.

3. **Architectural Understanding** — Gemini 3's training includes architectural imagery, allowing it to generate realistic building styles, materials, and urban contexts.

### Real-World Impact

- **Developers** can visualize proposed projects before hiring architects
- **Community groups** can imagine improvements to vacant lots
- **City planners** can communicate development concepts to residents
- **Homebuyers** can see renovation possibilities before purchasing

### What Makes It Special

Unlike generic AI image generators, our visualizer:
- Integrates real property data (zoning, address, constraints)
- Preserves authentic Milwaukee street context
- Captures from actual map/Street View locations
- Stores visualizations with property metadata

---

## Sample Prompts That Work Well

| Prompt | Result |
|--------|--------|
| *"Modern 3-story apartment building with ground floor retail"* | Mixed-use development with large windows and contemporary facade |
| *"Community garden with raised beds and pergola"* | Green space with wooden structures and plantings |
| *"Prairie-style home inspired by Frank Lloyd Wright"* | Horizontal lines, earth tones, integrated landscaping |
| *"Convert to coworking space with outdoor seating"* | Commercial renovation with patio and signage |

---

## The Bigger Picture

The AI Site Visualizer is one component of MKE.dev's civic intelligence platform. It works alongside:

- **Zoning AI** — Gemini 3 with 1M context window holds the entire Milwaukee Zoning Code for instant analysis
- **Property Intelligence** — Every parcel comes with zoning, overlays, area plans, and incentive eligibility
- **Homes Discovery** — Browse city-owned properties with AI-enhanced insights

Together, these tools democratize access to development knowledge that previously required expensive consultants and weeks of research.

---

*Built for the Gemini 3 Hackathon | Deadline: February 10, 2026*
