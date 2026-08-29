import {
  LessonPlan,
  CurriculumTopicItem,
  TextbookSeries,
  GradeLevel,
} from '@/types';

export const TEXTBOOK_OPTIONS: { id: TextbookSeries; name: string; publisher: string; color: string }[] = [
  { id: 'KET_NOI_TRI_THUC', name: 'Kết nối tri thức với cuộc sống', publisher: 'NXB Giáo dục Việt Nam', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'CANH_DIEU', name: 'Cánh Diều', publisher: 'NXB ĐH Sư phạm', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'CHAN_TROI_SANG_TAO', name: 'Chân trời sáng tạo', publisher: 'NXB Giáo dục Việt Nam', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
];

export const GRADE_4_SUBJECTS = [
  { code: 'TOAN', name: 'Toán học', icon: '📐', periodsPerWeek: 5, color: 'blue' },
  { code: 'TIENG_VIET', name: 'Tiếng Việt', icon: '📖', periodsPerWeek: 7, color: 'amber' },
  { code: 'NGOAI_NGU', name: 'Tiếng Anh', icon: '🇬🇧', periodsPerWeek: 4, color: 'purple' },
  { code: 'KHOA_HOC', name: 'Khoa học', icon: '🔬', periodsPerWeek: 2, color: 'teal' },
  { code: 'LS_DL', name: 'Lịch sử & Địa lý', icon: '🌍', periodsPerWeek: 2, color: 'orange' },
  { code: 'TIN_HOC_CN', name: 'Tin học & Công nghệ', icon: '💻', periodsPerWeek: 2, color: 'cyan' },
  { code: 'DAO_DUC', name: 'Đạo đức', icon: '💖', periodsPerWeek: 1, color: 'rose' },
  { code: 'HD_TRAI_NGHIEM', name: 'Hoạt động trải nghiệm', icon: '🌟', periodsPerWeek: 3, color: 'indigo' },
];

// Curated Curriculum Topics for Grade 4 (Tuần 1 - Tuần 35)
export const GRADE_4_CURRICULUM_TOPICS: CurriculumTopicItem[] = [
  // ─── TOÁN 4 ───
  { id: 'c-toan-1', week: 1, periodNumber: 1, subjectCode: 'TOAN', title: 'Bài 1: Ôn tập các số đến 100 000 (Tiết 1)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Đọc, viết, so sánh các số trong phạm vi 100 000', 'Xác định giá trị theo vị trí của từng chữ số', 'Tự giác, cẩn thận khi tính toán'] },
  { id: 'c-toan-2', week: 1, periodNumber: 2, subjectCode: 'TOAN', title: 'Bài 1: Ôn tập các số đến 100 000 (Tiết 2)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Thực hiện thành thạo cộng trừ trong phạm vi 100 000', 'Giải bài toán thực tế liên quan đến mua sắm'] },
  { id: 'c-toan-3', week: 1, periodNumber: 3, subjectCode: 'TOAN', title: 'Bài 2: Ôn tập các phép tính trong phạm vi 100 000 (Tiết 1)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Thực hiện phép nhân số có năm chữ số với số có một chữ số', 'Tính nhẩm nhanh các số tròn chục nghìn'] },
  { id: 'c-toan-4', week: 1, periodNumber: 4, subjectCode: 'TOAN', title: 'Bài 2: Ôn tập các phép tính trong phạm vi 100 000 (Tiết 2)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Thực hiện phép chia số có năm chữ số cho số có một chữ số', 'Vận dụng giải toán có lời văn 2 bước tính'] },
  { id: 'c-toan-5', week: 1, periodNumber: 5, subjectCode: 'TOAN', title: 'Bài 3: Số chẵn, số lẻ', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Nhận biết số chẵn, số lẻ dựa vào chữ số tận cùng', 'Tìm quy luật dãy số chẵn, dãy số lẻ liên tiếp'] },
  { id: 'c-toan-6', week: 2, periodNumber: 6, subjectCode: 'TOAN', title: 'Bài 4: Biểu thức có chứa một chữ', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Làm quen với biểu thức chứa một chữ', 'Tính giá trị của biểu thức khi thay chữ bằng số cụ thể'] },
  { id: 'c-toan-7', week: 2, periodNumber: 7, subjectCode: 'TOAN', title: 'Bài 5: Giải bài toán có ba bước tính', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Phân tích đề bài toán thực tế 3 bước tính', 'Trình bày bài giải logic, khoa học'] },
  { id: 'c-toan-8', week: 3, periodNumber: 11, subjectCode: 'TOAN', title: 'Bài 8: Góc nhọn, góc tù, góc bẹt', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Dùng ê-ke để nhận biết và vẽ góc vuông, nhọn, tù, bẹt', 'Nhận dạng các loại góc trong đồ vật xung quanh'] },
  { id: 'c-toan-9', week: 4, periodNumber: 16, subjectCode: 'TOAN', title: 'Bài 11: Hàng và lớp - Triệu và lớp triệu (Tiết 1)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Nhận biết lớp đơn vị, lớp nghìn, lớp triệu', 'Đọc, viết các số có nhiều chữ số chính xác'] },
  { id: 'c-toan-10', week: 5, periodNumber: 21, subjectCode: 'TOAN', title: 'Bài 14: Dãy số tự nhiên và đặc điểm dãy số tự nhiên', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Hiểu các tính chất cơ bản của dãy số tự nhiên', 'Biểu diễn dãy số tự nhiên trên tia số'] },
  { id: 'c-toan-11', week: 6, periodNumber: 26, subjectCode: 'TOAN', title: 'Bài 17: Hai đường thẳng song song', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Nhận biết hai đường thẳng song song trong hình học và thực tế', 'Dùng thước và ê-ke vẽ hai đường thẳng song song'] },
  { id: 'c-toan-12', week: 7, periodNumber: 31, subjectCode: 'TOAN', title: 'Bài 20: Làm tròn số đến hàng trăm nghìn', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Nắm vững quy tắc làm tròn số', 'Ứng dụng làm tròn số trong ước lượng chi phí thực tế'] },

  // ─── TIẾNG VIỆT 4 ───
  { id: 'c-tv-1', week: 1, periodNumber: 1, subjectCode: 'TIENG_VIET', title: 'Bài 1: Điều kì diệu (Đọc)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Đọc đúng, trôi chảy bài thơ Điều kì diệu', 'Hiểu thông điệp: Mỗi người là một cá thể độc đáo và đáng quý', 'Bồi dưỡng tình yêu thương, tôn trọng sự khác biệt'] },
  { id: 'c-tv-2', week: 1, periodNumber: 2, subjectCode: 'TIENG_VIET', title: 'Bài 1: Danh từ (Luyện từ và câu)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Nhận biết khái niệm danh từ (chỉ người, vật, hiện tượng, thời gian)', 'Tìm được danh từ trong đoạn văn và đặt câu có danh từ'] },
  { id: 'c-tv-3', week: 1, periodNumber: 3, subjectCode: 'TIENG_VIET', title: 'Bài 1: Tìm hiểu đoạn văn và câu chủ đề (Viết)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Nhận biết cấu trúc đoạn văn và vị trí của câu chủ đề', 'Viết đoạn văn ngắn nêu cảm nghĩ có câu chủ đề rõ ràng'] },
  { id: 'c-tv-4', week: 2, periodNumber: 8, subjectCode: 'TIENG_VIET', title: 'Bài 3: Anh em sinh đôi (Đọc)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Đọc diễn cảm câu chuyện tình cảm anh em', 'Rút ra bài học về sự thấu hiểu và gắn kết gia đình'] },
  { id: 'c-tv-5', week: 2, periodNumber: 9, subjectCode: 'TIENG_VIET', title: 'Bài 3: Danh từ chung và danh từ riêng (Luyện từ và câu)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Phân biệt danh từ chung và danh từ riêng', 'Nắm vững quy tắc viết hoa danh từ riêng chỉ tên người, địa danh'] },
  { id: 'c-tv-6', week: 3, periodNumber: 15, subjectCode: 'TIENG_VIET', title: 'Bài 5: Bầu trời trong quả trứng (Đọc)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Cảm nhận vẻ đẹp hồn nhiên của thế giới qua cái nhìn của chú gà con', 'Phát triển trí tưởng tượng phong phú và năng lực thẩm mĩ'] },
  { id: 'c-tv-7', week: 4, periodNumber: 22, subjectCode: 'TIENG_VIET', title: 'Bài 7: Biện pháp nhân hóa (Luyện từ và câu)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Nhận biết 3 cách nhân hóa đồ vật, con vật, cây cối', 'Sử dụng biện pháp nhân hóa để viết câu văn sinh động, gợi cảm'] },

  // ─── KHOA HỌC 4 ───
  { id: 'c-kh-1', week: 1, periodNumber: 1, subjectCode: 'KHOA_HOC', title: 'Bài 1: Tính chất và vai trò của nước (Tiết 1)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Làm thí nghiệm quan sát: Nước không màu, không mùi, không vị, không có hình dạng cố định', 'Phát triển năng lực tìm tòi, khám phá khoa học'] },
  { id: 'c-kh-2', week: 1, periodNumber: 2, subjectCode: 'KHOA_HOC', title: 'Bài 1: Tính chất và vai trò của nước (Tiết 2)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Nêu được vai trò sống còn của nước đối với con người, thực vật và động vật', 'Hình thành ý thức tiết kiệm và bảo vệ nguồn nước sạch'] },
  { id: 'c-kh-3', week: 2, periodNumber: 3, subjectCode: 'KHOA_HOC', title: 'Bài 2: Sự chuyển thể của nước và vòng tuần hoàn của nước trong tự nhiên', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Giải thích sự chuyển thể: bay hơi, ngưng tụ, đông đặc, nóng chảy', 'Vẽ sơ đồ và thuyết trình vòng tuần hoàn của nước trong tự nhiên'] },
  { id: 'c-kh-4', week: 3, periodNumber: 5, subjectCode: 'KHOA_HOC', title: 'Bài 4: Không khí quanh ta (Tính chất của không khí)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Làm thí nghiệm chứng minh không khí có ở mọi nơi, trong suốt, không mùi', 'Không khí có thể bị nén lại hoặc giãn ra'] },

  // ─── LỊCH SỬ & ĐỊA LÝ 4 ───
  { id: 'c-ls-1', week: 1, periodNumber: 1, subjectCode: 'LS_DL', title: 'Bài 1: Làm quen với phương tiện học tập môn Lịch sử và Địa lý (Tiết 1)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Nhận biết bản đồ, lược đồ, bảng số liệu, hiện vật lịch sử', 'Sử dụng bản đồ để xác định phương hướng, tỉ lệ và ký hiệu'] },
  { id: 'c-ls-2', week: 2, periodNumber: 3, subjectCode: 'LS_DL', title: 'Bài 2: Thiên nhiên và con người vùng Trung du và miền núi Bắc Bộ', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Xác định vị trí vùng trên bản đồ địa lý tự nhiên Việt Nam', 'Nêu nét đặc trưng: địa hình đồi bát úp, ruộng bậc thang, các lễ hội dân tộc'] },
  { id: 'c-ls-3', week: 3, periodNumber: 5, subjectCode: 'LS_DL', title: 'Bài 4: Đền Hùng và Lễ giỗ Tổ Hùng Vương', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Tìm hiểu vị trí Khu di tích lịch sử Đền Hùng (Phú Thọ)', 'Ý nghĩa câu ca dao: Dù ai đi ngược về xuôi / Nhớ ngày Giỗ Tổ mùng mười tháng ba'] },

  // ─── TIN HỌC & CÔNG NGHỆ 4 ───
  { id: 'c-tin-1', week: 1, periodNumber: 1, subjectCode: 'TIN_HOC_CN', title: 'Bài 1: Phần cứng và phần mềm máy tính', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Phân biệt phần cứng (màn hình, chuột, bàn phím, thân máy) và phần mềm', 'Ý thức giữ gìn vệ sinh và an toàn thiết bị phòng tin học'] },
  { id: 'c-tin-2', week: 2, periodNumber: 3, subjectCode: 'TIN_HOC_CN', title: 'Bài 2: Gõ bàn phím đúng cách (Luyện 10 ngón)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Đặt tay đúng vị trí hàng phím cơ sở (F, J có gờ nổi)', 'Thực hành gõ hàng phím trên và hàng phím dưới đúng ngón'] },

  // ─── ĐẠO ĐỨC 4 ───
  { id: 'c-dd-1', week: 1, periodNumber: 1, subjectCode: 'DAO_DUC', title: 'Bài 1: Biết ơn người lao động (Tiết 1)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Hiểu vì sao cần phải biết ơn người lao động trong xã hội', 'Bày tỏ lòng biết ơn bằng lời nói, hành động cụ thể và trân trọng sản phẩm lao động'] },
  { id: 'c-dd-2', week: 2, periodNumber: 2, subjectCode: 'DAO_DUC', title: 'Bài 1: Biết ơn người lao động (Tiết 2: Xử lý tình huống)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Đóng vai xử lý các tình huống tôn trọng bác lao công, chú bảo vệ, cô đầu bếp', 'Lập kế hoạch hành động biết ơn người lao động tại trường học'] },

  // ─── HOẠT ĐỘNG TRẢI NGHIỆM 4 ───
  { id: 'c-hdtn-1', week: 1, periodNumber: 1, subjectCode: 'HD_TRAI_NGHIEM', title: 'Chủ đề 1: Tự hào truyền thống trường em (Sinh hoạt dưới cờ)', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Tự hào về bề dày lịch sử và thành tích của ngôi trường thân yêu', 'Xác định mục tiêu rèn luyện thi đua trong năm học mới'] },
  { id: 'c-hdtn-2', week: 1, periodNumber: 2, subjectCode: 'HD_TRAI_NGHIEM', title: 'Chủ đề 1: Xây dựng nếp sống văn minh và an toàn trường học', textbook: 'KET_NOI_TRI_THUC', suggestedObjectives: ['Thảo luận quy tắc ứng xử thân thiện trong lớp học', 'Bầu Ban cán sự lớp và phân công nhiệm vụ các tổ thi đua'] },
];

// Rich Standard Pre-built Lesson Plans for Grade 4 (Full CV 2345 + TV Slides)
export const SAMPLE_GRADE_4_LESSON_PLANS: LessonPlan[] = [
  // ─── 1. TOÁN 4: BÀI 12 - CÁC SỐ CÓ SÁU CHỮ SỐ ───
  {
    id: 'lp-toan4-w1-p1',
    classId: 'demo-class',
    grade: 4,
    subjectCode: 'TOAN',
    subjectName: 'Toán học',
    textbook: 'KET_NOI_TRI_THUC',
    week: 1,
    periodNumber: 1,
    createdAt: '2026-08-29T08:00:00.000Z',
    title: 'Bài 1: Ôn tập các số đến 100 000 (Tiết 1)',
    durationMinutes: 35,
    objectives: {
      specificCompetencies: [
        'Đọc, viết thành thạo các số trong phạm vi 100 000.',
        'Nhận biết cấu tạo thập phân của số, xác định giá trị của từng chữ số theo hàng và lớp.',
        'So sánh và sắp xếp thứ tự các số trong phạm vi 100 000.',
      ],
      generalCompetencies: [
        'Năng lực tự chủ và tự học: Tự giác hoàn thành các bài tập tính toán cá nhân.',
        'Năng lực giao tiếp và hợp tác: Trao đổi, thảo luận nhóm đôi để kiểm tra kết quả cho bạn.',
        'Năng lực giải quyết vấn đề và sáng tạo: Vận dụng làm tròn số để ước lượng giá tiền thực tế.',
      ],
      qualities: [
        'Chăm chỉ: Tích cực phát biểu xây dựng bài, rèn tính cẩn thận, tỉ mỉ khi viết số.',
        'Trung thực: Tự giác làm bài, trung thực khi đối chiếu kết quả kiểm tra chéo.',
        'Trách nhiệm: Giữ gìn vở ghi cẩn thận, sạch đẹp.',
      ],
    },
    equipment: {
      teacher: [
        'Màn hình TV lớp học kết nối phần mềm GVCN Pro.',
        'Bộ slide bài giảng điện tử tương tác (Trò chơi Khởi động, Vòng quay số bí ẩn, Phiếu bài tập số hóa).',
        'Bộ thẻ số từ 0 đến 9 và bảng phụ chia các hàng (Đơn vị, Chục, Trăm, Nghìn, Chục nghìn, Trăm nghìn).',
      ],
      students: [
        'Sách giáo khoa Toán 4 (Bộ Kết nối tri thức với cuộc sống).',
        'Vở bài tập Toán 4 tập 1, bảng con, bút dạ, phấn.',
      ],
    },
    activities: [
      {
        id: 'act-1',
        phase: 'KHOI_DONG',
        title: 'Hoạt động 1: Khởi động — Trò chơi "Vòng Quay Con Số May Mắn" (5 phút)',
        durationMinutes: 5,
        goal: 'Tạo không khí học tập sôi nổi, hứng thú, kích hoạt kiến thức cũ về đọc viết số có 5 chữ số.',
        teacherActivity:
          '• GV khởi động vòng quay may mắn trên màn hình TV lớp học.\n• GV quay ngẫu nhiên chọn 1 bạn và hiển thị số bí ẩn (VD: 45 829, 90 205).\n• GV yêu cầu HS đọc số và nêu giá trị của chữ số 4, chữ số 8 trong số đó.\n• GV nhận xét, tuyên dương và cộng ⭐ sao thi đua trực tiếp cho học sinh.',
        studentActivity:
          '• Cả lớp hào hứng theo dõi vòng quay trên màn hình TV.\n• HS được gọi đứng dậy đọc to, rõ ràng số được chỉ định và phân tích giá trị theo hàng.\n• Các bạn dưới lớp giơ thẻ Đúng/Sai để nhận xét.',
        expectedProduct: 'Học sinh đọc đúng các số: 45 829, 90 205 và xác định được chữ số 4 thuộc hàng chục nghìn (giá trị 40 000).',
        assessmentNote: 'Đánh giá kỹ năng đọc số và tâm thế sẵn sàng vào bài mới.',
      },
      {
        id: 'act-2',
        phase: 'KHAM_PHA',
        title: 'Hoạt động 2: Khám phá — Ôn tập cấu tạo số và giá trị theo hàng (12 phút)',
        durationMinutes: 12,
        goal: 'Học sinh nắm chắc cấu tạo số có 5 chữ số, biểu diễn số thành tổng các hàng chục nghìn, nghìn, trăm, chục, đơn vị.',
        teacherActivity:
          '• GV trình chiếu bảng cấu trúc các hàng từ Đơn vị đến Chục nghìn lên TV.\n• GV đưa ra ví dụ: Số 63 528 gồm mấy chục nghìn, mấy nghìn, mấy trăm, mấy chục, mấy đơn vị?\n• GV hướng dẫn HS viết thành tổng: 63 528 = 60 000 + 3 000 + 500 + 20 + 8.\n• GV mời 2 HS lên bảng tương tác điền các thẻ số tương ứng vào bảng phân hàng.',
        studentActivity:
          '• HS quan sát hình ảnh trực quan trên TV, lắng nghe câu hỏi của GV.\n• HS làm việc cá nhân viết số vào bảng con theo hiệu lệnh.\n• 2 HS lên bảng gắn thẻ số đúng vị trí các hàng.\n• Cả lớp nhận xét, thảo luận và rút ra quy tắc phân tích số.',
        expectedProduct: 'Học sinh viết thành thạo biểu diễn số thành tổng các hàng: a b c d e = a0 000 + b000 + c00 + d0 + e.',
        assessmentNote: 'Quan sát thao tác viết bảng con của HS, hỗ trợ kịp thời các bạn còn nhầm lẫn hàng chục và hàng trăm.',
      },
      {
        id: 'act-3',
        phase: 'LUYEN_TAP',
        title: 'Hoạt động 3: Luyện tập — Thực hành làm bài tập SGK (13 phút)',
        durationMinutes: 13,
        goal: 'Học sinh vận dụng giải quyết bài tập 1, bài tập 2, bài tập 3 trang 6 SGK Toán 4 tập 1.',
        teacherActivity:
          '• Bài 1: GV chiếu đề bài lên TV, cho HS làm việc cá nhân vào vở, 2 HS làm bảng phụ.\n• Bài 2 (So sánh số): GV tổ chức trò chơi "Ai Nhanh Hơn", điền dấu >, <, =.\n• Bài 3 (Sắp xếp theo thứ tự từ bé đến lớn): GV cho thảo luận nhóm đôi trong 3 phút.\n• GV bật đồng hồ đếm ngược 5 phút trên TV để các con rèn tác phong làm bài nhanh nhẹn.\n• GV chấm chữa bài, chiếu bài làm xuất sắc của học sinh lên TV để tuyên dương.',
        studentActivity:
          '• HS mở SGK trang 6, tập trung làm bài 1, 2, 3 vào vở bài tập.\n• Thảo luận nhóm đôi so sánh bài giải với bạn bên cạnh.\n• Đại diện 2 nhóm lên bảng trình bày bài giải và giải thích cách làm.',
        expectedProduct: 'Vở ghi trình bày sạch đẹp, làm đúng 100% bài 1, 2, 3; biết giải thích cách so sánh hai số có cùng số chữ số.',
        assessmentNote: 'Đánh giá năng lực giải toán độc lập và năng lực hợp tác nhóm đôi.',
      },
      {
        id: 'act-4',
        phase: 'VAN_DUNG',
        title: 'Hoạt động 4: Vận dụng & Trải nghiệm — "Đi Chợ Siêu Thị Cùng Mẹ" (5 phút)',
        durationMinutes: 5,
        goal: 'Vận dụng kiến thức đọc số và so sánh giá tiền các mặt hàng thực tế trong cuộc sống.',
        teacherActivity:
          '• GV trình chiếu hình ảnh quầy hàng siêu thị với các mức giá: Balo (85 000đ), Hộp bút (32 000đ), Bộ thước (15 000đ).\n• GV nêu câu hỏi: Mẹ có 100 000 đồng, mua 1 Balo và 1 Bộ thước thì có đủ tiền không? Còn thừa bao nhiêu?\n• GV tổng kết bài học, nhận xét tiết học, dặn dò chuẩn bị bài Tiết 2.',
        studentActivity:
          '• HS quan sát tình huống thực tế trên TV, tính nhẩm nhanh: 85 000 + 15 000 = 100 000 đồng.\n• HS xung phong trả lời và giải thích cách tính.\n• Lắng nghe cô giáo dặn dò và ghi nhớ chuẩn bị bài học sau.',
        expectedProduct: 'HS tính đúng: 85 000 + 15 000 = 100 000đ, đủ tiền mua và không còn thừa.',
        assessmentNote: 'Đánh giá khả năng liên hệ toán học vào đời sống thực tiễn.',
      },
    ],
    postLessonNotes: 'Học sinh tiếp thu bài hào hứng, 100% đọc viết thành thạo số có 5 chữ số. Cần lưu ý nhắc em Hoàng Nam và Minh Khôi viết số 0 và số 8 rõ nét hơn.',
    slides: [
      {
        id: 'sl-1',
        title: 'BÀI 1: ÔN TẬP CÁC SỐ ĐẾN 100 000 (TIẾT 1)',
        subtitle: 'Môn Toán Lớp 4 — Bộ sách Kết nối tri thức với cuộc sống',
        phase: 'KHOI_DONG',
        layout: 'TITLE',
        content: ['Chào mừng các con học sinh thân yêu đến với tiết Toán!', 'Chuẩn bị: SGK Toán 4, Vở bài tập, Bảng con và Bút viết'],
        speakerNotes: 'Tạo không khí vui tươi, mời cả lớp vỗ tay chào đón tiết học.',
      },
      {
        id: 'sl-2',
        title: 'VÒNG QUAY CON SỐ BÍ ẨN',
        subtitle: 'Trò chơi Khởi động — Ai là chuyên gia đọc số?',
        phase: 'KHOI_DONG',
        layout: 'GAME_WHEEL',
        content: ['Vòng quay sẽ chọn ngẫu nhiên 1 bạn may mắn.', 'Đọc to số xuất hiện và nêu giá trị của từng chữ số!'],
        speakerNotes: 'Nhấn nút Quay Vòng để chọn học sinh ngẫu nhiên.',
      },
      {
        id: 'sl-3',
        title: 'THỬ THÁCH ĐỌC SỐ NHANH',
        subtitle: 'Khởi động não bộ',
        phase: 'KHOI_DONG',
        layout: 'INTERACTIVE_QUIZ',
        content: ['Số 63 528 có chữ số 6 thuộc hàng nào và có giá trị là bao nhiêu?'],
        question: 'Chữ số 6 trong số 63 528 có giá trị là:',
        options: ['600', '6 000', '60 000', '60'],
        correctOption: 2,
        explanation: 'Chữ số 6 ở hàng chục nghìn nên có giá trị là 60 000.',
      },
      {
        id: 'sl-4',
        title: 'CẤU TRÚC CÁC HÀNG VÀ CẤU TẠO THẬP PHÂN',
        subtitle: 'Khám phá kiến thức trọng tâm',
        phase: 'KHAM_PHA',
        layout: 'TWO_COLUMNS',
        content: [
          'Hàng Chục nghìn: 6 chục nghìn = 60 000',
          'Hàng Nghìn: 3 nghìn = 3 000',
          'Hàng Trăm: 5 trăm = 500',
          'Hàng Chục: 2 chục = 20',
          'Hàng Đơn vị: 8 đơn vị = 8',
          '👉 63 528 = 60 000 + 3 000 + 500 + 20 + 8',
        ],
        speakerNotes: 'Nhấn mạnh mối quan hệ giữa các hàng liền kề gấp kém nhau 10 lần.',
      },
      {
        id: 'sl-5',
        title: 'THỰC HÀNH LUYỆN TẬP — BÀI TẬP 1, 2, 3 SGK',
        subtitle: 'Thời gian làm bài tập trung: 5 phút',
        phase: 'LUYEN_TAP',
        layout: 'COUNTDOWN_TASK',
        content: [
          'Bài 1: Viết số thích hợp vào chỗ chấm.',
          'Bài 2: Điền dấu >, <, = thích hợp.',
          'Bài 3: Sắp xếp các số theo thứ tự từ bé đến lớn.',
        ],
        timerSeconds: 300,
        speakerNotes: 'Bật đồng hồ đếm ngược 5 phút, đi quanh lớp hỗ trợ học sinh.',
      },
      {
        id: 'sl-6',
        title: 'ĐÁP ÁN & ĐỐI CHIẾU KẾT QUẢ',
        subtitle: 'Kiểm tra chéo bài làm cùng bạn',
        phase: 'LUYEN_TAP',
        layout: 'BULLETS',
        content: [
          '✅ Bài 1: 45 820 < 45 821 < 45 822 < 45 823',
          '✅ Bài 2: 78 500 > 78 499 | 99 999 < 100 000',
          '✅ Bài 3: 23 450 -> 34 520 -> 43 250 -> 54 320',
        ],
      },
      {
        id: 'sl-7',
        title: 'VẬN DỤNG: ĐI SIÊU THỊ CÙNG MẸ 🛒',
        subtitle: 'Bài toán thực tế',
        phase: 'VAN_DUNG',
        layout: 'INTERACTIVE_QUIZ',
        content: ['Balo giá 85 000đ, Bộ thước giá 15 000đ. Mẹ có 100 000đ.'],
        question: 'Mẹ có đủ tiền mua cả 2 món đồ trên không?',
        options: ['Đủ tiền và vừa hết 100 000đ', 'Thiếu 10 000đ', 'Thừa 20 000đ', 'Không đủ tiền'],
        correctOption: 0,
        explanation: 'Tổng số tiền: 85 000 + 15 000 = 100 000đ (Vừa đủ tiền).',
      },
      {
        id: 'sl-8',
        title: 'TỔNG KẾT BÀI HỌC & DẶN DÒ',
        subtitle: 'Tiết học hôm nay của chúng mình thật tuyệt vời!',
        phase: 'TONG_KET',
        layout: 'SUMMARY',
        content: [
          '⭐ Hôm nay các con đã ôn tập vững chắc các số đến 100 000.',
          '📖 Về nhà: Làm bài tập trong Vở bài tập Toán trang 7.',
          '📐 Chuẩn bị trước bài: Bài 2 — Ôn tập các phép tính trong phạm vi 100 000.',
        ],
      },
    ],
  },

  // ─── 2. TIẾNG VIỆT 4: BÀI 1 - DANH TỪ ───
  {
    id: 'lp-tv4-w1-p2',
    classId: 'demo-class',
    grade: 4,
    subjectCode: 'TIENG_VIET',
    subjectName: 'Tiếng Việt',
    textbook: 'KET_NOI_TRI_THUC',
    week: 1,
    periodNumber: 2,
    createdAt: '2026-08-29T08:00:00.000Z',
    title: 'Bài 1: Danh từ (Luyện từ và câu)',
    durationMinutes: 35,
    objectives: {
      specificCompetencies: [
        'Hiểu thế nào là danh từ: từ chỉ người, vật, con vật, hiện tượng tự nhiên, thời gian.',
        'Nhận biết và tìm được các danh từ trong câu văn, đoạn thơ cho trước.',
        'Biết đặt câu với danh từ và sử dụng danh từ chính xác trong văn miêu tả.',
      ],
      generalCompetencies: [
        'Năng lực ngôn ngữ: Diễn đạt rõ ràng, sử dụng từ ngữ phong phú, chính xác.',
        'Năng lực giao tiếp và hợp tác: Tự tin trao đổi ý kiến trước lớp, làm việc nhóm hiệu quả.',
      ],
      qualities: [
        'Yêu nước: Tự hào về sự giàu đẹp, phong phú của Tiếng Việt.',
        'Chăm chỉ: Say mê đọc sách, tích cực tìm tòi từ vựng mới.',
      ],
    },
    equipment: {
      teacher: [
        'Màn hình TV trình chiếu slide bài học Danh từ.',
        'Bộ thẻ từ phân loại (Thẻ từ chỉ người, vật, con vật, hiện tượng).',
        'Bảng phụ và phiếu học tập in sẵn.',
      ],
      students: [
        'SGK Tiếng Việt 4 tập 1 (Bộ Kết nối tri thức).',
        'Vở bài tập Tiếng Việt 4, bút highlight.',
      ],
    },
    activities: [
      {
        id: 'tv-act-1',
        phase: 'KHOI_DONG',
        title: 'Hoạt động 1: Khởi động — Trò chơi "Nhìn Tranh Đoán Tên" (5 phút)',
        durationMinutes: 5,
        goal: 'Khơi gợi hứng thú, dẫn dắt học sinh gọi tên các sự vật xung quanh.',
        teacherActivity:
          '• GV chiếu 4 bức tranh lên TV: Cô giáo, Cây bàng, Chú mèo, Cơn mưa.\n• GV yêu cầu HS gọi tên sự vật trong tranh.\n• GV đặt vấn đề: Những từ các con vừa gọi tên được gọi là loại từ gì? Chúng ta cùng khám phá bài Danh từ!',
        studentActivity:
          '• HS quan sát tranh, xung phong trả lời nhanh: Cô giáo, cây bàng, chú mèo, cơn mưa.\n• Lắng nghe GV giới thiệu bài học mới.',
        expectedProduct: 'HS gọi đúng tên 4 sự vật trong tranh.',
        assessmentNote: 'Đánh giá vốn từ vựng ban đầu của học sinh.',
      },
      {
        id: 'tv-act-2',
        phase: 'KHAM_PHA',
        title: 'Hoạt động 2: Khám phá — Khái niệm Danh từ (12 phút)',
        durationMinutes: 12,
        goal: 'Học sinh hình thành khái niệm Danh từ và các nhóm danh từ cơ bản.',
        teacherActivity:
          '• GV cho HS đọc đoạn văn mẫu trong SGK trang 8.\n• GV chia lớp thành 4 nhóm tương ứng 4 nhiệm vụ:\n  - Nhóm 1: Tìm từ chỉ người\n  - Nhóm 2: Tìm từ chỉ con vật\n  - Nhóm 3: Tìm từ chỉ cây cối, đồ vật\n  - Nhóm 4: Tìm từ chỉ hiện tượng tự nhiên\n• GV chốt kiến thức: Danh từ là những từ chỉ sự vật (người, vật, hiện tượng, thời gian...).',
        studentActivity:
          '• HS đọc thầm đoạn văn, làm việc theo nhóm 4 ghi kết quả vào bảng nhóm.\n• Đại diện các nhóm lên dán bảng và trình bày trước lớp.\n• Cả lớp đọc đồng thanh ghi nhớ trong khung màu xanh SGK.',
        expectedProduct: 'Bảng nhóm tìm đúng: Chỉ người (học sinh, cô giáo), Chỉ vật (bàn ghế, sách vở), Chỉ hiện tượng (nắng, gió, mưa).',
        assessmentNote: 'Đánh giá năng lực hợp tác nhóm và khả năng phân loại từ.',
      },
      {
        id: 'tv-act-3',
        phase: 'LUYEN_TAP',
        title: 'Hoạt động 3: Luyện tập — Tìm danh từ và đặt câu (13 phút)',
        durationMinutes: 13,
        goal: 'Học sinh làm bài tập 1, 2 SGK trang 9; rèn kỹ năng đặt câu đúng ngữ pháp.',
        teacherActivity:
          '• Bài 1: GV chiếu bài thơ "Mẹ vắng nhà ngày bão" lên TV, yêu cầu HS gạch chân các danh từ.\n• Bài 2: Yêu cầu mỗi HS đặt 1 câu có ít nhất 2 danh từ vừa tìm được.\n• GV đi quanh lớp chấm bài, gọi 3 HS đọc to câu văn của mình.',
        studentActivity:
          '• HS dùng bút chì gạch chân danh từ trong SGK.\n• Viết câu văn vào vở bài tập (VD: "Bố em là bác sĩ chữa bệnh cho mọi người.").',
        expectedProduct: 'HS tìm đúng ít nhất 6 danh từ trong bài thơ và đặt câu đúng ngữ pháp, đầu câu viết hoa, cuối câu có dấu chấm.',
        assessmentNote: 'Đánh giá kỹ năng viết câu và vận dụng danh từ.',
      },
      {
        id: 'tv-act-4',
        phase: 'VAN_DUNG',
        title: 'Hoạt động 4: Vận dụng — Trò chơi "Ai Là Bậc Thầy Từ Vựng?" (5 phút)',
        durationMinutes: 5,
        goal: 'Mở rộng vốn danh từ và củng cố kiến thức cuối tiết.',
        teacherActivity:
          '• GV tổ chức thi đua tiếp sức giữa 2 dãy bàn: Trong 2 phút, viết tiếp các danh từ chỉ đồ dùng học tập lên bảng.\n• GV đếm số lượng từ đúng, trao cúp chiến thắng và cộng ⭐ cho đội thắng cuộc.',
        studentActivity:
          '• Đại diện 2 đội nối tiếp nhau lên bảng viết nhanh các từ: thước kẻ, bút mực, tẩy chì, compa, cặp sách...\n• Cả lớp cổ vũ sôi nổi.',
        expectedProduct: 'Mỗi đội viết được 8 - 10 danh từ đúng chủ đề.',
        assessmentNote: 'Tạo không khí kết thúc tiết học hào hứng, vui vẻ.',
      },
    ],
    postLessonNotes: 'Các em nắm bài rất nhanh, phân biệt tốt từ chỉ hiện tượng tự nhiên. Đặt câu sinh động, có hình ảnh.',
    slides: [
      {
        id: 'tv-sl-1',
        title: 'BÀI 1: DANH TỪ (LUYỆN TỪ VÀ CÂU)',
        subtitle: 'Môn Tiếng Việt Lớp 4 — Bộ sách Kết nối tri thức',
        phase: 'KHOI_DONG',
        layout: 'TITLE',
        content: ['Chào mừng các em đến với thế giới từ vựng Tiếng Việt!', 'Khám phá: Danh từ là gì và có những loại danh từ nào?'],
      },
      {
        id: 'tv-sl-2',
        title: 'KHÁM PHÁ: DANH TỪ LÀ GÌ?',
        subtitle: 'Khái niệm cốt lõi',
        phase: 'KHAM_PHA',
        layout: 'TWO_COLUMNS',
        content: [
          '👨‍🏫 Từ chỉ NGƯỜI: cô giáo, học sinh, bác sĩ...',
          '🐕 Từ chỉ CON VẬT: chim sơn ca, chú mèo, đàn cá...',
          '📚 Từ chỉ ĐỒ VẬT, CÂY CỐI: cây bàng, bàn ghế, cặp sách...',
          '🌧️ Từ chỉ HIỆN TƯỢNG: mưa rào, sấm sét, gió bão...',
          '⏰ Từ chỉ THỜI GIAN: mùa xuân, buổi sáng, thế kỉ...',
        ],
      },
      {
        id: 'tv-sl-3',
        title: 'THỬ TÀI PHÂN LOẠI DANH TỪ',
        subtitle: 'Trắc nghiệm tương tác',
        phase: 'LUYEN_TAP',
        layout: 'INTERACTIVE_QUIZ',
        content: ['Tìm danh từ chỉ hiện tượng tự nhiên trong các từ sau:'],
        question: 'Từ nào sau đây là danh từ chỉ HIỆN TƯỢNG TỰ NHIÊN?',
        options: ['Chạy bộ', 'Cơn mưa', 'Thông minh', 'Xinh đẹp'],
        correctOption: 1,
        explanation: '"Cơn mưa" là danh từ chỉ hiện tượng tự nhiên. "Chạy bộ" là động từ, "Thông minh" và "Xinh đẹp" là tính từ.',
      },
      {
        id: 'tv-sl-4',
        title: 'TỔNG KẾT & GHI NHỚ',
        subtitle: 'Về nhà rèn luyện',
        phase: 'TONG_KET',
        layout: 'SUMMARY',
        content: [
          '💡 Danh từ là từ chỉ sự vật (người, vật, con vật, hiện tượng, thời gian).',
          '✍️ Bài tập: Tìm 5 danh từ chỉ cây cối trong vườn nhà em và đặt 2 câu.',
          '📖 Chuẩn bị bài tiếp theo: Danh từ chung và danh từ riêng.',
        ],
      },
    ],
  },

  // ─── 3. KHOA HỌC 4: BÀI 1 - TÍNH CHẤT VÀ VAI TRÒ CỦA NƯỚC ───
  {
    id: 'lp-kh4-w1-p1',
    classId: 'demo-class',
    grade: 4,
    subjectCode: 'KHOA_HOC',
    subjectName: 'Khoa học',
    textbook: 'KET_NOI_TRI_THUC',
    week: 1,
    periodNumber: 1,
    createdAt: '2026-08-29T08:00:00.000Z',
    title: 'Bài 1: Tính chất và vai trò của nước (Tiết 1)',
    durationMinutes: 35,
    objectives: {
      specificCompetencies: [
        'Quan sát và làm thí nghiệm đơn giản để nêu được tính chất của nước: trong suốt, không màu, không mùi, không vị, không có hình dạng nhất định.',
        'Nêu được nước chảy từ cao xuống thấp, lan ra khắp mọi phía, thấm qua một số vật và hòa tan một số chất.',
      ],
      generalCompetencies: [
        'Năng lực tìm hiểu tự nhiên: Thực hiện các thí nghiệm khoa học theo hướng dẫn.',
        'Năng lực hợp tác: Làm việc nhóm an toàn, ghi chép nhật ký thí nghiệm.',
      ],
      qualities: [
        'Trách nhiệm: Có ý thức bảo vệ nguồn nước sạch và tiết kiệm nước sinh hoạt.',
      ],
    },
    equipment: {
      teacher: [
        'Slide TV chiếu video thí nghiệm hòa tan của nước.',
        'Bộ dụng cụ: Cốc thủy tinh, chai nhựa các hình dạng, nước lọc, sữa, muối, đường, cát.',
      ],
      students: ['SGK Khoa học 4, phiếu báo cáo thí nghiệm.'],
    },
    activities: [
      {
        id: 'kh-act-1',
        phase: 'KHOI_DONG',
        title: 'Hoạt động 1: Khởi động — Câu đố vui về nước (5 phút)',
        durationMinutes: 5,
        goal: 'Kích thích trí tò mò của học sinh về nước.',
        teacherActivity: '• GV đọc câu đố: "Không màu, không mùi, không vị / Mà nuôi sự sống muôn loài tốt tươi — Là gì?"\n• GV giới thiệu bài học.',
        studentActivity: '• HS hào hứng giơ tay trả lời: Là NƯỚC!\n• Mở SGK Khoa học bài 1.',
        expectedProduct: 'HS giải đúng câu đố.',
      },
      {
        id: 'kh-act-2',
        phase: 'KHAM_PHA',
        title: 'Hoạt động 2: Khám phá — Thí nghiệm các tính chất của nước (15 phút)',
        durationMinutes: 15,
        goal: 'Học sinh tự tay làm thí nghiệm chứng minh tính chất của nước.',
        teacherActivity:
          '• GV chia nhóm 6 em, phát bộ dụng cụ thí nghiệm.\n• Thí nghiệm 1: So sánh cốc nước lọc và cốc sữa (Màu sắc, mùi vị).\n• Thí nghiệm 2: Rót nước vào các bình chứa có hình dạng khác nhau (bình tròn, bình tam giác, cốc trụ).\n• Thí nghiệm 3: Bỏ muối, đường, cát vào nước và khuấy đều.\n• GV quan sát, hỗ trợ các nhóm thao tác an toàn.',
        studentActivity:
          '• Các nhóm phân công nhiệm vụ: người rót nước, người khuấy, người ghi phiếu.\n• Quan sát hiện tượng và điền kết luận vào phiếu học tập.\n• Đại diện nhóm lên trình bày kết quả thí nghiệm.',
        expectedProduct: 'Phiếu học tập hoàn thành: Nước không màu, không mùi, không vị; có hình dạng của vật chứa; hòa tan đường/muối nhưng không hòa tan cát.',
      },
      {
        id: 'kh-act-3',
        phase: 'LUYEN_TAP',
        title: 'Hoạt động 3: Luyện tập — Thử tài nhà khoa học nhí (10 phút)',
        durationMinutes: 10,
        goal: 'Củng cố kiến thức tính chất của nước qua trò chơi trắc nghiệm.',
        teacherActivity: '• GV chiếu 3 câu hỏi trắc nghiệm tương tác lên TV.\n• Cho các tổ bấm chuông giành quyền trả lời.',
        studentActivity: '• HS thảo luận nhanh và bấm chuông chọn đáp án.',
        expectedProduct: 'Chọn đúng đáp án 100%.',
      },
      {
        id: 'kh-act-4',
        phase: 'VAN_DUNG',
        title: 'Hoạt động 4: Vận dụng — Ứng dụng tính chất của nước trong đời sống (5 phút)',
        durationMinutes: 5,
        goal: 'Liên hệ thực tế: Pha nước chanh, làm mái nhà dốc để thoát nước mưa.',
        teacherActivity:
          '• GV hỏi: Vì sao mái nhà người ta thường làm dốc? Vì sao ta có thể pha nước chanh đường?\n• GV giáo dục ý thức tiết kiệm nước: Tắt vòi nước khi không sử dụng.',
        studentActivity: '• HS giải thích dựa vào tính chất: Nước chảy từ cao xuống thấp và Nước hòa tan đường.',
        expectedProduct: 'HS nêu được ít nhất 2 ứng dụng thực tế của nước.',
      },
    ],
    postLessonNotes: 'Tiết học diễn ra rất sôi nổi, học sinh hào hứng làm thí nghiệm. Tất cả các nhóm hoàn thành tốt phiếu học tập.',
    slides: [
      {
        id: 'kh-sl-1',
        title: 'BÀI 1: TÍNH CHẤT VÀ VAI TRÒ CỦA NƯỚC',
        subtitle: 'Môn Khoa Học Lớp 4 — Bộ sách Kết nối tri thức',
        phase: 'KHOI_DONG',
        layout: 'TITLE',
        content: ['Chào mừng các nhà khoa học nhí đến với phòng thí nghiệm!', 'Hôm nay chúng ta sẽ cùng khám phá những bí mật kì diệu của nước!'],
      },
      {
        id: 'kh-sl-2',
        title: 'CÁC TÍNH CHẤT KỲ DIỆU CỦA NƯỚC',
        subtitle: 'Kết quả từ phòng thí nghiệm',
        phase: 'KHAM_PHA',
        layout: 'BULLETS',
        content: [
          '💧 Nước là chất lỏng trong suốt, không màu, không mùi, không vị.',
          '🍶 Nước không có hình dạng nhất định (có hình dạng của vật chứa nó).',
          '⛰️ Nước chảy từ cao xuống thấp, lan ra khắp mọi phía.',
          '🧂 Nước hòa tan được đường, muối... nhưng không hòa tan cát, dầu ăn.',
          '🧻 Nước thấm qua vải, giấy... nhưng không thấm qua nilon, kính.',
        ],
      },
      {
        id: 'kh-sl-3',
        title: 'CÂU HỎI KHOA HỌC',
        subtitle: 'Thử thách hiểu biết',
        phase: 'LUYEN_TAP',
        layout: 'INTERACTIVE_QUIZ',
        content: ['Chất nào sau đây KHÔNG bị hòa tan trong nước?'],
        question: 'Chất nào sau đây KHÔNG hòa tan trong nước?',
        options: ['Đường', 'Muối ăn', 'Cát mịn', 'Viên sủi vitamin C'],
        correctOption: 2,
        explanation: 'Cát mịn không tan trong nước và sẽ lắng xuống đáy cốc sau khi khuấy.',
      },
    ],
  },
];
