'use client';

import React from 'react';
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
  Wallet,
  FileDown,
  Settings,
  GraduationCap,
  Sparkle
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const NAV_ITEMS = [
  { href: '/', label: 'Tổng quan', icon: LayoutDashboard, badge: null },
  { href: '/students', label: 'Hồ sơ Học sinh', icon: Users, badge: null },
  { href: '/seating-chart', label: 'Sơ đồ Lớp học', icon: Grid3X3, badge: null },
  { href: '/attendance', label: 'Điểm danh & Bán trú', icon: CalendarCheck, badge: null },
  { href: '/behavior', label: 'Nề nếp & Tích sao', icon: Award, badge: 'Mới' },
  { href: '/assessment', label: 'Đánh giá TT 27', icon: FileSpreadsheet, badge: 'Cốt lõi' },
  { href: '/ai-assistant', label: 'Trợ lý Nhận xét AI', icon: Sparkles, badge: 'AI Pro' },
  { href: '/finance', label: 'Quỹ lớp & Thu chi', icon: Wallet, badge: null },
  { href: '/reports', label: 'Báo cáo & Xuất Excel', icon: FileDown, badge: null },
  { href: '/settings', label: 'Cài đặt & Supabase', icon: Settings, badge: null },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { classInfo, students } = useAppStore();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white tracking-wide text-base">GVCN PRO</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30">TT27</span>
            </div>
            <p className="text-xs text-slate-400">Tiểu học 2018</p>
          </div>
        </div>
      </div>

      {/* Class Quick Info Card */}
      <div className="mx-4 my-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lớp Chủ Nhiệm</span>
          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full font-bold">
            {classInfo.name}
          </span>
        </div>
        <p className="text-sm font-medium text-white truncate">{classInfo.schoolName}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50">
          <span>GV: {classInfo.teacherName}</span>
          <span className="text-emerald-400 font-semibold">{students.length} HS</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    item.badge === 'AI Pro'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : item.badge === 'Cốt lõi'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkle className="w-3.5 h-3.5 text-blue-400" />
          <span>Vercel + Supabase</span>
        </span>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
};
