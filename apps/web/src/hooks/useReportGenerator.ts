'use client';

import { useState, useCallback } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseReportGeneratorReturn {
  isGenerating: boolean;
  error: string | null;
  generateReport: (conversationId: Id<'conversations'>) => Promise<void>;
}

/**
 * Hook for generating PDF reports from conversations.
 * Uses the Hybiscus API via Convex action.
 */
export function useReportGenerator(): UseReportGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReportAction = useAction(api.reports.generateReport);

  const generateReport = useCallback(
    async (conversationId: Id<'conversations'>) => {
      console.log('[useReportGenerator] Starting report generation for:', conversationId);
      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateReportAction({ conversationId });
        console.log('[useReportGenerator] Result:', result);

        if (result.success && result.downloadUrl) {
          // Open the PDF in a new tab for download
          console.log('[useReportGenerator] Opening PDF:', result.downloadUrl);
          window.open(result.downloadUrl, '_blank');
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

  return {
    isGenerating,
    error,
    generateReport,
  };
}
