"use client";

/**
 * DocumentUploadCard - Upload zone, classification results, and compliance trigger
 *
 * Provides drag-and-drop file upload, real-time status tracking via Convex
 * subscription, classification result display, and an "Analyze Compliance"
 * button that kicks off the deep analysis pipeline.
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  Upload,
  FileText,
  Loader2,
  Brain,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DocumentUploadCardData,
  ParcelContextData,
} from "@/components/chat/types";

// =============================================================================
// Constants
// =============================================================================

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  site_plan: "Site Plan",
  floor_plan: "Floor Plan",
  elevation: "Elevation",
  project_narrative: "Project Narrative",
  variance_application: "Variance Application",
  conditional_use_application: "Conditional Use Application",
  traffic_study: "Traffic Study",
  environmental_assessment: "Environmental Assessment",
  survey: "Survey",
  unknown: "Unknown Document",
};

const DOCUMENT_TYPE_COLORS: Record<string, string> = {
  site_plan: "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700",
  floor_plan: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  elevation: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700",
  project_narrative: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  variance_application: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  conditional_use_application: "bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-700",
  traffic_study: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
  environmental_assessment: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700",
  survey: "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700",
  unknown: "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700",
};

// =============================================================================
// Props
// =============================================================================

export interface DocumentUploadCardProps extends DocumentUploadCardData {
  onAnalyzeCompliance?: (documentId: string, address?: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export function DocumentUploadCard({
  documentId: initialDocumentId,
  filename: initialFilename,
  status: initialStatus,
  classification: initialClassification,
  parcelContext: initialParcelContext,
  errorMessage: initialErrorMessage,
  onAnalyzeCompliance,
}: DocumentUploadCardProps) {
  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [localDocumentId, setLocalDocumentId] = useState<string | null>(
    initialDocumentId || null
  );
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [showExtractedData, setShowExtractedData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Convex hooks
  // ---------------------------------------------------------------------------
  const generateUploadUrl = useMutation(api.documents.upload.generateUploadUrl);
  const createDocument = useMutation(api.documents.upload.createDocument);
  const classifyDocument = useAction(api.documents.classify.classifyDocument);
  const analyzeCompliance = useAction(api.documents.analyze.analyzeCompliance);

  // Real-time subscription to document status
  const liveDocument = useQuery(
    api.documents.upload.get,
    localDocumentId
      ? { documentId: localDocumentId as Id<"uploadedDocuments"> }
      : "skip"
  );

  // ---------------------------------------------------------------------------
  // Derived values - prefer live data over initial props
  // ---------------------------------------------------------------------------
  const status = liveDocument?.status ?? initialStatus;
  const classification = liveDocument?.classification ?? initialClassification;
  const parcelContext: ParcelContextData | undefined = liveDocument?.parcelContext
    ? {
        address: liveDocument.parcelContext.address,
        coordinates: liveDocument.parcelContext.coordinates as [number, number] | undefined,
        zoningDistrict: liveDocument.parcelContext.zoningDistrict,
        zoningCategory: liveDocument.parcelContext.zoningCategory,
        overlayZones: liveDocument.parcelContext.overlayZones,
        incentiveZones: liveDocument.parcelContext.incentiveZones,
        areaPlan: liveDocument.parcelContext.areaPlan,
        lotSize: liveDocument.parcelContext.lotSize,
      }
    : initialParcelContext;
  const errorMessage = liveDocument?.errorMessage ?? initialErrorMessage;
  const filename = liveDocument?.filename ?? initialFilename;

  // ---------------------------------------------------------------------------
  // File validation
  // ---------------------------------------------------------------------------
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Invalid file type "${file.type}". Accepted: PDF, PNG, JPG.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File too large (${sizeMb}MB). Maximum size is 50MB.`;
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // Upload flow
  // ---------------------------------------------------------------------------
  const handleUpload = useCallback(
    async (file: File) => {
      setUploadError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setIsUploading(true);

      try {
        // Step 1: Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Step 2: PUT the file directly to Convex storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        const { storageId } = await response.json();

        // Step 3: Create document record in Convex
        const docId = await createDocument({
          storageId,
          filename: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
        });

        setLocalDocumentId(docId);

        // Step 4: Trigger classification
        await classifyDocument({ documentId: docId });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setUploadError(message);
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl, createDocument, classifyDocument]
  );

  // ---------------------------------------------------------------------------
  // Drag-and-drop handlers
  // ---------------------------------------------------------------------------
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  // ---------------------------------------------------------------------------
  // Analyze compliance handler
  // ---------------------------------------------------------------------------
  const handleAnalyzeCompliance = useCallback(async () => {
    const docId = localDocumentId || initialDocumentId;
    if (!docId) return;

    if (onAnalyzeCompliance) {
      onAnalyzeCompliance(docId, addressInput || undefined);
      return;
    }

    try {
      await analyzeCompliance({
        documentId: docId as Id<"uploadedDocuments">,
        parcelAddress: addressInput || undefined,
      });
    } catch (err) {
      console.error("[DocumentUploadCard] Analyze compliance failed:", err);
    }
  }, [
    localDocumentId,
    initialDocumentId,
    addressInput,
    onAnalyzeCompliance,
    analyzeCompliance,
  ]);

  // ---------------------------------------------------------------------------
  // Retry handler
  // ---------------------------------------------------------------------------
  const handleRetry = useCallback(async () => {
    const docId = localDocumentId || initialDocumentId;
    if (!docId) return;

    try {
      await classifyDocument({
        documentId: docId as Id<"uploadedDocuments">,
      });
    } catch (err) {
      console.error("[DocumentUploadCard] Retry classification failed:", err);
    }
  }, [localDocumentId, initialDocumentId, classifyDocument]);

  // ---------------------------------------------------------------------------
  // Status indicator
  // ---------------------------------------------------------------------------
  const renderStatusIndicator = () => {
    switch (status) {
      case "uploading":
        return (
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Uploading...</span>
          </div>
        );
      case "classifying":
        return (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Brain className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Classifying document...</span>
          </div>
        );
      case "classified":
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Classification complete</span>
          </div>
        );
      case "enriching":
        return (
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <MapPin className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">
              Enriching with parcel data...
            </span>
          </div>
        );
      case "analyzing":
        return (
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Brain className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">
              Running deep compliance analysis...
            </span>
          </div>
        );
      case "complete":
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Analysis complete</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {errorMessage || "An error occurred"}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Show upload zone if no document has been started
  // ---------------------------------------------------------------------------
  const showUploadZone =
    !localDocumentId && !initialDocumentId && !isUploading;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-sky-50 dark:bg-sky-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg border border-sky-300 dark:border-sky-700">
            <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
              {showUploadZone ? "Upload Document" : filename}
            </h3>
            {!showUploadZone && renderStatusIndicator()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Upload Zone */}
        {showUploadZone && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
              dragActive
                ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                : "border-stone-400 dark:border-stone-600 hover:border-sky-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            )}
          >
            <Upload className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto mb-3" />
            <p className="text-stone-700 dark:text-stone-300 font-medium">
              {dragActive
                ? "Drop file here"
                : "Drag and drop a document here"}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              or click to browse
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
              PDF, PNG, JPG - Max 50MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload document file"
            />
          </div>
        )}

        {/* Upload in progress */}
        {isUploading && (
          <div className="flex flex-col items-center py-6 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            <span className="text-sm text-stone-600 dark:text-stone-400">
              Uploading file...
            </span>
          </div>
        )}

        {/* Upload / validation error */}
        {uploadError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {uploadError}
            </span>
          </div>
        )}

        {/* Classification Result */}
        {classification && (
          <div className="space-y-3">
            {/* Type badge + confidence */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded border",
                  DOCUMENT_TYPE_COLORS[classification.type] ||
                    DOCUMENT_TYPE_COLORS.unknown
                )}
              >
                {DOCUMENT_TYPE_LABELS[classification.type] ||
                  classification.type}
              </span>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {Math.round(classification.confidence * 100)}% confidence
              </span>
            </div>

            {/* Summary */}
            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {classification.summary}
            </p>

            {/* Extracted Data mini-table */}
            {classification.extractedData && (
              <div>
                <button
                  onClick={() => setShowExtractedData((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                >
                  {showExtractedData ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  Extracted Data
                </button>

                {showExtractedData && (
                  <div className="mt-2 space-y-0 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                    {classification.extractedData.projectAddress && (
                      <ExtractedRow
                        label="Address"
                        value={classification.extractedData.projectAddress}
                      />
                    )}
                    {classification.extractedData.proposedUse && (
                      <ExtractedRow
                        label="Proposed Use"
                        value={classification.extractedData.proposedUse}
                      />
                    )}
                    {classification.extractedData.buildingHeight && (
                      <ExtractedRow
                        label="Height"
                        value={classification.extractedData.buildingHeight}
                      />
                    )}
                    {classification.extractedData.stories !== undefined && (
                      <ExtractedRow
                        label="Stories"
                        value={String(classification.extractedData.stories)}
                      />
                    )}
                    {classification.extractedData.unitCount !== undefined && (
                      <ExtractedRow
                        label="Units"
                        value={String(classification.extractedData.unitCount)}
                      />
                    )}
                    {classification.extractedData.squareFootage !== undefined && (
                      <ExtractedRow
                        label="Square Footage"
                        value={classification.extractedData.squareFootage.toLocaleString()}
                      />
                    )}
                    {classification.extractedData.parkingSpaces !== undefined && (
                      <ExtractedRow
                        label="Parking Spaces"
                        value={String(classification.extractedData.parkingSpaces)}
                      />
                    )}
                    {classification.extractedData.lotSize && (
                      <ExtractedRow
                        label="Lot Size"
                        value={classification.extractedData.lotSize}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Parcel Context */}
        {parcelContext?.zoningDistrict && (
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 text-xs font-mono bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded border border-sky-300 dark:border-sky-700">
              {parcelContext.zoningDistrict}
            </span>
            {parcelContext.zoningCategory && (
              <span className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded">
                {parcelContext.zoningCategory}
              </span>
            )}
            {parcelContext.overlayZones?.map((zone: string, i: number) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs font-mono bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-700"
              >
                {zone}
              </span>
            ))}
          </div>
        )}

        {/* Address input when no address was extracted */}
        {classification &&
          !classification.extractedData?.projectAddress &&
          !parcelContext?.address &&
          status === "classified" && (
            <div className="space-y-2">
              <label
                htmlFor="address-input"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300"
              >
                Project Address
              </label>
              <div className="flex gap-2">
                <input
                  id="address-input"
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Enter address or select on map"
                  className="flex-1 px-3 py-2 text-sm border-2 border-black dark:border-white rounded bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                No address detected in document. Provide one for zoning context.
              </p>
            </div>
          )}

        {/* Analyze Compliance button */}
        {status === "classified" && (
          <button
            onClick={handleAnalyzeCompliance}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold rounded-lg border-2 border-black dark:border-white shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_black] dark:hover:shadow-[6px_6px_0_0_white] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_black] dark:active:shadow-[2px_2px_0_0_white] transition-all"
          >
            <Brain className="w-5 h-5" />
            Analyze Compliance
          </button>
        )}

        {/* Error state with retry button */}
        {status === "error" && (
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg border-2 border-black dark:border-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function ExtractedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3 py-1.5 border-b border-stone-200 dark:border-stone-700 last:border-b-0 bg-stone-50 dark:bg-stone-800/50">
      <span className="text-xs text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <span className="text-xs font-medium text-stone-900 dark:text-stone-100 text-right">
        {value}
      </span>
    </div>
  );
}

export default DocumentUploadCard;
