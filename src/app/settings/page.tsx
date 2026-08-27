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
  ArrowRight,
  GraduationCap,
  Layers,
  HelpCircle,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { GradeLevel, UserRole } from '@/types';
import { TERMS, getCurrentTermByDate, getAcademicYearByDate } from '@/lib/tt27-engine';
import { toast } from 'sonner';
import Link from 'next/link';

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

type SettingsTab = 'PROFILE' | 'CLASS' | 'SCHOOL' | 'DATA';

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

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-blue-600" />
            <span>Cài Đặt & Cấu Hình Hệ Thống</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông tin hồ sơ cá nhân, phân công giáo viên, dữ liệu trường học và sao lưu hệ thống.
          </p>
        </div>

        {/* Real-time Semester Badge */}
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-blue-900">
            {TERMS.find((t) => t.id === currentTerm)?.name} • {schoolInfo.schoolYear}
          </span>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PROFILE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCircle className="w-4 h-4" />
          <span>Hồ Sơ Của Tôi</span>
        </button>

        <button
          onClick={() => setActiveTab('CLASS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CLASS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Lớp Học & Phân Công</span>
        </button>

        <button
          onClick={() => setActiveTab('SCHOOL')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SCHOOL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Thông Tin Trường Học</span>
        </button>

        <button
          onClick={() => setActiveTab('DATA')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'DATA'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>AI & Sao Lưu Dữ Liệu</span>
        </button>
      </div>

      {/* TAB 1: USER PROFILE & DIGITAL TEACHER ID */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Edit Form (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Thông Tin Hồ Sơ Giáo Viên</h2>
                <p className="text-xs text-slate-500">
                  Cập nhật họ tên, ảnh đại diện, chức danh và thông tin liên lạc cá nhân.
                </p>
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
                <label className="block font-semibold text-slate-700">Chọn Ảnh Đại Diện (Avatar)</label>
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={profileAvatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 shadow-xs">
                      <Camera className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-[240px] space-y-2">
                    <p className="text-[11px] text-slate-500 font-medium">Chọn nhanh mẫu đại diện bên dưới hoặc dán link ảnh:</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Đăng Nhập (Cố định)</label>
                <input
                  type="text"
                  disabled
                  value={profile?.email || user?.email || ''}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi Hồ Sơ</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right: Live Digital Teacher Card Preview (1 Col) */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 space-y-4 relative overflow-hidden">
              {/* Decorative background circle */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                    Thẻ Giáo Viên Điện Tử
                  </span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Hoạt động
                </span>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <img
                  src={profileAvatarUrl}
                  alt={profileFullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0"
                />
                <div className="overflow-hidden">
                  <h3 className="font-black text-base truncate">{profileFullName || 'Giáo viên'}</h3>
                  <p className="text-xs text-blue-300 font-medium truncate">{profileTitle || 'Giáo viên Chủ nhiệm'}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{profileDepartment}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Trường:</span>
                  <strong className="text-white truncate max-w-[170px]">{schoolInfo.name}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Lớp phụ trách:</span>
                  <span className="bg-blue-600/80 text-white font-bold px-2 py-0.5 rounded-md text-[11px]">
                    Lớp {classInfo.name}
                  </span>
                </div>
                {profilePhone && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Số điện thoại:</span>
                    <strong className="font-mono text-white">{profilePhone}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200/80 text-xs text-blue-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Tự động đồng bộ toàn hệ thống:</span>
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Khi bạn thay đổi họ tên hoặc chức danh tại đây, thông tin sẽ được cập nhật đồng nhất trên Header, Danh bạ toàn trường, Sổ chủ nhiệm và Báo cáo TT27.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASS & TEACHER ASSIGNMENT */}
      {activeTab === 'CLASS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Cấu Hình Lớp Học ({classInfo.name})</h2>
                <p className="text-xs text-slate-500">
                  Thiết lập tên lớp, khối học, giáo viên chủ nhiệm và quy cách sơ đồ chỗ ngồi.
                </p>
              </div>
            </div>

            <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-3 py-1 rounded-full">
              Khối {classInfo.grade} • {students.length} Học sinh
            </span>
          </div>

          <form onSubmit={handleSaveClass} className="space-y-4 text-xs max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Lớp (*)</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: 4A1"
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
                <label className="font-semibold text-slate-700">Giáo Viên Chủ Nhiệm Phụ Trách (*)</label>
                {profile && (
                  <button
                    type="button"
                    onClick={() => setTeacherName(profile.fullName)}
                    className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gán tôi ({profile.fullName}) làm GVCN</span>
                  </button>
                )}
              </div>

              <select
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Chọn Giáo viên Chủ nhiệm từ danh bạ toàn trường --</option>
                {profile && (
                  <option value={profile.fullName}>
                    ✨ [Tôi] {profile.fullName} ({profile.title || 'GV'} - {profile.department || 'Tổ'})
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
                placeholder="Hoặc tự nhập tên giáo viên nếu chưa có trong danh sách..."
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số hàng bàn ghế (Sơ đồ lớp)</label>
                <input
                  type="number"
                  min={3}
                  max={8}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số cột bàn ghế (Sơ đồ lớp)</label>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình Lớp Học</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SCHOOL PROFILE & REAL CALENDAR SYNC */}
      {activeTab === 'SCHOOL' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Hồ Sơ Toàn Trường & Niên Khóa</h2>
                <p className="text-xs text-slate-500">
                  Thông tin này xuất hiện trên đầu trang mọi báo cáo, bảng điểm và học bạ TT27.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncRealDate}
              className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0"
              title="Tự động đồng bộ theo thời gian thực"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Đồng Bộ Lịch Thực Tế (2026-2027)</span>
            </button>
          </div>

          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Chế độ chỉ xem dành cho Giáo viên. Chỉ Ban Giám Hiệu (Admin) mới có quyền sửa đổi thông tin toàn trường.</span>
            </div>
          )}

          <form onSubmit={handleSaveSchool} className="space-y-4 text-xs max-w-3xl">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Trường Tiểu Học (*)</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cơ Quan Quản Lý Cấp Trên</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Niên Khóa / Năm Học</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 disabled:bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hiệu Trưởng / Đại Diện BGH</label>
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Trường Học</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 disabled:bg-slate-50"
              />
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Hồ Sơ Trường Học</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 4: GEMINI AI & BACKUP / RESTORE */}
      {activeTab === 'DATA' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Settings */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Trợ Lý Nhận Xét AI (Gemini)</h2>
                <p className="text-xs text-slate-500">Cấu hình khóa API phục vụ sinh lời nhận xét tự động.</p>
              </div>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gemini API Key (Tùy chọn)</label>
                <input
                  type="password"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Nếu để trống, hệ thống sẽ sử dụng khóa tích hợp sẵn trên máy chủ để phục vụ giáo viên.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Khóa API</span>
                </button>
              </div>
            </form>
          </div>

          {/* Backup & Restore */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Sao Lưu & Khôi Phục Dữ Liệu</h2>
                  <p className="text-xs text-slate-500">Xuất/nhập file sao lưu toàn diện cho toàn bộ lớp học.</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Tải về bản sao lưu toàn bộ danh sách học sinh, điểm đánh giá TT27, điểm danh và nề nếp tích sao để lưu trữ an toàn:
                </p>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất File JSON Toàn Lớp</span>
                  </button>

                  <label className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer">
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
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">Khôi phục trạng thái mẫu:</span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-rose-600 hover:text-rose-800 font-bold text-xs inline-flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại dữ liệu mẫu ban đầu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
