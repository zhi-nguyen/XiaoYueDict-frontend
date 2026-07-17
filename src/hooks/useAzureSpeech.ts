'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { djangoClient } from '@/lib/apiClient';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export interface UseAzureSpeechReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  hasPermission: boolean | null;
  error: string | null;
  confidence: number;
  checkMicrophonePermission: () => Promise<boolean>;
  startListening: (learningLanguage: string) => Promise<void>;
  stopListening: () => void;
}

export function useAzureSpeech(): UseAzureSpeechReturn {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(1.0);

  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);
  
  // Cache credentials
  const tokenRef = useRef<string | null>(null);
  const regionRef = useRef<string | null>(null);
  const thresholdRef = useRef<number>(0.55);
  const tokenFetchedAtRef = useRef<number>(0);
  const isFetchingTokenRef = useRef<boolean>(false);
  
  const accumulatedTextRef = useRef<string>('');

  // Fetch token function
  const fetchToken = useCallback(async (force = false): Promise<boolean> => {
    // Avoid double fetching
    if (isFetchingTokenRef.current) return false;

    // Check if token is still valid (fresh within 9 minutes)
    const now = Date.now();
    if (!force && tokenRef.current && (now - tokenFetchedAtRef.current < 9 * 60 * 1000)) {
      return true;
    }

    isFetchingTokenRef.current = true;
    try {
      const response = await djangoClient.post('/users/azure-speech-token/');
      const { token, region, confidence_threshold } = response.data;
      
      tokenRef.current = token;
      regionRef.current = region;
      thresholdRef.current = confidence_threshold;
      tokenFetchedAtRef.current = Date.now();
      isFetchingTokenRef.current = false;
      return true;
    } catch (err: any) {
      console.error('Failed to fetch Azure Speech token:', err);
      setError('Không thể kết nối dịch vụ nhận dạng giọng nói.');
      isFetchingTokenRef.current = false;
      return false;
    }
  }, []);

  // Check and request microphone permission (Warm-up / Onboarding)
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the warm-up stream immediately to release hardware
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err: any) {
      console.warn('Microphone permission denied:', err);
      setHasPermission(false);
      setError('Vui lòng cấp quyền truy cập Microphone để sử dụng tính năng này.');
      return false;
    }
  }, []);

  // Pre-fetch token on mount
  useEffect(() => {
    fetchToken();

    // Check existing permissions on mount if API is supported
    if (typeof window !== 'undefined' && navigator?.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          setHasPermission(permissionStatus.state === 'granted');
          
          permissionStatus.onchange = () => {
            setHasPermission(permissionStatus.state === 'granted');
          };
        }).catch(() => {});
    }

    // Interval to refresh token every 8 minutes
    const intervalId = setInterval(() => {
      fetchToken(true);
    }, 8 * 60 * 1000);

    // Focus revalidation
    const handleFocus = () => {
      const now = Date.now();
      if (now - tokenFetchedAtRef.current > 9 * 60 * 1000) {
        fetchToken(true);
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      if (recognizerRef.current) {
        recognizerRef.current.close();
      }
    };
  }, [fetchToken]);

  // Start Recognition
  const startListening = useCallback(async (learningLanguage: string) => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    accumulatedTextRef.current = '';

    // 1. Ensure token is fresh
    const tokenOk = await fetchToken();
    if (!tokenOk || !tokenRef.current || !regionRef.current) {
      setError('Dịch vụ giọng nói chưa sẵn sàng. Vui lòng thử lại.');
      return;
    }

    // 2. Establish Speech and Audio configuration
    try {
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(tokenRef.current, regionRef.current);
      
      // Enable Detailed output to get NBest confidence scores
      speechConfig.outputFormat = sdk.OutputFormat.Detailed;
      
      // Auto Language Identification Configuration
      const targetLang = learningLanguage === 'en' ? 'en-US' : 'zh-CN';
      const autoDetectConfig = sdk.AutoDetectSourceLanguageConfig.fromLanguages(['vi-VN', targetLang]);
      
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      
      const recognizer = sdk.SpeechRecognizer.FromConfig(speechConfig, autoDetectConfig, audioConfig);
      recognizerRef.current = recognizer;

      // Event handlers
      recognizer.recognizing = (s, e) => {
        setInterimTranscript(e.result.text);
      };

      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text.trim()) {
          let itemConfidence = 1.0;
          try {
            const json = JSON.parse(e.result.json);
            const nBest = json.NBest;
            if (nBest && nBest.length > 0) {
              itemConfidence = nBest[0].Confidence || 1.0;
            }
          } catch (err) {}

          setConfidence(itemConfidence);

          // Apply Confidence Filter (soft threshold)
          if (itemConfidence >= thresholdRef.current) {
            accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + e.result.text).trim();
            setTranscript(accumulatedTextRef.current);
            setInterimTranscript('');
          } else {
            console.warn(`Speech segment rejected: confidence ${itemConfidence} below threshold ${thresholdRef.current}`);
          }
        }
      };

      recognizer.canceled = (s, e) => {
        console.warn('Speech recognition canceled:', sdk.CancellationReason[e.reason], e.errorDetails);
        if (e.reason === sdk.CancellationReason.Error) {
          setError(`Lỗi nhận dạng: ${e.errorDetails}`);
          setIsListening(false);
        }
      };

      recognizer.sessionStopped = () => {
        setIsListening(false);
      };

      // Start continuous recognition synchronously
      setIsListening(true);
      recognizer.startContinuousRecognitionAsync(
        () => {
          setIsListening(true);
        },
        (err) => {
          console.error('Error starting recognition:', err);
          setError('Không thể khởi động bộ thu âm.');
          setIsListening(false);
        }
      );

    } catch (err: any) {
      console.error('Error in speech SDK setup:', err);
      setError('Không thể truy cập Microphone.');
      setIsListening(false);
    }
  }, [fetchToken]);

  // Stop Recognition — use ref instead of isListening state to avoid stale closure
  const stopListening = useCallback(() => {
    if (!recognizerRef.current) return;

    const currentRecognizer = recognizerRef.current;
    recognizerRef.current = null;

    try {
      currentRecognizer.stopContinuousRecognitionAsync(
        () => {
          setIsListening(false);
          setInterimTranscript('');
          currentRecognizer.close();
        },
        (err) => {
          console.error('Error stopping recognition:', err);
          setIsListening(false);
          setInterimTranscript('');
          currentRecognizer.close();
        }
      );
    } catch (err) {
      setIsListening(false);
      setInterimTranscript('');
      try { currentRecognizer.close(); } catch (e) {}
    }
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    hasPermission,
    error,
    confidence,
    checkMicrophonePermission,
    startListening,
    stopListening,
  };
}
