# Raw Idea: Clickable Citation Links with PDF Viewer

## The Inspiration

Competitor apps show inline citations like `[3]` and `[9]` in AI responses. When clicked, they open a document viewer showing the actual PDF source at the relevant section. This builds trust and lets users verify information.

## What We Want

1. **Inline citation markers** - `[1]`, `[2]`, etc. in response text
2. **Clickable links** - Click to open source document
3. **PDF viewer modal** - Shows the document without leaving the app
4. **Source footer** - List of all sources at bottom of response

## What We Have

- PDFs already in `public/docs/zoning-code/` and `public/docs/area-plans/`
- `documentUrls.ts` with mapping of source IDs to URLs
- RAG returns citations with `sourceId`, `sourceName`, `excerpt`
- ChatPanel with ReactMarkdown rendering

## Key Implementation Points

1. Update agent system prompt to use `[N]` citation format
2. Create `CitationText` component to parse and render clickable citations
3. Create `PDFViewerModal` component for viewing documents
4. Integrate into message rendering in ChatPanel
5. Show sources footer with all cited documents
