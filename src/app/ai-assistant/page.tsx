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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { generateStudentAICommentFull, GeneratedCommentResult } from '@/lib/ai-service';
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
  const [classPromptDirective, setClassPromptDirective] = useState('');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<{ [studentId: string]: string }>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [commentSources, setCommentSources] = useState<Record<string, GeneratedCommentResult>>({});

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const activeProviderLabel =
    aiConfig?.provider === 'GEMINI'
      ? 'Google Gemini'
      : aiConfig?.provider === 'OPENAI'
      ? 'OpenAI GPT'
      : aiConfig?.provider === 'ANTHROPIC'
      ? 'Anthropic Claude'
      : 'Xiaomi MIMO AI';

  // Load saved class prompt directive from localStorage
  useEffect(() => {
    try {
      const savedDirective = localStorage.getItem('gvcn_class_prompt_directive');
      if (savedDirective) setClassPromptDirective(savedDirective);
    } catch (e) {}
  }, []);

  const handleDirectiveChange = (val: string) => {
    setClassPromptDirective(val);
    try {
      localStorage.setItem('gvcn_class_prompt_directive', val);
    } catch (e) {}
  };

  const handleAddSuggestion = (text: string) => {
    const cleanText = text.replace(/^[^\w\s\u00C0-\u1EF9]+/, '').trim();
    if (!classPromptDirective) {
      handleDirectiveChange(cleanText);
    } else if (!classPromptDirective.includes(cleanText)) {
      handleDirectiveChange(`${classPromptDirective}; ${cleanText}`);
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

    const combinedExtraNotes = [classPromptDirective.trim(), customNotes[studentId]?.trim()]
      .filter(Boolean)
      .join('; ');

    try {
      const result = await generateStudentAICommentFull({
        student,
        subjects: sAss,
        traits: tAss,
        starLogs: studentStars,
        attendances: studentAtt,
        aiConfig,
        apiKey,
        tone: selectedTone,
        extraNotes: combinedExtraNotes,
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

      const combinedExtraNotes = [classPromptDirective.trim(), customNotes[student.id]?.trim()]
        .filter(Boolean)
        .join('; ');

      const result = await generateStudentAICommentFull({
        student,
        subjects: sAss,
        traits: tAss,
        starLogs: studentStars,
        attendances: studentAtt,
        aiConfig,
        apiKey,
        tone: selectedTone,
        extraNotes: combinedExtraNotes,
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
                value={aiConfig?.modelName || 'mimo-v2.5'}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full bg-white text-purple-900 border border-purple-200 rounded-lg px-2 py-1 text-[11px] font-mono font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <span className="bg-purple-200 text-purple-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold block">
                {aiConfig?.modelName || 'mimo-v2.5'}
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

      {/* NEW: CLASS-WIDE BATCH PROMPT DIRECTIVE PANEL */}
      <div className="bg-gradient-to-br from-purple-900/90 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl border border-purple-800/60 shadow-lg space-y-3 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                <span>Định Hướng & Yêu Cầu Bổ Sung Cho Toàn Lớp (Prompt Directive)</span>
                <span className="bg-purple-500/30 text-purple-300 border border-purple-400/30 text-[9px] px-2 py-0.5 rounded-full font-semibold">
                  Áp dụng cho {students.length} học sinh
                </span>
              </h2>
            </div>
          </div>

          {classPromptDirective && (
            <button
              type="button"
              onClick={() => handleDirectiveChange('')}
              className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa định hướng</span>
            </button>
          )}
        </div>

        <div className="space-y-2 text-xs">
          <textarea
            rows={2}
            value={classPromptDirective}
            onChange={(e) => handleDirectiveChange(e.target.value)}
            placeholder="Nhập yêu cầu bổ sung chung cho cả lớp (Ví dụ: Lớp vừa hoàn thành đợt thi đua 20/11 xuất sắc, hãy lồng ghép lời khen về tinh thần chăm ngoan, giữ vở sạch chữ đẹp và nhắc nhở chuẩn bị bài chu đáo...)"
            className="w-full p-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-purple-200/50 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none resize-none leading-relaxed backdrop-blur-sm"
          />

          {/* Quick Suggestion Chips */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-1 text-[11px] text-purple-300 font-medium">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Gợi ý nhanh chủ đề định hướng (nhấp để thêm vào prompt):</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PROMPT_DIRECTIVE_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddSuggestion(sug)}
                  className="inline-flex items-center gap-1 text-[10px] bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-full text-purple-100 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-2.5 h-2.5 opacity-70" />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          </div>
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
