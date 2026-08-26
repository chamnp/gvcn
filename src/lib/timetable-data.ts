import { DayOfWeek, TimetableSlot } from '@/types';

export interface DayInfo {
  id: DayOfWeek;
  name: string;
  shortName: string;
}

export const DAYS_OF_WEEK: DayInfo[] = [
  { id: 'T2', name: 'Thứ Hai', shortName: 'T2' },
  { id: 'T3', name: 'Thứ Ba', shortName: 'T3' },
  { id: 'T4', name: 'Thứ Tư', shortName: 'T4' },
  { id: 'T5', name: 'Thứ Năm', shortName: 'T5' },
  { id: 'T6', name: 'Thứ Sáu', shortName: 'T6' },
];

export interface PeriodInfo {
  period: number;
  session: 'MORNING' | 'AFTERNOON';
  time: string;
  name: string;
}

export const PERIODS: PeriodInfo[] = [
  // Buổi Sáng
  { period: 1, session: 'MORNING', time: '07:45 - 08:20', name: 'Tiết 1' },
  { period: 2, session: 'MORNING', time: '08:25 - 09:00', name: 'Tiết 2' },
  { period: 3, session: 'MORNING', time: '09:20 - 09:55', name: 'Tiết 3' },
  { period: 4, session: 'MORNING', time: '10:00 - 10:35', name: 'Tiết 4' },

  // Buổi Chiều
  { period: 5, session: 'AFTERNOON', time: '14:00 - 14:35', name: 'Tiết 5' },
  { period: 6, session: 'AFTERNOON', time: '14:40 - 15:15', name: 'Tiết 6' },
  { period: 7, session: 'AFTERNOON', time: '15:30 - 16:05', name: 'Tiết 7' },
];

export interface SubjectTheme {
  code: string;
  name: string;
  shortName: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const SUBJECT_THEMES: SubjectTheme[] = [
  { code: 'CHAO_CO', name: 'Chào cờ (SHDC)', shortName: 'Chào cờ', icon: '🇻🇳', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
  { code: 'TIENG_VIET', name: 'Tiếng Việt', shortName: 'Tiếng Việt', icon: '📖', bgColor: 'bg-amber-50', textColor: 'text-amber-800', borderColor: 'border-amber-200' },
  { code: 'TOAN', name: 'Toán học', shortName: 'Toán', icon: '📐', bgColor: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-200' },
  { code: 'NGOAI_NGU', name: 'Tiếng Anh', shortName: 'Tiếng Anh', icon: '🇬🇧', bgColor: 'bg-purple-50', textColor: 'text-purple-800', borderColor: 'border-purple-200' },
  { code: 'KHOA_HOC', name: 'Khoa học', shortName: 'Khoa học', icon: '🔬', bgColor: 'bg-teal-50', textColor: 'text-teal-800', borderColor: 'border-teal-200' },
  { code: 'LS_DL', name: 'Lịch sử & Địa lý', shortName: 'LS & ĐL', icon: '🌍', bgColor: 'bg-orange-50', textColor: 'text-orange-800', borderColor: 'border-orange-200' },
  { code: 'DAO_DUC', name: 'Đạo đức', shortName: 'Đạo đức', icon: '💖', bgColor: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-200' },
  { code: 'TIN_HOC_CN', name: 'Tin học & Công nghệ', shortName: 'Tin & CN', icon: '💻', bgColor: 'bg-cyan-50', textColor: 'text-cyan-800', borderColor: 'border-cyan-200' },
  { code: 'AM_NHAC', name: 'Âm nhạc', shortName: 'Âm nhạc', icon: '🎵', bgColor: 'bg-pink-50', textColor: 'text-pink-700', borderColor: 'border-pink-200' },
  { code: 'MY_THUAT', name: 'Mỹ thuật', shortName: 'Mỹ thuật', icon: '🎨', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' },
  { code: 'GD_THE_CHAT', name: 'Giáo dục thể chất', shortName: 'Thể chất', icon: '⚽', bgColor: 'bg-emerald-50', textColor: 'text-emerald-800', borderColor: 'border-emerald-200' },
  { code: 'HD_TRAI_NGHIEM', name: 'Hoạt động trải nghiệm', shortName: 'HĐTN', icon: '🌟', bgColor: 'bg-indigo-50', textColor: 'text-indigo-800', borderColor: 'border-indigo-200' },
  { code: 'SINH_HOAT_LOP', name: 'Sinh hoạt lớp', shortName: 'SH Lớp', icon: '👥', bgColor: 'bg-slate-100', textColor: 'text-slate-800', borderColor: 'border-slate-300' },
  { code: 'TU_HOC', name: 'Tự học có hướng dẫn', shortName: 'Tự học', icon: '✏️', bgColor: 'bg-sky-50', textColor: 'text-sky-800', borderColor: 'border-sky-200' },
];

export function getSubjectTheme(code: string): SubjectTheme {
  return (
    SUBJECT_THEMES.find((s) => s.code === code) || {
      code,
      name: code,
      shortName: code,
      icon: '📚',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-200',
    }
  );
}

// Thời khóa biểu chuẩn mẫu Khối 4 (Tiểu học 2 buổi/ngày - GDPT 2018)
export const INITIAL_TIMETABLE: TimetableSlot[] = [
  // THỨ HAI
  { id: 't2-p1', day: 'T2', period: 1, session: 'MORNING', subjectCode: 'CHAO_CO', subjectName: 'Sinh hoạt dưới cờ', note: 'Mặc đồng phục, quàng khăn đỏ' },
  { id: 't2-p2', day: 'T2', period: 2, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Đọc)' },
  { id: 't2-p3', day: 'T2', period: 3, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
  { id: 't2-p4', day: 'T2', period: 4, session: 'MORNING', subjectCode: 'DAO_DUC', subjectName: 'Đạo đức' },
  { id: 't2-p5', day: 'T2', period: 5, session: 'AFTERNOON', subjectCode: 'NGOAI_NGU', subjectName: 'Tiếng Anh' },
  { id: 't2-p6', day: 'T2', period: 6, session: 'AFTERNOON', subjectCode: 'GD_THE_CHAT', subjectName: 'Giáo dục thể chất', note: 'Mang giày bata thể thao' },
  { id: 't2-p7', day: 'T2', period: 7, session: 'AFTERNOON', subjectCode: 'TU_HOC', subjectName: 'Tự học có hướng dẫn' },

  // THỨ BA
  { id: 't3-p1', day: 'T3', period: 1, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
  { id: 't3-p2', day: 'T3', period: 2, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Viết)' },
  { id: 't3-p3', day: 'T3', period: 3, session: 'MORNING', subjectCode: 'KHOA_HOC', subjectName: 'Khoa học' },
  { id: 't3-p4', day: 'T3', period: 4, session: 'MORNING', subjectCode: 'AM_NHAC', subjectName: 'Âm nhạc', note: 'Mang thanh phách' },
  { id: 't3-p5', day: 'T3', period: 5, session: 'AFTERNOON', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Luyện từ & câu)' },
  { id: 't3-p6', day: 'T3', period: 6, session: 'AFTERNOON', subjectCode: 'TIN_HOC_CN', subjectName: 'Tin học & Công nghệ', note: 'Học phòng máy tính' },
  { id: 't3-p7', day: 'T3', period: 7, session: 'AFTERNOON', subjectCode: 'HD_TRAI_NGHIEM', subjectName: 'Hoạt động trải nghiệm' },

  // THỨ TƯ
  { id: 't4-p1', day: 'T4', period: 1, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Đọc)' },
  { id: 't4-p2', day: 'T4', period: 2, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
  { id: 't4-p3', day: 'T4', period: 3, session: 'MORNING', subjectCode: 'LS_DL', subjectName: 'Lịch sử & Địa lý' },
  { id: 't4-p4', day: 'T4', period: 4, session: 'MORNING', subjectCode: 'MY_THUAT', subjectName: 'Mỹ thuật', note: 'Mang hộp sáp màu và giấy A4' },
  { id: 't4-p5', day: 'T4', period: 5, session: 'AFTERNOON', subjectCode: 'NGOAI_NGU', subjectName: 'Tiếng Anh' },
  { id: 't4-p6', day: 'T4', period: 6, session: 'AFTERNOON', subjectCode: 'GD_THE_CHAT', subjectName: 'Giáo dục thể chất' },
  { id: 't4-p7', day: 'T4', period: 7, session: 'AFTERNOON', subjectCode: 'TU_HOC', subjectName: 'Tự học có hướng dẫn' },

  // THỨ NĂM
  { id: 't5-p1', day: 'T5', period: 1, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
  { id: 't5-p2', day: 'T5', period: 2, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Viết đoạn văn)' },
  { id: 't5-p3', day: 'T5', period: 3, session: 'MORNING', subjectCode: 'KHOA_HOC', subjectName: 'Khoa học' },
  { id: 't5-p4', day: 'T5', period: 4, session: 'MORNING', subjectCode: 'NGOAI_NGU', subjectName: 'Tiếng Anh' },
  { id: 't5-p5', day: 'T5', period: 5, session: 'AFTERNOON', subjectCode: 'LS_DL', subjectName: 'Lịch sử & Địa lý' },
  { id: 't5-p6', day: 'T5', period: 6, session: 'AFTERNOON', subjectCode: 'TIN_HOC_CN', subjectName: 'Tin học & Công nghệ' },
  { id: 't5-p7', day: 'T5', period: 7, session: 'AFTERNOON', subjectCode: 'HD_TRAI_NGHIEM', subjectName: 'Hoạt động trải nghiệm' },

  // THỨ SÁU
  { id: 't6-p1', day: 'T6', period: 1, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Nói & Nghe)' },
  { id: 't6-p2', day: 'T6', period: 2, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
  { id: 't6-p3', day: 'T6', period: 3, session: 'MORNING', subjectCode: 'NGOAI_NGU', subjectName: 'Tiếng Anh' },
  { id: 't6-p4', day: 'T6', period: 4, session: 'MORNING', subjectCode: 'HD_TRAI_NGHIEM', subjectName: 'Hoạt động trải nghiệm' },
  { id: 't6-p5', day: 'T6', period: 5, session: 'AFTERNOON', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Ôn tập cuối tuần)' },
  { id: 't6-p6', day: 'T6', period: 6, session: 'AFTERNOON', subjectCode: 'TU_HOC', subjectName: 'Tự học có hướng dẫn' },
  { id: 't6-p7', day: 'T6', period: 7, session: 'AFTERNOON', subjectCode: 'SINH_HOAT_LOP', subjectName: 'Sinh hoạt lớp cuối tuần', note: 'Bình xét thi đua tuần' },
];
