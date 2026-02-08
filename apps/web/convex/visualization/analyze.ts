"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";

// =============================================================================
// Site Analysis - Gemini 3 Flash Multimodal
// =============================================================================

// Gemini analysis models - primary and fallback
const GEMINI_ANALYSIS_MODEL_PRIMARY = "gemini-3-flash-preview";
const GEMINI_ANALYSIS_MODEL_FALLBACK = "gemini-2.5-flash-preview";
const RETRIES_PER_MODEL = 3;

// Reuse zoningContext validator shape from generate.ts
const zoningContextValidator = v.optional(
  v.object({
    zoningDistrict: v.optional(v.string()),
    zoningCategory: v.optional(v.string()),
    maxHeight: v.optional(v.number()),
    maxStories: v.optional(v.number()),
    setbacks: v.optional(
      v.object({
        front: v.number(),
        side: v.number(),
        rear: v.number(),
      })
    ),
    maxFAR: v.optional(v.number()),
    overlayZones: v.optional(v.array(v.string())),
    historicDistrict: v.optional(v.boolean()),
    neighborhood: v.optional(v.string()),
    lotSizeSqFt: v.optional(v.number()),
    lotDimensions: v.optional(
      v.object({
        width: v.number(),
        depth: v.number(),
      })
    ),
  })
);

/**
 * Build the site analysis system instruction.
 * Tells Gemini how to analyze a site photo and return structured JSON.
 */
function buildAnalysisSystemInstruction(
  userQuestion?: string,
  zoningContext?: {
    zoningDistrict?: string;
    zoningCategory?: string;
    maxHeight?: number;
    maxStories?: number;
    neighborhood?: string;
    overlayZones?: string[];
    historicDistrict?: boolean;
    lotSizeSqFt?: number;
  }
): string {
  const parts: string[] = [];

  parts.push("You are a site analysis expert for Milwaukee, WI.");
  parts.push("Analyze the provided site photo and return a structured JSON assessment.");
  parts.push("");
  parts.push("Return ONLY valid JSON with this exact structure:");
  parts.push("{");
  parts.push('  "siteDescription": {');
  parts.push('    "lotCharacteristics": "string - describe lot size, shape, frontage",');
  parts.push('    "existingConditions": "string - current state (vacant, building, parking, etc)",');
  parts.push('    "topography": "string - grade, slope, drainage observations",');
  parts.push('    "vegetation": "string - trees, landscaping, green space"');
  parts.push("  },");
  parts.push('  "contextAnalysis": {');
  parts.push('    "adjacentBuildings": "string - describe neighboring structures",');
  parts.push('    "neighborhoodCharacter": "string - architectural style, density, era",');
  parts.push('    "streetType": "string - residential, arterial, commercial corridor",');
  parts.push('    "pedestrianEnvironment": "string - sidewalks, crossings, transit access"');
  parts.push("  },");
  parts.push('  "developmentPotential": {');
  parts.push('    "suitableUses": ["string array of appropriate development types"],');
  parts.push('    "estimatedCapacity": "string - rough estimate of buildable area or units",');
  parts.push('    "designConsiderations": ["string array of design factors to consider"],');
  parts.push('    "challenges": ["string array of development challenges"],');
  parts.push('    "opportunities": ["string array of development opportunities"]');
  parts.push("  },");
  parts.push('  "questionsToInvestigate": ["string array of 3-5 follow-up questions for deeper analysis"]');
  parts.push("}");

  if (zoningContext) {
    parts.push("");
    parts.push("ZONING CONTEXT (use this to inform your analysis):");
    if (zoningContext.zoningDistrict) {
      parts.push(`- Zoning District: ${zoningContext.zoningDistrict}${zoningContext.zoningCategory ? ` (${zoningContext.zoningCategory})` : ""}`);
    }
    if (zoningContext.maxHeight) {
      parts.push(`- Max Height: ${zoningContext.maxHeight} feet`);
    }
    if (zoningContext.maxStories) {
      parts.push(`- Max Stories: ${zoningContext.maxStories}`);
    }
    if (zoningContext.neighborhood) {
      parts.push(`- Neighborhood: ${zoningContext.neighborhood}`);
    }
    if (zoningContext.overlayZones && zoningContext.overlayZones.length > 0) {
      parts.push(`- Overlay Zones: ${zoningContext.overlayZones.join(", ")}`);
    }
    if (zoningContext.historicDistrict) {
      parts.push("- Historic District: Yes");
    }
    if (zoningContext.lotSizeSqFt) {
      parts.push(`- Lot Size: ${zoningContext.lotSizeSqFt.toLocaleString()} sq ft`);
    }
  }

  if (userQuestion) {
    parts.push("");
    parts.push(`USER QUESTION (address this specifically in your analysis): ${userQuestion}`);
  }

  return parts.join("\n");
}

/**
 * Analyze a site photo using Gemini 3 Flash multimodal.
 * Returns structured JSON with site description, context analysis,
 * development potential, and follow-up questions.
 */
export const analyzeSite = action({
  args: {
    imageStorageId: v.id("_storage"),
    userQuestion: v.optional(v.string()),
    zoningContext: zoningContextValidator,
  },
  handler: async (ctx, args) => {
    console.log("[visualization/analyze] Starting site analysis...");
    console.log("[visualization/analyze] Image storage ID:", args.imageStorageId);
    console.log("[visualization/analyze] User question:", args.userQuestion);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[visualization/analyze] GEMINI_API_KEY not configured!");
      throw new Error(
        "GEMINI_API_KEY not configured - please add it to your Convex environment variables"
      );
    }

    const startTime = Date.now();

    // Get the image URL from Convex storage
    const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
    if (!imageUrl) {
      throw new Error("Image not found in storage");
    }

    // Fetch the image data to send inline to Gemini
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");

    // Determine MIME type from response headers
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Build system instruction
    const systemInstruction = buildAnalysisSystemInstruction(
      args.userQuestion,
      args.zoningContext
    );

    // Build request body for Gemini multimodal
    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: contentType,
                data: imageBase64,
              },
            },
            {
              text: args.userQuestion
                ? `Analyze this site photo. ${args.userQuestion}`
                : "Analyze this site photo for development potential in Milwaukee, WI.",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingLevel: "MEDIUM",
        },
      },
    };

    // Retry logic with model fallback - follows pattern from generate.ts
    const BASE_DELAY_MS = 3000;
    const models = [GEMINI_ANALYSIS_MODEL_PRIMARY, GEMINI_ANALYSIS_MODEL_FALLBACK];
    let lastError: Error | null = null;

    for (const currentModel of models) {
      const isPrimary = currentModel === GEMINI_ANALYSIS_MODEL_PRIMARY;
      console.log(
        `[visualization/analyze] Trying model: ${currentModel} (${isPrimary ? "primary" : "fallback"})`
      );

      for (let attempt = 0; attempt < RETRIES_PER_MODEL; attempt++) {
        if (attempt > 0) {
          const delay =
            BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.log(
            `[visualization/analyze] Retry ${attempt + 1}/${RETRIES_PER_MODEL} for ${currentModel} after ${Math.round(delay)}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        try {
          console.log(
            "[visualization/analyze] Calling API:",
            `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`
          );

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "[visualization/analyze] API error:",
              response.status,
              errorText
            );

            // Handle rate limiting and overload - retry
            if (response.status === 429 || response.status === 503) {
              lastError = new Error(
                response.status === 429
                  ? `${currentModel}: Rate limited - API is busy`
                  : `${currentModel}: Model overloaded - API is at capacity`
              );
              continue; // Retry same model
            }

            // Model not found or unavailable - try fallback
            if (response.status === 404 || response.status === 400) {
              console.log(
                `[visualization/analyze] Model ${currentModel} unavailable, trying next model...`
              );
              lastError = new Error(`${currentModel}: Model unavailable`);
              break; // Move to next model
            }

            throw new Error(`Gemini API error: ${response.status}`);
          }

          const data = await response.json();
          console.log(
            "[visualization/analyze] Response received, structure:",
            JSON.stringify({
              model: currentModel,
              hasCandidate: !!data.candidates?.[0],
              hasContent: !!data.candidates?.[0]?.content,
              partsCount: data.candidates?.[0]?.content?.parts?.length,
              promptFeedback: data.promptFeedback,
            })
          );

          // Extract text response
          let responseText = "";
          if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  responseText = part.text;
                }
              }
            }
          }

          if (!responseText) {
            console.error(
              "[visualization/analyze] No text response. Full data:",
              JSON.stringify(data, null, 2)
            );

            if (data.promptFeedback?.blockReason) {
              lastError = new Error(
                `Content blocked: ${data.promptFeedback.blockReason}`
              );
              continue;
            }

            lastError = new Error(
              `${currentModel}: Empty response from model`
            );
            continue;
          }

          // Parse JSON response
          let analysisResult;
          try {
            analysisResult = JSON.parse(responseText);
          } catch (parseError) {
            console.error(
              "[visualization/analyze] JSON parse failed:",
              parseError
            );
            console.error(
              "[visualization/analyze] Raw response:",
              responseText.substring(0, 500)
            );
            lastError = new Error(
              `${currentModel}: Failed to parse JSON response`
            );
            continue;
          }

          const analysisTimeMs = Date.now() - startTime;
          console.log(
            `[visualization/analyze] Analysis completed in ${analysisTimeMs}ms using ${currentModel}`
          );

          // Ensure all required fields exist with defaults
          const result = {
            siteDescription: {
              lotCharacteristics:
                analysisResult.siteDescription?.lotCharacteristics || "",
              existingConditions:
                analysisResult.siteDescription?.existingConditions || "",
              topography: analysisResult.siteDescription?.topography || "",
              vegetation: analysisResult.siteDescription?.vegetation || "",
            },
            contextAnalysis: {
              adjacentBuildings:
                analysisResult.contextAnalysis?.adjacentBuildings || "",
              neighborhoodCharacter:
                analysisResult.contextAnalysis?.neighborhoodCharacter || "",
              streetType: analysisResult.contextAnalysis?.streetType || "",
              pedestrianEnvironment:
                analysisResult.contextAnalysis?.pedestrianEnvironment || "",
            },
            developmentPotential: {
              suitableUses:
                analysisResult.developmentPotential?.suitableUses || [],
              estimatedCapacity:
                analysisResult.developmentPotential?.estimatedCapacity || "",
              designConsiderations:
                analysisResult.developmentPotential?.designConsiderations || [],
              challenges:
                analysisResult.developmentPotential?.challenges || [],
              opportunities:
                analysisResult.developmentPotential?.opportunities || [],
            },
            questionsToInvestigate:
              analysisResult.questionsToInvestigate || [],
            analysisTimeMs,
            modelUsed: currentModel,
          };

          return result;
        } catch (error) {
          console.error(
            `[visualization/analyze] ${currentModel} attempt ${attempt + 1} error:`,
            error
          );
          lastError =
            error instanceof Error ? error : new Error(String(error));
          // Continue to next retry
        }
      }

      // All retries for this model exhausted, try next model
      console.log(
        `[visualization/analyze] Exhausted ${RETRIES_PER_MODEL} retries for ${currentModel}, ${isPrimary ? "trying fallback model..." : "no more models to try"}`
      );
    }

    // All models and retries exhausted
    console.error(
      "[visualization/analyze] All models and retries exhausted. Last error:",
      lastError
    );
    throw new Error(
      lastError?.message ||
        "Failed to analyze site after multiple attempts. Please try again later."
    );
  },
});
