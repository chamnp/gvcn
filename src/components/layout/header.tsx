'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Download,
  Menu,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { TERMS } from '@/lib/tt27-engine';
import { TermType } from '@/types';
import Link from 'next/link';
import { useMobileNav } from './mobile-nav-context';

export const Header: React.FC = () => {
  const { currentTerm, setCurrentTerm, classInfo } = useAppStore();
  const { toggleMobileNav } = useMobileNav();
  const [showTermDropdown, setShowTermDropdown] = useState(false);

  const activeTermObj = TERMS.find((t) => t.id === currentTerm);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Drawer Button & Term Selector */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileNav}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Mở danh mục"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Title */}
        <div className="flex items-center space-x-1.5 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            {classInfo.name}
          </div>
        </div>

        {/* Desktop Term Selector Pills */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
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

        {/* Mobile Term Selector Dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowTermDropdown(!showTermDropdown)}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate max-w-[100px]">{activeTermObj?.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showTermDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowTermDropdown(false)}
              />
              <div className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                  Chọn kỳ đánh giá TT27:
                </p>
                {TERMS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTerm(t.id);
                      setShowTermDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      currentTerm === t.id
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t.name}</span>
                    {currentTerm === t.id && <span className="text-blue-600">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <span className="hidden xl:inline-block text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          Năm học: {classInfo.schoolYear}
        </span>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5">
        <Link
          href="/ai-assistant"
          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sinh Nhận Xét AI</span>
          <span className="sm:hidden">AI</span>
        </Link>

        <Link
          href="/reports"
          className="inline-flex items-center space-x-1.5 bg-emerald-600 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Xuất Báo Cáo TT27</span>
          <span className="sm:hidden">Xuất</span>
        </Link>
      </div>
    </header>
  );
};
