'use client';

import React from 'react';
import { LessonPlan, SchoolInfo, ClassInfo } from '@/types';
import { Printer, ArrowLeft, Download, FileText } from 'lucide-react';
import { downloadLessonPlanDoc } from '@/lib/lesson-plan-engine';

interface LessonPlanPrintViewProps {
  lessonPlan: LessonPlan;
  schoolInfo: SchoolInfo;
  classInfo: ClassInfo;
  onBack?: () => void;
}

export function LessonPlanPrintView({
  lessonPlan,
  schoolInfo,
  classInfo,
  onBack,
}: LessonPlanPrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const textbookLabel =
    lessonPlan.textbook === 'KET_NOI_TRI_THUC'
      ? 'Kết nối tri thức với cuộc sống'
      : lessonPlan.textbook === 'CANH_DIEU'
      ? 'Cánh Diều'
      : 'Chân trời sáng tạo';

  return (
    <div className="bg-slate-100 min-h-screen text-black p-4 sm:p-8 font-serif">
      {/* Control Bar */}
      <div className="no-print mb-6 max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-300 font-sans shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Quản Lý Giáo Án</span>
        </button>

        <div className="text-center">
          <h3 className="text-sm font-black text-slate-900">
            Kế Hoạch Bài Dạy (Mẫu Chuẩn Công Văn 2345/BGDĐT-GDTH)
          </h3>
          <p className="text-xs text-slate-500">Định dạng chuẩn trang in A4 • Sẵn sàng in hoặc xuất Word</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => downloadLessonPlanDoc(lessonPlan, schoolInfo, classInfo)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Xuất Word (.doc)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>IN GIÁO ÁN A4 (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* Main A4 Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 p-8 sm:p-12 shadow-lg print:border-none print:shadow-none print:p-8 space-y-6 leading-relaxed text-slate-900 text-xs sm:text-sm">
        {/* National Header */}
        <div className="grid grid-cols-2 text-center text-xs sm:text-sm pb-2 border-b border-black">
          <div>
            <p className="uppercase font-bold text-[11px] sm:text-xs">
              {schoolInfo.departmentName || 'PHÒNG GD&ĐT QUẬN NAM TỪ LIÊM'}
            </p>
            <p className="uppercase font-black text-xs sm:text-sm underline underline-offset-4">
              {schoolInfo.name || 'TRƯỜNG TIỂU HỌC ĐẠI MỖ'}
            </p>
          </div>
          <div>
            <p className="uppercase font-black text-xs sm:text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold text-xs underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 pt-2">
          <h1 className="text-base sm:text-xl font-black uppercase tracking-wide">KẾ HOẠCH BÀI DẠY</h1>
          <p className="text-sm sm:text-base font-bold uppercase text-blue-900 print:text-black">
            {lessonPlan.title}
          </p>
          <p className="text-xs italic text-slate-700">
            Môn: <strong>{lessonPlan.subjectName}</strong> — Lớp: <strong>{classInfo.name}</strong> (Khối {lessonPlan.grade}) • Bộ sách: <strong>{textbookLabel}</strong><br />
            Tuần: <strong>{lessonPlan.week}</strong> • Tiết theo PPCT: <strong>{lessonPlan.periodNumber}</strong> • Thời lượng: <strong>{lessonPlan.durationMinutes} phút</strong><br />
            Giáo viên thực hiện: <strong>{classInfo.teacherName}</strong>
          </p>
        </div>

        {/* I. YÊU CẦU CẦN ĐẠT */}
        <div className="space-y-2 pt-2">
          <h3 className="font-bold uppercase text-xs sm:text-sm border-b border-black pb-1">
            I. YÊU CẦU CẦN ĐẠT
          </h3>
          <div className="space-y-1.5 pl-2">
            <p>
              <strong>1. Năng lực đặc thù:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {lessonPlan.objectives.specificCompetencies.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>

            <p className="pt-1">
              <strong>2. Năng lực chung:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {lessonPlan.objectives.generalCompetencies.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>

            <p className="pt-1">
              <strong>3. Phẩm chất chủ yếu:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {lessonPlan.objectives.qualities.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* II. ĐỒ DÙNG DẠY HỌC */}
        <div className="space-y-2 pt-2">
          <h3 className="font-bold uppercase text-xs sm:text-sm border-b border-black pb-1">
            II. ĐỒ DÙNG DẠY HỌC
          </h3>
          <div className="space-y-1 pl-2">
            <p>
              <strong>1. Giáo viên:</strong> {lessonPlan.equipment.teacher.join('; ')}.
            </p>
            <p>
              <strong>2. Học sinh:</strong> {lessonPlan.equipment.students.join('; ')}.
            </p>
          </div>
        </div>

        {/* III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU (BẢNG 2 CỘT CHUẨN) */}
        <div className="space-y-2 pt-2">
          <h3 className="font-bold uppercase text-xs sm:text-sm border-b border-black pb-1">
            III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU
          </h3>

          <table className="w-full border-collapse border border-black text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="border border-black p-2 text-center w-1/2">Hoạt động của giáo viên</th>
                <th className="border border-black p-2 text-center w-1/2">Hoạt động của học sinh</th>
              </tr>
            </thead>
            <tbody>
              {lessonPlan.activities.map((act) => (
                <React.Fragment key={act.id}>
                  <tr className="bg-slate-50 print:bg-slate-100 font-bold">
                    <td colSpan={2} className="border border-black p-2 text-blue-900 print:text-black">
                      {act.title}
                      {act.goal && (
                        <div className="font-normal italic text-[11px] text-slate-600 print:text-black mt-0.5">
                          * Mục tiêu: {act.goal}
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2.5 align-top leading-relaxed whitespace-pre-line">
                      {act.teacherActivity}
                    </td>
                    <td className="border border-black p-2.5 align-top leading-relaxed whitespace-pre-line">
                      {act.studentActivity}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* IV. ĐIỀU CHỈNH SAU BÀI DẠY */}
        <div className="space-y-2 pt-2">
          <h3 className="font-bold uppercase text-xs sm:text-sm border-b border-black pb-1">
            IV. ĐIỀU CHỈNH SAU BÀI DẠY
          </h3>
          <p className="italic pl-2 text-slate-700">
            {lessonPlan.postLessonNotes ||
              '....................................................................................................................................................................................................................................................'}
          </p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 text-center text-xs sm:text-sm pt-8 gap-6">
          <div className="space-y-16">
            <div>
              <p className="font-bold uppercase text-[11px] sm:text-xs">BAN GIÁM HIỆU DUYỆT</p>
              <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="h-8"></div>
          </div>

          <div className="space-y-16">
            <div>
              <p className="italic text-[11px] text-slate-600">
                Ngày ..... tháng ..... năm {new Date().getFullYear()}
              </p>
              <p className="font-bold uppercase text-[11px] sm:text-xs">GIÁO VIÊN SOẠN BÀI</p>
              <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
            </div>
            <p className="font-bold">{classInfo.teacherName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
