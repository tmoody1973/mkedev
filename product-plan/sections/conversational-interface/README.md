# Conversational Interface

The voice-first chat experience where users ask questions about Milwaukee's development information via text or voice, and receive AI-powered answers with rich generative UI cards.

## Features

- **Voice & Text Input**: Dual-mode interaction with real-time voice visualization
- **Generative UI Cards**: Rich inline cards for zoning info, parcel analysis, incentives, and more
- **Conversation History**: Auto-saved conversations with search and starring
- **Map Integration**: Bidirectional connection with the Geospatial Explorer

## Components

| Component | Description |
|-----------|-------------|
| `ConversationalInterface` | Main composite component |
| `EnhancedChatPanel` | Chat container with messages and input |
| `VoiceIndicator` | Pulsing mic indicator with waveform |
| `GenerativeCards` | Collection of all card types |
| `HistorySidebar` | Slide-out conversation history panel |

## Generative Card Types

- `ZoneInfoCard` — Zoning district summary
- `ParcelAnalysisCard` — Feasibility assessment
- `IncentivesSummaryCard` — Available incentives
- `AreaPlanContextCard` — Neighborhood plan alignment
- `PermitProcessCard` — Permit steps timeline
- `CodeCitationCard` — Source code excerpts
- `OpportunityListCard` — Matching properties

## Usage

```tsx
import { ConversationalInterface } from './components'
import data from './sample-data.json'

<ConversationalInterface
  conversations={data.conversations}
  messages={data.messages}
  generativeCards={data.generativeCards}
  onSendMessage={(text) => console.log('Send:', text)}
  onVoiceStart={() => console.log('Voice started')}
  onVoiceEnd={() => console.log('Voice ended')}
  onStarConversation={(id) => console.log('Star:', id)}
  onSelectConversation={(id) => console.log('Select:', id)}
/>
```

## Design Notes

- Neobrutalist styling: 2px black borders, 4px shadow offsets
- Voice toggle should be highly visible
- Cards expand/collapse for details
- Full light/dark mode support
