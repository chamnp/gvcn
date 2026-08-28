"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  Award,
  Users,
  Sparkles,
  CheckCircle2,
  Calendar,
  School,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { TERMS } from "@/lib/tt27-engine";
import { TermType, Student } from "@/types";

type AwardFilterType = "ALL_AWARDS" | "XUAT_SAC" | "TIEU_BIEU" | "TOAN_HOC" | "CHU_DEP" | "VIEC_TOT";

export default function CertificatesExportPage() {
  const {
    students,
    classInfo,
    schoolInfo,
    currentTerm,
    termSummaries,
  } = useAppStore();

  const [selectedTerm, setSelectedTerm] = useState<TermType>(currentTerm || "CUOI_NAM");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("ALL");
  const [awardTypeFilter, setAwardTypeFilter] = useState<AwardFilterType>("ALL_AWARDS");

  const termObj = TERMS.find((t) => t.id === selectedTerm);
  const termName = termObj?.name || selectedTerm;

  const targetStudents = selectedStudentId === "ALL"
    ? students
    : students.filter((s) => s.id === selectedStudentId);

  const handlePrint = () => {
    window.print();
  };

  const getAwardDetailsForStudent = (student: Student) => {
    const summary = termSummaries.find((s) => s.studentId === student.id && s.term === selectedTerm);
    
    if (awardTypeFilter === "XUAT_SAC") {
      return {
        title: "DANH HIỆU HỌC SINH XUẤT SẮC",
        reason: "Đã có thành tích học tập và rèn luyện Xuất sắc theo Thông tư 27/2020/TT-BGDĐT",
        borderClass: "border-amber-500 bg-amber-50/20 text-amber-950",
        sealColor: "text-amber-600",
        badge: "🏆 HỌC SINH XUẤT SẮC",
      };
    }
    if (awardTypeFilter === "TIEU_BIEU") {
      return {
        title: "HỌC SINH TIÊU BIỂU HOÀN THÀNH TỐT",
        reason: "Đã có thành tích học tập và rèn luyện Tiêu biểu hoàn thành tốt trong học kỳ",
        borderClass: "border-blue-500 bg-blue-50/20 text-blue-950",
        sealColor: "text-blue-600",
        badge: "🌟 HỌC SINH TIÊU BIỂU",
      };
    }
    if (awardTypeFilter === "TOAN_HOC") {
      return {
        title: "KHEN THƯỞNG KIỆN TƯỚNG TOÁN HỌC",
        reason: "Đã có thành tích vượt trội và xuất sắc trong môn Toán học",
        borderClass: "border-indigo-500 bg-indigo-50/20 text-indigo-950",
        sealColor: "text-indigo-600",
        badge: "📐 KIỆN TƯỚNG TOÁN HỌC",
      };
    }
    if (awardTypeFilter === "CHU_DEP") {
      return {
        title: "KHEN THƯỞNG VỞ SẠCH CHỮ ĐẸP",
        reason: "Đã đạt giải Nhất phong trào Giữ vở sạch - Viết chữ đẹp cấp trường",
        borderClass: "border-rose-500 bg-rose-50/20 text-rose-950",
        sealColor: "text-rose-600",
        badge: "✍️ VỞ SẠCH CHỮ ĐẸP",
      };
    }
    if (awardTypeFilter === "VIEC_TOT") {
      return {
        title: "BÔNG HOA NGHÌN VIỆC TỐT",
        reason: "Đã có nhiều hành động đẹp, giúp đỡ bạn bè và tích cực tham gia phong trào Sao nề nếp",
        borderClass: "border-emerald-500 bg-emerald-50/20 text-emerald-950",
        sealColor: "text-emerald-600",
        badge: "🌸 NGHÌN VIỆC TỐT",
      };
    }

    // Default from summary or fallback
    const awardTitle = summary?.awardTitle || "Học sinh Hoàn thành tốt nhiệm vụ";
    const isXuatSac = awardTitle === "Học sinh Xuất sắc";
    const isTieuBieu = awardTitle === "Học sinh Tiêu biểu hoàn thành tốt";

    return {
      title: isXuatSac
        ? "DANH HIỆU HỌC SINH XUẤT SẮC"
        : isTieuBieu
        ? "HỌC SINH TIÊU BIỂU HOÀN THÀNH TỐT"
        : "KHEN THƯỞNG HỌC SINH TIẾN BỘ VƯỢT TRỘI",
      reason: `Đã hoàn thành xuất sắc các nội dung học tập và rèn luyện đợt ${termName}`,
      borderClass: isXuatSac
        ? "border-amber-500 bg-amber-50/20 text-amber-950"
        : "border-blue-500 bg-blue-50/20 text-blue-950",
      sealColor: isXuatSac ? "text-amber-600" : "text-blue-600",
      badge: awardTitle,
    };
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
                In Giấy Khen & Bằng Khen Học Sinh (Chuẩn Khổ A4 / A5)
              </h1>
              <p className="text-[11px] text-slate-500 truncate">
                Lớp {classInfo.name} — Tự động điền hàng loạt họ tên, danh hiệu và chữ ký BGH
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Award filter */}
            <select
              value={awardTypeFilter}
              onChange={(e) => setAwardTypeFilter(e.target.value as AwardFilterType)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
            >
              <option value="ALL_AWARDS">✨ Theo danh hiệu thực tế (TT27)</option>
              <option value="XUAT_SAC">🏆 Học sinh Xuất sắc</option>
              <option value="TIEU_BIEU">🌟 Học sinh Tiêu biểu</option>
              <option value="TOAN_HOC">📐 Kiện tướng Toán học</option>
              <option value="CHU_DEP">✍️ Vở sạch Chữ đẹp</option>
              <option value="VIEC_TOT">🌸 Bông hoa Nghìn việc tốt</option>
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
              className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Giấy Khen (Ctrl + P)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PRINTABLE CERTIFICATES CONTAINER */}
      <div className="max-w-4xl mx-auto py-6 px-3 sm:px-6 print:max-w-none print:p-0 space-y-8 print:space-y-0">
        {targetStudents.map((student, idx) => {
          const award = getAwardDetailsForStudent(student);

          return (
            <div
              key={student.id}
              className="bg-white rounded-3xl p-6 sm:p-10 border-8 border-double border-amber-600 shadow-xl print:shadow-none print:rounded-none print:p-8 space-y-6 text-slate-900 font-serif relative overflow-hidden"
              style={{ pageBreakAfter: "always", minHeight: "500px" }}
            >
              {/* Decorative Corner Accents */}
              <div className="absolute top-2 left-2 text-2xl text-amber-500 opacity-60 pointer-events-none">⚜️</div>
              <div className="absolute top-2 right-2 text-2xl text-amber-500 opacity-60 pointer-events-none">⚜️</div>
              <div className="absolute bottom-2 left-2 text-2xl text-amber-500 opacity-60 pointer-events-none">⚜️</div>
              <div className="absolute bottom-2 right-2 text-2xl text-amber-500 opacity-60 pointer-events-none">⚜️</div>

              {/* Certificate Header */}
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

                <div className="pt-6 pb-2 space-y-2">
                  <p className="text-xs uppercase font-sans tracking-widest text-amber-800 font-bold">
                    HIỆU TRƯỞNG TRƯỜNG TIỂU HỌC {schoolInfo.name.toUpperCase()} TẶNG
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-black font-serif uppercase tracking-tight text-red-700 drop-shadow-xs">
                    GIẤY KHEN
                  </h2>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="text-center space-y-3 py-2">
                <p className="text-sm italic font-sans text-slate-700">Tuyên dương khen thưởng em:</p>
                <h3 className="text-2xl sm:text-3xl font-black font-sans uppercase text-blue-950 tracking-wide">
                  {student.fullName}
                </h3>
                <p className="text-xs font-sans font-bold text-slate-800">
                  Học sinh lớp: <span className="text-indigo-900 text-sm font-black">{classInfo.name}</span> — Niên khóa: <strong>{schoolInfo.schoolYear || "2026-2027"}</strong>
                </p>

                <div className="max-w-lg mx-auto py-2">
                  <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-2xl">
                    <p className="text-sm font-black font-sans uppercase text-amber-900">
                      {award.title}
                    </p>
                    <p className="text-xs italic font-serif text-slate-700 mt-1">
                      "{award.reason}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-6 font-sans text-xs flex justify-between items-start text-center">
                <div className="space-y-1 w-48">
                  <p className="font-bold uppercase text-slate-700">GIÁO VIÊN CHỦ NHIỆM</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-900">{classInfo.teacherName}</p>
                </div>

                <div className="space-y-1 w-56">
                  <p className="italic text-slate-500">Hà Nội, ngày ..... tháng ..... năm 2026</p>
                  <p className="font-bold uppercase text-red-900">HIỆU TRƯỞNG</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký tên và đóng dấu)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-900">{schoolInfo.principalName || "Hiệu trưởng"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
