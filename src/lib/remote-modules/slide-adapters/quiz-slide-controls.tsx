'use client';

import React from 'react';
import { Eye, EyeOff, CheckCircle2, Award, Sparkles, HelpCircle } from 'lucide-react';
import { RemoteModuleProps } from '../types';

export const QuizSlideControls: React.FC<RemoteModuleProps> = ({ tvState, sendAction }) => {
  const isRevealed = tvState.isAnswerRevealed ?? false;
  const options = tvState.quizOptions ?? ['A. Lựa chọn 1', 'B. Lựa chọn 2', 'C. Lựa chọn 3', 'D. Lựa chọn 4'];
  const correctIdx = tvState.correctAnswerIndex ?? 0;

  return (
    <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-indigo-500/60 rounded-3xl p-4.5 space-y-4 shadow-xl animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
              Chế Độ Slide Câu Hỏi Trắc Nghiệm
            </span>
            <h4 className="font-bold text-xs text-white line-clamp-1">
              {tvState.quizQuestion || 'Câu hỏi tương tác trên TV'}
            </h4>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            isRevealed
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
          }`}
        >
          {isRevealed ? 'Đã hiện đáp án' : 'Đang ẩn đáp án'}
        </span>
      </div>

      {/* 4 Interactive Options (Shows correct answer highlight for teacher) */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
          Đáp Án Trắc Nghiệm (Chỉ cô giáo thấy đáp án đúng)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((opt, idx) => {
            const isCorrect = idx === correctIdx;
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  isCorrect
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}
              >
                <span className="truncate pr-2">{opt}</span>
                {isCorrect && (
                  <span className="shrink-0 flex items-center space-x-1 text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ĐÚNG</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Toggle Reveal Answer Button */}
      <button
        onClick={() => sendAction('REVEAL_ANSWER')}
        className={`w-full py-4 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center space-x-2 active:scale-95 cursor-pointer transition-all ${
          isRevealed
            ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 border border-emerald-300/40'
        }`}
      >
        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <span>{isRevealed ? '🔄 BẤM ĐỂ HIỆN LẠI PHÁO HOA' : '👁️ BẬT ĐÁP ÁN & NỔ PHÁO HOA TRÊN TV'}</span>
      </button>

      {/* Explanation Note for Teacher */}
      {tvState.explanation && (
        <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-800/40 space-y-1 text-xs">
          <div className="flex items-center space-x-1.5 text-indigo-300 font-bold text-[11px]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>GỢI Ý GIẢI THÍCH SƯ PHẠM</span>
          </div>
          <p className="text-indigo-100/90 text-[11px] leading-relaxed">{tvState.explanation}</p>
        </div>
      )}
    </div>
  );
};
