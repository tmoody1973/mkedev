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

// Note: File Search only works with gemini-3 models
// gemini-2.5-flash returns 403 permission denied for File Search Stores
const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-3-flash-preview"; // Same model, no fallback for File Search
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
  const models = [primaryModel]; // Only primary model - fallback doesn't help for File Search
  const maxRetries = 1; // No retries - timeouts mean real issues, not transient failures
  const TIMEOUT_MS = 90000; // 90 second timeout for File Search queries

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[RAG] Calling ${model}, attempt ${attempt}...`);
        const startTime = Date.now();

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(
          `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        console.log(`[RAG] Response received in ${elapsed}ms, status: ${response.status}`);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Gemini API error (${model}, attempt ${attempt}):`, response.status, errorBody.substring(0, 500));
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
          console.log(`[RAG] Got valid response (${responseText.length} chars)`);
          return { response: result, modelUsed: model };
        }

        console.warn(`Empty response from ${model}, attempt ${attempt}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`[RAG] Request timeout after ${TIMEOUT_MS}ms (${model}, attempt ${attempt})`);
        } else {
          console.error(`Network error (${model}, attempt ${attempt}):`, error);
        }
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
 * Detect specific zoning subchapter from chunk text content.
 * Returns the subchapter key (e.g., "residential", "commercial") or null.
 */
function detectZoningSubchapter(text: string): { key: string; title: string } | null {
  const normalized = text.toLowerCase();

  // Pattern matching for specific subchapters based on section numbers and keywords
  const patterns: Array<{ pattern: RegExp | string[]; key: string; title: string }> = [
    // Subchapter 5 - Residential Districts
    { pattern: ['section 5', 'subchapter 5', 'residential district', 'rs1', 'rs2', 'rs3', 'rs4', 'rs5', 'rs6', 'rt1', 'rt2', 'rt3', 'rt4', 'rm1', 'rm2', 'rm3', 'rm4', 'rm5', 'rm6', 'rm7'], key: 'residential', title: 'Residential Districts' },
    // Subchapter 6 - Commercial Districts
    { pattern: ['section 6', 'subchapter 6', 'commercial district', 'ns1', 'ns2', 'lb1', 'lb2', 'lb3', 'lb4', 'lob1', 'lob2', 'cs1', 'cs2', 'cs3', 'cs4', 'cx1', 'cx2', 'cx3', 'cx4'], key: 'commercial', title: 'Commercial Districts' },
    // Subchapter 7 - Downtown Districts
    { pattern: ['section 7', 'subchapter 7', 'downtown district', 'c9a', 'c9b', 'c9c', 'c9d', 'c9e', 'c9f', 'c9g', 'c9h', 'c9i', 'c9j', 'c9k', 'c9l', 'c9m', 'c9n', 'c9o', 'c9p'], key: 'downtown', title: 'Downtown Districts' },
    // Subchapter 8 - Industrial Districts
    { pattern: ['section 8', 'subchapter 8', 'industrial district', 'il1', 'il2', 'im', 'ih1', 'ih2', 'ic'], key: 'industrial', title: 'Industrial Districts' },
    // Subchapter 9 - Special Districts
    { pattern: ['section 9', 'subchapter 9', 'special district', 'institutional', 'parks and recreation', 'pd-planned development'], key: 'special', title: 'Special Districts' },
    // Subchapter 10 - Overlay Zones
    { pattern: ['section 10', 'subchapter 10', 'overlay zone', 'historic district', 'design review', 'shoreland'], key: 'overlay', title: 'Overlay Zones' },
    // Subchapter 11 - Additional Regulations
    { pattern: ['section 11', 'subchapter 11', 'additional regulations', 'accessory', 'temporary use', 'nonconforming'], key: 'additional', title: 'Additional Regulations' },
    // Subchapter 2 - Definitions
    { pattern: ['section 2', 'subchapter 2', '295-201', 'definition'], key: 'definitions', title: 'Definitions' },
    // Subchapter 3 - Zoning Map
    { pattern: ['section 3', 'subchapter 3', 'zoning map', 'boundaries'], key: 'map', title: 'Zoning Map' },
    // Subchapter 4 - General Provisions (parking, signs, etc.)
    { pattern: ['section 4', 'subchapter 4', 'general provisions', 'parking', '295-403', '295-404', '295-405', 'off-street parking', 'bicycle parking', 'loading'], key: 'general', title: 'General Provisions' },
    // Subchapter 1 - Introduction
    { pattern: ['section 1', 'subchapter 1', 'purpose', 'applicability', 'compliance'], key: 'introduction', title: 'Introduction' },
    // Tables
    { pattern: ['table 295', 'dimensional standards'], key: 'tables', title: 'Zoning Tables' },
  ];

  for (const { pattern, key, title } of patterns) {
    if (Array.isArray(pattern)) {
      if (pattern.some(p => normalized.includes(p))) {
        return { key, title };
      }
    }
  }

  return null;
}

/**
 * Detect specific area plan from chunk text content.
 */
function detectAreaPlan(text: string): { key: string; title: string } | null {
  const normalized = text.toLowerCase();

  const plans: Array<{ patterns: string[]; key: string; title: string }> = [
    // Match specific plan names from actual PDF content
    { patterns: ['fond du lac & north', 'fond du lac and north', 'fondy', 'fondy north', 'north avenue corridor'], key: 'fondy-north-plan', title: 'Fond du Lac & North Area Plan' },
    { patterns: ['menomonee valley', 'menomonee river', 'valley plan 2.0'], key: 'menomonee-valley-plan', title: 'Menomonee Valley Plan' },
    { patterns: ['near west side', 'near west area'], key: 'near-west-plan', title: 'Near West Side Plan' },
    { patterns: ['near north side', 'near north area'], key: 'near-north-plan', title: 'Near North Side Plan' },
    { patterns: ['southeast side', 'southeast area', 'se side plan'], key: 'southeast-plan', title: 'Southeast Side Plan' },
    { patterns: ['southwest side', 'southwest area', 'sw side plan'], key: 'southwest-plan', title: 'Southwest Side Plan' },
    { patterns: ['northeast side', 'northeast area', 'ne side plan'], key: 'northeast-plan', title: 'Northeast Side Plan' },
    { patterns: ['northwest side', 'northwest area', 'nw side plan'], key: 'northwest-plan', title: 'Northwest Side Plan' },
    { patterns: ['north side comprehensive', 'north side area plan'], key: 'north-side-plan', title: 'North Side Plan' },
    { patterns: ['harbor district', 'inner harbor', 'harbor water and land'], key: 'harbor-district-plan', title: 'Harbor District Plan' },
    { patterns: ['third ward', 'historic third', 'walker\'s point'], key: 'third-ward-plan', title: 'Third Ward Plan' },
    { patterns: ['washington park', 'washington park area'], key: 'washington-park-plan', title: 'Washington Park Plan' },
    { patterns: ['downtown milwaukee', 'downtown plan', 'milwaukee downtown'], key: 'downtown-plan', title: 'Downtown Milwaukee Plan' },
    { patterns: ['housing element', 'affordable housing', 'housing policy'], key: 'housing-element', title: 'Housing Element Plan' },
    { patterns: ['citywide policy', 'comprehensive plan', 'citywide plan'], key: 'citywide-plan', title: 'Citywide Plan' },
  ];

  for (const { patterns, key, title } of plans) {
    if (patterns.some(p => normalized.includes(p))) {
      return { key, title };
    }
  }

  return null;
}

/**
 * Extract section reference from chunk text.
 * Looks for Milwaukee zoning code section numbers like "295-503", "Table 295-503-1", etc.
 */
function extractSectionReference(text: string): string | null {
  // Match patterns like "295-503", "295-503-1", "Table 295-503-1"
  const patterns = [
    /Table\s*295-\d{3}(?:-\d+)?/gi,     // Table 295-503-1
    /Section\s*295-\d{3}/gi,             // Section 295-503
    /295-\d{3}(?:-\d+)?/g,               // 295-503 or 295-503-1
    /Subchapter\s*\d+/gi,                // Subchapter 5
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Extract page number hint from chunk text.
 * Some PDFs include page indicators in the text.
 */
function extractPageHint(text: string): number | null {
  // Look for page indicators in text
  const patterns = [
    /Page\s*(\d+)/i,
    /pg\.?\s*(\d+)/i,
    /-\s*(\d+)\s*-/,  // Page numbers like "- 5 -"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const pageNum = parseInt(match[1], 10);
      if (pageNum > 0 && pageNum < 500) { // Sanity check
        return pageNum;
      }
    }
  }

  return null;
}

/**
 * Extract citations from grounding metadata in response.
 * Handles File Search Store format with retrievedContext.
 * Now parses chunk text to identify specific subchapters/documents.
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

  // Process each groundingChunk - these correspond to retrieved document chunks
  for (let i = 0; i < groundingMetadata.groundingChunks.length; i++) {
    const chunk = groundingMetadata.groundingChunks[i];

    // Check retrievedContext format (File Search)
    if (chunk.retrievedContext) {
      const fileId = chunk.retrievedContext.title; // File ID like "tbdlh4mvlmpr"
      const storeName = chunk.retrievedContext.fileSearchStore;
      const text = chunk.retrievedContext.text || "";

      // Determine the specific document from chunk text
      let sourceId: string;
      let sourceName: string;

      if (storeName?.includes("zoningcodes")) {
        // Parse the chunk text to determine which subchapter
        const subchapter = detectZoningSubchapter(text);
        if (subchapter) {
          sourceId = `zoning-${subchapter.key}`;
          sourceName = `Chapter 295 - ${subchapter.title}`;
        } else {
          // Fallback to general if can't determine
          sourceId = `zoning-general-${i}`;
          sourceName = "Chapter 295 - General Provisions";
        }
      } else if (storeName?.includes("areaplans")) {
        // Parse chunk text to determine which area plan
        const plan = detectAreaPlan(text);
        if (plan) {
          sourceId = plan.key;
          sourceName = plan.title;
        } else {
          sourceId = `area-plan-${i}`;
          sourceName = "Milwaukee Area Plans";
        }
      } else if (storeName?.includes("policies")) {
        sourceId = `policy-${i}`;
        sourceName = "Milwaukee Policy Documents";
      } else {
        sourceId = fileId || `unknown-${i}`;
        sourceName = "Milwaukee Zoning Code";
      }

      // Extract section reference and page hint from text
      const sectionReference = extractSectionReference(text);
      const pageNumber = extractPageHint(text);

      // Only add unique citations (by sourceId)
      if (!seen.has(sourceId)) {
        seen.add(sourceId);
        citations.push({
          sourceId,
          sourceName,
          excerpt: text.substring(0, 300) || "",
          sectionReference: sectionReference || undefined,
          pageNumber: pageNumber || undefined,
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

  // Log what we extracted for debugging
  console.log(`[RAG] Extracted ${citations.length} unique citations:`,
    citations.map(c => c.sourceName).join(', '));

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
        v.literal("guides"),
        v.literal("incentives")
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
        console.log("[RAG] No File Search Stores found, falling back to legacy RAG");
        return await ctx.runAction(api.ingestion.rag.queryDocuments, {
          question: args.question,
          category: args.category,
        });
      }

      // Verify stores actually exist in Gemini before querying
      // This prevents long timeouts when stores are deleted
      const geminiStoresResult = await ctx.runAction(
        api.ingestion.fileSearchStores.listGeminiStores,
        {}
      ) as { success: boolean; stores?: Array<{ name: string }> };

      if (geminiStoresResult.success && geminiStoresResult.stores) {
        const geminiStoreNames = new Set(geminiStoresResult.stores.map(s => s.name));
        const missingStores = storeNames.filter(name => !geminiStoreNames.has(name));

        if (missingStores.length > 0) {
          console.error("[RAG] File Search Stores missing from Gemini:", missingStores);
          return {
            success: false,
            error: {
              code: "STORES_NOT_FOUND",
              message: `File Search Stores no longer exist in Gemini. They may have expired or been deleted. Please re-run the setup script to recreate them.`,
            },
          };
        }
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
      }
      // Note: We use category-specific stores, so metadata filtering is optional

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
      // Use valid sourceIds that match documentUrls.ts keys
      if (citations.length === 0 && args.category) {
        console.log("No grounding citations found, using fallback citations for category:", args.category);
        if (args.category === "zoning-codes") {
          citations = [
            { sourceId: "zoning-general", sourceName: "Chapter 295 - General Provisions", excerpt: "" },
          ];
        } else if (args.category === "area-plans") {
          citations = [
            { sourceId: "citywide-plan", sourceName: "Citywide Plan", excerpt: "" },
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
        v.literal("guides"),
        v.literal("incentives")
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
 * Use this to see what grounding data Gemini actually returns.
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
      contents: [{ parts: [{ text: args.question ?? "What are the permitted uses in RS6?" }] }],
      tools: [{ fileSearch: { fileSearchStoreNames: storeNames } }],
    };

    console.log("[Debug] Using stores:", storeNames);
    console.log("[Debug] Request body:", JSON.stringify(requestBody, null, 2));

    const response: Response = await fetch(
      `${GEMINI_API_BASE}/models/${PRIMARY_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API error: ${response.status}`, details: errorText };
    }

    const result = await response.json() as Record<string, unknown>;
    const candidates = result.candidates as Array<Record<string, unknown>> | undefined;
    const candidate = candidates?.[0] as Record<string, unknown> | undefined;

    // Check all possible locations for grounding data
    const groundingMetadata = candidate?.["groundingMetadata"] as Record<string, unknown> | undefined;
    const citationMetadata = candidate?.["citationMetadata"];

    // Extract and analyze groundingChunks
    type GroundingChunk = {
      retrievedContext?: {
        uri?: string;
        title?: string;
        text?: string;
        fileSearchStore?: string;
      };
    };
    const groundingChunks = (groundingMetadata?.groundingChunks || []) as GroundingChunk[];
    const chunkAnalysis = groundingChunks.map((chunk, i) => {
      const ctx = chunk.retrievedContext;
      return {
        index: i,
        hasText: !!ctx?.text,
        textLength: ctx?.text?.length || 0,
        textPreview: ctx?.text?.substring(0, 200) || "NO TEXT",
        fileSearchStore: ctx?.fileSearchStore || "none",
        title: ctx?.title || "none",
        // Try to detect subchapter from text
        detectedSubchapter: ctx?.text ? detectZoningSubchapter(ctx.text) : null,
      };
    });
    const providerMetadata = (candidate?.["providerMetadata"] as Record<string, Record<string, unknown>>)?.["google"]?.["groundingMetadata"];
    const fileSearchEntries = result["fileSearchEntries"] || candidate?.["fileSearchEntries"];

    return {
      storesUsed: storeNames,
      topLevelKeys: Object.keys(result),
      candidateKeys: candidate ? Object.keys(candidate) : [],
      hasGroundingChunks: groundingChunks.length > 0,
      groundingChunksCount: groundingChunks.length,
      chunkAnalysis,  // Shows what text is in each chunk and detected subchapter
      citationMetadata: citationMetadata ?? "not present",
      providerMetadata: providerMetadata ?? "not present",
      fileSearchEntries: fileSearchEntries ?? "not present",
      modelVersion: result.modelVersion,
      usageMetadata: result.usageMetadata,
      responseText: (candidate?.content as Record<string, unknown[]>)?.parts?.[0] ?
        JSON.stringify((candidate?.content as Record<string, unknown[]>).parts[0]).substring(0, 500) : "no text",
    };
  },
});
