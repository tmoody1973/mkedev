/**
 * Gemini File Search Actions
 *
 * Convex actions for uploading and processing PDF documents using
 * Google Gemini's File API for RAG (Retrieval Augmented Generation).
 *
 * Note: Gemini File Search allows uploading documents that can then be
 * used as context in Gemini API calls for question answering.
 */

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
// import { internal } from "../_generated/api";

// =============================================================================
// Types
// =============================================================================

interface GeminiFileUploadResult {
  success: boolean;
  file?: {
    name: string;
    displayName: string;
    mimeType: string;
    sizeBytes: string;
    createTime: string;
    updateTime: string;
    expirationTime: string;
    sha256Hash: string;
    uri: string;
    state: "PROCESSING" | "ACTIVE" | "FAILED";
  };
  error?: string;
}

interface GeminiFileListResult {
  success: boolean;
  files?: Array<{
    name: string;
    displayName: string;
    mimeType: string;
    sizeBytes: string;
    state: string;
    uri: string;
  }>;
  error?: string;
}

// =============================================================================
// Gemini API Client
// =============================================================================

/**
 * Get the Gemini API key from environment.
 */
function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Get the base URL for Gemini File API.
 */
function getGeminiFileApiUrl(): string {
  return "https://generativelanguage.googleapis.com/v1beta/files";
}

/**
 * List all files uploaded to Gemini.
 */
async function listGeminiFiles(): Promise<GeminiFileListResult> {
  const apiKey = getGeminiApiKey();
  const url = `${getGeminiFileApiUrl()}?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Gemini API error: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      files: result.files ?? [],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get a specific file's metadata from Gemini.
 */
async function getGeminiFile(
  fileName: string
): Promise<GeminiFileUploadResult> {
  const apiKey = getGeminiApiKey();
  const url = `${getGeminiFileApiUrl()}/${fileName}?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Gemini API error: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      file: result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete a file from Gemini.
 */
async function deleteGeminiFile(fileName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const apiKey = getGeminiApiKey();
  const url = `${getGeminiFileApiUrl()}/${fileName}?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Gemini API error: ${response.status} - ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// =============================================================================
// Public Actions
// =============================================================================

/**
 * Test the Gemini API connection.
 * Lists existing files to verify API key is valid.
 */
export const testConnection = action({
  args: {},
  handler: async (): Promise<{
    success: boolean;
    message: string;
    data?: {
      fileCount: number;
      files?: string[];
    };
  }> => {
    try {
      const result = await listGeminiFiles();

      if (!result.success) {
        return {
          success: false,
          message: result.error ?? "Unknown error",
        };
      }

      const fileNames = result.files?.map((f) => f.displayName) ?? [];

      return {
        success: true,
        message: "Gemini API connection successful",
        data: {
          fileCount: result.files?.length ?? 0,
          files: fileNames.slice(0, 10), // Return first 10 file names
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to connect to Gemini API: ${errorMessage}`,
      };
    }
  },
});

/**
 * Upload a PDF document to Gemini File API.
 *
 * Note: This action expects the PDF content to be provided as a base64-encoded string.
 * In a production environment, you would typically:
 * 1. Store PDFs in Convex file storage
 * 2. Read the file and upload to Gemini
 *
 * For local development with files in the data/ directory, use uploadLocalPdf action.
 */
export const uploadPdfFromBase64 = action({
  args: {
    displayName: v.string(),
    base64Content: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),
  },
  handler: async (_ctx, args): Promise<{
    success: boolean;
    fileUri?: string;
    fileName?: string;
    error?: string;
  }> => {
    const apiKey = getGeminiApiKey();

    try {
      // Decode base64 content
      const binaryContent = Buffer.from(args.base64Content, "base64");

      // Start resumable upload session
      const initResponse = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": binaryContent.length.toString(),
            "X-Goog-Upload-Header-Content-Type": "application/pdf",
          },
          body: JSON.stringify({
            file: {
              display_name: args.displayName,
            },
          }),
        }
      );

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        return {
          success: false,
          error: `Failed to initialize upload: ${initResponse.status} - ${errorText}`,
        };
      }

      const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
      if (!uploadUrl) {
        return {
          success: false,
          error: "Failed to get upload URL from Gemini API",
        };
      }

      // Upload the file content
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": binaryContent.length.toString(),
          "X-Goog-Upload-Offset": "0",
          "X-Goog-Upload-Command": "upload, finalize",
        },
        body: binaryContent,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        return {
          success: false,
          error: `Failed to upload file: ${uploadResponse.status} - ${errorText}`,
        };
      }

      const uploadResult = await uploadResponse.json();

      // Note: Document record storage is handled by the upload-documents.ts script
      // which calls updateGeminiFile mutation after successful upload

      return {
        success: true,
        fileUri: uploadResult.file?.uri,
        fileName: uploadResult.file?.name,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Upload failed: ${errorMessage}`,
      };
    }
  },
});

/**
 * List all PDF files currently stored in Gemini.
 */
export const listUploadedFiles = action({
  args: {},
  handler: async (): Promise<{
    success: boolean;
    files?: Array<{
      name: string;
      displayName: string;
      mimeType: string;
      state: string;
      uri: string;
    }>;
    error?: string;
  }> => {
    const result = await listGeminiFiles();
    return result;
  },
});

/**
 * Get the status of a specific file.
 */
export const getFileStatus = action({
  args: {
    fileName: v.string(),
  },
  handler: async (_, args): Promise<{
    success: boolean;
    file?: {
      name: string;
      displayName: string;
      state: string;
      uri: string;
    };
    error?: string;
  }> => {
    const result = await getGeminiFile(args.fileName);

    if (!result.success || !result.file) {
      return {
        success: false,
        error: result.error ?? "File not found",
      };
    }

    return {
      success: true,
      file: {
        name: result.file.name,
        displayName: result.file.displayName,
        state: result.file.state,
        uri: result.file.uri,
      },
    };
  },
});

/**
 * Delete a file from Gemini storage.
 */
export const deleteFile = action({
  args: {
    fileName: v.string(),
  },
  handler: async (_, args): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await deleteGeminiFile(args.fileName);
  },
});

/**
 * Query Gemini with a file as context.
 * This is the main RAG query function for PDF documents.
 */
export const queryWithFile = action({
  args: {
    fileUri: v.string(),
    query: v.string(),
    modelId: v.optional(v.string()),
  },
  handler: async (_, args): Promise<{
    success: boolean;
    response?: string;
    error?: string;
  }> => {
    const apiKey = getGeminiApiKey();
    const modelId = args.modelId ?? "gemini-2.0-flash";

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    fileData: {
                      mimeType: "application/pdf",
                      fileUri: args.fileUri,
                    },
                  },
                  {
                    text: args.query,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Gemini API error: ${response.status} - ${errorText}`,
        };
      }

      const result = await response.json();
      const textResponse =
        result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      return {
        success: true,
        response: textResponse,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Query failed: ${errorMessage}`,
      };
    }
  },
});

/**
 * Query Gemini with multiple files as context.
 * Useful for queries that span multiple zoning code subchapters.
 */
export const queryWithMultipleFiles = action({
  args: {
    fileUris: v.array(v.string()),
    query: v.string(),
    modelId: v.optional(v.string()),
  },
  handler: async (_, args): Promise<{
    success: boolean;
    response?: string;
    error?: string;
  }> => {
    const apiKey = getGeminiApiKey();
    const modelId = args.modelId ?? "gemini-2.0-flash";

    try {
      // Build parts array with all files and the query
      const parts: Array<
        | { fileData: { mimeType: string; fileUri: string } }
        | { text: string }
      > = [];

      for (const fileUri of args.fileUris) {
        parts.push({
          fileData: {
            mimeType: "application/pdf",
            fileUri,
          },
        });
      }

      parts.push({ text: args.query });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Gemini API error: ${response.status} - ${errorText}`,
        };
      }

      const result = await response.json();
      const textResponse =
        result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      return {
        success: true,
        response: textResponse,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Query failed: ${errorMessage}`,
      };
    }
  },
});

/**
 * Internal action to refresh Gemini file statuses.
 * Called by cron job to check if any files have expired.
 */
export const checkFileStatuses = internalAction({
  args: {},
  handler: async (): Promise<{
    success: boolean;
    activeFiles: number;
    expiredFiles: number;
    processingFiles: number;
    errors: string[];
  }> => {
    const result = await listGeminiFiles();

    if (!result.success) {
      return {
        success: false,
        activeFiles: 0,
        expiredFiles: 0,
        processingFiles: 0,
        errors: [result.error ?? "Failed to list files"],
      };
    }

    const files = result.files ?? [];
    let activeFiles = 0;
    let expiredFiles = 0;
    let processingFiles = 0;

    for (const file of files) {
      switch (file.state) {
        case "ACTIVE":
          activeFiles++;
          break;
        case "PROCESSING":
          processingFiles++;
          break;
        default:
          expiredFiles++;
      }
    }

    return {
      success: true,
      activeFiles,
      expiredFiles,
      processingFiles,
      errors: [],
    };
  },
});
