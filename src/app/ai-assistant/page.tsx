'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Wifi,
  WifiOff,
  Layers,
  SquareX,
  StopCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { generateStudentAICommentFull, GeneratedCommentResult } from '@/lib/ai-service';
import { AIToneType, AILengthPreset, AIGenerationSettings, AIGenerationMode } from '@/types';
import { TERMS, evaluateStudentTT27, getAwardBadgeClass } from '@/lib/tt27-engine';
import { VoiceInputButton } from '@/components/ui/voice-input-button';
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
    formativeNotes,
    apiKey,
  } = useAppStore();

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
    currentStudentName: string;
  } | null>(null);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<{ [studentId: string]: string }>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [commentSources, setCommentSources] = useState<Record<string, GeneratedCommentResult>>({});
  
  // Abort controller ref for stopping sync midway
  const abortSyncRef = useRef(false);

  // Modal Pop-up State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<AIGenerationSettings>(aiGenSettings);
  const [isCustomToneInput, setIsCustomToneInput] = useState(false);

  // Sync temp settings whenever aiGenSettings updates or modal opens
  useEffect(() => {
    if (aiGenSettings) {
      setTempSettings(aiGenSettings);
      if (aiGenSettings.tone === 'custom') {
        setIsCustomToneInput(true);
      }
    }
  }, [aiGenSettings, isConfigModalOpen]);

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const activeProviderLabel =
    aiConfig?.provider === 'GEMINI'
      ? 'Google Gemini'
      : aiConfig?.provider === 'OPENAI'
      ? 'OpenAI GPT'
      : aiConfig?.provider === 'ANTHROPIC'
      ? 'Anthropic Claude'
      : 'Xiaomi MIMO AI';

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

  // Save Settings from Modal
  const handleSaveModalSettings = () => {
    setAiGenSettings(tempSettings);
    setIsConfigModalOpen(false);
    toast.success('Đã lưu và áp dụng cấu hình tham số nhận xét!');
  };

  // Quick preset helper
  const handleApplyLengthPreset = (preset: typeof LENGTH_PRESETS[0]) => {
    setTempSettings((prev) => ({
      ...prev,
      lengthPreset: preset.id,
      targetWordCount: preset.words,
      targetSentenceCount: preset.sentences,
    }));
  };

  const handleAddSuggestion = (text: string) => {
    const cleanText = text.replace(/^[^\w\s\u00C0-\u1EF9]+/, '').trim();
    const current = tempSettings.classDirectivePrompt || '';
    if (!current) {
      setTempSettings((prev) => ({ ...prev, classDirectivePrompt: cleanText }));
    } else if (!current.includes(cleanText)) {
      setTempSettings((prev) => ({ ...prev, classDirectivePrompt: `${current}; ${cleanText}` }));
    }
  };

  // Cancel / Abort ongoing batch generation
  const handleCancelGeneration = () => {
    abortSyncRef.current = true;
    setIsGeneratingAll(false);
    setGenerationProgress(null);
    setGeneratingStudentId(null);
    toast.info('Đã dừng tiến trình sinh nhận xét!');
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
    const stNotes = formativeNotes.filter((n) => n.studentId === studentId);
    const notesSummary = stNotes.length > 0 ? stNotes.map((n) => `[${n.title}: ${n.content}]`).join('; ') : '';
    const combinedNotes = [customNotes[studentId], notesSummary ? `Ghi chú tiến bộ: ${notesSummary}` : ''].filter(Boolean).join('. ');

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
        extraNotes: combinedNotes,
      });

      updateTermSummary(studentId, currentTerm, { teacherComment: result.comment });
      setCommentSources((prev) => ({ ...prev, [studentId]: result }));

      if (result.isRealAI) {
        toast.success(`✨ Đã sinh nhận xét cho em ${student.fullName} qua ${result.source} (${result.model || ''})!`);
      } else {
        toast.info(`⚡ Đã tạo nhận xét cho em ${student.fullName} (${result.source})`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi khi tạo nhận xét');
    } finally {
      setGeneratingStudentId(null);
    }
  };

  // Sinh nhận xét cho cả lớp (1-Click) với cơ chế Cancel giữa chừng
  const handleGenerateAll = async () => {
    abortSyncRef.current = false;
    setIsGeneratingAll(true);
    const isOnline = aiGenSettings.mode === 'AI_ONLINE';

    toast.info(
      isOnline
        ? `Đang bắt đầu sinh nhận xét cho ${students.length} học sinh qua ${activeProviderLabel} (${aiConfig?.modelName || 'mimo-v2.5'})...`
        : `Đang tự động sinh nhận xét ngoại tuyến cho ${students.length} học sinh theo Thông tư 27...`
    );

    let realAICount = 0;
    let completedCount = 0;
    const CONCURRENCY = isOnline ? 3 : 6;
    let nextIndex = 0;

    const runWorker = async () => {
      while (nextIndex < students.length && !abortSyncRef.current) {
        const i = nextIndex++;
        const student = students[i];
        if (!student) break;

        setGenerationProgress({
          current: Math.min(completedCount + 1, students.length),
          total: students.length,
          currentStudentName: student.fullName,
        });
        setGeneratingStudentId(student.id);

        const sAss = subjectAssessments.filter((a) => a.studentId === student.id && a.term === currentTerm);
        const tAss = traitAssessments.filter((a) => a.studentId === student.id && a.term === currentTerm);
        const studentStars = starLogs.filter((l) => l.studentId === student.id);
        const studentAtt = attendances.filter((a) => a.studentId === student.id);
        const stNotes = formativeNotes.filter((n) => n.studentId === student.id);
        const notesSummary = stNotes.length > 0 ? stNotes.map((n) => `[${n.title}: ${n.content}]`).join('; ') : '';
        const combinedNotes = [customNotes[student.id], notesSummary ? `Ghi chú tiến bộ: ${notesSummary}` : ''].filter(Boolean).join('. ');

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
            extraNotes: combinedNotes,
          });

          updateTermSummary(student.id, currentTerm, { teacherComment: result.comment });
          setCommentSources((prev) => ({ ...prev, [student.id]: result }));
          if (result.isRealAI) realAICount++;
          completedCount++;
        } catch (err) {
          console.warn(`Lỗi khi tạo nhận xét cho em ${student.fullName}, tiếp tục em tiếp theo:`, err);
        }
      }
    };

    const workerPool = Array.from({ length: Math.min(CONCURRENCY, students.length) }, () => runWorker());
    await Promise.all(workerPool);

    setIsGeneratingAll(false);
    setGenerationProgress(null);
    setGeneratingStudentId(null);

    if (!abortSyncRef.current) {
      toast.success(
        isOnline
          ? `Đã hoàn thành sinh nhận xét cho ${completedCount}/${students.length} học sinh (${realAICount} qua ${activeProviderLabel})! 🎉`
          : `Đã hoàn thành sinh nhận xét ngoại tuyến chuẩn TT27 cho ${completedCount}/${students.length} học sinh! 🎉`
      );
    }
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

  const toneLabel =
    aiGenSettings.tone === 'encouraging'
      ? 'Ấm áp - Động viên'
      : aiGenSettings.tone === 'detailed'
      ? 'Đầy đủ - Chi tiết'
      : aiGenSettings.tone === 'concise'
      ? 'Ngắn gọn súc tích'
      : aiGenSettings.tone === 'custom'
      ? 'Tùy chỉnh riêng'
      : 'Chuẩn Sư Phạm TT27';

  return (
    <div className="space-y-6">
      {/* HEADER & MAIN ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Trợ Lý Sư Phạm AI — Viết Lời Nhận Xét Học Bạ Lớp {classInfo.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động tổng hợp điểm số TT27, sao nề nếp và nhận xét hàng ngày thành lời nhận xét hoàn chỉnh.
              </p>
            </div>
          </div>

          {/* ACTIVE STATUS CHIPS */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            {/* Mode Badge */}
            {aiGenSettings.mode === 'AI_ONLINE' ? (
              <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-bold">
                <Wifi className="w-3.5 h-3.5 text-purple-600" />
                <span>Chế độ: AI Trực tuyến ({activeProviderLabel} • {aiConfig?.modelName || 'mimo-v2.5'})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chế độ: Tự Động Ngoại Tuyến (Offline TT27)</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
              <span>Văn phong:</span>
              <strong className="text-slate-900">{toneLabel}</strong>
            </span>

            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
              <span>Độ dài:</span>
              <strong className="font-mono text-blue-600">~{aiGenSettings.targetWordCount} từ ({aiGenSettings.targetSentenceCount} câu)</strong>
            </span>

            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
              <span>Dữ liệu:</span>
              <strong className="text-emerald-700">{activeInputCount}/4 nguồn</strong>
            </span>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* OPEN CONFIG MODAL BUTTON */}
          <button
            type="button"
            disabled={isGeneratingAll}
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex w-full sm:w-auto justify-center items-center space-x-2 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 text-slate-800 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Cấu Hình Tham Số & Chọn Chế Độ AI</span><span className="sm:hidden">Cấu Hình AI</span>
          </button>

          {/* GENERATE ALL OR CANCEL BUTTON */}
          {isGeneratingAll ? (
            <button
              type="button"
              onClick={handleCancelGeneration}
              className="inline-flex w-full sm:w-auto justify-center items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all animate-pulse cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Dừng Lại / Hủy Bỏ (Cancel)</span><span className="sm:hidden">Hủy Bỏ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerateAll}
              className="inline-flex w-full sm:w-auto justify-center items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="hidden sm:inline">Sinh Nhận Xét Cả Lớp ({students.length} Em)</span><span className="sm:hidden">Sinh Nhận Xét Lớp</span>
            </button>
          )}
        </div>
      </div>

      {/* LIVE PROGRESS BANNER WHEN GENERATING */}
      {isGeneratingAll && generationProgress && (
        <div className="bg-purple-900 text-white p-4 rounded-2xl border border-purple-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 text-purple-300 animate-spin shrink-0" />
            <div>
              <p className="text-xs font-bold">
                Đang tạo nhận xét cho em: <span className="text-yellow-300">{generationProgress.currentStudentName}</span> ({generationProgress.current}/{generationProgress.total} học sinh)
              </p>
              <div className="w-full sm:w-64 bg-white/20 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-yellow-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelGeneration}
            className="inline-flex items-center space-x-1.5 bg-rose-500/80 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <StopCircle className="w-4 h-4" />
            <span>Hủy / Dừng Ngay</span>
          </button>
        </div>
      )}

      {/* STUDENT CARDS GRID */}
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
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    placeholder="Gợi ý riêng cho em này (VD: chữ viết sạch đẹp, năng nổ văn nghệ...)"
                    value={customNotes[st.id] || ''}
                    onChange={(e) => setCustomNotes({ ...customNotes, [st.id]: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50 text-slate-700"
                  />
                  <VoiceInputButton
                    size="sm"
                    title="Đọc gợi ý riêng cho em này"
                    onResult={(text) => {
                      const current = customNotes[st.id] || '';
                      setCustomNotes({ ...customNotes, [st.id]: current ? `${current} ${text}` : text });
                    }}
                  />
                </div>

                {/* Comment text area */}
                <div className="relative space-y-1">
                  <div className="relative">
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) =>
                        updateTermSummary(st.id, currentTerm, { teacherComment: e.target.value })
                      }
                      placeholder="Chưa có lời nhận xét. Nhấp 'Tạo nhận xét AI' bên dưới hoặc bấm nút Micro để đọc..."
                      className="w-full p-3 pr-10 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50/50 resize-none font-medium"
                    />
                    <div className="absolute right-2 top-2">
                      <VoiceInputButton
                        size="sm"
                        title="Đọc nhận xét cho học sinh này"
                        onResult={(text) => {
                          const current = comment || '';
                          updateTermSummary(st.id, currentTerm, {
                            teacherComment: current ? `${current} ${text}` : text,
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* AI Generation Live Source Badge */}
                  {comment && (
                    <div className="flex items-center justify-between text-[10px] px-1 text-slate-400">
                      {sourceInfo ? (
                        <span className={`inline-flex items-center gap-1 font-semibold ${sourceInfo.isRealAI ? 'text-purple-700' : 'text-emerald-700'}`}>
                          {sourceInfo.isRealAI ? <Sparkles className="w-3 h-3 text-purple-600" /> : <Zap className="w-3 h-3 text-emerald-600" />}
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
                  disabled={isGenerating || isGeneratingAll}
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
                      <span>{comment ? 'Tạo lại nhận xét' : 'Tạo nhận xét'}</span>
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

      {/* POP-UP CONFIGURATION MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Cấu Hình Tham Số Nhận Xét Sư Phạm & Chế Độ AI
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tùy chỉnh phương thức sinh nhận xét, phong cách, độ dài và các nguồn dữ liệu đầu vào.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* SECTION 1: CHỌN CHẾ ĐỘ SINH NHẬN XÉT (MODE SELECTOR) */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  <span>1. Phương Thức & Chế Độ Sinh Nhận Xét:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: AI Online */}
                  <div
                    onClick={() => setTempSettings({ ...tempSettings, mode: 'AI_ONLINE' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      tempSettings.mode === 'AI_ONLINE'
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-sm text-purple-950">Mô Hình AI Trực Tuyến</span>
                      </div>
                      {tempSettings.mode === 'AI_ONLINE' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Sử dụng trí tuệ nhân tạo (Xiaomi MIMO / GPT-4o / Gemini) viết văn tự nhiên, uyển chuyển theo gợi ý.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-purple-100 flex items-center justify-between text-[10px] text-purple-800">
                      <span>Mô hình: <strong>{aiConfig?.modelName || 'mimo-v2.5'}</strong></span>
                      <Link href="/settings" className="underline font-bold" onClick={() => setIsConfigModalOpen(false)}>
                        Đổi nhà cung cấp
                      </Link>
                    </div>
                  </div>

                  {/* Option 2: Smart Offline Bank */}
                  <div
                    onClick={() => setTempSettings({ ...tempSettings, mode: 'OFFLINE_BANK' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      tempSettings.mode === 'OFFLINE_BANK'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-sm text-emerald-950">Tự Động Ngoại Tuyến (Offline)</span>
                      </div>
                      {tempSettings.mode === 'OFFLINE_BANK' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Hệ thống tự phân tích điểm số, nề nếp và sao thi đua theo thuật toán sư phạm Thông tư 27.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-emerald-100 text-[10px] text-emerald-800 font-semibold">
                      ⚡ 100% không cần mạng, không tốn API, tốc độ tức thì.
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: VĂN PHONG SƯ PHẠM */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>2. Văn Phong & Phong Thái:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomToneInput(!isCustomToneInput)}
                    className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isCustomToneInput ? 'Mẫu có sẵn' : 'Tùy chỉnh riêng'}</span>
                  </button>
                </div>

                {!isCustomToneInput ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      { id: 'standard', label: 'Chuẩn Sư Phạm', desc: 'Mẫu mực Thông tư 27' },
                      { id: 'encouraging', label: 'Ấm Áp - Động Viên', desc: 'Thân mật, khích lệ' },
                      { id: 'detailed', label: 'Đầy Đủ - Chi Tiết', desc: 'Phân tích sâu môn học' },
                      { id: 'concise', label: 'Ngắn Gọn Súc Tích', desc: 'Dễ đọc, tối giản' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTempSettings({ ...tempSettings, tone: t.id as AIToneType })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          tempSettings.tone === t.id
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <p className="font-bold text-xs">{t.label}</p>
                        <p className={`text-[10px] mt-0.5 ${tempSettings.tone === t.id ? 'text-purple-100' : 'text-slate-400'}`}>
                          {t.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <textarea
                      rows={2}
                      value={tempSettings.customToneText || ''}
                      onChange={(e) => setTempSettings({ ...tempSettings, tone: 'custom', customToneText: e.target.value })}
                      placeholder="Mô tả văn phong của cô giáo (Ví dụ: giọng văn dịu dàng, khuyên nhủ ân cần, xưng hô 'cô khen em'...)"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>

              {/* SECTION 3: ĐỘ DÀI LỜI NHẬN XÉT */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
                  <span>3. Độ Dài Lời Nhận Xét:</span>
                </label>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {LENGTH_PRESETS.map((lp) => (
                      <button
                        key={lp.id}
                        type="button"
                        onClick={() => handleApplyLengthPreset(lp)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          tempSettings.lengthPreset === lp.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <p className="font-bold text-xs">{lp.label}</p>
                        <p className={`text-[10px] mt-0.5 font-mono ${tempSettings.lengthPreset === lp.id ? 'text-blue-100' : 'text-slate-400'}`}>
                          ~{lp.words} từ
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Slider for fine-tuning word count */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span>Căn chỉnh chi tiết:</span>
                      <span className="font-mono font-bold text-blue-600">
                        ~{tempSettings.targetWordCount} từ ({tempSettings.targetSentenceCount} câu)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={120}
                      step={5}
                      value={tempSettings.targetWordCount}
                      onChange={(e) => {
                        const words = Number(e.target.value);
                        const sentences = words <= 40 ? 2 : words <= 70 ? 3 : words <= 95 ? 4 : 5;
                        setTempSettings({
                          ...tempSettings,
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

              {/* SECTION 4: DỮ LIỆU ĐẦU VÀO */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>4. Dữ Liệu Học Sinh Đưa Vào Đánh Giá:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => setTempSettings({ ...tempSettings, includeSubjectGrades: !tempSettings.includeSubjectGrades })}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      tempSettings.includeSubjectGrades
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {tempSettings.includeSubjectGrades ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span>Điểm số & Đánh giá môn học (T/H/C)</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setTempSettings({ ...tempSettings, includeDailyStarsAndComments: !tempSettings.includeDailyStarsAndComments })}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      tempSettings.includeDailyStarsAndComments
                        ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {tempSettings.includeDailyStarsAndComments ? (
                        <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span>Lịch sử nề nếp & Nhận xét hàng ngày</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setTempSettings({ ...tempSettings, includeTraitsAndCompetencies: !tempSettings.includeTraitsAndCompetencies })}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      tempSettings.includeTraitsAndCompetencies
                        ? 'bg-purple-50/70 border-purple-300 text-purple-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {tempSettings.includeTraitsAndCompetencies ? (
                        <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span>Năng lực & Phẩm chất chủ yếu (T/Đ/C)</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setTempSettings({ ...tempSettings, includeAttendanceAndBoarding: !tempSettings.includeAttendanceAndBoarding })}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      tempSettings.includeAttendanceAndBoarding
                        ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {tempSettings.includeAttendanceAndBoarding ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span>Chuyên cần & Sinh hoạt bán trú</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* SECTION 5: YÊU CẦU & ĐỊNH HƯỚNG BỔ SUNG */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>5. Yêu Cầu & Định Hướng Bổ Sung Cho Toàn Lớp:</span>
                  </label>
                  {tempSettings.classDirectivePrompt && (
                    <button
                      type="button"
                      onClick={() => setTempSettings({ ...tempSettings, classDirectivePrompt: '' })}
                      className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Xóa định hướng</span>
                    </button>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={tempSettings.classDirectivePrompt || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, classDirectivePrompt: e.target.value })}
                  placeholder="Ví dụ: Đợt thi đua chào mừng 20/11 vừa qua lớp đạt kết quả rất tốt, hãy lồng ghép lời khen tinh thần nề nếp và nhắc nhở chuẩn bị bài chu đáo..."
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none leading-relaxed"
                />

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Gợi ý:</span>
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
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleSaveModalSettings}
                className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Lưu & Áp Dụng Cấu Hình</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
