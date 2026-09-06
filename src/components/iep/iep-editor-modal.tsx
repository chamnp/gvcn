'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Users,
  Target,
  HeartHandshake,
  Home,
  CheckCircle2,
  X,
  AlertTriangle,
  Flame,
  Award,
} from 'lucide-react';
import { IEPPlan, Student, IEPCategory, IEPStatus } from '@/types';
import { toast } from 'sonner';

interface IEPEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Omit<IEPPlan, 'id' | 'createdAt'>) => void;
  onUpdate?: (plan: IEPPlan) => void;
  initialPlan?: IEPPlan | null;
  students: Student[];
  classId: string;
}

const COMMON_DIFFICULTIES = [
  'Đọc ngọng âm L/N hoặc Tr/Ch',
  'Tốc độ đọc chậm, chưa ngắt nghỉ đúng dấu câu',
  'Chính tả còn sai phụ âm đầu và dấu thanh',
  'Chữ viết chưa đúng cỡ, trình bày chưa sạch đẹp',
  'Tính nhẩm phép cộng/trừ có nhớ trong phạm vi 100/1000',
  'Chưa thuộc bảng nhân chia 6, 7, 8, 9',
  'Khó khăn trong giải toán có lời văn 2 bước tính',
  'Thiếu tập trung, hay quên đồ dùng học tập',
  'Rụt rè, nhút nhát, ít giơ tay phát biểu',
];

const COMMON_GIFTED_AREAS = [
  'Tư duy Toán học logic, giải toán đố và Violympic xuất sắc',
  'Khả năng cảm thụ văn học, diễn đạt lưu loát, giàu cảm xúc',
  'Vở sạch chữ đẹp, nét chữ đều đặn, nắn nót',
  'Giao tiếp tiếng Anh tự tin, phát âm chuẩn',
  'Năng khiếu Tin học, lập trình Scratch, đồ họa',
  'Năng khiếu Mỹ thuật, phối màu và vẽ tranh sáng tạo',
  'Năng khiếu Thể thao (Cờ vua, Bơi lội, Điền kinh)',
];

const SUBJECT_LIST = [
  { code: 'TOAN', name: 'Toán' },
  { code: 'TIENG_VIET', name: 'Tiếng Việt' },
  { code: 'TIENG_ANH', name: 'Tiếng Anh' },
  { code: 'TIN_HOC', name: 'Tin học' },
  { code: 'KHOA_HOC', name: 'Khoa học' },
  { code: 'LICH_SU_DIA_LY', name: 'Lịch sử & Địa lý' },
  { code: 'MY_THUAT', name: 'Mỹ thuật' },
  { code: 'AM_NHAC', name: 'Âm nhạc' },
  { code: 'THE_CHAT', name: 'Giáo dục thể chất' },
];

export function IEPEditorModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  initialPlan,
  students,
  classId,
}: IEPEditorModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [category, setCategory] = useState<IEPCategory>('CAN_HO_TRO');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['TOAN']);
  const [difficultyAreas, setDifficultyAreas] = useState<string[]>([]);
  const [customDifficulty, setCustomDifficulty] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [shortTermGoal, setShortTermGoal] = useState<string>('');
  const [interventionStrategies, setInterventionStrategies] = useState<string>('');
  const [buddyStudentId, setBuddyStudentId] = useState<string>('');
  const [parentAction, setParentAction] = useState<string>('');
  const [evaluationNotes, setEvaluationNotes] = useState<string>('');
  const [status, setStatus] = useState<IEPStatus>('IN_PROGRESS');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reviewDate, setReviewDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  useEffect(() => {
    if (initialPlan) {
      setSelectedStudentId(initialPlan.studentId);
      setCategory(initialPlan.category);
      setSelectedSubjects(initialPlan.subjectCodes || ['TOAN']);
      setDifficultyAreas(initialPlan.difficultyAreas || []);
      setStrengths(initialPlan.strengths || '');
      setShortTermGoal(initialPlan.shortTermGoal || '');
      setInterventionStrategies(initialPlan.interventionStrategies || '');
      setBuddyStudentId(initialPlan.buddyStudentId || '');
      setParentAction(initialPlan.parentAction || '');
      setEvaluationNotes(initialPlan.evaluationNotes || '');
      setStatus(initialPlan.status || 'IN_PROGRESS');
      setStartDate(initialPlan.startDate || new Date().toISOString().split('T')[0]);
      setReviewDate(initialPlan.reviewDate || new Date().toISOString().split('T')[0]);
    } else {
      setSelectedStudentId(students[0]?.id || '');
      setCategory('CAN_HO_TRO');
      setSelectedSubjects(['TOAN']);
      setDifficultyAreas([]);
      setStrengths('');
      setShortTermGoal('');
      setInterventionStrategies('');
      setBuddyStudentId('');
      setParentAction('');
      setEvaluationNotes('');
      setStatus('IN_PROGRESS');
      setStartDate(new Date().toISOString().split('T')[0]);
      setReviewDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
  }, [initialPlan, isOpen, students]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  const toggleSubject = (code: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleDifficulty = (item: string) => {
    setDifficultyAreas((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomDifficulty = () => {
    if (customDifficulty.trim() && !difficultyAreas.includes(customDifficulty.trim())) {
      setDifficultyAreas([...difficultyAreas, customDifficulty.trim()]);
      setCustomDifficulty('');
    }
  };

  const generateAIPedagogicalAdvice = () => {
    if (!currentStudent) {
      toast.error('Vui lòng chọn học sinh trước!');
      return;
    }

    setIsGeneratingAI(true);
    setTimeout(() => {
      const studentName = currentStudent.fullName;
      const subNames = selectedSubjects
        .map((s) => SUBJECT_LIST.find((item) => item.code === s)?.name)
        .join(', ');

      if (category === 'CAN_HO_TRO') {
        setShortTermGoal(
          `Trong 4 tuần tới, em ${studentName} nắm vững kiến thức trọng tâm môn ${subNames}, tự tin phát biểu ít nhất 1 lần/tiết học và giảm 60% các lỗi sai cơ bản.`
        );
        setInterventionStrategies(
          `1. Giảng dạy phân hóa: Chia nhỏ các bước giải quyết vấn đề, sử dụng đồ dùng trực quan và bảng nhóm để em dễ tiếp thu.\n` +
          `2. Khích lệ kịp thời: Khen ngợi ngay khi em có tiến bộ nhỏ, giao các câu hỏi vừa sức ở Mức 1 (Nhận biết) để xây dựng sự tự tin.\n` +
          `3. Phụ đạo 1-1: Dành 10-15 phút đầu hoặc cuối buổi học để ôn tập lại kiến thức chưa vững cùng bạn học đồng hành.`
        );
        setParentAction(
          `Gia đình cùng con đọc bài 15 phút mỗi tối, kiểm tra lại vở bài tập và tạo không gian học tập yên tĩnh, hạn chế thiết bị điện tử.`
        );
      } else {
        setShortTermGoal(
          `Phát huy tối đa năng khiếu môn ${subNames}, hoàn thành các bài toán/dự án mở rộng Mức 3 (Vận dụng cao) và tham gia câu lạc bộ bồi dưỡng học sinh năng khiếu.`
        );
        setInterventionStrategies(
          `1. Giao bài tập mở rộng: Cung cấp tài liệu nâng cao, các bài toán tư duy/bài tập đọc hiểu chuyên sâu sau khi em đã hoàn thành bài tập chung.\n` +
          `2. Phát huy vai trò thủ lĩnh: Phân công em làm Nhóm trưởng hoặc hỗ trợ kèm cặp các bạn trong tổ trong các hoạt động học tập nhóm.\n` +
          `3. Khuyến khích sáng tạo: Hướng dẫn em tham gia các sân chơi trí tuệ lành mạnh (Violympic, VioEdu, Trạng Nguyên Nhí).`
        );
        setParentAction(
          `Khuyến khích con đọc thêm sách tham khảo nâng cao, tạo điều kiện phát triển sở thích và cân bằng giữa học tập với vui chơi vận động.`
        );
      }

      setIsGeneratingAI(false);
      toast.success('Đã tạo mục tiêu và biện pháp can thiệp theo mẫu sư phạm TT27!');
    }, 600);
  };

  const handleSave = () => {
    if (!currentStudent) {
      toast.error('Vui lòng chọn học sinh!');
      return;
    }
    if (!shortTermGoal.trim()) {
      toast.error('Vui lòng nhập mục tiêu ngắn hạn!');
      return;
    }

    const buddy = students.find((s) => s.id === buddyStudentId);

    const planData = {
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      classId: classId || 'class-4a1',
      category,
      subjectCodes: selectedSubjects,
      difficultyAreas,
      strengths: strengths.trim(),
      shortTermGoal: shortTermGoal.trim(),
      interventionStrategies: interventionStrategies.trim(),
      buddyStudentId: buddy?.id || undefined,
      buddyStudentName: buddy?.fullName || undefined,
      parentAction: parentAction.trim(),
      evaluationNotes: evaluationNotes.trim(),
      status,
      startDate,
      reviewDate,
    };

    if (initialPlan && onUpdate) {
      onUpdate({ ...initialPlan, ...planData });
    } else {
      onSave(planData);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              📑
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight">
                {initialPlan ? 'Chỉnh Sửa Kế Hoạch Giáo Dục Cá Nhân (IEP)' : 'Lập Kế Hoạch Giáo Dục Cá Nhân Mới (IEP)'}
              </h3>
              <p className="text-xs text-blue-100">
                Theo dõi kèm cặp học sinh tiếp thu chậm & bồi dưỡng năng khiếu chuẩn Thông tư 27
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCategory('CAN_HO_TRO')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center space-x-3 ${
                category === 'CAN_HO_TRO'
                  ? 'border-rose-500 bg-rose-50/80 text-rose-950 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <span className="text-2xl">🔴</span>
              <div>
                <h4 className="font-black text-xs sm:text-sm">Nhóm Cần Phụ Đạo / Hỗ Trợ</h4>
                <p className="text-[11px] opacity-80">Học sinh chưa hoàn thành, tiếp thu chậm, cần kèm cặp</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCategory('NANG_KHIEU')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center space-x-3 ${
                category === 'NANG_KHIEU'
                  ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <span className="text-2xl">🟢</span>
              <div>
                <h4 className="font-black text-xs sm:text-sm">Nhóm Năng Khiếu / Bồi Dưỡng</h4>
                <p className="text-[11px] opacity-80">Học sinh có thế mạnh vượt trội, phát triển tư duy nâng cao</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Chọn Học Sinh (*):</label>
              <select
                value={selectedStudentId}
                disabled={!!initialPlan}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.studentCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày Bắt Đầu Can Thiệp:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày Đánh Giá Lại (Sau 1 tháng):</label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">Môn Học Trọng Tâm Áp Dụng IEP:</label>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_LIST.map((sub) => {
                const active = selectedSubjects.includes(sub.code);
                return (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => toggleSubject(sub.code)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-800">
              {category === 'CAN_HO_TRO' ? 'Khó Khăn Cụ Thể Của Học Sinh:' : 'Lĩnh Vực Năng Khiếu Nổi Trội:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {(category === 'CAN_HO_TRO' ? COMMON_DIFFICULTIES : COMMON_GIFTED_AREAS).map((item) => {
                const checked = difficultyAreas.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleDifficulty(item)}
                    className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      checked
                        ? category === 'CAN_HO_TRO'
                          ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-2">{item}</span>
                    {checked && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-current" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Thêm khó khăn / năng khiếu khác..."
                value={customDifficulty}
                onChange={(e) => setCustomDifficulty(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDifficulty()}
                className="flex-1 p-2 rounded-xl border border-slate-300 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomDifficulty}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
              >
                + Thêm
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-black text-indigo-950">Gợi Ý Biện Pháp Sư Phạm Theo Mẫu TT27</h5>
                <p className="text-[11px] text-indigo-700">Tự động gợi ý mục tiêu 1 tháng & biện pháp kèm cặp phân hóa theo mẫu</p>
              </div>
            </div>

            <button
              type="button"
              disabled={isGeneratingAI}
              onClick={generateAIPedagogicalAdvice}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingAI ? 'Đang tải gợi ý...' : 'Gợi Ý Theo Mẫu ✨'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                1. Mục Tiêu Ngắn Hạn (Sau 4 Tuần) (*):
              </label>
              <textarea
                rows={2}
                value={shortTermGoal}
                onChange={(e) => setShortTermGoal(e.target.value)}
                placeholder="VD: Trong 4 tuần tới, em nắm vững bảng nhân chia, tính nhẩm tự tin và đạt từ 7 điểm môn Toán..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                2. Biện Pháp Sư Phạm Can Thiệp Trên Lớp (GVCN Thực Hiện):
              </label>
              <textarea
                rows={3}
                value={interventionStrategies}
                onChange={(e) => setInterventionStrategies(e.target.value)}
                placeholder="VD: Chia nhỏ bài tập, dùng mô hình trực quan que tính, khích lệ khi giơ tay phát biểu..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. Đôi Bạn Cùng Tiến (Học Sinh Hỗ Trợ 1-1):
                </label>
                <select
                  value={buddyStudentId}
                  onChange={(e) => setBuddyStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 text-xs"
                >
                  <option value="">-- Không phân công / Tự giác --</option>
                  {students
                    .filter((s) => s.id !== selectedStudentId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.gender})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  4. Kế Hoạch Phối Hợp Với Phụ Huynh Tại Nhà:
                </label>
                <input
                  type="text"
                  value={parentAction}
                  onChange={(e) => setParentAction(e.target.value)}
                  placeholder="VD: Gia đình cùng con đọc sách 15 phút mỗi tối..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Trạng Thái Kế Hoạch:</label>
              <div className="flex gap-2">
                {[
                  { id: 'IN_PROGRESS', label: '🟡 Đang thực hiện' },
                  { id: 'COMPLETED', label: '🟢 Đã đạt mục tiêu' },
                  { id: 'NEEDS_ADJUSTMENT', label: '🔴 Cần điều chỉnh biện pháp' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatus(st.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      status === st.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu Kế Hoạch IEP</span>
          </button>
        </div>
      </div>
    </div>
  );
}
