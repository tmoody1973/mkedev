import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

export const dynamic = "force-dynamic";

/**
 * Test endpoint to verify Convex connection and user sync.
 * GET /api/webhooks/clerk/test - Returns connection status
 * POST /api/webhooks/clerk/test - Creates a test user
 *
 * DELETE THIS FILE IN PRODUCTION!
 */
export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  return Response.json({
    status: "ok",
    checks: {
      NEXT_PUBLIC_CONVEX_URL: convexUrl ? "✓ Set" : "✗ Missing",
      CLERK_WEBHOOK_SECRET: webhookSecret ? "✓ Set" : "✗ Missing",
      convexUrlValue: convexUrl?.substring(0, 30) + "...",
    },
  });
}

export async function POST(req: Request) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
      return Response.json(
        { error: "NEXT_PUBLIC_CONVEX_URL not set" },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);

    // Create a test user
    const testClerkId = `test_${Date.now()}`;
    console.log(`[Test] Creating test user with ID: ${testClerkId}`);

    const result = await convex.mutation(api.users.upsertUser, {
      clerkId: testClerkId,
      email: `test-${Date.now()}@example.com`,
      firstName: "Test",
      lastName: "User",
    });

    console.log(`[Test] User created with result:`, result);

    return Response.json({
      success: true,
      message: "Test user created successfully!",
      userId: result,
      testClerkId,
      note: "Check your Convex dashboard - you should see this user in the users table",
    });
  } catch (error) {
    console.error("[Test] Error creating user:", error);
    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
