/**
 * Convex Auth Configuration
 * Configures JWT validation for Clerk authentication.
 *
 * SETUP REQUIRED:
 * 1. Go to Clerk Dashboard > JWT Templates
 * 2. Create a new template with name "convex"
 * 3. Use the Convex preset or configure manually
 *
 * The domain matches your Clerk Frontend API URL.
 */
export default {
  providers: [
    {
      // Clerk issuer domain (from publishable key: pk_test_aGFwcHktZmluY2gtNDQuY2xlcmsuYWNjb3VudHMuZGV2JA)
      domain: "https://happy-finch-44.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
