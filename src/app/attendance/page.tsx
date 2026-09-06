'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Utensils,
  Calendar,
  Copy,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AttendanceStatus } from '@/types';
import { getLocalDateString } from '@/lib/tt27-engine';
import { getCompletedAttendanceDates, paginate, resolveDailyBoardingMeal, summarizeAttendance } from '@/lib/attendance-utils';
import { toast } from 'sonner';

const PAGE_SIZE_STORAGE_KEY = 'gvcn_pro_attendance_page_size';
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const PAGE_SIZE_CHANGE_EVENT = 'gvcn-attendance-page-size-change';

type DailyStatusFilter = 'ALL' | 'UNRECORDED' | AttendanceStatus;
type MealFilter = 'ALL' | 'YES' | 'NO';

function getStoredPageSize() {
  const savedPageSize = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
  return PAGE_SIZE_OPTIONS.includes(savedPageSize) ? savedPageSize : 20;
}

function subscribeToPageSize(callback: () => void) {
  window.addEventListener(PAGE_SIZE_CHANGE_EVENT, callback);
  return () => window.removeEventListener(PAGE_SIZE_CHANGE_EVENT, callback);
}

function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <span>Hiển thị</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-bold text-slate-800"
          aria-label="Số dòng trên mỗi trang"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <span>dòng/trang · {firstItem}-{lastItem} / {totalItems}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Trước
        </button>
        <span className="min-w-20 text-center text-xs font-bold text-slate-700">Trang {page}/{totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const {
    students,
    attendances,
    updateAttendance,
    batchSetAttendance,
    clearAttendanceDate,
    classInfo,
    leaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
  } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getLocalDateString().slice(0, 7));
  const [viewMode, setViewMode] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [dailySearch, setDailySearch] = useState('');
  const [dailyStatusFilter, setDailyStatusFilter] = useState<DailyStatusFilter>('ALL');
  const [mealFilter, setMealFilter] = useState<MealFilter>('ALL');
  const [monthlySearch, setMonthlySearch] = useState('');
  const [dailyPage, setDailyPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const pageSize = useSyncExternalStore(subscribeToPageSize, getStoredPageSize, () => 20);

  const handlePageSizeChange = (nextPageSize: number) => {
    setDailyPage(1);
    setMonthlyPage(1);
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(nextPageSize));
    window.dispatchEvent(new Event(PAGE_SIZE_CHANGE_EVENT));
  };

  // Lọc điểm danh theo ngày đã chọn
  const dayAttendances = useMemo(() => (students || []).map((st) => {
    const record = attendances.find((a) => a.studentId === st.id && a.date === selectedDate);
    return {
      student: st,
      status: record?.status ?? 'CO_MAT',
      hasBoardingMeal: resolveDailyBoardingMeal(
        Boolean(st.isBoarding),
        record?.status ?? 'CO_MAT',
        record ? Boolean(record.hasBoardingMeal) : undefined
      ),
      reason: record?.reason || '',
      isRecorded: Boolean(record),
    };
  }), [attendances, selectedDate, students]);

  const presentCount = dayAttendances.filter((a) => a.status === 'CO_MAT').length;
  const excusedCount = dayAttendances.filter((a) => a.status === 'VANG_CO_PHEP').length;
  const unexcusedCount = dayAttendances.filter((a) => a.status === 'VANG_KHONG_PHEP').length;
  const lateCount = dayAttendances.filter((a) => a.status === 'MUON').length;
  const totalMeals = dayAttendances.filter((a) => a.hasBoardingMeal).length;
  const recordedCount = dayAttendances.filter((a) => a.isRecorded).length;

  const filteredDayAttendances = useMemo(() => {
    const query = dailySearch.trim().toLocaleLowerCase('vi');
    return dayAttendances.filter((item) => {
      const matchesSearch = !query
        || item.student.fullName.toLocaleLowerCase('vi').includes(query)
        || item.student.studentCode.toLocaleLowerCase('vi').includes(query);
      const matchesStatus = dailyStatusFilter === 'ALL'
        || (dailyStatusFilter === 'UNRECORDED' ? !item.isRecorded : item.status === dailyStatusFilter);
      const matchesMeal = mealFilter === 'ALL'
        || (mealFilter === 'YES' ? item.hasBoardingMeal : !item.hasBoardingMeal);
      return matchesSearch && matchesStatus && matchesMeal;
    });
  }, [dailySearch, dailyStatusFilter, dayAttendances, mealFilter]);
  const dailyPagination = paginate(filteredDayAttendances, dailyPage, pageSize);

  const monthlyCoverage = useMemo(() => {
    const studentIds = students.map((student) => student.id);
    const studentIdSet = new Set(studentIds);
    const monthRecords = attendances.filter(
      (record) => studentIdSet.has(record.studentId) && record.date.startsWith(`${selectedMonth}-`)
    );
    const completedDates = getCompletedAttendanceDates(monthRecords, studentIds, selectedMonth);
    const completedDateSet = new Set(completedDates);
    const partialDates = [...new Set(monthRecords.map((record) => record.date))]
      .filter((date) => !completedDateSet.has(date))
      .sort();
    return { completedDates, completedDateSet, partialDates };
  }, [attendances, selectedMonth, students]);

  const monthlyRows = useMemo(() => {
    const query = monthlySearch.trim().toLocaleLowerCase('vi');
    return students
      .filter((student) => !query
        || student.fullName.toLocaleLowerCase('vi').includes(query)
        || student.studentCode.toLocaleLowerCase('vi').includes(query))
      .map((student) => ({
        student,
        summary: summarizeAttendance(
          attendances.filter((record) => record.studentId === student.id),
          selectedMonth,
          monthlyCoverage.completedDateSet
        ),
      }));
  }, [attendances, monthlyCoverage.completedDateSet, monthlySearch, selectedMonth, students]);
  const monthlyPagination = paginate(monthlyRows, monthlyPage, pageSize);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const student = students.find((s) => s.id === studentId);
    const current = dayAttendances.find((item) => item.student.id === studentId);
    const savedDailyMeal = current?.isRecorded && (current.status === 'CO_MAT' || current.status === 'MUON')
      ? current.hasBoardingMeal
      : undefined;
    const hasMeal = resolveDailyBoardingMeal(Boolean(student?.isBoarding), status, savedDailyMeal);
    updateAttendance(studentId, selectedDate, status, hasMeal, current?.reason);
  };

  const handleMealToggle = (studentId: string, currentMeal: boolean, status: AttendanceStatus, reason: string) => {
    updateAttendance(studentId, selectedDate, status, !currentMeal, reason);
  };

  const handleReasonChange = (studentId: string, status: AttendanceStatus, hasMeal: boolean, reason: string) => {
    updateAttendance(studentId, selectedDate, status, hasMeal, reason);
  };

  const handleBatchPresent = () => {
    const unrecordedCount = students.length - recordedCount;
    if (unrecordedCount === 0) {
      toast.info('Ngày này đã được chốt đầy đủ.');
      return;
    }
    batchSetAttendance(selectedDate, 'CO_MAT');
    toast.success(`Đã chốt Có mặt cho ${unrecordedCount} học sinh chưa có dữ liệu; các trạng thái đã nhập được giữ nguyên.`);
  };

  const handleMarkDayOff = () => {
    if (recordedCount === 0) return;
    const displayDate = selectedDate.split('-').reverse().join('/');
    if (!window.confirm(`Đặt ngày ${displayDate} là ngày nghỉ và xóa ${recordedCount} bản ghi điểm danh của lớp?`)) return;
    clearAttendanceDate(selectedDate);
    toast.success(`Đã đặt ngày ${displayDate} là ngày nghỉ; ngày này sẽ không tính chuyên cần.`);
  };

  // Sao chép báo cáo bán trú gửi Zalo Nhà bếp / Ban Giám Hiệu
  const handleCopyKitchenReport = () => {
    if (recordedCount < students.length) {
      toast.error(`Còn ${students.length - recordedCount} học sinh chưa được điểm danh trong ngày này.`);
      return;
    }
    const absentList = dayAttendances
      .filter((a) => a.status === 'VANG_CO_PHEP' || a.status === 'VANG_KHONG_PHEP')
      .map((a) => `- ${a.student.fullName} (${a.status === 'VANG_CO_PHEP' ? 'Nghỉ có phép' : 'Nghỉ không phép'}${a.reason ? `: ${a.reason}` : ''})`)
      .join('\n');

    const text = `📋 [BÁO CÁO ĐIỂM DANH & BÁN TRÚ NGÀY ${selectedDate.split('-').reverse().join('/')}]
🏫 Lớp: ${classInfo.name} - GVCN: ${classInfo.teacherName}
👥 Sĩ số: ${students.length} em
✅ Có mặt: ${presentCount} em
⏰ Đi muộn: ${lateCount} em
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
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>📊 Bảng Tổng Hợp Chuyên Cần & Bán Trú Theo Tháng</span>
              </h3>
              <p className="text-xs text-slate-500">
                Chỉ tính các ngày học đã chốt đủ cả lớp; ngày nghỉ và dữ liệu mặc định chưa lưu không tính chuyên cần.
              </p>
              <p className="mt-1 text-[11px] font-bold text-emerald-700">
                Đã chốt {monthlyCoverage.completedDates.length} ngày học
                {monthlyCoverage.partialDates.length > 0 && (
                  <span className="ml-2 text-amber-700">· {monthlyCoverage.partialDates.length} ngày chưa chốt đủ</span>
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => {
                  setSelectedMonth(event.target.value);
                  setMonthlyPage(1);
                }}
                className="rounded-xl border border-slate-300 p-2 text-xs font-bold text-slate-800"
                aria-label="Tháng thống kê"
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Tìm tên hoặc mã học sinh..."
                  value={monthlySearch}
                  onChange={(event) => {
                    setMonthlySearch(event.target.value);
                    setMonthlyPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs sm:w-64"
                />
              </div>
            </div>
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
                {monthlyPagination.items.map(({ student: st, summary }, idx) => {
                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-3 text-center font-bold text-slate-400">
                          {(monthlyPagination.page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{st.fullName}</span>
                          <span className="text-[10px] text-slate-400">Mã HS: {st.studentCode}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/30">{summary.present}</td>
                        <td className="p-3 text-center font-bold text-amber-600 bg-amber-50/30">{summary.excused}</td>
                        <td className="p-3 text-center font-bold text-rose-600 bg-rose-50/30">{summary.unexcused}</td>
                        <td className="p-3 text-center font-bold text-blue-600 bg-blue-50/30">{summary.late}</td>
                        <td className="p-3 text-center font-bold text-indigo-600 bg-indigo-50/30">{summary.meals}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            summary.attendanceRate === null
                              ? 'bg-slate-100 text-slate-500'
                              : summary.attendanceRate >= 95
                                ? 'bg-emerald-100 text-emerald-800'
                                : summary.attendanceRate >= 85
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                          }`}>
                            {summary.attendanceRate === null ? '—' : `${summary.attendanceRate}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {monthlyPagination.totalItems === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">Không có học sinh phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={monthlyPagination.page}
            totalPages={monthlyPagination.totalPages}
            totalItems={monthlyPagination.totalItems}
            pageSize={pageSize}
            onPageChange={setMonthlyPage}
            onPageSizeChange={handlePageSizeChange}
          />
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
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setDailyPage(1);
                  }}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                />
              </div>

              <button
                onClick={handleBatchPresent}
                disabled={recordedCount === students.length}
                className="w-full sm:w-auto inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Chốt ngày học ({students.length - recordedCount} chưa lưu)</span>
              </button>

              <button
                type="button"
                onClick={handleMarkDayOff}
                disabled={recordedCount === 0}
                className="w-full sm:w-auto inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <XCircle className="w-4 h-4" />
                <span>Đặt là ngày nghỉ</span>
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
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
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đi Muộn</p>
                <h3 className="text-2xl font-black text-blue-600 mt-0.5">{lateCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-6 h-6" />
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
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black text-slate-800">Danh sách ngày {selectedDate.split('-').reverse().join('/')}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Đã lưu {recordedCount}/{students.length} học sinh</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={dailySearch}
                    onChange={(event) => {
                      setDailySearch(event.target.value);
                      setDailyPage(1);
                    }}
                    placeholder="Tìm tên hoặc mã HS..."
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs"
                  />
                </div>
                <select
                  value={dailyStatusFilter}
                  onChange={(event) => {
                    setDailyStatusFilter(event.target.value as DailyStatusFilter);
                    setDailyPage(1);
                  }}
                  className="rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold text-slate-700"
                  aria-label="Lọc trạng thái điểm danh"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="UNRECORDED">Chưa điểm danh</option>
                  <option value="CO_MAT">Có mặt</option>
                  <option value="VANG_CO_PHEP">Vắng có phép</option>
                  <option value="VANG_KHONG_PHEP">Vắng không phép</option>
                  <option value="MUON">Đi muộn</option>
                </select>
                <select
                  value={mealFilter}
                  onChange={(event) => {
                    setMealFilter(event.target.value as MealFilter);
                    setDailyPage(1);
                  }}
                  className="rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold text-slate-700"
                  aria-label="Lọc suất ăn bán trú"
                >
                  <option value="ALL">Tất cả bán trú</option>
                  <option value="YES">Có suất ăn</option>
                  <option value="NO">Không có suất ăn</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 w-28">Mã HS</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4 w-72 text-center">Trạng Thái Điểm Danh</th>
                    <th className="py-3 px-4 w-36 text-center">
                      <span className="block">Suất ăn hôm nay</span>
                      <span className="block text-[9px] font-medium normal-case text-slate-400">Riêng ngày đang chọn</span>
                    </th>
                    <th className="py-3 px-4">Lý do nghỉ / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyPagination.items.map((item, idx) => {
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
                          !item.isRecorded ? 'bg-slate-50/70' : item.status !== 'CO_MAT' ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-medium text-slate-400">
                          {(dailyPagination.page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-600">{item.student.studentCode}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{item.student.fullName}</span>
                            {item.student.gender === 'Nữ' && (
                              <span className="text-[10px] text-pink-500 font-bold">♀</span>
                            )}
                          </div>
                          {!item.isRecorded && (
                            <span className="mt-0.5 inline-flex rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                              Mặc định có mặt · Chưa lưu
                            </span>
                          )}
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
                            disabled={item.status === 'VANG_CO_PHEP' || item.status === 'VANG_KHONG_PHEP'}
                            onChange={() => handleMealToggle(item.student.id, item.hasBoardingMeal, item.status, item.reason)}
                            title={item.hasBoardingMeal ? 'Bỏ suất ăn riêng ngày này' : 'Thêm suất ăn riêng ngày này'}
                            aria-label={`${item.hasBoardingMeal ? 'Bỏ' : 'Thêm'} suất ăn ngày ${selectedDate} cho ${item.student.fullName}`}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          />
                        </td>

                        {/* Reason input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder={item.status !== 'CO_MAT' ? 'Nhập lý do nghỉ...' : 'Ghi chú thêm...'}
                            defaultValue={item.reason}
                            key={`${item.student.id}-${selectedDate}-${item.reason}`}
                            onBlur={(event) =>
                              event.target.value !== item.reason
                                ? handleReasonChange(
                                    item.student.id,
                                    item.status,
                                    item.hasBoardingMeal,
                                    event.target.value
                                  )
                                : undefined
                            }
                            className="w-full px-2.5 py-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-transparent"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {dailyPagination.totalItems === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không có học sinh phù hợp bộ lọc.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={dailyPagination.page}
              totalPages={dailyPagination.totalPages}
              totalItems={dailyPagination.totalItems}
              pageSize={pageSize}
              onPageChange={setDailyPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
