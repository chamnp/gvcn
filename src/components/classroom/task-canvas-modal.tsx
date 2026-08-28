'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Edit3,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Award,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { Student } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface TaskCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  students: Student[];
}

export function TaskCanvasModal({
  isOpen,
  onClose,
  className = '4A1',
  students,
}: TaskCanvasModalProps) {
  const [subject, setSubject] = useState<string>('Toán');
  const [taskTitle, setTaskTitle] = useState<string>('Hoàn thành Bài 1, Bài 2 trang 56 Vở bài tập');
  const [taskRequirement, setTaskRequirement] = useState<string>(
    '1. Trình bày cẩn thận, sạch đẹp vào vở.\n2. Làm xong kiểm tra lại kết quả với bạn cùng bàn.'
  );
  const [spotlightStudents, setSpotlightStudents] = useState<Student[]>([]);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>('');

  // Mini Timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 mins
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setIsTimerRunning(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          confetti({ particleCount: 90, spread: 80 });
          toast.success('HẾT GIỜ LÀM BÀI! Cả lớp dừng bút chú ý lên bảng.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleAddSpotlightStudent = () => {
    if (!selectedStudentToAdd) return;
    const st = students.find((s) => s.id === selectedStudentToAdd);
    if (st && !spotlightStudents.some((s) => s.id === st.id)) {
      setSpotlightStudents((prev) => [...prev, st]);
      confetti({ particleCount: 50, spread: 50 });
      toast.success(`Đã vinh danh em ${st.fullName} lên bảng gương sáng!`);
    }
    setSelectedStudentToAdd('');
  };

  const handleRemoveSpotlightStudent = (id: string) => {
    setSpotlightStudents((prev) => prev.filter((s) => s.id !== id));
  };

  if (!isOpen) return null;

  const timerMins = Math.floor(secondsRemaining / 60);
  const timerSecs = secondsRemaining % 60;

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
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              📋
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg tracking-tight">
                Bảng Lệnh Nhiệm Vụ & Lời Dặn Tiết Học
              </h3>
              <p className="text-xs text-blue-100">
                Lớp {className} • Chiếu chữ to rõ ràng trên Smart TV cho cả lớp làm bài
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Main Board Projection Banner (Big View) */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-850 to-slate-950 border-2 border-indigo-500/40 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-xl text-indigo-300 font-black text-xs border border-indigo-400/30">
                <BookOpen className="w-4 h-4" />
                <span>Môn học: {subject}</span>
              </div>

              {/* Embedded Mini Timer */}
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-black text-sm text-amber-400">
                  {timerMins < 10 ? '0' : ''}{timerMins}:{timerSecs < 10 ? '0' : ''}{timerSecs}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSecondsRemaining(600)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Huge Task Content for Projection */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                🎯 NHIỆM VỤ TIẾT HỌC:
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white leading-snug">
                {taskTitle}
              </h2>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                📌 Yêu cầu & Lời dặn của cô:
              </span>
              <div className="text-sm sm:text-base text-slate-200 whitespace-pre-line font-medium leading-relaxed">
                {taskRequirement}
              </div>
            </div>

            {/* Spotlight Students Banner */}
            {spotlightStudents.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/40 space-y-2 animate-in zoom-in-95">
                <div className="flex items-center space-x-2 text-amber-300 font-black text-xs uppercase">
                  <span>👑</span>
                  <span>GƯƠNG SÁNG TIẾT HỌC — HOÀN THÀNH XUẤT SẮC:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {spotlightStudents.map((st) => (
                    <div
                      key={st.id}
                      className="bg-amber-400 text-slate-950 px-3 py-1 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <span>⭐ {st.fullName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpotlightStudent(st.id)}
                        className="hover:text-rose-700 ml-1 cursor-pointer"
                        title="Bỏ ghim"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Edit Controls for Teacher */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-4">
            <span className="font-black text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Chỉnh sửa nội dung bảng lệnh:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-400">Môn học:</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white text-xs"
                >
                  {['Toán', 'Tiếng Việt', 'Khoa học', 'Lịch sử & Địa lí', 'Đạo đức', 'Hoạt động trải nghiệm', 'Mĩ thuật'].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-400">Tên nhiệm vụ / Bài tập:</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-400">Lời dặn & Yêu cầu làm bài:</label>
              <textarea
                rows={2}
                value={taskRequirement}
                onChange={(e) => setTaskRequirement(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-medium text-white text-xs"
              />
            </div>

            {/* Quick Add Spotlight Student */}
            <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="font-bold text-slate-300 shrink-0">Tuyên dương học sinh:</span>
                <select
                  value={selectedStudentToAdd}
                  onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white text-xs w-full sm:w-60"
                >
                  <option value="">-- Chọn bạn làm bài tốt --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedStudentToAdd}
                  onClick={handleAddSpotlightStudent}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Ghim 👑
                </button>
              </div>

              <div className="flex gap-2">
                {[5, 10, 15, 20].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSecondsRemaining(m * 60);
                      setIsTimerRunning(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      secondsRemaining === m * 60
                        ? 'bg-indigo-600 text-white font-black'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {m}p
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
