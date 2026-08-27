'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Student, Gender } from '@/types';
import { parseStudentExcelFile } from '@/lib/excel-import';
import { downloadStudentTemplate } from '@/lib/excel-export';
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
  } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Nam' | 'Nữ'>('ALL');
  const [boardingFilter, setBoardingFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

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
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.parentPhone && s.parentPhone.includes(searchTerm));
    
    const matchesGender = genderFilter === 'ALL' || s.gender === genderFilter;
    const matchesBoarding =
      boardingFilter === 'ALL' ||
      (boardingFilter === 'YES' && s.isBoarding) ||
      (boardingFilter === 'NO' && !s.isBoarding);

    return matchesSearch && matchesGender && matchesBoarding;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      studentCode: `HS4A1-${String(students.length + 1).padStart(3, '0')}`,
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
        toast.error('Không tìm thấy danh sách học sinh hợp lệ trong file');
        return;
      }
      importStudents(parsed);
      toast.success(`Đã nhập thành công ${parsed.length} học sinh từ file Excel!`);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.');
    }
  };

  // Export Excel
  const handleExportRoster = () => {
    const headers = ['STT', 'Mã Học Sinh', 'Họ và Tên', 'Giới Tính', 'Ngày Sinh', 'Phụ Huynh', 'SĐT', 'Ăn Bán Trú', 'Ghi Chú Sức Khỏe'];
    const rows = students.map((s, i) => [
      i + 1,
      s.studentCode,
      s.fullName,
      s.gender,
      s.dateOfBirth,
      s.parentName || '',
      s.parentPhone || '',
      s.isBoarding ? 'Có' : 'Không',
      s.healthNotes || '',
    ]);

    const titleRows = [
      [`DANH SÁCH HỌC SINH LỚP ${classInfo.name} - NĂM HỌC ${classInfo.schoolYear}`],
      [`Trường: ${classInfo.schoolName} - GVCN: ${classInfo.teacherName} - Sĩ số: ${students.length} em`],
      [],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `DanhSach_${classInfo.name}`);
    XLSX.writeFile(workbook, `Danh_Sach_Hoc_Sinh_${classInfo.name}_${classInfo.schoolYear}.xlsx`);
    toast.success('Đã xuất file danh sách học sinh!');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            <span>Hồ Sơ Học Sinh Lớp {classInfo.name}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng cộng: <strong className="text-slate-800">{students.length} học sinh</strong> ({students.filter(s => s.gender === 'Nam').length} Nam, {students.filter(s => s.gender === 'Nữ').length} Nữ, {students.filter(s => s.isBoarding).length} Ăn bán trú)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template Button */}
          <button
            onClick={() => {
              downloadStudentTemplate();
              toast.success('Đã tải xuống file Excel mẫu danh sách học sinh!');
            }}
            className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-300 transition-colors"
            title="Tải mẫu Excel chuẩn để nhập dữ liệu"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Tải File Mẫu</span>
          </button>

          {/* Import Button */}
          <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 transition-colors">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Nhập Excel</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Export Button */}
          <button
            onClick={handleExportRoster}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất Excel</span>
          </button>

          {/* Clear / Load Demo Toolbar */}
          {students.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ ${students.length} học sinh của Lớp ${classInfo.name} để chuẩn bị nhập danh sách thật từ file Excel?`)) {
                  clearClassStudents();
                  toast.success(`Đã làm sạch danh sách học sinh Lớp ${classInfo.name}!`);
                }
              }}
              className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
              title="Xóa toàn bộ học sinh lớp này để nhập danh sách mới"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm Sạch Lớp</span>
            </button>
          )}

          {/* Add Student Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Học Sinh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {students.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên học sinh, mã số, số điện thoại phụ huynh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả giới tính</option>
              <option value="Nam">Chỉ Nam</option>
              <option value="Nữ">Chỉ Nữ</option>
            </select>

            {/* Boarding Filter */}
            <select
              value={boardingFilter}
              onChange={(e) => setBoardingFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả hình thức</option>
              <option value="YES">Ăn bán trú</option>
              <option value="NO">Không bán trú</option>
            </select>
          </div>
        </div>
      )}

      {/* Student Table or Empty State */}
      {students.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              Lớp {classInfo.name} Hiện Chưa Có Học Sinh
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thầy cô có thể thêm học sinh mới thủ công, nhập nhanh toàn bộ danh sách lớp từ file Excel, hoặc nạp 30 học sinh mẫu để thử nghiệm tính năng đánh giá TT27:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm học sinh</span>
            </button>

            <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors">
              <Upload className="w-4 h-4" />
              <span>Nhập từ Excel</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => {
                loadDemoStudents();
                toast.success(`Đã nạp 30 học sinh mẫu cho Lớp ${classInfo.name}!`);
              }}
              className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Nạp 30 học sinh mẫu (Demo)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 w-28">Mã HS</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4 w-20 text-center">Giới tính</th>
                  <th className="py-3 px-4 w-28">Ngày sinh</th>
                  <th className="py-3 px-4">Phụ huynh & SĐT</th>
                  <th className="py-3 px-4 w-24 text-center">Bán trú</th>
                  <th className="py-3 px-4">Ghi chú & Vai trò</th>
                  <th className="py-3 px-4 text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Không tìm thấy học sinh nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">{st.studentCode}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedStudentDetail(st)}
                        className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors"
                      >
                        {st.fullName}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          st.gender === 'Nam'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {st.gender}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {st.dateOfBirth}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-800">{st.parentName || 'Chưa cập nhật'}</p>
                        {st.parentPhone && (
                          <a
                            href={`tel:${st.parentPhone}`}
                            className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{st.parentPhone}</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {st.isBoarding ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                          Có
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[11px]">
                          Không
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {st.tags && st.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {st.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {st.healthNotes && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500" />
                            <span>{st.healthNotes}</span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(st.id, st.fullName)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal Add / Edit Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900">
              {editingStudent ? `Sửa thông tin: ${editingStudent.fullName}` : 'Thêm Học Sinh Mới'}
            </h2>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Học Sinh</label>
                  <input
                    type="text"
                    required
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới Tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và Tên Học Sinh (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày Sinh (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ăn Bán Trú</label>
                  <select
                    value={formData.isBoarding ? 'YES' : 'NO'}
                    onChange={(e) => setFormData({ ...formData, isBoarding: e.target.value === 'YES' })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="YES">Có ăn bán trú</option>
                    <option value="NO">Không ăn bán trú</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Phụ Huynh</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn Hùng (Bố)"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại Phụ Huynh</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Sức Khỏe / Dị Ứng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cận thị 1.5 độ (bàn đầu), Dị ứng hải sản..."
                  value={formData.healthNotes}
                  onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhãn / Vai Trò (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lớp trưởng, Tổ trưởng Tổ 1, Văn nghệ"
                  value={formData.tagInput}
                  onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  {editingStudent ? 'Lưu Thay Đổi' : 'Thêm Học Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Student Detail View */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedStudentDetail.fullName}</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedStudentDetail.studentCode}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                selectedStudentDetail.gender === 'Nam' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
              }`}>
                {selectedStudentDetail.gender}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ngày sinh:</span>
                <span className="font-semibold text-slate-800">{selectedStudentDetail.dateOfBirth}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ăn bán trú:</span>
                <span className="font-semibold text-slate-800">{selectedStudentDetail.isBoarding ? 'Có' : 'Không'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Phụ huynh:</span>
                <span className="font-semibold text-slate-800">{selectedStudentDetail.parentName || 'Chưa có'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-semibold text-blue-600">{selectedStudentDetail.parentPhone || 'Chưa có'}</span>
              </div>
              {selectedStudentDetail.healthNotes && (
                <div className="p-2.5 bg-amber-50 rounded-lg text-amber-800 border border-amber-200">
                  <strong>Ghi chú sức khỏe:</strong> {selectedStudentDetail.healthNotes}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
