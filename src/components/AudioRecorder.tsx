'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { getAudioDurationLimit, getAudioSizeLimitBytes } from '@/lib/subscriptionUtils';

type Status = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

export default function AudioRecorder() {
  const [status, setStatus] = useState<Status>('idle');
  const [score, setScore] = useState<number | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { tier } = useSubscriptionStore();
  const durationLimit = getAudioDurationLimit(tier);
  const sizeLimit = getAudioSizeLimitBytes(tier);

  const {
    isRecording,
    timeLeft,
    audioBlob,
    fileInputRef,
    startRecording: hookStartRecording,
    stopRecording: hookStopRecording,
    handleFileUpload: hookHandleFileUpload,
    handleResetAudio,
    recordingError
  } = useAudioRecording(
    (err) => {
      setStatus('error');
      setErrorMessage(err);
    },
    () => {
      setErrorMessage('');
      setScore(null);
    },
    durationLimit
  );

  // Sync state when recording status changes
  useEffect(() => {
    if (isRecording) {
      setStatus('recording');
    } else if (status === 'recording') {
      setStatus('processing');
    }
  }, [isRecording, status]);

  // Submit audio when it's converted by the hook
  useEffect(() => {
    if (audioBlob) {
      if (audioBlob.size > sizeLimit) {
        setStatus('error');
        const limitDisplay = sizeLimit >= 1024 * 1024 ? `${sizeLimit / (1024 * 1024)}MB` : `${sizeLimit / 1024}KB`;
        setErrorMessage(`Dung lượng tệp ghi âm vượt quá giới hạn tối đa cho phép cho gói của bạn (${limitDisplay}).`);
        return;
      }
      setStatus('processing');
      submitAudio(audioBlob);
    }
  }, [audioBlob, sizeLimit]);

  // Cleanup polling on unmount
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      if (!taskId) return;

      try {
        const response = await fetch(`/api/assessments/status/${taskId}/`);
        if (!response.ok) throw new Error('Failed to fetch status');
        
        const data = await response.json();
        
        if (data.status === 'COMPLETED') {
          setStatus('completed');
          setScore(data.score);
          clearInterval(pollingInterval);
        } else if (data.status === 'FAILED') {
          setStatus('error');
          setErrorMessage(data.error_message || 'Processing failed on the server.');
          clearInterval(pollingInterval);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    if (status === 'processing' && taskId) {
      pollingInterval = setInterval(checkStatus, 2000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [status, taskId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > sizeLimit) {
        setStatus('error');
        const limitDisplay = sizeLimit >= 1024 * 1024 ? `${sizeLimit / (1024 * 1024)}MB` : `${sizeLimit / 1024}KB`;
        setErrorMessage(`Dung lượng tệp vượt quá giới hạn tối đa cho phép cho gói của bạn (${limitDisplay}).`);
        return;
      }
      setErrorMessage('');
      setScore(null);
      setStatus('processing');
      hookHandleFileUpload(event);
    }
  };

  const submitAudio = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.wav');

      const response = await fetch('/api/assessments/submit/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit audio');
      }

      const data = await response.json();
      if (data.task_id) {
        setTaskId(data.task_id);
      } else {
        throw new Error('No task ID returned from server');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to submit audio for assessment.');
    }
  };

  const handleStart = () => {
    setTaskId(null);
    hookStartRecording();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white shadow-xl rounded-2xl max-w-md mx-auto mt-10 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Pronunciation Assessment</h2>

      {/* Recording Control */}
      <div className="mb-8 flex flex-col items-center justify-center space-y-6">
        <div className="flex justify-center">
          {status === 'idle' || status === 'completed' || status === 'error' ? (
            <button
              type="button"
              onClick={handleStart}
              className="w-24 h-24 rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all flex items-center justify-center shadow-lg"
              aria-label="Start recording"
            >
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-2a5 5 0 01-10 0H3a7.001 7.001 0 006 6.93V17H6v2h8v-2h-3v-2z" clipRule="evenodd" />
              </svg>
            </button>
          ) : status === 'recording' ? (
            <button
              type="button"
              onClick={hookStopRecording}
              className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all flex items-center justify-center shadow-lg animate-pulse"
              aria-label="Stop recording"
            >
              <div className="w-8 h-8 bg-white rounded-sm"></div>
            </button>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center shadow-inner">
              <svg className="animate-spin w-10 h-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* Upload Control */}
        {(status === 'idle' || status === 'completed' || status === 'error') && (
          <div className="flex flex-col items-center">
            <input 
              type="file" 
              accept="audio/wav, audio/webm, audio/mp3" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
            >
              Upload File to Test
            </button>
            <span className="text-xs text-gray-400 mt-2">or use your microphone above</span>
          </div>
        )}
      </div>

      {/* Status & Feedback Text */}
      <div className="text-center min-h-[4rem]">
        {status === 'idle' && (
          <p className="text-gray-500 text-lg">Tap the microphone to start</p>
        )}
        {status === 'recording' && (
          <p className="text-red-500 font-medium text-lg animate-pulse">
            Recording... ({timeLeft}s left)
          </p>
        )}
        {status === 'processing' && (
          <p className="text-blue-600 font-medium text-lg">Analyzing pronunciation...</p>
        )}
        {status === 'error' && (
          <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
            <p className="font-semibold mb-1">An error occurred</p>
            <p className="text-sm">{errorMessage}</p>
            <button 
              onClick={() => {
                setStatus('idle');
                handleResetAudio();
              }} 
              className="mt-2 text-xs font-medium underline text-red-700 hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )}
        {status === 'completed' && score !== null && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider mb-1">Your Score</p>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 pb-2">
              {score}
            </div>
            <button 
              className="mt-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-full transition-colors text-sm" 
              onClick={() => {
                setStatus('idle');
                handleResetAudio();
              }}
            >
              Try another recording
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
