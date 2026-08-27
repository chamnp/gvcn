import { GradeLevel, SubjectInfo, SubjectAssessment, TraitAssessment, StudentTermSummary, TermType, AwardTitle, SubjectLevel, TraitLevel } from '@/types';

export const TERMS: {
  id: TermType;
  name: string;
  shortName: string;
  monthsDescription: string;
}[] = [
  { id: 'GIUA_HK1', name: 'Giữa Học kỳ I', shortName: 'G.HK1', monthsDescription: 'Tháng 9 - Đầu T11' },
  { id: 'CUOI_HK1', name: 'Cuối Học kỳ I', shortName: 'C.HK1', monthsDescription: 'Giữa T11 - T1' },
  { id: 'GIUA_HK2', name: 'Giữa Học kỳ II', shortName: 'G.HK2', monthsDescription: 'Giữa T1 - T3' },
  { id: 'CUOI_NAM', name: 'Cuối Năm học', shortName: 'C.Năm', monthsDescription: 'Tháng 4 - T8' },
];

/**
 * Tự động xác định kỳ đánh giá TT27 dựa trên thời gian thực tế của năm học:
 * - Tháng 9 -> 15/11: Giữa Học kỳ 1 (GIUA_HK1)
 * - 16/11 -> 15/01: Cuối Học kỳ 1 (CUOI_HK1)
 * - 16/01 -> 31/03: Giữa Học kỳ 2 (GIUA_HK2)
 * - 01/04 -> 31/08: Cuối Năm học / Cuối Học kỳ 2 (CUOI_NAM)
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
 * - Nếu tháng >= 8 (Tháng 8 -> 12): Năm hiện tại - Năm sau (ví dụ: 2025-2026 hoặc 2026-2027)
 * - Nếu tháng < 8 (Tháng 1 -> 7): Năm trước - Năm hiện tại
 */
export function getAcademicYearByDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
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
  } else if (allScores7OrAbove) {
    awardTitle = 'Học sinh Tiêu biểu hoàn thành tốt';
  }

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
