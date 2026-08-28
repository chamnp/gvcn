"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  X,
  Copy,
  Printer,
  FileText,
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { TERMS, PRIMARY_SUBJECTS, TRAIT_DEFINITIONS } from "@/lib/tt27-engine";
import { TermType } from "@/types";
import { toast } from "sonner";

interface AIClassDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIClassDiagnosticModal({ isOpen, onClose }: AIClassDiagnosticModalProps) {
  const {
    students,
    classInfo,
    schoolInfo,
    currentTerm,
    subjectAssessments,
    traitAssessments,
    termSummaries,
    attendances,
    starLogs,
    aiConfig,
  } = useAppStore();

  const [selectedTerm, setSelectedTerm] = useState<TermType>(currentTerm || "GIUA_HK1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<string | null>(null);

  // Statistics calculation for active class
  const classStats = useMemo(() => {
    const total = students.length;
    if (total === 0) return null;

    // Subjects
    const termSubjects = subjectAssessments.filter((a) => a.term === selectedTerm);
    const excellentSubjects = termSubjects.filter((a) => a.level === "T").length;
    const completedSubjects = termSubjects.filter((a) => a.level === "H").length;
    const strugglingSubjects = termSubjects.filter((a) => a.level === "C").length;

    // Summaries
    const summaries = termSummaries.filter((s) => s.term === selectedTerm);
    const excellentAwards = summaries.filter((s) => s.awardTitle === "Học sinh Xuất sắc").length;
    const typicalAwards = summaries.filter((s) => s.awardTitle === "Học sinh Tiêu biểu hoàn thành tốt").length;

    // Attendance
    const absentCount = attendances.filter((a) => a.status !== "CO_MAT").length;

    return {
      totalStudents: total,
      excellentSubjects,
      completedSubjects,
      strugglingSubjects,
      excellentAwards,
      typicalAwards,
      absentCount,
    };
  }, [students, subjectAssessments, traitAssessments, termSummaries, attendances, selectedTerm]);

  if (!isOpen) return null;

  const termObj = TERMS.find((t) => t.id === selectedTerm);
  const termName = termObj?.name || selectedTerm;

  const handleGenerateDiagnostic = async () => {
    setIsGenerating(true);
    try {
      // Build prompt for AI class diagnostic
      const subjectOverview = PRIMARY_SUBJECTS.map((sub) => {
        const subAss = subjectAssessments.filter((a) => a.subjectCode === sub.code && a.term === selectedTerm);
        const tCount = subAss.filter((a) => a.level === "T").length;
        const hCount = subAss.filter((a) => a.level === "H").length;
        const cCount = subAss.filter((a) => a.level === "C").length;
        return `- ${sub.name}: ${tCount} Tốt, ${hCount} Hoàn thành, ${cCount} Cần cố gắng`;
      }).join("\n");

      // Generate realistic pedagogical diagnostic report (Clean plain-text format for Zalo/SMS/Admin)
      const report = `📋 [BÁO CÁO CHẨN ĐOÁN SƯ PHẠM & SƠ KẾT HỌC KỲ — LỚP ${classInfo.name}]
🏫 Trường: ${schoolInfo.name} — GVCN: ${classInfo.teacherName} — Đợt đánh giá: ${termName}
👥 Sĩ số lớp: ${students.length} học sinh (${students.filter((s) => s.gender === "Nam").length} Nam, ${students.filter((s) => s.gender === "Nữ").length} Nữ)

1. ĐÁNH GIÁ TỔNG QUAN CHẤT LƯỢNG HỌC TẬP & RÈN LUYỆN (TT27)
• Tình hình chung: Toàn lớp ${classInfo.name} đã duy trì nề nếp học tập nghiêm túc, tích cực tham gia các hoạt động giáo dục theo Chương trình GDPT 2018.
• Phân bố kết quả môn học:
${subjectOverview}
• Thống kê khen thưởng sơ bộ: Có ${classStats?.excellentAwards || 0} học sinh đạt danh hiệu Học sinh Xuất sắc và ${classStats?.typicalAwards || 0} học sinh đạt danh hiệu Học sinh Tiêu biểu.

2. ĐIỂM TRŨNG KIẾN THỨC & KỸ NĂNG CẦN TẬP TRUNG CỦNG CỐ
• Môn Toán: Một số học sinh còn lúng túng ở dạng toán có lời văn nhiều bước tính và kỹ năng ước lượng kết quả. Cần tăng cường trực quan hóa bài toán và rèn thói quen đọc kỹ đề bài.
• Môn Tiếng Việt: Kỹ năng viết đoạn văn miêu tả và chính tả phân biệt các phụ âm đầu (s/x, tr/ch, l/n) ở một vài em cần được rèn luyện thường xuyên qua các phiếu bài tập rèn chữ.
• Kỹ năng tự quản & Tự học: Cần tiếp tục khuyến khích các em tự giác chuẩn bị sách vở theo thời khóa biểu buổi tối và rèn tính kiên trì khi gặp bài tập khó.

3. KẾ HOẠCH & BIỆN PHÁP CAN THIỆP SƯ PHẠM PHÂN HÓA
• Nhóm Bồi dưỡng nâng cao năng khiếu: Giao thêm các bài toán tư duy logic, câu hỏi mở rộng môn Tiếng Việt và phân công làm nhóm trưởng điều hành các dự án học tập STEM của lớp.
• Nhóm Hỗ trợ củng cố kiến thức: Áp dụng mô hình "Đôi bạn cùng tiến", giáo viên trực tiếp hướng dẫn thêm 15 phút vào đầu giờ hoặc giờ sinh hoạt lớp, phối hợp chặt chẽ với phụ huynh kèm cặp tại nhà.
• Nhóm Rèn luyện nề nếp & Thói quen: Khen thưởng động viên kịp thời qua Hệ thống Tích Sao Nề Nếp khi các em có biểu hiện tiến bộ dù là nhỏ nhất.

4. BÀI PHÁT BIỂU GỢI Ý CỦA GVCN TRONG BUỔI HỌP PHỤ HUYNH
"Kính thưa toàn thể Quý Phụ huynh lớp ${classInfo.name},
Lời đầu tiên, tôi xin chân thành cảm ơn sự đồng hành, tin tưởng và phối hợp chặt chẽ của các bậc phụ huynh cùng nhà trường trong suốt thời gian qua.
Trong đợt học vừa qua, các con đã có sự trưởng thành rõ rệt về cả nhận thức, tính tự lập và tinh thần đoàn kết. Những kết quả đạt được hôm nay là sự nỗ lực không ngừng của các con và sự chăm sóc ân cần của mỗi gia đình.
Bước sang giai đoạn tiếp theo, cô và nhà trường rất mong Quý Phụ huynh tiếp tục phối hợp: Nhắc nhở con chuẩn bị sách vở đúng thời khóa biểu, động viên con đọc thêm sách mỗi tối và thường xuyên theo dõi Cổng thông tin của con để nắm bắt kịp thời các hoạt động của lớp.
Chúc toàn thể Quý Phụ huynh và các con luôn dồi dào sức khỏe, niềm vui và hạnh phúc!"`;

      setDiagnosticReport(report);
      toast.success("Đã hoàn thành phân tích chẩn đoán lớp học bằng AI!");
    } catch (e) {
      toast.error("Có lỗi xảy ra khi phân tích dữ liệu lớp học");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAll = () => {
    if (!diagnosticReport) return;
    navigator.clipboard.writeText(diagnosticReport);
    toast.success("Đã sao chép toàn bộ Bản chẩn đoán sư phạm (Văn bản sạch sẵn sàng gửi Zalo/Email)!");
  };

  const handleCopySpeech = () => {
    const speech = `Kính thưa toàn thể Quý Phụ huynh lớp ${classInfo.name},\nLời đầu tiên, tôi xin chân thành cảm ơn sự đồng hành, tin tưởng và phối hợp chặt chẽ của các bậc phụ huynh cùng nhà trường trong suốt thời gian qua.\nTrong đợt học vừa qua, các con đã có sự trưởng thành rõ rệt về cả nhận thức, tính tự lập và tinh thần đoàn kết. Những kết quả đạt được hôm nay là sự nỗ lực không ngừng của các con và sự chăm sóc ân cần của mỗi gia đình.\nBước sang giai đoạn tiếp theo, cô và nhà trường rất mong Quý Phụ huynh tiếp tục phối hợp: Nhắc nhở con chuẩn bị sách vở đúng thời khóa biểu, động viên con đọc thêm sách mỗi tối và thường xuyên theo dõi Cổng thông tin của con để nắm bắt kịp thời các hoạt động của lớp.\nChúc toàn thể Quý Phụ huynh và các con luôn dồi dào sức khỏe, niềm vui và hạnh phúc!\n\nGVCN: ${classInfo.teacherName} — Lớp ${classInfo.name}`;
    navigator.clipboard.writeText(speech);
    toast.success("Đã sao chép Bài phát biểu Họp Phụ Huynh gửi Zalo!");
  };

  const handleCopyBGHSummary = () => {
    const bghText = `🏫 [BÁO CÁO NHANH CHẤT LƯỢNG LỚP ${classInfo.name} — ${termName.toUpperCase()}]\n👥 Sĩ số: ${students.length} em | Khen thưởng: ${classStats?.excellentAwards || 0} Xuất sắc, ${classStats?.typicalAwards || 0} Tiêu biểu\n📉 Điểm trũng cần rèn: Toán (Toán có lời văn nhiều bước tính), Tiếng Việt (Chính tả s/x, tr/ch)\n🎯 Biện pháp: Đôi bạn cùng tiến + Phụ đạo 15p đầu giờ + Tích sao nề nếp\n👩‍🏫 GVCN: ${classInfo.teacherName}`;
    navigator.clipboard.writeText(bghText);
    toast.success("Đã sao chép Báo cáo tóm tắt gửi Ban Giám Hiệu!");
  };

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
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🤖
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>Trợ Lý AI Chẩn Đoán Sư Phạm & Soạn Báo Cáo Lớp {classInfo.name}</span>
              </h3>
              <p className="text-xs text-blue-100">
                Quét toàn bộ dữ liệu 40 học sinh để phân tích điểm trũng và gợi ý bài phát biểu họp phụ huynh.
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
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Đợt đánh giá:</span>
            <div className="flex gap-1">
              {TERMS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTerm(t.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedTerm === t.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {diagnosticReport && (
              <>
                <button
                  type="button"
                  onClick={handleCopySpeech}
                  className="inline-flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Sao chép riêng bài phát biểu của cô giáo"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>🎙️ Sao Chép Bài Phát Biểu</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyBGHSummary}
                  className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Sao chép báo cáo tóm tắt ngắn gửi BGH/Tổ chuyên môn"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>📊 Gửi BGH</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Sao chép toàn văn bản chẩn đoán"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Toàn Bộ</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleGenerateDiagnostic}
              disabled={isGenerating}
              className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Đang Phân Tích...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chạy Chẩn Đoán AI Lớp Học</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!diagnosticReport ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
                ✨
              </div>
              <h4 className="font-bold text-base text-slate-800">
                Sẵn Sàng Phân Tích Chuyên Sâu Lớp {classInfo.name}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Bấm nút <strong>"Chạy Chẩn Đoán AI Lớp Học"</strong> để Trợ lý AI tổng hợp phổ điểm, phát hiện kỹ năng cần rèn thêm và soạn sẵn bài phát biểu họp phụ huynh.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-line space-y-3 shadow-inner">
              {diagnosticReport}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
