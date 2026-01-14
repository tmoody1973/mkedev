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

const DEFAULT_MODEL = "gemini-3-flash-preview";
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// =============================================================================
// System Prompts
// =============================================================================

const ZONING_SYSTEM_PROMPT = `You are an expert assistant for the Milwaukee Zoning Code (Chapter 295). Your role is to:

1. Answer questions accurately based on the official zoning code documents provided
2. Cite specific sections, subchapters, and page references when available
3. Clarify zoning terminology and explain technical concepts in plain language
4. Note when information may need verification with the city or a professional

When answering:
- Be specific about which zoning district(s) apply
- Reference the relevant subchapter (e.g., "Subchapter 2 - Residential Districts")
- Mention any conditional uses or special requirements
- If a question cannot be fully answered from the documents, say so clearly

Format responses to be clear and actionable for developers, property owners, and residents.`;

const GENERAL_SYSTEM_PROMPT = `You are a helpful assistant for Milwaukee civic planning and development. Answer questions based on the official documents provided, citing sources when possible. Be accurate and note when information may need professional verification.`;

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
 */
function extractCitationsFromGrounding(
  groundingMetadata: {
    groundingChunks?: Array<{
      retrievedContext?: {
        uri?: string;
        title?: string;
      };
    }>;
    groundingSupports?: Array<{
      segment?: { text?: string };
      groundingChunkIndices?: number[];
    }>;
  } | undefined
): Citation[] {
  if (!groundingMetadata?.groundingChunks) {
    return [];
  }

  const citations: Citation[] = [];
  const seen = new Set<string>();

  for (const chunk of groundingMetadata.groundingChunks) {
    const uri = chunk.retrievedContext?.uri;
    const title = chunk.retrievedContext?.title;

    if (uri && !seen.has(uri)) {
      seen.add(uri);
      citations.push({
        sourceId: uri,
        sourceName: title || uri,
        excerpt: "",
      });
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
    const modelId = args.modelId ?? DEFAULT_MODEL;
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

      // Add metadata filter if provided
      if (args.metadataFilter) {
        fileSearchTool.fileSearch.metadataFilter = args.metadataFilter;
      } else if (args.category) {
        // Auto-filter by category
        fileSearchTool.fileSearch.metadataFilter = `category="${args.category}"`;
      }

      // Call Gemini with File Search tool
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: "API_ERROR",
            message: `Gemini API error: ${response.status}`,
            details: errorText,
          },
        };
      }

      const result = await response.json();
      const candidate = result.candidates?.[0];
      const responseText = candidate?.content?.parts?.[0]?.text ?? "";

      if (!responseText) {
        return {
          success: false,
          error: {
            code: "API_ERROR",
            message: "Empty response from Gemini",
          },
        };
      }

      // Extract grounding information
      const groundingMetadata = candidate?.groundingMetadata;
      const citations = extractCitationsFromGrounding(groundingMetadata);
      const confidence = calculateConfidenceFromGrounding(groundingMetadata);

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
