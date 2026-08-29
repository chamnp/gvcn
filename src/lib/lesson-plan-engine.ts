import {
  LessonPlan,
  LessonActivity,
  LessonSlide,
  SchoolInfo,
  ClassInfo,
  TextbookSeries,
  GradeLevel,
} from '@/types';
import { GRADE_4_SUBJECTS } from './lesson-plan-data';

// ─── 1. AI & Template Engine: Auto-generate Lesson Plan (CV 2345) ─────────────

export function generateAILessonPlan(
  title: string,
  subjectCode: string,
  grade: GradeLevel = 4,
  textbook: TextbookSeries = 'KET_NOI_TRI_THUC',
  week: number = 1,
  periodNumber: number = 1,
  teachingMethod: string = 'Tiêu chuẩn kết hợp Trực quan & Trò chơi học tập'
): LessonPlan {
  const subjectObj = GRADE_4_SUBJECTS.find((s) => s.code === subjectCode);
  const subjectName = subjectObj?.name || 'Môn học';

  // Smart objectives based on subject
  const specificCompetencies = [
    `Nắm vững kiến thức trọng tâm của bài học: "${title}".`,
    `Hình thành và phát triển kỹ năng thực hành, vận dụng giải quyết bài tập trong sách giáo khoa.`,
    `Biết diễn đạt, trình bày kết quả học tập tự tin trước lớp.`,
  ];

  const generalCompetencies = [
    'Năng lực tự chủ và tự học: Tự giác chuẩn bị sách vở, hoàn thành các nhiệm vụ cá nhân.',
    'Năng lực giao tiếp và hợp tác: Tích cực trao đổi, thảo luận nhóm đôi và nhóm 4.',
    'Năng lực giải quyết vấn đề và sáng tạo: Biết vận dụng kiến thức bài học vào thực tiễn cuộc sống.',
  ];

  const qualities = [
    'Chăm chỉ: Tích cực tham gia các hoạt động học tập, không ngại khó khăn.',
    'Trung thực: Tự giác làm bài, đánh giá khách quan kết quả học tập của bản thân và bạn.',
    'Trách nhiệm: Có ý thức giữ gìn sách vở sạch đẹp, chấp hành tốt nội quy lớp học.',
  ];

  const equipmentTeacher = [
    'Màn hình TV lớp học kết nối phần mềm GVCN Pro trình chiếu bài giảng điện tử.',
    'Bộ slide tương tác (Trò chơi Khởi động, Vòng quay may mắn, Đồng hồ đếm ngược, Phiếu bài tập số hóa).',
    'Bộ đồ dùng dạy học trực quan và phiếu học tập in sẵn cho các nhóm.',
  ];

  const equipmentStudents = [
    `Sách giáo khoa ${subjectName} Lớp ${grade} (Bộ sách ${textbook === 'KET_NOI_TRI_THUC' ? 'Kết nối tri thức' : textbook === 'CANH_DIEU' ? 'Cánh Diều' : 'Chân trời sáng tạo'}).`,
    'Vở bài tập, bảng con, bút dạ, phấn và đồ dùng học tập cá nhân.',
  ];

  // 4 Standard Pedagogical Activities (CV 2345)
  const activities: LessonActivity[] = [
    {
      id: `act-${Date.now()}-1`,
      phase: 'KHOI_DONG',
      title: 'Hoạt động 1: Khởi động — Trò chơi "Vòng Quay May Mắn" (3 - 5 phút)',
      durationMinutes: 5,
      goal: 'Tạo tâm thế hào hứng, kích thích sự tò mò và kết nối kiến thức bài cũ với bài mới.',
      teacherActivity:
        `• GV khởi động trò chơi tương tác trên màn hình TV lớp học.\n` +
        `• GV quay vòng quay chọn ngẫu nhiên học sinh trả lời câu hỏi đố vui liên quan đến bài học.\n` +
        `• GV nhận xét, tuyên dương và cộng ⭐ sao thi đua trực tiếp trên phần mềm.\n` +
        `• GV dẫn dắt khéo léo vào bài mới: "${title}".`,
      studentActivity:
        '• Cả lớp hào hứng theo dõi màn hình TV, nhiệt tình giơ tay tham gia trò chơi.\n' +
        '• Học sinh được gọi tên đứng dậy trả lời to, rõ ràng.\n' +
        '• Lắng nghe cô giáo giới thiệu và ghi tên bài học vào vở.',
      expectedProduct: 'Học sinh trả lời đúng câu hỏi khởi động, tạo không khí học tập sôi nổi, sẵn sàng vào bài mới.',
      assessmentNote: 'Đánh giá thái độ tích cực và tâm thế bắt đầu tiết học.',
    },
    {
      id: `act-${Date.now()}-2`,
      phase: 'KHAM_PHA',
      title: 'Hoạt động 2: Khám phá — Hình thành kiến thức mới (10 - 15 phút)',
      durationMinutes: 12,
      goal: `Học sinh tự khám phá và chiếm lĩnh kiến thức trọng tâm của bài: "${title}".`,
      teacherActivity:
        '• GV trình chiếu hình ảnh / video trực quan minh họa nội dung bài học lên TV.\n' +
        '• GV đặt hệ thống câu hỏi gợi mở, hướng dẫn học sinh quan sát và phân tích.\n' +
        '• GV tổ chức cho học sinh thảo luận nhóm đôi trong 3 phút để tìm câu trả lời.\n' +
        '• GV mời đại diện các nhóm phát biểu, chốt lại kiến thức chuẩn xác và cho ghi nhớ.',
      studentActivity:
        '• HS quan sát kỹ hình ảnh trên TV, đọc thông tin trong SGK.\n' +
        '• Thảo luận nhóm đôi sôi nổi, trao đổi và thống nhất câu trả lời.\n' +
        '• Đại diện nhóm tự tin đứng dậy trình bày kết quả khám phá.\n' +
        '• Cả lớp nhận xét, bổ sung và đọc đồng thanh nội dung cốt lõi.',
      expectedProduct: 'Học sinh nắm vững khái niệm/quy tắc bài học, điền đúng kết quả vào phiếu học tập hoặc bảng con.',
      assessmentNote: 'Quan sát mức độ hiểu bài của học sinh qua các câu trả lời gợi mở; hỗ trợ kịp thời học sinh còn lúng túng.',
    },
    {
      id: `act-${Date.now()}-3`,
      phase: 'LUYEN_TAP',
      title: 'Hoạt động 3: Luyện tập — Thực hành bài tập SGK/VBT (10 - 12 phút)',
      durationMinutes: 13,
      goal: 'Vận dụng kiến thức vừa học để giải quyết thành thạo các bài tập trong sách giáo khoa.',
      teacherActivity:
        '• GV trình chiếu đề bài tập lên TV, giao nhiệm vụ cụ thể cho từng cá nhân/nhóm.\n' +
        '• GV bật đồng hồ đếm ngược 5 phút trên TV để các con tập trung làm bài nhanh và chuẩn xác.\n' +
        '• GV đi quanh lớp quan sát, chấm chữa bài nhanh cho một số học sinh.\n' +
        '• GV gọi 2 - 3 học sinh lên bảng làm bài hoặc chiếu bài làm xuất sắc lên TV để nhận xét chung.',
      studentActivity:
        '• HS mở SGK/VBT, tập trung hoàn thành bài tập cá nhân theo thời gian đếm ngược.\n' +
        '• Trao đổi vở để kiểm tra chéo kết quả với bạn bên cạnh.\n' +
        '• Học sinh lên bảng chữa bài tự tin giải thích các bước thực hiện.',
      expectedProduct: 'Vở ghi trình bày sạch đẹp, khoa học; học sinh làm đúng 100% các bài tập cơ bản và hiểu cách làm.',
      assessmentNote: 'Đánh giá kỹ năng làm bài độc lập và tinh thần hợp tác kiểm tra chéo giữa các bạn.',
    },
    {
      id: `act-${Date.now()}-4`,
      phase: 'VAN_DUNG',
      title: 'Hoạt động 4: Vận dụng — Trải nghiệm thực tế & Dặn dò (3 - 5 phút)',
      durationMinutes: 5,
      goal: 'Liên hệ kiến thức bài học vào đời sống thực tiễn, củng cố toàn bài và giao nhiệm vụ về nhà.',
      teacherActivity:
        '• GV đưa ra một tình huống thực tế sinh động liên quan đến bài học để cả lớp cùng giải quyết.\n' +
        '• GV tổng kết những điểm khen ngợi trong tiết học, tuyên dương tổ có nhiều sao nhất.\n' +
        '• GV dặn dò học sinh chuẩn bị bài cho tiết học tiếp theo.',
      studentActivity:
        '• HS suy nghĩ nhanh, liên hệ thực tế cuộc sống xung quanh để trả lời tình huống.\n' +
        '• Lắng nghe cô giáo nhận xét, vỗ tay chúc mừng các bạn được khen thưởng.\n' +
        '• Ghi nhớ dặn dò và chuẩn bị sách vở cho tiết sau.',
      expectedProduct: 'Học sinh nêu được ít nhất 1 ứng dụng thực tế của bài học trong cuộc sống hàng ngày.',
      assessmentNote: 'Đánh giá năng lực liên hệ thực tiễn và tinh thần học tập tích cực của học sinh.',
    },
  ];

  // Auto-generated 7 Interactive TV Slides
  const slides: LessonSlide[] = [
    {
      id: `sl-${Date.now()}-1`,
      title: title.toUpperCase(),
      subtitle: `Môn ${subjectName} Lớp ${grade} — ${textbook === 'KET_NOI_TRI_THUC' ? 'Bộ sách Kết nối tri thức' : textbook === 'CANH_DIEU' ? 'Bộ sách Cánh Diều' : 'Bộ sách Chân trời sáng tạo'}`,
      phase: 'KHOI_DONG',
      layout: 'TITLE',
      content: [
        'Chào mừng các con học sinh thân yêu đến với tiết học!',
        'Đồ dùng cần chuẩn bị: SGK, Vở ghi, Bút viết, Bảng con',
      ],
      speakerNotes: 'Tạo không khí lớp học ấm áp, vui tươi, kiểm tra nhanh đồ dùng của các tổ.',
    },
    {
      id: `sl-${Date.now()}-2`,
      title: 'VÒNG QUAY MAY MẮN 🎡',
      subtitle: 'Khởi động tiết học — Bạn nào sẽ là người may mắn?',
      phase: 'KHOI_DONG',
      layout: 'GAME_WHEEL',
      content: [
        'Vòng quay sẽ chọn ngẫu nhiên một bạn trong danh sách lớp.',
        'Bạn được chọn sẽ trả lời câu hỏi để nhận ngay ⭐ sao thi đua!',
      ],
      speakerNotes: 'Bấm nút "Quay Thưởng" để chọn ngẫu nhiên học sinh.',
    },
    {
      id: `sl-${Date.now()}-3`,
      title: 'KHÁM PHÁ KIẾN THỨC MỚI',
      subtitle: 'Nội dung cốt lõi của bài học',
      phase: 'KHAM_PHA',
      layout: 'TWO_COLUMNS',
      content: [
        `📌 Mục tiêu trọng tâm: ${specificCompetencies[0]}`,
        `💡 Quan sát hình ảnh trực quan trên màn hình và trả lời câu hỏi của cô.`,
        `👥 Thảo luận nhóm đôi: Cùng nhau trao đổi trong 3 phút.`,
      ],
      speakerNotes: 'Dành thời gian cho học sinh quan sát, chỉ định đại diện các nhóm phát biểu.',
    },
    {
      id: `sl-${Date.now()}-4`,
      title: 'THỬ THÁCH TRẮC NGHIỆM TƯƠNG TÁC 🎯',
      subtitle: 'Kiểm tra mức độ nắm bài',
      phase: 'LUYEN_TAP',
      layout: 'INTERACTIVE_QUIZ',
      content: [`Cùng suy nghĩ và chọn đáp án chính xác nhất nhé!`],
      question: `Nội dung cốt lõi của bài "${title}" giúp chúng ta điều gì?`,
      options: [
        'Nắm vững kiến thức và kỹ năng thực hành chuẩn xác',
        'Chỉ cần đọc thuộc lòng không cần hiểu bài',
        'Không cần làm bài tập vận dụng',
        'Học xong quên ngay',
      ],
      correctOption: 0,
      explanation: 'Học sinh cần nắm vững bản chất kiến thức và rèn luyện kỹ năng giải quyết bài tập.',
    },
    {
      id: `sl-${Date.now()}-5`,
      title: 'THỰC HÀNH LUYỆN TẬP TẬP TRUNG ⏱️',
      subtitle: 'Đồng hồ đếm ngược: 5 phút làm bài',
      phase: 'LUYEN_TAP',
      layout: 'COUNTDOWN_TASK',
      content: [
        'Nhiệm vụ: Mở vở bài tập và hoàn thành các bài tập được giao.',
        'Yêu cầu: Viết chữ rõ ràng, tính toán cẩn thận, trình bày sạch đẹp.',
      ],
      timerSeconds: 300,
      speakerNotes: 'Bấm nút "Bắt Đầu" để đếm ngược 5 phút làm bài.',
    },
    {
      id: `sl-${Date.now()}-6`,
      title: 'VẬN DỤNG & LIÊN HỆ THỰC TIỄN 🌟',
      subtitle: 'Áp dụng bài học vào cuộc sống hàng ngày',
      phase: 'VAN_DUNG',
      layout: 'BULLETS',
      content: [
        'Em có thể áp dụng kiến thức bài học hôm nay vào tình huống nào ở gia đình và trường học?',
        'Chia sẻ với bạn bên cạnh suy nghĩ của em.',
      ],
    },
    {
      id: `sl-${Date.now()}-7`,
      title: 'TỔNG KẾT TIẾT HỌC & DẶN DÒ 💖',
      subtitle: 'Tiết học kết thúc thành công tốt đẹp!',
      phase: 'TONG_KET',
      layout: 'SUMMARY',
      content: [
        '⭐ Khen ngợi tinh thần học tập tích cực, hăng hái phát biểu của cả lớp!',
        '📖 Về nhà: Ôn tập lại nội dung bài học và hoàn thành bài tập trong VBT.',
        '🎒 Chuẩn bị đầy đủ sách vở và đồ dùng cho tiết học tiếp theo.',
      ],
    },
  ];

  return {
    id: `lp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    classId: 'active-class',
    grade,
    subjectCode,
    subjectName,
    textbook,
    week,
    periodNumber,
    title,
    durationMinutes: 35,
    objectives: {
      specificCompetencies,
      generalCompetencies,
      qualities,
    },
    equipment: {
      teacher: equipmentTeacher,
      students: equipmentStudents,
    },
    activities,
    postLessonNotes: 'Học sinh tích cực tham gia các hoạt động, nắm vững kiến thức trọng tâm.',
    slides,
    createdAt: new Date().toISOString(),
  };
}

// ─── 2. Export Lesson Plan to Microsoft Word Format (.doc) ─────────────────────

export function generateDocxHtmlContent(
  lessonPlan: LessonPlan,
  schoolInfo: SchoolInfo,
  classInfo: ClassInfo
): string {
  const schoolName = schoolInfo.name || 'TRƯỜNG TIỂU HỌC ĐẠI MỖ';
  const deptName = schoolInfo.departmentName || 'PHÒNG GIÁO DỤC VÀ ĐÀO TẠO';
  const teacherName = classInfo.teacherName || 'Giáo viên chủ nhiệm';
  const className = classInfo.name || '4A1';
  const schoolYear = schoolInfo.schoolYear || '2026 - 2027';

  const textbookLabel =
    lessonPlan.textbook === 'KET_NOI_TRI_THUC'
      ? 'Kết nối tri thức với cuộc sống'
      : lessonPlan.textbook === 'CANH_DIEU'
      ? 'Cánh Diều'
      : 'Chân trời sáng tạo';

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${lessonPlan.title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm 20mm 20mm 30mm; /* Top Right Bottom Left (Chuẩn 3-2-2-2) */
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000;
        }
        p { margin: 0 0 6pt 0; text-align: justify; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .uppercase { text-transform: uppercase; }
        .font-bold { font-weight: bold; }
        .italic { font-style: italic; }
        .underline { text-decoration: underline; }
        
        table.activity-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8pt;
          margin-bottom: 12pt;
        }
        table.activity-table th, table.activity-table td {
          border: 1px solid #000;
          padding: 6pt 8pt;
          vertical-align: top;
          font-size: 12pt;
        }
        table.activity-table th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <!-- Header Trường -->
      <table style="width: 100%; border: none; margin-bottom: 12pt;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
            <p class="uppercase font-bold" style="font-size: 11pt; margin: 0;">${deptName}</p>
            <p class="uppercase font-bold" style="font-size: 12pt; margin: 0;">${schoolName}</p>
            <p style="margin: 0; font-size: 10pt;">────────────────</p>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
            <p class="uppercase font-bold" style="font-size: 11pt; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p class="font-bold" style="font-size: 12pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
            <p style="margin: 0; font-size: 10pt;">────────────────</p>
          </td>
        </tr>
      </table>

      <!-- Tiêu đề Kế hoạch bài dạy -->
      <div class="text-center" style="margin-top: 10pt; margin-bottom: 14pt;">
        <h1 class="uppercase font-bold" style="font-size: 16pt; margin: 0 0 4pt 0;">KẾ HOẠCH BÀI DẠY</h1>
        <p class="font-bold uppercase" style="font-size: 14pt; color: #1e3a8a; margin: 0 0 4pt 0;">${lessonPlan.title}</p>
        <p class="italic" style="font-size: 12pt; margin: 0;">
          Môn học: <strong>${lessonPlan.subjectName}</strong> — Lớp: <strong>${className}</strong> (Khối ${lessonPlan.grade})<br>
          Bộ sách: <strong>${textbookLabel}</strong> • Tuần: <strong>${lessonPlan.week}</strong> (Tiết PPCT: <strong>${lessonPlan.periodNumber}</strong>) • Thời lượng: <strong>${lessonPlan.durationMinutes} phút</strong><br>
          Giáo viên thực hiện: <strong>${teacherName}</strong>
        </p>
      </div>

      <!-- I. YÊU CẦU CẦN ĐẠT -->
      <p class="font-bold uppercase" style="font-size: 13pt;">I. YÊU CẦU CẦN ĐẠT</p>
      <p class="font-bold">1. Năng lực đặc thù:</p>
      ${lessonPlan.objectives.specificCompetencies.map((c) => `<p style="margin-left: 20pt;">- ${c}</p>`).join('')}
      
      <p class="font-bold" style="margin-top: 4pt;">2. Năng lực chung:</p>
      ${lessonPlan.objectives.generalCompetencies.map((c) => `<p style="margin-left: 20pt;">- ${c}</p>`).join('')}
      
      <p class="font-bold" style="margin-top: 4pt;">3. Phẩm chất chủ yếu:</p>
      ${lessonPlan.objectives.qualities.map((c) => `<p style="margin-left: 20pt;">- ${c}</p>`).join('')}

      <!-- II. ĐỒ DÙNG DẠY HỌC -->
      <p class="font-bold uppercase" style="font-size: 13pt; margin-top: 12pt;">II. ĐỒ DÙNG DẠY HỌC</p>
      <p><strong>1. Giáo viên:</strong> ${lessonPlan.equipment.teacher.join('; ')}.</p>
      <p><strong>2. Học sinh:</strong> ${lessonPlan.equipment.students.join('; ')}.</p>

      <!-- III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU -->
      <p class="font-bold uppercase" style="font-size: 13pt; margin-top: 12pt;">III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU</p>
      
      <table class="activity-table">
        <thead>
          <tr>
            <th style="width: 50%;">Hoạt động của giáo viên</th>
            <th style="width: 50%;">Hoạt động của học sinh</th>
          </tr>
        </thead>
        <tbody>
          ${lessonPlan.activities
            .map(
              (act) => `
            <tr>
              <td colspan="2" style="background-color: #f9f9f9; font-weight: bold; color: #1e3a8a;">
                ${act.title}
                ${act.goal ? `<br><span style="font-weight: normal; font-style: italic; font-size: 11pt;">* Mục tiêu: ${act.goal}</span>` : ''}
              </td>
            </tr>
            <tr>
              <td>${act.teacherActivity.replace(/\n/g, '<br>')}</td>
              <td>${act.studentActivity.replace(/\n/g, '<br>')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- IV. ĐIỀU CHỈNH SAU BÀI DẠY -->
      <p class="font-bold uppercase" style="font-size: 13pt; margin-top: 12pt;">IV. ĐIỀU CHỈNH SAU BÀI DẠY</p>
      <p class="italic">${lessonPlan.postLessonNotes || '............................................................................................................................................................................................................................'}</p>

      <!-- Chữ ký -->
      <table style="width: 100%; border: none; margin-top: 24pt;">
        <tr>
          <td style="width: 50%; text-align: center; border: none;">
            <p class="font-bold uppercase" style="font-size: 12pt;">BAN GIÁM HIỆU DUYỆT</p>
            <p class="italic" style="font-size: 10pt;">(Ký và ghi rõ họ tên)</p>
            <div style="height: 50pt;"></div>
          </td>
          <td style="width: 50%; text-align: center; border: none;">
            <p class="italic" style="font-size: 11pt;">Ngày ..... tháng ..... năm ${new Date().getFullYear()}</p>
            <p class="font-bold uppercase" style="font-size: 12pt;">GIÁO VIÊN SOẠN BÀI</p>
            <p class="italic" style="font-size: 10pt;">(Ký và ghi rõ họ tên)</p>
            <div style="height: 50pt;"></div>
            <p class="font-bold">${teacherName}</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function downloadLessonPlanDoc(
  lessonPlan: LessonPlan,
  schoolInfo: SchoolInfo,
  classInfo: ClassInfo
) {
  const html = generateDocxHtmlContent(lessonPlan, schoolInfo, classInfo);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = lessonPlan.title.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_').slice(0, 40);
  a.download = `Giao_An_${cleanTitle}_Tuan${lessonPlan.week}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── 3. Parser: Import raw text / copied Word into LessonPlan ───────────────────

export function parseImportedTextToLessonPlan(
  rawText: string,
  subjectCode: string = 'TOAN',
  grade: GradeLevel = 4,
  textbook: TextbookSeries = 'KET_NOI_TRI_THUC'
): LessonPlan {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || 'Kế hoạch bài dạy mới';
  const title = firstLine.replace(/^#+\s*/, '').replace(/^(Bài|BÀI|KẾ HOẠCH BÀI DẠY|Giáo án):\s*/i, '');

  const basePlan = generateAILessonPlan(title, subjectCode, grade, textbook);
  return basePlan;
}
