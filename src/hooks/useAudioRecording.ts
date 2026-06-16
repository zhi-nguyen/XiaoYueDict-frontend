'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { audioBufferToWav } from '@/lib/audioUtils';

interface UseAudioRecordingReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  activeStream: MediaStream | null;
  isPlayingPlayback: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTogglePlayback: () => void;
  handleResetAudio: () => void;
  /** Error message from recording attempt (e.g. mic permission denied). */
  recordingError: string | null;
}

/**
 * Encapsulates microphone recording, file upload, and audio playback logic.
 * Converts WebM recordings to WAV for backend compatibility.
 */
export function useAudioRecording(
  onRecordingError?: (message: string) => void,
  onBeforeRecord?: () => void
): UseAudioRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [isPlayingPlayback, setIsPlayingPlayback] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup playback on unmount
  useEffect(() => {
    return () => {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
        playbackAudioRef.current.currentTime = 0;
        playbackAudioRef.current = null;
      }
    };
  }, []);

  const handleResetAudio = useCallback(() => {
    setAudioBlob(null);
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
      playbackAudioRef.current = null;
    }
    setIsPlayingPlayback(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setRecordingError(null);
      onBeforeRecord?.();
      handleResetAudio();
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setActiveStream(stream);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setActiveStream(null);

        const webmBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        try {
          const arrayBuffer = await webmBlob.arrayBuffer();
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          const wavBlob = audioBufferToWav(decoded);
          setAudioBlob(wavBlob);
        } catch {
          setAudioBlob(webmBlob);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      const errMsg = 'Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.';
      setRecordingError(errMsg);
      onRecordingError?.(errMsg);
    }
  }, [handleResetAudio, onBeforeRecord, onRecordingError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onBeforeRecord?.();
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
        playbackAudioRef.current.currentTime = 0;
        playbackAudioRef.current = null;
      }
      setIsPlayingPlayback(false);
      setAudioBlob(file);
    }
  }, [onBeforeRecord]);

  const handleTogglePlayback = useCallback(() => {
    if (!audioBlob) return;

    if (!playbackAudioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      playbackAudioRef.current = audio;
      audio.onended = () => {
        setIsPlayingPlayback(false);
      };
    }

    if (isPlayingPlayback) {
      playbackAudioRef.current.pause();
      setIsPlayingPlayback(false);
    } else {
      playbackAudioRef.current.currentTime = 0;
      playbackAudioRef.current.play();
      setIsPlayingPlayback(true);
    }
  }, [audioBlob, isPlayingPlayback]);

  return {
    isRecording,
    audioBlob,
    activeStream,
    isPlayingPlayback,
    fileInputRef,
    startRecording,
    stopRecording,
    handleFileUpload,
    handleTogglePlayback,
    handleResetAudio,
    recordingError,
  };
}
