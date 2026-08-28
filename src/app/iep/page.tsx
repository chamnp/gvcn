'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Target,
  Sparkles,
  Plus,
  Printer,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  BookOpen,
  Filter,
  HeartHandshake,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { IEPPlan } from '@/types';
import { IEPEditorModal } from '@/components/iep/iep-editor-modal';
import { IEPPrintView } from '@/components/iep/iep-print-view';
import { DigitalPraiseModal } from '@/components/praise/digital-praise-modal';
import { toast } from 'sonner';

export default function IEPManagementPage() {
  const {
    iepPlans,
    addIEPPlan,
    updateIEPPlan,
    deleteIEPPlan,
    students,
    classInfo,
    schoolInfo,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'CAN_HO_TRO' | 'NANG_KHIEU'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<IEPPlan | null>(null);
  const [printingPlan, setPrintingPlan] = useState<IEPPlan | null>(null);
  const [isPraiseModalOpen, setIsPraiseModalOpen] = useState(false);

  const filteredPlans = useMemo(() => {
    return iepPlans.filter((p) => {
      const matchTab = activeTab === 'ALL' || p.category === activeTab;
      const matchSearch =
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.shortTermGoal.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [iepPlans, activeTab, searchQuery]);

  const remedialCount = iepPlans.filter((p) => p.category === 'CAN_HO_TRO').length;
  const giftedCount = iepPlans.filter((p) => p.category === 'NANG_KHIEU').length;
  const completedCount = iepPlans.filter((p) => p.status === 'COMPLETED').length;

  if (printingPlan) {
    return (
      <IEPPrintView
        plan={printingPlan}
        schoolInfo={schoolInfo}
        className={classInfo.name}
        teacherName={classInfo.teacherName}
        onBack={() => setPrintingPlan(null)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <span>📑 Thông Tư 27/2020/TT-BGDĐT</span>
            <span className="bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">
              Điều 6 & 11
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Kế Hoạch Giáo Dục Cá Nhân Hóa (IEP)
          </h1>

          <p className="text-xs sm:text-sm text-blue-100 font-medium">
            Hồ sơ theo dõi kèm cặp học sinh tiếp thu chậm / chưa hoàn thành và bồi dưỡng phát triển năng khiếu vượt trội lớp {classInfo.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsPraiseModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-black text-xs transition-all border border-white/20 cursor-pointer"
          >
            <span>💌 Thư Khen Phụ Huynh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPlan(null);
              setIsEditorOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs shadow-lg transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Lập Kế Hoạch IEP Mới</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Tổng Kế Hoạch</p>
          <h3 className="text-2xl font-black text-slate-900">{iepPlans.length}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Hồ sơ cá nhân hóa</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-200 bg-rose-50/30 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-rose-600 uppercase">🔴 Cần Phụ Đạo</p>
          <h3 className="text-2xl font-black text-rose-700">{remedialCount}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Tiếp thu chậm / yếu</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-200 bg-emerald-50/30 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">🟢 Năng Khiếu</p>
          <h3 className="text-2xl font-black text-emerald-700">{giftedCount}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Bồi dưỡng nâng cao</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-blue-200 bg-blue-50/30 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-blue-600 uppercase">🎯 Đã Hoàn Thành</p>
          <h3 className="text-2xl font-black text-blue-700">{completedCount}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Đạt mục tiêu tháng</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: `Tất Cả (${iepPlans.length})` },
            { id: 'CAN_HO_TRO', label: `🔴 Cần Hỗ Trợ (${remedialCount})` },
            { id: 'NANG_KHIEU', label: `🟢 Năng Khiếu (${giftedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'ALL' | 'CAN_HO_TRO' | 'NANG_KHIEU')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mục tiêu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* IEP Plans List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
              📑
            </div>
            <h4 className="font-bold text-sm text-slate-800">Chưa có kế hoạch IEP nào phù hợp</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Bấm nút <strong>"+ Lập Kế Hoạch IEP Mới"</strong> để theo dõi kèm cặp học sinh chưa hoàn thành hoặc bồi dưỡng học sinh năng khiếu.
            </p>
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const isRemedial = plan.category === 'CAN_HO_TRO';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-5 border-2 shadow-xs transition-all space-y-4 flex flex-col justify-between ${
                  isRemedial ? 'border-rose-100 hover:border-rose-300' : 'border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                          isRemedial ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isRemedial ? '🔴' : '🟢'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-slate-900 truncate">
                          {plan.studentName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              isRemedial ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isRemedial ? 'Cần Phụ Đạo' : 'Năng Khiếu'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {plan.startDate} ➔ {plan.reviewDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        plan.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : plan.status === 'NEEDS_ADJUSTMENT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {plan.status === 'COMPLETED'
                        ? '✓ Đã Đạt'
                        : plan.status === 'NEEDS_ADJUSTMENT'
                        ? 'Cần Chỉnh'
                        : 'Đang Thực Hiện'}
                    </span>
                  </div>

                  {/* Subjects Badges */}
                  <div className="flex flex-wrap gap-1">
                    {plan.subjectCodes.map((c) => (
                      <span
                        key={c}
                        className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Goal Summary */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                    <p className="font-bold text-slate-800">🎯 Mục Tiêu 4 Tuần:</p>
                    <p className="text-slate-600 leading-relaxed line-clamp-2">
                      {plan.shortTermGoal}
                    </p>
                  </div>

                  {/* Buddy Student */}
                  {plan.buddyStudentName && (
                    <p className="text-[11px] text-slate-600 flex items-center gap-1">
                      <span>🤝 <strong>Đôi bạn cùng tiến:</strong> {plan.buddyStudentName}</span>
                    </p>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintingPlan(plan)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In Biểu Mẫu A4</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <select
                      value={plan.status}
                      onChange={(e) => {
                        updateIEPPlan({ ...plan, status: e.target.value as any });
                        toast.success(`Đã cập nhật trạng thái em ${plan.studentName}!`);
                      }}
                      className="text-[10px] font-black rounded-xl px-2 py-1 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-white cursor-pointer transition-colors"
                      title="Đổi nhanh trạng thái tiến độ"
                    >
                      <option value="DANG_TIEN_HANH">🔄 Đang Thực Hiện</option>
                      <option value="DA_HOAN_THANH">✅ Đã Hoàn Thành</option>
                      <option value="CAN_DIEU_CHINH">⚠️ Cần Điều Chỉnh</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlan(plan);
                        setIsEditorOpen(true);
                      }}
                      className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                      title="Chỉnh sửa kế hoạch"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn xóa kế hoạch IEP của em ${plan.studentName}?`)) {
                          deleteIEPPlan(plan.id);
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                      title="Xóa kế hoạch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* IEP Editor Modal */}
      <IEPEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPlan(null);
        }}
        onSave={(newPlan) => addIEPPlan(newPlan)}
        onUpdate={(updated) => updateIEPPlan(updated)}
        initialPlan={editingPlan}
        students={students}
        classId={classInfo.id}
      />

      {/* Digital Praise Modal */}
      <DigitalPraiseModal
        isOpen={isPraiseModalOpen}
        onClose={() => setIsPraiseModalOpen(false)}
        students={students}
        className={classInfo.name}
        teacherName={classInfo.teacherName}
      />
    </div>
  );
}
