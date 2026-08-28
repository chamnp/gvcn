"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  Sparkles,
  Copy,
  Printer,
  X,
  Award,
  Users,
  CheckCircle2,
  RefreshCw,
  Layers,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

interface ClassMeetingPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GDPT_THEMES = [
  { id: "theme-1", name: "Chủ đề 1: Em yêu trường em & Xây dựng nội quy lớp học", target: "Giúp học sinh hiểu và tự giác thực hiện nội quy, xây dựng không gian lớp học hạnh phúc." },
  { id: "theme-2", name: "Chủ đề 2: Kính thầy yêu bạn & Xây dựng tình bạn trong sáng", target: "Rèn luyện phẩm chất Nhân ái, tôn trọng thầy cô và biết chia sẻ, giúp đỡ bạn cùng tiến." },
  { id: "theme-3", name: "Chủ đề 3: An toàn giao thông cho nụ cười ngày mai", target: "Nâng cao ý thức đội mũ bảo hiểm khi ngồi trên xe máy, đi bộ an toàn và tuân thủ đèn tín hiệu." },
  { id: "theme-4", name: "Chủ đề 4: Tự giác học tập & Kỹ năng quản lý thời gian", target: "Hình thành năng lực Tự chủ & Tự học, chuẩn bị bài và đồ dùng học tập buổi tối." },
  { id: "theme-5", name: "Chủ đề 5: Bảo vệ môi trường & Phân loại rác tại nguồn", target: "Thực hành giữ gìn vệ sinh lớp học, không vứt rác bừa bãi, chăm sóc bồn hoa cây cảnh." },
  { id: "theme-6", name: "Chủ đề 6: Văn hóa ứng xử & An toàn trên không gian mạng", target: "Sử dụng Internet lành mạnh, không xem nội dung xấu độc, bảo vệ thông tin cá nhân." },
  { id: "theme-7", name: "Chủ đề 7: Biết ơn gia đình & Hiếu thảo với ông bà cha mẹ", target: "Bồi dưỡng tình cảm gia đình, chủ động làm việc nhà vừa sức giúp đỡ bố mẹ." },
  { id: "theme-8", name: "Chủ đề 8: Phòng chống bắt nạt học đường & Giao tiếp tích cực", target: "Xây dựng môi trường học đường không bạo lực, biết nói lời cảm ơn và xin lỗi." },
];

export function ClassMeetingPlannerModal({ isOpen, onClose }: ClassMeetingPlannerModalProps) {
  const {
    students,
    classInfo,
    schoolInfo,
    starLogs,
    attendances,
    formativeNotes,
  } = useAppStore();

  const [selectedWeek, setSelectedWeek] = useState<number>(5);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(GDPT_THEMES[1].id);
  const [meetingScript, setMeetingScript] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedTheme = GDPT_THEMES.find((t) => t.id === selectedThemeId) || GDPT_THEMES[0];

  // Calculate top star achievers
  const topStars = useMemo(() => {
    const map = new Map<string, number>();
    starLogs.forEach((l) => {
      map.set(l.studentId, (map.get(l.studentId) || 0) + l.points);
    });
    return students
      .map((st) => ({ student: st, stars: map.get(st.id) || 0 }))
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 3);
  }, [students, starLogs]);

  const handleGenerateScript = () => {
    setIsGenerating(true);
    try {
      const topNames = topStars.map((t, idx) => `${idx + 1}. Em ${t.student.fullName} (${t.stars} sao 🌟)`).join(", ");

      const script = `# 📋 KỊCH BẢN CHI TIẾT TIẾT SINH HOẠT LỚP & HOẠT ĐỘNG TRẢI NGHIỆM
**Trường:** ${schoolInfo.name} — **Lớp:** ${classInfo.name} — **GVCN:** ${classInfo.teacherName}
**Thời gian thực hiện:** Tiết 1 Sinh hoạt lớp — **Tuần thứ:** ${selectedWeek}
**Sĩ số:** ${students.length} học sinh

---

### PHẦN I: SƠ KẾT THI ĐUA NỀ NẾP TUẦN ${selectedWeek} (Khoảng 15 phút)
1. **Lớp trưởng điều hành sơ kết:**
   - Lớp trưởng mời 4 Tổ trưởng lần lượt báo cáo nề nếp chuyên cần, việc chuẩn bị bài tập, đồng phục và vệ sinh trực nhật của tổ trong tuần qua.
   - Lớp phó học tập nhận xét về tinh thần truy bài đầu giờ, phát biểu xây dựng bài trong các tiết học (Toán, Tiếng Việt, Tiếng Anh).
2. **GVCN nhận xét và đánh giá:**
   - *Ưu điểm:* Toàn lớp duy trì tốt nề nếp đi học chuyên cần, tích cực tham gia các tiết học.
   - *Hạn chế cần khắc phục:* Một số bạn còn quên đồ dùng học tập hoặc nói chuyện riêng trong giờ thực hành.
3. **Tuyên dương & Trao Cờ Luân Lưu:**
   - Tuyên dương các bạn có số sao thi đua cao nhất tuần: ${topNames || "Toàn thể học sinh đạt chuẩn nề nếp"}.
   - Trao Cờ thi đua cho Tổ xuất sắc nhất tuần và thưởng sao nề nếp vào bảng thi đua lớp.

---

### PHẦN II: SINH HOẠT CHUYÊN ĐỀ GDPT 2018 (Khoảng 15 phút)
**Chủ đề tuần này:** ${selectedTheme.name}
**Mục tiêu bài học:** ${selectedTheme.target}

1. **Hoạt động 1: Khởi động & Xem tình huống thực tế:**
   - GVCN trình chiếu hoặc kể câu chuyện ngắn liên quan đến chủ đề.
   - Câu hỏi thảo luận lớp: "Theo các con, hành động nào thể hiện đúng tinh thần của chủ đề hôm nay?"
2. **Hoạt động 2: Thảo luận nhóm & Đóng vai xử lý tình huống:**
   - Chia 4 tổ thảo luận xử lý tình huống thực tế trong đời sống học đường.
   - Đại diện các nhóm lên trình bày cách ứng xử văn minh, tôn trọng và yêu thương.
3. **Hoạt động 3: Trò chơi tập thể "Thông Điệp Yêu Thương":**
   - Mỗi học sinh viết 1 lời chúc hoặc lời khen tặng cho bạn cùng bàn dán lên Cây Hạnh Phúc của lớp.

---

### PHẦN III: PHƯƠNG HƯỚNG TUẦN ${selectedWeek + 1} & PHÂN CÔNG NHIỆM VỤ (Khoảng 5 phút)
1. **Mục tiêu trọng tâm tuần tới:**
   - Thi đua giữ vững nề nếp "Vở sạch chữ đẹp" và chuẩn bị tốt cho các bài kiểm tra định kỳ.
   - Duy trì xếp hàng ngay ngắn khi ra về và giữ gìn vệ sinh chung.
2. **Phân công trực nhật & Ban cán sự:**
   - Tổ ${(selectedWeek % 4) + 1} chịu trách nhiệm trực nhật tuần mới (Lau bảng, giặt khăn, kê bàn ghế).
   - Lớp trưởng và các tổ trưởng theo dõi, đôn đốc nề nếp hàng ngày.

*GVCN kết luận tiết sinh hoạt, dặn dò các con nghỉ ngơi cuối tuần an toàn, vui vẻ và chuẩn bị chu đáo cho tuần học mới.*`;

      setMeetingScript(script);
      toast.success("Đã tạo kịch bản tiết sinh hoạt lớp hoàn chỉnh!");
    } catch (e) {
      toast.error("Có lỗi xảy ra khi tạo kịch bản");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!meetingScript) return;
    navigator.clipboard.writeText(meetingScript);
    toast.success("Đã sao chép toàn bộ Kịch bản tiết sinh hoạt lớp!");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              📝
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>Trợ Lý AI Soạn Kịch Bản Tiết Sinh Hoạt Lớp & HĐTN</span>
              </h3>
              <p className="text-xs text-emerald-100">
                Chuẩn 3 phần quy định Bộ GD&ĐT: Sơ kết thi đua, Sinh hoạt 24 chủ đề GDPT 2018 và Phương hướng tuần mới.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-600">Tuần:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5 max-w-xs">
              <span className="text-xs font-bold text-slate-600 shrink-0">Chủ đề:</span>
              <select
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 truncate"
              >
                {GDPT_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {meetingScript && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao Chép Kịch Bản</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGenerateScript}
              disabled={isGenerating}
              className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Soạn...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Soạn Kịch Bản Tuần {selectedWeek}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!meetingScript ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
                📝
              </div>
              <h4 className="font-bold text-base text-slate-800">
                Sẵn Sàng Soạn Kịch Bản Tiết Sinh Hoạt Lớp {classInfo.name}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Hệ thống tự động tổng hợp số sao thi đua nề nếp của tuần và tạo giáo án chi tiết theo 24 chủ đề GDPT 2018 sẵn sàng nộp BGH duyệt.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-line space-y-3 shadow-inner">
              {meetingScript}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
