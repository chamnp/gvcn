'use client';

import React, { useState, useEffect, use } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Sparkles,
  School,
  ExternalLink,
  ChevronRight,
  Sun,
  Backpack,
  Smile,
  CheckSquare,
  Square,
  FileText,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getSubjectTheme, DAYS_OF_WEEK, PERIODS } from '@/lib/timetable-data';
import { DayOfWeek, TimetableSlot } from '@/types';
import Link from 'next/link';

export default function PublicClassHomeworkPortal({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const resolvedParams = use(params);
  const rawParam = (resolvedParams.classId || '4a1').toLowerCase();

  const { schoolClasses, allHomeworks, customSubjects, timetable } = useAppStore();

  // Find class from param
  const currentClass = schoolClasses.find(
    (c) =>
      c.id.toLowerCase() === rawParam ||
      c.name.toLowerCase() === rawParam ||
      c.name.toLowerCase().replace(/\s+/g, '') === rawParam
  ) || schoolClasses[0];

  // Filter homework for this class
  const classHomeworks = allHomeworks.filter(
    (h) =>
      h.classId === currentClass.id ||
      h.className.toLowerCase() === currentClass.name.toLowerCase() ||
      h.className.toLowerCase().replace(/\s+/g, '') === rawParam
  );

  // Student Local Checklist (State stored in localStorage)
  const [completedHwIds, setCompletedHwIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'HOMEWORK' | 'BACKPACK' | 'TIMETABLE'>('HOMEWORK');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`gvcn_hw_done_${currentClass.id}`);
      if (saved) setCompletedHwIds(JSON.parse(saved));
    } catch (e) {}
  }, [currentClass.id]);

  const toggleCompleteHw = (hwId: string) => {
    setCompletedHwIds((prev) => {
      const isDone = prev.includes(hwId);
      const updated = isDone ? prev.filter((id) => id !== hwId) : [...prev, hwId];
      try {
        localStorage.setItem(`gvcn_hw_done_${currentClass.id}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Determine tomorrow's day of week
  const todayDayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday...
  const nextDayMap: Record<number, DayOfWeek> = {
    0: 'T2', // Sunday -> Monday
    1: 'T3', // Monday -> Tuesday
    2: 'T4', // Tuesday -> Wednesday
    3: 'T5', // Wednesday -> Thursday
    4: 'T6', // Thursday -> Friday
    5: 'T2', // Friday -> Monday
    6: 'T2', // Saturday -> Monday
  };
  const tomorrowDayCode: DayOfWeek = nextDayMap[todayDayIndex] || 'T2';
  const tomorrowDayInfo = DAYS_OF_WEEK.find((d) => d.id === tomorrowDayCode);

  // Tomorrow slots from timetable
  const tomorrowSlots = timetable.filter((s) => s.day === tomorrowDayCode);

  const doneCount = classHomeworks.filter((h) => completedHwIds.includes(h.id)).length;
  const isAllDone = classHomeworks.length > 0 && doneCount === classHomeworks.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              {currentClass.name}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Góc Học Tập Lớp {currentClass.name}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Tiểu học
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-sm">
                GVCN: {currentClass.teacherName} • {currentClass.schoolName}
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
          >
            Dành cho Giáo viên →
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Welcome Greeting Card */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-xs">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>Chào các em học sinh & Quý phụ huynh!</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Bảng Bài Tập & Lịch Học Về Nhà
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Kiểm tra nhiệm vụ hôm nay và chuẩn bị sách vở cho ngày mai ({tomorrowDayInfo?.name}).
            </p>

            {/* Progress Bar */}
            {classHomeworks.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>Tiến độ hoàn thành bài tập của em:</span>
                  <span>{doneCount}/{classHomeworks.length} bài ({Math.round((doneCount / classHomeworks.length) * 100)}%)</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden p-0.5">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(doneCount / classHomeworks.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
          <button
            onClick={() => setActiveTab('HOMEWORK')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'HOMEWORK'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bài Tập ({classHomeworks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKPACK')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'BACKPACK'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Backpack className="w-4 h-4" />
            <span>Soạn Sách Vở</span>
          </button>

          <button
            onClick={() => setActiveTab('TIMETABLE')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'TIMETABLE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Thời Khóa Biểu</span>
          </button>
        </div>

        {/* TAB 1: HOMEWORK LIST */}
        {activeTab === 'HOMEWORK' && (
          <div className="space-y-3">
            {isAllDone && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center space-x-3 text-emerald-800 animate-in fade-in">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl shrink-0">
                  🎉
                </div>
                <div>
                  <h4 className="font-bold text-sm">Tuyệt vời! Em đã hoàn thành hết bài tập!</h4>
                  <p className="text-xs text-emerald-700">Hãy soạn sách vở vào cặp và chuẩn bị cho ngày học ngày mai nhé.</p>
                </div>
              </div>
            )}

            {classHomeworks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                  ✨
                </div>
                <h3 className="font-bold text-base text-slate-800">Hôm nay không có bài tập về nhà!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Chúc các em học sinh có một buổi tối nghỉ ngơi vui vẻ bên gia đình.
                </p>
              </div>
            ) : (
              classHomeworks.map((hw) => {
                const theme = getSubjectTheme(hw.subjectCode, customSubjects);
                const isDone = completedHwIds.includes(hw.id);

                return (
                  <div
                    key={hw.id}
                    className={`bg-white rounded-3xl border transition-all duration-200 p-5 shadow-xs ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-2xl">{theme.icon}</span>
                        <div>
                          <span
                            className={`inline-block text-[11px] font-black px-2.5 py-0.5 rounded-lg border ${theme.bgColor} ${theme.textColor} ${theme.borderColor}`}
                          >
                            {hw.subjectName}
                          </span>
                          <h3 className={`font-bold text-sm sm:text-base text-slate-900 mt-0.5 ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {hw.title}
                          </h3>
                        </div>
                      </div>

                      {/* Interactive Checkbox */}
                      <button
                        onClick={() => toggleCompleteHw(hw.id)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isDone ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        <span>{isDone ? 'Đã Xong' : 'Chưa Xong'}</span>
                      </button>
                    </div>

                    {/* Description */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {hw.description}
                    </div>

                    {/* Teacher Reminder */}
                    {hw.reminderNotes && (
                      <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start space-x-2 text-amber-900 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Cô dặn dò:</strong> {hw.reminderNotes}</span>
                      </div>
                    )}

                    {/* Attachment / Preview */}
                    {hw.attachmentUrl && (
                      <div className="mt-3 flex items-center space-x-2">
                        <button
                          onClick={() => setPreviewImageUrl(hw.attachmentUrl!)}
                          className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem ảnh phiếu bài tập</span>
                        </button>
                      </div>
                    )}

                    {/* Footer Due */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Ngày giao: {hw.assignedDate}</span>
                      <span className="font-bold text-rose-600 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Hạn nộp: {hw.dueDate}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: BACKPACK PREPARATION FOR TOMORROW */}
        {activeTab === 'BACKPACK' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
                  🎒
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Chuẩn Bị Sách Vở Cho Ngày Mai ({tomorrowDayInfo?.name})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dựa vào Thời khóa biểu ngày mai để mang đủ sách vở và đồ dùng học tập.
                  </p>
                </div>
              </div>

              {/* Tomorrow Periods */}
              <div className="space-y-2">
                {tomorrowSlots.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">Không có tiết học vào ngày này.</p>
                ) : (
                  tomorrowSlots.map((slot) => {
                    const theme = getSubjectTheme(slot.subjectCode, customSubjects);
                    const periodInfo = PERIODS.find((p) => p.period === slot.period);

                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{theme.icon}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {slot.subjectName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({periodInfo?.name} • {periodInfo?.time})
                              </span>
                            </div>
                            {slot.note && (
                              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                                🔔 {slot.note}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${theme.bgColor} ${theme.textColor} ${theme.borderColor}`}
                        >
                          {theme.shortName}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FULL TIMETABLE */}
        {activeTab === 'TIMETABLE' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Thời Khóa Biểu Tuần — Lớp {currentClass.name}</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5 text-center w-16">Tiết</th>
                    {DAYS_OF_WEEK.map((d) => (
                      <th key={d.id} className="p-2.5 text-center">
                        {d.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERIODS.map((period) => (
                    <tr key={period.period} className="hover:bg-slate-50/60">
                      <td className="p-2 text-center font-bold text-slate-600 bg-slate-50/50">
                        <div>{period.name}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{period.time.split(' - ')[0]}</div>
                      </td>
                      {DAYS_OF_WEEK.map((d) => {
                        const slot = timetable.find((s) => s.day === d.id && s.period === period.period);
                        if (!slot) return <td key={d.id} className="p-1.5 text-center text-slate-300">—</td>;
                        const theme = getSubjectTheme(slot.subjectCode, customSubjects);

                        return (
                          <td key={d.id} className="p-1.5 text-center">
                            <div
                              className={`p-1.5 rounded-xl border text-[11px] font-bold ${theme.bgColor} ${theme.textColor} ${theme.borderColor}`}
                            >
                              <div className="text-sm leading-none mb-0.5">{theme.icon}</div>
                              <div className="truncate">{theme.shortName}</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL IMAGE PREVIEW */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Phiếu Bài Tập Đính Kèm</h4>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Đóng ✕
              </button>
            </div>
            <img
              src={previewImageUrl}
              alt="Phiếu bài tập"
              className="w-full max-h-[75vh] object-contain rounded-2xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
