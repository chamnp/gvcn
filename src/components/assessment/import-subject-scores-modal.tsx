'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  RefreshCw,
} from 'lucide-react';
import { Student, SubjectLevel, TermType } from '@/types';
import { parseSubjectScoreExcelFile, ParseSubjectScoreResult } from '@/lib/excel-import';
import { toast } from 'sonner';

interface ImportSubjectScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: { code: string; name: string; shortName: string }[];
  currentSubjectCode: string;
  students: Student[];
  currentTerm: TermType;
  onImportSuccess: (
    subjectCode: string,
    updates: {
      studentId: string;
      subjectCode: string;
      term: TermType;
      level: SubjectLevel;
      score?: number;
      comment?: string;
    }[]
  ) => void;
  onOpenExportTemplate: () => void;
}

export const ImportSubjectScoresModal: React.FC<ImportSubjectScoresModalProps> = ({
  isOpen,
  onClose,
  subjects,
  currentSubjectCode,
  students,
  currentTerm,
  onImportSuccess,
  onOpenExportTemplate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    currentSubjectCode || (subjects[0]?.code || 'TOAN')
  );
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseSubjectScoreResult | null>(null);
  const [fileName, setFileName] = useState<string>('');

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    try {
      const res = await parseSubjectScoreExcelFile(file, students);
      setParseResult(res);

      if (res.detectedSubjectCode && subjects.some((s) => s.code === res.detectedSubjectCode)) {
        setSelectedSubjectCode(res.detectedSubjectCode);
      }

      if (res.items.length === 0) {
        toast.warning('Không tìm thấy dữ liệu điểm học sinh hợp lệ trong file Excel.');
      } else {
        toast.success(`Đã nhận diện ${res.items.length} học sinh trong file!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng file.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.items.length === 0) {
      toast.error('Không có dữ liệu hợp lệ để nhập.');
      return;
    }

    const updates = parseResult.items.map((it) => ({
      studentId: it.studentId,
      subjectCode: selectedSubjectCode,
      term: currentTerm,
      level: it.level,
      score: it.score,
      comment: it.comment,
    }));

    onImportSuccess(selectedSubjectCode, updates);
    const subObj = subjects.find((s) => s.code === selectedSubjectCode);
    toast.success(
      `Đã cập nhật thành công ${updates.length} bản ghi điểm & nhận xét cho môn ${
        subObj?.shortName || selectedSubjectCode
      }!`
    );
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setParseResult(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectedSubjectObj = subjects.find((s) => s.code === selectedSubjectCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-blue-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Nhập Điểm & Đánh Giá Từ File Excel</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Tự động khớp tên
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Hỗ trợ cả điểm số (0 - 10), mức đánh giá (T/H/C) và lời nhận xét chi tiết
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Target Subject Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">Áp dụng cho môn học:</span>
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.name} ({sub.shortName})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenExportTemplate}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Tải file Excel mẫu môn này</span>
            </button>
          </div>

          {/* Upload Area */}
          {!parseResult ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-3xl p-8 text-center transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">
                Bấm để chọn file Excel bảng điểm hoặc kéo thả vào đây
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Hỗ trợ file .xlsx, .xls có các cột: Mã học sinh (hoặc Họ và tên), Điểm số, Mức đánh giá (T/H/C), Lời nhận xét.
              </p>
              {isParsing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang phân tích dữ liệu bảng điểm...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800 truncate max-w-xs">{fileName}</span>
                  <span className="bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    Khớp {parseResult.items.length}/{students.length} học sinh
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Unmatched Rows Warning */}
              {parseResult.unmatchedRows.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Có {parseResult.unmatchedRows.length} dòng không tìm thấy trong danh sách lớp:</span>
                  </div>
                  <div className="max-h-20 overflow-y-auto space-y-0.5 text-[11px] text-amber-800 pl-5">
                    {parseResult.unmatchedRows.map((u, i) => (
                      <div key={i}>
                        Dòng {u.rowNumber}: {u.rawName || u.rawCode} — {u.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-3">Mã & Họ Tên Học Sinh</th>
                      <th className="py-2.5 px-3 text-center w-24">Điểm Số</th>
                      <th className="py-2.5 px-3 text-center w-28">Mức ĐG</th>
                      <th className="py-2.5 px-3">Lời Nhận Xét Môn Học</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parseResult.items.map((it, idx) => (
                      <tr key={it.studentId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{it.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{it.studentCode}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          {it.score !== undefined ? (
                            <span className="text-emerald-700 font-black text-sm">{it.score}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                              it.level === 'T'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : it.level === 'H'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {it.level} ({it.level === 'T' ? 'Tốt' : it.level === 'H' ? 'Đạt' : 'Cần Cố Gắng'})
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[240px]">
                          {it.comment || <span className="text-slate-400 italic">Chưa có lời nhận xét</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parseResult
              ? `Sẵn sàng nhập điểm cho môn: ${selectedSubjectObj?.name || selectedSubjectCode}`
              : 'Chọn file để xem trước dữ liệu đối soát'}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={!parseResult || parseResult.items.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Xác Nhận Cập Nhật Bảng Điểm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
