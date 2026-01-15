"use client";

/**
 * PDFViewerModal - Responsive modal for viewing PDFs with page navigation
 *
 * Features:
 * - Opens PDFs inline without navigating away
 * - Jumps to specific pages from citations
 * - Page navigation controls
 * - Responsive (full screen on mobile)
 * - Keyboard shortcuts (Escape to close, arrow keys for pages)
 */

import { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
  initialPage?: number;
}

export function PDFViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  initialPage = 1,
}: PDFViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset page when PDF changes
  useEffect(() => {
    setPageNumber(initialPage);
    setIsLoading(true);
    setError(null);
  }, [pdfUrl, initialPage]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrevPage();
          break;
        case "ArrowRight":
          goToNextPage();
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pageNumber, numPages]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    // Ensure initialPage is valid
    if (initialPage > numPages) {
      setPageNumber(1);
    }
  }, [initialPage]);

  const onDocumentLoadError = useCallback((error: Error) => {
    setError(`Failed to load PDF: ${error.message}`);
    setIsLoading(false);
  }, []);

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(2.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  const downloadPdf = () => {
    window.open(pdfUrl, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full md:w-[90vw] md:h-[90vh] md:max-w-6xl bg-white dark:bg-stone-900 md:rounded-lg shadow-2xl flex flex-col overflow-hidden border-2 border-black dark:border-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
          <h2 className="font-bold text-stone-900 dark:text-stone-100 truncate pr-4">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <button
              onClick={zoomOut}
              className="p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Zoom out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-stone-600 dark:text-stone-400 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Zoom in (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={downloadPdf}
              className="p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ml-2"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ml-2"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-stone-200 dark:bg-stone-800 flex items-start justify-center p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={downloadPdf}
                className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
              >
                Download PDF Instead
              </button>
            </div>
          )}

          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex justify-center"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-lg"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>

        {/* Footer - Page navigation */}
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className={cn(
              "p-2 rounded border-2 border-black dark:border-white transition-colors",
              pageNumber <= 1
                ? "opacity-50 cursor-not-allowed bg-stone-100 dark:bg-stone-700"
                : "bg-white dark:bg-stone-600 hover:bg-stone-100 dark:hover:bg-stone-500"
            )}
            title="Previous page (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= numPages) {
                  setPageNumber(val);
                }
              }}
              className="w-16 px-2 py-1 text-center border-2 border-black dark:border-white rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
            />
            <span className="text-stone-600 dark:text-stone-400">
              of {numPages}
            </span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className={cn(
              "p-2 rounded border-2 border-black dark:border-white transition-colors",
              pageNumber >= numPages
                ? "opacity-50 cursor-not-allowed bg-stone-100 dark:bg-stone-700"
                : "bg-white dark:bg-stone-600 hover:bg-stone-100 dark:hover:bg-stone-500"
            )}
            title="Next page (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PDFViewerModal;
