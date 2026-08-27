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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { GradeLevel, UserRole } from '@/types';
import { toast } from 'sonner';

export default function SettingsPage() {
  const {
    classInfo,
    setClassInfo,
    apiKey,
    setApiKey,
    resetData,
    students,
    exportAllDataJSON,
    importAllDataJSON,
  } = useAppStore();
  const { user, profile, teachers, addTeacher, updateTeacher, deleteTeacher } = useAuth();

  const [className, setClassName] = useState(classInfo.name);
  const [grade, setGrade] = useState<GradeLevel>(classInfo.grade);
  const [schoolYear, setSchoolYear] = useState(classInfo.schoolYear);
  const [schoolName, setSchoolName] = useState(classInfo.schoolName);
  const [teacherName, setTeacherName] = useState(classInfo.teacherName);
  const [rows, setRows] = useState(classInfo.seatingGridRows || 5);
  const [cols, setCols] = useState(classInfo.seatingGridCols || 8);
  const [inputApiKey, setInputApiKey] = useState(apiKey);

  // New Teacher Modal Form State
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherRole, setNewTeacherRole] = useState<UserRole>('TEACHER');
  const [newTeacherClass, setNewTeacherClass] = useState('Lớp 4A1');

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
    toast.success(`Đã lưu cấu hình Lớp ${className}!`);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(inputApiKey);
    toast.success('Đã lưu khóa Gemini API!');
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile && profile.role !== 'ADMIN') {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền thêm và phân công giáo viên!');
      return;
    }
    if (!newTeacherEmail.trim() || !newTeacherName.trim()) {
      toast.error('Vui lòng điền đầy đủ email và họ tên');
      return;
    }

    await addTeacher(newTeacherEmail, newTeacherName, newTeacherRole, newTeacherClass);
    setIsAddTeacherOpen(false);
    setNewTeacherEmail('');
    setNewTeacherName('');
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" />
          <span>Cài Đặt & Cấu Hình Hệ Thống</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý thông tin lớp chủ nhiệm, phân quyền giáo viên, kết nối Supabase và khóa AI.
        </p>
      </div>

      {/* Section 1: Class Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <School className="w-5 h-5 text-blue-600" />
          <span>Cấu Hình Lớp Học Phụ Trách</span>
        </h2>

        <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Lớp Chủ Nhiệm</label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khối Lớp</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giáo Viên Chủ Nhiệm (Hiển thị trên Học bạ)</label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Hàng Ghế (Sơ đồ lớp)</label>
              <input
                type="number"
                min={3}
                max={10}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Cột Ghế (Sơ đồ lớp)</label>
              <input
                type="number"
                min={4}
                max={12}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

      {/* Section 2: Teacher Whitelist & RBAC Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Quản Lý Giáo Viên & Phân Quyền Lớp Học</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chỉ các tài khoản email được cấp quyền mới có thể truy cập và chỉnh sửa lớp học tương ứng.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddTeacherOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Giáo Viên Mới</span>
          </button>
        </div>

        {/* Current Active Account Status */}
        {user && (
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-blue-900">Tài khoản đang đăng nhập: </span>
              <strong className="text-blue-950">{user.email}</strong>
              <span className="ml-2 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                {profile?.role === 'ADMIN' ? 'Admin' : 'Giáo viên'}
              </span>
            </div>
            <span className="text-blue-800 font-semibold">{profile?.assignedClassName || 'Lớp 4A1'}</span>
          </div>
        )}

        {/* Teachers Whitelist Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Họ và Tên</th>
                <th className="py-2.5 px-3">Email Xác Thực</th>
                <th className="py-2.5 px-3 text-center">Vai Trò</th>
                <th className="py-2.5 px-3 text-center">Lớp Phân Công</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{t.fullName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{t.email}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {t.role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                    {t.assignedClassName || 'Lớp 4A1'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      <span>Được phép</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {t.email !== 'anhnnh4@gmail.com' && (
                      <button
                        onClick={() => {
                          if (profile && profile.role !== 'ADMIN') {
                            toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền xóa giáo viên!');
                            return;
                          }
                          deleteTeacher(t.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Xóa quyền"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Supabase Database Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" />
          <span>Cơ Sở Dữ Liệu Supabase PostgreSQL</span>
        </h2>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Supabase Project Ref:</span>
            <span className="font-mono font-bold text-slate-900">lgyoekaaefzpymfxfggf</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">API Endpoint:</span>
            <span className="font-mono text-slate-700">https://lgyoekaaefzpymfxfggf.supabase.co</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Trạng Thái Kết Nối:</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Đang hoạt động (8 Bảng đã sẵn sàng)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Section 4: Gemini AI Key */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-600" />
          <span>Khóa Gemini AI (Tùy chọn)</span>
        </h2>
        <p className="text-xs text-slate-500">
          Mặc định hệ thống sử dụng kho từ vựng sư phạm ngoại tuyến 200+ mẫu câu. Bạn có thể thêm Gemini API Key nếu muốn AI tạo nhận xét phong phú hơn.
        </p>

        <form onSubmit={handleSaveApiKey} className="space-y-3 text-xs">
          <div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={inputApiKey}
              onChange={(e) => setInputApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Lưu API Key</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 5: Backup & Reset */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Sao Lưu & Quản Lý Dữ Liệu Toàn Hệ Thống</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xuất file JSON sao lưu đầy đủ tất cả các lớp, học sinh, điểm số TT27, thời khóa biểu hoặc khôi phục dữ liệu khi đổi thiết bị.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportBackup}
            className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Sao Lưu Toàn Bộ Dữ Liệu (JSON)</span>
          </button>

          <label className="cursor-pointer inline-flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-blue-300 transition-colors">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Khôi Phục Từ File Sao Lưu</span>
            <input type="file" accept=".json" onChange={handleImportBackupFile} className="hidden" />
          </label>

          <button
            onClick={handleReset}
            className="inline-flex items-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-rose-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi Phục Dữ Liệu Mẫu Ban Đầu</span>
          </button>
        </div>
      </div>

      {/* Modal Add Teacher */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Thêm & Cấp Quyền Cho Giáo Viên</h3>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và Tên Giáo Viên</label>
                <input
                  type="text"
                  required
                  placeholder="Cô Trần Thu Hà"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Google / Đăng Nhập</label>
                <input
                  type="email"
                  required
                  placeholder="giaovien@gmail.com"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vai Trò</label>
                  <select
                    value={newTeacherRole}
                    onChange={(e) => setNewTeacherRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  >
                    <option value="TEACHER">Giáo Viên</option>
                    <option value="ADMIN">Quản Trị Viên (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp Phụ Trách</label>
                  <input
                    type="text"
                    required
                    placeholder="Lớp 4A1"
                    value={newTeacherClass}
                    onChange={(e) => setNewTeacherClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Cấp Quyền Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
