"""
Convex HTTP Client

HTTP client for interacting with Convex mutations from Python.
"""

import hashlib
import httpx
from dataclasses import dataclass
from typing import Optional, Any
import asyncio


@dataclass
class ConvexDocument:
    """Represents a planning document in Convex."""
    source_id: str
    source_url: str
    title: str
    content_type: str  # "html" or "pdf"
    category: str
    sync_frequency: str
    content_hash: str
    status: str
    markdown_content: Optional[str] = None
    pdf_storage_id: Optional[str] = None
    gemini_file_uri: Optional[str] = None
    error_message: Optional[str] = None


class ConvexHTTPClient:
    """
    HTTP client for Convex planning document operations.

    Uses the HTTP actions defined in convex/http/planningIngestion.ts
    """

    def __init__(self, convex_url: str, deploy_key: str):
        """
        Initialize the Convex HTTP client.

        Args:
            convex_url: Convex deployment URL (e.g., https://xxx.convex.cloud)
            deploy_key: Convex deploy key for authentication
        """
        self.base_url = convex_url.rstrip("/")
        self.deploy_key = deploy_key
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Authorization": f"Bearer {deploy_key}",
                "Content-Type": "application/json",
            },
        )

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    def _url(self, path: str) -> str:
        """Build full URL from path."""
        return f"{self.base_url}{path}"

    async def _retry_request(
        self,
        method: str,
        url: str,
        max_retries: int = 3,
        **kwargs,
    ) -> httpx.Response:
        """
        Execute HTTP request with exponential backoff retry.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Full URL
            max_retries: Maximum number of retry attempts
            **kwargs: Additional arguments for httpx request

        Returns:
            HTTP response

        Raises:
            httpx.HTTPError: If all retries fail
        """
        last_error = None

        for attempt in range(max_retries):
            try:
                response = await self.client.request(method, url, **kwargs)
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as e:
                # Don't retry 4xx errors (client errors)
                if 400 <= e.response.status_code < 500:
                    raise
                last_error = e
            except httpx.RequestError as e:
                last_error = e

            # Exponential backoff: 1s, 2s, 4s
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)

        raise last_error

    async def upsert_document(
        self,
        source_id: str,
        source_url: str,
        title: str,
        content_type: str,
        category: str,
        sync_frequency: str,
        content_hash: str,
        status: str,
        markdown_content: Optional[str] = None,
        pdf_storage_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Create or update a planning document.

        Args:
            source_id: Unique identifier for the source
            source_url: Original URL of the document
            title: Document title
            content_type: "html" or "pdf"
            category: Document category
            sync_frequency: "weekly" or "monthly"
            content_hash: MD5 hash of content for change detection
            status: Document status
            markdown_content: Markdown content (for HTML pages)
            pdf_storage_id: Convex storage ID (for PDFs)

        Returns:
            Response with success status and document ID
        """
        payload = {
            "sourceId": source_id,
            "sourceUrl": source_url,
            "title": title,
            "contentType": content_type,
            "category": category,
            "syncFrequency": sync_frequency,
            "contentHash": content_hash,
            "status": status,
        }

        if markdown_content is not None:
            payload["markdownContent"] = markdown_content
        if pdf_storage_id is not None:
            payload["pdfStorageId"] = pdf_storage_id

        response = await self._retry_request(
            "POST",
            self._url("/api/planning/documents/upsert"),
            json=payload,
        )
        return response.json()

    async def update_status(
        self,
        source_id: str,
        status: str,
        error_message: Optional[str] = None,
        gemini_file_uri: Optional[str] = None,
        file_search_store_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Update a document's status.

        Args:
            source_id: Document source ID
            status: New status
            error_message: Error message (if status is "error")
            gemini_file_uri: Gemini file URI (if uploaded)
            file_search_store_id: File search store ID

        Returns:
            Response with success status
        """
        payload = {
            "sourceId": source_id,
            "status": status,
        }

        if error_message is not None:
            payload["errorMessage"] = error_message
        if gemini_file_uri is not None:
            payload["geminiFileUri"] = gemini_file_uri
        if file_search_store_id is not None:
            payload["fileSearchStoreId"] = file_search_store_id

        response = await self._retry_request(
            "POST",
            self._url("/api/planning/documents/status"),
            json=payload,
        )
        return response.json()

    async def get_document(self, source_id: str) -> Optional[dict[str, Any]]:
        """
        Get a document by source ID.

        Args:
            source_id: Document source ID

        Returns:
            Document data or None if not found
        """
        try:
            response = await self._retry_request(
                "GET",
                self._url("/api/planning/documents"),
                params={"sourceId": source_id},
            )
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise

    async def check_content_hash(
        self,
        source_id: str,
        content_hash: str,
    ) -> dict[str, Any]:
        """
        Check if content has changed by comparing hash.

        Args:
            source_id: Document source ID
            content_hash: New content hash to compare

        Returns:
            Dict with exists, changed, and currentHash fields
        """
        response = await self._retry_request(
            "GET",
            self._url("/api/planning/documents/check-hash"),
            params={"sourceId": source_id, "contentHash": content_hash},
        )
        return response.json()

    async def list_by_frequency(
        self,
        sync_frequency: str,
    ) -> list[dict[str, Any]]:
        """
        List all documents by sync frequency.

        Args:
            sync_frequency: "weekly" or "monthly"

        Returns:
            List of documents
        """
        response = await self._retry_request(
            "GET",
            self._url("/api/planning/documents/by-frequency"),
            params={"syncFrequency": sync_frequency},
        )
        return response.json()


def compute_content_hash(content: str | bytes) -> str:
    """
    Compute MD5 hash of content for change detection.

    Args:
        content: String or bytes content to hash

    Returns:
        MD5 hash as hex string
    """
    if isinstance(content, str):
        content = content.encode("utf-8")
    return hashlib.md5(content).hexdigest()
