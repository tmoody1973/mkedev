/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents_contextCache from "../agents/contextCache.js";
import type * as agents_status from "../agents/status.js";
import type * as agents_tools from "../agents/tools.js";
import type * as agents_zoning from "../agents/zoning.js";
import type * as commercialProperties from "../commercialProperties.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as developmentSites from "../developmentSites.js";
import type * as homes from "../homes.js";
import type * as http from "../http.js";
import type * as http_planningIngestion from "../http/planningIngestion.js";
import type * as ingestion_commercialSync from "../ingestion/commercialSync.js";
import type * as ingestion_commercialSyncMutations from "../ingestion/commercialSyncMutations.js";
import type * as ingestion_corpusConfig from "../ingestion/corpusConfig.js";
import type * as ingestion_documents from "../ingestion/documents.js";
import type * as ingestion_fileSearchStores from "../ingestion/fileSearchStores.js";
import type * as ingestion_firecrawl from "../ingestion/firecrawl.js";
import type * as ingestion_gemini from "../ingestion/gemini.js";
import type * as ingestion_homesSync from "../ingestion/homesSync.js";
import type * as ingestion_homesSyncMutations from "../ingestion/homesSyncMutations.js";
import type * as ingestion_index from "../ingestion/index.js";
import type * as ingestion_planningDocuments from "../ingestion/planningDocuments.js";
import type * as ingestion_rag from "../ingestion/rag.js";
import type * as ingestion_ragV2 from "../ingestion/ragV2.js";
import type * as ingestion_trigger from "../ingestion/trigger.js";
import type * as ingestion_types from "../ingestion/types.js";
import type * as lib_opik from "../lib/opik.js";
import type * as reports from "../reports.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agents/contextCache": typeof agents_contextCache;
  "agents/status": typeof agents_status;
  "agents/tools": typeof agents_tools;
  "agents/zoning": typeof agents_zoning;
  commercialProperties: typeof commercialProperties;
  conversations: typeof conversations;
  crons: typeof crons;
  developmentSites: typeof developmentSites;
  homes: typeof homes;
  http: typeof http;
  "http/planningIngestion": typeof http_planningIngestion;
  "ingestion/commercialSync": typeof ingestion_commercialSync;
  "ingestion/commercialSyncMutations": typeof ingestion_commercialSyncMutations;
  "ingestion/corpusConfig": typeof ingestion_corpusConfig;
  "ingestion/documents": typeof ingestion_documents;
  "ingestion/fileSearchStores": typeof ingestion_fileSearchStores;
  "ingestion/firecrawl": typeof ingestion_firecrawl;
  "ingestion/gemini": typeof ingestion_gemini;
  "ingestion/homesSync": typeof ingestion_homesSync;
  "ingestion/homesSyncMutations": typeof ingestion_homesSyncMutations;
  "ingestion/index": typeof ingestion_index;
  "ingestion/planningDocuments": typeof ingestion_planningDocuments;
  "ingestion/rag": typeof ingestion_rag;
  "ingestion/ragV2": typeof ingestion_ragV2;
  "ingestion/trigger": typeof ingestion_trigger;
  "ingestion/types": typeof ingestion_types;
  "lib/opik": typeof lib_opik;
  reports: typeof reports;
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
