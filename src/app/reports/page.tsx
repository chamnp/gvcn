'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { exportTT27Form1, exportVnEduTemplate } from '@/lib/excel-export';
import { TERMS, PRIMARY_SUBJECTS, TRAIT_DEFINITIONS, evaluateStudentTT27, getAwardBadgeClass } from '@/lib/tt27-engine';
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

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;

  const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(classInfo.grade));
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const studentSubjects = selectedStudent
    ? subjectAssessments.filter((a) => a.studentId === selectedStudent.id && a.term === currentTerm)
    : [];
  const studentTraits = selectedStudent
    ? traitAssessments.filter((a) => a.studentId === selectedStudent.id && a.term === currentTerm)
    : [];
  const summary = selectedStudent
    ? termSummaries.find((s) => s.studentId === selectedStudent.id && s.term === currentTerm)
    : undefined;
  const evalResult = evaluateStudentTT27(studentSubjects, studentTraits, currentTerm);
  const award = summary?.awardTitle || evalResult.awardTitle;
  const comment = summary?.teacherComment || 'Em hoàn thành tốt các nội dung học tập và rèn luyện trong kỳ.';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileDown className="w-7 h-7 text-emerald-600" />
            <span>Báo Cáo & Xuất Dữ Liệu Thông Tư 27</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kỳ hiện tại: <strong className="text-blue-600 font-bold">{termName}</strong> - Lớp {classInfo.name} ({classInfo.schoolName})
          </p>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Form 1 TT27 */}
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
            onClick={() => {
              exportTT27Form1(classInfo, students, subjectAssessments, traitAssessments, termSummaries, currentTerm);
              toast.success('Đã tải xuống file Bảng tổng hợp Mẫu 1 (TT27)!');
            }}
            className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors"
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
                Định dạng các cột mã môn, mức đánh giá và điểm số tương thích hoàn toàn để tải lên trực tiếp cổng quản lý giáo dục ngành VnEdu, SMAS, CSDL Bộ GD&ĐT.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              exportVnEduTemplate(classInfo, students, subjectAssessments, currentTerm);
              toast.success('Đã tải xuống file nhập điểm VnEdu/SMAS!');
            }}
            className="w-full inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Tải File Nhập VnEdu / SMAS</span>
          </button>
        </div>
      </div>

      {/* Section: Printable Report Card (Phiếu Báo Điểm Cá Nhân) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600" />
              <span className="hidden sm:inline">Phiếu Báo Kết Quả Học Tập Cá Nhân (In / Gửi Zalo Phụ Huynh)</span><span className="sm:hidden">Phiếu Báo Điểm Cá Nhân</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn học sinh để xem trước phiếu liên lạc điện tử đẹp mắt và in ấn.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Student Picker */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.studentCode})
                </option>
              ))}
            </select>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu Này</span>
            </button>
          </div>
        </div>

        {/* Printable Card Preview Container */}
        {selectedStudent && (
          <div className="max-w-2xl mx-auto bg-slate-50 p-6 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0 print:bg-white">
            {/* Card Header */}
            <div className="text-center space-y-1 pb-3 border-b border-indigo-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{classInfo.schoolName}</p>
              <h2 className="text-xl font-black text-indigo-950 uppercase tracking-tight">
                PHIẾU KẾT QUẢ HỌC TẬP VÀ RÈN LUYỆN
              </h2>
              <p className="text-xs font-semibold text-slate-600">
                {termName} - Năm học {classInfo.schoolYear}
              </p>
            </div>

            {/* Student Info Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400">Họ và tên:</span>
                <p className="font-bold text-slate-900">{selectedStudent.fullName}</p>
              </div>
              <div>
                <span className="text-slate-400">Lớp:</span>
                <p className="font-bold text-slate-900">{classInfo.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Ngày sinh:</span>
                <p className="font-bold text-slate-900">{selectedStudent.dateOfBirth}</p>
              </div>
              <div>
                <span className="text-slate-400">Giáo viên:</span>
                <p className="font-bold text-slate-900">{classInfo.teacherName}</p>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Đánh giá Môn học và Hoạt động giáo dục:
              </h4>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Môn học</th>
                      <th className="py-2 px-3 text-center w-28">Mức độ đạt</th>
                      <th className="py-2 px-3 text-center w-28">Điểm KTĐK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map((sub) => {
                      const data = studentSubjects.find((a) => a.subjectCode === sub.code);
                      return (
                        <tr key={sub.code}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{sub.name}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="font-bold text-emerald-700">
                              {data?.level === 'T' ? 'Hoàn thành tốt (T)' : data?.level === 'H' ? 'Hoàn thành (H)' : 'Chưa HT (C)'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                            {sub.hasPeriodicTest && data?.score !== undefined ? data.score : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Award & Teacher Comment */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase">2. Danh hiệu Khen thưởng:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${getAwardBadgeClass(award)}`}>
                  {award}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  3. Lời nhận xét của Giáo viên Chủ nhiệm:
                </span>
                <p className="text-xs text-slate-800 italic leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium">
                  "{comment}"
                </p>
              </div>
            </div>

            {/* Signature Footer */}
            <div className="grid grid-cols-2 text-center text-xs pt-4 font-semibold text-slate-700">
              <div>
                <p className="text-slate-400">Ý KIẾN CỦA PHỤ HUYNH</p>
                <div className="h-16"></div>
                <p className="italic font-normal text-[11px]">(Ký và ghi rõ họ tên)</p>
              </div>
              <div>
                <p className="text-slate-400">GIÁO VIÊN CHỦ NHIỆM</p>
                <div className="h-16 flex items-center justify-center text-blue-600 font-bold font-serif italic text-sm">
                  {classInfo.teacherName}
                </div>
                <p className="font-bold">{classInfo.teacherName}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
