'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Users,
  CalendarCheck,
  Award,
  FileSpreadsheet,
  Calendar,
  Grid3X3,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  School,
  CheckCircle2,
} from 'lucide-react';

export default function DemoHubPage() {
  const DEMO_MODULES = [
    {
      title: 'Hồ Sơ Học Sinh Mẫu (30 Em)',
      desc: 'Danh sách 30 học sinh Lớp 4A1 với đầy đủ mã số, ngày sinh, thông tin phụ huynh và trạng thái bán trú.',
      href: '/students',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Đánh Giá Học Sinh Thông Tư 27',
      desc: 'Bảng đánh giá Môn học (T/H/C) & Năng lực Phẩm chất (T/Đ/C) kèm thuật toán tự động xét danh hiệu khen thưởng.',
      href: '/assessment',
      icon: FileSpreadsheet,
      color: 'bg-indigo-500',
    },
    {
      title: 'Điểm Danh & Báo Cơm Bán Trú',
      desc: 'Điểm danh 1-click có mặt/vắng và tự động xuất báo cáo suất ăn trưa cho nhà bếp qua Zalo.',
      href: '/attendance',
      icon: CalendarCheck,
      color: 'bg-emerald-500',
    },
    {
      title: 'Thời Khóa Biểu Tiểu Học 2 Buổi/Ngày',
      desc: 'Thời khóa biểu chuẩn 7 tiết/ngày với màu sắc môn học, tích hợp môn tùy biến STEM & Kỹ năng sống.',
      href: '/timetable',
      icon: Calendar,
      color: 'bg-amber-500',
    },
    {
      title: 'Cổng Giao Bài Tập & QR Code Lớp',
      desc: 'Giao bài tập về nhà và tạo mã QR để học sinh, phụ huynh quét xem không cần đăng nhập.',
      href: '/homework',
      icon: BookOpen,
      color: 'bg-purple-500',
    },
    {
      title: 'Sơ Đồ Lớp Học Thông Minh',
      desc: 'Kéo thả xếp chỗ ngồi trực quan theo hàng và cột, tự động nhắc nhở học sinh cận thị ngồi bàn đầu.',
      href: '/seating-chart',
      icon: Grid3X3,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Demo Warning Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg space-y-2">
        <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>KHÔNG GIAN TRẢI NGHIỆM DÙNG THỬ (DEMO MODE)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Bản Trải Nghiệm Mẫu — Lớp 4A1 (Trường Chu Văn An)
        </h1>
        <p className="text-xs sm:text-sm text-amber-100 max-w-2xl leading-relaxed">
          Không gian này chứa đầy đủ dữ liệu mẫu minh họa (30 học sinh, bảng đánh giá TT27, thời khóa biểu, nề nếp). Bạn có thể bấm vào các module bên dưới để thử nghiệm tất cả tính năng.
        </p>
      </div>

      {/* Grid of Demo Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_MODULES.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <Link
              key={idx}
              href={mod.href}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-2xl ${mod.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>Vào thử nghiệm</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Switch to Real Mode CTA */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-base">Sẵn sàng sử dụng cho lớp học thật của bạn?</h3>
          <p className="text-xs text-slate-400">
            Đăng nhập tài khoản Google/Email của bạn để bắt đầu quản lý danh sách học sinh thật.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-colors shrink-0"
        >
          <span>Đăng Nhập Quản Lý Lớp Thật</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
