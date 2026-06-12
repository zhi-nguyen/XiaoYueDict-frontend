import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  isDestructive = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const theme = isDestructive
    ? {
        bgIcon: 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400',
        button: 'bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white shadow-sm',
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )
      }
    : {
        bgIcon: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400',
        button: 'bg-primary hover:opacity-90 focus:ring-primary text-white shadow-sm',
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md transition-opacity duration-300 font-sans">
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
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-5 text-sm font-semibold rounded-2xl text-secondary bg-hover-bg hover:bg-outline/50 border border-outline transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-5 text-sm font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


