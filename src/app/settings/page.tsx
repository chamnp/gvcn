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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { GradeLevel } from '@/types';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { classInfo, setClassInfo, apiKey, setApiKey, resetData, students } = useAppStore();

  const [className, setClassName] = useState(classInfo.name);
  const [grade, setGrade] = useState<GradeLevel>(classInfo.grade);
  const [schoolYear, setSchoolYear] = useState(classInfo.schoolYear);
  const [schoolName, setSchoolName] = useState(classInfo.schoolName);
  const [teacherName, setTeacherName] = useState(classInfo.teacherName);
  const [rows, setRows] = useState(classInfo.seatingGridRows || 5);
  const [cols, setCols] = useState(classInfo.seatingGridCols || 8);
  const [inputApiKey, setInputApiKey] = useState(apiKey);

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassInfo({
      ...classInfo,
      name: className,
      grade,
      schoolYear,
      schoolName,
      teacherName,
      seatingGridRows: Number(rows),
      seatingGridCols: Number(cols),
    });
    toast.success('Đã lưu thông tin lớp học!');
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(inputApiKey);
    toast.success('Đã lưu khóa Gemini API!');
  };

  const handleExportBackup = () => {
    const data = {
      classInfo,
      students,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GVCN_Backup_${classInfo.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Đã xuất file sao lưu dữ liệu lớp!');
  };

  const handleReset = () => {
    if (confirm('CẢNH BÁO: Thao tác này sẽ xóa dữ liệu tùy chỉnh và khôi phục về trạng thái mẫu ban đầu. Bạn có chắc chắn không?')) {
      resetData();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" />
          <span>Cài Đặt & Cấu Hình Hệ Thống</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý thông tin lớp chủ nhiệm, kết nối Supabase, khóa AI và sao lưu dữ liệu.
        </p>
      </div>

      {/* Section 1: Class Information */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <School className="w-5 h-5 text-blue-600" />
          <span>Thông Tin Lớp Chủ Nhiệm</span>
        </h2>

        <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Lớp</label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khối Lớp</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              >
                <option value={1}>Khối 1</option>
                <option value={2}>Khối 2</option>
                <option value={3}>Khối 3</option>
                <option value={4}>Khối 4</option>
                <option value={5}>Khối 5</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Năm Học</label>
              <input
                type="text"
                required
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Trường Tiểu Học</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ Tên Giáo Viên Chủ Nhiệm</label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Hàng Bàn Sơ Đồ Lớp</label>
              <input
                type="number"
                min="3"
                max="10"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Cột Bàn Sơ Đồ Lớp</label>
              <input
                type="number"
                min="4"
                max="12"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thông Tin Lớp</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Supabase Database Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Cơ Sở Dữ Liệu Supabase (PostgreSQL)</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Đã Cấu Hình</span>
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
          <p className="text-slate-600">
            <strong>Project URL:</strong> https://lgyoekaaefzpymfxfggf.supabase.co
          </p>
          <p className="text-slate-600 truncate">
            <strong>Database Host:</strong> db.lgyoekaaefzpymfxfggf.supabase.co:5432
          </p>
          <p className="text-slate-500 font-sans pt-1">
            File khởi tạo bảng <code>prisma/init.sql</code> đã sẵn sàng để bạn chạy trực tiếp trên Supabase SQL Editor.
          </p>
        </div>
      </div>

      {/* Section 3: Gemini AI API Key */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-600" />
          <span>Khóa Google Gemini AI</span>
        </h2>

        <form onSubmit={handleSaveApiKey} className="space-y-3 text-xs">
          <p className="text-slate-500 leading-relaxed">
            Hệ thống tích hợp sẵn <strong>Ngân hàng Sư phạm Thông minh Offline</strong> (hoạt động 100% không cần mạng). Bạn có thể cấu hình thêm Gemini API Key để sinh nhận xét nâng cao cá nhân hóa từng học sinh.
          </p>

          <div className="flex space-x-2">
            <input
              type="password"
              placeholder="Nhập Gemini API Key của bạn (AIzaSy...)"
              value={inputApiKey}
              onChange={(e) => setInputApiKey(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              Lưu Key
            </button>
          </div>
        </form>
      </div>

      {/* Section 4: Backup & Reset */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <span>Sao Lưu & Quản Trị Dữ Liệu</span>
        </h2>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportBackup}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Tải Bản Sao Lưu JSON</span>
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold border border-rose-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi Phục Dữ Liệu Mẫu Ban Đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
