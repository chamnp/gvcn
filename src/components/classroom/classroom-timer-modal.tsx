"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface ClassroomTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const PRESETS = [
  { label: '1 Phút', minutes: 1, desc: 'Suy nghĩ cá nhân' },
  { label: '2 Phút', minutes: 2, desc: 'Trao đổi cặp đôi' },
  { label: '5 Phút', minutes: 5, desc: 'Thảo luận nhóm' },
  { label: '10 Phút', minutes: 10, desc: 'Luyện tập thực hành' },
  { label: '15 Phút', minutes: 15, desc: 'Bài kiểm tra nhanh' },
  { label: '20 Phút', minutes: 20, desc: 'Hoạt động trải nghiệm' },
];

export function ClassroomTimerModal({ isOpen, onClose, className = '4A1' }: ClassroomTimerModalProps) {
  const [totalSeconds, setTotalSeconds] = useState(300);
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      setIsFinished(false);
    }
  }, [isOpen]);

  const playBuzzer = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const frequencies = [587.33, 739.99, 880.00, 1174.66];
      frequencies.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.15 + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.15);
        osc.stop(audioCtx.currentTime + idx * 0.15 + 0.6);
      });
    } catch (e) {}
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setIsFinished(true);
          playBuzzer();
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          toast.success('HẾT GIỜ THẢO LUẬN! Cả lớp chú ý lên bảng 🔔');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, soundEnabled]);

  if (!isOpen) return null;

  const handleSelectPreset = (mins: number) => {
    const secs = mins * 60;
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setIsRunning(false);
    setIsFinished(false);
  };

  const handleAddMinute = (mins: number = 1) => {
    setSecondsRemaining((prev) => prev + mins * 60);
    setTotalSeconds((prev) => Math.max(prev, secondsRemaining + mins * 60));
    setIsFinished(false);
  };

  const handleReset = () => {
    setSecondsRemaining(totalSeconds);
    setIsRunning(false);
    setIsFinished(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 100;
  const strokeDashoffset = 565 - (565 * (100 - progressPercent)) / 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-slate-900 text-white max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              ⏱️
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight">
                Đồng Hồ Đếm Ngược Hoạt Động Lớp Học
              </h3>
              <p className="text-xs text-emerald-100">
                Lớp {className} • Trực quan trên máy chiếu / TV
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer hidden sm:block"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-6 flex-1 overflow-y-auto">
          <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                className="text-slate-800"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                className={isFinished ? 'text-rose-500' : secondsRemaining < 30 ? 'text-amber-500' : 'text-emerald-500'}
                strokeWidth="10"
                strokeDasharray="565"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
              <span
                className={`font-mono font-black tracking-tight text-5xl sm:text-6xl ${
                  isFinished
                    ? 'text-rose-400 animate-bounce'
                    : secondsRemaining < 30
                    ? 'text-amber-400 animate-pulse'
                    : 'text-white'
                }`}
              >
                {minutes < 10 ? '0' : ''}{minutes}:{seconds < 10 ? '0' : ''}{seconds}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isFinished ? 'ĐÃ HẾT GIỜ!' : isRunning ? 'ĐANG ĐẾM NGƯỢC' : 'TẠM DỪNG'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[1, 2, 5].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleAddMinute(mins)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+{mins} Phút</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
              title="Đặt lại"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (secondsRemaining <= 0) handleReset();
                setIsRunning(!isRunning);
              }}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Tạm Dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{secondsRemaining <= 0 ? 'Làm Lại' : 'Bắt Đầu'}</span>
                </>
              )}
            </button>
          </div>

          <div className="w-full pt-4 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase text-center mb-2.5">
              Chọn nhanh khung thời gian hoạt động:
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => handleSelectPreset(p.minutes)}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    totalSeconds === p.minutes * 60
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-black'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
