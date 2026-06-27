'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  TaskSubmitResponse,
  TaskStatusResponse,
  ScoringResponse,
} from '@/types/scoring';
import { validateTextInput } from '@/lib/inputValidation';
import { djangoClient } from '@/lib/apiClient';
import { useWebSocket } from './useWebSocket';
import { getGuestId } from '@/lib/guest';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

/**
 * Validates audio duration asynchronously using Audio element with a 3s timeout.
 */
const validateAudioDuration = (blob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    
    // Thiết lập chốt chặn thời gian xử lý metadata tại Client (3s)
    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error("Quá thời gian trích xuất thông tin tệp tin (Metadata Timeout)."));
    }, 3000);

    audio.onloadedmetadata = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      resolve(audio.duration); // Trả về thời lượng thực tế của tệp (giây)
    };

    audio.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      reject(new Error("Trình duyệt không thể đọc định dạng tệp tin âm thanh này."));
    };
  });
};

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
  /** Error type if phase is 'error' */
  errorType: 'network' | 'validation' | 'processing' | 'rate_limit' | null;
  /** Task ID for reference */
  taskId: string | null;
  /** Reset everything back to idle */
  reset: () => void;
  /** Retry the last failed submission */
  retry: () => Promise<void>;
  /** Whether authentication state is currently resolving */
  isAuthLoading: boolean;
  /** Elapsed time in seconds since submission started */
  elapsedSeconds: number;
  /** Initial estimated wait time in seconds */
  initialEWT: number;
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
  const [errorType, setErrorType] = useState<'network' | 'validation' | 'processing' | 'rate_limit' | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [initialEWT, setInitialEWT] = useState(0);

  const isMountedRef = useRef(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const lastSubmissionRef = useRef<{
    audioBlob: Blob;
    language: 'en' | 'zh';
    targetText?: string;
  } | null>(null);

  // Smooth client-side ticking countdown for estimatedWait (EWT) and elapsed time tracking
  useEffect(() => {
    if (phase !== 'queued' && phase !== 'processing') {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= 60) {
          setPhase('error');
          setErrorMessage('Thời gian xử lý quá lâu (Timeout). Hệ thống đang bận, vui lòng thử lại sau.');
          setErrorType('processing');
          
          // Trigger atomic refund for timed out task
          if (taskId) {
            const guestId = getGuestId();
            djangoClient.post('/assessments/refund/', {
              task_id: taskId,
              guest_id: guestId || undefined
            }).then(() => {
              // Refresh subscription usage data immediately
              useSubscriptionStore.getState().fetchUsage();
            }).catch((err) => {
              console.error('[useSmartQueue] Quota refund failed:', err);
            });
          }
        }
        return next;
      });

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
  }, [phase, taskId]);

  const handleWsMessage = useCallback((msg: any) => {
    if (!isMountedRef.current || !taskId) return;

    // Check if message belongs to our task
    if (msg.payload?.task_id !== taskId) return;

    if (msg.type === 'score_complete') {
      setPhase('completed');
      setScore(msg.payload.score);
      if (msg.payload.result_data) {
        setResultData(msg.payload.result_data);
      } else {
        fetchFinalStatus(taskId);
      }
    } else if (msg.type === 'score_failed') {
      setPhase('error');
      setErrorMessage(translateErrorMessage(msg.payload.error || 'Processing failed on the server.'));
      setErrorType('processing');
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
    setErrorType(null);
    setTaskId(null);
    setElapsedSeconds(0);
    setInitialEWT(0);
  }, []);

  const submit = useCallback(async (
    audioBlob: Blob,
    language: 'en' | 'zh',
    targetText?: string,
  ) => {
    if (isAuthLoading) {
      setPhase('error');
      setErrorMessage('Đang xác thực tài khoản, vui lòng đợi giây lát.');
      setErrorType('network');
      return;
    }

    // Cache the submission arguments for retry capability
    lastSubmissionRef.current = { audioBlob, language, targetText };

    // Reset state for new submission
    reset();
    setPhase('uploading');

    try {
      // 1. Kiểm tra giới hạn cứng về dung lượng tệp tin đầu vào (2MB)
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      if (audioBlob.size > MAX_SIZE) {
        throw new Error('Dung lượng tệp ghi âm vượt quá giới hạn tối đa cho phép (2MB). Vui lòng ghi âm ngắn hơn.');
      }

      // 2. Kiểm tra giới hạn cứng về thời lượng tệp ghi âm (45 giây)
      const MAX_DURATION = 45; // 45s
      const duration = await validateAudioDuration(audioBlob);
      if (duration > MAX_DURATION) {
        throw new Error(`Thời lượng tệp ghi âm (${duration.toFixed(1)} giây) vượt quá giới hạn tối đa cho phép (45 giây). Vui lòng ghi âm ngắn hơn.`);
      }

      // 3. Kiểm tra hạn mức dung lượng còn lại (usage check trước khi submit)
      await useSubscriptionStore.getState().fetchUsage();
      const usage = useSubscriptionStore.getState().usageData;
      if (usage) {
        const remainingMin = Math.max(0, usage.limit_min - usage.used_min);
        const remainingHr = Math.max(0, usage.limit_hr - usage.used_hr);
        const remainingDay = Math.max(0, usage.limit_day - usage.used_day);

        if (audioBlob.size > remainingMin) {
          const err: any = new Error(`Dung lượng tệp (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB) vượt quá dung lượng khả dụng của phút này (${(remainingMin / 1024 / 1024).toFixed(2)} MB).`);
          err.isRateLimited = true;
          throw err;
        }
        if (audioBlob.size > remainingHr) {
          const err: any = new Error(`Dung lượng tệp (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB) vượt quá dung lượng khả dụng của giờ này (${(remainingHr / 1024 / 1024).toFixed(2)} MB).`);
          err.isRateLimited = true;
          throw err;
        }
        if (audioBlob.size > remainingDay) {
          const err: any = new Error(`Dung lượng tệp (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB) vượt quá dung lượng khả dụng của ngày này (${(remainingDay / 1024 / 1024).toFixed(2)} MB).`);
          err.isRateLimited = true;
          throw err;
        }
      }

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
      setInitialEWT(data.estimated_wait_seconds);
      setElapsedSeconds(0);

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
      let errType: 'network' | 'validation' | 'processing' | 'rate_limit' = 'network';
      
      if (err && err.isRateLimited) {
        message = err.message;
        errType = 'rate_limit';
      } else if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        message = data?.error || data?.message || data?.detail || err.message;
        if (status === 400 || status === 422) {
          errType = 'validation';
        } else if (status === 429) {
          errType = 'rate_limit';
        } else if (status === 503) {
          errType = 'network'; // Trạng thái bảo trì
        } else {
          errType = 'processing';
        }
      } else if (err instanceof Error) {
        message = err.message;
        const isNet = /network|fetch|timeout|cors|connect/i.test(err.message);
        const isVal = /giới hạn|định dạng|duration|thời lượng|dung lượng|giây|timeout/i.test(err.message);
        errType = isNet ? 'network' : (isVal ? 'validation' : 'processing');
      }
      
      setPhase('error');
      setErrorMessage(translateErrorMessage(message));
      setErrorType(errType);
      console.error('[useSmartQueue] Submit failed:', err);
    }
  }, [reset, isAuthenticated, isAuthLoading]);

  const retry = useCallback(async () => {
    if (!lastSubmissionRef.current) return;
    const { audioBlob, language, targetText } = lastSubmissionRef.current;
    await submit(audioBlob, language, targetText);
  }, [submit]);

  return {
    submit,
    phase,
    queuePosition,
    estimatedWait,
    resultData,
    score,
    errorMessage,
    errorType,
    taskId,
    reset,
    retry,
    isAuthLoading,
    elapsedSeconds,
    initialEWT,
  };
}
