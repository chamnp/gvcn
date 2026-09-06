'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Pencil,
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
  HeartHandshake,
  Zap,
  Activity,
  Tv,
  Presentation,
  ShieldCheck,
  HeartPulse,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import {
  TERMS,
  evaluateStudentTT27,
  getAwardBadgeClass,
  calculateEvaluationProgress,
  validateTT27Assessments,
  getLocalDateString,
} from '@/lib/tt27-engine';
import { DAYS_OF_WEEK, getSubjectTheme } from '@/lib/timetable-data';
import { DayOfWeek, ClassEvent, ClassEventType, CLASS_EVENT_TYPE_CONFIG } from '@/types';
import { ProgressMeterWidget } from '@/components/assessment/progress-meter-widget';
import { GuardrailsAlertModal } from '@/components/assessment/guardrails-alert-modal';
import { EarlyInterventionWidget } from '@/components/dashboard/early-intervention-widget';
import { ConferenceSchedulerModal } from '@/components/conference/conference-scheduler-modal';
import { ClassEventModal } from '@/components/events/class-event-modal';
import { AIClassDiagnosticModal } from '@/components/assessment/ai-class-diagnostic-modal';
import { ClassMeetingPlannerModal } from '@/components/planner/class-meeting-planner-modal';
import { ZaloMessageGeneratorModal } from '@/components/parent/zalo-message-generator-modal';
import { scanEarlyInterventionAlerts } from '@/lib/early-intervention';
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
    periods,
    classEvents,
    addClassEvent,
    updateClassEvent,
    deleteClassEvent,
    leaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    conferenceSlots,
    featureFlags,
    allHomeworks,
  } = useAppStore();
  const { profile } = useAuth();

  const classHomeworks = useMemo(() => {
    return (allHomeworks || []).filter((h) => !h.classId || h.classId === classInfo.id);
  }, [allHomeworks, classInfo.id]);

  const router = useRouter();
  const [isFilterIncomplete, setIsFilterIncomplete] = useState(false);
  const [isGuardrailsModalOpen, setIsGuardrailsModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClassEvent | null>(null);
  const [isConferenceModalOpen, setIsConferenceModalOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);
  const [copiedWishId, setCopiedWishId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'UPCOMING' | 'EXAM' | 'MEETING' | 'ACTIVITY' | 'FESTIVAL'>('ALL');

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const teacherDisplayName = useMemo(() => {
    return classInfo.teacherName || profile?.fullName || 'Thầy/Cô';
  }, [profile, classInfo.teacherName]);

  // Thống kê sĩ số học sinh
  const totalStudents = students.length;
  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;
  const boardingCount = students.filter((s) => s.isBoarding).length;

  // Tập hợp ID học sinh thuộc lớp hiện tại để scope an toàn
  const classStudentIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);

  // Điểm danh hôm nay (giờ địa phương Việt Nam & lọc chính xác theo lớp)
  const todayStr = getLocalDateString();
  const todayAtt = useMemo(() => {
    return attendances.filter((a) => a.date === todayStr && classStudentIds.has(a.studentId));
  }, [attendances, todayStr, classStudentIds]);

  const isAttendanceTakenToday = todayAtt.length > 0;
  const presentDirectCount = todayAtt.filter((a) => a.status === 'CO_MAT').length;
  const lateCount = todayAtt.filter((a) => a.status === 'MUON').length;
  const excusedAbsentCount = todayAtt.filter((a) => a.status === 'VANG_CO_PHEP').length;
  const unexcusedAbsentCount = todayAtt.filter((a) => a.status === 'VANG_KHONG_PHEP').length;
  const absentCount = excusedAbsentCount + unexcusedAbsentCount;
  const presentCount = isAttendanceTakenToday ? (presentDirectCount + lateCount) : totalStudents;
  const todayMeals = isAttendanceTakenToday
    ? todayAtt.filter((a) => a.hasBoardingMeal && (a.status === 'CO_MAT' || a.status === 'MUON')).length
    : boardingCount;

  // Auto-open modals from notification links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openConference') === 'true') {
        setIsConferenceModalOpen(true);
      }
    }
  }, []);

  // Phân loại kết quả học sinh kỳ này (TT27)
  let xuatSacCount = 0;
  let tieuBieuCount = 0;
  let hoanThanhCount = 0;
  let canCoGangCount = 0;
  let chuaDanhGiaCount = 0;

  students.forEach((st) => {
    const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
    const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
    const summary = termSummaries.find((ts) => ts.studentId === st.id && ts.term === currentTerm);

    if (!summary && sAss.length === 0 && tAss.length === 0) {
      chuaDanhGiaCount++;
      return;
    }

    const award = summary?.awardTitle || evaluateStudentTT27(sAss, tAss, currentTerm).awardTitle;

    if (award === 'Học sinh Xuất sắc') xuatSacCount++;
    else if (award === 'Học sinh Tiêu biểu hoàn thành tốt') tieuBieuCount++;
    else if (award === 'Hoàn thành chương trình lớp học' || award === 'Khen thưởng từng mặt') hoanThanhCount++;
    else canCoGangCount++;
  });

  // Sao thi đua nề nếp (chỉ tính cho học sinh thuộc lớp hiện tại)
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

  // Sắp xếp và lọc sự kiện lớp
  const sortedEvents = useMemo(() => {
    return [...classEvents]
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((ev) => {
        const evType = ev.type || ev.eventType;
        if (eventFilter === 'ALL') return true;
        if (eventFilter === 'UPCOMING') return ev.date >= todayStr;
        return evType === eventFilter;
      });
  }, [classEvents, eventFilter, todayStr]);

  // Đếm số lượng sự kiện theo từng bộ lọc
  const eventCounts = useMemo(() => {
    return {
      ALL: classEvents.length,
      UPCOMING: classEvents.filter((ev) => ev.date >= todayStr).length,
      EXAM: classEvents.filter((ev) => (ev.type || ev.eventType) === 'EXAM').length,
      MEETING: classEvents.filter((ev) => (ev.type || ev.eventType) === 'MEETING').length,
      ACTIVITY: classEvents.filter((ev) => (ev.type || ev.eventType) === 'ACTIVITY').length,
      FESTIVAL: classEvents.filter((ev) => (ev.type || ev.eventType) === 'FESTIVAL').length,
    };
  }, [classEvents, todayStr]);

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

  const isWeekend = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 || d === 6;
  }, []);

  const todayDayName = useMemo(() => {
    const d = new Date().getDay();
    const map: { [key: number]: string } = {
      1: 'Thứ Hai',
      2: 'Thứ Ba',
      3: 'Thứ Tư',
      4: 'Thứ Năm',
      5: 'Thứ Sáu',
      6: 'Thứ Bảy',
      0: 'Chủ Nhật',
    };
    return map[d] || 'Hôm nay';
  }, []);

  const todayPeriods = useMemo(() => {
    return timetable.filter((item) => item.day === todayDayOfWeek);
  }, [timetable, todayDayOfWeek]);

  // Đơn xin nghỉ phép chờ duyệt (chỉ cho học sinh thuộc lớp)
  const pendingLeaves = useMemo(() => {
    return (leaveRequests || []).filter(
      (r) => r.status === 'PENDING' && (r.classId === classInfo.id || classStudentIds.has(r.studentId))
    );
  }, [leaveRequests, classInfo.id, classStudentIds]);

  // Khung giờ họp 1-1 thuộc lớp
  const classConferenceSlots = useMemo(() => {
    return (conferenceSlots || []).filter((s) => !s.classId || s.classId === classInfo.id);
  }, [conferenceSlots, classInfo.id]);

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
      {/* 1. HERO BANNER SANG TRỌNG & HIỆN ĐẠI */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Award className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Năm học {classInfo.schoolYear || '2026-2027'}</span>
                <span className="text-white/40">•</span>
                <span className="font-bold text-amber-300">Lớp {classInfo.name}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Xin chào, {teacherDisplayName}! 👋
              </h1>

              <p className="text-sm sm:text-base text-blue-100 font-medium max-w-2xl leading-relaxed">
                Trợ lý sư phạm & Quản trị lớp <strong>{classInfo.name}</strong> ({classInfo.schoolName || profile?.schoolName || 'Trường Tiểu học'}).
              </p>
            </div>

            {/* Quick Actions Hub */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/classroom-tools"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all cursor-pointer"
              >
                <Tv className="w-4 h-4" />
                <span>Công Cụ Lớp Học (TV)</span>
              </Link>

              <Link
                href="/attendance"
                className="inline-flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl backdrop-blur-md border border-white/30 hover:scale-105 transition-all cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-emerald-300" />
                <span>Điểm Danh Bán Trú</span>
              </Link>

              <Link
                href="/behavior"
                className="inline-flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl backdrop-blur-md border border-white/30 hover:scale-105 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Tích Sao Nề Nếp</span>
              </Link>

              <Link
                href="/homework"
                className="inline-flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl backdrop-blur-md border border-white/30 hover:scale-105 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-cyan-300" />
                <span>Giao Bài Tập</span>
              </Link>
            </div>
          </div>

          {/* Quick Nav Shortcuts Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/15 text-xs">
            <Link
              href="/timetable"
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-semibold backdrop-blur-md border border-white/20 transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-blue-300" />
              <span>Thời Khóa Biểu 2 Buổi</span>
            </Link>
            <Link
              href="/students"
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-semibold backdrop-blur-md border border-white/20 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-pink-300" />
              <span>Hồ Sơ {totalStudents} Học Sinh</span>
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-semibold backdrop-blur-md border border-white/20 transition-all"
            >
              <span>⚙️ Cài Đặt Giờ Học & Tính Năng</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. FESTIVE BIRTHDAY BANNER (If Today has Birthday) */}
      {todayBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <Cake className="w-48 h-48 text-white" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0 animate-bounce">
                🎂
              </div>
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <PartyPopper className="w-3.5 h-3.5 text-amber-200" />
                  <span>Hôm nay có sinh nhật thành viên lớp {classInfo.name}!</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black">
                  Chúc Mừng Sinh Nhật Em {todayBirthdays.map((b) => b.student.fullName).join(', ')} 🎉
                </h2>
                <p className="text-xs text-rose-100">
                  Hôm nay tròn <strong>{todayBirthdays[0]?.turningAge || 10}</strong> tuổi. Chúc em luôn chăm ngoan, học giỏi và ngập tràn niềm vui!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {todayBirthdays.map((b) => (
                <button
                  key={b.student.id}
                  type="button"
                  onClick={() => handleCopyWish(b.student.fullName, b.turningAge, b.student.id)}
                  className="inline-flex items-center space-x-1.5 bg-white text-rose-700 hover:bg-rose-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {copiedWishId === b.student.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Đã sao chép lời chúc!</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 text-rose-600" />
                      <span>Sao Chép Lời Chúc Zalo ({b.student.fullName})</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. CORE KPI STATS GRID (4 TILES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Sĩ số */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sĩ Số Học Sinh</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {totalStudents} <span className="text-xs font-normal text-slate-500">em</span>
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
              <span className="text-blue-600 font-bold">👦 Nam: {maleCount}</span>
              <span>•</span>
              <span className="text-pink-600 font-bold">👧 Nữ: {femaleCount}</span>
            </div>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Chuyên cần */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chuyên Cần Hôm Nay</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {presentCount}/{totalStudents}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium flex-wrap">
              <span className="flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-amber-500" />
                <span>Bán trú: <strong className="text-slate-800">{todayMeals}</strong></span>
              </span>
              <span>•</span>
              <span className={absentCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                Vắng: {absentCount}
              </span>
              {lateCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 font-bold">Muộn: {lateCount}</span>
                </>
              )}
            </div>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Lịch dạy / Khen thưởng TT27 */}
        {featureFlags?.assessment ? (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khen Thưởng TT27</p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                {xuatSacCount + tieuBieuCount} <span className="text-xs font-normal text-slate-500">em</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                <span className="text-amber-600 font-bold">Xuất sắc: {xuatSacCount}</span>
                <span>•</span>
                <span className="text-blue-600 font-bold">Tiêu biểu: {tieuBieuCount}</span>
              </div>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lịch Dạy Hôm Nay</p>
              <h3 className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
                {todayPeriods.length} <span className="text-xs font-normal text-slate-500">tiết</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                <span className="text-blue-700 font-bold">{todayDayName}</span>
                <span>•</span>
                <Link href="/timetable" className="text-blue-600 hover:underline">
                  Xem chi tiết →
                </Link>
              </div>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* KPI 4: Sao nề nếp */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sao Thi Đua Nề Nếp</p>
            <h3 className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
              {totalClassStars} <span className="text-xs font-normal text-slate-500">⭐</span>
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
              <span>Đã ghi nhận: <strong className="text-purple-700 font-bold">{activeClassStarLogs.length}</strong> lượt</span>
            </div>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. PENDING LEAVE REQUESTS ALERT BAR (If Any) */}
      {pendingLeaves.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black animate-pulse">
                !
              </div>
              <div>
                <h3 className="font-black text-sm text-rose-900">
                  Có {pendingLeaves.length} Đơn Xin Nghỉ Phép Chờ Giáo Viên Phê Duyệt
                </h3>
                <p className="text-xs text-rose-700">Phụ huynh đã gửi đơn qua cổng thông tin trực tuyến</p>
              </div>
            </div>
            <Link href="/attendance" className="text-xs font-bold text-rose-700 hover:underline">
              Mở sổ điểm danh →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingLeaves.map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{req.studentName}</span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {req.startDate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    <strong>Lý do:</strong> {req.reasonDetail || req.reasonType}
                  </p>
                  {req.hasBoardingMealCancel && (
                    <span className="inline-block bg-orange-100 text-orange-900 text-[10px] font-bold px-2 py-0.5 rounded mt-1">
                      🍽️ Hủy suất ăn bán trú
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      rejectLeaveRequest(req.id);
                      toast.error(`Đã từ chối đơn của ${req.studentName}`);
                    }}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      approveLeaveRequest(req.id);
                      toast.success(`Đã duyệt đơn nghỉ phép của ${req.studentName}`);
                    }}
                    className="px-3.5 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    Duyệt Đơn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. MAIN SEAMLESS TWO-COLUMN EXECUTIVE DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========================================================================= */}
        {/* LEFT 2 COLUMNS: ACADEMIC PROGRESS OR DAILY OPERATIONS HUB */}
        {/* ========================================================================= */}
        <div className="lg:col-span-2 space-y-6">
          {featureFlags?.assessment ? (
            <>
              {/* A. PROGRESS METER */}
              <ProgressMeterWidget
                progress={progress}
                issues={issues}
                isFilterIncomplete={isFilterIncomplete}
                onToggleFilterIncomplete={() => {
                  router.push('/assessment?filterIncomplete=true');
                }}
                onOpenGuardrailsModal={() => setIsGuardrailsModalOpen(true)}
              />

              {/* B. EARLY INTERVENTION RADAR */}
              <EarlyInterventionWidget alerts={earlyAlerts} />

              {/* B. TT27 AWARD CLASSIFICATION & VISUAL BREAKDOWN */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                      <span>📊 Biểu Đồ Phân Loại Kết Quả Giáo Dục — {termName}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đánh giá định kỳ {totalStudents} học sinh theo Thông tư 27/2020/TT-BGDĐT
                    </p>
                  </div>

                  <Link
                    href="/assessment"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
                  >
                    <span>Mở Bảng Đánh Giá Chi Tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Visual Multi-Segment Bar Chart */}
                <div className="space-y-3.5">
                  <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
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
                          className="bg-rose-400 h-full transition-all duration-500"
                          title={`Chưa hoàn thành: ${canCoGangCount} em`}
                        />
                        {chuaDanhGiaCount > 0 && (
                          <div
                            style={{ width: `${(chuaDanhGiaCount / totalStudents) * 100}%` }}
                            className="bg-slate-300 h-full transition-all duration-500"
                            title={`Chưa đánh giá: ${chuaDanhGiaCount} em`}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Legend with percentages */}
                  <div className={`grid grid-cols-2 ${chuaDanhGiaCount > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3 text-xs`}>
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0" />
                      <div>
                        <p className="font-bold text-amber-900">Xuất sắc</p>
                        <p className="text-[11px] text-amber-700 font-semibold">
                          {xuatSacCount} em ({totalStudents > 0 ? Math.round((xuatSacCount / totalStudents) * 100) : 0}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50 border border-blue-200/80">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0" />
                      <div>
                        <p className="font-bold text-blue-900">Tiêu biểu</p>
                        <p className="text-[11px] text-blue-700 font-semibold">
                          {tieuBieuCount} em ({totalStudents > 0 ? Math.round((tieuBieuCount / totalStudents) * 100) : 0}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-900">Hoàn thành</p>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          {hoanThanhCount} em ({totalStudents > 0 ? Math.round((hoanThanhCount / totalStudents) * 100) : 0}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200">
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-400 shrink-0" />
                      <div>
                        <p className="font-bold text-rose-800">Chưa hoàn thành</p>
                        <p className="text-[11px] text-rose-600 font-semibold">
                          {canCoGangCount} em ({totalStudents > 0 ? Math.round((canCoGangCount / totalStudents) * 100) : 0}%)
                        </p>
                      </div>
                    </div>

                    {chuaDanhGiaCount > 0 && (
                      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-400 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-700">Chưa đánh giá</p>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            {chuaDanhGiaCount} em ({totalStudents > 0 ? Math.round((chuaDanhGiaCount / totalStudents) * 100) : 0}%)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* A. BÁN TRÚ & CHUYÊN CẦN HÔM NAY */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>🍱 Tình Hình Bán Trú & Chuyên Cần Hôm Nay</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {todayStr.split('-').reverse().join('/')}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        Theo dõi chuyên cần và số lượng suất ăn bán trú thực tế của lớp {classInfo.name}.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/attendance"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
                  >
                    <span>Mở Sổ Điểm Danh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-slate-500 font-medium">Sĩ số lớp</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{totalStudents} em</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">👦 {maleCount} Nam • 👧 {femaleCount} Nữ</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <p className="text-emerald-700 font-medium">Có mặt hôm nay</p>
                    <p className="text-xl font-black text-emerald-700 mt-1">
                      {presentCount} <span className="text-xs font-bold">({totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}%)</span>
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      {isAttendanceTakenToday
                        ? `${presentDirectCount} đúng giờ${lateCount > 0 ? ` • ${lateCount} muộn` : ''}`
                        : 'Mặc định (Chưa điểm danh)'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <p className="text-amber-700 font-medium">Suất ăn bán trú</p>
                    <p className="text-xl font-black text-amber-700 mt-1">{todayMeals} / {boardingCount}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      {isAttendanceTakenToday ? 'Theo điểm danh thực tế' : 'Dự kiến toàn bộ bán trú'}
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-2xl border ${absentCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <p className="font-medium">Vắng mặt</p>
                    <p className="text-xl font-black mt-1">{absentCount} em</p>
                    <p className="text-[10px] mt-0.5 opacity-80">
                      {absentCount > 0
                        ? `${excusedAbsentCount} có phép • ${unexcusedAbsentCount} không phép`
                        : 'Không có em nào vắng'}
                    </p>
                  </div>
                </div>
              </div>

              {/* B. BÀI TẬP VỀ NHÀ ĐANG GIAO & CỔNG HỌC SINH */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>📝 Giao Bài Tập & Cổng Học Sinh Trực Tuyến</span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {classHomeworks.length} bài tập
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        Phụ huynh và học sinh nộp bài, xem kết quả trực tiếp không cần đăng nhập.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/hw/${(classInfo.shareToken || classInfo.name).toLowerCase().replace(/\s+/g, '')}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0"
                    >
                      <span>Cổng Học Sinh</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/homework"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
                    >
                      <span>+ Giao Bài Mới</span>
                    </Link>
                  </div>
                </div>

                {classHomeworks.length > 0 ? (
                  <div className="space-y-3 text-xs">
                    {classHomeworks.slice(0, 3).map((hw) => (
                      <div
                        key={hw.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{hw.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Môn: <strong className="text-slate-700">{hw.subjectName || hw.subjectCode}</strong> • Hạn nộp: {hw.dueDate}
                          </p>
                        </div>
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-bold text-[11px] shrink-0">
                          {hw.isQuiz ? 'Trắc nghiệm' : 'Tự luận'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    <p>Lớp chưa có bài tập nào đang giao. Bấm "+ Giao Bài Mới" để tạo bài tập hoặc trắc nghiệm online.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* C. CLASS EVENTS & TIMELINE WIDGET */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Lịch Sự Kiện & Hoạt Động Của Lớp {classInfo.name}</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {classEvents.length} sự kiện
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Theo dõi lịch kiểm tra, lễ hội, họp phụ huynh và hoạt động trải nghiệm.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsConferenceModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>📅 Khung Giờ Họp 1-1</span>
                  {classConferenceSlots.filter((s) => s.isBooked).length > 0 && (
                    <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                      {classConferenceSlots.filter((s) => s.isBooked).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setIsEventModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Sự Kiện</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'ALL', label: 'Tất cả', count: eventCounts.ALL },
                { id: 'UPCOMING', label: 'Sắp tới', count: eventCounts.UPCOMING },
                { id: 'EXAM', label: '🏆 Kiểm tra', count: eventCounts.EXAM },
                { id: 'MEETING', label: '👥 Họp PH', count: eventCounts.MEETING },
                { id: 'ACTIVITY', label: '🎒 Trải nghiệm', count: eventCounts.ACTIVITY },
                { id: 'FESTIVAL', label: '🎪 Lễ hội', count: eventCounts.FESTIVAL },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEventFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    eventFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      eventFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Events Timeline List */}
            {sortedEvents.length > 0 ? (
              <div className="space-y-3">
                {sortedEvents.map((ev) => {
                  const [evYear, evMonth, evDay] = ev.date.split('-').map(Number);
                  const isTodayEvent = ev.date === todayStr;
                  const rawType = ev.type || ev.eventType || 'OTHER';
                  const typeConf = CLASS_EVENT_TYPE_CONFIG[rawType] || CLASS_EVENT_TYPE_CONFIG.OTHER;

                  return (
                    <div
                      key={ev.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isTodayEvent
                          ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                          : ev.isImportant
                          ? 'bg-indigo-50/60 border-indigo-200'
                          : 'bg-slate-50/70 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5 min-w-0">
                        {/* Date Block */}
                        <div
                          className={`w-12 h-13 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold border shadow-xs ${
                            isTodayEvent
                              ? 'bg-amber-500 text-white border-amber-600'
                              : ev.isImportant
                              ? 'bg-indigo-600 text-white border-indigo-700'
                              : 'bg-white text-slate-800 border-slate-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider opacity-80 leading-none">
                            Thg {evMonth || 1}
                          </span>
                          <span className="text-base font-black leading-none mt-1">{evDay || 1}</span>
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{ev.title}</h4>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeConf.badgeColor}`}>
                              <span>{typeConf.icon}</span>
                              <span>{typeConf.shortLabel}</span>
                            </span>
                            {isTodayEvent && (
                              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                                Hôm nay
                              </span>
                            )}
                            {ev.isImportant && (
                              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                Quan trọng
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {ev.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{ev.time}</span>
                              </span>
                            )}
                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{ev.location}</span>
                              </span>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-slate-600 italic mt-0.5">{ev.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons: Edit & Delete */}
                      <div className="flex items-center space-x-1 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(ev);
                            setIsEventModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
                          title="Chỉnh sửa sự kiện"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa sự kiện "${ev.title}"?`)) {
                              deleteClassEvent(ev.id);
                              toast.success('Đã xóa sự kiện thành công!');
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
                          title="Xóa sự kiện"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                <p>Chưa có sự kiện nào phù hợp với bộ lọc.</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT 1 COLUMN: TIMETABLE, TOP 5 STARS & BIRTHDAYS */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* WIDGET 1: THỜI KHÓA BIỂU HÔM NAY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Thời Khóa Biểu Hôm Nay</span>
              </h2>
              <Link href="/timetable" className="text-xs text-blue-600 font-bold hover:underline">
                Xem tuần →
              </Link>
            </div>

            <div className="text-xs text-slate-500 font-semibold px-1">
              📅 {todayDayName} {isWeekend ? '(Nghỉ cuối tuần — Xem TKB Thứ Hai)' : `(${todayPeriods.length} tiết)`}
            </div>

            <div className="space-y-2 text-xs">
              {periods.slice(0, Math.max(5, todayPeriods.length)).map((p) => {
                const slot = timetable.find((s) => s.day === todayDayOfWeek && s.period === p.period);
                const theme = slot ? getSubjectTheme(slot.subjectCode) : null;

                return (
                  <div
                    key={p.period}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-colors ${
                      theme ? `${theme.bgColor} ${theme.borderColor}` : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-500 text-[11px] w-10">
                        {p.name}
                      </span>
                      <span className="text-base">{theme?.icon || '📚'}</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {slot?.subjectName || 'Tự học / Nghỉ'}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{p.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WIDGET 2: BẢNG VINH DANH NGÔI SAO NỀ NẾP (TOP 5 LEADERBOARD) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>Ngôi Sao Nề Nếp Tuần</span>
              </h2>
              <Link href="/behavior" className="text-xs text-purple-600 font-bold hover:underline">
                Tặng sao →
              </Link>
            </div>

            {topStarStudents.length > 0 ? (
              <div className="space-y-2 text-xs">
                {topStarStudents.map((st, i) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-purple-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          i === 0
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : i === 1
                            ? 'bg-slate-300 text-slate-700'
                            : i === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{st.fullName}</p>
                        <p className="text-[10px] text-slate-400">{st.tags?.[0] || 'Học sinh'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-purple-300">
                      <span>⭐</span>
                      <span>{st.stars} sao</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs space-y-1">
                <p className="text-2xl">⭐</p>
                <p className="font-semibold text-slate-600">Chưa có điểm sao tuần này</p>
                <p className="text-[11px] text-slate-400">Vào Quản lý Nề nếp để khen thưởng và cộng sao cho các em</p>
              </div>
            )}

            <Link
              href="/behavior"
              className="w-full py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold text-xs text-center transition-colors block"
            >
              + Đánh giá & Trao sao thi đua
            </Link>
          </div>

          {/* WIDGET 3: LỊCH SINH NHẬT CÁC BẠN TRONG LỚP */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cake className="w-5 h-5 text-rose-500" />
                <span>Sinh Nhật Trong Lớp</span>
              </h2>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {studentBirthdayList.filter((b) => b.isThisMonth).length} em trong tháng
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {studentBirthdayList.slice(0, 4).map((b) => (
                <div
                  key={b.student.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                    b.isToday
                      ? 'bg-rose-50 border-rose-300 shadow-xs'
                      : b.isThisWeek
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        b.isToday
                          ? 'bg-rose-500 text-white animate-pulse'
                          : b.isThisWeek
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {b.isToday ? '🎂' : '🎁'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate flex items-center gap-1">
                        <span>{b.student.fullName}</span>
                        {b.isToday && (
                          <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full">
                            Hôm nay!
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {b.formattedDate} • Tròn <strong>{b.turningAge}</strong> tuổi
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {b.isToday ? (
                      <button
                        type="button"
                        onClick={() => handleCopyWish(b.student.fullName, b.turningAge, b.student.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedWishId === b.student.id ? 'Đã chép!' : 'Chúc mừng 🎉'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {b.daysRemaining === 1 ? 'Ngày mai' : `Còn ${b.daysRemaining} ngày`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: THÊM / CHỈNH SỬA SỰ KIỆN CỦA LỚP */}
      {/* ========================================================================= */}
      <ClassEventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        editingEvent={editingEvent}
        className={classInfo.name}
      />

      {/* Conference Scheduler Modal */}
      <ConferenceSchedulerModal
        isOpen={isConferenceModalOpen}
        onClose={() => setIsConferenceModalOpen(false)}
        isTeacher={true}
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

      {/* TT27 Guardrails Alert Modal */}
      <GuardrailsAlertModal
        isOpen={isGuardrailsModalOpen}
        onClose={() => setIsGuardrailsModalOpen(false)}
        issues={issues}
        onNavigateToStudent={(studentId) => {
          router.push(`/assessment?student=${studentId}`);
        }}
      />
    </div>
  );
}
