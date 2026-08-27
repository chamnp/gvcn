'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Lock, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HomeworkPortalIndex() {
  const router = useRouter();
  const { schoolInfo, schoolClasses } = useAppStore();
  const [accessCode, setAccessCode] = useState('');

  const handleAccessClass = (e: React.FormEvent) => {
    e.preventDefault();
    const code = accessCode.trim();
    if (!code) {
      toast.error('Vui lòng nhập mã bảo mật hoặc liên kết lớp học!');
      return;
    }

    // Check if input is a full URL
    let cleanCode = code;
    if (code.includes('/hw/')) {
      cleanCode = code.split('/hw/')[1].split('?')[0].split('/')[0];
    }

    router.push(`/hw/${cleanCode}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-center">
        {/* School Logo & Brand Header */}
        <div className="space-y-3">
          {schoolInfo.logoUrl ? (
            <img
              src={schoolInfo.logoUrl}
              alt="Logo Trường"
              className="w-20 h-20 rounded-3xl object-cover border-2 border-blue-500 shadow-lg shadow-blue-500/20 mx-auto bg-white"
            />
          ) : (
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto shadow-lg text-3xl text-white font-bold">
              🏫
            </div>
          )}

          <div className="space-y-1">
            <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {schoolInfo.schoolYear || '2026-2027'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {schoolInfo.name}
            </h1>
            <p className="text-xs text-slate-500">
              Cổng Tra Cứu Thông Tin Học Tập & Lịch Học Dành Cho Phụ Huynh & Học Sinh.
            </p>
          </div>
        </div>

        {/* Access Code Input Form */}
        <form onSubmit={handleAccessClass} className="space-y-3 text-left">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Nhập Mã Lớp Học / Đường Dẫn Bí Mật:</span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                required
                placeholder="VD: c4a1-8f92a4 hoặc dán link lớp..."
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Truy Cập Góc Học Tập Của Con</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-2 text-[11px] text-slate-500 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Để bảo mật thông tin học sinh, vui lòng sử dụng liên kết chia sẻ riêng hoặc mã do Giáo viên chủ nhiệm lớp cung cấp.
            </span>
          </div>
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium truncate max-w-[200px]" title={schoolInfo.address}>
            {schoolInfo.address || 'Hà Nội'}
          </span>
          <Link href="/login" className="font-bold text-blue-600 hover:underline shrink-0">
            Giáo viên đăng nhập →
          </Link>
        </div>
      </div>
    </div>
  );
}
