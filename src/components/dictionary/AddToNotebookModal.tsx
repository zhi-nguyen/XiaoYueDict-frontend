'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchNotebooks, createWord, createNotebook } from '@/lib/api/notes';
import { Notebook } from '@/types/note';
import { ZhWord } from '@/types/dictionary';

interface AddToNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: any; // Chấp nhận cả ZhWord và EnWord
}

export default function AddToNotebookModal({ isOpen, onClose, word }: AddToNotebookModalProps) {
  const isEnglish = !word.pinyin && (!!word.ipa || !!word.cefr_level || !/[\u4e00-\u9fff]/.test(word.word));
  const lang = isEnglish ? 'en' : 'zh';

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | ''>('');
  const [vocab, setVocab] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaning, setMeaning] = useState('');
  const [note, setNote] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookDesc, setNewNotebookDesc] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotebooks(lang);
      // Reset state for new word
      setVocab(word.word || '');
      setPinyin(word.pinyin || word.ipa || '');
      setMeaning(word.translation_vi || '');
      setNote('');
      setErrorMsg('');
      setSuccessMsg('');
      setIsCreatingNotebook(false);
      setNewNotebookName('');
      setNewNotebookDesc('');
    }
  }, [isOpen, word, lang]);

  async function loadNotebooks(targetLang: string) {
    try {
      setIsLoading(true);
      const list = await fetchNotebooks(targetLang);
      setNotebooks(list);
      if (list.length > 0) {
        setSelectedNotebookId(list[0].id);
        setIsCreatingNotebook(false);
      } else {
        setSelectedNotebookId('');
        setIsCreatingNotebook(true);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách sổ tay:", err);
      setErrorMsg('Không thể tải danh sách sổ tay. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isCreatingNotebook) {
      if (!newNotebookName.trim()) {
        setErrorMsg('Tên sổ tay không được để trống.');
        return;
      }
    } else {
      if (!selectedNotebookId) {
        setErrorMsg('Vui lòng chọn một sổ tay.');
        return;
      }
    }
    if (!vocab.trim() || !meaning.trim()) {
      setErrorMsg('Từ vựng và nghĩa không được để trống.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');

      let notebookId = selectedNotebookId;
      if (isCreatingNotebook) {
        const newNotebook = await createNotebook({
          name: newNotebookName.trim(),
          description: newNotebookDesc.trim()
        }, lang);
        notebookId = newNotebook.id;
      }

      await createWord(notebookId, {
        vocabulary: vocab.trim(),
        pinyin: pinyin.trim(),
        meaning: meaning.trim(),
        note: note.trim(),
      });
      setSuccessMsg('Đã lưu từ vựng vào sổ tay thành công!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Lỗi khi thêm từ vào sổ tay:", err);
      setErrorMsg('Lỗi khi lưu từ vựng. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) return null;
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-2xl font-bold text-primary">Thêm vào Sổ Tay</h2>
          <button 
            onClick={onClose} 
            className="text-secondary hover:text-primary transition-colors"
            title="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Notebook Selector */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-secondary">Chọn Sổ Tay</label>
              {!isCreatingNotebook && notebooks.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNotebook(true);
                    setNewNotebookName('');
                    setNewNotebookDesc('');
                  }}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  + Tạo sổ mới
                </button>
              )}
            </div>

            {isCreatingNotebook ? (
              <div className="p-4 bg-hover-bg/50 border border-outline rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Tạo Sổ Tay Mới</h4>
                  {notebooks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNotebook(false)}
                      className="text-xs text-secondary hover:text-primary transition-colors"
                    >
                      Hủy
                    </button>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Tên sổ tay (ví dụ: Từ quan trọng, HSK4...)"
                    value={newNotebookName}
                    onChange={e => setNewNotebookName(e.target.value)}
                    className="w-full border border-outline rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary transition-colors"
                    required={isCreatingNotebook}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Mô tả sổ tay (tùy chọn)"
                    value={newNotebookDesc}
                    onChange={e => setNewNotebookDesc(e.target.value)}
                    className="w-full border border-outline rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            ) : isLoading ? (
              <div className="py-2.5 px-4 border border-outline rounded-xl bg-hover-bg text-secondary text-sm flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Đang tải danh sách sổ...
              </div>
            ) : notebooks.length === 0 ? (
              <div className="p-4 bg-hover-bg/30 border border-dashed border-outline rounded-xl text-center text-secondary text-sm">
                Bạn chưa có sổ tay nào.
                <button
                  type="button"
                  onClick={() => setIsCreatingNotebook(true)}
                  className="text-primary font-bold block mt-1 hover:underline mx-auto"
                >
                  + Tạo sổ tay mới ngay
                </button>
              </div>
            ) : (
              <select
                value={selectedNotebookId}
                onChange={e => setSelectedNotebookId(e.target.value)}
                className="w-full border border-outline rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-primary transition-colors text-sm font-medium"
              >
                {notebooks.map(nb => (
                  <option key={nb.id} value={nb.id}>
                    {nb.name} ({nb.word_count_annotated || 0} từ)
                  </option>
                ))}
              </select>
            )}
          </div>

          <hr className="border-outline/50" />

          {/* Word Fields Review */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">Xem lại thông tin</h3>
            
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Từ vựng ({lang === 'en' ? 'Tiếng Anh' : 'Tiếng Trung'})
              </label>
              <input 
                type="text" 
                value={vocab}
                onChange={e => setVocab(e.target.value)}
                className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors font-noto-sc text-lg font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                {lang === 'en' ? 'Phiên âm (IPA)' : 'Pinyin (Bính âm)'}
              </label>
              <input 
                type="text" 
                value={pinyin}
                onChange={e => setPinyin(e.target.value)}
                className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm font-medium text-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Nghĩa Tiếng Việt</label>
              <input 
                type="text" 
                value={meaning}
                onChange={e => setMeaning(e.target.value)}
                className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Ghi chú (tùy chọn)</label>
              <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors min-h-[85px] text-sm"
                placeholder="Ví dụ câu đặt, giải thích ngữ cảnh..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline/50 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-secondary hover:bg-hover-bg transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSaving || (!isCreatingNotebook && notebooks.length === 0) || !vocab.trim() || !meaning.trim() || (isCreatingNotebook && !newNotebookName.trim())}
              className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center"
            >
              {isSaving ? (
                <span className="material-symbols-outlined animate-spin mr-2 text-[18px]">progress_activity</span>
              ) : null}
              Lưu từ vựng
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
