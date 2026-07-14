'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, Undo, Check, Loader2 } from 'lucide-react';
import { useHandwritingRecognition } from '@/hooks/useHandwritingRecognition';

interface HandwritingPanelProps {
  onSelectChar: (char: string) => void;
  onClose: () => void;
}

export default function HandwritingPanel({ onSelectChar, onClose }: HandwritingPanelProps) {
  const {
    isInitialized,
    isRecognizing,
    candidates,
    strokes,
    addStroke,
    undoLastStroke,
    clearStrokes,
  } = useHandwritingRecognition();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<number[][]>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Tianzige background grid
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)'; // light slate-300
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Horizontal & vertical center lines
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Diagonal lines
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();

    // Reset line dash
    ctx.setLineDash([]);

    // Draw completed strokes (blue)
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Dark blue

    strokes.forEach((stroke) => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0], stroke[i][1]);
      }
      ctx.stroke();
    });
  }, [strokes, isInitialized]);

  // Redraw canvas whenever strokes change or initialization happens
  useEffect(() => {
    redraw();
  }, [redraw]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): number[] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return [Math.round(x), Math.round(y)];
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Ngăn chặn cuộn trang trên mobile khi vẽ
    if (e.cancelable) {
      e.preventDefault();
    }
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    currentStrokeRef.current = [coords];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw start point in red (active stroke)
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ef4444'; // Red
    ctx.beginPath();
    ctx.moveTo(coords[0], coords[1]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e.cancelable) {
      e.preventDefault();
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    currentStrokeRef.current.push(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw line to new point
    ctx.lineTo(coords[0], coords[1]);
    ctx.stroke();
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length > 0) {
      addStroke(currentStrokeRef.current);
    }
    currentStrokeRef.current = [];
  };

  const handleClear = () => {
    clearStrokes();
    redraw();
  };

  return (
    <div className="w-full bg-surface border border-outline rounded-[1.5rem] p-4 sm:p-6 shadow-lg animate-in slide-in-from-top-4 duration-300 z-20">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">gesture</span>
          <h4 className="font-bold text-primary text-sm sm:text-base">Nhận dạng nét vẽ</h4>
          {isRecognizing && <Loader2 className="w-4 h-4 animate-spin text-primary/60 ml-2" />}
        </div>
        <button
          onClick={onClose}
          className="text-secondary/70 hover:text-primary transition-colors text-xs font-bold px-3 py-1.5 rounded-full hover:bg-hover-bg border border-outline/40"
        >
          Đóng panel
        </button>
      </div>

      {/* Candidate list */}
      <div className="w-full min-h-[52px] bg-hover-bg/50 border border-outline/50 rounded-xl mb-4 p-2 flex flex-wrap gap-2 items-center justify-start overflow-x-auto">
        {strokes.length === 0 ? (
          <span className="text-secondary/60 text-xs pl-2 font-medium">Vẽ vào khung dưới đây để nhận dạng chữ Hán...</span>
        ) : candidates.length === 0 ? (
          <span className="text-secondary/50 text-xs pl-2 font-medium">Không tìm thấy chữ Hán phù hợp...</span>
        ) : (
          candidates.map((candidate, idx) => (
            <button
              key={`${candidate}-${idx}`}
              onClick={() => {
                onSelectChar(candidate);
                handleClear();
              }}
              className="px-3.5 py-1.5 bg-surface hover:bg-primary hover:text-white border border-outline rounded-xl font-bold text-lg text-primary shadow-sm hover:scale-105 active:scale-95 transition-all focus:outline-none"
            >
              {candidate}
            </button>
          ))
        )}
      </div>

      {/* Drawing board container */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <div className="relative bg-white border-2 border-outline/65 rounded-2xl overflow-hidden shadow-inner w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="w-full h-full cursor-crosshair touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
          {!isInitialized && (
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-secondary font-semibold">Đang tải bộ dữ liệu nét vẽ...</p>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex sm:flex-col gap-3 w-full sm:w-auto justify-center sm:justify-start">
          <button
            type="button"
            onClick={undoLastStroke}
            disabled={strokes.length === 0}
            className="flex-1 sm:flex-none py-3 px-4 bg-hover-bg hover:bg-outline/25 border border-outline rounded-full text-secondary font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none focus:outline-none"
            title="Hoàn tác nét vẽ cuối"
          >
            <Undo className="w-4 h-4" />
            <span>Hoàn tác</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="flex-1 sm:flex-none py-3 px-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full text-red-600 font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none focus:outline-none"
            title="Xóa toàn bộ nét vẽ"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa sạch</span>
          </button>
        </div>
      </div>
    </div>
  );
}
