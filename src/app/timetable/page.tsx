'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  Copy,
  RotateCcw,
  Plus,
  Sparkles,
  Sun,
  Sunset,
  Edit2,
  BookOpen,
  Info,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import {
  DAYS_OF_WEEK,
  PERIODS,
  DEFAULT_SUBJECT_THEMES,
  getSubjectTheme,
  PeriodInfo,
} from '@/lib/timetable-data';
import { DayOfWeek, TimetableSlot } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TimetablePage() {
  const { classInfo, timetable, updateTimetableSlot, resetTimetableToStandard, customSubjects } = useAppStore();
  const { profile, teachers } = useAuth();

  // Combine default subjects & custom subjects
  const allThemes = [
    ...DEFAULT_SUBJECT_THEMES,
    ...customSubjects.map((cs) => ({
      code: cs.code,
      name: cs.name,
      shortName: cs.shortName,
      icon: cs.icon,
      bgColor: cs.bgColor,
      textColor: cs.textColor,
      borderColor: cs.borderColor,
      category: cs.category,
    })),
  ];

  // Xác định ngày hôm nay (mặc định Thứ Hai nếu rơi vào cuối tuần)
  const currentDayIndex = new Date().getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
  const defaultDay: DayOfWeek =
    currentDayIndex >= 1 && currentDayIndex <= 5
      ? (`T${currentDayIndex + 1}` as DayOfWeek)
      : 'T2';

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(defaultDay);
  const [editingSlot, setEditingSlot] = useState<{
    day: DayOfWeek;
    period: number;
    subjectCode: string;
    subjectName: string;
    note: string;
    teacherName: string;
  } | null>(null);

  // Lấy dữ liệu tiết học
  const getSlot = (day: DayOfWeek, period: number): TimetableSlot | undefined => {
    return timetable.find((s) => s.day === day && s.period === period);
  };

  // Mở modal sửa tiết
  const handleOpenEdit = (day: DayOfWeek, period: number) => {
    const slot = getSlot(day, period);
    const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : getSubjectTheme('TIENG_VIET', customSubjects);
    setEditingSlot({
      day,
      period,
      subjectCode: slot ? slot.subjectCode : 'TIENG_VIET',
      subjectName: slot ? slot.subjectName : theme.name,
      note: slot?.note || '',
      teacherName: slot?.teacherName || classInfo.teacherName || '',
    });
  };

  // Lưu tiết học
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    updateTimetableSlot(
      editingSlot.day,
      editingSlot.period,
      editingSlot.subjectCode,
      editingSlot.subjectName,
      editingSlot.note,
      editingSlot.teacherName
    );

    toast.success(`Đã cập nhật Tiết ${editingSlot.period} (${DAYS_OF_WEEK.find((d) => d.id === editingSlot.day)?.name})`);
    setEditingSlot(null);
  };

  // Reset về mẫu chuẩn
  const handleResetToStandard = () => {
    if (confirm('Bạn có muốn khôi phục lại Thời khóa biểu mẫu chuẩn Khối 4 (2 buổi/ngày) theo Chương trình GDPT 2018?')) {
      resetTimetableToStandard();
      toast.success('Đã áp dụng Thời khóa biểu chuẩn mẫu!');
    }
  };

  // Sao chép lịch học ngày được chọn để gửi Zalo Phụ huynh
  const handleCopyDaySchedule = () => {
    const dayInfo = DAYS_OF_WEEK.find((d) => d.id === selectedDay);
    const morningSlots = PERIODS.filter((p) => p.session === 'MORNING').map((p) => {
      const slot = getSlot(selectedDay, p.period);
      const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;
      return `  • Tiết ${p.period} (${p.time}): ${theme ? `${theme.icon} ${slot?.subjectName}` : 'Nghỉ'}${slot?.note ? ` (Dặn dò: ${slot.note})` : ''}`;
    });

    const afternoonSlots = PERIODS.filter((p) => p.session === 'AFTERNOON').map((p) => {
      const slot = getSlot(selectedDay, p.period);
      const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;
      return `  • Tiết ${p.period} (${p.time}): ${theme ? `${theme.icon} ${slot?.subjectName}` : 'Nghỉ'}${slot?.note ? ` (Dặn dò: ${slot.note})` : ''}`;
    });

    const text = `⏰ [LỊCH HỌC & DẶN DÒ ${dayInfo?.name.toUpperCase()} - LỚP ${classInfo.name}]
🏫 Trường: ${classInfo.schoolName} - GVCN: ${classInfo.teacherName}

☀️ BUỔI SÁNG:
${morningSlots.join('\n')}

🌤️ BUỔI CHIỀU:
${afternoonSlots.join('\n')}

Kính nhờ quý phụ huynh nhắc nhở các em chuẩn bị đầy đủ sách vở và đồ dùng học tập theo thời khóa biểu. Trân trọng!`;

    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép lịch học ${dayInfo?.name}! Bạn có thể dán vào nhóm Zalo Phụ huynh.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Calendar className="w-7 h-7 text-blue-600" />
              <span>Thời Khóa Biểu Lớp {classInfo.name}</span>
            </h1>
            <span className="bg-blue-100 text-blue-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
              Khối {classInfo.grade} (2 Buổi/Ngày)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chuẩn khung thời gian GDPT 2018 (Sáng 4 tiết: 07:45 - 10:35 • Chiều 3 tiết: 14:00 - 16:05).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/homework"
            className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-indigo-200 transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>Môn Tùy Biến (STEM...)</span>
          </Link>

          <button
            onClick={handleCopyDaySchedule}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors"
            title="Sao chép lịch học ngày đã chọn để gửi Zalo cho phụ huynh"
          >
            <Copy className="w-4 h-4" />
            <span>Gửi Zalo Ngày Này</span>
          </button>

          <button
            onClick={handleResetToStandard}
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
            title="Áp dụng mẫu chuẩn Khối 4"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Mẫu Chuẩn Khối 4</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In TKB</span>
          </button>
        </div>
      </div>

      {/* Day Selector Pills for Mobile / Quick View */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-1 overflow-x-auto">
        <span className="text-xs font-bold text-slate-500 uppercase px-2 shrink-0 hidden sm:inline">
          Xem nhanh:
        </span>
        <div className="flex items-center space-x-1.5 flex-1 justify-around">
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = selectedDay === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`flex-1 min-w-[70px] py-2 rounded-xl font-bold text-xs transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs scale-102'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Timetable Full Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header with School & Class Info */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Bảng Thời Khóa Biểu Chi Tiết Tuần Lễ
            </h2>
            <p className="text-xs text-slate-500">
              Bấm trực tiếp vào từng ô tiết học để đổi môn, sửa tên phân môn hoặc thêm ghi chú dặn dò.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <Sun className="w-4 h-4 text-amber-500" /> Sáng: 4 Tiết
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sunset className="w-4 h-4 text-indigo-500" /> Chiều: 3 Tiết
            </span>
          </div>
        </div>

        {/* Responsive Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[720px]">
            {/* Column Headers */}
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 text-center w-24 border-r border-slate-200">Buổi / Tiết</th>
                <th className="p-3 text-center w-28 border-r border-slate-200">Thời gian</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th
                    key={day.id}
                    className={`p-3 text-center border-r border-slate-200 transition-colors ${
                      selectedDay === day.id ? 'bg-blue-50/80 text-blue-900 font-extrabold' : ''
                    }`}
                  >
                    <div className="text-sm font-extrabold">{day.name}</div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Rows (Morning Periods 1-4, Break, Afternoon Periods 5-7) */}
            <tbody className="divide-y divide-slate-200">
              {/* MORNING SESSIONS */}
              {PERIODS.filter((p) => p.session === 'MORNING').map((period) => (
                <tr key={period.period} className="hover:bg-slate-50/50 transition-colors">
                  {/* Period Name */}
                  <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50/50 border-r border-slate-200">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-bold">
                      {period.name}
                    </span>
                  </td>

                  {/* Time Range */}
                  <td className="p-2.5 text-center font-mono font-medium text-slate-500 border-r border-slate-200 text-[11px]">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{period.time}</span>
                    </div>
                  </td>

                  {/* 5 Days Columns */}
                  {DAYS_OF_WEEK.map((day) => {
                    const slot = getSlot(day.id, period.period);
                    const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;
                    const isSelected = selectedDay === day.id;

                    return (
                      <td
                        key={day.id}
                        className={`p-1.5 border-r border-slate-200 align-top ${
                          isSelected ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <button
                          onClick={() => handleOpenEdit(day.id, period.period)}
                          className={`w-full min-h-[64px] p-2 rounded-xl border text-left transition-all hover:scale-101 hover:shadow-xs group cursor-pointer flex flex-col justify-between ${
                            theme
                              ? `${theme.bgColor} ${theme.textColor} ${theme.borderColor}`
                              : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {theme ? (
                            <>
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm">{theme.icon}</span>
                                <span className="text-[10px] font-bold opacity-75">
                                  {theme.shortName}
                                </span>
                              </div>
                              <p className="font-bold text-xs mt-1 leading-tight line-clamp-2">
                                {slot?.subjectName}
                              </p>
                              {slot?.note && (
                                <p className="text-[9px] mt-1 pt-1 border-t border-current/15 opacity-85 truncate">
                                  📌 {slot.note}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                              + Thêm tiết
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* LUNCH & REST BREAK DIVIDER */}
              <tr className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 text-amber-900 border-y-2 border-amber-200 font-bold">
                <td colSpan={7} className="py-2.5 px-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-xs">
                    <span>🍱</span>
                    <span>10:35 - 14:00: Ăn Trưa Bán Trú & Nghỉ Ngơi Buổi Trưa</span>
                    <span>😴</span>
                  </div>
                </td>
              </tr>

              {/* AFTERNOON SESSIONS */}
              {PERIODS.filter((p) => p.session === 'AFTERNOON').map((period) => (
                <tr key={period.period} className="hover:bg-slate-50/50 transition-colors">
                  {/* Period Name */}
                  <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50/50 border-r border-slate-200">
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[11px] font-bold">
                      {period.name}
                    </span>
                  </td>

                  {/* Time Range */}
                  <td className="p-2.5 text-center font-mono font-medium text-slate-500 border-r border-slate-200 text-[11px]">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{period.time}</span>
                    </div>
                  </td>

                  {/* 5 Days Columns */}
                  {DAYS_OF_WEEK.map((day) => {
                    const slot = getSlot(day.id, period.period);
                    const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;
                    const isSelected = selectedDay === day.id;

                    return (
                      <td
                        key={day.id}
                        className={`p-1.5 border-r border-slate-200 align-top ${
                          isSelected ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <button
                          onClick={() => handleOpenEdit(day.id, period.period)}
                          className={`w-full min-h-[64px] p-2 rounded-xl border text-left transition-all hover:scale-101 hover:shadow-xs group cursor-pointer flex flex-col justify-between ${
                            theme
                              ? `${theme.bgColor} ${theme.textColor} ${theme.borderColor}`
                              : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {theme ? (
                            <>
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm">{theme.icon}</span>
                                <span className="text-[10px] font-bold opacity-75">
                                  {theme.shortName}
                                </span>
                              </div>
                              <p className="font-bold text-xs mt-1 leading-tight line-clamp-2">
                                {slot?.subjectName}
                              </p>
                              {slot?.note && (
                                <p className="text-[9px] mt-1 pt-1 border-t border-current/15 opacity-85 truncate">
                                  📌 {slot.note}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                              + Thêm tiết
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Slot */}
      {editingSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Chỉnh Sửa Tiết {editingSlot.period} • {DAYS_OF_WEEK.find((d) => d.id === editingSlot.day)?.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {PERIODS.find((p) => p.period === editingSlot.period)?.time} (
                  {editingSlot.period <= 4 ? 'Buổi Sáng' : 'Buổi Chiều'})
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              {/* Quick Subject Themes Palette */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700 uppercase">
                    Chọn môn học nhanh:
                  </label>
                  <Link
                    href="/homework"
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>+ Thêm môn tùy biến</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
                  {allThemes.map((theme) => {
                    const isSelected = editingSlot.subjectCode === theme.code;
                    return (
                      <button
                        key={theme.code}
                        type="button"
                        onClick={() =>
                          setEditingSlot({
                            ...editingSlot,
                            subjectCode: theme.code,
                            subjectName: theme.name,
                          })
                        }
                        className={`p-2 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                          isSelected
                            ? 'ring-2 ring-blue-600 bg-blue-50 border-blue-500 font-bold'
                            : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-lg">{theme.icon}</span>
                        <span className="text-xs truncate text-slate-800">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Custom Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên phân môn chi tiết (hiển thị trên TKB)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiếng Việt (Đọc) / Toán học / Tin học"
                  value={editingSlot.subjectName}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subjectName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Teacher Selector (Refer user profile & faculty list) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giáo viên giảng dạy / GV Bộ Môn
                </label>
                <select
                  value={editingSlot.teacherName}
                  onChange={(e) => setEditingSlot({ ...editingSlot, teacherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                >
                  <option value={classInfo.teacherName}>
                    👩‍🏫 {classInfo.teacherName} (GVCN Lớp)
                  </option>
                  {profile && profile.fullName !== classInfo.teacherName && (
                    <option value={profile.fullName}>
                      ✨ [Tôi] {profile.fullName} ({profile.title || 'Tôi'})
                    </option>
                  )}
                  {teachers
                    .filter((t) => t.fullName !== classInfo.teacherName && t.fullName !== profile?.fullName)
                    .map((t) => (
                      <option key={t.id} value={t.fullName}>
                        {t.fullName} ({t.title || 'Giáo viên'} - {t.department || 'Tổ chuyên môn'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Note / Dặn dò học sinh */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dặn dò đồ dùng học tập / Ghi chú (hiển thị cho học sinh & phụ huynh)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mang hộp sáp màu, giấy A4, mặc đồ thể thao..."
                  value={editingSlot.note}
                  onChange={(e) => setEditingSlot({ ...editingSlot, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Lưu Tiết Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
