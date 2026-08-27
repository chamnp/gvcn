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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
  const [allClassEvents, setAllClassEvents] = useState<ClassEvent[]>(INITIAL_CLASS_EVENTS);
  const [allTimetables, setAllTimetables] = useState<TimetableSlot[]>(
    INITIAL_TIMETABLE.map((t) => ({ ...t, classId: 'class-4a1' }))
  );
  const [apiKey, setApiKeyState] = useState<string>('');
  const [aiConfig, setAiConfigState] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [aiGenSettings, setAiGenSettingsState] = useState<AIGenerationSettings>(DEFAULT_AI_GEN_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Active Class Info
  const classInfo = useMemo(() => {
    return schoolClasses.find((c) => c.id === activeClassId) || schoolClasses[0] || INITIAL_CLASS;
  }, [schoolClasses, activeClassId]);

  // Scoped Students for active class
  const students = useMemo(() => {
    const list = allStudents.filter((s) => (s.classId || 'class-4a1') === activeClassId);
    return list;
  }, [allStudents, activeClassId]);

  // Scoped Events for active class
  const classEvents = useMemo(() => {
    return allClassEvents.filter((ev) => (ev.classId || 'class-4a1') === activeClassId);
  }, [allClassEvents, activeClassId]);

  // Scoped Timetable for active class
  const timetable = useMemo(() => {
    const list = allTimetables.filter((t) => (t.classId || 'class-4a1') === activeClassId);
    if (list.length > 0) return list;
    return INITIAL_TIMETABLE.map((t) => ({ ...t, classId: activeClassId }));
  }, [allTimetables, activeClassId]);

  // Scoped Homework for active class
  const homeworks = useMemo(() => {
    return allHomeworks.filter(
      (hw) => (hw.classId || 'class-4a1') === activeClassId || hw.className === classInfo.name
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
              t.assignedClassId === cls.id ||
              (t.assignedClassName &&
                t.assignedClassName.replace('Lớp ', '').trim().toLowerCase() === cls.name.toLowerCase())
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
    if (profile && profile.fullName && profile.fullName.trim() !== '') {
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
        const parsedSchool = JSON.parse(savedSchool);
        if (
          parsedSchool.name === 'Trường Tiểu học Chu Văn An' ||
          parsedSchool.principalName === 'Cô Ngô Thị Thúy' ||
          parsedSchool.principalName === 'Thầy/Cô Hiệu Trưởng' ||
          parsedSchool.schoolYear === '2025-2026' ||
          !parsedSchool.name
        ) {
          setSchoolInfo(INITIAL_SCHOOL_INFO);
          localStorage.setItem(STORAGE_PREFIX + 'schoolInfo', JSON.stringify(INITIAL_SCHOOL_INFO));
        } else {
          setSchoolInfo(parsedSchool);
        }
      } else {
        setSchoolInfo(INITIAL_SCHOOL_INFO);
      }

      if (savedClasses) {
        const parsedClasses = JSON.parse(savedClasses);
        const upgradedClasses = parsedClasses.map((c: any) => {
          const cleanName = (c.name || 'lop').toLowerCase().replace(/[^a-z0-9]/g, '');
          const initialMatch = INITIAL_SCHOOL_CLASSES.find((ic) => ic.id === c.id || ic.name === c.name);
          const is4A1 = c.id === 'class-4a1' || c.name === '4A1';
          return {
            ...c,
            totalStudents: is4A1 ? 55 : c.totalStudents || initialMatch?.totalStudents || 35,
            teacherName: is4A1 && (!c.teacherName || c.teacherName === 'Cô Nguyễn Thị Mai') ? 'Cô Nguyễn Thị Minh Hằng' : c.teacherName || initialMatch?.teacherName || 'Giáo viên',
            schoolName: c.schoolName === 'Trường Tiểu học Chu Văn An' ? INITIAL_SCHOOL_INFO.name : c.schoolName || INITIAL_SCHOOL_INFO.name,
            schoolYear: c.schoolYear === '2025-2026' ? '2026-2027' : c.schoolYear || '2026-2027',
            shareToken: c.shareToken || initialMatch?.shareToken || `c${cleanName}-${Math.random().toString(36).substring(2, 8)}`,
          };
        });
        setSchoolClasses(upgradedClasses);
      } else {
        setSchoolClasses(INITIAL_SCHOOL_CLASSES);
      }

      if (savedActiveId) setActiveClassId(savedActiveId);
      if (savedStudents) {
        const parsedStudents = JSON.parse(savedStudents);
        // Check if cached 4A1 students is the old 12-student demo list (starts with 'Nguyễn Văn An' and has <= 12 students)
        const isOldDemo4A1 =
          parsedStudents.filter((s: any) => (s.classId || 'class-4a1') === 'class-4a1').length <= 12 &&
          parsedStudents.some((s: any) => s.fullName === 'Nguyễn Văn An');

        if (isOldDemo4A1) {
          const otherClasses = parsedStudents.filter((s: any) => s.classId && s.classId !== 'class-4a1');
          const real4A1 = INITIAL_STUDENTS.filter((s) => (s.classId || 'class-4a1') === 'class-4a1');
          const combined = [...otherClasses, ...real4A1];
          setAllStudents(combined);
          try {
            localStorage.setItem(STORAGE_PREFIX + 'students', JSON.stringify(combined));
          } catch (e) {}
        } else {
          const upgradedStudents = parsedStudents.map((st: any) => ({
            ...st,
            shareToken: st.shareToken || `s-${(st.id || 'hs').toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(36).substring(2, 8)}`,
          }));
          setAllStudents(upgradedStudents);
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

      if (savedAtt) setAttendances(JSON.parse(savedAtt));
      if (savedStars) setStarLogs(JSON.parse(savedStars));
      
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

      if (savedTt) setAllTimetables(JSON.parse(savedTt));
      if (savedCs) setCustomSubjects(JSON.parse(savedCs));
      if (savedHw) setAllHomeworks(JSON.parse(savedHw));
      const savedEvents = localStorage.getItem(STORAGE_PREFIX + 'classEvents');
      if (savedEvents) setAllClassEvents(JSON.parse(savedEvents));

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
        setSubjectAssessments(JSON.parse(savedSubAss));
      }

      if (savedTraitAss) {
        setTraitAssessments(JSON.parse(savedTraitAss));
      }

      if (savedSummaries) {
        setTermSummaries(JSON.parse(savedSummaries));
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
          { data: dbHomeworks },
          { data: dbTimetable },
          { data: dbEvents },
          { data: dbCustomSubjects },
        ] = await Promise.all([
          supabase.from('SchoolInfo').select('*').single(),
          supabase.from('Class').select('*').order('grade', { ascending: true }),
          supabase.from('Student').select('*').order('id', { ascending: true }),
          supabase.from('SubjectAssessment').select('*'),
          supabase.from('TraitAssessment').select('*'),
          supabase.from('TermSummary').select('*'),
          supabase.from('DailyAttendance').select('*'),
          supabase.from('StarLog').select('*').order('createdAt', { ascending: false }),
          supabase.from('HomeworkAssignment').select('*').order('createdAt', { ascending: false }),
          supabase.from('TimetableSlot').select('*'),
          supabase.from('ClassEvent').select('*').order('date', { ascending: true }),
          supabase.from('CustomSubject').select('*'),
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
            principalName: dbSchool.principalName || prev.principalName || '',
            schoolYear: dbSchool.schoolYear || prev.schoolYear || '2026-2027',
          }));
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
          setAllStudents(mappedStudents);
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

        if (dbHomeworks && dbHomeworks.length > 0) {
          setAllHomeworks(dbHomeworks);
        }

        if (dbTimetable && dbTimetable.length > 0) {
          setAllTimetables(dbTimetable);
        }

        if (dbEvents && dbEvents.length > 0) {
          setAllClassEvents(dbEvents);
        }

        if (dbCustomSubjects && dbCustomSubjects.length > 0) {
          setCustomSubjects(dbCustomSubjects);
        }
      } catch (err) {
        console.warn('Supabase initial fetch error:', err);
      }
    }

    syncFromSupabase();

    return () => {
      isMounted = false;
    };
  }, []);

  // Tự động lưu vào LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + 'schoolInfo', JSON.stringify(schoolInfo));
      localStorage.setItem(STORAGE_PREFIX + 'schoolClasses', JSON.stringify(schoolClasses));
      localStorage.setItem(STORAGE_PREFIX + 'activeClassId', activeClassId);
      localStorage.setItem(STORAGE_PREFIX + 'students', JSON.stringify(allStudents));
      localStorage.setItem(STORAGE_PREFIX + 'currentTerm', currentTerm);
      localStorage.setItem(STORAGE_PREFIX + 'subjectAssessments', JSON.stringify(subjectAssessments));
      localStorage.setItem(STORAGE_PREFIX + 'traitAssessments', JSON.stringify(traitAssessments));
      localStorage.setItem(STORAGE_PREFIX + 'termSummaries', JSON.stringify(termSummaries));
      localStorage.setItem(STORAGE_PREFIX + 'attendances', JSON.stringify(attendances));
      localStorage.setItem(STORAGE_PREFIX + 'starLogs', JSON.stringify(starLogs));
      localStorage.setItem(STORAGE_PREFIX + 'starCriteria', JSON.stringify(starCriteria));
      localStorage.setItem(STORAGE_PREFIX + 'rewardProducts', JSON.stringify(rewardProducts));
      localStorage.setItem(STORAGE_PREFIX + 'rewardRedemptions', JSON.stringify(rewardRedemptions));
      localStorage.setItem(STORAGE_PREFIX + 'timetable', JSON.stringify(allTimetables));
      localStorage.setItem(STORAGE_PREFIX + 'customSubjects', JSON.stringify(customSubjects));
      localStorage.setItem(STORAGE_PREFIX + 'homeworks', JSON.stringify(allHomeworks));
      localStorage.setItem(STORAGE_PREFIX + 'apiKey', apiKey);
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
    }
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
          address: updated.address,
          phone: updated.phone,
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
    setSchoolClasses((prev) => prev.map((c) => (c.id === info.id ? info : c)));
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
    setSchoolClasses((prev) => prev.filter((c) => c.id !== classId));
    if (activeClassId === classId) {
      const remaining = schoolClasses.filter((c) => c.id !== classId);
      if (remaining.length > 0) setActiveClassId(remaining[0].id);
    }
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
        parentName: newStudent.parentName,
        parentPhone: newStudent.parentPhone,
        isBoarding: newStudent.isBoarding,
        seatRow: newStudent.seatRow,
        seatCol: newStudent.seatCol,
        healthNotes: newStudent.healthNotes,
        tags: JSON.stringify(newStudent.tags || []),
        shareToken: newStudent.shareToken,
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
        (s) => (s.classId || 'class-4a1') !== activeClassId
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
          parentName: st.parentName || '',
          parentPhone: st.parentPhone || '',
          isBoarding: st.isBoarding ?? true,
          seatRow: Math.floor(i / 8),
          seatCol: i % 8,
          healthNotes: st.healthNotes || '',
          tags: [],
          shareToken: `s-${studentId}-${Math.random().toString(36).substring(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
      });
      setAllStudents([...otherClassStudents, ...newStudents]);
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
          parentName: st.parentName || '',
          parentPhone: st.parentPhone || '',
          isBoarding: st.isBoarding ?? true,
          seatRow: Math.floor((students.length + i) / 8),
          seatCol: (students.length + i) % 8,
          healthNotes: st.healthNotes || '',
          tags: [],
          shareToken: `s-${studentId}-${Math.random().toString(36).substring(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
      });
      setAllStudents((prev) => [...prev, ...newStudents]);
      return { added: newStudents.length, updated: 0 };
    }

    // Default: 'upsert' (Cập nhật thông tin nếu học sinh đã tồn tại, thêm mới nếu chưa có)
    setAllStudents((prev) => {
      const currentClassStudents = prev.filter(
        (s) => (s.classId || 'class-4a1') === activeClassId
      );
      const otherClassStudents = prev.filter(
        (s) => (s.classId || 'class-4a1') !== activeClassId
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
            parentName: st.parentName || '',
            parentPhone: st.parentPhone || '',
            isBoarding: st.isBoarding ?? true,
            seatRow: Math.floor(updatedClassStudents.length / 8),
            seatCol: updatedClassStudents.length % 8,
            healthNotes: st.healthNotes || '',
            tags: [],
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

      return [...otherClassStudents, ...updatedClassStudents];
    });

    return { added: addedCount, updated: updatedCount };
  };

  const clearClassStudents = () => {
    const classStudentIds = new Set(
      allStudents
        .filter((s) => (s.classId || 'class-4a1') === activeClassId)
        .map((s) => s.id)
    );
    setAllStudents((prev) => prev.filter((s) => (s.classId || 'class-4a1') !== activeClassId));
    setStarLogs((prev) => prev.filter((s) => !classStudentIds.has(s.studentId)));
    setAttendances((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setSubjectAssessments((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setTraitAssessments((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
    setTermSummaries((prev) => prev.filter((a) => !classStudentIds.has(a.studentId)));
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
  };

  const updateSeatPosition = (studentId: string, row: number, col: number) => {
    setAllStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, seatRow: row, seatCol: col } : s))
    );
    supabase.from('Student').update({ seatRow: row, seatCol: col, updatedAt: new Date().toISOString() }).eq('id', studentId).then();
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

    // Live API Write to Supabase
    supabase
      .from('TermSummary')
      .upsert({
        id: recordId,
        studentId,
        term,
        overallLearningLevel: partial.overallLearningLevel,
        overallTraitsLevel: partial.overallTraitsLevel,
        awardTitle: partial.awardTitle,
        awardDetail: partial.awardDetail,
        teacherComment: partial.teacherComment,
        promotedToNextGrade: partial.promotedToNextGrade,
        summerRemediation: partial.summerRemediation,
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
    toast.success('Đã thêm tiêu chí đánh giá mới!');
  };

  const updateStarCriterion = (updated: StarCriterion) => {
    setStarCriteria((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    toast.success('Đã cập nhật tiêu chí!');
  };

  const deleteStarCriterion = (id: string) => {
    setStarCriteria((prev) => prev.filter((c) => c.id !== id));
    toast.success('Đã xóa tiêu chí!');
  };

  const resetStarCriteriaToDefault = () => {
    setStarCriteria(INITIAL_STAR_CRITERIA);
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
    toast.success('Đã thêm sản phẩm mới vào Shop Quà!');
  };

  const updateRewardProduct = (updated: RewardProduct) => {
    setRewardProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    toast.success('Đã cập nhật thông tin sản phẩm!');
  };

  const deleteRewardProduct = (id: string) => {
    setRewardProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success('Đã xóa sản phẩm khỏi Shop!');
  };

  const restockRewardProduct = (id: string, additionalStock: number) => {
    setRewardProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStock = Math.max(0, p.stock + additionalStock);
          return { ...p, stock: newStock, isAvailable: newStock > 0 };
        }
        return p;
      })
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

    // Decrement stock
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
  };

  const fulfillRewardRedemption = (redemptionId: string) => {
    setRewardRedemptions((prev) =>
      prev.map((r) =>
        r.id === redemptionId
          ? { ...r, status: 'DELIVERED', deliveredAt: new Date().toISOString() }
          : r
      )
    );
    toast.success('Đã xác nhận trao quà cho học sinh thành công! 🎉');
  };

  const cancelRewardRedemption = (redemptionId: string) => {
    const target = rewardRedemptions.find((r) => r.id === redemptionId);
    if (!target) return;

    if (target.status === 'PENDING') {
      // Restore inventory stock
      setRewardProducts((prev) =>
        prev.map((p) => {
          const matched = target.items.find((item) => item.productId === p.id);
          if (matched) {
            return { ...p, stock: p.stock + matched.quantity, isAvailable: true };
          }
          return p;
        })
      );
    }

    setRewardRedemptions((prev) =>
      prev.map((r) => (r.id === redemptionId ? { ...r, status: 'CANCELLED' } : r))
    );
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

      if (Array.isArray(data.schoolClasses)) setSchoolClasses(data.schoolClasses);
      if (typeof data.activeClassId === 'string') setActiveClassId(data.activeClassId);
      if (Array.isArray(data.students)) setAllStudents(data.students);
      if (Array.isArray(data.subjectAssessments)) setSubjectAssessments(data.subjectAssessments);
      if (Array.isArray(data.traitAssessments)) setTraitAssessments(data.traitAssessments);
      if (Array.isArray(data.termSummaries)) setTermSummaries(data.termSummaries);
      if (Array.isArray(data.attendances)) setAttendances(data.attendances);
      if (Array.isArray(data.starLogs)) setStarLogs(data.starLogs);
      if (Array.isArray(data.starCriteria)) setStarCriteria(data.starCriteria);
      if (Array.isArray(data.rewardProducts)) setRewardProducts(data.rewardProducts);
      if (Array.isArray(data.rewardRedemptions)) setRewardRedemptions(data.rewardRedemptions);
      if (Array.isArray(data.timetable)) setAllTimetables(data.timetable);
      if (Array.isArray(data.customSubjects)) setCustomSubjects(data.customSubjects);
      if (Array.isArray(data.homeworks)) setAllHomeworks(data.homeworks);
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
  };

  const setAiGenSettings = (settings: AIGenerationSettings) => {
    setAiGenSettingsState(settings);
    try {
      localStorage.setItem(STORAGE_PREFIX + 'aiGenSettings', JSON.stringify(settings));
    } catch (e) {}
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
        updateStudentSecurity,
        resetStudentPin,
        regenerateStudentToken,
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
