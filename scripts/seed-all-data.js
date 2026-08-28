const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgyoekaaefzpymfxfggf.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneW9la2FhZWZ6cHltZnhmZ2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTIzNzMsImV4cCI6MjEwMzMyODM3M30.u4vjLaSoFLoEMCHldS5y_D8meB4TqTwtI8M-E3DHtcI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🚀 Starting Comprehensive Supabase Seeding...');

  // 1. TIMETABLE
  const INITIAL_TIMETABLE = [
    { id: 't2-p1', classId: 'class-4a1', day: 'T2', period: 1, session: 'MORNING', subjectCode: 'CHAO_CO', subjectName: 'Sinh hoạt dưới cờ', note: 'Mặc đồng phục, quàng khăn đỏ' },
    { id: 't2-p2', classId: 'class-4a1', day: 'T2', period: 2, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Đọc)' },
    { id: 't2-p3', classId: 'class-4a1', day: 'T2', period: 3, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
    { id: 't2-p4', classId: 'class-4a1', day: 'T2', period: 4, session: 'MORNING', subjectCode: 'DAO_DUC', subjectName: 'Đạo đức' },
    { id: 't2-p5', classId: 'class-4a1', day: 'T2', period: 5, session: 'AFTERNOON', subjectCode: 'NGOAI_NGU', subjectName: 'Tiếng Anh' },
    { id: 't2-p6', classId: 'class-4a1', day: 'T2', period: 6, session: 'AFTERNOON', subjectCode: 'GD_THE_CHAT', subjectName: 'Giáo dục thể chất', note: 'Mang giày bata thể thao' },
    { id: 't2-p7', classId: 'class-4a1', day: 'T2', period: 7, session: 'AFTERNOON', subjectCode: 'TU_HOC', subjectName: 'Tự học có hướng dẫn' },

    { id: 't3-p1', classId: 'class-4a1', day: 'T3', period: 1, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
    { id: 't3-p2', classId: 'class-4a1', day: 'T3', period: 2, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Viết)' },
    { id: 't3-p3', classId: 'class-4a1', day: 'T3', period: 3, session: 'MORNING', subjectCode: 'KHOA_HOC', subjectName: 'Khoa học' },
    { id: 't3-p4', classId: 'class-4a1', day: 'T3', period: 4, session: 'MORNING', subjectCode: 'AM_NHAC', subjectName: 'Âm nhạc', note: 'Mang thanh phách' },
    { id: 't3-p5', classId: 'class-4a1', day: 'T3', period: 5, session: 'AFTERNOON', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Luyện từ & câu)' },
    { id: 't3-p6', classId: 'class-4a1', day: 'T3', period: 6, session: 'AFTERNOON', subjectCode: 'TIN_HOC_CN', subjectName: 'Tin học & Công nghệ', note: 'Học phòng máy tính' },
    { id: 't3-p7', classId: 'class-4a1', day: 'T3', period: 7, session: 'AFTERNOON', subjectCode: 'HD_TRAI_NGHIEM', subjectName: 'Hoạt động trải nghiệm' },

    { id: 't4-p1', classId: 'class-4a1', day: 'T4', period: 1, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Đọc)' },
    { id: 't4-p2', classId: 'class-4a1', day: 'T4', period: 2, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
    { id: 't4-p3', classId: 'class-4a1', day: 'T4', period: 3, session: 'MORNING', subjectCode: 'LS_DL', subjectName: 'Lịch sử & Địa lý' },
    { id: 't4-p4', classId: 'class-4a1', day: 'T4', period: 4, session: 'MORNING', subjectCode: 'MY_THUAT', subjectName: 'Mỹ thuật', note: 'Mang hộp sáp màu và giấy A4' },
    { id: 't4-p5', classId: 'class-4a1', day: 'T4', period: 5, session: 'AFTERNOON', subjectCode: 'NGOAI_NGU', subjectName: 'Tiếng Anh' },
    { id: 't4-p6', classId: 'class-4a1', day: 'T4', period: 6, session: 'AFTERNOON', subjectCode: 'GD_THE_CHAT', subjectName: 'Giáo dục thể chất' },
    { id: 't4-p7', classId: 'class-4a1', day: 'T4', period: 7, session: 'AFTERNOON', subjectCode: 'TU_HOC', subjectName: 'Tự học có hướng dẫn' },

    { id: 't5-p1', classId: 'class-4a1', day: 'T5', period: 1, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
    { id: 't5-p2', classId: 'class-4a1', day: 'T5', period: 2, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Viết đoạn văn)' },
    { id: 't5-p3', classId: 'class-4a1', day: 'T5', period: 3, session: 'MORNING', subjectCode: 'KHOA_HOC', subjectName: 'Khoa học' },
    { id: 't5-p4', classId: 'class-4a1', day: 'T5', period: 4, session: 'MORNING', subjectCode: 'NGOAI_NGU', subjectName: 'Tiếng Anh' },
    { id: 't5-p5', classId: 'class-4a1', day: 'T5', period: 5, session: 'AFTERNOON', subjectCode: 'LS_DL', subjectName: 'Lịch sử & Địa lý' },
    { id: 't5-p6', classId: 'class-4a1', day: 'T5', period: 6, session: 'AFTERNOON', subjectCode: 'TIN_HOC_CN', subjectName: 'Tin học & Công nghệ' },
    { id: 't5-p7', classId: 'class-4a1', day: 'T5', period: 7, session: 'AFTERNOON', subjectCode: 'HD_TRAI_NGHIEM', subjectName: 'Hoạt động trải nghiệm' },

    { id: 't6-p1', classId: 'class-4a1', day: 'T6', period: 1, session: 'MORNING', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Nói & Nghe)' },
    { id: 't6-p2', classId: 'class-4a1', day: 'T6', period: 2, session: 'MORNING', subjectCode: 'TOAN', subjectName: 'Toán học' },
    { id: 't6-p3', classId: 'class-4a1', day: 'T6', period: 3, session: 'MORNING', subjectCode: 'NGOAI_NGU', subjectName: 'Tiếng Anh' },
    { id: 't6-p4', classId: 'class-4a1', day: 'T6', period: 4, session: 'MORNING', subjectCode: 'HD_TRAI_NGHIEM', subjectName: 'Hoạt động trải nghiệm' },
    { id: 't6-p5', classId: 'class-4a1', day: 'T6', period: 5, session: 'AFTERNOON', subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt (Ôn tập cuối tuần)' },
    { id: 't6-p6', classId: 'class-4a1', day: 'T6', period: 6, session: 'AFTERNOON', subjectCode: 'TU_HOC', subjectName: 'Tự học có hướng dẫn' },
    { id: 't6-p7', classId: 'class-4a1', day: 'T6', period: 7, session: 'AFTERNOON', subjectCode: 'SINH_HOAT_LOP', subjectName: 'Sinh hoạt lớp cuối tuần', note: 'Bình xét thi đua tuần' },
  ];

  const { error: ttErr } = await supabase.from('TimetableSlot').upsert(INITIAL_TIMETABLE);
  if (ttErr) console.error('TimetableSlot error:', ttErr);
  else console.log('✅ TimetableSlot seeded:', INITIAL_TIMETABLE.length);

  // 2. IEP PLANS
  const INITIAL_IEP_PLANS = [
    {
      id: 'iep-1',
      studentId: 'hs-4a1-003',
      studentName: 'Bùi Gia Bách',
      classId: 'class-4a1',
      category: 'CAN_HO_TRO',
      subjectCodes: ['TOAN', 'TIENG_VIET'],
      difficultyAreas: ['Tính nhẩm phép nhân chia', 'Đọc diễn cảm và ngắt câu'],
      strengths: 'Chăm chỉ, thích vẽ tranh và hoạt động nhóm',
      shortTermGoal: 'Nắm vững bảng cửu chương 6-9, đọc lưu loát 80 từ/phút',
      interventionStrategies: 'Kèm riêng 15 phút đầu giờ truy bài; sử dụng thẻ số trực quan; xếp ngồi cạnh bạn học tốt Toán.',
      buddyStudentId: 'hs-4a1-001',
      buddyStudentName: 'Vũ Huệ An',
      parentAction: 'Gia đình cùng con đố vui bảng nhân 10 phút mỗi tối trước khi ngủ.',
      evaluationNotes: 'Em có tiến bộ rõ rệt, đã thuộc bảng nhân 6 và 7.',
      status: 'IN_PROGRESS',
      startDate: '2026-08-15',
      reviewDate: '2026-09-30',
    },
    {
      id: 'iep-2',
      studentId: 'hs-4a1-001',
      studentName: 'Vũ Huệ An',
      classId: 'class-4a1',
      category: 'NANG_KHIEU',
      subjectCodes: ['TOAN', 'NGOAI_NGU'],
      difficultyAreas: [],
      strengths: 'Tư duy logic cực tốt, phát âm tiếng Anh chuẩn, tiếp thu bài nhanh',
      shortTermGoal: 'Luyện các dạng toán Olympic nâng cao cấp trường và tự tin thuyết trình tiếng Anh.',
      interventionStrategies: 'Giao thêm phiếu bài tập nâng cao tư duy logic; khuyến khích làm nhóm trưởng trong giờ học.',
      parentAction: 'Tạo điều kiện cho con tham gia câu lạc bộ tiếng Anh và đọc sách khoa học.',
      evaluationNotes: 'Hoàn thành xuất sắc các bài toán tư duy mở rộng.',
      status: 'IN_PROGRESS',
      startDate: '2026-08-15',
      reviewDate: '2026-10-15',
    }
  ];

  const { error: iepErr } = await supabase.from('IEPPlan').upsert(INITIAL_IEP_PLANS);
  if (iepErr) console.error('IEPPlan error:', iepErr);
  else console.log('✅ IEPPlan seeded:', INITIAL_IEP_PLANS.length);

  // 3. CLASSROOM BOOKS
  const INITIAL_CLASSROOM_BOOKS = [
    { id: 'book-1', code: 'ST-001', title: 'Dế Mèn Phiêu Lưu Ký', author: 'Tô Hoài', category: 'VAN_HOC', coverEmoji: '🦗', totalCopies: 3, availableCopies: 2, classId: 'class-4a1' },
    { id: 'book-2', code: 'KH-002', title: 'Mười Vạn Câu Hỏi Vì Sao - Vũ Trụ', author: 'Nhiều tác giả', category: 'KHOA_HOC', coverEmoji: '🚀', totalCopies: 2, availableCopies: 2, classId: 'class-4a1' },
    { id: 'book-3', code: 'KN-003', title: 'Kỹ Năng Tự Bảo Vệ Bản Thân Cho Học Sinh', author: 'Nguyễn Hương Giang', category: 'KY_NANG_SONG', coverEmoji: '🛡️', totalCopies: 4, availableCopies: 3, classId: 'class-4a1' },
    { id: 'book-4', code: 'LS-004', title: 'Lược Sử Nước Việt Bằng Tranh', author: 'Hiếu Minh', category: 'LICH_SU', coverEmoji: '📜', totalCopies: 2, availableCopies: 1, classId: 'class-4a1' },
    { id: 'book-5', code: 'TT-005', title: 'Thám Tử Lừng Danh Conan - Tập 100', author: 'Gosho Aoyama', category: 'TRUYEN_TRANH', coverEmoji: '🔍', totalCopies: 5, availableCopies: 4, classId: 'class-4a1' },
  ];

  const { error: cbErr } = await supabase.from('ClassroomBook').upsert(INITIAL_CLASSROOM_BOOKS);
  if (cbErr) console.error('ClassroomBook error:', cbErr);
  else console.log('✅ ClassroomBook seeded:', INITIAL_CLASSROOM_BOOKS.length);

  // 4. BOOK BORROW LOGS
  const INITIAL_BORROW_LOGS = [
    { id: 'log-b-1', bookId: 'book-1', bookTitle: 'Dế Mèn Phiêu Lưu Ký', studentId: 'hs-4a1-001', studentName: 'Vũ Huệ An', classId: 'class-4a1', borrowDate: '2026-08-20', status: 'BORROWED' },
    { id: 'log-b-2', bookId: 'book-4', bookTitle: 'Lược Sử Nước Việt Bằng Tranh', studentId: 'hs-4a1-002', studentName: 'Đào Châm Anh', classId: 'class-4a1', borrowDate: '2026-08-18', returnDate: '2026-08-24', status: 'RETURNED', studentReview: 'Sách tranh vẽ rất đẹp và dễ nhớ lịch sử!', ratingStars: 5 },
    { id: 'log-b-3', bookId: 'book-3', bookTitle: 'Kỹ Năng Tự Bảo Vệ Bản Thân Cho Học Sinh', studentId: 'hs-4a1-006', studentName: 'Võ Duy Bách', classId: 'class-4a1', borrowDate: '2026-08-22', status: 'BORROWED' },
  ];

  const { error: blErr } = await supabase.from('BookBorrowLog').upsert(INITIAL_BORROW_LOGS);
  if (blErr) console.error('BookBorrowLog error:', blErr);
  else console.log('✅ BookBorrowLog seeded:', INITIAL_BORROW_LOGS.length);

  // 5. PARENT MEETING
  const INITIAL_PARENT_MEETINGS = [
    {
      id: 'pm-1',
      classId: 'class-4a1',
      meetingType: 'DAU_NAM',
      title: 'Họp Phụ Huynh Đầu Năm Học 2026 - 2027',
      meetingDate: '2026-09-06',
      location: 'Phòng học 4A1 - Tầng 2 Khu nhà A',
      presidedBy: 'Cô Nguyễn Thị Mai (GVCN)',
      secretary: 'Phụ huynh em Vũ Huệ An',
      attendeesCount: 38,
      totalParents: 40,
      committeeMembers: [
        { role: 'TRUONG_BAN', fullName: 'Vũ Văn Hùng', phone: '0912345678', studentName: 'Vũ Huệ An' },
        { role: 'PHO_BAN', fullName: 'Trần Thị Thu Trang', phone: '0987654321', studentName: 'Đào Châm Anh' },
        { role: 'UY_VIEN', fullName: 'Lê Minh Tuấn', phone: '0903112233', studentName: 'Bùi Gia Bách' },
      ],
      agendaTopics: [
        { id: 'top-1', title: '1. Báo cáo đặc điểm tình hình lớp 4A1', iconEmoji: '🏫', durationMinutes: 15, layout: 'STATS', talkingPoints: ['Sĩ số 40 em (22 Nam, 18 Nữ), 38 em ăn bán trú.', '100% học sinh ngoan ngoãn, lễ phép.'], isEnabled: true },
        { id: 'top-2', title: '2. Phương hướng & Mục tiêu giáo dục Thông tư 27', iconEmoji: '🎯', durationMinutes: 25, layout: 'BULLETS', talkingPoints: ['Đánh giá thường xuyên theo Thông tư 27.', 'Phát triển toàn diện 5 phẩm chất, 10 năng lực.'], isEnabled: true },
        { id: 'top-3', title: '3. Phối hợp giữa Gia đình & Nhà trường', iconEmoji: '🤝', durationMinutes: 20, layout: 'GRID_CARDS', talkingPoints: ['Sổ liên lạc điện tử cập nhật sao thi đua hàng ngày.', 'Kênh trao đổi Zalo cá nhân hóa.'], isEnabled: true },
      ],
      individualNotes: [],
      mainReports: ['Kế hoạch năm học 2026-2027', 'Nội quy lớp học', 'Chương trình bán trú'],
      discussionNotes: 'Phụ huynh nhất trí 100% với phương hướng hoạt động của lớp và quy chế phối hợp.',
      agreedResolutions: ['Ủng hộ phong trào Tủ sách lớp học và tích sao nề nếp.', 'Duy trì liên lạc thường xuyên qua GVCN Pro.'],
    }
  ];

  const { error: pmErr } = await supabase.from('ParentMeeting').upsert(INITIAL_PARENT_MEETINGS);
  if (pmErr) console.error('ParentMeeting error:', pmErr);
  else console.log('✅ ParentMeeting seeded:', INITIAL_PARENT_MEETINGS.length);

  // 6. HEALTH RECORDS
  const { data: students } = await supabase.from('Student').select('id, fullName, classId').eq('classId', 'class-4a1');
  if (students && students.length > 0) {
    const healthRows = students.map((st, idx) => {
      const height = 130 + (idx % 12);
      const weight = 28 + (idx % 10);
      const bmi = parseFloat((weight / ((height / 100) * (height / 100))).toFixed(1));
      let category = 'BINH_THUONG';
      if (bmi < 14) category = 'SUY_DINH_DUONG';
      else if (bmi > 21) category = 'BEO_PHI';
      else if (bmi > 18.5) category = 'NGUY_CO_THUA_CAN';

      return {
        id: `hr-${st.id}`,
        studentId: st.id,
        studentName: st.fullName,
        classId: st.classId || 'class-4a1',
        checkupDate: '2026-08-20',
        heightCm: height,
        weightKg: weight,
        bmi: bmi,
        bmiCategory: category,
        leftEye: idx % 7 === 0 ? '7/10 (Cận)' : '10/10',
        rightEye: idx % 7 === 0 ? '8/10 (Cận)' : '10/10',
        hasVisionDefect: idx % 7 === 0,
        allergies: idx === 4 ? ['Dị ứng tôm, cua'] : [],
        medicalNotes: idx % 7 === 0 ? 'Nên ngồi dãy 1 hoặc 2 để nhìn bảng rõ' : undefined,
      };
    });

    const { error: hrErr } = await supabase.from('HealthRecord').upsert(healthRows);
    if (hrErr) console.error('HealthRecord error:', hrErr);
    else console.log('✅ HealthRecord seeded:', healthRows.length);
  }

  // 7. MATRIX QUESTIONS (Question Bank)
  const INITIAL_QUESTION_BANK = [
    {
      id: 'mq-toan-4-1',
      grade: 4,
      subjectCode: 'TOAN',
      term: 'GIUA_HK1',
      topic: 'Số và phép tính trong phạm vi 100 000',
      level: 1,
      type: 'MCQ',
      questionText: 'Số gồm 5 chục nghìn, 2 nghìn, 8 trăm và 4 đơn vị viết là:',
      options: ['52 804', '52 840', '52 084', '50 284'],
      correctAnswer: 'A',
      explanation: 'Hàng chục nghìn là 5, hàng nghìn là 2, hàng trăm là 8, hàng chục là 0, hàng đơn vị là 4 -> Số viết là 52 804.',
      points: 1,
    },
    {
      id: 'mq-toan-4-2',
      grade: 4,
      subjectCode: 'TOAN',
      term: 'GIUA_HK1',
      topic: 'Bảng đơn vị đo khối lượng',
      level: 2,
      type: 'MCQ',
      questionText: 'Điền số thích hợp vào chỗ chấm: 3 tấn 25 kg = ... kg',
      options: ['325 kg', '3 025 kg', '3 250 kg', '30 025 kg'],
      correctAnswer: 'B',
      explanation: '1 tấn = 1 000 kg nên 3 tấn = 3 000 kg. Do đó 3 tấn 25 kg = 3 000 + 25 = 3 025 kg.',
      points: 1,
    },
    {
      id: 'mq-tv-4-1',
      grade: 4,
      subjectCode: 'TIENG_VIET',
      term: 'GIUA_HK1',
      topic: 'Luyện từ và câu: Danh từ',
      level: 1,
      type: 'MCQ',
      questionText: 'Từ nào dưới đây là danh từ chỉ người?',
      options: ['Thầy giáo', 'Thông minh', 'Giảng bài', 'Xinh đẹp'],
      correctAnswer: 'A',
      explanation: '"Thầy giáo" là danh từ chỉ người. "Thông minh", "xinh đẹp" là tính từ; "giảng bài" là động từ.',
      points: 1,
    },
    {
      id: 'mq-tv-4-2',
      grade: 4,
      subjectCode: 'TIENG_VIET',
      term: 'GIUA_HK1',
      topic: 'Đọc hiểu và cảm thụ văn học',
      level: 3,
      type: 'ESSAY',
      questionText: 'Em hãy viết một đoạn văn ngắn (từ 3 đến 5 câu) nêu cảm nghĩ của em về vẻ đẹp của quê hương em vào một buổi sáng mùa thu.',
      options: null,
      correctAnswer: 'Đoạn văn có bố cục rõ ràng, câu văn giàu hình ảnh, biểu cảm tốt tình yêu quê hương.',
      explanation: 'Đánh giá kỹ năng viết câu, dùng từ ngữ gợi cảm và cảm xúc chân thực của học sinh.',
      points: 2,
    }
  ];

  const { error: mqErr } = await supabase.from('MatrixQuestion').upsert(INITIAL_QUESTION_BANK);
  if (mqErr) console.error('MatrixQuestion error:', mqErr);
  else console.log('✅ MatrixQuestion seeded:', INITIAL_QUESTION_BANK.length);

  // 8. TEACHER CONFIGS (Default user settings)
  const TEACHER_CONFIGS = [
    {
      id: 'cfg-anhnnh4',
      email: 'anhnnh4@gmail.com',
      aiConfig: {
        provider: 'CUSTOM_OPENAI',
        baseUrl: 'https://api.xiaomimimo.com/v1',
        modelName: 'mimo-v2.5',
        apiKey: 'sk-mimo-default',
        temperature: 0.7,
      },
      aiGenSettings: {
        mode: 'AI_ONLINE',
        tone: 'encouraging',
        lengthPreset: 'standard',
        targetWordCount: 45,
        targetSentenceCount: 3,
        includeSubjectGrades: true,
        includeTraitsAndCompetencies: true,
        includeDailyStarsAndComments: true,
        includeAttendanceAndBoarding: true,
      },
      activeClassId: 'class-4a1',
      currentTerm: 'GIUA_HK1',
      readNotificationIds: [],
    },
    {
      id: 'cfg-hangnm47',
      email: 'hangnm47@gmail.com',
      aiConfig: {
        provider: 'CUSTOM_OPENAI',
        baseUrl: 'https://api.xiaomimimo.com/v1',
        modelName: 'mimo-v2.5',
        apiKey: 'sk-mimo-default',
        temperature: 0.7,
      },
      aiGenSettings: {
        mode: 'AI_ONLINE',
        tone: 'encouraging',
        lengthPreset: 'standard',
        targetWordCount: 45,
        targetSentenceCount: 3,
        includeSubjectGrades: true,
        includeTraitsAndCompetencies: true,
        includeDailyStarsAndComments: true,
        includeAttendanceAndBoarding: true,
      },
      activeClassId: 'class-4a1',
      currentTerm: 'GIUA_HK1',
      readNotificationIds: [],
    }
  ];

  const { error: cfgErr } = await supabase.from('TeacherConfig').upsert(TEACHER_CONFIGS);
  if (cfgErr) console.error('TeacherConfig error:', cfgErr);
  else console.log('✅ TeacherConfig seeded:', TEACHER_CONFIGS.length);

  console.log('🎉 ALL SUPABASE TABLES SUCCESSFULLY SEEDED AND SYNCHRONIZED!');
}

main().catch(console.error);
