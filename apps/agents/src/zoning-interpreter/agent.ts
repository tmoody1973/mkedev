/**
 * Zoning Interpreter Agent
 *
 * Main agent definition using Google ADK.
 * Helps users understand Milwaukee zoning requirements through conversation.
 */

import { LlmAgent } from '@google/adk';
import { zoningTools } from './tools/index.js';
import {
  ZONING_AGENT_INSTRUCTION,
  ZONING_AGENT_DESCRIPTION,
  ZONING_AGENT_NAME,
} from './prompts.js';

/**
 * The Zoning Interpreter Agent
 *
 * A conversational agent that helps users understand Milwaukee zoning
 * requirements by gathering context (address, use type) and providing
 * specific, grounded answers.
 */
export const zoningInterpreterAgent = new LlmAgent({
  name: ZONING_AGENT_NAME,
  description: ZONING_AGENT_DESCRIPTION,
  model: 'gemini-2.0-flash',
  instruction: ZONING_AGENT_INSTRUCTION,
  tools: zoningTools,
});

export { ZONING_AGENT_NAME, ZONING_AGENT_DESCRIPTION };
