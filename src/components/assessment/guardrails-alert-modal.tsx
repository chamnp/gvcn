'use client';

import React from 'react';
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { GuardrailIssue } from '@/lib/tt27-engine';

interface GuardrailsAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: GuardrailIssue[];
  onNavigateToStudent?: (studentId: string, category: 'SUBJECTS' | 'QUALITIES' | 'COMPETENCIES' | 'SUMMARY') => void;
}

export function GuardrailsAlertModal({
  isOpen,
  onClose,
  issues,
  onNavigateToStudent,
}: GuardrailsAlertModalProps) {
  if (!isOpen) return null;

  const errors = issues.filter((i) => i.type === 'ERROR');
  const warnings = issues.filter((i) => i.type === 'WARNING');
  const infos = issues.filter((i) => i.type === 'INFO');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Kiểm Tra Logic Đánh Giá (Thông tư 27)
              </h3>
              <p className="text-xs text-slate-500">
                Phát hiện {issues.length} điểm cần lưu ý theo quy định của Bộ GD&ĐT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs divide-y divide-slate-100">
          {issues.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="font-black text-sm text-slate-900">
                Tuyệt vời! Toàn bộ dữ liệu đánh giá đều hợp lệ!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Không phát hiện mâu thuẫn điểm số hay sai sót danh hiệu khen thưởng nào theo Thông tư 27.
              </p>
            </div>
          ) : (
            <>
              {/* Errors List */}
              {errors.length > 0 && (
                <div className="space-y-2 pt-2 first:pt-0">
                  <div className="flex items-center space-x-1.5 font-black text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Lỗi Logic Bắt Buộc Sửa ({errors.length})</span>
                  </div>
                  <div className="space-y-2">
                    {errors.map((item) => (
                      <div
                        key={item.id}
                        className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-slate-900">{item.studentName}</span>
                            <span className="text-[10px] bg-rose-200 text-rose-800 font-bold px-2 py-0.2 rounded-md">
                              {item.category}
                            </span>
                          </div>
                          <p className="font-bold text-rose-900">{item.message}</p>
                          {item.detail && (
                            <p className="text-[11px] text-rose-700">{item.detail}</p>
                          )}
                        </div>
                        {onNavigateToStudent && (
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateToStudent(item.studentId, item.category);
                              onClose();
                            }}
                            className="bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px] px-2.5 py-1.5 rounded-xl shrink-0 transition-colors cursor-pointer"
                          >
                            Đến Sửa →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings List */}
              {warnings.length > 0 && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center space-x-1.5 font-black text-amber-700 text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cảnh Báo Cân Nhắc ({warnings.length})</span>
                  </div>
                  <div className="space-y-2">
                    {warnings.map((item) => (
                      <div
                        key={item.id}
                        className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-slate-900">{item.studentName}</span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.2 rounded-md">
                              {item.category}
                            </span>
                          </div>
                          <p className="font-bold text-amber-950">{item.message}</p>
                          {item.detail && (
                            <p className="text-[11px] text-amber-800">{item.detail}</p>
                          )}
                        </div>
                        {onNavigateToStudent && (
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateToStudent(item.studentId, item.category);
                              onClose();
                            }}
                            className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] px-2.5 py-1.5 rounded-xl shrink-0 transition-colors cursor-pointer"
                          >
                            Đến Sửa →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info / Missing Comments */}
              {infos.length > 0 && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center space-x-1.5 font-black text-blue-700 text-xs">
                    <Info className="w-4 h-4" />
                    <span>Chưa Hoàn Thiện Lời Nhận Xét ({infos.length})</span>
                  </div>
                  <div className="space-y-2">
                    {infos.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="bg-blue-50/50 border border-blue-200 rounded-2xl p-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-slate-900">{item.studentName}</span>
                          </div>
                          <p className="text-blue-900 text-[11px]">{item.message}</p>
                        </div>
                        {onNavigateToStudent && (
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateToStudent(item.studentId, item.category);
                              onClose();
                            }}
                            className="bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[11px] px-2.5 py-1 rounded-xl shrink-0 transition-colors cursor-pointer"
                          >
                            Nhập Nhận Xét →
                          </button>
                        )}
                      </div>
                    ))}
                    {infos.length > 8 && (
                      <p className="text-[11px] text-slate-400 text-center pt-1 italic">
                        và {infos.length - 8} học sinh khác chưa có lời nhận xét...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Quy tắc căn cứ theo Điều 13, 14 Thông tư 27/2020/TT-BGDĐT
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
