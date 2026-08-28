'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Award,
  Sparkles,
  Plus,
  Minus,
  Star,
  Users,
  Flame,
  History,
  CheckCircle,
  Trophy,
  MessageSquare,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Heart,
  BookOpen,
  CheckCircle2,
  Trash2,
  Eye,
  Smile,
  Zap,
  ShoppingBag,
  Package,
  Check,
  X,
  Edit,
  RotateCcw,
  Gift,
  Share2,
  ExternalLink,
  Crown,
  Medal,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  List,
  QrCode,
  Copy,
  Mic,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  Student,
  StarLog,
  StarCriterion,
  RewardProduct,
  RewardRedemption,
  StarCriterionCategory,
  RewardProductCategory,
} from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getLocalDateString } from '@/lib/tt27-engine';

const COMMENT_SUGGESTIONS = [
  'Hôm nay em rất hăng hái phát biểu và tiếp thu bài nhanh.',
  'Em có ý thức giữ gìn vệ sinh chung và tích cực trực nhật lớp.',
  'Chữ viết sạch đẹp, trình bày bài cẩn thận, đáng khen ngợi!',
  'Em rất nhiệt tình giúp đỡ bạn bè cùng tiến bộ trong giờ học.',
  'Cần tập trung chú ý nghe giảng hơn trong các tiết buổi chiều.',
  'Đã có nhiều tiến bộ rõ rệt trong các bài toán tính toán nhanh.',
  'Cần chuẩn bị đầy đủ đồ dùng học tập (thước kẻ, compa) trước khi vào lớp.',
];

const PRESET_SAMPLE_IMAGES = [
  { name: 'Bút máy', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80' },
  { name: 'Hộp bút', url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=500&auto=format&fit=crop&q=80' },
  { name: 'Thước kẻ', url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=500&auto=format&fit=crop&q=80' },
  { name: 'Tẩy gôm', url: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=500&auto=format&fit=crop&q=80' },
  { name: 'Bút dạ quang', url: 'https://images.unsplash.com/photo-1585336261026-7f5ed6d1e49b?w=500&auto=format&fit=crop&q=80' },
  { name: 'Sổ tay mini', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80' },
  { name: 'Sticker 3D', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80' },
  { name: 'Huy hiệu', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80' },
  { name: 'Gọt bút chì', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop&q=80' },
  { name: 'Vở ô ly', url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=80' },
];

const ALL_TEAMS_PRESET = [
  { id: 1, name: 'Tổ 1', mascot: '🦁', mascotName: 'Sư Tử', gradient: 'from-amber-500 to-orange-500', bgCard: 'from-amber-500/10 to-orange-500/5 border-amber-200 text-amber-900' },
  { id: 2, name: 'Tổ 2', mascot: '🦅', mascotName: 'Đại Bàng', gradient: 'from-blue-500 to-indigo-500', bgCard: 'from-blue-500/10 to-indigo-500/5 border-blue-200 text-blue-900' },
  { id: 3, name: 'Tổ 3', mascot: '🐬', mascotName: 'Cá Heo', gradient: 'from-teal-500 to-emerald-500', bgCard: 'from-teal-500/10 to-emerald-500/5 border-teal-200 text-teal-900' },
  { id: 4, name: 'Tổ 4', mascot: '🐼', mascotName: 'Gấu Trúc', gradient: 'from-purple-500 to-pink-500', bgCard: 'from-purple-500/10 to-pink-500/5 border-purple-200 text-purple-900' },
  { id: 5, name: 'Tổ 5', mascot: '🐯', mascotName: 'Hổ Con', gradient: 'from-rose-500 to-red-600', bgCard: 'from-rose-500/10 to-red-500/5 border-rose-200 text-rose-900' },
  { id: 6, name: 'Tổ 6', mascot: '🦊', mascotName: 'Cáo Nâu', gradient: 'from-orange-500 to-amber-600', bgCard: 'from-orange-500/10 to-amber-500/5 border-orange-200 text-orange-900' },
  { id: 7, name: 'Tổ 7', mascot: '🦄', mascotName: 'Kỳ Lân', gradient: 'from-fuchsia-500 to-purple-600', bgCard: 'from-fuchsia-500/10 to-purple-500/5 border-fuchsia-200 text-fuchsia-900' },
  { id: 8, name: 'Tổ 8', mascot: '🐉', mascotName: 'Rồng Xanh', gradient: 'from-emerald-600 to-cyan-600', bgCard: 'from-emerald-600/10 to-cyan-500/5 border-emerald-200 text-emerald-900' },
];

export default function BehaviorPage() {
  const {
    students,
    starLogs,
    addStarLog,
    deleteStarLog,
    getStudentStars,
    getStudentMonthlyStars,
    resetMonthStars,
    starCriteria,
    addStarCriterion,
    updateStarCriterion,
    deleteStarCriterion,
    resetStarCriteriaToDefault,
    rewardProducts,
    addRewardProduct,
    updateRewardProduct,
    deleteRewardProduct,
    restockRewardProduct,
    rewardRedemptions,
    fulfillRewardRedemption,
    cancelRewardRedemption,
    classInfo,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'TABLE' | 'LEADERBOARD' | 'CRITERIA' | 'SHOP' | 'REDEMPTIONS' | 'HISTORY'>('TABLE');
  const [tableViewMode, setTableViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<'ALL' | number | 'HIGH_STAR' | 'NEED_HELP'>('ALL');

  // Flexible Number of Teams
  const numTeams = classInfo.numberOfTeams && classInfo.numberOfTeams >= 2 && classInfo.numberOfTeams <= 8
    ? classInfo.numberOfTeams
    : 4;

  const activeTeams = useMemo(() => {
    return ALL_TEAMS_PRESET.slice(0, numTeams);
  }, [numTeams]);

  // Month selector for Leaderboard (default: current month 'YYYY-MM')
  const currentMonthKey = getLocalDateString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [redemptionFilter, setRedemptionFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED' | 'CANCELLED'>('ALL');

  // Modal State for Custom Daily Assessment & Comment
  const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
  const [selectedStudentForAssess, setSelectedStudentForAssess] = useState<Student | null>(null);
  const [assessDate, setAssessDate] = useState(getLocalDateString());
  const [assessCategory, setAssessCategory] = useState<StarCriterionCategory>('Học tập');
  const [assessReason, setAssessReason] = useState('Phát biểu hăng hái xây dựng bài');
  const [assessPoints, setAssessPoints] = useState(1);
  const [assessComment, setAssessComment] = useState('');

  // Modal State for Student History Details
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  // Modal State for Adding/Editing Criteria
  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<StarCriterion | null>(null);
  const [criterionCategory, setCriterionCategory] = useState<StarCriterionCategory>('Học tập');
  const [criterionTitle, setCriterionTitle] = useState('');
  const [criterionPoints, setCriterionPoints] = useState(1);
  const [criterionIcon, setCriterionIcon] = useState('🌟');

  // Modal State for Adding/Editing Reward Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RewardProduct | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productCategory, setProductCategory] = useState<RewardProductCategory>('Bút viết');
  const [productStarPrice, setProductStarPrice] = useState(10);
  const [productStock, setProductStock] = useState(15);
  const [productImageUrl, setProductImageUrl] = useState(PRESET_SAMPLE_IMAGES[0].url);

  // Modal State for Restocking Product
  const [restockModalProduct, setRestockModalProduct] = useState<RewardProduct | null>(null);
  const [restockAddAmount, setRestockAddAmount] = useState(10);

  // Share Link Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Helper to determine student's team (1, 2, ... numTeams)
  const getStudentTeam = (st: Student, idx: number): number => {
    const tagTeam = (st.tags || []).find((t) => t.includes('Tổ '));
    if (tagTeam) {
      const match = tagTeam.match(/Tổ\s*(\d)/i);
      if (match && match[1]) return Number(match[1]);
    }
    return (idx % numTeams) + 1;
  };

  // Team Stats for the Race
  const teamStats = useMemo(() => {
    return activeTeams.map((t) => {
      const teamStudents = students.filter((st, idx) => getStudentTeam(st, idx) === t.id);
      const teamStars = teamStudents.reduce((acc, st) => {
        const balance = getStudentMonthlyStars(st.id, selectedMonth);
        return acc + balance.earned;
      }, 0);

      return {
        ...t,
        studentCount: teamStudents.length,
        totalStars: teamStars,
        students: teamStudents,
      };
    });
  }, [students, starLogs, selectedMonth, activeTeams, numTeams, getStudentMonthlyStars]);

  // Total Stars across whole class
  const totalClassStars = useMemo(() => {
    return starLogs.reduce((acc, log) => acc + log.points, 0);
  }, [starLogs]);

  // Pending Redemptions count
  const pendingRedemptionsCount = useMemo(() => {
    return rewardRedemptions.filter((r) => r.status === 'PENDING').length;
  }, [rewardRedemptions]);

  // Quick Award Handler
  const handleQuickAward = (student: Student, points: number, category: string, reason: string) => {
    addStarLog(student.id, points, category, reason, undefined, getLocalDateString());

    if (points > 0) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
      toast.success(`Đã cộng +${points} ⭐ cho em ${student.fullName}!`);
    } else {
      toast.info(`Đã trừ ${Math.abs(points)} sao của em ${student.fullName}`);
    }
  };

  // Award Whole Team
  const handleAwardTeam = (teamId: number, teamName: string) => {
    const teamStudents = students.filter((st, idx) => getStudentTeam(st, idx) === teamId);
    if (teamStudents.length === 0) return;

    const todayStr = getLocalDateString();
    teamStudents.forEach((s) => {
      addStarLog(s.id, 1, 'Thi đua tổ', `${teamName} hoàn thành tốt nhiệm vụ`, 'Cả tổ tích cực xây dựng bài', todayStr);
    });

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast.success(`Đã cộng +1 ⭐ cho tất cả ${teamStudents.length} học sinh ${teamName}! 🎉`);
  };

  // Award Whole Class
  const handleAwardWholeClass = () => {
    if (confirm('Bạn có muốn cộng +1 ⭐ nề nếp cho TẤT CẢ học sinh trong lớp không?')) {
      const todayStr = getLocalDateString();
      students.forEach((s) => {
        addStarLog(s.id, 1, 'Nề nếp', 'Cả lớp giữ nề nếp tốt', 'Tập thể gương mẫu, tích cực xây dựng bài', todayStr);
      });
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      toast.success('Đã thưởng +1 ⭐ cho cả lớp! 🎉');
    }
  };

  // Open Full Assessment Modal
  const handleOpenAssessModal = (student: Student) => {
    setSelectedStudentForAssess(student);
    setAssessDate(getLocalDateString());
    const defaultCriterion = starCriteria[0] || { category: 'Học tập' as const, title: 'Phát biểu hăng hái', points: 1 };
    setAssessCategory(defaultCriterion.category);
    setAssessReason(defaultCriterion.title);
    setAssessPoints(defaultCriterion.points);
    setAssessComment('');
    setIsAssessModalOpen(true);
  };

  // Save Custom Daily Assessment & Comment
  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAssess) return;

    addStarLog(
      selectedStudentForAssess.id,
      assessPoints,
      assessCategory,
      assessReason,
      assessComment,
      assessDate
    );

    if (assessPoints > 0) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
    toast.success(`Đã lưu nhận xét & đánh giá cho em ${selectedStudentForAssess.fullName}!`);
    setIsAssessModalOpen(false);
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    let list = students.map((st, idx) => {
      const teamId = getStudentTeam(st, idx);
      const totalStars = getStudentStars(st.id);
      const monthly = getStudentMonthlyStars(st.id, selectedMonth);
      return {
        ...st,
        teamId,
        totalStars,
        monthlyEarned: monthly.earned,
        monthlyAvailable: monthly.available,
      };
    });

    if (typeof selectedTeamFilter === 'number') {
      list = list.filter((s) => s.teamId === selectedTeamFilter);
    } else if (selectedTeamFilter === 'HIGH_STAR') {
      list.sort((a, b) => b.totalStars - a.totalStars);
    } else if (selectedTeamFilter === 'NEED_HELP') {
      list.sort((a, b) => a.totalStars - b.totalStars);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          (s.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [students, selectedTeamFilter, searchQuery, selectedMonth, getStudentStars, getStudentMonthlyStars]);

  // Leaderboard ranking calculation for selected month
  const leaderboard = useMemo(() => {
    const scoredList = students.map((st, idx) => {
      const balance = getStudentMonthlyStars(st.id, selectedMonth);
      const allTimeStars = getStudentStars(st.id);
      const teamId = getStudentTeam(st, idx);
      return {
        student: st,
        teamId,
        monthlyEarned: balance.earned,
        monthlySpent: balance.spent,
        monthlyAvailable: balance.available,
        allTimeStars,
      };
    });

    scoredList.sort((a, b) => {
      if (b.monthlyEarned !== a.monthlyEarned) {
        return b.monthlyEarned - a.monthlyEarned;
      }
      if (b.allTimeStars !== a.allTimeStars) {
        return b.allTimeStars - a.allTimeStars;
      }
      return a.student.fullName.localeCompare(b.student.fullName);
    });

    return scoredList.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [students, selectedMonth, starLogs, rewardRedemptions, getStudentMonthlyStars, getStudentStars]);

  // Criteria Handlers
  const handleOpenAddCriterion = () => {
    setEditingCriterion(null);
    setCriterionCategory('Học tập');
    setCriterionTitle('');
    setCriterionPoints(1);
    setCriterionIcon('🌟');
    setIsCriterionModalOpen(true);
  };

  const handleOpenEditCriterion = (criterion: StarCriterion) => {
    setEditingCriterion(criterion);
    setCriterionCategory(criterion.category);
    setCriterionTitle(criterion.title);
    setCriterionPoints(criterion.points);
    setCriterionIcon(criterion.icon || '🌟');
    setIsCriterionModalOpen(true);
  };

  const handleSaveCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!criterionTitle.trim()) {
      toast.error('Vui lòng nhập tên tiêu chí!');
      return;
    }

    if (editingCriterion) {
      updateStarCriterion({
        ...editingCriterion,
        category: criterionCategory,
        title: criterionTitle.trim(),
        points: criterionPoints,
        icon: criterionIcon || '🌟',
      });
    } else {
      addStarCriterion({
        category: criterionCategory,
        title: criterionTitle.trim(),
        points: criterionPoints,
        icon: criterionIcon || '🌟',
      });
    }

    setIsCriterionModalOpen(false);
  };

  // Product Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductName('');
    setProductDescription('');
    setProductCategory('Bút viết');
    setProductStarPrice(10);
    setProductStock(15);
    setProductImageUrl(PRESET_SAMPLE_IMAGES[0].url);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: RewardProduct) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductDescription(prod.description);
    setProductCategory(prod.category);
    setProductStarPrice(prod.starPrice);
    setProductStock(prod.stock);
    setProductImageUrl(prod.imageUrl);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast.error('Vui lòng nhập tên món quà!');
      return;
    }

    if (editingProduct) {
      updateRewardProduct({
        ...editingProduct,
        name: productName.trim(),
        description: productDescription.trim(),
        category: productCategory,
        starPrice: Number(productStarPrice),
        stock: Number(productStock),
        imageUrl: productImageUrl,
        isAvailable: Number(productStock) > 0,
      });
    } else {
      addRewardProduct({
        name: productName.trim(),
        description: productDescription.trim(),
        category: productCategory,
        starPrice: Number(productStarPrice),
        stock: Number(productStock),
        imageUrl: productImageUrl,
        isAvailable: Number(productStock) > 0,
      });
    }

    setIsProductModalOpen(false);
  };

  // Export Excel Sổ Nề Nếp
  const handleExportExcel = () => {
    try {
      const data = filteredStudents.map((st, idx) => {
        const stLogs = starLogs.filter((l) => l.studentId === st.id);
        const lastLog = stLogs[0];
        return {
          'STT': idx + 1,
          'Mã HS': st.studentCode,
          'Họ và Tên': st.fullName,
          'Tổ': `Tổ ${st.teamId}`,
          'Tổng Sao Tích Lũy': st.totalStars,
          'Sao Tháng Này': st.monthlyEarned,
          'Sao Khả Dụng': st.monthlyAvailable,
          'Nội Dung Gần Nhất': lastLog?.reason || 'Chưa có',
          'Lời Nhận Xét / Dặn Dò': lastLog?.comment || '',
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SoNeNep');
      XLSX.writeFile(wb, `So_Ne_Nep_Thi_Dua_${classInfo.name}_${selectedMonth}.xlsx`);
      toast.success('Đã xuất file Excel Sổ nề nếp thành công!');
    } catch (e) {
      toast.error('Lỗi khi xuất file Excel!');
    }
  };

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-300">
      {/* 1. Header Bar with Quick Action Buttons */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center text-2xl shadow-md shadow-amber-500/25 ring-4 ring-amber-50">
            ⭐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Sổ Nề Nếp & Đua Sao Thi Đua
              </h1>
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                Lớp {classInfo.name}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Quản lý thi đua nề nếp, khen thưởng tức thì và quy đổi quà tặng cho học sinh
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAwardWholeClass}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thưởng Cả Lớp (+1⭐)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-2xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-2 rounded-2xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Link Đổi Quà</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Dynamic Team Race Scoreboard & Top Metrics */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(4, numTeams)}, minmax(0, 1fr))`,
        }}
      >
        {teamStats.map((team) => (
          <div
            key={team.id}
            className={`p-3.5 rounded-3xl border bg-gradient-to-br ${team.bgCard} shadow-xs flex flex-col justify-between space-y-2.5 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{team.mascot}</span>
                <div>
                  <h4 className="font-black text-xs sm:text-sm">{team.name} ({team.mascotName})</h4>
                  <p className="text-[10px] text-slate-500">{team.studentCount} Học sinh</p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-base sm:text-lg">{team.totalStars} ⭐</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-medium">Tháng {selectedMonth}</span>
              <button
                onClick={() => handleAwardTeam(team.id, team.name)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                title={`Cộng +1 sao cho cả ${team.name}`}
              >
                <span>+1⭐ Cả Tổ</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'TABLE', label: 'Bảng Đánh Giá & Nhận Xét', icon: FileSpreadsheet },
          { id: 'LEADERBOARD', label: 'Đua Top Tích Sao', icon: Trophy, badge: `Tháng ${selectedMonth.split('-')[1]}` },
          { id: 'CRITERIA', label: `Tiêu Chí Sao (${starCriteria.length})`, icon: Star },
          { id: 'SHOP', label: `Shop Đồ Dùng (${rewardProducts.length})`, icon: ShoppingBag },
          {
            id: 'REDEMPTIONS',
            label: `Duyệt Đổi Quà (${rewardRedemptions.length})`,
            icon: Gift,
            badge: pendingRedemptionsCount > 0 ? `${pendingRedemptionsCount} Chờ` : undefined,
            badgeColor: 'bg-rose-500 text-white',
          },
          { id: 'HISTORY', label: `Nhật Ký (${starLogs.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-9 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                    tab.badgeColor || (isActive ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900')
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BẢNG ĐÁNH GIÁ & NHẬN XÉT HÀNG NGÀY */}
      {activeTab === 'TABLE' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          {/* Controls Bar with Team Filter Pills & View Mode */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Dynamic Team Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedTeamFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  selectedTeamFilter === 'ALL'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🌟 Tất Cả ({students.length})
              </button>

              {activeTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamFilter(team.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                    selectedTeamFilter === team.id
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {team.mascot} {team.name}
                </button>
              ))}

              <button
                onClick={() => setSelectedTeamFilter('HIGH_STAR')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  selectedTeamFilter === 'HIGH_STAR'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⭐ Nhiều Sao Nhất
              </button>

              <button
                onClick={() => setSelectedTeamFilter('NEED_HELP')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  selectedTeamFilter === 'NEED_HELP'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🌱 Cần Rèn Luyện
              </button>
            </div>

            {/* View Mode & Search */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTableViewMode('TABLE')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    tableViewMode === 'TABLE' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dạng Bảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTableViewMode('CARDS')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    tableViewMode === 'CARDS' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dạng Thẻ</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm học sinh..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden w-36 sm:w-48"
                />
              </div>
            </div>
          </div>

          {/* VIEW MODE: DETAILED COMPACT TABLE */}
          {tableViewMode === 'TABLE' ? (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-3 w-52">Học Sinh</th>
                    <th className="py-3 px-3 text-center w-24">Tổ</th>
                    <th className="py-3 px-3 text-center w-28">Tổng Sao ⭐</th>
                    <th className="py-3 px-3 w-56">Đánh Giá Gần Nhất</th>
                    <th className="py-3 px-3">Lời Nhận Xét / Dặn Dò</th>
                    <th className="py-3 px-3 text-right w-44">Tặng Sao & Nhận Xét</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st, idx) => {
                    const studentLogs = starLogs.filter((l) => l.studentId === st.id);
                    const latestLog = studentLogs[0];

                    return (
                      <tr key={st.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{st.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{st.studentCode} • {st.gender}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-slate-100 text-slate-700 font-black text-[10px] px-2 py-0.5 rounded-md border border-slate-200">
                            Tổ {st.teamId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-900 font-black px-2.5 py-0.5 rounded-full border border-amber-200 text-xs shadow-2xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{st.totalStars}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {latestLog ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                    latestLog.points > 0
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : latestLog.points < 0
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {latestLog.points > 0 ? `+${latestLog.points}⭐` : `${latestLog.points}⭐`}
                                </span>
                                <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[160px]">{latestLog.reason}</span>
                              </div>
                              <p className="text-[10px] text-slate-400">
                                {new Date(latestLog.date || latestLog.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa có đánh giá</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {latestLog?.comment ? (
                            <p className="text-[11px] text-slate-700 italic line-clamp-2">
                              &ldquo;{latestLog.comment}&rdquo;
                            </p>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Chưa có lời dặn</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleQuickAward(st, 1, 'Học tập', 'Phát biểu hăng hái')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 cursor-pointer"
                              title="Cộng 1 sao"
                            >
                              +1⭐
                            </button>
                            <button
                              onClick={() => handleOpenAssessModal(st)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer"
                              title="Ghi nhận xét chi tiết"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setHistoryStudent(st)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Xem nhật ký sao"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW MODE: RESPONSIVE CARDS GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStudents.map((st) => {
                const studentLogs = starLogs.filter((l) => l.studentId === st.id);
                const latestLog = studentLogs[0];

                return (
                  <div
                    key={st.id}
                    className="p-4 rounded-3xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {st.fullName.split(' ').pop()?.substring(0, 2) || 'HS'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{st.fullName}</h4>
                              <span className="bg-slate-200 text-slate-700 text-[9px] font-black px-1.5 py-0.2 rounded">
                                Tổ {st.teamId}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">{st.studentCode} • {st.gender}</p>
                          </div>
                        </div>

                        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-900 font-black px-2.5 py-1 rounded-full border border-amber-200 text-xs shadow-2xs shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{st.totalStars}</span>
                        </span>
                      </div>

                      {latestLog ? (
                        <div className="bg-white p-2.5 rounded-2xl border border-slate-100 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                latestLog.points > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : latestLog.points < 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {latestLog.points > 0 ? `+${latestLog.points}⭐` : `${latestLog.points}⭐`}
                            </span>
                            <span className="font-semibold text-slate-800 text-[11px] truncate">{latestLog.reason}</span>
                          </div>
                          {latestLog.comment && (
                            <p className="text-[11px] text-slate-600 italic line-clamp-2">
                              &ldquo;{latestLog.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Chưa có đánh giá</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAward(st, 1, 'Học tập', 'Phát biểu hăng hái')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs rounded-xl border border-emerald-200 cursor-pointer"
                        >
                          +1⭐
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAward(st, 2, 'Học tập', 'Làm bài xuất sắc')}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs rounded-xl border border-blue-200 cursor-pointer"
                        >
                          +2⭐
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenAssessModal(st)}
                          className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Nhận xét</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryStudent(st)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                          title="Lịch sử"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ĐUA TOP TÍCH SAO & VINH DANH (LEADERBOARD THEO THÁNG) */}
      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">Bảng Vinh Danh Thi Đua Tích Sao</h3>
                <p className="text-[11px] text-slate-500">Xếp hạng theo tổng số sao kiếm được trong tháng của học sinh Lớp {classInfo.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Tháng:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => resetMonthStars(selectedMonth)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                title="Reset điểm tháng này về 0 để bắt đầu đợt mới"
              >
                Reset Tháng
              </button>
            </div>
          </div>

          {/* PODIUM TOP 1, TOP 2, TOP 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 pt-2">
            {/* TOP 2 (BẠC) */}
            <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100 to-white rounded-3xl p-5 border-2 border-slate-300 shadow-md text-center space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 left-3 bg-slate-200 text-slate-700 font-black text-xs px-2.5 py-0.5 rounded-full">
                🥈 HẠNG 2
              </div>
              <div className="pt-4 space-y-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 border-4 border-slate-300 text-slate-700 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                  {leaderboard[1]?.student.fullName.split(' ').pop()?.substring(0, 2) || '2'}
                </div>
                <h4 className="font-black text-sm sm:text-base text-slate-900 truncate">
                  {leaderboard[1]?.student.fullName || 'Đang cập nhật'}
                </h4>
                <p className="text-xs text-slate-500 font-mono">Tổ {leaderboard[1]?.teamId} • {leaderboard[1]?.student.studentCode || ''}</p>
              </div>

              <div className="bg-slate-200/70 p-3 rounded-2xl space-y-1">
                <span className="text-2xl font-black text-slate-800">+{leaderboard[1]?.monthlyEarned || 0} ⭐</span>
                <p className="text-[11px] text-slate-600 font-medium">Khả dụng: {leaderboard[1]?.monthlyAvailable || 0} sao</p>
              </div>
            </div>

            {/* TOP 1 (VÀNG - QUÁN QUÂN) */}
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-100 via-yellow-50 to-white rounded-3xl p-6 border-2 border-amber-400 shadow-xl text-center space-y-3 relative overflow-hidden flex flex-col justify-between transform md:-translate-y-2">
              <div className="absolute top-3 left-3 bg-amber-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-white" />
                <span>🥇 QUÁN QUÂN</span>
              </div>
              <div className="pt-5 space-y-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-4 border-amber-400 text-amber-900 font-black text-2xl flex items-center justify-center mx-auto shadow-lg ring-4 ring-amber-200/50">
                  {leaderboard[0]?.student.fullName.split(' ').pop()?.substring(0, 2) || '1'}
                </div>
                <h4 className="font-black text-base sm:text-lg text-slate-900 truncate">
                  {leaderboard[0]?.student.fullName || 'Đang cập nhật'}
                </h4>
                <p className="text-xs text-slate-600 font-mono font-bold">Tổ {leaderboard[0]?.teamId} • {leaderboard[0]?.student.studentCode || ''}</p>
              </div>

              <div className="bg-amber-200/80 p-3.5 rounded-2xl space-y-1 border border-amber-300">
                <span className="text-3xl font-black text-amber-950">+{leaderboard[0]?.monthlyEarned || 0} ⭐</span>
                <p className="text-xs text-amber-900 font-semibold">Khả dụng: {leaderboard[0]?.monthlyAvailable || 0} sao</p>
              </div>
            </div>

            {/* TOP 3 (ĐỒNG) */}
            <div className="order-3 md:order-3 bg-gradient-to-b from-amber-50 to-white rounded-3xl p-5 border-2 border-amber-600/40 shadow-md text-center space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 left-3 bg-amber-700/80 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                🥉 HẠNG 3
              </div>
              <div className="pt-4 space-y-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 border-4 border-amber-600/50 text-white font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                  {leaderboard[2]?.student.fullName.split(' ').pop()?.substring(0, 2) || '3'}
                </div>
                <h4 className="font-black text-sm sm:text-base text-slate-900 truncate">
                  {leaderboard[2]?.student.fullName || 'Đang cập nhật'}
                </h4>
                <p className="text-xs text-slate-500 font-mono">Tổ {leaderboard[2]?.teamId} • {leaderboard[2]?.student.studentCode || ''}</p>
              </div>

              <div className="bg-amber-100/70 p-3 rounded-2xl space-y-1">
                <span className="text-2xl font-black text-amber-900">+{leaderboard[2]?.monthlyEarned || 0} ⭐</span>
                <p className="text-[11px] text-amber-800 font-medium">Khả dụng: {leaderboard[2]?.monthlyAvailable || 0} sao</p>
              </div>
            </div>
          </div>

          {/* FULL RANKING TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Bảng Xếp Hạng Đầy Đủ Lớp {classInfo.name} ({leaderboard.length} Học Sinh)</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 sm:px-4 w-16 text-center">Hạng</th>
                    <th className="py-3 px-3 sm:px-4 w-52">Học Sinh</th>
                    <th className="py-3 px-3 sm:px-4 text-center">Tổ</th>
                    <th className="py-3 px-3 sm:px-4 text-center">Sao Tháng Này</th>
                    <th className="py-3 px-3 sm:px-4 text-center">Đã Đổi Quà</th>
                    <th className="py-3 px-3 sm:px-4 text-center">Sao Khả Dụng</th>
                    <th className="py-3 px-3 sm:px-4 text-center">Tổng Toàn Khóa</th>
                    <th className="py-3 px-3 sm:px-4 text-right">Tặng Sao Nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((item) => (
                    <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-black text-xs ${
                            item.rank === 1
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : item.rank === 2
                              ? 'bg-slate-300 text-slate-800'
                              : item.rank === 3
                              ? 'bg-amber-700 text-white'
                              : item.rank <= 10
                              ? 'bg-blue-100 text-blue-800 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.rank}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-bold text-slate-900 text-xs">{item.student.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.student.studentCode}</div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className="bg-slate-100 text-slate-700 font-black text-[10px] px-2 py-0.5 rounded-md">
                          Tổ {item.teamId}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center font-black text-amber-600 text-sm">
                        +{item.monthlyEarned} ⭐
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center text-slate-500 font-semibold">
                        {item.monthlySpent > 0 ? `-${item.monthlySpent} ⭐` : '0'}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-800 font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {item.monthlyAvailable} ⭐
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-700">
                        {item.allTimeStars} ⭐
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right space-x-1">
                        <button
                          onClick={() => handleQuickAward(item.student, 1, 'Học tập', 'Phát biểu hăng hái')}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 cursor-pointer"
                        >
                          +1⭐
                        </button>
                        <button
                          onClick={() => handleQuickAward(item.student, 2, 'Học tập', 'Làm bài xuất sắc')}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 cursor-pointer"
                        >
                          +2⭐
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TIÊU CHÍ TÍCH SAO & THANG ĐIỂM */}
      {activeTab === 'CRITERIA' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 shrink-0" />
                <span>Danh Mục Tiêu Chí & Thang Điểm Quy Đổi Sao ({starCriteria.length} Tiêu Chí)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Giáo viên có thể tùy chỉnh thêm, sửa, xóa tiêu chí chuẩn Thông tư 27.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={resetStarCriteriaToDefault}
                className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi Phục Chuẩn TT27</span>
              </button>

              <button
                onClick={handleOpenAddCriterion}
                className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Tiêu Chí Mới</span>
              </button>
            </div>
          </div>

          {/* Criteria Grid Grouped by Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {starCriteria.map((crit) => (
              <div
                key={crit.id}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-amber-300 transition-all flex items-start justify-between gap-2.5"
              >
                <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                  <span className="text-2xl shrink-0">{crit.icon}</span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                        crit.category === 'Học tập'
                          ? 'bg-blue-100 text-blue-800'
                          : crit.category === 'Nề nếp'
                          ? 'bg-amber-100 text-amber-800'
                          : crit.category === 'Phẩm chất'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {crit.category}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-1 break-words">{crit.title}</h4>
                    <p className="text-[11px] font-black text-amber-600 mt-0.5">
                      {crit.points > 0 ? `+${crit.points} ⭐` : `${crit.points} ⭐`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditCriterion(crit)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Chỉnh sửa tiêu chí"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa tiêu chí "${crit.title}"?`)) {
                        deleteStarCriterion(crit.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Xóa tiêu chí"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SHOP ĐỒ DÙNG HỌC TẬP & QUẢN LÝ KHO */}
      {activeTab === 'SHOP' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Shop Đồ Dùng Học Tập & Quản Lý Tồn Kho ({rewardProducts.length} Sản Phẩm)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các món quà phù hợp học sinh tiểu học. Giáo viên có thể điều chỉnh giá sao và cập nhật tồn kho.
              </p>
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Đồ Dùng Mới</span>
            </button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {rewardProducts.map((prod) => (
              <div
                key={prod.id}
                className="rounded-3xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {prod.category}
                    </div>

                    <div
                      className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                        prod.stock > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {prod.stock > 0 ? `Còn ${prod.stock}` : 'Hết hàng'}
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2" title={prod.name}>
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-amber-600 font-black text-sm">{prod.starPrice} ⭐</span>
                      <span className="text-[11px] text-slate-400 font-medium">Kho: {prod.stock} cái</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      setRestockModalProduct(prod);
                      setRestockAddAmount(10);
                    }}
                    className="py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    + Nhập
                  </button>
                  <button
                    onClick={() => handleOpenEditProduct(prod)}
                    className="py-1.5 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa món quà "${prod.name}" khỏi Shop?`)) {
                        deleteRewardProduct(prod.id);
                      }
                    }}
                    className="py-1.5 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DUYỆT ĐỔI QUÀ & TRẢ THƯỞNG */}
      {activeTab === 'REDEMPTIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600 shrink-0" />
                <span>Danh Sách Đơn Đổi Quà Của Học Sinh ({rewardRedemptions.length} Đơn)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi các món quà học sinh đã submit đổi, click nút &ldquo;Đã Trả Quà&rdquo; khi trao thưởng cho học sinh.
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'PENDING', 'DELIVERED', 'CANCELLED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRedemptionFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    redemptionFilter === f
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f === 'ALL'
                    ? 'Tất Cả'
                    : f === 'PENDING'
                    ? `Chưa Trả (${pendingRedemptionsCount})`
                    : f === 'DELIVERED'
                    ? 'Đã Trả'
                    : 'Đã Hủy'}
                </button>
              ))}
            </div>
          </div>

          {/* Redemptions List */}
          <div className="space-y-3">
            {rewardRedemptions.filter((r) => redemptionFilter === 'ALL' || r.status === redemptionFilter).length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Gift className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs">Chưa có yêu cầu đổi quà nào trong danh mục này.</p>
              </div>
            ) : (
              rewardRedemptions
                .filter((r) => redemptionFilter === 'ALL' || r.status === redemptionFilter)
                .map((rd) => {
                  const firstItem = rd.items && rd.items[0];
                  const itemTitle = (rd.items || []).map((i) => `${i.productName}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).join(', ') || 'Đồ dùng học tập';
                  const itemImg = firstItem?.imageUrl || PRESET_SAMPLE_IMAGES[0].url;

                  return (
                    <div
                      key={rd.id}
                      className={`p-4 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        rd.status === 'PENDING'
                          ? 'bg-purple-50/30 border-purple-200'
                          : rd.status === 'DELIVERED'
                          ? 'bg-emerald-50/20 border-emerald-200'
                          : 'bg-slate-50 border-slate-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                          <img src={itemImg} alt={itemTitle} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 truncate">{rd.studentName}</h4>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                rd.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : rd.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {rd.status === 'PENDING' ? 'Chưa Trao' : rd.status === 'DELIVERED' ? 'Đã Trao' : 'Đã Hủy'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Đổi món: <strong className="text-slate-900">{itemTitle}</strong> ({rd.totalStars} ⭐)
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Yêu cầu lúc: {new Date(rd.requestedAt || (rd as any).createdAt).toLocaleString('vi-VN')}</span>
                          </p>
                        </div>
                      </div>

                      {rd.status === 'PENDING' && (
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => {
                              if (confirm(`Xác nhận đã trao quà "${itemTitle}" cho em ${rd.studentName}?`)) {
                                fulfillRewardRedemption(rd.id);
                                confetti({ particleCount: 50 });
                                toast.success(`Đã xác nhận trao quà cho em ${rd.studentName}!`);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã Trao Quà</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn hủy đơn đổi quà này và hoàn lại ${rd.totalStars} ⭐ cho em ${rd.studentName}?`)) {
                                cancelRewardRedemption(rd.id);
                                toast.info(`Đã hủy đơn và hoàn lại ${rd.totalStars} ⭐ cho học sinh.`);
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer"
                          >
                            Hủy & Hoàn Sao
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* TAB 6: NHẬT KÝ TÍCH SAO TOÀN LỚP */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Nhật Ký Tích Sao Toàn Lớp ({starLogs.length} Lần)</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {starLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Chưa có nhật ký tích sao nào.</div>
            ) : (
              starLogs.map((log) => {
                const st = students.find((s) => s.id === log.studentId);
                return (
                  <div key={log.id} className="p-3.5 sm:p-4 hover:bg-slate-50 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{st?.fullName || 'Học sinh'}</span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                            log.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.points > 0 ? `+${log.points}⭐` : `${log.points}⭐`}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                          {log.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{log.reason}</p>
                      {log.comment && (
                        <p className="text-[11px] text-slate-500 italic">&ldquo;{log.comment}&rdquo;</p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        {new Date(log.date || log.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm('Bạn có muốn xóa bản ghi nhật ký này không?')) {
                          deleteStarLog(log.id);
                          toast.info('Đã xóa bản ghi.');
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Xóa nhật ký"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ĐÁNH GIÁ & NHẬN XÉT HỌC SINH */}
      {isAssessModalOpen && selectedStudentForAssess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                  ⭐
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Đánh Giá & Nhận Xét: {selectedStudentForAssess.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-500">Mã: {selectedStudentForAssess.studentCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssessModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày đánh giá</label>
                  <input
                    type="date"
                    value={assessDate}
                    onChange={(e) => setAssessDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số sao cộng/trừ</label>
                  <select
                    value={assessPoints}
                    onChange={(e) => setAssessPoints(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 bg-amber-50/50"
                  >
                    <option value={1}>+1 ⭐ (Khuyến khích)</option>
                    <option value={2}>+2 ⭐⭐ (Rất tốt)</option>
                    <option value={3}>+3 ⭐⭐⭐ (Xuất sắc)</option>
                    <option value={5}>+5 ⭐⭐⭐⭐⭐ (Đột phá)</option>
                    <option value={-1}>-1 ⭐ (Nhắc nhở)</option>
                    <option value={-2}>-2 ⭐ (Kỷ luật)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lĩnh vực đánh giá</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Học tập', 'Nề nếp', 'Phẩm chất', 'Nhắc nhở', 'Khác'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAssessCategory(cat)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        assessCategory === cat ? 'bg-amber-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lý do tích sao</label>
                <input
                  type="text"
                  value={assessReason}
                  onChange={(e) => setAssessReason(e.target.value)}
                  placeholder="Ví dụ: Phát biểu bài hăng hái..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Lời dặn dò / Nhận xét của cô</label>
                  <span className="text-[10px] text-slate-400">Hiện trên thẻ học sinh & gửi Zalo</span>
                </div>
                <textarea
                  rows={2}
                  value={assessComment}
                  onChange={(e) => setAssessComment(e.target.value)}
                  placeholder="Nhập lời dặn dò cụ thể..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />

                {/* Suggestions */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {COMMENT_SUGGESTIONS.slice(0, 3).map((sugg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAssessComment(sugg)}
                      className="text-[10px] bg-slate-100 hover:bg-amber-50 hover:text-amber-900 text-slate-600 px-2 py-0.5 rounded-lg truncate max-w-full"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssessModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                >
                  Lưu Đánh Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM LỊCH SỬ TÍCH SAO HỌC SINH */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                  ⭐
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Lịch Sử Sao: {historyStudent.fullName}</h3>
                  <p className="text-[11px] text-slate-500">Mã: {historyStudent.studentCode} • Tổng: {getStudentStars(historyStudent.id)} sao</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {starLogs.filter((l) => l.studentId === historyStudent.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Chưa có lịch sử tích sao nào.</div>
              ) : (
                starLogs
                  .filter((l) => l.studentId === historyStudent.id)
                  .map((log) => (
                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                              log.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.points > 0 ? `+${log.points}⭐` : `${log.points}⭐`}
                          </span>
                          <span className="font-bold text-xs text-slate-800">{log.reason}</span>
                        </div>
                        {log.comment && <p className="text-[11px] text-slate-500 italic mt-0.5">&ldquo;{log.comment}&rdquo;</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(log.date || log.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SHARE REWARDS QR & LINK */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mx-auto">
              🎁
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Cổng Đổi Quà Học Sinh Lớp {classInfo.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Gửi đường link hoặc chiếu mã QR để học sinh & phụ huynh tự xem số sao và chọn đổi quà
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-center">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
                <QrCode className="w-36 h-36 text-slate-800" />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono truncate">
              <span className="truncate flex-1">{typeof window !== 'undefined' ? `${window.location.origin}/rewards/${classInfo.id || 'class-4a1'}` : ''}</span>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/rewards/${classInfo.id || 'class-4a1'}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Đã sao chép link Cổng đổi quà!');
                }}
                className="p-1.5 bg-white text-purple-700 rounded-lg hover:bg-purple-50 cursor-pointer shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsShareModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: CRITERION MODAL */}
      {isCriterionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              {editingCriterion ? 'Chỉnh Sửa Tiêu Chí' : 'Thêm Tiêu Chí Tích Sao Mới'}
            </h3>
            <form onSubmit={handleSaveCriterion} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên tiêu chí</label>
                <input
                  type="text"
                  value={criterionTitle}
                  onChange={(e) => setCriterionTitle(e.target.value)}
                  placeholder="Ví dụ: Giúp đỡ bạn bè..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm</label>
                  <select
                    value={criterionCategory}
                    onChange={(e) => setCriterionCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Học tập">Học tập</option>
                    <option value="Nề nếp">Nề nếp</option>
                    <option value="Phẩm chất">Phẩm chất</option>
                    <option value="Phong trào">Phong trào</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Điểm sao (+/-)</label>
                  <input
                    type="number"
                    value={criterionPoints}
                    onChange={(e) => setCriterionPoints(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCriterionModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs"
                >
                  Lưu Tiêu Chí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              {editingProduct ? 'Chỉnh Sửa Món Quà' : 'Thêm Quà Mới Vào Shop'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên món quà</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ví dụ: Bút mực tím..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Mô tả công dụng hoặc màu sắc..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá đổi (Sao ⭐)</label>
                  <input
                    type="number"
                    min={1}
                    value={productStarPrice}
                    onChange={(e) => setProductStarPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng trong kho</label>
                  <input
                    type="number"
                    min={0}
                    value={productStock}
                    onChange={(e) => setProductStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh minh họa</label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {PRESET_SAMPLE_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => setProductImageUrl(img.url)}
                      className={`h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        productImageUrl === img.url ? 'border-emerald-500 scale-105' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: RESTOCK MODAL */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              Nhập Thêm Kho: {restockModalProduct.name}
            </h3>
            <p className="text-xs text-slate-500">Tồn kho hiện tại: {restockModalProduct.stock} cái</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng nhập thêm</label>
              <input
                type="number"
                min={1}
                value={restockAddAmount}
                onChange={(e) => setRestockAddAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-center"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setRestockModalProduct(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  restockRewardProduct(restockModalProduct.id, restockAddAmount);
                  toast.success(`Đã nhập thêm ${restockAddAmount} cái vào kho!`);
                  setRestockModalProduct(null);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                Xác Nhận Nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
