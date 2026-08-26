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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  DAYS_OF_WEEK,
  PERIODS,
  SUBJECT_THEMES,
  getSubjectTheme,
  PeriodInfo,
} from '@/lib/timetable-data';
import { DayOfWeek, TimetableSlot } from '@/types';
import { toast } from 'sonner';

export default function TimetablePage() {
  const { classInfo, timetable, updateTimetableSlot, resetTimetableToStandard } = useAppStore();

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
  } | null>(null);

  // Lấy dữ liệu tiết học
  const getSlot = (day: DayOfWeek, period: number): TimetableSlot | undefined => {
    return timetable.find((s) => s.day === day && s.period === period);
  };

  // Mở modal sửa tiết
  const handleOpenEdit = (day: DayOfWeek, period: number) => {
    const slot = getSlot(day, period);
    const theme = slot ? getSubjectTheme(slot.subjectCode) : getSubjectTheme('TIENG_VIET');
    setEditingSlot({
      day,
      period,
      subjectCode: slot ? slot.subjectCode : 'TIENG_VIET',
      subjectName: slot ? slot.subjectName : theme.name,
      note: slot?.note || '',
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
      editingSlot.note
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
      const theme = slot ? getSubjectTheme(slot.subjectCode) : null;
      return `  • Tiết ${p.period} (${p.time}): ${theme ? `${theme.icon} ${slot?.subjectName}` : 'Nghỉ'}${slot?.note ? ` (Dặn dò: ${slot.note})` : ''}`;
    });

    const afternoonSlots = PERIODS.filter((p) => p.session === 'AFTERNOON').map((p) => {
      const slot = getSlot(selectedDay, p.period);
      const theme = slot ? getSubjectTheme(slot.subjectCode) : null;
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

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-blue-600" />
            <span>Thời Khóa Biểu Lớp {classInfo.name}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Chương trình GDPT 2018 (Học 2 buổi/ngày: Sáng 4 tiết, Chiều 3 tiết) - GVCN: {classInfo.teacherName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyDaySchedule}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <Copy className="w-4 h-4 text-slate-600" />
            <span>Sao chép Zalo ({DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.shortName})</span>
          </button>

          <button
            onClick={handleResetToStandard}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span>Áp Dụng Mẫu Chuẩn Khối 4</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In Thời Khóa Biểu</span>
          </button>
        </div>
      </div>

      {/* Quick Day Selector & Today's Highlight */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Xem nhanh ngày:</span>
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            {DAYS_OF_WEEK.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDay === d.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Click vào bất kỳ tiết học nào trong bảng bên dưới để chỉnh sửa môn và ghi chú dặn dò.</span>
        </div>
      </div>

      {/* Main Weekly Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Title Header */}
        <div className="text-center space-y-1 pb-2 border-b border-slate-100 hidden print:block">
          <p className="text-xs font-bold text-slate-500 uppercase">{classInfo.schoolName}</p>
          <h2 className="text-xl font-black text-slate-900 uppercase">
            THỜI KHÓA BIỂU LỚP {classInfo.name} - NĂM HỌC {classInfo.schoolYear}
          </h2>
          <p className="text-xs text-slate-600">Giáo viên chủ nhiệm: {classInfo.teacherName}</p>
        </div>

        {/* Section 1: BUỔI SÁNG (Morning Session) */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 bg-amber-50/80 px-3.5 py-2 rounded-xl border border-amber-200">
            <Sun className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-xs uppercase tracking-wider">
              BUỔI SÁNG (07:45 - 10:35) • 4 TIẾT
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-36 text-center border-r border-slate-200">Tiết & Giờ học</th>
                  {DAYS_OF_WEEK.map((d) => (
                    <th
                      key={d.id}
                      className={`py-2.5 px-3 text-center border-r border-slate-200 ${
                        selectedDay === d.id ? 'bg-blue-50/80 text-blue-900' : ''
                      }`}
                    >
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERIODS.filter((p) => p.session === 'MORNING').map((period) => (
                  <tr key={period.period} className="hover:bg-slate-50/50 transition-colors">
                    {/* Period Timing */}
                    <td className="py-3 px-3 text-center border-r border-slate-200 bg-slate-50/60">
                      <p className="font-black text-slate-900">{period.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{period.time}</p>
                    </td>

                    {/* 5 Days Columns */}
                    {DAYS_OF_WEEK.map((day) => {
                      const slot = getSlot(day.id, period.period);
                      const theme = slot ? getSubjectTheme(slot.subjectCode) : null;

                      return (
                        <td
                          key={day.id}
                          className={`p-2 border-r border-slate-100 align-top ${
                            selectedDay === day.id ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleOpenEdit(day.id, period.period)}
                            className={`w-full p-2.5 rounded-xl border text-left flex flex-col justify-between hover:shadow-xs hover:scale-[1.01] transition-all min-h-[72px] ${
                              theme
                                ? `${theme.bgColor} ${theme.textColor} ${theme.borderColor}`
                                : 'bg-slate-50 text-slate-400 border-dashed border-slate-200 hover:border-slate-300'
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

        {/* Break / Lunch Box */}
        <div className="text-center py-2 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-xl border border-amber-200/80 text-amber-800 text-xs font-bold flex items-center justify-center space-x-2">
          <span>🍱 10:35 - 13:45: ĂN TRƯA BÁN TRÚ & NGHỈ TRƯA TẠI TRƯỜNG 🛌</span>
        </div>

        {/* Section 2: BUỔI CHIỀU (Afternoon Session) */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-indigo-900 bg-indigo-50/80 px-3.5 py-2 rounded-xl border border-indigo-200">
            <Sunset className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-xs uppercase tracking-wider">
              BUỔI CHIỀU (14:00 - 16:05) • 3 TIẾT
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-36 text-center border-r border-slate-200">Tiết & Giờ học</th>
                  {DAYS_OF_WEEK.map((d) => (
                    <th
                      key={d.id}
                      className={`py-2.5 px-3 text-center border-r border-slate-200 ${
                        selectedDay === d.id ? 'bg-blue-50/80 text-blue-900' : ''
                      }`}
                    >
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERIODS.filter((p) => p.session === 'AFTERNOON').map((period) => (
                  <tr key={period.period} className="hover:bg-slate-50/50 transition-colors">
                    {/* Period Timing */}
                    <td className="py-3 px-3 text-center border-r border-slate-200 bg-slate-50/60">
                      <p className="font-black text-slate-900">{period.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{period.time}</p>
                    </td>

                    {/* 5 Days Columns */}
                    {DAYS_OF_WEEK.map((day) => {
                      const slot = getSlot(day.id, period.period);
                      const theme = slot ? getSubjectTheme(slot.subjectCode) : null;

                      return (
                        <td
                          key={day.id}
                          className={`p-2 border-r border-slate-100 align-top ${
                            selectedDay === day.id ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleOpenEdit(day.id, period.period)}
                            className={`w-full p-2.5 rounded-xl border text-left flex flex-col justify-between hover:shadow-xs hover:scale-[1.01] transition-all min-h-[72px] ${
                              theme
                                ? `${theme.bgColor} ${theme.textColor} ${theme.borderColor}`
                                : 'bg-slate-50 text-slate-400 border-dashed border-slate-200 hover:border-slate-300'
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
                <label className="block font-bold text-slate-700 uppercase mb-2">
                  Chọn môn học nhanh:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
                  {SUBJECT_THEMES.map((theme) => {
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

              {/* Note / Dặn dò học sinh */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dặn dò học sinh / Đồ dùng cần mang (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mang compa và thước kẻ, Mặc đồng phục thể dục, Mang màu vẽ..."
                  value={editingSlot.note}
                  onChange={(e) => setEditingSlot({ ...editingSlot, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
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
