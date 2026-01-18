"""
Planning Ingestion Agent

Google ADK agent for crawling Milwaukee planning documents.
"""

import asyncio
from dataclasses import dataclass
from typing import Optional
from google.adk import Agent
from google.adk.tools import FunctionTool

from config import (
    PLANNING_SOURCES,
    PlanningSource,
    SyncFrequency,
    ContentType,
    load_env_config,
    FILE_SEARCH_STORE_DISPLAY_NAME,
)
from convex_client import ConvexHTTPClient, compute_content_hash
from tools.playwright_scraper import PlaywrightScraper
from tools.gemini_filesearch import GeminiFileSearchTool


@dataclass
class SyncResult:
    """Result of syncing a single document."""
    source_id: str
    success: bool
    action: str  # "created", "updated", "skipped", "error"
    message: Optional[str] = None


@dataclass
class SyncSummary:
    """Summary of a sync run."""
    total: int
    created: int
    updated: int
    skipped: int
    failed: int
    results: list[SyncResult]


class PlanningIngestionAgent:
    """
    Agent for crawling and indexing Milwaukee planning documents.

    Workflow:
    1. Fetch source configurations
    2. For each source:
       a. Scrape content (HTML or PDF)
       b. Compute content hash
       c. Check if content changed
       d. If changed, upsert to Convex
       e. Upload to Gemini File Search Store
       f. Update status
    """

    def __init__(
        self,
        gemini_api_key: str,
        convex_url: str,
        convex_deploy_key: str,
    ):
        """Initialize the agent with API credentials."""
        self.gemini_api_key = gemini_api_key
        self.convex_url = convex_url
        self.convex_deploy_key = convex_deploy_key

        # Initialize tools
        self.scraper = PlaywrightScraper()
        self.gemini_fs = GeminiFileSearchTool(gemini_api_key)
        self.convex = ConvexHTTPClient(convex_url, convex_deploy_key)

        # File Search Store name (cached after first creation)
        self._store_name: Optional[str] = None

    async def close(self):
        """Clean up resources."""
        await self.scraper.close()
        await self.convex.close()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def _get_store_name(self) -> str:
        """Get or create the File Search Store."""
        if self._store_name is None:
            self._store_name, _ = await self.gemini_fs.get_or_create_store(
                FILE_SEARCH_STORE_DISPLAY_NAME
            )
        return self._store_name

    async def sync_source(
        self,
        source: PlanningSource,
        force: bool = False,
    ) -> SyncResult:
        """
        Sync a single source.

        Args:
            source: Source configuration
            force: Force re-sync even if content hasn't changed

        Returns:
            SyncResult with action taken
        """
        try:
            # Step 1: Scrape content
            if source.content_type == ContentType.HTML:
                result = await self.scraper.scrape_page(source.url)
            else:
                result = await self.scraper.scrape_pdf(source.url)

            if not result.success:
                # Check if document exists before trying to update status
                existing = await self.convex.get_document(source.id)
                if existing:
                    await self.convex.update_status(
                        source_id=source.id,
                        status="error",
                        error_message=result.error,
                    )
                return SyncResult(
                    source_id=source.id,
                    success=False,
                    action="error",
                    message=result.error,
                )

            # Step 2: Compute content hash
            content_hash = compute_content_hash(result.markdown or "")

            # Step 3: Check if content changed
            if not force:
                hash_check = await self.convex.check_content_hash(
                    source_id=source.id,
                    content_hash=content_hash,
                )
                if hash_check.get("exists") and not hash_check.get("changed"):
                    return SyncResult(
                        source_id=source.id,
                        success=True,
                        action="skipped",
                        message="Content unchanged",
                    )

            # Step 4: Upsert to Convex
            await self.convex.upsert_document(
                source_id=source.id,
                source_url=source.url,
                title=result.title or source.title,
                content_type=source.content_type.value,
                category=source.category,
                sync_frequency=source.sync_frequency.value,
                content_hash=content_hash,
                status="crawled",
                markdown_content=result.markdown,
            )

            # Step 5: Upload to Gemini File Search
            store_name = await self._get_store_name()

            # Check if this is PDF content (base64 encoded)
            if result.markdown and result.markdown.startswith("PDF_BASE64:"):
                import base64
                pdf_base64 = result.markdown[len("PDF_BASE64:"):]
                pdf_bytes = base64.b64decode(pdf_base64)
                upload_result = await self.gemini_fs.upload_pdf(
                    store_name=store_name,
                    pdf_content=pdf_bytes,
                    display_name=f"{source.category}/{source.id}.pdf",
                    metadata={
                        "source_id": source.id,
                        "category": source.category,
                        "source_url": source.url,
                    },
                )
            else:
                upload_result = await self.gemini_fs.upload_markdown(
                    store_name=store_name,
                    content=result.markdown,
                    display_name=f"{source.category}/{source.id}",
                    metadata={
                        "source_id": source.id,
                        "category": source.category,
                        "source_url": source.url,
                    },
                )

            if not upload_result.success:
                await self.convex.update_status(
                    source_id=source.id,
                    status="error",
                    error_message=f"Gemini upload failed: {upload_result.error}",
                )
                return SyncResult(
                    source_id=source.id,
                    success=False,
                    action="error",
                    message=f"Gemini upload failed: {upload_result.error}",
                )

            # Step 6: Update status to indexed
            await self.convex.update_status(
                source_id=source.id,
                status="indexed",
                gemini_file_uri=upload_result.file_uri,
            )

            # Determine action
            existing = await self.convex.get_document(source.id)
            action = "updated" if existing else "created"

            return SyncResult(
                source_id=source.id,
                success=True,
                action=action,
                message=f"Successfully {action}",
            )

        except Exception as e:
            await self.convex.update_status(
                source_id=source.id,
                status="error",
                error_message=str(e),
            )
            return SyncResult(
                source_id=source.id,
                success=False,
                action="error",
                message=str(e),
            )

    async def sync_by_frequency(
        self,
        frequency: SyncFrequency,
        force: bool = False,
    ) -> SyncSummary:
        """
        Sync all sources with a specific frequency.

        Args:
            frequency: SyncFrequency.WEEKLY or SyncFrequency.MONTHLY
            force: Force re-sync even if content hasn't changed

        Returns:
            SyncSummary with results
        """
        sources = [s for s in PLANNING_SOURCES if s.sync_frequency == frequency]
        results = []

        for source in sources:
            result = await self.sync_source(source, force=force)
            results.append(result)

        return SyncSummary(
            total=len(results),
            created=sum(1 for r in results if r.action == "created"),
            updated=sum(1 for r in results if r.action == "updated"),
            skipped=sum(1 for r in results if r.action == "skipped"),
            failed=sum(1 for r in results if r.action == "error"),
            results=results,
        )

    async def sync_all(self, force: bool = False) -> SyncSummary:
        """
        Sync all sources.

        Args:
            force: Force re-sync even if content hasn't changed

        Returns:
            SyncSummary with results
        """
        results = []

        for source in PLANNING_SOURCES:
            result = await self.sync_source(source, force=force)
            results.append(result)

        return SyncSummary(
            total=len(results),
            created=sum(1 for r in results if r.action == "created"),
            updated=sum(1 for r in results if r.action == "updated"),
            skipped=sum(1 for r in results if r.action == "skipped"),
            failed=sum(1 for r in results if r.action == "error"),
            results=results,
        )

    async def sync_single(
        self,
        source_id: str,
        force: bool = False,
    ) -> SyncResult:
        """
        Sync a single source by ID.

        Args:
            source_id: Source ID to sync
            force: Force re-sync

        Returns:
            SyncResult
        """
        source = next((s for s in PLANNING_SOURCES if s.id == source_id), None)
        if not source:
            return SyncResult(
                source_id=source_id,
                success=False,
                action="error",
                message=f"Source not found: {source_id}",
            )
        return await self.sync_source(source, force=force)


# =============================================================================
# Factory Function
# =============================================================================

def create_agent() -> PlanningIngestionAgent:
    """
    Create a PlanningIngestionAgent with environment configuration.

    Returns:
        Configured PlanningIngestionAgent
    """
    config = load_env_config()
    return PlanningIngestionAgent(
        gemini_api_key=config.gemini_api_key,
        convex_url=config.convex_url,
        convex_deploy_key=config.convex_deploy_key,
    )
