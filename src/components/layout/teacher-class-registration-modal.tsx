'use client';

import React, { useState, useEffect } from 'react';
import { School, Sparkles, Building, MapPin, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { GradeLevel } from '@/types';
import { getAcademicYearByDate } from '@/lib/tt27-engine';
import { toast } from 'sonner';

export const TeacherClassRegistrationModal: React.FC = () => {
  const { schoolClasses, addClass, isLoaded } = useAppStore();
  const { user, profile, isAdmin, isAuthorized, loading: authLoading } = useAuth();

  const [schoolName, setSchoolName] = useState(profile?.schoolName || '');
  const [province, setProvince] = useState(profile?.province || 'Hà Nội');
  const [district, setDistrict] = useState(profile?.district || '');
  const [grade, setGrade] = useState<GradeLevel>((profile?.mainGrade as GradeLevel) || 1);
  const [className, setClassName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync default values when profile finishes loading
  useEffect(() => {
    if (profile) {
      if (profile.schoolName && !schoolName) setSchoolName(profile.schoolName);
      if (profile.province) setProvince(profile.province);
      if (profile.district && !district) setDistrict(profile.district);
      if (profile.mainGrade) setGrade(profile.mainGrade as GradeLevel);
    }
  }, [profile]);

  // Conditions to show:
  // 1. Auth and store MUST be completely finished loading (prevent flash during load)
  // 2. User is authenticated and authorized
  // 3. User is NOT Admin (Admin manages the platform, doesn't need mandatory homeroom class)
  // 4. User has NO assignedClassId in their profile (already registered)
  // 5. User has 0 classes in store
  const shouldShow =
    !authLoading &&
    isLoaded &&
    isAuthorized &&
    user !== null &&
    !isAdmin &&
    !profile?.assignedClassId &&
    schoolClasses.length === 0;

  if (!shouldShow) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedClass = className.trim();
    const trimmedSchool = schoolName.trim();

    if (!trimmedSchool) {
      toast.error('Vui lòng nhập tên Trường Tiểu Học của Thầy/Cô!');
      return;
    }

    if (!trimmedClass) {
      toast.error('Vui lòng nhập tên lớp chủ nhiệm (ví dụ: 4A1, 1A...)!');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addClass({
        name: trimmedClass,
        grade,
        schoolName: trimmedSchool,
        province: province.trim(),
        district: district.trim(),
        schoolYear: getAcademicYearByDate(),
        teacherName: profile?.fullName || user?.user_metadata?.full_name || 'Giáo viên',
        teacherEmail: (user?.email || profile?.email || '').toLowerCase().trim(),
        totalStudents: 0,
        seatingGridRows: 5,
        seatingGridCols: 8,
      });

      if (result && !result.success) {
        // Error toast already displayed inside addClass
        setIsSubmitting(false);
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi tạo lớp. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
            <School className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>GVCN PRO • Khai Báo Đầu Năm Học</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Khai Báo Lớp Chủ Nhiệm
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Chào mừng Thầy/Cô <strong>{profile?.fullName || user?.email}</strong>! Vui lòng khai báo thông tin lớp chủ nhiệm của mình để bắt đầu quản lý học sinh và đánh giá theo Thông tư 27.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* School Name */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Tên Trường Tiểu Học Công Tác (*)
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Ví dụ: Trường Tiểu học Chu Văn An"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Thông tin trường sẽ xuất hiện trên tiêu đề bảng tổng hợp và học bạ.
            </p>
          </div>

          {/* Province & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tỉnh / Thành Phố (*)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Hà Nội, TP.HCM..."
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Quận / Huyện</label>
              <input
                type="text"
                placeholder="Ví dụ: Quận Cầu Giấy"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Grade & Class Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khối Lớp (*)</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Tên Lớp Chủ Nhiệm (*)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 4A1, 1A, 5B..."
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 font-black text-blue-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Alert: 1 Teacher = 1 Class & Duplicate Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start space-x-2.5 text-amber-900 text-[11px] leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Quy định quản lý chủ nhiệm:</p>
              <p className="text-amber-800">
                Mỗi giáo viên chỉ quản lý chủ nhiệm <strong>1 lớp duy nhất</strong>. Nếu tên lớp tại trường của Thầy/Cô đã được giáo viên khác đăng ký, hệ thống sẽ báo lỗi để tránh trùng lặp dữ liệu học sinh.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang kiểm tra & đăng ký...</span>
              </span>
            ) : (
              <>
                <span>Xác Nhận & Bắt Đầu Quản Lý Lớp</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
