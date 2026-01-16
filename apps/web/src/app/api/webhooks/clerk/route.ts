import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

// Force dynamic rendering for webhook routes
export const dynamic = "force-dynamic";

/**
 * Get or create the Convex HTTP client.
 * Lazily initialized to avoid build-time errors when env vars aren't set.
 */
function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}

/**
 * Clerk webhook handler for user sync with Convex.
 * Handles user.created, user.updated, and user.deleted events.
 *
 * Setup:
 * 1. Create a webhook in Clerk Dashboard pointing to /api/webhooks/clerk
 * 2. Select events: user.created, user.updated, user.deleted
 * 3. Copy the signing secret to CLERK_WEBHOOK_SECRET env var
 */
export async function POST(req: Request) {
  console.log("[Clerk Webhook] Received request");

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("[Clerk Webhook] CLERK_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  console.log("[Clerk Webhook] Secret is configured");

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("[Clerk Webhook] Missing svix headers", {
      svix_id: !!svix_id,
      svix_timestamp: !!svix_timestamp,
      svix_signature: !!svix_signature,
    });
    return new Response("Missing svix headers", { status: 400 });
  }

  console.log("[Clerk Webhook] Headers received, verifying signature...");

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with the secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log("[Clerk Webhook] Signature verified successfully");
  } catch (err) {
    console.error("[Clerk Webhook] Signature verification failed:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  // Handle the webhook event
  const eventType = evt.type;

  try {
    console.log(`[Clerk Webhook] Processing event: ${eventType}`);
    const convex = getConvexClient();
    console.log("[Clerk Webhook] Convex client created");

    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } =
          evt.data;

        const primaryEmail = email_addresses?.find(
          (e) => e.id === evt.data.primary_email_address_id
        );

        console.log(`[Clerk Webhook] Upserting user ${id} with email ${primaryEmail?.email_address}`);

        await convex.mutation(api.users.upsertUser, {
          clerkId: id,
          email: primaryEmail?.email_address ?? "",
          firstName: first_name ?? undefined,
          lastName: last_name ?? undefined,
          imageUrl: image_url ?? undefined,
        });

        console.log(`[Clerk Webhook] Successfully upserted user: ${id}`);
        break;
      }

      case "user.deleted": {
        const { id } = evt.data;

        if (id) {
          console.log(`[Clerk Webhook] Deleting user: ${id}`);
          await convex.mutation(api.users.deleteByClerkId, {
            clerkId: id,
          });
          console.log(`[Clerk Webhook] Successfully deleted user: ${id}`);
        }
        break;
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`[Clerk Webhook] Error processing ${eventType}:`, error);
    return new Response("Error processing webhook", { status: 500 });
  }

  return new Response("Webhook processed", { status: 200 });
}
