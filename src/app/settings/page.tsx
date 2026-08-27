'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { GradeLevel, UserRole } from '@/types';
import { TERMS, getCurrentTermByDate, getAcademicYearByDate } from '@/lib/tt27-engine';
import { toast } from 'sonner';

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
  const { user, profile, isAdmin } = useAuth();

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

  const handleReset = () => {
    if (confirm('CẢNH BÁO: Thao tác này sẽ xóa dữ liệu tùy chỉnh và khôi phục về trạng thái mẫu ban đầu. Bạn có chắc chắn không?')) {
      resetData();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-blue-600" />
            <span>Cài Đặt & Cấu Hình Hệ Thống</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông tin nhà trường, đồng bộ kỳ học theo thời gian thực, cấu hình lớp và AI.
          </p>
        </div>

        {/* Quick Sync Button */}
        <button
          onClick={handleSyncRealDate}
          className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-blue-200 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Đồng Bộ Lịch Thực Tế</span>
        </button>
      </div>

      {/* SECTION 1: THÔNG TIN TOÀN TRƯỜNG (SCHOOL PROFILE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Thông Tin Toàn Trường (School Profile)</span>
                {isAdmin ? (
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                    Toàn Quyền Admin
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                    Chỉ Xem
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thông tin này sẽ tự động xuất hiện trên tất cả bảng điểm TT27, học bạ, báo cáo xuất Excel và cổng bài tập.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSchool} className="p-5 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên Trường Tiểu Học
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Ví dụ: Trường Tiểu học Chu Văn An"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cơ Quan Quản Lý Cấp Trên (Phòng / Sở GD&ĐT)
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Ví dụ: Phòng GD&ĐT Quận Tây Hồ - TP. Hà Nội"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Năm Học Hiện Tại
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="Ví dụ: 2025-2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Họ Tên Hiệu Trưởng / Đại Diện BGH
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                placeholder="Ví dụ: Thầy Nguyễn Văn A"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Địa Chỉ Trường
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ví dụ: Số 260 Thụy Khuê, Tây Hồ, Hà Nội"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số Điện Thoại Liên Hệ
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 024 3847 2596"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu & Đồng Bộ Toàn Trường</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* SECTION 2: ĐỒNG BỘ THỜI GIAN & KỲ HỌC THÔNG TƯ 27 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Kỳ Đánh Giá & Đồng Bộ Thời Gian Thực
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tự động nhận diện học kỳ tương ứng theo lịch năm học của Bộ Giáo dục & Đào tạo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {TERMS.map((t) => {
            const isSelected = currentTerm === t.id;
            const isCalendarNow = autoCalendarTerm === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setCurrentTerm(t.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{t.name}</span>
                  {isCalendarNow && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white text-blue-700' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Hiện tại
                    </span>
                  )}
                </div>
                <p className={`text-[11px] mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {t.monthsDescription}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: CẤU HÌNH LỚP CHỦ NHIỆM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cấu Hình Lớp Chủ Nhiệm ({classInfo.name})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập thông tin tên lớp, khối lớp và kích thước sơ đồ chỗ ngồi.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveClass} className="p-5 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên Lớp Học
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Khối Lớp (Tiểu học)
              </label>
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Giáo Viên Chủ Nhiệm
              </label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sơ Đồ Chỗ Ngồi (Hàng x Cột)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={3}
                  max={8}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-bold text-slate-900"
                />
                <span className="text-slate-400 font-bold">x</span>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình Lớp</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: AI & GEMINI API KEY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Khóa API Trợ Lý Nhận Xét AI (Google Gemini)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống sử dụng Gemini Pro để sinh nhận xét học bạ Thông tư 27 chuẩn xác theo từng em.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Google Gemini API Key (Tùy chọn ghi đè)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                Lưu Khóa AI
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Mặc định hệ thống đã tích hợp sẵn khóa AI từ máy chủ Vercel.
            </p>
          </div>
        </form>
      </div>

      {/* SECTION 5: SAO LƯU & KHÔI PHỤC DỮ LIỆU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sao Lưu & Khôi Phục Dữ Liệu Lớp Học
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Xuất file JSON an toàn để lưu trữ vào máy tính hoặc khôi phục dữ liệu khi chuyển thiết bị.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất File Sao Lưu (.JSON)</span>
          </button>

          <label className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Khôi Phục Từ File JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackupFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-rose-200 transition-colors ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi Phục Mẫu Ban Đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
