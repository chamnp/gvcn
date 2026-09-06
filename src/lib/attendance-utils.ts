export interface AttendanceRecordLike {
  id?: string;
  studentId?: string;
  date: string;
  status: string;
  hasBoardingMeal: boolean;
  reason?: string;
}

export interface AttendanceSummary {
  present: number;
  excused: number;
  unexcused: number;
  late: number;
  meals: number;
  tracked: number;
  attendanceRate: number | null;
}

export function isSameAttendanceDay(
  left: Pick<AttendanceRecordLike, 'studentId' | 'date'>,
  right: Pick<AttendanceRecordLike, 'studentId' | 'date'>
): boolean {
  return left.studentId === right.studentId && left.date === right.date;
}

export function mergeAttendanceByDay<T extends AttendanceRecordLike>(records: T[], incoming: T): T[] {
  const index = records.findIndex((record) => isSameAttendanceDay(record, incoming));
  if (index < 0) return [...records, incoming];

  const next = [...records];
  next[index] = incoming;
  return next;
}

export function summarizeAttendance(
  records: Array<Pick<AttendanceRecordLike, 'date' | 'status' | 'hasBoardingMeal'>>,
  selectedMonth: string,
  includedDates?: ReadonlySet<string>
): AttendanceSummary {
  const monthRecords = records.filter(
    (record) => record.date.startsWith(`${selectedMonth}-`) && (!includedDates || includedDates.has(record.date))
  );
  const present = monthRecords.filter((record) => record.status === 'CO_MAT').length;
  const excused = monthRecords.filter((record) => record.status === 'VANG_CO_PHEP').length;
  const unexcused = monthRecords.filter((record) => record.status === 'VANG_KHONG_PHEP').length;
  const late = monthRecords.filter((record) => record.status === 'MUON').length;
  const meals = monthRecords.filter(
    (record) => record.hasBoardingMeal && (record.status === 'CO_MAT' || record.status === 'MUON')
  ).length;
  const tracked = present + excused + unexcused + late;

  return {
    present,
    excused,
    unexcused,
    late,
    meals,
    tracked,
    attendanceRate: tracked > 0 ? Math.round(((present + late) / tracked) * 100) : null,
  };
}

export function getCompletedAttendanceDates(
  records: Array<Pick<AttendanceRecordLike, 'studentId' | 'date'>>,
  studentIds: string[],
  selectedMonth: string
): string[] {
  const expectedStudents = new Set(studentIds);
  if (expectedStudents.size === 0) return [];

  const studentsByDate = new Map<string, Set<string>>();
  records.forEach((record) => {
    if (!record.date.startsWith(`${selectedMonth}-`) || !record.studentId || !expectedStudents.has(record.studentId)) return;
    const studentsForDate = studentsByDate.get(record.date) || new Set<string>();
    studentsForDate.add(record.studentId);
    studentsByDate.set(record.date, studentsForDate);
  });

  return [...studentsByDate.entries()]
    .filter(([, recordedStudents]) => recordedStudents.size === expectedStudents.size)
    .map(([date]) => date)
    .sort();
}

export function getUnrecordedStudentIds(
  records: Array<Pick<AttendanceRecordLike, 'studentId' | 'date'>>,
  studentIds: string[],
  date: string
): string[] {
  const recordedStudentIds = new Set(
    records
      .filter((record) => record.date === date)
      .map((record) => record.studentId)
      .filter((studentId): studentId is string => Boolean(studentId))
  );
  return studentIds.filter((studentId) => !recordedStudentIds.has(studentId));
}

export function paginate<T>(items: T[], requestedPage: number, pageSize: number) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    page,
    totalPages,
    totalItems: items.length,
  };
}

export function getIsoDateRange(startDate: string, endDate: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return [];
  if (startDate > endDate) return [];

  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
