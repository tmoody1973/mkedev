# Specification: Document Ingestion Pipeline

## Goal
Create a document ingestion pipeline that uploads Milwaukee zoning codes and planning documents to Gemini, enabling the AI agents to provide accurate, grounded answers with citations from official sources.

## User Stories
- As a user asking about zoning, I want answers grounded in the actual Milwaukee zoning code so that I can trust the information
- As a developer, I want the agent to cite specific sections when answering so users can verify the information
- As an admin, I want to refresh the document corpus when regulations change so the system stays current

## Document Inventory

### Priority 1: Zoning Code PDFs (5.7 MB total)
| Document | Size | Content |
|----------|------|---------|
| CH295-sub1.pdf | 202 KB | General Provisions & Definitions |
| CH295-sub2.pdf | 814 KB | Residential Districts (RS, RT, RM, RO) |
| CH295-sub3.pdf | 371 KB | Commercial Districts (LB, NS, CS, RB) |
| CH295-sub4.pdf | 665 KB | Downtown Districts |
| CH295-sub5.pdf | 862 KB | Industrial Districts (IL, IM, IH) |
| CH295-sub6.pdf | 598 KB | Special Purpose Districts (PD, IC, PS) |
| CH295-sub7.pdf | 461 KB | Overlay Zones |
| CH295-sub8.pdf | 565 KB | Site Development Standards |
| CH295-sub9.pdf | 493 KB | Parking and Loading |
| CH295-sub10.pdf | 210 KB | Signs |
| CH295-SUB11.pdf | 455 KB | Administration |
| CH295table.pdf | 19 KB | Use Tables |

### Priority 2: Area Plans (80 MB total)
| Document | Size | Content |
|----------|------|---------|
| Citywide.pdf | 41.6 MB | Citywide Policy Plan |
| Housing-Element.pdf | 11.2 MB | Housing Element Plan |
| MilwaukeeDowntownPlan.pdf | 27.4 MB | Downtown Area Plan |

## Technical Approach: Gemini Files API

Use Google's Gemini Files API to upload documents and reference them in prompts.

### Why Gemini Files API?
- Native PDF support with vision understanding
- Handles large documents (up to 2GB per file)
- Documents persist for 48 hours (can be refreshed via cron)
- Direct integration with Gemini models
- Supports grounded responses with citations

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Document Ingestion Flow                       │
└─────────────────────────────────────────────────────────────────┘

1. Upload Phase (One-time or Refresh)
   ┌──────────┐     ┌─────────────┐     ┌──────────────┐
   │ PDF Files │ ──▶ │ Gemini Files │ ──▶ │ File URIs    │
   │ (local)   │     │ API Upload   │     │ (48hr TTL)   │
   └──────────┘     └─────────────┘     └──────────────┘

2. Storage (Convex)
   ┌──────────────┐
   │ documents    │  Stores file URIs, metadata, upload timestamps
   │ table        │  Enables refresh tracking and corpus queries
   └──────────────┘

3. Query Phase (Runtime)
   ┌──────────┐     ┌─────────────┐     ┌──────────────┐
   │ User     │ ──▶ │ Gemini API  │ ──▶ │ Grounded     │
   │ Question │     │ + File URIs │     │ Answer       │
   └──────────┘     └─────────────┘     └──────────────┘
```

## Specific Requirements

### 1. Gemini Files Upload Action
- Create Convex action to upload PDFs to Gemini Files API
- Store returned file URIs in Convex `documents` table
- Track upload timestamp for 48-hour refresh logic
- Handle upload errors gracefully

### 2. Document Metadata Storage
- Extend existing `documents` table schema for Gemini file tracking
- Store: fileUri, displayName, mimeType, uploadedAt, expiresAt, sourceId
- Link to corpus-config.ts source definitions

### 3. RAG Query Action
- Create Convex action that:
  1. Retrieves relevant file URIs from documents table
  2. Constructs Gemini prompt with file references
  3. Requests grounded response with citations
  4. Returns answer with source references

### 4. Corpus Refresh Cron
- Daily cron job to re-upload documents before 48-hour expiry
- Only refresh Priority 1 (zoning codes) automatically
- Priority 2 (large plans) refreshed on-demand to save bandwidth

### 5. Manual Ingestion Trigger
- Admin endpoint to trigger immediate re-upload
- Useful after zoning code updates
- Can target specific documents or full corpus

## API Integration

### Gemini Files API Usage
```typescript
import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });

// Upload a file
const uploadResult = await genai.files.upload({
  file: pdfBuffer,
  config: {
    mimeType: 'application/pdf',
    displayName: 'Milwaukee Zoning Code - Subchapter 2'
  }
});

// Use file in prompt
const response = await genai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: [
    {
      parts: [
        { fileData: { fileUri: uploadResult.file.uri, mimeType: 'application/pdf' } },
        { text: 'What are the permitted uses in RS6 zoning district?' }
      ]
    }
  ]
});
```

### Grounded Response Format
```typescript
interface GroundedResponse {
  answer: string;
  citations: Array<{
    sourceId: string;
    sourceName: string;
    excerpt: string;
    pageNumber?: number;
  }>;
  confidence: number;
}
```

## Convex Schema Extension

```typescript
// convex/schema.ts - extend documents table
documents: defineTable({
  // Existing fields
  sourceId: v.string(),
  title: v.string(),
  category: v.string(),

  // New Gemini Files fields
  geminiFileUri: v.optional(v.string()),
  geminiFileName: v.optional(v.string()),
  uploadedAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  status: v.union(
    v.literal('pending'),
    v.literal('uploaded'),
    v.literal('expired'),
    v.literal('error')
  ),
  errorMessage: v.optional(v.string()),
})
  .index('by_sourceId', ['sourceId'])
  .index('by_status', ['status'])
  .index('by_expiresAt', ['expiresAt']),
```

## Out of Scope
- Firecrawl web ingestion (Phase 2)
- Full-text search across documents (use Gemini RAG instead)
- Document chunking/embedding (Gemini handles this natively)
- User-uploaded documents
- Multi-tenant document isolation

## Success Criteria
- All 12 zoning code PDFs uploaded to Gemini Files API
- File URIs stored in Convex with expiration tracking
- RAG query action returns grounded answers with citations
- Daily cron refreshes documents before expiry
- Agent can answer zoning questions with accurate citations
- Large plans (Priority 2) uploadable on-demand
