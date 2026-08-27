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

export type UserRole = 'ADMIN' | 'TEACHER' | 'ADMIN_TEACHER' | 'PENDING';

export type AIProviderType = 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'CUSTOM_OPENAI';

export type AIToneType = 'standard' | 'encouraging' | 'detailed' | 'concise' | 'custom';
export type AILengthPreset = 'short' | 'standard' | 'detailed' | 'custom';

export type AIGenerationMode = 'AI_ONLINE' | 'OFFLINE_BANK';

export interface AIGenerationSettings {
  mode: AIGenerationMode;
  tone: AIToneType;
  customToneText?: string;
  lengthPreset: AILengthPreset;
  targetWordCount: number; // e.g. 35, 60, 95
  targetSentenceCount: number; // e.g. 2, 3, 4, 5
  includeSubjectGrades: boolean;
  includeTraitsAndCompetencies: boolean;
  includeDailyStarsAndComments: boolean;
  includeAttendanceAndBoarding: boolean;
  classDirectivePrompt?: string;
}

export interface AIConfig {
  provider: AIProviderType;
  apiKey: string;
  baseUrl?: string; // e.g. 'https://api.openai.com/v1', 'https://api.anthropic.com/v1', 'https://api.xiaomimimo.com/v1', 'https://api.deepseek.com/v1', 'https://openrouter.ai/api/v1'
  modelName: string; // e.g. 'gemini-2.5-flash', 'gpt-4o-mini', 'claude-3-5-haiku-20241022', 'mimo-v2.5', 'deepseek-chat'
  temperature?: number; // 0.0 - 1.0 (default 0.7)
  maxTokens?: number;
  generationSettings?: AIGenerationSettings;
}

export interface TeacherProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  title?: string; // Chức vụ: Hiệu trưởng, Phó Hiệu trưởng, Tổ trưởng Khối 4, GVCN, GV Bộ môn...
  department?: string; // Tổ chuyên môn: Ban Giám Hiệu, Tổ Khối 1, Tổ Khối 4-5, Tổ Năng khiếu...
  assignedClassId?: string;
  assignedClassName?: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  classId?: string;
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
  points: number; // +1, +2, -1, 0 (chỉ nhận xét), v.v.
  category: string; // 'Học tập', 'Nề nếp & Kỷ luật', 'Phẩm chất & Tương tác', 'Trực nhật & Vệ sinh', 'Dặn dò phụ huynh', 'Khen thưởng', 'Khác'
  reason: string; // 'Phát biểu hăng hái', 'Làm bài xuất sắc', 'Vở sạch chữ đẹp', v.v.
  comment?: string; // Nhận xét / dặn dò cụ thể hàng ngày của cô giáo
  date?: string; // YYYY-MM-DD
  createdAt: string;
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
  classId?: string;
  day: DayOfWeek;
  period: number; // 1 -> 7 (1-4 Sáng, 5-7 Chiều)
  session: 'MORNING' | 'AFTERNOON';
  subjectCode: string;
  subjectName: string;
  room?: string;
  teacherName?: string;
  note?: string; // Ghi chú: Dụng cụ cần mang, dặn dò học sinh
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface FundTransaction {
  id: string;
  classId?: string;
  studentId?: string;
  type: TransactionType; // Thu hoặc Chi
  category: string; // Quỹ hội cha mẹ HS, Cơ sở vật chất, Liên hoan, v.v.
  title: string;
  amount: number; // Số tiền (VNĐ)
  date: string; // YYYY-MM-DD
  payerOrReceiver?: string; // Người nộp hoặc Người nhận
  notes?: string;
  createdAt: string;
}

export interface CustomSubject {
  id: string;
  code: string;
  name: string;
  shortName: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  category?: 'CORE' | 'ENRICHMENT' | 'CLUB';
  isDefault?: boolean;
}

export interface HomeworkAssignment {
  id: string;
  classId: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  description: string;
  attachmentUrl?: string; // Image or document URL / base64
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  reminderNotes?: string; // Dặn dò chuẩn bị sách vở đồ dùng
  createdAt: string;
}

export interface SchoolInfo {
  id: string;
  name: string; // Tên trường (e.g. Trường Tiểu học Chu Văn An)
  departmentName: string; // Phòng / Sở GD&ĐT quản lý (e.g. Phòng GD&ĐT Quận Tây Hồ - TP. Hà Nội)
  schoolYear: string; // Năm học (e.g. 2025-2026)
  principalName: string; // Hiệu trưởng / Đại diện BGH
  address?: string; // Địa chỉ trường
  phone?: string; // Số điện thoại liên hệ
  email?: string;
  website?: string;
}


