"""
Gemini File Search Tool

Upload documents to Gemini File Search Stores for RAG.
"""

import io
from dataclasses import dataclass
from typing import Optional
from google import genai
from google.genai import types


@dataclass
class UploadResult:
    """Result from uploading to Gemini File Search."""
    success: bool
    file_uri: Optional[str] = None
    document_name: Optional[str] = None
    error: Optional[str] = None


class GeminiFileSearchTool:
    """
    Gemini File Search API client.

    Manages File Search Stores and document uploads for RAG.
    """

    def __init__(self, api_key: str):
        """
        Initialize Gemini File Search tool.

        Args:
            api_key: Google Gemini API key
        """
        self.client = genai.Client(api_key=api_key)
        self._store_cache: dict[str, str] = {}  # display_name -> store_name

    async def get_or_create_store(
        self,
        display_name: str,
    ) -> tuple[str, bool]:
        """
        Get existing store or create new one.

        Args:
            display_name: Human-readable store name

        Returns:
            Tuple of (store_name, created)
        """
        # Check cache first
        if display_name in self._store_cache:
            return self._store_cache[display_name], False

        # List existing stores
        try:
            stores = list(self.client.file_search_stores.list())
            for store in stores:
                if store.display_name == display_name:
                    self._store_cache[display_name] = store.name
                    return store.name, False
        except Exception:
            pass  # Store might not exist yet

        # Create new store
        store = self.client.file_search_stores.create(
            config=types.CreateFileSearchStoreConfig(
                display_name=display_name,
            )
        )
        self._store_cache[display_name] = store.name
        return store.name, True

    async def upload_markdown(
        self,
        store_name: str,
        content: str,
        display_name: str,
        metadata: Optional[dict] = None,
    ) -> UploadResult:
        """
        Upload markdown content to a File Search Store.

        Args:
            store_name: Gemini store name (e.g., "fileSearchStores/xxx")
            content: Markdown content to upload
            display_name: Display name for the document
            metadata: Optional metadata key-value pairs (currently not used)

        Returns:
            UploadResult with file URI
        """
        try:
            # Create a file-like object from content
            content_bytes = content.encode("utf-8")
            file_obj = io.BytesIO(content_bytes)

            # Upload to store (note: custom_metadata not supported in current SDK)
            result = self.client.file_search_stores.upload_to_file_search_store(
                file=file_obj,
                file_search_store_name=store_name,
                config=types.UploadFileConfig(
                    display_name=display_name,
                    mime_type="text/markdown",
                ),
            )

            # Check if operation completed with error
            if hasattr(result, 'error') and result.error:
                return UploadResult(
                    success=False,
                    error=str(result.error),
                )

            # Get the file URI from the result
            file_uri = None
            if hasattr(result, 'name'):
                file_uri = result.name

            return UploadResult(
                success=True,
                file_uri=file_uri,
                document_name=display_name,
            )

        except Exception as e:
            return UploadResult(
                success=False,
                error=str(e),
            )

    async def upload_pdf(
        self,
        store_name: str,
        pdf_content: bytes,
        display_name: str,
        metadata: Optional[dict] = None,
    ) -> UploadResult:
        """
        Upload PDF content to a File Search Store.

        Args:
            store_name: Gemini store name
            pdf_content: PDF file content as bytes
            display_name: Display name for the document
            metadata: Optional metadata key-value pairs (currently not used)

        Returns:
            UploadResult with file URI
        """
        try:
            # Create a file-like object from PDF bytes
            file_obj = io.BytesIO(pdf_content)

            # Upload to store (note: custom_metadata not supported in current SDK)
            result = self.client.file_search_stores.upload_to_file_search_store(
                file=file_obj,
                file_search_store_name=store_name,
                config=types.UploadFileConfig(
                    display_name=display_name,
                    mime_type="application/pdf",
                ),
            )

            # Check if operation completed with error
            if hasattr(result, 'error') and result.error:
                return UploadResult(
                    success=False,
                    error=str(result.error),
                )

            # Get the file URI from the result
            file_uri = None
            if hasattr(result, 'name'):
                file_uri = result.name

            return UploadResult(
                success=True,
                file_uri=file_uri,
                document_name=display_name,
            )

        except Exception as e:
            return UploadResult(
                success=False,
                error=str(e),
            )

    async def delete_document(
        self,
        document_name: str,
    ) -> bool:
        """
        Delete a document from File Search Store.

        Args:
            document_name: Full document name (e.g., "fileSearchStores/xxx/documents/yyy")

        Returns:
            True if deleted successfully
        """
        try:
            self.client.files.delete(name=document_name)
            return True
        except Exception:
            return False

    async def list_store_documents(
        self,
        store_name: str,
    ) -> list[dict]:
        """
        List all documents in a store.

        Args:
            store_name: Gemini store name

        Returns:
            List of document info dicts
        """
        try:
            # Note: This API might need adjustment based on actual SDK
            docs = list(self.client.file_search_stores.list_documents(
                file_search_store_name=store_name
            ))
            return [
                {
                    "name": doc.name,
                    "display_name": doc.display_name,
                    "state": doc.state,
                }
                for doc in docs
            ]
        except Exception:
            return []


# =============================================================================
# Standalone Functions (for non-ADK usage)
# =============================================================================

async def upload_to_planning_store(
    api_key: str,
    content: str,
    display_name: str,
    content_type: str = "markdown",
    store_display_name: str = "Milwaukee Planning Documents",
    metadata: Optional[dict] = None,
) -> UploadResult:
    """
    Upload content to the planning documents store.

    Args:
        api_key: Gemini API key
        content: Content to upload (markdown string or bytes for PDF)
        display_name: Display name for the document
        content_type: "markdown" or "pdf"
        store_display_name: Display name of the File Search Store
        metadata: Optional metadata

    Returns:
        UploadResult
    """
    tool = GeminiFileSearchTool(api_key)

    # Get or create store
    store_name, _ = await tool.get_or_create_store(store_display_name)

    # Upload based on content type
    if content_type == "pdf":
        if isinstance(content, str):
            content = content.encode("utf-8")
        return await tool.upload_pdf(store_name, content, display_name, metadata)
    else:
        return await tool.upload_markdown(store_name, content, display_name, metadata)
