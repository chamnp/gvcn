"use client";

import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  X,
  Sparkles,
  Users,
  Search,
  ExternalLink,
  ShieldCheck,
  Award,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { TERMS, PRIMARY_SUBJECTS } from "@/lib/tt27-engine";
import { Student, TermType } from "@/types";
import { toast } from "sonner";

interface ZaloMessageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TemplateType = "WEEKLY_SUMMARY" | "TERM_ASSESSMENT" | "CLASS_NOTICE" | "BIRTHDAY";

export function ZaloMessageGeneratorModal({ isOpen, onClose }: ZaloMessageGeneratorModalProps) {
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
  } = useAppStore();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("TERM_ASSESSMENT");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || "");
  const [selectedTerm, setSelectedTerm] = useState<TermType>(currentTerm || "GIUA_HK1");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customNoticeText, setCustomNoticeText] = useState(
    "Kính nhờ Quý Phụ huynh chuẩn bị đầy đủ đồ dùng học tập và sách vở cho các con theo thời khóa biểu ngày mai."
  );

  const termObj = TERMS.find((t) => t.id === selectedTerm);
  const termName = termObj?.name || selectedTerm;

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.parentPhone || "").includes(searchQuery)
    );
  }, [students, searchQuery]);

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Function to build message for a student
  const generateMessageForStudent = (student: Student) => {
    if (!student) return "";

    const studentSubjects = subjectAssessments.filter(
      (a) => a.studentId === student.id && a.term === selectedTerm
    );
    const summary = termSummaries.find(
      (s) => s.studentId === student.id && s.term === selectedTerm
    );
    const studentStars = starLogs
      .filter((l) => l.studentId === student.id)
      .reduce((sum, l) => sum + l.points, 0);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.gvcn.pro.vn';
    const lookupUrl = `${origin}/student/${student.shareToken || student.id}`;

    if (selectedTemplate === "TERM_ASSESSMENT") {
      // Periodic assessment report
      const math = studentSubjects.find((a) => a.subjectCode === "TOAN");
      const viet = studentSubjects.find((a) => a.subjectCode === "TIENG_VIET");
      const eng = studentSubjects.find((a) => a.subjectCode === "TIENG_ANH");

      let scoreLine = "";
      if (math?.score !== undefined || viet?.score !== undefined) {
        scoreLine = `📊 Điểm kiểm tra: Toán: ${math?.score ?? "—"}đ, Tiếng Việt: ${viet?.score ?? "—"}đ${eng?.score !== undefined ? `, Tiếng Anh: ${eng.score}đ` : ""}\n`;
      }

      return `🏫 [TRƯỜNG TIỂU HỌC ${schoolInfo.name.toUpperCase()}]
📋 THÔNG BÁO KẾT QUẢ ĐÁNH GIÁ ĐỊNH KỲ — ${termName.toUpperCase()}
Kính gửi Phụ huynh em: ${student.fullName.toUpperCase()} (Lớp ${classInfo.name})

Cô giáo xin gửi tới Quý Phụ huynh kết quả học tập và rèn luyện của con trong đợt đánh giá vừa qua:
${scoreLine}⭐ Đánh giá học tập: ${summary?.overallLearningLevel === "T" ? "Hoàn thành tốt (T)" : summary?.overallLearningLevel === "H" ? "Hoàn thành (H)" : "Hoàn thành"}
🌟 Đánh giá phẩm chất & năng lực: ${summary?.overallTraitsLevel === "T" ? "Tốt (T)" : "Đạt (Đ)"}
🏆 Danh hiệu: ${summary?.awardTitle || "Hoàn thành chương trình"}
📝 Lời nhận xét của cô giáo: "${summary?.teacherComment || "Con chăm ngoan, có ý thức học tập tốt và hòa đồng với bạn bè."}"

🔗 Quý Phụ huynh có thể tra cứu chi tiết phiếu báo điểm và học bạ điện tử của con tại:
👉 ${lookupUrl}
🔑 Mã PIN bảo mật mặc định: ${student.parentPhone ? student.parentPhone.slice(-4) : "1234"}

Trân trọng cảm ơn sự phối hợp của Quý Phụ huynh!
GVCN: ${classInfo.teacherName} (${classInfo.name})`;
    }

    if (selectedTemplate === "WEEKLY_SUMMARY") {
      return `🏫 [LỚP ${classInfo.name} — TRƯỜNG ${schoolInfo.name.toUpperCase()}]
⭐ TỔNG KẾT NỀ NẾP & HỌC TẬP TUẦN NÀY
Kính gửi Phụ huynh em: ${student.fullName}

Cô giáo xin gửi tới gia đình thông tin rèn luyện của con trong tuần qua:
🌟 Tổng số Sao khen thưởng tích lũy: ${studentStars} Sao 🌟
📋 Nề nếp chuyên cần: Đi học đầy đủ, đúng giờ.
📝 Nhận xét của cô: Con tuần này có nhiều cố gắng, hăng hái tham gia các hoạt động học tập và sinh hoạt của lớp.

Chúc con và gia đình một kỳ nghỉ cuối tuần vui vẻ và nhiều niềm vui!
GVCN: ${classInfo.teacherName}`;
    }

    if (selectedTemplate === "BIRTHDAY") {
      return `🎉 CHÚC MỪNG SINH NHẬT CON YÊU! 🎂🎈
Tập thể lớp ${classInfo.name} và Cô giáo xin gửi lời chúc mừng sinh nhật ấm áp nhất tới em ${student.fullName}!
Chúc con bước sang tuổi mới luôn chăm ngoan, học giỏi, nhiều niềm vui và luôn là niềm tự hào của gia đình và thầy cô! 🌟💐

GVCN: ${classInfo.teacherName}`;
    }

    // CLASS_NOTICE
    return `📢 [THÔNG BÁO TỪ GVCN LỚP ${classInfo.name} — ${schoolInfo.name.toUpperCase()}]
Kính gửi Quý Phụ huynh em ${student.fullName},

${customNoticeText}

Mọi thắc mắc Quý Phụ huynh vui lòng liên hệ trực tiếp với GVCN.
Trân trọng cảm ơn sự phối hợp của Quý Phụ huynh!
GVCN: ${classInfo.teacherName}`;
  };

  const currentMessage = activeStudent ? generateMessageForStudent(activeStudent) : "";

  const handleCopy = (student: Student) => {
    const msg = generateMessageForStudent(student);
    navigator.clipboard.writeText(msg);
    setCopiedId(student.id);
    toast.success(`Đã sao chép tin nhắn Zalo cho phụ huynh em ${student.fullName}!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allMsgs = students
      .map((st, idx) => `--- [HỌC SINH ${idx + 1}: ${st.fullName}] ---\n${generateMessageForStudent(st)}`)
      .join("\n\n====================\n\n");
    navigator.clipboard.writeText(allMsgs);
    toast.success(`Đã sao chép toàn bộ tin nhắn Zalo của ${students.length} học sinh!`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-5xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              💬
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>Trợ Lý Soạn Tin Nhắn Zalo / SMS Sổ Liên Lạc Điện Tử</span>
              </h3>
              <p className="text-xs text-blue-100">
                Tự động cá nhân hóa tên học sinh, điểm số, sao nề nếp và link tra cứu bí mật riêng.
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

        {/* Template Selector Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "TERM_ASSESSMENT", label: "📑 Phiếu Điểm Định Kỳ TT27", icon: "📊" },
              { id: "WEEKLY_SUMMARY", label: "⭐ Tổng Kết Tuần & Sao", icon: "🌟" },
              { id: "CLASS_NOTICE", label: "📢 Dặn Dò & Thông Báo Lớp", icon: "📢" },
              { id: "BIRTHDAY", label: "🎂 Chúc Mừng Sinh Nhật", icon: "🎉" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id as TemplateType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTemplate === t.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {selectedTemplate === "TERM_ASSESSMENT" && (
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value as TermType)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
              >
                {TERMS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao Chép Tất Cả ({students.length} HS)</span>
            </button>
          </div>
        </div>

        {/* Content Body: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Student List */}
          <div className="md:col-span-5 border-r border-slate-200 p-4 flex flex-col space-y-3 overflow-hidden bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm học sinh theo tên, mã, SĐT..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedTemplate === "CLASS_NOTICE" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Nội dung thông báo chung:</label>
                <textarea
                  rows={2}
                  value={customNoticeText}
                  onChange={(e) => setCustomNoticeText(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-1">
              {filteredStudents.map((st) => {
                const isSelected = st.id === activeStudent?.id;
                const isCopied = copiedId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs truncate">{st.fullName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {st.studentCode}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        PH: {st.parentName || "Phụ huynh"} ({st.parentPhone || "Chưa có SĐT"})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(st);
                      }}
                      className={`p-1.5 rounded-xl transition-all ml-2 shrink-0 cursor-pointer ${
                        isCopied
                          ? "bg-emerald-500 text-white"
                          : isSelected
                          ? "bg-white/20 hover:bg-white/30 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                      title="Sao chép tin nhắn Zalo của học sinh này"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Message Preview */}
          <div className="md:col-span-7 p-6 overflow-y-auto flex flex-col justify-between space-y-4 bg-white">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Xem trước tin nhắn Zalo gửi phụ huynh</span>
                  <h4 className="font-black text-slate-900 text-sm">{activeStudent?.fullName} ({activeStudent?.studentCode})</h4>
                </div>

                <button
                  type="button"
                  onClick={() => activeStudent && handleCopy(activeStudent)}
                  className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Gửi Zalo</span>
                </button>
              </div>

              {/* Message Bubble */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-line shadow-inner space-y-2">
                {currentMessage}
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-[11px] text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Bảo mật Sổ Liên Lạc Điện Tử Thông tư 27</span>
              </div>
              <p className="text-blue-700 leading-relaxed">
                Mỗi học sinh sở hữu 1 liên kết tra cứu riêng biệt và mã PIN bí mật 4 chữ số. Phụ huynh chỉ xem được kết quả riêng của con mà không lộ bảng điểm của các bạn khác trong lớp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
