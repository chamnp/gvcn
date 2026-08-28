'use client';

import React, { use, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Star,
  Calendar,
  CheckCircle2,
  BookOpen,
  Heart,
  Sparkles,
  Lock,
  Phone,
  School,
  ChevronRight,
  Printer,
  Copy,
  Share2,
  ShieldCheck,
  Key,
  RefreshCw,
  X,
  Smile,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Cake,
  PartyPopper,
  CheckSquare,
  Square,
  Check,
  Sun,
  Backpack,
  FileText,
  Eye,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  Gift,
  Minus,
  Plus,
  Trash2,
  Crown,
} from 'lucide-react';
import { useAppStore, getDefaultPinForStudent } from '@/lib/store';
import { TERMS, PRIMARY_SUBJECTS, TRAIT_DEFINITIONS, getLocalDateString } from '@/lib/tt27-engine';
import { getSubjectTheme, DAYS_OF_WEEK, PERIODS } from '@/lib/timetable-data';
import { TermType, DayOfWeek, ClassEvent, RewardProduct, RedemptionItem } from '@/types';
import { LeaveRequestModal } from '@/components/parent/leave-request-modal';
import { ConferenceSchedulerModal } from '@/components/conference/conference-scheduler-modal';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// Helper to check birthday for this specific student
function getStudentBirthdayStatus(dobStr: string) {
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

export default function StudentPrivateReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const rawToken = (resolvedParams.token || '').trim();

  const {
    allStudents,
    schoolClasses,
    schoolInfo,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    attendances,
    starLogs,
    starCriteria,
    rewardProducts,
    rewardRedemptions,
    createRewardRedemption,
    getStudentMonthlyStars,
    allHomeworks,
    customSubjects,
    timetable,
    allClassEvents,
    currentTerm: globalTerm,
    updateStudentSecurity,
    leaveRequests,
    conferenceSlots,
  } = useAppStore();

  // Find student strictly by shareToken, id, or studentCode (Mã định danh)
  const student = useMemo(() => {
    return allStudents.find(
      (s) =>
        (s.shareToken && s.shareToken.toLowerCase() === rawToken.toLowerCase()) ||
        s.id.toLowerCase() === rawToken.toLowerCase() ||
        (s.studentCode && s.studentCode.toLowerCase() === rawToken.toLowerCase())
    );
  }, [allStudents, rawToken]);

  // Scoped class
  const studentClass = useMemo(() => {
    if (!student) return null;
    return schoolClasses.find((c) => c.id === student.classId) || schoolClasses[0];
  }, [student, schoolClasses]);

  // Main Active Tab for Child Hub
  const [activeTab, setActiveTab] = useState<'REPORT' | 'REWARDS' | 'HOMEWORK' | 'BACKPACK' | 'TIMETABLE' | 'EVENTS'>('REPORT');

  // Selected Term for Assessment Report
  const [selectedTerm, setSelectedTerm] = useState<TermType>(globalTerm || 'GIUA_HK1');

  // PIN Setup / Change Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isConferenceModalOpen, setIsConferenceModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [parentPhoneInput, setParentPhoneInput] = useState(student?.parentPhone || '');

  // Local Checklist State for Homework & Backpack (Saved per student)
  const [completedHwIds, setCompletedHwIds] = useState<string[]>([]);
  const [packedSubjectCodes, setPackedSubjectCodes] = useState<string[]>([]);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<DayOfWeek>('T2');

  // Cart State for Reward Shop
  const [cartItems, setCartItems] = useState<{ product: RewardProduct; quantity: number }[]>([]);
  const [studentNoteInput, setStudentNoteInput] = useState('');
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [shopCategoryFilter, setShopCategoryFilter] = useState('ALL');

  const todayStr = getLocalDateString();
  const currentMonthKey = todayStr.substring(0, 7); // 'YYYY-MM'

  useEffect(() => {
    if (!student) return;
    try {
      const savedHw = localStorage.getItem(`gvcn_hw_done_student_${student.id}`);
      if (savedHw) setCompletedHwIds(JSON.parse(savedHw));

      const savedPack = localStorage.getItem(`gvcn_pack_student_${student.id}_${todayStr}`);
      if (savedPack) setPackedSubjectCodes(JSON.parse(savedPack));
    } catch (e) {}
  }, [student, todayStr]);

  // Determine tomorrow's day of week
  const todayDayIndex = new Date().getDay();
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

  // Student monthly stars balance & class rank
  const studentMonthlyStars = useMemo(() => {
    if (!student) return { earned: 0, spent: 0, available: 0 };
    return getStudentMonthlyStars(student.id, currentMonthKey);
  }, [student, currentMonthKey, getStudentMonthlyStars, starLogs, rewardRedemptions]);

  const studentRankInClass = useMemo(() => {
    if (!student || !studentClass) return 1;
    const classStudents = allStudents.filter((s) => s.classId === studentClass.id);
    const ranked = classStudents
      .map((st) => ({
        id: st.id,
        earned: getStudentMonthlyStars(st.id, currentMonthKey).earned,
      }))
      .sort((a, b) => b.earned - a.earned);

    const idx = ranked.findIndex((r) => r.id === student.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [student, studentClass, allStudents, currentMonthKey, getStudentMonthlyStars, starLogs]);

  // Total cart stars
  const totalCartStars = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.starPrice * item.quantity, 0);
  }, [cartItems]);

  // Cart actions
  const addToCart = (product: RewardProduct) => {
    if (product.stock <= 0) {
      toast.error('Món quà này tạm thời đã hết hàng trong kho!');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Kho chỉ còn ${product.stock} món quà này!`);
          return prev;
        }
        toast.success(`Đã tăng số lượng ${product.name} trong giỏ!`);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      toast.success(`Đã thêm ${product.name} vào giỏ quà!`);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing) return prev;

      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }

      if (newQty > existing.product.stock) {
        toast.error(`Kho chỉ còn tối đa ${existing.product.stock} món!`);
        return prev;
      }

      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      );
    });
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || cartItems.length === 0) return;

    if (studentMonthlyStars.available < totalCartStars) {
      toast.error(`Con chỉ có ${studentMonthlyStars.available} sao khả dụng, còn thiếu ${totalCartStars - studentMonthlyStars.available} sao nữa!`);
      return;
    }

    const items: RedemptionItem[] = cartItems.map((c) => ({
      productId: c.product.id,
      productName: c.product.name,
      quantity: c.quantity,
      unitStarPrice: c.product.starPrice,
      imageUrl: c.product.imageUrl,
    }));

    const result = createRewardRedemption({
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentCode,
      studentAvatar: student.avatarUrl,
      items,
      totalStars: totalCartStars,
      studentNote: studentNoteInput,
      month: currentMonthKey,
    });

    if (result.success) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      toast.success('🎉 Chúc mừng con đã gửi yêu cầu đổi quà thành công! Cô giáo sẽ trao quà cho con sớm nhất nhé!');
      setCartItems([]);
      setStudentNoteInput('');
    } else {
      toast.error(result.error || 'Có lỗi xảy ra khi đổi quà!');
    }
  };

  // If student not found
  if (!student || !studentClass) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
            🔒
          </div>
          <h2 className="text-xl font-black text-slate-900">Liên Kết Học Sinh Không Hợp Lệ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Đường dẫn xem góc học tập của con không tồn tại hoặc đã được Giáo viên chủ nhiệm thay đổi mã bảo mật mới. Vui lòng liên hệ Giáo viên để nhận liên kết chính xác.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
            <Link
              href="/lookup"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Vào Cổng Tra Cứu Bằng Mã PIN →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Student specific assessments for selected term
  const studentSubjectAss = subjectAssessments.filter(
    (a) => a.studentId === student.id && a.term === selectedTerm
  );
  const studentTraitAss = traitAssessments.filter(
    (a) => a.studentId === student.id && a.term === selectedTerm
  );
  const studentSummary = termSummaries.find(
    (s) => s.studentId === student.id && s.term === selectedTerm
  );

  // Total all time stars
  const studentStars = starLogs
    .filter((s) => s.studentId === student.id)
    .reduce((sum, s) => sum + s.points, 0);

  // Student Redemptions
  const studentRedemptions = rewardRedemptions.filter((r) => r.studentId === student.id);

  // Attendance stats
  const studentAtt = attendances.filter((a) => a.studentId === student.id);
  const absentCount = studentAtt.filter((a) => a.status !== 'CO_MAT').length;
  const boardingCount = studentAtt.filter((a) => a.hasBoardingMeal).length;

  // Birthday info of this student
  const birthdayInfo = getStudentBirthdayStatus(student.dateOfBirth);

  // Class Homeworks
  const classHomeworks = allHomeworks.filter(
    (h) => h.classId === studentClass.id
  );

  // Class Events
  const classEvents = allClassEvents.filter(
    (e) => e.classId === studentClass.id
  );

  // Tomorrow slots from timetable
  const tomorrowSlots = timetable.filter(
    (s) => s.day === tomorrowDayCode && s.classId === studentClass.id
  );

  const toggleCompleteHw = (hwId: string) => {
    setCompletedHwIds((prev) => {
      const isDone = prev.includes(hwId);
      const updated = isDone ? prev.filter((id) => id !== hwId) : [...prev, hwId];
      try {
        localStorage.setItem(`gvcn_hw_done_student_${student.id}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const togglePackSubject = (subjectCode: string) => {
    setPackedSubjectCodes((prev) => {
      const isPacked = prev.includes(subjectCode);
      const updated = isPacked ? prev.filter((c) => c !== subjectCode) : [...prev, subjectCode];
      try {
        localStorage.setItem(`gvcn_pack_student_${student.id}_${todayStr}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 6) {
      toast.error('Mã PIN phải từ 4 đến 6 chữ số!');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('Mã PIN xác nhận không khớp!');
      return;
    }

    updateStudentSecurity(student.id, {
      customPin: newPin,
      isActivated: true,
      parentPhone: parentPhoneInput.trim() || undefined,
    });

    toast.success('Đã lưu Mã PIN bảo mật thành công! Từ lần sau bố mẹ dùng mã này để tra cứu.');
    setIsPinModalOpen(false);
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép liên kết riêng tư của con vào bộ nhớ tạm!');
  };

  // Filtered shop products
  const filteredShopProducts = rewardProducts.filter((p) => {
    if (shopCategoryFilter === 'ALL') return true;
    return p.category === shopCategoryFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* 1. BRAND HEADER BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            {schoolInfo.logoUrl ? (
              <img
                src={schoolInfo.logoUrl}
                alt="Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-base sm:text-xl shrink-0 font-bold">
                🎒
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {schoolInfo.name}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Lớp {studentClass.name} • GVCN: {studentClass.teacherName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="h-8 px-2.5 inline-flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Sao chép link"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Lưu Link</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="h-8 px-2.5 inline-flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">In Phiếu</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-3.5 sm:pt-6 space-y-4 sm:space-y-5">
        {/* FIRST TIME ACTIVATION WELCOME BANNER */}
        {!student.isActivated ? (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-4 sm:p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="space-y-1 min-w-0">
              <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                🌟 Kích Hoạt Lần Đầu
              </span>
              <h3 className="text-sm sm:text-base font-black truncate">
                Chào mừng Quý Phụ huynh của em {student.fullName}!
              </h3>
              <p className="text-xs text-white/90 leading-relaxed">
                Để bảo mật thông tin học tập của con, bố mẹ vui lòng đổi Mã PIN bí mật riêng và lưu lại liên kết này nhé!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="w-full sm:w-auto h-10 px-4 inline-flex items-center justify-center space-x-1.5 bg-white text-orange-800 hover:bg-orange-50 font-black text-xs rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Key className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Đổi Mã PIN Riêng Ngay</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
            <div className="flex items-center space-x-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">
                Hồ sơ học tập của <strong>{student.fullName}</strong> được bảo vệ bằng mã PIN riêng.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="text-emerald-700 hover:underline font-bold text-[11px] shrink-0 text-left sm:text-right cursor-pointer"
            >
              Đổi lại mã PIN →
            </button>
          </div>
        )}

        {/* 2.5. PARENT QUICK ACTIONS BAR */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-xs shrink-0">
              👩‍🏫
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                Tương Tác Với GVCN — {studentClass.teacherName}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                Gửi đơn xin nghỉ phép, dặn dò uống thuốc hoặc đặt lịch hẹn gặp cô 1-1
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              className="w-full inline-flex items-center justify-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
            >
              <span>📋 Xin Nghỉ Phép & Dặn Thuốc</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConferenceModalOpen(true)}
              className="w-full inline-flex items-center justify-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-purple-200 transition-colors cursor-pointer"
            >
              <span>📅 Đặt Lịch Gặp Cô</span>
            </button>
          </div>
        </div>

        {/* 3. BIRTHDAY SPECIAL GREETING CARD */}
        {birthdayInfo && (birthdayInfo.isToday || birthdayInfo.isThisMonth) && (
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-4 sm:p-5 text-white shadow-lg flex items-center space-x-3.5 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
              🎂
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-100">
                <PartyPopper className="w-3.5 h-3.5 shrink-0" />
                <span>{birthdayInfo.isToday ? '🎉 Sinh Nhật Hôm Nay!' : '🎁 Tháng Sinh Nhật Của Con'}</span>
              </div>
              <h3 className="font-black text-sm sm:text-base truncate">
                Chúc Mừng Sinh Nhật Em {student.fullName}!
              </h3>
              <p className="text-xs text-rose-100 leading-snug break-words">
                {birthdayInfo.isToday
                  ? `Chúc em bước sang tuổi ${birthdayInfo.turningAge} luôn mạnh khỏe, chăm ngoan, học giỏi và ngập tràn niềm vui!`
                  : `Ngày sinh: ${birthdayInfo.formattedDate} (còn ${birthdayInfo.daysRemaining} ngày nữa là đến sinh nhật tròn ${birthdayInfo.turningAge} tuổi của con).`}
              </p>
            </div>
          </div>
        )}

        {/* 4. STUDENT HERO PROFILE CARD */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 min-w-0 flex-1">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.fullName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl object-cover border-2 sm:border-4 border-blue-500 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-md shrink-0">
                  {student.fullName.split(' ').pop()?.substring(0, 1) || 'E'}
                </div>
              )}

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                    Lớp {studentClass.name}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full">
                    Mã: {student.studentCode}
                  </span>
                </div>

                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight break-words">
                  {student.fullName}
                </h1>

                <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                  Sinh: <strong className="text-slate-700">{student.dateOfBirth}</strong> • Giới tính: <strong className="text-slate-700">{student.gender}</strong>
                </p>
              </div>
            </div>

            {/* Badges / Honors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-col items-stretch md:items-end gap-2 w-full md:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="h-9 px-3.5 inline-flex items-center justify-center space-x-1.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl shadow-2xs text-xs font-black">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Hạng #{studentRankInClass} Thi Đua Tháng</span>
              </div>

              <div className="h-9 px-3.5 inline-flex items-center justify-center space-x-1.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-bold shadow-2xs">
                <Star className="w-4 h-4 text-purple-600 fill-purple-600 shrink-0" />
                <span>{studentMonthlyStars.available} ⭐ Khả Dụng Đổi Quà</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. MAIN NAVIGATION TABS FOR THIS CHILD */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold scroll-smooth -mx-1 sm:mx-0 px-2 sm:px-1">
          {[
            { id: 'REPORT', label: '📊 Điểm & Nhận Xét TT27' },
            { id: 'REWARDS', label: `🎁 Shop Đổi Quà (${studentMonthlyStars.available} ⭐)` },
            { id: 'HOMEWORK', label: `📝 Bài Tập (${classHomeworks.length})` },
            { id: 'BACKPACK', label: '🎒 Soạn Sách Vở' },
            { id: 'TIMETABLE', label: '🗓️ Thời Khóa Biểu' },
            { id: 'EVENTS', label: `📅 Sự Kiện (${classEvents.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-9 px-3.5 flex items-center justify-center rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 6. TAB 1: ACADEMIC & TT27 EVALUATION */}
        {activeTab === 'REPORT' && (
          <div className="space-y-4">
            {/* Term Selector */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px] sm:text-xs">
                Kỳ Đánh Giá Thông Tư 27:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {TERMS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTerm(t.id)}
                    className={`h-9 px-2.5 flex items-center justify-center rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      selectedTerm === t.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Teacher Comments */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50/60 to-purple-50 rounded-3xl border border-blue-200/80 p-4 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center space-x-2.5 text-blue-950 font-bold text-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  ✍️
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                    Lời Nhận Xét Của Giáo Viên Chủ Nhiệm ({TERMS.find((t) => t.id === selectedTerm)?.name})
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    Giáo viên: {studentClass.teacherName}
                  </p>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-blue-100 text-slate-800 text-xs sm:text-sm leading-relaxed italic shadow-2xs break-words">
                {studentSummary?.teacherComment ? (
                  <p className="whitespace-pre-line font-medium text-slate-800">
                    &ldquo;{studentSummary.teacherComment}&rdquo;
                  </p>
                ) : (
                  <p className="text-slate-400 not-italic">
                    Chưa có nhận xét riêng cho kỳ học này. Giáo viên sẽ cập nhật khi hoàn thành đánh giá định kỳ.
                  </p>
                )}
              </div>
            </div>

            {/* Subject Assessments */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">Kết Quả Đánh Giá Môn Học</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  T: Hoàn thành tốt • H: Hoàn thành • C: Chưa hoàn thành
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {studentSubjectAss.length > 0 ? (
                  studentSubjectAss.map((ass) => {
                    const subjectObj = PRIMARY_SUBJECTS.find((s) => s.code === ass.subjectCode);
                    const subjDisplayName = subjectObj?.name || ass.subjectCode;

                    return (
                      <div
                        key={ass.subjectCode}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 break-words flex-1">
                            {subjDisplayName}
                          </span>
                          <span
                            className={`h-6 min-w-[56px] px-2 flex items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                              ass.level === 'T'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ass.level === 'H'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Mức {ass.level}
                          </span>
                        </div>

                        {ass.score !== undefined && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                            <span className="text-slate-500">Điểm kiểm tra:</span>
                            <span className="font-black text-sm text-blue-700 font-mono">
                              {ass.score} đ
                            </span>
                          </div>
                        )}

                        {ass.comment && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100 leading-snug break-words">
                            {ass.comment}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 col-span-full py-4 text-center">
                    Dữ liệu môn học kỳ này đang được cô giáo hoàn thiện.
                  </p>
                )}
              </div>
            </div>

            {/* Traits & Competencies */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">Năng Lực & Phẩm Chất</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  T: Tốt • Đ: Đạt • C: Cần cố gắng
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {studentTraitAss.length > 0 ? (
                  studentTraitAss.map((trait) => {
                    const traitObj = TRAIT_DEFINITIONS.find((t) => t.code === trait.traitCode);
                    const traitDisplayName = traitObj?.name || trait.traitCode;

                    return (
                      <div
                        key={trait.traitCode}
                        className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 bg-slate-50/50"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-800 break-words">{traitDisplayName}</h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {trait.category === 'PHAM_CHAT' ? 'Phẩm chất chủ yếu' : 'Năng lực cốt lõi'}
                          </p>
                        </div>
                        <span
                          className={`h-6 min-w-[56px] px-2 flex items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                            trait.level === 'T'
                              ? 'bg-emerald-100 text-emerald-800'
                              : trait.level === 'Đ'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Mức {trait.level}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 col-span-full py-4 text-center">
                    Dữ liệu phẩm chất & năng lực kỳ này đang được cập nhật.
                  </p>
                )}
              </div>
            </div>

            {/* Attendance & Boarding Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Chuyên Cần</span>
                <p className="text-lg sm:text-xl font-black text-slate-900">
                  {studentAtt.length - absentCount} / {studentAtt.length || 0} Buổi
                </p>
                <p className="text-[11px] text-slate-500">Nghỉ có phép / không phép: {absentCount}</p>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Bán Trú</span>
                <p className="text-lg sm:text-xl font-black text-slate-900">
                  {student.isBoarding ? `${boardingCount} Suất Ăn` : 'Không Bán Trú'}
                </p>
                <p className="text-[11px] text-slate-500">{student.isBoarding ? 'Ăn trưa tại trường' : 'Ăn trưa tại nhà'}</p>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Vị Trí Chỗ Ngồi</span>
                <p className="text-lg sm:text-xl font-black text-slate-900">
                  {student.seatRow !== undefined && student.seatRow >= 0 && student.seatCol !== undefined && student.seatCol >= 0
                    ? `Hàng ${student.seatRow + 1} - Bàn ${student.seatCol + 1}`
                    : 'Chưa xếp chỗ'}
                </p>
                <p className="text-[11px] text-slate-500">Sơ đồ lớp {studentClass.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* 7. TAB: SHOP ĐỔI QUÀ & GIỎ HÀNG THÔNG MINH */}
        {activeTab === 'REWARDS' && (
          <div className="space-y-5">
            {/* Balance Hero Card */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    🌟 Phong Trào Tích Sao Tháng {currentMonthKey.replace('-', '/')}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black truncate">
                    Góc Đổi Quà Của Em {student.fullName}
                  </h3>
                  <p className="text-xs text-white/80">
                    Dùng số sao thi đua kiếm được trong tháng để lựa chọn những món đồ dùng học tập xinh xắn!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(true)}
                  className="h-9 px-3.5 inline-flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-2xl backdrop-blur-md transition-all cursor-pointer shrink-0"
                >
                  <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  <span>Xem Tiêu Chí Kiếm Sao</span>
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-white/70 uppercase font-bold">Sao Tháng Này</span>
                  <p className="text-xl font-black text-yellow-300">+{studentMonthlyStars.earned} ⭐</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-white/70 uppercase font-bold">Đã Đổi Quà</span>
                  <p className="text-xl font-black text-rose-200">-{studentMonthlyStars.spent} ⭐</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-yellow-300/40">
                  <span className="text-[10px] text-yellow-200 uppercase font-black">Khả Dụng Đổi Quà</span>
                  <p className="text-2xl font-black text-yellow-300">{studentMonthlyStars.available} ⭐</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-white/70 uppercase font-bold">Hạng Thi Đua</span>
                  <p className="text-xl font-black text-white flex items-center gap-1">
                    <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>#{studentRankInClass}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* SHOPPING CATALOG & CART WRAPPER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Product Catalog (2 Cols on lg) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Category Filter */}
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
                  {['ALL', 'Bút viết', 'Vở & Sổ', 'Hộp bút & Thước', 'Dụng cụ học tập', 'Phụ kiện dễ thương'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setShopCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        shopCategoryFilter === cat
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? '✨ Tất Cả Quà' : cat}
                    </button>
                  ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredShopProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-32 bg-slate-100 overflow-hidden">
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                          <div
                            className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                              prod.stock > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}
                          >
                            {prod.stock > 0 ? `Còn ${prod.stock}` : 'Hết hàng'}
                          </div>
                        </div>

                        <div className="p-3.5 space-y-1">
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2" title={prod.name}>
                            {prod.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {prod.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                        <span className="text-amber-600 font-black text-sm">{prod.starPrice} ⭐</span>

                        <button
                          type="button"
                          disabled={prod.stock <= 0}
                          onClick={() => addToCart(prod)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            prod.stock > 0
                              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{prod.stock > 0 ? 'Đổi Quà' : 'Hết Hàng'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CART SIDEBAR / CHECKOUT SECTION */}
              <div id="cart-section" className="space-y-4">
                <div className="bg-white rounded-3xl border-2 border-purple-200 p-4 sm:p-5 shadow-md space-y-4 sticky top-20">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5 text-purple-600" />
                      <h3 className="font-black text-sm text-slate-900">Giỏ Quà Của Con</h3>
                    </div>
                    <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)} Món
                    </span>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1.5">
                      <Gift className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">Giỏ quà đang trống</p>
                      <p className="text-[11px] text-slate-400">Hãy chọn các món quà xinh xắn bên cạnh để thêm vào giỏ nhé!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleCheckout} className="space-y-3.5 text-xs">
                      {/* Items in cart */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {cartItems.map((item) => (
                          <div
                            key={item.product.id}
                            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-xs text-slate-900 truncate" title={item.product.name}>
                                {item.product.name}
                              </h5>
                              <p className="text-[10px] text-amber-600 font-bold">
                                {item.product.starPrice * item.quantity} ⭐ ({item.product.starPrice}⭐/cái)
                              </p>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.product.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center font-black text-xs text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.product.id, 1)}
                                className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Note to teacher */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Lời nhắn gửi cô giáo (Tùy chọn):</label>
                        <input
                          type="text"
                          placeholder="VD: Em xin cô màu xanh dương ạ..."
                          value={studentNoteInput}
                          onChange={(e) => setStudentNoteInput(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 bg-slate-50"
                        />
                      </div>

                      {/* Stars summary */}
                      <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200 space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Sao khả dụng của con:</span>
                          <span className="font-bold text-slate-900">{studentMonthlyStars.available} ⭐</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Tổng sao giỏ quà:</span>
                          <span className="font-black text-purple-700 text-sm">-{totalCartStars} ⭐</span>
                        </div>

                        {studentMonthlyStars.available < totalCartStars ? (
                          <p className="text-[11px] text-rose-600 font-bold pt-1 border-t border-purple-200">
                            ⚠️ Con đang thiếu {totalCartStars - studentMonthlyStars.available} sao để đổi đơn quà này!
                          </p>
                        ) : (
                          <p className="text-[11px] text-emerald-700 font-bold pt-1 border-t border-purple-200">
                            ✅ Số sao của con đủ để đổi toàn bộ giỏ quà này!
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={studentMonthlyStars.available < totalCartStars || totalCartStars === 0}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Gift className="w-4 h-4" />
                        <span>Xác Nhận Đổi Quà Ngay</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION: LỊCH SỬ ĐỔI QUÀ CỦA EM */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Lịch Sử Đổi Quà Của Con ({studentRedemptions.length} Đơn)</span>
              </h3>

              {studentRedemptions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Con chưa có đơn đổi quà nào. Hãy tích sao chăm chỉ để đổi những món quà đầu tiên nhé!</p>
              ) : (
                <div className="space-y-2.5">
                  {studentRedemptions.map((rd) => (
                    <div
                      key={rd.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        rd.status === 'PENDING' ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              rd.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {rd.status === 'PENDING' ? '⏳ Đang chờ cô trao quà' : '🎉 Đã nhận quà'}
                          </span>
                          <span className="text-xs text-slate-400">
                            Ngày {new Date(rd.requestedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rd.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                            >
                              {it.productName} (x{it.quantity})
                            </span>
                          ))}
                        </div>
                      </div>

                      <span className="font-black text-amber-600 text-sm shrink-0">-{rd.totalStars} ⭐</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. TAB: HOMEWORK */}
        {activeTab === 'HOMEWORK' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 truncate">
                Bài tập của {student.fullName}:
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] shrink-0">
                {classHomeworks.filter((h) => completedHwIds.includes(h.id)).length} / {classHomeworks.length} bài xong
              </span>
            </div>

            {classHomeworks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
                <p className="text-3xl">✨</p>
                <h3 className="font-bold text-sm text-slate-800">Hôm nay không có bài tập về nhà!</h3>
                <p className="text-xs text-slate-500">Chúc con có một buổi tối nghỉ ngơi vui vẻ bên gia đình.</p>
              </div>
            ) : (
              classHomeworks.map((hw) => {
                const theme = getSubjectTheme(hw.subjectCode, customSubjects);
                const isDone = completedHwIds.includes(hw.id);

                return (
                  <div
                    key={hw.id}
                    className={`bg-white rounded-3xl border transition-all p-4 space-y-3 shadow-xs ${
                      isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                        <span className="text-2xl shrink-0 mt-0.5">{theme.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${theme.bgColor} ${theme.textColor}`}>
                            {hw.subjectName}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-0.5 break-words">{hw.title}</h4>
                        </div>
                      </div>

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

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line break-words">
                      {hw.description}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 9. TAB: BACKPACK PACKING */}
        {activeTab === 'BACKPACK' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-xs sm:text-base text-slate-900 flex items-center gap-2">
                <Backpack className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
                <span>Soạn Sách Vở Ngày Mai ({tomorrowDayInfo?.name})</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Giúp {student.fullName} chuẩn bị đúng và đủ đồ dùng học tập trước khi đến lớp.</p>
            </div>

            <div className="space-y-2">
              {tomorrowSlots.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Ngày mai không có tiết học trên thời khóa biểu.</p>
              ) : (
                tomorrowSlots.map((slot) => {
                  const theme = getSubjectTheme(slot.subjectCode, customSubjects);
                  const isPacked = packedSubjectCodes.includes(slot.subjectCode);

                  return (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isPacked ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
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
        )}

        {/* 10. TAB: TIMETABLE */}
        {activeTab === 'TIMETABLE' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-xs sm:text-base text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                  <span>Thời Khóa Biểu Lớp {studentClass.name}</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Chương trình học chuẩn 2 buổi/ngày kèm ăn bán trú.</p>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 sm:py-0 sm:grid sm:grid-cols-5">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedTimetableDay(d.id)}
                    className={`h-8 px-2.5 sm:px-2 flex items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedTimetableDay === d.id
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {PERIODS.map((p) => {
                const slot = timetable.find(
                  (s) => s.day === selectedTimetableDay && s.period === p.period && s.classId === studentClass.id
                );
                const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;

                return (
                  <div
                    key={p.period}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-colors gap-2 ${
                      theme ? `${theme.bgColor} ${theme.borderColor}` : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <span className="h-6 w-12 rounded-lg bg-slate-100 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        {p.name}
                      </span>
                      <span className="text-lg shrink-0">{theme?.icon || '📚'}</span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {slot?.subjectName || 'Tự học / Nghỉ'}
                        </h4>
                        {slot?.note && (
                          <p className="text-[10px] sm:text-[11px] text-slate-600 truncate">{slot.note}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono text-slate-500 font-semibold shrink-0">{p.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 11. TAB: CLASS EVENTS */}
        {activeTab === 'EVENTS' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-xs sm:text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
                <span>Lịch Sự Kiện Của Lớp {studentClass.name}</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Các hoạt động giáo dục, dã ngoại và kiểm tra định kỳ.</p>
            </div>

            <div className="space-y-2.5">
              {classEvents.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có sự kiện nào được lên lịch trong thời gian tới.</p>
              ) : (
                classEvents.map((evt) => (
                  <div key={evt.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 break-words flex-1">{evt.title}</span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold shrink-0">
                        {evt.date}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-xs text-slate-600 leading-relaxed break-words">{evt.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* FLOATING STICKY BOTTOM CART BAR FOR MOBILE */}
      {activeTab === 'REWARDS' && cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-3 right-3 z-40 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-2 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black truncate">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} Món Quà Trong Giỏ
              </p>
              <p className="text-[11px] text-amber-400 font-bold">
                Tổng: -{totalCartStars} ⭐
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="h-9 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Xem Giỏ Hàng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 12. CRITERIA MODAL FOR STUDENTS */}
      {isCriteriaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="font-black text-base text-slate-900">Bảng Tiêu Chí Kiếm Sao Của Lớp</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCriteriaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Các việc tốt và nề nếp gương mẫu con thực hiện mỗi ngày để được cô giáo cộng sao thi đua:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {starCriteria.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                  <span className="text-xl shrink-0">{c.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{c.title}</p>
                    <span className="text-amber-600 font-black text-[11px]">
                      {c.points > 0 ? `+${c.points} ⭐` : `${c.points} ⭐`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCriteriaModalOpen(false)}
                className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. PIN CHANGE / SETUP MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Thiết Lập Mã PIN Bí Mật</h3>
                  <p className="text-[11px] text-slate-500 truncate">{student.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="p-5 sm:p-6 space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Đặt mã PIN riêng (4-6 chữ số) để bảo vệ quyền riêng tư của con khi tra cứu trên hệ thống:
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã PIN Mới (4-6 số) *</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="VD: 2026"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 sm:p-3 rounded-xl border border-slate-200 text-slate-900 font-mono text-center font-bold tracking-widest text-base focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Xác Nhận Mã PIN *</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="Nhập lại mã PIN..."
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 sm:p-3 rounded-xl border border-slate-200 text-slate-900 font-mono text-center font-bold tracking-widest text-base focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại Phụ Huynh (Để khôi phục)</label>
                <input
                  type="tel"
                  placeholder="0912 345 678"
                  value={parentPhoneInput}
                  onChange={(e) => setParentPhoneInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="h-9 px-3.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                >
                  Lưu Mã PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Request & Health Modal */}
      <LeaveRequestModal
        student={student}
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />

      {/* Conference Scheduler Modal */}
      <ConferenceSchedulerModal
        isOpen={isConferenceModalOpen}
        onClose={() => setIsConferenceModalOpen(false)}
        isTeacher={false}
        currentStudent={student}
      />
    </div>
  );
}
