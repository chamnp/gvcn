'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Sparkles,
  Award,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { EvaluationProgress, GuardrailIssue } from '@/lib/tt27-engine';

interface ProgressMeterWidgetProps {
  progress: EvaluationProgress;
  issues: GuardrailIssue[];
  isFilterIncomplete: boolean;
  onToggleFilterIncomplete: () => void;
  onOpenGuardrailsModal?: () => void;
  compact?: boolean;
}

export function ProgressMeterWidget({
  progress,
  issues,
  isFilterIncomplete,
  onToggleFilterIncomplete,
  onOpenGuardrailsModal,
  compact = false,
}: ProgressMeterWidgetProps) {
  const errorCount = issues.filter((i) => i.type === 'ERROR').length;
  const warningCount = issues.filter((i) => i.type === 'WARNING').length;

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  progress.overallPercentage === 100
                    ? 'text-emerald-500'
                    : progress.overallPercentage > 50
                    ? 'text-blue-600'
                    : 'text-amber-500'
                }
                strokeDasharray={`${progress.overallPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-black text-xs text-slate-800">
              {progress.overallPercentage}%
            </span>
          </div>

          <div>
            <h4 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <span>Tiến Độ Đánh Giá TT27</span>
              {progress.overallPercentage === 100 ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Hoàn thành 100%
                </span>
              ) : (
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Đang thực hiện
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Môn học ({progress.subjects.percentage}%) • Phẩm chất ({progress.qualities.percentage}%) • Năng lực ({progress.competencies.percentage}%) • Nhận xét ({progress.comments.percentage}%)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {issues.length > 0 && onOpenGuardrailsModal && (
            <button
              type="button"
              onClick={onOpenGuardrailsModal}
              className="inline-flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>{issues.length} Cảnh báo</span>
            </button>
          )}

          {progress.incompleteStudentIds.length > 0 && (
            <button
              type="button"
              onClick={onToggleFilterIncomplete}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isFilterIncomplete
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {isFilterIncomplete
                  ? 'Hiện tất cả lớp'
                  : `Lọc ${progress.incompleteStudentIds.length} HS chưa xong`}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full Expanded Widget
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20 shrink-0 mt-0.5 sm:mt-0">
            📊
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                Tiến Độ Hồ Sơ Đánh Giá Định Kỳ (Thông tư 27)
              </h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                  progress.overallPercentage === 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                Tổng thể: {progress.overallPercentage}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Theo dõi tình trạng nhập điểm, nhận xét phẩm chất, năng lực và lời nhận xét học bạ của lớp.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {issues.length > 0 && onOpenGuardrailsModal && (
            <button
              type="button"
              onClick={onOpenGuardrailsModal}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                errorCount > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>
                {errorCount > 0 ? `${errorCount} Lỗi Logic!` : `${warningCount} Cảnh Báo`}
              </span>
            </button>
          )}

          {progress.incompleteStudentIds.length > 0 && (
            <button
              type="button"
              onClick={onToggleFilterIncomplete}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isFilterIncomplete
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {isFilterIncomplete
                  ? 'Xem Tất Cả Lớp'
                  : `Lọc ${progress.incompleteStudentIds.length} HS Chưa Xong`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Pillars Progress Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pillar 1: Subjects */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Môn Học</span>
            </span>
            <span className="font-mono font-black text-blue-600">
              {progress.subjects.percentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.subjects.percentage}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-medium text-right">
            {progress.subjects.assessed}/{progress.subjects.total} lượt đánh giá
          </div>
        </div>

        {/* Pillar 2: Qualities */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>2. 5 Phẩm Chất</span>
            </span>
            <span className="font-mono font-black text-amber-600">
              {progress.qualities.percentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.qualities.percentage}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-medium text-right">
            {progress.qualities.assessed}/{progress.qualities.total} lượt đánh giá
          </div>
        </div>

        {/* Pillar 3: Competencies */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>3. Năng Lực</span>
            </span>
            <span className="font-mono font-black text-indigo-600">
              {progress.competencies.percentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.competencies.percentage}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-medium text-right">
            {progress.competencies.assessed}/{progress.competencies.total} lượt đánh giá
          </div>
        </div>

        {/* Pillar 4: Comments */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
              <span>4. Lời Nhận Xét</span>
            </span>
            <span className="font-mono font-black text-purple-600">
              {progress.comments.percentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.comments.percentage}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-medium text-right">
            {progress.comments.assessed}/{progress.comments.total} học sinh
          </div>
        </div>
      </div>
    </div>
  );
}
