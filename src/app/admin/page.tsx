'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  School,
  Users,
  UserPlus,
  ArrowRight,
  Sparkles,
  Award,
  CheckCircle2,
  CalendarCheck,
  Edit2,
  Trash2,
  Plus,
  Lock,
  Eye,
  LogOut,
  Upload,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { ClassInfo, GradeLevel, UserRole } from '@/types';
import { parseTeacherExcelFile } from '@/lib/excel-import';
import { downloadTeacherTemplate, exportTeacherList } from '@/lib/excel-export';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminPortalPage() {
  const router = useRouter();
  const { schoolClasses, activeClassId, switchClass, addClass, updateClass, deleteClass, allStudents } = useAppStore();
  const { user, profile, teachers, addTeacher, updateTeacher, deleteTeacher } = useAuth();

  // Modal State for Class
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [classForm, setClassForm] = useState<{
    name: string;
    grade: GradeLevel;
    schoolYear: string;
    schoolName: string;
    teacherName: string;
    seatingGridRows: number;
    seatingGridCols: number;
  }>({
    name: '',
    grade: 1,
    schoolYear: '2025-2026',
    schoolName: 'Trường Tiểu học Chu Văn An',
    teacherName: '',
    seatingGridRows: 5,
    seatingGridCols: 8,
  });

  // Modal State for Teacher
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherFullName, setTeacherFullName] = useState('');
  const [teacherRole, setTeacherRole] = useState<UserRole>('TEACHER');
  const [teacherAssignedClass, setTeacherAssignedClass] = useState('1A1');

  // Tổng hợp dữ liệu toàn trường
  const totalClasses = schoolClasses.length;
  const totalEstimatedStudents = allStudents.length;
  const totalTeachers = teachers.length;

  const isAdmin = !profile || profile.role === 'ADMIN';

  // Xử lý tạo / sửa lớp
  const handleOpenClassModal = (cls?: ClassInfo) => {
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền thêm hoặc sửa cấu hình lớp!');
      return;
    }
    if (cls) {
      setEditingClass(cls);
      setClassForm({
        name: cls.name,
        grade: cls.grade,
        schoolYear: cls.schoolYear,
        schoolName: cls.schoolName,
        teacherName: cls.teacherName,
        seatingGridRows: cls.seatingGridRows,
        seatingGridCols: cls.seatingGridCols,
      });
    } else {
      setEditingClass(null);
      setClassForm({
        name: `${schoolClasses.length + 1}A1`,
        grade: Math.min(5, Math.max(1, schoolClasses.length + 1)) as GradeLevel,
        schoolYear: '2025-2026',
        schoolName: 'Trường Tiểu học Chu Văn An',
        teacherName: 'Giáo viên mới',
        seatingGridRows: 5,
        seatingGridCols: 8,
      });
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền lưu cấu hình lớp!');
      return;
    }
    if (editingClass) {
      updateClass({
        ...editingClass,
        ...classForm,
        totalStudents: editingClass.totalStudents || 30,
      });
      toast.success(`Đã cập nhật cấu hình Lớp ${classForm.name}!`);
    } else {
      addClass({
        ...classForm,
        totalStudents: 30,
      });
      toast.success(`Đã tạo mới Lớp ${classForm.name}!`);
    }
    setIsClassModalOpen(false);
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền xóa lớp học!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa Lớp "${name}" khỏi trường không?`)) {
      deleteClass(id);
      toast.success(`Đã xóa Lớp ${name}`);
    }
  };

  // Chuyển sang xem lớp và điều hướng đến Dashboard
  const handleJumpToClass = (classId: string, className: string) => {
    switchClass(classId);
    toast.success(`Đã chuyển quyền xem sang Lớp ${className}!`);
    router.push('/');
  };

  // Thêm giáo viên
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền phân công giáo viên mới!');
      return;
    }
    if (!teacherEmail.trim() || !teacherFullName.trim()) {
      toast.error('Vui lòng điền đủ email và họ tên giáo viên');
      return;
    }

    await addTeacher(teacherEmail, teacherFullName, teacherRole, `Lớp ${teacherAssignedClass}`);
    setIsTeacherModalOpen(false);
    setTeacherEmail('');
    setTeacherFullName('');
  };

  // Nhập danh sách giáo viên từ Excel
  const handleTeacherExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      toast.error('Chỉ Ban Giám Hiệu mới có quyền nhập danh sách giáo viên!');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedTeachers = await parseTeacherExcelFile(file);
      if (parsedTeachers.length === 0) {
        toast.error('Không tìm thấy danh sách giáo viên hợp lệ trong file');
        return;
      }

      for (const t of parsedTeachers) {
        await addTeacher(t.email, t.fullName, t.role, t.assignedClassName);
      }
      toast.success(`Đã nhập thành công ${parsedTeachers.length} giáo viên từ file Excel!`);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi đọc file Excel giáo viên. Vui lòng kiểm tra định dạng.');
    }
  };

  // Thay đổi phân công lớp của giáo viên
  const handleReassignTeacher = async (teacherId: string, newClassName: string) => {
    if (profile && profile.role !== 'ADMIN') {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền thay đổi phân công giáo viên!');
      return;
    }
    await updateTeacher(teacherId, { assignedClassName: newClassName });
    toast.success(`Đã chuyển phân công giáo viên sang ${newClassName}`);
  };

  return (
    <div className="space-y-6">
      {/* Role Warning for Non-Admin */}
      {!isAdmin && profile?.role === 'TEACHER' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Chế độ Chỉ Xem dành cho Giáo Viên</p>
              <p className="text-[11px] text-amber-700">
                Bạn đang đăng nhập với vai trò <strong>{profile.fullName}</strong> ({profile.assignedClassName || 'GVCN'}). Chỉ Ban Giám Hiệu mới có quyền thêm/xóa lớp và phân công giáo viên.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
          >
            Quay Về Lớp Của Tôi
          </Link>
        </div>
      )}

      {!isAdmin && profile?.role === 'PENDING' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Tài Khoản Đang Chờ Phê Duyệt</p>
              <p className="text-[11px] text-rose-700">
                Tài khoản <strong>{profile.email}</strong> chưa được phân công lớp. Vui lòng liên hệ Ban Giám Hiệu để được cấp quyền.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
          >
            Đăng Nhập Tài Khoản Khác
          </Link>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/30 text-indigo-200 px-3 py-0.5 rounded-full text-xs font-bold border border-indigo-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>CỔNG QUẢN TRỊ TRƯỜNG TIỂU HỌC (ADMIN PORTAL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Quản Trị Trường Chu Văn An
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Tài khoản quản lý: <strong>{user?.email || 'anhnnh4@gmail.com'}</strong> • Phân bổ {totalClasses} lớp học & {totalTeachers} giáo viên
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                if (!isAdmin) {
                  toast.error('Bạn cần quyền Ban Giám Hiệu để thêm lớp học mới!');
                  return;
                }
                handleOpenClassModal();
              }}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Lớp Học Mới</span>
            </button>
            <button
              onClick={() => {
                if (!isAdmin) {
                  toast.error('Bạn cần quyền Ban Giám Hiệu để phân công giáo viên!');
                  return;
                }
                setIsTeacherModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Phân Công Giáo Viên</span>
            </button>
          </div>
        </div>
      </div>

      {/* School Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Số Lớp</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalClasses} <span className="text-xs font-normal text-slate-500">lớp</span></h3>
            <p className="text-xs text-blue-600 font-semibold mt-1">Từ Khối 1 đến Khối 5</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <School className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Học Sinh Toàn Trường</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{totalEstimatedStudents} <span className="text-xs font-normal text-slate-500">em</span></h3>
            <p className="text-xs text-slate-500 mt-1">Trung bình 31 em/lớp</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Giáo Viên Chủ Nhiệm</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{totalTeachers} <span className="text-xs font-normal text-slate-500">thầy cô</span></h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1">100% đã cấp tài khoản</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tiêu Chuẩn Đánh Giá</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">TT 27</h3>
            <p className="text-xs text-slate-500 mt-1">GDPT Tiểu học 2018</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Section 1: School Classes Roster & Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              <span>Danh Sách Lớp Học Trong Trường</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin có thể bấm "Vào kiểm tra lớp" để xem trực tiếp hồ sơ học sinh, điểm danh, và đánh giá của từng lớp.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tên Lớp</th>
                <th className="py-3 px-4 text-center">Khối Lớp</th>
                <th className="py-3 px-4">Giáo Viên Chủ Nhiệm</th>
                <th className="py-3 px-4 text-center">Sĩ Số</th>
                <th className="py-3 px-4 text-center">Sơ Đồ Chỗ Ngồi</th>
                <th className="py-3 px-4 text-center">Trạng Thái Đang Xem</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schoolClasses.map((cls) => {
                const isCurrentActive = cls.id === activeClassId;
                return (
                  <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          {cls.name}
                        </span>
                        <span>Lớp {cls.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      Khối {cls.grade}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {cls.teacherName}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {allStudents.filter((s) => (s.classId || 'class-4a1') === cls.id).length} HS
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-mono">
                      {cls.seatingGridRows} hàng x {cls.seatingGridCols} cột
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isCurrentActive ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đang chọn</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleJumpToClass(cls.id, cls.name)}
                        className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Vào lớp</span>
                      </button>
                      <button
                        onClick={() => handleOpenClassModal(cls)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Sửa cấu hình lớp"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {schoolClasses.length > 1 && (
                        <button
                          onClick={() => handleDeleteClass(cls.id, cls.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa lớp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Teacher Assignment Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Phân Công Giáo Viên Chủ Nhiệm (Teacher Assignment Matrix)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Khi giáo viên đăng nhập bằng Google hoặc Email, hệ thống sẽ tự động gán vào lớp tương ứng bên dưới.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Template Button */}
            <button
              onClick={() => {
                downloadTeacherTemplate();
                toast.success('Đã tải xuống file Excel mẫu phân công giáo viên!');
              }}
              className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-300 transition-colors"
              title="Tải mẫu Excel chuẩn"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Tải File Mẫu</span>
            </button>

            {/* Import Teachers Button */}
            <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 transition-colors">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Nhập Excel</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleTeacherExcelUpload} className="hidden" />
            </label>

            {/* Export Teachers Button */}
            <button
              onClick={() => {
                exportTeacherList(teachers);
                toast.success('Đã xuất danh sách giáo viên ra Excel!');
              }}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Xuất Excel</span>
            </button>

            {/* Add Teacher Button */}
            <button
              onClick={() => {
                if (!isAdmin) {
                  toast.error('Bạn cần quyền Ban Giám Hiệu để thêm giáo viên!');
                  return;
                }
                setIsTeacherModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Giáo Viên</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Họ và Tên Giáo Viên</th>
                <th className="py-3 px-4">Email Đăng Nhập (Google / Password)</th>
                <th className="py-3 px-4 text-center">Vai Trò</th>
                <th className="py-3 px-4 text-center w-48">Lớp Phân Công Phụ Trách</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{t.fullName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{t.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {t.role === 'ADMIN' ? 'Quản Trị Viên (Admin)' : 'Giáo Viên'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {t.role === 'ADMIN' ? (
                      <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        Toàn bộ trường
                      </span>
                    ) : (
                      <select
                        value={t.assignedClassName?.replace('Lớp ', '') || '4A1'}
                        onChange={(e) => handleReassignTeacher(t.id, `Lớp ${e.target.value}`)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {schoolClasses.map((c) => (
                          <option key={c.id} value={c.name}>
                            Lớp {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Hoạt động</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {t.email !== 'anhnnh4@gmail.com' && (
                      <button
                        onClick={() => deleteTeacher(t.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa quyền giáo viên"
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

      {/* Modal Add/Edit Class */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingClass ? `Chỉnh Sửa Lớp ${editingClass.name}` : 'Thêm Lớp Học Mới Vào Trường'}
            </h3>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Lớp</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 4A2"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối Lớp</label>
                  <select
                    value={classForm.grade}
                    onChange={(e) => setClassForm({ ...classForm, grade: Number(e.target.value) as GradeLevel })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={1}>Khối 1</option>
                    <option value={2}>Khối 2</option>
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giáo Viên Chủ Nhiệm</label>
                <input
                  type="text"
                  required
                  placeholder="Cô Trần Thu Hà"
                  value={classForm.teacherName}
                  onChange={(e) => setClassForm({ ...classForm, teacherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Hàng Ghế (Sơ đồ)</label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={classForm.seatingGridRows}
                    onChange={(e) => setClassForm({ ...classForm, seatingGridRows: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Cột Ghế (Sơ đồ)</label>
                  <input
                    type="number"
                    min={4}
                    max={12}
                    value={classForm.seatingGridCols}
                    onChange={(e) => setClassForm({ ...classForm, seatingGridCols: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  {editingClass ? 'Lưu Thay Đổi' : 'Tạo Lớp Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Teacher */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Thêm & Phân Công Giáo Viên Mới</h3>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và Tên Giáo Viên</label>
                <input
                  type="text"
                  required
                  placeholder="Cô Lê Thị Mai"
                  value={teacherFullName}
                  onChange={(e) => setTeacherFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Google / Đăng Nhập</label>
                <input
                  type="email"
                  required
                  placeholder="giaovien@gmail.com"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vai Trò</label>
                  <select
                    value={teacherRole}
                    onChange={(e) => setTeacherRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  >
                    <option value="TEACHER">Giáo Viên</option>
                    <option value="ADMIN">Quản Trị Viên (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân Công Lớp</label>
                  <select
                    value={teacherAssignedClass}
                    onChange={(e) => setTeacherAssignedClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  >
                    {schoolClasses.map((c) => (
                      <option key={c.id} value={c.name}>
                        Lớp {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Cấp Quyền & Phân Công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
