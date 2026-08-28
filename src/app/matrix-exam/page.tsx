"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Printer,
  Copy,
  Sparkles,
  Layers,
  CheckCircle2,
  FileText,
  HelpCircle,
  Award,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  X,
  Upload,
  Download,
  CheckSquare,
  Square,
  Wand2,
  FileSpreadsheet,
  BarChart3,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { TERMS, PRIMARY_SUBJECTS } from '@/lib/tt27-engine';
import { TermType, GradeLevel } from '@/types';
import {
  ExamQuestion,
  INITIAL_QUESTION_BANK,
  TT27Level,
  QuestionType,
} from '@/lib/question-bank-data';
import {
  exportQuestionsToExcel,
  downloadQuestionBankTemplate,
} from '@/lib/question-bank-importer';
import { ImportQuestionBankModal } from '@/components/matrix-exam/import-question-bank-modal';
import { AssignQuizModal } from '@/components/quiz/assign-quiz-modal';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'gvcn_pro_question_bank_v2';

const SUBJECT_CONFIGS = [
  { code: 'TOAN', name: 'Môn Toán', icon: '📐', strands: ['Số và phép tính', 'Hình học và đo lường', 'Một số yếu tố Thống kê và Xác suất', 'Giải toán thực tế'] },
  { code: 'TIENG_VIET', name: 'Môn Tiếng Việt', icon: '📖', strands: ['Đọc hiểu văn bản', 'Luyện từ và câu', 'Chính tả & Quy tắc', 'Tập làm văn'] },
  { code: 'KHOA_HOC', name: 'Môn Khoa học', icon: '🔬', strands: ['Chất và sự biến đổi của chất', 'Năng lượng & Đời sống', 'Thực vật và động vật', 'Con người và sức khỏe'] },
  { code: 'LICH_SU_DIA_LY', name: 'Môn Lịch sử & Địa lý', icon: '🗺️', strands: ['Địa lý Việt Nam', 'Lịch sử Việt Nam', 'Địa phương và thế giới'] },
];

export default function MatrixExamPage() {
  const { classInfo, schoolInfo, currentTerm } = useAppStore();

  const [questions, setQuestions] = useState<ExamQuestion[]>(INITIAL_QUESTION_BANK);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(classInfo.grade || 4);
  const [selectedSubject, setSelectedSubject] = useState<string>('TOAN');
  const [selectedTerm, setSelectedTerm] = useState<TermType>(currentTerm || 'GIUA_HK1');
  const [activeTab, setActiveTab] = useState<'BANK' | 'MATRIX' | 'EXAM' | 'ANSWER'>('BANK');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrand, setSelectedStrand] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<'ALL' | TT27Level>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | QuestionType>('ALL');
  const [showAnswersInBank, setShowAnswersInBank] = useState(true);

  // Bulk Selection State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);

  // Question Form State
  const [questionForm, setQuestionForm] = useState<{
    subjectCode: string;
    grade: GradeLevel;
    term: TermType;
    strand: string;
    level: TT27Level;
    type: QuestionType;
    content: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    essayAnswer: string;
    points: number;
    explanation: string;
  }>({
    subjectCode: 'TOAN',
    grade: 4,
    term: 'GIUA_HK1',
    strand: 'Số và phép tính',
    level: 'MUC_1',
    type: 'MULTIPLE_CHOICE',
    content: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    essayAnswer: '',
    points: 1.0,
    explanation: '',
  });

  // AI Modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // Load saved questions & Live fetch from Supabase
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setQuestions(JSON.parse(saved));
      }
    } catch (e) {}

    supabase
      .from('MatrixQuestion')
      .select('*')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: ExamQuestion[] = data.map((q: any) => ({
            id: q.id,
            subjectCode: q.subjectCode,
            grade: q.grade,
            term: q.term,
            strand: q.topic || q.strand || 'Chung',
            level: (q.level === 1 ? 'MUC_1' : q.level === 2 ? 'MUC_2' : 'MUC_3') as TT27Level,
            type: q.type === 'MCQ' || q.type === 'MULTIPLE_CHOICE' ? 'MULTIPLE_CHOICE' : 'ESSAY',
            content: q.questionText || q.content,
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer,
            points: Number(q.points || 1),
            explanation: q.explanation,
            createdAt: q.createdAt,
          }));
          setQuestions((prev) => {
            const dbIds = new Set(mapped.map((m) => m.id));
            const localOnly = prev.filter((p) => !dbIds.has(p.id));
            return [...mapped, ...localOnly];
          });
        }
      });
  }, []);

  const saveQuestions = (newQuestions: ExamQuestion[]) => {
    setQuestions(newQuestions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuestions));
    } catch (e) {}

    const dbRows = newQuestions.map((q) => ({
      id: q.id,
      grade: q.grade,
      subjectCode: q.subjectCode,
      term: q.term,
      topic: q.strand,
      level: q.level === 'MUC_1' ? 1 : q.level === 'MUC_2' ? 2 : 3,
      type: q.type === 'MULTIPLE_CHOICE' ? 'MCQ' : 'ESSAY',
      questionText: q.content,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      points: q.points,
      createdAt: q.createdAt,
    }));
    supabase.from('MatrixQuestion').upsert(dbRows).then();
  };

  const termObj = TERMS.find((t) => t.id === selectedTerm);
  const termName = termObj?.name || selectedTerm;
  const currentSubjectObj = SUBJECT_CONFIGS.find((s) => s.code === selectedSubject) || SUBJECT_CONFIGS[0];

  // Questions for active subject & grade
  const currentSubjectQuestions = useMemo(() => {
    return questions.filter(
      (q) => q.subjectCode === selectedSubject && q.grade === selectedGrade
    );
  }, [questions, selectedSubject, selectedGrade]);

  // Filtered Questions for display in Bank
  const filteredBankQuestions = useMemo(() => {
    return currentSubjectQuestions.filter((q) => {
      const matchStrand = selectedStrand === 'ALL' || q.strand === selectedStrand;
      const matchLevel = filterLevel === 'ALL' || q.level === filterLevel;
      const matchType = filterType === 'ALL' || q.type === filterType;
      const matchSearch =
        q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.strand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.explanation || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchStrand && matchLevel && matchType && matchSearch;
    });
  }, [currentSubjectQuestions, selectedStrand, filterLevel, filterType, searchQuery]);

  // Exam Questions: either user selected or matching term
  const examQuestions = useMemo(() => {
    if (selectedQuestionIds.size > 0) {
      return currentSubjectQuestions.filter((q) => selectedQuestionIds.has(q.id));
    }
    const matchingTerm = currentSubjectQuestions.filter((q) => q.term === selectedTerm);
    return matchingTerm.length > 0 ? matchingTerm : currentSubjectQuestions.slice(0, 7);
  }, [currentSubjectQuestions, selectedQuestionIds, selectedTerm]);

  // TT27 Distribution Metrics
  const matrixStats = useMemo(() => {
    const muc1Pts = examQuestions.filter((q) => q.level === 'MUC_1').reduce((s, q) => s + q.points, 0);
    const muc2Pts = examQuestions.filter((q) => q.level === 'MUC_2').reduce((s, q) => s + q.points, 0);
    const muc3Pts = examQuestions.filter((q) => q.level === 'MUC_3').reduce((s, q) => s + q.points, 0);
    const totalPts = muc1Pts + muc2Pts + muc3Pts;

    const muc1Pct = totalPts > 0 ? Math.round((muc1Pts / totalPts) * 100) : 0;
    const muc2Pct = totalPts > 0 ? Math.round((muc2Pts / totalPts) * 100) : 0;
    const muc3Pct = totalPts > 0 ? Math.round((muc3Pts / totalPts) * 100) : 0;

    return {
      totalQuestions: examQuestions.length,
      muc1Pts,
      muc2Pts,
      muc3Pts,
      totalPts,
      muc1Pct,
      muc2Pct,
      muc3Pct,
      isBalanced: totalPts === 10 && muc1Pct >= 35 && muc1Pct <= 45 && muc2Pct >= 25 && muc2Pct <= 35,
    };
  }, [examQuestions]);

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedQuestionIds.size === filteredBankQuestions.length) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(filteredBankQuestions.map((q) => q.id)));
    }
  };

  const handleToggleQuestion = (id: string) => {
    const next = new Set(selectedQuestionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedQuestionIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedQuestionIds.size === 0) return;
    if (confirm(`Thầy/Cô có chắc chắn muốn xóa ${selectedQuestionIds.size} câu hỏi đã chọn không?`)) {
      const updated = questions.filter((q) => !selectedQuestionIds.has(q.id));
      saveQuestions(updated);
      setSelectedQuestionIds(new Set());
      toast.success('Đã xóa các câu hỏi đã chọn!');
    }
  };

  const handleBulkExportExcel = () => {
    const target = selectedQuestionIds.size > 0
      ? currentSubjectQuestions.filter((q) => selectedQuestionIds.has(q.id))
      : currentSubjectQuestions;

    exportQuestionsToExcel(target, currentSubjectObj.name, selectedGrade);
    toast.success(`Đã xuất file Excel gồm ${target.length} câu hỏi môn ${currentSubjectObj.name}!`);
  };

  // 1-Click Smart Exam Auto Assembler (Lắp ráp đề thi 10 điểm)
  const handleAutoAssembleExam = () => {
    const muc1Pool = currentSubjectQuestions.filter((q) => q.level === 'MUC_1');
    const muc2Pool = currentSubjectQuestions.filter((q) => q.level === 'MUC_2');
    const muc3Pool = currentSubjectQuestions.filter((q) => q.level === 'MUC_3');

    if (muc1Pool.length === 0 || muc2Pool.length === 0 || muc3Pool.length === 0) {
      toast.error('Cần có đủ câu hỏi Mức 1, Mức 2 và Mức 3 trong ngân hàng để tự động lắp ráp!');
      return;
    }

    const selected = new Set<string>();
    // Pick 4.0 pts of Level 1 (e.g. 4 MC questions of 1pt each)
    let pts1 = 0;
    for (const q of muc1Pool) {
      if (pts1 + q.points <= 4.0) {
        selected.add(q.id);
        pts1 += q.points;
      }
      if (pts1 >= 4.0) break;
    }

    // Pick 3.0 pts of Level 2
    let pts2 = 0;
    for (const q of muc2Pool) {
      if (pts2 + q.points <= 3.0) {
        selected.add(q.id);
        pts2 += q.points;
      }
      if (pts2 >= 3.0) break;
    }

    // Pick 3.0 pts of Level 3
    let pts3 = 0;
    for (const q of muc3Pool) {
      if (pts3 + q.points <= 3.0) {
        selected.add(q.id);
        pts3 += q.points;
      }
      if (pts3 >= 3.0) break;
    }

    setSelectedQuestionIds(selected);
    setActiveTab('EXAM');
    toast.success(`Đã tự động lắp ráp đề thi chuẩn 10 điểm (${selected.size} câu hỏi TT27)!`);
  };

  // Save Single Question
  const handleOpenQuestionModal = (q?: ExamQuestion) => {
    if (q) {
      setEditingQuestion(q);
      setQuestionForm({
        subjectCode: q.subjectCode,
        grade: q.grade,
        term: q.term,
        strand: q.strand,
        level: q.level,
        type: q.type,
        content: q.content,
        optionA: q.options?.[0]?.replace(/^A[.)\s]*/, '') || '',
        optionB: q.options?.[1]?.replace(/^B[.)\s]*/, '') || '',
        optionC: q.options?.[2]?.replace(/^C[.)\s]*/, '') || '',
        optionD: q.options?.[3]?.replace(/^D[.)\s]*/, '') || '',
        correctOption: q.correctAnswer || 'A',
        essayAnswer: q.type === 'ESSAY' ? q.correctAnswer : '',
        points: q.points,
        explanation: q.explanation || '',
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        subjectCode: selectedSubject,
        grade: selectedGrade,
        term: selectedTerm,
        strand: currentSubjectObj.strands[0] || 'Kiến thức chung',
        level: 'MUC_1',
        type: 'MULTIPLE_CHOICE',
        content: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        essayAnswer: '',
        points: 1.0,
        explanation: '',
      });
    }
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.content.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    const options =
      questionForm.type === 'MULTIPLE_CHOICE'
        ? [
            `A. ${questionForm.optionA.trim()}`,
            `B. ${questionForm.optionB.trim()}`,
            `C. ${questionForm.optionC.trim()}`,
            `D. ${questionForm.optionD.trim()}`,
          ]
        : undefined;

    const correctAnswer =
      questionForm.type === 'MULTIPLE_CHOICE'
        ? questionForm.correctOption
        : questionForm.essayAnswer.trim();

    if (editingQuestion) {
      const updated = questions.map((q) =>
        q.id === editingQuestion.id
          ? {
              ...q,
              subjectCode: questionForm.subjectCode,
              grade: questionForm.grade,
              term: questionForm.term,
              strand: questionForm.strand.trim(),
              level: questionForm.level,
              type: questionForm.type,
              content: questionForm.content.trim(),
              options,
              correctAnswer,
              points: Number(questionForm.points),
              explanation: questionForm.explanation.trim(),
            }
          : q
      );
      saveQuestions(updated);
      toast.success('Đã cập nhật câu hỏi!');
    } else {
      const newQ: ExamQuestion = {
        id: `q-custom-${Date.now()}`,
        subjectCode: questionForm.subjectCode,
        grade: questionForm.grade,
        term: questionForm.term,
        strand: questionForm.strand.trim() || 'Kiến thức chung',
        level: questionForm.level,
        type: questionForm.type,
        content: questionForm.content.trim(),
        options,
        correctAnswer,
        points: Number(questionForm.points),
        explanation: questionForm.explanation.trim(),
        createdAt: new Date().toISOString(),
      };
      saveQuestions([newQ, ...questions]);
      toast.success('Đã thêm câu hỏi vào ngân hàng!');
    }

    setIsQuestionModalOpen(false);
  };

  const handleImportSuccess = (newQuestions: ExamQuestion[]) => {
    saveQuestions([...newQuestions, ...questions]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyExam = () => {
    const text = examQuestions
      .map((q, idx) => {
        let optStr = '';
        if (q.type === 'MULTIPLE_CHOICE' && q.options) {
          optStr = '\n' + q.options.join('\n');
        }
        return `Câu ${idx + 1} (${q.level === 'MUC_1' ? 'Mức 1' : q.level === 'MUC_2' ? 'Mức 2' : 'Mức 3'} - ${q.points}đ): ${q.content}${optStr}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(
      `🏫 ĐỀ KIỂM TRA ĐỊNH KỲ ${termName.toUpperCase()} — MÔN ${currentSubjectObj.name.toUpperCase()} LỚP ${selectedGrade}\n\n${text}`
    );
    toast.success(`Đã sao chép Đề kiểm tra môn ${currentSubjectObj.name}!`);
  };

  return (
    <div className="space-y-6 print:p-0 print:m-0">
      {/* 1. TOP HEADER & CONTROLS (HIDDEN IN PRINT) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            <span>Ngân Hàng Câu Hỏi & Đề Thi TT27 Toàn Diện</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hỗ trợ quản lý hàng ngàn câu hỏi theo môn học, khối lớp, mạch kiến thức, import bộ đề thông minh và lắp ráp đề thi 3 mức độ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Grade Selector */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 shadow-xs"
          >
            {[1, 2, 3, 4, 5].map((g) => (
              <option key={g} value={g}>
                Khối Lớp {g}
              </option>
            ))}
          </select>

          {/* Term Selector */}
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value as TermType)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 shadow-xs"
          >
            {TERMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Bộ Đề</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Đề Thi (Ctrl + P)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Giao Bài Cho HS</span>
          </button>
        </div>
      </div>

      {/* 2. MULTI-SUBJECT TABS SWITCHER */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 print:hidden">
        {SUBJECT_CONFIGS.map((sub) => {
          const count = questions.filter(
            (q) => q.subjectCode === sub.code && q.grade === selectedGrade
          ).length;
          const isActive = selectedSubject === sub.code;

          return (
            <button
              key={sub.code}
              type="button"
              onClick={() => {
                setSelectedSubject(sub.code);
                setSelectedStrand('ALL');
                setSelectedQuestionIds(new Set());
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">{sub.icon}</span>
              <span>{sub.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count} câu
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN SECTION TABS */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold print:hidden">
        {[
          { id: 'BANK', label: `📚 Ngân Hàng Câu Hỏi (${filteredBankQuestions.length})` },
          { id: 'MATRIX', label: '📐 Ma Trận Đề 3 Mức Độ (TT27)' },
          { id: 'EXAM', label: `📝 Đề Kiểm Tra Hoàn Chỉnh (${examQuestions.length} câu • ${matrixStats.totalPts}đ)` },
          { id: 'ANSWER', label: '🎯 Hướng Dẫn Chấm & Biểu Điểm 10' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'BANK' | 'MATRIX' | 'EXAM' | 'ANSWER')}
            className={`h-9 px-4 flex items-center justify-center space-x-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: NGÂN HÀNG CÂU HỎI THEO MÔN & QUẢN LÝ HÀNG LOẠT (BULK CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'BANK' && (
        <div className="space-y-4">
          {/* Strand / Topic Quick Chips Filter */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Mạch kiến thức:
            </span>
            <button
              type="button"
              onClick={() => setSelectedStrand('ALL')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                selectedStrand === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tất cả ({currentSubjectQuestions.length})
            </button>
            {currentSubjectObj.strands.map((strand) => {
              const count = currentSubjectQuestions.filter((q) => q.strand === strand).length;
              return (
                <button
                  key={strand}
                  type="button"
                  onClick={() => setSelectedStrand(strand)}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    selectedStrand === strand
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {strand} ({count})
                </button>
              );
            })}
          </div>

          {/* Action Toolbar & Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search & Filters */}
              <div className="flex items-center space-x-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm câu hỏi theo nội dung, từ khóa..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value as 'ALL' | TT27Level)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700"
                >
                  <option value="ALL">Tất cả Mức độ</option>
                  <option value="MUC_1">Mức 1 (Nhận biết)</option>
                  <option value="MUC_2">Mức 2 (Kết nối)</option>
                  <option value="MUC_3">Mức 3 (Vận dụng)</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'ALL' | QuestionType)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 hidden sm:block"
                >
                  <option value="ALL">Tất cả Dạng</option>
                  <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                  <option value="ESSAY">Tự luận</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoAssembleExam}
                  className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>⚡ Lắp Ráp Đề 10đ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAnswersInBank(!showAnswersInBank)}
                  className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {showAnswersInBank ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAnswersInBank ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenQuestionModal()}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Câu Hỏi</span>
                </button>
              </div>
            </div>

            {/* Bulk Selection Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="inline-flex items-center space-x-1.5 font-bold text-slate-700 hover:text-indigo-600 cursor-pointer"
                >
                  {selectedQuestionIds.size === filteredBankQuestions.length && filteredBankQuestions.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    Chọn tất cả ({selectedQuestionIds.size}/{filteredBankQuestions.length} câu)
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedQuestionIds.size > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('EXAM')}
                      className="inline-flex items-center space-x-1 text-indigo-600 font-black hover:underline cursor-pointer"
                    >
                      <span>Xem đề từ {selectedQuestionIds.size} câu đã chọn →</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1 rounded-xl font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedQuestionIds.size})</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleBulkExportExcel}
                  className="inline-flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Question List Cards */}
          <div className="space-y-3">
            {filteredBankQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                  🔍
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Chưa có câu hỏi nào cho mục này</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Thầy/Cô có thể nạp ngay bộ đề mẫu hoặc import file Excel / dán văn bản từ Word.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    📥 Import Bộ Đề Ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenQuestionModal()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    + Thêm Câu Hỏi Thủ Công
                  </button>
                </div>
              </div>
            ) : (
              filteredBankQuestions.map((q, idx) => {
                const isSelected = selectedQuestionIds.has(q.id);
                const levelColor =
                  q.level === 'MUC_1'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : q.level === 'MUC_2'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-purple-100 text-purple-800 border-purple-300';

                const levelLabel =
                  q.level === 'MUC_1'
                    ? 'Mức 1 (Nhận biết)'
                    : q.level === 'MUC_2'
                    ? 'Mức 2 (Kết nối)'
                    : 'Mức 3 (Vận dụng)';

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-3xl p-5 border shadow-xs transition-all space-y-3 ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleQuestion(q.id)}
                          className="cursor-pointer text-slate-400 hover:text-indigo-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                        <span className="font-black text-xs text-indigo-950">Câu {idx + 1}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${levelColor}`}>
                          {levelLabel}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {q.strand}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                          {q.points} điểm
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenQuestionModal(q)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Xóa câu hỏi này?')) {
                              saveQuestions(questions.filter((item) => item.id !== q.id));
                              toast.success('Đã xóa câu hỏi!');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                      {q.content}
                    </p>

                    {/* Multiple Choice Options */}
                    {q.type === 'MULTIPLE_CHOICE' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const optKey = ['A', 'B', 'C', 'D'][oIdx];
                          const isCorrect = q.correctAnswer.toUpperCase().includes(optKey);
                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-2xl text-xs border transition-all ${
                                showAnswersInBank && isCorrect
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                                  : 'bg-slate-50/70 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span>{opt}</span>
                              {showAnswersInBank && isCorrect && (
                                <span className="ml-2 text-[10px] text-emerald-600 font-black">(Đáp án đúng)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Essay Answer / Explanation */}
                    {showAnswersInBank && (
                      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-[11px] text-indigo-900 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Đáp án & Hướng dẫn chấm:</span>
                        </div>
                        <p className="whitespace-pre-line text-slate-700 italic">
                          {q.correctAnswer}
                        </p>
                        {q.explanation && (
                          <p className="text-slate-500 text-[10px] pt-1">
                            * Ghi chú: {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: MA TRẬN 3 MỨC ĐỘ THÔNG TƯ 27 (MATRIX VIEW) */}
      {/* ========================================================================= */}
      {activeTab === 'MATRIX' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
              MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ MÔN {currentSubjectObj.name.toUpperCase()} — LỚP {selectedGrade}
            </h2>
            <p className="text-xs text-slate-600 italic">
              Đợt đánh giá: <strong>{termName}</strong> — Năm học: <strong>{schoolInfo.schoolYear || '2026-2027'}</strong>
            </p>
          </div>

          {/* Real-Time Balance Tracker */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Phân bổ điểm thực tế trong đề:</span>
              <span className={matrixStats.isBalanced ? 'text-emerald-600' : 'text-amber-600'}>
                Tổng: {matrixStats.totalPts}/10.0 điểm ({matrixStats.isBalanced ? 'Đạt chuẩn TT27' : 'Chưa cân bằng'})
              </span>
            </div>
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
              <div style={{ width: `${matrixStats.muc1Pct}%` }} className="bg-emerald-500 h-full" title={`Mức 1: ${matrixStats.muc1Pts}đ (${matrixStats.muc1Pct}%)`} />
              <div style={{ width: `${matrixStats.muc2Pct}%` }} className="bg-blue-500 h-full" title={`Mức 2: ${matrixStats.muc2Pts}đ (${matrixStats.muc2Pct}%)`} />
              <div style={{ width: `${matrixStats.muc3Pct}%` }} className="bg-purple-500 h-full" title={`Mức 3: ${matrixStats.muc3Pts}đ (${matrixStats.muc3Pct}%)`} />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-1">
              <span className="text-emerald-700">Mức 1: {matrixStats.muc1Pts}đ ({matrixStats.muc1Pct}%) • Chuẩn 40%</span>
              <span className="text-blue-700">Mức 2: {matrixStats.muc2Pts}đ ({matrixStats.muc2Pct}%) • Chuẩn 30%</span>
              <span className="text-purple-700">Mức 3: {matrixStats.muc3Pts}đ ({matrixStats.muc3Pct}%) • Chuẩn 30%</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-center">
                <tr>
                  <th className="p-3 border-r border-slate-200 w-12" rowSpan={2}>STT</th>
                  <th className="p-3 border-r border-slate-200 text-left" rowSpan={2}>Mạch kiến thức, kỹ năng</th>
                  <th className="p-2 border-r border-slate-200" colSpan={2}>Mức 1 (Nhận biết - 40%)</th>
                  <th className="p-2 border-r border-slate-200" colSpan={2}>Mức 2 (Kết nối - 30%)</th>
                  <th className="p-2 border-r border-slate-200" colSpan={2}>Mức 3 (Vận dụng - 30%)</th>
                  <th className="p-2" colSpan={2}>Tổng Cộng</th>
                </tr>
                <tr className="bg-slate-50 text-[11px]">
                  <th className="p-2 border-r border-slate-200">TN</th>
                  <th className="p-2 border-r border-slate-200">TL</th>
                  <th className="p-2 border-r border-slate-200">TN</th>
                  <th className="p-2 border-r border-slate-200">TL</th>
                  <th className="p-2 border-r border-slate-200">TN</th>
                  <th className="p-2 border-r border-slate-200">TL</th>
                  <th className="p-2 border-r border-slate-200">Số câu</th>
                  <th className="p-2">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {currentSubjectObj.strands.map((strand, idx) => (
                  <tr key={strand}>
                    <td className="p-3 border-r border-slate-200 font-bold">{idx + 1}</td>
                    <td className="p-3 border-r border-slate-200 text-left font-bold">{strand}</td>
                    <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                    <td className="p-2 border-r border-slate-200">—</td>
                    <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                    <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                    <td className="p-2 border-r border-slate-200">—</td>
                    <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                    <td className="p-2 border-r border-slate-200 font-bold">3 câu</td>
                    <td className="p-2 font-black text-indigo-700">3.0đ</td>
                  </tr>
                ))}
                <tr className="bg-indigo-50/70 font-black text-slate-900 border-t border-indigo-200">
                  <td className="p-3 border-r border-slate-200" colSpan={2}>TỔNG CỘNG ĐIỂM</td>
                  <td className="p-2 border-r border-slate-200" colSpan={2}>4.0 điểm (40%)</td>
                  <td className="p-2 border-r border-slate-200" colSpan={2}>3.0 điểm (30%)</td>
                  <td className="p-2 border-r border-slate-200" colSpan={2}>3.0 điểm (30%)</td>
                  <td className="p-2 border-r border-slate-200">{examQuestions.length} câu</td>
                  <td className="p-2 text-indigo-900 text-sm">10.0 ĐIỂM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: ĐỀ KIỂM TRA HOÀN CHỈNH IN PHÁT HỌC SINH (PRINT READY) */}
      {/* ========================================================================= */}
      {activeTab === 'EXAM' && (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xs space-y-6 font-serif print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start text-xs uppercase font-sans font-bold border-b pb-4 border-slate-200">
            <div className="text-left space-y-0.5">
              <p>{schoolInfo.departmentName?.toUpperCase() || 'PHÒNG GD&ĐT QUẬN NAM TỪ LIÊM'}</p>
              <p className="font-black text-blue-900">{schoolInfo.name.toUpperCase()}</p>
            </div>
            <div className="text-center space-y-0.5">
              <p className="font-black text-sm">ĐỀ KIỂM TRA ĐỊNH KỲ {termName.toUpperCase()}</p>
              <p className="font-bold">MÔN: {currentSubjectObj.name.toUpperCase()} — LỚP {selectedGrade}</p>
              <p className="italic font-normal text-[11px]">Thời gian làm bài: 40 phút (Không kể thời gian phát đề)</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-bold">NĂM HỌC 2026 - 2027</p>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 text-xs font-sans grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>Họ và tên: ................................................................</div>
            <div>Lớp: <strong>{classInfo.name}</strong></div>
            <div>Mã số: ....................</div>
            <div>Ngày kiểm tra: ..../..../2026</div>
          </div>

          {/* Score & Teacher Note Boxes */}
          <div className="grid grid-cols-2 gap-3 text-xs font-sans">
            <div className="border border-slate-300 rounded-xl p-3 text-center space-y-1">
              <p className="font-bold">ĐIỂM SỐ</p>
              <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center font-bold text-lg text-indigo-900">
                ..... / 10đ
              </div>
            </div>
            <div className="border border-slate-300 rounded-xl p-3 space-y-1">
              <p className="font-bold">NHẬN XÉT CỦA GIÁO VIÊN</p>
              <p className="text-[11px] text-slate-400 italic">.....................................................................................................</p>
              <p className="text-[11px] text-slate-400 italic">.....................................................................................................</p>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4 text-xs font-sans leading-relaxed">
            <div className="font-black uppercase text-indigo-950 border-b border-indigo-100 pb-1 flex justify-between">
              <span>NỘI DUNG ĐỀ KIỂM TRA ({examQuestions.length} Câu hỏi • Thang điểm 10)</span>
              <button
                type="button"
                onClick={handleCopyExam}
                className="text-indigo-600 hover:underline print:hidden cursor-pointer"
              >
                📋 Sao chép đề
              </button>
            </div>

            <div className="space-y-4 pl-2">
              {examQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-1.5">
                  <p className="font-bold text-slate-900">
                    Câu {idx + 1} ({q.level === 'MUC_1' ? 'Mức 1' : q.level === 'MUC_2' ? 'Mức 2' : 'Mức 3'} - {q.points} điểm): {q.content}
                  </p>
                  {q.type === 'MULTIPLE_CHOICE' && q.options && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="text-slate-800">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === 'ESSAY' && (
                    <div className="h-20 border border-dashed border-slate-200 rounded-xl p-2 text-slate-300 italic">
                      Bài làm: .........................................................................................................................................
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 4: ĐÁP ÁN & BIỂU ĐIỂM CHI TIẾT */}
      {/* ========================================================================= */}
      {activeTab === 'ANSWER' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
              HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM MÔN {currentSubjectObj.name.toUpperCase()} — LỚP {selectedGrade}
            </h2>
            <p className="text-xs text-slate-600 italic">
              Thang điểm 10 chuẩn Thông tư 27/2020/TT-BGDĐT
            </p>
          </div>

          <div className="space-y-4 text-xs font-sans">
            {examQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-indigo-950">
                    Câu {idx + 1} ({q.level === 'MUC_1' ? 'Mức 1' : q.level === 'MUC_2' ? 'Mức 2' : 'Mức 3'} - {q.points} điểm):
                  </strong>
                  <span className="text-[10px] text-slate-500 font-bold">{q.strand}</span>
                </div>
                <p className="text-slate-700 italic">{q.content}</p>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium">
                  <strong className="text-emerald-700">Đáp án / Hướng dẫn chấm:</strong> {q.correctAnswer}
                  {q.explanation && (
                    <p className="text-[10px] text-slate-500 pt-1">* Ghi chú: {q.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: IMPORT BỘ ĐỀ */}
      {/* ========================================================================= */}
      <ImportQuestionBankModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentSubject={selectedSubject}
        currentGrade={selectedGrade}
        currentTerm={selectedTerm}
        onImportSuccess={handleImportSuccess}
      />

      {/* ========================================================================= */}
      {/* 9. MODAL: THÊM / SỬA CÂU HỎI */}
      {/* ========================================================================= */}
      {isQuestionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsQuestionModalOpen(false)}
        >
          <div
            className="bg-white max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 bg-indigo-600 text-white flex items-center justify-between shrink-0">
              <h3 className="font-black text-sm sm:text-base">
                {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới Vào Ngân Hàng'}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Môn học:</label>
                  <select
                    value={questionForm.subjectCode}
                    onChange={(e) => setQuestionForm({ ...questionForm, subjectCode: e.target.value })}
                    className="w-full p-2 mt-1 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    {SUBJECT_CONFIGS.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Khối lớp:</label>
                  <select
                    value={questionForm.grade}
                    onChange={(e) => setQuestionForm({ ...questionForm, grade: Number(e.target.value) as GradeLevel })}
                    className="w-full p-2 mt-1 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    {[1, 2, 3, 4, 5].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Mức độ TT27:</label>
                  <select
                    value={questionForm.level}
                    onChange={(e) => setQuestionForm({ ...questionForm, level: e.target.value as TT27Level })}
                    className="w-full p-2 mt-1 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    <option value="MUC_1">Mức 1 (Nhận biết)</option>
                    <option value="MUC_2">Mức 2 (Kết nối/áp dụng)</option>
                    <option value="MUC_3">Mức 3 (Vận dụng cao)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Hình thức:</label>
                  <select
                    value={questionForm.type}
                    onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value as QuestionType })}
                    className="w-full p-2 mt-1 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                    <option value="ESSAY">Tự luận</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Mạch kiến thức:</label>
                  <input
                    type="text"
                    value={questionForm.strand}
                    onChange={(e) => setQuestionForm({ ...questionForm, strand: e.target.value })}
                    placeholder="VD: Số và phép tính, Luyện từ và câu..."
                    className="w-full p-2 mt-1 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Điểm số:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                    className="w-full p-2 mt-1 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Nội dung câu hỏi (*):</label>
                <textarea
                  rows={3}
                  value={questionForm.content}
                  onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                  placeholder="Nhập đề bài câu hỏi..."
                  className="w-full p-2.5 mt-1 rounded-xl border border-slate-200"
                  required
                />
              </div>

              {/* Multiple Choice Options */}
              {questionForm.type === 'MULTIPLE_CHOICE' ? (
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="font-bold text-slate-700">4 Phương án trắc nghiệm & Chọn đáp án đúng:</label>
                  {['A', 'B', 'C', 'D'].map((key) => {
                    const fieldKey = `option${key}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={questionForm.correctOption === key}
                          onChange={() => setQuestionForm({ ...questionForm, correctOption: key })}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="font-bold w-6">{key}.</span>
                        <input
                          type="text"
                          value={questionForm[fieldKey]}
                          onChange={(e) => setQuestionForm({ ...questionForm, [fieldKey]: e.target.value })}
                          placeholder={`Nội dung phương án ${key}...`}
                          className="flex-1 p-2 rounded-xl border border-slate-200 bg-white text-xs"
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700">Đáp án & Hướng dẫn chấm tự luận:</label>
                  <textarea
                    rows={3}
                    value={questionForm.essayAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, essayAnswer: e.target.value })}
                    placeholder="Nhập lời giải chi tiết và thang điểm từng bước..."
                    className="w-full p-2.5 mt-1 rounded-xl border border-slate-200"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700">Giải thích thêm (Tùy chọn):</label>
                <input
                  type="text"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Giải thích ngắn gọn quy tắc hoặc lưu ý..."
                  className="w-full p-2 mt-1 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  {editingQuestion ? 'Lưu Thay Đổi' : 'Thêm Vào Ngân Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL: GIAO BÀI TẬP TRẮC NGHIỆM ONLINE */}
      {/* ========================================================================= */}
      <AssignQuizModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedQuestions={examQuestions}
        subjectCode={selectedSubject}
        subjectName={currentSubjectObj.name}
      />
    </div>
  );
}
