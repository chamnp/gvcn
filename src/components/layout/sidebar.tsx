'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Grid3X3,
  CalendarCheck,
  Award,
  FileSpreadsheet,
  Sparkles,
  FileDown,
  Settings,
  Sparkle,
  Calendar,
  X,
  LogIn,
  LogOut,
  BookOpen,
  Camera,
  Tv,
  Target,
  Presentation,
  BookMarked,
  ChevronDown,
  ChevronRight,
  Globe,
  ShieldCheck,
  NotebookPen,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { useMobileNav } from './mobile-nav-context';
import { FeatureFlags } from '@/lib/feature-flags';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | null;
  feature?: keyof FeatureFlags;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'daily',
    title: 'TÁC NGHIỆP HÀNG NGÀY',
    icon: '⚡',
    items: [
      { href: '/', label: 'Tổng quan Lớp', icon: LayoutDashboard, badge: null },
      { href: '/attendance', label: 'Điểm danh & Bán trú', icon: CalendarCheck, badge: null, feature: 'attendance' },
      { href: '/behavior', label: 'Nề nếp & Tích sao', icon: Award, badge: null, feature: 'behavior' },
      { href: '/daily-notes', label: 'Nhật ký & Nhận xét ngày', icon: NotebookPen, badge: 'Mới', feature: 'dailyNotes' },
      { href: '/timetable', label: 'Thời khóa biểu', icon: Calendar, badge: '2 Buổi', feature: 'timetable' },
      { href: '/homework', label: 'Giao bài tập (QR)', icon: BookOpen, badge: null, feature: 'homework' },
    ],
  },
  {
    id: 'smart_classroom',
    title: 'LỚP HỌC THÔNG MINH',
    icon: '📺',
    items: [
      { href: '/classroom-tools', label: 'Công cụ Lớp học (TV & Remote)', icon: Tv, badge: 'Smart TV', feature: 'classroomTools' },
    ],
  },
  {
    id: 'class_mgmt',
    title: 'QUẢN LÝ LỚP HỌC',
    icon: '👥',
    items: [
      { href: '/students', label: 'Hồ sơ Học sinh', icon: Users, badge: null, feature: 'students' },
      { href: '/settings', label: 'Cài đặt & Tính năng', icon: Settings, badge: null },
    ],
  },
  {
    id: 'assessment',
    title: 'CHUYÊN MÔN & ĐÁNH GIÁ',
    icon: '🎓',
    items: [
      { href: '/assessment', label: 'Đánh giá Học sinh', icon: FileSpreadsheet, badge: 'Thử nghiệm', feature: 'assessment' },
      { href: '/lesson-plans', label: 'Kế hoạch bài dạy', icon: Presentation, badge: 'CV 2345', feature: 'lessonPlans' },
      { href: '/matrix-exam', label: 'Ma trận Đề kiểm tra', icon: BookOpen, badge: 'Đề 10đ', feature: 'matrixExam' },
      { href: '/iep', label: 'Kế hoạch IEP', icon: Target, badge: 'Phụ đạo', feature: 'iep' },
      { href: '/ai-assistant', label: 'Trợ lý Nhận xét AI', icon: Sparkles, badge: 'AI Pro', feature: 'aiAssistant' },
    ],
  },
  {
    id: 'extended_tools',
    title: 'TIỆN ÍCH MỞ RỘNG',
    icon: '✨',
    items: [
      { href: '/seating-chart', label: 'Sơ đồ Lớp học', icon: Grid3X3, badge: null, feature: 'seatingChart' },
      { href: '/parent-meetings', label: 'Họp Phụ Huynh', icon: Presentation, badge: 'Chiếu TV', feature: 'parentMeetings' },
      { href: '/reading-corner', label: 'Tủ Sách Lớp Học', icon: BookMarked, badge: null, feature: 'readingCorner' },
      { href: '/moments', label: 'Khoảnh khắc Lớp', icon: Camera, badge: null, feature: 'moments' },
      { href: '/reports', label: 'Báo cáo & Sổ sách', icon: FileDown, badge: null, feature: 'reports' },
      { href: '/community', label: 'Cộng đồng GVCN', icon: Globe, badge: 'BETA', feature: 'community' },
    ],
  },
];

// Flat export for compatibility
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const SidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const pathname = usePathname();
  const { schoolClasses, activeClassId, classInfo, switchClass, students, schoolInfo, featureFlags } = useAppStore();
  const { user, profile, signOut, isAdmin, teachers } = useAuth();
  const pendingTeachersCount = (teachers || []).filter((t) => t.role === 'PENDING' || !t.isActive).length;

  // Collapsible state for each section (default all open)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group containing current path
  useEffect(() => {
    NAV_GROUPS.forEach((group) => {
      const hasActive = group.items.some(
        (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
      );
      if (hasActive && collapsedGroups[group.id]) {
        setCollapsedGroups((prev) => ({ ...prev, [group.id]: false }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" onClick={onClose} className="flex items-center space-x-3 group min-w-0">
          {schoolInfo?.logoUrl ? (
            <img
              src={schoolInfo.logoUrl}
              alt="Logo trường"
              className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md shadow-blue-500/10 shrink-0 bg-white"
            />
          ) : (
            <img
              src="/app-icon.jpg"
              alt="GVCN Pro Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/30 shrink-0 border border-blue-400/30"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white tracking-wide text-base group-hover:text-blue-400 transition-colors">
                GVCN PRO
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md tracking-wider shadow-xs">
                STABLE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[140px]" title={classInfo.schoolName || profile?.schoolName || 'Trợ Lý Sư Phạm GVCN'}>
              {classInfo.schoolName || profile?.schoolName || 'Trợ Lý Sư Phạm GVCN'}
            </p>
          </div>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Teacher's Class Card */}
      <div className="mx-3 sm:mx-4 my-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xs space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {isAdmin ? 'Đổi Lớp (Admin)' : 'Lớp Chủ Nhiệm'}
          </span>
          {isAdmin ? (
            schoolClasses.length > 0 ? (
              <select
                value={activeClassId}
                onChange={(e) => switchClass(e.target.value)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-0.5 rounded-lg font-bold border-none focus:ring-1 focus:ring-blue-400 cursor-pointer max-w-[130px] truncate"
              >
                {schoolClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} ({c.schoolName ? c.schoolName.substring(0, 12) : `K${c.grade}`})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-400">Chưa có lớp</span>
            )
          ) : classInfo.id ? (
            <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-lg font-bold">
              Lớp {classInfo.name} (K{classInfo.grade})
            </span>
          ) : (
            <span className="bg-amber-500/20 text-amber-400 text-[11px] px-2 py-0.5 rounded-lg font-bold">
              Chưa đăng ký
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-white truncate" title={classInfo.schoolName || profile?.schoolName || 'Chưa cập nhật trường'}>
          🏫 {classInfo.schoolName || profile?.schoolName || 'Chưa cập nhật trường'}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-700/50">
          <span className="truncate">GV: {classInfo.teacherName || profile?.fullName || 'Giáo viên'}</span>
          <span className="text-emerald-400 font-semibold shrink-0">{students.length} HS</span>
        </div>
      </div>

      {/* Grouped Nav Menu */}
      <nav className="flex-1 px-3 py-1 space-y-3 overflow-y-auto custom-scrollbar">
        {/* Admin Console Entry (Only for Admins) */}
        {isAdmin && (
          <div className="space-y-1 mb-2 pb-2.5 border-b border-slate-800">
            <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>QUẢN TRỊ NỀN TẢNG</span>
              </span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-bold">
                ADMIN
              </span>
            </div>
            <Link
              href="/admin"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                pathname === '/admin' || pathname.startsWith('/admin/')
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-indigo-200 hover:bg-slate-800/90 hover:text-white bg-indigo-950/30 border border-indigo-800/40'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <ShieldCheck
                  className={`w-4 h-4 shrink-0 ${
                    pathname.startsWith('/admin') ? 'text-white' : 'text-indigo-400'
                  }`}
                />
                <span className="truncate">Quản Trị Hệ Thống</span>
              </div>
              {pendingTeachersCount > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500 text-slate-950 animate-pulse shrink-0 ml-1.5 shadow-sm">
                  {pendingTeachersCount} chờ duyệt
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-500/20 text-indigo-300 shrink-0 ml-1.5">
                  Admin
                </span>
              )}
            </Link>
          </div>
        )}

        {NAV_GROUPS.map((group) => {
          // Filter out items disabled by feature flags
          const visibleItems = group.items.filter((item) => {
            if (!item.feature) return true;
            return featureFlags ? featureFlags[item.feature] : true;
          });
          if (visibleItems.length === 0) return null;

          const isCollapsed = !!collapsedGroups[group.id];
          const hasActiveItem = visibleItems.some(
            (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          );

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header with Accordion Toggle */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  hasActiveItem
                    ? 'text-blue-300 bg-blue-950/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{group.icon}</span>
                  <span>{group.title}</span>
                </span>
                <span className="text-slate-500">
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              </button>

              {/* Group Items */}
              {!isCollapsed && (
                <div className="space-y-0.5 pl-1 animate-in fade-in duration-150">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0 ml-1.5 ${
                              item.badge === 'AI Pro'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : item.badge === 'Thử nghiệm'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : item.badge === 'Smart TV'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Auth Footer */}
      <div className="p-2.5 mx-3 my-2 rounded-xl bg-slate-800/60 border border-slate-800 shrink-0">
        {user ? (
          <div className="flex items-center justify-between">
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center space-x-2.5 overflow-hidden hover:opacity-80 transition-opacity flex-1 min-w-0"
              title="Chỉnh sửa hồ sơ cá nhân"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {profile?.fullName.split(' ').pop()?.substring(0, 2).toUpperCase() || 'GV'}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.fullName || user.user_metadata?.full_name || 'Giáo viên'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{profile?.schoolName || user.email}</p>
              </div>
            </Link>
            <button
              onClick={() => signOut()}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors shrink-0 cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-center space-x-2 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white py-2 px-3 rounded-lg text-xs font-bold transition-all border border-blue-500/30"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </Link>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1">
          <Sparkle className="w-3 h-3 text-blue-400" />
          <span>GVCN Pro</span>
        </span>
        <Link href="/settings?tab=FEATURES" className="text-blue-400 hover:underline">
          Tính Năng
        </Link>
      </div>
    </div>
  );
};

// Desktop Sidebar
export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex w-64 min-h-screen self-stretch flex-col border-r border-slate-800 shrink-0 bg-slate-900 print:hidden">
      <SidebarContent />
    </aside>
  );
};

// Mobile Drawer Sidebar
export const MobileSidebar: React.FC = () => {
  const { isOpen, closeMobileNav } = useMobileNav();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closeMobileNav}
      />

      {/* Slide-in Drawer */}
      <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <SidebarContent onClose={closeMobileNav} />
      </div>
    </div>
  );
};
