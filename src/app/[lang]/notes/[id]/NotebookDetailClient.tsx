'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { fetchWords, createWord, deleteWord, updateNotebook, deleteNotebook } from '@/lib/api/notes';
import { djangoClient } from '@/lib/apiClient';
import { Notebook, Word } from '@/types/note';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';

interface NotebookDetailClientProps {
  notebookId: number;
  initialNotebook: Notebook;
  initialWords: Word[];
}

export default function NotebookDetailClient({
  notebookId,
  initialNotebook,
  initialWords,
}: NotebookDetailClientProps) {
  const router = useRouter();
  const params = useParams();
  const language = (params?.lang as string) || 'zh';

  const [notebook, setNotebook] = useState<Notebook>(initialNotebook);
  const [words, setWords] = useState<Word[]>(initialWords);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newVocab, setNewVocab] = useState('');
  const [newPinyin, setNewPinyin] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editName, setEditName] = useState(initialNotebook.name);
  const [editDesc, setEditDesc] = useState(initialNotebook.description || '');
  
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-fill Dictionary search inside modal
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupSuggestions, setLookupSuggestions] = useState<any[]>([]);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Debounced word search within notebook list
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadWords(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Debounced dictionary lookup inside add word modal (700ms)
  useEffect(() => {
    if (lookupQuery.trim().length < 1) {
      setLookupSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookupLoading(true);
      try {
        const res = await djangoClient.get(`/dictionary/zh/search/?q=${encodeURIComponent(lookupQuery)}`);
        setLookupSuggestions(res.data.results || []);
      } catch (err) {
        console.error("Lỗi tra cứu gợi ý Sổ tay:", err);
      } finally {
        setIsLookupLoading(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [lookupQuery]);

  async function loadWords(search: string) {
    try {
      const wds = await fetchWords(notebookId, search);
      setWords(wds);
    } catch (err) {
      console.error("Failed to load words:", err);
    }
  }

  async function handleAddWord(e: React.FormEvent) {
    e.preventDefault();
    if (!newVocab.trim() || !newMeaning.trim()) return;
    try {
      setAdding(true);
      const newWord = await createWord(notebookId, {
        vocabulary: newVocab.trim(),
        pinyin: newPinyin.trim(),
        meaning: newMeaning.trim(),
        note: newNote.trim()
      });
      setWords([newWord, ...words]);
      setShowAddModal(false);
      setNewVocab('');
      setNewPinyin('');
      setNewMeaning('');
      setNewNote('');
      setLookupQuery('');
      setLookupSuggestions([]);
      // update count
      setNotebook(prev => ({
        ...prev,
        word_count_annotated: (prev.word_count_annotated || 0) + 1
      }));
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Lỗi',
        message: 'Lỗi khi thêm từ vựng',
        type: 'error'
      });
    } finally {
      setAdding(false);
    }
  }

  function handleDeleteWord(wordId: number) {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa từ vựng',
      message: 'Bạn có chắc muốn xóa từ này khỏi sổ tay?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteWord(notebookId, wordId);
          setWords(prev => prev.filter(w => w.id !== wordId));
          setNotebook(prev => ({
            ...prev,
            word_count_annotated: Math.max(0, (prev.word_count_annotated || 1) - 1)
          }));
        } catch (err) {
          setAlertConfig({
            isOpen: true,
            title: 'Lỗi',
            message: 'Lỗi khi xóa từ vựng',
            type: 'error'
          });
        }
      }
    });
  }

  async function handleUpdateNotebook(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await updateNotebook(notebookId, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setNotebook(prev => ({ ...prev, ...updated }));
      setShowSettingsModal(false);
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Lỗi',
        message: 'Lỗi khi cập nhật sổ tay',
        type: 'error'
      });
    }
  }

  function handleDeleteNotebook() {
    setShowSettingsModal(false);
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa sổ tay',
      message: 'Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa sổ tay này cùng với toàn bộ từ vựng bên trong?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteNotebook(notebookId);
          router.push(`/${language}/notes`);
        } catch (err) {
          setAlertConfig({
            isOpen: true,
            title: 'Lỗi',
            message: 'Lỗi khi xóa sổ tay',
            type: 'error'
          });
        }
      }
    });
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface animate-in fade-in duration-200">
      {/* Header */}
      <div className="px-8 py-6 border-b border-outline flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <Link href={`/${language}/notes`} className="mr-4 p-2 hover:bg-hover-bg rounded-full text-secondary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">{notebook.name}</h1>
            <p className="text-sm text-secondary">{notebook.description || 'Chưa có mô tả'} • {notebook.word_count_annotated || 0} từ vựng</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 text-secondary border border-outline rounded-xl hover:bg-hover-bg transition-colors flex items-center justify-center"
            title="Cài đặt sổ tay"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-colors flex items-center shadow-sm"
          >
            <span className="material-symbols-outlined mr-2">add</span>
            Thêm từ mới
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full p-8 pb-16">
        <div className="max-w-[1000px] mx-auto">
          {/* Toolbar */}
          <div className="mb-6 flex">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
              <input 
                type="text" 
                placeholder="Tìm từ vựng, pinyin hoặc nghĩa..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-outline rounded-xl focus:outline-none focus:border-primary transition-colors shadow-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {words.length === 0 ? (
            <div className="text-center py-20 text-secondary bg-white border border-outline rounded-2xl">
              <span className="material-symbols-outlined text-5xl mb-4 opacity-50">search_off</span>
              <p>{searchQuery ? "Không tìm thấy từ vựng nào phù hợp." : "Sổ tay trống. Hãy thêm từ vựng mới để bắt đầu học."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {words.map(word => (
                <div key={word.id} className="bg-white border border-outline rounded-2xl p-5 hover:border-primary/50 transition-colors group relative">
                  <button 
                    onClick={() => handleDeleteWord(word.id)}
                    className="absolute top-4 right-4 text-secondary hover:text-red-500 opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa từ"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0 font-noto-sc">
                      {word.vocabulary.charAt(0)}
                    </div>
                    <div>
                      <div className="font-noto-sc text-2xl font-bold text-primary mb-1">{word.vocabulary}</div>
                      <div className="text-sm font-medium text-[#10b981] mb-2">{word.pinyin}</div>
                      <div className="text-base text-gray-800 font-medium">{word.meaning}</div>
                      {word.note && (
                        <div className="mt-3 text-sm text-secondary bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          {word.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Word Modal */}
      {showAddModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <h2 className="text-2xl font-bold text-primary mb-4 shrink-0">Thêm từ vựng mới</h2>
            <form onSubmit={handleAddWord} className="flex-1 overflow-y-auto pr-1 space-y-4">
              
              {/* Dictionary Lookup Bar */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <label className="block text-sm font-bold text-primary mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">find_in_page</span>
                  Tra nhanh từ điển (Auto-fill)
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={lookupQuery}
                    onChange={e => setLookupQuery(e.target.value)}
                    className="w-full border border-outline rounded-xl pl-4 pr-10 py-2.5 bg-white focus:outline-none focus:border-primary transition-colors text-sm"
                    placeholder="Gõ Chữ Hán, Pinyin hoặc nghĩa..."
                  />
                  {isLookupLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined animate-spin text-primary text-[20px]">
                      progress_activity
                    </span>
                  )}
                </div>

                {/* Suggestions List */}
                {lookupSuggestions.length > 0 && (
                  <div className="mt-2 bg-white border border-outline rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-outline/50 z-20 relative">
                    {lookupSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setNewVocab(item.word);
                          setNewPinyin(item.pinyin);
                          setNewMeaning(item.translation_vi);
                          setLookupQuery('');
                          setLookupSuggestions([]);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-hover-bg transition-colors flex justify-between items-center text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-primary text-base leading-tight">{item.word}</span>
                          <span className="text-secondary text-xs font-mono mt-0.5">[{item.pinyin}]</span>
                        </div>
                        <span className="text-secondary text-xs truncate max-w-[200px] text-right font-medium">
                          {item.translation_vi}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {lookupQuery.trim() && !isLookupLoading && lookupSuggestions.length === 0 && (
                  <p className="text-xs text-secondary/60 mt-1.5 italic">Không tìm thấy gợi ý nào...</p>
                )}
              </div>

              <hr className="border-outline/50" />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Từ vựng (Tiếng Trung)</label>
                  <input 
                    type="text" 
                    value={newVocab}
                    onChange={e => setNewVocab(e.target.value)}
                    className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors font-noto-sc text-lg font-bold"
                    placeholder="VD: 学习"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Pinyin (Bính âm)</label>
                  <input 
                    type="text" 
                    value={newPinyin}
                    onChange={e => setNewPinyin(e.target.value)}
                    className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm font-medium text-[#10b981]"
                    placeholder="VD: xuéxí"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Nghĩa</label>
                  <input 
                    type="text" 
                    value={newMeaning}
                    onChange={e => setNewMeaning(e.target.value)}
                    className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm font-medium"
                    placeholder="VD: Học tập"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Ghi chú (tùy chọn)</label>
                  <textarea 
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors min-h-[80px] text-sm"
                    placeholder="Ví dụ đặt câu, từ đồng nghĩa..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline/50 shrink-0">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setLookupQuery('');
                    setLookupSuggestions([]);
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium text-secondary hover:bg-hover-bg transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={adding || !newVocab.trim() || !newMeaning.trim()}
                  className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center"
                >
                  {adding ? <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> : null}
                  Lưu từ vựng
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Settings Modal */}
      {showSettingsModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-primary mb-4">Cài đặt sổ tay</h2>
            <form onSubmit={handleUpdateNotebook}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Tên sổ tay</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Mô tả</label>
                  <textarea 
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors min-h-[100px] text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <button
                  type="button"
                  onClick={handleDeleteNotebook}
                  className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Xóa sổ tay
                </button>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 rounded-xl font-medium text-secondary hover:bg-hover-bg transition-colors text-sm"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={!editName.trim()}
                    className="bg-primary text-white px-5 py-2 rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 text-sm"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        isDestructive={true}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
