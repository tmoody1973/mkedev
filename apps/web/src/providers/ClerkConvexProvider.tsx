"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

interface ClerkConvexProviderProps {
  children: ReactNode;
}

/**
 * Combined provider that wraps ClerkProvider around ConvexProvider
 * with Clerk authentication integration.
 *
 * ClerkProvider wraps ConvexProviderWithClerk which enables:
 * - Authenticated Convex queries/mutations
 * - User identity available in Convex functions
 * - Automatic token refresh
 */
export function ClerkConvexProvider({ children }: ClerkConvexProviderProps) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;

    // Check if URL is set
    if (!url) {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set. Convex features will not work."
      );
      return null;
    }

    // Validate URL is absolute (starts with http:// or https://)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error(
        `NEXT_PUBLIC_CONVEX_URL must be an absolute URL (got: "${url}"). Convex features will not work.`
      );
      return null;
    }

    try {
      return new ConvexReactClient(url);
    } catch (error) {
      console.error("Failed to create Convex client:", error);
      return null;
    }
  }, []);

  // If Convex URL is not configured, fall back to basic ClerkProvider
  if (!convex) {
    return (
      <ClerkProvider>
        {children}
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
