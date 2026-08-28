'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  FileSpreadsheet,
  Calendar,
  Menu,
} from 'lucide-react';
import { useMobileNav } from './mobile-nav-context';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { toggleMobileNav } = useMobileNav();

  const NAV_TABS = [
    { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/attendance', label: 'Điểm danh', icon: CalendarCheck },
    { href: '/assessment', label: 'Đánh giá', icon: FileSpreadsheet },
    { href: '/timetable', label: 'TKB', icon: Calendar },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden px-2 py-1 shadow-lg print:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </Link>
          );
        })}

        {/* Hamburger Menu Toggle */}
        <button
          onClick={toggleMobileNav}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Mở tất cả chức năng"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Thêm</span>
        </button>
      </div>
    </nav>
  );
};
