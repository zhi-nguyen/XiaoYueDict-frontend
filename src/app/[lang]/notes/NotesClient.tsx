'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createNotebook, deleteNotebook } from '@/lib/api/notes';
import { Notebook } from '@/types/note';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';

interface NotesClientProps {
  initialNotebooks: Notebook[];
}

export default function NotesClient({ initialNotebooks }: NotesClientProps) {
  const params = useParams();
  const language = (params?.lang as string) || 'zh';
  const [notebooks, setNotebooks] = useState<Notebook[]>(initialNotebooks);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setCreating(true);
      const newNb = await createNotebook({ name: newName.trim(), description: newDesc.trim() });
      setNotebooks([newNb, ...notebooks]);
      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Lỗi',
        message: 'Lỗi khi tạo sổ tay',
        type: 'error'
      });
    } finally {
      setCreating(false);
    }
  }

  function handleDeleteNotebook(e: React.MouseEvent, id: number, name: string) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa sổ tay',
      message: `Bạn có chắc chắn muốn xóa sổ tay "${name}"? Tất cả từ vựng bên trong sẽ bị xóa.`,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteNotebook(id);
          setNotebooks(prev => prev.filter(nb => nb.id !== id));
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
    <div className="flex-1 overflow-y-auto w-full p-8 pb-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Sổ Tay Của Tôi</h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-colors flex items-center"
          >
            <span className="material-symbols-outlined mr-2">add</span>
            Tạo sổ mới
          </button>
        </div>
        
        {notebooks.length === 0 && (
          <div className="text-center py-20 text-secondary bg-surface border border-outline rounded-2xl">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-50">menu_book</span>
            <p>Bạn chưa có sổ tay nào.</p>
            <button onClick={() => setShowCreateModal(true)} className="text-primary font-bold mt-2 hover:underline">
              Tạo sổ đầu tiên ngay
            </button>
          </div>
        )}

        {notebooks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {notebooks.map(nb => (
              <div key={nb.id} className="relative group">
                <Link href={`/${language}/notes/${nb.id}`} className="bg-surface border border-outline rounded-[1.5rem] p-6 shadow-sm hover:border-outline-variant hover:shadow-md transition-all flex flex-col cursor-pointer h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">menu_book</span>
                  </div>
                  <h3 className="font-bold text-xl mb-1 text-primary line-clamp-1 pr-6">{nb.name}</h3>
                  <p className="text-secondary text-sm mb-4 line-clamp-2 flex-1">
                    {nb.description || "Chưa có mô tả"}
                  </p>
                  <div className="mt-auto flex items-center text-sm font-medium text-primary/80 bg-primary/5 px-3 py-1.5 rounded-lg w-fit">
                    <span className="material-symbols-outlined text-[18px] mr-1">translate</span>
                    {nb.word_count_annotated || 0} từ vựng
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDeleteNotebook(e, nb.id, nb.name)}
                  className="absolute top-4 right-4 p-2 text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-70 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Xóa sổ tay"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && mounted && createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-2xl font-bold text-primary mb-4">Tạo Sổ Tay Mới</h2>
              <form onSubmit={handleCreate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Tên sổ tay</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors font-medium text-sm"
                      placeholder="VD: Từ vựng HSK 4..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Mô tả (tùy chọn)</label>
                    <textarea 
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      className="w-full border border-outline rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors min-h-[100px] text-sm"
                      placeholder="Ghi chú thêm về sổ tay này..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 rounded-xl font-medium text-secondary hover:bg-hover-bg transition-colors text-sm"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating || !newName.trim()}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center text-sm"
                  >
                    {creating ? (
                      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                    ) : null}
                    Tạo mới
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>

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
