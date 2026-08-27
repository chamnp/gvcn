'use client';

import React, { useState, useMemo } from 'react';
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
  Building,
  Save,
  Search,
  Filter,
  Phone,
  Mail,
  Briefcase,
  Layers,
  CheckCircle,
  XCircle,
  Crown,
  UserCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { ClassInfo, GradeLevel, UserRole, TeacherProfile } from '@/types';
import { parseTeacherExcelFile } from '@/lib/excel-import';
import { downloadTeacherTemplate, exportTeacherList } from '@/lib/excel-export';
import { toast } from 'sonner';
import Link from 'next/link';

const DEPARTMENTS = [
  'Tất cả các tổ',
  'Ban Giám Hiệu',
  'Tổ Khối 1',
  'Tổ Khối 2',
  'Tổ Khối 3',
  'Tổ Khối 4',
  'Tổ Khối 5',
  'Tổ Năng khiếu & Bộ môn',
  'Tổ Văn phòng & Bán trú',
];

export default function AdminPortalPage() {
  const router = useRouter();
  const {
    schoolInfo,
    updateSchoolInfo,
    schoolClasses,
    activeClassId,
    switchClass,
    addClass,
    updateClass,
    deleteClass,
    allStudents,
  } = useAppStore();
  const { user, profile, isAdmin, teachers, refreshTeachers, addTeacher, updateTeacher, deleteTeacher } = useAuth();

  // Load latest teacher requests on mount
  React.useEffect(() => {
    refreshTeachers();
  }, [refreshTeachers]);

  // Modal State for School Profile
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    name: schoolInfo.name,
    departmentName: schoolInfo.departmentName,
    schoolYear: schoolInfo.schoolYear,
    principalName: schoolInfo.principalName,
    address: schoolInfo.address || '',
    phone: schoolInfo.phone || '',
  });

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
    schoolYear: schoolInfo.schoolYear,
    schoolName: schoolInfo.name,
    teacherName: '',
    seatingGridRows: 5,
    seatingGridCols: 8,
  });

  // Teacher / Staff Search & Filters
  const [searchStaffQuery, setSearchStaffQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('Tất cả các tổ');
  const [filterRole, setFilterRole] = useState('ALL');

  // Modal State for Teacher / Staff Role Editing
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [teacherForm, setTeacherForm] = useState<{
    email: string;
    fullName: string;
    role: UserRole;
    title: string;
    department: string;
    assignedClassName: string;
    phone: string;
    isActive: boolean;
  }>({
    email: '',
    fullName: '',
    role: 'TEACHER',
    title: 'Giáo viên Chủ nhiệm',
    department: 'Tổ Khối 4',
    assignedClassName: 'Lớp 4A1',
    phone: '',
    isActive: true,
  });

  // Metrics
  const totalClasses = schoolClasses.length;
  const totalEstimatedStudents = allStudents.length;
  const totalTeachers = teachers.length;
  const totalAdmins = teachers.filter((t) => t.role === 'ADMIN' || t.role === 'ADMIN_TEACHER').length;
  const totalPending = teachers.filter((t) => t.role === 'PENDING' || !t.isActive).length;

  // Filtered staff list
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        t.fullName.toLowerCase().includes(searchStaffQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchStaffQuery.toLowerCase()) ||
        (t.title || '').toLowerCase().includes(searchStaffQuery.toLowerCase()) ||
        (t.phone || '').includes(searchStaffQuery);

      const matchDept =
        filterDepartment === 'Tất cả các tổ' || t.department === filterDepartment;

      const matchRole =
        filterRole === 'ALL' ||
        (filterRole === 'ADMIN' && t.role === 'ADMIN') ||
        (filterRole === 'ADMIN_TEACHER' && t.role === 'ADMIN_TEACHER') ||
        (filterRole === 'TEACHER' && t.role === 'TEACHER') ||
        (filterRole === 'PENDING' && (t.role === 'PENDING' || !t.isActive));

      return matchSearch && matchDept && matchRole;
    });
  }, [teachers, searchStaffQuery, filterDepartment, filterRole]);

  // Class Handlers
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
        schoolYear: schoolInfo.schoolYear,
        schoolName: schoolInfo.name,
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

  const handleJumpToClass = (classId: string, className: string) => {
    switchClass(classId);
    toast.success(`Đã chuyển quyền xem sang Lớp ${className}!`);
    router.push('/');
  };

  // Staff / Teacher Handlers
  const handleOpenTeacherModal = (t?: TeacherProfile) => {
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền thêm/sửa cán bộ giáo viên!');
      return;
    }
    if (t) {
      setEditingTeacher(t);
      setTeacherForm({
        email: t.email,
        fullName: t.fullName,
        role: t.role,
        title: t.title || (t.role === 'ADMIN' ? 'Ban Giám Hiệu' : t.role === 'ADMIN_TEACHER' ? 'BGH kiêm GVCN' : 'Giáo viên Chủ nhiệm'),
        department: t.department || (t.role === 'ADMIN' ? 'Ban Giám Hiệu' : 'Tổ Khối 4'),
        assignedClassName: t.assignedClassName || (schoolClasses[0] ? `Lớp ${schoolClasses[0].name}` : 'Lớp 4A1'),
        phone: t.phone || '',
        isActive: t.isActive,
      });
    } else {
      setEditingTeacher(null);
      setTeacherForm({
        email: '',
        fullName: '',
        role: 'TEACHER',
        title: 'Giáo viên Chủ nhiệm',
        department: 'Tổ Khối 4',
        assignedClassName: schoolClasses[0] ? `Lớp ${schoolClasses[0].name}` : 'Lớp 4A1',
        phone: '',
        isActive: true,
      });
    }
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền cập nhật quyền giáo viên!');
      return;
    }
    if (!teacherForm.email.trim() || !teacherForm.fullName.trim()) {
      toast.error('Vui lòng điền đủ email và họ tên');
      return;
    }

    if (editingTeacher) {
      await updateTeacher(editingTeacher.id, {
        fullName: teacherForm.fullName,
        role: teacherForm.role,
        title: teacherForm.title,
        department: teacherForm.department,
        assignedClassName: teacherForm.assignedClassName,
        phone: teacherForm.phone,
        isActive: teacherForm.isActive,
      });
    } else {
      await addTeacher({
        email: teacherForm.email,
        fullName: teacherForm.fullName,
        role: teacherForm.role,
        title: teacherForm.title,
        department: teacherForm.department,
        assignedClassName: teacherForm.assignedClassName,
        phone: teacherForm.phone,
      });
    }

    setIsTeacherModalOpen(false);
  };

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
        toast.error('Không tìm thấy danh sách cán bộ/giáo viên hợp lệ trong file');
        return;
      }

      for (const t of parsedTeachers) {
        await addTeacher({
          email: t.email,
          fullName: t.fullName,
          role: t.role,
          title: t.title,
          department: t.department,
          assignedClassName: t.assignedClassName,
          phone: t.phone,
        });
      }
      toast.success(`Đã nhập thành công ${parsedTeachers.length} cán bộ/giáo viên từ file Excel!`);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi đọc file Excel giáo viên. Vui lòng kiểm tra định dạng.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Warning for Regular Non-Admin Teachers */}
      {!isAdmin && profile?.role === 'TEACHER' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Chế độ Chỉ Xem dành cho Giáo Viên</p>
              <p className="text-[11px] text-amber-700">
                Bạn đang đăng nhập với vai trò <strong>{profile.fullName}</strong> ({profile.assignedClassName || 'GVCN'}). Chỉ Ban Giám Hiệu mới có quyền thêm/xóa lớp và phân công cán bộ giáo viên.
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/30 text-indigo-200 px-3 py-0.5 rounded-full text-xs font-bold border border-indigo-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>CỔNG QUẢN TRỊ TRƯỜNG TIỂU HỌC (ADMIN PORTAL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {schoolInfo.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              {schoolInfo.departmentName} • Năm học: <strong>{schoolInfo.schoolYear}</strong> • Quản lý: <strong>{schoolInfo.principalName}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSchoolForm({
                  name: schoolInfo.name,
                  departmentName: schoolInfo.departmentName,
                  schoolYear: schoolInfo.schoolYear,
                  principalName: schoolInfo.principalName,
                  address: schoolInfo.address || '',
                  phone: schoolInfo.phone || '',
                });
                setIsSchoolModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Building className="w-4 h-4" />
              <span>Cấu Hình Trường</span>
            </button>
            <button
              onClick={() => handleOpenClassModal()}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Lớp Học</span>
            </button>
            <button
              onClick={() => handleOpenTeacherModal()}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Cán Bộ / GV</span>
            </button>
          </div>
        </div>
      </div>

      {/* School Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Tổng Số Lớp</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalClasses} Lớp</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Tổng Số Cán Bộ / GV</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalTeachers} Người</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Ban Giám Hiệu / Admin</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalAdmins} Người</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${totalPending > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Chờ Phê Duyệt</p>
            <p className={`text-xl font-black mt-0.5 ${totalPending > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {totalPending} Yêu cầu
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: DANH SÁCH LỚP HỌC TOÀN TRƯỜNG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              <span>Danh Sách Lớp Học Toàn Trường ({schoolClasses.length} Lớp)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị viên có thể vào kiểm tra dữ liệu điểm số, nề nếp, học bạ của bất kỳ lớp nào.
            </p>
          </div>

          <button
            onClick={() => handleOpenClassModal()}
            className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Lớp Mới</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tên Lớp</th>
                <th className="py-3 px-4">Khối</th>
                <th className="py-3 px-4">Giáo Viên Chủ Nhiệm</th>
                <th className="py-3 px-4 text-center">Sĩ Số</th>
                <th className="py-3 px-4 text-center">Sơ Đồ Chỗ Ngồi</th>
                <th className="py-3 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schoolClasses.map((cls) => {
                const isCurrent = cls.id === activeClassId;
                const studentCount = cls.id === 'class-4a1' ? allStudents.length : cls.totalStudents || 30;

                return (
                  <tr key={cls.id} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-blue-50/50' : ''}`}>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Lớp {cls.name}</span>
                        {isCurrent && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                            Đang xem
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">Khối {cls.grade}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{cls.teacherName}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{studentCount} HS</td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {cls.seatingGridRows || 5} hàng × {cls.seatingGridCols || 8} cột
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

      {/* SECTION 2: DANH SÁCH GIÁO VIÊN & CÁN BỘ NHÀ TRƯỜNG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Danh Sách Cán Bộ & Giáo Viên Toàn Trường ({teachers.length} Người)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật quyền linh hoạt: Cho phép 1 tài khoản vừa làm Ban Giám Hiệu quản lý trường vừa trực tiếp chủ nhiệm lớp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                downloadTeacherTemplate();
                toast.success('Đã tải xuống file Excel mẫu phân công cán bộ/giáo viên!');
              }}
              className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-300 transition-colors"
              title="Tải mẫu Excel chuẩn"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Tải File Mẫu</span>
            </button>

            <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 transition-colors">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Nhập Excel</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleTeacherExcelUpload} className="hidden" />
            </label>

            <button
              onClick={() => {
                exportTeacherList(teachers);
                toast.success('Đã xuất danh sách cán bộ/giáo viên ra Excel!');
              }}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={() => handleOpenTeacherModal()}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Cán Bộ / GV</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchStaffQuery}
              onChange={(e) => setSearchStaffQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, email, chức vụ, số điện thoại..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN_TEACHER">🌟 BGH kiêm GVCN</option>
              <option value="ADMIN">👑 Ban Giám Hiệu (Admin)</option>
              <option value="TEACHER">👩‍🏫 Giáo Viên Chủ Nhiệm</option>
              <option value="PENDING">⏳ Chờ Phê Duyệt</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Họ và Tên Cán Bộ / GV</th>
                <th className="py-3 px-4">Thông Tin Đăng Nhập & SĐT</th>
                <th className="py-3 px-4">Tổ Chuyên Môn</th>
                <th className="py-3 px-4 text-center">Quyền Hệ Thống</th>
                <th className="py-3 px-4 text-center">Lớp Chủ Nhiệm</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((t) => {
                const isPending = t.role === 'PENDING' || !t.isActive;
                return (
                  <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${isPending ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="text-slate-900 font-bold">{t.fullName}</div>
                          <span className="text-[11px] text-slate-500 font-normal">{t.title || 'Cán bộ giáo viên'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-mono text-xs text-slate-700">{t.email}</div>
                      {t.phone && <div className="text-[11px] text-slate-400 font-mono mt-0.5">📞 {t.phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                        {t.department || 'Tổ Chuyên môn'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.role === 'ADMIN_TEACHER' ? (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-100 to-purple-100 text-purple-900 border border-purple-300 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <Crown className="w-3 h-3 text-amber-600" />
                          <span>BGH kiêm GVCN</span>
                        </span>
                      ) : t.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <ShieldCheck className="w-3 h-3 text-purple-600" />
                          <span>Admin Quản Trị</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <span>Chờ Phê Duyệt</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <span>Giáo Viên CN</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.assignedClassName ? (
                        <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {t.assignedClassName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Không chủ nhiệm</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isPending ? (
                        <button
                          onClick={() => {
                            updateTeacher(t.id, {
                              role: 'TEACHER',
                              isActive: true,
                              assignedClassName: t.assignedClassName || `Lớp ${schoolClasses[0]?.name || '4A1'}`,
                            });
                            toast.success(`Đã phê duyệt quyền Giáo viên cho ${t.email}!`);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-lg shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Phê Duyệt Ngay</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Hoạt động</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenTeacherModal(t)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Cập nhật quyền & phân công"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {t.email !== 'anhnnh4@gmail.com' && (
                        <button
                          onClick={() => deleteTeacher(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa tài khoản"
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
                  <label className="block font-semibold text-slate-700 mb-1">Tên Lớp (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 4A2"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối Lớp (*)</label>
                  <select
                    value={classForm.grade}
                    onChange={(e) => setClassForm({ ...classForm, grade: Number(e.target.value) as GradeLevel })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={1}>Khối 1</option>
                    <option value={2}>Khối 2</option>
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Giáo Viên Chủ Nhiệm (*)</label>
                  {profile && (
                    <button
                      type="button"
                      onClick={() => setClassForm({ ...classForm, teacherName: profile.fullName })}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      ✨ Gán tôi ({profile.fullName})
                    </button>
                  )}
                </div>

                <select
                  value={classForm.teacherName}
                  onChange={(e) => setClassForm({ ...classForm, teacherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Chọn Giáo viên Chủ nhiệm từ danh sách --</option>
                  {profile && (
                    <option value={profile.fullName}>
                      ✨ [Tôi] {profile.fullName} ({profile.title || 'Tôi'})
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
                  placeholder="Hoặc tự nhập tên nếu chưa có trong danh sách..."
                  value={classForm.teacherName}
                  onChange={(e) => setClassForm({ ...classForm, teacherName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số hàng ghế</label>
                  <input
                    type="number"
                    min={3}
                    max={8}
                    value={classForm.seatingGridRows}
                    onChange={(e) => setClassForm({ ...classForm, seatingGridRows: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số cột ghế</label>
                  <input
                    type="number"
                    min={4}
                    max={12}
                    value={classForm.seatingGridCols}
                    onChange={(e) => setClassForm({ ...classForm, seatingGridCols: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
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

      {/* Modal Add / Edit Teacher & Staff Role */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingTeacher ? `Cập Nhật Quyền: ${editingTeacher.fullName}` : 'Thêm Cán Bộ / Giáo Viên Mới'}
                </h3>
                <p className="text-xs text-slate-500">Phân quyền quản trị và phân công lớp học chủ nhiệm</p>
              </div>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và Tên (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Thầy Nguyễn Văn A"
                    value={teacherForm.fullName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Đăng Nhập (*)</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingTeacher}
                    placeholder="email@school.edu.vn"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức Vụ / Vị Trí</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hiệu trưởng, Tổ trưởng Khối 4, GVCN..."
                    value={teacherForm.title}
                    onChange={(e) => setTeacherForm({ ...teacherForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổ Chuyên Môn / Phòng Ban</label>
                  <select
                    value={teacherForm.department}
                    onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {DEPARTMENTS.filter((d) => d !== 'Tất cả các tổ').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                <input
                  type="text"
                  placeholder="0912 345 678"
                  value={teacherForm.phone}
                  onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* ROLE SELECTION CARDS */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Quyền Hạn Hệ Thống (Role):</label>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                      teacherForm.role === 'ADMIN_TEACHER'
                        ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value="ADMIN_TEACHER"
                      checked={teacherForm.role === 'ADMIN_TEACHER'}
                      onChange={() => setTeacherForm({ ...teacherForm, role: 'ADMIN_TEACHER' })}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-purple-900 text-xs">Admin kiêm Giáo Viên Chủ Nhiệm (Khuyên dùng cho BGH)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Vừa có toàn quyền Quản trị trường (`/admin`), vừa trực tiếp phụ trách 1 lớp chủ nhiệm cụ thể.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                      teacherForm.role === 'ADMIN'
                        ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value="ADMIN"
                      checked={teacherForm.role === 'ADMIN'}
                      onChange={() => setTeacherForm({ ...teacherForm, role: 'ADMIN' })}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-slate-900 text-xs">Quản Trị Viên Toàn Trường (Chỉ Quản Lý BGH)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Toàn quyền xem tất cả các lớp, thêm/sửa lớp, phân công giáo viên, không chủ nhiệm lớp riêng.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                      teacherForm.role === 'TEACHER'
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value="TEACHER"
                      checked={teacherForm.role === 'TEACHER'}
                      onChange={() => setTeacherForm({ ...teacherForm, role: 'TEACHER' })}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-900 text-xs">Giáo Viên Chủ Nhiệm (Teacher)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Chuyên trách quản lý nề nếp, điểm danh, thời khóa biểu và bảng đánh giá TT27 của lớp phụ trách.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* CLASS ASSIGNMENT */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lớp Học Chủ Nhiệm Phụ Trách
                </label>
                <select
                  value={teacherForm.assignedClassName}
                  onChange={(e) => setTeacherForm({ ...teacherForm, assignedClassName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Không chủ nhiệm --</option>
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={`Lớp ${c.name}`}>
                      Lớp {c.name} (Khối {c.grade})
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTeacher ? 'Cập Nhật Quyền Cán Bộ' : 'Thêm & Cấp Quyền'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit School Profile */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cấu Hình Thông Tin Nhà Trường</h3>
                  <p className="text-xs text-slate-500">Đồng bộ sang tất cả lớp học, học bạ và báo cáo</p>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSchoolInfo(schoolForm);
                setIsSchoolModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Trường Tiểu Học</label>
                <input
                  type="text"
                  required
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  placeholder="Ví dụ: Trường Tiểu học Đại Mỗ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cơ Quan Quản Lý (Phòng/Sở)</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.departmentName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, departmentName: e.target.value })}
                    placeholder="Ví dụ: Phòng GD&ĐT Quận Ba Đình"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Năm Học Hiện Tại</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.schoolYear}
                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolYear: e.target.value })}
                    placeholder="Ví dụ: 2025-2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ Tên Hiệu Trưởng / Đại Diện BGH</label>
                <input
                  type="text"
                  required
                  value={schoolForm.principalName}
                  onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                  placeholder="Ví dụ: Thầy Nguyễn Văn A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Trường</label>
                  <input
                    type="text"
                    value={schoolForm.address}
                    onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                    placeholder="Ví dụ: 260 Thụy Khuê, Hà Nội"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={schoolForm.phone}
                    onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                    placeholder="Ví dụ: 024 3847 2596"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu & Đồng Bộ Toàn Trường</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
