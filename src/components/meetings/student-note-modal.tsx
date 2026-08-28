'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Heart,
  Award,
  AlertCircle,
  MessageCircle,
  CheckCircle2,
  X,
  Phone,
} from 'lucide-react';
import { IndividualStudentMeetingNote, Student } from '@/types';
import { toast } from 'sonner';

interface StudentNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: IndividualStudentMeetingNote) => void;
  student: Student;
  initialNote?: IndividualStudentMeetingNote | null;
  classNameStr?: string;
}

export function StudentNoteModal({
  isOpen,
  onClose,
  onSave,
  student,
  initialNote,
  classNameStr = '4A1',
}: StudentNoteModalProps) {
  const [academicSummary, setAcademicSummary] = useState('');
  const [behaviorSummary, setBehaviorSummary] = useState('');
  const [actionItemForParents, setActionItemForParents] = useState('');
  const [isPriorityDiscussion, setIsPriorityDiscussion] = useState(false);
  const [parentPhone, setParentPhone] = useState('');

  useEffect(() => {
    if (initialNote) {
      setAcademicSummary(initialNote.academicSummary || '');
      setBehaviorSummary(initialNote.behaviorSummary || '');
      setActionItemForParents(initialNote.actionItemForParents || '');
      setIsPriorityDiscussion(!!initialNote.isPriorityDiscussion);
      setParentPhone(initialNote.parentPhone || student.parentPhone || '');
    } else {
      setAcademicSummary('Hoàn thành tốt các môn học, tiếp thu bài nhanh.');
      setBehaviorSummary('Ngoan ngoãn, lễ phép, có ý thức nề nếp tốt.');
      setActionItemForParents('Gia đình cùng con đọc sách 15 phút mỗi tối.');
      setIsPriorityDiscussion(false);
      setParentPhone(student.parentPhone || '');
    }
  }, [initialNote, student, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const noteData: IndividualStudentMeetingNote = {
      studentId: student.id,
      studentName: student.fullName,
      academicSummary: academicSummary.trim(),
      behaviorSummary: behaviorSummary.trim(),
      actionItemForParents: actionItemForParents.trim(),
      isPriorityDiscussion,
      parentPhone: parentPhone.trim(),
    };
    onSave(noteData);
    onClose();
  };

  const handleSendZalo = () => {
    const msg = `Kính gửi Quý phụ huynh em ${student.fullName} (Lớp ${classNameStr}):\n\nCô giáo xin gửi tóm tắt tình hình học tập và rèn luyện của con:\n- Học tập: ${academicSummary}\n- Nề nếp: ${behaviorSummary}\n- Lời dặn dò: ${actionItemForParents}\n\nTrân trọng cảm ơn Quý phụ huynh đã luôn đồng hành cùng cô giáo và nhà trường! 🌟`;
    navigator.clipboard.writeText(msg);
    toast.success(`Đã sao chép tin nhắn Zalo gửi phụ huynh em ${student.fullName}!`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
              {student.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight">
                Sổ Trao Đổi Riêng: {student.fullName}
              </h3>
              <p className="text-xs text-indigo-100">
                Mã HS: {student.studentCode} • {student.gender} • Lớp {classNameStr}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block">Ưu Tiên Trao Đổi Riêng / Gọi Điện:</span>
              <p className="text-[11px] text-slate-500">Đánh dấu nếu cần gặp riêng phụ huynh sau buổi họp</p>
            </div>
            <input
              type="checkbox"
              checked={isPriorityDiscussion}
              onChange={(e) => setIsPriorityDiscussion(e.target.checked)}
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Số Điện Thoại Phụ Huynh:</label>
            <input
              type="text"
              placeholder="VD: 0912.345.678"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Tình Hình Học Tập & Khả Năng Tiếp Thu:</label>
            <textarea
              rows={2}
              value={academicSummary}
              onChange={(e) => setAcademicSummary(e.target.value)}
              placeholder="VD: Tiếp thu nhanh môn Toán, chữ viết cần nắn nót hơn..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Nề Nếp, Ý Thức & Hòa Đồng:</label>
            <textarea
              rows={2}
              value={behaviorSummary}
              onChange={(e) => setBehaviorSummary(e.target.value)}
              placeholder="VD: Rất ngoan, tự giác giơ tay phát biểu, hòa đồng với bạn bè..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Điểm Cần Gia Đình Phối Hợp Kèm Cặp:</label>
            <textarea
              rows={2}
              value={actionItemForParents}
              onChange={(e) => setActionItemForParents(e.target.value)}
              placeholder="VD: Cùng con ôn bài 20p mỗi tối, kiểm tra hộp bút thước kẻ..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleSendZalo}
            className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-xs border border-cyan-200 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-cyan-600" />
            <span>Copy Tin Zalo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Ghi Chú</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
