'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Utensils,
  Calendar,
  Copy,
  Send,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AttendanceStatus } from '@/types';
import { getLocalDateString } from '@/lib/tt27-engine';
import { toast } from 'sonner';

export default function AttendancePage() {
  const { students, attendances, updateAttendance, batchSetAttendance, classInfo } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());

  // Lọc điểm danh theo ngày đã chọn
  const dayAttendances = students.map((st) => {
    const record = attendances.find((a) => a.studentId === st.id && a.date === selectedDate);
    return {
      student: st,
      status: record?.status || 'CO_MAT',
      hasBoardingMeal: record !== undefined ? record.hasBoardingMeal : st.isBoarding,
      reason: record?.reason || '',
    };
  });

  const presentCount = dayAttendances.filter((a) => a.status === 'CO_MAT').length;
  const excusedCount = dayAttendances.filter((a) => a.status === 'VANG_CO_PHEP').length;
  const unexcusedCount = dayAttendances.filter((a) => a.status === 'VANG_KHONG_PHEP').length;
  const lateCount = dayAttendances.filter((a) => a.status === 'MUON').length;
  const totalMeals = dayAttendances.filter((a) => a.hasBoardingMeal).length;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const student = students.find((s) => s.id === studentId);
    const hasMeal = student ? student.isBoarding && status === 'CO_MAT' : false;
    updateAttendance(studentId, selectedDate, status, hasMeal);
  };

  const handleMealToggle = (studentId: string, currentMeal: boolean, status: AttendanceStatus) => {
    updateAttendance(studentId, selectedDate, status, !currentMeal);
  };

  const handleReasonChange = (studentId: string, status: AttendanceStatus, hasMeal: boolean, reason: string) => {
    updateAttendance(studentId, selectedDate, status, hasMeal, reason);
  };

  const handleBatchPresent = () => {
    batchSetAttendance(selectedDate, 'CO_MAT');
    toast.success('Đã điểm danh tất cả học sinh CÓ MẶT!');
  };

  // Sao chép báo cáo bán trú gửi Zalo Nhà bếp / Ban Giám Hiệu
  const handleCopyKitchenReport = () => {
    const absentList = dayAttendances
      .filter((a) => a.status !== 'CO_MAT')
      .map((a) => `- ${a.student.fullName} (${a.status === 'VANG_CO_PHEP' ? 'Nghỉ có phép' : 'Nghỉ không phép'}${a.reason ? `: ${a.reason}` : ''})`)
      .join('\n');

    const text = `📋 [BÁO CÁO ĐIỂM DANH & BÁN TRÚ NGÀY ${selectedDate.split('-').reverse().join('/')}]
🏫 Lớp: ${classInfo.name} - GVCN: ${classInfo.teacherName}
👥 Sĩ số: ${students.length} em
✅ Có mặt: ${presentCount} em
❌ Vắng: ${excusedCount + unexcusedCount} em
🍱 TỔNG SUẤT ĂN BÁN TRÚ HÔM NAY: ${totalMeals} suất
${absentList ? `\nDanh sách học sinh vắng:\n${absentList}` : '\n(Cả lớp đi học đầy đủ)'}
`;

    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép nội dung báo cáo! Bạn có thể dán vào Zalo gửi nhà bếp.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-blue-600" />
            <span>Điểm Danh & Kiểm Diện Bán Trú</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý chuyên cần hàng ngày và chốt số lượng suất ăn gửi nhà bếp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center space-x-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            />
          </div>

          <button
            onClick={handleBatchPresent}
            className="w-full sm:w-auto inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Có mặt tất cả</span>
          </button>

          <button
            onClick={handleCopyKitchenReport}
            className="w-full sm:w-auto inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Sao chép báo cáo Bếp</span>
          </button>
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Có Mặt</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{presentCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vắng Có Phép</p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">{excusedCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vắng K.Phép</p>
            <h3 className="text-2xl font-black text-rose-600 mt-0.5">{unexcusedCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suất Bán Trú</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-0.5">{totalMeals}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-28">Mã HS</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4 w-72 text-center">Trạng Thái Điểm Danh</th>
                <th className="py-3 px-4 w-32 text-center">Ăn Bán Trú</th>
                <th className="py-3 px-4">Lý do nghỉ / Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dayAttendances.map((item, idx) => (
                <tr key={item.student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">{item.student.studentCode}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.student.fullName}</td>
                  
                  {/* Status Toggle Buttons */}
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 space-x-1">
                      <button
                        onClick={() => handleStatusChange(item.student.id, 'CO_MAT')}
                        className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors ${
                          item.status === 'CO_MAT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Có mặt
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.student.id, 'VANG_CO_PHEP')}
                        className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors ${
                          item.status === 'VANG_CO_PHEP'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Có phép
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.student.id, 'MUON')}
                        className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors ${
                          item.status === 'MUON'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Đi muộn
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.student.id, 'VANG_KHONG_PHEP')}
                        className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors ${
                          item.status === 'VANG_KHONG_PHEP'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        K.Phép
                      </button>
                    </div>
                  </td>

                  {/* Boarding Meal Checkbox */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleMealToggle(item.student.id, item.hasBoardingMeal, item.status)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-bold text-[11px] border transition-colors ${
                        item.hasBoardingMeal
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Utensils className="w-3 h-3" />
                      <span>{item.hasBoardingMeal ? 'Ăn cơm' : 'Nghỉ ăn'}</span>
                    </button>
                  </td>

                  {/* Reason input */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder={item.status !== 'CO_MAT' ? 'Nhập lý do nghỉ...' : 'Ghi chú thêm...'}
                      value={item.reason}
                      onChange={(e) =>
                        handleReasonChange(item.student.id, item.status, item.hasBoardingMeal, e.target.value)
                      }
                      className="w-full px-2.5 py-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-transparent"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
