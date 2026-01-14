'use client'

import type { DocumentListProps } from '../types'
import { DocumentCard } from './DocumentCard'

export function DocumentList({ documents, onDocumentClick }: DocumentListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
          Documents
        </h3>
        <span className="font-mono text-sm text-stone-500 dark:text-stone-400">
          {documents.length} results
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onClick={onDocumentClick}
          />
        ))}
      </div>
    </div>
  )
}
