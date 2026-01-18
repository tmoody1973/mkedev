"""
Playwright Scraper Tool

Web scraping using Playwright for JavaScript-rendered pages.
Free alternative to Firecrawl with no API costs.
"""

import asyncio
import html2text
from dataclasses import dataclass
from typing import Optional
from playwright.async_api import async_playwright, Browser, Page


@dataclass
class ScrapeResult:
    """Result from scraping a URL."""
    url: str
    success: bool
    markdown: Optional[str] = None
    html: Optional[str] = None
    title: Optional[str] = None
    error: Optional[str] = None


class PlaywrightScraper:
    """
    Playwright-based web scraper.

    Uses headless Chromium to render JavaScript and extract content.
    Converts HTML to markdown using html2text.
    """

    def __init__(self):
        """Initialize the scraper."""
        self._browser: Optional[Browser] = None
        self._playwright = None
        self._h2t = html2text.HTML2Text()
        self._h2t.ignore_links = False
        self._h2t.ignore_images = True
        self._h2t.ignore_emphasis = False
        self._h2t.body_width = 0  # Don't wrap lines

    async def _ensure_browser(self) -> Browser:
        """Ensure browser is launched."""
        if self._browser is None:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                ]
            )
        return self._browser

    async def close(self):
        """Close the browser and cleanup."""
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def scrape_page(
        self,
        url: str,
        wait_for_selector: Optional[str] = None,
        timeout: int = 60000,
    ) -> ScrapeResult:
        """
        Scrape an HTML page and convert to markdown.

        Args:
            url: URL to scrape
            wait_for_selector: Optional CSS selector to wait for before scraping
            timeout: Page load timeout in milliseconds

        Returns:
            ScrapeResult with markdown content
        """
        try:
            browser = await self._ensure_browser()
            # Create page with realistic user agent
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080},
            )
            page = await context.new_page()

            try:
                # Navigate to page
                await page.goto(url, timeout=timeout, wait_until="domcontentloaded")

                # Wait for any bot challenges to complete (Cloudflare, etc.)
                # Check if we're on a challenge page and wait
                for _ in range(10):  # Up to 10 seconds
                    content = await page.content()
                    if "Verify you are human" in content or "checking your browser" in content.lower():
                        await asyncio.sleep(1)
                    else:
                        break

                # Wait additional time for dynamic content
                await asyncio.sleep(2)

                # Wait for optional selector
                if wait_for_selector:
                    await page.wait_for_selector(wait_for_selector, timeout=10000)

                # Get page title
                title = await page.title()

                # Get main content - try common content selectors
                content_selectors = [
                    "main",
                    "article",
                    "#content",
                    "#main-content",
                    ".content",
                    ".main-content",
                    "#bodyContent",
                    ".page-content",
                ]

                html_content = None
                for selector in content_selectors:
                    try:
                        element = await page.query_selector(selector)
                        if element:
                            html_content = await element.inner_html()
                            break
                    except Exception:
                        continue

                # Fallback to body if no content selector found
                if not html_content:
                    html_content = await page.content()
                    # Try to extract just the body
                    body = await page.query_selector("body")
                    if body:
                        html_content = await body.inner_html()

                # Convert HTML to markdown
                markdown = self._h2t.handle(html_content)

                # Clean up markdown
                markdown = self._clean_markdown(markdown)

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
                    html=html_content,
                    title=title,
                )

            finally:
                await page.close()
                await context.close()

        except Exception as e:
            return ScrapeResult(
                url=url,
                success=False,
                error=str(e),
            )

    async def scrape_pdf(self, url: str) -> ScrapeResult:
        """
        Download a PDF using Playwright to bypass bot protection.

        Note: PDF text extraction is handled by Gemini File Search,
        so we just need to download the PDF content.

        Args:
            url: URL of the PDF

        Returns:
            ScrapeResult with PDF content as bytes in markdown field
        """
        try:
            browser = await self._ensure_browser()
            # Create page with realistic user agent
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                accept_downloads=True,
            )
            page = await context.new_page()

            try:
                # Set up download handling
                pdf_content = None

                async def handle_response(response):
                    nonlocal pdf_content
                    if response.url == url and response.ok:
                        try:
                            pdf_content = await response.body()
                        except Exception:
                            pass

                page.on("response", handle_response)

                # Navigate to PDF URL
                response = await page.goto(url, timeout=60000, wait_until="load")

                # Wait a bit for any challenge pages
                for _ in range(10):
                    content = await page.content()
                    if "Verify you are human" in content or "checking your browser" in content.lower():
                        await asyncio.sleep(1)
                    else:
                        break

                # If we captured the PDF from response handler, use that
                if pdf_content and len(pdf_content) > 100:
                    # Store PDF bytes as base64 in the result for later upload
                    import base64
                    pdf_base64 = base64.b64encode(pdf_content).decode("utf-8")

                    return ScrapeResult(
                        url=url,
                        success=True,
                        markdown=f"PDF_BASE64:{pdf_base64}",  # Special marker for PDF content
                        title=url.split("/")[-1].replace(".pdf", ""),
                    )

                # Fallback: try to get the response directly
                if response and response.ok:
                    try:
                        body = await response.body()
                        if body and len(body) > 100:
                            import base64
                            pdf_base64 = base64.b64encode(body).decode("utf-8")
                            return ScrapeResult(
                                url=url,
                                success=True,
                                markdown=f"PDF_BASE64:{pdf_base64}",
                                title=url.split("/")[-1].replace(".pdf", ""),
                            )
                    except Exception:
                        pass

                return ScrapeResult(
                    url=url,
                    success=False,
                    error="Could not download PDF content",
                )

            finally:
                await page.close()
                await context.close()

        except Exception as e:
            return ScrapeResult(
                url=url,
                success=False,
                error=str(e),
            )

    def _clean_markdown(self, markdown: str) -> str:
        """Clean up markdown content."""
        lines = markdown.split("\n")
        cleaned = []

        for line in lines:
            # Skip empty lines at start
            if not cleaned and not line.strip():
                continue
            # Skip navigation/menu items (lines that are just links)
            if line.strip().startswith("[") and line.strip().endswith(")"):
                if len(line.strip()) < 50:  # Short link-only lines
                    continue
            cleaned.append(line)

        # Remove trailing empty lines
        while cleaned and not cleaned[-1].strip():
            cleaned.pop()

        return "\n".join(cleaned)


# Singleton instance for reuse
_scraper_instance: Optional[PlaywrightScraper] = None


async def get_scraper() -> PlaywrightScraper:
    """Get or create the shared scraper instance."""
    global _scraper_instance
    if _scraper_instance is None:
        _scraper_instance = PlaywrightScraper()
    return _scraper_instance


async def cleanup_scraper():
    """Cleanup the shared scraper instance."""
    global _scraper_instance
    if _scraper_instance:
        await _scraper_instance.close()
        _scraper_instance = None
