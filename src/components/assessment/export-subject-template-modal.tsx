'use client';

import React, { useState } from 'react';
import { X, FileDown, BookOpen, Users, CheckCircle2 } from 'lucide-react';
import { ClassInfo, Student, SubjectAssessment, TermType } from '@/types';
import { exportSubjectScoreTemplate } from '@/lib/excel-export';
import { toast } from 'sonner';

interface ExportSubjectTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  classInfo: ClassInfo;
  students: Student[];
  subjects: { code: string; name: string; shortName: string }[];
  currentSubjectCode: string;
  subjectAssessments: SubjectAssessment[];
  currentTerm: TermType;
}

export const ExportSubjectTemplateModal: React.FC<ExportSubjectTemplateModalProps> = ({
  isOpen,
  onClose,
  classInfo,
  students,
  subjects,
  currentSubjectCode,
  subjectAssessments,
  currentTerm,
}) => {
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    currentSubjectCode || (subjects[0]?.code || 'TOAN')
  );

  if (!isOpen) return null;

  const handleExport = () => {
    const targetSubject = subjects.find((s) => s.code === selectedSubjectCode);
    if (!targetSubject) {
      toast.error('Vui lòng chọn môn học cần xuất file.');
      return;
    }

    exportSubjectScoreTemplate(classInfo, students, targetSubject, subjectAssessments, currentTerm);
    toast.success(`Đã xuất file Excel mẫu nhập điểm môn ${targetSubject.name} (${students.length} học sinh)!`);
    onClose();
  };

  const currentSubjectObj = subjects.find((s) => s.code === selectedSubjectCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Xuất File Excel Mẫu Nhập Điểm Môn Học</h2>
              <p className="text-xs text-slate-500">File Excel chứa sẵn toàn bộ danh sách học sinh của lớp</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Chọn Môn Học Cần Xuất File Mẫu:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subjects.map((sub) => {
                const isSelected = selectedSubjectCode === sub.code;
                return (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => setSelectedSubjectCode(sub.code)}
                    className={`p-2.5 rounded-2xl text-left border text-xs font-bold transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{sub.shortName}</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate">{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Thông tin lớp học:</span>
              </span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                Lớp {classInfo.name} ({students.length} em)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              File Excel tải về sẽ bao gồm đầy đủ STT, Mã học sinh, Họ và tên, Điểm số (0 - 10), Mức đánh giá (T/H/C) và Lời nhận xét môn học. Giáo viên có thể chỉnh sửa ngoại tuyến và tải lên lại hệ thống bất cứ lúc nào.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Tải File Excel Môn {currentSubjectObj?.shortName || ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
