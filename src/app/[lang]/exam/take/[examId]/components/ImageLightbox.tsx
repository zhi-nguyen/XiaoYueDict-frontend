'use client';

import React from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageLightboxProps {
  image: string | null;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}

export default function ImageLightbox({ image, zoom, setZoom, onClose }: ImageLightboxProps) {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-3 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none"
        title="Đóng"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-4 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20 items-center">
        <button
          onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
          className="text-white hover:text-white/80 p-1.5 focus:outline-none transition-colors"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white font-mono min-w-[60px] text-center text-sm font-semibold">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
          className="text-white hover:text-white/80 p-1.5 focus:outline-none transition-colors"
          title="Phóng to"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-4 bg-white/20" />
        <button
          onClick={() => setZoom(1)}
          className="text-white hover:text-white/80 text-xs font-semibold px-2 flex items-center gap-1 focus:outline-none transition-colors"
          title="Đặt lại"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Image container */}
      <div className="w-full h-full overflow-auto flex items-center justify-center p-8" onClick={onClose}>
        <img
          src={image}
          alt="Zoomed Chart"
          className="max-w-full max-h-[85vh] rounded-lg shadow-2xl transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            cursor: zoom > 1 ? 'grab' : 'zoom-in',
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
