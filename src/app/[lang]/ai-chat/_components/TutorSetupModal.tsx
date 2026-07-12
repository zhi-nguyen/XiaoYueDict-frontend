'use client';

import React, { useState, useEffect } from 'react';
import { djangoClient } from '@/lib/apiClient';
import { CONTEXT_SETTINGS, ROLE_MAP, LEVEL_MAP } from './types';

interface TutorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (persona: any) => void;
  lang: string;
  defaultName: string;
}

export default function TutorSetupModal({
  isOpen,
  onClose,
  onCreated,
  lang,
  defaultName,
}: TutorSetupModalProps) {
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState('male');
  const [formBirthYear, setFormBirthYear] = useState('2000');
  const [formContext, setFormContext] = useState(lang === 'zh' ? 'wuxia' : 'modern');
  const [formLevel, setFormLevel] = useState('Beginner');
  const [formRelationChoice, setFormRelationChoice] = useState('peer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormName(defaultName);
  }, [defaultName]);

  // Sync formContext when language changes
  useEffect(() => {
    setFormContext(lang === 'zh' ? 'wuxia' : 'modern');
  }, [lang]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data } = await djangoClient.post('/xiaoyue-chat/persona/', {
        user_name: formName.trim(),
        gender: formGender,
        birth_year: parseInt(formBirthYear),
        context_setting: formContext,
        learning_language: lang,
        user_level: formLevel,
        relation_choice: formRelationChoice,
      });
      onCreated(data);
      onClose();
    } catch (err) {
      console.error('Failed to create persona:', err);
      alert('Không thể khởi tạo gia sư. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="w-full max-w-md bg-white border border-outline rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto sidebar-scroll animate-in fade-in zoom-in-95 duration-200">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all focus:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="text-center mb-6">
          <span className="material-symbols-outlined text-5xl text-primary bg-primary/10 p-4 rounded-full">face_6</span>
          <h2 className="font-bold text-2xl text-primary mt-4">Tìm Gia sư AI</h2>
          <p className="text-sm text-secondary mt-1">
            Nhập thông tin của bạn để khởi tạo gia sư đồng hành ngẫu nhiên.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-secondary uppercase">Tên của bạn</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ví dụ: Hứa, Anh Thư..."
              className="w-full px-4 py-3 bg-[#fafafa] border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-primary text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-secondary uppercase">Giới tính</label>
              <select
                value={formGender}
                onChange={(e) => setFormGender(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafafa] border border-slate-200 rounded-2xl text-sm focus:outline-none text-slate-800"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-secondary uppercase">Năm sinh</label>
              <input
                type="number"
                required
                min="1940"
                max="2026"
                value={formBirthYear}
                onChange={(e) => setFormBirthYear(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafafa] border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-primary text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-secondary uppercase">Bối cảnh hội thoại</label>
            <select
              value={formContext}
              onChange={(e) => {
                setFormContext(e.target.value);
                setFormRelationChoice('peer');
              }}
              className="w-full px-4 py-3 bg-[#fafafa] border border-slate-200 rounded-2xl text-sm focus:outline-none text-slate-800"
            >
              {CONTEXT_SETTINGS.filter(c => c.langs.includes(lang)).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-secondary uppercase">Vai trò mối quan hệ</label>
            <select
              value={formRelationChoice}
              onChange={(e) => setFormRelationChoice(e.target.value)}
              className="w-full px-4 py-3 bg-[#fafafa] border border-slate-200 rounded-2xl text-sm focus:outline-none text-slate-800 truncate"
            >
              {formContext === 'wuxia' && (
                <>
                  <option value="peer">Đồng môn (Sư huynh/Sư tỷ)</option>
                  <option value="master">Sư Phụ</option>
                </>
              )}
              {formContext === 'modern' && (
                <>
                  <option value="peer">Ngẫu nhiên ngang hàng</option>
                  <option value="colleague">Đồng nghiệp</option>
                  <option value="bestie">Bạn thân</option>
                  <option value="crush">Người thầm thương (Crush)</option>
                  <option value="interviewer">Người phỏng vấn</option>
                </>
              )}
              {formContext === 'academic' && (
                <>
                  <option value="peer">Ngẫu nhiên ngang hàng</option>
                  <option value="classmate">Bạn cùng lớp</option>
                  <option value="professor">Giáo sư / Giảng viên</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-secondary uppercase">
              {lang === 'zh' ? 'Trình độ HSK' : 'Trình độ Tiếng Anh'}
            </label>
            <select
              value={formLevel}
              onChange={(e) => setFormLevel(e.target.value)}
              className="w-full px-4 py-3 bg-[#fafafa] border border-slate-200 rounded-2xl text-sm focus:outline-none text-slate-800"
            >
              {(LEVEL_MAP[lang] || []).map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-[#334155] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md text-sm mt-6 focus:outline-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Tạo Gia Sư Đồng Hành</span>
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-sm mt-2 focus:outline-none"
          >
            Hủy bỏ
          </button>
        </form>
      </div>
    </div>
  );
}
