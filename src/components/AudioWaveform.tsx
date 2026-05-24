'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import type { ScoringResponse } from '@/types/scoring';
import { isReadAloudAny, getScoreLevel } from '@/types/scoring';

interface AudioWaveformProps {
  /** Whether we are actively recording */
  isRecording: boolean;
  /** The MediaStream to visualize (from getUserMedia) */
  stream: MediaStream | null;
  /** Height of the waveform canvas */
  height?: number;
  /** Color of the waveform bars */
  color?: string;
  /** The scoring result to overlay/display when idle */
  result?: ScoringResponse | null;
}

/** Maps score levels to solid hex colors for canvas drawing */
const SCORE_HEX_COLORS = {
  excellent: '#10B981', // Emerald 500
  good: '#3B82F6',      // Blue 500
  moderate: '#F59E0B',  // Amber 500
  poor: '#EF4444',      // Red 500
};

/**
 * Real-time audio waveform visualization using the Web Audio API.
 * Renders animated frequency bars from a live MediaStream,
 * or an audio timeline mapped to word scores when a result is provided.
 */
export default function AudioWaveform({
  isRecording,
  stream,
  height = 64,
  color,
  result,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const drawLive = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;

    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const drawHeight = canvas.clientHeight;

    canvas.width = width * dpr;
    canvas.height = drawHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, drawHeight);

    // Draw bars
    const barCount = 40;
    const gap = 3;
    const barWidth = (width - gap * (barCount - 1)) / barCount;
    const step = Math.floor(bufferLength / barCount);

    const barColor = color || getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-gradient-start').trim() || '#6366F1';

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255;
      const barHeight = Math.max(3, value * drawHeight * 0.85);

      const x = i * (barWidth + gap);
      const y = (drawHeight - barHeight) / 2;

      ctx.fillStyle = barColor;
      ctx.globalAlpha = 0.4 + value * 0.6;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    animationRef.current = requestAnimationFrame(drawLive);
  }, [color]);

  useEffect(() => {
    if (!isRecording || !stream) {
      // Draw idle state or timeline result
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const width = canvas.clientWidth;
          const drawHeight = canvas.clientHeight;

          canvas.width = width * dpr;
          canvas.height = drawHeight * dpr;
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, width, drawHeight);

          if (result && isReadAloudAny(result) && result.word_scores.length > 0) {
            // Draw result timeline
            const scores = result.word_scores;
            const lastEndTime = scores[scores.length - 1].end_time;
            const totalDuration = lastEndTime + 0.5; // Add 0.5s padding

            // Draw a visible background track
            ctx.fillStyle = getComputedStyle(document.documentElement)
              .getPropertyValue('--color-outline').trim() || '#000000ff';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.roundRect(0, drawHeight / 2 - 12, width, 24, 4);
            ctx.fill();

            // Draw each word's segment
            ctx.globalAlpha = 1;
            scores.forEach((ws) => {
              const startX = (ws.start_time / totalDuration) * width;
              const endX = (ws.end_time / totalDuration) * width;
              let segWidth = Math.max(endX - startX, 4); // Minimum width of 4px for visibility

              // Prevent segment from overflowing the canvas
              if (startX + segWidth > width) {
                segWidth = width - startX;
              }

              const level = getScoreLevel(ws.score);
              ctx.fillStyle = SCORE_HEX_COLORS[level];

              ctx.beginPath();
              ctx.roundRect(startX, drawHeight / 2 - 12, segWidth, 24, 4);
              ctx.fill();
            });
          } else {
            // Draw subtle idle bars
            const barCount = 40;
            const gap = 3;
            const barWidth = (width - gap * (barCount - 1)) / barCount;

            for (let i = 0; i < barCount; i++) {
              const idleHeight = 3 + Math.sin(i * 0.5) * 2;
              const x = i * (barWidth + gap);
              const y = (drawHeight - idleHeight) / 2;

              ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--color-outline').trim() || '#E2E8F0';
              ctx.globalAlpha = 0.5;
              ctx.beginPath();
              ctx.roundRect(x, y, barWidth, idleHeight, barWidth / 2);
              ctx.fill();
            }
          }
        }
      }
      return;
    }

    // Set up Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    // Start animation loop
    animationRef.current = requestAnimationFrame(drawLive);

    return () => {
      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      audioContext.close();
    };
  }, [isRecording, stream, drawLive, result]);

  return (
    <div className="w-full rounded-xl bg-hover-bg border border-outline/30 overflow-hidden" style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
