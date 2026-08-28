'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  provider: 'CUSTOM_OPENAI',
  apiKey: 'sk-sjozamgxafx93e1ut7zizxetbf653tx3amguacizr6c40jby',
  baseUrl: 'https://api.xiaomimimo.com/v1',
  modelName: 'mimo-v2.5',
  temperature: 0.7,
  generationSettings: DEFAULT_AI_GEN_SETTINGS,
};
import {
  INITIAL_CLASS,
  INITIAL_SCHOOL_CLASSES,
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
import { INITIAL_TIMETABLE, INITIAL_CUSTOM_SUBJECTS } from './timetable-data';
import { useAuth } from './auth-context';
import { supabase } from './supabase';
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
  addClass: (newClass: Omit<ClassInfo, 'id'>) => void;
  updateClass: (updated: ClassInfo) => void;
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
    studentName: string;
    studentCode: string;
    studentAvatar?: string;
    items: RedemptionItem[];
    totalStars: number;
    studentNote?: string;
    month?: string;
  }) => { success: boolean; error?: string };
  fulfillRewardRedemption: (redemptionId: string) => void;
  cancelRewardRedemption: (redemptionId: string) => void;
  getStudentMonthlyStars: (studentId: string, monthStr?: string) => { earned: number; spent: number; available: number };
  resetMonthStars: (monthStr?: string) => void;

  // Full Database Backup & Restore
  exportAllDataJSON: () => string;
  importAllDataJSON: (jsonStr: string) => { success: boolean; error?: string };
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

const STORAGE_PREFIX = 'gvcn_pro_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const autoCalendarTerm = useMemo(() => getCurrentTermByDate(), []);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(INITIAL_SCHOOL_INFO);
  const [schoolClasses, setSchoolClasses] = useState<ClassInfo[]>(INITIAL_SCHOOL_CLASSES);
  const [activeClassId, setActiveClassId] = useState<string>('class-4a1');
  const [allStudents, setAllStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [currentTerm, setCurrentTerm] = useState<TermType>(() => getCurrentTermByDate());
  const [subjectAssessments, setSubjectAssessments] = useState<SubjectAssessment[]>([]);
  const [traitAssessments, setTraitAssessments] = useState<TraitAssessment[]>([]);
  const [termSummaries, setTermSummaries] = useState<StudentTermSummary[]>([]);
  const [attendances, setAttendances] = useState<DailyAttendance[]>(INITIAL_DAILY_ATTENDANCE);
  const [starLogs, setStarLogs] = useState<StarLog[]>(INITIAL_STAR_LOGS);
  const [starCriteria, setStarCriteria] = useState<StarCriterion[]>(INITIAL_STAR_CRITERIA);
  const [rewardProducts, setRewardProducts] = useState<RewardProduct[]>(INITIAL_REWARD_PRODUCTS);
  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemption[]>(INITIAL_REDEMPTIONS);
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>(INITIAL_CUSTOM_SUBJECTS);
  const [allHomeworks, setAllHomeworks] = useState<HomeworkAssignment[]>(INITIAL_HOMEWORKS);
  const [allQuizSubmissions, setAllQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [allIEPPlans, setAllIEPPlans] = useState<IEPPlan[]>(INITIAL_IEP_PLANS);
  const [allParentMeetings, setAllParentMeetings] = useState<ParentMeetingDoc[]>(INITIAL_PARENT_MEETINGS);
  const [allHealthRecords, setAllHealthRecords] = useState<HealthRecord[]>(INITIAL_HEALTH_RECORDS);
  const [allClassroomBooks, setAllClassroomBooks] = useState<ClassroomBook[]>(INITIAL_CLASSROOM_BOOKS);
  const [allBookBorrowLogs, setAllBookBorrowLogs] = useState<BookBorrowLog[]>(INITIAL_BORROW_LOGS);
  const [allClassEvents, setAllClassEvents] = useState<ClassEvent[]>(INITIAL_CLASS_EVENTS);
  const [allTimetables, setAllTimetables] = useState<TimetableSlot[]>(
    INITIAL_TIMETABLE.map((t) => ({ ...t, classId: 'class-4a1' }))
  );
  const [apiKey, setApiKeyState] = useState<string>('');
  const [aiConfig, setAiConfigState] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [aiGenSettings, setAiGenSettingsState] = useState<AIGenerationSettings>(DEFAULT_AI_GEN_SETTINGS);
  const [formativeNotes, setFormativeNotes] = useState<FormativeNote[]>([
    {
      id: 'fn-1',
      studentId: 'st-01',
      studentName: 'Nguyễn Văn An',
      date: '2026-08-25',
      category: 'TIEN_BO',
      title: 'Hăng hái phát biểu và chữ viết tiến bộ',
      content: 'Em An tuần này rất tự tin phát biểu xây dựng bài môn Toán, bài viết chính tả sạch đẹp không tẩy xóa.',
      tags: ['Toán', 'Tiếng Việt', 'Tiến bộ'],
      isImportant: true,
      createdAt: '2026-08-25T08:30:00Z',
    },
    {
      id: 'fn-2',
      studentId: 'st-02',
      studentName: 'Trần Thị Bảo',
      date: '2026-08-26',
      category: 'TIEN_BO',
      title: 'Giúp đỡ bạn trong giờ thực hành',
      content: 'Biết chủ động hướng dẫn bạn cùng bàn hoàn thành bài vẽ Mỹ thuật, tính tình chan hòa.',
      tags: ['Mỹ thuật', 'Giúp bạn'],
      isImportant: false,
      createdAt: '2026-08-26T09:15:00Z',
    },
  ]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: 'lr-1',
      classId: 'class-4a1',
      studentId: 'st-04',
      studentName: 'Phạm Thị Dung',
      parentName: 'Mẹ Hoàng Thị Mai',
      parentPhone: '0912345678',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reasonType: 'OM_DAU',
      reasonDetail: 'Cháu bị sốt nhẹ và đau họng từ tối qua, gia đình xin phép cô cho cháu nghỉ học 1 ngày để đi khám bệnh.',
      hasBoardingMealCancel: true,
      medicationNotes: 'Nếu chiều cháu đỡ sốt và đi học, nhờ cô cho cháu uống gói Hapacol 250mg lúc 14h.',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]);
  const [classMoments, setClassMoments] = useState<ClassMoment[]>([
    {
      id: 'mom-1',
      classId: 'class-4a1',
      teacherName: 'Cô Nguyễn Thị Hoa',
      category: 'ACADEMIC',
      title: 'Tiết học thực hành STEM: Chế tạo chong chóng gió và đo năng lượng sạch 🌪️',
      content: 'Hôm nay các con lớp 4A1 đã có một buổi trải nghiệm Khoa học cực kỳ sôi nổi! Cả lớp tự tay tính toán, cắt dán cánh quạt và thử nghiệm đo lực gió. Tinh thần làm việc nhóm và tính sáng tạo của các con rất tuyệt vời!',
      imageUrls: [
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
      ],
      taggedStudentIds: ['st-01', 'st-02', 'st-03'],
      likesCount: 18,
      likedBy: [],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'mom-2',
      classId: 'class-4a1',
      teacherName: 'Cô Nguyễn Thị Hoa',
      category: 'PRAISE',
      title: 'Chúc mừng đội tuyển kéo co Lớp 4A1 xuất sắc giành giải Nhất cấp trường! 🏆',
      content: 'Sau 3 vòng thi đấu kiên cường và đoàn kết, đội kéo co lớp 4A1 đã mang về cúp vô địch cho lớp chúng ta. Cảm ơn sự cổ vũ hết mình của tất cả các bạn và phụ huynh!',
      imageUrls: [
        'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&auto=format&fit=crop&q=80',
      ],
      taggedStudentIds: ['st-04', 'st-05', 'st-06', 'st-07'],
      likesCount: 29,
      likedBy: [],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ]);
  const [conferenceSlots, setConferenceSlots] = useState<ConferenceSlot[]>([
    {
      id: 'conf-1',
      classId: 'class-4a1',
      title: 'Trao đổi riêng kết quả học tập & rèn luyện Giữa HK1',
      date: '2026-09-05',
      startTime: '08:00',
      endTime: '08:20',
      type: 'IN_PERSON',
      location: 'Phòng học 4A1 (Tầng 2, Nhà B)',
      isBooked: true,
      bookedStudentId: 'st-01',
      bookedStudentName: 'Nguyễn Văn An',
      bookedParentName: 'Nguyễn Văn Bình',
      bookedParentPhone: '0901234567',
      parentDiscussionTopics: 'Muốn trao đổi với cô về phương pháp rèn thêm môn Toán tư duy ở nhà cho con.',
      createdAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'conf-2',
      classId: 'class-4a1',
      title: 'Trao đổi riêng kết quả học tập & rèn luyện Giữa HK1',
      date: '2026-09-05',
      startTime: '08:25',
      endTime: '08:45',
      type: 'IN_PERSON',
      location: 'Phòng học 4A1 (Tầng 2, Nhà B)',
      isBooked: false,
      createdAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'conf-3',
      classId: 'class-4a1',
      title: 'Trao đổi riêng kết quả học tập & rèn luyện Giữa HK1',
      date: '2026-09-05',
      startTime: '08:50',
      endTime: '09:10',
      type: 'ONLINE_MEET',
      location: 'Google Meet (Link sẽ gửi qua Zalo trước 15p)',
      isBooked: false,
      createdAt: '2026-08-25T08:00:00Z',
    },
  ]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Active Class Info
  const classInfo = useMemo(() => {
    return schoolClasses.find((c) => c.id === activeClassId) || schoolClasses[0] || INITIAL_CLASS;
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
    if (list.length > 0) return list;
    return INITIAL_TIMETABLE.map((t) => ({ ...t, classId: activeClassId }));
  }, [allTimetables, activeClassId]);

  // Scoped Homework for active class
  const homeworks = useMemo(() => {
    return allHomeworks.filter(
      (hw) => hw.classId === activeClassId || hw.className === classInfo.name
    );
  }, [allHomeworks, activeClassId, classInfo.name]);

  const { profile, teachers } = useAuth();

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

  // Khởi tạo và load từ LocalStorage
  useEffect(() => {
    try {
      const savedSchool = localStorage.getItem(STORAGE_PREFIX + 'schoolInfo');
      const savedClasses = localStorage.getItem(STORAGE_PREFIX + 'schoolClasses');
      const savedActiveId = localStorage.getItem(STORAGE_PREFIX + 'activeClassId');
      const savedStudents = localStorage.getItem(STORAGE_PREFIX + 'students');
      const savedTerm = localStorage.getItem(STORAGE_PREFIX + 'currentTerm');
      const savedSubAss = localStorage.getItem(STORAGE_PREFIX + 'subjectAssessments');
      const savedTraitAss = localStorage.getItem(STORAGE_PREFIX + 'traitAssessments');
      const savedSummaries = localStorage.getItem(STORAGE_PREFIX + 'termSummaries');
      const savedAtt = localStorage.getItem(STORAGE_PREFIX + 'attendances');
      const savedStars = localStorage.getItem(STORAGE_PREFIX + 'starLogs');
      const savedTt = localStorage.getItem(STORAGE_PREFIX + 'timetable');
      const savedCs = localStorage.getItem(STORAGE_PREFIX + 'customSubjects');
      const savedHw = localStorage.getItem(STORAGE_PREFIX + 'homeworks');
      const savedKey = localStorage.getItem(STORAGE_PREFIX + 'apiKey');

      if (savedSchool) {
        try {
          const parsedSchool = JSON.parse(savedSchool);
          if (parsedSchool && parsedSchool.name) {
            setSchoolInfo(parsedSchool);
          } else {
            setSchoolInfo(INITIAL_SCHOOL_INFO);
          }
        } catch (e) {
          setSchoolInfo(INITIAL_SCHOOL_INFO);
        }
      } else {
        setSchoolInfo(INITIAL_SCHOOL_INFO);
      }

      if (savedClasses) {
        try {
          const parsedClasses = JSON.parse(savedClasses);
          if (Array.isArray(parsedClasses)) {
            const upgradedClasses = parsedClasses.map((c: any) => {
              const cleanName = (c.name || 'lop').toLowerCase().replace(/[^a-z0-9]/g, '');
              const initialMatch = INITIAL_SCHOOL_CLASSES.find((ic) => ic.id === c.id || ic.name === c.name);
              return {
                ...c,
                totalStudents: c.totalStudents || initialMatch?.totalStudents || 35,
                teacherName: c.teacherName || initialMatch?.teacherName || 'Giáo viên',
                schoolName: c.schoolName || INITIAL_SCHOOL_INFO.name,
                schoolYear: c.schoolYear || INITIAL_SCHOOL_INFO.schoolYear || '2026-2027',
                shareToken: c.shareToken || initialMatch?.shareToken || `c${cleanName}-${Math.random().toString(36).substring(2, 8)}`,
              };
            });
            setSchoolClasses(upgradedClasses);
          } else {
            setSchoolClasses(INITIAL_SCHOOL_CLASSES);
          }
        } catch (e) {
          setSchoolClasses(INITIAL_SCHOOL_CLASSES);
        }
      } else {
        setSchoolClasses(INITIAL_SCHOOL_CLASSES);
      }

      if (savedActiveId) setActiveClassId(savedActiveId);
      if (savedStudents) {
        try {
          const parsedStudents = JSON.parse(savedStudents);
          if (Array.isArray(parsedStudents)) {
            const upgradedStudents = parsedStudents.map((st: any) => ({
              ...st,
              shareToken: st.shareToken || `s-${(st.id || 'hs').toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(36).substring(2, 8)}`,
            }));
            setAllStudents(upgradedStudents);
          } else {
            setAllStudents(INITIAL_STUDENTS);
          }
        } catch (e) {
          setAllStudents(INITIAL_STUDENTS);
        }
      } else {
        setAllStudents(INITIAL_STUDENTS);
      }

      const realCalendarTerm = getCurrentTermByDate();
      if (savedTerm) {
        // If old cached term was CUOI_NAM from previous bug while currently in GIUA_HK1, auto-sync to real calendar term
        if (savedTerm === 'CUOI_NAM' && realCalendarTerm === 'GIUA_HK1') {
          setCurrentTerm('GIUA_HK1');
          localStorage.setItem(STORAGE_PREFIX + 'currentTerm', 'GIUA_HK1');
        } else {
          setCurrentTerm(savedTerm as TermType);
        }
      } else {
        setCurrentTerm(realCalendarTerm);
      }

      if (savedAtt) {
        try {
          const parsed = JSON.parse(savedAtt);
          if (Array.isArray(parsed)) setAttendances(parsed);
        } catch (e) {}
      }
      if (savedStars) {
        try {
          const parsed = JSON.parse(savedStars);
          if (Array.isArray(parsed)) setStarLogs(parsed);
        } catch (e) {}
      }
      
      const savedCriteria = localStorage.getItem(STORAGE_PREFIX + 'starCriteria');
      if (savedCriteria) {
        try { setStarCriteria(JSON.parse(savedCriteria)); } catch (e) {}
      } else {
        setStarCriteria(INITIAL_STAR_CRITERIA);
      }

      const savedProducts = localStorage.getItem(STORAGE_PREFIX + 'rewardProducts');
      if (savedProducts) {
        try { setRewardProducts(JSON.parse(savedProducts)); } catch (e) {}
      } else {
        setRewardProducts(INITIAL_REWARD_PRODUCTS);
      }

      const savedRedemptions = localStorage.getItem(STORAGE_PREFIX + 'rewardRedemptions');
      if (savedRedemptions) {
        try { setRewardRedemptions(JSON.parse(savedRedemptions)); } catch (e) {}
      } else {
        setRewardRedemptions(INITIAL_REDEMPTIONS);
      }

      if (savedTt) {
        try { const p = JSON.parse(savedTt); if (Array.isArray(p)) setAllTimetables(p); } catch (e) {}
      }
      if (savedCs) {
        try { const p = JSON.parse(savedCs); if (Array.isArray(p)) setCustomSubjects(p); } catch (e) {}
      }
      if (savedHw) {
        try { const p = JSON.parse(savedHw); if (Array.isArray(p)) setAllHomeworks(p); } catch (e) {}
      }
      const savedEvents = localStorage.getItem(STORAGE_PREFIX + 'classEvents');
      if (savedEvents) {
        try { const p = JSON.parse(savedEvents); if (Array.isArray(p)) setAllClassEvents(p); } catch (e) {}
      }

      const savedAiConfig = localStorage.getItem(STORAGE_PREFIX + 'aiConfig');
      if (savedAiConfig) {
        try {
          const parsed = JSON.parse(savedAiConfig);
          if (parsed.modelName === 'mimo-v1' || parsed.modelName === 'mimo' || !parsed.modelName) {
            parsed.modelName = 'mimo-v2.5';
          }
          if (!parsed.baseUrl && parsed.provider === 'CUSTOM_OPENAI') {
            parsed.baseUrl = 'https://api.xiaomimimo.com/v1';
          }
          setAiConfigState(parsed);
          if (parsed.apiKey) setApiKeyState(parsed.apiKey);
        } catch (e) {}
      } else if (savedKey) {
        setApiKeyState(savedKey);
        setAiConfigState({ ...DEFAULT_AI_CONFIG, apiKey: savedKey });
      }

      const savedGenSettings = localStorage.getItem(STORAGE_PREFIX + 'aiGenSettings');
      if (savedGenSettings) {
        try {
          const parsed = JSON.parse(savedGenSettings);
          setAiGenSettingsState({ ...DEFAULT_AI_GEN_SETTINGS, ...parsed });
        } catch (e) {}
      }

      if (savedSubAss) {
        try { const p = JSON.parse(savedSubAss); if (Array.isArray(p)) setSubjectAssessments(p); } catch (e) {}
      }

      if (savedTraitAss) {
        try { const p = JSON.parse(savedTraitAss); if (Array.isArray(p)) setTraitAssessments(p); } catch (e) {}
      }

      if (savedSummaries) {
        try { const p = JSON.parse(savedSummaries); if (Array.isArray(p)) setTermSummaries(p); } catch (e) {}
      }

      const savedNotes = localStorage.getItem(STORAGE_PREFIX + 'formativeNotes');
      if (savedNotes) {
        try { setFormativeNotes(JSON.parse(savedNotes)); } catch (e) {}
      }

      const savedLeave = localStorage.getItem(STORAGE_PREFIX + 'leaveRequests');
      if (savedLeave) {
        try { setLeaveRequests(JSON.parse(savedLeave)); } catch (e) {}
      }

      const savedMoments = localStorage.getItem(STORAGE_PREFIX + 'classMoments');
      if (savedMoments) {
        try { setClassMoments(JSON.parse(savedMoments)); } catch (e) {}
      }

      const savedConf = localStorage.getItem(STORAGE_PREFIX + 'conferenceSlots');
      if (savedConf) {
        try { setConferenceSlots(JSON.parse(savedConf)); } catch (e) {}
      }

      const savedQuizSubs = localStorage.getItem(STORAGE_PREFIX + 'quizSubmissions');
      if (savedQuizSubs) {
        try { setAllQuizSubmissions(JSON.parse(savedQuizSubs)); } catch (e) {}
      }

      const savedIEP = localStorage.getItem(STORAGE_PREFIX + 'iepPlans');
      if (savedIEP) {
        try { setAllIEPPlans(JSON.parse(savedIEP)); } catch (e) {}
      }
      const savedPM = localStorage.getItem(STORAGE_PREFIX + 'parentMeetings');
      if (savedPM) {
        try { setAllParentMeetings(JSON.parse(savedPM)); } catch (e) {}
      }

      const savedHR = localStorage.getItem(STORAGE_PREFIX + 'healthRecords');
      if (savedHR) {
        try { setAllHealthRecords(JSON.parse(savedHR)); } catch (e) {}
      }

      const savedBooks = localStorage.getItem(STORAGE_PREFIX + 'classroomBooks');
      if (savedBooks) {
        try { setAllClassroomBooks(JSON.parse(savedBooks)); } catch (e) {}
      }

      const savedBorrow = localStorage.getItem(STORAGE_PREFIX + 'bookBorrowLogs');
      if (savedBorrow) {
        try { setAllBookBorrowLogs(JSON.parse(savedBorrow)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
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
          { data: dbSchool },
          { data: dbClasses },
          { data: dbStudents },
          { data: dbAssessments },
          { data: dbTraits },
          { data: dbSummaries },
          { data: dbAttendances },
          { data: dbStars },
          { data: dbCriteria },
          { data: dbProducts },
          { data: dbRedemptions },
          { data: dbHomeworks },
          { data: dbTimetable },
          { data: dbEvents },
          { data: dbCustomSubjects },
          { data: dbNotes },
          { data: dbLeave },
          { data: dbMoments },
          { data: dbConferences },
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
          supabase.from('TimetableSlot').select('*'),
          supabase.from('ClassEvent').select('*').order('date', { ascending: true }),
          supabase.from('CustomSubject').select('*'),
          supabase.from('FormativeNote').select('*').order('date', { ascending: false }),
          supabase.from('LeaveRequest').select('*').order('createdAt', { ascending: false }),
          supabase.from('ClassMoment').select('*').order('createdAt', { ascending: false }),
          supabase.from('ConferenceSlot').select('*').order('date', { ascending: true }),
        ]);

        if (!isMounted) return;

        if (dbSchool) {
          setSchoolInfo((prev) => ({
            ...prev,
            id: dbSchool.id || prev.id || 'default',
            name: dbSchool.name || prev.name || 'Trường Tiểu học Đại Mỗ',
            departmentName: dbSchool.departmentName || prev.departmentName || 'Phòng GD&ĐT Quận Nam Từ Liêm',
            address: dbSchool.address || prev.address || '',
            phone: dbSchool.phone || prev.phone || '',
            email: dbSchool.email || prev.email || '',
            website: dbSchool.website || prev.website || '',
            logoUrl: dbSchool.logoUrl || prev.logoUrl || '',
            principalName: dbSchool.principalName || prev.principalName || '',
            schoolYear: dbSchool.schoolYear || prev.schoolYear || '2026-2027',
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
        }

        if (dbClasses && dbClasses.length > 0) {
          setSchoolClasses(dbClasses);
        }

        if (dbStudents && dbStudents.length > 0) {
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
          }));
          setAllStudents((prev) => {
            const dbIds = new Set(mappedStudents.map((s) => s.id));
            const localOnly = prev.filter((s) => !dbIds.has(s.id));
            return [...mappedStudents, ...localOnly];
          });
        }

        if (dbAssessments && dbAssessments.length > 0) {
          setSubjectAssessments(dbAssessments);
        }

        if (dbTraits && dbTraits.length > 0) {
          setTraitAssessments(dbTraits);
        }

        if (dbSummaries && dbSummaries.length > 0) {
          setTermSummaries(dbSummaries);
        }

        if (dbAttendances && dbAttendances.length > 0) {
          setAttendances(dbAttendances);
        }

        if (dbStars && dbStars.length > 0) {
          setStarLogs(dbStars);
        }

        if (dbCriteria && dbCriteria.length > 0) {
          setStarCriteria(dbCriteria);
        }

        if (dbProducts && dbProducts.length > 0) {
          setRewardProducts(dbProducts);
        }

        if (dbRedemptions && dbRedemptions.length > 0) {
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

        if (dbHomeworks && dbHomeworks.length > 0) {
          setAllHomeworks((prev) => {
            const dbIds = new Set(dbHomeworks.map((h: any) => h.id));
            const localOnly = prev.filter((h) => !dbIds.has(h.id));
            return [...dbHomeworks, ...localOnly];
          });
        }

        if (dbTimetable && dbTimetable.length > 0) {
          setAllTimetables(dbTimetable);
        }

        if (dbEvents && dbEvents.length > 0) {
          setAllClassEvents((prev) => {
            const dbIds = new Set(dbEvents.map((e: any) => e.id));
            const localOnly = prev.filter((e) => !dbIds.has(e.id));
            return [...dbEvents, ...localOnly];
          });
        }

        if (dbCustomSubjects && dbCustomSubjects.length > 0) {
          setCustomSubjects(dbCustomSubjects);
        }

        if (dbNotes && dbNotes.length > 0) {
          setFormativeNotes(dbNotes);
        }

        if (dbLeave && dbLeave.length > 0) {
          setLeaveRequests(dbLeave);
        }

        if (dbMoments && dbMoments.length > 0) {
          setClassMoments(dbMoments);
        }

        if (dbConferences && dbConferences.length > 0) {
          setConferenceSlots(dbConferences);
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
            setAttendances((prev) => {
              if (prev.some((a) => a.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            setAttendances((prev) => prev.filter((a) => a.id !== oldRow.id));
          } else if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as DailyAttendance;
            setAttendances((prev) => prev.map((a) => (a.id === newRow.id ? newRow : a)));
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
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Tự động lưu vào LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    const safeSet = (key: string, value: string) => {
      try { localStorage.setItem(key, value); } catch (e) { console.warn(`localStorage quota exceeded for key: ${key}`, e); }
    };
    safeSet(STORAGE_PREFIX + 'schoolInfo', JSON.stringify(schoolInfo));
    safeSet(STORAGE_PREFIX + 'schoolClasses', JSON.stringify(schoolClasses));
    safeSet(STORAGE_PREFIX + 'activeClassId', activeClassId);
    safeSet(STORAGE_PREFIX + 'students', JSON.stringify(allStudents));
    safeSet(STORAGE_PREFIX + 'currentTerm', currentTerm);
    safeSet(STORAGE_PREFIX + 'subjectAssessments', JSON.stringify(subjectAssessments));
    safeSet(STORAGE_PREFIX + 'traitAssessments', JSON.stringify(traitAssessments));
    safeSet(STORAGE_PREFIX + 'termSummaries', JSON.stringify(termSummaries));
    safeSet(STORAGE_PREFIX + 'attendances', JSON.stringify(attendances));
    safeSet(STORAGE_PREFIX + 'starLogs', JSON.stringify(starLogs));
    safeSet(STORAGE_PREFIX + 'starCriteria', JSON.stringify(starCriteria));
    safeSet(STORAGE_PREFIX + 'rewardProducts', JSON.stringify(rewardProducts));
    safeSet(STORAGE_PREFIX + 'rewardRedemptions', JSON.stringify(rewardRedemptions));
    safeSet(STORAGE_PREFIX + 'timetable', JSON.stringify(allTimetables));
    safeSet(STORAGE_PREFIX + 'customSubjects', JSON.stringify(customSubjects));
    safeSet(STORAGE_PREFIX + 'homeworks', JSON.stringify(allHomeworks));
    safeSet(STORAGE_PREFIX + 'formativeNotes', JSON.stringify(formativeNotes));
    safeSet(STORAGE_PREFIX + 'leaveRequests', JSON.stringify(leaveRequests));
    safeSet(STORAGE_PREFIX + 'classMoments', JSON.stringify(classMoments));
    safeSet(STORAGE_PREFIX + 'conferenceSlots', JSON.stringify(conferenceSlots));
    safeSet(STORAGE_PREFIX + 'apiKey', apiKey);
  }, [
    isLoaded,
    schoolInfo,
    schoolClasses,
    activeClassId,
    allStudents,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    attendances,
    starLogs,
    starCriteria,
    rewardProducts,
    rewardRedemptions,
    allTimetables,
    customSubjects,
    allHomeworks,
    formativeNotes,
    leaveRequests,
    classMoments,
    conferenceSlots,
    apiKey,
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
        })
        .then();

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

  const addClass = (newClassData: Omit<ClassInfo, 'id'>) => {
    const cleanName = newClassData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newClass: ClassInfo = {
      ...newClassData,
      id: `class-${Date.now()}`,
      shareToken: newClassData.shareToken || `c${cleanName}-${randomSuffix}`,
    };
    setSchoolClasses((prev) => [...prev, newClass]);
    setActiveClassId(newClass.id);

    // Live API Write to Supabase
    supabase
      .from('Class')
      .upsert({
        id: newClass.id,
        name: newClass.name,
        grade: newClass.grade,
        schoolYear: newClass.schoolYear,
        schoolName: newClass.schoolName,
        teacherName: newClass.teacherName,
        totalStudents: newClass.totalStudents || 0,
        seatingGridRows: newClass.seatingGridRows || 5,
        seatingGridCols: newClass.seatingGridCols || 8,
        shareToken: newClass.shareToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .then();
  };

  const updateClass = (updated: ClassInfo) => {
    setSchoolClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    // Live API Write to Supabase
    supabase
      .from('Class')
      .upsert({
        id: updated.id,
        name: updated.name,
        grade: updated.grade,
        schoolYear: updated.schoolYear,
        schoolName: updated.schoolName,
        teacherName: updated.teacherName,
        totalStudents: updated.totalStudents || 0,
        seatingGridRows: updated.seatingGridRows || 5,
        seatingGridCols: updated.seatingGridCols || 8,
        shareToken: updated.shareToken,
        updatedAt: new Date().toISOString(),
      })
      .then();
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
    supabase.from('Student').delete().eq('classId', classId).then();
    supabase.from('HomeworkAssignment').delete().eq('classId', classId).then();
    supabase.from('TimetableSlot').delete().eq('classId', classId).then();
    supabase.from('ClassEvent').delete().eq('classId', classId).then();
    supabase.from('RewardProduct').delete().eq('classId', classId).then();
    supabase.from('RewardRedemption').delete().eq('classId', classId).then();
    supabase.from('Class').delete().eq('id', classId).then();
  };

  const regenerateClassShareToken = (classId?: string): string => {
    const targetId = classId || activeClassId;
    const targetClass = schoolClasses.find((c) => c.id === targetId) || classInfo;
    const cleanName = targetClass.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newToken = `c${cleanName}-${randomSuffix}`;

    setSchoolClasses((prev) => {
      const updated = prev.map((c) => (c.id === targetId ? { ...c, shareToken: newToken } : c));
      try {
        localStorage.setItem(STORAGE_PREFIX + 'schoolClasses', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    supabase.from('Class').update({ shareToken: newToken, updatedAt: new Date().toISOString() }).eq('id', targetId).then();

    return newToken;
  };

  // CUSTOM SUBJECT ACTIONS
  const addCustomSubject = (subjectData: Omit<CustomSubject, 'id'>) => {
    const newSub: CustomSubject = {
      ...subjectData,
      id: `cs-${Date.now()}`,
    };
    setCustomSubjects((prev) => [...prev, newSub]);

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
      })
      .then();
  };

  const deleteCustomSubject = (id: string) => {
    setCustomSubjects((prev) => prev.filter((s) => s.id !== id));
    supabase.from('CustomSubject').delete().eq('id', id).then();
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
      })
      .then();
  };

  const updateHomework = (updated: HomeworkAssignment) => {
    setAllHomeworks((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));

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
      })
      .then();
  };

  const deleteHomework = (id: string) => {
    setAllHomeworks((prev) => prev.filter((h) => h.id !== id));
    supabase.from('HomeworkAssignment').delete().eq('id', id).then();
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
      })
      .then();
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
    supabase.from('TimetableSlot').upsert(dbSlots).then();
  };

  const resetTimetableToStandard = () => {
    setTimetable(INITIAL_TIMETABLE.map((t) => ({ ...t, classId: activeClassId })));
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
      })
      .then();
  };

  const updateStudent = (updated: Student) => {
    setAllStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

    // Live API Write to Supabase
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
      })
      .then();
  };

  const deleteStudent = (id: string) => {
    setAllStudents((prev) => prev.filter((s) => s.id !== id));
    setStarLogs((prev) => prev.filter((s) => s.studentId !== id));
    setAttendances((prev) => prev.filter((a) => a.studentId !== id));
    setSubjectAssessments((prev) => prev.filter((a) => a.studentId !== id));
    setTraitAssessments((prev) => prev.filter((a) => a.studentId !== id));
    setTermSummaries((prev) => prev.filter((a) => a.studentId !== id));

    // Live API Deletion from Supabase
    supabase.from('Student').delete().eq('id', id).then();
    supabase.from('StarLog').delete().eq('studentId', id).then();
    supabase.from('DailyAttendance').delete().eq('studentId', id).then();
    supabase.from('SubjectAssessment').delete().eq('studentId', id).then();
    supabase.from('TraitAssessment').delete().eq('studentId', id).then();
    supabase.from('TermSummary').delete().eq('studentId', id).then();
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
      supabase.from('Student').delete().eq('classId', activeClassId).then(() => {
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
        supabase.from('Student').upsert(dbRows).then();
      });

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
      supabase.from('Student').upsert(dbRows).then();

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
      supabase.from('Student').upsert(dbRows).then();

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
    supabase.from('Student').delete().eq('classId', activeClassId).then();
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
    supabase.from('Student').upsert(dbRows).then();
  };

  const updateSeatPosition = (studentId: string, row: number, col: number) => {
    const finalRow = row < 0 ? undefined : row;
    const finalCol = col < 0 ? undefined : col;
    setAllStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, seatRow: finalRow, seatCol: finalCol } : s))
    );
    supabase.from('Student').update({ seatRow: finalRow ?? null, seatCol: finalCol ?? null, updatedAt: new Date().toISOString() }).eq('id', studentId).then();
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

    supabase.from('Student').update({ seatRow: s2Row ?? null, seatCol: s2Col ?? null, updatedAt: new Date().toISOString() }).eq('id', studentId1).then();
    supabase.from('Student').update({ seatRow: s1Row ?? null, seatCol: s1Col ?? null, updatedAt: new Date().toISOString() }).eq('id', studentId2).then();
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

    supabase
      .from('Student')
      .update({
        customPin: security.customPin,
        isActivated: security.isActivated,
        parentPhone: security.parentPhone,
        shareToken: security.shareToken,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', studentId)
      .then();
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

    supabase
      .from('Student')
      .update({
        customPin: null,
        isActivated: false,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', studentId)
      .then();
  };

  const regenerateStudentToken = (studentId: string): string => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newToken = `s-${studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}-${randomSuffix}`;
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

    supabase
      .from('Student')
      .update({
        shareToken: newToken,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', studentId)
      .then();

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
      })
      .then();
  };

  const batchSetSubjectLevel = (subjectCode: string, level: SubjectLevel) => {
    students.forEach((st) => {
      updateSubjectAssessment(st.id, subjectCode, currentTerm, level);
    });
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
      })
      .then();
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
      })
      .then();
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
    setAttendances((prev) => {
      const idx = prev.findIndex((a) => a.studentId === studentId && a.date === date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], status, hasBoardingMeal, reason };
        return copy;
      }
      return [
        ...prev,
        {
          id: recordId,
          studentId,
          date,
          status,
          hasBoardingMeal,
          reason,
        },
      ];
    });

    // Live API Write to Supabase
    supabase
      .from('DailyAttendance')
      .upsert({
        id: recordId,
        studentId,
        date,
        status,
        hasBoardingMeal,
        reason: reason || '',
      })
      .then();
  };

  const batchSetAttendance = (date: string, status: AttendanceStatus) => {
    students.forEach((st) => {
      updateAttendance(st.id, date, status, st.isBoarding && status === 'CO_MAT');
    });
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
    supabase
      .from('StarLog')
      .insert({
        id: newLog.id,
        studentId: newLog.studentId,
        points: newLog.points,
        category: newLog.category,
        reason: newLog.reason,
        comment: newLog.comment || '',
        date: newLog.date,
        createdAt: newLog.createdAt,
      })
      .then();
  };

  const deleteStarLog = (logId: string) => {
    setStarLogs((prev) => prev.filter((s) => s.id !== logId));
    supabase.from('StarLog').delete().eq('id', logId).then();
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
    };
    setStarCriteria((prev) => [...prev, newCriterion]);
    supabase.from('StarCriterion').upsert(newCriterion).then();
    toast.success('Đã thêm tiêu chí đánh giá mới!');
  };

  const updateStarCriterion = (updated: StarCriterion) => {
    setStarCriteria((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    supabase.from('StarCriterion').upsert(updated).then();
    toast.success('Đã cập nhật tiêu chí!');
  };

  const deleteStarCriterion = (id: string) => {
    setStarCriteria((prev) => prev.filter((c) => c.id !== id));
    supabase.from('StarCriterion').delete().eq('id', id).then();
    toast.success('Đã xóa tiêu chí!');
  };

  const resetStarCriteriaToDefault = () => {
    setStarCriteria(INITIAL_STAR_CRITERIA);
    supabase.from('StarCriterion').upsert(INITIAL_STAR_CRITERIA).then();
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
    setRewardProducts((prev) => [newProduct, ...prev]);
    supabase.from('RewardProduct').upsert(newProduct).then();
    toast.success('Đã thêm sản phẩm mới vào Shop Quà!');
  };

  const updateRewardProduct = (updated: RewardProduct) => {
    setRewardProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    supabase.from('RewardProduct').upsert(updated).then();
    toast.success('Đã cập nhật thông tin sản phẩm!');
  };

  const deleteRewardProduct = (id: string) => {
    setRewardProducts((prev) => prev.filter((p) => p.id !== id));
    supabase.from('RewardProduct').delete().eq('id', id).then();
    toast.success('Đã xóa sản phẩm khỏi Shop!');
  };

  const restockRewardProduct = (id: string, additionalStock: number) => {
    const target = rewardProducts.find((p) => p.id === id);
    const newStock = target ? Math.max(0, target.stock + additionalStock) : additionalStock;
    const isAvailable = newStock > 0;

    setRewardProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: newStock, isAvailable } : p))
    );

    supabase.from('RewardProduct').update({ stock: newStock, isAvailable }).eq('id', id).then();
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

  const createRewardRedemption = (data: {
    studentId: string;
    studentName: string;
    studentCode: string;
    studentAvatar?: string;
    items: RedemptionItem[];
    totalStars: number;
    studentNote?: string;
    month?: string;
  }): { success: boolean; error?: string } => {
    const currentMonth = data.month || new Date().toISOString().substring(0, 7);
    const balance = getStudentMonthlyStars(data.studentId, currentMonth);

    if (balance.available < data.totalStars) {
      return {
        success: false,
        error: `Con đang có ${balance.available} sao khả dụng trong tháng, còn thiếu ${data.totalStars - balance.available} sao nữa để đổi quà!`,
      };
    }

    // Check inventory stock
    for (const item of data.items) {
      const prod = rewardProducts.find((p) => p.id === item.productId);
      if (!prod || prod.stock < item.quantity) {
        return {
          success: false,
          error: `Món quà "${item.productName}" hiện chỉ còn ${prod?.stock || 0} món trong kho!`,
        };
      }
    }

    // Create redemption record
    const newRedemption: RewardRedemption = {
      id: `rd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: activeClassId,
      studentId: data.studentId,
      studentName: data.studentName,
      studentCode: data.studentCode,
      studentAvatar: data.studentAvatar,
      items: data.items,
      totalStars: data.totalStars,
      month: currentMonth,
      status: 'PENDING',
      studentNote: data.studentNote?.trim() || undefined,
      requestedAt: new Date().toISOString(),
    };

    // Decrement stock in React state and in Supabase
    setRewardProducts((prev) =>
      prev.map((p) => {
        const matchingItem = data.items.find((item) => item.productId === p.id);
        if (matchingItem) {
          const remainingStock = Math.max(0, p.stock - matchingItem.quantity);
          supabase.from('RewardProduct').update({ stock: remainingStock, isAvailable: remainingStock > 0 }).eq('id', p.id).then();
          return { ...p, stock: remainingStock, isAvailable: remainingStock > 0 };
        }
        return p;
      })
    );

    setRewardRedemptions((prev) => [newRedemption, ...prev]);

    // Live API Write to Supabase
    supabase
      .from('RewardRedemption')
      .insert({
        id: newRedemption.id,
        classId: newRedemption.classId,
        studentId: newRedemption.studentId,
        studentName: newRedemption.studentName,
        studentCode: newRedemption.studentCode,
        studentAvatar: newRedemption.studentAvatar || null,
        items: newRedemption.items,
        totalStars: newRedemption.totalStars,
        month: newRedemption.month,
        status: newRedemption.status,
        studentNote: newRedemption.studentNote || null,
        requestedAt: newRedemption.requestedAt,
      })
      .then();

    return { success: true };
  };

  const fulfillRewardRedemption = (redemptionId: string) => {
    const deliveredAt = new Date().toISOString();
    setRewardRedemptions((prev) =>
      prev.map((r) =>
        r.id === redemptionId
          ? { ...r, status: 'DELIVERED', deliveredAt }
          : r
      )
    );

    supabase
      .from('RewardRedemption')
      .update({ status: 'DELIVERED', deliveredAt })
      .eq('id', redemptionId)
      .then();

    toast.success('Đã xác nhận trao quà cho học sinh thành công! 🎉');
  };

  const cancelRewardRedemption = (redemptionId: string) => {
    const target = rewardRedemptions.find((r) => r.id === redemptionId);
    if (!target) return;

    if (target.status === 'PENDING') {
      // Restore inventory stock in React state and in Supabase
      setRewardProducts((prev) =>
        prev.map((p) => {
          const matched = target.items.find((item) => item.productId === p.id);
          if (matched) {
            const restoredStock = p.stock + matched.quantity;
            supabase.from('RewardProduct').update({ stock: restoredStock, isAvailable: true }).eq('id', p.id).then();
            return { ...p, stock: restoredStock, isAvailable: true };
          }
          return p;
        })
      );
    }

    setRewardRedemptions((prev) =>
      prev.map((r) => (r.id === redemptionId ? { ...r, status: 'CANCELLED' } : r))
    );

    supabase
      .from('RewardRedemption')
      .update({ status: 'CANCELLED' })
      .eq('id', redemptionId)
      .then();

    toast.info('Đã hủy đơn đổi quà và hoàn lại sao/tồn kho!');
  };

  const resetMonthStars = (monthStr?: string) => {
    const targetMonth = monthStr || new Date().toISOString().substring(0, 7);
    if (confirm(`Bạn có chắc chắn muốn reset điểm thi đua Tháng ${targetMonth.replace('-', '/')} về 0 để bắt đầu đợt mới?`)) {
      setStarLogs((prev) =>
        prev.filter((l) => !(l.date || l.createdAt.split('T')[0]).startsWith(targetMonth))
      );
      setRewardRedemptions((prev) =>
        prev.filter((r) => r.month !== targetMonth)
      );

      // Delete in Supabase
      supabase.from('StarLog').delete().ilike('date', `${targetMonth}%`).then();
      supabase.from('RewardRedemption').delete().eq('month', targetMonth).then();

      toast.success(`Đã reset điểm thi đua tháng ${targetMonth.replace('-', '/')}!`);
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

  const importAllDataJSON = (jsonStr: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'File sao lưu không hợp lệ' };
      }

      if (Array.isArray(data.schoolClasses)) {
        setSchoolClasses(data.schoolClasses);
        supabase.from('Class').upsert(data.schoolClasses).then();
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
        supabase.from('Student').upsert(dbRows).then();
      }
      if (Array.isArray(data.subjectAssessments)) {
        setSubjectAssessments(data.subjectAssessments);
        supabase.from('SubjectAssessment').upsert(data.subjectAssessments).then();
      }
      if (Array.isArray(data.traitAssessments)) {
        setTraitAssessments(data.traitAssessments);
        supabase.from('TraitAssessment').upsert(data.traitAssessments).then();
      }
      if (Array.isArray(data.termSummaries)) {
        setTermSummaries(data.termSummaries);
        supabase.from('TermSummary').upsert(data.termSummaries).then();
      }
      if (Array.isArray(data.attendances)) {
        setAttendances(data.attendances);
        supabase.from('DailyAttendance').upsert(data.attendances).then();
      }
      if (Array.isArray(data.starLogs)) {
        setStarLogs(data.starLogs);
        supabase.from('StarLog').upsert(data.starLogs).then();
      }
      if (Array.isArray(data.starCriteria)) {
        setStarCriteria(data.starCriteria);
        supabase.from('StarCriterion').upsert(data.starCriteria).then();
      }
      if (Array.isArray(data.rewardProducts)) {
        setRewardProducts(data.rewardProducts);
        supabase.from('RewardProduct').upsert(data.rewardProducts).then();
      }
      if (Array.isArray(data.rewardRedemptions)) {
        setRewardRedemptions(data.rewardRedemptions);
        supabase.from('RewardRedemption').upsert(data.rewardRedemptions).then();
      }
      if (Array.isArray(data.timetable)) {
        setAllTimetables(data.timetable);
        supabase.from('TimetableSlot').upsert(data.timetable).then();
      }
      if (Array.isArray(data.customSubjects)) {
        setCustomSubjects(data.customSubjects);
        supabase.from('CustomSubject').upsert(data.customSubjects).then();
      }
      if (Array.isArray(data.homeworks)) {
        setAllHomeworks(data.homeworks);
        supabase.from('HomeworkAssignment').upsert(data.homeworks).then();
      }
      if (data.currentTerm) setCurrentTerm(data.currentTerm);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Lỗi khi giải mã file JSON' };
    }
  };

  const resetData = () => {
    localStorage.clear();
    setSchoolClasses(INITIAL_SCHOOL_CLASSES);
    setActiveClassId('class-4a1');
    setAllStudents(INITIAL_STUDENTS);
    setAttendances(INITIAL_DAILY_ATTENDANCE);
    setStarLogs(INITIAL_STAR_LOGS);
    setStarCriteria(INITIAL_STAR_CRITERIA);
    setRewardProducts(INITIAL_REWARD_PRODUCTS);
    setRewardRedemptions(INITIAL_REDEMPTIONS);
    setCustomSubjects(INITIAL_CUSTOM_SUBJECTS);
    setAllHomeworks(INITIAL_HOMEWORKS);
    setAllTimetables(INITIAL_TIMETABLE.map((t) => ({ ...t, classId: 'class-4a1' })));
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
      supabase
        .from('SchoolInfo')
        .update({
          aiConfig: updated,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', 'default')
        .then();

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
    supabase
      .from('SchoolInfo')
      .update({
        aiConfig: config,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', 'default')
      .then();
  };

  const setAiGenSettings = (settings: AIGenerationSettings) => {
    setAiGenSettingsState(settings);
    try {
      localStorage.setItem(STORAGE_PREFIX + 'aiGenSettings', JSON.stringify(settings));
    } catch (e) {}

    // Live API Write to Supabase
    supabase
      .from('SchoolInfo')
      .update({
        aiGenSettings: settings,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', 'default')
      .then();
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
      })
      .then();
  };

  const updateClassEvent = (event: ClassEvent) => {
    setAllClassEvents((prev) => {
      const updated = prev.map((e) => (e.id === event.id ? event : e));
      try {
        localStorage.setItem(STORAGE_PREFIX + 'classEvents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

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
      })
      .then();
  };

  const deleteClassEvent = (id: string) => {
    setAllClassEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(STORAGE_PREFIX + 'classEvents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    supabase.from('ClassEvent').delete().eq('id', id).then();
  };

  const addFormativeNote = (note: Omit<FormativeNote, 'id' | 'createdAt'>) => {
    const newNote: FormativeNote = {
      ...note,
      id: `fn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setFormativeNotes((prev) => [newNote, ...prev]);
    toast.success('Đã lưu ghi chú tiến bộ thường xuyên!');
    supabase.from('FormativeNote').upsert(newNote).then();
  };

  const deleteFormativeNote = (id: string) => {
    setFormativeNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success('Đã xóa ghi chú');
    supabase.from('FormativeNote').delete().eq('id', id).then();
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
    supabase.from('LeaveRequest').upsert(newReq).then();
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

    // AUTO-SYNC ATTENDANCE: Cập nhật học sinh sang VANG_CO_PHEP vào ngày nghỉ
    updateAttendance(
      req.studentId,
      req.startDate,
      'VANG_CO_PHEP',
      !req.hasBoardingMealCancel,
      `Đơn xin nghỉ phép trực tuyến (${req.reasonDetail})`
    );

    toast.success(`Đã duyệt đơn xin nghỉ của em ${req.studentName} và đồng bộ Sổ điểm danh!`);
    supabase.from('LeaveRequest').update({ status: 'APPROVED', teacherNote: note, reviewedAt }).eq('id', id).then();
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
    supabase.from('LeaveRequest').update({ status: 'REJECTED', teacherNote: note, reviewedAt }).eq('id', id).then();
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
    supabase.from('ClassMoment').upsert(newMoment).then();
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
        supabase.from('ClassMoment').update({ likesCount: updated.likesCount, likedBy: updated.likedBy }).eq('id', id).then();
        return updated;
      })
    );
  };

  const deleteClassMoment = (id: string) => {
    setClassMoments((prev) => prev.filter((m) => m.id !== id));
    toast.success('Đã xóa bài viết khoảnh khắc');
    supabase.from('ClassMoment').delete().eq('id', id).then();
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
    supabase.from('ConferenceSlot').upsert(newSlot).then();
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
    supabase.from('ConferenceSlot').upsert(newSlots).then();
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
    supabase.from('ConferenceSlot').update(updatePayload).eq('id', slotId).then();
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
    supabase.from('ConferenceSlot').update(resetPayload).eq('id', slotId).then();
  };

  const deleteConferenceSlot = (slotId: string) => {
    setConferenceSlots((prev) => prev.filter((s) => s.id !== slotId));
    toast.success('Đã xóa khung giờ hẹn');
    supabase.from('ConferenceSlot').delete().eq('id', slotId).then();
  };

  const quizSubmissions = useMemo(
    () => allQuizSubmissions.filter((s) => (s.classId || 'class-4a1') === activeClassId),
    [allQuizSubmissions, activeClassId]
  );

  const submitQuiz = (data: Omit<QuizSubmission, 'id' | 'submittedAt'>): QuizSubmission => {
    const newSubmission: QuizSubmission = {
      ...data,
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: new Date().toISOString(),
    };
    setAllQuizSubmissions((prev) => {
      const filtered = prev.filter(
        (s) => !(s.homeworkId === newSubmission.homeworkId && s.studentId === newSubmission.studentId)
      );
      const next = [newSubmission, ...filtered];
      try {
        localStorage.setItem(STORAGE_PREFIX + 'quizSubmissions', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    return newSubmission;
  };

  const deleteQuizSubmission = (id: string) => {
    setAllQuizSubmissions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_PREFIX + 'quizSubmissions', JSON.stringify(next));
      } catch (e) {}
      return next;
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
    toast.success(`Đã tạo Kế hoạch Giáo dục Cá nhân cho em ${newPlan.studentName}!`);
    return newPlan;
  };

  const updateIEPPlan = (updated: IEPPlan) => {
    setAllIEPPlans((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : p));
      try {
        localStorage.setItem(STORAGE_PREFIX + 'iepPlans', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
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
    toast.success(`Đã lưu biên bản cuộc họp phụ huynh!`);
    return newDoc;
  };

  const updateParentMeetingDoc = (updated: ParentMeetingDoc) => {
    setAllParentMeetings((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      try { localStorage.setItem(STORAGE_PREFIX + 'parentMeetings', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    toast.success('Đã cập nhật biên bản cuộc họp phụ huynh!');
  };

  const deleteParentMeetingDoc = (id: string) => {
    setAllParentMeetings((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try { localStorage.setItem(STORAGE_PREFIX + 'parentMeetings', JSON.stringify(next)); } catch (e) {}
      return next;
    });
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
    toast.success(`Đã lưu hồ sơ sức khỏe em ${newRec.studentName}!`);
    return newRec;
  };

  const updateHealthRecord = (updated: HealthRecord) => {
    setAllHealthRecords((prev) => {
      const next = prev.map((h) => (h.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : h));
      try { localStorage.setItem(STORAGE_PREFIX + 'healthRecords', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    toast.success(`Đã cập nhật hồ sơ sức khỏe em ${updated.studentName}!`);
  };

  const deleteHealthRecord = (id: string) => {
    setAllHealthRecords((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try { localStorage.setItem(STORAGE_PREFIX + 'healthRecords', JSON.stringify(next)); } catch (e) {}
      return next;
    });
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
    toast.success(`Đã thêm sách "${newBook.title}" vào tủ sách lớp!`);
    return newBook;
  };

  const updateClassroomBook = (updated: ClassroomBook) => {
    setAllClassroomBooks((prev) => {
      const next = prev.map((b) => (b.id === updated.id ? updated : b));
      try { localStorage.setItem(STORAGE_PREFIX + 'classroomBooks', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    toast.success('Đã cập nhật thông tin sách!');
  };

  const deleteClassroomBook = (id: string) => {
    setAllClassroomBooks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      try { localStorage.setItem(STORAGE_PREFIX + 'classroomBooks', JSON.stringify(next)); } catch (e) {}
      return next;
    });
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
    // Decrease available copies
    setAllClassroomBooks((prev) =>
      prev.map((b) => (b.id === data.bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );
    toast.success(`Em ${data.studentName} đã mượn sách "${data.bookTitle}"!`);
    return newLog;
  };

  const returnBook = (logId: string, review?: string, stars?: number) => {
    const targetLog = allBookBorrowLogs.find((l) => l.id === logId);
    if (targetLog) {
      setAllBookBorrowLogs((prev) => {
        const next = prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'RETURNED' as const,
                returnDate: new Date().toISOString().split('T')[0],
                studentReview: review || l.studentReview,
                ratingStars: stars || l.ratingStars,
              }
            : l
        );
        try { localStorage.setItem(STORAGE_PREFIX + 'bookBorrowLogs', JSON.stringify(next)); } catch (e) {}
        return next;
      });
      // Increase available copies
      setAllClassroomBooks((prev) =>
        prev.map((b) => (b.id === targetLog.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b))
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
