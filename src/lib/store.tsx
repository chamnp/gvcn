'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ClassInfo,
  Student,
  SubjectAssessment,
  TraitAssessment,
  StudentTermSummary,
  DailyAttendance,
  StarLog,
  ClassFundTransaction,
  TermType,
  SubjectLevel,
  TraitLevel,
  AttendanceStatus,
} from '@/types';
import {
  INITIAL_CLASS,
  INITIAL_STUDENTS,
  INITIAL_DAILY_ATTENDANCE,
  INITIAL_STAR_LOGS,
  INITIAL_FUND_TRANSACTIONS,
} from '@/data/mock-data';
import { PRIMARY_SUBJECTS, TRAIT_DEFINITIONS, evaluateStudentTT27 } from './tt27-engine';

interface AppContextType {
  classInfo: ClassInfo;
  setClassInfo: (info: ClassInfo) => void;
  students: Student[];
  currentTerm: TermType;
  setCurrentTerm: (term: TermType) => void;
  subjectAssessments: SubjectAssessment[];
  traitAssessments: TraitAssessment[];
  termSummaries: StudentTermSummary[];
  attendances: DailyAttendance[];
  starLogs: StarLog[];
  fundTransactions: ClassFundTransaction[];
  apiKey: string;
  setApiKey: (key: string) => void;
  
  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  importStudents: (newStudents: Partial<Student>[]) => void;
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

  // Star / Reward Actions
  addStarLog: (studentId: string, points: number, category: string, reason: string) => void;
  getStudentStars: (studentId: string) => number;

  // Finance Actions
  addTransaction: (tx: Omit<ClassFundTransaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;

  // Reset
  resetData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'gvcn_pro_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classInfo, setClassInfo] = useState<ClassInfo>(INITIAL_CLASS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [currentTerm, setCurrentTerm] = useState<TermType>('CUOI_HK1');
  const [subjectAssessments, setSubjectAssessments] = useState<SubjectAssessment[]>([]);
  const [traitAssessments, setTraitAssessments] = useState<TraitAssessment[]>([]);
  const [termSummaries, setTermSummaries] = useState<StudentTermSummary[]>([]);
  const [attendances, setAttendances] = useState<DailyAttendance[]>(INITIAL_DAILY_ATTENDANCE);
  const [starLogs, setStarLogs] = useState<StarLog[]>(INITIAL_STAR_LOGS);
  const [fundTransactions, setFundTransactions] = useState<ClassFundTransaction[]>(INITIAL_FUND_TRANSACTIONS);
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Khởi tạo và load từ LocalStorage
  useEffect(() => {
    try {
      const savedClass = localStorage.getItem(STORAGE_PREFIX + 'classInfo');
      const savedStudents = localStorage.getItem(STORAGE_PREFIX + 'students');
      const savedTerm = localStorage.getItem(STORAGE_PREFIX + 'currentTerm');
      const savedSubAss = localStorage.getItem(STORAGE_PREFIX + 'subjectAssessments');
      const savedTraitAss = localStorage.getItem(STORAGE_PREFIX + 'traitAssessments');
      const savedSummaries = localStorage.getItem(STORAGE_PREFIX + 'termSummaries');
      const savedAtt = localStorage.getItem(STORAGE_PREFIX + 'attendances');
      const savedStars = localStorage.getItem(STORAGE_PREFIX + 'starLogs');
      const savedTx = localStorage.getItem(STORAGE_PREFIX + 'fundTransactions');
      const savedKey = localStorage.getItem(STORAGE_PREFIX + 'apiKey');

      if (savedClass) setClassInfo(JSON.parse(savedClass));
      if (savedStudents) setStudents(JSON.parse(savedStudents));
      if (savedTerm) setCurrentTerm(savedTerm as TermType);
      if (savedAtt) setAttendances(JSON.parse(savedAtt));
      if (savedStars) setStarLogs(JSON.parse(savedStars));
      if (savedTx) setFundTransactions(JSON.parse(savedTx));
      if (savedKey) setApiKey(savedKey);

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
      localStorage.setItem(STORAGE_PREFIX + 'classInfo', JSON.stringify(classInfo));
      localStorage.setItem(STORAGE_PREFIX + 'students', JSON.stringify(students));
      localStorage.setItem(STORAGE_PREFIX + 'currentTerm', currentTerm);
      localStorage.setItem(STORAGE_PREFIX + 'subjectAssessments', JSON.stringify(subjectAssessments));
      localStorage.setItem(STORAGE_PREFIX + 'traitAssessments', JSON.stringify(traitAssessments));
      localStorage.setItem(STORAGE_PREFIX + 'termSummaries', JSON.stringify(termSummaries));
      localStorage.setItem(STORAGE_PREFIX + 'attendances', JSON.stringify(attendances));
      localStorage.setItem(STORAGE_PREFIX + 'starLogs', JSON.stringify(starLogs));
      localStorage.setItem(STORAGE_PREFIX + 'fundTransactions', JSON.stringify(fundTransactions));
      localStorage.setItem(STORAGE_PREFIX + 'apiKey', apiKey);
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
    }
  }, [
    isLoaded,
    classInfo,
    students,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    attendances,
    starLogs,
    fundTransactions,
    apiKey,
  ]);

  // STUDENT ACTIONS
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `hs-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const updateStudent = (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const importStudents = (imported: Partial<Student>[]) => {
    const newStudents: Student[] = imported.map((st, i) => ({
      id: `hs-${Date.now()}-${i}`,
      studentCode: st.studentCode || `HS4A1-${String(students.length + i + 1).padStart(3, '0')}`,
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
    setStudents((prev) => [...prev, ...newStudents]);
  };

  const updateSeatPosition = (studentId: string, row: number, col: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return { ...s, seatRow: row, seatCol: col };
        }
        // Nếu đã có bạn khác ở vị trí này, hoán đổi
        if (s.seatRow === row && s.seatCol === col) {
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

  // STAR REWARDS
  const addStarLog = (studentId: string, points: number, category: string, reason: string) => {
    const newLog: StarLog = {
      id: `star-${Date.now()}`,
      studentId,
      points,
      category,
      reason,
      createdAt: new Date().toISOString(),
    };
    setStarLogs((prev) => [newLog, ...prev]);
  };

  const getStudentStars = (studentId: string) => {
    return starLogs
      .filter((s) => s.studentId === studentId)
      .reduce((sum, s) => sum + s.points, 0);
  };

  // FINANCE ACTIONS
  const addTransaction = (txData: Omit<ClassFundTransaction, 'id' | 'createdAt'>) => {
    const newTx: ClassFundTransaction = {
      ...txData,
      id: `fund-${Date.now()}`,
    };
    setFundTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setFundTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const resetData = () => {
    localStorage.clear();
    setClassInfo(INITIAL_CLASS);
    setStudents(INITIAL_STUDENTS);
    setAttendances(INITIAL_DAILY_ATTENDANCE);
    setStarLogs(INITIAL_STAR_LOGS);
    setFundTransactions(INITIAL_FUND_TRANSACTIONS);
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        classInfo,
        setClassInfo,
        students,
        currentTerm,
        setCurrentTerm,
        subjectAssessments,
        traitAssessments,
        termSummaries,
        attendances,
        starLogs,
        fundTransactions,
        apiKey,
        setApiKey,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudents,
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
        getStudentStars,
        addTransaction,
        deleteTransaction,
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
