'use client';

import React, { useState } from 'react';
import {
  Printer,
  X,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import {
  Student,
  ClassInfo,
  TermType,
  SubjectAssessment,
  TraitAssessment,
  StudentTermSummary,
} from '@/types';
import {
  TERMS,
  PRIMARY_SUBJECTS,
  evaluateStudentTT27,
  getAwardBadgeClass,
} from '@/lib/tt27-engine';
import { toast } from 'sonner';

interface IndividualReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classInfo: ClassInfo;
  currentTerm: TermType;
  subjectAssessments: SubjectAssessment[];
  traitAssessments: TraitAssessment[];
  termSummaries: StudentTermSummary[];
}

export function IndividualReportCardModal({
  isOpen,
  onClose,
  students,
  classInfo,
  currentTerm,
  subjectAssessments,
  traitAssessments,
  termSummaries,
}: IndividualReportCardModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const subjects = PRIMARY_SUBJECTS.filter((s) =>
    s.applicableGrades.includes(classInfo.grade)
  );

  const currentIndex = students.findIndex((s) => s.id === selectedStudentId);
  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedStudentId(students[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < students.length - 1) {
      setSelectedStudentId(students[currentIndex + 1].id);
    }
  };

  const studentSubjects = selectedStudent
    ? subjectAssessments.filter(
        (a) => a.studentId === selectedStudent.id && a.term === currentTerm
      )
    : [];
  const studentTraits = selectedStudent
    ? traitAssessments.filter(
        (a) => a.studentId === selectedStudent.id && a.term === currentTerm
      )
    : [];
  const summary = selectedStudent
    ? termSummaries.find(
        (s) => s.studentId === selectedStudent.id && s.term === currentTerm
      )
    : undefined;

  const evalResult = evaluateStudentTT27(
    studentSubjects,
    studentTraits,
    currentTerm
  );
  const award = summary?.awardTitle || evalResult.awardTitle;
  const comment =
    summary?.teacherComment ||
    'Em hoàn thành tốt các nội dung học tập và rèn luyện trong kỳ.';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyParentLink = () => {
    if (!selectedStudent?.shareToken) {
      toast.error('Học sinh chưa có mã liên kết phụ huynh.');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/student/${selectedStudent.shareToken}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success(`Đã sao chép link sổ liên lạc của em ${selectedStudent.fullName}!`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150 print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              📄
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                Phiếu Báo Kết Quả Học Tập Cá Nhân
              </h3>
              <p className="text-xs text-blue-200">
                Lớp {classInfo.name} • {termName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 bg-white text-blue-900 hover:bg-blue-50 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>In Phiếu A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Student Selector Toolbar */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Học sinh trước"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>

            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {students.map((st, idx) => (
                <option key={st.id} value={st.id}>
                  {idx + 1}. {st.fullName} ({st.studentCode})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= students.length - 1}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Học sinh tiếp theo"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedStudent?.shareToken && (
              <button
                type="button"
                onClick={handleCopyParentLink}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã sao chép link' : 'Sao chép link gửi PH'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Printable Card Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
          {selectedStudent && (
            <div className="max-w-xl mx-auto bg-slate-50/50 p-6 rounded-2xl border-2 border-indigo-200 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0 print:bg-white">
              {/* Header */}
              <div className="text-center space-y-1 pb-3 border-b border-indigo-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {classInfo.schoolName}
                </p>
                <h2 className="text-lg sm:text-xl font-black text-indigo-950 uppercase tracking-tight">
                  PHIẾU KẾT QUẢ HỌC TẬP VÀ RÈN LUYỆN
                </h2>
                <p className="text-xs font-semibold text-slate-600">
                  {termName} - Năm học {classInfo.schoolYear}
                </p>
              </div>

              {/* Student Info Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px]">Họ và tên:</span>
                  <p className="font-bold text-slate-900">{selectedStudent.fullName}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Lớp:</span>
                  <p className="font-bold text-slate-900">{classInfo.name}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Ngày sinh:</span>
                  <p className="font-bold text-slate-900">{selectedStudent.dateOfBirth}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Giáo viên:</span>
                  <p className="font-bold text-slate-900">{classInfo.teacherName}</p>
                </div>
              </div>

              {/* Subjects Table */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  1. Đánh giá Môn học và Hoạt động giáo dục:
                </h4>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Môn học</th>
                        <th className="py-2 px-3 text-center w-28">Mức độ đạt</th>
                        <th className="py-2 px-3 text-center w-24">Điểm KTĐK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjects.map((sub) => {
                        const data = studentSubjects.find(
                          (a) => a.subjectCode === sub.code
                        );
                        return (
                          <tr key={sub.code}>
                            <td className="py-1.5 px-3 font-semibold text-slate-800">
                              {sub.name}
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              <span className="font-bold text-emerald-700">
                                {data?.level === 'T'
                                  ? 'Hoàn thành tốt (T)'
                                  : data?.level === 'H'
                                  ? 'Hoàn thành (H)'
                                  : 'Chưa HT (C)'}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-center font-mono font-bold text-slate-800">
                              {sub.hasPeriodicTest && data?.score !== undefined
                                ? data.score
                                : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Award & Teacher Comment */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    2. Danh hiệu Khen thưởng:
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-black border ${getAwardBadgeClass(
                      award
                    )}`}
                  >
                    {award}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    3. Lời nhận xét của Giáo viên Chủ nhiệm:
                  </span>
                  <p className="text-xs text-slate-800 italic leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
                    "{comment}"
                  </p>
                </div>
              </div>

              {/* Signature Footer */}
              <div className="grid grid-cols-2 text-center text-xs pt-3 font-semibold text-slate-700">
                <div>
                  <p className="text-slate-400">Ý KIẾN CỦA PHỤ HUYNH</p>
                  <div className="h-12"></div>
                  <p className="italic font-normal text-[10px]">(Ký và ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="text-slate-400">GIÁO VIÊN CHỦ NHIỆM</p>
                  <div className="h-12 flex items-center justify-center text-blue-600 font-bold font-serif italic text-sm">
                    {classInfo.teacherName}
                  </div>
                  <p className="font-bold">{classInfo.teacherName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
