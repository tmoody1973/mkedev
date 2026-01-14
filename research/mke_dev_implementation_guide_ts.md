# **PRD Addendum: TypeScript Implementation Guide for MKE.dev**

## **1. Introduction**

This document serves as a technical addendum to the main MKE.dev Product Requirements Document (PRD). Its purpose is to provide a detailed implementation guide for developers using a **TypeScript-first** stack. It adapts the architecture from the [CopilotKit A2A Travel Example](https://github.com/CopilotKit/a2a-travel) to use **Google ADK for TypeScript** for all backend agents.

The guide is structured to be understood and executed by a developer or a code-generation AI like Claude.

## **2. Core Architecture**

We will maintain the decoupled, multi-agent architecture from the reference example. The key change is that all specialized agents will be built as standalone **Node.js/TypeScript** applications, rather than Python/FastAPI applications.

- **Frontend:** Next.js + CopilotKit (Unchanged)
- **Middleware:** `@ag-ui/a2a-middleware` in `app/api/copilotkit/route.ts` (Unchanged)
- **Agents:** Standalone Node.js servers running ADK TypeScript agents, exposed via the A2A protocol.

## **3. Proposed Directory Structure**

The project structure is updated to reflect a full-stack TypeScript monorepo approach.

```
mke-dev/
├── apps/
│   ├── web/                          # Next.js Frontend App
│   │   ├── app/
│   │   │   ├── api/copilotkit/route.ts # CopilotKit middleware
│   │   │   └── page.tsx
│   │   ├── components/
│   │   └── ...
│   └── agents/                       # All ADK TypeScript Agents
│       ├── feasibility-analyst/
│       ├── zoning-interpreter/
│       ├── incentives-navigator/
│       ├── design-advisor/
│       └── real-estate-finder/
│
├── packages/
│   └──- mke-types/                   # Shared types (Zod schemas)
│
└── package.json                      # Monorepo root
```

## **4. Agent Implementation (Google ADK for TypeScript)**

Each agent will be a self-contained Node.js application that:
1.  Defines an ADK `LlmAgent`.
2.  Uses the `@a2a-js/sdk` to create an A2A-compliant server (e.g., using Express).
3.  This makes the ADK agent callable by the A2A middleware in the Next.js app.

### **4.1 Data Models (Zod)**

We will use `zod` to define the data structures for agent inputs and outputs, replacing Python's Pydantic. These schemas will be in the shared `packages/mke-types` directory.

**`packages/mke-types/src/index.ts`**
```typescript
import { z } from 'zod';

export const ZoningAnalysisSchema = z.object({
  parcelId: z.string(),
  address: z.string(),
  zoningCode: z.string(),
  isPermitted: z.boolean(),
  summary: z.string(),
  citations: z.array(z.string()),
});

export type ZoningAnalysis = z.infer<typeof ZoningAnalysisSchema>;
// ... other schemas like IncentivePackage, ArchitecturalPreview etc.
```

### **4.2 Specialized Agent Example: `zoning-interpreter`**

This agent interprets zoning code. It will be a Node.js server.

**`apps/agents/zoning-interpreter/src/agent.ts`**
```typescript
import { LlmAgent } from '@google/adk';
import { ZoningAnalysisSchema } from 'mke-types';

export const zoningInterpreterAgent = new LlmAgent({
  name: 'zoning_interpreter',
  model: 'gemini-2.5-flash',
  description: 'An agent that interprets Milwaukee zoning code for specific parcels',
  instruction: `You are a zoning code interpreter... Return ONLY a valid JSON object that conforms to the provided schema.`,
  responseSchema: ZoningAnalysisSchema,
});
```

**`apps/agents/zoning-interpreter/src/server.ts`**
```typescript
import express from 'express';
import { A2AServer, AgentExecutor, RequestContext, EventQueue, newAgentTextMessage } from '@a2a-js/sdk';
import { zoningInterpreterAgent } from './agent';

class ZoningAgentExecutor implements AgentExecutor {
  async execute(context: RequestContext, eventQueue: EventQueue): Promise<void> {
    const query = context.get_user_input();
    const adkResponse = await zoningInterpreterAgent.run({ input: query });

    // ADK's responseSchema ensures the output is valid JSON
    const finalContent = JSON.stringify(adkResponse.output);
    await eventQueue.enqueue(newAgentTextMessage(finalContent));
  }
}

const app = express();
A2AServer.expose(app, new ZoningAgentExecutor(), {
    name: 'Zoning Interpreter',
    description: 'ADK-powered agent that interprets Milwaukee zoning code',
    // ... other agent card details
});

const port = process.env.ZONING_PORT || 9001;
app.listen(port, () => {
  console.log(`🏛️ Zoning Interpreter Agent (ADK-TS + A2A) on http://localhost:${port}`);
});
```

This pattern is repeated for all other specialized agents (`incentives-navigator`, `design-advisor`, etc.).

### **4.3 Orchestrator (`feasibility-analyst`)**

The orchestrator is also an ADK TypeScript agent, but its primary role is to call the other agents via the A2A middleware. Its logic will be defined in the `instructions` prompt within the frontend's `route.ts` file, exactly as in the reference architecture.

## **5. Step-by-Step Migration Plan (TypeScript)**

**Phase 1: Project & Agent Setup**
1.  Set up a new monorepo (e.g., using `npm workspaces` or `pnpm`).
2.  Create the `apps/web` Next.js project and the `apps/agents/*` Node.js projects.
3.  In each agent project, install dependencies: `@google/adk`, `@a2a-js/sdk`, `express`, `zod`, `ts-node`.
4.  Define all shared Zod schemas in the `packages/mke-types` workspace.
5.  For each agent, create the `agent.ts` file defining the `LlmAgent` and the `server.ts` file to expose it via the A2A SDK and Express.

**Phase 2: Frontend & Middleware Setup (Largely Unchanged)**
1.  The `apps/web/app/api/copilotkit/route.ts` file remains the central point of integration. Update the agent URLs to point to the new TypeScript agent servers (e.g., `http://localhost:9001`).
2.  The `instructions` prompt for the orchestrator (`feasibility-analyst`) remains the same, defining the sequential workflow.

**Phase 3: Generative UI & Chat Integration (Unchanged)**
1.  The implementation of `civic-chat.tsx`, the `useCopilotAction` hooks, and the custom card components (`ZoneInfoCard.tsx`, etc.) does not change, as it's already in TypeScript and only depends on the JSON data structures, which are now defined with Zod.

**Phase 4: Testing and Refinement**
1.  Run all agent servers and the Next.js web app concurrently (e.g., using `concurrently`).
2.  Test the end-to-end flow: click a parcel on the map, verify the orchestrator calls each TypeScript agent in sequence, and check that the final generative UI card is rendered correctly.


---

## **6. Complete Code Examples**

The following sections provide ready-to-use starter code for the key components of the MKE.dev application.

### **6.1 Shared Types (`packages/mke-types/src/index.ts`)**

This file contains all the Zod schemas that define the data contracts between agents and the frontend.

```typescript
import { z } from 'zod';

// ============================================================
// Zoning Interpreter Agent Types
// ============================================================
export const ZoningAnalysisSchema = z.object({
  parcelId: z.string().describe('The unique identifier for the parcel (e.g., TAXKEY)'),
  address: z.string().describe('The full street address of the parcel'),
  zoningCode: z.string().describe('The official zoning classification (e.g., RS6, LB2, RM3)'),
  zoningName: z.string().describe('The human-readable name of the zoning district'),
  isPermitted: z.boolean().describe('Whether the user query is permitted under this zoning'),
  summary: z.string().describe('A plain-language summary of the zoning rules and the answer to the user query'),
  citations: z.array(z.string()).describe('Specific sections of the zoning code cited'),
  maxHeight: z.number().optional().describe('Maximum building height in feet, if applicable'),
  maxDensity: z.string().optional().describe('Maximum density (e.g., "1 unit per 2,500 sq ft")'),
  setbacks: z.object({
    front: z.number().optional(),
    side: z.number().optional(),
    rear: z.number().optional(),
  }).optional().describe('Required setbacks in feet'),
});
export type ZoningAnalysis = z.infer<typeof ZoningAnalysisSchema>;

// ============================================================
// Incentives Navigator Agent Types
// ============================================================
export const IncentiveSchema = z.object({
  name: z.string().describe('The name of the incentive program'),
  type: z.enum(['TIF', 'Opportunity Zone', 'Historic Tax Credit', 'Grant', 'Loan', 'Other']),
  description: z.string().describe('A brief description of the incentive'),
  eligibility: z.string().describe('Key eligibility criteria'),
  estimatedBenefit: z.string().optional().describe('Estimated financial benefit (e.g., "Up to 20% tax abatement")'),
  link: z.string().url().describe('URL to the official program page'),
});
export type Incentive = z.infer<typeof IncentiveSchema>;

export const IncentivePackageSchema = z.object({
  parcelId: z.string(),
  address: z.string(),
  incentives: z.array(IncentiveSchema),
  totalEstimatedBenefit: z.string().optional(),
});
export type IncentivePackage = z.infer<typeof IncentivePackageSchema>;

// ============================================================
// Design Advisor Agent Types
// ============================================================
export const ArchitecturalPreviewSchema = z.object({
  parcelId: z.string(),
  address: z.string(),
  imageUrl: z.string().url().describe('URL of the generated architectural preview image'),
  caption: z.string().describe('A description of the generated image'),
  style: z.string().describe('The architectural style applied (e.g., Cream City Brick, Modern)'),
  constraintsApplied: z.array(z.string()).describe('List of zoning/design constraints incorporated'),
  designOverlayZone: z.string().optional().describe('Name of the design overlay zone, if any'),
});
export type ArchitecturalPreview = z.infer<typeof ArchitecturalPreviewSchema>;

// ============================================================
// Feasibility Report (Synthesized by Orchestrator)
// ============================================================
export const FeasibilityReportSchema = z.object({
  parcelId: z.string(),
  address: z.string(),
  zoning: ZoningAnalysisSchema,
  incentives: IncentivePackageSchema,
  designGuidance: z.object({
    overlayZone: z.string().optional(),
    guidelines: z.array(z.string()),
  }).optional(),
  architecturalPreview: ArchitecturalPreviewSchema.optional(),
  overallFeasibility: z.enum(['High', 'Medium', 'Low', 'Not Feasible']),
  summary: z.string().describe('A comprehensive summary of the development feasibility'),
});
export type FeasibilityReport = z.infer<typeof FeasibilityReportSchema>;
```

### **6.2 Zoning Interpreter Agent (`apps/agents/zoning-interpreter/src/index.ts`)**

This is a complete, runnable TypeScript agent using Google ADK.

```typescript
import express, { Request, Response } from 'express';
import { LlmAgent, defineTool } from '@google/adk';
import { z } from 'zod';
import { ZoningAnalysisSchema } from 'mke-types';

// --- Define Tools ---
const queryZoningCodeTool = defineTool({
  name: 'query_zoning_code',
  description: 'Queries the Milwaukee Zoning Code PDF to find relevant sections based on a zoning classification and user question.',
  inputSchema: z.object({
    zoningCode: z.string().describe('The zoning classification (e.g., RS6, LB2)'),
    question: z.string().describe('The user question about what is permitted'),
  }),
  outputSchema: z.object({
    relevantSections: z.array(z.string()),
    summary: z.string(),
  }),
  handler: async ({ zoningCode, question }) => {
    // In production, this would call the Gemini File Search API
    // For now, return a mock response
    console.log(`[Tool] Querying zoning code for ${zoningCode}: "${question}"`);
    return {
      relevantSections: ['Section 295-505-2', 'Section 295-505-3'],
      summary: `Based on ${zoningCode} regulations, ADUs are permitted as accessory uses in single-family residential districts.`,
    };
  },
});

const getParcelDataTool = defineTool({
  name: 'get_parcel_data',
  description: 'Retrieves parcel data from the Milwaukee ESRI ArcGIS REST API.',
  inputSchema: z.object({
    parcelId: z.string().describe('The TAXKEY or parcel ID'),
  }),
  outputSchema: z.object({
    address: z.string(),
    zoningCode: z.string(),
    lotSize: z.number(),
  }),
  handler: async ({ parcelId }) => {
    // In production, this would call the ESRI ArcGIS API
    console.log(`[Tool] Fetching parcel data for ${parcelId}`);
    return {
      address: '2847 N. Fratney St, Milwaukee, WI 53212',
      zoningCode: 'RS6',
      lotSize: 5000,
    };
  },
});

// --- Define the Agent ---
export const zoningInterpreterAgent = new LlmAgent({
  name: 'zoning_interpreter',
  model: 'gemini-2.5-flash',
  description: 'An expert agent that interprets Milwaukee zoning code for specific parcels and answers questions about permitted uses, setbacks, height limits, and density.',
  instruction: `You are a Milwaukee Zoning Code expert. Your role is to:
1. Receive a parcel ID and a user question about what can be built on that parcel.
2. Use the 'get_parcel_data' tool to retrieve the parcel's zoning classification.
3. Use the 'query_zoning_code' tool to find relevant sections of the Milwaukee Zoning Code.
4. Synthesize the information into a clear, accurate answer.

IMPORTANT:
- Always cite specific sections of the zoning code.
- If something is NOT permitted, explain why and suggest alternatives if possible.
- Your final response MUST be a valid JSON object conforming to the ZoningAnalysis schema.
`,
  tools: [queryZoningCodeTool, getParcelDataTool],
  // Note: responseSchema is not yet fully supported in adk-js, so we enforce via prompt
});

// --- Create Express Server with A2A-like endpoint ---
const app = express();
app.use(express.json());

// Simple A2A-compatible endpoint
app.post('/a2a/tasks/send', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const userInput = message?.parts?.[0]?.text || '';

    console.log(`[Zoning Agent] Received: ${userInput}`);

    // Run the ADK agent
    const result = await zoningInterpreterAgent.run({ input: userInput });

    // Return A2A-compatible response
    res.json({
      id: `task-${Date.now()}`,
      status: { state: 'completed' },
      artifacts: [{
        parts: [{ type: 'text', text: JSON.stringify(result.output) }],
      }],
    });
  } catch (error) {
    console.error('[Zoning Agent] Error:', error);
    res.status(500).json({ error: 'Agent execution failed' });
  }
});

// Agent Card endpoint
app.get('/.well-known/agent.json', (req: Request, res: Response) => {
  res.json({
    name: 'Zoning Interpreter',
    description: 'ADK-powered agent that interprets Milwaukee zoning code',
    url: `http://localhost:${process.env.PORT || 9001}`,
    version: '1.0.0',
    capabilities: { streaming: false },
    skills: [
      { id: 'zoning-interpretation', name: 'Zoning Interpretation', description: 'Interprets zoning code for parcels' },
    ],
  });
});

const PORT = process.env.PORT || 9001;
app.listen(PORT, () => {
  console.log(`🏛️ Zoning Interpreter Agent running on http://localhost:${PORT}`);
});
```

### **6.3 CopilotKit API Route (`apps/web/app/api/copilotkit/route.ts`)**

This file connects the Next.js frontend to the TypeScript ADK agents via the A2A middleware.

```typescript
import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import { A2AMiddlewareAgent } from '@ag-ui/a2a-middleware';
import { NextRequest } from 'next/server';

// --- Agent URLs (TypeScript ADK Agents) ---
const AGENT_URLS = {
  zoningInterpreter: process.env.ZONING_AGENT_URL || 'http://localhost:9001',
  incentivesNavigator: process.env.INCENTIVES_AGENT_URL || 'http://localhost:9002',
  designAdvisor: process.env.DESIGN_AGENT_URL || 'http://localhost:9003',
  realEstateFinder: process.env.REALESTATE_AGENT_URL || 'http://localhost:9004',
};

// --- Orchestrator Instructions ---
const ORCHESTRATOR_INSTRUCTIONS = `
You are the MKE.dev Feasibility Analyst, an expert AI assistant for Milwaukee real estate development.

## Your Role
You coordinate a team of specialized AI agents to provide comprehensive development feasibility analysis.

## Available Agents
1. **Zoning Interpreter** (${AGENT_URLS.zoningInterpreter}): Interprets Milwaukee zoning code
2. **Incentives Navigator** (${AGENT_URLS.incentivesNavigator}): Identifies financial incentives (TIF, OZ, etc.)
3. **Design Advisor** (${AGENT_URLS.designAdvisor}): Provides design guidance and generates architectural previews
4. **Real Estate Finder** (${AGENT_URLS.realEstateFinder}): Finds available properties

## Workflow
When a user asks about a specific parcel or development scenario:

1. **ALWAYS start with Zoning Interpreter** to understand what's permitted
2. **Then call Incentives Navigator** to identify financial benefits
3. **If the user asks for a visualization**, call Design Advisor
4. **Synthesize all responses** into a comprehensive answer

## Response Format
- Use the display_feasibility_report action to show comprehensive results
- Use the display_zoning_info action for zoning-only queries
- Use the display_architectural_preview action when showing generated images

## Important Rules
- Always cite your sources (zoning code sections, program names)
- If something is NOT permitted, explain why and suggest alternatives
- Be conversational but professional
- Proactively offer to show architectural previews when discussing building options
`;

// --- A2A Middleware Agent ---
const a2aMiddlewareAgent = new A2AMiddlewareAgent({
  agents: [
    { name: 'zoning_interpreter', url: AGENT_URLS.zoningInterpreter },
    { name: 'incentives_navigator', url: AGENT_URLS.incentivesNavigator },
    { name: 'design_advisor', url: AGENT_URLS.designAdvisor },
    { name: 'real_estate_finder', url: AGENT_URLS.realEstateFinder },
  ],
});

// --- CopilotKit Runtime ---
const runtime = new CopilotRuntime({
  agents: [a2aMiddlewareAgent],
});

const serviceAdapter = new GoogleGenerativeAIAdapter({
  model: 'gemini-2.5-flash',
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
};
```

### **6.4 Civic Chat Component (`apps/web/components/civic-chat.tsx`)**

This component handles the chat UI and generative UI rendering.

```typescript
'use client';

import { useCopilotChat, useCopilotAction } from '@copilotkit/react-core';
import { CopilotChat } from '@copilotkit/react-ui';
import { useEffect, useState } from 'react';
import { ZoneInfoCard } from './cards/ZoneInfoCard';
import { FeasibilityReportCard } from './cards/FeasibilityReportCard';
import { VisionCard } from './cards/VisionCard';
import type { ZoningAnalysis, FeasibilityReport, ArchitecturalPreview } from 'mke-types';

interface CivicChatProps {
  selectedParcel?: { id: string; address: string } | null;
}

export function CivicChat({ selectedParcel }: CivicChatProps) {
  const [zoningData, setZoningData] = useState<ZoningAnalysis | null>(null);
  const [feasibilityReport, setFeasibilityReport] = useState<FeasibilityReport | null>(null);
  const [architecturalPreview, setArchitecturalPreview] = useState<ArchitecturalPreview | null>(null);

  // --- Generative UI Actions ---
  useCopilotAction({
    name: 'display_zoning_info',
    description: 'Display zoning information for a parcel',
    parameters: [
      { name: 'data', type: 'object', description: 'ZoningAnalysis object', required: true },
    ],
    render: ({ args }) => {
      const data = args.data as ZoningAnalysis;
      return <ZoneInfoCard data={data} />;
    },
    handler: async ({ data }) => {
      setZoningData(data as ZoningAnalysis);
      return 'Zoning information displayed';
    },
  });

  useCopilotAction({
    name: 'display_feasibility_report',
    description: 'Display a comprehensive feasibility report',
    parameters: [
      { name: 'data', type: 'object', description: 'FeasibilityReport object', required: true },
    ],
    render: ({ args }) => {
      const data = args.data as FeasibilityReport;
      return <FeasibilityReportCard data={data} />;
    },
    handler: async ({ data }) => {
      setFeasibilityReport(data as FeasibilityReport);
      return 'Feasibility report displayed';
    },
  });

  useCopilotAction({
    name: 'display_architectural_preview',
    description: 'Display an AI-generated architectural preview',
    parameters: [
      { name: 'data', type: 'object', description: 'ArchitecturalPreview object', required: true },
    ],
    render: ({ args }) => {
      const data = args.data as ArchitecturalPreview;
      return <VisionCard data={data} />;
    },
    handler: async ({ data }) => {
      setArchitecturalPreview(data as ArchitecturalPreview);
      return 'Architectural preview displayed';
    },
  });

  // --- Auto-send parcel context when selected ---
  const { append } = useCopilotChat();

  useEffect(() => {
    if (selectedParcel) {
      append({
        role: 'user',
        content: `I've selected a parcel at ${selectedParcel.address} (ID: ${selectedParcel.id}). What can you tell me about it?`,
      });
    }
  }, [selectedParcel, append]);

  return (
    <div className="h-full flex flex-col">
      <CopilotChat
        className="flex-1"
        labels={{
          title: 'MKE.dev Assistant',
          initial: 'Hello! Click on a parcel on the map, or ask me anything about Milwaukee zoning and development.',
        }}
      />
    </div>
  );
}
```

---

## **7. Running the Application**

### **7.1 Prerequisites**
- Node.js 18+ and npm/pnpm
- Google Cloud API key with Gemini API access
- Mapbox API key

### **7.2 Environment Variables**

Create a `.env` file in the root of each project:

**`apps/web/.env.local`**
```
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
MAPBOX_ACCESS_TOKEN=your-mapbox-token
ZONING_AGENT_URL=http://localhost:9001
INCENTIVES_AGENT_URL=http://localhost:9002
DESIGN_AGENT_URL=http://localhost:9003
REALESTATE_AGENT_URL=http://localhost:9004
```

**`apps/agents/zoning-interpreter/.env`**
```
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
PORT=9001
```

### **7.3 Running All Services**

Use a process manager like `concurrently` to run all services:

**`package.json` (root)**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:agents\"",
    "dev:web": "cd apps/web && npm run dev",
    "dev:agents": "concurrently \"npm run dev:zoning\" \"npm run dev:incentives\" \"npm run dev:design\" \"npm run dev:realestate\"",
    "dev:zoning": "cd apps/agents/zoning-interpreter && npx ts-node src/index.ts",
    "dev:incentives": "cd apps/agents/incentives-navigator && npx ts-node src/index.ts",
    "dev:design": "cd apps/agents/design-advisor && npx ts-node src/index.ts",
    "dev:realestate": "cd apps/agents/real-estate-finder && npx ts-node src/index.ts"
  }
}
```

Then run:
```bash
npm run dev
```

---

## **8. References**

| Resource | URL |
| :--- | :--- |
| Google ADK for TypeScript (Docs) | https://google.github.io/adk-docs/get-started/typescript/ |
| Google ADK for TypeScript (GitHub) | https://github.com/google/adk-js |
| CopilotKit A2A Travel Example | https://github.com/CopilotKit/a2a-travel |
| A2A Protocol JavaScript SDK | https://github.com/a2aproject/a2a-js |
| CopilotKit Documentation | https://docs.copilotkit.ai/ |
| Gemini 3 Hackathon | https://gemini3.devpost.com/ |
| Zod Schema Library | https://zod.dev/ |

---

*Document Version: 2.0 (TypeScript Edition)*
*Last Updated: January 2026*
*Author: Manus AI*
