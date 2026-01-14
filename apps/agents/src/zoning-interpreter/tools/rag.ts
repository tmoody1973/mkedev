/**
 * RAG Query Tool
 *
 * Queries the Milwaukee zoning code documents using the Convex RAG system.
 * Enhances queries with zoning context for more accurate answers.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Result type for RAG queries
 */
export interface RAGQueryResult {
  success: boolean;
  answer?: string;
  citations?: Array<{
    sourceId: string;
    sourceName: string;
  }>;
  confidence?: number;
  error?: string;
}

/**
 * Query the RAG system with context.
 */
async function queryRAG(params: {
  question: string;
  zoningDistrict?: string;
  useType?: string;
  squareFootage?: number;
}): Promise<RAGQueryResult> {
  const { question, zoningDistrict, useType, squareFootage } = params;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

  if (!convexUrl) {
    return {
      success: false,
      error: 'Convex URL not configured',
    };
  }

  // Build context-enhanced question
  let enhancedQuestion = question;

  if (zoningDistrict) {
    enhancedQuestion = `For the ${zoningDistrict} zoning district: ${question}`;
  }

  if (useType) {
    enhancedQuestion += ` The use type is ${useType}.`;
  }

  if (squareFootage) {
    enhancedQuestion += ` The building is ${squareFootage.toLocaleString()} square feet.`;
  }

  try {
    // Call Convex RAG action via HTTP
    const response = await fetch(`${convexUrl}/api/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'ingestion/rag:queryDocuments',
        args: {
          question: enhancedQuestion,
          category: 'zoning-codes',
          maxDocuments: 5,
        },
      }),
    });

    if (!response.ok) {
      // If the API action endpoint doesn't work, try a direct query approach
      // For now, return a helpful error
      return {
        success: false,
        error: `RAG query failed: ${response.status}. The RAG system may need to be accessed through a different method.`,
      };
    }

    const result = await response.json();

    if (result.success && result.response) {
      return {
        success: true,
        answer: result.response.answer,
        citations: result.response.citations || [],
        confidence: result.response.confidence,
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'RAG query returned no results',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `RAG query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * FunctionTool for querying RAG in the agent.
 */
export const queryRAGTool = new FunctionTool({
  name: 'query_zoning_code',
  description: 'Query the Milwaukee zoning code documents for detailed regulations, permitted uses, dimensional standards, and other zoning requirements. Use this to answer specific questions about zoning rules.',
  parameters: z.object({
    question: z.string().describe('The specific zoning question to answer'),
    zoningDistrict: z.string().optional().describe('Zoning district code for context (e.g., RS6, DC, LB2)'),
    useType: z.string().optional().describe('Type of use for context (e.g., restaurant, residential)'),
    squareFootage: z.number().optional().describe('Building square footage if relevant'),
  }),
  execute: queryRAG,
});

export { queryRAG };
