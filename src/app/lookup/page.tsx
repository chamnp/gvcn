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
  Eye,
  EyeOff,
  ChevronDown,
  BookOpen,
  HeartHandshake,
  Check,
  GraduationCap,
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
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return schoolClasses[0]?.id || '';
  });

  // Sync selectedClassId if schoolClasses loads later
  React.useEffect(() => {
    if (!selectedClassId && schoolClasses.length > 0) {
      setSelectedClassId(schoolClasses[0].id);
    }
  }, [schoolClasses, selectedClassId]);

  const [studentIdentifierInput, setStudentIdentifierInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      (s) => s.classId === selectedClassId
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
      setTimeout(() => {
        router.push(`/student/${token}`);
      }, 400);
    } else {
      toast.error('Mã xác thực không chính xác! (Lần đầu đăng nhập là 4 số ngày tháng sinh của con, ví dụ: 15/08 thì nhập 1508).');
      setIsVerifying(false);
    }
  };

  const selectedClass = schoolClasses.find((c) => c.id === selectedClassId) || schoolClasses[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-900 flex flex-col justify-between p-3.5 sm:p-6 font-sans">
      {/* TOP HEADER BRANDING */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          {schoolInfo.logoUrl ? (
            <img
              src={schoolInfo.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-2xs bg-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              🏫
            </div>
          )}
          <span className="font-bold text-xs sm:text-sm text-slate-800 truncate max-w-[200px] sm:max-w-xs">
            {schoolInfo.name}
          </span>
        </div>

        {(() => {
          const selectedClassObj = schoolClasses.find((c) => c.id === selectedClassId);
          const targetToken = selectedClassObj?.shareToken || selectedClassId;
          return (
            <Link
              href={`/hw/${targetToken}`}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              Trang Lớp Học →
            </Link>
          );
        })()}
      </header>

      {/* MAIN LOOKUP CARD */}
      <main className="max-w-md w-full mx-auto my-auto py-4 space-y-4">
        {/* HERO BADGE & CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-blue-500/5 p-5 sm:p-7 space-y-5 text-center relative overflow-hidden">
          {/* Subtle decorative glow accent */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Title Area */}
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Cổng Tra Cứu Thông Tư 27</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tra Cứu Kết Quả Học Tập
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Nhập họ tên con và ngày sinh để xem phiếu báo điểm định kỳ, lời nhận xét của cô giáo và lịch học.
            </p>
          </div>

          {/* LOOKUP FORM */}
          <form onSubmit={handleVerify} className="space-y-4 text-left text-xs relative z-10">
            {/* Step 1: Select Class */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Chọn Lớp Học Của Con:</span>
              </label>
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full h-11 px-3.5 pr-9 rounded-2xl border border-slate-200 font-bold text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer text-xs"
                >
                  {schoolClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Lớp {cls.name} (Khối {cls.grade}) — GVCN: {cls.teacherName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Step 2: Student Full Name or Student Code */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Họ Và Tên Của Con:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nhập đầy đủ họ tên, ví dụ: Nguyễn Văn An"
                  value={studentIdentifierInput}
                  onChange={(e) => setStudentIdentifierInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 font-bold text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Step 3: PIN Input */}
            <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Mã Xác Thực (Ngày Sinh Hoặc Mã PIN):</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  required
                  maxLength={6}
                  placeholder="VD: 1508 (nếu con sinh ngày 15/08)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-12 px-3.5 pr-11 rounded-xl border border-slate-200 text-slate-900 font-mono text-center font-black tracking-widest text-base bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-xs placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPin ? 'Ẩn mã' : 'Xem mã'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-snug pt-1">
                💡 <strong>Lần đầu tra cứu:</strong> Nhập <strong>4 số ngày tháng sinh của con</strong> (Ví dụ: con sinh ngày 15/08 thì nhập <strong>1508</strong>).
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{isVerifying ? 'Đang xác thực bảo mật...' : 'Xem Phiếu Báo Điểm Của Con'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </form>
        </div>

        {/* FAQ & SECURITY ACCORDION */}
        <div className="bg-white/80 backdrop-blur-xs rounded-3xl border border-slate-200/80 p-4 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 font-bold mb-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Câu Hỏi Thường Gặp Của Phụ Huynh</span>
          </div>

          {[
            {
              q: 'Dữ liệu của con có bị người khác xem không?',
              a: 'Hệ thống bảo mật tuyệt đối. Mỗi học sinh có một mã định danh và mã PIN bí mật riêng. Người ngoài không thể xem trộm danh sách lớp hay bảng điểm của bạn khác.',
            },
            {
              q: 'Nếu tôi quên mã PIN thì phải làm thế nào?',
              a: 'Bố mẹ chỉ cần nhắn tin cho Giáo viên chủ nhiệm. Cô giáo có thể gửi lại liên kết hoặc khôi phục mã PIN về ngày sinh mặc định trong 1 giây.',
            },
          ].map((faq, idx) => (
            <div key={idx} className="border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between font-bold text-slate-800 text-left py-1 hover:text-blue-600 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1 pb-2">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-xl w-full mx-auto pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate max-w-[200px]" title={schoolInfo.address}>
          {schoolInfo.name}
        </span>
        <Link href="/login" className="font-bold text-slate-600 hover:text-blue-600 transition-colors">
          Giáo viên đăng nhập →
        </Link>
      </footer>
    </div>
  );
}
