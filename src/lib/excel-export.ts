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
