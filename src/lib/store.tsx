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
  FundTransaction,
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
  INITIAL_TRANSACTIONS,
  INITIAL_HOMEWORKS,
  INITIAL_SCHOOL_INFO,
  INITIAL_CLASS_EVENTS,
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
import { toast } from 'sonner';

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

  // Class Fund Management
  transactions: FundTransaction[];
  addTransaction: (tx: Omit<FundTransaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (tx: FundTransaction) => void;
  deleteTransaction: (id: string) => void;

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
  importStudents: (newStudents: Partial<Student>[]) => void;
  clearClassStudents: () => void;
  loadDemoStudents: () => void;
  updateSeatPosition: (studentId: string, row: number, col: number) => void;

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
  const [allTransactions, setAllTransactions] = useState<FundTransaction[]>(INITIAL_TRANSACTIONS);
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

  // Scoped Fund Transactions for active class
  const transactions = useMemo(() => {
    return allTransactions.filter((tx) => (tx.classId || 'class-4a1') === activeClassId);
  }, [allTransactions, activeClassId]);

  // Scoped Homework for active class
  const homeworks = useMemo(() => {
    return allHomeworks.filter(
      (hw) => (hw.classId || 'class-4a1') === activeClassId || hw.className === classInfo.name
    );
  }, [allHomeworks, activeClassId, classInfo.name]);

  const { profile } = useAuth();

  // Tự động chuyển lớp theo phân công của giáo viên khi đăng nhập
  useEffect(() => {
    if (profile && profile.role === 'TEACHER' && profile.assignedClassName) {
      const rawName = profile.assignedClassName.replace('Lớp ', '').trim().toLowerCase();
      const matchedClass = schoolClasses.find((c) => c.name.toLowerCase() === rawName || c.id.toLowerCase() === rawName);
      if (matchedClass && matchedClass.id !== activeClassId) {
        setActiveClassId(matchedClass.id);
      }
    }
  }, [profile, schoolClasses, activeClassId]);

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
      const savedTx = localStorage.getItem(STORAGE_PREFIX + 'transactions');
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
        const upgradedClasses = parsedClasses.map((c: any) => ({
          ...c,
          schoolName: c.schoolName === 'Trường Tiểu học Chu Văn An' ? INITIAL_SCHOOL_INFO.name : c.schoolName || INITIAL_SCHOOL_INFO.name,
          schoolYear: c.schoolYear === '2025-2026' ? '2026-2027' : c.schoolYear || '2026-2027',
        }));
        setSchoolClasses(upgradedClasses);
      } else {
        setSchoolClasses(INITIAL_SCHOOL_CLASSES);
      }

      if (savedActiveId) setActiveClassId(savedActiveId);
      if (savedStudents) setAllStudents(JSON.parse(savedStudents));

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
      if (savedTx) setAllTransactions(JSON.parse(savedTx));
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

      // Nếu chưa có bảng đánh giá, tự động sinh dữ liệu mẫu ban đầu cho các môn
      if (savedSubAss) {
        setSubjectAssessments(JSON.parse(savedSubAss));
      } else {
        const initialSubAss: SubjectAssessment[] = [];
        const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(4));
        INITIAL_STUDENTS.forEach((st, idx) => {
          subjects.forEach((sb) => {
            const isTop = idx < 4;
            const isMedium = idx >= 4 && idx < 10;
            const level: SubjectLevel = isTop ? 'T' : isMedium ? 'T' : 'H';
            const score = sb.hasPeriodicTest ? (isTop ? 9.5 : isMedium ? 8.0 : 7.0) : undefined;
            initialSubAss.push({
              id: `sa-${st.id}-${sb.code}-CUOI_HK1`,
              studentId: st.id,
              subjectCode: sb.code,
              term: 'CUOI_HK1',
              level,
              score,
              comment: '',
              updatedAt: new Date().toISOString(),
            });
          });
        });
        setSubjectAssessments(initialSubAss);
      }

      if (savedTraitAss) {
        setTraitAssessments(JSON.parse(savedTraitAss));
      } else {
        const initialTraitAss: TraitAssessment[] = [];
        INITIAL_STUDENTS.forEach((st, idx) => {
          TRAIT_DEFINITIONS.forEach((tr) => {
            const level: TraitLevel = idx < 6 ? 'T' : 'Đ';
            initialTraitAss.push({
              id: `ta-${st.id}-${tr.code}-CUOI_HK1`,
              studentId: st.id,
              traitCode: tr.code,
              category: tr.category,
              term: 'CUOI_HK1',
              level,
              comment: '',
              updatedAt: new Date().toISOString(),
            });
          });
        });
        setTraitAssessments(initialTraitAss);
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
      localStorage.setItem(STORAGE_PREFIX + 'transactions', JSON.stringify(allTransactions));
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
    allTransactions,
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
    const newClass: ClassInfo = {
      ...newClassData,
      id: `class-${Date.now()}`,
    };
    setSchoolClasses((prev) => [...prev, newClass]);
    setActiveClassId(newClass.id);
  };

  const updateClass = (updated: ClassInfo) => {
    setSchoolClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const deleteClass = (classId: string) => {
    setSchoolClasses((prev) => prev.filter((c) => c.id !== classId));
    if (activeClassId === classId) {
      const remaining = schoolClasses.filter((c) => c.id !== classId);
      if (remaining.length > 0) setActiveClassId(remaining[0].id);
    }
  };

  // CUSTOM SUBJECT ACTIONS
  const addCustomSubject = (subjectData: Omit<CustomSubject, 'id'>) => {
    const newSub: CustomSubject = {
      ...subjectData,
      id: `cs-${Date.now()}`,
    };
    setCustomSubjects((prev) => [...prev, newSub]);
  };

  const deleteCustomSubject = (id: string) => {
    setCustomSubjects((prev) => prev.filter((s) => s.id !== id));
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
  };

  const updateHomework = (updated: HomeworkAssignment) => {
    setAllHomeworks((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  };

  const deleteHomework = (id: string) => {
    setAllHomeworks((prev) => prev.filter((h) => h.id !== id));
  };

  // CLASS FUND ACTIONS
  const addTransaction = (txData: Omit<FundTransaction, 'id' | 'createdAt'>) => {
    const newTx: FundTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      classId: txData.classId || activeClassId,
      createdAt: new Date().toISOString(),
    };
    setAllTransactions((prev) => [newTx, ...prev]);
  };

  const updateTransaction = (updated: FundTransaction) => {
    setAllTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const deleteTransaction = (id: string) => {
    setAllTransactions((prev) => prev.filter((t) => t.id !== id));
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
    setAllTimetables((prev) => {
      const idx = prev.findIndex(
        (s) => (s.classId || 'class-4a1') === activeClassId && s.day === day && s.period === period
      );
      const session = period <= 4 ? 'MORNING' : 'AFTERNOON';
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
          id: `${activeClassId}-${day.toLowerCase()}-p${period}`,
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
  };

  const setTimetable = (slots: TimetableSlot[]) => {
    setAllTimetables((prev) => {
      const otherClasses = prev.filter((s) => (s.classId || 'class-4a1') !== activeClassId);
      const taggedSlots = slots.map((s) => ({ ...s, classId: activeClassId }));
      return [...otherClasses, ...taggedSlots];
    });
  };

  const resetTimetableToStandard = () => {
    setTimetable(INITIAL_TIMETABLE.map((t) => ({ ...t, classId: activeClassId })));
  };

  // STUDENT ACTIONS
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...studentData,
      classId: activeClassId,
      id: `hs-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAllStudents((prev) => [...prev, newStudent]);
  };

  const updateStudent = (updated: Student) => {
    setAllStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const deleteStudent = (id: string) => {
    setAllStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const importStudents = (imported: Partial<Student>[]) => {
    const newStudents: Student[] = imported.map((st, i) => ({
      id: `hs-${Date.now()}-${i}`,
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
      createdAt: new Date().toISOString(),
    }));
    setAllStudents((prev) => [...prev, ...newStudents]);
  };

  const clearClassStudents = () => {
    setAllStudents((prev) => prev.filter((s) => (s.classId || 'class-4a1') !== activeClassId));
  };

  const loadDemoStudents = () => {
    const demoForActive = INITIAL_STUDENTS.map((st) => ({
      ...st,
      id: `hs-${activeClassId}-${st.id}`,
      classId: activeClassId,
      studentCode: st.studentCode.replace('HS4A1', `HS${classInfo.name.replace(/\s+/g, '')}`),
    }));
    setAllStudents((prev) => {
      const otherClasses = prev.filter((s) => (s.classId || 'class-4a1') !== activeClassId);
      return [...otherClasses, ...demoForActive];
    });
  };

  const updateSeatPosition = (studentId: string, row: number, col: number) => {
    setAllStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return { ...s, seatRow: row, seatCol: col };
        }
        if ((s.classId || 'class-4a1') === activeClassId && s.seatRow === row && s.seatCol === col) {
          const current = prev.find((item) => item.id === studentId);
          return { ...s, seatRow: current?.seatRow || 0, seatCol: current?.seatCol || 0 };
        }
        return s;
      })
    );
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
          id: `sa-${studentId}-${subjectCode}-${term}`,
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
          id: `ta-${studentId}-${traitCode}-${term}`,
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
          id: `att-${studentId}-${date}`,
          studentId,
          date,
          status,
          hasBoardingMeal,
          reason,
        },
      ];
    });
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
  };

  const deleteStarLog = (logId: string) => {
    setStarLogs((prev) => prev.filter((s) => s.id !== logId));
  };

  const getStudentStars = (studentId: string) => {
    return starLogs
      .filter((s) => s.studentId === studentId)
      .reduce((sum, s) => sum + s.points, 0);
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
      transactions: allTransactions,
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
      if (Array.isArray(data.transactions)) setAllTransactions(data.transactions);
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
    setAllTransactions(INITIAL_TRANSACTIONS);
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
  };

  const updateClassEvent = (event: ClassEvent) => {
    setAllClassEvents((prev) => {
      const updated = prev.map((e) => (e.id === event.id ? event : e));
      try {
        localStorage.setItem(STORAGE_PREFIX + 'classEvents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const deleteClassEvent = (id: string) => {
    setAllClassEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(STORAGE_PREFIX + 'classEvents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
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
        students,
        allStudents,
        currentTerm,
        setCurrentTerm,
        subjectAssessments,
        traitAssessments,
        termSummaries,
        attendances,
        starLogs,
        customSubjects,
        addCustomSubject,
        deleteCustomSubject,
        homeworks,
        allHomeworks,
        addHomework,
        updateHomework,
        deleteHomework,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
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
