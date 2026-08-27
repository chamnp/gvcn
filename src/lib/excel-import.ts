import * as XLSX from 'xlsx';
import { Student, TeacherProfile, UserRole } from '@/types';

/**
 * Đọc và chuẩn hóa dữ liệu học sinh từ file Excel tải lên
 */
export async function parseStudentExcelFile(file: File): Promise<Partial<Student>[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length === 0) return [];

  // Tìm hàng chứa tiêu đề cột (STT, Họ và tên, Ngày sinh, v.v.)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
    if (rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('name') || rowStr.includes('stt')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = (rawRows[headerRowIndex] || []).map((h) => String(h || '').trim().toLowerCase());
  
  // Xác định vị trí các cột
  const nameIndex = headers.findIndex((h) => h.includes('họ và tên') || h.includes('họ tên') || h.includes('fullname') || h.includes('tên'));
  const codeIndex = headers.findIndex((h) => h.includes('mã') || h.includes('code') || h.includes('sbd'));
  const dobIndex = headers.findIndex((h) => h.includes('ngày sinh') || h.includes('dob') || h.includes('sinh'));
  const genderIndex = headers.findIndex((h) => h.includes('giới tính') || h.includes('gender') || h.includes('nam/nữ'));
  const parentNameIndex = headers.findIndex((h) => h.includes('phụ huynh') || h.includes('cha mẹ') || h.includes('parent'));
  const phoneIndex = headers.findIndex((h) => h.includes('sđt') || h.includes('điện thoại') || h.includes('phone') || h.includes('liên hệ'));
  const boardingIndex = headers.findIndex((h) => h.includes('bán trú') || h.includes('boarding') || h.includes('ăn'));
  const healthIndex = headers.findIndex((h) => h.includes('sức khỏe') || h.includes('health') || h.includes('ghi chú'));

  const results: Partial<Student>[] = [];

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const fullName = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';
    if (!fullName || fullName.length < 2) continue;

    const studentCode = codeIndex !== -1 && row[codeIndex] ? String(row[codeIndex]).trim() : `HS${String(results.length + 1).padStart(3, '0')}`;
    
    let dateOfBirth = '2016-01-01';
    if (dobIndex !== -1 && row[dobIndex]) {
      const val = row[dobIndex];
      if (typeof val === 'number') {
        // Excel serial date format
        const dateObj = XLSX.SSF.parse_date_code(val);
        dateOfBirth = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
      } else {
        const parts = String(val).split(/[/.-]/);
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            dateOfBirth = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else if (parts[0].length === 4) {
            dateOfBirth = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        }
      }
    }

    let gender: 'Nam' | 'Nữ' = 'Nam';
    if (genderIndex !== -1 && row[genderIndex]) {
      const gStr = String(row[genderIndex]).toLowerCase();
      if (gStr.includes('nữ') || gStr.includes('nu') || gStr.includes('female') || gStr === 'f' || gStr === 'x') {
        gender = 'Nữ';
      }
    }

    const parentName = parentNameIndex !== -1 ? String(row[parentNameIndex] || '').trim() : '';
    const parentPhone = phoneIndex !== -1 ? String(row[phoneIndex] || '').trim() : '';
    
    let isBoarding = true;
    if (boardingIndex !== -1 && row[boardingIndex] !== undefined) {
      const bStr = String(row[boardingIndex]).toLowerCase().trim();
      if (bStr === 'không' || bStr === 'ko' || bStr === 'k' || bStr === 'false' || bStr === '0') {
        isBoarding = false;
      }
    }

    const healthNotes = healthIndex !== -1 ? String(row[healthIndex] || '').trim() : '';

    results.push({
      studentCode,
      fullName,
      gender,
      dateOfBirth,
      parentName,
      parentPhone,
      isBoarding,
      healthNotes,
      seatRow: 0,
      seatCol: 0,
    });
  }

  return results;
}

/**
 * Đọc danh sách phân công giáo viên từ file Excel tải lên
 */
export async function parseTeacherExcelFile(file: File): Promise<TeacherProfile[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length === 0) return [];

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
    if (rowStr.includes('email') || rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('vai trò')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = (rawRows[headerRowIndex] || []).map((h) => String(h || '').trim().toLowerCase());

  const emailIndex = headers.findIndex((h) => h.includes('email') || h.includes('thư'));
  const nameIndex = headers.findIndex((h) => h.includes('họ và tên') || h.includes('họ tên') || h.includes('giáo viên') || h.includes('tên'));
  const roleIndex = headers.findIndex((h) => h.includes('vai trò') || h.includes('role') || h.includes('chức vụ'));
  const classIndex = headers.findIndex((h) => h.includes('lớp') || h.includes('class') || h.includes('phân công'));

  const results: TeacherProfile[] = [];

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const email = emailIndex !== -1 ? String(row[emailIndex] || '').trim().toLowerCase() : '';
    const fullName = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';

    if (!email || !email.includes('@')) continue;

    let role: UserRole = 'TEACHER';
    if (roleIndex !== -1 && row[roleIndex]) {
      const rStr = String(row[roleIndex]).toLowerCase();
      if (rStr.includes('admin') || rStr.includes('quản trị') || rStr.includes('hiệu trưởng') || rStr.includes('bgh')) {
        role = 'ADMIN';
      }
    }

    const assignedClassName = classIndex !== -1 ? String(row[classIndex] || '').trim() : 'Lớp 1A1';

    results.push({
      id: `t-${Date.now()}-${results.length}`,
      email,
      fullName: fullName || email.split('@')[0],
      role,
      assignedClassName: assignedClassName.startsWith('Lớp') ? assignedClassName : `Lớp ${assignedClassName}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}
