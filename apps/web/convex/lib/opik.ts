"use node";

/**
 * Opik Tracing Utilities for Convex Actions
 *
 * DISABLED: The opik package has native dependencies that don't work with
 * Convex's bundler. This is a stub implementation that provides no-op
 * functions to allow the code to run without tracing.
 *
 * To re-enable: Install opik as a dev dependency and restore the original
 * implementation with dynamic imports.
 */

// =============================================================================
// Types
// =============================================================================

export interface TraceInput {
  name: string;
  input: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[];
  threadId?: string;
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
// No-Op Trace Manager Class
// =============================================================================

/**
 * Stub implementation - all methods are no-ops.
 * Tracing is disabled due to bundler compatibility issues.
 */
export class OpikTraceManager {
  constructor() {
    // Tracing disabled - no initialization needed
  }

  startTrace(_input: TraceInput): string {
    return "disabled";
  }

  startSpan(_input: SpanInput): string {
    return "disabled";
  }

  endSpan(_spanId: string, _output: SpanOutput): void {
    // No-op
  }

  logToolExecution(_input: ToolSpanInput, _output: ToolSpanOutput): void {
    // No-op
  }

  async endTrace(_output: Record<string, unknown>): Promise<void> {
    // No-op
  }

  async flush(): Promise<void> {
    // No-op
  }

  addScore(_name: string, _value: number, _reason?: string): void {
    // No-op
  }

  isEnabled(): boolean {
    return false;
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Create a trace manager (returns stub implementation).
 */
export function createTraceManager(): OpikTraceManager {
  return new OpikTraceManager();
}

/**
 * Wrap an async function (tracing disabled, just runs the function).
 */
export async function withTrace<T>(
  _name: string,
  _input: Record<string, unknown>,
  fn: (tracer: OpikTraceManager) => Promise<T>,
  _options?: {
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<T> {
  const tracer = createTraceManager();
  return fn(tracer);
}

/**
 * Test function (always returns disabled status).
 */
export async function testOpikConnection(): Promise<{
  enabled: boolean;
  projectName: string;
  traceId: string;
  flushed: boolean;
  error?: string;
}> {
  return {
    enabled: false,
    projectName: "mkedev-civic-ai",
    traceId: "disabled",
    flushed: false,
    error: "Opik disabled - bundler compatibility issue with native dependencies",
  };
}
