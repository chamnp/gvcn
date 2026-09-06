'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Share2,
  Package,
  Link as LinkIcon,
  Copy,
  FileUp,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  LessonPlan,
  TextbookSeries,
  GradeLevel,
} from '@/types';
import {
  GRADE_4_CURRICULUM_TOPICS,
  GRADE_4_SUBJECTS,
  TEXTBOOK_OPTIONS,
} from '@/lib/lesson-plan-data';
import {
  generateAILessonPlan,
  downloadLessonPlanDoc,
  parseImportedTextToLessonPlan,
} from '@/lib/lesson-plan-engine';
import {
  downloadLessonPackageFile,
  parseLessonPackageFile,
  encodeLessonPlanToShareUrl,
  decodeLessonPlanFromShareString,
} from '@/lib/lesson-package-engine';
import { LessonPresentationModal } from '@/components/lesson-plans/lesson-presentation-modal';
import { LessonEditorModal } from '@/components/lesson-plans/lesson-editor-modal';
import { LessonPlanPrintView } from '@/components/lesson-plans/lesson-plan-print-view';
import { GoogleDrivePickerModal } from '@/components/lesson-plans/google-drive-picker-modal';
import { GoogleDriveFile } from '@/lib/google-drive-client';
import { FeatureGate } from '@/components/layout/feature-gate';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function LessonPlansPage() {
  const { classInfo, schoolInfo, students, addStarLog } = useAppStore();

  const [plans, setPlans] = useState<LessonPlan[]>([]);

  useEffect(() => {
    if (!classInfo.id) return;
    let active = true;
    void supabase
      .from('LessonPlan')
      .select('data')
      .eq('classId', classInfo.id)
      .order('updatedAt', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Không thể tải kế hoạch bài dạy:', error.message);
          toast.error('Không thể tải thư viện kế hoạch bài dạy từ máy chủ.');
          setPlans([]);
          return;
        }
        setPlans((data || []).map((row) => row.data as LessonPlan));
      });
    return () => {
      active = false;
    };
  }, [classInfo.id]);

  const savePlans = async (newPlans: LessonPlan[]): Promise<boolean> => {
    if (!classInfo.id) {
      toast.error('Chưa xác định lớp để lưu kế hoạch bài dạy.');
      return false;
    }
    const normalized = newPlans.map((plan) => ({ ...plan, classId: classInfo.id }));
    const nextIds = new Set(normalized.map((plan) => plan.id));
    const deletedIds = plans.filter((plan) => !nextIds.has(plan.id)).map((plan) => plan.id);
    const now = new Date().toISOString();
    const rows = normalized.map((plan) => ({
      id: plan.id,
      classId: classInfo.id,
      week: plan.week,
      subjectCode: plan.subjectCode,
      data: { ...plan, classId: classInfo.id, updatedAt: now },
      createdAt: plan.createdAt || now,
      updatedAt: now,
    }));
    const [upsertResult, deleteResult] = await Promise.all([
      rows.length ? supabase.from('LessonPlan').upsert(rows) : Promise.resolve({ error: null }),
      deletedIds.length
        ? supabase.from('LessonPlan').delete().eq('classId', classInfo.id).in('id', deletedIds)
        : Promise.resolve({ error: null }),
    ]);
    const error = upsertResult.error || deleteResult.error;
    if (error) {
      console.error('Không thể lưu kế hoạch bài dạy:', error.message);
      toast.error('Không thể lưu kế hoạch bài dạy lên máy chủ.');
      return false;
    }
    setPlans(normalized);
    return true;
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
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [activeLessonPlan, setActiveLessonPlan] = useState<LessonPlan | null>(null);

  const handleSelectDriveFile = (file: GoogleDriveFile) => {
    const newPlan = generateAILessonPlan(file.name, 'TOAN', 4, selectedTextbook, selectedWeek, 1);
    newPlan.title = file.name;
    newPlan.embeddedSlideUrl = file.webViewLink || file.embedUrl;
    setActiveLessonPlan(newPlan);
    setIsEditorOpen(true);
    toast.success(`Đã nạp bài từ Google Drive: "${file.name}". Bạn có thể tinh chỉnh và lưu bài.`);
  };

  // AI Generator Form State
  const [aiTitle, setAiTitle] = useState('');
  const [aiSubject, setAiSubject] = useState('TOAN');
  const [aiWeek, setAiWeek] = useState(1);
  const [aiPeriod, setAiPeriod] = useState(1);

  // Import State
  const [importText, setImportText] = useState('');
  const [importSubject, setImportSubject] = useState('TOAN');

  // Cross-Server Share State
  const [importedSharedPlan, setImportedSharedPlan] = useState<LessonPlan | null>(null);
  const [shareLinkInput, setShareLinkInput] = useState('');

  // Check URL parameter ?pkg=... on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pkgParam = params.get('pkg');
    if (pkgParam) {
      const decoded = decodeLessonPlanFromShareString(pkgParam);
      if (decoded) {
        setImportedSharedPlan(decoded);
        toast.info(`Nhận được bài dạy chia sẻ: "${decoded.title}".`);
      }
    }
  }, []);

  // Handle import .gvcnlp file
  const handleImportPackageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await parseLessonPackageFile(file);
      if (await savePlans([imported, ...plans])) {
        toast.success(`Đã nhập thành công bài dạy "${imported.title}" vào thư viện!`);
        confetti({ particleCount: 80, spread: 70 });
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi nhập gói giáo án');
    } finally {
      e.target.value = '';
    }
  };

  // Handle import from shared string or URL
  const handleImportShareLink = async () => {
    if (!shareLinkInput.trim()) return;
    let pkgString = shareLinkInput.trim();
    if (pkgString.includes('pkg=')) {
      pkgString = pkgString.split('pkg=')[1].split('&')[0];
    }
    const plan = decodeLessonPlanFromShareString(pkgString);
    if (plan) {
      if (await savePlans([plan, ...plans])) {
        toast.success(`Đã bung và lưu thành công bài dạy "${plan.title}"!`);
        setShareLinkInput('');
        confetti({ particleCount: 80, spread: 70 });
      }
    } else {
      toast.error('Đường link hoặc chuỗi chia sẻ không hợp lệ hoặc đã bị chỉnh sửa.');
    }
  };

  // Handle copy share link
  const handleCopyShareLink = (plan: LessonPlan) => {
    const url = encodeLessonPlanToShareUrl(plan);
    navigator.clipboard.writeText(url);
    toast.success(`Đã copy link chia sẻ "${plan.title}"! Bạn có thể gửi link này qua Zalo cho đồng nghiệp.`);
  };

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
  const handleSavePlan = async (plan: LessonPlan) => {
    const exists = plans.some((p) => p.id === plan.id);
    let updated: LessonPlan[];
    if (exists) {
      updated = plans.map((p) => (p.id === plan.id ? plan : p));
    } else {
      updated = [plan, ...plans];
    }
    await savePlans(updated);
  };

  // Handle Delete
  const handleDeletePlan = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa kế hoạch bài dạy này?')) {
      const updated = plans.filter((p) => p.id !== id);
      if (await savePlans(updated)) toast.success('Đã xóa kế hoạch bài dạy!');
    }
  };

  // Handle Toggle Completed
  const handleToggleCompleted = async (id: string) => {
    const updated = plans.map((p) => (p.id === id ? { ...p, isCompleted: !p.isCompleted } : p));
    if (await savePlans(updated)) toast.success('Đã cập nhật trạng thái tiết dạy!');
  };

  // Handle Generate with AI
  const handleGenerateAI = async () => {
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

    if (await savePlans([generated, ...plans])) {
      confetti({ particleCount: 100, spread: 70 });
      toast.success(`Đã tạo và lưu mẫu Kế hoạch bài dạy & Slide TV cho: "${aiTitle}"!`);
      setAiTitle('');
      setActiveLessonPlan(generated);
    }
  };

  // Handle Import Text
  const handleImportText = async () => {
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

    if (await savePlans([parsed, ...plans])) {
      confetti({ particleCount: 80, spread: 60 });
      toast.success('Đã nhập và chuyển đổi giáo án thành công! 🎉');
      setImportText('');
      setActiveLessonPlan(parsed);
    }
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
    <FeatureGate feature="lessonPlans" featureName="Kế Hoạch Bài Dạy (Giáo Án)">
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
            <p className="text-xs text-slate-500 leading-relaxed">
              Mỗi tiết học có sẵn giáo án chuẩn mực 4 bước, slide TV tương tác, tự động soạn bài theo mẫu chuẩn CV 2345 và 1-Click xuất Word (.doc).
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
              onClick={() => setIsDrivePickerOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs shadow-md cursor-pointer transition-all border border-white/20 backdrop-blur-md"
            >
              <span>📁</span>
              <span>Google Drive Của Tôi</span>
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

      {/* Shared Lesson Plan Banner from URL parameter */}
      {importedSharedPlan && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white border-2 border-amber-400 shadow-xl animate-in zoom-in-95 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🎁</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Bạn nhận được 1 Kế hoạch bài dạy chia sẻ từ Đồng nghiệp:
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">{importedSharedPlan.title}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setImportedSharedPlan(null)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/70 hover:text-white cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-blue-200">
            <span className="px-2.5 py-1 rounded-xl bg-white/10">Môn: {importedSharedPlan.subjectName || importedSharedPlan.subjectCode}</span>
            <span className="px-2.5 py-1 rounded-xl bg-white/10">Khối Lớp {importedSharedPlan.grade}</span>
            <span className="px-2.5 py-1 rounded-xl bg-white/10">Tuần {importedSharedPlan.week} • Tiết {importedSharedPlan.periodNumber}</span>
            <span className="px-2.5 py-1 rounded-xl bg-white/10">Số Slide: {importedSharedPlan.slides?.length || 0} slide TV</span>
            {importedSharedPlan.embeddedSlideUrl && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/30 text-amber-300 border border-amber-400/40">
                🌐 Có đính kèm file ngoài (Google/PPTX)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                if (await savePlans([importedSharedPlan, ...plans])) {
                  setImportedSharedPlan(null);
                  toast.success(`Đã lưu "${importedSharedPlan.title}" vào thư viện giáo án thành công!`);
                  confetti({ particleCount: 70, spread: 60 });
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>LƯU VÀO THƯ VIỆN CỦA TÔI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveLessonPlan(importedSharedPlan);
                setIsPresentationOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Tv className="w-4 h-4" />
              <span>CHIẾU THỬ TRÊN TV</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. TABS NAVIGATION & WEEK / TEXTBOOK SELECTOR */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'WEEK_SCHEDULE', label: `📅 Lịch Dạy Tuần ${selectedWeek} (${weekPlans.length})` },
            { id: 'LIBRARY', label: `📚 Thư Viện Bài Dạy Khối 4 (${plans.length})` },
            { id: 'AI_STUDIO', label: '✨ Soạn Bài Mới Theo Mẫu (CV 2345)' },
            { id: 'IMPORT_EXPORT', label: '🌐 Chia Sẻ & Xuất / Nhập' },
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
                        onClick={() => handleCopyShareLink(plan)}
                        className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-colors cursor-pointer"
                        title="Copy link chia sẻ Zalo"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadLessonPackageFile(plan, classInfo.teacherName, schoolInfo.name)}
                        className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl transition-colors cursor-pointer"
                        title="Xuất file gói .gvcnlp"
                      >
                        <Package className="w-4 h-4" />
                      </button>

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
                  Bạn có thể dùng Trình tạo kế hoạch bài dạy để tự động tạo trọn gói giáo án & slide TV theo mẫu chuẩn CV 2345.
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
                <span>Soạn Bài Theo Mẫu Cho Tuần {selectedWeek}</span>
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
                      onClick={() => handleCopyShareLink(plan)}
                      className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
                      title="Copy link chia sẻ Zalo"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadLessonPackageFile(plan, classInfo.teacherName, schoolInfo.name)}
                      className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 cursor-pointer"
                      title="Xuất file gói .gvcnlp"
                    >
                      <Package className="w-3.5 h-3.5" />
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
                <span>Lesson Plan Template Generator (CV 2345)</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Tự Động Soạn Giáo Án & Slide TV Theo Mẫu Chuẩn Công Văn 2345
              </h3>
              <p className="text-xs text-slate-500">
                Nhập tên bài học hoặc chọn bài từ khung chương trình Khối 4 để tạo trọn gói 4 pha sư phạm và bộ slide TV trực quan theo mẫu chuẩn.
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
                <span>⚡ TẠO GIÁO ÁN & SLIDE TV THEO MẪU CV 2345</span>
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

      {/* TAB 4: CROSS-SERVER SHARING & IMPORT / EXPORT HUB */}
      {activeTab === 'IMPORT_EXPORT' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Feature: Direct Google Drive Cloud Import */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white shadow-lg border border-blue-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                📁
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-black text-base text-white">
                    Nhập Bài Giảng Từ Google Drive Của Tôi
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    Keep-Login Active
                  </span>
                </div>
                <p className="text-xs text-blue-200 leading-relaxed">
                  Duyệt trực tiếp kho Google Slides, PowerPoint (.pptx), Google Docs, Word và PDF trong tài khoản Google đang đăng nhập. Không cần mở tab khác hay copy link.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDrivePickerOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
            >
              <span>📁 Mở Google Drive Của Tôi</span>
            </button>
          </div>

          {/* Cross-Server Federation Hub */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Receive Lesson Plan (From .gvcnlp File or Link) */}
            <div className="bg-gradient-to-br from-indigo-900/10 via-white to-blue-50/50 rounded-3xl p-6 sm:p-8 border-2 border-indigo-200 shadow-xs space-y-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🌐</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Xuyên Mọi Server / Máy Tính
                  </span>
                </div>
                <h3 className="font-black text-base text-slate-900">
                  Nhận Giáo Án Từ Đồng Nghiệp
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhập bài dạy chia sẻ từ giáo viên trường khác hoặc máy khác thông qua <strong>File gói (.gvcnlp)</strong> hoặc <strong>Link chia sẻ Zalo</strong>.
                </p>
              </div>

              {/* Way 1: Upload .gvcnlp File */}
              <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-indigo-300 hover:border-indigo-500 transition-colors space-y-2.5 text-center shadow-xs">
                <Package className="w-8 h-8 text-indigo-600 mx-auto" />
                <div>
                  <p className="font-bold text-xs text-slate-800">Tải lên File Gói Giáo Án (.gvcnlp)</p>
                  <p className="text-[11px] text-slate-500">Hoạt động 100% khi không có mạng, chuyển qua Zalo/Drive/USB</p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all">
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Chọn file .gvcnlp từ máy tính</span>
                  <input
                    type="file"
                    accept=".gvcnlp,.json"
                    onChange={handleImportPackageFile}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Way 2: Paste Share Link (Zero-Storage) */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 text-xs flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Hoặc dán Link chia sẻ Zalo (Zero-Storage Link):</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Dán link https://.../lesson-plans?pkg=... hoặc chuỗi mã nén"
                    value={shareLinkInput}
                    onChange={(e) => setShareLinkInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleImportShareLink}
                    disabled={!shareLinkInput.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    Bung Giáo Án
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Export & Share Package for Colleagues */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📦</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Chia Sẻ Nhanh 1-Chạm
                  </span>
                </div>
                <h3 className="font-black text-base text-slate-900">
                  Xuất Gói Chia Sẻ (.gvcnlp) & Link Zalo
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gửi file hoặc copy link để đồng nghiệp ở bất kỳ trường nào cũng có thể tải về và trình chiếu ngay.
                </p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-800 block truncate">{p.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {p.subjectName} • Tuần {p.week} • {p.slides?.length || 0} slide TV
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyShareLink(p)}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copy link gửi Zalo"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Link Zalo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadLessonPackageFile(p, classInfo.teacherName, schoolInfo.name)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                        title="Tải file gói .gvcnlp"
                      >
                        <Download className="w-3 h-3" />
                        <span>Gói .gvcnlp</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section: Word Import & Export Hub */}
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
                  rows={8}
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

      <GoogleDrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelectFile={handleSelectDriveFile}
      />
    </div>
    </FeatureGate>
  );
}
