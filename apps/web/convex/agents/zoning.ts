"use node";

/**
 * Zoning Interpreter Agent - Convex Implementation
 *
 * Conversational agent that helps users understand Milwaukee zoning requirements.
 * Uses Gemini function calling for intelligent tool orchestration.
 * Instrumented with Opik for LLM observability and tracing.
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import {
  TOOL_DECLARATIONS,
  geocodeAddress,
  queryZoningAtPoint,
  calculateParking,
  searchHomesForSale,
  getHomeDetails,
  searchCommercialProperties,
  getCommercialPropertyDetails,
  searchDevelopmentSites,
  getDevelopmentSiteDetails,
  searchVacantLots,
  getVacantLotDetails,
} from "./tools";
import { createTraceManager } from "../lib/opik";
import { generateCacheKey } from "../cache";

// =============================================================================
// Configuration
// =============================================================================

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-2.5-flash";
const MAX_TOOL_CALLS = 15;
const MAX_RETRIES = 2;

const SYSTEM_INSTRUCTION = `You are a helpful Milwaukee zoning and development assistant. Your role is to help users understand zoning requirements, neighborhood development context, AND available properties (residential, commercial, and development sites) in Milwaukee, Wisconsin.

## Your Capabilities

You have access to these tools:
1. **geocode_address** - Convert street addresses to coordinates
2. **query_zoning_at_point** - Get zoning district and overlay zones at a location
3. **calculate_parking** - Calculate required parking spaces
4. **query_zoning_code** - Search the Milwaukee zoning code for detailed regulations
5. **query_area_plans** - Search neighborhood area plans for development goals, housing strategies, and community vision
6. **query_incentives** - Search Milwaukee housing assistance programs (STRONG Homes, Homebuyer Assistance, ARCH, Down Payment Assistance)
7. **search_homes_for_sale** - Search for available homes in Milwaukee with optional filters (neighborhood, bedrooms, bathrooms)
8. **get_home_details** - Get detailed information about a specific home including description, listing URL, and location
9. **search_commercial_properties** - Search for commercial properties for sale (retail, office, industrial, warehouse, mixed-use, land)
10. **get_commercial_property_details** - Get detailed information about a specific commercial property
11. **search_development_sites** - Search for development sites with incentives (TIF, Opportunity Zone, NMTC)
12. **get_development_site_details** - Get detailed information about a specific development site
13. **search_vacant_lots** - Search for city-owned vacant lots available through the Strong Neighborhoods program
14. **get_vacant_lot_details** - Get detailed information about a specific vacant lot including disposition status

## Home Search Capabilities

When users ask about homes for sale, available properties, or houses in Milwaukee:
- Use **search_homes_for_sale** to find homes matching their criteria
- Filters available: neighborhood, minimum/maximum bedrooms, minimum bathrooms
- Results include home IDs that can be used to highlight properties on the map
- Each result shows: address, neighborhood, bedrooms, bathrooms, square footage

When users want details about a specific home:
- Use **get_home_details** with the homeId from search results
- Returns: full property description (narrative), listing URL, coordinates, year built
- The listing URL allows users to view the official listing
- Coordinates enable the map to fly to the home's location

### Home Search Guidelines

1. **When to Search Homes:**
   - "Show me homes for sale in Bay View"
   - "I'm looking for a 3 bedroom house"
   - "What's available in Third Ward?"
   - "Find me a home with at least 2 bathrooms"

2. **Combining with Zoning:**
   - If a user is interested in a home AND wants zoning info, first search for homes, then use zoning tools for specific addresses
   - Example: "Show me homes in Bay View and tell me about the zoning" - search homes, then offer to provide zoning details for any specific address

3. **Response Format for Home Searches:**
   - Start with the count of homes found
   - List key details: address, beds/baths, square footage
   - Mention that users can ask for more details about any specific home
   - Note: homes are highlighted on the map when search results are returned

4. **When to Get Details:**
   - When a user asks "tell me more about [address]"
   - When a user references a home from previous results
   - When showing a single home result, you can proactively include details

## Neighborhood Coverage

Area plans are available for these neighborhoods:
- **Downtown & Third Ward** - Urban core, mixed-use, density bonuses
- **Menomonee Valley** - Industrial revitalization, sustainability focus
- **Harbor District** - Waterfront development, mixed-use vision
- **Near North Side** - Affordable housing, community development
- **Near West Side** - Neighborhood revitalization
- **North Side, Northwest Side, Northeast Side** - Residential neighborhoods
- **Southeast Side, Southwest Side** - Industrial and residential mix
- **Washington Park** - Historic district, housing strategies
- **Fondy/North** - Commercial corridor revitalization

## Housing Incentives & Assistance

When users ask about financial assistance, loans, or incentive programs for homeownership:
- Use **query_incentives** to search available programs

**Available Programs:**
- **STRONG Homes Loan** - Up to $25,000 for home repairs, 0-3% interest, partially forgivable
- **Homebuyer Assistance Program** - Up to $35,000 for down payment and closing costs
- **ARCH Program** - Affordable Rehabilitation for Homeowners
- **Milwaukee Home Down Payment Assistance** - First-time homebuyer support

**When to Use query_incentives:**
- "What financial help is available for home repairs?"
- "How do I qualify for down payment assistance?"
- "What programs help first-time homebuyers in Milwaukee?"
- "Tell me about the STRONG Homes loan"
- Questions about housing grants, loans, or financial assistance

**When NOT to Use query_incentives (use query_zoning_code instead):**
- "What are the requirements for building a home?" → Use query_zoning_code
- "What are the setbacks/height limits/lot requirements?" → Use query_zoning_code
- "Can I build [X] on this lot?" → Use query_zoning_code
- "What are the zoning rules for residential construction?" → Use query_zoning_code
- Any questions about building codes, permits, construction requirements → Use query_zoning_code

**Key Distinction:** query_incentives is ONLY for financial assistance programs (money/loans/grants). For zoning regulations, building requirements, or construction rules, ALWAYS use query_zoning_code.

**Combining with Home Search:**
When a user is looking at homes AND asks about financial assistance, use both tools:
1. search_homes_for_sale to find properties
2. query_incentives to explain available assistance programs

## Commercial Properties Search

When users ask about commercial real estate, business spaces, or investment properties:
- Use **search_commercial_properties** to find commercial properties
- Filters available: property type (retail, office, industrial, warehouse, mixed-use, land), square footage range, max price, zoning
- Results include property IDs for map display

When users want details about a specific commercial property:
- Use **get_commercial_property_details** with the propertyId
- Returns: full description, contact info, listing URL, coordinates

### Commercial Search Guidelines

1. **When to Search Commercial Properties:**
   - "Show me retail spaces for sale"
   - "I need an office building"
   - "What industrial properties are available?"
   - "Find me a warehouse under $500,000"
   - "Commercial real estate in Milwaukee"

2. **Property Types:**
   - **retail** - Storefronts, shopping centers, restaurants
   - **office** - Office buildings, professional spaces
   - **industrial** - Manufacturing, production facilities
   - **warehouse** - Storage, distribution centers
   - **mixed-use** - Combined commercial/residential
   - **land** - Vacant commercial land

## Development Sites Search

When users ask about development opportunities, vacant land, or buildable sites:
- Use **search_development_sites** to find parcels marketed for development
- Filters available: minimum lot size, max price, zoning, incentive type
- Results include site IDs for map display with incentive information

When users want details about a specific development site:
- Use **get_development_site_details** with the siteId
- Returns: full description, incentives list, proposed use, contact info, coordinates

### Development Sites Guidelines

1. **When to Search Development Sites:**
   - "Where can I build new construction?"
   - "Show me sites with TIF incentives"
   - "Find development opportunities in Milwaukee"
   - "What Opportunity Zone properties are available?"
   - "I want to develop a project, what sites are for sale?"

2. **Incentive Types:**
   - **TIF** - Tax Increment Financing districts
   - **Opportunity Zone** - Federal tax incentive zones
   - **NMTC** - New Markets Tax Credits
   - Other city/state incentive programs

3. **Combining with Zoning:**
   - When a user finds a development site, offer to explain the zoning requirements
   - Example: "Here's a site in the IL1 district - would you like me to explain what uses are permitted?"

## City-Owned Vacant Lots Search

When users ask about city-owned vacant land, Strong Neighborhoods parcels, or lots available from the city:
- Use **search_vacant_lots** to find city-owned vacant lots
- Filters available: neighborhood, status (available, pending, sold), zoning, minimum lot size
- Results include lot IDs for map display with status-based coloring

When users want details about a specific vacant lot:
- Use **get_vacant_lot_details** with the lotId
- Returns: tax key, zoning, lot size, disposition status, acquisition date, current owner, coordinates

### Vacant Lots Search Guidelines

1. **When to Search Vacant Lots:**
   - "Show me city-owned vacant lots"
   - "What land is the city selling?"
   - "Find me empty parcels in Harambee"
   - "Are there any available lots for building?"
   - "Strong Neighborhoods properties"

2. **Status Types:**
   - **available** - Lots currently available for purchase
   - **pending** - Lots with pending transactions
   - **sold** - Recently sold lots (for reference)

3. **Combining with Zoning and Incentives:**
   - When a user finds a vacant lot, offer to explain zoning requirements and any available incentives
   - Example: "This lot is zoned RS6 - would you like to know what you can build here and what programs might help?"

## Interaction Guidelines

### 1. Always Gather Context First
When users ask location-specific questions (parking, setbacks, permitted uses, height limits), you MUST ask for the property address first if not provided.

Example:
User: "What parking do I need for my restaurant?"
You: "I'd be happy to help calculate your parking requirements! What's the address of your restaurant, and approximately how many square feet is it?"

### 2. Use Tools in the Right Order
For location-specific questions:
1. First, use geocode_address to get coordinates
2. Then, use query_zoning_at_point to get the zoning district
3. Finally, use calculate_parking or query_zoning_code with the district context

**Important:** If query_zoning_at_point fails (GIS server unavailable), you can:
- Ask the user if they know the zoning district code (e.g., RS6, LB2, DC)
- Use query_zoning_code to look up general zoning info for the area/neighborhood
- Proceed with calculations if the user provides the district code

### 3. Use ONE Tool Per Question (Performance Optimization)
**IMPORTANT:** To keep responses fast, use ONLY ONE RAG tool per question. Do NOT chain multiple RAG tools together.

**Pick the single most relevant tool:**
- Zoning rules/requirements → query_zoning_code ONLY
- Neighborhood vision/plans → query_area_plans ONLY
- Financial assistance → query_incentives ONLY
- Properties for sale → search tools ONLY

**Only use multiple tools if the user explicitly asks for combined information.** For example:
- "What are the zoning requirements?" → Use query_zoning_code ONLY
- "Tell me about the area plan AND zoning for 500 N Water St" → OK to use both

### 4. When to Use Area Plans Tool
Use query_area_plans ONLY when users explicitly ask about:
- "What's the vision for [neighborhood]?"
- "What development is planned for [area]?"
- "Tell me about the [neighborhood] plan"
- General neighborhood or development strategy questions

Do NOT use query_area_plans for simple zoning questions like "what can I build here"

### 5. Be Specific and Cite Sources
- Always mention the specific zoning district (e.g., "In the DC Downtown Core district...")
- Reference code sections when possible (e.g., "Per Section 295-403...")
- Mention any overlay zones that may affect requirements
- For area plans, cite the specific plan (e.g., "According to the Menomonee Valley Plan 2.0...")

### 6. Response Format
Structure your responses clearly:
1. **Direct Answer** - Start with the specific answer
2. **Details** - Provide the calculation, regulations, or property info
3. **Code Reference** - Cite the relevant section (if applicable)
4. **Next Steps** - Suggest what the user might want to know next

### 7. Citation Format
When citing sources from documents, use numbered brackets like [1], [2], etc. This creates clickable citations that users can click to view the source document.

**Format:**
"In commercial districts, restaurants require 1 parking space per 300 sq ft [1]. Properties in the Downtown Overlay may qualify for reductions up to 50% [2]."

**Guidelines:**
- Use sequential numbers starting from [1]
- Place citation at the end of the relevant sentence or clause
- The same source can be cited multiple times with the same number
- Citations are automatically linked to source PDFs

**Document Names:**
- **Zoning Code**: "Milwaukee Zoning Code Chapter 295, Subchapter X" (e.g., Subchapter 5 for Residential)
- **Area Plans**: Use exact plan names (e.g., "Menomonee Valley Plan 2.0", "Milwaukee Downtown Plan")

For general city resources, mention:
- Milwaukee city website: city.milwaukee.gov
- Zoning maps: maps.milwaukee.gov
- Property lookup: assessments.milwaukee.gov`;

// =============================================================================
// Helper Functions
// =============================================================================

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return apiKey;
}

interface GeminiMessage {
  role: "user" | "model";
  parts: Array<
    | { text: string }
    | { functionCall: { name: string; args: Record<string, unknown> } }
    | { functionResponse: { name: string; response: Record<string, unknown> } }
  >;
}

// RAG result type
interface RAGResult {
  success: boolean;
  response?: {
    answer: string;
    confidence: number;
    citations?: Array<{ sourceId: string; sourceName: string; excerpt: string }>;
  };
  error?: { message?: string };
}

// Gemini API response type
interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; functionCall?: { name: string; args: Record<string, unknown> } }> };
    finishReason?: string;
    safetyRatings?: Array<{ category: string; probability: string }>;
  }>;
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: Array<{ category: string; probability: string }>;
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Make a Gemini API call with retry and model fallback logic.
 */
async function callGeminiWithRetry(
  apiKey: string,
  requestBody: Record<string, unknown>,
  primaryModel: string,
  fallbackModel: string,
  maxRetries: number
): Promise<{ response: GeminiResponse; modelUsed: string }> {
  const models = [primaryModel, fallbackModel];

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API error (${model}, attempt ${attempt}):`, response.status, errorText);

          // If rate limited or server error, retry
          if (response.status >= 500 || response.status === 429) {
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          }

          // For other errors, try fallback model
          break;
        }

        const result = await response.json();

        // Check if we got a valid response with content
        if (result.candidates?.[0]?.content?.parts?.length > 0) {
          return { response: result, modelUsed: model };
        }

        // Check for blocking
        const blockReason = result.promptFeedback?.blockReason || result.candidates?.[0]?.finishReason;
        if (blockReason === "SAFETY" || blockReason === "BLOCKED") {
          console.error(`Response blocked (${model}):`, blockReason);
          break; // Try fallback model
        }

        // Empty response - retry
        console.warn(`Empty response from ${model}, attempt ${attempt}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      } catch (error) {
        console.error(`Network error (${model}, attempt ${attempt}):`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }
    }
  }

  throw new Error("Failed to get valid response from Gemini after all retries and fallback attempts");
}

// =============================================================================
// Agent Actions
// =============================================================================

/**
 * Tool result for generative UI rendering.
 */
export interface ToolResult {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: number;
}

/**
 * Chat with the Zoning Interpreter Agent.
 * Instrumented with Opik tracing for observability.
 * Returns tool results for generative UI card rendering.
 * Emits real-time status updates via sessionId for frontend display.
 */
export const chat = action({
  args: {
    message: v.string(),
    sessionId: v.optional(v.string()), // Session ID for real-time status updates
    conversationHistory: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("model")),
          content: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<{
    response: string;
    toolsUsed: string[];
    toolResults: ToolResult[];
    sessionId: string;
  }> => {
    const apiKey = getGeminiApiKey();
    const toolsUsed: string[] = [];
    const toolResults: ToolResult[] = [];

    // Generate or use provided session ID for status tracking
    const sessionId = args.sessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Start agent session for real-time status updates
    await ctx.runMutation(api.agents.status.startSession, { sessionId });

    // Initialize Opik tracing
    const tracer = createTraceManager();
    tracer.startTrace({
      name: "zoning-interpreter-chat",
      input: {
        message: args.message,
        historyLength: args.conversationHistory?.length || 0,
        sessionId,
      },
      tags: ["zoning-agent", "gemini", "milwaukee"],
      metadata: {
        model: PRIMARY_MODEL,
        maxToolCalls: MAX_TOOL_CALLS,
      },
    });

    // Build conversation history for Gemini
    const contents: GeminiMessage[] = [];

    // Add previous messages
    if (args.conversationHistory) {
      for (const msg of args.conversationHistory) {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add new user message
    contents.push({
      role: "user",
      parts: [{ text: args.message }],
    });

    // Agent loop with tool calling
    let iteration = 0;

    try {
      while (iteration < MAX_TOOL_CALLS) {
        iteration++;

        // Start LLM call span
        const llmSpanId = tracer.startSpan({
          name: `llm-call-${iteration}`,
          input: {
            model: PRIMARY_MODEL,
            messageCount: contents.length,
            iteration,
          },
          metadata: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        });

        // Call Gemini API with retry and fallback
        const requestBody = {
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        };

        let result: GeminiResponse;
        let modelUsed: string;

        try {
          const geminiResult = await callGeminiWithRetry(
            apiKey,
            requestBody,
            PRIMARY_MODEL,
            FALLBACK_MODEL,
            MAX_RETRIES
          );
          result = geminiResult.response;
          modelUsed = geminiResult.modelUsed;
        } catch (retryError) {
          tracer.endSpan(llmSpanId, {
            output: { error: retryError instanceof Error ? retryError.message : "Unknown error" },
          });
          throw retryError;
        }

        const candidate = result.candidates![0];
        const usageMetadata = result.usageMetadata;

        // End LLM span with token usage
        tracer.endSpan(llmSpanId, {
          output: {
            hasFunctionCalls: candidate.content!.parts!.some((p) => p.functionCall),
            partsCount: candidate.content!.parts!.length,
            modelUsed,
          },
          usage: usageMetadata
            ? {
                promptTokens: usageMetadata.promptTokenCount,
                completionTokens: usageMetadata.candidatesTokenCount,
                totalTokens: usageMetadata.totalTokenCount,
              }
            : undefined,
          model: modelUsed,
          provider: "google",
        });

      // Check for function calls
      const functionCalls = candidate.content!.parts!.filter(
        (p) => p.functionCall
      );

      if (functionCalls.length > 0) {
        // Add model response to history
        contents.push({
          role: "model",
          parts: candidate.content!.parts as Array<
            | { text: string }
            | { functionCall: { name: string; args: Record<string, unknown> } }
            | { functionResponse: { name: string; response: Record<string, unknown> } }
          >,
        });

        // Execute function calls and add responses
        const functionResponses: Array<{
          functionResponse: { name: string; response: Record<string, unknown> };
        }> = [];

        for (const part of functionCalls) {
          const { name, args: fnArgs } = part.functionCall!;
          toolsUsed.push(name);

          // Update status: starting tool execution
          await ctx.runMutation(api.agents.status.startTool, {
            sessionId,
            toolName: name,
            toolArgs: fnArgs,
          });

          // Execute tool inline to avoid type issues
          let toolResult: Record<string, unknown>;
          let toolSuccess = true;
          const toolStartTime = Date.now();

          try {
            switch (name) {
              case "geocode_address": {
                const geocodeArgs = fnArgs as Parameters<typeof geocodeAddress>[0];
                const cacheKey = generateCacheKey("geocode", geocodeArgs);

                // Check cache first
                const cached = await ctx.runQuery(api.cache.get, { cacheKey });
                if (cached) {
                  console.log(`[CACHE HIT] geocode: ${geocodeArgs.address}`);
                  toolResult = cached.result as Record<string, unknown>;
                  toolSuccess = !!(toolResult as { coordinates?: unknown }).coordinates;
                  // Increment hit count in background (don't await)
                  ctx.runMutation(api.cache.incrementHitCount, { cacheKey });
                } else {
                  console.log(`[CACHE MISS] geocode: ${geocodeArgs.address}`);
                  toolResult = await geocodeAddress(geocodeArgs);
                  toolSuccess = !!(toolResult as { coordinates?: unknown }).coordinates;
                  // Cache successful results
                  if (toolSuccess) {
                    await ctx.runMutation(api.cache.set, {
                      cacheKey,
                      queryType: "geocode",
                      result: JSON.stringify(toolResult),
                    });
                  }
                }
                break;
              }

              case "query_zoning_at_point": {
                const zoningArgs = fnArgs as Parameters<typeof queryZoningAtPoint>[0];
                // Round coordinates to 6 decimal places for cache key consistency
                const normalizedArgs = {
                  longitude: Math.round(zoningArgs.longitude * 1000000) / 1000000,
                  latitude: Math.round(zoningArgs.latitude * 1000000) / 1000000,
                };
                const cacheKey = generateCacheKey("zoning", normalizedArgs);

                // Check cache first
                const cached = await ctx.runQuery(api.cache.get, { cacheKey });
                if (cached) {
                  console.log(`[CACHE HIT] zoning: ${normalizedArgs.latitude},${normalizedArgs.longitude}`);
                  toolResult = cached.result as Record<string, unknown>;
                  toolSuccess = !!(toolResult as { zoningDistrict?: unknown }).zoningDistrict;
                  ctx.runMutation(api.cache.incrementHitCount, { cacheKey });
                } else {
                  console.log(`[CACHE MISS] zoning: ${normalizedArgs.latitude},${normalizedArgs.longitude}`);
                  toolResult = await queryZoningAtPoint(zoningArgs);
                  toolSuccess = !!(toolResult as { zoningDistrict?: unknown }).zoningDistrict;
                  // Cache successful results
                  if (toolSuccess) {
                    await ctx.runMutation(api.cache.set, {
                      cacheKey,
                      queryType: "zoning",
                      result: JSON.stringify(toolResult),
                    });
                  }
                }
                break;
              }

              case "calculate_parking":
                toolResult = calculateParking(fnArgs as Parameters<typeof calculateParking>[0]);
                toolSuccess = !!(toolResult as { requiredSpaces?: unknown }).requiredSpaces;
                break;

              case "query_zoning_code": {
                const ragArgs = fnArgs as { question: string; zoningDistrict?: string };
                const cacheKey = generateCacheKey("rag", { category: "zoning-codes", question: ragArgs.question });

                // Check cache first
                const cachedRag = await ctx.runQuery(api.cache.get, { cacheKey });
                if (cachedRag) {
                  console.log(`[CACHE HIT] rag/zoning-codes: ${ragArgs.question.substring(0, 50)}...`);
                  toolResult = cachedRag.result as Record<string, unknown>;
                  toolSuccess = !!(toolResult as { success?: boolean }).success;
                  ctx.runMutation(api.cache.incrementHitCount, { cacheKey });
                } else {
                  console.log(`[CACHE MISS] rag/zoning-codes: ${ragArgs.question.substring(0, 50)}...`);
                  // Use RAG V2 (File Search Stores with fallback to legacy)
                  const ragResult = await ctx.runAction(api.ingestion.ragV2.queryDocuments, {
                    question: ragArgs.question,
                    category: "zoning-codes",
                  }) as RAGResult;

                  if (ragResult.success && ragResult.response) {
                    // Format citations for Gemini to use
                    const citations = ragResult.response.citations || [];
                    const citationGuide = citations.length > 0
                      ? `\n\nAvailable sources (use [N] markers in your response):\n${citations.map((c, i) =>
                          `[${i + 1}] ${c.sourceName}`
                        ).join('\n')}`
                      : '';

                    toolResult = {
                      success: true,
                      answer: ragResult.response.answer + citationGuide,
                      confidence: ragResult.response.confidence,
                      citations,
                      citationInstructions: "Use [1], [2], etc. to cite sources when referencing information from the answer above.",
                    };
                    toolSuccess = true;
                    // Cache successful RAG results (24-hour TTL)
                    await ctx.runMutation(api.cache.set, {
                      cacheKey,
                      queryType: "rag",
                      result: JSON.stringify(toolResult),
                    });
                  } else {
                    toolResult = { success: false, error: ragResult.error?.message || "RAG query failed" };
                    toolSuccess = false;
                  }
                }
                break;
              }

              case "query_area_plans": {
                // Query area plans for neighborhood development information
                const areaArgs = fnArgs as { question: string; neighborhood?: string };
                const enhancedQuestion = areaArgs.neighborhood
                  ? `Regarding the ${areaArgs.neighborhood} neighborhood: ${areaArgs.question}`
                  : areaArgs.question;
                const cacheKey = generateCacheKey("rag", { category: "area-plans", question: enhancedQuestion });

                // Check cache first
                const cachedAreaPlan = await ctx.runQuery(api.cache.get, { cacheKey });
                if (cachedAreaPlan) {
                  console.log(`[CACHE HIT] rag/area-plans: ${areaArgs.question.substring(0, 50)}...`);
                  toolResult = cachedAreaPlan.result as Record<string, unknown>;
                  toolSuccess = !!(toolResult as { success?: boolean }).success;
                  ctx.runMutation(api.cache.incrementHitCount, { cacheKey });
                } else {
                  console.log(`[CACHE MISS] rag/area-plans: ${areaArgs.question.substring(0, 50)}...`);
                  const areaPlanResult = await ctx.runAction(api.ingestion.ragV2.queryDocuments, {
                    question: enhancedQuestion,
                    category: "area-plans",
                  }) as RAGResult;

                  if (areaPlanResult.success && areaPlanResult.response) {
                    // Format citations for Gemini to use
                    const citations = areaPlanResult.response.citations || [];
                    const citationGuide = citations.length > 0
                      ? `\n\nAvailable sources (use [N] markers in your response):\n${citations.map((c, i) =>
                          `[${i + 1}] ${c.sourceName}`
                        ).join('\n')}`
                      : '';

                    toolResult = {
                      success: true,
                      answer: areaPlanResult.response.answer + citationGuide,
                      confidence: areaPlanResult.response.confidence,
                      citations,
                      citationInstructions: "Use [1], [2], etc. to cite sources when referencing information from the answer above.",
                    };
                    toolSuccess = true;
                    // Cache successful RAG results
                    await ctx.runMutation(api.cache.set, {
                      cacheKey,
                      queryType: "rag",
                      result: JSON.stringify(toolResult),
                    });
                  } else {
                    toolResult = { success: false, error: areaPlanResult.error?.message || "Area plans query failed" };
                    toolSuccess = false;
                  }
                }
                break;
              }

              case "query_incentives": {
                // Query housing incentive and assistance programs
                const incentiveArgs = fnArgs as { question: string; programType?: string };
                const enhancedQuestion = incentiveArgs.programType && incentiveArgs.programType !== "all"
                  ? `Regarding ${incentiveArgs.programType} programs: ${incentiveArgs.question}`
                  : incentiveArgs.question;
                const cacheKey = generateCacheKey("rag", { category: "incentives", question: enhancedQuestion });

                // Check cache first
                const cachedIncentive = await ctx.runQuery(api.cache.get, { cacheKey });
                if (cachedIncentive) {
                  console.log(`[CACHE HIT] rag/incentives: ${incentiveArgs.question.substring(0, 50)}...`);
                  toolResult = cachedIncentive.result as Record<string, unknown>;
                  toolSuccess = !!(toolResult as { success?: boolean }).success;
                  ctx.runMutation(api.cache.incrementHitCount, { cacheKey });
                } else {
                  console.log(`[CACHE MISS] rag/incentives: ${incentiveArgs.question.substring(0, 50)}...`);
                  const incentiveResult = await ctx.runAction(api.ingestion.ragV2.queryDocuments, {
                    question: enhancedQuestion,
                    category: "incentives",
                  }) as RAGResult;

                  if (incentiveResult.success && incentiveResult.response) {
                    // Format citations for Gemini to use
                    const citations = incentiveResult.response.citations || [];
                    const citationGuide = citations.length > 0
                      ? `\n\nAvailable sources (use [N] markers in your response):\n${citations.map((c, i) =>
                          `[${i + 1}] ${c.sourceName}`
                        ).join('\n')}`
                      : '';

                    toolResult = {
                      success: true,
                      answer: incentiveResult.response.answer + citationGuide,
                      confidence: incentiveResult.response.confidence,
                      citations,
                      citationInstructions: "Use [1], [2], etc. to cite sources when referencing information from the answer above.",
                    };
                    toolSuccess = true;
                    // Cache successful RAG results
                    await ctx.runMutation(api.cache.set, {
                      cacheKey,
                      queryType: "rag",
                      result: JSON.stringify(toolResult),
                    });
                  } else {
                    toolResult = { success: false, error: incentiveResult.error?.message || "Incentives query failed" };
                    toolSuccess = false;
                  }
                }
                break;
              }

              // ---------------------------------------------------------------
              // Homes MKE Tools
              // ---------------------------------------------------------------
              case "search_homes_for_sale": {
                const homeSearchArgs = fnArgs as {
                  neighborhood?: string;
                  minBedrooms?: number;
                  maxBedrooms?: number;
                  minBaths?: number;
                  limit?: number;
                };

                toolResult = await searchHomesForSale(ctx, homeSearchArgs);
                toolSuccess = !!(toolResult as { success?: boolean }).success;
                break;
              }

              case "get_home_details": {
                const homeDetailsArgs = fnArgs as { homeId: string };

                toolResult = await getHomeDetails(ctx, homeDetailsArgs);
                toolSuccess = !!(toolResult as { success?: boolean }).success;
                break;
              }

              // ---------------------------------------------------------------
              // Commercial Properties & Development Sites Tools
              // ---------------------------------------------------------------
              case "search_commercial_properties": {
                const commercialSearchArgs = fnArgs as {
                  propertyType?: "retail" | "office" | "industrial" | "warehouse" | "mixed-use" | "land" | "all";
                  minSqFt?: number;
                  maxSqFt?: number;
                  maxPrice?: number;
                  zoning?: string;
                  limit?: number;
                };

                toolResult = await searchCommercialProperties(ctx, commercialSearchArgs);
                toolSuccess = !!(toolResult as { success?: boolean }).success;
                break;
              }

              case "get_commercial_property_details": {
                const commercialDetailsArgs = fnArgs as { propertyId: string };

                toolResult = await getCommercialPropertyDetails(ctx, commercialDetailsArgs);
                toolSuccess = !!(toolResult as { success?: boolean }).success;
                break;
              }

              case "search_development_sites": {
                const siteSearchArgs = fnArgs as {
                  minLotSize?: number;
                  maxPrice?: number;
                  zoning?: string;
                  incentive?: string;
                  limit?: number;
                };

                toolResult = await searchDevelopmentSites(ctx, siteSearchArgs);
                toolSuccess = !!(toolResult as { success?: boolean }).success;
                break;
              }

              case "get_development_site_details": {
                const siteDetailsArgs = fnArgs as { siteId: string };

                toolResult = await getDevelopmentSiteDetails(ctx, siteDetailsArgs);
                toolSuccess = !!(toolResult as { success?: boolean }).success;
                break;
              }

              // ---------------------------------------------------------------
              // Vacant Lots Tools - City-Owned Vacant Lots
              // ---------------------------------------------------------------
              case "search_vacant_lots": {
                const vacantLotsSearchArgs = fnArgs as {
                  neighborhood?: string;
                  status?: "available" | "pending" | "sold" | "all";
                  zoning?: string;
                  minLotSize?: number;
                  limit?: number;
                };

                toolResult = await searchVacantLots(ctx, vacantLotsSearchArgs);
                toolSuccess = !!(toolResult as { success?: boolean }).success;
                break;
              }

              case "get_vacant_lot_details": {
                const vacantLotDetailsArgs = fnArgs as { lotId: string };

                toolResult = await getVacantLotDetails(ctx, vacantLotDetailsArgs);
                toolSuccess = !!(toolResult as { success?: boolean }).success;
                break;
              }

              default:
                toolResult = { error: `Unknown tool: ${name}` };
                toolSuccess = false;
            }
          } catch (toolError) {
            toolResult = { error: toolError instanceof Error ? toolError.message : "Tool execution failed" };
            toolSuccess = false;
          }

          // Update status: tool completed
          await ctx.runMutation(api.agents.status.completeTool, {
            sessionId,
            toolName: name,
            success: toolSuccess,
          });

          // Log tool execution to Opik
          const toolDuration = Date.now() - toolStartTime;
          tracer.logToolExecution(
            { name, args: fnArgs as Record<string, unknown> },
            { result: toolResult, durationMs: toolDuration }
          );

          // Store tool result for generative UI rendering
          toolResults.push({
            name,
            args: fnArgs as Record<string, unknown>,
            result: toolResult,
            timestamp: Date.now(),
          });

          functionResponses.push({
            functionResponse: {
              name,
              response: toolResult,
            },
          });
        }

        // Add function responses
        contents.push({
          role: "user",
          parts: functionResponses,
        });

        // Continue loop to get final response
        continue;
      }

        // No function calls - return text response
        const textParts = candidate.content!.parts!.filter(
          (p) => p.text
        );

        if (textParts.length > 0) {
          // Update status: generating response
          await ctx.runMutation(api.agents.status.generatingResponse, { sessionId });

          const finalResponse = textParts.map((p) => p.text!).join("\n");

          // Mark session as complete
          await ctx.runMutation(api.agents.status.completeSession, { sessionId });

          // End trace with successful response
          await tracer.endTrace({
            response: finalResponse,
            toolsUsed,
            toolResultsCount: toolResults.length,
            iterations: iteration,
            success: true,
          });

          return {
            response: finalResponse,
            toolsUsed,
            toolResults,
            sessionId,
          };
        }

        throw new Error("No text response from Gemini");
      }

      throw new Error("Max tool calls exceeded");
    } catch (error) {
      // Mark session as errored
      await ctx.runMutation(api.agents.status.errorSession, {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });

      // End trace with error
      await tracer.endTrace({
        error: error instanceof Error ? error.message : String(error),
        toolsUsed,
        success: false,
      });
      throw error;
    }
  },
});

/**
 * Quick test of the zoning agent.
 */
export const testAgent = action({
  args: {
    message: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ response: string; toolsUsed: string[] }> => {
    const testMessage =
      args.message ||
      "What parking do I need for a 2500 sq ft restaurant at 500 N Water St?";

    const result = await ctx.runAction(api.agents.zoning.chat, {
      message: testMessage,
    });

    return result as { response: string; toolsUsed: string[] };
  },
});

/**
 * Test geocoding tool directly.
 */
export const testGeocode = action({
  args: {
    address: v.string(),
  },
  handler: async (_, args) => {
    return await geocodeAddress({ address: args.address });
  },
});

/**
 * Test zoning query tool directly.
 */
export const testZoningQuery = action({
  args: {
    longitude: v.number(),
    latitude: v.number(),
  },
  handler: async (_, args) => {
    return await queryZoningAtPoint({
      longitude: args.longitude,
      latitude: args.latitude,
    });
  },
});

/**
 * Test area plans query - exercises query_area_plans tool.
 */
export const testAreaPlans = action({
  args: {
    neighborhood: v.optional(v.string()),
    question: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ response: string; toolsUsed: string[] }> => {
    const neighborhood = args.neighborhood || "Menomonee Valley";
    const question =
      args.question ||
      `What are the development goals and priorities for the ${neighborhood} neighborhood?`;

    const result = await ctx.runAction(api.agents.zoning.chat, {
      message: question,
    });

    return result as { response: string; toolsUsed: string[] };
  },
});

/**
 * Test combined zoning + area plans query.
 * This tests the enhanced behavior where both tools are used together.
 */
export const testCombinedQuery = action({
  args: {
    address: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ response: string; toolsUsed: string[] }> => {
    const address = args.address || "500 N Water St";
    const testMessage = `I want to build a mixed-use development with apartments and ground-floor retail at ${address}. What are the zoning requirements and how does this fit with the city's vision for the area?`;

    const result = await ctx.runAction(api.agents.zoning.chat, {
      message: testMessage,
    });

    return result as { response: string; toolsUsed: string[] };
  },
});

/**
 * Test home search - exercises search_homes_for_sale tool.
 */
export const testHomeSearch = action({
  args: {
    neighborhood: v.optional(v.string()),
    minBedrooms: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ response: string; toolsUsed: string[] }> => {
    const neighborhood = args.neighborhood || "Bay View";
    const minBedrooms = args.minBedrooms || 3;
    const testMessage = `Show me homes for sale in ${neighborhood} with at least ${minBedrooms} bedrooms.`;

    const result = await ctx.runAction(api.agents.zoning.chat, {
      message: testMessage,
    });

    return result as { response: string; toolsUsed: string[] };
  },
});

/**
 * Test Opik connection and tracing.
 */
export const testOpik = action({
  args: {},
  handler: async () => {
    const { testOpikConnection } = await import("../lib/opik");
    return await testOpikConnection();
  },
});
