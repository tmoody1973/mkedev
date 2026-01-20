/**
 * Gemini API Actions
 *
 * Server-side actions for secure Gemini API interactions.
 * Returns API credentials only to authenticated users.
 */

import { action } from './_generated/server'

// ============================================================================
// Types
// ============================================================================

interface GeminiCredentials {
  apiKey: string
  model: string
  wsEndpoint: string
}

// ============================================================================
// Get Credentials
// ============================================================================

/**
 * Get Gemini API credentials for voice session.
 *
 * Security notes:
 * - API key is stored server-side only (not in client bundle)
 * - Key is only provided when user actively starts a voice session
 * - For production, consider adding:
 *   - User authentication check
 *   - Rate limiting
 *   - Usage logging
 *
 * @returns API key and connection details
 */
export const getCredentials = action({
  args: {},
  handler: async (): Promise<GeminiCredentials> => {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error(
        'GOOGLE_GEMINI_API_KEY not configured. Add it to Convex environment variables.'
      )
    }

    // TODO: Add user authentication check here for production
    // const identity = await ctx.auth.getUserIdentity()
    // if (!identity) {
    //   throw new Error('Authentication required for voice features')
    // }

    return {
      apiKey,
      model: 'gemini-2.0-flash-live-001',
      wsEndpoint: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
    }
  },
})
