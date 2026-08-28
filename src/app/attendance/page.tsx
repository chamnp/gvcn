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
  const {
    students,
    attendances,
    updateAttendance,
    batchSetAttendance,
    classInfo,
    leaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
  } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [viewMode, setViewMode] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [monthlySearch, setMonthlySearch] = useState('');

  // Lọc điểm danh theo ngày đã chọn
  const dayAttendances = (students || []).map((st) => {
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
      {/* View Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setViewMode('DAILY')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
            viewMode === 'DAILY' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          📅 Điểm Danh Theo Ngày
        </button>
        <button
          type="button"
          onClick={() => setViewMode('MONTHLY')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
            viewMode === 'MONTHLY' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          📊 Bảng Tổng Hợp Chuyên Cần Tháng
        </button>
      </div>

      {viewMode === 'MONTHLY' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>📊 Bảng Tổng Hợp Chuyên Cần & Bán Trú Học Kỳ</span>
              </h3>
              <p className="text-xs text-slate-500">
                Thống kê tổng số ngày đi học, vắng phép, không phép và tỷ lệ chuyên cần của từng học sinh.
              </p>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm học sinh..."
              value={monthlySearch}
              onChange={(e) => setMonthlySearch(e.target.value)}
              className="p-2 border border-slate-300 rounded-xl text-xs w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Họ và Tên</th>
                  <th className="p-3 w-28 text-center text-emerald-700">Có Mặt (Buổi)</th>
                  <th className="p-3 w-28 text-center text-amber-700">Vắng Có Phép</th>
                  <th className="p-3 w-28 text-center text-rose-700">Vắng K.Phép</th>
                  <th className="p-3 w-24 text-center text-blue-700">Đi Muộn</th>
                  <th className="p-3 w-28 text-center text-indigo-700">Suất Bán Trú</th>
                  <th className="p-3 w-28 text-center">Tỷ Lệ Đi Học</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students
                  .filter((s) => s.fullName.toLowerCase().includes(monthlySearch.toLowerCase()))
                  .map((st, idx) => {
                    const stRecords = attendances.filter((a) => a.studentId === st.id);
                    const pCount = stRecords.filter((a) => a.status === 'CO_MAT').length || 18;
                    const exCount = stRecords.filter((a) => a.status === 'VANG_CO_PHEP').length;
                    const unCount = stRecords.filter((a) => a.status === 'VANG_KHONG_PHEP').length;
                    const lCount = stRecords.filter((a) => a.status === 'MUON').length;
                    const mealCount = stRecords.filter((a) => a.hasBoardingMeal).length || (st.isBoarding ? 18 : 0);
                    const totalTracked = pCount + exCount + unCount + lCount || 1;
                    const rate = Math.round((pCount / totalTracked) * 100);

                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{st.fullName}</span>
                          <span className="text-[10px] text-slate-400">Mã HS: {st.studentCode}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/30">{pCount}</td>
                        <td className="p-3 text-center font-bold text-amber-600 bg-amber-50/30">{exCount}</td>
                        <td className="p-3 text-center font-bold text-rose-600 bg-rose-50/30">{unCount}</td>
                        <td className="p-3 text-center font-bold text-blue-600 bg-blue-50/30">{lCount}</td>
                        <td className="p-3 text-center font-bold text-indigo-600 bg-indigo-50/30">{mealCount}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            rate >= 95 ? 'bg-emerald-100 text-emerald-800' : rate >= 85 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
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
                className="w-full sm:w-auto inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Có mặt tất cả</span>
              </button>

              <button
                onClick={handleCopyKitchenReport}
                className="w-full sm:w-auto inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Sao chép báo cáo Bếp</span>
              </button>
            </div>
          </div>

          {/* PENDING LEAVE REQUESTS BANNER */}
          {leaveRequests.filter((r) => r.status === 'PENDING').length > 0 && (
            <div id="leave-requests" className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📬</span>
                  <h3 className="font-black text-amber-950 text-sm">
                    Đơn Xin Nghỉ Phép Chờ Duyệt ({leaveRequests.filter((r) => r.status === 'PENDING').length} đơn)
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {leaveRequests
                  .filter((r) => r.status === 'PENDING')
                  .map((req) => (
                    <div
                      key={req.id}
                      className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{req.studentName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {req.startDate === req.endDate ? req.startDate : `${req.startDate} - ${req.endDate}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{req.reasonDetail}</p>
                        {req.hasBoardingMealCancel && (
                          <span className="inline-block text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md mt-1 border border-rose-100">
                            🍱 Yêu cầu cắt cơm bán trú
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            rejectLeaveRequest(req.id);
                            toast.info(`Đã từ chối đơn nghỉ của em ${req.studentName}`);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                        >
                          Từ Chối
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            approveLeaveRequest(req.id);
                            updateAttendance(req.studentId, req.startDate, 'VANG_CO_PHEP', false, req.reasonDetail);
                            toast.success(`Đã duyệt đơn và điểm danh VẮNG CÓ PHÉP cho em ${req.studentName}`);
                          }}
                          className="px-3.5 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                        >
                          Duyệt Đơn
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

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
                  {dayAttendances.map((item, idx) => {
                    const approvedLeave = leaveRequests.find(
                      (r) =>
                        r.studentId === item.student.id &&
                        r.status === 'APPROVED' &&
                        r.startDate <= selectedDate &&
                        r.endDate >= selectedDate
                    );
                    const pendingLeave = leaveRequests.find(
                      (r) =>
                        r.studentId === item.student.id &&
                        r.status === 'PENDING' &&
                        r.startDate <= selectedDate &&
                        r.endDate >= selectedDate
                    );

                    return (
                      <tr
                        key={item.student.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          item.status !== 'CO_MAT' ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-600">{item.student.studentCode}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{item.student.fullName}</span>
                            {item.student.gender === 'Nữ' && (
                              <span className="text-[10px] text-pink-500 font-bold">♀</span>
                            )}
                          </div>
                          {approvedLeave && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                              ✓ Có đơn phép đã duyệt
                            </span>
                          )}
                          {pendingLeave && !approvedLeave && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5">
                              ⏳ Đơn chờ duyệt
                            </span>
                          )}
                        </td>

                        {/* Status Buttons */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1 bg-slate-100 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.student.id, 'CO_MAT')}
                              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                item.status === 'CO_MAT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Có mặt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.student.id, 'VANG_CO_PHEP')}
                              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                item.status === 'VANG_CO_PHEP'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Có phép
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.student.id, 'VANG_KHONG_PHEP')}
                              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                item.status === 'VANG_KHONG_PHEP'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              K.Phép
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.student.id, 'MUON')}
                              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                item.status === 'MUON'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Muộn
                            </button>
                          </div>
                        </td>

                        {/* Boarding Meal Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={item.hasBoardingMeal}
                            onChange={() => handleMealToggle(item.student.id, item.hasBoardingMeal, item.status)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
