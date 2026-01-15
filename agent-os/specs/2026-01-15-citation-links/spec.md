# Clickable Citation Links with PDF Viewer

## Overview

Add inline clickable citation links to AI responses that open source documents in a modal PDF viewer. This builds trust by allowing users to verify information directly from authoritative sources.

**Status**: Implemented
**Priority**: P0 (Core UX feature)
**Dependencies**: RAG pipeline, Document corpus

---

## Problem Statement

When the AI responds with zoning information, users have no way to:
1. Verify the accuracy of the response
2. Read the full context around a cited regulation
3. Download or reference the official source document

This creates trust issues and limits the platform's usefulness for serious development decisions.

---

## Solution

Implement inline citation markers (`[1]`, `[2]`) that are clickable and open a modal PDF viewer showing the source document.

### User Flow

```
1. User asks: "What parking do I need for a restaurant?"

2. AI responds with citations:
   "In the DC district, restaurants require 1 parking space
    per 300 sq ft [1]. Reductions up to 50% are available [2]."

3. User clicks [1]
   → Modal opens showing CH295-sub6.pdf (Commercial Districts)

4. User can:
   - Read the full document
   - Download the PDF
   - Close and continue conversation
```

---

## Functional Requirements

### FR-1: Citation Rendering
- **FR-1.1**: Parse citation markers `[N]` in response text
- **FR-1.2**: Render as clickable styled links (sky-500 color)
- **FR-1.3**: Show tooltip on hover with source title and excerpt preview
- **FR-1.4**: Support multiple citations in same response

### FR-2: PDF Viewer Modal
- **FR-2.1**: Open modal when citation is clicked
- **FR-2.2**: Display PDF using iframe with browser's native viewer
- **FR-2.3**: Support page navigation via `#page=N` URL fragment
- **FR-2.4**: Show document title in modal header
- **FR-2.5**: Provide "Open in new tab" link for full experience
- **FR-2.6**: Close on escape key or click outside

### FR-3: Sources Footer
- **FR-3.1**: Display list of all cited sources below response
- **FR-3.2**: Each source shows number, title, and is clickable
- **FR-3.3**: Group by document type (zoning code vs area plans)

### FR-4: Agent Integration
- **FR-4.1**: Update system prompt to instruct citation format
- **FR-4.2**: Map RAG citation data to enhanced citations with URLs
- **FR-4.3**: Pass citations through tool results to frontend

---

## Non-Functional Requirements

### NFR-1: Performance
- PDF viewer should open within 500ms
- No re-render of chat messages when modal opens

### NFR-2: Accessibility
- Citations must be keyboard navigable
- Modal must trap focus and be dismissible via Escape
- Screen reader announces "Source citation" on links

### NFR-3: Mobile Support
- Modal should be full-screen on mobile
- PDF should be scrollable/zoomable

---

## Technical Design

### Data Structures

```typescript
// Enhanced citation with URL info
interface EnhancedCitation {
  index: number;           // 1-based index for display
  sourceId: string;        // RAG source identifier
  sourceName: string;      // Original filename
  title: string;           // Human-readable title
  excerpt: string;         // Quoted text from source
  documentUrl: string;     // URL to PDF in public folder
  pageNumber?: number;     // Page to open (if available)
  category: 'zoning-codes' | 'area-plans';
}

// Props for citation text component
interface CitationTextProps {
  text: string;
  citations: EnhancedCitation[];
  onCitationClick: (citation: EnhancedCitation) => void;
}
```

### Component Architecture

```
ChatPanel
└── MessageBubble
    ├── CitationText          ← Parses [N] and renders links
    │   └── CitationLink      ← Individual clickable citation
    ├── SourcesFooter         ← Lists all cited sources
    └── PDFViewerModal        ← Modal for viewing documents
```

### Citation Text Parser

```typescript
// Parse text with [N] patterns into segments
function parseCitations(text: string): Array<{ type: 'text' | 'citation'; value: string; index?: number }> {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map(part => {
    const match = part.match(/\[(\d+)\]/);
    if (match) {
      return { type: 'citation', value: part, index: parseInt(match[1]) };
    }
    return { type: 'text', value: part };
  }).filter(p => p.value);
}
```

### Document URL Enhancement

```typescript
// Enhance RAG citations with document URLs
function enhanceCitations(
  ragCitations: Array<{ sourceId: string; sourceName: string; excerpt: string }>,
): EnhancedCitation[] {
  return ragCitations.map((citation, index) => {
    const docInfo = matchDocumentUrl(citation.sourceName);
    return {
      index: index + 1,
      sourceId: citation.sourceId,
      sourceName: citation.sourceName,
      title: docInfo?.title || citation.sourceName,
      excerpt: citation.excerpt,
      documentUrl: docInfo?.url || '#',
      category: docInfo?.url?.includes('area-plans') ? 'area-plans' : 'zoning-codes',
    };
  });
}
```

---

## File Structure

```
apps/web/src/
├── components/
│   ├── chat/
│   │   ├── CitationText.tsx        ← NEW: Parse and render citations
│   │   ├── SourcesFooter.tsx       ← NEW: List sources below response
│   │   └── ChatPanel.tsx           ← UPDATE: Integrate citations
│   └── ui/
│       └── PDFViewerModal.tsx      ← NEW: Modal PDF viewer
├── lib/
│   ├── documentUrls.ts             ← UPDATE: Add missing docs
│   └── citations.ts                ← NEW: Citation utilities
└── hooks/
    └── useCitations.ts             ← NEW: Citation state management
```

---

## Agent Prompt Update

Add to `SYSTEM_INSTRUCTION` in `convex/agents/zoning.ts`:

```
## Citation Format

When citing sources from the zoning code or area plans, use numbered
brackets like [1], [2], etc. Each number corresponds to a source document
that the user can click to view.

Example:
"Restaurants in commercial districts require 1 parking space per 300
square feet of floor area [1]. However, properties within the Downtown
Overlay Zone may qualify for parking reductions of up to 50% [2]."

Guidelines:
- Use citations when referencing specific regulations or plan sections
- Keep citation numbers sequential starting from [1]
- Place citations at the end of the relevant sentence or clause
- The same source can be cited multiple times with the same number
```

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  Assistant Message                                              │
│                                                                 │
│  In the DC Downtown Core district, restaurants require          │
│  1 parking space per 300 sq ft [1]. Properties within the      │
│  Downtown Overlay may qualify for reductions up to 50% [2].    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Sources:                                                       │
│  [1] Chapter 295 - Commercial Districts                        │
│  [2] Chapter 295 - Overlay Zones                               │
└─────────────────────────────────────────────────────────────────┘

                    │ Click [1]
                    ▼

┌─────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Chapter 295 - Commercial Districts              [X]      │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │                                                     │ │ │
│  │  │           [PDF Content Displayed Here]              │ │ │
│  │  │                                                     │ │ │
│  │  │                                                     │ │ │
│  │  │                                                     │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Open in new tab ↗                              Download  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests
- Citation parser correctly splits text
- Citation enhancement maps sources to URLs
- Unknown sources handled gracefully

### Integration Tests
- Click citation → modal opens with correct PDF
- Multiple citations in same message work
- Keyboard navigation functions correctly

### Manual Testing
- PDF loads in all major browsers
- Mobile PDF viewing works
- Large PDFs don't crash browser

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Citation click rate | > 15% of users click at least one |
| PDF load success | > 99% |
| Time to open PDF | < 500ms |
| User trust score | Measurable via feedback |

---

## References

- [Raw Idea](./planning/raw-idea.md)
- [Document URL Mapping](../../../apps/web/src/lib/documentUrls.ts)
- [Chat Panel Component](../../../apps/web/src/components/chat/ChatPanel.tsx)
