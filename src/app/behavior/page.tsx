'use client';

import React, { useState, useMemo } from 'react';
import {
  Award,
  Sparkles,
  Plus,
  Minus,
  Star,
  Users,
  Flame,
  History,
  CheckCircle,
  Trophy,
  MessageSquare,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Heart,
  BookOpen,
  CheckCircle2,
  Trash2,
  Eye,
  Smile,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Student, StarLog } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const BEHAVIOR_PRESETS = [
  { label: 'Phát biểu hăng hái', points: 1, category: 'Học tập', icon: '🙋‍♂️', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Làm bài xuất sắc', points: 2, category: 'Học tập', icon: '📝', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Vở sạch chữ đẹp', points: 2, category: 'Học tập', icon: '✍️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Tiến bộ môn Toán/Tiếng Việt', points: 2, category: 'Học tập', icon: '📈', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'Giúp đỡ bạn bè', points: 1, category: 'Phẩm chất', icon: '🤝', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Trung thực, thật thà', points: 2, category: 'Phẩm chất', icon: '💎', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { label: 'Giữ gìn vệ sinh lớp học', points: 1, category: 'Nề nếp', icon: '🧹', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { label: 'Xếp hàng & nề nếp gương mẫu', points: 2, category: 'Nề nếp', icon: '⭐', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { label: 'Tích cực hoạt động nhóm', points: 1, category: 'Nề nếp', icon: '👥', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { label: 'Mất trật tự trong giờ', points: -1, category: 'Nhắc nhở', icon: '⚠️', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Chưa hoàn thành bài tập', points: -1, category: 'Nhắc nhở', icon: '❌', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Quên mang sách vở / đồ dùng', points: -1, category: 'Nhắc nhở', icon: '🎒', color: 'bg-orange-50 text-orange-700 border-orange-200' },
];

const COMMENT_SUGGESTIONS = [
  'Hôm nay em rất hăng hái phát biểu và tiếp thu bài nhanh.',
  'Em có ý thức giữ gìn vệ sinh chung và tích cực trực nhật lớp.',
  'Chữ viết sạch đẹp, trình bày bài cẩn thận, đáng khen ngợi!',
  'Em rất nhiệt tình giúp đỡ bạn bè cùng tiến bộ trong giờ học.',
  'Cần tập trung chú ý nghe giảng hơn trong các tiết buổi chiều.',
  'Đã có nhiều tiến bộ rõ rệt trong các bài toán tính toán nhanh.',
  'Cần chuẩn bị đầy đủ đồ dùng học tập (thước kẻ, compa) trước khi vào lớp.',
];

export default function BehaviorPage() {
  const { students, starLogs, addStarLog, deleteStarLog, getStudentStars, classInfo } = useAppStore();
  const [activeTab, setActiveTab] = useState<'TABLE' | 'CARDS' | 'HISTORY'>('TABLE');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK'>('ALL');

  // Modal State for Custom Daily Assessment & Comment
  const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
  const [selectedStudentForAssess, setSelectedStudentForAssess] = useState<Student | null>(null);
  const [assessDate, setAssessDate] = useState(new Date().toISOString().split('T')[0]);
  const [assessCategory, setAssessCategory] = useState('Học tập');
  const [assessReason, setAssessReason] = useState('Phát biểu hăng hái');
  const [assessPoints, setAssessPoints] = useState(1);
  const [assessComment, setAssessComment] = useState('');

  // Modal State for Student History Details
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  // Quick Award Handler
  const handleQuickAward = (student: Student, points: number, category: string, reason: string) => {
    addStarLog(student.id, points, category, reason, undefined, new Date().toISOString().split('T')[0]);

    if (points > 0) {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 },
      });
      toast.success(`Đã cộng +${points} ⭐ cho em ${student.fullName}!`);
    } else {
      toast.info(`Đã trừ ${Math.abs(points)} sao của em ${student.fullName}`);
    }
  };

  // Open Full Assessment Modal
  const handleOpenAssessModal = (student: Student) => {
    setSelectedStudentForAssess(student);
    setAssessDate(new Date().toISOString().split('T')[0]);
    setAssessCategory('Học tập');
    setAssessReason('Phát biểu hăng hái');
    setAssessPoints(1);
    setAssessComment('');
    setIsAssessModalOpen(true);
  };

  // Save Custom Daily Assessment & Comment
  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAssess) return;

    addStarLog(
      selectedStudentForAssess.id,
      assessPoints,
      assessCategory,
      assessReason,
      assessComment,
      assessDate
    );

    if (assessPoints > 0) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
    toast.success(`Đã lưu nhận xét & đánh giá cho em ${selectedStudentForAssess.fullName}!`);
    setIsAssessModalOpen(false);
  };

  // Award Whole Class
  const handleAwardWholeClass = () => {
    if (confirm('Bạn có muốn cộng +1 ⭐ nề nếp cho TẤT CẢ học sinh trong lớp không?')) {
      const todayStr = new Date().toISOString().split('T')[0];
      students.forEach((s) => {
        addStarLog(s.id, 1, 'Khen thưởng cả lớp', 'Cả lớp giữ nề nếp tốt', 'Tập thể gương mẫu, tích cực xây dựng bài', todayStr);
      });
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      toast.success('Đã thưởng +1 ⭐ cho cả lớp! 🎉');
    }
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [students, searchQuery]);

  // Export Daily Behavior & Comments to Excel
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã Học Sinh',
      'Họ và Tên',
      'Giới Tính',
      'Tổng Sao Hiện Tại',
      'Đánh Giá / Nhận Xét Gần Nhất',
      'Nội Dung / Lý Do',
      'Ngày Nhận Xét',
    ];

    const rows = students.map((st, idx) => {
      const studentLogs = starLogs.filter((l) => l.studentId === st.id);
      const totalStars = studentLogs.reduce((sum, l) => sum + l.points, 0);
      const latestLog = studentLogs[0];

      return [
        idx + 1,
        st.studentCode,
        st.fullName,
        st.gender,
        totalStars,
        latestLog?.comment || '(Chưa có nhận xét riêng)',
        latestLog ? `${latestLog.category} - ${latestLog.reason} (${latestLog.points > 0 ? `+${latestLog.points}` : latestLog.points} ⭐)` : 'Chưa có',
        latestLog ? new Date(latestLog.createdAt).toLocaleDateString('vi-VN') : '',
      ];
    });

    const titleRows = [
      [`BẢNG TỔNG HỢP NỀ NẾP & NHẬN XÉT HÀNG NGÀY - LỚP ${classInfo.name}`],
      [`Năm học: ${classInfo.schoolYear} - Giáo viên chủ nhiệm: ${classInfo.teacherName}`],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 24 },
      { wch: 10 },
      { wch: 16 },
      { wch: 45 },
      { wch: 30 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NhanXet_NeNep');
    XLSX.writeFile(workbook, `Bang_Nhan_Xet_Ne_Nep_Lop_${classInfo.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Đã xuất file Excel bảng nhận xét nề nếp thành công!');
  };

  // Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = starLogs.filter((l) => (l.date || l.createdAt.split('T')[0]) === todayStr);
  const totalStarsGivenToday = todayLogs.reduce((sum, l) => sum + l.points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-500" />
            <span>Nề Nếp, Tích Sao & Nhận Xét Hàng Ngày</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận nhận xét cụ thể từng tiết học, tích sao thi đua và theo dõi nề nếp học sinh Lớp {classInfo.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handleAwardWholeClass}
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Thưởng Sao Cả Lớp (+1 ⭐)</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Tổng Sao Toàn Lớp</p>
            <p className="text-xl font-black text-slate-900">
              {starLogs.reduce((sum, l) => sum + l.points, 0)} ⭐
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Đánh Giá Hôm Nay</p>
            <p className="text-xl font-black text-slate-900">{todayLogs.length} Lượt</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Sao Thưởng Hôm Nay</p>
            <p className="text-xl font-black text-emerald-600">+{totalStarsGivenToday} ⭐</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Nhận Xét Đã Ghi</p>
            <p className="text-xl font-black text-slate-900">
              {starLogs.filter((l) => l.comment && l.comment.trim().length > 0).length} Lời dặn
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('TABLE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'TABLE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bảng Đánh Giá & Nhận Xét Hàng Ngày</span>
        </button>

        <button
          onClick={() => setActiveTab('CARDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'CARDS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Thẻ Học Sinh & Thưởng Sao</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'HISTORY'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật Ký Hoạt Động ({starLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: BẢNG ĐÁNH GIÁ & NHẬN XÉT HÀNG NGÀY */}
      {activeTab === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>Bảng Đánh Giá Chi Tiết Theo Học Sinh ({filteredStudents.length} Em)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hiển thị số sao tích lũy kèm nội dung đánh giá cụ thể và lời dặn dò hàng ngày của cô giáo.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, mã học sinh..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Assessment Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 w-48">Học Sinh</th>
                  <th className="py-3 px-4 text-center w-28">Tổng Sao ⭐</th>
                  <th className="py-3 px-4 w-60">Nội Dung Đánh Giá Gần Nhất</th>
                  <th className="py-3 px-4">Lời Nhận Xét / Dặn Dò Của Cô</th>
                  <th className="py-3 px-4 text-right w-44">Đánh Giá & Tích Sao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st, idx) => {
                  const studentLogs = starLogs.filter((l) => l.studentId === st.id);
                  const totalStars = studentLogs.reduce((sum, l) => sum + l.points, 0);
                  const latestLog = studentLogs[0];

                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{st.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {st.studentCode} • {st.gender}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 font-black px-2.5 py-1 rounded-full border border-amber-200 text-xs shadow-2xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{totalStars}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {latestLog ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  latestLog.points > 0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : latestLog.points < 0
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {latestLog.points > 0 ? `+${latestLog.points} ⭐` : latestLog.points < 0 ? `${latestLog.points} ⭐` : '💬 Nhận xét'}
                              </span>
                              <span className="font-semibold text-slate-800 text-[11px]">{latestLog.reason}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{new Date(latestLog.createdAt).toLocaleDateString('vi-VN')}</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa có đánh giá</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {latestLog?.comment ? (
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 leading-relaxed">
                            <span className="text-blue-600 font-bold mr-1">“</span>
                            {latestLog.comment}
                            <span className="text-blue-600 font-bold ml-1">”</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Chưa có nhận xét riêng</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenAssessModal(st)}
                          className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                          title="Đánh giá nội dung & ghi nhận xét"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Nhận xét</span>
                        </button>
                        <button
                          onClick={() => setHistoryStudent(st)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Xem lịch sử nhận xét của em này"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: THẺ HỌC SINH & THƯỞNG SAO NHANH */}
      {activeTab === 'CARDS' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredStudents.map((st) => {
            const stars = getStudentStars(st.id);
            const studentLogs = starLogs.filter((l) => l.studentId === st.id);
            const latestLog = studentLogs[0];

            return (
              <div
                key={st.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex flex-col justify-between hover:shadow-md transition-all relative group"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{st.studentCode}</span>
                  <div className="flex items-center space-x-1 bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200 text-xs">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{stars}</span>
                  </div>
                </div>

                {/* Avatar & Name */}
                <div className="my-2.5 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 text-blue-700 font-black text-sm flex items-center justify-center mx-auto shadow-2xs mb-1.5">
                    {st.fullName.split(' ').pop()?.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs truncate" title={st.fullName}>
                    {st.fullName}
                  </h3>
                  {latestLog ? (
                    <p className="text-[10px] text-emerald-600 font-medium truncate mt-0.5" title={latestLog.reason}>
                      {latestLog.reason}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">Lớp {classInfo.name}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleQuickAward(st, 1, 'Học tập', 'Phát biểu hăng hái')}
                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-1 rounded-lg border border-emerald-200 transition-colors flex items-center justify-center gap-0.5"
                      title="Thưởng +1 sao phát biểu"
                    >
                      <Plus className="w-3 h-3" /> 1⭐
                    </button>
                    <button
                      onClick={() => handleQuickAward(st, 2, 'Học tập', 'Làm bài xuất sắc')}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1 rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-0.5"
                      title="Thưởng +2 sao bài xuất sắc"
                    >
                      <Plus className="w-3 h-3" /> 2⭐
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenAssessModal(st)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] py-1.5 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Đánh Giá Chi Tiết</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: NHẬT KÝ HOẠT ĐỘNG & LỊCH SỬ KHEN THƯỞNG */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <span>Nhật Ký Nhận Xét & Lịch Sử Tích Sao ({starLogs.length} Bản Ghi)</span>
            </h2>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Học Sinh</th>
                  <th className="py-3 px-4">Phân Loại</th>
                  <th className="py-3 px-4">Nội Dung Đánh Giá</th>
                  <th className="py-3 px-4">Nhận Xét / Lời Dặn Của Cô</th>
                  <th className="py-3 px-4 text-center">Sao ⭐</th>
                  <th className="py-3 px-4 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {starLogs.map((log) => {
                  const student = students.find((s) => s.id === log.studentId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {student?.fullName || 'Học sinh'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{log.reason}</td>
                      <td className="py-3 px-4 text-slate-600 italic">
                        {log.comment ? `“${log.comment}”` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-black px-2 py-0.5 rounded-full text-xs ${
                            log.points > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.points < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {log.points > 0 ? `+${log.points}` : log.points} ⭐
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa bản ghi đánh giá này?')) {
                              deleteStarLog(log.id);
                              toast.success('Đã xóa bản ghi!');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ĐÁNH GIÁ NỘI DUNG & NHẬN XÉT HÀNG NGÀY CHO HỌC SINH */}
      {isAssessModalOpen && selectedStudentForAssess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                ⭐
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Đánh Giá & Nhận Xét: {selectedStudentForAssess.fullName}
                </h3>
                <p className="text-xs text-slate-500">Mã: {selectedStudentForAssess.studentCode} • Lớp {classInfo.name}</p>
              </div>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày Đánh Giá</label>
                  <input
                    type="date"
                    required
                    value={assessDate}
                    onChange={(e) => setAssessDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức Sao Thưởng / Phạt</label>
                  <select
                    value={assessPoints}
                    onChange={(e) => setAssessPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value={3}>🌟🌟🌟 Thưởng +3 Sao (Xuất sắc)</option>
                    <option value={2}>🌟🌟 Thưởng +2 Sao (Rất tốt)</option>
                    <option value={1}>🌟 Thưởng +1 Sao (Tốt / Khen ngợi)</option>
                    <option value={0}>💬 0 Sao (Chỉ ghi nhận xét)</option>
                    <option value={-1}>⚠️ Trừ -1 Sao (Nhắc nhở)</option>
                    <option value={-2}>❌ Trừ -2 Sao (Cần chấn chỉnh)</option>
                  </select>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Chọn Nhanh Nội Dung Hành Vi Đánh Giá:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BEHAVIOR_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setAssessReason(p.label);
                        setAssessCategory(p.category);
                        setAssessPoints(p.points);
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                        assessReason === p.label
                          ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 font-bold text-blue-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{p.icon}</span>
                      <div className="truncate">
                        <p className="text-[11px] truncate">{p.label}</p>
                        <p className="text-[9px] text-slate-400">{p.points > 0 ? `+${p.points}⭐` : `${p.points}⭐`}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội Dung Đánh Giá (Tùy biến):
                </label>
                <input
                  type="text"
                  required
                  value={assessReason}
                  onChange={(e) => setAssessReason(e.target.value)}
                  placeholder="Ví dụ: Làm bài tập toán xuất sắc, giúp bạn..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Comment Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Lời Nhận Xét & Dặn Dò Cụ Thể Của Cô Giáo:
                  </label>
                  <span className="text-[10px] text-blue-600 font-medium">Bấm gợi ý bên dưới để điền nhanh</span>
                </div>
                <textarea
                  rows={3}
                  value={assessComment}
                  onChange={(e) => setAssessComment(e.target.value)}
                  placeholder="Nhập nhận xét cụ thể để theo dõi hoặc gửi thông tin cho phụ huynh..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMMENT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAssessComment(sug)}
                      className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] border border-slate-200 transition-colors text-left"
                    >
                      + {sug.length > 35 ? sug.substring(0, 35) + '...' : sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssessModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Lưu Đánh Giá & Tích Sao</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XEM TOÀN BỘ LỊCH SỬ ĐÁNH GIÁ CỦA 1 HỌC SINH */}
      {historyStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  👤
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{historyStudent.fullName}</h3>
                  <p className="text-xs text-slate-500">
                    Mã: {historyStudent.studentCode} • Tổng tích lũy: <strong>{getStudentStars(historyStudent.id)} ⭐</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {starLogs.filter((l) => l.studentId === historyStudent.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic">
                  Chưa có lịch sử nhận xét nào cho học sinh này.
                </div>
              ) : (
                starLogs
                  .filter((l) => l.studentId === historyStudent.id)
                  .map((l) => (
                    <div key={l.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                              l.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {l.points > 0 ? `+${l.points} ⭐` : `${l.points} ⭐`}
                          </span>
                          <span>{l.reason}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(l.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {l.comment && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60 mt-1 italic">
                          “{l.comment}”
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHistoryStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
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
