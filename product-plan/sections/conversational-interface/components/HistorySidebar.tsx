'use client'

import { useState } from 'react'
import {
  X,
  Search,
  Star,
  StarOff,
  Trash2,
  MessageSquare,
  Plus,
  Clock,
} from 'lucide-react'
import type {
  Conversation,
  HistorySidebarProps,
} from '../types'

export function HistorySidebar({
  conversations,
  activeConversationId,
  isOpen,
  onClose,
  onSelectConversation,
  onToggleStar,
  onDeleteConversation,
  onSearch,
  onNewConversation,
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter conversations
  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Separate starred and recent
  const starredConversations = filteredConversations.filter((c) => c.isStarred)
  const recentConversations = filteredConversations.filter((c) => !c.isStarred)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`
          fixed top-0 left-0 h-full w-full max-w-md bg-white dark:bg-stone-900 z-50
          border-r-2 border-black dark:border-stone-700
          shadow-[8px_0_0_0_rgba(0,0,0,1)] dark:shadow-[8px_0_0_0_rgba(255,255,255,0.1)]
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-stone-700">
          <h2 className="font-heading text-xl font-bold text-stone-900 dark:text-stone-50">
            Conversations
          </h2>
          <button
            onClick={onClose}
            className="
              w-10 h-10 rounded-lg border-2 border-black
              bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300
              shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]
              hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-1 active:shadow-none
              transition-all duration-100
              flex items-center justify-center
            "
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <button
            onClick={onNewConversation}
            className="
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              border-2 border-black bg-sky-500 text-white
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-2 active:shadow-none
              transition-all duration-100
              font-heading font-bold
            "
          >
            <Plus className="w-5 h-5" />
            New Conversation
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className="
                w-full pl-10 pr-4 py-2 rounded-lg border-2 border-black
                bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100
                placeholder:text-stone-500 dark:placeholder:text-stone-400
                font-body text-sm
                shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]
                focus:outline-none focus:ring-2 focus:ring-sky-500
              "
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Starred Section */}
          {starredConversations.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Starred
                </h3>
              </div>
              <div className="space-y-2">
                {starredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    onSelect={() => onSelectConversation?.(conv.id)}
                    onToggleStar={() => onToggleStar?.(conv.id)}
                    onDelete={() => onDeleteConversation?.(conv.id)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Section */}
          {recentConversations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-stone-400" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Recent
                </h3>
              </div>
              <div className="space-y-2">
                {recentConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    onSelect={() => onSelectConversation?.(conv.id)}
                    onToggleStar={() => onToggleStar?.(conv.id)}
                    onDelete={() => onDeleteConversation?.(conv.id)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-12 h-12 text-stone-300 dark:text-stone-600 mb-4" />
              <p className="text-stone-500 dark:text-stone-400 font-body">
                {searchQuery
                  ? 'No conversations match your search'
                  : 'No conversations yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Conversation Item
// =============================================================================

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onToggleStar: () => void
  onDelete: () => void
  formatDate: (date: string) => string
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onToggleStar,
  onDelete,
  formatDate,
}: ConversationItemProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={`
        relative p-3 rounded-lg border-2 border-black cursor-pointer
        transition-all duration-100
        ${
          isActive
            ? 'bg-sky-50 dark:bg-sky-900/30 shadow-[3px_3px_0px_0px_rgba(14,165,233,1)]'
            : 'bg-white dark:bg-stone-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] hover:bg-stone-50 dark:hover:bg-stone-700'
        }
      `}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
            {conversation.title}
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 font-body">
            {conversation.preview}
          </p>
        </div>

        {/* Actions */}
        <div
          className={`
            flex items-center gap-1 transition-opacity duration-150
            ${showActions ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar()
            }}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700"
            aria-label={conversation.isStarred ? 'Remove star' : 'Add star'}
          >
            {conversation.isStarred ? (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            ) : (
              <StarOff className="w-4 h-4 text-stone-400" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30"
            aria-label="Delete conversation"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
        <span>{conversation.messageCount} messages</span>
        <span>•</span>
        <span>{formatDate(conversation.updatedAt)}</span>
      </div>
    </div>
  )
}
