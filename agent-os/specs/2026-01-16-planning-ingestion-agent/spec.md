# Specification: Google ADK Planning Ingestion Agent

## Goal

Build a Google ADK Python agent that crawls Milwaukee planning documents and property listings using Firecrawl MCP, stores the data in Convex via HTTP API, and uploads content to Gemini File Search Stores for RAG-enabled semantic search.

## User Stories

- As a developer, I want the planning agent to automatically crawl and ingest Milwaukee city planning documents so that our RAG system has up-to-date information about building sites, vacant lots, and design guidelines
- As a user asking about properties, I want to see property listings from the city's website so that I can discover available vacant lots and building sites

## Specific Requirements

**Python Agent Structure**
- Create new agent at `apps/agents/planning-ingestion/` using Google ADK Python SDK
- Use `LlmAgent` pattern similar to existing TypeScript `zoning-interpreter` agent
- Implement as a task-based agent (not conversational) that executes a crawl workflow
- Include `pyproject.toml` with dependencies: `google-adk`, `httpx`, `python-dotenv`
- Structure: `agent.py`, `tools/`, `config.py`, `convex_client.py`, `main.py`

**Firecrawl MCP Integration**
- Use Google ADK's native MCP support to connect to Firecrawl MCP server
- Configure MCP connection in agent initialization
- Use `scrape` tool for individual pages, `crawl` for multi-page sites
- Extract markdown content for HTML pages, file URLs for PDFs
- Handle rate limiting and retry logic within tools

**Target URLs for Crawling**
- HTML Pages (weekly sync): `city.milwaukee.gov/DCD/CityRealEstate/HomeBuildingSites`, `city.milwaukee.gov/DCD/CityRealEstate/VacantLotHandbook/VacantLots`, `city.milwaukee.gov/DCD/CityRealEstate/CRE`, `city.milwaukee.gov/OverlayZones/SP`, `city.milwaukee.gov/OverlayZones/DIZ`, `city.milwaukee.gov/OverlayZones/MSP`, `city.milwaukee.gov/DCD/Planning/UrbanDesign/DesignGuidelines`
- PDF Documents (monthly sync): `Neighborhood-House-Design-Stds-Rev-July-3-2024.pdf`, `GreenYourMilwHouse.pdf`, `Buildable-Vacant-Lot-Offer---KB-Title.pdf`, `VacantLotHandbook.pdf`
- Store URL configurations in `config.py` with crawl frequency metadata

**Convex Database Integration**
- Create new `planningDocuments` table in Convex schema for crawled content
- Fields: `sourceUrl`, `title`, `contentType` (html/pdf), `markdownContent`, `contentHash`, `geminiFileUri`, `lastCrawledAt`, `status`
- Use content hashing (MD5) to detect changes and skip unchanged documents
- Implement HTTP API client in `convex_client.py` using Convex HTTP Actions
- Create corresponding Convex HTTP action endpoints for CRUD operations

**Gemini File Search Store Integration**
- Create or reuse a "planning-documents" File Search Store
- Upload markdown content as text files and PDFs as binary
- Store `geminiFileUri` back to Convex for reference
- Follow existing pattern from `fileSearchStores.ts` for store management
- Use the Gemini File Search API directly (not ADK's built-in retrieval)

**Scheduling and Execution**
- Implement as a standalone script that can be triggered manually or via cron
- Weekly schedule for HTML pages (property listings change frequently)
- Monthly schedule for PDFs (design guidelines are static)
- Support `--force` flag to re-crawl regardless of content hash
- Log sync results and errors for monitoring

**Observability with Opik**
- Integrate Opik tracing following existing patterns in the codebase
- Create traces for each sync run with metadata (urls crawled, documents updated)
- Add spans for Firecrawl calls, Convex mutations, and Gemini uploads
- Log errors with full context for debugging

**Error Handling**
- Gracefully handle Firecrawl API failures with exponential backoff
- Skip individual document failures without failing entire sync
- Report partial success with detailed error summary
- Validate content before storing (non-empty markdown, valid PDF mime type)

## Visual Design

No visual mockups provided for this backend agent specification.

## Existing Code to Leverage

**`apps/web/convex/ingestion/firecrawl.ts`**
- Contains Firecrawl API client pattern with `scrapeUrl` function
- Shows markdown extraction and error handling patterns
- Reuse the `FirecrawlScrapeResult` interface structure for type consistency
- Follow the `IngestionResult` pattern for return types

**`apps/web/convex/ingestion/fileSearchStores.ts`**
- Provides Gemini File Search Store CRUD operations
- Shows pattern for creating stores, uploading documents, and tracking status
- Reuse store category types and status enums
- Reference the `uploadToStore` action for upload flow

**`apps/web/convex/ingestion/homesSync.ts`**
- Excellent pattern for external API sync with batched upserts
- Shows content transformation and coordinate conversion patterns
- Follow the `SyncResult` interface pattern for sync reporting
- Use similar pagination and retry logic

**`apps/agents/src/zoning-interpreter/agent.ts`**
- Shows Google ADK `LlmAgent` initialization pattern
- Reference for tool registration and agent configuration
- Adapt for Python SDK equivalent structure

**`apps/web/convex/schema.ts`**
- Contains existing table definitions including `fileSearchStores` and `storeDocuments`
- Follow naming conventions and field patterns for new `planningDocuments` table
- Use consistent status enums and timestamp fields

## Out of Scope

- Modifications to existing chat agent in Convex (uses Gemini API directly, not ADK)
- CopilotKit Generative UI components (separate spec needed)
- Cloud Run deployment configuration (manual deployment initially)
- Multi-agent orchestration with other ADK agents
- Real-time streaming of crawl progress to frontend
- PDF text extraction within the agent (handled by Gemini File Search)
- Authentication/authorization for the agent (runs as backend service)
- Automatic retry scheduling after failures (manual re-run)
- Crawling of password-protected or login-required pages
- Image extraction or OCR from crawled pages
