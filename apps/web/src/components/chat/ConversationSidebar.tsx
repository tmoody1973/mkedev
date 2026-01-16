'use client';

import { useState } from 'react';
import { Search, Plus, Star, Trash2, MessageSquare, X, ChevronLeft } from 'lucide-react';
import type { Conversation } from '@/hooks/useConversations';
import { Id } from '@/../convex/_generated/dataModel';

export interface ConversationSidebarProps {
  /** List of conversations to display */
  conversations: Conversation[];
  /** Currently selected conversation ID */
  currentConversationId: Id<"conversations"> | null;
  /** Search query */
  searchQuery: string;
  /** Search results (when searching) */
  searchResults: Conversation[];
  /** Whether currently searching */
  isSearching: boolean;
  /** Whether the sidebar is open (mobile) */
  isOpen: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Callback when a conversation is selected */
  onSelectConversation: (id: Id<"conversations"> | null) => void;
  /** Callback to start a new conversation */
  onNewConversation: () => void;
  /** Callback to toggle starred status */
  onToggleStarred: (id: Id<"conversations">) => void;
  /** Callback to delete a conversation */
  onDelete: (id: Id<"conversations">) => void;
  /** Callback to close sidebar (mobile) */
  onClose: () => void;
}

/**
 * Sidebar component for browsing and searching conversation history.
 * Follows RetroUI neobrutalist design.
 */
export function ConversationSidebar({
  conversations,
  currentConversationId,
  searchQuery,
  searchResults,
  isSearching,
  isOpen,
  isLoading,
  onSearchChange,
  onSelectConversation,
  onNewConversation,
  onToggleStarred,
  onDelete,
  onClose,
}: ConversationSidebarProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<Id<"conversations"> | null>(null);

  const displayedConversations = isSearching ? searchResults : conversations;

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleDelete = (id: Id<"conversations">) => {
    if (deleteConfirmId === id) {
      onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      // Auto-clear confirmation after 3 seconds
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-80 bg-white dark:bg-stone-900
          border-r-2 border-black dark:border-stone-700
          flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-stone-700">
          <h2 className="font-bold text-lg text-stone-900 dark:text-white">
            Chat History
          </h2>
          <div className="flex items-center gap-2">
            {/* New conversation button */}
            <button
              onClick={onNewConversation}
              className="p-2 rounded-lg border-2 border-black dark:border-stone-600 bg-sky-500 text-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_black] active:translate-y-1 active:shadow-none transition-all"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            {/* Close button (mobile) */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg border-2 border-black dark:border-stone-600 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_black] active:translate-y-1 active:shadow-none transition-all lg:hidden"
              title="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-10 py-2 text-sm border-2 border-black dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {isSearching && (
            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-stone-500 dark:text-stone-400">
              Loading...
            </div>
          ) : displayedConversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                {isSearching ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!isSearching && (
                <button
                  onClick={onNewConversation}
                  className="mt-3 px-4 py-2 text-sm font-medium bg-sky-500 text-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_black] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_black] active:translate-y-1 active:shadow-none transition-all"
                >
                  Start a conversation
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-stone-200 dark:divide-stone-700">
              {displayedConversations.map((conversation) => (
                <li key={conversation._id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectConversation(conversation._id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectConversation(conversation._id);
                      }
                    }}
                    className={`
                      w-full p-4 text-left transition-colors cursor-pointer
                      ${
                        currentConversationId === conversation._id
                          ? 'bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-500'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-800 border-l-4 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {conversation.starred && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                          )}
                          <h3 className="font-medium text-sm text-stone-900 dark:text-white truncate">
                            {conversation.title}
                          </h3>
                        </div>
                        {conversation.lastMessage && (
                          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 truncate">
                            {conversation.lastMessage}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
                          <span>{formatDate(conversation.lastMessageAt || conversation.createdAt)}</span>
                          {conversation.messageCount !== undefined && (
                            <>
                              <span>·</span>
                              <span>{conversation.messageCount} messages</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStarred(conversation._id);
                          }}
                          className={`p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ${
                            conversation.starred ? 'text-amber-500' : 'text-stone-400'
                          }`}
                          title={conversation.starred ? 'Unstar' : 'Star'}
                        >
                          <Star className={`w-4 h-4 ${conversation.starred ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(conversation._id);
                          }}
                          className={`p-1.5 rounded transition-colors ${
                            deleteConfirmId === conversation._id
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              : 'text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-red-500'
                          }`}
                          title={deleteConfirmId === conversation._id ? 'Click again to delete' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
