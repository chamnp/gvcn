'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Tv,
  Printer,
  Sparkles,
  Plus,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Clock,
  Edit,
  Trash2,
  Upload,
  Search,
  Check,
  Zap,
  Filter,
  Layers,
  Award,
  ChevronRight,
  HelpCircle,
  Play,
  RotateCcw,
  Presentation,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  LessonPlan,
  TextbookSeries,
  GradeLevel,
} from '@/types';
import {
  SAMPLE_GRADE_4_LESSON_PLANS,
  GRADE_4_CURRICULUM_TOPICS,
  GRADE_4_SUBJECTS,
  TEXTBOOK_OPTIONS,
} from '@/lib/lesson-plan-data';
import {
  generateAILessonPlan,
  downloadLessonPlanDoc,
  parseImportedTextToLessonPlan,
} from '@/lib/lesson-plan-engine';
import { LessonPresentationModal } from '@/components/lesson-plans/lesson-presentation-modal';
import { LessonEditorModal } from '@/components/lesson-plans/lesson-editor-modal';
import { LessonPlanPrintView } from '@/components/lesson-plans/lesson-plan-print-view';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export default function LessonPlansPage() {
  const { classInfo, schoolInfo, students, addStarLog } = useAppStore();

  // Store state for lesson plans (initialized with sample Grade 4 lesson plans)
  const [plans, setPlans] = useState<LessonPlan[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gvcn_lesson_plans_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return SAMPLE_GRADE_4_LESSON_PLANS;
  });

  // Save to local storage
  const savePlans = (newPlans: LessonPlan[]) => {
    setPlans(newPlans);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gvcn_lesson_plans_v1', JSON.stringify(newPlans));
    }
  };

  // Tabs
  const [activeTab, setActiveTab] = useState<'WEEK_SCHEDULE' | 'LIBRARY' | 'AI_STUDIO' | 'IMPORT_EXPORT'>('WEEK_SCHEDULE');

  // Filters
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedTextbook, setSelectedTextbook] = useState<TextbookSeries>('KET_NOI_TRI_THUC');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modals
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPrintingA4, setIsPrintingA4] = useState(false);
  const [activeLessonPlan, setActiveLessonPlan] = useState<LessonPlan | null>(null);

  // AI Generator Form State
  const [aiTitle, setAiTitle] = useState('');
  const [aiSubject, setAiSubject] = useState('TOAN');
  const [aiWeek, setAiWeek] = useState(1);
  const [aiPeriod, setAiPeriod] = useState(1);

  // Import State
  const [importText, setImportText] = useState('');
  const [importSubject, setImportSubject] = useState('TOAN');

  // Award Star handler in TV mode
  const handleAwardStar = (studentId: string) => {
    addStarLog(studentId, 1, 'Học tập', 'Hăng hái phát biểu trong tiết học', 'Đạt sao trong bài giảng điện tử');
  };

  // Filtered Plans for Library Tab
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchSubject = selectedSubject === 'ALL' || p.subjectCode === selectedSubject;
      const matchTextbook = !selectedTextbook || p.textbook === selectedTextbook;
      const matchKeyword =
        !searchKeyword.trim() ||
        p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        p.subjectName.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchSubject && matchTextbook && matchKeyword;
    });
  }, [plans, selectedSubject, selectedTextbook, searchKeyword]);

  // Week Schedule Plans
  const weekPlans = useMemo(() => {
    return plans.filter((p) => p.week === selectedWeek);
  }, [plans, selectedWeek]);

  // Handle Save from Editor
  const handleSavePlan = (plan: LessonPlan) => {
    const exists = plans.some((p) => p.id === plan.id);
    let updated: LessonPlan[];
    if (exists) {
      updated = plans.map((p) => (p.id === plan.id ? plan : p));
    } else {
      updated = [plan, ...plans];
    }
    savePlans(updated);
  };

  // Handle Delete
  const handleDeletePlan = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa kế hoạch bài dạy này?')) {
      const updated = plans.filter((p) => p.id !== id);
      savePlans(updated);
      toast.success('Đã xóa kế hoạch bài dạy!');
    }
  };

  // Handle Toggle Completed
  const handleToggleCompleted = (id: string) => {
    const updated = plans.map((p) => (p.id === id ? { ...p, isCompleted: !p.isCompleted } : p));
    savePlans(updated);
    toast.success('Đã cập nhật trạng thái tiết dạy!');
  };

  // Handle Generate with AI
  const handleGenerateAI = () => {
    if (!aiTitle.trim()) {
      toast.error('Vui lòng nhập tên bài học!');
      return;
    }

    const generated = generateAILessonPlan(
      aiTitle,
      aiSubject,
      4,
      selectedTextbook,
      aiWeek,
      aiPeriod
    );

    savePlans([generated, ...plans]);
    confetti({ particleCount: 100, spread: 70 });
    toast.success(`✨ Đã tự động tạo trọn gói Kế hoạch bài dạy & Slide TV cho: "${aiTitle}"!`);
    setAiTitle('');
    setActiveLessonPlan(generated);
  };

  // Handle Import Text
  const handleImportText = () => {
    if (!importText.trim()) {
      toast.error('Vui lòng dán nội dung văn bản giáo án!');
      return;
    }

    const parsed = parseImportedTextToLessonPlan(
      importText,
      importSubject,
      4,
      selectedTextbook
    );

    savePlans([parsed, ...plans]);
    confetti({ particleCount: 80, spread: 60 });
    toast.success('Đã nhập và chuyển đổi giáo án thành công! 🎉');
    setImportText('');
    setActiveLessonPlan(parsed);
  };

  // Printable View Mode
  if (isPrintingA4 && activeLessonPlan) {
    return (
      <LessonPlanPrintView
        lessonPlan={activeLessonPlan}
        schoolInfo={schoolInfo}
        classInfo={classInfo}
        onBack={() => setIsPrintingA4(false)}
      />
    );
  }

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-300">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl space-y-4 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold border border-white/20">
              <span>📖 Giáo Án Điện Tử & Kế Hoạch Bài Dạy</span>
              <span className="bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">
                Chuẩn CV 2345/BGDĐT-GDTH
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight">
              E-Lesson Plan Studio Lớp {classInfo.name} (Khối 4)
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 font-medium">
              Mỗi tiết học có sẵn giáo án chuẩn mực 4 bước, slide TV tương tác, AI tự động soạn bài và 1-Click xuất Word (.doc).
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const first = weekPlans[0] || plans[0];
                if (first) {
                  setActiveLessonPlan(first);
                  setIsPresentationOpen(true);
                } else {
                  toast.error('Chưa có bài dạy nào để chiếu TV!');
                }
              }}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Tv className="w-4 h-4" />
              <span>CHIẾU SLIDE TV TRỰC TIẾP 📺</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveLessonPlan(null);
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Soạn Bài Dạy Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Key Statistics KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-2xl p-3 text-center border border-white/15">
            <p className="text-[10px] font-bold text-slate-300 uppercase">Tổng số bài dạy</p>
            <p className="text-lg font-black text-amber-300">{plans.length} Bài</p>
            <p className="text-[10px] text-blue-200">Đầy đủ 4 pha CV 2345</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center border border-white/15">
            <p className="text-[10px] font-bold text-slate-300 uppercase">Tiết tuần {selectedWeek}</p>
            <p className="text-lg font-black text-emerald-300">{weekPlans.length} Tiết</p>
            <p className="text-[10px] text-blue-200">Sẵn sàng giảng dạy</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center border border-white/15">
            <p className="text-[10px] font-bold text-slate-300 uppercase">Slide TV Tương Tác</p>
            <p className="text-lg font-black text-blue-300">
              {plans.reduce((acc, p) => acc + (p.slides?.length || 0), 0)} Slide
            </p>
            <p className="text-[10px] text-blue-200">Kèm vòng quay & đếm giờ</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center border border-white/15">
            <p className="text-[10px] font-bold text-slate-300 uppercase">Đã dạy xong</p>
            <p className="text-lg font-black text-purple-300">
              {plans.filter((p) => p.isCompleted).length} / {plans.length}
            </p>
            <p className="text-[10px] text-blue-200">Tiến độ chương trình</p>
          </div>
        </div>
      </div>

      {/* 2. TABS NAVIGATION & WEEK / TEXTBOOK SELECTOR */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'WEEK_SCHEDULE', label: `📅 Lịch Dạy Tuần ${selectedWeek} (${weekPlans.length})` },
            { id: 'LIBRARY', label: `📚 Thư Viện Bài Dạy Khối 4 (${plans.length})` },
            { id: 'AI_STUDIO', label: '✨ AI Soạn Bài Mới (CV 2345)' },
            { id: 'IMPORT_EXPORT', label: '📥 Nhập / Xuất Word (.doc)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Textbook Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500">Bộ sách:</span>
          <select
            value={selectedTextbook}
            onChange={(e) => setSelectedTextbook(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
          >
            {TEXTBOOK_OPTIONS.map((tb) => (
              <option key={tb.id} value={tb.id}>
                {tb.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: WEEK SCHEDULE VIEW */}
      {activeTab === 'WEEK_SCHEDULE' && (
        <div className="space-y-4">
          {/* Week Selector Bar */}
          <div className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-bold text-slate-500 shrink-0 mr-1">Tuần học:</span>
              {Array.from({ length: 35 }).map((_, i) => {
                const w = i + 1;
                const countInWeek = plans.filter((p) => p.week === w).length;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWeek(w)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 relative ${
                      selectedWeek === w
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Tuần {w}</span>
                    {countInWeek > 0 && (
                      <span
                        className={`ml-1 text-[9px] px-1 py-0.2 rounded-full font-black ${
                          selectedWeek === w ? 'bg-amber-400 text-slate-950' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {countInWeek}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Week Plans List */}
          {weekPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weekPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-5 rounded-3xl border transition-all space-y-4 ${
                    plan.isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-slate-200 shadow-2xs hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900">
                          {plan.subjectName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Tiết {plan.periodNumber} • {plan.durationMinutes} phút
                        </span>
                        {plan.isCompleted && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> Đã dạy
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-base text-slate-900">{plan.title}</h3>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLessonPlan(plan);
                          setIsPresentationOpen(true);
                        }}
                        className="p-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Chiếu Slide TV trực tiếp"
                      >
                        <Tv className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveLessonPlan(plan);
                          setIsPrintingA4(true);
                        }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors cursor-pointer"
                        title="In Giáo Án A4"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadLessonPlanDoc(plan, schoolInfo, classInfo)}
                        className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition-colors cursor-pointer"
                        title="Tải file Word (.doc)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveLessonPlan(plan);
                          setIsEditorOpen(true);
                        }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors cursor-pointer"
                        title="Chỉnh sửa giáo án"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Phases Indicators */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center">
                    <div className="p-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-100">
                      1. Khởi động
                    </div>
                    <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-100">
                      2. Khám phá
                    </div>
                    <div className="p-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-100">
                      3. Luyện tập
                    </div>
                    <div className="p-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-100">
                      4. Vận dụng
                    </div>
                  </div>

                  {/* Objectives snippet */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl space-y-1">
                    <p className="font-bold text-slate-900">🎯 Mục tiêu trọng tâm:</p>
                    <p className="line-clamp-2 leading-relaxed">
                      {plan.objectives.specificCompetencies[0] || 'Nắm vững kiến thức trọng tâm của bài học.'}
                    </p>
                  </div>

                  {/* Bottom Toggle Completed */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="text-slate-400">
                      Slide bài giảng: <strong>{plan.slides?.length || 0} slide</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(plan.id)}
                      className={`font-bold transition-colors cursor-pointer ${
                        plan.isCompleted ? 'text-emerald-700 hover:underline' : 'text-blue-600 hover:underline'
                      }`}
                    >
                      {plan.isCompleted ? '✓ Đã dạy xong' : '○ Đánh dấu đã dạy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-4">
              <div className="text-5xl">📖</div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  Tuần {selectedWeek} chưa có kế hoạch bài dạy nào
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Bạn có thể dùng Trợ lý AI để tự động soạn trọn gói giáo án & slide TV chỉ trong 1 click.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAiWeek(selectedWeek);
                  setActiveTab('AI_STUDIO');
                }}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Soạn Bài Cho Tuần {selectedWeek}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FULL LIBRARY VIEW */}
      {activeTab === 'LIBRARY' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Subject Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => setSelectedSubject('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedSubject === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🌟 Tất Cả ({plans.length})
                </button>

                {GRADE_4_SUBJECTS.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setSelectedSubject(s.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                      selectedSubject === s.code
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên bài học, môn học..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900">
                      {plan.subjectName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Tuần {plan.week} • Tiết {plan.periodNumber}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-slate-900 line-clamp-2 leading-snug">
                    {plan.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {plan.objectives.specificCompetencies[0] || 'Mục tiêu bài học theo chuẩn Công văn 2345.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLessonPlan(plan);
                        setIsPresentationOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Tv className="w-3 h-3" /> Chiếu TV
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveLessonPlan(plan);
                        setIsPrintingA4(true);
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="In A4"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadLessonPlanDoc(plan, schoolInfo, classInfo)}
                      className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer"
                      title="Tải Word"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLessonPlan(plan);
                        setIsEditorOpen(true);
                      }}
                      className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 cursor-pointer"
                      title="Sửa"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AI STUDIO VIEW */}
      {activeTab === 'AI_STUDIO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <div className="inline-flex items-center space-x-1.5 text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Lesson Plan Generator</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Tự Động Soạn Giáo Án & Slide TV Chuẩn Công Văn 2345
              </h3>
              <p className="text-xs text-slate-500">
                Nhập tên bài học hoặc chọn bài từ khung chương trình Khối 4 để AI tạo trọn gói 4 pha sư phạm và bộ slide TV trực quan.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài học cần soạn:</label>
                <input
                  type="text"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  placeholder="VD: Bài 14: Dãy số tự nhiên và đặc điểm dãy số tự nhiên..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học:</label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    {GRADE_4_SUBJECTS.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuần học (1 - 35):</label>
                  <input
                    type="number"
                    min={1}
                    max={35}
                    value={aiWeek}
                    onChange={(e) => setAiWeek(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiết theo PPCT:</label>
                  <input
                    type="number"
                    min={1}
                    value={aiPeriod}
                    onChange={(e) => setAiPeriod(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-800">⚙️ Cấu trúc tự động sinh ra:</p>
                <ul className="text-slate-600 space-y-1 text-[11px] list-disc pl-4">
                  <li>Chuẩn 3 YCCĐ: Năng lực đặc thù + Năng lực chung + Phẩm chất chủ yếu.</li>
                  <li>Bảng tiến trình 4 hoạt động: Khởi động $\to$ Khám phá $\to$ Luyện tập $\to$ Vận dụng.</li>
                  <li>Bộ 7-8 Slide TV tương tác: Vòng quay may mắn, trắc nghiệm pháo hoa, đếm giờ 5 phút.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleGenerateAI}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>⚡ TỰ ĐỘNG SOẠN GIÁO ÁN & SLIDE TV NGAY</span>
              </button>
            </div>
          </div>

          {/* Curriculum Suggestion Sidebar */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span>📚</span> Khung Bài Học Gợi Ý (Khối 4)
            </h4>
            <p className="text-xs text-slate-500">Bấm vào bài bất kỳ để tự động điền form:</p>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {GRADE_4_CURRICULUM_TOPICS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setAiTitle(item.title);
                    setAiSubject(item.subjectCode);
                    setAiWeek(item.week);
                    setAiPeriod(item.periodNumber);
                    toast.success(`Đã chọn: ${item.title}`);
                  }}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>Tuần {item.week} • Tiết {item.periodNumber}</span>
                    <span className="text-blue-700">{item.subjectCode}</span>
                  </div>
                  <p className="font-bold text-slate-900">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: IMPORT / EXPORT HUB */}
      {activeTab === 'IMPORT_EXPORT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Raw Text / Copied Word */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Nhập Giáo Án (Copy - Paste Văn Bản / Word)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Dán toàn bộ nội dung file Word giáo án của bạn vào đây. Hệ thống sẽ tự động bóc tách thành giáo án điện tử có cấu trúc.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học:</label>
                  <select
                    value={importSubject}
                    onChange={(e) => setImportSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  >
                    {GRADE_4_SUBJECTS.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                rows={10}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Dán nội dung giáo án Word tại đây (Tên bài, YCCĐ, Khởi động, Khám phá...)..."
                className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />

              <button
                type="button"
                onClick={handleImportText}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>CHUYỂN ĐỔI & LƯU GIÁO ÁN</span>
              </button>
            </div>
          </div>

          {/* Batch Export Word (.doc) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Xuất File Word (.doc) Chuẩn BGH Duyệt</span>
              </h3>
              <p className="text-xs text-slate-500">
                Tất cả giáo án được xuất ra định dạng Microsoft Word đúng chuẩn thể thức văn bản hành chính Việt Nam (Times New Roman 13pt, lề 3-2-2-2cm, bảng tiến trình 2 cột).
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900">Danh sách bài dạy sẵn sàng xuất:</p>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {plans.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 truncate max-w-[240px]">{p.title}</span>
                      <button
                        type="button"
                        onClick={() => downloadLessonPlanDoc(p, schoolInfo, classInfo)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Tải .doc
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {activeLessonPlan && (
        <>
          <LessonPresentationModal
            isOpen={isPresentationOpen}
            onClose={() => setIsPresentationOpen(false)}
            lessonPlan={activeLessonPlan}
            classInfo={classInfo}
            schoolInfo={schoolInfo}
            students={students}
            onAwardStar={handleAwardStar}
          />
        </>
      )}

      <LessonEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialPlan={activeLessonPlan}
        onSave={handleSavePlan}
      />
    </div>
  );
}
