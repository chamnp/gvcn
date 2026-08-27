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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { generateStudentAIComment } from '@/lib/ai-service';
import { TERMS, evaluateStudentTT27, getAwardBadgeClass } from '@/lib/tt27-engine';
import { toast } from 'sonner';
import Link from 'next/link';

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
    apiKey,
  } = useAppStore();

  const [selectedTone, setSelectedTone] = useState<'standard' | 'encouraging' | 'detailed' | 'concise'>('standard');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<{ [studentId: string]: string }>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const activeProviderLabel =
    aiConfig?.provider === 'GEMINI'
      ? 'Google Gemini'
      : aiConfig?.provider === 'OPENAI'
      ? 'OpenAI GPT'
      : aiConfig?.provider === 'ANTHROPIC'
      ? 'Anthropic Claude'
      : 'Xiaomi MIMO / Custom AI';

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
      const comment = await generateStudentAIComment({
        student,
        subjects: sAss,
        traits: tAss,
        starLogs: studentStars,
        attendances: studentAtt,
        aiConfig,
        apiKey,
        tone: selectedTone,
        extraNotes: customNotes[studentId],
      });

      updateTermSummary(studentId, currentTerm, { teacherComment: comment });
      toast.success(`Đã tạo nhận xét cho em ${student.fullName}`);
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
    toast.info(`Đang sinh nhận xét tự động cho ${students.length} học sinh qua ${activeProviderLabel} (${aiConfig?.modelName || 'mimo-v1'})...`);

    for (const student of students) {
      const sAss = subjectAssessments.filter((a) => a.studentId === student.id && a.term === currentTerm);
      const tAss = traitAssessments.filter((a) => a.studentId === student.id && a.term === currentTerm);
      const studentStars = starLogs.filter((l) => l.studentId === student.id);
      const studentAtt = attendances.filter((a) => a.studentId === student.id);

      const comment = await generateStudentAIComment({
        student,
        subjects: sAss,
        traits: tAss,
        starLogs: studentStars,
        attendances: studentAtt,
        aiConfig,
        apiKey,
        tone: selectedTone,
        extraNotes: customNotes[student.id],
      });

      updateTermSummary(student.id, currentTerm, { teacherComment: comment });
    }

    setIsGeneratingAll(false);
    toast.success('Đã hoàn thành sinh nhận xét học bạ cho toàn bộ học sinh trong lớp! 🎉');
  };

  // Copy nhận xét
  const handleCopy = (studentId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(studentId);
    toast.success('Đã sao chép nhận xét!');
    setTimeout(() => setCopiedId(null), 2000);
  };

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
            Tổng hợp dữ liệu điểm số TT27, nề nếp tích sao và lịch sử nhận xét hàng ngày để tạo lời nhận xét ấm áp, súc tích (3-4 câu).
          </p>
        </div>

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

      {/* AI Provider Status & Style Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Style Selector */}
        <div className="space-y-1.5 flex-1 min-w-[280px]">
          <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Phong cách nhận xét mong muốn:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'standard', label: 'Chuẩn Sư Phạm' },
              { id: 'encouraging', label: 'Ấm Áp - Động Viên' },
              { id: 'detailed', label: 'Đầy Đủ - Chi Tiết' },
              { id: 'concise', label: 'Ngắn Gọn (3-4 câu)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTone(t.id as any)}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                  selectedTone === t.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider Live Badge & Dynamic Model Dropdown */}
        <div className="flex items-center space-x-3 bg-purple-50/80 border border-purple-200 p-3 rounded-2xl shrink-0">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>

          <div className="text-xs min-w-[170px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950">{activeProviderLabel}</span>
              <span className="text-[10px] text-purple-600 font-medium">Mô hình:</span>
            </div>

            {availableModels.length > 0 ? (
              <select
                value={aiConfig?.modelName || 'mimo-v1'}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full bg-white text-purple-900 border border-purple-200 rounded-lg px-2 py-1 text-[11px] font-mono font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <span className="bg-purple-200 text-purple-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold block">
                {aiConfig?.modelName || 'mimo-v1'}
              </span>
            )}
          </div>

          <Link
            href="/settings"
            className="inline-flex items-center space-x-1 bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0"
            title="Đổi nhà cung cấp hoặc cấu hình khóa API"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cài đặt</span>
          </Link>
        </div>
      </div>

      {/* Student Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {students.map((st, idx) => {
          const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
          const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
          const summary = termSummaries.find((s) => s.studentId === st.id && s.term === currentTerm);
          const evalRes = evaluateStudentTT27(sAss, tAss, currentTerm);
          const award = summary?.awardTitle || evalRes.awardTitle;
          const comment = summary?.teacherComment || '';
          const isGenerating = generatingStudentId === st.id;

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

                {/* Custom teacher notes */}
                <div>
                  <input
                    type="text"
                    placeholder="Gợi ý thêm cho AI (VD: chữ viết sạch đẹp, năng nổ trong giờ văn nghệ...)"
                    value={customNotes[st.id] || ''}
                    onChange={(e) => setCustomNotes({ ...customNotes, [st.id]: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50 text-slate-700"
                  />
                </div>

                {/* Comment text area */}
                <div className="relative">
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) =>
                      updateTermSummary(st.id, currentTerm, { teacherComment: e.target.value })
                    }
                    placeholder="Chưa có lời nhận xét. Nhấp 'Tạo nhận xét AI' bên dưới..."
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50/50 resize-none font-medium"
                  />
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
