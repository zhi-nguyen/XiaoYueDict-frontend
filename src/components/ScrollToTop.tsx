"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (triggerRef.current) {
      containerRef.current = triggerRef.current.parentElement;
    }

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Show button if scrolled more than 1 viewport height
      if (container.scrollTop > window.innerHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Run once on mount in case already scrolled
    handleScroll();

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  if (!isVisible) {
    return <div ref={triggerRef} className="hidden" />;
  }

  return (
    <div ref={triggerRef}>
      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 p-3.5 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none z-50 flex items-center justify-center border border-white/10"
        title="Lên đầu trang"
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  );
}
