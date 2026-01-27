'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { GenerativeCard } from '@/components/chat/ChatPanel';

/**
 * Tool result from the agent for generative UI rendering.
 */
export interface ToolResult {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: number;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  cards?: GenerativeCard[];
  /** Raw citations from RAG tool results */
  citations?: Array<{ sourceId: string; sourceName: string; excerpt: string }>;
}

/**
 * Agent status for real-time activity display.
 */
export interface AgentStatus {
  status: 'idle' | 'thinking' | 'executing_tool' | 'generating_response' | 'complete' | 'error';
  currentTool?: string;
  currentToolArgs?: Record<string, unknown>;
  toolsCompleted: Array<{ name: string; success: boolean; timestamp: number }>;
  statusMessage?: string;
  error?: string;
}

export interface UseZoningAgentReturn {
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
  agentStatus: AgentStatus | null;
  isStreaming: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Map tool results to GenerativeCard format for UI rendering.
 * Combines geocode + zoning into rich ParcelCard when both are available.
 */
function mapToolResultsToCards(toolResults: ToolResult[]): GenerativeCard[] {
  const cards: GenerativeCard[] = [];

  // Debug: Log incoming tool results
  console.log('[mapToolResultsToCards] Received tool results:', toolResults.map(t => ({ name: t.name, resultKeys: Object.keys(t.result || {}) })));

  // Extract data from each tool result
  let geocodeData: {
    formattedAddress?: string;
    coordinates?: { latitude: number; longitude: number };
  } | null = null;

  let zoningData: {
    zoningDistrict?: string;
    zoningCategory?: string;
    zoningType?: string;
    overlayZones?: string[];
  } | null = null;

  let areaPlanData: {
    answer?: string;
    citations?: Array<{ sourceId?: string; sourceName?: string; excerpt?: string; sectionReference?: string; pageNumber?: number }>;
  } | null = null;

  let parkingData: {
    requiredSpaces?: number;
    calculation?: string;
    codeReference?: string;
    isReducedDistrict?: boolean;
  } | null = null;

  // First pass: collect data from all tools
  for (const tool of toolResults) {
    const { name, result } = tool;

    if (!result || (result as { success?: boolean }).success === false) {
      continue;
    }

    switch (name) {
      case 'geocode_address': {
        const r = result as {
          formattedAddress?: string;
          coordinates?: { latitude: number; longitude: number };
        };
        geocodeData = {
          formattedAddress: r.formattedAddress,
          coordinates: r.coordinates,
        };
        break;
      }

      case 'query_zoning_at_point': {
        const r = result as {
          zoningDistrict?: string;
          zoningCategory?: string;
          zoningType?: string;
          overlayZones?: string[];
        };
        zoningData = {
          zoningDistrict: r.zoningDistrict,
          zoningCategory: r.zoningCategory,
          zoningType: r.zoningType,
          overlayZones: r.overlayZones,
        };
        break;
      }

      case 'query_area_plans': {
        const r = result as {
          answer?: string;
          citations?: Array<{ sourceId?: string; sourceName?: string; excerpt?: string; sectionReference?: string; pageNumber?: number }>;
        };
        if (r.answer) {
          areaPlanData = {
            answer: r.answer,
            citations: r.citations,
          };
        }
        break;
      }

      case 'calculate_parking': {
        const r = result as {
          requiredSpaces?: number;
          calculation?: string;
          codeReference?: string;
          isReducedDistrict?: boolean;
        };
        parkingData = {
          requiredSpaces: r.requiredSpaces,
          calculation: r.calculation,
          codeReference: r.codeReference,
          isReducedDistrict: r.isReducedDistrict,
        };
        break;
      }

      case 'query_zoning_code': {
        const r = result as {
          answer?: string;
          confidence?: number;
          citations?: Array<{ sourceId?: string; sourceName?: string; excerpt?: string; sectionReference?: string; pageNumber?: number }>;
        };
        if (r.answer) {
          cards.push({
            type: 'code-citation',
            data: {
              answer: r.answer,
              confidence: r.confidence,
              citations: r.citations,
            },
          });
        }
        break;
      }

      // ========================================================================
      // Homes MKE Tools - Convert to generative UI cards
      // ========================================================================

      case 'search_homes_for_sale': {
        const r = result as {
          success?: boolean;
          homes?: Array<{
            homeId: string;
            address: string;
            neighborhood: string;
            coordinates?: [number, number];
            bedrooms: number;
            fullBaths: number;
            halfBaths: number;
          }>;
        };
        if (r.success && r.homes && r.homes.length > 0) {
          cards.push({
            type: 'homes-list',
            data: {
              homes: r.homes.map((h) => ({
                id: h.homeId,
                address: h.address,
                neighborhood: h.neighborhood,
                coordinates: h.coordinates || [-87.9065, 43.0389], // Default Milwaukee center
                bedrooms: h.bedrooms,
                fullBaths: h.fullBaths,
                halfBaths: h.halfBaths,
              })),
            },
          });
        }
        break;
      }

      case 'get_home_details': {
        const r = result as {
          success?: boolean;
          home?: {
            homeId: string;
            address: string;
            neighborhood: string;
            districtName?: string;
            coordinates?: [number, number];
            bedrooms: number;
            fullBaths: number;
            halfBaths: number;
            buildingSqFt: number;
            lotSizeSqFt?: number;
            yearBuilt: number;
            numberOfUnits?: number;
            hasOutbuildings?: boolean;
            narrative?: string;
            listingUrl?: string;
            developerName?: string;
            primaryImageUrl?: string;
            imageUrls?: string[];
          };
        };
        if (r.success && r.home) {
          cards.push({
            type: 'home-listing',
            data: {
              address: r.home.address,
              neighborhood: r.home.neighborhood,
              districtName: r.home.districtName,
              coordinates: r.home.coordinates,
              bedrooms: r.home.bedrooms,
              fullBaths: r.home.fullBaths,
              halfBaths: r.home.halfBaths,
              buildingSqFt: r.home.buildingSqFt,
              lotSizeSqFt: r.home.lotSizeSqFt,
              yearBuilt: r.home.yearBuilt,
              numberOfUnits: r.home.numberOfUnits,
              hasOutbuildings: r.home.hasOutbuildings,
              narrative: r.home.narrative,
              listingUrl: r.home.listingUrl,
              developerName: r.home.developerName,
              primaryImageUrl: r.home.primaryImageUrl,
              imageUrls: r.home.imageUrls,
            },
          });
        }
        break;
      }

      // ========================================================================
      // Commercial Properties Tools - Convert to generative UI cards
      // ========================================================================

      case 'search_commercial_properties': {
        const r = result as {
          success?: boolean;
          count?: number;
          properties?: Array<{
            propertyId: string;
            address: string;
            propertyType?: string;
            buildingSqFt?: number;
            askingPrice?: number;
            coordinates?: [number, number];
          }>;
        };
        if (r.success && r.properties && r.properties.length > 0) {
          cards.push({
            type: 'commercial-properties-list',
            data: {
              properties: r.properties.map((p) => ({
                id: p.propertyId,
                address: p.address,
                propertyType: p.propertyType || 'Commercial',
                buildingSqFt: p.buildingSqFt,
                askingPrice: p.askingPrice,
                coordinates: p.coordinates || [-87.9065, 43.0389],
              })),
            },
          });
        }
        break;
      }

      case 'get_commercial_property_details': {
        const r = result as {
          success?: boolean;
          property?: {
            propertyId: string;
            address: string;
            propertyType?: string;
            buildingSqFt?: number;
            lotSizeSqFt?: number;
            askingPrice?: number;
            zoning?: string;
            description?: string;
            listingUrl?: string;
            propertyImageUrl?: string;
            coordinates?: [number, number];
          };
        };
        if (r.success && r.property) {
          cards.push({
            type: 'commercial-property',
            data: {
              address: r.property.address,
              propertyType: r.property.propertyType,
              buildingSqFt: r.property.buildingSqFt,
              lotSizeSqFt: r.property.lotSizeSqFt,
              askingPrice: r.property.askingPrice,
              zoning: r.property.zoning,
              description: r.property.description,
              listingUrl: r.property.listingUrl,
              propertyImageUrl: r.property.propertyImageUrl,
              coordinates: r.property.coordinates,
            },
          });
        }
        break;
      }

      // ========================================================================
      // Development Sites Tools - Convert to generative UI cards
      // ========================================================================

      case 'search_development_sites': {
        console.log('[mapToolResultsToCards] Processing search_development_sites, result:', result);
        const r = result as {
          success?: boolean;
          count?: number;
          sites?: Array<{
            siteId: string;
            address: string;
            siteName?: string;
            lotSizeSqFt?: number;
            askingPrice?: number;
            incentives?: string[];
            coordinates?: [number, number];
          }>;
        };
        console.log('[mapToolResultsToCards] search_development_sites parsed:', { success: r.success, sitesCount: r.sites?.length });
        if (r.success && r.sites && r.sites.length > 0) {
          console.log('[mapToolResultsToCards] Adding development-sites-list card');
          cards.push({
            type: 'development-sites-list',
            data: {
              sites: r.sites.map((s) => ({
                id: s.siteId,
                address: s.address,
                siteName: s.siteName,
                lotSizeSqFt: s.lotSizeSqFt,
                askingPrice: s.askingPrice,
                incentives: s.incentives || [],
                coordinates: s.coordinates || [-87.9065, 43.0389],
              })),
            },
          });
        }
        break;
      }

      case 'get_development_site_details': {
        const r = result as {
          success?: boolean;
          site?: {
            siteId: string;
            address: string;
            siteName?: string;
            lotSizeSqFt?: number;
            askingPrice?: number;
            zoning?: string;
            incentives?: string[];
            proposedUse?: string;
            description?: string;
            listingUrl?: string;
            propertyImageUrl?: string;
            coordinates?: [number, number];
          };
        };
        if (r.success && r.site) {
          cards.push({
            type: 'development-site',
            data: {
              address: r.site.address,
              siteName: r.site.siteName,
              lotSizeSqFt: r.site.lotSizeSqFt,
              askingPrice: r.site.askingPrice,
              zoning: r.site.zoning,
              incentives: r.site.incentives || [],
              proposedUse: r.site.proposedUse,
              description: r.site.description,
              listingUrl: r.site.listingUrl,
              propertyImageUrl: r.site.propertyImageUrl,
              coordinates: r.site.coordinates,
            },
          });
        }
        break;
      }

      // ========================================================================
      // Permit Forms & Design Guidelines Tools
      // ========================================================================

      case 'search_permit_forms': {
        const r = result as {
          success?: boolean;
          forms?: Array<{
            id: string;
            name: string;
            purpose: string;
            url: string;
            projectTypes?: string[];
            estimatedTime?: string;
          }>;
          count?: number;
        };
        if (r.success && r.forms && r.forms.length > 0) {
          cards.push({
            type: 'permit-forms-list',
            data: {
              forms: r.forms.map((f) => ({
                id: f.id,
                name: f.name,
                purpose: f.purpose,
                url: f.url,
                projectTypes: f.projectTypes,
                estimatedTime: f.estimatedTime,
              })),
            },
          });
        }
        break;
      }

      case 'recommend_permits_for_project': {
        const r = result as {
          success?: boolean;
          required?: Array<{ id: string; name: string; purpose: string; url: string }>;
          recommended?: Array<{ id: string; name: string; purpose: string; url: string }>;
          optional?: Array<{ id: string; name: string; purpose: string; url: string }>;
        };
        if (r.success) {
          cards.push({
            type: 'permit-recommendations',
            data: {
              required: r.required || [],
              recommended: r.recommended || [],
              optional: r.optional || [],
            },
          });
        }
        break;
      }

      case 'get_permit_form_details': {
        const r = result as {
          success?: boolean;
          form?: {
            id: string;
            name: string;
            purpose: string;
            whenRequired: string[];
            prerequisites: string[];
            estimatedTime: string;
            submissionMethods: string[];
            fees: string | null;
            fields: Array<{
              name: string;
              type: string;
              required: boolean;
              description: string;
              autoFillable: boolean;
            }>;
            url: string;
          };
        };
        if (r.success && r.form) {
          cards.push({
            type: 'permit-form-details',
            data: r.form,
          });
        }
        break;
      }

      case 'search_design_guidelines': {
        const r = result as {
          success?: boolean;
          guidelines?: Array<{
            id: string;
            title: string;
            topic: string;
            summary: string;
            url: string;
            requirementsCount?: number;
          }>;
          count?: number;
        };
        if (r.success && r.guidelines && r.guidelines.length > 0) {
          cards.push({
            type: 'design-guidelines-list',
            data: {
              guidelines: r.guidelines,
            },
          });
        }
        break;
      }

      case 'get_guideline_details': {
        const r = result as {
          success?: boolean;
          guideline?: {
            id: string;
            title: string;
            topic: string;
            summary: string;
            applicableZoning: string[];
            requirements: Array<{
              rule: string;
              isRequired: boolean;
              codeReference?: string;
            }>;
            bestPractices: string[];
            relatedTopics: string[];
            url: string;
          };
        };
        if (r.success && r.guideline) {
          cards.push({
            type: 'design-guideline-details',
            data: r.guideline,
          });
        }
        break;
      }
    }
  }

  // Create rich ParcelCard if we have geocode + zoning data
  if (geocodeData && zoningData) {
    // Extract area plan name from citations if available
    const areaPlanName = areaPlanData?.citations?.[0]?.sourceName;

    cards.unshift({
      type: 'parcel-info',
      data: {
        address: geocodeData.formattedAddress?.split(',')[0] || 'Unknown Address',
        coordinates: geocodeData.coordinates,
        zoningDistrict: zoningData.zoningDistrict,
        zoningCategory: zoningData.zoningCategory,
        zoningType: zoningData.zoningType,
        overlayZones: zoningData.overlayZones,
        areaPlanName: areaPlanName,
        areaPlanContext: areaPlanData?.answer?.substring(0, 300) + (areaPlanData?.answer && areaPlanData.answer.length > 300 ? '...' : ''),
        parkingRequired: parkingData?.requiredSpaces ? `${parkingData.requiredSpaces} spaces` : undefined,
      },
    });
  } else if (zoningData) {
    // Fallback to simple zone-info card if no geocode
    cards.push({
      type: 'zone-info',
      data: {
        zoningDistrict: zoningData.zoningDistrict || 'Unknown',
        zoningCategory: zoningData.zoningCategory,
        overlayZones: zoningData.overlayZones,
      },
    });
  }

  // Add parking card separately if we have detailed parking data
  if (parkingData && parkingData.calculation) {
    cards.push({
      type: 'parcel-analysis',
      data: parkingData,
    });
  }

  // Add area plan citation card if we have area plan data with citations
  if (areaPlanData && areaPlanData.citations && areaPlanData.citations.length > 0) {
    cards.push({
      type: 'area-plan-context',
      data: {
        answer: areaPlanData.answer,
        citations: areaPlanData.citations,
        confidence: 0.7, // Default confidence for area plans
      },
    });
  }

  return cards;
}

/**
 * Extract citations from RAG tool results.
 */
function extractCitationsFromToolResults(
  toolResults: ToolResult[]
): Array<{ sourceId: string; sourceName: string; excerpt: string }> {
  const citations: Array<{ sourceId: string; sourceName: string; excerpt: string }> = [];
  const seen = new Set<string>();

  for (const tool of toolResults) {
    const { name, result } = tool;

    // Extract citations from RAG tools
    if (name === 'query_zoning_code' || name === 'query_area_plans') {
      const toolCitations = (result as { citations?: Array<{ sourceId?: string; sourceName?: string; excerpt?: string; sectionReference?: string; pageNumber?: number }> }).citations;

      if (toolCitations && Array.isArray(toolCitations)) {
        for (const citation of toolCitations) {
          const sourceName = citation.sourceName || citation.sourceId || 'Unknown Source';
          if (!seen.has(sourceName)) {
            seen.add(sourceName);
            citations.push({
              sourceId: citation.sourceId || sourceName,
              sourceName: sourceName,
              excerpt: citation.excerpt || '',
            });
          }
        }
      }
    }
  }

  return citations;
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook for interacting with the Zoning Interpreter Agent.
 *
 * Manages conversation state and sends messages to the Convex agent action.
 * Subscribes to real-time status updates for displaying agent activity.
 */
export function useZoningAgent(): UseZoningAgentReturn {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const chatAction = useAction(api.agents.zoning.chat);

  // Subscribe to agent status updates
  const statusResult = useQuery(
    api.agents.status.getSessionStatus,
    currentSessionId ? { sessionId: currentSessionId } : 'skip'
  );

  // Track if we're in an active session
  const isActiveSession = currentSessionId !== null && isLoading;

  // Convert status result to AgentStatus type
  const agentStatus: AgentStatus | null = isActiveSession && statusResult
    ? {
        status: statusResult.status,
        currentTool: statusResult.currentTool,
        currentToolArgs: statusResult.currentToolArgs as Record<string, unknown> | undefined,
        toolsCompleted: statusResult.toolsCompleted,
        statusMessage: statusResult.statusMessage,
        error: statusResult.error,
      }
    : null;

  // Cleanup streaming interval on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  /**
   * Send a message to the agent and get a response.
   */
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setError(null);
      setIsLoading(true);

      // Generate a new session ID for this conversation turn
      const sessionId = generateSessionId();
      setCurrentSessionId(sessionId);

      // Add user message
      const userMessage: AgentMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // Build conversation history for context
        // Convert 'assistant' role to 'model' for Gemini API
        const conversationHistory = messages.map((msg) => ({
          role: (msg.role === 'assistant' ? 'model' : msg.role) as 'user' | 'model',
          content: msg.content,
        }));

        // Call the agent with session ID for status tracking
        const result = await chatAction({
          message,
          sessionId,
          conversationHistory,
        });

        // Map tool results to generative UI cards
        const toolResultsList = result.toolResults as ToolResult[] | undefined;
        console.log('[useZoningAgent] toolResultsList:', toolResultsList?.length || 0, 'results');
        const cards = toolResultsList
          ? mapToolResultsToCards(toolResultsList)
          : [];
        console.log('[useZoningAgent] Generated cards:', cards.length, cards.map(c => c.type));

        // Extract citations from RAG tool results
        const citations = toolResultsList
          ? extractCitationsFromToolResults(toolResultsList)
          : [];

        // Start streaming the response text
        const fullResponse = result.response;
        const messageId = `assistant-${Date.now()}`;

        // Add message with empty content initially
        const assistantMessage: AgentMessage = {
          id: messageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          toolsUsed: result.toolsUsed,
          cards: cards.length > 0 ? cards : undefined,
          citations: citations.length > 0 ? citations : undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(true);

        // Stream the response word by word
        const words = fullResponse.split(' ');
        let currentIndex = 0;
        const wordsPerTick = 3; // Show 3 words at a time for faster streaming

        streamingIntervalRef.current = setInterval(() => {
          if (currentIndex >= words.length) {
            // Streaming complete
            if (streamingIntervalRef.current) {
              clearInterval(streamingIntervalRef.current);
              streamingIntervalRef.current = null;
            }
            setIsStreaming(false);
            return;
          }

          // Add next batch of words
          const endIndex = Math.min(currentIndex + wordsPerTick, words.length);
          const newContent = words.slice(0, endIndex).join(' ');

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, content: newContent } : msg
            )
          );

          currentIndex = endIndex;
        }, 30); // 30ms between ticks for smooth streaming
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);

        // Add error message to chat
        const errorResponse: AgentMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
        // Keep session ID for a moment to show final status, then clear
        setTimeout(() => {
          setCurrentSessionId(null);
        }, 1000);
      }
    },
    [chatAction, messages]
  );

  /**
   * Clear all messages.
   */
  const clearMessages = useCallback(() => {
    // Cancel any ongoing streaming
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setMessages([]);
    setError(null);
    setCurrentSessionId(null);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    agentStatus,
    isStreaming,
    sendMessage,
    clearMessages,
  };
}
