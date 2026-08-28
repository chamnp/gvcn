"use client";

import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  Send,
  Layers,
} from 'lucide-react';
import { ExamQuestion } from '@/lib/question-bank-data';
import { useAppStore } from '@/lib/store';
import { getLocalDateString } from '@/lib/tt27-engine';
import { toast } from 'sonner';

interface AssignQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestions: ExamQuestion[];
  subjectCode: string;
  subjectName: string;
}

export function AssignQuizModal({
  isOpen,
  onClose,
  selectedQuestions,
  subjectCode,
  subjectName,
}: AssignQuizModalProps) {
  const { classInfo, addHomework } = useAppStore();

  const [title, setTitle] = useState(
    `Phiếu Bài Tập Trắc Nghiệm Môn ${subjectName} - ${classInfo.name}`
  );
  const [description, setDescription] = useState(
    `Các con hoàn thành ${selectedQuestions.length} câu hỏi trắc nghiệm trực tuyến để củng cố kiến thức nhé.`
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [assignedDate, setAssignedDate] = useState(getLocalDateString());
  const [dueDate, setDueDate] = useState(
    getLocalDateString(new Date(Date.now() + 86400000 * 2))
  );
  const [reminderNotes, setReminderNotes] = useState(
    'Đọc kỹ đề bài, tính nháp cẩn thận trước khi chọn đáp án.'
  );

  if (!isOpen) return null;

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên bài tập!');
      return;
    }
    if (selectedQuestions.length === 0) {
      toast.error('Chưa có câu hỏi nào được chọn để giao!');
      return;
    }

    addHomework({
      classId: classInfo.id || 'class-4a1',
      className: classInfo.name,
      subjectCode,
      subjectName,
      title: title.trim(),
      description: description.trim(),
      assignedDate,
      dueDate,
      reminderNotes: reminderNotes.trim(),
      isQuiz: true,
      quizQuestions: selectedQuestions,
      timeLimitMinutes,
    });

    toast.success(
      `Đã giao thành công bài tập trắc nghiệm "${title}" (${selectedQuestions.length} câu) cho học sinh lớp ${classInfo.name}!`
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
              🚀
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Giao Bài Trắc Nghiệm Trực Tuyến Cho Lớp {classInfo.name}
              </h3>
              <p className="text-xs text-slate-500">
                Tạo từ {selectedQuestions.length} câu hỏi thuộc môn {subjectName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAssign} className="space-y-3.5 text-xs font-sans">
          <div>
            <label className="font-bold text-slate-700">Tiêu đề bài tập / bài kiểm tra (*):</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 mt-1 rounded-xl border border-slate-200 font-bold bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Thời gian làm bài:</label>
              <select
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full p-2 mt-1 rounded-xl border border-slate-200 font-bold bg-white text-slate-900"
              >
                <option value={10}>10 phút (Kiểm tra nhanh 5 câu)</option>
                <option value={15}>15 phút (Chuẩn 7 câu)</option>
                <option value={20}>20 phút (Chuẩn 10 câu)</option>
                <option value={40}>40 phút (Bài kiểm tra định kỳ)</option>
                <option value={0}>Không giới hạn thời gian</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">Hạn hoàn thành bài:</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 mt-1 rounded-xl border border-slate-200 font-bold bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Lời dặn dò của giáo viên:</label>
            <input
              type="text"
              value={reminderNotes}
              onChange={(e) => setReminderNotes(e.target.value)}
              placeholder="VD: Các con tính nháp cẩn thận trước khi chọn..."
              className="w-full p-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-[11px] text-indigo-950 space-y-1">
            <div className="font-bold flex items-center gap-1 text-indigo-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cơ chế làm bài của học sinh:</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Học sinh truy cập cổng bài tập của lớp (quét mã QR hoặc link <strong>/hw/{classInfo.name.toLowerCase()}</strong>), bấm nút <strong>"Làm bài trắc nghiệm"</strong>, chọn đáp án và hệ thống sẽ tự động chấm điểm ngay khi nộp bài.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Giao Bài Cho Học Sinh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
