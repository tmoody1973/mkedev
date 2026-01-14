/**
 * Zoning Interpreter Agent - Convex Implementation
 *
 * Conversational agent that helps users understand Milwaukee zoning requirements.
 * Uses Gemini function calling for intelligent tool orchestration.
 */

import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
import {
  TOOL_DECLARATIONS,
  geocodeAddress,
  queryZoningAtPoint,
  calculateParking,
} from "./tools";

// =============================================================================
// Configuration
// =============================================================================

const MODEL = "gemini-3-flash-preview";
const MAX_TOOL_CALLS = 10;

const SYSTEM_INSTRUCTION = `You are a helpful Milwaukee zoning assistant. Your role is to help users understand zoning requirements for properties in Milwaukee, Wisconsin.

## Your Capabilities

You have access to these tools:
1. **geocode_address** - Convert street addresses to coordinates
2. **query_zoning_at_point** - Get zoning district and overlay zones at a location
3. **calculate_parking** - Calculate required parking spaces
4. **query_zoning_code** - Search the Milwaukee zoning code for detailed regulations

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

### 3. Be Specific and Cite Sources
- Always mention the specific zoning district (e.g., "In the DC Downtown Core district...")
- Reference code sections when possible (e.g., "Per Section 295-403...")
- Mention any overlay zones that may affect requirements

### 4. Response Format
Structure your responses clearly:
1. **Direct Answer** - Start with the specific answer
2. **Details** - Provide the calculation or reasoning
3. **Code Reference** - Cite the relevant section
4. **Special Notes** - Mention any exceptions or options`;

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

// =============================================================================
// Agent Actions
// =============================================================================

/**
 * Chat with the Zoning Interpreter Agent.
 */
export const chat = action({
  args: {
    message: v.string(),
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
  }> => {
    const apiKey = getGeminiApiKey();
    const toolsUsed: string[] = [];

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

    while (iteration < MAX_TOOL_CALLS) {
      iteration++;

      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents,
            tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (!candidate?.content?.parts) {
        throw new Error("Empty response from Gemini");
      }

      // Check for function calls
      const functionCalls = candidate.content.parts.filter(
        (p: { functionCall?: unknown }) => p.functionCall
      );

      if (functionCalls.length > 0) {
        // Add model response to history
        contents.push({
          role: "model",
          parts: candidate.content.parts,
        });

        // Execute function calls and add responses
        const functionResponses: Array<{
          functionResponse: { name: string; response: Record<string, unknown> };
        }> = [];

        for (const part of functionCalls) {
          const { name, args: fnArgs } = part.functionCall;
          toolsUsed.push(name);

          // Execute tool inline to avoid type issues
          let toolResult: Record<string, unknown>;

          switch (name) {
            case "geocode_address":
              toolResult = await geocodeAddress(fnArgs as Parameters<typeof geocodeAddress>[0]);
              break;

            case "query_zoning_at_point":
              toolResult = await queryZoningAtPoint(fnArgs as Parameters<typeof queryZoningAtPoint>[0]);
              break;

            case "calculate_parking":
              toolResult = calculateParking(fnArgs as Parameters<typeof calculateParking>[0]);
              break;

            case "query_zoning_code": {
              // Use RAG V2 (File Search Stores with fallback to legacy)
              const ragResult = await ctx.runAction(api.ingestion.ragV2.queryDocuments, {
                question: (fnArgs as { question: string }).question,
                category: "zoning-codes",
              }) as RAGResult;

              if (ragResult.success && ragResult.response) {
                toolResult = {
                  success: true,
                  answer: ragResult.response.answer,
                  confidence: ragResult.response.confidence,
                  citations: ragResult.response.citations,
                };
              } else {
                toolResult = { success: false, error: ragResult.error?.message || "RAG query failed" };
              }
              break;
            }

            default:
              toolResult = { error: `Unknown tool: ${name}` };
          }

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
      const textParts = candidate.content.parts.filter(
        (p: { text?: string }) => p.text
      );

      if (textParts.length > 0) {
        return {
          response: textParts.map((p: { text: string }) => p.text).join("\n"),
          toolsUsed,
        };
      }

      throw new Error("No text response from Gemini");
    }

    throw new Error("Max tool calls exceeded");
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
