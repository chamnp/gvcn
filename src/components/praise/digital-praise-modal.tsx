'use client';

import React, { useState } from 'react';
import {
  Heart,
  Sparkles,
  Download,
  Share2,
  Copy,
  X,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { Student, PraiseCardTemplate } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface DigitalPraiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  className?: string;
  teacherName?: string;
}

const TEMPLATES: PraiseCardTemplate[] = [
  {
    id: 'praise-01',
    title: 'Bông Hoa Nghìn Việc Tốt 🌸',
    category: 'PHAM_CHAT',
    badge: '🌸',
    bgGradient: 'from-pink-500 via-rose-500 to-amber-400',
    borderColor: 'border-pink-300',
    textColor: 'text-pink-900',
    defaultMessage: 'Khen ngợi em đã luôn có ý thức giúp đỡ bạn bè, nhặt được của rơi trả người đánh mất và giữ gìn vệ sinh lớp học thật sạch đẹp!',
  },
  {
    id: 'praise-02',
    title: 'Ngôi Sao Tiến Bộ Vượt Bậc ⭐',
    category: 'TIEN_BO',
    badge: '⭐',
    bgGradient: 'from-amber-400 via-orange-500 to-rose-500',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-900',
    defaultMessage: 'Chúc mừng em đã có sự nỗ lực phi thường trong tuần qua, tính nhẩm tự tin hơn và đạt điểm số rất cao trong bài kiểm tra định kỳ!',
  },
  {
    id: 'praise-03',
    title: 'Dũng Sĩ Chăm Chỉ & Tự Giác 🏆',
    category: 'NE_NEP',
    badge: '🏆',
    bgGradient: 'from-blue-600 via-indigo-600 to-purple-600',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900',
    defaultMessage: 'Tuyên dương em luôn chuẩn bị bài tập đầy đủ, đi học đúng giờ, tích cực giơ tay phát biểu xây dựng bài trong tất cả các tiết học!',
  },
  {
    id: 'praise-04',
    title: 'Kiện Tướng Toán Học Nhí 📐',
    category: 'HOC_TAP',
    badge: '📐',
    bgGradient: 'from-emerald-500 via-teal-600 to-cyan-600',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-900',
    defaultMessage: 'Khen ngợi tư duy logic sắc bén, giải toán thông minh và sáng tạo trong các bài toán đố hóc búa của lớp!',
  },
  {
    id: 'praise-05',
    title: 'Bàn Tay Nắn Nót Chữ Đẹp ✍️',
    category: 'HOC_TAP',
    badge: '✍️',
    bgGradient: 'from-purple-500 via-pink-500 to-rose-500',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-900',
    defaultMessage: 'Khen ngợi nét chữ đều đặn, nắn nót, giữ vở sạch chữ đẹp và trình bày bài tập rất khoa học, ngăn nắp!',
  },
];

export function DigitalPraiseModal({
  isOpen,
  onClose,
  students,
  className = '4A1',
  teacherName = 'Cô giáo Chủ nhiệm',
}: DigitalPraiseModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [customMessage, setCustomMessage] = useState<string>(TEMPLATES[0].defaultMessage);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

  const handleSelectTemplate = (tpl: PraiseCardTemplate) => {
    setSelectedTemplateId(tpl.id);
    setCustomMessage(tpl.defaultMessage);
  };

  const handleCopyZaloMessage = () => {
    const text = `💌 [THƯ KHEN NGỢI TỪ CÔ GIÁO CHỦ NHIỆM — LỚP ${className}]\n\n` +
      `Kính gửi Phụ huynh em ${currentStudent.fullName},\n\n` +
      `🎉 ${currentTemplate.title}\n` +
      `"${customMessage}"\n\n` +
      `Cô giáo rất tự hào về sự cố gắng của em trong tuần qua. Chúc em tiếp tục phát huy để luôn là niềm tự hào của bố mẹ và thầy cô nhé! ❤️\n\n` +
      `GVCN: ${teacherName} — Lớp ${className}`;

    navigator.clipboard.writeText(text);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    toast.success(`Đã sao chép Thư Khen Ngợi của em ${currentStudent.fullName} để gửi qua Zalo!`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              💌
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight">
                Thiệp Khen Thưởng Điện Tử & Thư Khen Gửi Phụ Huynh
              </h3>
              <p className="text-xs text-pink-100">
                Gắn kết yêu thương, lan tỏa động lực tích cực cho học sinh và gia đình
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

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">1. Chọn Học Sinh Khen Thưởng:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-pink-500"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.studentCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">2. Chọn Mẫu Danh Hiệu Khen Ngợi:</label>
              <div className="space-y-1.5">
                {TEMPLATES.map((tpl) => {
                  const active = tpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`w-full p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center space-x-2.5 ${
                        active
                          ? 'bg-pink-50/80 border-pink-500 text-pink-950 font-black shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl">{tpl.badge}</span>
                      <span className="truncate">{tpl.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">3. Lời Nhận Xét Ấm Áp Của Cô Giáo:</label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col items-center justify-center space-y-4">
            <div className={`w-full max-w-sm rounded-3xl p-6 text-white shadow-2xl bg-gradient-to-br ${currentTemplate.bgGradient} relative overflow-hidden border-4 border-white space-y-4 text-center transform hover:scale-102 transition-transform`}>
              <div className="absolute top-2 right-2 text-4xl opacity-20">✨</div>
              <div className="absolute bottom-2 left-2 text-4xl opacity-20">🌸</div>

              <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-3xl mx-auto shadow-inner">
                {currentTemplate.badge}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/90 bg-white/20 px-3 py-1 rounded-full inline-block">
                  THIỆP KHEN THƯỞNG TUẦN
                </span>
                <h3 className="text-lg font-black tracking-tight">{currentTemplate.title}</h3>
              </div>

              <div className="bg-white/95 rounded-2xl p-4 text-slate-900 shadow-lg space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tuyên dương học sinh:
                </p>
                <h4 className="text-base font-black text-slate-950">
                  {currentStudent.fullName}
                </h4>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "{customMessage}"
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/90 font-bold border-t border-white/20 pt-2">
                <span>🏫 Lớp {className}</span>
                <span>GVCN: {teacherName}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyZaloMessage}
              className="w-full max-w-sm py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>GỬI THƯ KHEN QUA ZALO CHO PHỤ HUYNH 📲</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
