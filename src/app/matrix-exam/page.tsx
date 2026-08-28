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
import { toast } from 'sonner';

const STORAGE_KEY = 'gvcn_pro_question_bank_v1';

export default function MatrixExamPage() {
  const { classInfo, schoolInfo, currentTerm, aiConfig } = useAppStore();

  const [questions, setQuestions] = useState<ExamQuestion[]>(INITIAL_QUESTION_BANK);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(classInfo.grade || 4);
  const [selectedSubject, setSelectedSubject] = useState<string>('TOAN');
  const [selectedTerm, setSelectedTerm] = useState<TermType>(currentTerm || 'GIUA_HK1');
  const [activeTab, setActiveTab] = useState<'BANK' | 'MATRIX' | 'EXAM' | 'ANSWER'>('BANK');

  // Filter state for Question Bank
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | TT27Level>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | QuestionType>('ALL');
  const [showAnswersInBank, setShowAnswersInBank] = useState(true);

  // Modal State for Add / Edit Question
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
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

  // AI Question Generator Modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // Load persisted questions
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setQuestions(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Save questions to localStorage
  const saveQuestions = (newQuestions: ExamQuestion[]) => {
    setQuestions(newQuestions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuestions));
    } catch (e) {}
  };

  const termObj = TERMS.find((t) => t.id === selectedTerm);
  const termName = termObj?.name || selectedTerm;
  const subjectObj = PRIMARY_SUBJECTS.find((s) => s.code === selectedSubject);
  const subjectName = subjectObj?.name || (selectedSubject === 'TOAN' ? 'Toán' : 'Tiếng Việt');

  // Filtered Questions for the Bank Tab
  const bankQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSubject = q.subjectCode === selectedSubject;
      const matchGrade = q.grade === selectedGrade;
      const matchLevel = filterLevel === 'ALL' || q.level === filterLevel;
      const matchType = filterType === 'ALL' || q.type === filterType;
      const matchSearch =
        q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.strand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.explanation || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchSubject && matchGrade && matchLevel && matchType && matchSearch;
    });
  }, [questions, selectedSubject, selectedGrade, filterLevel, filterType, searchQuery]);

  // Questions selected for Exam (matching Subject, Grade, Term)
  const examQuestions = useMemo(() => {
    const list = questions.filter(
      (q) => q.subjectCode === selectedSubject && q.grade === selectedGrade && q.term === selectedTerm
    );
    return list.length > 0
      ? list
      : questions.filter((q) => q.subjectCode === selectedSubject && q.grade === selectedGrade);
  }, [questions, selectedSubject, selectedGrade, selectedTerm]);

  // Metrics for Exam
  const examStats = useMemo(() => {
    const muc1Pts = examQuestions.filter((q) => q.level === 'MUC_1').reduce((s, q) => s + q.points, 0);
    const muc2Pts = examQuestions.filter((q) => q.level === 'MUC_2').reduce((s, q) => s + q.points, 0);
    const muc3Pts = examQuestions.filter((q) => q.level === 'MUC_3').reduce((s, q) => s + q.points, 0);
    const totalPts = muc1Pts + muc2Pts + muc3Pts;

    return {
      totalQuestions: examQuestions.length,
      muc1Pts,
      muc2Pts,
      muc3Pts,
      totalPts,
    };
  }, [examQuestions]);

  // Handle Open Add / Edit Modal
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
        optionA: q.options?.[0]?.replace(/^A\.\s*/, '') || '',
        optionB: q.options?.[1]?.replace(/^B\.\s*/, '') || '',
        optionC: q.options?.[2]?.replace(/^C\.\s*/, '') || '',
        optionD: q.options?.[3]?.replace(/^D\.\s*/, '') || '',
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
        strand: selectedSubject === 'TOAN' ? 'Số và phép tính' : 'Luyện từ và câu',
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
      toast.success('Đã cập nhật câu hỏi thành công!');
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
      toast.success('Đã thêm câu hỏi mới vào ngân hàng!');
    }

    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Thầy/Cô có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng không?')) {
      const updated = questions.filter((q) => q.id !== id);
      saveQuestions(updated);
      toast.success('Đã xóa câu hỏi!');
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Khôi phục toàn bộ Ngân hàng câu hỏi chuẩn Thông tư 27 của Bộ GD&ĐT?')) {
      saveQuestions(INITIAL_QUESTION_BANK);
      toast.success('Đã khôi phục Ngân hàng câu hỏi chuẩn!');
    }
  };

  // AI Question Generation
  const handleGenerateAIQuestions = async () => {
    setIsAIGenerating(true);
    try {
      const topic = aiTopicInput.trim() || 'Kiến thức trọng tâm đợt đánh giá';
      // Simulate/call AI generator
      const newAIQuestions: ExamQuestion[] = [
        {
          id: `q-ai-${Date.now()}-1`,
          subjectCode: selectedSubject,
          grade: selectedGrade,
          term: selectedTerm,
          strand: selectedSubject === 'TOAN' ? 'Số và phép tính' : 'Đọc hiểu & Luyện từ',
          level: 'MUC_1',
          type: 'MULTIPLE_CHOICE',
          content: `[AI Sinh] Câu hỏi nhận biết môn ${subjectName} lớp ${selectedGrade} về chủ đề "${topic}":`,
          options: ['A. Phương án chính xác nhất', 'B. Phương án gây nhiễu 1', 'C. Phương án gây nhiễu 2', 'D. Phương án gây nhiễu 3'],
          correctAnswer: 'A',
          points: 1.0,
          explanation: 'Mức 1 nhận biết kiến thức cơ bản theo chuẩn Thông tư 27.',
          createdAt: new Date().toISOString(),
        },
        {
          id: `q-ai-${Date.now()}-2`,
          subjectCode: selectedSubject,
          grade: selectedGrade,
          term: selectedTerm,
          strand: selectedSubject === 'TOAN' ? 'Hình học & Đo lường' : 'Luyện từ và câu',
          level: 'MUC_2',
          type: 'MULTIPLE_CHOICE',
          content: `[AI Sinh] Câu hỏi kết nối, áp dụng môn ${subjectName} lớp ${selectedGrade} về chủ đề "${topic}":`,
          options: ['A. Kết quả chưa chính xác', 'B. Kết quả chính xác sau khi biến đổi', 'C. Kết quả sai đơn vị', 'D. Kết quả tính toán nhầm'],
          correctAnswer: 'B',
          points: 1.0,
          explanation: 'Mức 2 kết nối giải quyết bài toán quen thuộc.',
          createdAt: new Date().toISOString(),
        },
        {
          id: `q-ai-${Date.now()}-3`,
          subjectCode: selectedSubject,
          grade: selectedGrade,
          term: selectedTerm,
          strand: selectedSubject === 'TOAN' ? 'Giải toán thực tế' : 'Tập làm văn sáng tạo',
          level: 'MUC_3',
          type: 'ESSAY',
          content: `[AI Sinh] Bài toán vận dụng nâng cao (Mức 3) môn ${subjectName} lớp ${selectedGrade} về chủ đề "${topic}":`,
          correctAnswer: 'Lời giải chi tiết từng bước và đáp số hoàn chỉnh (2.0đ).',
          points: 2.0,
          explanation: 'Mức 3 vận dụng tư duy giải quyết vấn đề thực tiễn.',
          createdAt: new Date().toISOString(),
        },
      ];

      saveQuestions([...newAIQuestions, ...questions]);
      toast.success(`AI đã sinh thành công 3 câu hỏi mới cho môn ${subjectName}!`);
      setIsAIModalOpen(false);
      setAiTopicInput('');
    } catch (e) {
      toast.error('Có lỗi xảy ra khi tạo câu hỏi bằng AI');
    } finally {
      setIsAIGenerating(false);
    }
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
      `🏫 ĐỀ KIỂM TRA ĐỊNH KỲ ${termName.toUpperCase()} — MÔN ${subjectName.toUpperCase()} LỚP ${selectedGrade}\n\n${text}`
    );
    toast.success(`Đã sao chép toàn bộ Đề kiểm tra môn ${subjectName}!`);
  };

  return (
    <div className="space-y-6 print:p-0 print:m-0">
      {/* 1. TOP HEADER & CONTROLS (HIDDEN IN PRINT) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            <span>Ngân Hàng Câu Hỏi & Đề Kiểm Tra TT27</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý câu hỏi theo môn học, khối lớp, mạch kiến thức & ma trận 3 mức độ (Mức 1: 40% • Mức 2: 30% • Mức 3: 30%).
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

          {/* Subject Selector */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 shadow-xs"
          >
            <option value="TOAN">Môn Toán</option>
            <option value="TIENG_VIET">Môn Tiếng Việt</option>
            <option value="KHOA_HOC">Môn Khoa học</option>
            <option value="LICH_SU_DIA_LY">Môn Lịch sử & Địa lý</option>
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
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Đề Thi (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* 2. TAB SELECTOR BAR (HIDDEN IN PRINT) */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold print:hidden">
        {[
          { id: 'BANK', label: `📚 Ngân Hàng Câu Hỏi (${bankQuestions.length})`, count: bankQuestions.length },
          { id: 'MATRIX', label: '📐 Ma Trận Đề 3 Mức Độ (TT27)', count: null },
          { id: 'EXAM', label: `📝 Đề Kiểm Tra Mẫu (${examQuestions.length} câu - ${examStats.totalPts}đ)`, count: null },
          { id: 'ANSWER', label: '🎯 Đáp Án & Hướng Dẫn Chấm', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
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
      {/* 3. TAB 1: NGÂN HÀNG CÂU HỎI THEO MÔN & QUẢN LÝ (QUESTION BANK MANAGER) */}
      {/* ========================================================================= */}
      {activeTab === 'BANK' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm câu hỏi theo nội dung, mạch kiến thức..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Level Filter */}
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700"
                >
                  <option value="ALL">Tất cả Mức độ</option>
                  <option value="MUC_1">Mức 1 (Nhận biết)</option>
                  <option value="MUC_2">Mức 2 (Kết nối/áp dụng)</option>
                  <option value="MUC_3">Mức 3 (Vận dụng cao)</option>
                </select>

                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 hidden sm:block"
                >
                  <option value="ALL">Tất cả Dạng</option>
                  <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                  <option value="ESSAY">Tự luận</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnswersInBank(!showAnswersInBank)}
                  className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {showAnswersInBank ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAnswersInBank ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAIModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Sinh Câu Hỏi</span>
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
          </div>

          {/* Questions Grid / List */}
          <div className="space-y-3">
            {bankQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                  🔍
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Không tìm thấy câu hỏi phù hợp</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Chưa có câu hỏi nào cho môn {subjectName} (Khối {selectedGrade}) theo tiêu chí tìm kiếm này.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenQuestionModal()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    + Thêm Câu Hỏi Mới
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    Khôi Phục Mẫu Chuẩn
                  </button>
                </div>
              </div>
            ) : (
              bankQuestions.map((q, idx) => {
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
                    ? 'Mức 2 (Kết nối/áp dụng)'
                    : 'Mức 3 (Vận dụng cao)';

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2">
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
                          title="Chỉnh sửa câu hỏi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Xóa câu hỏi"
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
                            * Giải thích: {q.explanation}
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
      {/* 4. TAB 2: MA TRẬN 3 MỨC ĐỘ THÔNG TƯ 27 (MATRIX VIEW) */}
      {/* ========================================================================= */}
      {activeTab === 'MATRIX' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
              MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ MÔN {subjectName.toUpperCase()} — LỚP {selectedGrade}
            </h2>
            <p className="text-xs text-slate-600 italic">
              Đợt đánh giá: <strong>{termName}</strong> — Năm học: <strong>{schoolInfo.schoolYear || '2026-2027'}</strong>
            </p>
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
                <tr>
                  <td className="p-3 border-r border-slate-200 font-bold">1</td>
                  <td className="p-3 border-r border-slate-200 text-left font-bold">Số và phép tính (Số tự nhiên, 4 phép tính)</td>
                  <td className="p-2 border-r border-slate-200">2 câu (2.0đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.5đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.5đ)</td>
                  <td className="p-2 border-r border-slate-200 font-bold">5 câu</td>
                  <td className="p-2 font-black text-indigo-700">6.0 điểm</td>
                </tr>
                <tr>
                  <td className="p-3 border-r border-slate-200 font-bold">2</td>
                  <td className="p-3 border-r border-slate-200 text-left font-bold">Hình học và đo lường (Góc, diện tích, đơn vị đo)</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200 font-bold">3 câu</td>
                  <td className="p-2 font-black text-indigo-700">3.0 điểm</td>
                </tr>
                <tr>
                  <td className="p-3 border-r border-slate-200 font-bold">3</td>
                  <td className="p-3 border-r border-slate-200 text-left font-bold">Một số yếu tố Thống kê và Xác suất</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200 font-bold">1 câu</td>
                  <td className="p-2 font-black text-indigo-700">1.0 điểm</td>
                </tr>
                <tr className="bg-indigo-50/70 font-black text-slate-900 border-t border-indigo-200">
                  <td className="p-3 border-r border-slate-200" colSpan={2}>TỔNG CỘNG ĐIỂM</td>
                  <td className="p-2 border-r border-slate-200" colSpan={2}>4.0 điểm (40%)</td>
                  <td className="p-2 border-r border-slate-200" colSpan={2}>3.0 điểm (30%)</td>
                  <td className="p-2 border-r border-slate-200" colSpan={2}>3.0 điểm (30%)</td>
                  <td className="p-2 border-r border-slate-200">9 câu</td>
                  <td className="p-2 text-indigo-900 text-sm">10.0 ĐIỂM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: ĐỀ KIỂM TRA MẪU IN PHÁT HỌC SINH (PRINT READY EXAM) */}
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
              <p className="font-bold">MÔN: {subjectName.toUpperCase()} — LỚP {selectedGrade}</p>
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

          {/* Questions dynamically rendered from Exam Questions */}
          <div className="space-y-4 text-xs font-sans leading-relaxed">
            <div className="font-black uppercase text-indigo-950 border-b border-indigo-100 pb-1">
              NỘI DUNG ĐỀ KIỂM TRA ({examQuestions.length} Câu hỏi • Thang điểm 10)
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
      {/* 6. TAB 4: ĐÁP ÁN & BIỂU ĐIỂM CHI TIẾT */}
      {/* ========================================================================= */}
      {activeTab === 'ANSWER' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
              HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM MÔN {subjectName.toUpperCase()} — LỚP {selectedGrade}
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
      {/* 7. MODAL: THÊM / SỬA CÂU HỎI */}
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
                    <option value="TOAN">Toán</option>
                    <option value="TIENG_VIET">Tiếng Việt</option>
                    <option value="KHOA_HOC">Khoa học</option>
                    <option value="LICH_SU_DIA_LY">Lịch sử & Địa lý</option>
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
      {/* 8. MODAL: AI QUESTION GENERATOR */}
      {/* ========================================================================= */}
      {isAIModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsAIModalOpen(false)}
        >
          <div
            className="bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-purple-900">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
                ✨
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base">Trợ Lý AI Sinh Câu Hỏi Theo Chủ Đề</h3>
                <p className="text-xs text-slate-500">Môn {subjectName} — Khối {selectedGrade}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <label className="font-bold text-slate-700">Chủ đề bài học hoặc kiến thức cần sinh câu hỏi:</label>
              <input
                type="text"
                value={aiTopicInput}
                onChange={(e) => setAiTopicInput(e.target.value)}
                placeholder="VD: Phép chia số có nhiều chữ số, Đoạn văn miêu tả..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
              <p className="text-[11px] text-slate-400 italic">
                AI sẽ tự động tạo 3 câu hỏi (1 câu Mức 1, 1 câu Mức 2, 1 câu Mức 3) kèm đáp án chuẩn Thông tư 27.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAIModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleGenerateAIQuestions}
                disabled={isAIGenerating}
                className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:opacity-90 disabled:opacity-50"
              >
                {isAIGenerating ? 'Đang Sinh Câu Hỏi...' : 'Bắt Đầu Sinh Câu Hỏi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
