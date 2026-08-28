'use client';

import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export function VoiceInputButton({
  onResult,
  size = 'md',
  className = '',
  title = 'Nhập bằng giọng nói (Voice-to-Text)',
}: VoiceInputButtonProps) {
  const { isListening, isSupported, startListening, stopListening } = useVoiceInput();

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

  return (
    <button
      type="button"
      onClick={() => {
        if (isListening) {
          stopListening();
        } else {
          startListening((text) => onResult(text));
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
  );
}
