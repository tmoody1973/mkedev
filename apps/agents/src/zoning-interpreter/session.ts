/**
 * Zoning Interpreter Session Management
 *
 * Handles session creation and agent execution using Google ADK InMemoryRunner.
 */

import { InMemoryRunner } from '@google/adk';
import { zoningInterpreterAgent } from './agent.js';

const APP_NAME = 'mke_zoning';

/**
 * Create a new InMemoryRunner instance for the Zoning Interpreter Agent.
 */
export function createRunner() {
  return new InMemoryRunner({
    agent: zoningInterpreterAgent,
    appName: APP_NAME,
  });
}

/**
 * Session context stored with each session.
 */
export interface SessionContext {
  coordinates?: {
    longitude: number;
    latitude: number;
  };
  formattedAddress?: string;
  zoningDistrict?: string;
  overlayZones?: string[];
  useType?: string;
  squareFootage?: number;
}

/**
 * Create or retrieve a session for a user.
 */
export async function getOrCreateSession(
  runner: InMemoryRunner,
  userId: string,
  sessionId?: string
) {
  const sid = sessionId || `session_${Date.now()}`;

  // Try to get existing session first
  let session = await runner.sessionService.getSession({
    appName: APP_NAME,
    userId,
    sessionId: sid,
  });

  // Create new session if not found
  if (!session) {
    session = await runner.sessionService.createSession({
      appName: APP_NAME,
      userId,
      sessionId: sid,
    });
  }

  return session;
}

/**
 * Chat response from the agent.
 */
export interface ChatResponse {
  text: string;
  author: string;
  sessionId: string;
}

/**
 * Helper to create a text part for messages.
 */
function createTextPart(text: string) {
  return { text };
}

/**
 * Send a message to the agent and get a response.
 */
export async function chat(
  runner: InMemoryRunner,
  userId: string,
  sessionId: string,
  message: string
): Promise<ChatResponse[]> {
  const userMessage = {
    parts: [createTextPart(message)],
  };

  const responses: ChatResponse[] = [];

  for await (const event of runner.runAsync({
    userId,
    sessionId,
    newMessage: userMessage,
  })) {
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if ('text' in part && part.text) {
          responses.push({
            text: part.text,
            author: event.author || 'agent',
            sessionId,
          });
        }
      }
    }
  }

  return responses;
}

/**
 * Stream chat responses from the agent.
 */
export async function* streamChat(
  runner: InMemoryRunner,
  userId: string,
  sessionId: string,
  message: string
): AsyncGenerator<ChatResponse> {
  const userMessage = {
    parts: [createTextPart(message)],
  };

  for await (const event of runner.runAsync({
    userId,
    sessionId,
    newMessage: userMessage,
  })) {
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if ('text' in part && part.text) {
          yield {
            text: part.text,
            author: event.author || 'agent',
            sessionId,
          };
        }
      }
    }
  }
}
