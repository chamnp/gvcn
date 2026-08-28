'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Phone,
  MessageCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Users,
  Eye,
  CheckCircle2,
  Filter,
  Check,
  Compass,
} from 'lucide-react';
import { EarlyInterventionAlert } from '@/types';
import { toast } from 'sonner';

interface EarlyInterventionWidgetProps {
  alerts: EarlyInterventionAlert[];
}

export function EarlyInterventionWidget({ alerts }: EarlyInterventionWidgetProps) {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'ATTENDANCE' | 'ACADEMIC' | 'BEHAVIOR' | 'HEALTH_SEATING'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;
  const infoCount = alerts.filter((a) => a.severity === 'INFO').length;

  const filteredAlerts = useMemo(() => {
    if (selectedCategory === 'ALL') return alerts;
    return alerts.filter((a) => a.category === selectedCategory);
  }, [alerts, selectedCategory]);

  const handleCopyZaloNotice = (studentName: string, reason: string, id: string) => {
    const text = `Kính gửi Quý Phụ Huynh em ${studentName}, cô giáo chủ nhiệm xin gửi lời chào đến gia đình. Cô xin trao đổi nhanh về tình hình học tập và chuyên cần gần đây của con: ${reason}. Rất mong gia đình cùng phối hợp với cô để hỗ trợ con học tập tốt hơn ạ!`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép tin nhắn Zalo gửi phụ huynh!');
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            🚨
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900">
                Radar Cảnh Báo Sớm Học Sinh Cần Hỗ Trợ
              </h3>
              {criticalCount > 0 ? (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                  {criticalCount} Cần Can Thiệp Gấp!
                </span>
              ) : alerts.length > 0 ? (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {alerts.length} Lưu ý
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Lớp Ổn Định
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động quét chuyên cần, điểm số sa sút, nề nếp sao và thị lực chỗ ngồi theo thời gian thực.
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {[
            { id: 'ALL', label: `Tất cả (${alerts.length})` },
            { id: 'ATTENDANCE', label: 'Chuyên cần' },
            { id: 'ACADEMIC', label: 'Học tập' },
            { id: 'BEHAVIOR', label: 'Nề nếp' },
            { id: 'HEALTH_SEATING', label: 'Thị lực' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid / List */}
      {filteredAlerts.length === 0 ? (
        <div className="py-8 text-center space-y-2 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            🎉
          </div>
          <h4 className="font-black text-sm text-slate-800">
            Không Có Cảnh Báo Nguy Cơ Nào Thuộc Mục Này!
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Học sinh trong lớp đều duy trì chuyên cần tốt, điểm số ổn định và nề nếp thi đua đạt chuẩn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredAlerts.map((item) => {
            const isCritical = item.severity === 'CRITICAL';
            const isWarning = item.severity === 'WARNING';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                  isCritical
                    ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                    : isWarning
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                    : 'bg-blue-50/30 border-blue-200 hover:border-blue-300'
                }`}
              >
                <div className="space-y-2">
                  {/* Top info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          isCritical
                            ? 'bg-rose-600 text-white'
                            : isWarning
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isCritical ? '🔴' : isWarning ? '🟡' : '🔵'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                          {item.studentName}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500">
                          {item.category === 'ATTENDANCE'
                            ? 'Chuyên cần'
                            : item.category === 'ACADEMIC'
                            ? 'Học tập TT27'
                            : item.category === 'BEHAVIOR'
                            ? 'Nề nếp & Sao'
                            : 'Sức khỏe & Chỗ ngồi'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        isCritical
                          ? 'bg-rose-200 text-rose-900'
                          : isWarning
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.metricValue || (isCritical ? 'Nguy cấp' : 'Lưu ý')}
                    </span>
                  </div>

                  {/* Title & Reason */}
                  <div>
                    <h5
                      className={`font-black text-xs ${
                        isCritical
                          ? 'text-rose-950'
                          : isWarning
                          ? 'text-amber-950'
                          : 'text-blue-950'
                      }`}
                    >
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                      {item.reason}
                    </p>
                  </div>

                  {/* Recommendation Box */}
                  <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80 text-[11px] space-y-0.5">
                    <span className="font-black text-slate-700 block text-[10px] uppercase tracking-wider">
                      💡 Đề Xuất Giải Pháp:
                    </span>
                    <p className="text-slate-800 leading-snug">{item.actionRecommendation}</p>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="pt-1 flex items-center justify-between border-t border-slate-100/80">
                  {item.actionType === 'CONTACT_PARENT' && (
                    <button
                      type="button"
                      onClick={() => handleCopyZaloNotice(item.studentName, item.reason, item.id)}
                      className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép tin Zalo</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                          <span>Sao chép tin Zalo gửi PH</span>
                        </>
                      )}
                    </button>
                  )}

                  {item.actionType === 'CHANGE_SEAT' && (
                    <Link
                      href="/seating-chart"
                      className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Xếp lại chỗ ngồi →</span>
                    </Link>
                  )}

                  {item.actionType === 'TUTORING' && (
                    <Link
                      href="/assessment"
                      className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                      <span>Xem bảng điểm TT27 →</span>
                    </Link>
                  )}

                  {item.actionType === 'REWARD_ENCOURAGE' && (
                    <Link
                      href="/behavior"
                      className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-amber-700 border border-amber-200 font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tặng sao động viên →</span>
                    </Link>
                  )}

                  <Link
                    href="/students"
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors ml-auto"
                  >
                    Xem hồ sơ em →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
