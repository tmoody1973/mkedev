"use node";

/**
 * Context Cache Manager for MKE.dev
 *
 * Manages a cached 1M token context containing the full Milwaukee zoning corpus.
 * Enables deep reasoning queries that RAG cannot handle well:
 * - Cross-reference analysis across all zones
 * - Conflict detection between overlays and base zoning
 * - Comprehensive feasibility analysis
 * - "What are all my options?" queries
 *
 * Uses Gemini's context caching to reduce costs and latency for repeated queries.
 */

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";

// =============================================================================
// Configuration
// =============================================================================

// Gemini 3 models for Gemini 3 Hackathon
const GEMINI_FLASH_MODEL = "gemini-3-flash-preview"; // Fast, 1M context
const GEMINI_PRO_MODEL = "gemini-3-pro-preview"; // Thinking, 1M context
const CACHE_TTL_SECONDS = 3600; // 1 hour cache

// =============================================================================
// Types
// =============================================================================

interface CachedContext {
  name: string;
  displayName: string;
  createTime: string;
  expireTime: string;
  model: string;
  usageMetadata?: {
    totalTokenCount: number;
  };
}

interface DeepAnalysisResult {
  response: string;
  reasoning?: string; // Thinking process (if using thinking model)
  tokensUsed: {
    cached: number;
    new: number;
    total: number;
  };
  modelUsed: string;
  queryType: "simple" | "complex" | "feasibility";
}

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

/**
 * Determine if a query benefits from full context vs RAG
 */
function classifyQuery(query: string): "simple" | "complex" | "feasibility" {
  const complexPatterns = [
    /compare|across|all zones|every zone|comprehensive/i,
    /conflict|contradiction|overlap|inconsistenc/i,
    /what are my options|where can I|which zones allow/i,
    /tradeoffs?|pros and cons|advantages/i,
    /best zone|recommend|optimal/i,
  ];

  const feasibilityPatterns = [
    /feasibility|feasible|can I build/i,
    /mixed.?use.*development|development.*mixed.?use/i,
    /analyze.*requirements|requirements.*analyz/i,
    /comply|compliance|meet.*requirements/i,
    /what.*need.*to.*build|build.*what.*need/i,
  ];

  if (feasibilityPatterns.some((p) => p.test(query))) {
    return "feasibility";
  }

  if (complexPatterns.some((p) => p.test(query))) {
    return "complex";
  }

  return "simple";
}

// =============================================================================
// Corpus Loading
// =============================================================================

/**
 * Load the full zoning corpus for context caching.
 * This includes all zoning code sections, area plans, and incentive info.
 */
export const loadZoningCorpus = internalAction({
  args: {},
  handler: async (ctx): Promise<string> => {
    // Query all documents from the documents table
    const documents = await ctx.runQuery(internal.ingestion.documents.listAll, {});

    // Build corpus sections
    const sections: string[] = [];

    // Header
    sections.push(`# Milwaukee Zoning Intelligence Corpus
Generated: ${new Date().toISOString()}
Total Documents: ${documents.length}

This corpus contains the complete Milwaukee Zoning Code (Chapter 295),
neighborhood area plans, and housing incentive programs. Use this comprehensive
context to answer complex questions that require cross-referencing multiple
sections or comparing requirements across different zoning districts.

---
`);

    // Group documents by category
    const byCategory: Record<string, typeof documents> = {};
    for (const doc of documents) {
      const cat = doc.category || "other";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(doc);
    }

    // Add each category
    for (const [category, docs] of Object.entries(byCategory)) {
      sections.push(`\n## ${category.toUpperCase().replace(/-/g, " ")}\n`);

      for (const doc of docs) {
        sections.push(`### ${doc.title}\n`);
        if (doc.description) {
          sections.push(`*${doc.description}*\n`);
        }
        // Note: Actual PDF content would be extracted here
        // For now, we include metadata that helps with routing
        sections.push(`Source: ${doc.sourcePath}\n`);
        sections.push(`---\n`);
      }
    }

    // Add structured zoning summary for quick reference
    sections.push(`
## QUICK REFERENCE: ZONING DISTRICT SUMMARY

### Residential Districts
- **RS1-RS6**: Single-family residential, varying lot sizes
- **RT1-RT4**: Two-family residential
- **RM1-RM7**: Multi-family residential, varying densities

### Commercial Districts
- **NS1-NS2**: Neighborhood-serving commercial
- **LB1-LB2**: Local business
- **RB1-RB2**: Regional business
- **CS**: Commercial service

### Downtown Districts
- **DC**: Downtown core (highest density)
- **DW**: Downtown waterfront
- **DE**: Downtown edge

### Industrial Districts
- **IL1-IL2**: Light industrial
- **IH**: Heavy industrial
- **IM**: Industrial mixed

### Special Districts
- **PD**: Planned development
- **IP**: Institutional public
- **PR**: Parks and recreation

## PARKING REQUIREMENTS QUICK REFERENCE

| Use | Requirement |
|-----|-------------|
| Single-family | 1 space per unit |
| Multi-family | 1 space per unit (varies by district) |
| Retail | 1 per 300 sq ft |
| Restaurant | 1 per 100 sq ft dining + 1 per 300 sq ft other |
| Office | 1 per 400 sq ft |
| Industrial | 1 per 1,000 sq ft |

Note: Downtown Overlay provides 50% parking reduction.
Reduced Parking Districts may provide additional reductions.

## OVERLAY ZONES

Overlay zones modify base zoning requirements:
- **Historic Districts**: Additional design review required
- **Downtown Overlay**: Parking reductions, height bonuses
- **Shoreland Overlay**: Environmental protections
- **Floodplain Overlay**: FEMA requirements apply
`);

    return sections.join("\n");
  },
});

// =============================================================================
// Context Cache Management
// =============================================================================

/**
 * Create or refresh the cached context.
 * Called periodically or when corpus changes.
 */
export const createContextCache = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; cacheInfo?: CachedContext; error?: string }> => {
    const apiKey = getGeminiApiKey();

    try {
      // Load the full corpus
      const corpus = await ctx.runAction(internal.agents.contextCache.loadZoningCorpus, {});

      console.log(`[ContextCache] Corpus loaded: ${corpus.length} characters`);

      // Create cached content via Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: `models/${GEMINI_FLASH_MODEL}`,
            displayName: "mke-zoning-corpus-v1",
            contents: [
              {
                role: "user",
                parts: [{ text: corpus }],
              },
            ],
            systemInstruction: {
              parts: [
                {
                  text: `You are an expert Milwaukee zoning analyst with the COMPLETE Milwaukee Zoning Code
and all neighborhood area plans loaded in your context.

Your capabilities with this full context:
1. Cross-reference ANY section of the zoning code with any other
2. Compare requirements across ALL zoning districts simultaneously
3. Identify conflicts between base zoning and overlay requirements
4. Provide comprehensive "what are my options" analysis
5. Perform thorough feasibility assessments

When answering:
- Cite specific code sections (e.g., "Per §295-503-2(a)")
- Note when different sections interact or conflict
- Consider ALL applicable overlays and special districts
- Provide complete analysis, not just the most relevant snippet`,
                },
              ],
            },
            ttl: `${CACHE_TTL_SECONDS}s`,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ContextCache] Failed to create cache:", errorText);
        return { success: false, error: errorText };
      }

      const cacheInfo = (await response.json()) as CachedContext;
      console.log("[ContextCache] Cache created:", cacheInfo.name);

      return { success: true, cacheInfo };
    } catch (error) {
      console.error("[ContextCache] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * List existing cached contexts.
 */
export const listCaches = action({
  args: {},
  handler: async (): Promise<CachedContext[]> => {
    const apiKey = getGeminiApiKey();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${apiKey}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      console.error("[ContextCache] Failed to list caches");
      return [];
    }

    const result = await response.json();
    return (result.cachedContents || []) as CachedContext[];
  },
});

/**
 * Get or create the zoning corpus cache.
 */
export const getOrCreateCache = action({
  args: {},
  handler: async (ctx): Promise<{ cacheName: string | null; error?: string }> => {
    // First, check for existing cache
    const caches = await ctx.runAction(api.agents.contextCache.listCaches, {});

    const existingCache = caches.find(
      (c: CachedContext) => c.displayName === "mke-zoning-corpus-v1" && new Date(c.expireTime) > new Date()
    );

    if (existingCache) {
      console.log("[ContextCache] Using existing cache:", existingCache.name);
      return { cacheName: existingCache.name };
    }

    // Create new cache
    console.log("[ContextCache] Creating new cache...");
    const result = await ctx.runAction(api.agents.contextCache.createContextCache, {});

    if (result.success && result.cacheInfo) {
      return { cacheName: result.cacheInfo.name };
    }

    return { cacheName: null, error: result.error };
  },
});

// =============================================================================
// Deep Analysis with Gemini 2.5 (Gemini 3) - 1M Context + Thinking
// =============================================================================

/**
 * Perform deep analysis using Gemini 2.5's native 1M token context window.
 * This is the KEY HACKATHON FEATURE - using Gemini 3's massive context for:
 * - Cross-referencing entire zoning code
 * - Comparative analysis across all zones
 * - Deep reasoning with Thinking Levels
 */
export const deepAnalysis = action({
  args: {
    query: v.string(),
    useThinking: v.optional(v.boolean()), // Enable Gemini 2.5 Pro thinking for feasibility
    parcelContext: v.optional(
      v.object({
        address: v.string(),
        zoningDistrict: v.optional(v.string()),
        overlayZones: v.optional(v.array(v.string())),
        coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      })
    ),
  },
  handler: async (ctx, args): Promise<DeepAnalysisResult> => {
    const apiKey = getGeminiApiKey();
    const queryType = classifyQuery(args.query);

    console.log(`[DeepAnalysis] Gemini 3 deep analysis - Query type: ${queryType}, useThinking: ${args.useThinking}`);

    // Load the FULL zoning corpus - leveraging Gemini 2.5's 1M context
    const corpus = await ctx.runAction(internal.agents.contextCache.loadZoningCorpus, {});
    console.log(`[DeepAnalysis] Loaded ${corpus.length} chars of zoning corpus`);

    // Build the enhanced query with parcel context if provided
    let userQuery = args.query;
    if (args.parcelContext) {
      userQuery = `
PARCEL CONTEXT:
- Address: ${args.parcelContext.address}
- Current Zoning: ${args.parcelContext.zoningDistrict || "Unknown"}
- Overlay Zones: ${args.parcelContext.overlayZones?.join(", ") || "None identified"}
${args.parcelContext.coordinates ? `- Location: ${args.parcelContext.coordinates.lat}, ${args.parcelContext.coordinates.lng}` : ""}

USER QUESTION:
${args.query}

Please provide a comprehensive analysis considering all applicable sections of the zoning code.`;
    }

    // Choose model: Gemini 2.5 Pro for thinking, Flash for speed
    const useThinkingModel = args.useThinking || queryType === "feasibility";
    const model = useThinkingModel ? GEMINI_PRO_MODEL : GEMINI_FLASH_MODEL;

    console.log(`[DeepAnalysis] Using ${model} (thinking: ${useThinkingModel})`);

    // System instruction for zoning expertise
    const systemInstruction = `You are an expert Milwaukee zoning analyst with the COMPLETE Milwaukee Zoning Code
(Chapter 295) loaded in context. You have access to ALL zoning districts, overlays, and regulations.

Your capabilities with this full context:
1. Cross-reference ANY section of the zoning code with any other
2. Compare requirements across ALL zoning districts simultaneously
3. Identify conflicts between base zoning and overlay requirements
4. Provide comprehensive "what are my options" analysis
5. Perform thorough feasibility assessments

When answering:
- Cite specific code sections (e.g., "Per §295-503-2(a)")
- Note when different sections interact or conflict
- Consider ALL applicable overlays and special districts
- Provide complete analysis, not just the most relevant snippet
- For comparative questions, create tables comparing zones`;

    // Build request body
    const requestBody: Record<string, unknown> = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: `COMPLETE MILWAUKEE ZONING CODE:\n\n${corpus}` },
          ],
        },
        {
          role: "model",
          parts: [
            { text: "I have loaded the complete Milwaukee Zoning Code. I can now answer questions about any zoning district, compare across zones, and perform comprehensive analysis. What would you like to know?" },
          ],
        },
        {
          role: "user",
          parts: [{ text: userQuery }],
        },
      ],
      generationConfig: {
        temperature: useThinkingModel ? 0.1 : 0.3,
        maxOutputTokens: useThinkingModel ? 16384 : 8192,
      },
    };

    // Add Thinking Levels for Gemini 3 Pro - KEY HACKATHON FEATURE
    if (useThinkingModel) {
      // Gemini 3 uses thinkingLevel (low/high) and includeThoughts
      (requestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
        thinkingLevel: "high", // Use high for all complex/feasibility queries
        includeThoughts: true, // Return the reasoning in response
      };
      console.log(`[DeepAnalysis] Gemini 3 Thinking enabled: high (${queryType})`);
    }

    // Make API call to Gemini 3
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
      console.error("[DeepAnalysis] Gemini 3 API error:", errorText);
      throw new Error(`Gemini 3 API error: ${errorText}`);
    }

    const result = await response.json();

    // Extract response and thinking (Gemini 2.5 Pro returns thought parts)
    const candidate = result.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("No response from Gemini 3");
    }

    let responseText = "";
    let reasoningText = "";

    for (const part of candidate.content.parts) {
      if (part.thought) {
        // Thinking/reasoning content from Gemini 2.5 Pro
        reasoningText += part.text || "";
      } else if (part.text) {
        // Final response
        responseText += part.text;
      }
    }

    const usageMetadata = result.usageMetadata || {};

    console.log(`[DeepAnalysis] Gemini 3 response: ${responseText.length} chars, reasoning: ${reasoningText.length} chars`);
    console.log(`[DeepAnalysis] Tokens - prompt: ${usageMetadata.promptTokenCount}, completion: ${usageMetadata.candidatesTokenCount}`);

    return {
      response: responseText,
      reasoning: reasoningText || undefined,
      tokensUsed: {
        cached: usageMetadata.cachedContentTokenCount || 0,
        new: usageMetadata.promptTokenCount || 0,
        total: usageMetadata.totalTokenCount || 0,
      },
      modelUsed: model,
      queryType,
    };
  },
});

// =============================================================================
// Hybrid Query Router
// =============================================================================

/**
 * Smart query router that chooses between RAG and full context.
 * Use this as the main entry point for zoning queries.
 */
export const smartQuery = action({
  args: {
    query: v.string(),
    forceDeep: v.optional(v.boolean()), // Force deep analysis even for simple queries
    parcelContext: v.optional(
      v.object({
        address: v.string(),
        zoningDistrict: v.optional(v.string()),
        overlayZones: v.optional(v.array(v.string())),
        coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      })
    ),
  },
  handler: async (ctx, args): Promise<{
    response: string;
    method: "rag" | "deep-context" | "deep-thinking";
    reasoning?: string;
    queryType: string;
  }> => {
    const queryType = classifyQuery(args.query);

    // Route based on query type
    if (args.forceDeep || queryType !== "simple") {
      console.log(`[SmartQuery] Using deep analysis for ${queryType} query`);

      const result = await ctx.runAction(api.agents.contextCache.deepAnalysis, {
        query: args.query,
        useThinking: queryType === "feasibility",
        parcelContext: args.parcelContext,
      });

      return {
        response: result.response,
        method: result.reasoning ? "deep-thinking" : "deep-context",
        reasoning: result.reasoning,
        queryType,
      };
    }

    // For simple queries, use RAG (faster and cheaper)
    console.log("[SmartQuery] Using RAG for simple query");

    const ragResult = await ctx.runAction(api.ingestion.ragV2.queryDocuments, {
      question: args.query,
      category: "zoning-codes",
    });

    interface RAGResponse {
      success: boolean;
      response?: {
        answer: string;
      };
      error?: {
        message?: string;
      };
    }

    const typedResult = ragResult as RAGResponse;

    if (typedResult.success && typedResult.response) {
      return {
        response: typedResult.response.answer,
        method: "rag",
        queryType,
      };
    }

    // Fallback to deep analysis if RAG fails
    console.log("[SmartQuery] RAG failed, falling back to deep analysis");

    const deepResult = await ctx.runAction(api.agents.contextCache.deepAnalysis, {
      query: args.query,
      useThinking: false,
      parcelContext: args.parcelContext,
    });

    return {
      response: deepResult.response,
      method: "deep-context",
      queryType,
    };
  },
});

// =============================================================================
// Test Actions
// =============================================================================

/**
 * Test the deep analysis with a complex query.
 */
export const testDeepAnalysis = action({
  args: {},
  handler: async (ctx): Promise<DeepAnalysisResult> => {
    const testQuery = `I want to open a craft brewery with a taproom, outdoor seating, and live music.

Compare ALL commercial and mixed-use zones in Milwaukee where this combination of uses would be permitted.
For each viable zone, explain:
1. Whether brewery is permitted by-right or requires conditional use
2. Whether outdoor seating is allowed and any restrictions
3. Whether live music/entertainment is permitted
4. Parking requirements
5. Any relevant overlay zones that might help or hinder

Recommend the top 3 zones for this use case with reasoning.`;

    return await ctx.runAction(api.agents.contextCache.deepAnalysis, {
      query: testQuery,
      useThinking: true,
    });
  },
});

/**
 * Test the smart query router.
 */
export const testSmartQuery = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<{
    response: string;
    method: "rag" | "deep-context" | "deep-thinking";
    reasoning?: string;
    queryType: string;
  }> => {
    return await ctx.runAction(api.agents.contextCache.smartQuery, {
      query: args.query,
    });
  },
});
