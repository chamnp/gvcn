'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Globe,
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
  Building,
  Save,
  Search,
  Filter,
  Phone,
  Mail,
  Briefcase,
  CheckCircle,
  XCircle,
  Crown,
  School,
  FileSpreadsheet,
  Layers,
  MapPin,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { ClassInfo, GradeLevel, UserRole, TeacherProfile, CommunityResource } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { getAcademicYearByDate } from '@/lib/tt27-engine';

export default function PlatformAdminPage() {
  const router = useRouter();
  const {
    schoolClasses,
    activeClassId,
    switchClass,
    deleteClass,
    allStudents,
  } = useAppStore();

  const {
    user,
    profile,
    isAdmin,
    teachers,
    refreshTeachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
  } = useAuth();

  // Active Admin Tab
  const [adminTab, setAdminTab] = useState<'TEACHERS' | 'CLASSES' | 'COMMUNITY' | 'STATS'>('TEACHERS');

  // Load teachers and resources on mount
  useEffect(() => {
    refreshTeachers();
  }, [refreshTeachers]);

  // Teacher Search & Filters
  const [searchTeacherQuery, setSearchTeacherQuery] = useState('');
  const [filterProvince, setFilterProvince] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [filterGrade, setFilterGrade] = useState<number>(0);

  // Modal State for Teacher Editing / Adding
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [teacherForm, setTeacherForm] = useState<{
    email: string;
    fullName: string;
    role: UserRole;
    schoolName: string;
    district: string;
    province: string;
    mainGrade: number;
    assignedClassName: string;
    planTier: 'BETA_ALL_ACCESS' | 'PRO' | 'FREE';
    phone: string;
    isActive: boolean;
  }>({
    email: '',
    fullName: '',
    role: 'TEACHER',
    schoolName: '',
    district: '',
    province: 'Hà Nội',
    mainGrade: 4,
    assignedClassName: '',
    planTier: 'BETA_ALL_ACCESS',
    phone: '',
    isActive: true,
  });

  // Community Resources State
  const [communityResources, setCommunityResources] = useState<CommunityResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const loadCommunityList = async () => {
    setLoadingResources(true);
    try {
      const { data, error } = await supabase
        .from('CommunityResource')
        .select('*')
        .order('createdAt', { ascending: false });
      if (data) setCommunityResources(data as CommunityResource[]);
    } catch (e) {}
    setLoadingResources(false);
  };

  useEffect(() => {
    if (adminTab === 'COMMUNITY') {
      loadCommunityList();
    }
  }, [adminTab]);

  // Metrics Calculation
  const totalTeachersCount = teachers.length;
  const pendingTeachersCount = teachers.filter((t) => t.role === 'PENDING' || !t.isActive).length;
  const activeTeachersCount = teachers.filter((t) => t.isActive && t.role !== 'PENDING').length;

  const uniqueSchoolsCount = useMemo(() => {
    const schools = new Set<string>();
    teachers.forEach((t) => {
      if (t.schoolName?.trim()) schools.add(t.schoolName.trim().toLowerCase());
    });
    schoolClasses.forEach((c) => {
      if (c.schoolName?.trim()) schools.add(c.schoolName.trim().toLowerCase());
    });
    return schools.size || 1;
  }, [teachers, schoolClasses]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const query = searchTeacherQuery.toLowerCase();
      const matchSearch =
        !query ||
        t.fullName.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query) ||
        (t.schoolName || '').toLowerCase().includes(query) ||
        (t.assignedClassName || '').toLowerCase().includes(query) ||
        (t.phone || '').includes(query);

      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'PENDING' && (t.role === 'PENDING' || !t.isActive)) ||
        (filterStatus === 'ACTIVE' && t.isActive && t.role !== 'PENDING');

      const matchProvince =
        filterProvince === 'ALL' || (t.province || '').toLowerCase() === filterProvince.toLowerCase();

      const matchGrade = filterGrade === 0 || t.mainGrade === filterGrade;

      return matchSearch && matchStatus && matchProvince && matchGrade;
    });
  }, [teachers, searchTeacherQuery, filterStatus, filterProvince, filterGrade]);

  // Distinct Provinces from teachers
  const availableProvinces = useMemo(() => {
    const provinces = new Set<string>();
    teachers.forEach((t) => {
      if (t.province?.trim()) provinces.add(t.province.trim());
    });
    return Array.from(provinces);
  }, [teachers]);

  // Actions on Teachers
  const handleOpenTeacherModal = (t?: TeacherProfile) => {
    if (t) {
      setEditingTeacher(t);
      setTeacherForm({
        email: t.email,
        fullName: t.fullName,
        role: t.role,
        schoolName: t.schoolName || '',
        district: t.district || '',
        province: t.province || 'Hà Nội',
        mainGrade: t.mainGrade || 4,
        assignedClassName: t.assignedClassName || '',
        planTier: t.planTier || 'BETA_ALL_ACCESS',
        phone: t.phone || '',
        isActive: t.isActive,
      });
    } else {
      setEditingTeacher(null);
      setTeacherForm({
        email: '',
        fullName: '',
        role: 'TEACHER',
        schoolName: '',
        district: '',
        province: 'Hà Nội',
        mainGrade: 4,
        assignedClassName: '',
        planTier: 'BETA_ALL_ACCESS',
        phone: '',
        isActive: true,
      });
    }
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.email.trim() || !teacherForm.fullName.trim()) {
      toast.error('Vui lòng điền đủ email và họ tên giáo viên');
      return;
    }

    if (editingTeacher) {
      await updateTeacher(editingTeacher.id, {
        fullName: teacherForm.fullName,
        role: teacherForm.role,
        schoolName: teacherForm.schoolName,
        district: teacherForm.district,
        province: teacherForm.province,
        mainGrade: teacherForm.mainGrade as GradeLevel,
        assignedClassName: teacherForm.assignedClassName ? teacherForm.assignedClassName.trim().toUpperCase() : undefined,
        planTier: teacherForm.planTier,
        phone: teacherForm.phone,
        isActive: teacherForm.isActive,
      });
    } else {
      await addTeacher({
        email: teacherForm.email,
        fullName: teacherForm.fullName,
        role: teacherForm.role,
        schoolName: teacherForm.schoolName,
        district: teacherForm.district,
        province: teacherForm.province,
        mainGrade: teacherForm.mainGrade,
        assignedClassName: teacherForm.assignedClassName ? teacherForm.assignedClassName.trim().toUpperCase() : undefined,
        planTier: teacherForm.planTier,
        phone: teacherForm.phone,
      });
    }

    setIsTeacherModalOpen(false);
  };

  // 1-Click Approve Teacher to Full BETA & Auto-provision Classroom
  const handleApproveTeacher = async (t: TeacherProfile) => {
    try {
      await updateTeacher(t.id, {
        role: 'TEACHER',
        isActive: true,
        planTier: 'BETA_ALL_ACCESS',
      });

      // If teacher has declared an assigned class name & school name, ensure Class is in DB
      if (t.assignedClassName && t.schoolName) {
        const cleanName = t.assignedClassName.trim().toUpperCase();
        const cleanSchool = t.schoolName.trim();
        const cleanGrade = Number(t.mainGrade) || 1;
        const teacherEmail = t.email.toLowerCase().trim();

        // Check if class exists
        const { data: existingClasses } = await supabase
          .from('Class')
          .select('id, name, schoolName')
          .eq('schoolName', cleanSchool)
          .eq('name', cleanName);

        if (!existingClasses || existingClasses.length === 0) {
          const classId = t.assignedClassId || `class-${Date.now()}`;
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          await supabase.from('Class').insert({
            id: classId,
            name: cleanName,
            grade: cleanGrade,
            schoolYear: getAcademicYearByDate(),
            schoolName: cleanSchool,
            district: t.district || '',
            province: t.province || '',
            teacherName: t.fullName,
            teacherEmail: teacherEmail,
            totalStudents: 0,
            seatingGridRows: 5,
            seatingGridCols: 8,
            shareToken: `c${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${randomSuffix}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      toast.success(`Đã phê duyệt & kích hoạt quyền sử dụng cho giáo viên ${t.fullName} (${t.email})!`);
    } catch (err: any) {
      console.error('Lỗi duyệt giáo viên:', err);
      toast.error('Lỗi khi duyệt giáo viên: ' + (err?.message || 'Vui lòng thử lại'));
    }
  };

  // Toggle Account Active / Inactive
  const handleToggleActive = async (t: TeacherProfile) => {
    const nextActive = !t.isActive;
    await updateTeacher(t.id, { isActive: nextActive });
    toast.info(`Đã ${nextActive ? 'mở khóa' : 'khóa tạm thời'} tài khoản ${t.email}`);
  };

  // Toggle Resource Verification
  const handleToggleResourceVerify = async (res: CommunityResource) => {
    const nextVerify = !res.isVerified;
    try {
      await supabase
        .from('CommunityResource')
        .update({ isVerified: nextVerify })
        .eq('id', res.id);

      setCommunityResources((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, isVerified: nextVerify } : r))
      );
      toast.success(nextVerify ? 'Đã duyệt chuẩn sư phạm cho tài liệu!' : 'Đã hủy duyệt chuẩn');
    } catch (e) {
      toast.error('Lỗi khi cập nhật trạng thái kiểm duyệt');
    }
  };

  // Delete Community Resource
  const handleDeleteResource = async (resId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài nguyên cộng đồng này không?')) return;
    try {
      await supabase.from('CommunityResource').delete().eq('id', resId);
      setCommunityResources((prev) => prev.filter((r) => r.id !== resId));
      toast.success('Đã xóa tài nguyên');
    } catch (e) {
      toast.error('Lỗi khi xóa tài nguyên');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold border border-indigo-400/30">
              <ShieldCheck className="w-4 h-4 text-indigo-300" />
              <span>GVCN PRO PLATFORM ADMIN CONSOLE (BETA)</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              Trung Tâm Quản Trị & Điều Hành Nền Tảng Toàn Quốc
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Quản trị viên: <strong>{profile?.fullName || 'Cô Nguyễn Ngọc Ánh'}</strong> ({user?.email}) • Cấp quyền
              kích hoạt giáo viên mọi trường và kiểm duyệt kho tài nguyên sư phạm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => refreshTeachers()}
              className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Làm Mới</span>
            </button>
            <button
              onClick={() => handleOpenTeacherModal()}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cấp Quyền Giáo Viên Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Platform Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Tổng Số Giáo Viên</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalTeachersCount} Thầy Cô</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Chờ Duyệt Kích Hoạt</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingTeachersCount} Giáo Viên</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Số Trường Tham Gia</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{uniqueSchoolsCount} Trường</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Lớp Học Số Hóa</p>
            <p className="text-2xl font-black text-purple-700 mt-0.5">{schoolClasses.length} Lớp</p>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setAdminTab('TEACHERS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'TEACHERS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Giáo Viên Toàn Quốc ({teachers.length})
        </button>
        <button
          onClick={() => setAdminTab('CLASSES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'CLASSES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Lớp Học Đa Trường ({schoolClasses.length})
        </button>
        <button
          onClick={() => setAdminTab('COMMUNITY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'COMMUNITY'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Kiểm Duyệt Học Liệu Cộng Đồng
        </button>
      </div>

      {/* TAB 1: TEACHERS DIRECTORY */}
      {adminTab === 'TEACHERS' && (
        <div className="space-y-4">
          {/* Search & Filter bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTeacherQuery}
                onChange={(e) => setSearchTeacherQuery(e.target.value)}
                placeholder="Tìm kiếm theo họ tên, email, trường công tác, SĐT..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ duyệt ({pendingTeachersCount})</option>
                <option value="ACTIVE">Đã kích hoạt ({activeTeachersCount})</option>
              </select>

              {availableProvinces.length > 0 && (
                <select
                  value={filterProvince}
                  onChange={(e) => setFilterProvince(e.target.value)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Tất cả tỉnh thành</option>
                  {availableProvinces.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(Number(e.target.value))}
                className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
              >
                <option value={0}>Tất cả khối</option>
                <option value={1}>Khối 1</option>
                <option value={2}>Khối 2</option>
                <option value={3}>Khối 3</option>
                <option value={4}>Khối 4</option>
                <option value={5}>Khối 5</option>
              </select>
            </div>
          </div>

          {/* Teachers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Giáo Viên</th>
                    <th className="px-4 py-3.5">Trường & Địa Phương</th>
                    <th className="px-4 py-3.5">Lớp Đăng Ký / Khối</th>
                    <th className="px-4 py-3.5">Gói / Quyền Hạn</th>
                    <th className="px-4 py-3.5">Trạng Thái</th>
                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredTeachers.map((t) => {
                    const isSuperAdmin = t.email === 'anhnnh4@gmail.com';
                    const isPending = t.role === 'PENDING' || !t.isActive;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3">
                            {t.avatarUrl ? (
                              <img
                                src={t.avatarUrl}
                                alt={t.fullName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                {t.fullName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{t.fullName}</span>
                                {isSuperAdmin && (
                                  <span title="Super Admin">
                                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">{t.email}</p>
                              {t.phone && <p className="text-[10px] text-slate-400">SĐT: {t.phone}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-800">{t.schoolName || 'Chưa cập nhật'}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{[t.district, t.province].filter(Boolean).join(', ') || 'Toàn quốc'}</span>
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            {t.assignedClassName ? (
                              <span className="inline-block px-2 py-0.5 bg-blue-600 text-white rounded-md font-bold text-[11px] shadow-2xs">
                                Lớp {t.assignedClassName}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Chưa đăng ký</span>
                            )}
                            {t.mainGrade ? (
                              <p className="text-[10px] text-slate-500 font-semibold">Khối {t.mainGrade}</p>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md font-bold text-[10px]">
                              {t.planTier || 'BETA_ALL_ACCESS'}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {t.role === 'ADMIN' ? 'Platform Admin' : 'Giáo viên Chủ nhiệm'}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {isPending ? (
                            <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                              Chờ duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Đã kích hoạt
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {isPending && (
                              <button
                                onClick={() => handleApproveTeacher(t)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                              >
                                Duyệt Full BETA
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenTeacherModal(t)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Sửa thông tin"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {!isSuperAdmin && (
                              <>
                                <button
                                  onClick={() => handleToggleActive(t)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    t.isActive
                                      ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                      : 'text-amber-600 hover:bg-amber-100'
                                  }`}
                                  title={t.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc chắn muốn xóa giáo viên ${t.fullName}?`)) {
                                      deleteTeacher(t.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa giáo viên"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CROSS-SCHOOL CLASSES */}
      {adminTab === 'CLASSES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Danh Sách Toàn Bộ Lớp Học Trên Hệ Thống ({schoolClasses.length} Lớp)
            </h2>
            <span className="text-xs text-slate-500">Mỗi lớp thuộc về giáo viên và trường cụ thể</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Tên Lớp & Khối</th>
                  <th className="px-4 py-3.5">Trường Học</th>
                  <th className="px-4 py-3.5">Giáo Viên Sở Hữu</th>
                  <th className="px-4 py-3.5">Năm Học</th>
                  <th className="px-4 py-3.5">Sĩ Số</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {schoolClasses.map((cls) => {
                  const isCurrent = cls.id === activeClassId;
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">Lớp {cls.name}</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">
                            Khối {cls.grade}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px]">
                              Đang xem
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{cls.schoolName || 'Tiểu học'}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{cls.teacherName}</p>
                        <p className="text-[11px] text-slate-400">{cls.teacherEmail || 'Chưa gán email'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{cls.schoolYear}</td>
                      <td className="px-4 py-3.5 font-bold text-blue-600">
                        {cls.totalStudents || 0} HS
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              switchClass(cls.id);
                              toast.success(`Đã chuyển sang xem Lớp ${cls.name}!`);
                              router.push('/');
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Vào Lớp Này
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa lớp ${cls.name}?`)) {
                                deleteClass(cls.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMMUNITY MODERATION */}
      {adminTab === 'COMMUNITY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kiểm Duyệt Học Liệu Cộng Đồng GVCN ({communityResources.length} Tài nguyên)
              </h2>
              <p className="text-xs text-slate-500">Xác thực các bài dạy chuẩn CV 2345 và bộ nhận xét TT 27</p>
            </div>
            <button
              onClick={loadCommunityList}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {communityResources.map((res) => (
              <div key={res.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">
                      {res.type}
                    </span>
                    {res.isVerified && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px] flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Đã kiểm duyệt
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs truncate">{res.title}</h3>
                  <p className="text-[11px] text-slate-500">
                    Đăng bởi: <strong>{res.authorName}</strong> ({res.authorSchool}) • {res.likesCount} lượt thích
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleToggleResourceVerify(res)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      res.isVerified
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {res.isVerified ? 'Hủy Duyệt Chuẩn' : 'Xác Thực Chuẩn CV 2345'}
                  </button>
                  <button
                    onClick={() => handleDeleteResource(res.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Teacher */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingTeacher ? 'Cập Nhật Quyền Giáo Viên' : 'Cấp Quyền Giáo Viên Mới'}
                </h2>
                <p className="text-xs text-slate-500">Thiết lập tài khoản giáo viên tiểu học trên toàn quốc</p>
              </div>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 overflow-y-auto space-y-3.5 text-xs custom-scrollbar">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email giáo viên *</label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editingTeacher)}
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  placeholder="giaovien@gmail.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Họ và tên giáo viên *</label>
                <input
                  type="text"
                  required
                  value={teacherForm.fullName}
                  onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                  placeholder="Cô Nguyễn Thị Mai"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Số điện thoại</label>
                  <input
                    type="text"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="0912 345 678"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Khối phụ trách chính</label>
                  <select
                    value={teacherForm.mainGrade}
                    onChange={(e) => setTeacherForm({ ...teacherForm, mainGrade: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
                  >
                    <option value={1}>Khối 1</option>
                    <option value={2}>Khối 2</option>
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tên trường tiểu học công tác</label>
                  <input
                    type="text"
                    value={teacherForm.schoolName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, schoolName: e.target.value })}
                    placeholder="VD: Trường Tiểu học Chu Văn An"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Lớp chủ nhiệm đăng ký</label>
                  <input
                    type="text"
                    value={teacherForm.assignedClassName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, assignedClassName: e.target.value })}
                    placeholder="VD: 4A1, 1A, 5B..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Quận / Huyện</label>
                  <input
                    type="text"
                    value={teacherForm.district}
                    onChange={(e) => setTeacherForm({ ...teacherForm, district: e.target.value })}
                    placeholder="Quận Tây Hồ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    value={teacherForm.province}
                    onChange={(e) => setTeacherForm({ ...teacherForm, province: e.target.value })}
                    placeholder="Hà Nội"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Quyền hệ thống</label>
                  <select
                    value={teacherForm.role}
                    onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
                  >
                    <option value="TEACHER">Giáo viên (TEACHER)</option>
                    <option value="ADMIN_TEACHER">Admin kiêm GVCN (ADMIN_TEACHER)</option>
                    <option value="ADMIN">Quản Trị BGH (ADMIN)</option>
                    <option value="PENDING">Chờ duyệt (PENDING)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Gói dịch vụ</label>
                  <select
                    value={teacherForm.planTier}
                    onChange={(e) => setTeacherForm({ ...teacherForm, planTier: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
                  >
                    <option value="BETA_ALL_ACCESS">BETA Full Access (Miễn phí)</option>
                    <option value="PRO">PRO</option>
                    <option value="FREE">FREE</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teacherForm.isActive}
                    onChange={(e) => setTeacherForm({ ...teacherForm, isActive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-700">Kích hoạt tài khoản ngay</span>
                </label>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsTeacherModalOpen(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Lưu Giáo Viên
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
