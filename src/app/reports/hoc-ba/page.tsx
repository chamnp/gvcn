"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  GraduationCap,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  School,
  FileText,
  Copy,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { TERMS, PRIMARY_SUBJECTS, TRAIT_DEFINITIONS } from "@/lib/tt27-engine";
import { TermType, Student } from "@/types";
import { toast } from "sonner";

export default function HocBaTT27ExportPage() {
  const {
    students,
    classInfo,
    schoolInfo,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
  } = useAppStore();

  const [selectedTerm, setSelectedTerm] = useState<TermType>(currentTerm || "CUOI_NAM");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("ALL"); // "ALL" or specific student id

  const termObj = TERMS.find((t) => t.id === selectedTerm);
  const termName = termObj?.name || selectedTerm;

  const targetStudents = selectedStudentId === "ALL"
    ? students
    : students.filter((s) => s.id === selectedStudentId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans print:bg-white print:p-0">
      {/* 1. TOP CONTROL BAR (HIDDEN IN PRINT) */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link
              href="/reports"
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Báo Cáo</span>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
                Phiếu Đánh Giá Định Kỳ & Học Bạ Mẫu 1 (Thông Tư 27)
              </h1>
              <p className="text-[11px] text-slate-500 truncate">
                Lớp {classInfo.name} — Chuẩn định dạng in A4 / A3 hai mặt của Bộ GD&ĐT
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Term selector */}
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value as TermType)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
            >
              {TERMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Student selector */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
            >
              <option value="ALL">✨ In toàn bộ cả lớp ({students.length} HS)</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.studentCode})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Học Bạ (Ctrl + P)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PRINTABLE SHEETS CONTAINER */}
      <div className="max-w-4xl mx-auto py-6 px-3 sm:px-6 print:max-w-none print:p-0 space-y-8 print:space-y-0">
        {targetStudents.map((student, studentIndex) => {
          const studentSubjects = subjectAssessments.filter(
            (a) => a.studentId === student.id && a.term === selectedTerm
          );
          const studentTraits = traitAssessments.filter(
            (t) => t.studentId === student.id && t.term === selectedTerm
          );
          const summary = termSummaries.find(
            (s) => s.studentId === student.id && s.term === selectedTerm
          );

          return (
            <div
              key={student.id}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-md print:shadow-none print:border-none print:rounded-none print:p-0 space-y-6 text-slate-900 font-serif page-break"
              style={{ pageBreakAfter: "always" }}
            >
              {/* HEADER QUỐC GIA & BỘ GD */}
              <div className="text-center space-y-1">
                <div className="flex justify-between items-start text-xs uppercase font-sans font-bold">
                  <div className="text-left space-y-0.5">
                    <p>{schoolInfo.departmentName?.toUpperCase() || "PHÒNG GD&ĐT QUẬN NAM TỪ LIÊM"}</p>
                    <p className="font-black text-blue-900">{schoolInfo.name.toUpperCase()}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="italic font-normal">Độc lập - Tự do - Hạnh phúc</p>
                  </div>
                </div>

                <div className="pt-4 pb-2">
                  <h2 className="text-base sm:text-lg font-black font-sans uppercase tracking-tight text-slate-900">
                    PHIẾU ĐÁNH GIÁ KẾT QUẢ HỌC TẬP VÀ RÈN LUYỆN
                  </h2>
                  <p className="text-xs font-sans font-bold text-slate-700">
                    (Theo Thông tư số 27/2020/TT-BGDĐT ngày 04/9/2020 của Bộ GD&ĐT)
                  </p>
                  <p className="text-xs font-sans italic text-slate-600 mt-0.5">
                    Học kỳ: <strong>{termName}</strong> — Năm học: <strong>{schoolInfo.schoolYear || "2026-2027"}</strong>
                  </p>
                </div>
              </div>

              {/* THÔNG TIN HỌC SINH */}
              <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 text-xs font-sans grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-slate-500">Họ và tên:</span>{" "}
                  <strong className="text-slate-900 uppercase font-black">{student.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Mã định danh:</span>{" "}
                  <strong className="font-mono">{student.studentCode}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Ngày sinh:</span>{" "}
                  <strong>{student.dateOfBirth}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Giới tính:</span>{" "}
                  <strong>{student.gender}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Lớp:</span>{" "}
                  <strong className="text-blue-900 font-bold">{classInfo.name}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Giáo viên chủ nhiệm:</span>{" "}
                  <strong>{classInfo.teacherName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Bán trú:</span>{" "}
                  <strong>{student.isBoarding ? "Có" : "Không"}</strong>
                </div>
              </div>

              {/* BẢNG 1: MÔN HỌC & HOẠT ĐỘNG GIÁO DỤC */}
              <div className="space-y-1.5 font-sans">
                <h3 className="font-black text-xs uppercase text-slate-800">
                  I. Đánh giá kết quả học tập các môn học và hoạt động giáo dục
                </h3>
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold text-center border-b border-slate-300">
                    <tr>
                      <th className="border border-slate-300 p-2 w-10">STT</th>
                      <th className="border border-slate-300 p-2 text-left">Môn học / Hoạt động giáo dục</th>
                      <th className="border border-slate-300 p-2 w-20">Mức ĐG</th>
                      <th className="border border-slate-300 p-2 w-16">Điểm KT</th>
                      <th className="border border-slate-300 p-2 text-left">Nhận xét về sự tiến bộ và mặt cần cố gắng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRIMARY_SUBJECTS.map((sub, idx) => {
                      const ass = studentSubjects.find((a) => a.subjectCode === sub.code);
                      return (
                        <tr key={sub.code} className="hover:bg-slate-50/50">
                          <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5 font-bold">{sub.name}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">
                            {ass?.level ? (
                              <span>{ass.level === "T" ? "T" : ass.level === "H" ? "H" : "C"}</span>
                            ) : "—"}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                            {sub.hasPeriodicTest && ass?.score !== undefined && ass.score !== null ? ass.score : "—"}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-[11px] text-slate-700 italic">
                            {ass?.comment || "Hoàn thành tốt nội dung yêu cầu môn học."}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-[10px] italic text-slate-500">
                  * Ghi chú mức đánh giá môn học: <strong>T</strong> (Hoàn thành tốt), <strong>H</strong> (Hoàn thành), <strong>C</strong> (Chưa hoàn thành).
                </p>
              </div>

              {/* BẢNG 2: PHẨM CHẤT & NĂNG LỰC */}
              <div className="space-y-1.5 font-sans">
                <h3 className="font-black text-xs uppercase text-slate-800">
                  II. Đánh giá sự hình thành và phát triển các phẩm chất & năng lực cốt lõi
                </h3>
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold text-center border-b border-slate-300">
                    <tr>
                      <th className="border border-slate-300 p-2 w-10">STT</th>
                      <th className="border border-slate-300 p-2 text-left">Phẩm chất / Năng lực cốt lõi</th>
                      <th className="border border-slate-300 p-2 w-20">Mức ĐG</th>
                      <th className="border border-slate-300 p-2 text-left">Nhận xét biểu hiện cụ thể</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TRAIT_DEFINITIONS.map((trait, idx) => {
                      const ass = studentTraits.find((t) => t.traitCode === trait.code);
                      return (
                        <tr key={trait.code} className="hover:bg-slate-50/50">
                          <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5 font-bold">{trait.name}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">
                            {ass?.level ? <span>{ass.level === "T" ? "T" : ass.level === "Đ" ? "Đ" : "C"}</span> : "Đ"}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-[11px] text-slate-700 italic">
                            {ass?.comment || `Có ý thức rèn luyện tốt phẩm chất ${trait.name.toLowerCase()}.`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-[10px] italic text-slate-500">
                  * Ghi chú mức đánh giá: <strong>T</strong> (Tốt), <strong>Đ</strong> (Đạt), <strong>C</strong> (Cần cố gắng).
                </p>
              </div>

              {/* BẢNG 3: ĐÁNH GIÁ TỔNG HỢP & KHEN THƯỞNG */}
              <div className="space-y-3 font-sans border border-slate-300 rounded-xl p-4 bg-slate-50/30">
                <h3 className="font-black text-xs uppercase text-slate-800">
                  III. Đánh giá tổng hợp cuối kỳ & Khen thưởng
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-600">Đánh giá kết quả học tập chung:</span>{" "}
                    <strong className="text-blue-900">{summary?.overallLearningLevel === "T" ? "Hoàn thành tốt (T)" : summary?.overallLearningLevel === "H" ? "Hoàn thành (H)" : "Hoàn thành tốt"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600">Đánh giá phẩm chất & năng lực chung:</span>{" "}
                    <strong className="text-blue-900">{summary?.overallTraitsLevel === "T" ? "Tốt (T)" : "Đạt (Đ)"}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-600">Danh hiệu khen thưởng (Điều 13 TT27):</span>{" "}
                    <strong className="text-amber-800 font-black">{summary?.awardTitle || "Hoàn thành chương trình lớp học"}</strong>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-slate-600 font-bold">Lời nhận xét tổng hợp của Giáo viên chủ nhiệm:</span>
                    <p className="p-3 bg-white border border-slate-200 rounded-lg italic text-slate-800 leading-relaxed">
                      "{summary?.teacherComment || `Em ${student.fullName} chăm ngoan, có ý thức học tập và rèn luyện tốt, hòa đồng với bạn bè.`}"
                    </p>
                  </div>
                </div>
              </div>

              {/* CHỮ KÝ GVCN & HIỆU TRƯỞNG */}
              <div className="pt-6 font-sans text-xs flex justify-between items-start text-center">
                <div className="space-y-1 w-48">
                  <p className="font-bold uppercase">Ý KIẾN BAN GIÁM HIỆU</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-900">{schoolInfo.principalName || "Hiệu trưởng"}</p>
                </div>

                <div className="space-y-1 w-56">
                  <p className="italic text-slate-500">Hà Nội, ngày ..... tháng ..... năm 2026</p>
                  <p className="font-bold uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-900">{classInfo.teacherName}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
