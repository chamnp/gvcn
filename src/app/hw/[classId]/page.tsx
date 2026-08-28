'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Sparkles,
  School,
  ChevronRight,
  Sun,
  Backpack,
  Smile,
  CheckSquare,
  Square,
  FileText,
  Eye,
  MapPin,
  Phone,
  Cake,
  PartyPopper,
  Gift,
  Flame,
  Award,
  Info,
  Check,
  ChevronDown,
  X,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getSubjectTheme, DAYS_OF_WEEK, PERIODS } from '@/lib/timetable-data';
import { getLocalDateString } from '@/lib/tt27-engine';
import { DayOfWeek, ClassEvent, ClassEventType, Student } from '@/types';
import { LeaveRequestModal } from '@/components/parent/leave-request-modal';
import { MomentsFeedCard } from '@/components/moments/moments-feed-card';
import { ConferenceSchedulerModal } from '@/components/conference/conference-scheduler-modal';
import { toast } from 'sonner';

// Helper to calculate birthday information
function getStudentBirthdayInfo(dobStr: string) {
  if (!dobStr) return null;
  const today = new Date();
  const birthDate = new Date(dobStr);
  if (isNaN(birthDate.getTime())) return null;

  const currentYear = today.getFullYear();
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  let nextBday = new Date(currentYear, birthMonth, birthDay);
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (nextBday < todayZero) {
    nextBday = new Date(currentYear + 1, birthMonth, birthDay);
  }

  const diffTime = nextBday.getTime() - todayZero.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isToday = birthMonth === today.getMonth() && birthDay === today.getDate();
  const isThisMonth = birthMonth === today.getMonth();
  const turningAge = currentYear - birthDate.getFullYear() + (nextBday.getFullYear() > currentYear ? 1 : 0);

  return {
    isToday,
    isThisMonth,
    daysRemaining,
    turningAge,
    formattedDate: `${birthDay < 10 ? '0' : ''}${birthDay}/${birthMonth + 1 < 10 ? '0' : ''}${birthMonth + 1}`,
  };
}

export default function PublicClassHomeworkPortal({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const resolvedParams = use(params);
  const rawParam = (resolvedParams.classId || '4a1').toLowerCase();

  const {
    schoolClasses,
    allHomeworks,
    customSubjects,
    timetable,
    schoolInfo,
    allClassEvents,
    allStudents,
    starLogs,
  } = useAppStore();

  // Find class strictly matching shareToken or classId
  const currentClass = schoolClasses.find(
    (c) =>
      (c.shareToken && c.shareToken.toLowerCase() === rawParam) ||
      c.id.toLowerCase() === rawParam ||
      c.name.toLowerCase() === rawParam ||
      c.name.toLowerCase().replace(/\s+/g, '') === rawParam
  );

  // If no class matched the token or param
  if (!currentClass) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
            🔒
          </div>
          <h2 className="text-xl font-black text-slate-900">Liên Kết Bảo Mật Hoặc Đã Đổi Mã</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Để đảm bảo an toàn thông tin cá nhân và kết quả học tập của các em, hệ thống sử dụng liên kết riêng tư ngẫu nhiên cho từng lớp. Vui lòng liên hệ <strong>Giáo viên chủ nhiệm</strong> để nhận đường dẫn chính xác.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
            <Link
              href="/hw"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
            >
              Nhập mã lớp khác
            </Link>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              Giáo viên đăng nhập →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Scoped Homework for this class
  const classHomeworks = allHomeworks.filter(
    (h) =>
      h.classId === currentClass.id ||
      h.className?.toLowerCase() === currentClass.name.toLowerCase() ||
      h.className?.toLowerCase().replace(/\s+/g, '') === rawParam
  );

  // Scoped Events for this class
  const classEvents = allClassEvents.filter(
    (e) => e.classId === currentClass.id
  );

  // Scoped Students for this class
  const classStudents = allStudents.filter(
    (s) => (s.classId) === currentClass.id
  );

  // Student Local Checklist (State stored in localStorage)
  const [completedHwIds, setCompletedHwIds] = useState<string[]>([]);
  const [packedSubjectCodes, setPackedSubjectCodes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'HOMEWORK' | 'MOMENTS' | 'CONFERENCE' | 'EVENTS' | 'BACKPACK' | 'TIMETABLE'>('HOMEWORK');
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<DayOfWeek>('T2');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'EXAM' | 'MEETING' | 'FESTIVAL'>('ALL');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isConferenceModalOpen, setIsConferenceModalOpen] = useState(false);
  const [selectedStudentForLeave, setSelectedStudentForLeave] = useState<Student | null>(null);

  const { classMoments, conferenceSlots } = useAppStore();
  const filteredMoments = classMoments.filter((m) => m.classId === currentClass.id || !m.classId);
  const filteredConferences = conferenceSlots.filter((s) => s.classId === currentClass.id || !s.classId);

  const todayStr = getLocalDateString();

  useEffect(() => {
    try {
      const savedHw = localStorage.getItem(`gvcn_hw_done_${currentClass.id}`);
      if (savedHw) setCompletedHwIds(JSON.parse(savedHw));

      const savedPack = localStorage.getItem(`gvcn_pack_${currentClass.id}_${todayStr}`);
      if (savedPack) setPackedSubjectCodes(JSON.parse(savedPack));
    } catch (e) {}
  }, [currentClass.id, todayStr]);

  // Determine tomorrow's day of week
  const todayDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon...
  const nextDayMap: Record<number, DayOfWeek> = {
    0: 'T2',
    1: 'T3',
    2: 'T4',
    3: 'T5',
    4: 'T6',
    5: 'T2',
    6: 'T2',
  };
  const tomorrowDayCode: DayOfWeek = nextDayMap[todayDayIndex] || 'T2';
  const tomorrowDayInfo = DAYS_OF_WEEK.find((d) => d.id === tomorrowDayCode);

  useEffect(() => {
    setSelectedTimetableDay(tomorrowDayCode);
  }, [tomorrowDayCode]);

  // Tomorrow slots from timetable
  const tomorrowSlots = timetable.filter(
    (s) => s.day === tomorrowDayCode && (s.classId) === currentClass.id
  );

  const toggleCompleteHw = (hwId: string) => {
    setCompletedHwIds((prev) => {
      const isDone = prev.includes(hwId);
      const updated = isDone ? prev.filter((id) => id !== hwId) : [...prev, hwId];
      try {
        localStorage.setItem(`gvcn_hw_done_${currentClass.id}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const togglePackSubject = (code: string) => {
    setPackedSubjectCodes((prev) => {
      const isPacked = prev.includes(code);
      const updated = isPacked ? prev.filter((c) => c !== code) : [...prev, code];
      try {
        localStorage.setItem(`gvcn_pack_${currentClass.id}_${todayStr}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const doneCount = classHomeworks.filter((h) => completedHwIds.includes(h.id)).length;
  const isAllDone = classHomeworks.length > 0 && doneCount === classHomeworks.length;

  // Birthday list calculation
  const studentBirthdayList = useMemo(() => {
    return classStudents
      .map((st) => {
        const bInfo = getStudentBirthdayInfo(st.dateOfBirth);
        return { student: st, ...bInfo };
      })
      .filter((item): item is { student: typeof classStudents[0] } & NonNullable<ReturnType<typeof getStudentBirthdayInfo>> => item !== null)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [classStudents]);

  const todayBirthdays = studentBirthdayList.filter((b) => b.isToday);
  const thisMonthBirthdays = studentBirthdayList.filter((b) => b.isThisMonth);

  // Filtered Events
  const sortedEvents = useMemo(() => {
    return [...classEvents]
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((ev) => {
        if (eventFilter === 'ALL') return true;
        return ev.type === eventFilter;
      });
  }, [classEvents, eventFilter]);

  // Star leaderboard for praise wall
  const studentStarMap: { [id: string]: number } = {};
  starLogs.forEach((log) => {
    studentStarMap[log.studentId] = (studentStarMap[log.studentId] || 0) + log.points;
  });

  const topStarStudents = [...classStudents]
  .map((s) => ({ ...s, stars: studentStarMap[s.id] || 0 }))
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
            {schoolInfo.logoUrl ? (
              <img
                src={schoolInfo.logoUrl}
                alt="Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-base sm:text-xl font-bold shrink-0">
                🏫
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-slate-900 text-xs sm:text-base tracking-tight truncate">
                  Lớp {currentClass.name}
                </span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {schoolInfo.schoolYear || '2026-2027'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate" title={schoolInfo.name}>
                {schoolInfo.name} • GVCN: {currentClass.teacherName}
              </p>
            </div>
          </div>

          {/* Quick Actions: Tra Cứu Điểm Của Con + Link to Teacher Login */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Link
              href="/lookup"
              className="text-[10px] sm:text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-xl border border-amber-300 transition-colors inline-flex items-center gap-1 shadow-2xs"
            >
              <span>🌟 Tra Cứu Con</span>
            </Link>

            <Link
              href="/login"
              className="text-[10px] sm:text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl border border-blue-200 transition-colors inline-flex items-center gap-0.5"
            >
              <span>Giáo viên</span>
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT: RESPONSIVE GRID (DESKTOP 2-COL, MOBILE 1-COL) */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-5 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
          {/* LEFT 2 COLUMNS: HERO BANNER, TAB NAVIGATION & MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-4">
            {/* HERO GREETING BANNER */}
            <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center space-x-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    <span>Góc Phụ Huynh & Học Sinh</span>
                  </span>
                  <span className="bg-yellow-400/20 text-yellow-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-yellow-400/30">
                    Lớp {currentClass.name}
                  </span>
                </div>

                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                    Cổng Thông Tin Học Tập Lớp {currentClass.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl leading-relaxed mt-1">
                    Cập nhật bài tập về nhà, lịch sự kiện, chuẩn bị sách vở ngày mai ({tomorrowDayInfo?.name}) và thông báo mới nhất từ cô giáo.
                  </p>
                </div>

                {/* Progress Bar for Homework */}
                {classHomeworks.length > 0 && (
                  <div className="pt-1.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-blue-200">Tiến độ bài tập hôm nay:</span>
                      <span className="text-emerald-300 font-mono">
                        {doneCount}/{classHomeworks.length} bài ({Math.round((doneCount / classHomeworks.length) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/15">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-300 shadow-xs"
                        style={{ width: `${(doneCount / classHomeworks.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons for Parents */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForLeave(classStudents[0] || null);
                      setIsLeaveModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-2 rounded-xl backdrop-blur-md transition-colors cursor-pointer border border-white/20"
                  >
                    <span>📋 Xin Nghỉ Phép & Dặn Dò Thuốc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConferenceModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-2 rounded-xl backdrop-blur-md transition-colors cursor-pointer border border-white/20"
                  >
                    <span>📅 Đặt Lịch Hẹn Gặp Cô (1-1)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* PRIVATE STUDENT LOOKUP CTA BANNER */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-4 sm:p-5 text-white shadow-lg shadow-orange-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 animate-in fade-in">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
                  🌟
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-100">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Tra Cứu Riêng Tư Thông Tư 27</span>
                  </div>
                  <h3 className="font-black text-sm sm:text-base truncate">
                    Bảng Điểm & Lời Nhận Xét Riêng Của Con
                  </h3>
                  <p className="text-xs text-amber-100/90 truncate">
                    Bảo mật tuyệt đối, chỉ phụ huynh có mã mới xem được kết quả của con mình.
                  </p>
                </div>
              </div>

              <Link
                href="/lookup"
                className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-orange-50 text-orange-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
              >
                <span>Tra Cứu Con Ngay</span>
                <ChevronRight className="w-4 h-4 text-orange-600" />
              </Link>
            </div>

            {/* 3. NAVIGATION TABS */}
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold scroll-smooth">
              {[
                { id: 'HOMEWORK', label: '📝 Bài Tập', count: classHomeworks.length },
                { id: 'MOMENTS', label: '📸 Khoảnh Khắc Lớp', count: filteredMoments.length },
                { id: 'CONFERENCE', label: '📅 Lịch Họp 1-1', count: filteredConferences.filter(s => !s.isBooked).length },
                { id: 'BACKPACK', label: '🎒 Soạn Sách Vở', count: null },
                { id: 'TIMETABLE', label: '🗓️ Thời Khóa Biểu', count: null },
                { id: 'EVENTS', label: '🎪 Sự Kiện', count: classEvents.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`h-9 px-3.5 flex items-center justify-center space-x-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* TAB CONTENT 1: HOMEWORK */}
            {activeTab === 'HOMEWORK' && (
              <div className="space-y-3">
                {isAllDone && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-center space-x-3 text-emerald-800 animate-in fade-in">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shrink-0">
                      🎉
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Tuyệt vời! Em đã hoàn thành 100% bài tập hôm nay!</h4>
                      <p className="text-xs text-emerald-700">Hãy chuyển sang tab <strong>Soạn Sách Vở</strong> để chuẩn bị sách cho ngày mai nhé.</p>
                    </div>
                  </div>
                )}

                {classHomeworks.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                      ✨
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Hôm nay không có bài tập về nhà!</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Chúc các em học sinh có một buổi tối nghỉ ngơi vui vẻ bên gia đình.
                    </p>
                  </div>
                ) : (
                  classHomeworks.map((hw) => {
                    const theme = getSubjectTheme(hw.subjectCode, customSubjects);
                    const isDone = completedHwIds.includes(hw.id);

                    return (
                      <div
                        key={hw.id}
                        className={`bg-white rounded-3xl border transition-all duration-200 p-4 sm:p-5 shadow-xs ${
                          isDone
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                            <span className="text-2xl shrink-0 mt-0.5">{theme.icon}</span>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${theme.bgColor} ${theme.textColor}`}
                              >
                                {hw.subjectName}
                              </span>
                              <h3 className={`font-bold text-xs sm:text-sm text-slate-900 mt-0.5 break-words ${isDone ? 'line-through text-slate-400' : ''}`}>
                                {hw.title}
                              </h3>
                            </div>
                          </div>

                          {/* Interactive Checkbox Button */}
                          <button
                            type="button"
                            onClick={() => toggleCompleteHw(hw.id)}
                            className={`w-24 h-8 shrink-0 flex items-center justify-center space-x-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isDone ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                            <span>{isDone ? 'Đã Xong' : 'Chưa Xong'}</span>
                          </button>
                        </div>

                        {/* Description */}
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed break-words">
                          {hw.description}
                        </div>

                        {/* Teacher Reminder */}
                        {hw.reminderNotes && (
                          <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start space-x-2 text-amber-900 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Cô dặn dò:</strong> {hw.reminderNotes}</span>
                          </div>
                        )}

                        {/* Attachment / Preview */}
                        {hw.attachmentUrl && (
                          <div className="mt-3 flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setPreviewImageUrl(hw.attachmentUrl!)}
                              className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem ảnh phiếu bài tập</span>
                            </button>
                          </div>
                        )}

                        {/* Footer Due */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Ngày giao: {hw.assignedDate}</span>
                          <span className="font-semibold text-slate-600">Hạn nộp: {hw.dueDate}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT 2: CLASS & SCHOOL EVENTS */}
            {activeTab === 'EVENTS' && (
              <div className="space-y-4">
                {/* Event Category Filter */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'ALL', label: 'Tất cả sự kiện' },
                    { id: 'EXAM', label: '🏆 Khảo sát & Thi' },
                    { id: 'MEETING', label: '👥 Họp Phụ huynh' },
                    { id: 'FESTIVAL', label: '🎪 Lễ hội & Khai giảng' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setEventFilter(f.id as any)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        eventFilter === f.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {sortedEvents.length > 0 ? (
                  <div className="space-y-2.5">
                    {sortedEvents.map((ev) => {
                      const evDate = new Date(ev.date);
                      const dayNum = evDate.getDate();
                      const monthNum = evDate.getMonth() + 1;
                      const isTodayEvent = ev.date === todayStr;

                      return (
                        <div
                          key={ev.id}
                          className={`bg-white rounded-3xl border p-3.5 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isTodayEvent
                              ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-200'
                              : ev.isImportant
                              ? 'border-indigo-200 bg-indigo-50/30'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start space-x-3 min-w-0">
                            {/* Date Badge */}
                            <div
                              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold border shadow-xs ${
                                isTodayEvent
                                  ? 'bg-amber-500 text-white border-amber-600'
                                  : ev.isImportant
                                  ? 'bg-indigo-600 text-white border-indigo-700'
                                  : 'bg-slate-100 text-slate-800 border-slate-200'
                              }`}
                            >
                              <span className="text-[9px] uppercase font-semibold leading-none">Th.{monthNum}</span>
                              <span className="text-lg font-black leading-tight">{dayNum}</span>
                            </div>

                            <div className="space-y-0.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                                  {ev.title}
                                </h3>
                                {isTodayEvent && (
                                  <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                    Hôm nay
                                  </span>
                                )}
                                {ev.isImportant && !isTodayEvent && (
                                  <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                    Quan trọng
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
                                {ev.time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{ev.time}</span>
                                  </span>
                                )}
                                {ev.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span>{ev.location}</span>
                                  </span>
                                )}
                              </div>

                              {ev.description && (
                                <p className="text-xs text-slate-600 leading-relaxed pt-1 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1 break-words">
                                  <strong>Dặn dò:</strong> {ev.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-400 space-y-2">
                    <Calendar className="w-8 h-8 mx-auto opacity-40" />
                    <p>Chưa có sự kiện nào trong danh mục này.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: SOẠN SÁCH VỞ CHO NGÀY MAI */}
            {activeTab === 'BACKPACK' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-xs sm:text-base text-slate-900 flex items-center gap-2">
                        <Backpack className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                        <span>Soạn Sách Vở Ngày Mai ({tomorrowDayInfo?.name})</span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-500">
                        Tích chọn từng môn sau khi em đã bỏ sách vở và đồ dùng vào cặp.
                      </p>
                    </div>

                    <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      {tomorrowSlots.length} Tiết
                    </span>
                  </div>

                  <div className="space-y-2">
                    {tomorrowSlots.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Ngày mai không có tiết học hoặc là ngày nghỉ.</p>
                    ) : (
                      tomorrowSlots.map((slot) => {
                        const theme = getSubjectTheme(slot.subjectCode, customSubjects);
                        const isPacked = packedSubjectCodes.includes(slot.subjectCode);

                        return (
                          <div
                            key={slot.id}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                              isPacked
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <span className="text-xl shrink-0">{theme.icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-900 truncate">{slot.subjectName}</span>
                                  <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                    Tiết {slot.period}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  {slot.note ? `Mang theo: ${slot.note}` : `Sách giáo khoa & Vở bài tập ${slot.subjectName}`}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => togglePackSubject(slot.subjectCode)}
                              className={`w-24 h-8 shrink-0 flex items-center justify-center space-x-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isPacked
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isPacked ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                              <span>{isPacked ? 'Đã Xếp' : 'Chưa Xếp'}</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: THỜI KHÓA BIỂU TUẦN */}
            {activeTab === 'TIMETABLE' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-xs sm:text-base text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                      <span>Thời Khóa Biểu Lớp {currentClass.name}</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">Chương trình học chuẩn 2 buổi/ngày kèm ăn bán trú.</p>
                  </div>

                  {/* Day Picker Grid for Mobile/Tablet */}
                  <div className="grid grid-cols-5 gap-1 pt-1 sm:pt-0">
                    {DAYS_OF_WEEK.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedTimetableDay(d.id)}
                        className={`h-8 px-2 flex items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          selectedTimetableDay === d.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day Schedule List */}
                <div className="space-y-2">
                  {PERIODS.map((p) => {
                    const slot = timetable.find(
                      (s) => s.day === selectedTimetableDay && s.period === p.period && (s.classId) === currentClass.id
                    );
                    const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;

                    return (
                      <div
                        key={p.period}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                          theme ? `${theme.bgColor} ${theme.borderColor}` : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-xs font-bold text-slate-500 w-12 shrink-0">
                            {p.name}
                          </span>
                          <span className="text-xl">{theme?.icon || '📚'}</span>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                              {slot?.subjectName || 'Tự học / Nghỉ'}
                            </h4>
                            {slot?.note && (
                              <p className="text-[11px] text-slate-600 mt-0.5">{slot.note}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-500 font-semibold">{p.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: CLASSROOM MOMENTS */}
            {activeTab === 'MOMENTS' && (
              <div className="space-y-4 animate-in fade-in">
                {filteredMoments.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mx-auto text-2xl">
                      📸
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Chưa Có Bài Viết Khoảnh Khắc Lớp</h3>
                    <p className="text-xs text-slate-500">Cô giáo sẽ sớm chia sẻ những bức ảnh và câu chuyện học tập vui vẻ của lớp tại đây!</p>
                  </div>
                ) : (
                  filteredMoments.map((m) => (
                    <MomentsFeedCard key={m.id} moment={m} isTeacher={false} />
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT 6: PARENT CONFERENCE SCHEDULER */}
            {activeTab === 'CONFERENCE' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      Lịch Hẹn Họp & Trao Đổi 1-1 Với Cô Giáo
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chọn khung giờ thuận tiện để trao đổi riêng về sự tiến bộ của con
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredConferences.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      Hiện chưa có đợt hẹn trao đổi nào được mở.
                    </div>
                  ) : (
                    filteredConferences.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-slate-900 text-xs sm:text-sm">
                              📅 {slot.date} ({slot.startTime} - {slot.endTime})
                            </span>
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {slot.type === 'IN_PERSON' ? 'Trực tiếp' : 'Trực tuyến'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{slot.title}</p>
                          {slot.location && (
                            <p className="text-[11px] text-slate-400">📍 {slot.location}</p>
                          )}
                        </div>

                        <div>
                          {slot.isBooked ? (
                            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl inline-block">
                              Đã kín lịch
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsConferenceModalOpen(true)}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                            >
                              Đăng Ký Khung Giờ Này
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 1 COLUMN: SIDE CONTACT & SCHOOL INFO PANEL */}
          <div className="space-y-4">
            {/* TEACHER PROFILE CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                  👩‍🏫
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Giáo Viên Chủ Nhiệm
                  </span>
                  <h3 className="font-bold text-base text-slate-900 truncate">
                    {currentClass.teacherName || 'Cô Nguyễn Thị Minh Hằng'}
                  </h3>
                  <p className="text-xs text-blue-600 font-semibold">Chủ nhiệm Lớp {currentClass.name}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Trường:</span>
                  <strong className="text-slate-800 text-right truncate max-w-[170px]">{schoolInfo.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Năm học:</span>
                  <strong className="font-mono text-slate-800">{schoolInfo.schoolYear || '2026-2027'}</strong>
                </div>
                {schoolInfo.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Hotline trường:</span>
                    <a href={`tel:${schoolInfo.phone}`} className="font-mono font-bold text-blue-600 hover:underline">
                      {schoolInfo.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* CLASS GENERAL RULES / PARENT NOTICE CARD */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100 p-5 space-y-3 text-xs">
              <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 text-sm">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>Quy Định & Dặn Dò Đầu Năm</span>
              </h4>
              <ul className="space-y-1.5 text-indigo-900/90 leading-relaxed list-disc list-inside">
                <li>Học sinh có mặt tại lớp trước <strong>07:45</strong> sáng.</li>
                <li>Đồng phục chỉnh tề, đeo khăn quàng đỏ (với Đội viên).</li>
                <li>Học sinh bán trú chuẩn bị gối ngủ cá nhân.</li>
                <li>Nghỉ học phụ huynh vui lòng nhắn tin báo cô trước 07:30.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL PREVIEW IMAGE OF HOMEWORK */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="bg-white max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Ảnh Phiếu Bài Tập Về Nhà</h3>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-50">
              <img
                src={previewImageUrl}
                alt="Phiếu bài tập"
                className="max-h-[70vh] object-contain rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Leave Request & Health Modal */}
      <LeaveRequestModal
        student={selectedStudentForLeave}
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />

      {/* Conference Scheduler Modal */}
      <ConferenceSchedulerModal
        isOpen={isConferenceModalOpen}
        onClose={() => setIsConferenceModalOpen(false)}
        isTeacher={false}
        currentStudent={classStudents[0] || null}
      />
    </div>
  );
}
