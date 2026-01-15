"use node";

/**
 * Opik Tracing Utilities for Convex Actions
 *
 * Provides observability for LLM agents and tool executions.
 * Uses the Opik TypeScript SDK for trace creation and span logging.
 *
 * @see https://www.comet.com/docs/opik
 */

import { Opik, type Trace, type Span } from "opik";

// =============================================================================
// Configuration
// =============================================================================

const PROJECT_NAME = "mkedev-civic-ai";

interface OpikConfig {
  apiKey?: string;
  apiUrl?: string;
  workspaceName?: string;
  projectName?: string;
}

function getOpikConfig(): OpikConfig {
  return {
    apiKey: process.env.OPIK_API_KEY,
    apiUrl: process.env.OPIK_URL_OVERRIDE || "https://www.comet.com/opik/api",
    workspaceName: process.env.OPIK_WORKSPACE_NAME || "default",
    projectName: process.env.OPIK_PROJECT_NAME || PROJECT_NAME,
  };
}

function isOpikEnabled(): boolean {
  const config = getOpikConfig();
  return !!config.apiKey;
}

// =============================================================================
// Types
// =============================================================================

export interface TraceInput {
  name: string;
  input: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[];
  threadId?: string; // For grouping conversation turns
}

export interface SpanInput {
  name: string;
  input: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SpanOutput {
  output: Record<string, unknown>;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  model?: string;
  provider?: string;
}

export interface ToolSpanInput {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolSpanOutput {
  result: Record<string, unknown>;
  durationMs?: number;
}

// =============================================================================
// Trace Manager Class
// =============================================================================

/**
 * Manages Opik traces for a single request lifecycle.
 * Create one instance per Convex action execution.
 */
export class OpikTraceManager {
  private client: Opik | null = null;
  private trace: Trace | null = null;
  private spans: Map<string, Span> = new Map();
  private enabled: boolean;
  private projectName: string;

  constructor() {
    const config = getOpikConfig();
    this.enabled = isOpikEnabled();
    this.projectName = config.projectName || PROJECT_NAME;

    if (this.enabled && config.apiKey) {
      console.log(`[Opik] Initializing client for project: ${this.projectName}`);
      this.client = new Opik({
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
        projectName: this.projectName,
        workspaceName: config.workspaceName,
      });
    } else {
      console.log("[Opik] Tracing disabled - no API key configured");
    }
  }

  /**
   * Start a new trace for an agent interaction.
   */
  startTrace(input: TraceInput): string {
    if (!this.enabled || !this.client) {
      return "disabled";
    }

    try {
      // Build trace config with optional threadId for conversations
      const traceConfig: {
        name: string;
        input: Record<string, unknown>;
        metadata: Record<string, unknown>;
        tags: string[];
        threadId?: string;
      } = {
        name: input.name,
        input: input.input,
        metadata: {
          ...input.metadata,
          project: this.projectName,
          timestamp: new Date().toISOString(),
        },
        tags: input.tags || [],
      };

      // Add threadId for conversation grouping if provided
      if (input.threadId) {
        traceConfig.threadId = input.threadId;
      }

      this.trace = this.client.trace(traceConfig);

      console.log(`[Opik] Started trace: ${input.name} (${this.trace.data.id})${input.threadId ? ` thread: ${input.threadId}` : ""}`);
      return this.trace.data.id;
    } catch (error) {
      console.warn("[Opik] Failed to start trace:", error);
      return "error";
    }
  }

  /**
   * Start a span within the current trace (e.g., for an LLM call).
   */
  startSpan(input: SpanInput): string {
    if (!this.enabled || !this.trace) {
      return "disabled";
    }

    try {
      const span = this.trace.span({
        name: input.name,
        input: input.input,
        metadata: input.metadata,
      });

      const spanId = span.data.id;
      this.spans.set(spanId, span);
      return spanId;
    } catch (error) {
      console.warn("[Opik] Failed to start span:", error);
      return "error";
    }
  }

  /**
   * End a span with output data.
   */
  endSpan(spanId: string, output: SpanOutput): void {
    if (!this.enabled || spanId === "disabled" || spanId === "error") {
      return;
    }

    const span = this.spans.get(spanId);
    if (!span) {
      console.warn(`[Opik] Span ${spanId} not found`);
      return;
    }

    try {
      // Build usage record with only defined values
      let usageRecord: Record<string, number> | undefined;
      if (output.usage) {
        usageRecord = {};
        if (output.usage.promptTokens !== undefined) {
          usageRecord.prompt_tokens = output.usage.promptTokens;
        }
        if (output.usage.completionTokens !== undefined) {
          usageRecord.completion_tokens = output.usage.completionTokens;
        }
        if (output.usage.totalTokens !== undefined) {
          usageRecord.total_tokens = output.usage.totalTokens;
        }
      }

      // Update span with output data
      span.update({
        output: output.output,
        usage: usageRecord,
        model: output.model,
        provider: output.provider,
      });

      // Mark span as ended
      span.end();
      this.spans.delete(spanId);
    } catch (error) {
      console.warn("[Opik] Failed to end span:", error);
    }
  }

  /**
   * Log a tool execution as a span.
   */
  logToolExecution(input: ToolSpanInput, output: ToolSpanOutput): void {
    if (!this.enabled || !this.trace) {
      return;
    }

    try {
      const span = this.trace.span({
        name: `tool:${input.name}`,
        input: input.args,
        metadata: {
          toolName: input.name,
          type: "tool_execution",
        },
      });

      span.update({
        output: output.result,
        metadata: {
          durationMs: output.durationMs,
        },
      });

      span.end();
    } catch (error) {
      console.warn("[Opik] Failed to log tool execution:", error);
    }
  }

  /**
   * End the trace with final output.
   */
  async endTrace(output: Record<string, unknown>): Promise<void> {
    if (!this.enabled || !this.trace) {
      return;
    }

    try {
      // Update trace with output
      this.trace.update({
        output,
      });

      // Mark trace as ended
      this.trace.end();

      // Flush to ensure all data is sent
      await this.flush();
    } catch (error) {
      console.warn("[Opik] Failed to end trace:", error);
    }
  }

  /**
   * Flush pending traces to Opik.
   * Call this before the Convex action completes.
   */
  async flush(): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      console.log("[Opik] Flushing traces to server...");
      await this.client.flush();
      console.log("[Opik] Flush complete");
    } catch (error) {
      console.warn("[Opik] Failed to flush:", error);
    }
  }

  /**
   * Add a feedback score to the current trace.
   */
  addScore(name: string, value: number, reason?: string): void {
    if (!this.enabled || !this.trace) {
      return;
    }

    try {
      this.trace.score({
        name,
        value,
        reason,
      });
    } catch (error) {
      console.warn("[Opik] Failed to add score:", error);
    }
  }

  /**
   * Check if tracing is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Create a trace manager for use in a Convex action.
 */
export function createTraceManager(): OpikTraceManager {
  return new OpikTraceManager();
}

/**
 * Wrap an async function with Opik tracing.
 * Useful for tracing entire agent interactions.
 */
export async function withTrace<T>(
  name: string,
  input: Record<string, unknown>,
  fn: (tracer: OpikTraceManager) => Promise<T>,
  options?: {
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<T> {
  const tracer = createTraceManager();

  tracer.startTrace({
    name,
    input,
    tags: options?.tags,
    metadata: options?.metadata,
  });

  try {
    const result = await fn(tracer);

    await tracer.endTrace({
      success: true,
      result: typeof result === "object" ? result : { value: result },
    });

    return result;
  } catch (error) {
    await tracer.endTrace({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Simple test function to verify Opik SDK is working.
 * Returns diagnostic information about the connection.
 */
export async function testOpikConnection(): Promise<{
  enabled: boolean;
  projectName: string;
  traceId: string;
  flushed: boolean;
  error?: string;
}> {
  const config = getOpikConfig();
  const result = {
    enabled: isOpikEnabled(),
    projectName: config.projectName || PROJECT_NAME,
    traceId: "none",
    flushed: false,
    error: undefined as string | undefined,
  };

  if (!result.enabled) {
    result.error = "OPIK_API_KEY not set";
    return result;
  }

  try {
    const client = new Opik({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      projectName: result.projectName,
      workspaceName: config.workspaceName,
    });

    console.log("[Opik Test] Creating test trace...");
    const trace = client.trace({
      name: "opik-connection-test",
      input: { test: true, timestamp: new Date().toISOString() },
      output: { status: "success", message: "Connection test passed" },
      tags: ["test", "connection-check"],
    });

    result.traceId = trace.data.id;
    console.log(`[Opik Test] Trace created: ${result.traceId}`);

    trace.end();
    console.log("[Opik Test] Trace ended, flushing...");

    await client.flush();
    result.flushed = true;
    console.log("[Opik Test] Flush complete");

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.error("[Opik Test] Error:", result.error);
    return result;
  }
}
