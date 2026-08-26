import { SubjectAssessment, TraitAssessment, Student } from '@/types';

export interface CommentTemplate {
  category: 'TONG_HOP' | 'MON_HOC' | 'PHAM_CHAT' | 'NANG_LUC';
  type?: string; // TOAN, TIENG_VIET, CHAM_CHI, v.v.
  level: 'T' | 'H' | 'Đ' | 'C' | 'XUAT_SAC' | 'TIEU_BIEU' | 'HOAN_THANH' | 'CAN_CO_GANG';
  templates: string[];
}

export const PEDAGOGICAL_COMMENT_TEMPLATES: CommentTemplate[] = [
  // 1. Nhận xét tổng hợp học bạ (Cuối kỳ / Cuối năm)
  {
    category: 'TONG_HOP',
    level: 'XUAT_SAC',
    templates: [
      'Em {name} có ý thức học tập rất tốt, nắm vững kiến thức toàn diện tất cả các môn học. Năng nổ, tự giác, tích cực tham gia các hoạt động phong trào của lớp. Xứng đáng là tấm gương sáng cho các bạn noi theo.',
      'Học sinh {name} tiếp thu bài nhanh, tư duy logic và sáng tạo trong giải quyết vấn đề. Luôn hoàn thành xuất sắc các nhiệm vụ học tập và rèn luyện. Giao tiếp tự tin, lễ phép với thầy cô và thân thiện với bạn bè.',
      'Em {name} chăm ngoan, gương mẫu, đạt kết quả xuất sắc trong học tập và rèn luyện nề nếp. Chữ viết đẹp, trình bày bài cẩn thận. Tự giác, tự chủ cao trong mọi hoạt động.',
      'Em {name} có tinh thần tự học rất cao, học đều tất cả các môn. Thường xuyên giúp đỡ bạn bè cùng tiến bộ, được thầy cô yêu mến và bạn bè tín nhiệm.',
    ],
  },
  {
    category: 'TONG_HOP',
    level: 'TIEU_BIEU',
    templates: [
      'Em {name} có nhiều tiến bộ vượt bậc trong học tập, hoàn thành tốt các môn học. Chăm chỉ, tích cực phát biểu xây dựng bài. Cần tiếp tục phát huy sự tự tin trong các hoạt động nhóm.',
      'Học sinh {name} nắm chắc kiến thức cơ bản, có năng khiếu nổi bật trong học tập. Lễ phép, hòa đồng, có trách nhiệm với công việc được giao của lớp.',
      'Em {name} hoàn thành tốt các nhiệm vụ học tập và rèn luyện. Chăm ngoan, nề nếp, có tinh thần tương trợ bạn bè. Đạt danh hiệu học sinh tiêu biểu của lớp.',
    ],
  },
  {
    category: 'TONG_HOP',
    level: 'HOAN_THANH',
    templates: [
      'Em {name} hoàn thành các nội dung học tập theo yêu cầu. Có ý thức chấp hành tốt nội quy lớp học. Cần rèn luyện thêm tính cẩn thận và chủ động hơn khi làm bài.',
      'Học sinh {name} ngoan ngoãn, lễ phép, tiếp thu bài đều đặn. Em cần tự tin hơn khi trao đổi ý kiến trước lớp và dành thêm thời gian ôn tập môn Toán/Tiếng Việt.',
      'Em {name} có cố gắng trong học tập và rèn luyện, hoàn thành các nhiệm vụ được giao. Cần duy trì thói quen đọc sách và chuẩn bị bài kỹ trước khi đến lớp.',
    ],
  },
  {
    category: 'TONG_HOP',
    level: 'CAN_CO_GANG',
    templates: [
      'Em {name} ngoan ngoãn, có ý thức nề nếp. Tuy nhiên khả năng tiếp thu bài còn chậm ở một số môn, cần gia đình và thầy cô phối hợp bồi dưỡng thêm trong thời gian tới.',
      'Học sinh {name} cần tập trung hơn trong giờ học, rèn luyện kỹ năng tính toán và đọc hiểu. Cần mạnh dạn hỏi thầy cô và bạn bè khi gặp bài tập chưa hiểu.',
    ],
  },

  // 2. Nhận xét Môn Toán
  {
    category: 'MON_HOC',
    type: 'TOAN',
    level: 'T',
    templates: [
      'Tính toán nhanh, chính xác; tư duy logic tốt và biết vận dụng linh hoạt vào giải toán có lời văn.',
      'Nắm chắc kiến thức, kỹ năng tính nhẩm tốt, trình bày bài giải khoa học và mạch lạc.',
      'Có năng khiếu toán học, làm tốt các bài tập nâng cao và giải quyết vấn đề sáng tạo.',
    ],
  },
  {
    category: 'MON_HOC',
    type: 'TOAN',
    level: 'H',
    templates: [
      'Nắm được các phép tính cơ bản, thực hiện bài tập đúng yêu cầu. Cần cẩn thận hơn khi đặt tính.',
      'Hiểu bài, hoàn thành các dạng toán trong chương trình. Cần rèn thêm kỹ năng phân tích đề toán có lời văn.',
    ],
  },
  {
    category: 'MON_HOC',
    type: 'TOAN',
    level: 'C',
    templates: [
      'Còn lúng túng trong các phép tính nhân/chia và toán có lời văn, cần rèn luyện thêm bảng cửu chương.',
      'Tiếp thu toán còn chậm, cần cẩn thận tính toán và nhờ giáo viên hướng dẫn thêm.',
    ],
  },

  // 3. Nhận xét Môn Tiếng Việt
  {
    category: 'MON_HOC',
    type: 'TIENG_VIET',
    level: 'T',
    templates: [
      'Đọc to, rõ ràng, diễn cảm; vốn từ phong phú, viết văn giàu cảm xúc và hình ảnh sinh động.',
      'Chữ viết sạch đẹp, đúng chính tả; kỹ năng đọc hiểu và trả lời câu hỏi rất tốt.',
      'Diễn đạt lưu loát, bài viết giàu ý tưởng sáng tạo và bố cục rõ ràng.',
    ],
  },
  {
    category: 'MON_HOC',
    type: 'TIENG_VIET',
    level: 'H',
    templates: [
      'Đọc lưu loát, hiểu nội dung bài học. Cần chú ý rèn chữ viết và cách dùng dấu câu.',
      'Hoàn thành bài viết theo yêu cầu. Cần mở rộng thêm vốn từ và hạn chế lỗi chính tả.',
    ],
  },
  {
    category: 'MON_HOC',
    type: 'TIENG_VIET',
    level: 'C',
    templates: [
      'Tốc độ đọc còn chậm, hay mắc lỗi chính tả, cần luyện đọc và viết đoạn văn thường xuyên hơn.',
      'Cần rèn thêm kỹ năng đặt câu, dùng từ và tập trung khi nghe viết chính tả.',
    ],
  },

  // 4. Nhận xét Ngoại ngữ
  {
    category: 'MON_HOC',
    type: 'NGOAI_NGU',
    level: 'T',
    templates: [
      'Phát âm chuẩn, ghi nhớ từ vựng tốt và tự tin giao tiếp các đoạn hội thoại đơn giản.',
      'Hăng hái tham gia các hoạt động luyện nói tiếng Anh, tiếp thu ngữ pháp nhanh.',
    ],
  },
  {
    category: 'MON_HOC',
    type: 'NGOAI_NGU',
    level: 'H',
    templates: [
      'Nắm được từ vựng cơ bản. Cần tự tin hơn khi luyện phát âm và thực hành nói trước lớp.',
    ],
  },
  {
    category: 'MON_HOC',
    type: 'NGOAI_NGU',
    level: 'C',
    templates: [
      'Chưa nhớ được từ vựng cơ bản, cần dành thời gian nghe và luyện phát âm hàng ngày.',
    ],
  },
];

/**
 * Sinh nhận xét học bạ tự động theo quy chuẩn sư phạm Thông tư 27
 */
export function generateSmartComment(
  student: Student,
  subjects: SubjectAssessment[],
  traits: TraitAssessment[],
  customStrength?: string
): string {
  const name = student.fullName.split(' ').pop() || student.fullName; // Tên ngắn gọn (Ví dụ: "An" từ "Nguyễn Văn An")
  
  const hasC = subjects.some((s) => s.level === 'C') || traits.some((t) => t.level === 'C');
  const allT = subjects.length > 0 && subjects.every((s) => s.level === 'T') && traits.every((t) => t.level === 'T');
  
  let targetLevel: 'XUAT_SAC' | 'TIEU_BIEU' | 'HOAN_THANH' | 'CAN_CO_GANG' = 'HOAN_THANH';
  if (allT) {
    targetLevel = 'XUAT_SAC';
  } else if (!hasC && subjects.filter((s) => s.level === 'T').length >= subjects.length / 2) {
    targetLevel = 'TIEU_BIEU';
  } else if (hasC) {
    targetLevel = 'CAN_CO_GANG';
  }

  const list = PEDAGOGICAL_COMMENT_TEMPLATES.filter(
    (t) => t.category === 'TONG_HOP' && t.level === targetLevel
  );

  const pool = list.length > 0 ? list[0].templates : [];
  // Chọn ngẫu nhiên hoặc theo id học sinh để đảm bảo không trùng lặp giữa các học sinh
  const hash = student.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedTemplate = pool.length > 0 ? pool[hash % pool.length] : 'Em hoàn thành tốt các nhiệm vụ học tập và rèn luyện.';

  let comment = selectedTemplate.replace(/\{name\}/g, name);

  if (customStrength) {
    comment += ` Đặc biệt, em ${customStrength}.`;
  }

  return comment;
}
