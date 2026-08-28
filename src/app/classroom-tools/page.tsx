"use client";

import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Clock,
  Award,
  Shuffle,
  Volume2,
  Tv,
  ChevronRight,
  Flame,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { LuckyWheelModal } from '@/components/classroom/lucky-wheel-modal';
import { ClassroomTimerModal } from '@/components/classroom/classroom-timer-modal';
import { SmartTeamGeneratorModal } from '@/components/classroom/smart-team-generator-modal';
import { LiveLeaderboardModal } from '@/components/classroom/live-leaderboard-modal';
import Link from 'next/link';

export default function ClassroomToolsPage() {
  const { students, classInfo } = useAppStore();

  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isTeamGenOpen, setIsTeamGenOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none">
          <Tv className="w-80 h-80" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <span>🎡 Trợ Thủ Giảng Dạy Trên Lớp Học</span>
            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">
              Smart Board Pro
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Bộ Công Cụ Tương Tác Lớp Học Trực Quan
          </h1>

          <p className="text-sm sm:text-base text-blue-100 leading-relaxed font-medium">
            Thiết kế tối ưu để chiếu trực tiếp lên <strong>màn hình TV / Máy chiếu</strong> trong các tiết dạy học, thảo luận nhóm và giờ sinh hoạt lớp {classInfo.name}.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold">
              🏫 Lớp: {classInfo.name}
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold">
              👥 Sĩ số: {students.length} học sinh
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold">
              ✨ Chuông báo & Pháo hoa tự động
            </span>
          </div>
        </div>
      </div>

      {/* 4 Interactive Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Lucky Wheel */}
        <div
          onClick={() => setIsWheelOpen(true)}
          className="group bg-white rounded-3xl p-6 border-2 border-slate-200/80 hover:border-blue-500 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                🎡
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full border border-blue-200">
                1-Click Chiếu TV
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                Vòng Quay May Mắn — Gọi Tên Ngẫu Nhiên
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Quay số gọi học sinh lên bảng phát biểu hoặc nhận thưởng công bằng, vui nhộn. Tích hợp âm thanh tích tắc và bắn pháo hoa khi trúng tên.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Mở vòng quay ngay →</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 2. Classroom Timer */}
        <div
          onClick={() => setIsTimerOpen(true)}
          className="group bg-white rounded-3xl p-6 border-2 border-slate-200/80 hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                ⏱️
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
                Toàn Màn Hình
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                Đồng Hồ Đếm Ngược Hoạt Động Nhóm
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Đồng hồ kỹ thuật số màn hình lớn với các mốc thời gian thông dụng (1p, 2p, 5p, 10p, 15p), kèm chuông báo hết giờ giòn giã.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>Mở đồng hồ đếm ngược →</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 3. Smart Team Generator */}
        <div
          onClick={() => setIsTeamGenOpen(true)}
          className="group bg-white rounded-3xl p-6 border-2 border-slate-200/80 hover:border-purple-500 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
                👥
              </div>
              <span className="bg-purple-50 text-purple-700 text-xs font-black px-3 py-1 rounded-full border border-purple-200">
                Cân Bằng Giới Tính
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                Bộ Chia Nhóm Học Tập Tự Động
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tự động chia {students.length} học sinh thành 2-8 nhóm với tên nhóm sinh động, đảm bảo phân bổ đều tỷ lệ nam/nữ và hỗ trợ sao chép danh sách 1-click.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
            <span>Tạo danh sách nhóm ngay →</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 4. Live Leaderboard */}
        <div
          onClick={() => setIsLeaderboardOpen(true)}
          className="group bg-white rounded-3xl p-6 border-2 border-slate-200/80 hover:border-amber-500 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
                🏆
              </div>
              <span className="bg-amber-50 text-amber-800 text-xs font-black px-3 py-1 rounded-full border border-amber-200">
                Đua Sao Nề Nếp
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                Đường Đua Thi Đua 4 Tổ Trực Tiếp
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bảng điểm 4 Tổ (Sư Tử 🦁, Đại Bàng 🦅, Cá Heo 🐬, Gấu Trúc 🐼) với thanh tiến độ về đích trực quan, cộng trừ sao thi đua ngay trong tiết học.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
            <span>Chiếu bảng thi đua 4 tổ →</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Classroom Quick Tools Modals */}
      <LuckyWheelModal
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
        students={students}
      />

      <ClassroomTimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        className={classInfo.name}
      />

      <SmartTeamGeneratorModal
        isOpen={isTeamGenOpen}
        onClose={() => setIsTeamGenOpen(false)}
        students={students}
        className={classInfo.name}
      />

      <LiveLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        students={students}
        className={classInfo.name}
      />
    </div>
  );
}
