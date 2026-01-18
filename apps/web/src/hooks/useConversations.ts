'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import type { GenerativeCard } from '@/components/chat/ChatPanel';

/**
 * Conversation from Convex with enriched data.
 */
export interface Conversation {
  _id: Id<"conversations">;
  userId: string;
  title: string;
  starred: boolean;
  createdAt: number;
  updatedAt: number;
  messageCount?: number;
  lastMessage?: string | null;
  lastMessageAt?: number;
}

/**
 * Message from Convex.
 */
export interface ConversationMessage {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  inputMode?: 'text' | 'voice';
  cards?: GenerativeCard[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Conversation with messages.
 */
export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

export interface UseConversationsReturn {
  // Conversation list
  conversations: Conversation[];
  isLoadingList: boolean;

  // Current conversation
  currentConversation: ConversationWithMessages | null;
  currentConversationId: Id<"conversations"> | null;
  isLoadingConversation: boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Conversation[];
  isSearching: boolean;

  // Actions
  createConversation: () => Promise<Id<"conversations">>;
  selectConversation: (id: Id<"conversations"> | null) => void;
  addMessage: (
    role: 'user' | 'assistant',
    content: string,
    options?: {
      inputMode?: 'text' | 'voice';
      cards?: GenerativeCard[];
    }
  ) => Promise<Id<"messages"> | null>;
  updateTitle: (title: string) => Promise<void>;
  toggleStarred: () => Promise<void>;
  deleteConversation: (id?: Id<"conversations">) => Promise<void>;

  // New conversation helper
  startNewConversation: () => void;
}

/**
 * Hook for managing persistent conversation history.
 * Integrates with Convex for storage and provides search functionality.
 */
export function useConversations(): UseConversationsReturn {
  const [currentConversationId, setCurrentConversationId] = useState<Id<"conversations"> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Queries
  const conversationsList = useQuery(api.conversations.listForUser, { limit: 50 });
  const currentConversationData = useQuery(
    api.conversations.getWithMessages,
    currentConversationId ? { conversationId: currentConversationId } : 'skip'
  );
  const searchResultsData = useQuery(
    api.conversations.search,
    searchQuery.length >= 2 ? { searchQuery, limit: 20 } : 'skip'
  );

  // Mutations
  const createConversationMutation = useMutation(api.conversations.create);
  const addMessageMutation = useMutation(api.conversations.addMessage);
  const updateTitleMutation = useMutation(api.conversations.updateTitle);
  const toggleStarredMutation = useMutation(api.conversations.toggleStarred);
  const deleteConversationMutation = useMutation(api.conversations.remove);

  // Track search state
  useEffect(() => {
    setIsSearching(searchQuery.length >= 2);
  }, [searchQuery]);

  /**
   * Create a new conversation.
   */
  const createConversation = useCallback(async (): Promise<Id<"conversations">> => {
    const id = await createConversationMutation({});
    setCurrentConversationId(id);
    return id;
  }, [createConversationMutation]);

  /**
   * Select a conversation to view.
   */
  const selectConversation = useCallback((id: Id<"conversations"> | null) => {
    setCurrentConversationId(id);
    setSearchQuery(''); // Clear search when selecting
  }, []);

  /**
   * Add a message to the current conversation.
   * Creates a new conversation if none is selected.
   */
  const addMessage = useCallback(
    async (
      role: 'user' | 'assistant',
      content: string,
      options?: {
        inputMode?: 'text' | 'voice';
        cards?: GenerativeCard[];
      }
    ): Promise<Id<"messages"> | null> => {
      let conversationId = currentConversationId;

      // Create conversation if needed
      if (!conversationId) {
        conversationId = await createConversationMutation({});
        setCurrentConversationId(conversationId);
      }

      // Add the message
      const messageId = await addMessageMutation({
        conversationId,
        role,
        content,
        inputMode: options?.inputMode,
        cards: options?.cards?.map(card => ({
          type: card.type as
            | "zone-info"
            | "parcel-info"
            | "parcel-analysis"
            | "incentives-summary"
            | "area-plan-context"
            | "permit-process"
            | "code-citation"
            | "opportunity-list"
            | "home-listing"
            | "homes-list"
            | "commercial-property"
            | "commercial-properties-list"
            | "development-site"
            | "development-sites-list",
          data: card.data,
        })),
      });

      return messageId;
    },
    [currentConversationId, createConversationMutation, addMessageMutation]
  );

  /**
   * Update the current conversation's title.
   */
  const updateTitle = useCallback(
    async (title: string): Promise<void> => {
      if (!currentConversationId) return;
      await updateTitleMutation({ conversationId: currentConversationId, title });
    },
    [currentConversationId, updateTitleMutation]
  );

  /**
   * Toggle starred status on current conversation.
   */
  const toggleStarred = useCallback(async (): Promise<void> => {
    if (!currentConversationId) return;
    await toggleStarredMutation({ conversationId: currentConversationId });
  }, [currentConversationId, toggleStarredMutation]);

  /**
   * Delete a conversation by ID, or the current conversation if no ID provided.
   */
  const deleteConversation = useCallback(async (id?: Id<"conversations">): Promise<void> => {
    const targetId = id ?? currentConversationId;
    if (!targetId) return;
    await deleteConversationMutation({ conversationId: targetId });
    // Clear selection if we deleted the current conversation
    if (targetId === currentConversationId) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId, deleteConversationMutation]);

  /**
   * Start a new conversation (clears current selection).
   */
  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setSearchQuery('');
  }, []);

  return {
    // Conversation list
    conversations: (conversationsList ?? []) as Conversation[],
    isLoadingList: conversationsList === undefined,

    // Current conversation
    currentConversation: currentConversationData as ConversationWithMessages | null,
    currentConversationId,
    isLoadingConversation: currentConversationId !== null && currentConversationData === undefined,

    // Search
    searchQuery,
    setSearchQuery,
    searchResults: (searchResultsData ?? []) as Conversation[],
    isSearching,

    // Actions
    createConversation,
    selectConversation,
    addMessage,
    updateTitle,
    toggleStarred,
    deleteConversation,
    startNewConversation,
  };
}
