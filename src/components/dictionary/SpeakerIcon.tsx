import React from 'react';
import { Volume2 } from 'lucide-react';
import { useAudioStore } from '@/store/useAudioStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface SpeakerIconProps {
  audioUrl?: string; // direct audio URL (e.g. from examples or DB)
  text: string;      // text to play via TTS or synthesis
  lang: 'zh' | 'en';
  className?: string;
  size?: number; // size in pixels
  variant?: 'lucide' | 'material';
}

export default function SpeakerIcon({
  audioUrl,
  text,
  lang,
  className = 'text-secondary hover:text-primary transition-colors focus:outline-none flex-shrink-0',
  size = 24,
  variant = 'lucide'
}: SpeakerIconProps) {
  const { activeKey, status, play } = useAudioStore();

  const key = audioUrl || `${lang}:${text}`;
  const isActive = activeKey === key;
  const isPlaying = isActive && status === 'playing';
  const isLoading = isActive && status === 'loading';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const voice = useSettingsStore.getState().getVoiceName(lang);
    let url = '';
    if (audioUrl) {
      // If it starts with /api or http, use it. Otherwise append host if needed.
      if (audioUrl.startsWith('http') || audioUrl.startsWith('/')) {
        url = audioUrl;
      } else {
        url = `/api/audio?path=${encodeURIComponent(audioUrl)}`;
      }
    } else {
      url = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${lang}`;
      if (voice && voice !== 'browser_base') {
        url += `&voice=${encodeURIComponent(voice)}`;
      }
    }

    play(key, url, text, lang, voice);
  };

  if (isLoading) {
    return (
      <button type="button" onClick={handleClick} className={className} title="Đang tải âm thanh...">
        <svg className="animate-spin" style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </button>
    );
  }

  if (isPlaying) {
    return (
      <button type="button" onClick={handleClick} className={className} title="Đang phát âm - Click để dừng">
        <svg className="text-primary" style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" className="animate-pulse" style={{ animationDuration: '0.6s' }} />
          <path d="M17 5v14" className="animate-pulse" style={{ animationDuration: '0.8s', animationDelay: '0.1s' }} />
          <path d="M22 9v6" className="animate-pulse" style={{ animationDuration: '0.5s', animationDelay: '0.2s' }} />
          <path d="M7 5v14" className="animate-pulse" style={{ animationDuration: '0.7s', animationDelay: '0.15s' }} />
          <path d="M2 9v6" className="animate-pulse" style={{ animationDuration: '0.9s', animationDelay: '0.05s' }} />
        </svg>
      </button>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={className} title="Phát âm">
      {variant === 'lucide' ? (
        <Volume2 style={{ width: size, height: size }} />
      ) : (
        <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1 }}>
          volume_up
        </span>
      )}
    </button>
  );
}
