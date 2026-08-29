import {
  ParentMeetingType,
  MeetingAgendaTopic,
  IndividualStudentMeetingNote,
  ClassInfo,
  SchoolInfo,
  Student,
  HealthRecord,
  SubjectAssessment,
  TraitAssessment,
  GradeLevel,
  TermType,
} from '@/types';
import { PRIMARY_SUBJECTS, TRAIT_DEFINITIONS, getSubjectsForGrade } from '@/lib/tt27-engine';

// ─── Class Statistics Auto-Collect ─────────────────────────────────────────────

export interface ClassStatistics {
  totalStudents: number;
  totalMale: number;
  totalFemale: number;
  totalBoarding: number;
  avgStars: number;
  topStarStudents: { name: string; stars: number }[];
  // Per-subject T/H/C distribution (for the current/latest term)
  subjectStats: {
    code: string;
    shortName: string;
    countT: number;
    countH: number;
    countC: number;
    totalAssessed: number;
    avgScore?: number;
  }[];
  // Trait summary
  traitStats: {
    code: string;
    shortName: string;
    category: string;
    countT: number;
    countD: number;
    countC: number;
    totalAssessed: number;
  }[];
  // Health
  nearsightedCount: number;
}

export function generateClassStatistics(
  students: Student[],
  subjectAssessments: SubjectAssessment[],
  traitAssessments: TraitAssessment[],
  healthRecords: HealthRecord[],
  getStarsFn: (studentId: string) => number,
  grade: GradeLevel,
  term: TermType
): ClassStatistics {
  const totalStudents = students.length;
  const totalMale = students.filter((s) => s.gender === 'Nam').length;
  const totalFemale = students.filter((s) => s.gender === 'Nữ').length;
  const totalBoarding = students.filter((s) => s.isBoarding).length;

  // Stars
  const starsMap = students.map((s) => ({ name: s.fullName, stars: getStarsFn(s.id) }));
  const avgStars = totalStudents > 0 ? Math.round((starsMap.reduce((acc, s) => acc + s.stars, 0) / totalStudents) * 10) / 10 : 0;
  const topStarStudents = [...starsMap].sort((a, b) => b.stars - a.stars).slice(0, 5);

  // Subject stats
  const subjects = getSubjectsForGrade(grade);
  const termAssessments = subjectAssessments.filter((a) => a.term === term);
  const subjectStats = subjects.map((sub) => {
    const subAss = termAssessments.filter((a) => a.subjectCode === sub.code);
    const countT = subAss.filter((a) => a.level === 'T').length;
    const countH = subAss.filter((a) => a.level === 'H').length;
    const countC = subAss.filter((a) => a.level === 'C').length;
    const scores = subAss.filter((a) => a.score != null).map((a) => a.score!);
    const avgScore = scores.length > 0 ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : undefined;
    return {
      code: sub.code,
      shortName: sub.shortName,
      countT,
      countH,
      countC,
      totalAssessed: subAss.length,
      avgScore,
    };
  });

  // Trait stats
  const termTraits = traitAssessments.filter((a) => a.term === term);
  const traitStats = TRAIT_DEFINITIONS.map((trait) => {
    const tAss = termTraits.filter((a) => a.traitCode === trait.code);
    return {
      code: trait.code,
      shortName: trait.shortName,
      category: trait.category,
      countT: tAss.filter((a) => a.level === 'T').length,
      countD: tAss.filter((a) => a.level === 'Đ').length,
      countC: tAss.filter((a) => a.level === 'C').length,
      totalAssessed: tAss.length,
    };
  });

  const nearsightedCount = healthRecords.filter((h) => h.hasVisionDefect).length;

  return {
    totalStudents,
    totalMale,
    totalFemale,
    totalBoarding,
    avgStars,
    topStarStudents,
    subjectStats,
    traitStats,
    nearsightedCount,
  };
}

// ─── FAQ Bank ──────────────────────────────────────────────────────────────────

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
  {
    question: 'Cách đánh giá theo Thông tư 27 khác gì với cách cho điểm trước đây?',
    suggestedAnswer:
      'Thông tư 27 đánh giá toàn diện học sinh ở 3 mức: Hoàn thành tốt (T), Hoàn thành (H), Chưa hoàn thành (C) — không xếp hạng hay so sánh giữa các em. Mục tiêu là giúp mỗi em tiến bộ theo năng lực riêng, đánh giá bằng nhận xét cụ thể từng mặt chứ không chỉ dựa vào điểm số.',
  },
  {
    question: 'Nếu con có vấn đề sức khỏe đặc biệt hoặc dị ứng, cô cần biết gì?',
    suggestedAnswer:
      'Gia đình vui lòng thông báo chi tiết bằng văn bản (hoặc ghi vào phiếu sức khỏe) để cô lưu hồ sơ và phối hợp nhà bếp, cô bán trú đặc biệt chú ý. Lớp luôn có tủ thuốc sơ cấp cứu và quy trình xử lý y tế khẩn cấp theo đúng quy định.',
  },
];

// ─── Speech Script Generator ───────────────────────────────────────────────────

export function generateAISpeechScript(
  type: ParentMeetingType,
  classInfo: ClassInfo,
  schoolInfo: SchoolInfo,
  totalStudents: number,
  stats?: ClassStatistics
): string {
  const className = classInfo.name || 'Lớp';
  const schoolYear = schoolInfo.schoolYear || '2026-2027';
  const maleCount = stats?.totalMale ?? Math.round(totalStudents * 0.52);
  const femaleCount = stats?.totalFemale ?? totalStudents - maleCount;
  const boardingCount = stats?.totalBoarding ?? 0;

  if (type === 'DAU_NAM') {
    return `Kính thưa toàn thể Quý Phụ huynh Lớp ${className},

Lời đầu tiên, thay mặt Ban giám hiệu nhà trường và với tư cách là Giáo viên chủ nhiệm Lớp ${className}, tôi xin gửi tới toàn thể Quý Phụ huynh lời chào trân trọng, lời chúc sức khỏe, hạnh phúc và thành công nhất!

Năm học ${schoolYear}, lớp chúng ta rất vui mừng được chào đón ${totalStudents} em học sinh thân yêu (${maleCount} em nam, ${femaleCount} em nữ${boardingCount > 0 ? `, ${boardingCount} em ăn bán trú tại trường` : ''}). Đây là một tập thể năng động, hồn nhiên và đầy tiềm năng. Để các con có được một năm học tiến bộ vượt bậc cả về Tri thức, Kỹ năng sống và Phẩm chất đạo đức, sự đồng hành, thấu hiểu và gắn kết chặt chẽ giữa Gia đình và Nhà trường là yếu tố quyết định nhất.

Trong buổi họp hôm nay, tôi xin phép được chia sẻ chi tiết về:
1. Đặc điểm tình hình lớp học, thời khóa biểu và các hoạt động học tập 2 buổi/ngày.
2. Nội quy nề nếp, quy chế bán trú và chế độ chăm sóc dinh dưỡng, sức khỏe cho các con.
3. Bầu Ban Đại Diện Cha Mẹ Học Sinh lớp để làm cầu nối thân thiết giữa phụ huynh và nhà trường.
4. Ký cam kết phối hợp giáo dục nhằm tạo môi trường an toàn, hạnh phúc nhất cho các con.

Rất mong nhận được những ý kiến đóng góp chân thành, cởi mở từ Quý Phụ huynh để xây dựng Lớp ${className} trở thành một "Lớp Học Hạnh Phúc", nơi mỗi ngày đến trường của các con thực sự là một ngày vui.

Xin trân trọng cảm ơn Quý Phụ huynh!`;
  }

  if (type === 'SO_KET_HK1') {
    const topStudentsStr = stats?.topStarStudents?.slice(0, 3).map((s) => s.name).join(', ') || '';
    return `Kính thưa toàn thể Quý Phụ huynh Lớp ${className},

Hôm nay, chúng ta cùng nhìn lại chặng đường Học kỳ 1 năm học ${schoolYear} vừa qua — một chặng đường với biết bao nỗ lực, niềm vui và sự trưởng thành của ${totalStudents} học sinh Lớp ${className}.

Nhờ sự dạy dỗ tận tình của các thầy cô và đặc biệt là sự đồng hành bền bỉ của Quý Phụ huynh, lớp chúng ta đã đạt được những kết quả rất đáng tự hào:
• Về học tập: Các con nắm vững chuẩn kiến thức kỹ năng các môn học theo Thông tư 27.
• Về rèn luyện & nề nếp: Các con tự giác xếp hàng, giữ gìn vệ sinh chung và biết yêu thương, giúp đỡ bạn bè.${topStudentsStr ? `\n• Tiêu biểu: ${topStudentsStr} — những bạn đạt nhiều sao thi đua nhất.` : ''}

Trong buổi họp hôm nay, tôi sẽ báo cáo kết quả đánh giá theo Thông tư 27, gửi tới từng bố mẹ Phiếu Đánh Giá Chi Tiết của từng con và cùng trao đổi phương hướng Học kỳ 2.

Xin trân trọng cảm ơn sự ủng hộ nhiệt thành của Quý Phụ huynh suốt thời gian qua!`;
  }

  return `Kính thưa toàn thể Quý Phụ huynh Lớp ${className},

Thấm thoát một năm học ${schoolYear} đầy ắp kỷ niệm đã khép lại. Hôm nay, chúng ta sum họp trong buổi Họp Tổng Kết Năm Học để cùng chia sẻ niềm vui trước sự khôn lớn, trưởng thành vượt bậc của ${totalStudents} thiên thần nhỏ Lớp ${className}.

Các con đã hoàn thành chương trình học tập của khối lớp, đạt nhiều thành tích cao trong học tập, thể thao và các hoạt động trải nghiệm sáng tạo. Thay mặt nhà trường, tôi xin gửi lời cảm ơn sâu sắc nhất tới Ban Đại Diện CMHS và toàn thể Quý Phụ huynh đã luôn tin tưởng, đồng hành và sẻ chia cùng cô trò trong suốt năm học.

Chúc các con có một kỳ nghỉ hè thật bổ ích, an toàn và tràn đầy niềm vui bên gia đình!

Xin trân trọng cảm ơn!`;
}

// ─── Default Agenda Topics ─────────────────────────────────────────────────────

export function generateDefaultAgendaTopics(
  type: ParentMeetingType,
  classInfo: ClassInfo,
  totalStudents: number
): MeetingAgendaTopic[] {
  const className = classInfo.name || 'Lớp';

  if (type === 'DAU_NAM') {
    return [
      {
        id: 'top-1', title: 'Chào Mừng & Giới Thiệu GVCN', iconEmoji: '👋',
        durationMinutes: 10, layout: 'TITLE',
        talkingPoints: [
          `Chào mừng Quý Phụ huynh đến với buổi Họp Phụ Huynh Lớp ${className}`,
          `Giới thiệu GVCN: ${classInfo.teacherName || 'Cô giáo chủ nhiệm'}`,
          'Kênh liên lạc chính thức: Zalo Lớp, số điện thoại khẩn cấp',
        ],
        importantNote: 'Tạo không khí ấm cúng, thân thiện',
        isEnabled: true,
      },
      {
        id: 'top-2', title: `Tình Hình & Sĩ Số Lớp ${className}`, iconEmoji: '🏫',
        durationMinutes: 15, layout: 'STATS',
        talkingPoints: [
          `Tổng sĩ số: ${totalStudents} em`,
          'Chỗ ngồi khoa học, ưu tiên HS cận thị, xoay vòng dãy bàn định kỳ',
          'Đặc điểm tâm sinh lý lứa tuổi tiểu học',
        ],
        isEnabled: true,
      },
      {
        id: 'top-3', title: 'Kế Hoạch Dạy Học, TKB & Sách Vở', iconEmoji: '📚',
        durationMinutes: 20, layout: 'BULLETS',
        talkingPoints: [
          'Thời khóa biểu 2 buổi/ngày, giờ vào lớp / ăn trưa / ngủ trưa / tan học',
          'Bộ sách giáo khoa, đồ dùng học tập cần chuẩn bị',
          'Không giao bài tập về nhà quá tải, rèn thói quen đọc sách',
        ],
        isEnabled: true,
      },
      {
        id: 'top-4', title: 'Nội Quy, Bán Trú & Bảng Sao Thi Đua', iconEmoji: '⭐',
        durationMinutes: 15, layout: 'GRID_CARDS',
        talkingPoints: [
          'Hệ thống Sao Khen Thưởng — khuyến khích tích cực',
          'Quy chế ăn ngủ bán trú, vệ sinh an toàn thực phẩm',
          'Quy định trang phục, đồng phục',
        ],
        isEnabled: true,
      },
      {
        id: 'top-5', title: 'Bầu Ban Đại Diện CMHS Lớp', iconEmoji: '👥',
        durationMinutes: 20, layout: 'COMMITTEE',
        talkingPoints: [
          'Tiêu chuẩn và trách nhiệm Ban ĐD CMHS',
          'Bầu Trưởng ban, Phó ban, Ủy viên',
          'Kế hoạch phối hợp tổ chức các hoạt động lớp',
        ],
        isEnabled: true,
      },
      {
        id: 'top-6', title: 'Thảo Luận, Giải Đáp & Ký Cam Kết', iconEmoji: '💬',
        durationMinutes: 20, layout: 'SPEECH',
        talkingPoints: [
          'Lắng nghe nguyện vọng và giải đáp băn khoăn của phụ huynh',
          'Ký cam kết phối hợp giáo dục Gia đình — Nhà trường',
          'Hướng dẫn kích hoạt Cổng tra cứu HS trực tuyến bằng mã PIN',
        ],
        isEnabled: true,
      },
    ];
  }

  if (type === 'SO_KET_HK1') {
    return [
      {
        id: 'top-1', title: 'Báo Cáo Kết Quả HK1 Theo TT27', iconEmoji: '📊',
        durationMinutes: 20, layout: 'STATS',
        talkingPoints: [
          'Đánh giá môn học: Mức T / H / C từng môn (Toán, TV, TA...)',
          '5 Phẩm chất + 3 Năng lực chung + Năng lực đặc thù',
          'Điểm kiểm tra định kỳ Toán, Tiếng Việt, Ngoại ngữ',
        ],
        importantNote: 'Báo cáo tổng quan, không bêu tên HS trên slide chung',
        isEnabled: true,
      },
      {
        id: 'top-2', title: 'Vinh Danh HS Tiến Bộ & Sao Thi Đua', iconEmoji: '🏆',
        durationMinutes: 15, layout: 'GRID_CARDS',
        talkingPoints: [
          'Top HS tích lũy nhiều sao nhất HK1',
          'Khen ngợi tiến bộ vượt bậc về chữ viết, tính toán, nề nếp',
          'Phát động Đôi bạn cùng tiến trong HK2',
        ],
        isEnabled: true,
      },
      {
        id: 'top-3', title: 'Phương Hướng & Nhiệm Vụ HK2', iconEmoji: '🎯',
        durationMinutes: 15, layout: 'BULLETS',
        talkingPoints: [
          'Bồi dưỡng HS năng khiếu, kèm cặp HS cần hỗ trợ',
          'Các kỳ thi: Olympic, Trạng Nguyên TV, Toán VioEdu',
          'Kế hoạch ngoại khóa, trải nghiệm sáng tạo',
        ],
        isEnabled: true,
      },
      {
        id: 'top-4', title: 'Phát Phiếu Kết Quả & Trao Đổi 1-1', iconEmoji: '📋',
        durationMinutes: 25, layout: 'SPEECH',
        talkingPoints: [
          'Phát Phiếu Đánh Giá cá nhân (bảo mật riêng tư)',
          'Trao đổi ưu/nhược điểm, điều gia đình cần phối hợp',
          'Ý kiến đóng góp về bán trú, hoạt động lớp',
        ],
        isEnabled: true,
      },
    ];
  }

  // TONG_KET_CUOI_NAM
  return [
    {
      id: 'top-1', title: 'Tổng Kết Toàn Diện Năm Học', iconEmoji: '🎓',
      durationMinutes: 25, layout: 'STATS',
      talkingPoints: [
        '100% HS hoàn thành chương trình lớp học',
        'Báo cáo giải thưởng cấp Trường, Quận, Thành phố',
        'Đánh giá trưởng thành về kỹ năng sống và thể chất',
      ],
      isEnabled: true,
    },
    {
      id: 'top-2', title: 'Công Bố Khen Thưởng TT27 (Điều 13)', iconEmoji: '🥇',
      durationMinutes: 20, layout: 'GRID_CARDS',
      talkingPoints: [
        'Danh hiệu Xuất sắc và Tiêu biểu theo Điều 13 TT27',
        'Khen thưởng cá nhân có thành tích vượt trội',
        'Giấy khen cho các Tổ xuất sắc',
      ],
      isEnabled: true,
    },
    {
      id: 'top-3', title: 'Bàn Giao Sinh Hoạt Hè', iconEmoji: '🏖️',
      durationMinutes: 15, layout: 'BULLETS',
      talkingPoints: [
        'Bàn giao sinh hoạt hè về địa phương',
        'An toàn mùa hè: Phòng chống đuối nước, ATGT',
        'Đọc sách, rèn thể thao, phụ giúp gia đình trong hè',
      ],
      isEnabled: true,
    },
    {
      id: 'top-4', title: 'Tri Ân Phụ Huynh & Bế Mạc', iconEmoji: '💐',
      durationMinutes: 15, layout: 'TITLE',
      talkingPoints: [
        'Tri ân Ban ĐD CMHS và toàn thể Quý Phụ huynh',
        'Quyết toán thu chi hoạt động lớp (công khai, minh bạch)',
        'Ký biên bản tổng kết năm học',
      ],
      isEnabled: true,
    },
  ];
}

// ─── Individual Student Notes — Auto-Collect from Real TT27 Data ───────────────

const SUBJECT_NAME_MAP: Record<string, string> = {
  TIENG_VIET: 'Tiếng Việt',
  TOAN: 'Toán',
  NGOAI_NGU: 'Ngoại ngữ',
  DAO_DUC: 'Đạo đức',
  TN_XH: 'TN&XH',
  KHOA_HOC: 'Khoa học',
  LS_DL: 'LS&ĐL',
  TIN_HOC_CN: 'Tin học',
  GD_THE_CHAT: 'Thể chất',
  AM_NHAC: 'Âm nhạc',
  MY_THUAT: 'Mỹ thuật',
  HD_TRAI_NGHIEM: 'HĐTN',
};

export function autoGenerateIndividualNotes(
  students: Student[],
  getStarsFn: (studentId: string) => number,
  healthRecords: HealthRecord[],
  subjectAssessments: SubjectAssessment[],
  traitAssessments: TraitAssessment[],
  term: TermType
): IndividualStudentMeetingNote[] {
  return students.map((st) => {
    const stars = getStarsFn(st.id);
    const studentSubjects = subjectAssessments.filter((a) => a.studentId === st.id && a.term === term);
    const studentTraits = traitAssessments.filter((a) => a.studentId === st.id && a.term === term);
    const healthRecord = healthRecords.find((h) => h.studentId === st.id);
    const isNearsighted = healthRecord?.hasVisionDefect || (st.healthNotes || '').toLowerCase().includes('cận');

    // ── Academic Summary from real TT27 data ──
    const goodSubjects = studentSubjects.filter((a) => a.level === 'T');
    const weakSubjects = studentSubjects.filter((a) => a.level === 'C');
    const hasData = studentSubjects.length > 0;

    let academicSummary: string;
    if (!hasData) {
      // Fallback khi chưa có dữ liệu đánh giá
      academicSummary = stars >= 10
        ? 'Học tập tích cực, tiếp thu bài nhanh, làm bài tập đầy đủ.'
        : 'Nắm được kiến thức trọng tâm; cần rèn thêm tính cẩn thận khi làm bài.';
    } else if (weakSubjects.length > 0) {
      const weakNames = weakSubjects.map((s) => SUBJECT_NAME_MAP[s.subjectCode] || s.subjectCode).join(', ');
      const goodNames = goodSubjects.slice(0, 2).map((s) => SUBJECT_NAME_MAP[s.subjectCode] || s.subjectCode).join(', ');
      academicSummary = goodNames
        ? `Hoàn thành tốt môn ${goodNames}. Cần gia đình phối hợp kèm thêm môn ${weakNames}.`
        : `Cần gia đình phối hợp kèm cặp thêm môn ${weakNames} để con tiến bộ.`;
    } else if (goodSubjects.length >= 5) {
      const topNames = goodSubjects.slice(0, 3).map((s) => SUBJECT_NAME_MAP[s.subjectCode] || s.subjectCode).join(', ');
      academicSummary = `Hoàn thành tốt (T) tất cả các môn, nổi bật ở ${topNames}. Tiếp thu nhanh, làm bài cẩn thận.`;
    } else {
      const topNames = goodSubjects.map((s) => SUBJECT_NAME_MAP[s.subjectCode] || s.subjectCode).join(', ');
      academicSummary = topNames
        ? `Hoàn thành tốt môn ${topNames}. Các môn còn lại đạt mức Hoàn thành — cần rèn thêm.`
        : 'Đạt mức Hoàn thành các môn học. Cần rèn luyện đều đặn để vươn lên mức Hoàn thành tốt.';
    }

    // ── Behavior Summary from traits + stars ──
    const goodTraits = studentTraits.filter((a) => a.level === 'T');
    const weakTraits = studentTraits.filter((a) => a.level === 'C');
    const hasTraitData = studentTraits.length > 0;

    let behaviorSummary: string;
    if (!hasTraitData) {
      behaviorSummary = stars > 5
        ? `Ngoan ngoãn, lễ phép, tích cực phát biểu. Đạt ${stars} sao thi đua.`
        : 'Ngoan ngoãn, chấp hành tốt nội quy lớp.';
    } else if (weakTraits.length > 0) {
      const weakNames = weakTraits.map((t) => {
        const def = TRAIT_DEFINITIONS.find((d) => d.code === t.traitCode);
        return def?.shortName || t.traitCode;
      }).join(', ');
      behaviorSummary = `Cần rèn luyện thêm: ${weakNames}.${stars > 0 ? ` Đạt ${stars} sao thi đua.` : ''}`;
    } else {
      const goodTraitNames = goodTraits.slice(0, 3).map((t) => {
        const def = TRAIT_DEFINITIONS.find((d) => d.code === t.traitCode);
        return def?.shortName || t.traitCode;
      }).join(', ');
      behaviorSummary = goodTraitNames
        ? `Phẩm chất tốt, nổi bật: ${goodTraitNames}. Đạt ${stars} sao thi đua.`
        : `Phẩm chất và năng lực đạt chuẩn. Đạt ${stars} sao thi đua.`;
    }

    // ── Action Items — personalized ──
    let actionItemForParents: string;
    if (weakSubjects.length > 0) {
      const weakName = SUBJECT_NAME_MAP[weakSubjects[0].subjectCode] || weakSubjects[0].subjectCode;
      actionItemForParents = `Gia đình kèm con rèn thêm môn ${weakName} mỗi ngày 15-20 phút, nhắc con làm bài tập đầy đủ.`;
    } else if (isNearsighted) {
      actionItemForParents = 'Nhắc con đeo kính đúng độ, giữ khoảng cách mắt khi đọc sách, ngồi đúng tư thế.';
    } else if (stars < 3) {
      actionItemForParents = 'Gia đình nhắc con chấp hành nội quy lớp, tích cực phát biểu xây dựng bài để tích lũy sao.';
    } else {
      actionItemForParents = 'Gia đình cùng con đọc sách 15 phút mỗi tối, nhắc con chuẩn bị sách vở theo TKB.';
    }

    // ── Priority Discussion ──
    const isPriorityDiscussion = weakSubjects.length > 0 || weakTraits.length > 0 || stars === 0;

    return {
      studentId: st.id,
      studentName: st.fullName,
      academicSummary,
      behaviorSummary,
      actionItemForParents,
      isPriorityDiscussion,
      parentPhone: st.parentPhone,
    };
  });
}
