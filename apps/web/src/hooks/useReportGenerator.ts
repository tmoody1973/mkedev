'use client';

import { useState, useCallback } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseReportGeneratorReturn {
  isGenerating: boolean;
  error: string | null;
  pdfUrl: string | null;
  generateReport: (conversationId: Id<'conversations'>) => Promise<void>;
  clearPdfUrl: () => void;
}

/**
 * Hook for generating PDF reports from conversations.
 * Uses the Hybiscus API via Convex action.
 */
export function useReportGenerator(): UseReportGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const generateReportAction = useAction(api.reports.generateReport);

  const generateReport = useCallback(
    async (conversationId: Id<'conversations'>) => {
      console.log('[useReportGenerator] Starting report generation for:', conversationId);
      setIsGenerating(true);
      setError(null);
      setPdfUrl(null);

      try {
        const result = await generateReportAction({ conversationId });
        console.log('[useReportGenerator] Result:', result);

        if (result.success && result.downloadUrl) {
          // Set the PDF URL to display in modal
          console.log('[useReportGenerator] PDF ready:', result.downloadUrl);
          setPdfUrl(result.downloadUrl);
        } else {
          const errorMsg = result.error || 'Failed to generate report';
          console.error('[useReportGenerator] Error:', errorMsg);
          setError(errorMsg);
          alert(`Report generation failed: ${errorMsg}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        console.error('[useReportGenerator] Exception:', errorMessage);
        setError(errorMessage);
        alert(`Report generation failed: ${errorMessage}`);
      } finally {
        setIsGenerating(false);
      }
    },
    [generateReportAction]
  );

  const clearPdfUrl = useCallback(() => {
    setPdfUrl(null);
  }, []);

  return {
    isGenerating,
    error,
    pdfUrl,
    generateReport,
    clearPdfUrl,
  };
}
