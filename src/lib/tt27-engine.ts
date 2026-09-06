import { GradeLevel, SubjectInfo, SubjectAssessment, TraitAssessment, StudentTermSummary, TermType, AwardTitle, SubjectLevel, TraitLevel } from '@/types';

export const TERMS: {
  id: TermType;
  name: string;
  shortName: string;
  monthsDescription: string;
}[] = [
  { id: 'GIUA_HK1', name: 'Giữa Học kỳ I', shortName: 'G.HK1', monthsDescription: 'Tháng 9 - Giữa T11' },
  { id: 'CUOI_HK1', name: 'Cuối Học kỳ I', shortName: 'C.HK1', monthsDescription: 'Giữa T11 - Giữa T1' },
  { id: 'GIUA_HK2', name: 'Giữa Học kỳ II', shortName: 'G.HK2', monthsDescription: 'Giữa T1 - Hết T3' },
  { id: 'CUOI_NAM', name: 'Cuối Năm học', shortName: 'C.Năm', monthsDescription: 'Tháng 4 - Tháng 8' },
];

/**
 * Tự động xác định kỳ đánh giá TT27 dựa trên thời gian thực tế của năm học:
 * - Tháng 9, 10 -> 15/11: Giữa Học kỳ 1 (GIUA_HK1)
 * - 16/11 -> 15/01: Cuối Học kỳ 1 (CUOI_HK1)
 * - 16/01 -> 31/03: Giữa Học kỳ 2 (GIUA_HK2)
 * - 01/04 -> 31/08: Cuối Năm học / Tổng kết năm học (CUOI_NAM)
 */
export function getCurrentTermByDate(date: Date = new Date()): TermType {
  const month = date.getMonth() + 1; // 1 -> 12
  const day = date.getDate();

  if (month === 9 || month === 10 || (month === 11 && day <= 15)) {
    return 'GIUA_HK1';
  } else if ((month === 11 && day > 15) || month === 12 || (month === 1 && day <= 15)) {
    return 'CUOI_HK1';
  } else if ((month === 1 && day > 15) || month === 2 || month === 3) {
    return 'GIUA_HK2';
  } else {
    // Tháng 4, 5, 6, 7, 8
    return 'CUOI_NAM';
  }
}

/**
 * Tự động xác định năm học (School Year) theo lịch thực tế:
 * - Nếu tháng >= 9 (Tháng 9 -> 12): Năm hiện tại - Năm sau (ví dụ: 2025-2026 hoặc 2026-2027)
 * - Nếu tháng < 9 (Tháng 1 -> 8): Năm trước - Năm hiện tại
 */
export function getAcademicYearByDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Lấy ngày theo định dạng YYYY-MM-DD theo giờ địa phương (tránh lệch ngày UTC+7 khi thao tác từ 00:00 - 07:00)
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const PRIMARY_SUBJECTS: SubjectInfo[] = [
  { code: 'TIENG_VIET', name: 'Tiếng Việt', shortName: 'Tiếng Việt', hasPeriodicTest: true, applicableGrades: [1, 2, 3, 4, 5] },
  { code: 'TOAN', name: 'Toán', shortName: 'Toán', hasPeriodicTest: true, applicableGrades: [1, 2, 3, 4, 5] },
  { code: 'NGOAI_NGU', name: 'Ngoại ngữ 1 (Tiếng Anh)', shortName: 'Ngoại ngữ', hasPeriodicTest: true, applicableGrades: [3, 4, 5] },
  { code: 'DAO_DUC', name: 'Đạo đức', shortName: 'Đạo đức', hasPeriodicTest: false, applicableGrades: [1, 2, 3, 4, 5] },
  { code: 'TN_XH', name: 'Tự nhiên và Xã hội', shortName: 'TN & XH', hasPeriodicTest: false, applicableGrades: [1, 2, 3] },
  { code: 'KHOA_HOC', name: 'Khoa học', shortName: 'Khoa học', hasPeriodicTest: true, applicableGrades: [4, 5] },
  { code: 'LS_DL', name: 'Lịch sử và Địa lý', shortName: 'LS & ĐL', hasPeriodicTest: true, applicableGrades: [4, 5] },
  { code: 'TIN_HOC_CN', name: 'Tin học và Công nghệ', shortName: 'Tin học & CN', hasPeriodicTest: true, applicableGrades: [3, 4, 5] },
  { code: 'GD_THE_CHAT', name: 'Giáo dục thể chất', shortName: 'GD Thể chất', hasPeriodicTest: false, applicableGrades: [1, 2, 3, 4, 5] },
  { code: 'AM_NHAC', name: 'Âm nhạc', shortName: 'Âm nhạc', hasPeriodicTest: false, applicableGrades: [1, 2, 3, 4, 5] },
  { code: 'MY_THUAT', name: 'Mỹ thuật', shortName: 'Mỹ thuật', hasPeriodicTest: false, applicableGrades: [1, 2, 3, 4, 5] },
  { code: 'HD_TRAI_NGHIEM', name: 'Hoạt động trải nghiệm', shortName: 'HĐTN', hasPeriodicTest: false, applicableGrades: [1, 2, 3, 4, 5] },
];

export interface TraitInfo {
  code: string;
  name: string;
  shortName: string;
  category: 'PHAM_CHAT' | 'NL_CHUNG' | 'NL_DAC_THU';
}

export const TRAIT_DEFINITIONS: TraitInfo[] = [
  // 5 Phẩm chất chủ yếu
  { code: 'YEU_NUOC', name: 'Yêu nước', shortName: 'Yêu nước', category: 'PHAM_CHAT' },
  { code: 'NHAN_AI', name: 'Nhân ái', shortName: 'Nhân ái', category: 'PHAM_CHAT' },
  { code: 'CHAM_CHI', name: 'Chăm chỉ', shortName: 'Chăm chỉ', category: 'PHAM_CHAT' },
  { code: 'TRUNG_THUC', name: 'Trung thực', shortName: 'Trung thực', category: 'PHAM_CHAT' },
  { code: 'TRACH_NHIEM', name: 'Trách nhiệm', shortName: 'Trách nhiệm', category: 'PHAM_CHAT' },

  // 3 Năng lực chung
  { code: 'TU_CHU_TU_HOC', name: 'Tự chủ và tự học', shortName: 'Tự chủ - Tự học', category: 'NL_CHUNG' },
  { code: 'GIAO_TIEP_HOP_TAC', name: 'Giao tiếp và hợp tác', shortName: 'G.Tiếp - H.Tác', category: 'NL_CHUNG' },
  { code: 'GQVD_SANG_TAO', name: 'Giải quyết vấn đề và sáng tạo', shortName: 'GQ Vấn đề - S.Tạo', category: 'NL_CHUNG' },

  // Năng lực đặc thù cốt lõi
  { code: 'NL_NGON_NGU', name: 'Năng lực ngôn ngữ', shortName: 'Ngôn ngữ', category: 'NL_DAC_THU' },
  { code: 'NL_TINH_TOAN', name: 'Năng lực tính toán', shortName: 'Tính toán', category: 'NL_DAC_THU' },
  { code: 'NL_KHOA_HOC', name: 'Năng lực khoa học', shortName: 'Khoa học', category: 'NL_DAC_THU' },
  { code: 'NL_CONG_NGHE_TIN', name: 'Năng lực công nghệ & tin học', shortName: 'CN & Tin học', category: 'NL_DAC_THU' },
  { code: 'NL_THE_CHAT', name: 'Năng lực thể chất', shortName: 'Thể chất', category: 'NL_DAC_THU' },
  { code: 'NL_THAM_MI', name: 'Năng lực thẩm mĩ', shortName: 'Thẩm mĩ', category: 'NL_DAC_THU' },
];

export function getSubjectsForGrade(grade: GradeLevel): SubjectInfo[] {
  return PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(grade));
}

/**
 * Thuật toán tính danh hiệu khen thưởng theo Điều 13 Thông tư 27/2020/TT-BGDĐT
 */
export function evaluateStudentTT27(
  subjects: SubjectAssessment[],
  traits: TraitAssessment[],
  term: TermType
): {
  overallLearningLevel: SubjectLevel;
  overallTraitsLevel: TraitLevel;
  awardTitle: AwardTitle;
  promotedToNextGrade: boolean;
  summerRemediation: boolean;
} {
  const hasSubjectC = subjects.some((s) => s.level === 'C');
  const allSubjectsT = subjects.length > 0 && subjects.every((s) => s.level === 'T');
  
  let overallLearningLevel: SubjectLevel = 'H';
  if (allSubjectsT) overallLearningLevel = 'T';
  else if (hasSubjectC) overallLearningLevel = 'C';

  const hasTraitC = traits.some((t) => t.level === 'C');
  const allTraitsT = traits.length > 0 && traits.every((t) => t.level === 'T');

  let overallTraitsLevel: TraitLevel = 'Đ';
  if (allTraitsT) overallTraitsLevel = 'T';
  else if (hasTraitC) overallTraitsLevel = 'C';

  // Điều kiện kiểm tra điểm số các môn KTĐK
  const testSubjects = subjects.filter((s) => s.score !== undefined && s.score !== null);
  const allScores9OrAbove = testSubjects.length > 0 && testSubjects.every((s) => (s.score || 0) >= 9.0);
  const allScores7OrAbove = testSubjects.length > 0 && testSubjects.every((s) => (s.score || 0) >= 7.0);

  let awardTitle: AwardTitle = 'Hoàn thành chương trình lớp học';
  let promotedToNextGrade = true;
  let summerRemediation = false;

  if (overallLearningLevel === 'C' || overallTraitsLevel === 'C') {
    awardTitle = 'Chưa hoàn thành';
    promotedToNextGrade = false;
    summerRemediation = true;
  } else if (allSubjectsT && allScores9OrAbove && allTraitsT) {
    awardTitle = 'Học sinh Xuất sắc';
  } else if (allSubjectsT && allTraitsT && allScores7OrAbove) {
    awardTitle = 'Học sinh Tiêu biểu hoàn thành tốt';
  }
  // Lưu ý: "Khen thưởng từng mặt" là danh hiệu được GVCN tự đánh giá thủ công
  // khi học sinh có thành tích nổi bật ở một lĩnh vực cụ thể (ví dụ: Toán đạt điểm 10
  // nhưng các môn khác chỉ đạt 'H'). Giáo viên chọn thủ công trên giao diện.

  return {
    overallLearningLevel,
    overallTraitsLevel,
    awardTitle,
    promotedToNextGrade,
    summerRemediation,
  };
}

export function getLevelBadgeClass(level: string) {
  switch (level) {
    case 'T':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
    case 'H':
    case 'Đ':
      return 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
    case 'C':
      return 'bg-rose-100 text-rose-800 border-rose-300 font-medium';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getAwardBadgeClass(award?: AwardTitle) {
  switch (award) {
    case 'Học sinh Xuất sắc':
      return 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
    case 'Học sinh Tiêu biểu hoàn thành tốt':
      return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold';
    case 'Hoàn thành chương trình lớp học':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Chưa hoàn thành':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export interface EvaluationProgress {
  subjects: {
    assessed: number;
    total: number;
    percentage: number;
  };
  qualities: {
    assessed: number;
    total: number;
    percentage: number;
  };
  competencies: {
    assessed: number;
    total: number;
    percentage: number;
  };
  comments: {
    assessed: number;
    total: number;
    percentage: number;
  };
  overallPercentage: number;
  incompleteStudentIds: string[];
}

export function calculateEvaluationProgress(
  students: { id: string; fullName: string }[],
  subjectAssessments: SubjectAssessment[],
  traitAssessments: TraitAssessment[],
  termSummaries: StudentTermSummary[],
  currentTerm: TermType,
  grade: GradeLevel = 4
): EvaluationProgress {
  const totalStudents = students.length;
  if (totalStudents === 0) {
    return {
      subjects: { assessed: 0, total: 0, percentage: 100 },
      qualities: { assessed: 0, total: 0, percentage: 100 },
      competencies: { assessed: 0, total: 0, percentage: 100 },
      comments: { assessed: 0, total: 0, percentage: 100 },
      overallPercentage: 100,
      incompleteStudentIds: [],
    };
  }

  const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(grade));
  const qualities = TRAIT_DEFINITIONS.filter((t) => t.category === 'PHAM_CHAT');
  const competencies = TRAIT_DEFINITIONS.filter((t) => t.category === 'NL_CHUNG' || t.category === 'NL_DAC_THU');

  const totalSubjectSlots = totalStudents * subjects.length;
  const totalQualitySlots = totalStudents * qualities.length;
  const totalCompetencySlots = totalStudents * competencies.length;
  const totalCommentSlots = totalStudents;

  const studentIds = new Set(students.map((s) => s.id));
  const currentSubjectAssessments = subjectAssessments.filter(
    (a) => a.term === currentTerm && studentIds.has(a.studentId)
  );
  const currentTraitAssessments = traitAssessments.filter(
    (a) => a.term === currentTerm && studentIds.has(a.studentId)
  );
  const currentTermSummaries = termSummaries.filter(
    (s) => s.term === currentTerm && studentIds.has(s.studentId)
  );

  // Count assessed
  const assessedSubjects = currentSubjectAssessments.length;
  const assessedQualities = currentTraitAssessments.filter((t) =>
    qualities.some((q) => q.code === t.traitCode)
  ).length;
  const assessedCompetencies = currentTraitAssessments.filter((t) =>
    competencies.some((c) => c.code === t.traitCode)
  ).length;
  const assessedComments = currentTermSummaries.filter((s) => s.teacherComment && s.teacherComment.trim().length > 0).length;

  const subPct = totalSubjectSlots > 0 ? Math.round((assessedSubjects / totalSubjectSlots) * 100) : 100;
  const qualPct = totalQualitySlots > 0 ? Math.round((assessedQualities / totalQualitySlots) * 100) : 100;
  const compPct = totalCompetencySlots > 0 ? Math.round((assessedCompetencies / totalCompetencySlots) * 100) : 100;
  const commPct = totalCommentSlots > 0 ? Math.round((assessedComments / totalCommentSlots) * 100) : 100;

  const totalAllSlots = totalSubjectSlots + totalQualitySlots + totalCompetencySlots + totalCommentSlots;
  const totalAllAssessed = assessedSubjects + assessedQualities + assessedCompetencies + assessedComments;
  const overallPercentage = totalAllSlots > 0 ? Math.round((totalAllAssessed / totalAllSlots) * 100) : 100;

  // Identify incomplete students
  const incompleteStudentIds: string[] = [];
  students.forEach((st) => {
    const stSubs = currentSubjectAssessments.filter((a) => a.studentId === st.id);
    const stTraits = currentTraitAssessments.filter((a) => a.studentId === st.id);
    const stSum = currentTermSummaries.find((s) => s.studentId === st.id);

    const isComplete =
      stSubs.length >= subjects.length &&
      stTraits.length >= (qualities.length + competencies.length) &&
      Boolean(stSum?.teacherComment && stSum.teacherComment.trim().length > 0);

    if (!isComplete) {
      incompleteStudentIds.push(st.id);
    }
  });

  return {
    subjects: { assessed: assessedSubjects, total: totalSubjectSlots, percentage: Math.min(100, subPct) },
    qualities: { assessed: assessedQualities, total: totalQualitySlots, percentage: Math.min(100, qualPct) },
    competencies: { assessed: assessedCompetencies, total: totalCompetencySlots, percentage: Math.min(100, compPct) },
    comments: { assessed: assessedComments, total: totalCommentSlots, percentage: Math.min(100, commPct) },
    overallPercentage: Math.min(100, overallPercentage),
    incompleteStudentIds,
  };
}

export interface GuardrailIssue {
  id: string;
  studentId: string;
  studentName: string;
  type: 'ERROR' | 'WARNING' | 'INFO';
  category: 'SUBJECTS' | 'QUALITIES' | 'COMPETENCIES' | 'SUMMARY';
  message: string;
  detail?: string;
}

export function validateTT27Assessments(
  students: { id: string; fullName: string }[],
  subjectAssessments: SubjectAssessment[],
  traitAssessments: TraitAssessment[],
  termSummaries: StudentTermSummary[],
  currentTerm: TermType,
  grade: GradeLevel = 4
): GuardrailIssue[] {
  const issues: GuardrailIssue[] = [];
  const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(grade));

  students.forEach((st) => {
    const stSubs = subjectAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
    const stTraits = traitAssessments.filter((a) => a.studentId === st.id && a.term === currentTerm);
    const stSummary = termSummaries.find((s) => s.studentId === st.id && s.term === currentTerm);

    // Rule 1: Check Subject Score vs Level logic
    stSubs.forEach((sub) => {
      const subInfo = subjects.find((s) => s.code === sub.subjectCode);
      const subName = subInfo?.shortName || sub.subjectCode;

      if (sub.score !== undefined && sub.score !== null) {
        if (sub.score >= 9.0 && (sub.level === 'H' || sub.level === 'C')) {
          issues.push({
            id: `${st.id}-${sub.subjectCode}-score-high`,
            studentId: st.id,
            studentName: st.fullName,
            type: 'WARNING',
            category: 'SUBJECTS',
            message: `Điểm môn ${subName} là ${sub.score} (>= 9.0) nhưng mức đánh giá lại là "${sub.level}".`,
            detail: 'Nên cân nhắc chuyển sang mức T (Hoàn thành tốt) nếu học sinh đạt điểm xuất sắc.',
          });
        }

        if (sub.score < 5.0 && sub.level === 'T') {
          issues.push({
            id: `${st.id}-${sub.subjectCode}-score-low`,
            studentId: st.id,
            studentName: st.fullName,
            type: 'ERROR',
            category: 'SUBJECTS',
            message: `Điểm môn ${subName} là ${sub.score} (< 5.0) nhưng mức đánh giá lại là "T" (Tốt).`,
            detail: 'Mâu thuẫn logic: Học sinh có điểm dưới trung bình không thể xếp mức Hoàn thành tốt.',
          });
        }
      }
    });

    // Rule 2: Award title logic
    if (stSummary?.awardTitle) {
      const award = stSummary.awardTitle;
      const allSubsT = stSubs.length > 0 && stSubs.every((s) => s.level === 'T');
      const allTraitsT = stTraits.length > 0 && stTraits.every((t) => t.level === 'T');
      const hasSubC = stSubs.some((s) => s.level === 'C');
      const hasTraitC = stTraits.some((t) => t.level === 'C');

      const testSubs = stSubs.filter((s) => s.score !== undefined && s.score !== null);
      const allScores9OrAbove = testSubs.length > 0 && testSubs.every((s) => (s.score || 0) >= 9.0);
      const allScores7OrAbove = testSubs.length > 0 && testSubs.every((s) => (s.score || 0) >= 7.0);

      if (award === 'Học sinh Xuất sắc') {
        if (!allSubsT || !allTraitsT || !allScores9OrAbove) {
          issues.push({
            id: `${st.id}-award-xuat-sac-invalid`,
            studentId: st.id,
            studentName: st.fullName,
            type: 'ERROR',
            category: 'SUMMARY',
            message: `Xét danh hiệu "Học sinh Xuất sắc" chưa thỏa mãn Điều 13 TT27.`,
            detail: 'Quy định: Tất cả môn học & phẩm chất năng lực phải đạt mức T, và tất cả bài KTĐK đạt từ 9.0 điểm trở lên.',
          });
        }
      } else if (award === 'Học sinh Tiêu biểu hoàn thành tốt') {
        if (hasSubC || hasTraitC || !allScores7OrAbove) {
          issues.push({
            id: `${st.id}-award-tieu-bieu-invalid`,
            studentId: st.id,
            studentName: st.fullName,
            type: 'ERROR',
            category: 'SUMMARY',
            message: `Xét danh hiệu "Học sinh Tiêu biểu" chưa thỏa mãn Điều 13 TT27.`,
            detail: 'Quy định: Không có môn/tiêu chí mức C và điểm KTĐK từ 7.0 điểm trở lên.',
          });
        }
      } else if (award === 'Hoàn thành chương trình lớp học' && (hasSubC || hasTraitC)) {
        issues.push({
          id: `${st.id}-award-hoan-thanh-invalid`,
          studentId: st.id,
          studentName: st.fullName,
          type: 'ERROR',
          category: 'SUMMARY',
          message: `Có môn học hoặc phẩm chất/năng lực mức "C" nhưng lại xếp danh hiệu "Hoàn thành".`,
          detail: 'Theo TT27, học sinh có mức C thuộc diện Chưa hoàn thành và cần rèn luyện hè.',
        });
      }
    }

    // Rule 3: Missing Comment
    if (!stSummary?.teacherComment || stSummary.teacherComment.trim().length === 0) {
      issues.push({
        id: `${st.id}-missing-comment`,
        studentId: st.id,
        studentName: st.fullName,
        type: 'INFO',
        category: 'SUMMARY',
        message: `Chưa có lời nhận xét học bạ tổng kết.`,
        detail: 'Hãy sử dụng Trợ lý AI hoặc nhập giọng nói để thêm lời nhận xét cho học sinh.',
      });
    }
  });

  return issues;
}
