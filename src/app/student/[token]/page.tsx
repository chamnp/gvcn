'use client';

import React, { use, useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useAppStore, getDefaultPinForStudent } from '@/lib/store';
import { TERMS, PRIMARY_SUBJECTS, TRAIT_DEFINITIONS } from '@/lib/tt27-engine';
import { TermType } from '@/types';
import { toast } from 'sonner';

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
    currentTerm: globalTerm,
    updateStudentSecurity,
  } = useAppStore();

  // Find student strictly by shareToken or id
  const student = useMemo(() => {
    return allStudents.find(
      (s) =>
        (s.shareToken && s.shareToken.toLowerCase() === rawToken.toLowerCase()) ||
        s.id.toLowerCase() === rawToken.toLowerCase()
    );
  }, [allStudents, rawToken]);

  // Scoped class
  const studentClass = useMemo(() => {
    if (!student) return null;
    return schoolClasses.find((c) => c.id === student.classId) || schoolClasses[0];
  }, [student, schoolClasses]);

  // Selected Term
  const [selectedTerm, setSelectedTerm] = useState<TermType>(globalTerm || 'GIUA_HK1');

  // PIN Setup / Change Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [parentPhoneInput, setParentPhoneInput] = useState(student?.parentPhone || '');

  // If student not found
  if (!student || !studentClass) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
            🔒
          </div>
          <h2 className="text-xl font-black text-slate-900">Liên Kết Học Sinh Không Hợp Lệ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Đường dẫn xem phiếu báo điểm của con không tồn tại hoặc đã được Giáo viên chủ nhiệm thay đổi mã bảo mật mới. Vui lòng liên hệ Giáo viên để nhận liên kết chính xác.
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

  // Star points
  const studentStars = starLogs
    .filter((s) => s.studentId === student.id)
    .reduce((sum, s) => sum + s.points, 0);

  // Attendance stats
  const studentAtt = attendances.filter((a) => a.studentId === student.id);
  const absentCount = studentAtt.filter((a) => a.status !== 'CO_MAT').length;
  const boardingCount = studentAtt.filter((a) => a.hasBoardingMeal).length;

  const defaultPin = getDefaultPinForStudent(student);

  // Handle Save Custom PIN
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* 1. BRAND HEADER BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {schoolInfo.logoUrl ? (
              <img
                src={schoolInfo.logoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl shrink-0">
                🎒
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {schoolInfo.name}
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                Lớp {studentClass.name} • GVCN: {studentClass.teacherName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Sao chép link"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lưu Link</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In Phiếu</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* FIRST TIME ACTIVATION WELCOME BANNER */}
        {!student.isActivated ? (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="space-y-1">
              <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                🌟 Kích Hoạt Lần Đầu
              </span>
              <h3 className="text-base sm:text-lg font-black">
                Chào mừng Quý Phụ huynh của em {student.fullName}!
              </h3>
              <p className="text-xs text-white/90 leading-relaxed">
                Để bảo mật thông tin học tập của con, bố mẹ vui lòng đổi Mã PIN bí mật riêng và lưu lại liên kết này nhé!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2 bg-white text-orange-800 hover:bg-orange-50 font-black text-xs px-5 py-2.5 rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Key className="w-4 h-4 text-orange-600" />
              <span>Đổi Mã PIN Riêng Ngay</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Hồ sơ đã được kích hoạt bảo mật. Mã PIN riêng đang bảo vệ thông tin của con.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="text-emerald-700 hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
            >
              Đổi lại mã PIN
            </button>
          </div>
        )}

        {/* 3. STUDENT HERO PROFILE CARD */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4 sm:space-x-5">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-blue-500 shadow-md shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md shrink-0">
                  {student.fullName.split(' ').pop()?.substring(0, 1) || 'E'}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-0.5 rounded-full uppercase">
                    Lớp {studentClass.name}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Mã HS: {student.studentCode}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {student.fullName}
                </h1>

                <p className="text-xs text-slate-500">
                  Ngày sinh: <strong className="text-slate-700">{student.dateOfBirth}</strong> • Giới tính: <strong className="text-slate-700">{student.gender}</strong>
                </p>
              </div>
            </div>

            {/* Badges / Honors */}
            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2.5">
              {studentSummary?.awardTitle && (
                <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 text-amber-900 px-4 py-2 rounded-2xl shadow-xs">
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-black text-xs">{studentSummary.awardTitle}</span>
                </div>
              )}

              <div className="inline-flex items-center space-x-1.5 bg-purple-50 border border-purple-200 text-purple-800 px-3.5 py-1.5 rounded-2xl text-xs font-bold">
                <Star className="w-4 h-4 text-purple-600 fill-purple-600" />
                <span>{studentStars} Ngôi Sao Thi Đua</span>
              </div>
            </div>
          </div>

          {/* TERM SELECTOR TABS */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chọn Kỳ Đánh Giá Thông Tư 27:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TERMS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTerm(t.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
        </div>

        {/* 4. TEACHER COMMENTS BLOCK (TT27 PEDAGOGICAL EVALUATION) */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/60 to-purple-50 rounded-3xl border border-blue-200/80 p-6 sm:p-7 space-y-3.5 shadow-xs">
          <div className="flex items-center space-x-2 text-blue-950 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              ✍️
            </div>
            <div>
              <h3 className="font-black text-slate-900">
                Lời Nhận Xét Của Giáo Viên Chủ Nhiệm ({TERMS.find((t) => t.id === selectedTerm)?.name})
              </h3>
              <p className="text-[11px] text-slate-500">
                Giáo viên: {studentClass.teacherName}
              </p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-blue-100 text-slate-800 text-xs sm:text-sm leading-relaxed italic shadow-2xs">
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

        {/* 5. SUBJECT ASSESSMENTS & SCORES */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Kết Quả Đánh Giá Các Môn Học & Hoạt Động Giáo Dục</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              T: Hoàn thành tốt • H: Hoàn thành • C: Chưa hoàn thành
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {studentSubjectAss.length > 0 ? (
              studentSubjectAss.map((ass) => {
                const subjectObj = PRIMARY_SUBJECTS.find((s) => s.code === ass.subjectCode);
                const subjDisplayName = subjectObj?.name || ass.subjectCode;

                return (
                  <div
                    key={ass.subjectCode}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {subjDisplayName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-black ${
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
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100 leading-snug">
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

        {/* 6. TRAITS & COMPETENCIES EVALUATION */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Đánh Giá Năng Lực Cốt Lõi & Phẩm Chất Chủ Yếu</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              T: Tốt • Đ: Đạt • C: Cần cố gắng
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {studentTraitAss.length > 0 ? (
              studentTraitAss.map((trait) => {
                const traitObj = TRAIT_DEFINITIONS.find((t) => t.code === trait.traitCode);
                const traitDisplayName = traitObj?.name || trait.traitCode;

                return (
                  <div
                    key={trait.traitCode}
                    className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50/50"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{traitDisplayName}</h4>
                      <p className="text-[10px] text-slate-400">
                        {trait.category === 'PHAM_CHAT' ? 'Phẩm chất chủ yếu' : 'Năng lực cốt lõi'}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-black ${
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

        {/* 7. ATTENDANCE & BOARDING SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Chuyên Cần</span>
            <p className="text-xl font-black text-slate-900">
              {studentAtt.length - absentCount} / {studentAtt.length || 0} Buổi
            </p>
            <p className="text-[11px] text-slate-500">Nghỉ có phép / không phép: {absentCount}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Bán Trú</span>
            <p className="text-xl font-black text-slate-900">
              {student.isBoarding ? `${boardingCount} Suất Ăn` : 'Không Bán Trú'}
            </p>
            <p className="text-[11px] text-slate-500">{student.isBoarding ? 'Đăng ký ăn trưa tại trường' : 'Ăn trưa tại nhà'}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Vị Trí Chỗ Ngồi</span>
            <p className="text-xl font-black text-slate-900">
              Hàng {student.seatRow + 1} - Bàn {student.seatCol + 1}
            </p>
            <p className="text-[11px] text-slate-500">Sơ đồ lớp 4A1</p>
          </div>
        </div>
      </main>

      {/* 8. PIN CHANGE / SETUP MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Thiết Lập Mã PIN Bí Mật</h3>
                  <p className="text-xs text-slate-500">{student.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
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
                  className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 font-mono text-center font-bold tracking-widest text-base focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 font-mono text-center font-bold tracking-widest text-base focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại Phụ Huynh (Để khôi phục nếu quên)</label>
                <input
                  type="tel"
                  placeholder="0912 345 678"
                  value={parentPhoneInput}
                  onChange={(e) => setParentPhoneInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                >
                  Lưu Mã PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
