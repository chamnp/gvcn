'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Utensils,
  Wallet,
  CalendarCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { TERMS, evaluateStudentTT27, getAwardBadgeClass } from '@/lib/tt27-engine';
import { DAYS_OF_WEEK, PERIODS, getSubjectTheme } from '@/lib/timetable-data';
import { DayOfWeek } from '@/types';

export default function DashboardPage() {
  const {
    classInfo,
    students,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    attendances,
    starLogs,
    fundTransactions,
    timetable,
  } = useAppStore();

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;

  // Thống kê học sinh
  const totalStudents = students.length;
  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;
  const boardingCount = students.filter((s) => s.isBoarding).length;

  // Điểm danh hôm nay
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAtt = attendances.filter((a) => a.date === todayStr);
  const presentCount = todayAtt.filter((a) => a.status === 'CO_MAT').length || totalStudents - 1;
  const absentCount = todayAtt.filter((a) => a.status !== 'CO_MAT').length || 1;
  const todayMeals = todayAtt.filter((a) => a.hasBoardingMeal).length || boardingCount - 1;

  // Phân loại kết quả học sinh kỳ này
  let xuatSacCount = 0;
  let tieuBieuCount = 0;
  let hoanThanhCount = 0;
  let canCoGangCount = 0;

  students.forEach((st) => {
    const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
    const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
    const summary = termSummaries.find((ts) => ts.studentId === st.id && ts.term === currentTerm);
    const award = summary?.awardTitle || evaluateStudentTT27(sAss, tAss, currentTerm).awardTitle;

    if (award === 'Học sinh Xuất sắc') xuatSacCount++;
    else if (award === 'Học sinh Tiêu biểu hoàn thành tốt') tieuBieuCount++;
    else if (award === 'Hoàn thành chương trình lớp học') hoanThanhCount++;
    else canCoGangCount++;
  });

  // Số dư quỹ lớp
  const totalIncome = fundTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = fundTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const fundBalance = totalIncome - totalExpense;

  // Top 5 sao nề nếp
  const studentStarMap: { [id: string]: number } = {};
  starLogs.forEach((log) => {
    studentStarMap[log.studentId] = (studentStarMap[log.studentId] || 0) + log.points;
  });

  const topStudents = [...students]
    .map((s) => ({ ...s, stars: studentStarMap[s.id] || 0 }))
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Award className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
            <span>📚 Kỳ làm việc:</span>
            <span className="text-yellow-300 font-bold">{termName}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">
            Xin chào {classInfo.teacherName}! Chúc cô một ngày dạy học hiệu quả 🌟
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed mb-4">
            Hệ thống đang quản lý lớp <strong>{classInfo.name}</strong> ({classInfo.schoolName}). Các dữ liệu đánh giá Môn học, Năng lực, Phẩm chất theo chuẩn <strong>Thông tư 27/2020/TT-BGDĐT</strong> đã sẵn sàng để xuất báo cáo hoặc đồng bộ.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/assessment"
              className="inline-flex items-center space-x-1.5 bg-white text-blue-800 font-bold text-xs px-4 py-2 rounded-xl shadow hover:bg-blue-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Vào Bảng Đánh Giá TT27</span>
            </Link>
            <Link
              href="/ai-assistant"
              className="inline-flex items-center space-x-1.5 bg-indigo-500/40 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-white/30 backdrop-blur-sm hover:bg-indigo-500/60 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Sinh Nhận Xét Tự Động</span>
            </Link>
            <Link
              href="/attendance"
              className="inline-flex items-center space-x-1.5 bg-indigo-500/40 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-white/30 backdrop-blur-sm hover:bg-indigo-500/60 transition-colors"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-300" />
              <span>Điểm Danh & Bán Trú</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metric Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sĩ số */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Sĩ số Lớp Học</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalStudents} <span className="text-sm font-normal text-slate-500">em</span></h3>
            <p className="text-xs text-slate-500 mt-1">
              Nam: <span className="font-semibold text-blue-600">{maleCount}</span> | Nữ: <span className="font-semibold text-pink-600">{femaleCount}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Chuyên cần & Bán trú hôm nay */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Chuyên Cần Hôm Nay</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {presentCount}/{totalStudents}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-amber-500" />
              <span>Ăn bán trú: <strong>{todayMeals}</strong> suất</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Xếp loại Xuất sắc & Tiêu biểu */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Khen Thưởng {termName}</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-2xl font-black text-amber-600">{xuatSacCount}</h3>
              <span className="text-xs text-slate-500">Xuất sắc</span>
              <span className="text-slate-300">|</span>
              <span className="text-base font-bold text-indigo-600">{tieuBieuCount}</span>
              <span className="text-xs text-slate-500">Tiêu biểu</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Đạt {Math.round(((xuatSacCount + tieuBieuCount) / (totalStudents || 1)) * 100)}% toàn lớp
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Quỹ Lớp */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Số Dư Quỹ Lớp</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {fundBalance.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Đã thu: {totalIncome.toLocaleString('vi-VN')} đ
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Assessment Overview & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: TT27 Assessment Summary Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>Bảng Tổng Hợp Đánh Giá ({termName})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cập nhật tự động theo tiêu chuẩn Thông tư 27/2020/TT-BGDĐT
              </p>
            </div>
            <Link
              href="/assessment"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Progress Bar of Results */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${(xuatSacCount / (totalStudents || 1)) * 100}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Xuất sắc: ${xuatSacCount}`}
              />
              <div
                style={{ width: `${(tieuBieuCount / (totalStudents || 1)) * 100}%` }}
                className="bg-indigo-500 transition-all duration-500"
                title={`Tiêu biểu: ${tieuBieuCount}`}
              />
              <div
                style={{ width: `${(hoanThanhCount / (totalStudents || 1)) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Hoàn thành: ${hoanThanhCount}`}
              />
              <div
                style={{ width: `${(canCoGangCount / (totalStudents || 1)) * 100}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Cần cố gắng: ${canCoGangCount}`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-400 shrink-0" />
                <span className="text-slate-600">Xuất sắc: <strong>{xuatSacCount}</strong> ({Math.round((xuatSacCount / (totalStudents || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500 shrink-0" />
                <span className="text-slate-600">Tiêu biểu: <strong>{tieuBieuCount}</strong> ({Math.round((tieuBieuCount / (totalStudents || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                <span className="text-slate-600">Hoàn thành: <strong>{hoanThanhCount}</strong> ({Math.round((hoanThanhCount / (totalStudents || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500 shrink-0" />
                <span className="text-slate-600">Cần cố gắng: <strong>{canCoGangCount}</strong> ({Math.round((canCoGangCount / (totalStudents || 1)) * 100)}%)</span>
              </div>
            </div>
          </div>

          {/* Quick List Preview */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Họ và Tên</th>
                  <th className="py-2.5 px-3">Môn học</th>
                  <th className="py-2.5 px-3">Phẩm chất / NL</th>
                  <th className="py-2.5 px-3">Danh hiệu</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.slice(0, 5).map((st, idx) => {
                  const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                  const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                  const summary = termSummaries.find((ts) => ts.studentId === st.id && ts.term === currentTerm);
                  const evalRes = evaluateStudentTT27(sAss, tAss, currentTerm);
                  const award = summary?.awardTitle || evalRes.awardTitle;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{st.fullName}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {evalRes.overallLearningLevel === 'T' ? 'Tất cả Tốt (T)' : 'Hoàn thành (H)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {evalRes.overallTraitsLevel === 'T' ? 'Tốt (T)' : 'Đạt (Đ)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] border ${getAwardBadgeClass(award)}`}>
                          {award}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/assessment`}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Chấm điểm
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Top Star Leaderboard & Quick Action Card */}
        <div className="space-y-6">
          {/* Top Star Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Bảng Sao Nề Nếp</span>
              </h2>
              <Link href="/behavior" className="text-xs text-blue-600 font-semibold">
                Tặng sao
              </Link>
            </div>

            <div className="space-y-2.5">
              {topStudents.map((st, i) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        i === 0
                          ? 'bg-amber-400 text-white shadow-xs'
                          : i === 1
                          ? 'bg-slate-300 text-slate-700'
                          : i === 2
                          ? 'bg-amber-700/60 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{st.fullName}</p>
                      <p className="text-[10px] text-slate-500">{st.tags?.[0] || 'Học sinh'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-300">
                    <span>⭐</span>
                    <span>{st.stars} sao</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Timetable Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Lịch Học Hôm Nay ({DAYS_OF_WEEK.find((d) => d.id === (new Date().getDay() >= 1 && new Date().getDay() <= 5 ? `T${new Date().getDay() + 1}` : 'T2'))?.name})</span>
              </h2>
              <Link href="/timetable" className="text-xs text-blue-600 font-semibold hover:underline">
                Xem cả tuần →
              </Link>
            </div>

            <div className="space-y-1.5 text-xs">
              {PERIODS.slice(0, 5).map((p) => {
                const dayKey: DayOfWeek = (new Date().getDay() >= 1 && new Date().getDay() <= 5 ? `T${new Date().getDay() + 1}` : 'T2') as DayOfWeek;
                const slot = timetable.find((s) => s.day === dayKey && s.period === p.period);
                const theme = slot ? getSubjectTheme(slot.subjectCode) : null;

                return (
                  <div
                    key={p.period}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                      theme ? `${theme.bgColor} ${theme.borderColor}` : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-500 font-mono text-[10px] w-10">
                        {p.name}
                      </span>
                      <span className="text-sm">{theme?.icon || '📚'}</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {slot?.subjectName || 'Tự học / Nghỉ'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{p.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-purple-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Trợ Lý Sư Phạm AI</span>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              Bạn có thể tạo tự động hơn 30+ lời nhận xét học bạ độc bản chỉ trong 1 lần bấm, chuẩn theo Thông tư 27.
            </p>
            <Link
              href="/ai-assistant"
              className="block text-center bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-colors"
            >
              Mở Trình Tạo Nhận Xét AI
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
