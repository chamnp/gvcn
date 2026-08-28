"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Users,
  GraduationCap,
  CalendarCheck,
  Utensils,
  Award,
  TrendingUp,
  Download,
  Printer,
  Copy,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { TERMS, getLocalDateString } from "@/lib/tt27-engine";
import { TermType } from "@/types";
import { toast } from "sonner";

export function SchoolIntelligenceDashboard() {
  const {
    schoolInfo,
    schoolClasses,
    allStudents,
    attendances,
    termSummaries,
    currentTerm: globalTerm,
  } = useAppStore();

  const [selectedTerm, setSelectedTerm] = useState<TermType>(globalTerm || "GIUA_HK1");
  const todayStr = getLocalDateString();

  // School-wide statistics
  const totalStudents = allStudents.length;
  const maleCount = allStudents.filter((s) => s.gender === "Nam").length;
  const femaleCount = allStudents.filter((s) => s.gender === "Nữ").length;
  const totalBoarding = allStudents.filter((s) => s.isBoarding).length;

  // Today attendance across school
  const todayAtt = attendances.filter((a) => a.date === todayStr);
  const presentCount = todayAtt.filter((a) => a.status === "CO_MAT").length;
  const absentCount = todayAtt.filter((a) => a.status !== "CO_MAT").length;
  const totalMealsToday = todayAtt.filter((a) => a.hasBoardingMeal).length;

  // Grade groupings
  const gradeGroups = useMemo(() => {
    const grades: Record<number, { classes: typeof schoolClasses; students: typeof allStudents }> = {
      1: { classes: [], students: [] },
      2: { classes: [], students: [] },
      3: { classes: [], students: [] },
      4: { classes: [], students: [] },
      5: { classes: [], students: [] },
    };

    schoolClasses.forEach((c) => {
      const g = c.grade || 1;
      if (grades[g]) {
        grades[g].classes.push(c);
      }
    });

    allStudents.forEach((s) => {
      const cls = schoolClasses.find((c) => c.id === s.classId);
      const g = cls?.grade || 1;
      if (grades[g]) {
        grades[g].students.push(s);
      }
    });

    return grades;
  }, [schoolClasses, allStudents]);

  // TT27 School-Wide Awards Distribution for selectedTerm
  const summaries = termSummaries.filter((s) => s.term === selectedTerm);
  const excellentCount = summaries.filter((s) => s.awardTitle === 'Học sinh Xuất sắc').length;
  const typicalCount = summaries.filter((s) => s.awardTitle === 'Học sinh Tiêu biểu hoàn thành tốt').length;
  const completedCount = summaries.filter((s) => s.awardTitle === 'Hoàn thành chương trình lớp học' || !s.awardTitle).length;
  const incompleteCount = summaries.filter((s) => s.awardTitle === 'Chưa hoàn thành').length;

  const handleCopyBGHReport = () => {
    const text = `🏫 [BÁO CÁO NHANH BAN GIÁM HIỆU — ${schoolInfo.name.toUpperCase()}]
📅 Ngày: ${todayStr.split("-").reverse().join("/")} — Học kỳ: ${selectedTerm}
👥 Tổng sĩ số toàn trường: ${totalStudents} học sinh (${maleCount} Nam, ${femaleCount} Nữ)
🍱 Tổng số học sinh ăn bán trú: ${totalBoarding} em
✅ Chuyên cần hôm nay: ${presentCount}/${totalStudents} có mặt (${absentCount} vắng)
🍽️ Tổng suất ăn bán trú hôm nay: ${totalMealsToday} suất
🏆 Thống kê khen thưởng ${selectedTerm}:
- Hoàn thành Xuất sắc: ${excellentCount} em (${totalStudents > 0 ? Math.round((excellentCount/totalStudents)*100) : 0}%)
- Hoàn thành Tiêu biểu: ${typicalCount} em (${totalStudents > 0 ? Math.round((typicalCount/totalStudents)*100) : 0}%)
`;
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép Báo cáo nhanh Ban Giám Hiệu gửi Phòng GD&ĐT!");
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-500/20 text-blue-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-blue-500/30">
              🏛️ Trung Tâm Báo Cáo & Điều Hành BGH
            </span>
            <span className="bg-white/10 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {schoolInfo.schoolYear || "2026-2027"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">{schoolInfo.name}</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Giám sát sĩ số, chuyên cần, bán trú và kết quả đánh giá học sinh Thông tư 27/2020/TT-BGDĐT toàn trường theo thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleCopyBGHReport}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Sao chép Báo cáo Phòng GD</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME SCHOOL KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Sĩ Số Toàn Trường</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalStudents} <span className="text-sm font-bold text-slate-400">em</span></div>
          <p className="text-[11px] text-slate-500">{schoolClasses.length} lớp học (Khối 1 ➔ 5)</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Bán Trú Toàn Trường</span>
            <Utensils className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalBoarding} <span className="text-sm font-bold text-slate-400">em</span></div>
          <p className="text-[11px] text-emerald-600 font-bold">
            {totalStudents > 0 ? Math.round((totalBoarding / totalStudents) * 100) : 0}% học sinh ăn bán trú
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Chuyên Cần Hôm Nay</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {presentCount > 0 ? presentCount : totalStudents} <span className="text-sm font-bold text-slate-400">có mặt</span>
          </div>
          <p className="text-[11px] text-slate-500">{absentCount} em vắng ({todayStr})</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>HS Xuất Sắc TT27</span>
            <Award className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-yellow-700">
            {excellentCount} <span className="text-sm font-bold text-slate-400">em</span>
          </div>
          <p className="text-[11px] text-slate-500">Đợt đánh giá: {selectedTerm}</p>
        </div>
      </div>

      {/* 3. GRADE-BY-GRADE BREAKDOWN TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>Bảng Thống Kê Chi Tiết 5 Khối Lớp</span>
            </h3>
            <p className="text-xs text-slate-500">
              Phân bổ số lớp, sĩ số, số suất ăn bán trú theo từng khối học.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Khối Học</th>
                <th className="py-3 px-4 text-center">Số Lớp</th>
                <th className="py-3 px-4 text-center">Tổng Sĩ Số</th>
                <th className="py-3 px-4 text-center">Nam / Nữ</th>
                <th className="py-3 px-4 text-center">Ăn Bán Trú</th>
                <th className="py-3 px-4">Danh Sách Lớp & GVCN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[1, 2, 3, 4, 5].map((g) => {
                const grp = gradeGroups[g];
                const gMale = grp.students.filter((s) => s.gender === "Nam").length;
                const gFemale = grp.students.filter((s) => s.gender === "Nữ").length;
                const gBoarding = grp.students.filter((s) => s.isBoarding).length;

                return (
                  <tr key={g} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-sm text-slate-900">
                      Khối {g}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-600">
                      {grp.classes.length} lớp
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {grp.students.length} em
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-mono">
                      {gMale} / {gFemale}
                    </td>
                    <td className="py-3.5 px-4 text-center text-orange-600 font-bold">
                      {gBoarding} em ({grp.students.length > 0 ? Math.round((gBoarding / grp.students.length) * 100) : 0}%)
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex flex-wrap gap-1.5">
                        {grp.classes.map((c) => (
                          <span
                            key={c.id}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            title={`GVCN: ${c.teacherName || "Chưa phân công"}`}
                          >
                            Lớp {c.name} ({c.teacherName?.split(" ").pop() || "Cô"})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
