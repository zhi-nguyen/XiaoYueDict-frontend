'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '@/lib/apiClient';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useWebSocket } from '@/hooks/useWebSocket';

interface PaymentData {
  qr_url: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  amount: number;
  transfer_content: string;
  order_code: string;
  order_id: string;
  expires_at: string;
}

interface PaymentQRModalProps {
  isOpen: boolean;
  paymentData: PaymentData | null;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const DEFAULT_POLL_INTERVAL_MS = 5000;
const WS_POLL_INTERVAL_MS = 15000;

export default function PaymentQRModal({
  isOpen,
  paymentData,
  onClose,
  onPaymentSuccess,
}: PaymentQRModalProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastMessage = useNotificationStore((state) => state.lastMessage);
  const { isConnected } = useWebSocket();
  const activePollInterval = isConnected ? WS_POLL_INTERVAL_MS : DEFAULT_POLL_INTERVAL_MS;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !paymentData) return;

    setIsExpired(false);
    setIsPaid(false);

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(paymentData.expires_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, paymentData]);

  // WebSocket message listener
  useEffect(() => {
    if (!isOpen || !paymentData || isPaid || !lastMessage) return;

    if (
      lastMessage.type === 'subscription_change' &&
      lastMessage.payload?.order_id === paymentData.order_id &&
      lastMessage.payload?.status === 'PAID'
    ) {
      setIsPaid(true);
      if (pollRef.current) clearInterval(pollRef.current);
      // Brief delay for user to see success state
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }
  }, [lastMessage, isOpen, paymentData, isPaid, onPaymentSuccess]);

  // Poll for payment status
  const pollPaymentStatus = useCallback(async () => {
    if (!paymentData || isExpired || isPaid) return;

    try {
      const { data } = await apiClient.get(`/subscriptions/payment-status/${paymentData.order_id}/`);

      if (data.status === 'PAID') {
        setIsPaid(true);
        if (pollRef.current) clearInterval(pollRef.current);
        // Brief delay for user to see success state
        setTimeout(() => {
          onPaymentSuccess();
        }, 1500);
      } else if (data.status === 'EXPIRED') {
        setIsExpired(true);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (error) {
      // Silently ignore polling errors to avoid spamming the user
      console.error('[PaymentQRModal] Poll error:', error);
    }
  }, [paymentData, isExpired, isPaid, onPaymentSuccess]);

  useEffect(() => {
    if (!isOpen || !paymentData || isExpired || isPaid) return;

    pollRef.current = setInterval(pollPaymentStatus, activePollInterval);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, paymentData, isExpired, isPaid, pollPaymentStatus, activePollInterval]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  if (!isOpen || !mounted || !paymentData) return null;

  const formattedAmount = paymentData.amount.toLocaleString('vi-VN');

  return createPortal(
    <div
      data-portal="payment-qr-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md transition-opacity duration-300 font-sans"
    >
      <div className="bg-surface rounded-3xl w-full max-w-md border border-outline shadow-[0_20px_50px_rgba(0,0,0,0.08)] transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-sage px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-xl">qr_code_2</span>
            <h3 className="text-lg font-bold text-white tracking-tight">Thanh toán chuyển khoản</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Payment status indicator */}
          {isPaid ? (
            <div className="flex flex-col items-center py-4">
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
                <span className="material-symbols-outlined text-4xl filled">check_circle</span>
              </div>
              <p className="text-lg font-bold text-emerald-700">Thanh toán thành công!</p>
              <p className="text-sm text-secondary mt-1">Đang cập nhật gói đăng ký...</p>
            </div>
          ) : isExpired ? (
            <div className="flex flex-col items-center py-4">
              <div className="p-4 rounded-2xl bg-red-50 text-red-500 mb-3">
                <span className="material-symbols-outlined text-4xl">timer_off</span>
              </div>
              <p className="text-lg font-bold text-red-600">Đã hết thời gian thanh toán</p>
              <p className="text-sm text-secondary mt-1">Vui lòng thực hiện lại giao dịch.</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-2xl hover:opacity-90 transition-all"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Timer */}
              <div className="flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5">
                <span className="material-symbols-outlined text-yellow-600 text-lg">timer</span>
                <span className="text-sm font-bold text-yellow-800">
                  Thời gian còn lại: <span className="text-base font-extrabold tabular-nums">{timeLeft}</span>
                </span>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-2xl border border-outline shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentData.qr_url}
                    alt="Mã QR thanh toán VietQR"
                    className="w-52 h-52 object-contain"
                  />
                </div>
              </div>

              {/* Transfer details */}
              <div className="space-y-2.5 bg-hover-bg/50 rounded-2xl p-4 border border-outline">
                <DetailRow label="Ngân hàng" value={paymentData.bank_code} />
                <DetailRow label="Số tài khoản" value={paymentData.account_number} copyable />
                <DetailRow label="Chủ tài khoản" value={paymentData.account_name} />
                <DetailRow label="Số tiền" value={`${formattedAmount} đ`} highlight />
                <DetailRow label="Nội dung CK" value={paymentData.transfer_content} copyable />
              </div>

              {/* Instructions */}
              <div className="text-center">
                <p className="text-xs text-secondary leading-relaxed">
                  Quét mã QR hoặc chuyển khoản thủ công với <strong>đúng nội dung chuyển khoản</strong>.
                  <br />Hệ thống sẽ tự động xác nhận sau khi nhận được thanh toán.
                </p>
              </div>

              {/* Cancel button */}
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm font-semibold text-secondary border border-outline rounded-2xl hover:bg-hover-bg transition-all"
              >
                Hủy giao dịch
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/** A reusable detail row for bank transfer info */
function DetailRow({
  label,
  value,
  copyable = false,
  highlight = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore clipboard errors silently
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-secondary font-medium shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`text-xs font-bold truncate ${highlight ? 'text-primary text-sm' : 'text-primary'}`}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="shrink-0 p-0.5 text-secondary hover:text-primary transition-colors"
            title="Sao chép"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
