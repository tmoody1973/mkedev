/* prettier-ignore-start */
/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS FILE IS AUTOMATICALLY POPULATED BY `npx convex dev`.
 * Run `npx convex dev` to regenerate this file.
 */

import type { DataModelFromSchemaDefinition } from "convex/server";
import type schema from "../schema";

/**
 * The names of all of your Convex tables.
 */
export type TableNames = keyof DataModel;

/**
 * The type of a document stored in Convex.
 */
export type Doc<TableName extends TableNames> = DataModel[TableName]["document"];

/**
 * An identifier for a document in Convex.
 */
export type Id<TableName extends TableNames> = DataModel[TableName]["_id"];

/**
 * A type describing your Convex data model.
 *
 * This will be populated by `npx convex dev`. Until then, this is a placeholder.
 */
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
/* prettier-ignore-end */
