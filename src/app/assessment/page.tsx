'use client';

import React, { useState, useMemo, useRef } from 'react';
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
import { SubjectLevel, TraitLevel } from '@/types';
import { exportTT27Form1, exportVnEduTemplate } from '@/lib/excel-export';
import { ProgressMeterWidget } from '@/components/assessment/progress-meter-widget';
import { GuardrailsAlertModal } from '@/components/assessment/guardrails-alert-modal';
import { VoiceInputButton } from '@/components/ui/voice-input-button';
import { toast } from 'sonner';

export default function AssessmentPage() {
  const {
    students,
    classInfo,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    updateSubjectAssessment,
    batchSetSubjectLevel,
    updateTraitAssessment,
    batchSetTraitLevel,
    updateTermSummary,
    recalculateAllAwards,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'QUALITIES' | 'COMPETENCIES' | 'SUMMARY'>('SUBJECTS');
  const [isFilterIncomplete, setIsFilterIncomplete] = useState(false);
  const [isGuardrailsModalOpen, setIsGuardrailsModalOpen] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;
  const currentGrade = classInfo?.grade || 4;
  const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(currentGrade));
  const qualities = TRAIT_DEFINITIONS.filter((t) => t.category === 'PHAM_CHAT');
  const generalCompetencies = TRAIT_DEFINITIONS.filter((t) => t.category === 'NL_CHUNG');
  const specialCompetencies = TRAIT_DEFINITIONS.filter((t) => t.category === 'NL_DAC_THU');

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

  // Filter students if toggle is active
  const displayedStudents = useMemo(() => {
    if (!isFilterIncomplete) return students;
    return students.filter((s) => progress.incompleteStudentIds.includes(s.id));
  }, [students, isFilterIncomplete, progress.incompleteStudentIds]);

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
      
      // Move focus down to next student
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

      // Move focus down to next student
      const nextId = `trait-select-${studentIndex + 1}-${traitIndex}`;
      const nextEl = document.getElementById(nextId);
      if (nextEl) nextEl.focus();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" />
            <span className="hidden sm:inline">Bảng Đánh Giá Học Sinh Theo Thông Tư 27</span>
            <span className="sm:hidden">Đánh Giá TT27</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kỳ đánh giá: <strong className="text-blue-600 font-bold">{termName}</strong> • Lớp {classInfo.name} ({classInfo.schoolName})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Xem hướng dẫn phím tắt"
          >
            <Keyboard className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">Phím Tắt</span>
          </button>

          <button
            type="button"
            onClick={handleRecalculateAwards}
            className="inline-flex justify-center items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Tự Động Xét Khen Thưởng</span>
            <span className="sm:hidden">Xét Khen Thưởng</span>
          </button>

          <button
            type="button"
            onClick={handleExportVnEdu}
            className="inline-flex justify-center items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>VnEdu/SMAS</span>
          </button>

          <button
            type="button"
            onClick={handleExportForm1}
            className="inline-flex justify-center items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Mẫu 1 (TT27)</span>
            <span className="sm:hidden">Mẫu 1</span>
          </button>
        </div>
      </div>

      {/* SHORTCUTS HELP BANNER */}
      {showShortcutsHelp && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="space-y-1">
            <h4 className="font-bold flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-blue-600" />
              <span>⚡ Mẹo Chấm Siêu Tốc Bằng Bàn Phím (Matrix Fast-Grid):</span>
            </h4>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              • Khi đang chọn ô Môn học: Nhấn phím <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">T</kbd> (Tốt), <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">H</kbd> (Đạt), <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">C</kbd> (Cố gắng) để lưu và tự động nhảy xuống học sinh tiếp theo!
              <br />
              • Khi đang chọn ô Phẩm chất/Năng lực: Nhấn <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">T</kbd> (Tốt), <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">Đ</kbd> (Đạt), <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">C</kbd> (Cố gắng).
              <br />
              • Dùng phím <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold">Tab</kbd> hoặc các mũi tên để di chuyển nhanh giữa các ô.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowShortcutsHelp(false)}
            className="text-blue-500 hover:text-blue-700 font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. PROGRESS METER WIDGET */}
      <ProgressMeterWidget
        progress={progress}
        issues={issues}
        isFilterIncomplete={isFilterIncomplete}
        onToggleFilterIncomplete={() => setIsFilterIncomplete(!isFilterIncomplete)}
        onOpenGuardrailsModal={() => setIsGuardrailsModalOpen(true)}
      />

      {/* FILTER ACTIVE BANNER */}
      {isFilterIncomplete && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-rose-600" />
            <span>
              Đang lọc <strong>{displayedStudents.length} học sinh</strong> chưa hoàn tất hồ sơ đánh giá.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterIncomplete(false)}
            className="bg-white hover:bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-xl border border-rose-300 cursor-pointer"
          >
            Hiện Toàn Bộ Lớp ({students.length} HS)
          </button>
        </div>
      )}

      {/* 2. TABS SELECTOR */}
      <div className="flex flex-nowrap items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('SUBJECTS')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUBJECTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>1. Đánh Giá Môn Học ({progress.subjects.percentage}%)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('QUALITIES')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'QUALITIES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>2. 5 Phẩm Chất ({progress.qualities.percentage}%)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('COMPETENCIES')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'COMPETENCIES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>3. Năng Lực Cốt Lõi ({progress.competencies.percentage}%)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SUMMARY')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUMMARY'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>4. Tổng Hợp & Lời Nhận Xét ({progress.comments.percentage}%)</span>
        </button>
      </div>

      {/* TAB 1: SUBJECTS ASSESSMENT */}
      {activeTab === 'SUBJECTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    STT
                  </th>
                  <th className="py-3 px-3 w-32 sm:w-44 sticky left-10 bg-slate-50 z-10 border-r border-slate-200">
                    Họ và Tên
                  </th>
                  {subjects.map((sub, sIdx) => (
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
                {displayedStudents.map((st, idx) => {
                  const stIssues = getStudentIssues(st.id).filter((i) => i.category === 'SUBJECTS');
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 border-r border-slate-100 truncate max-w-[170px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="truncate">{st.fullName}</span>
                          {stIssues.length > 0 && (
                            <span
                              title={stIssues.map((i) => i.message).join('\n')}
                              className="w-2 h-2 rounded-full bg-amber-500 shrink-0 cursor-help"
                            />
                          )}
                        </div>
                      </td>

                      {subjects.map((sub, sIdx) => {
                        const data = getSubjectData(st.id, sub.code);
                        const currentLevel: SubjectLevel = data?.level || 'H';
                        const currentScore = data?.score !== undefined ? data.score : '';

                        return (
                          <td key={sub.code} className="py-2 px-2 text-center border-r border-slate-100">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* Level Selector with Fast-Grid keyboard shortcut */}
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
                                    data?.score
                                  )
                                }
                                className={`px-2 py-1 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer ${getLevelBadgeClass(
                                  currentLevel
                                )}`}
                              >
                                <option value="T">T (Tốt)</option>
                                <option value="H">H (Đạt)</option>
                                <option value="C">C (Cố gắng)</option>
                              </select>

                              {/* Score Input (for subjects with tests) */}
                              {sub.hasPeriodicTest && (
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="10"
                                  placeholder="Điểm"
                                  value={currentScore}
                                  onChange={(e) => {
                                    if (e.target.value === '') {
                                      updateSubjectAssessment(st.id, sub.code, currentTerm, currentLevel, undefined);
                                      return;
                                    }
                                    const parsed = parseFloat(e.target.value);
                                    if (!isNaN(parsed)) {
                                      const val = Math.min(10, Math.max(0, parsed));
                                      updateSubjectAssessment(
                                        st.id,
                                        sub.code,
                                        currentTerm,
                                        currentLevel,
                                        val
                                      );
                                    }
                                  }}
                                  className="w-14 px-1.5 py-1 text-center font-mono font-bold text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                                />
                              )}
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
        </div>
      )}

      {/* TAB 2: QUALITIES ASSESSMENT */}
      {activeTab === 'QUALITIES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    STT
                  </th>
                  <th className="py-3 px-3 w-32 sm:w-44 sticky left-10 bg-slate-50 z-10 border-r border-slate-200">
                    Họ và Tên
                  </th>
                  {qualities.map((q, qIdx) => (
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
                {displayedStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 border-r border-slate-100 truncate max-w-[170px]">
                      {st.fullName}
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
                            className={`px-3 py-1 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer ${getLevelBadgeClass(
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMPETENCIES ASSESSMENT */}
      {activeTab === 'COMPETENCIES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    STT
                  </th>
                  <th className="py-3 px-3 w-32 sm:w-44 sticky left-10 bg-slate-50 z-10 border-r border-slate-200">
                    Họ và Tên
                  </th>
                  {[...generalCompetencies, ...specialCompetencies].map((c, cIdx) => (
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
                {displayedStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 border-r border-slate-100 truncate max-w-[170px]">
                      {st.fullName}
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
                            className={`px-3 py-1 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer ${getLevelBadgeClass(
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
                ))}
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
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Tổng Hợp Đánh Giá & Khen Thưởng Theo Điều 13 - Thông Tư 27
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động kiểm tra điều kiện Môn học (T/H/C), Điểm KTĐK (từ 9.0 hoặc từ 7.0 trở lên), Phẩm chất và Năng lực.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRecalculateAwards}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              Tính Lại Danh Hiệu
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">STT</th>
                  <th className="py-3 px-3 w-36">Họ và Tên</th>
                  <th className="py-3 px-3 w-28 text-center">Mức Học Tập</th>
                  <th className="py-3 px-3 w-28 text-center">Mức PC & NL</th>
                  <th className="py-3 px-3 w-48">Danh Hiệu Khen Thưởng</th>
                  <th className="py-3 px-3">Lời Nhận Xét Học Bạ (Có thể đọc bằng Micro 🎤)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.map((st, idx) => {
                  const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                  const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                  const summary = termSummaries.find((s) => s.studentId === st.id && s.term === currentTerm);
                  const evalRes = evaluateStudentTT27(sAss, tAss, currentTerm);
                  const award = summary?.awardTitle || evalRes.awardTitle;
                  const comment = summary?.teacherComment || '';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{st.fullName}</td>
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
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 hover:bg-white"
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

      {/* GUARDRAILS MODAL */}
      <GuardrailsAlertModal
        isOpen={isGuardrailsModalOpen}
        onClose={() => setIsGuardrailsModalOpen(false)}
        issues={issues}
        onNavigateToStudent={(studentId, category) => {
          setActiveTab(category);
        }}
      />
    </div>
  );
}
