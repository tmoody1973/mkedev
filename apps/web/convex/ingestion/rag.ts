/**
 * RAG Query Actions
 *
 * Convex actions for querying documents using Gemini with file context.
 * Supports single and multi-document RAG queries with grounded responses.
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

// =============================================================================
// Document Routing - Keyword-based document selection
// =============================================================================

/**
 * Keywords that indicate which documents are most relevant to a question.
 * This enables intelligent document routing for better RAG accuracy.
 */
const DOCUMENT_KEYWORDS: Record<string, string[]> = {
  "zoning-ch295-sub1": [
    "definition", "definitions", "general", "terms", "purpose", "what is",
    "meaning", "intent", "applicability", "scope"
  ],
  "zoning-ch295-sub2": [
    "residential", "rs1", "rs2", "rs3", "rs4", "rs5", "rs6", "rt1", "rt2", "rt3", "rt4",
    "rm1", "rm2", "rm3", "rm4", "rm5", "rm6", "rm7", "ro1", "ro2",
    "house", "home", "duplex", "apartment", "dwelling", "single-family", "multi-family",
    "townhouse", "condo", "living", "accessory dwelling", "adu"
  ],
  "zoning-ch295-sub3": [
    "commercial", "lb1", "lb2", "ns1", "ns2", "cs", "rb1", "rb2",
    "retail", "office", "business", "store", "shop", "restaurant", "cafe",
    "local business", "neighborhood", "regional"
  ],
  "zoning-ch295-sub4": [
    "downtown", "dr1", "dr2", "dc", "dl1", "dl2", "dl3", "dl4",
    "central", "core", "urban", "high-rise", "mixed-use downtown"
  ],
  "zoning-ch295-sub5": [
    "industrial", "il1", "il2", "im", "ih",
    "factory", "warehouse", "manufacturing", "production", "heavy",
    "light industrial", "moderate industrial"
  ],
  "zoning-ch295-sub6": [
    "special", "pd", "planned development", "ic", "institutional",
    "ps", "park", "recreation", "campus", "hospital", "university"
  ],
  "zoning-ch295-sub7": [
    "overlay", "historic", "preservation", "waterfront", "shoreland",
    "floodplain", "airport", "corridor"
  ],
  "zoning-ch295-sub8": [
    "height", "setback", "setbacks", "far", "floor area ratio", "lot coverage",
    "building size", "density", "yards", "front yard", "side yard", "rear yard",
    "building envelope", "dimensional", "bulk"
  ],
  "zoning-ch295-sub9": [
    "parking", "loading", "spaces", "vehicle", "vehicles", "garage", "drive",
    "driveway", "bicycle", "bike", "off-street", "parking lot", "parking structure",
    "stall", "handicap", "accessible parking"
  ],
  "zoning-ch295-sub10": [
    "sign", "signs", "signage", "billboard", "awning", "banner",
    "illuminated", "monument sign", "wall sign", "pole sign"
  ],
  "zoning-ch295-sub11": [
    "administration", "permit", "permits", "variance", "appeal", "board",
    "approval", "process", "application", "enforcement", "violation",
    "zoning board", "plan commission"
  ],
  "zoning-ch295-table": [
    "use table", "permitted use", "permitted uses", "allowed", "conditional use",
    "special use", "can i build", "can i open", "is allowed", "what uses"
  ],
};

/**
 * Select the most relevant documents based on question keywords.
 * Returns sourceIds of documents that match the question.
 */
function selectRelevantDocuments(
  question: string,
  availableSourceIds: string[],
  maxDocuments: number
): string[] {
  const questionLower = question.toLowerCase();
  const scores: Record<string, number> = {};

  // Score each document based on keyword matches
  for (const sourceId of availableSourceIds) {
    const keywords = DOCUMENT_KEYWORDS[sourceId] || [];
    let score = 0;

    for (const keyword of keywords) {
      if (questionLower.includes(keyword.toLowerCase())) {
        // Longer keywords are more specific, give them more weight
        score += keyword.length > 5 ? 2 : 1;
      }
    }

    scores[sourceId] = score;
  }

  // Always include sub1 (definitions) and table (use tables) as baseline
  if (availableSourceIds.includes("zoning-ch295-sub1")) {
    scores["zoning-ch295-sub1"] = Math.max(scores["zoning-ch295-sub1"] || 0, 0.5);
  }
  if (availableSourceIds.includes("zoning-ch295-table")) {
    scores["zoning-ch295-table"] = Math.max(scores["zoning-ch295-table"] || 0, 0.5);
  }

  // Sort by score descending
  const sorted = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([sourceId]) => sourceId);

  // If no matches found, return first N documents
  if (sorted.length === 0) {
    return availableSourceIds.slice(0, maxDocuments);
  }

  // Return top N documents
  return sorted.slice(0, maxDocuments);
}

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

/**
 * Get Gemini API key from environment.
 */
function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Extract citations from Gemini response text.
 * Looks for patterns like [Source: ...] or references to specific documents.
 */
function extractCitations(
  responseText: string,
  sourceDocuments: Array<{ sourceId: string; title: string }>
): Citation[] {
  const citations: Citation[] = [];

  // Simple citation extraction - look for document title mentions
  for (const doc of sourceDocuments) {
    // Check if the response mentions this document's subchapter or title
    const titleWords = doc.title.toLowerCase().split(/\s+/);
    const responseWords = responseText.toLowerCase();

    // If multiple key words from title appear, count as citation
    const matches = titleWords.filter(
      word => word.length > 3 && responseWords.includes(word)
    );

    if (matches.length >= 2) {
      citations.push({
        sourceId: doc.sourceId,
        sourceName: doc.title,
        excerpt: "", // Would need more sophisticated extraction
      });
    }
  }

  return citations;
}

/**
 * Calculate confidence based on response characteristics.
 */
function calculateConfidence(
  responseText: string,
  citations: Citation[]
): number {
  let confidence = 0.5; // Base confidence

  // Higher confidence if we have citations
  if (citations.length > 0) {
    confidence += 0.2;
  }

  // Higher confidence for longer, detailed responses
  if (responseText.length > 500) {
    confidence += 0.1;
  }

  // Lower confidence for uncertain language
  const uncertainPhrases = ["may", "might", "possibly", "unclear", "not sure"];
  const hasUncertainty = uncertainPhrases.some(phrase =>
    responseText.toLowerCase().includes(phrase)
  );
  if (hasUncertainty) {
    confidence -= 0.1;
  }

  return Math.max(0.1, Math.min(1.0, confidence));
}

// =============================================================================
// RAG Query Actions
// =============================================================================

/**
 * Query documents with a question.
 * Retrieves relevant file URIs and queries Gemini with file context.
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
    sourceIds: v.optional(v.array(v.string())),
    maxDocuments: v.optional(v.number()),
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
    const maxDocuments = args.maxDocuments ?? 10;

    try {
      // Get uploaded documents from Convex
      let documents: Array<{
        sourceId: string;
        title: string;
        category: string;
        geminiFileUri?: string;
        status: string;
      }>;

      if (args.sourceIds && args.sourceIds.length > 0) {
        // Get specific documents by source IDs
        const allDocs = await ctx.runQuery(api.ingestion.documents.list, {});
        documents = allDocs.filter(
          (doc: { sourceId: string }) => args.sourceIds!.includes(doc.sourceId)
        );
      } else if (args.category) {
        // Get documents by category
        documents = await ctx.runQuery(api.ingestion.documents.getByCategory, {
          category: args.category,
        });
      } else {
        // Get all uploaded documents
        documents = await ctx.runQuery(api.ingestion.documents.getUploaded, {});
      }

      // Filter to uploaded documents with valid URIs
      const uploadedDocs = documents.filter(
        (doc) => doc.status === "uploaded" && doc.geminiFileUri
      );

      if (uploadedDocs.length === 0) {
        return {
          success: false,
          error: {
            code: "NO_DOCUMENTS",
            message: "No uploaded documents available for querying",
            details: args.category
              ? `No documents found in category: ${args.category}`
              : "Upload documents first using the upload-docs script",
          },
        };
      }

      // Use intelligent document routing to select most relevant documents
      const availableSourceIds = uploadedDocs.map((doc) => doc.sourceId);
      const selectedSourceIds = selectRelevantDocuments(
        args.question,
        availableSourceIds,
        maxDocuments
      );

      // Get the selected documents in order
      const docsToQuery = selectedSourceIds
        .map((sourceId) => uploadedDocs.find((doc) => doc.sourceId === sourceId))
        .filter((doc): doc is NonNullable<typeof doc> => doc !== undefined);

      // Build request parts with file references
      const parts: Array<
        | { fileData: { mimeType: string; fileUri: string } }
        | { text: string }
      > = [];

      // Add file references
      for (const doc of docsToQuery) {
        parts.push({
          fileData: {
            mimeType: "application/pdf",
            fileUri: doc.geminiFileUri!,
          },
        });
      }

      // Add system prompt based on category
      const systemPrompt =
        args.category === "zoning-codes"
          ? ZONING_SYSTEM_PROMPT
          : GENERAL_SYSTEM_PROMPT;

      // Add the question with system prompt
      parts.push({
        text: `${systemPrompt}\n\nQuestion: ${args.question}`,
      });

      // Make API request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature,
              topK: 40,
              topP: 0.95,
              maxOutputTokens,
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
      const responseText =
        result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (!responseText) {
        return {
          success: false,
          error: {
            code: "API_ERROR",
            message: "Empty response from Gemini",
          },
        };
      }

      // Extract citations and calculate confidence
      const sourceDocuments = docsToQuery.map((doc) => ({
        sourceId: doc.sourceId,
        title: doc.title,
      }));
      const citations = extractCitations(responseText, sourceDocuments);
      const confidence = calculateConfidence(responseText, citations);

      const processingTimeMs = Date.now() - startTime;

      const groundedResponse: GroundedResponse = {
        answer: responseText,
        citations,
        confidence,
        sourceIds: docsToQuery.map((doc) => doc.sourceId),
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
 * Convenience function for asking zoning-specific questions.
 * Pre-filters to zoning-codes category and uses zoning system prompt.
 */
export const askZoningQuestion = action({
  args: {
    question: v.string(),
    districtCode: v.optional(v.string()),
    includeUseTables: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<RAGResult> => {
    // Enhance question with context if district code provided
    let enhancedQuestion = args.question;

    if (args.districtCode) {
      enhancedQuestion = `Regarding zoning district ${args.districtCode}: ${args.question}`;
    }

    if (args.includeUseTables) {
      enhancedQuestion += " Please include information from the use tables if relevant.";
    }

    // Query using zoning-codes category
    return await ctx.runAction(api.ingestion.rag.queryDocuments, {
      question: enhancedQuestion,
      category: "zoning-codes",
      maxDocuments: 12, // Include all zoning subchapters
    });
  },
});

/**
 * Quick test query to verify RAG is working.
 */
export const testQuery = action({
  args: {
    question: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<RAGResult> => {
    const testQuestion =
      args.question ?? "What are the permitted uses in the RS6 residential district?";

    return await ctx.runAction(api.ingestion.rag.queryDocuments, {
      question: testQuestion,
      category: "zoning-codes",
      maxDocuments: 3, // Use fewer docs for quick test
    });
  },
});
