/**
 * MKE.dev Agents
 *
 * Multi-agent system for Milwaukee civic intelligence.
 */

import 'dotenv/config';

// Export Zoning Interpreter Agent
export * from './zoning-interpreter/index.js';

// Simple CLI test
async function main() {
  const { createRunner, getOrCreateSession, chat } = await import('./zoning-interpreter/index.js');

  console.log('🏛️  Milwaukee Zoning Interpreter Agent');
  console.log('=====================================\n');

  // Check for required environment variables
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!mapboxToken) {
    console.warn('⚠️  MAPBOX_ACCESS_TOKEN not set - geocoding will fail');
  }
  if (!geminiKey) {
    console.error('❌ GOOGLE_GEMINI_API_KEY not set - agent cannot run');
    process.exit(1);
  }

  console.log('✅ Environment configured\n');

  // Create runner and session
  const runner = createRunner();
  const userId = 'test-user';
  const session = await getOrCreateSession(runner, userId);

  console.log(`📝 Session created: ${session.id}\n`);

  // Test conversation
  const testMessages = [
    'What parking do I need for a restaurant?',
    '500 N Water St, about 2500 square feet',
  ];

  for (const message of testMessages) {
    console.log(`👤 User: ${message}\n`);

    try {
      const responses = await chat(runner, userId, session.id, message);

      for (const response of responses) {
        console.log(`🤖 Agent: ${response.text}\n`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    console.log('---\n');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
