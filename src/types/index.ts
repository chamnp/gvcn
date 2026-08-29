// Types for Class, Student, Assessment according to Circular 27/2020/TT-BGDDT

export type GradeLevel = 1 | 2 | 3 | 4 | 5;

export type Gender = 'Nam' | 'Nữ';

export type TermType = 'GIUA_HK1' | 'CUOI_HK1' | 'GIUA_HK2' | 'CUOI_NAM';

export type SubjectLevel = 'T' | 'H' | 'C'; // Hoàn thành tốt, Hoàn thành, Chưa hoàn thành

export type TraitLevel = 'T' | 'Đ' | 'C'; // Tốt, Đạt, Cần cố gắng

export type AttendanceStatus = 'CO_MAT' | 'VANG_CO_PHEP' | 'VANG_KHONG_PHEP' | 'MUON';

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
  seatRow?: number; // 0-indexed row in seating grid (undefined if unassigned)
  seatCol?: number; // 0-indexed col in seating grid (undefined if unassigned)
  healthNotes?: string; // Ví dụ: Cận thị 2 độ, Dị ứng hải sản
  tags?: string[]; // Ví dụ: Ban cán sự, Tổ trưởng, Cần bồi dưỡng
  avatarUrl?: string;
  shareToken?: string; // Token bí mật cá nhân để xem phiếu báo điểm riêng tư (VD: hs-4a1-8f92a4)
  customPin?: string; // Mã PIN riêng 4-6 số do phụ huynh tự thiết lập sau khi kích hoạt
  isActivated?: boolean; // Đã kích hoạt xem bảng điểm lần đầu
  activatedAt?: string; // Thời điểm kích hoạt lần đầu
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
  schoolYear: string; // '2026-2027'
  schoolName: string; // Trường Tiểu học Đại Mỗ
  teacherName: string; // Cô Nguyễn Thị Mai
  totalStudents: number;
  seatingGridRows: number;
  seatingGridCols: number;
  numberOfTeams?: number; // Số lượng tổ trong lớp (2 đến 8 tổ, mặc định: 4)
  seatsPerDesk?: number; // Số học sinh mỗi bàn (1: Bàn đơn, 2: Bàn đôi, 3: Bàn 3 chỗ, 4: Bàn 4 chỗ, mặc định: 2)
  shareToken?: string; // Mã ngẫu nhiên bảo mật cho link public phụ huynh (VD: c4a1-8f92a4)
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

export type ClassEventType = 'EXAM' | 'HOLIDAY' | 'ACTIVITY' | 'MEETING' | 'FESTIVAL' | 'OTHER';

export interface ClassEvent {
  id: string;
  classId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "08:00 - 10:30"
  type: ClassEventType;
  location?: string;
  description?: string;
  isImportant?: boolean;
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
  isQuiz?: boolean; // True if this homework is an interactive quiz/exam
  quizQuestions?: any[]; // ExamQuestion[] from question bank
  timeLimitMinutes?: number; // e.g. 15, 20, 40 minutes (0 for unlimited)
  createdAt: string;
}

export interface QuizSubmission {
  id: string;
  homeworkId: string;
  classId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string>; // questionId -> answer ('A', 'B', 'C', 'D' or text)
  score: number; // e.g. 9.0
  totalPoints: number; // e.g. 10.0
  correctCount: number;
  totalCount: number;
  timeSpentSeconds?: number;
  submittedAt: string;
  teacherFeedback?: string;
}

export interface SchoolInfo {
  id: string;
  name: string; // Tên trường (e.g. Trường Tiểu học Chu Văn An)
  departmentName: string; // Phòng / Sở GD&ĐT quản lý (e.g. Phòng GD&ĐT Quận Tây Hồ - TP. Hà Nội)
  schoolYear: string; // Năm học (e.g. 2026-2027)
  principalName: string; // Hiệu trưởng / Đại diện BGH
  address?: string; // Địa chỉ trường
  phone?: string; // Số điện thoại liên hệ
  email?: string;
  website?: string;
  logoUrl?: string; // Logo trường học (URL hoặc base64 data)
}

// Gamification, Star Criteria & Reward Shop Types
export type StarCriterionCategory = 'Học tập' | 'Nề nếp' | 'Phẩm chất' | 'Nhắc nhở' | 'Khác';

export interface StarCriterion {
  id: string;
  classId?: string;
  category: StarCriterionCategory;
  title: string;
  points: number; // +1, +2, +3, -1, -2
  icon: string; // Emoji
  description?: string;
  isDefault?: boolean;
}

export type RewardProductCategory = 'Bút viết' | 'Vở & Sổ' | 'Hộp bút & Thước' | 'Dụng cụ học tập' | 'Phụ kiện dễ thương' | 'Khác';

export interface RewardProduct {
  id: string;
  classId?: string;
  name: string;
  description: string;
  imageUrl: string;
  starPrice: number; // Số sao cần đổi
  stock: number; // Số lượng tồn kho
  category: RewardProductCategory;
  isAvailable: boolean;
  createdAt: string;
}

export interface RedemptionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitStarPrice: number;
  imageUrl?: string;
}

export type RedemptionStatus = 'PENDING' | 'DELIVERED' | 'CANCELLED';

export interface RewardRedemption {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  studentAvatar?: string;
  items: RedemptionItem[];
  totalStars: number;
  month: string; // 'YYYY-MM' e.g. '2026-08'
  status: RedemptionStatus;
  studentNote?: string;
  requestedAt: string;
  deliveredAt?: string;
}

// ----------------------------------------------------
// Formative Progress Notes & Early Intervention Types
// ----------------------------------------------------
export type FormativeNoteCategory = 'TIEN_BO' | 'CAN_CO_GANG' | 'SUC_KHOE' | 'TRAO_DOI_PH' | 'KHAC';

export interface FormativeNote {
  id: string;
  studentId: string;
  studentName?: string;
  date: string; // YYYY-MM-DD
  category: FormativeNoteCategory;
  title: string;
  content: string;
  tags?: string[];
  isImportant?: boolean;
  createdAt: string;
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertCategory = 'ATTENDANCE' | 'ACADEMIC' | 'BEHAVIOR' | 'HEALTH_SEATING';

export interface EarlyInterventionAlert {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  reason: string;
  metricValue?: string;
  actionRecommendation: string;
  actionType?: 'CONTACT_PARENT' | 'CHANGE_SEAT' | 'TUTORING' | 'REWARD_ENCOURAGE';
}

// ----------------------------------------------------
// Phase 3: Parent Connection & Classroom Moments Types
// ----------------------------------------------------
export type LeaveRequestReason = 'OM_DAU' | 'VIEC_GIA_DINH' | 'KHAM_BENH' | 'NGHI_PHEP' | 'KHAC';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reasonType: LeaveRequestReason;
  reasonDetail: string;
  hasBoardingMealCancel?: boolean; // Hủy ăn bán trú ngày nghỉ
  medicationNotes?: string; // Dặn dò uống thuốc theo đơn
  pickupPerson?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  status: LeaveRequestStatus;
  teacherNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export type MomentCategory = 'ACADEMIC' | 'EXPERIENCE' | 'PRAISE' | 'MEMORIES';

export interface ClassMoment {
  id: string;
  classId: string;
  teacherName: string;
  category: MomentCategory;
  title: string;
  content: string;
  imageUrls: string[];
  taggedStudentIds?: string[];
  likesCount: number;
  likedBy?: string[]; // studentTokens or IPs
  createdAt: string;
}

export type ConferenceType = 'IN_PERSON' | 'PHONE' | 'ONLINE_MEET' | 'ZALO';

export interface ConferenceSlot {
  id: string;
  classId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm e.g. '08:00'
  endTime: string; // HH:mm e.g. '08:20'
  type: ConferenceType;
  location?: string; // e.g. 'Phòng học 4A1' or 'https://meet.google.com/...'
  isBooked: boolean;
  bookedStudentId?: string;
  bookedStudentName?: string;
  bookedParentName?: string;
  bookedParentPhone?: string;
  parentDiscussionTopics?: string;
  teacherNotes?: string;
  createdAt: string;
}

// Phase 7: Individualized Education Plan (IEP) & Remedial / Gifted Student Support
export type IEPCategory = 'CAN_HO_TRO' | 'NANG_KHIEU';
export type IEPStatus = 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_ADJUSTMENT';

export interface IEPPlan {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  category: IEPCategory;
  subjectCodes: string[]; // e.g. ['TOAN', 'TIENG_VIET']
  difficultyAreas: string[]; // e.g. ['Tính nhẩm có nhớ', 'Đọc ngọng l/n']
  strengths?: string; // Thế mạnh của em
  shortTermGoal: string; // Mục tiêu ngắn hạn (1 tháng)
  interventionStrategies: string; // Biện pháp sư phạm can thiệp
  buddyStudentId?: string; // Đôi bạn cùng tiến
  buddyStudentName?: string;
  parentAction?: string; // Kế hoạch phối hợp với phụ huynh
  evaluationNotes?: string; // Đánh giá tiến bộ
  status: IEPStatus;
  startDate: string; // YYYY-MM-DD
  reviewDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt?: string;
}

// Phase 7: Digital Praise Postcards
export interface PraiseCardTemplate {
  id: string;
  title: string;
  category: 'HOC_TAP' | 'NE_NEP' | 'PHAM_CHAT' | 'TIEN_BO' | 'DAC_BIET';
  badge: string; // Emoji
  bgGradient: string;
  borderColor: string;
  textColor: string;
  defaultMessage: string;
}

// Phase 8: Parent-Teacher Meeting Suite
export type ParentMeetingType = 'DAU_NAM' | 'SO_KET_HK1' | 'TONG_KET_CUOI_NAM';

export interface ParentCommitteeMember {
  role: 'TRUONG_BAN' | 'PHO_BAN' | 'UY_VIEN';
  fullName: string;
  phone: string;
  studentName: string;
}

export type MeetingSlideLayout = 'TITLE' | 'STATS' | 'BULLETS' | 'GRID_CARDS' | 'COMMITTEE' | 'SPEECH' | 'PHOTO_GALLERY' | 'SPLIT_IMAGE_TEXT';

export interface MeetingAgendaTopic {
  id: string;
  title: string;
  iconEmoji: string;
  durationMinutes: number;
  layout: MeetingSlideLayout;
  talkingPoints: string[];
  importantNote?: string;
  imageUrls?: string[]; // URLs hoặc Base64 ảnh minh họa
  imageCaption?: string; // Chú thích ảnh
  isEnabled: boolean;
}

export interface IndividualStudentMeetingNote {
  studentId: string;
  studentName: string;
  academicSummary: string;
  behaviorSummary: string;
  actionItemForParents: string;
  isPriorityDiscussion: boolean;
  parentPhone?: string;
}

export interface ParentMeetingDoc {
  id: string;
  classId: string;
  meetingType: ParentMeetingType;
  title: string;
  meetingDate: string;
  location: string;
  presidedBy: string; // GVCN
  secretary: string; // Thư ký cuộc họp
  attendeesCount: number;
  totalParents: number;
  committeeMembers: ParentCommitteeMember[];
  agendaTopics: MeetingAgendaTopic[];
  individualNotes: IndividualStudentMeetingNote[];
  aiSpeechScript?: string;
  faqList?: { question: string; suggestedAnswer: string }[];
  mainReports: string[];
  discussionNotes: string;
  agreedResolutions: string[];
  createdAt: string;
  updatedAt?: string;
}

// Phase 8: School Health Records & BMI
export type BMICategory = 'SUY_DINH_DUONG' | 'BINH_THUONG' | 'NGUY_CO_THUA_CAN' | 'BEO_PHI';

export interface HealthRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  checkupDate: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmiCategory: BMICategory;
  leftEye: string;
  rightEye: string;
  hasVisionDefect: boolean;
  allergies: string[];
  medicalNotes?: string;
  vaccinationStatus?: string;
  createdAt: string;
  updatedAt?: string;
}

// Phase 8: Classroom Reading Corner & Library
export type BookCategory = 'TRUYEN_TRANH' | 'KHOA_HOC' | 'VAN_HOC' | 'KY_NANG_SONG' | 'LICH_SU';

export interface ClassroomBook {
  id: string;
  code: string;
  title: string;
  author: string;
  category: BookCategory;
  coverEmoji: string;
  totalCopies: number;
  availableCopies: number;
  classId: string;
}

export interface BookBorrowLog {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  classId: string;
  borrowDate: string;
  returnDate?: string;
  status: 'BORROWED' | 'RETURNED';
  studentReview?: string;
  ratingStars?: number;
}

// Phase 9: Classroom Game & Interactive Quiz Arena
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // 4 options [A, B, C, D]
  correctIndex: number; // 0, 1, 2, 3
  explanation?: string;
  timeLimit?: number; // default 15s
  subjectCode?: string;
  grade?: GradeLevel;
}

export interface QuizPack {
  id: string;
  title: string;
  description: string;
  subjectCode: string;
  grade: GradeLevel | 'ALL';
  category: 'MATH' | 'VIETNAMESE' | 'ENGLISH' | 'SCIENCE_SOCIAL' | 'TRIVIA_LOGIC';
  questions: QuizQuestion[];
  isCustom?: boolean;
}

export interface QuizTeam {
  id: number;
  name: string;
  mascot: string;
  color: string;
  gradient: string;
  trackColor: string;
  score: number;
  memberIds?: string[];
}

// Phase 10: Mystery Chest & Secret Gift Box Arena
export type MysteryChestContentType = 'REWARD' | 'QUESTION' | 'CHALLENGE';

export interface MysteryChestItem {
  id: string;
  type: MysteryChestContentType;
  title: string;
  badge: string;
  starPoints?: number;
  desc: string;
  answer?: string;
  color?: string;
}

export interface MysteryChestPack {
  id: string;
  title: string;
  description: string;
  category: 'REWARD' | 'CHALLENGE' | 'QUIZ' | 'MIXED';
  icon: string;
  items: MysteryChestItem[];
  isCustom?: boolean;
}

// Phase 11: E-Lesson Plan & Classroom Presentation Suite (CV 2345/BGDĐT-GDTH)
export type TextbookSeries = 'KET_NOI_TRI_THUC' | 'CANH_DIEU' | 'CHAN_TROI_SANG_TAO';

export type LessonPhase = 'KHOI_DONG' | 'KHAM_PHA' | 'LUYEN_TAP' | 'VAN_DUNG';

export interface LessonActivity {
  id: string;
  phase: LessonPhase;
  title: string; // VD: 'Hoạt động 1: Khởi động - Trò chơi Vòng quay may mắn'
  durationMinutes: number;
  goal: string; // Mục tiêu hoạt động
  teacherActivity: string; // Hoạt động của giáo viên (tổ chức, hướng dẫn, nêu câu hỏi)
  studentActivity: string; // Hoạt động của học sinh (lắng nghe, thảo luận, thực hiện)
  expectedProduct: string; // Dự kiến sản phẩm / câu trả lời của học sinh
  assessmentNote?: string; // Đánh giá quá trình (Formative assessment)
}

export type LessonSlideLayout =
  | 'TITLE'
  | 'BULLETS'
  | 'TWO_COLUMNS'
  | 'INTERACTIVE_QUIZ'
  | 'GAME_WHEEL'
  | 'COUNTDOWN_TASK'
  | 'IMAGE_FULL'
  | 'SUMMARY';

export interface LessonSlide {
  id: string;
  title: string;
  subtitle?: string;
  phase: LessonPhase | 'TONG_KET';
  layout: LessonSlideLayout;
  content: string[]; // Bullet points or text blocks
  question?: string; // Câu hỏi tương tác trên TV
  options?: string[]; // 4 lựa chọn A, B, C, D
  correctOption?: number; // 0-indexed correct option
  explanation?: string; // Lời giải thích khi click reveal
  timerSeconds?: number; // Đồng hồ đếm ngược (VD: 300s = 5p)
  imageUrl?: string; // Hình ảnh minh họa
  speakerNotes?: string; // Gợi ý lời giảng của giáo viên
}

export interface LessonPlanObjectives {
  specificCompetencies: string[]; // Năng lực đặc thù môn học
  generalCompetencies: string[]; // Năng lực chung (Tự chủ - Tự học, Giao tiếp - Hợp tác, Giải quyết vấn đề)
  qualities: string[]; // Phẩm chất chủ yếu (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm)
}

export interface LessonPlanEquipment {
  teacher: string[]; // Đồ dùng của giáo viên (Slide TV, video, phiếu học tập, thiết bị số)
  students: string[]; // Đồ dùng của học sinh (SGK, VBT, bảng con, đồ dùng học tập)
}

export interface LessonPlan {
  id: string;
  classId: string;
  grade: GradeLevel;
  subjectCode: string; // 'TOAN', 'TIENG_VIET', 'KHOA_HOC', 'LS_DL', 'TIN_HOC_CN', 'DAO_DUC', 'HD_TRAI_NGHIEM', 'NGOAI_NGU'
  subjectName: string;
  textbook: TextbookSeries;
  week: number; // Tuần 1 - 35
  periodNumber: number; // Tiết theo PPCT
  title: string; // Tên bài dạy (VD: 'Bài 12: Các số có sáu chữ số (Tiết 1)')
  durationMinutes: number; // Mặc định 35 phút
  objectives: LessonPlanObjectives;
  equipment: LessonPlanEquipment;
  activities: LessonActivity[];
  postLessonNotes?: string; // Điều chỉnh sau bài dạy
  slides?: LessonSlide[]; // Slide bài giảng TV tương ứng
  embeddedSlideUrl?: string; // Link nhúng Canva / Google Slides / PPTX online nếu có
  isCompleted?: boolean; // Đã dạy xong
  createdAt?: string;
  updatedAt?: string;
}

export interface CurriculumTopicItem {
  id: string;
  week: number;
  periodNumber: number;
  subjectCode: string;
  title: string;
  textbook: TextbookSeries;
  suggestedObjectives: string[];
}


