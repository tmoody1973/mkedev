"use node";

/**
 * Compliance Analysis Action
 *
 * The hackathon centerpiece -- combines document content + parcel data +
 * RAG zoning code + area plans and uses Gemini with HIGH thinking for
 * deep compliance analysis. Produces a structured ComplianceAnalysisResult
 * matching the TypeScript interfaces in types.ts.
 *
 * NOTE: Internal mutations (createAnalysis, updateAnalysis) and queries
 * (get, getByDocumentId) live in analyzeHelpers.ts because "use node"
 * files can only export actions/internalActions in Convex.
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { internal } from "../_generated/api";

// Explicit return type to break circular type inference (TS7022/TS7023)
interface AnalyzeComplianceResult {
  analysisId: string;
  documentId: string;
  analysis: Record<string, unknown>;
  analysisTimeMs: number;
  modelUsed: string;
}

// =============================================================================
// Configuration
// =============================================================================

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-3-pro-preview";
const RETRIES_PER_MODEL = 3;
const BASE_DELAY_MS = 2000;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// =============================================================================
// Types
// =============================================================================

/** Shape of the parcelContext stored on uploadedDocuments. */
interface ParcelContext {
  address?: string;
  coordinates?: number[];
  zoningDistrict?: string;
  zoningCategory?: string;
  overlayZones?: string[];
  incentiveZones?: string[];
  areaPlan?: string;
  lotSize?: number;
}

/** Shape of the classification stored on uploadedDocuments. */
interface Classification {
  type: string;
  confidence: number;
  summary: string;
  extractedData: {
    projectAddress?: string;
    proposedUse?: string;
    buildingHeight?: string;
    stories?: number;
    unitCount?: number;
    squareFootage?: number;
    parkingSpaces?: number;
    lotSize?: string;
  };
}

/** Uploaded document record from Convex. */
interface UploadedDocument {
  _id: string;
  userId: string;
  storageId: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  classification?: Classification;
  status: string;
  errorMessage?: string;
  parcelContext?: ParcelContext;
  createdAt: number;
  updatedAt: number;
}

/** RAG query result shape. */
interface RAGResult {
  success: boolean;
  response?: {
    answer: string;
    citations: Array<{
      sourceId: string;
      sourceName: string;
      excerpt: string;
      pageNumber?: number;
      sectionReference?: string;
    }>;
    confidence: number;
    sourceIds: string[];
    processingTimeMs?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

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

// =============================================================================
// Compliance Analysis Prompt Builder (Task 4.2)
// =============================================================================

/**
 * Build the mega-context prompt for compliance analysis.
 *
 * Follows the `buildEnhancedPrompt()` pattern from `visualization/generate.ts`
 * but assembles context sections for zoning compliance analysis instead of
 * image generation. Sections:
 *   1. DOCUMENT CONTEXT
 *   2. PARCEL DATA
 *   3. ZONING REGULATIONS (from RAG)
 *   4. AREA PLAN CONTEXT (from RAG)
 *   5. INCENTIVE ZONES
 *   6. ANALYSIS INSTRUCTIONS + JSON schema
 */
function buildCompliancePrompt(args: {
  classification: Classification;
  parcelContext: ParcelContext;
  zoningCodeContext: string;
  areaPlanContext: string;
}): string {
  const { classification, parcelContext, zoningCodeContext, areaPlanContext } =
    args;

  const parts: string[] = [];

  // -------------------------------------------------------------------------
  // Section 1: Document Context
  // -------------------------------------------------------------------------
  parts.push("=== DOCUMENT CONTEXT ===");
  parts.push(`Document Type: ${classification.type}`);
  parts.push(`Classification Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
  parts.push(`Summary: ${classification.summary}`);
  parts.push("");

  const ed = classification.extractedData;
  parts.push("Extracted Data from Document:");
  if (ed.projectAddress) parts.push(`  - Project Address: ${ed.projectAddress}`);
  if (ed.proposedUse) parts.push(`  - Proposed Use: ${ed.proposedUse}`);
  if (ed.buildingHeight) parts.push(`  - Building Height: ${ed.buildingHeight}`);
  if (ed.stories != null) parts.push(`  - Stories: ${ed.stories}`);
  if (ed.unitCount != null) parts.push(`  - Unit Count: ${ed.unitCount}`);
  if (ed.squareFootage != null)
    parts.push(`  - Square Footage: ${ed.squareFootage.toLocaleString()} sq ft`);
  if (ed.parkingSpaces != null)
    parts.push(`  - Parking Spaces: ${ed.parkingSpaces}`);
  if (ed.lotSize) parts.push(`  - Lot Size: ${ed.lotSize}`);
  parts.push("");

  // -------------------------------------------------------------------------
  // Section 2: Parcel Data
  // -------------------------------------------------------------------------
  parts.push("=== PARCEL DATA ===");
  if (parcelContext.address) parts.push(`Address: ${parcelContext.address}`);
  if (parcelContext.coordinates)
    parts.push(
      `Coordinates: [${parcelContext.coordinates[0]}, ${parcelContext.coordinates[1]}]`
    );
  if (parcelContext.zoningDistrict)
    parts.push(`Zoning District: ${parcelContext.zoningDistrict}`);
  if (parcelContext.zoningCategory)
    parts.push(`Zoning Category: ${parcelContext.zoningCategory}`);
  if (parcelContext.lotSize)
    parts.push(
      `Lot Size: ${parcelContext.lotSize.toLocaleString()} sq ft`
    );
  if (parcelContext.overlayZones && parcelContext.overlayZones.length > 0)
    parts.push(`Overlay Zones: ${parcelContext.overlayZones.join(", ")}`);
  if (parcelContext.incentiveZones && parcelContext.incentiveZones.length > 0)
    parts.push(`Incentive Zones: ${parcelContext.incentiveZones.join(", ")}`);
  if (parcelContext.areaPlan)
    parts.push(`Area Plan: ${parcelContext.areaPlan}`);
  parts.push("");

  // -------------------------------------------------------------------------
  // Section 3: Zoning Regulations (from RAG)
  // -------------------------------------------------------------------------
  parts.push("=== ZONING REGULATIONS ===");
  if (zoningCodeContext) {
    parts.push(zoningCodeContext);
  } else {
    parts.push(
      "No specific zoning code sections were retrieved. Base your analysis on the zoning district provided above and your knowledge of Milwaukee Chapter 295."
    );
  }
  parts.push("");

  // -------------------------------------------------------------------------
  // Section 4: Area Plan Context (from RAG)
  // -------------------------------------------------------------------------
  parts.push("=== AREA PLAN CONTEXT ===");
  if (areaPlanContext) {
    parts.push(areaPlanContext);
  } else {
    parts.push(
      "No specific area plan context was retrieved. If applicable, note that area plan alignment could not be fully assessed."
    );
  }
  parts.push("");

  // -------------------------------------------------------------------------
  // Section 5: Incentive Zones
  // -------------------------------------------------------------------------
  if (
    parcelContext.incentiveZones &&
    parcelContext.incentiveZones.length > 0
  ) {
    parts.push("=== INCENTIVE ZONES ===");
    for (const zone of parcelContext.incentiveZones) {
      parts.push(`- ${zone}`);
    }
    parts.push(
      "Evaluate whether the proposed project could benefit from these incentive programs."
    );
    parts.push("");
  }

  // -------------------------------------------------------------------------
  // Section 6: Analysis Instructions + JSON Schema
  // -------------------------------------------------------------------------
  parts.push("=== ANALYSIS INSTRUCTIONS ===");
  parts.push(
    "You are a Milwaukee zoning compliance expert. Analyze the uploaded document against the zoning regulations, parcel data, area plans, and incentive zones provided above."
  );
  parts.push("");
  parts.push("Perform a comprehensive compliance analysis and return a JSON object with the following structure:");
  parts.push("");
  parts.push(`{
  "executiveSummary": "2-3 sentence high-level summary of the compliance analysis findings",
  "overallStatus": "compliant" | "variances_required" | "non_compliant",
  "approvalPathway": "Description of the recommended path to approval (e.g., 'Standard building permit', 'Board of Zoning Appeals variance required', 'Conditional use permit required from Plan Commission')",
  "estimatedTimeline": "Estimated timeline for the approval process (e.g., '4-6 weeks for standard permit', '3-6 months for variance and conditional use')",
  "dimensionalCompliance": [
    {
      "requirement": "Name of dimensional requirement (e.g., 'Maximum Building Height', 'Front Setback', 'Lot Coverage')",
      "standard": "What the zoning code requires (e.g., '35 feet', '25 feet', '60%')",
      "proposed": "What the project proposes (e.g., '45 feet', '20 feet', '55%')",
      "status": "compliant" | "variance_required" | "non_compliant",
      "notes": "Optional explanation"
    }
  ],
  "useCompliance": [
    {
      "use": "The proposed use (e.g., 'Multi-family residential', 'Restaurant')",
      "permissionLevel": "permitted" | "conditional" | "prohibited",
      "notes": "Conditions or requirements for approval"
    }
  ],
  "areaPlanAlignment": {
    "score": 0-100,
    "alignedElements": ["List of project aspects that align with the area plan goals"],
    "concerns": ["List of potential conflicts with area plan"],
    "recommendations": ["List of recommendations to better align with area plan"]
  },
  "variancesRequired": [
    {
      "type": "Type of variance (e.g., 'Height variance', 'Setback variance')",
      "standardRequired": "What the code requires",
      "proposed": "What is proposed",
      "hardshipBasis": "Potential hardship justification",
      "approvalLikelihood": "high" | "medium" | "low"
    }
  ],
  "incentiveOpportunities": [
    {
      "program": "Name of incentive program (e.g., 'TIF District 95', 'Opportunity Zone')",
      "eligibility": "eligible" | "possibly_eligible" | "not_eligible",
      "estimatedBenefit": "Estimated financial benefit if known",
      "requirements": "Key requirements for the program",
      "nextSteps": "Next steps to pursue this incentive"
    }
  ],
  "recommendedNextSteps": [
    {
      "step": 1,
      "action": "Description of the action to take",
      "rationale": "Why this step is important"
    }
  ],
  "riskAssessment": [
    {
      "risk": "Description of the risk",
      "likelihood": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high",
      "mitigation": "Strategy to mitigate this risk"
    }
  ]
}`);
  parts.push("");
  parts.push("IMPORTANT RULES:");
  parts.push(
    "1. Base dimensional compliance on ACTUAL zoning code standards for the specific district, not generic values."
  );
  parts.push(
    "2. If the document does not contain enough information for a specific section, include the section with a note indicating what information is missing."
  );
  parts.push(
    "3. The overallStatus should be 'compliant' ONLY if ALL dimensional and use requirements are met. If ANY variance is needed, use 'variances_required'. Use 'non_compliant' only if the project fundamentally conflicts with the zoning (e.g., prohibited use)."
  );
  parts.push(
    "4. For areaPlanAlignment, use a score of 0-100. If no area plan data is available, use a score of 50 and note the uncertainty."
  );
  parts.push(
    "5. Always include at least 3 recommended next steps."
  );
  parts.push(
    "6. Return ONLY valid JSON. Do not include markdown code fences or additional text outside the JSON."
  );

  return parts.join("\n");
}

// =============================================================================
// System Instruction
// =============================================================================

const SYSTEM_INSTRUCTION = `You are an expert Milwaukee zoning compliance analyst with deep knowledge of:
- Milwaukee Zoning Code (Chapter 295) including all subchapters
- Milwaukee area plans and neighborhood development goals
- The Board of Zoning Appeals (BZA) variance process
- Conditional use permit requirements and Plan Commission review
- Tax Increment Financing (TIF) districts and Opportunity Zones
- Historic preservation overlay requirements
- Milwaukee building permit processes and timelines

You are analyzing an uploaded civic development document against Milwaukee zoning regulations.

Your analysis must be:
- Thorough and accurate, citing specific code sections when possible
- Practical and actionable for developers and architects
- Clear about what is compliant and what requires additional approvals
- Honest about uncertainty when document information is incomplete

Return your analysis as structured JSON matching the schema provided in the user prompt.`;

// =============================================================================
// Compliance Analysis Action (Task 4.1)
// =============================================================================

/**
 * Run deep compliance analysis on a classified and enriched document.
 *
 * This is the hackathon centerpiece feature. It:
 * 1. Validates the document has classification and parcel context
 * 2. Queries RAG for zoning code and area plan context
 * 3. Builds a mega-context prompt combining all data
 * 4. Calls Gemini with HIGH thinking for deep analysis
 * 5. Stores the structured result in complianceAnalyses table
 * 6. Updates the document status to "complete"
 */
export const analyzeCompliance = action({
  args: {
    documentId: v.id("uploadedDocuments"),
    conversationId: v.optional(v.id("conversations")),
    parcelAddress: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AnalyzeComplianceResult> => {
    const { documentId, conversationId, parcelAddress } = args;
    const analysisStartTime = Date.now();

    console.log(
      "[analyze] Starting compliance analysis for document:",
      documentId
    );

    // -----------------------------------------------------------------------
    // Step 1: Fetch document and verify prerequisites
    // -----------------------------------------------------------------------
    let doc = (await ctx.runQuery(api.documents.upload.get, {
      documentId,
    })) as UploadedDocument | null;

    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    if (!doc.classification) {
      throw new Error(
        "Document must be classified before compliance analysis. Run classifyDocument first."
      );
    }

    // Capture classification before possible reassignment of doc.
    // After re-fetch, TypeScript loses narrowing on doc.classification,
    // so we store it in a const that is guaranteed non-null.
    const classification: Classification = doc.classification;

    // -----------------------------------------------------------------------
    // Step 2: If parcelContext is missing, run enrichment first
    // -----------------------------------------------------------------------
    if (!doc.parcelContext && parcelAddress) {
      console.log(
        `[analyze] No parcel context found, running enrichment with address: "${parcelAddress}"`
      );
      try {
        await ctx.runAction(api.documents.enrich.enrichDocument, {
          documentId,
          overrideAddress: parcelAddress,
        });
      } catch (enrichError) {
        console.error("[analyze] Enrichment failed:", enrichError);
        // Continue anyway -- we can still analyze with limited context
      }

      // Re-fetch document to get enriched data
      doc = (await ctx.runQuery(api.documents.upload.get, {
        documentId,
      })) as UploadedDocument | null;

      if (!doc) {
        throw new Error(
          `Document not found after enrichment: ${documentId}`
        );
      }
    }

    // Build a minimal parcelContext if still missing
    const parcelContext: ParcelContext = doc.parcelContext ?? {
      address:
        parcelAddress ??
        classification.extractedData.projectAddress ??
        "Unknown address",
    };

    // -----------------------------------------------------------------------
    // Step 3: Update document status to "analyzing"
    // -----------------------------------------------------------------------
    await ctx.runMutation(internal.documents.upload.updateStatus, {
      documentId,
      status: "analyzing",
    });

    // -----------------------------------------------------------------------
    // Step 4: Create complianceAnalyses record with status "analyzing"
    // -----------------------------------------------------------------------
    const analysisId = await ctx.runMutation(
      internal.documents.analyzeHelpers.createAnalysis,
      {
        userId: doc.userId,
        documentId,
        conversationId,
      }
    );

    console.log("[analyze] Created analysis record:", analysisId);

    try {
      // -------------------------------------------------------------------
      // Step 5: Get file URL from storage
      // -------------------------------------------------------------------
      const fileUrl = await ctx.storage.getUrl(doc.storageId as never);
      if (!fileUrl) {
        throw new Error("Could not retrieve file URL from storage");
      }

      // -------------------------------------------------------------------
      // Step 6: Query RAG for relevant zoning code sections
      // -------------------------------------------------------------------
      let zoningCodeContext = "";

      const zoningQuery = [
        "zoning requirements",
        parcelContext.zoningDistrict
          ? `for ${parcelContext.zoningDistrict} district`
          : "",
        classification.extractedData.proposedUse
          ? `for ${classification.extractedData.proposedUse}`
          : "",
        "dimensional standards setbacks height parking",
      ]
        .filter(Boolean)
        .join(" ");

      console.log("[analyze] RAG zoning query:", zoningQuery);

      try {
        const zoningRagResult = (await ctx.runAction(
          api.ingestion.ragV2.queryDocuments,
          {
            question: zoningQuery,
            category: "zoning-codes",
          }
        )) as RAGResult;

        if (zoningRagResult.success && zoningRagResult.response) {
          zoningCodeContext = zoningRagResult.response.answer;
          console.log(
            `[analyze] RAG zoning context retrieved: ${zoningCodeContext.length} chars, confidence: ${zoningRagResult.response.confidence}`
          );
        } else {
          console.warn(
            "[analyze] RAG zoning query returned no results:",
            zoningRagResult.error?.message
          );
        }
      } catch (ragError) {
        console.error("[analyze] RAG zoning query failed (non-fatal):", ragError);
      }

      // -------------------------------------------------------------------
      // Step 7: Query RAG for area plan context
      // -------------------------------------------------------------------
      let areaPlanContext = "";

      const areaQuery = [
        "development goals and land use recommendations",
        parcelContext.address ? `for ${parcelContext.address} area` : "",
        parcelContext.areaPlan ? parcelContext.areaPlan : "",
      ]
        .filter(Boolean)
        .join(" ");

      console.log("[analyze] RAG area plan query:", areaQuery);

      try {
        const areaPlanRagResult = (await ctx.runAction(
          api.ingestion.ragV2.queryDocuments,
          {
            question: areaQuery,
            category: "area-plans",
          }
        )) as RAGResult;

        if (areaPlanRagResult.success && areaPlanRagResult.response) {
          areaPlanContext = areaPlanRagResult.response.answer;
          console.log(
            `[analyze] RAG area plan context retrieved: ${areaPlanContext.length} chars, confidence: ${areaPlanRagResult.response.confidence}`
          );
        } else {
          console.warn(
            "[analyze] RAG area plan query returned no results:",
            areaPlanRagResult.error?.message
          );
        }
      } catch (ragError) {
        console.error(
          "[analyze] RAG area plan query failed (non-fatal):",
          ragError
        );
      }

      // -------------------------------------------------------------------
      // Step 8: Build mega-context prompt combining all context
      // -------------------------------------------------------------------
      const compliancePrompt = buildCompliancePrompt({
        classification,
        parcelContext,
        zoningCodeContext,
        areaPlanContext,
      });

      console.log(
        `[analyze] Compliance prompt built: ${compliancePrompt.length} chars`
      );

      // -------------------------------------------------------------------
      // Step 9: Build content parts for Gemini call
      // -------------------------------------------------------------------
      // Fetch file and send as inline base64 (works for both PDFs and images)
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(
          `Failed to fetch file for analysis: ${fileResponse.status}`
        );
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
          text: compliancePrompt,
        },
      ];

      // Build request body
      const requestBody = {
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            parts: contentParts,
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 8192,
          thinkingConfig: {
            thinkingLevel: "HIGH",
          },
        },
      };

      // -------------------------------------------------------------------
      // Step 10: Call Gemini with retry and model fallback
      // -------------------------------------------------------------------
      const apiKey = getGeminiApiKey();
      const models = [PRIMARY_MODEL, FALLBACK_MODEL];
      let lastError: Error | null = null;
      let analysisResult: Record<string, unknown> | null = null;
      let modelUsed = "";

      for (const currentModel of models) {
        const isPrimary = currentModel === PRIMARY_MODEL;
        console.log(
          `[analyze] Trying model: ${currentModel} (${isPrimary ? "primary" : "fallback"})`
        );

        for (let attempt = 0; attempt < RETRIES_PER_MODEL; attempt++) {
          if (attempt > 0) {
            const delay =
              BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
            console.log(
              `[analyze] Retry ${attempt + 1}/${RETRIES_PER_MODEL} for ${currentModel} after ${Math.round(delay)}ms`
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
                `[analyze] API error: ${response.status}`,
                errorText
              );

              // Rate limiting or overload -- retry same model
              if (response.status === 429 || response.status === 503) {
                lastError = new Error(
                  `${currentModel}: ${response.status === 429 ? "Rate limited" : "Model overloaded"}`
                );
                continue;
              }

              // Model unavailable -- try fallback
              if (response.status === 404 || response.status === 400) {
                console.log(
                  `[analyze] Model ${currentModel} unavailable, trying next model...`
                );
                lastError = new Error(`${currentModel}: Model unavailable`);
                break;
              }

              throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();

            // Extract text response (filter out thinking parts)
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

            // -----------------------------------------------------------
            // Step 11: Parse response and validate structure
            // -----------------------------------------------------------
            try {
              analysisResult = JSON.parse(responseText);
            } catch {
              lastError = new Error(
                `${currentModel}: Failed to parse JSON response`
              );
              continue;
            }

            modelUsed = currentModel;

            // Validate that key fields exist
            if (!analysisResult) {
              lastError = new Error(
                `${currentModel}: Null analysis result`
              );
              continue;
            }

            // Ensure required top-level fields with fallback defaults
            if (!analysisResult.executiveSummary) {
              analysisResult.executiveSummary =
                "Analysis completed but executive summary could not be generated.";
            }

            if (
              !["compliant", "variances_required", "non_compliant"].includes(
                analysisResult.overallStatus as string
              )
            ) {
              analysisResult.overallStatus = "variances_required";
            }

            if (!analysisResult.approvalPathway) {
              analysisResult.approvalPathway =
                "Approval pathway could not be determined from available information.";
            }

            if (!analysisResult.estimatedTimeline) {
              analysisResult.estimatedTimeline =
                "Timeline could not be estimated from available information.";
            }

            // Ensure arrays exist
            if (!Array.isArray(analysisResult.dimensionalCompliance)) {
              analysisResult.dimensionalCompliance = [];
            }
            if (!Array.isArray(analysisResult.useCompliance)) {
              analysisResult.useCompliance = [];
            }
            if (!Array.isArray(analysisResult.variancesRequired)) {
              analysisResult.variancesRequired = [];
            }
            if (!Array.isArray(analysisResult.incentiveOpportunities)) {
              analysisResult.incentiveOpportunities = [];
            }
            if (!Array.isArray(analysisResult.recommendedNextSteps)) {
              analysisResult.recommendedNextSteps = [];
            }
            if (!Array.isArray(analysisResult.riskAssessment)) {
              analysisResult.riskAssessment = [];
            }

            // Ensure areaPlanAlignment is an object if present
            if (
              analysisResult.areaPlanAlignment &&
              typeof analysisResult.areaPlanAlignment !== "object"
            ) {
              analysisResult.areaPlanAlignment = {
                score: 50,
                alignedElements: [],
                concerns: [],
                recommendations: [],
              };
            }

            console.log(
              `[analyze] Analysis complete: status=${analysisResult.overallStatus}, model=${modelUsed}`
            );

            // Break out of retry loop on success
            break;
          } catch (error) {
            console.error(
              `[analyze] ${currentModel} attempt ${attempt + 1} error:`,
              error
            );
            lastError =
              error instanceof Error ? error : new Error(String(error));
          }
        }

        // If we have a result, break out of model loop
        if (analysisResult) {
          break;
        }

        console.log(
          `[analyze] Exhausted ${RETRIES_PER_MODEL} retries for ${currentModel}`
        );
      }

      // All models and retries exhausted with no result
      if (!analysisResult) {
        const errorMessage =
          lastError?.message ??
          "Compliance analysis failed after multiple attempts with all models";

        console.error(
          "[analyze] All models and retries exhausted:",
          errorMessage
        );

        // Update both records to error status
        await ctx.runMutation(
          internal.documents.analyzeHelpers.updateAnalysis,
          {
            analysisId,
            status: "error",
            errorMessage,
          }
        );

        await ctx.runMutation(internal.documents.upload.updateStatus, {
          documentId,
          status: "error",
          errorMessage: `Compliance analysis failed: ${errorMessage}`,
        });

        throw new Error(errorMessage);
      }

      // -------------------------------------------------------------------
      // Step 12: Track analysis time
      // -------------------------------------------------------------------
      const analysisTimeMs = Date.now() - analysisStartTime;
      console.log(`[analyze] Total analysis time: ${analysisTimeMs}ms`);

      // -------------------------------------------------------------------
      // Step 13: Store analysis in complianceAnalyses table
      // -------------------------------------------------------------------
      await ctx.runMutation(
        internal.documents.analyzeHelpers.updateAnalysis,
        {
          analysisId,
          status: "complete",
          analysis: analysisResult,
          analysisTimeMs,
          modelUsed,
        }
      );

      // -------------------------------------------------------------------
      // Step 14: Update document status to "complete"
      // -------------------------------------------------------------------
      await ctx.runMutation(internal.documents.upload.updateStatus, {
        documentId,
        status: "complete",
      });

      // -------------------------------------------------------------------
      // Step 15: Return the full analysis result
      // -------------------------------------------------------------------
      return {
        analysisId,
        documentId,
        analysis: analysisResult,
        analysisTimeMs,
        modelUsed,
      };
    } catch (error) {
      // Top-level error handler: update both records to error status
      const errorMessage =
        error instanceof Error ? error.message : "Compliance analysis failed";

      console.error("[analyze] Fatal error:", errorMessage);

      try {
        await ctx.runMutation(
          internal.documents.analyzeHelpers.updateAnalysis,
          {
            analysisId,
            status: "error",
            errorMessage,
          }
        );
      } catch {
        console.error(
          "[analyze] Failed to update analysis record to error status"
        );
      }

      try {
        await ctx.runMutation(internal.documents.upload.updateStatus, {
          documentId,
          status: "error",
          errorMessage: `Compliance analysis failed: ${errorMessage}`,
        });
      } catch {
        console.error(
          "[analyze] Failed to update document record to error status"
        );
      }

      throw error;
    }
  },
});
