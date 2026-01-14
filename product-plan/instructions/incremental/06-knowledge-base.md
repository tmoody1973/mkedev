# Milestone 06 — Knowledge Base

## Overview

The Knowledge Base provides transparency into the RAG (Retrieval-Augmented Generation) system that powers MKE.dev's AI responses. Users can view the document corpus, track Firecrawl sync status, browse source documents, and understand which documents inform the AI's answers. This builds trust by showing the authoritative sources behind every response.

---

## User Flows to Implement

1. **View the document corpus dashboard** showing total documents, sources, and last sync time
2. **Browse documents by category** (Zoning Codes, Area Plans, Policies, Ordinances)
3. **Search the knowledge base** for specific topics or document titles
4. **View individual document details** including source URL, last crawled date, and content preview
5. **See which sources were used** to generate a specific AI response (citation traces)
6. **Monitor Firecrawl sync status** and recent document updates
7. **Filter documents** by source, date added, or document type

---

## UI Components to Integrate

See `sections/knowledge-base/components/` for the following:

### Dashboard
- `KnowledgeBase` — Main composite component
- `CorpusStatsHeader` — Total documents, sources, last sync stats
- `CategoryGrid` — Category cards with document counts
- `CategoryCard` — Individual category with icon, name, count

### Document Browser
- `DocumentList` — List of documents with filters
- `DocumentCard` — Individual document with title, source, category, date
- `SearchBar` — Search input with category filter dropdown

### Source Monitoring
- `SourceStatusPanel` — Connected data sources with sync status
- `SourceStatusCard` — Individual source with status indicator
- `RecentUpdatesFeed` — Recently crawled/updated documents feed

---

## Backend Requirements

### Document Management

```typescript
interface Document {
  id: string
  title: string
  category: 'zoning-codes' | 'area-plans' | 'policies' | 'ordinances'
  sourceUrl: string
  sourceDomain: string
  content: string
  contentPreview: string
  lastCrawled: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'stale' | 'error'
  wordCount: number
  pageCount?: number
}
```

### API Endpoints
- `GET /api/documents` — List documents (with pagination, filters)
- `GET /api/documents/:id` — Get single document with full content
- `GET /api/documents/stats` — Get corpus statistics
- `GET /api/documents/categories` — Get category counts
- `GET /api/sources` — List data sources with sync status
- `POST /api/sources/:id/sync` — Trigger manual sync for a source
- `GET /api/documents/recent` — Get recently updated documents

### Firecrawl Integration

Implement document ingestion pipeline:
1. Configure Firecrawl to crawl Milwaukee city websites
2. Store crawled content in vector database for RAG
3. Track sync status and last crawl timestamps
4. Handle incremental updates (only re-crawl changed pages)

### Data Sources to Crawl

| Source | URL | Content Type |
|--------|-----|--------------|
| City of Milwaukee DCD | city.milwaukee.gov/dcd | Zoning info, permits |
| Milwaukee Zoning Code | city.milwaukee.gov/zoning | Full zoning ordinance |
| Area Plans | city.milwaukee.gov/plans | Neighborhood plans |
| Historic Preservation | city.milwaukee.gov/hpc | Historic districts info |
| RACM | city.milwaukee.gov/racm | Development incentives |

### RAG Integration

- Index documents in vector database (Pinecone, Weaviate, etc.)
- Implement semantic search for agent queries
- Track which documents are cited in responses
- Provide citation traces back to UI

---

## Data Models

```typescript
interface CorpusStats {
  totalDocuments: number
  totalSources: number
  lastSync: string
  totalWordCount: number
}

interface Category {
  id: string
  name: string
  icon: string
  documentCount: number
  description: string
}

interface Source {
  id: string
  name: string
  domain: string
  url: string
  status: 'synced' | 'syncing' | 'error' | 'stale'
  lastSync: string
  documentCount: number
  errorMessage?: string
}

interface RecentUpdate {
  id: string
  documentId: string
  documentTitle: string
  action: 'created' | 'updated' | 'deleted'
  timestamp: string
  source: string
}
```

---

## Success Criteria

- [ ] Dashboard shows corpus stats (documents, sources, last sync)
- [ ] Category cards display with accurate counts
- [ ] Document list renders with search and filters
- [ ] Individual document detail view shows full metadata
- [ ] Source status panel shows sync status for each source
- [ ] Recent updates feed shows new/updated documents
- [ ] Search works across document titles and content
- [ ] Firecrawl integration syncs documents on schedule
- [ ] RAG pipeline indexes documents for agent queries
- [ ] Mobile responsive layout
- [ ] Neobrutalist styling with 2px borders
