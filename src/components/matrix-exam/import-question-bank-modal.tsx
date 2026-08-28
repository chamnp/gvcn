"use client";

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Package,
  Upload,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { GradeLevel, TermType } from '@/types';
import { ExamQuestion } from '@/lib/question-bank-data';
import {
  parseRawTextToQuestions,
  parseExcelToQuestions,
  downloadQuestionBankTemplate,
  PRESET_PACKAGES,
} from '@/lib/question-bank-importer';
import { toast } from 'sonner';

interface ImportQuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject: string;
  currentGrade: GradeLevel;
  currentTerm: TermType;
  onImportSuccess: (questions: ExamQuestion[]) => void;
}

export function ImportQuestionBankModal({
  isOpen,
  onClose,
  currentSubject,
  currentGrade,
  currentTerm,
  onImportSuccess,
}: ImportQuestionBankModalProps) {
  const [activeTab, setActiveTab] = useState<'TEXT' | 'EXCEL' | 'PRESETS'>('TEXT');
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ExamQuestion[]>([]);

  // Excel upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  // Handle Text Parsing
  const handleParseText = () => {
    if (!pastedText.trim()) {
      toast.error('Vui lòng dán nội dung đề kiểm tra hoặc câu hỏi!');
      return;
    }

    setIsParsing(true);
    try {
      const results = parseRawTextToQuestions(
        pastedText,
        currentSubject,
        currentGrade,
        currentTerm
      );

      if (results.length === 0) {
        toast.error('Không nhận diện được câu hỏi nào. Vui lòng kiểm tra định dạng Câu 1:, A. ..., B. ..., v.v.');
      } else {
        setParsedPreview(results);
        toast.success('Đã nhận diện thành công ' + results.length + ' câu hỏi!');
      }
    } catch (e) {
      toast.error('Có lỗi xảy ra khi bóc tách văn bản');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Excel File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const results = await parseExcelToQuestions(
        buffer,
        currentSubject,
        currentGrade,
        currentTerm
      );

      if (results.length === 0) {
        toast.error('Không tìm thấy câu hỏi hợp lệ trong file Excel');
      } else {
        setParsedPreview(results);
        toast.success('Đã đọc thành công ' + results.length + ' câu hỏi từ file Excel!');
      }
    } catch (e) {
      toast.error('Không thể đọc file Excel. Vui lòng dùng đúng file mẫu.');
    }
  };

  // Commit Import
  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) {
      toast.error('Chưa có câu hỏi nào để nạp vào ngân hàng!');
      return;
    }

    onImportSuccess(parsedPreview);
    toast.success('Đã nạp ' + parsedPreview.length + ' câu hỏi mới vào Ngân hàng dữ liệu!');
    onClose();
  };

  // Import Preset Package
  const handleImportPreset = (pkg: (typeof PRESET_PACKAGES)[0]) => {
    onImportSuccess(pkg.questions);
    toast.success('Đã cài đặt thành công gói "' + pkg.name + '" (' + pkg.questions.length + ' câu)!');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              📥
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>Import & Nạp Bộ Đề Vào Ngân Hàng Câu Hỏi</span>
              </h3>
              <p className="text-xs text-indigo-100">
                Hỗ trợ dán văn bản tự động bóc tách (Word/Zalo), nạp file Excel và gói bộ đề chuẩn Bộ GD&ĐT.
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-1.5 shrink-0 text-xs font-bold">
          {[
            { id: 'TEXT', label: '📄 Dán Văn Bản (Smart Parser)', icon: FileText },
            { id: 'EXCEL', label: '📊 Tải Lên File Excel (.xlsx)', icon: FileSpreadsheet },
            { id: 'PRESETS', label: '🎁 Gói Bộ Đề Mẫu Chuẩn (Toán & TV)', icon: Package },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setParsedPreview([]);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
          {/* TAB 1: SMART TEXT PARSER */}
          {activeTab === 'TEXT' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Dán nội dung đề thi từ Word, PDF hoặc Zalo:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText(
                        'Câu 1 (Mức 1): Số gồm 5 trăm nghìn, 7 chục nghìn và 2 đơn vị viết là:\nA. 570 002\nB. 57 002\nC. 507 002\nD. 570 200\nĐáp án: A\n\nCâu 2 (Mức 2): Trung bình cộng của ba số 35, 45 và 70 là:\nA. 45\nB. 50\nC. 55\nD. 60\nĐáp án: B\n\nCâu 3 (Mức 3): Tính bằng cách thuận tiện nhất: 125 × 38 + 125 × 62\nĐáp án: 12 500'
                      );
                    }}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Xem văn bản mẫu
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Ví dụ:
Câu 1 (Mức 1): Số gồm 5 trăm nghìn, 7 chục nghìn...
A. 570 002
B. 57 002
C. 507 002
D. 570 200
Đáp án: A"
                  className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseText}
                  disabled={isParsing || !pastedText.trim()}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isParsing ? 'Đang Phân Tích...' : '⚡ Bóc Tách Câu Hỏi Tự Động'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EXCEL UPLOAD */}
          {activeTab === 'EXCEL' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50/80 p-4 rounded-2xl border border-blue-200">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-blue-900">Tải Về File Excel Mẫu Chuẩn Thông Tư 27</h4>
                  <p className="text-[11px] text-blue-700">
                    Mẫu gồm các cột chuẩn: STT, Môn, Khối, Mạch kiến thức, Mức độ (1/2/3), Hình thức (TN/TL), Đáp án, Điểm số.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadQuestionBankTemplate}
                  className="inline-flex items-center space-x-1.5 bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tải File Mẫu (.xlsx)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                  📁
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Kéo thả hoặc chọn file Excel của trường</p>
                  <p className="text-[11px] text-slate-500">Hỗ trợ định dạng .xlsx, .xls</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-file-upload"
                />
                <label
                  htmlFor="excel-file-upload"
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn File Từ Máy Tính</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PRESET PACKAGES */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-3">
              <p className="text-slate-600 text-xs">
                Chọn gói câu hỏi mẫu chuẩn quốc gia để cài đặt ngay vào ngân hàng đề thi của lớp:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {PRESET_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-indigo-300 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900">{pkg.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                          {pkg.questionCount} câu
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{pkg.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImportPreset(pkg)}
                      className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3.5 py-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer"
                    >
                      <span>Cài Đặt Ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PARSED PREVIEW SECTION */}
          {parsedPreview.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-emerald-950 font-bold">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sẵn sàng nạp {parsedPreview.length} câu hỏi mới vào ngân hàng môn {currentSubject}</span>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-black text-xs shadow-xs cursor-pointer"
                >
                  Xác Nhận Nạp Dữ Liệu
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {parsedPreview.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-indigo-950">
                        Câu {idx + 1} ({q.level === 'MUC_1' ? 'Mức 1' : q.level === 'MUC_2' ? 'Mức 2' : 'Mức 3'} - {q.points}đ)
                      </span>
                      <span className="text-[10px] text-slate-500">{q.strand}</span>
                    </div>
                    <p className="text-slate-800 line-clamp-2">{q.content}</p>
                    {q.options && (
                      <p className="text-[11px] text-slate-500">
                        {q.options.join(' • ')} (Đ/A: <strong>{q.correctAnswer}</strong>)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
