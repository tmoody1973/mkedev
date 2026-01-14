'use client'

import type { KnowledgeBaseProps } from '../types'
import { CorpusStatsHeader } from './CorpusStatsHeader'
import { SearchBar } from './SearchBar'
import { CategoryGrid } from './CategoryGrid'
import { SourceStatusPanel } from './SourceStatusPanel'
import { DocumentList } from './DocumentList'
import { RecentUpdatesFeed } from './RecentUpdatesFeed'
import { useState } from 'react'

export function KnowledgeBase({
  stats,
  categories,
  sources,
  documents,
  recentUpdates,
  onCategoryClick,
  onDocumentClick,
  onSearch,
  onRetrySource,
}: KnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()

  const handleSearch = (query: string, categoryId?: string) => {
    onSearch?.(query, categoryId)
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900">
      {/* Stats Header */}
      <CorpusStatsHeader stats={stats} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            query={searchQuery}
            selectedCategory={selectedCategory}
            categories={categories}
            onQueryChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onSearch={handleSearch}
          />
        </div>

        {/* Category Grid */}
        <div className="mb-8">
          <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100 mb-4">
            Browse by Category
          </h2>
          <CategoryGrid
            categories={categories}
            onCategoryClick={onCategoryClick}
          />
        </div>

        {/* Two Column Layout for Documents and Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Documents (Main Content) */}
          <div className="lg:col-span-2">
            <DocumentList
              documents={documents}
              onDocumentClick={onDocumentClick}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Data Sources */}
            <SourceStatusPanel
              sources={sources}
              onRetrySource={onRetrySource}
            />

            {/* Recent Updates */}
            <RecentUpdatesFeed
              updates={recentUpdates}
              onUpdateClick={onDocumentClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
