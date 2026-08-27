import * as XLSX from 'xlsx';
import { Student, SubjectAssessment, TraitAssessment, StudentTermSummary, ClassInfo, TermType } from '@/types';
import { PRIMARY_SUBJECTS, TRAIT_DEFINITIONS, evaluateStudentTT27, TERMS } from './tt27-engine';

/**
 * Xuất Bảng tổng hợp kết quả đánh giá giáo dục (Mẫu số 1 - Thông tư 27/2020/TT-BGDĐT)
 */
export function exportTT27Form1(
  classInfo: ClassInfo,
  students: Student[],
  subjectAssessments: SubjectAssessment[],
  traitAssessments: TraitAssessment[],
  termSummaries: StudentTermSummary[],
  term: TermType
) {
  const termName = TERMS.find((t) => t.id === term)?.name || term;
  const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(classInfo.grade));
  const traits = TRAIT_DEFINITIONS;

  // Xây dựng Header
  const headers: string[] = [
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Giới tính',
    'Ngày sinh',
  ];

  // Cột Môn học
  subjects.forEach((s) => {
    headers.push(`${s.shortName} (Mức)`);
    if (s.hasPeriodicTest) {
      headers.push(`${s.shortName} (Điểm)`);
    }
  });

  // Cột Phẩm chất
  traits.filter(t => t.category === 'PHAM_CHAT').forEach((t) => {
    headers.push(t.shortName);
  });

  // Cột Năng lực chung
  traits.filter(t => t.category === 'NL_CHUNG').forEach((t) => {
    headers.push(t.shortName);
  });

  // Cột Năng lực đặc thù
  traits.filter(t => t.category === 'NL_DAC_THU').forEach((t) => {
    headers.push(t.shortName);
  });

  // Khen thưởng & Nhận xét
  headers.push('Khen thưởng');
  headers.push('Nhận xét của Giáo viên');

  // Xây dựng Dữ liệu từng học sinh
  const rows: (string | number)[][] = [];

  students.forEach((student, index) => {
    const studentSubjects = subjectAssessments.filter((s) => s.studentId === student.id && s.term === term);
    const studentTraits = traitAssessments.filter((t) => t.studentId === student.id && t.term === term);
    const summary = termSummaries.find((ts) => ts.studentId === student.id && ts.term === term);
    const evaluation = evaluateStudentTT27(studentSubjects, studentTraits, term);

    const row: (string | number)[] = [
      index + 1,
      student.studentCode,
      student.fullName,
      student.gender,
      student.dateOfBirth,
    ];

    // Môn học
    subjects.forEach((s) => {
      const match = studentSubjects.find((item) => item.subjectCode === s.code);
      row.push(match ? match.level : 'H');
      if (s.hasPeriodicTest) {
        row.push(match?.score !== undefined ? match.score : '');
      }
    });

    // Phẩm chất
    traits.filter(t => t.category === 'PHAM_CHAT').forEach((t) => {
      const match = studentTraits.find((item) => item.traitCode === t.code);
      row.push(match ? match.level : 'Đ');
    });

    // Năng lực chung
    traits.filter(t => t.category === 'NL_CHUNG').forEach((t) => {
      const match = studentTraits.find((item) => item.traitCode === t.code);
      row.push(match ? match.level : 'Đ');
    });

    // Năng lực đặc thù
    traits.filter(t => t.category === 'NL_DAC_THU').forEach((t) => {
      const match = studentTraits.find((item) => item.traitCode === t.code);
      row.push(match ? match.level : 'Đ');
    });

    // Khen thưởng & Nhận xét
    row.push(summary?.awardTitle || evaluation.awardTitle);
    row.push(summary?.teacherComment || '');

    rows.push(row);
  });

  const titleRows = [
    [`BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ GIÁO DỤC - ${termName.toUpperCase()}`],
    [`Trường: ${classInfo.schoolName} - Lớp: ${classInfo.name} - Năm học: ${classInfo.schoolYear}`],
    [`Giáo viên chủ nhiệm: ${classInfo.teacherName} - Sĩ số: ${students.length} học sinh`],
    [], // Dòng trống
  ];

  const fullSheetData = [...titleRows, headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Set column widths
  const colWidths = headers.map((h, i) => {
    if (i === 2) return { wch: 24 }; // Họ và tên
    if (i === 1) return { wch: 14 }; // Mã HS
    if (i === headers.length - 1) return { wch: 50 }; // Nhận xét
    if (i === headers.length - 2) return { wch: 25 }; // Khen thưởng
    return { wch: 12 };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Mau1_TT27_${term}`);

  const fileName = `Bang_Tong_Hop_TT27_${classInfo.name}_${term}_${classInfo.schoolYear}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Xuất file Excel chuẩn định dạng nhập vào VnEdu / SMAS
 */
export function exportVnEduTemplate(
  classInfo: ClassInfo,
  students: Student[],
  subjectAssessments: SubjectAssessment[],
  term: TermType
) {
  const subjects = PRIMARY_SUBJECTS.filter((s) => s.applicableGrades.includes(classInfo.grade));
  const headers = ['STT', 'Mã học sinh', 'Họ và tên', 'Ngày sinh'];

  subjects.forEach((s) => {
    headers.push(`${s.code}_MUC`);
    if (s.hasPeriodicTest) {
      headers.push(`${s.code}_DIEM`);
    }
  });

  const rows = students.map((st, i) => {
    const sAss = subjectAssessments.filter((a) => a.studentId === st.id && a.term === term);
    const row: (string | number)[] = [i + 1, st.studentCode, st.fullName, st.dateOfBirth];

    subjects.forEach((s) => {
      const match = sAss.find((item) => item.subjectCode === s.code);
      row.push(match?.level || 'H');
      if (s.hasPeriodicTest) {
        row.push(match?.score !== undefined ? match.score : '');
      }
    });

    return row;
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'VnEdu_Import');

  const fileName = `VnEdu_Import_${classInfo.name}_${term}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Tải file Excel mẫu danh sách học sinh để giáo viên điền nhanh
 */
export function downloadStudentTemplate() {
  const headers = [
    'STT',
    'Mã học sinh',
    'Họ và tên (*)',
    'Giới tính (Nam/Nữ)',
    'Ngày sinh (DD/MM/YYYY)',
    'Họ tên Phụ huynh',
    'SĐT Phụ huynh',
    'Ăn bán trú (Có/Không)',
    'Ghi chú sức khỏe / Năng khiếu',
  ];

  const sampleRows = [
    [1, 'HS4A1-001', 'Nguyễn Văn An', 'Nam', '15/03/2016', 'Nguyễn Văn Hùng', '0912345678', 'Có', 'Cận thị 1.5 độ (ưu tiên bàn đầu)'],
    [2, 'HS4A1-002', 'Trần Thị Mai Anh', 'Nữ', '20/05/2016', 'Trần Quốc Bảo', '0987654321', 'Có', 'Vở sạch chữ đẹp, múa hát'],
    [3, 'HS4A1-003', 'Lê Hoàng Bách', 'Nam', '10/08/2016', 'Lê Văn Tuấn', '0903123456', 'Không', ''],
  ];

  const titleRows = [
    ['MẪU DANH SÁCH HỌC SINH LỚP HỌC (GVCN PRO)'],
    ['Hướng dẫn: Điền thông tin học sinh từ dòng 4. Các cột có dấu (*) là bắt buộc.'],
    [],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...sampleRows]);
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 35 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_DanhSach_HocSinh');
  XLSX.writeFile(workbook, 'Mau_Nhap_Danh_Sach_Hoc_Sinh.xlsx');
}

/**
 * Tải file Excel mẫu phân công giáo viên toàn trường
 */
export function downloadTeacherTemplate() {
  const headers = [
    'STT',
    'Email Đăng Nhập',
    'Họ và Tên (*)',
    'Chức Vụ',
    'Tổ Chuyên Môn',
    'Vai Trò (ADMIN / TEACHER / ADMIN_TEACHER)',
    'Lớp Phụ Trách (*)',
    'Số Điện Thoại',
  ];

  const sampleRows = [
    [1, 'anhnnh4@gmail.com', 'Thầy Nguyễn Văn Nam', 'Hiệu trưởng kiêm GVCN', 'Ban Giám Hiệu', 'ADMIN_TEACHER', '4A1', '0912345678'],
    [2, 'phohieutruong@school.edu.vn', 'Cô Trần Thị B', 'Phó Hiệu trưởng', 'Ban Giám Hiệu', 'ADMIN', 'Tất cả', '0987654321'],
    [3, 'mai.nt@school.edu.vn', 'Cô Nguyễn Thị Mai', 'Giáo viên Chủ nhiệm', 'Tổ Khối 4', 'TEACHER', '4A1', '0901234567'],
    [4, 'duc.hm@school.edu.vn', 'Thầy Hoàng Minh Đức', 'Tổ trưởng Khối 5 & GVCN', 'Tổ Khối 5', 'TEACHER', '5A1', '0934567890'],
  ];

  const titleRows = [
    ['MẪU DANH SÁCH & PHÂN CÔNG GIÁO VIÊN, CÁN BỘ TOÀN TRƯỜNG'],
    ['Hướng dẫn: Vai trò nhập ADMIN (BGH), TEACHER (GVCN), hoặc ADMIN_TEACHER (BGH kiêm GVCN).'],
    [],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...sampleRows]);
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_CanBo_GiaoVien');
  XLSX.writeFile(workbook, 'Mau_Phan_Cong_Can_Bo_Giao_Vien.xlsx');
}

/**
 * Xuất danh sách giáo viên toàn trường ra file Excel
 */
export function exportTeacherList(teachers: any[]) {
  const headers = ['STT', 'Email Đăng Nhập', 'Họ và Tên', 'Chức Vụ', 'Tổ Chuyên Môn', 'Vai Trò', 'Lớp Phụ Trách', 'Số Điện Thoại', 'Trạng Thái'];

  const rows = teachers.map((t, i) => [
    i + 1,
    t.email,
    t.fullName,
    t.title || 'Cán bộ/GV',
    t.department || 'Tổ Chuyên môn',
    t.role === 'ADMIN'
      ? 'Quản Trị Viên (ADMIN)'
      : t.role === 'ADMIN_TEACHER'
      ? 'BGH kiêm GVCN (ADMIN_TEACHER)'
      : t.role === 'PENDING'
      ? 'Chờ duyệt'
      : 'Giáo Viên Chủ Nhiệm (TEACHER)',
    t.assignedClassName || 'Không chủ nhiệm',
    t.phone || '',
    t.isActive ? 'Đang hoạt động' : 'Chờ duyệt / Tạm khóa',
  ]);

  const titleRows = [
    ['DANH SÁCH CÁN BỘ, GIÁO VIÊN & PHÂN CÔNG NHÀ TRƯỜNG'],
    [`Thời gian xuất: ${new Date().toLocaleDateString('vi-VN')} - Tổng số: ${teachers.length} cán bộ giáo viên`],
    [],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...rows]);
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 24 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSach_GiaoVien');
  XLSX.writeFile(workbook, `Danh_Sach_Giao_Vien_${new Date().toISOString().split('T')[0]}.xlsx`);
}

