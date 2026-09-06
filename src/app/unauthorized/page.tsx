'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Mail,
  RotateCcw,
  LogOut,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Clock,
  Send,
  Building,
  School,
  Phone,
  User,
  CheckCircle2,
  Edit3,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GradeLevel } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';

export default function UnauthorizedPage() {
  const router = useRouter();
  const {
    user,
    profile,
    isAuthorized,
    isAdmin,
    loading,
    signOut,
    refreshTeachers,
    submitTeacherRegistration,
  } = useAuth();

  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(profile?.fullName || user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [schoolName, setSchoolName] = useState(
    profile?.schoolName && profile.schoolName !== 'Chưa cập nhật trường' && profile.schoolName !== 'Trường Tiểu học'
      ? profile.schoolName
      : ''
  );
  const [province, setProvince] = useState(profile?.province || 'Hà Nội');
  const [district, setDistrict] = useState(profile?.district || '');
  const [grade, setGrade] = useState<GradeLevel>((profile?.mainGrade as GradeLevel) || 1);
  const [className, setClassName] = useState(profile?.assignedClassName || '');

  // Determine whether this teacher has already submitted class info
  const hasRegisteredClass = Boolean(
    profile?.schoolName &&
    profile.schoolName !== 'Chưa cập nhật trường' &&
    profile.schoolName !== 'Trường Tiểu học' &&
    profile?.assignedClassName
  );

  const [isEditing, setIsEditing] = useState(!hasRegisteredClass);

  // Keep form fields synced if profile updates
  useEffect(() => {
    if (profile) {
      if (profile.fullName) setFullName(profile.fullName);
      if (profile.phone) setPhone(profile.phone);
      if (profile.schoolName && profile.schoolName !== 'Chưa cập nhật trường') setSchoolName(profile.schoolName);
      if (profile.province) setProvince(profile.province);
      if (profile.district) setDistrict(profile.district);
      if (profile.mainGrade) setGrade(profile.mainGrade as GradeLevel);
      if (profile.assignedClassName) setClassName(profile.assignedClassName);
    }
  }, [profile]);

  // Auto redirect if already authorized + background polling every 8s
  useEffect(() => {
    if (!loading && isAuthorized) {
      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [loading, isAuthorized, isAdmin, router]);

  useEffect(() => {
    if (loading || isAuthorized) return;
    const interval = setInterval(async () => {
      try {
        const updated = await refreshTeachers();
        const email = (user?.email || '').toLowerCase().trim();
        const matched = updated.find((t) => t.email.toLowerCase() === email);
        if (
          matched &&
          matched.isActive &&
          (matched.role === 'ADMIN' || matched.role === 'ADMIN_TEACHER' || matched.role === 'TEACHER')
        ) {
          toast.success('Tài khoản của bạn đã được Quản trị viên phê duyệt!');
          if (matched.role === 'ADMIN' || matched.role === 'ADMIN_TEACHER') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }
      } catch (e) {}
    }, 8000);
    return () => clearInterval(interval);
  }, [loading, isAuthorized, user, refreshTeachers, router]);

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schoolName.trim()) {
      toast.error('Vui lòng nhập tên trường Tiểu học công tác!');
      return;
    }
    if (!className.trim()) {
      toast.error('Vui lòng nhập tên lớp chủ nhiệm (ví dụ: 4A1, 1A...)!');
      return;
    }
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ tên giáo viên!');
      return;
    }

    setSubmitting(true);
    const res = await submitTeacherRegistration({
      fullName: fullName.trim(),
      phone: phone.trim(),
      schoolName: schoolName.trim(),
      province: province.trim(),
      district: district.trim(),
      mainGrade: grade,
      assignedClassName: className.trim().toUpperCase(),
    });

    setSubmitting(false);
    if (res.success) {
      setIsEditing(false);
    }
  };

  const handleSendEmailAdmin = () => {
    const email = 'anhnnh4@gmail.com';
    const subject = encodeURIComponent(`[GVCN Pro] Yêu cầu cấp quyền Giáo viên - ${user?.email}`);
    const body = encodeURIComponent(
      `Kính gửi Quản trị viên,\n\nTôi vừa đăng ký tài khoản trên hệ thống GVCN Pro với email: ${user?.email}.\n` +
      `Thông tin lớp: Lớp ${className || profile?.assignedClassName || '...'} (Khối ${grade || profile?.mainGrade || 1}), ${schoolName || profile?.schoolName || '...'}.\n` +
      `Họ và tên: ${fullName || profile?.fullName || '...'}\n` +
      `SĐT/Zalo: ${phone || profile?.phone || '...'}\n\n` +
      `Kính mong Quản trị viên xem xét và phê duyệt quyền sử dụng hệ thống cho tôi.\n\nTrân trọng cảm ơn!`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleRefresh = async () => {
    setChecking(true);
    const updated = await refreshTeachers();
    const email = (user?.email || '').toLowerCase().trim();
    const isPrimaryAdmin = email === 'anhnnh4@gmail.com';
    const matched = updated.find((t) => t.email.toLowerCase() === email);

    if (
      isPrimaryAdmin ||
      (matched &&
        matched.isActive &&
        (matched.role === 'ADMIN' || matched.role === 'ADMIN_TEACHER' || matched.role === 'TEACHER'))
    ) {
      toast.success('Tài khoản đã được kích hoạt thành công!');
      if (isPrimaryAdmin || matched?.role === 'ADMIN' || matched?.role === 'ADMIN_TEACHER') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } else {
      toast.info('Tài khoản vẫn đang ở trạng thái chờ duyệt. Vui lòng đợi thêm giây lát.');
    }
    setChecking(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 py-8">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
            <School className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>GVCN PRO • ĐĂNG KÝ & XÉT DUYỆT TÀI KHOẢN</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Khai Báo Lớp Học & Nộp Xét Duyệt' : 'Hồ Sơ Đang Chờ Xét Duyệt'}
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {isEditing
              ? 'Vui lòng khai báo thông tin trường và lớp chủ nhiệm của Thầy/Cô để Ban Quản Trị phê duyệt mở đầy đủ tính năng.'
              : 'Để bảo vệ dữ liệu học sinh, hồ sơ đăng ký lớp của Thầy/Cô cần được Quản trị viên duyệt trước khi kích hoạt.'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: FORM KHAI BÁO THÔNG TIN LỚP HỌC */}
        {/* ========================================================================= */}
        {isEditing ? (
          <form onSubmit={handleSubmitRegistration} className="space-y-4 text-xs">
            {/* Current Account Card & Switch Account */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {(user?.email?.[0] || 'U').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Đang đăng nhập bằng email:</p>
                  <p className="font-bold text-slate-900 truncate text-xs" title={user?.email || ''}>
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="shrink-0 inline-flex items-center space-x-1 text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                title="Đăng xuất để đăng nhập bằng tài khoản khác"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đổi tài khoản</span>
              </button>
            </div>

            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Họ và Tên Giáo Viên (*)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Cô Nguyễn Thị Mai"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Số Điện Thoại / Zalo (*)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* School Name */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Tên Trường Tiểu Học Công Tác (*)</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trường Tiểu học Chu Văn An"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Province & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tỉnh / Thành Phố (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quận / Huyện</label>
                <input
                  type="text"
                  placeholder="Quận Cầu Giấy, Huyện..."
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Grade & Class Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Khối Lớp Phụ Trách (*)</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
                >
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Tên Lớp Chủ Nhiệm (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 4A1, 1A, 5B..."
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 font-black text-blue-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Notice banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start space-x-2 text-amber-900 text-[11px] leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Sau khi gửi thông tin, Quản trị viên sẽ kiểm tra và kích hoạt quyền sử dụng. Thầy/Cô sẽ được cấp quyền
                truy cập miễn phí toàn bộ tính năng (BETA Full Access).
              </span>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:flex-1 inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi hồ sơ...</span>
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Nộp Hồ Sơ & Chờ Phê Duyệt</span>
                  </>
                )}
              </button>

              {hasRegisteredClass && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-100 py-3 px-4 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Quay Lại
                </button>
              )}
            </div>
          </form>
        ) : (
          /* ========================================================================= */
          /* MODE 2: CARD TRẠNG THÁI CHỜ DUYỆT (PENDING REVIEW) */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Status Radar Box */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-2xl p-4 border border-amber-200 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 bg-amber-200/80 text-amber-900 font-bold px-3 py-1 rounded-full text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                  <span>Đang Chờ Quản Trị Viên Phê Duyệt</span>
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-xs inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa thông tin</span>
                </button>
              </div>

              {/* Submitted Details Grid */}
              <div className="bg-white/90 rounded-xl p-3.5 border border-amber-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Giáo viên:</span>
                  <span className="font-bold text-slate-900">
                    {profile?.fullName || user?.user_metadata?.full_name || 'Giáo viên'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tài khoản Email:</span>
                  <span className="font-mono text-slate-700">{user?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Số điện thoại / Zalo:</span>
                    <span className="font-semibold text-slate-900">{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trường công tác:</span>
                  <span className="font-bold text-blue-700 truncate max-w-[240px]" title={profile?.schoolName}>
                    {profile?.schoolName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Lớp đăng ký:</span>
                  <span className="bg-blue-50 text-blue-800 font-black px-2 py-0.5 rounded-md border border-blue-200">
                    Lớp {profile?.assignedClassName} (Khối {profile?.mainGrade})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-amber-800 pt-1">
                <span>🔄 Hệ thống tự động kiểm tra mỗi 8 giây</span>
                <span className="font-medium text-amber-700">Trạng thái: PENDING</span>
              </div>
            </div>

            {/* Admin Contact Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Liên Hệ Kích Hoạt Nhanh:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Ban Quản Trị sẽ duyệt hồ sơ của Thầy/Cô trong thời gian sớm nhất. Để được duyệt ngay tức thì:
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>anhnnh4@gmail.com</span>
                <span className="text-[10px] font-sans font-normal text-slate-500">Super Admin</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={handleSendEmailAdmin}
                className="w-full sm:flex-1 inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Gửi Tin Nhắn Cho Admin</span>
              </button>

              <button
                onClick={handleRefresh}
                disabled={checking}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Tải lại sau khi Admin đã duyệt"
              >
                <RotateCcw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                <span>Kiểm Tra Lại</span>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-3 px-4 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>
        )}

        {/* Demo Mode Link */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center text-xs">
          <span className="text-slate-400">Muốn dùng thử tính năng trước khi duyệt?</span>
          <Link href="/demo" className="ml-1.5 font-bold text-indigo-600 hover:underline">
            Xem Bản Demo Mẫu →
          </Link>
        </div>
      </div>
    </div>
  );
}
