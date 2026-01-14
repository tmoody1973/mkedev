# Architectural Visualizer

AI-generated architectural previews for selected parcels, with zoning compliance checking and style iteration options.

## Features

- **Natural Language Prompts**: Describe what you want to build
- **Preset Selection**: Choose building type, style, and stories
- **Before/After Comparison**: Toggle between street view and rendering
- **Compliance Checking**: See height, setback, lot coverage compliance
- **Style Iteration**: Regenerate with different parameters

## Components

| Component | Description |
|-----------|-------------|
| `ArchitecturalVisualizer` | Main composite component |
| `VisionCard` | Generated visualization display |
| `PromptInput` | Text/voice input for prompts |
| `PresetSelector` | Building type, style, stories selection |
| `CompliancePanel` | Zoning constraints and compliance |
| `GenerationStatus` | Thinking animation during generation |

## Building Options

**Types:**
- ADU (Accessory Dwelling Unit)
- Duplex
- Mixed-Use
- Single-Family
- Multi-Family
- Commercial

**Styles:**
- Cream City Brick (Milwaukee traditional)
- Modern
- Industrial
- Victorian
- Contemporary

**Stories:** 1-6

## Usage

```tsx
import { ArchitecturalVisualizer } from './components'
import data from './sample-data.json'

<ArchitecturalVisualizer
  parcel={data.parcel}
  zoningConstraints={data.zoningConstraints}
  preview={data.preview}
  onGenerate={(prompt, options) => console.log('Generate:', prompt, options)}
  onRegenerate={(options) => console.log('Regenerate:', options)}
  onSave={() => console.log('Save')}
  onShare={() => console.log('Share')}
/>
```

## Design Notes

- Before/after toggle is slider or button-based
- Compliance indicators show green check or red X
- Generation state shows animated thinking indicator
- Neobrutalist styling throughout
- Mobile responsive with stacked layout
