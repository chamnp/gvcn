"use client";

import React, { useState } from 'react';
import {
  Award,
  Flame,
  Plus,
  Minus,
  RotateCcw,
  X,
} from 'lucide-react';
import { Student } from '@/types';
import { useAppStore } from '@/lib/store';
import { getLocalDateString } from '@/lib/tt27-engine';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface LiveLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  students: Student[];
}

interface GroupState {
  id: number;
  name: string;
  mascot: string;
  mascotName: string;
  color: string;
  gradient: string;
  stars: number;
}

const INITIAL_GROUPS: GroupState[] = [
  { id: 1, name: 'Tổ 1', mascot: '🦁', mascotName: 'Sư Tử Dũng Mãnh', color: 'border-amber-400', gradient: 'from-amber-500 to-orange-500', stars: 15 },
  { id: 2, name: 'Tổ 2', mascot: '🦅', mascotName: 'Đại Bàng Quyết Thắng', color: 'border-blue-400', gradient: 'from-blue-500 to-indigo-500', stars: 18 },
  { id: 3, name: 'Tổ 3', mascot: '🐬', mascotName: 'Cá Heo Thông Minh', color: 'border-teal-400', gradient: 'from-teal-500 to-emerald-500', stars: 12 },
  { id: 4, name: 'Tổ 4', mascot: '🐼', mascotName: 'Gấu Trúc Chăm Chỉ', color: 'border-purple-400', gradient: 'from-purple-500 to-pink-500', stars: 16 },
];

export function LiveLeaderboardModal({
  isOpen,
  onClose,
  className = '4A1',
  students,
}: LiveLeaderboardModalProps) {
  const { addStarLog } = useAppStore();
  const [groups, setGroups] = useState<GroupState[]>(INITIAL_GROUPS);
  const targetStars = 30;

  const handleAwardStarsToLeadingGroup = (group: GroupState) => {
    if (students.length === 0) return;
    const today = getLocalDateString();
    // Assuming students are roughly in 4 groups or award to all students associated with group name/tag or first quarter
    const groupStudentCount = Math.ceil(students.length / 4);
    const startIndex = (group.id - 1) * groupStudentCount;
    const groupStudents = students.slice(startIndex, startIndex + groupStudentCount);

    groupStudents.forEach((s) => {
      addStarLog(s.id, 2, 'Thi đua tổ', `Tổ ${group.id} (${group.name}) dẫn đầu đường đua sao`, 'Thành tích thi đua nề nếp tổ xuất sắc', today);
    });

    confetti({ particleCount: 80, spread: 75 });
    toast.success(`Đã cộng +2 ⭐ vào sổ nề nếp cho tất cả thành viên ${group.name}!`);
  };

  const handleAddStars = (groupId: number, delta: number) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const nextStars = Math.max(0, g.stars + delta);
          if (nextStars >= targetStars && g.stars < targetStars) {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            toast.success(`🎉 ${g.name} (${g.mascotName}) ĐÃ VỀ ĐÍCH ĐẦU TIÊN VỚI ${nextStars} SAO!`);
          }
          return { ...g, stars: nextStars };
        }
        return g;
      })
    );
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại điểm số của 4 tổ về 0?')) {
      setGroups((prev) => prev.map((g) => ({ ...g, stars: 0 })));
      toast.info('Đã đặt lại điểm số thi đua các tổ!');
    }
  };

  if (!isOpen) return null;

  const sortedGroups = [...groups].sort((a, b) => b.stars - a.stars);
  const leadingGroup = sortedGroups[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🏆
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg tracking-tight">
                Đường Đua Tích Sao Thi Đua 4 Tổ — Lớp {className}
              </h3>
              <p className="text-xs text-amber-100">
                Chiếu trực tiếp trên màn hình TV trong giờ sinh hoạt & tiết học
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Đặt lại điểm 0"
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

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {leadingGroup && leadingGroup.stars > 0 && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in zoom-in-95">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">👑</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Đang Dẫn Đầu Đường Đua:
                  </span>
                  <h4 className="font-black text-sm sm:text-base text-white">
                    {leadingGroup.name} ({leadingGroup.mascotName}) — {leadingGroup.stars} ⭐
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAwardStarsToLeadingGroup(leadingGroup)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>+2 ⭐ Thưởng Toàn Tổ Vào Sổ</span>
                </button>
                <span className="text-3xl shrink-0">{leadingGroup.mascot}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((g) => {
              const progress = Math.min(100, Math.round((g.stars / targetStars) * 100));

              return (
                <div
                  key={g.id}
                  className={`bg-slate-800/90 rounded-3xl p-5 border-2 ${g.color} shadow-lg space-y-4 flex flex-col justify-between`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-3xl">{g.mascot}</span>
                        <div>
                          <h4 className="font-black text-base text-white leading-tight">
                            {g.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-bold">
                            {g.mascotName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black text-amber-400">
                          {g.stars}
                        </span>
                        <span className="text-xs text-amber-400 font-bold ml-1">⭐</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Tiến độ: {progress}%</span>
                        <span>Mục tiêu: {targetStars} ⭐</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${g.gradient} transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddStars(g.id, -1)}
                      className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-rose-400 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                      title="Trừ 1 sao"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="flex gap-1.5 flex-1 justify-end">
                      <button
                        type="button"
                        onClick={() => handleAddStars(g.id, 1)}
                        className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>1 ⭐</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddStars(g.id, 2)}
                        className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>2 ⭐</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddStars(g.id, 5)}
                        className={`px-3 py-2 rounded-xl bg-gradient-to-r ${g.gradient} text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1`}
                      >
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>+5 ⭐</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
