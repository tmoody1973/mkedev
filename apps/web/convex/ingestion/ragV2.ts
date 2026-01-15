/**
 * RAG Query Actions V2 - Using File Search Stores
 *
 * This is the updated RAG implementation using Gemini File Search Stores.
 * File Search Stores provide:
 * - Persistent storage (no 48-hour expiration)
 * - Automatic chunking and embedding
 * - Semantic search with metadata filtering
 *
 * Migrates from: direct file upload approach (rag.ts)
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import type { GroundedResponse, RAGResult, Citation } from "./types";

// =============================================================================
// Configuration
// =============================================================================

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-2.5-flash";
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Make a Gemini API call with retry and model fallback.
 */
async function callGeminiWithFallback(
  apiKey: string,
  requestBody: Record<string, unknown>,
  primaryModel: string,
  fallbackModel: string
): Promise<{ response: Record<string, unknown>; modelUsed: string }> {
  const models = [primaryModel, fallbackModel];
  const maxRetries = 2;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          console.error(`Gemini API error (${model}, attempt ${attempt}):`, response.status);
          if (response.status >= 500 || response.status === 429) {
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          }
          break;
        }

        const result = await response.json();
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
          return { response: result, modelUsed: model };
        }

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

  throw new Error("Failed to get valid response from Gemini after retries");
}

// =============================================================================
// System Prompts
// =============================================================================

const ZONING_SYSTEM_PROMPT = `You are an expert assistant for the Milwaukee Zoning Code (Chapter 295). Your role is to:

1. Answer questions accurately based on the official zoning code documents provided
2. ALWAYS use [1], [2], etc. citation markers to reference your sources inline
3. Clarify zoning terminology and explain technical concepts in plain language
4. Note when information may need verification with the city or a professional

IMPORTANT - Citation Format:
- Use numbered brackets like [1], [2] immediately after facts from sources
- Example: "Restaurants require 1 space per 100 sq ft [1]. Downtown districts may reduce this by 50% [2]."
- Place citations at the end of the relevant sentence, before the period

When answering:
- Be specific about which zoning district(s) apply
- Reference the relevant subchapter (e.g., "Subchapter 2 - Residential Districts") [1]
- Mention any conditional uses or special requirements
- If a question cannot be fully answered from the documents, say so clearly

Format responses to be clear and actionable for developers, property owners, and residents.`;

const GENERAL_SYSTEM_PROMPT = `You are a helpful assistant for Milwaukee civic planning and development.

IMPORTANT - Citation Format:
- ALWAYS use numbered brackets like [1], [2] to cite your sources inline
- Example: "The Near West Side plan emphasizes mixed-use development [1]."
- Place citations at the end of the relevant sentence

Answer questions based on the official documents provided. Be accurate and note when information may need professional verification.`;

// =============================================================================
// Helpers
// =============================================================================

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Extract citations from grounding metadata in response.
 * Handles File Search Store format with retrievedContext.
 */
function extractCitationsFromGrounding(
  groundingMetadata: {
    groundingChunks?: Array<{
      retrievedContext?: {
        uri?: string;
        title?: string;          // File ID (e.g., "tbdlh4mvlmpr")
        text?: string;           // Retrieved text content
        fileSearchStore?: string; // Store name
      };
      web?: {
        uri?: string;
        title?: string;
      };
    }>;
    groundingSupports?: Array<{
      segment?: { text?: string; startIndex?: number; endIndex?: number };
      groundingChunkIndices?: number[];
      confidenceScores?: number[];
    }>;
  } | undefined
): Citation[] {
  if (!groundingMetadata?.groundingChunks) {
    return [];
  }

  const citations: Citation[] = [];
  const seen = new Set<string>();

  // Process groundingChunks
  for (const chunk of groundingMetadata.groundingChunks) {
    // Check retrievedContext format (File Search)
    if (chunk.retrievedContext) {
      const fileId = chunk.retrievedContext.title; // File ID like "tbdlh4mvlmpr"
      const storeName = chunk.retrievedContext.fileSearchStore;
      const text = chunk.retrievedContext.text;

      // Use store name as source identifier
      const sourceId = storeName || fileId || "unknown";

      if (!seen.has(sourceId)) {
        seen.add(sourceId);

        // Determine source name from store or file ID
        let sourceName = "Milwaukee Zoning Code";
        if (storeName?.includes("zoningcodes")) {
          sourceName = "Milwaukee Zoning Code Chapter 295";
        } else if (storeName?.includes("areaplans")) {
          sourceName = "Milwaukee Area Plans";
        } else if (storeName?.includes("policies")) {
          sourceName = "Milwaukee Policy Documents";
        }

        citations.push({
          sourceId,
          sourceName,
          excerpt: text?.substring(0, 200) || "",
        });
      }
    }
    // Check web format (Google Search grounding)
    else if (chunk.web) {
      const uri = chunk.web.uri;
      const title = chunk.web.title;

      if (uri && !seen.has(uri)) {
        seen.add(uri);
        citations.push({
          sourceId: uri,
          sourceName: title || uri,
          excerpt: "",
        });
      }
    }
  }

  return citations;
}

/**
 * Calculate confidence based on grounding support.
 */
function calculateConfidenceFromGrounding(
  groundingMetadata: {
    groundingSupports?: Array<{
      confidenceScores?: number[];
    }>;
  } | undefined
): number {
  if (!groundingMetadata?.groundingSupports) {
    return 0.5;
  }

  // Average confidence scores from grounding supports
  let totalScore = 0;
  let count = 0;

  for (const support of groundingMetadata.groundingSupports) {
    if (support.confidenceScores) {
      for (const score of support.confidenceScores) {
        totalScore += score;
        count++;
      }
    }
  }

  if (count === 0) return 0.5;
  return Math.max(0.1, Math.min(1.0, totalScore / count));
}

// =============================================================================
// RAG Query Actions with File Search
// =============================================================================

/**
 * Query documents using File Search Stores.
 * This is the primary RAG function using the new persistent stores.
 */
export const queryWithFileSearch = action({
  args: {
    question: v.string(),
    category: v.optional(
      v.union(
        v.literal("zoning-codes"),
        v.literal("area-plans"),
        v.literal("policies"),
        v.literal("ordinances"),
        v.literal("guides")
      )
    ),
    metadataFilter: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxOutputTokens: v.optional(v.number()),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<RAGResult> => {
    const startTime = Date.now();
    const apiKey = getGeminiApiKey();
    const modelId = args.modelId ?? PRIMARY_MODEL;
    const temperature = args.temperature ?? DEFAULT_TEMPERATURE;
    const maxOutputTokens = args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;

    try {
      // Get the appropriate File Search Store(s)
      const stores = await ctx.runQuery(
        api.ingestion.fileSearchStores.listStores,
        {}
      );

      // Filter stores by category or use "all" store
      let storeNames: string[] = [];

      // Define store type for type safety
      type Store = { name: string; category: string; status: string };

      if (args.category) {
        // Look for category-specific store first
        const categoryStore = stores.find(
          (s: Store) => s.category === args.category && s.status === "active"
        );
        if (categoryStore) {
          storeNames.push(categoryStore.name);
        }

        // Also include "all" store if it exists
        const allStore = stores.find(
          (s: Store) => s.category === "all" && s.status === "active"
        );
        if (allStore && !storeNames.includes(allStore.name)) {
          storeNames.push(allStore.name);
        }
      } else {
        // Use all active stores
        storeNames = stores
          .filter((s: Store) => s.status === "active")
          .map((s: Store) => s.name);
      }

      if (storeNames.length === 0) {
        // Fall back to legacy RAG if no File Search Stores available
        return await ctx.runAction(api.ingestion.rag.queryDocuments, {
          question: args.question,
          category: args.category,
        });
      }

      // Build system prompt based on category
      const systemPrompt =
        args.category === "zoning-codes"
          ? ZONING_SYSTEM_PROMPT
          : GENERAL_SYSTEM_PROMPT;

      // Build File Search tool config
      const fileSearchTool: {
        fileSearch: {
          fileSearchStoreNames: string[];
          metadataFilter?: string;
        };
      } = {
        fileSearch: {
          fileSearchStoreNames: storeNames,
        },
      };

      // Add metadata filter if provided (disabled for now as we use separate stores per category)
      if (args.metadataFilter) {
        fileSearchTool.fileSearch.metadataFilter = args.metadataFilter;
      }
      // Note: We don't auto-filter by category since we're using category-specific stores

      // Build request body for Gemini
      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: args.question }],
          },
        ],
        tools: [fileSearchTool],
        generationConfig: {
          temperature,
          maxOutputTokens,
          topK: 40,
          topP: 0.95,
        },
      };

      console.log("RAG Request - stores:", storeNames);
      console.log("RAG Request - fileSearchTool:", JSON.stringify(fileSearchTool));

      // Call Gemini with File Search tool (with retry and fallback)
      let result: Record<string, unknown>;
      try {
        const geminiResult = await callGeminiWithFallback(
          apiKey,
          requestBody,
          modelId,
          FALLBACK_MODEL
        );
        result = geminiResult.response;
        console.log("RAG Response - model used:", geminiResult.modelUsed);
        // Log full response to see all available fields
        const resultKeys = Object.keys(result);
        console.log("RAG Response - top level keys:", resultKeys.join(", "));
        if ((result as { candidates?: unknown[] }).candidates) {
          const cand = (result as { candidates: unknown[] }).candidates[0];
          if (cand && typeof cand === "object") {
            console.log("RAG Response - candidate keys:", Object.keys(cand).join(", "));
          }
        }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "API_ERROR",
            message: error instanceof Error ? error.message : "Gemini API error after retries",
          },
        };
      }

      const candidate = (result as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; groundingMetadata?: unknown }> }).candidates?.[0];
      const responseText = candidate?.content?.parts?.[0]?.text ?? "";

      if (!responseText) {
        return {
          success: false,
          error: {
            code: "API_ERROR",
            message: "Empty response from Gemini after retries",
          },
        };
      }

      // Extract grounding information
      const groundingMetadata = candidate?.groundingMetadata as {
        groundingChunks?: Array<{
          retrievedContext?: {
            uri?: string;
            title?: string;          // File ID
            text?: string;           // Retrieved text
            fileSearchStore?: string; // Store name
          };
          web?: {
            uri?: string;
            title?: string;
          };
        }>;
        groundingSupports?: Array<{
          segment?: { text?: string; startIndex?: number; endIndex?: number };
          groundingChunkIndices?: number[];
          confidenceScores?: number[];
        }>;
      } | undefined;

      // Log grounding metadata for debugging
      console.log("RAG grounding metadata:", JSON.stringify(groundingMetadata, null, 2));
      console.log("RAG candidate keys:", candidate ? Object.keys(candidate) : "no candidate");
      console.log("RAG full candidate:", JSON.stringify(candidate, null, 2).substring(0, 2000));

      let citations = extractCitationsFromGrounding(groundingMetadata);
      const confidence = calculateConfidenceFromGrounding(groundingMetadata);

      // If no grounding citations, create fallback citations from the category
      if (citations.length === 0 && args.category) {
        console.log("No grounding citations found, using fallback citations for category:", args.category);
        if (args.category === "zoning-codes") {
          citations = [
            { sourceId: "ch295", sourceName: "Milwaukee Zoning Code Chapter 295", excerpt: "" },
          ];
        } else if (args.category === "area-plans") {
          citations = [
            { sourceId: "area-plans", sourceName: "Milwaukee Area Plans", excerpt: "" },
          ];
        }
      }

      const processingTimeMs = Date.now() - startTime;

      const groundedResponse: GroundedResponse = {
        answer: responseText,
        citations,
        confidence,
        sourceIds: storeNames, // Store names used
        processingTimeMs,
      };

      return {
        success: true,
        response: groundedResponse,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `Query failed: ${message}`,
        },
      };
    }
  },
});

/**
 * Enhanced zoning question handler using File Search.
 */
export const askZoningQuestionV2 = action({
  args: {
    question: v.string(),
    districtCode: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<RAGResult> => {
    // Enhance question with context if district code provided
    let enhancedQuestion = args.question;

    if (args.districtCode) {
      enhancedQuestion = `Regarding zoning district ${args.districtCode}: ${args.question}`;
    }

    // Query using zoning-codes category with File Search
    return await ctx.runAction(api.ingestion.ragV2.queryWithFileSearch, {
      question: enhancedQuestion,
      category: "zoning-codes",
    });
  },
});

/**
 * Query documents - auto-selects File Search or legacy based on availability.
 */
export const queryDocuments = action({
  args: {
    question: v.string(),
    category: v.optional(
      v.union(
        v.literal("zoning-codes"),
        v.literal("area-plans"),
        v.literal("policies"),
        v.literal("ordinances"),
        v.literal("guides")
      )
    ),
    maxDocuments: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<RAGResult> => {
    // Check if File Search Stores are available
    const stores = await ctx.runQuery(
      api.ingestion.fileSearchStores.listStores,
      {}
    );

    type Store = { name: string; category: string; status: string };

    const hasActiveStores = stores.some(
      (s: Store) =>
        s.status === "active" &&
        (args.category ? s.category === args.category || s.category === "all" : true)
    );

    if (hasActiveStores) {
      // Use File Search V2
      return await ctx.runAction(api.ingestion.ragV2.queryWithFileSearch, {
        question: args.question,
        category: args.category,
      });
    }

    // Fall back to legacy RAG
    return await ctx.runAction(api.ingestion.rag.queryDocuments, {
      question: args.question,
      category: args.category,
      maxDocuments: args.maxDocuments,
    });
  },
});

/**
 * Test query with File Search.
 */
export const testQuery = action({
  args: {
    question: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<RAGResult> => {
    const testQuestion =
      args.question ?? "What are the permitted uses in the RS6 residential district?";

    return await ctx.runAction(api.ingestion.ragV2.queryDocuments, {
      question: testQuestion,
      category: "zoning-codes",
    });
  },
});

/**
 * Debug action to inspect raw Gemini response structure.
 */
export const debugRawResponse = action({
  args: {
    question: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    const apiKey = getGeminiApiKey();
    type Store = { name: string; category: string; status: string };
    const stores: Store[] = await ctx.runQuery(api.ingestion.fileSearchStores.listStores, {});

    const storeNames: string[] = stores
      .filter((s) => s.status === "active" && s.category === "zoning-codes")
      .map((s) => s.name);

    const requestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: args.question ?? "What is RS6 zoning?" }] }],
      tools: [{ fileSearch: { fileSearchStoreNames: storeNames } }],
    };

    const response: Response = await fetch(
      `${GEMINI_API_BASE}/models/${PRIMARY_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      return { error: `API error: ${response.status}` };
    }

    const result = await response.json() as Record<string, unknown>;
    const candidates = result.candidates as Array<Record<string, unknown>> | undefined;
    const candidate = candidates?.[0] as Record<string, unknown> | undefined;

    // Check all possible locations for grounding data
    const groundingMetadata = candidate?.["groundingMetadata"];
    const citationMetadata = candidate?.["citationMetadata"];
    const providerMetadata = (candidate?.["providerMetadata"] as Record<string, Record<string, unknown>>)?.["google"]?.["groundingMetadata"];
    const fileSearchEntries = result["fileSearchEntries"] || candidate?.["fileSearchEntries"];

    return {
      topLevelKeys: Object.keys(result),
      candidateKeys: candidate ? Object.keys(candidate) : [],
      groundingMetadata: groundingMetadata ?? "not present",
      citationMetadata: citationMetadata ?? "not present",
      providerMetadata: providerMetadata ?? "not present",
      fileSearchEntries: fileSearchEntries ?? "not present",
      hasGroundingChunks: !!(groundingMetadata as Record<string, unknown>)?.groundingChunks,
      modelVersion: result.modelVersion,
      usageMetadata: result.usageMetadata,
      responseText: (candidate?.content as Record<string, unknown[]>)?.parts?.[0] ?
        JSON.stringify((candidate?.content as Record<string, unknown[]>).parts[0]).substring(0, 500) : "no text",
    };
  },
});
