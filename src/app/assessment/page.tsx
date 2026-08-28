'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  PRIMARY_SUBJECTS,
  TRAIT_DEFINITIONS,
  TERMS,
  evaluateStudentTT27,
  getLevelBadgeClass,
  getAwardBadgeClass,
} from '@/lib/tt27-engine';
import { SubjectLevel, TraitLevel } from '@/types';
import { exportTT27Form1, exportVnEduTemplate } from '@/lib/excel-export';
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
  const termName = TERMS.find((t) => t.id === currentTerm)?.name || currentTerm;

  const currentGrade = classInfo?.grade || 4;
  const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(currentGrade));
  const qualities = TRAIT_DEFINITIONS.filter((t) => t.category === 'PHAM_CHAT');
  const generalCompetencies = TRAIT_DEFINITIONS.filter((t) => t.category === 'NL_CHUNG');
  const specialCompetencies = TRAIT_DEFINITIONS.filter((t) => t.category === 'NL_DAC_THU');

  // Lấy dữ liệu môn học
  const getSubjectData = (studentId: string, subjectCode: string) => {
    return subjectAssessments.find(
      (a) => a.studentId === studentId && a.subjectCode === subjectCode && a.term === currentTerm
    );
  };

  // Lấy dữ liệu phẩm chất / năng lực
  const getTraitData = (studentId: string, traitCode: string) => {
    return traitAssessments.find(
      (a) => a.studentId === studentId && a.traitCode === traitCode && a.term === currentTerm
    );
  };

  // Chấm nhanh môn học
  const handleBatchSubject = (subjectCode: string, level: SubjectLevel) => {
    batchSetSubjectLevel(subjectCode, level);
    toast.success(`Đã đặt tất cả học sinh môn ${subjectCode} là mức "${level}"`);
  };

  // Chấm nhanh phẩm chất / năng lực
  const handleBatchTrait = (traitCode: string, level: TraitLevel) => {
    batchSetTraitLevel(traitCode, level);
    toast.success(`Đã đặt tất cả học sinh tiêu chí này là mức "${level}"`);
  };

  // Tính lại toàn bộ danh hiệu
  const handleRecalculateAwards = () => {
    recalculateAllAwards(currentTerm);
    toast.success('Đã tự động tính toán lại danh hiệu Khen thưởng theo Thông tư 27!');
  };

  // Xuất Excel Mẫu 1
  const handleExportForm1 = () => {
    exportTT27Form1(classInfo, students, subjectAssessments, traitAssessments, termSummaries, currentTerm);
    toast.success('Đã xuất file Bảng tổng hợp kết quả đánh giá giáo dục (Mẫu 1 - TT27)!');
  };

  // Xuất file VnEdu / SMAS
  const handleExportVnEdu = () => {
    exportVnEduTemplate(classInfo, students, subjectAssessments, currentTerm);
    toast.success('Đã xuất file mẫu nhập điểm VnEdu / SMAS!');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" />
            <span className="hidden sm:inline">Bảng Đánh Giá Học Sinh Theo Thông Tư 27</span><span className="sm:hidden">Đánh Giá TT27</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kỳ đánh giá: <strong className="text-blue-600 font-bold">{termName}</strong> - Lớp {classInfo.name} ({classInfo.schoolName})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRecalculateAwards}
            className="inline-flex justify-center items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors w-full sm:w-auto"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Tự Động Xét Khen Thưởng</span><span className="sm:hidden">Xét Khen Thưởng</span>
          </button>

          <button
            onClick={handleExportVnEdu}
            className="inline-flex justify-center items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors w-full sm:w-auto"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất VnEdu/SMAS</span>
          </button>

          <button
            onClick={handleExportForm1}
            className="inline-flex justify-center items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors w-full sm:w-auto"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Excel Mẫu 1 (TT27)</span><span className="sm:hidden">Xuất Mẫu 1</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-nowrap items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('SUBJECTS')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'SUBJECTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="hidden sm:inline">1. Đánh Giá Môn Học & HĐGD</span><span className="sm:hidden">Môn Học</span>
        </button>
        <button
          onClick={() => setActiveTab('QUALITIES')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'QUALITIES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="hidden sm:inline">2. Đánh Giá 5 Phẩm Chất</span><span className="sm:hidden">Phẩm Chất</span>
        </button>
        <button
          onClick={() => setActiveTab('COMPETENCIES')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'COMPETENCIES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="hidden sm:inline">3. Đánh Giá Năng Lực Cốt Lõi</span><span className="sm:hidden">Năng Lực</span>
        </button>
        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'SUMMARY'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="hidden sm:inline">4. Tổng Hợp & Khen Thưởng (TT27)</span><span className="sm:hidden">Tổng Hợp</span>
        </button>
      </div>

      {/* TAB 1: SUBJECTS ASSESSMENT */}
      {activeTab === 'SUBJECTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    STT
                  </th>
                  <th className="py-3 px-3 w-28 sm:w-40 sticky left-10 bg-slate-50 z-10 border-r border-slate-200">
                    Họ và Tên
                  </th>
                  {subjects.map((sub) => (
                    <th key={sub.code} className="py-2.5 px-3 text-center border-r border-slate-200 min-w-[130px]">
                      <div className="font-bold text-slate-800">{sub.shortName}</div>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <button
                          onClick={() => handleBatchSubject(sub.code, 'T')}
                          title="Đặt tất cả là T (Hoàn thành tốt)"
                          className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded text-[10px] hover:bg-emerald-200 font-bold"
                        >
                          Tất cả T
                        </button>
                        <button
                          onClick={() => handleBatchSubject(sub.code, 'H')}
                          title="Đặt tất cả là H (Hoàn thành)"
                          className="bg-blue-100 text-blue-800 px-1 py-0.2 rounded text-[10px] hover:bg-blue-200 font-bold"
                        >
                          Tất cả H
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 border-r border-slate-100 truncate max-w-[160px]">
                      {st.fullName}
                    </td>

                    {subjects.map((sub) => {
                      const data = getSubjectData(st.id, sub.code);
                      const currentLevel: SubjectLevel = data?.level || 'H';
                      const currentScore = data?.score !== undefined ? data.score : '';

                      return (
                        <td key={sub.code} className="py-2 px-2 text-center border-r border-slate-100">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Level Selector */}
                            <select
                              value={currentLevel}
                              onChange={(e) =>
                                updateSubjectAssessment(
                                  st.id,
                                  sub.code,
                                  currentTerm,
                                  e.target.value as SubjectLevel,
                                  data?.score
                                )
                              }
                              className={`px-2 py-1 rounded text-xs font-bold border focus:outline-none ${getLevelBadgeClass(
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
                                className="w-14 px-1.5 py-1 text-center font-mono font-bold text-xs rounded border border-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-slate-50"
                              />
                            )}
                          </div>
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

      {/* TAB 2: QUALITIES ASSESSMENT */}
      {activeTab === 'QUALITIES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    STT
                  </th>
                  <th className="py-3 px-3 w-28 sm:w-40 sticky left-10 bg-slate-50 z-10 border-r border-slate-200">
                    Họ và Tên
                  </th>
                  {qualities.map((q) => (
                    <th key={q.code} className="py-2.5 px-3 text-center border-r border-slate-200 min-w-[130px]">
                      <div className="font-bold text-slate-800">{q.shortName}</div>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <button
                          onClick={() => handleBatchTrait(q.code, 'T')}
                          className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded text-[10px] hover:bg-emerald-200 font-bold"
                        >
                          Tất cả T
                        </button>
                        <button
                          onClick={() => handleBatchTrait(q.code, 'Đ')}
                          className="bg-blue-100 text-blue-800 px-1 py-0.2 rounded text-[10px] hover:bg-blue-200 font-bold"
                        >
                          Tất cả Đ
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 border-r border-slate-100 truncate max-w-[160px]">
                      {st.fullName}
                    </td>

                    {qualities.map((q) => {
                      const data = getTraitData(st.id, q.code);
                      const currentLevel: TraitLevel = data?.level || 'Đ';

                      return (
                        <td key={q.code} className="py-2 px-2 text-center border-r border-slate-100">
                          <select
                            value={currentLevel}
                            onChange={(e) =>
                              updateTraitAssessment(
                                st.id,
                                q.code,
                                'PHAM_CHAT',
                                currentTerm,
                                e.target.value as TraitLevel
                              )
                            }
                            className={`px-3 py-1 rounded text-xs font-bold border focus:outline-none ${getLevelBadgeClass(
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    STT
                  </th>
                  <th className="py-3 px-3 w-28 sm:w-40 sticky left-10 bg-slate-50 z-10 border-r border-slate-200">
                    Họ và Tên
                  </th>
                  {[...generalCompetencies, ...specialCompetencies].map((c) => (
                    <th key={c.code} className="py-2.5 px-3 text-center border-r border-slate-200 min-w-[130px]">
                      <div className="font-bold text-slate-800">{c.shortName}</div>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <button
                          onClick={() => handleBatchTrait(c.code, 'T')}
                          className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded text-[10px] hover:bg-emerald-200 font-bold"
                        >
                          Tất cả T
                        </button>
                        <button
                          onClick={() => handleBatchTrait(c.code, 'Đ')}
                          className="bg-blue-100 text-blue-800 px-1 py-0.2 rounded text-[10px] hover:bg-blue-200 font-bold"
                        >
                          Tất cả Đ
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 border-r border-slate-100 truncate max-w-[160px]">
                      {st.fullName}
                    </td>

                    {[...generalCompetencies, ...specialCompetencies].map((c) => {
                      const data = getTraitData(st.id, c.code);
                      const currentLevel: TraitLevel = data?.level || 'Đ';

                      return (
                        <td key={c.code} className="py-2 px-2 text-center border-r border-slate-100">
                          <select
                            value={currentLevel}
                            onChange={(e) =>
                              updateTraitAssessment(
                                st.id,
                                c.code,
                                c.category,
                                currentTerm,
                                e.target.value as TraitLevel
                              )
                            }
                            className={`px-3 py-1 rounded text-xs font-bold border focus:outline-none ${getLevelBadgeClass(
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

      {/* TAB 4: SUMMARY & AWARDS */}
      {activeTab === 'SUMMARY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Tổng Hợp Đánh Giá & Khen Thưởng Theo Điều 13 - Thông Tư 27
              </h3>
              <p className="text-xs text-slate-500">
                Tự động kiểm tra điều kiện Môn học (T/H/C), Điểm KTĐK (từ 9.0 hoặc từ 7.0 trở lên), Phẩm chất và Năng lực.
              </p>
            </div>
            <button
              onClick={handleRecalculateAwards}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs"
            >
              Tính lại danh hiệu
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">STT</th>
                  <th className="py-3 px-3 w-36">Họ và Tên</th>
                  <th className="py-3 px-3 w-28 text-center">Mức Học Tập</th>
                  <th className="py-3 px-3 w-28 text-center">Mức PC & NL</th>
                  <th className="py-3 px-3 w-48">Danh Hiệu Khen Thưởng</th>
                  <th className="py-3 px-3">Lời Nhận Xét Học Bạ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st, idx) => {
                  const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                  const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
                  const summary = termSummaries.find((s) => s.studentId === st.id && s.term === currentTerm);
                  const evalRes = evaluateStudentTT27(sAss, tAss, currentTerm);
                  const award = summary?.awardTitle || evalRes.awardTitle;
                  const comment = summary?.teacherComment || '';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{st.fullName}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                          {evalRes.overallLearningLevel === 'T' ? 'Hoàn thành tốt (T)' : evalRes.overallLearningLevel === 'H' ? 'Hoàn thành (H)' : 'Chưa HT (C)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                          {evalRes.overallTraitsLevel === 'T' ? 'Tốt (T)' : evalRes.overallTraitsLevel === 'Đ' ? 'Đạt (Đ)' : 'Cần cố gắng (C)'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-md border text-xs font-bold ${getAwardBadgeClass(award)}`}>
                          {award}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder="Nhập nhận xét hoặc dùng Trợ lý AI..."
                          value={comment}
                          onChange={(e) =>
                            updateTermSummary(st.id, currentTerm, { teacherComment: e.target.value })
                          }
                          className="w-full px-2.5 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
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
  );
}
