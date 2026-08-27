'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { BookOpen, GraduationCap, School, ChevronRight, Sun, Calendar, Sparkles } from 'lucide-react';

export default function HomeworkPortalIndex() {
  const { schoolClasses, schoolInfo } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
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
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 text-3xl">
              🎒
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
              Cổng tra cứu bài tập về nhà, lịch sự kiện & thời khóa biểu dành cho Học sinh & Phụ huynh.
            </p>
          </div>
        </div>

        {/* Class Selection */}
        <div className="space-y-2.5 text-left">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chọn Lớp Của Em:
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {schoolClasses.map((cls) => {
              const slug = cls.name.toLowerCase().replace(/\s+/g, '');
              return (
                <Link
                  key={cls.id}
                  href={`/hw/${slug}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
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
