'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Sun,
  CloudRain,
  CloudLightning,
  Smile,
  Heart,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Student } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface DailyMoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  students: Student[];
}

interface MoodItem {
  id: string;
  title: string;
  badge: string;
  desc: string;
  color: string;
  bgGradient: string;
  count: number;
}

const INITIAL_MOODS: MoodItem[] = [
  {
    id: 'SUNNY',
    title: 'Nắng Ấm Vui Tươi',
    badge: '☀️',
    desc: 'Hào hứng, vui vẻ, tràn đầy năng lượng học tập',
    color: 'border-amber-400 text-amber-900',
    bgGradient: 'from-amber-400/20 to-orange-400/20',
    count: 22,
  },
  {
    id: 'RAINBOW',
    title: 'Cầu Vồng Rực Rỡ',
    badge: '🌈',
    desc: 'Yêu đời, nhiều ý tưởng mới, sẵn sàng khám phá',
    color: 'border-indigo-400 text-indigo-900',
    bgGradient: 'from-indigo-400/20 to-purple-400/20',
    count: 8,
  },
  {
    id: 'CLOUDY',
    title: 'Mây Trắng Nhẹ Nhàng',
    badge: '☁️',
    desc: 'Bình thường, hơi buồn ngủ một chút',
    color: 'border-slate-300 text-slate-800',
    bgGradient: 'from-slate-200/40 to-slate-300/40',
    count: 3,
  },
  {
    id: 'RAINY',
    title: 'Mưa Rào Buồn Bã',
    badge: '🌧️',
    desc: 'Có chuyện không vui hoặc chưa an tâm',
    color: 'border-blue-400 text-blue-900',
    bgGradient: 'from-blue-400/20 to-cyan-400/20',
    count: 1,
  },
  {
    id: 'STORMY',
    title: 'Giông Bão Mệt Mỏi',
    badge: '⛈️',
    desc: 'Mệt mỏi trong người, lo lắng, cần cô giúp đỡ',
    color: 'border-rose-400 text-rose-900',
    bgGradient: 'from-rose-400/20 to-pink-400/20',
    count: 0,
  },
];

export function DailyMoodModal({
  isOpen,
  onClose,
  className = '4A1',
  students,
}: DailyMoodModalProps) {
  const [moods, setMoods] = useState<MoodItem[]>(INITIAL_MOODS);

  const handleUpdateCount = (id: string, delta: number) => {
    setMoods((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextCount = Math.max(0, m.count + delta);
          return { ...m, count: nextCount };
        }
        return m;
      })
    );
  };

  const handleReset = () => {
    setMoods(INITIAL_MOODS.map((m) => ({ ...m, count: 0 })));
    toast.info('Đã đặt lại bảng điểm danh cảm xúc!');
  };

  if (!isOpen) return null;

  const totalCount = moods.reduce((acc, m) => acc + m.count, 0);
  const positiveCount = (moods.find((m) => m.id === 'SUNNY')?.count || 0) + (moods.find((m) => m.id === 'RAINBOW')?.count || 0);
  const positivePercent = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              ☀️
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg tracking-tight">
                Thời Tiết Cảm Xúc — Điểm Danh Tâm Trạng Đầu Giờ
              </h3>
              <p className="text-xs text-amber-100">
                Lớp {className} • 15 phút đầu giờ hoặc tiết Sinh hoạt lớp
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              title="Đặt lại số lượng"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🌈</span>
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  Chỉ số tích cực hôm nay: <span className="text-emerald-600">{positivePercent}%</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Đã ghi nhận: {totalCount} học sinh tham gia chia sẻ cảm xúc
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Smile className="w-3.5 h-3.5" />
                <span>{positiveCount} Bạn Tươi Vui</span>
              </span>
              <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                <span>{totalCount - positiveCount} Cần Cô Động Viên</span>
              </span>
            </div>
          </div>

          {/* 5 Mood Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {moods.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-3xl border-2 ${m.color} bg-gradient-to-br ${m.bgGradient} flex flex-col justify-between space-y-3 shadow-xs`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{m.badge}</span>
                    <span className="text-2xl font-black text-slate-900">
                      {m.count}
                    </span>
                  </div>

                  <h4 className="font-black text-sm text-slate-900">
                    {m.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                {/* Counter controls for teacher */}
                <div className="pt-2 border-t border-slate-900/10 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Số lượng:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateCount(m.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-slate-700 font-black text-xs flex items-center justify-center border border-slate-300 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCount(m.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white text-slate-900 font-black text-xs flex items-center justify-center border border-slate-300 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Teacher Guidance Note */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-600 leading-relaxed text-xs">
            <h5 className="font-bold text-slate-800 mb-1">💡 Hướng dẫn cô giáo sử dụng:</h5>
            <p>
              1. Đầu giờ học, cô chiếu màn hình này và hỏi từng tổ: *"Hôm nay bạn nào cảm thấy Nắng Ấm / Cầu Vồng giơ tay nào?"*<br />
              2. Cô bấm nút <strong>+ / -</strong> để đếm số lượng giơ tay của các em.<br />
              3. Những em chọn 🌧️ Mưa Rào hoặc ⛈️ Giông Bão, cô dành 30 giây hỏi thăm riêng để em cảm thấy được yêu thương và an tâm vào giờ học.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
