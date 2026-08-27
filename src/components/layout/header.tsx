'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Download,
  Menu,
  ChevronDown,
  GraduationCap,
  School,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { TERMS } from '@/lib/tt27-engine';
import { TermType } from '@/types';
import Link from 'next/link';
import { useMobileNav } from './mobile-nav-context';

export const Header: React.FC = () => {
  const { schoolClasses, activeClassId, classInfo, switchClass, currentTerm, setCurrentTerm, autoCalendarTerm } = useAppStore();
  const { profile } = useAuth();
  const { toggleMobileNav } = useMobileNav();
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  const activeTermObj = TERMS.find((t) => t.id === currentTerm);
  const isAdmin = profile?.role === 'ADMIN';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Drawer Button, Class Badge/Switcher & Term Selector */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileNav}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Mở danh mục"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Class Badge (Static for Teachers, Dropdown Switcher for Admin) */}
        {isAdmin ? (
          <div className="relative">
            <button
              onClick={() => setShowClassDropdown(!showClassDropdown)}
              className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 px-2.5 py-1.5 rounded-xl border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <School className="w-3.5 h-3.5 text-blue-600" />
              <span>Lớp {classInfo.name}</span>
              <ChevronDown className="w-3 h-3 text-blue-500" />
            </button>

            {showClassDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowClassDropdown(false)}
                />
                <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <p className="text-[10px] font-bold text-slate-400 uppercase px-2.5 py-1">
                    Chọn lớp học quản lý:
                  </p>
                  {schoolClasses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        switchClass(c.id);
                        setShowClassDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        activeClassId === c.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <p className="font-bold">Lớp {c.name} (Khối {c.grade})</p>
                        <p className={`text-[10px] ${activeClassId === c.id ? 'text-blue-100' : 'text-slate-400'}`}>
                          {c.teacherName}
                        </p>
                      </div>
                      {activeClassId === c.id && <span>✓</span>}
                    </button>
                  ))}
                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <Link
                      href="/admin"
                      onClick={() => setShowClassDropdown(false)}
                      className="block text-center text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      👑 Quản trị tất cả các lớp →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 bg-blue-50 text-blue-900 px-2.5 py-1.5 rounded-xl border border-blue-200 text-xs font-bold">
            <School className="w-3.5 h-3.5 text-blue-600" />
            <span>Lớp {classInfo.name}</span>
          </div>
        )}

        {/* Desktop Term Selector Pills */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500 ml-1.5" />
          <span className="text-[11px] font-semibold text-slate-600 uppercase pr-1">Kỳ:</span>
          {TERMS.map((t) => {
            const isCurrent = currentTerm === t.id;
            const isCalendarNow = t.id === autoCalendarTerm;
            return (
              <button
                key={t.id}
                onClick={() => setCurrentTerm(t.id)}
                title={`${t.name} (${t.monthsDescription})`}
                className={`relative px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <span>{t.name}</span>
                {isCalendarNow && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCurrent ? 'bg-emerald-300' : 'bg-blue-500'
                    } animate-pulse`}
                    title="Kỳ học tương ứng thời gian thực tế"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Term Selector Dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowTermDropdown(!showTermDropdown)}
            className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1.5 rounded-lg text-xs font-bold border border-slate-200"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate max-w-[80px]">{activeTermObj?.name}</span>
            {activeTermObj?.id === autoCalendarTerm && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            )}
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showTermDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowTermDropdown(false)}
              />
              <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-bold text-slate-400 uppercase px-2.5 py-1">
                  Chọn kỳ đánh giá TT27:
                </p>
                {TERMS.map((t) => {
                  const isCalendarNow = t.id === autoCalendarTerm;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTerm(t.id);
                        setShowTermDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        currentTerm === t.id
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {isCalendarNow && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-normal">{t.monthsDescription}</p>
                      </div>
                      {currentTerm === t.id && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Quick Action Buttons & Admin link */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5">
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Quản Trị Trường</span>
          </Link>
        )}

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

        {/* User Profile Quick Link */}
        {profile && (
          <Link
            href="/settings"
            className="flex items-center space-x-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all border border-slate-200/80"
            title="Xem và chỉnh sửa hồ sơ cá nhân"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-6 h-6 rounded-lg object-cover shadow-2xs"
              />
            ) : (
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                {profile.fullName.split(' ').pop()?.substring(0, 1) || 'G'}
              </div>
            )}
            <span className="hidden md:inline text-xs font-bold truncate max-w-[120px]">
              {profile.fullName}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
};
