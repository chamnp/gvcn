'use client';

import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Plus,
  Minus,
  Star,
  Users,
  Flame,
  History,
  CheckCircle,
  Trophy,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Student } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

const BEHAVIOR_REASONS = [
  { label: 'Phát biểu hăng hái', points: 1, icon: '🙋‍♂️', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Làm bài xuất sắc', points: 2, icon: '📝', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Vở sạch chữ đẹp', points: 2, icon: '✍️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Giúp đỡ bạn bè', points: 1, icon: '🤝', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Giữ gìn vệ sinh', points: 1, icon: '🧹', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { label: 'Nề nếp gương mẫu', points: 2, icon: '⭐', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'Mất trật tự trong giờ', points: -1, icon: '⚠️', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Chưa làm bài tập', points: -1, icon: '❌', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function BehaviorPage() {
  const { students, starLogs, addStarLog, getStudentStars, classInfo } = useAppStore();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'CARDS' | 'HISTORY'>('CARDS');

  // Trao sao
  const handleAward = (student: Student, points: number, category: string, reason: string) => {
    addStarLog(student.id, points, category, reason);

    if (points > 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      toast.success(`Đã thưởng +${points} ⭐ cho em ${student.fullName}!`);
    } else {
      toast.info(`Đã trừ ${Math.abs(points)} sao của em ${student.fullName}`);
    }

    setSelectedStudent(null);
  };

  // Thưởng cho cả lớp
  const handleAwardWholeClass = () => {
    if (confirm('Bạn có muốn cộng +1 ⭐ nề nếp cho TẤT CẢ học sinh trong lớp không?')) {
      students.forEach((s) => {
        addStarLog(s.id, 1, 'Khen thưởng cả lớp', 'Cả lớp nề nếp tốt tiết học');
      });
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      toast.success('Đã thưởng +1 ⭐ cho cả lớp! 🎉');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-500" />
            <span>Nề Nếp & Tích Sao Khen Thưởng</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mô hình khen thưởng tích cực (Gamification) tạo hứng thú học tập cho học sinh tiểu học.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAwardWholeClass}
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Thưởng Sao Cả Lớp 🎉</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('CARDS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'CARDS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Thẻ Học Sinh & Tặng Sao
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'HISTORY'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Lịch Sử Khen Thưởng ({starLogs.length})
        </button>
      </div>

      {activeTab === 'CARDS' ? (
        /* Student Cards Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {students.map((st) => {
            const stars = getStudentStars(st.id);
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStudent(st)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-between group relative overflow-hidden"
              >
                {/* Avatar Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform mb-2">
                  {st.gender === 'Nam' ? '👦' : '👧'}
                </div>

                <div className="w-full">
                  <p className="font-bold text-slate-900 text-xs truncate leading-tight group-hover:text-blue-600">
                    {st.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{st.studentCode}</p>
                </div>

                {/* Stars Badge */}
                <div className="mt-3 inline-flex items-center space-x-1 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-black border border-amber-300 shadow-2xs">
                  <span>⭐</span>
                  <span>{stars} sao</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Star History Log */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-4 text-center">Điểm sao</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {starLogs.map((log) => {
                  const student = students.find((s) => s.id === log.studentId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {student?.fullName || 'Học sinh'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs ${
                            log.points > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.points > 0 ? `+${log.points}` : log.points} ⭐
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{log.category}</td>
                      <td className="py-3 px-4 text-slate-600">{log.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Award Star to Student */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center pb-2 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-3xl mx-auto mb-2">
                {selectedStudent.gender === 'Nam' ? '👦' : '👧'}
              </div>
              <h3 className="text-lg font-black text-slate-900">{selectedStudent.fullName}</h3>
              <p className="text-xs text-slate-500 font-mono">{selectedStudent.studentCode}</p>
              <div className="mt-1 inline-flex items-center space-x-1 bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-xs font-bold">
                <span>Hiện có: {getStudentStars(selectedStudent.id)} ⭐</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2 uppercase">Chọn lý do khen thưởng / nề nếp:</p>
              <div className="grid grid-cols-2 gap-2">
                {BEHAVIOR_REASONS.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleAward(selectedStudent, r.points, r.label, r.label)}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 hover:scale-[1.02] active:scale-95 transition-all ${r.color}`}
                  >
                    <span className="text-xl">{r.icon}</span>
                    <div>
                      <p className="font-bold text-xs">{r.label}</p>
                      <p className="text-[10px] font-semibold opacity-80">
                        {r.points > 0 ? `+${r.points} Sao` : `${r.points} Sao`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
