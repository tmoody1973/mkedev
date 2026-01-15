# Clickable Citation Links - Implementation Tasks

## Overview

Implementation tasks for adding clickable inline citations with PDF viewer modal.

**Spec**: [spec.md](./spec.md)

---

## Task Groups

### Group 1: Foundation

#### Task 1.1: Update documentUrls.ts
- [x] Add missing area plan documents to registry
- [x] Add category field to document info
- [x] Create `getAllDocuments()` export function
- [x] Test URL matching with actual RAG sourceName values

**Files**: `apps/web/src/lib/documentUrls.ts`

#### Task 1.2: Create citation utilities
- [x] Create `citations.ts` utility module
- [x] Add `parseCitationMarkers()` function
- [x] Add `enhanceCitations()` function to map RAG citations to URLs
- [x] Export `EnhancedCitation` type

**Files**: `apps/web/src/lib/citations.ts`

---

### Group 2: Components

#### Task 2.1: Create CitationText component
- [x] Create component that parses text with [N] patterns
- [x] Render citations as clickable styled buttons
- [x] Add hover tooltip with title and excerpt preview
- [x] Handle missing citations gracefully

**Files**: `apps/web/src/components/chat/CitationText.tsx`

#### Task 2.2: Create SourcesFooter component
- [x] Create component listing all cited sources
- [x] Show citation number, title, and category
- [x] Make each source clickable
- [x] Group by category (zoning codes vs area plans)

**Files**: `apps/web/src/components/chat/SourcesFooter.tsx`

#### Task 2.3: Create PDFViewerModal component
- [x] Create modal component with iframe PDF viewer
- [x] Support page number navigation via URL fragment
- [x] Add header with document title
- [x] Add "Open in new tab" and "Download" links
- [x] Handle escape key and click outside to close
- [x] Apply neobrutalist styling

**Files**: `apps/web/src/components/ui/PDFViewerModal.tsx`

---

### Group 3: Integration

#### Task 3.1: Integrate into ChatPanel
- [x] Import citation components
- [x] Add state for selected citation and modal
- [x] Update MessageBubble to use CitationText
- [x] Add SourcesFooter below messages with citations
- [x] Wire up modal open/close

**Files**: `apps/web/src/components/chat/ChatPanel.tsx`

#### Task 3.2: Update agent system prompt
- [x] Add citation format instructions to SYSTEM_INSTRUCTION
- [x] Explain [N] pattern usage
- [x] Provide examples of proper citation placement

**Files**: `apps/web/convex/agents/zoning.ts`

#### Task 3.3: Pass citations through tool results
- [x] Ensure RAG citations flow through to frontend
- [x] Map tool result citations to enhanced citations
- [x] Update hook to expose citations

**Files**: `apps/web/src/hooks/useZoningAgent.ts`

---

### Group 4: Enhancement (Optional)

#### Task 4.1: Improve RAG citation extraction
- [ ] Extract excerpt text from groundingSupports.segment.text
- [ ] Extract page numbers if available in metadata
- [ ] Add confidence scores to citations

**Files**: `apps/web/convex/ingestion/ragV2.ts`

---

## Implementation Order

1. **Foundation first**: Tasks 1.1, 1.2
2. **Components**: Tasks 2.1, 2.2, 2.3 (can be parallel)
3. **Integration**: Tasks 3.1, 3.2, 3.3
4. **Enhancement**: Task 4.1 (optional, can be done later)

---

## Definition of Done

- [x] Citations render as clickable [N] links in response text
- [x] Clicking citation opens PDF viewer modal
- [x] Modal shows correct document
- [x] Sources listed at bottom of response
- [x] Agent uses citation format in responses
- [x] Keyboard accessible (Tab to citations, Escape to close modal)
- [x] Works with existing RAG citations
