"use client";

import React from 'react';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/mediaUtils';

interface UserAvatarContainerProps {
  user: {
    avatar?: string | null;
    first_name?: string;
    last_name?: string;
    username?: string;
    equipped_frame?: {
      image_url: string;
      ui_metadata?: {
        frame_type?: string;
        assets?: {
          overlay_svg_url?: string;
        };
        style?: React.CSSProperties;
        custom_css?: string;
      };
    } | null;
  } | null;
  sizeClass?: string; // e.g., 'w-10 h-10', 'w-16 h-16', 'w-20 h-20'
  onClick?: () => void;
}

export default function UserAvatarContainer({
  user,
  sizeClass = "w-10 h-10",
  onClick
}: UserAvatarContainerProps) {
  if (!user) {
    return <div className={`${sizeClass} rounded-full bg-primary/10 animate-pulse`} />;
  }

  const frame = user.equipped_frame;
  const frameUrl = frame
    ? getMediaUrl(frame.ui_metadata?.assets?.overlay_svg_url || frame.image_url)
    : null;
  const frameStyle = frame?.ui_metadata?.style || {};

  // Extract initials
  const initials = user.first_name && user.last_name
    ? (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase()
    : (user.first_name || user.username || 'U').substring(0, 2).toUpperCase();

  // Scale avatar to 84% and keep frame scale at 136%
  const avatarClass = frame
    ? "absolute w-[84%] h-[84%] top-[8%] left-[8%] rounded-full overflow-hidden"
    : "absolute w-full h-full top-0 left-0 rounded-full overflow-hidden";

  const renderAvatarContent = () => {
    if (user.avatar) {
      return (
        <Image
          src={getMediaUrl(user.avatar) || ''}
          alt="User Avatar"
          width={120}
          height={120}
          unoptimized
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <div className="w-full h-full bg-primary text-white flex items-center justify-center font-bold tracking-tight text-[38%]">
        {initials}
      </div>
    );
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 cursor-pointer select-none ${sizeClass}`}
      onClick={onClick}
    >
      {/* Layer 1: Avatar Image or Initials */}
      <div className={avatarClass}>
        {renderAvatarContent()}
      </div>

      {/* Layer 2: Frame Overlay (136% size for a much larger majestic border wrapping around the avatar) */}
      {frameUrl && (
        <div
          style={frameStyle}
          className={`absolute w-[136%] h-[136%] -top-[18%] -left-[18%] z-10 pointer-events-none ${frame?.ui_metadata?.frame_type || ''}`}
        >
          {frame?.ui_metadata?.custom_css && (
            <style 
              dangerouslySetInnerHTML={{ 
                __html: frame.ui_metadata.custom_css.replace(/<\/\s*style\s*>/gi, "") 
              }} 
            />
          )}
          <img
            src={frameUrl}
            alt="Avatar Frame"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}
