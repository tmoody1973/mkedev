import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

/**
 * Clerk webhook handler for user events.
 * Handles user.created, user.updated, user.deleted events.
 */
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get headers for verification
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Get the body
    const payload = await request.text();

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let event: {
      type: string;
      data: {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        image_url?: string;
      };
    };

    try {
      event = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as typeof event;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    // Handle the event
    const { type, data } = event;

    switch (type) {
      case "user.deleted":
        // Delete all user's conversations when they delete their account
        await ctx.runMutation(internal.users.deleteUserData, {
          userId: data.id,
        });
        console.log(`Deleted data for user ${data.id}`);
        break;

      case "user.created":
      case "user.updated":
        // Optionally sync user profile to Convex
        // await ctx.runMutation(internal.users.upsertUser, {
        //   userId: data.id,
        //   email: data.email_addresses?.[0]?.email_address,
        //   name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        //   imageUrl: data.image_url,
        // });
        console.log(`User ${type}: ${data.id}`);
        break;

      default:
        console.log(`Unhandled webhook event: ${type}`);
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
