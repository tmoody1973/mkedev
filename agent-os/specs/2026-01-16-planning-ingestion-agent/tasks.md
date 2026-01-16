# Implementation Tasks: Google ADK Planning Ingestion Agent

## Task Groups

### 1. Project Setup and Configuration

- [ ] **1.1** Create `apps/agents/planning-ingestion/` directory structure with `agent.py`, `tools/`, `config.py`, `convex_client.py`, `main.py`
- [ ] **1.2** Create `pyproject.toml` with dependencies: `google-adk>=0.3.0`, `httpx>=0.27.0`, `python-dotenv>=1.0.0`, `opik>=0.1.0`
- [ ] **1.3** Create `config.py` with target URL configurations, crawl frequencies (weekly/monthly), and environment variable loading
- [ ] **1.4** Create `.env.example` with required environment variables: `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, `CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `OPIK_API_KEY`
- [ ] **1.5** Add `planning-ingestion` to root monorepo workspace configuration

### 2. Convex Schema and HTTP Actions

- [ ] **2.1** Add `planningDocuments` table to `apps/web/convex/schema.ts` with fields: `sourceUrl`, `title`, `contentType`, `markdownContent`, `contentHash`, `geminiFileUri`, `lastCrawledAt`, `status`, `errorMessage`, `createdAt`, `updatedAt`
- [ ] **2.2** Create `apps/web/convex/ingestion/planningDocuments.ts` with mutations: `upsertDocument`, `updateStatus`, `getBySourceUrl`, `listByContentType`
- [ ] **2.3** Create `apps/web/convex/http/planningIngestion.ts` with HTTP action endpoints for the Python agent to call
- [ ] **2.4** Register HTTP routes in `apps/web/convex/http.ts` for planning ingestion endpoints
- [ ] **2.5** Add indexes to `planningDocuments` table: `by_sourceUrl`, `by_contentType`, `by_status`, `by_contentHash`

### 3. Python Convex HTTP Client

- [ ] **3.1** Implement `convex_client.py` with `ConvexHTTPClient` class for authenticated HTTP requests
- [ ] **3.2** Add method `upsert_planning_document(source_url, title, content_type, markdown, content_hash)`
- [ ] **3.3** Add method `get_document_by_url(source_url)` to check existing content hash
- [ ] **3.4** Add method `update_document_status(doc_id, status, gemini_file_uri, error_message)`
- [ ] **3.5** Add retry logic with exponential backoff for Convex HTTP calls

### 4. Firecrawl MCP Tool Implementation

- [ ] **4.1** Create `tools/firecrawl_tool.py` with MCP client setup for Firecrawl
- [ ] **4.2** Implement `scrape_page(url)` tool function returning markdown content
- [ ] **4.3** Implement `scrape_pdf(url)` tool function returning PDF binary or file reference
- [ ] **4.4** Add rate limiting (max 10 requests/minute) and retry logic with exponential backoff
- [ ] **4.5** Implement content validation (non-empty markdown, valid response codes)

### 5. Gemini File Search Integration

- [ ] **5.1** Create `tools/gemini_filesearch.py` with Gemini API client for File Search Stores
- [ ] **5.2** Implement `get_or_create_store(display_name, category)` to ensure "planning-documents" store exists
- [ ] **5.3** Implement `upload_markdown_to_store(store_name, content, display_name)` for HTML-derived content
- [ ] **5.4** Implement `upload_pdf_to_store(store_name, pdf_bytes, display_name)` for PDF documents
- [ ] **5.5** Return `gemini_file_uri` from upload functions for storage in Convex

### 6. Google ADK Agent Implementation

- [ ] **6.1** Create `agent.py` with `LlmAgent` configuration for planning ingestion workflow
- [ ] **6.2** Define agent instruction prompt for document crawling and ingestion workflow
- [ ] **6.3** Register Firecrawl MCP tools with the agent
- [ ] **6.4** Register custom tools for Convex operations and Gemini File Search
- [ ] **6.5** Implement agent workflow: fetch URL list -> crawl each -> compute hash -> upsert if changed -> upload to Gemini

### 7. Sync Orchestration

- [ ] **7.1** Create `main.py` with CLI entry point using argparse
- [ ] **7.2** Implement `sync_html_pages()` function for weekly HTML page sync
- [ ] **7.3** Implement `sync_pdf_documents()` function for monthly PDF sync
- [ ] **7.4** Add `--force` flag to bypass content hash checking
- [ ] **7.5** Add `--dry-run` flag to preview changes without executing
- [ ] **7.6** Implement summary reporting: documents crawled, updated, skipped, failed

### 8. Opik Observability Integration

- [ ] **8.1** Create `observability.py` with Opik trace manager setup
- [ ] **8.2** Add trace wrapper for main sync functions with run metadata
- [ ] **8.3** Add spans for individual Firecrawl calls with URL and response time
- [ ] **8.4** Add spans for Convex mutations with document IDs
- [ ] **8.5** Add spans for Gemini File Search uploads with file URIs
- [ ] **8.6** Log errors and partial failures with full context

### 9. Testing and Validation

- [ ] **9.1** Create `tests/test_convex_client.py` with mock HTTP responses
- [ ] **9.2** Create `tests/test_firecrawl_tool.py` with mock MCP responses
- [ ] **9.3** Create `tests/test_gemini_filesearch.py` with mock API responses
- [ ] **9.4** Create `tests/test_sync_workflow.py` for end-to-end workflow testing
- [ ] **9.5** Add integration test script that runs against staging Convex deployment

### 10. Documentation and Scripts

- [ ] **10.1** Create `apps/agents/planning-ingestion/README.md` with setup and usage instructions
- [ ] **10.2** Create `scripts/run-planning-sync.sh` for manual execution
- [ ] **10.3** Document environment variable requirements and Firecrawl MCP setup
- [ ] **10.4** Add example crontab entries for weekly/monthly scheduling
- [ ] **10.5** Document how to verify sync results in Convex dashboard

## Dependencies Between Task Groups

```
1 (Setup)
    |
    v
2 (Convex Schema) --> 3 (Python Client)
    |                       |
    v                       v
4 (Firecrawl) ---------> 6 (ADK Agent) <-------- 5 (Gemini)
                              |
                              v
                        7 (Orchestration)
                              |
                              v
                        8 (Observability)
                              |
                              v
                        9 (Testing)
                              |
                              v
                        10 (Documentation)
```

## Estimated Effort

| Task Group | Estimated Hours |
|------------|-----------------|
| 1. Project Setup | 2 |
| 2. Convex Schema | 3 |
| 3. Python Client | 3 |
| 4. Firecrawl Tool | 4 |
| 5. Gemini Integration | 4 |
| 6. ADK Agent | 4 |
| 7. Sync Orchestration | 3 |
| 8. Observability | 2 |
| 9. Testing | 4 |
| 10. Documentation | 2 |
| **Total** | **31 hours** |

## Acceptance Criteria

- [ ] Agent successfully crawls all target HTML pages and extracts markdown
- [ ] Agent successfully downloads and stores reference to target PDF documents
- [ ] Content hashing correctly detects unchanged documents and skips re-upload
- [ ] Documents are stored in Convex `planningDocuments` table with all required fields
- [ ] Documents are uploaded to Gemini File Search Store with valid URIs
- [ ] Manual sync via CLI works with `--force` and `--dry-run` flags
- [ ] Opik traces show complete workflow with timing information
- [ ] Partial failures are logged and do not prevent other documents from syncing
- [ ] README documentation enables another developer to run the agent
