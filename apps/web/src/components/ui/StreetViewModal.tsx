"use client";

/**
 * StreetViewModal - Interactive Google Street View modal
 *
 * Features:
 * - Full interactive Street View panorama
 * - User can navigate, pan, zoom
 * - Screenshot button captures current view via Static API
 * - Keyboard shortcuts (Escape to close)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Camera, Download, Loader2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreetViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  coordinates?: { latitude: number; longitude: number } | [number, number];
}

// Street View panorama interface
interface StreetViewPanoramaInstance {
  getPosition: () => { lat: () => number; lng: () => number };
  getPov: () => { heading: number; pitch: number };
  getZoom: () => number;
  setPosition: (pos: { lat: number; lng: number }) => void;
  addListener: (event: string, callback: () => void) => void;
}

// Declare google types
declare global {
  interface Window {
    google?: {
      maps: {
        StreetViewPanorama: new (
          element: HTMLElement,
          options: {
            position: { lat: number; lng: number };
            pov: { heading: number; pitch: number };
            zoom: number;
            addressControl: boolean;
            showRoadLabels: boolean;
            motionTracking: boolean;
            motionTrackingControl: boolean;
          }
        ) => StreetViewPanoramaInstance;
        StreetViewService: new () => {
          getPanorama: (
            request: { location: { lat: number; lng: number }; radius: number },
            callback: (data: unknown, status: string) => void
          ) => void;
        };
        StreetViewStatus: {
          OK: string;
        };
      };
    };
  }
}

export function StreetViewModal({
  isOpen,
  onClose,
  address,
  coordinates,
}: StreetViewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<StreetViewPanoramaInstance | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Parse coordinates
  const getLatLng = useCallback(() => {
    if (!coordinates) return null;
    if (Array.isArray(coordinates)) {
      // [lng, lat] format
      return { lat: coordinates[1], lng: coordinates[0] };
    }
    return { lat: coordinates.latitude, lng: coordinates.longitude };
  }, [coordinates]);

  // Load Google Maps script
  useEffect(() => {
    if (!isOpen || !apiKey) return;

    const scriptId = "google-maps-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initStreetView = () => {
      if (!streetViewRef.current || !window.google) return;

      const latLng = getLatLng();
      if (!latLng) {
        setError("No coordinates available");
        setIsLoading(false);
        return;
      }

      try {
        const google = window.google;
        if (!google) {
          setError("Google Maps not loaded");
          setIsLoading(false);
          return;
        }

        // Check if Street View is available at this location
        const streetViewService = new google.maps.StreetViewService();
        streetViewService.getPanorama(
          { location: latLng, radius: 50 },
          (_data, status) => {
            if (status === google.maps.StreetViewStatus.OK) {
              const panorama = new google.maps.StreetViewPanorama(
                streetViewRef.current!,
                {
                  position: latLng,
                  pov: { heading: 0, pitch: 0 },
                  zoom: 1,
                  addressControl: true,
                  showRoadLabels: true,
                  motionTracking: false,
                  motionTrackingControl: true,
                }
              );
              panoramaRef.current = panorama;
              setIsLoading(false);
            } else {
              setError("Street View not available at this location");
              setIsLoading(false);
            }
          }
        );
      } catch (err) {
        setError("Failed to initialize Street View");
        setIsLoading(false);
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=streetView`;
      script.async = true;
      script.defer = true;
      script.onload = initStreetView;
      script.onerror = () => {
        setError("Failed to load Google Maps");
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else if (window.google) {
      initStreetView();
    } else {
      script.addEventListener("load", initStreetView);
    }
  }, [isOpen, apiKey, getLatLng]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (capturedImageUrl) {
          setCapturedImageUrl(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, capturedImageUrl]);

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

  // Capture screenshot using Static Street View API
  const captureScreenshot = useCallback(async () => {
    if (!panoramaRef.current || !apiKey) return;

    setIsCapturing(true);

    try {
      const pano = panoramaRef.current;
      const position = pano.getPosition();
      const pov = pano.getPov();
      const zoom = pano.getZoom();

      // Map Street View zoom to FOV (field of view)
      // Zoom 0 = 180 FOV, Zoom 1 = 90 FOV, Zoom 2 = 45 FOV, etc.
      const fov = 180 / Math.pow(2, zoom);

      // Build Static Street View URL
      const staticUrl = `https://maps.googleapis.com/maps/api/streetview?size=1280x720&location=${position.lat()},${position.lng()}&heading=${pov.heading}&pitch=${pov.pitch}&fov=${fov}&key=${apiKey}`;

      setCapturedImageUrl(staticUrl);
    } catch (err) {
      console.error("Failed to capture screenshot:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [apiKey]);

  // Download captured image
  const downloadImage = useCallback(async () => {
    if (!capturedImageUrl) return;

    try {
      const response = await fetch(capturedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `streetview-${address.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: open in new tab
      window.open(capturedImageUrl, "_blank");
    }
  }, [capturedImageUrl, address]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true);
      setError(null);
      setCapturedImageUrl(null);
      panoramaRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => {
          if (capturedImageUrl) {
            setCapturedImageUrl(null);
          } else {
            onClose();
          }
        }}
      />

      {/* Modal */}
      <div className="relative w-full h-full md:w-[90vw] md:h-[85vh] md:max-w-6xl bg-white dark:bg-stone-900 md:rounded-lg shadow-2xl flex flex-col overflow-hidden border-2 border-black dark:border-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-stone-900 dark:text-stone-100 truncate">
              Street View
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 truncate">
              {address}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Capture Screenshot */}
            <button
              onClick={captureScreenshot}
              disabled={isLoading || !!error || isCapturing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded border-2 border-black dark:border-white font-medium text-sm transition-all",
                isLoading || error || isCapturing
                  ? "opacity-50 cursor-not-allowed bg-stone-100 dark:bg-stone-700"
                  : "bg-sky-500 hover:bg-sky-600 text-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] hover:shadow-[3px_3px_0_0_black]"
              )}
              title="Capture Screenshot"
            >
              {isCapturing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Capture</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Street View Container */}
        <div className="flex-1 relative bg-stone-200 dark:bg-stone-800">
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  Loading Street View...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center p-4">
                <p className="text-stone-600 dark:text-stone-400">{error}</p>
                <button
                  onClick={() => {
                    const latLng = getLatLng();
                    if (latLng) {
                      window.open(
                        `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latLng.lat},${latLng.lng}`,
                        "_blank"
                      );
                    }
                  }}
                  className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
                >
                  Open in Google Maps
                </button>
              </div>
            </div>
          )}

          <div
            ref={streetViewRef}
            className="w-full h-full"
            style={{ display: isLoading || error ? "none" : "block" }}
          />
        </div>

        {/* Footer with instructions */}
        <div className="px-4 py-2 border-t-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
            Drag to look around • Scroll to zoom • Click arrows to move • Press Capture to save current view
          </p>
        </div>
      </div>

      {/* Captured Image Preview Modal */}
      {capturedImageUrl && (
        <div className="absolute inset-0 z-60 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setCapturedImageUrl(null)}
          />
          <div className="relative bg-white dark:bg-stone-900 rounded-lg border-2 border-black dark:border-white shadow-2xl overflow-hidden max-w-4xl max-h-[80vh] m-4">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                Screenshot Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded border-2 border-black dark:border-white"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => window.open(capturedImageUrl, "_blank")}
                  className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                  title="Open full size"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCapturedImageUrl(null)}
                  className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img
              src={capturedImageUrl}
              alt={`Street View of ${address}`}
              className="max-w-full max-h-[60vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default StreetViewModal;
