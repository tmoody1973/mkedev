# Planning Ingestion Agent

Google ADK agent for crawling and indexing Milwaukee planning documents for the MKE.dev civic intelligence platform.

## Overview

This agent crawls Milwaukee planning department websites and PDFs, extracts content, and indexes it in Gemini File Search for RAG-powered chat responses.

### Workflow

1. **Scrape** - Use Firecrawl API to extract content from HTML pages and PDFs
2. **Hash** - Compute content hash to detect changes
3. **Store** - Upsert document metadata and content to Convex
4. **Index** - Upload to Gemini File Search Store for RAG
5. **Track** - Update sync status and timestamps

## Sources

| Source ID | Type | Frequency | Category |
|-----------|------|-----------|----------|
| home-building-sites | HTML | Weekly | Home Building |
| vacant-side-lots | HTML | Weekly | Vacant Lots |
| commercial-properties | HTML | Weekly | Commercial |
| sp-overlay-zones | HTML | Weekly | Overlay Zones |
| diz-overlay-zones | HTML | Weekly | Overlay Zones |
| msp-overlay-zones | HTML | Weekly | Overlay Zones |
| design-guidelines | HTML | Weekly | Design Guidelines |
| house-design-standards | PDF | Monthly | Design Guidelines |
| green-milwaukee-house | PDF | Monthly | Design Guidelines |
| vacant-lot-offer | PDF | Monthly | Vacant Lots |
| vacant-lot-handbook | PDF | Monthly | Vacant Lots |

## Setup

### Prerequisites

- Python 3.11+
- uv (recommended) or pip
- Firecrawl API key
- Google Gemini API key
- Convex deployment

### Installation

```bash
cd apps/agents/planning-ingestion

# Using uv (recommended)
uv venv
source .venv/bin/activate
uv pip install -e .

# Or using pip
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

### Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `FIRECRAWL_API_KEY` | Firecrawl API key |
| `CONVEX_URL` | Convex deployment URL |
| `CONVEX_DEPLOY_KEY` | Convex deploy key for HTTP actions |
| `OPIK_API_KEY` | (Optional) Opik API key for observability |

## Usage

### List Sources

```bash
python main.py list
```

### Sync by Frequency

```bash
# Sync weekly sources (HTML pages)
python main.py sync --frequency weekly

# Sync monthly sources (PDFs)
python main.py sync --frequency monthly
```

### Sync All Sources

```bash
python main.py sync --all
```

### Sync Single Source

```bash
python main.py sync --source home-building-sites
```

### Options

| Flag | Description |
|------|-------------|
| `--force` | Force re-sync even if content unchanged |
| `--dry-run` | Preview what would sync without executing |

### Examples

```bash
# Preview what would be synced
python main.py sync --all --dry-run

# Force re-sync all sources
python main.py sync --all --force

# Sync specific source with force
python main.py sync --source house-design-standards --force
```

## Architecture

```
planning-ingestion/
├── main.py              # CLI entry point
├── agent.py             # Main agent class
├── config.py            # Source configurations
├── convex_client.py     # Convex HTTP client
├── observability.py     # Opik tracing
└── tools/
    ├── firecrawl_tool.py      # Web scraping
    └── gemini_filesearch.py   # File Search uploads
```

### Agent Class

The `PlanningIngestionAgent` class manages the sync workflow:

```python
from agent import create_agent

async with create_agent() as agent:
    # Sync single source
    result = await agent.sync_single("home-building-sites")

    # Sync by frequency
    summary = await agent.sync_by_frequency(SyncFrequency.WEEKLY)

    # Sync all
    summary = await agent.sync_all(force=True)
```

### Convex Integration

The agent uses HTTP actions to communicate with Convex:

- `POST /api/planning/documents/upsert` - Create/update documents
- `POST /api/planning/documents/status` - Update sync status
- `GET /api/planning/documents/check-hash` - Check content changes
- `GET /api/planning/documents/by-frequency` - List by sync frequency

## Scheduling

### Cron Jobs

Add to your scheduling system (e.g., GitHub Actions, cron):

```bash
# Weekly sync (e.g., every Monday at 6 AM)
0 6 * * 1 cd /path/to/planning-ingestion && python main.py sync --frequency weekly

# Monthly sync (e.g., 1st of each month at 6 AM)
0 6 1 * * cd /path/to/planning-ingestion && python main.py sync --frequency monthly
```

### Convex Crons

Alternatively, trigger from Convex crons:

```typescript
// convex/crons.ts
crons.weekly(
  'sync-planning-weekly',
  { dayOfWeek: 'monday', hourUTC: 12 },
  internal.planning.triggerWeeklySync
)

crons.monthly(
  'sync-planning-monthly',
  { day: 1, hourUTC: 12 },
  internal.planning.triggerMonthlySync
)
```

## Observability

The agent integrates with Opik for tracing:

- Sync operations are traced
- Firecrawl API calls are tracked
- Gemini uploads are monitored
- Convex operations are logged

View traces at [comet.com/opik](https://comet.com/opik).

## Error Handling

The agent handles errors gracefully:

- **Rate limiting**: Exponential backoff with retry
- **Network errors**: Automatic retry (3 attempts)
- **Content validation**: Minimum content length checks
- **Status tracking**: Error status saved to Convex

Failed syncs are logged and can be retried:

```bash
# Check failed documents in Convex
# Then retry specific source
python main.py sync --source <failed-source-id> --force
```

## Development

### Running Tests

```bash
pytest tests/
```

### Adding New Sources

1. Add source configuration to `config.py`:

```python
PlanningSource(
    id="new-source",
    url="https://city.milwaukee.gov/new-page",
    title="New Source Title",
    content_type=ContentType.HTML,  # or PDF
    sync_frequency=SyncFrequency.WEEKLY,  # or MONTHLY
    category="new-category",
)
```

2. Run sync:

```bash
python main.py sync --source new-source
```

## License

Part of the MKE.dev project.
