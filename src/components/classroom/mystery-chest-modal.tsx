'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Gift,
  Award,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
} from 'lucide-react';
import { Student } from '@/types';
import { useAppStore } from '@/lib/store';
import { getLocalDateString } from '@/lib/tt27-engine';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface MysteryChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  students: Student[];
}

interface MysteryReward {
  id: number;
  title: string;
  badge: string;
  starPoints: number;
  desc: string;
  color: string;
}

const DEFAULT_REWARDS: MysteryReward[] = [
  {
    id: 1,
    title: '+2 Sao Thi Đua Nề Nếp',
    badge: '⭐',
    starPoints: 2,
    desc: 'Cộng trực tiếp 2 sao vào Sổ thi đua khen thưởng của em!',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 2,
    title: 'Làm Quản Ca 1 Buổi',
    badge: '👑',
    starPoints: 1,
    desc: 'Được vinh dự lên bục giảng bắt nhịp cho cả lớp hát đầu giờ!',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    id: 3,
    title: 'Phiếu Miễn Trực Nhật 1 Buổi',
    badge: '🎟️',
    starPoints: 1,
    desc: 'Được miễn nhiệm vụ quét lớp và kê bàn ghế trong 1 buổi trực nhật.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 4,
    title: 'Được Chọn Bài Hát Giải Lao',
    badge: '🎵',
    starPoints: 1,
    desc: 'Được quyền yêu cầu cô giáo mở bài hát yêu thích trong giờ nghỉ!',
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 5,
    title: '1 Sticker Khen Thưởng Xinh Xắn',
    badge: '🏷️',
    starPoints: 1,
    desc: 'Nhận ngay 1 hình dán khen thưởng ngộ nghĩnh từ cô giáo!',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 6,
    title: 'Tràng Pháo Tay Siêu To Khổng Lồ',
    badge: '👏',
    starPoints: 1,
    desc: 'Cả lớp đứng dậy vỗ tay chúc mừng em thật rộn ràng!',
    color: 'from-amber-400 to-yellow-500',
  },
];

export function MysteryChestModal({
  isOpen,
  onClose,
  className = '4A1',
  students,
}: MysteryChestModalProps) {
  const { addStarLog } = useAppStore();

  const [openedChestIndex, setOpenedChestIndex] = useState<number | null>(null);
  const [activeReward, setActiveReward] = useState<MysteryReward | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSavedToLog, setIsSavedToLog] = useState(false);

  const playFanfare = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.4);
      });
    } catch (e) {}
  };

  const handleOpenChest = (chestIdx: number) => {
    if (openedChestIndex !== null) return;

    // Randomly pick a reward
    const shuffled = [...DEFAULT_REWARDS].sort(() => 0.5 - Math.random());
    const reward = shuffled[0];

    setOpenedChestIndex(chestIdx);
    setActiveReward(reward);
    setIsSavedToLog(false);

    playFanfare();
    confetti({ particleCount: 110, spread: 85, origin: { y: 0.55 } });
  };

  const handleSaveToStarLog = () => {
    if (!selectedStudentId || !activeReward) {
      toast.error('Vui lòng chọn học sinh nhận thưởng!');
      return;
    }

    const st = students.find((s) => s.id === selectedStudentId);
    if (!st) return;

    const today = getLocalDateString();
    addStarLog(
      st.id,
      activeReward.starPoints,
      'Khen thưởng',
      `Mở hộp quà bí mật: ${activeReward.title}`,
      activeReward.desc,
      today
    );

    setIsSavedToLog(true);
    confetti({ particleCount: 60, spread: 60 });
    toast.success(`Đã cộng +${activeReward.starPoints} ⭐ vào Sổ nề nếp cho em ${st.fullName}!`);
  };

  const handleReset = () => {
    setOpenedChestIndex(null);
    setActiveReward(null);
    setIsSavedToLog(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🎁
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg tracking-tight">
                Hộp Quà Bí Mật — Khen Thưởng Đột Xuất
              </h3>
              <p className="text-xs text-amber-100">
                Lớp {className} • Học sinh chọn số hộp quà → Cô click mở trên bục giảng
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Đặt lại hộp quà"
            >
              <RotateCcw className="w-4 h-4" />
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Winner Revealed Section */}
          {activeReward && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 space-y-4 shadow-2xl animate-in zoom-in-95 border-2 border-amber-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner shrink-0">
                    {activeReward.badge}
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-900/80">
                      🎉 PHẦN THƯỞNG BÍ MẬT ĐƯỢC LẬT MỞ:
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black leading-tight text-slate-950">
                      {activeReward.title}
                    </h2>
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {activeReward.desc}
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <span className="text-3xl font-black text-slate-950">
                    +{activeReward.starPoints}
                  </span>
                  <span className="text-sm font-bold ml-1">⭐</span>
                </div>
              </div>

              {/* Student Assignment & Log Sync */}
              <div className="pt-3 border-t border-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="font-bold text-slate-950 shrink-0">Trao cho học sinh:</span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-950/30 bg-white/90 font-black text-slate-950 text-xs focus:ring-2 focus:ring-slate-950 w-full sm:w-60"
                  >
                    <option value="">-- Chọn bạn nhận thưởng --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={isSavedToLog || !selectedStudentId}
                    onClick={handleSaveToStarLog}
                    className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      isSavedToLog
                        ? 'bg-emerald-700 text-white cursor-default'
                        : 'bg-slate-950 text-amber-300 hover:bg-slate-900 active:scale-95'
                    }`}
                  >
                    {isSavedToLog ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã lưu vào Sổ nề nếp!</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>+⭐ Lưu Vào Sổ Nề Nếp</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-white/30 hover:bg-white/40 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Mở hộp khác
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6 Chests Grid */}
          <div className="space-y-2">
            <p className="text-center font-bold text-slate-400 text-xs">
              {openedChestIndex === null
                ? '👉 Nhấp chuột vào 1 trong 6 hộp quà dưới đây để lật mở điều bất ngờ:'
                : 'Đã mở hộp quà số ' + (openedChestIndex + 1)}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const isOpened = openedChestIndex === idx;
                const isLocked = openedChestIndex !== null && !isOpened;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLocked || isOpened}
                    onClick={() => handleOpenChest(idx)}
                    className={`group p-6 rounded-3xl border-2 flex flex-col items-center justify-center space-y-3 transition-all transform cursor-pointer relative overflow-hidden ${
                      isOpened
                        ? 'bg-amber-500/20 border-amber-400 scale-105 shadow-xl shadow-amber-500/20'
                        : isLocked
                        ? 'bg-slate-800/40 border-slate-800 opacity-40 cursor-not-allowed'
                        : 'bg-gradient-to-b from-slate-800 to-slate-850 border-slate-700 hover:border-amber-400 hover:scale-105 shadow-lg active:scale-95'
                    }`}
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center text-4xl shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform">
                      {isOpened ? '🎉' : '🎁'}
                    </div>

                    <div className="text-center">
                      <span className="font-black text-base text-white">
                        Hộp Quà Số {idx + 1}
                      </span>
                      <p className="text-[11px] text-amber-300 font-bold mt-0.5">
                        {isOpened ? 'ĐÃ MỞ' : '✨ Bấm để mở'}
                      </p>
                    </div>

                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/80 text-slate-300 font-mono font-bold text-xs flex items-center justify-center border border-slate-700">
                      #{idx + 1}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
