/**
 * Simple test script to verify Opik connection
 */

import { Opik, flushAll } from "opik";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function testOpik() {
  console.log("Testing Opik connection...");
  console.log("API Key:", process.env.OPIK_API_KEY ? "SET" : "NOT SET");
  console.log("API URL:", process.env.OPIK_URL_OVERRIDE);
  console.log("Project:", process.env.OPIK_PROJECT_NAME);
  console.log("Workspace:", process.env.OPIK_WORKSPACE_NAME);

  const client = new Opik({
    apiKey: process.env.OPIK_API_KEY,
    apiUrl: process.env.OPIK_URL_OVERRIDE,
    projectName: process.env.OPIK_PROJECT_NAME || "mkedev-civic-ai",
    workspaceName: process.env.OPIK_WORKSPACE_NAME || "tmoody1973",
  });

  console.log("\nCreating test trace...");

  const trace = client.trace({
    name: "test-trace",
    input: { message: "Hello from MKE.dev!" },
    metadata: { test: true, timestamp: new Date().toISOString() },
    tags: ["test", "verification"],
  });

  console.log("Trace ID:", trace.data.id);

  // Add a span
  const span = trace.span({
    name: "test-span",
    type: "general",
    input: { action: "testing" },
  });

  span.update({
    output: { result: "success" },
  });
  span.end();

  // End trace
  trace.update({
    output: { status: "completed", message: "Test successful!" },
  });
  trace.end();

  console.log("\nFlushing to Opik...");
  await flushAll();

  console.log("Done! Check your Opik dashboard at:");
  console.log("https://www.comet.com/opik/tmoody1973");
}

testOpik().catch(console.error);
