'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  TaskSubmitResponse,
  TaskStatusResponse,
  ScoringResponse,
} from '@/types/scoring';
import { validateTextInput } from '@/lib/inputValidation';
import { djangoClient } from '@/lib/apiClient';
import { useWebSocket, getGuestId } from './useWebSocket';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Translates common English error messages from the backend or browser to Vietnamese.
 */
function translateErrorMessage(msg: string): string {
  if (!msg) return 'Đã xảy ra lỗi không xác định.';
  
  const msgLower = msg.toLowerCase();
  
  if (msgLower.includes('no speech detected in audio')) {
    return 'Không phát hiện thấy giọng nói trong file ghi âm. Vui lòng thử lại.';
  }
  if (msgLower.includes('failed to submit audio')) {
    return 'Không thể gửi file ghi âm lên hệ thống.';
  }
  if (msgLower.includes('audio file too short')) {
    return 'File ghi âm quá ngắn. Vui lòng ghi âm lâu hơn.';
  }
  if (msgLower.includes('audio file too long')) {
    return 'File ghi âm vượt quá thời lượng quy định.';
  }
  if (msgLower.includes('invalid audio input') || msgLower.includes('invalid audio format')) {
    return 'Định dạng hoặc dữ liệu âm thanh không hợp lệ.';
  }
  if (msgLower.includes('processing failed on the server')) {
    return 'Lỗi xử lý âm thanh trên máy chủ. Vui lòng thử lại sau.';
  }
  if (msgLower.includes('failed to fetch final status')) {
    return 'Không thể lấy kết quả chấm điểm cuối cùng.';
  }
  if (msgLower.includes('no refresh token provided')) {
    return 'Thiếu mã làm mới phiên đăng nhập.';
  }
  if (msgLower.includes('refresh token invalid or expired')) {
    return 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (msgLower.includes('internal server error')) {
    return 'Đã xảy ra lỗi hệ thống phía máy chủ.';
  }
  if (msgLower.includes('invalid text input')) {
    return 'Văn bản mẫu không hợp lệ.';
  }
  if (msgLower.includes('vertex ai failed')) {
    return 'Kết nối với dịch vụ AI bị gián đoạn.';
  }
  if (msgLower.includes('task execution failed')) {
    return 'Tiến trình chấm điểm thất bại.';
  }
  if (msgLower.includes('audio file not found')) {
    return 'Không tìm thấy file ghi âm trên máy chủ.';
  }
  if (msgLower.includes('max retries exceeded')) {
    return 'Đã thử lại tối đa số lần cho phép nhưng vẫn thất bại.';
  }
  if (msgLower.includes('device error') || msgLower.includes('notallowederror')) {
    return 'Không thể truy cập microphone. Vui lòng cấp quyền cho trình duyệt.';
  }
  if (msgLower.includes('network error') || msgLower.includes('failed to fetch') || msgLower.includes('network')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet.';
  }

  return msg;
}

export type QueuePhase =
  | 'idle'
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'error';

export interface UseSmartQueueReturn {
  /** Submit audio for scoring through the Django gateway */
  submit: (audioBlob: Blob, language: 'en' | 'zh', targetText?: string) => Promise<void>;
  /** Current phase of the queue lifecycle */
  phase: QueuePhase;
  /** Queue position (0 = not in queue or being processed) */
  queuePosition: number;
  /** Estimated wait in seconds */
  estimatedWait: number;
  /** The full scoring result when completed */
  resultData: ScoringResponse | null;
  /** Overall score extracted for quick display */
  score: number | null;
  /** Error message if phase is 'error' */
  errorMessage: string | null;
  /** Task ID for reference */
  taskId: string | null;
  /** Reset everything back to idle */
  reset: () => void;
}

/**
 * Smart Queue hook — handles the full async scoring lifecycle:
 * 1. Upload audio to Django gateway
 * 2. Receive task_id + initial queue position
 * 3. Poll for status updates
 * 4. Transition through phases: idle → uploading → queued → processing → completed/error
 */
export function useSmartQueue(): UseSmartQueueReturn {
  const [phase, setPhase] = useState<QueuePhase>('idle');
  const [queuePosition, setQueuePosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [resultData, setResultData] = useState<ScoringResponse | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const { isAuthenticated } = useAuthStore();

  // Smooth client-side ticking countdown for estimatedWait (EWT)
  useEffect(() => {
    if (phase !== 'queued' && phase !== 'processing') {
      return;
    }
    if (estimatedWait <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setEstimatedWait((prev) => {
        if (prev <= 1) {
          // Keep it at 1 second while waiting for final WebSocket resolution event
          return 1;
        }
        // Slow down the countdown if it's getting very close to 0 to avoid hitting it early
        if (prev <= 5) {
          return Math.random() < 0.25 ? prev - 1 : prev;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, estimatedWait]);

  const handleWsMessage = useCallback((msg: any) => {
    if (!isMountedRef.current || !taskId) return;

    // Check if message belongs to our task
    if (msg.payload?.task_id !== taskId) return;

    if (msg.type === 'score_complete') {
      setPhase('completed');
      setScore(msg.payload.score);
      // Optional: We might need to fetch the full result_data since WS only sends score
      // but for now, we just rely on WS data or fetch status once
      fetchFinalStatus(taskId);
    } else if (msg.type === 'score_failed') {
      setPhase('error');
      setErrorMessage(translateErrorMessage(msg.payload.error || 'Processing failed on the server.'));
    }
  }, [taskId]);

  const { isConnected } = useWebSocket({
    onMessage: handleWsMessage
  });

  const fetchFinalStatus = async (id: string) => {
    try {
      const res = await djangoClient.get(`/assessments/status/${id}/`);
      if (!isMountedRef.current) return;
      const data = res.data;
      setResultData(data.result_data);
      setScore(data.score);
    } catch (err) {
      console.error('Failed to fetch final status', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {

    setPhase('idle');
    setQueuePosition(0);
    setEstimatedWait(0);
    setResultData(null);
    setScore(null);
    setErrorMessage(null);
    setTaskId(null);
  }, []);

  const submit = useCallback(async (
    audioBlob: Blob,
    language: 'en' | 'zh',
    targetText?: string,
  ) => {
    // Reset state for new submission
    reset();
    setPhase('uploading');

    try {
      // ── Validate text input ("Warm welcome" layer) ─────────────────
      if (targetText && targetText.trim()) {
        const validation = validateTextInput(targetText.trim(), language);
        if (!validation.isValid) {
          throw new Error(validation.errorMessage || 'Invalid text input.');
        }
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('language', language);

      if (!isAuthenticated) {
        const guestId = getGuestId();
        if (guestId) formData.append('guest_id', guestId);
      }

      if (targetText && targetText.trim()) {
        formData.append('target_text', targetText.trim());
      }

      const res = await djangoClient.post(`/assessments/submit/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      const data: TaskSubmitResponse = res.data;

      if (!isMountedRef.current) return;

      setTaskId(data.task_id);
      setQueuePosition(data.queue_position);
      setEstimatedWait(data.estimated_wait_seconds);

      // Determine initial phase based on queue position
      if (data.queue_position <= 4) {
        setPhase('processing');
      } else {
        setPhase('queued');
      }

      // Instead of polling, we wait for WS events via handleWsMessage
      // Note: In case WS is not connected, a fallback might be needed later
      // but for now we rely entirely on WS as requested.

    } catch (err: any) {
      if (!isMountedRef.current) return;
      
      let message = 'Failed to submit audio.';
      if (err && err.isRateLimited) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      } else if (err?.message) {
        message = err.message;
      }
      
      setPhase('error');
      setErrorMessage(translateErrorMessage(message));
      console.error('[useSmartQueue] Submit failed:', err);
    }
  }, [reset, isAuthenticated]);

  return {
    submit,
    phase,
    queuePosition,
    estimatedWait,
    resultData,
    score,
    errorMessage,
    taskId,
    reset,
  };
}
