'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  Tv,
} from 'lucide-react';

interface FloatingSmartDockProps {
  onOpenWheel: () => void;
  onOpenTimer: () => void;
  onOpenNoise: () => void;
  onOpenTraffic: () => void;
  onOpenSoundboard: () => void;
  onOpenChest: () => void;
  onOpenPair: () => void;
  onOpenTeam: () => void;
  onOpenLeaderboard: () => void;
  onOpenMood: () => void;
  onOpenBrainBreak: () => void;
  onOpenTaskCanvas: () => void;
}

export function FloatingSmartDock({
  onOpenWheel,
  onOpenTimer,
  onOpenNoise,
  onOpenTraffic,
  onOpenSoundboard,
  onOpenChest,
  onOpenPair,
  onOpenTeam,
  onOpenLeaderboard,
  onOpenMood,
  onOpenBrainBreak,
  onOpenTaskCanvas,
}: FloatingSmartDockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      {/* Collapse / Expand Tab */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-1 rounded-t-xl bg-slate-900/90 hover:bg-slate-900 text-slate-300 hover:text-white text-[11px] font-bold border-t border-x border-slate-700/80 shadow-md backdrop-blur-md flex items-center gap-1 transition-all cursor-pointer"
      >
        <span className="text-amber-400">✨ Smart Board Quick Dock</span>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Main Dock Container */}
      {isExpanded && (
        <div className="bg-slate-900/95 backdrop-blur-xl p-2 rounded-2xl border-2 border-slate-700/90 shadow-2xl flex items-center gap-1.5 animate-in slide-in-from-bottom-2 max-w-[95vw] overflow-x-auto">
          {/* 1. Wheel */}
          <button
            type="button"
            onClick={onOpenWheel}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Vòng quay gọi tên"
          >
            <span className="text-lg">🎡</span>
            <span className="hidden md:inline">Vòng Quay</span>
          </button>

          {/* 2. Timer */}
          <button
            type="button"
            onClick={onOpenTimer}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Đồng hồ đếm ngược"
          >
            <span className="text-lg">⏱️</span>
            <span className="hidden md:inline">Đồng Hồ</span>
          </button>

          {/* 3. Noise Meter */}
          <button
            type="button"
            onClick={onOpenNoise}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Đo tiếng ồn lớp học"
          >
            <span className="text-lg">🔊</span>
            <span className="hidden md:inline">Đo Tiếng Ồn</span>
          </button>

          {/* 4. Traffic Light */}
          <button
            type="button"
            onClick={onOpenTraffic}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Đèn giao thông nề nếp"
          >
            <span className="text-lg">🚦</span>
            <span className="hidden md:inline">Đèn Hiệu</span>
          </button>

          {/* 5. Soundboard */}
          <button
            type="button"
            onClick={onOpenSoundboard}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Bảng âm thanh sư phạm"
          >
            <span className="text-lg">🔔</span>
            <span className="hidden md:inline">Âm Thanh</span>
          </button>

          {/* 6. Mystery Chest */}
          <button
            type="button"
            onClick={onOpenChest}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Hộp quà bí mật"
          >
            <span className="text-lg">🎁</span>
            <span className="hidden md:inline">Hộp Quà</span>
          </button>

          {/* 7. Pairs */}
          <button
            type="button"
            onClick={onOpenPair}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Ghép đôi bạn cùng tiến"
          >
            <span className="text-lg">🤝</span>
            <span className="hidden md:inline">Ghép Cặp</span>
          </button>

          {/* 8. Team */}
          <button
            type="button"
            onClick={onOpenTeam}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Chia nhóm học tập"
          >
            <span className="text-lg">👥</span>
            <span className="hidden md:inline">Chia Nhóm</span>
          </button>

          {/* 9. Leaderboard */}
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Đường đua 4 tổ"
          >
            <span className="text-lg">🏆</span>
            <span className="hidden md:inline">Đua 4 Tổ</span>
          </button>

          {/* 10. Mood */}
          <button
            type="button"
            onClick={onOpenMood}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Thời tiết cảm xúc"
          >
            <span className="text-lg">☀️</span>
            <span className="hidden md:inline">Cảm Xúc</span>
          </button>

          {/* 11. Brain Break */}
          <button
            type="button"
            onClick={onOpenBrainBreak}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Nạp năng lượng 2 phút"
          >
            <span className="text-lg">🧘</span>
            <span className="hidden md:inline">Vận Động</span>
          </button>

          {/* 12. Task Canvas */}
          <button
            type="button"
            onClick={onOpenTaskCanvas}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
            title="Bảng lệnh nhiệm vụ"
          >
            <span className="text-lg">📋</span>
            <span className="hidden md:inline">Bảng Lệnh</span>
          </button>
        </div>
      )}
    </div>
  );
}
