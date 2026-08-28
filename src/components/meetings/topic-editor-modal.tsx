'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Clock,
  Layout,
  HelpCircle,
} from 'lucide-react';
import { MeetingAgendaTopic, MeetingSlideLayout } from '@/types';

interface TopicEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (topic: MeetingAgendaTopic) => void;
  initialTopic?: MeetingAgendaTopic | null;
}

const LAYOUT_OPTIONS: { id: MeetingSlideLayout; label: string; desc: string; icon: string }[] = [
  { id: 'TITLE', label: 'Bìa & Chào Mừng', desc: 'Hiển thị tiêu đề lớn, banner trường lớp', icon: '🏫' },
  { id: 'STATS', label: 'Thống Kê Số Liệu', desc: 'Dạng thẻ 4 ô sĩ số, nam/nữ, bán trú', icon: '📊' },
  { id: 'GRID_CARDS', label: 'Thẻ Nội Dung 3 Cột', desc: 'Dạng 3 thẻ nội dung (Môn học, Phẩm chất, Năng lực)', icon: '🃏' },
  { id: 'BULLETS', label: 'Danh Sách Quy Định', desc: 'Dạng các dòng gạch đầu dòng rõ ràng', icon: '📝' },
  { id: 'COMMITTEE', label: 'Ban Đại Diện CMHS', desc: 'Hiển thị danh sách ban phụ huynh lớp', icon: '👥' },
  { id: 'SPEECH', label: 'Thảo Luận & Hỏi Đáp', desc: 'Mời phát biểu, biểu quyết thông qua', icon: '🎤' },
];

export function TopicEditorModal({
  isOpen,
  onClose,
  onSave,
  initialTopic,
}: TopicEditorModalProps) {
  const [title, setTitle] = useState('');
  const [iconEmoji, setIconEmoji] = useState('📌');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [layout, setLayout] = useState<MeetingSlideLayout>('BULLETS');
  const [talkingPoints, setTalkingPoints] = useState<string[]>(['']);
  const [importantNote, setImportantNote] = useState('');

  useEffect(() => {
    if (initialTopic) {
      setTitle(initialTopic.title);
      setIconEmoji(initialTopic.iconEmoji || '📌');
      setDurationMinutes(initialTopic.durationMinutes || 15);
      setLayout(initialTopic.layout || 'BULLETS');
      setTalkingPoints(initialTopic.talkingPoints && initialTopic.talkingPoints.length > 0 ? initialTopic.talkingPoints : ['']);
      setImportantNote(initialTopic.importantNote || '');
    } else {
      setTitle('');
      setIconEmoji('📌');
      setDurationMinutes(15);
      setLayout('BULLETS');
      setTalkingPoints(['']);
      setImportantNote('');
    }
  }, [initialTopic, isOpen]);

  if (!isOpen) return null;

  const handleAddPoint = () => {
    setTalkingPoints([...talkingPoints, '']);
  };

  const handleUpdatePoint = (index: number, val: string) => {
    const updated = [...talkingPoints];
    updated[index] = val;
    setTalkingPoints(updated);
  };

  const handleRemovePoint = (index: number) => {
    if (talkingPoints.length <= 1) return;
    setTalkingPoints(talkingPoints.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const cleanPoints = talkingPoints.map((p) => p.trim()).filter(Boolean);

    const topicData: MeetingAgendaTopic = {
      id: initialTopic ? initialTopic.id : `ag-${Date.now()}`,
      title: title.trim(),
      iconEmoji: iconEmoji.trim() || '📌',
      durationMinutes,
      layout,
      talkingPoints: cleanPoints.length > 0 ? cleanPoints : ['Chưa có nội dung chi tiết'],
      importantNote: importantNote.trim(),
      isEnabled: initialTopic ? initialTopic.isEnabled : true,
    };

    onSave(topicData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{iconEmoji}</span>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight">
                {initialTopic ? 'Chỉnh Sửa Phần Nội Dung Trao Đổi' : 'Thêm Phần Nội Dung Mới Trong Cuộc Họp'}
              </h3>
              <p className="text-xs text-blue-100">
                Tùy chỉnh tiêu đề, các ý cần trao đổi và kiểu hiển thị khi chiếu TV
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block font-bold text-slate-800 mb-1">Emoji Biểu Tượng:</label>
              <input
                type="text"
                value={iconEmoji}
                onChange={(e) => setIconEmoji(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-center text-lg bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Tiêu Đề Nội Dung (*):</label>
              <input
                type="text"
                placeholder="VD: Kế hoạch bán trú & dinh dưỡng học đường..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block font-bold text-slate-800 mb-1">Thời Lượng (Phút):</label>
              <input
                type="number"
                min={1}
                max={120}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-center"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">Kiểu Trình Chiếu Lên TV (Slide Layout):</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLayout(opt.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                    layout === opt.id
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl shrink-0">{opt.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] truncate">{opt.label}</p>
                    <p className="text-[9px] text-slate-500 line-clamp-1">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Các Ý Chính Cô Giáo Cần Trao Đổi (Talking Points):
              </label>
              <button
                type="button"
                onClick={handleAddPoint}
                className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Dòng</span>
              </button>
            </div>

            <div className="space-y-2">
              {talkingPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`Luận điểm ${idx + 1}...`}
                    value={point}
                    onChange={(e) => handleUpdatePoint(idx, e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  {talkingPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Lưu Ý Sư Phạm & Dặn Dò Riêng (Chỉ Cô Giáo Thấy):
            </label>
            <textarea
              rows={2}
              value={importantNote}
              onChange={(e) => setImportantNote(e.target.value)}
              placeholder="VD: Cần nhấn mạnh tính tự lập, giải thích nhẹ nhàng tránh làm phụ huynh lo lắng..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu Phần Nội Dung</span>
          </button>
        </div>
      </div>
    </div>
  );
}
