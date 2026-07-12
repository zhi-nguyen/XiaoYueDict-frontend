'use client';

import React from 'react';
import { Persona } from './types';

interface TutorListViewProps {
  personas: Persona[];
  isLoading: boolean;
  onSelectPersona: (p: Persona) => void;
  onOpenSetup: () => void;
}

export default function TutorListView({
  personas,
  isLoading,
  onSelectPersona,
  onOpenSetup,
}: TutorListViewProps) {
  return (
    <div className="w-full bg-white flex flex-col h-full overflow-hidden font-lexend">
      {/* Header */}
      <div className="h-16 px-6 border-b border-outline flex justify-between items-center bg-slate-50/50 shrink-0">
        <h3 className="font-bold text-lg text-primary tracking-tight">Gia sư đồng hành</h3>
        <button
          onClick={onOpenSetup}
          title="Tạo gia sư mới"
          className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all focus:outline-none"
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : personas.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 h-full max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-primary">face_6</span>
            </div>
            <h3 className="font-bold text-lg text-primary mt-2">Chưa kết nối gia sư</h3>
            <p className="text-sm text-secondary mt-2 leading-relaxed">
              Bạn chưa khởi tạo gia sư nào đồng hành. Hãy tạo ngay một người bạn học cùng nhé!
            </p>
            <button
              onClick={onOpenSetup}
              className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-[#334155] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md focus:outline-none"
            >
              <span>Kết nối gia sư</span>
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {personas.map((p) => {
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPersona(p)}
                  className="w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-hover-bg active:bg-slate-100 focus:outline-none border border-transparent hover:border-slate-100"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden relative">
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.agent_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      p.avatar_emoji || '👩‍🏫'
                    )}
                  </div>
                  
                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-bold text-base text-primary truncate">{p.agent_name}</p>
                      <span className="text-[10px] text-slate-400 capitalize bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                        {p.relation_type || 'Gia sư'}
                      </span>
                    </div>
                    
                    <p className="text-[12px] text-secondary truncate mt-0.5">
                      {p.context_setting === 'wuxia' ? 'Cổ trang' : p.context_setting === 'academic' ? 'Học đường' : 'Hiện đại'} • {p.learning_language === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-1 italic">
                      {p.personality_desc || 'Sẵn sàng bắt đầu bài học mới'}
                    </p>
                  </div>
                  
                  {/* Arrow Icon */}
                  <div className="text-slate-300">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
