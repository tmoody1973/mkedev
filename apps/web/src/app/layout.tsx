import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { ClerkConvexProvider } from "@/providers/ClerkConvexProvider";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MKE.dev - Milwaukee Civic Intelligence",
  description:
    "Voice-first AI-powered civic intelligence platform for Milwaukee real estate development",
};

/**
 * Root layout with providers properly nested:
 * - ClerkConvexProvider (auth + database)
 *   - AppProviders (theme + map context)
 *     - Page content
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ClerkConvexProvider>
          <AppProviders>{children}</AppProviders>
        </ClerkConvexProvider>
      </body>
    </html>
  );
}
