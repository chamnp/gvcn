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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, signInWithOtp } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'MAGIC_LINK'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Nếu đã đăng nhập, có thể chuyển về trang chủ
  if (user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-900">Bạn đã đăng nhập!</h2>
        <p className="text-xs text-slate-500">
          Email: <strong className="text-slate-800">{user.email}</strong>
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
          >
            <span>Vào Bảng Điều Khiển Lớp Học</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="max-w-md mx-auto my-8">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">GVCN PRO</h1>
        <p className="text-xs text-slate-500">
          Hệ thống Quản lý Lớp học & Đánh giá Học sinh Tiểu học (TT27)
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ và Tên Giáo Viên</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Cô Nguyễn Thị Mai"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-slate-900 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="giaovien@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-slate-900 font-medium"
              />
            </div>
          </div>

          {mode !== 'MAGIC_LINK' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-slate-900 font-medium"
                />
              </div>
            </div>
          )}

          {mode === 'MAGIC_LINK' && (
            <p className="text-[11px] text-slate-500 bg-blue-50 p-2.5 rounded-xl border border-blue-200 leading-relaxed">
              💡 Bạn chỉ cần nhập email, hệ thống sẽ gửi một liên kết đăng nhập trực tiếp (Magic Link) vào hòm thư mà không cần nhớ mật khẩu.
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Đang xử lý...</span>
            ) : mode === 'LOGIN' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Bằng Email</span>
              </>
            ) : mode === 'SIGNUP' ? (
              <>
                <User className="w-4 h-4" />
                <span>Tạo Tài Khoản Giáo Viên Mới</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Gửi Link Đăng Nhập Đến Email</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Access */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-blue-600 font-semibold"
          >
            ← Tiếp tục trải nghiệm nhanh lớp 4A1 (Demo Mode)
          </Link>
        </div>
      </div>
    </div>
  );
}
