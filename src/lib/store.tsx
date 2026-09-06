'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClassInfo,
  Student,
  SubjectAssessment,
  TraitAssessment,
  StudentTermSummary,
  DailyAttendance,
  StarLog,
  CustomSubject,
  HomeworkAssignment,
  TermType,
  SubjectLevel,
  TraitLevel,
  AttendanceStatus,
  TimetableSlot,
  DayOfWeek,
  SchoolInfo,
  AIConfig,
  AIGenerationSettings,
  ClassEvent,
  StarCriterion,
  RewardProduct,
  RewardRedemption,
  RedemptionItem,
  FormativeNote,
  LeaveRequest,
  ClassMoment,
  ConferenceSlot,
  QuizSubmission,
  IEPPlan,
  ParentMeetingDoc,
  HealthRecord,
  ClassroomBook,
  BookBorrowLog,
} from '@/types';

export const DEFAULT_AI_GEN_SETTINGS: AIGenerationSettings = {
  mode: 'AI_ONLINE',
  tone: 'standard',
  customToneText: '',
  lengthPreset: 'standard',
  targetWordCount: 60,
  targetSentenceCount: 3,
  includeSubjectGrades: true,
  includeTraitsAndCompetencies: true,
  includeDailyStarsAndComments: true,
  includeAttendanceAndBoarding: true,
  classDirectivePrompt: '',
};

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'GEMINI',
  apiKey: '',
  modelName: 'gemini-2.5-flash',
  temperature: 0.7,
  generationSettings: DEFAULT_AI_GEN_SETTINGS,
};
import {
  INITIAL_STUDENTS,
  INITIAL_DAILY_ATTENDANCE,
  INITIAL_STAR_LOGS,
  INITIAL_HOMEWORKS,
  INITIAL_SCHOOL_INFO,
  INITIAL_CLASS_EVENTS,
  INITIAL_STAR_CRITERIA,
  INITIAL_REWARD_PRODUCTS,
  INITIAL_REDEMPTIONS,
} from '@/data/mock-data';
import {
  PRIMARY_SUBJECTS,
  TRAIT_DEFINITIONS,
  evaluateStudentTT27,
  getCurrentTermByDate,
  getAcademicYearByDate,
} from './tt27-engine';
import {
  INITIAL_TIMETABLE,
  INITIAL_CUSTOM_SUBJECTS,
  PeriodInfo,
  TimetableScheduleConfig,
  DEFAULT_SCHEDULE_CONFIG,
  calculatePeriods,
} from './timetable-data';
import {
  FeatureFlags,
  DEFAULT_FEATURE_FLAGS,
  getStoredFeatureFlags,
  saveFeatureFlags,
  resetStoredFeatureFlags,
} from './feature-flags';
import { useAuth } from './auth-context';
import { supabase } from './supabase';
import { getIsoDateRange, isSameAttendanceDay, mergeAttendanceByDay } from './attendance-utils';
import { toast } from 'sonner';

export function getDefaultPinForStudent(student?: { dateOfBirth?: string }): string {
  if (!student?.dateOfBirth) return '1234';
  try {
    const parts = student.dateOfBirth.split('-');
    if (parts.length === 3) {
      const day = parts[2].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      return `${day}${month}`;
    }
  } catch (e) {}
  return '1234';
}

interface AppContextType {
  isLoaded: boolean;
  // School Profile & Settings
  schoolInfo: SchoolInfo;
  updateSchoolInfo: (partial: Partial<SchoolInfo>) => void;
  autoCalendarTerm: TermType;

  // Multi-Class Management
  schoolClasses: ClassInfo[];
  activeClassId: string;
  classInfo: ClassInfo;
  setClassInfo: (info: ClassInfo) => void;
  switchClass: (classId: string) => void;
  addClass: (newClass: Omit<ClassInfo, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateClass: (updated: ClassInfo) => Promise<{ success: boolean; error?: string }>;
  deleteClass: (classId: string) => void;
  regenerateClassShareToken: (classId?: string) => string;

  // Active Class Scoped Data
  students: Student[];
  allStudents: Student[];
  currentTerm: TermType;
  setCurrentTerm: (term: TermType) => void;
  subjectAssessments: SubjectAssessment[];
  traitAssessments: TraitAssessment[];
  termSummaries: StudentTermSummary[];
  attendances: DailyAttendance[];
  starLogs: StarLog[];
  apiKey: string;
  setApiKey: (key: string) => void;
  aiConfig: AIConfig;
  setAiConfig: (config: AIConfig) => void;
  aiGenSettings: AIGenerationSettings;
  setAiGenSettings: (settings: AIGenerationSettings) => void;

  // Custom Subjects Management
  customSubjects: CustomSubject[];
  addCustomSubject: (subject: Omit<CustomSubject, 'id'>) => void;
  deleteCustomSubject: (id: string) => void;

  // Timetable
  timetable: TimetableSlot[];
  periods: PeriodInfo[];
  timetableScheduleConfig: TimetableScheduleConfig;
  updateTimetableScheduleConfig: (partial: Partial<TimetableScheduleConfig>) => void;
  updateTimetableSlot: (
    day: DayOfWeek,
    period: number,
    subjectCode: string,
    subjectName: string,
    note?: string,
    teacherName?: string
  ) => void;
  setTimetable: (slots: TimetableSlot[]) => void;
  resetTimetableToStandard: () => void;

  // Homework Management
  allHomeworks: HomeworkAssignment[];
  homeworks: HomeworkAssignment[];
  addHomework: (hw: Omit<HomeworkAssignment, 'id' | 'createdAt'>) => void;
  updateHomework: (hw: HomeworkAssignment) => void;
  deleteHomework: (id: string) => void;

  // Quiz Submissions Management
  quizSubmissions: QuizSubmission[];
  allQuizSubmissions: QuizSubmission[];
  submitQuiz: (submission: Omit<QuizSubmission, 'id' | 'submittedAt'>) => QuizSubmission;
  deleteQuizSubmission: (id: string) => void;

  // Class Events Management
  classEvents: ClassEvent[];
  allClassEvents: ClassEvent[];
  addClassEvent: (event: Omit<ClassEvent, 'id'>) => void;
  updateClassEvent: (event: ClassEvent) => void;
  deleteClassEvent: (id: string) => void;

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  importStudents: (
    newStudents: Partial<Student>[],
    mode?: 'upsert' | 'replace' | 'append'
  ) => { added: number; updated: number };
  clearClassStudents: () => void;
  loadDemoStudents: () => void;
  updateSeatPosition: (studentId: string, row: number, col: number) => void;
  swapSeatPositions: (studentId1: string, studentId2: string) => void;
  updateStudentSecurity: (
    studentId: string,
    security: {
      customPin?: string;
      isActivated?: boolean;
      parentPhone?: string;
      shareToken?: string;
    }
  ) => void;
  resetStudentPin: (studentId: string) => void;
  regenerateStudentToken: (studentId: string) => string;

  // Formative Progress Notes
  formativeNotes: FormativeNote[];
  addFormativeNote: (note: Omit<FormativeNote, 'id' | 'createdAt'>) => void;
  deleteFormativeNote: (id: string) => void;

  // Assessment Actions
  updateSubjectAssessment: (
    studentId: string,
    subjectCode: string,
    term: TermType,
    level: SubjectLevel,
    score?: number,
    comment?: string
  ) => void;
  batchUpdateSubjectAssessments: (
    updates: {
      studentId: string;
      subjectCode: string;
      term: TermType;
      level: SubjectLevel;
      score?: number;
      comment?: string;
    }[]
  ) => void;
  batchSetSubjectLevel: (subjectCode: string, level: SubjectLevel) => void;
  updateTraitAssessment: (
    studentId: string,
    traitCode: string,
    category: 'PHAM_CHAT' | 'NL_CHUNG' | 'NL_DAC_THU',
    term: TermType,
    level: TraitLevel,
    comment?: string
  ) => void;
  batchSetTraitLevel: (traitCode: string, level: TraitLevel) => void;
  updateTermSummary: (studentId: string, term: TermType, partial: Partial<StudentTermSummary>) => void;
  recalculateAllAwards: (term: TermType) => void;

  // Attendance Actions
  updateAttendance: (
    studentId: string,
    date: string,
    status: AttendanceStatus,
    hasBoardingMeal: boolean,
    reason?: string
  ) => void;
  batchSetAttendance: (date: string, status: AttendanceStatus) => void;

  // Star / Reward & Daily Assessment Actions
  addStarLog: (
    studentId: string,
    points: number,
    category: string,
    reason: string,
    comment?: string,
    date?: string
  ) => void;
  deleteStarLog: (logId: string) => void;
  getStudentStars: (studentId: string) => number;

  // Star Criteria Management
  starCriteria: StarCriterion[];
  addStarCriterion: (criterion: Omit<StarCriterion, 'id'>) => void;
  updateStarCriterion: (criterion: StarCriterion) => void;
  deleteStarCriterion: (id: string) => void;
  resetStarCriteriaToDefault: () => void;

  // Reward Products & Inventory Management
  rewardProducts: RewardProduct[];
  addRewardProduct: (product: Omit<RewardProduct, 'id' | 'createdAt'>) => void;
  updateRewardProduct: (product: RewardProduct) => void;
  deleteRewardProduct: (id: string) => void;
  restockRewardProduct: (id: string, additionalStock: number) => void;

  // Reward Redemptions & Cart Actions
  rewardRedemptions: RewardRedemption[];
  createRewardRedemption: (data: {
    studentId: string;
    studentShareToken: string;
    studentName: string;
    studentCode: string;
    studentAvatar?: string;
    items: RedemptionItem[];
    totalStars: number;
    studentNote?: string;
    month?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  fulfillRewardRedemption: (redemptionId: string) => Promise<void>;
  cancelRewardRedemption: (redemptionId: string) => Promise<void>;
  getStudentMonthlyStars: (studentId: string, monthStr?: string) => { earned: number; spent: number; available: number };
  resetMonthStars: (monthStr?: string) => Promise<void>;

  // Full Database Backup & Restore
  exportAllDataJSON: () => string;
  importAllDataJSON: (jsonStr: string) => Promise<{ success: boolean; error?: string; failedTables?: string[] }>;
  resetData: () => void;

  // Phase 3: Leave Requests & Health/Pickup Notes
  leaveRequests: LeaveRequest[];
  createLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => void;
  approveLeaveRequest: (id: string, teacherNote?: string) => void;
  rejectLeaveRequest: (id: string, teacherNote?: string) => void;

  // Phase 3: Classroom Moments Feed
  classMoments: ClassMoment[];
  addClassMoment: (moment: Omit<ClassMoment, 'id' | 'likesCount' | 'createdAt'>) => void;
  likeClassMoment: (id: string, userToken: string) => void;
  deleteClassMoment: (id: string) => void;

  // Phase 3: Parent Conference 1-on-1 Scheduler
  conferenceSlots: ConferenceSlot[];
  createConferenceSlot: (slot: Omit<ConferenceSlot, 'id' | 'isBooked' | 'createdAt'>) => void;
  createMultipleConferenceSlots: (slots: Omit<ConferenceSlot, 'id' | 'isBooked' | 'createdAt'>[]) => void;
  bookConferenceSlot: (
    slotId: string,
    bookingData: {
      studentId: string;
      studentName: string;
      parentName: string;
      parentPhone: string;
      discussionTopics?: string;
    }
  ) => void;
  cancelConferenceBooking: (slotId: string) => void;
  deleteConferenceSlot: (slotId: string) => void;

  // Phase 7: IEP Plans Management
  iepPlans: IEPPlan[];
  allIEPPlans: IEPPlan[];
  addIEPPlan: (plan: Omit<IEPPlan, 'id' | 'createdAt'>) => IEPPlan;
  updateIEPPlan: (plan: IEPPlan) => void;
  deleteIEPPlan: (id: string) => void;

  // Phase 8: Parent Meetings Management
  parentMeetings: ParentMeetingDoc[];
  allParentMeetings: ParentMeetingDoc[];
  addParentMeetingDoc: (doc: Omit<ParentMeetingDoc, 'id' | 'createdAt'>) => ParentMeetingDoc;
  updateParentMeetingDoc: (doc: ParentMeetingDoc) => void;
  deleteParentMeetingDoc: (id: string) => void;

  // Phase 8: Health Records Management
  healthRecords: HealthRecord[];
  allHealthRecords: HealthRecord[];
  addHealthRecord: (rec: Omit<HealthRecord, 'id' | 'createdAt'>) => HealthRecord;
  updateHealthRecord: (rec: HealthRecord) => void;
  deleteHealthRecord: (id: string) => void;

  // Phase 8: Classroom Books & Reading Corner
  classroomBooks: ClassroomBook[];
  allClassroomBooks: ClassroomBook[];
  addClassroomBook: (book: Omit<ClassroomBook, 'id'>) => ClassroomBook;
  updateClassroomBook: (book: ClassroomBook) => void;
  deleteClassroomBook: (id: string) => void;

  bookBorrowLogs: BookBorrowLog[];
  allBookBorrowLogs: BookBorrowLog[];
  borrowBook: (data: Omit<BookBorrowLog, 'id' | 'status'>) => BookBorrowLog;
  returnBook: (logId: string, review?: string, stars?: number) => void;

  // Feature Flags Management
  featureFlags: FeatureFlags;
  setFeatureFlag: (key: keyof FeatureFlags, enabled: boolean) => void;
  resetFeatureFlags: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const INITIAL_IEP_PLANS: IEPPlan[] = [
  {
    id: 'iep-01',
    studentId: 'st-07',
    studentName: 'Trần Văn Đức',
    classId: 'class-4a1',
    category: 'CAN_HO_TRO',
    subjectCodes: ['TOAN', 'TIENG_VIET'],
    difficultyAreas: ['Tính nhẩm phép trừ có nhớ trong phạm vi 1000', 'Đọc ngọng âm L/N', 'Chính tả còn sai phụ âm đầu'],
    strengths: 'Chăm chỉ, lễ phép, thích môn Mỹ thuật và vẽ tranh rất đẹp.',
    shortTermGoal: 'Nắm vững quy tắc trừ có nhớ 3 chữ số, phát âm đúng L/N trong giờ đọc và giảm 50% lỗi chính tả.',
    interventionStrategies: '- Chia nhỏ phép tính và dùng que tính/mô hình trực quan.\n- Sử dụng thẻ từ flashcard phân biệt L/N đầu mỗi tiết học.\n- Xếp em ngồi cùng bạn Đỗ Thu Hằng (Lớp phó học tập) để hỗ trợ 1-1.',
    buddyStudentId: 'st-05',
    buddyStudentName: 'Đỗ Thu Hằng',
    parentAction: 'Gia đình cùng con đọc to 10 phút truyện cổ tích mỗi tối và kiểm tra bài tập nháp trước khi viết vào vở.',
    evaluationNotes: 'Em đã có nhiều tiến bộ, đọc tự tin hơn và tính nhẩm phép cộng trừ nhanh hơn 30%.',
    status: 'IN_PROGRESS',
    startDate: '2026-08-20',
    reviewDate: '2026-09-30',
    createdAt: '2026-08-20T08:00:00Z',
  },
  {
    id: 'iep-02',
    studentId: 'st-01',
    studentName: 'Nguyễn Văn An',
    classId: 'class-4a1',
    category: 'NANG_KHIEU',
    subjectCodes: ['TOAN', 'TIN_HOC'],
    difficultyAreas: [],
    strengths: 'Tư duy logic xuất sắc, tính nhẩm cực nhanh, hào hứng với các bài toán đố tư duy và thuật toán Scratch.',
    shortTermGoal: 'Hoàn thành các bài toán tư duy Olympic Toán Tiểu học và tham gia Đội tuyển Tin học trẻ của trường.',
    interventionStrategies: '- Giao thêm 2-3 bài toán mở rộng Mức 3 (Vận dụng cao) sau khi hoàn thành bài tập chung của lớp.\n- Hướng dẫn em làm bài tập dự án STEM và hỗ trợ các bạn trong nhóm học tập.',
    buddyStudentId: 'st-02',
    buddyStudentName: 'Trần Thị Bình',
    parentAction: 'Tạo điều kiện cho em tham gia CLB Toán tư duy và rèn luyện kỹ năng tự học.',
    evaluationNotes: 'Em đạt 10/10 các bài kiểm tra định kỳ và tích cực hướng dẫn các bạn trong tổ.',
    status: 'IN_PROGRESS',
    startDate: '2026-08-20',
    reviewDate: '2026-10-15',
    createdAt: '2026-08-20T08:30:00Z',
  },
];


export const INITIAL_PARENT_MEETINGS: ParentMeetingDoc[] = [
  {
    id: 'pm-01',
    classId: 'class-4a1',
    meetingType: 'DAU_NAM',
    title: 'Hội Nghị Cha Mẹ Học Sinh Đầu Năm Học 2026 - 2027',
    meetingDate: '2026-09-12',
    location: 'Phòng học Lớp 4A1 (Tầng 2 - Dãy nhà A)',
    presidedBy: 'Cô giáo Nguyễn Thị Hương (GVCN)',
    secretary: 'Bà Trần Thu Trang (Phụ huynh em Nguyễn Văn An)',
    attendeesCount: 38,
    totalParents: 40,
    committeeMembers: [
      { role: 'TRUONG_BAN', fullName: 'Ông Nguyễn Văn Hùng', phone: '0912.345.678', studentName: 'Nguyễn Văn An' },
      { role: 'PHO_BAN', fullName: 'Bà Lê Thu Thảo', phone: '0988.765.432', studentName: 'Trần Thị Bình' },
      { role: 'UY_VIEN', fullName: 'Bà Đỗ Hải Yến', phone: '0977.123.456', studentName: 'Đỗ Thu Hằng' },
    ],
    agendaTopics: [
      {
        id: 'ag-01',
        title: '1. Chào Mừng & Giới Thiệu Mục Tiêu Cuộc Họp',
        iconEmoji: '👋',
        durationMinutes: 5,
        layout: 'TITLE',
        isEnabled: true,
        talkingPoints: [
          'Gửi lời chào trân trọng và cảm ơn chân thành đến Quý phụ huynh đã dành thời gian tham dự.',
          'Mục đích cuộc họp: Thống nhất kế hoạch giáo dục, quy chế nề nếp và bầu Ban đại diện CMHS.',
          'Thông điệp chủ đạo: "Đồng hành gắn kết - Vì một lớp học hạnh phúc và tỏa sáng".',
        ],
        importantNote: 'Tạo không khí ấm áp, gần gũi, cởi mở ngay từ những phút đầu tiên.',
      },
      {
        id: 'ag-02',
        title: '2. Báo Cáo Đặc Điểm Tình Hình Lớp 4A1',
        iconEmoji: '👥',
        durationMinutes: 10,
        layout: 'STATS',
        isEnabled: true,
        talkingPoints: [
          'Tổng sĩ số: 40 học sinh (22 Nam, 18 Nữ) — 100% đúng độ tuổi quy định.',
          'Bán trú: 38 em đăng ký ăn trưa và nghỉ trưa tại trường.',
          'Thuận lợi: Phòng học trang bị Smart TV/Máy chiếu, phụ huynh nhiệt tình, học sinh ngoan ngoãn.',
          'Khó khăn: Một số em còn bỡ ngỡ với lượng kiến thức Lớp 4 (bước ngoặt chuyển cấp tiểu học).',
        ],
        importantNote: 'Nhấn mạnh đặc thù tâm sinh lý và chương trình học lớp 4 đòi hỏi tính tự lập cao hơn.',
      },
      {
        id: 'ag-03',
        title: '3. Chương Trình GDPT 2018 & Quy Chế Đánh Giá TT27',
        iconEmoji: '📚',
        durationMinutes: 20,
        layout: 'GRID_CARDS',
        isEnabled: true,
        talkingPoints: [
          'Đánh giá theo Thông tư 27/2020/TT-BGDĐT: Đánh giá thường xuyên bằng nhận xét khích lệ.',
          'Môn học & hoạt động: Xếp loại 3 mức (T - Hoàn thành tốt, H - Hoàn thành, C - Chưa hoàn thành).',
          '5 Phẩm chất & 10 Năng lực: Rèn luyện tính trung thực, chăm chỉ, trách nhiệm và tự học.',
          'Không so sánh áp đặt điểm số giữa các học sinh, tôn trọng sự tiến bộ và cá tính riêng.',
        ],
        importantNote: 'Giải thích rõ để phụ huynh không bị áp lực về bảng điểm số, tập trung vào sự tiến bộ hàng ngày.',
      },
      {
        id: 'ag-04',
        title: '4. Quy Định Nề Nếp, Chuyên Cần & Bán Trú',
        iconEmoji: '🍱',
        durationMinutes: 15,
        layout: 'BULLETS',
        isEnabled: true,
        talkingPoints: [
          'Giờ giấc: Có mặt tại lớp trước 7h30 sáng; tan học buổi chiều lúc 16h30.',
          'Đồng phục: Mặc đồng phục trường vào thứ Hai, thứ Tư, thứ Sáu; đeo khăn quàng đỏ đầy đủ.',
          'Đơn xin nghỉ phép: Gửi trực tuyến qua Cổng Lớp Học hoặc báo GVCN trước 7h15 để chốt suất ăn bán trú.',
          'Đồ dùng học tập: Chuẩn bị đầy đủ sách vở, bút mực, thước kẻ theo thời khóa biểu 2 buổi/ngày.',
        ],
        importantNote: 'Nhắc nhở phụ huynh phối hợp rèn thói quen tự xếp sách vở vào cặp từ tối hôm trước.',
      },
      {
        id: 'ag-05',
        title: '5. Khoảnh Khắc Học Tập & Hoạt Động Trải Nghiệm Lớp 4A1',
        iconEmoji: '📸',
        durationMinutes: 10,
        layout: 'PHOTO_GALLERY',
        isEnabled: true,
        imageUrls: [
          'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
        ],
        imageCaption: 'Hình ảnh các tiết học STEM, hoạt động nhóm sáng tạo và nụ cười rạng rỡ của các con',
        talkingPoints: [
          'Các con hào hứng tham gia các tiết học STEM thực hành và dự án khoa học nhỏ.',
          'Giờ sinh hoạt lớp sôi nổi với các trò chơi nhóm, rèn luyện kỹ năng tự tin trước đám đông.',
          'Tinh thần đoàn kết, sẻ chia và tương thân tương ái giữa các thành viên trong lớp.',
        ],
        importantNote: 'Chiếu hình ảnh giúp phụ huynh cảm nhận được môi trường học tập hạnh phúc của các con.',
      },
      {
        id: 'ag-06',
        title: '6. Bầu Ban Đại Diện Cha Mẹ Học Sinh Lớp',
        iconEmoji: '🤝',
        durationMinutes: 15,
        layout: 'COMMITTEE',
        isEnabled: true,
        talkingPoints: [
          'Tiêu chuẩn: Phụ huynh nhiệt tình, có trách nhiệm, có thời gian gắn kết cùng tập thể lớp.',
          'Cơ cấu: 01 Trưởng ban, 01 Phó ban, 01 Ủy viên.',
          'Nhiệm vụ: Cầu nối trao đổi thông tin giữa GVCN, Nhà trường và toàn thể phụ huynh.',
        ],
        importantNote: 'Tiến hành biểu quyết dân chủ, công khai và minh bạch.',
      },
      {
        id: 'ag-07',
        title: '7. Thảo Luận, Hỏi Đáp & Ký Cam Kết Đồng Hành',
        iconEmoji: '💬',
        durationMinutes: 20,
        layout: 'SPEECH',
        isEnabled: true,
        talkingPoints: [
          'Kính mời Quý phụ huynh phát biểu ý kiến đóng góp xây dựng kế hoạch lớp.',
          'GVCN giải đáp các thắc mắc về bán trú, câu lạc bộ ngoại khóa và phương pháp tự học ở nhà.',
          'Ký bản cam kết phối hợp giáo dục giữa Gia đình & Nhà trường năm học 2026 - 2027.',
        ],
        importantNote: 'Lắng nghe chân thành, ghi chép đầy đủ vào biên bản cuộc họp.',
      },
    ],
    individualNotes: [
      {
        studentId: 'st-01',
        studentName: 'Nguyễn Văn An',
        academicSummary: 'Tiếp thu bài cực nhanh, xuất sắc môn Toán & Tin học.',
        behaviorSummary: 'Ngoan ngoãn, gương mẫu, tích cực giơ tay phát biểu.',
        actionItemForParents: 'Khuyến khích con rèn thêm chữ viết nắn nót và đọc thêm sách mở rộng vốn từ.',
        isPriorityDiscussion: false,
        parentPhone: '0912.345.678',
      },
      {
        studentId: 'st-02',
        studentName: 'Trần Thị Bình',
        academicSummary: 'Chăm chỉ, học đều các môn, chữ viết rất đẹp.',
        behaviorSummary: 'Lễ phép, hòa đồng, là Đôi bạn cùng tiến gương mẫu.',
        actionItemForParents: 'Lưu ý kiểm tra độ cận thị định kỳ vì con bị cận 1.5D.',
        isPriorityDiscussion: false,
        parentPhone: '0988.765.432',
      },
      {
        studentId: 'st-07',
        studentName: 'Trần Văn Đức',
        academicSummary: 'Tính nhẩm phép trừ có nhớ còn chậm, đọc đôi lúc nhầm L/N.',
        behaviorSummary: 'Hiền lành, hơi rụt rè, thích môn Mỹ thuật và vẽ tranh.',
        actionItemForParents: 'Cần gặp riêng: Gia đình cùng con đọc truyện to 10p mỗi tối và rèn tính nhẩm kiên nhẫn.',
        isPriorityDiscussion: true,
        parentPhone: '0933.555.777',
      },
      {
        studentId: 'st-05',
        studentName: 'Đỗ Thu Hằng',
        academicSummary: 'Năng khiếu Tiếng Việt, viết văn cảm xúc, diễn đạt tốt.',
        behaviorSummary: 'Tự tin, năng nổ, quản lý tổ học tập rất tốt.',
        actionItemForParents: 'Tiếp tục phát huy thế mạnh làm MC và phụ trách Đội của lớp.',
        isPriorityDiscussion: false,
        parentPhone: '0977.123.456',
      },
    ],
    aiSpeechScript: `Kính thưa toàn thể Quý phụ huynh học sinh Lớp 4A1!

Lời đầu tiên, cho phép tôi - Nguyễn Thị Hương, Giáo viên chủ nhiệm lớp 4A1 - được gửi lời chào trân trọng nhất và lời cảm ơn chân thành tới toàn thể Quý vị đã dành thời gian quý báu về tham dự buổi Hội nghị Cha mẹ học sinh đầu năm học 2026 - 2027 hôm nay.

Năm học Lớp 4 là một năm học vô cùng đặc biệt. Đây là giai đoạn chuyển tiếp quan trọng ở bậc Tiểu học khi khối lượng kiến thức các môn Toán, Tiếng Việt, Khoa học bắt đầu nâng cao và đòi hỏi các con tư duy độc lập, tự giác hơn rất nhiều.

Tập thể Lớp 4A1 của chúng ta năm nay gồm 40 học sinh (22 nam, 18 nữ), với 38 em ăn bán trú. Qua những tuần đầu làm quen, tôi vô cùng vui mừng nhận thấy các con rất ngoan ngoãn, lễ phép, hòa đồng và luôn sẵn sàng giúp đỡ bạn bè. 

Để giúp các con phát triển toàn diện cả về tri thức lẫn nhân cách theo đúng tinh thần Thông tư 27/2020 của Bộ Giáo dục & Đào tạo, tôi rất mong muốn nhận được sự đồng hành chặt chẽ, thấu hiểu và chia sẻ từ Quý phụ huynh. Chúng ta không đặt nặng áp lực điểm số, mà sẽ cùng nhau ghi nhận từng bước tiến bộ nhỏ mỗi ngày của các con.

Xin kính chúc Quý phụ huynh sức khỏe, hạnh phúc và thành công. Chúc cho tập thể Lớp 4A1 của chúng ta một năm học mới gặt hái thật nhiều niềm vui và thành tích rực rỡ!

Xin trân trọng cảm ơn!`,
    faqList: [
      {
        question: 'Lên lớp 4 chương trình có nặng hơn nhiều không và làm sao để con không bị đuối?',
        suggestedAnswer: 'Chương trình Lớp 4 mở rộng nhiều dạng toán tư duy và bài văn miêu tả. Cô giáo sẽ phân hóa bài tập theo 3 mức độ, có đôi bạn cùng tiến kèm cặp và gửi bài luyện tập trực tuyến nhẹ nhàng. Phụ huynh chỉ cần đồng hành nhắc con ôn bài 30-45 phút mỗi tối.',
      },
      {
        question: 'Chế độ ăn bán trú và ngủ trưa của các con được chăm sóc như thế nào?',
        suggestedAnswer: 'Bếp ăn trường thực hiện nghiêm ngặt quy trình vệ sinh an toàn thực phẩm 3 bước, thực đơn thay đổi theo tuần. Phòng ngủ bán trú có điều hòa, chiếu cói sạch sẽ và cô giáo chủ nhiệm cùng cô bảo mẫu trực tiếp quản lý giấc ngủ trưa.',
      },
    ],
    mainReports: [
      'Báo cáo đặc điểm tình hình lớp 4A1: Sĩ số 40 em (22 Nam, 18 Nữ), 38 em ăn bán trú.',
      'Phổ biến quy chế đánh giá học sinh tiểu học theo Thông tư 27/2020/TT-BGDĐT.',
      'Triển khai phương hướng học tập 2 buổi/ngày, chương trình GDPT 2018 và phong trào thi đua.',
    ],
    discussionNotes: 'Phụ huynh thảo luận sôi nổi về việc phối hợp quản lý giờ tự học tại nhà và tham gia các câu lạc bộ năng khiếu.',
    agreedResolutions: [
      '100% phụ huynh nhất trí với kế hoạch giáo dục và thời khóa biểu 2 buổi/ngày.',
      'Bầu ra Ban đại diện Cha mẹ học sinh gồm 03 ông/bà theo danh sách.',
      'Cam kết đồng hành cùng nhà trường xây dựng lớp học hạnh phúc và an toàn.',
    ],
    createdAt: '2026-09-12T10:30:00Z',
  },
];

export const INITIAL_HEALTH_RECORDS: HealthRecord[] = [
  {
    id: 'hr-01',
    studentId: 'st-01',
    studentName: 'Nguyễn Văn An',
    classId: 'class-4a1',
    checkupDate: '2026-09-15',
    heightCm: 138,
    weightKg: 32,
    bmi: 16.8,
    bmiCategory: 'BINH_THUONG',
    leftEye: '10/10',
    rightEye: '10/10',
    hasVisionDefect: false,
    allergies: [],
    medicalNotes: 'Thể lực tốt, nhanh nhẹn, yêu thích thể thao.',
    vaccinationStatus: 'Đã tiêm đủ theo chương trình TCMR',
    createdAt: '2026-09-15T08:00:00Z',
  },
  {
    id: 'hr-02',
    studentId: 'st-02',
    studentName: 'Trần Thị Bình',
    classId: 'class-4a1',
    checkupDate: '2026-09-15',
    heightCm: 135,
    weightKg: 28,
    bmi: 15.4,
    bmiCategory: 'BINH_THUONG',
    leftEye: 'Cận 1.5D',
    rightEye: 'Cận 1.75D',
    hasVisionDefect: true,
    allergies: ['Dị ứng hải sản có vỏ (tôm, cua)'],
    medicalNotes: 'Cận thị học đường, đã xếp ngồi bàn 2 dãy giữa để quan sát bảng rõ hơn.',
    vaccinationStatus: 'Đã tiêm đủ',
    createdAt: '2026-09-15T08:15:00Z',
  },
  {
    id: 'hr-03',
    studentId: 'st-07',
    studentName: 'Trần Văn Đức',
    classId: 'class-4a1',
    checkupDate: '2026-09-15',
    heightCm: 132,
    weightKg: 39,
    bmi: 22.4,
    bmiCategory: 'NGUY_CO_THUA_CAN',
    leftEye: '10/10',
    rightEye: '10/10',
    hasVisionDefect: false,
    allergies: [],
    medicalNotes: 'Cần tăng cường vận động thể chất trong giờ ra chơi và tiết thể dục.',
    vaccinationStatus: 'Đã tiêm đủ',
    createdAt: '2026-09-15T08:30:00Z',
  },
];

export const INITIAL_CLASSROOM_BOOKS: ClassroomBook[] = [
  { id: 'b-01', code: 'S-01', title: 'Dế Mèn Phiêu Lưu Ký', author: 'Tô Hoài', category: 'VAN_HOC', coverEmoji: '🦗', totalCopies: 3, availableCopies: 2, classId: 'class-4a1' },
  { id: 'b-02', code: 'S-02', title: 'Mười Vạn Câu Hỏi Vì Sao (Vũ Trụ & Trái Đất)', author: 'NXB Kim Đồng', category: 'KHOA_HOC', coverEmoji: '🪐', totalCopies: 2, availableCopies: 1, classId: 'class-4a1' },
  { id: 'b-03', code: 'S-03', title: 'Kính Vạn Hoa (Tập 1)', author: 'Nguyễn Nhật Ánh', category: 'VAN_HOC', coverEmoji: '👓', totalCopies: 2, availableCopies: 2, classId: 'class-4a1' },
  { id: 'b-04', code: 'S-04', title: 'Thần Đồng Đất Việt (Tập 1 - Trạng Tí)', author: 'Lê Linh', category: 'TRUYEN_TRANH', coverEmoji: '📜', totalCopies: 4, availableCopies: 3, classId: 'class-4a1' },
  { id: 'b-05', code: 'S-05', title: 'Danh Nhân Thế Giới: Thomas Edison', author: 'NXB Trẻ', category: 'LICH_SU', coverEmoji: '💡', totalCopies: 2, availableCopies: 2, classId: 'class-4a1' },
  { id: 'b-06', code: 'S-06', title: 'Cẩm Nang Kỹ Năng Sống Cho Học Sinh Tiểu Học', author: 'Nguyễn Như Mai', category: 'KY_NANG_SONG', coverEmoji: '🌟', totalCopies: 3, availableCopies: 3, classId: 'class-4a1' },
  { id: 'b-07', code: 'S-07', title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', author: 'Nguyễn Nhật Ánh', category: 'VAN_HOC', coverEmoji: '🌼', totalCopies: 2, availableCopies: 1, classId: 'class-4a1' },
  { id: 'b-08', code: 'S-08', title: 'Khoa Học Vui: Khám Phá Cơ Thể Người', author: 'NXB Kim Đồng', category: 'KHOA_HOC', coverEmoji: '🧬', totalCopies: 2, availableCopies: 2, classId: 'class-4a1' },
];

export const INITIAL_BORROW_LOGS: BookBorrowLog[] = [
  {
    id: 'log-01',
    bookId: 'b-01',
    bookTitle: 'Dế Mèn Phiêu Lưu Ký',
    studentId: 'st-01',
    studentName: 'Nguyễn Văn An',
    classId: 'class-4a1',
    borrowDate: '2026-09-18',
    returnDate: '2026-09-22',
    status: 'RETURNED',
    studentReview: 'Cuốn sách rất hấp dẫn, em học được bài học về tình bạn và lòng dũng cảm của chú Dế Mèn!',
    ratingStars: 5,
  },
  {
    id: 'log-02',
    bookId: 'b-02',
    bookTitle: 'Mười Vạn Câu Hỏi Vì Sao (Vũ Trụ & Trái Đất)',
    studentId: 'st-05',
    studentName: 'Đỗ Thu Hằng',
    classId: 'class-4a1',
    borrowDate: '2026-09-20',
    status: 'BORROWED',
  },
  {
    id: 'log-03',
    bookId: 'b-04',
    bookTitle: 'Thần Đồng Đất Việt (Tập 1 - Trạng Tí)',
    studentId: 'st-02',
    studentName: 'Trần Thị Bình',
    classId: 'class-4a1',
    borrowDate: '2026-09-21',
    status: 'BORROWED',
  },
  {
    id: 'log-04',
    bookId: 'b-07',
    bookTitle: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
    studentId: 'st-03',
    studentName: 'Lê Hoàng Cường',
    classId: 'class-4a1',
    borrowDate: '2026-09-22',
    status: 'BORROWED',
  },
];

export function mergeWithTimestamp<T extends { id?: string; updatedAt?: string }>(
  localItems: T[],
  serverItems: T[],
  keyFn?: (item: T) => string
): { merged: T[]; itemsToSyncUp: T[] } {
  const getKey = keyFn || ((item: T) => item.id || '');
  const serverMap = new Map<string, T>();
  for (const item of serverItems) {
    const k = getKey(item);
    if (k) serverMap.set(k, item);
  }

  const localMap = new Map<string, T>();
  for (const item of localItems) {
    const k = getKey(item);
    if (k) localMap.set(k, item);
  }

  const itemsToSyncUp: T[] = [];
  const merged: T[] = [];

  for (const serverItem of serverItems) {
    const key = getKey(serverItem);
    const localItem = key ? localMap.get(key) : undefined;
    if (!localItem) {
      merged.push(serverItem);
    } else {
      const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
      const serverTime = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : 0;
      // Nếu local mới hơn server (ví dụ vừa nhập điểm offline), giữ local và xếp lịch sync bù lên server
      if (localTime > serverTime) {
        merged.push(localItem);
        itemsToSyncUp.push(localItem);
      } else {
        merged.push(serverItem);
      }
    }
  }

  // Các bản ghi chỉ có ở local (được tạo lúc offline)
  for (const localItem of localItems) {
    const key = getKey(localItem);
    if (key && !serverMap.has(key)) {
      merged.push(localItem);
      itemsToSyncUp.push(localItem);
    }
  }

  return { merged, itemsToSyncUp };
}

export async function safeSupabaseUpsert(table: string, payload: any) {
  try {
    const { error } = await supabase.from(table).upsert(payload);
    if (error) {
      console.warn(`[Supabase Sync] Upsert ${table} failed:`, error.message);
    }
  } catch (err: any) {
    console.warn(`[Supabase Sync] Network exception on ${table}:`, err?.message);
  }
}

export async function handleDbMutation(
  promise: PromiseLike<{ error: any }>,
  rollback?: () => void,
  errorMessage?: string
): Promise<boolean> {
  try {
    const { error } = await promise;
    if (error) {
      if (rollback) rollback();
      const msg = errorMessage ? `${errorMessage}: ${error.message}` : error.message;
      console.error('[Supabase Mutation Error]', msg);
      toast.error(msg);
      return false;
    }
    return true;
  } catch (err: any) {
    if (rollback) rollback();
    const msg = errorMessage ? `${errorMessage}: ${err?.message || 'Lỗi mạng'}` : (err?.message || 'Lỗi kết nối máy chủ');
    console.error('[Supabase Mutation Exception]', msg);
    toast.error(msg);
    return false;
  }
}

const STORAGE_PREFIX = 'gvcn_pro_';

const EMPTY_SCHOOL_INFO: SchoolInfo = {
  id: '',
  name: '',
  departmentName: '',
  schoolYear: getAcademicYearByDate(),
  principalName: '',
};

const EMPTY_CLASS: ClassInfo = {
  id: '',
  name: '',
  grade: 1,
  schoolYear: getAcademicYearByDate(),
  schoolName: '',
  teacherName: '',
  totalStudents: 0,
  seatingGridRows: 5,
  seatingGridCols: 8,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const autoCalendarTerm = useMemo(() => getCurrentTermByDate(), []);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(EMPTY_SCHOOL_INFO);
  const [schoolClasses, setSchoolClasses] = useState<ClassInfo[]>([]);
  const [activeClassId, setActiveClassId] = useState<string>('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [currentTerm, setCurrentTerm] = useState<TermType>(() => getCurrentTermByDate());
  const [subjectAssessments, setSubjectAssessments] = useState<SubjectAssessment[]>([]);
  const [traitAssessments, setTraitAssessments] = useState<TraitAssessment[]>([]);
  const [termSummaries, setTermSummaries] = useState<StudentTermSummary[]>([]);
  const [attendances, setAttendances] = useState<DailyAttendance[]>([]);
  const [starLogs, setStarLogs] = useState<StarLog[]>([]);
  const [starCriteria, setStarCriteria] = useState<StarCriterion[]>([]);
  const [rewardProducts, setRewardProducts] = useState<RewardProduct[]>([]);
  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemption[]>([]);
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [allHomeworks, setAllHomeworks] = useState<HomeworkAssignment[]>([]);
  const [allQuizSubmissions, setAllQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [allIEPPlans, setAllIEPPlans] = useState<IEPPlan[]>([]);
  const [allParentMeetings, setAllParentMeetings] = useState<ParentMeetingDoc[]>([]);
  const [allHealthRecords, setAllHealthRecords] = useState<HealthRecord[]>([]);
  const [allClassroomBooks, setAllClassroomBooks] = useState<ClassroomBook[]>([]);
  const [allBookBorrowLogs, setAllBookBorrowLogs] = useState<BookBorrowLog[]>([]);
  const [allClassEvents, setAllClassEvents] = useState<ClassEvent[]>([]);
  const [allTimetables, setAllTimetables] = useState<TimetableSlot[]>([]);
  const [timetableScheduleConfig, setTimetableScheduleConfig] = useState<TimetableScheduleConfig>(DEFAULT_SCHEDULE_CONFIG);
  const periods = useMemo(() => calculatePeriods(timetableScheduleConfig), [timetableScheduleConfig]);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [aiConfig, setAiConfigState] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [aiGenSettings, setAiGenSettingsState] = useState<AIGenerationSettings>(DEFAULT_AI_GEN_SETTINGS);
  const [formativeNotes, setFormativeNotes] = useState<FormativeNote[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [classMoments, setClassMoments] = useState<ClassMoment[]>([]);
  const [conferenceSlots, setConferenceSlots] = useState<ConferenceSlot[]>([]);
  const [featureFlags, setFeatureFlagsState] = useState<FeatureFlags>(getStoredFeatureFlags);
  const [isLoaded, setIsLoaded] = useState(false);

  const setFeatureFlag = useCallback((key: keyof FeatureFlags, enabled: boolean) => {
    setFeatureFlagsState((prev) => {
      const next = { ...prev, [key]: enabled };
      saveFeatureFlags(next);
      return next;
    });
  }, []);

  const resetFeatureFlags = useCallback(() => {
    const next = resetStoredFeatureFlags();
    setFeatureFlagsState(next);
  }, []);

  // Active Class Info
  const classInfo = useMemo(() => {
    return schoolClasses.find((c) => c.id === activeClassId) || schoolClasses[0] || EMPTY_CLASS;
  }, [schoolClasses, activeClassId]);

  // Scoped Students for active class
  const students = useMemo(() => {
    const list = allStudents.filter((s) => s.classId === activeClassId);
    return list;
  }, [allStudents, activeClassId]);

  // Scoped Events for active class
  const classEvents = useMemo(() => {
    return allClassEvents.filter((ev) => ev.classId === activeClassId);
  }, [allClassEvents, activeClassId]);

  // Scoped Timetable for active class
  const timetable = useMemo(() => {
    const list = allTimetables.filter((t) => t.classId === activeClassId);
    return list;
  }, [allTimetables, activeClassId]);

  // Scoped Homework for active class
  const homeworks = useMemo(() => {
    return allHomeworks.filter(
      (hw) => hw.classId === activeClassId || hw.className === classInfo.name
    );
  }, [allHomeworks, activeClassId, classInfo.name]);

  const { profile, teachers, updateProfile } = useAuth();

  // Tự động chuyển lớp theo phân công của giáo viên khi đăng nhập
  useEffect(() => {
    if (profile && (profile.role === 'TEACHER' || profile.role === 'ADMIN_TEACHER')) {
      const targetId = profile.assignedClassId || (profile.assignedClassName ? `class-${profile.assignedClassName.replace('Lớp ', '').trim().toLowerCase()}` : undefined);
      if (targetId && targetId !== activeClassId) {
        const classExists = schoolClasses.some((c) => c.id === targetId);
        if (classExists) {
          setActiveClassId(targetId);
        }
      }
    }
  }, [profile, schoolClasses, activeClassId]);

  // Tự động đồng bộ tên Giáo viên từ Supabase / Teacher whitelist vào danh sách Lớp học
  useEffect(() => {
    if (teachers && teachers.length > 0) {
      setSchoolClasses((prev) => {
        let hasDiff = false;
        const updated = prev.map((cls) => {
          const matchedTeacher = teachers.find(
            (t) =>
              t.role === 'TEACHER' &&
              (t.assignedClassId === cls.id ||
                (t.assignedClassName &&
                  t.assignedClassName.replace('Lớp ', '').trim().toLowerCase() === cls.name.toLowerCase()))
          );
          if (matchedTeacher && matchedTeacher.fullName && matchedTeacher.fullName !== cls.teacherName) {
            hasDiff = true;
            return {
              ...cls,
              teacherName: matchedTeacher.fullName,
            };
          }
          return cls;
        });

        if (hasDiff) {
          try {
            localStorage.setItem(STORAGE_PREFIX + 'schoolClasses', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        }
        return prev;
      });
    }
  }, [teachers]);

  // Đồng bộ Giáo viên Chủ nhiệm của lớp đang chọn với profile người dùng nếu là GVCN lớp đó
  useEffect(() => {
    if (profile && profile.role === 'TEACHER' && profile.fullName && profile.fullName.trim() !== '') {
      if (
        profile.assignedClassId === activeClassId ||
        profile.assignedClassName?.replace('Lớp ', '').trim().toLowerCase() === classInfo.name.toLowerCase()
      ) {
        if (classInfo.teacherName !== profile.fullName) {
          setSchoolClasses((prev) =>
            prev.map((c) => (c.id === activeClassId ? { ...c, teacherName: profile.fullName } : c))
          );
        }
      }
    }
  }, [profile, activeClassId, classInfo.name, classInfo.teacherName]);

  // Chỉ nạp tùy chọn giao diện từ localStorage. Dữ liệu nghiệp vụ luôn lấy từ Supabase.
  useEffect(() => {
    try {
      const savedActiveId = localStorage.getItem(STORAGE_PREFIX + 'activeClassId');
      const savedTerm = localStorage.getItem(STORAGE_PREFIX + 'currentTerm');
      const savedScheduleConfig = localStorage.getItem(STORAGE_PREFIX + 'timetableScheduleConfig');
      const savedAiConfig = localStorage.getItem(STORAGE_PREFIX + 'aiConfig');
      const savedGenSettings = localStorage.getItem(STORAGE_PREFIX + 'aiGenSettings');

      if (savedActiveId) setActiveClassId(savedActiveId);
      if (savedTerm) setCurrentTerm(savedTerm as TermType);
      if (savedScheduleConfig) {
        const parsed = JSON.parse(savedScheduleConfig);
        if (parsed && typeof parsed === 'object') {
          setTimetableScheduleConfig((prev) => ({ ...prev, ...parsed }));
        }
      }
      if (savedAiConfig) {
        const parsed = JSON.parse(savedAiConfig);
        setAiConfigState({ ...DEFAULT_AI_CONFIG, ...parsed, apiKey: parsed.apiKey || '' });
        if (parsed.apiKey) setApiKeyState(parsed.apiKey);
      }
      if (savedGenSettings) {
        setAiGenSettingsState({ ...DEFAULT_AI_GEN_SETTINGS, ...JSON.parse(savedGenSettings) });
      }
    } catch (error) {
      console.warn('Không thể đọc tùy chọn cục bộ:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 100% Live API Connection: Đồng bộ dữ liệu 2 chiều thời gian thực với Supabase
  useEffect(() => {
    let isMounted = true;

    async function syncFromSupabase() {
      try {
        const [
          { data: dbSchool, error: schoolError },
          { data: dbClasses, error: classesError },
          { data: dbStudents, error: studentsError },
          { data: dbAssessments, error: assessmentsError },
          { data: dbTraits, error: traitsError },
          { data: dbSummaries, error: summariesError },
          { data: dbAttendances, error: attendancesError },
          { data: dbStars, error: starsError },
          { data: dbCriteria, error: criteriaError },
          { data: dbProducts, error: productsError },
          { data: dbRedemptions, error: redemptionsError },
          { data: dbHomeworks, error: homeworksError },
          { data: dbQuizSubmissions, error: quizSubmissionsError },
          { data: dbTimetable, error: timetableError },
          { data: dbEvents, error: eventsError },
          { data: dbCustomSubjects, error: customSubjectsError },
          { data: dbNotes, error: notesError },
          { data: dbLeave, error: leaveError },
          { data: dbMoments, error: momentsError },
          { data: dbConferences, error: conferencesError },
          { data: dbIEPPlans, error: iepError },
          { data: dbParentMeetings, error: meetingsError },
          { data: dbHealthRecords, error: healthError },
          { data: dbClassroomBooks, error: booksError },
          { data: dbBorrowLogs, error: borrowLogsError },
          { data: dbTeacherConfigs, error: teacherConfigsError },
        ] = await Promise.all([
          supabase.from('SchoolInfo').select('*').single(),
          supabase.from('Class').select('*').order('grade', { ascending: true }),
          supabase.from('Student').select('*').order('id', { ascending: true }),
          supabase.from('SubjectAssessment').select('*'),
          supabase.from('TraitAssessment').select('*'),
          supabase.from('TermSummary').select('*'),
          supabase.from('DailyAttendance').select('*'),
          supabase.from('StarLog').select('*').order('createdAt', { ascending: false }),
          supabase.from('StarCriterion').select('*').order('points', { ascending: false }),
          supabase.from('RewardProduct').select('*').order('starPrice', { ascending: true }),
          supabase.from('RewardRedemption').select('*').order('requestedAt', { ascending: false }),
          supabase.from('HomeworkAssignment').select('*').order('createdAt', { ascending: false }),
          supabase.from('QuizSubmission').select('*').order('submittedAt', { ascending: false }),
          supabase.from('TimetableSlot').select('*'),
          supabase.from('ClassEvent').select('*').order('date', { ascending: true }),
          supabase.from('CustomSubject').select('*'),
          supabase.from('FormativeNote').select('*').order('date', { ascending: false }),
          supabase.from('LeaveRequest').select('*').order('createdAt', { ascending: false }),
          supabase.from('ClassMoment').select('*').order('createdAt', { ascending: false }),
          supabase.from('ConferenceSlot').select('*').order('date', { ascending: true }),
          supabase.from('IEPPlan').select('*').order('createdAt', { ascending: false }),
          supabase.from('ParentMeeting').select('*').order('meetingDate', { ascending: false }),
          supabase.from('HealthRecord').select('*'),
          supabase.from('ClassroomBook').select('*').order('title', { ascending: true }),
          supabase.from('BookBorrowLog').select('*').order('borrowDate', { ascending: false }),
          profile?.email
            ? supabase.from('TeacherConfig').select('*').eq('email', profile.email.toLowerCase()).limit(1)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (!isMounted) return;

        const syncErrors = [
          schoolError, classesError, studentsError, assessmentsError, traitsError, summariesError,
          attendancesError, starsError, criteriaError, productsError, redemptionsError, homeworksError,
          quizSubmissionsError, timetableError, eventsError, customSubjectsError, notesError, leaveError,
          momentsError, conferencesError, iepError, meetingsError, healthError, booksError, borrowLogsError,
          teacherConfigsError,
        ].filter(Boolean);
        if (syncErrors.length > 0) {
          console.error('Supabase initial fetch errors:', syncErrors.map((error) => error?.message));
          toast.error(`Không thể đồng bộ ${syncErrors.length} nhóm dữ liệu từ máy chủ.`);
        }

        if (dbSchool) {
          setSchoolInfo((prev) => ({
            ...prev,
            id: dbSchool.id || prev.id,
            name: dbSchool.name || '',
            departmentName: dbSchool.departmentName || '',
            address: dbSchool.address || '',
            phone: dbSchool.phone || '',
            email: dbSchool.email || '',
            website: dbSchool.website || '',
            logoUrl: dbSchool.logoUrl || '',
            principalName: dbSchool.principalName || '',
            schoolYear: dbSchool.schoolYear || getAcademicYearByDate(),
          }));

          if (dbSchool.aiConfig && typeof dbSchool.aiConfig === 'object') {
            setAiConfigState(dbSchool.aiConfig);
            if (dbSchool.aiConfig.apiKey) {
              setApiKeyState(dbSchool.aiConfig.apiKey);
            }
          }

          if (dbSchool.aiGenSettings && typeof dbSchool.aiGenSettings === 'object') {
            setAiGenSettingsState(dbSchool.aiGenSettings);
          }

          if (dbSchool.timetableConfig && typeof dbSchool.timetableConfig === 'object') {
            setTimetableScheduleConfig((prev) => ({ ...prev, ...dbSchool.timetableConfig }));
          }
        }

        if (dbTeacherConfigs && dbTeacherConfigs.length > 0) {
          const cfg = dbTeacherConfigs[0];
          if (cfg.aiConfig && typeof cfg.aiConfig === 'object') {
            setAiConfigState(cfg.aiConfig);
            if (cfg.aiConfig.apiKey) setApiKeyState(cfg.aiConfig.apiKey);
          }
          if (cfg.aiGenSettings && typeof cfg.aiGenSettings === 'object') {
            setAiGenSettingsState(cfg.aiGenSettings);
          }
        }

        if (dbClasses) {
          const userEmail = (profile?.email || '').toLowerCase().trim();
          const isAdminUser = profile?.role === 'ADMIN' || userEmail === 'anhnnh4@gmail.com';
          
          // If admin, show all classes across all schools.
          // If teacher, show only classes owned by this teacher or assigned to them.
          const visibleClasses = isAdminUser
            ? dbClasses
            : dbClasses.filter(
                (c: any) =>
                  (c.teacherEmail && c.teacherEmail.toLowerCase() === userEmail) ||
                  c.id === profile?.assignedClassId
              );

          setSchoolClasses(visibleClasses);
          setActiveClassId((current) =>
            visibleClasses.some((item: any) => item.id === current)
              ? current
              : visibleClasses[0]?.id || ''
          );
        }

        if (dbStudents) {
          const mappedStudents: Student[] = dbStudents.map((st: any) => ({
            id: st.id,
            classId: st.classId,
            studentCode: st.studentCode,
            fullName: st.fullName,
            gender: st.gender,
            dateOfBirth: st.dateOfBirth,
            birthPlace: st.birthPlace,
            ethnicity: st.ethnicity,
            address: st.address,
            parentName: st.parentName,
            parentPhone: st.parentPhone,
            isBoarding: st.isBoarding !== false,
            seatRow: st.seatRow,
            seatCol: st.seatCol,
            healthNotes: st.healthNotes,
            tags: typeof st.tags === 'string' ? JSON.parse(st.tags || '[]') : st.tags || [],
            avatarUrl: st.avatarUrl,
            shareToken: st.shareToken,
            customPin: st.customPin,
            isActivated: Boolean(st.isActivated),
            createdAt: st.createdAt,
            updatedAt: st.updatedAt,
          }));
          setAllStudents(mappedStudents);
        }

        if (dbAssessments) {
          setSubjectAssessments(dbAssessments);
        }

        if (dbTraits) {
          setTraitAssessments(dbTraits);
        }

        if (dbSummaries) {
          setTermSummaries(dbSummaries);
        }

        if (dbAttendances) {
          setAttendances(dbAttendances);
        }

        if (dbStars) {
          setStarLogs(dbStars);
        }

        if (dbCriteria) {
          setStarCriteria(dbCriteria);
        }

        if (dbProducts) {
          setRewardProducts(dbProducts);
        }

        if (dbRedemptions) {
          const mappedRedemptions: RewardRedemption[] = dbRedemptions.map((r: any) => ({
            id: r.id,
            classId: r.classId,
            studentId: r.studentId,
            studentName: r.studentName,
            studentCode: r.studentCode,
            studentAvatar: r.studentAvatar,
            items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
            totalStars: r.totalStars,
            month: r.month,
            status: r.status,
            studentNote: r.studentNote,
            requestedAt: r.requestedAt,
            deliveredAt: r.deliveredAt,
          }));
          setRewardRedemptions(mappedRedemptions);
        }

        if (dbHomeworks) {
          setAllHomeworks(dbHomeworks);
        }

        if (dbQuizSubmissions) {
          setAllQuizSubmissions(dbQuizSubmissions);
        }

        if (dbTimetable) {
          setAllTimetables(dbTimetable);
        }

        if (dbEvents) {
          setAllClassEvents(dbEvents);
        }

        if (dbCustomSubjects) {
          setCustomSubjects(dbCustomSubjects);
        }

        if (dbNotes) {
          setFormativeNotes(dbNotes);
        }

        if (dbLeave) {
          setLeaveRequests(dbLeave);
        }

        if (dbMoments) {
          setClassMoments(dbMoments);
        }

        if (dbConferences) {
          setConferenceSlots(dbConferences);
        }

        if (dbIEPPlans) {
          setAllIEPPlans(dbIEPPlans);
        }

        if (dbParentMeetings) {
          setAllParentMeetings(dbParentMeetings);
        }

        if (dbHealthRecords) {
          setAllHealthRecords(dbHealthRecords);
        }

        if (dbClassroomBooks) {
          setAllClassroomBooks(dbClassroomBooks);
        }

        if (dbBorrowLogs) {
          setAllBookBorrowLogs(dbBorrowLogs);
        }
      } catch (err) {
        console.warn('Supabase initial fetch error:', err);
      }
    }

    syncFromSupabase();

    // Setup Live Realtime Subscriptions via Supabase Channels
    const channel = supabase
      .channel('gvcn_live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'SchoolInfo' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newRow = payload.new as any;
            setSchoolInfo((prev) => ({
              ...prev,
              name: newRow.name || prev.name,
              departmentName: newRow.departmentName || prev.departmentName,
              address: newRow.address || prev.address,
              phone: newRow.phone || prev.phone,
              email: newRow.email || prev.email,
              website: newRow.website || prev.website,
              logoUrl: newRow.logoUrl || prev.logoUrl,
              principalName: newRow.principalName || prev.principalName,
              schoolYear: newRow.schoolYear || prev.schoolYear,
            }));
            if (newRow.aiConfig && typeof newRow.aiConfig === 'object') {
              setAiConfigState(newRow.aiConfig);
              if (newRow.aiConfig.apiKey) setApiKeyState(newRow.aiConfig.apiKey);
            }
            if (newRow.aiGenSettings && typeof newRow.aiGenSettings === 'object') {
              setAiGenSettingsState(newRow.aiGenSettings);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Class' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as ClassInfo;
            setSchoolClasses((prev) => {
              if (prev.some((c) => c.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setSchoolClasses((prev) => prev.filter((c) => c.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as ClassInfo;
            setSchoolClasses((prev) => prev.map((c) => (c.id === newRow.id ? newRow : c)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'StarLog' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as StarLog;
            setStarLogs((prev) => {
              if (prev.some((l) => l.id === newRow.id)) return prev;
              return [newRow, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setStarLogs((prev) => prev.filter((l) => l.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as StarLog;
            setStarLogs((prev) => prev.map((l) => (l.id === newRow.id ? newRow : l)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'RewardRedemption' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as any;
            const mapped: RewardRedemption = {
              ...newRow,
              items: typeof newRow.items === 'string' ? JSON.parse(newRow.items) : (newRow.items || []),
            };
            setRewardRedemptions((prev) => {
              if (prev.some((r) => r.id === mapped.id)) return prev;
              return [mapped, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setRewardRedemptions((prev) => prev.filter((r) => r.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as any;
            const mapped: RewardRedemption = {
              ...newRow,
              items: typeof newRow.items === 'string' ? JSON.parse(newRow.items) : (newRow.items || []),
            };
            setRewardRedemptions((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'RewardProduct' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as RewardProduct;
            setRewardProducts((prev) => {
              if (prev.some((p) => p.id === newRow.id)) return prev;
              return [newRow, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setRewardProducts((prev) => prev.filter((p) => p.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as RewardProduct;
            setRewardProducts((prev) => prev.map((p) => (p.id === newRow.id ? newRow : p)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'StarCriterion' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as StarCriterion;
            setStarCriteria((prev) => {
              if (prev.some((c) => c.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setStarCriteria((prev) => prev.filter((c) => c.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as StarCriterion;
            setStarCriteria((prev) => prev.map((c) => (c.id === newRow.id ? newRow : c)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Student' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const st = payload.new as any;
            const mapped: Student = {
              ...st,
              tags: typeof st.tags === 'string' ? JSON.parse(st.tags || '[]') : st.tags || [],
              isActivated: Boolean(st.isActivated),
            };
            setAllStudents((prev) => {
              if (prev.some((s) => s.id === mapped.id)) return prev;
              return [...prev, mapped];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAllStudents((prev) => prev.filter((s) => s.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const st = payload.new as any;
            const mapped: Student = {
              ...st,
              tags: typeof st.tags === 'string' ? JSON.parse(st.tags || '[]') : st.tags || [],
              isActivated: Boolean(st.isActivated),
            };
            setAllStudents((prev) => prev.map((s) => (s.id === mapped.id ? mapped : s)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'DailyAttendance' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as DailyAttendance;
            setAttendances((prev) => mergeAttendanceByDay(prev, newRow));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAttendances((prev) => prev.filter((a) => a.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as DailyAttendance;
            setAttendances((prev) => mergeAttendanceByDay(prev, newRow));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'SubjectAssessment' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as SubjectAssessment;
            setSubjectAssessments((prev) => {
              if (prev.some((s) => s.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setSubjectAssessments((prev) => prev.filter((s) => s.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as SubjectAssessment;
            setSubjectAssessments((prev) => prev.map((s) => (s.id === newRow.id ? newRow : s)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'TraitAssessment' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as TraitAssessment;
            setTraitAssessments((prev) => {
              if (prev.some((t) => t.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setTraitAssessments((prev) => prev.filter((t) => t.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as TraitAssessment;
            setTraitAssessments((prev) => prev.map((t) => (t.id === newRow.id ? newRow : t)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'TermSummary' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as StudentTermSummary;
            setTermSummaries((prev) => {
              if (prev.some((t) => t.studentId === newRow.studentId && t.term === newRow.term)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setTermSummaries((prev) => prev.filter((t) => !(t.studentId === oldRow.studentId && t.term === oldRow.term)));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as StudentTermSummary;
            setTermSummaries((prev) => prev.map((t) => (t.studentId === newRow.studentId && t.term === newRow.term ? newRow : t)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'HomeworkAssignment' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as HomeworkAssignment;
            setAllHomeworks((prev) => {
              if (prev.some((h) => h.id === newRow.id)) return prev;
              return [newRow, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAllHomeworks((prev) => prev.filter((h) => h.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as HomeworkAssignment;
            setAllHomeworks((prev) => prev.map((h) => (h.id === newRow.id ? newRow : h)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ClassEvent' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as ClassEvent;
            setAllClassEvents((prev) => {
              if (prev.some((e) => e.id === newRow.id)) return prev;
              return [newRow, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAllClassEvents((prev) => prev.filter((e) => e.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as ClassEvent;
            setAllClassEvents((prev) => prev.map((e) => (e.id === newRow.id ? newRow : e)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'TimetableSlot' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as TimetableSlot;
            setAllTimetables((prev) => {
              if (prev.some((t) => t.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAllTimetables((prev) => prev.filter((t) => t.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as TimetableSlot;
            setAllTimetables((prev) => prev.map((t) => (t.id === newRow.id ? newRow : t)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'CustomSubject' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as CustomSubject;
            setCustomSubjects((prev) => {
              if (prev.some((s) => s.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setCustomSubjects((prev) => prev.filter((s) => s.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as CustomSubject;
            setCustomSubjects((prev) => prev.map((s) => (s.id === newRow.id ? newRow : s)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'IEPPlan' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as IEPPlan;
            setAllIEPPlans((prev) => (prev.some((p) => p.id === newRow.id) ? prev : [newRow, ...prev]));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAllIEPPlans((prev) => prev.filter((p) => p.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as IEPPlan;
            setAllIEPPlans((prev) => prev.map((p) => (p.id === newRow.id ? newRow : p)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ParentMeeting' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as ParentMeetingDoc;
            setAllParentMeetings((prev) => (prev.some((p) => p.id === newRow.id) ? prev : [newRow, ...prev]));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAllParentMeetings((prev) => prev.filter((p) => p.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as ParentMeetingDoc;
            setAllParentMeetings((prev) => prev.map((p) => (p.id === newRow.id ? newRow : p)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'HealthRecord' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as HealthRecord;
            setAllHealthRecords((prev) => (prev.some((h) => h.id === newRow.id) ? prev : [newRow, ...prev]));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAllHealthRecords((prev) => prev.filter((h) => h.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as HealthRecord;
            setAllHealthRecords((prev) => prev.map((h) => (h.id === newRow.id ? newRow : h)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ClassroomBook' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as ClassroomBook;
            setAllClassroomBooks((prev) => (prev.some((b) => b.id === newRow.id) ? prev : [newRow, ...prev]));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAllClassroomBooks((prev) => prev.filter((b) => b.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as ClassroomBook;
            setAllClassroomBooks((prev) => prev.map((b) => (b.id === newRow.id ? newRow : b)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'BookBorrowLog' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as BookBorrowLog;
            setAllBookBorrowLogs((prev) => (prev.some((l) => l.id === newRow.id) ? prev : [newRow, ...prev]));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAllBookBorrowLogs((prev) => prev.filter((l) => l.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as BookBorrowLog;
            setAllBookBorrowLogs((prev) => prev.map((l) => (l.id === newRow.id ? newRow : l)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'LeaveRequest' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as LeaveRequest;
            setLeaveRequests((prev) => (prev.some((l) => l.id === newRow.id) ? prev : [newRow, ...prev]));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setLeaveRequests((prev) => prev.filter((l) => l.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as LeaveRequest;
            setLeaveRequests((prev) => prev.map((l) => (l.id === newRow.id ? newRow : l)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'FormativeNote' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as FormativeNote;
            setFormativeNotes((prev) => (prev.some((n) => n.id === newRow.id) ? prev : [newRow, ...prev]));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setFormativeNotes((prev) => prev.filter((n) => n.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as FormativeNote;
            setFormativeNotes((prev) => prev.map((n) => (n.id === newRow.id ? newRow : n)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'QuizSubmission' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as QuizSubmission;
            setAllQuizSubmissions((prev) => {
              const withoutPrevious = prev.filter(
                (item) => !(item.homeworkId === newRow.homeworkId && item.studentId === newRow.studentId)
              );
              return [newRow, ...withoutPrevious];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as QuizSubmission;
            setAllQuizSubmissions((prev) => prev.filter((item) => item.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as QuizSubmission;
            setAllQuizSubmissions((prev) => prev.map((item) => (item.id === newRow.id ? newRow : item)));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.email]);

  // Chỉ lưu tùy chọn giao diện; dữ liệu nghiệp vụ không dùng localStorage làm nguồn dự phòng.
  useEffect(() => {
    if (!isLoaded) return;
    const safeSet = (key: string, value: string) => {
      try { localStorage.setItem(key, value); } catch (e) { console.warn(`localStorage quota exceeded for key: ${key}`, e); }
    };
    safeSet(STORAGE_PREFIX + 'activeClassId', activeClassId);
    safeSet(STORAGE_PREFIX + 'currentTerm', currentTerm);
    safeSet(STORAGE_PREFIX + 'timetableScheduleConfig', JSON.stringify(timetableScheduleConfig));
  }, [
    isLoaded,
    activeClassId,
    currentTerm,
    timetableScheduleConfig,
  ]);

  // SCHOOL PROFILE ACTIONS
  const updateSchoolInfo = (partial: Partial<SchoolInfo>) => {
    setSchoolInfo((prev) => {
      const updated = { ...prev, ...partial };
      // Đồng bộ tên trường và năm học sang tất cả các lớp trong trường
      if (partial.name || partial.schoolYear) {
        setSchoolClasses((classes) =>
          classes.map((c) => ({
            ...c,
            schoolName: partial.name || c.schoolName,
            schoolYear: partial.schoolYear || c.schoolYear,
          }))
        );
      }

      // Live API Write to Supabase
      void handleDbMutation(
        supabase
          .from('SchoolInfo')
          .upsert({
            id: 'default',
            name: updated.name,
            departmentName: updated.departmentName || '',
            address: updated.address || '',
            phone: updated.phone || '',
            email: updated.email || '',
            website: updated.website || '',
            logoUrl: updated.logoUrl || '',
            principalName: updated.principalName,
            schoolYear: updated.schoolYear,
            updatedAt: new Date().toISOString(),
          }),
        undefined,
        'Không thể cập nhật thông tin trường'
      );

      return updated;
    });
    toast.success('Đã cập nhật thông tin nhà trường!');
  };

  // CLASS ACTIONS
  const setClassInfo = (info: ClassInfo) => {
    updateClass(info);
  };

  const switchClass = (classId: string) => {
    if (profile && profile.role === 'TEACHER') {
      return;
    }
    setActiveClassId(classId);
  };

  const addClass = async (newClassData: Omit<ClassInfo, 'id'>): Promise<{ success: boolean; error?: string }> => {
    const userEmail = (profile?.email || '').toLowerCase().trim();
    const isAdminUser = profile?.role === 'ADMIN' || userEmail === 'anhnnh4@gmail.com';

    // 1. Regular teacher can only manage 1 homeroom class
    if (!isAdminUser && schoolClasses.length >= 1) {
      toast.error('Mỗi giáo viên chỉ quản lý chủ nhiệm 1 lớp học! Thầy/Cô có thể chỉnh sửa thông tin lớp hiện tại trong Cài đặt.');
      return { success: false, error: 'ALREADY_HAS_CLASS' };
    }

    const trimmedName = newClassData.name.trim();
    const trimmedSchool = (newClassData.schoolName || profile?.schoolName || '').trim();

    if (!trimmedName) {
      toast.error('Vui lòng nhập tên lớp (ví dụ: 4A1)!');
      return { success: false, error: 'MISSING_NAME' };
    }

    if (!trimmedSchool) {
      toast.error('Vui lòng nhập tên trường tiểu học!');
      return { success: false, error: 'MISSING_SCHOOL' };
    }

    // 2. Check duplicate (schoolName + name) in Supabase
    try {
      const { data: existingClasses } = await supabase
        .from('Class')
        .select('id, name, schoolName, teacherName, teacherEmail');

      if (existingClasses) {
        const duplicate = existingClasses.find(
          (c: any) =>
            (c.name || '').trim().toLowerCase() === trimmedName.toLowerCase() &&
            (c.schoolName || '').trim().toLowerCase() === trimmedSchool.toLowerCase()
        );

        if (duplicate) {
          toast.error(
            `Lớp ${trimmedName} tại trường "${trimmedSchool}" đã tồn tại trên hệ thống (GVCN: ${duplicate.teacherName || duplicate.teacherEmail || 'giáo viên khác'})! Không thể đăng ký trùng.`
          );
          return { success: false, error: 'DUPLICATE_CLASS' };
        }
      }
    } catch (e) {
      console.warn('Error checking duplicate class:', e);
    }

    // 3. Create class object
    const cleanName = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newClass: ClassInfo = {
      ...newClassData,
      id: `class-${Date.now()}`,
      name: trimmedName,
      schoolName: trimmedSchool,
      teacherEmail: newClassData.teacherEmail || userEmail,
      district: newClassData.district || profile?.district || '',
      province: newClassData.province || profile?.province || '',
      teacherName: newClassData.teacherName || profile?.fullName || 'Giáo viên',
      shareToken: newClassData.shareToken || `c${cleanName}-${randomSuffix}`,
    };

    setSchoolClasses((prev) => [...prev, newClass]);
    setActiveClassId(newClass.id);

    // 4. Save to Supabase Class table
    const { error: insertError } = await supabase.from('Class').insert({
      id: newClass.id,
      name: newClass.name,
      grade: newClass.grade,
      schoolYear: newClass.schoolYear,
      schoolName: newClass.schoolName,
      teacherName: newClass.teacherName,
      teacherEmail: newClass.teacherEmail,
      district: newClass.district,
      province: newClass.province,
      totalStudents: newClass.totalStudents || 0,
      seatingGridRows: newClass.seatingGridRows || 5,
      seatingGridCols: newClass.seatingGridCols || 8,
      shareToken: newClass.shareToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Insert class error:', insertError);
      setSchoolClasses((prev) => prev.filter((c) => c.id !== newClass.id));
      toast.error('Không thể lưu lớp học lên máy chủ.');
      return { success: false, error: insertError.message };
    }

    // 5. Update Teacher table in Supabase & local profile
    if (userEmail) {
      await supabase
        .from('Teacher')
        .update({
          assignedClassId: newClass.id,
          schoolName: newClass.schoolName,
          mainGrade: newClass.grade,
          updatedAt: new Date().toISOString(),
        })
        .eq('email', userEmail);

      updateProfile({
        assignedClassId: newClass.id,
        schoolName: newClass.schoolName,
        mainGrade: newClass.grade,
      });
    }

    toast.success(`Đã khởi tạo thành công Lớp ${newClass.name}! 🎉`);
    return { success: true };
  };

  const updateClass = async (updated: ClassInfo): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = updated.name.trim();
    const trimmedSchool = (updated.schoolName || '').trim();

    // Check duplicate if name or schoolName changed
    try {
      const { data: existingClasses } = await supabase
        .from('Class')
        .select('id, name, schoolName, teacherName, teacherEmail');

      if (existingClasses) {
        const duplicate = existingClasses.find(
          (c: any) =>
            c.id !== updated.id &&
            (c.name || '').trim().toLowerCase() === trimmedName.toLowerCase() &&
            (c.schoolName || '').trim().toLowerCase() === trimmedSchool.toLowerCase()
        );

        if (duplicate) {
          toast.error(
            `Lớp ${trimmedName} tại trường "${trimmedSchool}" đã tồn tại trên hệ thống (GVCN: ${duplicate.teacherName || duplicate.teacherEmail})! Không thể đổi trùng.`
          );
          return { success: false, error: 'DUPLICATE_CLASS' };
        }
      }
    } catch (e) {
      console.warn('Error checking duplicate class:', e);
    }

    const previousClasses = schoolClasses;
    setSchoolClasses((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...updated, name: trimmedName, schoolName: trimmedSchool } : c))
    );

    // Live API Write to Supabase
    const { error } = await supabase
      .from('Class')
      .update({
        name: trimmedName,
        grade: updated.grade,
        schoolYear: updated.schoolYear,
        schoolName: trimmedSchool,
        teacherName: updated.teacherName,
        teacherEmail: updated.teacherEmail || profile?.email || '',
        district: updated.district || profile?.district || '',
        province: updated.province || profile?.province || '',
        isArchived: updated.isArchived || false,
        totalStudents: updated.totalStudents || 0,
        seatingGridRows: updated.seatingGridRows || 5,
        seatingGridCols: updated.seatingGridCols || 8,
        shareToken: updated.shareToken,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', updated.id);

    if (error) {
      console.error('Update class error:', error);
      setSchoolClasses(previousClasses);
      toast.error('Không thể cập nhật lớp học');
      return { success: false, error: error.message };
    }

    // Update teacher record
    if (updated.teacherEmail) {
      await supabase
        .from('Teacher')
        .update({
          schoolName: trimmedSchool,
          mainGrade: updated.grade,
          updatedAt: new Date().toISOString(),
        })
        .eq('email', updated.teacherEmail.toLowerCase());
    }

    toast.success(`Đã cập nhật thông tin Lớp ${trimmedName}!`);
    return { success: true };
  };

  const deleteClass = (classId: string) => {
    // Clean up all data belonging to this class
    const classStudentIds = new Set(
      allStudents.filter((s) => s.classId === classId).map((s) => s.id)
    );
    setAllStudents((prev) => prev.filter((s) => s.classId !== classId));
    setStarLogs((prev) => prev.filter((s) => !classStudentIds.has(s.studentId)));
    setAttendances((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setSubjectAssessments((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setTraitAssessments((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setTermSummaries((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setAllHomeworks((prev) => prev.filter((hw) => hw.classId !== classId));
    setAllTimetables((prev) => prev.filter((t) => t.classId !== classId));
    setAllClassEvents((prev) => prev.filter((e) => e.classId !== classId));
    setRewardProducts((prev) => prev.filter((p) => p.classId !== classId));
    setRewardRedemptions((prev) => prev.filter((r) => r.classId !== classId));

    setSchoolClasses((prev) => prev.filter((c) => c.id !== classId));
    if (activeClassId === classId) {
      const remaining = schoolClasses.filter((c) => c.id !== classId);
      if (remaining.length > 0) setActiveClassId(remaining[0].id);
    }

    // Cascade delete in Supabase
    void handleDbMutation(
      (async () => {
        await Promise.allSettled([
          supabase.from('Student').delete().eq('classId', classId),
          supabase.from('HomeworkAssignment').delete().eq('classId', classId),
          supabase.from('TimetableSlot').delete().eq('classId', classId),
          supabase.from('ClassEvent').delete().eq('classId', classId),
          supabase.from('RewardProduct').delete().eq('classId', classId),
          supabase.from('RewardRedemption').delete().eq('classId', classId),
        ]);
        return supabase.from('Class').delete().eq('id', classId);
      })(),
      undefined,
      'Không thể xóa lớp học trên máy chủ'
    );
  };

  const regenerateClassShareToken = (classId?: string): string => {
    const targetId = classId || activeClassId;
    const newToken = `c-${crypto.randomUUID().replaceAll('-', '')}`;

    setSchoolClasses((prev) => {
      const updated = prev.map((c) => (c.id === targetId ? { ...c, shareToken: newToken } : c));
      try {
        localStorage.setItem(STORAGE_PREFIX + 'schoolClasses', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    void handleDbMutation(
      supabase.from('Class').update({ shareToken: newToken, updatedAt: new Date().toISOString() }).eq('id', targetId),
      undefined,
      'Không thể cập nhật mã chia sẻ lớp'
    );

    return newToken;
  };

  // CUSTOM SUBJECT ACTIONS
  const addCustomSubject = (subjectData: Omit<CustomSubject, 'id'>) => {
    const newSub: CustomSubject = {
      ...subjectData,
      id: `cs-${Date.now()}`,
    };
    setCustomSubjects((prev) => [...prev, newSub]);

    const previous = customSubjects;
    void handleDbMutation(
      supabase
        .from('CustomSubject')
        .upsert({
          id: newSub.id,
          code: newSub.code,
          name: newSub.name,
          shortName: newSub.shortName,
          icon: newSub.icon,
          bgColor: newSub.bgColor,
          textColor: newSub.textColor,
          borderColor: newSub.borderColor,
          category: newSub.category,
          createdAt: new Date().toISOString(),
        }),
      () => setCustomSubjects(previous),
      'Không thể thêm môn học tự chọn'
    );
  };

  const deleteCustomSubject = (id: string) => {
    const previous = customSubjects;
    setCustomSubjects((prev) => prev.filter((s) => s.id !== id));
    void handleDbMutation(
      supabase.from('CustomSubject').delete().eq('id', id),
      () => setCustomSubjects(previous),
      'Không thể xóa môn học tự chọn'
    );
  };

  // HOMEWORK ACTIONS
  const addHomework = (hwData: Omit<HomeworkAssignment, 'id' | 'createdAt'>) => {
    const newHw: HomeworkAssignment = {
      ...hwData,
      id: `hw-${Date.now()}`,
      classId: hwData.classId || activeClassId,
      className: hwData.className || classInfo.name,
      createdAt: new Date().toISOString(),
    };
    setAllHomeworks((prev) => [newHw, ...prev]);

    // Live API Write to Supabase
    const previous = allHomeworks;
    void handleDbMutation(
      supabase
        .from('HomeworkAssignment')
        .upsert({
          id: newHw.id,
          classId: newHw.classId,
          className: newHw.className,
          subjectCode: newHw.subjectCode,
          subjectName: newHw.subjectName,
          title: newHw.title,
          description: newHw.description,
          attachmentUrl: newHw.attachmentUrl,
          assignedDate: newHw.assignedDate,
          dueDate: newHw.dueDate,
          reminderNotes: newHw.reminderNotes,
          createdAt: newHw.createdAt,
        }),
      () => setAllHomeworks(previous),
      'Không thể lưu bài tập'
    );
  };

  const updateHomework = (updated: HomeworkAssignment) => {
    setAllHomeworks((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));

    const previous = allHomeworks;
    void handleDbMutation(
      supabase
        .from('HomeworkAssignment')
        .upsert({
          id: updated.id,
          classId: updated.classId,
          className: updated.className,
          subjectCode: updated.subjectCode,
          subjectName: updated.subjectName,
          title: updated.title,
          description: updated.description,
          attachmentUrl: updated.attachmentUrl,
          assignedDate: updated.assignedDate,
          dueDate: updated.dueDate,
          reminderNotes: updated.reminderNotes,
        }),
      () => setAllHomeworks(previous),
      'Không thể cập nhật bài tập'
    );
  };

  const deleteHomework = (id: string) => {
    const previous = allHomeworks;
    setAllHomeworks((prev) => prev.filter((h) => h.id !== id));
    void handleDbMutation(
      supabase.from('HomeworkAssignment').delete().eq('id', id),
      () => setAllHomeworks(previous),
      'Không thể xóa bài tập'
    );
  };

  // TIMETABLE ACTIONS
  const updateTimetableSlot = (
    day: DayOfWeek,
    period: number,
    subjectCode: string,
    subjectName: string,
    note?: string,
    teacherName?: string
  ) => {
    const slotId = `${activeClassId}-${day.toLowerCase()}-p${period}`;
    const session = period <= 4 ? 'MORNING' : 'AFTERNOON';

    setAllTimetables((prev) => {
      const idx = prev.findIndex(
        (s) => (s.classId || 'class-4a1') === activeClassId && s.day === day && s.period === period
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          subjectCode,
          subjectName,
          note: note !== undefined ? note : copy[idx].note,
          teacherName: teacherName !== undefined ? teacherName : copy[idx].teacherName,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: slotId,
          classId: activeClassId,
          day,
          period,
          session,
          subjectCode,
          subjectName,
          note: note || '',
          teacherName: teacherName || undefined,
        },
      ];
    });

    void handleDbMutation(
      supabase
        .from('TimetableSlot')
        .upsert({
          id: slotId,
          classId: activeClassId,
          day,
          period,
          session,
          subjectCode,
          subjectName,
          note: note || '',
          teacherName: teacherName || null,
          createdAt: new Date().toISOString(),
        }),
      undefined,
      'Không thể lưu tiết thời khóa biểu'
    );
  };

  const setTimetable = (slots: TimetableSlot[]) => {
    setAllTimetables((prev) => {
      const otherClasses = prev.filter((s) => (s.classId || 'class-4a1') !== activeClassId);
      const taggedSlots = slots.map((s) => ({ ...s, classId: activeClassId }));
      return [...otherClasses, ...taggedSlots];
    });

    const dbSlots = slots.map((s) => ({
      id: s.id || `${activeClassId}-${s.day.toLowerCase()}-p${s.period}`,
      classId: activeClassId,
      day: s.day,
      period: s.period,
      session: s.session || (s.period <= 4 ? 'MORNING' : 'AFTERNOON'),
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      note: s.note || '',
      teacherName: s.teacherName || null,
      createdAt: new Date().toISOString(),
    }));
    void handleDbMutation(
      supabase.from('TimetableSlot').upsert(dbSlots),
      undefined,
      'Không thể lưu thời khóa biểu'
    );
  };

  const resetTimetableToStandard = () => {
    setTimetable(INITIAL_TIMETABLE.map((t) => ({ ...t, classId: activeClassId })));
  };

  const updateTimetableScheduleConfig = (partial: Partial<TimetableScheduleConfig>) => {
    setTimetableScheduleConfig((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_PREFIX + 'timetableScheduleConfig', JSON.stringify(updated));
      } catch (e) {}

      supabase
        .from('SchoolInfo')
        .update({
          timetableConfig: updated,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', schoolInfo.id || 'default')
        .then(({ error }) => {
          if (error) console.warn('[Supabase Sync] timetableConfig update error:', error.message);
        });

      return updated;
    });
  };

  // STUDENT ACTIONS
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    const studentId = `hs-${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      classId: activeClassId,
      id: studentId,
      shareToken: studentData.shareToken || `s-${studentId}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setAllStudents((prev) => [...prev, newStudent]);

    // Live API Write to Supabase
    const previous = allStudents;
    void handleDbMutation(
      supabase
        .from('Student')
        .upsert({
          id: newStudent.id,
          classId: newStudent.classId,
          studentCode: newStudent.studentCode,
          fullName: newStudent.fullName,
          gender: newStudent.gender,
          dateOfBirth: newStudent.dateOfBirth,
          birthPlace: newStudent.birthPlace || null,
          ethnicity: newStudent.ethnicity || null,
          address: newStudent.address || null,
          parentName: newStudent.parentName || null,
          parentPhone: newStudent.parentPhone || null,
          isBoarding: newStudent.isBoarding,
          seatRow: newStudent.seatRow ?? null,
          seatCol: newStudent.seatCol ?? null,
          healthNotes: newStudent.healthNotes || null,
          tags: JSON.stringify(newStudent.tags || []),
          avatarUrl: newStudent.avatarUrl || null,
          shareToken: newStudent.shareToken,
          customPin: newStudent.customPin || null,
          isActivated: newStudent.isActivated || false,
          createdAt: newStudent.createdAt,
          updatedAt: new Date().toISOString(),
        }),
      () => setAllStudents(previous),
      'Không thể thêm học sinh'
    );
  };

  const updateStudent = (updated: Student) => {
    setAllStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

    // Live API Write to Supabase
    const previous = allStudents;
    void handleDbMutation(
      supabase
        .from('Student')
        .upsert({
          id: updated.id,
          classId: updated.classId,
          studentCode: updated.studentCode,
          fullName: updated.fullName,
          gender: updated.gender,
          dateOfBirth: updated.dateOfBirth,
          birthPlace: updated.birthPlace,
          ethnicity: updated.ethnicity,
          address: updated.address,
          parentName: updated.parentName,
          parentPhone: updated.parentPhone,
          isBoarding: updated.isBoarding,
          seatRow: updated.seatRow,
          seatCol: updated.seatCol,
          healthNotes: updated.healthNotes,
          tags: JSON.stringify(updated.tags || []),
          avatarUrl: updated.avatarUrl,
          shareToken: updated.shareToken,
          customPin: updated.customPin,
          isActivated: updated.isActivated,
          updatedAt: new Date().toISOString(),
        }),
      () => setAllStudents(previous),
      'Không thể cập nhật thông tin học sinh'
    );
  };

  const deleteStudent = (id: string) => {
    setAllStudents((prev) => prev.filter((s) => s.id !== id));
    setStarLogs((prev) => prev.filter((s) => s.studentId !== id));
    setAttendances((prev) => prev.filter((a) => a.studentId !== id));
    setSubjectAssessments((prev) => prev.filter((a) => a.studentId !== id));
    setTraitAssessments((prev) => prev.filter((a) => a.studentId !== id));
    setTermSummaries((prev) => prev.filter((a) => a.studentId !== id));

    // Live API Deletion from Supabase
    const prevStudents = allStudents;
    void handleDbMutation(
      (async () => {
        await Promise.allSettled([
          supabase.from('StarLog').delete().eq('studentId', id),
          supabase.from('DailyAttendance').delete().eq('studentId', id),
          supabase.from('SubjectAssessment').delete().eq('studentId', id),
          supabase.from('TraitAssessment').delete().eq('studentId', id),
          supabase.from('TermSummary').delete().eq('studentId', id),
        ]);
        return supabase.from('Student').delete().eq('id', id);
      })(),
      () => setAllStudents(prevStudents),
      'Không thể xóa học sinh trên máy chủ'
    );
  };

  const importStudents = (
    imported: Partial<Student>[],
    mode: 'upsert' | 'replace' | 'append' = 'upsert'
  ): { added: number; updated: number } => {
    let addedCount = 0;
    let updatedCount = 0;

    const normalizeNameForMatch = (str?: string) =>
      String(str || '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();

    if (mode === 'replace') {
      const otherClassStudents = allStudents.filter(
        (s) => s.classId !== activeClassId
      );
      const newStudents: Student[] = imported.map((st, i) => {
        const studentId = `hs-${Date.now()}-${i}`;
        return {
          id: studentId,
          classId: activeClassId,
          studentCode: st.studentCode || `HS-${classInfo.name}-${String(i + 1).padStart(3, '0')}`,
          fullName: st.fullName || 'Học sinh mới',
          gender: st.gender || 'Nam',
          dateOfBirth: st.dateOfBirth || '2016-01-01',
          birthPlace: st.birthPlace || '',
          ethnicity: st.ethnicity || '',
          address: st.address || '',
          parentName: st.parentName || '',
          parentPhone: st.parentPhone || '',
          isBoarding: st.isBoarding ?? true,
          seatRow: Math.floor(i / 8),
          seatCol: i % 8,
          healthNotes: st.healthNotes || '',
          tags: st.tags || [],
          shareToken: `s-${studentId}-${Math.random().toString(36).substring(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
      });
      setAllStudents([...otherClassStudents, ...newStudents]);

      // Delete old students from Supabase and write new ones
      void handleDbMutation(
        (async () => {
          await supabase.from('Student').delete().eq('classId', activeClassId);
          const dbRows = newStudents.map((st) => ({
            id: st.id,
            classId: st.classId,
            studentCode: st.studentCode,
            fullName: st.fullName,
            gender: st.gender,
            dateOfBirth: st.dateOfBirth,
            birthPlace: st.birthPlace || null,
            ethnicity: st.ethnicity || null,
            address: st.address || null,
            parentName: st.parentName || null,
            parentPhone: st.parentPhone || null,
            isBoarding: st.isBoarding,
            seatRow: st.seatRow ?? null,
            seatCol: st.seatCol ?? null,
            healthNotes: st.healthNotes || null,
            tags: JSON.stringify(st.tags || []),
            avatarUrl: st.avatarUrl || null,
            shareToken: st.shareToken,
            customPin: st.customPin || null,
            isActivated: st.isActivated || false,
            createdAt: st.createdAt,
            updatedAt: new Date().toISOString(),
          }));
          return supabase.from('Student').upsert(dbRows);
        })(),
        undefined,
        'Không thể thay thế danh sách học sinh trên máy chủ'
      );

      return { added: newStudents.length, updated: 0 };
    }

    if (mode === 'append') {
      const newStudents: Student[] = imported.map((st, i) => {
        const studentId = `hs-${Date.now()}-${i}`;
        return {
          id: studentId,
          classId: activeClassId,
          studentCode: st.studentCode || `HS-${classInfo.name}-${String(students.length + i + 1).padStart(3, '0')}`,
          fullName: st.fullName || 'Học sinh mới',
          gender: st.gender || 'Nam',
          dateOfBirth: st.dateOfBirth || '2016-01-01',
          birthPlace: st.birthPlace || '',
          ethnicity: st.ethnicity || '',
          address: st.address || '',
          parentName: st.parentName || '',
          parentPhone: st.parentPhone || '',
          isBoarding: st.isBoarding ?? true,
          seatRow: Math.floor((students.length + i) / 8),
          seatCol: (students.length + i) % 8,
          healthNotes: st.healthNotes || '',
          tags: st.tags || [],
          shareToken: `s-${studentId}-${Math.random().toString(36).substring(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
      });
      setAllStudents((prev) => [...prev, ...newStudents]);

      // Persist to Supabase
      const dbRows = newStudents.map((st) => ({
        id: st.id,
        classId: st.classId,
        studentCode: st.studentCode,
        fullName: st.fullName,
        gender: st.gender,
        dateOfBirth: st.dateOfBirth,
        birthPlace: st.birthPlace || null,
        ethnicity: st.ethnicity || null,
        address: st.address || null,
        parentName: st.parentName || null,
        parentPhone: st.parentPhone || null,
        isBoarding: st.isBoarding,
        seatRow: st.seatRow ?? null,
        seatCol: st.seatCol ?? null,
        healthNotes: st.healthNotes || null,
        tags: JSON.stringify(st.tags || []),
        avatarUrl: st.avatarUrl || null,
        shareToken: st.shareToken,
        customPin: st.customPin || null,
        isActivated: st.isActivated || false,
        createdAt: st.createdAt,
        updatedAt: new Date().toISOString(),
      }));
      void handleDbMutation(
        supabase.from('Student').upsert(dbRows),
        undefined,
        'Không thể thêm mới danh sách học sinh'
      );

      return { added: newStudents.length, updated: 0 };
    }

    // Default: 'upsert' (Cập nhật thông tin nếu học sinh đã tồn tại, thêm mới nếu chưa có)
    setAllStudents((prev) => {
      const currentClassStudents = prev.filter(
        (s) => s.classId === activeClassId
      );
      const otherClassStudents = prev.filter(
        (s) => s.classId !== activeClassId
      );

      const updatedClassStudents = [...currentClassStudents];

      imported.forEach((st, i) => {
        const normImportName = normalizeNameForMatch(st.fullName);
        const importCode = st.studentCode ? st.studentCode.toLowerCase().trim() : '';

        const existingIndex = updatedClassStudents.findIndex((existing) => {
          const existCode = existing.studentCode ? existing.studentCode.toLowerCase().trim() : '';
          const normExistName = normalizeNameForMatch(existing.fullName);

          if (importCode && existCode && importCode === existCode) {
            return true;
          }
          if (normImportName && normExistName && normImportName === normExistName) {
            if (st.dateOfBirth && existing.dateOfBirth && st.dateOfBirth === existing.dateOfBirth) {
              return true;
            }
            return true;
          }
          return false;
        });

        if (existingIndex !== -1) {
          const existing = updatedClassStudents[existingIndex];
          updatedClassStudents[existingIndex] = {
            ...existing,
            studentCode: st.studentCode || existing.studentCode,
            fullName: st.fullName || existing.fullName,
            gender: st.gender || existing.gender,
            dateOfBirth: st.dateOfBirth || existing.dateOfBirth,
            birthPlace: st.birthPlace !== undefined && st.birthPlace !== '' ? st.birthPlace : existing.birthPlace,
            ethnicity: st.ethnicity !== undefined && st.ethnicity !== '' ? st.ethnicity : existing.ethnicity,
            address: st.address !== undefined && st.address !== '' ? st.address : existing.address,
            parentName: st.parentName !== undefined && st.parentName !== '' ? st.parentName : existing.parentName,
            parentPhone: st.parentPhone !== undefined && st.parentPhone !== '' ? st.parentPhone : existing.parentPhone,
            isBoarding: st.isBoarding !== undefined ? st.isBoarding : existing.isBoarding,
            healthNotes: st.healthNotes !== undefined && st.healthNotes !== '' ? st.healthNotes : existing.healthNotes,
          };
          updatedCount++;
        } else {
          const studentId = `hs-${Date.now()}-${i}`;
          const newStudent: Student = {
            id: studentId,
            classId: activeClassId,
            studentCode: st.studentCode || `HS-${classInfo.name}-${String(updatedClassStudents.length + 1).padStart(3, '0')}`,
            fullName: st.fullName || 'Học sinh mới',
            gender: st.gender || 'Nam',
            dateOfBirth: st.dateOfBirth || '2016-01-01',
            birthPlace: st.birthPlace || '',
            ethnicity: st.ethnicity || '',
            address: st.address || '',
            parentName: st.parentName || '',
            parentPhone: st.parentPhone || '',
            isBoarding: st.isBoarding ?? true,
            seatRow: Math.floor(updatedClassStudents.length / 8),
            seatCol: updatedClassStudents.length % 8,
            healthNotes: st.healthNotes || '',
            tags: st.tags || [],
            shareToken: `s-${studentId}-${Math.random().toString(36).substring(2, 8)}`,
            createdAt: new Date().toISOString(),
          };
          updatedClassStudents.push(newStudent);
          addedCount++;
        }
      });

      // Persist to Supabase Live Database
      const dbRows = updatedClassStudents.map((st) => ({
        id: st.id,
        classId: st.classId,
        studentCode: st.studentCode,
        fullName: st.fullName,
        gender: st.gender,
        dateOfBirth: st.dateOfBirth,
        birthPlace: st.birthPlace || null,
        ethnicity: st.ethnicity || null,
        address: st.address || null,
        parentName: st.parentName || null,
        parentPhone: st.parentPhone || null,
        isBoarding: st.isBoarding,
        seatRow: st.seatRow ?? null,
        seatCol: st.seatCol ?? null,
        healthNotes: st.healthNotes || null,
        tags: JSON.stringify(st.tags || []),
        avatarUrl: st.avatarUrl || null,
        shareToken: st.shareToken,
        customPin: st.customPin || null,
        isActivated: st.isActivated || false,
        createdAt: st.createdAt,
        updatedAt: new Date().toISOString(),
      }));
      void handleDbMutation(
        supabase.from('Student').upsert(dbRows),
        undefined,
        'Không thể cập nhật danh sách học sinh'
      );

      return [...otherClassStudents, ...updatedClassStudents];
    });

    return { added: addedCount, updated: updatedCount };
  };

  const clearClassStudents = () => {
    const classStudentIds = new Set(
      allStudents
        .filter((s) => s.classId === activeClassId)
        .map((s) => s.id)
    );
    setAllStudents((prev) => prev.filter((s) => s.classId !== activeClassId));
    setStarLogs((prev) => prev.filter((s) => !classStudentIds.has(s.studentId)));
    setAttendances((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setSubjectAssessments((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setTraitAssessments((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setTermSummaries((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));

    // Live API Deletion from Supabase
    void handleDbMutation(
      supabase.from('Student').delete().eq('classId', activeClassId),
      undefined,
      'Không thể xóa danh sách học sinh của lớp'
    );
  };

  const loadDemoStudents = () => {
    const demoForActive = INITIAL_STUDENTS.map((st) => ({
      ...st,
      id: `hs-${activeClassId}-${st.id}`,
      classId: activeClassId,
      studentCode: st.studentCode.replace('HS4A1', `HS${classInfo.name.replace(/\s+/g, '')}`),
      shareToken: `s-${st.id.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(36).substring(2, 8)}`,
    }));
    setAllStudents((prev) => {
      const otherClasses = prev.filter((s) => (s.classId || 'class-4a1') !== activeClassId);
      return [...otherClasses, ...demoForActive];
    });

    const dbRows = demoForActive.map((st) => ({
      id: st.id,
      classId: st.classId,
      studentCode: st.studentCode,
      fullName: st.fullName,
      gender: st.gender,
      dateOfBirth: st.dateOfBirth,
      parentName: st.parentName,
      parentPhone: st.parentPhone,
      isBoarding: st.isBoarding,
      seatRow: st.seatRow,
      seatCol: st.seatCol,
      healthNotes: st.healthNotes,
      tags: JSON.stringify(st.tags || []),
      shareToken: st.shareToken,
      createdAt: st.createdAt,
      updatedAt: new Date().toISOString(),
    }));
    void handleDbMutation(
      supabase.from('Student').upsert(dbRows),
      undefined,
      'Không thể lưu dữ liệu học sinh mẫu'
    );
  };

  const updateSeatPosition = (studentId: string, row: number, col: number) => {
    const finalRow = row < 0 ? undefined : row;
    const finalCol = col < 0 ? undefined : col;
    setAllStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, seatRow: finalRow, seatCol: finalCol } : s))
    );
    void handleDbMutation(
      supabase.from('Student').update({ seatRow: finalRow ?? null, seatCol: finalCol ?? null, updatedAt: new Date().toISOString() }).eq('id', studentId),
      undefined,
      'Không thể cập nhật vị trí chỗ ngồi'
    );
  };

  const swapSeatPositions = (studentId1: string, studentId2: string) => {
    const s1 = allStudents.find((s) => s.id === studentId1);
    const s2 = allStudents.find((s) => s.id === studentId2);
    if (!s1 || !s2) return;

    const s1Row = s1.seatRow;
    const s1Col = s1.seatCol;
    const s2Row = s2.seatRow;
    const s2Col = s2.seatCol;

    setAllStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId1) return { ...s, seatRow: s2Row, seatCol: s2Col };
        if (s.id === studentId2) return { ...s, seatRow: s1Row, seatCol: s1Col };
        return s;
      })
    );

    void handleDbMutation(
      supabase.from('Student').update({ seatRow: s2Row ?? null, seatCol: s2Col ?? null, updatedAt: new Date().toISOString() }).eq('id', studentId1),
      undefined,
      'Không thể đổi chỗ ngồi học sinh 1'
    );
    void handleDbMutation(
      supabase.from('Student').update({ seatRow: s1Row ?? null, seatCol: s1Col ?? null, updatedAt: new Date().toISOString() }).eq('id', studentId2),
      undefined,
      'Không thể đổi chỗ ngồi học sinh 2'
    );
  };

  const updateStudentSecurity = (
    studentId: string,
    security: {
      customPin?: string;
      isActivated?: boolean;
      parentPhone?: string;
      shareToken?: string;
    }
  ) => {
    setAllStudents((prev) => {
      const updated = prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            customPin: security.customPin !== undefined ? security.customPin : s.customPin,
            isActivated: security.isActivated !== undefined ? security.isActivated : s.isActivated,
            activatedAt: security.isActivated ? (s.activatedAt || new Date().toISOString()) : s.activatedAt,
            parentPhone: security.parentPhone !== undefined ? security.parentPhone : s.parentPhone,
            shareToken: security.shareToken || s.shareToken,
          };
        }
        return s;
      });
      try {
        localStorage.setItem(STORAGE_PREFIX + 'students', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    void handleDbMutation(
      supabase
        .from('Student')
        .update({
          customPin: security.customPin,
          isActivated: security.isActivated,
          parentPhone: security.parentPhone,
          shareToken: security.shareToken,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', studentId),
      undefined,
      'Không thể cập nhật bảo mật học sinh'
    );
  };

  const resetStudentPin = (studentId: string) => {
    setAllStudents((prev) => {
      const updated = prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            customPin: undefined,
            isActivated: false,
            activatedAt: undefined,
          };
        }
        return s;
      });
      try {
        localStorage.setItem(STORAGE_PREFIX + 'students', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    void handleDbMutation(
      supabase
        .from('Student')
        .update({
          customPin: null,
          isActivated: false,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', studentId),
      undefined,
      'Không thể xóa mã PIN học sinh'
    );
  };

  const regenerateStudentToken = (studentId: string): string => {
    const newToken = `s-${crypto.randomUUID().replaceAll('-', '')}`;
    setAllStudents((prev) => {
      const updated = prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            shareToken: newToken,
          };
        }
        return s;
      });
      try {
        localStorage.setItem(STORAGE_PREFIX + 'students', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    void handleDbMutation(
      supabase
        .from('Student')
        .update({
          shareToken: newToken,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', studentId),
      undefined,
      'Không thể cập nhật mã chia sẻ học sinh'
    );

    return newToken;
  };

  // ASSESSMENT ACTIONS
  const updateSubjectAssessment = (
    studentId: string,
    subjectCode: string,
    term: TermType,
    level: SubjectLevel,
    score?: number,
    comment?: string
  ) => {
    const recordId = `sa-${studentId}-${subjectCode}-${term}`;
    setSubjectAssessments((prev) => {
      const idx = prev.findIndex(
        (a) => a.studentId === studentId && a.subjectCode === subjectCode && a.term === term
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          level,
          score: score !== undefined ? score : copy[idx].score,
          comment: comment !== undefined ? comment : copy[idx].comment,
          updatedAt: new Date().toISOString(),
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: recordId,
          studentId,
          subjectCode,
          term,
          level,
          score,
          comment: comment || '',
          updatedAt: new Date().toISOString(),
        },
      ];
    });

    // Live API Write to Supabase
    const previous = subjectAssessments;
    void handleDbMutation(
      supabase
        .from('SubjectAssessment')
        .upsert({
          id: recordId,
          studentId,
          subjectCode,
          term,
          level,
          score: score !== undefined ? score : null,
          comment: comment || '',
          updatedAt: new Date().toISOString(),
        }),
      () => setSubjectAssessments(previous),
      'Không thể lưu đánh giá môn học'
    );
  };

  const batchSetSubjectLevel = (subjectCode: string, level: SubjectLevel) => {
    students.forEach((st) => {
      updateSubjectAssessment(st.id, subjectCode, currentTerm, level);
    });
  };

  const batchUpdateSubjectAssessments = (
    updates: {
      studentId: string;
      subjectCode: string;
      term: TermType;
      level: SubjectLevel;
      score?: number;
      comment?: string;
    }[]
  ) => {
    if (!updates || updates.length === 0) return;

    const nowIso = new Date().toISOString();
    const dbRows: any[] = [];

    setSubjectAssessments((prev) => {
      const copy = [...prev];
      updates.forEach((u) => {
        const recordId = `sa-${u.studentId}-${u.subjectCode}-${u.term}`;
        const idx = copy.findIndex(
          (a) => a.studentId === u.studentId && a.subjectCode === u.subjectCode && a.term === u.term
        );
        const updatedRow: SubjectAssessment = {
          id: recordId,
          studentId: u.studentId,
          subjectCode: u.subjectCode,
          term: u.term,
          level: u.level,
          score: u.score !== undefined ? u.score : (idx >= 0 ? copy[idx].score : undefined),
          comment: u.comment !== undefined ? u.comment : (idx >= 0 ? copy[idx].comment : ''),
          updatedAt: nowIso,
        };

        if (idx >= 0) {
          copy[idx] = updatedRow;
        } else {
          copy.push(updatedRow);
        }

        dbRows.push({
          id: recordId,
          studentId: u.studentId,
          subjectCode: u.subjectCode,
          term: u.term,
          level: u.level,
          score: updatedRow.score !== undefined ? updatedRow.score : null,
          comment: updatedRow.comment || '',
          updatedAt: nowIso,
        });
      });
      return copy;
    });

    if (dbRows.length > 0) {
      void handleDbMutation(
        supabase.from('SubjectAssessment').upsert(dbRows),
        undefined,
        'Không thể lưu danh sách đánh giá môn học'
      );
    }
  };

  const updateTraitAssessment = (
    studentId: string,
    traitCode: string,
    category: 'PHAM_CHAT' | 'NL_CHUNG' | 'NL_DAC_THU',
    term: TermType,
    level: TraitLevel,
    comment?: string
  ) => {
    const recordId = `ta-${studentId}-${traitCode}-${term}`;
    setTraitAssessments((prev) => {
      const idx = prev.findIndex(
        (a) => a.studentId === studentId && a.traitCode === traitCode && a.term === term
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          level,
          comment: comment !== undefined ? comment : copy[idx].comment,
          updatedAt: new Date().toISOString(),
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: recordId,
          studentId,
          traitCode,
          category,
          term,
          level,
          comment: comment || '',
          updatedAt: new Date().toISOString(),
        },
      ];
    });

    // Live API Write to Supabase
    const previous = traitAssessments;
    void handleDbMutation(
      supabase
        .from('TraitAssessment')
        .upsert({
          id: recordId,
          studentId,
          traitCode,
          category,
          term,
          level,
          comment: comment || '',
          updatedAt: new Date().toISOString(),
        }),
      () => setTraitAssessments(previous),
      'Không thể lưu đánh giá phẩm chất/năng lực'
    );
  };

  const batchSetTraitLevel = (traitCode: string, level: TraitLevel) => {
    const traitDef = TRAIT_DEFINITIONS.find((t) => t.code === traitCode);
    if (!traitDef) return;
    students.forEach((st) => {
      updateTraitAssessment(st.id, traitCode, traitDef.category, currentTerm, level);
    });
  };

  const updateTermSummary = (
    studentId: string,
    term: TermType,
    partial: Partial<StudentTermSummary>
  ) => {
    const recordId = `ts-${studentId}-${term}`;
    setTermSummaries((prev) => {
      const idx = prev.findIndex((s) => s.studentId === studentId && s.term === term);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...partial };
        return copy;
      }
      return [
        ...prev,
        {
          studentId,
          term,
          overallLearningLevel: partial.overallLearningLevel || 'H',
          overallTraitsLevel: partial.overallTraitsLevel || 'Đ',
          awardTitle: partial.awardTitle || 'Hoàn thành chương trình lớp học',
          teacherComment: partial.teacherComment || '',
          ...partial,
        },
      ];
    });

    // Live API Write to Supabase with safe merge
    const existing = termSummaries.find((s) => s.studentId === studentId && s.term === term);
    const previous = termSummaries;
    void handleDbMutation(
      supabase
        .from('TermSummary')
        .upsert({
          id: recordId,
          studentId,
          term,
          overallLearningLevel: partial.overallLearningLevel ?? existing?.overallLearningLevel ?? 'H',
          overallTraitsLevel: partial.overallTraitsLevel ?? existing?.overallTraitsLevel ?? 'Đ',
          awardTitle: partial.awardTitle ?? existing?.awardTitle ?? 'Hoàn thành chương trình lớp học',
          awardDetail: partial.awardDetail ?? existing?.awardDetail ?? null,
          teacherComment: partial.teacherComment ?? existing?.teacherComment ?? '',
          promotedToNextGrade: partial.promotedToNextGrade ?? existing?.promotedToNextGrade ?? true,
          summerRemediation: partial.summerRemediation ?? existing?.summerRemediation ?? false,
          updatedAt: new Date().toISOString(),
        }),
      () => setTermSummaries(previous),
      'Không thể lưu tổng kết kỳ học sinh'
    );
  };

  const recalculateAllAwards = (term: TermType) => {
    students.forEach((st) => {
      const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === term);
      const tAss = traitAssessments.filter((a) => a.studentId === st.id && a.term === term);
      const evalResult = evaluateStudentTT27(sAss, tAss, term);
      updateTermSummary(st.id, term, {
        overallLearningLevel: evalResult.overallLearningLevel,
        overallTraitsLevel: evalResult.overallTraitsLevel,
        awardTitle: evalResult.awardTitle,
        promotedToNextGrade: evalResult.promotedToNextGrade,
        summerRemediation: evalResult.summerRemediation,
      });
    });
  };

  // ATTENDANCE ACTIONS
  const updateAttendance = (
    studentId: string,
    date: string,
    status: AttendanceStatus,
    hasBoardingMeal: boolean,
    reason?: string
  ) => {
    const recordId = `att-${studentId}-${date}`;
    const previousRecord = attendances.find((item) => item.studentId === studentId && item.date === date);
    const optimisticRecord: DailyAttendance = {
      id: previousRecord?.id || recordId,
      studentId,
      date,
      status,
      hasBoardingMeal,
      reason,
    };
    setAttendances((prev) => mergeAttendanceByDay(prev, optimisticRecord));

    // Live API Write to Supabase
    void handleDbMutation(
      supabase
        .from('DailyAttendance')
        .upsert({
          id: previousRecord?.id || recordId,
          studentId,
          date,
          status,
          hasBoardingMeal,
          reason: reason || '',
        }, { onConflict: 'studentId,date' }),
      () => setAttendances((current) => {
        const latest = current.find((item) => item.studentId === studentId && item.date === date);
        const stillOptimistic = latest
          && latest.status === optimisticRecord.status
          && latest.hasBoardingMeal === optimisticRecord.hasBoardingMeal
          && (latest.reason || '') === (optimisticRecord.reason || '');
        if (!stillOptimistic) return current;
        if (previousRecord) return mergeAttendanceByDay(current, previousRecord);
        return current.filter((item) => !isSameAttendanceDay(item, optimisticRecord));
      }),
      'Không thể lưu điểm danh'
    );
  };

  const batchSetAttendance = (date: string, status: AttendanceStatus) => {
    const studentIds = new Set(students.map((student) => student.id));
    const previousRecords = attendances.filter(
      (record) => record.date === date && studentIds.has(record.studentId)
    );
    const previousByStudent = new Map(previousRecords.map((record) => [record.studentId, record]));
    const optimisticRecords: DailyAttendance[] = students.map((student) => ({
      id: previousByStudent.get(student.id)?.id || `att-${student.id}-${date}`,
      studentId: student.id,
      date,
      status,
      hasBoardingMeal: student.isBoarding && status === 'CO_MAT',
      reason: '',
    }));

    setAttendances((current) => optimisticRecords.reduce(
      (next, record) => mergeAttendanceByDay(next, record),
      current
    ));

    void handleDbMutation(
      supabase.from('DailyAttendance').upsert(optimisticRecords, { onConflict: 'studentId,date' }),
      () => setAttendances((current) => {
        const withoutBatch = current.filter(
          (record) => record.date !== date || !studentIds.has(record.studentId)
        );
        return [...withoutBatch, ...previousRecords];
      }),
      'Không thể lưu điểm danh cả lớp'
    );
  };

  // STAR REWARDS & DAILY BEHAVIOR ASSESSMENTS
  const addStarLog = (
    studentId: string,
    points: number,
    category: string,
    reason: string,
    comment?: string,
    date?: string
  ) => {
    const newLog: StarLog = {
      id: `star-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: activeClassId,
      studentId,
      points,
      category,
      reason,
      comment: comment?.trim() || undefined,
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    setStarLogs((prev) => [newLog, ...prev]);

    // Live API Write to Supabase
    const previous = starLogs;
    void handleDbMutation(
      supabase
        .from('StarLog')
        .insert({
          id: newLog.id,
          classId: newLog.classId,
          studentId: newLog.studentId,
          points: newLog.points,
          category: newLog.category,
          reason: newLog.reason,
          comment: newLog.comment || '',
          date: newLog.date,
          createdAt: newLog.createdAt,
        }),
      () => setStarLogs(previous),
      'Không thể lưu điểm sao khen thưởng'
    );
  };

  const deleteStarLog = (logId: string) => {
    const previous = starLogs;
    setStarLogs((prev) => prev.filter((s) => s.id !== logId));
    void handleDbMutation(
      supabase.from('StarLog').delete().eq('id', logId),
      () => setStarLogs(previous),
      'Không thể xóa điểm sao'
    );
  };

  const getStudentStars = (studentId: string) => {
    return starLogs
      .filter((s) => s.studentId === studentId)
      .reduce((sum, s) => sum + s.points, 0);
  };

  // STAR CRITERIA ACTIONS
  const addStarCriterion = (criterionData: Omit<StarCriterion, 'id'>) => {
    const newCriterion: StarCriterion = {
      ...criterionData,
      id: `sc-${Date.now()}`,
      classId: criterionData.classId || activeClassId,
    };
    const previous = starCriteria;
    setStarCriteria((prev) => [...prev, newCriterion]);
    void handleDbMutation(
      supabase.from('StarCriterion').upsert(newCriterion),
      () => setStarCriteria(previous),
      'Không thể thêm tiêu chí sao'
    );
    toast.success('Đã thêm tiêu chí đánh giá mới!');
  };

  const updateStarCriterion = (updated: StarCriterion) => {
    const previous = starCriteria;
    setStarCriteria((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    void handleDbMutation(
      supabase.from('StarCriterion').upsert(updated),
      () => setStarCriteria(previous),
      'Không thể cập nhật tiêu chí sao'
    );
    toast.success('Đã cập nhật tiêu chí!');
  };

  const deleteStarCriterion = (id: string) => {
    const previous = starCriteria;
    setStarCriteria((prev) => prev.filter((c) => c.id !== id));
    void handleDbMutation(
      supabase.from('StarCriterion').delete().eq('id', id),
      () => setStarCriteria(previous),
      'Không thể xóa tiêu chí sao'
    );
    toast.success('Đã xóa tiêu chí!');
  };

  const resetStarCriteriaToDefault = () => {
    const previous = starCriteria;
    setStarCriteria(INITIAL_STAR_CRITERIA);
    void handleDbMutation(
      supabase.from('StarCriterion').upsert(INITIAL_STAR_CRITERIA),
      () => setStarCriteria(previous),
      'Không thể khôi phục tiêu chí sao mặc định'
    );
    toast.success('Đã khôi phục danh mục tiêu chí chuẩn Thông tư 27!');
  };

  // REWARD PRODUCTS & INVENTORY ACTIONS
  const addRewardProduct = (productData: Omit<RewardProduct, 'id' | 'createdAt'>) => {
    const newProduct: RewardProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      classId: productData.classId || activeClassId,
      createdAt: new Date().toISOString(),
    };
    const previous = rewardProducts;
    setRewardProducts((prev) => [newProduct, ...prev]);
    void handleDbMutation(
      supabase.from('RewardProduct').upsert(newProduct),
      () => setRewardProducts(previous),
      'Không thể thêm sản phẩm'
    );
    toast.success('Đã thêm sản phẩm mới vào Shop Quà!');
  };

  const updateRewardProduct = (updated: RewardProduct) => {
    const previous = rewardProducts;
    setRewardProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    void handleDbMutation(
      supabase.from('RewardProduct').upsert(updated),
      () => setRewardProducts(previous),
      'Không thể cập nhật sản phẩm'
    );
    toast.success('Đã cập nhật thông tin sản phẩm!');
  };

  const deleteRewardProduct = (id: string) => {
    const previous = rewardProducts;
    setRewardProducts((prev) => prev.filter((p) => p.id !== id));
    void handleDbMutation(
      supabase.from('RewardProduct').delete().eq('id', id),
      () => setRewardProducts(previous),
      'Không thể xóa sản phẩm'
    );
    toast.success('Đã xóa sản phẩm khỏi Shop!');
  };

  const restockRewardProduct = (id: string, additionalStock: number) => {
    const target = rewardProducts.find((p) => p.id === id);
    const newStock = target ? Math.max(0, target.stock + additionalStock) : additionalStock;
    const isAvailable = newStock > 0;
    const previous = rewardProducts;

    setRewardProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: newStock, isAvailable } : p))
    );

    void handleDbMutation(
      supabase.from('RewardProduct').update({ stock: newStock, isAvailable }).eq('id', id),
      () => setRewardProducts(previous),
      'Không thể cập nhật tồn kho sản phẩm'
    );
    toast.success(`Đã cập nhật số lượng tồn kho (+${additionalStock})!`);
  };

  // REWARD REDEMPTIONS & CART ACTIONS
  const getStudentMonthlyStars = (studentId: string, monthStr?: string) => {
    const targetMonth = monthStr || new Date().toISOString().substring(0, 7); // e.g. '2026-08'
    
    // Earned stars in target month
    const earned = starLogs
      .filter((l) => l.studentId === studentId && (l.date || l.createdAt.split('T')[0]).startsWith(targetMonth))
      .reduce((sum, l) => sum + l.points, 0);

    // Spent stars in target month (from non-cancelled redemptions)
    const spent = rewardRedemptions
      .filter((r) => r.studentId === studentId && r.month === targetMonth && r.status !== 'CANCELLED')
      .reduce((sum, r) => sum + r.totalStars, 0);

    const available = Math.max(0, earned - spent);

    return { earned, spent, available };
  };

  const createRewardRedemption = async (data: {
    studentId: string;
    studentShareToken: string;
    studentName: string;
    studentCode: string;
    studentAvatar?: string;
    items: RedemptionItem[];
    totalStars: number;
    studentNote?: string;
    month?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const currentMonth = data.month || new Date().toISOString().substring(0, 7);
    const targetStudent = allStudents.find(
      (s) =>
        s.id === data.studentId &&
        s.shareToken?.toLowerCase() === data.studentShareToken.toLowerCase()
    );
    if (!targetStudent?.classId) {
      return { success: false, error: 'Liên kết học sinh không hợp lệ hoặc đã hết hạn.' };
    }

    type RedeemRewardRpcResult = {
      success: boolean;
      error?: string;
      redemption_id?: string;
      total_stars?: number;
      month?: string;
      requested_at?: string;
    };

    // 1. Call atomic PostgreSQL RPC in Supabase (locks rows, validates server balance, decrements stock)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('redeem_reward_tx', {
        p_student_share_token: data.studentShareToken,
        p_items: data.items,
        p_student_note: data.studentNote?.trim() || null,
      });
      const rpcRes = rpcData as RedeemRewardRpcResult | null;

      if (rpcErr || !rpcRes?.success || !rpcRes.redemption_id) {
        const errorMsg = rpcRes?.error || rpcErr?.message || 'Không thể thực hiện đổi quà';
        return { success: false, error: errorMsg };
      }

      const calculatedTotalStars = rpcRes?.total_stars ?? data.totalStars;

      const newRedemption: RewardRedemption = {
        id: rpcRes.redemption_id,
        classId: targetStudent.classId,
        studentId: data.studentId,
        studentName: data.studentName,
        studentCode: data.studentCode,
        studentAvatar: data.studentAvatar,
        items: data.items,
        totalStars: calculatedTotalStars,
        month: rpcRes.month || currentMonth,
        status: 'PENDING',
        studentNote: data.studentNote?.trim() || undefined,
        requestedAt: rpcRes.requested_at || new Date().toISOString(),
      };

      // 2. Sync React local state
      setRewardProducts((prev) =>
        prev.map((p) => {
          const matchingItem = data.items.find((item) => item.productId === p.id);
          if (matchingItem) {
            const remainingStock = Math.max(0, p.stock - matchingItem.quantity);
            return { ...p, stock: remainingStock, isAvailable: remainingStock > 0 };
          }
          return p;
        })
      );

      setRewardRedemptions((prev) => [newRedemption, ...prev]);

      return { success: true };
    } catch (err: unknown) {
      console.error('Lỗi giao dịch đổi quà:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi kết nối máy chủ',
      };
    }
  };

  const fulfillRewardRedemption = async (redemptionId: string) => {
    const { data: rpcData, error } = await supabase.rpc('fulfill_reward_redemption_tx', {
      p_redemption_id: redemptionId,
    });
    const result = rpcData as { success?: boolean; error?: string; delivered_at?: string } | null;
    if (error || !result?.success) {
      toast.error(result?.error || error?.message || 'Không thể cập nhật trạng thái trao thưởng');
      return;
    }

    const deliveredAt = result.delivered_at || new Date().toISOString();
    setRewardRedemptions((prev) =>
      prev.map((r) => (r.id === redemptionId ? { ...r, status: 'DELIVERED', deliveredAt } : r))
    );
    toast.success('Đã xác nhận trao quà cho học sinh thành công! 🎉');
  };

  const cancelRewardRedemption = async (redemptionId: string) => {
    const target = rewardRedemptions.find((r) => r.id === redemptionId);
    if (!target) return;

    try {
      // 1. Call atomic PostgreSQL RPC in Supabase (locks redemption, restores stock, sets CANCELLED)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('cancel_reward_redemption_tx', {
        p_redemption_id: redemptionId,
      });
      const rpcRes = rpcData as { success?: boolean; error?: string } | null;

      if (rpcErr || (rpcRes && !rpcRes.success)) {
        toast.error(rpcRes?.error || rpcErr?.message || 'Không thể hủy đơn đổi quà');
        return;
      }

      // 2. Restore inventory stock in React state
      if (target.status === 'PENDING') {
        setRewardProducts((prev) =>
          prev.map((p) => {
            const matched = target.items.find((item) => item.productId === p.id);
            if (matched) {
              const restoredStock = p.stock + matched.quantity;
              return { ...p, stock: restoredStock, isAvailable: true };
            }
            return p;
          })
        );
      }

      setRewardRedemptions((prev) =>
        prev.map((r) => (r.id === redemptionId ? { ...r, status: 'CANCELLED' } : r))
      );

      toast.info('Đã hủy đơn đổi quà và hoàn lại sao/tồn kho!');
    } catch (err: unknown) {
      console.error('Lỗi khi hủy đơn đổi quà:', err);
      toast.error('Không thể hủy đơn đổi quà');
    }
  };

  // CHỐT SỐ DƯ THÁNG (RESET REMAINING STARS)
  // BẢO TỒN NGUYÊN VẸN 100% LỊCH SỬ STARLOG ĐỂ PHỤC VỤ ĐÁNH GIÁ THÔNG TƯ 27 VÀ BÁO CÁO TOÀN NĂM
  const resetMonthStars = async (monthStr?: string) => {
    const targetMonth = monthStr || new Date().toISOString().substring(0, 7);
    const targetStudents = allStudents.filter((s) => s.classId === activeClassId);

    if (targetStudents.length === 0) {
      toast.warning('Không có học sinh nào trong lớp hiện tại để chốt số dư.');
      return;
    }

    if (
      confirm(
        `Bạn có chắc chắn muốn CHỐT SỐ DƯ khả dụng Tháng ${targetMonth.replace('-', '/')} của lớp về 0 để mở đợt mới?\n\n⭐ Lưu ý: Toàn bộ Lịch sử điểm sao (StarLog) và thành tích thi đua vẫn được BẢO TỒN NGUYÊN VẸN 100% để phục vụ đánh giá rèn luyện Thông tư 27 và thống kê tổng kết.`
      )
    ) {
      // Find students with remaining available stars in this month
      const studentsToClose: Array<{ student: typeof targetStudents[0]; available: number }> = [];

      for (const st of targetStudents) {
        const bal = getStudentMonthlyStars(st.id, targetMonth);
        if (bal.available > 0) {
          studentsToClose.push({ student: st, available: bal.available });
        }
      }

      if (studentsToClose.length === 0) {
        toast.info(`Tất cả học sinh lớp trong tháng ${targetMonth.replace('-', '/')} đã có số dư sao khả dụng là 0!`);
        return;
      }

      const { data: rpcData, error } = await supabase.rpc('close_month_star_balance_tx', {
        p_class_id: activeClassId,
        p_month: targetMonth,
      });
      const result = rpcData as {
        success?: boolean;
        error?: string;
        redemptions?: RewardRedemption[];
      } | null;

      if (error || !result?.success) {
        toast.error('Không thể chốt số dư tháng: ' + (result?.error || error?.message || 'Lỗi máy chủ'));
        return;
      }

      const closeRedemptions = result.redemptions || [];
      setRewardRedemptions((prev) => [...closeRedemptions, ...prev]);

      toast.success(
        `Đã chốt số dư tháng ${targetMonth.replace('-', '/')} cho ${closeRedemptions.length} học sinh thành công! Lịch sử điểm sao được giữ nguyên.`
      );
    }
  };

  // BACKUP & RESTORE
  const exportAllDataJSON = (): string => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      schoolClasses,
      activeClassId,
      students: allStudents,
      subjectAssessments,
      traitAssessments,
      termSummaries,
      attendances,
      starLogs,
      starCriteria,
      rewardProducts,
      rewardRedemptions,
      timetable: allTimetables,
      customSubjects,
      homeworks: allHomeworks,
      currentTerm,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importAllDataJSON = async (
    jsonStr: string
  ): Promise<{ success: boolean; error?: string; failedTables?: string[] }> => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'File sao lưu không hợp lệ' };
      }

      const errors: string[] = [];

      if (Array.isArray(data.schoolClasses)) {
        setSchoolClasses(data.schoolClasses);
        const { error } = await supabase.from('Class').upsert(data.schoolClasses);
        if (error) errors.push(`Lớp học: ${error.message}`);
      }
      if (typeof data.activeClassId === 'string') setActiveClassId(data.activeClassId);
      if (Array.isArray(data.students)) {
        setAllStudents(data.students);
        const dbRows = data.students.map((st: any) => ({
          id: st.id,
          classId: st.classId,
          studentCode: st.studentCode,
          fullName: st.fullName,
          gender: st.gender,
          dateOfBirth: st.dateOfBirth,
          birthPlace: st.birthPlace,
          ethnicity: st.ethnicity,
          address: st.address,
          parentName: st.parentName,
          parentPhone: st.parentPhone,
          isBoarding: st.isBoarding,
          seatRow: st.seatRow,
          seatCol: st.seatCol,
          healthNotes: st.healthNotes,
          tags: JSON.stringify(st.tags || []),
          shareToken: st.shareToken,
          avatarUrl: st.avatarUrl,
          customPin: st.customPin,
          isActivated: st.isActivated,
          createdAt: st.createdAt,
          updatedAt: new Date().toISOString(),
        }));
        const { error } = await supabase.from('Student').upsert(dbRows);
        if (error) errors.push(`Học sinh: ${error.message}`);
      }
      if (Array.isArray(data.subjectAssessments)) {
        setSubjectAssessments(data.subjectAssessments);
        const { error } = await supabase.from('SubjectAssessment').upsert(data.subjectAssessments);
        if (error) errors.push(`Đánh giá môn học: ${error.message}`);
      }
      if (Array.isArray(data.traitAssessments)) {
        setTraitAssessments(data.traitAssessments);
        const { error } = await supabase.from('TraitAssessment').upsert(data.traitAssessments);
        if (error) errors.push(`Đánh giá phẩm chất: ${error.message}`);
      }
      if (Array.isArray(data.termSummaries)) {
        setTermSummaries(data.termSummaries);
        const { error } = await supabase.from('TermSummary').upsert(data.termSummaries);
        if (error) errors.push(`Tổng kết kỳ: ${error.message}`);
      }
      if (Array.isArray(data.attendances)) {
        setAttendances(data.attendances);
        const { error } = await supabase
          .from('DailyAttendance')
          .upsert(data.attendances, { onConflict: 'studentId,date' });
        if (error) errors.push(`Điểm danh: ${error.message}`);
      }
      if (Array.isArray(data.starLogs)) {
        setStarLogs(data.starLogs);
        const { error } = await supabase.from('StarLog').upsert(data.starLogs);
        if (error) errors.push(`Nhật ký sao: ${error.message}`);
      }
      if (Array.isArray(data.starCriteria)) {
        setStarCriteria(data.starCriteria);
        const { error } = await supabase.from('StarCriterion').upsert(data.starCriteria);
        if (error) errors.push(`Tiêu chí sao: ${error.message}`);
      }
      if (Array.isArray(data.rewardProducts)) {
        setRewardProducts(data.rewardProducts);
        const { error } = await supabase.from('RewardProduct').upsert(data.rewardProducts);
        if (error) errors.push(`Phần thưởng: ${error.message}`);
      }
      if (Array.isArray(data.rewardRedemptions)) {
        setRewardRedemptions(data.rewardRedemptions);
        const { error } = await supabase.from('RewardRedemption').upsert(data.rewardRedemptions);
        if (error) errors.push(`Đổi thưởng: ${error.message}`);
      }
      if (Array.isArray(data.timetable)) {
        setAllTimetables(data.timetable);
        const { error } = await supabase.from('TimetableSlot').upsert(data.timetable);
        if (error) errors.push(`Thời khóa biểu: ${error.message}`);
      }
      if (Array.isArray(data.customSubjects)) {
        setCustomSubjects(data.customSubjects);
        const { error } = await supabase.from('CustomSubject').upsert(data.customSubjects);
        if (error) errors.push(`Môn học tự chọn: ${error.message}`);
      }
      if (Array.isArray(data.homeworks)) {
        setAllHomeworks(data.homeworks);
        const { error } = await supabase.from('HomeworkAssignment').upsert(data.homeworks);
        if (error) errors.push(`Bài tập: ${error.message}`);
      }
      if (data.currentTerm) setCurrentTerm(data.currentTerm);

      if (errors.length > 0) {
        toast.error(`Đã nhập dữ liệu nhưng gặp lỗi ở: ${errors.join(', ')}`);
        return { success: false, error: errors.join('; '), failedTables: errors };
      }

      toast.success('Đã nhập và đồng bộ toàn bộ dữ liệu lên máy chủ thành công!');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Lỗi khi giải mã file JSON' };
    }
  };

  const resetData = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(STORAGE_PREFIX) || key.startsWith('gvcn_'))) {
          if (!key.includes('auth-token') && !key.includes('gdrive') && !key.includes('google') && !key.includes('mock_email')) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}

    setActiveClassId('');
    setCurrentTerm(getCurrentTermByDate());
    setTimetableScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
    window.location.reload();
  };

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    setAiConfigState((prev) => {
      const updated = { ...prev, apiKey: key };
      try {
        localStorage.setItem(STORAGE_PREFIX + 'apiKey', key);
        localStorage.setItem(STORAGE_PREFIX + 'aiConfig', JSON.stringify(updated));
      } catch (e) {}

      // Live API Write to Supabase
      void handleDbMutation(
        supabase
          .from('SchoolInfo')
          .update({
            aiConfig: updated,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', 'default'),
        undefined,
        'Không thể cập nhật cấu hình AI'
      );

      return updated;
    });
  };

  const setAiConfig = (config: AIConfig) => {
    setAiConfigState(config);
    setApiKeyState(config.apiKey);
    try {
      localStorage.setItem(STORAGE_PREFIX + 'aiConfig', JSON.stringify(config));
      localStorage.setItem(STORAGE_PREFIX + 'apiKey', config.apiKey);
    } catch (e) {}

    // Live API Write to Supabase
    void handleDbMutation(
      supabase
        .from('SchoolInfo')
        .update({
          aiConfig: config,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', 'default'),
      undefined,
      'Không thể lưu cấu hình AI'
    );
  };

  const setAiGenSettings = (settings: AIGenerationSettings) => {
    setAiGenSettingsState(settings);
    try {
      localStorage.setItem(STORAGE_PREFIX + 'aiGenSettings', JSON.stringify(settings));
    } catch (e) {}

    // Live API Write to Supabase
    void handleDbMutation(
      supabase
        .from('SchoolInfo')
        .update({
          aiGenSettings: settings,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', 'default'),
      undefined,
      'Không thể lưu tùy chọn sinh AI'
    );
  };

  const addClassEvent = (event: Omit<ClassEvent, 'id'>) => {
    const newEv: ClassEvent = {
      ...event,
      id: 'ev-' + Date.now(),
      classId: activeClassId,
    };
    setAllClassEvents((prev) => {
      const updated = [newEv, ...prev];
      try {
        localStorage.setItem(STORAGE_PREFIX + 'classEvents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    void handleDbMutation(
      supabase
        .from('ClassEvent')
        .upsert({
          id: newEv.id,
          classId: newEv.classId,
          title: newEv.title,
          eventType: newEv.type || 'OTHER',
          date: newEv.date,
          time: newEv.time,
          location: newEv.location,
          description: newEv.description,
          isImportant: newEv.isImportant,
          createdAt: new Date().toISOString(),
        }),
      undefined,
      'Không thể thêm sự kiện lớp'
    );
  };

  const updateClassEvent = (event: ClassEvent) => {
    setAllClassEvents((prev) => {
      const updated = prev.map((e) => (e.id === event.id ? event : e));
      try {
        localStorage.setItem(STORAGE_PREFIX + 'classEvents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    void handleDbMutation(
      supabase
        .from('ClassEvent')
        .upsert({
          id: event.id,
          classId: event.classId,
          title: event.title,
          eventType: event.type || 'OTHER',
          date: event.date,
          time: event.time,
          location: event.location,
          description: event.description,
          isImportant: event.isImportant,
        }),
      undefined,
      'Không thể cập nhật sự kiện lớp'
    );
  };

  const deleteClassEvent = (id: string) => {
    setAllClassEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(STORAGE_PREFIX + 'classEvents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    void handleDbMutation(
      supabase.from('ClassEvent').delete().eq('id', id),
      undefined,
      'Không thể xóa sự kiện lớp'
    );
  };

  const addFormativeNote = (note: Omit<FormativeNote, 'id' | 'createdAt'>) => {
    const newNote: FormativeNote = {
      ...note,
      id: `fn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setFormativeNotes((prev) => [newNote, ...prev]);
    toast.success('Đã lưu ghi chú tiến bộ thường xuyên!');
    void handleDbMutation(
      supabase.from('FormativeNote').upsert(newNote),
      undefined,
      'Không thể lưu ghi chú thường xuyên'
    );
  };

  const deleteFormativeNote = (id: string) => {
    setFormativeNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success('Đã xóa ghi chú');
    void handleDbMutation(
      supabase.from('FormativeNote').delete().eq('id', id),
      undefined,
      'Không thể xóa ghi chú thường xuyên'
    );
  };

  // PHASE 3: LEAVE REQUEST ACTIONS
  const createLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => {
    const newReq: LeaveRequest = {
      ...req,
      id: `lr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
    toast.success('Đã gửi đơn xin nghỉ phép đến Giáo viên chủ nhiệm!');
    void handleDbMutation(
      supabase.from('LeaveRequest').upsert(newReq),
      undefined,
      'Không thể gửi đơn xin nghỉ phép'
    );
  };

  const approveLeaveRequest = (id: string, teacherNote?: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;

    const note = teacherNote || req.teacherNote || 'Đã duyệt đơn xin nghỉ phép của học sinh.';
    const reviewedAt = new Date().toISOString();

    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'APPROVED',
              teacherNote: note,
              reviewedAt,
            }
          : r
      )
    );

    // AUTO-SYNC ATTENDANCE: mỗi ngày trong đơn là một bản ghi riêng và học sinh nghỉ không tính suất ăn.
    getIsoDateRange(req.startDate, req.endDate).forEach((date) => {
      updateAttendance(
        req.studentId,
        date,
        'VANG_CO_PHEP',
        false,
        `Đơn xin nghỉ phép trực tuyến (${req.reasonDetail})`
      );
    });

    toast.success(`Đã duyệt đơn xin nghỉ của em ${req.studentName} và đồng bộ Sổ điểm danh!`);
    void handleDbMutation(
      supabase.from('LeaveRequest').update({ status: 'APPROVED', teacherNote: note, reviewedAt }).eq('id', id),
      undefined,
      'Không thể duyệt đơn xin nghỉ phép'
    );
  };

  const rejectLeaveRequest = (id: string, teacherNote?: string) => {
    const note = teacherNote || 'Giáo viên chưa thể duyệt đơn này';
    const reviewedAt = new Date().toISOString();

    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'REJECTED',
              teacherNote: note,
              reviewedAt,
            }
          : r
      )
    );
    toast.info('Đã từ chối đơn xin nghỉ phép');
    void handleDbMutation(
      supabase.from('LeaveRequest').update({ status: 'REJECTED', teacherNote: note, reviewedAt }).eq('id', id),
      undefined,
      'Không thể từ chối đơn xin nghỉ phép'
    );
  };

  // PHASE 3: CLASSROOM MOMENTS ACTIONS
  const addClassMoment = (moment: Omit<ClassMoment, 'id' | 'likesCount' | 'createdAt'>) => {
    const newMoment: ClassMoment = {
      ...moment,
      id: `mom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      likesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
    };
    setClassMoments((prev) => [newMoment, ...prev]);
    toast.success('Đã đăng bài viết khoảnh khắc lớp học thành công!');
    void handleDbMutation(
      supabase.from('ClassMoment').upsert(newMoment),
      undefined,
      'Không thể đăng bài viết khoảnh khắc lớp'
    );
  };

  const likeClassMoment = (id: string, userToken: string) => {
    setClassMoments((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const alreadyLiked = m.likedBy?.includes(userToken);
        const updated = alreadyLiked
          ? {
              ...m,
              likesCount: Math.max(0, m.likesCount - 1),
              likedBy: m.likedBy?.filter((t) => t !== userToken),
            }
          : {
              ...m,
              likesCount: m.likesCount + 1,
              likedBy: [...(m.likedBy || []), userToken],
            };
        void handleDbMutation(
          supabase.from('ClassMoment').update({ likesCount: updated.likesCount, likedBy: updated.likedBy }).eq('id', id),
          undefined,
          'Không thể cập nhật lượt thích'
        );
        return updated;
      })
    );
  };

  const deleteClassMoment = (id: string) => {
    setClassMoments((prev) => prev.filter((m) => m.id !== id));
    toast.success('Đã xóa bài viết khoảnh khắc');
    void handleDbMutation(
      supabase.from('ClassMoment').delete().eq('id', id),
      undefined,
      'Không thể xóa bài viết khoảnh khắc'
    );
  };

  // PHASE 3: PARENT CONFERENCE 1-ON-1 ACTIONS
  const createConferenceSlot = (slot: Omit<ConferenceSlot, 'id' | 'isBooked' | 'createdAt'>) => {
    const newSlot: ConferenceSlot = {
      ...slot,
      id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isBooked: false,
      createdAt: new Date().toISOString(),
    };
    setConferenceSlots((prev) => [...prev, newSlot]);
    toast.success('Đã tạo khung giờ hẹn trao đổi phụ huynh!');
    void handleDbMutation(
      supabase.from('ConferenceSlot').upsert(newSlot),
      undefined,
      'Không thể lưu khung giờ hẹn'
    );
  };

  const createMultipleConferenceSlots = (slots: Omit<ConferenceSlot, 'id' | 'isBooked' | 'createdAt'>[]) => {
    if (!slots.length) return;
    const newSlots: ConferenceSlot[] = slots.map((slot, index) => ({
      ...slot,
      id: `conf-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
      isBooked: false,
      createdAt: new Date().toISOString(),
    }));
    setConferenceSlots((prev) => [...prev, ...newSlots]);
    toast.success(`Đã tạo hàng loạt ${newSlots.length} khung giờ hẹn thành công!`);
    void handleDbMutation(
      supabase.from('ConferenceSlot').upsert(newSlots),
      undefined,
      'Không thể lưu danh sách khung giờ hẹn'
    );
  };

  const bookConferenceSlot = (
    slotId: string,
    bookingData: {
      studentId: string;
      studentName: string;
      parentName: string;
      parentPhone: string;
      discussionTopics?: string;
    }
  ) => {
    const updatePayload = {
      isBooked: true,
      bookedStudentId: bookingData.studentId,
      bookedStudentName: bookingData.studentName,
      bookedParentName: bookingData.parentName,
      bookedParentPhone: bookingData.parentPhone,
      parentDiscussionTopics: bookingData.discussionTopics,
    };

    setConferenceSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              ...updatePayload,
            }
          : s
      )
    );
    toast.success('Đã đăng ký lịch hẹn trao đổi với Giáo viên chủ nhiệm thành công!');
    void handleDbMutation(
      supabase.from('ConferenceSlot').update(updatePayload).eq('id', slotId),
      undefined,
      'Không thể cập nhật đăng ký lịch hẹn'
    );
  };

  const cancelConferenceBooking = (slotId: string) => {
    const resetPayload = {
      isBooked: false,
      bookedStudentId: null,
      bookedStudentName: null,
      bookedParentName: null,
      bookedParentPhone: null,
      parentDiscussionTopics: null,
    };

    setConferenceSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              isBooked: false,
              bookedStudentId: undefined,
              bookedStudentName: undefined,
              bookedParentName: undefined,
              bookedParentPhone: undefined,
              parentDiscussionTopics: undefined,
            }
          : s
      )
    );
    toast.success('Đã hủy đặt lịch hẹn');
    void handleDbMutation(
      supabase.from('ConferenceSlot').update(resetPayload).eq('id', slotId),
      undefined,
      'Không thể hủy đăng ký lịch hẹn'
    );
  };

  const deleteConferenceSlot = (slotId: string) => {
    setConferenceSlots((prev) => prev.filter((s) => s.id !== slotId));
    toast.success('Đã xóa khung giờ hẹn');
    void handleDbMutation(
      supabase.from('ConferenceSlot').delete().eq('id', slotId),
      undefined,
      'Không thể xóa khung giờ hẹn'
    );
  };

  const quizSubmissions = useMemo(
    () => allQuizSubmissions.filter((s) => s.classId === activeClassId),
    [allQuizSubmissions, activeClassId]
  );

  const submitQuiz = (data: Omit<QuizSubmission, 'id' | 'submittedAt'>): QuizSubmission => {
    const newSubmission: QuizSubmission = {
      ...data,
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: new Date().toISOString(),
    };
    const previous = allQuizSubmissions;
    setAllQuizSubmissions((prev) => [
      newSubmission,
      ...prev.filter(
        (s) => !(s.homeworkId === newSubmission.homeworkId && s.studentId === newSubmission.studentId)
      ),
    ]);
    void supabase
      .from('QuizSubmission')
      .upsert(newSubmission, { onConflict: 'homeworkId,studentId' })
      .then(({ error }) => {
        if (error) {
          setAllQuizSubmissions(previous);
          console.error('Không thể lưu bài làm quiz:', error.message);
          toast.error('Không thể lưu bài làm lên máy chủ. Vui lòng thử lại.');
        }
      });
    return newSubmission;
  };

  const deleteQuizSubmission = (id: string) => {
    const previous = allQuizSubmissions;
    setAllQuizSubmissions((prev) => prev.filter((s) => s.id !== id));
    void supabase.from('QuizSubmission').delete().eq('id', id).then(({ error }) => {
      if (error) {
        setAllQuizSubmissions(previous);
        console.error('Không thể xóa bài làm quiz:', error.message);
        toast.error('Không thể xóa bài làm trên máy chủ.');
      }
    });
  };

  // Phase 7: IEP Plans Actions
  const iepPlans = useMemo(
    () => allIEPPlans.filter((p) => (p.classId || 'class-4a1') === activeClassId),
    [allIEPPlans, activeClassId]
  );

  const addIEPPlan = (data: Omit<IEPPlan, 'id' | 'createdAt'>): IEPPlan => {
    const newPlan: IEPPlan = {
      ...data,
      id: `iep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: data.classId || activeClassId,
      createdAt: new Date().toISOString(),
    };
    setAllIEPPlans((prev) => {
      const next = [newPlan, ...prev];
      try {
        localStorage.setItem(STORAGE_PREFIX + 'iepPlans', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('IEPPlan').insert(newPlan),
      undefined,
      'Không thể lưu kế hoạch IEP'
    );
    toast.success(`Đã tạo Kế hoạch Giáo dục Cá nhân cho em ${newPlan.studentName}!`);
    return newPlan;
  };

  const updateIEPPlan = (updated: IEPPlan) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    setAllIEPPlans((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? withTimestamp : p));
      try {
        localStorage.setItem(STORAGE_PREFIX + 'iepPlans', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('IEPPlan').update(withTimestamp).eq('id', updated.id),
      undefined,
      'Không thể cập nhật kế hoạch IEP'
    );
    toast.success(`Đã cập nhật Kế hoạch IEP của em ${updated.studentName}!`);
  };

  const deleteIEPPlan = (id: string) => {
    setAllIEPPlans((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_PREFIX + 'iepPlans', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('IEPPlan').delete().eq('id', id),
      undefined,
      'Không thể xóa kế hoạch IEP'
    );
    toast.success('Đã xóa hồ sơ Kế hoạch IEP!');
  };

  // Phase 8: Parent Meetings Actions
  const parentMeetings = useMemo(
    () => allParentMeetings.filter((p) => (p.classId || 'class-4a1') === activeClassId),
    [allParentMeetings, activeClassId]
  );

  const addParentMeetingDoc = (data: Omit<ParentMeetingDoc, 'id' | 'createdAt'>): ParentMeetingDoc => {
    const newDoc: ParentMeetingDoc = {
      ...data,
      id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: data.classId || activeClassId,
      createdAt: new Date().toISOString(),
    };
    setAllParentMeetings((prev) => {
      const next = [newDoc, ...prev];
      try { localStorage.setItem(STORAGE_PREFIX + 'parentMeetings', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('ParentMeeting').insert(newDoc),
      undefined,
      'Không thể lưu tài liệu họp phụ huynh'
    );
    toast.success(`Đã lưu biên bản cuộc họp phụ huynh!`);
    return newDoc;
  };

  const updateParentMeetingDoc = (updated: ParentMeetingDoc) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    setAllParentMeetings((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? withTimestamp : p));
      try { localStorage.setItem(STORAGE_PREFIX + 'parentMeetings', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('ParentMeeting').update(withTimestamp).eq('id', updated.id),
      undefined,
      'Không thể cập nhật tài liệu họp phụ huynh'
    );
    toast.success('Đã cập nhật biên bản cuộc họp phụ huynh!');
  };

  const deleteParentMeetingDoc = (id: string) => {
    setAllParentMeetings((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try { localStorage.setItem(STORAGE_PREFIX + 'parentMeetings', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('ParentMeeting').delete().eq('id', id),
      undefined,
      'Không thể xóa tài liệu họp phụ huynh'
    );
    toast.success('Đã xóa biên bản cuộc họp!');
  };

  // Phase 8: Health Records Actions
  const healthRecords = useMemo(
    () => allHealthRecords.filter((h) => (h.classId || 'class-4a1') === activeClassId),
    [allHealthRecords, activeClassId]
  );

  const addHealthRecord = (data: Omit<HealthRecord, 'id' | 'createdAt'>): HealthRecord => {
    const newRec: HealthRecord = {
      ...data,
      id: `hr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: data.classId || activeClassId,
      createdAt: new Date().toISOString(),
    };
    setAllHealthRecords((prev) => {
      const filtered = prev.filter((h) => !(h.studentId === newRec.studentId && h.classId === newRec.classId));
      const next = [newRec, ...filtered];
      try { localStorage.setItem(STORAGE_PREFIX + 'healthRecords', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('HealthRecord').upsert(newRec),
      undefined,
      'Không thể lưu hồ sơ sức khỏe'
    );
    toast.success(`Đã lưu hồ sơ sức khỏe em ${newRec.studentName}!`);
    return newRec;
  };

  const updateHealthRecord = (updated: HealthRecord) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    setAllHealthRecords((prev) => {
      const next = prev.map((h) => (h.id === updated.id ? withTimestamp : h));
      try { localStorage.setItem(STORAGE_PREFIX + 'healthRecords', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('HealthRecord').update(withTimestamp).eq('id', updated.id),
      undefined,
      'Không thể cập nhật hồ sơ sức khỏe'
    );
    toast.success(`Đã cập nhật hồ sơ sức khỏe em ${updated.studentName}!`);
  };

  const deleteHealthRecord = (id: string) => {
    setAllHealthRecords((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try { localStorage.setItem(STORAGE_PREFIX + 'healthRecords', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('HealthRecord').delete().eq('id', id),
      undefined,
      'Không thể xóa hồ sơ sức khỏe'
    );
    toast.success('Đã xóa hồ sơ sức khỏe!');
  };

  // Phase 8: Classroom Books Actions
  const classroomBooks = useMemo(
    () => allClassroomBooks.filter((b) => (b.classId || 'class-4a1') === activeClassId),
    [allClassroomBooks, activeClassId]
  );

  const addClassroomBook = (data: Omit<ClassroomBook, 'id'>): ClassroomBook => {
    const newBook: ClassroomBook = {
      ...data,
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: data.classId || activeClassId,
    };
    setAllClassroomBooks((prev) => {
      const next = [newBook, ...prev];
      try { localStorage.setItem(STORAGE_PREFIX + 'classroomBooks', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('ClassroomBook').insert(newBook),
      undefined,
      'Không thể lưu sách thư viện'
    );
    toast.success(`Đã thêm sách "${newBook.title}" vào tủ sách lớp!`);
    return newBook;
  };

  const updateClassroomBook = (updated: ClassroomBook) => {
    setAllClassroomBooks((prev) => {
      const next = prev.map((b) => (b.id === updated.id ? updated : b));
      try { localStorage.setItem(STORAGE_PREFIX + 'classroomBooks', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('ClassroomBook').update(updated).eq('id', updated.id),
      undefined,
      'Không thể cập nhật thông tin sách'
    );
    toast.success('Đã cập nhật thông tin sách!');
  };

  const deleteClassroomBook = (id: string) => {
    setAllClassroomBooks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      try { localStorage.setItem(STORAGE_PREFIX + 'classroomBooks', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('ClassroomBook').delete().eq('id', id),
      undefined,
      'Không thể xóa sách khỏi thư viện'
    );
    toast.success('Đã xóa sách khỏi tủ sách!');
  };

  // Book Borrow Logs Actions
  const bookBorrowLogs = useMemo(
    () => allBookBorrowLogs.filter((l) => (l.classId || 'class-4a1') === activeClassId),
    [allBookBorrowLogs, activeClassId]
  );

  const borrowBook = (data: Omit<BookBorrowLog, 'id' | 'status'>): BookBorrowLog => {
    const newLog: BookBorrowLog = {
      ...data,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: data.classId || activeClassId,
      status: 'BORROWED',
    };
    setAllBookBorrowLogs((prev) => {
      const next = [newLog, ...prev];
      try { localStorage.setItem(STORAGE_PREFIX + 'bookBorrowLogs', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    void handleDbMutation(
      supabase.from('BookBorrowLog').insert(newLog),
      undefined,
      'Không thể lưu phiếu mượn sách'
    );

    // Decrease available copies
    const targetBook = allClassroomBooks.find((b) => b.id === data.bookId);
    const newAvail = Math.max(0, (targetBook?.availableCopies ?? 1) - 1);
    setAllClassroomBooks((prev) =>
      prev.map((b) => (b.id === data.bookId ? { ...b, availableCopies: newAvail } : b))
    );
    void handleDbMutation(
      supabase.from('ClassroomBook').update({ availableCopies: newAvail }).eq('id', data.bookId),
      undefined,
      'Không thể cập nhật số lượng sách sẵn sàng'
    );

    toast.success(`Em ${data.studentName} đã mượn sách "${data.bookTitle}"!`);
    return newLog;
  };

  const returnBook = (logId: string, review?: string, stars?: number) => {
    const targetLog = allBookBorrowLogs.find((l) => l.id === logId);
    if (targetLog) {
      const returnDate = new Date().toISOString().split('T')[0];
      const updatedLog = {
        status: 'RETURNED' as const,
        returnDate,
        studentReview: review || targetLog.studentReview,
        ratingStars: stars || targetLog.ratingStars,
      };

      setAllBookBorrowLogs((prev) => {
        const next = prev.map((l) => (l.id === logId ? { ...l, ...updatedLog } : l));
        try { localStorage.setItem(STORAGE_PREFIX + 'bookBorrowLogs', JSON.stringify(next)); } catch (e) {}
        return next;
      });
      void handleDbMutation(
        supabase.from('BookBorrowLog').update(updatedLog).eq('id', logId),
        undefined,
        'Không thể cập nhật phiếu trả sách'
      );

      // Increase available copies
      const targetBook = allClassroomBooks.find((b) => b.id === targetLog.bookId);
      const newAvail = Math.min(targetBook?.totalCopies ?? 1, (targetBook?.availableCopies ?? 0) + 1);
      setAllClassroomBooks((prev) =>
        prev.map((b) => (b.id === targetLog.bookId ? { ...b, availableCopies: newAvail } : b))
      );
      void handleDbMutation(
        supabase.from('ClassroomBook').update({ availableCopies: newAvail }).eq('id', targetLog.bookId),
        undefined,
        'Không thể cập nhật số lượng sách trả'
      );

      toast.success(`Đã trả sách "${targetLog.bookTitle}" vào tủ sách thành công!`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        schoolInfo,
        updateSchoolInfo,
        autoCalendarTerm,
        schoolClasses,
        activeClassId,
        classInfo,
        setClassInfo,
        switchClass,
        addClass,
        updateClass,
        deleteClass,
        regenerateClassShareToken,
        students,
        allStudents,
        currentTerm,
        setCurrentTerm,
        subjectAssessments,
        traitAssessments,
        termSummaries,
        attendances,
        starLogs,
        starCriteria,
        addStarCriterion,
        updateStarCriterion,
        deleteStarCriterion,
        resetStarCriteriaToDefault,
        rewardProducts,
        addRewardProduct,
        updateRewardProduct,
        deleteRewardProduct,
        restockRewardProduct,
        rewardRedemptions,
        createRewardRedemption,
        fulfillRewardRedemption,
        cancelRewardRedemption,
        getStudentMonthlyStars,
        resetMonthStars,
        customSubjects,
        addCustomSubject,
        deleteCustomSubject,
        homeworks,
        allHomeworks,
        addHomework,
        updateHomework,
        deleteHomework,
        quizSubmissions,
        allQuizSubmissions,
        submitQuiz,
        deleteQuizSubmission,
        iepPlans,
        allIEPPlans,
        addIEPPlan,
        updateIEPPlan,
        deleteIEPPlan,
        parentMeetings,
        allParentMeetings,
        addParentMeetingDoc,
        updateParentMeetingDoc,
        deleteParentMeetingDoc,
        healthRecords,
        allHealthRecords,
        addHealthRecord,
        updateHealthRecord,
        deleteHealthRecord,
        classroomBooks,
        allClassroomBooks,
        addClassroomBook,
        updateClassroomBook,
        deleteClassroomBook,
        bookBorrowLogs,
        allBookBorrowLogs,
        borrowBook,
        returnBook,
        classEvents,
        allClassEvents,
        addClassEvent,
        updateClassEvent,
        deleteClassEvent,
        timetable,
        periods,
        timetableScheduleConfig,
        updateTimetableScheduleConfig,
        updateTimetableSlot,
        setTimetable,
        resetTimetableToStandard,
        apiKey,
        setApiKey,
        aiConfig,
        setAiConfig,
        aiGenSettings,
        setAiGenSettings,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudents,
        clearClassStudents,
        loadDemoStudents,
        updateSeatPosition,
        swapSeatPositions,
        updateStudentSecurity,
        resetStudentPin,
        regenerateStudentToken,
        formativeNotes,
        addFormativeNote,
        deleteFormativeNote,
        leaveRequests,
        createLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        classMoments,
        addClassMoment,
        likeClassMoment,
        deleteClassMoment,
        conferenceSlots,
        createConferenceSlot,
        createMultipleConferenceSlots,
        bookConferenceSlot,
        cancelConferenceBooking,
        deleteConferenceSlot,
        updateSubjectAssessment,
        batchUpdateSubjectAssessments,
        batchSetSubjectLevel,
        updateTraitAssessment,
        batchSetTraitLevel,
        updateTermSummary,
        recalculateAllAwards,
        updateAttendance,
        batchSetAttendance,
        addStarLog,
        deleteStarLog,
        getStudentStars,
        exportAllDataJSON,
        importAllDataJSON,
        resetData,
        featureFlags,
        setFeatureFlag,
        resetFeatureFlags,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
