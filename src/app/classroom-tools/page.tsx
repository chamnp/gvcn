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
  Mic,
  Gift,
  Smile,
  Zap,
  BookOpen,
  Filter,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { LuckyWheelModal } from '@/components/classroom/lucky-wheel-modal';
import { ClassroomTimerModal } from '@/components/classroom/classroom-timer-modal';
import { SmartTeamGeneratorModal } from '@/components/classroom/smart-team-generator-modal';
import { LiveLeaderboardModal } from '@/components/classroom/live-leaderboard-modal';
import { NoiseMeterModal } from '@/components/classroom/noise-meter-modal';
import { TrafficLightModal } from '@/components/classroom/traffic-light-modal';
import { SoundboardModal } from '@/components/classroom/soundboard-modal';
import { MysteryChestModal } from '@/components/classroom/mystery-chest-modal';
import { SmartPairMatcherModal } from '@/components/classroom/smart-pair-matcher-modal';
import { DailyMoodModal } from '@/components/classroom/daily-mood-modal';
import { BrainBreakModal } from '@/components/classroom/brain-break-modal';
import { TaskCanvasModal } from '@/components/classroom/task-canvas-modal';
import { FloatingSmartDock } from '@/components/classroom/floating-smart-dock';

type ToolCategory = 'ALL' | 'INTERACTION' | 'MANAGEMENT' | 'ENERGY';

export default function ClassroomToolsPage() {
  const { students, classInfo } = useAppStore();

  const [category, setCategory] = useState<ToolCategory>('ALL');

  // Modal States
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isTeamGenOpen, setIsTeamGenOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isNoiseOpen, setIsNoiseOpen] = useState(false);
  const [isTrafficOpen, setIsTrafficOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [isPairOpen, setIsPairOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isBrainBreakOpen, setIsBrainBreakOpen] = useState(false);
  const [isTaskCanvasOpen, setIsTaskCanvasOpen] = useState(false);

  const TOOLS = [
    // 1. Lucky Wheel
    {
      id: 'wheel',
      category: 'INTERACTION',
      title: 'Vòng Quay May Mắn — Gọi Tên Ngẫu Nhiên',
      desc: 'Quay số gọi học sinh phát biểu công bằng, vui nhộn kèm pháo hoa và nút thưởng sao trực tiếp vào sổ nề nếp.',
      badge: '🎡',
      tag: '1-Click Gọi Tên',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      gradient: 'from-blue-500 to-indigo-600',
      actionText: 'Mở vòng quay ngay →',
      actionColor: 'text-blue-600',
      onClick: () => setIsWheelOpen(true),
    },
    // 2. Classroom Timer
    {
      id: 'timer',
      category: 'MANAGEMENT',
      title: 'Đồng Hồ Đếm Ngược Hoạt Động & Nhạc Lo-Fi',
      desc: 'Đồng hồ kỹ thuật số màn hình lớn với các mốc chuẩn (1p, 2p, 5p, 10p, 15p, 20p) tích hợp nhạc nền tập trung êm dịu.',
      badge: '⏱️',
      tag: 'Toàn Màn Hình TV',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      gradient: 'from-emerald-500 to-teal-600',
      actionText: 'Mở đồng hồ đếm ngược →',
      actionColor: 'text-emerald-600',
      onClick: () => setIsTimerOpen(true),
    },
    // 3. Noise Meter
    {
      id: 'noise',
      category: 'MANAGEMENT',
      title: 'Máy Đo Tiếng Ồn Trực Quan & Cảnh Báo Trật Tự',
      desc: 'Bắt micro laptop đo âm lượng thời gian thực, hiển thị quả bóng nảy (Bouncy Balls) và thưởng sao khi lớp giữ trật tự đủ mục tiêu.',
      badge: '🔊',
      tag: 'Micro Tự Động',
      tagColor: 'bg-teal-50 text-teal-700 border-teal-200',
      gradient: 'from-teal-500 to-cyan-600',
      actionText: 'Bật máy đo tiếng ồn →',
      actionColor: 'text-teal-600',
      onClick: () => setIsNoiseOpen(true),
    },
    // 4. Traffic Light
    {
      id: 'traffic',
      category: 'MANAGEMENT',
      title: 'Đèn Giao Thông Báo Hiệu Trạng Thái Lớp Học',
      desc: 'Đổi trạng thái học tập tức thì (Đỏ: Dừng lại nghe cô • Vàng: Thì thầm đôi bạn • Xanh: Tự do thảo luận) bằng phím tắt 1, 2, 3.',
      badge: '🚦',
      tag: 'Phím Tắt 1, 2, 3',
      tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
      gradient: 'from-rose-500 to-pink-600',
      actionText: 'Chiếu đèn hiệu nề nếp →',
      actionColor: 'text-rose-600',
      onClick: () => setIsTrafficOpen(true),
    },
    // 5. Soundboard
    {
      id: 'soundboard',
      category: 'ENERGY',
      title: 'Bảng Âm Thanh Sư Phạm & Nhạc Tập Trung',
      desc: 'Chuông định tâm ngân 5s lắng dịu lớp học, tràng pháo tay hoan hô, tiếng trống dồn hồi hộp và nhạc không lời hỗ trợ làm bài.',
      badge: '🔔',
      tag: 'Phát Loa Lớp Học',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
      gradient: 'from-purple-500 to-indigo-600',
      actionText: 'Mở bảng âm thanh →',
      actionColor: 'text-purple-600',
      onClick: () => setIsSoundboardOpen(true),
    },
    // 6. Mystery Chest
    {
      id: 'chest',
      category: 'INTERACTION',
      title: 'Hộp Quà Bí Mật — Khen Thưởng Đột Xuất',
      desc: '6 hộp quà 3D lấp lánh để học sinh chọn số, lật mở các phần thưởng tinh thần thú vị và lưu trực tiếp vào sổ nề nếp.',
      badge: '🎁',
      tag: 'Khen Thưởng TT27',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
      gradient: 'from-amber-400 to-orange-500',
      actionText: 'Mở hộp quà bí mật →',
      actionColor: 'text-amber-700',
      onClick: () => setIsChestOpen(true),
    },
    // 7. Pair Matcher
    {
      id: 'pair',
      category: 'INTERACTION',
      title: 'Bộ Ghép Cặp "Đôi Bạn Cùng Tiến" & Đóng Vai',
      desc: 'Ghép cặp đôi toàn lớp (ngẫu nhiên / cân bằng Nam-Nữ) hoặc bốc thăm 1 cặp đôi lên bảng đóng vai hội thoại và thi đấu đối kháng.',
      badge: '🤝',
      tag: 'Think - Pair - Share',
      tagColor: 'bg-teal-50 text-teal-700 border-teal-200',
      gradient: 'from-teal-600 to-emerald-600',
      actionText: 'Ghép cặp học tập ngay →',
      actionColor: 'text-teal-600',
      onClick: () => setIsPairOpen(true),
    },
    // 8. Smart Team Gen
    {
      id: 'team',
      category: 'INTERACTION',
      title: 'Bộ Chia Nhóm Tự Động & Phân Vai Trò',
      desc: 'Tự động chia 2-8 nhóm cân bằng giới tính, tên nhóm sinh động và chỉ định vai trò (👑 Trưởng nhóm, 📝 Thư ký, 🎤 Báo cáo viên).',
      badge: '👥',
      tag: 'Phân Vai Trò Nhóm',
      tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      gradient: 'from-indigo-500 to-purple-600',
      actionText: 'Tạo danh sách nhóm ngay →',
      actionColor: 'text-indigo-600',
      onClick: () => setIsTeamGenOpen(true),
    },
    // 9. Leaderboard
    {
      id: 'leaderboard',
      category: 'ENERGY',
      title: 'Đường Đua Thi Đua Tích Sao 4 Tổ Trực Tiếp',
      desc: 'Bảng điểm 4 Tổ (Sư Tử 🦁, Đại Bàng 🦅, Cá Heo 🐬, Gấu Trúc 🐼) với thanh tiến độ về đích trực quan và nút trao sao vào sổ.',
      badge: '🏆',
      tag: 'Đua Sao Nề Nếp',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
      gradient: 'from-amber-500 to-rose-500',
      actionText: 'Chiếu bảng thi đua 4 tổ →',
      actionColor: 'text-amber-700',
      onClick: () => setIsLeaderboardOpen(true),
    },
    // 10. Daily Mood
    {
      id: 'mood',
      category: 'ENERGY',
      title: 'Thời Tiết Cảm Xúc — Điểm Danh Tâm Trạng Đầu Giờ',
      desc: 'Ghi nhận 5 vùng cảm xúc (☀️ Nắng ấm, 🌈 Cầu vồng, ☁️ Mây trắng, 🌧️ Mưa rào, ⛈️ Giông bão) giúp cô thấu hiểu tâm lý học sinh.',
      badge: '☀️',
      tag: 'Giáo Dục Cảm Xúc SEL',
      tagColor: 'bg-orange-50 text-orange-800 border-orange-200',
      gradient: 'from-amber-400 to-rose-400',
      actionText: 'Điểm danh cảm xúc ngay →',
      actionColor: 'text-orange-700',
      onClick: () => setIsMoodOpen(true),
    },
    // 11. Brain Break
    {
      id: 'brainbreak',
      category: 'ENERGY',
      title: 'Góc Thể Dục & Nạp Năng Lượng 2 Phút',
      desc: 'Thử thách vận động ngộ nghĩnh (Hít thở vươn vai, Vỗ tay theo nhịp, Chim bay cò bay, Massage vai) giúp cả lớp tái tạo năng lượng.',
      badge: '🧘',
      tag: 'Giải Tỏa Mệt Mỏi',
      tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
      gradient: 'from-rose-500 to-pink-600',
      actionText: 'Bắt đầu nạp năng lượng →',
      actionColor: 'text-rose-600',
      onClick: () => setIsBrainBreakOpen(true),
    },
    // 12. Task Canvas
    {
      id: 'taskcanvas',
      category: 'MANAGEMENT',
      title: 'Bảng Lệnh Nhiệm Vụ & Lời Dặn Tiết Học',
      desc: 'Chiếu chữ to rõ ràng nội dung bài tập cần hoàn thành, kèm đồng hồ đếm ngược mini và bảng vinh danh gương sáng tiết học.',
      badge: '📋',
      tag: 'Trực Quan TV',
      tagColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      gradient: 'from-cyan-600 to-blue-700',
      actionText: 'Chiếu bảng nhiệm vụ ngay →',
      actionColor: 'text-cyan-700',
      onClick: () => setIsTaskCanvasOpen(true),
    },
  ];

  const filteredTools =
    category === 'ALL' ? TOOLS : TOOLS.filter((t) => t.category === category);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
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
            Thiết kế tối ưu cho <strong>Cô giáo thao tác 1-Click trên laptop</strong> và chiếu trực tiếp lên <strong>màn hình TV / Máy chiếu</strong> trong các tiết dạy học, thảo luận nhóm và giờ sinh hoạt lớp {classInfo.name}.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold">
              🏫 Lớp: {classInfo.name}
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold">
              👥 Sĩ số: {students.length} học sinh
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold">
              ✨ 12 Công cụ thông minh 1-Click
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold">
              ⭐ Tích hợp cộng sao tự động
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 font-bold shrink-0">
          <button
            type="button"
            onClick={() => setCategory('ALL')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              category === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🌟 Tất Cả (12)
          </button>
          <button
            type="button"
            onClick={() => setCategory('INTERACTION')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              category === 'INTERACTION'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🎲 Tương Tác & Gọi Tên (4)
          </button>
          <button
            type="button"
            onClick={() => setCategory('MANAGEMENT')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              category === 'MANAGEMENT'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            ⏱️ Quản Lý Tiết Dạy (4)
          </button>
          <button
            type="button"
            onClick={() => setCategory('ENERGY')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              category === 'ENERGY'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🏆 Khen Thưởng & Năng Lượng (4)
          </button>
        </div>
      </div>

      {/* 12 Interactive Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={tool.onClick}
            className="group bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200/80 hover:border-blue-500 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${tool.gradient} text-white flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform`}
                >
                  {tool.badge}
                </div>
                <span
                  className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${tool.tagColor}`}
                >
                  {tool.tag}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            </div>

            <div
              className={`pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold ${tool.actionColor} group-hover:translate-x-1 transition-transform`}
            >
              <span>{tool.actionText}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Modals Suite */}
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

      <NoiseMeterModal
        isOpen={isNoiseOpen}
        onClose={() => setIsNoiseOpen(false)}
        students={students}
        className={classInfo.name}
      />

      <TrafficLightModal
        isOpen={isTrafficOpen}
        onClose={() => setIsTrafficOpen(false)}
        className={classInfo.name}
      />

      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
        className={classInfo.name}
      />

      <MysteryChestModal
        isOpen={isChestOpen}
        onClose={() => setIsChestOpen(false)}
        students={students}
        className={classInfo.name}
      />

      <SmartPairMatcherModal
        isOpen={isPairOpen}
        onClose={() => setIsPairOpen(false)}
        students={students}
        className={classInfo.name}
      />

      <DailyMoodModal
        isOpen={isMoodOpen}
        onClose={() => setIsMoodOpen(false)}
        students={students}
        className={classInfo.name}
      />

      <BrainBreakModal
        isOpen={isBrainBreakOpen}
        onClose={() => setIsBrainBreakOpen(false)}
        className={classInfo.name}
      />

      <TaskCanvasModal
        isOpen={isTaskCanvasOpen}
        onClose={() => setIsTaskCanvasOpen(false)}
        students={students}
        className={classInfo.name}
      />

      {/* Floating Smart Dock */}
      <FloatingSmartDock
        onOpenWheel={() => setIsWheelOpen(true)}
        onOpenTimer={() => setIsTimerOpen(true)}
        onOpenNoise={() => setIsNoiseOpen(true)}
        onOpenTraffic={() => setIsTrafficOpen(true)}
        onOpenSoundboard={() => setIsSoundboardOpen(true)}
        onOpenChest={() => setIsChestOpen(true)}
        onOpenPair={() => setIsPairOpen(true)}
        onOpenTeam={() => setIsTeamGenOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenMood={() => setIsMoodOpen(true)}
        onOpenBrainBreak={() => setIsBrainBreakOpen(true)}
        onOpenTaskCanvas={() => setIsTaskCanvasOpen(true)}
      />
    </div>
  );
}
