'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Check, X, Volume2, Sparkles } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  placeholderPrompt?: string;
}

export function VoiceInputButton({
  onResult,
  size = 'md',
  className = '',
  title = 'Nhập bằng giọng nói (Voice-to-Text)',
  placeholderPrompt = 'Hãy nói lời nhận xét của bạn...',
}: VoiceInputButtonProps) {
  const { isListening, liveTranscript, isSupported, startListening, stopListening } = useVoiceInput();

  if (!isSupported) {
    return null; // Gracefully hidden if browser does not support Web Speech API
  }

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'px-3 py-2 text-sm font-bold',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  };

  const handleStart = () => {
    startListening((text) => {
      if (text) onResult(text);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isListening) {
            stopListening();
          } else {
            handleStart();
          }
        }}
        title={isListening ? 'Đang nghe... Bấm để dừng ghi âm' : title}
        className={`inline-flex items-center justify-center space-x-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
          isListening
            ? 'bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse shadow-md shadow-rose-500/30'
            : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300'
        } ${sizeClasses[size]} ${className}`}
      >
        {isListening ? (
          <>
            <MicOff className={`${iconSizes[size]} animate-bounce`} />
            {size === 'lg' && <span>Đang nghe...</span>}
          </>
        ) : (
          <>
            <Mic className={iconSizes[size]} />
            {size === 'lg' && <span>Đọc nhận xét</span>}
          </>
        )}
      </button>

      {/* LIVE VOICE RECORDING FLOATING MODAL OVERLAY */}
      {isListening && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 text-center space-y-5">
            {/* Animated Mic & Waves */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-rose-500/30 animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-rose-500/40">
                <Mic className="w-7 h-7 animate-bounce" />
              </div>
            </div>

            {/* Status Title */}
            <div className="space-y-1">
              <span className="inline-block bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                🔴 Đang Ghi Âm Trực Tiếp
              </span>
              <h3 className="text-base font-black text-slate-900">
                Hãy Nói Lời Nhận Xét Của Bạn
              </h3>
              <p className="text-xs text-slate-500">
                Hệ thống đang chuyển đổi giọng nói tiếng Việt thành văn bản theo thời gian thực...
              </p>
            </div>

            {/* Live Transcript Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[90px] max-h-[160px] overflow-y-auto text-left text-xs text-slate-800 font-medium leading-relaxed">
              {liveTranscript ? (
                <p className="text-slate-900 font-bold">{liveTranscript}</p>
              ) : (
                <p className="text-slate-400 italic flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 animate-pulse text-slate-400" />
                  <span>{placeholderPrompt}</span>
                </p>
              )}
            </div>

            {/* Control Actions */}
            <div className="flex items-center justify-center space-x-3 pt-1">
              <button
                type="button"
                onClick={stopListening}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Hoàn Thành & Lưu Nhận Xét</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  // Abort without saving
                  stopListening();
                }}
                className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Đóng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
