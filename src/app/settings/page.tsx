'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Key,
  School,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Users,
  UserPlus,
  Trash2,
  Lock,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Clock,
  UserCircle,
  Camera,
  Image as ImageIcon,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { GradeLevel, UserRole } from '@/types';
import { TERMS, getCurrentTermByDate, getAcademicYearByDate } from '@/lib/tt27-engine';
import { toast } from 'sonner';

const AVATAR_PRESETS = [
  { id: 'av-1', label: 'Cô giáo thanh lịch', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-2', label: 'Cô giáo năng động', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-3', label: 'Cô giáo hiền hậu', url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-4', label: 'Cô giáo trẻ trung', url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-5', label: 'Thầy giáo mẫu mực', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-6', label: 'Thầy giáo nhiệt huyết', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

const DEPARTMENTS = [
  'Ban Giám Hiệu',
  'Tổ Khối 1',
  'Tổ Khối 2',
  'Tổ Khối 3',
  'Tổ Khối 4',
  'Tổ Khối 5',
  'Tổ Năng khiếu (Âm nhạc, Mỹ thuật, Thể dục, Tin học, Tiếng Anh)',
  'Tổ Văn phòng & Hành chính',
];

export default function SettingsPage() {
  const {
    schoolInfo,
    updateSchoolInfo,
    autoCalendarTerm,
    classInfo,
    setClassInfo,
    currentTerm,
    setCurrentTerm,
    apiKey,
    setApiKey,
    resetData,
    students,
    exportAllDataJSON,
    importAllDataJSON,
  } = useAppStore();
  const { user, profile, isAdmin, updateProfile, teachers } = useAuth();

  // User Profile Form State
  const [profileFullName, setProfileFullName] = useState(profile?.fullName || '');
  const [profileTitle, setProfileTitle] = useState(profile?.title || '');
  const [profileDepartment, setProfileDepartment] = useState(profile?.department || 'Tổ Khối 4');
  const [profilePhone, setProfilePhone] = useState(profile?.phone || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(profile?.avatarUrl || AVATAR_PRESETS[0].url);

  // Sync profile state when auth profile loads
  useEffect(() => {
    if (profile) {
      setProfileFullName(profile.fullName || '');
      setProfileTitle(profile.title || '');
      setProfileDepartment(profile.department || 'Tổ Khối 4');
      setProfilePhone(profile.phone || '');
      if (profile.avatarUrl) setProfileAvatarUrl(profile.avatarUrl);
    }
  }, [profile]);

  // School Form State
  const [schoolName, setSchoolName] = useState(schoolInfo.name);
  const [departmentName, setDepartmentName] = useState(schoolInfo.departmentName);
  const [schoolYear, setSchoolYear] = useState(schoolInfo.schoolYear);
  const [principalName, setPrincipalName] = useState(schoolInfo.principalName);
  const [address, setAddress] = useState(schoolInfo.address || '');
  const [phone, setPhone] = useState(schoolInfo.phone || '');

  // Class Form State
  const [className, setClassName] = useState(classInfo.name);
  const [grade, setGrade] = useState<GradeLevel>(classInfo.grade);
  const [teacherName, setTeacherName] = useState(classInfo.teacherName);
  const [rows, setRows] = useState(classInfo.seatingGridRows || 5);
  const [cols, setCols] = useState(classInfo.seatingGridCols || 8);
  const [inputApiKey, setInputApiKey] = useState(apiKey);

  // Save User Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      fullName: profileFullName.trim(),
      title: profileTitle.trim(),
      department: profileDepartment,
      phone: profilePhone.trim(),
      avatarUrl: profileAvatarUrl,
    });

    // If teacher is currently managing the active class, auto-update class teacherName
    if (profile?.assignedClassId === classInfo.id || profile?.assignedClassName === `Lớp ${classInfo.name}`) {
      setClassInfo({
        ...classInfo,
        teacherName: profileFullName.trim(),
      });
    }
  };

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền thay đổi thông tin toàn trường!');
      return;
    }
    updateSchoolInfo({
      name: schoolName,
      departmentName,
      schoolYear,
      principalName,
      address,
      phone,
    });
  };

  const handleSyncRealDate = () => {
    const realTerm = getCurrentTermByDate();
    const realYear = getAcademicYearByDate();
    setCurrentTerm(realTerm);
    if (isAdmin) {
      setSchoolYear(realYear);
      updateSchoolInfo({ schoolYear: realYear });
    }
    toast.success(`Đã đồng bộ về ${TERMS.find((t) => t.id === realTerm)?.name} (${realYear})!`);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassInfo({
      ...classInfo,
      name: className,
      grade,
      schoolYear: schoolInfo.schoolYear,
      schoolName: schoolInfo.name,
      teacherName,
      seatingGridRows: Number(rows),
      seatingGridCols: Number(cols),
    });
    toast.success(`Đã lưu cấu hình Lớp ${className}!`);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(inputApiKey);
    toast.success('Đã lưu khóa Gemini API!');
  };

  const handleExportBackup = () => {
    const jsonStr = exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GVCN_PRO_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Đã xuất file sao lưu toàn bộ hệ thống!');
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const res = importAllDataJSON(content);
      if (res.success) {
        toast.success('Khôi phục dữ liệu từ file sao lưu thành công! Đang tải lại trang...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(`Lỗi khi khôi phục dữ liệu: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefault = () => {
    if (
      confirm(
        'CẢNH BÁO: Thao tác này sẽ đặt lại toàn bộ dữ liệu (học sinh, điểm đánh giá, tích sao) về trạng thái mặc định ban đầu. Bạn có chắc chắn không?'
      )
    ) {
      resetData();
      toast.info('Đã đặt lại dữ liệu mặc định.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" />
          <span>Cài Đặt Hệ Thống & Hồ Sơ Người Dùng</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý thông tin hồ sơ cá nhân, chọn giáo viên chủ nhiệm, cấu hình trường học và sao lưu dữ liệu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. USER PROFILE CARD (NEW & PRIMARY) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <UserCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Hồ Sơ Của Tôi (Thông Tin Giáo Viên Đăng Nhập)</h2>
                <p className="text-xs text-slate-500">
                  Thông tin này sẽ được tự động tham chiếu trên Header, Lớp học và Báo cáo sổ chủ nhiệm.
                </p>
              </div>
            </div>

            <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
              {profile?.role === 'ADMIN_TEACHER'
                ? '👑 BGH kiêm GVCN'
                : profile?.role === 'ADMIN'
                ? '👑 Ban Giám Hiệu'
                : '👩‍🏫 Giáo Viên Chủ Nhiệm'}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Avatar Selector */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">Ảnh Đại Diện (Avatar)</label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <img
                    src={profileAvatarUrl}
                    alt="Avatar"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 shadow-xs">
                    <Camera className="w-3 h-3" />
                  </span>
                </div>

                <div className="flex-1 min-w-[240px] space-y-2">
                  <p className="text-[11px] text-slate-500">Chọn nhanh mẫu đại diện bên dưới hoặc dán link ảnh tùy chọn:</p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setProfileAvatarUrl(av.url)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          profileAvatarUrl === av.url ? 'border-blue-600 scale-105 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'
                        }`}
                        title={av.label}
                      >
                        <img src={av.url} alt={av.label} className="w-9 h-9 object-cover" />
                        {profileAvatarUrl === av.url && (
                          <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <input
                    type="url"
                    placeholder="Hoặc dán URL ảnh đại diện tùy thích..."
                    value={profileAvatarUrl}
                    onChange={(e) => setProfileAvatarUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và Tên Của Bạn (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cô Nguyễn Thị Mai"
                  value={profileFullName}
                  onChange={(e) => setProfileFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chức Danh / Vị Trí</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giáo viên Chủ nhiệm, Tổ trưởng..."
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                <input
                  type="text"
                  placeholder="0912 345 678"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tổ Chuyên Môn</label>
                <select
                  value={profileDepartment}
                  onChange={(e) => setProfileDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Tài Khoản (Cố định)</label>
                <input
                  type="text"
                  disabled
                  value={profile?.email || user?.email || ''}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Hồ Sơ Cá Nhân</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. CẤU HÌNH LỚP HỌC & CHỌN GIÁO VIÊN CHỦ NHIỆM */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Cấu Hình Lớp Học ({classInfo.name})</h2>
              <p className="text-xs text-slate-500">Thiết lập tên lớp, khối và chọn giáo viên chủ nhiệm.</p>
            </div>
          </div>

          <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Lớp (*)</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khối Lớp</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value={1}>Khối 1</option>
                  <option value={2}>Khối 2</option>
                  <option value={3}>Khối 3</option>
                  <option value={4}>Khối 4</option>
                  <option value={5}>Khối 5</option>
                </select>
              </div>
            </div>

            {/* TEACHER SELECTION DROPDOWN (REFER USER PROFILE) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Giáo Viên Chủ Nhiệm (*)</label>
                {profile && (
                  <button
                    type="button"
                    onClick={() => setTeacherName(profile.fullName)}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    ✨ Gán tôi ({profile.fullName})
                  </button>
                )}
              </div>

              <select
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Chọn Giáo viên Chủ nhiệm từ danh bạ --</option>
                {profile && (
                  <option value={profile.fullName}>
                    ✨ [Tôi] {profile.fullName} ({profile.title || 'GV'})
                  </option>
                )}
                {teachers
                  .filter((t) => t.fullName !== profile?.fullName)
                  .map((t) => (
                    <option key={t.id} value={t.fullName}>
                      {t.fullName} ({t.title || 'Giáo viên'} - {t.department || 'Tổ chuyên môn'})
                    </option>
                  ))}
              </select>

              <input
                type="text"
                placeholder="Hoặc tự nhập tên giáo viên nếu chưa có..."
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số hàng bàn ghế</label>
                <input
                  type="number"
                  min={3}
                  max={8}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số cột bàn ghế</label>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình Lớp</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. THÔNG TIN TRƯỜNG HỌC & ĐỒNG BỘ NĂM HỌC */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Thông Tin Toàn Trường & Năm Học</h2>
                <p className="text-xs text-slate-500">Thông tin xuất hiện trên mọi sổ sách TT27.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncRealDate}
              className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
              title="Tự động đồng bộ theo lịch thực tế"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đồng bộ ngày thực</span>
            </button>
          </div>

          <form onSubmit={handleSaveSchool} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Trường Học (*)</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cơ Quan Quản Lý</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Năm Học</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hiệu Trưởng</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại Trường</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 disabled:bg-slate-50 font-mono"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thông Tin Trường</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 4. GEMINI AI & SAO LƯU DỮ LIỆU */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 md:col-span-2">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Khóa Gemini AI & Sao Lưu Dữ Liệu</h2>
              <p className="text-xs text-slate-500">Cấu hình API Key và xuất/nhập file sao lưu toàn bộ hệ thống.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gemini API Key */}
            <form onSubmit={handleSaveApiKey} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gemini API Key (Tùy chọn)</label>
                <input
                  type="password"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nếu để trống, hệ thống sẽ sử dụng khóa tích hợp sẵn trên máy chủ.
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Khóa API</span>
              </button>
            </form>

            {/* Backup & Restore Buttons */}
            <div className="space-y-3 text-xs flex flex-col justify-between">
              <div className="space-y-2">
                <p className="font-semibold text-slate-700">Sao Lưu & Khôi Phục Toàn Diện:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-2 rounded-xl font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất File Sao Lưu JSON</span>
                  </button>

                  <label className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl font-bold transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Nhập File Khôi Phục</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackupFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Khôi phục cài đặt gốc:</span>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-rose-600 hover:text-rose-800 font-bold text-xs inline-flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại dữ liệu mẫu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
