"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

interface LevelProgressBarProps {
  language: string;
}

export default function LevelProgressBar({ language }: LevelProgressBarProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const levelData = user?.levels?.[language as 'zh' | 'en'];

  const prevDataRef = useRef<{ level: number; current_exp: number; total_exp: number } | null>(null);

  const [displayPercent, setDisplayPercent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [expGained, setExpGained] = useState<number | null>(null);
  const [explosionCoords, setExplosionCoords] = useState({ percent: 0 });
  const [disableTransition, setDisableTransition] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isAuthenticated || !levelData) {
      if (!isMounted || !isAuthenticated) {
        prevDataRef.current = null;
      }
      return;
    }

    const { level, current_exp, exp_required, total_exp } = levelData;
    const targetPercent = exp_required > 0 ? (current_exp / exp_required) * 100 : 0;

    // Initial mount: set display percentage statically
    if (prevDataRef.current === null) {
      setDisplayPercent(targetPercent);
      prevDataRef.current = { level, current_exp, total_exp };
      return;
    }

    const prev = prevDataRef.current;

    // Detect level up
    if (level > prev.level) {
      const gained = total_exp - prev.total_exp;
      setExpGained(gained);
      setIsAnimating(true);
      setShowExplosion(false);

      // 1. Fill progress bar to 100% first
      setDisplayPercent(100);

      const levelUpTimer = setTimeout(() => {
        // 2. Trigger explosion at 100%
        setIsAnimating(false);
        setShowExplosion(true);
        setExplosionCoords({ percent: 100 });

        // 3. Instantly reset progress bar to 0% (disable transition)
        setDisableTransition(true);
        setDisplayPercent(0);

        const resetTimer = setTimeout(() => {
          // 4. Re-enable transition and animate to new target percentage
          setDisableTransition(false);
          setIsAnimating(true);
          setDisplayPercent(targetPercent);

          const finalTimer = setTimeout(() => {
            setIsAnimating(false);
            setShowExplosion(true);
            setExplosionCoords({ percent: targetPercent });

            const cleanupTimer = setTimeout(() => {
              setShowExplosion(false);
              setExpGained(null);
            }, 600);

            return () => clearTimeout(cleanupTimer);
          }, 1000); // duration of slide from 0% to targetPercent

          return () => clearTimeout(finalTimer);
        }, 80); // brief pause at 0% to allow DOM update

        return () => clearTimeout(resetTimer);
      }, 600); // time to slide from previous percent to 100%

      prevDataRef.current = { level, current_exp, total_exp };
      return () => clearTimeout(levelUpTimer);
    } 
    // Detect normal EXP gain
    else if (total_exp > prev.total_exp) {
      const gained = total_exp - prev.total_exp;
      setExpGained(gained);
      setIsAnimating(true);
      setShowExplosion(false);

      // Transition to new target percentage
      setDisplayPercent(targetPercent);

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowExplosion(true);
        setExplosionCoords({ percent: targetPercent });

        const explosionTimer = setTimeout(() => {
          setShowExplosion(false);
          setExpGained(null);
        }, 600);

        return () => clearTimeout(explosionTimer);
      }, 1000); // match transition duration of 1s

      prevDataRef.current = { level, current_exp, total_exp };
      return () => clearTimeout(timer);
    } 
    // Otherwise, normal update (e.g. language switch or no exp gain)
    else {
      setDisplayPercent(targetPercent);
      prevDataRef.current = { level, current_exp, total_exp };
    }
  }, [levelData, language, isAuthenticated, isMounted]);

  if (!isMounted || !isAuthenticated || !levelData) return null;

  const { level, current_exp, exp_required } = levelData;

  return (
    <div 
      className="relative w-full h-[6px] overflow-visible cursor-pointer select-none"
      style={{ backgroundColor: 'rgba(100, 116, 139, 0.2)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id="level-progress-bar-container"
    >
      {/* Filled progress bar */}
      <div
        className={`h-full ${disableTransition ? '' : 'transition-all duration-1000 ease-out'} relative`}
        style={{ 
          width: `${displayPercent}%`,
          background: language === 'zh'
            ? 'linear-gradient(90deg, #f97316 0%, #ef4444 50%, #eab308 100%)'
            : 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #06b6d4 100%)'
        }}
      >
        {/* Spinning Star and particles at the leading edge (tip) */}
        {(isAnimating || showExplosion) && (
          <div
            className="absolute top-1/2 -translate-y-1/2 right-0 pointer-events-none select-none z-10"
            style={{ transform: 'translate(50%, -50%)' }}
          >
            {/* Solid spinning star during progress bar movement */}
            {isAnimating && (
              <div className="relative animate-star-spin flex items-center justify-center">
                <span className="material-symbols-outlined filled text-amber-500 text-lg drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]">
                  star
                </span>
              </div>
            )}

            {/* Spark particle trail trailing behind */}
            {isAnimating && (
              <div className="absolute top-0 right-0 w-1 h-1">
                <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 animate-particle1" />
                <div className="absolute w-1 h-1 rounded-full bg-yellow-300 animate-particle2" />
                <div className="absolute w-1 h-1 rounded-full bg-amber-500 animate-particle3" />
              </div>
            )}

            {/* Solid sparkle burst at the destination */}
            {showExplosion && (
              <div className="relative flex items-center justify-center">
                {/* Flash Core */}
                <div className="w-5 h-5 rounded-full bg-amber-200 opacity-80 animate-flash absolute" />
                {/* Particle burst */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i * 360) / 8;
                  const rad = (angle * Math.PI) / 180;
                  const distance = 20 + Math.random() * 12; // 20px to 32px
                  const tx = `${Math.cos(rad) * distance}px`;
                  const ty = `${Math.sin(rad) * distance}px`;

                  return (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
                      style={{
                        animation: 'explosion-particle 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                        '--tx': tx,
                        '--ty': ty,
                      } as React.CSSProperties}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Floating "+EXP" indicator */}
        {expGained !== null && (
          <div
            className="absolute pointer-events-none text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50 shadow-sm z-20"
            style={{
              left: `${displayPercent}%`,
              bottom: '12px',
              transform: 'translateX(-50%)',
              animation: 'float-up-fade 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
            }}
          >
            <span>+</span>
            <span>{expGained}</span>
            <span className="text-[8px] font-bold text-amber-500 uppercase">EXP</span>
          </div>
        )}
      </div>

      {/* Hover Tooltip displaying detailed progression numbers */}
      {isHovered && (
        <div className="absolute top-[8px] left-1/2 -translate-x-1/2 bg-surface/90 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline shadow-md z-50 text-[11px] font-bold text-primary animate-in fade-in zoom-in-95 duration-100 flex items-center gap-1.5">
          <span>{language === 'zh' ? '🇨🇳' : '🇬🇧'}</span>
          <span>Cấp {level}:</span>
          <span className="text-secondary">{current_exp} / {exp_required} EXP</span>
        </div>
      )}

      {/* Inject custom CSS keyframes safely */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes star-spin-anim {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes float-up-fade {
          0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
          15% { transform: translate(-50%, -10px) scale(1.1); opacity: 1; }
          80% { transform: translate(-50%, -25px) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -35px) scale(0.8); opacity: 0; }
        }
        @keyframes flash {
          0% { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes explosion-particle {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.1); opacity: 0; }
        }
        @keyframes particle1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-20px, -8px) scale(0.2); opacity: 0; }
        }
        @keyframes particle2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-15px, 10px) scale(0.2); opacity: 0; }
        }
        @keyframes particle3 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-25px, 2px) scale(0.2); opacity: 0; }
        }
        .animate-star-spin {
          animation: star-spin-anim 0.6s linear infinite;
        }
        .animate-flash {
          animation: flash 0.3s ease-out forwards;
        }
        .animate-particle1 {
          animation: particle1 0.4s infinite ease-out;
        }
        .animate-particle2 {
          animation: particle2 0.3s infinite ease-out;
        }
        .animate-particle3 {
          animation: particle3 0.5s infinite ease-out;
        }
      `}} />
    </div>
  );
}
