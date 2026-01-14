# Task Breakdown: Forms Integration

## Overview
Total Tasks: 4 Task Groups | Enables actionable permit/application forms in RAG

This breakdown implements form-aware document ingestion and UI components that transform MKE.dev from an informational tool into an actionable civic assistant.

---

## Task List

### Task Group 1: Schema & Data Structure
**Dependencies:** Document Ingestion Pipeline (completed)

- [ ] 1.0 Complete schema and data structure updates
  - [ ] 1.1 Add `forms` category to document category union
    - Update documentCategory in schema.ts
    - Add to corpus-config.ts types
    - Files: `/apps/web/convex/schema.ts`, `/apps/web/convex/ingestion/corpus-config.ts`
  - [ ] 1.2 Add formMetadata field to documents table
    - downloadUrl: string (required for forms)
    - formNumber: optional string
    - department: optional string
    - feeAmount: optional number
    - estimatedTime: optional string
    - requirements: optional array of strings
    - Files: `/apps/web/convex/schema.ts`
  - [ ] 1.3 Create data/forms directory structure
    - Create `/apps/web/data/forms/` directory
    - Add .gitkeep file
  - [ ] 1.4 Update upload script for form metadata
    - Handle formMetadata in corpus-config
    - Store metadata alongside file upload
    - Files: `/apps/web/scripts/upload-documents.ts`

**Acceptance Criteria:**
- Schema accepts form documents with metadata
- Forms category works in queries
- Upload script handles form-specific fields

---

### Task Group 2: Form Documents Collection
**Dependencies:** Task Group 1

- [ ] 2.0 Collect and configure form documents
  - [ ] 2.1 Download Priority 1 form PDFs
    - Zoning Permit Application
    - Building Permit Application
    - Certificate of Occupancy
    - Variance Application
    - Save to `/apps/web/data/forms/`
  - [ ] 2.2 Add form sources to corpus-config.ts
    - Create FORM_SOURCES array
    - Include all metadata (downloadUrl, formNumber, etc.)
    - Export combined sources
    - Files: `/apps/web/convex/ingestion/corpus-config.ts`
  - [ ] 2.3 Upload forms to Gemini
    - Run upload script for forms category
    - Verify file URIs stored
    - Test basic RAG query on forms
  - [ ] 2.4 Create form requirements extraction query
    - Query each form to extract requirements
    - Store extracted requirements in formMetadata
    - Files: `/apps/web/convex/ingestion/documents.ts`

**Acceptance Criteria:**
- At least 4 Priority 1 forms uploaded
- Form metadata stored in Convex
- RAG can answer questions about form contents

---

### Task Group 3: Form-Aware RAG
**Dependencies:** Task Group 2

- [ ] 3.0 Implement form-aware RAG responses
  - [ ] 3.1 Create getRelatedForms query
    - Query forms by keyword/category
    - Return form metadata with download URLs
    - Files: `/apps/web/convex/ingestion/documents.ts`
  - [ ] 3.2 Update RAG response type
    - Add relatedForms field to GroundedResponse
    - Include form metadata in response
    - Files: `/apps/web/convex/ingestion/types.ts`
  - [ ] 3.3 Implement form detection in RAG query
    - Detect permit/application-related questions
    - Automatically include relevant forms
    - Files: `/apps/web/convex/ingestion/rag.ts`
  - [ ] 3.4 Create askPermitQuestion convenience action
    - Specialized query for permit processes
    - Always includes form recommendations
    - Uses permit-focused system prompt
    - Files: `/apps/web/convex/ingestion/rag.ts`
  - [ ] 3.5 Add form guidance system prompt
    - Create FORM_GUIDANCE_PROMPT
    - Support step-by-step walkthrough mode
    - Files: `/apps/web/convex/ingestion/rag.ts`

**Acceptance Criteria:**
- RAG responses include relevant forms
- Download URLs returned with answers
- Permit questions get form recommendations

---

### Task Group 4: FormActionCard Component
**Dependencies:** Task Group 3, CopilotKit setup

- [ ] 4.0 Create FormActionCard UI component
  - [ ] 4.1 Create FormActionCard component
    - Display form name, number, department
    - Show fee and estimated time
    - Render requirements checklist
    - Download button with URL
    - "Walk Me Through" action button
    - Files: `/apps/web/src/components/cards/FormActionCard.tsx`
  - [ ] 4.2 Style with RetroUI patterns
    - Neobrutalist border and shadow
    - Proper dark mode support
    - Responsive design
    - Files: `/apps/web/src/components/cards/FormActionCard.tsx`
  - [ ] 4.3 Integrate with CopilotKit message cards
    - Register as card type "form-action"
    - Handle card data structure
    - Files: `/apps/web/src/components/chat/MessageList.tsx` (or equivalent)
  - [ ] 4.4 Implement "Walk Me Through" flow
    - Multi-step form guidance UI
    - Section-by-section progression
    - Context retention between steps
    - Files: `/apps/web/src/components/cards/FormWalkthrough.tsx`
  - [ ] 4.5 Test end-to-end form flow
    - Query → form detection → card render
    - Download link works
    - Walkthrough flow completes

**Acceptance Criteria:**
- FormActionCard renders in chat
- Download links open correct PDFs
- Walkthrough mode works for 1+ form
- Mobile-responsive design

---

## Execution Order

```
Task Group 1: Schema & Data Structure (2-3 hours)
    └── Task Group 2: Form Documents Collection (3-4 hours)
        └── Task Group 3: Form-Aware RAG (3-4 hours)
            └── Task Group 4: FormActionCard Component (4-5 hours)
```

---

## Dependencies Graph

```
1 (Schema)
└── 2 (Forms Collection)
    └── 3 (Form-Aware RAG)
        └── 4 (UI Component)
```

---

## Test Questions for Validation

After implementation, verify with these questions:

```
1. "What forms do I need to open a restaurant?"
   Expected: Lists zoning permit, building permit, food dealer license
   Expected: Each form shows download link

2. "How do I apply for a zoning variance?"
   Expected: Explains process AND shows variance application form
   Expected: FormActionCard renders with requirements

3. "Walk me through the building permit application"
   Expected: Step-by-step guidance mode
   Expected: Sections explained in order

4. "What does section 3 of the zoning permit ask for?"
   Expected: Detailed explanation of that section
   Expected: Examples provided

5. "How much does a building permit cost?"
   Expected: Fee amount from form metadata
   Expected: Link to application form
```

---

## Priority 1 Forms Inventory

| Form | Form Number | Download URL | Department |
|------|-------------|--------------|------------|
| Zoning Permit Application | DCD-101 | TBD | City Development |
| Building Permit Application | DNS-201 | TBD | Neighborhood Services |
| Certificate of Occupancy | DNS-202 | TBD | Neighborhood Services |
| Variance Application | BOZA-101 | TBD | Board of Zoning Appeals |
| Conditional Use Application | CPC-101 | TBD | City Plan Commission |

**Note:** Download URLs to be confirmed from city.milwaukee.gov

---

## File Structure After Implementation

```
apps/web/
├── convex/
│   ├── schema.ts                    # Updated with formMetadata
│   └── ingestion/
│       ├── corpus-config.ts         # Added FORM_SOURCES
│       ├── documents.ts             # Added getRelatedForms
│       ├── rag.ts                   # Form-aware queries
│       └── types.ts                 # FormAwareResponse type
├── data/
│   └── forms/                       # NEW - form PDFs
│       ├── zoning-permit.pdf
│       ├── building-permit.pdf
│       └── ...
├── scripts/
│   └── upload-documents.ts          # Updated for form metadata
└── src/
    └── components/
        └── cards/                   # NEW directory
            ├── FormActionCard.tsx
            └── FormWalkthrough.tsx
```
