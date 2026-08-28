"use client";

import React, { useState } from 'react';
import {
  Users,
  Shuffle,
  Sparkles,
  Copy,
  X,
} from 'lucide-react';
import { Student } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface SmartTeamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  className?: string;
}

const TEAM_NAMES = [
  { name: 'Nhóm Sáng Tạo', badge: '🚀', color: 'bg-blue-50 border-blue-200 text-blue-900' },
  { name: 'Nhóm Đoàn Kết', badge: '🤝', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { name: 'Nhóm Tự Tin', badge: '🌟', color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { name: 'Nhóm Vượt Trội', badge: '🏆', color: 'bg-purple-50 border-purple-200 text-purple-900' },
  { name: 'Nhóm Thông Thái', badge: '🦉', color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
  { name: 'Nhóm Nhanh Nhẹn', badge: '⚡', color: 'bg-rose-50 border-rose-200 text-rose-900' },
  { name: 'Nhóm Bền Bỉ', badge: '🐢', color: 'bg-teal-50 border-teal-200 text-teal-900' },
  { name: 'Nhóm Tinh Anh', badge: '🎯', color: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
];

export function SmartTeamGeneratorModal({
  isOpen,
  onClose,
  students,
  className = '4A1',
}: SmartTeamGeneratorModalProps) {
  const [numTeams, setNumTeams] = useState<number>(4);
  const [strategy, setStrategy] = useState<'RANDOM' | 'BALANCE_GENDER'>('BALANCE_GENDER');
  const [assignRoles, setAssignRoles] = useState<boolean>(true);
  const [teams, setTeams] = useState<{ id: number; name: string; badge: string; members: Student[] }[]>([]);

  const ROLES = ['👑 Trưởng nhóm', '📝 Thư ký', '🎤 Báo cáo viên', '🎨 Hỗ trợ / Thiết kế'];

  const generateTeams = () => {
    if (students.length === 0) return;

    let pool = [...students];
    const generated: { id: number; name: string; badge: string; members: Student[] }[] = [];

    for (let i = 0; i < numTeams; i++) {
      const meta = TEAM_NAMES[i % TEAM_NAMES.length];
      generated.push({
        id: i + 1,
        name: meta.name,
        badge: meta.badge,
        members: [],
      });
    }

    if (strategy === 'BALANCE_GENDER') {
      const males = pool.filter((s) => s.gender === 'Nam').sort(() => 0.5 - Math.random());
      const females = pool.filter((s) => s.gender === 'Nữ').sort(() => 0.5 - Math.random());

      let currentTeamIdx = 0;
      males.forEach((m) => {
        generated[currentTeamIdx % numTeams].members.push(m);
        currentTeamIdx++;
      });

      females.forEach((f) => {
        generated[currentTeamIdx % numTeams].members.push(f);
        currentTeamIdx++;
      });
    } else {
      const shuffled = pool.sort(() => 0.5 - Math.random());
      shuffled.forEach((st, idx) => {
        generated[idx % numTeams].members.push(st);
      });
    }

    setTeams(generated);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    toast.success(`Đã chia ${students.length} học sinh thành ${numTeams} nhóm thành công!`);
  };

  const handleCopyTeams = () => {
    if (teams.length === 0) return;
    let text = `📋 [DANH SÁCH CHIA NHÓM HỌC TẬP — LỚP ${className}]\n\n`;
    teams.forEach((t) => {
      text += `${t.badge} ${t.name.toUpperCase()} (${t.members.length} em):\n`;
      t.members.forEach((m, idx) => {
        const roleStr = assignRoles && idx < ROLES.length ? ` [${ROLES[idx]}]` : '';
        text += `  ${idx + 1}. ${m.fullName} (${m.gender})${roleStr}\n`;
      });
      text += '\n';
    });
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép danh sách các nhóm vào bộ nhớ tạm!');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              👥
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight">
                Bộ Chia Nhóm Học Tập Tự Động & Cân Bằng
              </h3>
              <p className="text-xs text-blue-100">
                Lớp {className} • Sĩ số: {students.length} học sinh
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {teams.length > 0 && (
              <button
                type="button"
                onClick={handleCopyTeams}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao Chép</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-700">Số lượng nhóm:</span>
              <div className="flex gap-1">
                {[2, 3, 4, 5, 6, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumTeams(n)}
                    className={`w-7 h-7 rounded-lg font-black transition-all cursor-pointer ${
                      numTeams === n
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-700">Chế độ chia:</span>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="px-3 py-1 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="BALANCE_GENDER">⚖️ Cân bằng tỷ lệ Nam / Nữ</option>
                <option value="RANDOM">🎲 Ngẫu nhiên hoàn toàn</option>
              </select>
            </div>

            <label className="flex items-center space-x-1.5 font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={assignRoles}
                onChange={(e) => setAssignRoles(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>👑 Phân vai trò nhóm</span>
            </label>
          </div>

          <button
            type="button"
            onClick={generateTeams}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>Xếp Nhóm Ngay 🎲</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {teams.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                👥
              </div>
              <h4 className="font-bold text-sm text-slate-800">Chưa tạo danh sách nhóm</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Chọn số lượng nhóm và bấm nút <strong>"Xếp Nhóm Ngay"</strong> để hệ thống tự động phân bổ đều học sinh.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {teams.map((t, idx) => {
                const meta = TEAM_NAMES[idx % TEAM_NAMES.length];
                const males = t.members.filter((m) => m.gender === 'Nam').length;
                const females = t.members.filter((m) => m.gender === 'Nữ').length;

                return (
                  <div
                    key={t.id}
                    className={`rounded-3xl border p-4 flex flex-col justify-between shadow-xs transition-all ${meta.color}`}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{t.badge}</span>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                            {t.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs">
                          {t.members.length} em
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                        {t.members.map((m, mIdx) => (
                          <div
                            key={m.id}
                            className="bg-white/90 p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-1.5 shadow-2xs"
                          >
                            <div className="flex flex-col truncate">
                              <span className="font-bold text-slate-800 truncate">
                                {mIdx + 1}. {m.fullName}
                              </span>
                              {assignRoles && mIdx < ROLES.length && (
                                <span className="text-[9px] font-black text-indigo-700">
                                  {ROLES[mIdx]}
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                                m.gender === 'Nam'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                  : 'bg-pink-50 text-pink-700 border border-pink-100'
                              }`}
                            >
                              {m.gender}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 mt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                      <span>{males} Nam • {females} Nữ</span>
                      <span className="font-bold text-indigo-600">Nhóm {t.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
