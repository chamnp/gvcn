'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { generateStudentAIComment } from '@/lib/ai-service';
import { TERMS, evaluateStudentTT27, getAwardBadgeClass } from '@/lib/tt27-engine';
import { toast } from 'sonner';

export default function AIAssistantPage() {
  const {
    students,
    classInfo,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    updateTermSummary,
    apiKey,
    setApiKey,
  } = useAppStore();

  const [selectedTone, setSelectedTone] = useState<'standard' | 'encouraging' | 'detailed' | 'concise'>('standard');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<{ [studentId: string]: string }>({});

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;

  // Sinh nhận xét cho 1 học sinh
  const handleGenerateSingle = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setGeneratingStudentId(studentId);
    const sAss = subjectAssessments.filter((a) => a.studentId === studentId && a.term === currentTerm);
    const tAss = traitAssessments.filter((a) => a.studentId === studentId && a.term === currentTerm);

    try {
      const comment = await generateStudentAIComment({
        student,
        subjects: sAss,
        traits: tAss,
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
    toast.info(`Đang sinh nhận xét tự động cho ${students.length} học sinh...`);

    for (const student of students) {
      const sAss = subjectAssessments.filter((a) => a.studentId === student.id && a.term === currentTerm);
      const tAss = traitAssessments.filter((a) => a.studentId === student.id && a.term === currentTerm);

      const comment = await generateStudentAIComment({
        student,
        subjects: sAss,
        traits: tAss,
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
            <Sparkles className="w-7 h-7 text-purple-600" />
            <span>Trợ Lý Sư Phạm AI - Viết Lời Nhận Xét Học Bạ</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tạo lời nhận xét chuẩn văn phong Thông tư 27/2020/TT-BGDĐT, không trùng lặp, mang tính động viên sư phạm.
          </p>
        </div>

        <button
          onClick={handleGenerateAll}
          disabled={isGeneratingAll}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
        >
          {isGeneratingAll ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang Sinh Tự Động...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>Sinh Nhận Xét 1-Click Cho Cả Lớp</span>
            </>
          )}
        </button>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Tone Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Phong cách nhận xét:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'standard', label: 'Chuẩn Sư Phạm' },
              { id: 'encouraging', label: 'Ấm Áp - Động Viên' },
              { id: 'detailed', label: 'Đầy Đủ - Chi Tiết' },
              { id: 'concise', label: 'Ngắn Gọn' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTone(t.id as any)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  selectedTone === t.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gemini API Key Box (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Gemini API Key (Tùy chọn cho AI LLM):</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Mặc định dùng Ngân hàng Sư phạm Offline 100%)
            </span>
          </label>
          <div className="flex space-x-2">
            <input
              type="password"
              placeholder="AIzaSy... (để trống nếu dùng ngân hàng mẫu offline)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50"
            />
            {apiKey && (
              <button
                onClick={() => toast.success('Đã lưu khóa API Gemini!')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Lưu
              </button>
            )}
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

          return (
            <div
              key={st.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all space-y-3.5"
            >
              {/* Student Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{st.fullName}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{st.studentCode}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${getAwardBadgeClass(award)}`}>
                  {award}
                </span>
              </div>

              {/* Custom teacher notes */}
              <div>
                <input
                  type="text"
                  placeholder="Gợi ý thêm: VD: chữ viết sạch đẹp, năng nổ trong giờ văn nghệ..."
                  value={customNotes[st.id] || ''}
                  onChange={(e) => setCustomNotes({ ...customNotes, [st.id]: e.target.value })}
                  className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-slate-50 text-slate-700"
                />
              </div>

              {/* Comment text area */}
              <div className="relative">
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) =>
                    updateTermSummary(st.id, currentTerm, { teacherComment: e.target.value })
                  }
                  placeholder="Chưa có lời nhận xét. Nhấp 'Tạo nhận xét AI' bên dưới..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50/50 resize-none font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleGenerateSingle(st.id)}
                  disabled={isGenerating}
                  className="inline-flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
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
                    className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-900 text-xs font-semibold px-2.5 py-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    {copiedId === st.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Đã chép</span>
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
