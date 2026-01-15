/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents_status from "../agents/status.js";
import type * as agents_tools from "../agents/tools.js";
import type * as agents_zoning from "../agents/zoning.js";
import type * as crons from "../crons.js";
import type * as ingestion_corpusConfig from "../ingestion/corpusConfig.js";
import type * as ingestion_documents from "../ingestion/documents.js";
import type * as ingestion_fileSearchStores from "../ingestion/fileSearchStores.js";
import type * as ingestion_firecrawl from "../ingestion/firecrawl.js";
import type * as ingestion_gemini from "../ingestion/gemini.js";
import type * as ingestion_index from "../ingestion/index.js";
import type * as ingestion_rag from "../ingestion/rag.js";
import type * as ingestion_ragV2 from "../ingestion/ragV2.js";
import type * as ingestion_trigger from "../ingestion/trigger.js";
import type * as ingestion_types from "../ingestion/types.js";
import type * as lib_opik from "../lib/opik.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agents/status": typeof agents_status;
  "agents/tools": typeof agents_tools;
  "agents/zoning": typeof agents_zoning;
  crons: typeof crons;
  "ingestion/corpusConfig": typeof ingestion_corpusConfig;
  "ingestion/documents": typeof ingestion_documents;
  "ingestion/fileSearchStores": typeof ingestion_fileSearchStores;
  "ingestion/firecrawl": typeof ingestion_firecrawl;
  "ingestion/gemini": typeof ingestion_gemini;
  "ingestion/index": typeof ingestion_index;
  "ingestion/rag": typeof ingestion_rag;
  "ingestion/ragV2": typeof ingestion_ragV2;
  "ingestion/trigger": typeof ingestion_trigger;
  "ingestion/types": typeof ingestion_types;
  "lib/opik": typeof lib_opik;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
