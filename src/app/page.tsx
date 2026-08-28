'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Utensils,
  CalendarCheck,
  Calendar,
  Clock,
  Cake,
  PartyPopper,
  Gift,
  Plus,
  Trash2,
  MapPin,
  Flame,
  Check,
  Copy,
  ChevronRight,
  X,
  BookOpen,
  Star,
  Compass,
  Zap,
  Activity,
  HeartHandshake,
  LayoutGrid,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import {
  TERMS,
  evaluateStudentTT27,
  getAwardBadgeClass,
  calculateEvaluationProgress,
  validateTT27Assessments,
} from '@/lib/tt27-engine';
import { DAYS_OF_WEEK, PERIODS, getSubjectTheme } from '@/lib/timetable-data';
import { DayOfWeek, ClassEvent, ClassEventType } from '@/types';
import { ProgressMeterWidget } from '@/components/assessment/progress-meter-widget';
import { EarlyInterventionWidget } from '@/components/dashboard/early-intervention-widget';
import { ConferenceSchedulerModal } from '@/components/conference/conference-scheduler-modal';
import { AIClassDiagnosticModal } from '@/components/assessment/ai-class-diagnostic-modal';
import { ClassMeetingPlannerModal } from '@/components/planner/class-meeting-planner-modal';
import { ZaloMessageGeneratorModal } from '@/components/parent/zalo-message-generator-modal';
import { scanEarlyInterventionAlerts } from '@/lib/early-intervention';
import { toast } from 'sonner';

type DashboardTab = 'TODAY' | 'ACADEMIC' | 'SCHEDULE';

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
  const isThisWeek = daysRemaining <= 7;
  const turningAge = currentYear - birthDate.getFullYear() + (nextBday.getFullYear() > currentYear ? 1 : 0);

  return {
    isToday,
    isThisMonth,
    isThisWeek,
    daysRemaining,
    turningAge,
    birthDay,
    birthMonth: birthMonth + 1,
    formattedDate: `${birthDay < 10 ? '0' : ''}${birthDay}/${birthMonth + 1 < 10 ? '0' : ''}${birthMonth + 1}`,
  };
}

export default function DashboardPage() {
  const {
    classInfo,
    schoolInfo,
    students,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    attendances,
    starLogs,
    timetable,
    classEvents,
    addClassEvent,
    deleteClassEvent,
    leaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    conferenceSlots,
  } = useAppStore();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>('TODAY');
  const [isFilterIncomplete, setIsFilterIncomplete] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isConferenceModalOpen, setIsConferenceModalOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);
  const [copiedWishId, setCopiedWishId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'UPCOMING' | 'EXAM' | 'MEETING' | 'FESTIVAL'>('ALL');

  // Form state for adding new class event
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('08:00 - 10:30');
  const [newEventType, setNewEventType] = useState<ClassEventType>('ACTIVITY');
  const [newEventLocation, setNewEventLocation] = useState('Phòng học ' + classInfo.name);
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventImportant, setNewEventImportant] = useState(false);

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const teacherDisplayName = useMemo(() => {
    if (profile?.role === 'ADMIN') {
      return profile.fullName || 'Ban Giám Hiệu';
    }
    return classInfo.teacherName || profile?.fullName || 'Thầy/Cô';
  }, [profile, classInfo.teacherName]);

  // Thống kê sĩ số học sinh
  const totalStudents = students.length;
  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;
  const boardingCount = students.filter((s) => s.isBoarding).length;

  // Điểm danh hôm nay
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAtt = attendances.filter((a) => a.date === todayStr);
  const presentCount = todayAtt.filter((a) => a.status === 'CO_MAT').length || (totalStudents > 0 ? totalStudents : 0);

  // Auto-open modals from notification links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openConference') === 'true') {
        setIsConferenceModalOpen(true);
      }
    }
  }, []);
  const absentCount = todayAtt.filter((a) => a.status !== 'CO_MAT').length;
  const todayMeals = todayAtt.filter((a) => a.hasBoardingMeal).length || (boardingCount > 0 ? boardingCount : 0);

  // Phân loại kết quả học sinh kỳ này (TT27)
  let xuatSacCount = 0;
  let tieuBieuCount = 0;
  let hoanThanhCount = 0;
  let canCoGangCount = 0;

  students.forEach((st) => {
    const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
    const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
    const summary = termSummaries.find((ts) => ts.studentId === st.id && ts.term === currentTerm);
    const award = summary?.awardTitle || evaluateStudentTT27(sAss, tAss, currentTerm).awardTitle;

    if (award === 'Học sinh Xuất sắc') xuatSacCount++;
    else if (award === 'Học sinh Tiêu biểu hoàn thành tốt') tieuBieuCount++;
    else if (award === 'Hoàn thành chương trình lớp học' || award === 'Khen thưởng từng mặt') hoanThanhCount++;
    else canCoGangCount++;
  });

  // Sao thi đua nề nếp (chỉ tính cho học sinh thuộc lớp hiện tại)
  const classStudentIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const activeClassStarLogs = useMemo(
    () => starLogs.filter((log) => classStudentIds.has(log.studentId)),
    [starLogs, classStudentIds]
  );
  const totalClassStars = useMemo(
    () => activeClassStarLogs.reduce((sum, log) => sum + log.points, 0),
    [activeClassStarLogs]
  );

  const studentStarMap = useMemo(() => {
    const map: { [id: string]: number } = {};
    activeClassStarLogs.forEach((log) => {
      map[log.studentId] = (map[log.studentId] || 0) + log.points;
    });
    return map;
  }, [activeClassStarLogs]);

  const topStarStudents = useMemo(() => {
    return [...students]
      .map((s) => ({ ...s, stars: studentStarMap[s.id] || 0 }))
      .filter((s) => s.stars > 0)
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 5);
  }, [students, studentStarMap]);

  // Tiến độ đánh giá TT27 và kiểm tra logic
  const currentGrade = classInfo?.grade || 4;
  const progress = useMemo(() => {
    return calculateEvaluationProgress(
      students,
      subjectAssessments,
      traitAssessments,
      termSummaries,
      currentTerm,
      currentGrade
    );
  }, [students, subjectAssessments, traitAssessments, termSummaries, currentTerm, currentGrade]);

  const issues = useMemo(() => {
    return validateTT27Assessments(
      students,
      subjectAssessments,
      traitAssessments,
      termSummaries,
      currentTerm,
      currentGrade
    );
  }, [students, subjectAssessments, traitAssessments, termSummaries, currentTerm, currentGrade]);

  // Cảnh báo sớm học sinh cần hỗ trợ (Early Intervention Radar)
  const earlyAlerts = useMemo(() => {
    return scanEarlyInterventionAlerts(
      students,
      attendances,
      subjectAssessments,
      starLogs,
      currentTerm
    );
  }, [students, attendances, subjectAssessments, starLogs, currentTerm]);

  // Tính toán sinh nhật học sinh
  const studentBirthdayList = useMemo(() => {
    return students
      .map((st) => {
        const bInfo = getStudentBirthdayInfo(st.dateOfBirth);
        return { student: st, ...bInfo };
      })
      .filter((item): item is { student: typeof students[0] } & NonNullable<ReturnType<typeof getStudentBirthdayInfo>> => item !== null)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [students]);

  const todayBirthdays = studentBirthdayList.filter((b) => b.isToday);
  const upcomingBirthdays = studentBirthdayList.filter((b) => !b.isToday && b.daysRemaining <= 30);

  // Sắp xếp và lọc sự kiện lớp
  const sortedEvents = useMemo(() => {
    return [...classEvents]
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((ev) => {
        if (eventFilter === 'ALL') return true;
        if (eventFilter === 'UPCOMING') return ev.date >= todayStr;
        return ev.type === eventFilter;
      });
  }, [classEvents, eventFilter, todayStr]);

  // Thời khóa biểu hôm nay
  const todayDayOfWeek = useMemo((): DayOfWeek => {
    const d = new Date().getDay();
    const map: { [key: number]: DayOfWeek } = {
      1: 'T2',
      2: 'T3',
      3: 'T4',
      4: 'T5',
      5: 'T6',
      6: 'T2',
      0: 'T2',
    };
    return map[d] || 'T2';
  }, []);

  const todayPeriods = useMemo(() => {
    return timetable.filter((item) => item.day === todayDayOfWeek);
  }, [timetable, todayDayOfWeek]);

  // Đơn xin nghỉ phép chờ duyệt
  const pendingLeaves = useMemo(() => {
    return (leaveRequests || []).filter((r) => r.status === 'PENDING');
  }, [leaveRequests]);

  // Học sinh có lưu ý sức khỏe
  const healthNoticeStudents = useMemo(() => {
    return students.filter((s) => s.healthNotes && s.healthNotes.trim() !== '');
  }, [students]);

  // Xử lý thêm sự kiện
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      toast.error('Vui lòng nhập tên sự kiện!');
      return;
    }

    addClassEvent({
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime,
      type: newEventType,
      location: newEventLocation,
      description: newEventDesc,
      isImportant: newEventImportant,
    });

    toast.success('Đã thêm sự kiện mới thành công!');
    setNewEventTitle('');
    setNewEventDesc('');
    setIsAddEventModalOpen(false);
  };

  // Copy lời chúc mừng sinh nhật
  const handleCopyWish = (studentName: string, age: number, id: string) => {
    const wish = `🎉 Chúc mừng sinh nhật em ${studentName} tròn ${age} tuổi! 🎂 Chúc em luôn chăm ngoan, học giỏi, nhiều niềm vui và luôn là học sinh gương mẫu của tập thể lớp ${classInfo.name}! 🌟🎈`;
    navigator.clipboard.writeText(wish);
    setCopiedWishId(id);
    toast.success(`Đã sao chép lời chúc sinh nhật em ${studentName}!`);
    setTimeout(() => setCopiedWishId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. COMPACT HERO BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Award className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Năm học {classInfo.schoolYear || '2026-2027'}</span>
                <span className="text-white/40">•</span>
                <span className="font-bold text-amber-300">{termName} (TT27)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Xin chào, {teacherDisplayName}! 👋
              </h1>
              <p className="text-sm text-blue-100 font-medium max-w-xl">
                Bảng điều khiển quản lý và trợ lý sư phạm lớp <strong>{classInfo.name}</strong> ({schoolInfo?.name || 'Trường Tiểu học'}).
              </p>
            </div>

            {/* 4 AI & Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDiagnosticOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Chẩn Đoán AI</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPlannerModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md border border-white/30 transition-all cursor-pointer hover:scale-105"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Kế Hoạch SHL</span>
              </button>

              <button
                type="button"
                onClick={() => setIsZaloModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md border border-white/30 transition-all cursor-pointer hover:scale-105"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Tin Nhắn Zalo</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConferenceModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md border border-white/30 transition-all cursor-pointer hover:scale-105"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Lịch Gặp PH</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FESTIVE BIRTHDAY BANNER (If Today Has Birthday) */}
      {todayBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden animate-bounce-subtle">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
                🎂
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-black uppercase tracking-wider mb-1">
                  <PartyPopper className="w-3 h-3 text-amber-200" />
                  <span>Hôm nay có {todayBirthdays.length} sinh nhật!</span>
                </div>
                <h3 className="text-base sm:text-lg font-black leading-snug">
                  Chúc mừng sinh nhật:{' '}
                  {todayBirthdays.map((b) => `${b.student.fullName} (${b.turningAge} tuổi)`).join(', ')}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {todayBirthdays.map((b) => (
                <button
                  key={b.student.id}
                  type="button"
                  onClick={() => handleCopyWish(b.student.fullName, b.turningAge, b.student.id)}
                  className="px-3.5 py-2 rounded-xl bg-white text-rose-600 font-bold text-xs shadow-md hover:bg-rose-50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedWishId === b.student.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWishId === b.student.id ? 'Đã chép lời chúc' : `Gửi chúc mừng`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. KEY METRICS & KPI TILES GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Sĩ số */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">SĨ SỐ LỚP</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalStudents} <span className="text-xs font-medium text-slate-400">em</span></div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1">
              <span className="text-blue-600 font-bold">{maleCount} Nam</span> • <span className="text-pink-600 font-bold">{femaleCount} Nữ</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Chuyên cần */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ĐIỂM DANH HÔM NAY</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {presentCount}/{totalStudents}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1">
              <span>Vắng: <strong className={absentCount > 0 ? 'text-rose-600' : 'text-slate-700'}>{absentCount}</strong></span> • <span>Ăn trưa: <strong className="text-teal-600">{todayMeals}</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 3: Khen thưởng TT27 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">XUẤT SẮC & TIÊU BIỂU</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              {xuatSacCount + tieuBieuCount} <span className="text-xs font-medium text-slate-400">em</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1">
              <span>Xuất sắc: <strong className="text-amber-600">{xuatSacCount}</strong></span> • <span>Tiêu biểu: <strong className="text-blue-600">{tieuBieuCount}</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 4: Sao thi đua */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">SAO THI ĐUA NỀ NẾP</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-purple-600">
              {totalClassStars} <span className="text-xs font-medium text-slate-400">⭐</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1">
              <span>Ghi nhận: <strong className="text-slate-700">{activeClassStarLogs.length}</strong> lượt</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODERN 3-TAB DASHBOARD NAVIGATION */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('TODAY')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'TODAY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hôm Nay & Nề Nếp</span>
            {pendingLeaves.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {pendingLeaves.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACADEMIC')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ACADEMIC'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Học Tập & Đánh Giá TT27</span>
            {earlyAlerts.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {earlyAlerts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SCHEDULE')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'SCHEDULE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch Trình & Sự Kiện</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {classEvents.length}
            </span>
          </button>
        </div>

        {/* Action Link to Full Tools */}
        <Link
          href="/classroom-tools"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-all hover:bg-blue-100"
        >
          <span>🎡 Mở Công Cụ Chiếu TV</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HÔM NAY & NỀ NẾP (TODAY & DYNAMICS) */}
      {/* ========================================================================= */}
      {activeTab === 'TODAY' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Pending Leave Requests & Health Alerts Alert Box */}
          {(pendingLeaves.length > 0 || healthNoticeStudents.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pending Leaves */}
              {pendingLeaves.length > 0 && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>ĐƠN XIN NGHỈ PHÉP CHỜ DUYỆT ({pendingLeaves.length})</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {pendingLeaves.slice(0, 3).map((req) => (
                      <div key={req.id} className="bg-white rounded-xl p-3 border border-rose-100 shadow-xs flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{req.studentName}</p>
                          <p className="text-[11px] text-slate-500">{req.startDate} • Lý do: {req.reasonDetail || req.reasonType}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              approveLeaveRequest(req.id);
                              toast.success(`Đã duyệt đơn nghỉ phép của ${req.studentName}`);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              rejectLeaveRequest(req.id);
                              toast.error(`Đã từ chối đơn của ${req.studentName}`);
                            }}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-[11px] hover:bg-slate-200 cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Health Notices */}
              {healthNoticeStudents.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span>LƯU Ý SỨC KHỎE HỌC SINH ({healthNoticeStudents.length})</span>
                    </div>
                    <Link href="/health-records" className="text-[11px] font-bold text-amber-700 hover:underline">
                      Xem sổ y tế →
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {healthNoticeStudents.slice(0, 6).map((s) => (
                      <span key={s.id} className="bg-white px-2.5 py-1 rounded-xl border border-amber-200 text-xs font-semibold text-slate-800 shadow-2xs">
                        {s.fullName}: <span className="text-amber-700 font-bold">{s.healthNotes}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3-Column Grid: Leaderboard, Today Timetable, Birthdays */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Top 5 Leaderboard */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      🏆
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Vinh Danh Sao Nề Nếp</h3>
                      <p className="text-[11px] text-slate-400">Top 5 học sinh dẫn đầu lớp</p>
                    </div>
                  </div>
                  <Link href="/behavior" className="text-xs font-bold text-purple-600 hover:underline">
                    Xem tất cả →
                  </Link>
                </div>

                <div className="space-y-2.5 mt-3">
                  {topStarStudents.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                      Chưa có điểm sao nề nếp được ghi nhận.
                    </div>
                  ) : (
                    topStarStudents.map((st, idx) => (
                      <div key={st.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-purple-50/50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            idx === 0 ? 'bg-amber-400 text-slate-950 shadow-xs' :
                            idx === 1 ? 'bg-slate-300 text-slate-800' :
                            idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{st.fullName}</span>
                        </div>
                        <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-lg">
                          {st.stars} ⭐
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Link
                href="/behavior"
                className="w-full py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold text-xs text-center transition-colors block"
              >
                + Cộng sao & Đánh giá nề nếp
              </Link>
            </div>

            {/* Column 2: Today's Timetable */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      📅
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Thời Khóa Biểu Hôm Nay</h3>
                      <p className="text-[11px] text-slate-400">{todayDayOfWeek} ({todayPeriods.length} tiết)</p>
                    </div>
                  </div>
                  <Link href="/timetable" className="text-xs font-bold text-blue-600 hover:underline">
                    Xem tuần →
                  </Link>
                </div>

                <div className="space-y-2 mt-3">
                  {todayPeriods.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                      Hôm nay không có lịch học xếp sẵn.
                    </div>
                  ) : (
                    todayPeriods.slice(0, 5).map((p) => {
                      const theme = getSubjectTheme(p.subjectCode);
                      return (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                              T{p.period}
                            </span>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${theme.bgColor} ${theme.textColor} ${theme.borderColor}`}>
                              {p.subjectName || theme.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {p.teacherName ? `GV: ${p.teacherName}` : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <Link
                href="/timetable"
                className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs text-center transition-colors block"
              >
                Xem chi tiết thời khóa biểu
              </Link>
            </div>

            {/* Column 3: Birthdays */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                      🎂
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Sinh Nhật Sắp Tới</h3>
                      <p className="text-[11px] text-slate-400">30 ngày tới ({upcomingBirthdays.length} bạn)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-3 max-h-56 overflow-y-auto">
                  {upcomingBirthdays.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                      Không có sinh nhật nào trong 30 ngày tới.
                    </div>
                  ) : (
                    upcomingBirthdays.slice(0, 4).map((b) => (
                      <div key={b.student.id} className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{b.student.fullName}</p>
                          <p className="text-[10px] text-slate-400">{b.formattedDate} • Còn {b.daysRemaining} ngày</p>
                        </div>
                        <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                          {b.turningAge} tuổi
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsZaloModalOpen(true)}
                className="w-full py-2.5 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-xl font-bold text-xs text-center transition-colors block cursor-pointer"
              >
                💌 Soạn thiệp mừng sinh nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HỌC TẬP & ĐÁNH GIÁ TT27 (ACADEMIC & RADAR) */}
      {/* ========================================================================= */}
      {activeTab === 'ACADEMIC' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 2 Widgets: Progress Meter & Early Intervention Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ProgressMeterWidget
              progress={progress}
              issues={issues}
              isFilterIncomplete={isFilterIncomplete}
              onToggleFilterIncomplete={() => setIsFilterIncomplete(!isFilterIncomplete)}
            />
            <EarlyInterventionWidget alerts={earlyAlerts} />
          </div>

          {/* TT27 Award Breakdown Chart & Student Table Preview */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Biểu Đồ Phân Loại Kết Quả Giáo Dục — {termName}
                </h3>
                <p className="text-xs text-slate-500">
                  Tổng hợp {totalStudents} học sinh theo tiêu chuẩn Thông tư 27/2020/TT-BGDĐT
                </p>
              </div>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-xs shrink-0"
              >
                <span>Mở Bảng Đánh Giá Chi Tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Visual Multi-Segment Bar Chart */}
            <div className="space-y-3">
              <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {totalStudents > 0 && (
                  <>
                    <div
                      style={{ width: `${(xuatSacCount / totalStudents) * 100}%` }}
                      className="bg-amber-400 h-full transition-all duration-500"
                      title={`Xuất sắc: ${xuatSacCount} em`}
                    />
                    <div
                      style={{ width: `${(tieuBieuCount / totalStudents) * 100}%` }}
                      className="bg-blue-500 h-full transition-all duration-500"
                      title={`Tiêu biểu: ${tieuBieuCount} em`}
                    />
                    <div
                      style={{ width: `${(hoanThanhCount / totalStudents) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                      title={`Hoàn thành: ${hoanThanhCount} em`}
                    />
                    <div
                      style={{ width: `${(canCoGangCount / totalStudents) * 100}%` }}
                      className="bg-slate-400 h-full transition-all duration-500"
                      title={`Chưa hoàn thành: ${canCoGangCount} em`}
                    />
                  </>
                )}
              </div>

              {/* Legend with percentages */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/60">
                  <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-900">Xuất sắc</p>
                    <p className="text-[11px] text-amber-700 font-semibold">
                      {xuatSacCount} em ({totalStudents > 0 ? Math.round((xuatSacCount / totalStudents) * 100) : 0}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200/60">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="font-bold text-blue-900">Tiêu biểu</p>
                    <p className="text-[11px] text-blue-700 font-semibold">
                      {tieuBieuCount} em ({totalStudents > 0 ? Math.round((tieuBieuCount / totalStudents) * 100) : 0}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-900">Hoàn thành</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      {hoanThanhCount} em ({totalStudents > 0 ? Math.round((hoanThanhCount / totalStudents) * 100) : 0}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">Chưa hoàn thành</p>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      {canCoGangCount} em ({totalStudents > 0 ? Math.round((canCoGangCount / totalStudents) * 100) : 0}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LỊCH TRÌNH & SỰ KIỆN (SCHEDULE & TIMELINE) */}
      {/* ========================================================================= */}
      {activeTab === 'SCHEDULE' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Class Events Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Lịch Hoạt Động & Kế Hoạch Của Lớp
                </h3>
                <p className="text-xs text-slate-500">
                  Các mốc kiểm tra định kỳ, họp phụ huynh và hoạt động trải nghiệm lớp {classInfo.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Sự Kiện</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setEventFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  eventFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({classEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('UPCOMING')}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  eventFilter === 'UPCOMING' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sắp tới
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('EXAM')}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  eventFilter === 'EXAM' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kiểm tra
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('MEETING')}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  eventFilter === 'MEETING' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Họp PH
              </button>
            </div>

            {/* Events Timeline */}
            <div className="space-y-3">
              {sortedEvents.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Chưa có sự kiện nào phù hợp với bộ lọc.</p>
                </div>
              ) : (
                sortedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      ev.isImportant
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50/70 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center font-black shrink-0 shadow-2xs">
                        <span className="text-[10px] uppercase text-blue-600">
                          Thg {parseInt(ev.date.split('-')[1])}
                        </span>
                        <span className="text-base text-slate-900 leading-none">
                          {ev.date.split('-')[2]}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm text-slate-900">{ev.title}</h4>
                          {ev.isImportant && (
                            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded">
                              Quan trọng
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>⏰ {ev.time}</span>
                          {ev.location && <span>• 📍 {ev.location}</span>}
                        </p>
                        {ev.description && (
                          <p className="text-xs text-slate-600 italic">{ev.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        deleteClassEvent(ev.id);
                        toast.success('Đã xóa sự kiện thành công!');
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-colors self-end sm:self-center cursor-pointer"
                      title="Xóa sự kiện"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POP-UP MODAL: THÊM SỰ KIỆN MỚI CỦA LỚP */}
      {/* ========================================================================= */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-base">Thêm Sự Kiện Lớp Mới</h3>
              </div>
              <button
                onClick={() => setIsAddEventModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Sự Kiện / Kế Hoạch *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kiểm tra Giữa kỳ I môn Toán, Họp PHĐN..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày Diễn Ra *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Thời Gian
                  </label>
                  <input
                    type="text"
                    placeholder="08:00 - 10:30"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Loại Sự Kiện
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as ClassEventType)}
                    className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="EXAM">Kiểm tra định kỳ (TT27)</option>
                    <option value="MEETING">Họp phụ huynh</option>
                    <option value="ACTIVITY">Hoạt động trải nghiệm</option>
                    <option value="FESTIVAL">Lễ hội / Thi đua</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Địa Điểm
                  </label>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mô Tả / Lưu Ý Cho Học Sinh
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về đồ dùng học tập cần mang, đồng phục..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="eventImportant"
                  checked={newEventImportant}
                  onChange={(e) => setNewEventImportant(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="eventImportant" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Đánh dấu là Sự kiện quan trọng (Ưu tiên thông báo)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Lưu Sự Kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conference Scheduler Modal */}
      <ConferenceSchedulerModal
        isOpen={isConferenceModalOpen}
        onClose={() => setIsConferenceModalOpen(false)}
      />

      {/* AI Class Diagnostic Modal */}
      <AIClassDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />

      {/* Class Meeting Planner Modal */}
      <ClassMeetingPlannerModal
        isOpen={isPlannerModalOpen}
        onClose={() => setIsPlannerModalOpen(false)}
      />

      {/* Zalo Message Generator Modal */}
      <ZaloMessageGeneratorModal
        isOpen={isZaloModalOpen}
        onClose={() => setIsZaloModalOpen(false)}
      />
    </div>
  );
}
