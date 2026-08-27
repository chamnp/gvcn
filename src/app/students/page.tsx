'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  CheckCircle,
  AlertCircle,
  Phone,
  Calendar,
  Heart,
  Tag,
  Sparkles,
  Share2,
  Printer,
  Copy,
  Lock,
  RefreshCw,
  Key,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  QrCode,
  X,
} from 'lucide-react';
import { useAppStore, getDefaultPinForStudent } from '@/lib/store';
import { Student, Gender } from '@/types';
import { parseStudentExcelFile } from '@/lib/excel-import';
import { downloadStudentTemplate, exportStudentList } from '@/lib/excel-export';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function StudentsPage() {
  const {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    clearClassStudents,
    loadDemoStudents,
    classInfo,
    schoolInfo,
    updateStudentSecurity,
    resetStudentPin,
    regenerateStudentToken,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'ROSTER' | 'PARENT_SHARE'>('ROSTER');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Nam' | 'Nữ'>('ALL');
  const [boardingFilter, setBoardingFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [activationFilter, setActivationFilter] = useState<'ALL' | 'ACTIVATED' | 'PENDING'>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [isQrBatchModalOpen, setIsQrBatchModalOpen] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    studentCode: string;
    fullName: string;
    gender: Gender;
    dateOfBirth: string;
    parentName: string;
    parentPhone: string;
    isBoarding: boolean;
    healthNotes: string;
    tagInput: string;
  }>({
    studentCode: '',
    fullName: '',
    gender: 'Nam',
    dateOfBirth: '2016-01-01',
    parentName: '',
    parentPhone: '',
    isBoarding: true,
    healthNotes: '',
    tagInput: '',
  });

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.parentPhone && s.parentPhone.includes(searchTerm));

      const matchesGender = genderFilter === 'ALL' || s.gender === genderFilter;
      const matchesBoarding =
        boardingFilter === 'ALL' ||
        (boardingFilter === 'YES' && s.isBoarding) ||
        (boardingFilter === 'NO' && !s.isBoarding);

      const matchesActivation =
        activationFilter === 'ALL' ||
        (activationFilter === 'ACTIVATED' && s.isActivated) ||
        (activationFilter === 'PENDING' && !s.isActivated);

      return matchesSearch && matchesGender && matchesBoarding && matchesActivation;
    });
  }, [students, searchTerm, genderFilter, boardingFilter, activationFilter]);

  // Statistics
  const activatedCount = students.filter((s) => s.isActivated).length;
  const pendingCount = students.length - activatedCount;
  const activatedPercent = students.length > 0 ? Math.round((activatedCount / students.length) * 100) : 0;

  // Open Add Modal
  const handleOpenAdd = () => {
    const classCode = classInfo.name.replace(/\s+/g, '').toUpperCase();
    setFormData({
      studentCode: `HS${classCode}-${String(students.length + 1).padStart(3, '0')}`,
      fullName: '',
      gender: 'Nam',
      dateOfBirth: '2016-01-01',
      parentName: '',
      parentPhone: '',
      isBoarding: true,
      healthNotes: '',
      tagInput: '',
    });
    setEditingStudent(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setFormData({
      studentCode: student.studentCode,
      fullName: student.fullName,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      isBoarding: student.isBoarding,
      healthNotes: student.healthNotes || '',
      tagInput: (student.tags || []).join(', '),
    });
    setEditingStudent(student);
    setIsAddModalOpen(true);
  };

  // Save Student (Add / Edit)
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên học sinh');
      return;
    }

    const tags = formData.tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        studentCode: formData.studentCode,
        fullName: formData.fullName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        isBoarding: formData.isBoarding,
        healthNotes: formData.healthNotes,
        tags,
      });
      toast.success(`Đã cập nhật thông tin em ${formData.fullName}`);
    } else {
      addStudent({
        studentCode: formData.studentCode,
        fullName: formData.fullName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        isBoarding: formData.isBoarding,
        seatRow: Math.floor(students.length / 8),
        seatCol: students.length % 8,
        healthNotes: formData.healthNotes,
        tags,
      });
      toast.success(`Đã thêm em ${formData.fullName} vào danh sách lớp`);
    }

    setIsAddModalOpen(false);
  };

  // Delete Student
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa học sinh "${name}" khỏi lớp?`)) {
      deleteStudent(id);
      toast.success(`Đã xóa học sinh ${name}`);
    }
  };

  // Import Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseStudentExcelFile(file);
      if (parsed.length === 0) {
        toast.error('Không tìm thấy danh sách học sinh hợp lệ trong file Excel. Vui lòng kiểm tra lại file hoặc dùng file mẫu của app!');
        return;
      }
      const result = importStudents(parsed, 'upsert');
      if (result && result.updated > 0 && result.added > 0) {
        toast.success(`Đã cập nhật thông tin ${result.updated} học sinh và thêm mới ${result.added} học sinh vào lớp ${classInfo.name}!`);
      } else if (result && result.updated > 0) {
        toast.success(`Đã cập nhật/đồng bộ thông tin cho ${result.updated} học sinh lớp ${classInfo.name}!`);
      } else {
        toast.success(`Đã nhập thành công ${result?.added || parsed.length} học sinh từ file Excel vào lớp ${classInfo.name}!`);
      }
    } catch (err: any) {
      toast.error(`Lỗi đọc file Excel: ${err.message || 'Vui lòng kiểm tra định dạng file'}`);
    }

    e.target.value = '';
  };

  // Export Excel for Roster
  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.error('Lớp chưa có học sinh nào để xuất Excel!');
      return;
    }
    exportStudentList(classInfo, students);
    toast.success(`Đã xuất danh sách ${students.length} học sinh lớp ${classInfo.name}!`);
  };

  // Export Excel for Parent Links & PINs
  const handleExportShareLinksExcel = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gvcn-eta.vercel.app';
    const headers = ['STT', 'Mã HS', 'Họ và Tên', 'Ngày Sinh', 'Mật Khẩu Mặc Định (DDMM)', 'Trạng Thái', 'SĐT Phụ Huynh', 'Liên Kết Bí Mật Tra Cứu'];
    const rows = students.map((s, i) => {
      const defPin = getDefaultPinForStudent(s);
      const token = s.shareToken || s.id;
      const link = `${origin}/student/${token}`;
      return [
        i + 1,
        s.studentCode,
        s.fullName,
        s.dateOfBirth,
        defPin,
        s.isActivated ? 'Đã đổi PIN riêng' : 'Chưa kích hoạt',
        s.parentPhone || '',
        link,
      ];
    });

    const titleRows = [
      [`DANH SÁCH LIÊN KẾT BẢO MẬT & MÃ PIN TRA CỨU HỌC SINH - LỚP ${classInfo.name}`],
      [`Trường: ${classInfo.schoolName} - GVCN: ${classInfo.teacherName} • Bảo mật nội bộ`],
      [],
    ];

    const ws = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...rows]);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 45 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Link_TraCuu_${classInfo.name}`);
    XLSX.writeFile(wb, `Danh_Sach_Link_BaoMat_Lop_${classInfo.name}.xlsx`);
    toast.success('Đã xuất file danh sách liên kết bảo mật!');
  };

  // Copy Group Zalo Broadcast Message
  const handleCopyZaloGroupMessage = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gvcn-eta.vercel.app';
    const lookupUrl = `${origin}/lookup`;

    const text = `📢 [THÔNG BÁO TRA CỨU PHIẾU BÁO ĐIỂM & NHẬN XÉT HỌC SINH - LỚP ${classInfo.name}]\n` +
      `🏫 ${schoolInfo.name} - Năm học ${schoolInfo.schoolYear || '2026-2027'}\n` +
      `👩‍🏫 Giáo viên chủ nhiệm: ${classInfo.teacherName}\n\n` +
      `Kính gửi Quý Phụ huynh Lớp ${classInfo.name},\n` +
      `Để theo dõi kết quả rèn luyện và lời nhận xét đánh giá Thông tư 27 của con, kính mời bố mẹ truy cập Cổng tra cứu riêng:\n` +
      `🔗 ${lookupUrl}\n\n` +
      `📌 HƯỚNG DẪN KÍCH HOẠT LẦN ĐẦU:\n` +
      `1️⃣ Chọn Lớp ${classInfo.name} và chọn tên con trong danh sách.\n` +
      `2️⃣ Nhập Mật khẩu mặc định là 4 số ngày tháng sinh của con (Ví dụ: con sinh ngày 15/08 thì nhập 1508).\n` +
      `3️⃣ Đổi sang Mã PIN riêng của bố mẹ và lưu lại liên kết để tra cứu nhanh từ các lần sau.\n\n` +
      `Trân trọng cảm ơn Quý Phụ huynh! ❤️`;

    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép tin nhắn thông báo mẫu! Bố mẹ chỉ cần dán vào nhóm Zalo lớp.');
  };

  // 1-Click Send Zalo to Individual Parent
  const handleSendZaloSingle = (student: Student) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gvcn-eta.vercel.app';
    const token = student.shareToken || student.id;
    const studentUrl = `${origin}/student/${token}`;
    const defPin = getDefaultPinForStudent(student);

    const message = `Dạ em gửi mẹ phiếu nhận xét và bảng điểm rèn luyện của con ${student.fullName} (Lớp ${classInfo.name}) ạ:\n🔗 ${studentUrl}\n\nMật khẩu mặc định lần đầu là ${defPin} (ngày sinh con) mẹ nhé ạ!`;

    navigator.clipboard.writeText(message);

    if (student.parentPhone) {
      const cleanPhone = student.parentPhone.replace(/\D/g, '');
      window.open(`https://zalo.me/${cleanPhone}`, '_blank');
      toast.success(`Đã sao chép lời nhắn và mở Zalo số ${student.parentPhone}!`);
    } else {
      toast.success(`Đã sao chép lời nhắn gửi mẹ em ${student.fullName} vào bộ nhớ tạm!`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. TOP HEADER & TAB SWITCHER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                Lớp {classInfo.name}
              </span>
              <span className="bg-slate-100 text-slate-700 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                Sĩ số: {students.length} em
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
              <span className="truncate">Quản Lý Học Sinh & Kết Nối</span>
            </h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ROSTER')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                activeTab === 'ROSTER'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 Danh Sách ({students.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PARENT_SHARE')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'PARENT_SHARE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Kết Nối Phụ Huynh</span>
              {activatedCount > 0 && (
                <span className="bg-emerald-400 text-emerald-950 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black shrink-0">
                  {activatedCount}/{students.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1 ACTION BUTTONS (ROSTER) */}
        {activeTab === 'ROSTER' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Học Sinh</span>
              </button>

              <label className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Nhập Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleExportExcel}
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Xuất Excel</span>
              </button>

              <button
                onClick={() => {
                  downloadStudentTemplate();
                  toast.success('Đã tải xuống file Excel mẫu!');
                }}
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Tải mẫu Excel chuẩn"
              >
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>File Mẫu</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={loadDemoStudents}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Mẫu 12 HS
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa toàn bộ học sinh lớp ${classInfo.name}?`)) {
                    clearClassStudents();
                    toast.success('Đã xóa sạch danh sách học sinh!');
                  }
                }}
                className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Xóa sạch
              </button>
            </div>
          </div>
        )}

        {/* TAB 2 ACTION BUTTONS (PARENT SHARE) */}
        {activeTab === 'PARENT_SHARE' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyZaloGroupMessage}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Sao Chép Tin Nhắn Gửi Nhóm Zalo Lớp</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQrBatchModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In Thẻ QR Cả Lớp (Họp PH)</span>
              </button>

              <button
                type="button"
                onClick={handleExportShareLinksExcel}
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Xuất Excel Danh Sách Link & PIN</span>
              </button>

              <Link
                href="/lookup"
                target="_blank"
                className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-2xl text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>Xem Cổng Tra Cứu</span>
              </Link>
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
              <span>Đã kích hoạt: <strong className="text-emerald-700">{activatedCount}/{students.length} em ({activatedPercent}%)</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 2. TAB 1: ROSTER LIST VIEW */}
      {activeTab === 'ROSTER' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã HS, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as any)}
                className="p-2 rounded-xl border border-slate-200 text-slate-700 font-semibold bg-white cursor-pointer"
              >
                <option value="ALL">Tất cả giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>

              <select
                value={boardingFilter}
                onChange={(e) => setBoardingFilter(e.target.value as any)}
                className="p-2 rounded-xl border border-slate-200 text-slate-700 font-semibold bg-white cursor-pointer"
              >
                <option value="ALL">Tất cả bán trú</option>
                <option value="YES">Ăn bán trú</option>
                <option value="NO">Không bán trú</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3">Mã HS</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-3">Giới Tính</th>
                  <th className="py-3 px-3">Ngày Sinh</th>
                  <th className="py-3 px-3">Bán Trú</th>
                  <th className="py-3 px-4">Phụ Huynh & SĐT</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st, i) => (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">{i + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{st.studentCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-2.5">
                          {st.avatarUrl ? (
                            <img src={st.avatarUrl} alt={st.fullName} className="w-7 h-7 rounded-lg object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                              {st.fullName.split(' ').pop()?.substring(0, 1)}
                            </div>
                          )}
                          <span>{st.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${st.gender === 'Nam' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                          {st.gender}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">{st.dateOfBirth}</td>
                      <td className="py-3 px-3">
                        {st.isBoarding ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Có
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Không</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>
                          <p className="font-semibold text-slate-800">{st.parentName || 'Chưa cập nhật'}</p>
                          {st.parentPhone && <p className="text-[11px] font-mono text-slate-400">{st.parentPhone}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(st)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                            title="Sửa hồ sơ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(st.id, st.fullName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Xóa học sinh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Không tìm thấy học sinh nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TAB 2: PARENT SHARE & ACTIVATION DASHBOARD */}
      {activeTab === 'PARENT_SHARE' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          {/* Quick Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm học sinh để gửi Zalo / đổi PIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activationFilter}
                onChange={(e) => setActivationFilter(e.target.value as any)}
                className="p-2 rounded-xl border border-slate-200 text-slate-700 font-semibold bg-white cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái ({students.length})</option>
                <option value="ACTIVATED">✅ Đã đổi PIN riêng ({activatedCount})</option>
                <option value="PENDING">⏳ Chưa kích hoạt ({pendingCount})</option>
              </select>
            </div>
          </div>

          {/* Share Grid / Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Họ và Tên Học Sinh</th>
                  <th className="py-3 px-3 text-center">Mật Khẩu Mặc Định (DDMM)</th>
                  <th className="py-3 px-3 text-center">Trạng Thái Kích Hoạt</th>
                  <th className="py-3 px-4">Liên Hệ Phụ Huynh</th>
                  <th className="py-3 px-4 text-center">Công Cụ 1-Click Cho Cô Giáo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st, i) => {
                    const defPin = getDefaultPinForStudent(st);
                    const token = st.shareToken || st.id;
                    const studentUrl = typeof window !== 'undefined' ? `${window.location.origin}/student/${token}` : `/student/${token}`;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{i + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{st.fullName}</p>
                            <p className="text-[11px] font-mono text-slate-400 font-normal">Mã: {st.studentCode} • Sinh: {st.dateOfBirth}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-black text-sm bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 tracking-wider">
                            {defPin}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {st.isActivated ? (
                            <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đã đổi PIN riêng</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <Key className="w-3 h-3" />
                              <span>Dùng mã DDMM</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>
                            <p className="font-semibold text-slate-800">{st.parentName || 'Phụ huynh'}</p>
                            <p className="text-[11px] font-mono text-blue-600">{st.parentPhone || 'Chưa có SĐT'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center space-x-1.5">
                            {/* 1-Click Zalo */}
                            <button
                              type="button"
                              onClick={() => handleSendZaloSingle(st)}
                              className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                              title="Gửi Zalo riêng cho mẹ"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                              <span>Gửi Zalo</span>
                            </button>

                            {/* Copy Link */}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(studentUrl);
                                toast.success(`Đã sao chép link riêng của em ${st.fullName}!`);
                              }}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                              title="Sao chép link bí mật"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Preview */}
                            <Link
                              href={`/student/${token}`}
                              target="_blank"
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                              title="Xem thử phiếu báo điểm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            {/* Reset PIN if forgotten */}
                            {st.isActivated && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Đặt lại mật khẩu cho em ${st.fullName} về 4 số ngày sinh mặc định (${defPin})?`)) {
                                    resetStudentPin(st.id);
                                    toast.success(`Đã đặt lại mật khẩu về mặc định (${defPin})!`);
                                  }
                                }}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                                title="Đặt lại PIN về ngày sinh mặc định"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không tìm thấy học sinh nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ADD / EDIT STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'Sửa Hồ Sơ Học Sinh' : 'Thêm Học Sinh Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã Học Sinh *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới Tính *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và Tên Học Sinh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày Sinh (YYYY-MM-DD) *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ăn Bán Trú</label>
                  <select
                    value={formData.isBoarding ? 'YES' : 'NO'}
                    onChange={(e) => setFormData({ ...formData, isBoarding: e.target.value === 'YES' })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                  >
                    <option value="YES">Có ăn bán trú</option>
                    <option value="NO">Không ăn bán trú</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ Tên Phụ Huynh</label>
                  <input
                    type="text"
                    placeholder="Mẹ Nguyễn Thị Hoa"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại Phụ Huynh</label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi Chú Sức Khỏe / Dị Ứng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cận thị 2 độ, dị ứng đậu phộng..."
                  value={formData.healthNotes}
                  onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                >
                  {editingStudent ? 'Cập Nhật' : 'Thêm Học Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. BATCH QR CODE PRINT MODAL (FOR PARENT MEETING) */}
      {isQrBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Thẻ QR Tra Cứu Cá Nhân Cho Buổi Họp Phụ Huynh (Lớp {classInfo.name})
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Tất Cả Thẻ (Khổ A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsQrBatchModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-500">
                Mỗi trang A4 in 6 thẻ. Cô có thể cắt rời phát cho phụ huynh trong buổi họp để bố mẹ quét mã tra cứu kết quả của con:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {students.map((st) => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gvcn-eta.vercel.app';
                  const token = st.shareToken || st.id;
                  const link = `${origin}/student/${token}`;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(link)}`;
                  const defPin = getDefaultPinForStudent(st);

                  return (
                    <div
                      key={st.id}
                      className="p-4 rounded-2xl border-2 border-slate-300 bg-white shadow-xs text-center space-y-2 flex flex-col items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-blue-700 tracking-wider">
                          {schoolInfo.name}
                        </span>
                        <h4 className="font-black text-sm text-slate-900">{st.fullName}</h4>
                        <p className="text-[10px] text-slate-500">
                          Lớp {classInfo.name} • Mã: {st.studentCode}
                        </p>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 my-1">
                        <img src={qrUrl} alt="QR Code" className="w-28 h-28 mx-auto object-contain" />
                      </div>

                      <div className="text-[10px] space-y-0.5 w-full bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                        <p className="text-slate-600">Mật khẩu mặc định: <strong className="font-mono text-blue-900">{defPin}</strong></p>
                        <p className="text-[9px] text-slate-400">Quét mã để xem Nhận xét & Bảng điểm TT27</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
