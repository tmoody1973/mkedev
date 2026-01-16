"""
Opik Observability for Planning Ingestion Agent

Provides tracing and metrics for the agent's operations.
"""

import os
import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any, Optional
from functools import wraps

# Try to import opik, but make it optional
try:
    import opik
    from opik import track, opik_context
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False
    track = None
    opik_context = None


@dataclass
class SpanMetrics:
    """Metrics for a single span."""
    start_time: float = 0.0
    end_time: float = 0.0
    duration_ms: float = 0.0
    success: bool = True
    error: Optional[str] = None
    metadata: dict = field(default_factory=dict)


class ObservabilityManager:
    """
    Manages Opik observability for the planning ingestion agent.

    Features:
    - Trace creation and management
    - Span tracking for sub-operations
    - Metrics collection
    - Graceful degradation when Opik is unavailable
    """

    def __init__(self):
        """Initialize the observability manager."""
        self.enabled = OPIK_AVAILABLE and bool(os.getenv("OPIK_API_KEY"))
        self.project_name = os.getenv("OPIK_PROJECT_NAME", "mkedev-planning-ingestion")

        if self.enabled:
            try:
                opik.configure(
                    api_key=os.getenv("OPIK_API_KEY"),
                    workspace=os.getenv("OPIK_WORKSPACE"),
                )
            except Exception as e:
                print(f"Warning: Failed to configure Opik: {e}")
                self.enabled = False

    @contextmanager
    def trace_sync_operation(
        self,
        operation_name: str,
        source_id: str,
        metadata: Optional[dict] = None,
    ):
        """
        Context manager for tracing a sync operation.

        Args:
            operation_name: Name of the operation (e.g., "sync_source")
            source_id: ID of the source being synced
            metadata: Additional metadata to attach

        Yields:
            SpanMetrics object to record metrics
        """
        metrics = SpanMetrics(start_time=time.time())

        try:
            if self.enabled:
                with opik_context.get_current_span_data() if opik_context else nullcontext():
                    yield metrics
            else:
                yield metrics
        except Exception as e:
            metrics.success = False
            metrics.error = str(e)
            raise
        finally:
            metrics.end_time = time.time()
            metrics.duration_ms = (metrics.end_time - metrics.start_time) * 1000

            if self.enabled:
                self._record_metrics(operation_name, source_id, metrics, metadata)

    def _record_metrics(
        self,
        operation_name: str,
        source_id: str,
        metrics: SpanMetrics,
        metadata: Optional[dict] = None,
    ):
        """Record metrics to Opik."""
        if not self.enabled:
            return

        try:
            # Log as a trace with spans
            trace_data = {
                "name": f"planning-ingestion/{operation_name}",
                "input": {"source_id": source_id},
                "output": {
                    "success": metrics.success,
                    "duration_ms": metrics.duration_ms,
                    "error": metrics.error,
                },
                "metadata": {
                    **(metadata or {}),
                    **metrics.metadata,
                },
            }

            # In a real implementation, this would use the Opik SDK
            # to create proper traces and spans
            pass

        except Exception as e:
            # Don't fail the operation if metrics recording fails
            print(f"Warning: Failed to record metrics: {e}")

    def track_firecrawl_call(
        self,
        url: str,
        content_type: str,
        success: bool,
        duration_ms: float,
        error: Optional[str] = None,
    ):
        """Track a Firecrawl API call."""
        if not self.enabled:
            return

        try:
            # Record Firecrawl metrics
            pass
        except Exception:
            pass

    def track_gemini_upload(
        self,
        document_name: str,
        content_size: int,
        success: bool,
        duration_ms: float,
        error: Optional[str] = None,
    ):
        """Track a Gemini File Search upload."""
        if not self.enabled:
            return

        try:
            # Record Gemini upload metrics
            pass
        except Exception:
            pass

    def track_convex_call(
        self,
        operation: str,
        success: bool,
        duration_ms: float,
        error: Optional[str] = None,
    ):
        """Track a Convex API call."""
        if not self.enabled:
            return

        try:
            # Record Convex metrics
            pass
        except Exception:
            pass


# Null context manager for when Opik is not available
@contextmanager
def nullcontext():
    """A null context manager that does nothing."""
    yield


# =============================================================================
# Decorators for easy instrumentation
# =============================================================================

def trace_operation(operation_name: str):
    """
    Decorator to trace an async function.

    Args:
        operation_name: Name of the operation for tracing
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            manager = ObservabilityManager()

            # Extract source_id from kwargs or args
            source_id = kwargs.get("source_id", "unknown")
            if not source_id and len(args) > 1:
                source_id = getattr(args[1], "id", "unknown")

            with manager.trace_sync_operation(
                operation_name=operation_name,
                source_id=source_id,
            ) as metrics:
                result = await func(*args, **kwargs)
                metrics.metadata["result_type"] = type(result).__name__
                return result

        return wrapper
    return decorator


# =============================================================================
# Global instance
# =============================================================================

_observability_manager: Optional[ObservabilityManager] = None


def get_observability_manager() -> ObservabilityManager:
    """Get or create the global observability manager."""
    global _observability_manager
    if _observability_manager is None:
        _observability_manager = ObservabilityManager()
    return _observability_manager


# =============================================================================
# Convenience functions
# =============================================================================

def log_sync_start(source_id: str, source_url: str):
    """Log the start of a sync operation."""
    manager = get_observability_manager()
    if manager.enabled:
        print(f"[TRACE] Starting sync: {source_id}")


def log_sync_complete(
    source_id: str,
    action: str,
    success: bool,
    duration_ms: float,
):
    """Log the completion of a sync operation."""
    manager = get_observability_manager()
    status = "OK" if success else "FAIL"
    print(f"[TRACE] Sync {status}: {source_id} ({action}) - {duration_ms:.0f}ms")


def log_error(source_id: str, error: str):
    """Log an error during sync."""
    manager = get_observability_manager()
    print(f"[ERROR] {source_id}: {error}")
