'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  QrCode,
  Copy,
  Share2,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  Layers,
  CheckCircle2,
  Smile,
  Palette,
  FileText,
  AlertCircle,
  Eye,
  Send,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { HomeworkAssignment, CustomSubject } from '@/types';
import { DEFAULT_SUBJECT_THEMES, getSubjectTheme } from '@/lib/timetable-data';
import { toast } from 'sonner';
import Link from 'next/link';

export default function HomeworkPage() {
  const {
    classInfo,
    homeworks,
    addHomework,
    updateHomework,
    deleteHomework,
    customSubjects,
    addCustomSubject,
    deleteCustomSubject,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'HOMEWORK' | 'SUBJECTS'>('HOMEWORK');

  // Homework Modal State
  const [isHwModalOpen, setIsHwModalOpen] = useState(false);
  const [editingHw, setEditingHw] = useState<HomeworkAssignment | null>(null);
  const [hwForm, setHwForm] = useState<{
    subjectCode: string;
    subjectName: string;
    title: string;
    description: string;
    attachmentUrl: string;
    assignedDate: string;
    dueDate: string;
    reminderNotes: string;
  }>({
    subjectCode: 'TOAN',
    subjectName: 'Toán học',
    title: '',
    description: '',
    attachmentUrl: '',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    reminderNotes: '',
  });

  // Custom Subject Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subForm, setSubForm] = useState<{
    code: string;
    name: string;
    shortName: string;
    icon: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    category: 'CORE' | 'ENRICHMENT' | 'CLUB';
  }>({
    code: '',
    name: '',
    shortName: '',
    icon: '🤖',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-800',
    borderColor: 'border-cyan-200',
    category: 'ENRICHMENT',
  });

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // All combined subjects for dropdown
  const allSubjects = [
    ...DEFAULT_SUBJECT_THEMES.map((s) => ({ ...s, isDefault: true })),
    ...customSubjects.map((s) => ({ ...s, isDefault: false })),
  ];

  // Public Class Portal Link (Using secure random shareToken)
  const shareToken = classInfo.shareToken || 'c4a1-8f92a4';
  const publicPortalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/hw/${shareToken}`
    : `https://gvcn-eta.vercel.app/hw/${shareToken}`;

  // QR Code Image API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(publicPortalUrl)}`;

  // Open Create / Edit Homework Modal
  const handleOpenHwModal = (hw?: HomeworkAssignment) => {
    if (hw) {
      setEditingHw(hw);
      setHwForm({
        subjectCode: hw.subjectCode,
        subjectName: hw.subjectName,
        title: hw.title,
        description: hw.description,
        attachmentUrl: hw.attachmentUrl || '',
        assignedDate: hw.assignedDate,
        dueDate: hw.dueDate,
        reminderNotes: hw.reminderNotes || '',
      });
    } else {
      setEditingHw(null);
      setHwForm({
        subjectCode: allSubjects[0]?.code || 'TOAN',
        subjectName: allSubjects[0]?.name || 'Toán học',
        title: '',
        description: '',
        attachmentUrl: '',
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        reminderNotes: '',
      });
    }
    setIsHwModalOpen(true);
  };

  const handleSaveHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwForm.title.trim() || !hwForm.description.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung bài tập');
      return;
    }

    const selectedSub = allSubjects.find((s) => s.code === hwForm.subjectCode);
    const subName = selectedSub?.name || hwForm.subjectName;

    if (editingHw) {
      updateHomework({
        ...editingHw,
        ...hwForm,
        subjectName: subName,
      });
      toast.success('Đã cập nhật bài tập!');
    } else {
      addHomework({
        classId: classInfo.id,
        className: classInfo.name,
        subjectCode: hwForm.subjectCode,
        subjectName: subName,
        title: hwForm.title,
        description: hwForm.description,
        attachmentUrl: hwForm.attachmentUrl || undefined,
        assignedDate: hwForm.assignedDate,
        dueDate: hwForm.dueDate,
        reminderNotes: hwForm.reminderNotes || undefined,
      });
      toast.success(`Đã giao bài tập môn ${subName} cho Lớp ${classInfo.name}!`);
    }
    setIsHwModalOpen(false);
  };

  const handleDeleteHw = (id: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài tập "${title}"?`)) {
      deleteHomework(id);
      toast.success('Đã xóa bài tập');
    }
  };

  // Add Custom Subject
  const handleSaveCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.name.trim() || !subForm.shortName.trim()) {
      toast.error('Vui lòng nhập tên môn và tên viết tắt');
      return;
    }

    const code = subForm.code.trim()
      ? subForm.code.toUpperCase().replace(/\s+/g, '_')
      : `SUB_${Date.now()}`;

    addCustomSubject({
      code,
      name: subForm.name.trim(),
      shortName: subForm.shortName.trim(),
      icon: subForm.icon || '📚',
      bgColor: subForm.bgColor,
      textColor: subForm.textColor,
      borderColor: subForm.borderColor,
      category: subForm.category,
    });

    toast.success(`Đã thêm môn học "${subForm.name}" vào danh mục trường!`);
    setIsSubModalOpen(false);
    setSubForm({
      code: '',
      name: '',
      shortName: '',
      icon: '🤖',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-800',
      borderColor: 'border-cyan-200',
      category: 'ENRICHMENT',
    });
  };

  // Copy Zalo Message for Parents
  const handleCopyZaloMessage = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
    let msg = `📢 [DẶN DÒ BÀI TẬP VỀ NHÀ - LỚP ${classInfo.name}]\n`;
    msg += `📅 Ngày: ${todayStr}\n`;
    msg += `👩‍🏫 GVCN: ${classInfo.teacherName}\n\n`;

    if (homeworks.length === 0) {
      msg += `✨ Hôm nay các con không có bài tập về nhà. Chúc các con buổi tối vui vẻ!\n`;
    } else {
      msg += `📚 BÀI TẬP CẦN HOÀN THÀNH:\n`;
      homeworks.forEach((hw, i) => {
        const theme = getSubjectTheme(hw.subjectCode, customSubjects);
        msg += `\n${i + 1}. ${theme.icon} ${hw.subjectName.toUpperCase()}: ${hw.title}\n`;
        msg += `   - Nội dung: ${hw.description}\n`;
        if (hw.reminderNotes) msg += `   - Lưu ý: ${hw.reminderNotes}\n`;
      });
    }

    msg += `\n🔗 Phụ huynh và các con xem chi tiết phiếu bài và TKB ngày mai tại:\n👉 ${publicPortalUrl}`;

    navigator.clipboard.writeText(msg);
    toast.success('Đã sao chép tin nhắn dặn dò Zalo cho phụ huynh!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-white/20 text-blue-100 px-3 py-0.5 rounded-full text-xs font-bold border border-white/20">
              <BookOpen className="w-3.5 h-3.5" />
              <span>GIAO BÀI & CỔNG BÀI TẬP CÔNG KHAI (ZERO-LOGIN)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Quản Lý Giao Bài Tập — Lớp {classInfo.name}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm">
              Học sinh & phụ huynh quét mã QR hoặc mở link để xem bài tập và lịch học ngày mai mà <strong>không cần đăng nhập</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-white text-blue-900 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs hover:bg-blue-50 transition-colors"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Mã QR & Link Lớp</span>
            </button>

            <button
              onClick={handleCopyZaloMessage}
              className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Sao Chép Gửi Zalo</span>
            </button>

            <button
              onClick={() => handleOpenHwModal()}
              className="inline-flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Giao Bài Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('HOMEWORK')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'HOMEWORK'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Danh Sách Bài Tập Đã Giao ({homeworks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SUBJECTS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'SUBJECTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh Mục Môn Học Tùy Biến ({customSubjects.length})</span>
        </button>

        <Link
          href={`/hw/${shareToken}`}
          target="_blank"
          className="ml-auto inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Xem Cổng Học Sinh (Công Khai)</span>
          <span className="sm:hidden">Cổng HS</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </Link>
      </div>

      {/* TAB 1: HOMEWORK LIST */}
      {activeTab === 'HOMEWORK' && (
        <div className="space-y-4">
          {homeworks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
                📚
              </div>
              <h3 className="text-base font-bold text-slate-800">Chưa có bài tập nào được giao hôm nay</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bấm nút "Giao Bài Mới" để tạo bài tập về nhà cho các em học sinh. Học sinh và phụ huynh có thể xem ngay qua mã QR của lớp.
              </p>
              <button
                onClick={() => handleOpenHwModal()}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Giao Bài Tập Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeworks.map((hw) => {
                const theme = getSubjectTheme(hw.subjectCode, customSubjects);
                return (
                  <div
                    key={hw.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Subject Tag Header */}
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{theme.icon}</span>
                          <div>
                            <span
                              className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border ${theme.bgColor} ${theme.textColor} ${theme.borderColor}`}
                            >
                              {hw.subjectName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 text-slate-400">
                          <button
                            onClick={() => handleOpenHwModal(hw)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHw(hw.id, hw.title)}
                            className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Xóa bài tập"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2.5">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{hw.title}</h3>
                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                          {hw.description}
                        </p>

                        {/* Reminder Badge */}
                        {hw.reminderNotes && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start space-x-2 text-amber-900 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Dặn dò:</strong> {hw.reminderNotes}</span>
                          </div>
                        )}

                        {/* Attachment Preview */}
                        {hw.attachmentUrl && (
                          <div className="pt-2">
                            <a
                              href={hw.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-200"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Xem phiếu bài đính kèm</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Due Date */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Giao: {hw.assignedDate}</span>
                      </span>
                      <span className="font-semibold text-rose-600 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Hạn: {hw.dueDate}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOM SUBJECTS MANAGEMENT */}
      {activeTab === 'SUBJECTS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Danh Mục Môn Học Nhà Trường & Môn Tùy Biến</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thêm các môn đặc thù của trường như STEM, Kỹ năng sống, Tiếng Anh liên kết để xếp vào Thời khóa biểu và giao bài.
                </p>
              </div>

              <button
                onClick={() => setIsSubModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Môn Học Mới</span>
              </button>
            </div>

            {/* Subject Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-14 text-center">Icon</th>
                    <th className="py-2.5 px-3">Tên Môn Học</th>
                    <th className="py-2.5 px-3">Tên Viết Tắt</th>
                    <th className="py-2.5 px-3">Mã Môn</th>
                    <th className="py-2.5 px-3 text-center">Phân Loại</th>
                    <th className="py-2.5 px-3 text-center">Hiển Thị Mẫu</th>
                    <th className="py-2.5 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allSubjects.map((sub) => (
                    <tr key={sub.code} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-lg">{sub.icon}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{sub.name}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{sub.shortName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{sub.code}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.isDefault
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {sub.isDefault ? 'Bộ Giáo Dục' : 'Tùy Biến Trường'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border ${sub.bgColor} ${sub.textColor} ${sub.borderColor}`}
                        >
                          {sub.icon} {sub.shortName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {!sub.isDefault ? (
                          <button
                            onClick={() => {
                              const cs = customSubjects.find((c) => c.code === sub.code);
                              if (cs && confirm(`Bạn có muốn xóa môn học "${sub.name}"?`)) {
                                deleteCustomSubject(cs.id);
                                toast.success('Đã xóa môn học');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa môn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Mặc định</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT HOMEWORK */}
      {isHwModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingHw ? 'Chỉnh Sửa Bài Tập' : `Giao Bài Tập Mới Cho Lớp ${classInfo.name}`}
            </h3>

            <form onSubmit={handleSaveHomework} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn Học</label>
                  <select
                    value={hwForm.subjectCode}
                    onChange={(e) => {
                      const selected = allSubjects.find((s) => s.code === e.target.value);
                      setHwForm({
                        ...hwForm,
                        subjectCode: e.target.value,
                        subjectName: selected?.name || hwForm.subjectName,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {allSubjects.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hạn Hoàn Thành</label>
                  <input
                    type="date"
                    required
                    value={hwForm.dueDate}
                    onChange={(e) => setHwForm({ ...hwForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu Đề Bài Tập</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ôn tập phép nhân trang 45 Vở bài tập Toán"
                  value={hwForm.title}
                  onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội Dung Chi Tiết & Yêu Cầu</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Làm bài 1, 2, 3 trang 45. Trình bày sạch đẹp vào vở ô ly..."
                  value={hwForm.description}
                  onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đính Kèm Phiếu Bài / Link Ảnh (Tùy chọn)
                </label>
                <input
                  type="url"
                  placeholder="https://... (link ảnh đề bài hoặc link Drive)"
                  value={hwForm.attachmentUrl}
                  onChange={(e) => setHwForm({ ...hwForm, attachmentUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dặn Dò Chuẩn Bị Sách Vở / Đồ Dùng (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mang compa, thước kẻ cho tiết học ngày mai"
                  value={hwForm.reminderNotes}
                  onChange={(e) => setHwForm({ ...hwForm, reminderNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHwModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  {editingHw ? 'Lưu Thay Đổi' : 'Giao Bài Tập Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM SUBJECT */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Thêm Môn Học Tùy Biến Vào Trường</h3>

            <form onSubmit={handleSaveCustomSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Môn Học Đầy Đủ</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: STEM & Robotics"
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Viết Tắt</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: STEM"
                    value={subForm.shortName}
                    onChange={(e) => setSubForm({ ...subForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Icon Emoji</label>
                  <select
                    value={subForm.icon}
                    onChange={(e) => setSubForm({ ...subForm, icon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="🤖">🤖 Robot / STEM</option>
                    <option value="🌱">🌱 Kỹ năng sống</option>
                    <option value="🇬🇧">🇬🇧 Tiếng Anh QT</option>
                    <option value="✍️">✍️ Luyện chữ đẹp</option>
                    <option value="♟️">♟️ Cờ vua / Tư duy</option>
                    <option value="🏊‍♂️">🏊‍♂️ Bơi lội / Thể thao</option>
                    <option value="🎨">🎨 Mỹ thuật sáng tạo</option>
                    <option value="🎻">🎻 Nhạc cụ / Piano</option>
                    <option value="🔬">🔬 Thí nghiệm nhí</option>
                    <option value="📚">📚 Đọc sách thư viện</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bảng Màu Nhận Diện</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', label: 'Xanh Cyan' },
                    { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', label: 'Tím pastel' },
                    { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Xanh ngọc' },
                    { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Vàng cam' },
                    { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', label: 'Hồng sen' },
                    { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', label: 'Chàm Indigo' },
                  ].map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSubForm({
                          ...subForm,
                          bgColor: color.bg,
                          textColor: color.text,
                          borderColor: color.border,
                        })
                      }
                      className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-all ${color.bg} ${color.text} ${color.border} ${
                        subForm.bgColor === color.bg ? 'ring-2 ring-blue-600 shadow-xs' : ''
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Thêm Môn Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE & PUBLIC LINK */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Mã QR Góc Học Tập — Lớp {classInfo.name}
              </h3>
              <p className="text-xs text-slate-500">
                In mã này dán góc bàn học hoặc gửi vào nhóm Zalo phụ huynh để xem bài tập không cần đăng nhập.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <img
                src={qrCodeImageUrl}
                alt="QR Code Lớp Học"
                className="w-56 h-56 mx-auto rounded-xl shadow-xs"
              />
              <p className="text-[11px] font-bold text-slate-600 mt-2">
                Quét để vào Cổng Lớp {classInfo.name}
              </p>
            </div>

            {/* URL Box */}
            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="truncate text-slate-700">{publicPortalUrl}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicPortalUrl);
                  toast.success('Đã sao chép link công khai!');
                }}
                className="ml-2 px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-700 rounded-lg border border-slate-300 font-bold font-sans text-xs transition-colors shrink-0"
              >
                Sao chép
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
