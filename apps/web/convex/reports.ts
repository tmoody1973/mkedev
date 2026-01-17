/**
 * Report Generation Module
 *
 * Generates PDF reports from conversations using the Hybiscus API.
 * https://hybiscus.dev/
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// =============================================================================
// Types
// =============================================================================

interface HybiscusComponent {
  type: string;
  options: Record<string, unknown>;
  components?: HybiscusComponent[];
}

interface HybiscusPayload {
  type: "Report";
  options: {
    report_title: string;
    report_byline: string;
    version_number?: string;
  };
  components: HybiscusComponent[];
}

interface HybiscusBuildResponse {
  task_id: string;
  status: "QUEUED" | "PROCESSING" | "SUCCESS" | "FAILURE";
}

interface HybiscusStatusResponse {
  task_id: string;
  status: "QUEUED" | "PROCESSING" | "SUCCESS" | "FAILURE";
  error_message?: string;
}

interface CardData {
  type: string;
  data: Record<string, unknown>;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format a timestamp as a human-readable date/time string.
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a date for the report header.
 */
function formatReportDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Build Hybiscus components for a card with proper formatting and images.
 */
function buildCardComponents(card: CardData): HybiscusComponent[] {
  const { type, data } = card;
  const components: HybiscusComponent[] = [];

  switch (type) {
    case "zone-info": {
      let zoneText = `### Zoning Information\n\n`;
      zoneText += `**District:** ${data.zoningDistrict || "Unknown"}\n`;
      if (data.zoningCategory) zoneText += `**Category:** ${data.zoningCategory}\n`;
      if (data.zoningType) zoneText += `**Type:** ${data.zoningType}\n`;
      if (data.overlayZones && Array.isArray(data.overlayZones) && data.overlayZones.length > 0) {
        zoneText += `**Overlay Zones:** ${(data.overlayZones as string[]).join(", ")}\n`;
      }
      components.push({
        type: "Card",
        options: {
          bg_colour: "blue-50",
          border_colour: "blue-200",
        },
        components: [{
          type: "Text",
          options: { text: zoneText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "parcel-info": {
      let parcelText = `### Property Details\n\n`;
      parcelText += `**Address:** ${data.address || "Unknown"}\n`;
      if (data.zoningDistrict) parcelText += `**Zoning:** ${data.zoningDistrict}`;
      if (data.zoningCategory) parcelText += ` (${data.zoningCategory})`;
      parcelText += "\n";
      if (data.zoningType) parcelText += `**Type:** ${data.zoningType}\n`;
      if (data.areaPlanName) parcelText += `**Area Plan:** ${data.areaPlanName}\n`;
      if (data.areaPlanContext) parcelText += `\n_${data.areaPlanContext}_\n`;
      if (data.parkingRequired) parcelText += `\n**Parking Required:** ${data.parkingRequired}\n`;
      if (data.overlayZones && Array.isArray(data.overlayZones) && data.overlayZones.length > 0) {
        parcelText += `**Overlay Zones:** ${(data.overlayZones as string[]).join(", ")}\n`;
      }
      components.push({
        type: "Card",
        options: {
          bg_colour: "green-50",
          border_colour: "green-200",
        },
        components: [{
          type: "Text",
          options: { text: parcelText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "code-citation": {
      let citationText = `### Zoning Code Reference\n\n`;
      if (data.answer) citationText += `${data.answer}\n\n`;
      if (data.citations && Array.isArray(data.citations)) {
        citationText += "**Sources:**\n";
        for (const cite of data.citations as Array<{ sourceName?: string; sectionReference?: string; pageNumber?: number }>) {
          citationText += `- ${cite.sourceName || "Unknown Source"}`;
          if (cite.sectionReference) citationText += ` (${cite.sectionReference})`;
          if (cite.pageNumber) citationText += ` p.${cite.pageNumber}`;
          citationText += "\n";
        }
      }
      components.push({
        type: "Card",
        options: {
          bg_colour: "amber-50",
          border_colour: "amber-200",
        },
        components: [{
          type: "Text",
          options: { text: citationText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "area-plan-context": {
      let areaText = `### Area Plan Information\n\n`;
      if (data.answer) areaText += `${data.answer}\n\n`;
      if (data.citations && Array.isArray(data.citations)) {
        areaText += "**Sources:**\n";
        for (const cite of data.citations as Array<{ sourceName?: string; sectionReference?: string }>) {
          areaText += `- ${cite.sourceName || "Unknown"}`;
          if (cite.sectionReference) areaText += ` (${cite.sectionReference})`;
          areaText += "\n";
        }
      }
      components.push({
        type: "Card",
        options: {
          bg_colour: "purple-50",
          border_colour: "purple-200",
        },
        components: [{
          type: "Text",
          options: { text: areaText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "home-listing": {
      // Build property details text
      let homeText = `### ${data.address || "Property Listing"}\n\n`;
      if (data.neighborhood) homeText += `**Neighborhood:** ${data.neighborhood}\n`;
      if (data.districtName) homeText += `**District:** ${data.districtName}\n`;

      // Bed/Bath/SqFt summary
      const features: string[] = [];
      if (data.bedrooms !== undefined) features.push(`${data.bedrooms} bed`);
      if (data.fullBaths !== undefined) features.push(`${data.fullBaths} bath`);
      if (data.halfBaths) features.push(`${data.halfBaths} half bath`);
      if (features.length > 0) homeText += `**Layout:** ${features.join(" • ")}\n`;

      if (data.buildingSqFt) homeText += `**Size:** ${(data.buildingSqFt as number).toLocaleString()} sq ft\n`;
      if (data.lotSizeSqFt) homeText += `**Lot Size:** ${(data.lotSizeSqFt as number).toLocaleString()} sq ft\n`;
      if (data.yearBuilt) homeText += `**Year Built:** ${data.yearBuilt}\n`;
      if (data.numberOfUnits && (data.numberOfUnits as number) > 1) homeText += `**Units:** ${data.numberOfUnits}\n`;
      if (data.developerName) homeText += `**Developer:** ${data.developerName}\n`;

      if (data.narrative) homeText += `\n${data.narrative}\n`;

      if (data.listingUrl) homeText += `\n[View Full Listing](${data.listingUrl})\n`;

      // If we have an image, use a Row layout with image + text
      if (data.primaryImageUrl) {
        components.push({
          type: "Card",
          options: {
            bg_colour: "sky-50",
            border_colour: "sky-200",
          },
          components: [
            {
              type: "Row",
              options: { columns: 2, column_spacing: 4 },
              components: [
                {
                  type: "Image",
                  options: {
                    image_url: data.primaryImageUrl as string,
                    width: "1/2",
                    rounded: true,
                    caption: data.address as string || "Property Photo",
                  },
                },
                {
                  type: "Text",
                  options: { text: homeText, markdown_format: true, size: "sm" },
                },
              ],
            },
          ],
        });

        // Add additional images if available
        if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 1) {
          const additionalImages = (data.imageUrls as string[]).slice(1, 4); // Show up to 3 more
          if (additionalImages.length > 0) {
            components.push({
              type: "Row",
              options: { columns: additionalImages.length, column_spacing: 2 },
              components: additionalImages.map((url, i) => ({
                type: "Image",
                options: {
                  image_url: url,
                  rounded: true,
                  caption: `Photo ${i + 2}`,
                },
              })),
            });
          }
        }
      } else {
        // No image, just show the text
        components.push({
          type: "Card",
          options: {
            bg_colour: "sky-50",
            border_colour: "sky-200",
          },
          components: [{
            type: "Text",
            options: { text: homeText, markdown_format: true, size: "sm" },
          }],
        });
      }
      break;
    }

    case "homes-list": {
      if (!data.homes || !Array.isArray(data.homes)) break;
      const homes = data.homes as Array<{
        id?: string;
        address?: string;
        neighborhood?: string;
        bedrooms?: number;
        fullBaths?: number;
        halfBaths?: number;
        primaryImageUrl?: string;
      }>;

      components.push({
        type: "Text",
        options: {
          text: `### Available Homes (${homes.length} listings)\n`,
          markdown_format: true,
          size: "sm",
        },
      });

      // Create a card for each home with image if available
      for (const home of homes) {
        let homeText = `**${home.address || "Unknown Address"}**\n`;
        if (home.neighborhood) homeText += `${home.neighborhood}\n`;
        const features: string[] = [];
        if (home.bedrooms !== undefined) features.push(`${home.bedrooms} bed`);
        if (home.fullBaths !== undefined) features.push(`${home.fullBaths} bath`);
        if (features.length > 0) homeText += features.join(" • ");

        if (home.primaryImageUrl) {
          components.push({
            type: "Card",
            options: {
              bg_colour: "stone-50",
              vertical_margin: 1,
            },
            components: [{
              type: "Row",
              options: { columns: 2, column_spacing: 3 },
              components: [
                {
                  type: "Image",
                  options: {
                    image_url: home.primaryImageUrl,
                    width: "1/3",
                    rounded: true,
                  },
                },
                {
                  type: "Text",
                  options: { text: homeText, markdown_format: true, size: "sm" },
                },
              ],
            }],
          });
        } else {
          components.push({
            type: "Card",
            options: {
              bg_colour: "stone-50",
              vertical_margin: 1,
            },
            components: [{
              type: "Text",
              options: { text: homeText, markdown_format: true, size: "sm" },
            }],
          });
        }
      }
      break;
    }

    case "parcel-analysis": {
      let analysisText = `### Parking Analysis\n\n`;
      if (data.requiredSpaces !== undefined) analysisText += `**Required Spaces:** ${data.requiredSpaces}\n`;
      if (data.calculation) analysisText += `**Calculation:** ${data.calculation}\n`;
      if (data.codeReference) analysisText += `**Code Reference:** ${data.codeReference}\n`;
      if (data.isReducedDistrict) analysisText += `\n_Note: Property is in a reduced parking district._\n`;
      components.push({
        type: "Card",
        options: {
          bg_colour: "orange-50",
          border_colour: "orange-200",
        },
        components: [{
          type: "Text",
          options: { text: analysisText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    default:
      break;
  }

  return components;
}

/**
 * Build Hybiscus components from conversation messages.
 */
function buildReportComponents(
  messages: Array<{
    role: string;
    content: string;
    timestamp: number;
    cards?: CardData[];
  }>
): HybiscusComponent[] {
  const components: HybiscusComponent[] = [];

  // Add each message as a section
  for (const message of messages) {
    const isUser = message.role === "user";
    const roleLabel = isUser ? "You" : "MKE.dev Assistant";
    const roleIcon = isUser ? "user" : "robot";
    const bgColor = isUser ? "background-muted" : "background-faded";

    // Build section components array
    const sectionComponents: HybiscusComponent[] = [];

    // Add main message text
    sectionComponents.push({
      type: "Text",
      options: {
        text: message.content,
        bg_colour: bgColor,
        inner_padding: 4,
        markdown_format: true,
        size: "sm",
      },
    });

    // Add card components (with images, proper formatting)
    if (message.cards && message.cards.length > 0) {
      for (const card of message.cards) {
        const cardComponents = buildCardComponents(card);
        sectionComponents.push(...cardComponents);
      }
    }

    // Create section for this message
    const section: HybiscusComponent = {
      type: "Section",
      options: {
        section_title: `${roleLabel} • ${formatTimestamp(message.timestamp)}`,
        icon: roleIcon,
        highlighted: !isUser,
        horizontal_margin: 2,
        vertical_margin: 1,
      },
      components: sectionComponents,
    };

    components.push(section);
  }

  return components;
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Generate a PDF report from a conversation.
 */
export const generateReport = action({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    downloadUrl?: string;
    error?: string;
  }> => {
    console.log("[reports] Starting report generation for:", args.conversationId);

    // Get Hybiscus API key
    const apiKey = process.env.HYBISCUS_API_KEY;
    if (!apiKey) {
      console.error("[reports] HYBISCUS_API_KEY not configured");
      return {
        success: false,
        error: "HYBISCUS_API_KEY not configured",
      };
    }
    console.log("[reports] API key found");

    // Fetch conversation with messages
    const result = await ctx.runQuery(api.conversations.getWithMessages, {
      conversationId: args.conversationId,
    });

    if (!result) {
      console.error("[reports] Conversation not found");
      return {
        success: false,
        error: "Conversation not found or access denied",
      };
    }

    const { title, messages } = result;
    console.log("[reports] Conversation found:", title, "with", messages?.length, "messages");

    if (!messages || messages.length === 0) {
      console.error("[reports] No messages in conversation");
      return {
        success: false,
        error: "No messages in conversation",
      };
    }

    // Build the Hybiscus payload
    const payload: HybiscusPayload = {
      type: "Report",
      options: {
        report_title: "MKE.dev Conversation Report",
        report_byline: `${title} • Generated ${formatReportDate()}`,
        version_number: "1.0",
      },
      components: [
        // Header section
        {
          type: "Section",
          options: {
            section_title: "Conversation Summary",
            icon: "messages",
            highlighted: true,
            horizontal_margin: 2,
          },
          components: [
            {
              type: "Text",
              options: {
                text: `This report contains the full transcript of your conversation with the MKE.dev Zoning Assistant. The conversation includes **${messages.length} messages** and covers topics related to Milwaukee zoning, development, and planning.`,
                markdown_format: true,
                size: "sm",
              },
            },
          ],
        },
        // Add a vertical spacer
        {
          type: "VerticalSpacer",
          options: {
            space: 4,
          },
        },
        // Message transcript
        ...buildReportComponents(messages as Array<{
          role: string;
          content: string;
          timestamp: number;
          cards?: CardData[];
        }>),
        // Footer
        {
          type: "VerticalSpacer",
          options: {
            space: 4,
          },
        },
        {
          type: "Text",
          options: {
            text: "---\n\n_This report was generated by MKE.dev, Milwaukee's AI-powered civic intelligence platform. For more information, visit [mke.dev](https://mke.dev)._",
            markdown_format: true,
            size: "xs",
            align: "center",
            colour: "sub-headline",
          },
        },
      ],
    };

    try {
      console.log("[reports] Submitting to Hybiscus API...");

      // Step 1: Submit report job
      const buildResponse = await fetch(
        "https://api.hybiscus.dev/api/v1/build-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("[reports] Hybiscus response status:", buildResponse.status);

      if (!buildResponse.ok) {
        const errorText = await buildResponse.text();
        console.error("[reports] Hybiscus error:", errorText);
        return {
          success: false,
          error: `Failed to submit report job: ${errorText}`,
        };
      }

      const buildResult: HybiscusBuildResponse = await buildResponse.json();
      const taskId = buildResult.task_id;
      console.log("[reports] Task ID:", taskId, "Status:", buildResult.status);

      // Step 2: Poll for completion (max 30 seconds)
      const maxAttempts = 30;
      const pollInterval = 1000; // 1 second

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Wait before polling
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(
          `https://api.hybiscus.dev/api/v1/get-task-status?task_id=${taskId}`,
          {
            method: "GET",
            headers: {
              "X-API-KEY": apiKey,
            },
          }
        );

        if (!statusResponse.ok) {
          continue; // Retry on error
        }

        const statusResult: HybiscusStatusResponse = await statusResponse.json();

        if (statusResult.status === "SUCCESS") {
          // Step 3: Return download URL
          const downloadUrl = `https://api.hybiscus.dev/api/v1/get-report?task_id=${taskId}&api_key=${apiKey}`;
          return {
            success: true,
            downloadUrl,
          };
        }

        if (statusResult.status === "FAILURE") {
          return {
            success: false,
            error: statusResult.error_message || "Report generation failed",
          };
        }

        // Continue polling if QUEUED or PROCESSING
      }

      return {
        success: false,
        error: "Report generation timed out",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
