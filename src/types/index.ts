// Types for Class, Student, Assessment according to Circular 27/2020/TT-BGDDT

export type GradeLevel = 1 | 2 | 3 | 4 | 5;

export type Gender = 'Nam' | 'Nữ';

export type TermType = 'GIUA_HK1' | 'CUOI_HK1' | 'GIUA_HK2' | 'CUOI_NAM';

export type SubjectLevel = 'T' | 'H' | 'C'; // Hoàn thành tốt, Hoàn thành, Chưa hoàn thành

export type TraitLevel = 'T' | 'Đ' | 'C'; // Tốt, Đạt, Cần cố gắng

export type AttendanceStatus = 'CO_MAT' | 'VANG_CO_PHEP' | 'VANG_KHONG_PHEP';

export type AwardTitle = 
  | 'Học sinh Xuất sắc'
  | 'Học sinh Tiêu biểu hoàn thành tốt'
  | 'Khen thưởng từng mặt'
  | 'Hoàn thành chương trình lớp học'
  | 'Chưa hoàn thành';

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD
  birthPlace?: string;
  ethnicity?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  isBoarding: boolean; // Ăn bán trú
  seatRow: number; // 0-indexed row in seating grid
  seatCol: number; // 0-indexed col in seating grid
  healthNotes?: string; // Ví dụ: Cận thị 2 độ, Dị ứng hải sản
  tags?: string[]; // Ví dụ: Ban cán sự, Tổ trưởng, Cần bồi dưỡng
  avatarUrl?: string;
  createdAt: string;
}

export interface SubjectInfo {
  code: string;
  name: string;
  shortName: string;
  hasPeriodicTest: boolean; // Có bài kiểm tra định kỳ cho điểm (Toán, Tiếng Việt, v.v.)
  applicableGrades: GradeLevel[];
}

export interface SubjectAssessment {
  id: string;
  studentId: string;
  subjectCode: string;
  term: TermType;
  level: SubjectLevel; // T, H, C
  score?: number; // Điểm số từ 1 - 10 (nếu có kiểm tra định kỳ)
  comment: string;
  updatedAt: string;
}

export interface TraitAssessment {
  id: string;
  studentId: string;
  traitCode: string;
  category: 'PHAM_CHAT' | 'NL_CHUNG' | 'NL_DAC_THU';
  term: TermType;
  level: TraitLevel; // T, Đ, C
  comment?: string;
  updatedAt: string;
}

export interface StudentTermSummary {
  studentId: string;
  term: TermType;
  overallLearningLevel: SubjectLevel; // Mức đánh giá học tập chung
  overallTraitsLevel: TraitLevel; // Mức phẩm chất năng lực chung
  awardTitle?: AwardTitle;
  awardDetail?: string; // Chi tiết thành tích vượt trội
  teacherComment: string; // Lời nhận xét tổng hợp học bạ
  promotedToNextGrade?: boolean; // Lên lớp thẳng
  summerRemediation?: boolean; // Rèn luyện thêm trong hè
}

export interface DailyAttendance {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  hasBoardingMeal: boolean;
  reason?: string;
}

export interface StarLog {
  id: string;
  studentId: string;
  points: number; // +1, +2, -1, v.v.
  category: string; // 'Phát biểu', 'Làm bài tập', 'Giúp bạn', 'Vệ sinh', 'Nề nếp'
  reason: string;
  createdAt: string;
}

export interface ClassFundTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  title: string;
  amount: number;
  date: string;
  studentId?: string; // Nếu là học sinh đóng tiền
  payerName?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface ClassInfo {
  id: string;
  name: string; // Ví dụ: '4A1'
  grade: GradeLevel;
  schoolYear: string; // '2025-2026'
  schoolName: string; // Trường Tiểu học Lê Quý Đôn
  teacherName: string; // Cô Nguyễn Thị Lan
  totalStudents: number;
  seatingGridRows: number;
  seatingGridCols: number;
}

export type DayOfWeek = 'T2' | 'T3' | 'T4' | 'T5' | 'T6';

export interface TimetableSlot {
  id: string;
  day: DayOfWeek;
  period: number; // 1 -> 7 (1-4 Sáng, 5-7 Chiều)
  session: 'MORNING' | 'AFTERNOON';
  subjectCode: string;
  subjectName: string;
  room?: string;
  teacherName?: string;
  note?: string; // Ghi chú: Dụng cụ cần mang, dặn dò học sinh
}
