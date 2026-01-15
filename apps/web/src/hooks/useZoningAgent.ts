'use client';

import { useState, useCallback } from 'react';
import { useAction } from 'convex/react';
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
}

export interface UseZoningAgentReturn {
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Map tool results to GenerativeCard format for UI rendering.
 */
function mapToolResultsToCards(toolResults: ToolResult[]): GenerativeCard[] {
  const cards: GenerativeCard[] = [];

  for (const tool of toolResults) {
    const { name, result } = tool;

    // Skip failed tool calls
    if (!result || (result as { success?: boolean }).success === false) {
      continue;
    }

    switch (name) {
      case 'query_zoning_at_point':
        cards.push({
          type: 'zone-info',
          data: {
            zoningDistrict: (result as { zoningDistrict?: string }).zoningDistrict || 'Unknown',
            zoningDescription: (result as { zoningDescription?: string }).zoningDescription,
            zoningCategory: (result as { zoningCategory?: string }).zoningCategory,
            overlayZones: (result as { overlayZones?: string[] }).overlayZones,
          },
        });
        break;

      case 'calculate_parking':
        cards.push({
          type: 'parcel-analysis',
          data: {
            requiredSpaces: (result as { requiredSpaces?: number }).requiredSpaces,
            calculation: (result as { calculation?: string }).calculation,
            codeReference: (result as { codeReference?: string }).codeReference,
            isReducedDistrict: (result as { isReducedDistrict?: boolean }).isReducedDistrict,
          },
        });
        break;

      case 'query_area_plans':
        if ((result as { answer?: string }).answer) {
          cards.push({
            type: 'area-plan-context',
            data: {
              answer: (result as { answer?: string }).answer,
              confidence: (result as { confidence?: number }).confidence,
              citations: (result as { citations?: unknown[] }).citations,
            },
          });
        }
        break;

      case 'query_zoning_code':
        if ((result as { answer?: string }).answer) {
          cards.push({
            type: 'code-citation',
            data: {
              answer: (result as { answer?: string }).answer,
              confidence: (result as { confidence?: number }).confidence,
              citations: (result as { citations?: unknown[] }).citations,
            },
          });
        }
        break;

      // geocode_address doesn't need a card - it's just a helper tool
      default:
        break;
    }
  }

  return cards;
}

/**
 * Hook for interacting with the Zoning Interpreter Agent.
 *
 * Manages conversation state and sends messages to the Convex agent action.
 */
export function useZoningAgent(): UseZoningAgentReturn {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatAction = useAction(api.agents.zoning.chat);

  /**
   * Send a message to the agent and get a response.
   */
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setError(null);
      setIsLoading(true);

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

        // Call the agent
        const result = await chatAction({
          message,
          conversationHistory,
        });

        // Map tool results to generative UI cards
        const cards = result.toolResults
          ? mapToolResultsToCards(result.toolResults as ToolResult[])
          : [];

        // Add assistant response with cards
        const assistantMessage: AgentMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
          toolsUsed: result.toolsUsed,
          cards: cards.length > 0 ? cards : undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);
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
      }
    },
    [chatAction, messages]
  );

  /**
   * Clear all messages.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
