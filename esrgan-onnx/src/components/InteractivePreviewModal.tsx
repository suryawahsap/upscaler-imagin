import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { QueueItem, OutputFormat } from '../types';
import { formatBytes } from '../services/imageProcessing';
import { 
  X, 
  Download, 
  Columns2, 
  SplitSquareVertical, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Sparkles, 
  Layers, 
  Check, 
  FileType,
  ArrowRight
} from 'lucide-react';

interface InteractivePreviewModalProps {
  item: QueueItem | null;
  onClose: () => void;
  onDownloadSingle: (item: QueueItem) => void;
}

export const InteractivePreviewModal: React.FC<InteractivePreviewModalProps> = ({
  item,
  onClose,
  onDownloadSingle,
}) => {
  if (!item) return null;

  // View modes: 'slider' (split comparison) or 'side-by-side'
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  
  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = fit, 2 = 200%, 3 = 300%, 4 = 400%
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle slider drag
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pos);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      if (viewMode === 'slider') {
        setIsDraggingSlider(true);
        handleSliderMove(e.clientX);
      } else {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider && viewMode === 'slider') {
      handleSliderMove(e.clientX);
    } else if (isPanning && viewMode === 'side-by-side') {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSlider(false);
    setIsPanning(false);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(4, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(1, prev - 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setSliderPosition(50);
  };

  const upscaledSrc = item.upscaledUrl || item.originalUrl;
  const isProcessed = item.status === 'done' && !!item.upscaledUrl;

  return (
    <div
      id="preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
    >
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Skala {item.config.scale}x</span>
                <span>&bull;</span>
                <span>Model: {item.config.model}</span>
                <span>&bull;</span>
                <span>Noise: {item.config.denoise}%</span>
              </p>
            </div>
          </div>

          {/* Mode switch & Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
              <button
                id="btn-preview-mode-slider"
                type="button"
                onClick={() => setViewMode('slider')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'slider'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mode Pemisah (Split Slider)"
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split Slider</span>
              </button>
              <button
                id="btn-preview-mode-side"
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Berdampingan (Side-by-Side)"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Berdampingan</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
                title="Perkecil Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
                title="Perbesar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 text-slate-300 hover:text-white"
                  title="Reset Zoom"
                >
                  <Maximize className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Download Button */}
            {isProcessed && (
              <button
                id="btn-preview-download"
                type="button"
                onClick={() => onDownloadSingle(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
                title="Unduh Gambar Ini"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh</span>
              </button>
            )}

            {/* Close Button */}
            <button
              id="btn-preview-close"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup Pratinjau (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas Area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          className={`flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center select-none ${
            viewMode === 'slider' ? 'cursor-ew-resize' : zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          style={{
            backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        >
          {viewMode === 'slider' ? (
            /* SLIDER MODE (Split Before & After) */
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <div
                className="relative max-w-full max-h-full rounded-lg overflow-hidden border border-slate-800 shadow-2xl"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDraggingSlider ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                {/* AFTER IMAGE (Full width behind) */}
                <img
                  src={upscaledSrc}
                  alt="Sesudah (Real-ESRGAN)"
                  className="max-h-[70vh] max-w-full object-contain block pointer-events-none"
                  draggable={false}
                />

                {/* BEFORE IMAGE (Clipped overlay on left side) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={item.originalUrl}
                    alt="Sebelum"
                    className="max-h-[70vh] max-w-none object-contain block pointer-events-none"
                    draggable={false}
                    style={{
                      // Maintain exact identical aspect ratio & size as the back image
                      width: containerRef.current ? 'auto' : undefined,
                    }}
                  />
                  {/* Before Label Badge */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                    SEBELUM ({item.originalWidth}×{item.originalHeight})
                  </div>
                </div>

                {/* After Label Badge */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                  REAL-ESRGAN {item.config.scale}X ({item.upscaledWidth || item.originalWidth * item.config.scale}×{item.upscaledHeight || item.originalHeight * item.config.scale})
                </div>

                {/* Vertical Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  {/* Draggable Circle Handle */}
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 font-black shadow-lg flex items-center justify-center border-2 border-slate-900 pointer-events-auto cursor-ew-resize">
                    <SplitSquareVertical className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SIDE-BY-SIDE MODE */
            <div
              className="w-full h-full p-4 flex flex-col md:flex-row items-center justify-center gap-4 overflow-auto"
              style={{
                transform: zoomLevel > 1 ? `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)` : undefined,
              }}
            >
              {/* Original Box */}
              <div className="flex-1 flex flex-col items-center max-w-lg w-full">
                <div className="mb-2 flex items-center justify-between w-full text-xs text-amber-300 font-mono">
                  <span className="font-bold">SEBELUM (Asli)</span>
                  <span>{item.originalWidth} × {item.originalHeight} px &bull; {formatBytes(item.originalSize)}</span>
                </div>
                <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-900/80 shadow-lg w-full flex items-center justify-center p-2">
                  <img
                    src={item.originalUrl}
                    alt="Sebelum"
                    className="max-h-[60vh] max-w-full object-contain rounded"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Upscaled Box */}
              <div className="flex-1 flex flex-col items-center max-w-lg w-full">
                <div className="mb-2 flex items-center justify-between w-full text-xs text-emerald-400 font-mono">
                  <span className="font-bold">SESUDAH (Real-ESRGAN {item.config.scale}x)</span>
                  <span>
                    {item.upscaledWidth || item.originalWidth * item.config.scale} × {item.upscaledHeight || item.originalHeight * item.config.scale} px
                    {item.upscaledSize ? ` • ${formatBytes(item.upscaledSize)}` : ''}
                  </span>
                </div>
                <div className="relative border border-emerald-900/60 rounded-xl overflow-hidden bg-slate-900/80 shadow-lg w-full flex items-center justify-center p-2 ring-1 ring-emerald-500/20">
                  <img
                    src={upscaledSrc}
                    alt="Sesudah"
                    className="max-h-[60vh] max-w-full object-contain rounded"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Metadata & Inspector Bar */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            {/* Resolution comparison */}
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-400">{item.originalWidth}×{item.originalHeight}</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold text-white">
                {item.upscaledWidth || item.originalWidth * item.config.scale}×{item.upscaledHeight || item.originalHeight * item.config.scale}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                {item.config.scale}x
              </span>
            </div>

            <div className="h-3 w-px bg-slate-800 hidden sm:block" />

            {/* Denoise & Model info */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Model:</span>
              <span className="font-semibold text-slate-200">{item.config.model}</span>
              <span className="text-slate-400 ml-1">Denoise:</span>
              <span className="font-mono text-cyan-400 font-bold">{item.config.denoise}%</span>
            </div>

            <div className="h-3 w-px bg-slate-800 hidden sm:block" />

            {/* File size info */}
            <div className="flex items-center gap-1.5 font-mono text-slate-400">
              <span>{formatBytes(item.originalSize)}</span>
              {item.upscaledSize && (
                <>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-emerald-400 font-bold">{formatBytes(item.upscaledSize)}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Geser garis tengah slider untuk membandingkan ketajaman & reduksi noise
          </div>
        </div>
      </div>
    </div>
  );
};
