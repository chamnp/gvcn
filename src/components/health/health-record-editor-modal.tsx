'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Eye,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { HealthRecord, Student, BMICategory } from '@/types';
import { toast } from 'sonner';

interface HealthRecordEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rec: Omit<HealthRecord, 'id' | 'createdAt'>) => void;
  onUpdate?: (rec: HealthRecord) => void;
  initialRecord?: HealthRecord | null;
  students: Student[];
  classId: string;
}

const COMMON_ALLERGIES = [
  'Dị ứng hải sản có vỏ (tôm, cua, sò)',
  'Dị ứng đậu phộng / lạc',
  'Dị ứng trứng gà',
  'Dị ứng sữa bò & chế phẩm từ sữa (Lactose)',
  'Dị ứng thuốc kháng sinh (Penicillin)',
  'Dị ứng thời tiết / phấn hoa',
];

export function HealthRecordEditorModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  initialRecord,
  students,
  classId,
}: HealthRecordEditorModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [heightCm, setHeightCm] = useState<number>(135);
  const [weightKg, setWeightKg] = useState<number>(30);
  const [leftEye, setLeftEye] = useState('10/10');
  const [rightEye, setRightEye] = useState('10/10');
  const [hasVisionDefect, setHasVisionDefect] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [vaccinationStatus, setVaccinationStatus] = useState('Đã tiêm đủ theo chương trình TCMR');
  const [checkupDate, setCheckupDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialRecord) {
      setSelectedStudentId(initialRecord.studentId);
      setHeightCm(initialRecord.heightCm);
      setWeightKg(initialRecord.weightKg);
      setLeftEye(initialRecord.leftEye);
      setRightEye(initialRecord.rightEye);
      setHasVisionDefect(initialRecord.hasVisionDefect);
      setAllergies(initialRecord.allergies || []);
      setMedicalNotes(initialRecord.medicalNotes || '');
      setVaccinationStatus(initialRecord.vaccinationStatus || 'Đã tiêm đủ');
      setCheckupDate(initialRecord.checkupDate);
    } else {
      setSelectedStudentId(students[0]?.id || '');
      setHeightCm(135);
      setWeightKg(30);
      setLeftEye('10/10');
      setRightEye('10/10');
      setHasVisionDefect(false);
      setAllergies([]);
      setMedicalNotes('');
      setVaccinationStatus('Đã tiêm đủ theo chương trình TCMR');
      setCheckupDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialRecord, isOpen, students]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? parseFloat((weightKg / (heightM * heightM)).toFixed(1)) : 0;

  let bmiCategory: BMICategory = 'BINH_THUONG';
  if (bmi < 14) bmiCategory = 'SUY_DINH_DUONG';
  else if (bmi >= 14 && bmi <= 19) bmiCategory = 'BINH_THUONG';
  else if (bmi > 19 && bmi <= 23) bmiCategory = 'NGUY_CO_THUA_CAN';
  else bmiCategory = 'BEO_PHI';

  const toggleAllergy = (item: string) => {
    setAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleAddCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const handleSave = () => {
    if (!currentStudent) {
      toast.error('Vui lòng chọn học sinh!');
      return;
    }

    const recordData = {
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      classId: classId || 'class-4a1',
      checkupDate,
      heightCm,
      weightKg,
      bmi,
      bmiCategory,
      leftEye,
      rightEye,
      hasVisionDefect: hasVisionDefect || leftEye.includes('Cận') || rightEye.includes('Cận'),
      allergies,
      medicalNotes: medicalNotes.trim(),
      vaccinationStatus,
    };

    if (initialRecord && onUpdate) {
      onUpdate({ ...initialRecord, ...recordData });
    } else {
      onSave(recordData);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🩺
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight">
                {initialRecord ? 'Cập Nhật Hồ Sơ Sức Khỏe Học Sinh' : 'Nhập Hồ Sơ Khám Sức Khỏe Định Kỳ'}
              </h3>
              <p className="text-xs text-emerald-100">
                Theo dõi chiều cao, cân nặng, BMI, thị lực và lưu ý dị ứng bán trú
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

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Chọn Học Sinh (*):</label>
              <select
                value={selectedStudentId}
                disabled={!!initialRecord}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.studentCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Ngày Khám Sức Khỏe:</label>
              <input
                type="date"
                value={checkupDate}
                onChange={(e) => setCheckupDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
            <h4 className="font-black text-emerald-950 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Chỉ Số Phát Triển Thể Chất (Tự Động Tính BMI):</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chiều Cao (cm):</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-black text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cân Nặng (kg):</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-black text-slate-900 text-sm"
                />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Chỉ Số BMI</span>
                <span className="text-lg font-black text-emerald-700">{bmi}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full mt-0.5 ${
                  bmiCategory === 'BINH_THUONG' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {bmiCategory === 'BINH_THUONG' ? 'Bình Thường' : bmiCategory === 'SUY_DINH_DUONG' ? 'Suy Dinh Dưỡng' : 'Nguy Cơ Thừa Cân'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Khám Thị Lực & Mắt:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mắt Trái:</label>
                <input
                  type="text"
                  placeholder="VD: 10/10 hoặc Cận 1.5D"
                  value={leftEye}
                  onChange={(e) => setLeftEye(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mắt Phải:</label>
                <input
                  type="text"
                  placeholder="VD: 10/10 hoặc Cận 1.75D"
                  value={rightEye}
                  onChange={(e) => setRightEye(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-rose-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Tiền Sử Dị Ứng & Lưu Ý Bán Trú (Báo Nhà Bếp):</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {COMMON_ALLERGIES.map((item) => {
                const checked = allergies.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAllergy(item)}
                    className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      checked
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-2">{item}</span>
                    {checked && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-rose-600" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Dị ứng khác..."
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAllergy()}
                className="flex-1 p-2 rounded-xl border border-slate-300 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomAllergy}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700 cursor-pointer"
              >
                + Thêm
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Ghi Chú Y Tế & Dặn Dò Uống Thuốc Buổi Trưa:
            </label>
            <textarea
              rows={2}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="VD: Tiền sử hen phế quản nhẹ khi thời tiết lạnh, cần phụ huynh gửi thuốc xịt..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu Hồ Sơ Sức Khỏe</span>
          </button>
        </div>
      </div>
    </div>
  );
}
