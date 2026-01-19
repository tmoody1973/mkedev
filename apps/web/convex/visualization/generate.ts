import { v } from "convex/values";
import { action, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// =============================================================================
// Site Visualization Generation - Gemini 3 Pro Image
// =============================================================================

// Gemini 3 Pro Image model for hackathon
const GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview";

// Zoning context type
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
  })
);

/**
 * Build zoning-aware prompt for image generation.
 * Injects zoning constraints to ensure compliant visualizations.
 */
function buildEnhancedPrompt(
  userPrompt: string,
  zoningContext?: {
    zoningDistrict?: string;
    zoningCategory?: string;
    maxHeight?: number;
    maxStories?: number;
    setbacks?: { front: number; side: number; rear: number };
    maxFAR?: number;
    overlayZones?: string[];
    historicDistrict?: boolean;
    neighborhood?: string;
  },
  address?: string,
  maskDescription?: string,
  viewType?: 'aerial' | 'street' | 'unknown'
): string {
  const parts: string[] = [];

  // View/Scale context - CRITICAL for proper generation
  parts.push("IMAGE CONTEXT:");
  if (viewType === 'aerial') {
    parts.push("- View Type: Aerial/satellite view from above");
    parts.push("- Scale: Buildings should appear as they would from above, showing rooftops");
  } else if (viewType === 'street') {
    parts.push("- View Type: Street-level perspective view");
    parts.push("- Scale: Buildings should appear at human scale, showing facades");
  } else {
    parts.push("- View Type: Map screenshot - treat as aerial/birds-eye view");
    parts.push("- Scale: Match the scale of existing buildings visible in the image");
  }

  // Site context
  parts.push("\nSITE CONTEXT:");
  if (address) {
    parts.push(`- Address: ${address}, Milwaukee, WI`);
  }
  if (zoningContext?.neighborhood) {
    parts.push(`- Neighborhood: ${zoningContext.neighborhood}`);
  }

  // Mask/Edit region - CRITICAL for telling Gemini WHERE to modify
  if (maskDescription) {
    parts.push("\nEDIT REGION:");
    parts.push(`- Modify ONLY ${maskDescription}`);
    parts.push("- Keep all other areas of the image EXACTLY as they are");
    parts.push("- The second image shows the mask: white areas = MODIFY, black areas = KEEP UNCHANGED");
  }

  // Zoning constraints
  if (zoningContext) {
    parts.push("\nZONING CONSTRAINTS (generated image MUST comply):");

    if (zoningContext.zoningDistrict) {
      const category = zoningContext.zoningCategory
        ? ` (${zoningContext.zoningCategory})`
        : "";
      parts.push(`- Zoning District: ${zoningContext.zoningDistrict}${category}`);
    }

    if (zoningContext.maxHeight) {
      parts.push(`- Maximum Height: ${zoningContext.maxHeight} feet`);
    }

    if (zoningContext.maxStories) {
      parts.push(`- Maximum Stories: ${zoningContext.maxStories}`);
    }

    if (zoningContext.setbacks) {
      parts.push(`- Setbacks: Front ${zoningContext.setbacks.front}ft, Side ${zoningContext.setbacks.side}ft, Rear ${zoningContext.setbacks.rear}ft`);
    }

    if (zoningContext.maxFAR) {
      parts.push(`- Floor Area Ratio (FAR): ${zoningContext.maxFAR}`);
    }

    if (zoningContext.overlayZones && zoningContext.overlayZones.length > 0) {
      parts.push(`- Overlay Zones: ${zoningContext.overlayZones.join(", ")}`);
    }

    if (zoningContext.historicDistrict) {
      parts.push("- Historic District: Yes - must be architecturally compatible with surrounding historic buildings");
    }
  }

  // Architectural context
  parts.push("\nARCHITECTURAL CONTEXT:");
  parts.push("- Milwaukee urban context");
  parts.push("- Match the EXACT scale of surrounding buildings in the image");
  parts.push("- Ensure new structures are proportional to existing ones");

  // User request
  parts.push("\nUSER REQUEST:");
  parts.push(userPrompt);

  // Generation instructions
  parts.push("\nGENERATION INSTRUCTIONS:");
  parts.push("Generate a photorealistic architectural visualization that:");
  parts.push("1. ONLY modifies the specified edit region (masked area)");
  parts.push("2. Preserves ALL existing buildings, streets, and features outside the mask");
  parts.push("3. Matches the EXACT perspective and lighting of the source image");
  parts.push("4. Uses the SAME scale as existing buildings visible in the image");
  parts.push("5. Blends seamlessly with the surrounding context");
  parts.push("6. Complies with all zoning constraints listed above");

  return parts.join("\n");
}

/**
 * Generate a site visualization using Gemini 3 Pro Image.
 * Supports both full image generation and masked inpainting.
 */
export const generate = action({
  args: {
    sourceImageBase64: v.string(), // Base64 encoded source image
    maskImageBase64: v.optional(v.string()), // Optional mask for inpainting
    prompt: v.string(),
    zoningContext: zoningContextValidator,
    address: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
    sourceType: v.optional(v.union(
      v.literal("map"),
      v.literal("street_view"),
      v.literal("upload")
    )),
    maskDescription: v.optional(v.string()), // Client-side description of mask location
  },
  handler: async (_ctx, args) => {
    console.log("[visualization/generate] Starting generation...");
    console.log("[visualization/generate] Prompt:", args.prompt);
    console.log("[visualization/generate] Has mask:", !!args.maskImageBase64);
    console.log("[visualization/generate] Source type:", args.sourceType);
    console.log("[visualization/generate] Mask description:", args.maskDescription);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[visualization/generate] GEMINI_API_KEY not configured!");
      throw new Error("GEMINI_API_KEY not configured - please add it to your Convex environment variables");
    }

    console.log("[visualization/generate] API key found (length:", apiKey.length, ")");
    const startTime = Date.now();

    // Determine view type based on source
    const viewType = args.sourceType === 'street_view' ? 'street' :
                     args.sourceType === 'map' ? 'aerial' : 'unknown';

    // Build enhanced prompt with zoning context, mask description, and view type
    const enhancedPrompt = buildEnhancedPrompt(
      args.prompt,
      args.zoningContext,
      args.address,
      args.maskDescription || (args.maskImageBase64 ? "the masked/highlighted region" : undefined),
      viewType
    );

    console.log("[visualization/generate] Enhanced prompt:", enhancedPrompt);

    // Prepare image parts for multimodal request
    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];

    // Add source image
    const sourceImageData = args.sourceImageBase64.replace(/^data:image\/\w+;base64,/, "");
    imageParts.push({
      inlineData: {
        mimeType: "image/png",
        data: sourceImageData,
      },
    });

    // Add mask if provided (for inpainting)
    if (args.maskImageBase64) {
      const maskImageData = args.maskImageBase64.replace(/^data:image\/\w+;base64,/, "");
      imageParts.push({
        inlineData: {
          mimeType: "image/png",
          data: maskImageData,
        },
      });
    }

    // Build request body for Gemini 3 Pro Image
    const requestBody = {
      contents: [
        {
          parts: [
            ...imageParts,
            {
              text: args.maskImageBase64
                ? `I have provided a source image and a mask image (white areas indicate regions to modify). ${enhancedPrompt}`
                : `I have provided a reference image of a site. ${enhancedPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 8192,
        // Enable image generation mode
        responseModalities: ["TEXT", "IMAGE"],
      },
    };

    // Retry logic with exponential backoff for overloaded API
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 2000;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`[visualization/generate] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      try {
        // Call Gemini 3 Pro Image API
        console.log("[visualization/generate] Calling API:", `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`);
        console.log("[visualization/generate] Image count:", imageParts.length);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`,
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
          console.error("[visualization/generate] API error:", response.status, errorText);

          // Handle rate limiting and overload - retry
          if (response.status === 429 || response.status === 503) {
            lastError = new Error(response.status === 429
              ? "Rate limited - API is busy"
              : "Model overloaded - API is at capacity");
            continue; // Retry
          }

          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("[visualization/generate] Response received, structure:", JSON.stringify({
          hasCandidate: !!data.candidates?.[0],
          hasContent: !!data.candidates?.[0]?.content,
          partsCount: data.candidates?.[0]?.content?.parts?.length,
          partTypes: data.candidates?.[0]?.content?.parts?.map((p: { inlineData?: unknown; text?: unknown }) =>
            p.inlineData ? 'image' : p.text ? 'text' : 'unknown'
          ),
          promptFeedback: data.promptFeedback,
        }));

        // Extract generated image from response
        let generatedImageBase64: string | null = null;
        let responseText = "";

        if (data.candidates && data.candidates.length > 0) {
          const candidate = data.candidates[0];
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData) {
                // This is an image part
                generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              } else if (part.text) {
                responseText = part.text;
              }
            }
          }
        }

        const generationTimeMs = Date.now() - startTime;
        console.log(`[visualization/generate] Generation completed in ${generationTimeMs}ms`);

        // If no image was generated, the model might have returned text describing why
        if (!generatedImageBase64) {
          console.error("[visualization/generate] No image generated. Full response data:", JSON.stringify(data, null, 2));
          console.error("[visualization/generate] Response text:", responseText);

          // Check for specific error conditions
          if (data.promptFeedback?.blockReason) {
            lastError = new Error(`Content blocked: ${data.promptFeedback.blockReason}. Try a different prompt.`);
            continue; // Retry
          }
          if (data.candidates?.[0]?.finishReason === "SAFETY") {
            throw new Error("Generation blocked by safety filters. Try rephrasing your request.");
          }
          if (data.candidates?.[0]?.finishReason === "RECITATION") {
            throw new Error("Generation blocked due to content policy. Try a different prompt.");
          }

          // Model returned text instead of image - retry
          lastError = new Error(responseText || "Model returned text instead of image");
          continue;
        }

        // Success - return the result
        return {
          success: true,
          generatedImageBase64,
          enhancedPrompt,
          responseText,
          generationTimeMs,
        };
      } catch (error) {
        console.error(`[visualization/generate] Attempt ${attempt + 1} error:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next retry
      }
    }

    // All retries exhausted
    console.error("[visualization/generate] All retries exhausted. Last error:", lastError);
    throw new Error(
      lastError?.message ||
      "Failed to generate image after multiple attempts. The Gemini 3 Pro Image API may be overloaded - please try again in a few moments."
    );
  },
});

/**
 * Save a visualization to the user's gallery.
 */
export const save = mutation({
  args: {
    sourceImageBase64: v.string(),
    generatedImageBase64: v.string(),
    maskImageBase64: v.optional(v.string()),
    prompt: v.string(),
    enhancedPrompt: v.optional(v.string()),
    sourceType: v.union(
      v.literal("map_screenshot"),
      v.literal("street_view"),
      v.literal("upload")
    ),
    address: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
    zoningContext: zoningContextValidator,
    generationTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to save visualizations");
    }

    const userId = identity.subject;
    const now = Date.now();

    // Convert base64 images to Convex storage
    // For now, we'll skip actual storage upload and store placeholder IDs
    // In production, you'd upload to Convex storage

    // Create visualization record
    const visualizationId = await ctx.db.insert("visualizations", {
      userId,
      sourceImageId: "placeholder" as Id<"_storage">, // TODO: Upload to storage
      sourceType: args.sourceType,
      prompt: args.prompt,
      enhancedPrompt: args.enhancedPrompt,
      address: args.address,
      coordinates: args.coordinates,
      zoningContext: args.zoningContext,
      status: "completed",
      generationTimeMs: args.generationTimeMs,
      isSaved: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    return visualizationId;
  },
});

/**
 * Get user's saved visualizations (gallery).
 */
export const getGallery = action({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, _args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to view gallery");
    }

    // This would query from visualizations table
    // For now, return empty array as placeholder
    return {
      visualizations: [],
      cursor: null,
    };
  },
});

/**
 * Delete a visualization from gallery (soft delete).
 */
export const deleteVisualization = mutation({
  args: {
    visualizationId: v.id("visualizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to delete visualizations");
    }

    const visualization = await ctx.db.get(args.visualizationId);
    if (!visualization) {
      throw new Error("Visualization not found");
    }

    if (visualization.userId !== identity.subject) {
      throw new Error("Not authorized to delete this visualization");
    }

    await ctx.db.patch(args.visualizationId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
  },
});
