# Specification: Forms Integration for RAG

## Goal

Extend the document ingestion pipeline to support actionable application forms, enabling the AI to not only explain permit processes but also provide direct download links and guide users through form completion.

## User Stories

- As a property owner, I want to know which forms I need for a zoning variance so I can download them immediately
- As a developer, I want step-by-step guidance on filling out permit applications
- As an investor, I want to understand all paperwork requirements before starting a project
- As a user, I want download links alongside explanations so I can take immediate action

## Problem Statement

**Current State (Zoneomics-style)**:
- User asks: "How do I apply for a zoning variance?"
- System: Returns PDF or text explaining the process
- User must: Navigate to city website, find correct form, figure out requirements

**Desired State (MKE.dev)**:
- User asks: "How do I apply for a zoning variance?"
- System:
  1. Explains the variance process (RAG from zoning code)
  2. Lists required forms with **download links**
  3. Shows requirements checklist from the form itself
  4. Offers to walk through each section
  5. Provides estimated completion time and fees

## Technical Approach

### 1. Extended Document Schema

Add form-specific metadata to the documents table:

```typescript
// In schema.ts - extend documents table
formMetadata: v.optional(v.object({
  downloadUrl: v.string(),           // Direct link to blank form
  formNumber: v.optional(v.string()), // e.g., "DCD-101"
  department: v.optional(v.string()), // e.g., "Department of City Development"
  feeAmount: v.optional(v.number()),  // Application fee in dollars
  estimatedTime: v.optional(v.string()), // e.g., "15-20 minutes"
  requirements: v.optional(v.array(v.string())), // Pre-filled from form analysis
})),
```

### 2. New Document Category

Add `"forms"` to the document category union:

```typescript
category: v.union(
  v.literal("zoning-codes"),
  v.literal("area-plans"),
  v.literal("policies"),
  v.literal("ordinances"),
  v.literal("guides"),
  v.literal("forms")  // NEW
),
```

### 3. Forms Corpus Configuration

```typescript
// In corpus-config.ts - add forms section
export const FORM_SOURCES: CorpusSource[] = [
  {
    id: "form-zoning-permit",
    title: "Zoning Permit Application",
    category: "forms",
    method: "gemini-file-search",
    source: "data/forms/zoning-permit-application.pdf",
    description: "Application for zoning permits, conditional uses, and variances",
    downloadUrl: "https://city.milwaukee.gov/DCD/forms/zoning-permit.pdf",
    formNumber: "DCD-101",
    department: "Department of City Development",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "form-building-permit",
    title: "Building Permit Application",
    category: "forms",
    method: "gemini-file-search",
    source: "data/forms/building-permit-application.pdf",
    description: "Application for new construction, alterations, and repairs",
    downloadUrl: "https://city.milwaukee.gov/DNS/forms/building-permit.pdf",
    formNumber: "DNS-201",
    department: "Department of Neighborhood Services",
    autoRefresh: false,
    priority: 1,
  },
  // Add more forms as collected
];
```

### 4. Form-Aware RAG Response

The RAG system should detect when forms are relevant and include actionable metadata:

```typescript
interface FormAwareResponse extends GroundedResponse {
  relatedForms?: Array<{
    formId: string;
    formName: string;
    formNumber: string;
    downloadUrl: string;
    department: string;
    feeAmount?: number;
    requirements?: string[];
  }>;
}
```

### 5. FormActionCard Component (CopilotKit)

```typescript
// Component for rendering form actions in chat
interface FormActionCardData {
  type: "form-action";
  data: {
    formName: string;
    formNumber: string;
    downloadUrl: string;
    department: string;
    estimatedTime?: string;
    feeAmount?: number;
    requirements?: string[];
  };
}
```

Visual design:
```
┌─────────────────────────────────────────────┐
│ 📋 Zoning Permit Application                │
│    Form DCD-101                             │
├─────────────────────────────────────────────┤
│ Department: City Development                │
│ Fee: $150                                   │
│ Est. Time: 15-20 minutes                    │
├─────────────────────────────────────────────┤
│ Requirements:                               │
│ □ Completed application form                │
│ □ Site plan (to scale)                      │
│ □ Proof of ownership                        │
│ □ Description of proposed use               │
├─────────────────────────────────────────────┤
│ [Download Form]  [Walk Me Through It]       │
└─────────────────────────────────────────────┘
```

### 6. Form Guidance System Prompt

Add a specialized system prompt for form-related queries:

```typescript
const FORM_GUIDANCE_PROMPT = `You are helping a user complete a Milwaukee city application form. Your role is to:

1. Explain each section of the form clearly
2. Provide examples of acceptable responses
3. Highlight common mistakes to avoid
4. Note which fields are required vs optional
5. Explain any technical terms

When walking through a form:
- Go section by section
- Pause after each major section to check understanding
- Relate requirements back to the user's specific project if known

Always remind users:
- This is general guidance, not legal advice
- Complex projects may benefit from professional assistance
- Forms and requirements may change; verify with the city
`;
```

## User Experience Flows

### Flow 1: Form Discovery

```
User: "What forms do I need to open a restaurant in Bay View?"

AI: To open a restaurant, you'll typically need:

1. **Zoning Permit** - Verifies the location allows restaurant use
   [FormActionCard: DCD-101]

2. **Building Permit** - If doing any construction or alterations
   [FormActionCard: DNS-201]

3. **Food Dealer License** - From the Health Department
   [FormActionCard: HEALTH-301]

4. **Alcohol License** (if applicable) - From City Clerk
   [FormActionCard: CLERK-401]

Shall I help you understand the zoning requirements first, or would you like to start with the application forms?
```

### Flow 2: Form Walkthrough

```
User: "Walk me through the zoning permit application"

AI: I'll guide you through the Zoning Permit Application (DCD-101).

**Section 1: Applicant Information**
This section needs your contact details:
- Your full legal name
- Mailing address
- Phone number and email
- Your relationship to the property (owner, tenant, contractor)

Do you have this information ready? Any questions before we continue?

User: "Yes, what's next?"

AI: **Section 2: Property Information**
You'll need:
- Property address (must match city records exactly)
- Tax key number (I can look this up if you give me the address)
- Current zoning district (I can tell you this from the map)
- Proposed use for the property

What's the property address you're working with?
```

### Flow 3: Intelligent Form Selection

```
User: "I want to convert my duplex to a triplex"

AI: Converting a duplex to triplex involves several steps. Based on your project:

**Zoning Check**: First, let me verify if your property allows 3-unit residential.
[Shows map with property highlighted, zoning overlay]

Your property is in **RM3** (Residential, Moderate Density). Good news - triplex is a permitted use!

**Required Forms**:
1. [FormActionCard: Building Permit - for structural changes]
2. [FormActionCard: Zoning Certificate - to confirm compliance]

**May Be Required**:
- Variance application (if parking cannot be accommodated)
- Historic review (if in a historic district)

Would you like me to check if there are any overlay zones that might affect your project?
```

## Document Inventory: Milwaukee Forms

### Priority 1 (Core Permits)
| Form | Source | Department |
|------|--------|------------|
| Zoning Permit Application | DCD | City Development |
| Building Permit Application | DNS | Neighborhood Services |
| Certificate of Occupancy | DNS | Neighborhood Services |
| Variance Application | BOZA | Board of Zoning Appeals |
| Conditional Use Application | CPC | City Plan Commission |

### Priority 2 (Business/Use Specific)
| Form | Source | Department |
|------|--------|------------|
| Food Dealer License | Health | Health Department |
| Liquor License Application | Clerk | City Clerk |
| Sign Permit Application | DNS | Neighborhood Services |
| Special Event Permit | DPW | Public Works |

### Priority 3 (Specialized)
| Form | Source | Department |
|------|--------|------------|
| Historic Preservation CoA | HPC | Historic Preservation |
| Planned Development Application | CPC | City Plan Commission |
| Tax Increment Financing Application | DCD | City Development |

## Integration Points

### With Existing Agents

- **Zoning Interpreter**: After explaining zoning requirements, offer relevant forms
- **Permit Navigator**: Core agent for form guidance and process explanation
- **Incentives Navigator**: Include TIF/incentive application forms

### With Map

- Property selection → automatic form pre-population suggestions
- Show "Forms Available" indicator on parcels with active permit history

### With CopilotKit

- FormActionCard renders in chat responses
- "Walk Me Through" button triggers step-by-step guidance mode
- Checklist state can be saved per user session

## Out of Scope

- Online form submission (users must download and submit to city)
- Form pre-filling (privacy/legal concerns)
- Payment processing
- Multi-language form translations (future phase)

## Success Criteria

- [ ] All Priority 1 forms uploaded to Gemini File Search
- [ ] FormActionCard component renders correctly in chat
- [ ] RAG queries return relevant forms with download links
- [ ] "Walk Me Through" flow works for at least 3 forms
- [ ] Users can go from question → form download in under 30 seconds

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `convex/schema.ts` | Modify | Add `formMetadata` field |
| `convex/ingestion/corpus-config.ts` | Modify | Add `FORM_SOURCES` |
| `convex/ingestion/rag.ts` | Modify | Add form-aware response logic |
| `data/forms/` | Create | Directory for form PDFs |
| `components/cards/FormActionCard.tsx` | Create | CopilotKit card component |
| `lib/form-guidance.ts` | Create | Form walkthrough logic |
