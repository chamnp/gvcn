'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Save,
  Tv,
  Layers,
  BookOpen,
  HelpCircle,
  Clock,
  Settings,
} from 'lucide-react';
import {
  LessonPlan,
  LessonActivity,
  LessonSlide,
  TextbookSeries,
  GradeLevel,
} from '@/types';
import { TEXTBOOK_OPTIONS, GRADE_4_SUBJECTS } from '@/lib/lesson-plan-data';
import { generateAILessonPlan } from '@/lib/lesson-plan-engine';
import { toast } from 'sonner';

interface LessonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: LessonPlan | null;
  onSave: (plan: LessonPlan) => void;
}

export function LessonEditorModal({
  isOpen,
  onClose,
  initialPlan,
  onSave,
}: LessonEditorModalProps) {
  const [activeEditorTab, setActiveEditorTab] = useState<'INFO' | 'OBJECTIVES' | 'ACTIVITIES' | 'SLIDES'>('INFO');

  // Form State
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('TOAN');
  const [grade, setGrade] = useState<GradeLevel>(4);
  const [textbook, setTextbook] = useState<TextbookSeries>('KET_NOI_TRI_THUC');
  const [week, setWeek] = useState(1);
  const [periodNumber, setPeriodNumber] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(35);
  const [embeddedSlideUrl, setEmbeddedSlideUrl] = useState('');

  // Objectives
  const [specificComp, setSpecificComp] = useState<string[]>([]);
  const [generalComp, setGeneralComp] = useState<string[]>([]);
  const [qualities, setQualities] = useState<string[]>([]);

  // Equipment
  const [equipmentTeacher, setEquipmentTeacher] = useState<string[]>([]);
  const [equipmentStudents, setEquipmentStudents] = useState<string[]>([]);

  // Activities
  const [activities, setActivities] = useState<LessonActivity[]>([]);

  // Slides
  const [slides, setSlides] = useState<LessonSlide[]>([]);

  // Post lesson
  const [postLessonNotes, setPostLessonNotes] = useState('');

  // Populate initial plan or generate fresh
  useEffect(() => {
    if (initialPlan) {
      setTitle(initialPlan.title);
      setSubjectCode(initialPlan.subjectCode);
      setGrade(initialPlan.grade);
      setTextbook(initialPlan.textbook);
      setWeek(initialPlan.week);
      setPeriodNumber(initialPlan.periodNumber);
      setDurationMinutes(initialPlan.durationMinutes || 35);
      setEmbeddedSlideUrl(initialPlan.embeddedSlideUrl || '');
      setSpecificComp(initialPlan.objectives.specificCompetencies || []);
      setGeneralComp(initialPlan.objectives.generalCompetencies || []);
      setQualities(initialPlan.objectives.qualities || []);
      setEquipmentTeacher(initialPlan.equipment.teacher || []);
      setEquipmentStudents(initialPlan.equipment.students || []);
      setActivities(initialPlan.activities || []);
      setSlides(initialPlan.slides || []);
      setPostLessonNotes(initialPlan.postLessonNotes || '');
    } else {
      const generated = generateAILessonPlan('Bài học mới', 'TOAN', 4, 'KET_NOI_TRI_THUC', 1, 1);
      setTitle(generated.title);
      setSubjectCode(generated.subjectCode);
      setGrade(generated.grade);
      setTextbook(generated.textbook);
      setWeek(generated.week);
      setPeriodNumber(generated.periodNumber);
      setDurationMinutes(35);
      setEmbeddedSlideUrl('');
      setSpecificComp(generated.objectives.specificCompetencies);
      setGeneralComp(generated.objectives.generalCompetencies);
      setQualities(generated.objectives.qualities);
      setEquipmentTeacher(generated.equipment.teacher);
      setEquipmentStudents(generated.equipment.students);
      setActivities(generated.activities);
      setSlides(generated.slides || []);
      setPostLessonNotes(generated.postLessonNotes || '');
    }
  }, [initialPlan, isOpen]);

  // AI Re-generate handler
  const handleAIRegenerate = () => {
    const fresh = generateAILessonPlan(title || 'Bài học mới', subjectCode, grade, textbook, week, periodNumber);
    setSpecificComp(fresh.objectives.specificCompetencies);
    setGeneralComp(fresh.objectives.generalCompetencies);
    setQualities(fresh.objectives.qualities);
    setEquipmentTeacher(fresh.equipment.teacher);
    setEquipmentStudents(fresh.equipment.students);
    setActivities(fresh.activities);
    setSlides(fresh.slides || []);
    toast.success('✨ AI đã sinh lại toàn bộ nội dung giáo án và slide TV theo chuẩn CV 2345!');
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên bài dạy!');
      return;
    }

    const subjectObj = GRADE_4_SUBJECTS.find((s) => s.code === subjectCode);

    const savedPlan: LessonPlan = {
      id: initialPlan?.id || `lp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      classId: initialPlan?.classId || 'active-class',
      grade,
      subjectCode,
      subjectName: subjectObj?.name || 'Môn học',
      textbook,
      week,
      periodNumber,
      title,
      durationMinutes,
      objectives: {
        specificCompetencies: specificComp.filter(Boolean),
        generalCompetencies: generalComp.filter(Boolean),
        qualities: qualities.filter(Boolean),
      },
      equipment: {
        teacher: equipmentTeacher.filter(Boolean),
        students: equipmentStudents.filter(Boolean),
      },
      activities,
      slides,
      postLessonNotes,
      embeddedSlideUrl: embeddedSlideUrl.trim() || undefined,
      isCompleted: initialPlan?.isCompleted || false,
      createdAt: initialPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedPlan);
    toast.success('Đã lưu Kế hoạch bài dạy thành công! 🎉');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center font-black text-amber-300 border border-white/20">
              📖
            </div>
            <div>
              <h3 className="text-base font-black">
                {initialPlan ? 'Chỉnh Sửa Kế Hoạch Bài Dạy' : 'Soạn Kế Hoạch Bài Dạy Mới (CV 2345)'}
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Khối Lớp {grade} • Bộ GD&ĐT Chuẩn GDPT 2018
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAIRegenerate}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Soạn Lại</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0">
          {[
            { id: 'INFO', label: '📌 1. Thông Tin Chung' },
            { id: 'OBJECTIVES', label: '🎯 2. Yêu Cầu Cần Đạt & Đồ Dùng' },
            { id: 'ACTIVITIES', label: `⚡ 3. Tiến Trình 4 Hoạt Động (${activities.length})` },
            { id: 'SLIDES', label: `📺 4. Slide TV Trực Tiếp (${slides.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveEditorTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: BASIC INFO */}
          {activeEditorTab === 'INFO' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài dạy / Bài học:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Bài 12: Các số có sáu chữ số (Tiết 1)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học:</label>
                  <select
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  >
                    {GRADE_4_SUBJECTS.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bộ sách giáo khoa:</label>
                  <select
                    value={textbook}
                    onChange={(e) => setTextbook(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  >
                    {TEXTBOOK_OPTIONS.map((tb) => (
                      <option key={tb.id} value={tb.id}>
                        {tb.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối lớp:</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value) as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  >
                    {[1, 2, 3, 4, 5].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuần học (1 - 35):</label>
                  <input
                    type="number"
                    min={1}
                    max={35}
                    value={week}
                    onChange={(e) => setWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiết theo PPCT:</label>
                  <input
                    type="number"
                    min={1}
                    value={periodNumber}
                    onChange={(e) => setPeriodNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thời lượng (phút):</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Link nhúng Slide bài giảng online (Canva / Google Slides / Office 365 nếu có):
                </label>
                <input
                  type="url"
                  value={embeddedSlideUrl}
                  onChange={(e) => setEmbeddedSlideUrl(e.target.value)}
                  placeholder="https://www.canva.com/design/... hoặc link Google Slides nhúng"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Điều chỉnh sau bài dạy:</label>
                <textarea
                  rows={3}
                  value={postLessonNotes}
                  onChange={(e) => setPostLessonNotes(e.target.value)}
                  placeholder="Ghi chú nhận xét sau khi dạy trên lớp thực tế..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 2: OBJECTIVES & EQUIPMENT */}
          {activeEditorTab === 'OBJECTIVES' && (
            <div className="space-y-5">
              {/* Specific Competencies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 uppercase">1. Năng lực đặc thù môn học</h4>
                  <button
                    type="button"
                    onClick={() => setSpecificComp([...specificComp, ''])}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm mục tiêu
                  </button>
                </div>
                {specificComp.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...specificComp];
                        updated[idx] = e.target.value;
                        setSpecificComp(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setSpecificComp(specificComp.filter((_, i) => i !== idx))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* General Competencies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 uppercase">2. Năng lực chung</h4>
                  <button
                    type="button"
                    onClick={() => setGeneralComp([...generalComp, ''])}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm mục tiêu
                  </button>
                </div>
                {generalComp.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...generalComp];
                        updated[idx] = e.target.value;
                        setGeneralComp(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setGeneralComp(generalComp.filter((_, i) => i !== idx))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Qualities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 uppercase">3. Phẩm chất chủ yếu</h4>
                  <button
                    type="button"
                    onClick={() => setQualities([...qualities, ''])}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm phẩm chất
                  </button>
                </div>
                {qualities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...qualities];
                        updated[idx] = e.target.value;
                        setQualities(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setQualities(qualities.filter((_, i) => i !== idx))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Equipment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <h4 className="font-black text-slate-900 mb-1">Đồ dùng Giáo viên:</h4>
                  <textarea
                    rows={3}
                    value={equipmentTeacher.join('\n')}
                    onChange={(e) => setEquipmentTeacher(e.target.value.split('\n'))}
                    placeholder="Mỗi đồ dùng 1 dòng..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 mb-1">Đồ dùng Học sinh:</h4>
                  <textarea
                    rows={3}
                    value={equipmentStudents.join('\n')}
                    onChange={(e) => setEquipmentStudents(e.target.value.split('\n'))}
                    placeholder="Mỗi đồ dùng 1 dòng..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 4 PEDAGOGICAL ACTIVITIES */}
          {activeEditorTab === 'ACTIVITIES' && (
            <div className="space-y-6">
              {activities.map((act, actIdx) => (
                <div key={act.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase px-2.5 py-1 rounded-md bg-blue-100 text-blue-900">
                      {act.phase === 'KHOI_DONG'
                        ? '1. Khởi Động'
                        : act.phase === 'KHAM_PHA'
                        ? '2. Khám Phá'
                        : act.phase === 'LUYEN_TAP'
                        ? '3. Luyện Tập'
                        : '4. Vận Dụng'}
                    </span>
                    <input
                      type="text"
                      value={act.title}
                      onChange={(e) => {
                        const updated = [...activities];
                        updated[actIdx] = { ...act, title: e.target.value };
                        setActivities(updated);
                      }}
                      className="flex-1 mx-3 px-3 py-1 font-bold text-slate-900 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 text-[11px] mb-0.5">Mục tiêu hoạt động:</label>
                    <input
                      type="text"
                      value={act.goal}
                      onChange={(e) => {
                        const updated = [...activities];
                        updated[actIdx] = { ...act, goal: e.target.value };
                        setActivities(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-blue-900 text-[11px] mb-0.5">
                        Hoạt động của giáo viên:
                      </label>
                      <textarea
                        rows={4}
                        value={act.teacherActivity}
                        onChange={(e) => {
                          const updated = [...activities];
                          updated[actIdx] = { ...act, teacherActivity: e.target.value };
                          setActivities(updated);
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-emerald-900 text-[11px] mb-0.5">
                        Hoạt động của học sinh:
                      </label>
                      <textarea
                        rows={4}
                        value={act.studentActivity}
                        onChange={(e) => {
                          const updated = [...activities];
                          updated[actIdx] = { ...act, studentActivity: e.target.value };
                          setActivities(updated);
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SLIDES */}
          {activeEditorTab === 'SLIDES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Gồm {slides.length} slide bài giảng sẽ được chiếu trực tiếp lên màn hình TV lớp học.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newSlide: LessonSlide = {
                      id: `sl-${Date.now()}`,
                      title: 'TIÊU ĐỀ SLIDE MỚI',
                      phase: 'KHAM_PHA',
                      layout: 'BULLETS',
                      content: ['Nội dung gạch đầu dòng 1', 'Nội dung gạch đầu dòng 2'],
                    };
                    setSlides([...slides, newSlide]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Slide
                </button>
              </div>

              {slides.map((sl, sIdx) => (
                <div key={sl.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                      {sIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={sl.title}
                      onChange={(e) => {
                        const updated = [...slides];
                        updated[sIdx] = { ...sl, title: e.target.value };
                        setSlides(updated);
                      }}
                      className="flex-1 mx-2 px-3 py-1 font-bold text-slate-900 rounded-lg border border-slate-200 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setSlides(slides.filter((_, i) => i !== sIdx))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 text-[11px] mb-0.5">Nội dung trình chiếu:</label>
                    <textarea
                      rows={3}
                      value={sl.content.join('\n')}
                      onChange={(e) => {
                        const updated = [...slides];
                        updated[sIdx] = { ...sl, content: e.target.value.split('\n') };
                        setSlides(updated);
                      }}
                      placeholder="Mỗi ý 1 dòng..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>LƯU KẾ HOẠCH BÀI DẠY</span>
          </button>
        </div>
      </div>
    </div>
  );
}
