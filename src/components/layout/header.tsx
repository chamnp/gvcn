"use client";

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
  Smartphone,
  Layers,
  Settings,
  HelpCircle,
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
  const {
    schoolClasses,
    activeClassId,
    classInfo,
    switchClass,
    currentTerm,
    setCurrentTerm,
    autoCalendarTerm,
    schoolInfo,
  } = useAppStore();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { toggleMobileNav } = useMobileNav();

  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeTermObj = TERMS.find((t) => t.id === currentTerm);
  const classShareLink = `/hw/${(classInfo.shareToken || classInfo.name).toLowerCase().replace(/\s+/g, '')}`;

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-all">
      {/* ========================================================================= */}
      {/* LEFT: Mobile Toggle + Unified Context Bar (Class & Term Selector) */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobileNav}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors shrink-0 cursor-pointer"
          aria-label="Mở danh mục"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Unified Elegant Context Bar */}
        <div className="inline-flex items-center bg-slate-100/90 hover:bg-slate-100 p-0.5 sm:p-1 rounded-2xl border border-slate-200/70 text-xs shadow-2xs">
          {/* 1. Class Switcher Pill */}
          {isAdmin && schoolClasses.length > 1 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowClassDropdown(!showClassDropdown);
                  setShowTermDropdown(false);
                }}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200/60 font-black transition-all cursor-pointer shadow-2xs"
                title="Đổi lớp học phụ trách"
              >
                <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-xs">
                  🏫
                </div>
                <span className="truncate max-w-[85px] sm:max-w-[120px]">
                  Lớp {classInfo.name || profile?.assignedClassName || '...'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showClassDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowClassDropdown(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in zoom-in-95 space-y-1.5">
                    <div className="px-2 py-1 border-b border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Chọn Lớp Phụ Trách ({schoolClasses.length} lớp):
                      </p>
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar">
                      {schoolClasses.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            switchClass(c.id);
                            setShowClassDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-2xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                            activeClassId === c.id
                              ? 'bg-blue-600 text-white font-black shadow-xs'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className="font-bold">Lớp {c.name} (Khối {c.grade})</p>
                            <p
                              className={`text-[10px] ${
                                activeClassId === c.id ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              GVCN: {c.teacherName || 'Giáo viên'}
                            </p>
                          </div>
                          {activeClassId === c.id && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-white text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200/60 font-black shadow-2xs shrink-0">
              <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-xs">
                🏫
              </div>
              <span className="truncate max-w-[90px] sm:max-w-[140px]">
                Lớp {classInfo.name || profile?.assignedClassName || 'Chưa đặt'}
              </span>
            </div>
          )}

          {/* Elegant Subtle Divider */}
          <div className="h-4 w-px bg-slate-300/80 mx-1 shrink-0" />

          {/* 2. Term Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTermDropdown(!showTermDropdown);
                setShowClassDropdown(false);
              }}
              className="flex items-center space-x-1.5 hover:bg-white/80 text-slate-700 px-2 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
              title="Nhấn để đổi kỳ đánh giá Thông tư 27"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate max-w-[85px] sm:max-w-[150px] font-semibold text-slate-800">
                {activeTermObj?.name}
              </span>
              {activeTermObj?.id === autoCalendarTerm && (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                  title="Kỳ học theo thời gian thực hiện tại"
                />
              )}
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {showTermDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTermDropdown(false)}
                />
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in zoom-in-95 space-y-1.5">
                  <div className="px-2 py-1 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Kỳ Đánh Giá ({schoolInfo.schoolYear}):
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Áp dụng cho Đánh giá, Báo cáo & AI
                    </p>
                  </div>

                  <div className="space-y-1">
                    {TERMS.map((t) => {
                      const isSelected = currentTerm === t.id;
                      const isCalendarNow = t.id === autoCalendarTerm;

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setCurrentTerm(t.id);
                            setShowTermDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-2xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-black border border-blue-200/80 shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">{t.name}</span>
                              {isCalendarNow && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: Quick Action Icons + User Profile Popover */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Network & PWA Status Indicator */}
        <NetworkStatusIndicator />

        {/* Live Notification Center */}
        <NotificationCenter />

        {/* Public Class Homework Portal Link */}
        <Link
          href={classShareLink}
          target="_blank"
          className="hidden md:inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          title="Mở cổng xem bài tập & thời khóa biểu công khai cho phụ huynh"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Cổng Lớp</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>

        {/* Subtle Vertical Divider */}
        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* User Profile Pill & Dropdown Popover */}
        {profile ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 pl-1 pr-2.5 py-1 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-7 h-7 rounded-xl object-cover shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {profile.fullName.split(' ').pop()?.substring(0, 1) || 'G'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-slate-900 truncate max-w-[110px] leading-tight">
                  {profile.fullName}
                </p>
                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[110px] leading-tight">
                  {profile.title || 'Giáo viên Chủ nhiệm'}
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
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in zoom-in-95 space-y-1.5">
                  {/* Account Header */}
                  <div className="p-2.5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-900 truncate">{profile.fullName}</p>
                      <span className={`font-black text-[9px] px-2 py-0.5 rounded-full ${
                        isAdmin ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isAdmin ? 'QUẢN TRỊ BGH' : 'GVCN'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{user?.email}</p>
                    <p className="text-[10px] text-slate-600 font-bold flex items-center gap-1 pt-0.5">
                      <span>🏫 {schoolInfo?.name || 'Trường Tiểu học'}</span>
                    </p>
                  </div>

                  {/* Quick Action Links */}
                  <div className="space-y-0.5 text-xs">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-2xl text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 font-black transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>Trang Quản Trị Hệ Thống</span>
                      </Link>
                    )}

                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-2xl text-slate-700 hover:bg-slate-50 font-bold transition-colors"
                    >
                      <Settings className="w-4 h-4 text-blue-600" />
                      <span>Hồ sơ & Cài đặt lớp học</span>
                    </Link>

                    <Link
                      href="/matrix-exam"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-2xl text-slate-700 hover:bg-slate-50 font-bold transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>Kho đề thi & Ngân hàng câu hỏi</span>
                    </Link>

                    <Link
                      href={classShareLink}
                      target="_blank"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-2xl text-slate-700 hover:bg-slate-50 font-bold transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>Cổng học sinh & Phụ huynh</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-2xl text-xs text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
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
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-md transition-all"
          >
            <span>Đăng Nhập</span>
          </Link>
        )}
      </div>
    </header>
  );
};
