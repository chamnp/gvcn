'use client';

import React from 'react';
import { BookOpen, Sparkles, ChevronRight, Volume2 } from 'lucide-react';
import { RemoteModuleProps } from '../types';

export const StandardSlideControls: React.FC<RemoteModuleProps> = ({ tvState, sendAction }) => {
  const notes = tvState.presenterNotes ?? [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 space-y-3.5 shadow-xl animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Gợi Ý Giảng Dạy & Lời Bình (Presenter Notes)
            </span>
            <h4 className="font-bold text-xs text-white">Nội dung chỉ hiển thị trên điện thoại</h4>
          </div>
        </div>

        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {tvState.phase || 'BÀI HỌC'}
        </span>
      </div>

      {/* Notes List */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {notes.length > 0 ? (
          notes.map((note, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start space-x-2"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="flex-1">{note}</p>
            </div>
          ))
        ) : (
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            Giáo viên giảng giải theo nội dung trên màn hình TV
          </div>
        )}
      </div>
    </div>
  );
};
