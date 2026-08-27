'use client';

import React, { useState } from 'react';
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

// Helper to normalize Vietnamese text for robust search matching
function normalizeText(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export default function StudentLookupPortal() {
  const router = useRouter();
  const { schoolClasses, allStudents, schoolInfo } = useAppStore();

  // Selected Class
  const [selectedClassId, setSelectedClassId] = useState<string>(
    schoolClasses[3]?.id || schoolClasses[0]?.id || 'class-4a1'
  );

  const [studentIdentifierInput, setStudentIdentifierInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Handle Verify & Navigate
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const query = studentIdentifierInput.trim();
    const pin = pinInput.trim();

    if (!query) {
      toast.error('Vui lòng nhập Họ và tên hoặc Mã học sinh của con!');
      return;
    }
    if (!pin) {
      toast.error('Vui lòng nhập Mã PIN hoặc 4 số ngày sinh của con!');
      return;
    }

    setIsVerifying(true);

    const normQuery = normalizeText(query);

    // Find student in selected class matching name or studentCode
    const classStudents = allStudents.filter(
      (s) => (s.classId || 'class-4a1') === selectedClassId
    );

    const matchedStudent = classStudents.find((s) => {
      const normName = normalizeText(s.fullName);
      const normCode = normalizeText(s.studentCode);
      return normName === normQuery || normCode === normQuery || normName.includes(normQuery);
    });

    if (!matchedStudent) {
      toast.error('Không tìm thấy học sinh trong lớp này. Quý phụ huynh vui lòng kiểm tra lại Họ tên hoặc Mã học sinh.');
      setIsVerifying(false);
      return;
    }

    const defaultPin = getDefaultPinForStudent(matchedStudent);
    const isDefaultMatch = pin === defaultPin;
    const isCustomMatch = matchedStudent.customPin && pin === matchedStudent.customPin;

    if (isDefaultMatch || isCustomMatch) {
      toast.success(`Xác thực thành công! Đang mở phiếu báo điểm em ${matchedStudent.fullName}...`);
      const token = matchedStudent.shareToken || matchedStudent.id;
      router.push(`/student/${token}`);
    } else {
      toast.error('Mã xác thực không chính xác! (Lần đầu đăng nhập là 4 số ngày tháng sinh của con, ví dụ: 15/08 thì nhập 1508).');
      setIsVerifying(false);
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
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-blue-500 shadow-lg shadow-blue-500/20 mx-auto bg-white"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto shadow-lg text-3xl text-white font-bold">
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
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {schoolClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Lớp {cls.name} (Khối {cls.grade}) - GVCN: {cls.teacherName}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Student Name or Code */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
              2. Họ Và Tên Của Con (Hoặc Mã Học Sinh):
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn An"
                value={studentIdentifierInput}
                onChange={(e) => setStudentIdentifierInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white text-xs"
              />
            </div>
          </div>

          {/* Step 3: PIN Input */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Mã Xác Thực (Ngày Sinh Hoặc Mã PIN Riêng):</span>
            </label>

            <input
              type="password"
              required
              maxLength={6}
              placeholder="VD: 1508 (nếu con sinh ngày 15/08)..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 font-mono text-center font-bold tracking-widest text-base focus:ring-2 focus:ring-blue-500 bg-white"
            />

            <p className="text-[11px] text-slate-500 leading-snug">
              💡 <strong>Lần đầu tra cứu:</strong> Mật khẩu là <strong>4 số ngày tháng sinh của con</strong> (Ví dụ: con sinh ngày 15/08 thì nhập <strong>1508</strong>).
            </p>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
            >
              <span>{isVerifying ? 'Đang xác thực...' : 'Xem Phiếu Báo Điểm Của Con'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
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
