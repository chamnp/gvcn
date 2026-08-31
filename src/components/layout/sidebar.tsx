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
  GraduationCap,
  Sparkle,
  Calendar,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  BookOpen,
  Camera,
  Tv,
  Target,
  Presentation,
  HeartPulse,
  BookMarked,
  ChevronDown,
  ChevronRight,
  Smartphone,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { useMobileNav } from './mobile-nav-context';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | null;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    title: 'TỔNG QUAN & LỚP HỌC',
    icon: '🏠',
    items: [
      { href: '/', label: 'Tổng quan Lớp', icon: LayoutDashboard, badge: null },
      { href: '/students', label: 'Hồ sơ Học sinh', icon: Users, badge: null },
      { href: '/seating-chart', label: 'Sơ đồ Lớp học', icon: Grid3X3, badge: null },
    ],
  },
  {
    id: 'daily',
    title: 'ĐIỀU HÀNH HÀNG NGÀY',
    icon: '⚡',
    items: [
      { href: '/attendance', label: 'Điểm danh & Bán trú', icon: CalendarCheck, badge: null },
      { href: '/behavior', label: 'Nề nếp & Tích sao', icon: Award, badge: null },
      { href: '/timetable', label: 'Thời khóa biểu', icon: Calendar, badge: '2 Buổi' },
      { href: '/health-records', label: 'Sức Khỏe & Y Tế', icon: HeartPulse, badge: 'BMI' },
    ],
  },
  {
    id: 'assessment',
    title: 'CHUYÊN MÔN & ĐÁNH GIÁ',
    icon: '🎓',
    items: [
      { href: '/lesson-plans', label: 'Giáo án điện tử', icon: Presentation, badge: 'CV 2345' },
      { href: '/assessment', label: 'Đánh giá TT 27', icon: FileSpreadsheet, badge: 'Cốt lõi' },
      { href: '/iep', label: 'Kế hoạch IEP TT27', icon: Target, badge: 'Phụ đạo' },
      { href: '/matrix-exam', label: 'Ma trận Đề TT27', icon: BookOpen, badge: 'Đề 10đ' },
      { href: '/ai-assistant', label: 'Trợ lý Nhận xét AI', icon: Sparkles, badge: 'AI Pro' },
    ],
  },
  {
    id: 'activities',
    title: 'HOẠT ĐỘNG & TƯƠNG TÁC',
    icon: '🤝',
    items: [
      { href: '/classroom-tools', label: 'Công cụ Lớp học', icon: Tv, badge: 'Smart TV' },
      { href: '/remote', label: 'Remote Giảng Dạy', icon: Smartphone, badge: 'Không dây' },
      { href: '/parent-meetings', label: 'Họp Phụ Huynh', icon: Presentation, badge: 'Chiếu TV' },
      { href: '/reading-corner', label: 'Tủ Sách Lớp Học', icon: BookMarked, badge: 'Đọc sách' },
      { href: '/moments', label: 'Khoảnh khắc Lớp', icon: Camera, badge: 'Feed' },
      { href: '/homework', label: 'Giao bài tập (QR)', icon: BookOpen, badge: 'Mới' },
    ],
  },
  {
    id: 'system',
    title: 'BÁO CÁO & HỆ THỐNG',
    icon: '⚙️',
    items: [
      { href: '/reports', label: 'Báo cáo & Xuất Excel', icon: FileDown, badge: null },
      { href: '/settings', label: 'Cài đặt & Lớp học', icon: Settings, badge: null },
      { href: '/admin', label: 'Quản Trị Trường', icon: ShieldCheck, badge: 'Admin' },
    ],
  },
];

// Flat export for compatibility
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const SidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const pathname = usePathname();
  const { schoolClasses, activeClassId, classInfo, switchClass, students, schoolInfo } = useAppStore();
  const { user, profile, isAdmin, signOut } = useAuth();

  // Collapsible state for each section (default all open)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group containing current path
  useEffect(() => {
    NAV_GROUPS.forEach((group) => {
      const hasActive = group.items.some(
        (item) => pathname === item.href || (item.href !== '/' && item.href !== '/admin' && pathname.startsWith(item.href))
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white tracking-wide text-base group-hover:text-blue-400 transition-colors">
                GVCN PRO
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                TT27
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[140px]" title={schoolInfo?.name || 'Tiểu học'}>
              {schoolInfo?.name || 'Tiểu học Đại Mỗ'}
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

      {/* Class Quick Switcher Card */}
      <div className="mx-3 sm:mx-4 my-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xs space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {isAdmin ? 'Chọn Lớp Quản Lý' : 'Lớp Phụ Trách'}
          </span>
          {isAdmin ? (
            <select
              value={activeClassId}
              onChange={(e) => switchClass(e.target.value)}
              className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-lg font-bold border-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
            >
              {schoolClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} (K{c.grade})
                </option>
              ))}
            </select>
          ) : (
            <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-lg font-bold">
              Lớp {classInfo.name}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-white truncate">{classInfo.schoolName}</p>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-700/50">
          <span className="truncate">GV: {classInfo.teacherName}</span>
          <span className="text-emerald-400 font-semibold shrink-0">{students.length} HS</span>
        </div>
      </div>

      {/* Grouped Nav Menu */}
      <nav className="flex-1 px-3 py-1 space-y-3 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group) => {
          // Filter out items like admin if not admin
          const visibleItems = group.items.filter((item) => (item.href === '/admin' ? isAdmin : true));
          if (visibleItems.length === 0) return null;

          const isCollapsed = !!collapsedGroups[group.id];
          const hasActiveItem = visibleItems.some(
            (item) => pathname === item.href || (item.href !== '/' && item.href !== '/admin' && pathname.startsWith(item.href))
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
                      pathname === item.href || (item.href !== '/' && item.href !== '/admin' && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? item.href === '/admin'
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                              : 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                            : item.href === '/admin'
                            ? 'text-purple-300 hover:bg-purple-950/40 hover:text-purple-100 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? 'text-white'
                                : item.href === '/admin'
                                ? 'text-purple-400'
                                : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0 ml-1.5 ${
                              item.badge === 'Admin'
                                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                                : item.badge === 'AI Pro'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : item.badge === 'Cốt lõi'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : item.badge === 'Smart TV' || item.badge === 'Chiếu TV'
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
                <p className="text-[10px] text-slate-400 truncate">{profile?.title || user.email}</p>
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
            <span>Đăng Nhập Email / Google</span>
          </Link>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1">
          <Sparkle className="w-3 h-3 text-blue-400" />
          <span>Vercel + Supabase</span>
        </span>
        <span>v1.0.0</span>
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
