import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/**
 * Manual sync endpoint - syncs the currently logged-in user to Convex.
 * GET /api/webhooks/clerk/sync - Syncs current user to Convex
 *
 * This bypasses webhooks entirely and directly syncs the authenticated user.
 */
export async function GET() {
  try {
    // Get the current user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Not authenticated. Please sign in first." },
        { status: 401 }
      );
    }

    const user = await currentUser();

    if (!user) {
      return Response.json(
        { error: "Could not fetch user details from Clerk" },
        { status: 500 }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return Response.json(
        { error: "NEXT_PUBLIC_CONVEX_URL not set" },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);

    // Get primary email
    const primaryEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    );

    console.log(`[Manual Sync] Syncing user ${user.id} (${primaryEmail?.emailAddress})`);

    // Sync to Convex
    const result = await convex.mutation(api.users.upsertUser, {
      clerkId: user.id,
      email: primaryEmail?.emailAddress ?? "",
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
    });

    console.log(`[Manual Sync] User synced successfully:`, result);

    return Response.json({
      success: true,
      message: "User synced to Convex!",
      user: {
        clerkId: user.id,
        email: primaryEmail?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        convexId: result,
      },
    });
  } catch (error) {
    console.error("[Manual Sync] Error:", error);
    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
