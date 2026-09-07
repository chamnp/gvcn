'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Heart,
  Pill,
  ShieldCheck,
  UserCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Utensils,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Student, LeaveRequestReason } from '@/types';
import { toast } from 'sonner';

interface LeaveRequestModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onVerifiedSubmit?: (payload: Record<string, unknown>) => Promise<boolean>;
}

const REASON_OPTIONS: { id: LeaveRequestReason; label: string; icon: string }[] = [
  { id: 'OM_DAU', label: 'Con bị ốm / Sốt / Cảm', icon: '🤒' },
  { id: 'KHAM_BENH', label: 'Có lịch khám bệnh / Tiêm chủng', icon: '🏥' },
  { id: 'VIEC_GIA_DINH', label: 'Gia đình có việc bận / Về quê', icon: '🏡' },
  { id: 'NGHI_PHEP', label: 'Đi du lịch / Nghỉ phép riêng', icon: '✈️' },
  { id: 'KHAC', label: 'Lý do khác', icon: '📝' },
];

export function LeaveRequestModal({ student, isOpen, onClose, onVerifiedSubmit }: LeaveRequestModalProps) {
  const { createLeaveRequest, classInfo } = useAppStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reasonType, setReasonType] = useState<LeaveRequestReason>('OM_DAU');
  const [reasonDetail, setReasonDetail] = useState('');
  const [hasBoardingMealCancel, setHasBoardingMealCancel] = useState(true);
  const [medicationNotes, setMedicationNotes] = useState('');
  const [hasMedication, setHasMedication] = useState(false);
  const [pickupPersonName, setPickupPersonName] = useState('');
  const [pickupPersonPhone, setPickupPersonPhone] = useState('');
  const [hasPickupPerson, setHasPickupPerson] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonDetail.trim()) {
      toast.error('Vui lòng mô tả cụ thể lý do xin nghỉ!');
      return;
    }

    const payload = {
      classId: student.classId || classInfo.id,
      studentId: student.id,
      studentName: student.fullName,
      parentName: student.parentName || 'Phụ huynh em ' + student.fullName,
      parentPhone: student.parentPhone || '',
      startDate,
      endDate: endDate || startDate,
      reasonType,
      reasonDetail: reasonDetail.trim(),
      hasBoardingMealCancel,
      medicationNotes: hasMedication ? medicationNotes.trim() : undefined,
      pickupPerson: hasPickupPerson && pickupPersonName.trim()
        ? {
            name: pickupPersonName.trim(),
            phone: pickupPersonPhone.trim(),
            relationship: 'Người thân được ủy quyền',
          }
        : undefined,
    };

    if (onVerifiedSubmit) {
      setIsSubmitting(true);
      const success = await onVerifiedSubmit(payload);
      setIsSubmitting(false);
      if (success) onClose();
      return;
    }
    createLeaveRequest(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 text-xs">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              📋
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                Đơn Xin Nghỉ Phép & Dặn Dò Sức Khỏe
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Học sinh: <strong className="text-blue-700 font-black">{student.fullName}</strong> (Lớp {classInfo.name})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* 1. Date Selection */}
          <div className="space-y-1.5">
            <label className="font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Thời Gian Xin Nghỉ:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Từ ngày:</span>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Đến ngày:</span>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Reason Category */}
          <div className="space-y-1.5">
            <label className="font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Lý Do Nghỉ Học:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REASON_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReasonType(opt.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                    reasonType === opt.id
                      ? 'border-blue-500 bg-blue-50/70 font-black text-blue-900 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Reason Detail Text */}
          <div className="space-y-1">
            <span className="font-black text-slate-700 block text-[10px] uppercase tracking-wider">
              Chi Tiết Lý Do & Lời Nhắn Gửi Cô Giáo:
            </span>
            <textarea
              rows={2}
              required
              placeholder="VD: Cháu bị sốt nhẹ từ tối qua, gia đình xin phép cô cho cháu nghỉ ở nhà theo dõi và uống thuốc..."
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 4. Boarding Meal Cancellation */}
          {student.isBoarding && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Utensils className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="font-black text-amber-950 block text-xs">Hủy Suất Ăn Bán Trú Ngày Nghỉ</span>
                  <span className="text-[10px] text-amber-700">Tự động báo nhà bếp trừ suất ăn của con</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasBoardingMealCancel}
                onChange={(e) => setHasBoardingMealCancel(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          )}

          {/* 5. Dặn Dò Thuốc (Optional) */}
          <div className="border border-slate-200 rounded-2xl p-3.5 space-y-2 bg-slate-50/50">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-rose-500" />
                <span>Dặn Cô Cho Uống Thuốc / Chăm Sóc Sức Khỏe</span>
              </span>
              <input
                type="checkbox"
                checked={hasMedication}
                onChange={(e) => setHasMedication(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </label>

            {hasMedication && (
              <div className="pt-2 animate-in fade-in space-y-1.5">
                <textarea
                  rows={2}
                  placeholder="Ghi rõ: Tên thuốc, liều lượng, giờ cho uống (VD: Sau ăn trưa 12h30 cho cháu uống 1 gói Hapacol 250mg)..."
                  value={medicationNotes}
                  onChange={(e) => setMedicationNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 6. Ủy Quyền Người Đón Hộ (Optional) */}
          <div className="border border-slate-200 rounded-2xl p-3.5 space-y-2 bg-slate-50/50">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Ủy Quyền Người Đón Con Hộ</span>
              </span>
              <input
                type="checkbox"
                checked={hasPickupPerson}
                onChange={(e) => setHasPickupPerson(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </label>

            {hasPickupPerson && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Họ tên người đón (VD: Bác Nguyễn Thị Lan)"
                  value={pickupPersonName}
                  onChange={(e) => setPickupPersonName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại người đón"
                  value={pickupPersonPhone}
                  onChange={(e) => setPickupPersonPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-11 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-center"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang gửi…' : 'Gửi Đơn Đến Giáo Viên'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
