'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Sparkles,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Trash2,
  Lock,
  Globe,
  ExternalLink,
  Users,
  X,
  MessageSquare,
  Utensils,
  Smile,
  Check,
  Send,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Student, FormativeNote, FormativeNoteCategory, NoteVisibility } from '@/types';
import { VoiceInputButton } from '@/components/ui/voice-input-button';
import { getLocalDateString } from '@/lib/tt27-engine';
import { toast } from 'sonner';

const CATEGORY_CONFIG: Record<
  FormativeNoteCategory,
  { label: string; icon: string; color: string; bgBadge: string }
> = {
  TIEN_BO: {
    label: 'Tiến bộ & Khen ngợi',
    icon: '🌟',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    bgBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  CAN_CO_GANG: {
    label: 'Cần cố gắng & Nhắc nhở',
    icon: '⚠️',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    bgBadge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  SUC_KHOE: {
    label: 'Sức khỏe & Thể trạng',
    icon: '🏥',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    bgBadge: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  BAN_TRU: {
    label: 'Ăn ngủ bán trú',
    icon: '🍱',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    bgBadge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  TRAO_DOI_PH: {
    label: 'Dặn dò Phụ huynh',
    icon: '💬',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    bgBadge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  KHAC: {
    label: 'Ghi chú khác',
    icon: '📌',
    color: 'text-slate-700 bg-slate-50 border-slate-200',
    bgBadge: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

const PRESET_OBSERVATIONS: {
  tag: string;
  category: FormativeNoteCategory;
  title: string;
  defaultText: string;
}[] = [
  {
    tag: '🌟 Hăng hái phát biểu',
    category: 'TIEN_BO',
    title: 'Hăng hái phát biểu',
    defaultText: 'Hôm nay con rất tích cực giơ tay phát biểu, tự tin chia sẻ ý kiến trước lớp.',
  },
  {
    tag: '✍️ Chữ viết tiến bộ',
    category: 'TIEN_BO',
    title: 'Chữ viết tiến bộ',
    defaultText: 'Chữ viết hôm nay sạch đẹp, trình bày bài cẩn thận, tiến bộ rõ rệt.',
  },
  {
    tag: '💡 Tiếp thu bài nhanh',
    category: 'TIEN_BO',
    title: 'Hiểu bài nhanh',
    defaultText: 'Con nắm chắc kiến thức bài học mới, hoàn thành bài tập nhanh và chính xác.',
  },
  {
    tag: '🤝 Giúp đỡ bạn bè',
    category: 'TIEN_BO',
    title: 'Biết chia sẻ, giúp bạn',
    defaultText: 'Có tinh thần tương thân tương ái, vui vẻ chia sẻ đồ dùng và hướng dẫn bạn trong giờ học.',
  },
  {
    tag: '🍱 Ăn trưa ngoan',
    category: 'BAN_TRU',
    title: 'Ăn bán trú tốt',
    defaultText: 'Con ăn trưa nhanh, ăn hết suất cơm, có ý thức giữ gìn vệ sinh khay ăn sạch sẽ.',
  },
  {
    tag: '⚠️ Quên vở bài tập',
    category: 'CAN_CO_GANG',
    title: 'Quên vở bài tập',
    defaultText: 'Hôm nay con quên mang vở bài tập về nhà. Nhờ bố mẹ nhắc con kiểm tra cặp trước khi đi ngủ nhé.',
  },
  {
    tag: '⚠️ Mất tập trung',
    category: 'CAN_CO_GANG',
    title: 'Còn nói chuyện trong giờ',
    defaultText: 'Con còn nói chuyện riêng trong tiết học. Cô đã nhắc nhở và con đã chú ý nghe giảng hơn.',
  },
  {
    tag: '⚠️ Quên đồ dùng học tập',
    category: 'CAN_CO_GANG',
    title: 'Thiếu đồ dùng học tập',
    defaultText: 'Con chưa mang đủ đồ dùng (thước kẻ/bút chì). Bố mẹ hỗ trợ chuẩn bị thêm cho con nhé.',
  },
  {
    tag: '🏥 Kêu mệt / Sốt nhẹ',
    category: 'SUC_KHOE',
    title: 'Sức khỏe cần theo dõi',
    defaultText: 'Con có biểu hiện mệt, hơi ấm đầu sau giờ chơi. Cô đã cho con uống nước ấm và nghỉ ngơi, bố mẹ để ý thêm tối nay nhé.',
  },
  {
    tag: '💬 Nhắc kiểm tra bài',
    category: 'TRAO_DOI_PH',
    title: 'Nhắc nhở ôn bài tối',
    defaultText: 'Tối nay bố mẹ dành 15 phút cùng con ôn lại bài học và đọc trước bài mới ngày mai nhé.',
  },
];

export default function DailyNotesPage() {
  const {
    students,
    classInfo,
    formativeNotes,
    addFormativeNote,
    deleteFormativeNote,
    addBatchFormativeNotes,
    aiConfig,
  } = useAppStore();

  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<'ALL' | number>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HAS_NOTE' | 'NO_NOTE' | 'ALERT' | 'ACKED'>('ALL');

  // Modal State for Single Student Note
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<Student | null>(null);
  const [noteCategory, setNoteCategory] = useState<FormativeNoteCategory>('TIEN_BO');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [noteVisibility, setNoteVisibility] = useState<NoteVisibility>('PARENT');
  const [isImportant, setIsImportant] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  // Broadcast Note Modal
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | number>('ALL');
  const [broadcastCategory, setBroadcastCategory] = useState<FormativeNoteCategory>('TRAO_DOI_PH');
  const [broadcastTitle, setBroadcastTitle] = useState('Dặn dò chung cả lớp');
  const [broadcastContent, setBroadcastContent] = useState('');

  // View Student History Modal
  const [viewHistoryStudent, setViewHistoryStudent] = useState<Student | null>(null);

  const numTeams = classInfo.numberOfTeams && classInfo.numberOfTeams >= 2 ? classInfo.numberOfTeams : 4;

  const getStudentTeam = (st: Student, idx: number): number => {
    const tagTeam = (st.tags || []).find((t) => t.includes('Tổ '));
    if (tagTeam) {
      const match = tagTeam.match(/Tổ\s*(\d)/i);
      if (match && match[1]) return Number(match[1]);
    }
    return (idx % numTeams) + 1;
  };

  // Notes for the selected date
  const dateNotes = useMemo(() => {
    return formativeNotes.filter((n) => n.date === selectedDate);
  }, [formativeNotes, selectedDate]);

  // Map students with their notes on selected date
  const studentRows = useMemo(() => {
    return students.map((st, idx) => {
      const teamId = getStudentTeam(st, idx);
      const studentDayNotes = dateNotes.filter((n) => n.studentId === st.id);
      const allStudentNotes = formativeNotes.filter((n) => n.studentId === st.id);
      const hasNote = studentDayNotes.length > 0;
      const hasAlert = studentDayNotes.some((n) => n.category === 'CAN_CO_GANG' || n.category === 'SUC_KHOE');
      const hasAcked = studentDayNotes.some((n) => n.parentAcknowledged);

      return {
        student: st,
        teamId,
        studentDayNotes,
        allStudentNotes,
        hasNote,
        hasAlert,
        hasAcked,
      };
    });
  }, [students, dateNotes, formativeNotes, numTeams]);

  // Filtered list
  const filteredRows = useMemo(() => {
    return studentRows.filter(({ student, teamId, hasNote, hasAlert, hasAcked }) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        student.fullName.toLowerCase().includes(q) ||
        student.studentCode.toLowerCase().includes(q) ||
        (student.parentPhone && student.parentPhone.includes(q));

      const matchTeam = teamFilter === 'ALL' || teamId === teamFilter;

      let matchStatus = true;
      if (statusFilter === 'HAS_NOTE') matchStatus = hasNote;
      if (statusFilter === 'NO_NOTE') matchStatus = !hasNote;
      if (statusFilter === 'ALERT') matchStatus = hasAlert;
      if (statusFilter === 'ACKED') matchStatus = hasAcked;

      return matchSearch && matchTeam && matchStatus;
    });
  }, [studentRows, searchTerm, teamFilter, statusFilter]);

  // Date Navigation
  const changeDateBy = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === getLocalDateString();

  // Handle Opening Quick Note Modal
  const openNoteModal = (student: Student, preset?: typeof PRESET_OBSERVATIONS[0]) => {
    setSelectedStudentForNote(student);
    if (preset) {
      setNoteCategory(preset.category);
      setNoteTitle(preset.title);
      setNoteContent(preset.defaultText);
      setSelectedTags([preset.tag.replace(/^[^\w\sÀ-ỹ]+/u, '').trim()]);
    } else {
      setNoteCategory('TIEN_BO');
      setNoteTitle('Biểu hiện tích cực hôm nay');
      setNoteContent('');
      setSelectedTags([]);
    }
    setNoteVisibility('PARENT');
    setIsImportant(false);
  };

  // Submit Single Note
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForNote) return;
    if (!noteContent.trim()) {
      toast.error('Vui lòng nhập nội dung nhận xét!');
      return;
    }

    addFormativeNote({
      studentId: selectedStudentForNote.id,
      studentName: selectedStudentForNote.fullName,
      classId: selectedStudentForNote.classId || classInfo.id || 'class-4a1',
      date: selectedDate,
      category: noteCategory,
      title: noteTitle.trim() || CATEGORY_CONFIG[noteCategory].label,
      content: noteContent.trim(),
      tags: selectedTags,
      isImportant,
      visibility: noteVisibility,
      parentAcknowledged: false,
    });

    setSelectedStudentForNote(null);
  };

  // AI Polish
  const handleAIPolish = async () => {
    if (!selectedStudentForNote || !noteContent.trim()) {
      toast.error('Vui lòng nhập một vài từ ghi chú trước khi làm mượt!');
      return;
    }

    setIsPolishing(true);
    try {
      const res = await fetch('/api/daily-remark-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNote: noteContent,
          studentName: selectedStudentForNote.fullName,
          category: noteCategory,
          aiConfig,
        }),
      });
      const data = await res.json();
      if (data.success && data.polished) {
        setNoteContent(data.polished);
        toast.success(`Đã làm mượt câu chữ bằng AI (${data.source})!`);
      } else {
        toast.error(data.error || 'Không thể làm mượt ghi chú');
      }
    } catch (err) {
      toast.error('Lỗi kết nối khi gọi AI làm mượt');
    } finally {
      setIsPolishing(false);
    }
  };

  // Broadcast note to all or team
  const handleSaveBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastContent.trim()) {
      toast.error('Vui lòng nhập nội dung dặn dò chung!');
      return;
    }

    const targetStudents = students.filter((st, idx) => {
      if (broadcastTarget === 'ALL') return true;
      return getStudentTeam(st, idx) === broadcastTarget;
    });

    if (targetStudents.length === 0) {
      toast.error('Không tìm thấy học sinh phù hợp để gửi!');
      return;
    }

    const batchNotes = targetStudents.map((st) => ({
      studentId: st.id,
      studentName: st.fullName,
      classId: st.classId || classInfo.id || 'class-4a1',
      date: selectedDate,
      category: broadcastCategory,
      title: broadcastTitle.trim() || 'Dặn dò chung',
      content: broadcastContent.trim(),
      tags: ['Dặn dò chung'],
      isImportant: false,
      visibility: 'PARENT' as NoteVisibility,
      parentAcknowledged: false,
    }));

    addBatchFormativeNotes(batchNotes);
    setIsBroadcastModalOpen(false);
    setBroadcastContent('');
  };

  // Copy Zalo Message for a specific student
  const copyZaloMessage = (student: Student, studentDayNotes: FormativeNote[]) => {
    const lastName = student.fullName.split(' ').pop();
    const portalUrl = student.shareToken
      ? `${window.location.origin}/student/${student.shareToken}`
      : `${window.location.origin}/student/${student.id}`;

    let notesText = '';
    if (studentDayNotes.length > 0) {
      notesText = studentDayNotes
        .map((n) => `• ${n.title}: ${n.content}`)
        .join('\n');
    } else {
      notesText = `• Hôm nay con đi học ngoan ngoãn, hoàn thành tốt các hoạt động ở lớp.`;
    }

    const message = `[GVCN LỚP ${classInfo.name || 'TIỂU HỌC'}] - NHẬT KÝ HÔM NAY (${selectedDate})\n` +
      `Kính gửi Phụ huynh em ${student.fullName},\n\n` +
      `Cô giáo gửi thông tin theo dõi của con trong ngày:\n` +
      `${notesText}\n\n` +
      `👉 Phụ huynh xem chi tiết & bấm xác nhận tại góc học tập của con:\n${portalUrl}\n\n` +
      `Trân trọng,\nCô giáo chủ nhiệm.`;

    navigator.clipboard.writeText(message);
    toast.success(`Đã sao chép tin nhắn Zalo gửi phụ huynh em ${lastName}!`);
  };

  // Stats calculation
  const totalNotesCount = dateNotes.length;
  const praiseCount = dateNotes.filter((n) => n.category === 'TIEN_BO').length;
  const alertCount = dateNotes.filter((n) => n.category === 'CAN_CO_GANG' || n.category === 'SUC_KHOE').length;
  const parentDandocCount = dateNotes.filter((n) => n.category === 'TRAO_DOI_PH').length;
  const ackedCount = dateNotes.filter((n) => n.parentAcknowledged).length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & DATE SELECTOR */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white">
              ⚡ Tác Nghiệp Thường Xuyên
            </span>
            <span className="bg-emerald-400 text-emerald-950 px-2.5 py-0.5 rounded-full text-xs font-black">
              Lớp {classInfo.name || '4A1'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Sổ Nhật Ký & Nhận Xét Hàng Ngày
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Ghi nhận biểu hiện học tập, nề nếp, sức khỏe, ăn ngủ bán trú và dặn dò phụ huynh tức thời qua Sổ liên lạc số 4.0.
          </p>
        </div>

        {/* Date Control */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => changeDateBy(-1)}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              title="Ngày trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 px-3 py-1 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-xs">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="font-mono text-xs font-bold focus:outline-none bg-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => changeDateBy(1)}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              title="Ngày sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(getLocalDateString())}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs text-center cursor-pointer"
            >
              Về Hôm Nay
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dặn Dò Cả Lớp</span>
          </button>
        </div>
      </div>

      {/* 2. STATS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hôm Nay Ghi Nhận</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{totalNotesCount}</span>
            <span className="text-xs text-slate-400">ghi chú</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <span>🌟 Khen Ngợi</span>
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">{praiseCount}</span>
            <span className="text-xs text-slate-400">lượt</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <span>⚠️ Cần Lưu Ý</span>
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700">{alertCount}</span>
            <span className="text-xs text-slate-400">nhắc nhở</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
            <span>💬 Dặn Phụ Huynh</span>
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-700">{parentDandocCount}</span>
            <span className="text-xs text-slate-400">tin nhắn</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>PH Đã Đọc</span>
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-700">{ackedCount}</span>
            <span className="text-xs text-slate-400">xác nhận</span>
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã định danh, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Toàn Bộ Lớp (Tất cả tổ)</option>
            {Array.from({ length: numTeams }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tổ {i + 1}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="HAS_NOTE">Đã có nhận xét hôm nay</option>
            <option value="NO_NOTE">Chưa có nhận xét hôm nay</option>
            <option value="ALERT">Có nhắc nhở / sức khỏe</option>
            <option value="ACKED">Phụ huynh đã bấm xác nhận</option>
          </select>
        </div>
      </div>

      {/* 4. STUDENT MATRIX LIST */}
      <div className="space-y-3">
        {filteredRows.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 space-y-3">
            <Smile className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-black text-slate-700 text-sm">Không tìm thấy học sinh phù hợp</h3>
            <p className="text-xs text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredRows.map(({ student, teamId, studentDayNotes, allStudentNotes, hasNote, hasAlert, hasAcked }) => {
              return (
                <div
                  key={student.id}
                  className={`bg-white rounded-2xl border p-4 transition-all shadow-2xs flex flex-col justify-between space-y-3 ${
                    hasAlert
                      ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200'
                      : hasNote
                      ? 'border-blue-200 hover:border-blue-300'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Student Info & Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-base font-black shrink-0 shadow-2xs">
                          {student.gender === 'Nữ' ? '👧' : '👦'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                              {student.fullName}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                              Tổ {teamId}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            Mã: {student.studentCode} • {student.isBoarding ? 'Ăn bán trú' : 'Không bán trú'}
                          </p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {hasAcked && (
                          <span
                            className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            title="Phụ huynh đã xác nhận đã đọc"
                          >
                            <Heart className="w-3 h-3 fill-rose-600 text-rose-600" />
                            <span>PH đã đọc</span>
                          </span>
                        )}
                        {hasNote ? (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {studentDayNotes.length} ghi chú
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            Chưa ghi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Today's Notes Preview */}
                    {studentDayNotes.length > 0 ? (
                      <div className="mt-2.5 space-y-2">
                        {studentDayNotes.map((note) => {
                          const conf = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.KHAC;
                          return (
                            <div
                              key={note.id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${conf.bgBadge}`}>
                                  {conf.icon} {note.title}
                                </span>
                                <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                                  {note.visibility === 'PRIVATE_TEACHER' ? (
                                    <span className="flex items-center gap-0.5 text-slate-500" title="Chỉ GVCN thấy">
                                      <Lock className="w-2.5 h-2.5" /> Nội bộ
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-0.5 text-blue-600" title="Gửi phụ huynh xem">
                                      <Globe className="w-2.5 h-2.5" /> Gửi PH
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => deleteFormativeNote(note.id)}
                                    className="p-1 hover:text-rose-600 transition-colors"
                                    title="Xóa nhận xét này"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-slate-700 leading-relaxed break-words">{note.content}</p>
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {note.tags.map((t, tidx) => (
                                    <span key={tidx} className="text-[9px] bg-white text-slate-500 border border-slate-200 px-1.5 py-0.2 rounded">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Quick 1-Tap Chips when no note yet */
                      <div className="mt-2.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Chạm 1 lần để nhận xét nhanh:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_OBSERVATIONS.slice(0, 4).map((preset, pidx) => (
                            <button
                              key={pidx}
                              type="button"
                              onClick={() => openNoteModal(student, preset)}
                              className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 font-semibold transition-all cursor-pointer"
                            >
                              {preset.tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => openNoteModal(student)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm nhận xét</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyZaloMessage(student, studentDayNotes)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Sao chép tin nhắn Zalo gửi Phụ Huynh"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewHistoryStudent(student)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 p-1 transition-colors"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Xem lịch sử ({allStudentNotes.length})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. MODAL: THÊM NHẬN XÉT CHO HỌC SINH */}
      {selectedStudentForNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  ✍️
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    Ghi Nhận Xét Cho Em {selectedStudentForNote.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ngày áp dụng: <span className="font-bold text-blue-600">{selectedDate}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForNote(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveNote} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Danh mục nhận xét:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(Object.keys(CATEGORY_CONFIG) as FormativeNoteCategory[]).map((cat) => {
                    const conf = CATEGORY_CONFIG[cat];
                    const isSelected = noteCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNoteCategory(cat)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? `${conf.color} ring-2 ring-blue-400 font-black shadow-2xs`
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-bold'
                        }`}
                      >
                        <span className="mr-1">{conf.icon}</span> {conf.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presets Chips */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Gợi ý tình huống nhanh (Click để chọn):</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_OBSERVATIONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNoteCategory(preset.category);
                        setNoteTitle(preset.title);
                        setNoteContent(preset.defaultText);
                        const cleanTag = preset.tag.replace(/^[^\w\sÀ-ỹ]+/u, '').trim();
                        setSelectedTags([cleanTag]);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 transition-colors cursor-pointer"
                    >
                      {preset.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tiêu đề ghi chú:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hăng hái phát biểu môn Toán, Quên mang vở bài tập..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Content with Voice & AI Polish */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Nội dung chi tiết (hoặc bấm Micro đọc):</label>
                  <button
                    type="button"
                    disabled={isPolishing}
                    onClick={handleAIPolish}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isPolishing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>✨ Làm mượt bằng AI</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    required
                    placeholder="Mô tả cụ thể biểu hiện của con trong ngày..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                  <div className="absolute right-2 top-2">
                    <VoiceInputButton
                      size="sm"
                      title="Nói để nhập nhận xét"
                      onResult={(text) => {
                        setNoteContent((prev) => (prev ? `${prev} ${text}` : text));
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Visibility & Important Flag */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-700 text-[11px]">Quyền xem:</span>
                  <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={noteVisibility === 'PARENT'}
                      onChange={() => setNoteVisibility('PARENT')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex items-center gap-1 text-blue-700">
                      <Globe className="w-3.5 h-3.5" /> Gửi Phụ Huynh
                    </span>
                  </label>

                  <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={noteVisibility === 'PRIVATE_TEACHER'}
                      onChange={() => setNoteVisibility('PRIVATE_TEACHER')}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <span className="flex items-center gap-1 text-slate-600">
                      <Lock className="w-3.5 h-3.5" /> Chỉ GVCN xem
                    </span>
                  </label>
                </div>

                <label className="flex items-center space-x-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Ưu tiên nạp vào AI học bạ TT27</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForNote(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Lưu Nhận Xét
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: DẶN DÒ CHUNG CẢ LỚP (BROADCAST) */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  📢
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    Gửi Dặn Dò Chung Cho Toàn Lớp
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tự động tạo ghi chú cho từng học sinh và đồng bộ lên cổng phụ huynh
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBroadcast} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Đối tượng nhận:</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Toàn bộ {students.length} học sinh trong lớp</option>
                  {Array.from({ length: numTeams }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Chỉ gửi Tổ {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tiêu đề thông báo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nhắc mang đồng phục thể dục, Dặn chuẩn bị đất nặn..."
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nội dung dặn dò:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ví dụ: Ngày mai lớp có tiết Mĩ thuật và Thể dục, nhờ bố mẹ cho con mặc đồng phục và chuẩn bị đủ kéo, đất nặn..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Gửi Cho Cả Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: XEM LỊCH SỬ NHẬN XÉT HỌC SINH */}
      {viewHistoryStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  📋
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    Lịch Sử Nhật Ký Nhận Xét — {viewHistoryStudent.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Toàn bộ biểu hiện học tập & nề nếp đã được giáo viên ghi nhận
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewHistoryStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-xs">
              {formativeNotes.filter((n) => n.studentId === viewHistoryStudent.id).length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Chưa có nhận xét nào trong quá khứ cho em {viewHistoryStudent.fullName}.
                </div>
              ) : (
                formativeNotes
                  .filter((n) => n.studentId === viewHistoryStudent.id)
                  .map((item) => {
                    const conf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.KHAC;
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${conf.bgBadge}`}>
                              {conf.icon} {item.title}
                            </span>
                            {item.isImportant && (
                              <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                                Quan trọng
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{item.date}</span>
                            <button
                              type="button"
                              onClick={() => deleteFormativeNote(item.id)}
                              className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                              title="Xóa nhận xét"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-700 leading-relaxed">{item.content}</p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">
                            {item.visibility === 'PRIVATE_TEACHER' ? '🔒 Chỉ GVCN xem' : '🌐 Gửi phụ huynh'}
                          </span>
                          {item.parentAcknowledged ? (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <Heart className="w-3 h-3 fill-rose-500" />
                              <span>Phụ huynh đã đọc ({item.parentAcknowledgedAt?.slice(0, 10)})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Chưa có phản hồi từ phụ huynh</span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewHistoryStudent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
