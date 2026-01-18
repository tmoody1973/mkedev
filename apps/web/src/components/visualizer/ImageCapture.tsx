'use client';

import { useCallback, useRef } from 'react';
import { Camera, Map, Upload } from 'lucide-react';
import { useVisualizerStore } from '@/stores';

/**
 * ImageCapture - Options for capturing/uploading source images
 */
export function ImageCapture() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setSourceImage } = useVisualizerStore();

  // Handle file upload
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PNG, JPG, or WebP image.');
        return;
      }

      // Validate file size (max 4MB)
      if (file.size > 4 * 1024 * 1024) {
        alert('Image must be less than 4MB.');
        return;
      }

      // Read and resize if needed
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize if over 1024px
          const maxSize = 1024;
          let { width, height } = img;

          if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          // Create canvas to resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedDataUrl = canvas.toDataURL('image/png');
            setSourceImage(resizedDataUrl);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);

      // Reset input
      e.target.value = '';
    },
    [setSourceImage]
  );

  // Trigger file input click
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Placeholder for map capture (will be implemented with mapRef)
  const handleMapCapture = useCallback(() => {
    // This will be connected to the map's getCanvas() method
    alert(
      'Map capture will be available when triggered from the map view. Use the "Visualize" button after selecting a parcel.'
    );
  }, []);

  // Placeholder for Street View capture
  const handleStreetViewCapture = useCallback(() => {
    alert(
      'Street View capture will be available from the Street View modal. Open Street View first, then click "Capture for Visualization".'
    );
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-stone-50 dark:bg-stone-900">
      <div className="max-w-2xl w-full space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold font-head text-stone-900 dark:text-stone-100">
            Choose an Image Source
          </h2>
          <p className="text-stone-600 dark:text-stone-400">
            Capture or upload an image of the site you want to visualize
          </p>
        </div>

        {/* Capture Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Map Screenshot */}
          <button
            onClick={handleMapCapture}
            className="group flex flex-col items-center gap-4 p-6 bg-white dark:bg-stone-800
              rounded-xl border-2 border-black dark:border-stone-600
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
              hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-2 active:shadow-none
              transition-all duration-100"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
              <Map className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                Map View
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Capture the current map view
              </p>
            </div>
          </button>

          {/* Street View */}
          <button
            onClick={handleStreetViewCapture}
            className="group flex flex-col items-center gap-4 p-6 bg-white dark:bg-stone-800
              rounded-xl border-2 border-black dark:border-stone-600
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
              hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-2 active:shadow-none
              transition-all duration-100"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                Street View
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Capture from Street View
              </p>
            </div>
          </button>

          {/* Upload File */}
          <button
            onClick={handleUploadClick}
            className="group flex flex-col items-center gap-4 p-6 bg-white dark:bg-stone-800
              rounded-xl border-2 border-black dark:border-stone-600
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
              hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-2 active:shadow-none
              transition-all duration-100"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                Upload Image
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                PNG, JPG, or WebP (max 4MB)
              </p>
            </div>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload image file"
        />

        {/* Tips */}
        <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 border-2 border-stone-300 dark:border-stone-600">
          <h4 className="font-bold text-sm text-stone-700 dark:text-stone-300 mb-2">
            Tips for best results:
          </h4>
          <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1 list-disc list-inside">
            <li>Use clear, well-lit images of the site</li>
            <li>Include the surrounding context for realistic blending</li>
            <li>Paint a mask over the area you want to modify</li>
            <li>Be specific in your prompt about what to add</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
