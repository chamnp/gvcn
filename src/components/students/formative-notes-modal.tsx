'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Tag,
  Star,
  CheckCircle2,
  AlertTriangle,
  Heart,
  MessageCircle,
  Clock,
  Mic,
} from 'lucide-react';
import { Student, FormativeNote, FormativeNoteCategory } from '@/types';
import { useAppStore } from '@/lib/store';
import { VoiceInputButton } from '@/components/ui/voice-input-button';
import { toast } from 'sonner';

interface FormativeNotesModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_OBSERVATION_TAGS = [
  '🌟 Hăng hái phát biểu',
  '✍️ Chữ viết tiến bộ',
  '💡 Tiếp thu bài nhanh',
  '🤝 Giúp đỡ bạn bè',
  '🎨 Năng khiếu văn nghệ',
  '⚠️ Tính nhẩm còn ẩu',
  '⚠️ Nói chuyện trong giờ',
  '⚠️ Quên đồ dùng học tập',
  '🏥 Sức khỏe yếu/Mệt',
];

export function FormativeNotesModal({
  student,
  isOpen,
  onClose,
}: FormativeNotesModalProps) {
  const { formativeNotes, addFormativeNote, deleteFormativeNote } = useAppStore();

  const [category, setCategory] = useState<FormativeNoteCategory>('TIEN_BO');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isImportant, setIsImportant] = useState(false);

  if (!isOpen || !student) return null;

  const studentNotes = formativeNotes.filter((n) => n.studentId === student.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung ghi chú!');
      return;
    }

    addFormativeNote({
      studentId: student.id,
      studentName: student.fullName,
      date: new Date().toISOString().split('T')[0],
      category,
      title: title.trim() || (category === 'TIEN_BO' ? 'Biểu hiện tích cực' : 'Cần lưu ý rèn luyện'),
      content: content.trim(),
      tags: selectedTags,
      isImportant,
    });

    setTitle('');
    setContent('');
    setSelectedTags([]);
    setIsImportant(false);
  };

  const toggleTag = (tag: string) => {
    const cleanTag = tag.replace(/^[^\w\sÀ-ỹ]+/u, '').trim();
    if (selectedTags.includes(cleanTag)) {
      setSelectedTags(selectedTags.filter((t) => t !== cleanTag));
    } else {
      setSelectedTags([...selectedTags, cleanTag]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              📝
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                Nhật Ký Tiến Bộ Thường Xuyên — {student.fullName}
              </h3>
              <p className="text-xs text-slate-500">
                Ghi nhận biểu hiện học tập & nề nếp hàng tuần để nạp vào Trợ lý AI khi viết học bạ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs">
          {/* ADD NOTE FORM */}
          <form onSubmit={handleSubmit} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-600" />
                <span>Thêm Ghi Chú Mới:</span>
              </span>
              <div className="flex items-center space-x-1.5">
                {[
                  { id: 'TIEN_BO', label: '🌟 Tiến bộ', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { id: 'CAN_CO_GANG', label: '⚠️ Cần cố gắng', color: 'text-amber-800 bg-amber-50 border-amber-200' },
                  { id: 'SUC_KHOE', label: '🏥 Sức khỏe', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                  { id: 'TRAO_DOI_PH', label: '💬 Trao đổi PH', color: 'text-purple-700 bg-purple-50 border-purple-200' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      category === cat.id ? `${cat.color} ring-2 ring-purple-400 font-black` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Tags */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Tiêu đề (VD: Hăng hái phát biểu môn Toán, Quên mang vở bài tập...)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />

              {/* Quick Tags Selector */}
              <div className="flex flex-wrap gap-1">
                {PRESET_OBSERVATION_TAGS.map((tag, idx) => {
                  const clean = tag.replace(/^[^\w\sÀ-ỹ]+/u, '').trim();
                  const isSelected = selectedTags.includes(clean);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Content textarea with Voice Dictation */}
              <div className="relative">
                <textarea
                  rows={3}
                  required
                  placeholder="Mô tả cụ thể biểu hiện của học sinh (Có thể bấm Micro bên cạnh để đọc giọng nói)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                />
                <div className="absolute right-2 top-2">
                  <VoiceInputButton
                    size="sm"
                    title="Đọc nội dung ghi chú"
                    onResult={(text) => {
                      setContent((prev) => (prev ? `${prev} ${text}` : text));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Đánh dấu quan trọng (Ưu tiên nạp vào AI khi viết nhận xét học bạ)</span>
              </label>

              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Lưu Ghi Chú
              </button>
            </div>
          </form>

          {/* NOTES LIST */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
              Lịch Sử Ghi Nhận ({studentNotes.length} Ghi Chú):
            </h4>

            {studentNotes.length === 0 ? (
              <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                Chưa có ghi chú thường xuyên nào cho em {student.fullName}. Hãy thêm ghi chú đầu tiên ở trên!
              </div>
            ) : (
              <div className="space-y-2.5">
                {studentNotes.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-purple-200 transition-colors shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            item.category === 'TIEN_BO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.category === 'CAN_CO_GANG'
                              ? 'bg-amber-100 text-amber-900'
                              : item.category === 'SUC_KHOE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.category === 'TIEN_BO'
                            ? '🌟 Tiến bộ'
                            : item.category === 'CAN_CO_GANG'
                            ? '⚠️ Cần cố gắng'
                            : item.category === 'SUC_KHOE'
                            ? '🏥 Sức khỏe'
                            : '💬 Trao đổi PH'}
                        </span>

                        <h5 className="font-black text-xs text-slate-900">{item.title}</h5>

                        {item.isImportant && (
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                            Quan trọng
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.date}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteFormativeNote(item.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                          title="Xóa ghi chú"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-700 text-xs leading-relaxed">{item.content}</p>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.2 rounded-md"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dữ liệu ghi chú được lưu an toàn và tự động nạp vào Trợ Lý AI khi sinh nhận xét học bạ.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
