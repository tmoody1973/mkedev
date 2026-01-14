'use client';

import { useState, useCallback } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/../convex/_generated/api';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
}

export interface UseZoningAgentReturn {
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
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
        const conversationHistory = messages.map((msg) => ({
          role: msg.role as 'user' | 'model',
          content: msg.content,
        }));

        // Call the agent
        const result = await chatAction({
          message,
          conversationHistory,
        });

        // Add assistant response
        const assistantMessage: AgentMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
          toolsUsed: result.toolsUsed,
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
