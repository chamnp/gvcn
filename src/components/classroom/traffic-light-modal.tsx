'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface TrafficLightModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type SignalState = 'RED' | 'YELLOW' | 'GREEN';

const SIGNALS: Record<
  SignalState,
  {
    title: string;
    action: string;
    desc: string;
    color: string;
    glow: string;
    bgGradient: string;
    icon: string;
  }
> = {
  RED: {
    title: 'ĐÈN ĐỎ — DỪNG LẠI & LẮNG NGHE',
    action: 'Im lặng tuyệt đối • Mắt hướng lên bảng',
    desc: 'Cả lớp dừng mọi hoạt động cá nhân, ngồi ngay ngắn và chú ý nghe cô giáo giảng bài.',
    color: 'bg-rose-500',
    glow: 'shadow-[0_0_60px_rgba(239,68,68,0.8)] border-rose-400',
    bgGradient: 'from-rose-950 via-slate-900 to-slate-950',
    icon: '🤫',
  },
  YELLOW: {
    title: 'ĐÈN VÀNG — THÌ THẦM ĐÔI BẠN',
    action: 'Nói nhỏ đủ nghe • Trao đổi 2 bạn cùng bàn',
    desc: 'Thảo luận cặp đôi (Think-Pair-Share), hỏi ý kiến bạn bên cạnh với âm lượng vừa đủ nghe.',
    color: 'bg-amber-400',
    glow: 'shadow-[0_0_60px_rgba(245,158,11,0.8)] border-amber-300',
    bgGradient: 'from-amber-950 via-slate-900 to-slate-950',
    icon: '💬',
  },
  GREEN: {
    title: 'ĐÈN XANH — TỰ DO THẢO LUẬN NHÓM',
    action: 'Hoạt động sôi nổi • Hợp tác cùng tiến bộ',
    desc: 'Các nhóm tự do trao đổi, phát biểu, di chuyển dán sản phẩm học tập và hỗ trợ nhau.',
    color: 'bg-emerald-500',
    glow: 'shadow-[0_0_60px_rgba(16,185,129,0.8)] border-emerald-400',
    bgGradient: 'from-emerald-950 via-slate-900 to-slate-950',
    icon: '🚀',
  },
};

export function TrafficLightModal({
  isOpen,
  onClose,
  className = '4A1',
}: TrafficLightModalProps) {
  const [activeSignal, setActiveSignal] = useState<SignalState>('GREEN');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playChime = (freq: number = 659.25) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.55);
    } catch (e) {}
  };

  const setSignalWithSound = (signal: SignalState) => {
    setActiveSignal(signal);
    if (signal === 'RED') playChime(440); // A4
    else if (signal === 'YELLOW') playChime(554.37); // C#5
    else if (signal === 'GREEN') playChime(659.25); // E5
  };

  // Remote Signal Event Listener & Keyboard Shortcuts (1 = Red, 2 = Yellow, 3 = Green)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setSignalWithSound('RED');
      else if (e.key === '2') setSignalWithSound('YELLOW');
      else if (e.key === '3') setSignalWithSound('GREEN');
    };

    const handleRemoteSignal = (e: CustomEvent) => {
      const signal = e.detail;
      if (signal === 'RED' || signal === 'YELLOW' || signal === 'GREEN') {
        setSignalWithSound(signal);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('remote-traffic-light' as any, handleRemoteSignal as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('remote-traffic-light' as any, handleRemoteSignal as EventListener);
    };
  }, [isOpen, soundEnabled]);

  if (!isOpen) return null;

  const current = SIGNALS[activeSignal];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`text-white max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[94vh] bg-gradient-to-b ${current.bgGradient} transition-colors duration-500`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/40 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🚦
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg tracking-tight">
                Đèn Giao Thông Báo Hiệu Trạng Thái Lớp Học
              </h3>
              <p className="text-xs text-slate-300">
                Lớp {className} • Nhấn phím 1, 2, 3 trên bàn phím để chuyển đèn nhanh
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center space-y-6">
          {/* Traffic Light Hardware Box */}
          <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border-4 border-slate-800 shadow-2xl flex flex-row items-center gap-4 sm:gap-6">
            {/* RED LIGHT */}
            <button
              type="button"
              onClick={() => setSignalWithSound('RED')}
              className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all transform cursor-pointer border-4 ${
                activeSignal === 'RED'
                  ? `${SIGNALS.RED.color} ${SIGNALS.RED.glow} scale-105 border-white`
                  : 'bg-rose-950/40 border-rose-900/50 opacity-40 hover:opacity-75'
              }`}
            >
              <span className="text-2xl sm:text-3xl">🤫</span>
              <span className="text-[10px] font-black uppercase mt-1">Đỏ [1]</span>
            </button>

            {/* YELLOW LIGHT */}
            <button
              type="button"
              onClick={() => setSignalWithSound('YELLOW')}
              className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all transform cursor-pointer border-4 ${
                activeSignal === 'YELLOW'
                  ? `${SIGNALS.YELLOW.color} text-slate-950 ${SIGNALS.YELLOW.glow} scale-105 border-white`
                  : 'bg-amber-950/40 border-amber-900/50 opacity-40 hover:opacity-75'
              }`}
            >
              <span className="text-2xl sm:text-3xl">💬</span>
              <span className="text-[10px] font-black uppercase mt-1">Vàng [2]</span>
            </button>

            {/* GREEN LIGHT */}
            <button
              type="button"
              onClick={() => setSignalWithSound('GREEN')}
              className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all transform cursor-pointer border-4 ${
                activeSignal === 'GREEN'
                  ? `${SIGNALS.GREEN.color} ${SIGNALS.GREEN.glow} scale-105 border-white`
                  : 'bg-emerald-950/40 border-emerald-900/50 opacity-40 hover:opacity-75'
              }`}
            >
              <span className="text-2xl sm:text-3xl">🚀</span>
              <span className="text-[10px] font-black uppercase mt-1">Xanh [3]</span>
            </button>
          </div>

          {/* Current Status Banner (Huge text for TV projection) */}
          <div className="text-center space-y-2 max-w-xl animate-in zoom-in-95">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-white/20">
              <span className="text-lg">{current.icon}</span>
              <span>Trạng Thái Hiện Tại</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">
              {current.title}
            </h2>

            <p className="text-base sm:text-lg text-amber-300 font-bold drop-shadow-xs">
              👉 {current.action}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed pt-1">
              {current.desc}
            </p>
          </div>

          {/* Quick Click Switcher for Teacher */}
          <div className="w-full max-w-lg grid grid-cols-3 gap-2.5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setSignalWithSound('RED')}
              className={`p-3 rounded-2xl border font-black text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeSignal === 'RED'
                  ? 'bg-rose-600 border-white text-white shadow-lg'
                  : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">🔴</span>
              <span>Đèn Đỏ (Phím 1)</span>
            </button>

            <button
              type="button"
              onClick={() => setSignalWithSound('YELLOW')}
              className={`p-3 rounded-2xl border font-black text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeSignal === 'YELLOW'
                  ? 'bg-amber-500 border-white text-slate-950 shadow-lg'
                  : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">🟡</span>
              <span>Đèn Vàng (Phím 2)</span>
            </button>

            <button
              type="button"
              onClick={() => setSignalWithSound('GREEN')}
              className={`p-3 rounded-2xl border font-black text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeSignal === 'GREEN'
                  ? 'bg-emerald-600 border-white text-white shadow-lg'
                  : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">🟢</span>
              <span>Đèn Xanh (Phím 3)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
