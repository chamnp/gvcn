'use client';

import React from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, profile, isAuthorized, signOut, refreshTeachers } = useAuth();
  const [checking, setChecking] = React.useState(false);

  const handleSendEmailAdmin = () => {
    const email = 'anhnnh4@gmail.com';
    const subject = encodeURIComponent(`[GVCN Pro] Yêu cầu cấp quyền Giáo viên - ${user?.email}`);
    const body = encodeURIComponent(
      `Kính gửi Quản trị viên,\n\nTôi vừa đăng ký tài khoản trên hệ thống GVCN Pro với email: ${user?.email}.\nKính mong Quản trị viên phê duyệt quyền Giáo viên và phân công lớp phụ trách cho tôi.\n\nTrân trọng cảm ơn!`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleRefresh = async () => {
    setChecking(true);
    const updated = await refreshTeachers();
    const email = (user?.email || '').toLowerCase().trim();
    const matched = updated.find((t) => t.email.toLowerCase() === email);

    if (matched && matched.isActive && (matched.role === 'ADMIN' || matched.role === 'TEACHER')) {
      router.push('/');
    } else {
      window.location.reload();
    }
    setChecking(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
          ⏳
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Tài Khoản Đang Chờ Phê Duyệt</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Chưa Được Cấp Quyền Giáo Viên
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Để đảm bảo an toàn thông tin học sinh theo quy định của Bộ Giáo dục & Đào tạo, chỉ những tài khoản được Quản trị viên (Hiệu trưởng / Quản lý trường) phê duyệt mới có thể truy cập hồ sơ lớp học.
          </p>
        </div>

        {/* Account Details Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Tài khoản Google/Email:</span>
            <strong className="text-slate-900 font-mono">{user?.email || 'Chưa đăng nhập'}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Họ và tên:</span>
            <span className="text-slate-800 font-semibold">{user?.user_metadata?.full_name || 'Giáo viên'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Trạng thái quyền:</span>
            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
              Chờ Quản Trị Viên Phân Lớp
            </span>
          </div>
        </div>

        {/* Admin Contact Card */}
        <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200/80 text-left space-y-2.5">
          <div className="flex items-center space-x-2 font-bold text-blue-900 text-xs">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Liên Hệ Quản Trị Viên Trường:</span>
          </div>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Vui lòng liên hệ với Thầy/Cô Quản trị viên để được gán vào lớp phụ trách tương ứng:
          </p>
          <div className="bg-white p-2.5 rounded-xl border border-blue-200 font-mono text-xs font-bold text-blue-900 flex items-center justify-between">
            <span>anhnnh4@gmail.com</span>
            <span className="text-[10px] font-sans font-normal text-slate-500">Admin Trường Chu Văn An</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            onClick={handleSendEmailAdmin}
            className="w-full sm:flex-1 inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Gửi Yêu Cầu Cấp Quyền</span>
          </button>

          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl border border-slate-200 transition-colors"
            title="Tải lại sau khi Admin đã duyệt"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kiểm Tra Lại</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-3 px-4 rounded-xl border border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>

        {/* Demo Mode Link */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center text-xs">
          <span className="text-slate-400">Muốn dùng thử tính năng trước?</span>
          <Link href="/demo" className="ml-1.5 font-bold text-indigo-600 hover:underline">
            Xem Bản Demo Mẫu →
          </Link>
        </div>
      </div>
    </div>
  );
}
