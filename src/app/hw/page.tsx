'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { BookOpen, GraduationCap, School, ChevronRight, Sun } from 'lucide-react';

export default function HomeworkPortalIndex() {
  const { schoolClasses, schoolInfo } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-center">
        {/* Brand */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 text-3xl">
            🎒
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Góc Học Tập & Bài Về Nhà
          </h1>
          <p className="text-xs text-slate-500">
            Cổng tra cứu bài tập và thời khóa biểu trực tuyến dành cho Học sinh & Phụ huynh (Không cần đăng nhập).
          </p>
        </div>

        {/* Class Selection */}
        <div className="space-y-2 text-left">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chọn Lớp Của Em:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {schoolClasses.map((cls) => {
              const slug = cls.name.toLowerCase().replace(/\s+/g, '');
              return (
                <Link
                  key={cls.id}
                  href={`/hw/${slug}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                      {cls.name}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Lớp {cls.name}</h3>
                      <p className="text-[11px] text-slate-500">GVCN: {cls.teacherName}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">{schoolInfo.name}</span>
          <Link href="/login" className="font-bold text-blue-600 hover:underline">
            Giáo viên đăng nhập →
          </Link>
        </div>
      </div>
    </div>
  );
}
