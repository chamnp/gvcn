'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Search,
  User,
  School,
  Key,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useAppStore, getDefaultPinForStudent } from '@/lib/store';
import { toast } from 'sonner';

export default function StudentLookupPortal() {
  const router = useRouter();
  const { schoolClasses, allStudents, schoolInfo } = useAppStore();

  // Selected Class
  const [selectedClassId, setSelectedClassId] = useState<string>(schoolClasses[3]?.id || schoolClasses[0]?.id || 'class-4a1');

  // Filter students for selected class
  const classStudents = useMemo(() => {
    return allStudents.filter((s) => (s.classId || 'class-4a1') === selectedClassId);
  }, [allStudents, selectedClassId]);

  // Selected Student
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [pinInput, setPinInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentStudent = useMemo(() => {
    return classStudents.find((s) => s.id === selectedStudentId);
  }, [classStudents, selectedStudentId]);

  const defaultPin = currentStudent ? getDefaultPinForStudent(currentStudent) : '';

  // Handle Verify & Navigate
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) {
      toast.error('Vui lòng chọn học sinh!');
      return;
    }

    const input = pinInput.trim();
    if (!input) {
      toast.error('Vui lòng nhập mã PIN hoặc 4 số ngày sinh!');
      return;
    }

    // Check PIN matching
    const correctPin = currentStudent.customPin || defaultPin;
    const isDefaultMatch = input === defaultPin;
    const isCustomMatch = currentStudent.customPin && input === currentStudent.customPin;

    if (isCustomMatch || isDefaultMatch) {
      toast.success(`Xác thực thành công! Đang mở phiếu báo điểm em ${currentStudent.fullName}...`);
      const token = currentStudent.shareToken || currentStudent.id;
      router.push(`/student/${token}`);
    } else {
      toast.error('Mã PIN không chính xác! Nếu quên mã, bố mẹ vui lòng liên hệ Giáo viên chủ nhiệm để đặt lại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-center">
        {/* Brand Header */}
        <div className="space-y-3">
          {schoolInfo.logoUrl ? (
            <img
              src={schoolInfo.logoUrl}
              alt="Logo"
              className="w-20 h-20 rounded-3xl object-cover border-2 border-blue-500 shadow-lg shadow-blue-500/20 mx-auto bg-white"
            />
          ) : (
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto shadow-lg text-3xl text-white font-bold">
              🎒
            </div>
          )}

          <div className="space-y-1">
            <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {schoolInfo.schoolYear || '2026-2027'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cổng Tra Cứu Kết Quả Học Tập
            </h1>
            <p className="text-xs text-slate-500">
              Tra cứu phiếu báo điểm định kỳ và lời nhận xét của cô giáo dành riêng cho con.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleVerify} className="space-y-4 text-left text-xs">
          {/* Step 1: Select Class */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
              1. Chọn Lớp Học Của Con:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudentId('');
                setPinInput('');
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {schoolClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Lớp {cls.name} (Khối {cls.grade}) - GVCN: {cls.teacherName}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Student */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
              2. Chọn Họ Tên Học Sinh:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setPinInput('');
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Chọn tên con trong danh sách --</option>
              {classStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} (Mã: {st.studentCode})
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: PIN Input */}
          {currentStudent && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Nhập Mã PIN Xác Thực:</span>
                </label>
                {currentStudent.isActivated ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                    Đã đổi PIN riêng
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                    Mật khẩu mặc định
                  </span>
                )}
              </div>

              <input
                type="password"
                required
                maxLength={6}
                placeholder={
                  currentStudent.isActivated
                    ? 'Nhập mã PIN riêng của bố mẹ...'
                    : 'Nhập 4 số ngày sinh con (VD: 1508)...'
                }
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 font-mono text-center font-bold tracking-widest text-base focus:ring-2 focus:ring-blue-500 bg-white"
              />

              <p className="text-[11px] text-slate-500 leading-snug">
                {!currentStudent.isActivated ? (
                  <span>
                    💡 <strong>Lần đầu đăng nhập:</strong> Mật khẩu là <strong>4 số ngày tháng sinh của con</strong> (Ví dụ: con sinh ngày 15/08 thì nhập <strong>1508</strong>).
                  </span>
                ) : (
                  <span>
                    🔒 Nhập mã PIN riêng do bố mẹ đã thiết lập khi kích hoạt lần đầu.
                  </span>
                )}
              </p>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
              >
                <span>Xem Phiếu Báo Điểm & Nhận Xét Của Con</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium truncate max-w-[200px]" title={schoolInfo.address}>
            {schoolInfo.address || 'Hà Nội'}
          </span>
          <Link href="/login" className="font-bold text-blue-600 hover:underline shrink-0">
            Giáo viên đăng nhập →
          </Link>
        </div>
      </div>
    </div>
  );
}
