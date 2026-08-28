'use client';

import React, { use, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Crown,
  Star,
  Sparkles,
  ShoppingBag,
  Gift,
  Award,
  BookOpen,
  Calendar,
  Share2,
  Copy,
  ChevronRight,
  TrendingUp,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function PublicClassRewardsPage({
  params,
}: {
  params: Promise<{ classToken: string }>;
}) {
  const resolvedParams = use(params);
  const rawToken = (resolvedParams.classToken || '').trim();

  const {
    schoolClasses,
    schoolInfo,
    allStudents,
    starLogs,
    starCriteria,
    rewardProducts,
    rewardRedemptions,
    getStudentMonthlyStars,
    getStudentStars,
  } = useAppStore();

  // Find class strictly by shareToken or id
  const targetClass = useMemo(() => {
    return (
      schoolClasses.find(
        (c) =>
          (c.shareToken && c.shareToken.toLowerCase() === rawToken.toLowerCase()) ||
          c.id.toLowerCase() === rawToken.toLowerCase()
      ) || schoolClasses[0]
    );
  }, [schoolClasses, rawToken]);

  // Current month key
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'SHOP' | 'CRITERIA'>('LEADERBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Students in this class
  const classStudents = useMemo(() => {
    if (!targetClass) return [];
    return allStudents.filter((s) => s.classId === targetClass.id);
  }, [allStudents, targetClass]);

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    return classStudents.filter((s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [classStudents, searchQuery]);

  // Leaderboard ranking for selected month
  const leaderboard = useMemo(() => {
    const scoredList = classStudents.map((st) => {
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

    // Sort descending by monthly earned stars, then all time
    scoredList.sort((a, b) => {
      if (b.monthlyEarned !== a.monthlyEarned) {
        return b.monthlyEarned - a.monthlyEarned;
      }
      return b.allTimeStars - a.allTimeStars;
    });

    return scoredList.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [classStudents, selectedMonth, starLogs, rewardRedemptions, getStudentMonthlyStars, getStudentStars]);

  // Filtered shop products
  const filteredProducts = useMemo(() => {
    return rewardProducts.filter((p) => {
      if (selectedCategory === 'ALL') return true;
      return p.category === selectedCategory;
    });
  }, [rewardProducts, selectedCategory]);

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link bảng thi đua vào bộ nhớ tạm!');
  };

  if (!targetClass) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-3 border border-slate-200">
          <p className="text-3xl">⚠️</p>
          <h2 className="font-black text-slate-900 text-lg">Không tìm thấy thông tin lớp học</h2>
          <p className="text-xs text-slate-500">Vui lòng kiểm tra lại liên kết hoặc liên hệ giáo viên chủ nhiệm.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Brand Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white text-xl shadow-xs font-bold shrink-0">
              🏆
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-black text-sm sm:text-base text-slate-900 truncate">
                Bảng Thi Đua & Shop Quà Lớp {targetClass.name}
              </h1>
              <p className="text-[11px] text-slate-500 truncate">
                {schoolInfo.name} • GVCN: {targetClass.teacherName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sao chép link</span>
            </button>

            <Link
              href="/lookup"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Đổi Quà Cho Con</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-5 sm:p-7 text-white shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="bg-white/25 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                🌟 Phong Trào Thi Đua Thông Tư 27
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                Bảng Vinh Danh Tích Sao & Đổi Quà Tháng {selectedMonth.replace('-', '/')}
              </h2>
              <p className="text-xs text-white/90">
                Khích lệ tinh thần học tập, nề nếp gương mẫu và phẩm chất tốt của học sinh Lớp {targetClass.name}.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/20">
              <label className="text-xs font-bold text-white">Tháng:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1 bg-white text-slate-900 rounded-xl text-xs font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold overflow-x-auto no-scrollbar">
          {[
            { id: 'LEADERBOARD', label: '🏆 Bảng Đua Top Vinh Danh', icon: Trophy },
            { id: 'SHOP', label: `🎁 Shop Quà Tặng (${rewardProducts.length})`, icon: ShoppingBag },
            { id: 'CRITERIA', label: `⭐ Tiêu Chí Kiếm Sao (${starCriteria.length})`, icon: Star },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive ? 'bg-amber-500 text-white shadow-xs font-black' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: LEADERBOARD & PODIUM */}
        {activeTab === 'LEADERBOARD' && (
          <div className="space-y-5">
            {/* Top 1, 2, 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* TOP 2 (BẠC) */}
              <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100 to-white rounded-3xl p-5 border-2 border-slate-300 shadow-md text-center space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-3 left-3 bg-slate-200 text-slate-700 font-black text-xs px-2.5 py-0.5 rounded-full">
                  🥈 HẠNG 2
                </div>
                <div className="pt-4 space-y-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 border-4 border-slate-300 text-slate-700 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                    {leaderboard[1]?.student.fullName.split(' ').pop()?.substring(0, 2) || '2'}
                  </div>
                  <h4 className="font-black text-base text-slate-900 truncate">
                    {leaderboard[1]?.student.fullName || 'Đang cập nhật'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">Mã: {leaderboard[1]?.student.studentCode || ''}</p>
                </div>

                <div className="bg-slate-200/70 p-3 rounded-2xl space-y-0.5">
                  <span className="text-2xl font-black text-slate-800">+{leaderboard[1]?.monthlyEarned || 0} ⭐</span>
                  <p className="text-[11px] text-slate-500 font-medium">Khả dụng: {leaderboard[1]?.monthlyAvailable || 0} sao</p>
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
                  <h4 className="font-black text-lg text-slate-900 truncate">
                    {leaderboard[0]?.student.fullName || 'Đang cập nhật'}
                  </h4>
                  <p className="text-xs text-slate-600 font-mono font-bold">Mã: {leaderboard[0]?.student.studentCode || ''}</p>
                </div>

                <div className="bg-amber-200/80 p-3.5 rounded-2xl space-y-0.5 border border-amber-300">
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
                  <h4 className="font-black text-base text-slate-900 truncate">
                    {leaderboard[2]?.student.fullName || 'Đang cập nhật'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">Mã: {leaderboard[2]?.student.studentCode || ''}</p>
                </div>

                <div className="bg-amber-100/70 p-3 rounded-2xl space-y-0.5">
                  <span className="text-2xl font-black text-amber-900">+{leaderboard[2]?.monthlyEarned || 0} ⭐</span>
                  <p className="text-[11px] text-amber-800 font-medium">Khả dụng: {leaderboard[2]?.monthlyAvailable || 0} sao</p>
                </div>
              </div>
            </div>

            {/* FULL RANKING LIST */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Toàn Bộ Học Sinh Lớp {targetClass.name} ({leaderboard.length} Em)</span>
                </h3>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên học sinh..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-16 text-center">Hạng</th>
                      <th className="py-3 px-4">Họ và Tên Học Sinh</th>
                      <th className="py-3 px-4 text-center">Sao Tháng Này</th>
                      <th className="py-3 px-4 text-center">Sao Khả Dụng</th>
                      <th className="py-3 px-4 text-center">Tổng Sao Toàn Khóa</th>
                      <th className="py-3 px-4 text-right">Tra Cứu Riêng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard
                      .filter((item) =>
                        item.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.student.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((item) => (
                        <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-center">
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
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs">{item.student.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{item.student.studentCode}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-black text-amber-600 text-sm">
                            +{item.monthlyEarned} ⭐
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {item.monthlyAvailable} ⭐
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">
                            {item.allTimeStars} ⭐
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/student/${item.student.shareToken || item.student.id}`}
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-xs"
                            >
                              <span>Vào đổi quà</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHOP QUÀ TẶNG SHOWCASE */}
        {activeTab === 'SHOP' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    <span>Danh Mục Đồ Dùng Học Tập Trong Shop ({rewardProducts.length} Món)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Học sinh truy cập vào liên kết cá nhân của mình để submit đổi quà bằng số sao tích lũy.
                  </p>
                </div>

                {/* Category filters */}
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                  {['ALL', 'Bút viết', 'Vở & Sổ', 'Hộp bút & Thước', 'Dụng cụ học tập', 'Phụ kiện dễ thương'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? 'Tất Cả' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-36 bg-slate-100 overflow-hidden">
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {prod.category}
                        </div>
                        <div
                          className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                            prod.stock > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {prod.stock > 0 ? `Còn ${prod.stock}` : 'Tạm hết'}
                        </div>
                      </div>

                      <div className="p-3.5 space-y-1.5">
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2" title={prod.name}>
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                      <span className="text-amber-600 font-black text-sm">{prod.starPrice} ⭐</span>
                      <Link
                        href="/lookup"
                        className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-colors"
                      >
                        Đổi Quà →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TIÊU CHÍ KIẾM SAO */}
        {activeTab === 'CRITERIA' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>Tiêu Chí Kiếm Sao & Nề Nếp Lớp Học ({starCriteria.length} Tiêu Chí)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các việc làm tốt và gương mẫu giúp học sinh tích lũy sao mỗi ngày do GVCN quy định.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {starCriteria.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 flex items-start space-x-3"
                >
                  <span className="text-2xl shrink-0">{c.icon}</span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.2 rounded-md ${
                        c.category === 'Học tập'
                          ? 'bg-blue-100 text-blue-800'
                          : c.category === 'Nề nếp'
                          ? 'bg-amber-100 text-amber-800'
                          : c.category === 'Phẩm chất'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {c.category}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-1">{c.title}</h4>
                    <p className="text-amber-600 font-black text-xs mt-0.5">
                      {c.points > 0 ? `+${c.points} ⭐` : `${c.points} ⭐`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
