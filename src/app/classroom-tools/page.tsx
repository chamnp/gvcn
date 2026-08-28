"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Users,
  Clock,
  Award,
  Volume2,
  Tv,
  ChevronRight,
  Flame,
  CheckCircle2,
  Mic,
  Gift,
  Smile,
  Zap,
  BookOpen,
  Search,
  Maximize2,
  LayoutGrid,
  Monitor,
  Bell,
  VolumeX,
  Play,
  RotateCcw,
  Compass,
  Command,
  Plus,
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
import { TeamQuizBattleModal } from '@/components/classroom/team-quiz-battle-modal';

type ToolCategory = 'ALL' | 'GAMES' | 'INTERACTION' | 'MANAGEMENT' | 'ENERGY';

interface ClassroomToolItem {
  id: string;
  keyNumber: string;
  category: 'GAMES' | 'INTERACTION' | 'MANAGEMENT' | 'ENERGY';
  title: string;
  shortTitle: string;
  desc: string;
  iconEmoji: string;
  tag: string;
  tagColor: string;
  cardBg: string;
  gradient: string;
  actionText: string;
  actionColor: string;
  onClick: () => void;
  isOpen?: boolean;
}

export default function ClassroomToolsPage() {
  const { students, classInfo } = useAppStore();

  const [category, setCategory] = useState<ToolCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'LAUNCHPAD' | 'DESKTOP'>('LAUNCHPAD');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [hoveredToolId, setHoveredToolId] = useState<string | null>(null);

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
  const [isTeamQuizOpen, setIsTeamQuizOpen] = useState(false);

  // Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcuts (1-9, 0, G, Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'LAUNCHPAD' ? 'DESKTOP' : 'LAUNCHPAD'));
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'g':
          e.preventDefault();
          setIsTeamQuizOpen(true);
          break;
        case '1':
          e.preventDefault();
          setIsWheelOpen(true);
          break;
        case '2':
          e.preventDefault();
          setIsTimerOpen(true);
          break;
        case '3':
          e.preventDefault();
          setIsNoiseOpen(true);
          break;
        case '4':
          e.preventDefault();
          setIsTrafficOpen(true);
          break;
        case '5':
          e.preventDefault();
          setIsSoundboardOpen(true);
          break;
        case '6':
          e.preventDefault();
          setIsChestOpen(true);
          break;
        case '7':
          e.preventDefault();
          setIsPairOpen(true);
          break;
        case '8':
          e.preventDefault();
          setIsTeamGenOpen(true);
          break;
        case '9':
          e.preventDefault();
          setIsLeaderboardOpen(true);
          break;
        case '0':
          e.preventDefault();
          setIsMoodOpen(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const TOOLS: ClassroomToolItem[] = useMemo(
    () => [
      // 0. Team Quiz Arena (Game Học Tập Mới)
      {
        id: 'quizgame',
        keyNumber: 'G',
        category: 'GAMES',
        title: 'Đấu Trí Đua Xe Về Đích — Game Học Tập 2-8 Đội',
        shortTitle: 'Đua Xe Đấu Trí',
        desc: 'Game thi đấu trắc nghiệm Toán, Tiếng Việt, Tiếng Anh 2-8 đội/tổ trên Smart TV kèm cộng sao tự động.',
        iconEmoji: '🏎️',
        tag: 'Game Học Tập 2-8 Đội',
        tagColor: 'bg-amber-100/90 text-amber-900 border-amber-300 font-bold',
        cardBg: 'from-amber-50/95 via-white to-orange-50/50 border-amber-200/90 hover:border-amber-400 hover:shadow-amber-500/20',
        gradient: 'from-amber-500 via-orange-500 to-red-500',
        actionText: 'Vào Game [G] →',
        actionColor: 'text-amber-800 font-black',
        onClick: () => setIsTeamQuizOpen(true),
        isOpen: isTeamQuizOpen,
      },
      // 1. Lucky Wheel
      {
        id: 'wheel',
        keyNumber: '1',
        category: 'INTERACTION',
        title: 'Vòng Quay May Mắn — Gọi Tên Ngẫu Nhiên',
        shortTitle: 'Vòng Quay',
        desc: 'Quay số gọi học sinh phát biểu công bằng, kèm pháo hoa và cộng sao thi đua trực tiếp.',
        iconEmoji: '🎡',
        tag: '1-Click Gọi Tên',
        tagColor: 'bg-blue-100/80 text-blue-800 border-blue-300/80',
        cardBg: 'from-blue-50/90 via-white to-indigo-50/40 border-blue-200/80 hover:border-blue-400 hover:shadow-blue-500/15',
        gradient: 'from-blue-600 via-indigo-600 to-violet-600',
        actionText: 'Mở vòng quay [1] →',
        actionColor: 'text-blue-700 font-bold',
        onClick: () => setIsWheelOpen(true),
        isOpen: isWheelOpen,
      },
      // 2. Classroom Timer
      {
        id: 'timer',
        keyNumber: '2',
        category: 'MANAGEMENT',
        title: 'Đồng Hồ Đếm Ngược & Nhạc Tập Trung',
        shortTitle: 'Đồng Hồ',
        desc: 'Đếm ngược hoạt động nhóm (1p, 2p, 5p, 10p, 15p) kèm nhạc nền Lo-Fi êm dịu.',
        iconEmoji: '⏱️',
        tag: 'Toàn Màn Hình',
        tagColor: 'bg-emerald-100/80 text-emerald-800 border-emerald-300/80',
        cardBg: 'from-emerald-50/90 via-white to-teal-50/40 border-emerald-200/80 hover:border-emerald-400 hover:shadow-emerald-500/15',
        gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
        actionText: 'Mở đồng hồ [2] →',
        actionColor: 'text-emerald-700 font-bold',
        onClick: () => setIsTimerOpen(true),
        isOpen: isTimerOpen,
      },
      // 3. Noise Meter
      {
        id: 'noise',
        keyNumber: '3',
        category: 'MANAGEMENT',
        title: 'Máy Đo Tiếng Ồn & Cảnh Báo Trật Tự',
        shortTitle: 'Máy Đo Ồn',
        desc: 'Bắt micro đo âm lượng thời gian thực, hiển thị bóng nảy và thưởng sao khi lớp yên tĩnh.',
        iconEmoji: '🔊',
        tag: 'Micro Live',
        tagColor: 'bg-teal-100/80 text-teal-800 border-teal-300/80',
        cardBg: 'from-teal-50/90 via-white to-cyan-50/40 border-teal-200/80 hover:border-teal-400 hover:shadow-teal-500/15',
        gradient: 'from-teal-500 via-cyan-600 to-emerald-600',
        actionText: 'Đo tiếng ồn [3] →',
        actionColor: 'text-teal-700 font-bold',
        onClick: () => setIsNoiseOpen(true),
        isOpen: isNoiseOpen,
      },
      // 4. Traffic Light
      {
        id: 'traffic',
        keyNumber: '4',
        category: 'MANAGEMENT',
        title: 'Đèn Giao Thông Báo Hiệu Trạng Thái Lớp',
        shortTitle: 'Đèn Hiệu',
        desc: 'Đổi trạng thái học tập (Đỏ: Lắng nghe • Vàng: Thảo luận đôi • Xanh: Hoạt động tự do).',
        iconEmoji: '🚦',
        tag: 'Phím 1-2-3',
        tagColor: 'bg-rose-100/80 text-rose-800 border-rose-300/80',
        cardBg: 'from-rose-50/90 via-white to-pink-50/40 border-rose-200/80 hover:border-rose-400 hover:shadow-rose-500/15',
        gradient: 'from-rose-500 via-pink-600 to-red-600',
        actionText: 'Chiếu đèn hiệu [4] →',
        actionColor: 'text-rose-700 font-bold',
        onClick: () => setIsTrafficOpen(true),
        isOpen: isTrafficOpen,
      },
      // 5. Soundboard
      {
        id: 'soundboard',
        keyNumber: '5',
        category: 'ENERGY',
        title: 'Bảng Âm Thanh Sư Phạm & Nhạc Tiết Học',
        shortTitle: 'Âm Thanh',
        desc: 'Chuông định tâm 5s lắng dịu lớp học, tiếng vỗ tay hoan hô, tiếng trống dồn hồi hộp.',
        iconEmoji: '🔔',
        tag: 'Phát Loa Lớp',
        tagColor: 'bg-purple-100/80 text-purple-800 border-purple-300/80',
        cardBg: 'from-purple-50/90 via-white to-fuchsia-50/40 border-purple-200/80 hover:border-purple-400 hover:shadow-purple-500/15',
        gradient: 'from-purple-500 via-fuchsia-600 to-indigo-600',
        actionText: 'Bảng âm thanh [5] →',
        actionColor: 'text-purple-700 font-bold',
        onClick: () => setIsSoundboardOpen(true),
        isOpen: isSoundboardOpen,
      },
      // 6. Mystery Chest
      {
        id: 'chest',
        keyNumber: '6',
        category: 'INTERACTION',
        title: 'Hộp Quà Bí Mật — Khen Thưởng Đột Xuất',
        shortTitle: 'Hộp Quà',
        desc: '6 hộp quà 3D lấp lánh mở phần thưởng tinh thần bất ngờ cho các bạn tiến bộ.',
        iconEmoji: '🎁',
        tag: 'Khen Thưởng',
        tagColor: 'bg-amber-100/80 text-amber-900 border-amber-300/80',
        cardBg: 'from-amber-50/90 via-white to-orange-50/40 border-amber-200/80 hover:border-amber-400 hover:shadow-amber-500/15',
        gradient: 'from-amber-400 via-orange-500 to-rose-500',
        actionText: 'Mở hộp quà [6] →',
        actionColor: 'text-amber-800 font-bold',
        onClick: () => setIsChestOpen(true),
        isOpen: isChestOpen,
      },
      // 7. Pair Matcher
      {
        id: 'pair',
        keyNumber: '7',
        category: 'INTERACTION',
        title: 'Ghép Cặp "Đôi Bạn Cùng Tiến" & Đóng Vai',
        shortTitle: 'Ghép Đôi',
        desc: 'Ghép cặp đôi toàn lớp hoặc bốc thăm 1 cặp đôi lên bảng đóng vai hội thoại đối kháng.',
        iconEmoji: '🤝',
        tag: 'Think-Pair',
        tagColor: 'bg-teal-100/80 text-teal-800 border-teal-300/80',
        cardBg: 'from-teal-50/90 via-white to-emerald-50/40 border-teal-200/80 hover:border-teal-400 hover:shadow-teal-500/15',
        gradient: 'from-teal-500 via-emerald-600 to-green-600',
        actionText: 'Ghép cặp đôi [7] →',
        actionColor: 'text-teal-700 font-bold',
        onClick: () => setIsPairOpen(true),
        isOpen: isPairOpen,
      },
      // 8. Smart Team Gen
      {
        id: 'team',
        keyNumber: '8',
        category: 'INTERACTION',
        title: 'Chia Nhóm Tự Động & Phân Vai Trò',
        shortTitle: 'Chia Nhóm',
        desc: 'Chia 2-8 nhóm cân bằng giới tính và chỉ định vai trò Trưởng nhóm, Thư ký, Báo cáo viên.',
        iconEmoji: '👥',
        tag: 'Phân Vai Trò',
        tagColor: 'bg-indigo-100/80 text-indigo-800 border-indigo-300/80',
        cardBg: 'from-indigo-50/90 via-white to-blue-50/40 border-indigo-200/80 hover:border-indigo-400 hover:shadow-indigo-500/15',
        gradient: 'from-indigo-500 via-blue-600 to-purple-600',
        actionText: 'Chia nhóm [8] →',
        actionColor: 'text-indigo-700 font-bold',
        onClick: () => setIsTeamGenOpen(true),
        isOpen: isTeamGenOpen,
      },
      // 9. Leaderboard
      {
        id: 'leaderboard',
        keyNumber: '9',
        category: 'ENERGY',
        title: 'Đường Đua Thi Đua Tích Sao 4 Tổ',
        shortTitle: 'Đua 4 Tổ',
        desc: 'Bảng điểm 4 Tổ (Sư Tử 🦁, Đại Bàng 🦅, Cá Heo 🐬, Gấu Trúc 🐼) tranh tài nề nếp.',
        iconEmoji: '🏆',
        tag: 'Đua Sao',
        tagColor: 'bg-amber-100/80 text-amber-900 border-amber-300/80',
        cardBg: 'from-amber-50/90 via-white to-rose-50/40 border-amber-200/80 hover:border-amber-400 hover:shadow-amber-500/15',
        gradient: 'from-amber-500 via-orange-500 to-red-500',
        actionText: 'Chiếu bảng đua [9] →',
        actionColor: 'text-amber-800 font-bold',
        onClick: () => setIsLeaderboardOpen(true),
        isOpen: isLeaderboardOpen,
      },
      // 10. Daily Mood
      {
        id: 'mood',
        keyNumber: '0',
        category: 'ENERGY',
        title: 'Thời Tiết Cảm Xúc — Điểm Danh Tâm Trạng',
        shortTitle: 'Cảm Xúc',
        desc: 'Ghi nhận 5 vùng cảm xúc (☀️ Nắng ấm, 🌈 Cầu vồng, ☁️ Mây trắng, 🌧️ Mưa, ⛈️ Giông bão).',
        iconEmoji: '☀️',
        tag: 'SEL Cảm Xúc',
        tagColor: 'bg-orange-100/80 text-orange-900 border-orange-300/80',
        cardBg: 'from-yellow-50/90 via-white to-pink-50/40 border-yellow-200/80 hover:border-yellow-400 hover:shadow-yellow-500/15',
        gradient: 'from-yellow-400 via-orange-400 to-pink-500',
        actionText: 'Điểm danh tâm trạng [0] →',
        actionColor: 'text-orange-800 font-bold',
        onClick: () => setIsMoodOpen(true),
        isOpen: isMoodOpen,
      },
      // 11. Brain Break
      {
        id: 'brainbreak',
        keyNumber: 'B',
        category: 'ENERGY',
        title: 'Thể Dục & Nạp Năng Lượng 2 Phút',
        shortTitle: 'Vận Động',
        desc: 'Vận động ngộ nghĩnh (Hít thở, Vỗ tay nhịp điệu, Chim bay cò bay) xua tan mệt mỏi.',
        iconEmoji: '🧘',
        tag: 'Nạp Năng Lượng',
        tagColor: 'bg-rose-100/80 text-rose-800 border-rose-300/80',
        cardBg: 'from-rose-50/90 via-white to-purple-50/40 border-rose-200/80 hover:border-rose-400 hover:shadow-rose-500/15',
        gradient: 'from-rose-500 via-pink-500 to-purple-500',
        actionText: 'Tập thể dục 2p →',
        actionColor: 'text-rose-700 font-bold',
        onClick: () => setIsBrainBreakOpen(true),
        isOpen: isBrainBreakOpen,
      },
      // 12. Task Canvas
      {
        id: 'taskcanvas',
        keyNumber: 'T',
        category: 'MANAGEMENT',
        title: 'Bảng Nhiệm Vụ & Lời Dặn Tiết Học',
        shortTitle: 'Bảng Lệnh',
        desc: 'Chiếu chữ to nhiệm vụ bài tập cần hoàn thành kèm đếm ngược và vinh danh gương sáng.',
        iconEmoji: '📋',
        tag: 'Trực Quan TV',
        tagColor: 'bg-sky-100/80 text-sky-800 border-sky-300/80',
        cardBg: 'from-sky-50/90 via-white to-blue-50/40 border-sky-200/80 hover:border-sky-400 hover:shadow-sky-500/15',
        gradient: 'from-sky-500 via-blue-600 to-indigo-600',
        actionText: 'Chiếu bảng nhiệm vụ →',
        actionColor: 'text-sky-700 font-bold',
        onClick: () => setIsTaskCanvasOpen(true),
        isOpen: isTaskCanvasOpen,
      },
    ],
    [
      isWheelOpen,
      isTimerOpen,
      isNoiseOpen,
      isTrafficOpen,
      isSoundboardOpen,
      isChestOpen,
      isPairOpen,
      isTeamGenOpen,
      isLeaderboardOpen,
      isMoodOpen,
      isBrainBreakOpen,
      isTaskCanvasOpen,
    ]
  );

  const filteredTools = useMemo(() => {
    return TOOLS.filter((t) => {
      const matchCat = category === 'ALL' || t.category === category;
      const matchSearch =
        searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.shortTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [TOOLS, category, searchQuery]);

  return (
    <div className="relative min-h-[calc(100vh-8.5rem)] flex flex-col justify-between space-y-4 pb-20 animate-in fade-in duration-300">
      {/* 1. Header Control Bar with Vibrant Gradient Accent */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl shadow-md shadow-indigo-500/25 ring-4 ring-indigo-50">
            🎡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Bộ Công Cụ Lớp Học Trực Quan
              </h1>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                Lớp {classInfo.name}
              </span>
              <span className="hidden sm:inline-flex bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                👥 {students.length} Học sinh
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Thao tác 1-Click mở nhanh công cụ giảng dạy & chiếu TV máy chiếu
            </p>
          </div>
        </div>

        {/* Center Clock & Quick Search */}
        <div className="flex items-center gap-2.5">
          {currentTime && (
            <div className="hidden md:flex items-center space-x-1.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-amber-400 px-3.5 py-1.5 rounded-2xl font-mono text-xs font-black shadow-xs border border-indigo-900/50">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{currentTime}</span>
            </div>
          )}

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm công cụ (⌘K)..."
              className="pl-8.5 pr-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-36 sm:w-52 transition-all shadow-2xs"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setViewMode('LAUNCHPAD')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === 'LAUNCHPAD'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem tất cả dạng lưới (Grid Mode)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Lưới</span>
            </button>
            <button
              onClick={() => setViewMode('DESKTOP')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === 'DESKTOP'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Bàn làm việc thu gọn (Desktop Mode)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Bàn làm việc</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Stage Content */}
      {viewMode === 'LAUNCHPAD' ? (
        /* VIBRANT GRID VIEW (DEFAULT) */
        <div className="space-y-4">
          {/* Category Filters with Vibrant Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {(
              [
                { id: 'ALL', label: '🌟 Tất Cả (13)', activeClass: 'from-blue-600 to-indigo-600 text-white shadow-blue-500/25' },
                { id: 'GAMES', label: '🎮 Game Học Tập (Mới)', activeClass: 'from-amber-500 to-orange-600 text-slate-950 shadow-amber-500/25 font-black' },
                { id: 'INTERACTION', label: '🎲 Tương Tác & Gọi Tên (4)', activeClass: 'from-indigo-600 to-blue-600 text-white shadow-indigo-500/25' },
                { id: 'MANAGEMENT', label: '⏱️ Quản Lý Tiết Dạy (4)', activeClass: 'from-emerald-600 to-teal-600 text-white shadow-emerald-500/25' },
                { id: 'ENERGY', label: '🏆 Nề Nếp & Cảm Xúc (4)', activeClass: 'from-purple-600 to-pink-600 text-white shadow-purple-500/25' },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-2xl font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                  category === c.id
                    ? `bg-gradient-to-r ${c.activeClass} shadow-md`
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* 12 Colorful Rich Tool Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={tool.onClick}
                className={`group bg-gradient-to-br ${tool.cardBg} rounded-3xl p-5 border-2 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-1`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${tool.gradient} text-white flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform ring-4 ring-white/90`}
                    >
                      {tool.iconEmoji}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${tool.tagColor}`}>
                        {tool.tag}
                      </span>
                      <kbd className="bg-white border border-slate-300 text-slate-600 text-[10px] font-mono font-black px-2 py-0.5 rounded-lg shadow-2xs">
                        {tool.keyNumber}
                      </kbd>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">{tool.desc}</p>
                  </div>
                </div>

                <div
                  className={`pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs ${tool.actionColor} group-hover:translate-x-1 transition-transform`}
                >
                  <span>{tool.actionText}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SINGLE-PAGE COMPACT DESKTOP WORKSPACE */
        <div className="space-y-4">
          {/* Quick Trigger Strip */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-xl shrink-0 ring-2 ring-amber-400/30">
                ✨
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm text-white truncate">
                  Sẵn sàng cho tiết dạy sôi nổi cùng Lớp {classInfo.name}!
                </h3>
                <p className="text-[11px] text-slate-300 truncate">
                  Bấm phím tắt số <strong>[1-9]</strong> hoặc nhấp biểu tượng ở thanh Dock bên dưới để bật ngay công cụ.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={() => setIsWheelOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>🎡 Gọi Tên</span>
                <kbd className="bg-blue-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">1</kbd>
              </button>
              <button
                onClick={() => setIsTimerOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>⏱️ Hẹn Giờ</span>
                <kbd className="bg-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">2</kbd>
              </button>
              <button
                onClick={() => setIsNoiseOpen(true)}
                className="bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>🔊 Đo Ồn</span>
                <kbd className="bg-teal-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">3</kbd>
              </button>
              <button
                onClick={() => setIsTeamQuizOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>🏎️ Game Đua Xe</span>
                <kbd className="bg-amber-600/60 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-mono font-black">G</kbd>
              </button>
            </div>
          </div>

          {/* Featured Game Arena Banner in Desktop Mode */}
          <div
            onClick={() => setIsTeamQuizOpen(true)}
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-4 sm:p-5 text-slate-950 shadow-md cursor-pointer hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-400"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
                🏎️
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="bg-white/30 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Game Học Tập Tương Tác
                  </span>
                  <kbd className="bg-slate-950/20 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded font-mono">
                    Phím G
                  </kbd>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Đấu Trí Đua Xe Về Đích (2 – 8 Đội Thi Đấu Smart TV)
                </h3>
                <p className="text-xs text-slate-900 font-medium">
                  Thi đấu trắc nghiệm Toán, Tiếng Việt, Tiếng Anh có tính giờ, âm thanh sống động và thưởng Sao tự động.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-slate-950 text-amber-300 font-black text-xs shadow-md shrink-0 hover:bg-slate-900 transition-colors"
            >
              <span>Vào Game Ngay →</span>
            </button>
          </div>

          {/* 3 Categories Smart Action Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Category 1: Tương Tác & Gọi Tên */}
            <div className="bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 rounded-3xl p-4 border border-blue-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🎲</span>
                  <h3 className="font-black text-sm text-slate-800">Tương Tác & Gọi Tên</h3>
                </div>
                <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  4 Công cụ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {TOOLS.filter((t) => t.category === 'INTERACTION').map((t) => (
                  <button
                    key={t.id}
                    onClick={t.onClick}
                    className="p-3 rounded-2xl border border-blue-100 hover:border-blue-300 bg-white hover:bg-blue-50/60 text-left transition-all group cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{t.iconEmoji}</span>
                      <kbd className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-2xs">
                        {t.keyNumber}
                      </kbd>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-blue-700 leading-tight">
                        {t.shortTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{t.tag}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category 2: Quản Lý Tiết Dạy */}
            <div className="bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 rounded-3xl p-4 border border-emerald-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">⏱️</span>
                  <h3 className="font-black text-sm text-slate-800">Quản Lý Tiết Dạy</h3>
                </div>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  4 Công cụ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {TOOLS.filter((t) => t.category === 'MANAGEMENT').map((t) => (
                  <button
                    key={t.id}
                    onClick={t.onClick}
                    className="p-3 rounded-2xl border border-emerald-100 hover:border-emerald-300 bg-white hover:bg-emerald-50/60 text-left transition-all group cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{t.iconEmoji}</span>
                      <kbd className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-2xs">
                        {t.keyNumber}
                      </kbd>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 leading-tight">
                        {t.shortTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{t.tag}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category 3: Nề Nếp & Cảm Xúc */}
            <div className="bg-gradient-to-br from-purple-50/60 via-white to-pink-50/40 rounded-3xl p-4 border border-purple-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏆</span>
                  <h3 className="font-black text-sm text-slate-800">Nề Nếp & Cảm Xúc</h3>
                </div>
                <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  4 Công cụ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {TOOLS.filter((t) => t.category === 'ENERGY').map((t) => (
                  <button
                    key={t.id}
                    onClick={t.onClick}
                    className="p-3 rounded-2xl border border-purple-100 hover:border-purple-300 bg-white hover:bg-purple-50/60 text-left transition-all group cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{t.iconEmoji}</span>
                      <kbd className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-2xs">
                        {t.keyNumber}
                      </kbd>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-purple-700 leading-tight">
                        {t.shortTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{t.tag}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating Interactive macOS / iPadOS Dock at Bottom */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] sm:max-w-max">
        <div className="backdrop-blur-2xl bg-slate-900/90 text-white border border-white/25 shadow-2xl p-2 sm:p-2.5 rounded-3xl flex items-center gap-1.5 sm:gap-2.5 ring-1 ring-black/10">
          {TOOLS.map((t) => (
            <div key={t.id} className="relative group">
              <button
                onClick={t.onClick}
                onMouseEnter={() => setHoveredToolId(t.id)}
                onMouseLeave={() => setHoveredToolId(null)}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xl sm:text-2xl transition-all duration-200 cursor-pointer ${
                  t.isOpen
                    ? 'bg-blue-600 scale-110 shadow-lg shadow-blue-500/50 ring-2 ring-white/60'
                    : 'bg-white/10 hover:bg-white/25 hover:scale-115 hover:-translate-y-1'
                }`}
              >
                {t.iconEmoji}
              </button>

              {/* Active Dot indicator */}
              {t.isOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-xs"></span>
              )}

              {/* Tooltip on Hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:-translate-y-1 bg-slate-950/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xl border border-white/15 whitespace-nowrap flex items-center space-x-1.5 z-50">
                <span>{t.shortTitle}</span>
                <kbd className="bg-white/20 text-slate-200 text-[9px] px-1 py-0.2 rounded font-mono font-bold">
                  {t.keyNumber}
                </kbd>
              </div>
            </div>
          ))}

          <div className="w-[1px] h-6 bg-white/20 mx-1"></div>

          {/* Launchpad Toggle Button */}
          <div className="relative group">
            <button
              onClick={() => setViewMode((prev) => (prev === 'LAUNCHPAD' ? 'DESKTOP' : 'LAUNCHPAD'))}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-lg sm:text-xl transition-all duration-200 cursor-pointer ${
                viewMode === 'LAUNCHPAD'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 scale-110 shadow-lg shadow-purple-500/50'
                  : 'bg-white/10 hover:bg-white/25 hover:scale-115 hover:-translate-y-1'
              }`}
            >
              <LayoutGrid className="w-5 h-5 text-purple-200" />
            </button>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:-translate-y-1 bg-slate-950/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xl border border-white/15 whitespace-nowrap flex items-center space-x-1 z-50">
              <span>{viewMode === 'LAUNCHPAD' ? 'Bàn làm việc' : 'Dạng lưới (Grid)'}</span>
              <kbd className="bg-white/20 text-slate-200 text-[9px] px-1 py-0.2 rounded font-mono">⌘K</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Full Suite of Modals */}
      <LuckyWheelModal isOpen={isWheelOpen} onClose={() => setIsWheelOpen(false)} students={students} />

      <ClassroomTimerModal isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} className={classInfo.name} />

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

      <NoiseMeterModal isOpen={isNoiseOpen} onClose={() => setIsNoiseOpen(false)} students={students} className={classInfo.name} />

      <TrafficLightModal isOpen={isTrafficOpen} onClose={() => setIsTrafficOpen(false)} className={classInfo.name} />

      <SoundboardModal isOpen={isSoundboardOpen} onClose={() => setIsSoundboardOpen(false)} className={classInfo.name} />

      <MysteryChestModal isOpen={isChestOpen} onClose={() => setIsChestOpen(false)} students={students} className={classInfo.name} />

      <SmartPairMatcherModal isOpen={isPairOpen} onClose={() => setIsPairOpen(false)} students={students} className={classInfo.name} />

      <DailyMoodModal isOpen={isMoodOpen} onClose={() => setIsMoodOpen(false)} students={students} className={classInfo.name} />

      <BrainBreakModal isOpen={isBrainBreakOpen} onClose={() => setIsBrainBreakOpen(false)} className={classInfo.name} />

      <TaskCanvasModal isOpen={isTaskCanvasOpen} onClose={() => setIsTaskCanvasOpen(false)} students={students} className={classInfo.name} />

      <TeamQuizBattleModal
        isOpen={isTeamQuizOpen}
        onClose={() => setIsTeamQuizOpen(false)}
        students={students}
        className={classInfo.name}
      />
    </div>
  );
}
