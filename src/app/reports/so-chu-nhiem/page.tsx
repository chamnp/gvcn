'use client';

import React from 'react';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  BookOpen,
  Award,
  Calendar,
  Users,
  Utensils,
  CheckCircle2,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  TERMS,
  PRIMARY_SUBJECTS,
  TRAIT_DEFINITIONS,
  evaluateStudentTT27,
  getAwardBadgeClass,
} from '@/lib/tt27-engine';
import { DAYS_OF_WEEK, PERIODS } from '@/lib/timetable-data';

export default function SoChuNhiemReportPage() {
  const {
    schoolInfo,
    classInfo,
    students,
    attendances,
    timetable,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    currentTerm,
    starLogs,
  } = useAppStore();

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const currentGrade = classInfo?.grade || 4;
  const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(currentGrade));
  const qualities = TRAIT_DEFINITIONS.filter((t) => t.category === 'PHAM_CHAT');
  const competencies = TRAIT_DEFINITIONS.filter((t) => t.category === 'NL_CHUNG' || t.category === 'NL_DAC_THU');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-2 sm:px-6 print:bg-white print:p-0 font-sans text-slate-900">
      {/* SCREEN CONTROLS BAR (Hidden when printing) */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-md print:hidden">
        <Link
          href="/reports"
          className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay Lại Báo Cáo</span>
        </Link>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Sổ Chủ Nhiệm (Khổ A4 / Xuất PDF)</span>
          </button>
        </div>
      </div>

      {/* SỔ CHỦ NHIỆM DOCUMENT CANVAS (A4 Format) */}
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-3xl p-8 sm:p-12 print:p-0 print:shadow-none print:rounded-none space-y-12 border border-slate-200 print:border-none">
        
        {/* =========================================================================
            SECTION 1: COVER PAGE (TRANG BÌA SỔ CHỦ NHIỆM)
           ========================================================================= */}
        <section className="text-center py-16 sm:py-24 border-4 border-double border-slate-900 p-8 sm:p-12 rounded-3xl space-y-8 flex flex-col justify-between min-h-[800px] print:min-h-[1050px]">
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-700">
              {schoolInfo.departmentName || 'PHÒNG GIÁO DỤC VÀ ĐÀO TẠO'}
            </h3>
            <h2 className="font-black text-lg sm:text-xl uppercase tracking-wider text-slate-900">
              {schoolInfo.name || 'TRƯỜNG TIỂU HỌC'}
            </h2>
            <div className="w-32 h-0.5 bg-slate-800 mx-auto mt-2" />
          </div>

          <div className="space-y-6 my-auto">
            <div className="w-24 h-24 rounded-full border-4 border-slate-900 flex items-center justify-center mx-auto text-4xl font-bold text-slate-900">
              🎒
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900">
              SỔ CHỦ NHIỆM
            </h1>
            <p className="text-base font-bold text-slate-700">
              QUẢN LÝ VÀ ĐÁNH GIÁ HỌC SINH THEO THÔNG TƯ 27/2020/TT-BGDĐT
            </p>
          </div>

          <div className="space-y-3 font-bold text-sm text-slate-800 text-left max-w-sm mx-auto border-t-2 border-slate-300 pt-6">
            <p>• Lớp: <strong className="text-base text-blue-900">{classInfo.name} (Khối {classInfo.grade})</strong></p>
            <p>• Giáo viên chủ nhiệm: <strong className="text-base">{classInfo.teacherName || 'Chưa phân công'}</strong></p>
            <p>• Năm học: <strong className="text-base">{schoolInfo.schoolYear || '2026-2027'}</strong></p>
            <p>• Sĩ số học sinh: <strong className="text-base">{students.length} em</strong></p>
          </div>
        </section>

        <div className="print:break-before-page" />

        {/* =========================================================================
            SECTION 2: DANH SÁCH TRÍCH NGANG HỌC SINH
           ========================================================================= */}
        <section className="space-y-4">
          <div className="border-b-2 border-slate-900 pb-2">
            <h3 className="font-black text-base uppercase text-slate-900">
              I. Danh Sách Trích Ngang Học Sinh Lớp {classInfo.name}
            </h3>
            <p className="text-xs text-slate-500">
              Tổng số học sinh: <strong>{students.length}</strong> (Nam: {students.filter(s => s.gender === 'Nam').length}, Nữ: {students.filter(s => s.gender === 'Nữ').length}, Bán trú: {students.filter(s => s.isBoarding).length})
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-400">
            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
              <tr>
                <th className="p-2 border border-slate-400 text-center w-8">STT</th>
                <th className="p-2 border border-slate-400 text-center w-20">Mã HS</th>
                <th className="p-2 border border-slate-400">Họ và Tên</th>
                <th className="p-2 border border-slate-400 text-center w-12">Nữ</th>
                <th className="p-2 border border-slate-400 text-center w-24">Ngày Sinh</th>
                <th className="p-2 border border-slate-400">Họ Tên Phụ Huynh</th>
                <th className="p-2 border border-slate-400 text-center w-24">SĐT Liên Hệ</th>
                <th className="p-2 border border-slate-400 text-center w-16">Bán Trú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {students.map((st, idx) => (
                <tr key={st.id} className="hover:bg-slate-50">
                  <td className="p-1.5 border border-slate-300 text-center">{idx + 1}</td>
                  <td className="p-1.5 border border-slate-300 text-center font-mono">{st.studentCode}</td>
                  <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{st.fullName}</td>
                  <td className="p-1.5 border border-slate-300 text-center font-bold">{st.gender === 'Nữ' ? 'X' : ''}</td>
                  <td className="p-1.5 border border-slate-300 text-center">{st.dateOfBirth}</td>
                  <td className="p-1.5 border border-slate-300">{st.parentName || '—'}</td>
                  <td className="p-1.5 border border-slate-300 text-center font-mono">{st.parentPhone || '—'}</td>
                  <td className="p-1.5 border border-slate-300 text-center font-bold">{st.isBoarding ? 'Ăn BT' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="print:break-before-page" />

        {/* =========================================================================
            SECTION 3: SƠ ĐỒ LỚP HỌC & THỜI KHÓA BIỂU
           ========================================================================= */}
        <section className="space-y-6">
          <div className="border-b-2 border-slate-900 pb-2">
            <h3 className="font-black text-base uppercase text-slate-900">
              II. Thời Khóa Biểu Chính Thức Lớp {classInfo.name}
            </h3>
            <p className="text-xs text-slate-500">Chương trình 2 buổi/ngày (Thứ Hai đến Thứ Sáu)</p>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-400">
            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
              <tr>
                <th className="p-2 border border-slate-400 text-center w-12">Buổi</th>
                <th className="p-2 border border-slate-400 text-center w-12">Tiết</th>
                {DAYS_OF_WEEK.map((d) => (
                  <th key={d.id} className="p-2 border border-slate-400 text-center">
                    {d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period.period}>
                  {period.period === 1 && (
                    <td rowSpan={4} className="p-2 border border-slate-400 text-center font-bold bg-slate-50 rotate-0">
                      SÁNG
                    </td>
                  )}
                  {period.period === 5 && (
                    <td rowSpan={3} className="p-2 border border-slate-400 text-center font-bold bg-slate-50 rotate-0">
                      CHIỀU
                    </td>
                  )}
                  <td className="p-1.5 border border-slate-400 text-center font-bold">
                    Tiết {period.period}
                  </td>
                  {DAYS_OF_WEEK.map((d) => {
                    const slot = timetable.find((s) => s.day === d.id && s.period === period.period);
                    return (
                      <td key={d.id} className="p-1.5 border border-slate-300 text-center font-medium">
                        {slot ? slot.subjectName : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="print:break-before-page" />

        {/* =========================================================================
            SECTION 4: TỔNG HỢP ĐÁNH GIÁ TT27 & KHEN THƯỞNG
           ========================================================================= */}
        <section className="space-y-4">
          <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
            <div>
              <h3 className="font-black text-base uppercase text-slate-900">
                III. Bảng Tổng Hợp Kết Quả Đánh Giá Giáo Dục ({termName})
              </h3>
              <p className="text-xs text-slate-500">Đánh giá theo Điều 13, 14 Thông tư 27/2020/TT-BGDĐT</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
              Kỳ: {termName}
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-400">
            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
              <tr>
                <th className="p-1.5 border border-slate-400 text-center w-8">STT</th>
                <th className="p-1.5 border border-slate-400 w-36">Họ và Tên</th>
                <th className="p-1.5 border border-slate-400 text-center w-16">Mức Học</th>
                <th className="p-1.5 border border-slate-400 text-center w-16">Mức PC-NL</th>
                <th className="p-1.5 border border-slate-400 w-40">Danh Hiệu Khen Thưởng</th>
                <th className="p-1.5 border border-slate-400">Lời Nhận Xét Tổng Kết Của GVCN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {students.map((st, idx) => {
                const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                const summary = termSummaries.find((s) => s.studentId === st.id && s.term === currentTerm);
                const evalRes = evaluateStudentTT27(sAss, tAss, currentTerm);
                const award = summary?.awardTitle || evalRes.awardTitle;
                const comment = summary?.teacherComment || 'Em hoàn thành tốt các nội dung học tập và rèn luyện trong kỳ.';

                return (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center">{idx + 1}</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{st.fullName}</td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold">
                      {evalRes.overallLearningLevel}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold">
                      {evalRes.overallTraitsLevel}
                    </td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">
                      {award}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-slate-700 leading-snug">
                      {comment}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* =========================================================================
            SECTION 5: CHỮ KÝ XÁC NHẬN & PHÊ DUYỆT BGH
           ========================================================================= */}
        <section className="pt-8 border-t-2 border-slate-300 grid grid-cols-2 text-center text-xs font-bold text-slate-800 print:break-inside-avoid">
          <div className="space-y-16">
            <p className="uppercase text-slate-600">BAN GIÁM HIỆU DUYỆT</p>
            <p className="font-bold text-slate-900">{schoolInfo.principalName || 'Hiệu Trưởng'}</p>
          </div>
          <div className="space-y-16">
            <div>
              <p className="font-normal italic text-slate-500">Ngày ...... tháng ...... năm 2026</p>
              <p className="uppercase text-slate-600 mt-1">GIÁO VIÊN CHỦ NHIỆM</p>
            </div>
            <p className="font-bold text-slate-900">{classInfo.teacherName || 'Giáo viên chủ nhiệm'}</p>
          </div>
        </section>

      </div>
    </div>
  );
}
