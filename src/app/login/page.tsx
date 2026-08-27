'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Send,
  CheckCircle,
  HelpCircle,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithOtp } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'MAGIC_LINK'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Nếu đã đăng nhập
  if (user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-900">Bạn đã đăng nhập!</h2>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
          <p className="text-slate-600">
            Họ tên: <strong className="text-slate-900">{profile?.fullName || user.user_metadata?.full_name || 'Giáo viên'}</strong>
          </p>
          <p className="text-slate-600">
            Email: <strong className="text-slate-900">{user.email}</strong>
          </p>
          <p className="text-slate-600">
            Vai trò: <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[11px]">{profile?.role === 'ADMIN' ? 'Quản Trị Viên (Admin)' : 'Giáo Viên Chủ Nhiệm'}</span>
          </p>
          <p className="text-slate-600">
            Phân công: <strong className="text-emerald-700">{profile?.assignedClassName || 'Lớp 4A1'}</strong>
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <span>Vào Bảng Điều Khiển Lớp Học</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signInWithGoogle();
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === 'LOGIN') {
      const { error } = await signInWithEmail(email, password);
      if (!error) router.push('/');
    } else if (mode === 'SIGNUP') {
      const { error } = await signUpWithEmail(email, password, fullName);
      if (!error) setMode('LOGIN');
    } else if (mode === 'MAGIC_LINK') {
      await signInWithOtp(email);
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">GVCN PRO</h1>
        <p className="text-xs text-slate-500">
          Cổng Đăng Nhập Giáo Viên Chủ Nhiệm (Phân quyền bảo mật)
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        {/* Quick Demo Login for Cô Nguyễn Thị Minh Hằng */}
        <button
          type="button"
          onClick={() => {
            localStorage.setItem('gvcn_mock_email', 'hangnm47@gmail.com');
            localStorage.setItem('gvcn_active_class_id', 'class-4a1');
            window.location.href = '/';
          }}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Đăng nhập nhanh: Cô Nguyễn Thị Minh Hằng (GVCN 4A1)</span>
        </button>

        {/* Google OAuth Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Tiếp tục với Google</span>
          </button>
        </div>

        <div className="flex items-center my-3">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-[11px] text-slate-400 font-medium uppercase">Hoặc qua Email</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setMode('LOGIN')}
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => setMode('SIGNUP')}
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'SIGNUP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Ký
          </button>
          <button
            onClick={() => setMode('MAGIC_LINK')}
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'MAGIC_LINK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Magic Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và Tên Giáo Viên
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Cô Nguyễn Thị Mai"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="giaovien@school.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {mode !== 'MAGIC_LINK' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isLoading ? (
              <span>Đang xử lý...</span>
            ) : mode === 'LOGIN' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Ngay</span>
              </>
            ) : mode === 'SIGNUP' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Tạo Tài Khoản Giáo Viên</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Gửi Liên Kết Đăng Nhập OTP</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Role & Security Card */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Cơ Chế Phân Quyền & Bảo Mật Lớp Học:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
          <li>Chỉ các tài khoản Email được phân quyền (Role: Giáo viên / Admin) mới có thể chỉnh sửa dữ liệu lớp.</li>
          <li>Mỗi giáo viên sẽ được cấu hình quản lý và chấm điểm độc lập cho 1 lớp học phụ trách.</li>
          <li>Quản trị viên có thể thêm, sửa, xóa và phân công lớp cho giáo viên tại mục <strong>Cài đặt &gt; Quản lý Giáo viên</strong>.</li>
        </ul>
      </div>
    </div>
  );
}
