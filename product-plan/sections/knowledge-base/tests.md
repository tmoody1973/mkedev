# Knowledge Base — Test Instructions

Use test-driven development (TDD) to implement this section. Write tests first, then implement to make them pass.

## Unit Tests

### CorpusStatsHeader Component
- [ ] Displays total document count
- [ ] Displays total source count
- [ ] Shows last sync timestamp
- [ ] Shows total word count
- [ ] Formats large numbers with commas
- [ ] Formats timestamp as relative time ("2 hours ago")

### CategoryCard Component
- [ ] Displays category icon
- [ ] Shows category name
- [ ] Shows document count badge
- [ ] Shows category description
- [ ] Applies correct color/styling per category
- [ ] Calls `onClick` when card clicked
- [ ] Shows hover state

### CategoryGrid Component
- [ ] Renders all category cards
- [ ] Uses grid layout on desktop
- [ ] Wraps to fewer columns on mobile
- [ ] Sorts categories by document count (optional)

### SearchBar Component
- [ ] Renders search input field
- [ ] Shows placeholder text
- [ ] Renders category filter dropdown
- [ ] Calls `onSearch` when Enter pressed
- [ ] Calls `onSearch` when search button clicked
- [ ] Passes selected category to onSearch
- [ ] Clears input after search (optional)

### DocumentCard Component
- [ ] Displays document title
- [ ] Shows source domain with favicon
- [ ] Shows category badge
- [ ] Shows last updated timestamp
- [ ] Shows freshness indicator (color-coded)
- [ ] Truncates long titles with ellipsis
- [ ] Calls `onClick` when clicked
- [ ] Shows content preview on hover (optional)

### DocumentList Component
- [ ] Renders list of document cards
- [ ] Shows loading skeleton while loading
- [ ] Shows empty state when no documents
- [ ] Supports pagination (if many documents)
- [ ] Applies filters from SearchBar

### SourceStatusCard Component
- [ ] Displays source name
- [ ] Shows domain URL
- [ ] Shows sync status badge (synced/syncing/error)
- [ ] Shows last sync timestamp
- [ ] Shows document count for source
- [ ] Shows error message if status is error
- [ ] Calls `onRetry` when retry button clicked (for errors)

### SourceStatusPanel Component
- [ ] Renders all source cards
- [ ] Groups by status (errors first, then syncing, then synced)
- [ ] Shows overall sync status summary
- [ ] Allows collapsing/expanding

### RecentUpdatesFeed Component
- [ ] Displays recent document updates in chronological order
- [ ] Shows action type (created/updated/deleted)
- [ ] Shows document title
- [ ] Shows timestamp
- [ ] Shows source name
- [ ] Limits to most recent N items
- [ ] Allows "Show more" expansion

## Integration Tests

### Search Flow
- [ ] Typing in search filters documents in real-time
- [ ] Selecting category filter narrows results
- [ ] Combined search + category filter works
- [ ] Clearing search shows all documents
- [ ] No results shows appropriate message

### Category Filter Flow
- [ ] Clicking category card filters to that category
- [ ] Document list updates to show only that category
- [ ] Breadcrumb shows current category
- [ ] "All" option clears category filter

### Source Monitoring Flow
- [ ] Sources show current sync status
- [ ] Syncing sources show progress indicator
- [ ] Error sources show retry button
- [ ] Retrying source updates status
- [ ] Successful sync updates timestamp

### Document Detail Flow
- [ ] Clicking document opens detail view
- [ ] Detail shows full metadata
- [ ] Detail shows content preview/excerpt
- [ ] Detail shows related documents
- [ ] Back navigation returns to list

## Edge Cases

- [ ] Empty knowledge base shows setup instructions
- [ ] Very long document titles truncate correctly
- [ ] Source with 0 documents shows appropriately
- [ ] Stale documents (old sync) show warning
- [ ] Network error shows retry option
- [ ] Rapid search typing debounces requests

## Performance Tests

- [ ] Initial load under 2 seconds
- [ ] Search results appear within 300ms
- [ ] Pagination loads quickly
- [ ] Large document lists don't lag
- [ ] Category filter is instant

## Accessibility Tests

- [ ] All cards are keyboard accessible
- [ ] Search input has proper label
- [ ] Category filter is accessible
- [ ] Status badges have text alternatives
- [ ] Focus management works in list
- [ ] Color isn't only indicator of status
