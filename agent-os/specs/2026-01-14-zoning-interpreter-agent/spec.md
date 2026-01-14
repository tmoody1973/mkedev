# Specification: Zoning Interpreter Agent

## Goal

Create an intelligent conversational agent using Google ADK that helps users understand Milwaukee zoning requirements by asking clarifying questions, geocoding addresses, and providing specific, grounded answers from the zoning code.

## User Stories

- As a restaurant owner, I want to ask "What parking do I need?" and have the agent ask for my address, then give me the exact requirements for my zoning district
- As a developer, I want the agent to proactively gather context (address, use type, square footage) before answering so I get accurate information
- As a homeowner, I want to understand what I can build on my property without needing to know my zoning district code

## Problem Statement

The current RAG system answers questions based on keyword matching, but many zoning questions require:
1. **Location Context**: Parking requirements vary by zoning district
2. **Use Type Context**: A restaurant has different requirements than retail
3. **Dimensional Context**: Building size affects parking ratios

Example interaction showing the problem:
```
User: "How many parking spaces do I need for my restaurant?"
Current RAG: "Restaurants require 1 space per 100 sq ft..." (generic answer)

Better Agent Flow:
User: "How many parking spaces do I need for my restaurant?"
Agent: "I can help you calculate that. What's the address of your restaurant?"
User: "123 N Water St"
Agent: "Got it - that's in the DC Downtown Core district. What's the gross floor area?"
User: "2,500 sq ft"
Agent: "In the DC district, restaurants require 1 space per 400 sq ft, so you'd need 7 spaces. However, DC district has reduced parking requirements and you may qualify for shared parking..."
```

## Technical Approach: Google ADK

### Why Google ADK?

- **Native Gemini Integration**: Designed for Gemini models with seamless tool calling
- **Session Management**: Built-in conversation state with InMemoryRunner or DatabaseRunner
- **Type-Safe Tools**: FunctionTool with Zod schemas for parameter validation
- **Multi-turn Support**: Agent can ask follow-up questions and maintain context
- **Sub-agent Composition**: Can delegate to specialized sub-agents (e.g., parking calculator)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Zoning Interpreter Agent Architecture                    │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  User Question  │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  ZoningAgent    │
                              │  (Google ADK)   │
                              └────────┬────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
  ┌────────▼────────┐       ┌─────────▼─────────┐       ┌────────▼────────┐
  │  geocode_address │       │ query_zoning_data │       │   query_rag      │
  │  (Mapbox/ESRI)   │       │  (ESRI REST)      │       │  (Gemini Files)  │
  └────────┬────────┘       └─────────┬─────────┘       └────────┬────────┘
           │                           │                           │
           │              ┌────────────┴────────────┐              │
           │              │                         │              │
  ┌────────▼────────┐   ┌─▼─────────────┐ ┌────────▼─────┐ ┌─────▼──────────┐
  │ [lng, lat]       │   │ Zoning District│ │ Overlay Zones │ │ Grounded Answer │
  │ coordinates      │   │ Code (RS6, DC) │ │ (TIF, Historic)│ │ with Citations  │
  └──────────────────┘   └───────────────┘ └──────────────┘ └────────────────┘
                                       │
                              ┌────────▼────────┐
                              │  Agent Response │
                              │ (with context)  │
                              └─────────────────┘
```

### Agent Session Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Conversational Flow State Machine                      │
└──────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐     Missing Address     ┌───────────────┐
  │   START     │ ─────────────────────▶  │ ASK_ADDRESS   │
  │             │                         │               │
  └─────────────┘                         └───────┬───────┘
         │                                        │
         │ Has Address                            │ User Provides Address
         │                                        │
         ▼                                        ▼
  ┌─────────────┐                         ┌───────────────┐
  │  GEOCODING  │ ◀───────────────────────│   GEOCODE     │
  │             │                         │               │
  └──────┬──────┘                         └───────────────┘
         │
         │ Coordinates Found
         ▼
  ┌─────────────┐
  │QUERY_ZONING │───────────────────▶ ESRI REST API
  │             │                     (zoning at point)
  └──────┬──────┘
         │
         │ District + Overlays Found
         ▼
  ┌─────────────┐     Need More Info      ┌───────────────┐
  │CONTEXT_CHECK│ ─────────────────────▶  │ ASK_DETAILS   │
  │             │                         │ (sqft, use)   │
  └──────┬──────┘                         └───────┬───────┘
         │                                        │
         │ Has All Context                        │
         ▼                                        ▼
  ┌─────────────┐                         ┌───────────────┐
  │  QUERY_RAG  │ ◀───────────────────────│ UPDATE_STATE  │
  │             │                         │               │
  └──────┬──────┘                         └───────────────┘
         │
         │ Grounded Answer
         ▼
  ┌─────────────┐
  │  RESPOND    │───────────────────▶ Final Answer with Citations
  │             │
  └─────────────┘
```

## Agent Tools

### 1. geocode_address

Converts a street address to coordinates using Mapbox Geocoding API.

```typescript
import { FunctionTool } from '@anthropic-ai/sdk';
import { z } from 'zod';

const geocodeAddressTool = new FunctionTool({
  name: 'geocode_address',
  description: 'Convert a Milwaukee street address to latitude/longitude coordinates',
  parameters: z.object({
    address: z.string().describe('Street address in Milwaukee (e.g., "123 N Water St")'),
    city: z.string().default('Milwaukee').describe('City name'),
    state: z.string().default('WI').describe('State abbreviation'),
  }),
  handler: async ({ address, city, state }) => {
    const query = encodeURIComponent(`${address}, ${city}, ${state}`);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?` +
      `access_token=${process.env.MAPBOX_ACCESS_TOKEN}&` +
      `bbox=-88.1,42.8,-87.8,43.2&` +  // Milwaukee bounding box
      `limit=1`
    );

    const data = await response.json();
    const feature = data.features?.[0];

    if (!feature) {
      return { success: false, error: 'Address not found in Milwaukee' };
    }

    return {
      success: true,
      coordinates: feature.center,  // [lng, lat]
      formattedAddress: feature.place_name,
      confidence: feature.relevance,
    };
  },
});
```

### 2. query_zoning_at_point

Queries Milwaukee's ESRI REST services to get zoning information at coordinates.

```typescript
const queryZoningTool = new FunctionTool({
  name: 'query_zoning_at_point',
  description: 'Get zoning district and overlay information for a location',
  parameters: z.object({
    longitude: z.number().describe('Longitude coordinate'),
    latitude: z.number().describe('Latitude coordinate'),
  }),
  handler: async ({ longitude, latitude }) => {
    const ESRI_BASE = 'https://gis.milwaukee.gov/arcgis/rest/services';

    // Query zoning layer
    const zoningUrl = `${ESRI_BASE}/planning/zoning/MapServer/11/query?` +
      `geometry=${longitude},${latitude}&` +
      `geometryType=esriGeometryPoint&` +
      `spatialRel=esriSpatialRelIntersects&` +
      `outFields=*&` +
      `returnGeometry=false&` +
      `f=json`;

    const zoningResponse = await fetch(zoningUrl);
    const zoningData = await zoningResponse.json();
    const zoning = zoningData.features?.[0]?.attributes;

    // Query overlay zones (TIF, Historic, etc.)
    const overlayUrl = `${ESRI_BASE}/planning/special_districts/MapServer/identify?` +
      `geometry=${longitude},${latitude}&` +
      `geometryType=esriGeometryPoint&` +
      `tolerance=0&` +
      `mapExtent=${longitude-0.001},${latitude-0.001},${longitude+0.001},${latitude+0.001}&` +
      `imageDisplay=100,100,96&` +
      `returnGeometry=false&` +
      `f=json`;

    const overlayResponse = await fetch(overlayUrl);
    const overlayData = await overlayResponse.json();
    const overlays = overlayData.results?.map(r => r.layerName) || [];

    return {
      success: true,
      zoningDistrict: zoning?.ZONING || 'Unknown',
      zoningDescription: zoning?.ZONING_DESC || '',
      overlayZones: overlays,
      parceltaxKey: zoning?.TAXKEY,
    };
  },
});
```

### 3. query_rag

Queries the RAG system with location and use context for grounded answers.

```typescript
const queryRagTool = new FunctionTool({
  name: 'query_rag',
  description: 'Query Milwaukee zoning code documents with context for grounded answers',
  parameters: z.object({
    question: z.string().describe('The zoning question to answer'),
    zoningDistrict: z.string().optional().describe('Zoning district code (e.g., RS6, DC)'),
    useType: z.string().optional().describe('Type of use (e.g., restaurant, residential)'),
    squareFootage: z.number().optional().describe('Building square footage if relevant'),
  }),
  handler: async ({ question, zoningDistrict, useType, squareFootage }) => {
    // Build context-enhanced question
    let enhancedQuestion = question;

    if (zoningDistrict) {
      enhancedQuestion = `For the ${zoningDistrict} zoning district: ${question}`;
    }

    if (useType) {
      enhancedQuestion += ` The use type is ${useType}.`;
    }

    if (squareFootage) {
      enhancedQuestion += ` The building is ${squareFootage} square feet.`;
    }

    // Call Convex RAG action
    const result = await convex.action(api.ingestion.rag.queryDocuments, {
      question: enhancedQuestion,
      category: 'zoning-codes',
      maxDocuments: 5,
    });

    return result;
  },
});
```

### 4. calculate_parking (Sub-agent/Tool)

Specialized calculator for parking requirements.

```typescript
const calculateParkingTool = new FunctionTool({
  name: 'calculate_parking',
  description: 'Calculate required parking spaces based on use type and size',
  parameters: z.object({
    useType: z.enum([
      'restaurant',
      'retail',
      'office',
      'residential',
      'industrial',
      'medical',
      'assembly',
    ]).describe('Type of use'),
    grossFloorArea: z.number().describe('Gross floor area in square feet'),
    zoningDistrict: z.string().describe('Zoning district code'),
    seatingCapacity: z.number().optional().describe('For restaurants/assembly'),
    units: z.number().optional().describe('For residential'),
  }),
  handler: async ({ useType, grossFloorArea, zoningDistrict, seatingCapacity, units }) => {
    // Parking ratios from Milwaukee Zoning Code Section 295-403
    const PARKING_RATIOS = {
      restaurant: {
        default: { ratio: 1/100, unit: 'sqft', min: 0 },
        downtown: { ratio: 1/400, unit: 'sqft', min: 0 },
        reduced: ['DC', 'DL1', 'DL2', 'DL3', 'DL4'],
      },
      retail: {
        default: { ratio: 1/300, unit: 'sqft', min: 3 },
        downtown: { ratio: 1/600, unit: 'sqft', min: 0 },
        reduced: ['DC', 'DL1', 'DL2', 'DL3', 'DL4'],
      },
      office: {
        default: { ratio: 1/400, unit: 'sqft', min: 3 },
        downtown: { ratio: 1/1000, unit: 'sqft', min: 0 },
        reduced: ['DC', 'DL1', 'DL2', 'DL3', 'DL4'],
      },
      residential: {
        default: { ratio: 1, unit: 'unit', min: 1 },
        downtown: { ratio: 0.5, unit: 'unit', min: 0 },
        reduced: ['DC', 'DL1', 'DL2', 'DL3', 'DL4'],
      },
    };

    const config = PARKING_RATIOS[useType] || PARKING_RATIOS.retail;
    const isReduced = config.reduced?.includes(zoningDistrict);
    const ratio = isReduced ? config.downtown : config.default;

    let required: number;
    if (ratio.unit === 'sqft') {
      required = Math.ceil(grossFloorArea * ratio.ratio);
    } else if (ratio.unit === 'unit' && units) {
      required = Math.ceil(units * ratio.ratio);
    } else {
      required = Math.ceil(grossFloorArea / 300); // Fallback
    }

    required = Math.max(required, ratio.min);

    return {
      requiredSpaces: required,
      ratio: `1 per ${Math.round(1/ratio.ratio)} ${ratio.unit}`,
      isReducedDistrict: isReduced,
      zoningDistrict,
      notes: isReduced
        ? 'This district has reduced parking requirements. Shared parking may be available.'
        : 'Standard parking requirements apply.',
    };
  },
});
```

## Agent Implementation

### Google ADK Agent Definition

```typescript
// apps/agents/src/zoning-interpreter/agent.ts
import { LlmAgent } from 'google-adk';
import { InMemoryRunner } from 'google-adk/runners';

const ZONING_AGENT_PROMPT = `You are a helpful Milwaukee zoning assistant. Your role is to help users understand zoning requirements for properties in Milwaukee.

## Interaction Guidelines

1. **Always Gather Context First**
   - If a user asks about parking, setbacks, or other location-specific requirements, ask for the property address first
   - Use the geocode_address tool to convert addresses to coordinates
   - Use query_zoning_at_point to determine the zoning district

2. **Be Specific**
   - Once you know the zoning district, provide specific requirements from the code
   - Always cite the relevant section (e.g., "Section 295-403-2")
   - Mention any exceptions or special conditions

3. **Proactive Clarification**
   - For parking questions: Ask about use type and square footage
   - For setback questions: Ask about lot dimensions and corner vs interior lot
   - For permitted uses: Ask if they're considering a specific use

4. **Tools Available**
   - geocode_address: Convert addresses to coordinates
   - query_zoning_at_point: Get zoning district and overlays for a location
   - query_rag: Query the zoning code documents
   - calculate_parking: Calculate required parking spaces

5. **Response Format**
   - Start with the specific answer
   - Cite the relevant code section
   - Mention any special conditions (overlay zones, variances)
   - Suggest next steps if applicable

## Example Conversation

User: "What parking do I need for my restaurant?"

You: "I'd be happy to help you calculate your parking requirements! To give you an accurate answer, I need to know:
1. What's the address of your restaurant?
2. What's the approximate square footage?"

User: "123 N Water St, about 2,500 sq ft"

You: [Use geocode_address to get coordinates]
You: [Use query_zoning_at_point to get zoning district]
You: [Use calculate_parking with the results]

"Based on your location at 123 N Water St in the DC (Downtown Core) district, your 2,500 sq ft restaurant would require approximately 7 parking spaces.

**Details:**
- District: DC (Downtown Core)
- Parking Ratio: 1 space per 400 sq ft (reduced downtown rate)
- Calculation: 2,500 ÷ 400 = 6.25, rounded up to 7 spaces
- Code Reference: Section 295-403-2

**Good News:** The DC district has several parking flexibility options:
1. Shared parking agreements with nearby lots
2. In-lieu fee payment to the city parking fund
3. Bicycle parking credits (up to 10% reduction)

Would you like me to explain any of these options in more detail?"`;

export const zoningInterpreterAgent = new LlmAgent({
  name: 'zoning_interpreter',
  model: 'gemini-2.0-flash',
  systemPrompt: ZONING_AGENT_PROMPT,
  tools: [
    geocodeAddressTool,
    queryZoningTool,
    queryRagTool,
    calculateParkingTool,
  ],
  config: {
    temperature: 0.3,
    maxOutputTokens: 2048,
  },
});

// Session management
export async function createZoningSession(userId: string) {
  const runner = new InMemoryRunner({
    app_name: 'mke_zoning',
    agent: zoningInterpreterAgent,
  });

  const session = await runner.session_service.create_session({
    app_name: 'mke_zoning',
    user_id: userId,
  });

  return { runner, session };
}

export async function chat(
  runner: InMemoryRunner,
  sessionId: string,
  userId: string,
  message: string
) {
  const response = await runner.run({
    user_id: userId,
    session_id: sessionId,
    new_message: {
      role: 'user',
      parts: [{ text: message }],
    },
  });

  return response;
}
```

## Convex Integration

### Agent API Endpoint

```typescript
// apps/web/convex/agents/zoning.ts
import { action } from '../_generated/server';
import { v } from 'convex/values';

export const chat = action({
  args: {
    sessionId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // This would connect to the ADK agent running as a separate service
    // or invoke it directly if bundled

    const response = await fetch(`${process.env.AGENT_API_URL}/zoning/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AGENT_API_KEY}`,
      },
      body: JSON.stringify({
        sessionId: args.sessionId,
        message: args.message,
      }),
    });

    return await response.json();
  },
});

export const createSession = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(`${process.env.AGENT_API_URL}/zoning/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AGENT_API_KEY}`,
      },
      body: JSON.stringify({
        userId: args.userId,
      }),
    });

    const data = await response.json();
    return { sessionId: data.sessionId };
  },
});
```

## Frontend Integration

### Chat Hook

```typescript
// apps/web/src/hooks/useZoningAgent.ts
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ sourceId: string; sourceName: string }>;
}

export function useZoningAgent() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createSession = useMutation(api.agents.zoning.createSession);
  const sendMessage = useMutation(api.agents.zoning.chat);

  const initSession = useCallback(async (userId: string) => {
    const { sessionId } = await createSession({ userId });
    setSessionId(sessionId);
    return sessionId;
  }, [createSession]);

  const chat = useCallback(async (message: string) => {
    if (!sessionId) return;

    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);

    try {
      const response = await sendMessage({ sessionId, message });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, sendMessage]);

  return {
    sessionId,
    messages,
    isLoading,
    initSession,
    chat,
  };
}
```

## Out of Scope

- Voice interface (Gemini Live) - separate spec
- Map visualization of zoning results - handled by map components
- Permit application assistance - separate forms integration spec
- Multi-language support
- Offline functionality
- Historical zoning lookups

## Success Criteria

1. **Context Gathering**
   - Agent asks for address when location-specific questions are asked
   - Agent successfully geocodes Milwaukee addresses (>95% accuracy)
   - Agent retrieves correct zoning district from ESRI

2. **Accurate Answers**
   - Parking calculations match manual calculations from code
   - Answers include specific code section citations
   - Overlay zones (TIF, Historic) are mentioned when applicable

3. **Conversational Flow**
   - Agent maintains context across multiple turns
   - Follow-up questions reference previous context
   - Session state persists for at least 30 minutes

4. **Performance**
   - Response time < 3 seconds for cached geocoding
   - Response time < 8 seconds for full RAG query
   - Tool calls execute in parallel when independent

## Testing Scenarios

```
1. "What parking do I need for a 3,000 sq ft restaurant at 500 N Water St?"
   Expected: Agent geocodes, identifies DC district, calculates 8 spaces, mentions reduced downtown requirements

2. "Can I build a duplex on my property?"
   Expected: Agent asks for address, identifies zoning, explains if duplex is permitted/conditional/prohibited

3. "What are the setback requirements for my lot?"
   Expected: Agent asks for address and whether corner/interior lot, provides specific setback requirements

4. "Is my property in a TIF district?"
   Expected: Agent asks for address, queries overlay zones, explains TIF implications if applicable

5. Follow-up: "What about if I wanted to add outdoor seating?"
   Expected: Agent uses previously established context (address, zoning) to answer without re-asking
```

## File Structure

```
apps/
├── agents/
│   └── src/
│       └── zoning-interpreter/
│           ├── agent.ts           # LlmAgent definition
│           ├── tools/
│           │   ├── geocode.ts     # geocode_address tool
│           │   ├── zoning.ts      # query_zoning_at_point tool
│           │   ├── rag.ts         # query_rag tool
│           │   └── parking.ts     # calculate_parking tool
│           ├── prompts.ts         # System prompts
│           └── index.ts           # Exports
└── web/
    ├── convex/
    │   └── agents/
    │       └── zoning.ts          # Convex actions for agent
    └── src/
        └── hooks/
            └── useZoningAgent.ts  # React hook for chat
```
