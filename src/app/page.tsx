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

  const nextUpcomingEvent = classEvents
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

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
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Glow & background patterns */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Award className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-white/20">
              <Compass className="w-3.5 h-3.5 text-yellow-300" />
              <span>Năm học: <strong>2026-2027</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-300 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-yellow-400/30">
              <span>📚 Kỳ: {termName}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-emerald-400/30">
              <span>🏫 {classInfo.schoolName}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-snug">
            Xin chào {teacherDisplayName}! 🌟
          </h1>

          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Bảng điều khiển <strong>Lớp {classInfo.name}</strong> — {profile?.role === 'ADMIN' ? `GVCN: ${classInfo.teacherName || 'Chưa phân công'}` : `Theo dõi nề nếp, điểm danh và đánh giá TT27`}.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1.5">
            <Link
              href="/assessment"
              className="inline-flex items-center justify-center space-x-1.5 bg-white text-blue-900 font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:bg-blue-50 transition-all cursor-pointer w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Bảng Đánh Giá TT27</span>
            </Link>
            <Link
              href="/ai-assistant"
              className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>Trợ Lý Sư Phạm AI</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsDiagnosticOpen(true)}
              className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>🤖 AI Chẩn Đoán Sư Phạm</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPlannerModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>📝 Soạn Sinh Hoạt Lớp</span>
            </button>
            <button
              type="button"
              onClick={() => setIsZaloModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>💬 Soạn Tin Zalo PH</span>
            </button>
            <Link
              href="/classroom-tools"
              className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>🎡 Công Cụ Lớp</span>
            </Link>
            <Link
              href="/parent-meetings"
              className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>📊 Họp Phụ Huynh</span>
            </Link>
            <Link
              href="/health-records"
              className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>🩺 Sức Khỏe & BMI</span>
            </Link>
            <Link
              href="/reading-corner"
              className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>📚 Tủ Sách Lớp</span>
            </Link>
            <Link
              href="/iep"
              className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:opacity-90 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>📑 Kế Hoạch IEP</span>
            </Link>
            <Link
              href="/attendance"
              className="inline-flex items-center justify-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl border border-white/25 backdrop-blur-sm transition-all cursor-pointer w-full sm:w-auto"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Điểm Danh & Bán Trú</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsAddEventModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl border border-white/25 backdrop-blur-sm transition-all cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>Thêm Sự Kiện Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FESTIVE BIRTHDAY HIGHLIGHT HERO BANNER (If Today has Birthday) */}
      {todayBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <Cake className="w-48 h-48 text-white" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0 animate-bounce">
                🎂
              </div>
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <PartyPopper className="w-3.5 h-3.5" />
                  <span>Hôm nay là sinh nhật thành viên lớp {classInfo.name}!</span>
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
                  className="inline-flex items-center space-x-1.5 bg-white text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {copiedWishId === b.student.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Đã sao chép lời chúc!</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 text-rose-600" />
                      <span className="sm:hidden">Chúc Zalo</span>
                      <span className="hidden sm:inline">Sao Chép Lời Chúc Gửi Zalo ({b.student.fullName})</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. KEY METRICS & KPI TILES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sĩ số & Cơ cấu giới tính */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sĩ Số Lớp Học</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {totalStudents} <span className="text-xs font-normal text-slate-500">học sinh</span>
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
              <span className="text-blue-600 font-bold">👦 Nam: {maleCount}</span>
              <span>•</span>
              <span className="text-pink-600 font-bold">👧 Nữ: {femaleCount}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Chuyên cần & Bán trú hôm nay */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chuyên Cần Hôm Nay</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
              {presentCount}/{totalStudents}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-amber-500" />
              <span>Ăn bán trú: <strong className="text-slate-800">{todayMeals}</strong> suất</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Khen thưởng TT27 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Khen Thưởng TT27</p>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <h3 className="text-2xl font-black text-amber-600">{xuatSacCount}</h3>
              <span className="text-xs font-bold text-amber-700">Xuất sắc</span>
              <span className="text-slate-300">|</span>
              <span className="text-lg font-black text-indigo-600">{tieuBieuCount}</span>
              <span className="text-xs font-semibold text-indigo-700">Tiêu biểu</span>
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-1.5">
              Đạt {Math.round(((xuatSacCount + tieuBieuCount) / (totalStudents || 1)) * 100)}% toàn lớp
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Sao nề nếp thi đua */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sao Nề Nếp Lớp</p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5 flex items-center gap-1.5">
              <span>⭐</span>
              <span>{totalClassStars}</span>
              <span className="text-xs font-normal text-slate-500">sao tích lũy</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 truncate">
              {topStarStudents.length > 0 && topStarStudents[0].stars > 0 ? (
                <>
                  Dẫn đầu: <strong className="text-slate-900">{topStarStudents[0].fullName}</strong> ({topStarStudents[0].stars} ⭐)
                </>
              ) : (
                <span className="text-slate-400">Chưa có sao nào được chấm</span>
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* 3.5. TT27 EVALUATION PROGRESS METER WIDGET */}
      <div className="space-y-4">
        <ProgressMeterWidget
          progress={progress}
          issues={issues}
          isFilterIncomplete={false}
          onToggleFilterIncomplete={() => {
            // Direct navigate to /assessment
            window.location.href = '/assessment';
          }}
          compact={false}
        />

        {/* 3.6. EARLY INTERVENTION RADAR WIDGET */}
        <EarlyInterventionWidget alerts={earlyAlerts} />
      </div>

      {/* 3.7. PENDING LEAVE REQUESTS & HEALTH NOTICES WIDGET */}
      {leaveRequests.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 animate-bounce">
                📬
              </div>
              <div>
                <h3 className="font-black text-amber-950 text-sm sm:text-base flex items-center gap-2">
                  <span>Có {leaveRequests.filter((r) => r.status === 'PENDING').length} Đơn Xin Nghỉ Phép Chờ Cô Duyệt</span>
                </h3>
                <p className="text-xs text-amber-800">
                  Duyệt đơn sẽ tự động ghi nhận học sinh vắng có phép vào Sổ Điểm Danh và điều chỉnh suất ăn bán trú.
                </p>
              </div>
            </div>

            <Link
              href="/attendance"
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline self-start sm:self-auto"
            >
              Xem Sổ Điểm Danh →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leaveRequests.filter((r) => r.status === 'PENDING').map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{req.studentName}</span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {req.startDate === req.endDate ? `Nghỉ ngày ${req.startDate}` : `Từ ${req.startDate} đến ${req.endDate}`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Lý do:</strong> {req.reasonDetail}
                  </p>

                  {req.hasBoardingMealCancel && (
                    <span className="inline-block bg-orange-100 text-orange-900 text-[10px] font-bold px-2 py-0.2 rounded mr-1">
                      🍽️ Báo cắt suất ăn bán trú
                    </span>
                  )}

                  {req.medicationNotes && (
                    <div className="bg-rose-50 p-2 rounded-xl border border-rose-100 text-[11px] text-rose-900">
                      <strong>💊 Dặn dò uống thuốc:</strong> {req.medicationNotes}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">
                    Gửi bởi: {req.parentName} ({req.parentPhone})
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => rejectLeaveRequest(req.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Từ Chối
                  </button>
                  <button
                    type="button"
                    onClick={() => approveLeaveRequest(req.id)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
                  >
                    ✅ Duyệt Đơn & Đồng Bộ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: CLASS EVENTS CALENDAR & TT27 ASSESSMENT BREAKDOWN */}
        <div className="lg:col-span-2 space-y-6">
          {/* WIDGET 1: LỊCH SỰ KIỆN & HOẠT ĐỘNG CỦA LỚP */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="truncate">Lịch Sự Kiện & Hoạt Động Của Lớp {classInfo.name}</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {classEvents.length} sự kiện
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Theo dõi lịch thi, lễ hội, họp phụ huynh và hoạt động trải nghiệm.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsConferenceModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>📅 Khung Giờ Họp 1-1</span>
                  {conferenceSlots.filter((s) => s.isBooked).length > 0 && (
                    <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                      {conferenceSlots.filter((s) => s.isBooked).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Sự Kiện</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'UPCOMING', label: 'Sắp tới' },
                { id: 'EXAM', label: '🏆 Khảo sát & Thi' },
                { id: 'MEETING', label: '👥 Họp Phụ huynh' },
                { id: 'FESTIVAL', label: '🎪 Lễ hội & Khai giảng' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEventFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    eventFilter === tab.id
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Events Timeline List */}
            {sortedEvents.length > 0 ? (
              <div className="space-y-3">
                {sortedEvents.map((ev) => {
                  const evDate = new Date(ev.date);
                  const dayNum = evDate.getDate();
                  const monthNum = evDate.getMonth() + 1;
                  const isPast = ev.date < todayStr;
                  const isTodayEvent = ev.date === todayStr;

                  return (
                    <div
                      key={ev.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isTodayEvent
                          ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                          : ev.isImportant
                          ? 'bg-indigo-50/50 border-indigo-200'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
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
                          <span className="text-[10px] uppercase font-semibold leading-tight">Th.{monthNum}</span>
                          <span className="text-lg font-black leading-tight">{dayNum}</span>
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{ev.title}</h3>
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

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
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
                            <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa sự kiện "${ev.title}"?`)) {
                              deleteClassEvent(ev.id);
                              toast.success('Đã xóa sự kiện thành công!');
                            }
                          }}
                          className="w-7 h-7 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Xóa sự kiện"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p>Chưa có sự kiện nào trong danh mục này.</p>
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="mt-2 text-indigo-600 hover:underline font-bold text-xs"
                >
                  + Thêm sự kiện đầu tiên
                </button>
              </div>
            )}
          </div>

          {/* WIDGET 2: BẢNG TỔNG HỢP & BIỂU ĐỒ ĐÁNH GIÁ TT27 */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="truncate">Chất Lượng Đánh Giá Học Sinh ({termName})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân bố kết quả khen thưởng và hoàn thành chương trình lớp học theo Thông tư 27.
                </p>
              </div>
              <Link
                href="/assessment"
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
              >
                <span>Xem đầy đủ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Visual Multi-Segment Bar Chart */}
            <div className="space-y-2.5">
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${(xuatSacCount / (totalStudents || 1)) * 100}%` }}
                  className="bg-amber-400 transition-all duration-500"
                  title={`Xuất sắc: ${xuatSacCount}`}
                />
                <div
                  style={{ width: `${(tieuBieuCount / (totalStudents || 1)) * 100}%` }}
                  className="bg-indigo-500 transition-all duration-500"
                  title={`Tiêu biểu: ${tieuBieuCount}`}
                />
                <div
                  style={{ width: `${(hoanThanhCount / (totalStudents || 1)) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Hoàn thành: ${hoanThanhCount}`}
                />
                <div
                  style={{ width: `${(canCoGangCount / (totalStudents || 1)) * 100}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Cần cố gắng: ${canCoGangCount}`}
                />
              </div>

              {/* Legend with percentages */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>Xuất sắc</span>
                  </div>
                  <p className="text-xs font-black text-amber-700 mt-1">
                    {xuatSacCount} em ({Math.round((xuatSacCount / (totalStudents || 1)) * 100)}%)
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-200">
                  <div className="flex items-center space-x-1.5 font-bold text-indigo-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Tiêu biểu</span>
                  </div>
                  <p className="text-xs font-black text-indigo-700 mt-1">
                    {tieuBieuCount} em ({Math.round((tieuBieuCount / (totalStudents || 1)) * 100)}%)
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Hoàn thành</span>
                  </div>
                  <p className="text-xs font-black text-emerald-700 mt-1">
                    {hoanThanhCount} em ({Math.round((hoanThanhCount / (totalStudents || 1)) * 100)}%)
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-200">
                  <div className="flex items-center space-x-1.5 font-bold text-rose-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Cần cố gắng</span>
                  </div>
                  <p className="text-xs font-black text-rose-700 mt-1">
                    {canCoGangCount} em ({Math.round((canCoGangCount / (totalStudents || 1)) * 100)}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Student Table Preview */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">STT</th>
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3">Môn học</th>
                    <th className="py-2.5 px-3">Phẩm chất / NL</th>
                    <th className="py-2.5 px-3">Danh hiệu</th>
                    <th className="py-2.5 px-3 text-right">Học bạ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.slice(0, 5).map((st, idx) => {
                    const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                    const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                    const summary = termSummaries.find((ts) => ts.studentId === st.id && ts.term === currentTerm);
                    const evalRes = evaluateStudentTT27(sAss, tAss, currentTerm);
                    const award = summary?.awardTitle || evalRes.awardTitle;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{st.fullName}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {evalRes.overallLearningLevel === 'T' ? 'Tất cả Tốt (T)' : 'Hoàn thành (H)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {evalRes.overallTraitsLevel === 'T' ? 'Tốt (T)' : 'Đạt (Đ)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] border font-bold ${getAwardBadgeClass(award)}`}>
                            {award}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href="/assessment"
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: BIRTHDAYS, LEADERBOARD, TIMETABLE & FUND */}
        <div className="space-y-6">
          {/* WIDGET 3: LỊCH SINH NHẬT CÁC BẠN TRONG LỚP (BIRTHDAYS) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
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

          {/* WIDGET 4: BẢNG VINH DANH NGÔI SAO NỀ NẾP (TOP 5 LEADERBOARD) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>Ngôi Sao Nề Nếp Tuần</span>
              </h2>
              <Link href="/behavior" className="text-xs text-blue-600 font-bold hover:underline">
                Tặng sao →
              </Link>
            </div>

            {topStarStudents.length > 0 ? (
              <div className="space-y-2 text-xs">
                {topStarStudents.map((st, i) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          i === 0
                            ? 'bg-amber-400 text-white shadow-xs'
                            : i === 1
                            ? 'bg-slate-300 text-slate-700'
                            : i === 2
                            ? 'bg-amber-700/60 text-white'
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
                    <div className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-300">
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
          </div>

          {/* WIDGET 5: THỜI KHÓA BIỂU HÔM NAY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Thời Khóa Biểu Hôm Nay</span>
              </h2>
              <Link href="/timetable" className="text-xs text-blue-600 font-bold hover:underline">
                Xem tuần →
              </Link>
            </div>

            <div className="space-y-1.5 text-xs">
              {PERIODS.slice(0, 5).map((p) => {
                const dayKey: DayOfWeek = (new Date().getDay() >= 1 && new Date().getDay() <= 5 ? `T${new Date().getDay() + 1}` : 'T2') as DayOfWeek;
                const slot = timetable.find((s) => s.day === dayKey && s.period === p.period);
                const theme = slot ? getSubjectTheme(slot.subjectCode) : null;

                return (
                  <div
                    key={p.period}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                      theme ? `${theme.bgColor} ${theme.borderColor}` : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-500 font-mono text-[10px] w-10">
                        {p.name}
                      </span>
                      <span className="text-sm">{theme?.icon || '📚'}</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {slot?.subjectName || 'Tự học / Nghỉ'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{p.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* POP-UP MODAL: THÊM SỰ KIỆN MỚI CỦA LỚP */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Thêm Sự Kiện / Hoạt Động Lớp</h3>
                  <p className="text-xs text-slate-500">Lên lịch các kỳ thi, lễ hội và họp phụ huynh của lớp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEventModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Tên sự kiện / Hoạt động *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiểm Tra Giữa Kỳ 1, Hội Thi Văn Nghệ 20/11..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Ngày diễn ra *</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Khung giờ</label>
                  <input
                    type="text"
                    placeholder="08:00 - 10:30"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Phân loại sự kiện</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as ClassEventType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="ACTIVITY">🎒 Hoạt động trải nghiệm</option>
                    <option value="EXAM">🏆 Khảo sát & Thi đánh giá</option>
                    <option value="MEETING">👥 Họp phụ huynh</option>
                    <option value="FESTIVAL">🎪 Lễ hội / Khai giảng</option>
                    <option value="HOLIDAY">🏖️ Nghỉ lễ</option>
                    <option value="OTHER">📌 Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Địa điểm</label>
                  <input
                    type="text"
                    placeholder="Phòng học, Sân trường..."
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Mô tả / Dặn dò học sinh</label>
                <textarea
                  rows={2}
                  placeholder="Dặn dò trang phục, đồ dùng mang theo..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="ev-imp"
                  checked={newEventImportant}
                  onChange={(e) => setNewEventImportant(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="ev-imp" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Đánh dấu là sự kiện quan trọng (Ghim nổi bật)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
                >
                  Tạo Sự Kiện
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
    </div>
  );
}
