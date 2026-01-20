/**
 * Gemini API Actions
 *
 * Server-side actions for secure Gemini API interactions.
 * Generates ephemeral tokens for client-side Live API connections.
 */

import { action } from './_generated/server'

// ============================================================================
// Types
// ============================================================================

interface EphemeralTokenResponse {
  token: string
  expiresAt: string
  newSessionExpiresAt: string
}

interface GoogleAuthTokenResponse {
  name: string
  displayName: string
  token: string
  expireTime: string
  newSessionExpireTime: string
  httpOptions: {
    apiVersion: string
  }
}

// ============================================================================
// Ephemeral Token Generation
// ============================================================================

/**
 * Generate an ephemeral token for Gemini Live API client connections.
 *
 * Ephemeral tokens are short-lived credentials that allow secure client-side
 * connections without exposing the main API key. They expire quickly and are
 * limited to single-session use.
 *
 * Token lifetimes:
 * - Session initiation window: 2 minutes (time to start connection)
 * - Message sending window: 30 minutes (active session duration)
 *
 * @returns Ephemeral token and expiration times
 */
export const getEphemeralToken = action({
  args: {},
  handler: async (): Promise<EphemeralTokenResponse> => {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured on server')
    }

    // Calculate expiration times
    const now = new Date()
    const expireTime = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes
    const newSessionExpireTime = new Date(now.getTime() + 2 * 60 * 1000) // 2 minutes

    try {
      // Request ephemeral token from Google's auth token service
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1alpha/authTokens',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            config: {
              uses: 1, // Single session use
              expireTime: expireTime.toISOString(),
              newSessionExpireTime: newSessionExpireTime.toISOString(),
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[gemini.getEphemeralToken] API error:', errorText)
        throw new Error(`Failed to generate ephemeral token: ${response.status}`)
      }

      const data = (await response.json()) as GoogleAuthTokenResponse

      return {
        token: data.token,
        expiresAt: data.expireTime,
        newSessionExpiresAt: data.newSessionExpireTime,
      }
    } catch (error) {
      console.error('[gemini.getEphemeralToken] Error:', error)
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to generate ephemeral token'
      )
    }
  },
})

/**
 * Get the Gemini Live WebSocket URL.
 *
 * Returns the appropriate WebSocket endpoint for Gemini Live API connections.
 * The client should append the ephemeral token as a query parameter.
 */
export const getLiveWebSocketUrl = action({
  args: {},
  handler: async (): Promise<{ url: string; model: string }> => {
    // Use the latest native audio model for voice interactions
    const model = 'gemini-2.5-flash-preview-native-audio-dialog'

    return {
      url: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`,
      model,
    }
  },
})
