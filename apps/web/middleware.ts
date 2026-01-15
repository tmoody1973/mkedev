import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Route matchers for public routes that don't require authentication.
 * All other routes will be protected and require sign-in.
 */
const isPublicRoute = createRouteMatcher([
  "/",           // Landing page is public
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

/**
 * Clerk middleware configuration for authentication.
 *
 * Behavior:
 * - Public routes: accessible without authentication
 * - Protected routes: redirect to sign-in if unauthenticated
 */
export default clerkMiddleware(async (auth, request) => {
  // If route is not public, protect it
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
