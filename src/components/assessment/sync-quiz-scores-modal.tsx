'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { HomeworkAssignment, QuizSubmission, Student, SubjectLevel, TermType } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

interface SyncQuizScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: { code: string; name: string; shortName: string }[];
  currentSubjectCode: string;
  students: Student[];
  homeworks: HomeworkAssignment[];
  quizSubmissions: QuizSubmission[];
  currentTerm: TermType;
  onApply: (
    updates: {
      studentId: string;
      subjectCode: string;
      term: TermType;
      level: SubjectLevel;
      score?: number;
      comment?: string;
    }[]
  ) => void;
}

export const SyncQuizScoresModal: React.FC<SyncQuizScoresModalProps> = ({
  isOpen,
  onClose,
  subjects,
  currentSubjectCode,
  students,
  homeworks,
  quizSubmissions,
  currentTerm,
  onApply,
}) => {
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    currentSubjectCode || (subjects[0]?.code || 'TOAN')
  );
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [includeScore, setIncludeScore] = useState(true);
  const [includeComment, setIncludeComment] = useState(true);

  // Filter homeworks by selected subject
  const availableHomeworks = useMemo(() => {
    return homeworks.filter(
      (h) => h.subjectCode === selectedSubjectCode || (!h.subjectCode && selectedSubjectCode === 'TOAN')
    );
  }, [homeworks, selectedSubjectCode]);

  // Set default selected homework when list changes
  React.useEffect(() => {
    if (availableHomeworks.length > 0) {
      setSelectedHomeworkId((prev) => {
        if (availableHomeworks.some((h) => h.id === prev)) return prev;
        return availableHomeworks[0].id;
      });
    } else {
      setSelectedHomeworkId('');
    }
  }, [availableHomeworks]);

  const activeHomework = useMemo(() => {
    return homeworks.find((h) => h.id === selectedHomeworkId);
  }, [homeworks, selectedHomeworkId]);

  // Submissions for active homework
  const currentSubmissions = useMemo(() => {
    if (!selectedHomeworkId) return [];
    return quizSubmissions.filter((s) => s.homeworkId === selectedHomeworkId);
  }, [quizSubmissions, selectedHomeworkId]);

  // Build rows for all students in class
  const studentRows = useMemo(() => {
    return students.map((st) => {
      const sub = currentSubmissions.find((s) => s.studentId === st.id);
      let score: number | undefined = undefined;
      let level: SubjectLevel = 'H';
      let autoComment = '';

      if (sub) {
        // Calculate scaled score out of 10
        if (sub.totalPoints && sub.totalPoints > 0) {
          const scaled = (sub.score / sub.totalPoints) * 10;
          score = Math.min(10, Math.max(0, Math.round(scaled * 10) / 10));
        } else {
          score = Math.min(10, Math.max(0, Math.round(sub.score * 10) / 10));
        }

        if (score >= 9) {
          level = 'T';
        } else if (score >= 5) {
          level = 'H';
        } else {
          level = 'C';
        }

        autoComment =
          score >= 9
            ? `Hoàn thành xuất sắc bài kiểm tra trực tuyến, nắm vững kiến thức (${score}/10đ).`
            : score >= 7
            ? `Hoàn thành tốt bài trắc nghiệm trực tuyến (${score}/10đ).`
            : score >= 5
            ? `Hoàn thành bài trắc nghiệm (${score}/10đ), cần rèn luyện thêm.`
            : `Kết quả bài kiểm tra trực tuyến đạt ${score}/10đ, cần ôn tập và cố gắng thêm.`;
      }

      return {
        student: st,
        submission: sub,
        score,
        level,
        autoComment,
        hasSubmitted: !!sub,
      };
    });
  }, [students, currentSubmissions]);

  // Auto select all students who have submissions
  React.useEffect(() => {
    const submittedIds = new Set(
      studentRows.filter((r) => r.hasSubmitted).map((r) => r.student.id)
    );
    setSelectedStudentIds(submittedIds);
  }, [studentRows]);

  if (!isOpen) return null;

  const currentSubjectObj = subjects.find((s) => s.code === selectedSubjectCode);

  const toggleSelectAll = () => {
    const submittedStudents = studentRows.filter((r) => r.hasSubmitted);
    if (selectedStudentIds.size === submittedStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(submittedStudents.map((r) => r.student.id)));
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    if (selectedStudentIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một học sinh để đồng bộ điểm.');
      return;
    }

    const updates = studentRows
      .filter((r) => selectedStudentIds.has(r.student.id) && r.hasSubmitted)
      .map((r) => ({
        studentId: r.student.id,
        subjectCode: selectedSubjectCode,
        term: currentTerm,
        level: r.level,
        score: includeScore ? r.score : undefined,
        comment: includeComment ? r.autoComment : undefined,
      }));

    onApply(updates);
    toast.success(
      `Đã đồng bộ kết quả trực tuyến cho ${updates.length} học sinh vào môn ${
        currentSubjectObj?.shortName || selectedSubjectCode
      }!`
    );
    onClose();
  };

  const submittedCount = studentRows.filter((r) => r.hasSubmitted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Tổng Hợp Điểm Bài Tập & Trắc Nghiệm Online</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Linh hoạt
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Lấy điểm từ các bài làm trực tuyến của học sinh đưa thẳng vào bảng đánh giá môn học
              </p>
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Pick Subject & Pick Homework */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1. Môn học cần tổng hợp điểm:
              </label>
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.name} ({sub.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. Chọn Bài tập / Đề trắc nghiệm:
              </label>
              <select
                value={selectedHomeworkId}
                onChange={(e) => setSelectedHomeworkId(e.target.value)}
                disabled={availableHomeworks.length === 0}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-60 cursor-pointer"
              >
                {availableHomeworks.length === 0 ? (
                  <option value="">Không có bài tập nào cho môn này</option>
                ) : (
                  availableHomeworks.map((hw) => {
                    const subCount = quizSubmissions.filter((s) => s.homeworkId === hw.id).length;
                    return (
                      <option key={hw.id} value={hw.id}>
                        {hw.title} ({subCount} bài nộp - {hw.assignedDate})
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          {availableHomeworks.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <FileQuestion className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                Chưa có bài tập hoặc đề trắc nghiệm nào cho môn {currentSubjectObj?.name || selectedSubjectCode}.
              </p>
              <p className="text-[11px] text-slate-500">
                Bạn có thể tạo bài trắc nghiệm online và giao cho học sinh làm tại trang Giao bài tập.
              </p>
              <Link
                href="/homework"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <span>Tới trang Giao Bài Tập (QR)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
              {/* Sync Options */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeScore}
                      onChange={(e) => setIncludeScore(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Điểm số (0 - 10)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeComment}
                      onChange={(e) => setIncludeComment(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Kèm lời nhận xét tự động</span>
                  </label>
                </div>

                <div className="text-[11px] font-bold text-blue-700">
                  Đã nộp bài: <span className="font-black text-blue-900">{submittedCount}/{students.length}</span> học sinh
                </div>
              </div>

              {/* Students Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            submittedCount > 0 && selectedStudentIds.size === submittedCount
                          }
                          onChange={toggleSelectAll}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="py-2.5 px-3">Học Sinh</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                      <th className="py-2.5 px-3 text-center">Điểm Đạt</th>
                      <th className="py-2.5 px-3 text-center">Mức ĐG</th>
                      <th className="py-2.5 px-3">Nhận Xét Đề Xuất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentRows.map((r, idx) => {
                      const isChecked = selectedStudentIds.has(r.student.id);

                      return (
                        <tr
                          key={r.student.id}
                          className={`transition-colors ${
                            !r.hasSubmitted
                              ? 'bg-slate-50/50 opacity-60'
                              : isChecked
                              ? 'bg-blue-50/30 hover:bg-blue-50/50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!r.hasSubmitted}
                              onChange={() => toggleStudent(r.student.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-30"
                            />
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            <div>{r.student.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {r.student.studentCode}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {r.hasSubmitted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đã nộp</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Chưa nộp
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold">
                            {r.score !== undefined ? (
                              <span className="text-blue-700 font-black text-sm">
                                {r.score}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {r.hasSubmitted ? (
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                                  r.level === 'T'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : r.level === 'H'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                {r.level} ({r.level === 'T' ? 'Tốt' : r.level === 'H' ? 'Đạt' : 'Cần Cố Gắng'})
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[220px]">
                            {r.autoComment || <span className="text-slate-400">Không có dữ liệu</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Đã chọn: <span className="font-bold text-blue-600">{selectedStudentIds.size}</span> học sinh
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={selectedStudentIds.size === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đồng Bộ Vào Đánh Giá Môn Học</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
