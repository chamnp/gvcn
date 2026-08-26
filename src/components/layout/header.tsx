'use client';

import React from 'react';
import { Calendar, Sparkles, FileSpreadsheet, Download, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { TERMS } from '@/lib/tt27-engine';
import { TermType } from '@/types';
import Link from 'next/link';

export const Header: React.FC = () => {
  const { currentTerm, setCurrentTerm, classInfo } = useAppStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Term selector & Year */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <span className="text-xs font-semibold text-slate-600 uppercase pr-1">Kỳ Đánh Giá:</span>
          {TERMS.map((t) => (
            <button
              key={t.id}
              onClick={() => setCurrentTerm(t.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                currentTerm === t.id
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <span className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          Năm học: {classInfo.schoolYear}
        </span>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center space-x-2.5">
        <Link
          href="/ai-assistant"
          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sinh Nhận Xét AI</span>
        </Link>

        <Link
          href="/reports"
          className="inline-flex items-center space-x-1.5 bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất Báo Cáo TT27</span>
        </Link>
      </div>
    </header>
  );
};
