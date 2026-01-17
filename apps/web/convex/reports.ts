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
 * Convert a card to Hybiscus text content.
 */
function formatCardAsText(card: CardData): string {
  const { type, data } = card;

  switch (type) {
    case "zone-info":
      return `**Zoning District:** ${data.zoningDistrict || "Unknown"}\n` +
        (data.zoningCategory ? `**Category:** ${data.zoningCategory}\n` : "") +
        (data.overlayZones && Array.isArray(data.overlayZones) && data.overlayZones.length > 0
          ? `**Overlay Zones:** ${(data.overlayZones as string[]).join(", ")}\n`
          : "");

    case "parcel-info":
      let parcelText = `**Address:** ${data.address || "Unknown"}\n`;
      if (data.zoningDistrict) parcelText += `**Zoning:** ${data.zoningDistrict}\n`;
      if (data.zoningCategory) parcelText += `**Category:** ${data.zoningCategory}\n`;
      if (data.areaPlanName) parcelText += `**Area Plan:** ${data.areaPlanName}\n`;
      if (data.parkingRequired) parcelText += `**Parking Required:** ${data.parkingRequired}\n`;
      return parcelText;

    case "code-citation":
      let citationText = "";
      if (data.answer) citationText += `${data.answer}\n\n`;
      if (data.citations && Array.isArray(data.citations)) {
        citationText += "**Sources:**\n";
        for (const cite of data.citations as Array<{ sourceName?: string; sectionReference?: string }>) {
          citationText += `- ${cite.sourceName || "Unknown Source"}`;
          if (cite.sectionReference) citationText += ` (${cite.sectionReference})`;
          citationText += "\n";
        }
      }
      return citationText;

    case "area-plan-context":
      let areaText = "";
      if (data.answer) areaText += `${data.answer}\n\n`;
      if (data.citations && Array.isArray(data.citations)) {
        areaText += "**Area Plan Sources:**\n";
        for (const cite of data.citations as Array<{ sourceName?: string }>) {
          areaText += `- ${cite.sourceName || "Unknown"}\n`;
        }
      }
      return areaText;

    case "home-listing":
      let homeText = `**Property:** ${data.address || "Unknown Address"}\n`;
      if (data.neighborhood) homeText += `**Neighborhood:** ${data.neighborhood}\n`;
      if (data.bedrooms !== undefined) homeText += `**Bedrooms:** ${data.bedrooms}\n`;
      if (data.fullBaths !== undefined || data.halfBaths !== undefined) {
        const baths = [];
        if (data.fullBaths) baths.push(`${data.fullBaths} full`);
        if (data.halfBaths) baths.push(`${data.halfBaths} half`);
        homeText += `**Baths:** ${baths.join(", ")}\n`;
      }
      if (data.buildingSqFt) homeText += `**Size:** ${data.buildingSqFt.toLocaleString()} sq ft\n`;
      if (data.yearBuilt) homeText += `**Year Built:** ${data.yearBuilt}\n`;
      if (data.narrative) homeText += `\n${data.narrative}\n`;
      return homeText;

    case "homes-list":
      if (!data.homes || !Array.isArray(data.homes)) return "";
      let listText = "**Available Homes:**\n";
      for (const home of data.homes as Array<{
        address?: string;
        neighborhood?: string;
        bedrooms?: number;
        fullBaths?: number;
      }>) {
        listText += `- ${home.address || "Unknown"}`;
        if (home.neighborhood) listText += ` (${home.neighborhood})`;
        if (home.bedrooms !== undefined) listText += ` - ${home.bedrooms} bed`;
        if (home.fullBaths !== undefined) listText += `, ${home.fullBaths} bath`;
        listText += "\n";
      }
      return listText;

    case "parcel-analysis":
      let analysisText = "";
      if (data.requiredSpaces !== undefined) analysisText += `**Required Parking:** ${data.requiredSpaces} spaces\n`;
      if (data.calculation) analysisText += `**Calculation:** ${data.calculation}\n`;
      if (data.codeReference) analysisText += `**Code Reference:** ${data.codeReference}\n`;
      return analysisText;

    default:
      return "";
  }
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

    // Build message content with any cards
    let messageContent = message.content;

    // Add card content as formatted text
    if (message.cards && message.cards.length > 0) {
      messageContent += "\n\n---\n\n";
      for (const card of message.cards) {
        const cardText = formatCardAsText(card);
        if (cardText) {
          messageContent += cardText + "\n";
        }
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
      components: [
        {
          type: "Text",
          options: {
            text: messageContent,
            bg_colour: bgColor,
            inner_padding: 4,
            markdown_format: true,
            size: "sm",
          },
        },
      ],
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
    // Get Hybiscus API key
    const apiKey = process.env.HYBISCUS_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "HYBISCUS_API_KEY not configured",
      };
    }

    // Fetch conversation with messages
    const result = await ctx.runQuery(api.conversations.getWithMessages, {
      conversationId: args.conversationId,
    });

    if (!result) {
      return {
        success: false,
        error: "Conversation not found or access denied",
      };
    }

    const { title, messages } = result;

    if (!messages || messages.length === 0) {
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
          type: "Vertical Spacer",
          options: {
            size: 4,
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
          type: "Vertical Spacer",
          options: {
            size: 4,
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

      if (!buildResponse.ok) {
        const errorText = await buildResponse.text();
        return {
          success: false,
          error: `Failed to submit report job: ${errorText}`,
        };
      }

      const buildResult: HybiscusBuildResponse = await buildResponse.json();
      const taskId = buildResult.task_id;

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
