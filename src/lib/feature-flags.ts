export interface FeatureFlags {
  // --- NHÓM 1: CÔNG CỤ HÀNG NGÀY CỐT LÕI (MẶC ĐỊNH: TRUE) ---
  attendance: boolean;      // Điểm danh & Bán trú
  behavior: boolean;        // Nề nếp & Tích sao
  dailyNotes: boolean;      // Sổ nhật ký & Nhận xét hàng ngày
  timetable: boolean;       // Thời khóa biểu
  classroomTools: boolean;  // Công cụ Lớp học Smart TV (tích hợp cả Remote)
  homework: boolean;        // Giao bài tập & Cổng học sinh
  students: boolean;        // Hồ sơ học sinh

  // --- NHÓM 2: CHUYÊN MÔN & ĐÁNH GIÁ (MẶC ĐỊNH: FALSE) ---
  assessment: boolean;      // Đánh giá học sinh (chờ thiết kế lại linh hoạt)
  lessonPlans: boolean;     // Giáo án điện tử CV 2345
  matrixExam: boolean;      // Ma trận đề kiểm tra
  iep: boolean;             // Kế hoạch phụ đạo IEP
  aiAssistant: boolean;     // Trợ lý nhận xét AI

  // --- NHÓM 3: TIỆN ÍCH MỞ RỘNG (MẶC ĐỊNH: FALSE) ---
  seatingChart: boolean;    // Sơ đồ lớp học
  parentMeetings: boolean;  // Họp phụ huynh
  readingCorner: boolean;   // Tủ sách lớp học
  moments: boolean;         // Khoảnh khắc lớp
  reports: boolean;         // Sổ chủ nhiệm, Học bạ & Giấy khen
  community: boolean;       // Cộng đồng giáo viên
  healthRecords: boolean;   // Sức khỏe y tế
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  attendance: true,
  behavior: true,
  dailyNotes: true,
  timetable: true,
  classroomTools: true,
  homework: true,
  students: true,

  assessment: false,
  lessonPlans: false,
  matrixExam: false,
  iep: false,
  aiAssistant: false,
  seatingChart: false,
  parentMeetings: false,
  readingCorner: false,
  moments: false,
  reports: false,
  community: false,
  healthRecords: false,
};

const FEATURE_FLAGS_STORAGE_KEY = 'gvcn_feature_flags';

export function getStoredFeatureFlags(): FeatureFlags {
  if (typeof window === 'undefined') return { ...DEFAULT_FEATURE_FLAGS };
  try {
    const raw = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FEATURE_FLAGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FEATURE_FLAGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_FEATURE_FLAGS };
  }
}

export function saveFeatureFlags(flags: FeatureFlags): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(flags));
  } catch (err) {
    console.error('Failed to save feature flags to localStorage:', err);
  }
}

export function resetStoredFeatureFlags(): FeatureFlags {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);
    } catch {}
  }
  return { ...DEFAULT_FEATURE_FLAGS };
}
