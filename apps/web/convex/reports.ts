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
// Constants
// =============================================================================

// Logo hosted on GitHub (public URL for Hybiscus API access)
const MKEDEV_LOGO_URL =
  "https://raw.githubusercontent.com/tmoody1973/mkedev/main/apps/web/public/mkedev-logo.svg";

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
 * Note: Hybiscus "Card" is for KPIs (title+value), so we use Section/Text for content.
 */
function buildCardComponents(card: CardData): HybiscusComponent[] {
  const { type, data } = card;
  const components: HybiscusComponent[] = [];

  switch (type) {
    case "zone-info": {
      let zoneText = `**District:** ${data.zoningDistrict || "Unknown"}\n`;
      if (data.zoningCategory) zoneText += `**Category:** ${data.zoningCategory}\n`;
      if (data.zoningType) zoneText += `**Type:** ${data.zoningType}\n`;
      if (data.overlayZones && Array.isArray(data.overlayZones) && data.overlayZones.length > 0) {
        zoneText += `**Overlay Zones:** ${(data.overlayZones as string[]).join(", ")}\n`;
      }
      components.push({
        type: "Section",
        options: {
          section_title: "Zoning Information",
          icon: "map-pin",
          highlighted: true,
        },
        components: [{
          type: "Text",
          options: { text: zoneText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "parcel-info": {
      let parcelText = `**Address:** ${data.address || "Unknown"}\n`;
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
        type: "Section",
        options: {
          section_title: "Property Details",
          icon: "building",
          highlighted: true,
        },
        components: [{
          type: "Text",
          options: { text: parcelText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "code-citation": {
      let citationText = "";
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
        type: "Section",
        options: {
          section_title: "Zoning Code Reference",
          icon: "book",
          highlighted: true,
        },
        components: [{
          type: "Text",
          options: { text: citationText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "area-plan-context": {
      let areaText = "";
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
        type: "Section",
        options: {
          section_title: "Area Plan Information",
          icon: "file-text",
          highlighted: true,
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
      let homeText = "";
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

      const sectionComponents: HybiscusComponent[] = [];

      // If we have an image, add it first
      if (data.primaryImageUrl) {
        sectionComponents.push({
          type: "Image",
          options: {
            image_url: data.primaryImageUrl as string,
            width: "1/2",
            rounded: true,
            caption: data.address as string || "Property Photo",
          },
        });
      }

      sectionComponents.push({
        type: "Text",
        options: { text: homeText, markdown_format: true, size: "sm" },
      });

      // Add additional images if available
      if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 1) {
        const additionalImages = (data.imageUrls as string[]).slice(1, 4);
        for (const url of additionalImages) {
          sectionComponents.push({
            type: "Image",
            options: {
              image_url: url,
              width: "1/4",
              rounded: true,
            },
          });
        }
      }

      components.push({
        type: "Section",
        options: {
          section_title: data.address as string || "Property Listing",
          icon: "home",
          highlighted: true,
        },
        components: sectionComponents,
      });
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

      // Build a list of all homes as text
      let listText = "";
      for (const home of homes) {
        listText += `**${home.address || "Unknown Address"}**\n`;
        if (home.neighborhood) listText += `${home.neighborhood}\n`;
        const features: string[] = [];
        if (home.bedrooms !== undefined) features.push(`${home.bedrooms} bed`);
        if (home.fullBaths !== undefined) features.push(`${home.fullBaths} bath`);
        if (features.length > 0) listText += features.join(" • ") + "\n";
        listText += "\n";
      }

      const sectionComponents: HybiscusComponent[] = [];

      // Add images for homes that have them (max 4)
      const homesWithImages = homes.filter(h => h.primaryImageUrl).slice(0, 4);
      if (homesWithImages.length > 0) {
        for (const home of homesWithImages) {
          sectionComponents.push({
            type: "Image",
            options: {
              image_url: home.primaryImageUrl!,
              width: "1/4",
              rounded: true,
              caption: home.address || "Home",
            },
          });
        }
      }

      sectionComponents.push({
        type: "Text",
        options: { text: listText, markdown_format: true, size: "sm" },
      });

      components.push({
        type: "Section",
        options: {
          section_title: `Available Homes (${homes.length} listings)`,
          icon: "home",
          highlighted: true,
        },
        components: sectionComponents,
      });
      break;
    }

    case "parcel-analysis": {
      let analysisText = "";
      if (data.requiredSpaces !== undefined) analysisText += `**Required Spaces:** ${data.requiredSpaces}\n`;
      if (data.calculation) analysisText += `**Calculation:** ${data.calculation}\n`;
      if (data.codeReference) analysisText += `**Code Reference:** ${data.codeReference}\n`;
      if (data.isReducedDistrict) analysisText += `\n_Note: Property is in a reduced parking district._\n`;
      components.push({
        type: "Section",
        options: {
          section_title: "Parking Analysis",
          icon: "car",
          highlighted: true,
        },
        components: [{
          type: "Text",
          options: { text: analysisText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "commercial-property": {
      let propText = `**Address:** ${data.address || "Unknown"}\n`;
      if (data.propertyType) propText += `**Type:** ${data.propertyType}\n`;
      if (data.zoning) propText += `**Zoning:** ${data.zoning}\n`;
      if (data.buildingSqFt) propText += `**Building Size:** ${(data.buildingSqFt as number).toLocaleString()} sq ft\n`;
      if (data.lotSizeSqFt) propText += `**Lot Size:** ${(data.lotSizeSqFt as number).toLocaleString()} sq ft\n`;
      if (data.askingPrice) {
        const price = data.askingPrice as number;
        propText += `**Asking Price:** $${price >= 1000000 ? (price / 1000000).toFixed(1) + "M" : (price / 1000).toFixed(0) + "K"}\n`;
      }
      if (data.description) propText += `\n${data.description}\n`;
      if (data.listingUrl) propText += `\n[View Listing Details](${data.listingUrl})\n`;

      components.push({
        type: "Section",
        options: {
          section_title: data.address as string || "Commercial Property",
          icon: "building",
          highlighted: true,
        },
        components: [{
          type: "Text",
          options: { text: propText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "commercial-properties-list": {
      if (!data.properties || !Array.isArray(data.properties)) break;
      const properties = data.properties as Array<{
        id?: string;
        address?: string;
        propertyType?: string;
        buildingSqFt?: number;
        askingPrice?: number;
      }>;

      let listText = "";
      for (const prop of properties) {
        listText += `**${prop.address || "Unknown Address"}**\n`;
        if (prop.propertyType) listText += `Type: ${prop.propertyType}\n`;
        const details: string[] = [];
        if (prop.buildingSqFt) details.push(`${prop.buildingSqFt.toLocaleString()} sq ft`);
        if (prop.askingPrice) {
          const price = prop.askingPrice;
          details.push(`$${price >= 1000000 ? (price / 1000000).toFixed(1) + "M" : (price / 1000).toFixed(0) + "K"}`);
        }
        if (details.length > 0) listText += details.join(" • ") + "\n";
        listText += "\n";
      }

      components.push({
        type: "Section",
        options: {
          section_title: `Commercial Properties (${properties.length} listings)`,
          icon: "building",
          highlighted: true,
        },
        components: [{
          type: "Text",
          options: { text: listText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "development-site": {
      let siteText = `**Address:** ${data.address || "Unknown"}\n`;
      if (data.siteName) siteText += `**Site Name:** ${data.siteName}\n`;
      if (data.zoning) siteText += `**Zoning:** ${data.zoning}\n`;
      if (data.lotSizeSqFt) {
        const sqft = data.lotSizeSqFt as number;
        if (sqft >= 43560) {
          siteText += `**Lot Size:** ${(sqft / 43560).toFixed(2)} acres\n`;
        } else {
          siteText += `**Lot Size:** ${sqft.toLocaleString()} sq ft\n`;
        }
      }
      if (data.askingPrice) {
        const price = data.askingPrice as number;
        siteText += `**Asking Price:** $${price >= 1000000 ? (price / 1000000).toFixed(1) + "M" : (price / 1000).toFixed(0) + "K"}\n`;
      }
      if (data.currentUse) siteText += `**Current Use:** ${data.currentUse}\n`;
      if (data.proposedUse) siteText += `**Proposed Use:** ${data.proposedUse}\n`;
      if (data.incentives && Array.isArray(data.incentives) && data.incentives.length > 0) {
        siteText += `**Incentives:** ${(data.incentives as string[]).join(", ")}\n`;
      }
      if (data.description) siteText += `\n${data.description}\n`;
      if (data.listingUrl) siteText += `\n[View Listing Details](${data.listingUrl})\n`;

      components.push({
        type: "Section",
        options: {
          section_title: (data.siteName as string) || (data.address as string) || "Development Site",
          icon: "construction",
          highlighted: true,
        },
        components: [{
          type: "Text",
          options: { text: siteText, markdown_format: true, size: "sm" },
        }],
      });
      break;
    }

    case "development-sites-list": {
      if (!data.sites || !Array.isArray(data.sites)) break;
      const sites = data.sites as Array<{
        id?: string;
        address?: string;
        siteName?: string;
        lotSizeSqFt?: number;
        askingPrice?: number;
        incentives?: string[];
      }>;

      let listText = "";
      for (const site of sites) {
        listText += `**${site.siteName || site.address || "Unknown Site"}**\n`;
        if (site.siteName && site.address) listText += `${site.address}\n`;
        const details: string[] = [];
        if (site.lotSizeSqFt) {
          if (site.lotSizeSqFt >= 43560) {
            details.push(`${(site.lotSizeSqFt / 43560).toFixed(2)} acres`);
          } else {
            details.push(`${site.lotSizeSqFt.toLocaleString()} sq ft`);
          }
        }
        if (site.askingPrice) {
          const price = site.askingPrice;
          details.push(`$${price >= 1000000 ? (price / 1000000).toFixed(1) + "M" : (price / 1000).toFixed(0) + "K"}`);
        }
        if (details.length > 0) listText += details.join(" • ") + "\n";
        if (site.incentives && site.incentives.length > 0) {
          listText += `Incentives: ${site.incentives.join(", ")}\n`;
        }
        listText += "\n";
      }

      components.push({
        type: "Section",
        options: {
          section_title: `Development Sites (${sites.length} opportunities)`,
          icon: "construction",
          highlighted: true,
        },
        components: [{
          type: "Text",
          options: { text: listText, markdown_format: true, size: "sm" },
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
        // Logo header
        {
          type: "Image",
          options: {
            image_url: MKEDEV_LOGO_URL,
            width: "1/4",
            align: "center",
          },
        },
        {
          type: "VerticalSpacer",
          options: {
            space: 2,
          },
        },
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
