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

  // Month selector for Leaderboard (default: current month 'YYYY-MM')
  const currentMonthKey = getLocalDateString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [redemptionFilter, setRedemptionFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED'>('ALL');

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

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [students, searchQuery]);

  // Leaderboard ranking calculation for selected month
  const leaderboard = useMemo(() => {
    const scoredList = students.map((st) => {
      const balance = getStudentMonthlyStars(st.id, selectedMonth);
      const allTimeStars = getStudentStars(st.id);
      return {
        student: st,
        monthlyEarned: balance.earned,
        monthlySpent: balance.spent,
        monthlyAvailable: balance.available,
        allTimeStars,
      };
    });

    // Sort descending by monthly earned stars, then by all-time stars, then by name
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

  // Pending Redemptions count
  const pendingRedemptionsCount = useMemo(() => {
    return rewardRedemptions.filter((r) => r.status === 'PENDING').length;
  }, [rewardRedemptions]);

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

  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalProduct) return;
    restockRewardProduct(restockModalProduct.id, Number(restockAddAmount));
    setRestockModalProduct(null);
  };

  // Export Daily Behavior & Comments to Excel
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã Học Sinh',
      'Họ và Tên',
      'Giới Tính',
      'Tổng Sao Tháng Này',
      'Sao Khả Dụng',
      'Tổng Sao Toàn Khóa',
      'Nhận Xét Gần Nhất',
      'Lý Do Chấm Sao',
    ];

    const rows = leaderboard.map((item, idx) => {
      const studentLogs = starLogs.filter((l) => l.studentId === item.student.id);
      const latestLog = studentLogs[0];

      return [
        idx + 1,
        item.student.studentCode,
        item.student.fullName,
        item.student.gender,
        item.monthlyEarned,
        item.monthlyAvailable,
        item.allTimeStars,
        latestLog?.comment || '(Chưa có nhận xét riêng)',
        latestLog ? `${latestLog.category} - ${latestLog.reason} (${latestLog.points > 0 ? `+${latestLog.points}` : latestLog.points} ⭐)` : 'Chưa có',
      ];
    });

    const titleRows = [
      [`BẢNG TỔNG HỢP THI ĐUA TÍCH SAO & NỀ NẾP - LỚP ${classInfo.name}`],
      [`Tháng: ${selectedMonth.replace('-', '/')} - Năm học: ${classInfo.schoolYear} - GVCN: ${classInfo.teacherName}`],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 24 },
      { wch: 10 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 45 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ThiDua_TichSao');
    XLSX.writeFile(workbook, `Bang_Thi_Dua_Tich_Sao_Lop_${classInfo.name}_${selectedMonth}.xlsx`);
    toast.success('Đã xuất file Excel bảng thi đua thành công!');
  };

  const publicRewardsUrl = typeof window !== 'undefined' ? `${window.location.origin}/rewards/${classInfo.shareToken || classInfo.id}` : '';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 shrink-0" />
            <span className="truncate">Thi Đua Tích Sao & Shop Quà</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý phong trào thi đua tháng, thang điểm sao, shop đồ dùng học tập và duyệt đổi quà cho học sinh Lớp {classInfo.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold border border-blue-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Link Public</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handleAwardWholeClass}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Thưởng Sao Cả Lớp (+1 ⭐)</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase truncate">Tổng Sao Toàn Khóa</p>
            <p className="text-lg sm:text-xl font-black text-slate-900">
              {starLogs.reduce((sum, l) => sum + l.points, 0)} ⭐
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold shrink-0">
            <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase truncate">Quán Quân Tháng</p>
            <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {leaderboard[0] ? `${leaderboard[0].student.fullName} (${leaderboard[0].monthlyEarned} ⭐)` : 'Chưa có'}
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('REDEMPTIONS')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3 cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold relative shrink-0">
            <Gift className="w-5 h-5" />
            {pendingRedemptionsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-rose-500 text-white rounded-full text-[9px] sm:text-[10px] font-black flex items-center justify-center animate-pulse">
                {pendingRedemptionsCount}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase truncate">Quà Chờ Trao</p>
            <p className="text-lg sm:text-xl font-black text-purple-700">
              {pendingRedemptionsCount} Đơn
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase truncate">Shop Quà Tặng</p>
            <p className="text-lg sm:text-xl font-black text-slate-900">{rewardProducts.length} Đồ dùng</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'TABLE', label: 'Bảng Đánh Giá & Nhận Xét', icon: FileSpreadsheet },
          { id: 'LEADERBOARD', label: 'Đua Top Tích Sao', icon: Trophy, badge: 'Tháng' },
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
              onClick={() => setActiveTab(tab.id as 'TABLE' | 'LEADERBOARD' | 'CRITERIA' | 'SHOP' | 'REDEMPTIONS' | 'HISTORY')}
              className={`h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
                isActive ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    tab.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800')
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Bảng Đánh Giá Chi Tiết Theo Học Sinh ({filteredStudents.length} Em)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hiển thị số sao tích lũy kèm nội dung đánh giá cụ thể và lời dặn dò hàng ngày của cô giáo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle: Table vs Mobile Cards */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTableViewMode('TABLE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    tableViewMode === 'TABLE' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem dạng bảng đầy đủ"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dạng Bảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTableViewMode('CARDS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    tableViewMode === 'CARDS' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem dạng thẻ nhanh (tối ưu cho điện thoại)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dạng Thẻ</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên, mã..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* VIEW MODE: MOBILE CARDS GRID */}
          {tableViewMode === 'CARDS' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStudents.map((st) => {
                const studentLogs = starLogs.filter((l) => l.studentId === st.id);
                const totalStars = studentLogs.reduce((sum, l) => sum + l.points, 0);
                const latestLog = studentLogs[0];

                return (
                  <div
                    key={st.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {st.fullName.split(' ').pop()?.substring(0, 2) || 'HS'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{st.fullName}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">{st.studentCode} • {st.gender}</p>
                          </div>
                        </div>

                        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-900 font-black px-2.5 py-1 rounded-full border border-amber-200 text-xs shadow-2xs shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{totalStars}</span>
                        </span>
                      </div>

                      {latestLog ? (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
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
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
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
          ) : (
            /* VIEW MODE: DETAILED TABLE */
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 sm:px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-3 sm:px-4 w-48">Học Sinh</th>
                    <th className="py-3 px-3 sm:px-4 text-center w-28">Tổng Sao ⭐</th>
                    <th className="py-3 px-3 sm:px-4 w-60">Nội Dung Đánh Giá Gần Nhất</th>
                    <th className="py-3 px-3 sm:px-4">Lời Nhận Xét / Dặn Dò Của Cô</th>
                    <th className="py-3 px-3 sm:px-4 text-right w-44">Đánh Giá & Tích Sao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st, idx) => {
                    const studentLogs = starLogs.filter((l) => l.studentId === st.id);
                    const totalStars = studentLogs.reduce((sum, l) => sum + l.points, 0);
                    const latestLog = studentLogs[0];

                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 sm:px-4">
                          <div className="font-bold text-slate-900 text-xs">{st.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {st.studentCode} • {st.gender}
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-center">
                          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 font-black px-2.5 py-1 rounded-full border border-amber-200 text-xs shadow-2xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{totalStars}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 sm:px-4">
                          {latestLog ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    latestLog.points > 0
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : latestLog.points < 0
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  {latestLog.points > 0 ? `+${latestLog.points} ⭐` : latestLog.points < 0 ? `${latestLog.points} ⭐` : '💬 Nhận xét'}
                                </span>
                                <span className="font-semibold text-slate-800 text-[11px]">{latestLog.reason}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{new Date(latestLog.date || latestLog.createdAt).toLocaleDateString('vi-VN')}</span>
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa có đánh giá</span>
                          )}
                        </td>
                        <td className="py-3 px-3 sm:px-4">
                          {latestLog?.comment ? (
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 leading-relaxed">
                              <span className="text-blue-600 font-bold mr-1">“</span>
                              {latestLog.comment}
                              <span className="text-blue-600 font-bold ml-1">”</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Chưa có nhận xét riêng</span>
                          )}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenAssessModal(st)}
                            className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                            title="Đánh giá nội dung & ghi nhận xét"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Nhận xét</span>
                          </button>
                          <button
                            onClick={() => setHistoryStudent(st)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Xem lịch sử nhận xét của em này"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ĐUA TOP TÍCH SAO & VINH DANH (LEADERBOARD THEO THÁNG) */}
      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-4 sm:space-y-5">
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
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 pt-2 sm:pt-4">
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
                <p className="text-xs text-slate-500 font-mono">{leaderboard[1]?.student.studentCode || ''}</p>
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
                <p className="text-xs text-slate-600 font-mono font-bold">{leaderboard[0]?.student.studentCode || ''}</p>
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
                <p className="text-xs text-slate-500 font-mono">{leaderboard[2]?.student.studentCode || ''}</p>
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
                Giáo viên có thể tùy chỉnh thêm, sửa, xóa tiêu chí. Bảng này sẽ tự động load lên khi chấm điểm học sinh.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={resetStarCriteriaToDefault}
                className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Khôi phục danh mục tiêu chí chuẩn Thông tư 27"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi Phục Chuẩn TT27</span>
              </button>

              <button
                onClick={handleOpenAddCriterion}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
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
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300 transition-all flex items-start justify-between gap-2.5"
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
                Các món quà phù hợp học sinh tiểu học Việt Nam. Giáo viên có thể điều chỉnh giá sao, thêm bớt quà và cập nhật tồn kho.
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
                    title="Nhập thêm số lượng vào kho"
                  >
                    + Nhập
                  </button>
                  <button
                    onClick={() => handleOpenEditProduct(prod)}
                    className="py-1.5 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Sửa thông tin sản phẩm"
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
                    title="Xóa món quà"
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
                  onClick={() => setRedemptionFilter(f as any)}
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
                .map((rd) => (
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
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {rd.studentName.split(' ').pop()?.substring(0, 2) || 'HS'}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{rd.studentName}</h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {rd.studentCode}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              rd.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : rd.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {rd.status === 'PENDING'
                              ? '⏳ Chưa trả quà'
                              : rd.status === 'DELIVERED'
                              ? '✅ Đã trả quà'
                              : '❌ Đã hủy'}
                          </span>
                        </div>

                        {/* Items list */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rd.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-xs flex items-center space-x-1.5 shadow-2xs"
                            >
                              <span className="font-bold text-slate-800">{it.productName}</span>
                              <span className="text-purple-600 font-black">x{it.quantity}</span>
                              <span className="text-slate-400 text-[10px]">({it.unitStarPrice * it.quantity}⭐)</span>
                            </div>
                          ))}
                        </div>

                        {rd.studentNote && (
                          <p className="text-[11px] text-slate-600 italic bg-white/70 p-2 rounded-xl border border-purple-100">
                            Lời dặn của con: &ldquo;{rd.studentNote}&rdquo;
                          </p>
                        )}

                        <p className="text-[10px] text-slate-400">
                          Gửi yêu cầu: {new Date(rd.requestedAt).toLocaleString('vi-VN')}
                          {rd.deliveredAt && ` • Đã trao ngày: ${new Date(rd.deliveredAt).toLocaleDateString('vi-VN')}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Tổng sao:</span>
                        <p className="text-base font-black text-amber-600">-{rd.totalStars} ⭐</p>
                      </div>

                      {rd.status === 'PENDING' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn hủy đơn đổi quà của em ${rd.studentName} và hoàn lại sao/tồn kho?`)) {
                                cancelRewardRedemption(rd.id);
                              }
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => {
                              fulfillRewardRedemption(rd.id);
                              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Đã Trả Quà Cho Học Sinh</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          Đã Trao Xong 🎉
                        </span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: NHẬT KÝ HOẠT ĐỘNG */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Nhật Ký Nhận Xét & Lịch Sử Tích Sao ({starLogs.length} Bản Ghi)</span>
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Thời Gian</th>
                  <th className="py-3 px-3 sm:px-4">Học Sinh</th>
                  <th className="py-3 px-3 sm:px-4">Phân Loại</th>
                  <th className="py-3 px-3 sm:px-4">Nội Dung Đánh Giá</th>
                  <th className="py-3 px-3 sm:px-4">Nhận Xét / Lời Dặn Của Cô</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Sao ⭐</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {starLogs.map((log) => {
                  const student = students.find((s) => s.id === log.studentId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 sm:px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(logDate(log)).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-bold text-slate-900">{student?.fullName || 'Học sinh'}</td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-medium text-slate-800">{log.reason}</td>
                      <td className="py-3 px-3 sm:px-4 text-slate-600 italic">{log.comment ? `“${log.comment}”` : '-'}</td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span
                          className={`font-black px-2 py-0.5 rounded-full text-xs ${
                            log.points > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.points < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {log.points > 0 ? `+${log.points}` : log.points} ⭐
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa bản ghi đánh giá này?')) {
                              deleteStarLog(log.id);
                              toast.success('Đã xóa bản ghi!');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ĐÁNH GIÁ NỘI DUNG & NHẬN XÉT HÀNG NGÀY CHO HỌC SINH (DYNAMIC STAR CRITERIA) */}
      {isAssessModalOpen && selectedStudentForAssess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shrink-0">
                  ⭐
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    Đánh Giá & Nhận Xét: {selectedStudentForAssess.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">Mã: {selectedStudentForAssess.studentCode} • Lớp {classInfo.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssessModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày Đánh Giá</label>
                  <input
                    type="date"
                    required
                    value={assessDate}
                    onChange={(e) => setAssessDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức Sao Thưởng / Phạt</label>
                  <select
                    value={assessPoints}
                    onChange={(e) => setAssessPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value={3}>🌟🌟🌟 Thưởng +3 Sao (Xuất sắc)</option>
                    <option value={2}>🌟🌟 Thưởng +2 Sao (Rất tốt)</option>
                    <option value={1}>🌟 Thưởng +1 Sao (Tốt / Khen ngợi)</option>
                    <option value={0}>💬 0 Sao (Chỉ ghi nhận xét)</option>
                    <option value={-1}>⚠️ Trừ -1 Sao (Nhắc nhở)</option>
                    <option value={-2}>❌ Trừ -2 Sao (Cần chấn chỉnh)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Criteria Buttons */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Chọn Nhanh Từ Danh Mục Tiêu Chí Của Lớp:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                  {starCriteria.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAssessReason(p.title);
                        setAssessCategory(p.category);
                        setAssessPoints(p.points);
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                        assessReason === p.title
                          ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 font-bold text-blue-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0">{p.icon}</span>
                      <div className="truncate min-w-0 flex-1">
                        <p className="text-[11px] truncate">{p.title}</p>
                        <p className="text-[9px] text-slate-400">{p.points > 0 ? `+${p.points}⭐` : `${p.points}⭐`}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội Dung Đánh Giá (Tùy biến):
                </label>
                <input
                  type="text"
                  required
                  value={assessReason}
                  onChange={(e) => setAssessReason(e.target.value)}
                  placeholder="Ví dụ: Làm bài tập toán xuất sắc, giúp bạn..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Comment Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Lời Nhận Xét & Dặn Dò Cụ Thể Của Cô Giáo:
                  </label>
                  <span className="text-[10px] text-blue-600 font-medium hidden sm:inline">Bấm gợi ý để điền nhanh</span>
                </div>
                <textarea
                  rows={3}
                  value={assessComment}
                  onChange={(e) => setAssessComment(e.target.value)}
                  placeholder="Nhập nhận xét cụ thể để theo dõi hoặc gửi thông tin cho phụ huynh..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMMENT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAssessComment(sug)}
                      className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2 py-0.8 rounded-lg text-[10px] border border-slate-200 transition-colors text-left cursor-pointer"
                    >
                      + {sug.length > 30 ? sug.substring(0, 30) + '...' : sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssessModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Lưu Đánh Giá & Tích Sao</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / SỬA TIÊU CHÍ */}
      {isCriterionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                {editingCriterion ? 'Chỉnh Sửa Tiêu Chí' : 'Thêm Tiêu Chí Tích Sao Mới'}
              </h3>
              <button onClick={() => setIsCriterionModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCriterion} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phân Loại Đầu Việc:</label>
                <select
                  value={criterionCategory}
                  onChange={(e) => setCriterionCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  <option value="Học tập">📚 Học tập</option>
                  <option value="Nề nếp">⭐ Nề nếp & Kỷ luật</option>
                  <option value="Phẩm chất">🤝 Phẩm chất & Đạo đức</option>
                  <option value="Nhắc nhở">⚠️ Nhắc nhở</option>
                  <option value="Khác">✨ Khác</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Tiêu Chí / Hành Vi:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giúp bạn cùng tiến bộ..."
                  value={criterionTitle}
                  onChange={(e) => setCriterionTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức Sao Quy Đổi:</label>
                  <input
                    type="number"
                    required
                    value={criterionPoints}
                    onChange={(e) => setCriterionPoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biểu Tượng Emoji:</label>
                  <input
                    type="text"
                    required
                    value={criterionIcon}
                    onChange={(e) => setCriterionIcon(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-center text-base"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCriterionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Lưu Tiêu Chí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / SỬA SẢN PHẨM SHOP QUÀ */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                {editingProduct ? 'Chỉnh Sửa Món Quà' : 'Thêm Đồ Dùng Học Tập Mới'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Đồ Dùng / Quà Tặng:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bút máy Kim Thành nét thanh nét đậm..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân Loại:</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    <option value="Bút viết">Bút viết</option>
                    <option value="Vở & Sổ">Vở & Sổ</option>
                    <option value="Hộp bút & Thước">Hộp bút & Thước</option>
                    <option value="Dụng cụ học tập">Dụng cụ học tập</option>
                    <option value="Phụ kiện dễ thương">Phụ kiện cute</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Sao Cần Đổi:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={productStarPrice}
                    onChange={(e) => setProductStarPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-black text-amber-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Lượng Kho:</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={productStock}
                    onChange={(e) => setProductStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô Tả Sản Phẩm:</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả chi tiết đặc điểm, chất lượng của món quà..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ảnh Sản Phẩm (Chọn mẫu hoặc dán URL):</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 mb-2">
                  {PRESET_SAMPLE_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProductImageUrl(img.url)}
                      className={`relative rounded-xl overflow-hidden border-2 h-12 sm:h-14 transition-all cursor-pointer ${
                        productImageUrl === img.url ? 'border-emerald-500 ring-2 ring-emerald-300' : 'border-slate-200'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7px] sm:text-[8px] truncate px-0.5 text-center">
                        {img.name}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Hoặc nhập URL ảnh trực tiếp..."
                  value={productImageUrl}
                  onChange={(e) => setProductImageUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NHẬP THÊM HÀNG VÀO KHO (RESTOCK) */}
      {restockModalProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Nhập Thêm Hàng Vào Kho: {restockModalProduct.name}
            </h3>
            <p className="text-xs text-slate-500">Tồn kho hiện tại: <strong>{restockModalProduct.stock} cái</strong></p>

            <form onSubmit={handleSaveRestock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số lượng nhập thêm:</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={restockAddAmount}
                  onChange={(e) => setRestockAddAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-black text-slate-900 text-base"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockModalProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Xác Nhận Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XEM TOÀN BỘ LỊCH SỬ ĐÁNH GIÁ CỦA 1 HỌC SINH */}
      {historyStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0">
                  👤
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{historyStudent.fullName}</h3>
                  <p className="text-xs text-slate-500 truncate">
                    Mã: {historyStudent.studentCode} • Tổng tích lũy: <strong>{getStudentStars(historyStudent.id)} ⭐</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setHistoryStudent(null)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {starLogs.filter((l) => l.studentId === historyStudent.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic">
                  Chưa có lịch sử nhận xét nào cho học sinh này.
                </div>
              ) : (
                starLogs
                  .filter((l) => l.studentId === historyStudent.id)
                  .map((l) => (
                    <div key={l.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                              l.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {l.points > 0 ? `+${l.points} ⭐` : `${l.points} ⭐`}
                          </span>
                          <span>{l.reason}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(logDate(l)).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {l.comment && (
                        <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200/80">
                          &ldquo;{l.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LINK SHARE PUBLIC CHO PHỤ HUYNH */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              🏆
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Liên Kết Thi Đua & Shop Quà Lớp {classInfo.name}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thầy/Cô gửi liên kết này vào nhóm Zalo để Phụ huynh & Học sinh theo dõi Bảng vinh danh Top 1-2-3, Tiêu chí kiếm sao và Danh mục quà tặng của lớp.
            </p>

            <div className="p-2.5 sm:p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
              <input
                type="text"
                readOnly
                value={publicRewardsUrl}
                className="w-full bg-transparent font-mono text-xs text-slate-700 focus:outline-none truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicRewardsUrl);
                  toast.success('Đã sao chép link chia sẻ vào bộ nhớ tạm!');
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer"
              >
                Sao chép
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                href={`/rewards/${classInfo.shareToken || classInfo.id}`}
                target="_blank"
                className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                <span>Xem trang public</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function logDate(l: StarLog): string {
  return l.date || l.createdAt;
}
