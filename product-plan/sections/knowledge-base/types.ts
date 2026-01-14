// =============================================================================
// Data Types
// =============================================================================

/** Aggregate statistics about the knowledge base corpus */
export interface CorpusStats {
  totalDocuments: number
  totalSources: number
  totalCategories: number
  lastSyncedAt: string
  documentsAddedThisWeek: number
  documentsUpdatedThisWeek: number
}

/** Document category for organization */
export interface Category {
  id: string
  label: string
  description: string
  documentCount: number
  icon: 'building' | 'map' | 'document' | 'gavel' | 'sparkles'
}

/** Sync status for a data source */
export type SyncStatus = 'synced' | 'syncing' | 'error'

/** Crawl frequency options */
export type CrawlFrequency = 'daily' | 'weekly' | 'monthly'

/** A data source that feeds documents into the knowledge base */
export interface Source {
  id: string
  name: string
  domain: string
  documentCount: number
  status: SyncStatus
  lastCrawledAt: string
  crawlFrequency: CrawlFrequency
  errorMessage?: string
}

/** Document freshness indicator */
export type Freshness = 'recent' | 'current' | 'stale'

/** A document in the knowledge base corpus */
export interface Document {
  id: string
  title: string
  excerpt: string
  sourceId: string
  sourceName: string
  sourceDomain: string
  categoryId: string
  categoryLabel: string
  url: string
  lastCrawledAt: string
  addedAt: string
  wordCount: number
  freshness: Freshness
}

/** Type of document update */
export type UpdateType = 'added' | 'updated' | 'removed'

/** A recent update to a document */
export interface RecentUpdate {
  id: string
  documentId: string
  documentTitle: string
  updateType: UpdateType
  timestamp: string
  source: string
}

// =============================================================================
// Component Props
// =============================================================================

/** Props for the corpus stats header component */
export interface CorpusStatsHeaderProps {
  /** Aggregate corpus statistics */
  stats: CorpusStats
}

/** Props for the category card component */
export interface CategoryCardProps {
  /** The category to display */
  category: Category
  /** Called when the category is clicked */
  onClick?: (categoryId: string) => void
}

/** Props for the category grid component */
export interface CategoryGridProps {
  /** Categories to display */
  categories: Category[]
  /** Called when a category is clicked */
  onCategoryClick?: (categoryId: string) => void
}

/** Props for the source status card component */
export interface SourceStatusCardProps {
  /** The source to display */
  source: Source
  /** Called when retry is clicked (for error state) */
  onRetry?: (sourceId: string) => void
}

/** Props for the source status panel component */
export interface SourceStatusPanelProps {
  /** Data sources to display */
  sources: Source[]
  /** Called when retry is clicked for a source */
  onRetrySource?: (sourceId: string) => void
}

/** Props for the document card component */
export interface DocumentCardProps {
  /** The document to display */
  document: Document
  /** Called when the document is clicked */
  onClick?: (documentId: string) => void
}

/** Props for the document list component */
export interface DocumentListProps {
  /** Documents to display */
  documents: Document[]
  /** Called when a document is clicked */
  onDocumentClick?: (documentId: string) => void
}

/** Props for the recent updates feed component */
export interface RecentUpdatesFeedProps {
  /** Recent updates to display */
  updates: RecentUpdate[]
  /** Called when an update is clicked */
  onUpdateClick?: (documentId: string) => void
}

/** Props for the search bar component */
export interface SearchBarProps {
  /** Current search query */
  query: string
  /** Selected category filter */
  selectedCategory?: string
  /** Available categories for filtering */
  categories: Category[]
  /** Called when search query changes */
  onQueryChange?: (query: string) => void
  /** Called when category filter changes */
  onCategoryChange?: (categoryId: string | undefined) => void
  /** Called when search is submitted */
  onSearch?: (query: string, categoryId?: string) => void
}

/** Props for the main Knowledge Base component */
export interface KnowledgeBaseProps {
  /** Corpus statistics */
  stats: CorpusStats
  /** Document categories */
  categories: Category[]
  /** Data sources */
  sources: Source[]
  /** Sample documents */
  documents: Document[]
  /** Recent updates */
  recentUpdates: RecentUpdate[]
  /** Called when a category is clicked */
  onCategoryClick?: (categoryId: string) => void
  /** Called when a document is clicked */
  onDocumentClick?: (documentId: string) => void
  /** Called when search is performed */
  onSearch?: (query: string, categoryId?: string) => void
  /** Called when retry is clicked for a source */
  onRetrySource?: (sourceId: string) => void
}
