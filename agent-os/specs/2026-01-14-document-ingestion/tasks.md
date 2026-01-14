# Task Breakdown: Document Ingestion Pipeline

## Overview
Total Tasks: 4 Task Groups | Phase A: Zoning Codes Only (~5.7 MB)

This breakdown implements document ingestion for the Milwaukee zoning code PDFs using Gemini Files API, enabling grounded RAG responses.

---

## Task List

### Task Group 1: Convex Schema & Setup ✅
**Dependencies:** None

- [x] 1.0 Complete Convex schema and setup
  - [x] 1.1 Update documents table schema
    - Add geminiFileUri field (optional string)
    - Add geminiFileName field (optional string)
    - Add uploadedAt field (optional number)
    - Add expiresAt field (optional number)
    - Add status field (pending | uploaded | expired | error)
    - Add errorMessage field (optional string)
    - Add index by_status and by_expiresAt
    - Files: `/apps/web/convex/schema.ts`
  - [x] 1.2 Generate Convex types
    - Run `npx convex dev` to regenerate types
    - Verify _generated types include new fields
  - [x] 1.3 Add GOOGLE_GEMINI_API_KEY to Convex environment
    - Add via Convex dashboard or CLI
    - Verify accessible in actions via `process.env`
  - [x] 1.4 Create documents seed mutation
    - Create mutation to seed document records from corpus-config
    - Initialize all PDF_SOURCES with status: 'pending'
    - Files: `/apps/web/convex/ingestion/documents.ts`

**Acceptance Criteria:**
- ✅ Schema updated with Gemini file tracking fields
- ✅ Documents table seeded with 12 zoning code entries
- ✅ API key accessible in Convex actions

---

### Task Group 2: Gemini Files Upload Action ✅
**Dependencies:** Task Group 1

- [x] 2.0 Complete Gemini Files upload action
  - [x] 2.1 Install @google/genai package
    - Run `pnpm add @google/genai` in apps/web
    - Verify package.json updated
  - [x] 2.2 Create uploadDocument script
    - Local script reads PDF files from filesystem
    - Upload to Gemini Files API via resumable upload
    - Return file URI and metadata
    - Files: `/apps/web/scripts/upload-documents.ts`
  - [x] 2.3 Create updateDocumentStatus mutation
    - Update document record with file URI
    - Set uploadedAt and expiresAt timestamps
    - Update status to 'uploaded' or 'error'
    - Files: `/apps/web/convex/ingestion/documents.ts`
  - [x] 2.4 Create uploadAllDocuments command
    - Iterate through all pending documents
    - Upload each and update status
    - Handle errors per-document (don't fail all)
    - Return summary of uploads
    - Usage: `pnpm upload-docs`
  - [x] 2.5 Add package.json scripts
    - `pnpm upload-docs` - upload all
    - `pnpm upload-docs:zoning` - upload zoning only
    - `pnpm upload-docs:status` - show corpus status

**Acceptance Criteria:**
- ✅ Single document uploads successfully
- ✅ File URI stored in Convex
- ✅ Expiration timestamp set (48 hours from upload)
- ✅ All 12 zoning PDFs uploadable via upload script

---

### Task Group 3: RAG Query Action ✅
**Dependencies:** Task Group 2

- [x] 3.0 Complete RAG query action
  - [x] 3.1 Create queryDocuments action
    - Accept question string and optional sourceIds
    - Retrieve file URIs from documents table
    - Construct Gemini prompt with file references
    - Request grounded response
    - Parse and return structured answer
    - Files: `/apps/web/convex/ingestion/rag.ts`
  - [x] 3.2 Define GroundedResponse type
    - answer: string
    - citations: array of {sourceId, sourceName, excerpt}
    - confidence: number (0-1)
    - Files: `/apps/web/convex/ingestion/types.ts`
  - [x] 3.3 Implement citation extraction
    - Parse Gemini response for source references
    - Map to document metadata
    - Include relevant excerpts
  - [x] 3.4 Create askZoningQuestion convenience function
    - Wrapper that queries only zoning-codes category
    - Includes system prompt for zoning expertise
    - Files: `/apps/web/convex/ingestion/rag.ts`
  - [x] 3.5 Create testQuery action
    - Quick test function for RAG verification
    - Uses sample zoning question
    - Files: `/apps/web/convex/ingestion/rag.ts`

**Acceptance Criteria:**
- ✅ RAG query returns accurate answers
- ✅ Citations reference specific documents
- ✅ Answers grounded in uploaded PDFs
- ✅ System handles missing documents gracefully

---

### Task Group 4: Refresh Cron & Manual Trigger ✅
**Dependencies:** Task Group 3

- [x] 4.0 Complete document refresh system
  - [x] 4.1 Create refreshExpiredDocuments script command
    - Query documents where expiresAt < now + 6 hours
    - Re-upload each to Gemini Files API
    - Update file URIs and timestamps
    - Usage: `pnpm upload-docs --refresh`
    - Files: `/apps/web/scripts/upload-documents.ts`
  - [x] 4.2 Add daily cron job
    - Schedule for 6:00 AM UTC daily
    - Marks expired documents for re-upload
    - Files: `/apps/web/convex/crons.ts`
  - [x] 4.3 Create getExpiring query
    - Query documents expiring within threshold
    - Supports configurable withinMs parameter
    - Files: `/apps/web/convex/ingestion/documents.ts`
  - [x] 4.4 Add getStatus query
    - Return document upload status summary
    - Shows: uploaded count, expired count, error count
    - Shows: file URIs by category
    - Files: `/apps/web/convex/ingestion/documents.ts`
  - [x] 4.5 Add resetDocument mutation
    - Reset single document to pending for re-upload
    - Clears file URI and expiration
    - Files: `/apps/web/convex/ingestion/documents.ts`

**Acceptance Criteria:**
- ✅ Daily cron marks expired documents
- ✅ Manual refresh via script command
- ✅ Status query shows corpus health
- ✅ Documents can be reset and re-uploaded

---

## Execution Order

```
Phase A: Zoning Codes (Day 1-2)
├── Task Group 1: Schema & Setup (2-3 hours)
├── Task Group 2: Upload Action (3-4 hours)
├── Task Group 3: RAG Query (3-4 hours)
└── Task Group 4: Refresh System (2-3 hours)

Phase B: Area Plans (Later)
└── Add Priority 2 PDFs using same infrastructure
```

---

## Dependencies Graph

```
1 (Schema)
└── 2 (Upload)
    └── 3 (RAG Query)
        └── 4 (Refresh)
```

---

## Test Questions for Validation

After implementation, verify with these questions:

```
1. "What uses are permitted by right in RS6 zoning?"
   Expected: Answer from CH295-sub2.pdf (Residential Districts)

2. "What is the maximum building height in the LB2 district?"
   Expected: Answer from CH295-sub3.pdf (Commercial Districts)

3. "How many parking spaces are required for a restaurant?"
   Expected: Answer from CH295-sub9.pdf (Parking and Loading)

4. "What are the setback requirements for downtown districts?"
   Expected: Answer from CH295-sub4.pdf (Downtown Districts)

5. "Can I build a duplex in an RM3 zone?"
   Expected: Answer from CH295-sub2.pdf with use table reference
```

---

## Environment Variables Required

```bash
# Convex Environment Variables (via dashboard)
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

---

## File Structure After Implementation

```
apps/web/convex/
├── schema.ts                    # Updated with Gemini fields
├── crons.ts                     # Add refresh cron
└── ingestion/
    ├── corpus-config.ts         # Existing
    ├── documents.ts             # Document CRUD operations
    ├── gemini.ts                # Gemini Files API actions
    ├── rag.ts                   # RAG query actions
    └── types.ts                 # Shared types
```
