"""
Firecrawl Tool for Google ADK

Web scraping tool using Firecrawl API for HTML and PDF content.
"""

import asyncio
import httpx
from dataclasses import dataclass
from typing import Optional
from google.adk.tools import ToolContext


@dataclass
class ScrapeResult:
    """Result from scraping a URL."""
    url: str
    success: bool
    markdown: Optional[str] = None
    pdf_content: Optional[bytes] = None
    title: Optional[str] = None
    error: Optional[str] = None


class FirecrawlTool:
    """
    Firecrawl API client for web scraping.

    Supports both HTML pages (converted to markdown) and PDF documents.
    """

    BASE_URL = "https://api.firecrawl.dev/v1"
    MAX_RETRIES = 3
    RATE_LIMIT_DELAY = 6.0  # 10 requests per minute = 6 seconds between requests

    def __init__(self, api_key: str):
        """
        Initialize Firecrawl tool.

        Args:
            api_key: Firecrawl API key
        """
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            timeout=60.0,  # Longer timeout for PDF processing
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )
        self._last_request_time = 0

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def _rate_limit(self):
        """Enforce rate limiting between requests."""
        import time
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self.RATE_LIMIT_DELAY:
            await asyncio.sleep(self.RATE_LIMIT_DELAY - elapsed)
        self._last_request_time = time.time()

    async def _retry_request(
        self,
        method: str,
        url: str,
        max_retries: int = MAX_RETRIES,
        **kwargs,
    ) -> httpx.Response:
        """
        Execute HTTP request with exponential backoff retry.
        """
        last_error = None

        for attempt in range(max_retries):
            try:
                await self._rate_limit()
                response = await self.client.request(method, url, **kwargs)

                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 60))
                    await asyncio.sleep(retry_after)
                    continue

                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as e:
                if 400 <= e.response.status_code < 500 and e.response.status_code != 429:
                    raise
                last_error = e
            except httpx.RequestError as e:
                last_error = e

            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)

        raise last_error

    async def scrape_page(self, url: str) -> ScrapeResult:
        """
        Scrape an HTML page and convert to markdown.

        Args:
            url: URL to scrape

        Returns:
            ScrapeResult with markdown content
        """
        try:
            response = await self._retry_request(
                "POST",
                f"{self.BASE_URL}/scrape",
                json={
                    "url": url,
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                },
            )

            data = response.json()

            if not data.get("success"):
                return ScrapeResult(
                    url=url,
                    success=False,
                    error=data.get("error", "Unknown error"),
                )

            scrape_data = data.get("data", {})
            markdown = scrape_data.get("markdown", "")
            title = scrape_data.get("metadata", {}).get("title", "")

            # Validate content
            if not markdown or len(markdown.strip()) < 50:
                return ScrapeResult(
                    url=url,
                    success=False,
                    error="Scraped content too short or empty",
                )

            return ScrapeResult(
                url=url,
                success=True,
                markdown=markdown,
                title=title,
            )

        except httpx.HTTPStatusError as e:
            return ScrapeResult(
                url=url,
                success=False,
                error=f"HTTP {e.response.status_code}: {e.response.text[:200]}",
            )
        except Exception as e:
            return ScrapeResult(
                url=url,
                success=False,
                error=str(e),
            )

    async def scrape_pdf(self, url: str) -> ScrapeResult:
        """
        Scrape a PDF document and extract text as markdown.

        Args:
            url: URL of the PDF

        Returns:
            ScrapeResult with markdown content extracted from PDF
        """
        try:
            response = await self._retry_request(
                "POST",
                f"{self.BASE_URL}/scrape",
                json={
                    "url": url,
                    "formats": ["markdown"],
                    "parsers": ["pdf"],  # Explicitly use PDF parser
                },
            )

            data = response.json()

            if not data.get("success"):
                return ScrapeResult(
                    url=url,
                    success=False,
                    error=data.get("error", "Unknown error"),
                )

            scrape_data = data.get("data", {})
            markdown = scrape_data.get("markdown", "")
            metadata = scrape_data.get("metadata", {})
            title = metadata.get("title") or metadata.get("pdf_title", "")

            # Validate content
            if not markdown or len(markdown.strip()) < 100:
                return ScrapeResult(
                    url=url,
                    success=False,
                    error="PDF content extraction too short or empty",
                )

            return ScrapeResult(
                url=url,
                success=True,
                markdown=markdown,
                title=title,
            )

        except httpx.HTTPStatusError as e:
            return ScrapeResult(
                url=url,
                success=False,
                error=f"HTTP {e.response.status_code}: {e.response.text[:200]}",
            )
        except Exception as e:
            return ScrapeResult(
                url=url,
                success=False,
                error=str(e),
            )

    async def download_pdf(self, url: str) -> ScrapeResult:
        """
        Download PDF content as bytes (for storage in Convex).

        Args:
            url: URL of the PDF

        Returns:
            ScrapeResult with pdf_content bytes
        """
        try:
            # Direct download without Firecrawl
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(url, follow_redirects=True)
                response.raise_for_status()

                content_type = response.headers.get("content-type", "")
                if "pdf" not in content_type.lower():
                    return ScrapeResult(
                        url=url,
                        success=False,
                        error=f"Not a PDF: {content_type}",
                    )

                return ScrapeResult(
                    url=url,
                    success=True,
                    pdf_content=response.content,
                )

        except Exception as e:
            return ScrapeResult(
                url=url,
                success=False,
                error=str(e),
            )


# =============================================================================
# ADK Tool Functions
# =============================================================================

async def scrape_html_page(
    url: str,
    tool_context: ToolContext,
) -> dict:
    """
    ADK tool function to scrape an HTML page.

    Args:
        url: URL to scrape
        tool_context: ADK tool context

    Returns:
        Dict with success, markdown, title, and error fields
    """
    api_key = tool_context.get_auth_credential("firecrawl_api_key")
    if not api_key:
        return {"success": False, "error": "Firecrawl API key not configured"}

    async with FirecrawlTool(api_key) as firecrawl:
        result = await firecrawl.scrape_page(url)
        return {
            "success": result.success,
            "markdown": result.markdown,
            "title": result.title,
            "error": result.error,
        }


async def scrape_pdf_document(
    url: str,
    tool_context: ToolContext,
) -> dict:
    """
    ADK tool function to scrape a PDF document.

    Args:
        url: URL of the PDF
        tool_context: ADK tool context

    Returns:
        Dict with success, markdown, title, and error fields
    """
    api_key = tool_context.get_auth_credential("firecrawl_api_key")
    if not api_key:
        return {"success": False, "error": "Firecrawl API key not configured"}

    async with FirecrawlTool(api_key) as firecrawl:
        result = await firecrawl.scrape_pdf(url)
        return {
            "success": result.success,
            "markdown": result.markdown,
            "title": result.title,
            "error": result.error,
        }
