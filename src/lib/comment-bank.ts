import { SubjectAssessment, TraitAssessment, Student, StarLog, DailyAttendance, AIGenerationSettings } from '@/types';

/**
 * Intelligent Offline Pedagogical Generation Engine
 * Tự động sinh lời nhận xét học sinh chuẩn mực theo Thông tư 27/2020/TT-BGDĐT
 * Tổng hợp từ điểm số môn học, nề nếp tích sao hàng ngày, chuyên cần và định hướng của giáo viên.
 */
export function generateSmartComment(
  student: Student,
  subjects: SubjectAssessment[] = [],
  traits: TraitAssessment[] = [],
  extraNotes?: string,
  starLogs: StarLog[] = [],
  attendances: DailyAttendance[] = [],
  settings?: Partial<AIGenerationSettings>
): string {
  const name = student.fullName.split(' ').pop() || student.fullName;
  const isFemale = student.gender === 'Nữ';
  const pronoun = 'Em';

  // Config parameters
  const tone = settings?.tone || 'standard';
  const customTone = settings?.customToneText || '';
  const lengthPreset = settings?.lengthPreset || 'standard';
  const targetWords = settings?.targetWordCount || 60;
  const incSubjects = settings?.includeSubjectGrades !== false;
  const incTraits = settings?.includeTraitsAndCompetencies !== false;
  const incStars = settings?.includeDailyStarsAndComments !== false;
  const incAttendance = settings?.includeAttendanceAndBoarding !== false;
  const classDirective = settings?.classDirectivePrompt || '';

  // 1. Phân tích kết quả học tập
  const hasCSubject = subjects.some((s) => s.level === 'C');
  const allTSubject = subjects.length > 0 && subjects.every((s) => s.level === 'T');
  const goodSubjects = subjects.filter((s) => s.level === 'T');
  const mathAss = subjects.find((s) => s.subjectCode === 'TOAN');
  const tvAss = subjects.find((s) => s.subjectCode === 'TV');
  const engAss = subjects.find((s) => s.subjectCode === 'TA' || s.subjectCode === 'NGOAI_NGU');

  // Tìm môn nổi trội nhất
  let outstandingSubject = '';
  if (mathAss?.score && mathAss.score >= 9.0) {
    outstandingSubject = 'môn Toán';
  } else if (tvAss?.score && tvAss.score >= 9.0) {
    outstandingSubject = 'môn Tiếng Việt';
  } else if (engAss?.score && engAss.score >= 9.0) {
    outstandingSubject = 'môn Tiếng Anh';
  } else if (goodSubjects.length > 0) {
    const subjectNames: Record<string, string> = {
      TOAN: 'môn Toán',
      TV: 'môn Tiếng Việt',
      TA: 'môn Tiếng Anh',
      KH: 'môn Khoa học',
      LS_DL: 'môn Lịch sử & Địa lí',
      TH_CN: 'môn Tin học',
      MT: 'môn Mỹ thuật',
      AN: 'môn Âm nhạc',
    };
    outstandingSubject = subjectNames[goodSubjects[0].subjectCode] || 'các môn học';
  }

  // 2. Phân tích nề nếp & sao thi đua hàng ngày
  const studentStars = starLogs.filter((l) => l.studentId === student.id);
  const totalStars = studentStars.reduce((sum, l) => sum + l.points, 0);
  const topReasons = studentStars
    .filter((l) => l.reason)
    .map((l) => l.reason)
    .slice(0, 2);

  // 3. Phân tích chuyên cần
  const studentAtt = attendances.filter((a) => a.studentId === student.id);
  const absentCount = studentAtt.filter((a) => a.status !== 'CO_MAT').length;

  // 4. Sinh ngẫu nhiên theo hash để tránh trùng lặp giữa các em
  const hash = student.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // === CÂU 1: ĐÁNH GIÁ HỌC TẬP ===
  let s1 = '';
  if (incSubjects) {
    if (allTSubject || (goodSubjects.length >= subjects.length * 0.7 && goodSubjects.length > 0)) {
      const s1Variants = [
        `${pronoun} ${name} có ý thức học tập rất tốt, nắm chắc kiến thức toàn diện và hoàn thành xuất sắc các môn học${outstandingSubject ? `, nổi bật ở ${outstandingSubject}` : ''}.`,
        `${pronoun} tiếp thu bài nhanh, tư duy linh hoạt và đạt kết quả vượt trội ở tất cả các môn học${outstandingSubject ? `, đặc biệt là ${outstandingSubject}` : ''}.`,
        `${pronoun} ${name} chăm chỉ học tập, hoàn thành tốt mọi nội dung kiến thức và có năng lực nổi bật ở ${outstandingSubject || 'các môn học'}.`,
        `${pronoun} có tinh thần tự học cao, bài làm luôn cẩn thận, chính xác và đạt thành tích xuất sắc trong học tập.`,
      ];
      s1 = s1Variants[hash % s1Variants.length];
    } else if (!hasCSubject) {
      const s1Variants = [
        `${pronoun} ${name} nắm chắc kiến thức cơ bản, hoàn thành tốt các nội dung học tập và có nhiều cố gắng trong giờ học.`,
        `${pronoun} có tiến bộ rõ rệt trong học tập, hoàn thành các yêu cầu môn học và tiếp thu bài đều đặn.`,
        `${pronoun} ${name} chăm chỉ, hoàn thành tốt các bài tập được giao và luôn chú ý lắng nghe thầy cô giảng bài.`,
      ];
      s1 = s1Variants[hash % s1Variants.length];
    } else {
      const s1Variants = [
        `${pronoun} ${name} có cố gắng hoàn thành các nhiệm vụ học tập, tiếp thu bài mức độ cơ bản.`,
        `${pronoun} có ý thức học tập, tuy nhiên cần dành thêm thời gian rèn luyện thêm để nắm vững kiến thức hơn.`,
      ];
      s1 = s1Variants[hash % s1Variants.length];
    }
  } else {
    s1 = `${pronoun} ${name} luôn có tinh thần trách nhiệm và hoàn thành tốt nhiệm vụ của người học sinh.`;
  }

  // === CÂU 2: ĐÁNH GIÁ NỀ NẾP & LỊCH SỬ NHẬN XÉT HÀNG NGÀY ===
  let s2 = '';
  if (incStars && studentStars.length > 0) {
    if (topReasons.includes('Phát biểu hăng hái') || topReasons.includes('Hăng hái phát biểu')) {
      s2 = `Trong lớp, ${name.toLowerCase()} rất hăng hái phát biểu xây dựng bài, tự tin chia sẻ ý kiến và tích cực tham gia hoạt động nhóm.`;
    } else if (topReasons.includes('Vở sạch chữ đẹp') || topReasons.includes('Chữ viết sạch đẹp')) {
      s2 = `${pronoun} có ý thức giữ vở sạch, rèn chữ viết rất đẹp, cẩn thận và nề nếp học tập gương mẫu.`;
    } else if (topReasons.includes('Trực nhật & Vệ sinh') || topReasons.includes('Giúp đỡ bạn bè')) {
      s2 = `${pronoun} luôn trung thực, lễ phép, nhiệt tình giúp đỡ bạn bè và hoàn thành tốt các công việc chung của lớp.`;
    } else if (totalStars >= 5) {
      s2 = `${pronoun} gương mẫu trong nề nếp thi đua với ${totalStars} sao khen thưởng, luôn tự giác chấp hành tốt nội quy.`;
    } else {
      s2 = `${pronoun} ngoan ngoãn, chấp hành tốt nội quy lớp học, biết vâng lời thầy cô và thân thiện với bạn bè.`;
    }
  } else if (incTraits) {
    const s2Variants = [
      `${pronoun} có phẩm chất đạo đức tốt, trung thực, lễ phép và biết quan tâm, chia sẻ với bạn bè.`,
      `${pronoun} nề nếp tốt, hòa đồng, tự giác trong các hoạt động tập thể và có tinh thần trách nhiệm cao.`,
      `${pronoun} luôn lễ phép với thầy cô, chan hòa với bạn bè và tích cực tham gia các phong trào của lớp.`,
    ];
    s2 = s2Variants[(hash + 1) % s2Variants.length];
  }

  // Chuyên cần bổ sung nếu có nghỉ học
  let attNote = '';
  if (incAttendance && absentCount > 0) {
    attNote = ` Em đi học đều đặn (có ${absentCount} buổi nghỉ có phép).`;
  }

  // === CÂU 3: LỜI ĐỘNG VIÊN / ĐỊNH HƯỚNG SƯ PHẠM ===
  let s3 = '';
  if (tone === 'encouraging') {
    const s3Variants = [
      `Cô rất khen ngợi sự nỗ lực của ${name.toLowerCase()}, chúc em luôn giữ vững ngọn lửa đam mê học tập để đạt nhiều thành tích hơn nữa!`,
      `Thầy cô tin tưởng em sẽ tiếp tục tự tin, tỏa sáng và gặt hái thêm nhiều niềm vui trong năm học này!`,
      `Cô rất tự hào về sự tiến bộ của em, hãy luôn phát huy những ưu điểm tuyệt vời này nhé!`,
    ];
    s3 = s3Variants[(hash + 2) % s3Variants.length];
  } else if (tone === 'concise' || lengthPreset === 'short') {
    s3 = `Cần tiếp tục phát huy ưu điểm để đạt thành tích cao hơn nữa.`;
  } else if (tone === 'detailed' || lengthPreset === 'detailed') {
    if (hasCSubject) {
      s3 = `Thời gian tới, em cần tự tin hơn khi trao đổi bài cùng bạn bè, rèn thêm kỹ năng tính toán và duy trì thói quen đọc sách hàng ngày.`;
    } else {
      s3 = `Em cần duy trì phong độ học tập này, phát huy sự chủ động, sáng tạo và tiếp tục là tấm gương sáng cho các bạn trong lớp noi theo.`;
    }
  } else {
    // Standard TT27
    if (hasCSubject) {
      s3 = `Em cần cố gắng rèn luyện thêm, chú ý tập trung nghe giảng để đạt kết quả tốt hơn trong kỳ tới.`;
    } else {
      s3 = `Tiếp tục phát huy những ưu điểm đã đạt được để gặt hái thêm nhiều thành công mới trong học tập, em nhé!`;
    }
  }

  // === ĐỊNH HƯỚNG TOÀN LỚP & GHI CHÚ RIÊNG ===
  let extraText = '';
  const combinedDirectives = [classDirective.trim(), extraNotes?.trim()].filter(Boolean).join('; ');
  if (combinedDirectives) {
    extraText = ` Đặc biệt, em ${combinedDirectives}.`;
  }

  // Lắp ráp theo độ dài yêu cầu
  if (lengthPreset === 'short' || targetWords <= 40) {
    return `${s1} ${s2}${extraText}`.replace(/\s+/g, ' ').trim();
  }

  return `${s1} ${s2}${attNote} ${s3}${extraText}`.replace(/\s+/g, ' ').trim();
}
