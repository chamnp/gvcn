'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Tv,
  HelpCircle,
  Sparkles,
  Presentation,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { transformToEmbedUrl, ExternalResourceType } from '@/lib/lesson-package-engine';

interface ExternalPresentationViewerProps {
  url: string;
  title?: string;
  className?: string;
}

const TYPE_BADGES: Record<ExternalResourceType, { label: string; color: string; icon: string }> = {
  GOOGLE_SLIDES: { label: 'Google Slides', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: '📊' },
  GOOGLE_DOCS: { label: 'Google Docs', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: '📄' },
  POWERPOINT: { label: 'PowerPoint Online', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40', icon: '📽️' },
  WORD: { label: 'Word Online', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40', icon: '📝' },
  CANVA: { label: 'Canva Presentation', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40', icon: '🎨' },
  PDF: { label: 'Tài Liệu PDF', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: '📕' },
  GENERIC_IFRAME: { label: 'Học Liệu Nhúng Web', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: '🌐' },
};

export const ExternalPresentationViewer: React.FC<ExternalPresentationViewerProps> = ({
  url,
  title,
  className = '',
}) => {
  const resource = transformToEmbedUrl(url);
  const badge = TYPE_BADGES[resource.type];
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  return (
    <div
      className={`w-full flex flex-col bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl ${className}`}
    >
      {/* Top Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5 truncate pr-2">
          <span className="text-base shrink-0">{badge.icon}</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${badge.color}`}
          >
            {badge.label}
          </span>
          <span className="text-xs font-bold text-slate-200 truncate">
            {title || resource.title}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="hidden sm:inline text-[10px] font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            ✨ Bút Laser & Loa TV sẵn sàng
          </span>

          <a
            href={resource.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title="Mở tab mới trực tiếp"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px]">Mở tab mới</span>
          </a>
        </div>
      </div>

      {/* Main Embed Frame (16:9 aspect ratio standard for Classroom TVs) */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {!hasLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 space-y-3 z-0">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400">Đang tải slide bài giảng từ {badge.label}...</p>
          </div>
        )}

        <iframe
          src={resource.embedUrl}
          title={title || resource.title}
          onLoad={() => setHasLoaded(true)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 relative z-10"
        />
      </div>

      {/* Footer Helper Note for Teachers */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="line-clamp-1">
            Mẹo: Để học sinh nhìn thấy slide Google/OneDrive, hãy đảm bảo link được bật <strong>&quot;Người xem công khai&quot;</strong>.
          </span>
        </div>
        <span className="text-[10px] text-slate-500 hidden sm:inline">GVCN Pro Multi-Stage</span>
      </div>
    </div>
  );
};
