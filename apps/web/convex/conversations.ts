import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// Conversation Queries
// =============================================================================

/**
 * List all conversations for the current user, sorted by most recent.
 */
export const listForUser = query({
  args: {
    limit: v.optional(v.number()),
    starredOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject; // Clerk user ID
    const limit = args.limit ?? 50;

    let conversationsQuery;
    if (args.starredOnly) {
      conversationsQuery = ctx.db
        .query("conversations")
        .withIndex("by_userId_starred", (q) =>
          q.eq("userId", userId).eq("starred", true)
        )
        .order("desc");
    } else {
      conversationsQuery = ctx.db
        .query("conversations")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc");
    }

    const conversations = await conversationsQuery.take(limit);

    // Get message count and last message for each conversation
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .take(1);

        const messageCount = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) => q.eq("conversationId", conv._id))
          .collect();

        return {
          ...conv,
          messageCount: messageCount.length,
          lastMessage: messages[0]?.content?.substring(0, 100) || null,
          lastMessageAt: messages[0]?.timestamp || conv.createdAt,
        };
      })
    );

    // Sort by last message time
    return enrichedConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

/**
 * Get a single conversation with all its messages.
 */
export const getWithMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) {
      return null;
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_timestamp", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    return {
      ...conversation,
      messages,
    };
  },
});

/**
 * Search conversations by content (title or message content).
 */
export const search = query({
  args: {
    searchQuery: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;
    const limit = args.limit ?? 20;
    const searchLower = args.searchQuery.toLowerCase();

    // Get all user's conversations
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Filter by title match
    const titleMatches = conversations.filter((conv) =>
      conv.title.toLowerCase().includes(searchLower)
    );

    // For conversations not matching by title, check message content
    const nonTitleMatchIds = new Set(
      conversations
        .filter((conv) => !conv.title.toLowerCase().includes(searchLower))
        .map((conv) => conv._id)
    );

    const messageMatches: Id<"conversations">[] = [];
    for (const convId of nonTitleMatchIds) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", convId))
        .collect();

      const hasMatch = messages.some((msg) =>
        msg.content.toLowerCase().includes(searchLower)
      );

      if (hasMatch) {
        messageMatches.push(convId);
      }
    }

    // Combine results
    const matchingConvIds = new Set([
      ...titleMatches.map((c) => c._id),
      ...messageMatches,
    ]);

    const results = conversations
      .filter((conv) => matchingConvIds.has(conv._id))
      .slice(0, limit);

    // Enrich with last message info
    const enrichedResults = await Promise.all(
      results.map(async (conv) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .take(1);

        return {
          ...conv,
          lastMessage: messages[0]?.content?.substring(0, 100) || null,
          lastMessageAt: messages[0]?.timestamp || conv.createdAt,
        };
      })
    );

    return enrichedResults.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

// =============================================================================
// Conversation Mutations
// =============================================================================

/**
 * Create a new conversation for the current user.
 */
export const create = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      userId: identity.subject,
      title: args.title || "New Conversation",
      starred: false,
      createdAt: now,
      updatedAt: now,
    });

    return conversationId;
  },
});

/**
 * Add a message to a conversation.
 */
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    inputMode: v.optional(v.union(v.literal("text"), v.literal("voice"))),
    cards: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("zone-info"),
            v.literal("parcel-info"),
            v.literal("parcel-analysis"),
            v.literal("incentives-summary"),
            v.literal("area-plan-context"),
            v.literal("permit-process"),
            v.literal("code-citation"),
            v.literal("opportunity-list"),
            v.literal("home-listing"),
            v.literal("homes-list"),
            v.literal("commercial-property"),
            v.literal("commercial-properties-list"),
            v.literal("development-site"),
            v.literal("development-sites-list")
          ),
          data: v.any(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify conversation belongs to user
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) {
      throw new Error("Conversation not found");
    }

    // Deduplication: Check if a message with same role and content exists in the last 10 seconds
    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_timestamp", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(5);

    const now = Date.now();
    const duplicateWindow = 10000; // 10 seconds

    const isDuplicate = recentMessages.some(
      (msg) =>
        msg.role === args.role &&
        msg.content === args.content &&
        now - msg.timestamp < duplicateWindow
    );

    if (isDuplicate) {
      // Return the existing message ID instead of creating a duplicate
      const existingMsg = recentMessages.find(
        (msg) => msg.role === args.role && msg.content === args.content
      );
      console.log(`[addMessage] Skipping duplicate ${args.role} message`);
      return existingMsg?._id ?? null;
    }

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      timestamp: now,
      inputMode: args.inputMode,
      cards: args.cards,
      createdAt: now,
      updatedAt: now,
    });

    // Update conversation's updatedAt
    await ctx.db.patch(args.conversationId, { updatedAt: now });

    // Auto-update title from first user message if it's still "New Conversation"
    if (
      args.role === "user" &&
      conversation.title === "New Conversation"
    ) {
      // Generate title from first ~50 chars of message
      const autoTitle = args.content.length > 50
        ? args.content.substring(0, 50) + "..."
        : args.content;
      await ctx.db.patch(args.conversationId, { title: autoTitle });
    }

    return messageId;
  },
});

/**
 * Update conversation title.
 */
export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Toggle starred status on a conversation.
 */
export const toggleStarred = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, {
      starred: !conversation.starred,
      updatedAt: Date.now(),
    });

    return !conversation.starred;
  },
});

/**
 * Delete a conversation and all its messages.
 */
export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) {
      throw new Error("Conversation not found");
    }

    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});
