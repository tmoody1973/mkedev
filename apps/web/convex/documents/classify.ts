"use node";

/**
 * Document Classification Action
 *
 * Uses Gemini 3 Flash with MINIMAL thinking to classify uploaded civic
 * documents into one of 10 types and extract structured data.
 * After classification, auto-triggers enrichment if an address is found.
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { internal } from "../_generated/api";

// =============================================================================
// Configuration
// =============================================================================

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-3-pro-preview";
const RETRIES_PER_MODEL = 3;
const BASE_DELAY_MS = 2000;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Document classification types
const DOCUMENT_TYPES = [
  "site_plan",
  "floor_plan",
  "elevation",
  "project_narrative",
  "variance_application",
  "conditional_use_application",
  "traffic_study",
  "environmental_assessment",
  "survey",
  "unknown",
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number];

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
 * Build the classification system instruction for Gemini.
 */
function buildClassificationPrompt(): string {
  return `You are a civic document classification expert for Milwaukee, Wisconsin.
Your task is to classify uploaded civic development documents and extract structured data.

## Document Types
Classify the document as one of:
- site_plan: Site layout showing building footprint, setbacks, parking, landscaping
- floor_plan: Interior layout showing rooms, dimensions, walls
- elevation: Building facade/side views showing height, materials, architectural features
- project_narrative: Written description of a proposed development project
- variance_application: Request to deviate from zoning standards
- conditional_use_application: Application for a conditional/special use permit
- traffic_study: Traffic impact analysis for a proposed development
- environmental_assessment: Environmental impact study or phase I/II report
- survey: Property boundary survey, ALTA survey, or topographic survey
- unknown: Cannot determine document type

## Output Format
Return a JSON object with this exact structure:
{
  "type": "<one of the document types above>",
  "confidence": <number between 0.0 and 1.0>,
  "summary": "<2-3 sentence summary of the document>",
  "extractedData": {
    "projectAddress": "<street address if found, or null>",
    "proposedUse": "<proposed land use if mentioned, or null>",
    "buildingHeight": "<building height as string if mentioned, or null>",
    "stories": <number of stories if mentioned, or null>,
    "unitCount": <number of dwelling/commercial units if mentioned, or null>,
    "squareFootage": <total square footage if mentioned, or null>,
    "parkingSpaces": <number of parking spaces if mentioned, or null>,
    "lotSize": "<lot size as string if mentioned, or null>"
  }
}

Rules:
- Be precise with the document type classification
- Only extract data that is explicitly stated in the document
- Use null for any field where the information is not clearly present
- The confidence score should reflect how certain you are about the classification
- For images (site plans, elevations, floor plans), look for title blocks, legends, and annotations
- For PDFs with text, scan for key terms, headers, and form fields`;
}

// =============================================================================
// Classification Action
// =============================================================================

/**
 * Classify an uploaded document using Gemini 3 Flash.
 * After classification, auto-triggers enrichment if a project address is found.
 */
export const classifyDocument = action({
  args: {
    documentId: v.id("uploadedDocuments"),
  },
  handler: async (ctx, args) => {
    const { documentId } = args;

    console.log("[classify] Starting classification for document:", documentId);

    // 1. Fetch document record
    const doc = await ctx.runQuery(api.documents.upload.get, { documentId });
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // 2. Get file URL from Convex storage
    const fileUrl = await ctx.storage.getUrl(doc.storageId);
    if (!fileUrl) {
      await ctx.runMutation(internal.documents.upload.updateStatus, {
        documentId,
        status: "error",
        errorMessage: "Could not retrieve file URL from storage",
      });
      throw new Error("Could not retrieve file URL from storage");
    }

    // 3. Update status to "classifying"
    await ctx.runMutation(internal.documents.upload.updateStatus, {
      documentId,
      status: "classifying",
    });

    const apiKey = getGeminiApiKey();
    const systemInstruction = buildClassificationPrompt();

    // Fetch file and send as inline base64 (works for both PDFs and images)
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      await ctx.runMutation(internal.documents.upload.updateStatus, {
        documentId,
        status: "error",
        errorMessage: `Failed to fetch file for classification: ${fileResponse.status}`,
      });
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const base64Data = Buffer.from(fileBuffer).toString("base64");

    const contentParts: Array<Record<string, unknown>> = [
      {
        inlineData: {
          mimeType: doc.mimeType,
          data: base64Data,
        },
      },
      {
        text: "Classify this document and extract structured data. Return JSON only.",
      },
    ];

    // 4. Call Gemini with retry and model fallback
    const models = [PRIMARY_MODEL, FALLBACK_MODEL];
    let lastError: Error | null = null;

    for (const currentModel of models) {
      const isPrimary = currentModel === PRIMARY_MODEL;
      console.log(
        `[classify] Trying model: ${currentModel} (${isPrimary ? "primary" : "fallback"})`
      );

      // Pro model doesn't support MINIMAL thinking level
      const thinkingLevel = currentModel.includes("pro") ? "LOW" : "MINIMAL";

      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            parts: contentParts,
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 2048,
          thinkingConfig: {
            thinkingLevel,
          },
        },
      };

      for (let attempt = 0; attempt < RETRIES_PER_MODEL; attempt++) {
        if (attempt > 0) {
          const delay =
            BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.log(
            `[classify] Retry ${attempt + 1}/${RETRIES_PER_MODEL} for ${currentModel} after ${Math.round(delay)}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        try {
          const response = await fetch(
            `${GEMINI_API_BASE}/models/${currentModel}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              `[classify] API error: ${response.status}`,
              errorText
            );

            // Rate limiting or overload -- retry same model
            if (response.status === 429 || response.status === 503) {
              lastError = new Error(
                `${currentModel}: ${response.status === 429 ? "Rate limited" : "Model overloaded"}`
              );
              continue;
            }

            // Model not found -- try fallback
            if (response.status === 404) {
              console.log(
                `[classify] Model ${currentModel} not found, trying next model...`
              );
              lastError = new Error(`${currentModel}: Model not found`);
              break;
            }

            // Bad request -- log full error and try fallback
            if (response.status === 400) {
              console.error(
                `[classify] Bad request for ${currentModel}:`,
                errorText
              );
              lastError = new Error(`${currentModel}: Bad request - ${errorText.slice(0, 200)}`);
              break;
            }

            throw new Error(`Gemini API error: ${response.status} - ${errorText.slice(0, 200)}`);
          }

          const data = await response.json();

          // Extract text response
          const responseText =
            data.candidates?.[0]?.content?.parts
              ?.filter((p: { text?: string }) => p.text)
              ?.map((p: { text: string }) => p.text)
              ?.join("") ?? "";

          if (!responseText) {
            lastError = new Error(
              `${currentModel}: Empty response from Gemini`
            );
            continue;
          }

          // 5. Parse and validate JSON response
          let classification: {
            type: DocumentType;
            confidence: number;
            summary: string;
            extractedData: {
              projectAddress?: string | null;
              proposedUse?: string | null;
              buildingHeight?: string | null;
              stories?: number | null;
              unitCount?: number | null;
              squareFootage?: number | null;
              parkingSpaces?: number | null;
              lotSize?: string | null;
            };
          };

          try {
            classification = JSON.parse(responseText);
          } catch {
            lastError = new Error(
              `${currentModel}: Failed to parse JSON response`
            );
            continue;
          }

          // Validate document type
          if (!DOCUMENT_TYPES.includes(classification.type)) {
            classification.type = "unknown";
          }

          // Clamp confidence to 0-1
          classification.confidence = Math.max(
            0,
            Math.min(1, classification.confidence ?? 0.5)
          );

          // Ensure summary exists
          if (!classification.summary) {
            classification.summary = "Document classification completed.";
          }

          // Ensure extractedData exists
          if (!classification.extractedData) {
            classification.extractedData = {};
          }

          // Helper: parse a numeric value from a possibly string field
          const parseNumeric = (val: unknown): number | undefined => {
            if (val == null) return undefined;
            if (typeof val === "number") return val;
            if (typeof val === "string") {
              const num = parseFloat(val.replace(/[^0-9.]/g, ""));
              return isNaN(num) ? undefined : num;
            }
            return undefined;
          };

          // Normalize null values to undefined for Convex compatibility
          // Numeric fields are parsed from strings (Gemini may return "2,900 SF")
          const extractedData = {
            projectAddress:
              classification.extractedData.projectAddress ?? undefined,
            proposedUse:
              classification.extractedData.proposedUse ?? undefined,
            buildingHeight:
              classification.extractedData.buildingHeight ?? undefined,
            stories: parseNumeric(classification.extractedData.stories),
            unitCount: parseNumeric(classification.extractedData.unitCount),
            squareFootage: parseNumeric(classification.extractedData.squareFootage),
            parkingSpaces: parseNumeric(classification.extractedData.parkingSpaces),
            lotSize: classification.extractedData.lotSize ?? undefined,
          };

          const classificationResult = {
            type: classification.type,
            confidence: classification.confidence,
            summary: classification.summary,
            extractedData,
          };

          console.log(
            `[classify] Classification complete: type=${classificationResult.type}, confidence=${classificationResult.confidence}`
          );

          // 6. Update document with classification and status "classified"
          await ctx.runMutation(internal.documents.upload.updateStatus, {
            documentId,
            status: "classified",
            classification: classificationResult,
          });

          // 7. Auto-trigger enrichment if an address was found (Task 3.3)
          if (extractedData.projectAddress) {
            console.log(
              `[classify] Address found: "${extractedData.projectAddress}", auto-triggering enrichment`
            );
            try {
              await ctx.runAction(
                api.documents.enrich.enrichDocument,
                { documentId }
              );
            } catch (enrichError) {
              // Enrichment failure should not fail the classification
              console.error(
                "[classify] Enrichment failed (non-fatal):",
                enrichError
              );
            }
          } else {
            console.log(
              "[classify] No address found in document, skipping enrichment. UI will prompt user."
            );
          }

          return classificationResult;
        } catch (error) {
          console.error(
            `[classify] ${currentModel} attempt ${attempt + 1} error:`,
            error
          );
          lastError =
            error instanceof Error ? error : new Error(String(error));
        }
      }

      console.log(
        `[classify] Exhausted ${RETRIES_PER_MODEL} retries for ${currentModel}`
      );
    }

    // All models and retries exhausted -- set error status
    const errorMessage =
      lastError?.message ??
      "Classification failed after multiple attempts with all models";

    console.error("[classify] All models and retries exhausted:", errorMessage);

    await ctx.runMutation(internal.documents.upload.updateStatus, {
      documentId,
      status: "error",
      errorMessage,
    });

    throw new Error(errorMessage);
  },
});
