'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileDown,
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle2,
  Award,
  Sparkles,
  ExternalLink,
  Users,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { exportTT27Form1, exportVnEduTemplate } from '@/lib/excel-export';
import { exportVnEduAssessmentExcel } from '@/lib/vnedu-export';
import { AIClassDiagnosticModal } from '@/components/assessment/ai-class-diagnostic-modal';
import { ZaloMessageGeneratorModal } from '@/components/parent/zalo-message-generator-modal';
import { IndividualReportCardModal } from '@/components/reports/individual-report-card-modal';
import { GuardrailsAlertModal } from '@/components/assessment/guardrails-alert-modal';
import {
  TERMS,
  PRIMARY_SUBJECTS,
  validateTT27Assessments,
} from '@/lib/tt27-engine';
import { toast } from 'sonner';

export default function ReportsPage() {
  const {
    students,
    classInfo,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
  } = useAppStore();

  const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);
  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;

  const issues = React.useMemo(() => {
    return validateTT27Assessments(
      students,
      subjectAssessments,
      traitAssessments,
      termSummaries,
      currentTerm,
      classInfo.grade || 4
    );
  }, [students, subjectAssessments, traitAssessments, termSummaries, currentTerm, classInfo.grade]);

  const errorCount = issues.filter((i) => i.type === 'ERROR').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileDown className="w-7 h-7 text-emerald-600" />
            <span>Báo Cáo & Xuất Dữ Liệu Thông Tư 27</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kỳ hiện tại: <strong className="text-blue-600 font-bold">{termName}</strong> • Lớp {classInfo.name} ({classInfo.schoolName})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsGuardrailsOpen(true)}
          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
            errorCount > 0
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>
            {errorCount > 0
              ? `Phát hiện ${errorCount} lỗi logic TT27!`
              : `Kiểm tra logic (${issues.length} lưu ý)`}
          </span>
        </button>
      </div>

      {/* Export & Print Cards Grid (One-Page Hub) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Form 1 TT27 Excel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bảng Tổng Hợp Đánh Giá (Mẫu 1 - TT27)</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Xuất file Excel đầy đủ tiêu chuẩn theo Phụ lục ban hành kèm Thông tư 27/2020/TT-BGDĐT gồm tất cả các môn học, mức độ T/H/C, điểm số và 5 phẩm chất, năng lực.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              exportTT27Form1(classInfo, students, subjectAssessments, traitAssessments, termSummaries, currentTerm);
              toast.success('Đã tải xuống file Bảng tổng hợp Mẫu 1 (TT27)!');
            }}
            className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải Excel Mẫu 1 ({termName})</span>
          </button>
        </div>

        {/* Card 2: VnEdu / SMAS Import */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">File Nhập Điểm Chuẩn VnEdu / SMAS</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Định dạng các cột mã môn, mức đánh giá và nhận xét tương thích hoàn toàn để tải lên trực tiếp cổng quản lý giáo dục ngành VnEdu, SMAS, CSDL Bộ GD&ĐT.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              exportVnEduAssessmentExcel(students, subjectAssessments, traitAssessments, termSummaries, classInfo, currentTerm);
              toast.success('Đã tải xuống file nhập điểm vnEdu/SMAS tương thích 100%!');
            }}
            className="w-full inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải File Nhập VnEdu / SMAS</span>
          </button>
        </div>

        {/* Card 3: Học Bạ & Phiếu Đánh Giá Định Kỳ Mẫu 1 (A4 PDF Toàn Lớp) */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
              🎓
            </div>
            <div className="space-y-1">
              <span className="inline-block bg-blue-500/30 text-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-400/30">
                1-Click In Toàn Lớp
              </span>
              <h3 className="text-base font-black text-white">
                Học Bạ & Phiếu Đánh Giá Mẫu 1 TT27
              </h3>
              <p className="text-xs text-blue-200/90 leading-relaxed max-w-xl">
                Xuất liên tục toàn bộ phiếu đánh giá của 40 học sinh chuẩn khổ A4/A3 hai mặt có chữ ký GVCN & BGH.
              </p>
            </div>
          </div>

          <Link
            href="/reports/hoc-ba"
            className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-blue-50 text-blue-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Mở & In Học Bạ Mẫu 1 →</span>
          </Link>
        </div>

        {/* Card 4: Sổ Chủ Nhiệm Điện Tử (A4 PDF) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
              📘
            </div>
            <div className="space-y-1">
              <span className="inline-block bg-indigo-500/30 text-indigo-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-400/30">
                Sổ Chủ Nhiệm A4
              </span>
              <h3 className="text-base font-black text-white">
                Sổ Chủ Nhiệm Lớp Điện Tử (Khổ A4 Chuẩn In Ấn)
              </h3>
              <p className="text-xs text-indigo-200/90 leading-relaxed max-w-xl">
                Tổng hợp đầy đủ trang bìa, danh sách trích ngang học sinh, thời khóa biểu, bảng tổng hợp đánh giá và duyệt BGH.
              </p>
            </div>
          </div>

          <Link
            href="/reports/so-chu-nhiem"
            className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-indigo-50 text-indigo-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Mở & In Sổ Chủ Nhiệm →</span>
          </Link>
        </div>

        {/* Card 5: In Giấy Khen & Bằng Khen 1-Click */}
        <div className="bg-gradient-to-br from-amber-900 to-yellow-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/30 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
              📜
            </div>
            <div className="space-y-1">
              <span className="inline-block bg-amber-500/30 text-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-400/30">
                1-Click In Toàn Lớp
              </span>
              <h3 className="text-base font-black text-white">
                Giấy Khen & Bằng Khen Học Sinh Tiểu Học
              </h3>
              <p className="text-xs text-amber-200/90 leading-relaxed max-w-xl">
                In màu khổ A4/A5 hàng loạt: Học sinh Xuất sắc, Học sinh Tiêu biểu, Kiện tướng Toán, Vở sạch chữ đẹp, Bông hoa việc tốt.
              </p>
            </div>
          </div>

          <Link
            href="/reports/certificates"
            className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-amber-50 text-amber-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Mở & In Giấy Khen →</span>
          </Link>
        </div>

        {/* Card 6: Phiếu Báo Điểm Cá Nhân (In / Gửi Zalo PH) */}
        <div className="bg-gradient-to-br from-teal-900 to-emerald-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/30 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
              📄
            </div>
            <div className="space-y-1">
              <span className="inline-block bg-teal-500/30 text-teal-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-teal-400/30">
                Xem & In Cá Nhân
              </span>
              <h3 className="text-base font-black text-white">
                Phiếu Báo Kết Quả Học Tập Cá Nhân (Từng Em)
              </h3>
              <p className="text-xs text-teal-200/90 leading-relaxed max-w-xl">
                Xem trước phiếu liên lạc đẹp mắt của từng học sinh, sao chép link gửi riêng phụ huynh hoặc in ấn nhanh chóng.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsIndividualModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-teal-50 text-teal-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-teal-600" />
            <span>Mở Phiếu Báo Điểm →</span>
          </button>
        </div>

        {/* Card 7: Soạn Tin Nhắn Zalo / SMS Sổ Liên Lạc */}
        <div className="bg-gradient-to-br from-cyan-900 to-blue-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/30 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
              💬
            </div>
            <div className="space-y-1">
              <span className="inline-block bg-cyan-500/30 text-cyan-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-cyan-400/30">
                Cá Nhân Hóa Từng Em
              </span>
              <h3 className="text-base font-black text-white">
                Soạn Tin Nhắn Zalo Sổ Liên Lạc Điện Tử
              </h3>
              <p className="text-xs text-cyan-200/90 leading-relaxed max-w-xl">
                Tự động tạo tin nhắn Zalo kèm điểm số, nhận xét, số sao và link tra cứu riêng có mã PIN cho từng phụ huynh.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsZaloModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-cyan-50 text-cyan-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-cyan-600" />
            <span>Mở Soạn Tin Zalo →</span>
          </button>
        </div>

        {/* Card 8: AI Class Diagnostic Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white p-5 rounded-2xl shadow-md md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/30 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0 animate-pulse">
              🤖
            </div>
            <div className="space-y-1">
              <span className="inline-block bg-purple-400/30 text-purple-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-purple-400/30">
                AI Chẩn Đoán Lớp Học & Họp Phụ Huynh
              </span>
              <h3 className="text-base font-black text-white">
                Trợ Lý AI Chẩn Đoán Sư Phạm & Soạn Báo Cáo Sơ Kết Lớp {classInfo.name}
              </h3>
              <p className="text-xs text-purple-200/90 leading-relaxed max-w-xl">
                Quét phổ điểm toàn lớp, phát hiện điểm trũng kiến thức và tự động soạn sẵn bài phát biểu tổng kết học kỳ của GVCN.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDiagnosticOpen(true)}
            className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-purple-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-900" />
            <span>Chạy Chẩn Đoán AI Ngay</span>
          </button>
        </div>
      </div>

      {/* Modals Suite */}
      <GuardrailsAlertModal
        isOpen={isGuardrailsOpen}
        onClose={() => setIsGuardrailsOpen(false)}
        issues={issues}
      />

      <AIClassDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />

      <ZaloMessageGeneratorModal
        isOpen={isZaloModalOpen}
        onClose={() => setIsZaloModalOpen(false)}
      />

      <IndividualReportCardModal
        isOpen={isIndividualModalOpen}
        onClose={() => setIsIndividualModalOpen(false)}
        students={students}
        classInfo={classInfo}
        currentTerm={currentTerm}
        subjectAssessments={subjectAssessments}
        traitAssessments={traitAssessments}
        termSummaries={termSummaries}
      />
    </div>
  );
}
