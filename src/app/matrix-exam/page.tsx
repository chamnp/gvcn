"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Printer,
  Copy,
  Sparkles,
  Layers,
  CheckCircle2,
  FileText,
  HelpCircle,
  Award,
  ArrowLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { TERMS, PRIMARY_SUBJECTS } from "@/lib/tt27-engine";
import { TermType, GradeLevel } from "@/types";
import { toast } from "sonner";

export default function MatrixExamPage() {
  const { classInfo, schoolInfo, currentTerm } = useAppStore();

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(classInfo.grade || 4);
  const [selectedSubject, setSelectedSubject] = useState<string>("TOAN");
  const [selectedTerm, setSelectedTerm] = useState<TermType>(currentTerm || "GIUA_HK1");
  const [activeTab, setActiveTab] = useState<"MATRIX" | "EXAM" | "ANSWER">("MATRIX");

  const termObj = TERMS.find((t) => t.id === selectedTerm);
  const termName = termObj?.name || selectedTerm;
  const subjectName = selectedSubject === "TOAN" ? "Toán" : selectedSubject === "TIENG_VIET" ? "Tiếng Việt" : selectedSubject === "KHOA_HOC" ? "Khoa học" : "Lịch sử và Địa lý";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyExam = () => {
    toast.success(`Đã sao chép Đề kiểm tra định kỳ môn ${subjectName}!`);
  };

  return (
    <div className="space-y-6 print:p-0 print:m-0">
      {/* 1. HEADER & CONTROLS (HIDDEN IN PRINT) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            <span>Ngân Hàng Ma Trận & Đề Kiểm Tra Định Kỳ (TT27)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xây dựng ma trận 3 mức độ (Mức 1: 40% • Mức 2: 30% • Mức 3: 30%) theo chuẩn Điều 7 Thông tư 27/2020/TT-BGDĐT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Grade Selector */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800"
          >
            {[1, 2, 3, 4, 5].map((g) => (
              <option key={g} value={g}>
                Khối {g}
              </option>
            ))}
          </select>

          {/* Subject Selector */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800"
          >
            <option value="TOAN">Môn Toán</option>
            <option value="TIENG_VIET">Môn Tiếng Việt</option>
            <option value="KHOA_HOC">Môn Khoa học</option>
            <option value="LICH_SU_DIA_LY">Môn Lịch sử & Địa lý</option>
          </select>

          {/* Term Selector */}
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value as TermType)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800"
          >
            {TERMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Đề Thi (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* 2. TAB SELECTOR (HIDDEN IN PRINT) */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold print:hidden">
        {[
          { id: "MATRIX", label: "📊 Ma Trận Đề Thi 3 Mức Độ (TT27)", icon: "📐" },
          { id: "EXAM", label: "📝 Đề Kiểm Tra Mẫu In Phát HS", icon: "📄" },
          { id: "ANSWER", label: "✅ Hướng Dẫn Chấm & Đáp Án Thang Điểm 10", icon: "🎯" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`h-9 px-4 flex items-center justify-center space-x-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. TAB 1: MA TRẬN 3 MỨC ĐỘ THÔNG TƯ 27 */}
      {activeTab === "MATRIX" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
              MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ MÔN {subjectName.toUpperCase()} — LỚP {selectedGrade}
            </h2>
            <p className="text-xs text-slate-600 italic">
              Đợt đánh giá: <strong>{termName}</strong> — Năm học: <strong>{schoolInfo.schoolYear || "2026-2027"}</strong>
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-center">
                <tr>
                  <th className="p-3 border-r border-slate-200 w-12" rowSpan={2}>STT</th>
                  <th className="p-3 border-r border-slate-200 text-left" rowSpan={2}>Mạch kiến thức, kỹ năng</th>
                  <th className="p-2 border-r border-slate-200" colSpan={2}>Mức 1 (Nhận biết - 40%)</th>
                  <th className="p-2 border-r border-slate-200" colSpan={2}>Mức 2 (Kết nối - 30%)</th>
                  <th className="p-2 border-r border-slate-200" colSpan={2}>Mức 3 (Vận dụng - 30%)</th>
                  <th className="p-2" colSpan={2}>Tổng Cộng</th>
                </tr>
                <tr className="bg-slate-50 text-[11px]">
                  <th className="p-2 border-r border-slate-200">TN</th>
                  <th className="p-2 border-r border-slate-200">TL</th>
                  <th className="p-2 border-r border-slate-200">TN</th>
                  <th className="p-2 border-r border-slate-200">TL</th>
                  <th className="p-2 border-r border-slate-200">TN</th>
                  <th className="p-2 border-r border-slate-200">TL</th>
                  <th className="p-2 border-r border-slate-200">Số câu</th>
                  <th className="p-2">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                <tr>
                  <td className="p-3 border-r border-slate-200 font-bold">1</td>
                  <td className="p-3 border-r border-slate-200 text-left font-bold">Số và phép tính (Số tự nhiên, 4 phép tính, phân số)</td>
                  <td className="p-2 border-r border-slate-200">2 câu (2.0đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.5đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.5đ)</td>
                  <td className="p-2 border-r border-slate-200 font-bold">5 câu</td>
                  <td className="p-2 font-black text-indigo-700">6.0 điểm</td>
                </tr>
                <tr>
                  <td className="p-3 border-r border-slate-200 font-bold">2</td>
                  <td className="p-3 border-r border-slate-200 text-left font-bold">Hình học và đo lường (Góc, diện tích, đơn vị đo)</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200 font-bold">3 câu</td>
                  <td className="p-2 font-black text-indigo-700">3.0 điểm</td>
                </tr>
                <tr>
                  <td className="p-3 border-r border-slate-200 font-bold">3</td>
                  <td className="p-3 border-r border-slate-200 text-left font-bold">Một số yếu tố Thống kê và Xác suất</td>
                  <td className="p-2 border-r border-slate-200">1 câu (1.0đ)</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200">—</td>
                  <td className="p-2 border-r border-slate-200 font-bold">1 câu</td>
                  <td className="p-2 font-black text-indigo-700">1.0 điểm</td>
                </tr>
                <tr className="bg-indigo-50/70 font-black text-slate-900 border-t border-indigo-200">
                  <td className="p-3 border-r border-slate-200" colSpan={2}>TỔNG CỘNG ĐIỂM</td>
                  <td className="p-2 border-r border-slate-200" colSpan={2}>4.0 điểm (40%)</td>
                  <td className="p-2 border-r border-slate-200" colSpan={2}>3.0 điểm (30%)</td>
                  <td className="p-2 border-r border-slate-200" colSpan={2}>3.0 điểm (30%)</td>
                  <td className="p-2 border-r border-slate-200">9 câu</td>
                  <td className="p-2 text-indigo-900 text-sm">10.0 ĐIỂM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB 2: ĐỀ KIỂM TRA MẪU IN PHÁT HỌC SINH */}
      {activeTab === "EXAM" && (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xs space-y-6 font-serif print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start text-xs uppercase font-sans font-bold border-b pb-4 border-slate-200">
            <div className="text-left space-y-0.5">
              <p>{schoolInfo.departmentName?.toUpperCase() || "PHÒNG GD&ĐT QUẬN NAM TỪ LIÊM"}</p>
              <p className="font-black text-blue-900">{schoolInfo.name.toUpperCase()}</p>
            </div>
            <div className="text-center space-y-0.5">
              <p className="font-black text-sm">ĐỀ KIỂM TRA ĐỊNH KỲ {termName.toUpperCase()}</p>
              <p className="font-bold">MÔN: {subjectName.toUpperCase()} — LỚP {selectedGrade}</p>
              <p className="italic font-normal text-[11px]">Thời gian làm bài: 40 phút (Không kể thời gian phát đề)</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-bold">NĂM HỌC 2026 - 2027</p>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 text-xs font-sans grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>Họ và tên: ................................................................</div>
            <div>Lớp: <strong>{classInfo.name}</strong></div>
            <div>Mã số: ....................</div>
            <div>Ngày kiểm tra: ..../..../2026</div>
          </div>

          {/* Score & Teacher Note Boxes */}
          <div className="grid grid-cols-2 gap-3 text-xs font-sans">
            <div className="border border-slate-300 rounded-xl p-3 text-center space-y-1">
              <p className="font-bold">ĐIỂM SỐ</p>
              <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center font-bold text-lg text-indigo-900">
                ..... / 10đ
              </div>
            </div>
            <div className="border border-slate-300 rounded-xl p-3 space-y-1">
              <p className="font-bold">NHẬN XÉT CỦA GIÁO VIÊN</p>
              <p className="text-[11px] text-slate-400 italic">.....................................................................................................</p>
              <p className="text-[11px] text-slate-400 italic">.....................................................................................................</p>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4 text-xs font-sans leading-relaxed">
            <div className="font-black uppercase text-indigo-950 border-b border-indigo-100 pb-1">
              PHẦN I: TRẮC NGHIỆM KHÁCH QUAN (4.0 điểm) — Khoanh tròn vào chữ cái đặt trước câu trả lời đúng
            </div>

            <div className="space-y-3 pl-2">
              <div>
                <p className="font-bold">Câu 1 (Mức 1 - 1.0 điểm): Số gồm 5 trăm nghìn, 7 chục nghìn và 2 đơn vị viết là:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>A. 570 002</div>
                  <div>B. 57 002</div>
                  <div>C. 507 002</div>
                  <div>D. 570 200</div>
                </div>
              </div>

              <div>
                <p className="font-bold">Câu 2 (Mức 1 - 1.0 điểm): Góc nào sau đây là góc nhọn?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>A. Góc có số đo bằng 90°</div>
                  <div>B. Góc bé hơn góc vuông</div>
                  <div>C. Góc lớn hơn góc vuông</div>
                  <div>D. Góc bẹt</div>
                </div>
              </div>

              <div>
                <p className="font-bold">Câu 3 (Mức 2 - 1.0 điểm): Trung bình cộng của ba số 35, 45 và 70 là:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>A. 45</div>
                  <div>B. 50</div>
                  <div>C. 55</div>
                  <div>D. 60</div>
                </div>
              </div>

              <div>
                <p className="font-bold">Câu 4 (Mức 1 - 1.0 điểm): 3 tấn 25 kg = ............. kg. Số thích hợp điền vào chỗ chấm là:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>A. 325</div>
                  <div>B. 3 025</div>
                  <div>C. 3 250</div>
                  <div>D. 30 025</div>
                </div>
              </div>
            </div>

            <div className="font-black uppercase text-indigo-950 border-b border-indigo-100 pb-1 pt-2">
              PHẦN II: TỰ LUẬN (6.0 điểm) — Học sinh trình bày chi tiết bài làm
            </div>

            <div className="space-y-4 pl-2">
              <div>
                <p className="font-bold">Câu 5 (Mức 2 - 2.0 điểm): Đặt tính rồi tính:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-slate-700">
                  <div>a) 345 829 + 128 450</div>
                  <div>b) 708 521 - 245 318</div>
                  <div>c) 4 215 × 6</div>
                  <div>d) 25 840 : 5</div>
                </div>
              </div>

              <div>
                <p className="font-bold">
                  Câu 6 (Mức 2 - 2.5 điểm): Một mảnh đất hình chữ nhật có nửa chu vi là 120 m. Chiều dài hơn chiều rộng 30 m. Tính diện tích của mảnh đất đó?
                </p>
                <div className="h-24 border border-dashed border-slate-200 rounded-xl p-3 text-slate-300 italic">
                  Bài giải: .........................................................................................................................................
                </div>
              </div>

              <div>
                <p className="font-bold">
                  Câu 7 (Mức 3 - 1.5 điểm): Tính bằng cách thuận tiện nhất:
                </p>
                <p className="pt-1 text-slate-800 font-mono">125 × 38 + 125 × 62</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: ĐÁP ÁN & BIỂU ĐIỂM CHI TIẾT */}
      {activeTab === "ANSWER" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
              HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM MÔN {subjectName.toUpperCase()} — LỚP {selectedGrade}
            </h2>
            <p className="text-xs text-slate-600 italic">
              Thang điểm 10 chuẩn Thông tư 27/2020/TT-BGDĐT
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-100 p-3 font-bold text-slate-900">
                PHẦN I: TRẮC NGHIỆM (4.0 điểm) — Mỗi câu đúng được 1.0 điểm
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 text-center font-bold">
                <div className="p-2 bg-white rounded-xl border border-slate-200">Câu 1: <strong className="text-blue-600">A</strong> (570 002)</div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">Câu 2: <strong className="text-blue-600">B</strong> (Góc bé hơn góc vuông)</div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">Câu 3: <strong className="text-blue-600">B</strong> (50)</div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">Câu 4: <strong className="text-blue-600">B</strong> (3 025 kg)</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden space-y-2">
              <div className="bg-slate-100 p-3 font-bold text-slate-900">
                PHẦN II: TỰ LUẬN (6.0 điểm)
              </div>
              <div className="p-4 space-y-3 bg-slate-50/50 leading-relaxed">
                <div>
                  <strong className="text-indigo-900">Câu 5 (2.0 điểm):</strong> Mỗi phép tính đặt tính và tính đúng được 0.5 điểm.
                  <p className="text-slate-600 pl-3">a) 474 279 • b) 463 203 • c) 25 290 • d) 5 168</p>
                </div>

                <div>
                  <strong className="text-indigo-900">Câu 6 (2.5 điểm):</strong>
                  <p className="text-slate-700 pl-3">
                    - Chiều dài mảnh đất là: (120 + 30) : 2 = 75 (m) <em>(0.75 điểm)</em><br />
                    - Chiều rộng mảnh đất là: 120 - 75 = 45 (m) <em>(0.75 điểm)</em><br />
                    - Diện tích mảnh đất là: 75 × 45 = 3 375 (m²) <em>(0.75 điểm)</em><br />
                    - Đáp số: 3 375 m² <em>(0.25 điểm)</em>
                  </p>
                </div>

                <div>
                  <strong className="text-indigo-900">Câu 7 (1.5 điểm):</strong>
                  <p className="text-slate-700 pl-3">
                    125 × 38 + 125 × 62 = 125 × (38 + 62) <em>(0.75 điểm)</em><br />
                    = 125 × 100 = 12 500 <em>(0.75 điểm)</em>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
