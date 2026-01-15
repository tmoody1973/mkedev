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
} from "./tools";
import { createTraceManager } from "../lib/opik";

// =============================================================================
// Configuration
// =============================================================================

const MODEL = "gemini-3-flash-preview";
const MAX_TOOL_CALLS = 15;

const SYSTEM_INSTRUCTION = `You are a helpful Milwaukee zoning assistant. Your role is to help users understand zoning requirements for properties in Milwaukee, Wisconsin.

## Your Capabilities

You have access to these tools:
1. **geocode_address** - Convert street addresses to coordinates
2. **query_zoning_at_point** - Get zoning district and overlay zones at a location
3. **calculate_parking** - Calculate required parking spaces
4. **query_zoning_code** - Search the Milwaukee zoning code for detailed regulations
5. **query_area_plans** - Search neighborhood area plans for development goals, housing strategies, and community vision (covers Downtown, Menomonee Valley, Third Ward, Near North Side, and 10+ other neighborhoods)

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

### 3. Use Area Plans for Neighborhood Context
When users ask about development goals, housing strategies, or community vision for a specific neighborhood:
- Use query_area_plans to find relevant neighborhood planning information
- Neighborhoods covered: Downtown, Menomonee Valley, Third Ward, Harbor District, Near North Side, Near West Side, North Side, Northwest Side, Northeast Side, Southeast Side, Southwest Side, Washington Park, Fondy/North

### 4. Be Specific and Cite Sources
- Always mention the specific zoning district (e.g., "In the DC Downtown Core district...")
- Reference code sections when possible (e.g., "Per Section 295-403...")
- Mention any overlay zones that may affect requirements
- For area plans, mention which neighborhood plan you're referencing

### 5. Response Format
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
 * Instrumented with Opik tracing for observability.
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

    // Initialize Opik tracing
    const tracer = createTraceManager();
    tracer.startTrace({
      name: "zoning-interpreter-chat",
      input: {
        message: args.message,
        historyLength: args.conversationHistory?.length || 0,
      },
      tags: ["zoning-agent", "gemini", "milwaukee"],
      metadata: {
        model: MODEL,
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
            model: MODEL,
            messageCount: contents.length,
            iteration,
          },
          metadata: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        });

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
          tracer.endSpan(llmSpanId, {
            output: { error: errorText, status: response.status },
          });
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];

        // Extract token usage if available
        const usageMetadata = result.usageMetadata;

        if (!candidate?.content?.parts) {
          tracer.endSpan(llmSpanId, {
            output: { error: "Empty response" },
          });
          throw new Error("Empty response from Gemini");
        }

        // End LLM span with token usage
        tracer.endSpan(llmSpanId, {
          output: {
            hasFunctionCalls: candidate.content.parts.some((p: { functionCall?: unknown }) => p.functionCall),
            partsCount: candidate.content.parts.length,
          },
          usage: usageMetadata
            ? {
                promptTokens: usageMetadata.promptTokenCount,
                completionTokens: usageMetadata.candidatesTokenCount,
                totalTokens: usageMetadata.totalTokenCount,
              }
            : undefined,
          model: MODEL,
          provider: "google",
        });

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
          const toolStartTime = Date.now();

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

            case "query_area_plans": {
              // Query area plans for neighborhood development information
              const areaArgs = fnArgs as { question: string; neighborhood?: string };
              const enhancedQuestion = areaArgs.neighborhood
                ? `Regarding the ${areaArgs.neighborhood} neighborhood: ${areaArgs.question}`
                : areaArgs.question;

              const areaPlanResult = await ctx.runAction(api.ingestion.ragV2.queryDocuments, {
                question: enhancedQuestion,
                category: "area-plans",
              }) as RAGResult;

              if (areaPlanResult.success && areaPlanResult.response) {
                toolResult = {
                  success: true,
                  answer: areaPlanResult.response.answer,
                  confidence: areaPlanResult.response.confidence,
                  citations: areaPlanResult.response.citations,
                };
              } else {
                toolResult = { success: false, error: areaPlanResult.error?.message || "Area plans query failed" };
              }
              break;
            }

            default:
              toolResult = { error: `Unknown tool: ${name}` };
          }

          // Log tool execution to Opik
          const toolDuration = Date.now() - toolStartTime;
          tracer.logToolExecution(
            { name, args: fnArgs as Record<string, unknown> },
            { result: toolResult, durationMs: toolDuration }
          );

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
          const finalResponse = textParts.map((p: { text: string }) => p.text).join("\n");

          // End trace with successful response
          await tracer.endTrace({
            response: finalResponse,
            toolsUsed,
            iterations: iteration,
            success: true,
          });

          return {
            response: finalResponse,
            toolsUsed,
          };
        }

        throw new Error("No text response from Gemini");
      }

      throw new Error("Max tool calls exceeded");
    } catch (error) {
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
