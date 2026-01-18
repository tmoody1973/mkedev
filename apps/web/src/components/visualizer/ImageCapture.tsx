'use client';

import { useCallback, useRef } from 'react';
import { Camera, Upload, X, ImageIcon } from 'lucide-react';
import { useVisualizerStore } from '@/stores';

/**
 * ImageCapture - Options for capturing/uploading source images
 */
export function ImageCapture() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setSourceImage, screenshots, selectScreenshot, removeScreenshot } = useVisualizerStore();

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

  // Handle screenshot selection
  const handleSelectScreenshot = useCallback(
    (id: string) => {
      selectScreenshot(id);
    },
    [selectScreenshot]
  );

  // Handle screenshot removal
  const handleRemoveScreenshot = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeScreenshot(id);
    },
    [removeScreenshot]
  );

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="p-6 text-center border-b-2 border-stone-200 dark:border-stone-700">
        <h2 className="text-2xl font-bold font-head text-stone-900 dark:text-stone-100">
          Choose an Image Source
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Use a screenshot from the map or upload your own image
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Screenshot Gallery */}
        {screenshots.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                Your Screenshots ({screenshots.length})
              </h3>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              Use the camera button on the map to take screenshots. Click any screenshot below to use it.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {screenshots.map((screenshot) => (
                <button
                  key={screenshot.id}
                  onClick={() => handleSelectScreenshot(screenshot.id)}
                  className="group relative aspect-video rounded-lg overflow-hidden border-2 border-stone-300 dark:border-stone-600
                    hover:border-purple-500 hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,0.5)]
                    transition-all duration-100"
                >
                  <img
                    src={screenshot.image}
                    alt={screenshot.address || 'Map screenshot'}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">
                        {screenshot.address || 'Map view'}
                      </p>
                      <p className="text-white/70 text-xs">
                        {formatTime(screenshot.timestamp)}
                      </p>
                    </div>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleRemoveScreenshot(e, screenshot.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white
                      flex items-center justify-center opacity-0 group-hover:opacity-100
                      hover:bg-red-600 transition-opacity"
                    aria-label="Remove screenshot"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for screenshots */}
        {screenshots.length === 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border-2 border-dashed border-purple-300 dark:border-purple-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 dark:text-stone-100">
                  No screenshots yet
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  Click the purple camera button on the map to take screenshots.
                  They will appear here for you to visualize.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Option */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100">
              Upload Your Own
            </h3>
          </div>
          <button
            onClick={handleUploadClick}
            className="w-full flex items-center gap-4 p-4 bg-white dark:bg-stone-800
              rounded-xl border-2 border-black dark:border-stone-600
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
              hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-2 active:shadow-none
              transition-all duration-100"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-stone-900 dark:text-stone-100">
                Upload Image
              </h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">
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
