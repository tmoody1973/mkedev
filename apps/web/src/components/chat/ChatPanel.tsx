'use client'

import { useState, useRef, useEffect, type ReactNode, type FormEvent } from 'react'
import { Send, Mic, MessageCircle, MapPin, FileSearch, Calculator, BookOpen, CheckCircle2, Loader2, Home, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { CitationText, SourcesFooter } from './CitationText'
import { enhanceCitations, hasCitationMarkers, type EnhancedCitation, type RawCitation } from '@/lib/citations'
import { matchDocumentUrl } from '@/lib/documentUrls'

// Dynamic import to avoid SSR issues with react-pdf (uses DOMMatrix)
const PDFViewerModal = dynamic(
  () => import('../ui/PDFViewerModal').then((mod) => mod.PDFViewerModal),
  { ssr: false }
)

/**
 * Generative card type for rendering UI components within messages.
 * Maps to the cards field in the Convex messages schema.
 */
export interface GenerativeCard {
  type:
    | 'zone-info'
    | 'parcel-info'
    | 'parcel-analysis'
    | 'incentives-summary'
    | 'area-plan-context'
    | 'permit-process'
    | 'code-citation'
    | 'opportunity-list'
    | 'home-listing'
    | 'homes-list'
    | 'commercial-properties-list'
    | 'commercial-property'
    | 'development-sites-list'
    | 'development-site'
    | 'vacant-lots-list'
    | 'vacant-lot'
  data: unknown
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

/**
 * Message structure for chat display.
 * Supports user, assistant, and system roles with optional generative UI cards.
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  inputMode?: 'text' | 'voice'
  cards?: GenerativeCard[]
  /** Raw citations from RAG response (groundingMetadata) */
  citations?: RawCitation[]
}

export interface ChatPanelProps {
  /** Array of messages to display */
  messages: ChatMessage[]
  /** Callback when a message is sent */
  onSendMessage?: (message: string) => void
  /** Callback when voice input is triggered */
  onVoiceInput?: () => void
  /** Whether the assistant is currently responding */
  isLoading?: boolean
  /** Real-time agent status for activity display */
  agentStatus?: AgentStatus | null
  /** Placeholder text for the input field */
  placeholder?: string
  /** Optional render function for generative cards */
  renderCard?: (card: GenerativeCard) => ReactNode
  /** Callback to generate a PDF report of the conversation */
  onDownloadReport?: () => void
  /** Whether a report is currently being generated */
  isGeneratingReport?: boolean
}

/**
 * Chat panel component with neobrutalist styling.
 * Features:
 * - Empty state with microphone icon and prompt
 * - Message list with role-based styling
 * - Loading indicator with animated bouncing dots
 * - Input area with text field, voice button, and send button
 * - Support for generative UI cards in messages
 */
export function ChatPanel({
  messages,
  onSendMessage,
  onVoiceInput,
  isLoading = false,
  agentStatus,
  placeholder = 'Ask about zoning, permits, or any property in Milwaukee...',
  renderCard,
  onDownloadReport,
  isGeneratingReport = false,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // PDF Viewer modal state
  const [pdfViewerState, setPdfViewerState] = useState<{
    isOpen: boolean
    citation: EnhancedCitation | null
  }>({
    isOpen: false,
    citation: null,
  })

  const handleCitationClick = (citation: EnhancedCitation) => {
    setPdfViewerState({ isOpen: true, citation })
  }

  const closePdfViewer = () => {
    setPdfViewerState({ isOpen: false, citation: null })
  }

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedInput = input.trim()
    if (trimmedInput && onSendMessage) {
      onSendMessage(trimmedInput)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className="flex flex-col h-full min-h-0 bg-stone-50 dark:bg-stone-950"
      data-testid="chat-panel"
    >
      {/* Header with Download Report button - only show when there are messages */}
      {messages.length > 0 && onDownloadReport && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <button
            type="button"
            onClick={onDownloadReport}
            disabled={isGeneratingReport || isLoading}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg',
              'border-2 border-black dark:border-white',
              'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300',
              'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
              'hover:bg-stone-100 dark:hover:bg-stone-700',
              'hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
              'active:translate-y-1 active:shadow-none',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
              'transition-all duration-100'
            )}
            title="Download conversation as PDF report"
          >
            {isGeneratingReport ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <EmptyState onPromptClick={onSendMessage} />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                formatTimestamp={formatTimestamp}
                renderCard={renderCard}
                onCitationClick={handleCitationClick}
              />
            ))}
          </>
        )}

        {/* Loading indicator with agent status */}
        {isLoading && <AgentStatusIndicator status={agentStatus} />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t-2 border-black dark:border-stone-700 bg-white dark:bg-stone-900"
        data-testid="chat-input-form"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            aria-label="Message input"
            className={cn(
              'flex-1 px-4 py-3 rounded-lg border-2 border-black dark:border-white',
              'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100',
              'placeholder:text-stone-500 dark:placeholder:text-stone-400',
              'font-sans text-sm',
              'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
              'focus:outline-none focus:ring-2 focus:ring-sky-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            data-testid="chat-input"
          />

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={onVoiceInput}
            disabled={isLoading}
            aria-label="Voice input"
            className={cn(
              'w-12 h-12 rounded-lg border-2 border-black dark:border-white',
              'bg-amber-400 text-stone-900',
              'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
              'hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
              'active:translate-y-2 active:shadow-none',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
              'transition-all duration-100',
              'flex items-center justify-center'
            )}
            data-testid="voice-input-button"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className={cn(
              'w-12 h-12 rounded-lg border-2 border-black dark:border-white',
              'bg-sky-500 text-white',
              'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
              'hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
              'active:translate-y-2 active:shadow-none',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
              'transition-all duration-100',
              'flex items-center justify-center'
            )}
            data-testid="send-button"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-2 text-[10px] text-stone-400 dark:text-stone-500 text-center leading-tight">
          Not affiliated with the City of Milwaukee. For informational purposes only.
        </p>
      </form>

      {/* PDF Viewer Modal */}
      {pdfViewerState.citation && (
        <PDFViewerModal
          isOpen={pdfViewerState.isOpen}
          onClose={closePdfViewer}
          pdfUrl={pdfViewerState.citation.documentUrl}
          title={pdfViewerState.citation.title}
          initialPage={pdfViewerState.citation.pageNumber}
        />
      )}
    </div>
  )
}

/**
 * Suggested prompts for users to get started.
 */
const SUGGESTED_PROMPTS = [
  {
    icon: MapPin,
    label: 'Zoning',
    prompt: 'What are the zoning requirements for opening a restaurant in the Third Ward?',
  },
  {
    icon: Home,
    label: 'Housing',
    prompt: 'What are the requirements for building a home on a city-owned lot?',
  },
  {
    icon: Calculator,
    label: 'Incentives',
    prompt: 'What TIF districts and financial incentives are available in Milwaukee?',
  },
  {
    icon: BookOpen,
    label: 'Area Plans',
    prompt: 'What development opportunities are in the Menomonee Valley?',
  },
]

/**
 * Empty state displayed when there are no messages.
 * Features a centered microphone icon with prompt text and suggested questions.
 */
function EmptyState({ onPromptClick }: { onPromptClick?: (prompt: string) => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center px-4"
      data-testid="empty-state"
    >
      {/* Animated microphone icon container */}
      <div className="relative">
        <div
          className={cn(
            'w-20 h-20 mb-6 rounded-full',
            'bg-sky-100 dark:bg-sky-900/50',
            'flex items-center justify-center',
            'border-2 border-black dark:border-white',
            'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
            'animate-pulse'
          )}
        >
          <Mic className="w-10 h-10 text-sky-600 dark:text-sky-400" />
        </div>
        {/* Decorative chat bubble */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full border-2 border-black flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-stone-900" />
        </div>
      </div>

      <h2 className="font-heading text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3">
        Hey MKE, what can I build?
      </h2>
      <p className="text-stone-600 dark:text-stone-400 font-sans max-w-sm leading-relaxed mb-6">
        Ask about zoning rules, financial incentives, permits, or any property in
        Milwaukee. Try voice or type your question below.
      </p>

      {/* Suggested prompts */}
      <div className="w-full max-w-md space-y-2">
        <p className="text-xs text-stone-500 dark:text-stone-500 uppercase tracking-wide font-medium mb-3">
          Try asking about
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SUGGESTED_PROMPTS.map((item) => (
            <button
              key={item.label}
              onClick={() => onPromptClick?.(item.prompt)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-left text-sm',
                'bg-white dark:bg-stone-800',
                'border-2 border-black dark:border-white',
                'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
                'hover:translate-x-[-1px] hover:translate-y-[-1px]',
                'hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]',
                'active:translate-x-[1px] active:translate-y-[1px]',
                'active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
                'transition-all duration-100',
                'rounded-none'
              )}
            >
              <item.icon className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <span className="text-stone-700 dark:text-stone-300 font-medium truncate">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Individual message bubble with role-based styling.
 */
interface MessageBubbleProps {
  message: ChatMessage
  formatTimestamp: (date: Date) => string
  renderCard?: (card: GenerativeCard) => ReactNode
  onCitationClick?: (citation: EnhancedCitation) => void
}

function MessageBubble({ message, formatTimestamp, renderCard, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  // Enhance citations with URLs for display
  const enhancedCitations = message.citations
    ? enhanceCitations(message.citations)
    : []

  // Check if content has citation markers
  const contentHasCitations = hasCitationMarkers(message.content)

  return (
    <div
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn(
          'max-w-[85%] p-4 rounded-lg border-2 border-black dark:border-white',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
          isUser && 'bg-sky-500 text-white',
          !isUser && !isSystem && 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100',
          isSystem && 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 italic'
        )}
      >
        {/* Message content */}
        <div className={cn(
          'font-sans text-sm prose prose-sm max-w-none',
          // Light mode prose colors
          'prose-headings:text-stone-900 prose-p:text-stone-800 prose-strong:text-stone-900',
          'prose-li:text-stone-800 prose-ul:text-stone-800 prose-ol:text-stone-800',
          // Link styling
          'prose-a:text-sky-600 prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-sky-700',
          'dark:prose-a:text-sky-400 dark:hover:prose-a:text-sky-300',
          // Table styling
          'prose-table:border-collapse prose-table:w-full prose-table:text-xs',
          'prose-th:border prose-th:border-stone-300 prose-th:bg-stone-100 prose-th:px-2 prose-th:py-1 prose-th:text-left prose-th:font-semibold',
          'prose-td:border prose-td:border-stone-300 prose-td:px-2 prose-td:py-1',
          // Dark mode prose colors
          'dark:prose-invert dark:prose-headings:text-stone-100 dark:prose-p:text-stone-200',
          'dark:prose-strong:text-stone-100 dark:prose-li:text-stone-200',
          'dark:prose-th:border-stone-600 dark:prose-th:bg-stone-700 dark:prose-td:border-stone-600',
          // User messages (white text on sky background)
          isUser && 'prose-headings:text-white prose-p:text-white prose-strong:text-white prose-li:text-white prose-a:text-white prose-a:underline dark:prose-headings:text-white dark:prose-p:text-white prose-th:bg-sky-600 prose-th:border-sky-400 prose-td:border-sky-400',
          // Compact spacing
          'prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5'
        )}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom link component - redirects to local PDFs when available
              a: ({ href, children, ...props }) => {
                // Extract text content from children
                const linkText = typeof children === 'string'
                  ? children
                  : Array.isArray(children)
                    ? children.map(c => typeof c === 'string' ? c : '').join('')
                    : '';

                // Try to match link text to a local PDF document
                const localDoc = matchDocumentUrl(linkText);

                if (localDoc) {
                  // Create a synthetic citation for the PDF viewer
                  const syntheticCitation: EnhancedCitation = {
                    index: 0,
                    sourceId: localDoc.url,
                    sourceName: localDoc.title,
                    title: localDoc.title,
                    excerpt: '',
                    documentUrl: localDoc.url,
                    category: localDoc.url.includes('/zoning-code/') ? 'zoning-codes' : 'area-plans',
                  };

                  return (
                    <button
                      type="button"
                      onClick={() => onCitationClick?.(syntheticCitation)}
                      className="text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:text-sky-700 dark:hover:text-sky-300 cursor-pointer"
                      title={`View: ${localDoc.title}`}
                    >
                      {children}
                    </button>
                  );
                }

                // Fallback to external link
                const isExternal = href?.startsWith('http') || href?.startsWith('https');
                return (
                  <a
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:text-sky-700 dark:hover:text-sky-300"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              // Custom paragraph component to handle citation markers
              p: ({ children }) => {
                if (contentHasCitations && enhancedCitations.length > 0 && typeof children === 'string' && hasCitationMarkers(children)) {
                  return (
                    <p className="my-1">
                      <CitationText
                        text={children}
                        citations={enhancedCitations}
                        onCitationClick={(c) => onCitationClick?.(c)}
                      />
                    </p>
                  );
                }
                return <p className="my-1">{children}</p>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Generative UI cards */}
        {message.cards && message.cards.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-600 space-y-3">
            {message.cards.map((card, index) => (
              <div key={index} data-testid={`card-${card.type}`}>
                {renderCard ? (
                  renderCard(card)
                ) : (
                  <CardPlaceholder type={card.type} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Citation sources footer */}
        {!isUser && enhancedCitations.length > 0 && (
          <SourcesFooter
            citations={enhancedCitations}
            onSourceClick={(c) => onCitationClick?.(c)}
          />
        )}

        {/* Timestamp */}
        <div
          className={cn(
            'mt-2 text-xs',
            isUser ? 'text-sky-100' : 'text-stone-500 dark:text-stone-400'
          )}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  )
}

/**
 * Placeholder for generative cards (Week 2 implementation).
 */
function CardPlaceholder({ type }: { type: string }) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600',
        'bg-stone-100 dark:bg-stone-700/50',
        'text-center text-xs text-stone-500 dark:text-stone-400'
      )}
      data-testid="card-placeholder"
    >
      <span className="font-mono">[{type}]</span>
      <span className="block mt-1">Card component - Coming in Week 2</span>
    </div>
  )
}

/**
 * Get icon for a tool name.
 */
function getToolIcon(toolName: string) {
  switch (toolName) {
    case 'geocode_address':
      return <MapPin className="w-4 h-4" />;
    case 'query_zoning_at_point':
      return <FileSearch className="w-4 h-4" />;
    case 'calculate_parking':
      return <Calculator className="w-4 h-4" />;
    case 'query_zoning_code':
    case 'query_area_plans':
      return <BookOpen className="w-4 h-4" />;
    case 'search_homes_for_sale':
    case 'get_home_details':
      return <Home className="w-4 h-4" />;
    default:
      return <Loader2 className="w-4 h-4 animate-spin" />;
  }
}

/**
 * Agent status indicator showing real-time activity.
 */
function AgentStatusIndicator({ status }: { status?: AgentStatus | null }) {
  // Fallback to simple dots if no status
  if (!status) {
    return (
      <div className="flex justify-start" data-testid="loading-indicator">
        <div
          className={cn(
            'p-4 rounded-lg border-2 border-black dark:border-white',
            'bg-white dark:bg-stone-800',
            'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]'
          )}
          role="status"
          aria-label="Assistant is thinking"
        >
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
            <span className="text-sm text-stone-600 dark:text-stone-400">Thinking...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start" data-testid="agent-status-indicator">
      <div
        className={cn(
          'p-4 rounded-lg border-2 border-black dark:border-white',
          'bg-white dark:bg-stone-800',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
          'min-w-[280px] max-w-[400px]'
        )}
        role="status"
        aria-label="Agent activity status"
      >
        {/* Current activity */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            status.status === 'executing_tool' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
            status.status === 'thinking' && 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
            status.status === 'generating_response' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
            status.status === 'error' && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
          )}>
            {status.status === 'executing_tool' && status.currentTool ? (
              getToolIcon(status.currentTool)
            ) : status.status === 'generating_response' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {status.statusMessage || 'Processing...'}
            </p>
            {status.status === 'executing_tool' && status.currentTool && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {getToolLabel(status.currentTool)}
              </p>
            )}
          </div>
        </div>

        {/* Completed tools */}
        {status.toolsCompleted.length > 0 && (
          <div className="border-t border-stone-200 dark:border-stone-700 pt-2 mt-2">
            <div className="flex flex-wrap gap-1.5">
              {status.toolsCompleted.map((tool, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                    tool.success
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  )}
                >
                  {tool.success ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <span className="w-3 h-3 text-center">!</span>
                  )}
                  <span>{getToolShortLabel(tool.name)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <span className="sr-only">
          Agent is {status.statusMessage}. {status.toolsCompleted.length} tools completed.
        </span>
      </div>
    </div>
  );
}

/**
 * Get human-readable label for a tool.
 */
function getToolLabel(toolName: string): string {
  switch (toolName) {
    case 'geocode_address':
      return 'Address Lookup';
    case 'query_zoning_at_point':
      return 'Zoning Database';
    case 'calculate_parking':
      return 'Parking Calculator';
    case 'query_zoning_code':
      return 'Zoning Code Search';
    case 'query_area_plans':
      return 'Area Plans Search';
    case 'search_homes_for_sale':
      return 'Home Search';
    case 'get_home_details':
      return 'Home Details';
    default:
      return toolName;
  }
}

/**
 * Get short label for completed tool chips.
 */
function getToolShortLabel(toolName: string): string {
  switch (toolName) {
    case 'geocode_address':
      return 'Geocode';
    case 'query_zoning_at_point':
      return 'Zoning';
    case 'calculate_parking':
      return 'Parking';
    case 'query_zoning_code':
      return 'Code';
    case 'query_area_plans':
      return 'Plans';
    case 'search_homes_for_sale':
      return 'Homes';
    case 'get_home_details':
      return 'Home';
    default:
      return toolName;
  }
}
