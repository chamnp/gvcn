import {
  ParentMeetingDoc,
  ParentMeetingType,
  MeetingAgendaTopic,
  IndividualStudentMeetingNote,
  ClassInfo,
  SchoolInfo,
  Student,
  HealthRecord,
} from '@/types';

export const SAMPLE_MEETING_FAQS: { question: string; suggestedAnswer: string }[] = [
  {
    question: 'Chương trình lớp học có nhiều bài tập về nhà không, gia đình cần kèm con thế nào?',
    suggestedAnswer:
      'Theo Thông tư 27 của Bộ GD&ĐT, học sinh tiểu học (đặc biệt học 2 buổi/ngày) không giao bài tập về nhà quá tải. Ở nhà, bố mẹ chỉ cần cùng con đọc sách 15-20 phút mỗi tối, rèn thói quen chuẩn bị sách vở theo TKB và tự giác soạn đồ dùng học tập cho ngày hôm sau.',
  },
  {
    question: 'Con tôi ngồi bàn dưới có bị khuất tầm nhìn hoặc ảnh hưởng mắt không?',
    suggestedAnswer:
      'Lớp đã đo khám thị lực và ưu tiên 100% các bạn cận thị/thị lực yếu ngồi ở 2 hàng đầu. Ngoài ra, lớp thực hiện xoay vòng dãy bàn định kỳ 2 tuần/lần từ trái qua phải để các con thay đổi góc nhìn, tránh lệch mắt và cong vẹo cột sống.',
  },
  {
    question: 'Quy định sử dụng điện thoại và đồ dùng cá nhân tại lớp như thế nào?',
    suggestedAnswer:
      'Học sinh không mang điện thoại, đồng hồ thông minh có game/camera và đồ chơi đắt tiền đến lớp. Nếu cần liên lạc khẩn cấp với gia đình, giáo viên chủ nhiệm sẽ trực tiếp gọi điện hoặc nhắn tin cho bố mẹ.',
  },
  {
    question: 'Hoạt động bán trú tại trường được tổ chức và quản lý ra sao?',
    suggestedAnswer:
      'Bếp ăn của trường đạt chứng nhận An toàn thực phẩm 100%, thực đơn thay đổi hàng tuần và được công khai trên bảng tin. Các con được hướng dẫn vệ sinh cá nhân, ngủ trưa đủ giấc tại phòng học có điều hòa và cô phụ trách bán trú chăm sóc chu đáo.',
  },
];

export function generateAISpeechScript(
  type: ParentMeetingType,
  classInfo: ClassInfo,
  schoolInfo: SchoolInfo,
  totalStudents: number
): string {
  const teacherName = classInfo.teacherName || 'Cô giáo';
  const className = classInfo.name || 'Lớp';
  const schoolName = schoolInfo.name || 'Trường Tiểu học';
  const schoolYear = schoolInfo.schoolYear || '2026-2027';

  if (type === 'DAU_NAM') {
    return `Kính thưa toàn thể Quý Phụ huynh Lớp ${className},

Lời đầu tiên, thay mặt Ban giám hiệu nhà trường và với tư cách là Giáo viên chủ nhiệm Lớp ${className}, tôi xin gửi tới toàn thể Quý Phụ huynh lời chào trân trọng, lời chúc sức khỏe, hạnh phúc và thành công nhất!

Năm học ${schoolYear}, lớp chúng ta rất vui mừng được chào đón ${totalStudents} em học sinh thân yêu. Đây là một tập thể năng động, hồn nhiên và đầy tiềm năng. Để các con có được một năm học tiến bộ vượt bậc cả về Tri thức, Kỹ năng sống và Phẩm chất đạo đức, sự đồng hành, thấu hiểu và gắn kết chặt chẽ giữa Gia đình và Nhà trường là yếu tố quyết định nhất.

Trong buổi họp hôm nay, tôi xin phép được chia sẻ chi tiết về:
1. Đặc điểm tình hình lớp học, thời khóa biểu và các hoạt động học tập 2 buổi/ngày.
2. Nội quy nề nếp, quy chế bán trú và chế độ chăm sóc dinh dưỡng, sức khỏe cho các con.
3. Bầu Ban Đại Diện Cha Mẹ Học Sinh lớp để làm cầu nối thân thiết giữa phụ huynh và nhà trường.
4. Ký cam kết phối hợp giáo dục nhằm tạo môi trường an toàn, hạnh phúc nhất cho các con.

Rất mong nhận được những ý kiến đóng góp chân thành, cởi mở từ Quý Phụ huynh để xây dựng Lớp ${className} trở thành một "Lớp Học Hạnh Phúc", nơi mỗi ngày đến trường của các con thực sự là một ngày vui.

Xin trân trọng cảm ơn Quý Phụ huynh! ❤️`;
  }

  if (type === 'SO_KET_HK1') {
    return `Kính thưa toàn thể Quý Phụ huynh Lớp ${className},

Hôm nay, chúng ta cùng nhìn lại chặng đường Học kỳ 1 năm học ${schoolYear} vừa qua — một chặng đường với biết bao nỗ lực, niềm vui và sự trưởng thành của ${totalStudents} học sinh Lớp ${className}.

Nhờ sự dạy dỗ tận tình của các thầy cô và đặc biệt là sự đồng hành bền bỉ của Quý Phụ huynh, lớp chúng ta đã đạt được những kết quả rất đáng tự hào:
• Về học tập: 100% các con nắm vững chuẩn kiến thức kỹ năng môn học theo Thông tư 27, nhiều em đạt điểm kiểm tra định kỳ xuất sắc môn Toán, Tiếng Việt và Tiếng Anh.
• Về rèn luyện & nề nếp: Các con tự giác xếp hàng, giữ gìn vệ sinh chung, tích lũy hàng trăm ngôi sao chăm ngoan và biết yêu thương, giúp đỡ bạn bè.

Trong buổi họp hôm nay, tôi sẽ gửi tới từng bố mẹ Phiếu Đánh Giá Chi Tiết của từng con (được bảo mật riêng tư) và cùng trao đổi phương hướng, giải pháp đồng hành tốt hơn nữa trong Học kỳ 2.

Xin trân trọng cảm ơn sự ủng hộ nhiệt thành của Quý Phụ huynh suốt thời gian qua! ❤️`;
  }

  return `Kính thưa toàn thể Quý Phụ huynh Lớp ${className},

Thấm thoát một năm học ${schoolYear} đầy ắp kỷ niệm đã khép lại. Hôm nay, chúng ta sum họp trong buổi Họp Tổng Kết Năm Học để cùng chia sẻ niềm vui trước sự khôn lớn, trưởng thành vượt bậc của ${totalStudents} thiên thần nhỏ Lớp ${className}.

Các con đã hoàn thành xuất sắc chương trình học tập của khối lớp, đạt nhiều thành tích cao trong học tập, thể thao và các hoạt động trải nghiệm sáng tạo. Thay mặt nhà trường, tôi xin gửi lời cảm ơn sâu sắc nhất tới Ban Đại Diện CMHS và toàn thể Quý Phụ huynh đã luôn tin tưởng, đồng hành và sẻ chia cùng cô trò trong suốt năm học.

Chúc các con có một kỳ nghỉ hè thật bổ ích, an toàn và tràn đầy niềm vui bên gia đình!

Xin trân trọng cảm ơn! ❤️`;
}

export function generateDefaultAgendaTopics(
  type: ParentMeetingType,
  classInfo: ClassInfo,
  totalStudents: number
): MeetingAgendaTopic[] {
  const className = classInfo.name || 'Lớp';

  if (type === 'DAU_NAM') {
    return [
      {
        id: 'top-1',
        title: 'Chào Mừng & Giới Thiệu Giáo Viên Chủ Nhiệm',
        iconEmoji: '👋',
        durationMinutes: 10,
        layout: 'TITLE',
        talkingPoints: [
          `Chào mừng Quý Phụ huynh đến với buổi Họp Phụ Huynh Lớp ${className}`,
          `Giới thiệu GVCN: ${classInfo.teacherName || 'Cô giáo chủ nhiệm'}`,
          'Thông tin liên hệ, số điện thoại khẩn cấp và các kênh liên lạc chính thức (Zalo Lớp)',
        ],
        importantNote: 'Tạo không khí ấm cúng, thân thiện ngay từ phút đầu tiên',
        isEnabled: true,
      },
      {
        id: 'top-2',
        title: `Đặc Điểm Tình Hình & Sĩ Số Lớp ${className}`,
        iconEmoji: '🏫',
        durationMinutes: 15,
        layout: 'STATS',
        talkingPoints: [
          `Tổng số học sinh: ${totalStudents} em`,
          'Phân chia chỗ ngồi khoa học, ưu tiên học sinh cận thị và xoay vòng dãy bàn định kỳ',
          'Đặc điểm tâm sinh lý lứa tuổi tiểu học và những lưu ý phụ huynh cần chú ý',
        ],
        importantNote: 'Nhấn mạnh sự công bằng và quan tâm đồng đều đến từng học sinh',
        isEnabled: true,
      },
      {
        id: 'top-3',
        title: 'Kế Hoạch Dạy Học, Thời Khóa Biểu & Sách Vở',
        iconEmoji: '📚',
        durationMinutes: 20,
        layout: 'BULLETS',
        talkingPoints: [
          'Thời khóa biểu 2 buổi/ngày: Giờ vào lớp, giờ ăn trưa, ngủ trưa và giờ tan học',
          'Bộ sách giáo khoa chuẩn, đồ dùng học tập cần chuẩn bị theo từng môn',
          'Quy định không giao bài tập về nhà quá tải, tập trung rèn thói quen đọc sách tự giác',
        ],
        importantNote: 'Hướng dẫn phụ huynh cách kiểm tra cặp sách của con mỗi tối',
        isEnabled: true,
      },
      {
        id: 'top-4',
        title: 'Nội Quy Lớp Học, Bán Trú & Bảng Sao Thi Đua',
        iconEmoji: '⭐',
        durationMinutes: 15,
        layout: 'GRID_CARDS',
        talkingPoints: [
          'Hệ thống tích lũy Sao Khen Thưởng khuyến khích học sinh chăm ngoan, tiến bộ',
          'Quy chế ăn ngủ bán trú, vệ sinh an toàn thực phẩm và chăm sóc sức khỏe học đường',
          'Quy định trang phục, đồng phục học sinh các ngày trong tuần',
        ],
        importantNote: 'Khuyến khích khen thưởng tích cực thay vì chỉ trích',
        isEnabled: true,
      },
      {
        id: 'top-5',
        title: 'Bầu Ban Đại Diện Cha Mẹ Học Sinh Lớp',
        iconEmoji: '👥',
        durationMinutes: 20,
        layout: 'COMMITTEE',
        talkingPoints: [
          'Tiêu chuẩn và trách nhiệm của Ban Đại Diện CMHS Lớp',
          'Bầu Trưởng ban, Phó ban và các Ủy viên phụ trách hoạt động lớp',
          'Thảo luận kế hoạch phối hợp tổ chức các ngày lễ, trải nghiệm và khen thưởng học sinh',
        ],
        importantNote: 'Đảm bảo sự dân chủ, minh bạch và tinh thần tự nguyện 100%',
        isEnabled: true,
      },
      {
        id: 'top-6',
        title: 'Ý Kiến Thảo Luận, Giải Đáp & Ký Cam Kết',
        iconEmoji: '💬',
        durationMinutes: 20,
        layout: 'SPEECH',
        talkingPoints: [
          'Lắng nghe tâm tư, nguyện vọng và giải đáp các băn khoăn của phụ huynh',
          'Ký cam kết phối hợp giáo dục giữa Gia đình và Nhà trường',
          'Hướng dẫn kích hoạt Cổng tra cứu thông tin học sinh trực tuyến bằng mã PIN',
        ],
        importantNote: 'Ghi chép đầy đủ vào Biên bản cuộc họp',
        isEnabled: true,
      },
    ];
  }

  if (type === 'SO_KET_HK1') {
    return [
      {
        id: 'top-1',
        title: 'Báo Cáo Kết Quả Rèn Luyện & Học Tập Học Kỳ 1',
        iconEmoji: '📊',
        durationMinutes: 20,
        layout: 'STATS',
        talkingPoints: [
          'Đánh giá các môn học theo Thông tư 27 (Mức Hoàn thành tốt T, Hoàn thành H)',
          'Kết quả rèn luyện 5 Phẩm chất và 10 Năng lực cốt lõi của học sinh',
          'Điểm kiểm tra định kỳ môn Toán, Tiếng Việt, Ngoại ngữ',
        ],
        importantNote: 'Báo cáo tổng quan, không bêu tên học sinh có điểm chưa cao trên slide chung',
        isEnabled: true,
      },
      {
        id: 'top-2',
        title: 'Vinh Danh Học Sinh Tiến Bộ & Nhiều Sao Thi Đua',
        iconEmoji: '🏆',
        durationMinutes: 15,
        layout: 'GRID_CARDS',
        talkingPoints: [
          'Tuyên dương Top học sinh tích lũy nhiều sao thi đua nhất trong học kỳ',
          'Khen ngợi các bạn có tiến bộ vượt bậc về chữ viết, tính toán và nề nếp',
          'Phát động phong trào Đôi bạn cùng tiến trong Học kỳ 2',
        ],
        importantNote: 'Khích lệ tinh thần để tất cả các con đều có động lực phấn đấu',
        isEnabled: true,
      },
      {
        id: 'top-3',
        title: 'Phương Hướng & Chỉ Tiêu Nhiệm Vụ Học Kỳ 2',
        iconEmoji: '🎯',
        durationMinutes: 15,
        layout: 'BULLETS',
        talkingPoints: [
          'Kế hoạch bồi dưỡng học sinh có năng khiếu và kèm cặp học sinh cần hỗ trợ',
          'Các kỳ thi Olympic, Trạng Nguyên Tiếng Việt, Toán VioEdu trong HK2',
          'Kế hoạch ngoại khóa và trải nghiệm sáng tạo mùa xuân',
        ],
        importantNote: 'Xác định mục tiêu rõ ràng, khả thi cho từng nhóm học sinh',
        isEnabled: true,
      },
      {
        id: 'top-4',
        title: 'Phát Phiếu Kết Quả Cá Nhân & Trao Đổi 1-1',
        iconEmoji: '📋',
        durationMinutes: 25,
        layout: 'SPEECH',
        talkingPoints: [
          'Phát tận tay từng phụ huynh Phiếu Đánh Giá Cá Nhân của con',
          'Trao đổi riêng về ưu điểm và điểm cần gia đình kèm cặp thêm',
          'Lấy ý kiến đóng góp của phụ huynh về công tác chăm sóc bán trú',
        ],
        importantNote: 'Bảo mật thông tin cá nhân của từng học sinh',
        isEnabled: true,
      },
    ];
  }

  return [
    {
      id: 'top-1',
      title: 'Báo Cáo Tổng Kết Toàn Diện Năm Học',
      iconEmoji: '🎓',
      durationMinutes: 25,
      layout: 'STATS',
      talkingPoints: [
        'Tổng kết tỷ lệ hoàn thành chương trình lớp học của 100% học sinh',
        'Báo cáo các giải thưởng cấp Trường, Quận và Thành phố của lớp',
        'Đánh giá sự trưởng thành về kỹ năng sống, tinh thần tự lập và thể chất',
      ],
      importantNote: 'Khẳng định sự tiến bộ của từng em so với đầu năm học',
      isEnabled: true,
    },
    {
      id: 'top-2',
      title: 'Công Bố Danh Hiệu Khen Thưởng TT27',
      iconEmoji: '🥇',
      durationMinutes: 20,
      layout: 'GRID_CARDS',
      talkingPoints: [
        'Danh hiệu Học sinh Xuất sắc và Học sinh Tiêu biểu theo Điều 13 TT27',
        'Khen thưởng các cá nhân có thành tích vượt trội từng môn học',
        'Trao giấy khen và phần thưởng cho các tập thể Tổ xuất sắc',
      ],
      importantNote: 'Tạo không khí trang trọng, tự hào cho phụ huynh và học sinh',
      isEnabled: true,
    },
    {
      id: 'top-3',
      title: 'Bàn Giao Học Sinh Về Sinh Hoạt Hè',
      iconEmoji: '🏖️',
      durationMinutes: 15,
      layout: 'BULLETS',
      talkingPoints: [
        'Kế hoạch bàn giao sinh hoạt hè về địa phương theo quy định',
        'Dặn dò an toàn mùa hè: Phòng chống đuối nước, tai nạn thương tích và an toàn giao thông',
        'Gợi ý các hoạt động đọc sách, rèn luyện thể thao và phụ giúp việc nhà trong kỳ nghỉ hè',
      ],
      importantNote: 'Nhấn mạnh an toàn phòng chống đuối nước và kỹ năng sống',
      isEnabled: true,
    },
    {
      id: 'top-4',
      title: 'Tri Ân Phụ Huynh & Bế Mạc Hội Nghị',
      iconEmoji: '💐',
      durationMinutes: 15,
      layout: 'TITLE',
      talkingPoints: [
        'Lời tri ân sâu sắc gửi tới Ban Đại Diện CMHS và toàn thể Quý Phụ huynh',
        'Báo cáo quyết toán thu chi các hoạt động lớp trong năm học (công khai, minh bạch)',
        'Ký biên bản tổng kết năm học',
      ],
      importantNote: 'Gửi lời cảm ơn chân thành và lưu giữ kỷ niệm đẹp của năm học',
      isEnabled: true,
    },
  ];
}

export function autoGenerateIndividualNotes(
  students: Student[],
  getStarsFn?: (studentId: string) => number,
  healthRecords?: HealthRecord[]
): IndividualStudentMeetingNote[] {
  return students.map((st) => {
    const stars = getStarsFn ? getStarsFn(st.id) : 0;
    const isGoodStudent = stars >= 10;
    const isNearsighted =
      (healthRecords || []).find((h) => h.studentId === st.id)?.hasVisionDefect ||
      (st.healthNotes || '').toLowerCase().includes('cận');

    let academic = isGoodStudent
      ? 'Học lực tốt, tiếp thu bài nhanh, làm bài tập đầy đủ và tính toán chính xác.'
      : 'Học lực khá, nắm được kiến thức trọng tâm; cần rèn thêm tính cẩn thận khi làm bài.';

    let behavior = stars > 5
      ? `Ngoan ngoãn, lễ phép, tích cực phát biểu xây dựng bài và đạt ${stars} sao thi đua.`
      : 'Ngoan ngoãn, chấp hành tốt nội quy lớp; đôi khi còn nói chuyện riêng trong giờ học.';

    let action = isNearsighted
      ? 'Nhắc nhở con đeo kính đúng độ, giữ khoảng cách mắt khi đọc sách và ngồi học đúng tư thế.'
      : 'Gia đình cùng con đọc sách 15 phút mỗi tối và nhắc con chuẩn bị sách vở theo TKB.';

    return {
      studentId: st.id,
      studentName: st.fullName,
      academicSummary: academic,
      behaviorSummary: behavior,
      actionItemForParents: action,
      isPriorityDiscussion: !isGoodStudent || stars === 0,
      parentPhone: st.parentPhone,
    };
  });
}
