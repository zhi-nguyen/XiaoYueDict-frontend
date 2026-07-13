'use client';

import React from 'react';
import { Persona, EMOTION_MAP } from './types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: Persona;
  joyLevel: number;
  sadLevel: number;
  onDeletePersona: () => void;
  currentEmotionEmoji: string;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  activePersona,
  joyLevel,
  sadLevel,
  onDeletePersona,
  currentEmotionEmoji,
}: ChatDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 bg-surface border-l border-outline shadow-2xl z-50 transition-transform duration-300 transform translate-x-0 flex flex-col p-6 overflow-y-auto space-y-6">

        {/* Header of Drawer */}
        <div className="flex justify-between items-center pb-4 border-b border-outline shrink-0">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-secondary hover:bg-hover-bg hover:text-primary transition-all focus:outline-none"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Dynamic Persona Profile Card */}
        <div className="border border-outline rounded-2xl p-5 flex flex-col items-center text-center shadow-sm bg-white">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-100 to-rose-200 border-2 border-rose-300 flex items-center justify-center text-4xl shadow-md relative overflow-visible">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {activePersona.avatar_url ? (
                <img
                  src={activePersona.avatar_url}
                  alt={activePersona.agent_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{activePersona.avatar_emoji || "👩‍🏫"}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 text-xl bg-white rounded-full p-1 border border-outline flex items-center justify-center shadow-md">
              {currentEmotionEmoji}
            </span>
          </div>

          <h3 className="font-bold text-lg text-primary mt-4">{activePersona.agent_name}</h3>

          <p className="text-[13px] text-secondary leading-relaxed mt-3">
            {activePersona.personality_desc || "Chưa thiết lập"}
          </p>

          <div className="w-full border-t border-outline/60 mt-4 pt-3 text-left space-y-2 text-[12px] text-secondary">
            <div>
              <span className="font-bold text-primary">Cách xưng hô:</span> {activePersona.agent_self_ref || "AI"} (AI) - {activePersona.user_honorific || "Bạn"} (Bạn)
            </div>
            <div>
              <span className="font-bold text-primary">Năm sinh AI:</span> {activePersona.agent_birth_year != null ? activePersona.agent_birth_year : '?'} ({activePersona.age_diff != null ? (activePersona.age_diff > 0 ? `Lớn hơn bạn ${activePersona.age_diff}` : activePersona.age_diff < 0 ? `Nhỏ hơn bạn ${Math.abs(activePersona.age_diff)}` : 'Bằng tuổi') : 'Bí ẩn'})
            </div>
            <div>
              <span className="font-bold text-primary">Bối cảnh:</span> {activePersona.context_setting === 'wuxia' ? 'Cổ trang' : activePersona.context_setting === 'academic' ? 'Học đường' : 'Hiện đại'}
            </div>
          </div>
        </div>

        {/* Emotion Meter (Joy / Sad) */}
        <div className="border border-outline rounded-2xl p-5 shadow-sm space-y-4 bg-white">
          <h4 className="font-bold text-sm text-primary uppercase tracking-wider">
            Trạng thái cảm xúc
          </h4>

          {/* Joy level */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[12px] font-bold text-slate-700">
              <span className="flex items-center gap-1">Niềm vui:</span>
              <span className="text-emerald-600">{Math.round(joyLevel * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div
                style={{ width: `${joyLevel * 100}%` }}
                className="h-full bg-gradient-to-r from-emerald-400 to-yellow-400 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Sad level */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[12px] font-bold text-slate-700">
              <span className="flex items-center gap-1">Buồn / Bực:</span>
              <span className="text-rose-600">{Math.round(sadLevel * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div
                style={{ width: `${sadLevel * 100}%` }}
                className="h-full bg-gradient-to-r from-rose-400 to-purple-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="border border-outline rounded-2xl p-5 shadow-sm space-y-3 bg-white">
          <h4 className="font-bold text-sm text-primary uppercase tracking-wider">
            Thao tác nhanh
          </h4>

          <button
            onClick={onDeletePersona}
            className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm focus:outline-none"
          >
            <span className="material-symbols-outlined text-[18px]">person_remove</span>
            <span>Xoá Kết Nối</span>
          </button>
        </div>
      </div>
    </>
  );
}
