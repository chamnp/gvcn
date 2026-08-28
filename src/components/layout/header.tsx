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
  Check,
  Clock,
  UserCircle,
  ExternalLink,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { TERMS } from '@/lib/tt27-engine';
import { TermType } from '@/types';
import Link from 'next/link';
import { useMobileNav } from './mobile-nav-context';
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator';
import { NotificationCenter } from '@/components/layout/notification-center';

export const Header: React.FC = () => {
  const { schoolClasses, activeClassId, classInfo, switchClass, currentTerm, setCurrentTerm, autoCalendarTerm, schoolInfo } = useAppStore();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { toggleMobileNav } = useMobileNav();

  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeTermObj = TERMS.find((t) => t.id === currentTerm);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* LEFT: Mobile Menu Button + Class Switcher + Term Selector Pill */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 overflow-hidden">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileNav}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors shrink-0"
          aria-label="Mở danh mục"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Class Badge / Switcher */}
        {isAdmin ? (
          <div className="relative shrink-0">
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
                <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                  <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                    Chọn lớp học quản lý:
                  </p>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {schoolClasses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          switchClass(c.id);
                          setShowClassDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                          activeClassId === c.id
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
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
                  </div>
                  <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                    <Link
                      href="/admin"
                      onClick={() => setShowClassDropdown(false)}
                      className="block text-center text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors"
                    >
                      👑 Quản trị tất cả các lớp →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 bg-blue-50 text-blue-900 px-2.5 py-1.5 rounded-xl border border-blue-200 text-xs font-bold shrink-0">
            <School className="w-3.5 h-3.5 text-blue-600" />
            <span>Lớp {classInfo.name}</span>
          </div>
        )}

        {/* Unified Elegant Term Selector Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => setShowTermDropdown(!showTermDropdown)}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200/80 text-xs font-bold transition-all cursor-pointer"
            title="Nhấn để đổi kỳ đánh giá Thông tư 27"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate max-w-[90px] sm:max-w-[170px]">
              {activeTermObj?.name}
            </span>
            {activeTermObj?.id === autoCalendarTerm && (
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                title="Kỳ học thực tế hiện tại"
              />
            )}
            <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
          </button>

          {showTermDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowTermDropdown(false)}
              />
              <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                <div className="px-2.5 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Kỳ Đánh Giá TT27 ({schoolInfo.schoolYear}):
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Áp dụng cho Đánh giá TT27, Báo cáo & AI
                  </p>
                </div>

                {TERMS.map((t) => {
                  const isSelected = currentTerm === t.id;
                  const isCalendarNow = t.id === autoCalendarTerm;

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTerm(t.id);
                        setShowTermDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200/80 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{t.name}</span>
                          {isCalendarNow && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                          📅 {t.monthsDescription}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT: Quick Admin Gateway & User Profile Dropdown Pill */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Network & PWA Status Indicator */}
        <NetworkStatusIndicator />

        {/* Live Notification Center */}
        <NotificationCenter />

        {isAdmin && (
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Quản Trị BGH</span>
          </Link>
        )}

        {/* Homework Portal Quick Link */}
        <Link
          href={`/hw/${classInfo.name.toLowerCase().replace(/\s+/g, '')}`}
          target="_blank"
          className="hidden md:inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
          title="Mở cổng xem bài tập dành cho phụ huynh"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>Xem Cổng Phụ Huynh</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>

        {/* User Profile Popover */}
        {profile ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-7 h-7 rounded-lg object-cover shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {profile.fullName.split(' ').pop()?.substring(0, 1) || 'G'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {profile.fullName}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {profile.title || 'Giáo viên'}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                  <div className="p-2 border-b border-slate-100 text-xs">
                    <p className="font-bold text-slate-900">{profile.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                    <span className="inline-block mt-1 bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      {profile.department || 'Tổ Chuyên môn'}
                    </span>
                  </div>

                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    <UserCircle className="w-4 h-4 text-blue-600" />
                    <span>Hồ sơ cá nhân & Cài đặt</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs text-purple-700 hover:bg-purple-50 font-medium transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Cổng quản trị toàn trường</span>
                    </Link>
                  )}

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span>Đăng Nhập</span>
          </Link>
        )}
      </div>
    </header>
  );
};
