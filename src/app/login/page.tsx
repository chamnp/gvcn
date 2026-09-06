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
  const { user, profile, isAdmin, isAuthorized, signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithOtp } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'MAGIC_LINK'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto redirect immediately if already logged in (skip manual click screen)
  React.useEffect(() => {
    if (user) {
      if (!isAuthorized) {
        router.replace('/unauthorized');
      } else if (isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [user, profile, isAdmin, isAuthorized, router]);

  if (user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Đang chuyển tiếp vào bảng điều khiển...</p>
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
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20 mx-auto border-2 border-slate-100">
          <img src="/app-icon.jpg" alt="GVCN Pro Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">GVCN PRO</h1>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
            BETA
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Nền Tảng Giáo Viên Chủ Nhiệm Tiểu Học Toàn Quốc • Miễn Phí Trải Nghiệm Full Tính Năng
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
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
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] sm:text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className={`py-2 rounded-lg transition-all text-center ${
              mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setMode('SIGNUP')}
            className={`py-2 rounded-lg transition-all text-center ${
              mode === 'SIGNUP' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Ký
          </button>
          <button
            type="button"
            onClick={() => setMode('MAGIC_LINK')}
            className={`py-2 rounded-lg transition-all text-center ${
              mode === 'MAGIC_LINK' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
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
          <span>Quyền Lợi & Bảo Mật Dành Cho Giáo Viên:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
          <li>Mỗi giáo viên tự quản lý các lớp học của mình từ bất kỳ trường tiểu học nào trên toàn quốc.</li>
          <li><strong>Phiên bản BETA:</strong> Miễn phí toàn bộ 100% tính năng (Đánh giá TT27, Kế hoạch bài dạy CV 2345, Sổ sao thi đua, Kho học liệu cộng đồng, Trợ lý AI).</li>
          <li>Dữ liệu học sinh được mã hóa bảo mật, phân lập riêng biệt cho từng lớp của giáo viên.</li>
        </ul>
      </div>

      {/* Compliance & Policy Links for Google OAuth Verification */}
      <div className="pt-2 text-center text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-center space-x-3 text-slate-500 font-semibold">
          <Link href="/privacy" className="hover:text-blue-600 hover:underline transition-colors">
            Chính Sách Quyền Riêng Tư (Privacy Policy)
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-blue-600 hover:underline transition-colors">
            Điều Khoản Dịch Vụ (Terms)
          </Link>
        </div>
        <p className="text-[10px] text-slate-400">
          © 2026 GVCN Pro • Tuân thủ Thông tư 27/2020/TT-BGDĐT & Google API Services User Data Policy
        </p>
      </div>
    </div>
  );
}
