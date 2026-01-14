# Knowledge Base

Transparency layer into the RAG system showing the document corpus, sync status, and source citations.

## Features

- **Corpus Dashboard**: Stats overview of documents and sources
- **Category Browsing**: Browse by Zoning Codes, Area Plans, Policies, Ordinances
- **Document Search**: Search by title or content
- **Source Monitoring**: Track Firecrawl sync status
- **Recent Updates**: Feed of newly crawled/updated documents

## Components

| Component | Description |
|-----------|-------------|
| `KnowledgeBase` | Main composite component |
| `CorpusStatsHeader` | Total documents, sources, last sync |
| `CategoryGrid` / `CategoryCard` | Category overview cards |
| `SearchBar` | Search with category filter |
| `DocumentList` / `DocumentCard` | Document browser |
| `SourceStatusPanel` / `SourceStatusCard` | Source sync status |
| `RecentUpdatesFeed` | Recent document updates |

## Document Categories

| Category | Description |
|----------|-------------|
| Zoning Codes | Milwaukee zoning ordinance sections |
| Area Plans | Neighborhood planning documents |
| Policies | City policies and guidelines |
| Ordinances | Municipal code sections |
| Guides | How-to guides and resources |

## Data Sources

| Source | Domain | Content |
|--------|--------|---------|
| City of Milwaukee DCD | city.milwaukee.gov/dcd | Development info |
| Milwaukee Zoning Code | city.milwaukee.gov/zoning | Full ordinance |
| Area Plans | city.milwaukee.gov/plans | Neighborhood plans |
| Historic Preservation | city.milwaukee.gov/hpc | Historic districts |
| RACM | city.milwaukee.gov/racm | Incentives info |

## Usage

```tsx
import { KnowledgeBase } from './components'
import data from './sample-data.json'

<KnowledgeBase
  stats={data.corpusStats}
  categories={data.categories}
  sources={data.sources}
  documents={data.documents}
  recentUpdates={data.recentUpdates}
  onCategoryClick={(id) => console.log('Category:', id)}
  onDocumentClick={(id) => console.log('Document:', id)}
  onSearch={(query, categoryId) => console.log('Search:', query, categoryId)}
  onRetrySource={(id) => console.log('Retry:', id)}
/>
```

## Design Notes

- Stats header uses large, bold numbers
- Category cards show icon and count
- Document freshness uses color indicators
- Source status shows sync/error badges
- Neobrutalist styling: 2px borders, 4px shadows
