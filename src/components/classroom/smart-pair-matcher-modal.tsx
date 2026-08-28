'use client';

import React, { useState } from 'react';
import {
  Users,
  Shuffle,
  Sparkles,
  Copy,
  X,
  UserCheck,
  Award,
} from 'lucide-react';
import { Student } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface SmartPairMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  className?: string;
}

interface Pair {
  id: number;
  student1: Student;
  student2?: Student;
}

export function SmartPairMatcherModal({
  isOpen,
  onClose,
  students,
  className = '4A1',
}: SmartPairMatcherModalProps) {
  const [mode, setMode] = useState<'ALL_PAIRS' | 'SPOTLIGHT_PAIR'>('ALL_PAIRS');
  const [strategy, setStrategy] = useState<'RANDOM' | 'BALANCE_GENDER'>('BALANCE_GENDER');
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [spotlightPair, setSpotlightPair] = useState<[Student, Student] | null>(null);

  // Generate Pairs for Whole Class
  const generatePairs = () => {
    if (students.length === 0) return;

    const generated: Pair[] = [];

    if (strategy === 'BALANCE_GENDER') {
      const males = students.filter((s) => s.gender === 'Nam').sort(() => 0.5 - Math.random());
      const females = students.filter((s) => s.gender === 'Nữ').sort(() => 0.5 - Math.random());

      const minCount = Math.min(males.length, females.length);
      for (let i = 0; i < minCount; i++) {
        generated.push({
          id: i + 1,
          student1: males[i],
          student2: females[i],
        });
      }

      // Remaining students paired together
      const remaining = males.length > females.length ? males.slice(minCount) : females.slice(minCount);
      for (let i = 0; i < remaining.length; i += 2) {
        generated.push({
          id: generated.length + 1,
          student1: remaining[i],
          student2: remaining[i + 1],
        });
      }
    } else {
      const shuffled = [...students].sort(() => 0.5 - Math.random());
      for (let i = 0; i < shuffled.length; i += 2) {
        generated.push({
          id: Math.floor(i / 2) + 1,
          student1: shuffled[i],
          student2: shuffled[i + 1],
        });
      }
    }

    setPairs(generated);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    toast.success(`Đã ghép thành ${generated.length} cặp đôi học tập thành công!`);
  };

  // Pick 1 Pair randomly to spotlight
  const pickSpotlightPair = () => {
    if (students.length < 2) return;
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const selected: [Student, Student] = [shuffled[0], shuffled[1]];
    setSpotlightPair(selected);
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } });
    toast.success(`Đã gọi cặp đôi: ${selected[0].fullName} & ${selected[1].fullName}!`);
  };

  const handleCopyPairs = () => {
    if (pairs.length === 0) return;
    let text = `📋 [DANH SÁCH GHÉP CẶP ĐÔI BẠN CÙNG TIẾN — LỚP ${className}]\n\n`;
    pairs.forEach((p) => {
      text += `🤝 Cặp ${p.id}: ${p.student1.fullName} (${p.student1.gender}) ⮂ ${
        p.student2 ? `${p.student2.fullName} (${p.student2.gender})` : '(Học nhóm 3)'
      }\n`;
    });
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép danh sách ghép cặp vào bộ nhớ tạm!');
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
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🤝
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight">
                Bộ Ghép Cặp Nhanh "Đôi Bạn Cùng Tiến" & Đóng Vai
              </h3>
              <p className="text-xs text-teal-100">
                Lớp {className} • Sĩ số: {students.length} học sinh
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {pairs.length > 0 && mode === 'ALL_PAIRS' && (
              <button
                type="button"
                onClick={handleCopyPairs}
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

        {/* Tab Switcher & Options */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-1 rounded-xl font-bold">
              <button
                type="button"
                onClick={() => setMode('ALL_PAIRS')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'ALL_PAIRS'
                    ? 'bg-white text-teal-800 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Ghép Cặp Cả Lớp
              </button>
              <button
                type="button"
                onClick={() => setMode('SPOTLIGHT_PAIR')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'SPOTLIGHT_PAIR'
                    ? 'bg-white text-teal-800 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌟 Bốc Thăm 1 Cặp Lên Bảng
              </button>
            </div>

            {mode === 'ALL_PAIRS' && (
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
              >
                <option value="BALANCE_GENDER">⚖️ Ghép 1 Nam + 1 Nữ</option>
                <option value="RANDOM">🎲 Ngẫu nhiên hoàn toàn</option>
              </select>
            )}
          </div>

          <button
            type="button"
            onClick={mode === 'ALL_PAIRS' ? generatePairs : pickSpotlightPair}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>{mode === 'ALL_PAIRS' ? 'Ghép Cặp Ngay 🎲' : 'Bốc Cặp Đôi Mới 🌟'}</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {mode === 'SPOTLIGHT_PAIR' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              {spotlightPair ? (
                <div className="w-full max-w-xl p-8 rounded-3xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-white text-center space-y-4 shadow-xl animate-in zoom-in-95">
                  <span className="text-4xl">🌟 🤝 🌟</span>
                  <div className="text-xs font-black uppercase tracking-wider text-teal-100">
                    CẶP ĐÔI ĐƯỢC CHỌN LÊN BẢNG ĐÓNG VAI / THI ĐẤU:
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30 space-y-1">
                      <div className="text-3xl">👤</div>
                      <h3 className="font-black text-lg sm:text-xl truncate">
                        {spotlightPair[0].fullName}
                      </h3>
                      <span className="inline-block bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {spotlightPair[0].gender}
                      </span>
                    </div>

                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30 space-y-1">
                      <div className="text-3xl">👤</div>
                      <h3 className="font-black text-lg sm:text-xl truncate">
                        {spotlightPair[1].fullName}
                      </h3>
                      <span className="inline-block bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {spotlightPair[1].gender}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-3xl">
                    🌟
                  </div>
                  <h4 className="font-black text-slate-800 text-base">
                    Bốc thăm ngẫu nhiên 2 bạn học sinh
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Bấm nút <strong>"Bốc Cặp Đôi Mới"</strong> để chọn 2 học sinh cùng lên bảng đóng vai hội thoại hoặc thi đấu đối kháng.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {pairs.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-2xl">
                    🤝
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Chưa tạo danh sách ghép cặp</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Chọn chế độ và bấm <strong>"Ghép Cặp Ngay"</strong> để hệ thống tự động chia cặp đôi cho cả lớp.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pairs.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50 transition-colors shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-teal-100 pb-1.5">
                        <span className="font-black text-teal-800 text-xs flex items-center gap-1">
                          <span>🤝</span>
                          <span>Đôi Bạn {p.id}</span>
                        </span>
                        <span className="text-[10px] font-bold text-teal-600">
                          {p.student2 ? '2 Em' : '1 Em'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-1 shadow-2xs">
                          <span className="font-bold text-slate-800 truncate">
                            {p.student1.fullName}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                              p.student1.gender === 'Nam'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {p.student1.gender}
                          </span>
                        </div>

                        {p.student2 ? (
                          <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-1 shadow-2xs">
                            <span className="font-bold text-slate-800 truncate">
                              {p.student2.fullName}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                p.student2.gender === 'Nam'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-pink-50 text-pink-700'
                            }`}
                            >
                              {p.student2.gender}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 text-amber-800 text-[10px] font-bold text-center">
                            Gộp nhóm 3 với cặp trước
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
