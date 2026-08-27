'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Save,
  Sliders,
  CheckCircle2,
  Key,
  HelpCircle,
  Zap,
  Settings,
  Star,
  MessageSquare,
  Cpu,
  ArrowRight,
  ChevronDown,
  CheckCheck,
  Plus,
  X,
  Lightbulb,
  FileText,
  SlidersHorizontal,
  CheckSquare,
  Square,
  BookOpen,
  Heart,
  FileCheck,
  CalendarCheck,
  Edit3,
  AlignLeft,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { generateStudentAICommentFull, GeneratedCommentResult } from '@/lib/ai-service';
import { AIToneType, AILengthPreset, AIGenerationSettings } from '@/types';
import { TERMS, evaluateStudentTT27, getAwardBadgeClass } from '@/lib/tt27-engine';
import { toast } from 'sonner';
import Link from 'next/link';

const PROMPT_DIRECTIVE_SUGGESTIONS = [
  '🌟 Khen ngợi phong trào thi đua giữ vở sạch chữ đẹp',
  '🤝 Nhấn mạnh tinh thần đoàn kết, tích cực giúp đỡ bạn bè',
  '📚 Động viên em hăng hái phát biểu xây dựng bài',
  '🎯 Lời văn cô đọng đúng 3 câu, ấm áp và truyền cảm hứng',
  '🎨 Nhắc nhở rèn luyện thêm tính cẩn thận và kiên nhẫn',
  '🚀 Khích lệ tự tin tham gia các hoạt động tập thể của lớp',
];

const LENGTH_PRESETS: { id: AILengthPreset; label: string; words: number; sentences: number; desc: string }[] = [
  { id: 'short', label: 'Ngắn gọn', words: 35, sentences: 2, desc: '~35 từ (2 câu, tối ưu học bạ điện tử)' },
  { id: 'standard', label: 'Chuẩn mực', words: 60, sentences: 3, desc: '~60 từ (3 câu, chuẩn Bộ GD&ĐT)' },
  { id: 'detailed', label: 'Chi tiết', words: 95, sentences: 4, desc: '~95 từ (4-5 câu, phong phú cho họp PH)' },
];

export default function AIAssistantPage() {
  const {
    students,
    classInfo,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    updateTermSummary,
    starLogs,
    attendances,
    aiConfig,
    setAiConfig,
    aiGenSettings,
    setAiGenSettings,
    apiKey,
  } = useAppStore();

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<{ [studentId: string]: string }>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [commentSources, setCommentSources] = useState<Record<string, GeneratedCommentResult>>({});
  const [isCustomToneInput, setIsCustomToneInput] = useState(false);

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const activeProviderLabel =
    aiConfig?.provider === 'GEMINI'
      ? 'Google Gemini'
      : aiConfig?.provider === 'OPENAI'
      ? 'OpenAI GPT'
      : aiConfig?.provider === 'ANTHROPIC'
      ? 'Anthropic Claude'
      : 'Xiaomi MIMO AI';

  // Update Generation Settings helper
  const updateSettings = (partial: Partial<AIGenerationSettings>) => {
    const updated = { ...aiGenSettings, ...partial };
    setAiGenSettings(updated);
  };

  const handleApplyLengthPreset = (preset: typeof LENGTH_PRESETS[0]) => {
    updateSettings({
      lengthPreset: preset.id,
      targetWordCount: preset.words,
      targetSentenceCount: preset.sentences,
    });
  };

  const handleAddSuggestion = (text: string) => {
    const cleanText = text.replace(/^[^\w\s\u00C0-\u1EF9]+/, '').trim();
    const current = aiGenSettings.classDirectivePrompt || '';
    if (!current) {
      updateSettings({ classDirectivePrompt: cleanText });
    } else if (!current.includes(cleanText)) {
      updateSettings({ classDirectivePrompt: `${current}; ${cleanText}` });
    }
  };

  // Fetch available models for active provider
  const loadModels = useCallback(async () => {
    setIsFetchingModels(true);
    try {
      const res = await fetch('/api/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiConfig?.provider || 'CUSTOM_OPENAI',
          apiKey: aiConfig?.apiKey || apiKey,
          baseUrl: aiConfig?.baseUrl,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.models)) {
        setAvailableModels(data.models);
      }
    } catch (e) {
      console.warn('Failed to load models list:', e);
    } finally {
      setIsFetchingModels(false);
    }
  }, [aiConfig, apiKey]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleModelChange = (newModel: string) => {
    if (!aiConfig) return;
    const updated = { ...aiConfig, modelName: newModel };
    setAiConfig(updated);
    toast.success(`Đã chuyển sang mô hình ${newModel}`);
  };

  // Sinh nhận xét cho 1 học sinh
  const handleGenerateSingle = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setGeneratingStudentId(studentId);
    const sAss = subjectAssessments.filter((a) => a.studentId === studentId && a.term === currentTerm);
    const tAss = traitAssessments.filter((a) => a.studentId === studentId && a.term === currentTerm);
    const studentStars = starLogs.filter((l) => l.studentId === studentId);
    const studentAtt = attendances.filter((a) => a.studentId === studentId);

    try {
      const result = await generateStudentAICommentFull({
        student,
        subjects: sAss,
        traits: tAss,
        starLogs: studentStars,
        attendances: studentAtt,
        aiConfig,
        aiGenSettings,
        apiKey,
        extraNotes: customNotes[studentId],
      });

      updateTermSummary(studentId, currentTerm, { teacherComment: result.comment });
      setCommentSources((prev) => ({ ...prev, [studentId]: result }));

      if (result.isRealAI) {
        toast.success(`✨ Đã sinh nhận xét cho em ${student.fullName} qua ${result.source} (${result.model || ''})!`);
      } else {
        toast.info(`Đã tạo nhận xét cho em ${student.fullName} từ Ngân hàng sư phạm`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi khi tạo nhận xét AI');
    } finally {
      setGeneratingStudentId(null);
    }
  };

  // Sinh nhận xét cho cả lớp (1-Click)
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    toast.info(`Đang sinh nhận xét tự động cho ${students.length} học sinh qua ${activeProviderLabel} (${aiConfig?.modelName || 'mimo-v2.5'})...`);

    let realAICount = 0;

    for (const student of students) {
      const sAss = subjectAssessments.filter((a) => a.studentId === student.id && a.term === currentTerm);
      const tAss = traitAssessments.filter((a) => a.studentId === student.id && a.term === currentTerm);
      const studentStars = starLogs.filter((l) => l.studentId === student.id);
      const studentAtt = attendances.filter((a) => a.studentId === student.id);

      const result = await generateStudentAICommentFull({
        student,
        subjects: sAss,
        traits: tAss,
        starLogs: studentStars,
        attendances: studentAtt,
        aiConfig,
        aiGenSettings,
        apiKey,
        extraNotes: customNotes[student.id],
      });

      updateTermSummary(student.id, currentTerm, { teacherComment: result.comment });
      setCommentSources((prev) => ({ ...prev, [student.id]: result }));
      if (result.isRealAI) realAICount++;
    }

    setIsGeneratingAll(false);
    toast.success(`Đã hoàn thành sinh nhận xét cho ${students.length} học sinh (${realAICount}/${students.length} qua ${activeProviderLabel})! 🎉`);
  };

  // Copy nhận xét
  const handleCopy = (studentId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(studentId);
    toast.success('Đã sao chép nhận xét!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Count active input sources
  const activeInputCount = [
    aiGenSettings.includeSubjectGrades,
    aiGenSettings.includeTraitsAndCompetencies,
    aiGenSettings.includeDailyStarsAndComments,
    aiGenSettings.includeAttendanceAndBoarding,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-purple-600 shrink-0" />
            <span>Trợ Lý Sư Phạm AI — Viết Lời Nhận Xét Học Bạ</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu điểm số TT27, nề nếp tích sao và lịch sử nhận xét hàng ngày để tạo lời nhận xét ấm áp, chuẩn mực.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerateAll}
          disabled={isGeneratingAll}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isGeneratingAll ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang Sinh Tự Động...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>Sinh Nhận Xét 1-Click Cả Lớp ({students.length} Em)</span>
            </>
          )}
        </button>
      </div>

      {/* AI ENGINE & MODEL BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>Đang kết nối: {activeProviderLabel}</span>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                {aiConfig?.modelName || 'mimo-v2.5'}
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              {aiConfig?.apiKey ? 'Đã cài đặt API Key cá nhân' : 'Khóa mặc định hệ thống / Offline Bank'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {availableModels.length > 0 && (
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Mô hình:</span>
              <select
                value={aiConfig?.modelName || 'mimo-v2.5'}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            href="/settings"
            className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cài đặt AI</span>
          </Link>
        </div>
      </div>

      {/* MASTER AI GENERATION CONFIGURATION PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cấu Hình Tham Số Nhận Xét AI Cho Lớp {classInfo.name}
              </h2>
              <p className="text-xs text-slate-500">
                Thiết lập văn phong sư phạm, độ dài mong muốn và chọn lọc dữ liệu đầu vào đưa vào Prompt.
              </p>
            </div>
          </div>

          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold px-3 py-1 rounded-full hidden sm:inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{activeInputCount}/4 nguồn dữ liệu kích hoạt</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION 1: VĂN PHONG NHẬN XÉT (TONE) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>1. Văn phong & Phong thái:</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomToneInput(!isCustomToneInput)}
                className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isCustomToneInput ? 'Mẫu có sẵn' : 'Tùy chỉnh'}</span>
              </button>
            </div>

            {!isCustomToneInput ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'standard', label: 'Chuẩn Sư Phạm', desc: 'Mẫu mực Thông tư 27' },
                  { id: 'encouraging', label: 'Ấm Áp - Động Viên', desc: 'Thân mật, khích lệ' },
                  { id: 'detailed', label: 'Đầy Đủ - Chi Tiết', desc: 'Phân tích sâu môn học' },
                  { id: 'concise', label: 'Ngắn Gọn Súc Tích', desc: 'Dễ đọc, tối giản' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateSettings({ tone: t.id as AIToneType })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      aiGenSettings.tone === t.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <p className="font-bold text-xs">{t.label}</p>
                    <p className={`text-[10px] mt-0.5 ${aiGenSettings.tone === t.id ? 'text-purple-100' : 'text-slate-400'}`}>
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  rows={3}
                  value={aiGenSettings.customToneText || ''}
                  onChange={(e) => updateSettings({ tone: 'custom', customToneText: e.target.value })}
                  placeholder="Mô tả văn phong của cô giáo (Ví dụ: giọng văn dịu dàng, khuyên nhủ ân cần, xưng hô 'cô khen em'...)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                />
              </div>
            )}
          </div>

          {/* SECTION 2: ĐỘ DÀI & SỐ LƯỢNG TỪ (LENGTH) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
              <span>2. Độ dài mong muốn:</span>
            </label>

            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {LENGTH_PRESETS.map((lp) => (
                  <button
                    key={lp.id}
                    type="button"
                    onClick={() => handleApplyLengthPreset(lp)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      aiGenSettings.lengthPreset === lp.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <p className="font-bold text-xs">{lp.label}</p>
                    <p className={`text-[10px] mt-0.5 font-mono ${aiGenSettings.lengthPreset === lp.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      ~{lp.words} từ
                    </p>
                  </button>
                ))}
              </div>

              {/* Slider for fine-tuning word count */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span>Khoảng từ:</span>
                  <span className="font-mono font-bold text-blue-600">
                    ~{aiGenSettings.targetWordCount} từ ({aiGenSettings.targetSentenceCount} câu)
                  </span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={120}
                  step={5}
                  value={aiGenSettings.targetWordCount}
                  onChange={(e) => {
                    const words = Number(e.target.value);
                    const sentences = words <= 40 ? 2 : words <= 70 ? 3 : words <= 95 ? 4 : 5;
                    updateSettings({
                      lengthPreset: 'custom',
                      targetWordCount: words,
                      targetSentenceCount: sentences,
                    });
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>25 từ (2 câu)</span>
                  <span>60 từ (3 câu)</span>
                  <span>120 từ (5 câu)</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: DỮ LIỆU HỌC SINH ĐƯA VÀO PROMPT (INPUT SOURCES) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>3. Dữ liệu học sinh đưa vào Input:</span>
            </label>

            <div className="space-y-2 text-xs">
              <label
                onClick={() => updateSettings({ includeSubjectGrades: !aiGenSettings.includeSubjectGrades })}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  aiGenSettings.includeSubjectGrades
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {aiGenSettings.includeSubjectGrades ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span>Điểm số & Đánh giá môn học (T/H/C)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                  Toán, TV...
                </span>
              </label>

              <label
                onClick={() => updateSettings({ includeDailyStarsAndComments: !aiGenSettings.includeDailyStarsAndComments })}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  aiGenSettings.includeDailyStarsAndComments
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {aiGenSettings.includeDailyStarsAndComments ? (
                    <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span>Lịch sử nề nếp & Nhận xét hàng ngày</span>
                </div>
                <span className="text-[10px] font-mono text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                  ⭐ Sao & Ghi chú
                </span>
              </label>

              <label
                onClick={() => updateSettings({ includeTraitsAndCompetencies: !aiGenSettings.includeTraitsAndCompetencies })}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  aiGenSettings.includeTraitsAndCompetencies
                    ? 'bg-purple-50/70 border-purple-300 text-purple-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {aiGenSettings.includeTraitsAndCompetencies ? (
                    <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span>Phẩm chất & Năng lực chủ yếu (T/Đ/C)</span>
                </div>
                <span className="text-[10px] font-mono text-purple-700 bg-white px-1.5 py-0.5 rounded border border-purple-200">
                  Chăm học, Tự chủ
                </span>
              </label>

              <label
                onClick={() => updateSettings({ includeAttendanceAndBoarding: !aiGenSettings.includeAttendanceAndBoarding })}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  aiGenSettings.includeAttendanceAndBoarding
                    ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {aiGenSettings.includeAttendanceAndBoarding ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span>Chuyên cần & Sinh hoạt bán trú</span>
                </div>
                <span className="text-[10px] font-mono text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                  Nghỉ học & Bán trú
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: YÊU CẦU BỔ SUNG & ĐỊNH HƯỚNG CHUNG TOÀN LỚP */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>4. Yêu cầu & Định hướng bổ sung chung cho đợt thi đua này:</span>
            </label>
            {aiGenSettings.classDirectivePrompt && (
              <button
                type="button"
                onClick={() => updateSettings({ classDirectivePrompt: '' })}
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa định hướng</span>
              </button>
            )}
          </div>

          <textarea
            rows={2}
            value={aiGenSettings.classDirectivePrompt || ''}
            onChange={(e) => updateSettings({ classDirectivePrompt: e.target.value })}
            placeholder="Ví dụ: Đợt thi đua chào mừng 20/11 vừa qua lớp đạt kết quả rất tốt, hãy lồng ghép lời khen tinh thần nề nếp và nhắc nhở chuẩn bị bài chu đáo..."
            className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none leading-relaxed"
          />

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Gợi ý nhanh:</span>
            </span>
            {PROMPT_DIRECTIVE_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAddSuggestion(sug)}
                className="text-[10px] bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 px-2.5 py-1 rounded-full text-slate-600 transition-all cursor-pointer active:scale-95"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* LIVE BLUEPRINT FOOTER SUMMARY */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span className="font-bold text-slate-800">Tóm tắt cấu hình:</span>
            <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md font-semibold border border-purple-200 text-[11px]">
              Văn phong: {aiGenSettings.tone === 'encouraging' ? 'Ấm áp - Động viên' : aiGenSettings.tone === 'detailed' ? 'Chi tiết' : aiGenSettings.tone === 'concise' ? 'Ngắn gọn' : aiGenSettings.tone === 'custom' ? 'Tùy chỉnh' : 'Chuẩn Sư Phạm'}
            </span>
            <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-semibold border border-blue-200 text-[11px]">
              Độ dài: ~{aiGenSettings.targetWordCount} từ ({aiGenSettings.targetSentenceCount} câu)
            </span>
            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold border border-emerald-200 text-[11px]">
              {activeInputCount} nguồn dữ liệu
            </span>
          </div>

          <button
            type="button"
            onClick={() => toast.success('Cấu hình sinh nhận xét AI đã được lưu thành công!')}
            className="inline-flex items-center space-x-1.5 text-purple-700 font-bold hover:underline cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-purple-600" />
            <span>Tự động lưu cấu hình</span>
          </button>
        </div>
      </div>

      {/* STUDENT CARDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {students.map((st, idx) => {
          const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
          const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
          const summary = termSummaries.find((s) => s.studentId === st.id && s.term === currentTerm);
          const evalRes = evaluateStudentTT27(sAss, tAss, currentTerm);
          const award = summary?.awardTitle || evalRes.awardTitle;
          const comment = summary?.teacherComment || '';
          const isGenerating = generatingStudentId === st.id;
          const sourceInfo = commentSources[st.id];

          // Student Stars & Praises
          const stStars = starLogs.filter((l) => l.studentId === st.id);
          const totalStars = stStars.reduce((sum, l) => sum + l.points, 0);

          return (
            <div
              key={st.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Student Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{st.fullName}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{st.studentCode}</span>
                        <span>•</span>
                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{totalStars} sao nề nếp</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${getAwardBadgeClass(award)}`}>
                    {award}
                  </span>
                </div>

                {/* Custom teacher notes for this student */}
                <div>
                  <input
                    type="text"
                    placeholder="Gợi ý riêng cho em này (VD: chữ viết sạch đẹp, năng nổ văn nghệ...)"
                    value={customNotes[st.id] || ''}
                    onChange={(e) => setCustomNotes({ ...customNotes, [st.id]: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50 text-slate-700"
                  />
                </div>

                {/* Comment text area */}
                <div className="relative space-y-1">
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) =>
                      updateTermSummary(st.id, currentTerm, { teacherComment: e.target.value })
                    }
                    placeholder="Chưa có lời nhận xét. Nhấp 'Tạo nhận xét AI' bên dưới..."
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50/50 resize-none font-medium"
                  />

                  {/* AI Generation Live Source Badge */}
                  {comment && (
                    <div className="flex items-center justify-between text-[10px] px-1 text-slate-400">
                      {sourceInfo ? (
                        <span className={`inline-flex items-center gap-1 font-semibold ${sourceInfo.isRealAI ? 'text-purple-700' : 'text-slate-500'}`}>
                          {sourceInfo.isRealAI ? <Sparkles className="w-3 h-3 text-purple-600" /> : <Bot className="w-3 h-3" />}
                          <span>Tạo bởi: {sourceInfo.source} {sourceInfo.model ? `(${sourceInfo.model})` : ''}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Đã lưu trong học bạ</span>
                      )}
                      <span>{comment.trim().split(/\s+/).length} từ</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  onClick={() => handleGenerateSingle(st.id)}
                  disabled={isGenerating}
                  className="inline-flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>{comment ? 'Tạo lại nhận xét' : 'Tạo nhận xét AI'}</span>
                    </>
                  )}
                </button>

                {comment && (
                  <button
                    onClick={() => handleCopy(st.id, comment)}
                    className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-900 text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {copiedId === st.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
