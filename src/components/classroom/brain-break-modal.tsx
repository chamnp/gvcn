'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Award,
  Smile,
  Shuffle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface BrainBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface Activity {
  id: number;
  title: string;
  badge: string;
  action: string;
  durationSeconds: number;
  bgGradient: string;
  borderColor: string;
}

const ACTIVITIES: Activity[] = [
  {
    id: 1,
    title: 'Hít Sâu & Vươn Tay Hái Sao',
    badge: '🧘',
    action: 'Đứng thẳng, hít sâu bằng mũi và vươn hai tay lên cao hái sao, sau đó thở từ từ ra bằng miệng (lặp lại 5 lần).',
    durationSeconds: 60,
    bgGradient: 'from-blue-600 via-indigo-600 to-purple-600',
    borderColor: 'border-blue-400',
  },
  {
    id: 2,
    title: 'Vỗ Tay Theo Nhịp Điệu',
    badge: '👏',
    action: 'Cả lớp cùng vỗ tay theo nhịp: 1-2, 1-2-3! Cô bắt nhịp nhanh dần đều để rèn luyện sự nhanh nhạy!',
    durationSeconds: 60,
    bgGradient: 'from-amber-500 via-orange-600 to-rose-600',
    borderColor: 'border-amber-400',
  },
  {
    id: 3,
    title: 'Massage Lưng & Vai Cho Bạn',
    badge: '💆',
    action: 'Quay sang bên phải, dùng hai tay xoa bóp vai và đấm lưng nhẹ nhàng cho bạn trong 30 giây, sau đó đổi chiều!',
    durationSeconds: 90,
    bgGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    borderColor: 'border-emerald-400',
  },
  {
    id: 4,
    title: 'Trò Chơi Chim Bay Cò Bay',
    badge: '🐦',
    action: 'Vật gì bay được thì giơ tay vẫy cánh và hô to "Bay!". Vật không bay được mà giơ tay sẽ bị phạt cười 1 tràng thật to!',
    durationSeconds: 90,
    bgGradient: 'from-purple-600 via-pink-600 to-rose-600',
    borderColor: 'border-purple-400',
  },
  {
    id: 5,
    title: 'Vũ Điệu Lắc Lư Xoay Khớp',
    badge: '🤸',
    action: 'Xoay cổ tay, xoay bả vai và nhún nhảy tại chỗ theo nhịp đếm 1 2 3 4 để xua tan mệt mỏi!',
    durationSeconds: 60,
    bgGradient: 'from-cyan-600 via-blue-600 to-indigo-600',
    borderColor: 'border-cyan-400',
  },
];

export function BrainBreakModal({
  isOpen,
  onClose,
  className = '4A1',
}: BrainBreakModalProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity>(ACTIVITIES[0]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      handleSelectActivity(ACTIVITIES[0]);
    } else {
      setIsRunning(false);
      setIsFinished(false);
    }
  }, [isOpen]);

  const handleSelectActivity = (act: Activity) => {
    setSelectedActivity(act);
    setSecondsRemaining(act.durationSeconds);
    setIsRunning(false);
    setIsFinished(false);
  };

  const handleRandomActivity = () => {
    const nextIdx = Math.floor(Math.random() * ACTIVITIES.length);
    handleSelectActivity(ACTIVITIES[nextIdx]);
    toast.info('Đã chọn ngẫu nhiên bài tập vận động mới!');
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [392.0, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.45);
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
          playChime();
          confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } });
          toast.success('HẾT GIỜ NẠP NĂNG LƯỢNG! Cả lớp sẵn sàng học tiếp 100% ⚡');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, soundEnabled]);

  if (!isOpen) return null;

  const total = selectedActivity.durationSeconds;
  const progressPercent = Math.min(100, Math.round(((total - secondsRemaining) / total) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`text-white max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[94vh] bg-gradient-to-b ${selectedActivity.bgGradient} transition-all duration-500`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/40 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🧘
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg tracking-tight">
                Góc Thể Dục & Nạp Năng Lượng 2 Phút
              </h3>
              <p className="text-xs text-slate-200">
                Lớp {className} • Hoạt động giải tỏa mệt mỏi giữa tiết học
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRandomActivity}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Đổi bài ngẫu nhiên"
            >
              <Shuffle className="w-4 h-4" />
              <span>Đổi bài</span>
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center space-y-6">
          {/* Main Challenge Card */}
          <div className="text-center space-y-3 max-w-xl animate-in zoom-in-95">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl mx-auto shadow-2xl border border-white/30 animate-bounce">
              {selectedActivity.badge}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">
              {selectedActivity.title}
            </h2>

            <p className="text-sm sm:text-base text-amber-200 font-bold bg-slate-950/40 p-4 rounded-2xl border border-white/10 leading-relaxed max-w-lg mx-auto">
              👉 {selectedActivity.action}
            </p>
          </div>

          {/* Countdown Clock Big */}
          <div className="text-center space-y-2">
            <div className="font-mono font-black text-5xl sm:text-6xl text-amber-300 drop-shadow-lg">
              {secondsRemaining}s
            </div>

            <div className="w-64 sm:w-80 h-3 bg-slate-950/50 rounded-full overflow-hidden p-0.5 border border-white/20 mx-auto">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSecondsRemaining(selectedActivity.durationSeconds);
                setIsRunning(false);
                setIsFinished(false);
              }}
              className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Đặt lại"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (secondsRemaining <= 0) {
                  setSecondsRemaining(selectedActivity.durationSeconds);
                  setIsFinished(false);
                }
                setIsRunning(!isRunning);
              }}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                isRunning
                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                  : 'bg-white hover:bg-slate-100 text-slate-950'
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
                  <span>{secondsRemaining <= 0 ? 'Tập Lại' : 'Bắt Đầu Vận Động ▶'}</span>
                </>
              )}
            </button>
          </div>

          {/* Activity selector thumbnails */}
          <div className="w-full pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {ACTIVITIES.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => handleSelectActivity(act)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedActivity.id === act.id
                      ? 'bg-white text-slate-950 border-white shadow-md font-black'
                      : 'bg-slate-950/30 text-white border-white/20 hover:bg-slate-950/50'
                  }`}
                >
                  <span>{act.badge}</span>
                  <span>{act.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
