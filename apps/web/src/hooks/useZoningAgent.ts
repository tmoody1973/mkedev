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
    citations?: Array<{ sourceName?: string }>;
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
          citations?: Array<{ sourceName?: string }>;
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
          citations?: Array<{ sourceName?: string }>;
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
      const toolCitations = (result as { citations?: Array<{ sourceId?: string; sourceName?: string; excerpt?: string }> }).citations;

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
        const cards = toolResultsList
          ? mapToolResultsToCards(toolResultsList)
          : [];

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
