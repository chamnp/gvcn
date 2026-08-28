const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgyoekaaefzpymfxfggf.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneW9la2FhZWZ6cHltZnhmZ2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTIzNzMsImV4cCI6MjEwMzMyODM3M30.u4vjLaSoFLoEMCHldS5y_D8meB4TqTwtI8M-E3DHtcI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🚀 Seeding Attendance, Leave Requests, Formative Notes & Assessments...');

  const todayStr = new Date().toISOString().split('T')[0];

  const { data: students } = await supabase.from('Student').select('id, fullName, classId').eq('classId', 'class-4a1');
  if (!students || students.length === 0) return;

  // 1. DAILY ATTENDANCE
  const attendanceRows = students.map((st, idx) => ({
    id: `att-${todayStr}-${st.id}`,
    studentId: st.id,
    date: todayStr,
    status: idx === 3 ? 'VANG_CO_PHEP' : 'CO_MAT',
    hasBoardingMeal: idx !== 3,
    reason: idx === 3 ? 'Gia đình có việc xin nghỉ 1 ngày' : undefined,
  }));

  const { error: attErr } = await supabase.from('DailyAttendance').upsert(attendanceRows);
  if (attErr) console.error('DailyAttendance error:', attErr);
  else console.log('✅ DailyAttendance seeded:', attendanceRows.length);

  // 2. LEAVE REQUESTS
  const leaveRows = [
    {
      id: 'lr-1',
      classId: 'class-4a1',
      studentId: 'hs-4a1-004',
      studentName: 'Phạm Duy Bách',
      parentName: 'Phạm Duy Hải',
      parentPhone: '0978123456',
      startDate: todayStr,
      endDate: todayStr,
      reasonType: 'OM_DAU',
      reasonDetail: 'Cháu bị sốt nhẹ sáng nay, gia đình xin phép cô cho cháu nghỉ 1 ngày ở nhà theo dõi.',
      hasBoardingMealCancel: true,
      medicationNotes: 'Uống thuốc hạ sốt lúc 8h sáng nếu sốt lại',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lr-2',
      classId: 'class-4a1',
      studentId: 'hs-4a1-008',
      studentName: 'Đỗ Nguyễn Thảo Chi',
      parentName: 'Nguyễn Thị Ngọc Thư',
      parentPhone: '0967885815',
      startDate: '2026-08-25',
      endDate: '2026-08-25',
      reasonType: 'KHAM_BENH',
      reasonDetail: 'Gia đình cho cháu đi khám mắt định kỳ tại Viện Mắt TW.',
      hasBoardingMealCancel: true,
      status: 'APPROVED',
      teacherNote: 'Cô đã nhận thông tin và đồng ý cho em Chi nghỉ phép.',
      createdAt: '2026-08-24T18:00:00Z',
      reviewedAt: '2026-08-24T19:30:00Z',
    }
  ];

  const { error: lrErr } = await supabase.from('LeaveRequest').upsert(leaveRows);
  if (lrErr) console.error('LeaveRequest error:', lrErr);
  else console.log('✅ LeaveRequest seeded:', leaveRows.length);

  // 3. FORMATIVE NOTES
  const noteRows = [
    {
      id: 'fn-1',
      studentId: 'hs-4a1-001',
      studentName: 'Vũ Huệ An',
      date: todayStr,
      category: 'TIEN_BO',
      title: 'Phát biểu xây dựng bài sôi nổi',
      content: 'Em An giải bài toán đố nâng cao rất sáng tạo, tự tin giảng lại cho các bạn cùng bàn hiểu.',
      tags: ['Toán học', 'Tự tin'],
      isImportant: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fn-2',
      studentId: 'hs-4a1-003',
      studentName: 'Bùi Gia Bách',
      date: todayStr,
      category: 'CAN_HO_TRO',
      title: 'Cần luyện thêm bảng chia',
      content: 'Em Bách còn nhầm lẫn bảng chia 7 và 8. Cô đã dặn bạn An kèm thêm trong giờ tự học.',
      tags: ['Toán học', 'Cần rèn luyện'],
      isImportant: false,
      createdAt: new Date().toISOString(),
    }
  ];

  const { error: fnErr } = await supabase.from('FormativeNote').upsert(noteRows);
  if (fnErr) console.error('FormativeNote error:', fnErr);
  else console.log('✅ FormativeNote seeded:', noteRows.length);

  // 4. CLASS FUND TRANSACTIONS
  const fundRows = [
    {
      id: 'fund-1',
      classId: 'class-4a1',
      title: 'Thu quỹ phụ huynh đầu năm học 2026 - 2027 (Đợt 1)',
      amount: 12000000,
      type: 'INCOME',
      category: 'HOAT_DONG',
      date: '2026-08-15',
      receiptUrl: '',
      note: 'Thu 300.000đ/học sinh x 40 em (Ban đại diện CMHS quản lý)',
      createdAt: '2026-08-15T08:00:00Z',
    },
    {
      id: 'fund-2',
      classId: 'class-4a1',
      title: 'Mua quà khen thưởng thi đua nề nếp tháng 8 & Tủ sách lớp',
      amount: 2500000,
      type: 'EXPENSE',
      category: 'KHEN_THUONG',
      date: '2026-08-20',
      receiptUrl: '',
      note: 'Mua gôm 3D, sticker lấp lánh, bút viết và 5 cuốn sách mới',
      createdAt: '2026-08-20T10:00:00Z',
    }
  ];

  const { error: fundErr } = await supabase.from('ClassFundTransaction').upsert(fundRows);
  if (fundErr) console.error('ClassFundTransaction error:', fundErr);
  else console.log('✅ ClassFundTransaction seeded:', fundRows.length);

  // 5. SUBJECT ASSESSMENTS (Mẫu cho môn Toán & Tiếng Việt kỳ GIUA_HK1)
  const coreSubjects = ['TOAN', 'TIENG_VIET', 'NGOAI_NGU', 'KHOA_HOC', 'LS_DL', 'TIN_HOC_CN', 'MY_THUAT', 'AM_NHAC', 'GD_THE_CHAT', 'HD_TRAI_NGHIEM', 'DAO_DUC'];
  const subjectAssessments = [];

  students.slice(0, 15).forEach((st, idx) => {
    coreSubjects.forEach((subCode) => {
      const score = subCode === 'TOAN' || subCode === 'TIENG_VIET' ? (idx % 3 === 0 ? 10 : idx % 2 === 0 ? 9 : 8) : undefined;
      const level = idx % 5 === 0 ? 'H' : 'T';
      subjectAssessments.push({
        id: `sa-ghk1-${st.id}-${subCode}`,
        studentId: st.id,
        subjectCode: subCode,
        term: 'GIUA_HK1',
        level: level,
        score: score,
        comment: level === 'T' ? 'Em tiếp thu bài nhanh, nắm vững kiến thức trọng tâm.' : 'Em hoàn thành các yêu cầu môn học, cần chú ý tính toán cẩn thận hơn.',
        updatedAt: new Date().toISOString(),
      });
    });
  });

  const { error: saErr } = await supabase.from('SubjectAssessment').upsert(subjectAssessments);
  if (saErr) console.error('SubjectAssessment error:', saErr);
  else console.log('✅ SubjectAssessment seeded:', subjectAssessments.length);

  // 6. TRAIT ASSESSMENTS
  const traits = [
    { code: 'PC_YEU_NUOC', cat: 'PHAM_CHAT' },
    { code: 'PC_NHAN_AI', cat: 'PHAM_CHAT' },
    { code: 'PC_CHAM_CHI', cat: 'PHAM_CHAT' },
    { code: 'PC_TRUNG_THUC', cat: 'PHAM_CHAT' },
    { code: 'PC_TRACH_NHIEM', cat: 'PHAM_CHAT' },
    { code: 'NL_TU_CHU', cat: 'NL_CHUNG' },
    { code: 'NL_GIAO_TIEP', cat: 'NL_CHUNG' },
    { code: 'NL_GIAI_QUYET_VD', cat: 'NL_CHUNG' },
  ];

  const traitAssessments = [];
  students.slice(0, 15).forEach((st) => {
    traits.forEach((tr) => {
      traitAssessments.push({
        id: `ta-ghk1-${st.id}-${tr.code}`,
        studentId: st.id,
        traitCode: tr.code,
        category: tr.cat,
        term: 'GIUA_HK1',
        level: 'T',
        comment: 'Tích cực rèn luyện và gương mẫu.',
        updatedAt: new Date().toISOString(),
      });
    });
  });

  const { error: taErr } = await supabase.from('TraitAssessment').upsert(traitAssessments);
  if (taErr) console.error('TraitAssessment error:', taErr);
  else console.log('✅ TraitAssessment seeded:', traitAssessments.length);

  console.log('🎉 ALL ASSESSMENTS AND OPERATIONAL DATA SEEDED!');
}

main().catch(console.error);
