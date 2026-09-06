import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateMcpRequest, AuthenticatedTeacherContext } from '@/lib/mcp-auth';

export const dynamic = 'force-dynamic';

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const configured = (process.env.EXTENSION_ALLOWED_ORIGINS || 'https://gvcn-eta.vercel.app')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedOrigin =
    configured.includes(origin) || origin.startsWith('chrome-extension://') ? origin : configured[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

function json(req: NextRequest, body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders(req) });
}

async function resolveClass(auth: AuthenticatedTeacherContext, requestedClass: string | null) {
  const isAdmin = auth.role === 'ADMIN' || auth.role === 'ADMIN_TEACHER';
  const requested = requestedClass?.replace(/^Lớp\s+/i, '').trim();
  if (requested && !isAdmin && requested !== auth.classId && requested !== auth.className) {
    throw new Error('Bạn không có quyền truy cập lớp này.');
  }

  const lookup = requested || auth.classId || auth.className;
  if (!lookup) throw new Error('Tài khoản chưa được phân công lớp.');
  const { data, error } = await supabase
    .from('Class')
    .select('*')
    .or(`id.eq.${lookup},name.eq.${lookup}`)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Không thể tải thông tin lớp: ${error.message}`);
  if (!data) throw new Error('Không tìm thấy lớp được yêu cầu.');
  return data;
}

export async function GET(req: NextRequest) {
  const auth = await authenticateMcpRequest(
    req.headers.get('Authorization'),
    req.nextUrl.searchParams.get('key')
  );
  if (!auth.isAuthenticated) return json(req, { success: false, error: auth.error }, 401);

  try {
    const classRecord = await resolveClass(auth, req.nextUrl.searchParams.get('class'));
    const today = new Date().toISOString().split('T')[0];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const todayDow = dayNames[new Date().getDay()];
    const effectiveDay = ['T2', 'T3', 'T4', 'T5', 'T6'].includes(todayDow) ? todayDow : null;

    const [teacherResult, schoolResult, studentsResult, classesResult, timetableResult, attendanceResult] =
      await Promise.all([
        supabase.from('Teacher').select('email, fullName, role, assignedClassName, avatarUrl').eq('email', auth.teacherEmail).maybeSingle(),
        supabase.from('SchoolInfo').select('*').limit(1).maybeSingle(),
        supabase.from('Student').select('*').eq('classId', classRecord.id).order('fullName'),
        auth.role === 'ADMIN' || auth.role === 'ADMIN_TEACHER'
          ? supabase.from('Class').select('*').order('grade').order('name')
          : supabase.from('Class').select('*').eq('id', classRecord.id),
        effectiveDay
          ? supabase.from('TimetableSlot').select('*').eq('classId', classRecord.id).eq('day', effectiveDay).order('period')
          : Promise.resolve({ data: [], error: null }),
        supabase.from('DailyAttendance').select('*').eq('date', today),
      ]);

    const firstError = [teacherResult, schoolResult, studentsResult, classesResult, timetableResult, attendanceResult]
      .map((result) => result.error)
      .find(Boolean);
    if (firstError) throw new Error(firstError.message);

    const students = studentsResult.data || [];
    const studentIds = students.map((student) => student.id);
    const [{ data: starLogs, error: starError }, { data: classAttendance, error: attendanceFilterError }] =
      await Promise.all([
        studentIds.length
          ? supabase.from('StarLog').select('studentId, points').in('studentId', studentIds)
          : Promise.resolve({ data: [], error: null }),
        studentIds.length
          ? supabase.from('DailyAttendance').select('*').eq('date', today).in('studentId', studentIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
    if (starError) throw new Error(starError.message);
    if (attendanceFilterError) throw new Error(attendanceFilterError.message);

    const starMap: Record<string, number> = {};
    for (const log of starLogs || []) {
      starMap[log.studentId] = (starMap[log.studentId] || 0) + Number(log.points || 0);
    }
    const attendance = classAttendance || [];
    const absentRecords = attendance.filter((item) =>
      item.status === 'VANG_CO_PHEP' || item.status === 'VANG_KHONG_PHEP'
    );
    const studentNameById = new Map(students.map((student) => [student.id, student.fullName]));
    const teacher = teacherResult.data;
    const school = schoolResult.data;

    return json(req, {
      success: true,
      syncTimestamp: new Date().toISOString(),
      teacher: {
        email: teacher?.email || auth.teacherEmail,
        fullName: teacher?.fullName || auth.teacherName,
        role: teacher?.role || auth.role,
        assignedClassName: teacher?.assignedClassName || classRecord.name,
        schoolName: school?.name || classRecord.schoolName || '',
        avatarUrl: teacher?.avatarUrl || '',
      },
      currentClass: {
        name: classRecord.name,
        grade: classRecord.grade,
        schoolYear: classRecord.schoolYear || school?.schoolYear || '',
        totalStudents: students.length,
        maleCount: students.filter((student) => student.gender === 'Nam').length,
        femaleCount: students.filter((student) => student.gender === 'Nữ').length,
        boardingCount: students.filter((student) => student.isBoarding).length,
      },
      availableClasses: (classesResult.data || []).map((item) => ({
        id: item.id,
        name: item.name,
        grade: item.grade,
        teacherName: item.teacherName,
        totalStudents: item.totalStudents,
      })),
      todayAttendance: {
        date: today,
        total: students.length,
        recorded: attendance.length,
        present: attendance.filter((item) => item.status === 'CO_MAT').length,
        absent: absentRecords.length,
        late: attendance.filter((item) => item.status === 'MUON').length,
        absentList: absentRecords.map((item) => ({
          studentId: item.studentId,
          studentName: studentNameById.get(item.studentId) || '',
          status: item.status,
          reason: item.reason || '',
        })),
        boarding: attendance.filter((item) => item.hasBoardingMeal).length,
      },
      timetable: timetableResult.data || [],
      students: students.map((student) => ({ ...student, stars: starMap[student.id] || 0 })),
    });
  } catch (error: any) {
    const status = error?.message?.includes('không có quyền') ? 403 : 500;
    return json(req, { success: false, error: error?.message || 'Không thể đồng bộ dữ liệu.' }, status);
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateMcpRequest(req.headers.get('Authorization'), null);
  if (!auth.isAuthenticated) return json(req, { success: false, error: auth.error }, 401);

  try {
    const body = await req.json();
    if (body.action !== 'add_star') return json(req, { success: false, error: 'Thao tác không hợp lệ.' }, 400);
    if (!body.studentId) return json(req, { success: false, error: 'Thiếu mã học sinh.' }, 400);

    let studentQuery = supabase.from('Student').select('id, fullName').eq('id', body.studentId);
    if (auth.classId) studentQuery = studentQuery.eq('classId', auth.classId);
    const { data: student, error: studentError } = await studentQuery.maybeSingle();
    if (studentError) throw new Error(studentError.message);
    if (!student) return json(req, { success: false, error: 'Không tìm thấy học sinh trong lớp được phân công.' }, 403);

    const points = Number(body.points);
    if (!Number.isInteger(points) || points < -10 || points > 10 || points === 0) {
      return json(req, { success: false, error: 'Số sao phải là số nguyên từ -10 đến 10 và khác 0.' }, 400);
    }
    const record = {
      id: `star-ext-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      studentId: student.id,
      points,
      category: String(body.category || 'Khác').slice(0, 100),
      reason: String(body.reason || 'Ghi nhận từ tiện ích GVCN Pro').slice(0, 500),
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('StarLog').insert(record);
    if (error) throw new Error(error.message);
    return json(req, { success: true, message: `Đã ghi ${points > 0 ? '+' : ''}${points} sao cho ${student.fullName}.`, record });
  } catch (error: any) {
    return json(req, { success: false, error: error?.message || 'Không thể lưu thao tác.' }, 500);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}
