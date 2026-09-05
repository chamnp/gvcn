'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Award,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Download,
  Filter,
  Zap,
  RotateCcw,
  ShieldAlert,
  Keyboard,
  Info,
  Mic,
  LayoutGrid,
  List,
  Target,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Search,
  Check,
  Smile,
  Copy,
  Upload,
  FileDown,
  Bot,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  PRIMARY_SUBJECTS,
  TRAIT_DEFINITIONS,
  TERMS,
  evaluateStudentTT27,
  getLevelBadgeClass,
  getAwardBadgeClass,
  calculateEvaluationProgress,
  validateTT27Assessments,
  GuardrailIssue,
} from '@/lib/tt27-engine';
import { SubjectLevel, TraitLevel, Student } from '@/types';
import { exportTT27Form1, exportVnEduTemplate } from '@/lib/excel-export';
import { ProgressMeterWidget } from '@/components/assessment/progress-meter-widget';
import { GuardrailsAlertModal } from '@/components/assessment/guardrails-alert-modal';
import { AIClassDiagnosticModal } from '@/components/assessment/ai-class-diagnostic-modal';
import { SyncQuizScoresModal } from '@/components/assessment/sync-quiz-scores-modal';
import { ImportSubjectScoresModal } from '@/components/assessment/import-subject-scores-modal';
import { ExportSubjectTemplateModal } from '@/components/assessment/export-subject-template-modal';
import { VoiceInputButton } from '@/components/ui/voice-input-button';
import { toast } from 'sonner';

const SAMPLE_SUBJECT_COMMENTS: Record<string, string[]> = {
  TOAN: [
    'Em nắm chắc kiến thức tính toán, tư duy logic tốt và làm bài cẩn thận.',
    'Có kĩ năng giải toán có lời văn tốt, biết vận dụng linh hoạt.',
    'Thực hiện các phép tính nhanh, chính xác, trình bày bài sạch đẹp.',
    'Cần rèn thêm kĩ năng tính nhẩm và đọc kĩ đề bài trước khi làm.',
  ],
  TIENG_VIET: [
    'Đọc to, lưu loát, diễn cảm; chữ viết sạch đẹp, đúng độ cao.',
    'Có vốn từ phong phú, biết viết câu văn giàu hình ảnh sinh động.',
    'Nắm vững quy tắc chính tả, tiếp thu bài nhanh và hăng hái phát biểu.',
    'Cần chú ý rèn thêm nét chữ và hạn chế lỗi chính tả khi viết đoạn văn.',
  ],
  TIENG_ANH: [
    'Phát âm chuẩn, tự tin giao tiếp và nhớ từ vựng rất tốt.',
    'Hăng hái tham gia các hoạt động nghe nói trên lớp.',
    'Cần luyện tập thêm kĩ năng viết từ vựng và mẫu câu ở nhà.',
  ],
};

export default function AssessmentPage() {
  const {
    students,
    classInfo,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    homeworks,
    quizSubmissions,
    updateSubjectAssessment,
    batchUpdateSubjectAssessments,
    batchSetSubjectLevel,
    updateTraitAssessment,
    batchSetTraitLevel,
    updateTermSummary,
    recalculateAllAwards,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'QUALITIES' | 'COMPETENCIES' | 'SUMMARY'>('SUBJECTS');
  const [viewMode, setViewMode] = useState<'MATRIX' | 'FOCUS'>('MATRIX');
  const [focusSubjectCode, setFocusSubjectCode] = useState<string>('TOAN');

  // Team & Search Filter
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<'ALL' | number>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterIncomplete, setIsFilterIncomplete] = useState(false);

  // Pagination State
  const [pageSize, setPageSize] = useState<number | 'ALL'>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals & UI States
  const [isGuardrailsModalOpen, setIsGuardrailsModalOpen] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isSyncQuizModalOpen, setIsSyncQuizModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAIDiagnosticOpen, setIsAIDiagnosticOpen] = useState(false);

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const currentGrade = classInfo?.grade || 4;
  const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(currentGrade));
  const qualities = TRAIT_DEFINITIONS.filter((t) => t.category === 'PHAM_CHAT');
  const generalCompetencies = TRAIT_DEFINITIONS.filter((t) => t.category === 'NL_CHUNG');
  const specialCompetencies = TRAIT_DEFINITIONS.filter((t) => t.category === 'NL_DAC_THU');

  const numTeams = classInfo.numberOfTeams && classInfo.numberOfTeams >= 2 ? classInfo.numberOfTeams : 4;

  // Helper to determine student's team
  const getStudentTeam = (st: Student, idx: number): number => {
    const tagTeam = (st.tags || []).find((t) => t.includes('Tổ '));
    if (tagTeam) {
      const match = tagTeam.match(/Tổ\s*(\d)/i);
      if (match && match[1]) return Number(match[1]);
    }
    return (idx % numTeams) + 1;
  };

  // Compute Progress & Guardrail Issues
  const progress = useMemo(() => {
    return calculateEvaluationProgress(
      students,
      subjectAssessments,
      traitAssessments,
      termSummaries,
      currentTerm,
      currentGrade
    );
  }, [students, subjectAssessments, traitAssessments, termSummaries, currentTerm, currentGrade]);

  const issues = useMemo(() => {
    return validateTT27Assessments(
      students,
      subjectAssessments,
      traitAssessments,
      termSummaries,
      currentTerm,
      currentGrade
    );
  }, [students, subjectAssessments, traitAssessments, termSummaries, currentTerm, currentGrade]);

  // Filtered Students List with Team & Incomplete Filters
  const filteredStudents = useMemo(() => {
    let list = students.map((st, idx) => ({
      ...st,
      teamId: getStudentTeam(st, idx),
    }));

    if (isFilterIncomplete) {
      list = list.filter((s) => progress.incompleteStudentIds.includes(s.id));
    }

    if (typeof selectedTeamFilter === 'number') {
      list = list.filter((s) => s.teamId === selectedTeamFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q)
      );
    }

    return list;
  }, [students, isFilterIncomplete, selectedTeamFilter, searchQuery, progress.incompleteStudentIds, numTeams]);

  // Paginated List of Students
  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filteredStudents.length / (pageSize as number)) || 1;
  const paginatedStudents = useMemo(() => {
    if (pageSize === 'ALL') return filteredStudents;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredStudents.slice(start, start + (pageSize as number));
  }, [filteredStudents, currentPage, pageSize]);

  // Helpers to get assessment data
  const getSubjectData = (studentId: string, subjectCode: string) => {
    return subjectAssessments.find(
      (a) => a.studentId === studentId && a.subjectCode === subjectCode && a.term === currentTerm
    );
  };

  const getTraitData = (studentId: string, traitCode: string) => {
    return traitAssessments.find(
      (a) => a.studentId === studentId && a.traitCode === traitCode && a.term === currentTerm
    );
  };

  const getStudentIssues = (studentId: string) => {
    return issues.filter((i) => i.studentId === studentId);
  };

  // Batch actions
  const handleBatchSubject = (subjectCode: string, level: SubjectLevel) => {
    batchSetSubjectLevel(subjectCode, level);
    toast.success(`Đã đặt tất cả học sinh môn ${subjectCode} là mức "${level}"`);
  };

  const handleBatchTrait = (traitCode: string, level: TraitLevel) => {
    batchSetTraitLevel(traitCode, level);
    toast.success(`Đã đặt tất cả học sinh tiêu chí này là mức "${level}"`);
  };

  const handleRecalculateAwards = () => {
    recalculateAllAwards(currentTerm);
    toast.success('Đã tự động tính toán lại danh hiệu Khen thưởng theo Thông tư 27!');
  };

  const handleExportForm1 = () => {
    exportTT27Form1(classInfo, students, subjectAssessments, traitAssessments, termSummaries, currentTerm);
    toast.success('Đã xuất file Bảng tổng hợp kết quả đánh giá giáo dục (Mẫu 1 - TT27)!');
  };

  const handleExportVnEdu = () => {
    exportVnEduTemplate(classInfo, students, subjectAssessments, currentTerm);
    toast.success('Đã xuất file mẫu nhập điểm VnEdu / SMAS!');
  };

  // Helper for flexible score input & auto-inferring level
  const handleScoreChange = (
    studentId: string,
    subjectCode: string,
    rawVal: string,
    currentLevel: SubjectLevel,
    currentComment?: string
  ) => {
    if (rawVal === '') {
      updateSubjectAssessment(
        studentId,
        subjectCode,
        currentTerm,
        currentLevel,
        undefined,
        currentComment
      );
      return;
    }
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed)) {
      const val = Math.min(10, Math.max(0, parsed));
      let nextLevel = currentLevel;
      if (val >= 9) nextLevel = 'T';
      else if (val >= 5 && currentLevel === 'C') nextLevel = 'H';
      else if (val < 5) nextLevel = 'C';

      updateSubjectAssessment(
        studentId,
        subjectCode,
        currentTerm,
        nextLevel,
        val,
        currentComment
      );
    }
  };

  // Keyboard navigation handler for subject select elements
  const handleSubjectKeyDown = (
    e: React.KeyboardEvent<HTMLSelectElement>,
    studentIndex: number,
    subjectIndex: number,
    studentId: string,
    subjectCode: string
  ) => {
    const key = e.key.toUpperCase();
    if (key === 'T' || key === 'H' || key === 'C') {
      e.preventDefault();
      const level = key as SubjectLevel;
      const data = getSubjectData(studentId, subjectCode);
      updateSubjectAssessment(studentId, subjectCode, currentTerm, level, data?.score);

      const nextId = `sub-select-${studentIndex + 1}-${subjectIndex}`;
      const nextEl = document.getElementById(nextId);
      if (nextEl) nextEl.focus();
    }
  };

  // Keyboard navigation handler for trait select elements
  const handleTraitKeyDown = (
    e: React.KeyboardEvent<HTMLSelectElement>,
    studentIndex: number,
    traitIndex: number,
    studentId: string,
    traitCode: string,
    category: 'PHAM_CHAT' | 'NL_CHUNG' | 'NL_DAC_THU'
  ) => {
    const key = e.key.toUpperCase();
    if (key === 'T' || key === 'D' || key === 'Đ' || key === 'C') {
      e.preventDefault();
      const level: TraitLevel = key === 'T' ? 'T' : key === 'C' ? 'C' : 'Đ';
      updateTraitAssessment(studentId, traitCode, category, currentTerm, level);

      const nextId = `trait-select-${studentIndex + 1}-${traitIndex}`;
      const nextEl = document.getElementById(nextId);
      if (nextEl) nextEl.focus();
    }
  };

  const selectedFocusSubject = subjects.find((s) => s.code === focusSubjectCode) || subjects[0];

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-300">
      {/* 1. Header Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl shadow-md shadow-blue-500/25 ring-4 ring-blue-50">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Bảng Đánh Giá Học Sinh
              </h1>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                {termName}
              </span>
              <span className="hidden sm:inline bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                Lớp {classInfo.name}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Đánh giá linh hoạt & toàn diện: Điểm số (0-10), mức đạt (T/H/C), lời nhận xét chi tiết, tổng hợp từ trắc nghiệm online & Excel
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSyncQuizModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Tổng hợp điểm từ bài tập và bài làm trắc nghiệm online"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Tổng Hợp Trắc Nghiệm</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Nhập điểm và lời nhận xét môn học từ file Excel"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nhập Điểm Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            title="Xuất file mẫu Excel theo môn có sẵn danh sách học sinh của lớp"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Xuất Mẫu Điểm Môn</span>
          </button>

          <Link
            href="/ai-assistant"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Trợ lý AI tự động tổng hợp điểm TT27, nề nếp và sinh nhận xét học bạ"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Trợ Lý Đánh Giá AI</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAIDiagnosticOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Chẩn đoán chất lượng học tập toàn lớp chuẩn TT27 bằng AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden xl:inline">Chẩn Đoán AI Lớp</span>
          </button>

          <button
            type="button"
            onClick={handleRecalculateAwards}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Xét Khen Thưởng</span>
          </button>

          <button
            type="button"
            onClick={handleExportVnEdu}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">VnEdu/SMAS</span>
          </button>

          <button
            type="button"
            onClick={handleExportForm1}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Mẫu 1 (Tổng Hợp)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Phím Tắt</span>
          </button>
        </div>
      </div>

      {/* SHORTCUTS HELP BANNER */}
      {showShortcutsHelp && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-4 text-xs text-blue-900 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="space-y-1">
            <h4 className="font-bold flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-blue-600" />
              <span>⚡ Mẹo Chấm Điểm Siêu Tốc Bằng Bàn Phím (Matrix Fast-Grid):</span>
            </h4>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              • Khi chọn ô Môn học: Nhấn phím <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">T</kbd> (Tốt), <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">H</kbd> (Đạt), <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">C</kbd> (Cố gắng) để lưu và tự động nhảy xuống học sinh tiếp theo!
              <br />
              • Khi chọn ô Phẩm chất/Năng lực: Nhấn <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">T</kbd> (Tốt), <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">Đ</kbd> (Đạt), <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">C</kbd> (Cố gắng).
              <br />
              • Phím <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">Tab</kbd> di chuyển sang cột tiếp theo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowShortcutsHelp(false)}
            className="text-blue-500 hover:text-blue-700 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. PROGRESS METER WIDGET */}
      <ProgressMeterWidget
        progress={progress}
        issues={issues}
        isFilterIncomplete={isFilterIncomplete}
        onToggleFilterIncomplete={() => setIsFilterIncomplete(!isFilterIncomplete)}
        onOpenGuardrailsModal={() => setIsGuardrailsModalOpen(true)}
      />

      {/* 3. TABS SELECTOR */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'SUBJECTS', label: '1. Đánh Giá Môn Học', percentage: progress.subjects.percentage },
          { id: 'QUALITIES', label: '2. 5 Phẩm Chất', percentage: progress.qualities.percentage },
          { id: 'COMPETENCIES', label: '3. Năng Lực Cốt Lõi', percentage: progress.competencies.percentage },
          { id: 'SUMMARY', label: '4. Tổng Hợp & Lời Nhận Xét', percentage: progress.comments.percentage },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-9 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-800'
                }`}
              >
                {tab.percentage}%
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Controls & Table Segmentation Bar (Team Filter + Focus Mode + Pagination) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Team Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => {
                setSelectedTeamFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                selectedTeamFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🌟 Tất Cả ({students.length})
            </button>

            {Array.from({ length: numTeams }).map((_, i) => {
              const teamId = i + 1;
              return (
                <button
                  key={teamId}
                  onClick={() => {
                    setSelectedTeamFilter(teamId);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                    selectedTeamFilter === teamId
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tổ {teamId}
                </button>
              );
            })}
          </div>

          {/* Mode Selector & Page Size */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'SUBJECTS' && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setViewMode('MATRIX')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    viewMode === 'MATRIX' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ma Trận Tất Cả Môn</span>
                </button>
                <button
                  onClick={() => setViewMode('FOCUS')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    viewMode === 'FOCUS' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chấm Tập Trung 1 Môn</span>
                </button>
              </div>
            )}

            {/* Page Size Selector */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400 text-[11px]">Dòng/trang:</span>
              {[15, 30, 'ALL'].map((size) => (
                <button
                  key={String(size)}
                  onClick={() => {
                    setPageSize(size as any);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-lg font-bold cursor-pointer ${
                    pageSize === size ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {size === 'ALL' ? 'Tất cả' : size}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm tên học sinh..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-36 sm:w-44 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Single Subject Focus Mode Subject Selector Bar */}
        {activeTab === 'SUBJECTS' && viewMode === 'FOCUS' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-slate-700 shrink-0 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Chọn môn chấm:</span>
            </span>
            {subjects.map((sub) => (
              <button
                key={sub.code}
                onClick={() => setFocusSubjectCode(sub.code)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  focusSubjectCode === sub.code
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sub.shortName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: SUBJECTS ASSESSMENT */}
      {activeTab === 'SUBJECTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {viewMode === 'MATRIX' ? (
            /* 1A. FULL MATRIX TABLE (WITH STICKY COLUMNS) */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-20 border-r border-slate-200">
                      STT
                    </th>
                    <th className="py-3 px-3 w-40 sm:w-48 sticky left-10 bg-slate-50 z-20 border-r border-slate-200 shadow-xs">
                      Họ và Tên
                    </th>
                    {subjects.map((sub) => (
                      <th key={sub.code} className="py-2.5 px-3 text-center border-r border-slate-200 min-w-[135px]">
                        <div className="font-bold text-slate-800">{sub.shortName}</div>
                        <div className="flex items-center justify-center space-x-1 mt-1">
                          <button
                            type="button"
                            onClick={() => handleBatchSubject(sub.code, 'T')}
                            title="Đặt tất cả là T (Hoàn thành tốt)"
                            className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] hover:bg-emerald-200 font-bold cursor-pointer"
                          >
                            Tất cả T
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchSubject(sub.code, 'H')}
                            title="Đặt tất cả là H (Hoàn thành)"
                            className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] hover:bg-blue-200 font-bold cursor-pointer"
                          >
                            Tất cả H
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((st, idx) => {
                    const globalIdx = (currentPage - 1) * (pageSize === 'ALL' ? 0 : pageSize) + idx + 1;
                    const stIssues = getStudentIssues(st.id).filter((i) => i.category === 'SUBJECTS');

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                          {globalIdx}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 border-r border-slate-100 truncate max-w-[190px] shadow-2xs">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate">{st.fullName}</span>
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                              T{st.teamId}
                            </span>
                          </div>
                        </td>

                        {subjects.map((sub, sIdx) => {
                          const data = getSubjectData(st.id, sub.code);
                          const currentLevel: SubjectLevel = data?.level || 'H';
                          const currentScore = data?.score !== undefined ? data.score : '';

                          return (
                            <td key={sub.code} className="py-2 px-2 text-center border-r border-slate-100">
                              <div className="flex items-center justify-center space-x-1.5">
                                <select
                                  id={`sub-select-${idx}-${sIdx}`}
                                  value={currentLevel}
                                  onKeyDown={(e) =>
                                    handleSubjectKeyDown(e, idx, sIdx, st.id, sub.code)
                                  }
                                  onChange={(e) =>
                                    updateSubjectAssessment(
                                      st.id,
                                      sub.code,
                                      currentTerm,
                                      e.target.value as SubjectLevel,
                                      data?.score,
                                      data?.comment
                                    )
                                  }
                                  className={`px-2 py-1 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all cursor-pointer ${getLevelBadgeClass(
                                    currentLevel
                                  )}`}
                                >
                                  <option value="T">T (Tốt)</option>
                                  <option value="H">H (Đạt)</option>
                                  <option value="C">C (Cố gắng)</option>
                                </select>

                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="10"
                                  placeholder="Điểm"
                                  title="Điểm kiểm tra/bài tập (0-10)"
                                  value={currentScore}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      st.id,
                                      sub.code,
                                      e.target.value,
                                      currentLevel,
                                      data?.comment
                                    )
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-mono font-bold text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50 hover:bg-white"
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* 1B. SINGLE SUBJECT FOCUS STUDIO (DEEP DETAILED GRADING & COMMENTS) */
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    📖
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Chấm Tập Trung: {selectedFocusSubject.name} ({selectedFocusSubject.code})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Đánh giá linh hoạt: Điểm số (0 - 10), mức đạt (T/H/C) và nhận xét dạng lời chi tiết
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsSyncQuizModalOpen(true)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tổng Hợp Trắc Nghiệm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Nhập Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tải Mẫu Excel</span>
                  </button>
                  <button
                    onClick={() => handleBatchSubject(selectedFocusSubject.code, 'T')}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 cursor-pointer"
                  >
                    Tất cả T
                  </button>
                  <button
                    onClick={() => handleBatchSubject(selectedFocusSubject.code, 'H')}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200 cursor-pointer"
                  >
                    Tất cả H
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">STT</th>
                      <th className="py-3 px-3 w-48">Học Sinh</th>
                      <th className="py-3 px-3 text-center w-24">Tổ</th>
                      <th className="py-3 px-3 text-center w-36">Mức ĐG (T/H/C)</th>
                      <th className="py-3 px-3 text-center w-28">Điểm Số (0 - 10)</th>
                      <th className="py-3 px-3">Lời Nhận Xét Môn Học Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.map((st, idx) => {
                      const globalIdx = (currentPage - 1) * (pageSize === 'ALL' ? 0 : pageSize) + idx + 1;
                      const data = getSubjectData(st.id, selectedFocusSubject.code);
                      const currentLevel: SubjectLevel = data?.level || 'H';
                      const currentScore = data?.score !== undefined ? data.score : '';
                      const currentComment = data?.comment || '';

                      return (
                        <tr key={st.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">{globalIdx}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{st.fullName}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                              Tổ {st.teamId}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <select
                              value={currentLevel}
                              onChange={(e) =>
                                updateSubjectAssessment(
                                  st.id,
                                  selectedFocusSubject.code,
                                  currentTerm,
                                  e.target.value as SubjectLevel,
                                  data?.score,
                                  currentComment
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${getLevelBadgeClass(
                                currentLevel
                              )}`}
                            >
                              <option value="T">T (Hoàn thành tốt)</option>
                              <option value="H">H (Hoàn thành)</option>
                              <option value="C">C (Chưa hoàn thành)</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="10"
                              placeholder="Điểm"
                              value={currentScore}
                              onChange={(e) =>
                                handleScoreChange(
                                  st.id,
                                  selectedFocusSubject.code,
                                  e.target.value,
                                  currentLevel,
                                  currentComment
                                )
                              }
                              className="w-16 px-2 py-1.5 text-center font-mono font-bold text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                placeholder="Nhập lời nhận xét hoặc bấm Micro đọc..."
                                value={currentComment}
                                onChange={(e) =>
                                  updateSubjectAssessment(
                                    st.id,
                                    selectedFocusSubject.code,
                                    currentTerm,
                                    currentLevel,
                                    data?.score,
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:ring-2 focus:ring-blue-500"
                              />
                              <VoiceInputButton
                                size="sm"
                                onResult={(text) => {
                                  const newComment = currentComment ? `${currentComment} ${text}` : text;
                                  updateSubjectAssessment(
                                    st.id,
                                    selectedFocusSubject.code,
                                    currentTerm,
                                    currentLevel,
                                    data?.score,
                                    newComment
                                  );
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUALITIES ASSESSMENT (5 PHẨM CHẤT) */}
      {activeTab === 'QUALITIES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-20 border-r border-slate-200">
                    STT
                  </th>
                  <th className="py-3 px-3 w-40 sm:w-48 sticky left-10 bg-slate-50 z-20 border-r border-slate-200 shadow-xs">
                    Họ và Tên
                  </th>
                  {qualities.map((q) => (
                    <th key={q.code} className="py-2.5 px-3 text-center border-r border-slate-200 min-w-[130px]">
                      <div className="font-bold text-slate-800">{q.shortName}</div>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleBatchTrait(q.code, 'T')}
                          className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] hover:bg-emerald-200 font-bold cursor-pointer"
                        >
                          Tất cả T
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBatchTrait(q.code, 'Đ')}
                          className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] hover:bg-blue-200 font-bold cursor-pointer"
                        >
                          Tất cả Đ
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((st, idx) => {
                  const globalIdx = (currentPage - 1) * (pageSize === 'ALL' ? 0 : pageSize) + idx + 1;
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                        {globalIdx}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 border-r border-slate-100 truncate max-w-[190px] shadow-2xs">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate">{st.fullName}</span>
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                            T{st.teamId}
                          </span>
                        </div>
                      </td>

                      {qualities.map((q, qIdx) => {
                        const data = getTraitData(st.id, q.code);
                        const currentLevel: TraitLevel = data?.level || 'Đ';

                        return (
                          <td key={q.code} className="py-2 px-2 text-center border-r border-slate-100">
                            <select
                              id={`trait-select-${idx}-${qIdx}`}
                              value={currentLevel}
                              onKeyDown={(e) =>
                                handleTraitKeyDown(e, idx, qIdx, st.id, q.code, 'PHAM_CHAT')
                              }
                              onChange={(e) =>
                                updateTraitAssessment(
                                  st.id,
                                  q.code,
                                  'PHAM_CHAT',
                                  currentTerm,
                                  e.target.value as TraitLevel
                                )
                              }
                              className={`px-3 py-1 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all cursor-pointer ${getLevelBadgeClass(
                                currentLevel
                              )}`}
                            >
                              <option value="T">T (Tốt)</option>
                              <option value="Đ">Đ (Đạt)</option>
                              <option value="C">C (Cố gắng)</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMPETENCIES ASSESSMENT (NĂNG LỰC CỐT LÕI) */}
      {activeTab === 'COMPETENCIES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-20 border-r border-slate-200">
                    STT
                  </th>
                  <th className="py-3 px-3 w-40 sm:w-48 sticky left-10 bg-slate-50 z-20 border-r border-slate-200 shadow-xs">
                    Họ và Tên
                  </th>
                  {[...generalCompetencies, ...specialCompetencies].map((c) => (
                    <th key={c.code} className="py-2.5 px-3 text-center border-r border-slate-200 min-w-[130px]">
                      <div className="font-bold text-slate-800">{c.shortName}</div>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleBatchTrait(c.code, 'T')}
                          className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] hover:bg-emerald-200 font-bold cursor-pointer"
                        >
                          Tất cả T
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBatchTrait(c.code, 'Đ')}
                          className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] hover:bg-blue-200 font-bold cursor-pointer"
                        >
                          Tất cả Đ
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((st, idx) => {
                  const globalIdx = (currentPage - 1) * (pageSize === 'ALL' ? 0 : pageSize) + idx + 1;
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                        {globalIdx}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 border-r border-slate-100 truncate max-w-[190px] shadow-2xs">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate">{st.fullName}</span>
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                            T{st.teamId}
                          </span>
                        </div>
                      </td>

                      {[...generalCompetencies, ...specialCompetencies].map((c, cIdx) => {
                        const data = getTraitData(st.id, c.code);
                        const currentLevel: TraitLevel = data?.level || 'Đ';

                        return (
                          <td key={c.code} className="py-2 px-2 text-center border-r border-slate-100">
                            <select
                              id={`comp-select-${idx}-${cIdx}`}
                              value={currentLevel}
                              onKeyDown={(e) =>
                                handleTraitKeyDown(e, idx, cIdx, st.id, c.code, c.category)
                              }
                              onChange={(e) =>
                                updateTraitAssessment(
                                  st.id,
                                  c.code,
                                  c.category,
                                  currentTerm,
                                  e.target.value as TraitLevel
                                )
                              }
                              className={`px-3 py-1 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all cursor-pointer ${getLevelBadgeClass(
                                currentLevel
                              )}`}
                            >
                              <option value="T">T (Tốt)</option>
                              <option value="Đ">Đ (Đạt)</option>
                              <option value="C">C (Cố gắng)</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUMMARY & AWARDS WITH VOICE INPUT */}
      {activeTab === 'SUMMARY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  Tổng Hợp Đánh Giá & Khen Thưởng Theo Điều 13 - Thông Tư 27
                </h3>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                  Dữ liệu chuẩn cho AI
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động tổng hợp kết quả môn học (T/H/C, Điểm số), 5 phẩm chất và 10 năng lực chuẩn TT27 — Sẵn sàng cho Trợ lý AI sinh nhận xét học bạ.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/ai-assistant"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="Mở Trợ lý AI tự động sinh nhận xét học bạ theo chuẩn TT27"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Sinh Nhận Xét Bằng AI</span>
              </Link>
              <button
                type="button"
                onClick={handleRecalculateAwards}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Tính Lại Danh Hiệu
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">STT</th>
                  <th className="py-3 px-3 w-44">Họ và Tên</th>
                  <th className="py-3 px-3 w-28 text-center">Mức Học Tập</th>
                  <th className="py-3 px-3 w-28 text-center">Mức PC & NL</th>
                  <th className="py-3 px-3 w-44">Danh Hiệu Khen Thưởng</th>
                  <th className="py-3 px-3">Lời Nhận Xét Học Bạ (Có thể đọc bằng Micro 🎤)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((st, idx) => {
                  const globalIdx = (currentPage - 1) * (pageSize === 'ALL' ? 0 : pageSize) + idx + 1;
                  const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                  const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                  const summary = termSummaries.find((s) => s.studentId === st.id && s.term === currentTerm);
                  const evalRes = evaluateStudentTT27(sAss, tAss, currentTerm);
                  const award = summary?.awardTitle || evalRes.awardTitle;
                  const comment = summary?.teacherComment || '';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-medium text-slate-400">{globalIdx}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        <div className="flex items-center justify-between gap-1">
                          <span>{st.fullName}</span>
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                            T{st.teamId}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-bold">
                          {evalRes.overallLearningLevel === 'T' ? 'Tốt (T)' : evalRes.overallLearningLevel === 'H' ? 'Hoàn thành (H)' : 'Chưa HT (C)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg font-bold">
                          {evalRes.overallTraitsLevel === 'T' ? 'Tốt (T)' : evalRes.overallTraitsLevel === 'Đ' ? 'Đạt (Đ)' : 'Cố gắng (C)'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-xl border text-xs font-bold inline-block ${getAwardBadgeClass(award)}`}>
                          {award}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            placeholder="Nhập nhận xét hoặc bấm Micro để đọc..."
                            value={comment}
                            onChange={(e) =>
                              updateTermSummary(st.id, currentTerm, { teacherComment: e.target.value })
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50/50 hover:bg-white"
                          />
                          <VoiceInputButton
                            size="sm"
                            onResult={(text) => {
                              const newComment = comment ? `${comment} ${text}` : text;
                              updateTermSummary(st.id, currentTerm, { teacherComment: newComment });
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination Bar */}
      {pageSize !== 'ALL' && totalPages > 1 && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Hiển thị <strong>{(currentPage - 1) * (pageSize as number) + 1} - {Math.min(currentPage * (pageSize as number), filteredStudents.length)}</strong> trên tổng số <strong>{filteredStudents.length}</strong> học sinh
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer flex items-center gap-1 font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            <span className="px-3 font-bold text-slate-800">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer flex items-center gap-1 font-bold"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* GUARDRAILS MODAL */}
      <GuardrailsAlertModal
        isOpen={isGuardrailsModalOpen}
        onClose={() => setIsGuardrailsModalOpen(false)}
        issues={issues}
        onNavigateToStudent={(studentId, category) => {
          setActiveTab(category);
        }}
      />

      {/* SYNC ONLINE QUIZ / HOMEWORK SCORES MODAL */}
      <SyncQuizScoresModal
        isOpen={isSyncQuizModalOpen}
        onClose={() => setIsSyncQuizModalOpen(false)}
        subjects={subjects}
        currentSubjectCode={focusSubjectCode}
        students={students}
        homeworks={homeworks}
        quizSubmissions={quizSubmissions}
        currentTerm={currentTerm}
        onApply={(updates) => {
          batchUpdateSubjectAssessments(updates);
        }}
      />

      {/* IMPORT SUBJECT SCORES FROM EXCEL MODAL */}
      <ImportSubjectScoresModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        subjects={subjects}
        currentSubjectCode={focusSubjectCode}
        students={students}
        currentTerm={currentTerm}
        onImportSuccess={(subjectCode, updates) => {
          batchUpdateSubjectAssessments(updates);
        }}
        onOpenExportTemplate={() => {
          setIsImportModalOpen(false);
          setIsExportModalOpen(true);
        }}
      />

      {/* EXPORT SUBJECT TEMPLATE MODAL */}
      <ExportSubjectTemplateModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        classInfo={classInfo}
        students={students}
        subjects={subjects}
        currentSubjectCode={focusSubjectCode}
        subjectAssessments={subjectAssessments}
        currentTerm={currentTerm}
      />

      {/* AI CLASS DIAGNOSTIC MODAL */}
      <AIClassDiagnosticModal
        isOpen={isAIDiagnosticOpen}
        onClose={() => setIsAIDiagnosticOpen(false)}
      />
    </div>
  );
}
