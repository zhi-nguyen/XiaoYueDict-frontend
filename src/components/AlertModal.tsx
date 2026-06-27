import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AlertModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  closeText?: string;
}

export default function AlertModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  closeText = 'Đóng'
}: AlertModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  // Icons and Color themes based on type
  const theme = {
    success: {
      bgIcon: 'bg-emerald-50 text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600 text-white shadow-sm',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bgIcon: 'bg-red-50 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white shadow-sm',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    info: {
      bgIcon: 'bg-blue-50 text-blue-600',
      button: 'bg-primary hover:opacity-90 focus:ring-primary text-white shadow-sm',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }[type];

  return createPortal(
    <div data-portal="alert-modal" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md transition-opacity duration-300 font-sans">

      <div className="bg-surface rounded-3xl p-6 w-full max-w-sm border border-outline shadow-[0_20px_50px_rgba(0,0,0,0.08)] transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        
        {/* Animated Icon Container */}
        <div className={`p-4 rounded-2xl ${theme.bgIcon} mb-5`}>
          {theme.icon}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-primary mb-2 tracking-tight">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-secondary text-sm leading-relaxed mb-6 px-2">
          {message}
        </p>
        
        {/* Actions */}
        <button
          type="button"
          onClick={onClose}
          className={`w-full py-3 px-5 text-sm font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.button}`}
        >
          {closeText}
        </button>
      </div>
    </div>,
    document.body
  );
}

