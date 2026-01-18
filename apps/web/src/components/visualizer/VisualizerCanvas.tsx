'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import Konva from 'konva';
import { useVisualizerStore } from '@/stores';

/**
 * VisualizerCanvas - Konva.js canvas for image display and mask painting
 */
export function VisualizerCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [lines, setLines] = useState<Array<{
    tool: 'brush' | 'eraser';
    points: number[];
    strokeWidth: number;
  }>>([]);
  const isDrawingRef = useRef(false);

  const {
    sourceImage,
    activeTool,
    brushSize,
    isDrawing,
    setIsDrawing,
    setMaskImage,
    addToHistory,
  } = useVisualizerStore();

  // Load source image
  useEffect(() => {
    if (!sourceImage) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.src = sourceImage;
  }, [sourceImage]);

  // Calculate image scale and position to fit canvas (derived state)
  const { imageScale, imageOffset } = useMemo(() => {
    if (!image || !stageSize.width || !stageSize.height) {
      return { imageScale: 1, imageOffset: { x: 0, y: 0 } };
    }

    const padding = 40;
    const availableWidth = stageSize.width - padding * 2;
    const availableHeight = stageSize.height - padding * 2;

    const scaleX = availableWidth / image.width;
    const scaleY = availableHeight / image.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

    return {
      imageScale: scale,
      imageOffset: {
        x: (stageSize.width - image.width * scale) / 2,
        y: (stageSize.height - image.height * scale) / 2,
      },
    };
  }, [image, stageSize]);

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setStageSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Get pointer position relative to image
  const getRelativePointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !image) return null;

    const pos = stage.getPointerPosition();
    if (!pos) return null;

    // Convert to image coordinates
    const x = (pos.x - imageOffset.x) / imageScale;
    const y = (pos.y - imageOffset.y) / imageScale;

    // Check if within image bounds
    if (x < 0 || x > image.width || y < 0 || y > image.height) {
      return null;
    }

    return { x, y };
  }, [image, imageScale, imageOffset]);

  // Handle mouse/touch down
  const handleMouseDown = useCallback(() => {
    const pos = getRelativePointerPosition();
    if (!pos) return;

    isDrawingRef.current = true;
    setIsDrawing(true);

    setLines((prevLines) => [
      ...prevLines,
      {
        tool: activeTool,
        points: [pos.x, pos.y],
        strokeWidth: brushSize,
      },
    ]);
  }, [activeTool, brushSize, getRelativePointerPosition, setIsDrawing]);

  // Handle mouse/touch move
  const handleMouseMove = useCallback(() => {
    if (!isDrawingRef.current) return;

    const pos = getRelativePointerPosition();
    if (!pos) return;

    setLines((prevLines) => {
      const newLines = [...prevLines];
      const lastLine = newLines[newLines.length - 1];
      if (lastLine) {
        lastLine.points = [...lastLine.points, pos.x, pos.y];
      }
      return newLines;
    });
  }, [getRelativePointerPosition]);

  // Export mask as PNG (must be defined before handleMouseUp)
  const exportMask = useCallback(() => {
    if (!image || lines.length === 0) {
      setMaskImage(null);
      return;
    }

    // Create a canvas for the mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = image.width;
    maskCanvas.height = image.height;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    // Black background (areas to keep)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw white lines (areas to edit)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    lines.forEach((line) => {
      if (line.tool === 'brush') {
        ctx.strokeStyle = 'white';
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.strokeStyle = 'black';
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.lineWidth = line.strokeWidth;

      ctx.beginPath();
      for (let i = 0; i < line.points.length; i += 2) {
        const x = line.points[i];
        const y = line.points[i + 1];
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });

    const maskDataUrl = maskCanvas.toDataURL('image/png');
    setMaskImage(maskDataUrl);

    // Add to history
    addToHistory({
      sourceImage: sourceImage || '',
      maskImage: maskDataUrl,
    });
  }, [image, lines, setMaskImage, addToHistory, sourceImage]);

  // Handle mouse/touch up
  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    setIsDrawing(false);

    // Export mask after drawing
    exportMask();
  }, [setIsDrawing, exportMask]);

  // Subscribe to clearMask action from store
  useEffect(() => {
    const unsubscribe = useVisualizerStore.subscribe(
      (currentState, previousState) => {
        if (currentState.maskImage === null && previousState.maskImage !== null && lines.length > 0) {
          setLines([]);
        }
      }
    );
    return unsubscribe;
  }, [lines.length]);

  if (!sourceImage) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800">
        <p className="text-stone-500">No image loaded</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-stone-200 dark:bg-stone-800 relative"
      style={{ cursor: activeTool === 'brush' ? 'crosshair' : 'cell' }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Image Layer */}
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={imageOffset.x}
              y={imageOffset.y}
              width={image.width * imageScale}
              height={image.height * imageScale}
            />
          )}
        </Layer>

        {/* Mask Layer */}
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points.map((p, idx) =>
                idx % 2 === 0
                  ? p * imageScale + imageOffset.x
                  : p * imageScale + imageOffset.y
              )}
              stroke={line.tool === 'brush' ? 'rgba(255, 0, 100, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
              strokeWidth={line.strokeWidth * imageScale}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>

      {/* Brush size indicator */}
      {isDrawing && (
        <div
          className="absolute pointer-events-none border-2 border-white rounded-full opacity-50"
          style={{
            width: brushSize * imageScale,
            height: brushSize * imageScale,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  );
}
