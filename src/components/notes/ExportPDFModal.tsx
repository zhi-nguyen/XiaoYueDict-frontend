'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { djangoClient } from '@/lib/apiClient';

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: number;
  notebookName: string;
  totalWords: number;
  selectedWordIds: number[];
  onSelectAllWords?: () => void;
}

export default function ExportPDFModal({
  isOpen,
  onClose,
  notebookId,
  notebookName,
  totalWords,
  selectedWordIds,
}: ExportPDFModalProps) {
  const [gridColor, setGridColor] = useState('#D32F2F'); // Default: Red
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showCover, setShowCover] = useState(true);
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  
  // Advanced customization state
  const [extraRows, setExtraRows] = useState(0);
  const [emptyPages, setEmptyPages] = useState(0);
  const [emptyPageGridSize, setEmptyPageGridSize] = useState<'auto' | '2.0' | '1.0'>('auto');

  const [exporting, setExporting] = useState(false);
  const [loadingText, setLoadingText] = useState('Đang kết nối máy chủ...');
  const [error, setError] = useState<string | null>(null);

  // Set export scope to 'selected' if user has already selected some words
  useEffect(() => {
    if (selectedWordIds.length > 0) {
      setExportScope('selected');
    } else {
      setExportScope('all');
    }
  }, [selectedWordIds, isOpen]);

  // Loading text rotation during export
  useEffect(() => {
    if (!exporting) return;
    
    const texts = [
      'Đang chuẩn bị dữ liệu sổ tay...',
      'Đang kết nối microservice xuất bản...',
      'Đang vẽ lưới chữ Điền (Tianzige)...',
      'Đang dàn trang và căn lề phiên âm...',
      'Đang nén file và tối ưu luồng truyền tải...',
      'Đang chuẩn bị tải xuống file PDF...'
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setLoadingText(texts[index]);
    }, 3000);

    return () => clearInterval(interval);
  }, [exporting]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setLoadingText('Đang kết nối máy chủ...');

    try {
      const params: any = {
        grid_color: gridColor,
        show_pinyin: showPinyin,
        show_meaning: showMeaning,
        show_notes: showNotes,
        show_cover: showCover,
        extra_rows: extraRows,
        empty_pages: emptyPages,
        empty_page_grid_size: emptyPageGridSize,
      };

      if (exportScope === 'selected') {
        if (selectedWordIds.length === 0) {
          setError('Vui lòng chọn ít nhất một từ vựng để xuất.');
          setExporting(false);
          return;
        }
        params.word_ids = selectedWordIds.join(',');
      }

      // Zero-Copy response flow via Blob
      const res = await djangoClient.get(`/notes/notebooks/${notebookId}/export-pdf/`, {
        params,
        responseType: 'blob',
        timeout: 90000 // 90 seconds timeout for large notebooks
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      // Clean notebook name for filename
      const safeName = notebookName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.setAttribute('download', `so-tay-tap-viet-${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi xuất PDF:', err);
      setError('Không thể xuất file PDF. Vui lòng kiểm tra lại dịch vụ hoặc thử lại sau.');
    } finally {
      setExporting(false);
    }
  };

  const colorsList = [
    { value: '#D32F2F', label: 'Đỏ truyền thống', bg: 'bg-[#D32F2F]' },
    { value: '#2E7D32', label: 'Xanh lá đậm', bg: 'bg-[#2E7D32]' },
    { value: '#1565C0', label: 'Xanh dương nhã nhặn', bg: 'bg-[#1565C0]' },
    { value: '#555555', label: 'Xám trung tính', bg: 'bg-[#555555]' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
        
        {/* Loading Overlay */}
        {exporting && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-50 p-6 text-center animate-in fade-in">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-bold text-primary mb-2">Đang tạo vở tập viết PDF</h3>
            <p className="text-sm text-secondary animate-pulse">{loadingText}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-5 border-b border-outline/50 pb-3 shrink-0">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">picture_as_pdf</span>
            Xuất PDF Vở Tập Viết
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-100 flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-1">
          {/* Scope selection */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-primary">Phạm vi xuất bản</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                  exportScope === 'all'
                    ? 'border-primary bg-primary/5 text-primary font-bold'
                    : 'border-outline hover:bg-hover-bg text-secondary'
                }`}
              >
                <span>Tất cả từ vựng</span>
                <span className="text-xs opacity-70">({totalWords} từ)</span>
              </button>
              <button
                type="button"
                onClick={() => setExportScope('selected')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                  exportScope === 'selected'
                    ? 'border-primary bg-primary/5 text-primary font-bold'
                    : 'border-outline hover:bg-hover-bg text-secondary'
                }`}
              >
                <span>Từ đã chọn</span>
                <span className="text-xs opacity-70">({selectedWordIds.length} từ)</span>
              </button>
            </div>
            {exportScope === 'selected' && selectedWordIds.length === 0 && (
              <p className="text-[11px] text-orange-600 font-medium italic mt-1.5 bg-orange-50 p-2 rounded-lg border border-orange-100">
                💡 Mẹo: Đóng Modal này lại, tích chọn các ô vuông bên cạnh từ vựng ở danh sách ngoài, sau đó bấm Xuất PDF.
              </p>
            )}
          </div>

          {/* Grid Color selection */}
          <div className="space-y-2.5">
            <label className="block text-sm font-bold text-primary">Màu đường lưới ô chữ Điền</label>
            <div className="flex flex-col gap-2">
              {colorsList.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setGridColor(c.value)}
                  className={`flex items-center gap-3 w-full p-2.5 rounded-xl border text-sm transition-colors ${
                    gridColor === c.value
                      ? 'border-primary bg-primary/5 font-bold text-primary'
                      : 'border-outline hover:bg-hover-bg text-secondary'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${c.bg} shrink-0 border border-black/10`} />
                  <span>{c.label}</span>
                  {gridColor === c.value && (
                    <span className="material-symbols-outlined text-primary ml-auto text-lg">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Options switch */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-bold text-primary">Tùy chọn hiển thị nội dung</label>
            
            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl cursor-pointer hover:bg-hover-bg transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">In trang bìa sổ tay</span>
                  <span className="text-xs text-secondary">Thêm trang mở đầu thiết kế trang nhã</span>
                </div>
                <input
                  type="checkbox"
                  checked={showCover}
                  onChange={(e) => setShowCover(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl cursor-pointer hover:bg-hover-bg transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">Hiển thị bính âm (Pinyin)</span>
                  <span className="text-xs text-secondary">In chữ Pinyin màu xanh lá cây trên đầu ô đồ</span>
                </div>
                <input
                  type="checkbox"
                  checked={showPinyin}
                  onChange={(e) => setShowPinyin(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl cursor-pointer hover:bg-hover-bg transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">Hiển thị ngữ nghĩa tiếng Việt</span>
                  <span className="text-xs text-secondary">In nghĩa từ vựng cạnh tiêu đề chữ</span>
                </div>
                <input
                  type="checkbox"
                  checked={showMeaning}
                  onChange={(e) => setShowMeaning(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl cursor-pointer hover:bg-hover-bg transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">Hiển thị ghi chú cá nhân</span>
                  <span className="text-xs text-secondary">In kèm ghi chú/ví dụ của bạn dưới dòng viết</span>
                </div>
                <input
                  type="checkbox"
                  checked={showNotes}
                  onChange={(e) => setShowNotes(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>
            </div>
          </div>

          {/* Advanced layout options */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-bold text-primary">Cấu hình lưới ô li nâng cao</label>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  Số hàng ô li trống thêm dưới từng từ (0 - 5 hàng)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={extraRows}
                  onChange={(e) => setExtraRows(Math.max(0, Math.min(5, parseInt(e.target.value) || 0)))}
                  className="w-full border border-outline rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  Số trang ô li trống thêm ở cuối (0 - 10 trang)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={emptyPages}
                  onChange={(e) => setEmptyPages(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                  className="w-full border border-outline rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-surface"
                />
              </div>

              {emptyPages > 0 && (
                <div className="animate-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    Kích thước ô của trang trống thêm
                  </label>
                  <select
                    value={emptyPageGridSize}
                    onChange={(e) => setEmptyPageGridSize(e.target.value as any)}
                    className="w-full border border-outline rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-surface cursor-pointer"
                  >
                    <option value="auto">Tự động (Theo kích thước từ mẫu)</option>
                    <option value="2.0">Ô to 2.0 x 2.0 cm (Luyện từ ngắn)</option>
                    <option value="1.0">Ô nhỏ 1.0 x 1.0 cm (Luyện câu dài)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-outline/50 mt-5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-outline rounded-xl font-medium text-secondary hover:bg-hover-bg transition-colors text-sm"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportScope === 'selected' && selectedWordIds.length === 0}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-40 text-sm shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Tải File PDF
          </button>
        </div>

      </div>
    </div>
  );
}
