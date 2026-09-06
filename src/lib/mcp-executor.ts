import { supabase } from '@/lib/supabase';
import { generateSmartComment } from '@/lib/comment-bank';
import { generateAILessonPlan } from '@/lib/lesson-plan-engine';
import { generateAISpeechScript } from '@/lib/parent-meeting-engine';
import { getAcademicYearByDate, getLocalDateString, getCurrentTermByDate, evaluateStudentTT27 } from '@/lib/tt27-engine';

type McpAuthContext = {
  classId?: string;
  className?: string;
  teacherName?: string;
  role?: string;
};

function assertDbResult(error: { message: string } | null, operation: string) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

function applyClassScope<T>(query: T, classId: string): T {
  if (!classId) return query;
  return (query as any).eq('classId', classId);
}

async function getClassStudentIds(classId: string): Promise<string[]> {
  let query = supabase.from('Student').select('id');
  query = applyClassScope(query, classId);
  const { data, error } = await query;
  assertDbResult(error, 'Không thể tải danh sách học sinh');
  return (data || []).map((student) => student.id);
}

async function getAuthorizedStudent(studentId: string, classId: string) {
  if (!studentId) throw new Error('Thiếu mã học sinh.');
  let query = supabase.from('Student').select('*').eq('id', studentId);
  query = applyClassScope(query, classId);
  const { data, error } = await query.maybeSingle();
  assertDbResult(error, 'Không thể xác minh học sinh');
  if (!data) throw new Error('Không tìm thấy học sinh trong lớp được phân công.');
  return data;
}

export async function executeTool(
  name: string,
  args: Record<string, any>,
  auth: McpAuthContext
): Promise<any> {
  const classId = auth.classId || '';

  switch (name) {
    case 'get_class_overview': {
      const todayDate = args.date || getLocalDateString();
      const currentTerm = args.term || getCurrentTermByDate();
      const dayMap: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6' };
      const currentDay = dayMap[new Date().getDay()] || 'T2';

      let studentQuery = supabase.from('Student').select('*').order('fullName');
      studentQuery = applyClassScope(studentQuery, classId);

      let timetableQuery = supabase.from('TimetableSlot').select('*').eq('day', currentDay).order('period');
      timetableQuery = applyClassScope(timetableQuery, classId);

      const [studentsResult, classResult, schoolResult, timetableResult] = await Promise.all([
        studentQuery,
        classId
          ? supabase.from('Class').select('*').eq('id', classId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('SchoolInfo').select('*').limit(1).maybeSingle(),
        timetableQuery,
      ]);
      assertDbResult(studentsResult.error, 'Không thể tải tổng quan lớp');
      assertDbResult(classResult.error, 'Không thể tải thông tin lớp');
      assertDbResult(schoolResult.error, 'Không thể tải thông tin trường');
      assertDbResult(timetableResult.error, 'Không thể tải thời khóa biểu');

      const students = studentsResult.data || [];
      const classRecord = classResult.data;
      const studentIds = students.map((s) => s.id);

      // Điểm danh hôm nay
      let attendanceToday = {
        totalClass: students.length,
        presentCount: students.length,
        absentCount: 0,
        lateCount: 0,
        boardingMealsCount: students.filter((s) => s.isBoarding).length,
        isRecorded: false,
      };

      let assessmentSummary = {
        term: currentTerm,
        xuatSac: 0,
        tieuBieu: 0,
        hoanThanh: 0,
        chuaHoanThanh: 0,
        chuaDanhGia: students.length,
      };

      if (studentIds.length > 0) {
        const [attResult, subResult, traitResult, summaryResult] = await Promise.all([
          supabase.from('DailyAttendance').select('*').eq('date', todayDate).in('studentId', studentIds),
          supabase.from('SubjectAssessment').select('*').eq('term', currentTerm).in('studentId', studentIds),
          supabase.from('TraitAssessment').select('*').eq('term', currentTerm).in('studentId', studentIds),
          supabase.from('TermSummary').select('*').eq('term', currentTerm).in('studentId', studentIds),
        ]);

        if (attResult.data && attResult.data.length > 0) {
          const records = attResult.data;
          const presentDirect = records.filter((r) => r.status === 'CO_MAT').length;
          const late = records.filter((r) => r.status === 'MUON').length;
          const excused = records.filter((r) => r.status === 'VANG_CO_PHEP').length;
          const unexcused = records.filter((r) => r.status === 'VANG_KHONG_PHEP').length;
          const meals = records.filter((r) => r.hasBoardingMeal && (r.status === 'CO_MAT' || r.status === 'MUON')).length;

          attendanceToday = {
            totalClass: students.length,
            presentCount: presentDirect + late,
            absentCount: excused + unexcused,
            lateCount: late,
            boardingMealsCount: meals,
            isRecorded: true,
          };
        }

        const subData = subResult.data || [];
        const traitData = traitResult.data || [];
        const sumData = summaryResult.data || [];

        let xs = 0;
        let tb = 0;
        let ht = 0;
        let cht = 0;
        let cdg = 0;

        students.forEach((st) => {
          const sAss = subData.filter((a) => a.studentId === st.id);
          const tAss = traitData.filter((a) => a.studentId === st.id);
          const sum = sumData.find((s) => s.studentId === st.id);

          if (!sum && sAss.length === 0 && tAss.length === 0) {
            cdg++;
            return;
          }

          const award = sum?.awardTitle || evaluateStudentTT27(sAss, tAss, currentTerm).awardTitle;
          if (award === 'Học sinh Xuất sắc') xs++;
          else if (award === 'Học sinh Tiêu biểu hoàn thành tốt') tb++;
          else if (award === 'Hoàn thành chương trình lớp học' || award === 'Khen thưởng từng mặt') ht++;
          else cht++;
        });

        assessmentSummary = {
          term: currentTerm,
          xuatSac: xs,
          tieuBieu: tb,
          hoanThanh: ht,
          chuaHoanThanh: cht,
          chuaDanhGia: cdg,
        };
      }

      return {
        className: classRecord?.name || auth.className || '',
        grade: classRecord?.grade || null,
        schoolYear: classRecord?.schoolYear || schoolResult.data?.schoolYear || getAcademicYearByDate(),
        teacherName: classRecord?.teacherName || auth.teacherName || '',
        totalStudents: students.length,
        genderDistribution: {
          male: students.filter((student) => student.gender === 'Nam').length,
          female: students.filter((student) => student.gender === 'Nữ').length,
        },
        boardingStudents: students.filter((student) => student.isBoarding).length,
        todayDate,
        dayOfWeek: currentDay,
        attendanceToday,
        timetableToday: (timetableResult.data || []).map((slot: any) => ({
          period: slot.period,
          subjectCode: slot.subjectCode,
          subjectName: slot.subjectName,
          room: slot.room,
        })),
        assessmentSummary,
        students: students.map((s: any) => ({
          id: s.id,
          fullName: s.fullName,
          studentCode: s.studentCode,
          gender: s.gender,
          dateOfBirth: s.dateOfBirth,
          isBoarding: s.isBoarding,
          teamId: s.teamId,
        })),
        standardCompliance: 'Thông tư 27/2020/TT-BGDĐT & Công văn 2345/BGDĐT-GDTH',
      };
    }

    case 'get_students': {
      let query = supabase.from('Student').select('*');
      query = applyClassScope(query, classId);
      if (args.teamId !== undefined) query = query.eq('teamId', args.teamId);
      if (args.gender) query = query.eq('gender', args.gender);
      if (args.isBoarding !== undefined) query = query.eq('isBoarding', args.isBoarding);
      if (args.search) {
        const search = String(args.search).replace(/[%_,()]/g, '').trim();
        if (search) query = query.or(`fullName.ilike.%${search}%,studentCode.ilike.%${search}%`);
      }
      const { data, error } = await query.order('fullName').limit(100);
      assertDbResult(error, 'Không thể tải danh sách học sinh');
      return data || [];
    }

    case 'get_student_detail': {
      let studentQuery = supabase.from('Student').select('*');
      studentQuery = applyClassScope(studentQuery, classId);
      if (args.studentId) studentQuery = studentQuery.eq('id', args.studentId);
      else if (args.studentName) studentQuery = studentQuery.ilike('fullName', `%${String(args.studentName).replace(/[%_]/g, '')}%`);
      else throw new Error('Cần cung cấp studentId hoặc studentName.');

      const { data: student, error: studentError } = await studentQuery.limit(1).maybeSingle();
      assertDbResult(studentError, 'Không thể tải hồ sơ học sinh');
      if (!student) throw new Error('Không tìm thấy học sinh trong lớp được phân công.');

      const [assessments, traits, stars, health] = await Promise.all([
        supabase.from('SubjectAssessment').select('*').eq('studentId', student.id),
        supabase.from('TraitAssessment').select('*').eq('studentId', student.id),
        supabase.from('StarLog').select('points').eq('studentId', student.id),
        supabase.from('HealthRecord').select('*').eq('studentId', student.id).maybeSingle(),
      ]);
      assertDbResult(assessments.error, 'Không thể tải đánh giá môn học');
      assertDbResult(traits.error, 'Không thể tải đánh giá phẩm chất/năng lực');
      assertDbResult(stars.error, 'Không thể tải điểm sao');
      assertDbResult(health.error, 'Không thể tải hồ sơ sức khỏe');

      return {
        student,
        healthRecord: health.data,
        totalStarsAccumulated: (stars.data || []).reduce((sum, item) => sum + Number(item.points || 0), 0),
        subjectAssessments: assessments.data || [],
        traitAssessments: traits.data || [],
      };
    }

    case 'get_subject_assessments': {
      const studentIds = await getClassStudentIds(classId);
      if (classId && studentIds.length === 0) return [];
      let query = supabase.from('SubjectAssessment').select('*').eq('term', args.term || 'CUOI_HK1');
      if (classId) query = query.in('studentId', studentIds);
      if (args.subjectCode) query = query.eq('subjectCode', args.subjectCode);
      const { data, error } = await query.limit(500);
      assertDbResult(error, 'Không thể tải đánh giá môn học');
      return data || [];
    }

    case 'update_subject_assessment': {
      await getAuthorizedStudent(args.studentId, classId);
      const record = {
        studentId: args.studentId,
        subjectCode: args.subjectCode,
        term: args.term,
        level: args.level,
        score: args.score !== undefined ? args.score : null,
        comment: args.comment || '',
        updatedAt: new Date().toISOString(),
      };
      const existing = await supabase
        .from('SubjectAssessment')
        .select('id')
        .eq('studentId', record.studentId)
        .eq('subjectCode', record.subjectCode)
        .eq('term', record.term)
        .maybeSingle();
      assertDbResult(existing.error, 'Không thể kiểm tra đánh giá môn học');
      const mutation = existing.data
        ? await supabase.from('SubjectAssessment').update(record).eq('id', existing.data.id)
        : await supabase.from('SubjectAssessment').insert({ ...record, id: `sa-${Date.now()}` });
      assertDbResult(mutation.error, 'Không thể lưu đánh giá môn học');
      return { success: true, assessment: { ...record, id: existing.data?.id } };
    }

    case 'get_trait_assessments': {
      const studentIds = await getClassStudentIds(classId);
      if (classId && studentIds.length === 0) return [];
      let query = supabase.from('TraitAssessment').select('*').eq('term', args.term || 'CUOI_HK1');
      if (classId) query = query.in('studentId', studentIds);
      if (args.traitCode) query = query.eq('traitCode', args.traitCode);
      const { data, error } = await query.limit(1000);
      assertDbResult(error, 'Không thể tải đánh giá phẩm chất/năng lực');
      return data || [];
    }

    case 'update_trait_assessment': {
      await getAuthorizedStudent(args.studentId, classId);
      const record = {
        studentId: args.studentId,
        traitCode: args.traitCode,
        term: args.term,
        level: args.level,
        comment: args.comment || '',
        updatedAt: new Date().toISOString(),
      };
      const existing = await supabase
        .from('TraitAssessment')
        .select('id')
        .eq('studentId', record.studentId)
        .eq('traitCode', record.traitCode)
        .eq('term', record.term)
        .maybeSingle();
      assertDbResult(existing.error, 'Không thể kiểm tra đánh giá phẩm chất/năng lực');
      const mutation = existing.data
        ? await supabase.from('TraitAssessment').update(record).eq('id', existing.data.id)
        : await supabase.from('TraitAssessment').insert({ ...record, id: `ta-${Date.now()}` });
      assertDbResult(mutation.error, 'Không thể lưu đánh giá phẩm chất/năng lực');
      return { success: true, assessment: { ...record, id: existing.data?.id } };
    }

    case 'get_attendance_today': {
      const date = args.date || new Date().toISOString().split('T')[0];
      const studentIds = await getClassStudentIds(classId);
      if (classId && studentIds.length === 0) {
        return { date, totalClass: 0, presentCount: 0, absentCount: 0, boardingMealsCount: 0, records: [] };
      }
      let query = supabase.from('DailyAttendance').select('*').eq('date', date);
      if (classId) query = query.in('studentId', studentIds);
      const { data, error } = await query;
      assertDbResult(error, 'Không thể tải điểm danh');
      const records = data || [];
      return {
        date,
        totalClass: studentIds.length,
        presentCount: records.filter((item) => item.status === 'CO_MAT').length,
        absentCount: records.filter((item) => item.status === 'VANG_CO_PHEP' || item.status === 'VANG_KHONG_PHEP').length,
        lateCount: records.filter((item) => item.status === 'MUON').length,
        boardingMealsCount: records.filter((item) => item.hasBoardingMeal).length,
        records,
      };
    }

    case 'mark_attendance': {
      await getAuthorizedStudent(args.studentId, classId);
      const date = args.date || new Date().toISOString().split('T')[0];
      const statusMap: Record<string, string> = {
        PRESENT: 'CO_MAT',
        ABSENT_EXCUSED: 'VANG_CO_PHEP',
        ABSENT_UNEXCUSED: 'VANG_KHONG_PHEP',
        LATE: 'MUON',
      };
      const status = statusMap[args.status] || args.status;
      if (!['CO_MAT', 'VANG_CO_PHEP', 'VANG_KHONG_PHEP', 'MUON'].includes(status)) {
        throw new Error('Trạng thái điểm danh không hợp lệ.');
      }
      const record = {
        studentId: args.studentId,
        date,
        status,
        hasBoardingMeal: args.hasBoardingMeal !== undefined ? args.hasBoardingMeal : status === 'CO_MAT',
        reason: args.reason || '',
      };
      const existing = await supabase
        .from('DailyAttendance')
        .select('id')
        .eq('studentId', record.studentId)
        .eq('date', date)
        .maybeSingle();
      assertDbResult(existing.error, 'Không thể kiểm tra điểm danh');
      const mutation = existing.data
        ? await supabase.from('DailyAttendance').update(record).eq('id', existing.data.id)
        : await supabase.from('DailyAttendance').insert({ ...record, id: `att-${Date.now()}` });
      assertDbResult(mutation.error, 'Không thể lưu điểm danh');
      return { success: true, attendance: { ...record, id: existing.data?.id } };
    }

    case 'get_star_leaderboard': {
      let studentQuery = supabase.from('Student').select('id, fullName, studentCode');
      studentQuery = applyClassScope(studentQuery, classId);
      const { data: students, error: studentError } = await studentQuery;
      assertDbResult(studentError, 'Không thể tải học sinh');
      const studentIds = (students || []).map((student) => student.id);
      if (studentIds.length === 0) return { leaderboard: [] };
      const { data: logs, error: logError } = await supabase
        .from('StarLog')
        .select('studentId, points')
        .in('studentId', studentIds);
      assertDbResult(logError, 'Không thể tải điểm sao');
      const totals = new Map<string, number>();
      for (const log of logs || []) totals.set(log.studentId, (totals.get(log.studentId) || 0) + Number(log.points || 0));
      const limit = Math.max(1, Math.min(Number(args.limit) || 10, 100));
      const leaderboard = (students || [])
        .map((student) => ({ ...student, stars: totals.get(student.id) || 0 }))
        .sort((a, b) => b.stars - a.stars)
        .slice(0, limit)
        .map((student, index) => ({ rank: index + 1, ...student }));
      return { leaderboard };
    }

    case 'add_star_points': {
      const student = await getAuthorizedStudent(args.studentId, classId);
      const points = Number(args.points);
      const reason = typeof args.reason === 'string' ? args.reason.trim() : '';
      if (!Number.isInteger(points) || points === 0 || points < -10 || points > 10) {
        throw new Error('Số sao phải là số nguyên khác 0 trong khoảng -10 đến 10.');
      }
      if (reason.length < 2 || reason.length > 200) {
        throw new Error('Lý do cộng/trừ sao không hợp lệ.');
      }
      const record = {
        id: `star-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        studentId: args.studentId,
        classId: student.classId,
        points,
        category: args.category || 'Khác',
        reason,
        date: getLocalDateString(),
        createdAt: new Date().toISOString(),
      };
      const { error } = await supabase.from('StarLog').insert(record);
      assertDbResult(error, 'Không thể lưu điểm sao');
      return { success: true, starLog: record };
    }

    case 'get_timetable': {
      let query = supabase.from('TimetableSlot').select('*');
      query = applyClassScope(query, classId);
      if (args.day) query = query.eq('day', args.day);
      const { data, error } = await query.order('day').order('period');
      assertDbResult(error, 'Không thể tải thời khóa biểu');
      return { schedule: data || [] };
    }

    case 'get_lesson_plans': {
      let query = supabase.from('LessonPlan').select('data').order('updatedAt', { ascending: false });
      query = applyClassScope(query, classId);
      if (args.week !== undefined) query = query.eq('week', args.week);
      if (args.subjectCode) query = query.eq('subjectCode', args.subjectCode);
      const { data, error } = await query;
      assertDbResult(error, 'Không thể tải kế hoạch bài dạy');
      return (data || []).map((row) => row.data);
    }

    case 'generate_lesson_plan': {
      return {
        ...generateAILessonPlan(
          args.title,
          args.subjectCode || 'TOAN',
          args.grade || 4,
          'KET_NOI_TRI_THUC',
          args.week || 1,
          args.periodNumber || 1
        ),
        generationMode: 'PEDAGOGICAL_TEMPLATE',
      };
    }

    case 'generate_parent_meeting': {
      const [classResult, schoolResult, studentIds] = await Promise.all([
        classId
          ? supabase.from('Class').select('*').eq('id', classId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('SchoolInfo').select('*').limit(1).maybeSingle(),
        getClassStudentIds(classId),
      ]);
      assertDbResult(classResult.error, 'Không thể tải thông tin lớp');
      assertDbResult(schoolResult.error, 'Không thể tải thông tin trường');
      const classInfo = classResult.data || {
        id: classId,
        name: auth.className || '',
        grade: null,
        teacherName: auth.teacherName || '',
      };
      const schoolInfo = schoolResult.data || { name: '', schoolYear: getAcademicYearByDate() };
      return {
        meetingType: args.meetingType,
        speechScript: generateAISpeechScript(args.meetingType || 'DAU_NAM', classInfo as any, schoolInfo as any, studentIds.length),
        generationMode: 'PEDAGOGICAL_TEMPLATE',
      };
    }

    case 'generate_student_comment': {
      const student = await getAuthorizedStudent(args.studentId, classId);
      const term = args.term || 'CUOI_HK1';
      const [subjects, traits, stars, attendance] = await Promise.all([
        supabase.from('SubjectAssessment').select('*').eq('studentId', student.id).eq('term', term),
        supabase.from('TraitAssessment').select('*').eq('studentId', student.id).eq('term', term),
        supabase.from('StarLog').select('*').eq('studentId', student.id),
        supabase.from('DailyAttendance').select('*').eq('studentId', student.id),
      ]);
      assertDbResult(subjects.error, 'Không thể tải đánh giá môn học');
      assertDbResult(traits.error, 'Không thể tải đánh giá phẩm chất/năng lực');
      assertDbResult(stars.error, 'Không thể tải điểm sao');
      assertDbResult(attendance.error, 'Không thể tải chuyên cần');
      return {
        studentId: student.id,
        term,
        comment: generateSmartComment(student, subjects.data || [], traits.data || [], undefined, stars.data || [], attendance.data || []),
        generationMode: 'PEDAGOGICAL_TEMPLATE',
      };
    }

    case 'get_homeworks': {
      let query = supabase.from('HomeworkAssignment').select('*');
      query = applyClassScope(query, classId);
      if (args.subjectCode) query = query.eq('subjectCode', args.subjectCode);
      const { data, error } = await query.order('createdAt', { ascending: false }).limit(100);
      assertDbResult(error, 'Không thể tải bài tập');
      return data || [];
    }

    case 'create_homework': {
      const classRecord = classId
        ? await supabase.from('Class').select('name').eq('id', classId).maybeSingle()
        : { data: null, error: null };
      assertDbResult(classRecord.error, 'Không thể tải thông tin lớp');
      const today = new Date().toISOString().split('T')[0];
      const record = {
        id: `hw-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        classId,
        className: classRecord.data?.name || auth.className || '',
        subjectCode: args.subjectCode,
        subjectName: args.subjectName || args.subjectCode,
        title: args.title,
        description: args.description,
        assignedDate: today,
        dueDate: args.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      const { error } = await supabase.from('HomeworkAssignment').insert(record);
      assertDbResult(error, 'Không thể lưu bài tập');
      return { success: true, homework: record };
    }

    default:
      throw new Error(`Công cụ không tồn tại: ${name}`);
  }
}
