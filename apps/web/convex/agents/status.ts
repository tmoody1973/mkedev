/**
 * Agent Status - Real-time activity tracking for agent sessions
 *
 * Provides mutations for the agent to update its status,
 * and queries for the frontend to subscribe to status updates.
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// =============================================================================
// Types
// =============================================================================

export type AgentStatus =
  | "idle"
  | "thinking"
  | "executing_tool"
  | "generating_response"
  | "complete"
  | "error";

export interface ToolCompletion {
  name: string;
  success: boolean;
  timestamp: number;
}

// Human-readable tool names for display
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  geocode_address: "Geocoding address",
  query_zoning_at_point: "Querying zoning data",
  calculate_parking: "Calculating parking requirements",
  query_zoning_code: "Searching zoning code",
  query_area_plans: "Searching area plans",
};

// Get display name for a tool
export function getToolDisplayName(toolName: string): string {
  return TOOL_DISPLAY_NAMES[toolName] || `Running ${toolName}`;
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Start a new agent session.
 */
export const startSession = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if session already exists
    const existing = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      // Update existing session
      await ctx.db.patch(existing._id, {
        status: "thinking",
        currentTool: undefined,
        currentToolArgs: undefined,
        toolsCompleted: [],
        statusMessage: "Analyzing your question...",
        error: undefined,
        startedAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new session
    return await ctx.db.insert("agentSessions", {
      sessionId: args.sessionId,
      status: "thinking",
      toolsCompleted: [],
      statusMessage: "Analyzing your question...",
      startedAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update agent status when starting tool execution.
 */
export const startTool = mutation({
  args: {
    sessionId: v.string(),
    toolName: v.string(),
    toolArgs: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) return;

    // Build a descriptive message based on tool and args
    let statusMessage = getToolDisplayName(args.toolName);

    // Add context from args
    if (args.toolArgs) {
      if (args.toolName === "geocode_address" && args.toolArgs.address) {
        statusMessage = `Geocoding "${args.toolArgs.address}"`;
      } else if (args.toolName === "query_zoning_at_point") {
        statusMessage = "Querying zoning district at location";
      } else if (args.toolName === "calculate_parking" && args.toolArgs.use_type) {
        statusMessage = `Calculating parking for ${args.toolArgs.use_type}`;
      } else if (args.toolName === "query_zoning_code") {
        statusMessage = `Searching zoning code...`;
      } else if (args.toolName === "query_area_plans") {
        const neighborhood = args.toolArgs.neighborhood;
        statusMessage = neighborhood
          ? `Searching ${neighborhood} area plans`
          : "Searching area plans";
      }
    }

    await ctx.db.patch(session._id, {
      status: "executing_tool",
      currentTool: args.toolName,
      currentToolArgs: args.toolArgs,
      statusMessage,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update agent status when tool completes.
 */
export const completeTool = mutation({
  args: {
    sessionId: v.string(),
    toolName: v.string(),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) return;

    const toolsCompleted = [
      ...session.toolsCompleted,
      {
        name: args.toolName,
        success: args.success,
        timestamp: Date.now(),
      },
    ];

    await ctx.db.patch(session._id, {
      status: "thinking",
      currentTool: undefined,
      currentToolArgs: undefined,
      toolsCompleted,
      statusMessage: "Processing results...",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update status when generating final response.
 */
export const generatingResponse = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) return;

    await ctx.db.patch(session._id, {
      status: "generating_response",
      currentTool: undefined,
      statusMessage: "Generating response...",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark session as complete.
 */
export const completeSession = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) return;

    await ctx.db.patch(session._id, {
      status: "complete",
      currentTool: undefined,
      currentToolArgs: undefined,
      statusMessage: undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark session as errored.
 */
export const errorSession = mutation({
  args: {
    sessionId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) return;

    await ctx.db.patch(session._id, {
      status: "error",
      currentTool: undefined,
      currentToolArgs: undefined,
      statusMessage: undefined,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

// =============================================================================
// Queries
// =============================================================================

/**
 * Get current agent session status.
 * Frontend subscribes to this for real-time updates.
 */
export const getSessionStatus = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      return null;
    }

    return {
      status: session.status,
      currentTool: session.currentTool,
      currentToolArgs: session.currentToolArgs,
      toolsCompleted: session.toolsCompleted,
      statusMessage: session.statusMessage,
      error: session.error,
      startedAt: session.startedAt,
      updatedAt: session.updatedAt,
    };
  },
});

/**
 * Cleanup old sessions (can be run periodically).
 */
export const cleanupOldSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour ago

    const oldSessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_updatedAt", (q) => q.lt("updatedAt", cutoff))
      .collect();

    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
    }

    return { deleted: oldSessions.length };
  },
});
