import React from 'react';
import Image from 'next/image';
import { Flag, Loader2, Link } from 'lucide-react';

interface VocabularyImageProps {
  src: string;
  alt: string;
  onReport?: () => void;
  isReporting?: boolean;
  isBridged?: boolean;
}

export const VocabularyImage: React.FC<VocabularyImageProps> = ({ 
  src, 
  alt, 
  onReport, 
  isReporting = false,
  isBridged = false
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-outline bg-hover-bg group w-full max-w-[320px] mx-auto aspect-square shadow-sm">
      {/* Optimized GCS image */}
      <Image 
        src={src} 
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 300px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        priority
      />
      
      {/* Active digital watermark */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 select-none pointer-events-none">
        {isBridged && (
          <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-300 uppercase bg-emerald-950/80 backdrop-blur-[4px] rounded-lg border border-emerald-500/30 flex items-center gap-1">
            <Link className="w-2.5 h-2.5" />
            Liên kết
          </div>
        )}
        <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase bg-black/50 backdrop-blur-[4px] rounded-lg border border-white/10">
          AI Gen
        </div>
      </div>

      {/* Flag/Report invalid image button shown on hover */}
      {onReport && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReport();
          }}
          disabled={isReporting}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-red-600/80 hover:bg-red-600 backdrop-blur-[4px] rounded-xl border border-white/10 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 disabled:pointer-events-none shadow-md"
          title="Báo cáo hình ảnh lỗi hoặc không phù hợp"
        >
          {isReporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Flag className="w-3.5 h-3.5" />
          )}
          <span>Báo ảnh lỗi</span>
        </button>
      )}
    </div>
  );
};
export default VocabularyImage;
