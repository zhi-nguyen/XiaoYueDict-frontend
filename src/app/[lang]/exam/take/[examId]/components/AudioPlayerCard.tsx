'use client';

import React, { useMemo } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerCardProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioUrl: string;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  formatTime: (seconds: number) => string;
  variant: 'zh' | 'en';
}

export default function AudioPlayerCard({
  audioRef,
  audioUrl,
  currentTime,
  setCurrentTime,
  isPlaying,
  onPlay,
  onPause,
  formatTime,
  variant,
}: AudioPlayerCardProps) {
  // Generate random heights/delays for wave bars
  const waveBars = useMemo(() => {
    return Array.from({ length: 45 }).map(() => ({
      height: Math.floor(Math.random() * 20) + 12,
      delay: (Math.random() * 1.5).toFixed(2),
    }));
  }, []);

  const themeColors =
    variant === 'zh'
      ? {
          playBtn: 'bg-primary hover:bg-[#334155]',
          progress: 'bg-primary',
          wave: 'bg-sage/40',
        }
      : {
          playBtn: 'bg-[#6366F1] hover:bg-[#4f46e5]',
          progress: 'bg-[#6366F1]',
          wave: 'bg-[#6366F1]/30',
        };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const duration = audioRef.current?.duration || 0;
    if (duration > 0 && audioRef.current) {
      const newTime = (clickX / width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="mb-8 p-6 bg-surface-container-low border border-outline/60 rounded-[2rem] shadow-sm relative overflow-hidden group">
      {/* Dynamic background glow */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Title */}
      <h3 className="text-base md:text-lg font-bold text-primary mb-4 flex items-center gap-2 font-lexend relative z-10">
        <span>🎧</span>
        <span>Audio Nghe Toàn Bài Thi</span>
      </h3>

      {/* Hidden audio element */}
      <audio
        ref={audioRef as any}
        src={audioUrl}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={onPause}
        onPause={onPause}
        onPlay={onPlay}
        className="hidden"
      />

      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
        {/* Play/Pause Button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg active:scale-95 transition-all focus:outline-none shrink-0 ${themeColors.playBtn}`}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>

        {/* Waves & Progress Bar */}
        <div className="flex-1 w-full space-y-3">
          {/* Simulated Waveform (Only animate when playing) */}
          <div className="h-10 w-full flex items-end justify-between gap-[2.5px] px-1 overflow-hidden select-none">
            {waveBars.map((bar, idx) => (
              <div
                key={idx}
                className={`w-[4px] rounded-full transition-all duration-300 ${
                  isPlaying ? 'animate-wave-bar' : ''
                } ${themeColors.wave}`}
                style={{
                  height: `${bar.height}px`,
                  animationDelay: `${bar.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Interactive Progress Bar */}
          <div
            onClick={handleProgressClick}
            className="relative w-full h-2 bg-slate-200 rounded-full cursor-pointer hover:h-2.5 transition-all overflow-hidden"
          >
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-100 ${themeColors.progress}`}
              style={{
                width: `${
                  ((currentTime || 0) / (audioRef.current?.duration || 1)) * 100
                }%`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-on-surface-variant font-bold font-mono">
            <span>{formatTime(Math.floor(currentTime))}</span>
            <span>{formatTime(Math.floor(audioRef.current?.duration || 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
